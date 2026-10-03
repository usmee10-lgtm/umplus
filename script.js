/* Help Me ช่วยด้วย — แอปหลัก */
const API_URL='https://script.google.com/macros/s/AKfycbyWeVDhToFJntjTGHprDEByEfRFdSbOidlR7QhJ6xG1bz7co2gCRkTGIoKDI9tJqGkWTw/exec';
const REFRESH_MS=30000,QUEUE_MS=20000;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set(k,v){try{v==null||v===''?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}},
  json(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
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
(function(){const g=document.getElementById('level-chips');if(!g)return;g.innerHTML=Object.keys(LEVEL_TH).map(k=>`<label style="--lv:${LEVEL_COLOR[k]}"><input type="radio" name="level" value="${k}"><span>${levelSvg(k)}<b>${LEVEL_TH[k]}</b><small>${LEVEL_CM[k]}</small></span></label>`).join('')})();
const STATUS_TH={open:'รอช่วย',going:'กำลังไป',done:'ช่วยแล้ว'};
function iconify(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{if(el.dataset.iconDone)return;el.insertAdjacentHTML('afterbegin',ic(el.dataset.icon));el.dataset.iconDone='1'})}
function toast(msg,opt={}){const t=document.createElement('div');t.className='toast'+(opt.ok?' ok':'');t.setAttribute('role','status');
  t.innerHTML=ic(opt.icon||(opt.ok?'check':'info'))+'<span></span>';t.querySelector('span').textContent=msg;
  if(opt.action){const b=document.createElement('button');b.type='button';b.textContent=opt.action;b.onclick=()=>{opt.onAction&&opt.onAction();t.remove()};t.append(b)}
  $('#toasts').append(t);const kill=()=>{if(t.contains(document.activeElement)||t.matches(':hover'))setTimeout(kill,2000);else t.remove()};setTimeout(kill,opt.ms||(opt.action?10000:5000))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function ago(ts){const t=Number(ts)||Date.parse(ts);if(!t)return '';const m=Math.round((Date.now()-t)/60000);if(m<1)return 'เมื่อสักครู่';if(m<60)return m+' นาทีที่แล้ว';const h=Math.round(m/60);if(h<24)return h+' ชั่วโมงที่แล้ว';return new Date(t).toLocaleDateString('th-TH',{day:'numeric',month:'short'})+' '+new Date(t).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}
const hasPin=c=>c&&c.lat!==''&&c.lat!=null&&c.lng!==''&&c.lng!=null&&!isNaN(+c.lat)&&!isNaN(+c.lng);
const isDanger=c=>Number(c.urgency)>=3&&c.status!=='done';  /* ด่วนมาก + วิกฤต */
const pinKind=c=>c.status==='done'?'done':c.status==='going'?'going':isDanger(c)?'danger':'open';
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
  drawPins('home');drawPins('map');renderList();$('#all-count').textContent=S.loaded&&S.volunteer?S.cases.length+' เคส':'';renderMyReq();renderVol();
  if(S.view==='detail'&&S.detailId)renderDetail(false);
  const stTab=$('.tabbar [data-go=stats]');if(stTab)stTab.style.display=S.volunteer?'':'none';
  if(S.view==='stats'){if(S.volunteer)renderStats();else go('home')}
  if(typeof tripRefresh==='function')tripRefresh();
  if(typeof drawHelped==='function'&&store.get('uh_lay_teams','')&&S.outreach)drawHelped();
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
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){e.preventDefault();go(b.dataset.go)}});

/* ---------- แผนที่หลัก ---------- */
const PIN_LAYER={};
async function ensureMap(which){
  if(S.maps[which]){S.maps[which].invalidateSize();return S.maps[which]}
  const el=$(which==='home'?'#home-map':'#cases-map');
  try{await loadLeaflet()}catch(e){el.innerHTML='<p class="empty">โหลดแผนที่ไม่สำเร็จ · ตรวจอินเทอร์เน็ต</p>';return null}
  if(S.maps[which])return S.maps[which];
  const m=makeMap(el,{zoom:11});S.maps[which]=m;PIN_LAYER[which]=L.layerGroup().addTo(m);
  m.on('baselayerchange',()=>{});
  drawPins(which);if(store.get('uh_lay_flood','1')!=='0')toggleFlood(true);if(store.get('uh_lay_teams',''))toggleTeams(true);if(store.get('uh_lay_cctv',''))toggleCctv(true);
  if(which==='map'&&typeof drawTrip==='function')drawTrip();
  return m;
}
let fitted={};
function drawPins(which){
  const m=S.maps[which],lg=PIN_LAYER[which];if(!m||!lg)return;
  if(m._popup&&m.hasLayer(m._popup)){m._pinsStale=true;if(!m._pinsHook){m._pinsHook=1;m.on('popupclose',()=>{if(m._pinsStale){m._pinsStale=false;setTimeout(()=>drawPins(which),0)}})}return}  /* อาสากำลังอ่าน popup อยู่ → ค่อยวาดใหม่ตอนปิด */
  lg.clearLayers();
  const list=which==='home'?S.cases.filter(c=>c.status!=='done'):filteredCases();
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
  return `<div class="pop">${c.status!=='done'?urgChip(c)+' ':''}${statusChip(c)}<br><b>${esc((c.needs||[]).join(', ')||'ขอความช่วยเหลือ')}</b> · ${esc(c.people||1)} คน`+
    (c.level?`<br>ระดับน้ำ: ${esc(LEVEL_TH[c.level]||c.level)}`:'')+(addr?`<br>${esc(addr)}`:'')+(S.volunteer?'':'<br><small>ตำแหน่งโดยประมาณ</small>')+
    (S.volunteer&&(c.name||c.phone)?`<br>${c.name?esc(c.name)+' ':''}${c.phone?(S.volunteer&&tel.length>=9?`<a href="tel:${esc(tel)}">${esc(c.phone)}</a>`:esc(c.phone)):''}`:'')+
    `<div class="pop-act"><a href="#" data-open="${esc(c.id)}">ดูรายละเอียด</a>`+
    (S.volunteer&&c.status!=='done'&&hasPin(c)?` · <a href="#" data-trip="${esc(c.id)}">${typeof tripIndex==='function'&&tripIndex(c.id)>=0?'อยู่ในแผนแล้ว':'+ แผนเดินทาง'}</a>`:'')+`</div></div>`;
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
      layListTo(which==='map'?menu:null);
      const first=menu.querySelector('[aria-pressed=true]')||menu.querySelector('button');if(first)first.focus();}
    else locateMe(which,f);return}
  const bb=e.target.closest('#layer-menu [data-base]');
  if(bb){Object.values(S.maps).forEach(m=>m&&m.setBase(bb.dataset.base));if(S.formMap)S.formMap.setBase(bb.dataset.base);closeLayerMenu(true);toast('แผนที่แบบ'+bb.textContent.trim());return}
  if(!e.target.closest('#layer-menu')&&!$('#layer-menu').hidden)closeLayerMenu(false);
});
let layerBtn=null;
/* รายการชั้นข้อมูลอยู่ในกล่องสีน้ำเงินหน้าแรก · ถ้าเปิดเมนูจากหน้าแผนที่ ยกรายการเดียวกันไปแสดงในเมนูลอยชั่วคราว */
function layListTo(menu){const l=$('#lay-list');if(!l)return;if(menu){if(l.parentNode!==menu)menu.append(l);l.classList.add('in-menu')}else{const c=$('#lay-card');if(l.parentNode!==c)c.append(l);l.classList.remove('in-menu')}}
var LAY_NAMES={'lay-flood':'น้ำท่วม','lay-teams':'ทีมช่วยเหลือ','lay-cctv':'CCTV'};
function layCount(){const on=Object.keys(LAY_NAMES).filter(id=>$('#'+id)&&$('#'+id).checked);const s=$('#lay-sum-s');if(s)s.textContent=on.length?'เปิดอยู่: '+on.map(id=>LAY_NAMES[id]).join(' · '):'ยังไม่ได้เปิดชั้นข้อมูล';const c=$('#lay-card');if(c)c.classList.toggle('has-on',on.length>0)}
(function(){const c=$('#lay-card');if(!c)return;if(store.get('uh_lay_open','')==='1')c.open=true;c.addEventListener('toggle',()=>store.set('uh_lay_open',c.open?'1':''));$$('#lay-list .sw-in').forEach(i=>i.addEventListener('change',layCount));layCount()})();
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
async function toggleFlood(on){store.set('uh_lay_flood',on?'1':'0');$('#lay-flood').checked=on;layCount&&layCount();const gen=++floodGen;
  Object.values(S.maps).forEach(m=>{if(m&&m._flood){m._flood.remove();m._flood=null}});if(!on)return;
  try{if(!S.flood){S.floodP=S.floodP||fetch('https://www.floodboard.org/api/export/roads.geojson').then(r=>r.json()).then(j=>{j.features=(j.features||[]).filter(f=>{const p=f.properties||{};return !p.cleared&&FLOOD_COL[floodV(p)]});return j}).finally(()=>{S.floodP=null});S.flood=await S.floodP}
    if(gen!==floodGen)return;  /* มีการเรียกใหม่กว่าแล้ว */
    Object.values(S.maps).forEach(m=>{if(!m)return;if(m._flood)m._flood.remove();m._flood=L.geoJSON(S.flood,{interactive:false,attribution:'ข้อมูลน้ำท่วม © <a href="https://www.floodboard.org/about" target="_blank" rel="noopener">Floodboard</a>',style:f=>({color:FLOOD_COL[floodV(f.properties)],weight:5,opacity:.85,lineCap:'round'}),pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:4,color:FLOOD_COL[floodV(f.properties)],weight:2})}).addTo(m)});
  }catch(e){toast('โหลดข้อมูลน้ำท่วมไม่สำเร็จ')}}
$('#lay-flood').addEventListener('change',e=>toggleFlood(e.target.checked));
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
  if(!store.get('uh_lay_teams',''))return;const hs=helpedList();if(!hs.length)return;
  m._helped=L.layerGroup(hs.flatMap(h=>{const o=orgOf(h.org);
    return [L.circle([h.lat,h.lng],{radius:350,color:o.color,weight:1,opacity:.35,fillColor:o.color,fillOpacity:.13,interactive:false}),
      L.marker([h.lat,h.lng],{icon:L.divIcon({className:'org-pin',html:o.logo?`<img src="${esc(o.logo)}" alt="">`:`<span style="background:${o.color}">${esc(o.short)}</span>`,iconSize:[44,20],iconAnchor:[22,10]}),opacity:.88,zIndexOffset:-200,title:o.name+' · '+h.title}).bindPopup(()=>helpedPopup(h))]})).addTo(m)})}
async function toggleTeams(on){store.set('uh_lay_teams',on?'1':'');$('#lay-teams').checked=on;layCount&&layCount();const gen=++teamsGen;
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
    const net=S.network.map(n=>L.marker([n.lat,n.lng],{icon:L.divIcon({className:'net-pin',html:'<span>'+ic(NET_STYLE[n.type]||'pin')+'</span>',iconSize:[30,30],iconAnchor:[15,15]}),title:n.type+' · '+n.name,zIndexOffset:1600}).bindPopup(()=>netPopup(n)));
    m._teams=L.layerGroup([...net,...team]).addTo(m)});
  if(!S.teams.length&&!S.network.length&&!helpedList().length)toast('ยังไม่มีทีม จุดเครือข่าย หรือจุดที่ไปช่วยแล้ว');
  else if(S.volunteer&&nr&&nr.noLocation)toast(`มี ${nr.noLocation} จุดในแท็บ "เครือข่าย" ที่ยังอ่านพิกัดไม่ได้ · วางพิกัดแบบ 13.75, 100.6 หรือลิงก์ Google Maps แบบเต็ม`,{ms:9000})}
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
async function toggleCctv(on){store.set('uh_lay_cctv',on?'1':'');$('#lay-cctv').checked=on;layCount&&layCount();const gen=++cctvGen;
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
$('#lay-cctv').addEventListener('change',e=>toggleCctv(e.target.checked));
$('#lay-teams').addEventListener('change',e=>toggleTeams(e.target.checked));

/* ---------- หน้าแรก ---------- */
$('#type-grid').innerHTML=NEED_TYPES.map(t=>`<button type="button" class="type-btn" data-type="${t.key}">${ic(t.icon)}<span>${t.label}</span></button>`).join('');
$('#type-grid').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(b)startForm({type:b.dataset.type,gps:true})});
$('#btn-use-gps').addEventListener('click',()=>startForm({gps:true}));
$('#btn-all-cases').addEventListener('click',()=>{FL.status='all';FL.types=[];FL.people=[];FL.level=[];FL.q='';$('#case-search').value='';saveFL();renderFilters();go('map');setSheet(true);applyFilters()});
$('#btn-help').addEventListener('click',()=>{go('map');setSheet(true);if(!S.volunteer){$('#vol-panel').hidden=false;renderVol(true)}});
let searchFrom=null;
const openSearch=e=>{searchFrom=(e&&e.currentTarget)||document.activeElement;$('#search-overlay').hidden=false;$$('.view.active,.tabbar').forEach(x=>x.inert=true);
  $('#search-input').value='';$('#search-list').hidden=true;$('#search-status').textContent='';setTimeout(()=>$('#search-input').focus(),50)};
function closeSearch(refocus=true){const o=$('#search-overlay');if(o.hidden)return;o.hidden=true;$$('.view,.tabbar').forEach(x=>x.inert=false);if(refocus&&searchFrom&&document.contains(searchFrom))searchFrom.focus()}
$('#search-card').addEventListener('click',openSearch);$('#home-search-btn').addEventListener('click',openSearch);
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
  q.forEach(x=>list.append(reqRow(x.data,'<span class="st st-queue">รอส่ง · ไม่มีสัญญาณ</span>',null)));
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
      try{const r=await apiPost({action:'create',clientId:item.clientId,...item.data},(item.data.photos||[]).length?60000:20000);
        if(r&&r.ok){saveQueue(queue().filter(x=>x.clientId!==item.clientId));saveMy([...myReqs(),{id:r.id,token:r.token,clientId:item.clientId,urgency:r.urgency,needs:item.data.needs,address:item.data.address,at:Date.now()}]);toast('ส่งคำขอที่ค้างไว้แล้ว #'+r.id,{ok:true})}
        else{const tries=(item.tries||0)+1;  /* เซิร์ฟเวอร์ไม่รับ: ลองใหม่ไม่เกิน 5 ครั้ง แล้วแจ้งผู้ใช้ */
          if(r&&r.error==='missing'||tries>=5){saveQueue(queue().filter(x=>x.clientId!==item.clientId));toast('คำขอที่ค้างไว้ส่งไม่สำเร็จ กรุณาส่งใหม่')}
          else saveQueue(queue().map(x=>x.clientId===item.clientId?{...x,tries}:x))}
      }catch(e){break}}
  }finally{flushing=false;renderMyReq();loadCases()}
}
addEventListener('online',()=>{netbar();flushQueue();loadCases()});addEventListener('offline',netbar);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){flushQueue();loadCases()}});
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
  add.hidden=F.photos.length>=PHOTO_MAX}
$('#photo-in').addEventListener('change',async e=>{const files=[...e.target.files].filter(f=>/^image\//.test(f.type)||/\.(heic|heif|jpe?g|png|webp)$/i.test(f.name));e.target.value='';
  const room=PHOTO_MAX-F.photos.length;if(files.length>room)toast(`แนบได้อีก ${room} รูป`);
  for(const f of files.slice(0,room)){try{F.photos.push(await shrinkPhoto(f));renderPhotos()}catch(err){toast('เปิดรูปนี้ไม่ได้ ลองรูปอื่น')}}});
function startForm(opt={}){
  resetForm();if(opt.type){F.needs.add(opt.type);$(`[data-need="${opt.type}"]`).setAttribute('aria-pressed','true')}
  go('form');syncOther(opt.type==='other');
  if(opt.loc){$('#addr-input').value=opt.loc.label||opt.loc.title;F.addrDirty=true;setPin(opt.loc.lat,opt.loc.lng,true,false)}
  if(opt.gps)useGPS();
}
function resetForm(){
  F.needs.clear();F.photos=[];if($('#photo-row'))renderPhotos();F.lat=F.lng=null;F.addrDirty=false;F.people=1;F.step=1;F.clientId=uid();F.sending=false;F.done=false;F.pinSeq=(F.pinSeq||0)+1;
  $$('#need-grid [data-need]').forEach(b=>b.setAttribute('aria-pressed','false'));$('#other-box').hidden=true;$('#other-in').value='';$('#err-other').hidden=true;
  ['#addr-input','#phone-in','#name-in','#details-in','#ma-street','#ma-no','#ma-dist','#ma-mark'].forEach(s=>$(s).value='');MA.sub='';MA.picked=null;$('#ma-preview').hidden=true;$('#manual-addr').open=false;
  $('#ppl-out').textContent='1';$$('input[name=level]').forEach(i=>i.checked=false);
  $('#addr-status').textContent='';$('#pin-status').textContent='แตะแผนที่เพื่อปักหมุด หรือลากหมุดให้ตรง';
  if(F.marker){F.marker.remove();F.marker=null}
  ['needs','loc','phone'].forEach(markOk);showStep(1);
  const last=store.get('uh_phone','');if(last)$('#phone-in').value=last;
}
async function ensureFormMap(){
  if(S.formMap){setTimeout(()=>S.formMap.invalidateSize(),60);return S.formMap}
  try{await loadLeaflet()}catch(e){$('#form-map').innerHTML='<p class="empty">โหลดแผนที่ไม่ได้ · ค้นหาที่อยู่ หรือกด "กรอกที่อยู่เอง" ได้</p>';return null}
  if(S.formMap)return S.formMap;
  S.formMap=makeMap($('#form-map'),{zoom:12});
  S.formMap.on('click',e=>setPin(e.latlng.lat,e.latlng.lng,false,true));
  if(F.lat!=null)setPin(F.lat,F.lng,true,false);
  return S.formMap;
}
async function setPin(lat,lng,pan=true,reverse=true){
  F.pinSeq=(F.pinSeq||0)+1;F.lat=+lat;F.lng=+lng;markOk('loc');
  $('#pin-status').textContent='ปักหมุดแล้ว · ลากหมุดเพื่อปรับให้ตรง';
  const m=await ensureFormMap();
  if(m){if(F.marker)F.marker.setLatLng([F.lat,F.lng]);else{F.marker=L.marker([F.lat,F.lng],{draggable:true,title:'หมุดตำแหน่งของคุณ · ลากเพื่อปรับ',icon:L.divIcon({className:'form-pin',html:'<span></span>',iconSize:[34,40],iconAnchor:[17,40]})}).addTo(m);
      F.marker.on('dragend',()=>{const p=F.marker.getLatLng();setPin(p.lat,p.lng,false,true)})}
    if(pan)m.setView([F.lat,F.lng],Math.max(m.getZoom(),16))}
  if(reverse&&!F.addrDirty){const t=await geoReverse(F.lat,F.lng);if(t&&!F.addrDirty){$('#addr-input').value=t;$('#addr-status').textContent='เติมที่อยู่จากหมุดให้แล้ว · แก้ได้'}}
}
async function useGPS(){
  const st=$('#addr-status');st.textContent='กำลังหาตำแหน่ง…';
  const seq=F.pinSeq;
  try{const p=await getGPS();if(F.pinSeq!==seq){st.textContent=st.textContent==='กำลังหาตำแหน่ง…'?'':st.textContent;return}  /* ผู้ใช้เลือกที่อยู่/ปักหมุดเองระหว่างรอ GPS → ไม่ทับ */
    await setPin(p.lat,p.lng,true,true);st.textContent=F.addrDirty?'พบตำแหน่งแล้ว':st.textContent||'พบตำแหน่งแล้ว'}
  catch(e){st.textContent=e.code===1?'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง · ค้นหาที่อยู่หรือแตะแผนที่แทน':'หาตำแหน่งไม่สำเร็จ · ค้นหาที่อยู่หรือแตะแผนที่แทน'}
}
$('#form-gps').addEventListener('click',useGPS);
$('#addr-input').addEventListener('input',()=>{F.addrDirty=!!$('#addr-input').value.trim();if(F.addrDirty)markOk('loc')});
geoAttach($('#addr-input'),$('#addr-list'),it=>{$('#addr-input').value=it.label||it.title;F.addrDirty=true;setPin(it.lat,it.lng,true,false);$('#addr-status').textContent='ปักหมุดตามที่อยู่แล้ว · ลากหมุดปรับได้'},{status:$('#addr-status'),
  onFree:(text,best)=>{$('#addr-input').value=text;F.addrDirty=true;markOk('loc');
    if(best&&F.lat==null){setPin(best.lat,best.lng,true,false);$('#addr-status').textContent='ใช้ที่อยู่ตามที่พิมพ์ · ปักหมุดโดยประมาณที่ '+best.title+' ลากให้ตรงบ้าน';$('#pin-status').textContent='หมุดโดยประมาณ · ลากให้ตรงบ้าน'}
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
  setPin(it.lat,it.lng,true,false);$('#ma-tip').textContent='ปักหมุดที่ '+street+' แล้ว · ลากหมุดให้ตรงบ้าน';
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
    if(hit&&F.lat==null){await setPin(hit.lat,hit.lng,true,false);if(S.formMap&&(lvl==='เขต'||lvl==='แขวง'))S.formMap.setZoom(14);
      st.textContent=`ปักหมุดโดยประมาณ (ระดับ${lvl}) · ลากหมุดให้ตรงบ้าน`;$('#pin-status').textContent='หมุดโดยประมาณ · ลากให้ตรงบ้าน'}
    else if(F.lat==null)st.textContent='ใช้ที่อยู่นี้แล้ว · แตะแผนที่เพื่อปักหมุดได้ (ไม่บังคับ)'}
  catch(e){st.textContent='ใช้ที่อยู่นี้แล้ว · แตะแผนที่เพื่อปักหมุดได้ (ไม่บังคับ)'}
});
$('#ppl-minus').addEventListener('click',()=>{F.people=Math.max(1,F.people-1);$('#ppl-out').textContent=F.people});
$('#ppl-plus').addEventListener('click',()=>{F.people=Math.min(999,F.people+1);$('#ppl-out').textContent=F.people});
$('#phone-in').addEventListener('input',()=>markOk('phone'));
const FIELD={needs:'#need-grid',loc:'#addr-input',phone:'#phone-in'};
function markOk(k){const sec={needs:'#sec-needs',loc:'#sec-loc',phone:'#sec-phone'}[k];$(sec).classList.remove('invalid');$('#err-'+k).hidden=true;$(FIELD[k]).removeAttribute('aria-invalid')}
function markBad(k){const sec={needs:'#sec-needs',loc:'#sec-loc',phone:'#sec-phone'}[k];$(sec).classList.add('invalid');$('#err-'+k).hidden=false;$(FIELD[k]).setAttribute('aria-invalid','true')}
function phoneOk(v){let d=String(v||'').replace(/\D/g,'');if(d.startsWith('66'))d='0'+d.slice(2);return /^0\d{8,9}$/.test(d)}
function validate(){const bad=[];
  if(!F.needs.size)bad.push('needs');
  else if(F.needs.has('other')&&!$('#other-in').value.trim()){bad.push('needs');$('#err-other').hidden=false}
  if(!$('#addr-input').value.trim()&&F.lat==null)bad.push('loc');
  if(!phoneOk($('#phone-in').value))bad.push('phone');
  bad.forEach(markBad);if(F.needs.size)$('#err-needs').hidden=true;
  if(bad.length){const sec={needs:'#sec-needs',loc:'#sec-loc',phone:'#sec-phone'}[bad[0]];$(sec).scrollIntoView({behavior:'smooth',block:'center'});const inp=bad[0]==='needs'&&!$('#other-box').hidden?$('#other-in'):$(sec).querySelector('input');if(inp&&(bad[0]!=='needs'||inp.id==='other-in'))setTimeout(()=>inp.focus({preventScroll:true}),400)}
  return !bad.length}
function formData(){
  const other=$('#other-in').value.trim().replace(/\s+/g,' ');
  return {needs:[...F.needs].map(k=>k==='other'&&other?'อื่น ๆ: '+other:NEED_TYPES.find(t=>t.key===k).value),urgencyLabel:'รอได้',
    people:F.people,level:($('input[name=level]:checked')||{}).value||'',address:$('#addr-input').value.trim(),
    lat:F.lat!=null?+F.lat.toFixed(6):'',lng:F.lng!=null?+F.lng.toFixed(6):'',phone:$('#phone-in').value.trim(),name:$('#name-in').value.trim(),
    details:$('#details-in').value.trim(),website:$('.hp').value,photos:F.photos.slice(0,PHOTO_MAX)}}
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
  const d=formData(),clientId=F.clientId||(F.clientId=uid()),btn=$('#form-next');F.sending=true;btn.disabled=true;btn.textContent='กำลังส่ง…';store.set('uh_phone',d.phone);
  const done=()=>{F.sending=false;F.done=true};
  const queueIt=()=>{if(!queue().some(x=>x.clientId===clientId))saveQueue([...queue(),{clientId,data:d,at:Date.now(),tries:0}]);done();sentScreen(null,true)};
  if(!navigator.onLine){queueIt();return}
  let r;
  try{r=await apiPost({action:'create',clientId,...d},d.photos&&d.photos.length?60000:20000)}catch(err){queueIt();return}  /* เน็ตหลุด/หมดเวลา → เก็บไว้ส่งทีหลัง */
  if(r&&r.ok){saveMy([...myReqs(),{id:r.id,token:r.token,clientId,urgency:r.urgency,needs:d.needs,address:d.address,at:Date.now()}]);done();sentScreen(r.id,false);loadCases();return}
  F.sending=false;btn.disabled=false;btn.textContent='ส่งคำขอ';
  if(r&&r.error==='missing'){showStep(1);validate();return}
  /* เซิร์ฟเวอร์ตอบว่าไม่รับ (ไม่ใช่ปัญหาสัญญาณ) → บอกผู้ใช้ ไม่เข้าคิว */
  toast(r&&r.error==='rate'?'ส่งถี่เกินไป รอสักครู่แล้วลองใหม่':'ส่งไม่สำเร็จ ลองอีกครั้ง หรือโทรสายด่วน 1669 / 199');
});
function sentScreen(id,queued){
  $('#sent-title').textContent=queued?'บันทึกคำขอไว้แล้ว':'ส่งคำขอแล้ว';
  $('#sent-text').textContent=queued?'ตอนนี้ส่งไม่ได้ (สัญญาณไม่ดี) ระบบจะส่งให้เองเมื่อออนไลน์ ดูสถานะได้ที่หน้าแรก':'ทีมอาสาเห็นคำขอของคุณแล้ว ติดตามสถานะได้ที่หน้าแรก';
  $('#sent-id').textContent=id?'เลขคำขอ #'+id:'';renderMyReq();go('sent');
}
$('#form-back').addEventListener('click',()=>{if(F.sending)return;if(F.step===2)showStep(1);else go('home')});

/* ---------- แผนที่/รายการ ---------- */
const FL=Object.assign({status:'active',types:[],people:[],level:[],q:'',sort:'new',age:''},store.json('uh_filters2',{}),{q:''});
const saveFL=()=>store.put('uh_filters2',{status:FL.status,types:FL.types,people:FL.people,level:FL.level,sort:FL.sort,age:FL.age});
/* เรียงลำดับ + ช่วงเวลาที่แจ้ง */
const SORTS=[['new','ใหม่ล่าสุด'],['old','เก่าสุด'],['urgent','ด่วนก่อน']];
const AGES=[['','ทั้งหมด'],['today','วันนี้'],['24h','24 ชม.'],['3d','3 วัน'],['7d','7 วัน'],['older','เก่ากว่า 7 วัน']];
function ageOk(c){if(!FL.age)return true;const t=Number(c.createdAt)||Date.parse(c.createdAt)||0,now=Date.now(),H=3600000;
  if(FL.age==='today'){const d=new Date();d.setHours(0,0,0,0);return t>=d.getTime()}
  if(FL.age==='older')return t&&t<now-168*H;return t>=now-({'24h':24,'3d':72,'7d':168}[FL.age])*H}
const STATUS_TABS=[['active','ยังไม่เสร็จ'],['danger','ด่วน'],['open','รอช่วย'],['going','กำลังไป'],['done','ช่วยแล้ว'],['all','ทั้งหมด']];
const PEOPLE_R=[['1-5','1–5 คน'],['6-20','6–20 คน'],['21-99999','มากกว่า 20 คน']];
function renderFilters(){
  const fk=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('[data-st],[data-ty]');const keep=fk?(fk.dataset.st?'[data-st="'+fk.dataset.st+'"]':'[data-ty="'+fk.dataset.ty+'"]'):null;
  $('#status-tabs').innerHTML=STATUS_TABS.map(([k,t])=>`<button type="button" data-st="${k}" aria-pressed="${FL.status===k}">${t}</button>`).join('');
  if(keep)setTimeout(()=>{const x=$(keep);x&&x.focus()},0);
  $('#type-chips').innerHTML=NEED_TYPES.map(t=>`<button type="button" data-ty="${t.key}" aria-pressed="${FL.types.includes(t.key)}">${ic(t.icon)}${t.label}</button>`).join('');
  $('#sort-row').innerHTML='<span class="sort-lbl">เรียง</span>'+SORTS.map(([k,t])=>`<button type="button" data-sort="${k}" aria-pressed="${FL.sort===k}">${t}</button>`).join('');
  $('#more-filter-panel').innerHTML='<h4>แจ้งเมื่อ</h4><div class="chips">'+AGES.map(([k,t])=>`<label><input type="radio" name="fl-age" data-age="${k}" ${FL.age===k?'checked':''}><span>${t}</span></label>`).join('')+'</div>'+
    '<h4>จำนวนคน</h4><div class="chips">'+PEOPLE_R.map(([k,t])=>`<label><input type="checkbox" data-pp="${k}" ${FL.people.includes(k)?'checked':''}><span>${t}</span></label>`).join('')+'</div>'+
    '<h4>ระดับน้ำ</h4><div class="chips">'+Object.entries({...LEVEL_TH,none:'ไม่ระบุ'}).map(([k,t])=>`<label><input type="checkbox" data-lv="${k}" ${FL.level.includes(k)?'checked':''}><span>${t}</span></label>`).join('')+'</div>'+
    '<button type="button" class="pill pill-ghost small" id="clear-filter">ล้างตัวกรอง</button>';
  const n=FL.types.length+FL.people.length+FL.level.length+(FL.age?1:0);$('#more-filter').lastChild.textContent=n?`ตัวกรองเพิ่ม (${n})`:'ตัวกรองเพิ่ม';
}
$('#status-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;FL.status=b.dataset.st;saveFL();renderFilters();applyFilters()});
$('#sort-row').addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b)return;FL.sort=b.dataset.sort;saveFL();renderFilters();applyFilters();$('#case-list').scrollIntoView({block:'nearest'})});
$('#type-chips').addEventListener('click',e=>{const b=e.target.closest('[data-ty]');if(!b)return;const k=b.dataset.ty;FL.types=FL.types.includes(k)?FL.types.filter(x=>x!==k):[...FL.types,k];saveFL();renderFilters();applyFilters()});
$('#more-filter').addEventListener('click',()=>{const p=$('#more-filter-panel');p.hidden=!p.hidden;$('#more-filter').setAttribute('aria-expanded',String(!p.hidden))});
$('#more-filter-panel').addEventListener('change',e=>{const i=e.target;if(i.dataset.pp){FL.people=i.checked?[...FL.people,i.dataset.pp]:FL.people.filter(x=>x!==i.dataset.pp)}if(i.dataset.lv){FL.level=i.checked?[...FL.level,i.dataset.lv]:FL.level.filter(x=>x!==i.dataset.lv)}if(i.dataset.age!=null&&i.checked)FL.age=i.dataset.age;saveFL();renderFilters();applyFilters()});
$('#more-filter-panel').addEventListener('click',e=>{if(e.target.id==='clear-filter'){FL.types=[];FL.people=[];FL.level=[];FL.age='';FL.status='active';saveFL();renderFilters();applyFilters()}});
let qTimer;$('#case-search').addEventListener('input',()=>{clearTimeout(qTimer);qTimer=setTimeout(()=>{FL.q=srchNorm($('#case-search').value.trim());applyFilters(true)},200)});
function applyFilters(fit){renderList();drawPins('map');if(fit&&FL.q&&S.maps.map){const pts=filteredCases().filter(hasPin).map(c=>[+c.lat,+c.lng]);if(pts.length)S.maps.map.fitBounds(pts,{padding:[60,60],maxZoom:15})}}
/* ค้นหาได้ทุกอย่าง (ชื่อ เบอร์ ที่อยู่ ความต้องการ ฯลฯ) */
function srchNorm(s){s=String(s==null?'':s);try{s=s.normalize('NFC')}catch(e){}return s.replace(/[​-‍﻿]/g,'').replace(/ํ([่-๋]?)า/g,'$1ำ').replace(/^'+/,'').toLowerCase()}
const normDigits=x=>{let d=String(x||'').replace(/\D/g,'');if(d.startsWith('66')&&d.length>=11)d=d.slice(2);return d.replace(/^0+/,'')};
function caseHay(c){const d=Number(c.createdAt)?new Date(Number(c.createdAt)):null;
  return srchNorm([c.id,'#'+c.id,(c.needs||[]).join(' '),c.district,c.district?'เขต'+c.district:'',c.address,c.name,c.phone,c.notes,c.volunteer,STATUS_TH[c.status],c.status!=='done'?URG_TH[sevOf(c)]:'',LEVEL_TH[c.level]||'',c.people?c.people+' คน':'',d?d.toLocaleDateString('th-TH',{day:'numeric',month:'short'}):''].filter(Boolean).join(' '))}
function caseMatches(c,q){const hay=caseHay(c);if(q.length>=3&&hay.replace(/\s+/g,'').includes(q.replace(/\s+/g,'')))return true;const digits=normDigits(c.phone);
  return q.split(/\s+/).every(t=>{if(hay.includes(t))return true;if(!/^\+?[\d-]+$/.test(t))return false;const raw=t.replace(/\D/g,''),d=normDigits(t);if(raw.length<3||!d)return false;return /^(0|\+?66)/.test(t)?digits.startsWith(d):digits.includes(d)})}
function filteredCases(){
  const rank={open:0,going:1,done:2};
  return S.cases.filter(c=>{
    if(FL.q)return caseMatches(c,FL.q);
    if(FL.status==='active'&&c.status==='done')return false;
    if(FL.status==='danger'&&!isDanger(c))return false;
    if(['open','going','done'].includes(FL.status)&&c.status!==FL.status)return false;
    if(FL.types.length&&!FL.types.some(k=>(c.needs||[]).some(v=>needKey(v)===k)))return false;
    if(FL.people.length){const p=Number(c.people)||1;if(!FL.people.some(r=>{const [a,b]=r.split('-').map(Number);return p>=a&&p<=b}))return false}
    if(FL.level.length&&!FL.level.includes(c.level||'none'))return false;
    if(!ageOk(c))return false;
    return true}).sort((a,b)=>{const ta=Number(a.createdAt)||0,tb=Number(b.createdAt)||0;
      if(FL.sort==='old')return ta-tb;
      if(FL.sort==='urgent')return ((a.status==='done')-(b.status==='done'))||(sevOf(b)-sevOf(a))||(rank[a.status]-rank[b.status])||(tb-ta);
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
function renderList(){
  const list=filteredCases(),el=$('#case-list');el.replaceChildren(...list.map(caseCard));
  if(!list.length)el.innerHTML=`<p class="empty">${S.loaded?(FL.q?'ไม่พบเคสที่ค้นหา':'ไม่มีเคสในตัวกรองนี้'):'กำลังโหลด…'}</p>`;
  /* คนทั่วไปไม่เห็นจำนวนเคส */
  const txt=S.volunteer?(FL.q?`พบ ${list.length} เคส (ค้นจากทุกเคส)`:`${list.length} เคส`):(FL.q?'ผลการค้นหา':'รายการเคส');$('#case-count').textContent=txt;S.listTxt=txt;sheetLabel();
  if(typeof tripBadges==='function')tripBadges();
}
function renderLegend(){$('#legend').innerHTML=`<span><i style="background:var(--red)"></i>ด่วน</span><span><i style="background:var(--blue)"></i>รอช่วย</span><span><i style="background:var(--b-60)"></i>กำลังไป</span><span><i style="background:var(--ok)"></i>ช่วยแล้ว</span>`}
function setSheet(open){const s=$('#list-sheet');s.classList.toggle('open',open);$('#sheet-handle').setAttribute('aria-expanded',String(open))}
$('#sheet-handle').addEventListener('click',()=>setSheet(!$('#list-sheet').classList.contains('open')));
(function(){let y0=null;const h=$('#sheet-handle');h.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{passive:true});h.addEventListener('touchend',e=>{if(y0==null)return;const dy=e.changedTouches[0].clientY-y0;if(dy<-30)setSheet(true);else if(dy>30)setSheet(false);y0=null},{passive:true})})();

/* ---------- ทีมอาสา ---------- */
function renderVol(forceOpen){
  const sw=$('#vol-switch');sw.classList.toggle('on',S.volunteer);sw.classList.toggle('active',S.volunteer);sw.setAttribute('aria-expanded',String(!$('#vol-panel').hidden));sw.setAttribute('aria-label',(S.volunteer?'โหมดทีมอาสา: เปิดอยู่':'เข้าโหมดทีมอาสา')+' · ตั้งค่า');
  sw.classList.toggle('sharing',!!SHARE.watch);
  $('#vol-label').textContent=S.volunteer?(store.get('uh_team','')||'ทีมอาสา'):'ทีมอาสา';
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
    <div class="sep"></div><button type="button" class="pill pill-line full" id="vol-out">ออกจากโหมดอาสา</button>`;
  iconify(p);
  $('#team-in').onchange=e=>{store.set('uh_team',e.target.value.trim());renderVol()};
  $('#org-in').onchange=e=>store.set('uh_org',e.target.value);
  $('#share-btn').onclick=()=>{SHARE.watch?stopShare():startShare();p.dataset.mode='';renderVol()};
  $('#vol-out').onclick=()=>{stopShare();store.set('uh_vol_key','');store.set('uh_vol_ok','');S.volunteer=false;p.hidden=true;p.dataset.mode='';S.cases=((store.json('uh_cases_cache',{})||{}).cases||[]).map(pubCase);renderAll();if(S.view==='detail')go('map');loadCases()};
}
$('#vol-switch').addEventListener('click',()=>{const p=$('#vol-panel');p.hidden=!p.hidden;p.dataset.mode='';renderVol();if(!p.hidden){const f=p.querySelector('input,button');f&&f.focus()}});
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
  el.innerHTML=`<div class="d-map-col">${hasPin(c)?`<div id="detail-map" class="detail-map"></div>${!V?`<p class="hint">${ic('pin')} ตำแหน่งโดยประมาณ (รัศมีราว 500 ม.) · ที่อยู่เต็มเห็นเฉพาะทีมอาสา</p>`:''}<div class="coord-row" ${V?'':'hidden'}><span>${ic('pin')} ${(+c.lat).toFixed(6)}, ${(+c.lng).toFixed(6)}</span><button type="button" class="pill pill-ghost small" id="copy-coord" data-icon="copy">คัดลอก</button></div>`:'<p class="hint">ผู้แจ้งไม่ได้ปักหมุด</p>'}</div>
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
  if(S.volunteer&&hasPin(c)&&c.status!=='done'){const tb=document.createElement('button');tb.type='button';tb.className='pill pill-ghost full';const upd=()=>{tb.innerHTML=ic('route')+(tripIndex(c.id)>=0?'อยู่ในแผนเดินทาง (แตะเพื่อเอาออก)':'เพิ่มในแผนเดินทาง')};upd();tb.onclick=()=>{tripToggle(c.id);upd()};act.append(tb)}
  if(S.volunteer){
    const fs=document.createElement('fieldset');fs.className='status-pick';
    fs.innerHTML=`<legend>สถานะเคส (ติ๊กเพื่อเปลี่ยน)</legend><div class="status-opts">${[['open','รอช่วย'],['going','กำลังไป · รับเคส'],['done','ช่วยแล้ว · ปิดเคส']].map(([v,t])=>`<label><input type="radio" name="cst" value="${v}" ${c.status===v?'checked':''}><span>${t}</span></label>`).join('')}</div>
      <input id="d-team" placeholder="ชื่อทีม / อาสา" value="${esc(c.volunteer||store.get('uh_team',''))}" maxlength="40" aria-label="ชื่อทีม">
      <select id="d-org" aria-label="หน่วยงาน"><option value="">— หน่วยงาน —</option>${orgOpts(c.org||store.get('uh_org',''))}</select>`;
    fs.addEventListener('change',async e=>{if(e.target.name!=='cst')return;const v=e.target.value;if(!v||v===c.status)return;const team=$('#d-team').value.trim();
      if(v==='going'&&!team){toast('ใส่ชื่อทีมก่อนรับเคส');e.target.checked=false;const o=fs.querySelector(`input[value="${c.status}"]`);if(o)o.checked=true;$('#d-team').focus();return}
      if(team)store.set('uh_team',team);fs.disabled=true;
      const org=$('#d-org').value;if(org)store.set('uh_org',org);
      try{const r=await apiPost({action:'update',key:volKey(),id:c.id,status:v,volunteer:v==='open'?'':team,org:v==='open'?'':org});if(!r||!r.ok)throw new Error(r&&r.error);
        c.status=v;c.volunteer=v==='open'?'':team||c.volunteer;c.org=v==='open'?'':org||c.org;toast(v==='going'?'รับเคสแล้ว':v==='done'?'ปิดเคสแล้ว':'คืนเคสแล้ว',{ok:true});renderDetail(true);loadCases()}
      catch(err){toast('อัปเดตไม่สำเร็จ ลองอีกครั้ง');fs.disabled=false;const o=fs.querySelector(`input[value="${c.status}"]`);if(o)o.checked=true;else e.target.checked=false}});
    act.after(fs);
  }else act.insertAdjacentHTML('afterend','<p class="hint">ทีมอาสาที่มีรหัสจะเห็นที่อยู่เต็ม เบอร์โทร และรับเคสได้ในหน้าแผนที่</p>');
  const cp=$('#copy-coord');if(cp)cp.onclick=()=>{const t=(+c.lat).toFixed(6)+','+(+c.lng).toFixed(6);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('คัดลอกพิกัดแล้ว',{ok:true})).catch(()=>prompt('คัดลอกพิกัด',t))};
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
function tripLegs(){const all=tripCases(),ok=all.map((c,i)=>({c,n:i+1})).filter(({c})=>!c.missing&&hasPin(c)&&c.status!=='done'),pts=ok.map(({c})=>(+c.lat).toFixed(6)+','+(+c.lng).toFixed(6));const legs=[];
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
  return `<div class="zone-head"><b>${ic('layers')} โซนเคสใกล้กัน</b><small>รัศมี ~${ZONE_KM} กม. · แตะเพื่อวางเส้นทาง</small></div>`+
    (zones.length?`<div class="zone-list">${zones.map((z,i)=>`<button type="button" class="zone" data-z="${i}"><span class="zone-n">${z.cases.length}</span><span class="zone-t"><b>${esc(z.area)}</b><small>${z.people} คน${z.urgent?` · <em>ด่วน ${z.urgent}</em>`:''}${z.km!=null?` · ห่าง ~${z.km.toFixed(1)} กม.`:''}</small></span>${ic('route')}</button>`).join('')}</div>`
    :`<p class="hint">ยังไม่มีเคสรอช่วยที่อยู่ใกล้กัน 2 เคสขึ้นไป</p>`);
}
function bindZones(el,zones){el.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>tripPlanZone(zones[+b.dataset.z]))}
function renderTrip(){
  const el=$('#trip-panel');const list=tripCases();
  if(!S.volunteer||!S.cases.length){el.hidden=true;return}
  el.hidden=false;el.classList.toggle('empty',!list.length);
  if(!list.length){const zones=tripZones();TRIP.zones=zones;
    el.innerHTML=zoneListHTML(zones)+`<button type="button" class="trip-auto" id="trip-auto">${ic('route')}<span><b>จัดเส้นทางอัตโนมัติ</b><small>เลือกเคสใกล้คุณ คนเยอะก่อน แล้วเรียงให้</small></span></button>`;
    $('#trip-auto').onclick=tripAuto;bindZones(el,zones);drawZones();return}
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
function tripBadges(){$$('#case-list .case').forEach(b=>{const i=tripIndex(b.dataset.id);let t=b.querySelector('.trip-badge');if(i<0||!S.volunteer){t&&t.remove();return}if(!t){t=document.createElement('span');t.className='trip-badge';b.append(t)}t.textContent='จุดที่ '+(i+1)})}
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
  const N=x=>Number(x).toLocaleString('th-TH'),P=c=>Number(c.people)||1,sumP=l=>l.reduce((a,c)=>a+P(c),0);
  const act=all.filter(c=>c.status!=='done'),open=all.filter(c=>c.status==='open'),going=all.filter(c=>c.status==='going'),done=all.filter(c=>c.status==='done');
  const urgent=act.filter(isDanger);
  const DAY=86400000,now=Date.now(),t0=new Date();t0.setHours(0,0,0,0);
  const newToday=all.filter(c=>Number(c.createdAt)>=t0.getTime()).length,doneToday=done.filter(c=>Number(c.updatedAt)>=t0.getTime()).length,goingToday=going.filter(c=>Number(c.updatedAt)>=t0.getTime()).length;
  const waits=done.map(c=>Number(c.updatedAt)-Number(c.createdAt)).filter(x=>x>0).sort((a,b)=>a-b),med=waits.length?waits[Math.floor(waits.length/2)]:0;
  const dur=ms=>{const h=ms/3600000;return h<1?Math.max(1,Math.round(ms/60000))+' นาที':h<48?(Math.round(h*10)/10)+' ชม.':Math.round(h/24)+' วัน'};
  const waitOf=c=>now-(Number(c.createdAt)||now);
  const over24=open.filter(c=>waitOf(c)>DAY).length,over6=open.filter(c=>waitOf(c)>6*3600000).length;
  const rate=all.length?Math.round(done.length/all.length*100):0;
  /* 7 วันล่าสุด */
  const days=[...Array(7)].map((_,i)=>{const s=t0.getTime()-(6-i)*DAY,e=s+DAY;return {d:new Date(s),n:all.filter(c=>+c.createdAt>=s&&+c.createdAt<e).length,k:done.filter(c=>+c.updatedAt>=s&&+c.updatedAt<e).length}});
  const dmax=Math.max(1,...days.map(x=>Math.max(x.n,x.k)));
  const cnt=(list,fn)=>{const m={};list.forEach(c=>[].concat(fn(c)).forEach(k=>{if(k)m[k]=(m[k]||0)+1}));return m};
  /* ความเร่งด่วน */
  const urgRows=[4,3,2,1].map(v=>{const l=act.filter(c=>sevOf(c)===v);return {label:URG_TH[v],n:l.length,sub:N(sumP(l))+' คน',color:URG_COL[v],v}});
  const needs=cnt(act,c=>[...new Set((c.needs||[]).map(needKey))]);
  const needRows=NEED_TYPES.map(t=>({key:t.key,label:t.label,icon:t.icon,n:needs[t.key]||0})).filter(r=>r.n).sort((a,b)=>b.n-a.n);
  const lv=cnt(act,c=>c.level||'none');const lvRows=[...Object.keys(LEVEL_TH),'none'].map(k=>({key:k,label:LEVEL_TH[k]||'ไม่ระบุ',n:lv[k]||0})).filter(r=>r.n);
  /* รายเขต: รอ / กำลังไป / ช่วยแล้ว / คนที่รอ / ด่วน */
  const D={};all.forEach(c=>{const k=areaOf(c)||'';const d=D[k]||(D[k]={open:0,going:0,done:0,ppl:0,urg:0});d[c.status==='going'?'going':c.status==='done'?'done':'open']++;if(c.status!=='done'){d.ppl+=P(c);if(isDanger(c))d.urg++}});
  const dName=k=>areaLabel(k)||'ไม่ทราบเขต';
  const dRows=Object.entries(D).sort((a,b)=>(!a[0])-(!b[0])||(b[1].urg-a[1].urg)||((b[1].open+b[1].going)-(a[1].open+a[1].going))||(b[1].done-a[1].done)).slice(0,15);
  /* ทีมอาสา */
  const T={};all.forEach(c=>{if(c.status==='open'||!c.volunteer)return;const k=String(c.volunteer).trim();const t=T[k]||(T[k]={going:0,done:0,ppl:0});t[c.status]++;if(c.status==='done')t.ppl+=P(c)});
  const tRows=Object.entries(T).sort((a,b)=>(b[1].done+b[1].going)-(a[1].done+a[1].going)).slice(0,10);
  /* รอนานที่สุด */
  const oldest=open.slice().sort((a,b)=>(Number(a.createdAt)||0)-(Number(b.createdAt)||0)).slice(0,5);
  /* ข้อมูลไม่ครบ */
  const noPin=act.filter(c=>!hasPin(c)).length,noLv=act.filter(c=>!c.level).length,noArea=act.filter(c=>!areaOf(c)).length;
  const tile=(n,l,cls='',go='')=>`<button type="button" class="stile ${cls}" ${go}><b>${N(n)}</b><span>${l}</span></button>`;
  const line=(i,t,v,cls='')=>`<div class="sline${cls?' '+cls:''}"><span>${ic(i)}${t}</span><b>${v}</b></div>`;
  el.innerHTML=`<p class="stats-upd">${S.loaded?'อัปเดต '+new Date(S.loaded).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+' น.':'ข้อมูลล่าสุดที่บันทึกไว้'} · ${N(all.length)} เคสทั้งหมด · ช่วยแล้ว ${rate}%</p>
  <section class="scard" aria-labelledby="st-now"><h2 id="st-now">ตอนนี้</h2>
    <div class="stiles">${tile(open.length,'รอช่วย','',`data-sgo="open"`)}${tile(urgent.length,'ด่วนมาก + วิกฤต','is-red',`data-sgo="danger"`)}${tile(going.length,'กำลังไป','',`data-sgo="going"`)}${tile(done.length,'ช่วยแล้ว','is-green',`data-sgo="done"`)}</div>
    <div class="sprog" role="img" aria-label="สัดส่วนสถานะ รอช่วย ${open.length} กำลังไป ${going.length} ช่วยแล้ว ${done.length}">${[[open.length,'var(--blue)'],[going.length,'var(--going)'],[done.length,'var(--ok)']].map(([n,c])=>n?`<i style="flex:${n};background:${c}"></i>`:'').join('')}</div>
    ${line('users','คนที่ยังรอความช่วยเหลือ',N(sumP(act))+' คน')}
    ${line('alert','คนในเคสด่วนมาก/วิกฤต',N(sumP(urgent))+' คน',urgent.length?'is-red':'')}
    ${line('check','คนที่ช่วยแล้ว',N(sumP(done))+' คน')}
    ${line('clock','เวลาตั้งแต่แจ้งถึงช่วยเสร็จ (ค่ากลาง)',med?dur(med):'-')}
    ${line('clock','รอช่วยเกิน 6 ชม. / เกิน 24 ชม.',`${N(over6)} / ${N(over24)} เคส`,over24?'is-red':'')}</section>
  <section class="scard" aria-labelledby="st-urg"><h2 id="st-urg">ความเร่งด่วน <small>(เคสที่ยังไม่เสร็จ · จำนวนเคส และคน)</small></h2>
    ${act.length?statBars(urgRows):'<p class="hint">ไม่มีเคสค้าง</p>'}</section>
  <section class="scard" aria-labelledby="st-old"><h2 id="st-old">รอนานที่สุด <small>(ยังไม่มีทีมรับ)</small></h2>
    ${oldest.length?`<ul class="slist">${oldest.map(c=>`<li><button type="button" data-sopen="${esc(c.id)}"><span class="urg urg-${sevOf(c)}"><i></i>${URG_TH[sevOf(c)]}</span><span class="sl-t"><b>${esc((c.needs||[]).join(' · ')||'ขอความช่วยเหลือ')}</b><small>${esc([dName(areaOf(c)),P(c)+' คน','#'+c.id].join(' · '))}</small></span><em>${dur(waitOf(c))}</em></button></li>`).join('')}</ul>`:'<p class="hint">ไม่มีเคสที่รอช่วย</p>'}</section>
  <section class="scard" aria-labelledby="st-today"><h2 id="st-today">วันนี้</h2>
    <div class="spair"><div><b>${newToday}</b><span>คำขอใหม่</span></div><div><b>${goingToday}</b><span>ทีมรับเคส</span></div><div><b>${doneToday}</b><span>ช่วยเสร็จ</span></div></div>
    <div class="trend" role="img" aria-label="7 วันล่าสุด ${days.map(x=>x.d.toLocaleDateString('th-TH',{day:'numeric',month:'short'})+' ขอใหม่ '+x.n+' ช่วยแล้ว '+x.k).join(', ')}">
      ${days.map(x=>`<div class="tcol"><div class="tbars"><i class="tn" style="height:${x.n/dmax*100}%"><em>${x.n||''}</em></i><i class="tk" style="height:${x.k/dmax*100}%"><em>${x.k||''}</em></i></div><small>${x.d.toLocaleDateString('th-TH',{weekday:'narrow'})}<br>${x.d.getDate()}</small></div>`).join('')}
    </div>
    <div class="tkey"><span><i class="tn"></i>ขอใหม่</span><span><i class="tk"></i>ช่วยแล้ว</span></div></section>
  <section class="scard" aria-labelledby="st-area"><h2 id="st-area">รายเขต</h2>
    ${dRows.length?`<div class="stable-wrap"><table class="stable"><thead><tr><th scope="col">เขต</th><th scope="col">รอช่วย</th><th scope="col">ด่วน</th><th scope="col">กำลังไป</th><th scope="col">ช่วยแล้ว</th><th scope="col">คนที่รอ</th></tr></thead><tbody>
      ${dRows.map(([k,d])=>`<tr><th scope="row">${esc(dName(k))}</th><td>${d.open||'–'}</td><td class="${d.urg?'is-red':''}">${d.urg||'–'}</td><td>${d.going||'–'}</td><td>${d.done||'–'}</td><td>${d.ppl?N(d.ppl):'–'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">ยังไม่มีเคส</p>'}
    ${noArea&&areaBusy?'<p class="hint">กำลังหาเขตจากหมุด…</p>':''}</section>
  <section class="scard" aria-labelledby="st-need"><h2 id="st-need">ต้องการอะไรมากที่สุด <small>(เคสที่ยังไม่เสร็จ · แตะเพื่อดูในแผนที่)</small></h2>
    ${needRows.length?statBars(needRows,{tap:r=>`data-sneed="${r.key}" aria-label="${r.label} ${r.n} เคส · ดูในแผนที่"`}):'<p class="hint">ยังไม่มีเคส</p>'}</section>
  <section class="scard" aria-labelledby="st-team"><h2 id="st-team">ทีมอาสา</h2>
    ${tRows.length?`<div class="stable-wrap"><table class="stable"><thead><tr><th scope="col">ทีม</th><th scope="col">กำลังไป</th><th scope="col">ช่วยแล้ว</th><th scope="col">คนที่ช่วย</th></tr></thead><tbody>
      ${tRows.map(([k,t])=>`<tr><th scope="row">${esc(k)}</th><td>${t.going||'–'}</td><td>${t.done||'–'}</td><td>${t.ppl?N(t.ppl):'–'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">ยังไม่มีทีมรับเคส</p>'}</section>
  <section class="scard" aria-labelledby="st-lv"><h2 id="st-lv">ระดับน้ำ <small>(เคสที่ยังไม่เสร็จ)</small></h2>${lvRows.length?statBars(lvRows):'<p class="hint">ยังไม่มีข้อมูล</p>'}</section>
  <section class="scard" aria-labelledby="st-gap"><h2 id="st-gap">ข้อมูลที่ขาด <small>(เคสที่ยังไม่เสร็จ)</small></h2>
    ${line('pin','ไม่ได้ปักหมุด',N(noPin)+' เคส')}${line('wave','ไม่ระบุระดับน้ำ',N(noLv)+' เคส')}${line('map','ไม่ทราบเขต',N(noArea)+' เคส')}</section>`;
  if(!soft)fillAreas();
}
$('#stats').addEventListener('click',e=>{const o=e.target.closest('[data-sopen]');if(o){openCase(o.dataset.sopen);return}const g=e.target.closest('[data-sgo]'),n=e.target.closest('[data-sneed]');if(!g&&!n)return;
  FL.q='';$('#case-search').value='';FL.people=[];FL.level=[];
  if(g){FL.status=g.dataset.sgo;FL.types=[]}else{FL.status='active';FL.types=[n.dataset.sneed]}
  saveFL();renderFilters();applyFilters();go('map');setSheet(true)});
try{localStorage.removeItem('uh_no_track')}catch(e){}
const startView=(location.hash||'#home').slice(1);
go(['home','map','emergency','stats'].includes(startView)?startView:'home',false);
history.replaceState({view:S.view},'','#'+S.view);
renderAll();loadCases();flushQueue();trackMine();
$$('.view').forEach(v=>v.hidden=!v.classList.contains('active'));setTimeout(()=>{A11Y.ready=true},0);
setInterval(()=>{if(!document.hidden)loadCases()},REFRESH_MS);
setInterval(()=>{if(!document.hidden)trackMine()},REFRESH_MS*4);


