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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateTag, createTag } from "../actions"
import { Plus, Pencil } from "lucide-react"

type Tag = {
  id: string
  label: string
  icon: string
  color: string
  bg: string
  sort_order: number
}

function TagForm({
  tag,
  onClose,
}: {
  tag?: Tag
  onClose: () => void
}) {
  const isEdit = !!tag

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      id: fd.get("id") as string,
      label: fd.get("label") as string,
      icon: fd.get("icon") as string,
      color: fd.get("color") as string,
      bg: fd.get("bg") as string,
      sort_order: Number(fd.get("sort_order")) || 0,
    }

    if (isEdit) {
      const { id: _, ...rest } = data
      await updateTag(tag.id, rest)
    } else {
      await createTag(data)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">ID</label>
        <Input
          name="id"
          defaultValue={tag?.id ?? ""}
          required
          disabled={isEdit}
          className={isEdit ? "opacity-50" : ""}
        />
      </div>
      <div>
        <label className="text-sm font-medium">ラベル</label>
        <Input name="label" defaultValue={tag?.label ?? ""} required />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">アイコン</label>
          <Input name="icon" defaultValue={tag?.icon ?? ""} required />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">並び順</label>
          <Input
            name="sort_order"
            type="number"
            defaultValue={tag?.sort_order ?? 0}
          />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">文字色</label>
          <div className="flex items-center gap-2">
            <Input name="color" defaultValue={tag?.color ?? "#000000"} />
            <div
              className="size-8 shrink-0 rounded border"
              style={{ backgroundColor: tag?.color }}
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">背景色</label>
          <div className="flex items-center gap-2">
            <Input name="bg" defaultValue={tag?.bg ?? "#FFFFFF"} />
            <div
              className="size-8 shrink-0 rounded border"
              style={{ backgroundColor: tag?.bg }}
            />
          </div>
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

export function TagsList({ tags }: { tags: Tag[] }) {
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="mr-1 size-4" />
          新規追加
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを追加</DialogTitle>
          </DialogHeader>
          <TagForm onClose={() => setOpenCreate(false)} />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>並び順</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>アイコン</TableHead>
              <TableHead>ラベル</TableHead>
              <TableHead>文字色</TableHead>
              <TableHead>背景色</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  タグはありません
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.sort_order}</TableCell>
                  <TableCell className="font-mono text-sm">{tag.id}</TableCell>
                  <TableCell className="text-lg">{tag.icon}</TableCell>
                  <TableCell>
                    <span
                      className="rounded px-2 py-0.5 text-sm font-medium"
                      style={{ color: tag.color, backgroundColor: tag.bg }}
                    >
                      {tag.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div
                        className="size-4 rounded border"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-mono text-xs">{tag.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div
                        className="size-4 rounded border"
                        style={{ backgroundColor: tag.bg }}
                      />
                      <span className="font-mono text-xs">{tag.bg}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={editingId === tag.id}
                      onOpenChange={(open) =>
                        setEditingId(open ? tag.id : null)
                      }
                    >
                      <DialogTrigger render={<Button variant="outline" size="sm" />}>
                        <Pencil className="mr-1 size-3" />
                        編集
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>タグを編集</DialogTitle>
                        </DialogHeader>
                        <TagForm
                          tag={tag}
                          onClose={() => setEditingId(null)}
                        />
                      </DialogContent>
                    </Dialog>
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
