/* Proxy ค้นหาที่อยู่ / แปลงพิกัดเป็นที่อยู่ ไปยัง Photon (OpenStreetMap) พร้อมแคชที่ขอบเครือข่าย Cloudflare
 *
 *   GET /api/geo/api?q=...&lat=&lon=&bbox=&limit=     → ค้นหา (Photon /api)
 *   GET /api/geo/reverse?lat=&lon=&limit=&layer=&radius= → พิกัด → ที่อยู่ (Photon /reverse)
 *
 * ทำไมต้องมี proxy:
 *  - คำค้นเดียวกันจากผู้ใช้หลายคนตอบจากแคช ไม่ยิงซ้ำไปที่ Photon (รองรับคนใช้พร้อมกันจำนวนมาก)
 *  - เปลี่ยนไปใช้ Photon ที่ตั้งเอง (self-hosted) ได้ โดยตั้งค่า PHOTON_URL ใน Cloudflare Pages → Settings → Environment variables
 *    ไม่ต้องแก้แอปหรือรออัปเดตในมือถือผู้ใช้
 *  - ถ้าเซิร์ฟเวอร์แรกล่ม/ช้า จะลองตัวถัดไปให้อัตโนมัติ (self-hosted → public photon.komoot.io)
 *
 * public photon.komoot.io ใช้ได้ "ในปริมาณที่สมเหตุสมผล" เท่านั้น ใช้งานจริงจำนวนมากควรตั้ง PHOTON_URL (ดู docs/MAPS-ARCHITECTURE.md)
 */
const PUBLIC_PHOTON = 'https://photon.komoot.io';
const TTL = { api: 86400, reverse: 7 * 86400 };          // แคชที่ขอบเครือข่าย (วินาที)
const BROWSER_TTL = { api: 3600, reverse: 86400 };        // แคชในเบราว์เซอร์
const ALLOWED = {
  api: ['q', 'limit', 'lang', 'lat', 'lon', 'location_bias_scale', 'zoom', 'bbox', 'layer', 'osm_tag'],
  reverse: ['lat', 'lon', 'limit', 'lang', 'layer', 'radius', 'osm_tag']
};
const UA = 'HelpMe-flood-help/1.0 (+https://helpme-th.pages.dev)';

const json = (obj, status, extra = {}) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', ...extra }
});

export async function onRequestGet(ctx) {
  const url = new URL(ctx.request.url);
  const ep = String((ctx.params.path || [])[0] || '');
  if (!ALLOWED[ep]) return json({ error: 'not_found' }, 404);

  // คัดเฉพาะพารามิเตอร์ที่ Photon ใช้ + จัดรูปให้แคชได้ผลดี (พิกัดปัดเหลือ ~1 ม., ช่องว่างในคำค้นยุบรวม)
  const out = new URLSearchParams();
  for (const k of ALLOWED[ep]) {
    const vals = url.searchParams.getAll(k);
    for (let v of vals) {
      v = String(v).trim();
      if (!v) continue;
      if (k === 'q') { v = v.replace(/\s+/g, ' ').slice(0, 120); if (v.length < 2) return json({ error: 'short_query' }, 400); }
      else if (k === 'lat' || k === 'lon') { const n = Number(v); if (!isFinite(n)) return json({ error: 'bad_coord' }, 400); v = n.toFixed(ep === 'reverse' ? 5 : 3); }
      else if (k === 'limit') v = String(Math.min(15, Math.max(1, parseInt(v, 10) || 5)));
      else v = v.slice(0, 80);
      out.append(k, v);
    }
  }
  if (ep === 'api' && !out.get('q')) return json({ error: 'missing_q' }, 400);
  if (ep === 'reverse' && (!out.get('lat') || !out.get('lon'))) return json({ error: 'missing_coord' }, 400);
  const qs = [...out.entries()].sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
  const sorted = new URLSearchParams(qs).toString();

  const cache = caches.default;
  const key = new Request(`${url.origin}/api/geo/${ep}?${sorted}`);
  const hit = await cache.match(key);
  if (hit) return hit;

  const upstreams = [];
  const own = (ctx.env && ctx.env.PHOTON_URL || '').replace(/\/+$/, '');
  if (own) upstreams.push(own);
  upstreams.push(PUBLIC_PHOTON);

  let lastErr = '';
  for (const base of upstreams) {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), base === PUBLIC_PHOTON ? 7000 : 4000);
    try {
      const r = await fetch(`${base}/${ep}${ep === 'api' ? '/' : ''}?${sorted}`, { signal: ctl.signal, headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      clearTimeout(tm);
      if (!r.ok) { lastErr = base + ' ' + r.status; continue; }
      const body = await r.text();
      const res = new Response(body, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': `public, max-age=${BROWSER_TTL[ep]}, s-maxage=${TTL[ep]}`,
          'access-control-allow-origin': '*',
          'x-geo-upstream': base === PUBLIC_PHOTON ? 'public' : 'self-hosted'
        }
      });
      ctx.waitUntil(cache.put(key, res.clone()));
      return res;
    } catch (e) {
      clearTimeout(tm);
      lastErr = base + ' ' + (e && e.name === 'AbortError' ? 'timeout' : 'error');
    }
  }
  return json({ error: 'upstream_unavailable', detail: lastErr, features: [] }, 502, { 'cache-control': 'no-store' });
}
