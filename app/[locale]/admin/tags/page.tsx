import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../components/admin-header"
import { TagsList } from "./tags-list"

export default async function TagsPage() {
  const supabase = await createClient()

  const { data: tags } = await supabase
    .from("schedule_tags")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 className="text-lg font-semibold">タグ管理</h2>
        <TagsList tags={tags ?? []} />
      </div>
    </>
  )
}
