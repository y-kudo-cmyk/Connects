"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRole } from "../actions"

type User = {
  id: string
  nickname: string
  mail: string
  role: string
  membership_number?: string | null
  post_count: number
  approval_total: number
  is_verified: boolean
  created_at: string
  glide_join_date?: string | null
}

export function UsersTable({ users }: { users: User[] }) {
  async function handleRoleChange(userId: string, role: "user" | "fam" | "admin" | "banned") {
    if (role === "admin" && !confirm("このユーザーをadminに昇格しますか？")) return
    if (role === "fam" && !confirm("このユーザーを FAM に設定しますか？（拡張表示アクセス許可）")) return
    if (role === "banned" && !confirm("このユーザーをBANしますか？")) return
    await updateUserRole(userId, role)
  }

  return (
    <div className="rounded-md border">
      <div className="px-3 py-2 text-sm font-bold border-b" style={{ background: '#F8F9FA' }}>
        全 {users.length} 人
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>会員番号</TableHead>
            <TableHead>ニックネーム</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>投稿数</TableHead>
            <TableHead>承認数</TableHead>
            <TableHead>認証済み</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                ユーザーはいません
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-xs font-mono">
                  {user.membership_number || "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {user.nickname || "—"}
                </TableCell>
                <TableCell className="text-sm">{user.mail || "—"}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : user.role === "banned" ? "destructive" : user.role === "fam" ? "outline" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.post_count}</TableCell>
                <TableCell>{user.approval_total}</TableCell>
                <TableCell>
                  {user.is_verified ? (
                    <Badge variant="default">済</Badge>
                  ) : (
                    <Badge variant="outline">未</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {/* Glide登録日があれば優先表示 (古参ユーザーがいつから利用してるかが分かる) */}
                  {user.glide_join_date
                    ? new Date(user.glide_join_date).toLocaleDateString("ja-JP")
                    : new Date(user.created_at).toLocaleDateString("ja-JP")}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(v) =>
                      handleRoleChange(user.id, v as "user" | "fam" | "admin" | "banned")
                    }
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="fam">fam</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="banned">banned</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
