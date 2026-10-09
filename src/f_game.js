
/* ================== Game state ================== */
const G = { mode: 'menu', net: null, fish: [], me: null, t: 0, mt: 0, ev: [], snapT: 0, endT: 0, ended: false, nTotal: 0, pop: 1, seed: 1, fogD: .012 };
const AUTH = () => G.net !== 'client';
function emit(e) { if (G.net === 'host') G.ev.push(e); }
const fwdv = new THREE.Vector3(), dF = new THREE.Object3D(); dF.rotation.order = 'YXZ';
function fwd3(o, out) { const cp = Math.cos(o.pitch); return out.set(Math.sin(o.yaw) * cp, Math.sin(o.pitch), Math.cos(o.yaw) * cp); }
function mouthOf(o) { fwd3(o, fwdv); if (!o.mouth) o.mouth = new THREE.Vector3(); return o.mouth.copy(o.pos).addScaledVector(fwdv, o.size * .95); }
const BAND = [[-3, -24], [-6, -46], [-14, -78], [-24, -200]];
function pickSpot(v, zone, R, size = 1) {
  const z = ZX[clamp(zone, 0, 3)], x = lerp(z[0], z[1], R()), zz = lerp(-W + 12, W - 12, R()), fl = seabed(x, zz), b = BAND[clamp(zone, 0, 3)];
  const lo = Math.max(fl + 2 + size, b[1]), hi = Math.min(b[0], -2 - size); return v.set(x, hi > lo ? lerp(lo, hi, R()) : fl + 2 + size, zz);
}

/* ---- AI fish population (schools, predators) ---- */
const npcs = [], schools = [], npcMeshes = {};
function buildPopulation(seed, mul) {
  for (const k in npcMeshes) { scene.remove(npcMeshes[k]); npcMeshes[k].material.dispose(); delete npcMeshes[k]; }
  npcs.length = 0; schools.length = 0; const R = mulberry(seed);
  const add = (sp, zone, n, gold) => { const S0 = SPC[sp]; const sc = { sp, zone, c: new THREE.Vector3(), tgt: new THREE.Vector3(), gold: !!gold }; pickSpot(sc.c, zone, R, S0.base); sc.tgt.copy(sc.c); schools.push(sc);
    for (let i = 0; i < n; i++) { const f = { i: npcs.length, sp, S: S0, school: sc, size: S0.base * (.85 + R() * .3), pos: sc.c.clone().add(new THREE.Vector3((R() - .5) * 8, (R() - .5) * 4, (R() - .5) * 8)), vel: new THREE.Vector3(), mouth: new THREE.Vector3(),
      off: new THREE.Vector3(R() - .5, (R() - .5) * .5, R() - .5).multiplyScalar(4 + S0.base * 3), yaw: R() * 6, pitch: 0, alive: !gold, respT: 0, stunT: 0, biteCd: 0, hunt: null, huntT: 0, restT: R() * 4, slot: 0 }; npcs.push(f); } };
  for (const [sp, ns] of POP) { const S0 = SPC[sp]; const nsch = Math.max(1, Math.round(ns * Math.min(1.35, mul))); for (let k = 0; k < nsch; k++) { const zone = S0.zones[(R() * S0.zones.length) | 0]; const n = S0.school[0] + Math.floor(R() * (S0.school[1] - S0.school[0] + 1)); add(sp, zone, Math.max(1, Math.round(n * (n > 3 ? clamp(mul, .6, 1.25) : 1))), 0); } }
  for (let k = 0; k < 4; k++) add('gold', k % 3, 7, 1);
  for (const sp of SPK) { const list = npcs.filter(f => f.sp === sp); if (!list.length) continue; const S0 = SPC[sp];
    const pal = { col: S0.col, bel: S0.bel, fin: S0.fin, st: S0.stripes ? 1 : 0, stc: 0xffffff, glowAll: S0.gold ? .5 : 0, glowC: S0.glow };
    const im = new THREE.InstancedMesh(fishGeo(S0.shape, pal), fishMaterial(shapeMode(S0.shape)), list.length); im.castShadow = S0.base > 2; im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    list.forEach((f, j) => f.slot = j); im.userData.list = list; npcMeshes[sp] = im; scene.add(im); }
}
function respawnNPC(f) {
  for (let k = 0; k < 6; k++) { const sc = f.school; if (!f.S.pred && k < 3) { f.pos.copy(sc.c).add(f.off); } else pickSpot(f.pos, sc.zone, Math.random, f.size);
    if (G.fish.every(a => !a.alive || a.pos.distanceTo(f.pos) > 40)) break; pickSpot(sc.c, sc.zone, Math.random, f.S.base); }
  f.alive = true; f.vel.set(0, 0, 0); f.stunT = 0; f.hunt = null; f.restT = rand(1, 4);
}
function predThink(f, dt, des) {
  if (f.biteCd > 0) f.biteCd -= dt;
  if (f.restT > 0 || G.mode !== 'play') { f.restT -= dt; des.copy(f.school.c).sub(f.pos).setLength(f.S.sp * .6); return 1; }
  if (!f.hunt || f.huntT <= 0 || !f.hunt.alive || f.hunt.size * 1.1 > f.size || f.hunt.spawnT > 0) {
    if (f.hunt && f.huntT <= 0) { f.hunt = null; f.restT = 5; return 1; }
    f.hunt = null; let best = 1e9; for (const a of G.fish) { if (!a.alive || a.size * 1.1 > f.size || a.spawnT > 0) continue; const d = a.pos.distanceTo(f.pos); if (d < 30 + f.size * 1.5 && d < best) { best = d; f.hunt = a; } } f.huntT = 7;
    if (!f.hunt) { f.restT = 1.5; des.copy(f.school.c).sub(f.pos).setLength(f.S.sp * .6); return 1; } }
  f.huntT -= dt; des.subVectors(f.hunt.pos, f.pos).setLength(f.S.sp * 1.2 * (G.predK || 1)); return 1.25;
}
const tq = new THREE.Vector3();
function updNPCs(dt) {
  const t = G.t, auth = AUTH();
  if (!auth) { const now = performance.now(); for (const f of npcs) { if (!f.alive || !f.net) continue; const n = f.net, lag = Math.min(.25, (now - n.t) / 1000), k = 1 - Math.exp(-10 * dt);
      f.pos.x += (n.x + n.vx * lag - f.pos.x) * k; f.pos.y += (n.y + n.vy * lag - f.pos.y) * k; f.pos.z += (n.z + n.vz * lag - f.pos.z) * k; f.vel.set(n.vx, n.vy, n.vz); orientNPC(f, dt); } return; }
  for (const sc of schools) { if (sc.gold && !G.alert) continue; const S0 = SPC[sc.sp]; tq.subVectors(sc.tgt, sc.c); const d = tq.length(); if (d < 4) pickSpot(sc.tgt, sc.zone, Math.random, S0.base); else sc.c.addScaledVector(tq, Math.min(1, S0.sp * .5 * dt / d)); }
  for (const f of npcs) {
    if (!f.alive) { f.respT -= dt; if (f.respT <= 0 && (!f.school.gold || G.alert)) respawnNPC(f); continue; }
    const S0 = f.S; let spd = S0.sp, sm = 1; const des = tv2; f.pulled = 0;
    if (f.stunT > 0) { f.stunT -= dt; f.vel.multiplyScalar(Math.exp(-3 * dt)); }
    else {
      if (S0.pred) sm = predThink(f, dt, des);
      else { des.copy(f.school.c).add(f.off).sub(f.pos); const dl = des.length(); if (dl > .001) des.multiplyScalar(Math.min(1, dl / 6) * spd / dl);
        des.x += Math.sin(t * 1.3 + f.i) * spd * .25; des.y += Math.sin(t * .9 + f.i * 2) * spd * .08; des.z += Math.cos(t * 1.1 + f.i) * spd * .25;
        for (const a of G.fish) { if (!a.alive || a.size < f.size * 1.1) continue; const dx = f.pos.x - a.pos.x, dy = f.pos.y - a.pos.y, dz = f.pos.z - a.pos.z, Rr = 5 + a.size * 2.2 + f.size; const d2 = dx * dx + dy * dy + dz * dz; if (d2 > Rr * Rr) continue;
          const d = Math.sqrt(d2) || 1, k = (1 - d / Rr) * spd * 2.2; des.x += dx / d * k; des.y += dy / d * k * .5; des.z += dz / d * k; sm = 1.5; } }
      for (const a of G.fish) { if (!a.alive || !(a.magT > 0 || a.vacT > 0) || f.size * 1.1 > a.size) continue; mouthOf(a); tq.subVectors(a.mouth, f.pos); const d = tq.length(); const Rr = a.vacT > 0 ? 14 + a.size * 3 : (10 + a.size * 2) * (1 + a.lo.lure / 100); if (d > Rr) continue;
        if (a.vacT > 0 && !(a.magT > 0)) { fwd3(a, fwdv); if (-tq.dot(fwdv) / d > -.45) continue; } des.copy(tq).multiplyScalar(26 / (d + .5)); f.pulled = 1; sm = 2.2; }
      const max = spd * 1.6 * sm; if (des.lengthSq() > max * max) des.setLength(max);
      f.vel.lerp(des, 1 - Math.exp(-(f.pulled ? 6 : 2.4) * dt));
    }
    f.pos.addScaledVector(f.vel, dt);
    const fl = seabed(f.pos.x, f.pos.z) + f.size * .6 + .3; if (f.pos.y < fl) { f.pos.y = fl; f.vel.y = Math.abs(f.vel.y) * .5; }
    const top = -f.size * .5 - .4; if (f.pos.y > top) { f.pos.y = top; f.vel.y = -Math.abs(f.vel.y) * .5; }
    if (Math.abs(f.pos.x) > W) { f.pos.x = Math.sign(f.pos.x) * W; f.vel.x *= -1; } if (Math.abs(f.pos.z) > W) { f.pos.z = Math.sign(f.pos.z) * W; f.vel.z *= -1; }
    if (f.size > 1.5) for (const r of rocks) { const dx = f.pos.x - r.x, dy = f.pos.y - r.y, dz = f.pos.z - r.z, Rr = r.r + f.size * .4; const d2 = dx * dx + dy * dy + dz * dz; if (d2 < Rr * Rr) { const d = Math.sqrt(d2) || 1; f.pos.set(r.x + dx / d * Rr, r.y + dy / d * Rr, r.z + dz / d * Rr); } }
    orientNPC(f, dt);
  }
}
function orientNPC(f, dt) { const v2 = f.vel.x * f.vel.x + f.vel.z * f.vel.z; if (v2 > .05) f.yaw += angDiff(f.yaw, Math.atan2(f.vel.x, f.vel.z)) * Math.min(1, dt * 6); f.pitch += (clamp(Math.atan2(f.vel.y, Math.sqrt(v2) + .01), -.9, .9) * .8 - f.pitch) * Math.min(1, dt * 4); }
function drawNPCs() {
  const c = camera.position;
  for (const sp in npcMeshes) { const im = npcMeshes[sp];
    for (const f of im.userData.list) { if (!f.alive || Math.abs(f.pos.x - c.x) > 170 || Math.abs(f.pos.z - c.z) > 170) dF.scale.setScalar(0); else dF.scale.setScalar(f.size);
      dF.position.copy(f.pos); dF.rotation.set(-f.pitch, f.yaw, 0); dF.updateMatrix(); im.setMatrixAt(f.slot, dF.matrix); }
    im.instanceMatrix.needsUpdate = true; }
}

/* ---- Player / bot fish ---- */
const BUB_GEO = new THREE.SphereGeometry(1.5, 20, 14);
class Fish {
  constructor(r) {
    this.id = r.id; this.nom = r.nom; this.bot = !!r.bot; this.peer = r.peer || null; this.local = !!r.local; this.lo = r.lo || botLoadout(0);
    this.skin = SKINS.some(s => s.id === r.sk) ? r.sk : 'classic'; this.av = sanAv(r.av); this.clan = sanClan(r.cl || ''); this.team = -1; this.trail = TRAILS[r.tr] || TRAILS['']; this.titre = r.ti || ''; this.horn = L.horns[r.hn] ? r.hn : '';
    this.hpMul = r.hpMul || 1; this.dmgMul = r.dmgMul || 1;
    this.g = new THREE.Group(); this.g.rotation.order = 'YXZ'; scene.add(this.g); this.mesh = null; this.stage = -1;
    this.bub = new THREE.Mesh(BUB_GEO, new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: .2, depthWrite: false, toneMapped: false })); this.bub.visible = false; this.g.add(this.bub);
    this.pos = new THREE.Vector3(); this.yaw = 0; this.pitch = 0; this.roll = 0; this.speed = 0; this.kv = new THREE.Vector3(); this.mouth = new THREE.Vector3();
    this.mass = 1; this.size = 1; this.maxSize = 1; this.alive = true; this.respawnT = 0; this.kills = 0; this.deaths = 0; this.score = 0; this.eaten = 0; this.turbo = 100; this.specCd = 2; this.specMax = 6; this.growK = 1;
    for (const k of TIMERS) this[k] = 0;
    this.ctrl = { steer: 0, pitch: 0, boost: false, slow: false, bite: false, specN: 0 }; this.seen = { spec: 0 };
    this.ai = { t: 0, k: r.k || .5, prey: null, flee: null, fd: 1e9, pk: null, wan: new THREE.Vector3(), wanT: 0 };
    this.hitCd = {}; this.hp = 1; this.maxHp = 1; this.sh = 0; this.shMax = 0; this.shT = 0; this.minHp = 1;
    this.setMass(r.mass || 1, true);
  }
  setMass(m, init) {
    this.mass = Math.max(1, m); this.size = Math.cbrt(this.mass); this.maxSize = Math.max(this.maxSize || 1, this.size);
    const st = stageOf(this.size);
    if (st !== this.stage) { const up = st > this.stage && !init && this.stage >= 0; const hpK = this.maxHp > 1 ? this.hp / this.maxHp : 1; this.stage = st; this.buildMesh();
      const S0 = STAGES[st]; this.maxHp = Math.round(S0.hp * (1 + this.lo.hp / 100) * this.hpMul); this.shMax = Math.round((15 + st * 8 + (this.lo.sh || 0)) * this.hpMul); this.specMax = S0.cd * (1 - this.lo.cd / 100);
      if (init) { this.hp = this.maxHp; this.sh = this.shMax; } else { this.hp = up ? this.maxHp : Math.max(1, hpK * this.maxHp); this.sh = up ? Math.max(this.sh, this.shMax) : Math.min(this.sh, this.shMax); }
      if (up) onEvolve(this); }
  }
  buildMesh() { if (this.mesh) { this.g.remove(this.mesh); this.mesh.material.dispose(); } this.mesh = buildFishMesh(this.stage, this.skin); this.g.add(this.mesh); this.growK = .7; }
  physics(dt) {
    const S0 = STAGES[this.stage], c = this.ctrl;
    this.boostOn = c.boost && this.turbo > 1 && this.alive;
    if (this.boostOn) this.turbo = Math.max(0, this.turbo - 30 * dt); else this.turbo = Math.min(100, this.turbo + 11 * (1 + this.lo.gills / 100) * dt);
    const turn = S0.turn * (this.boostOn ? .85 : 1) * (this.stunT > 0 ? .35 : 1);
    this.yaw -= c.steer * turn * dt;
    this.pitch += (clamp(c.pitch, -1, 1) - this.pitch) * Math.min(1, dt * 3.2);
    const tgt = S0.speed * (1 + this.lo.vit / 100) * (this.boostOn ? 1.75 : 1) * (this.spdT > 0 ? 1.3 : 1) * (this.dartT > 0 ? 2.3 : 1) * (this.lungeT > 0 ? 2.8 : 1) * (this.sonarT > 0 ? 1.15 : 1) * (c.slow ? .4 : 1) * (this.stunT > 0 ? .35 : 1) * (this.biteT > 0 ? 1.25 : 1);
    this.speed += (tgt - this.speed) * Math.min(1, dt * (tgt > this.speed ? 2.4 : 3));
    this.roll += (c.steer * .45 - this.roll) * Math.min(1, dt * 4);
    fwd3(this, fwdv); this.pos.addScaledVector(fwdv, this.speed * dt).addScaledVector(this.kv, dt); this.kv.multiplyScalar(Math.exp(-3 * dt));
    const sz = this.size, top = -sz * .45 - .3, fl = seabed(this.pos.x, this.pos.z) + sz * .55 + .2;
    if (this.pos.y > top) { this.pos.y = top; if (this.pitch > 0) this.pitch *= .9; }
    if (this.pos.y < fl) { this.pos.y = fl; if (this.pitch < 0) this.pitch *= .9; }
    const lim = W - 1; if (Math.abs(this.pos.x) > lim || Math.abs(this.pos.z) > lim) { this.pos.x = clamp(this.pos.x, -lim, lim); this.pos.z = clamp(this.pos.z, -lim, lim); this.yaw += angDiff(this.yaw, Math.atan2(-this.pos.x, -this.pos.z)) * Math.min(1, dt * 2.5); }
    for (const r of rocks) { const dx = this.pos.x - r.x, dy = this.pos.y - r.y, dz = this.pos.z - r.z, Rr = r.r + sz * .5; const d2 = dx * dx + dy * dy + dz * dz; if (d2 < Rr * Rr) { const d = Math.sqrt(d2) || 1; this.pos.set(r.x + dx / d * Rr, r.y + dy / d * Rr, r.z + dz / d * Rr); this.speed *= .92; } }
  }
  syncMesh(dt) {
    const g = this.g; g.visible = this.alive; if (!this.alive) return;
    g.position.copy(this.pos); g.rotation.set(-this.pitch, this.yaw, this.roll);
    this.growK += (1 - this.growK) * Math.min(1, dt * 3); g.scale.setScalar(this.size * this.growK);
    const pulse = this.biteT > 0 ? 1 + Math.sin(clamp((.35 - this.biteT) / .35, 0, 1) * Math.PI) * .16 : 1; this.mesh.scale.set(1, 1, pulse);
    const u = this.mesh.material.userData.u; if (u) { u.uF.value = 5 + this.speed * .45; u.uA.value = shapeMode(STAGES[this.stage].shape) === 2 ? .35 : .14 + (this.boostOn ? .05 : 0); }
    const shOn = this.sh > this.shMax + .5 || this.spawnT > 0 || this.dartT > 0; this.bub.visible = shOn; if (shOn) { this.bub.material.opacity = .14 + .08 * Math.sin(G.t * 6); this.bub.material.color.set(this.dartT > 0 ? 0xffffff : this.spawnT > 0 ? 0x7ef29d : 0x9fe8ff); }
    if ((this.boostOn || this.dartT > 0 || this.lungeT > 0) && Math.random() < dt * 30 * (G.pm || 1)) { fwd3(this, fwdv); const s = this.size; spawnP(this.pos.x - fwdv.x * s * 1.2 + rand(-.3, .3) * s, this.pos.y - fwdv.y * s * 1.2 + rand(-.3, .3) * s, this.pos.z - fwdv.z * s * 1.2, rand(-1, 1), rand(0, 1), rand(-1, 1), rand(.6, 1.3), rand(.08, .2) * (.7 + s * .3), pick(this.trail), 4); }
    if (this.frzT > 0 && Math.random() < dt * 8) spawnP(this.pos.x + rand(-1, 1) * this.size, this.pos.y + rand(-.5, .5) * this.size, this.pos.z + rand(-1, 1) * this.size, 0, 1, 0, .6, .12 * this.size, pick([0xff8a1f, 0xffd23f]), 1);
  }
}
const TIMERS = ['spdT', 'magT', 'frzT', 'dartT', 'frenzyT', 'lungeT', 'sonarT', 'vacT', 'biteT', 'biteCd', 'stunT', 'spawnT'];
function tickTimers(c, dt) { for (const k of TIMERS) if (c[k] > 0) c[k] -= dt; if (c.specCd > 0) c.specCd -= dt; }
function onEvolve(c) {
  fxRing(c.pos.x, c.pos.y, c.pos.z, c.size * 3, 0x22e5ff, .8); fxBubbles(c.pos.x, c.pos.y, c.pos.z, 30, 1.5, c.size);
  if (c === G.me) { centreMsg(STAGES[c.stage].ic + ' ' + L.evolved(STAGES[c.stage].nom), STAGES[c.stage].specNom + ' — ' + STAGES[c.stage].specDesc, 2.2); SFX.evolve(); emoteMe(c.stage >= 4 ? 'mindblown' : 'starstruck', 'force'); camInit = false; if (c.stage > S.maxStage) { S.maxStage = c.stage; save(); } }
  else if (G.me && c.pos.distanceTo(G.me.pos) < 60) SFX.at(c.pos.x, c.pos.y, c.pos.z, () => SFX.evolve());
}

/* ---- combat: eating, bites, hazards (authority: solo/host) ---- */
function reachOf(a) { return 1 + a.lo.jaw.reach / 100 + a.lo.lure / 200 + (a.biteT > 0 ? .75 : 0) + (a.lungeT > 0 ? 1 : 0) + (a.frenzyT > 0 ? .4 : 0); }
function nearMe(x, y, z) { const m = G.me; return m ? Math.hypot(m.pos.x - x, m.pos.y - y, m.pos.z - z) : 999; }
function eatNPC(a, f) {
  f.alive = false; f.respT = rand(7, 14);
  const g = Math.pow(f.size, 3) * .32 * (1 + a.lo.belly / 100 + a.lo.jaw.grow / 100), mult = (a.frzT > 0 ? 2 : 1) * (f.S.gold ? 3 : 1) * (G.alert ? 1.5 : 1);
  a.eaten++; a.score += Math.round((g * 120 + 5) * mult); a.setMass(a.mass + g); a.lastEat = G.t;
  emit({ e: 'eat', c: a.id, i: f.i }); eatFx(a, f);
}
function eatFx(a, f) { fxEat(f.pos.x, f.pos.y, f.pos.z, f.size, f.S.col, f.S.gold); const d = nearMe(f.pos.x, f.pos.y, f.pos.z); if (d < 50) SFX.at(f.pos.x, f.pos.y, f.pos.z, () => SFX.chomp(a === G.me ? 1 : clamp(1 - d / 50, .1, .7), f.size > 2 ? 1 : 0)); if (a === G.me && f.S.gold) fxRing(f.pos.x, f.pos.y, f.pos.z, 2, 0xffd84d, .4); }
function damage(c, dmg, atk, why) {
  if (!c.alive || dmg <= 0 || c.spawnT > 0 || c.dartT > 0) return; c.shT = 3.5; c.hitT = G.t; if (atk) c.lastAtk = atk;
  if (c.sh > 0) { const a = Math.min(c.sh, dmg); c.sh -= a; dmg -= a; if (c === G.me) flashShield(); }
  if (dmg <= 0) return; c.hp -= dmg; c.minHp = Math.min(c.minHp, c.hp / c.maxHp); if (c === G.me) flashDmg();
  if (c.hp <= 0) killFish(c, atk, why);
}
function killFish(v, k, why) {
  v.alive = false; v.hp = 0; v.deaths++; v.respawnT = 3; v.deadT = G.t;
  fxEat(v.pos.x, v.pos.y, v.pos.z, v.size * 1.4, STAGES[v.stage].col, 0); fxRing(v.pos.x, v.pos.y, v.pos.z, v.size * 2, 0xff5050, .5);
  if (k) { k.kills++; const g = v.mass * .45; k.score += Math.round((300 + g * 120) * (k.frzT > 0 ? 2 : 1)); k.setMass(k.mass + g); }
  emit({ e: 'kill', v: v.id, k: k ? k.id : -1, w: why || '' }); feedKill(v, k, why);
  const d = nearMe(v.pos.x, v.pos.y, v.pos.z); if (d < 70) { SFX.at(v.pos.x, v.pos.y, v.pos.z, () => SFX.gulp(clamp(1.2 - d / 70, .2, 1))); if (v !== G.me) soundInd(v.pos.x, v.pos.z, 1.2); }
}
function combat(dt) {
  for (const a of G.fish) { if (!a.alive) continue; mouthOf(a); const reach = a.size * .6 * reachOf(a), ratio = a.frenzyT > 0 ? 1.0 : 1.1;
    for (const f of npcs) { if (!f.alive || f.size * ratio >= a.size) continue; const R = reach + f.size * .5; const dx = f.pos.x - a.mouth.x; if (dx > R || dx < -R) continue; const dz = f.pos.z - a.mouth.z; if (dz > R || dz < -R) continue; const dy = f.pos.y - a.mouth.y; if (dx * dx + dy * dy + dz * dz < R * R) eatNPC(a, f); }
    for (const b of G.fish) { if (b === a || !b.alive || b.spawnT > 0 || b.dartT > 0 || !(a.size > b.size * (a.frenzyT > 0 ? 1.0 : 1.1))) continue;
      const R = reach + b.size * .5; if (a.mouth.distanceToSquared(b.pos) > R * R || (a.hitCd[b.id] || 0) > G.t) continue; a.hitCd[b.id] = G.t + .6;
      const k = a.size / b.size; let dmg = 20 * k * a.lo.jaw.dmg * a.dmgMul * (a.biteT > 0 ? 1.4 : 1); if (k >= 1.6) dmg *= 4;
      damage(b, dmg, a); biteFx(b); emit({ e: 'bite', c: b.id }); }
    for (const b of G.fish) { if (b === a || !b.alive || b.id < a.id) continue; const R = (a.size + b.size) * .42; const d2 = a.pos.distanceToSquared(b.pos); if (d2 < R * R && d2 > 1e-4) { const d = Math.sqrt(d2); tq.subVectors(b.pos, a.pos).multiplyScalar((R - d) / d * .5); b.pos.add(tq); a.pos.sub(tq); } }
  }
  for (const f of npcs) { if (!f.alive || !f.S.pred || f.biteCd > 0 || f.stunT > 0) continue; mouthOf(f);
    for (const a of G.fish) { if (!a.alive || a.spawnT > 0 || a.dartT > 0 || f.size <= a.size * 1.1) continue; const R = f.size * .6 + a.size * .5; if (f.mouth.distanceToSquared(a.pos) > R * R) continue;
      let dmg = 16 * clamp(f.size / a.size, 1, 4) * (G.predK || 1); if (f.size > a.size * 2.4) dmg *= 4; f.biteCd = 1.1; damage(a, dmg, null, f.S.nom); biteFx(a); emit({ e: 'bite', c: a.id }); break; } }
  for (const j of jellies) for (const a of G.fish) { if (!a.alive || a.size >= 4.6 || a.spawnT > 0) continue; const R = j.s * 1.1 + a.size * .5; if (a.pos.distanceToSquared(j.pos) < R * R && (j.hit[a.id] || 0) < G.t) { j.hit[a.id] = G.t + 1.2; damage(a, 12, null, L.npc.jelly || 'Jellyfish'); a.stunT = .6; biteFx(a, 0xff5ad8); emit({ e: 'bite', c: a.id, j: 1 }); } }
  for (const p of pickups) { if (!p.on) continue; for (const a of G.fish) { if (!a.alive) continue; const R = 1.8 + a.size * .7; const dx = a.pos.x - p.x, dy = a.pos.y - p.y, dz = a.pos.z - p.z; if (dx * dx + dy * dy + dz * dz < R * R) { takePick(a, p); break; } } }
}
function biteFx(b, col = 0xff4040) { for (let i = 0; i < 10 * (G.pm || 1); i++) spawnP(b.pos.x, b.pos.y, b.pos.z, rand(-3, 3), rand(-2, 3), rand(-3, 3), .5, rand(.08, .2) * (.6 + b.size * .3), pick([col, 0xffffff, 0xffb0b0]), 1); const d = nearMe(b.pos.x, b.pos.y, b.pos.z); if (d < 45) SFX.at(b.pos.x, b.pos.y, b.pos.z, () => SFX.hit(clamp(1.1 - d / 45, .2, 1))); if (b !== G.me && d < 60) soundInd(b.pos.x, b.pos.z, .8); }
function takePick(a, p) {
  p.on = false; p.cd = 14; p.g.visible = false; const i = pickups.indexOf(p); applyPick(a, p.t, p.r); emit({ e: 'pk', i, c: a.id });
  if (a === G.me) { SFX.pick(); toastPk(p.t, p.r); }
}
function applyPick(a, t, r) { r = r | 0;
  if (t === 'speed') { a.spdT = 6; a.turbo = 100; } else if (t === 'magnet') a.magT = 8; else if (t === 'frenzy') a.frzT = 10;
  else if (t === 'bubble') a.sh = Math.max(a.sh, Math.round(a.shMax * PK_AMT.bubble[r])); else if (t === 'heal') a.hp = Math.min(a.maxHp, a.hp + a.maxHp * PK_AMT.heal[r]);
  else if (t === 'pearl') { a.setMass(a.mass * (1.08 + .04 * r)); a.score += 150; }
}
function updPickups(dt) {
  const t = G.t;
  for (const p of pickups) { if (!p.on) { if (AUTH()) { p.cd -= dt; if (p.cd <= 0) { p.on = true; p.g.visible = true; } } continue; }
    p.g.position.y = p.y + Math.sin(t * 1.6 + p.x) * .4; p.wire.rotation.y += dt; p.wire.rotation.x += dt * .6; }
}
function useSpecial(c) {
  if (c.specCd > 0 || !c.alive) return; c.specCd = c.specMax; const k = STAGES[c.stage].spec;
  if (k === 'dart') c.dartT = .8; else if (k === 'frenzy') c.frenzyT = 5; else if (k === 'lunge') { c.lungeT = .55; c.biteT = .6; } else if (k === 'sonar') c.sonarT = 8; else if (k === 'vacuum') c.vacT = 3;
  else if (k === 'quake') { const R = 18 * c.size / 4.6;
    for (const f of npcs) if (f.alive && f.size < c.size && f.pos.distanceTo(c.pos) < R) { f.stunT = 2.5; tq.subVectors(f.pos, c.pos).setLength(8); f.vel.copy(tq); }
    for (const o of G.fish) { if (o === c || !o.alive) continue; const d = o.pos.distanceTo(c.pos); if (d > R) continue; tq.subVectors(o.pos, c.pos).setLength(16 * (1 - d / R) + 4); o.kv.add(tq); o.stunT = 1.2; if (o.size < c.size) damage(o, 18, c); } }
  emit({ e: 'sp', c: c.id, k }); specFx(c, k);
}
function specFx(c, k) {
  const s = c.size, p = c.pos, near = nearMe(p.x, p.y, p.z);
  if (k === 'quake') { fxRing(p.x, p.y, p.z, 18 * s / 4.6, 0x9fe8ff, .7); fxRing(p.x, p.y, p.z, 12 * s / 4.6, 0xffffff, .5); fxBubbles(p.x, p.y, p.z, 40, 2, s); if (near < 60) { SFX.at(p.x, p.y, p.z, () => SFX.onde()); camShake.v = Math.max(camShake.v, clamp(1 - near / 50, 0, 1) * 1.2); } }
  else if (k === 'sonar') { fxRing(p.x, p.y, p.z, 30, 0x7ef29d, 1.2); if (c === G.me) SFX.sonar(); }
  else if (k === 'vacuum') { fxBubbles(p.x, p.y, p.z, 30, 1.5, s); if (near < 60) SFX.at(p.x, p.y, p.z, () => SFX.gulp(1)); }
  else { fxBubbles(p.x, p.y, p.z, 16, 1, s * .5); if (c === G.me) SFX.bubble(1); }
}

/* ---- bot AI ---- */
function aiThink(c, dt) {
  const ai = c.ai, ct = c.ctrl; ai.t -= dt;
  if (ai.t <= 0) { ai.t = .2 + (1 - ai.k) * .25;
    let thr = null, td = 1e9;
    for (const a of G.fish) if (a !== c && a.alive && a.size > c.size * 1.1) { const d = a.pos.distanceTo(c.pos); if (d < 16 + a.size * 2 && d < td) { td = d; thr = a; } }
    for (const f of npcs) if (f.alive && f.S.pred && f.size > c.size * 1.1) { if (Math.abs(f.pos.x - c.pos.x) > 40) continue; const d = f.pos.distanceTo(c.pos); if (d < 14 + f.size * 2 && d < td) { td = d; thr = f; } }
    ai.flee = thr; ai.fd = td;
    let best = null, bs = 0; for (const f of npcs) { if (!f.alive || f.size * 1.12 > c.size) continue; const dx = f.pos.x - c.pos.x, dz = f.pos.z - c.pos.z; if (Math.abs(dx) > 60 || Math.abs(dz) > 60) continue; const d = Math.hypot(dx, f.pos.y - c.pos.y, dz); if (d > 60) continue; const s = (Math.pow(f.size, 3) + .05) / (d + 4) * (f.S.gold ? 3 : 1); if (s > bs) { bs = s; best = f; } }
    for (const a of G.fish) { if (a === c || !a.alive || a.size * 1.12 > c.size || a.spawnT > 0) continue; const d = a.pos.distanceTo(c.pos); if (d > 45) continue; const s = a.mass * .6 / (d + 4); if (s > bs) { bs = s; best = a; } }
    let pk = null; for (const p of pickups) if (p.on) { const d = Math.hypot(p.x - c.pos.x, p.y - c.pos.y, p.z - c.pos.z); if (d < 28 && (!pk || d < pk.d)) pk = { p, d }; }
    ai.prey = best; ai.pk = pk;
    if (!best && !pk && (ai.wanT < G.t || c.pos.distanceTo(ai.wan) < 6)) { pickSpot(ai.wan, clamp(c.stage - 1 + (Math.random() < .3 ? 1 : 0), 0, 3), Math.random, c.size); ai.wanT = G.t + 12; } }
  let tx, ty, tz; const fl = ai.flee; ct.bite = false;
  if (fl && ai.fd < 12 + fl.size * 2) { tx = c.pos.x + (c.pos.x - fl.pos.x) * 3; ty = c.pos.y + (c.pos.y - fl.pos.y) * 1.5; tz = c.pos.z + (c.pos.z - fl.pos.z) * 3; ct.boost = c.turbo > 10 && ai.k > .3; }
  else if (ai.pk && ai.pk.p.on && (!ai.prey || ai.pk.d < 12)) { tx = ai.pk.p.x; ty = ai.pk.p.y; tz = ai.pk.p.z; ct.boost = false; }
  else if (ai.prey && ai.prey.alive) { const p = ai.prey.pos; tx = p.x; ty = p.y; tz = p.z; const d = p.distanceTo(c.pos); ct.boost = d < 14 && c.turbo > 30 && Math.random() < ai.k; ct.bite = d < c.size * 2.2 + ai.prey.size; }
  else { tx = ai.wan.x; ty = ai.wan.y; tz = ai.wan.z; ct.boost = false; }
  tx = clamp(tx, -W + 10, W - 10); tz = clamp(tz, -W + 10, W - 10); ty = clamp(ty, seabed(tx, tz) + c.size + 1, -c.size - 1);
  const dx = tx - c.pos.x, dy = ty - c.pos.y, dz = tz - c.pos.z, h = Math.hypot(dx, dz);
  ct.steer = clamp(-angDiff(c.yaw, Math.atan2(dx, dz)) * 2.2, -1, 1); ct.pitch = clamp(Math.atan2(dy, h + .01), -1, 1); ct.slow = false;
  if (c.specCd <= 0 && ((ai.prey && c.pos.distanceTo(ai.prey.pos) < 10) || (fl && ai.fd < 10)) && Math.random() < ai.k * dt * 3) ct.specN++;
}

/* ================== Match ================== */
function clearFish() { for (const c of G.fish) { scene.remove(c.g); if (c.mesh) c.mesh.material.dispose(); } G.fish = []; G.me = null; $('tags').innerHTML = ''; }
function spawnPoint(i, n, c) { const a = i / n * Math.PI * 2 + .35; c.pos.set(-92 + Math.cos(a) * 26, -13 + Math.sin(a * 3) * 3, Math.sin(a) * 26); c.pos.y = Math.max(c.pos.y, seabed(c.pos.x, c.pos.z) + 3); c.yaw = Math.atan2(c.pos.x + 92, c.pos.z) + Math.PI * .5; }
const BOT_CLANS = ['NOVA', 'VOID', 'HEX', 'RAID', 'GLTCH', 'ZERO'];
function botAv() { const a = pick(AVATARS.filter(x => !x.ach)); return { id: a.id, a: '', n: Math.random() < .5 ? pick(AV_NEON) : '' }; }
const botSkin = () => pick(['classic', 'classic', 'reef', 'tiger', 'sharkgym', 'neon']);
function soloRoster() {
  let w = S.vague, nb = Math.min(7, 3 + Math.floor(w / 2)), k = Math.min(.95, .35 + w * .07), hpMul = Math.min(1.5, 1 + .05 * (w - 1)), dmgMul = Math.min(1.15, .65 + w * .05);
  if (S.ranked) { const t = tierOf(S.rp); nb = 6; k = Math.min(.95, .45 + t * .09); hpMul = 1 + t * .07; dmgMul = Math.min(1.15, .75 + t * .07); w = 2 + t * 2; }
  G.predK = Math.min(1.4, .75 + w * .05);
  const r = [{ id: 0, nom: pseudo(), sk: S.skin, lo: myLoadout(), local: true, tr: S.style.trail, ti: S.style.title, av: S.av, cl: S.clan, hn: S.style.horn }];
  const noms = [...BOT_NOMS].sort(() => Math.random() - .5);
  for (let i = 0; i < nb; i++) r.push({ id: i + 1, nom: noms[i], sk: botSkin(), bot: true, k, hpMul, dmgMul, lo: botLoadout(k), av: botAv(), cl: pick(BOT_CLANS) });
  return r;
}
function startMatch(roster, myId, net, seed, pop) {
  G.roster = roster; G.net = net || null; G.seed = seed || (Math.random() * 1e9 | 0); G.pop = pop || (GFX[S.gfx] || GFX.high).pop;
  if (!net) G.predK = G.predK || 1; else G.predK = 1;
  clearFish(); hideShowcase(); buildPopulation(G.seed, G.pop); makePickups(G.seed + 7);
  G.ended = false; G.t = 0; G.ev = []; G.nTotal = roster.length; G.ranked = net ? !!Net.ranked : !!S.ranked; G.lastSpecN = IN.specN; G.res = null; G.deadMsg = 0; G.mt = 0; G.endWhy = ''; resetAlert();
  roster.forEach((r, i) => { const c = new Fish(r); spawnPoint(i, roster.length, c); c.spawnT = 2; G.fish.push(c); c.syncMesh(0); });
  G.me = G.fish.find(c => c.id === myId) || G.fish[0]; G.me.local = true; renderPortraits();
  G.fish.forEach(c => { if (c === G.me) return; const d = document.createElement('div'); d.className = 'tag'; d.innerHTML = `${c.titre && L.titles[c.titre] ? `<small>« ${L.titles[c.titre]} »</small><br>` : ''}<span>${c.clan ? `<i class="cl">[${esc(c.clan)}]</i> ` : ''}${esc(c.nom)} <em class="sz"></em></span><div class="shbar"><i></i></div><div class="hbar"><i></i></div><b class="emo"></b>`; $('tags').appendChild(d); c.tag = d; c.tagBar = d.querySelector('.hbar i'); c.tagSh = d.querySelector('.shbar i'); c.tagEmo = d.querySelector('.emo'); c.tagSz = d.querySelector('.sz'); });
  G.lastHp = null; G.screamed = 0; toggleWheel(false); emoSetup(); refreshMats();
  G.mode = 'countdown'; G.cd = 3.2; G.lastCd = 4;
  $('hNom').textContent = G.me.nom + (S.style.title ? ' « ' + L.titles[S.style.title] + ' »' : '');
  $('iNiv').textContent = (G.ranked ? L.ranked + ' · ' : '') + (G.net ? L.online : G.ranked ? TIERS[tierOf(S.rp)].nom : L.wave + ' ' + S.vague); $('feed').innerHTML = '';
  showScreen(null); $('hud').classList.add('on'); camInit = true; G.endT = 0;
  if (!G.net) { S.parties++; save(); }
}
function checkEnd() {
  if (G.ended || !AUTH()) return;
  const big = G.fish.find(c => c.alive && c.size >= WIN_SIZE);
  if (big) { G.ended = true; G.endT = 2.5; G.endWhy = 'goal'; G.goalId = big.id; centreMsg('🐋', L.reachedGoal(big.nom), 2.5); emit({ e: 'endmsg', w: 'goal', c: big.id }); }
  else if (G.mt >= MATCH_TIME) { G.ended = true; G.endT = 2; G.endWhy = 'time'; centreMsg('⏱️', L.timeUp, 2); emit({ e: 'endmsg', w: 'time' }); }
}
const rankSort = (a, b) => (b.id === G.goalId) - (a.id === G.goalId) || b.score - a.score || b.kills - a.kills || a.deaths - b.deaths;
function finishMatch() {
  let r = 1; for (const c of [...G.fish].sort(rankSort)) c.rank = r++;
  const res = G.fish.map(c => ({ id: c.id, nom: c.nom, rank: c.rank || 1, score: c.score, kills: c.kills, deaths: c.deaths, eaten: c.eaten, size: Math.round(c.maxSize * 100) / 100, st: c.stage, peer: c.peer, bot: c.bot, av: c.av, cl: c.clan })).sort((a, b) => a.rank - b.rank);
  if (G.net === 'host') Net.broadcast({ t: 'end', res: res.map(({ peer, bot, ...x }) => x) });
  showResults(res);
}
function showResults(res) {
  G.mode = 'end'; SFX.engine(0, false);
  const mine = res.find(r => r.id === G.me.id) || { rank: res.length, kills: 0, score: 0, eaten: 0, size: 1, deaths: 0 }; const N = res.length;
  const won = mine.rank === 1; G.lastRes = res;
  let xp = (won ? 150 + 15 * N : Math.max(15, Math.round(100 * (N - mine.rank) / Math.max(1, N - 1)))) + mine.kills * 30 + Math.round(mine.score / 60);
  if (!G.net && won) xp += S.vague * 10;
  const before = xpInfo().n; S.xp += xp; const after = xpInfo().n; S.niveau = after;
  S.kills += mine.kills; S.eaten += mine.eaten || 0; S.meilleursKills = Math.max(S.meilleursKills, mine.kills); if (mine.rank <= 3) S.podiums++;
  S.bestSize = Math.max(S.bestSize, mine.size || 1); S.bestScore = Math.max(S.bestScore, mine.score || 0); S.maxStage = Math.max(S.maxStage, stageOf(mine.size || 1));
  if (G.net) { S.enLigne++; S.parties++; }
  const loot = []; if (won || Math.random() < (mine.rank <= 3 ? .5 : .2)) loot.push(rollItem(won ? (G.net ? 1.5 : 1) + S.vague * .05 : 0));
  const lvlRewards = []; for (let n = before + 1; n <= after; n++) { const it = rollItem(1 + n / 8); loot.push(it); lvlRewards.push({ n, it, skins: SKINS.filter(s => s.niv === n) }); }
  loot.forEach(addItem);
  const vagueAvant = S.vague; if (won && !mine.deaths) S.flawless++;
  let rpRow = '', tierMsg = '';
  if (G.ranked) { ensureRivals(); const t0 = tierOf(S.rp); let dl = Math.round((N + 1 - 2 * mine.rank) / Math.max(1, N - 1) * 30) + (won ? 10 : 0) + mine.kills * 2; if (dl < 0) dl = Math.round(dl * (0.5 + t0 * .15));
    S.rp = Math.max(0, S.rp + dl); S.rpMax = Math.max(S.rpMax, S.rp); S.rankedMatches++; if (won) S.rankedWins++;
    S.rivals.forEach(r => r.rp = Math.max(0, r.rp + Math.round(rand(-22, 28))));
    const t1 = tierOf(S.rp); if (t1 > t0) tierMsg = L.tierUp(TIERS[t1].nom); else if (t1 < t0) tierMsg = L.tierDown(TIERS[t1].nom);
    rpRow = `<span>${L.rankPts}</span><b>${dl >= 0 ? '+' : ''}${dl} → ${S.rp} ${TIERS[t1].ic}</b>`; }
  if (!G.net && !G.ranked) { if (won) { S.victoires++; S.vague++; S.meilleureVague = Math.max(S.meilleureVague, S.vague); } } else if (won) S.victoires++;
  const achs = checkAch(); save(); (won ? SFX.win : SFX.lose)();
  $('fTitre').textContent = won ? L.victory : mine.rank <= 3 ? L.place(mine.rank) : L.destroyed;
  $('fSous').textContent = (G.ranked ? L.ranked + ' · ' : '') + (G.net ? L.onlineMatch(N) : G.ranked ? TIERS[tierOf(S.rp)].nom : won ? L.waveCleared(vagueAvant) : L.waveLost(vagueAvant, mine.rank, N));
  $('fTbl').innerHTML = `<span>${L.rank}</span><b>${L.ord(mine.rank)} / ${N}</b><span>${L.score}</span><b>${mine.score}</b><span>${L.finalSize}</span><b>${STAGES[stageOf(mine.size || 1)].ic} ${(mine.size || 1).toFixed(2)}</b><span>${L.fishEaten}</span><b>${mine.eaten || 0}</b><span>${L.kills}</span><b>${mine.kills}</b><span>${L.xpEarned}</span><b>+${xp}</b>${rpRow}`;
  $('fPodium').innerHTML = res.slice(0, 10).map(r => `<div class="${r.id === G.me.id ? 'moi' : ''}"><b>${r.rank}</b><img class="pav" src="${avPortrait(r.av)}" alt=""> ${r.cl ? `<i class="cl">[${esc(r.cl)}]</i> ` : ''}${esc(r.nom)} <small>${STAGES[stageOf(r.size || 1)].ic} ${r.score} · ${r.kills} 😋 · ${r.deaths || 0} ☠️</small></div>`).join('');
  $('fLoot').innerHTML = (tierMsg ? `<div class="item r3"><span class="ic">${TIERS[tierOf(S.rp)].ic}</span><div><b>${tierMsg}</b></div></div>` : '') + achs.map(a => `<div class="item r3"><span class="ic">${a.ic}</span><div><b>${L.achUnlocked} ${L.ach[a.id][0]}</b><small>${L.reward}: ${rwType(a.rw)} « ${rwName(a.rw)} »${a.av ? ' + ' + L.avReward + ' ' + L.avNames[a.av] : ''}</small></div></div>`).join('') + (loot.length ? `<div class="sub">${L.loot}</div>` + loot.map(itemHTML).join('') : '');
  if (achs.length) setTimeout(() => SFX.levelUp(), 300);
  const xi = xpInfo(); $('fXp').innerHTML = `${L.level} ${xi.n} <div class="hbar t"><i style="width:${xi.x / xi.need * 100}%"></i></div><small>${xi.x} / ${xi.need} XP</small>`;
  $('bSuivant').textContent = G.net ? L.backLobby : G.ranked ? L.play + ' (' + L.ranked + ')' : won ? L.nextWave : L.retry;
  $('hud').classList.remove('on'); showScreen('sFin');
  if (lvlRewards.length) setTimeout(() => { if ($('sFin').classList.contains('on')) showLevelUp(lvlRewards); }, 600);
}
function vitalsBreak(st = 0) {
  const lo = myLoadout(), S0 = STAGES[st], hp = Math.round(S0.hp * (1 + lo.hp / 100)), sb = 15 + st * 8, sh = sb + lo.sh, a = itemById(S.equip.arme), wr = a ? a.r : 0, ms = lo.sh - W_SH[wr];
  return `<div class="brk"><span class="bh">✚ ${L.health} <b>${hp}</b> = ${S0.hp} ${L.baseW} (${S0.nom}) + ${lo.hp}% ${L.gearW}</span><span class="bs">🔰 ${L.shield} <b>${sh}</b> = ${sb} ${L.baseW}${W_SH[wr] ? ` + ${W_SH[wr]} <i style="color:${RAR[wr].coul}">${RAR[wr].nom}</i> ${L.slotWeapon.toLowerCase()}` : ''}${ms ? ` + ${ms} charms` : ''}</span><small>${L.regenNote}</small></div>`;
}
function itemHTML(it) { const R = RAR[it.r]; return `<div class="item r${it.r}" data-u="${it.u}"><span class="ic">${itemIc(it)}</span><div><b>${esc(itemNom(it))}</b><small style="color:${R.coul}">${R.nom} · ${it.t === 'arme' ? L.gunType : L.modType}</small><small>${esc(itemDesc(it))}</small></div></div>`; }
function showLevelUp(list) {
  const last = list[list.length - 1]; SFX.levelUp(); $('luNiv').textContent = last.n;
  $('luRec').innerHTML = list.map(l => itemHTML(l.it) + l.skins.map(s => `<div class="item r2"><span class="ic">🎨</span><div><b>${L.newPaint} ${s.nom}</b><small>${L.pickInGarage}</small></div></div>`).join('')).join('');
  $('lvlUp').classList.add('on');
  for (let i = 0; i < 60; i++) { const e = document.createElement('i'); e.className = 'conf'; e.style.left = rand(0, 100) + '%'; e.style.background = pick(['#ffc21f', '#22e5ff', '#2fa8ff', '#7ef29d', '#ff2bd6']); e.style.animationDelay = rand(0, .6) + 's'; e.style.animationDuration = rand(1.2, 2.2) + 's'; $('lvlUp').appendChild(e); setTimeout(() => e.remove(), 3000); }
}
function respawnFish(c) {
  const m = Math.max(1, c.mass * .4); c.stage = -1; c.maxHp = 1; c.setMass(m, true); c.hp = c.maxHp; c.sh = c.shMax;
  for (const k of TIMERS) c[k] = 0; c.turbo = 100; c.kv.set(0, 0, 0); c.speed = 0;
  for (let k = 0; k < 8; k++) { pickSpot(c.pos, clamp(c.stage - (k < 4 ? 0 : 1), 0, 3), Math.random, c.size); if (G.fish.every(o => o === c || !o.alive || o.size <= c.size || o.pos.distanceTo(c.pos) > 45)) break; }
  c.yaw = rand(0, 6.28); c.pitch = 0; c.alive = true; c.spawnT = 2; c.growK = .5;
  if (c === G.me) { G.deadMsg = 0; centreMsg(L.go, '', .6); camInit = true; }
}

/* ================== Camera ================== */
let camInit = true; const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let camYaw = 0, camPitch = 0;
function updCamera(dt) {
  const t = performance.now() / 1000;
  if (G.mode === 'menu' || G.mode === 'garage' || G.mode === 'draft' || !G.me) {
    if (G.mode === 'garage' && showcase) { const k = showcase.userData.k; camera.position.set(-118 + 0, -12 + 1.5 * k, 8.5 * k); camera.lookAt(-118 + 2.6 * k * Math.max(1, camera.aspect) / 2.17, -12 + .4 * k, 0); }
    else { const a = t * .03; camera.position.set(-95 + Math.sin(a) * 45, -14 + Math.sin(t * .1) * 3, Math.cos(a) * 45); camera.lookAt(-95, -20, 0); }
    camera.fov = 62 + S.disp.fov; camera.updateProjectionMatrix(); return;
  }
  const c = G.me.alive ? G.me : (G.fish.find(o => o.id === G.me.killer && o.alive) || G.me);
  const k = 1 - Math.exp(-(camInit ? 1000 : 5) * dt);
  camYaw += angDiff(camYaw, c.yaw) * (camInit ? 1 : 1 - Math.exp(-4 * dt)); camPitch += (c.pitch * .55 - camPitch) * (camInit ? 1 : 1 - Math.exp(-3 * dt));
  const cp = Math.cos(camPitch), fx = Math.sin(camYaw) * cp, fy = Math.sin(camPitch), fz = Math.cos(camYaw) * cp, s = c.size * (c.growK || 1);
  const dist = (3.6 + s * 2.6 + c.speed * .04) * (S.disp.cam / 100), h = (1 + s * 1.15) * (.4 + .6 * S.disp.cam / 100);
  const tp = tv.set(c.pos.x - fx * dist, c.pos.y - fy * dist + h, c.pos.z - fz * dist);
  if (camInit) { camPos.copy(tp); camInit = false; } else camPos.lerp(tp, k);
  camPos.y = clamp(camPos.y, seabed(camPos.x, camPos.z) + .8, -.6);
  camLook.set(c.pos.x + fx * s * 2.2, c.pos.y + fy * s * 2.2 + s * .3, c.pos.z + fz * s * 2.2);
  camera.position.copy(camPos);
  if (camShake.v > 0) { camera.position.x += rand(-1, 1) * camShake.v; camera.position.y += rand(-1, 1) * camShake.v; camShake.v = Math.max(0, camShake.v - dt * 2.5); }
  camera.lookAt(camLook);
  camera.fov += ((c.boostOn || c.lungeT > 0 || c.dartT > 0 ? 74 : (camera.aspect < 1.2 ? 75 : 64)) + S.disp.fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix();
}
