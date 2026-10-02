/* ค้นหาที่อยู่ด้วย Photon (photon.komoot.io): แนะนำเมื่อพิมพ์ 3 ตัวอักษรขึ้นไป (หน่วง 350ms)
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
    const w=t.replace(/^(ซอย|ถนน|ตรอก|แขวง|เขต)/,'');if(!w||GEO_STOP.test(t)||GEO_STOP.test(w))return;
    const m=w.match(/^(.*?[^\d\s])(\d+)$/);if(m){words.push(m[1]);nums.push(m[2])}else if(!/^\d/.test(w))words.push(w)});
  return {base:words.sort((x,y)=>y.length-x.length)[0]||'',words,nums}}
async function geoQuery(q,signal,limit=10){
  const u=`${GEO.url}/api/?limit=${limit}&lang=default&lat=${GEO.bkk.lat}&lon=${GEO.bkk.lng}&location_bias_scale=0.4&bbox=${GEO.bbox}&q=${encodeURIComponent(q)}`;
  const r=await fetch(u,{signal});if(!r.ok)throw new Error('geo '+r.status);return (await r.json()).features||[]}
async function geoSuggest(q,signal){
  const nq=geoNorm(q);if(nq.length<3)return [];
  const P=geoParts(nq),vars=[nq];
  if(P.base){if(P.nums.length)vars.push('ซอย'+P.base+' '+P.nums[0]);vars.push(P.base)}
  const res=await Promise.allSettled([...new Set(vars)].map(v=>geoQuery(v,signal)));
  if(signal&&signal.aborted)throw new DOMException('aborted','AbortError');
  const feats=[].concat(...res.filter(x=>x.status==='fulfilled').map(x=>x.value));
  if(!feats.length&&res.every(x=>x.status==='rejected'))throw res[0].reason;
  const seen=new Set();
  return feats.filter(f=>{const p=f.properties||{};return !p.countrycode||p.countrycode==='TH'}).map(f=>{const p=f.properties||{},L=geoLabel(p);
    return {lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],title:L.title,sub:L.sub,label:L.full,bkk:geoIsBkk(p),dist:p.district||'',area:p.locality||'',type:p.type||'',name:p.name||'',street:p.street||''}})
    .filter(x=>{const k=x.label+'|'+x.lat.toFixed(3);if(!x.title||seen.has(k))return false;seen.add(k);return true})
    .map(x=>{const hay=(x.title+' '+x.sub).replace(/\s+/g,''),own=x.title.match(/\d+/g)||[];let sc=0;
      P.words.forEach(w=>{if(hay.includes(w))sc+=w===P.base?6:2});
      P.nums.forEach((n,i)=>{if(own.includes(n))sc+=i===0?4:2});
      if(P.nums.length&&own.length&&!own.includes(P.nums[0]))sc-=2;   /* เลขซอยไม่ตรง */
      if(P.base&&!hay.includes(P.base))sc-=5;                           /* ไม่มีชื่อหลักเลย */
      sc+=x.bkk?3:-3;x.score=sc;return x})
    .sort((a,b)=>b.score-a.score).slice(0,8);
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
