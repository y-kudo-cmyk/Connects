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
  // SQL RPC で集計 (DB 側で完結 → 1000件cap 影響なし、高速)
  const [
    { data: users },
    { data: stats },
    glideRes,
    { data: authList },
  ] = await Promise.all([
    sb.from("profiles").select("id, nickname, mail, role, is_verified, created_at, membership_number, ref_code, introduced_by").order("membership_number", { ascending: true, nullsFirst: false }).range(0, 4999),
    sb.rpc("user_stats"),
    sb.from("glide_users").select("mail, membership_number, join_date").range(0, 4999),
    sb.auth.admin.listUsers({ perPage: 2000 }).then(r => ({ data: r.data?.users || [] })),
  ])
  const glideUsers = glideRes.data

  // 集計マップ化
  const postCount = new Map<string, number>()
  const approvalCount = new Map<string, number>()
  const editCount = new Map<string, number>()
  const lastActivity = new Map<string, string>()
  type StatsRow = { user_id: string; post_count: number; approval_count: number; edit_count: number; last_active_at: string | null }
  for (const r of (stats ?? []) as StatsRow[]) {
    postCount.set(r.user_id, Number(r.post_count) || 0)
    approvalCount.set(r.user_id, Number(r.approval_count) || 0)
    editCount.set(r.user_id, Number(r.edit_count) || 0)
    if (r.last_active_at) lastActivity.set(r.user_id, r.last_active_at)
  }

  // 紹介カウント: ref_code を持つユーザーの紹介で登録した人数
  const referralCount = new Map<string, number>()
  const codeToUserId = new Map<string, string>()
  for (const u of users ?? []) {
    if (u.ref_code) codeToUserId.set(u.ref_code, u.id)
  }
  for (const u of users ?? []) {
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

  // 最終アクセス: RPC からの user_activity 最新, fallback に auth.users.last_sign_in_at
  // (lastActivity は上で RPC から取得済)
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
