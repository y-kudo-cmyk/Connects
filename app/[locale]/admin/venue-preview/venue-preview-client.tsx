"use client"

import { useState } from "react"
import ArenaMap, { ArenaPositionPicker, detectSection } from "@/components/ArenaMap"
import TokyoDomeSeatPicker, { type TokyoDomeSeatPick } from "@/components/TokyoDomeSeatPicker"
import { GENERIC_ARENA, VENUE_LAYOUTS, VenueLayout } from "@/lib/venueLayouts"
import { ArenaPosition } from "@/lib/useSeatViews"
import { TOKYO_DOME_BLOCKS } from "@/lib/tokyoDomeData"

const ALL_LAYOUTS: VenueLayout[] = [GENERIC_ARENA, ...VENUE_LAYOUTS]

export function VenuePreviewClient() {
  return (
    <div className="flex flex-col gap-6">
      <TokyoDomePreciseCard />
      <div className="grid gap-6 md:grid-cols-2">
        {ALL_LAYOUTS.map((layout) => (
          <VenueCard key={layout.id} layout={layout} />
        ))}
      </div>
    </div>
  )
}

// ─ 東京ドーム精密版プレビュー ────────────────────────────
type Preset = { label: string; blockId: string; row: number; seat: number }
const TOKYO_DOME_PRESETS: Preset[] = [
  { label: 'A25 1列1番 (通路側)', blockId: 'A25', row: 1, seat: 1 },
  { label: 'C37 10列15番', blockId: 'C37', row: 10, seat: 15 },
  { label: 'F10 5列20番', blockId: 'F10', row: 5, seat: 20 },
  { label: 'B01 3列7番', blockId: 'B01', row: 3, seat: 7 },
  { label: 'S05 1列1番 (通路側)', blockId: 'S05', row: 1, seat: 1 },
  { label: 'G25 10列6番', blockId: 'G25', row: 10, seat: 6 },
  { label: 'E23 6列10番', blockId: 'E23', row: 6, seat: 10 },
  { label: 'ARENA-A 1列15番 (ステージ最前)', blockId: 'ARENA-A', row: 1, seat: 15 },
  { label: 'ARENA-C 5列10番 (中央)', blockId: 'ARENA-C', row: 5, seat: 10 },
  { label: 'ARENA-E 15列1番 (通路側)', blockId: 'ARENA-E', row: 15, seat: 1 },
]

function TokyoDomePreciseCard() {
  const [pick, setPick] = useState<TokyoDomeSeatPick | null>(null)
  const [initial, setInitial] = useState<{ blockId: string; row: number; seat: number } | undefined>(
    undefined,
  )

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "#FFFFFF", border: "1px solid #E5E5EA" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold" style={{ color: "#1C1C1E" }}>
            東京ドーム (精密版)
            <span
              className="ml-2 text-[10px] font-normal px-2 py-0.5 rounded-full"
              style={{ background: "#F0F0F5", color: "#636366" }}
            >
              blocks: {TOKYO_DOME_BLOCKS.length}
            </span>
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#8E8E93" }}>
            ブロック+列+席番から極座標でピン位置を算出。1席目/最終席目で「通路側ですね」バッジ表示。
          </p>
        </div>
      </div>

      {/* プリセット */}
      <div>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#8E8E93" }}>
          プリセット
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TOKYO_DOME_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setInitial({ blockId: p.blockId, row: p.row, seat: p.seat })}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ background: "#F0F0F5", color: "#636366", border: "1px solid #E5E5EA" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <TokyoDomeSeatPicker
        key={initial ? `${initial.blockId}-${initial.row}-${initial.seat}` : 'empty'}
        initial={initial}
        onChange={setPick}
      />

      <div
        className="text-[11px] rounded-lg px-3 py-2"
        style={{ background: "#F8F9FA", color: "#636366" }}
      >
        {pick ? (
          <>
            <p>
              <span className="font-bold">pick:</span> {pick.blockId} {pick.row}列 {pick.seat}番
              {pick.position.isAisle && (
                <span className="ml-2 font-bold" style={{ color: "#059669" }}>
                  (通路側)
                </span>
              )}
            </p>
            <p className="mt-0.5">
              <span className="font-bold">pos:</span> (
              {pick.position.x.toFixed(3)}, {pick.position.y.toFixed(3)})
            </p>
          </>
        ) : (
          <p>(未選択)</p>
        )}
      </div>
    </div>
  )
}

function VenueCard({ layout }: { layout: VenueLayout }) {
  const [position, setPosition] = useState<ArenaPosition | undefined>(undefined)
  // venueName のエイリアスの最初を使って resolveVenueLayout を通した場合に
  // 同じレイアウトが解決されるか検証する
  const probeName = layout.aliases[0] ?? ""

  // ステージ以外の section 数
  const nonStageCount = layout.sections.filter((s) => !s.isStage).length

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "#FFFFFF", border: "1px solid #E5E5EA" }}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold" style={{ color: "#1C1C1E" }}>
            {layout.displayName}
            <span
              className="ml-2 text-[10px] font-normal px-2 py-0.5 rounded-full"
              style={{ background: "#F0F0F5", color: "#636366" }}
            >
              id: {layout.id}
            </span>
          </p>
          {layout.note && (
            <p className="text-[11px] mt-1" style={{ color: "#8E8E93" }}>
              {layout.note}
            </p>
          )}
        </div>
        <div className="text-[10px] text-right" style={{ color: "#8E8E93" }}>
          sections: {nonStageCount}
          <br />
          outline: {layout.outline ? layout.outline.kind : "なし"}
        </div>
      </div>

      {/* アリーナ図 (ピッカー: タップで detectSection 動作確認) */}
      <ArenaPositionPicker
        value={position}
        onChange={setPosition}
        venueName={probeName}
      />

      {/* detectSection 結果 */}
      <div
        className="text-[11px] rounded-lg px-3 py-2"
        style={{ background: "#F8F9FA", color: "#636366" }}
      >
        <p>
          <span className="font-bold">detectSection:</span>{" "}
          {position
            ? (detectSection(position, layout) || "(空欄)")
            : "(未選択)"}
        </p>
        <p className="mt-1">
          <span className="font-bold">probe venue name:</span>{" "}
          &quot;{probeName}&quot;
        </p>
        {position && (
          <p className="mt-1">
            <span className="font-bold">pos:</span>{" "}
            ({position.x.toFixed(3)}, {position.y.toFixed(3)})
          </p>
        )}
      </div>

      {/* 表示専用の ArenaMap (ピンなし) — 外形/凡例の見た目確認 */}
      <details>
        <summary className="text-[11px] font-bold cursor-pointer" style={{ color: "#636366" }}>
          表示用 ArenaMap (myPosition なし)
        </summary>
        <div className="mt-2">
          <ArenaMap
            myPosition={position}
            views={[]}
            onPinTap={() => undefined}
            venueName={probeName}
          />
        </div>
      </details>

      {/* セクション ID 凡例 */}
      <details>
        <summary className="text-[11px] font-bold cursor-pointer" style={{ color: "#636366" }}>
          セクション一覧 ({layout.sections.length})
        </summary>
        <ul className="mt-2 text-[10px] flex flex-wrap gap-1.5">
          {layout.sections.map((s) => (
            <li
              key={s.id}
              className="px-2 py-0.5 rounded"
              style={{
                background: s.fill,
                color: s.textColor,
                border: "1px solid #E5E5EA",
              }}
            >
              <span className="font-bold">{s.id}</span>
              {s.label && (
                <span className="ml-1 opacity-70">
                  {s.label.replace(/\n/g, " ")}
                </span>
              )}
              <span className="ml-1 opacity-60">({s.shape.kind})</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
