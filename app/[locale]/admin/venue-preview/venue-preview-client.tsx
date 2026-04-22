"use client"

import { useState } from "react"
import ArenaMap, { ArenaPositionPicker, detectSection } from "@/components/ArenaMap"
import { GENERIC_ARENA, VENUE_LAYOUTS, VenueLayout } from "@/lib/venueLayouts"
import { ArenaPosition } from "@/lib/useSeatViews"

const ALL_LAYOUTS: VenueLayout[] = [GENERIC_ARENA, ...VENUE_LAYOUTS]

export function VenuePreviewClient() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {ALL_LAYOUTS.map((layout) => (
        <VenueCard key={layout.id} layout={layout} />
      ))}
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
