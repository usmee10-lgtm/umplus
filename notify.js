/* ---------- กระดิ่งแจ้งเตือน: ข่าวสาร / ความรู้ป้องกันเบื้องต้น / ลิงก์ + แจ้งเมื่อคำขอของฉันเปลี่ยนสถานะ ----------
 * ข่าวสารอยู่ในไฟล์ news.json (แก้แล้ว push ขึ้นเว็บ ทุกเครื่องเห็นภายในไม่กี่นาที)
 * การแจ้งเตือนเคส: เทียบสถานะล่าสุดของ "คำขอของฉัน" (เก็บในเครื่อง) กับรายการเคส ถ้าเปลี่ยน → เพิ่มการ์ด + toast */
(function(){
  const NV={items:[]},AL={list:[],at:0,ok:true},NW={items:[],at:0,ok:true};let open=false;
  /* ภาคตามการแบ่งของกรมอุตุนิยมวิทยา (ใช้จับคู่กับพื้นที่ในประกาศเตือนภัย) */
  const REG=[
    ['north','เหนือ',['เชียงราย','เชียงใหม่','น่าน','พะเยา','แพร่','แม่ฮ่องสอน','ลำปาง','ลำพูน','อุตรดิตถ์','ตาก','สุโขทัย','พิษณุโลก','พิจิตร','กำแพงเพชร','เพชรบูรณ์','นครสวรรค์','อุทัยธานี']],
    ['ne','อีสาน',['เลย','หนองคาย','บึงกาฬ','หนองบัวลำภู','อุดรธานี','สกลนคร','นครพนม','มุกดาหาร','ขอนแก่น','กาฬสินธุ์','มหาสารคาม','ร้อยเอ็ด','ชัยภูมิ','นครราชสีมา','บุรีรัมย์','สุรินทร์','ศรีสะเกษ','ยโสธร','อำนาจเจริญ','อุบลราชธานี'],'ตะวันออกเฉียงเหนือ'],
    ['central','กลาง',['ชัยนาท','ลพบุรี','สิงห์บุรี','อ่างทอง','สระบุรี','พระนครศรีอยุธยา','สุพรรณบุรี','นครนายก','กาญจนบุรี','ราชบุรี','สมุทรสงคราม']],
    ['bkk','กทม.–ปริมณฑล',['กรุงเทพมหานคร','นนทบุรี','ปทุมธานี','สมุทรปราการ','สมุทรสาคร','นครปฐม'],'กรุงเทพ'],
    ['east','ตะวันออก',['ปราจีนบุรี','สระแก้ว','ฉะเชิงเทรา','ชลบุรี','ระยอง','จันทบุรี','ตราด']],
    ['se','ใต้ฝั่งตะวันออก',['เพชรบุรี','ประจวบคีรีขันธ์','ชุมพร','สุราษฎร์ธานี','นครศรีธรรมราช','พัทลุง','สงขลา','ปัตตานี','ยะลา','นราธิวาส']],
    ['sw','ใต้ฝั่งตะวันตก',['ระนอง','พังงา','ภูเก็ต','กระบี่','ตรัง','สตูล']]];
  const SEVR={Extreme:4,Severe:3,Moderate:2,Minor:1};
  /* จังหวัด → ประกาศที่ครอบคลุม (รองรับประกาศระดับภาค เช่น "ภาคใต้ (ฝั่งตะวันออก)") */
  function provMap(){const m={};AL.list.filter(a=>!/^eq-/.test(a.id)).forEach(a=>{(a.areas||[]).forEach(ar=>{const t=ar.replace(/\s+/g,'');
      let hit=[];REG.forEach(([k,,ps,alias])=>{if(/^ภาค/.test(t)){const nm=t.replace(/^ภาค/,'');if((k==='se'&&/ใต้.*ตะวันออก/.test(nm))||(k==='sw'&&/ใต้.*ตะวันตก/.test(nm))||((k==='se'||k==='sw')&&nm==='ใต้')||(k==='north'&&/^เหนือ/.test(nm))||(k==='ne'&&/ตะวันออกเฉียงเหนือ|อีสาน/.test(nm))||(k==='central'&&/^กลาง/.test(nm))||(k==='east'&&/^ตะวันออก($|\()/.test(nm)))hit.push(...ps)}
        else{ps.forEach(p=>{if(t.includes(p)||(alias&&t.includes(alias)&&p==='กรุงเทพมหานคร'))hit.push(p)})}});
      hit.forEach(p=>{const cur=m[p];if(!cur||(SEVR[a.severity]||0)>(SEVR[cur.severity]||0))m[p]=a})})});return m}
  let REGSEL=store.get('uh_nt_reg','');
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
  async function loadNewsFeed(){for(const b of (typeof EDGE_BASES!=='undefined'?EDGE_BASES:['/api'])){try{const j=await fetch(b+'/news?t='+Math.floor(Date.now()/300000)).then(r=>r.json());if(j&&j.ok&&Array.isArray(j.items)){NW.items=j.items;NW.at=j.at;NW.ok=true;if(open)render();return}}catch(e){}}NW.ok=false;if(open)render()}
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
    const tips=NV.items.filter(x=>x.type==='tip'),links=NV.items.filter(x=>x.type!=='tip');
    const evs=events().map(e=>({id:e.id,icon:'bell',tone:ST_TONE[e.status]||'blue',kicker:'คำขอของฉัน · '+when(e.t),title:'#'+e.case+' '+(STATUS_TH[e.status]||e.status),body:(ST_MSG[e.status]||'')+(e.needs?' · '+e.needs:''),case:e.case}));
    const hm=t=>t?new Date(t).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}):'';
    /* 1) ข่าวภัยพิบัติ (สไลด์ขึ้นลง) */
    const news=NW.items.slice(0,8);
    const newsCards=news.length?news.map(n=>`<a class="nt-card is-stack is-news" href="${esc(n.url)}" target="_blank" rel="noopener"><header><span class="nt-ic" style="background:#E5383B">${ic('info')}</span><span class="nt-k">${esc(n.source||'ข่าว')} · ${when(n.t)}</span>${seen().has(n.id)?'':'<i class="nt-new" aria-label="ใหม่"></i>'}</header><h3 class="nt-clamp3">${esc(n.title)}</h3><span class="nt-more">อ่านข่าว${ic('ext')}</span></a>`).join('')
      :`<article class="nt-card is-stack" style="--tc:#8A90A6"><header><span class="nt-ic">${ic('info')}</span><span class="nt-k">ข่าวภัยพิบัติ</span></header><h3>${NW.ok?'กำลังโหลดข่าวล่าสุด…':'ยังโหลดข่าวไม่ได้ ลองใหม่อีกครั้งภายหลัง'}</h3></article>`;
    /* 2) เตือนภัยรายภาค */
    const pm=provMap(),eq=AL.list.filter(a=>/^eq-/.test(a.id));
    const cnt=REG.map(([k,,ps])=>ps.filter(p=>pm[p]).length);
    if(!REGSEL||!REG.some(r=>r[0]===REGSEL)){const i=cnt.indexOf(Math.max(...cnt));REGSEL=REG[i>=0?i:0][0]}
    const R=REG.find(r=>r[0]===REGSEL),warned=R[2].filter(p=>pm[p]);
    const evNames=[...new Set(warned.map(p=>pm[p].event))];
    const chip=p=>{const a=pm[p];if(!a)return `<span class="pv">${esc(p)}</span>`;const [col]=SEV[a.severity]||['#2D6BF5'];return `<span class="pv on" style="--pc:${col}" title="${esc(a.event)}">${esc(p)}</span>`};
    const regionCard=`<section class="nt-region" aria-labelledby="nt-reg-h">
      <div class="nr-top"><h2 id="nt-reg-h">เตือนภัยรายภาค</h2><span class="nr-live"><i></i>สด${AL.at?' · '+hm(AL.at)+' น.':''}</span></div>
      <div class="nr-tabs" role="tablist">${REG.map(([k,nm],i)=>`<button type="button" role="tab" aria-selected="${k===REGSEL}" data-ntreg="${k}">${esc(nm)}${cnt[i]?`<b>${cnt[i]}</b>`:''}</button>`).join('')}</div>
      <p class="nr-sum">${warned.length?`<b style="color:${(SEV[pm[warned[0]].severity]||['#E5383B'])[0]}">${esc(evNames.join(' · '))}</b> ${warned.length} จาก ${R[2].length} จังหวัด`:`${ic('check')}ภาค${esc(R[1])} ยังไม่มีประกาศเตือนภัย`}</p>
      <div class="nr-grid">${R[2].map(chip).join('')}</div>
      ${eq.length?`<a class="nr-eq" href="${esc(eq[0].url)}" target="_blank" rel="noopener">${ic('alert')}<span><b>${esc(eq[0].title)}</b><small>${esc(eq[0].desc)} · ${when(eq[0].sent)}</small></span>${ic('ext')}</a>`:''}
      <p class="nr-src">ที่มา: กรมอุตุนิยมวิทยา${eq.length?' · USGS':''} · อัปเดตทุก 5 นาที · <a href="https://www.tmd.go.th" target="_blank" rel="noopener">tmd.go.th</a></p></section>`;
    /* 3) ความรู้ป้องกัน (วิดเจ็ตเล็ก 2 คอลัมน์) 4) ลิงก์ (รายการ) */
    const tipW=tips.map(x=>`<article class="nt-mini" style="--tc:${TONE[x.tone]||TONE.blue}"><span class="nt-ic">${ic(x.icon||'info')}</span><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`).join('');
    const linkL=links.map(x=>{const inner=`<span class="nt-ic" style="--tc:${TONE[x.tone]||TONE.blue}">${ic(x.icon||'info')}</span><span class="nl-t"><b>${esc(x.title)}</b><small>${esc(x.url?x.label||'':x.body||'')}</small></span>${ic(x.url?'ext':'next')}`;
      return x.url?`<a class="nl-row" href="${esc(x.url)}" target="_blank" rel="noopener">${inner}</a>`:`<button type="button" class="nl-row" data-ntgo="${esc(x.go||'emergency')}">${inner}</button>`}).join('');
    box.innerHTML=`<div class="nt-live"><b>ข่าวภัยพิบัติล่าสุด</b><span><i></i>สด${NW.at?' · '+hm(NW.at)+' น.':''}</span></div>
      <section class="nt-stack-wrap" aria-label="ข่าวภัยพิบัติ (ปัดขึ้นลงเพื่อดูข่าวถัดไป)"><div class="nt-stack" id="nt-stack" tabindex="0">${newsCards}</div>${news.length>1?`<div class="nt-dots" aria-hidden="true">${news.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</section>
      ${regionCard}
      <h2 class="nt-h">คำขอของฉัน</h2>${evs.length?evs.map(x=>card(x,'is-row')).join(''):`<p class="nt-empty">${ic('check')}${myReqs().length?'ยังไม่มีการเปลี่ยนสถานะ ระบบจะแจ้งที่นี่ทันทีเมื่อทีมรับเคสหรือช่วยเสร็จ':'ส่งคำขอแล้วจะเห็นการแจ้งเตือนสถานะที่นี่'}</p>`}
      ${tipW?`<h2 class="nt-h">ป้องกันเบื้องต้น</h2><div class="nt-minis">${tipW}</div>`:''}
      ${linkL?`<h2 class="nt-h">ลิงก์ที่มีประโยชน์</h2><div class="nt-links">${linkL}</div>`:''}`;
    const sel=box.querySelector('.nr-tabs [aria-selected=true]');if(sel){const tb=sel.parentNode;tb.scrollLeft=sel.offsetLeft-tb.clientWidth/2+sel.offsetWidth/2}
    const st=$('#nt-stack');if(st){const dots=[...box.querySelectorAll('.nt-dots i')];st.addEventListener('scroll',()=>{const i=Math.round(st.scrollTop/st.clientHeight);dots.forEach((d,k)=>d.classList.toggle('on',k===i))},{passive:true})}}
  function show(v){open=v;const p=$('#nt-panel');p.hidden=!v;document.body.classList.toggle('nt-open',v);
    if(v){render();loadAlerts();loadNewsFeed();requestAnimationFrame(()=>p.classList.add('in'));const s=seen();NV.items.forEach(x=>s.add(x.id));AL.list.forEach(a=>s.add(a.id));NW.items.forEach(n=>s.add(n.id));events().forEach(e=>s.add(e.id));store.put('uh_nt_seen',[...s].slice(-300));badge();$('#nt-close').focus()}
    else{p.classList.remove('in');$('#home-bell-btn').focus()}}
  document.addEventListener('click',e=>{if(e.target.closest('#home-bell-btn'))return show(true);if(!open)return;
    if(e.target.closest('#nt-close')||e.target.id==='nt-panel')return show(false);
    const g=e.target.closest('[data-ntgo]');if(g){show(false);go(g.dataset.ntgo);return}
    const rg=e.target.closest('[data-ntreg]');if(rg){REGSEL=rg.dataset.ntreg;store.set('uh_nt_reg',REGSEL);const y=$('#nt-body').scrollTop;render();$('#nt-body').scrollTop=y;return}
    const c=e.target.closest('[data-ntcase]');if(c){show(false);go('home');setTimeout(()=>{const b=$('#my-req');b&&!b.hidden&&b.scrollIntoView({behavior:'smooth',block:'nearest'})},300)}});
  document.addEventListener('keydown',e=>{if(open&&e.key==='Escape')show(false)});
  loadNews();loadAlerts();setInterval(loadNews,10*60000);setInterval(loadAlerts,5*60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){loadNews();loadAlerts()}});
  try{checkMine()}catch(e){}
})();
