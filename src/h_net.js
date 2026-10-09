/* ================== Réseau (PeerJS / WebRTC, hôte autoritaire en étoile) ================== */
const PDBG = /[?&]debug/.test(location.search) ? 2 : 0;
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res();
  const urls = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
  const tryN = i => { if (i >= urls.length) return rej(new Error('cdn')); const s = document.createElement('script'); s.src = urls[i]; s.async = true; s.onload = () => window.Peer ? res() : tryN(i + 1); s.onerror = () => { s.remove(); tryN(i + 1); }; document.head.appendChild(s); }; tryN(0); }); }
function genCode() { const C = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += C[Math.random() * C.length | 0]; return s; }
const Net = {
  peer: null, role: null, code: '', conns: new Map(), host: null, slots: 6, lobby: [], inT: 0, snapT: 0, lastRx: 0,
  open() { return this.role === 'host' ? !!this.peer : !!(this.host && this.host.open); },
  send(m) { try { if (this.host && this.host.open) this.host.send(m); } catch (e) { } },
  broadcast(m) { for (const [, p] of this.conns) { try { if (p.conn.open) p.conn.send(m); } catch (e) { } } },
  close() {
    if (this.role === 'guest') this.send({ t: 'bye' }); if (this.role === 'host') this.broadcast({ t: 'bye' });
    const conns = [...this.conns.values()].map(p => p.conn); if (this.host) conns.push(this.host);
    setTimeout(() => conns.forEach(c => { try { c.close(); } catch (e) { } }), 150);
    if (this.peer) { const p = this.peer; setTimeout(() => { try { p.destroy(); } catch (e) { } }, 250); }
    this.peer = null; this.host = null; this.conns = new Map(); this.role = null; this.lobby = [];
  },
};
const myHello = () => ({ t: 'hello', av: S.av, cl: S.clan, nom: pseudo(), sk: S.skin, lo: myLoadout(), niv: xpInfo().n, rp: S.rp, ti: S.style.title, tr: S.style.trail, hn: S.style.horn });
// heartbeat: detects closed tabs / dropped peers even without a clean 'close'
setInterval(() => {
  const now = performance.now();
  if (Net.role === 'guest' && Net.open()) { Net.send({ t: 'hb' }); if (Net.lastRx && now - Net.lastRx > 12000) guestLost(); }
  if (Net.role === 'host') { Net.broadcast({ t: 'hb' }); for (const [pid, p] of [...Net.conns]) if (p.rx && now - p.rx > 9000) { try { p.conn.close(); } catch (e) { } hostLost(pid); } }
}, 2000);
addEventListener('pagehide', () => { if (Net.role) Net.close(); });
function lnMsg(m) { $('lnMsg').textContent = m; }
async function hostCreate(retry) {
  lnUI('salle'); lnMsg(L.connServer); $('lnCode').textContent = '····';
  try { await loadPeer(); } catch (e) { lnMsg(L.errModule); lnUI('choix'); return; }
  if (!retry) Net.close(); Net.role = 'host'; Net.code = genCode();
  const peer = new Peer(NET_PREFIX + Net.code, { debug: PDBG }); Net.peer = peer;
  peer.on('open', () => { if (Net.peer !== peer) return; $('lnCode').textContent = Net.code; lnMsg(L.giveCode); renderLobby(); });
  peer.on('connection', c => { if (Net.peer !== peer) return;
    if (Net.conns.size >= MAX_JOUEURS - 1 || G.net === 'host' && (G.mode === 'play' || G.mode === 'countdown')) { c.on('open', () => { c.send({ t: Net.conns.size >= MAX_JOUEURS - 1 ? 'full' : 'busy' }); setTimeout(() => c.close(), 400); }); return; }
    c.on('open', () => { Net.conns.set(c.peer, { rx: performance.now(), conn: c, nom: L.player, sk: 'classic', lo: null }); });
    c.on('data', d => { if (Net.peer === peer) hostData(c.peer, d); });
    c.on('close', () => { if (Net.peer === peer) hostLost(c.peer); }); c.on('error', () => { if (Net.peer === peer) hostLost(c.peer); });
  });
  peer.on('error', err => { if (Net.peer !== peer) return; if (err.type === 'unavailable-id') { Net.peer = null; try { peer.destroy(); } catch (e) { } hostCreate(true); return; } netError(err); });
  peer.on('disconnected', () => { if (Net.peer === peer && !peer.destroyed) setTimeout(() => { try { peer.reconnect(); } catch (e) { } }, 1000); });
}
function hostData(pid, d) {
  if (!d || typeof d !== 'object') return; const p = Net.conns.get(pid); if (!p) return; p.rx = performance.now();
  if (d.t === 'hello') { p.nom = String(d.nom || L.player).replace(/[<>]/g, '').slice(0, 12) || L.player; p.sk = SKINS.some(s => s.id === d.sk) ? d.sk : 'classic'; p.lo = sanitizeLo(d.lo); p.niv = clamp(d.niv | 0, 1, 999); p.rp = clamp(d.rp | 0, 0, 99999); p.ti = L.titles[d.ti] ? d.ti : ''; p.tr = TRAILS[d.tr] ? d.tr : ''; p.hn = L.horns[d.hn] ? d.hn : ''; p.av = sanAv(d.av); p.cl = sanClan(d.cl || ''); broadcastLobby(); }
  else if (d.t === 'emo') { const c = G.fish.find(c => c.peer === pid); const n = EMOTES[d.k | 0]; if (c && n && (!p.emoT || performance.now() - p.emoT > 900)) { p.emoT = performance.now(); netEmote(c, n); } }
  else if (d.t === 'in' && Array.isArray(d.c)) { const c = G.fish.find(c => c.peer === pid); if (!c) return; const a = d.c, ct = c.ctrl;
    ct.steer = clamp(+a[0] || 0, -1, 1); ct.pitch = clamp(+a[1] || 0, -1, 1); const f = a[2] | 0; ct.boost = !!(f & 1); ct.slow = !!(f & 2); ct.bite = !!(f & 4); ct.specN = a[3] | 0; }
  else if (d.t === 'bye') hostLost(pid);
}
function hostLost(pid) {
  const p = Net.conns.get(pid); if (!p) return; Net.conns.delete(pid);
  const c = G.fish.find(c => c.peer === pid);
  if (c && (G.mode === 'play' || G.mode === 'countdown')) { c.peer = null; c.bot = true; c.ai.k = .5; const d = document.createElement('div'); d.textContent = L.leftBot(c.nom); $('feed').prepend(d); setTimeout(() => d.remove(), 4000); }
  broadcastLobby();
}
function lobbyList() {
  const l = [{ pid: 'hote', nom: pseudo(), sk: S.skin, niv: xpInfo().n, hote: 1, rp: S.rp, ti: S.style.title, av: S.av, cl: S.clan }];
  for (const [pid, p] of Net.conns) l.push({ pid, nom: p.nom, sk: p.sk, niv: p.niv || 1, rp: p.rp || 0, ti: p.ti || '', av: p.av || sanAv(), cl: p.cl || '' });
  return l;
}
function broadcastLobby() { if (Net.role !== 'host') return; Net.lobby = lobbyList(); Net.broadcast({ t: 'lobby', l: Net.lobby, slots: Net.slots, code: Net.code, ranked: Net.ranked ? 1 : 0 }); renderLobby(); }
function hostStart() {
  if (Net.role !== 'host') return;
  const humans = lobbyList(); const n = Math.max(humans.length, Math.min(MAX_JOUEURS, Net.slots));
  const roster = []; const noms = [...BOT_NOMS].sort(() => Math.random() - .5);
  humans.forEach((h, i) => { const p = Net.conns.get(h.pid); roster.push(h.hote ? { id: i, nom: h.nom, sk: S.skin, lo: myLoadout(), local: true, tr: S.style.trail, ti: S.style.title, av: S.av, cl: S.clan, hn: S.style.horn } : { id: i, nom: p.nom, sk: p.sk, lo: p.lo || botLoadout(0), peer: h.pid, tr: p.tr, ti: p.ti, av: p.av, cl: p.cl, hn: p.hn }); });
  for (let i = humans.length; i < n; i++) roster.push({ id: i, nom: noms[i % noms.length] + ' 🤖', sk: botSkin(), bot: true, k: .6, lo: botLoadout(.6), av: botAv(), cl: pick(BOT_CLANS) });
  const seed = Math.random() * 1e9 | 0, pop = 1;
  const pub = roster.map(r => ({ id: r.id, nom: r.nom, sk: r.sk, lo: r.lo, tr: r.tr || '', ti: r.ti || '', hn: r.hn || '', bot: r.bot ? 1 : 0, k: r.k, peer: r.peer || null, av: r.av, cl: r.cl || '' }));
  for (const [pid, p] of Net.conns) { const me = roster.find(r => r.peer === pid); if (!me) continue; try { p.conn.send({ t: 'start', ranked: Net.ranked ? 1 : 0, seed, pop, roster: pub, you: me.id }); } catch (e) { } }
  startMatch(roster, (roster.find(r => r.local) || roster[0]).id, 'host', seed, pop);
}
async function guestJoin(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { lnMsg(L.enterCode); return; }
  lnMsg(L.connecting);
  try { await loadPeer(); } catch (e) { lnMsg(L.errModule); return; }
  Net.close(); Net.role = 'guest'; Net.code = code;
  const peer = new Peer({ debug: PDBG }); Net.peer = peer;
  const to = setTimeout(() => { if (Net.peer === peer && !Net.open()) { lnMsg(L.noAnswer); Net.close(); lnUI('choix'); } }, 15000);
  peer.on('open', () => { if (Net.peer !== peer) return; const c = peer.connect(NET_PREFIX + code, { reliable: true }); Net.host = c;
    c.on('open', () => { if (Net.host !== c) return; clearTimeout(to); c.send(myHello()); lnUI('salle'); $('lnCode').textContent = code; lnMsg(L.connected); });
    c.on('data', d => { if (Net.host === c) { Net.lastRx = performance.now(); guestData(d); } });
    c.on('close', () => { if (Net.host === c) guestLost(); }); c.on('error', () => { if (Net.host === c) guestLost(); }); });
  peer.on('error', err => { if (Net.peer !== peer) return; clearTimeout(to); if (err.type === 'peer-unavailable') { lnMsg(L.roomNotFound); Net.close(); lnUI('choix'); } else netError(err); });
}
function guestData(d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'lobby') { Net.lobby = d.l || []; Net.slots = d.slots | 0; Net.ranked = !!d.ranked; renderLobby(); }
  else if (d.t === 'full' || d.t === 'busy') { lnMsg(d.t === 'full' ? L.roomFull : L.roomBusy); Net.close(); lnUI('choix'); }
  else if (d.t === 'start') { Net.ranked = !!d.ranked; const roster = (d.roster || []).map(r => ({ ...r, lo: sanitizeLo(r.lo), local: r.id === d.you })); startMatch(roster, d.you, 'client', d.seed | 0, clamp(+d.pop || 1, .5, 1.4)); }
  else if (d.t === 's') applySnap(d);
  else if (d.t === 'end') { if (G.net === 'client' && G.mode !== 'end') { G.ended = true; showResults((d.res || []).map(r => ({ ...r }))); } }
  else if (d.t === 'bye') guestLost();
}
function guestLost() {
  const inGame = G.net === 'client' && (G.mode === 'play' || G.mode === 'countdown');
  Net.close(); G.net = null;
  if (inGame) { toMenu(); alertMsg(L.hostLeft); }
  else if ($('sLigne').classList.contains('on')) { lnUI('choix'); lnMsg(L.hostClosed); }
}
function netError(err) { console.warn('réseau', err && err.type); if (G.net && (G.mode === 'play' || G.mode === 'countdown')) return;
  lnMsg(err && (err.type === 'network' || err.type === 'server-error') ? L.serverDown : L.connError); Net.close(); lnUI('choix'); }
const r2 = v => Math.round(v * 100) / 100;
const TFLAG = ['biteT', 'dartT', 'frenzyT', 'sonarT', 'vacT', 'magT', 'frzT', 'spdT', 'lungeT', 'stunT', 'spawnT'];
function sendSnap() {
  const a = G.fish.map(c => { let fl = (c.alive ? 1 : 0) | (c.boostOn ? 2 : 0); TFLAG.forEach((k, i) => { if (c[k] > 0) fl |= 4 << i; });
    return [c.id, r2(c.pos.x), r2(c.pos.y), r2(c.pos.z), r2(c.yaw), r2(c.pitch), Math.round(c.mass * 1000) / 1000, Math.ceil(c.hp), fl, c.score, c.kills, c.deaths, Math.ceil(c.sh), c.shMax, c.maxHp, r2(c.specCd), Math.round(c.turbo), r2(c.speed), c.eaten]; });
  const base = { t: 's', mt: r2(G.mt), al: G.alert ? 1 : 0, a, pk: pickups.map(p => p.on ? 1 : 0).join(''), ev: G.ev };
  for (const [pid, p] of Net.conns) { const c = G.fish.find(f => f.peer === pid); const P = c ? c.pos : null; const n = [];
    for (const f of npcs) { if (!f.alive) continue; if (P && (Math.abs(f.pos.x - P.x) > 130 || Math.abs(f.pos.z - P.z) > 130)) continue; n.push(f.i, Math.round(f.pos.x * 10), Math.round(f.pos.y * 10), Math.round(f.pos.z * 10), Math.round(f.vel.x * 10), Math.round(f.vel.y * 10), Math.round(f.vel.z * 10)); }
    try { if (p.conn.open) p.conn.send({ ...base, n }); } catch (e) { } }
  G.ev = [];
}
const fishById = id => G.fish.find(c => c.id === id);
function applySnap(d) {
  if (G.net !== 'client' || !G.me) return; const now = performance.now(); if (typeof d.mt === 'number') G.mt = d.mt;
  if (d.al && !G.alert) startAlert();
  for (const e of d.a || []) {
    const c = fishById(e[0]); if (!c) continue; const fl = e[8];
    const wasAlive = c.alive; c.alive = !!(fl & 1); c.boostOn = !!(fl & 2); TFLAG.forEach((k, i) => { const on = !!(fl & (4 << i)); if (c !== G.me || k !== 'biteT') c[k] = on ? Math.max(c[k], .25) : 0; });
    if (Math.abs(c.mass - e[6]) > 1e-3) c.setMass(e[6]);
    c.hp = e[7]; c.score = e[9]; c.kills = e[10]; c.deaths = e[11]; if (c === G.me && e[12] < c.sh - .5) flashShield(); c.sh = e[12]; c.shMax = e[13]; c.maxHp = e[14]; c.specCd = e[15]; c.turbo = e[16]; c.eaten = e[18];
    if (!wasAlive && c.alive) { c.pos.set(e[1], e[2], e[3]); c.yaw = e[4]; c.pitch = e[5]; c.growK = .5; if (c === G.me) { G.deadMsg = 0; centreMsg(L.go, '', .6); camInit = true; } }
    if (c === G.me) { const dx = e[1] - c.pos.x, dy = e[2] - c.pos.y, dz = e[3] - c.pos.z, dd = Math.hypot(dx, dy, dz);
      if (dd > 8 || !c.alive) { c.pos.set(e[1], e[2], e[3]); c.yaw = e[4]; c.pitch = e[5]; } else { c.pos.x += dx * .2; c.pos.y += dy * .2; c.pos.z += dz * .2; c.yaw += angDiff(c.yaw, e[4]) * .1; } }
    else { c.net = { x: e[1], y: e[2], z: e[3], yaw: e[4], pitch: e[5], sp: e[17], t: now }; if (!c.netInit) { c.netInit = 1; c.pos.set(e[1], e[2], e[3]); c.yaw = e[4]; } }
  }
  const n = d.n || [], seen = new Set();
  for (let k = 0; k + 6 < n.length; k += 7) { const f = npcs[n[k]]; if (!f) continue; seen.add(f);
    const x = n[k + 1] / 10, y = n[k + 2] / 10, z = n[k + 3] / 10; f.net = { x, y, z, vx: n[k + 4] / 10, vy: n[k + 5] / 10, vz: n[k + 6] / 10, t: now };
    if (!f.alive || Math.abs(f.pos.x - x) + Math.abs(f.pos.y - y) + Math.abs(f.pos.z - z) > 15) f.pos.set(x, y, z); f.alive = true; }
  for (const f of npcs) if (!seen.has(f)) f.alive = false;
  if (typeof d.pk === 'string') pickups.forEach((p, i) => { const on = d.pk[i] === '1'; if (p.on !== on) { p.on = on; p.g.visible = on; } });
  for (const e of d.ev || []) {
    if (e.e === 'eat') { const f = npcs[e.i], a = fishById(e.c); if (f) { f.alive = false; if (a) eatFx(a, f); } }
    else if (e.e === 'emo') { const c = fishById(e.c); if (c && c !== G.me) showEmote(c, EMOTES[e.k | 0]); }
    else if (e.e === 'endmsg') { const c = fishById(e.c); centreMsg(e.w === 'time' ? '⏱️' : '🐋', e.w === 'goal' ? L.reachedGoal(c ? c.nom : '') : L.timeUp, 2); }
    else if (e.e === 'kill') { const v = fishById(e.v), k = fishById(e.k); if (v) { v.killer = e.k; if (v.alive) v.alive = false; fxEat(v.pos.x, v.pos.y, v.pos.z, v.size * 1.4, STAGES[v.stage].col, 0); feedKill(v, k, e.w); } }
    else if (e.e === 'bite') { const c = fishById(e.c); if (c) { biteFx(c, e.j ? 0xff5ad8 : 0xff4040); if (c === G.me) flashDmg(); } }
    else if (e.e === 'sp') { const c = fishById(e.c); if (c) specFx(c, e.k); }
    else if (e.e === 'pk') { const p = pickups[e.i]; if (p) { p.on = false; p.g.visible = false; } if (e.c === G.me.id && p) { SFX.pick(); toastPk(p.t, p.r); } }
  }
}
function puppet(c, dt) {
  const n = c.net; if (!n) return; const lag = Math.min(.2, (performance.now() - n.t) / 1000);
  const cp = Math.cos(n.pitch), tx = n.x + Math.sin(n.yaw) * cp * n.sp * lag, ty = n.y + Math.sin(n.pitch) * n.sp * lag, tz = n.z + Math.cos(n.yaw) * cp * n.sp * lag, k = 1 - Math.exp(-12 * dt);
  c.pos.x += (tx - c.pos.x) * k; c.pos.y += (ty - c.pos.y) * k; c.pos.z += (tz - c.pos.z) * k; c.yaw += angDiff(c.yaw, n.yaw) * k; c.pitch += (n.pitch - c.pitch) * k; c.speed = n.sp;
}
