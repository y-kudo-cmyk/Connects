import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminHeader } from "../components/admin-header"
import { VenuePreviewClient } from "./venue-preview-client"

export default async function VenuePreviewPage() {
  // 管理者ロールチェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (me?.role !== "admin") redirect("/")

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">会場レイアウト プレビュー</h2>
          <p className="text-xs text-muted-foreground mt-1">
            全会場レイアウトを一覧表示。タップすると detectSection の動作確認ができます。
          </p>
        </div>
        <VenuePreviewClient />
      </div>
    </>
  )
}
