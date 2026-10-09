
/* ================== Loop ================== */
function step(dt) {
  if (G.mode === 'countdown') { G.cd -= dt; const n = Math.ceil(G.cd); if (n !== G.lastCd && n > 0) { G.lastCd = n; centreMsg(String(n), n === 3 ? L.cdHint : '', 1); SFX.bip(); } if (G.cd <= 0) { G.mode = 'play'; centreMsg(L.go, '', .8); SFX.go(); } }
  const playing = G.mode === 'play' || G.mode === 'countdown' || G.mode === 'end';
  if (!playing) { if (G.mode === 'menu' || G.mode === 'garage') { G.t += dt; updNPCs(dt); } return; }
  G.t += dt; const me = G.me;
  const z = c => { const ct = c.ctrl; ct.steer = ct.pitch = 0; ct.boost = ct.slow = ct.bite = false; };
  if (IN.specN !== G.lastSpecN) { G.lastSpecN = IN.specN; if (G.mode === 'play' && me.alive && me.specCd <= 0) S.specials++; }
  if (G.mode === 'play' && me.alive && !G.paused) readInput(me.ctrl); else { z(me); me.ctrl.specN = IN.specN; }
  if (AUTH()) {
    if (G.mode === 'play' && !G.ended) { G.mt += dt; checkEnd(); }
    for (const c of G.fish) {
      tickTimers(c, dt);
      if (!c.alive) { if (G.mode === 'play' && !G.ended) { c.respawnT -= dt; if (c.respawnT <= 0) respawnFish(c); } continue; }
      if (c.shT > 0) c.shT -= dt; else if (c.sh < c.shMax) c.sh = Math.min(c.shMax, c.sh + c.shMax * .09 * dt);
      if (c.sh > c.shMax) c.sh = Math.max(c.shMax, c.sh - 2 * dt);
      if (G.t - (c.hitT || 0) > 4 && c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + c.maxHp * .02 * dt);
      if (G.mode !== 'play') { const s = c.ctrl.specN; z(c); c.seen.spec = s; c.ctrl.specN = s; continue; }
      if (c.bot) aiThink(c, dt);
      const ct = c.ctrl; if (ct.specN !== c.seen.spec) { c.seen.spec = ct.specN; useSpecial(c); }
      if (ct.bite && c.biteCd <= 0) { c.biteT = .35; c.biteCd = c.frenzyT > 0 ? .3 : .85; const d = nearMe(c.pos.x, c.pos.y, c.pos.z); if (c === G.me) SFX.bite(1); else if (d < 25) SFX.at(c.pos.x, c.pos.y, c.pos.z, () => SFX.bite(.5)); }
      c.physics(dt);
    }
    updNPCs(dt); if (G.mode === 'play') combat(dt); updPickups(dt);
    if (G.net === 'host') { G.snapT -= dt; if (G.snapT <= 0 && G.mode !== 'end') { G.snapT = 1 / 12; sendSnap(); } }
    if (G.ended && G.mode !== 'end') { G.endT -= dt; if (G.endT <= 0) finishMatch(); }
  } else {
    tickTimers(me, dt);
    if (me.alive && G.mode === 'play') { const ct = me.ctrl; if (ct.bite && me.biteCd <= 0) { me.biteT = .35; me.biteCd = me.frenzyT > 0 ? .3 : .85; SFX.bite(1); } me.physics(dt); }
    for (const c of G.fish) if (c !== me) puppet(c, dt);
    updNPCs(dt); updPickups(dt);
    Net.inT -= dt; if (Net.inT <= 0 && G.mode !== 'end') { Net.inT = 1 / 20; const ct = me.ctrl; Net.send({ t: 'in', c: [r2(ct.steer), r2(ct.pitch), (ct.boost ? 1 : 0) | (ct.slow ? 2 : 0) | (ct.bite ? 4 : 0), ct.specN] }); }
  }
  if (!me.alive && G.mode === 'play' && !G.deadMsg) { G.deadMsg = 1; centreMsg(L.wrecked, L.respawning, 3); }
  if (AUTH() && G.mt >= ALERT_AT && !G.alert && G.mode === 'play') startAlert();
  if (G.alert) alertTick(dt);
  G.dangerT = (G.dangerT || 0) - dt; if (G.dangerT <= 0) { G.dangerT = .45; dangerScan(); }
  for (const c of G.fish) c.syncMesh(dt);
  SFX.engine(me.speed, G.mode === 'play' && me.alive);
}
let last = performance.now(), fpsAcc = 0, fpsN = 0; G.fps = 60;
function frame(now) {
  requestAnimationFrame(frame);
  const rawDt = Math.max(0, (now - last) / 1000); let dt = Math.min(.05, rawDt); last = now; fpsAcc += Math.min(rawDt, .5); fpsN++; if (fpsAcc > 1) { G.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; fpsTick(); }
  const sdt = G.paused && !G.net ? 0 : dt; UT.value += sdt;
  for (let i = 0; i < (G.ts || 1); i++) step(sdt);
  pollPad(); updParts(dt); updFx(dt); avFrame(now); updShowcase(dt);
  updJellies(G.mode === 'menu' || G.mode === 'garage' ? UT.value : G.mt); drawNPCs();
  updCamera(dt); updWater(); updRays(UT.value); updBubbles(dt); updSnow(); updShadowCam();
  if (G.mode === 'play' || G.mode === 'countdown') updHud();
  if (centreT > 0) { centreT -= dt; if (centreT <= 0) $('centre').innerHTML = ''; }
  if (composer) composer.render(); else renderer.render(scene, camera);
  emoRender(); if (G.me) SFX.listen(camera); updSoundInd(dt);
}

/* ================== Graphics quality ================== */
let composer = null, bloomMods = null;
const GFX = {
  low: { pr: 1, sh: 0, pm: .5, pop: .6, kelp: 120, coral: 150, bub: 60, rays: 0, caus: 0, fog: .016, snow: 0 },
  medium: { pr: 1.5, sh: 0, pm: .75, pop: .8, kelp: 260, coral: 260, bub: 130, rays: 4, caus: 3, fog: .0135, snow: 1 },
  high: { pr: 2.25, sh: 1024, pm: 1, pop: 1, kelp: 400, coral: 340, bub: 240, rays: 8, caus: 4, fog: .012, snow: 1 },
  ultra: { pr: 3, sh: 2048, pm: 1.6, pop: 1.25, kelp: 560, coral: 420, bub: 420, rays: 14, caus: 5, fog: .0105, snow: 1, bloom: 1, pbr: 1 },
};
let dynK = 1, basePR = 1, envTex = null, envMods = null, dynT = 0;
function curPR() { return Math.max(.5, basePR * (S.disp.res / 100) * dynK); }
function applyPR() { const pr = curPR(); renderer.setPixelRatio(pr); renderer.setSize(VW, VH, false); if (composer) { composer.setPixelRatio(pr); composer.setSize(VW, VH); } updDispInfo(); }
function fpsTick() {
  const f = Math.round(G.fps || 0); if (S.disp.fps) $('fpsBox').textContent = `${f} FPS · ${Math.round(VW * curPR())}×${Math.round(VH * curPR())}${dynK < 1 ? ' · dyn ' + Math.round(dynK * 100) + '%' : ''}`;
  if (!S.disp.dyn || document.hidden || !(G.mode === 'play' || G.mode === 'countdown')) return;
  dynT++; if (f < 45 && dynK > .55) { dynK = Math.max(.55, dynK - .1); dynT = 0; applyPR(); } else if (f > 57 && dynK < 1 && dynT >= 3) { dynK = Math.min(1, dynK + .05); dynT = 0; applyPR(); }
}
function refreshMats() {
  for (const sp in npcMeshes) { const im = npcMeshes[sp], old = im.material; im.material = fishMaterial(shapeMode(SPC[sp].shape)); old.dispose(); }
  for (const c of G.fish) { const gk = c.growK; c.buildMesh(); c.growK = gk; }
  if (showcase) setShowcase();
}
async function applyGfx() {
  const q = GFX[S.gfx] || GFX.high, pbrWas = G.pbr; G.pbr = !!q.pbr; G.pm = q.pm; G.fogD = q.fog;
  basePR = Math.min(devicePixelRatio || 1, q.pr); dynK = 1;
  const shOn = !!q.sh; renderer.shadowMap.enabled = shOn; renderer.shadowMap.type = THREE.PCFSoftShadowMap; sun.castShadow = shOn;
  if (shOn) { sun.shadow.mapSize.set(q.sh, q.sh); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } const sc = sun.shadow.camera; sc.left = sc.bottom = -45; sc.right = sc.top = 45; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix(); sun.shadow.bias = -.0005; sun.shadow.normalBias = .04; sun.shadow.radius = q.pbr ? 4 : 2; }
  renderer.toneMapping = S.gfx === 'high' || S.gfx === 'ultra' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping; renderer.toneMappingExposure = q.pbr ? .95 : 1.2;
  if (kelpM) kelpM.count = q.kelp; if (coralM) coralM.count = q.coral; if (sponM) sponM.count = Math.round(q.coral * .38); nBub = q.bub; nRays = q.rays;
  if (causM) { causM.visible = q.caus > 0; causM.material.uniforms.uN.value = Math.max(1, q.caus); } if (snow) snow.visible = !!q.snow;
  if (q.pbr) { try { if (!envTex) { if (!envMods) envMods = await import('three/addons/environments/RoomEnvironment.js'); const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromScene(new envMods.RoomEnvironment(), .04).texture; pm.dispose(); } scene.environment = envTex; scene.environmentIntensity = .45; } catch (e) { console.warn('env', e); } }
  else scene.environment = null;
  if (pbrWas !== G.pbr && window.__booted) refreshMats();
  scene.traverse(o => { if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); });
  if (q.bloom) {
    try {
      if (!bloomMods) bloomMods = await Promise.all([import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'), import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js')]);
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = bloomMods;
      if (composer) composer.dispose();
      const rt = new THREE.WebGLRenderTarget(VW, VH, { type: THREE.HalfFloatType });
      composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(VW, VH), .38, .45, 1.05)); composer.addPass(new OutputPass());
    } catch (e) { console.warn('bloom', e); composer = null; }
  } else if (composer) { composer.dispose(); composer = null; }
  applyPR();
}
function updShadowCam() { if (!sun.castShadow) return; const c = G.me && (G.mode === 'play' || G.mode === 'countdown' || G.mode === 'end') ? G.me.pos : tv2.set(-95, -20, 0); sun.position.set(c.x + 20, c.y + 70, c.z + 12); sun.target.position.set(c.x, c.y - 10, c.z); sun.target.updateMatrixWorld(); }

/* ================== Fish showcase (Fish & skins screen) ================== */
let showcase = null;
function setShowcase(st) {
  const s0 = showcase ? showcase.userData.st : 0; if (showcase) { scene.remove(showcase); showcase.material.dispose(); }
  const s = st != null ? st : s0; showcase = buildFishMesh(s, S.skin); showcase.userData = { st: s, k: 1.25, t: 0 }; showcase.position.set(-118, -12, 0); showcase.scale.setScalar(1.25); showcase.rotation.order = 'YXZ'; scene.add(showcase);
  document.querySelectorAll('#skins .evo').forEach(e => e.classList.toggle('sel', +e.dataset.st === s));
}
function updShowcase(dt) { if (!showcase) return; showcase.rotation.y += dt * .6; const u = showcase.userData; u.t += dt; if (u.t > 3.2 && !u.hold) { u.t = 0; setShowcase((u.st + 1) % STAGES.length); } }
function hideShowcase() { if (showcase) { scene.remove(showcase); showcase.material.dispose(); showcase = null; } }

/* ================== Screens ================== */
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); if (id === 'sTitre') requestAnimationFrame(() => avPreview(S.av, 'avSlotT')); }
function alertMsg(m) { $('toast').textContent = m; $('toast').classList.add('on'); clearTimeout(alertMsg.t); alertMsg.t = setTimeout(() => $('toast').classList.remove('on'), 2600); }
function toMenu() {
  G.mode = 'menu'; G.paused = false; G.ended = true; clearFish(); $('hud').classList.remove('on'); SFX.engine(0, false); resetAlert();
  if (G.net) G.net = null; buildPopulation(1234, (GFX[S.gfx] || GFX.high).pop * .8); makePickups(4242); hideShowcase(); renderTitle(); showScreen('sTitre');
}
function renderTitle() {
  const xi = xpInfo();
  $('tNiv').textContent = L.level + ' ' + xi.n; $('tVag').textContent = L.wave + ' ' + S.vague; $('tVic').textContent = S.victoires + ' ' + (S.victoires === 1 ? L.win1 : L.winN);
  $('tTier').innerHTML = tierHTML(S.rp) + ` · ${S.rp} ${L.rp}`; $('tTag').innerHTML = `${S.clan ? `<i class="cl">[${esc(S.clan)}]</i> ` : ''}${esc(pseudo())}`; $('tAvNom').textContent = L.avNames[S.av.id] || ''; $('tXp').style.width = (xi.x / xi.need * 100) + '%'; $('tXpTxt').textContent = `${xi.x} / ${xi.need} XP`;
}
const sUnlocked = s => s.ach ? !!S.ach[s.ach] : xpInfo().n >= s.niv;
const hx = v => '#' + v.toString(16).padStart(6, '0');
let garageFrom = 'solo';
function openGarage(from) { garageFrom = from; G.mode = 'garage'; if (!sUnlocked(SKINS.find(s => s.id === S.skin) || SKINS[0])) S.skin = 'classic'; setShowcase(0); renderGarage(); showScreen('sGarage'); }
function renderGarage() {
  $('gMapW').style.display = 'none';
  $('vgrid').innerHTML = SKINS.map(s => { const ok = sUnlocked(s), c = s.c != null ? s.c : STAGES[3].col, f = s.f != null ? s.f : STAGES[3].fin;
    return `<div class="vcard ${S.skin === s.id ? 'sel' : ''} ${ok ? '' : 'lock'}" data-s="${s.id}"><i style="background:${s.rb ? 'linear-gradient(90deg,#ff3b3b,#ffc21f,#7ef29d,#2fa8ff,#b06cff)' : `linear-gradient(135deg,${hx(c)} 55%,${hx(f)} 55%)`}"></i><div>${s.nom}${ok ? '' : `<em>${s.ach ? '🏆 ' + L.ach[s.ach][0] : '🔒 ' + L.level + ' ' + s.niv}</em>`}</div></div>`; }).join('');
  const sk = SKINS.find(s => s.id === S.skin) || SKINS[0];
  $('vDesc').textContent = `${sk.nom}: your skin follows you through every evolution.${sk.id === 'sharkgym' ? ' Neon SharkGym trims appear from the Shark stage.' : ''}`;
  $('vStats').innerHTML = vitalsBreak(0);
  $('vSpec').innerHTML = `<b>${L.special}</b> — ` + STAGES.map(s => `${s.ic} <b>${s.specNom}</b>`).join(' · ') + `<br><small>${L.cdHint} ${L.killGoal()}.</small>`;
  $('skinNom').textContent = STAGES.map(s => s.nom).join(' → ');
  $('skins').innerHTML = STAGES.map((s, i) => `<div class="evo ${showcase && showcase.userData.st === i ? 'sel' : ''}" data-st="${i}"><b>${s.ic}</b><span>${s.nom}</span><small>${L.size} ${s.size}</small></div>`).join('');
  const lo = myLoadout(), mods = S.equip.mods.map(itemById).filter(Boolean);
  $('vLoad').innerHTML = `<span style="color:${RAR[lo.jaw.r].coul}">${JAWS[lo.jaw.b].ic} ${JAWS[lo.jaw.b].nom}</span>${mods.map(m => ` · <span style="color:${RAR[m.r].coul}">${itemIc(m)} ${itemNom(m)}</span>`).join('')}`;
  $('bGo').textContent = garageFrom === 'lobby' ? L.confirm : L.letsGo;
  $('gMode').style.display = garageFrom === 'lobby' ? 'none' : ''; document.querySelectorAll('#gMode button').forEach(b => b.classList.toggle('sel', (b.dataset.m === 'r') === S.ranked)); $('gModeNote').textContent = S.ranked ? `${L.rankedNote} ${TIERS[tierOf(S.rp)].ic} ${TIERS[tierOf(S.rp)].nom} · ${S.rp} ${L.rp}` : `${L.wave} ${S.vague}`;
}
$('gMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.ranked = b.dataset.m === 'r'; save(); SFX.clic(); renderGarage(); });
$('vgrid').addEventListener('click', e => { const el = e.target.closest('.vcard'); if (!el) return; const s = SKINS.find(x => x.id === el.dataset.s); if (!s) return; if (!sUnlocked(s)) { alertMsg(s.ach ? L.achLock : L.unlockAt(s.niv)); return; } S.skin = s.id; save(); SFX.clic(); setShowcase(); renderGarage(); });
$('skins').addEventListener('click', e => { const el = e.target.closest('.evo'); if (!el) return; setShowcase(+el.dataset.st); showcase.userData.hold = 1; SFX.clic(); });
$('bGo').onclick = () => { if (garageFrom === 'lobby') { if (Net.role === 'guest') Net.send(myHello()); else broadcastLobby(); G.mode = 'menu'; hideShowcase(); showScreen('sLigne'); renderLobby(); return; } startMatch(soloRoster(), 0, null); };
$('bRetour1').onclick = () => { hideShowcase(); if (garageFrom === 'lobby') { G.mode = 'menu'; showScreen('sLigne'); return; } G.mode = 'menu'; showScreen('sTitre'); };
$('bInvG').onclick = () => openInv('garage');
$('bJouer').onclick = () => openGarage('solo');
$('bStats').onclick = () => { const xi = xpInfo(); $('tblStats').innerHTML = [[L.level, xi.n], [L.totalXp, S.xp], [L.bestWave, S.meilleureVague], [L.wins, S.victoires], [L.podiums, S.podiums], [L.matches, S.parties], [L.onlineMatches, S.enLigne], [L.dmgDealt, S.eaten], [L.kills, S.kills], [L.bestKills, S.meilleursKills], [L.bestSize, STAGES[S.maxStage].ic + ' ' + S.bestSize.toFixed(2)], [L.bestScore, S.bestScore], [L.items, S.items.length], [L.ranked + ' ' + L.wins.toLowerCase(), S.rankedWins], [L.achievements, Object.keys(S.ach).length + ' / ' + ACH.length]].map(r => `<span>${r[0]}</span><b>${r[1]}</b>`).join('');
  ensureRivals(); const board = [...S.rivals.map(r => ({ n: r.n, rp: r.rp })), { n: pseudo() + ' (' + L.you + ')', rp: S.rp, me: 1 }].sort((a, b) => b.rp - a.rp);
  $('board').innerHTML = board.map((r, i) => `<div class="${r.me ? 'moi' : ''}"><b>${i + 1}</b><span>${esc(r.n)}</span>${tierHTML(r.rp)}<small>${r.rp}</small></div>`).join('');
  $('statTier').innerHTML = `${tierHTML(S.rp)} · ${S.rp} ${L.rp}`; showScreen('sStats'); };
$('bRetour2').onclick = () => showScreen('sTitre');
function renderParam() {
  $('iPseudo').value = S.pseudo; $('bSon').textContent = S.son ? L.soundOn : L.soundOff;
  document.querySelectorAll('#gfx button').forEach(b => b.classList.toggle('sel', b.dataset.q === S.gfx));
  $('tSave').value = ''; $('saveMsg').textContent = ''; $('bReset').textContent = L.resetAll; resetArm = false;
}
let resetArm = false;
$('bParam').onclick = () => { renderParam(); setPTab('gen'); showScreen('sParam'); };
$('iPseudo').addEventListener('input', () => { S.pseudo = $('iPseudo').value.replace(/[<>]/g, '').slice(0, 12); save(); });
$('bSon').onclick = () => { S.son = !S.son; save(); SFX.setOn(S.son); renderParam(); };
$('gfx').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.gfx = b.dataset.q; save(); applyGfx(); renderParam(); });
$('bExport').onclick = () => { const c = exportCode(); $('tSave').value = c; $('tSave').select(); try { navigator.clipboard.writeText(c).then(() => $('saveMsg').textContent = L.copied, () => $('saveMsg').textContent = L.copyManual); } catch (e) { $('saveMsg').textContent = L.copyManual; } };
$('bImport').onclick = () => { try { const d = parseCode($('tSave').value); S = d; save(); applyGfx(); applyDisp(); renderParam(); renderTitle(); $('saveMsg').textContent = L.imported(xpInfo().n, S.items.length); SFX.levelUp(); } catch (e) { $('saveMsg').textContent = '⚠️ ' + e.message; } };
$('bReset').onclick = () => { if (!resetArm) { resetArm = true; $('bReset').textContent = L.resetConfirm; return; } const g = S.gfx; S = DEF(); S.gfx = g; save(); renderParam(); renderTitle(); alertMsg(L.resetDone); };
$('bRetour3').onclick = () => { renderTitle(); showScreen('sTitre'); };
function pauseGame() { G.paused = true; $('bSonP').textContent = S.son ? L.soundOn : L.soundOff; $('pauseNote').style.display = G.net ? '' : 'none'; showScreen('sPause'); }
$('pauseB').onclick = pauseGame;
$('bReprendre').onclick = () => { G.paused = false; showScreen(null); };
$('bSonP').onclick = () => { S.son = !S.son; save(); SFX.setOn(S.son); $('bSonP').textContent = S.son ? L.soundOn : L.soundOff; };
$('bQuitter').onclick = () => { G.paused = false; if (G.net) Net.close(); toMenu(); };
$('bSuivant').onclick = () => { $('lvlUp').classList.remove('on'); if (G.net) { const role = Net.role; clearFish(); $('hud').classList.remove('on'); G.mode = 'menu'; G.net = null; if (!Net.role) { toMenu(); return; } showScreen('sLigne'); lnUI('salle'); renderLobby(); if (role === 'host') broadcastLobby(); return; } startMatch(soloRoster(), 0, null); };
$('bGarage2').onclick = () => { $('lvlUp').classList.remove('on'); if (G.net) { $('bSuivant').onclick(); return; } clearFish(); $('hud').classList.remove('on'); openGarage('solo'); };
$('bMenu').onclick = () => { $('lvlUp').classList.remove('on'); if (G.net) Net.close(); toMenu(); };
$('bLuOk').onclick = () => $('lvlUp').classList.remove('on');
/* ---- Achievements ---- */
function renderAch() {
  $('achList').innerHTML = ACH.map(a => { const v = Math.min(a.val(), a.goal), ok = !!S.ach[a.id], rw = a.rw;
    const eq = rw.t === 'skin' ? S.skin === rw.id : S.style[rw.t] === rw.id;
    return `<div class="ach ${ok ? 'ok' : ''}"><span class="ic">${a.ic}</span><div class="ab"><b>${L.ach[a.id][0]}</b><small>${L.ach[a.id][1]}</small>
      <div class="hbar t"><i style="width:${v / a.goal * 100}%"></i></div><small>${v} / ${a.goal}</small></div>
      <div class="rw"><small>${L.exclusive} · ${rwType(rw)}</small><b>${rwName(rw)}</b>${a.av ? `<small>+ 👤 ${L.avNames[a.av]}</small>` : ''}${ok ? `<button class="mini" data-a="${a.id}">${eq ? '✔ ' + L.equipped : L.equip}</button>` : `<small>🔒 ${L.locked}</small>`}</div></div>`; }).join('');
  $('achCount').textContent = `${Object.keys(S.ach).length} / ${ACH.length} ${L.unlocked.toLowerCase()}`;
}
$('achList').addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b) return; const a = ACH.find(x => x.id === b.dataset.a); if (!a || !S.ach[a.id]) return; const rw = a.rw;
  if (rw.t === 'skin') S.skin = S.skin === rw.id ? 'classic' : rw.id; else S.style[rw.t] = S.style[rw.t] === rw.id ? '' : rw.id;
  if (rw.t === 'horn' && S.style.horn) SFX.horn(S.style.horn); save(); SFX.clic(); renderAch(); });
$('bAch').onclick = () => { checkAch(); renderAch(); showScreen('sAch'); };
$('bRetour5').onclick = () => { renderTitle(); showScreen('sTitre'); };
/* ---- Inventory ---- */
let invSel = null, invSlot = 'arme', invFrom = 'menu';
function openInv(from) { invFrom = from; invSel = null; renderInv(); showScreen('sInv'); }
function renderInv() {
  const slot = (key, u, label) => { const it = u ? itemById(u) : null; return `<div class="slot ${invSlot === key ? 'sel' : ''} ${it ? 'r' + it.r : ''}" data-slot="${key}"><small>${label}</small>${it ? `<span class="ic">${itemIc(it)}</span><b>${esc(itemNom(it))}</b><small style="color:${RAR[it.r].coul}">${RAR[it.r].nom}</small>` : `<span class="ic" style="opacity:.4">＋</span><small>${L.empty}</small>`}</div>`; };
  $('invSlots').innerHTML = slot('arme', S.equip.arme, L.slotWeapon) + slot('m0', S.equip.mods[0], L.slotMod + ' 1') + slot('m1', S.equip.mods[1], L.slotMod + ' 2');
  const lo = myLoadout(); $('invSum').innerHTML = `${L.gunDps} <b>×${lo.jaw.dmg.toFixed(2)}</b> · ${L.hpBonus} <b>+${lo.hp}%</b> · ${L.shBonus} <b>+${lo.sh}</b> · ${L.speedBonus} <b>+${lo.vit}%</b> · Growth <b>+${lo.belly + lo.jaw.grow}%</b>` + vitalsBreak(0);
  const items = [...S.items].sort((a, b) => b.r - a.r || (a.t > b.t ? 1 : -1)); const want = invSlot === 'arme' ? 'arme' : 'mod';
  $('invList').innerHTML = items.map(it => { const eq = it.u === S.equip.arme || S.equip.mods.includes(it.u); return itemHTML(it).replace('class="item', `class="item ${invSel === it.u ? 'sel' : ''} ${it.t !== want ? 'dim' : ''} ${eq ? 'eq' : ''}`); }).join('') || `<p class="sub">${L.noItems}</p>`;
  const it = invSel && itemById(invSel); const eq = it && (it.u === S.equip.arme || S.equip.mods.includes(it.u));
  $('bEquip').disabled = !it || eq; $('bRecycle').disabled = !it || eq; $('bRecycle').textContent = L.recycle; $('invCount').textContent = `${S.items.length} ${L.itemsWord}`;
}
$('invSlots').addEventListener('click', e => { const el = e.target.closest('.slot'); if (!el) return; invSlot = el.dataset.slot; invSel = null; SFX.clic(); renderInv(); });
$('invList').addEventListener('click', e => { const el = e.target.closest('.item'); if (!el) return; invSel = +el.dataset.u; const it = itemById(invSel); if (it && it.t === 'arme') invSlot = 'arme'; else if (it && invSlot === 'arme') invSlot = !S.equip.mods[0] ? 'm0' : !S.equip.mods[1] ? 'm1' : 'm0'; SFX.clic(); renderInv(); });
$('bEquip').onclick = () => { const it = invSel && itemById(invSel); if (!it) return; if (it.t === 'arme') S.equip.arme = it.u; else { const i = invSlot === 'm1' ? 1 : 0; S.equip.mods[i] = it.u; if (S.equip.mods[1 - i] === it.u) S.equip.mods[1 - i] = 0; } save(); SFX.pick(); invSel = null; renderInv(); };
let recArm = 0;
$('bRecycle').onclick = () => { const it = invSel && itemById(invSel); if (!it) return; if (recArm !== it.u) { recArm = it.u; $('bRecycle').textContent = L.recycleConfirm; return; } S.items = S.items.filter(x => x.u !== it.u); recArm = 0; invSel = null; save(); renderInv(); };
$('bRetour4').onclick = () => { if (invFrom === 'garage') { renderGarage(); showScreen('sGarage'); } else showScreen('sTitre'); };
$('bInv').onclick = () => openInv('menu');
/* ---- Online lobby ---- */
function lnUI(st) { $('lnChoix').style.display = st === 'choix' ? '' : 'none'; $('lnSalle').style.display = st === 'salle' ? '' : 'none'; renderLobby(); }
function renderLobby() {
  const host = Net.role === 'host'; const l = host ? lobbyList() : Net.lobby; const nb = Math.max(l.length, Math.min(MAX_JOUEURS, Net.slots));
  let h = l.map(p => `<div class="pl ${p.hote ? 'hote' : ''}"><img class="pav" src="${avPortrait(p.av)}" alt=""><b>${p.hote ? '👑 ' : ''}${p.cl ? `<i class="cl">[${esc(p.cl)}]</i> ` : ''}${esc(p.nom)}${p.ti && L.titles[p.ti] ? `<small class="ti">« ${L.titles[p.ti]} »</small>` : ''}</b><small>${tierHTML(p.rp || 0)} · ${L.skins[p.sk] || ''} · ${L.lv} ${p.niv || 1}</small></div>`).join('');
  for (let i = l.length; i < nb; i++) h += `<div class="pl bot"><span>🤖</span><b>${L.bot}</b><small>${L.botFill}</small></div>`;
  $('lnList').innerHTML = h; $('lnNb').textContent = `${l.length} ${l.length > 1 ? L.humans : L.human} · ${nb} ${L.vehicles}`;
  $('lnHost').style.display = host ? '' : 'none'; $('lnGuest').style.display = host || !Net.role ? 'none' : '';
  document.querySelectorAll('#lnSlots button').forEach(b => b.classList.toggle('sel', +b.dataset.n === Net.slots));
  document.querySelectorAll('#lnMode button').forEach(b => b.classList.toggle('sel', (b.dataset.m === 'r') === !!Net.ranked));
  $('lnModeTxt').innerHTML = `${L.modeLabel}: <b>${Net.ranked ? L.ranked : L.casual}</b>`;
}
$('bEnLigne').onclick = () => { showScreen('sLigne'); if (!Net.role) { lnUI('choix'); lnMsg(L.onlineIntro); } else lnUI('salle'); };
$('bCreer').onclick = () => hostCreate();
$('bRejoindre').onclick = () => guestJoin($('iCode').value);
$('iCode').addEventListener('keydown', e => { if (e.key === 'Enter') guestJoin($('iCode').value); });
$('lnSlots').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; Net.slots = +b.dataset.n; broadcastLobby(); });
$('lnMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || Net.role !== 'host') return; Net.ranked = b.dataset.m === 'r'; broadcastLobby(); });
$('bLancer').onclick = () => { if (!Net.peer) return; hostStart(); };
$('bLnVeh').onclick = () => openGarage('lobby');
$('bLnQuit').onclick = () => { Net.close(); lnUI('choix'); lnMsg(L.onlineIntro); };
$('bLnRetour').onclick = () => { if (Net.role) Net.close(); showScreen('sTitre'); renderTitle(); };
