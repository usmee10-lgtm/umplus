/* แผนที่ปักหมุดในฟอร์มขอความช่วยเหลือ
 *  - หลัก: MapLibre GL + OpenFreeMap (แผนที่เวกเตอร์จาก OpenStreetMap · ฟรี ไม่ต้องใช้ key ไม่มีลิมิต)
 *          ชื่อถนน/ซอยภาษาไทยครบเท่าที่ OSM มี · หาซอยใกล้หมุดจากเส้นถนนในแผนที่ที่โหลดแล้ว (ไม่ต้องเรียก API เพิ่ม)
 *  - สำรอง: Leaflet (เครื่องที่ไม่รองรับ WebGL หรือโหลด MapLibre ไม่ได้)
 * ทั้งสองแบบมีคำสั่งเหมือนกัน: setPin / removePin / setAccuracy / clearAccuracy / view / setZoom / getZoom / resize / ready / nearestRoads / toggleSat / isSat
 */
const MAPCFG={
  style:'https://tiles.openfreemap.org/styles/liberty',
  darkStyle:'https://tiles.openfreemap.org/styles/dark',
  attr:'แผนที่ <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ข้อมูล © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  mlLeaflet:'https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js',
  mlLeafletSri:'sha384-tXYNKOHx4T02jMP7YYCtBxPIv1B5gaA5mcVPBzqMp6d7VzWzxJgI2aWF/nJLrQdS',
  mlJs:'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js',
  mlJsSri:'sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp',
  mlCss:'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css',
  mlCssSri:'sha384-uTttxo/aOKbdE5RlD/SPzSDoDmNvGlUYPjONi2MN/b7c9HPSvW07OIuyP7uL6jxK',
  /* ภาพดาวเทียม (ตัวเลือกเสริม ไม่ใช่ส่วนหลัก · OSM ไม่มีภาพดาวเทียม) */
  sat:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  satAttr:'ภาพดาวเทียม © Esri'
};
let mlLoading=null;
function hasWebGL(){try{const c=document.createElement('canvas');return !!(window.WebGL2RenderingContext&&c.getContext('webgl2'))||!!(c.getContext('webgl')||c.getContext('experimental-webgl'))}catch(e){return false}}
function loadMapLibre(){
  if(window.maplibregl)return Promise.resolve();
  if(mlLoading)return mlLoading;
  mlLoading=new Promise((res,rej)=>{
    const css=document.createElement('link');css.rel='stylesheet';css.href=MAPCFG.mlCss;css.integrity=MAPCFG.mlCssSri;css.crossOrigin='anonymous';document.head.append(css);
    const s=document.createElement('script');s.src=MAPCFG.mlJs;s.integrity=MAPCFG.mlJsSri;s.crossOrigin='anonymous';
    const tm=setTimeout(()=>{mlLoading=null;rej(new Error('timeout'))},20000);
    s.onload=()=>{clearTimeout(tm);res()};s.onerror=()=>{clearTimeout(tm);mlLoading=null;s.remove();rej(new Error('load'))};document.head.append(s)});
  return mlLoading}
/* สไตล์ OpenFreeMap: ป้ายชื่อเป็นภาษาไทยก่อน (ชื่อถนน ซอย สถานที่) */
const styleCache={};
async function thaiStyle(url=MAPCFG.style){
  if(styleCache[url])return JSON.parse(JSON.stringify(styleCache[url]));
  const st=await (await fetch(url)).json();
  const nameTh=['coalesce',['get','name:th'],['get','name'],['get','name:latin']];
  st.layers.forEach(l=>{if(l.layout&&l.layout['text-field']!==undefined&&!/shield|ref|housenumber/i.test(l.id))l.layout['text-field']=nameTh});
  styleCache[url]=st;return JSON.parse(JSON.stringify(st))}
/* วงกลมความแม่นยำ GPS เป็น polygon (เมตร) */
function circlePoly(lat,lng,m,n=64){const k=111320,cx=Math.cos(lat*Math.PI/180),ring=[];
  for(let i=0;i<=n;i++){const a=i/n*2*Math.PI;ring.push([lng+Math.cos(a)*m/(k*cx),lat+Math.sin(a)*m/k])}
  return {type:'Feature',geometry:{type:'Polygon',coordinates:[ring]},properties:{}}}
/* ระยะ (เมตร) จากจุดถึงเส้นตรง a–b · [lng,lat] */
function segDist(p,a,b){const k=111320,cx=Math.cos(p[1]*Math.PI/180);
  const ax=(a[0]-p[0])*k*cx,ay=(a[1]-p[1])*k,bx=(b[0]-p[0])*k*cx,by=(b[1]-p[1])*k,dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;
  let t=l?-(ax*dx+ay*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(ax+t*dx,ay+t*dy)}
function pinElement(){const el=document.createElement('div');el.className='form-pin ml-pin';el.innerHTML='<span></span>';el.setAttribute('aria-label','หมุดตำแหน่งของคุณ · ลากเพื่อปรับ');return el}

async function createPickMap(el,{onTap,onDragEnd}={}){
  if(hasWebGL()){try{await loadMapLibre();return await mlPicker(el,onTap,onDragEnd)}catch(e){console.warn('MapLibre ใช้ไม่ได้ ใช้ Leaflet แทน',e)}}
  await loadLeaflet();return leafletPicker(el,onTap,onDragEnd)}

async function mlPicker(el,onTap,onDragEnd){
  const style=await thaiStyle(MAPCFG.style);
  const map=new maplibregl.Map({container:el,style,center:[100.5018,13.7563],zoom:11,maxZoom:19.5,attributionControl:false,dragRotate:false,pitchWithRotate:false,touchPitch:false,
    locale:{'NavigationControl.ZoomIn':'ซูมเข้า','NavigationControl.ZoomOut':'ซูมออก'}});
  map.touchZoomRotate.disableRotation();map.keyboard.disableRotation();
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
  map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
  map.addControl(new maplibregl.AttributionControl({compact:true,customAttribution:'<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>'}),'bottom-right');
  await new Promise((res,rej)=>{map.once('load',res);map.once('error',e=>{if(!map.loaded())rej(e.error||e)})});
  /* ภาพดาวเทียม (ซ่อนไว้) วางใต้ถนนและป้ายชื่อ */
  const firstLine=(map.getStyle().layers.find(l=>l.type==='line')||{}).id;
  map.addSource('sat',{type:'raster',tiles:[MAPCFG.sat],tileSize:256,maxzoom:19,attribution:MAPCFG.satAttr});
  map.addLayer({id:'sat',type:'raster',source:'sat',layout:{visibility:'none'}},firstLine);
  map.addSource('acc',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:'acc-fill',type:'fill',source:'acc',paint:{'fill-color':'#2563EB','fill-opacity':.12}});
  map.addLayer({id:'acc-line',type:'line',source:'acc',paint:{'line-color':'#2563EB','line-width':1.5}});
  let marker=null,sat=false;
  map.on('click',e=>onTap&&onTap(e.lngLat.lat,e.lngLat.lng));
  const api={kind:'maplibre',map,
    setPin(lat,lng){if(marker)marker.setLngLat([lng,lat]);else{marker=new maplibregl.Marker({element:pinElement(),draggable:true,anchor:'bottom'}).setLngLat([lng,lat]).addTo(map);
      marker.on('dragend',()=>{const p=marker.getLngLat();onDragEnd&&onDragEnd(p.lat,p.lng)})}},
    removePin(){if(marker){marker.remove();marker=null}},
    setAccuracy(lat,lng,m){map.getSource('acc').setData({type:'FeatureCollection',features:[circlePoly(lat,lng,m)]})},
    clearAccuracy(){map.getSource('acc').setData({type:'FeatureCollection',features:[]})},
    view(lat,lng,minZoom){map.easeTo({center:[lng,lat],zoom:Math.max(map.getZoom(),minZoom||0),duration:600})},
    setZoom(z){map.easeTo({zoom:z,duration:400})},
    getZoom(){return map.getZoom()},
    resize(){map.resize()},
    /* รอให้แผนที่ (รวมเส้นถนนรอบหมุด) โหลดเสร็จ */
    ready(){return new Promise(res=>{if(map.loaded()&&!map.isMoving()&&map.areTilesLoaded())return res();let done=false;const fin=()=>{if(!done){done=true;res()}};map.once('idle',fin);setTimeout(fin,6000)})},
    /* ถนน/ซอยที่มีชื่อ ใกล้จุดนี้ที่สุด (วัดถึงเส้นจริง) · ข้อมูลจาก OSM ในแผนที่ที่โหลดอยู่ */
    nearestRoads(lat,lng,maxM=180){const best={};
      map.querySourceFeatures('openmaptiles',{sourceLayer:'transportation_name'}).forEach(f=>{const p=f.properties||{},n=p['name:th']||p.name;
        if(!n||p.class==='path'||p.class==='rail'||p.class==='transit')return;
        const g=f.geometry,lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];let d=1e9;
        lines.forEach(c=>{for(let i=1;i<c.length;i++)d=Math.min(d,segDist([lng,lat],c[i-1],c[i]))});
        if(d<=maxM&&(!(n in best)||d<best[n].d))best[n]={name:n,d:Math.round(d),cls:p.class}});
      return Object.values(best).sort((a,b)=>a.d-b.d)},
    toggleSat(){sat=!sat;map.setLayoutProperty('sat','visibility',sat?'visible':'none');
      /* เปิดดาวเทียม: ซ่อนพื้น (น้ำ ตึก สวน) ให้เห็นภาพจริง เหลือเส้นถนนและชื่อ */
      map.getStyle().layers.forEach(l=>{if((l.type==='fill'&&!/^acc/.test(l.id))||l.type==='fill-extrusion'||l.type==='background')map.setLayoutProperty(l.id,'visibility',sat?'none':'visible')});return sat},
    isSat(){return sat}};
  return api}

function leafletPicker(el,onTap,onDragEnd){
  const m=makeMap(el,{zoom:12});let marker=null,circle=null;
  m.on('click',e=>onTap&&onTap(e.latlng.lat,e.latlng.lng));
  return {kind:'leaflet',map:m,
    setPin(lat,lng){if(marker)marker.setLatLng([lat,lng]);else{marker=L.marker([lat,lng],{draggable:true,autoPan:true,title:'หมุดตำแหน่งของคุณ · ลากเพื่อปรับ',icon:L.divIcon({className:'form-pin',html:'<span></span>',iconSize:[34,40],iconAnchor:[17,40]})}).addTo(m);
      marker.on('dragend',()=>{const p=marker.getLatLng();onDragEnd&&onDragEnd(p.lat,p.lng)})}},
    removePin(){if(marker){marker.remove();marker=null}},
    setAccuracy(lat,lng,r){if(circle)circle.remove();circle=L.circle([lat,lng],{radius:r,color:'#2563EB',weight:1.5,fillColor:'#2563EB',fillOpacity:.12,interactive:false}).addTo(m)},
    clearAccuracy(){if(circle){circle.remove();circle=null}},
    view(lat,lng,minZoom){m.setView([lat,lng],Math.max(m.getZoom(),minZoom||0))},
    setZoom(z){m.setZoom(z)},getZoom(){return m.getZoom()},
    resize(){m.invalidateSize()},ready(){return Promise.resolve()},nearestRoads(){return []},
    toggleSat(){let keep='road';try{keep=localStorage.getItem('uh_base')||'road'}catch(e){}const sat=m.currentBase!=='sat';m.setBase(sat?'sat':'road');try{localStorage.setItem('uh_base',keep)}catch(e){}return sat},
    isSat(){return m.currentBase==='sat'}}}

/* พื้นแผนที่เวกเตอร์ OpenFreeMap ในแผนที่ Leaflet (หน้าแรก / รายการเคส / รายละเอียดเคส) ผ่าน maplibre-gl-leaflet */
let VEC={ok:false,styles:{}},vecLoading=null;
function loadVectorBase(){
  if(vecLoading)return vecLoading;
  vecLoading=(async()=>{
    if(!hasWebGL())return VEC;
    try{await loadMapLibre();
      if(!(window.L&&L.maplibreGL))await new Promise((res,rej)=>{const s=document.createElement('script');s.src=MAPCFG.mlLeaflet;s.integrity=MAPCFG.mlLeafletSri;s.crossOrigin='anonymous';
        const tm=setTimeout(()=>rej(new Error('timeout')),15000);s.onload=()=>{clearTimeout(tm);res()};s.onerror=()=>{clearTimeout(tm);rej(new Error('load'))};document.head.append(s)});
      const [road,dark]=await Promise.all([thaiStyle(MAPCFG.style),thaiStyle(MAPCFG.darkStyle).catch(()=>null)]);
      VEC={ok:!!(road&&L.maplibreGL),styles:{road,dark:dark||road}}}
    catch(e){console.warn('พื้นแผนที่เวกเตอร์ใช้ไม่ได้ ใช้แผนที่ภาพแทน',e);VEC={ok:false,styles:{}}}
    return VEC})();
  return vecLoading}
