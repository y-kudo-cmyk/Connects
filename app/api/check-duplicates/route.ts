import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Cron or admin 呼び出し用: events テーブルの重複候補を検出 + admin LINE 通知
export async function GET(req: NextRequest) {
  // 認証: CRON_SECRET or ADMIN_API_SECRET
  const auth = req.headers.get('authorization') || ''
  const bearer = auth.replace(/^Bearer\s+/, '')
  const secret = process.env.CRON_SECRET || process.env.ADMIN_API_SECRET || ''
  if (!secret || (bearer !== secret)) {
    // Vercel Cron は User-Agent に 'vercel-cron' を入れるので許可
    if (!req.headers.get('user-agent')?.includes('vercel-cron')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const duplicates = await detectDuplicates(sb)

  // 重複があれば admin に LINE 通知
  if (duplicates.length > 0) {
    const lines = duplicates.slice(0, 10).map((d, i) =>
      `${i + 1}. [${d.tag}] ${d.date} ${d.title}\n   ID: ${d.ids.join(', ')}`
    )
    const message = `【スケジュール重複検知】\n${duplicates.length}件の重複候補:\n\n${lines.join('\n\n')}`
    await notifyAdminsLine(sb, message)
  }

  return NextResponse.json({ found: duplicates.length, duplicates })
}

type Evt = {
  id: string
  event_title: string
  tag: string | null
  start_date: string | null
  end_date: string | null
  spot_name: string | null
  spot_address: string | null
  cancelled: boolean | null
}

function normalize(title: string): string {
  return (title || '')
    .replace(/[『』「」【】\s　()（）]/g, '')
    .toLowerCase()
}

async function detectDuplicates(sb: ReturnType<typeof createServiceClient>): Promise<Array<{ title: string; tag: string; date: string; ids: string[] }>> {
  // 今日以降のイベントだけチェック（過去の重複は今さら）
  const today = new Date().toISOString().slice(0, 10)
  const { data: events } = await sb.from('events')
    .select('id, event_title, tag, start_date, end_date, spot_name, spot_address, cancelled')
    .gte('start_date', today + 'T00:00:00')
    .or('cancelled.eq.false,cancelled.is.null')
    .order('start_date')

  if (!events) return []

  // Group by (normalized_title + tag + date_bucket)
  const groups = new Map<string, Evt[]>()
  for (const e of events as Evt[]) {
    if (!e.start_date) continue
    const key = `${normalize(e.event_title)}|${e.tag || ''}|${e.start_date.slice(0, 10)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(e)
  }

  const dupes: Array<{ title: string; tag: string; date: string; ids: string[] }> = []
  for (const [, list] of groups) {
    if (list.length < 2) continue
    // 同じspotなら重複、異なるspotなら別物として扱う
    const bySpot = new Map<string, Evt[]>()
    for (const e of list) {
      const sp = (e.spot_name || '') + '|' + (e.spot_address || '')
      if (!bySpot.has(sp)) bySpot.set(sp, [])
      bySpot.get(sp)!.push(e)
    }
    for (const [, sameSpot] of bySpot) {
      if (sameSpot.length < 2) continue
      dupes.push({
        title: sameSpot[0].event_title,
        tag: sameSpot[0].tag || '',
        date: sameSpot[0].start_date?.slice(0, 10) || '',
        ids: sameSpot.map(e => e.id),
      })
    }
  }
  return dupes
}

async function notifyAdminsLine(sb: ReturnType<typeof createServiceClient>, message: string) {
  const { data: admins } = await sb.from('profiles').select('line_user_id').eq('role', 'admin').not('line_user_id', 'is', null).neq('line_user_id', '')
  if (!admins?.length) return
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  for (const a of admins) {
    try {
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: a.line_user_id, messages: [{ type: 'text', text: message.slice(0, 2000) }] }),
      })
    } catch (e) {
      console.error('LINE push err:', e)
    }
  }
}
