const avUnlocked = id => { const a = AVATARS.find(x => x.id === id); return !!a && (!a.ach || !!S.ach[a.ach]); };
/* ================== Emotes & live HUD head ================== */
let emoScene = null, emoCam = null, emoModel = null, emoRect = null, emoLastAuto = 0, emoLastMan = 0;
function emoSetup() {
  const mode = S.gfx === 'ultra' ? 'live' : S.gfx === 'low' ? 'off' : 'flat';
  const box = $('emoBox'); box.className = mode; document.body.classList.toggle('noemo', mode === 'off'); $('emoBub').textContent = '';
  if (mode === 'flat') $('emoImg').src = avPortrait(G.me.av);
  if (emoModel) { emoScene.remove(emoModel); disposeAvatar(emoModel); emoModel = null; }
  if (mode !== 'live') return;
  if (!emoScene) { emoScene = new THREE.Scene(); emoScene.add(new THREE.HemisphereLight(0xd8c8ff, 0x402030, 2.4)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(2, 4, 5); emoScene.add(d); const rim = new THREE.DirectionalLight(0xff2bd6, 2.5); rim.position.set(-4, 2, -3); emoScene.add(rim); emoCam = new THREE.PerspectiveCamera(30, 1, .1, 20); emoCam.position.set(0, 1.66, 3.05); emoCam.lookAt(0, 1.6, 0); }
  emoModel = buildAvatar(G.me.av); emoScene.add(emoModel); emoRect = null;
}
function emoRender() {
  if (!emoModel || !G.me || !(G.mode === 'play' || G.mode === 'countdown') || S.gfx !== 'ultra') return;
  if (!emoRect) { const r = $('emoBox').getBoundingClientRect(); if (!r.width) return; emoRect = r; }
  const t = performance.now() / 1000; emoModel.userData.anim(t); emoModel.rotation.y = -.2;
  const r = emoRect, H = VH;
  renderer.setScissorTest(true); renderer.setViewport(r.left, H - r.bottom, r.width, r.height); renderer.setScissor(r.left, H - r.bottom, r.width, r.height);
  const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(emoScene, emoCam); renderer.autoClear = ac;
  renderer.setScissorTest(false); renderer.setViewport(0, 0, VW, VH);
}
addEventListener('resize', () => { emoRect = null; });
function showEmote(c, name) {
  if (!c || !EMOJI[name]) return; c.emo = name;
  if (c === G.me) { if (emoModel) emoModel.userData.emote(name); const b = $('emoBub'); b.textContent = EMOJI[name]; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); clearTimeout(showEmote.t); showEmote.t = setTimeout(() => b.classList.remove('pop'), 2600); }
  else if (c.tagEmo) { const e = c.tagEmo; e.textContent = EMOJI[name]; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2600); }
}
function netEmote(c, name) { showEmote(c, name); if (G.net === 'host') emit({ e: 'emo', c: c.id, k: EMOTES.indexOf(name) }); }
function emoteMe(name, why) { // why: 'manual' | 'force' | undefined (auto)
  const c = G.me; if (!c || !(G.mode === 'play' || G.mode === 'countdown') || !EMOJI[name]) return false; const now = performance.now();
  if (why === 'manual') { if (now - emoLastMan < 1000) return false; emoLastMan = now; } else if (why !== 'force' && now - emoLastAuto < 3500) return false;
  emoLastAuto = now; G.emoN = (G.emoN || 0) + 1;
  if (G.net === 'client') { showEmote(c, name); Net.send({ t: 'emo', k: EMOTES.indexOf(name) }); } else netEmote(c, name);
  return true;
}
function emoHud(c) { // auto-trigger reactions from the HUD loop
  if (G.lastHp == null || !c.alive) { G.lastHp = c.hp; if (!c.alive) G.screamed = 0; }
  if (c.alive && c.hp < G.lastHp - 6) { if (c.hp < c.maxHp * .25 && !G.screamed) { G.screamed = 1; emoteMe('scream', 'force'); } else if (Math.random() < .35) emoteMe(pick(['rage', 'huff'])); }
  if (c.hp > c.maxHp * .5) G.screamed = 0;
  G.lastHp = c.hp;
  if (c.frzT > 0 && !G.lastFrz) emoteMe(pick(['starstruck', 'tongue']), 'force'); G.lastFrz = c.frzT > 0;
}
function buildWheel() {
  const w = $('emoWheel'), n = EMOTES.length; w.innerHTML = `<div class="ew">${EMOTES.map((e, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; return `<button data-e="${e}" style="left:calc(50% + ${Math.cos(a) * 112}px);top:calc(50% + ${Math.sin(a) * 112}px)">${EMOJI[e]}</button>`; }).join('')}<span>${L.emotes}</span></div>`;
}
function toggleWheel(on) { const w = $('emoWheel'); if (on == null) on = !w.classList.contains('on'); if (on && !w.innerHTML) buildWheel(); w.classList.toggle('on', on); }
$('emoWheel').addEventListener('pointerdown', e => { e.stopPropagation(); const b = e.target.closest('button[data-e]'); if (b) emoteMe(b.dataset.e, 'manual'); toggleWheel(false); });
$('bEmo').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); toggleWheel(); });
$('emoBox').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); toggleWheel(); });
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if (e.key.toLowerCase() === 't' && (G.mode === 'play' || G.mode === 'countdown')) toggleWheel(); });
// --- live 3D avatar preview (title + profile) ---
let avR = null, avScene = null, avCam = null, avModel = null, avKey = '';
function avPreview(av, slot) {
  const cv = $('avCv'); if (cv.parentNode !== $(slot)) $(slot).appendChild(cv);
  if (!avR) { avR = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); avR.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    avScene = new THREE.Scene(); avScene.add(new THREE.HemisphereLight(0xd8c8ff, 0x402030, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(2, 4, 5); avScene.add(d);
    const rim = new THREE.DirectionalLight(0xff2bd6, 2.5); rim.position.set(-4, 2, -3); avScene.add(rim); avCam = new THREE.PerspectiveCamera(30, 1, .1, 50); }
  const w = cv.clientWidth || 120, h = cv.clientHeight || 140; avR.setSize(w, h, false); avCam.aspect = w / h; avCam.updateProjectionMatrix();
  const sm = slot === 'avSlotT'; avCam.position.set(0, sm ? 1.7 : 1.55, sm ? 3.4 : 4.3); avCam.lookAt(0, sm ? 1.4 : 1.2, 0);
  av = sanAv(av); const key = av.id + av.a + av.n; if (key === avKey && avModel) return; avKey = key;
  if (avModel) { avScene.remove(avModel); disposeAvatar(avModel); } avModel = buildAvatar(av); avScene.add(avModel);
}
function avFrame(now) {
  if (!avR || !avModel || !($('sTitre').classList.contains('on') || $('sCompte').classList.contains('on'))) return;
  const t = now / 1000; avModel.userData.anim(t); avModel.rotation.y = Math.sin(t * .4) * .35; avR.render(avScene, avCam);
}

// --- account / profile screen ---
let avEdit = null, acctFirst = false;
function openAccount(first) {
  acctFirst = !!first; avEdit = { ...S.av };
  $('cTitre').textContent = first ? L.createAccount : L.editAccount; $('bCompteOk').textContent = first ? L.createBtn : L.saveProfile;
  $('bCompteRet').style.display = first ? 'none' : ''; $('cTag').value = S.pseudo; $('cClan').value = S.clan; $('cMsg').textContent = '';
  showScreen('sCompte'); renderAccount();
}
function renderAccount() {
  const def = AVATARS.find(a => a.id === avEdit.id);
  $('cAvGrid').innerHTML = AVATARS.map(a => { const ok = avUnlocked(a.id); return `<button class="avb ${a.id === avEdit.id ? 'sel' : ''} ${ok ? '' : 'lock'}" data-av="${a.id}"><img src="${avPortrait({ id: a.id })}" alt=""><small>${L.avNames[a.id]}</small>${ok ? '' : `<em>🔒</em>`}</button>`; }).join('');
  const sw = (arr, cur, dflt, k) => [''].concat(arr).map(c => `<button class="swb ${(cur || '') === c ? 'sel' : ''}" data-k="${k}" data-c="${c}" style="background:${c || dflt}">${c ? '' : '★'}</button>`).join('');
  $('cOut').innerHTML = sw(AV_OUTFIT, avEdit.a, def.a, 'a'); $('cNeon').innerHTML = sw(AV_NEON, avEdit.n, def.n, 'n');
  $('cAvNom').innerHTML = `<b>${L.avNames[avEdit.id]}</b>${def.ach ? `<small>🏆 ${L.ach[def.ach][0]}</small>` : ''}`;
  avPreview(avEdit, 'avSlotC');
}
$('cAvGrid').addEventListener('click', e => { const b = e.target.closest('button[data-av]'); if (!b) return; const id = b.dataset.av;
  if (!avUnlocked(id)) { const a = AVATARS.find(x => x.id === id); $('cMsg').textContent = L.avLockedBy(L.ach[a.ach][0]); return; }
  avEdit = { id, a: '', n: '' }; $('cMsg').textContent = ''; SFX.clic(); renderAccount(); });
['cOut', 'cNeon'].forEach(el => $(el).addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; avEdit[b.dataset.k] = b.dataset.c; renderAccount(); }));
$('bCompteOk').onclick = () => {
  const tag = $('cTag').value.replace(/[<>]/g, '').trim().slice(0, 12); if (!tag) { $('cMsg').textContent = L.needTag; return; }
  S.pseudo = tag; S.clan = sanClan($('cClan').value); S.av = sanAv(avEdit); S.acct = 1; save(); SFX.levelUp(); renderTitle(); showScreen('sTitre');
};
$('bCompteRet').onclick = () => { renderTitle(); showScreen('sTitre'); };
$('bProfil').onclick = () => openAccount(false);
/* ================== Écran / Display settings ================== */
const IS_TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
function fitK() { return clamp(Math.min(VH / 430, VW / 900), .62, 1); }
function applyDisp() {
  const d = S.disp, k = fitK(), R = document.documentElement.style;
  R.setProperty('--hs', (d.hs / 100 * k).toFixed(3)); R.setProperty('--bs', (d.bs / 100 * k).toFixed(3)); R.setProperty('--bo', (d.bo / 100).toFixed(2)); R.setProperty('--edge', d.edge + 'px');
  document.body.classList.toggle('joyFix', d.joy === 'fixed'); document.body.classList.toggle('showFps', !!d.fps);
  for (const id in HUDW) { const el = $(id); if (!el) continue; el.classList.add('hw'); const v = d.lay[id]; el.style.translate = v ? `${v[0]}px ${v[1]}px` : ''; }
  emoRect = null; requestAnimationFrame(clampLayout);
}
function clampLayout() { // garde chaque élément déplacé dans l'écran visible
  if (!$('hud').offsetParent && !document.body.classList.contains('hudEdit')) return;
  for (const id in S.disp.lay) { const el = $(id), v = S.disp.lay[id]; if (!el) continue; const r = el.getBoundingClientRect(); if (!r.width) continue;
    let dx = 0, dy = 0; if (r.left < 0) dx = -r.left; else if (r.right > VW) dx = VW - r.right; if (r.top < 0) dy = -r.top; else if (r.bottom > VH) dy = VH - r.bottom;
    if (dx || dy) { v[0] = Math.round(v[0] + dx); v[1] = Math.round(v[1] + dy); el.style.translate = `${v[0]}px ${v[1]}px`; } }
  emoRect = null;
}
function onResize2() { if (typeof S !== 'undefined' && S.disp) applyDisp(); if (composer) composer.setSize(VW, VH); emoRect = null; checkPortrait(); updDispInfo(); }
function checkPortrait() {
  const p = IS_TOUCH && VH > VW * 1.05; const was = document.body.classList.contains('portrait'); document.body.classList.toggle('portrait', p);
  if (p && !was && !G.net && (G.mode === 'play' || G.mode === 'countdown') && !G.paused) pauseGame();
}
function tryLockLandscape() { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => { }); } catch (e) { } }
addEventListener('pointerdown', tryLockLandscape, { once: true });
function updDispInfo() { const el = $('dInfo'); if (el && S && S.disp) el.textContent = L.dispInfo(VW, VH, +(devicePixelRatio || 1).toFixed(2), `${Math.round(VW * curPR())}×${Math.round(VH * curPR())}`); }
const DSL = { dHs: ['hs', '%'], dBs: ['bs', '%'], dBo: ['bo', '%'], dEdge: ['edge', 'px'], dFov: ['fov', '°'], dCam: ['cam', '%'], dRes: ['res', '%'] };
function renderDisp() {
  const d = S.disp; for (const id in DSL) { const [k, u] = DSL[id]; $(id).value = d[k]; $('o' + id.slice(1)).textContent = (k === 'fov' && d[k] > 0 ? '+' : '') + d[k] + u; }
  document.querySelectorAll('#dJoy button').forEach(b => b.classList.toggle('sel', b.dataset.j === d.joy));
  document.querySelectorAll('#dDyn button').forEach(b => b.classList.toggle('sel', +b.dataset.v === d.dyn));
  document.querySelectorAll('#dFps button').forEach(b => b.classList.toggle('sel', +b.dataset.v === d.fps)); updDispInfo();
}
for (const id in DSL) $(id).addEventListener('input', () => { const k = DSL[id][0]; S.disp[k] = +$(id).value; save(); renderDisp(); applyDisp(); if (k === 'res') applyPR(); });
$('dJoy').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.disp.joy = b.dataset.j; save(); renderDisp(); applyDisp(); });
$('dDyn').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.disp.dyn = +b.dataset.v; if (!S.disp.dyn) { dynK = 1; applyPR(); } save(); renderDisp(); });
$('dFps').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.disp.fps = +b.dataset.v; save(); renderDisp(); applyDisp(); fpsTick(); });
$('bDispDef').onclick = () => { const lay = S.disp.lay; S.disp = DDEF(); S.disp.lay = lay; save(); renderDisp(); applyDisp(); applyPR(); };
$('pTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setPTab(b.dataset.p); });
function setPTab(t) { $('pGen').style.display = t === 'gen' ? '' : 'none'; $('pDisp').style.display = t === 'disp' ? '' : 'none'; $('pCtl').style.display = t === 'ctl' ? '' : 'none'; if (t === 'ctl') renderCtl(); document.querySelectorAll('#pTabs button').forEach(b => b.classList.toggle('sel', b.dataset.p === t)); if (t === 'disp') renderDisp(); }
$('bRetour3b').onclick = () => $('bRetour3').onclick();
// Éditeur de disposition du HUD
let heFrom = null;
function hudEditOpen(from) {
  heFrom = from; document.body.classList.add('hudEdit'); showScreen(null);
  if (!G.me) { $('vitals').querySelector('#shTxt').textContent = '15/15'; $('hpTxt').textContent = '60/60'; $('shBar').style.width = '100%'; $('hpBar2').style.width = '100%'; $('iTime').textContent = '6:00'; }
  applyDisp();
}
function hudEditClose() { document.body.classList.remove('hudEdit'); document.querySelectorAll('.hw.drag').forEach(e => e.classList.remove('drag')); save(); emoRect = null; if (heFrom === 'pause') showScreen('sPause'); else { renderParam(); setPTab('disp'); showScreen('sParam'); } }
$('bHudEdit').onclick = () => hudEditOpen('param');
$('bHudEditP').onclick = () => hudEditOpen('pause');
$('bHeDone').onclick = hudEditClose;
const resetLay = () => { S.disp.lay = {}; save(); applyDisp(); };
$('bHeReset').onclick = resetLay; $('bHudReset').onclick = () => { resetLay(); alertMsg(L.resetHud + ' ✓'); };
(() => { let drag = null;
  document.addEventListener('pointerdown', e => { if (!document.body.classList.contains('hudEdit')) return; const el = e.target.closest('.hw'); if (!el) return; e.preventDefault(); e.stopPropagation();
    const v = S.disp.lay[el.id] || [0, 0]; drag = { el, id: el.id, x: e.clientX, y: e.clientY, v0: v.slice(), pid: e.pointerId }; el.classList.add('drag'); }, true);
  document.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.pid) return; const v = [Math.round(drag.v0[0] + e.clientX - drag.x), Math.round(drag.v0[1] + e.clientY - drag.y)]; S.disp.lay[drag.id] = v; drag.el.style.translate = `${v[0]}px ${v[1]}px`; }, true);
  const up = e => { if (!drag || e.pointerId !== drag.pid) return; drag.el.classList.remove('drag'); drag = null; clampLayout(); save(); };
  document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
})();
