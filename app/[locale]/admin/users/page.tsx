import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { AdminHeader } from "../components/admin-header"
import { UsersTable } from "./users-table"

export const dynamic = 'force-dynamic'  // 毎リクエストで集計 (キャッシュ無効)

export default async function UsersPage() {
  // 管理者ロールチェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (me?.role !== "admin") redirect("/")

  // RLS 回避のため service role で profiles 全件取得
  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  // 全件ページング取得 (Supabase の 1000件 cap 回避)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function fetchAll(buildQuery: () => any): Promise<any[]> {
    const out: unknown[] = []
    let from = 0
    const PAGE = 1000
    while (true) {
      const { data, error } = await buildQuery().range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      out.push(...data)
      if (data.length < PAGE) break
      from += PAGE
    }
    return out
  }

  // ユーザー本体 + 投稿数/承認数をリアルタイム集計 (post_count / approval_total 列は廃止)
  const [
    { data: users },
    events,
    spots,
    photos,
    urlSubs,
    evVotes,
    phVotes,
    editReqs,
    editActivities,
    glideUsers,
    activities,
    { data: authList },
  ] = await Promise.all([
    sb.from("profiles").select("id, nickname, mail, role, is_verified, created_at, membership_number, ref_code, introduced_by").order("membership_number", { ascending: true, nullsFirst: false }).range(0, 4999),
    fetchAll(() => sb.from("events").select("submitted_by").not("submitted_by", "is", null)),
    fetchAll(() => sb.from("spots").select("submitted_by").not("submitted_by", "is", null)),
    fetchAll(() => sb.from("spot_photos").select("submitted_by").not("submitted_by", "is", null)),
    fetchAll(() => sb.from("url_submissions").select("submitted_by").not("submitted_by", "is", null)),
    fetchAll(() => sb.from("event_votes").select("user_id")),
    fetchAll(() => sb.from("spot_photo_votes").select("user_id")),
    fetchAll(() => sb.from("edit_requests").select("submitted_by").not("submitted_by", "is", null)),
    fetchAll(() => sb.from("user_activity").select("user_id").eq("action", "edit")),
    fetchAll(() => sb.from("glide_users").select("mail, membership_number, join_date")),
    fetchAll(() => sb.from("user_activity").select("user_id, created_at").order("created_at", { ascending: false })),
    sb.auth.admin.listUsers({ perPage: 2000 }).then(r => ({ data: r.data?.users || [] })),
  ])

  // 投稿カウント (events + spots + spot_photos + url_submissions)
  const postCount = new Map<string, number>()
  for (const r of events ?? []) postCount.set(r.submitted_by!, (postCount.get(r.submitted_by!) || 0) + 1)
  for (const r of spots ?? []) postCount.set(r.submitted_by!, (postCount.get(r.submitted_by!) || 0) + 1)
  for (const r of photos ?? []) postCount.set(r.submitted_by!, (postCount.get(r.submitted_by!) || 0) + 1)
  for (const r of urlSubs ?? []) postCount.set(r.submitted_by!, (postCount.get(r.submitted_by!) || 0) + 1)

  // 承認 (vote) カウント
  const approvalCount = new Map<string, number>()
  for (const r of evVotes ?? []) approvalCount.set(r.user_id, (approvalCount.get(r.user_id) || 0) + 1)
  for (const r of phVotes ?? []) approvalCount.set(r.user_id, (approvalCount.get(r.user_id) || 0) + 1)

  // 編集カウント (edit_requests + user_activity action=edit)
  const editCount = new Map<string, number>()
  for (const r of editReqs ?? []) editCount.set(r.submitted_by!, (editCount.get(r.submitted_by!) || 0) + 1)
  for (const r of editActivities ?? []) editCount.set(r.user_id, (editCount.get(r.user_id) || 0) + 1)

  // 紹介カウント: ref_code を持つユーザーの紹介で登録した人数
  const referralCount = new Map<string, number>()
  // ref_code -> id マップ
  const codeToUserId = new Map<string, string>()
  for (const u of users ?? []) {
    if (u.ref_code) codeToUserId.set(u.ref_code, u.id)
  }
  for (const u of users ?? []) {
    // u.introduced_by は他人の ref_code 文字列
    const introducedBy = (u as { introduced_by?: string }).introduced_by
    if (introducedBy && codeToUserId.has(introducedBy)) {
      const refUserId = codeToUserId.get(introducedBy)!
      referralCount.set(refUserId, (referralCount.get(refUserId) || 0) + 1)
    }
  }

  // Glide 登録日マップ (membership_number または mail でマッチ)
  const glideJoinByMember = new Map<string, string>()
  const glideJoinByMail = new Map<string, string>()
  for (const g of glideUsers ?? []) {
    if (g.join_date) {
      if (g.membership_number) glideJoinByMember.set(g.membership_number, g.join_date)
      if (g.mail) glideJoinByMail.set(g.mail.toLowerCase().trim(), g.join_date)
    }
  }

  // 最終アクセス: user_activity の最新, fallback に auth.users.last_sign_in_at
  const lastActivity = new Map<string, string>()
  for (const a of activities ?? []) {
    if (!lastActivity.has(a.user_id)) lastActivity.set(a.user_id, a.created_at)
  }
  const lastSignIn = new Map<string, string>()
  for (const u of authList ?? []) {
    if (u.last_sign_in_at) lastSignIn.set(u.id, u.last_sign_in_at)
  }

  const enriched = (users ?? []).map(u => ({
    ...u,
    post_count: postCount.get(u.id) || 0,
    approval_total: approvalCount.get(u.id) || 0,
    edit_count: editCount.get(u.id) || 0,
    referral_count: referralCount.get(u.id) || 0,
    glide_join_date: (u.membership_number && glideJoinByMember.get(u.membership_number))
      || (u.mail && glideJoinByMail.get(u.mail.toLowerCase().trim()))
      || null,
    last_active_at: lastActivity.get(u.id) || lastSignIn.get(u.id) || null,
  }))

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 className="text-lg font-semibold">ユーザー管理</h2>
        <UsersTable users={enriched} />
      </div>
    </>
  )
}
