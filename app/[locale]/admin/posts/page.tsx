import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { AdminHeader } from "../components/admin-header"
import { PostsTable } from "./posts-table"

export default async function PostsPage() {
  // 管理者ロールチェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (me?.role !== "admin") redirect("/")

  // RLS 回避のため service role で全件取得（削除済みは除外）
  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const [{ data: events }, { data: tags }] = await Promise.all([
    sb
      .from("events")
      .select("id, event_title, sub_event_title, tag, start_date, end_date, spot_name, spot_address, image_url, notes, status, verified_count, submitted_by, created_at, updated_at")
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(500),
    sb
      .from("schedule_tags")
      .select("id, label")
      .order("sort_order", { ascending: true }),
  ])

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">投稿管理</h2>
        </div>
        <PostsTable events={events ?? []} tags={tags ?? []} />
      </div>
    </>
  )
}
