export type Country = { code: string; nameJa: string; timezone: string }

export const COUNTRIES: Country[] = [
  { code: 'JP', nameJa: '日本',           timezone: 'Asia/Tokyo' },
  { code: 'KR', nameJa: '韓国',           timezone: 'Asia/Seoul' },
  { code: 'US', nameJa: 'アメリカ',       timezone: 'America/New_York' },
  { code: 'GB', nameJa: 'イギリス',       timezone: 'Europe/London' },
  { code: 'AU', nameJa: 'オーストラリア', timezone: 'Australia/Sydney' },
  { code: 'CA', nameJa: 'カナダ',         timezone: 'America/Toronto' },
  { code: 'CN', nameJa: '中国',           timezone: 'Asia/Shanghai' },
  { code: 'TW', nameJa: '台湾',           timezone: 'Asia/Taipei' },
  { code: 'HK', nameJa: '香港',           timezone: 'Asia/Hong_Kong' },
  { code: 'SG', nameJa: 'シンガポール',   timezone: 'Asia/Singapore' },
  { code: 'TH', nameJa: 'タイ',           timezone: 'Asia/Bangkok' },
  { code: 'MY', nameJa: 'マレーシア',     timezone: 'Asia/Kuala_Lumpur' },
  { code: 'PH', nameJa: 'フィリピン',     timezone: 'Asia/Manila' },
  { code: 'ID', nameJa: 'インドネシア',   timezone: 'Asia/Jakarta' },
  { code: 'VN', nameJa: 'ベトナム',       timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'IN', nameJa: 'インド',         timezone: 'Asia/Kolkata' },
  { code: 'FR', nameJa: 'フランス',       timezone: 'Europe/Paris' },
  { code: 'DE', nameJa: 'ドイツ',         timezone: 'Europe/Berlin' },
  { code: 'MX', nameJa: 'メキシコ',       timezone: 'America/Mexico_City' },
  { code: 'BR', nameJa: 'ブラジル',       timezone: 'America/Sao_Paulo' },
]

/** ISO 2文字コード → 国旗絵文字 */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍'
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

/** 'Seoul, KR' → 'KR' */
export function cityToCountryCode(city: string): string {
  if (!city) return ''
  const parts = city.split(', ')
  return parts[parts.length - 1] ?? ''
}

/** 国コード → タイムゾーン */
export function countryToTimezone(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.timezone ?? 'Asia/Tokyo'
}
