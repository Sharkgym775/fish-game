
/* ================== Rendering ================== */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, .1, 700); camera.rotation.order = 'YXZ';
let VW = innerWidth, VH = innerHeight;
function resize() {
  const vv = window.visualViewport; const h = Math.round(vv && vv.scale <= 1.01 ? vv.height : innerHeight);
  document.documentElement.style.setProperty('--vvh', h + 'px'); if (scrollY || scrollX) scrollTo(0, 0);
  const w = canvas.clientWidth || innerWidth, hh = canvas.clientHeight || h; VW = w; VH = hh;
  renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix();
  if (window.__booted) onResize2();
}
let rzT = 0; const rzQ = () => { cancelAnimationFrame(rzT); rzT = requestAnimationFrame(resize); };
addEventListener('resize', rzQ); if (window.visualViewport) { visualViewport.addEventListener('resize', rzQ); visualViewport.addEventListener('scroll', () => { if (scrollY) scrollTo(0, 0); }); }
addEventListener('orientationchange', () => { rzQ(); setTimeout(resize, 250); setTimeout(resize, 700); });
resize();
const WCOL = { top: new THREE.Color(0x2bb3d0), mid: new THREE.Color(0x0b5a85), deep: new THREE.Color(0x05203f), abyss: new THREE.Color(0x020812), gold: new THREE.Color(0x6a5a1a) };
scene.background = new THREE.Color(0x0b5a85);
scene.fog = new THREE.FogExp2(0x0b5a85, .012);
const hemi = new THREE.HemisphereLight(0xa8f0ff, 0x123040, 1.7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xe0faff, 2.1); sun.position.set(20, 100, 10); scene.add(sun); scene.add(sun.target);
const UT = { value: 0 }; // shared shader time
const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
const tmpC = new THREE.Color(), tv = new THREE.Vector3(), tv2 = new THREE.Vector3(), dummy = new THREE.Object3D();
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

/* ================== Ocean world ================== */
const W = 200; // half-size of the playable ocean
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function floorBase(x, z) { return -22 - 18 * sstep(-110, -60, x) - 30 * sstep(-10, 40, x) - 42 * sstep(70, 125, x) - 6 * sstep(120, 190, Math.abs(z)); }
function seabed(x, z) { return floorBase(x, z) + 3 * Math.sin(x * .05 + z * .03) + 2 * Math.sin(z * .08 - x * .02) + 1.2 * Math.sin((x + z) * .13) + (x < -85 ? 2.5 * Math.max(0, Math.sin(x * .21) * Math.sin(z * .19)) * 2 : 0); }
const zoneAt = x => x < -85 ? 0 : x < 15 ? 1 : x < 95 ? 2 : 3;
const ZX = [[-W + 8, -88], [-82, 12], [18, 92], [98, W - 8]];
function zoneOfDepth(y) { return y > -22 ? 0 : y > -42 ? 1 : y > -72 ? 2 : 3; }
const world = new THREE.Group(); scene.add(world);
let seabedM = null, causM = null, surfM = null;
const rocks = []; // collision spheres {x,y,z,r}
const RNGW = mulberry(77);
const rw = (a, b) => a + RNGW() * (b - a);
function buildSeabed() {
  const N = 120, g = new THREE.PlaneGeometry(2 * W + 160, 2 * W + 160, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  const sand = new THREE.Color(0xe8d49a), moss = new THREE.Color(0x4f7a4a), slate = new THREE.Color(0x3c5566), dark = new THREE.Color(0x10161f), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = seabed(x, z); p.setY(i, y);
    const d = -y; if (d < 30) c.copy(sand).lerp(moss, sstep(18, 32, d)); else if (d < 70) c.copy(moss).lerp(slate, sstep(32, 66, d)); else c.copy(slate).lerp(dark, sstep(70, 110, d));
    c.multiplyScalar(.85 + .3 * Math.abs(Math.sin(x * 1.7 + z * 2.3))); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  seabedM = new THREE.Mesh(g, lam(0xffffff, { vertexColors: true })); seabedM.receiveShadow = true; world.add(seabedM);
  // caustics overlay (additive shader on the same terrain)
  causM = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uT: UT, uI: { value: 1 }, uFogD: { value: .012 }, uN: { value: 4 } },
    vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uT, uI, uFogD; uniform int uN; varying vec3 vW; varying float vD;
      float caus(vec2 p, float t){ vec2 i = p; float c = 1.0; float inten = .005; for (int n = 0; n < 5; n++){ if (n >= uN) break; float tt = t * (1.0 - (3.5 / float(n + 1))); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten))); }
        c /= float(uN); c = 1.17 - pow(c, 1.4); return pow(abs(c), 8.0); }
      void main(){ vec2 p = mod(vW.xz * .06, 6.28318) - 250.0; float c = caus(p, uT * .45) + .5 * caus(p * 1.7 + 3.0, uT * .37);
        float depthK = clamp(1.0 - (-vW.y - 15.0) / 75.0, 0.0, 1.0); float fog = exp(-pow(uFogD * vD, 2.0));
        gl_FragColor = vec4(vec3(.55, .95, 1.0) * c * .55 * depthK * fog * uI, 1.0); }` }));
  causM.renderOrder = 1; world.add(causM);
  // water surface seen from below
  surfM = new THREE.Mesh(new THREE.PlaneGeometry(2 * W + 400, 2 * W + 400, 1, 1), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uT: UT, uCam: { value: new THREE.Vector3() } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uT; uniform vec3 uCam; varying vec3 vW;
      void main(){ vec2 p = vW.xz * .08; float r = sin(p.x * 1.3 + uT * 1.1) * sin(p.y * 1.1 - uT * .9) + .5 * sin((p.x + p.y) * 2.3 + uT * 1.7);
        float d = length(vW.xz - uCam.xz); float win = exp(-d * d / (2.0 * pow(18.0 + abs(uCam.y) * 1.2, 2.0)));
        float depthK = clamp(1.0 + uCam.y / 90.0, 0.08, 1.0);
        vec3 c = mix(vec3(.12, .55, .7), vec3(.85, 1.0, 1.0), win * .85 + r * .08);
        float a = (.55 + win * .45) * depthK * clamp(1.0 - d / 380.0, 0.0, 1.0);
        gl_FragColor = vec4(c * (1.0 + win * .6), a); }` }));
  surfM.rotation.x = Math.PI / 2; surfM.position.y = 0; surfM.renderOrder = 2; world.add(surfM);
}
// instanced decor: rocks, coral, kelp, glow tubes, bubbles columns
let kelpM = null, coralM = null, rockM = null, glowM = null, sponM = null;
function kelpMaterial() {
  const m = lam(0x2f8f4a, { side: THREE.DoubleSide });
  m.onBeforeCompile = sh => { sh.uniforms.uT = UT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    #ifdef USE_INSTANCING
      vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    #else
      vec3 ip = vec3(0.);
    #endif
    float hh = position.y; transformed.x += sin(uT * 1.1 + ip.x * .3 + ip.z * .2 + hh * 2.6) * hh * hh * 1.8; transformed.z += cos(uT * .8 + ip.z * .25 + hh * 2.0) * hh * hh * 1.1;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      float kd = length(vViewPosition); if (kd < 7.0 && fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) > (kd - 2.5) / 4.5) discard;`); };
  m.customProgramCacheKey = () => 'kelp'; return m;
}
function buildDecor() {
  // rocks (some are solid colliders)
  const RN = 110, rg = new THREE.IcosahedronGeometry(1, 0);
  rockM = new THREE.InstancedMesh(rg, lam(0xffffff, { flatShading: true }), RN); rockM.castShadow = true; rockM.receiveShadow = true;
  for (let i = 0; i < RN; i++) { const x = rw(-W, W), z = rw(-W, W), r = i < 34 ? rw(4, 11) : rw(1, 3.5), y = seabed(x, z) + r * .35;
    dummy.position.set(x, y, z); dummy.rotation.set(rw(0, 3), rw(0, 3), rw(0, 3)); dummy.scale.set(r * rw(.8, 1.3), r * rw(.6, 1), r * rw(.8, 1.3)); dummy.updateMatrix(); rockM.setMatrixAt(i, dummy.matrix);
    rockM.setColorAt(i, tmpC.setHSL(rw(.05, .6), rw(.05, .2), zoneAt(x) === 3 ? rw(.08, .16) : rw(.25, .45))); if (r > 4) rocks.push({ x, y, z, r: r * .8 }); }
  world.add(rockM);
  // shipwreck landmark (twilight drop)
  { const g = new THREE.Group(), wood = lam(0x4a3524, { flatShading: true }), dk = lam(0x2a1d14), wx = 55, wz = -40, wy = seabed(wx, wz);
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(6, 4, 34, 7, 1, true, 0, Math.PI), wood); hull.rotation.set(Math.PI / 2, 0, Math.PI); hull.position.y = 4; g.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(11, .6, 30), dk); deck.position.y = 4; g.add(deck);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, 22, 6), wood); mast.position.set(0, 13, 3); mast.rotation.z = .5; g.add(mast);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 7), wood); cabin.position.set(0, 6.5, -10); g.add(cabin);
    g.position.set(wx, wy, wz); g.rotation.set(.12, .7, .22); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); world.add(g);
    rocks.push({ x: wx, y: wy + 4, z: wz, r: 7 }, { x: wx + 8, y: wy + 4, z: wz + 7, r: 6 }, { x: wx - 8, y: wy + 4, z: wz - 7, r: 6 }); }
  // coral (reef + kelp)
  const CN = 420, cg = new THREE.ConeGeometry(.5, 1, 6, 1); cg.translate(0, .5, 0);
  coralM = new THREE.InstancedMesh(cg, lam(0xffffff), CN); coralM.receiveShadow = true;
  const sg = new THREE.SphereGeometry(1, 10, 8); sponM = new THREE.InstancedMesh(sg, lam(0xffffff), 160);
  const CC = [0xff5a7a, 0xff8a3c, 0xffd23f, 0xb06cff, 0x2fe0c8, 0xff3bd2, 0x5ad1ff];
  for (let i = 0; i < CN; i++) { const reef = i % 5 !== 0, x = reef ? rw(-W, -70) : rw(-70, 30), z = rw(-W, W), y = seabed(x, z) - .2, h = rw(1.2, 5.5);
    dummy.position.set(x, y, z); dummy.rotation.set(rw(-.4, .4), rw(0, 6), rw(-.4, .4)); dummy.scale.set(rw(.5, 1.4), h, rw(.5, 1.4)); dummy.updateMatrix(); coralM.setMatrixAt(i, dummy.matrix); coralM.setColorAt(i, tmpC.set(CC[i % CC.length])); }
  for (let i = 0; i < 160; i++) { const x = rw(-W, -40), z = rw(-W, W), r = rw(.8, 2.6); dummy.position.set(x, seabed(x, z) + r * .4, z); dummy.rotation.set(0, rw(0, 6), 0); dummy.scale.set(r, r * rw(.5, .9), r); dummy.updateMatrix(); sponM.setMatrixAt(i, dummy.matrix); sponM.setColorAt(i, tmpC.set(CC[(i * 3) % CC.length]).multiplyScalar(.85)); }
  world.add(coralM, sponM);
  // kelp forest (swaying ribbons)
  const KN = 560, kg = new THREE.PlaneGeometry(1.3, 1, 1, 8); kg.translate(0, .5, 0);
  kelpM = new THREE.InstancedMesh(kg, kelpMaterial(), KN);
  for (let i = 0; i < KN; i++) { const forest = i % 4 !== 0, x = forest ? rw(-82, 14) : rw(-W, W), z = rw(-W, W), y = seabed(x, z), h = Math.min(-y - 3, rw(10, 34) * (forest ? 1 : .5));
    dummy.position.set(x, y, z); dummy.rotation.set(0, rw(0, 6), 0); dummy.scale.set(rw(.8, 1.5), Math.max(3, h), 1); dummy.updateMatrix(); kelpM.setMatrixAt(i, dummy.matrix); kelpM.setColorAt(i, tmpC.setHSL(rw(.24, .36), rw(.45, .7), rw(.22, .38))); }
  world.add(kelpM);
  // bioluminescent tubes (twilight + abyss) — glow under bloom
  const GN = 160, gg = new THREE.CylinderGeometry(.18, .28, 1, 6); gg.translate(0, .5, 0);
  glowM = new THREE.InstancedMesh(gg, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), GN);
  for (let i = 0; i < GN; i++) { const x = rw(30, W), z = rw(-W, W), y = seabed(x, z); dummy.position.set(x, y, z); dummy.rotation.set(rw(-.3, .3), 0, rw(-.3, .3)); dummy.scale.set(1, rw(1.5, 5), 1); dummy.updateMatrix(); glowM.setMatrixAt(i, dummy.matrix); glowM.setColorAt(i, tmpC.set(pick([0x22e5ff, 0xff2bd6, 0x7ef29d, 0x9b5cff])).multiplyScalar(1.6)); }
  world.add(glowM);
  // STIMM neon arches in the abyss (landmarks)
  for (let i = 0; i < 4; i++) { const x = 115 + i * 18, z = -120 + i * 70, y = seabed(x, z); const t = new THREE.Mesh(new THREE.TorusGeometry(9, .45, 6, 32, Math.PI), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 2 ? 0xff2bd6 : 0x22e5ff).multiplyScalar(1.8), toneMapped: false })); t.position.set(x, y, z); t.rotation.y = i; world.add(t); }
}
// god rays
const rays = [];
function buildRays() {
  const t = tex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.5, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); const g2 = x.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = g2; x.fillRect(0, 0, w, h); });
  for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, color: 0xcff8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
    m.geometry.translate(0, -.5, 0); m.userData = { ox: rw(-70, 70), oz: rw(-70, 70), w: rw(3, 9), ph: rw(0, 6), h: rw(70, 120) }; m.visible = false; scene.add(m); rays.push(m); }
}
let nRays = 8;
function updRays(t) {
  const cx = camera.position.x, cz = camera.position.z, depthK = clamp(1 + camera.position.y / 80, 0, 1);
  rays.forEach((m, i) => { const u = m.userData; m.visible = i < nRays && depthK > .02; if (!m.visible) return;
    let x = u.ox + Math.sin(t * .05 + u.ph) * 6, z = u.oz; // wrap around camera
    const rx = ((x - cx) % 140 + 210) % 140 - 70, rz = ((z - cz) % 140 + 210) % 140 - 70;
    m.position.set(cx + rx, 0, cz + rz); m.scale.set(u.w, u.h, 1); m.rotation.set(0, Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z), .18);
    m.material.opacity = (.07 + .05 * Math.sin(t * .6 + u.ph)) * depthK; });
}
// ambient bubbles + marine snow
const BUBN = 420; let nBub = 220, bubM = null; const bubs = [];
const VENTS = []; for (let i = 0; i < 14; i++) { const x = rw(-W + 20, W - 20), z = rw(-W + 20, W - 20); VENTS.push([x, seabed(x, z), z]); }
function buildBubbles() {
  bubM = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdffaff, transparent: true, opacity: .45, depthWrite: false }), BUBN); bubM.frustumCulled = false; scene.add(bubM);
  for (let i = 0; i < BUBN; i++) bubs.push({ p: new THREE.Vector3(0, -999, 0), s: .1, v: 2, ph: rw(0, 6) });
}
function resetBub(b, i) { const c = camera.position; if (i % 3 === 0) { const v = VENTS[i % VENTS.length]; b.p.set(v[0] + rw(-1.5, 1.5), v[1], v[2] + rw(-1.5, 1.5)); b.s = rw(.12, .45); }
  else { b.p.set(c.x + rw(-45, 45), c.y + rw(-30, 10), c.z + rw(-45, 45)); b.s = rw(.05, .2); } b.v = rw(1.5, 4); }
function updBubbles(dt) {
  if (!bubM) return; const c = camera.position, t = UT.value;
  for (let i = 0; i < nBub; i++) { const b = bubs[i]; b.p.y += b.v * dt; b.p.x += Math.sin(t * 2 + b.ph) * dt * .4;
    if (b.p.y > -.3 || Math.abs(b.p.x - c.x) > 80 || Math.abs(b.p.z - c.z) > 80 || b.p.y < c.y - 60) resetBub(b, i);
    dummy.position.copy(b.p); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(b.s * (1 + .15 * Math.sin(t * 6 + b.ph))); dummy.updateMatrix(); bubM.setMatrixAt(i, dummy.matrix); }
  bubM.count = nBub; bubM.instanceMatrix.needsUpdate = true;
}
let snow = null;
function buildSnow() { const N = 1400, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3); for (let i = 0; i < N; i++) { p[i * 3] = rw(-60, 60); p[i * 3 + 1] = rw(-40, 40); p[i * 3 + 2] = rw(-60, 60); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfefff, size: .18, transparent: true, opacity: .55, depthWrite: false })); snow.frustumCulled = false; scene.add(snow); }
function updSnow() { if (!snow) return; const c = camera.position; snow.position.set(Math.floor(c.x / 120) * 120, Math.floor(c.y / 80) * 80, Math.floor(c.z / 120) * 120); snow.rotation.y = UT.value * .01; }
// water color / fog by camera depth
const wc = new THREE.Color();
function updWater() {
  const y = camera.position.y, d = -y;
  if (d < 25) wc.copy(WCOL.top).lerp(WCOL.mid, sstep(0, 25, d)); else if (d < 65) wc.copy(WCOL.mid).lerp(WCOL.deep, sstep(25, 65, d)); else wc.copy(WCOL.deep).lerp(WCOL.abyss, sstep(65, 105, d));
  if (G.alert) wc.lerp(WCOL.gold, .25 * (G.alertK || 0));
  scene.fog.color.copy(wc); scene.background.copy(wc);
  const base = G.fogD || .012; scene.fog.density = base * (1 + sstep(40, 100, d) * .35);
  hemi.intensity = 1.7 * (1 - .65 * sstep(10, 100, d)) + .25; sun.intensity = 2.1 * (1 - .9 * sstep(5, 90, d));
  if (causM) causM.material.uniforms.uFogD.value = scene.fog.density;
  if (surfM) surfM.material.uniforms.uCam.value.copy(camera.position);
}
