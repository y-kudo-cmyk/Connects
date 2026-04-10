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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateArtist } from "../actions"
import { Pencil } from "lucide-react"

type Artist = {
  id: string
  name: string
  name_ja: string
  name_en: string
  name_ko: string
  level: string
  group_id: string | null
  color: string
  sort_order: number
  birthday: string | null
  image_url: string
}

const levelLabel: Record<string, string> = {
  GROUP: "グループ",
  MEMBER: "メンバー",
  UNIT: "ユニット",
}

function ArtistForm({
  artist,
  onClose,
}: {
  artist: Artist
  onClose: () => void
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await updateArtist(artist.id, {
      name: fd.get("name") as string,
      name_ja: fd.get("name_ja") as string,
      name_en: fd.get("name_en") as string,
      name_ko: fd.get("name_ko") as string,
      level: fd.get("level") as string,
      group_id: (fd.get("group_id") as string) || null,
      color: fd.get("color") as string,
      sort_order: Number(fd.get("sort_order")) || 0,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">ID</label>
        <Input value={artist.id} disabled className="opacity-50" />
      </div>
      <div>
        <label className="text-sm font-medium">表示名</label>
        <Input name="name" defaultValue={artist.name} required />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm font-medium">日本語名</label>
          <Input name="name_ja" defaultValue={artist.name_ja} />
        </div>
        <div>
          <label className="text-sm font-medium">英語名</label>
          <Input name="name_en" defaultValue={artist.name_en} />
        </div>
        <div>
          <label className="text-sm font-medium">韓国語名</label>
          <Input name="name_ko" defaultValue={artist.name_ko} />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">レベル</label>
          <select
            name="level"
            defaultValue={artist.level}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="GROUP">グループ</option>
            <option value="MEMBER">メンバー</option>
            <option value="UNIT">ユニット</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">グループID</label>
          <Input name="group_id" defaultValue={artist.group_id ?? ""} />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">カラー</label>
          <div className="flex items-center gap-2">
            <Input name="color" defaultValue={artist.color} />
            <div
              className="size-8 shrink-0 rounded border"
              style={{ backgroundColor: artist.color }}
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">並び順</label>
          <Input
            name="sort_order"
            type="number"
            defaultValue={artist.sort_order}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit">更新</Button>
      </div>
    </form>
  )
}

export function ArtistsList({ artists }: { artists: Artist[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  const filtered =
    filter === "all" ? artists : artists.filter((a) => a.level === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["all", "GROUP", "MEMBER", "UNIT"].map((l) => (
          <Button
            key={l}
            variant={filter === l ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(l)}
          >
            {l === "all" ? "すべて" : levelLabel[l]}
            {l !== "all" && (
              <Badge variant="secondary" className="ml-1.5">
                {artists.filter((a) => a.level === l).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>順序</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>表示名</TableHead>
              <TableHead>レベル</TableHead>
              <TableHead>グループ</TableHead>
              <TableHead>カラー</TableHead>
              <TableHead>誕生日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  該当するアーティストはいません
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((artist) => (
                <TableRow key={artist.id}>
                  <TableCell>{artist.sort_order}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {artist.id}
                  </TableCell>
                  <TableCell className="font-medium">{artist.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {levelLabel[artist.level] ?? artist.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {artist.group_id ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div
                        className="size-4 rounded-full border"
                        style={{ backgroundColor: artist.color }}
                      />
                      <span className="font-mono text-xs">{artist.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {artist.birthday ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={editingId === artist.id}
                      onOpenChange={(open) =>
                        setEditingId(open ? artist.id : null)
                      }
                    >
                      <DialogTrigger render={<Button variant="outline" size="sm" />}>
                        <Pencil className="mr-1 size-3" />
                        編集
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>アーティストを編集</DialogTitle>
                        </DialogHeader>
                        <ArtistForm
                          artist={artist}
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
