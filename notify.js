/* ---------- กระดิ่งแจ้งเตือน: ข่าวสาร / ความรู้ป้องกันเบื้องต้น / ลิงก์ + แจ้งเมื่อคำขอของฉันเปลี่ยนสถานะ ----------
 * ข่าวสารอยู่ในไฟล์ news.json (แก้แล้ว push ขึ้นเว็บ ทุกเครื่องเห็นภายในไม่กี่นาที)
 * การแจ้งเตือนเคส: เทียบสถานะล่าสุดของ "คำขอของฉัน" (เก็บในเครื่อง) กับรายการเคส ถ้าเปลี่ยน → เพิ่มการ์ด + toast */
(function(){
  const NV={items:[]},AL={list:[],at:0,ok:true};let open=false;
  const seen=()=>new Set(store.json('uh_nt_seen',[])||[]);
  const events=()=>store.json('uh_nt_ev',[])||[];
  const TONE={red:'#E5383B',blue:'#2D6BF5',green:'#1F9D60',violet:'#7A5AF8',amber:'#E09A00'};
  const ST_TONE={open:'blue',going:'amber',done:'green',skip:'violet'};
  const ST_MSG={going:'ทีมอาสารับเคสแล้ว กำลังเดินทางไปหา',done:'ทีมอาสาช่วยเหลือเรียบร้อยแล้ว',open:'กลับมารอทีมอาสาอีกครั้ง',skip:'ทีมปิดเคสนี้แล้ว (ไม่เข้าเกณฑ์) ถ้ายังต้องการความช่วยเหลือ แจ้งใหม่ได้'};
  const when=t=>{const d=(Date.now()-t)/60000;return d<1?'เมื่อสักครู่':d<60?Math.round(d)+' นาทีที่แล้ว':d<1440?Math.round(d/60)+' ชม.ที่แล้ว':new Date(t).toLocaleDateString('th-TH',{day:'numeric',month:'short'})};

  /* ---- ตรวจสถานะคำขอของฉัน ---- */
  function checkMine(){if(!S.loaded)return;const prev=store.json('uh_nt_st',{})||{},next={...prev};let ev=events(),added=0;
    (myReqs()||[]).forEach(m=>{const c=S.cases.find(c=>String(c.id)===String(m.id));if(!c||!c.status)return;next[m.id]=c.status;
      const p=prev[m.id];if(p&&p!==c.status){const id='case-'+m.id+'-'+c.status;if(!ev.some(e=>e.id===id)){ev.unshift({id,t:Date.now(),case:m.id,status:c.status,needs:(m.needs||[]).join(', ')});added++;
        toast('คำขอ #'+m.id+': '+(STATUS_TH[c.status]||c.status))}}});
    store.put('uh_nt_st',next);if(added)store.put('uh_nt_ev',ev.slice(0,30));badge()}
  const _rm=window.renderMyReq;if(typeof _rm==='function')window.renderMyReq=function(){const r=_rm.apply(this,arguments);try{checkMine()}catch(e){}return r};

  /* ---- ข่าวสาร ---- */
  async function loadNews(){try{const j=await fetch('./news.json?t='+Math.floor(Date.now()/300000),{cache:'no-cache'}).then(r=>r.json());if(j&&Array.isArray(j.items))NV.items=j.items}catch(e){}badge();if(open)render()}
  async function loadAlerts(){for(const b of (typeof EDGE_BASES!=='undefined'?EDGE_BASES:['/api'])){try{const j=await fetch(b+'/alerts?t='+Math.floor(Date.now()/120000)).then(r=>r.json());if(j&&Array.isArray(j.alerts)){AL.list=j.alerts;AL.at=j.at||Date.now();AL.ok=true;badge();if(open)render();return}}catch(e){}}AL.ok=false;if(open)render()}
  function unread(){const s=seen();return NV.items.filter(x=>!s.has(x.id)).length+events().filter(e=>!s.has(e.id)).length+AL.list.filter(a=>!s.has(a.id)).length}
  function badge(){const b=$('#bell-badge');if(!b)return;const n=unread();b.hidden=!n;b.textContent=n>9?'9+':n;$('#home-bell-btn').setAttribute('aria-label','การแจ้งเตือน'+(n?' ยังไม่อ่าน '+n+' รายการ':''))}

  /* ---- วาดแผง ---- */
  const card=(x,cls='')=>{const tone=TONE[x.tone]||TONE.blue,isNew=!seen().has(x.id);
    const act=x.url?`<a class="nt-act" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label||'เปิดลิงก์')}${ic('ext')}</a>`:x.go?`<button type="button" class="nt-act" data-ntgo="${esc(x.go)}">${esc(x.label||'เปิด')}${ic('next')}</button>`:x.case?`<button type="button" class="nt-act" data-ntcase="${esc(x.case)}">ดูคำขอ${ic('next')}</button>`:'';
    return `<article class="nt-card ${cls}" style="--tc:${tone}"><header><span class="nt-ic">${ic(x.icon||'info')}</span><span class="nt-k">${esc(x.kicker||'')}</span>${isNew?'<i class="nt-new" aria-label="ใหม่"></i>':''}</header><h3>${esc(x.title)}</h3>${x.body?`<p>${esc(x.body)}</p>`:''}${act}</article>`};
  const SEV={Extreme:['#C81E1E','รุนแรงมาก'],Severe:['#E5383B','รุนแรง'],Moderate:['#F07B14','ปานกลาง'],Minor:['#D9A400','เฝ้าระวัง']};
  const alertCard=a=>{const [col,lv]=SEV[a.severity]||['#2D6BF5',''],isNew=!seen().has(a.id),ar=a.areas||[],more=ar.length>6?ar.length-6:0,quake=/^eq-/.test(a.id);
    return `<article class="nt-card is-stack is-alert" style="--tc:${col}"><header><span class="nt-ic">${ic(quake?'alert':/ลม|พายุ/.test(a.event)?'wave':'rain')}</span><span class="nt-k">${esc(a.src)} · ${when(a.sent)}</span>${lv?`<span class="nt-sev">${lv}</span>`:''}${isNew?'<i class="nt-new" aria-label="ใหม่"></i>':''}</header>
      <h3>${esc(a.event)}${a.title&&a.title!==a.event?` <small>${esc(a.title)}</small>`:''}</h3>${a.desc?`<p class="nt-clamp">${esc(a.desc)}</p>`:''}
      ${ar.length?`<div class="nt-areas">${ar.slice(0,6).map(x=>`<span>${esc(x)}</span>`).join('')}${more?`<span>+${more}</span>`:''}</div>`:''}
      ${a.url?`<a class="nt-act" href="${esc(a.url)}" target="_blank" rel="noopener">รายละเอียด${ic('ext')}</a>`:''}</article>`};
  function render(){const box=$('#nt-body');if(!box)return;
    const pins=NV.items.filter(x=>x.pin),rest=NV.items.filter(x=>!x.pin);
    const evs=events().map(e=>({id:e.id,icon:'bell',tone:ST_TONE[e.status]||'blue',kicker:'คำขอของฉัน · '+when(e.t),title:'#'+e.case+' '+(STATUS_TH[e.status]||e.status),body:(ST_MSG[e.status]||'')+(e.needs?' · '+e.needs:''),case:e.case}));
    const kick=x=>({...x,kicker:x.type==='tip'?'ป้องกันเบื้องต้น':x.type==='link'?'ลิงก์ที่มีประโยชน์':'ข่าวสาร'+(x.date?' · '+new Date(x.date).toLocaleDateString('th-TH',{day:'numeric',month:'short'}):'')});
    const al=AL.list,live=AL.at?new Date(AL.at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}):'';
    const stackCards=al.length?al.map(alertCard).join(''):`<article class="nt-card is-stack" style="--tc:#1F9D60"><header><span class="nt-ic">${ic('check')}</span><span class="nt-k">${AL.ok?'กรมอุตุนิยมวิทยา · USGS':'ยังเชื่อมต่อแหล่งข่าวไม่ได้'}</span></header><h3>${AL.ok?'ยังไม่มีประกาศเตือนภัยในขณะนี้':'กำลังลองโหลดใหม่…'}</h3><p>ระบบตรวจประกาศเตือนภัยจากกรมอุตุนิยมวิทยาและรายงานแผ่นดินไหวให้อัตโนมัติทุก 5 นาที</p></article>`;
    box.innerHTML=`<div class="nt-live"><b>เตือนภัยทั่วประเทศ</b><span><i></i>สด${live?' · '+live+' น.':''}</span></div><section class="nt-stack-wrap" aria-label="ประกาศเตือนภัย (ปัดขึ้นลงเพื่อดูประกาศถัดไป)"><div class="nt-stack" id="nt-stack" tabindex="0">${stackCards}</div>${al.length>1?`<div class="nt-dots" aria-hidden="true">${al.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</section>`+
      (pins.length?pins.map(x=>card(kick(x),'is-row')).join(''):'')+
      `<h2 class="nt-h">คำขอของฉัน</h2>`+(evs.length?evs.map(x=>card(x,'is-row')).join(''):`<p class="nt-empty">${ic('check')}${myReqs().length?'ยังไม่มีการเปลี่ยนสถานะ ระบบจะแจ้งที่นี่ทันทีเมื่อทีมรับเคสหรือช่วยเสร็จ':'ส่งคำขอแล้วจะเห็นการแจ้งเตือนสถานะที่นี่'}</p>`)+
      (rest.length?`<h2 class="nt-h">ข่าวสารและลิงก์</h2>`+rest.map(x=>card(kick(x),'is-row')).join(''):'');
    const st=$('#nt-stack');if(st){const dots=[...box.querySelectorAll('.nt-dots i')];st.addEventListener('scroll',()=>{const i=Math.round(st.scrollTop/st.clientHeight);dots.forEach((d,k)=>d.classList.toggle('on',k===i))},{passive:true})}}
  function show(v){open=v;const p=$('#nt-panel');p.hidden=!v;document.body.classList.toggle('nt-open',v);
    if(v){render();loadAlerts();requestAnimationFrame(()=>p.classList.add('in'));const s=seen();NV.items.forEach(x=>s.add(x.id));AL.list.forEach(a=>s.add(a.id));events().forEach(e=>s.add(e.id));store.put('uh_nt_seen',[...s].slice(-300));badge();$('#nt-close').focus()}
    else{p.classList.remove('in');$('#home-bell-btn').focus()}}
  document.addEventListener('click',e=>{if(e.target.closest('#home-bell-btn'))return show(true);if(!open)return;
    if(e.target.closest('#nt-close')||e.target.id==='nt-panel')return show(false);
    const g=e.target.closest('[data-ntgo]');if(g){show(false);go(g.dataset.ntgo);return}
    const c=e.target.closest('[data-ntcase]');if(c){show(false);go('home');setTimeout(()=>{const b=$('#my-req');b&&!b.hidden&&b.scrollIntoView({behavior:'smooth',block:'nearest'})},300)}});
  document.addEventListener('keydown',e=>{if(open&&e.key==='Escape')show(false)});
  loadNews();loadAlerts();setInterval(loadNews,10*60000);setInterval(loadAlerts,5*60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){loadNews();loadAlerts()}});
  try{checkMine()}catch(e){}
})();
