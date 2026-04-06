import { countryToTimezone } from '@/lib/countryUtils'

/** 指定タイムゾーンの現在日を YYYY-MM-DD で返す */
export function getTodayInTZ(timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(new Date()) // en-CA → YYYY-MM-DD
}

/** ユーザーの居住国コードから今日の日付を返す（デフォルト: Asia/Tokyo） */
export function getTodayForCountry(countryCode?: string): string {
  const tz = countryToTimezone(countryCode ?? 'JP')
  return getTodayInTZ(tz)
}

/** JST の今日を返す（後方互換） */
export function getTodayJST(): string {
  return getTodayInTZ('Asia/Tokyo')
}
