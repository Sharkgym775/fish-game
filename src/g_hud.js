
/* ================== HUD ================== */
const mini = $('mini').getContext('2d');
const tierCol = (o, me) => o.size * 1.1 < me.size ? 'prey' : o.size > me.size * 1.1 ? 'foe' : 'even';
function updHud() {
  const c = G.me; if (!c) return; emoHud(c);
  { const top = Math.max(c.shMax, c.sh); $('shBar').style.width = (Math.min(c.sh, c.shMax) / top * 100) + '%'; $('ovBar').style.width = (Math.max(0, c.sh - c.shMax) / top * 100) + '%'; $('shTxt').textContent = `${Math.ceil(c.sh)}/${c.shMax}`;
    $('hpBar2').style.width = (Math.max(0, c.hp) / c.maxHp * 100) + '%'; $('hpTxt').textContent = `${Math.max(0, Math.ceil(c.hp))}/${c.maxHp}`; $('vitals').classList.toggle('low', c.hp < c.maxHp * .3); $('vitals').classList.toggle('regen', c.sh < c.shMax && c.shT <= 0 && c.alive); }
  $('tuBar').style.width = c.turbo + '%'; $('spBar').style.width = (100 - clamp(c.specCd / c.specMax, 0, 1) * 100) + '%';
  $('bSpec').classList.toggle('cd', c.specCd > 0); $('bSpecIc').textContent = STAGES[c.stage].ic;
  const st = STAGES[c.stage], nx = STAGES[c.stage + 1];
  $('wIc').textContent = st.ic; $('wNom').textContent = `${st.nom} · ${c.size.toFixed(2)}`;
  const pr = nx ? clamp((c.size - st.size) / (nx.size - st.size), 0, 1) : 1; $('gBar').style.width = (pr * 100) + '%';
  $('wSub').textContent = nx ? L.nextStage(nx.nom, Math.floor(pr * 100)) : L.maxStage;
  const rem = Math.max(0, MATCH_TIME - G.mt); $('iTime').textContent = `${Math.floor(rem / 60)}:${String(Math.floor(rem % 60)).padStart(2, '0')}`; $('iTime').classList.toggle('alert', !!G.alert);
  const buffs = (c.frzT > 0 ? ' 🔥×2' : '') + (c.magT > 0 ? ' 🧲' : '') + (c.spdT > 0 ? ' ⚡' : '') + (c.sonarT > 0 ? ' 📡' : '') + (c.frenzyT > 0 ? ' 🦷' : '');
  $('iEnn').textContent = c.score + buffs;
  const y = -c.pos.y; $('iZone').textContent = `${L.zones[Math.max(zoneAt(c.pos.x), zoneOfDepth(c.pos.y))]} · ${Math.round(y)} m`;
  G.topT = (G.topT || 0) - 1; if (G.topT <= 0) { G.topT = 15; const top = [...G.fish].sort((a, b) => b.score - a.score).slice(0, 3);
    $('top3').innerHTML = top.map((o, i) => `<div class="${o === c ? 'moi' : ''}"><b>${i + 1}</b><img src="${portraits[o.id] || ''}" alt=""><span>${o.clan ? `<i class="cl">[${esc(o.clan)}]</i>` : ''}${esc(o.nom)}</span><em>${STAGES[o.stage].ic}${o.score}</em></div>`).join(''); }
  const Wd = VW, H = VH;
  for (const o of G.fish) { if (!o.tag) continue; if (!o.alive) { o.tag.style.display = 'none'; continue; }
    tv.set(o.pos.x, o.pos.y + o.size * .9 + .8, o.pos.z).project(camera); const d = camera.position.distanceTo(o.pos);
    if (tv.z > 1 || d > 75) { o.tag.style.display = 'none'; continue; }
    o.tag.style.display = ''; o.tag.style.transform = `translate(${(tv.x * .5 + .5) * Wd}px,${(-tv.y * .5 + .5) * H}px)`; o.tagBar.style.width = (o.hp / o.maxHp * 100) + '%'; o.tagSh.style.width = (Math.min(1, o.sh / (o.shMax || 1)) * 100) + '%';
    const cl = tierCol(o, c); if (o._cl !== cl) { o._cl = cl; o.tag.classList.remove('prey', 'foe', 'even'); o.tag.classList.add(cl); } o.tagSz.textContent = STAGES[o.stage].ic + ' ' + o.size.toFixed(1); }
  // rotating, heading-up, proximity radar
  const M = mini, sz = 224, cx = sz / 2, R = cx - 12, P = c.pos, yaw = c.yaw, range = RADAR_RANGE * (c.sonarT > 0 ? 2.2 : 1) * (.8 + c.size * .12), sc = R / range;
  const rx = -Math.cos(yaw), rz = Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw), tt = performance.now() / 1000;
  const m = (x, z) => { const dx = x - P.x, dz = z - P.z; return [cx + (dx * rx + dz * rz) * sc, cx - (dx * fx + dz * fz) * sc]; };
  M.clearRect(0, 0, sz, sz);
  const bg = M.createRadialGradient(cx, cx, 10, cx, cx, R); bg.addColorStop(0, 'rgba(6,40,70,.8)'); bg.addColorStop(1, 'rgba(2,10,24,.88)'); M.fillStyle = bg; M.beginPath(); M.arc(cx, cx, R, 0, 7); M.fill();
  M.save(); M.beginPath(); M.arc(cx, cx, R, 0, 7); M.clip();
  M.strokeStyle = 'rgba(34,229,255,.12)'; M.lineWidth = 1; for (const rr of [R * .33, R * .66]) { M.beginPath(); M.arc(cx, cx, rr, 0, 7); M.stroke(); }
  for (const r of rocks) { const [x, y] = m(r.x, r.z); if (Math.hypot(x - cx, y - cx) > R + 20) continue; M.fillStyle = 'rgba(160,190,220,.22)'; M.beginPath(); M.arc(x, y, r.r * sc, 0, 7); M.fill(); }
  M.restore();
  const inR = (x, y) => Math.hypot(x - cx, y - cx) <= R - 4;
  for (const f of npcs) { if (!f.alive) continue; const dx = f.pos.x - P.x, dz = f.pos.z - P.z; if (Math.abs(dx) > range || Math.abs(dz) > range) continue; const [x, y] = m(f.pos.x, f.pos.z); if (!inR(x, y)) continue;
    const big = f.size > c.size * 1.1, ed = f.size * 1.1 < c.size; M.fillStyle = f.S.gold ? '#ffd84d' : big ? (f.S.pred ? '#ff2b4e' : '#ff8a5a') : ed ? '#7ef29d' : '#ffe066';
    const r = clamp(1.6 + f.size / c.size * 2.4, 1.6, 9); M.beginPath(); M.arc(x, y, r, 0, 7); M.fill(); if (f.S.pred && big) { M.strokeStyle = '#fff'; M.lineWidth = 1; M.stroke(); } }
  for (const j of jellies) { const [x, y] = m(j.pos.x, j.pos.z); if (!inR(x, y)) continue; M.fillStyle = 'rgba(255,90,216,.8)'; M.beginPath(); M.arc(x, y, 3.5, 0, 7); M.fill(); }
  for (const p of pickups) { if (!p.on) continue; const [x, y] = m(p.x, p.z); if (!inR(x, y)) continue; M.fillStyle = '#' + PICK[p.t].coul.toString(16).padStart(6, '0'); M.beginPath(); M.moveTo(x, y - 6); M.lineTo(x + 5, y); M.lineTo(x, y + 6); M.lineTo(x - 5, y); M.closePath(); M.fill(); M.strokeStyle = 'rgba(255,255,255,.8)'; M.lineWidth = 1; M.stroke(); }
  for (const o of G.fish) { if (!o.alive || o === c) continue; const [x, y] = m(o.pos.x, o.pos.z); if (!inR(x, y)) continue; const cl = tierCol(o, c);
    M.fillStyle = cl === 'prey' ? '#22e5ff' : cl === 'foe' ? '#ff2bd6' : '#ffe066'; M.beginPath(); M.arc(x, y, clamp(4 + o.size / c.size * 3, 4, 11), 0, 7); M.fill(); M.strokeStyle = '#fff'; M.lineWidth = 2; M.stroke(); }
  for (const q of sInd) { if (q.rel == null) continue; const th = Math.atan2(-Math.cos(q.rel), Math.sin(q.rel)), al = Math.min(1, q.t / 1.6 * 1.4) * q.it, pulse = 1 + (1.6 - q.t) * .08;
    M.strokeStyle = `rgba(255,170,40,${al.toFixed(2)})`; M.lineWidth = 7 * q.it + 2; M.shadowColor = '#ffaa28'; M.shadowBlur = 12; M.beginPath(); M.arc(cx, cx, (R - 9) * Math.min(1, pulse), th - .32, th + .32); M.stroke(); }
  M.shadowBlur = 0;
  M.lineWidth = 5; M.strokeStyle = G.alert ? `rgba(255,${190 + 40 * Math.sin(tt * 8)},60,1)` : c.sonarT > 0 ? '#7ef29d' : '#22e5ff'; M.shadowColor = M.strokeStyle; M.shadowBlur = 10; M.beginPath(); M.arc(cx, cx, R, 0, 7); M.stroke();
  M.lineWidth = 1.5; M.strokeStyle = '#ff2bd6'; M.shadowColor = '#ff2bd6'; M.beginPath(); M.arc(cx, cx, R - 5, 0, 7); M.stroke(); M.shadowBlur = 0;
  { const [nx, ny] = m(P.x, P.z - 1000), d = Math.hypot(nx - cx, ny - cx), X = cx + (nx - cx) / d * R, Y = cx + (ny - cx) / d * R; M.fillStyle = '#021022'; M.beginPath(); M.arc(X, Y, 11, 0, 7); M.fill(); M.strokeStyle = '#22e5ff'; M.lineWidth = 2; M.stroke(); M.fillStyle = '#fff'; M.font = '900 14px system-ui,sans-serif'; M.textAlign = 'center'; M.textBaseline = 'middle'; M.fillText('N', X, Y + 1); }
  M.fillStyle = '#7ef29d'; M.shadowColor = '#7ef29d'; M.shadowBlur = 8; M.beginPath(); M.moveTo(cx, cx - 11); M.lineTo(cx + 8, cx + 8); M.lineTo(cx, cx + 3); M.lineTo(cx - 8, cx + 8); M.closePath(); M.fill(); M.shadowBlur = 0;
  // depth gauge on the radar's left edge
  const dk = clamp(-c.pos.y / 120, 0, 1); M.fillStyle = 'rgba(255,255,255,.18)'; M.fillRect(6, 40, 5, 144); M.fillStyle = '#22e5ff'; M.fillRect(4, 40 + dk * 140, 9, 4);
}
/* ---- directional danger / sound indicators ---- */
const sInd = []; const IND_RANGE = 110;
function soundInd(x, z, w = 1) {
  const c = G.me; if (!c || !(G.mode === 'play' || G.mode === 'countdown')) return;
  const dx = x - c.pos.x, dz = z - c.pos.z, d = Math.hypot(dx, dz); if (d > IND_RANGE || d < 2.5) return;
  const ang = Math.atan2(dx, dz), it = clamp((1 - d / IND_RANGE) * w, .18, 1);
  const o = sInd.find(q => Math.abs(angDiff(q.ang, ang)) < .3);
  if (o) { o.ang = ang; o.x = x; o.z = z; o.t = 1.6; o.it = Math.max(o.it * .8, it); o.d = d; } else { if (sInd.length >= 8) sInd.shift(); sInd.push({ ang, x, z, t: 1.6, it, d }); }
}
const sIndEl = [];
function updSoundInd(dt) {
  const box = $('sndInd'); if (!box) return;
  for (let i = sInd.length - 1; i >= 0; i--) { sInd[i].t -= dt; if (sInd[i].t <= 0) sInd.splice(i, 1); }
  const c = G.me, on = c && (G.mode === 'play' || G.mode === 'countdown');
  while (sIndEl.length < 8) { const e = document.createElement('i'); box.appendChild(e); sIndEl.push(e); }
  const Wd = VW, H = VH, yaw = on ? c.yaw : 0, rx = -Math.cos(yaw), rz = Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
  sIndEl.forEach((e, i) => { const q = on && sInd[i]; if (!q) { e.style.opacity = 0; return; }
    const dx = q.x - c.pos.x, dz = q.z - c.pos.z, a = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz); q.rel = a;
    const show = Math.abs(a) > .55 || q.d < 14; const al = show ? Math.min(1, q.t / 1.6 * 1.4) * q.it : 0;
    e.style.opacity = al.toFixed(2); e.style.transform = `translate(${Math.sin(a) * Wd * .42}px,${-Math.cos(a) * H * .4}px) rotate(${a}rad) scale(${.7 + q.it * .6})`; });
}
function dangerScan() { // threats approaching (predators hunting you, bigger rivals)
  const c = G.me; if (!c || !c.alive || G.mode !== 'play') return; let n = 0;
  for (const f of npcs) { if (!f.alive || f.size <= c.size * 1.1) continue; const d = f.pos.distanceTo(c.pos); if (d < 10 + f.size * 3 && (f.hunt === c || f.S.pred)) { soundInd(f.pos.x, f.pos.z, 1.1); if (d < 6 + f.size && !G.screamT) { G.screamT = 1; emoteMe('scream'); } n++; } }
  for (const o of G.fish) { if (o === c || !o.alive || o.size <= c.size * 1.1) continue; if (o.pos.distanceTo(c.pos) < 14 + o.size * 3) soundInd(o.pos.x, o.pos.z, 1); }
  if (!n) G.screamT = 0;
}
function feedKill(v, k, why) {
  const d = document.createElement('div'); const meK = k === G.me, meV = v === G.me;
  d.textContent = k ? (meK ? L.youKilled(v.nom) : meV ? L.killedYou(k.nom) : `${k.nom} 😋 ${v.nom}`) : (meV ? L.eatenBy(why || '?') : `${v.nom} ☠️ ${why || ''}`);
  if (meK || meV) d.className = 'moi'; $('feed').prepend(d); while ($('feed').children.length > 4) $('feed').lastChild.remove(); setTimeout(() => d.remove(), 4500);
  if (meK) { centreMsg(L.wreckedBig, `${v.nom}`, 1.2); SFX.horn(S.style.horn); emoteMe(pick(['cool', 'laugh', 'party']), 'force'); }
}
let centreT = 0;
function centreMsg(a, b = '', t = 1) { $('centre').innerHTML = `${esc(a)}${b ? `<small>${esc(b)}</small>` : ''}`; centreT = t; }
function toastPk(t, r) { centreMsg(PICK[t].ic, (r > 0 ? RAR[r].nom + ' ' : '') + PICK[t].nom, .8); }
function flashShield() { const v = $('vitals'); v.classList.remove('hit'); void v.offsetWidth; v.classList.add('hit'); }
function flashDmg() { $('dmgFlash').style.boxShadow = 'inset 0 0 90px rgba(255,30,10,.75)'; clearTimeout(flashDmg.t); flashDmg.t = setTimeout(() => $('dmgFlash').style.boxShadow = '', 120); }

/* ================== Portraits & Feeding Frenzy finale ================== */
const portraits = {};
let pRen = null, pScene = null, pCam = null;
function renderPortraits() { try { for (const c of G.fish) portraits[c.id] = avPortrait(c.av); } catch (e) { console.warn('portrait', e); } G.topT = 0; }
function ensurePRen() {
  if (pRen) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; pRen = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); pRen.setPixelRatio(1); pRen.setSize(96, 96, false);
  pScene = new THREE.Scene(); pScene.add(new THREE.HemisphereLight(0xd8c8ff, 0x402030, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(2, 4, 5); pScene.add(d); pCam = new THREE.PerspectiveCamera(30, 1, .1, 100);
}
const avCache = {};
function avPortrait(av) {
  av = sanAv(av); const key = av.id + av.a + av.n; if (avCache[key]) return avCache[key];
  try { ensurePRen(); const g = buildAvatar(av); g.rotation.y = -.25; g.userData.anim(1.2); pScene.add(g);
    pCam.position.set(.25, 1.75, 2.6); pCam.lookAt(0, 1.45, 0); pRen.setClearColor(0x000000, 0); pRen.render(pScene, pCam);
    avCache[key] = pRen.domElement.toDataURL('image/png'); pScene.remove(g); disposeAvatar(g); } catch (e) { console.warn('avatar', e); return ''; }
  return avCache[key];
}
function startAlert() {
  G.alert = true; G.alertK = 0; setTimeout(() => emoteMe('suspicious', 'force'), 600); $('alertBan').classList.add('on'); setTimeout(() => $('alertBan').classList.remove('on'), 4200); SFX.siren(); document.body.classList.add('alerte');
  if (AUTH()) for (const f of npcs) if (f.school.gold) { f.alive = false; f.respT = rand(.5, 3); }
  setTimeout(() => { if (G.alert && G.mode === 'play') { centreMsg('✨', L.megaSpawn, 2.2); SFX.levelUp(); } }, 3200);
}
function alertTick(dt) { G.alertK = Math.min(1, (G.alertK || 0) + dt / 3); }
function resetAlert() { G.alert = false; G.alertK = 0; document.body.classList.remove('alerte'); $('alertBan').classList.remove('on'); }
