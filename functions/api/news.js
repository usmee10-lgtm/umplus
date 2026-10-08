/* ข่าวภัยพิบัติในไทยล่าสุด (Google News RSS ค้นคำเกี่ยวกับภัยพิบัติ ย้อนหลัง 2 วัน) · แคชที่ Cloudflare 10 นาที
 * GET /api/news → {ok, at, items:[{id, title, source, url, t}]} */
const Q = '(น้ำท่วม OR อุทกภัย OR น้ำป่า OR ดินโคลนถล่ม OR พายุ OR แผ่นดินไหว OR ภัยพิบัติ OR ปภ.) when:2d';
const FEED = 'https://news.google.com/rss/search?hl=th&gl=TH&ceid=TH:th&q=' + encodeURIComponent(Q);
const FRESH = 600, STALE = 6 * 3600;
const tag = (x, t) => { const m = x.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>', 'i')); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
const unent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
async function build() {
  const xml = await (await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 (HelpMe-flood-help; +https://helpme4u.com)', 'Accept-Language': 'th' }, cf: { cacheTtl: 300 } })).text();
  const seen = new Set(), items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const it = m[1], source = unent(tag(it, 'source'));
    let title = unent(tag(it, 'title')); if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    const key = title.replace(/\s+/g, '').slice(0, 40); if (!title || seen.has(key)) continue; seen.add(key);
    const url = unent(tag(it, 'link')); if (!/^https:\/\//.test(url)) continue;
    items.push({ id: 'n-' + (tag(it, 'guid') || url).slice(-24), title, source, url, t: Date.parse(tag(it, 'pubDate')) || 0 });
  }
  items.sort((a, b) => b.t - a.t);
  if (!items.length) throw new Error('empty');
  return JSON.stringify({ ok: true, at: Date.now(), items: items.slice(0, 12) });
}
const res = (b, s) => new Response(b, { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=120', 'x-cache': s } });
export async function onRequestGet(ctx) {
  const cache = caches.default, key = new Request('https://helpme4u.com/__news/v1');
  const put = b => cache.put(key, new Response(b, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + STALE, 'x-at': String(Date.now()) } }));
  const hit = await cache.match(key);
  if (hit) { const age = (Date.now() - (+hit.headers.get('x-at') || 0)) / 1000, b = await hit.text(); if (age < FRESH) return res(b, 'hit'); ctx.waitUntil(build().then(put).catch(() => {})); return res(b, 'stale'); }
  try { const b = await build(); ctx.waitUntil(put(b)); return res(b, 'miss'); } catch (e) { return new Response('{"ok":false,"items":[]}', { status: 502, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } }); }
}
