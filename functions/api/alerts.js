/* ประกาศเตือนภัยทั่วประเทศไทยแบบเรียลไทม์ (แคชที่ Cloudflare 5 นาที)
 *  - กรมอุตุนิยมวิทยา: ฟีด CAP (Common Alerting Protocol) https://www.tmd.go.th/api/xml/CAP → อ่านประกาศล่าสุดทีละฉบับ
 *  - แผ่นดินไหวในไทยและใกล้เคียง (USGS, ขนาด ≥ 3.5 ใน 3 วัน)
 * GET /api/alerts → {ok, at, alerts:[{id, src, event, title, desc, severity, urgency, areas[], sent, expires, url}]} */
const TMD_RSS = 'https://www.tmd.go.th/api/xml/CAP';
const FRESH = 300, STALE = 3600;
const UA = { 'User-Agent': 'HelpMe-flood-help (helpme4u.com)' };
const tag = (x, t) => { const m = x.match(new RegExp('<(?:\\w+:)?' + t + '[^>]*>([\\s\\S]*?)</(?:\\w+:)?' + t + '>', 'i')); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
const tags = (x, t) => [...x.matchAll(new RegExp('<(?:\\w+:)?' + t + '[^>]*>([\\s\\S]*?)</(?:\\w+:)?' + t + '>', 'gi'))].map(m => m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim());
const unent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const EV_TH = { 'Heavy Rain': 'ฝนตกหนัก', 'Very Heavy Rain': 'ฝนตกหนักมาก', 'Storm': 'พายุ', 'Tropical Storm': 'พายุโซนร้อน', 'Tropical Depression': 'พายุดีเปรสชัน', 'Thunderstorm': 'พายุฝนฟ้าคะนอง', 'Strong Wind': 'ลมแรง', 'High Wave': 'คลื่นลมแรง', 'Cold Wave': 'อากาศหนาว', 'Heat': 'อากาศร้อนจัด', 'Flood': 'น้ำท่วม', 'Flash Flood': 'น้ำป่าไหลหลาก' };

async function tmd() {
  const r = await fetch(TMD_RSS, { headers: UA, cf: { cacheTtl: 120 } });
  const xml = await r.text();
  const items = tags(xml, 'item').slice(0, 6);
  const out = [];
  await Promise.all(items.map(async (it, i) => {
    const link = unent(tag(it, 'link')), title = unent(tag(it, 'title'));
    let a = { id: 'tmd-' + (link.match(/CAPTMD(\d+)/) || [, i])[1], src: 'กรมอุตุนิยมวิทยา', event: title, title, desc: '', severity: '', urgency: '', areas: [], sent: Date.parse(tag(it, 'pubDate')) || 0, expires: 0, url: 'https://www.tmd.go.th' };
    try {
      if (/^https:\/\/www\.tmd\.go\.th\//.test(link)) {
        const cap = await (await fetch(link, { headers: UA, cf: { cacheTtl: 600 } })).text();
        const info = tags(cap, 'info').find(x => /th/i.test(tag(x, 'language'))) || tags(cap, 'info')[0] || '';
        const ev = tag(info, 'event');
        a.event = EV_TH[ev] || title || ev;
        a.title = unent(tag(info, 'headline')) || a.event;
        a.desc = unent(tag(info, 'description')).replace(/\s+/g, ' ').slice(0, 420);
        a.severity = tag(info, 'severity'); a.urgency = tag(info, 'urgency');
        a.areas = [...new Set(tags(info, 'areaDesc').map(unent))].slice(0, 40);
        a.sent = Date.parse(tag(cap, 'sent')) || a.sent;
        a.expires = Date.parse(tag(info, 'expires')) || 0;
        const web = tag(info, 'web'); if (/^https?:\/\//.test(web)) a.url = web;
      }
    } catch (e) {}
    out.push(a);
  }));
  return out;
}

async function quakes() {
  const since = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  const u = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&limit=8&minmagnitude=3.5&minlatitude=5.5&maxlatitude=21&minlongitude=96.5&maxlongitude=106&starttime=' + since;
  const j = await (await fetch(u, { headers: UA, cf: { cacheTtl: 120 } })).json();
  return (j.features || []).map(f => ({ id: 'eq-' + f.id, src: 'USGS', event: 'แผ่นดินไหว', title: 'แผ่นดินไหวขนาด ' + (+f.properties.mag).toFixed(1), desc: f.properties.place || '',
    severity: f.properties.mag >= 6 ? 'Severe' : f.properties.mag >= 5 ? 'Moderate' : 'Minor', urgency: '', areas: [], sent: f.properties.time, expires: f.properties.time + 864e5,
    url: f.properties.url, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }));
}

async function build() {
  const [a, b] = await Promise.allSettled([tmd(), quakes()]);
  const list = [...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])];
  const now = Date.now();
  /* ประกาศที่หมดอายุเกิน 12 ชม. ไม่แสดง · เรียงใหม่สุดก่อน */
  const alerts = list.filter(x => !x.expires || x.expires > now - 12 * 36e5).sort((p, q) => q.sent - p.sent).slice(0, 10);
  return JSON.stringify({ ok: true, at: now, alerts, sources: { tmd: a.status === 'fulfilled', usgs: b.status === 'fulfilled' } });
}

const res = (body, state) => new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60', 'x-cache': state } });
export async function onRequestGet(ctx) {
  const cache = caches.default, key = new Request('https://helpme4u.com/__alerts/v1');
  const hit = await cache.match(key);
  const put = body => cache.put(key, new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + STALE, 'x-at': String(Date.now()) } }));
  if (hit) {
    const age = (Date.now() - (+hit.headers.get('x-at') || 0)) / 1000, body = await hit.text();
    if (age < FRESH) return res(body, 'hit');
    ctx.waitUntil(build().then(put).catch(() => {}));
    return res(body, 'stale');
  }
  try { const body = await build(); ctx.waitUntil(put(body)); return res(body, 'miss'); }
  catch (e) { return new Response('{"ok":false,"alerts":[]}', { status: 502, headers: { 'content-type': 'application/json' } }); }
}
