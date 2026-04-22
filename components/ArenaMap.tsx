'use client'

import { useMemo, useRef, useState } from 'react'
import { ArenaPosition, SeatView, arenaDistance, distanceToColor } from '@/lib/useSeatViews'
import { useTranslations } from 'next-intl'
import {
  GENERIC_ARENA,
  VenueLayout,
  VenueSection,
  resolveVenueLayout,
} from '@/lib/venueLayouts'

// SVG viewBox サイズ
const W = 300
const H = 260

function px(norm: number, total: number) { return norm * total }

// ─── ジオメトリユーティリティ ──────────────────────────────
type BBox = { x: number; y: number; w: number; h: number; cx: number; cy: number }

function sectionBBox(section: VenueSection): BBox {
  if (section.shape.kind === 'rect') {
    const { x1, y1, x2, y2 } = section.shape
    const x = Math.min(x1, x2)
    const y = Math.min(y1, y2)
    const w = Math.abs(x2 - x1)
    const h = Math.abs(y2 - y1)
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 }
  }
  // polygon
  const pts = section.shape.points
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const w = maxX - minX
  const h = maxY - minY
  return { x: minX, y: minY, w, h, cx: minX + w / 2, cy: minY + h / 2 }
}

function pointInRect(
  px_: number, py_: number,
  x1: number, y1: number, x2: number, y2: number,
): boolean {
  const xMin = Math.min(x1, x2), xMax = Math.max(x1, x2)
  const yMin = Math.min(y1, y2), yMax = Math.max(y1, y2)
  return px_ >= xMin && px_ <= xMax && py_ >= yMin && py_ <= yMax
}

/** Ray-casting による多角形含有判定 (正規化座標) */
function pointInPolygon(px_: number, py_: number, points: Array<[number, number]>): boolean {
  let inside = false
  const n = points.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    const intersect = ((yi > py_) !== (yj > py_)) &&
      (px_ < ((xj - xi) * (py_ - yi)) / ((yj - yi) || 1e-9) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function pointInSection(pos: ArenaPosition, section: VenueSection): boolean {
  if (section.shape.kind === 'rect') {
    const { x1, y1, x2, y2 } = section.shape
    return pointInRect(pos.x, pos.y, x1, y1, x2, y2)
  }
  return pointInPolygon(pos.x, pos.y, section.shape.points)
}

// ─── detectSection (会場レイアウト対応) ───────────────────
/**
 * 位置からエリア名を推定。
 * - 第2引数に VenueLayout を渡せばそのレイアウトで判定
 * - venueName (string) を渡せば resolveVenueLayout で解決 (なければ GENERIC_ARENA)
 * - 省略時は GENERIC_ARENA
 */
export function detectSection(
  pos: ArenaPosition,
  layoutOrVenueName?: VenueLayout | string | null,
): string {
  const layout: VenueLayout =
    !layoutOrVenueName
      ? GENERIC_ARENA
      : typeof layoutOrVenueName === 'string'
        ? (resolveVenueLayout(layoutOrVenueName) ?? GENERIC_ARENA)
        : layoutOrVenueName

  for (const s of layout.sections) {
    if (s.isStage) continue
    if (pointInSection(pos, s)) {
      if (s.label) {
        return s.label.replace('\n', ' ').trim()
      }
      // labelKey は翻訳せず、id を返す (翻訳はUI側で行う)
      return s.id
    }
  }
  return ''
}

// ─── ArenaPositionPicker ───────────────────────────────────
/** 席位置を指定するインタラクティブな俯瞰図 */
export function ArenaPositionPicker({
  value,
  onChange,
  venueName,
}: {
  value?: ArenaPosition
  onChange: (pos: ArenaPosition) => void
  venueName?: string
}) {
  const t = useTranslations()
  const svgRef = useRef<SVGSVGElement>(null)

  const layout = useMemo<VenueLayout>(() => {
    return resolveVenueLayout(venueName) ?? GENERIC_ARENA
  }, [venueName])

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    // stage エリアは選択不可
    for (const s of layout.sections) {
      if (!s.isStage) continue
      if (pointInSection({ x, y }, s)) return
    }
    onChange({ x, y })
  }

  return (
    <div>
      <p className="text-[11px] mb-1.5" style={{ color: '#8E8E93' }}>
        {t('Map.arenaTapSeat')}
        {value && (
          <span className="ml-2 font-bold" style={{ color: '#3B82F6' }}>
            → {detectSection(value, layout)}
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
        <ArenaSVGBase layout={layout} />
        {value && <PinMarker pos={value} color="#3B82F6" label={t('Map.arenaYourSeat')} isMe />}
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
  venueName,
}: {
  myPosition?: ArenaPosition
  views: SeatView[]
  onPinTap: (view: SeatView) => void
  venueName?: string
}) {
  const t = useTranslations()
  const [selected, setSelected] = useState<SeatView | null>(null)

  const layout = useMemo<VenueLayout>(() => {
    return resolveVenueLayout(venueName) ?? GENERIC_ARENA
  }, [venueName])

  const viewsWithPos = views.filter((v) => v.position)
  const viewsNoPos = views.filter((v) => !v.position)

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl"
        style={{ border: '1.5px solid #E5E5EA' }}
      >
        <ArenaSVGBase layout={layout} />

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
        {myPosition && <PinMarker pos={myPosition} color="#3B82F6" label={t('Map.arenaYou')} isMe />}
      </svg>

      {/* 凡例 */}
      <div className="flex items-center gap-3 px-1 flex-wrap">
        {myPosition && ([
          { color: '#34D399', label: t('Map.arenaSameSeat') },
          { color: '#FCD34D', label: t('Map.arenaSlightlyClose') },
          { color: '#FB923C', label: t('Map.arenaSlightlyFar') },
          { color: '#C7C7CC', label: t('Map.arenaFar') },
        ] as const).map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-[10px]">📷</span>
          <span className="text-[10px]" style={{ color: '#8E8E93' }}>{t('Map.arenaViewPhoto')}</span>
        </div>
      </div>

      {/* 位置情報なしの投稿 */}
      {viewsNoPos.length > 0 && (
        <p className="text-[11px] px-1" style={{ color: '#8E8E93' }}>
          {t('Common.noPosViews')} {viewsNoPos.length}{t('Map.countSuffix')}{t('Common.shownBelow')}
        </p>
      )}
    </div>
  )
}

// ─── 共通 SVG パーツ ──────────────────────────────────────
function ArenaSVGBase({ layout }: { layout: VenueLayout }) {
  const t = useTranslations()
  return (
    <>
      <rect width={W} height={H} fill="#F8F9FA" rx="10" />

      {/* 会場外形 (他のセクションより下) */}
      {layout.outline && layout.outline.kind === 'ellipse' && (
        <ellipse
          cx={px(layout.outline.cx, W)}
          cy={px(layout.outline.cy, H)}
          rx={px(layout.outline.rx, W)}
          ry={px(layout.outline.ry, H)}
          fill={layout.outline.fill ?? '#F8F9FA'}
          stroke={layout.outline.stroke ?? '#D1D5DB'}
          strokeWidth="1"
        />
      )}
      {layout.outline && layout.outline.kind === 'polygon' && (
        <polygon
          points={layout.outline.points.map(([x, y]) => `${px(x, W)},${px(y, H)}`).join(' ')}
          fill={layout.outline.fill ?? '#F8F9FA'}
          stroke={layout.outline.stroke ?? '#D1D5DB'}
          strokeWidth="1"
        />
      )}

      {/* 各セクション */}
      {layout.sections.map((s) => {
        const bb = sectionBBox(s)
        const cx = s.labelX !== undefined ? px(s.labelX, W) : px(bb.cx, W)
        const cy = s.labelY !== undefined ? px(s.labelY, H) : px(bb.cy, H)
        const fontSize = s.fontSize ?? 9
        const rawLabel = s.labelKey
          ? t(s.labelKey) + (s.label ?? '')
          : (s.label ?? '')
        const lines = rawLabel.split('\n')
        const strokeColor = s.isStage ? '#3E3E44' : '#E5E5EA'

        return (
          <g key={s.id}>
            {s.shape.kind === 'rect' ? (
              <rect
                x={px(bb.x, W)}
                y={px(bb.y, H)}
                width={px(bb.w, W)}
                height={px(bb.h, H)}
                fill={s.fill}
                stroke={strokeColor}
                strokeWidth="0.5"
                rx="3"
              />
            ) : (
              <polygon
                points={s.shape.points.map(([x, y]) => `${px(x, W)},${px(y, H)}`).join(' ')}
                fill={s.fill}
                stroke={strokeColor}
                strokeWidth="0.5"
              />
            )}
            {lines.map((line, i) => (
              <text
                key={i}
                x={cx}
                y={cy + (i - (lines.length - 1) / 2) * (fontSize + 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill={s.textColor}
                fontWeight={s.isStage ? 'bold' : 'normal'}
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}

      {/* 会場名表示 (左下、GENERIC 以外のみ) */}
      {layout.id !== 'generic' && (
        <text
          x={6}
          y={H - 6}
          fontSize="8"
          fill="#8E8E93"
          fontWeight="normal"
        >
          {layout.displayName}
        </text>
      )}
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
