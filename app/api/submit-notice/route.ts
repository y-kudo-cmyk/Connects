import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TAGS = new Set([
  'CONCERT',
  'TICKET',
  'CD',
  'LUCKY_DRAW',
  'POPUP',
  'MERCH',
  'RELEASE',
  'BIRTHDAY',
  'MAGAZINE',
  'EVENT',
  'TV',
  'YOUTUBE',
  'RADIO',
  'LIVEVIEWING',
  'INFO',
])

// schedule_tags.id にあわせてアプリ側 CONCERT → DB 側 LIVE にマップ
function mapTagToDb(tag: string): string {
  if (tag === 'CONCERT') return 'LIVE'
  return tag
}

type InputEvent = {
  event_title?: unknown
  sub_event_title?: unknown
  start_date?: unknown
  end_date?: unknown
  start_time?: unknown
  tag?: unknown
  country?: unknown
  spot_name?: unknown
  source_url?: unknown
  image_url?: unknown
  notes?: unknown
}

function buildStartTimestamp(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':')
    const hh = h.padStart(2, '0')
    return `${dateStr}T${hh}:${m}:00`
  }
  return `${dateStr}T00:00:00`
}

function buildEndTimestamp(dateStr: string): string | null {
  if (!dateStr) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  return `${dateStr}T23:59:59`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? null
  if (role !== 'fam' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const events: unknown = body?.events
    const noticeImageUrl: string = typeof body?.imageUrl === 'string' ? body.imageUrl : ''

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'events が空です' }, { status: 400 })
    }

    const rows: Record<string, unknown>[] = []
    const errors: string[] = []

    for (let i = 0; i < events.length; i++) {
      const e = events[i] as InputEvent
      const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
      const title = str(e.event_title)
      if (!title) {
        errors.push(`#${i + 1}: event_title が空`)
        continue
      }

      let tag = str(e.tag).toUpperCase().replace(/\s+/g, '_')
      if (tag === 'LIVE' || tag === 'LIVE_CONCERT') tag = 'CONCERT'
      if (!ALLOWED_TAGS.has(tag)) tag = 'INFO'

      const startDate = str(e.start_date)
      const endDate = str(e.end_date)
      const startTime = str(e.start_time)

      if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        errors.push(`#${i + 1}: start_date 形式不正 (${startDate})`)
        continue
      }
      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        errors.push(`#${i + 1}: end_date 形式不正 (${endDate})`)
        continue
      }

      let country = str(e.country).toUpperCase()
      if (country.length !== 2) country = ''

      const sourceUrl = str(e.source_url)
      const imageUrl = str(e.image_url) || noticeImageUrl || ''

      rows.push({
        tag: mapTagToDb(tag),
        artist_id: 'A000000', // SEVENTEEN (scrape-weverse と合わせる)
        related_artists: '',
        event_title: title,
        sub_event_title: str(e.sub_event_title),
        start_date: buildStartTimestamp(startDate, startTime),
        end_date: endDate ? buildEndTimestamp(endDate) : null,
        spot_name: str(e.spot_name),
        country,
        image_url: imageUrl,
        source_url: sourceUrl,
        notes: str(e.notes),
        status: 'pending',
        verified_count: 0,
        submitted_by: user.id,
      })
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: '有効なイベントがありません', details: errors },
        { status: 400 },
      )
    }

    const { data, error } = await supabase.from('events').insert(rows).select('id')
    if (error) {
      console.error('[submit-notice] insert error:', error)
      return NextResponse.json(
        { error: error.message, details: errors },
        { status: 500 },
      )
    }

    return NextResponse.json({
      inserted: data?.length ?? 0,
      ids: data?.map((r) => r.id) ?? [],
      warnings: errors,
    })
  } catch (e) {
    console.error('submit-notice error:', e)
    const message = e instanceof Error ? e.message : 'server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
