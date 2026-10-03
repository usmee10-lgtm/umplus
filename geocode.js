/* ค้นหาที่อยู่ด้วย Photon (photon.komoot.io) + Esri World Geocoder: แนะนำเมื่อพิมพ์ 3 ตัวอักษรขึ้นไป (หน่วง 350ms)
   จำกัดผลในไทย ให้ผลในกรุงเทพฯ ขึ้นก่อน และแปลงพิกัดเป็นที่อยู่ (reverse) */
const GEO={url:'https://photon.komoot.io',bbox:'97.3,5.6,105.7,20.5',bkk:{lat:13.7563,lng:100.5018}};
const GEO_ABBR=[[/(^|\s)ถ\.\s*/g,'$1ถนน'],[/(^|\s)ซ\.\s*/g,'$1ซอย'],[/(^|\s)ต\.\s*/g,'$1ตำบล'],[/(^|\s)อ\.\s*/g,'$1อำเภอ'],[/(^|\s)จ\.\s*/g,'$1จังหวัด'],[/กทม\.?/g,'กรุงเทพมหานคร']];
function geoNorm(q){let s=' '+String(q||'').trim();GEO_ABBR.forEach(([r,t])=>s=s.replace(r,t));return s.replace(/\s+/g,' ').trim()}
function geoIsBkk(p){return /กรุงเทพ|bangkok/i.test([p.city,p.state,p.county,p.district].join(' '))}
function geoLabel(p){
  const title=p.name||[p.street,p.housenumber].filter(Boolean).join(' ')||p.district||p.city||'';
  const sub=[p.street&&p.name?p.street:'',p.district||p.locality,p.city||p.county,p.state].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i&&x!==title).join(', ');
  return {title,sub,full:[title,sub].filter(Boolean).join(', ')}}
/* แยกคำค้น: ชื่อหลัก (เช่น ราษฎร์พัฒนา) + เลข (ซอย 4, แยก 1) — Photon ตัดคำไทยไม่เก่ง จึงค้นหลายแบบแล้วให้คะแนนเอง */
const GEO_STOP=/^(ซอย|ถนน|ตรอก|แยก|หมู่|หมู่ที่|ม\.|เลขที่|บ้านเลขที่|แขวง|เขต|ตำบล|อำเภอ|จังหวัด|กรุงเทพมหานคร|กรุงเทพฯ?)$/;
function geoParts(nq){const nums=[],words=[];let prev='';
  nq.replace(/(บ้านเลขที่|เลขที่)\s*\d+(\/\d+)?/g,' ').split(' ').forEach(t=>{const pv=prev;prev=t;if(!t)return;
    if(/^\d+\/\d+$/.test(t))return;                                 /* 12/3 = บ้านเลขที่ ไม่ใช่เลขซอย */
    if(/^\d+(-\d+)*$/.test(t)){if(!/^(หมู่|หมู่ที่|ม\.)$/.test(pv))nums.push(...t.split('-'));return}
    const w=t.replace(/^(ซอย|ถนน|ตรอก|แขวง|เขต)/,'');if(/^\d+(-\d+)*$/.test(w)){nums.push(...w.split('-'));return}if(!w||GEO_STOP.test(t)||GEO_STOP.test(w))return;
    const m=w.match(/^(.*?[^\d\s])(\d+)$/);if(m){words.push(m[1]);nums.push(m[2])}else if(!/^\d/.test(w))words.push(w)});
  return {base:words.sort((x,y)=>y.length-x.length)[0]||'',words,nums}}
async function geoQuery(q,signal,limit=10){
  const u=`${GEO.url}/api/?limit=${limit}&lang=default&lat=${GEO.bkk.lat}&lon=${GEO.bkk.lng}&location_bias_scale=0.4&bbox=${GEO.bbox}&q=${encodeURIComponent(q)}`;
  const r=await fetch(u,{signal});if(!r.ok)throw new Error('geo '+r.status);return (await r.json()).features||[]}
/* เทียบชื่อแบบหลวม: ตัดวรรณยุกต์/ไม้ไต่คู้/การันต์ ช่องว่าง และเครื่องหมาย (ดารุ้ล = ดารุล, เดอะมอลล์ บางกะปิ = เดอะมอลล์บางกะปิ) */
const geoKey=s=>String(s||'').toLowerCase().replace(/[็-๎]/g,'').replace(/[\s.,\-–()'"/]/g,'');
/* แหล่งที่ 2: Esri World Geocoder (ข้อมูลสถานที่ไทยละเอียด: โรงเรียน มัสยิด หมู่บ้าน ร้านค้า บ้านเลขที่) · ไม่ต้องใช้ key สำหรับการค้นหา */
const ESRI_GEO='https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
async function esriQuery(q,signal,limit=8){
  const u=`${ESRI_GEO}?f=json&singleLine=${encodeURIComponent(q)}&countryCode=THA&location=${GEO.bkk.lng},${GEO.bkk.lat}&maxLocations=${limit}&langCode=TH&forStorage=false&outFields=PlaceName,Place_addr,Addr_type,Type,StName,Nbrhd,District,City,Subregion,Region`;
  const r=await fetch(u,{signal});if(!r.ok)throw new Error('esri '+r.status);const j=await r.json();if(j.error)throw new Error('esri');
  return (j.candidates||[]).filter(c=>c.location&&c.score>=75).map(c=>{const a=c.attributes||{},addr=String(a.Place_addr||c.address||'');
    const title=a.PlaceName||addr.split(/\s(?=แขวง|ตำบล|เขต|อำเภอ|อ\.)/)[0]||addr;
    const parts=addr.split(/\s+/);const sub=addr&&addr!==title?addr.replace(title,'').trim()||addr:[a.Nbrhd,a.City,a.Region].filter(Boolean).join(' ');
    const dist=String(a.City||a.District||'').replace(/^เขต\s*/,'');
    return {lat:c.location.y,lng:c.location.x,title,sub,label:[title,sub].filter(Boolean).join(', '),bkk:/กรุงเทพ|bangkok/i.test(addr+' '+(a.Region||'')),
      dist,area:String(a.Nbrhd||'').replace(/^แขวง\s*/,''),type:a.Addr_type==='StreetName'?'street':(a.Type||a.Addr_type||'').toLowerCase(),name:a.PlaceName||'',street:a.StName||'',src:'esri',esri:c.score}})}
async function geoSuggest(q,signal){
  const nq=geoNorm(q);if(nq.length<3)return [];
  const P=geoParts(nq),vars=[nq];
  if(P.base){if(P.nums.length)vars.push('ซอย'+P.base+' '+P.nums[0]);vars.push(P.base)}
  /* ค้นพร้อมกัน 2 แหล่ง: Photon (OpenStreetMap) + Esri แล้วรวม จัดอันดับเอง */
  const jobs=[...new Set(vars)].map(v=>geoQuery(v,signal).then(fs=>fs.map(f=>({f}))));
  jobs.push(esriQuery(nq,signal).then(xs=>xs.map(x=>({x}))));
  const res=await Promise.allSettled(jobs);
  if(signal&&signal.aborted)throw new DOMException('aborted','AbortError');
  const raw=[].concat(...res.filter(x=>x.status==='fulfilled').map(x=>x.value));
  if(!raw.length&&res.every(x=>x.status==='rejected'))throw res[0].reason;
  const items=raw.map(r=>{if(r.x)return r.x;const f=r.f,p=f.properties||{};if(p.countrycode&&p.countrycode!=='TH')return null;const L=geoLabel(p);
    return {lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],title:L.title,sub:L.sub,label:L.full,bkk:geoIsBkk(p),dist:p.district||'',area:p.locality||'',type:p.type||'',name:p.name||'',street:p.street||'',src:'osm'}}).filter(x=>x&&x.title);
  const qk=geoKey(nq),bk=geoKey(P.base);
  const scored=items.map(x=>{const hay=(x.title+' '+x.sub).replace(/\s+/g,''),hk=geoKey(x.title+x.sub),tk=geoKey(x.title),own=x.title.match(/\d+/g)||[];let sc=0;
      let hit=0;P.words.forEach(w=>{const wk=geoKey(w);if(hay.includes(w)||hk.includes(wk)){hit++;sc+=w===P.base?6:2}});
      if(P.words.length>=2)sc+=4*hit-5*(P.words.length-hit);          /* ชื่อหลายคำ: ต้องตรงหลายคำ (ลุมพินี วิลล์ ลาดพร้าว ≠ ถนนลาดพร้าว) */
      P.nums.forEach((n,i)=>{if(own[i]===n)sc+=i===0?5:3;else if(own.includes(n))sc+=1});
      if(P.nums.length&&own.length&&!own.includes(P.nums[0]))sc-=2;   /* เลขซอยไม่ตรง */
      if(bk&&!hk.includes(bk)&&P.words.length<2)sc-=5;                 /* ไม่มีชื่อหลักเลย */
      if(tk===qk)sc+=10;else if(tk.startsWith(qk)||qk.startsWith(tk)&&tk.length>=4)sc+=5;else if(tk.includes(qk))sc+=3;   /* ชื่อตรงกับที่พิมพ์ */
      if(x.src==='esri'&&x.esri>=99)sc+=1;
      if(x.type==='poi'||x.type==='house'||x.type==='pointaddress')sc+=1;
      sc+=x.bkk?3:-3;x.score=sc;return x});
  /* รวมผลซ้ำ: ชื่อเดียวกันห่างกันไม่ถึง ~150 ม. = ที่เดียวกัน (เก็บอันที่คะแนนสูง/ที่อยู่ละเอียดกว่า) */
  const near=(a,b,d=.0014)=>Math.abs(a.lat-b.lat)<d&&Math.abs(a.lng-b.lng)<d;
  const out=[];scored.sort((a,b)=>b.score-a.score||(b.sub||'').length-(a.sub||'').length).forEach(x=>{
    const k=geoKey(x.title);if(out.some(o=>geoKey(o.title)===k&&near(o,x,.004)))return;   /* ชื่อเดียวกันใน ~400 ม. = ที่เดียวกัน (ห้าง/หมู่บ้านใหญ่) */
    if(out.some(o=>o.label===x.label&&o.lat.toFixed(3)===x.lat.toFixed(3)))return;out.push(x)});
  /* ตัดผลที่ไม่เกี่ยวออก (คะแนนติดลบ หรือห่างจากอันดับ 1 มาก) แต่ถ้าไม่มีอะไรเลยก็ยังแสดงที่ใกล้เคียงที่สุด */
  const top=out.length?out[0].score:0,good=out.filter(x=>x.score>=0&&x.score>=top-14);
  return (good.length?good:out).slice(0,8);
}
async function geoReverseRaw(lat,lng){
  try{const r=await fetch(`${GEO.url}/reverse?lat=${lat}&lon=${lng}&limit=1`);if(!r.ok)return null;const f=((await r.json()).features||[])[0];return f?f.properties||null:null}catch(e){return null}}
async function geoReverse(lat,lng){
  try{const r=await fetch(`${GEO.url}/reverse?lat=${lat}&lon=${lng}&limit=1`);if(!r.ok)return '';
    const f=((await r.json()).features||[])[0];if(!f)return '';return geoLabel(f.properties||{}).full}catch(e){return ''}
}
/* ผูกช่องพิมพ์กับรายการแนะนำ: onPick(item) */
function geoAttach(input,list,onPick,opt={}){
  let tm=null,ctl=null,items=[],active=-1;
  const status=opt.status||null;
  /* combobox สำหรับโปรแกรมอ่านหน้าจอ: บอกว่ามีรายการแนะนำ และรายการไหนถูกเลือกด้วยลูกศร */
  if(!list.id)list.id=input.id+'-list';
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
  list.setAttribute('aria-label','ที่อยู่ที่แนะนำ');
  const render=()=>{list.replaceChildren();list.hidden=!items.length;input.setAttribute('aria-expanded',String(!!items.length));
    /* ตัวเลือกแรก: ใช้ที่อยู่ตามที่พิมพ์ (ปักหมุดโดยประมาณจากผลที่ใกล้เคียงที่สุด) */
    if(opt.onFree&&items.length&&input.value.trim().length>=3){const f=document.createElement('button');f.type='button';f.tabIndex=-1;f.className='sug sug-free';
      f.innerHTML=ic('check')+'<span><b></b><small>ปักหมุดโดยประมาณ แล้วลากให้ตรงบ้านได้</small></span>';f.querySelector('b').textContent='ใช้ "'+input.value.trim()+'"';
      f.addEventListener('click',()=>{const best=items[0]&&items[0].score>0?items[0]:null;opt.onFree(input.value.trim(),best);items=[];render()});list.append(f)}
    if(active>=0&&items.length)input.setAttribute('aria-activedescendant',list.id+'-o'+active);else input.removeAttribute('aria-activedescendant');
    items.forEach((it,i)=>{const b=document.createElement('button');b.type='button';b.id=list.id+'-o'+i;b.tabIndex=-1;b.className='sug'+(i===active?' on':'');b.setAttribute('role','option');b.setAttribute('aria-selected',String(i===active));
      b.innerHTML=ic('pin')+'<span><b></b><small></small></span>';b.querySelector('b').textContent=it.title;b.querySelector('small').textContent=it.sub||'';
      b.addEventListener('click',()=>{onPick(it);items=[];render()});list.append(b)})};
  const run=async()=>{const q=input.value.trim();if(q.length<3){if(ctl){ctl.abort();ctl=null}items=[];render();if(status)status.textContent='';return}
    if(ctl)ctl.abort();ctl=new AbortController();if(status)status.textContent='กำลังค้นหา…';
    try{items=await geoSuggest(q,ctl.signal);active=-1;render();if(status)status.textContent=items.length?'พบ '+items.length+' ที่อยู่ · แตะเพื่อเลือก':'ไม่พบที่อยู่นี้ ลองพิมพ์ชื่อถนน ซอย หรือเขต'}
    catch(e){if(e.name!=='AbortError'&&status)status.textContent='ค้นหาไม่ได้ (ไม่มีสัญญาณ?) ใช้ตำแหน่งตอนนี้ หรือปักหมุดบนแผนที่แทน'}};
  input.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(run,350)});
  input.addEventListener('keydown',e=>{if(!items.length)return;
    if(e.key==='ArrowDown'){active=Math.min(items.length-1,active+1);render();e.preventDefault()}
    else if(e.key==='ArrowUp'){active=Math.max(0,active-1);render();e.preventDefault()}
    else if(e.key==='Enter'){e.preventDefault();const it=items[active<0?0:active];if(it){onPick(it);items=[];render()}}
    else if(e.key==='Escape'){items=[];active=-1;render();e.stopPropagation()}});
  return {clear(){items=[];render()},run};
}
