import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../components/admin-header"
import { PostsTable } from "./posts-table"

export default async function PostsPage() {
  const supabase = await createClient()

  const [{ data: events }, { data: tags }] = await Promise.all([
    supabase
      .from("events")
      .select("id, event_title, sub_event_title, tag, start_date, end_date, spot_name, spot_address, image_url, notes, status, verified_count, submitted_by, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
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
