
/* ================== Procedural low-poly fish ================== */
const SHP = {
  slim: { bw: .2, bh: .27, tail: .55, dorsal: .25, eye: .1 },
  krill: { bw: .16, bh: .2, tail: .35, dorsal: 0, legs: 1, eye: .1 },
  round: { bw: .3, bh: .55, tail: .45, dorsal: .35, eye: .11 },
  disc: { bw: .17, bh: .75, tail: .5, dorsal: .45, eye: .1 },
  puff: { bw: .75, bh: .72, tail: .4, dorsal: .2, spikes: 1, eye: .13 },
  fish: { bw: .28, bh: .42, tail: .6, dorsal: .4, eye: .08 },
  piranha: { bw: .3, bh: .62, tail: .55, dorsal: .35, teeth: 1, eye: .1 },
  barracuda: { bw: .17, bh: .22, tail: .55, dorsal: .25, teeth: 1, snout: 1, eye: .07 },
  shark: { bw: .3, bh: .34, tail: .85, dorsal: .65, forked: 1, teeth: 1, gills: 1, eye: .055 },
  mega: { bw: .4, bh: .44, tail: .95, dorsal: .75, forked: 1, teeth: 2, gills: 1, eye: .05 },
  angler: { bw: .5, bh: .55, tail: .45, dorsal: .2, teeth: 2, lure: 1, eye: .07 },
  whale: { bw: .42, bh: .36, flukes: 1, dorsal: .12, grooves: 1, eye: .04 },
  orca: { bw: .38, bh: .38, flukes: 1, dorsal: .8, patch: 1, eye: .045 },
  ray: { ray: 1, eye: .05 },
};
const mat4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); return dummy.matrix.clone(); };
function mergeParts(parts) {
  let n = 0; const gs = parts.map(p => { const g = (p.g.index ? p.g.toNonIndexed() : p.g.clone()); g.applyMatrix4(p.m); n += g.attributes.position.count; return g; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), glo = new Float32Array(n); let o = 0; const c = new THREE.Color();
  gs.forEach((g, k) => { const P = g.attributes.position, N = g.attributes.normal, part = parts[k];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); pos.set([x, y, z], (o + i) * 3); nor.set([N.getX(i), N.getY(i), N.getZ(i)], (o + i) * 3);
      if (typeof part.col === 'function') part.col(x, y, z, c); else c.set(part.col); col.set([c.r, c.g, c.b], (o + i) * 3); glo[o + i] = part.glow || 0; }
    o += P.count; g.dispose(); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('glow', new THREE.BufferAttribute(glo, 1)); g.computeBoundingSphere(); return g;
}
const GEO = { sph: new THREE.SphereGeometry(1, 16, 12), sphL: new THREE.SphereGeometry(1, 8, 6), box: new THREE.BoxGeometry(1, 1, 1), cone: new THREE.ConeGeometry(.5, 1, 5), cyl: new THREE.CylinderGeometry(.5, .5, 1, 6) };
const geoCache = new Map();
// pal: {col, bel, fin, st (stripes), stc, glowFin, glowAll, rb (rainbow), sg (SharkGym trims)}
function fishGeo(shape, pal) {
  const key = shape + JSON.stringify(pal); if (geoCache.has(key)) return geoCache.get(key);
  const P = SHP[shape] || SHP.fish, parts = [], C = new THREE.Color();
  const body = new THREE.Color(pal.col), bel = new THREE.Color(pal.bel), fin = new THREE.Color(pal.fin), stc = new THREE.Color(pal.stc != null ? pal.stc : 0xffffff);
  const bodyCol = (bh) => (x, y, z, c) => { if (pal.rb) c.setHSL(((z + 1) * .5 + y * .2) % 1, .9, .58); else c.copy(body).lerp(bel, sstep(-bh * .05, -bh * .6, y));
    if (pal.st && (Math.abs(z - .38) < .07 || Math.abs(z + .12) < .07 || (shape !== 'round' && Math.abs(z + .55) < .05))) c.copy(stc); if (P.patch && y > 0 && z > .55 && z < .8 && Math.abs(x) > .2) c.set(0xffffff); };
  const gA = pal.glowAll || 0, gF = pal.glowFin ? 1 : gA;
  if (P.ray) {
    parts.push({ g: GEO.sph, m: mat4(0, 0, 0, 0, 0, 0, 1.15, .14, .75), col: bodyCol(.14), glow: gA });
    parts.push({ g: GEO.cyl, m: mat4(0, 0, -1.4, Math.PI / 2, 0, 0, .06, 1.6, .06), col: fin, glow: gF });
    for (const s of [-1, 1]) { parts.push({ g: GEO.sphL, m: mat4(s * .18, .1, .45, 0, 0, 0, .06, .06, .06), col: 0x111111 }); parts.push({ g: GEO.box, m: mat4(s * .28, -.02, .72, 0, s * .3, 0, .08, .05, .3), col: fin, glow: gF }); }
  } else {
    const bw = P.bw, bh = P.bh, L = P.snout ? 1.15 : 1;
    parts.push({ g: GEO.sph, m: mat4(0, 0, 0, 0, 0, 0, bw, bh, L), col: bodyCol(bh), glow: gA });
    if (P.snout) parts.push({ g: GEO.cone, m: mat4(0, -.02, 1.2, Math.PI / 2, 0, 0, bw * 1.2, .45, bh * 1.1), col: body, glow: gA });
    const t = P.tail || .5;
    if (P.flukes) { for (const s of [-1, 1]) parts.push({ g: GEO.box, m: mat4(s * .32, 0, -1.12, 0, s * .45, 0, .75, .05, .32), col: fin, glow: gF }); parts.push({ g: GEO.cone, m: mat4(0, 0, -.9, -Math.PI / 2, 0, 0, .3, .5, .2), col: body, glow: gA }); }
    else if (P.forked) { parts.push({ g: GEO.box, m: mat4(0, t * .42, -1.12, -.75, 0, 0, .05, t * 1.15, .3), col: fin, glow: gF }); parts.push({ g: GEO.box, m: mat4(0, -t * .25, -1.05, .85, 0, 0, .05, t * .7, .26), col: fin, glow: gF }); }
    else { parts.push({ g: GEO.box, m: mat4(0, t * .3, -1.05, -.6, 0, 0, .05, t * .9, t * .45), col: fin, glow: gF }); parts.push({ g: GEO.box, m: mat4(0, -t * .3, -1.05, .6, 0, 0, .05, t * .9, t * .45), col: fin, glow: gF }); }
    if (P.dorsal) parts.push({ g: GEO.cone, m: mat4(0, bh * .85 + P.dorsal * .3, -.08, -.45, 0, 0, .07, P.dorsal, P.dorsal * .9), col: fin, glow: gF });
    for (const s of [-1, 1]) { parts.push({ g: GEO.box, m: mat4(s * (bw + .1), -bh * .35, .3, 0, s * .5, s * .5, .32, .03, .2), col: fin, glow: gF });
      const er = P.eye, ex = s * bw * .78, ey = bh * .28, ez = P.snout ? .7 : .62;
      parts.push({ g: GEO.sphL, m: mat4(ex, ey, ez, 0, 0, 0, er, er, er), col: 0xffffff }); parts.push({ g: GEO.sphL, m: mat4(ex + s * er * .55, ey, ez + er * .3, 0, 0, 0, er * .6, er * .6, er * .6), col: 0x080808 });
      if (P.gills) for (let k = 0; k < 3; k++) parts.push({ g: GEO.box, m: mat4(s * bw * .92, 0, .38 - k * .08, 0, 0, 0, .02, bh * .5, .015), col: 0x1a2028 });
      if (pal.sg) parts.push({ g: GEO.box, m: mat4(s * bw * .97, -bh * .08, -.1, 0, 0, 0, .02, .04, 1.1), col: 0x22e5ff, glow: 1 }); }
    if (P.teeth) { const n = P.teeth > 1 ? 9 : 6; for (let k = 0; k < n; k++) { const a = (k / (n - 1) - .5) * 1.6, zz = (P.snout ? 1.12 : .93) - Math.abs(a) * .12; parts.push({ g: GEO.cone, m: mat4(Math.sin(a) * bw * .7, -bh * .3, zz, Math.PI, 0, 0, .05, .1 * P.teeth, .05), col: 0xffffff }); } }
    if (P.grooves) for (let k = 0; k < 5; k++) parts.push({ g: GEO.box, m: mat4((k - 2) * .07, -bh * .92, .45, 0, 0, 0, .02, .02, .6), col: 0x9fb0c0 });
    if (P.patch) for (const s of [-1, 1]) parts.push({ g: GEO.sphL, m: mat4(s * bw * .7, bh * .3, .66, 0, 0, 0, .05, .08, .18), col: 0xffffff });
    if (P.lure) { parts.push({ g: GEO.cyl, m: mat4(0, bh + .25, .55, .7, 0, 0, .03, .7, .03), col: fin }); parts.push({ g: GEO.sphL, m: mat4(0, bh + .45, 1.0, 0, 0, 0, .12, .12, .12), col: pal.glowC || 0x7ef2ff, glow: 2.5 }); }
    if (P.spikes) for (let k = 0; k < 18; k++) { const a = k * 2.4, b = (k % 6) / 6 * 2.6 - 1.3; parts.push({ g: GEO.cone, m: mat4(Math.cos(a) * bw * Math.cos(b), Math.sin(b) * bh, Math.sin(a) * .8 * Math.cos(b), b, a, Math.PI / 2, .05, .22, .05), col: fin }); }
    if (P.legs) for (let k = 0; k < 6; k++) parts.push({ g: GEO.box, m: mat4(0, -bh * .9, .5 - k * .17, .3, 0, 0, .22, .02, .02), col: fin });
  }
  const g = mergeParts(parts); geoCache.set(key, g); return g;
}
function fishMaterial(mode, o = {}) {
  const u = { uF: { value: 7 }, uA: { value: mode === 2 ? .35 : .14 }, uPh: { value: Math.random() * 6 } };
  const opt = { vertexColors: true, transparent: !!o.ghost, opacity: o.ghost ? .55 : 1 };
  const m = G.pbr ? new THREE.MeshStandardMaterial({ ...opt, roughness: o.metal ? .25 : .42, metalness: o.metal ? .85 : .12, envMapIntensity: 1.1 }) : new THREE.MeshLambertMaterial(opt);
  m.defines = { MODE: mode }; m.userData.u = u;
  m.onBeforeCompile = sh => { sh.uniforms.uT = UT; Object.assign(sh.uniforms, u);
    sh.vertexShader = 'uniform float uT, uF, uA, uPh; attribute float glow; varying float vGlow;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float ph = instanceMatrix[3][0] * .7 + instanceMatrix[3][2] * .37;
      #else
        float ph = uPh;
      #endif
      float tz = clamp((.45 - position.z) / 1.6, 0., 1.);
      #if MODE == 1
        transformed.y += sin(uT * uF * .55 + ph - position.z * 1.4) * uA * tz * tz * 1.2;
      #elif MODE == 2
        float ax = abs(position.x); transformed.y += sin(uT * uF * .45 + ph) * uA * ax * ax;
      #else
        transformed.x += sin(uT * uF + ph - position.z * 2.4) * uA * tz * tz;
      #endif
      vGlow = glow;`);
    sh.fragmentShader = 'varying float vGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * vGlow * 1.4;'); };
  m.customProgramCacheKey = () => 'fish' + mode + (G.pbr ? 'p' : 'l');
  return m;
}
const shapeMode = s => SHP[s] && SHP[s].flukes ? 1 : SHP[s] && SHP[s].ray ? 2 : 0;
function skinPal(stIdx, skinId) {
  const st = STAGES[stIdx], sk = SKINS.find(s => s.id === skinId) || SKINS[0];
  if (!sk.c) return { col: st.col, bel: st.bel, fin: st.fin };
  return { col: sk.c, bel: sk.b, fin: sk.f, st: sk.st ? 1 : 0, stc: skinId === 'tiger' ? 0x2a1a08 : 0xffffff, glowFin: sk.em ? 1 : 0, rb: sk.rb ? 1 : 0, sg: sk.sg && stIdx >= 3 ? 1 : 0 };
}
function buildFishMesh(stIdx, skinId) {
  const st = STAGES[stIdx], sk = SKINS.find(s => s.id === skinId) || SKINS[0];
  const m = new THREE.Mesh(fishGeo(st.shape, skinPal(stIdx, skinId)), fishMaterial(shapeMode(st.shape), { ghost: sk.ghost, metal: sk.metal }));
  m.castShadow = true; return m;
}
/* ---- particles (bubbles, scales, sparkles) ---- */
const PMAX = 900;
const pMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ transparent: true, opacity: .85, depthWrite: false }), PMAX);
pMesh.frustumCulled = false; scene.add(pMesh);
const parts = []; for (let i = 0; i < PMAX; i++) { parts.push({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 1, b: 0 }); pMesh.setColorAt(i, new THREE.Color(1, 1, 1)); }
let pIdx = 0;
function spawnP(x, y, z, vx, vy, vz, life, size, color, buoy = 0) {
  const p = parts[pIdx]; pMesh.setColorAt(pIdx, tmpC.set(color)); pIdx = (pIdx + 1) % PMAX;
  p.p.set(x, y, z); p.v.set(vx, vy, vz); p.life = p.max = life; p.s = size; p.b = buoy; pMesh.instanceColor.needsUpdate = true;
}
function updParts(dt) {
  const drag = Math.exp(-2.2 * dt);
  for (let i = 0; i < PMAX; i++) { const p = parts[i];
    if (p.life > 0) { p.life -= dt; p.v.multiplyScalar(drag); p.v.y += p.b * dt; p.p.addScaledVector(p.v, dt); if (p.p.y > -.2) p.life = 0; const k = Math.max(0, p.life / p.max); dummy.position.copy(p.p); dummy.scale.setScalar(p.s * (.35 + .65 * k)); }
    else { dummy.scale.setScalar(0); dummy.position.set(0, -500, 0); }
    dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); pMesh.setMatrixAt(i, dummy.matrix); }
  pMesh.instanceMatrix.needsUpdate = true;
}
const ringGeo = new THREE.TorusGeometry(1, .06, 6, 40); const rings = [];
for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, depthWrite: false, toneMapped: false })); m.visible = false; scene.add(m); rings.push({ m, t: 0, r: 1, d: .5 }); }
let rIdx = 0; const camShake = { v: 0 };
function fxRing(x, y, z, r, col = 0x9fe8ff, d = .5, yaw = 0) { const g = rings[rIdx]; rIdx = (rIdx + 1) % rings.length; g.m.visible = true; g.t = 0; g.r = r; g.d = d; g.m.position.set(x, y, z); g.m.rotation.set(Math.PI / 2, 0, 0); g.m.material.color.set(col); }
function updFx(dt) { for (const g of rings) if (g.m.visible) { g.t += dt; const k = g.t / g.d; if (k >= 1) { g.m.visible = false; continue; } g.m.scale.setScalar(g.r * (.2 + k)); g.m.material.opacity = 1 - k; } }
function fxBubbles(x, y, z, n, s = 1, spread = 1) { n = Math.round(n * (G.pm || 1)); for (let i = 0; i < n; i++) spawnP(x + rand(-spread, spread), y + rand(-spread, spread), z + rand(-spread, spread), rand(-2, 2) * s, rand(0, 3) * s, rand(-2, 2) * s, rand(.8, 1.8), rand(.06, .22) * s, pick([0xdffaff, 0xffffff, 0xbfefff]), rand(3, 6)); }
function fxEat(x, y, z, sz, col, gold) {
  const n = Math.round((8 + sz * 6) * (G.pm || 1));
  for (let i = 0; i < n; i++) spawnP(x, y, z, rand(-4, 4) * (.6 + sz * .3), rand(-3, 4), rand(-4, 4) * (.6 + sz * .3), rand(.4, .9), rand(.08, .22) * (.7 + sz * .3), pick([col, col, 0xffffff, gold ? 0xffd84d : 0xffc0c0]), 1);
  fxBubbles(x, y, z, 4 + sz * 2, .8 + sz * .2, sz * .4);
}
/* ---- jellyfish hazards (deterministic drift, glow) ---- */
const jellies = [];
function buildJellies() {
  const R = mulberry(99), dome = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  for (let i = 0; i < 18; i++) { const x = -40 + R() * (W + 30), z = -W + 20 + R() * (2 * W - 40), fl = seabed(x, z), y = lerp(fl + 8, -12, R()), col = [0xff5ad8, 0x6ff7ff, 0xb48cff][i % 3];
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.3), transparent: true, opacity: .55, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    g.add(new THREE.Mesh(dome, mat)); const lm = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .6 }); const pts = [];
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; for (let j = 0; j < 5; j++) { pts.push(new THREE.Vector3(Math.cos(a) * .6, -j * .55, Math.sin(a) * .6)); pts.push(new THREE.Vector3(Math.cos(a) * .6 + Math.sin(j + k) * .15, -(j + 1) * .55, Math.sin(a) * .6)); } }
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lm)); const s = 1.2 + R() * 1.2; g.scale.setScalar(s); scene.add(g);
    jellies.push({ g, home: new THREE.Vector3(x, y, z), pos: new THREE.Vector3(x, y, z), s, ph: R() * 6, hit: {} }); }
}
function updJellies(t) { for (const j of jellies) { j.pos.set(j.home.x + Math.sin(t * .11 + j.ph) * 9, j.home.y + Math.sin(t * .23 + j.ph * 2) * 4, j.home.z + Math.cos(t * .09 + j.ph) * 9); j.g.position.copy(j.pos); const k = 1 + Math.sin(t * 2.2 + j.ph) * .12; j.g.scale.set(j.s * k, j.s / k, j.s * k); } }
/* ---- power-up pickups ---- */
const pickups = [];
const emoTex = {};
function emojiTex(e) { if (emoTex[e]) return emoTex[e]; return emoTex[e] = tex(128, 128, (x) => { x.font = '96px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72); }); }
function makePickups(seed) {
  for (const p of pickups) scene.remove(p.g); pickups.length = 0; const R = mulberry(seed || 4242);
  const order = ['speed', 'bubble', 'magnet', 'heal', 'frenzy', 'speed', 'heal', 'pearl', 'bubble', 'magnet'];
  for (let i = 0; i < 28; i++) { const x = -W + 15 + R() * (2 * W - 30), z = -W + 15 + R() * (2 * W - 30), fl = seabed(x, z), y = lerp(fl + 4, -4, .2 + R() * .7), t = order[i % order.length], r = PK_RAR[i % PK_RAR.length];
    const g = new THREE.Group(); const col = PICK[t].coul;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.2), transparent: true, opacity: .32, depthWrite: false, toneMapped: false, wireframe: false }));
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(r ? RAR[r].coul : '#ffffff').multiplyScalar(1.5), wireframe: true, toneMapped: false }));
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(PICK[t].ic), depthWrite: false })); sp.scale.setScalar(1.5);
    g.add(orb, wire, sp); g.position.set(x, y, z); scene.add(g); pickups.push({ g, wire, x, y, z, t, r, on: true, cd: 0 }); }
}
