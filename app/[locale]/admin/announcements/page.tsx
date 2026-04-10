import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../components/admin-header"
import { AnnouncementsList } from "./announcements-list"

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 className="text-lg font-semibold">お知らせ管理</h2>
        <AnnouncementsList announcements={announcements ?? []} />
      </div>
    </>
  )
}
