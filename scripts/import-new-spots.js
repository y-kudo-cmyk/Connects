const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://cjhwxocabmmrsmdfyqzr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaHd4b2NhYm1tcnNtZGZ5cXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM0ODY1MywiZXhwIjoyMDkwOTI0NjUzfQ.gLNhjNxWI3DOWejXqQeIQb12RN-lw3rvjbJHzMB2PJM'
);

function parseCSV(text) {
  const rows = []; let row = []; let field = ''; let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuote = false;
      else field += c;
    } else {
      if (c === '"') inQuote = true;
      else if (c === ',') { row.push(field.trim()); field = ''; }
      else if (c === '\n' || (c === '\r' && text[i+1] === '\n')) {
        row.push(field.trim()); rows.push(row); row = []; field = '';
        if (c === '\r') i++;
      } else field += c;
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

function dist(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function norm(s) {
  return s.replace(/\s+/g, '').replace(/[()（）「」『』\-·・]/g, '').toLowerCase();
}

function convertDriveUrl(url) {
  if (!url) return '';
  const m1 = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m1) return 'https://lh3.googleusercontent.com/d/' + m1[1];
  const m2 = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (m2) return 'https://lh3.googleusercontent.com/d/' + m2[1];
  return url;
}

(async () => {
  const csv = fs.readFileSync('scripts/new_spots.csv', 'utf8');
  const rows = parseCSV(csv);
  const h = rows[0]; const col = {}; h.forEach((v, i) => col[v] = i);

  // 1. Parse spots
  const csvSpots = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = r[col['spot_name']] || '';
    const addr = r[col['spot_address']] || '';
    if (!name || !addr) continue;
    csvSpots.push({
      row: i, name, addr,
      lat: parseFloat(r[col['緯度']] || '0'),
      lng: parseFloat(r[col['経度']] || '0'),
      img1: convertDriveUrl(r[col['1)image_url']] || ''),
      img2: convertDriveUrl(r[col['2)image_url']] || ''),
      img3: convertDriveUrl(r[col['3)image_url']] || ''),
      source: r[col['source_url']] || '',
      memo: r[col['memo']] || '',
      related: r[col['related_artists']] || '',
    });
  }
  console.log('CSV spots (name+addr):', csvSpots.length);

  // 2. Deduplicate within CSV
  // Skip: ぎんざ 寿し幸 (keep 寿し幸), さくら亭 (keep 旧渋谷川)
  const groups = new Map();
  for (const s of csvSpots) {
    // Skip specific duplicates
    if (s.name === 'ぎんざ 寿し幸') continue;
    if (s.name === 'さくら亭') continue;

    const key = norm(s.name);
    if (!groups.has(key)) {
      groups.set(key, { ...s, allImages: [] });
    }
    const g = groups.get(key);
    if (s.img1) g.allImages.push(s.img1);
    if (s.img2) g.allImages.push(s.img2);
    if (s.img3) g.allImages.push(s.img3);
    if (!g.img1 && s.img1) g.img1 = s.img1;
    if (!g.source && s.source) g.source = s.source;
  }
  console.log('After CSV dedup:', groups.size);

  // 3. Get existing DB spots
  const { data: existing } = await sb.from('spots').select('id, spot_name, lat, lng');
  console.log('Existing DB spots:', existing.length);

  // 4. Filter out DB duplicates
  const newSpots = [];
  let skippedDup = 0;
  for (const [key, s] of groups) {
    let isDup = false;
    for (const ex of existing) {
      if (norm(ex.spot_name) === key) { isDup = true; break; }
      if (ex.lat && ex.lng && s.lat && s.lng) {
        const d = dist(s.lat, s.lng, ex.lat, ex.lng);
        if (d < 50 && (norm(ex.spot_name).includes(key.slice(0, 3)) || key.includes(norm(ex.spot_name).slice(0, 3)))) {
          isDup = true; break;
        }
      }
    }
    if (isDup) { skippedDup++; continue; }
    newSpots.push(s);
  }
  console.log('DB duplicates skipped:', skippedDup);
  console.log('New spots to insert:', newSpots.length);

  // 5. Find max spot ID
  const maxId = existing.reduce((max, e) => {
    const num = parseInt(e.id.replace('SP', ''));
    return num > max ? num : max;
  }, 0);
  console.log('Max existing ID:', 'SP' + String(maxId).padStart(5, '0'));

  // 6. Insert
  let insertedSpots = 0, insertedPhotos = 0;
  for (let i = 0; i < newSpots.length; i++) {
    const s = newSpots[i];
    const spotId = 'SP' + String(maxId + 1 + i).padStart(5, '0');

    // Guess genre
    let genre = 'OTHER';
    const n = (s.name + ' ' + s.memo + ' ' + s.addr).toLowerCase();
    if (n.includes('cafe') || n.includes('coffee') || n.includes('カフェ') || n.includes('커피') || n.includes('bakery')) genre = 'CAFE';
    else if (n.includes('restaurant') || n.includes('pizza') || n.includes('burger') || n.includes('steak') || n.includes('寿し') || n.includes('焼') || n.includes('食堂') || n.includes('ラーメン') || n.includes('gopchang') || n.includes('bbq')) genre = 'RESTAURANT';
    else if (n.includes('公園') || n.includes('park') || n.includes('garden') || n.includes('museum') || n.includes('美術')) genre = 'ENTERTAINMENT';
    else if (n.includes('shop') || n.includes('store') || n.includes('ショップ') || n.includes('boutique')) genre = 'FASHION';

    const { error } = await sb.from('spots').insert({
      id: spotId,
      spot_name: s.name,
      spot_address: s.addr,
      genre,
      artist_id: 'A000000',
      related_artists: s.related || '#SEVENTEEN',
      image_url: s.img1 || '',
      source_url: s.source || '',
      memo: '',
      lat: s.lat || null,
      lng: s.lng || null,
      is_master: false,
      status: 'confirmed',
      verified_count: 3,
      x_posted: false,
    });
    if (error) { console.log('Spot error:', spotId, s.name, error.message); continue; }
    insertedSpots++;

    // Insert unique photos
    const uniqueImgs = [...new Set(s.allImages.filter(Boolean))];
    for (const img of uniqueImgs) {
      let platform = 'other';
      if (s.memo.includes('Instagram')) platform = 'instagram';
      else if (s.memo.includes('x.com') || s.memo.includes('twitter')) platform = 'x';
      else if (s.memo.includes('youtube')) platform = 'youtube';
      else if (s.memo.includes('weverse')) platform = 'weverse';

      const { error: pErr } = await sb.from('spot_photos').insert({
        spot_id: spotId,
        image_url: img,
        source_url: s.source || '',
        platform,
        tags: s.related || '#SEVENTEEN',
        contributor: '',
        status: 'confirmed',
        votes: 3,
      });
      if (pErr) console.log('Photo error:', spotId, pErr.message);
      else insertedPhotos++;
    }
  }

  console.log('\n=== 完了 ===');
  console.log('スポット追加:', insertedSpots);
  console.log('写真追加:', insertedPhotos);

  const { count: sc } = await sb.from('spots').select('id', { count: 'exact', head: true });
  const { count: pc } = await sb.from('spot_photos').select('id', { count: 'exact', head: true });
  console.log('\nDB合計: spots', sc, '/ photos', pc);
})();
