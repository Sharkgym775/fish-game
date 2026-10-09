
/* ================== Data ================== */
// Player evolution stages (size = cube root of mass)
const STAGES = [
  { id: 'minnow', size: 1, shape: 'slim', col: 0x8fb8d8, bel: 0xf0f6ff, fin: 0x5f8fb8, speed: 10.5, turn: 2.7, hp: 60, spec: 'dart', cd: 6, ic: '🐟' },
  { id: 'piranha', size: 1.5, shape: 'piranha', col: 0x6b7a88, bel: 0xe0403a, fin: 0x3e4a55, speed: 11.5, turn: 2.5, hp: 80, spec: 'frenzy', cd: 10, ic: '🦷' },
  { id: 'barracuda', size: 2.2, shape: 'barracuda', col: 0x9aa9b8, bel: 0xeef3f7, fin: 0x55606b, speed: 13, turn: 2.3, hp: 100, spec: 'lunge', cd: 7, ic: '🗡️' },
  { id: 'shark', size: 3.2, shape: 'shark', col: 0x5b7c99, bel: 0xf2f4f7, fin: 0x46627c, speed: 13.5, turn: 2.05, hp: 130, spec: 'sonar', cd: 12, ic: '🦈' },
  { id: 'megalodon', size: 4.6, shape: 'mega', col: 0x4d5e70, bel: 0xc9ced6, fin: 0x1b2229, speed: 13, turn: 1.8, hp: 170, spec: 'quake', cd: 11, ic: '🦖' },
  { id: 'whale', size: 6.5, shape: 'whale', col: 0x2a4f7a, bel: 0xc8d8e8, fin: 0x1f3b5c, speed: 12, turn: 1.55, hp: 220, spec: 'vacuum', cd: 12, ic: '🐋' },
];
const stageOf = size => { let s = 0; STAGES.forEach((x, i) => { if (size >= x.size - 1e-6) s = i; }); return s; };
const WIN_SIZE = STAGES[5].size;
// AI fish species (NPC). zone: 0 reef, 1 kelp, 2 twilight, 3 abyss
const SPC = {
  krill: { base: .4, col: 0xff8fa3, bel: 0xffd6de, fin: 0xff6f8a, shape: 'krill', school: [10, 16], zones: [0, 1, 2, 3], sp: 4.5 },
  sardine: { base: .62, col: 0x86aed0, bel: 0xeef6fc, fin: 0x5a7fa0, shape: 'slim', school: [10, 16], zones: [0, 1, 2], sp: 7 },
  clown: { base: .82, col: 0xff7a1f, bel: 0xffffff, fin: 0x1a1a1a, shape: 'round', stripes: 1, school: [4, 7], zones: [0], sp: 5.5 },
  tang: { base: 1.15, col: 0x2a6cff, bel: 0xffd21f, fin: 0x0a2a6b, shape: 'disc', school: [5, 8], zones: [0, 1], sp: 6.5 },
  puffer: { base: 1.45, col: 0xf2d16b, bel: 0xfff6d8, fin: 0xc79a2a, shape: 'puff', school: [1, 3], zones: [0, 1], sp: 4 },
  snapper: { base: 2.0, col: 0xd9483b, bel: 0xffc0a8, fin: 0xa02a20, shape: 'fish', school: [4, 7], zones: [1, 2], sp: 7.5 },
  angler: { base: 2.5, col: 0x2a2233, bel: 0x4a3a55, fin: 0x1a1420, shape: 'angler', glow: 0x7ef2ff, school: [1, 2], zones: [3], sp: 6, pred: 1 },
  tuna: { base: 3.1, col: 0x23395d, bel: 0xdfe6ee, fin: 0xffc21f, shape: 'fish', school: [3, 6], zones: [1, 2], sp: 10 },
  ray: { base: 4.6, col: 0x2e3f52, bel: 0xe8eef4, fin: 0x22303f, shape: 'ray', school: [1, 2], zones: [1, 2, 3], sp: 6 },
  reef: { base: 5.6, col: 0x6f7f8f, bel: 0xeef2f5, fin: 0x55626e, shape: 'shark', school: [1, 1], zones: [2, 3], sp: 10.5, pred: 1 },
  orca: { base: 8.6, col: 0x111318, bel: 0xffffff, fin: 0x111318, shape: 'orca', school: [1, 1], zones: [3], sp: 10, pred: 1 },
  gold: { base: .95, col: 0xffc21f, bel: 0xfff2a8, fin: 0xff9a1f, shape: 'round', glow: 0xffd84d, school: [6, 9], zones: [0, 1, 2], sp: 6.5, gold: 1 },
};
const SPK = Object.keys(SPC);
// population recipe: [species, schools]
const POP = [['krill', 3], ['sardine', 3], ['clown', 3], ['tang', 3], ['puffer', 3], ['snapper', 3], ['angler', 3], ['tuna', 3], ['ray', 3], ['reef', 3], ['orca', 2]];
const RAR = [
  { coul: '#b8c4d0', m: 1, cad: 0 },
  { coul: '#3fa9ff', m: 1.15, cad: .05 },
  { coul: '#b06cff', m: 1.32, cad: .1 },
  { coul: '#ffb21f', m: 1.55, cad: .15 },
];
const JAWS = {
  serrated: { ic: '🦷', dmg: 1, reach: 0, grow: 0 },
  crusher: { ic: '🪨', dmg: 1.3, reach: 0, grow: 0 },
  venom: { ic: '🧪', dmg: 1.1, reach: 6, grow: 3 },
  vacuum: { ic: '🌀', dmg: .9, reach: 14, grow: 0 },
};
const MODS = {
  fins: { ic: '🪽', val: [4, 7, 10, 14], k: 'vit' },
  scales: { ic: '🛡️', val: [10, 18, 26, 36], k: 'hp' },
  bubble: { ic: '🫧', val: [12, 20, 32, 48], k: 'sh' },
  gills: { ic: '🌬️', val: [12, 20, 30, 45], k: 'gills' },
  lure: { ic: '💡', val: [8, 14, 20, 28], k: 'lure' },
  belly: { ic: '🍽️', val: [4, 7, 10, 14], k: 'belly' },
  fang: { ic: '🗡️', val: [8, 14, 20, 28], k: 'cd' },
};
const W_SH = [0, 5, 10, 18];
const RADAR_RANGE = 70;
const PK_RAR = [0, 0, 1, 0, 2, 1, 0, 3];
const PK_AMT = { heal: [.35, .5, .7, 1], bubble: [1.35, 1.5, 1.65, 1.85] };
const SKINS = [
  { id: 'classic', niv: 1 },
  { id: 'sharkgym', niv: 2, c: 0x5b7c99, b: 0xf2f4f7, f: 0x22e5ff, sg: 1 },
  { id: 'reef', niv: 3, c: 0xff7a1f, b: 0xffffff, f: 0x1a1a1a, st: 1 },
  { id: 'tiger', niv: 5, c: 0x9a7a3a, b: 0xf0e2c0, f: 0x3a2a10, st: 1 },
  { id: 'neon', niv: 7, c: 0x101827, b: 0x2a1040, f: 0xff2bd6, em: 1 },
  { id: 'rainbow', niv: 10, c: 0xffffff, b: 0xffffff, f: 0xffffff, rb: 1 },
  { id: 'gold', niv: 999, ach: 'first_win', c: 0xd4a017, b: 0xffe680, f: 0x8a5a00, metal: 1 },
  { id: 'ghost', niv: 999, ach: 'ranked10', c: 0x9fe8ff, b: 0xe8fbff, f: 0x22e5ff, ghost: 1 },
  { id: 'lava', niv: 999, ach: 'kills100', c: 0x1b1b1f, b: 0x3a1a10, f: 0xff5a1f, em: 1 },
  { id: 'abyss', niv: 999, ach: 'mega', c: 0x0b0b0f, b: 0x22222a, f: 0xd61f1f, em: 1 },
];
const TIERS = [{ min: 0, coul: '#cd7f32', ic: '🥉' }, { min: 200, coul: '#c0c8d0', ic: '🥈' }, { min: 500, coul: '#ffc21f', ic: '🥇' }, { min: 900, coul: '#5fe0d0', ic: '💠' }, { min: 1400, coul: '#7ab8ff', ic: '💎' }, { min: 2000, coul: '#ff4d6d', ic: '👑' }];
const tierOf = rp => { let t = 0; TIERS.forEach((x, i) => { if (rp >= x.min) t = i; }); return t; };
const TRAILS = { '': [0xbfefff, 0xffffff, 0x9fe8ff], inferno: [0xff5a1f, 0xffc21f, 0xe3261a], electric: [0x7b2cff, 0xd0a0ff, 0xffffff], rainbow: [0xff3b3b, 0xffc21f, 0x7ef29d, 0x2fa8ff, 0xb06cff] };
const ACH = [
  { id: 'first_win', ic: '🏆', goal: 1, val: () => S.victoires, rw: { t: 'skin', id: 'gold' }, av: 'king' },
  { id: 'kills100', ic: '🍽️', goal: 300, val: () => S.eaten, rw: { t: 'skin', id: 'lava' }, av: 'dog' },
  { id: 'flawless', ic: '🛡️', goal: 1, val: () => S.flawless, rw: { t: 'title', id: 'untouchable' } },
  { id: 'ranked10', ic: '🥇', goal: 10, val: () => S.rankedWins, rw: { t: 'skin', id: 'ghost' } },
  { id: 'legendary', ic: '🌟', goal: 1, val: () => S.legend, rw: { t: 'horn', id: 'airhorn' }, av: 'snowman' },
  { id: 'wave10', ic: '🌊', goal: 10, val: () => S.meilleureVague, rw: { t: 'trail', id: 'inferno' } },
  { id: 'online5', ic: '🌐', goal: 5, val: () => S.enLigne, rw: { t: 'trail', id: 'electric' } },
  { id: 'multi5', ic: '🔥', goal: 5, val: () => S.meilleursKills, rw: { t: 'horn', id: 'roar' }, av: 'ronin' },
  { id: 'level10', ic: '⭐', goal: 10, val: () => xpInfo().n, rw: { t: 'title', id: 'veteran' }, av: 'toxic' },
  { id: 'special50', ic: '🦈', goal: 50, val: () => S.specials, rw: { t: 'trail', id: 'rainbow' } },
  { id: 'champion', ic: '👑', goal: 2000, val: () => S.rpMax, rw: { t: 'title', id: 'apex' } },
  { id: 'mega', ic: '🦖', goal: 5, val: () => S.maxStage + 1, rw: { t: 'skin', id: 'abyss' } },
  { id: 'whale', ic: '🐋', goal: 6, val: () => S.maxStage + 1, rw: { t: 'title', id: 'leviathan' } },
];
const PICK = {
  speed: { ic: '⚡', coul: 0x22e5ff },
  magnet: { ic: '🧲', coul: 0xff3b5c },
  bubble: { ic: '🫧', coul: 0x9fe8ff },
  frenzy: { ic: '🔥', coul: 0xff8a1f },
  heal: { ic: '💚', coul: 0x35e06a },
  pearl: { ic: '🦪', coul: 0xfff2c0 },
};
const PKK = Object.keys(PICK);
const MATCH_TIME = 360, ALERT_AT = 300;
const BOT_NOMS = L.botNames;
STAGES.forEach(s => { s.nom = L.stages[s.id]; s.specNom = L.specs[s.spec][0]; s.specDesc = L.specs[s.spec][1]; });
for (const k in SPC) SPC[k].nom = L.npc[k];
RAR.forEach((r, i) => r.nom = L.rarity[i]); TIERS.forEach((t, i) => t.nom = L.tiers[i]);
for (const k in JAWS) JAWS[k].nom = L.jaws[k];
for (const k in MODS) { MODS[k].nom = L.mods[k][0]; MODS[k].d = L.mods[k][1]; }
SKINS.forEach(s => s.nom = L.skins[s.id]);
for (const k in PICK) PICK[k].nom = L.picks[k];

/* ================== Save ================== */
const DEF = () => ({ v: 1, pseudo: '', xp: 0, niveau: 1, vague: 1, meilleureVague: 1, victoires: 0, parties: 0, kills: 0, eaten: 0, meilleursKills: 0, podiums: 0, bestSize: 1, bestScore: 0, maxStage: 0,
  son: true, gfx: 'high', lang: 'en', skin: 'classic', items: [{ u: 1, t: 'arme', b: 'serrated', r: 0 }], uid: 2, equip: { arme: 1, mods: [0, 0] }, enLigne: 0, rp: 0, rpMax: 0, rankedWins: 0, rankedMatches: 0, flawless: 0, legend: 0, specials: 0, ach: {}, style: { trail: '', horn: '', title: '' }, rivals: null, ranked: false, clan: 'STIMM', av: { id: 'shark', a: '', n: '' }, acct: 0, disp: DDEF(), pad: PADDEF(), ctl: { dz: 18, sens: 100, auto: 0 } });
function PADDEF() { return { boost: 7, slow: 6, bite: 5, special: 4, pause: 9, emote: 17 }; }
function sanPad(o) { const d = PADDEF(); if (o && typeof o === 'object') for (const k in d) { const v = Math.round(+o[k]); if (isFinite(v) && v >= 0 && v < 20) d[k] = v; } return d; }
function sanCtl(o) { o = o && typeof o === 'object' ? o : {}; const n = (v, a, b, def) => { v = Math.round(+v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : def; }; return { dz: n(o.dz, 5, 40, 18), sens: n(o.sens, 50, 160, 100), auto: o.auto ? 1 : 0 }; }
function DDEF() { return { hs: 100, bs: 100, bo: 90, edge: 0, joy: 'float', fov: 0, cam: 100, res: 100, dyn: 1, fps: 0, lay: {} }; }
const HUDW = { moi: 1, top3: 1, wep: 1, info: 1, pauseB: 1, feed: 1, emoBox: 1, bEmo: 1, mini: 1, vitals: 1, btns: 1, joyHint: 1 };
function sanDisp(o) { const d = DDEF(); if (!o || typeof o !== 'object') return d; const n = (v, a, b, def) => { v = Math.round(+v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : def; };
  d.hs = n(o.hs, 60, 140, 100); d.bs = n(o.bs, 60, 150, 100); d.bo = n(o.bo, 25, 100, 90); d.edge = n(o.edge, 0, 48, 0); d.joy = o.joy === 'fixed' ? 'fixed' : 'float'; d.fov = n(o.fov, -12, 20, 0); d.cam = n(o.cam, 70, 150, 100); d.res = n(o.res, 50, 100, 100); d.dyn = o.dyn === 0 ? 0 : 1; d.fps = o.fps ? 1 : 0;
  if (o.lay && typeof o.lay === 'object') for (const k in HUDW) { const v = o.lay[k]; if (Array.isArray(v)) d.lay[k] = [n(v[0], -3000, 3000, 0), n(v[1], -3000, 3000, 0)]; } return d; }
const HEX = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '';
const sanAv = o => { o = o && typeof o === 'object' ? o : {}; return { id: AVK.includes(o.id) ? o.id : 'operator', a: HEX(o.a), n: HEX(o.n) }; };
const sanClan = v => String(v == null ? 'STIMM' : v).replace(/[^A-Za-z0-9_]/g, '').toUpperCase().slice(0, 5);
let S = load();
function sanitize(o) {
  const d = DEF(); if (!o || typeof o !== 'object') throw new Error('format');
  const num = (v, max) => { v = Math.floor(+v); if (!isFinite(v) || v < 0) return 0; return Math.min(v, max); };
  d.pseudo = String(o.pseudo || '').replace(/[<>]/g, '').slice(0, 12);
  for (const k of ['xp', 'victoires', 'parties', 'kills', 'eaten', 'meilleursKills', 'podiums', 'bestScore', 'enLigne', 'rp', 'rpMax', 'rankedWins', 'rankedMatches', 'flawless', 'legend', 'specials']) d[k] = num(o[k], 1e10);
  d.bestSize = clamp(+o.bestSize || 1, 1, 99); d.maxStage = Math.min(5, num(o.maxStage, 5));
  d.niveau = Math.max(1, num(o.niveau, 999)); d.vague = Math.max(1, num(o.vague, 999)); d.meilleureVague = Math.max(d.vague, num(o.meilleureVague, 999));
  d.ranked = !!o.ranked; d.clan = sanClan(o.clan); d.av = sanAv(o.av || { id: 'shark' }); d.acct = o.acct ? 1 : 0; d.disp = sanDisp(o.disp); d.pad = sanPad(o.pad); d.ctl = sanCtl(o.ctl);
  if (o.ach && typeof o.ach === 'object') for (const a of ACH) if (o.ach[a.id]) d.ach[a.id] = 1;
  if (o.style && typeof o.style === 'object') { d.style.trail = TRAILS[o.style.trail] ? String(o.style.trail) : ''; d.style.horn = L.horns[o.style.horn] ? String(o.style.horn) : ''; d.style.title = L.titles[o.style.title] ? String(o.style.title) : ''; }
  if (Array.isArray(o.rivals)) d.rivals = o.rivals.slice(0, 20).filter(r => r && typeof r === 'object').map(r => ({ n: String(r.n || '?').replace(/[<>]/g, '').slice(0, 20), rp: num(r.rp, 99999) }));
  d.son = o.son !== false; d.gfx = ['low', 'medium', 'high', 'ultra'].includes(o.gfx) ? o.gfx : 'high'; d.lang = 'en';
  d.skin = SKINS.some(s => s.id === o.skin) ? o.skin : 'classic';
  if (Array.isArray(o.items)) {
    const seen = new Set(); d.items = [];
    for (const it of o.items.slice(0, 80)) {
      if (!it || typeof it !== 'object') continue; const u = num(it.u, 1e9); if (!u || seen.has(u)) continue;
      const t = it.t === 'mod' ? 'mod' : 'arme'; const b = String(it.b); if (t === 'arme' ? !JAWS[b] : !MODS[b]) continue;
      seen.add(u); d.items.push({ u, t, b, r: Math.min(3, num(it.r, 3)) });
    }
    if (!d.items.length) d.items = DEF().items;
  }
  d.uid = Math.max(num(o.uid, 1e9), ...d.items.map(i => i.u + 1));
  const has = (u, t) => d.items.some(i => i.u === u && i.t === t);
  if (o.equip && typeof o.equip === 'object') {
    const a = num(o.equip.arme, 1e9); d.equip.arme = has(a, 'arme') ? a : (d.items.find(i => i.t === 'arme') || {}).u || 0;
    const m = Array.isArray(o.equip.mods) ? o.equip.mods : []; d.equip.mods = [0, 1].map(i => { const u = num(m[i], 1e9); return has(u, 'mod') ? u : 0; });
    if (d.equip.mods[0] && d.equip.mods[0] === d.equip.mods[1]) d.equip.mods[1] = 0;
  } else d.equip.arme = (d.items.find(i => i.t === 'arme') || {}).u || 0;
  return d;
}
function load() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY)); return o ? sanitize(o) : DEF(); } catch (e) { return DEF(); } }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function hash32(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
function exportCode() { const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); return SAVE_PREFIX + b64 + '-' + hash32(b64); }
function parseCode(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (!code.startsWith(SAVE_PREFIX)) throw new Error(L.errPrefix + SAVE_PREFIX);
  const body = code.slice(SAVE_PREFIX.length), k = body.lastIndexOf('-'); if (k < 1) throw new Error(L.errIncomplete);
  const b64 = body.slice(0, k), h = body.slice(k + 1); if (hash32(b64) !== h) throw new Error(L.errInvalid);
  let o; try { o = JSON.parse(decodeURIComponent(escape(atob(b64)))); } catch (e) { throw new Error(L.errUnreadable); }
  return sanitize(o);
}
const pseudo = () => S.pseudo || L.player;
function checkAch() { const out = []; for (const a of ACH) { if (!S.ach[a.id] && a.val() >= a.goal) { S.ach[a.id] = 1; out.push(a); } } if (out.length) save(); return out; }
function rwName(rw) { return rw.t === 'skin' ? L.skins[rw.id] : rw.t === 'trail' ? L.trails[rw.id] : rw.t === 'horn' ? L.horns[rw.id] : L.titles[rw.id]; }
function rwType(rw) { return { skin: L.rwSkin, trail: L.rwTrail, horn: L.rwHorn, title: L.rwTitle }[rw.t]; }
function ensureRivals() { if (S.rivals && S.rivals.length) return; S.rivals = L.rivalNames.map((n, i) => ({ n, rp: Math.round(60 + i * 160 + Math.random() * 90) })); }
function tierHTML(rp) { const t = TIERS[tierOf(rp)]; return `<span class="tier" style="color:${t.coul}">${t.ic} ${t.nom}</span>`; }
const xpNeed = n => 200 + (n - 1) * 120;
function xpInfo() { let n = 1, x = S.xp; while (x >= xpNeed(n) && n < 999) { x -= xpNeed(n); n++; } return { n, x, need: xpNeed(n) }; }
/* Items: jaws (main slot) + 2 charms */
const itemById = u => S.items.find(i => i.u === u);
function itemNom(it) { return it.t === 'arme' ? JAWS[it.b].nom : MODS[it.b].nom; }
function itemIc(it) { return it.t === 'arme' ? JAWS[it.b].ic : MODS[it.b].ic; }
function jawStats(b, r) { const j = JAWS[b] || JAWS.serrated, R = RAR[r]; return { b, r, dmg: j.dmg * R.m, reach: j.reach + r * 4, grow: j.grow + r * 2 }; }
function itemDesc(it) { if (it.t === 'arme') { const j = jawStats(it.b, it.r); return L.jawDesc(j.dmg.toFixed(2), j.reach, j.grow); } return MODS[it.b].d(MODS[it.b].val[it.r]); }
function rollItem(bonus = 0) {
  const x = Math.random(); const pl = .03 + bonus * .03, pe = pl + .1 + bonus * .05, pr = pe + .3 + bonus * .05;
  const r = x < pl ? 3 : x < pe ? 2 : x < pr ? 1 : 0;
  const t = Math.random() < .3 ? 'arme' : 'mod';
  const b = pick(Object.keys(t === 'arme' ? JAWS : MODS));
  return { u: S.uid++, t, b, r };
}
function addItem(it) { if (it.r === 3) S.legend++; S.items.push(it); if (S.items.length > 60) { const i = S.items.findIndex(x => x.r === 0 && x.u !== S.equip.arme && !S.equip.mods.includes(x.u)); if (i >= 0) S.items.splice(i, 1); } }
function blankLo() { return { jaw: jawStats('serrated', 0), hp: 0, vit: 0, sh: 0, gills: 0, lure: 0, belly: 0, cd: 0 }; }
function myLoadout() {
  const lo = blankLo(); const a = itemById(S.equip.arme); lo.jaw = jawStats(a ? a.b : 'serrated', a ? a.r : 0);
  for (const u of S.equip.mods) { const m = itemById(u); if (m) lo[MODS[m.b].k] += MODS[m.b].val[m.r]; }
  lo.sh += W_SH[a ? a.r : 0]; return lo;
}
function botLoadout(k) { const lo = blankLo(); const r = Math.random() < k * .5 ? 1 + (Math.random() < k * .4 ? 1 : 0) : 0; lo.jaw = jawStats(pick(Object.keys(JAWS)), r); lo.sh = W_SH[r]; lo.vit = Math.random() < k ? 4 : 0; return lo; }
function sanitizeLo(lo) {
  try { const n = (v, m) => clamp(+v || 0, 0, m); const j = lo.jaw || {}; const out = blankLo(); out.jaw = jawStats(JAWS[j.b] ? j.b : 'serrated', clamp(j.r | 0, 0, 3));
    out.hp = n(lo.hp, 72); out.vit = n(lo.vit, 28); out.sh = n(lo.sh, 114); out.gills = n(lo.gills, 90); out.lure = n(lo.lure, 56); out.belly = n(lo.belly, 28); out.cd = n(lo.cd, 56); return out;
  } catch (e) { return botLoadout(0); }
}
