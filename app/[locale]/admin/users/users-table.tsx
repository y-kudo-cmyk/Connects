"use client"

import { useState, useMemo } from "react"
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
  last_active_at?: string | null
}

type SortKey = 'membership_number' | 'nickname' | 'role' | 'post_count' | 'approval_total' | 'is_verified' | 'join_date' | 'last_active_at' | null

export function UsersTable({ users }: { users: User[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('membership_number')
  const [asc, setAsc] = useState(true)

  async function handleRoleChange(userId: string, role: "user" | "fam" | "admin" | "banned") {
    if (role === "admin" && !confirm("このユーザーをadminに昇格しますか？")) return
    if (role === "fam" && !confirm("このユーザーを FAM に設定しますか？（拡張表示アクセス許可）")) return
    if (role === "banned" && !confirm("このユーザーをBANしますか？")) return
    await updateUserRole(userId, role)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc(!asc)
    else { setSortKey(key); setAsc(true) }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return users
    const copy = [...users]
    copy.sort((a, b) => {
      const va = getVal(a, sortKey)
      const vb = getVal(b, sortKey)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va
      const sa = String(va), sb = String(vb)
      return asc ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
    return copy
  }, [users, sortKey, asc])

  const arrow = (key: SortKey) => sortKey === key ? (asc ? ' ▲' : ' ▼') : ''

  return (
    <div className="rounded-md border">
      <div className="px-3 py-2 text-sm font-bold border-b" style={{ background: '#F8F9FA' }}>
        全 {users.length} 人
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => toggleSort('membership_number')} className="cursor-pointer select-none">会員番号{arrow('membership_number')}</TableHead>
            <TableHead onClick={() => toggleSort('nickname')} className="cursor-pointer select-none">ニックネーム{arrow('nickname')}</TableHead>
            <TableHead>メール</TableHead>
            <TableHead onClick={() => toggleSort('role')} className="cursor-pointer select-none">ロール{arrow('role')}</TableHead>
            <TableHead onClick={() => toggleSort('post_count')} className="cursor-pointer select-none">投稿数{arrow('post_count')}</TableHead>
            <TableHead onClick={() => toggleSort('approval_total')} className="cursor-pointer select-none">承認数{arrow('approval_total')}</TableHead>
            <TableHead onClick={() => toggleSort('is_verified')} className="cursor-pointer select-none">認証{arrow('is_verified')}</TableHead>
            <TableHead onClick={() => toggleSort('join_date')} className="cursor-pointer select-none">登録日{arrow('join_date')}</TableHead>
            <TableHead onClick={() => toggleSort('last_active_at')} className="cursor-pointer select-none">最終アクセス{arrow('last_active_at')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                ユーザーはいません
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-xs font-mono">{user.membership_number || "—"}</TableCell>
                <TableCell className="font-medium">{user.nickname || "—"}</TableCell>
                <TableCell className="text-sm">{user.mail || "—"}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(v) =>
                      handleRoleChange(user.id, v as "user" | "fam" | "admin" | "banned")
                    }
                  >
                    <SelectTrigger className="border-0 p-0 h-auto w-auto bg-transparent shadow-none focus:ring-0 [&>svg]:hidden cursor-pointer">
                      <Badge
                        variant={user.role === "admin" ? "default" : user.role === "banned" ? "destructive" : user.role === "fam" ? "outline" : "secondary"}
                        className="hover:opacity-80"
                      >
                        {user.role}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="fam">fam</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="banned">banned</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{user.post_count}</TableCell>
                <TableCell>{user.approval_total}</TableCell>
                <TableCell>
                  {user.is_verified ? <Badge variant="default">済</Badge> : <Badge variant="outline">未</Badge>}
                </TableCell>
                <TableCell className="text-xs">
                  {user.glide_join_date
                    ? new Date(user.glide_join_date).toLocaleDateString("ja-JP")
                    : new Date(user.created_at).toLocaleDateString("ja-JP")}
                </TableCell>
                <TableCell className="text-xs">
                  {user.last_active_at ? formatRelative(user.last_active_at) : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function getVal(u: User, key: SortKey): string | number | null | undefined {
  if (key === 'join_date') return u.glide_join_date || u.created_at
  if (key === 'is_verified') return u.is_verified ? 1 : 0
  if (key === 'membership_number') return u.membership_number || ''
  return (u as Record<string, unknown>)[key as string] as string | number | null
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime()
  const now = Date.now()
  const diff = now - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'たった今'
  if (min < 60) return `${min}分前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}時間前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}日前`
  return new Date(iso).toLocaleDateString('ja-JP')
}
