/* ชั้นเฝ้าระวังน้ำ: ระดับน้ำล่าสุดจากสถานีโทรมาตรทั่วประเทศ (ThaiWater · สถาบันสารสนเทศทรัพยากรน้ำ สสน.)
 * API สาธารณะ ฟรี ไม่ต้องใช้ key · ดึงผ่านเซิร์ฟเวอร์ของเรา ตัดเหลือเฉพาะที่ใช้ แล้วแคชที่ขอบเครือข่าย 10 นาที
 * ผู้ใช้กี่คนก็ยิงไปที่ ThaiWater ไม่เกินราว 6 ครั้งต่อชั่วโมงต่อจุดแคช
 *
 * ผลลัพธ์: {ok, at, src, st:[[id, ชื่อ, lat, lng, ระดับสถานการณ์ 0-5, %ความจุลำน้ำ, ระดับน้ำ ม.รทก.,
 *                          เปลี่ยนจากครั้งก่อน (ม.), เทียบตลิ่ง (ม. +ล้น/-ต่ำกว่า), เวลาวัด (epoch วินาที), ลำน้ำ, ที่ตั้ง, หน่วยงาน]]}
 * ระดับสถานการณ์ตาม ThaiWater: 1 น้อยวิกฤต (≤10%) 2 น้อย (10–30%) 3 ปกติ (30–70%) 4 มาก (70–100%) 5 ล้นตลิ่ง (>100%) */
const SRC = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load';
const TTL = 600;
const MAX_AGE = 3 * 86400;   // ไม่แสดงสถานีที่ข้อมูลเก่ากว่า 3 วัน (เครื่องวัดอาจเสีย)

const num = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };
const r2 = n => n == null ? null : Math.round(n * 100) / 100;
const th = o => (o && (o.th || o.en)) || '';
function bkkEpoch(s) {           // "2026-10-04 02:40" (เวลาไทย) → epoch วินาที
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(s || ''));
  return m ? Math.floor((Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) - 7 * 3600e3) / 1000) : 0;
}

export async function onRequestGet(ctx) {
  const cache = caches.default;
  const key = new Request(new URL('/api/water?v=1', ctx.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  let rows = [];
  try {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(SRC, { signal: ctl.signal, cf: { cacheTtl: TTL }, headers: { 'User-Agent': 'HelpMe-flood-help/1.0 (+https://helpme-th.pages.dev)', 'Accept': 'application/json' } });
    clearTimeout(tm);
    if (r.ok) {
      const j = await r.json();
      rows = (j && j.waterlevel_data && j.waterlevel_data.data) || (j && j.data) || [];
    }
  } catch (e) { rows = []; }

  const now = Date.now() / 1000, seen = new Set(), st = [];
  for (const d of rows) {
    const s = d && d.station; if (!s) continue;
    const lat = num(s.tele_station_lat), lng = num(s.tele_station_long);
    if (lat == null || lng == null || lat < 5 || lat > 21 || lng < 97 || lng > 106) continue;
    const at = bkkEpoch(d.waterlevel_datetime);
    if (!at || now - at > MAX_AGE) continue;
    const id = String(s.id || ''); if (!id || seen.has(id)) continue; seen.add(id);
    const wl = num(d.waterlevel_msl), prev = num(d.waterlevel_msl_previous);
    let bank = num(d.diff_wl_bank);
    if (bank != null) bank = /ล้น/.test(d.diff_wl_bank_text || '') ? Math.abs(bank) : -Math.abs(bank);
    const g = d.geocode || {};
    const place = [th(g.tumbon_name) && 'ต.' + th(g.tumbon_name), th(g.amphoe_name) && 'อ.' + th(g.amphoe_name), th(g.province_name) && 'จ.' + th(g.province_name)].filter(Boolean).join(' ');
    st.push([
      id,
      String(th(s.tele_station_name) || s.tele_station_oldcode || 'สถานีวัดระดับน้ำ').slice(0, 80),
      Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5,
      Number(d.situation_level) || 0,
      r2(num(d.storage_percent)),
      r2(wl),
      wl != null && prev != null ? r2(wl - prev) : null,
      r2(bank),
      at,
      String(d.river_name || '').slice(0, 60),
      place.slice(0, 90),
      th(d.agency && d.agency.agency_shortname) || th(d.agency && d.agency.agency_name)
    ]);
  }
  const body = JSON.stringify({ ok: st.length > 0, at: Math.floor(now), src: 'ThaiWater (สสน.)', st });
  const res = new Response(body, {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': st.length ? 'public, max-age=300' : 'no-store' }
  });
  if (st.length) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
