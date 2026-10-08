/* แปลงลิงก์ Google Maps แบบย่อ (maps.app.goo.gl / goo.gl/maps) เป็นพิกัด
 * เบราว์เซอร์เปิดตามลิงก์ย่อเองไม่ได้ (ข้ามโดเมน) จึงตามลิงก์ฝั่งเซิร์ฟเวอร์ แล้วอ่านพิกัดจาก URL ปลายทาง (หรือจากหน้าเว็บถ้า URL ไม่มี)
 * GET /api/gmaps?u=<ลิงก์> → {ok, lat, lng, url} */
const HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|g\.co)$/i;
function ll(s) {
  s = decodeURIComponent(String(s || ''));
  const ok = (a, b) => { a = +a; b = +b; return a > 5 && a < 21 && b > 97 && b < 106 ? { lat: a, lng: b } : null; };
  let m;
  if ((m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/))) return ok(m[1], m[2]);
  if ((m = s.match(/[?&](?:q|query|ll|sll|destination|daddr|center)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/))) return ok(m[1], m[2]);
  if ((m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/))) return ok(m[1], m[2]);
  return null;
}

/* ---- Plus Code (Open Location Code) เช่น /maps/place/89HX+368+มัสยิด...อำเภอเสนา ----
 * ลิงก์แชร์สถานที่จากแอป Google Maps มักไม่มีพิกัดตรง ๆ มีแต่ Plus Code แบบย่อ + ชื่อพื้นที่
 * → หาพิกัดคร่าว ๆ ของชื่อพื้นที่ (Photon) เป็นจุดอ้างอิง แล้วถอด Plus Code เป็นพิกัดแม่นระดับ ~14 ม. */
const OLC = '23456789CFGHJMPQRVWX';
function olcDecode(code) {
  code = code.replace('+', '').toUpperCase();
  let lat = -90, lng = -180, pv = 20;
  for (let i = 0; i < Math.min(10, code.length); i += 2) {
    lat += OLC.indexOf(code[i]) * pv; if (i + 1 < code.length) lng += OLC.indexOf(code[i + 1]) * pv;
    if (i + 2 < Math.min(10, code.length)) pv /= 20;
  }
  let hLat = pv, hLng = pv;
  for (let i = 10; i < code.length; i++) { hLat /= 5; hLng /= 4; const d = OLC.indexOf(code[i]); lat += Math.floor(d / 4) * hLat; lng += (d % 4) * hLng; }
  return { lat: lat + hLat / 2, lng: lng + hLng / 2 };
}
function olcPrefix(lat, lng, n) {
  let la = lat + 90, lo = lng + 180, pv = 20, s = '';
  for (let i = 0; i < n; i += 2) { const a = Math.floor(la / pv), b = Math.floor(lo / pv); s += OLC[a] + OLC[b]; la -= a * pv; lo -= b * pv; pv /= 20; }
  return s;
}
function olcRecover(short, ref) {
  const pad = 8 - short.indexOf('+'); if (pad <= 0) return olcDecode(short);
  const res = Math.pow(20, 2 - pad / 2), half = res / 2;
  const c = olcDecode(olcPrefix(ref.lat, ref.lng, pad) + short);
  if (ref.lat + half < c.lat && c.lat - res >= -90) c.lat -= res; else if (ref.lat - half > c.lat && c.lat + res <= 90) c.lat += res;
  if (ref.lng + half < c.lng) c.lng -= res; else if (ref.lng - half > c.lng) c.lng += res;
  return c;
}
async function photonRef(q) {
  try {
    const r = await fetch('https://photon.komoot.io/api/?limit=1&lat=13.75&lon=100.55&q=' + encodeURIComponent(q), { headers: { 'User-Agent': 'HelpMe-flood-help (helpme4u.com)' } });
    const j = await r.json(); const f = j.features && j.features[0];
    if (f) { const [lng, lat] = f.geometry.coordinates; if (lat > 5 && lat < 21 && lng > 97 && lng < 106) return { lat, lng }; }
  } catch (e) {}
  return null;
}
async function fromPlace(url) {
  let m = decodeURIComponent(String(url)).match(/\/maps\/place\/([^/?]+)/); if (!m) return null;
  const txt = m[1].replace(/\+/g, ' ').trim();
  const pc = txt.match(/^([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{0,3})\s*(.*)$/i);
  const area = (pc ? pc[2] : txt).replace(/\s+\d{5}$/, '').trim();
  const words = area.split(/\s+/);
  let ref = null;  /* ลองชื่อเต็ม แล้วตัดคำหน้าออกทีละคำ (ชื่อร้าน/มัสยิดมักหาไม่เจอ แต่ตำบล/อำเภอหาเจอ) */
  for (let i = 0; i < words.length && !ref && i < 6; i++) ref = await photonRef(words.slice(i).join(' '));
  if (pc && pc[1].indexOf('+') === 8) { const p = olcDecode(pc[1]); return ll('@' + p.lat + ',' + p.lng); }
  if (pc) { const p = olcRecover(pc[1].toUpperCase(), ref || { lat: 13.75, lng: 100.55 }); const q = ll('@' + p.lat.toFixed(6) + ',' + p.lng.toFixed(6)); return q && ref ? q : q && !ref ? Object.assign(q, { approx: true }) : null; }
  return ref ? Object.assign({ lat: +ref.lat.toFixed(6), lng: +ref.lng.toFixed(6) }, { approx: true }) : null;
}
const out = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=86400' } });
export async function onRequestGet(ctx) {
  let u;
  try { u = new URL(new URL(ctx.request.url).searchParams.get('u') || ''); } catch (e) { return out({ ok: false, error: 'url' }, 400); }
  if (u.protocol !== 'https:' || !HOSTS.test(u.hostname)) return out({ ok: false, error: 'host' }, 400);
  const cache = caches.default, key = new Request('https://helpme4u.com/__gmaps/' + encodeURIComponent(u.href));
  const hit = await cache.match(key); if (hit) return hit;
  let cur = u.href;
  try {
    for (let i = 0; i < 6; i++) {
      const p = ll(cur); if (p) { const r = out({ ok: true, ...p, url: cur }); ctx.waitUntil(cache.put(key, r.clone())); return r; }
      const host = new URL(cur).hostname;
      if (!/(goo\.gl|g\.co|google\.[a-z.]+)$/i.test(host)) break;
      const r = await fetch(cur, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (HelpMe-flood-help; +https://helpme4u.com)', 'Accept-Language': 'th,en' } });
      const loc = r.headers.get('location');
      if (loc) { cur = new URL(loc, cur).href; continue; }
      { const pl = await fromPlace(cur); if (pl) { const res = out({ ok: true, ...pl, url: cur, src: 'place' }); ctx.waitUntil(cache.put(key, res.clone())); return res; } }
      if (r.ok) { const html = (await r.text()).slice(0, 400000);
        const m = html.match(/\[\s*null\s*,\s*null\s*,\s*(1\d\.\d{4,})\s*,\s*(\d{2,3}\.\d{4,})\s*\]/) || html.match(/center=(1\d\.\d{4,})%2C(\d{2,3}\.\d{4,})/) || html.match(/@(1\d\.\d{4,}),(\d{2,3}\.\d{4,})/);
        if (m) { const p2 = ll('@' + m[1] + ',' + m[2]); if (p2) { const res = out({ ok: true, ...p2, url: cur, approx: true }); ctx.waitUntil(cache.put(key, res.clone())); return res; } } }
      break;
    }
  } catch (e) {}
  { const pl = await fromPlace(cur); if (pl) return out({ ok: true, ...pl, url: cur, src: 'place' }); }
  return out({ ok: false, error: 'nocoords', url: cur });
}
