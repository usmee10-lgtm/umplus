/* รวมข่าวภัยพิบัติ + ประกาศเตือนภัย ในคำขอเดียว (แอปเรียกครั้งเดียว โหลดเร็วขึ้น)
 * GET /api/feed → {ok, at, news:[...], alerts:[...]} · ถ้าแหล่งใดล่ม ส่งอีกแหล่งไปก่อน */
import { build as buildNews } from './news.js';
import { build as buildAlerts } from './alerts.js';
export async function onRequestGet() {
  const [n, a] = await Promise.allSettled([buildNews(), buildAlerts()]);
  const nj = n.status === 'fulfilled' ? JSON.parse(n.value) : {}, news = nj.items || [];
  const alerts = a.status === 'fulfilled' ? (JSON.parse(a.value).alerts || []) : [];
  return new Response(JSON.stringify({ ok: true, at: Date.now(), news, alerts, sources: { news: n.status === 'fulfilled', alerts: a.status === 'fulfilled', stat: nj.stat || (n.reason && String(n.reason.message || n.reason)) } }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=3600' } });
}
