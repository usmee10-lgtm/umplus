/* แผนที่: Leaflet 1.9.4 + พื้นแผนที่ 3 แบบ (ถนน / ดาวเทียม / มืด) ไม่ต้องใช้ key */
let leafletLoading=null;
const withVector=p=>p.then(()=>typeof loadVectorBase==='function'?loadVectorBase():null).then(()=>{});
function loadLeaflet(){
  if(window.L&&!leafletLoading)return withVector(Promise.resolve());
  if(leafletLoading)return withVector(leafletLoading);
  leafletLoading=new Promise((resolve,reject)=>{
    const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';css.crossOrigin='';document.head.append(css);
    const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';s.crossOrigin='';
    const tm=setTimeout(()=>{leafletLoading=null;reject(new Error('timeout'))},15000);
    s.onload=()=>{clearTimeout(tm);resolve()};s.onerror=()=>{clearTimeout(tm);leafletLoading=null;s.remove();reject(new Error('load'))};document.head.append(s);
  });
  /* โหลดพื้นแผนที่เวกเตอร์ OpenFreeMap ด้วย (ถ้าเครื่องรองรับ) · ไม่สำเร็จก็ยังใช้แผนที่ภาพได้ */
  return withVector(leafletLoading);
}
const ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/';
const ESRI_ATTR='แผนที่ &copy; Esri';
const OSM_ATTR='แผนที่ &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const BASES={road:'ถนน',sat:'ดาวเทียม',dark:'มืด'};
const isDesktop=()=>matchMedia('(min-width:1024px)').matches;
function makeMap(el,opt={}){
  const map=L.map(el,{zoomControl:false,attributionControl:true,preferCanvas:true,tap:true,...(opt.leaflet||{})}).setView(opt.center||[13.7563,100.5018],opt.zoom||12);
  if(isDesktop()||opt.zoom===true)L.control.zoom({position:'topleft'}).addTo(map);
  L.control.scale({metric:true,imperial:false,position:'bottomleft'}).addTo(map);
  map.attributionControl.setPrefix(false);
  /* เครดิตแผนที่ (เงื่อนไข OSM/OpenFreeMap บังคับให้แสดง) ย่อเป็นปุ่ม ⓘ · แตะเพื่อเปิด/ปิดข้อความ */
  {const ac=map.attributionControl.getContainer();ac.classList.add('attr-min');ac.setAttribute('role','button');ac.setAttribute('tabindex','0');ac.setAttribute('aria-label','เครดิตแผนที่');
   const tg=e=>{if(e.target.closest('a'))return;ac.classList.toggle('attr-open');L.DomEvent.stop(e)};L.DomEvent.on(ac,'click',tg);L.DomEvent.disableClickPropagation(ac);
   ac.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')tg(e)})}
  let base=null,fellBack=0;
  const layer=(u,a,o={})=>L.tileLayer(u,{maxZoom:19,attribution:a,crossOrigin:true,...o});
  map.setBase=name=>{
    if(base)base.remove();
    if(name==='sat')base=L.layerGroup([layer(ESRI+'World_Imagery/MapServer/tile/{z}/{y}/{x}',ESRI_ATTR),layer(ESRI+'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',''),layer(ESRI+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}','')]);
    else if(typeof VEC!=='undefined'&&VEC.ok){
      /* ถนน / มืด: แผนที่เวกเตอร์ OpenFreeMap (ข้อมูล OpenStreetMap · ฟรี ไม่มีลิมิต · ชื่อถนนซอยภาษาไทยละเอียด) */
      base=L.maplibreGL({style:VEC.styles[name==='dark'?'dark':'road'],attribution:MAPCFG.attr,attributionControl:false,interactive:false});
    }
    else if(name==='dark')base=L.layerGroup([layer(ESRI+'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',ESRI_ATTR,{maxZoom:16,maxNativeZoom:16}),layer(ESRI+'Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}','',{maxZoom:16,maxNativeZoom:16})]);
    else{
      /* สำรอง (เครื่องไม่รองรับ WebGL): ถนน OpenStreetMap แบบ floodboard (ชื่อถนนไทยละเอียด) ถ้าโหลดไม่ได้ → Esri World Street Map อัตโนมัติ
         (CARTO ตัดออก: บนโดเมนนี้ส่งภาพ "API KEY REQUIRED" แทนแผนที่) */
      const chain=[['https://tile.openstreetmap.org/{z}/{x}/{y}.png',OSM_ATTR,false],[ESRI+'World_Street_Map/MapServer/tile/{z}/{y}/{x}',ESRI_ATTR,false]];
      const step=Math.min(fellBack,chain.length-1),[u,a,labels]=chain[step];
      const t=layer(u,a,{referrerPolicy:'strict-origin-when-cross-origin'});
      base=labels?L.layerGroup([t,layer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png','',{subdomains:'abcd',pane:'shadowPane'})]):t;
      let bad=0,good=0;t.on('tileload',()=>good++);t.on('tileerror',()=>{bad++;if(!good&&bad>=4&&fellBack===step&&step<chain.length-1){fellBack=step+1;map.setBase('road')}});
    }
    base.addTo(map);if(base.bringToBack)base.bringToBack();map.currentBase=name;
    /* เครดิต OpenFreeMap / OpenMapTiles / OpenStreetMap (ต้องแสดงเมื่อใช้พื้นแผนที่เวกเตอร์) */
    if(typeof MAPCFG!=='undefined'&&map.attributionControl){map.attributionControl.removeAttribution(MAPCFG.attr);if(base instanceof L.Layer&&base._glMap!==undefined||(typeof VEC!=='undefined'&&VEC.ok&&name!=='sat'))map.attributionControl.addAttribution(MAPCFG.attr)}
    el.classList.toggle('base-dark',name==='dark'||name==='sat');
    try{localStorage.setItem('uh_base',name)}catch(e){}
  };
  let saved='road';try{saved=localStorage.getItem('uh_base')||'road'}catch(e){}
  map.setBase(BASES[saved]?saved:'road');
  requestAnimationFrame(()=>map.invalidateSize());
  return map;
}
/* GPS แบบแม่นยำ: ฟังตำแหน่งต่อเนื่อง เก็บค่าที่แม่นที่สุด จนแม่นถึง goodM เมตร หรือครบ maxMs
   onFix({lat,lng,accuracy}) ถูกเรียกทุกครั้งที่ได้ค่าที่แม่นขึ้น · คืน Promise ค่าที่ดีที่สุด */
function getGPSBest(onFix,{goodM=15,maxMs=15000}={}){
  return new Promise((res,rej)=>{if(!navigator.geolocation)return rej(new Error('unsupported'));
    let best=null,done=false,id=null;
    const finish=err=>{if(done)return;done=true;clearTimeout(tm);if(id!=null)navigator.geolocation.clearWatch(id);best?res(best):rej(err||Object.assign(new Error('timeout'),{code:3}))};
    const tm=setTimeout(()=>finish(),maxMs);
    id=navigator.geolocation.watchPosition(p=>{const f={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:Math.round(p.coords.accuracy||9999)};
        if(!best||f.accuracy<best.accuracy){best=f;try{onFix&&onFix(f)}catch(e){}}if(best.accuracy<=goodM)finish()},
      e=>{if(e.code===1||!best)finish(e)},{enableHighAccuracy:true,maximumAge:0,timeout:maxMs})});
}
/* อ่านพิกัดจากลิงก์ Google Maps / Apple Maps / ข้อความ "13.75, 100.5" · คืน {lat,lng} หรือ null */
function parseLatLngText(t){const s=decodeURIComponent(String(t||'')).replace(/\s+/g,' ');
  const ok=(a,b)=>{a=+a;b=+b;return a>5&&a<21&&b>97&&b<106?{lat:a,lng:b}:null};let m;
  if((m=s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)))return ok(m[1],m[2]);
  if((m=s.match(/[?&](?:q|query|ll|sll|destination|daddr|center)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)))return ok(m[1],m[2]);
  if((m=s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)))return ok(m[1],m[2]);
  if((m=s.match(/(?:^|[^\d.])(-?\d{1,2}\.\d{3,})\s*[, ]\s*(-?\d{2,3}\.\d{3,})(?!\d)/)))return ok(m[1],m[2]);
  return null}
const isShortMapLink=t=>/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(t||'');
/* GPS ครั้งเดียว → Promise {lat,lng,accuracy} */
function getGPS(timeout=12000){
  return new Promise((res,rej)=>{if(!navigator.geolocation)return rej(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy}),rej,{enableHighAccuracy:true,timeout,maximumAge:30000})});
}
function pinIcon(cls,label){return L.divIcon({className:'um-pin '+cls,html:`<span>${label||''}</span>`,iconSize:[30,38],iconAnchor:[15,36],popupAnchor:[0,-32]})}
function meIcon(){return L.divIcon({className:'me-dot',html:'<span></span>',iconSize:[22,22],iconAnchor:[11,11]})}
