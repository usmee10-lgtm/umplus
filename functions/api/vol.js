/* แคชข้อมูลโหมดอาสา (มีชื่อ/เบอร์) ไว้ที่ Cloudflare ให้อาสาโหลดเร็ว โดยไม่เก็บรหัสอาสาไว้ที่ไหนเลย
 * - รับรหัสทาง header x-vol-key (ไม่ใส่ใน URL จะได้ไม่ติดใน log)
 * - กุญแจของแคช = SHA-256 ของรหัส → คนที่ไม่มีรหัสที่ถูกต้องเปิดแคชนี้ไม่ได้
 * - เก็บแคชเฉพาะคำตอบที่ Apps Script ยืนยันว่าเป็นอาสา (volunteer:true) · รหัสผิดจะไม่ถูกแคช
 * - สด 15 วินาที · เก่าได้ไม่เกิน 2 นาที (ส่งของเดิมก่อน แล้วดึงใหม่เบื้องหลัง) */
const API = 'https://script.google.com/macros/s/AKfycbwxY1eDJnkqCInUCv9bye2WLd2HXuGUyVH9mElVCl5I04UFVI3VfoUr2yxMMFHEIvhW9A/exec';
const ALLOW = ['list', 'teams'];
const FRESH = 15, STALE = 120;

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('helpme4u|' + s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function pull(action, key) {
  const r = await fetch(API + '?action=' + action + '&key=' + encodeURIComponent(key) + '&t=' + Date.now(), { redirect: 'follow', headers: { 'User-Agent': 'HelpMe-edge-cache (helpme4u.com)' } });
  const txt = await r.text();
  try { const j = JSON.parse(txt); return { txt, ok: !!(j && j.ok), vol: !!(j && j.volunteer) }; } catch (e) { return null; }
}
const ORIGINS = /^https:\/\/((www\.)?helpme4u\.com|([a-z0-9-]+\.)?(umplus-help|umplus|helpme-th)\.pages\.dev)$/;
let CORS = {};
function cors(req) { const o = req.headers.get('origin') || ''; CORS = ORIGINS.test(o) ? { 'access-control-allow-origin': o, 'access-control-allow-headers': 'x-vol-key', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400', 'access-control-expose-headers': 'x-at, x-cache', vary: 'origin' } : {}; }
export async function onRequestOptions(ctx) { cors(ctx.request); return new Response(null, { status: 204, headers: CORS }); }
function out(body, at, state) {
  return new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store, private', 'x-at': String(at), 'x-cache': state, ...CORS } });
}
export async function onRequestGet(ctx) {
  cors(ctx.request);
  const action = new URL(ctx.request.url).searchParams.get('action') || 'list';
  const key = (ctx.request.headers.get('x-vol-key') || '').trim();
  if (!ALLOW.includes(action) || !key || key.length > 80) return new Response('{"ok":false,"error":"bad"}', { status: 400, headers: { 'content-type': 'application/json', ...CORS } });
  const cache = caches.default;
  const ck = new Request('https://helpme4u.com/__vol/' + action + '/' + await sha(key));
  const refresh = async () => {
    const r = await pull(action, key);
    if (r && r.ok && r.vol) await cache.put(ck, new Response(r.txt, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + STALE, 'x-at': String(Date.now()) } }));
    return r;
  };
  const hit = await cache.match(ck);
  if (hit) {
    const at = Number(hit.headers.get('x-at')) || 0, age = (Date.now() - at) / 1000, body = await hit.text();
    if (age < FRESH) return out(body, at, 'hit');
    if (age < STALE) { ctx.waitUntil(refresh().catch(() => {})); return out(body, at, 'stale'); }
  }
  try { const r = await refresh(); if (r && r.ok) return out(r.txt, Date.now(), 'miss'); } catch (e) {}
  return new Response('{"ok":false,"error":"upstream"}', { status: 502, headers: { 'content-type': 'application/json', ...CORS } });
}
