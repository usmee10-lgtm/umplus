/* โหมดปิดปรับปรุง (maintenance)
 * - MAINT=true → คนทั่วไปที่เปิดหน้าเว็บจะเห็นหน้า "กำลังปรับปรุง" แทนแอป (ไฟล์ js/css/รูป และ /api /hm ยังทำงานตามปกติ)
 * - ทีมพัฒนายังเปิดแอปจริงได้: เปิด https://helpme4u.com/?dev=1 ครั้งเดียว (จำไว้ในคุกกี้ 30 วัน) · ?dev=0 เพื่อกลับไปดูหน้าปรับปรุง
 * - เปิดระบบอีกครั้ง: แก้ MAINT เป็น false แล้ว deploy */
const MAINT = true;
const FB = 'https://www.facebook.com/profile.php?id=61595380281728';

const isPage = (req, url) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const p = url.pathname;
  if (p.startsWith('/api/') || p.startsWith('/hm/') || p.startsWith('/assets/')) return false;
  if (p === '/' || p === '/index.html') return true;
  return !/\.[a-z0-9]+$/i.test(p) && (req.headers.get('accept') || '').includes('text/html');
};

const PAGE = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>HELP ME 4U · กำลังปรับปรุงระบบ</title><meta name="robots" content="noindex"><meta name="theme-color" content="#F5F6F9">
<link rel="icon" type="image/png" href="/assets/favicon-64.png?v=2"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2">
<style>
:root{--ink:#16181F;--muted:#626879;--bg:#F5F6F9;--red:#C8102E}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"IBM Plex Sans Thai","Noto Sans Thai",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
main{min-height:100%;display:grid;place-items:center;padding:calc(env(safe-area-inset-top,0px) + 28px) 18px calc(env(safe-area-inset-bottom,0px) + 28px)}
.card{width:100%;max-width:440px;display:grid;justify-items:center;gap:18px;text-align:center}
.logo{height:30px;width:auto}
.mark{position:relative;display:grid;place-items:center;width:112px;height:112px;margin-top:6px}
.mark::before,.mark::after{content:"";position:absolute;inset:0;border-radius:32px;background:rgba(200,16,46,.10);animation:ring 2.6s ease-out infinite}
.mark::after{animation-delay:1.3s}
.mark img{position:relative;width:84px;height:84px;border-radius:22px;box-shadow:0 14px 30px -14px rgba(200,16,46,.7)}
@keyframes ring{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.35);opacity:0}}
h1{margin:4px 0 0;font-size:26px;font-weight:800;line-height:1.3;text-wrap:balance}
p{margin:0;font-size:15.5px;line-height:1.65;color:var(--muted);max-width:34ch}
.fb{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:56px;margin-top:6px;border-radius:18px;background:#1877F2;color:#fff;font-size:16.5px;font-weight:800;text-decoration:none;box-shadow:0 12px 24px -12px rgba(24,119,242,.85)}
.fb svg{width:22px;height:22px}
.sos{width:100%;margin-top:8px;padding:16px;border-radius:22px;background:#fff;box-shadow:0 1px 2px rgba(22,27,61,.05),0 8px 20px -14px rgba(22,27,61,.2)}
.sos b{display:block;font-size:14px;margin-bottom:10px}
.nums{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.nums a{display:grid;gap:2px;padding:10px 4px;border-radius:14px;background:#FFEEF0;color:var(--red);text-decoration:none}
.nums a strong{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums}.nums a span{font-size:11.5px;color:var(--muted)}
small{font-size:12px;color:#9A9FAE}
@media (prefers-reduced-motion:reduce){.mark::before,.mark::after{animation:none}}
</style></head><body><main><div class="card">
<img class="logo" src="/assets/helpme-logo.png" alt="HELP ME 4U">
<div class="mark" aria-hidden="true"><img src="/assets/apple-touch-icon.png?v=2" alt=""></div>
<h1>กำลังปรับปรุงระบบ</h1>
<p>เรากำลังพัฒนาให้ใช้งานได้ดีขึ้น ระหว่างนี้ติดต่อขอความช่วยเหลือและติดตามข่าวสารได้ที่เพจของเรา</p>
<a class="fb" href="${FB}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z"/></svg>ไปที่เพจ HELP ME 4U</a>
<div class="sos"><b>เหตุฉุกเฉิน โทรได้ทันที</b><div class="nums">
<a href="tel:1669"><strong>1669</strong><span>เจ็บป่วยฉุกเฉิน</span></a>
<a href="tel:1784"><strong>1784</strong><span>สาธารณภัย</span></a>
<a href="tel:191"><strong>191</strong><span>เหตุด่วนเหตุร้าย</span></a></div></div>
<small>ขออภัยในความไม่สะดวก</small>
</div></main></body></html>`;

export async function onRequest(ctx) {
  const { request: req, next } = ctx;
  if (!MAINT) return next();
  const url = new URL(req.url);
  const dev = url.searchParams.get('dev');
  if (dev === '1' || dev === '0') {
    const r = await next();
    const res = new Response(r.body, r);
    res.headers.append('set-cookie', `hm_dev=${dev}; Path=/; Max-Age=${dev === '1' ? 2592000 : 0}; Secure; SameSite=Lax`);
    res.headers.set('cache-control', 'no-store');
    if (dev === '0') return new Response(PAGE, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '3600', 'set-cookie': 'hm_dev=0; Path=/; Max-Age=0; Secure; SameSite=Lax' } });
    return res;
  }
  if (/(?:^|;\s*)hm_dev=1(?:;|$)/.test(req.headers.get('cookie') || '')) return next();
  if (!isPage(req, url)) return next();
  return new Response(req.method === 'HEAD' ? null : PAGE, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '3600' } });
}
