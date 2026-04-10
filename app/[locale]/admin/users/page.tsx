import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../components/admin-header"
import { UsersTable } from "./users-table"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("profiles")
    .select("id, nickname, mail, role, post_count, approval_total, is_verified, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

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
