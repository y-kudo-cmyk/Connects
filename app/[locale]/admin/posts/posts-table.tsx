"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateEventStatus, updateEvent, deleteEvent } from "../actions"
import { Pencil } from "lucide-react"

type Event = {
  id: string
  event_title: string
  sub_event_title: string
  tag: string
  start_date: string | null
  end_date: string | null
  spot_name: string
  spot_address: string
  image_url: string
  notes: string
  status: string
  verified_count: number
  submitted_by: string | null
  created_at: string
  updated_at: string
}

type Tag = {
  id: string
  label: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case "confirmed":
      return "default" as const
    case "pending":
      return "secondary" as const
    case "rejected":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

const statusLabel: Record<string, string> = {
  pending: "承認待ち",
  confirmed: "承認済み",
  rejected: "却下",
}

function EventEditForm({
  event,
  tags,
  onClose,
}: {
  event: Event
  tags: Tag[]
  onClose: () => void
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await updateEvent(event.id, {
      event_title: fd.get("event_title") as string,
      sub_event_title: fd.get("sub_event_title") as string,
      tag: fd.get("tag") as string,
      start_date: (fd.get("start_date") as string) || null,
      end_date: (fd.get("end_date") as string) || null,
      spot_name: fd.get("spot_name") as string,
      spot_address: fd.get("spot_address") as string,
      image_url: fd.get("image_url") as string,
      notes: fd.get("notes") as string,
    })
    onClose()
  }

  // ISO → datetime-local 形式に変換
  function toDatetimeLocal(iso: string | null) {
    if (!iso) return ""
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">タイトル</label>
        <Input name="event_title" defaultValue={event.event_title} required />
      </div>
      <div>
        <label className="text-sm font-medium">サブタイトル</label>
        <Input name="sub_event_title" defaultValue={event.sub_event_title} />
      </div>
      <div>
        <label className="text-sm font-medium">タグ</label>
        <select
          name="tag"
          defaultValue={event.tag}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">開始日時</label>
          <Input
            name="start_date"
            type="datetime-local"
            defaultValue={toDatetimeLocal(event.start_date)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">終了日時</label>
          <Input
            name="end_date"
            type="datetime-local"
            defaultValue={toDatetimeLocal(event.end_date)}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">会場名</label>
        <Input name="spot_name" defaultValue={event.spot_name} />
      </div>
      <div>
        <label className="text-sm font-medium">住所</label>
        <Input name="spot_address" defaultValue={event.spot_address} />
      </div>
      <div>
        <label className="text-sm font-medium">画像URL</label>
        <Input name="image_url" defaultValue={event.image_url} />
      </div>
      <div>
        <label className="text-sm font-medium">備考</label>
        <textarea
          name="notes"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={event.notes}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  )
}

export function PostsTable({ events, tags }: { events: Event[]; tags: Tag[] }) {
  const [filter, setFilter] = useState<string>("all")
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered =
    filter === "all" ? events : events.filter((e) => e.status === filter)

  async function handleStatusChange(
    eventId: string,
    status: "pending" | "confirmed" | "rejected"
  ) {
    await updateEventStatus(eventId, status)
  }

  async function handleDelete(eventId: string) {
    if (!confirm("この投稿を削除しますか？")) return
    await deleteEvent(eventId)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["all", "pending", "confirmed", "rejected"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "すべて" : statusLabel[s]}
            {s !== "all" && (
              <Badge variant="secondary" className="ml-1.5">
                {events.filter((e) => e.status === s).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>タグ</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>承認数</TableHead>
              <TableHead>投稿者</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  該当する投稿はありません
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {event.event_title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.tag}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(event.status)}>
                      {statusLabel[event.status] ?? event.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.verified_count}/3</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {event.submitted_by ? "ユーザー" : "運営"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(event.created_at).toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Dialog
                        open={editingId === event.id}
                        onOpenChange={(open) =>
                          setEditingId(open ? event.id : null)
                        }
                      >
                        <DialogTrigger render={<Button variant="outline" size="sm" />}>
                          <Pencil className="mr-1 size-3" />
                          編集
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>投稿を編集</DialogTitle>
                          </DialogHeader>
                          <EventEditForm
                            event={event}
                            tags={tags}
                            onClose={() => setEditingId(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Select
                        defaultValue={event.status}
                        onValueChange={(v) =>
                          handleStatusChange(
                            event.id,
                            v as "pending" | "confirmed" | "rejected"
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">承認待ち</SelectItem>
                          <SelectItem value="confirmed">承認済み</SelectItem>
                          <SelectItem value="rejected">却下</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
