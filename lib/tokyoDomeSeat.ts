// 東京ドーム 席 → 正規化座標 + 通路判定
// ------------------------------------------------------------
// ブロック ID + 列 + 席番 から、アリーナ俯瞰図 (viewBox 0-1) 上の
// 正規化座標を返す。通路側 (1席目 / 最終席目) 判定も行う。
//
// 座標系:
//   - viewBox は 0〜1 正規化 (既存の ArenaMap と共通)
//   - CENTER = (0.5, 0.5) がドーム中心
//   - 楕円半径 (rx, ry) は東京ドームレイアウトの outline と揃える
//     → TOKYO_DOME.outline は ellipse rx=ry=0.48
//     → ここでは 0.48 を共通半径として使用

import {
  TOKYO_DOME_BLOCKS,
  type DomeBlock,
  type ArenaBlock,
  type TokyoDomeBlock,
} from './tokyoDomeData'

export type SeatPosition = {
  x: number
  y: number
  /** 通路側 (ブロックの左端/右端席) */
  isAisle: boolean
  blockId: string
}

const CENTER = { x: 0.5, y: 0.5 }
const DOME_RADIUS = 0.48

/**
 * 極座標 → デカルト (viewBox 0-1)
 * angle 0° = ステージ正面 (SVG 上辺方向, 内部表現では -90° = cos/sin の y 軸負方向)
 * 時計回りに角度が増加。
 */
export function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  // angle 0° (ステージ) を SVG 上辺に置くため -90° オフセット
  // かつ 時計回り → 数学的な角度と y 軸反転で一致させる
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CENTER.x + radius * Math.cos(rad) * DOME_RADIUS,
    y: CENTER.y + radius * Math.sin(rad) * DOME_RADIUS,
  }
}

/** 指定 id のブロックを取得 (大文字小文字無視) */
export function findBlock(blockId: string): TokyoDomeBlock | undefined {
  const upper = blockId.trim().toUpperCase()
  return TOKYO_DOME_BLOCKS.find((b) => b.id === upper)
}

/** ArenaBlock (矩形) 判定 */
export function isArenaBlock(block: TokyoDomeBlock): block is ArenaBlock {
  return block.ring === 'ARENA'
}

/** DomeBlock (扇形) 判定 */
export function isDomeBlock(block: TokyoDomeBlock): block is DomeBlock {
  return block.ring !== 'ARENA'
}

/**
 * ブロック + 列 + 席番 → 正規化座標 + 通路判定
 * row: 1 が内側 (中心寄り) / ARENA はステージ側 (y1), 最大値が外側 / ホーム側 (y2)
 * seat: 1 が seatOrder='cw'/'ltr' のときブロック左端
 */
export function seatToPosition(
  blockId: string,
  row: number,
  seat: number,
): SeatPosition | null {
  const block = findBlock(blockId)
  if (!block) return null

  if (isArenaBlock(block)) {
    // ARENA は矩形内の線形補間
    const rT = block.rows <= 1 ? 0.5 : clamp01((row - 1) / (block.rows - 1))
    const sT = block.seats <= 1 ? 0.5 : clamp01((seat - 1) / (block.seats - 1))
    const sTadj = block.seatOrder === 'ltr' ? sT : 1 - sT
    const x = block.x1 + (block.x2 - block.x1) * sTadj
    const y = block.y1 + (block.y2 - block.y1) * rT
    const isAisle = seat === 1 || seat === block.seats
    return { x, y, isAisle, blockId: block.id }
  }

  // DomeBlock: 極座標
  // 半径補間: row=1 が rInner, row=rows が rOuter
  const rT = block.rows <= 1 ? 0.5 : clamp01((row - 1) / (block.rows - 1))
  const r = block.rInner + (block.rOuter - block.rInner) * rT

  // 角度補間: seat=1 が angleStart (seatOrder='cw' 時)
  const sT = block.seats <= 1 ? 0.5 : clamp01((seat - 1) / (block.seats - 1))
  const sTadj = block.seatOrder === 'cw' ? sT : 1 - sT
  // angleStart > angleEnd (0° 跨ぎ) に対応
  const span = normalizeAngleSpan(block.angleStart, block.angleEnd)
  const angle = block.angleStart + span * sTadj

  const { x, y } = polarToXY(angle, r)
  // 通路側判定: 席番 1 or 最終席
  const isAisle = seat === 1 || seat === block.seats
  return { x, y, isAisle, blockId: block.id }
}

/** ブロック中心座標 (入力途中の概算表示用) */
export function blockCenter(blockId: string): { x: number; y: number } | null {
  const block = findBlock(blockId)
  if (!block) return null
  if (isArenaBlock(block)) {
    return {
      x: (block.x1 + block.x2) / 2,
      y: (block.y1 + block.y2) / 2,
    }
  }
  const span = normalizeAngleSpan(block.angleStart, block.angleEnd)
  const angle = block.angleStart + span / 2
  const r = (block.rInner + block.rOuter) / 2
  return polarToXY(angle, r)
}

/**
 * ブロックの SVG path (扇形セクター) を生成
 * ARENA の場合は矩形 (M/L/Z) を返す。
 * SVG viewBox は caller 側で拡大 (px W, H) する前提 → 0-1 正規化のまま返す。
 */
export function blockSectorPath(blockId: string): string | null {
  const block = findBlock(blockId)
  if (!block) return null
  if (isArenaBlock(block)) {
    return rectPath(block.x1, block.y1, block.x2, block.y2)
  }
  return sectorPath(block.angleStart, block.angleEnd, block.rInner, block.rOuter)
}

/** 0-1 正規化座標の矩形 SVG path (ARENA 用) */
export function rectPath(x1: number, y1: number, x2: number, y2: number): string {
  return (
    `M ${x1.toFixed(5)},${y1.toFixed(5)}` +
    ` L ${x2.toFixed(5)},${y1.toFixed(5)}` +
    ` L ${x2.toFixed(5)},${y2.toFixed(5)}` +
    ` L ${x1.toFixed(5)},${y2.toFixed(5)} Z`
  )
}

/** 極座標の扇形セクター SVG path (0-1 正規化) */
export function sectorPath(
  angleStart: number,
  angleEnd: number,
  rInner: number,
  rOuter: number,
): string {
  const span = normalizeAngleSpan(angleStart, angleEnd)
  const angleEndNorm = angleStart + span
  // 20 分割で近似 polygon 生成 (arc より実装が単純で互換性高い)
  const steps = 20
  const outer: Array<[number, number]> = []
  const inner: Array<[number, number]> = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = angleStart + span * t
    outer.push([polarToXY(a, rOuter).x, polarToXY(a, rOuter).y])
    inner.push([polarToXY(a, rInner).x, polarToXY(a, rInner).y])
  }
  void angleEndNorm // keep for readability / debugger
  const pts = [...outer, ...inner.reverse()]
  return (
    'M ' +
    pts.map(([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`).join(' L ') +
    ' Z'
  )
}

// ─ internal helpers ──────────────────────────────────────────

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** 角度範囲 (時計回り) のサイズ。0° 跨ぎ対応 */
function normalizeAngleSpan(start: number, end: number): number {
  let span = end - start
  if (span < 0) span += 360
  if (span > 360) span -= 360
  return span
}
