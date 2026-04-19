/**
 * SEVENTEENワールドツアー海外公演データ（日本・韓国以外）をeventsテーブルに挿入
 *
 * ソース: Wikipedia各ツアー記事
 * - Diamond Edge World Tour (2017)
 * - Ideal Cut Tour (2018)
 * - Ode to You World Tour (2019-2020)
 * - Be the Sun World Tour (2022)
 * - Follow Tour (2023-2024)
 * - Right Here World Tour (2024-2025)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ARTIST_ID = 'A000000';

// ── 2017 DIAMOND EDGE ─────────────────────────────────────────
const diamondEdge = [
  { date: '2017-08-05', city: 'Bangkok', country: 'TH', venue: 'Thunder Dome' },
  { date: '2017-08-12', city: 'Hong Kong', country: 'HK', venue: 'AsiaWorld-Expo Hall 10' },
  { date: '2017-08-18', city: 'Chicago', country: 'US', venue: 'Rosemont Theatre' },
  { date: '2017-08-23', city: 'Dallas', country: 'US', venue: 'Verizon Theatre at Grand Prairie' },
  { date: '2017-08-25', city: 'Toronto', country: 'CA', venue: 'Massey Hall' },
  { date: '2017-08-27', city: 'New York', country: 'US', venue: 'Terminal 5' },
  { date: '2017-08-29', city: 'Santiago', country: 'CL', venue: 'Movistar Arena' },
  { date: '2017-09-09', city: 'Kuala Lumpur', country: 'MY', venue: 'Stadium Negara' },
  { date: '2017-09-23', city: 'Jakarta', country: 'ID', venue: 'ICE Hall 3A' },
  { date: '2017-09-29', city: 'Singapore', country: 'SG', venue: 'Suntec Singapore Convention & Exhibition Centre' },
  { date: '2017-10-01', city: 'Taipei', country: 'TW', venue: 'Xinzhuang Gymnasium' },
  { date: '2017-10-06', city: 'Manila', country: 'PH', venue: 'Mall of Asia Arena' },
].map(e => ({ ...e, tour: 'DIAMOND EDGE' }));

// ── 2018 IDEAL CUT ────────────────────────────────────────────
const idealCut = [
  { date: '2018-08-31', city: 'Hong Kong', country: 'HK', venue: 'AsiaWorld-Arena' },
  { date: '2018-09-16', city: 'Jakarta', country: 'ID', venue: 'Indonesia Convention Exhibition' },
  { date: '2018-09-21', city: 'Singapore', country: 'SG', venue: 'Singapore Indoor Stadium' },
  { date: '2018-09-23', city: 'Kuala Lumpur', country: 'MY', venue: 'MIECC' },
  { date: '2018-09-29', city: 'Manila', country: 'PH', venue: 'Mall of Asia Arena' },
  { date: '2018-10-06', city: 'Taipei', country: 'TW', venue: 'Xinzhuang Gymnasium' },
  { date: '2018-10-07', city: 'Taipei', country: 'TW', venue: 'Xinzhuang Gymnasium' },
].map(e => ({ ...e, tour: 'IDEAL CUT' }));

// ── 2019-2020 ODE TO YOU ──────────────────────────────────────
const odeToYou = [
  { date: '2019-11-16', city: 'Jakarta', country: 'ID', venue: 'Istora Senayan' },
  { date: '2019-11-23', city: 'Bangkok', country: 'TH', venue: 'Thunder Dome' },
  { date: '2019-11-24', city: 'Bangkok', country: 'TH', venue: 'Thunder Dome' },
  { date: '2020-01-10', city: 'Newark', country: 'US', venue: 'Prudential Center' },
  { date: '2020-01-12', city: 'Chicago', country: 'US', venue: 'United Center' },
  { date: '2020-01-14', city: 'Dallas', country: 'US', venue: 'Toyota Music Factory' },
  { date: '2020-01-15', city: 'Houston', country: 'US', venue: 'Smart Financial Centre' },
  { date: '2020-01-17', city: 'Mexico City', country: 'MX', venue: 'Palacio de los Deportes' },
  { date: '2020-01-19', city: 'Los Angeles', country: 'US', venue: 'The Forum' },
  { date: '2020-01-21', city: 'San Jose', country: 'US', venue: 'SAP Center' },
  { date: '2020-01-23', city: 'Seattle', country: 'US', venue: 'ShoWare Center' },
  { date: '2020-02-08', city: 'Manila', country: 'PH', venue: 'Mall of Asia Arena' },
].map(e => ({ ...e, tour: 'ODE TO YOU' }));

// ── 2022 BE THE SUN ───────────────────────────────────────────
const beTheSun = [
  { date: '2022-08-10', city: 'Vancouver', country: 'CA', venue: 'Rogers Arena' },
  { date: '2022-08-12', city: 'Seattle', country: 'US', venue: 'Climate Pledge Arena' },
  { date: '2022-08-14', city: 'Oakland', country: 'US', venue: 'Oakland Arena' },
  { date: '2022-08-17', city: 'Los Angeles', country: 'US', venue: 'Kia Forum' },
  { date: '2022-08-20', city: 'Houston', country: 'US', venue: 'Toyota Center' },
  { date: '2022-08-23', city: 'Fort Worth', country: 'US', venue: 'Dickies Arena' },
  { date: '2022-08-25', city: 'Chicago', country: 'US', venue: 'United Center' },
  { date: '2022-08-28', city: 'Washington, D.C.', country: 'US', venue: 'Capital One Arena' },
  { date: '2022-08-30', city: 'Atlanta', country: 'US', venue: 'State Farm Arena' },
  { date: '2022-09-01', city: 'Elmont', country: 'US', venue: 'UBS Arena' },
  { date: '2022-09-03', city: 'Toronto', country: 'CA', venue: 'Scotiabank Arena' },
  { date: '2022-09-06', city: 'Newark', country: 'US', venue: 'Prudential Center' },
  { date: '2022-09-24', city: 'Jakarta', country: 'ID', venue: 'Indonesia Convention Exhibition' },
  { date: '2022-09-25', city: 'Jakarta', country: 'ID', venue: 'Indonesia Convention Exhibition' },
  { date: '2022-10-01', city: 'Bangkok', country: 'TH', venue: 'Impact Challenger Hall' },
  { date: '2022-10-02', city: 'Bangkok', country: 'TH', venue: 'Impact Challenger Hall' },
  { date: '2022-10-08', city: 'Manila', country: 'PH', venue: 'SM Mall of Asia Arena' },
  { date: '2022-10-09', city: 'Manila', country: 'PH', venue: 'SM Mall of Asia Arena' },
  { date: '2022-10-13', city: 'Singapore', country: 'SG', venue: 'Singapore Indoor Stadium' },
  { date: '2022-12-17', city: 'Bulacan', country: 'PH', venue: 'Philippine Arena' },
  { date: '2022-12-28', city: 'Jakarta', country: 'ID', venue: 'Gelora Bung Karno Madya Stadium' },
].map(e => ({ ...e, tour: 'BE THE SUN' }));

// ── 2023-2024 FOLLOW ──────────────────────────────────────────
const follow = [
  { date: '2023-12-23', city: 'Bangkok', country: 'TH', venue: 'Rajamangala National Stadium' },
  { date: '2023-12-24', city: 'Bangkok', country: 'TH', venue: 'Rajamangala National Stadium' },
  { date: '2024-01-13', city: 'Bulacan', country: 'PH', venue: 'Philippine Sports Stadium' },
  { date: '2024-01-14', city: 'Bulacan', country: 'PH', venue: 'Philippine Sports Stadium' },
  { date: '2024-01-20', city: 'Macau', country: 'MO', venue: 'Macau Olympic Complex Stadium' },
  { date: '2024-01-21', city: 'Macau', country: 'MO', venue: 'Macau Olympic Complex Stadium' },
].map(e => ({ ...e, tour: 'FOLLOW' }));

// ── 2024-2025 RIGHT HERE ──────────────────────────────────────
const rightHere = [
  { date: '2024-10-22', city: 'Chicago', country: 'US', venue: 'Allstate Arena' },
  { date: '2024-10-23', city: 'Chicago', country: 'US', venue: 'Allstate Arena' },
  { date: '2024-10-25', city: 'New York', country: 'US', venue: 'UBS Arena' },
  { date: '2024-10-27', city: 'San Antonio', country: 'US', venue: 'Frost Bank Center' },
  { date: '2024-10-31', city: 'San Antonio', country: 'US', venue: 'Frost Bank Center' },
  { date: '2024-11-01', city: 'San Antonio', country: 'US', venue: 'Frost Bank Center' },
  { date: '2024-11-05', city: 'Oakland', country: 'US', venue: 'Oakland Arena' },
  { date: '2024-11-06', city: 'Oakland', country: 'US', venue: 'Oakland Arena' },
  { date: '2024-11-09', city: 'Los Angeles', country: 'US', venue: 'BMO Stadium' },
  { date: '2024-11-10', city: 'Los Angeles', country: 'US', venue: 'BMO Stadium' },
  { date: '2025-01-18', city: 'Bulacan', country: 'PH', venue: 'Philippine Sports Stadium' },
  { date: '2025-01-19', city: 'Bulacan', country: 'PH', venue: 'Philippine Sports Stadium' },
  { date: '2025-01-25', city: 'Singapore', country: 'SG', venue: 'National Stadium' },
  { date: '2025-01-26', city: 'Singapore', country: 'SG', venue: 'National Stadium' },
  { date: '2025-02-08', city: 'Jakarta', country: 'ID', venue: 'Jakarta International Stadium' },
  { date: '2025-02-09', city: 'Jakarta', country: 'ID', venue: 'Jakarta International Stadium' },
  { date: '2025-02-15', city: 'Bangkok', country: 'TH', venue: 'Rajamangala National Stadium' },
  { date: '2025-02-16', city: 'Bangkok', country: 'TH', venue: 'Rajamangala National Stadium' },
].map(e => ({ ...e, tour: 'RIGHT HERE' }));

// ── タイトル生成 ──────────────────────────────────────────────
function makeTitle(tour) {
  const titles = {
    'DIAMOND EDGE': "SEVENTEEN WORLD TOUR 'DIAMOND EDGE'",
    'IDEAL CUT': "SEVENTEEN WORLD TOUR 'IDEAL CUT'",
    'ODE TO YOU': 'SEVENTEEN WORLD TOUR <ODE TO YOU>',
    'BE THE SUN': 'SEVENTEEN WORLD TOUR [BE THE SUN]',
    'FOLLOW': "SEVENTEEN TOUR 'FOLLOW'",
    'RIGHT HERE': 'SEVENTEEN [RIGHT HERE] WORLD TOUR',
  };
  return titles[tour];
}

async function main() {
  const allShows = [
    ...diamondEdge,
    ...idealCut,
    ...odeToYou,
    ...beTheSun,
    ...follow,
    ...rightHere,
  ];

  console.log(`Total shows to insert: ${allShows.length}`);

  // Build insert rows
  const rows = allShows.map(s => ({
    tag: 'LIVE',
    artist_id: ARTIST_ID,
    event_title: makeTitle(s.tour),
    sub_event_title: s.city,
    start_date: `${s.date}T00:00:00`,
    end_date: null,
    spot_name: s.venue,
    spot_address: s.city,
    country: s.country,
    status: 'pending',
    verified_count: 0,
    related_artists: '',
    submitted_by: null,
    source_url: '',
  }));

  // Check for duplicates first
  let dupeCount = 0;
  const toInsert = [];

  for (const row of rows) {
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('event_title', row.event_title)
      .eq('start_date', row.start_date)
      .neq('status', 'rejected')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`SKIP (duplicate): ${row.event_title} | ${row.sub_event_title} | ${row.start_date}`);
      dupeCount++;
    } else {
      toInsert.push(row);
    }
  }

  console.log(`\nDuplicates skipped: ${dupeCount}`);
  console.log(`Rows to insert: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // Insert in batches of 20
  const batchSize = 20;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('events')
      .insert(batch)
      .select('id, event_title, sub_event_title, start_date');

    if (error) {
      console.error(`Batch ${Math.floor(i/batchSize)+1} error:`, error.message);
      // Try one by one for this batch
      for (const row of batch) {
        const { data: d, error: e } = await supabase
          .from('events')
          .insert(row)
          .select('id, event_title, sub_event_title, start_date');
        if (e) {
          console.error(`  FAIL: ${row.event_title} | ${row.sub_event_title} | ${row.start_date} - ${e.message}`);
          errors++;
        } else {
          console.log(`  OK: ${d[0].sub_event_title} ${d[0].start_date.substring(0,10)}`);
          inserted++;
        }
      }
    } else {
      data.forEach(d => console.log(`OK: ${d.sub_event_title} ${d.start_date.substring(0,10)}`));
      inserted += data.length;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
  console.log(`Skipped (duplicates): ${dupeCount}`);
}

main().catch(console.error);
