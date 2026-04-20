import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { AdminHeader } from "../components/admin-header"
import { UsersTable } from "./users-table"

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
  const { data: users } = await sb
    .from("profiles")
    .select("id, nickname, mail, role, post_count, approval_total, is_verified, created_at")
    .order("created_at", { ascending: false })
    .limit(500)

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 className="text-lg font-semibold">ユーザー管理</h2>
        <UsersTable users={users ?? []} />
      </div>
    </>
  )
}
