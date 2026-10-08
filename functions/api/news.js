/* ข่าวภัยพิบัติในไทยล่าสุด (Google News RSS ค้นคำเกี่ยวกับภัยพิบัติ ย้อนหลัง 2 วัน) · แคชที่ Cloudflare 10 นาที
 * GET /api/news → {ok, at, items:[{id, title, source, url, t}]} */
const Q = '(น้ำท่วม OR อุทกภัย OR น้ำป่า OR ดินโคลนถล่ม OR พายุ OR แผ่นดินไหว OR ภัยพิบัติ OR ปภ.) when:2d';
const FEED = 'https://news.google.com/rss/search?hl=th&gl=TH&ceid=TH:th&q=' + encodeURIComponent(Q);
const FRESH = 600, STALE = 6 * 3600;
const tag = (x, t) => { const m = x.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>', 'i')); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
const unent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const FEEDS = [
  ['google', FEED],
  ['bing', 'https://www.bing.com/news/search?format=rss&setlang=th-TH&cc=TH&q=' + encodeURIComponent('น้ำท่วม OR อุทกภัย OR ภัยพิบัติ OR พายุ OR ดินโคลนถล่ม')],
  ['matichon', 'https://www.matichon.co.th/feed'],
  ['khaosod', 'https://www.khaosod.co.th/feed'],
  ['thairath', 'https://www.thairath.co.th/rss/news'],
  ['pptv', 'https://www.pptvhd36.com/rss/news']
];
const DIS = /ท่วม|อุทกภัย|น้ำป่า|ดินโคลน|ดินถล่ม|พายุ|แผ่นดินไหว|ภัยพิบัติ|ปภ\.|ฝนตกหนัก|เยียวยา|ระดับน้ำ|เขื่อน|อพยพ|ผู้ประสบภัย|เตือนภัย/;
const SRC = { matichon: 'มติชน', khaosod: 'ข่าวสด', thairath: 'ไทยรัฐ', pptv: 'PPTV' };
async function one([name, url]) {
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 6000);
  try {
    const xml = await (await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelpMe-flood-help; +https://helpme4u.com)', 'Accept-Language': 'th' }, cf: { cacheTtl: 300 } })).text();
    const out = [];
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
      const it = m[1]; let source = unent(tag(it, 'source')) || SRC[name] || '';
      let title = unent(tag(it, 'title')); if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
      if (!title || !DIS.test(title)) continue;  /* เฉพาะข่าวภัยพิบัติ */
      let link = unent(tag(it, 'link')); if (name === 'bing') { try { const u = new URL(link); link = u.searchParams.get('url') || link; } catch (e) {} if (!source) source = unent(tag(it, 'News:Source')); }
      if (!/^https:\/\//.test(link)) continue;
      out.push({ id: 'n-' + title.replace(/\s+/g, '').slice(0, 24), title, source: source || name, url: link, t: Date.parse(tag(it, 'pubDate')) || 0 });
    }
    return out;
  } finally { clearTimeout(tm); }
}
export async function build() {
  const rs = await Promise.allSettled(FEEDS.map(one));
  const seen = new Set(), items = [], cut = Date.now() - 3 * 864e5, stat = {};
  rs.forEach((r, i) => { stat[FEEDS[i][0]] = r.status === 'fulfilled' ? r.value.length : 'x';
    if (r.status === 'fulfilled') r.value.forEach(x => { const k = x.title.replace(/\s+/g, '').slice(0, 30); if (seen.has(k) || (x.t && x.t < cut)) return; seen.add(k); items.push(x); }); });
  items.sort((a, b) => b.t - a.t);
  if (!items.length) throw new Error('empty ' + JSON.stringify(stat));
  return JSON.stringify({ ok: true, at: Date.now(), items: items.slice(0, 12), stat });
}
const res = (b, s) => new Response(b, { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=120', 'x-cache': s } });
export async function onRequestGet(ctx) {
  const cache = caches.default, key = new Request('https://helpme4u.com/__news/v3');
  const put = b => cache.put(key, new Response(b, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + STALE, 'x-at': String(Date.now()) } }));
  const hit = await cache.match(key);
  if (hit) { const age = (Date.now() - (+hit.headers.get('x-at') || 0)) / 1000, b = await hit.text(); if (age < FRESH) return res(b, 'hit'); ctx.waitUntil(build().then(put).catch(() => {})); return res(b, 'stale'); }
  try { const b = await build(); ctx.waitUntil(put(b)); return res(b, 'miss'); } catch (e) { return new Response('{"ok":false,"items":[]}', { status: 502, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } }); }
}
