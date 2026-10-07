/* Help Me ช่วยด้วย — แอปหลัก */
const API_URL='https://script.google.com/macros/s/AKfycbwxY1eDJnkqCInUCv9bye2WLd2HXuGUyVH9mElVCl5I04UFVI3VfoUr2yxMMFHEIvhW9A/exec';
const REFRESH_MS=30000,QUEUE_MS=20000;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set(k,v){try{v==null||v===''?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}},
  json(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
/* ย้ายโดเมน: รับรายการ "คำขอของฉัน" ที่ส่งต่อมาจากโดเมนเก่า (#mig=...) แล้วรวมเข้ากับของในเครื่องนี้ */
(function(){const h=location.hash||'';if(h.indexOf('#mig=')!==0)return;
  try{const j=JSON.parse(decodeURIComponent(escape(atob(h.slice(5).replace(/-/g,'+').replace(/_/g,'/')))));
    const cur=store.json('uh_my_cases',[])||[],ids=new Set(cur.map(m=>String(m.id)));
    const add=(j.my||[]).filter(m=>m&&m.id&&!ids.has(String(m.id)));if(add.length)store.put('uh_my_cases',[...cur,...add].slice(-8));
    if(j.team&&!store.get('uh_team',''))store.set('uh_team',j.team);if(j.org&&!store.get('uh_org',''))store.set('uh_org',j.org);
  }catch(e){}
  try{history.replaceState(null,'',location.pathname+'#home')}catch(e){location.hash='#home'}})();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LEVEL_TH={dry:'แห้ง / ต่ำกว่าข้อเท้า',ankle:'ข้อเท้า–เข่า',knee:'เข่า–เอว',waist:'เอว–อก',chest:'อกขึ้นไป',roof:'มิดหัว / ท่วมหลังคา'};
const LEVEL_CM={dry:'< 10 ซม.',ankle:'10–50 ซม.',knee:'50–100 ซม.',waist:'100–130 ซม.',chest:'130–180 ซม.',roof:'> 180 ซม.'};
const LEVEL_COLOR={dry:'#5DBB6C',ankle:'#E2B93B',knee:'#EE8A3C',waist:'#D9534A',chest:'#A3405E',roof:'#5E3BA8'};
/* รูปคนยืนในน้ำ · ระดับน้ำ (y) ไล่ตามความสูงตัวคน */
const LEVEL_Y={dry:57,ankle:49,knee:39,waist:29,chest:19,roof:3};
function levelSvg(k){const y=LEVEL_Y[k],c=LEVEL_COLOR[k];
  const house=k==='roof'?'<path class="lv-house" d="M8 62V24L30 8l22 16v38z"/>':'';
  const wave=`<path class="lv-wv" d="M6 ${y} q4 -2.4 8 0 t8 0 t8 0 t8 0 t8 0 t8 0"/>`;
  return `<svg viewBox="0 0 60 64" aria-hidden="true">${house}<g class="lv-man"><circle cx="30" cy="9" r="5.5"/><rect x="24.5" y="16.5" width="11" height="20" rx="3"/><path d="M22.5 19l-3 13M37.5 19l3 13" class="lv-arm"/><rect x="25.2" y="35" width="4.3" height="25" rx="2"/><rect x="30.5" y="35" width="4.3" height="25" rx="2"/></g><rect class="lv-water" x="6" y="${y}" width="48" height="${62-y}" fill="${c}"/>${wave}</svg>`}
function levelLabel(k){return LEVEL_TH[k]?LEVEL_TH[k]+' ('+LEVEL_CM[k]+')':'ไม่ระบุ'}
document.addEventListener('change',e=>{if(e.target.name==='level'&&typeof markOk==='function')markOk('level')});
(function(){const g=document.getElementById('level-chips');if(!g)return;g.innerHTML=Object.keys(LEVEL_TH).map(k=>`<label style="--lv:${LEVEL_COLOR[k]}"><input type="radio" name="level" value="${k}"><span>${levelSvg(k)}<b>${LEVEL_TH[k]}</b><small>${LEVEL_CM[k]}</small></span></label>`).join('')})();
const STATUS_TH={open:'รอช่วย',going:'กำลังไป',done:'ช่วยแล้ว',skip:'ไม่เข้าเกณฑ์'};
function iconify(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{if(el.dataset.iconDone)return;el.insertAdjacentHTML('afterbegin',ic(el.dataset.icon));el.dataset.iconDone='1'})}
function toast(msg,opt={}){const t=document.createElement('div');t.className='toast'+(opt.ok?' ok':'');t.setAttribute('role','status');
  t.innerHTML=ic(opt.icon||(opt.ok?'check':'info'))+'<span></span>';t.querySelector('span').textContent=msg;
  if(opt.action){const b=document.createElement('button');b.type='button';b.textContent=opt.action;b.onclick=()=>{opt.onAction&&opt.onAction();t.remove()};t.append(b)}
  $('#toasts').append(t);const kill=()=>{if(t.contains(document.activeElement)||t.matches(':hover'))setTimeout(kill,2000);else t.remove()};setTimeout(kill,opt.ms||(opt.action?10000:5000))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function ago(ts){const t=Number(ts)||Date.parse(ts);if(!t)return '';const m=Math.round((Date.now()-t)/60000);if(m<1)return 'เมื่อสักครู่';if(m<60)return m+' นาทีที่แล้ว';const h=Math.round(m/60);if(h<24)return h+' ชั่วโมงที่แล้ว';return new Date(t).toLocaleDateString('th-TH',{day:'numeric',month:'short'})+' '+new Date(t).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}
const hasPin=c=>c&&c.lat!==''&&c.lat!=null&&c.lng!==''&&c.lng!=null&&!isNaN(+c.lat)&&!isNaN(+c.lng);
const isClosed=c=>c.status==='done'||c.status==='skip';   /* ปิดแล้ว = ช่วยแล้ว หรือ ไม่เข้าเกณฑ์ */
const isDanger=c=>Number(c.urgency)>=3&&!isClosed(c);  /* ด่วนมาก + วิกฤต */
const pinKind=c=>c.status==='skip'?'skip':c.status==='done'?'done':c.status==='going'?'going':isDanger(c)?'danger':'open';
const sevOf=c=>Math.min(4,Math.max(1,Number(c.urgency)||1));
/* ความเร่งด่วน 3 ระดับ: ทั่วไป · ปานกลาง · ด่วน (ค่าที่ส่งเข้าชีตยังเป็นข้อความเดิม เพื่อให้ Code.gs ใช้ได้เหมือนเดิม) */
const URG_TH={1:'ทั่วไป',2:'เร่งด่วน',3:'ด่วนมาก',4:'วิกฤต'};
const URG_BY_LABEL={'รอได้':1,'ด่วน ต้องการเร็ว':2,'อันตรายถึงชีวิต ด่วนมาก':3};
function urgChip(c){const v=sevOf(c);return `<span class="urg urg-${v}"><i></i>${URG_TH[v]}</span>`}
/* คนทั่วไปเห็นแค่เขต + ตำแหน่งโดยประมาณ (~500 ม.) — กรองซ้ำในเครื่องเผื่อเซิร์ฟเวอร์ยังเป็นรุ่นเก่า */
const PUB_GRID=0.005,snapC=v=>v===''||v==null||isNaN(+v)?'':Math.round(Math.round(+v/PUB_GRID)*PUB_GRID*1e4)/1e4;
function pubCase(c){return {id:c.id,createdAt:c.createdAt,updatedAt:c.updatedAt,status:c.status,urgency:c.urgency,level:c.level,needs:c.needs,people:c.people,
  district:c.district||((String(c.address||'').match(/เขต\s*([ก-๙]+)/)||[])[1])||'',lat:c.approx?c.lat:snapC(c.lat),lng:c.approx?c.lng:snapC(c.lng),approx:true}}
/* ชื่อพื้นที่: เขตในกรุงเทพฯ ใส่ "เขต" นำหน้า · ต่างจังหวัด (ตำบล/อำเภอ/จังหวัด) ใช้ชื่อตามเดิม */
const areaLabel=d=>!d?'':/^(ตำบล|อำเภอ|แขวง|จังหวัด|ต\.|อ\.|สมุทร|นนทบุรี|ปทุม)/.test(d)?d:'เขต'+d;
const distTxt=c=>areaLabel(typeof areaOf==='function'?areaOf(c):String(c.district||'').replace(/^เขต/,''));
/* ที่อยู่ที่แสดง: อาสาเห็นเต็ม · คนทั่วไปเห็นแค่เขต */
const addrTxt=c=>S.volunteer?[c.address,c.district?'เขต'+String(c.district).replace(/^เขต/,''):''].filter(Boolean).join(' · '):distTxt(c);
/* หน่วยงานที่ลงพื้นที่ช่วย · ใส่ไฟล์โลโก้ใน logo ได้ (เช่น './assets/org-cicot.png') แทนป้ายตัวหนังสือ */
const ORGS=[{name:'สภาเครือข่ายฯ สำนักจุฬาราชมนตรี',short:'สภาฯ',color:'#7C3AED',logo:''},{name:'มูลนิธิป่อเต็กตึ๊ง',short:'ป่อเต็กตึ๊ง',color:'#C2410C',logo:''},{name:'มูลนิธิร่วมกตัญญู',short:'ร่วมกตัญญู',color:'#B45309',logo:''},{name:'มุสลิมสงเคราะห์ผู้ประสบภัย',short:'มุสลิมสงเคราะห์',color:'#0E7490',logo:''},{name:'ทีมกู้ภัย',short:'กู้ภัย',color:'#E8590C',logo:''},{name:'มูลนิธิอุมมะตี',short:'อุมมะตี',color:'#2E9E57',logo:''},{name:'อื่น ๆ',short:'ทีม',color:'#5B6386',logo:''}];
/* องค์กร/อาสาที่ไม่อยู่ในรายการ: ป้ายเป็นชื่อเอง (ตัดให้สั้น) สีเทาอมน้ำเงิน */
const orgOf=n=>{n=String(n||'').trim();return ORGS.find(o=>o.name===n)||ORGS.find(o=>n&&(n.includes(o.short)||o.name.includes(n)))||{name:n||'ทีมอาสา',short:n?(n.length>12?n.slice(0,11)+'…':n):'ทีม',color:'#5B6386',logo:''}};
const orgOpts=sel=>ORGS.map(o=>`<option value="${esc(o.name)}" ${o.name===sel?'selected':''}>${esc(o.name)}</option>`).join('');
function statusChip(c){const k=pinKind(c);const txt=STATUS_TH[c.status]||'รอช่วย';return `<span class="st st-${k}">${esc(txt)}</span>`}

/* ---------- API (POST แบบ text/plain JSON) ---------- */
async function apiPost(body,timeout=20000){const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),timeout);
  try{const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),signal:ctl.signal});return await r.json()}finally{clearTimeout(tm)}}
/* ส่งคำขอ (create) แบบทนทาน: หลังบ้านตอบช้า/สะดุดเป็นช่วง ๆ → ลองซ้ำ 3 ครั้ง (หลังบ้านกันเคสซ้ำด้วย clientId อยู่แล้ว)
 * onTry(n) ให้หน้าจอบอกผู้ใช้ว่ากำลังลองครั้งที่เท่าไร · คืนผลจากหลังบ้าน หรือ throw ถ้าติดต่อไม่ได้ทั้ง 3 ครั้ง */
async function postCreate(body,onTry){const photos=(body.photos||[]).length,waits=[0,2500,6000];let last;
  for(let i=0;i<waits.length;i++){if(waits[i])await new Promise(z=>setTimeout(z,waits[i]));onTry&&onTry(i+1);
    try{const r=await apiPost(body,photos?75000:30000);if(r&&(r.ok||r.error==='missing'||r.error==='rate'))return r;last=new Error(r&&r.error||'bad_response')}catch(e){last=e}
    if(!navigator.onLine)break}
  throw last||new Error('send_failed')}
/* GET อ่านอย่างเดียว ปลอดภัยที่จะลองซ้ำ: Apps Script บางครั้งตอบหน้า error (HTML) หรือช้าตอนเพิ่งตื่น → ลองใหม่ 1 ครั้ง */
async function apiGet(params,timeout=25000,retry=1){const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),timeout);
  try{const r=await fetch(API_URL+'?'+new URLSearchParams(params),{signal:ctl.signal});const t=await r.text();return JSON.parse(t)}
  catch(e){if(retry>0&&navigator.onLine){await new Promise(z=>setTimeout(z,800));return apiGet(params,timeout,retry-1)}throw e}
  finally{clearTimeout(tm)}}

/* ---------- สถานะแอป ---------- */
const S={cases:[],loaded:0,loading:false,volunteer:false,view:null,maps:{},flood:null,teams:[],me:null};
const volKey=()=>store.get('uh_vol_key','');
S.volunteer=!!(volKey()&&store.get('uh_vol_ok',''));

async function loadCases(force){
  if(S.loading){if(force&&S.loadP){await S.loadP.catch(()=>{});return loadCases()}return}  /* force: รอรอบที่กำลังโหลดอยู่ แล้วโหลดใหม่ */
  S.loading=true;let done;S.loadP=new Promise(r=>done=r);
  try{await loadCasesInner()}finally{done()}
  if(S.reload){S.reload=false;return loadCases()}}
async function loadCasesInner(){$('#sync-status').textContent='กำลังอัปเดต…';
  try{
    const key=volKey(),p={action:'list',t:Math.floor(Date.now()/15000)};if(key)p.key=key;
    const r=await apiGet(p);if(!r||!r.ok)throw new Error(r&&r.error||'list');
    /* รหัสเปลี่ยนระหว่างรอ (เพิ่งเข้า/ออกโหมดอาสา) → ผลนี้เก่าแล้ว ทิ้งไป แล้วโหลดใหม่ ไม่งั้นจะลบรหัสที่เพิ่งใส่ถูก */
    if(key!==volKey()){S.reload=true;return}
    const prev=new Set(S.cases.map(c=>String(c.id)));const first=!S.loaded;
    S.cases=(r.cases||[]).map(c=>({...c,needs:Array.isArray(c.needs)?c.needs:String(c.needs||'').split(/\s*,\s*/).filter(Boolean)})).map(c=>r.volunteer?c:pubCase(c));
    S.loaded=Date.now();
    if(volKey()){const was=S.volunteer;S.volunteer=!!r.volunteer;store.set('uh_vol_ok',r.volunteer?'1':'');if(!r.volunteer&&was){store.set('uh_vol_key','');toast('รหัสอาสาไม่ถูกต้อง')}}
    if(!S.volunteer)store.put('uh_cases_cache',{at:S.loaded,cases:S.cases});
    if(S.volunteer&&!first){const fresh=S.cases.filter(c=>!prev.has(String(c.id))&&c.status==='open');
      fresh.slice(0,3).forEach(c=>toast('เคสใหม่: '+(c.needs||[]).join(', ')+' · '+(c.people||1)+' คน',{icon:'alert',action:'ดูเคส',onAction:()=>openCase(c.id),ms:9000}))}
    if(!S.volunteer)setTimeout(()=>fillAreas&&fillAreas(),0);
    $('#sync-status').textContent='อัปเดต '+new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  }catch(e){
    if(!S.cases.length&&!S.volunteer){const c=store.json('uh_cases_cache',null);if(c&&c.cases){S.cases=c.cases.map(pubCase)}}
    $('#sync-status').textContent=navigator.onLine?'เชื่อมต่อไม่ได้ · ลองใหม่อัตโนมัติ':'ไม่มีสัญญาณ';
  }finally{S.loading=false;renderAll()}
}
function renderAll(){
  $('#live-badge').hidden=!(S.loaded&&Date.now()-S.loaded<REFRESH_MS*3);
  drawPins('home');drawPins('map');renderList();$('#all-count').textContent=S.loaded&&S.volunteer?S.cases.filter(c=>!isTestCase(c)).length+' เคส':'';renderMyReq();renderVol();
  if(S.view==='detail'&&S.detailId)renderDetail(false);
  const stTab=$('.tabbar [data-go=stats]');if(stTab)stTab.style.display=S.volunteer?'':'none';
  if(S.view==='stats'){if(S.volunteer)renderStats();else go('home')}
  if(typeof tripRefresh==='function')tripRefresh();
  if(typeof drawHelped==='function'&&teamsOn()&&S.outreach)drawHelped();
  if(typeof syncVolLayers==='function')syncVolLayers();
}

/* ---------- เปลี่ยนหน้า ---------- */
function go(view,push=true){
  if(view==='stats'&&!S.volunteer){view='home';if(!push)history.replaceState({view},'','#home')}  /* หน้าสรุปเฉพาะทีมอาสา */
  if(view===S.view&&view!=='detail'){return}
  if(S.view==='map'&&view!=='map')S.mapState={open:$('#list-sheet').classList.contains('open'),top:$('#list-body').scrollTop};  /* จำตำแหน่งรายการไว้ กลับมาแล้วอยู่ที่เดิม */
  $$('.view').forEach(v=>{const on=v.id==='view-'+view;v.classList.toggle('active',on);v.hidden=!on});
  S.view=view;document.body.classList.toggle('in-form',view==='form');
  $$('.tabbar button').forEach(b=>b.classList.toggle('active',b.dataset.go===(view==='detail'?'map':view==='sent'||view==='form'?'home':view)));
  closeLayerMenu(false);$$('.tabbar button').forEach(b=>b.classList.contains('active')?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
  if(push&&location.hash!=='#'+view)history.pushState({view},'', '#'+view);
  if(view==='home')ensureMap('home');
  if(view==='map'){ensureMap('map');if(S.mapState){const ms=S.mapState;S.mapState=null;setSheet(ms.open);requestAnimationFrame(()=>{$('#list-body').scrollTop=ms.top})}}
  if(view==='stats')renderStats();
  if(view==='form'){if(F.done)resetForm();showStep(F.step||1);ensureFormMap()}
  if(view!=='detail'&&S.detailMap){S.detailMap.remove();S.detailMap=null}
  window.scrollTo(0,0);
  setTimeout(()=>Object.values(S.maps).forEach(m=>m&&m.invalidateSize()),60);
  if(A11Y.ready)focusView(view);  /* ย้ายโฟกัสไปหัวข้อของหน้าใหม่ ให้โปรแกรมอ่านหน้าจออ่านต่อจากตรงนั้น */
}
const A11Y={ready:false};
function focusView(view){const v=$('#view-'+view);if(!v)return;const t=v.querySelector('h1[tabindex]')||v;if(t===v)v.tabIndex=-1;
  setTimeout(()=>{if(!v.contains(document.activeElement)||document.activeElement===document.body)t.focus({preventScroll:true})},0)}
$('#skip-link').addEventListener('click',e=>{e.preventDefault();focusView(S.view||'home')});
addEventListener('popstate',()=>{const v=(location.hash||'#home').slice(1);go(['home','map','emergency','stats','form','detail','sent'].includes(v)?v:'home',false)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){e.preventDefault();go(b.dataset.go);if(b.dataset.go==='map'&&b.closest('.tabbar'))setSheet(true)}});   /* แท็บ "รายการ" เปิดรายการขึ้นมาเลย */

/* ---------- แผนที่หลัก ---------- */
const PIN_LAYER={};
async function ensureMap(which){
  if(S.maps[which]){S.maps[which].invalidateSize();return S.maps[which]}
  const el=$(which==='home'?'#home-map':'#cases-map');
  try{await loadLeaflet()}catch(e){el.innerHTML='<p class="empty">โหลดแผนที่ไม่สำเร็จ · ตรวจอินเทอร์เน็ต</p>';return null}
  if(S.maps[which])return S.maps[which];
  const m=makeMap(el,{zoom:11});S.maps[which]=m;PIN_LAYER[which]=L.layerGroup().addTo(m);
  m.on('baselayerchange',()=>{});
  drawPins(which);if(S.volunteer)volLayersOn();
  if(which==='map'&&typeof drawTrip==='function')drawTrip();
  return m;
}
let fitted={};
function drawPins(which){
  const m=S.maps[which],lg=PIN_LAYER[which];if(!m||!lg)return;
  if(m._popup&&m.hasLayer(m._popup)){m._pinsStale=true;if(!m._pinsHook){m._pinsHook=1;m.on('popupclose',()=>{if(m._pinsStale){m._pinsStale=false;setTimeout(()=>drawPins(which),0)}})}return}  /* อาสากำลังอ่าน popup อยู่ → ค่อยวาดใหม่ตอนปิด */
  lg.clearLayers();
  const list=which==='home'?visibleCases().filter(c=>!isClosed(c)):filteredCases();
  const pts=[];
  list.filter(hasPin).forEach(c=>{const k=pinKind(c);pts.push([+c.lat,+c.lng]);
    L.marker([+c.lat,+c.lng],{icon:pinIcon(k),zIndexOffset:k==='danger'?1000:k==='open'?500:0,title:[k==='danger'?'ด่วน':STATUS_TH[c.status]||'รอช่วย',((c.needs||[]).join(', ')||'ขอความช่วยเหลือ'),(c.people||1)+' คน'].join(' · ')}).bindPopup(()=>popupHtml(c)).addTo(lg)});
  if(!fitted[which]&&pts.length){  /* เว้นที่ให้แผงล่าง/แถบค้นหาบนมือถือ ไม่ให้หมุดไปซ่อนใต้แผง */
    const sh=which==='home'&&!isDesktop()?($('#view-home .home-sheet')||{}).offsetHeight||0:0;
    /* ตัดจุดที่อยู่ไกลจากกลุ่มหลักมาก (>40 กม. จากค่ามัธยฐาน) เพื่อไม่ให้แผนที่ซูมออกทั้งภาค */
    const med=a=>{const x=[...a].sort((p,q)=>p-q);return x[Math.floor(x.length/2)]},mc={lat:med(pts.map(p=>p[0])),lng:med(pts.map(p=>p[1]))};
    const core=pts.filter(p=>kmBetween(mc,{lat:p[0],lng:p[1]})<=40);
    m.fitBounds(core.length?core:pts,{paddingTopLeft:[40,which==='home'?150:60],paddingBottomRight:[40,(sh||0)+40],maxZoom:14});fitted[which]=true}
}
function popupHtml(c){
  const addr=addrTxt(c)||(S.volunteer?'':'ไม่ระบุเขต');
  const tel=String(c.phone||'').replace(/[^\d+]/g,'');
  return `<div class="pop">${!isClosed(c)?urgChip(c)+' ':''}${statusChip(c)}<br><b>${esc((c.needs||[]).join(', ')||'ขอความช่วยเหลือ')}</b> · ${esc(c.people||1)} คน`+
    (c.level?`<br>ระดับน้ำ: ${esc(LEVEL_TH[c.level]||c.level)}`:'')+(addr?`<br>${esc(addr)}`:'')+(S.volunteer?'':'<br><small>ตำแหน่งโดยประมาณ</small>')+
    (S.volunteer&&(c.name||c.phone)?`<br>${c.name?esc(c.name)+' ':''}${c.phone?(S.volunteer&&tel.length>=9?`<a href="tel:${esc(tel)}">${esc(c.phone)}</a>`:esc(c.phone)):''}`:'')+
    `<div class="pop-act"><a href="#" data-open="${esc(c.id)}">ดูรายละเอียด</a>`+
    (S.volunteer&&!isClosed(c)&&hasPin(c)?` · <a href="#" data-trip="${esc(c.id)}">${typeof tripIndex==='function'&&tripIndex(c.id)>=0?'อยู่ในแผนแล้ว':'+ แผนเดินทาง'}</a>`:'')+`</div></div>`;
}
document.addEventListener('click',e=>{const a=e.target.closest('[data-open]');if(a){e.preventDefault();openCase(a.dataset.open)}
  const t=e.target.closest('[data-trip]');if(t){e.preventDefault();tripToggle(t.dataset.trip);t.textContent=tripIndex(t.dataset.trip)>=0?'อยู่ในแผนแล้ว':'+ แผนเดินทาง'}});

/* เลเยอร์ / ตำแหน่งของฉัน */
let layerFor=null;
document.addEventListener('click',e=>{
  const f=e.target.closest('.fab[data-act]');
  if(f){const which=S.view==='map'?'map':'home';
    if(f.dataset.act==='layers'){const menu=$('#layer-menu');if(!menu.hidden&&layerFor===which){closeLayerMenu(true);return}layerFor=which;layerBtn=f;const r=f.getBoundingClientRect();
      menu.style.top=Math.max(8,Math.min(r.bottom+8,innerHeight-menu.offsetHeight-12,innerHeight-430))+'px';menu.style.right=(innerWidth-r.right)+'px';menu.hidden=false;f.setAttribute('aria-expanded','true');
      const cur=(S.maps[which]&&S.maps[which].currentBase)||'road';$$('#layer-menu [data-base]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.base===cur)));
      layListTo(which==='map'&&S.volunteer?menu:null);
      const first=menu.querySelector('[aria-pressed=true]')||menu.querySelector('button');if(first)first.focus();}
    else locateMe(which,f);return}
  const bb=e.target.closest('#layer-menu [data-base]');
  if(bb){Object.values(S.maps).forEach(m=>m&&m.setBase(bb.dataset.base));if(S.formMap&&S.formMap.kind==='leaflet')S.formMap.map.setBase(bb.dataset.base);closeLayerMenu(true);toast('แผนที่แบบ'+bb.textContent.trim());return}
  if(!e.target.closest('#layer-menu')&&!$('#layer-menu').hidden)closeLayerMenu(false);
});
let layerBtn=null;
/* รายการชั้นข้อมูลอยู่ในกล่องสีน้ำเงินหน้าแรก · ถ้าเปิดเมนูจากหน้าแผนที่ ยกรายการเดียวกันไปแสดงในเมนูลอยชั่วคราว */
function layListTo(menu){const l=$('#lay-list');if(!l)return;if(menu){if(l.parentNode!==menu)menu.append(l);l.classList.add('in-menu')}else{const c=$('#lay-card');if(l.parentNode!==c)c.append(l);l.classList.remove('in-menu')}}
/* ชั้นข้อมูลบนแผนที่: เฉพาะทีมอาสาที่ใส่รหัสแล้ว · ทีมอาสา + ถนนน้ำท่วม เปิดเป็นค่าเริ่มต้น · ฝน/CCTV เปิดเองได้ */
const teamsOn=()=>!!S.volunteer&&store.get('uh_lay_teams','1')!=='0';   /* ชั้นทีมอาสาเห็นเฉพาะคนที่เข้าโหมดทีมอาสา (ใส่รหัสแล้ว) */
function volLayersOn(){if(teamsOn())toggleTeams(true);if(store.get('uh_lay_flood','1')!=='0')toggleFlood(true);if(store.get('uh_lay_cctv',''))toggleCctv(true);if(store.get('uh_lay_rain',''))toggleRain(true)}
function volLayersOff(){const keep={f:store.get('uh_lay_flood','1'),c:store.get('uh_lay_cctv',''),r:store.get('uh_lay_rain','')};   /* ซ่อนแต่ไม่ลืมค่าที่ทีมเลือกไว้ */
  try{toggleFlood(false);toggleCctv(false);toggleRain(false)}catch(e){}store.set('uh_lay_flood',keep.f);store.set('uh_lay_cctv',keep.c);store.set('uh_lay_rain',keep.r)}
var volLayShown=null;
function syncVolLayers(){const v=!!S.volunteer,c=$('#lay-card');document.body.classList.toggle('is-vol',v);if(c)c.hidden=!v;const ac=$('#btn-all-cases');if(ac)ac.hidden=!v;   /* ปุ่ม "ดูเคสทั้งหมด" เฉพาะทีมอาสา */
  if(volLayShown===v)return;volLayShown=v;
  if(!v){closeLayerMenu&&$('#layer-menu')&&!$('#layer-menu').hidden&&closeLayerMenu(false);teamsGen++;Object.values(S.maps).forEach(m=>{if(!m)return;if(m._teams){m._teams.remove();m._teams=null}if(m._helped){m._helped.remove();m._helped=null}});volLayersOff()}
  else{$('#lay-teams').checked=teamsOn();$('#lay-flood').checked=store.get('uh_lay_flood','1')!=='0';$('#lay-rain').checked=!!store.get('uh_lay_rain','');$('#lay-cctv').checked=!!store.get('uh_lay_cctv','');layCount();if(Object.values(S.maps).some(Boolean))volLayersOn()}}
var LAY_NAMES={'lay-teams':'ทีมอาสา','lay-flood':'น้ำท่วม','lay-rain':'เรดาร์ฝน','lay-cctv':'CCTV'};
function layCount(){const on=Object.keys(LAY_NAMES).filter(id=>$('#'+id)&&$('#'+id).checked);const s=$('#lay-sum-s');if(s)s.textContent=on.length?'เปิดอยู่: '+on.map(id=>LAY_NAMES[id]).join(' · '):'ยังไม่ได้เปิดชั้นข้อมูล';const c=$('#lay-card');if(c)c.classList.toggle('has-on',on.length>0)}
(function(){const c=$('#lay-card');if(!c)return;$('#lay-teams').checked=teamsOn();if(store.get('uh_lay_open','')==='1')c.open=true;c.addEventListener('toggle',()=>store.set('uh_lay_open',c.open?'1':''));$$('#lay-list .sw-in').forEach(i=>i.addEventListener('change',layCount));layCount()})();
function closeLayerMenu(refocus){const m=$('#layer-menu');if(!m)return;const was=!m.hidden;m.hidden=true;layListTo(null);$$('.fab[data-act=layers]').forEach(b=>b.setAttribute('aria-expanded','false'));if(was&&refocus&&layerBtn)layerBtn.focus()}
async function locateMe(which,btn){
  const m=await ensureMap(which);if(!m)return;btn&&btn.classList.add('on');
  try{const p=await getGPS();S.me=p;
    Object.entries(S.maps).forEach(([k,mm])=>{if(!mm)return;if(mm._me)mm._me.setLatLng([p.lat,p.lng]);else mm._me=L.marker([p.lat,p.lng],{icon:meIcon(),interactive:false,zIndexOffset:3000}).addTo(mm)});
    m.setView([p.lat,p.lng],Math.max(m.getZoom(),15));
  }catch(e){toast(e.code===1?'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง':'หาตำแหน่งไม่สำเร็จ');btn&&btn.classList.remove('on')}
}
/* ชั้นน้ำท่วมถนนจาก Floodboard */
const FLOOD_COL={blocked:'#d32f2f',risky:'#f57c00',caution:'#fbc02d'};   /* สีแบบ floodboard: ผ่านไม่ได้ / เสี่ยง / น้ำขังผ่านได้ (คิดจากรถสูง) */
const floodV=p=>{const v=(p||{}).verdict;return typeof v==='string'?v:(v&&(v.truck||v.pickup))||(p||{}).status};
let floodGen=0,teamsGen=0;
async function toggleFlood(on){if(on&&!S.volunteer)return;store.set('uh_lay_flood',on?'1':'0');$('#lay-flood').checked=on;layCount&&layCount();const gen=++floodGen;
  Object.values(S.maps).forEach(m=>{if(m&&m._flood){m._flood.remove();m._flood=null}});if(!on)return;
  try{if(!S.flood){S.floodP=S.floodP||fetch('https://www.floodboard.org/api/export/roads.geojson').then(r=>r.json()).then(j=>{j.features=(j.features||[]).filter(f=>{const p=f.properties||{};return !p.cleared&&FLOOD_COL[floodV(p)]});return j}).finally(()=>{S.floodP=null});S.flood=await S.floodP}
    if(gen!==floodGen)return;  /* มีการเรียกใหม่กว่าแล้ว */
    Object.values(S.maps).forEach(m=>{if(!m)return;if(m._flood)m._flood.remove();m._flood=L.geoJSON(S.flood,{interactive:false,attribution:'ข้อมูลน้ำท่วม © <a href="https://www.floodboard.org/about" target="_blank" rel="noopener">Floodboard</a>',style:f=>({color:FLOOD_COL[floodV(f.properties)],weight:5,opacity:.85,lineCap:'round'}),pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:4,color:FLOOD_COL[floodV(f.properties)],weight:2})}).addTo(m)});
  }catch(e){toast('โหลดข้อมูลน้ำท่วมไม่สำเร็จ')}}
/* ชั้นทีมกู้ภัย (ตำแหน่งปัดเศษสำหรับคนทั่วไป) */
/* ชั้นทีมกู้ภัยและเครือข่ายช่วยเหลือ: ทีมที่แชร์ตำแหน่งสด (ปัดเศษสำหรับคนทั่วไป) + จุดเครือข่ายจากแท็บ "เครือข่าย" ในชีต */
const NET_STYLE={'ทีมกู้ภัย':'shield','จุดพักพิง':'home','จุดแจกของ':'food','จุดแพทย์':'ambulance','มูลนิธิ/เครือข่าย':'heart'};
function netPopup(p){const tel=String(p.phone||'').replace(/[^\d+]/g,'');
  return `<div class="pop"><span class="net-type">${esc(p.type)}</span><br><b>${esc(p.name)}</b>`+(p.detail?`<br>${esc(p.detail)}`:'')+(p.hours?`<br><small>เวลา: ${esc(p.hours)}</small>`:'')+
    (p.phone?`<br>${tel.length>=3?`<a href="tel:${esc(tel)}">${esc(p.phone)}</a>`:esc(p.phone)}`:'')+
    `<div class="pop-act"><a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener">นำทาง</a></div></div>`}
/* จุดที่ทีมไปช่วยแล้ว: เคสที่ทีมรับ/ปิดในแอป + แท็บ "ลงพื้นที่" ในชีต (เช่น จากโพสต์โซเชียล) · วงกลมจาง ๆ สีตามหน่วยงาน */
function helpedPopup(h){const o=orgOf(h.org);
  return `<div class="pop"><span class="org-tag" style="background:${o.color}">${esc(o.name)}</span><br><b>${esc(h.title)}</b>`+(h.detail?`<br>${esc(h.detail)}`:'')+(h.when?`<br><small>${esc(h.when)}</small>`:'')+
    (h.link?`<div class="pop-act"><a href="${esc(h.link)}" target="_blank" rel="noopener">${/google\.[a-z.]+\/maps|goo\.gl/.test(h.link)?'เปิดใน Google Maps':'ดูโพสต์'}</a></div>`:h.id?`<div class="pop-act"><a href="#" data-open="${esc(h.id)}">ดูรายละเอียด</a></div>`:'')+`</div>`}
/* วงกลมเฉพาะองค์กรอื่นที่ลงพื้นที่ (จากโพสต์โซเชียล/ข่าว ในแท็บ "ลงพื้นที่") · เคสของทีมอุมมะตีแสดงเป็นหมุดตามเดิม */
function helpedList(){return (S.outreach||[]).map(p=>({lat:p.lat,lng:p.lng,org:p.org,link:p.link,title:'ลงพื้นที่ช่วยเหลือ',detail:p.detail,when:p.date?'วันที่ '+p.date:''}))}
function drawHelped(){Object.values(S.maps).forEach(m=>{if(!m)return;if(m._helped){m._helped.remove();m._helped=null}
  if(!teamsOn())return;const hs=helpedList();if(!hs.length)return;
  m._helped=L.layerGroup(hs.flatMap(h=>{const o=orgOf(h.org);
    return [L.circle([h.lat,h.lng],{radius:350,color:o.color,weight:1,opacity:.35,fillColor:o.color,fillOpacity:.13,interactive:false}),
      L.marker([h.lat,h.lng],{icon:L.divIcon({className:'org-pin',html:o.logo?`<img src="${esc(o.logo)}" alt="">`:`<span style="background:${o.color}">${esc(o.short)}</span>`,iconSize:[44,20],iconAnchor:[22,10]}),opacity:.88,zIndexOffset:-200,title:o.name+' · '+h.title}).bindPopup(()=>helpedPopup(h))]})).addTo(m)})}
async function toggleTeams(on){if(on&&!S.volunteer)return;store.set('uh_lay_teams',on?'1':'0');$('#lay-teams').checked=on;layCount&&layCount();const gen=++teamsGen;
  Object.values(S.maps).forEach(m=>{if(m&&m._teams){m._teams.remove();m._teams=null}});drawHelped();if(!on)return;
  const p={action:'teams'};if(S.volunteer)p.key=volKey();
  const tm=Math.floor(Date.now()/60000);
  const [tr,nr,or]=await Promise.all([apiGet(p).catch(()=>null),apiGet({action:'network',t:tm}).catch(()=>null),apiGet({action:'outreach',t:tm}).catch(()=>null)]);
  if(gen!==teamsGen)return;
  S.outreach=or&&Array.isArray(or.points)?or.points:[];drawHelped();
  S.teams=tr&&Array.isArray(tr.teams)?tr.teams:[];S.network=nr&&Array.isArray(nr.points)?nr.points:[];
  if(!tr&&!nr){toast('โหลดทีมและเครือข่ายไม่สำเร็จ');return}
  Object.values(S.maps).forEach(m=>{if(!m)return;if(m._teams)m._teams.remove();
    const team=S.teams.filter(t=>t.lat&&t.lng).map(t=>L.marker([+t.lat,+t.lng],{icon:L.divIcon({className:'team-pin',html:'<span>'+ic('shield')+'</span>'+(t.team?'<em>'+esc(t.team)+'</em>':''),iconSize:[30,30],iconAnchor:[15,15]}),title:'ทีม '+(t.team||'กู้ภัย')+' · ตำแหน่งสด',zIndexOffset:1800}));
    const net=S.network.filter(n=>!NET_HIDE[n.type]).map(n=>L.marker([n.lat,n.lng],{icon:L.divIcon({className:'net-pin',html:'<span>'+ic(NET_STYLE[n.type]||'pin')+'</span>',iconSize:[30,30],iconAnchor:[15,15]}),title:n.type+' · '+n.name,zIndexOffset:1600}).bindPopup(()=>netPopup(n)));
    m._teams=L.layerGroup([...net,...team]).addTo(m)});
  if(!S.teams.length&&!S.network.filter(n=>!NET_HIDE[n.type]).length&&!helpedList().length)toast('ยังไม่มีทีม จุดเครือข่าย หรือจุดที่ไปช่วยแล้ว');
  else if(S.volunteer&&nr&&nr.noLocation)toast(`มี ${nr.noLocation} จุดในแท็บ "เครือข่าย" ที่ยังอ่านพิกัดไม่ได้ · วางพิกัดแบบ 13.75, 100.6 หรือลิงก์ Google Maps แบบเต็ม`,{ms:9000})}
/* จุดพักพิง / แจกของ / แพทย์ ในแท็บ "เครือข่าย" ไม่แสดงบนแผนที่ */
const NET_HIDE={'จุดพักพิง':1,'จุดแจกของ':1,'จุดแพทย์':1};
/* ชั้นเรดาร์ฝน (RainViewer · ฟรี ใช้ภาพย้อนหลัง 2 ชม. ทุก 10 นาที, ซูมจริงสูงสุดระดับ 7) */
const RAIN_ATTR='Weather data by <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>';
const RAIN_OP=.62;let rainGen=0,rainRefresh=null,rainAnim=null;
async function rainMeta(force){if(!force&&S.rain&&Date.now()-S.rainAt<5*60e3)return S.rain;
  const r=await fetch('https://api.rainviewer.com/public/weather-maps.json',{cache:'no-store'}).then(r=>r.json());
  if(!r||!r.host||!r.radar||!(r.radar.past||[]).length)throw new Error('rain');S.rain=r;S.rainAt=Date.now();return r}
const rainFrames=()=>(S.rain&&S.rain.radar&&S.rain.radar.past)||[];
const rainTime=f=>new Date(f.time*1000).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
function rainStop(){if(rainAnim){clearInterval(rainAnim);rainAnim=null}const fr=rainFrames();Object.values(S.maps).forEach(m=>m&&rainShow(m,fr.length-1));rainCtlSync()}
function rainShow(m,i){if(!m||!m._rainL)return;m._rainL.forEach((l,j)=>{if(j===i&&!m.hasLayer(l))l.addTo(m);if(m.hasLayer(l))l.setOpacity(j===i?RAIN_OP:0)});m._rainI=i}
function rainCtlSync(){const fr=rainFrames();Object.values(S.maps).forEach(m=>{if(!m||!m._rainCtl)return;const el=m._rainCtl.getContainer(),i=m._rainI==null?fr.length-1:m._rainI,f=fr[i];if(!f)return;
  el.querySelector('button').innerHTML=ic(rainAnim?'pause':'play');el.querySelector('button').setAttribute('aria-label',rainAnim?'หยุดเล่นภาพเรดาร์':'เล่นภาพเรดาร์ย้อนหลัง 2 ชั่วโมง');
  el.querySelector('b').textContent=rainTime(f);el.querySelector('small').textContent=i===fr.length-1?'ล่าสุด':'ย้อนหลัง';el.classList.toggle('past',i!==fr.length-1)})}
function rainPlay(){if(rainAnim){rainStop();return}const fr=rainFrames();if(fr.length<2)return;let i=0;
  Object.values(S.maps).forEach(m=>m&&m._rainL&&m._rainL.forEach(l=>{if(!m.hasLayer(l))l.setOpacity(0).addTo(m)}));
  const step=()=>{Object.values(S.maps).forEach(m=>rainShow(m,i));rainCtlSync();i++;if(i>=fr.length){clearInterval(rainAnim);rainAnim=null;setTimeout(()=>{if(!rainAnim)rainStop()},1200)}};
  step();rainAnim=setInterval(step,700);rainCtlSync()}
function rainClear(m){if(!m)return;if(m._rainL){m._rainL.forEach(l=>m.removeLayer(l));m._rainL=null}if(m._rainCtl){m._rainCtl.remove();m._rainCtl=null}m.attributionControl&&m.attributionControl.removeAttribution(RAIN_ATTR)}
function drawRain(){if(rainAnim){clearInterval(rainAnim);rainAnim=null}const fr=rainFrames();
  Object.values(S.maps).forEach(m=>{if(!m)return;rainClear(m);if(store.get('uh_lay_rain','')!=='1'||!fr.length)return;
    if(!m.getPane('rain')){const p=m.createPane('rain');p.style.zIndex=350;p.style.pointerEvents='none'}
    m._rainL=fr.map(f=>L.tileLayer(S.rain.host+f.path+'/256/{z}/{x}/{y}/2/1_0.png',{pane:'rain',opacity:0,maxNativeZoom:7,maxZoom:20,tileSize:256}));
    rainShow(m,fr.length-1);m.attributionControl&&m.attributionControl.addAttribution(RAIN_ATTR);
    const C=L.Control.extend({onAdd(){const d=L.DomUtil.create('div','rain-ctl');d.innerHTML='<button type="button"></button><span><small></small><b></b></span>';
      L.DomEvent.disableClickPropagation(d);d.querySelector('button').addEventListener('click',rainPlay);return d}});
    m._rainCtl=new C({position:'bottomleft'}).addTo(m)});
  rainCtlSync();const sub=$('#rain-sub');if(sub&&fr.length)sub.textContent='ภาพล่าสุด '+rainTime(fr[fr.length-1])+' น. · อัปเดตทุก 10 นาที'}
async function toggleRain(on){if(on&&!S.volunteer)return;store.set('uh_lay_rain',on?'1':'');$('#lay-rain').checked=on;layCount();const gen=++rainGen;
  if(rainRefresh){clearInterval(rainRefresh);rainRefresh=null}
  if(!on){if(rainAnim){clearInterval(rainAnim);rainAnim=null}Object.values(S.maps).forEach(rainClear);const sub=$('#rain-sub');if(sub)sub.textContent='ฝนตกตรงไหน · ดูย้อนหลัง 2 ชม. ได้';return}
  try{await rainMeta();if(gen!==rainGen)return;drawRain();
    rainRefresh=setInterval(async()=>{if(document.hidden||rainAnim)return;const last=(rainFrames().slice(-1)[0]||{}).time;try{await rainMeta(true);if((rainFrames().slice(-1)[0]||{}).time!==last)drawRain()}catch(e){}},5*60e3)}
  catch(e){if(gen!==rainGen)return;toast('โหลดเรดาร์ฝนไม่สำเร็จ');store.set('uh_lay_rain','');$('#lay-rain').checked=false;layCount()}}
/* ชั้นกล้อง CCTV (ข้อมูล POPNIX Flood) · ซูมเข้า (ระดับ 12 ขึ้นไป) ถึงจะแสดง ไม่ให้จุดรกทั้งเมือง */
let cctvGen=0;const CCTV_ZOOM=12;
/* ไอคอนกล้องวงจรปิด วาดลง canvas (เบากว่าใช้ HTML ทีละตัว เพราะมีกล้องหลักพัน) */
const CAM_SVG='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="#111827" stroke="#fff" stroke-width="2.4"/><path d="M7 14.2 21.4 9.6l2.3 7.1-14.4 4.6z" fill="#fff"/><path d="M7.6 16.2 4.6 17.2l1.1 3.4 3-1" fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round"/><path d="M18.6 10.7 20.3 7h4.2M24.6 5.1v3.8" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="17" r="1.25" fill="#111827"/></svg>';
const CAM_IMG=new Image();CAM_IMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(CAM_SVG);
let CamMarker=null;
function camMarker(ll,opt){if(!CamMarker)CamMarker=L.CircleMarker.extend({_updatePath(){const r=this._renderer;if(!r._drawing||this._empty())return;
    if(!CAM_IMG.complete||!CAM_IMG.naturalWidth)return L.CircleMarker.prototype._updatePath.call(this);
    const p=this._point,z=26;r._ctx.drawImage(CAM_IMG,p.x-z/2,p.y-z/2,z,z)}});
  return new CamMarker(ll,opt)}
function cctvAgo(t){const m=Math.max(0,Math.round((Date.now()/1000-t)/60));return m<1?'เมื่อสักครู่':m<60?m+' นาทีที่แล้ว':Math.round(m/60)+' ชม. ที่แล้ว'}
function cctvPopup(c){const f=S.cctv.feeds[c[0]]||{},src=S.cctv.base+f.path+encodeURIComponent(c[1])+'.jpg?t='+c[5];
  return `<div class="pop cctv-pop"><a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="ภาพจากกล้อง ${esc(c[2])}" loading="lazy" width="260" height="195"></a><b>${esc(c[2])}</b><br><small>${esc(f.org||'')} · ภาพเมื่อ ${cctvAgo(c[5])}</small>
    <div class="pop-act"><a href="https://flood.pop.in.th/#cctv" target="_blank" rel="noopener">ดูกล้องทั้งหมดบน POPNIX Flood</a></div></div>`}
const CCTV_ATTR='กล้อง CCTV © <a href="https://flood.pop.in.th/" target="_blank" rel="noopener">POPNIX Flood</a>';
function cctvZoomSync(m){if(!m||!m._cctv)return;const show=m.getZoom()>=CCTV_ZOOM,ac=m.attributionControl;
  if(show&&!m.hasLayer(m._cctv)){m._cctv.addTo(m);ac&&ac.addAttribution(CCTV_ATTR)}else if(!show&&m.hasLayer(m._cctv)){m.removeLayer(m._cctv);ac&&ac.removeAttribution(CCTV_ATTR)}}
async function toggleCctv(on){if(on&&!S.volunteer)return;store.set('uh_lay_cctv',on?'1':'');$('#lay-cctv').checked=on;layCount&&layCount();const gen=++cctvGen;
  Object.values(S.maps).forEach(m=>{if(m&&m._cctv){m.removeLayer(m._cctv);m._cctv=null;m.attributionControl&&m.attributionControl.removeAttribution(CCTV_ATTR)}});if(!on)return;
  try{if(!S.cctv||Date.now()-S.cctvAt>120000){const r=await fetch('/api/cctv').then(r=>r.json());if(!r||!r.ok)throw new Error('cctv');S.cctv=r;S.cctvAt=Date.now()}
    if(gen!==cctvGen)return;
    Object.values(S.maps).forEach(m=>{if(!m)return;const rd=m._cctvRd||(m._cctvRd=L.canvas({padding:.3}));
      m._cctv=L.layerGroup(S.cctv.cams.map(c=>camMarker([c[3],c[4]],{renderer:rd,radius:13,weight:0,fillOpacity:0}).bindPopup(()=>cctvPopup(c),{maxWidth:280,minWidth:260,offset:[0,-8]})));
      if(!CAM_IMG.complete)CAM_IMG.onload=()=>Object.values(S.maps).forEach(mm=>mm&&mm._cctvRd&&mm._cctvRd._redraw&&mm._cctvRd._redraw());
      if(!m._cctvHook){m._cctvHook=1;m.on('zoomend',()=>cctvZoomSync(m))}
      cctvZoomSync(m)});
    const cur=S.maps[S.view==='map'?'map':'home'];if(cur&&cur.getZoom()<CCTV_ZOOM)toast(`ซูมเข้าเพื่อดูกล้อง CCTV (${S.cctv.cams.length.toLocaleString('th-TH')} ตัว)`);
  }catch(e){toast('โหลดกล้อง CCTV ไม่สำเร็จ');store.set('uh_lay_cctv','');$('#lay-cctv').checked=false;layCount()}}
$('#lay-teams').addEventListener('change',e=>toggleTeams(e.target.checked));
$('#lay-flood').addEventListener('change',e=>toggleFlood(e.target.checked));
$('#lay-rain').addEventListener('change',e=>toggleRain(e.target.checked));
$('#lay-cctv').addEventListener('change',e=>toggleCctv(e.target.checked));

/* ---------- หน้าแรก ---------- */
if($('#type-grid')){$('#type-grid').innerHTML=NEED_TYPES.map(t=>`<button type="button" class="type-btn" data-type="${t.key}">${ic(t.icon)}<span>${t.label}</span></button>`).join('');
$('#type-grid').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(b)startForm({type:b.dataset.type,gps:true})})}
$('#btn-use-gps').addEventListener('click',()=>startForm({gps:true}));
$('#btn-all-cases').addEventListener('click',()=>{if(!S.volunteer)return;FL.status='all';FL.types=[];FL.people=[];FL.level=[];FL.q='';$('#case-search').value='';saveFL();renderFilters();go('map');setSheet(true);applyFilters()});
$('#btn-help').addEventListener('click',()=>{go('map');setSheet(true);
  if(!S.volunteer){const p=$('#vol-panel');p.dataset.mode='';renderVol(true);setTimeout(()=>{const k=$('#vol-key');k&&k.focus()},250)}   /* ครั้งแรก: ใส่รหัส */
  else $('#vol-panel').hidden=true});   /* ใส่รหัสแล้ว: เข้ารายการเคสเลย ไม่ต้องใส่ซ้ำ */
$('#btn-vol-set').addEventListener('click',()=>{if(!S.volunteer)return;go('map');setSheet(true);const p=$('#vol-panel');p.dataset.mode='';renderVol(true);p.scrollIntoView({block:'nearest'})});
let searchFrom=null;
const openSearch=e=>{searchFrom=(e&&e.currentTarget)||document.activeElement;$('#search-overlay').hidden=false;$$('.view.active,.tabbar').forEach(x=>x.inert=true);
  $('#search-input').value='';$('#search-list').hidden=true;$('#search-status').textContent='';setTimeout(()=>$('#search-input').focus(),50)};
function closeSearch(refocus=true){const o=$('#search-overlay');if(o.hidden)return;o.hidden=true;$$('.view,.tabbar').forEach(x=>x.inert=false);if(refocus&&searchFrom&&document.contains(searchFrom))searchFrom.focus()}
$('#home-search-btn').addEventListener('click',openSearch);
$('#search-cancel').addEventListener('click',()=>closeSearch());
$('#search-gps').addEventListener('click',()=>{closeSearch(false);startForm({gps:true})});
geoAttach($('#search-input'),$('#search-list'),it=>{closeSearch(false);startForm({loc:it})},{status:$('#search-status'),
  onFree:(text,best)=>{closeSearch(false);startForm(best?{loc:{label:text,lat:best.lat,lng:best.lng}}:{});if(!best){$('#addr-input').value=text;F.addrDirty=true}
    $('#addr-status').textContent=best?'ใช้ที่อยู่ตามที่พิมพ์ · ปักหมุดโดยประมาณ ลากให้ตรงบ้าน':'ใช้ที่อยู่ตามที่พิมพ์ · แตะแผนที่เพื่อปักหมุดได้ (ไม่บังคับ)'}});
addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(!$('#search-overlay').hidden){closeSearch();return}if(!$('#layer-menu').hidden){closeLayerMenu(true);return}}
  if(e.key==='Tab'){const box=!$('#search-overlay').hidden?$('#search-overlay'):!$('#layer-menu').hidden?$('#layer-menu'):null;if(!box)return;  /* วนโฟกัสอยู่ในกล่องที่เปิดอยู่ */
    const f=[...box.querySelectorAll('button,input,a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null);if(!f.length)return;
    const i=f.indexOf(document.activeElement);if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&(i===f.length-1||i<0)){e.preventDefault();f[0].focus()}}});

/* ---------- คำขอของฉัน + คิวส่งตอนไม่มีสัญญาณ ---------- */
const myReqs=()=>store.json('uh_my_cases',[]);const saveMy=a=>store.put('uh_my_cases',a.slice(-8));
const queue=()=>store.json('uh_queue',[]);
const saveQueue=a=>{try{localStorage.setItem('uh_queue',JSON.stringify(a))}catch(e){  /* เครื่องเต็ม: เก็บคำขอไว้ก่อน ตัดรูปออก */
  store.put('uh_queue',a.map(x=>({...x,data:{...x.data,photos:[]}})));toast('เก็บคำขอไว้แล้ว แต่เก็บรูปไว้ไม่ได้ ส่งรูปให้ทีมทางโทรศัพท์แทน')}};
const TRACK={};
function renderMyReq(){
  const q=queue(),mine=myReqs();const box=$('#my-req'),list=$('#my-req-list');box.hidden=!q.length&&!mine.length;if(box.hidden)return;
  list.replaceChildren();
  q.forEach(x=>list.append(reqRow(x.data,'<span class="st st-queue">ยังไม่ถึงทีม · กำลังส่งใหม่</span>',null)));
  mine.slice().reverse().forEach(m=>{const c=S.cases.find(c=>String(c.id)===String(m.id))||TRACK[m.id]||{};
    const st=c.status?statusChip({...c,urgency:c.urgency||m.urgency}):'<span class="st st-open">ส่งแล้ว</span>';
    const extra=c.status==='going'&&(c.volunteer||c.team)?'ทีม '+(c.volunteer||'')+' กำลังไป':'';
    list.append(reqRow(m,st,m.id,extra))});
}
function reqRow(d,stHtml,id,extra){const row=document.createElement('div');row.className='req-item';
  row.innerHTML=ic(needIcon((d.needs||[])[0]||''))+'<span><b></b><small></small></span>'+stHtml;
  row.querySelector('b').textContent=(d.needs||[]).join(', ')||'ขอความช่วยเหลือ';
  row.querySelector('small').textContent=[id?'#'+id:'',extra||'',d.address||''].filter(Boolean).join(' · ');
  if(id){const x=document.createElement('button');x.type='button';x.className='x';x.setAttribute('aria-label','ซ่อนคำขอนี้');x.innerHTML=ic('close');x.onclick=()=>{saveMy(myReqs().filter(m=>m.id!==id));renderMyReq()};row.append(x)}
  return row}
/* เซิร์ฟเวอร์ยังไม่มี action track → ใช้สถานะจากรายการเคสสาธารณะแทน (renderMyReq) และไม่ยิงซ้ำ */
async function trackMine(){if(store.get('uh_no_track2',''))return renderMyReq();for(const m of myReqs()){if(!m.token)continue;try{const r=await apiPost({action:'track',id:m.id,clientId:m.clientId||'',token:m.token},12000);if(r&&r.error==='unknown_action'){store.set('uh_no_track2','1');break}if(r&&r.ok&&r.status)TRACK[m.id]={status:r.status,volunteer:r.volunteer,urgency:m.urgency}}catch(e){}}renderMyReq()}
let flushing=false;
async function flushQueue(){
  const q=queue();if(!q.length||flushing||!navigator.onLine)return;flushing=true;
  try{for(const item of q){
      try{const r=await postCreate({action:'create',clientId:item.clientId,...item.data});
        if(r&&r.ok){saveQueue(queue().filter(x=>x.clientId!==item.clientId));saveMy([...myReqs(),{id:r.id,token:r.token,clientId:item.clientId,urgency:r.urgency,needs:item.data.needs,address:item.data.address,at:Date.now()}]);toast('ส่งคำขอที่ค้างไว้แล้ว #'+r.id,{ok:true})}
        else{const tries=(item.tries||0)+1;  /* เซิร์ฟเวอร์ไม่รับ: ลองใหม่ไม่เกิน 5 ครั้ง แล้วแจ้งผู้ใช้ */
          if(r&&r.error==='missing'){saveQueue(queue().filter(x=>x.clientId!==item.clientId));toast('คำขอที่ค้างไว้ข้อมูลไม่ครบ กรุณาส่งใหม่')}   /* ไม่ทิ้งคำขอเพราะระบบสะดุด · ลองต่อไปเรื่อย ๆ */
          else saveQueue(queue().map(x=>x.clientId===item.clientId?{...x,tries}:x))}
      }catch(e){break}}
  }finally{flushing=false;renderMyReq();loadCases()}
}
addEventListener('online',()=>{netbar();flushQueue();loadCases()});addEventListener('offline',netbar);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){flushQueue();if(S.volunteer||myReqs().length)loadCases()}});
setInterval(flushQueue,QUEUE_MS);
function netbar(){const n=$('#netbar');if(navigator.onLine){n.hidden=true}else{n.hidden=false;n.innerHTML=ic('wifi')+'ไม่มีสัญญาณ · คำขอจะถูกส่งเองเมื่อออนไลน์'}}

/* ---------- ฟอร์ม ---------- */
const F={needs:new Set(),lat:null,lng:null,addrDirty:false,people:1,step:1,marker:null,photos:[]};
$('#need-grid').innerHTML=NEED_TYPES.map(t=>`<button type="button" class="need-btn" data-need="${t.key}" aria-pressed="false">${ic(t.icon)}<span>${t.label}</span></button>`).join('');
$('#need-grid').addEventListener('click',e=>{const b=e.target.closest('[data-need]');if(!b)return;const k=b.dataset.need;F.needs.has(k)?F.needs.delete(k):F.needs.add(k);b.setAttribute('aria-pressed',String(F.needs.has(k)));markOk('needs');syncOther(k==='other')});
/* "อื่น ๆ" → ให้ผู้ใช้พิมพ์เองว่าต้องการอะไร */
function syncOther(focus){const on=F.needs.has('other');$('#other-box').hidden=!on;if(!on){$('#other-in').value='';$('#err-other').hidden=true}else if(focus)setTimeout(()=>$('#other-in').focus(),80)}
$('#other-in').addEventListener('input',()=>{if($('#other-in').value.trim()){$('#err-other').hidden=true;$('#sec-needs').classList.remove('invalid')}});
/* ---------- รูปแนบ: ย่อเป็น JPEG ด้านยาวไม่เกิน 1280px ก่อนส่ง (เน็ตช้าก็ส่งได้) ---------- */
const PHOTO_MAX=3;
function shrinkPhoto(file){return new Promise((ok,bad)=>{const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{try{const k=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.round(img.naturalWidth*k),h=Math.round(img.naturalHeight*k);
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,w,h);cx.drawImage(img,0,0,w,h);
      let q=.72,d=cv.toDataURL('image/jpeg',q);while(d.length>900000&&q>.4){q-=.12;d=cv.toDataURL('image/jpeg',q)}ok(d)}catch(e){bad(e)}finally{URL.revokeObjectURL(url)}};
  img.onerror=()=>{URL.revokeObjectURL(url);bad(new Error('img'))};img.src=url})}
function renderPhotos(){const row=$('#photo-row'),add=$('#photo-add');row.querySelectorAll('.photo-th').forEach(x=>x.remove());
  F.photos.forEach((d,i)=>{const t=document.createElement('div');t.className='photo-th';t.innerHTML=`<img src="${d}" alt="รูปที่ ${i+1}"><button type="button" aria-label="ลบรูปที่ ${i+1}">${ic('close')}</button>`;
    t.querySelector('button').onclick=()=>{F.photos.splice(i,1);renderPhotos()};row.insertBefore(t,add)});
  add.hidden=F.photos.length>=PHOTO_MAX;if(F.photos.length&&$('#sec-photos').classList.contains('invalid'))markOk('photos')}
$('#photo-in').addEventListener('change',async e=>{const files=[...e.target.files].filter(f=>/^image\//.test(f.type)||/\.(heic|heif|jpe?g|png|webp)$/i.test(f.name));e.target.value='';
  const room=PHOTO_MAX-F.photos.length;if(files.length>room)toast(`แนบได้อีก ${room} รูป`);
  for(const f of files.slice(0,room)){try{F.photos.push(await shrinkPhoto(f));renderPhotos()}catch(err){toast('เปิดรูปนี้ไม่ได้ ลองรูปอื่น')}}});
function startForm(opt={}){
  resetForm();if(opt.type){F.needs.add(opt.type);$(`[data-need="${opt.type}"]`).setAttribute('aria-pressed','true')}
  go('form');syncOther(opt.type==='other');
  if(opt.loc){$('#addr-input').value=opt.loc.label||opt.loc.title;F.addrDirty=true;setPin(opt.loc.lat,opt.loc.lng,true,false,'addr')}
  if(opt.gps)useGPS();
}
function resetForm(){
  F.needs.clear();F.photos=[];if($('#photo-row')){renderPhotos();markOk('photos')}F.lat=F.lng=null;F.soi='';F.soiAuto='';F.soiPrev='';F.soiInfo=null;soiSeq++;if($('#soi-pick'))$('#soi-pick').hidden=true;if($('#loc-share'))$('#loc-share').hidden=true;F.pinSrc='';F.pinAcc=null;F.addrDirty=false;F.people=1;F.step=1;F.clientId=uid();F.sending=false;F.done=false;F.pinSeq=(F.pinSeq||0)+1;
  $$('#need-grid [data-need]').forEach(b=>b.setAttribute('aria-pressed','false'));$('#other-box').hidden=true;$('#other-in').value='';$('#err-other').hidden=true;
  ['#addr-input','#phone-in','#name-in','#details-in','#ma-street','#ma-no','#ma-dist','#ma-mark'].forEach(s=>$(s).value='');MA.sub='';MA.picked=null;$('#ma-preview').hidden=true;$('#manual-addr').open=false;
  $('#ppl-out').value='1';$$('input[name=level]').forEach(i=>i.checked=false);markOk('level');
  $('#addr-status').textContent='';$('#pin-status').textContent='แตะแผนที่เพื่อปักหมุด หรือลากหมุดให้ตรง';
  if(S.formMap){S.formMap.removePin();S.formMap.clearAccuracy()}
  ['needs','loc','phone'].forEach(markOk);showStep(1);
  const last=store.get('uh_phone','');if(last)$('#phone-in').value=last;
}
const manualSrc=()=>F.pinSrc==='gps'||F.pinSrc==='gps+drag'?'gps+drag':'manual';
async function ensureFormMap(){
  if(S.formMap){setTimeout(()=>S.formMap.resize(),60);return S.formMap}
  if(S.formMapLoading)return S.formMapLoading;
  S.formMapLoading=(async()=>{
    try{const pm=await createPickMap($('#form-map'),{
        /* แตะแผนที่ = ย้ายหมุดมาตรงนั้น (ถ้ายังซูมไกลอยู่ ซูมเข้าให้ปรับต่อได้แม่นขึ้น) */
        onTap:(la,ln)=>setPin(la,ln,S.formMap&&S.formMap.getZoom()<15,true,manualSrc()),
        onDragEnd:(la,ln)=>setPin(la,ln,false,true,manualSrc())});
      S.formMap=pm;addSatButton(pm);
      if(F.lat!=null)setPin(F.lat,F.lng,true,false);
      return pm}
    catch(e){$('#form-map').innerHTML='<p class="empty">โหลดแผนที่ไม่ได้ · ค้นหาที่อยู่ หรือกด "กรอกที่อยู่เอง" ได้</p>';return null}
    finally{S.formMapLoading=null}})();
  return S.formMapLoading;
}
/* ปุ่มสลับภาพดาวเทียม (ตัวเลือกเสริม: ดูหลังคาบ้าน ปักแม่นขึ้น) */
function addSatButton(pm){const b=document.createElement('button');b.type='button';b.className='map-sat-btn map-sat-float';
  const sync=()=>{const sat=pm.isSat();b.innerHTML=ic(sat?'road':'sat')+'<span>'+(sat?'แผนที่':'ดาวเทียม')+'</span>';b.setAttribute('aria-pressed',String(sat))};
  b.addEventListener('click',e=>{e.stopPropagation();pm.toggleSat();sync()});sync();$('#form-map').append(b)}
/* ที่มาของหมุด (ส่งให้ทีมอาสาดูว่าหมุดแม่นแค่ไหน): gps / manual / addr / link · acc = ความแม่นยำ GPS (เมตร) */
function pinSrcText(){const s=F.pinSrc||'';
  return s==='gps'?'GPS ±'+F.pinAcc+' ม.':s==='gps+drag'?'GPS ±'+F.pinAcc+' ม. แล้วลากปรับเอง':s==='manual'?'ปักเองบนแผนที่':s==='link'?'จากลิงก์/พิกัดที่วาง':s==='addr'?'จากที่อยู่ (โดยประมาณ)':''}
function accInfo(a){return a<=20?{cls:'good',txt:'แม่นยำมาก ±'+a+' ม.'}:a<=60?{cls:'ok',txt:'แม่นยำพอใช้ ±'+a+' ม. · ซูมดูว่าตรงบ้านไหม'}:{cls:'bad',txt:'ยังไม่แม่น ±'+a+' ม. · ลากหมุดให้ตรงบ้าน'}}
function pinNote(){const el=$('#pin-status');if(!el)return;const s=F.pinSrc;const ls=$('#loc-share');if(ls)ls.hidden=F.lat==null;
  if(s==='gps'){const a=accInfo(F.pinAcc);el.innerHTML=`<i class="acc-dot ${a.cls}"></i>ตำแหน่งจาก GPS · ${esc(a.txt)}`}
  else if(s==='gps+drag'||s==='manual')el.innerHTML='<i class="acc-dot good"></i>ปักหมุดเองแล้ว · ซูมเข้าเพื่อให้ตรงหลังคาบ้าน';
  else if(s==='link')el.innerHTML='<i class="acc-dot good"></i>ปักตามพิกัดที่วาง · ลากปรับได้';
  else if(s==='addr')el.innerHTML='<i class="acc-dot ok"></i>หมุดโดยประมาณจากที่อยู่ · ลากให้ตรงบ้าน';
  else el.textContent='ปักหมุดแล้ว · ลากหมุดเพื่อปรับให้ตรง'}
/* แชร์ / คัดลอกตำแหน่ง ไปวางใน LINE, Facebook, SMS ฯลฯ
   ข้อความ = ชื่อ + ที่อยู่ + พิกัดตัวเลข (ใช้ได้กับทุกแอปแผนที่) + ลิงก์เปิดแผนที่ (Maps URL ธรรมดา ไม่ใช่ API · เปิดแอปแผนที่ในมือถือได้ทันที)
   approx = ตำแหน่งโดยประมาณ (มุมมองคนทั่วไป ไม่เปิดเผยพิกัดจริง) */
function locText({lat,lng,title,address,note,approx}){const d=approx?3:6,la=(+lat).toFixed(d),ln=(+lng).toFixed(d);
  return ['📍 '+(title||'ตำแหน่ง'),address||'',`พิกัด ${la}, ${ln}${note?' ('+note+')':''}${approx?' · ตำแหน่งโดยประมาณ':''}`,
    `เปิดแผนที่: https://www.google.com/maps/search/?api=1&query=${la},${ln}`].filter(Boolean).join('\n')}
async function copyText(t,okMsg){
  try{await navigator.clipboard.writeText(t);toast(okMsg||'คัดลอกแล้ว',{ok:true});return true}catch(e){}
  const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:-1000px;left:0;opacity:0';document.body.append(ta);
  ta.select();ta.setSelectionRange(0,t.length);let ok=false;try{ok=document.execCommand('copy')}catch(_){}ta.remove();
  if(ok){toast(okMsg||'คัดลอกแล้ว',{ok:true});return true}
  prompt('กดค้างเพื่อคัดลอกข้อความนี้',t);return false}
async function shareText(t,title){
  if(navigator.share){try{await navigator.share({title:title||'ตำแหน่ง',text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
  copyText(t,'คัดลอกตำแหน่งแล้ว · วางในแชตได้เลย')}
/* ซอยของหมุด: แสดงตัวเลือกซอย แล้วเติมที่อยู่ "ซอย… แขวง… เขต… กรุงเทพฯ" (ถ้าผู้ใช้ยังไม่ได้พิมพ์ที่อยู่เอง) */
let soiSeq=0;
function soiAddr(soi,info){return [soi,info.area?'แขวง'+info.area:'',info.dist?'เขต'+info.dist:'',info.dist&&info.bkk?'กรุงเทพฯ':''].filter(Boolean).join(' ')}
function renderSoi(info,chosen){const box=$('#soi-pick'),row=$('#soi-chips');if(!info||!info.sois.length){box.hidden=true;return}
  row.innerHTML=info.sois.map((n,i)=>{const c=(info.cands||[])[i]||{};return `<button type="button" role="radio" aria-checked="${n===chosen}" data-soi="${i}">${esc(n)}${c.d!=null?`<small>${c.d<=5?'ติดหมุด':c.d+' ม.'}</small>`:''}</button>`}).join('');box.hidden=false;
  $('#soi-pick .soi-tip').textContent=F.pinSrc==='gps'&&F.pinAcc>40?'GPS ยังคลาด ±'+F.pinAcc+' ม. ซอยอาจไม่ตรง · ลากหมุดให้ตรงบ้านก่อน แล้วระบบหาซอยใหม่ให้':'ตัวเลขคือระยะจากหมุดถึงซอย · แตะซอยที่ถูก ระบบใส่ในที่อยู่ให้ · ไม่มีในนี้พิมพ์เองได้';
  row.onclick=e=>{const b=e.target.closest('[data-soi]');if(!b)return;const n=info.sois[+b.dataset.soi];F.soi=n;
    const cur=$('#addr-input').value.trim(),prev=F.soiAuto;
    /* ที่อยู่ที่ระบบเติมเอง → แทนทั้งบรรทัด · ที่อยู่ที่ผู้ใช้พิมพ์ → แทนเฉพาะซอยเดิม หรือเติมซอยไว้หน้า */
    let next;if(!F.addrDirty||cur===prev)next=soiAddr(n,info);else if(F.soiPrev&&cur.includes(F.soiPrev))next=cur.replace(F.soiPrev,n);else if(!geoKey(cur).includes(geoKey(n)))next=n+' '+cur;else next=cur;
    $('#addr-input').value=next;F.soiAuto=next;F.soiPrev=n;F.addrDirty=true;markOk('loc');renderSoi(info,n);$('#addr-status').textContent='ใส่ซอยในที่อยู่แล้ว · แก้ได้'}}
async function fillSoi(){if(F.lat==null)return;const my=++soiSeq,lat=F.lat,lng=F.lng;
  /* รอให้แผนที่รอบหมุดโหลดเสร็จ แล้ววัดระยะถึงถนน/ซอยจริงจากข้อมูล OSM ในแผนที่ */
  let roads=[];const pm=await ensureFormMap();
  if(pm){if(pm.getZoom()<14)pm.view(lat,lng,16);await pm.ready();if(my!==soiSeq)return;roads=pm.nearestRoads(lat,lng)}
  const info=await geoSoiAt(lat,lng,roads);if(my!==soiSeq||F.lat!==lat||F.lng!==lng)return;F.soiInfo=info;
  if(!info.sois.length){renderSoi(null);if(!F.addrDirty&&(info.area||info.dist)){const t=soiAddr('',info);$('#addr-input').value=t;F.soiAuto=t}return}
  const cur=$('#addr-input').value.trim(),auto=!F.addrDirty||cur===F.soiAuto;
  if(auto){const t=soiAddr(info.sois[0],info);$('#addr-input').value=t;F.soiAuto=t;F.soiPrev=info.sois[0];F.soi=info.sois[0];$('#addr-status').textContent='เติมที่อยู่จากหมุดให้แล้ว · ถ้าซอยไม่ถูก แตะเลือกด้านล่าง'}
  renderSoi(info,auto?info.sois[0]:(info.sois.find(n=>geoKey(cur).includes(geoKey(n)))||''))}
async function setPin(lat,lng,pan=true,reverse=true,src,acc){
  F.pinSeq=(F.pinSeq||0)+1;F.lat=+lat;F.lng=+lng;markOk('loc');
  if(src){F.pinSrc=src;if(acc!=null)F.pinAcc=acc}
  const m=await ensureFormMap();
  if(m){m.setPin(F.lat,F.lng);
    /* วงความแม่นยำ GPS (หายเมื่อปักเอง) */
    if(F.pinSrc==='gps'&&F.pinAcc)m.setAccuracy(F.lat,F.lng,F.pinAcc);else m.clearAccuracy();
    if(pan){const z=F.pinSrc==='gps'?(F.pinAcc<=30?18:F.pinAcc<=100?17:16):F.pinSrc==='addr'?17:18;m.view(F.lat,F.lng,z)}}
  pinNote();
  if(reverse)fillSoi();else renderSoi(null);
}
const IN_LINE=/\bLine\//i.test(navigator.userAgent),IN_FB=/FBAN|FBAV|Instagram/i.test(navigator.userAgent);
function gpsHelp(code){const os=/iPhone|iPad|iPod/i.test(navigator.userAgent)?'ios':/Android/i.test(navigator.userAgent)?'android':'';
  if(IN_LINE||IN_FB)return 'แอป'+(IN_LINE?' LINE':' Facebook')+'บล็อกตำแหน่ง · กด ⋯ มุมขวาบน แล้วเลือก "เปิดในเบราว์เซอร์" จากนั้นกด "ใช้ตำแหน่งตอนนี้" อีกครั้ง';
  if(code===1)return os==='ios'?'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง · เปิดที่ การตั้งค่า › ความเป็นส่วนตัว › บริการหาตำแหน่ง › Safari › "ขณะใช้แอป" แล้วลองใหม่ · หรือค้นหาที่อยู่/แตะแผนที่แทน'
    :os==='android'?'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง · แตะรูปกุญแจข้างช่องเว็บ › สิทธิ์ › ตำแหน่ง › อนุญาต แล้วลองใหม่ · หรือค้นหาที่อยู่/แตะแผนที่แทน'
    :'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง · อนุญาตตำแหน่งในเบราว์เซอร์แล้วลองใหม่ · หรือค้นหาที่อยู่/แตะแผนที่แทน';
  return 'หาตำแหน่งไม่สำเร็จ · เปิด GPS / ออกไปที่โล่งแล้วลองใหม่ · หรือค้นหาที่อยู่/แตะแผนที่แทน'}
async function useGPS(){
  const st=$('#addr-status'),btn=$('#form-gps');st.textContent='กำลังหาตำแหน่ง… (ยืนนิ่ง ๆ ใกล้หน้าต่างหรือที่โล่งจะแม่นขึ้น)';
  const seq0=F.pinSeq;let mine=null,first=true;btn.disabled=true;btn.classList.add('busy');
  try{const p=await getGPSBest(async f=>{
        if(mine!==null&&F.pinSeq!==mine)return;if(mine===null&&F.pinSeq!==seq0)return;   /* ผู้ใช้ปักเอง/เลือกที่อยู่ระหว่างรอ → ไม่ทับ */
        const pr=setPin(f.lat,f.lng,true,first,'gps',f.accuracy);mine=F.pinSeq;first=false;await pr;
        st.textContent=f.accuracy>20?'กำลังปรับให้แม่นขึ้น… ±'+f.accuracy+' ม.':'พบตำแหน่งแล้ว'});
    if(mine===null){st.textContent=st.textContent.startsWith('กำลังหาตำแหน่ง')?'':st.textContent;return}
    if(F.pinSeq===mine){st.textContent=p.accuracy<=60?'พบตำแหน่งแล้ว · ±'+p.accuracy+' ม.':'ได้ตำแหน่งคร่าว ๆ ±'+p.accuracy+' ม. · ลากหมุดให้ตรงบ้าน หรือลองกดใหม่ในที่โล่ง';
      await fillSoi()}}
  catch(e){st.textContent=gpsHelp(e&&e.code)}
  finally{btn.disabled=false;btn.classList.remove('busy')}
}
$('#form-gps').addEventListener('click',useGPS);
const formLocText=()=>locText({lat:F.lat,lng:F.lng,title:'ตำแหน่งที่ต้องการความช่วยเหลือ',address:$('#addr-input').value.trim(),note:pinSrcText()});
$('#loc-copy').addEventListener('click',()=>{if(F.lat!=null)copyText(formLocText(),'คัดลอกตำแหน่งแล้ว · วางใน LINE หรือแชตอื่นได้เลย')});
$('#loc-share-btn').addEventListener('click',()=>{if(F.lat!=null)shareText(formLocText(),'ตำแหน่งที่ต้องการความช่วยเหลือ')});
$('#addr-input').addEventListener('input',e=>{const v=$('#addr-input').value.trim();
  /* วางลิงก์ Google Maps หรือพิกัด → ปักหมุดตรงจุดนั้น แล้วเติมที่อยู่ให้ */
  const ll=parseLatLngText(v);
  if(ll&&(/^https?:\/\//i.test(v)||/^-?\d{1,2}\.\d+\s*[, ]\s*-?\d{2,3}\.\d+$/.test(v))){$('#addr-input').value='';F.addrDirty=false;
    e.stopImmediatePropagation();setPin(ll.lat,ll.lng,true,true,'link');$('#addr-status').textContent='ปักหมุดตามพิกัดที่วางแล้ว · ตรวจว่าหมุดตรงบ้าน';if(typeof geoCtl!=='undefined'&&geoCtl)geoCtl.clear();return}
  if(isShortMapLink(v)){e.stopImmediatePropagation();if(typeof geoCtl!=='undefined'&&geoCtl)geoCtl.clear();$('#addr-status').textContent='ลิงก์แบบย่อเปิดในแอปไม่ได้ · ใน Google Maps ให้กดค้างที่บ้านจนมีหมุด แล้วคัดลอกตัวเลขพิกัด (เช่น 13.79, 100.62) มาวางแทน';return}
  F.addrDirty=!!v;if(F.addrDirty)markOk('loc')});
var geoCtl=geoAttach($('#addr-input'),$('#addr-list'),it=>{$('#addr-input').value=it.label||it.title;F.addrDirty=true;setPin(it.lat,it.lng,true,false,'addr');$('#addr-status').textContent='ปักหมุดตามที่อยู่แล้ว · ลากหมุดปรับได้'},{status:$('#addr-status'),
  onFree:(text,best)=>{$('#addr-input').value=text;F.addrDirty=true;markOk('loc');
    if(best&&F.lat==null){setPin(best.lat,best.lng,true,false,'addr');$('#addr-status').textContent='ใช้ที่อยู่ตามที่พิมพ์ · ปักหมุดโดยประมาณที่ '+best.title+' ลากให้ตรงบ้าน';$('#pin-status').textContent='หมุดโดยประมาณ · ลากให้ตรงบ้าน'}
    else $('#addr-status').textContent=F.lat!=null?'ใช้ที่อยู่ตามที่พิมพ์ · หมุดเดิมยังอยู่':'ใช้ที่อยู่ตามที่พิมพ์ · แตะแผนที่เพื่อปักหมุดได้ (ไม่บังคับ)'}});
/* กรอกที่อยู่เอง (แทนละติจูด/ลองจิจูด): รวมเป็นข้อความที่อยู่ แล้วลองปักหมุดโดยประมาณ */
const BKK_DIST='พระนคร ดุสิต หนองจอก บางรัก บางเขน บางกะปิ ปทุมวัน ป้อมปราบศัตรูพ่าย พระโขนง มีนบุรี ลาดกระบัง ยานนาวา สัมพันธวงศ์ พญาไท ธนบุรี บางกอกใหญ่ ห้วยขวาง คลองสาน ตลิ่งชัน บางกอกน้อย บางขุนเทียน ภาษีเจริญ หนองแขม ราษฎร์บูรณะ บางพลัด ดินแดง บึงกุ่ม สาทร บางซื่อ จตุจักร บางคอแหลม ประเวศ คลองเตย สวนหลวง จอมทอง ดอนเมือง ราชเทวี ลาดพร้าว วัฒนา บางแค หลักสี่ สายไหม คันนายาว สะพานสูง วังทองหลาง คลองสามวา บางนา ทวีวัฒนา ทุ่งครุ บางบอน'.split(' ');
$('#bkk-districts').innerHTML=BKK_DIST.map(d=>`<option value="${d}">`).join('');
/* กรอกที่อยู่เอง: 4 ช่อง (ซอย/ถนน มีรายการแนะนำ → เติมเขต+แขวง+ปักหมุดให้เอง) ข้อความที่อยู่อัปเดตทันทีที่พิมพ์ */
const MA={sub:'',picked:null,distOf:''};
const distNorm=v=>{v=String(v||'').replace(/^\s*เขต\s*/,'').replace(/\s+/g,'').trim();const hit=BKK_DIST.find(d=>d===v)||BKK_DIST.find(d=>v.length>=3&&d.startsWith(v));return hit||v};
function manualAddr(){
  const street=geoNorm($('#ma-street').value).replace(/\s+/g,' '),no=$('#ma-no').value.trim().replace(/\s+/g,' '),dist=distNorm($('#ma-dist').value),mark=$('#ma-mark').value.trim();
  const sub=MA.sub&&MA.distOf===dist?MA.sub:'';
  const main=[no?(/^(บ้านเลขที่|เลขที่)/.test(no)?no:'เลขที่ '+no):'',street,sub?'แขวง'+sub:'',dist?'เขต'+dist:''].filter(Boolean);
  const text=[main.join(' '),main.length&&(street||dist)?'กรุงเทพฯ':'',mark?'(จุดสังเกต: '+mark+')':''].filter(Boolean).join(' ');
  const queries=[[street&&[street,dist].filter(Boolean).join(' '),'ซอย/ถนน'],[street,'ซอย/ถนน'],[sub&&[sub,dist].join(' '),'แขวง'],[dist,'เขต']].filter(([q],i,a)=>q&&a.findIndex(x=>x[0]===q)===i);
  return {text,queries,ok:!!(street||dist||mark)}}
function maSync(){const a=manualAddr();$('#ma-preview').hidden=!a.text;$('#ma-preview-text').textContent=a.text;
  if(a.text){$('#addr-input').value=a.text;F.addrDirty=true;markOk('loc')}}
['#ma-street','#ma-no','#ma-dist','#ma-mark'].forEach(id=>{const el=$(id);el.addEventListener('input',()=>{if(id==='#ma-street')MA.picked=null;maSync()});
  el.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.defaultPrevented||e.isComposing)return;if(id==='#ma-street'&&!$('#ma-list').hidden)return;e.preventDefault();
    const order=['#ma-street','#ma-no','#ma-dist','#ma-mark'],i=order.indexOf(id);if(i<order.length-1)$(order[i+1]).focus();else $('#addr-apply').click()})});
$('#ma-dist').addEventListener('change',()=>{const v=distNorm($('#ma-dist').value);if(v)$('#ma-dist').value=v;maSync()});
/* เลือกซอย/ถนนจากรายการ → เติมเขต แขวง และปักหมุดทันที */
geoAttach($('#ma-street'),$('#ma-list'),it=>{
  const street=it.type==='street'?it.name:(it.street||it.name);$('#ma-street').value=street;
  if(it.type!=='street'&&it.name&&!$('#ma-mark').value.trim())$('#ma-mark').value='ใกล้'+it.name;
  if(it.dist){$('#ma-dist').value=distNorm(it.dist);MA.distOf=distNorm(it.dist)}MA.sub=it.area&&it.area!==it.dist?it.area:'';MA.picked=it;maSync();
  setPin(it.lat,it.lng,true,false,'addr');$('#ma-tip').textContent='ปักหมุดที่ '+street+' แล้ว · ลากหมุดให้ตรงบ้าน';
  setTimeout(()=>$('#ma-no').focus(),50)},{status:$('#ma-tip')});
/* เปิดช่องกรอกเอง: ถ้ามีหมุดแล้ว เติมซอย/ถนน เขต แขวง จากหมุดให้ก่อน */
$('#manual-addr').addEventListener('toggle',async()=>{if(!$('#manual-addr').open)return;
  if(F.lat==null||$('#ma-street').value||$('#ma-dist').value){setTimeout(()=>$('#ma-street').focus(),50);return}
  $('#ma-tip').textContent='กำลังเติมที่อยู่จากหมุด…';const p=await geoReverseRaw(F.lat,F.lng);
  if(p&&!$('#ma-street').value&&!$('#ma-dist').value){const st=p.type==='street'?p.name:p.street;if(st)$('#ma-street').value=st;
    if(p.district){$('#ma-dist').value=distNorm(p.district);MA.distOf=distNorm(p.district)}MA.sub=p.locality&&p.locality!==p.district?p.locality:'';
    $('#ma-tip').textContent='เติมจากหมุดให้แล้ว · ใส่บ้านเลขที่เพิ่มได้';maSync();setTimeout(()=>$('#ma-no').focus(),50)}
  else{$('#ma-tip').textContent='พิมพ์แล้วเลือกจากรายการ ระบบเติมเขตและปักหมุดให้';setTimeout(()=>$('#ma-street').focus(),50)}});
$('#addr-apply').addEventListener('click',async()=>{
  const a=manualAddr(),st=$('#addr-status');
  if(!a.ok){$('#ma-tip').textContent='ใส่ซอย/ถนน หรือเขต อย่างน้อย 1 ช่อง';$('#ma-street').focus();return}
  maSync();$('#manual-addr').open=false;$('#addr-input').scrollIntoView({behavior:'smooth',block:'center'});
  if(F.lat!=null){st.textContent=MA.picked?'ใช้ที่อยู่นี้แล้ว · ปักหมุดตามซอย/ถนนแล้ว':'ใช้ที่อยู่นี้แล้ว · หมุดเดิมยังอยู่';return}
  st.textContent='ใช้ที่อยู่นี้แล้ว · กำลังหาจุดบนแผนที่…';
  try{let hit=null,lvl='';for(const [q,l] of a.queries){const r=await geoSuggest(q);hit=r.find(x=>x.bkk)||r[0];if(hit){lvl=l;break}}
    if(hit&&F.lat==null){await setPin(hit.lat,hit.lng,true,false,'addr');if(S.formMap&&(lvl==='เขต'||lvl==='แขวง'))S.formMap.setZoom(14);
      st.textContent=`ปักหมุดโดยประมาณ (ระดับ${lvl}) · ลากหมุดให้ตรงบ้าน`;$('#pin-status').textContent='หมุดโดยประมาณ · ลากให้ตรงบ้าน'}
    else if(F.lat==null)st.textContent='ใช้ที่อยู่นี้แล้ว · แตะแผนที่เพื่อปักหมุดได้ (ไม่บังคับ)'}
  catch(e){st.textContent='ใช้ที่อยู่นี้แล้ว · แตะแผนที่เพื่อปักหมุดได้ (ไม่บังคับ)'}
});
const pplClamp=v=>Math.min(999,Math.max(1,Math.round(Number(v))||1));
$('#ppl-minus').addEventListener('click',()=>{F.people=pplClamp(F.people-1);$('#ppl-out').value=F.people});
$('#ppl-plus').addEventListener('click',()=>{F.people=pplClamp(F.people+1);$('#ppl-out').value=F.people});
/* พิมพ์จำนวนคนเองได้ · ระหว่างพิมพ์ยอมให้ช่องว่างชั่วคราว ออกจากช่องแล้วค่อยปัดให้อยู่ใน 1–999 */
$('#ppl-out').addEventListener('input',e=>{const t=e.target,d=t.value.replace(/\D/g,'').slice(0,3);if(t.value!==d)t.value=d;if(d)F.people=pplClamp(d)});
/* แตะช่องแล้วล้างให้พิมพ์ใหม่ได้ทันที (ค่าเดิมแสดงจาง ๆ) · ไม่พิมพ์อะไรก็กลับเป็นค่าเดิม */
$('#ppl-out').addEventListener('focus',e=>{const t=e.target;t.placeholder=String(F.people);t.value=''});
$('#ppl-out').addEventListener('blur',e=>{const t=e.target;if(t.value.trim())F.people=pplClamp(t.value);t.value=F.people;t.placeholder=''});
$('#ppl-out').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur()}});
$('#phone-in').addEventListener('input',()=>markOk('phone'));
const FIELD={needs:'#need-grid',loc:'#addr-input',phone:'#phone-in',level:'#level-chips',photos:'#photo-in'};
const SECS={needs:'#sec-needs',loc:'#sec-loc',phone:'#sec-phone',level:'#sec-level',photos:'#sec-photos'};
function markOk(k){const sec=SECS[k];$(sec).classList.remove('invalid');$('#err-'+k).hidden=true;$(FIELD[k]).removeAttribute('aria-invalid')}
function markBad(k){const sec=SECS[k];$(sec).classList.add('invalid');$('#err-'+k).hidden=false;$(FIELD[k]).setAttribute('aria-invalid','true')}
function phoneOk(v){let d=String(v||'').replace(/\D/g,'');if(d.startsWith('66'))d='0'+d.slice(2);return /^0\d{8,9}$/.test(d)}
function validate(){const bad=[];if($('#ppl-out').value.trim())F.people=pplClamp($('#ppl-out').value);$('#ppl-out').value=F.people;
  if(!F.needs.size)bad.push('needs');
  else if(F.needs.has('other')&&!$('#other-in').value.trim()){bad.push('needs');$('#err-other').hidden=false}
  if(!$('#addr-input').value.trim()&&F.lat==null)bad.push('loc');
  if(!phoneOk($('#phone-in').value))bad.push('phone');
  if(!$('input[name=level]:checked'))bad.push('level');
  if(!F.photos.length)bad.push('photos');
  bad.forEach(markBad);if(F.needs.size)$('#err-needs').hidden=true;
  if(bad.length){const sec=SECS[bad[0]];$(sec).scrollIntoView({behavior:'smooth',block:'center'});const inp=bad[0]==='needs'&&!$('#other-box').hidden?$('#other-in'):$(sec).querySelector('input');if(inp&&bad[0]!=='photos'&&bad[0]!=='level'&&(bad[0]!=='needs'||inp.id==='other-in'))setTimeout(()=>inp.focus({preventScroll:true}),400)}
  return !bad.length}
function formData(){
  const other=$('#other-in').value.trim().replace(/\s+/g,' ');
  return {needs:[...F.needs].map(k=>k==='other'&&other?'อื่น ๆ: '+other:NEED_TYPES.find(t=>t.key===k).value),urgencyLabel:'รอได้',
    people:F.people,level:($('input[name=level]:checked')||{}).value||'',address:$('#addr-input').value.trim(),
    lat:F.lat!=null?+F.lat.toFixed(6):'',lng:F.lng!=null?+F.lng.toFixed(6):'',phone:$('#phone-in').value.trim(),name:$('#name-in').value.trim(),
    details:$('#details-in').value.trim(),website:$('.hp').value,photos:F.photos.slice(0,PHOTO_MAX),pinSrc:F.lat!=null?pinSrcText():''}}
function showStep(n){F.step=n;$('#step1').hidden=n!==1;$('#step2').hidden=n!==2;$('#form-step').textContent=n+'/2';
  $('#form-title').textContent=n===1?'ขอความช่วยเหลือ':'ตรวจก่อนส่ง';
  const b=$('#form-next');b.className='btn '+(n===1?'btn-blue':'btn-green');b.textContent=n===1?'ถัดไป':'ส่งคำขอ';b.disabled=false;window.scrollTo(0,0);
  if(A11Y.ready&&S.view==='form')setTimeout(()=>$('#form-title').focus({preventScroll:true}),0)}
function renderReview(d){
  const rows=[['list','ต้องการ',d.needs.join(', ')],['pin','ที่อยู่',[d.address,d.lat!==''?'· ปักหมุดแล้ว':''].filter(Boolean).join(' ')||'ปักหมุดแล้ว'],['phone','เบอร์โทร',d.phone],
['users','จำนวนคน',d.people+' คน'],['wave','ระดับน้ำ',levelLabel(d.level)],['user','ชื่อ',d.name||'-'],['note','รายละเอียด',d.details||'-']];
  if(d.photos&&d.photos.length)rows.push(['image','รูปภาพ',d.photos.length+' รูป']);
  $('#review').innerHTML=rows.map(([i,k,v])=>`<div class="rv">${ic(i)}<span><small>${k}</small><b>${esc(v)}</b></span></div>`).join('');
}
$('#req-form').addEventListener('submit',async e=>{
  e.preventDefault();
  if(F.step===1){if(!validate())return;renderReview(formData());showStep(2);return}
  if(F.sending)return;
  const d=formData(),clientId=F.clientId||(F.clientId=uid()),btn=$('#form-next');F.sending=true;btn.disabled=true;btn.textContent=d.photos&&d.photos.length?'กำลังส่ง… (มีรูป อาจใช้เวลาถึง 1 นาที)':'กำลังส่ง…';store.set('uh_phone',d.phone);
  const done=()=>{F.sending=false;F.done=true};
  const queueIt=()=>{if(!queue().some(x=>x.clientId===clientId))saveQueue([...queue(),{clientId,data:d,at:Date.now(),tries:0}]);done();sentScreen(null,true)};
  if(!navigator.onLine){queueIt();return}
  let r;
  try{r=await postCreate({action:'create',clientId,...d},n=>{if(n>1)btn.textContent=`ระบบตอบช้า กำลังลองส่งอีกครั้ง (${n}/3)…`})}catch(err){queueIt();return}  /* ลอง 3 ครั้งแล้วยังไม่ได้ → เก็บไว้ส่งเองอัตโนมัติ */
  if(r&&r.ok){saveMy([...myReqs(),{id:r.id,token:r.token,clientId,urgency:r.urgency,needs:d.needs,address:d.address,at:Date.now()}]);done();sentScreen(r.id,false);loadCases();return}
  F.sending=false;btn.disabled=false;btn.textContent='ส่งคำขอ';
  if(r&&r.error==='missing'){showStep(1);validate();return}
  /* เซิร์ฟเวอร์ตอบว่าไม่รับ (ไม่ใช่ปัญหาสัญญาณ) → บอกผู้ใช้ ไม่เข้าคิว */
  toast(r&&r.error==='rate'?'ส่งถี่เกินไป รอสักครู่แล้วลองใหม่':'ส่งไม่สำเร็จ ลองอีกครั้ง หรือโทรสายด่วน 1669 / 199');
});
function sentScreen(id,queued){
  $('#sent-title').textContent=queued?'คำขอยังไม่ถึงทีมอาสา':'ส่งคำขอแล้ว';document.getElementById('view-sent').classList.toggle('is-queued',!!queued);
  $('#sent-text').textContent=queued?'ตอนนี้ส่งไม่สำเร็จ (สัญญาณหรือระบบช้า) แอปเก็บคำขอไว้แล้วและจะส่งให้อัตโนมัติ กรุณาเปิดหน้านี้ค้างไว้ · ถ้าอันตรายถึงชีวิต โทร 1669 หรือ 191 ทันที':'ทีมอาสาเห็นคำขอของคุณแล้ว ติดตามสถานะได้ที่หน้าแรก';
  $('#sent-id').textContent=id?'เลขคำขอ #'+id:'';renderMyReq();go('sent');
}
$('#form-back').addEventListener('click',()=>{if(F.sending)return;if(F.step===2)showStep(1);else go('home')});

/* ---------- แผนที่/รายการ ---------- */
const FL=Object.assign({status:'active',types:[],people:[],level:[],urg:[],q:'',sort:'new',age:''},store.json('uh_filters4',{}),{q:''});
const saveFL=()=>store.put('uh_filters4',{status:FL.status,types:FL.types,people:FL.people,level:FL.level,urg:FL.urg,sort:FL.sort,age:FL.age});
/* เรียงลำดับ + ช่วงเวลาที่แจ้ง */
const SKIP_REASONS=['น้ำลดแล้ว / ไม่ท่วม','ช่วยเหลือตัวเองได้','มีหน่วยงานอื่นดูแลแล้ว','ติดต่อไม่ได้','ข้อมูลไม่ครบ / เคสซ้ำ','อยู่นอกพื้นที่ที่ทีมดูแล'];
const SORTS=[['new','ใหม่ล่าสุด'],['prio','สำคัญก่อน'],['old','รอนานสุด']];
const AGES=[['','ทั้งหมด'],['today','วันนี้'],['24h','24 ชม.'],['3d','3 วัน'],['7d','7 วัน'],['older','เก่ากว่า 7 วัน']];
function ageOk(c){if(!FL.age)return true;const t=Number(c.createdAt)||Date.parse(c.createdAt)||0,now=Date.now(),H=3600000;
  if(FL.age==='today'){const d=new Date();d.setHours(0,0,0,0);return t>=d.getTime()}
  if(FL.age==='older')return t&&t<now-168*H;return t>=now-({'24h':24,'3d':72,'7d':168}[FL.age])*H}
const STATUS_TABS=[['active','ยังไม่เสร็จ'],['danger','ด่วน'],['open','รอช่วย'],['going','กำลังไป'],['done','ช่วยแล้ว'],['skip','ไม่เข้าเกณฑ์'],['all','ทั้งหมด']];
const PEOPLE_R=[['1-5','1–5 คน'],['6-20','6–20 คน'],['21-99999','มากกว่า 20 คน']];
function renderFilters(){
  const fk=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('[data-st],[data-ty]');const keep=fk?(fk.dataset.st?'[data-st="'+fk.dataset.st+'"]':'[data-ty="'+fk.dataset.ty+'"]'):null;
  $('#status-tabs').innerHTML=STATUS_TABS.map(([k,t])=>`<button type="button" data-st="${k}" aria-pressed="${FL.status===k}">${t}</button>`).join('');
  if(keep)setTimeout(()=>{const x=$(keep);x&&x.focus()},0);
  $('#type-chips').innerHTML=NEED_TYPES.map(t=>`<button type="button" data-ty="${t.key}" aria-pressed="${FL.types.includes(t.key)}">${ic(t.icon)}${t.label}</button>`).join('');
  $('#sort-row').innerHTML='<span class="sort-lbl">เรียง</span>'+SORTS.map(([k,t])=>`<button type="button" data-sort="${k}" aria-pressed="${FL.sort===k}">${t}</button>`).join('');
  $('#urg-filter').innerHTML=[4,3,2,1].map(v=>`<label><input type="checkbox" data-ur="${v}" ${FL.urg.includes(String(v))?'checked':''}><span class="u${v}"><i></i>${URG_TH[v]}</span></label>`).join('');
  $('#more-filter-panel').innerHTML='<h4>แจ้งเมื่อ</h4><div class="chips">'+AGES.map(([k,t])=>`<label><input type="radio" name="fl-age" data-age="${k}" ${FL.age===k?'checked':''}><span>${t}</span></label>`).join('')+'</div>'+
    '<h4>จำนวนคน</h4><div class="chips">'+PEOPLE_R.map(([k,t])=>`<label><input type="checkbox" data-pp="${k}" ${FL.people.includes(k)?'checked':''}><span>${t}</span></label>`).join('')+'</div>'+
    '<h4>ระดับน้ำ</h4><div class="chips">'+Object.entries({...LEVEL_TH,none:'ไม่ระบุ'}).map(([k,t])=>`<label><input type="checkbox" data-lv="${k}" ${FL.level.includes(k)?'checked':''}><span>${t}</span></label>`).join('')+'</div>'+
    '<button type="button" class="pill pill-ghost small" id="clear-filter">ล้างตัวกรอง</button>';
  const n=FL.types.length+FL.people.length+FL.level.length+FL.urg.length+(FL.age?1:0);$('#more-filter').lastChild.textContent=n?`ตัวกรอง ${n}`:'ตัวกรอง';$('#more-filter').classList.toggle('on',n>0);
}
$('#status-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;FL.status=b.dataset.st;saveFL();renderFilters();applyFilters()});
$('#sort-row').addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b)return;FL.sort=b.dataset.sort;saveFL();renderFilters();applyFilters();$('#case-list').scrollIntoView({block:'nearest'})});
$('#type-chips').addEventListener('click',e=>{const b=e.target.closest('[data-ty]');if(!b)return;const k=b.dataset.ty;FL.types=FL.types.includes(k)?FL.types.filter(x=>x!==k):[...FL.types,k];saveFL();renderFilters();applyFilters()});
$('#more-filter').addEventListener('click',()=>{const p=$('#fl-drawer');p.hidden=!p.hidden;$('#more-filter').setAttribute('aria-expanded',String(!p.hidden))});
$('#urg-filter').addEventListener('change',e=>{const i=e.target;if(!i.dataset.ur)return;FL.urg=i.checked?[...FL.urg,i.dataset.ur]:FL.urg.filter(x=>x!==i.dataset.ur);saveFL();renderFilters();applyFilters()});
$('#more-filter-panel').addEventListener('change',e=>{const i=e.target;if(i.dataset.pp){FL.people=i.checked?[...FL.people,i.dataset.pp]:FL.people.filter(x=>x!==i.dataset.pp)}if(i.dataset.lv){FL.level=i.checked?[...FL.level,i.dataset.lv]:FL.level.filter(x=>x!==i.dataset.lv)}if(i.dataset.age!=null&&i.checked)FL.age=i.dataset.age;saveFL();renderFilters();applyFilters()});
$('#more-filter-panel').addEventListener('click',e=>{if(e.target.id==='clear-filter'){FL.types=[];FL.people=[];FL.level=[];FL.urg=[];FL.age='';FL.status='active';saveFL();renderFilters();applyFilters()}});
let qTimer;$('#case-search').addEventListener('input',()=>{clearTimeout(qTimer);qTimer=setTimeout(()=>{FL.q=srchNorm($('#case-search').value.trim());applyFilters(true)},200)});
function applyFilters(fit){renderList();drawPins('map');if(fit&&FL.q&&S.maps.map){const pts=filteredCases().filter(hasPin).map(c=>[+c.lat,+c.lng]);if(pts.length)S.maps.map.fitBounds(pts,{padding:[60,60],maxZoom:15})}}
/* ค้นหาได้ทุกอย่าง (ชื่อ เบอร์ ที่อยู่ ความต้องการ ฯลฯ) */
function srchNorm(s){s=String(s==null?'':s);try{s=s.normalize('NFC')}catch(e){}return s.replace(/[​-‍﻿]/g,'').replace(/ํ([่-๋]?)า/g,'$1ำ').replace(/^'+/,'').toLowerCase()}
const normDigits=x=>{let d=String(x||'').replace(/\D/g,'');if(d.startsWith('66')&&d.length>=11)d=d.slice(2);return d.replace(/^0+/,'')};
function caseHay(c){const d=Number(c.createdAt)?new Date(Number(c.createdAt)):null;
  return srchNorm([c.id,'#'+c.id,(c.needs||[]).join(' '),c.district,c.district?'เขต'+c.district:'',c.address,c.name,c.phone,c.notes,c.volunteer,STATUS_TH[c.status],c.status!=='done'?URG_TH[sevOf(c)]:'',LEVEL_TH[c.level]||'',c.people?c.people+' คน':'',d?d.toLocaleDateString('th-TH',{day:'numeric',month:'short'}):''].filter(Boolean).join(' '))}
function caseMatches(c,q){const hay=caseHay(c);if(q.length>=3&&hay.replace(/\s+/g,'').includes(q.replace(/\s+/g,'')))return true;const digits=normDigits(c.phone);
  return q.split(/\s+/).every(t=>{if(hay.includes(t))return true;if(!/^\+?[\d-]+$/.test(t))return false;const raw=t.replace(/\D/g,''),d=normDigits(t);if(raw.length<3||!d)return false;return /^(0|\+?66)/.test(t)?digits.startsWith(d):digits.includes(d)})}
/* คนทั่วไปเห็นเฉพาะคำขอที่ตัวเองแจ้งจากเครื่องนี้ · ทีมอาสาเห็นทุกเคส */
function visibleCases(){if(S.volunteer)return S.cases;const mine=new Set(myReqs().map(m=>String(m.id)));return S.cases.filter(c=>mine.has(String(c.id)))}
function filteredCases(){
  const rank={open:0,going:1,done:2,skip:3};
  if(!S.volunteer)return visibleCases().sort((a,b)=>(Number(b.createdAt)||0)-(Number(a.createdAt)||0));
  return S.cases.filter(c=>{
    if(FL.q){if(!caseMatches(c,FL.q))return false;return (FL.status==='done'||FL.status==='skip')?c.status===FL.status:!isClosed(c)}
    if(FL.status==='active'&&isClosed(c))return false;
    if(FL.status==='danger'&&!isDanger(c))return false;
    if(['open','going','done','skip'].includes(FL.status)&&c.status!==FL.status)return false;
    if(FL.types.length&&!FL.types.some(k=>(c.needs||[]).some(v=>needKey(v)===k)))return false;
    if(FL.people.length){const p=Number(c.people)||1;if(!FL.people.some(r=>{const [a,b]=r.split('-').map(Number);return p>=a&&p<=b}))return false}
    if(FL.level.length&&!FL.level.includes(c.level||'none'))return false;
    if(FL.urg.length&&(isClosed(c)||!FL.urg.includes(String(sevOf(c)))))return false;
    if(!ageOk(c))return false;
    return true}).sort((a,b)=>{const ta=Number(a.createdAt)||0,tb=Number(b.createdAt)||0;
      if(FL.sort==='old')return ta-tb;
      /* สำคัญก่อน: ยังไม่เสร็จก่อน → ความด่วนสูงก่อน → ยังไม่มีทีมไป (รอช่วย) ก่อน "กำลังไป" → รอนานกว่าก่อน → คนเยอะกว่าก่อน */
      if(FL.sort==='prio'||FL.sort==='urgent')return (isClosed(a)-isClosed(b))||(sevOf(b)-sevOf(a))||(rank[a.status]-rank[b.status])||(ta-tb)||((Number(b.people)||1)-(Number(a.people)||1));
      return tb-ta});
}
function caseCard(c){
  const b=document.createElement('button');b.type='button';b.className='case'+(c.status!=='done'?' u'+sevOf(c):' is-done')+(isDanger(c)?' danger':'');b.dataset.id=c.id;
  const addr=addrTxt(c);
  const needs=c.needs&&c.needs.length?c.needs:['ขอความช่วยเหลือ'];
  const facts=[[ 'users',(c.people||1)+' คน'],c.level&&LEVEL_TH[c.level]?['wave','น้ำ'+LEVEL_TH[c.level]]:null,S.volunteer&&c.photos&&c.photos.length?['image',c.photos.length+' รูป']:null].filter(Boolean);
  b.innerHTML=`<div class="case-top"><span class="case-chips">${c.status!=='done'?urgChip(c):''}${statusChip(c)}</span><span class="case-time">${esc(ago(c.createdAt))}</span></div>
    <div class="case-title"><span class="case-ics">${needs.slice(0,3).map(n=>ic(needIcon(n))).join('')}</span><b>${esc(needs.join(' · '))}</b></div>
    <div class="case-facts">${facts.map(([i,t])=>`<span>${ic(i)}${esc(t)}</span>`).join('')}</div>
    <div class="case-foot"><div class="case-line">${ic('pin')}<span>${esc(addr||(S.volunteer?'ไม่ระบุที่อยู่':'ไม่ระบุเขต'))}</span></div>`+
    (S.volunteer&&(c.name||c.phone)?`<div class="case-line contact">${ic('phone')}<span>${esc([c.name,c.phone].filter(Boolean).join(' · '))}</span></div>`:'')+
    `</div><span class="case-go" aria-hidden="true">${ic('next')}</span>`;
  b.addEventListener('click',()=>openCase(c.id));return b;
}
/* รายการเคสแบบตาราง: แถวละบรรทัดเดียว (ความด่วน · ต้องการ · คน · พื้นที่ · เวลา) · แตะแถวเพื่อกางรายละเอียด */
function caseHead(){const h=document.createElement('div');h.className='crow-head';h.setAttribute('aria-hidden','true');h.innerHTML='<span>ความด่วน</span><span>ต้องการ</span><span>คน</span><span>พื้นที่</span><span>เมื่อ</span><span></span>';return h}
function agoShort(ts){const t=Number(ts)||Date.parse(ts);if(!t)return '';const m=Math.round((Date.now()-t)/60000);if(m<60)return Math.max(1,m)+' น.';const h=Math.round(m/60);if(h<24)return h+' ชม.';return Math.round(h/24)+' วัน'}
let rowOpen='';
function caseRow(c){
  const w=document.createElement('div');w.className='crow'+(isClosed(c)?' is-done'+(c.status==='skip'?' is-skip':''):' u'+sevOf(c))+(isDanger(c)?' danger':'')+(rowOpen===c.id?' open':'');w.dataset.id=c.id;
  const needs=c.needs&&c.needs.length?c.needs:['ขอความช่วยเหลือ'],v=sevOf(c),area=areaOf(c)||'–';
  const lvl=c.status==='skip'?'<span class="cr-u cr-skip">ไม่เข้าเกณฑ์</span>':c.status==='done'?'<span class="cr-u done">เสร็จ</span>':`<span class="cr-u urg-${v}"><i></i>${URG_TH[v]}</span>`;
  const st=c.status==='going'?'<i class="cr-st going" title="กำลังไป"></i>':'';
  w.innerHTML=`<button type="button" class="cr-main" aria-expanded="${rowOpen===c.id}">${lvl}<span class="cr-ics">${needs.slice(0,2).map(n=>ic(needIcon(n))).join('')}${needs.length>2?`<em>+${needs.length-2}</em>`:''}</span><span class="cr-ppl">${esc(String(c.people||1))}</span><span class="cr-area">${st}${esc(area)}</span><span class="cr-time">${esc(agoShort(c.createdAt))}</span><span class="cr-chev">${ic('chev')}</span></button>`;
  w.querySelector('.cr-main').addEventListener('click',()=>{const was=rowOpen===c.id;rowOpen=was?'':c.id;
    $$('#case-list .crow.open').forEach(r=>{r.classList.remove('open');r.querySelector('.cr-main').setAttribute('aria-expanded','false');const d=r.querySelector('.cr-more');d&&d.remove()});
    if(!was){w.classList.add('open');w.querySelector('.cr-main').setAttribute('aria-expanded','true');w.append(caseMore(c))}});
  if(rowOpen===c.id)w.append(caseMore(c));
  return w}
function caseMore(c){const d=document.createElement('div');d.className='cr-more';
  const addr=addrTxt(c),tel=String(c.phone||'').replace(/[^\d+]/g,'');
  const rows=[['ต้องการ',(c.needs||[]).join(' · ')||'ขอความช่วยเหลือ'],['สถานะ',STATUS_TH[c.status]||'รอช่วย'],['จำนวนคน',(c.people||1)+' คน'],c.level&&LEVEL_TH[c.level]?['ระดับน้ำ',LEVEL_TH[c.level]]:null,['ที่อยู่',addr||(S.volunteer?'ไม่ระบุที่อยู่':'ไม่ระบุเขต')],
    S.volunteer&&(c.name||c.phone)?['ผู้แจ้ง',[c.name,c.phone].filter(Boolean).join(' · ')]:null,S.volunteer&&c.photos&&c.photos.length?['รูป',c.photos.length+' รูป']:null,c.notes?['หมายเหตุ',c.notes]:null,c.status==='skip'?['เหตุผลที่ปิด',c.closeNote||'ไม่ได้ระบุ']:null,['แจ้งเมื่อ',ago(c.createdAt)+' · #'+c.id]].filter(Boolean);
  d.innerHTML=`<dl>${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(String(v))}</dd></div>`).join('')}</dl><div class="cr-act">`+
    (S.volunteer&&tel.length>=9?`<a class="pill pill-sos" href="tel:${esc(tel)}">${ic('phone')}โทร</a>`:'')+
    (hasPin(c)&&S.volunteer&&!isClosed(c)?`<a class="pill pill-ghost" href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" target="_blank" rel="noopener">${ic('nav')}นำทาง</a>`:'')+
    `<button type="button" class="pill pill-ghost cr-open">${ic('next')}เปิดเคส</button></div>`;
  d.querySelector('.cr-open').addEventListener('click',()=>openCase(c.id));return d}
function renderList(){
  const list=filteredCases(),el=$('#case-list');el.replaceChildren(...(list.length?[caseHead()]:[]),...list.map(caseRow));
  if(!list.length)el.innerHTML=`<p class="empty">${!S.volunteer?'ยังไม่มีคำขอที่ส่งจากเครื่องนี้ · กด "ขอความช่วยเหลือ" ที่หน้าแรก':S.loaded?(FL.q?'ไม่พบเคสที่ค้นหา':'ไม่มีเคสในตัวกรองนี้'):'กำลังโหลด…'}</p>`;
  /* คนทั่วไปไม่เห็นจำนวนเคส */
  const txt=S.volunteer?(FL.q?`พบ ${list.length} เคส${(FL.status==='done'||FL.status==='skip')?'':' (ไม่รวมเคสที่ปิดแล้ว)'}`:`${list.length} เคส`):'คำขอของฉัน';$('#case-count').textContent=txt;S.listTxt=txt;sheetLabel();
  if(typeof tripBadges==='function')tripBadges();
}
function renderLegend(){$('#legend').innerHTML=`<span><i style="background:var(--red)"></i>ด่วน</span><span><i style="background:var(--open)"></i>รอช่วย</span><span><i style="background:var(--going)"></i>กำลังไป</span><span><i style="background:var(--ok)"></i>ช่วยแล้ว</span><span><i style="background:var(--skip)"></i>ไม่เข้าเกณฑ์</span>`}
function setSheet(open){const s=$('#list-sheet');s.classList.toggle('open',open);$('#sheet-handle').setAttribute('aria-expanded',String(open))}
$('#sheet-handle').addEventListener('click',()=>setSheet(!$('#list-sheet').classList.contains('open')));
(function(){let y0=null;const h=$('#sheet-handle');h.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{passive:true});h.addEventListener('touchend',e=>{if(y0==null)return;const dy=e.changedTouches[0].clientY-y0;if(dy<-30)setSheet(true);else if(dy>30)setSheet(false);y0=null},{passive:true})})();

/* ---------- ทีมอาสา ---------- */
function renderVol(forceOpen){
  /* ไม่มีสวิตช์ "ทีมอาสา" แล้ว: เข้าโหมดจากปุ่ม "อยากช่วย" (ใส่รหัสครั้งเดียว จำไว้ในเครื่อง) · ตั้งค่า/ออก จากปุ่ม "ตั้งค่าทีมอาสา" หน้าแรก */
  const vs=$('#btn-vol-set');if(vs){vs.hidden=!S.volunteer;const t=vs.querySelector('span');if(t)t.textContent='ตั้งค่าทีมอาสา · '+(store.get('uh_team','')||'ยังไม่ตั้งชื่อทีม')}
  const p=$('#vol-panel');if(forceOpen)p.hidden=false;if(p.hidden)return;
  if(p.dataset.mode===(S.volunteer?'v':'p')&&p.children.length)return;p.dataset.mode=S.volunteer?'v':'p';
  if(!S.volunteer){p.innerHTML='<h3>ใส่รหัสทีมอาสา</h3><p class="hint">เพื่อดูเบอร์โทร รับเคส ปิดเคส หรือคืนเคส</p><div class="row"><input id="vol-key" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="รหัสอาสา" aria-label="รหัสอาสา" aria-describedby="vol-msg"><button type="button" class="pill pill-blue" id="vol-go">เข้า</button></div><p class="err" id="vol-msg" role="alert"></p>';
    /* ตรวจรหัสด้วยคำขอของตัวเอง (ไม่ชนกับการรีเฟรชอัตโนมัติ) ลองซ้ำ 1 ครั้งถ้าเซิร์ฟเวอร์ตอบผิดรูปแบบ แยก "รหัสผิด" กับ "เชื่อมต่อไม่ได้" */
    const go2=async()=>{let k=$('#vol-key').value.replace(/\u200b/g,'').trim();if(!k)return $('#vol-key').focus();
      const btn=$('#vol-go'),msg=$('#vol-msg');btn.disabled=true;btn.textContent='กำลังตรวจ…';msg.textContent='';
      let r=null,netErr=false;
      /* เซิร์ฟเวอร์ (Apps Script) บางครั้งตื่นช้า 20–30 วิ → ลอง 3 ครั้ง รอนานขึ้นทีละรอบ และบอกผู้ใช้ว่ากำลังลองใหม่ */
      const waits=[10000,15000,30000];
      for(let i=0;i<waits.length&&!r;i++){if(i)msg.textContent=`เซิร์ฟเวอร์ตอบช้า กำลังลองอีกครั้ง (${i+1}/${waits.length})…`;
        try{const x=await apiGet({action:'list',key:k,t:Date.now()},waits[i],0);if(x&&x.ok)r=x;else netErr=true}catch(e){netErr=true;await new Promise(z=>setTimeout(z,600))}}
      msg.textContent='';
      /* มือถือบางรุ่นขึ้นตัวพิมพ์ใหญ่ให้เอง → ลองตัวพิมพ์เล็กอีกครั้ง */
      if(r&&!r.volunteer&&k!==k.toLowerCase()){try{const x=await apiGet({action:'list',key:k.toLowerCase(),t:Date.now()},20000);if(x&&x.ok&&x.volunteer){r=x;k=k.toLowerCase()}}catch(e){}}
      if($('#vol-go')){btn.disabled=false;btn.textContent='เข้า'}
      if(r&&r.volunteer){store.set('uh_vol_key',k);store.set('uh_vol_ok','1');S.volunteer=true;toast('เข้าโหมดทีมอาสาแล้ว',{ok:true});p.hidden=true;p.dataset.mode='';await loadCases(true);renderAll();return}
      if(r){msg.textContent='รหัสไม่ถูกต้อง ตรวจตัวพิมพ์เล็ก/ใหญ่ แล้วลองใหม่';$('#vol-key').select()}
      else msg.textContent=navigator.onLine?'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองกด "เข้า" อีกครั้ง':'ไม่มีสัญญาณ ลองใหม่เมื่อออนไลน์'};
    $('#vol-go').onclick=go2;$('#vol-key').onkeydown=e=>{if(e.key==='Enter')go2()};return}
  p.innerHTML=`<h3>ชื่อทีม</h3><div class="row"><input id="team-in" aria-label="ชื่อทีม" placeholder="ชื่อทีม / อาสา" value="${esc(store.get('uh_team',''))}" maxlength="40"></div>
    <h3 class="mt">หน่วยงาน</h3><div class="row"><select id="org-in" aria-label="หน่วยงาน"><option value="">— เลือกหน่วยงาน —</option>${orgOpts(store.get('uh_org',''))}</select></div>
    <div class="sep"></div><h3>แชร์ตำแหน่งทีม</h3><p class="hint">ให้ผู้แจ้งเห็นว่าทีมอยู่พื้นที่ไหน (ปัดเศษประมาณ 100 ม.)</p>
    <button type="button" class="pill ${SHARE.watch?'pill-ghost':'pill-green'} full" id="share-btn">${SHARE.watch?'หยุดแชร์ตำแหน่ง':'เริ่มแชร์ตำแหน่ง'}</button>
    <div class="vol-out-wrap"><button type="button" class="vol-out-link" id="vol-out-ask">ออกจากโหมดอาสา</button>
    <div class="vol-out-confirm" id="vol-out-confirm" hidden><p><b>ออกจากโหมดอาสา?</b><br>ครั้งหน้าต้องใส่รหัสใหม่${SHARE.watch?' และจะหยุดแชร์ตำแหน่งทีม':''}</p><div class="row"><button type="button" class="pill pill-ghost" id="vol-out-no">ยกเลิก</button><button type="button" class="pill vol-out-yes" id="vol-out">ออก</button></div></div></div>`;
  iconify(p);
  $('#team-in').onchange=e=>{store.set('uh_team',e.target.value.trim());renderVol()};
  $('#org-in').onchange=e=>store.set('uh_org',e.target.value);
  $('#share-btn').onclick=()=>{SHARE.watch?stopShare():startShare();p.dataset.mode='';renderVol()};
  /* กันกดพลาด: ลิงก์เล็ก → ต้องกดยืนยันอีกครั้ง */
  $('#vol-out-ask').onclick=()=>{$('#vol-out-confirm').hidden=false;$('#vol-out-ask').hidden=true;$('#vol-out-no').focus()};
  $('#vol-out-no').onclick=()=>{$('#vol-out-confirm').hidden=true;$('#vol-out-ask').hidden=false};
  $('#vol-out').onclick=()=>{stopShare();store.set('uh_vol_key','');store.set('uh_vol_ok','');S.volunteer=false;p.hidden=true;p.dataset.mode='';S.cases=((store.json('uh_cases_cache',{})||{}).cases||[]).map(pubCase);renderAll();if(S.view==='detail')go('map');loadCases()};
}

const SHARE={watch:null,last:0,pos:null};
function startShare(){
  if(!store.get('uh_team','')){toast('ใส่ชื่อทีมก่อนแชร์');$('#team-in')&&$('#team-in').focus();return}
  if(!navigator.geolocation)return toast('อุปกรณ์นี้ไม่รองรับตำแหน่ง');
  SHARE.watch=navigator.geolocation.watchPosition(p=>{SHARE.pos=p.coords;if(Date.now()-SHARE.last>60000)sendPing()},e=>{toast('แชร์ตำแหน่งไม่ได้: '+(e.code===1?'ไม่ได้รับอนุญาต':'หาตำแหน่งไม่ได้'));stopShare()},{enableHighAccuracy:true,maximumAge:20000});
  toast('เริ่มแชร์ตำแหน่งทีมแล้ว',{ok:true});renderVol();
}
async function sendPing(stop){if(!SHARE.pos&&!stop)return;SHARE.last=Date.now();
  try{const r=await apiPost({action:'ping',key:volKey(),team:store.get('uh_team',''),caseId:'',...(stop?{stop:true}:{lat:SHARE.pos.latitude,lng:SHARE.pos.longitude,accuracy:Math.round(SHARE.pos.accuracy||0)})},12000);
    if(r&&r.error==='unknown_action'&&!stop){toast('ระบบแชร์ตำแหน่งทีมยังไม่เปิดใช้งานบนเซิร์ฟเวอร์');stopShare()}}catch(e){}}
function stopShare(){if(SHARE.watch!=null){navigator.geolocation.clearWatch(SHARE.watch);SHARE.watch=null;sendPing(true)}renderVol()}
setInterval(()=>{if(SHARE.watch&&SHARE.pos&&Date.now()-SHARE.last>=120000)sendPing()},30000);

/* ---------- รายละเอียดเคส ---------- */
function openCase(id){S.detailId=String(id);renderDetail(true);go('detail')}
/* เลื่อนดูจุดก่อน/ถัดไปในแผน โดยไม่สะสมประวัติ (กดย้อนกลับครั้งเดียวก็กลับแผนที่) */
function stepTrip(i){const id=TRIP.ids[i];if(!id)return;S.detailId=String(id);renderDetail(true);window.scrollTo(0,0);const h=$('#view-detail h1');h&&h.focus({preventScroll:true})}
$('#detail-back').addEventListener('click',()=>{history.length>1?history.back():go('map')});
function renderDetail(full){
  const c=S.cases.find(x=>String(x.id)===S.detailId);const el=$('#detail');
  if(!c){el.innerHTML='<p class="empty">ไม่พบเคสนี้</p>';return}
  if(!full&&el.dataset.id===S.detailId&&el.dataset.sig===JSON.stringify([c.status,c.volunteer]))return;
  el.dataset.id=S.detailId;el.dataset.sig=JSON.stringify([c.status,c.volunteer]);
  const addr=addrTxt(c),V=S.volunteer;
  const tel=String(c.phone||'').replace(/[^\d+]/g,'');
  const facts=[['ความเร่งด่วน',URG_TH[sevOf(c)]],['จำนวนคน',(c.people||1)+' คน'],['ระดับน้ำ',levelLabel(c.level)],['ความต้องการ',(c.needs||[]).join(', ')||'-'],['แจ้งเมื่อ',ago(c.createdAt)]];
  if(V&&c.name)facts.push(['ผู้ติดต่อ',c.name]);if(V&&c.phone)facts.push(['เบอร์โทร',c.phone]);if(c.volunteer&&c.status!=='open')facts.push(['ทีมที่รับเคส',c.volunteer]);if(c.org&&c.status!=='open')facts.push(['หน่วยงาน',c.org]);
  el.innerHTML=`<div class="d-map-col">${hasPin(c)?`<div id="detail-map" class="detail-map"></div>${!V?`<p class="hint">${ic('pin')} ตำแหน่งโดยประมาณ (รัศมีราว 500 ม.) · ที่อยู่เต็มเห็นเฉพาะทีมอาสา</p>`:''}${V&&c.pinsrc?`<p class="hint pinsrc">${ic('locate')} ที่มาของหมุด: <b>${esc(c.pinsrc)}</b></p>`:''}<div class="coord-row">${V?`<span>${ic('pin')} ${(+c.lat).toFixed(6)}, ${(+c.lng).toFixed(6)}</span>`:`<span>${ic('pin')} ตำแหน่งโดยประมาณ</span>`}<span class="loc-btns"><button type="button" class="pill pill-ghost small" id="copy-coord" data-icon="copy">คัดลอก</button><button type="button" class="pill pill-ghost small" id="share-coord" data-icon="share">แชร์</button></span></div>`:'<p class="hint">ผู้แจ้งไม่ได้ปักหมุด</p>'}</div>
    <div><div class="detail-head">${statusChip(c)}<h2>${esc((c.needs||[]).join(' · ')||'ขอความช่วยเหลือ')}</h2><span class="case-time">#${esc(c.id)}</span></div>
    <section class="card"><h2>${V?'ที่อยู่':'พื้นที่'}</h2><p>${esc(addr||(V?'ไม่ระบุ':'ไม่ระบุเขต'))}</p>${S.volunteer&&c.notes?`<h2 class="mt">รายละเอียด</h2><p>${esc(c.notes)}</p>`:''}
    <div class="facts">${facts.map(([k,v])=>`<div class="fact"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
    ${V&&c.photos&&c.photos.length?`<h2 class="mt">รูปจากผู้แจ้ง</h2><div class="d-photos">${c.photos.map((id,i)=>`<a href="https://drive.google.com/file/d/${encodeURIComponent(id)}/view" target="_blank" rel="noopener"><img src="https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w600" alt="รูปที่ ${i+1} จากผู้แจ้ง" loading="lazy"></a>`).join('')}</div>`:''}
    <div class="actions" id="d-actions"></div></section></div>`;
  iconify(el);
  const act=$('#d-actions');
  if(V&&hasPin(c))act.insertAdjacentHTML('beforeend',`<a class="pill pill-blue full" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}">${ic('nav')}นำทางไปที่นี่</a>`);
  if(S.volunteer&&tel.length>=9)act.insertAdjacentHTML('beforeend',`<a class="pill pill-green full" href="tel:${esc(tel)}">${ic('phone')}โทรหาผู้แจ้ง</a>`);
  const ti=S.volunteer?tripIndex(c.id):-1;
  if(ti>=0){const nav=document.createElement('div');nav.className='trip-nav';const n=TRIP.ids.length;
    nav.innerHTML=`<button type="button" ${ti===0?'disabled':''} aria-label="จุดก่อนหน้า">${ic('back')}</button><span>${ic('route')}จุดที่ <b>${ti+1}</b> จาก ${n} ในแผนเดินทาง</span><button type="button" ${ti===n-1?'disabled':''} aria-label="จุดถัดไป">${ic('next')}</button>`;
    const [pv,nx]=nav.querySelectorAll('button');pv.onclick=()=>stepTrip(ti-1);nx.onclick=()=>stepTrip(ti+1);act.before(nav)}
  if(S.volunteer&&hasPin(c)&&!isClosed(c)){const tb=document.createElement('button');tb.type='button';tb.className='pill pill-ghost full';const upd=()=>{tb.innerHTML=ic('route')+(tripIndex(c.id)>=0?'อยู่ในแผนเดินทาง (แตะเพื่อเอาออก)':'เพิ่มในแผนเดินทาง')};upd();tb.onclick=()=>{tripToggle(c.id);upd()};act.append(tb)}
  if(S.volunteer){
    const fs=document.createElement('fieldset');fs.className='status-pick';
    fs.innerHTML=`<legend>สถานะเคส (ติ๊กเพื่อเปลี่ยน)</legend><div class="status-opts">${[['open','รอช่วย'],['going','กำลังไป · รับเคส'],['done','ช่วยแล้ว · ปิดเคส'],['skip','ไม่เข้าเกณฑ์ · ปิดโดยไม่ไปช่วย']].map(([v,t])=>`<label class="cst-${v}"><input type="radio" name="cst" value="${v}" ${c.status===v?'checked':''}><span>${t}</span></label>`).join('')}</div>${c.status==='skip'?`<p class="skip-note-now"><b>เหตุผลที่ปิด:</b> ${esc(c.closeNote||'ไม่ได้ระบุ')}</p>`:''}
      <div class="skip-box" id="skip-box" hidden><b>ทำไมไม่เข้าเกณฑ์?</b><div class="skip-chips">${SKIP_REASONS.map(r=>`<button type="button" data-skr="${esc(r)}">${esc(r)}</button>`).join('')}</div><textarea id="skip-note" rows="2" maxlength="300" placeholder="โน้ตสั้น ๆ เช่น โทรคุยแล้ว น้ำลดแล้ว อยู่ได้" aria-label="เหตุผลที่ปิดเคส"></textarea><div class="row"><button type="button" class="pill pill-ghost" id="skip-cancel">ยกเลิก</button><button type="button" class="pill skip-ok" id="skip-ok">ปิดเคส</button></div></div>
      <input id="d-team" placeholder="ชื่อทีม / อาสา" value="${esc(c.volunteer||store.get('uh_team',''))}" maxlength="40" aria-label="ชื่อทีม">
      <select id="d-org" aria-label="หน่วยงาน"><option value="">— หน่วยงาน —</option>${orgOpts(c.org||store.get('uh_org',''))}</select>`;
    const restore=()=>{const o=fs.querySelector(`input[value="${c.status}"]`);if(o)o.checked=true};
    const send=async(v,note)=>{const team=$('#d-team').value.trim();if(team)store.set('uh_team',team);fs.disabled=true;const org=$('#d-org').value;if(org)store.set('uh_org',org);
      try{const r=await apiPost({action:'update',key:volKey(),id:c.id,status:v,volunteer:v==='open'?'':team,org:v==='open'?'':org,note:note||''});if(!r||!r.ok)throw new Error(r&&r.error);
        c.status=v;c.closeNote=v==='skip'?note:v==='open'?'':c.closeNote;c.volunteer=v==='open'?'':team||c.volunteer;c.org=v==='open'?'':org||c.org;toast(v==='going'?'รับเคสแล้ว':v==='done'?'ปิดเคสแล้ว':v==='skip'?'ปิดเคสแล้ว · ไม่เข้าเกณฑ์':'คืนเคสแล้ว',{ok:true});renderDetail(true);loadCases()}
      catch(err){toast(err&&err.message==='bad_status'?'หลังบ้านยังไม่รองรับสถานะนี้':'อัปเดตไม่สำเร็จ ลองอีกครั้ง');fs.disabled=false;restore()}};
    /* ไม่เข้าเกณฑ์: เลือกเหตุผล/พิมพ์โน้ต แล้วกด "ปิดเคส" ก่อนจึงส่ง */
    fs.addEventListener('click',e=>{const ch=e.target.closest('[data-skr]');if(ch){const t=$('#skip-note'),cur=t.value.trim();t.value=cur.includes(ch.dataset.skr)?cur:(cur?cur+' · ':'')+ch.dataset.skr;fs.querySelectorAll('[data-skr]').forEach(b=>b.setAttribute('aria-pressed',String(t.value.includes(b.dataset.skr))));return}
      if(e.target.id==='skip-cancel'){$('#skip-box').hidden=true;restore();return}
      if(e.target.id==='skip-ok'){const note=$('#skip-note').value.trim();if(!note){toast('เลือกเหตุผล หรือพิมพ์โน้ตสั้น ๆ ก่อน');$('#skip-note').focus();return}$('#skip-box').hidden=true;send('skip',note)}});
    fs.addEventListener('change',e=>{if(e.target.name!=='cst')return;const v=e.target.value;if(!v||v===c.status)return;
      if(v==='skip'){$('#skip-box').hidden=false;$('#skip-note').focus();return}
      $('#skip-box').hidden=true;const team=$('#d-team').value.trim();
      if(v==='going'&&!team){toast('ใส่ชื่อทีมก่อนรับเคส');restore();$('#d-team').focus();return}
      send(v,'')});
    act.after(fs);
  }else act.insertAdjacentHTML('afterend','<p class="hint">ทีมอาสาที่มีรหัสจะเห็นที่อยู่เต็ม เบอร์โทร และรับเคสได้ในหน้าแผนที่</p>');
  const caseLoc=()=>locText({lat:c.lat,lng:c.lng,title:(c.needs||[]).join(' · ')||'ขอความช่วยเหลือ',address:(addrTxt(c)||'')+' · เคส #'+c.id,note:V&&c.pinsrc?c.pinsrc:'',approx:!V});
  const cp=$('#copy-coord');if(cp)cp.onclick=()=>copyText(caseLoc(),'คัดลอกตำแหน่งแล้ว · วางใน LINE หรือแชตอื่นได้เลย');
  const sh=$('#share-coord');if(sh)sh.onclick=()=>shareText(caseLoc(),'ตำแหน่งเคส #'+c.id);
  if(hasPin(c))loadLeaflet().then(()=>{const mel=$('#detail-map');if(!mel)return;if(S.detailMap){S.detailMap.remove()}
    S.detailMap=makeMap(mel,{center:[+c.lat,+c.lng],zoom:V?16:14});if(!V){L.circle([+c.lat,+c.lng],{radius:500,color:'#2D45C8',weight:1.5,fillOpacity:.08,interactive:false}).addTo(S.detailMap)}L.marker([+c.lat,+c.lng],{icon:pinIcon(pinKind(c)),interactive:false,keyboard:false}).addTo(S.detailMap);setTimeout(()=>S.detailMap&&S.detailMap.invalidateSize(),250)}).catch(()=>{});
}

/* ---------- แผนการเดินทาง (ทีมอาสา): เคสหนักก่อน · ใกล้สุดก่อน · จัดอัตโนมัติ · นำทาง Google Maps ---------- */
const TRIP={ids:store.json('uh_trip',[]).filter(x=>typeof x==='string').slice(0,25),layer:null,lastPos:null};
const tripSave=()=>TRIP.ids.length?store.put('uh_trip',TRIP.ids):store.set('uh_trip','');
const tripIndex=id=>TRIP.ids.indexOf(String(id));
const tripCases=()=>TRIP.ids.map(id=>S.cases.find(c=>String(c.id)===id)||{id,missing:true});
function kmBetween(a,b){const R=6371,t=Math.PI/180,dl=(b.lat-a.lat)*t,dn=(b.lng-a.lng)*t,x=Math.sin(dl/2)**2+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
const tripDist=kmBetween;
function tripToggle(id){id=String(id);const i=tripIndex(id);if(i>=0)TRIP.ids.splice(i,1);else if(TRIP.ids.length<25)TRIP.ids.push(id);tripSave();tripRefresh()}
function tripMove(i,d){const j=i+d;if(j<0||j>=TRIP.ids.length)return;[TRIP.ids[i],TRIP.ids[j]]=[TRIP.ids[j],TRIP.ids[i]];tripSave();tripRefresh()}
function tripOrigin(){const me=S.me||TRIP.lastPos;if(!S.me&&navigator.geolocation)navigator.geolocation.getCurrentPosition(p=>{TRIP.lastPos={lat:p.coords.latitude,lng:p.coords.longitude}},()=>{},{timeout:10000,maximumAge:120000});return me}
function tripNN(pts,start){const left=pts.slice(),out=[];let cur=start;if(!cur&&left.length){cur=left.shift();out.push(cur)}while(left.length){let bi=0,bd=Infinity;left.forEach((p,i)=>{const d=tripDist(cur,p);if(d<bd){bd=d;bi=i}});cur=left.splice(bi,1)[0];out.push(cur)}return out}
function tripPriority(pts,start){let cur=start,out=[];[4,3,2,1].forEach(s=>{const tier=pts.filter(p=>p.sev===s);if(!tier.length)return;const o=tripNN(tier,cur);out=out.concat(o);cur=o[o.length-1]});return out}
const tripPts=list=>list.filter(c=>!c.missing&&hasPin(c)).map(c=>({id:String(c.id),lat:+c.lat,lng:+c.lng,sev:sevOf(c),people:Number(c.people)||1}));
function tripApply(order,rest,msg){TRIP.ids=[...order.map(p=>p.id),...rest];tripSave();tripRefresh();const n=$('#trip-note');if(n&&msg){n.textContent='✓ '+msg;n.classList.add('flash')}}
function tripSort(heavy){const list=tripCases(),pts=tripPts(list),rest=list.filter(c=>c.missing||!hasPin(c)).map(c=>String(c.id));if(pts.length<2)return;const me=tripOrigin();
  tripApply(heavy?tripPriority(pts,me):tripNN(pts,me),rest,heavy?'จัดเคสหนักก่อนแล้ว · ด่วน → ปานกลาง → ทั่วไป':'เรียงใกล้สุดก่อนแล้ว')}
function tripAuto(){const me=tripOrigin();let pool=S.cases.filter(c=>c.status==='open'&&hasPin(c)).map(c=>({id:String(c.id),lat:+c.lat,lng:+c.lng,sev:sevOf(c),people:Number(c.people)||1}));
  if(!pool.length)return toast('ไม่มีเคสที่รอช่วยและมีพิกัด');
  if(me){pool.forEach(p=>p.km=tripDist(me,p));const near=pool.filter(p=>p.km<=15);if(near.length>=3)pool=near}
  pool.sort((a,b)=>(b.sev-a.sev)||(b.people-a.people)||((a.km||0)-(b.km||0)));const pick=pool.slice(0,8);
  tripApply(tripPriority(pick,me),[],'จัดอัตโนมัติ '+pick.length+' จุด · เคสหนักก่อน')}
/* Google Maps รับได้ครั้งละ 10 จุด → แบ่งเป็นช่วง ช่วงถัดไปเริ่มจากจุดสุดท้ายของช่วงก่อน */
function tripLegs(){const all=tripCases(),ok=all.map((c,i)=>({c,n:i+1})).filter(({c})=>!c.missing&&hasPin(c)&&!isClosed(c)),pts=ok.map(({c})=>(+c.lat).toFixed(6)+','+(+c.lng).toFixed(6));const legs=[];
  for(let i=0;i<pts.length;i+=10){const use=pts.slice(i,i+10);const origin=i?pts[i-1]:'';const dest=use.pop();
    legs.push({from:ok[i].n,to:ok[Math.min(i+10,pts.length)-1].n,url:'https://www.google.com/maps/dir/?api=1&travelmode=driving'+(origin?'&origin='+encodeURIComponent(origin):'')+'&destination='+encodeURIComponent(dest)+(use.length?'&waypoints='+encodeURIComponent(use.join('|')):'')})}
  return legs}
function tripUrl(){const l=tripLegs();return l.length?l[0].url:''}
/* โซนเคสใกล้กัน: รวมเคสที่รอช่วยซึ่งอยู่ห่างกันไม่เกิน ZONE_KM เป็นกลุ่ม ให้ทีมรับทีละโซน */
const ZONE_KM=2.5,ZONE_MAX=10;
function zoneArea(list){const cnt={};list.forEach(c=>{const k=c.district?'เขต'+c.district:String(c.address||'').replace(/^(บ้านเลขที่|เลขที่)?\s*[\d\/\-\s]+/,'').split(/[,·]/)[0].trim().slice(0,24);if(k)cnt[k]=(cnt[k]||0)+1});
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(x=>x[0])[0]||'ไม่ระบุพื้นที่'}
function tripZones(){
  let left=S.cases.filter(c=>c.status==='open'&&hasPin(c)&&tripIndex(c.id)<0).map(c=>({c,lat:+c.lat,lng:+c.lng}));
  const zones=[];
  while(left.length>1&&zones.length<12){
    let best=null,bestN=[];
    left.forEach(p=>{const n=left.filter(q=>tripDist(p,q)<=ZONE_KM);if(n.length>bestN.length){best=p;bestN=n}});
    if(bestN.length<2)break;
    const lat=bestN.reduce((a,p)=>a+p.lat,0)/bestN.length,lng=bestN.reduce((a,p)=>a+p.lng,0)/bestN.length;
    zones.push({cases:bestN.map(p=>p.c),lat,lng,people:bestN.reduce((a,p)=>a+(Number(p.c.people)||1),0),urgent:bestN.filter(p=>isDanger(p.c)).length});
    left=left.filter(p=>!bestN.includes(p));
  }
  const me=S.me||TRIP.lastPos;
  zones.forEach(z=>{z.area=zoneArea(z.cases);z.km=me?tripDist(me,z):null});
  return zones.sort((a,b)=>(b.urgent-a.urgent)||(me?a.km-b.km:0)||(b.cases.length-a.cases.length)).slice(0,12);
}
function tripPlanZone(z){
  const me=tripOrigin();const pts=z.cases.map(c=>({id:String(c.id),lat:+c.lat,lng:+c.lng,sev:sevOf(c),people:Number(c.people)||1}));
  const order=tripNN(pts,me).slice(0,ZONE_MAX);
  tripApply(order,[],`วางเส้นทางโซน ${z.area} · ${order.length} จุด เรียงใกล้สุดก่อน`);
  const m=S.maps.map;if(m&&window.L){m.fitBounds(L.latLngBounds(order.map(p=>[p.lat,p.lng])),{padding:[50,50],maxZoom:16})}
}
function zoneListHTML(zones){
  const n=zones.length;
  return `<button type="button" class="zone-head zone-tog" id="zone-tog" aria-expanded="${TRIP.zOpen?'true':'false'}"><b>${ic('layers')} โซนเคสใกล้กัน${n?` <span class="zone-cnt">${n}</span>`:''}</b><small>${TRIP.zOpen?`รัศมี ~${ZONE_KM} กม. · แตะเพื่อวางเส้นทาง`:'แตะเพื่อดูโซนและจัดเส้นทาง'}</small>${ic('chev')}</button>`+
    (!TRIP.zOpen?'':zones.length?`<div class="zone-list">${zones.map((z,i)=>`<button type="button" class="zone" data-z="${i}"><span class="zone-n">${z.cases.length}</span><span class="zone-t"><b>${esc(z.area)}</b><small>${z.people} คน${z.urgent?` · <em>ด่วน ${z.urgent}</em>`:''}${z.km!=null?` · ห่าง ~${z.km.toFixed(1)} กม.`:''}</small></span>${ic('route')}</button>`).join('')}</div>`
    :`<p class="hint">ยังไม่มีเคสรอช่วยที่อยู่ใกล้กัน 2 เคสขึ้นไป</p>`);
}
function bindZones(el,zones){el.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>tripPlanZone(zones[+b.dataset.z]))}
function renderTrip(){
  const el=$('#trip-panel');const list=tripCases();
  if(!S.volunteer||!S.cases.length){el.hidden=true;return}
  el.hidden=false;el.classList.toggle('empty',!list.length);
  if(!list.length){const zones=tripZones();TRIP.zones=zones;
    el.classList.toggle('z-closed',!TRIP.zOpen);
    el.innerHTML=zoneListHTML(zones)+(TRIP.zOpen?`<button type="button" class="trip-auto" id="trip-auto">${ic('route')}<span><b>จัดเส้นทางอัตโนมัติ</b><small>เลือกเคสใกล้คุณ คนเยอะก่อน แล้วเรียงให้</small></span></button>`:'');
    $('#zone-tog').onclick=()=>{TRIP.zOpen=!TRIP.zOpen;renderTrip()};
    if(TRIP.zOpen){$('#trip-auto').onclick=tripAuto;bindZones(el,zones)}drawZones();return}
  el.classList.remove('z-closed');
  TRIP.zones=[];
  let km=0,prev=null;list.forEach(c=>{if(!c.missing&&hasPin(c)){const p={lat:+c.lat,lng:+c.lng};if(prev)km+=tripDist(prev,p);prev=p}});
  el.innerHTML=`<div class="trip-head"><b>${ic('route')} แผนเดินทาง · ${list.length} จุด</b><span class="trip-note" id="trip-note">${km?'ระยะตรงรวม ~'+km.toFixed(1)+' กม.':''}</span></div><ol class="trip-list"></ol>`;
  const ol=el.querySelector('ol');
  list.forEach((c,i)=>{const li=document.createElement('li');li.className='trip-item';
    li.innerHTML=`<span class="trip-no${!c.missing&&isDanger(c)?' danger':''}">${i+1}</span><button type="button" class="trip-txt"><b>${esc(c.missing?'เคส #'+c.id:(c.needs||[]).join(' · ')+' · '+(c.people||1)+' คน')}</b><small>${esc(c.missing?'ไม่พบในรายการ':[c.address||(c.district?'เขต'+c.district:''),c.status==='done'?'ช่วยแล้ว':''].filter(Boolean).join(' · '))}</small></button>
      <span class="trip-ctl"><button type="button" aria-label="เลื่อนขึ้น" ${i===0?'disabled':''}>${ic('up')}</button><button type="button" aria-label="เลื่อนลง" ${i===list.length-1?'disabled':''}>${ic('down')}</button><button type="button" aria-label="เอาออก">${ic('close')}</button></span>`;
    const [u,d,x]=li.querySelectorAll('.trip-ctl button');u.onclick=()=>tripMove(i,-1);d.onclick=()=>tripMove(i,1);x.onclick=()=>tripToggle(c.id);
    const tt=li.querySelector('.trip-txt');tt.setAttribute('aria-label',`จุดที่ ${i+1}: ดูรายละเอียดเคส`);tt.onclick=()=>{if(!c.missing)openCase(c.id)};ol.append(li)});
  const legs=tripLegs(),few=tripPts(list).length<2;
  el.insertAdjacentHTML('beforeend',(legs.length>1?legs.map((g,i)=>`<a class="pill pill-blue full" style="margin-top:${i?6:10}px" href="${g.url}" target="_blank" rel="noopener">${ic('nav')}นำทางช่วงที่ ${i+1} (จุด ${g.from}–${g.to})</a>`).join(''):
    `<a class="pill pill-blue full" style="margin-top:10px" ${legs.length?`href="${legs[0].url}" target="_blank" rel="noopener"`:'aria-disabled="true"'}>${ic('nav')}เริ่มนำทางทั้งเส้น</a>`)+`
    <div class="trip-btns"><button type="button" class="pill pill-green small" data-t="heavy" ${few?'disabled':''}>${ic('alert')}เคสหนักก่อน</button><button type="button" class="pill pill-ghost small" data-t="near" ${few?'disabled':''}>${ic('pin')}ใกล้สุดก่อน</button>
    <button type="button" class="pill pill-ghost small" data-t="auto">${ic('route')}จัดอัตโนมัติ</button><button type="button" class="pill pill-line small" data-t="clear">ล้างแผน</button></div>`);
  el.querySelector('[data-t=heavy]').onclick=()=>tripSort(true);el.querySelector('[data-t=near]').onclick=()=>tripSort(false);
  const au=el.querySelector('[data-t=auto]');au.onclick=()=>{if(!au.dataset.sure){au.dataset.sure='1';au.lastChild.textContent='แทนที่แผนเดิม?';return}tripAuto()};
  const cl=el.querySelector('[data-t=clear]');cl.onclick=()=>{if(!cl.dataset.sure){cl.dataset.sure='1';cl.textContent='กดอีกครั้งเพื่อล้าง';return}TRIP.ids=[];tripSave();tripRefresh()};
}
function drawZones(){const m=S.maps.map;if(!m||!window.L)return;if(!TRIP.zlayer)TRIP.zlayer=L.layerGroup().addTo(m);TRIP.zlayer.clearLayers();
  if(!S.volunteer||TRIP.ids.length)return;(TRIP.zones||[]).forEach((z,i)=>{
    L.circle([z.lat,z.lng],{radius:Math.max(300,...z.cases.map(c=>tripDist(z,{lat:+c.lat,lng:+c.lng})*1000))+150,color:'#0F2188',weight:1.5,opacity:.6,fillColor:'#0F2188',fillOpacity:.06,dashArray:'4 6',interactive:false}).addTo(TRIP.zlayer);
    L.marker([z.lat,z.lng],{icon:L.divIcon({className:'zone-pin',html:`<span>${z.cases.length}<small>เคส</small></span>`,iconSize:[44,44],iconAnchor:[22,22]}),zIndexOffset:2400,title:'โซน '+z.area})
      .on('click',()=>tripPlanZone(z)).addTo(TRIP.zlayer)})}
function drawTrip(){const m=S.maps.map;if(!m||!window.L)return;if(!TRIP.layer)TRIP.layer=L.layerGroup().addTo(m);TRIP.layer.clearLayers();drawZones();if(!S.volunteer)return;
  const pts=[];tripCases().forEach((c,i)=>{if(c.missing||!hasPin(c))return;const p=[+c.lat,+c.lng];pts.push(p);
    L.marker(p,{icon:L.divIcon({className:'trip-pin',html:`<span>${i+1}</span>`,iconSize:[24,24],iconAnchor:[12,48]}),interactive:false,zIndexOffset:2500}).addTo(TRIP.layer)});
  if(pts.length>1)L.polyline(pts,{color:'#0F2188',weight:4,opacity:.8,dashArray:'8 8',interactive:false}).addTo(TRIP.layer)}
function tripBadges(){$$('#case-list .crow').forEach(b=>{const i=tripIndex(b.dataset.id);let t=b.querySelector('.trip-badge');if(i<0||!S.volunteer){t&&t.remove();return}if(!t){t=document.createElement('span');t.className='trip-badge';b.append(t)}t.textContent='จุดที่ '+(i+1)})}
function tripRefresh(){renderTrip();drawTrip();tripBadges();sheetLabel()}
function sheetLabel(){let n=0;try{n=S.volunteer?TRIP.ids.length:0}catch(e){}$('#sheet-count').textContent=(n?`แผนเดินทาง ${n} จุด · `:'')+(S.listTxt||'')}

/* ---------- เริ่มต้น ---------- */
iconify();renderFilters();renderLegend();netbar();
{const c=store.json('uh_cases_cache',null);if(c&&c.cases&&!S.volunteer)S.cases=c.cases.map(pubCase)}
/* ---------- หน้าสรุป: ตัวเลขภาพรวมจากรายการเคส (คำนวณในเครื่อง) ---------- */
const AREA=store.json('uh_area',{});  /* เขตของแต่ละพิกัด (หาจากหมุดครั้งเดียวแล้วเก็บไว้) */
const areaKey=c=>(+c.lat).toFixed(3)+','+(+c.lng).toFixed(3);
function areaOf(c){if(c.district)return String(c.district).replace(/^เขต/,'');const m=String(c.address||'').match(/เขต\s*([ก-๙]+)/);if(m)return m[1];return hasPin(c)?AREA[areaKey(c)]||'':''}
let areaBusy=false;
async function fillAreas(){if(areaBusy)return;const todo=[...new Set(S.cases.filter(c=>hasPin(c)&&!c.district&&!/เขต/.test(c.address||'')&&AREA[areaKey(c)]===undefined).map(areaKey))].slice(0,60);
  if(!todo.length)return;areaBusy=true;
  try{for(let i=0;i<todo.length;i+=4){await Promise.all(todo.slice(i,i+4).map(async k=>{const [la,ln]=k.split(',');const p=await geoReverseRaw(la,ln);
      if(p)AREA[k]=p.city&&!/กรุงเทพ/.test(p.city)?(p.city||'').replace(/^จังหวัด/,''):(p.district||p.county||'').replace(/^เขต/,'')}));
    store.put('uh_area',AREA);if(S.view==='stats')renderStats(true);else if(!S.volunteer)renderList()}}
  finally{areaBusy=false}}
function statBars(rows,opt={}){const max=Math.max(1,...rows.map(r=>r.n));
  return `<ul class="bars">${rows.map(r=>`<li>${opt.tap?`<button type="button" ${opt.tap(r)}>`:'<div>'}<span class="bl">${r.icon?ic(r.icon):''}${esc(r.label)}${r.sub?`<small>${esc(r.sub)}</small>`:''}</span><span class="bt"><i style="width:${Math.max(3,r.n/max*100)}%${r.color?';background:'+r.color:''}"></i></span><b>${r.n}</b>${opt.tap?'</button>':'</div>'}</li>`).join('')}</ul>`}
const URG_COL={4:'#B91C1C',3:'#E5383B',2:'#F07B14',1:'#E0B000'};
function renderStats(soft){
  const el=$('#stats');if(!el)return;const all=S.cases;
  if(!S.loaded&&!all.length){el.innerHTML='<p class="empty">กำลังโหลด…</p>';return}
  const R=computeStats(all,{now:Date.now(),areaOf,needKey,sev:sevOf});window.__stats=R;
  const N=x=>Math.round(Number(x)||0).toLocaleString('th-TH'),P=c=>Math.max(1,Number(c.people)||1);
  const dur=ms=>{if(!ms)return '-';const h=ms/3600000;return h<1?Math.max(1,Math.round(ms/60000))+' นาที':h<48?(Math.round(h*10)/10)+' ชม.':(Math.round(h/24*10)/10)+' วัน'};
  const pctTxt=x=>(Math.round(x*1000)/10)+'%';
  const dName=k=>areaLabel(k)||'ไม่ทราบเขต';
  const tile=(n,l,cls='',go='')=>`<button type="button" class="stile ${cls}" ${go}><b>${N(n)}</b><span>${l}</span></button>`;
  const line=(i,t,v,cls='')=>`<div class="sline${cls?' '+cls:''}"><span>${ic(i)}${t}</span><b>${v}</b></div>`;
  const pplNote=(raw,uniq)=>raw!==uniq?`${N(uniq)} คน <small class="snote">(รวมซ้ำ ${N(raw)})</small>`:`${N(uniq)} คน`;
  const caseLink=(c,right)=>`<li><button type="button" data-sopen="${esc(c.id)}"><span class="urg urg-${sevOf(c)}"><i></i>${URG_TH[sevOf(c)]}</span><span class="sl-t"><b>${esc((c.needs||[]).join(' · ')||'ขอความช่วยเหลือ')}</b><small>${esc([dName(areaOf(c)),P(c)+' คน','#'+c.id].join(' · '))}</small></span><em>${right}</em></button></li>`;
  const {open,going,done,act,urgent,people,times,waits,today,days}=R;
  const dmax=Math.max(1,...days.map(x=>Math.max(x.n,x.k)));
  const urgRows=R.urg.map(u=>({label:URG_TH[u.v],n:u.n,sub:N(u.ppl)+' คน',color:URG_COL[u.v],v:u.v}));
  const needRows=NEED_TYPES.map(t=>({key:t.key,label:t.label,icon:t.icon,n:(R.needs[t.key]||{}).n||0,sub:N((R.needs[t.key]||{}).ppl||0)+' คน'})).filter(r=>r.n).sort((a,b)=>b.n-a.n);
  const lvRows=[...Object.keys(LEVEL_TH),'none'].map(k=>({key:k,label:LEVEL_TH[k]||'ไม่ระบุ',n:(R.levels[k]||{}).n||0,sub:N((R.levels[k]||{}).ppl||0)+' คน',color:LEVEL_COLOR[k]})).filter(r=>r.n);
  const dRow=d=>`<tr><th scope="row">${esc(dName(d.key))}</th><td>${d.open||'–'}</td><td class="${d.urg?'is-red':''}">${d.urg||'–'}</td><td>${d.going||'–'}</td><td>${d.done||'–'}</td><td>${d.ppl?N(d.ppl):'–'}</td><td>${d.oldest?dur(d.oldest):'–'}</td></tr>`;
  const dHead='<thead><tr><th scope="col">เขต</th><th scope="col">รอช่วย</th><th scope="col">ด่วน</th><th scope="col">กำลังไป</th><th scope="col">ช่วยแล้ว</th><th scope="col">คนที่รอ</th><th scope="col">รอนานสุด</th></tr></thead>';
  const top=R.districts.slice(0,12),rest=R.districts.slice(12);
  const dSum=R.districts.reduce((t,d)=>{['open','urg','going','done','ppl','total'].forEach(k=>t[k]+=d[k]);t.oldest=Math.max(t.oldest,d.oldest);return t},{open:0,urg:0,going:0,done:0,ppl:0,total:0,oldest:0});
  const dFoot=`<tfoot><tr><th scope="row">รวม ${R.districts.length} พื้นที่</th><td>${N(dSum.open)}</td><td class="${dSum.urg?'is-red':''}">${N(dSum.urg)}</td><td>${N(dSum.going)}</td><td>${N(dSum.done)}</td><td>${N(dSum.ppl)}</td><td>${dSum.oldest?dur(dSum.oldest):'–'}</td></tr></tfoot>`;
  const tSum=R.teams.reduce((t,x)=>({going:t.going+x.going,done:t.done+x.done,ppl:t.ppl+x.ppl}),{going:0,done:0,ppl:0});
  const oSum=Object.values(R.orgs).reduce((t,x)=>({going:t.going+x.going,done:t.done+x.done,ppl:t.ppl+x.ppl}),{going:0,done:0,ppl:0});
  const sumFoot=(label,t)=>`<tfoot><tr><th scope="row">${label}</th><td>${N(t.going)}</td><td>${N(t.done)}</td><td>${N(t.ppl)}</td></tr></tfoot>`;
  const orgRows=Object.entries(R.orgs).sort((a,b)=>(b[1].done+b[1].going)-(a[1].done+a[1].going));
  const ps=R.quality.pinSrc;
  el.innerHTML=`<p class="stats-upd">${S.loaded?'ข้อมูล ณ '+new Date(S.loaded).toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})+' น.':'ข้อมูลล่าสุดที่บันทึกไว้'} · ${N(R.total)} เคส · ช่วยแล้ว ${pctTxt(R.rate)}</p>
  <section class="scard" aria-labelledby="st-now"><h2 id="st-now">ตอนนี้</h2>
    <div class="stiles">${tile(open.length,'รอช่วย','',`data-sgo="open"`)}${tile(urgent.length,'ด่วนมาก + วิกฤต','is-red',`data-sgo="danger"`)}${tile(going.length,'กำลังไป','',`data-sgo="going"`)}${tile(done.length,'ช่วยแล้ว','is-green',`data-sgo="done"`)}</div>
    <div class="sprog" role="img" aria-label="สัดส่วนสถานะ รอช่วย ${open.length} กำลังไป ${going.length} ช่วยแล้ว ${done.length}">${[[open.length,'var(--open)'],[going.length,'var(--going)'],[done.length,'var(--ok)']].map(([n,c])=>n?`<i style="flex:${n};background:${c}"></i>`:'').join('')}</div>
    ${line('list','<b>รวมทั้งหมด</b>',`${N(R.total)} เคส · ${pplNote(people.allRaw,people.all)}`,'is-total')}
    ${R.skipped&&R.skipped.length?line('close','ไม่เข้าเกณฑ์ (ปิดโดยไม่ไปช่วย · ไม่นับในตัวเลขอื่น)',N(R.skipped.length)+' เคส','is-skip'):''}
    ${line('users','คนที่ยังรอความช่วยเหลือ',pplNote(people.act,people.actUnique))}
    ${line('alert','คนในเคสด่วนมาก/วิกฤต',N(people.urgent)+' คน',urgent.length?'is-red':'')}
    ${line('check','คนที่ช่วยแล้ว',pplNote(people.done,people.doneUnique))}
    ${R.dupList.length?line('copy','เคสที่น่าจะแจ้งซ้ำ',N(R.dupList.length)+' เคส'):''}</section>
  <section class="scard" aria-labelledby="st-speed"><h2 id="st-speed">ความเร็วในการช่วย</h2>
    ${line('clock','แจ้ง → ทีมรับเคส (ค่ากลาง)',times.pickupN?dur(times.pickupMed)+` <small class="snote">จาก ${N(times.pickupN)} เคส</small>`:'ยังไม่มีข้อมูล')}
    ${line('check','แจ้ง → ช่วยเสร็จ (ค่ากลาง)',times.doneN?dur(times.doneMed)+` <small class="snote">จาก ${N(times.doneN)} เคส</small>`:'-')}
    ${line('check','90% ของเคสช่วยเสร็จภายใน',times.doneN?dur(times.doneP90):'-')}
    ${line('clock','รอช่วยเกิน 6 ชม. / 24 ชม. / 3 วัน',`${N(waits.over6)} / ${N(waits.over24)} / ${N(waits.over72)} เคส`,waits.over24?'is-red':'')}
    ${times.doneEstimated?`<p class="hint">เคสเก่า ${N(times.doneEstimated)} เคสไม่มีเวลาช่วยเสร็จที่บันทึกไว้ ใช้เวลาอัปเดตล่าสุดแทน (ค่าประมาณ) · เคสใหม่บันทึกเวลาจริงอัตโนมัติ</p>`:''}</section>
  <section class="scard" aria-labelledby="st-old"><h2 id="st-old">รอนานที่สุด <small>(ยังไม่มีทีมรับ)</small></h2>
    ${waits.oldestList.length?`<ul class="slist">${waits.oldestList.map(o=>caseLink(o.c,dur(o.wait))).join('')}</ul>`:'<p class="hint">ไม่มีเคสที่รอช่วย</p>'}</section>
  <section class="scard" aria-labelledby="st-today"><h2 id="st-today">วันนี้ <small>(ตั้งแต่ 00:00 น.)</small></h2>
    <div class="spair"><div><b>${N(today.newN)}</b><span>คำขอใหม่</span></div><div><b>${N(today.taken)}</b><span>ทีมรับเคส</span></div><div><b>${N(today.done)}</b><span>ช่วยเสร็จ</span></div><div><b>${N(today.helped)}</b><span>คนที่ได้รับการช่วย</span></div></div>
    <p class="hint">${today.newN>today.done?`เคสค้างเพิ่มขึ้น ${N(today.newN-today.done)} เคสวันนี้`:today.done>today.newN?`เคสค้างลดลง ${N(today.done-today.newN)} เคสวันนี้`:'เคสใหม่เท่ากับเคสที่ช่วยเสร็จวันนี้'}</p>
    <div class="trend" role="img" aria-label="7 วันล่าสุด ${days.map(x=>new Date(x.start).toLocaleDateString('th-TH',{day:'numeric',month:'short',timeZone:'Asia/Bangkok'})+' ขอใหม่ '+x.n+' ช่วยแล้ว '+x.k).join(', ')}">
      ${days.map(x=>{const d=new Date(x.start);return `<div class="tcol"><div class="tbars"><i class="tn" style="height:${x.n/dmax*100}%"><em>${x.n||''}</em></i><i class="tk" style="height:${x.k/dmax*100}%"><em>${x.k||''}</em></i></div><small>${d.toLocaleDateString('th-TH',{weekday:'narrow',timeZone:'Asia/Bangkok'})}<br>${d.toLocaleDateString('th-TH',{day:'numeric',timeZone:'Asia/Bangkok'})}</small></div>`}).join('')}
    </div>
    <div class="tkey"><span><i class="tn"></i>ขอใหม่</span><span><i class="tk"></i>ช่วยแล้ว</span></div></section>
  <section class="scard" aria-labelledby="st-urg"><h2 id="st-urg">ความเร่งด่วน <small>(เคสค้าง · จำนวนเคส และคน)</small></h2>
    ${act.length?statBars(urgRows):'<p class="hint">ไม่มีเคสค้าง</p>'}</section>
  <section class="scard" aria-labelledby="st-area"><h2 id="st-area">รายเขต</h2>
    ${top.length?`<div class="stable-wrap"><table class="stable" id="dist-table">${dHead}<tbody>${top.map(dRow).join('')}${rest.map(d=>dRow(d).replace('<tr>','<tr class="dmore" hidden>')).join('')}</tbody>${dFoot}</table></div>
      ${rest.length?`<button type="button" class="smore-btn" data-dmore>ดูอีก ${rest.length} เขต</button>`:''}`:'<p class="hint">ยังไม่มีเคส</p>'}
    ${R.quality.noArea&&areaBusy?'<p class="hint">กำลังหาเขตจากหมุด…</p>':''}</section>
  <section class="scard" aria-labelledby="st-need"><h2 id="st-need">ต้องการอะไร <small>(เคสค้าง · แตะเพื่อดูในแผนที่)</small></h2>
    ${needRows.length?statBars(needRows,{tap:r=>`data-sneed="${r.key}" aria-label="${r.label} ${r.n} เคส · ดูในแผนที่"`}):'<p class="hint">ยังไม่มีเคส</p>'}
    ${R.otherNeeds.length?`<h3 class="ssub">ของที่ขอในช่อง "อื่น ๆ"</h3><div class="schips">${R.otherNeeds.slice(0,16).map(o=>`<span>${esc(o.label)}${o.n>1?` <b>${o.n}</b>`:''}</span>`).join('')}</div>`:''}</section>
  <section class="scard" aria-labelledby="st-lv"><h2 id="st-lv">ระดับน้ำ <small>(เคสค้าง)</small></h2>${lvRows.length?statBars(lvRows):'<p class="hint">ยังไม่มีข้อมูล</p>'}</section>
  <section class="scard" aria-labelledby="st-team"><h2 id="st-team">ทีมอาสา</h2>
    ${R.teams.length?`<div class="stable-wrap"><table class="stable"><thead><tr><th scope="col">ทีม</th><th scope="col">กำลังไป</th><th scope="col">ช่วยแล้ว</th><th scope="col">คนที่ช่วย</th></tr></thead><tbody>
      ${R.teams.slice(0,15).map(t=>`<tr><th scope="row">${esc(t.name)}${t.variants>1?` <small class="snote">(รวม ${t.variants} แบบที่พิมพ์)</small>`:''}</th><td>${t.going||'–'}</td><td>${t.done||'–'}</td><td>${t.ppl?N(t.ppl):'–'}</td></tr>`).join('')}</tbody>${R.teams.length>1?sumFoot('รวม '+R.teams.length+' ทีม',tSum):''}</table></div>`:'<p class="hint">ยังไม่มีทีมรับเคส</p>'}
    ${orgRows.length?`<h3 class="ssub">หน่วยงาน</h3><div class="stable-wrap"><table class="stable"><thead><tr><th scope="col">หน่วยงาน</th><th scope="col">กำลังไป</th><th scope="col">ช่วยแล้ว</th><th scope="col">คนที่ช่วย</th></tr></thead><tbody>${orgRows.map(([k,o])=>`<tr><th scope="row">${esc(k)}</th><td>${o.going||'–'}</td><td>${o.done||'–'}</td><td>${o.ppl?N(o.ppl):'–'}</td></tr>`).join('')}</tbody>${orgRows.length>1?sumFoot('รวม '+orgRows.length+' หน่วยงาน',oSum):''}</table></div>`:''}</section>
  <section class="scard" aria-labelledby="st-gap"><h2 id="st-gap">คุณภาพข้อมูล <small>(เคสค้าง)</small></h2>
    ${line('pin','ไม่ได้ปักหมุด',N(R.quality.noPin)+' เคส')}${line('wave','ไม่ระบุระดับน้ำ',N(R.quality.noLevel)+' เคส')}${line('map','ไม่ทราบเขต',N(R.quality.noArea)+' เคส')}${line('phone','เบอร์โทรไม่ครบ',N(R.quality.noPhone)+' เคส')}${line('image','มีรูปแนบ',N(R.quality.photos)+' เคส')}
    <p class="hint">ที่มาของหมุด: GPS ${N(ps.gps)} · ปักเอง ${N(ps.manual)} · จากลิงก์ ${N(ps.link)} · จากที่อยู่ (โดยประมาณ) ${N(ps.addr)} · เคสเก่าไม่ระบุ ${N(ps.old)} · ไม่มีหมุด ${N(ps.none)}</p>
    ${R.dupList.length?`<h3 class="ssub">เคสที่น่าจะแจ้งซ้ำ <small>(เบอร์เดียวกัน ตำแหน่งใกล้กัน ภายใน 48 ชม.)</small></h3><ul class="slist">${R.dupList.slice(0,10).map(d=>{const c=all.find(x=>x.id===d.id);return c?caseLink(c,'ซ้ำกับ #'+esc(d.of)):''}).join('')}</ul>`:''}
    ${R.tests.length?`<h3 class="ssub">เคสทดสอบ (ไม่นับในสรุป)</h3><ul class="slist">${R.tests.slice(0,10).map(c=>caseLink(c,STATUS_TH[c.status]||'')).join('')}</ul>`:''}</section>
  <details class="sdef"><summary>วิธีนับตัวเลข</summary><ul>
    <li><b>วันนี้</b> นับตั้งแต่ 00:00 น. เวลาประเทศไทย</li>
    <li><b>เคสค้าง</b> = รอช่วย + กำลังไป</li>
    <li><b>จำนวนคน</b> นับกลุ่มที่น่าจะแจ้งซ้ำครั้งเดียว (ใช้จำนวนคนมากที่สุดในกลุ่ม) · ตัวเลข "รวมซ้ำ" คือรวมทุกเคสตามที่แจ้ง</li>
    <li><b>เคสที่น่าจะแจ้งซ้ำ</b> = เบอร์เดียวกัน แจ้งห่างกันไม่เกิน 48 ชม. และหมุดห่างกันไม่เกิน 150 ม. (ถ้าไม่มีหมุด: ขอของเหมือนกัน และจำนวนคนเท่ากันเมื่อมีหมุดฝั่งเดียว) · ยังนับเป็นเคสตามปกติ</li>
    <li><b>เคสทดสอบ</b> (มีคำว่า test / ทดสอบ / เทส) ไม่นับในตัวเลขใด ๆ และไม่แสดงให้คนทั่วไปเห็น</li>
    <li><b>เวลารับเคส / ช่วยเสร็จ</b> บันทึกอัตโนมัติเมื่อทีมเปลี่ยนสถานะในแอป · ถ้าเปลี่ยนในชีตโดยตรง หรือเป็นเคสเก่า ใช้เวลาอัปเดตล่าสุดแทน</li>
    <li><b>ค่ากลาง</b> = เคสครึ่งหนึ่งเร็วกว่านี้ อีกครึ่งช้ากว่า (ไม่ถูกดึงด้วยเคสที่ช้าผิดปกติแบบค่าเฉลี่ย)</li></ul></details>`;
  if(!soft)fillAreas();
}
$('#stats').addEventListener('click',e=>{const dm=e.target.closest('[data-dmore]');if(dm){const rows=$$('#dist-table .dmore'),show=rows[0]&&rows[0].hidden;rows.forEach(r=>r.hidden=!show);dm.textContent=show?'ย่อรายการเขต':'ดูอีก '+rows.length+' เขต';return}const o=e.target.closest('[data-sopen]');if(o){openCase(o.dataset.sopen);return}const g=e.target.closest('[data-sgo]'),n=e.target.closest('[data-sneed]');if(!g&&!n)return;
  FL.q='';$('#case-search').value='';FL.people=[];FL.level=[];
  if(g){FL.status=g.dataset.sgo;FL.types=[]}else{FL.status='active';FL.types=[n.dataset.sneed]}
  saveFL();renderFilters();applyFilters();go('map');setSheet(true)});
try{localStorage.removeItem('uh_no_track')}catch(e){}
const startView=(location.hash||'#home').slice(1);
go(['home','map','emergency','stats'].includes(startView)?startView:'home',false);
history.replaceState({view:S.view},'','#'+S.view);
renderAll();loadCases();flushQueue();trackMine();
$$('.view').forEach(v=>v.hidden=!v.classList.contains('active'));setTimeout(()=>{A11Y.ready=true},0);
/* ลดภาระหลังบ้าน: ทีมอาสาโหลดทุก 30 วิ · คนทั่วไปเห็นแค่คำขอตัวเอง → โหลดทุก 2 นาที และเฉพาะเมื่อมีคำขอของตัวเอง */
let lastPubLoad=0;
setInterval(()=>{if(document.hidden)return;if(S.volunteer)return loadCases();if(!myReqs().length||Date.now()-lastPubLoad<120000)return;lastPubLoad=Date.now();loadCases()},REFRESH_MS);
setInterval(()=>{if(!document.hidden)trackMine()},REFRESH_MS*4);



/* อัปเดตแอปอัตโนมัติ: เทียบ version.json กับเวอร์ชันที่โหลดอยู่ · เจอเวอร์ชันใหม่ → โหลดหน้าใหม่ (ยกเว้นกำลังกรอกฟอร์ม จะรอให้ออกจากฟอร์มก่อน) */
const APP_V='218';let appNewer=false;
let appRemoteV='';
async function checkAppVersion(){try{const r=await fetch('./version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json());if(r&&r.v&&String(r.v)!==APP_V){appNewer=true;appRemoteV=String(r.v)}}catch(e){}
  /* กันโหลดซ้ำวนไม่จบ: โหลดใหม่ได้ครั้งเดียวต่อเวอร์ชัน */
  let tried='';try{tried=sessionStorage.getItem('uh_reload_v')||''}catch(e){}
  if(appNewer&&tried!==appRemoteV&&S.view!=='form'&&S.view!=='sent'){try{sessionStorage.setItem('uh_reload_v',appRemoteV)}catch(e){}try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();reg&&await reg.update()}catch(e){}location.reload()}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkAppVersion()});
setInterval(()=>{if(!document.hidden)checkAppVersion()},5*60e3);
setTimeout(checkAppVersion,3000);

/* โดเมนเก่า (*.pages.dev) ปิดใช้แล้ว → พาไป helpme4u.com
 * ก่อนย้าย: ส่งคำขอที่ค้างในเครื่องให้เสร็จก่อน (ข้อมูลในเบราว์เซอร์แยกตามโดเมน ย้ายตามไปไม่ได้) แล้วส่งรายการ "คำขอของฉัน" ไปด้วย */
const NEW_HOME='https://helpme4u.com/';
(function(){if(!/\.pages\.dev$/.test(location.hostname))return;
  const ov=document.createElement('div');ov.className='moved';ov.setAttribute('role','alertdialog');ov.setAttribute('aria-live','polite');
  ov.innerHTML='<div class="moved-card"><img src="./assets/helpme-logo.png" alt="Help Me ช่วยด้วย" width="180"><h1>ย้ายไปที่ helpme4u.com แล้ว</h1><p id="moved-msg">กำลังพาไปที่เว็บใหม่…</p><a class="btn btn-blue" id="moved-go" href="'+NEW_HOME+'">ไปที่ helpme4u.com</a><p class="moved-sub">ถ้าอันตรายถึงชีวิต โทร 1669 หรือ 191 ทันที</p></div>';
  document.body.append(ov);
  const go2=()=>{let my=[];try{my=(store.json('uh_my_cases',[])||[]).map(m=>({id:m.id,token:m.token,clientId:m.clientId,at:m.at,needs:m.needs,urgency:m.urgency}))}catch(e){}
    const data={my,team:store.get('uh_team',''),org:store.get('uh_org','')};
    let url=NEW_HOME;if(my.length||data.team){try{url+='#mig='+btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}catch(e){}}
    location.replace(url)};
  $('#moved-go').addEventListener('click',e=>{e.preventDefault();go2()});
  const start=Date.now();
  const tick=async()=>{if(!queue().length)return go2();
    $('#moved-msg').textContent='กำลังส่งคำขอที่ค้างอยู่ในเครื่องนี้ให้ทีมอาสา (มี '+queue().length+' รายการ) กรุณาอย่าเพิ่งปิดหน้านี้…';
    try{await flushQueue()}catch(e){}
    if(!queue().length)return go2();
    if(Date.now()-start>180000){$('#moved-msg').textContent='ยังส่งคำขอที่ค้างไม่สำเร็จ · เปิดหน้านี้ค้างไว้ ระบบจะลองส่งต่อ หรือกดปุ่มด้านล่างแล้วส่งคำขอใหม่ที่เว็บใหม่'}
    setTimeout(tick,8000)};
  setTimeout(tick,600)})();
