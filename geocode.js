/* ค้นหาที่อยู่ด้วย Photon (OpenStreetMap) ผ่าน proxy ของเรา /api/geo (แคชที่ Cloudflare · สลับไป Photon ที่ตั้งเองได้): แนะนำเมื่อพิมพ์ 3 ตัวอักษรขึ้นไป (หน่วง 350ms)
   จำกัดผลในไทย ให้ผลในกรุงเทพฯ ขึ้นก่อน และแปลงพิกัดเป็นที่อยู่ (reverse) */
const GEO={proxy:'/api/geo',direct:'https://photon.komoot.io',bbox:'97.3,5.6,105.7,20.5',bkk:{lat:13.7563,lng:100.5018}};
/* เรียก Photon: ผ่าน proxy ก่อน (แคช + self-hosted) ถ้า proxy ใช้ไม่ได้ (เช่น เปิดไฟล์ในเครื่อง) ค่อยเรียก Photon สาธารณะตรง ๆ */
let GEO_PROXY_OK=!/^(file:|http:\/\/(localhost|127\.))/.test(location.href);
/* ถ้า /api ของโดเมนหลักตอบผิดรูปแบบ (เช่น มี Worker อื่นมาดัก) → ลอง proxy เดียวกันบน pages.dev → สุดท้ายเรียก Photon ตรง */
const GEO_ALT='https://umplus-help.pages.dev/api/geo';
async function photonGet(path,signal){
  if(GEO_PROXY_OK){for(const base of [GEO.proxy,GEO_ALT]){try{const r=await fetch(base+path,{signal});if(r.ok){const j=await r.json();if(j&&Array.isArray(j.features))return j}}catch(e){if(e.name==='AbortError')throw e}}}
  const r=await fetch(GEO.direct+path,{signal});if(!r.ok)throw new Error('geo '+r.status);return r.json()}
const GEO_ABBR=[[/(^|\s)ถ\.\s*/g,'$1ถนน'],[/(^|\s)ซ\.\s*/g,'$1ซอย'],[/(^|\s)ต\.\s*/g,'$1ตำบล'],[/(^|\s)อ\.\s*/g,'$1อำเภอ'],[/(^|\s)จ\.\s*/g,'$1จังหวัด'],[/กทม\.?/g,'กรุงเทพมหานคร'],
  [/รพ\.?\s*สต\.\s*/g,'โรงพยาบาลส่งเสริมสุขภาพตำบล'],[/(^|\s)รพ\.\s*/g,'$1โรงพยาบาล'],[/(^|\s)รร\.\s*/g,'$1โรงเรียน'],[/(^|\s)(มบ|หมบ)\.\s*/g,'$1หมู่บ้าน'],
  [/(^|\s)สน\.\s*/g,'$1สถานีตำรวจนครบาล'],[/(^|\s)ม\.ราม(คำแหง)?/g,'$1มหาวิทยาลัยรามคำแหง'],[/(^|\s)ร\.ร\.\s*/g,'$1โรงเรียน'],[/(^|\s)ร\.พ\.\s*/g,'$1โรงพยาบาล']];
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
  return (await photonGet(`/api/?limit=${limit}&lang=default&lat=${GEO.bkk.lat}&lon=${GEO.bkk.lng}&location_bias_scale=0.4&bbox=${GEO.bbox}&q=${encodeURIComponent(q)}`,signal)).features||[]}
/* เทียบชื่อแบบหลวม: ตัดวรรณยุกต์/ไม้ไต่คู้/การันต์ ช่องว่าง และเครื่องหมาย (ดารุ้ล = ดารุล, เดอะมอลล์ บางกะปิ = เดอะมอลล์บางกะปิ) */
const geoKey=s=>String(s||'').toLowerCase().replace(/[็-๎]/g,'').replace(/[\s.,\-–()'"/]/g,'');
async function geoSuggest(q,signal){
  const nq=geoNorm(q);if(nq.length<3)return [];
  const P=geoParts(nq),vars=[nq];
  if(P.base){if(P.nums.length){vars.push('ซอย'+P.base+' '+P.nums.join(' แยก '));vars.push(P.base+' '+P.nums.join(' แยก '))}vars.push(P.base)}
  /* ค้นหลายแบบพร้อมกัน (ชื่อเต็ม / ซอย+เลข / ชื่อหลัก) แล้วรวม จัดอันดับเอง */
  const jobs=[...new Set(vars)].map(v=>geoQuery(v,signal).then(fs=>fs.map(f=>({f}))));
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
      if(x.type==='poi'||x.type==='house'||x.type==='pointaddress')sc+=1;
      sc+=x.bkk?3:-3;x.score=sc;return x});
  /* รวมผลซ้ำ: ชื่อเดียวกันห่างกันไม่ถึง ~150 ม. = ที่เดียวกัน (เก็บอันที่คะแนนสูง/ที่อยู่ละเอียดกว่า) */
  const near=(a,b,d=.0014)=>Math.abs(a.lat-b.lat)<d&&Math.abs(a.lng-b.lng)<d;
  const out=[];scored.sort((a,b)=>b.score-a.score||(b.sub||'').length-(a.sub||'').length).forEach(x=>{
    const k=geoKey(x.title);if(out.some(o=>geoKey(o.title)===k&&near(o,x,.004)))return;   /* ชื่อเดียวกันใน ~400 ม. = ที่เดียวกัน (ห้าง/หมู่บ้านใหญ่) */
    if(out.some(o=>o.label===x.label&&o.lat.toFixed(3)===x.lat.toFixed(3)))return;out.push(x)});
  /* ตัดผลที่ไม่เกี่ยวออก (คะแนนติดลบ หรือห่างจากอันดับ 1 มาก) แต่ถ้าไม่มีอะไรเลยก็ยังแสดงที่ใกล้เคียงที่สุด */
  const top=out.length?out[0].score:0,good=out.filter(x=>x.score>=0&&x.score>=top-14);
  let final=(good.length?good:out).slice(0,8);
  /* ซอยที่ยังไม่มีชื่อในแผนที่ OSM (เช่น "กรุงเทพกรีฑา 5"): ปักหมุดโดยประมาณใกล้ซอยข้างเคียง
     เลขซอยไทยเรียงตามถนน เลขคี่อยู่ฝั่งเดียวกัน เลขคู่อีกฝั่ง → หาซอยเลขใกล้สุดฝั่งเดียวกันก่อน */
  if(P.base&&P.nums.length===1){const N=+P.nums[0],want=[geoKey('ซอย'+P.base+N),geoKey(P.base+N)];
    if(N>0&&N<1000&&!final.some(x=>want.includes(geoKey(x.title)))){
      try{const near=await geoSoiNeighbour(P.base,N,signal);
        if(near)final=[{lat:near.lat,lng:near.lng,title:'ซอย'+P.base+' '+N,sub:'ยังไม่มีซอยนี้ในแผนที่ · ปักหมุดใกล้'+near.title+'ให้ก่อน แล้วลากให้ตรงบ้าน',
          label:'ซอย'+P.base+' '+N+(near.dist?' เขต'+near.dist:''),bkk:near.bkk,dist:near.dist,area:near.area,type:'approx',name:'',street:'ซอย'+P.base+' '+N,approx:true,score:99},...final].slice(0,8)}
      catch(e){if(e.name==='AbortError')throw e}}}
  return final;
}
async function geoSoiNeighbour(base,N,signal){
  const isSoi=(x,n)=>[geoKey('ซอย'+base+n),geoKey(base+n)].includes(geoKey(x.title));
  const find=async ns=>{const qs=[];ns.forEach(n=>{if(n>0)qs.push(['ซอย'+base+' '+n,n],[base+' '+n,n])});
    const res=await Promise.allSettled(qs.map(([q,n])=>geoQuery(q,signal,5).then(fs=>fs.map(f=>{const p=f.properties||{},L=geoLabel(p);
      return {n,lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],title:L.title,dist:p.district||'',area:p.locality||'',bkk:geoIsBkk(p)}}))));
    if(signal&&signal.aborted)throw new DOMException('aborted','AbortError');
    return [].concat(...res.filter(r=>r.status==='fulfilled').map(r=>r.value)).filter(x=>isSoi(x,x.n))};
  for(const step of [[N-2,N+2],[N-4,N+4],[N-1,N+1]]){const hits=await find(step);if(!hits.length)continue;
    const lo=hits.find(x=>x.n<N),hi=hits.find(x=>x.n>N);
    /* มีทั้งซอยก่อนและหลัง → กลางระหว่างสองซอย · มีด้านเดียว → ใกล้ซอยนั้น */
    if(lo&&hi&&Math.abs(lo.lat-hi.lat)<.02&&Math.abs(lo.lng-hi.lng)<.02)return {...lo,lat:(lo.lat+hi.lat)/2,lng:(lo.lng+hi.lng)/2,title:lo.title+' กับ '+hi.title.replace(/^ซอย/,'')};
    return lo||hi}
  /* ไม่เจอซอยข้างเคียงเลย → ปักที่ถนนหลัก */
  const road=(await geoQuery('ถนน'+base,signal,3).catch(()=>[])).map(f=>{const p=f.properties||{},L=geoLabel(p);return {lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],title:L.title,dist:p.district||'',area:p.locality||'',bkk:geoIsBkk(p)}})[0];
  return road||null}
async function geoReverseRaw(lat,lng){
  try{const f=((await photonGet(`/reverse?lat=${(+lat).toFixed(5)}&lon=${(+lng).toFixed(5)}&limit=1`)).features||[])[0];return f?f.properties||null:null}catch(e){return null}}
async function geoReverse(lat,lng){
  const p=await geoReverseRaw(lat,lng);return p?geoLabel(p).full:''
}
/* หาว่าหมุดอยู่ซอยไหน (ข้อมูล OpenStreetMap ล้วน ไม่มี API เสียเงิน)
   roads = ถนน/ซอยที่มีชื่อใกล้หมุด วัดระยะถึงเส้นถนนจริงจากแผนที่เวกเตอร์ที่โหลดอยู่ (pickmap.nearestRoads)
   + Photon reverse ให้ แขวง/เขต และ (ถ้าแผนที่ไม่มีข้อมูลถนน เช่น โหมดสำรอง) ชื่อถนนใกล้เคียง
   คืน {sois:[ชื่อ], cands:[{name,d}], area:แขวง, dist:เขต, bkk} */
function soiName(n){n=String(n||'').replace(/\s+/g,' ').trim();if(!n)return '';
  if(/^(ซอย|ตรอก|ถนน|ทางหลวง|ถ\.|ซ\.)/.test(n))return geoNorm(n);
  return /\d/.test(n)&&!/(ซอย|ถนน|ตรอก|ซ\.)/.test(n)?'ซอย'+n:n}
async function geoSoiAt(lat,lng,roads=[]){
  const la=(+lat).toFixed(5),ln=(+lng).toFixed(5);
  const [p,sts]=await Promise.all([geoReverseRaw(lat,lng),
    roads.length?Promise.resolve([]):photonGet(`/reverse?lat=${la}&lon=${ln}&limit=5&layer=street&radius=0.25`).then(j=>j.features||[]).catch(()=>[])]);
  const C=[];const add=(n,d)=>{n=soiName(n);if(!n)return;const k=geoKey(n),o=C.find(x=>geoKey(x.name)===k);
    if(o){if(d!=null&&(o.d==null||d<o.d))o.d=d}else C.push({name:n,d:d==null?null:Math.round(d)})};
  roads.forEach(r=>add(r.name,r.d));
  if(!roads.length){if(p&&p.street)add(p.street,null);if(p&&p.type==='street'&&p.name)add(p.name,null);sts.forEach(f=>{const q=f.properties||{};if(q.name)add(q.name,null)})}
  C.sort((x,y)=>(x.d??1e9)-(y.d??1e9));
  const clean=v=>String(v||'').replace(/^(แขวง|เขต)\s*/,'').trim();
  const dist=clean(p&&(p.district||p.county)),area=clean(p&&p.locality);
  return {sois:C.slice(0,4).map(x=>x.name),cands:C.slice(0,4),area:area!==dist?area:'',dist,
    bkk:/กรุงเทพ|bangkok/i.test((p&&p.city||'')+(p&&p.state||''))}}
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
