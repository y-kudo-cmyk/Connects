const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cheerio = require('cheerio');
const BASE = 'https://oshito.online';

function dist(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function norm(s) {
  return s.replace(/\s+/g, '').replace(/[()（）「」『』\-·・、。]/g, '').toLowerCase();
}

async function fetchSpotPage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const name = $('h1.entry-title, .spot-name, h1').first().text().trim();
    const content = $('.entry-content, .post-content, article').first();

    // Address
    let address = '';
    const addrMatch = content.text().match(/住所[：:]\s*(.+)/);
    if (addrMatch) address = addrMatch[1].trim().split('\n')[0];
    if (!address) {
      // Try meta or structured data
      content.find('p, div').each((_, el) => {
        const t = $(el).text().trim();
        if (!address && (t.includes('〒') || t.match(/[都道府県市区町村郡]/))) {
          address = t.split('\n')[0].trim();
        }
      });
    }

    // Image
    let image = '';
    content.find('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (!image && src.includes('oshito.online') && !src.includes('logo') && !src.includes('icon')) {
        image = src;
      }
    });
    // Also check og:image
    if (!image) {
      const ogImg = $('meta[property="og:image"]').attr('content') || '';
      if (ogImg && ogImg.includes('oshito')) image = ogImg;
    }

    // Members from content
    let members = [];
    const memberNames = ['S.COUPS', 'JEONGHAN', 'JOSHUA', 'JUN', 'HOSHI', 'WONWOO', 'WOOZI', 'DK', 'MINGYU', 'THE 8', 'SEUNGKWAN', 'VERNON', 'DINO',
      'エスクプス', 'ジョンハン', 'ジョシュア', 'ジュン', 'ホシ', 'ウォヌ', 'ウジ', 'ドギョム', 'ミンギュ', 'ディエイト', 'スングァン', 'バーノン', 'ディノ'];
    const fullText = $('body').text();
    memberNames.forEach(m => {
      if (fullText.includes(m)) members.push(m);
    });

    // Lat/Lng from Google Maps link or structured data
    let lat = 0, lng = 0;
    const mapsLink = $('a[href*="google.com/maps"], a[href*="maps.google"]').attr('href') || '';
    const coordMatch = mapsLink.match(/@?([-\d.]+),([-\d.]+)/);
    if (coordMatch) { lat = parseFloat(coordMatch[1]); lng = parseFloat(coordMatch[2]); }

    // Also check for coordinates in scripts
    if (!lat) {
      const scriptText = $('script').text();
      const latMatch = scriptText.match(/lat[:\s]+([-\d.]+)/);
      const lngMatch = scriptText.match(/lng[:\s]+([-\d.]+)/);
      if (latMatch && lngMatch) { lat = parseFloat(latMatch[1]); lng = parseFloat(lngMatch[1]); }
    }

    // Also try from the main map page data
    if (!address) {
      // Use the content text to find address-like patterns
      const txt = content.text();
      const jpAddr = txt.match(/(〒[\d-]+\s*[^\n]{5,50})/);
      const krAddr = txt.match(/(서울|부산|인천|대구|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\n]{5,50}/);
      if (jpAddr) address = jpAddr[1].trim();
      else if (krAddr) address = krAddr[0].trim();
    }

    return { name, address, lat, lng, image, members, source: url };
  } catch (e) {
    return null;
  }
}

(async () => {
  // 1. Get all spot URLs from the SEVENTEEN map page
  console.log('📥 Getting spot URLs from oshito...');
  const listRes = await fetch(BASE + '/map/?artist=SEVENTEEN');
  const listHtml = await listRes.text();
  const links = [...new Set(listHtml.match(/\/map\/\d+\.html/g) || [])];
  console.log('Total spot URLs:', links.length);

  // 2. Get existing DB spots for dedup
  const { data: existing } = await sb.from('spots').select('id, spot_name, lat, lng');
  console.log('Existing DB spots:', existing.length);
  const maxId = existing.reduce((max, e) => Math.max(max, parseInt(e.id.replace('SP', ''))), 0);

  // 3. Scrape each page
  let scraped = 0, skipped = 0, added = 0, photoAdded = 0, errors = 0;
  let nextId = maxId + 1;

  // Process in batches of 10 for speed
  for (let i = 0; i < links.length; i += 10) {
    const batch = links.slice(i, i + 10);
    const results = await Promise.all(batch.map(link => fetchSpotPage(BASE + link)));

    for (const spot of results) {
      scraped++;
      if (!spot || !spot.name) { errors++; continue; }

      // Dedup: check name or 50m proximity
      let isDup = false;
      const nName = norm(spot.name);
      for (const ex of existing) {
        if (norm(ex.spot_name) === nName) { isDup = true; break; }
        if (ex.lat && ex.lng && spot.lat && spot.lng) {
          const d = dist(spot.lat, spot.lng, ex.lat, ex.lng);
          if (d < 50) { isDup = true; break; }
        }
      }
      if (isDup) { skipped++; continue; }

      // Skip if no address and no coordinates
      if (!spot.address && !spot.lat) { skipped++; continue; }

      const spotId = 'SP' + String(nextId++).padStart(5, '0');
      const related = spot.members.length > 0
        ? '#SEVENTEEN #' + spot.members.join(' #')
        : '#SEVENTEEN';

      // Guess genre
      let genre = 'OTHER';
      const n = spot.name.toLowerCase();
      if (n.includes('cafe') || n.includes('coffee') || n.includes('カフェ') || n.includes('커피')) genre = 'CAFE';
      else if (n.match(/restaurant|pizza|burger|steak|寿し|焼|食堂|ラーメン|うどん|そば|天/)) genre = 'RESTAURANT';
      else if (n.match(/公園|park|garden|museum|美術|神社|寺/)) genre = 'ENTERTAINMENT';

      const { error } = await sb.from('spots').insert({
        id: spotId,
        spot_name: spot.name,
        spot_address: spot.address || '',
        genre,
        artist_id: 'A000000',
        related_artists: related,
        image_url: spot.image || '',
        source_url: spot.source,
        memo: '',
        lat: spot.lat || null,
        lng: spot.lng || null,
        is_master: false,
        status: 'confirmed',
        verified_count: 3,
        x_posted: false,
      });

      if (error) { errors++; continue; }
      added++;

      // Add to existing for future dedup within this run
      existing.push({ id: spotId, spot_name: spot.name, lat: spot.lat, lng: spot.lng });

      // Add photo if image exists
      if (spot.image) {
        await sb.from('spot_photos').insert({
          spot_id: spotId,
          image_url: spot.image,
          source_url: spot.source,
          platform: 'other',
          tags: related,
          contributor: 'oshito.online',
          status: 'confirmed',
          votes: 3,
        });
        photoAdded++;
      }
    }

    // Progress
    if (scraped % 50 === 0 || i + 10 >= links.length) {
      console.log(`  ${scraped}/${links.length} scraped | +${added} added | ${skipped} skipped | ${errors} errors`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('スクレイピング:', scraped);
  console.log('新規追加:', added);
  console.log('重複スキップ:', skipped);
  console.log('写真追加:', photoAdded);
  console.log('エラー:', errors);

  const { count: sc } = await sb.from('spots').select('id', { count: 'exact', head: true });
  const { count: pc } = await sb.from('spot_photos').select('id', { count: 'exact', head: true });
  console.log('\nDB合計: spots', sc, '/ photos', pc);
})();
