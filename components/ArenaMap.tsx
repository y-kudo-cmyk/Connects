'use client'

import { useRef, useState } from 'react'
import { ArenaPosition, SeatView, arenaDistance, distanceToColor, distanceToLabel } from '@/lib/useSeatViews'

// SVG viewBox サイズ
const W = 300
const H = 260

// アリーナ各エリアの定義（正規化座標）
const SECTIONS = [
  { id: 'stage',  label: 'STAGE',        x1: 0.28, y1: 0.00, x2: 0.72, y2: 0.15, fill: '#1C1C1E', textColor: '#FFFFFF', fontSize: 10 },
  { id: 'floor',  label: 'アリーナ / FLOOR', x1: 0.18, y1: 0.15, x2: 0.82, y2: 0.58, fill: '#EEF0F5', textColor: '#636366', fontSize: 9 },
  { id: 'standA', label: 'スタンド\nA',   x1: 0.00, y1: 0.15, x2: 0.18, y2: 0.78, fill: '#F3B4E312', textColor: '#C97AB8', fontSize: 8 },
  { id: 'standC', label: 'スタンド\nC',   x1: 0.82, y1: 0.15, x2: 1.00, y2: 0.78, fill: '#3B82F612', textColor: '#2563EB', fontSize: 8 },
  { id: 'standB', label: 'スタンド B',    x1: 0.18, y1: 0.58, x2: 0.82, y2: 0.78, fill: '#34D39912', textColor: '#059669', fontSize: 9 },
  { id: 'standD', label: 'スタンド D / 2F', x1: 0.18, y1: 0.78, x2: 0.82, y2: 1.00, fill: '#A78BFA12', textColor: '#7C3AED', fontSize: 9 },
  { id: 'standA2', label: '2F\nA',        x1: 0.00, y1: 0.78, x2: 0.18, y2: 1.00, fill: '#F3B4E312', textColor: '#C97AB8', fontSize: 7 },
  { id: 'standC2', label: '2F\nC',        x1: 0.82, y1: 0.78, x2: 1.00, y2: 1.00, fill: '#3B82F612', textColor: '#2563EB', fontSize: 7 },
] as const

/** 位置からエリア名を推定 */
export function detectSection(pos: ArenaPosition): string {
  for (const s of SECTIONS) {
    if (pos.x >= s.x1 && pos.x <= s.x2 && pos.y >= s.y1 && pos.y <= s.y2) {
      return s.label.replace('\n', ' ')
    }
  }
  return ''
}

function px(norm: number, total: number) { return norm * total }

// ─── ArenaPositionPicker ───────────────────────────────────
/** 席位置を指定するインタラクティブな俯瞰図 */
export function ArenaPositionPicker({
  value,
  onChange,
}: {
  value?: ArenaPosition
  onChange: (pos: ArenaPosition) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    // stage エリアは選択不可
    if (y < 0.15 && x > 0.28 && x < 0.72) return
    onChange({ x, y })
  }

  return (
    <div>
      <p className="text-[11px] mb-1.5" style={{ color: '#8E8E93' }}>
        自分の席があるエリアをタップ
        {value && (
          <span className="ml-2 font-bold" style={{ color: '#3B82F6' }}>
            → {detectSection(value)}
          </span>
        )}
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl cursor-crosshair select-none"
        style={{ border: '1.5px solid #E5E5EA', touchAction: 'none' }}
        onPointerDown={handlePointer}
      >
        <ArenaSVGBase />
        {value && <PinMarker pos={value} color="#3B82F6" label="あなたの席" isMe />}
      </svg>
    </div>
  )
}

// ─── ArenaMap（表示用） ────────────────────────────────────
/** マッチした投稿をピン表示するアリーナ俯瞰図 */
export default function ArenaMap({
  myPosition,
  views,
  onPinTap,
}: {
  myPosition?: ArenaPosition
  views: SeatView[]
  onPinTap: (view: SeatView) => void
}) {
  const [selected, setSelected] = useState<SeatView | null>(null)

  const viewsWithPos = views.filter((v) => v.position)
  const viewsNoPos = views.filter((v) => !v.position)

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl"
        style={{ border: '1.5px solid #E5E5EA' }}
      >
        <ArenaSVGBase />

        {/* 投稿ピン */}
        {viewsWithPos.map((v) => {
          const dist = myPosition && v.position ? arenaDistance(v.position, myPosition) : undefined
          const color = dist !== undefined ? distanceToColor(dist) : '#C7C7CC'
          return (
            <g key={v.id} onClick={() => { setSelected(v === selected ? null : v); onPinTap(v) }}
              style={{ cursor: 'pointer' }}>
              <circle
                cx={px(v.position!.x, W)}
                cy={px(v.position!.y, H)}
                r={selected?.id === v.id ? 10 : 7}
                fill={color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                opacity="0.92"
              />
              <text
                x={px(v.position!.x, W)}
                y={px(v.position!.y, H) + 4}
                textAnchor="middle"
                fontSize="8"
                fill="#1C1C1E"
                fontWeight="bold"
              >📷</text>
            </g>
          )
        })}

        {/* 自席ピン */}
        {myPosition && <PinMarker pos={myPosition} color="#3B82F6" label="あなた" isMe />}
      </svg>

      {/* 凡例 */}
      <div className="flex items-center gap-3 px-1 flex-wrap">
        {myPosition && [
          { color: '#34D399', label: 'ほぼ同じ席' },
          { color: '#FCD34D', label: 'やや近い' },
          { color: '#FB923C', label: 'やや遠い' },
          { color: '#C7C7CC', label: '遠い' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-[10px]">📷</span>
          <span className="text-[10px]" style={{ color: '#8E8E93' }}>眺め写真あり</span>
        </div>
      </div>

      {/* 位置情報なしの投稿 */}
      {viewsNoPos.length > 0 && (
        <p className="text-[11px] px-1" style={{ color: '#8E8E93' }}>
          ＋ 位置情報なしの投稿 {viewsNoPos.length}件（下に表示）
        </p>
      )}
    </div>
  )
}

// ─── 共通 SVG パーツ ──────────────────────────────────────
function ArenaSVGBase() {
  return (
    <>
      <rect width={W} height={H} fill="#F8F9FA" rx="10" />
      {SECTIONS.map((s) => {
        const x = px(s.x1, W)
        const y = px(s.y1, H)
        const w = px(s.x2 - s.x1, W)
        const h = px(s.y2 - s.y1, H)
        const cx = x + w / 2
        const cy = y + h / 2
        const lines = s.label.split('\n')
        return (
          <g key={s.id}>
            <rect x={x} y={y} width={w} height={h} fill={s.fill}
              stroke={s.id === 'stage' ? '#3E3E44' : '#E5E5EA'} strokeWidth="0.5" rx="3" />
            {lines.map((line, i) => (
              <text
                key={i}
                x={cx}
                y={cy + (i - (lines.length - 1) / 2) * (s.fontSize! + 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={s.fontSize}
                fill={s.textColor}
                fontWeight={s.id === 'stage' ? 'bold' : 'normal'}
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </>
  )
}

function PinMarker({ pos, color, label, isMe }: { pos: ArenaPosition; color: string; label: string; isMe?: boolean }) {
  const cx = px(pos.x, W)
  const cy = px(pos.y, H)
  return (
    <g>
      {/* 影 */}
      <circle cx={cx} cy={cy + 1} r={isMe ? 9 : 7} fill="rgba(0,0,0,0.15)" />
      {/* 本体 */}
      <circle cx={cx} cy={cy} r={isMe ? 9 : 7} fill={color} stroke="#FFFFFF" strokeWidth={isMe ? 2 : 1.5} />
      {isMe && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#FFFFFF" fontWeight="bold">
          ★
        </text>
      )}
      {/* ラベル */}
      <rect x={cx - 22} y={cy - 22} width={44} height={13} rx="3" fill={color} opacity="0.9" />
      <text x={cx} y={cy - 15} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#FFFFFF" fontWeight="bold">
        {label}
      </text>
    </g>
  )
}
