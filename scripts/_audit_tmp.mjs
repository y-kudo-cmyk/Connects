import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function log(...a) { console.log(...a) }

// 1. spots integrity
const { data: spots } = await s.from('spots').select('id, spot_name, lat, lng, spot_address, related_artists, source_url, image_url, memo, original_submitter_email, submitted_by')
log(`TOTAL spots: ${spots.length}`)

const noLat = spots.filter(p => p.lat === null || p.lng === null || p.lat === 0 || p.lng === 0)
log(`  spots with NULL/0 lat-lng: ${noLat.length}`)
for (const p of noLat.slice(0,5)) log(`    ${p.id} | ${p.spot_name} | lat=${p.lat} lng=${p.lng}`)

const badAddr = spots.filter(p => p.spot_address && /(\d{1,2}:\d{2}|open|close|営業|定休)/i.test(p.spot_address))
log(`  spots with suspicious addresses (times/hours): ${badAddr.length}`)
for (const p of badAddr.slice(0,5)) log(`    ${p.id} | ${p.spot_name} | addr="${p.spot_address}"`)

const commaTags = spots.filter(p => p.related_artists && p.related_artists.includes(',') && !p.related_artists.includes('#'))
log(`  spots with comma-separated related_artists (wrong format): ${commaTags.length}`)
for (const p of commaTags.slice(0,5)) log(`    ${p.id} | ra="${p.related_artists}"`)

// duplicate spot_name + lat/lng
const spotKey = new Map()
for (const p of spots) {
  if (!p.lat || !p.lng) continue
  const k = `${p.spot_name}::${p.lat.toFixed(4)}::${p.lng.toFixed(4)}`
  if (!spotKey.has(k)) spotKey.set(k, [])
  spotKey.get(k).push(p.id)
}
const dupSpots = [...spotKey.entries()].filter(([, arr]) => arr.length > 1)
log(`  duplicate spots (same name+lat/lng): ${dupSpots.length}`)
for (const [k, arr] of dupSpots.slice(0,5)) log(`    "${k}" -> ${arr.join(',')}`)

// 2. spot_photos integrity
const { data: photos } = await s.from('spot_photos').select('id, spot_id, image_url, source_url, tags, contributor, visit_date, status, votes')
log(`\nTOTAL spot_photos: ${photos.length}`)

const spotIds = new Set(spots.map(p => p.id))
const orphanPhotos = photos.filter(p => !spotIds.has(p.spot_id))
log(`  orphan photos (spot_id not in spots): ${orphanPhotos.length}`)
for (const p of orphanPhotos.slice(0,5)) log(`    photo=${p.id} spot_id=${p.spot_id}`)

// photo tags format: should use # prefix
const commaTagPhotos = photos.filter(p => p.tags && p.tags.includes(',') && !p.tags.includes('#'))
log(`  photos with comma-separated tags (wrong format): ${commaTagPhotos.length}`)
for (const p of commaTagPhotos.slice(0,5)) log(`    ${p.id} | tags="${p.tags}"`)

// same image_url linked to different spots
const imgMap = new Map()
for (const p of photos) {
  if (!p.image_url) continue
  if (!imgMap.has(p.image_url)) imgMap.set(p.image_url, new Set())
  imgMap.get(p.image_url).add(p.spot_id)
}
const sharedImgs = [...imgMap.entries()].filter(([, set]) => set.size > 1)
log(`  image_url linked to >1 spot: ${sharedImgs.length}`)
for (const [u, set] of sharedImgs.slice(0,5)) log(`    ${u.slice(-40)} -> [${[...set].join(',')}]`)

// invalid status
const badStatus = photos.filter(p => p.status && !['pending','confirmed','rejected'].includes(p.status))
log(`  photos with invalid status: ${badStatus.length}`)
for (const p of badStatus.slice(0,5)) log(`    ${p.id} status=${p.status}`)

// members tagged but no photo for that spot - i.e. related_artists list members but spot has zero spot_photos
const photosBySpot = new Map()
for (const p of photos) {
  photosBySpot.set(p.spot_id, (photosBySpot.get(p.spot_id)||0)+1)
}
const taggedNoPhoto = spots.filter(p => {
  const ra = p.related_artists || ''
  const hasMemberTag = /#[A-Za-z]/.test(ra) && !/^#SEVENTEEN\s*$/i.test(ra.trim())
  return hasMemberTag && !photosBySpot.get(p.id)
})
log(`  spots tagged with member but 0 spot_photos: ${taggedNoPhoto.length}`)

// 3. events integrity
const { data: events } = await s.from('events').select('id, event_title, sub_event_title, tag, start_date, end_date, country, source_url, spot_name, created_at, submitted_by')
log(`\nTOTAL events: ${events.length}`)

const badDates = events.filter(e => {
  if (!e.start_date) return false
  const y = new Date(e.start_date).getFullYear()
  return y < 2015 || y > 2030
})
log(`  events with absurd year: ${badDates.length}`)
for (const e of badDates.slice(0,5)) log(`    ${e.id} | start=${e.start_date} | ${e.event_title}`)

const endBeforeStart = events.filter(e => e.end_date && e.start_date && e.end_date < e.start_date)
log(`  events with end_date < start_date: ${endBeforeStart.length}`)
for (const e of endBeforeStart.slice(0,5)) log(`    ${e.id} | s=${e.start_date} e=${e.end_date} | ${e.event_title}`)

// event duplicates
const evKey = new Map()
for (const e of events) {
  const k = `${e.event_title}::${e.start_date?.slice(0,10)}::${e.country||''}`
  if (!evKey.has(k)) evKey.set(k, [])
  evKey.get(k).push(e.id)
}
const dupEvents = [...evKey.entries()].filter(([, arr]) => arr.length > 1)
log(`  duplicate events (same title+start+country): ${dupEvents.length}`)
for (const [k, arr] of dupEvents.slice(0,8)) log(`    "${k}" -> ${arr.join(',')}`)

// 4. my_entries integrity
const { data: myEntries } = await s.from('my_entries').select('id, user_id, event_id, event_title, start_date, end_date, tag, image_url, ticket_image_url')
log(`\nTOTAL my_entries: ${myEntries.length}`)
const evIds = new Set(events.map(e => e.id))
const orphanEntries = myEntries.filter(e => e.event_id && !evIds.has(e.event_id))
log(`  my_entries with event_id not in events: ${orphanEntries.length}`)

const missingTitle = myEntries.filter(e => !e.event_title)
log(`  my_entries with no event_title: ${missingTitle.length}`)

// 5. card_master vs card_versions vs card_products prefix mismatch
const { data: products } = await s.from('card_products').select('product_id, product_name, region')
const { data: versions } = await s.from('card_versions').select('version_id, product_id, version_name')
const { data: cardMaster } = await s.from('card_master').select('card_master_id, version_id, product_id, member_id, tier')
log(`\nTOTAL products=${products.length} versions=${versions.length} cards=${cardMaster.length}`)

const productIds = new Set(products.map(p => p.product_id))
const versionMap = new Map(versions.map(v => [v.version_id, v]))

const orphanVersions = versions.filter(v => !productIds.has(v.product_id))
log(`  orphan card_versions (no parent product): ${orphanVersions.length}`)
for (const v of orphanVersions.slice(0,5)) log(`    ${v.version_id} -> product_id=${v.product_id}`)

const orphanCards = cardMaster.filter(c => !versionMap.has(c.version_id))
log(`  orphan card_master (no parent version): ${orphanCards.length}`)
for (const c of orphanCards.slice(0,5)) log(`    ${c.card_master_id} version_id=${c.version_id}`)

// version_id prefix mismatch w/ product_id (V_JP002_* under P_JP011)
const prefixMismatch = []
for (const v of versions) {
  if (!v.version_id || !v.product_id) continue
  const m = v.version_id.match(/^V_([A-Z]+)(\d+)/)
  const p = v.product_id.match(/^P_([A-Z]+)(\d+)/)
  if (m && p && (m[1] !== p[1] || m[2] !== p[2])) {
    prefixMismatch.push({ version_id: v.version_id, product_id: v.product_id })
  }
}
log(`  version_id prefix mismatches with product_id: ${prefixMismatch.length}`)
for (const x of prefixMismatch.slice(0,10)) log(`    ${x.version_id} under ${x.product_id}`)

// card_master with product_id != version's product_id
const cardProductMismatch = cardMaster.filter(c => {
  const v = versionMap.get(c.version_id)
  return v && c.product_id && v.product_id && c.product_id !== v.product_id
})
log(`  card_master.product_id differs from its version.product_id: ${cardProductMismatch.length}`)
for (const c of cardProductMismatch.slice(0,5)) log(`    ${c.card_master_id} card.p=${c.product_id} version.p=${versionMap.get(c.version_id).product_id}`)

// tier enum
const validTiers = new Set(['INCLUDED','STORE_JP','STORE_KR','LUCKY_DRAW','EVENT','VENUE','MERCH_BONUS'])
const badTiers = cardMaster.filter(c => c.tier && !validTiers.has(c.tier))
log(`  card_master with unexpected tier: ${badTiers.length}`)
for (const c of badTiers.slice(0,8)) log(`    ${c.card_master_id} tier=${c.tier}`)

// 6. profiles / glide_users
const { data: profiles } = await s.from('profiles').select('id, mail, role, line_user_id')
log(`\nTOTAL profiles: ${profiles.length}`)
const emailMap = new Map()
for (const p of profiles) {
  if (!p.mail) continue
  const e = p.mail.toLowerCase().trim()
  if (!emailMap.has(e)) emailMap.set(e, [])
  emailMap.get(e).push(p.id)
}
const dupProfileEmails = [...emailMap.entries()].filter(([, arr]) => arr.length > 1)
log(`  profiles sharing email: ${dupProfileEmails.length}`)
for (const [e, arr] of dupProfileEmails.slice(0,5)) log(`    ${e} -> [${arr.join(',')}]`)

const admins = profiles.filter(p => p.role === 'admin')
log(`  admins: ${admins.length}`)

const { data: osEmails } = await s.from('spots').select('id, original_submitter_email').not('original_submitter_email','is',null)
log(`  spots still holding original_submitter_email: ${osEmails.length}`)

// 7. user_activity growth
const { count: activityCount } = await s.from('user_activity').select('*', { count: 'exact', head: true })
log(`\nuser_activity rows: ${activityCount}`)

// last 7 days
const wk = new Date(Date.now() - 7*86400000).toISOString()
const { count: recentActivity } = await s.from('user_activity').select('*', { count: 'exact', head: true }).gte('created_at', wk)
log(`  user_activity rows last 7d: ${recentActivity}`)

// 8. events tag enum
const validTags = new Set(['LIVE','TICKET','CD','TV','POPUP','MERCH','MAGAZINE','EVENT','LIVEVIEWING','INFO','RADIO','YOUTUBE','BIRTHDAY'])
const badEventTags = events.filter(e => e.tag && !validTags.has(e.tag))
log(`  events with tag outside icon set: ${badEventTags.length}`)
for (const e of badEventTags.slice(0,5)) log(`    ${e.id} tag=${e.tag} | ${e.event_title}`)

// spot genres
const validGenres = new Set(['cafe','restaurant','shop','accommodation','location','other','popup','landmark','studio','venue'])
const { data: spotGenres } = await s.from('spots').select('id, genre')
const badGenres = spotGenres.filter(p => p.genre && !validGenres.has(p.genre))
log(`  spots with genre outside assumed list: ${badGenres.length} (first few:)`)
for (const p of badGenres.slice(0,6)) log(`    ${p.id} genre=${p.genre}`)

// 9. favorite_spots orphan
const { data: favs } = await s.from('favorite_spots').select('spot_id')
const orphanFavs = favs.filter(f => !spotIds.has(f.spot_id))
log(`\n  favorite_spots orphan: ${orphanFavs.length}/${favs.length}`)

// 10. photo contributors vs profiles
const nonEmptyContrib = photos.filter(p => p.contributor && p.contributor.trim()).length
log(`  photos with contributor text set: ${nonEmptyContrib}`)
