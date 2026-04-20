"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "../actions"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Announcement = {
  id: string
  title: string
  body: string
  link_url: string
  priority: number
  published: boolean
  created_at: string
  title_en: string
  body_en: string
  title_ko: string
  body_ko: string
}

function AnnouncementForm({
  announcement,
  onClose,
}: {
  announcement?: Announcement
  onClose: () => void
}) {
  const isEdit = !!announcement

  async function handleSubmit(formData: FormData) {
    formData.set(
      "published",
      formData.get("published") ? "true" : "false"
    )
    if (isEdit) {
      await updateAnnouncement(announcement.id, formData)
    } else {
      await createAnnouncement(formData)
    }
    onClose()
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">タイトル</label>
        <Input name="title" defaultValue={announcement?.title ?? ""} required />
      </div>
      <div>
        <label className="text-sm font-medium">本文</label>
        <textarea
          name="body"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={announcement?.body ?? ""}
        />
      </div>

      <details className="border rounded-md p-3 space-y-3">
        <summary className="text-sm font-medium cursor-pointer">🌐 英語 / English</summary>
        <div>
          <label className="text-sm font-medium">Title (EN)</label>
          <Input name="title_en" defaultValue={announcement?.title_en ?? ""} />
        </div>
        <div>
          <label className="text-sm font-medium">Body (EN)</label>
          <textarea
            name="body_en"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={announcement?.body_en ?? ""}
          />
        </div>
      </details>

      <details className="border rounded-md p-3 space-y-3">
        <summary className="text-sm font-medium cursor-pointer">🌐 韓国語 / 한국어</summary>
        <div>
          <label className="text-sm font-medium">Title (KO)</label>
          <Input name="title_ko" defaultValue={announcement?.title_ko ?? ""} />
        </div>
        <div>
          <label className="text-sm font-medium">Body (KO)</label>
          <textarea
            name="body_ko"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={announcement?.body_ko ?? ""}
          />
        </div>
      </details>

      <div>
        <label className="text-sm font-medium">リンクURL</label>
        <Input name="link_url" defaultValue={announcement?.link_url ?? ""} />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">優先度</label>
          <Input
            name="priority"
            type="number"
            defaultValue={announcement?.priority ?? 0}
          />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            name="published"
            id="published"
            defaultChecked={announcement?.published ?? true}
            className="size-4"
          />
          <label htmlFor="published" className="text-sm font-medium">
            公開
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit">{isEdit ? "更新" : "作成"}</Button>
      </div>
    </form>
  )
}

export function AnnouncementsList({
  announcements,
}: {
  announcements: Announcement[]
}) {
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("このお知らせを削除しますか？")) return
    await deleteAnnouncement(id)
  }

  return (
    <div className="space-y-4">
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="mr-1 size-4" />
          新規作成
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>お知らせを作成</DialogTitle>
          </DialogHeader>
          <AnnouncementForm onClose={() => setOpenCreate(false)} />
        </DialogContent>
      </Dialog>

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">お知らせはありません</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {a.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={a.published ? "default" : "secondary"}>
                    {a.published ? "公開中" : "非公開"}
                  </Badge>
                  {a.priority > 0 && (
                    <Badge variant="outline">優先度: {a.priority}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {a.body && (
                  <p className="mb-2 text-sm text-muted-foreground">{a.body}</p>
                )}
                {a.link_url && (
                  <p className="mb-2 text-xs text-blue-600 underline">
                    {a.link_url}
                  </p>
                )}
                {a.published && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    公開URL:{' '}
                    <a
                      href={`/ja/info/${a.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      /ja/info/{a.id}
                    </a>
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("ja-JP")}
                  </span>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingId === a.id}
                      onOpenChange={(open) => setEditingId(open ? a.id : null)}
                    >
                      <DialogTrigger render={<Button variant="outline" size="sm" />}>
                        <Pencil className="mr-1 size-3" />
                        編集
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>お知らせを編集</DialogTitle>
                        </DialogHeader>
                        <AnnouncementForm
                          announcement={a}
                          onClose={() => setEditingId(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="mr-1 size-3" />
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
