'use client'

// 東京ドーム専用 ピンポイント席位置指定ピッカー
// ------------------------------------------------------------
// ブロック (A01-F19 / G03-G47 / S/P/T) + 列 + 席番 から、
// アリーナ俯瞰図の正確な位置にピンを打つ。
// 「通路側ですね」バッジもリアルタイム表示。

import { useMemo, useState, useEffect } from 'react'
import {
  TOKYO_DOME_BLOCKS,
  blocksByRing,
  type TokyoDomeBlock,
  type TokyoDomeRing,
} from '@/lib/tokyoDomeData'
import {
  seatToPosition,
  blockCenter,
  blockSectorPath,
  isArenaBlock,
  type SeatPosition,
} from '@/lib/tokyoDomeSeat'
import { TOKYO_DOME } from '@/lib/venueLayouts'

// SVG viewBox (既存 ArenaMap と共通)
const W = 300
const H = 260

const RING_ORDER: Array<TokyoDomeRing> = [
  'ARENA',
  'A', 'B', 'S', 'P', 'T', 'C', 'D', 'E', 'F', 'G',
]

const RING_LABEL: Record<TokyoDomeRing, string> = {
  ARENA: 'アリーナ (フィールド)',
  A: 'A (1階内側)',
  B: 'B (1階外側)',
  S: 'S (バックネット裏)',
  P: 'P (1塁側特別)',
  T: 'T (3塁側特別)',
  C: 'C (2階内野)',
  D: 'D (2階上段)',
  E: 'E (2階最上段)',
  F: 'F (バルコニー)',
  G: 'G (外野)',
}

const RING_COLOR: Record<TokyoDomeRing, string> = {
  ARENA: '#EEF0F5',
  A: '#F3B4E3',
  B: '#EC4899',
  S: '#FB923C',
  P: '#FDE68A',
  T: '#FBCFE8',
  C: '#3B82F6',
  D: '#8B5CF6',
  E: '#10B981',
  F: '#6366F1',
  G: '#F59E0B',
}

export type TokyoDomeSeatPick = {
  blockId: string
  row: number
  seat: number
  position: SeatPosition
}

export default function TokyoDomeSeatPicker({
  initial,
  onChange,
  compact,
}: {
  initial?: { blockId?: string; row?: number; seat?: number }
  onChange?: (pick: TokyoDomeSeatPick | null) => void
  compact?: boolean
}) {
  const ringMap = useMemo(() => blocksByRing(), [])
  const [blockId, setBlockId] = useState<string>(initial?.blockId ?? '')
  const [row, setRow] = useState<number>(initial?.row ?? 1)
  const [seat, setSeat] = useState<number>(initial?.seat ?? 1)

  const block = useMemo<TokyoDomeBlock | undefined>(
    () => TOKYO_DOME_BLOCKS.find((b) => b.id === blockId),
    [blockId],
  )

  // 列/席番を block に収まる範囲にクランプ
  const safeRow = block ? Math.max(1, Math.min(block.rows, row)) : row
  const safeSeat = block ? Math.max(1, Math.min(block.seats, seat)) : seat

  const pin = useMemo(() => {
    if (!blockId || !block) return null
    return seatToPosition(blockId, safeRow, safeSeat)
  }, [blockId, block, safeRow, safeSeat])

  const blockCenterPt = useMemo(() => (blockId ? blockCenter(blockId) : null), [blockId])
  const blockPath = useMemo(() => (blockId ? blockSectorPath(blockId) : null), [blockId])

  // onChange を通知
  useEffect(() => {
    if (!onChange) return
    if (blockId && block && pin) {
      onChange({ blockId, row: safeRow, seat: safeSeat, position: pin })
    } else {
      onChange(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, safeRow, safeSeat, pin?.x, pin?.y])

  return (
    <div className="flex flex-col gap-3">
      {/* 入力フォーム */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-3">
          <label className="text-[10px] font-bold block mb-1" style={{ color: '#636366' }}>
            ブロック
          </label>
          <select
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg text-sm font-semibold outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
          >
            <option value="">— ブロックを選択 —</option>
            {RING_ORDER.map((ring) => (
              <optgroup key={ring} label={RING_LABEL[ring]}>
                {ringMap[ring].map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} ({b.rows}列 × {b.seats}席)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold block mb-1" style={{ color: '#636366' }}>
            列 (row)
          </label>
          <input
            type="number"
            value={row}
            min={1}
            max={block?.rows ?? 99}
            onChange={(e) => setRow(Number(e.target.value) || 1)}
            className="w-full px-2.5 py-2 rounded-lg text-sm font-semibold outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold block mb-1" style={{ color: '#636366' }}>
            席番 (seat)
          </label>
          <input
            type="number"
            value={seat}
            min={1}
            max={block?.seats ?? 99}
            onChange={(e) => setSeat(Number(e.target.value) || 1)}
            className="w-full px-2.5 py-2 rounded-lg text-sm font-semibold outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
          />
        </div>
        <div className="flex flex-col justify-end">
          {pin?.isAisle && (
            <span
              className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-bold"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#059669' }}
            >
              通路側ですね ✓
            </span>
          )}
        </div>
      </div>

      {/* 俯瞰図 */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl select-none"
        style={{ border: '1.5px solid #E5E5EA', background: '#F8F9FA' }}
      >
        <DomeBaseSVG />

        {/* 選択ブロックをハイライト */}
        {blockPath && block && !isArenaBlock(block) && (
          <path
            d={scalePath(blockPath, W, H)}
            fill={RING_COLOR[block.ring]}
            fillOpacity={0.35}
            stroke={RING_COLOR[block.ring]}
            strokeWidth={1.5}
          />
        )}
        {block && isArenaBlock(block) && (
          <rect
            x={block.x1 * W}
            y={block.y1 * H}
            width={(block.x2 - block.x1) * W}
            height={(block.y2 - block.y1) * H}
            fill="#FCD34D"
            fillOpacity={0.45}
            stroke="#B45309"
            strokeWidth={1.5}
            rx={3}
          />
        )}

        {/* ブロック中心ラベル (ピン未確定時) */}
        {blockCenterPt && !pin && (
          <g>
            <circle
              cx={blockCenterPt.x * W}
              cy={blockCenterPt.y * H}
              r={5}
              fill="#3B82F6"
              opacity={0.6}
            />
          </g>
        )}

        {/* ピン (席位置) */}
        {pin && (
          <g>
            <circle cx={pin.x * W} cy={pin.y * H + 1} r={9} fill="rgba(0,0,0,0.15)" />
            <circle
              cx={pin.x * W}
              cy={pin.y * H}
              r={9}
              fill={pin.isAisle ? '#059669' : '#3B82F6'}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            <text
              x={pin.x * W}
              y={pin.y * H + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="#FFFFFF"
              fontWeight="bold"
            >
              ★
            </text>
            <rect
              x={pin.x * W - 28}
              y={pin.y * H - 24}
              width={56}
              height={14}
              rx={3}
              fill={pin.isAisle ? '#059669' : '#3B82F6'}
              opacity={0.92}
            />
            <text
              x={pin.x * W}
              y={pin.y * H - 17}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7}
              fill="#FFFFFF"
              fontWeight="bold"
            >
              {blockId} {safeRow}列{safeSeat}番
            </text>
          </g>
        )}

        {/* ステージ位置 (上端) */}
        <rect
          x={0.30 * W}
          y={0.02 * H}
          width={0.40 * W}
          height={0.07 * H}
          fill="#1C1C1E"
          rx={3}
        />
        <text
          x={0.5 * W}
          y={0.055 * H}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill="#FFFFFF"
          fontWeight="bold"
        >
          STAGE
        </text>

        <text x={6} y={H - 6} fontSize={8} fill="#8E8E93">
          東京ドーム (精密版)
        </text>
      </svg>

      {/* 現在値サマリ */}
      {!compact && block && pin && (
        <div
          className="text-[11px] rounded-lg px-3 py-2"
          style={{ background: '#F8F9FA', color: '#636366' }}
        >
          <p>
            <span className="font-bold">選択:</span> {blockId} {safeRow}列 {safeSeat}番
            {pin.isAisle && <span className="ml-2 font-bold" style={{ color: '#059669' }}>(通路側)</span>}
          </p>
          <p className="mt-0.5">
            <span className="font-bold">ブロック範囲:</span>{' '}
            {block.rows}列 × {block.seats}席
            {isArenaBlock(block) ? (
              <>
                {' '}/ 矩形 x {block.x1.toFixed(2)}–{block.x2.toFixed(2)} /
                y {block.y1.toFixed(2)}–{block.y2.toFixed(2)}
              </>
            ) : (
              <>
                {' '}/ 角度 {block.angleStart.toFixed(0)}°–{block.angleEnd.toFixed(0)}° /
                半径 {block.rInner.toFixed(2)}–{block.rOuter.toFixed(2)}
              </>
            )}
          </p>
          <p className="mt-0.5">
            <span className="font-bold">pos:</span> ({pin.x.toFixed(3)}, {pin.y.toFixed(3)})
          </p>
        </div>
      )}
    </div>
  )
}

// ─ 背景 SVG (ドーム外形 + 簡易ゾーン表示) ───────────────────
function DomeBaseSVG() {
  const outline = TOKYO_DOME.outline
  return (
    <>
      <rect width={W} height={H} fill="#F8F9FA" rx={10} />
      {outline && outline.kind === 'ellipse' && (
        <ellipse
          cx={outline.cx * W}
          cy={outline.cy * H}
          rx={outline.rx * W}
          ry={outline.ry * H}
          fill="#F8F9FA"
          stroke="#D1D5DB"
          strokeWidth={1}
        />
      )}
      {/* 中心 (ホームベース方向は下) + フィールド */}
      <circle cx={0.5 * W} cy={0.5 * H} r={2} fill="#C7C7CC" />
      {/* リング構造のガイド線 (薄く) */}
      {[0.22, 0.30, 0.37, 0.42, 0.52, 0.62, 0.74, 0.85].map((r) => (
        <ellipse
          key={r}
          cx={0.5 * W}
          cy={0.5 * H}
          rx={r * 0.48 * W}
          ry={r * 0.48 * H}
          fill="none"
          stroke="#E5E5EA"
          strokeWidth={0.4}
          strokeDasharray="2 2"
        />
      ))}
      {/* ARENA ブロック背景 (薄く全ブロック表示) */}
      {TOKYO_DOME_BLOCKS.filter(isArenaBlock).map((b) => (
        <g key={b.id}>
          <rect
            x={b.x1 * W}
            y={b.y1 * H}
            width={(b.x2 - b.x1) * W}
            height={(b.y2 - b.y1) * H}
            fill="#EEF0F5"
            stroke="#C7C7CC"
            strokeWidth={0.6}
            rx={2}
          />
          <text
            x={((b.x1 + b.x2) / 2) * W}
            y={((b.y1 + b.y2) / 2) * H + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={7}
            fill="#636366"
            fontWeight="bold"
          >
            {b.id.replace('ARENA-', '')}
          </text>
        </g>
      ))}
      {/* HOME 表示 (下) */}
      <text
        x={0.5 * W}
        y={H - 12}
        textAnchor="middle"
        fontSize={8}
        fill="#8E8E93"
      >
        ホーム
      </text>
    </>
  )
}

// path の 0-1 座標を W/H スケールへ変換
function scalePath(d: string, w: number, h: number): string {
  return d.replace(/([MLZ])|(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_match, cmd, x, y) => {
    if (cmd) return cmd
    return `${(parseFloat(x) * w).toFixed(3)},${(parseFloat(y) * h).toFixed(3)}`
  })
}
