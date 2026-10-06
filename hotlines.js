const hotlineGroups = [
  {id:'urgent',title:'แจ้งเหตุเร่งด่วน'},
  {id:'rescue',title:'กู้ชีพและกู้ภัย'},
  {id:'power',title:'ไฟฟ้า'},
  {id:'travel',title:'เส้นทางและการเดินทาง'},
  {id:'other',title:'ความช่วยเหลืออื่น'}
];
const prdSource='https://www.prd.go.th/th/content/category/detail/id/9/iid/244070?id=2467&search=&season=&start=';
const hotlines = [
  {number:'1669',org:'niems',name:'เจ็บป่วยฉุกเฉิน',agency:'สถาบันการแพทย์ฉุกเฉินแห่งชาติ',note:'ติดต่อบริการการแพทย์ฉุกเฉิน',group:'urgent',source:'https://www.niems.go.th/',sourceName:'สพฉ.'},
  {number:'1555',org:'bma',name:'แจ้งเหตุและร้องทุกข์ กทม.',agency:'กรุงเทพมหานคร',note:'ประสานปัญหาและเหตุในพื้นที่กรุงเทพฯ',group:'urgent',source:prdSource,sourceName:'กรมประชาสัมพันธ์'},
  {number:'1784',org:'ddpm',name:'แจ้งสาธารณภัย',agency:'กรมป้องกันและบรรเทาสาธารณภัย',note:'สายด่วนนิรภัย · ปภ.',group:'urgent',source:'https://www.disaster.go.th/contact/map',sourceName:'ปภ.'},
  {number:'191',org:'police',name:'เหตุด่วนเหตุร้าย',agency:'สำนักงานตำรวจแห่งชาติ',note:'แจ้งเหตุกับเจ้าหน้าที่ตำรวจ',group:'urgent',source:prdSource,sourceName:'กรมประชาสัมพันธ์'},
  {number:'1199',org:'md',name:'สายด่วนกรมเจ้าท่า',agency:'กรมเจ้าท่า',note:'ติดต่อเรื่องการเดินทางและเหตุทางน้ำ',group:'rescue',source:'https://md.go.th/',sourceName:'กรมเจ้าท่า'},
  {number:'1418',org:'ptt',name:'สายด่วนป่อเต็กตึ๊ง',agency:'มูลนิธิป่อเต็กตึ๊ง',note:'ประสานความช่วยเหลือกู้ชีพและกู้ภัย',group:'rescue',source:prdSource,sourceName:'กรมประชาสัมพันธ์'},
  {number:'1554',org:'vajira',name:'หน่วยแพทย์กู้ชีวิต วชิรพยาบาล',agency:'โรงพยาบาลวชิรพยาบาล',note:'บริการการแพทย์ฉุกเฉินในกรุงเทพฯ',group:'rescue',source:'https://vajirafoundation.org/index.php/post08/',sourceName:'มูลนิธิวชิรพยาบาล'},
  {number:'1130',org:'mea',name:'การไฟฟ้านครหลวง',agency:'MEA',note:'กรุงเทพฯ นนทบุรี และสมุทรปราการ',group:'power',source:'https://eservice.mea.or.th/new_eservice/index.php?st=100',sourceName:'การไฟฟ้านครหลวง'},
  {number:'1129',org:'pea',name:'การไฟฟ้าส่วนภูมิภาค',agency:'PEA',note:'สอบถามและแจ้งปัญหาในพื้นที่บริการ PEA',group:'power',source:'https://www.pea.co.th/news/corporate-news/1918',sourceName:'การไฟฟ้าส่วนภูมิภาค'},
  {number:'1543',org:'exat',name:'การทางพิเศษแห่งประเทศไทย',agency:'EXAT',note:'ติดต่อเรื่องทางด่วน / ทางพิเศษ',group:'travel',source:prdSource,sourceName:'กรมประชาสัมพันธ์'},
  {number:'1586',org:'doh',name:'กรมทางหลวง',agency:'กรมทางหลวง',note:'สอบถามเส้นทางในความรับผิดชอบ',group:'travel',source:'https://tdmc.mot.go.th/',sourceName:'กระทรวงคมนาคม'},
  {number:'1146',org:'drr',name:'กรมทางหลวงชนบท',agency:'กรมทางหลวงชนบท',note:'สอบถามเส้นทางในความรับผิดชอบ',group:'travel',source:'https://tdmc.mot.go.th/',sourceName:'กระทรวงคมนาคม'},
  {number:'1193',org:'police',name:'ตำรวจทางหลวง',agency:'กองบังคับการตำรวจทางหลวง',note:'ติดต่อเจ้าหน้าที่ตำรวจทางหลวง',group:'travel',source:prdSource,sourceName:'กรมประชาสัมพันธ์'},
  {number:'1584',org:'dlt',name:'ร้องเรียนรถโดยสารสาธารณะ',agency:'กรมการขนส่งทางบก',note:'ศูนย์คุ้มครองผู้โดยสารรถสาธารณะ',group:'travel',source:'https://datagov.mot.go.th/dataset/1584',sourceName:'กระทรวงคมนาคม'},
  {number:'1137',org:'js100',name:'จส.100',agency:'สถานีวิทยุ จส.100',note:'แจ้งเหตุและประสานงานบนท้องถนน',group:'travel',source:prdSource,sourceName:'กรมประชาสัมพันธ์'},
  {number:'1300',org:'msdhs',name:'ศูนย์ช่วยเหลือสังคม',agency:'กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์',note:'แจ้งปัญหาสังคมและขอรับความช่วยเหลือ',group:'other',source:'https://www.thangrath.go.th/feature/thangrat-hotline-1300/',sourceName:'ทางรัฐ'},
  {number:'1155',org:'police',name:'ตำรวจท่องเที่ยว',agency:'กองบัญชาการตำรวจท่องเที่ยว',note:'ประสานเหตุที่เกี่ยวข้องกับนักท่องเที่ยว',group:'other',source:prdSource,sourceName:'กรมประชาสัมพันธ์'},
  {number:'1192',org:'police',name:'ศูนย์รับแจ้งรถหาย',agency:'สำนักงานตำรวจแห่งชาติ',note:'แจ้งกรณีรถถูกโจรกรรม',group:'other',source:prdSource,sourceName:'กรมประชาสัมพันธ์'}
];
/* หน่วยงาน: โลโก้ + ชื่อย่อ + สีประจำ · ถ้าโหลดโลโก้ไม่ได้จะแสดงป้ายตัวย่อสีประจำหน่วยงานแทน
 * ใส่โลโก้เองได้: วางไฟล์ไว้ที่ assets/logos/ แล้วแก้ logo:'./assets/logos/ชื่อไฟล์.png' */
const WM='https://commons.wikimedia.org/wiki/Special:FilePath/';
const hlOrgs={
  niems:{name:'สถาบันการแพทย์ฉุกเฉินแห่งชาติ',abbr:'สพฉ.',color:'#D7263D',about:'ส่งรถพยาบาลและทีมแพทย์ฉุกเฉินทั่วประเทศ'},
  bma:{name:'กรุงเทพมหานคร',abbr:'กทม.',color:'#0F7B3F',logo:WM+'Seal_Bangkok_Metropolitan_Admin_(green).svg?width=128',about:'รับแจ้งเหตุ น้ำท่วม ท่อตัน และเรื่องร้องทุกข์ในกรุงเทพฯ'},
  ddpm:{name:'กรมป้องกันและบรรเทาสาธารณภัย',abbr:'ปภ.',color:'#E8730C',about:'แจ้งภัยพิบัติ น้ำท่วม และขอรับความช่วยเหลือผู้ประสบภัย'},
  police:{name:'สำนักงานตำรวจแห่งชาติ',abbr:'ตร.',color:'#7A1F1F',logo:WM+'Emblem_of_Royal_Thai_Police.svg?width=128',about:'แจ้งเหตุด่วนเหตุร้าย ตำรวจทางหลวง ตำรวจท่องเที่ยว'},
  md:{name:'กรมเจ้าท่า',abbr:'จท.',color:'#0B3C7A',about:'เหตุทางน้ำ เรือ และการเดินทางทางน้ำ'},
  ptt:{name:'มูลนิธิป่อเต็กตึ๊ง',abbr:'ป่อเต็กตึ๊ง',color:'#C8102E',about:'อาสากู้ภัย กู้ชีพ ช่วยผู้ประสบภัย'},
  vajira:{name:'โรงพยาบาลวชิรพยาบาล',abbr:'วชิร',color:'#0E7490',about:'หน่วยแพทย์กู้ชีวิต การแพทย์ฉุกเฉินในกรุงเทพฯ'},
  mea:{name:'การไฟฟ้านครหลวง',abbr:'MEA',color:'#F26F21',about:'ไฟดับ ไฟรั่ว เสาไฟล้ม ในกรุงเทพฯ นนทบุรี สมุทรปราการ'},
  pea:{name:'การไฟฟ้าส่วนภูมิภาค',abbr:'PEA',color:'#6B2C91',about:'ไฟดับ ไฟรั่ว ในพื้นที่ต่างจังหวัด'},
  exat:{name:'การทางพิเศษแห่งประเทศไทย',abbr:'กทพ.',color:'#0055A5',logo:WM+'Emblem_of_the_Expressway_Authority_of_Thailand.svg?width=128',about:'เหตุบนทางด่วน ทางพิเศษ'},
  doh:{name:'กรมทางหลวง',abbr:'ทล.',color:'#D35400',about:'ถนนทางหลวง เส้นทางน้ำท่วม เส้นทางเลี่ยง'},
  drr:{name:'กรมทางหลวงชนบท',abbr:'ทช.',color:'#1F8A4C',about:'ถนนทางหลวงชนบท สะพาน เส้นทางเลี่ยง'},
  dlt:{name:'กรมการขนส่งทางบก',abbr:'ขบ.',color:'#1D4E9E',about:'ร้องเรียนรถโดยสารสาธารณะ'},
  js100:{name:'สถานีวิทยุ จส.100',abbr:'จส.100',color:'#E4002B',about:'แจ้งเหตุบนถนน รถเสีย ประสานความช่วยเหลือ'},
  msdhs:{name:'กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์',abbr:'พม.',color:'#5B2C83',logo:WM+'Seal_of_the_Ministry_of_Social_Development_and_Human_Security_(Thailand),_coloured.svg?width=128',about:'ช่วยเหลือผู้สูงอายุ คนพิการ เด็ก และผู้เดือดร้อน'}
};
/* แท็บ "ฉุกเฉิน": การ์ดหน่วยงาน (โลโก้ + ข้อมูล) รวมทุกเบอร์ของหน่วยงานนั้น · ค้นหา + กรองหมวด · ปุ่มโทร + ⓘ แหล่งที่มา */
let hlCat='all';
function renderHotlineCats(){
  const el=document.getElementById('hotline-cats');
  const had=el.contains(document.activeElement);
  el.innerHTML=[['all','ทั้งหมด'],...hotlineGroups.map(g=>[g.id,g.title])].map(([k,t])=>`<button type="button" data-cat="${k}" aria-pressed="${hlCat===k}">${t}</button>`).join('');
  if(had){const b=el.querySelector(`[data-cat="${hlCat}"]`);b&&b.focus()}
}
function hlLogo(o){const box=document.createElement('span');box.className='hl-logo';box.style.setProperty('--c',o.color);
  const badge=()=>{box.classList.add('badge');box.textContent=o.abbr;box.classList.toggle('long',o.abbr.length>4)};
  if(o.logo){const im=new Image();im.alt='';im.loading='lazy';im.decoding='async';im.referrerPolicy='no-referrer';im.onerror=()=>{im.remove();badge()};im.src=o.logo;box.append(im)}else badge();
  return box}
function renderHotlines(){
  const term=document.getElementById('hotline-search').value.trim().toLowerCase();
  const matches=hotlines.filter(h=>{const o=hlOrgs[h.org]||{};return (hlCat==='all'||h.group===hlCat)&&(!term||`${h.number} ${h.name} ${h.agency} ${h.note} ${o.name||''} ${o.abbr||''} ${o.about||''}`.toLowerCase().includes(term))});
  const root=document.getElementById('hotline-directory');root.replaceChildren();
  /* หน่วยงานละ 1 การ์ด: อยู่ในหมวดของเบอร์แรก (ด่วนสุด) และรวมทุกเบอร์ของหน่วยงานนั้นไว้ในการ์ดเดียว */
  const orgs=new Map();matches.forEach(h=>{const k=h.org||h.number;if(!orgs.has(k))orgs.set(k,{group:h.group,nums:[]});orgs.get(k).nums.push(h)});
  hotlineGroups.forEach(g=>{const list=[...orgs].filter(([,v])=>v.group===g.id);if(!list.length)return;
    const h2=document.createElement('h2');h2.textContent=g.title;root.append(h2);
    list.forEach(([k,{nums}])=>{const o=hlOrgs[k]||{name:nums[0].agency,abbr:nums[0].agency.slice(0,3),color:'#5B6386',about:''};
      const card=document.createElement('article');card.className='hl-org';card.style.setProperty('--c',o.color);
      const head=document.createElement('div');head.className='hl-head';head.append(hlLogo(o));
      const t=document.createElement('div');t.className='hl-org-t';t.innerHTML='<b></b><small></small>';t.querySelector('b').textContent=o.name;t.querySelector('small').textContent=o.about||nums[0].note;head.append(t);card.append(head);
      nums.forEach(h=>{const row=document.createElement('div');row.className='hl';
        row.innerHTML=`<div class="hl-txt"><b><span class="hl-num"></span><button type="button" class="hl-info" aria-label="แหล่งที่มาของเบอร์ ${h.number}" aria-expanded="false">${ic('info')}</button></b><small class="hl-name"></small><div class="hl-src" hidden></div></div><a class="hl-call">${ic('phone')}โทร</a>`;
        row.querySelector('.hl-num').textContent=h.number;row.querySelector('.hl-name').textContent=h.name;
        const call=row.querySelector('.hl-call');call.href='tel:'+h.number;call.setAttribute('aria-label','โทร '+h.number+' '+h.name);
        const src=row.querySelector('.hl-src');src.innerHTML='ที่มา: <a target="_blank" rel="noopener noreferrer"></a>';const a=src.querySelector('a');a.href=h.source;a.textContent=(h.sourceName||'แหล่งข้อมูล')+' ↗';
        const info=row.querySelector('.hl-info');info.onclick=()=>{src.hidden=!src.hidden;info.setAttribute('aria-expanded',String(!src.hidden))};
        card.append(row)});
      root.append(card)})});
  if(!matches.length)root.innerHTML='<p class="empty">ไม่พบหมายเลข ลองค้นหาด้วยชื่อหน่วยงาน</p>';
}
document.getElementById('hotline-search').addEventListener('input',renderHotlines);
document.getElementById('hotline-cats').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;hlCat=b.dataset.cat;renderHotlineCats();renderHotlines()});
renderHotlineCats();renderHotlines();
