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
  // ユーザー本体 + 投稿数/承認数をリアルタイム集計 (post_count / approval_total 列は廃止)
  const [
    { data: users },
    { data: events },
    { data: spots },
    { data: photos },
    { data: evVotes },
    { data: phVotes },
  ] = await Promise.all([
    sb.from("profiles").select("id, nickname, mail, role, is_verified, created_at").order("created_at", { ascending: false }).limit(500),
    sb.from("events").select("submitted_by").not("submitted_by", "is", null).neq("status", "deleted"),
    sb.from("spots").select("submitted_by").not("submitted_by", "is", null).neq("status", "deleted"),
    sb.from("spot_photos").select("submitted_by").not("submitted_by", "is", null).neq("status", "deleted"),
    sb.from("event_votes").select("user_id"),
    sb.from("spot_photo_votes").select("user_id"),
  ])

  // 投稿カウント
  const postCount = new Map<string, number>()
  for (const r of events ?? []) postCount.set(r.submitted_by!, (postCount.get(r.submitted_by!) || 0) + 1)
  for (const r of spots ?? []) postCount.set(r.submitted_by!, (postCount.get(r.submitted_by!) || 0) + 1)
  for (const r of photos ?? []) postCount.set(r.submitted_by!, (postCount.get(r.submitted_by!) || 0) + 1)

  // 承認 (vote) カウント
  const approvalCount = new Map<string, number>()
  for (const r of evVotes ?? []) approvalCount.set(r.user_id, (approvalCount.get(r.user_id) || 0) + 1)
  for (const r of phVotes ?? []) approvalCount.set(r.user_id, (approvalCount.get(r.user_id) || 0) + 1)

  const enriched = (users ?? []).map(u => ({
    ...u,
    post_count: postCount.get(u.id) || 0,
    approval_total: approvalCount.get(u.id) || 0,
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
