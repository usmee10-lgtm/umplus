/* ดึงรายชื่อกล้อง CCTV จาก POPNIX Flood (flood.pop.in.th) มารวมเป็นชุดเดียว
 * ไฟล์ต้นทางไม่เปิดให้เว็บอื่นอ่านตรง ๆ (ไม่มี CORS) จึงดึงผ่านเซิร์ฟเวอร์ของเราแล้วแคชไว้ 2 นาที
 * ตัวภาพกล้องโหลดจาก flood.pop.in.th โดยตรง: ภาพ = base + path + id + '.jpg?t=' + img
 * ผลลัพธ์: {ok, at, base, feeds:[{org,path}], cams:[[feedIndex, id, name, lat, lng, img]]} */
const BASE = 'https://flood.pop.in.th';
const FEEDS = [
  { url: '/cctv/cams.json', path: '/cctv/', org: 'กล้องจราจร กทม.' },
  { url: '/cctv/dds.json', path: '/cctv/dds/', org: 'สำนักการระบายน้ำ กทม.' },
  { url: '/itic/cams.json', path: '/itic/', org: 'iTIC' },
  { url: '/cctv/nbi.json', path: '/cctv/nbi/', org: 'เทศบาลนครนนทบุรี' }
];
const TTL = 120;

export async function onRequestGet(ctx) {
  const cache = caches.default;
  const key = new Request(new URL('/api/cctv?v=1', ctx.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const results = await Promise.all(FEEDS.map(async (f, i) => {
    try {
      const r = await fetch(BASE + f.url, { cf: { cacheTtl: TTL }, headers: { 'User-Agent': 'HelpMe-flood-help (helpme4u.com)' } });
      if (!r.ok) return [];
      const j = await r.json();
      return (j.cams || [])
        .filter(c => c && c.img && isFinite(c.lat) && isFinite(c.lng) && c.lat > 5 && c.lat < 21)
        .map(c => [i, String(c.id), String(c.name || '').slice(0, 90), Math.round(c.lat * 1e5) / 1e5, Math.round(c.lng * 1e5) / 1e5, Number(c.img) || 0]);
    } catch (e) { return []; }
  }));
  const cams = results.flat();
  const body = JSON.stringify({ ok: cams.length > 0, at: Math.floor(Date.now() / 1000), base: BASE, feeds: FEEDS.map(f => ({ org: f.org, path: f.path })), cams });
  const res = new Response(body, {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + TTL }
  });
  if (cams.length) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
