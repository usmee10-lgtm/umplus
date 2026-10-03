/**
 * UM+ / UMMATEE — ระบบรับเคสขอความช่วยเหลือน้ำท่วม -> Google Sheet
 * โปรเจกต์ Apps Script แยก (standalone) เขียนลง Google Sheet ตาม SHEET_ID แล้ว Deploy เป็น Web app
 *
 * API (ใช้ URL เดียวของ Web app):
 *   POST {action:"create", ...ข้อมูลเคส}                 -> สร้างเคสใหม่ (ใครก็ส่งได้) ได้ id + token กลับไป
 *   GET  ?action=list                                     -> รายการเคสสำหรับคนทั่วไป: เขต + ตำแหน่งโดยประมาณ ไม่มีชื่อ/เบอร์/ที่อยู่
 *   GET  ?action=list&key=รหัสอาสา                        -> รายการเคสแบบเห็นเบอร์เต็ม
 *   POST {action:"update", key, id, status, volunteer}    -> อาสาเปลี่ยนสถานะ (ต้องมีรหัสอาสา)
 *   POST {action:"track", id, token}                      -> ผู้แจ้งดูสถานะคำขอของตัวเอง
 *   GET  ?action=teams[&key=รหัสอาสา]                     -> ตำแหน่งทีมที่แชร์อยู่ (คนทั่วไปได้พิกัดปัด ~100 ม.)
 *   GET  ?action=network                                  -> จุดเครือข่ายช่วยเหลือ จากแท็บ "เครือข่าย" (ข้อมูลสาธารณะ)
 *   POST {action:"ping", key, team, lat, lng, accuracy}   -> ทีมอาสาแชร์ตำแหน่ง / {stop:true} หยุดแชร์
 *
 * รหัสอาสา: Project Settings > Script properties > VOLUNTEER_KEY (setup() สร้างให้ครั้งแรก)
 */

const SHEET_ID = '1GkGL0PrjuADwMmuSSj0KjW9WLH180eATD1RkmzEqGMs'; // Google Sheet "UM+ - เคสน้ำท่วม"
const SHEET_NAME = 'เคส';             // ชื่อแท็บ (เดิมชื่อ Cases ระบบเปลี่ยนชื่อให้เอง)
const LEGACY_NAMES = { 'เคส': 'Cases', 'ทีม': 'Teams' };
const TEAM_SHEET = 'ทีม';
const HEADERS = [
  'id', 'createdAt', 'status', 'urgency', 'name', 'phone', 'district', 'people',
  'address', 'lat', 'lng', 'level', 'needs', 'vulnerable', 'notes',
  'volunteer', 'updatedAt', 'token'
];
const TEAM_HEADERS = ['team', 'lat', 'lng', 'accuracy', 'updatedAt', 'active'];
// หัวตารางภาษาไทยที่แสดงในชีต (ลำดับต้องตรงกับ HEADERS / TEAM_HEADERS)
const HEADERS_TH = ['รหัสเคส', 'เวลาแจ้ง', 'สถานะ', 'ความเร่งด่วน', 'ชื่อ', 'เบอร์โทร', 'เขต', 'จำนวนคน',
  'ที่อยู่', 'ละติจูด', 'ลองจิจูด', 'ระดับน้ำ', 'ต้องการ', 'กลุ่มเปราะบาง', 'รายละเอียด',
  'ทีมอาสา', 'อัปเดตล่าสุด', 'รหัสติดตาม (ห้ามแก้)'];
const TEAM_HEADERS_TH = ['ทีม', 'ละติจูด', 'ลองจิจูด', 'ความแม่นยำ (ม.)', 'อัปเดตล่าสุด', 'กำลังแชร์'];
const STATUSES = ['open', 'going', 'done'];
// ในชีตเก็บสถานะเป็นภาษาไทย (เลือกจาก dropdown ได้) แต่ส่งให้แอปเป็นรหัส open/going/done
const STATUS_TH = { open: 'รอช่วย', going: 'กำลังไป', done: 'ช่วยแล้ว' };
const LEVEL_TH = { ankle: 'ข้อเท้า', knee: 'เข่า', waist: 'เอว', chest: 'อก', roof: 'มิดหัว' };
const URG_TH = { 1: 'ทั่วไป', 2: 'เร่งด่วน', 3: 'ด่วนมาก', 4: 'วิกฤต' };
const YES = 'ใช่', NO = 'ไม่';
const LEVELS = ['ankle', 'knee', 'waist', 'chest', 'roof'];
const MAX = { name: 60, phone: 20, district: 40, address: 300, notes: 800, volunteer: 60, team: 40 };
const LIST_CACHE_SEC = 20;          // แคชรายการเคส ลดเวลาโหลดเมื่อมีคนเปิดพร้อมกันเยอะ
const TEAM_FRESH_MIN = 30;          // แสดงทีมที่ส่งตำแหน่งภายใน 30 นาที

/** กด Run ฟังก์ชันนี้ 1 ครั้ง เพื่อสร้างแท็บ Cases/Teams, ขอสิทธิ์ และสร้างรหัสอาสา */
function setup() {
  formatSheet();
  teamSheet_();
  networkSheet_();
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('VOLUNTEER_KEY');
  if (!key) {
    key = 'UM-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
    props.setProperty('VOLUNTEER_KEY', key);
  }
  Logger.log('พร้อมใช้งาน: แท็บ ' + SHEET_NAME + ', ' + TEAM_SHEET + ' | รหัสอาสา: ' + key);
}

/* ---------- entry points ---------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'list') return json_(listCachedJson_(isVolunteer_(p.key), p.since), true);
    if (p.action === 'teams') return json_(listTeams_(isVolunteer_(p.key)));
    if (p.action === 'network') return json_(listNetworkCachedJson_(), true);
    return json_({ ok: true, service: 'flood-help', time: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }
  try {
    if (body.action === 'create') return json_(createCase_(body));
    if (body.action === 'track') return json_(trackCase_(body));
    if (body.action === 'update') {
      if (!isVolunteer_(body.key)) return json_({ ok: false, error: 'not_volunteer' });
      return json_(updateCase_(body));
    }
    if (body.action === 'ping') {
      if (!isVolunteer_(body.key)) return json_({ ok: false, error: 'not_volunteer' });
      return json_(pingTeam_(body));
    }
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/* ---------- cases ---------- */

function createCase_(b) {
  if (b.website) return { ok: true, id: 'ignored' };          // honeypot: บอทกรอกช่องซ่อน
  const c = {
    name: clean_(b.name, MAX.name),
    phone: clean_(b.phone, MAX.phone).replace(/[^\d+\-\s]/g, ''),
    district: clean_(b.district, MAX.district),
    people: clampInt_(b.people, 1, 999, 1),
    address: clean_(b.address, MAX.address),
    lat: num_(b.lat, -90, 90),
    lng: num_(b.lng, -180, 180),
    level: LEVELS.indexOf(b.level) >= 0 ? b.level : '',
    needs: list_(b.needs),
    vulnerable: list_(b.vulnerable),
    notes: clean_(b.notes || b.details, MAX.notes),
    urgencyLabel: clean_(b.urgencyLabel || b.urgency, 60)
  };
  const missing = [];
  if (c.phone.replace(/\D/g, '').length < 9) missing.push('phone');
  if (!c.address && (c.lat === '' || c.lng === '')) missing.push('address_or_pin');
  if (missing.length) return { ok: false, error: 'missing', fields: missing };

  // กันเคสซ้ำเมื่อมือถือส่งซ้ำตอนเน็ตหลุด (จำ clientId ไว้ 6 ชั่วโมง)
  const cache = CacheService.getScriptCache();
  const cid = clean_(b.clientId, 40);
  if (cid) {
    const hit = cache.get('cid:' + cid);
    if (hit) { const h = hit.split('|'); return { ok: true, id: h[0], token: h[1] || '', duplicate: true }; }
  }

  const now = new Date();
  const id = 'C' + Utilities.formatDate(now, 'Asia/Bangkok', 'MMddHHmm') + '-' +
             Math.random().toString(36).slice(2, 6).toUpperCase();
  const token = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  const row = {
    id: id, createdAt: now, status: STATUS_TH.open, urgency: URG_TH[urgency_(c)],
    name: c.name, phone: c.phone, district: c.district, people: c.people,
    address: c.address, lat: c.lat, lng: c.lng, level: LEVEL_TH[c.level] || '',
    needs: c.needs.join(', '), vulnerable: c.vulnerable.join(', '),
    notes: c.notes, volunteer: '', updatedAt: now, token: token
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    // ข้อความที่ขึ้นต้นด้วย = + - @ ใส่ ' นำหน้า กันสูตรใน Sheet
    // เบอร์โทรใส่ ' นำหน้าเสมอ ไม่ให้ Sheet ตัดเลข 0 ข้างหน้า
    const sh = sheet_(), m = cols_(sh), out = [];
    for (let i = 0; i < m._width; i++) out.push('');
    HEADERS.forEach(function (h) { if (m[h]) out[m[h] - 1] = h === 'phone' ? "'" + row.phone : safeCell_(row[h]); });
    sh.appendRow(out);
  } finally {
    lock.releaseLock();
  }
  if (cid) cache.put('cid:' + cid, id + '|' + token, 21600);
  clearListCache_();
  return { ok: true, id: id, token: token, urgency: urgency_(c) };
}

function updateCase_(b) {
  if (STATUSES.indexOf(b.status) < 0) return { ok: false, error: 'bad_status' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheet_();
    const r = findRow_(sh, b.id);
    if (!r) return { ok: false, error: 'not_found' };
    const m = cols_(sh), col = function (name) { return m[name]; };
    sh.getRange(r, col('status')).setValue(STATUS_TH[b.status]);
    if (col('volunteer')) {
      if (b.status === 'open') sh.getRange(r, col('volunteer')).setValue('');
      else if (b.volunteer) sh.getRange(r, col('volunteer')).setValue(safeCell_(clean_(b.volunteer, MAX.volunteer)));
    }
    if (col('updatedAt')) sh.getRange(r, col('updatedAt')).setValue(new Date());
    clearListCache_();
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/** ผู้แจ้งดูสถานะคำขอตัวเอง: ต้องมี id + token ที่ได้ตอนส่งคำขอ */
function trackCase_(b) {
  const id = clean_(b.id, 40), token = clean_(b.token, 40);
  if (!id || !token) return { ok: false, error: 'missing' };
  const sh = sheet_();
  const r = findRow_(sh, id);
  if (!r) return { ok: false, error: 'not_found' };
  const m = cols_(sh);
  const o = rowObj_(sh.getRange(r, 1, 1, m._width).getValues()[0], m);
  if (!o.token || String(o.token) !== token) return { ok: false, error: 'not_found' };
  o.status = statusCode_(o.status); o.level = levelCode_(o.level); o.urgency = urgCode_(o.urgency);
  return { ok: true, id: o.id, status: o.status, volunteer: o.status === 'open' ? '' : o.volunteer, urgency: o.urgency, updatedAt: o.updatedAt };
}

/** รายการเคส: แคช 20 วินาที (แยกแบบอาสา/คนทั่วไป) */
function listCachedJson_(full, since) {
  if (since) return JSON.stringify(listCases_(full, since));
  const cache = CacheService.getScriptCache();
  const key = full ? 'list:vol' : 'list:pub';
  const hit = cache.get(key);
  if (hit) return hit;
  const s = JSON.stringify(listCases_(full));
  try { if (s.length < 95000) cache.put(key, s, LIST_CACHE_SEC); } catch (err) {}
  return s;
}

function clearListCache_() {
  try { CacheService.getScriptCache().removeAll(['list:vol', 'list:pub']); } catch (err) {}
}

function listCases_(full, since) {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return { ok: true, cases: [], volunteer: full };
  const m = cols_(sh);
  const values = sh.getRange(2, 1, n, m._width).getValues();
  const sinceMs = since ? Number(since) : 0;
  const cases = values.map(function (v) {
    const o = rowObj_(v, m);
    delete o.token;                                   // ไม่ส่ง token ออกไปเด็ดขาด
    o.status = statusCode_(o.status); o.level = levelCode_(o.level); o.urgency = urgCode_(o.urgency);
    o.needs = o.needs ? String(o.needs).split(/\s*,\s*/) : [];
    o.vulnerable = o.vulnerable ? String(o.vulnerable).split(/\s*,\s*/) : [];
    if (!full) return publicCase_(o);
    return o;
  }).filter(function (o) { return o.id && (!sinceMs || o.updatedAt > sinceMs); });
  return { ok: true, cases: cases, volunteer: full };
}

/* คนทั่วไป: เห็นแค่เขต + ตำแหน่งโดยประมาณ (~500 ม.) ไม่มีชื่อ เบอร์ ที่อยู่ รายละเอียด */
const PUB_GRID = 0.005;
function publicCase_(o) {
  const snap = function (v) { return v === '' || v == null || isNaN(Number(v)) ? '' : Math.round(Math.round(Number(v) / PUB_GRID) * PUB_GRID * 1e4) / 1e4; };
  return {
    id: o.id, createdAt: o.createdAt, updatedAt: o.updatedAt, status: o.status, urgency: o.urgency,
    level: o.level, needs: o.needs, people: o.people, district: districtOf_(o),
    lat: snap(o.lat), lng: snap(o.lng), approx: true
  };
}
const BKK_DISTRICTS = 'พระนคร ดุสิต หนองจอก บางรัก บางเขน บางกะปิ ปทุมวัน ป้อมปราบศัตรูพ่าย พระโขนง มีนบุรี ลาดกระบัง ยานนาวา สัมพันธวงศ์ พญาไท ธนบุรี บางกอกใหญ่ ห้วยขวาง คลองสาน ตลิ่งชัน บางกอกน้อย บางขุนเทียน ภาษีเจริญ หนองแขม ราษฎร์บูรณะ บางพลัด ดินแดง บึงกุ่ม สาทร บางซื่อ จตุจักร บางคอแหลม ประเวศ คลองเตย สวนหลวง จอมทอง ดอนเมือง ราชเทวี ลาดพร้าว วัฒนา บางแค หลักสี่ สายไหม คันนายาว สะพานสูง วังทองหลาง คลองสามวา บางนา ทวีวัฒนา ทุ่งครุ บางบอน'.split(' ');
function districtOf_(o) {
  const d = String(o.district || '').replace(/^\s*(เขต|อำเภอ|อ\.)\s*/, '').trim();
  if (d) return d;
  const a = String(o.address || '');
  let m = a.match(/เขต\s*([ก-๙]+)/) || a.match(/(?:อำเภอ|อ\.)\s*([ก-๙]+)/);
  if (m) return m[1];
  const hits = BKK_DISTRICTS.filter(function (x) { return a.indexOf(x) >= 0; }).sort(function (x, y) { return y.length - x.length; });
  return hits[0] || '';
}

/* ---------- teams (แชร์ตำแหน่งทีม) ---------- */

function pingTeam_(b) {
  const team = clean_(b.team, MAX.team);
  if (!team) return { ok: false, error: 'missing_team' };
  const stop = !!b.stop;
  const lat = num_(b.lat, -90, 90), lng = num_(b.lng, -180, 180);
  if (!stop && (lat === '' || lng === '')) return { ok: false, error: 'bad_location' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = teamSheet_();
    const n = sh.getLastRow() - 1;
    let r = 0;
    if (n > 0) {
      const names = sh.getRange(2, 1, n, 1).getValues();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0]).toLowerCase() === team.toLowerCase()) { r = i + 2; break; }
      }
    }
    const now = new Date();
    if (stop) {
      if (r) sh.getRange(r, 5, 1, 2).setValues([[now, NO]]);
      return { ok: true, stopped: true };
    }
    const row = [safeCell_(team), lat, lng, clampInt_(b.accuracy, 0, 100000, 0), now, YES];
    if (r) sh.getRange(r, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function listTeams_(full) {
  const sh = teamSheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return { ok: true, teams: [] };
  const cutoff = Date.now() - TEAM_FRESH_MIN * 60000;
  const round = function (x) { return Math.round(Number(x) * 1000) / 1000; };   // ~100 ม.
  const teams = sh.getRange(2, 1, n, TEAM_HEADERS.length).getValues()
    .filter(function (v) {
      const t = v[4] instanceof Date ? v[4].getTime() : Number(v[4]);
      return v[0] && (v[5] === true || v[5] === YES) && t >= cutoff && v[1] !== '' && v[2] !== '';
    })
    .map(function (v) {
      const t = v[4] instanceof Date ? v[4].getTime() : Number(v[4]);
      return full
        ? { team: String(v[0]), lat: Number(v[1]), lng: Number(v[2]), accuracy: Number(v[3]) || 0, updatedAt: t }
        : { team: String(v[0]), lat: round(v[1]), lng: round(v[2]), updatedAt: t };
    });
  return { ok: true, teams: teams };
}

/* ---------- helpers ---------- */

/** หาแท็บตามชื่อไทย ถ้ายังเป็นชื่อเดิม (Cases/Teams) เปลี่ยนชื่อให้เอง */
function getTab_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh && LEGACY_NAMES[name]) { sh = ss.getSheetByName(LEGACY_NAMES[name]); if (sh) sh.setName(name); }
  return sh;
}

/* ---------- อ่าน/เขียนตามชื่อหัวคอลัมน์ (ย้าย/แทรกคอลัมน์ในชีตได้ ไม่พัง) ---------- */
const ALIASES = {
  id: ['รหัสเคส', 'id'], createdAt: ['เวลาแจ้ง', 'createdAt'], status: ['สถานะ', 'status'],
  urgency: ['ความเร่งด่วน', 'urgency'], name: ['ชื่อ', 'name'], phone: ['เบอร์โทร', 'phone'],
  district: ['เขต', 'district'], people: ['จำนวนคน', 'people'], address: ['ที่อยู่', 'address'],
  lat: ['ละติจูด', 'lat'], lng: ['ลองจิจูด', 'lng'], level: ['ระดับน้ำ', 'level'], needs: ['ต้องการ', 'needs'],
  vulnerable: ['กลุ่มเปราะบาง', 'vulnerable'], notes: ['รายละเอียด', 'notes'], volunteer: ['ทีมอาสา', 'volunteer'],
  updatedAt: ['อัปเดตล่าสุด', 'updatedAt'], token: ['รหัสติดตาม (ห้ามแก้)', 'รหัสติดตาม', 'token']
};
let COLS_ = null;
/** {key: เลขคอลัมน์} จากแถวหัวตาราง (ชื่อซ้ำ ใช้คอลัมน์แรก) · คอลัมน์ token ถ้าไม่มี เพิ่มต่อท้ายให้ */
function cols_(sh) {
  if (COLS_) return COLS_;
  const width = Math.max(sh.getLastColumn(), 1);
  const head = sh.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); });
  const m = { _width: width };
  Object.keys(ALIASES).forEach(function (k) {
    for (let i = 0; i < head.length; i++) if (ALIASES[k].indexOf(head[i]) >= 0) { m[k] = i + 1; break; }
  });
  if (!m.token) { m.token = width + 1; sh.getRange(1, m.token).setValue(ALIASES.token[0]).setFontWeight('bold'); m._width = m.token; }
  COLS_ = m;
  return m;
}
/** แถวในชีต -> object ตาม key */
function rowObj_(v, m) {
  const o = {};
  Object.keys(ALIASES).forEach(function (k) {
    const x = m[k] ? v[m[k] - 1] : '';
    o[k] = x instanceof Date ? x.getTime() : (x === undefined ? '' : x);
  });
  return o;
}

function sheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = getTab_(ss, SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS_TH]).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  return sh;
}

/** ระดับน้ำ / ความเร่งด่วน: ชีตเก็บเป็นไทย แอปใช้รหัส */
function levelCode_(v) {
  const s = String(v || '').trim();
  if (LEVELS.indexOf(s) >= 0) return s;
  for (const k in LEVEL_TH) if (LEVEL_TH[k] === s) return k;
  return '';
}
function urgCode_(v) {
  const n = Number(v);
  if (n >= 1 && n <= 4) return n;
  for (const k in URG_TH) if (URG_TH[k] === String(v || '').trim()) return Number(k);
  return 1;
}

/** รหัสสถานะจากค่าในชีต (รับได้ทั้งไทยและอังกฤษ) */
function statusCode_(v) {
  const s = String(v || '').trim();
  if (STATUSES.indexOf(s) >= 0) return s;
  for (const k in STATUS_TH) if (STATUS_TH[k] === s) return k;
  return s ? 'open' : '';
}

/**
 * จัดรูปแบบแท็บ Cases: สถานะเป็นภาษาไทย + dropdown, ระบายสีทั้งแถวตามสถานะ, หัวตารางสีธีม
 * กด Run ฟังก์ชัน formatSheet 1 ครั้ง (setup() ก็เรียกให้) · รันซ้ำได้ไม่เสียหาย
 */
function formatSheet() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);                 // กันชนกับอาสาที่กำลังเปลี่ยนสถานะพร้อมกัน
  try { formatSheet_(sheet_()); } finally { lock.releaseLock(); }
}
/** หัวคอลัมน์ที่ว่าง: เดาจากข้อมูลในคอลัมน์ แล้วใส่ชื่อให้ (เฉพาะคีย์ที่ยังหาไม่เจอ) */
function fillBlankHeaders_(sh) {
  const width = sh.getLastColumn(), n = Math.min(sh.getLastRow() - 1, 300);
  if (n < 1) return [];
  const head = sh.getRange(1, 1, 1, width).getValues()[0];
  const data = sh.getRange(2, 1, n, width).getValues();
  COLS_ = null; const m = cols_(sh); const fixed = [];
  const need = function (k) { return !m[k]; };
  for (let c = 0; c < width; c++) {
    if (String(head[c]).trim()) continue;
    const vals = data.map(function (r) { return r[c]; }).filter(function (v) { return v !== '' && v != null; });
    if (!vals.length) continue;
    const all = function (f) { return vals.filter(f).length >= vals.length * 0.9; };
    let key = '';
    if (all(function (v) { return v instanceof Date; })) key = need('createdAt') ? 'createdAt' : (need('updatedAt') ? 'updatedAt' : '');
    else if (all(function (v) { return typeof v === 'number' && v > 5 && v < 21 && v % 1; })) key = need('lat') ? 'lat' : '';
    else if (all(function (v) { return typeof v === 'number' && v > 97 && v < 106 && v % 1; })) key = need('lng') ? 'lng' : '';
    else if (all(function (v) { return typeof v === 'number' && v % 1 === 0 && v >= 1 && v < 5000; })) key = need('people') ? 'people' : '';
    if (key) { sh.getRange(1, c + 1).setValue(ALIASES[key][0]); m[key] = c + 1; fixed.push(ALIASES[key][0] + '→' + String.fromCharCode(65 + c)); }
  }
  COLS_ = null;
  return fixed;
}

function formatSheet_(sh) {
  const fixed = fillBlankHeaders_(sh);
  if (fixed.length) Logger.log('เติมหัวคอลัมน์: ' + fixed.join(', '));
  const m = cols_(sh), lastCol = Math.max(sh.getLastColumn(), m._width);
  const colStatus = m.status, colUrg = m.urgency, colLevel = m.level;
  const maxRows = Math.max(sh.getMaxRows(), 2000);
  if (sh.getMaxRows() < maxRows) sh.insertRowsAfter(sh.getMaxRows(), maxRows - sh.getMaxRows());
  const n = sh.getLastRow() - 1;
  const list = function (vals, help) { const b = SpreadsheetApp.newDataValidation().requireValueInList(vals, true).setAllowInvalid(false); if (help) b.setHelpText(help); return b.build(); };
  // 1) แปลงค่าเดิมเป็นไทย + dropdown (เฉพาะคอลัมน์ที่มีอยู่)
  if (colStatus) {
    if (n > 0) { const rng = sh.getRange(2, colStatus, n, 1); rng.setValues(rng.getValues().map(function (r) { const c = statusCode_(r[0]); return [c ? STATUS_TH[c] : r[0]]; })); }
    sh.getRange(2, colStatus, maxRows - 1, 1).setDataValidation(list([STATUS_TH.open, STATUS_TH.going, STATUS_TH.done], 'เลือก: รอช่วย / กำลังไป / ช่วยแล้ว'))
      .setFontWeight('bold').setHorizontalAlignment('center');
    sh.setColumnWidth(colStatus, 90);
  }
  if (colUrg) {
    if (n > 0) { const ur = sh.getRange(2, colUrg, n, 1); ur.setValues(ur.getValues().map(function (r) { return [r[0] === '' ? '' : URG_TH[urgCode_(r[0])]]; })); }
    sh.getRange(2, colUrg, maxRows - 1, 1).setDataValidation(list([URG_TH[4], URG_TH[3], URG_TH[2], URG_TH[1]], 'เลือก: วิกฤต / ด่วนมาก / เร่งด่วน / ทั่วไป'));
  }
  if (colLevel) {
    if (n > 0) { const lv = sh.getRange(2, colLevel, n, 1); lv.setValues(lv.getValues().map(function (r) { const c = levelCode_(r[0]); return [c ? LEVEL_TH[c] : r[0]]; })); }
    sh.getRange(2, colLevel, maxRows - 1, 1).setDataValidation(list(Object.keys(LEVEL_TH).map(function (k) { return LEVEL_TH[k]; })));
  }
  // 2) สีทั้งแถวตามสถานะ (ด่วนมาก = ยังไม่เสร็จ + ความเร่งด่วนสูงสุด)
  if (colStatus) {
    const L = function (c) { return c > 26 ? String.fromCharCode(64 + Math.floor((c - 1) / 26)) + String.fromCharCode(65 + (c - 1) % 26) : String.fromCharCode(64 + c); };
    const S = '$' + L(colStatus) + '2', U = colUrg ? '$' + L(colUrg) + '2' : '""';
    const area = sh.getRange(2, 1, maxRows - 1, lastCol);
    const cf = function (formula, bg, font) {
      const b = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula).setBackground(bg).setRanges([area]);
      if (font) b.setFontColor(font);
      return b.build();
    };
    const notDone = S + '<>"' + STATUS_TH.done + '",' + S + '<>""';
    const urg = function (n) { return 'AND(' + notDone + ',OR(' + U + '="' + URG_TH[n] + '",' + U + '=' + n + '))'; };
    const stArea = sh.getRange(2, colStatus, maxRows - 1, 1);
    sh.setConditionalFormatRules([
      // ช่องสถานะ "กำลังไป" = ฟ้า (ให้เห็นว่ามีทีมรับแล้ว)
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=' + S + '="' + STATUS_TH.going + '"').setBackground('#0F2188').setFontColor('#FFFFFF').setRanges([stArea]).build(),
      cf('=' + S + '="' + STATUS_TH.done + '"', '#DFF8E7', '#1B5E20'),          // ช่วยแล้ว = เขียว
      cf('=' + urg(4), '#B91C1C', '#FFFFFF'),                                   // วิกฤต = แดงเข้ม
      cf('=' + urg(3), '#FCA5A5', '#7F1D1D'),                                   // ด่วนมาก = แดง
      cf('=' + urg(2), '#FED7AA', '#7C2D12'),                                   // เร่งด่วน = ส้ม
      cf('=' + urg(1), '#FEF3C7', '#713F12')                                    // ทั่วไป = เหลือง
    ]);
  }
  // 3) หัวตาราง (ไม่เปลี่ยนชื่อที่ผู้ใช้ตั้ง) + ตรึงแถว
  sh.getRange(1, 1, 1, lastCol).setFontWeight('bold').setBackground('#0F2188').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  if (m.address) sh.setColumnWidth(m.address, 260);
  if (m.needs) sh.setColumnWidth(m.needs, 200);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), lastCol).createFilter();
  // แท็บทีม: หัวตารางไทย + แปลงค่า TRUE/FALSE เดิม
  const tsh = teamSheet_();
  tsh.getRange(1, 1, 1, TEAM_HEADERS.length).setValues([TEAM_HEADERS_TH]).setFontWeight('bold').setBackground('#0F2188').setFontColor('#FFFFFF');
  if (tsh.getLastRow() > 1) {
    const ac = tsh.getRange(2, 6, tsh.getLastRow() - 1, 1);
    ac.setValues(ac.getValues().map(function (r) { return [r[0] === true || r[0] === YES ? YES : NO]; }));
  }
  clearListCache_();
}

function teamSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = getTab_(ss, TEAM_SHEET);
  if (!sh) {
    sh = ss.insertSheet(TEAM_SHEET);
    sh.getRange(1, 1, 1, TEAM_HEADERS.length).setValues([TEAM_HEADERS_TH]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------- เครือข่ายช่วยเหลือ (แท็บ "เครือข่าย": มูลนิธิกรอกเอง ทุกคนเห็น) ---------- */
const NETWORK_SHEET = 'เครือข่าย';
const NETWORK_HEADERS_TH = ['ชื่อ', 'ประเภท', 'พิกัด (วางลิงก์ Google Maps หรือ ละติจูด,ลองจิจูด)', 'เบอร์โทร', 'รายละเอียด', 'เวลาทำการ', 'แสดงบนแผนที่'];
const NETWORK_TYPES = ['ทีมกู้ภัย', 'จุดพักพิง', 'จุดแจกของ', 'จุดแพทย์', 'มูลนิธิ/เครือข่าย', 'อื่น ๆ'];

function networkSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(NETWORK_SHEET);
  if (!sh) {
    sh = ss.insertSheet(NETWORK_SHEET);
    sh.getRange(1, 1, 1, NETWORK_HEADERS_TH.length).setValues([NETWORK_HEADERS_TH])
      .setFontWeight('bold').setBackground('#DE1F26').setFontColor('#FFFFFF').setWrap(true);
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 130); sh.setColumnWidth(3, 300); sh.setColumnWidth(5, 260);
    sh.getRange(2, 2, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(NETWORK_TYPES, true).setAllowInvalid(true).build());
    sh.getRange(2, 7, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList([YES, NO], true).build());
  }
  return sh;
}

/** พิกัดจาก "13.75, 100.5" หรือลิงก์ Google Maps (@lat,lng · q=lat,lng · !3dlat!4dlng) */
function parseLatLng_(v) {
  const s = decodeURIComponent(String(v || ''));
  const m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || s.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) ||
    s.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{2,3}\.\d{3,})/);
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  return (lat > 5 && lat < 21 && lng > 97 && lng < 106) ? { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 } : null;
}

function listNetworkCachedJson_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('network');
  if (hit) return hit;
  const sh = networkSheet_();
  const n = sh.getLastRow() - 1;
  let points = [], missing = 0;
  if (n > 0) {
    sh.getRange(2, 1, n, NETWORK_HEADERS_TH.length).getDisplayValues().forEach(function (v) {
      if (!String(v[0]).trim() || v[6] === NO) return;
      const ll = parseLatLng_(v[2]);
      if (!ll) { missing++; return; }
      points.push({ name: clean_(v[0], 80), type: clean_(v[1], 30) || 'อื่น ๆ', lat: ll.lat, lng: ll.lng,
        phone: clean_(v[3], 40), detail: clean_(v[4], 300), hours: clean_(v[5], 80) });
    });
  }
  const s = JSON.stringify({ ok: true, points: points.slice(0, 500), noLocation: missing });
  try { cache.put('network', s, 60); } catch (err) {}
  return s;
}

/** หาแถวของเคสจาก id (เร็วกว่าวนทุกแถว) */
function findRow_(sh, id) {
  if (!id || sh.getLastRow() < 2) return 0;
  const hit = sh.getRange(2, cols_(sh).id || 1, sh.getLastRow() - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function isVolunteer_(key) {
  const real = PropertiesService.getScriptProperties().getProperty('VOLUNTEER_KEY');
  return !!real && !!key && String(key) === real;
}

function urgency_(c) {
  // 4 = วิกฤต (เสี่ยงชีวิต), 3 = ด่วนมาก, 2 = เร่งด่วน, 1 = ทั่วไป
  const label = String(c.urgencyLabel || '');
  const needs = c.needs.join(' ');
  if (label.indexOf('ชีวิต') >= 0 || label.indexOf('วิกฤต') >= 0 || c.level === 'roof' ||
      c.vulnerable.indexOf('oxygen') >= 0) return 4;
  if (label.indexOf('ด่วนมาก') >= 0 || c.level === 'chest' || c.vulnerable.indexOf('bedridden') >= 0 ||
      needs.indexOf('รถพยาบาล') >= 0) return 3;
  if (label.indexOf('เร็ว') >= 0 || c.level === 'waist' || c.vulnerable.length ||
      needs.indexOf('ผู้ป่วย') >= 0 || needs.indexOf('อพยพ') >= 0) return 2;
  return 1;
}

function clean_(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function clampInt_(v, lo, hi, d) { const n = parseInt(v, 10); return isNaN(n) ? d : Math.max(lo, Math.min(hi, n)); }
function num_(v, lo, hi) { const n = Number(v); return (v === '' || v == null || isNaN(n) || n < lo || n > hi) ? '' : Math.round(n * 1e6) / 1e6; }
function list_(a) { return (Array.isArray(a) ? a : []).map(function (x) { return clean_(x, 40).replace(/,/g, ''); }).filter(String).slice(0, 12); }
function safeCell_(v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; }
function maskPhone_(p) { const s = String(p || ''); const d = s.replace(/\D/g, ''); return d.length < 4 ? '***' : 'xxx-xxx-' + d.slice(-4); }
function json_(o, raw) { return ContentService.createTextOutput(raw ? o : JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
