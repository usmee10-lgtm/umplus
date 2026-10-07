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
      if (r.ok) { const html = (await r.text()).slice(0, 400000);
        const m = html.match(/\[\s*null\s*,\s*null\s*,\s*(1\d\.\d{4,})\s*,\s*(\d{2,3}\.\d{4,})\s*\]/) || html.match(/center=(1\d\.\d{4,})%2C(\d{2,3}\.\d{4,})/) || html.match(/@(1\d\.\d{4,}),(\d{2,3}\.\d{4,})/);
        if (m) { const p2 = ll('@' + m[1] + ',' + m[2]); if (p2) { const res = out({ ok: true, ...p2, url: cur, approx: true }); ctx.waitUntil(cache.put(key, res.clone())); return res; } } }
      break;
    }
  } catch (e) {}
  return out({ ok: false, error: 'nocoords', url: cur });
}
