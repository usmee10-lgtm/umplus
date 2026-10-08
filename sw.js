/* Service worker: network-first เก็บหน้าไว้ใช้ตอนสัญญาณแย่ · เปลี่ยน CACHE ทุกครั้งที่แก้ไฟล์ */
const CACHE='ummatee-v176';
const SHELL=['./','./index.html','./app.css','./icons.js','./geocode.js','./location.js','./pickmap.js','./stats.js','./hotlines.js','./script.js','./notify.js','./manifest.webmanifest','./assets/ummatee-logo.png','./assets/helpme-logo.png','./assets/hands-w.png','./assets/hm-icon-192.png','./assets/hm-icon-512.png'];
/* ถ้าโหลดไฟล์หลักไม่ครบ ให้ติดตั้งล้มเหลว → SW ตัวเก่า (และแคชเก่า) ยังใช้งานได้ ไม่หายทั้งชุด */
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
const TILES='ofm-tiles-v1',TILE_MAX=1500;   /* แผนที่ OpenFreeMap ที่เคยดู เก็บไว้ใช้ตอนสัญญาณอ่อน (ไม่ลบเมื่ออัปเดตแอป) */
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==CACHE+'-ext'&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/hm/'))return;
  if(url.hostname.includes('script.google')||url.hostname.includes('googleusercontent')||url.hostname.includes('photon.komoot'))return; /* ข้อมูลสดเสมอ */
  if(url.hostname==='unpkg.com'||url.hostname==='fonts.gstatic.com'||url.hostname==='fonts.googleapis.com'){
    e.respondWith(caches.open(CACHE+'-ext').then(async c=>{const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}));return}
  /* แผนที่เวกเตอร์ OpenFreeMap: ใช้ของในแคชก่อน (โหลดเร็ว ใช้ได้ตอนเน็ตอ่อน) แล้วอัปเดตเบื้องหลัง */
  if(url.hostname==='tiles.openfreemap.org'){
    e.respondWith(caches.open(TILES).then(async c=>{const hit=await c.match(req);
      /* ไฟล์ tile (.pbf) มีวันที่ชุดข้อมูลใน URL = ไม่เปลี่ยน → ใช้ของในแคชเลย ไม่ต้องโหลดซ้ำ · style/รายการ tile อัปเดตเบื้องหลัง */
      if(hit&&/\.pbf$/.test(url.pathname))return hit;
      const net=fetch(req).then(r=>{if(r.ok){c.put(req,r.clone());if(Math.random()<.02)c.keys().then(ks=>{if(ks.length>TILE_MAX)ks.slice(0,ks.length-TILE_MAX).forEach(k=>c.delete(k))})}return r});
      if(hit){net.catch(()=>{});return hit}return net}));return}
  if(url.origin!==location.origin)return;
  /* network-first แต่รอไม่เกิน 4 วิ (สัญญาณอ่อน) แล้วใช้ของในแคช · ถ้าแคชไม่มีก็รอเน็ตต่อ */
  const net=fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return r});
  const cached=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||(req.mode==='navigate'?caches.match('./index.html'):undefined));
  e.respondWith(new Promise(res=>{let done=false;const fin=r=>{if(!done&&r){done=true;res(r)}};
    const tm=setTimeout(()=>cached().then(fin),4000);
    net.then(r=>{clearTimeout(tm);fin(r)}).catch(()=>{clearTimeout(tm);cached().then(r=>{if(r)fin(r);else if(!done){done=true;res(Response.error())}})});
    net.catch(()=>{})}));
});
