import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../components/admin-header"
import { ArtistsList } from "./artists-list"

export default async function ArtistsPage() {
  const supabase = await createClient()

  const { data: artists } = await supabase
    .from("artists")
    .select("id, name, name_ja, name_en, name_ko, level, group_id, color, sort_order, birthday, image_url")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 className="text-lg font-semibold">アーティスト管理</h2>
        <ArtistsList artists={artists ?? []} />
      </div>
    </>
  )
}
