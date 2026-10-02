/**
 * UM+ / UMMATEE — ระบบรับเคสขอความช่วยเหลือน้ำท่วม -> Google Sheet
 * โปรเจกต์ Apps Script แยก (standalone) เขียนลง Google Sheet ตาม SHEET_ID แล้ว Deploy เป็น Web app
 *
 * API (ใช้ URL เดียวของ Web app):
 *   POST {action:"create", ...ข้อมูลเคส}                 -> สร้างเคสใหม่ (ใครก็ส่งได้) ได้ id + token กลับไป
 *   GET  ?action=list                                     -> รายการเคส (ปิดเบอร์โทร/ชื่อบางส่วน)
 *   GET  ?action=list&key=รหัสอาสา                        -> รายการเคสแบบเห็นเบอร์เต็ม
 *   POST {action:"update", key, id, status, volunteer}    -> อาสาเปลี่ยนสถานะ (ต้องมีรหัสอาสา)
 *   POST {action:"track", id, token}                      -> ผู้แจ้งดูสถานะคำขอของตัวเอง
 *   GET  ?action=teams[&key=รหัสอาสา]                     -> ตำแหน่งทีมที่แชร์อยู่ (คนทั่วไปได้พิกัดปัด ~100 ม.)
 *   POST {action:"ping", key, team, lat, lng, accuracy}   -> ทีมอาสาแชร์ตำแหน่ง / {stop:true} หยุดแชร์
 *
 * รหัสอาสา: Project Settings > Script properties > VOLUNTEER_KEY (setup() สร้างให้ครั้งแรก)
 */

const SHEET_ID = '1GkGL0PrjuADwMmuSSj0KjW9WLH180eATD1RkmzEqGMs'; // Google Sheet "UM+ - เคสน้ำท่วม"
const SHEET_NAME = 'Cases';
const TEAM_SHEET = 'Teams';
const HEADERS = [
  'id', 'createdAt', 'status', 'urgency', 'name', 'phone', 'district', 'people',
  'address', 'lat', 'lng', 'level', 'needs', 'vulnerable', 'notes',
  'volunteer', 'updatedAt', 'token'
];
const TEAM_HEADERS = ['team', 'lat', 'lng', 'accuracy', 'updatedAt', 'active'];
const STATUSES = ['open', 'going', 'done'];
const LEVELS = ['ankle', 'knee', 'waist', 'chest', 'roof'];
const MAX = { name: 60, phone: 20, district: 40, address: 300, notes: 800, volunteer: 60, team: 40 };
const LIST_CACHE_SEC = 20;          // แคชรายการเคส ลดเวลาโหลดเมื่อมีคนเปิดพร้อมกันเยอะ
const TEAM_FRESH_MIN = 30;          // แสดงทีมที่ส่งตำแหน่งภายใน 30 นาที

/** กด Run ฟังก์ชันนี้ 1 ครั้ง เพื่อสร้างแท็บ Cases/Teams, ขอสิทธิ์ และสร้างรหัสอาสา */
function setup() {
  sheet_();
  teamSheet_();
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
    id: id, createdAt: now, status: 'open', urgency: urgency_(c),
    name: c.name, phone: c.phone, district: c.district, people: c.people,
    address: c.address, lat: c.lat, lng: c.lng, level: c.level,
    needs: c.needs.join(', '), vulnerable: c.vulnerable.join(', '),
    notes: c.notes, volunteer: '', updatedAt: now, token: token
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    // ข้อความที่ขึ้นต้นด้วย = + - @ ใส่ ' นำหน้า กันสูตรใน Sheet
    // เบอร์โทรใส่ ' นำหน้าเสมอ ไม่ให้ Sheet ตัดเลข 0 ข้างหน้า
    sheet_().appendRow(HEADERS.map(function (h) {
      return h === 'phone' ? "'" + row.phone : safeCell_(row[h]);
    }));
  } finally {
    lock.releaseLock();
  }
  if (cid) cache.put('cid:' + cid, id + '|' + token, 21600);
  clearListCache_();
  return { ok: true, id: id, token: token, urgency: row.urgency };
}

function updateCase_(b) {
  if (STATUSES.indexOf(b.status) < 0) return { ok: false, error: 'bad_status' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheet_();
    const r = findRow_(sh, b.id);
    if (!r) return { ok: false, error: 'not_found' };
    const col = function (name) { return HEADERS.indexOf(name) + 1; };
    sh.getRange(r, col('status')).setValue(b.status);
    if (b.status === 'open') sh.getRange(r, col('volunteer')).setValue('');
    else if (b.volunteer) sh.getRange(r, col('volunteer')).setValue(safeCell_(clean_(b.volunteer, MAX.volunteer)));
    sh.getRange(r, col('updatedAt')).setValue(new Date());
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
  const v = sh.getRange(r, 1, 1, HEADERS.length).getValues()[0];
  const o = {};
  HEADERS.forEach(function (h, i) { o[h] = v[i] instanceof Date ? v[i].getTime() : v[i]; });
  if (!o.token || String(o.token) !== token) return { ok: false, error: 'not_found' };
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
  const values = sh.getRange(2, 1, n, HEADERS.length).getValues();
  const sinceMs = since ? Number(since) : 0;
  const cases = values.map(function (v) {
    const o = {};
    HEADERS.forEach(function (h, i) { o[h] = v[i] instanceof Date ? v[i].getTime() : v[i]; });
    delete o.token;                                   // ไม่ส่ง token ออกไปเด็ดขาด
    o.needs = o.needs ? String(o.needs).split(/\s*,\s*/) : [];
    o.vulnerable = o.vulnerable ? String(o.vulnerable).split(/\s*,\s*/) : [];
    if (!full) {
      o.phone = maskPhone_(o.phone);
      o.name = o.name ? String(o.name).slice(0, 1) + '***' : '';
      o.notes = '';
    }
    return o;
  }).filter(function (o) { return o.id && (!sinceMs || o.updatedAt > sinceMs); });
  return { ok: true, cases: cases, volunteer: full };
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
      if (r) sh.getRange(r, 5, 1, 2).setValues([[now, false]]);
      return { ok: true, stopped: true };
    }
    const row = [safeCell_(team), lat, lng, clampInt_(b.accuracy, 0, 100000, 0), now, true];
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
      return v[0] && v[5] === true && t >= cutoff && v[1] !== '' && v[2] !== '';
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

function sheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  // เพิ่มหัวคอลัมน์ใหม่ (เช่น token) ให้ชีตเดิม ครั้งเดียว
  const cache = CacheService.getScriptCache();
  if (!cache.get('hdr:' + HEADERS.length)) {
    const cur = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (cur.join('|') !== HEADERS.join('|')) sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    cache.put('hdr:' + HEADERS.length, '1', 21600);
  }
  return sh;
}

function teamSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(TEAM_SHEET);
  if (!sh) {
    sh = ss.insertSheet(TEAM_SHEET);
    sh.getRange(1, 1, 1, TEAM_HEADERS.length).setValues([TEAM_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** หาแถวของเคสจาก id (เร็วกว่าวนทุกแถว) */
function findRow_(sh, id) {
  if (!id || sh.getLastRow() < 2) return 0;
  const hit = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function isVolunteer_(key) {
  const real = PropertiesService.getScriptProperties().getProperty('VOLUNTEER_KEY');
  return !!real && !!key && String(key) === real;
}

// 3 = วิกฤต/เสี่ยงต่อชีวิต, 2 = เร่งด่วน, 1 = ทั่วไป
function urgency_(c) {
  const label = String(c.urgencyLabel || '');
  const needs = c.needs.join(' ');
  if (label.indexOf('ด่วนมาก') >= 0 || label.indexOf('ชีวิต') >= 0 ||
      c.level === 'chest' || c.level === 'roof' ||
      c.vulnerable.indexOf('bedridden') >= 0 || c.vulnerable.indexOf('oxygen') >= 0) return 3;
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
