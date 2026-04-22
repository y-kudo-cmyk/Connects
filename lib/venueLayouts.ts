// 会場別のアリーナレイアウト定義
// 参考画像を元に独自で作成 (著作権配慮 — 公式図面は不使用)
// 座標は正規化 (0-1). SVG viewBox は ArenaMap で 300x260 を使用。

export type SectionShape =
  | { kind: 'rect'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'polygon'; points: Array<[number, number]> }

export type VenueSection = {
  id: string
  // 翻訳キーを使うときは labelKey、そのまま表示するなら label
  labelKey?: string
  label?: string // 改行可 (\n)
  shape: SectionShape
  fill: string
  textColor: string
  fontSize?: number
  isStage?: boolean
  // ラベル描画位置 (省略時は bbox 中心)
  labelX?: number
  labelY?: number
}

export type VenueLayout = {
  id: string // 例: 'tokyoDome'
  displayName: string // 例: '東京ドーム'
  // venueName のマッチ用エイリアス (小文字化して部分一致で判定)
  aliases: string[]
  sections: VenueSection[]
  // 会場の外形 (ドーム形状等)。なければ viewBox 全体。
  outline?: { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
    | { kind: 'polygon'; points: Array<[number, number]> }
    | null
  // 備考 (開発中レイアウトの明示など)
  note?: string
}

// ── カラーパレット (セクション別) ────────────────────────────────
// pink=A系, blue=C系, green=B(バック), purple=D(2F), gray=ステージ周辺
const C = {
  stageBg: '#1C1C1E',
  stageText: '#FFFFFF',
  floor: { bg: '#EEF0F5', text: '#636366' },
  pink: { bg: '#F3B4E31A', text: '#C97AB8' },
  pinkDeep: { bg: '#F3B4E333', text: '#B04FA0' },
  blue: { bg: '#3B82F61A', text: '#2563EB' },
  blueDeep: { bg: '#3B82F633', text: '#1E3A8A' },
  green: { bg: '#34D3991A', text: '#059669' },
  greenDeep: { bg: '#34D39933', text: '#047857' },
  purple: { bg: '#A78BFA1A', text: '#7C3AED' },
  purpleDeep: { bg: '#A78BFA33', text: '#5B21B6' },
  orange: { bg: '#FB923C1A', text: '#EA580C' },
} as const

// ── 汎用アリーナ (既存 SECTIONS_BASE 互換) ───────────────────────
export const GENERIC_ARENA: VenueLayout = {
  id: 'generic',
  displayName: 'Generic Arena',
  aliases: [],
  sections: [
    { id: 'stage', label: 'STAGE', shape: { kind: 'rect', x1: 0.28, y1: 0.00, x2: 0.72, y2: 0.15 }, fill: C.stageBg, textColor: C.stageText, fontSize: 10, isStage: true },
    { id: 'floor', labelKey: 'Seat.arenaFloor', shape: { kind: 'rect', x1: 0.18, y1: 0.15, x2: 0.82, y2: 0.58 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 9 },
    { id: 'standA', labelKey: 'Seat.arenaStand', label: '\nA', shape: { kind: 'rect', x1: 0.00, y1: 0.15, x2: 0.18, y2: 0.78 }, fill: C.pink.bg, textColor: C.pink.text, fontSize: 8 },
    { id: 'standC', labelKey: 'Seat.arenaStand', label: '\nC', shape: { kind: 'rect', x1: 0.82, y1: 0.15, x2: 1.00, y2: 0.78 }, fill: C.blue.bg, textColor: C.blue.text, fontSize: 8 },
    { id: 'standB', labelKey: 'Seat.arenaStand', label: ' B', shape: { kind: 'rect', x1: 0.18, y1: 0.58, x2: 0.82, y2: 0.78 }, fill: C.green.bg, textColor: C.green.text, fontSize: 9 },
    { id: 'standD', labelKey: 'Seat.arenaStand', label: ' D / 2F', shape: { kind: 'rect', x1: 0.18, y1: 0.78, x2: 0.82, y2: 1.00 }, fill: C.purple.bg, textColor: C.purple.text, fontSize: 9 },
    { id: 'standA2', label: '2F\nA', shape: { kind: 'rect', x1: 0.00, y1: 0.78, x2: 0.18, y2: 1.00 }, fill: C.pink.bg, textColor: C.pink.text, fontSize: 7 },
    { id: 'standC2', label: '2F\nC', shape: { kind: 'rect', x1: 0.82, y1: 0.78, x2: 1.00, y2: 1.00 }, fill: C.blue.bg, textColor: C.blue.text, fontSize: 7 },
  ],
}

// ── 東京ドーム ───────────────────────────────────────────────
// SEVENTEEN 公演のステージ位置 (ホーム側寄り) を上辺に想定。
// 配置: STAGE(上) → アリーナ(中央, A-E ブロック) → 1塁/3塁内野 (左右) →
//       2階内野 → 2階外野。 座標は参考画像取り込み後に微調整予定。
export const TOKYO_DOME: VenueLayout = {
  id: 'tokyoDome',
  displayName: '東京ドーム',
  aliases: ['東京ドーム', 'tokyodome', 'tokyo dome', 'ｔｏｋｙｏ', 'big egg', '東京 dome'],
  note: '暫定版。参考画像で座標調整予定。',
  outline: { kind: 'ellipse', cx: 0.5, cy: 0.5, rx: 0.48, ry: 0.48 },
  sections: [
    // STAGE (上端センター)
    { id: 'stage', label: 'STAGE', shape: { kind: 'rect', x1: 0.30, y1: 0.02, x2: 0.70, y2: 0.14 }, fill: C.stageBg, textColor: C.stageText, fontSize: 10, isStage: true },

    // アリーナブロック (A: ステージ寄り / B / C / D / E: 後方)
    // アリーナは5段に分割。横幅は floor 部分 x 0.22-0.78
    { id: 'arenaA', label: 'ARENA\nA', shape: { kind: 'rect', x1: 0.30, y1: 0.15, x2: 0.70, y2: 0.24 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaB', label: 'ARENA\nB', shape: { kind: 'rect', x1: 0.26, y1: 0.25, x2: 0.74, y2: 0.33 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaC', label: 'ARENA\nC', shape: { kind: 'rect', x1: 0.24, y1: 0.34, x2: 0.76, y2: 0.42 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaD', label: 'ARENA\nD', shape: { kind: 'rect', x1: 0.24, y1: 0.43, x2: 0.76, y2: 0.50 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaE', label: 'ARENA\nE', shape: { kind: 'rect', x1: 0.26, y1: 0.51, x2: 0.74, y2: 0.58 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },

    // 1塁側内野 1F (右)
    { id: 'infield1B_1F', label: '1塁\n内野\n1F', shape: { kind: 'rect', x1: 0.77, y1: 0.15, x2: 0.92, y2: 0.55 }, fill: C.blue.bg, textColor: C.blue.text, fontSize: 8 },
    // 3塁側内野 1F (左)
    { id: 'infield3B_1F', label: '3塁\n内野\n1F', shape: { kind: 'rect', x1: 0.08, y1: 0.15, x2: 0.23, y2: 0.55 }, fill: C.pink.bg, textColor: C.pink.text, fontSize: 8 },

    // 外野 1F (下 = ステージ反対側)
    { id: 'outfield_1F', label: '外野 1F', shape: { kind: 'rect', x1: 0.20, y1: 0.60, x2: 0.80, y2: 0.72 }, fill: C.green.bg, textColor: C.green.text, fontSize: 9 },

    // 2F 内野 1塁 / 3塁
    { id: 'infield1B_2F', label: '1塁\n2F', shape: { kind: 'rect', x1: 0.77, y1: 0.56, x2: 0.92, y2: 0.80 }, fill: C.blueDeep.bg, textColor: C.blueDeep.text, fontSize: 7 },
    { id: 'infield3B_2F', label: '3塁\n2F', shape: { kind: 'rect', x1: 0.08, y1: 0.56, x2: 0.23, y2: 0.80 }, fill: C.pinkDeep.bg, textColor: C.pinkDeep.text, fontSize: 7 },
    // 2F 外野
    { id: 'outfield_2F', label: '外野 2F', shape: { kind: 'rect', x1: 0.20, y1: 0.73, x2: 0.80, y2: 0.85 }, fill: C.greenDeep.bg, textColor: C.greenDeep.text, fontSize: 8 },

    // バルコニー (最上段、ドーム周回)
    { id: 'balcony', label: 'バルコニー', shape: { kind: 'rect', x1: 0.06, y1: 0.86, x2: 0.94, y2: 0.96 }, fill: C.purple.bg, textColor: C.purple.text, fontSize: 8 },
  ],
}

// ── 京セラドーム大阪 ──────────────────────────────────────────
// 楕円形ドーム。3層スタンド (下段 / 中段 / 上段)。
// SEVENTEEN 公演でのステージは片側に設置。
export const KYOCERA_DOME: VenueLayout = {
  id: 'kyoceraDome',
  displayName: '京セラドーム大阪',
  aliases: ['京セラドーム', 'kyoceradome', 'kyocera dome', '京セラドーム大阪', '大阪ドーム', 'osaka dome'],
  note: '暫定版。参考画像で座標調整予定。',
  outline: { kind: 'ellipse', cx: 0.5, cy: 0.5, rx: 0.48, ry: 0.46 },
  sections: [
    // STAGE (上端)
    { id: 'stage', label: 'STAGE', shape: { kind: 'rect', x1: 0.30, y1: 0.03, x2: 0.70, y2: 0.14 }, fill: C.stageBg, textColor: C.stageText, fontSize: 10, isStage: true },

    // アリーナ (A-F ブロック想定)
    { id: 'arenaA', label: 'ARENA\nA', shape: { kind: 'rect', x1: 0.30, y1: 0.16, x2: 0.70, y2: 0.23 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaB', label: 'ARENA\nB', shape: { kind: 'rect', x1: 0.28, y1: 0.24, x2: 0.72, y2: 0.31 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaC', label: 'ARENA\nC', shape: { kind: 'rect', x1: 0.26, y1: 0.32, x2: 0.74, y2: 0.39 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaD', label: 'ARENA\nD', shape: { kind: 'rect', x1: 0.26, y1: 0.40, x2: 0.74, y2: 0.47 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },
    { id: 'arenaE', label: 'ARENA\nE', shape: { kind: 'rect', x1: 0.28, y1: 0.48, x2: 0.72, y2: 0.54 }, fill: C.floor.bg, textColor: C.floor.text, fontSize: 8 },

    // 1塁側 下段 (右)
    { id: 'lower1B', label: '1塁側\n下段', shape: { kind: 'rect', x1: 0.76, y1: 0.15, x2: 0.91, y2: 0.50 }, fill: C.blue.bg, textColor: C.blue.text, fontSize: 8 },
    // 3塁側 下段 (左)
    { id: 'lower3B', label: '3塁側\n下段', shape: { kind: 'rect', x1: 0.09, y1: 0.15, x2: 0.24, y2: 0.50 }, fill: C.pink.bg, textColor: C.pink.text, fontSize: 8 },

    // 外野下段 (ステージ反対側)
    { id: 'lowerOut', label: '外野 下段', shape: { kind: 'rect', x1: 0.22, y1: 0.56, x2: 0.78, y2: 0.66 }, fill: C.green.bg, textColor: C.green.text, fontSize: 9 },

    // 中段 (1塁側 / 3塁側 / 外野)
    { id: 'mid1B', label: '1塁側\n中段', shape: { kind: 'rect', x1: 0.76, y1: 0.51, x2: 0.91, y2: 0.72 }, fill: C.blueDeep.bg, textColor: C.blueDeep.text, fontSize: 7 },
    { id: 'mid3B', label: '3塁側\n中段', shape: { kind: 'rect', x1: 0.09, y1: 0.51, x2: 0.24, y2: 0.72 }, fill: C.pinkDeep.bg, textColor: C.pinkDeep.text, fontSize: 7 },
    { id: 'midOut', label: '外野 中段', shape: { kind: 'rect', x1: 0.22, y1: 0.67, x2: 0.78, y2: 0.78 }, fill: C.greenDeep.bg, textColor: C.greenDeep.text, fontSize: 8 },

    // 上段 (パノラマ周回)
    { id: 'upper1B', label: '1塁側\n上段', shape: { kind: 'rect', x1: 0.76, y1: 0.73, x2: 0.91, y2: 0.92 }, fill: C.orange.bg, textColor: C.orange.text, fontSize: 7 },
    { id: 'upper3B', label: '3塁側\n上段', shape: { kind: 'rect', x1: 0.09, y1: 0.73, x2: 0.24, y2: 0.92 }, fill: C.orange.bg, textColor: C.orange.text, fontSize: 7 },
    { id: 'upperOut', label: '外野 上段', shape: { kind: 'rect', x1: 0.22, y1: 0.79, x2: 0.78, y2: 0.92 }, fill: C.purple.bg, textColor: C.purple.text, fontSize: 8 },
  ],
}

// ── レジストリ ────────────────────────────────────────────────
export const VENUE_LAYOUTS: VenueLayout[] = [
  TOKYO_DOME,
  KYOCERA_DOME,
  // 今後追加: 埼玉スーパーアリーナ, ナゴヤドーム, PayPayドーム, 札幌ドーム 等
]

/** venue 名 (自由入力) からレイアウト ID を推定。見つからなければ null。 */
export function resolveVenueLayout(venueName?: string | null): VenueLayout | null {
  if (!venueName) return null
  const normalized = venueName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[‐-－ー]/g, '') // ハイフン/ダッシュ類を除去
  for (const v of VENUE_LAYOUTS) {
    for (const alias of v.aliases) {
      const a = alias.toLowerCase().replace(/\s+/g, '').replace(/[‐-－ー]/g, '')
      if (a && normalized.includes(a)) return v
    }
  }
  return null
}
