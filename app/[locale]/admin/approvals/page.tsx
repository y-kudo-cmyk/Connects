import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../components/admin-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ApprovalsPage() {
  const supabase = await createClient()

  // 投票履歴（直近50件）
  const { data: votes } = await supabase
    .from("event_votes")
    .select(`
      id,
      vote,
      created_at,
      events ( id, event_title, status ),
      profiles ( nickname, mail )
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  // 承認閾値（現在ハードコード: 3）
  const threshold = 3

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h2 className="text-lg font-semibold">承認設定</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">承認閾値</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              現在の承認閾値: <span className="font-bold text-foreground">{threshold}人</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ※ 現在コードにハードコードされています。DB/環境変数への移行は今後対応予定です。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">投票履歴（直近50件）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>イベント</TableHead>
                    <TableHead>投票者</TableHead>
                    <TableHead>投票</TableHead>
                    <TableHead>イベント状態</TableHead>
                    <TableHead>日時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!votes || votes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        投票履歴はありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    votes.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {v.events?.event_title ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {v.profiles?.nickname || "(未設定)"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={v.vote === "approve" ? "default" : "destructive"}
                          >
                            {v.vote === "approve" ? "承認" : "却下"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {v.events?.status ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(v.created_at).toLocaleString("ja-JP")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
