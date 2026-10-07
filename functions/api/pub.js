/* แคชข้อมูลสาธารณะจาก Apps Script ไว้ที่ Cloudflare (ใกล้ผู้ใช้) ให้หน้าเว็บโหลดเร็ว
 * ใช้เฉพาะคำขอที่ไม่มีรหัสอาสา: action = list | teams | network | outreach
 * สด 20 วินาที · ถ้าเก่ากว่านั้นแต่ไม่เกิน 10 นาที ส่งของเดิมไปก่อนแล้วดึงใหม่เบื้องหลัง (stale-while-revalidate) */
const API = 'https://script.google.com/macros/s/AKfycbwxY1eDJnkqCInUCv9bye2WLd2HXuGUyVH9mElVCl5I04UFVI3VfoUr2yxMMFHEIvhW9A/exec';
const ALLOW = ['list', 'teams', 'network', 'outreach'];
const FRESH = 20, STALE = 600;

async function pull(action) {
  const r = await fetch(API + '?action=' + action + '&t=' + Date.now(), { redirect: 'follow', headers: { 'User-Agent': 'HelpMe-edge-cache (helpme4u.com)' } });
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch (e) { return null; }
  if (!j || !j.ok) return null;
  return txt;
}
function out(body, at, state) {
  return new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-at': String(at), 'x-cache': state, 'access-control-allow-origin': '*' } });
}
export async function onRequestGet(ctx) {
  const action = new URL(ctx.request.url).searchParams.get('action') || 'list';
  if (!ALLOW.includes(action)) return new Response('{"ok":false,"error":"action"}', { status: 400, headers: { 'content-type': 'application/json' } });
  const cache = caches.default;
  const key = new Request('https://helpme4u.com/__pub/' + action);
  const refresh = async () => {
    const body = await pull(action);
    if (body) await cache.put(key, new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + STALE, 'x-at': String(Date.now()) } }));
    return body;
  };
  const hit = await cache.match(key);
  if (hit) {
    const at = Number(hit.headers.get('x-at')) || 0, age = (Date.now() - at) / 1000, body = await hit.text();
    if (age < FRESH) return out(body, at, 'hit');
    if (age < STALE) { ctx.waitUntil(refresh().catch(() => {})); return out(body, at, 'stale'); }
  }
  try { const body = await refresh(); if (body) return out(body, Date.now(), 'miss'); } catch (e) {}
  return new Response('{"ok":false,"error":"upstream"}', { status: 502, headers: { 'content-type': 'application/json' } });
}
