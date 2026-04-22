// 東京ドーム ブロックデータ (極座標, 近似値)
// ------------------------------------------------------------
// 参考座席図から目測で作成。著作権配慮のため独自モデル化。
// 後日 工藤さんが座標微調整スクリプトで1%刻み調整する前提。
//
// 角度の基準:
//   angle 0°   = ステージ正面 (外野側, SVG の上辺)
//   angle 90°  = 1塁側 (SVG の右辺)
//   angle 180° = ホーム / バックネット側 (SVG の下辺)
//   angle 270° = 3塁側 (SVG の左辺)
//   時計回りに角度が増加。
//
// 半径:
//   radius 0 = ドーム中心 (フィールド中央)
//   radius 1 = 外周 (バルコニー外側)
//
// リング半径の目安 (tokyoDomeSeat.ts と対応):
//   A: 0.22-0.30  内野 1F 最内
//   B: 0.30-0.37  内野 1F (A の外)
//   S: 0.37-0.42  バックネット裏特別席
//   P: 0.37-0.42  1塁側特別席
//   T: 0.37-0.42  3塁側特別席
//   C: 0.42-0.52  2F 内野
//   D: 0.52-0.62  2F 上段
//   E: 0.62-0.74  2F 最上段
//   F: 0.74-0.85  バルコニー最上
//   G: 0.22-0.55  外野 (ステージ側)

export type DomeBlock = {
  id: string
  ring: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'S' | 'P' | 'T' | 'G'
  /** 度 (時計回り, 0=ステージ側, 90=1塁, 180=ホーム, 270=3塁) */
  angleStart: number
  angleEnd: number
  /** 半径 (0-1), 内側 */
  rInner: number
  /** 半径 (0-1), 外側 */
  rOuter: number
  /** 列数 (半径方向, row 1 = 内側) */
  rows: number
  /** 席数 (角度方向) */
  seats: number
  /** 席番が時計回りに増えるか */
  seatOrder: 'cw' | 'ccw'
}

// ─────────────────────────────────────────────────────────────
// アリーナ席 (コンサート時のフィールド中央)
// ------------------------------------------------------------
// 極座標ではなく デカルト矩形 で定義する。
// ステージはセンター (外野側) = SVG 上辺 (y 小) 固定想定、
// アリーナはその正面 (下方向) に広がる長方形群。
//
// 座標系: viewBox 0-1 正規化 (DomeBlock と共通の座標空間)
//   x=0.0 左, x=1.0 右 / y=0.0 上 (ステージ側), y=1.0 下 (ホーム側)
// ─────────────────────────────────────────────────────────────

export type ArenaBlock = {
  id: string
  ring: 'ARENA'
  /** 矩形左上 x (0-1) */
  x1: number
  /** 矩形左上 y (0-1) */
  y1: number
  /** 矩形右下 x (0-1) */
  x2: number
  /** 矩形右下 y (0-1) */
  y2: number
  /** 列数 (row 1 = ステージ側 y1 寄り) */
  rows: number
  /** 席数 (seat 1 = seatOrder に応じて左端 or 右端) */
  seats: number
  /** 席番が左→右に増えるか右→左に増えるか */
  seatOrder: 'ltr' | 'rtl'
}

/** DomeBlock (扇形) と ArenaBlock (矩形) の union */
export type TokyoDomeBlock = DomeBlock | ArenaBlock

// ─────────────────────────────────────────────────────────────
// ブロック生成ユーティリティ
// 番号付け方針:
//   - 各リングは「3塁寄りホーム付近で始まり、外野を回って1塁寄りホーム付近で終わる」
//   - ホーム裏 (180° 付近) は一部ブロック欠番 (貴賓席/ダッグアウト想定)
//   - 番号は小さいほどホーム寄り、大きいほど外野寄りにならない。
//     = ユーザー目線で「A25 はセンター真正面」となる番号を付けたいので、
//       3塁側ホーム → センター → 1塁側ホーム の順で連番を振る。
//       → A25 は 180° から時計回りにホーム周辺を除いた範囲の中央。
// ─────────────────────────────────────────────────────────────

type RingSpec = {
  ring: DomeBlock['ring']
  idPrefix: string
  firstIndex: number
  lastIndex: number
  /** 角度範囲 (ホーム付近の欠番を除外した後の扇形) */
  angleFromHome3B: number  // 番号 1 の開始角 (3塁側ホーム寄り)
  angleToHome1B: number    // 最終番号の終端角 (1塁側ホーム寄り)
  rInner: number
  rOuter: number
  rows: number
  seatsPerBlock: number
  /** 席番増加方向: ブロックごとの「内側から見た左端→右端」の向き */
  seatOrder: DomeBlock['seatOrder']
}

function buildRing(spec: RingSpec): DomeBlock[] {
  const count = spec.lastIndex - spec.firstIndex + 1
  const totalAngle = spec.angleToHome1B - spec.angleFromHome3B
  const step = totalAngle / count
  const blocks: DomeBlock[] = []
  for (let i = 0; i < count; i++) {
    const num = spec.firstIndex + i
    const angleStart = spec.angleFromHome3B + i * step
    const angleEnd = angleStart + step
    blocks.push({
      id: `${spec.idPrefix}${String(num).padStart(2, '0')}`,
      ring: spec.ring,
      angleStart,
      angleEnd,
      rInner: spec.rInner,
      rOuter: spec.rOuter,
      rows: spec.rows,
      seats: spec.seatsPerBlock,
      seatOrder: spec.seatOrder,
    })
  }
  return blocks
}

// 3塁側ホームを除外する際の基準角:
// 180° がホームベース裏の真後ろ。±20° をダッグアウト/貴賓席で除外。
//   → 3塁寄りホームの終端 = 200° (= 180+20)
//   → 1塁寄りホームの始端 = 160° (= 180-20) ※ 時計回りで1塁側から来るとこの角度
// よって時計回りに「200° → 360°(=0°) → 160°」の範囲に番号を割り当てる。
// 連続した範囲にするため、「200° → 520°(=160°+360)」として線形に処理する。
const HOME_EXCLUDE_HALF = 20 // ホーム裏の左右 ±20° を欠番
const ANGLE_3B_HOME = 180 + HOME_EXCLUDE_HALF  // 200°
const ANGLE_1B_HOME = 180 - HOME_EXCLUDE_HALF + 360 // 520° (= 160°+360, 時計回り連続)

// ─────────────────────────────────────────────────────────────
// A ring (1F 最内): A01-A48, 全周ホーム除く
// A ring は半径小さいので 1ブロックあたりの席数は少なめ
const A_BLOCKS = buildRing({
  ring: 'A', idPrefix: 'A', firstIndex: 1, lastIndex: 48,
  angleFromHome3B: ANGLE_3B_HOME, angleToHome1B: ANGLE_1B_HOME,
  rInner: 0.22, rOuter: 0.30,
  rows: 8, seatsPerBlock: 12, seatOrder: 'cw',
})

// B ring (1F 外側): B01-B48
const B_BLOCKS = buildRing({
  ring: 'B', idPrefix: 'B', firstIndex: 1, lastIndex: 48,
  angleFromHome3B: ANGLE_3B_HOME, angleToHome1B: ANGLE_1B_HOME,
  rInner: 0.30, rOuter: 0.37,
  rows: 8, seatsPerBlock: 14, seatOrder: 'cw',
})

// S ring (バックネット裏特別席): S01-S10
// ホーム裏のごく狭い範囲 (160°-200° の狭い範囲)
// angle 170° - 190° あたり
const S_BLOCKS: DomeBlock[] = (() => {
  const count = 10
  const angleFrom = 165
  const angleTo = 195
  const step = (angleTo - angleFrom) / count
  return Array.from({ length: count }, (_, i) => ({
    id: `S${String(i + 1).padStart(2, '0')}`,
    ring: 'S' as const,
    angleStart: angleFrom + i * step,
    angleEnd: angleFrom + (i + 1) * step,
    rInner: 0.37,
    rOuter: 0.42,
    rows: 5,
    seats: 10,
    seatOrder: 'cw' as const,
  }))
})()

// P ring (1塁側 特別席): P01-P12
// 1塁側ホーム寄り〜1塁ベース近辺: angle 100°-160° (時計回り)
const P_BLOCKS: DomeBlock[] = (() => {
  const count = 12
  const angleFrom = 100
  const angleTo = 160
  const step = (angleTo - angleFrom) / count
  return Array.from({ length: count }, (_, i) => ({
    id: `P${String(i + 1).padStart(2, '0')}`,
    ring: 'P' as const,
    angleStart: angleFrom + i * step,
    angleEnd: angleFrom + (i + 1) * step,
    rInner: 0.37,
    rOuter: 0.42,
    rows: 5,
    seats: 12,
    seatOrder: 'cw' as const,
  }))
})()

// T ring (3塁側 特別席): T01-T12
// 3塁側ホーム寄り〜3塁ベース近辺: angle 200°-260° (時計回り)
const T_BLOCKS: DomeBlock[] = (() => {
  const count = 12
  const angleFrom = 200
  const angleTo = 260
  const step = (angleTo - angleFrom) / count
  return Array.from({ length: count }, (_, i) => ({
    id: `T${String(i + 1).padStart(2, '0')}`,
    ring: 'T' as const,
    angleStart: angleFrom + i * step,
    angleEnd: angleFrom + (i + 1) * step,
    rInner: 0.37,
    rOuter: 0.42,
    rows: 5,
    seats: 12,
    seatOrder: 'cw' as const,
  }))
})()

// C ring (2F 内野): C01-C97, ドーム1周
// 97 = ホーム除かず (ホーム裏も C ブロックが存在) のためホーム除外なし
const C_BLOCKS: DomeBlock[] = (() => {
  const count = 97
  const angleFrom = 0
  const angleTo = 360
  const step = (angleTo - angleFrom) / count
  // C01 は 3塁側ホーム寄り (200°) スタートに合わせる
  const offset = ANGLE_3B_HOME
  return Array.from({ length: count }, (_, i) => ({
    id: `C${String(i + 1).padStart(2, '0')}`,
    ring: 'C' as const,
    angleStart: (offset + i * step) % 360,
    angleEnd: (offset + (i + 1) * step) % 360,
    rInner: 0.42,
    rOuter: 0.52,
    rows: 10,
    seats: 15,
    seatOrder: 'cw' as const,
  }))
})()

// D ring (2F 上段): D01-D51, ホーム除く 340°
const D_BLOCKS = buildRing({
  ring: 'D', idPrefix: 'D', firstIndex: 1, lastIndex: 51,
  angleFromHome3B: ANGLE_3B_HOME, angleToHome1B: ANGLE_1B_HOME,
  rInner: 0.52, rOuter: 0.62,
  rows: 10, seatsPerBlock: 18, seatOrder: 'cw',
})

// E ring (2F 最上段): E01-E46, ホーム除く
const E_BLOCKS = buildRing({
  ring: 'E', idPrefix: 'E', firstIndex: 1, lastIndex: 46,
  angleFromHome3B: ANGLE_3B_HOME, angleToHome1B: ANGLE_1B_HOME,
  rInner: 0.62, rOuter: 0.74,
  rows: 12, seatsPerBlock: 20, seatOrder: 'cw',
})

// F ring (バルコニー最上): F01-F19, ホーム除く
const F_BLOCKS = buildRing({
  ring: 'F', idPrefix: 'F', firstIndex: 1, lastIndex: 19,
  angleFromHome3B: ANGLE_3B_HOME, angleToHome1B: ANGLE_1B_HOME,
  rInner: 0.74, rOuter: 0.85,
  rows: 6, seatsPerBlock: 30, seatOrder: 'cw',
})

// G ring (外野): G03-G47, ステージ側中心
// 公式座席図では G03 から G47 まで (奇数飛び番含む実番号)
// ここでは G03-G47 の 45 個を ステージ側 270° (-45° 〜 +45° = 315°〜45°) にマップ
// (ステージ位置は角度 0° 近辺, ステージのすぐ裏も G の範囲)
const G_BLOCKS: DomeBlock[] = (() => {
  const ids: number[] = []
  for (let n = 3; n <= 47; n++) ids.push(n)
  const count = ids.length
  // 外野側は stage 近辺 (0°) の広い扇形。±90° (つまり 270°〜90° 時計回り = 360° 表現で 270°→450°)
  const angleFrom = 270
  const angleTo = 450
  const step = (angleTo - angleFrom) / count
  return ids.map((num, i) => ({
    id: `G${String(num).padStart(2, '0')}`,
    ring: 'G' as const,
    angleStart: (angleFrom + i * step) % 360,
    angleEnd: (angleFrom + (i + 1) * step) % 360,
    rInner: 0.22,
    rOuter: 0.55,
    rows: 20,
    seats: 12,
    seatOrder: 'cw' as const,
  }))
})()

// ─────────────────────────────────────────────────────────────
// ARENA ブロック (コンサート時のアリーナ席)
// ステージ=上 (y 小)、ホーム=下 (y 大)。正面 (y 方向) に A→B→C→D→E と並ぶ。
// 座標は近似値。参考画像入ったら微調整前提。
// ─────────────────────────────────────────────────────────────
const ARENA_BLOCKS: ArenaBlock[] = [
  // ARENA-A: ステージ最前 (センターステージ直下)
  { id: 'ARENA-A', ring: 'ARENA', x1: 0.30, y1: 0.18, x2: 0.70, y2: 0.28, rows: 10, seats: 30, seatOrder: 'ltr' },
  // ARENA-B: A の後ろ
  { id: 'ARENA-B', ring: 'ARENA', x1: 0.31, y1: 0.29, x2: 0.69, y2: 0.38, rows: 12, seats: 28, seatOrder: 'ltr' },
  // ARENA-C: 中央
  { id: 'ARENA-C', ring: 'ARENA', x1: 0.32, y1: 0.39, x2: 0.68, y2: 0.48, rows: 14, seats: 26, seatOrder: 'ltr' },
  // ARENA-D: ホーム寄り
  { id: 'ARENA-D', ring: 'ARENA', x1: 0.33, y1: 0.49, x2: 0.67, y2: 0.58, rows: 14, seats: 24, seatOrder: 'ltr' },
  // ARENA-E: ホーム最寄 (1-3塁ベース間付近)
  { id: 'ARENA-E', ring: 'ARENA', x1: 0.34, y1: 0.59, x2: 0.66, y2: 0.68, rows: 16, seats: 22, seatOrder: 'ltr' },
]

// ─────────────────────────────────────────────────────────────
// 公開: 全ブロック配列
export const TOKYO_DOME_BLOCKS: TokyoDomeBlock[] = [
  ...A_BLOCKS, // 48
  ...B_BLOCKS, // 48
  ...S_BLOCKS, // 10
  ...P_BLOCKS, // 12
  ...T_BLOCKS, // 12
  ...C_BLOCKS, // 97
  ...D_BLOCKS, // 51
  ...E_BLOCKS, // 46
  ...F_BLOCKS, // 19
  ...G_BLOCKS, // 45
  ...ARENA_BLOCKS, // 5
]

export type TokyoDomeRing = DomeBlock['ring'] | ArenaBlock['ring']

/** リングごとにブロックを取得 (UI のドロップダウン生成用) */
export function blocksByRing(): Record<TokyoDomeRing, TokyoDomeBlock[]> {
  const result: Record<TokyoDomeRing, TokyoDomeBlock[]> = {
    ARENA: [],
    A: [],
    B: [],
    S: [],
    P: [],
    T: [],
    C: [],
    D: [],
    E: [],
    F: [],
    G: [],
  }
  for (const b of TOKYO_DOME_BLOCKS) result[b.ring].push(b)
  return result
}
