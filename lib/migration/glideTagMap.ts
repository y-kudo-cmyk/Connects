/**
 * Glide 時代のタグを新アプリの scheduleTagConfig キーに正規化
 * Glide 側は日本語/英語混在だったのを統一
 */
const TAG_MAP: Record<string, string> = {
  // 公演系
  'LIVE':       'CONCERT',
  'CONCERT':    'CONCERT',
  'FANMEETING': 'CONCERT',
  // TICKET
  'TICKET':     'TICKET',
  // ライブ視聴
  'LIVEVIEWING':'LIVEVIEWING',
  'LV':         'LIVEVIEWING',
  // リリース
  'RELEASE':    'CD',
  'CD':         'CD',
  // 誕生日
  '誕生日':      'BIRTHDAY',
  'BIRTHDAY':   'BIRTHDAY',
  // イベント
  'EVENT':      'EVENT',
  'POPUP':      'POPUP',
  'POP-UP':     'POPUP',
  // メディア
  'TV':         'TV',
  '雑誌':        'MAGAZINE',
  'MAGAZINE':   'MAGAZINE',
  'RADIO':      'RADIO',
  'YOUTUBE':    'YOUTUBE',
  // グッズ
  'GOODS':      'MERCH',
  'MERCH':      'MERCH',
  // 告知 / INFO
  '告知':        'INFO',
  'INFO':       'INFO',
}

export function normalizeGlideTag(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim().toUpperCase()
  // キーは大文字統一で検索、無ければ元の日本語キーで検索
  return TAG_MAP[trimmed] || TAG_MAP[input.trim()] || input.trim() || null
}

/**
 * event_title + start_date で events テーブルを検索して event_id を返す
 * 完全一致 → タイトル前方一致のフォールバック
 */
export async function findEventId(
  sb: { from: (t: string) => { select: (c: string) => { eq: (k: string, v: unknown) => { gte: (k2: string, v2: unknown) => { lt: (k3: string, v3: unknown) => { limit: (n: number) => Promise<{ data: { id: string }[] | null }> } } } } } },
  title: string,
  startDateIso: string | null
): Promise<string | null> {
  if (!title || !startDateIso) return null
  const day = startDateIso.slice(0, 10)
  if (!day) return null
  const dayStart = `${day}T00:00:00Z`
  const nextDay = new Date(new Date(day).getTime() + 86400000).toISOString().slice(0, 10)
  const dayEnd = `${nextDay}T00:00:00Z`

  // 同日かつタイトル完全一致
  const { data: exact } = await sb.from('events')
    .select('id')
    .eq('event_title', title.trim())
    .gte('start_date', dayStart)
    .lt('start_date', dayEnd)
    .limit(1) as { data: { id: string }[] | null }
  if (exact && exact.length > 0) return exact[0].id
  return null
}
