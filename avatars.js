/* STIMM Tournament Ranking — original procedural low-poly neon avatars */
import * as THREE from 'three';

export const AV_OUTFIT = ['#1a1626', '#2b1d3d', '#3a0f1c', '#0f2433', '#262626', '#3d2a14', '#16301f', '#e8e8f0'];
export const AV_NEON = ['#ff2bd6', '#22e5ff', '#ff3b3b', '#9b5cff', '#39ff6a', '#ffb321', '#ff6a1f', '#ffffff'];
// id, default outfit, default neon, unlock achievement (or null)
export const AVATARS = [
  { id: 'chicken', a: '#3a0f1c', n: '#ff2bd6' },
  { id: 'shark', a: '#0f2433', n: '#22e5ff' },
  { id: 'teddy', a: '#2b1d3d', n: '#ff2bd6' },
  { id: 'operator', a: '#1a1626', n: '#ff3b3b' },
  { id: 'frost', a: '#262626', n: '#22e5ff' },
  { id: 'neko', a: '#2b1d3d', n: '#9b5cff' },
  { id: 'gamer', a: '#1a1626', n: '#ff3b3b' },
  { id: 'toxic', a: '#16301f', n: '#39ff6a', ach: 'level10' },
  { id: 'king', a: '#1a1626', n: '#ffb321', ach: 'first_win' },
  { id: 'ronin', a: '#3a0f1c', n: '#ff3b3b', ach: 'multi5' },
  { id: 'dog', a: '#0f2433', n: '#22e5ff', ach: 'kills100' },
  { id: 'snowman', a: '#e8e8f0', n: '#ff2bd6', ach: 'legendary' },
];
export const AVK = AVATARS.map(a => a.id);

const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
const dk2 = () => lam(0x4a2f1a);
const neonM = c => new THREE.MeshBasicMaterial({ color: c });
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const S = (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
const C = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const K = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);
function add(par, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); par.add(m); return m;
}
function heartShape(s) { const h = new THREE.Shape(); h.moveTo(0, -s); h.bezierCurveTo(s * 1.2, -s * .2, s * .9, s * .9, 0, s * .4); h.bezierCurveTo(-s * .9, s * .9, -s * 1.2, -s * .2, 0, -s); return new THREE.ShapeGeometry(h); }

/** Build an avatar bust. av = { id, a (outfit hex), n (neon hex) }. Returns THREE.Group with userData.anim(t). */
export function buildAvatar(av) {
  const def = AVATARS.find(x => x.id === (av && av.id)) || AVATARS[0];
  const id = def.id, oc = (av && av.a) || def.a, nc = (av && av.n) || def.n;
  const g = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(); g.add(body); body.add(head); head.position.y = 1.55; head.scale.setScalar(1.3);
  const outfit = lam(oc), outfit2 = lam(new THREE.Color(oc).multiplyScalar(.6)), neon = neonM(nc), black = lam(0x0b0b10), skin = lam(0xb98a6a), gold = lam(0xd9a632, { emissive: 0x3a2400 }), white = lam(0xf2f2f2);
  const eyes = [];
  // torso (hoodie/jacket)
  add(body, C(.5, .72, .95, 8), outfit, 0, .62, 0);
  add(body, S(.26, 8, 6), outfit, -.62, .98, 0, 0, 0, 0, 1, .8, 1); add(body, S(.26, 8, 6), outfit, .62, .98, 0, 0, 0, 0, 1, .8, 1);
  add(body, C(.17, .15, .8, 6), outfit2, -.72, .55, .05, 0, 0, .12); add(body, C(.17, .15, .8, 6), outfit2, .72, .55, .05, 0, 0, -.12);
  add(body, B(.06, .9, .02), neon, -.2, .62, .52, -.22); add(body, B(.06, .9, .02), neon, .2, .62, .52, -.22); // zipper neon stripes
  add(body, new THREE.TorusGeometry(.33, .035, 6, 18), neon, 0, 1.1, 0, Math.PI / 2); // neon collar
  add(body, C(.15, .17, .25, 6), skin, 0, 1.22, 0);
  const chain = () => add(body, new THREE.TorusGeometry(.3, .035, 5, 16, Math.PI), gold, 0, 1.04, .3, Math.PI * .62, 0, Math.PI);
  const visorBand = (y, w = .66, c = neon) => add(head, B(w, .12, .1), c, 0, y, .3);
  const humanHead = (col = skin) => add(head, S(.34, 10, 8), col, 0, 0, 0, 0, 0, 0, .92, 1.05, .95);
  const mask = c => add(head, S(.35, 10, 6), c || black, 0, -.17, .05, 0, 0, 0, .95, .55, 1);
  const glowEyes = (y = .04, c = neon, sp = .12) => { for (const s of [-1, 1]) eyes.push(add(head, B(.12, .05, .04), c, s * sp, y, .32)); };
  const hood = (c = outfit) => { add(head, S(.44, 10, 8), c, 0, .06, -.2, 0, 0, 0, 1, 1.08, 1.05); add(head, new THREE.TorusGeometry(.38, .03, 6, 18), neon, 0, .03, .14, 0, 0, 0, .95, 1.1, 1); };
  const headset = () => { add(head, new THREE.TorusGeometry(.38, .045, 6, 16, Math.PI), black, 0, .02, 0, 0, 0, 0); for (const s of [-1, 1]) { add(head, C(.13, .13, .1, 10), black, s * .38, 0, 0, 0, 0, Math.PI / 2); add(head, C(.09, .09, .11, 10), neon, s * .39, 0, 0, 0, 0, Math.PI / 2); } add(head, B(.03, .03, .25), black, -.3, -.15, .2, 0, .5); };
  switch (id) {
    case 'chicken': {
      const feather = lam(0xc0392b), feather2 = lam(0x8e5a2b);
      add(head, S(.36, 10, 8), feather2, 0, 0, 0, 0, 0, 0, 1, 1.1, 1); add(head, S(.3, 8, 6), feather, 0, -.18, .08);
      for (let i = 0; i < 4; i++) add(head, S(.1 - i * .01, 6, 5), lam(0xe3261a), 0, .38 - i * .03, .15 - i * .12, 0, 0, 0, .6, 1.4, 1);
      add(head, K(.1, .26, 6), lam(0xffb321), 0, -.08, .42, Math.PI / 2);
      add(head, S(.07, 6, 5), lam(0xe3261a), 0, -.26, .3, 0, 0, 0, .7, 1.4, .7);
      const pink = neonM(0xff4fd8); for (const s of [-1, 1]) { eyes.push(add(head, B(.22, .14, .04), pink, s * .14, .1, .34)); } add(head, B(.1, .03, .03), pink, 0, .13, .35);
      chain(); break; }
    case 'shark': {
      hood(outfit2); const sk = lam(0x6f8fa8), belly = lam(0xe8eef2);
      add(head, S(.34, 10, 8), sk, 0, .02, .05, 0, 0, 0, .95, .95, 1.25);
      add(head, S(.26, 8, 6), belly, 0, -.16, .2, 0, 0, 0, 1, .55, 1.15);
      add(head, K(.15, .4, 4), sk, 0, .44, -.05, -.25, 0, 0, .35, 1, 1.4);
      for (let i = 0; i < 7; i++) add(head, K(.03, .07, 4), white, -.18 + i * .06, -.1, .43 - Math.abs(i - 3) * .02, Math.PI);
      add(head, B(.36, .03, .08), black, 0, -.07, .4);
      glowEyes(.1, neon, .17); break; }
    case 'teddy': {
      const fur = lam(0xb07a45), fur2 = lam(0xe0b47a);
      add(head, S(.38, 10, 8), fur); for (const s of [-1, 1]) { add(head, S(.13, 8, 6), fur, s * .3, .3, -.02); add(head, S(.07, 6, 5), fur2, s * .3, .3, .06); }
      add(head, S(.17, 8, 6), fur2, 0, -.1, .3, 0, 0, 0, 1.1, .8, .8); add(head, S(.06, 6, 5), black, 0, -.04, .44);
      for (const s of [-1, 1]) eyes.push(add(head, S(.045, 6, 5), black, s * .13, .08, .33));
      add(head, B(.12, .12, .03), lam(0xff4fd8), .2, .2, .29, 0, 0, .3); add(head, B(.14, .02, .02), black, .2, .2, .31, 0, 0, -.5);
      const h = add(body, heartShape(.12), neon, 0, .72, .55, -.2); h.material.side = THREE.DoubleSide; break; }
    case 'operator': {
      hood(); add(head, S(.3, 10, 8), black, 0, -.02, .02, 0, 0, 0, .95, 1, .9); glowEyes(.06, neon, .11); chain(); break; }
    case 'frost': {
      humanHead(); const hair = lam(0xeef3ff);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; add(head, K(.11, .4, 5), hair, Math.sin(a) * .2, .3, Math.cos(a) * .18 - .04, Math.cos(a) * .6 - .2, 0, -Math.sin(a) * .7); }
      add(head, S(.34, 10, 6), hair, 0, .14, -.1, 0, 0, 0, .98, .8, 1);
      visorBand(.05, .7); eyes.push(head.children[head.children.length - 1]);
      add(body, B(.9, .25, .5), lam(0xd8dde8), 0, 1.05, -.05); break; }
    case 'neko': {
      hood(); humanHead(); mask(); headset();
      for (const s of [-1, 1]) { add(head, K(.13, .26, 4), outfit, s * .22, .42, 0, 0, 0, -s * .3); add(head, K(.07, .16, 4), neon, s * .22, .43, .04, 0, 0, -s * .3); }
      glowEyes(.07, neon, .12); break; }
    case 'toxic': {
      humanHead(); const hair = lam(0x2fd15a);
      add(head, S(.38, 10, 8), hair, 0, .1, -.13, 0, 0, 0, 1, 1, 1.05);
      for (const s of [-1, 1]) add(head, B(.16, .9, .22), hair, s * .3, -.4, -.05, 0, 0, s * .08);
      add(head, B(.6, .85, .18), hair, 0, -.4, -.25);
      mask(); glowEyes(.06, neon, .12);
      const h = add(body, heartShape(.16), neon, 0, .72, .55, -.2); h.material.side = THREE.DoubleSide; break; }
    case 'king': {
      humanHead(); add(head, S(.36, 10, 8), black, 0, .12, -.1, 0, 0, 0, 1, .85, 1); mask(); glowEyes(.06, neonM(0xff3b3b), .12);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; add(head, K(.06, .26, 4), neon, Math.sin(a) * .26, .42, Math.cos(a) * .26); }
      add(head, new THREE.TorusGeometry(.27, .03, 5, 18), neon, 0, .32, 0, Math.PI / 2);
      chain(); add(body, new THREE.TorusGeometry(.38, .05, 5, 16, Math.PI), gold, 0, 1.0, .32, Math.PI * .6, 0, Math.PI); break; }
    case 'ronin': {
      humanHead(); const hair = lam(0xc4281c);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add(head, K(.12, .34, 5), hair, Math.sin(a) * .22, .26, Math.cos(a) * .2 - .05, Math.cos(a) * .9, 0, -Math.sin(a) * .9); }
      add(head, S(.35, 10, 6), hair, 0, .14, -.1, 0, 0, 0, 1, .8, 1); mask(lam(0x5a0e0e)); glowEyes(.06, neon, .12);
      const sw = new THREE.Group(); sw.position.set(.1, .9, -.5); sw.rotation.z = .6; body.add(sw);
      add(sw, B(.07, 1.7, .02), lam(0xdfe6ee, { emissive: 0x222222 }), 0, .55, 0); add(sw, B(.05, 1.6, .025), neon, .04, .55, 0, 0, 0, 0, .3, 1, 1);
      add(sw, B(.25, .05, .1), gold, 0, -.32, 0); add(sw, C(.04, .04, .45, 6), black, 0, -.57, 0); break; }
    case 'dog': {
      const fur = lam(0xb5793f), fur2 = lam(0xf0d2a8), dk = lam(0x4a2a14);
      add(head, S(.36, 10, 8), fur, 0, 0, 0, 0, 0, 0, 1, 1, 1.02);
      add(head, S(.2, 8, 6), fur2, 0, -.12, .27, 0, 0, 0, 1.05, .78, 1.05); add(head, S(.06, 6, 5), black, 0, -.03, .47, 0, 0, 0, 1.3, 1, 1);
      add(head, S(.12, 8, 6), fur2, -.12, .12, .25, 0, 0, 0, 1, 1, .5);
      const ears = []; for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.set(s * .3, .2, -.02); head.add(e); add(e, B(.14, .42, .2), dk, s * .05, -.18, 0, 0, 0, s * .25); add(e, B(.03, .3, .02), neon, s * .06, -.16, .11, 0, 0, s * .25); ears.push(e); }
      g.userData.ears = ears;
      headset(); add(head, B(.5, .07, .12), neon, 0, .25, .25, -.35); // visor relevée
      for (const s of [-1, 1]) eyes.push(add(head, S(.05, 6, 5), black, s * .13, .08, .32));
      add(body, new THREE.TorusGeometry(.3, .05, 6, 16), neon, 0, 1.16, 0, Math.PI / 2); add(body, C(.08, .08, .03, 10), gold, 0, 1.0, .33, Math.PI / 2);
      break; }
    case 'snowman': {
      const snow = lam(0xf4f8ff, { emissive: 0x202838 });
      add(body, S(.8, 12, 10), snow, 0, .55, 0, 0, 0, 0, 1, .85, .9);
      for (let i = 0; i < 3; i++) add(body, S(.05, 6, 5), black, 0, .45 + i * .22, .7 - i * .03);
      add(head, S(.36, 12, 10), snow);
      add(head, K(.06, .32, 8), lam(0xff7a1f), 0, -.03, .46, Math.PI / 2);
      for (const s of [-1, 1]) eyes.push(add(head, S(.05, 6, 5), black, s * .12, .09, .32));
      const hat = new THREE.Group(); hat.position.set(0, .3, 0); hat.rotation.z = -.12; head.add(hat);
      add(hat, C(.36, .36, .04, 14), black, 0, 0, 0); add(hat, C(.24, .24, .42, 14), black, 0, .22, 0); add(hat, C(.245, .245, .07, 14), neon, 0, .06, 0);
      add(body, new THREE.TorusGeometry(.32, .08, 6, 16), neon, 0, 1.12, 0, Math.PI / 2); add(body, B(.16, .5, .05), neon, .2, .85, .35, -.2, 0, .15);
      for (const s of [-1, 1]) add(body, C(.03, .03, .8, 5), dk2(), s * .85, .9, 0, 0, 0, s * 1.0);
      break; }
    case 'gamer': default: {
      hood(); humanHead(); mask(); headset(); visorBand(.06, .6); eyes.push(head.children[head.children.length - 1]); break; }
  }
  addFace(g, head, eyes, id, neon, nc);
  g.userData.head = head; g.userData.body = body;
  g.userData.anim = t => {
    const f = g.userData.face(t);
    head.rotation.y = Math.sin(t * .7) * .28; head.rotation.x = Math.sin(t * 1.3) * .05; head.rotation.z = f.tilt + Math.sin(t * 40) * f.shake * .05;
    head.position.y = 1.55 + Math.sin(t * 2) * .02 + Math.abs(Math.sin(t * 18)) * f.shake * .02;
    body.scale.set(1 + Math.sin(t * 2) * .012, 1 + Math.sin(t * 2) * .02, 1);
    neon.color.set(nc).multiplyScalar(.9 + Math.sin(t * 4) * .25);
    if (g.userData.ears) g.userData.ears.forEach((e, i) => { e.rotation.x = Math.sin(t * 3 + i) * .18 - f.shake * .3; e.rotation.z = (i ? -1 : 1) * (.05 + Math.max(0, Math.sin(t * 1.7)) * .12); });
  };
  return g;
}
/** Dispose geometries/materials of an avatar group. */
export function disposeAvatar(g) { g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose && o.material.dispose(); } }); }

/* ---------- Expressive face rig & emotes ---------- */
export const EMOTES = ['suspicious', 'raised', 'smirk', 'disguise', 'starstruck', 'tongue', 'cool', 'kiss', 'laugh', 'party', 'rage', 'freezing', 'mindblown', 'huff', 'scream'];
export const EMOJI = { suspicious: '🧐', raised: '🤨', smirk: '😏', disguise: '🥸', starstruck: '🤩', tongue: '😝', cool: '😎', kiss: '😘', laugh: '😂', party: '🥳', rage: '🤬', freezing: '🥶', mindblown: '🤯', huff: '😤', scream: '😱' };
const FACE = { dog: { ey: .1, ez: .33, sp: .14, my: -.24, mz: .46, by: .21 }, snowman: { ey: .1, ez: .33, sp: .12, my: -.16, mz: .35, by: .21 }, chicken: { ey: .1, ez: .36, sp: .14, my: -.24, mz: .36, by: .26 }, shark: { ey: .1, ez: .4, sp: .17, my: -.07, mz: .45, by: .22 }, teddy: { ey: .08, ez: .35, sp: .13, my: -.2, mz: .38, by: .2 }, def: { ey: .06, ez: .33, sp: .12, my: -.17, mz: .4, by: .17 } };
// neutral params
const N0 = () => ({ bLy: 0, bRy: 0, bLr: 0, bRr: 0, eL: 1, eR: 1, curve: 0, open: 0, ow: 1, mRot: 0, tilt: 0, shake: 0, eW: 1 });
const EMO = {
  suspicious: { p: { bLy: -.03, bLr: -.25, bRy: .06, bRr: .15, eL: .45, eR: 1.15, curve: -.2, tilt: .18 }, props: ['monocle'] },
  raised: { p: { bLy: .07, bLr: .2, bRy: -.02, bRr: .15, eL: 1.2, eR: .8, curve: -.15, mRot: -.12, tilt: -.12 } },
  smirk: { p: { bLy: .02, bRy: -.01, bRr: .2, eL: .8, eR: .7, curve: .45, mRot: .3, tilt: .1 } },
  disguise: { p: { curve: .2 }, props: ['disguise'] },
  starstruck: { p: { bLy: .06, bRy: .06, curve: 1, open: .5, ow: 1.4 }, props: ['stars'], hideEyes: 1 },
  tongue: { p: { eL: .15, eR: 1.1, curve: .8, tilt: .15 }, props: ['tongue'] },
  cool: { p: { curve: .55, mRot: .12, tilt: -.06 }, props: ['shades'] },
  kiss: { p: { eL: 1, eR: .1, open: .35, ow: .5, curve: 0 }, props: ['heart'] },
  laugh: { p: { eL: .12, eR: .12, bLy: .04, bRy: .04, open: .9, ow: 1.5, shake: .5 }, props: ['tears'] },
  party: { p: { curve: 1, eL: .5, eR: .5, bLy: .04, bRy: .04, tilt: .15 }, props: ['hat'] },
  rage: { p: { bLy: -.04, bRy: -.04, bLr: -.55, bRr: .55, eL: .55, eR: .55, curve: -1, open: .3, ow: 1.4, shake: .9 }, props: ['angry'], red: 1 },
  freezing: { p: { bLy: .03, bRy: .03, bLr: .25, bRr: -.25, curve: -.4, shake: .35 }, props: ['ice'], chatter: 1 },
  mindblown: { p: { eW: 1.6, bLy: .09, bRy: .09, open: .7, ow: .8 }, props: ['blown'] },
  huff: { p: { bLy: -.03, bRy: -.03, bLr: -.4, bRr: .4, eL: .6, eR: .6, curve: -.5, tilt: -.05 }, props: ['steam'] },
  scream: { p: { eW: 1.7, bLy: .11, bRy: .11, bLr: .3, bRr: -.3, open: 1.3, ow: .9, shake: .6 } },
};
function star(r) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * .45 : r; i ? s.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); } return new THREE.ShapeGeometry(s); }
function addFace(g, head, eyes, id, neon, nc) {
  const F = FACE[id] || FACE.def, ds = THREE.DoubleSide;
  const dark = new THREE.MeshBasicMaterial({ color: id === 'operator' ? nc : 0x14080c }), mouthM = new THREE.MeshBasicMaterial({ color: nc });
  const yel = new THREE.MeshBasicMaterial({ color: 0xffd23f, side: ds }), pinkM = new THREE.MeshBasicMaterial({ color: 0xff5c9a, side: ds }), whiteT = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 });
  const blue = new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: .85 }), blk = lam(0x0a0a0a), gold = lam(0xd9a632, { emissive: 0x3a2400 });
  const bL = add(head, B(.15, .035, .03), dark, -F.sp, F.by, F.ez), bR = add(head, B(.15, .035, .03), dark, F.sp, F.by, F.ez);
  const mouth = new THREE.Group(); mouth.position.set(0, F.my, F.mz); head.add(mouth);
  const segs = [-1, 0, 1].map(i => add(mouth, B(.085, .024, .02), mouthM, i * .075, 0, 0));
  const ring = add(mouth, new THREE.TorusGeometry(.055, .018, 6, 14), mouthM); ring.visible = false;
  const P = {}; const grp = n => { const q = new THREE.Group(); q.visible = false; head.add(q); P[n] = q; return q; };
  let q = grp('monocle'); add(q, new THREE.TorusGeometry(.085, .015, 6, 18), gold, F.sp, F.ey, F.ez + .05); add(q, B(.01, .25, .01), gold, F.sp + .08, F.ey - .16, F.ez + .03, 0, 0, .3);
  q = grp('shades'); add(q, B(.5, .13, .04), blk, 0, F.ey, F.ez + .06); add(q, B(.5, .02, .045), neon, 0, F.ey + .065, F.ez + .06); for (const s of [-1, 1]) add(q, B(.04, .03, .3), blk, s * .26, F.ey + .03, F.ez - .1);
  q = grp('disguise'); for (const s of [-1, 1]) add(q, new THREE.TorusGeometry(.08, .018, 6, 14), blk, s * F.sp, F.ey, F.ez + .06); add(q, B(.08, .02, .02), blk, 0, F.ey, F.ez + .06);
  add(q, S(.08, 8, 6), lam(0xf0a080), 0, F.ey - .1, F.ez + .1, 0, 0, 0, 1, 1.2, 1); add(q, B(.26, .05, .04), lam(0x3b2414), 0, F.my + .07, F.mz + .03);
  q = grp('stars'); for (const s of [-1, 1]) add(q, star(.085), yel, s * F.sp, F.ey, F.ez + .05);
  q = grp('tongue'); add(q, B(.09, .14, .03), pinkM, 0, F.my - .07, F.mz + .02, -.3);
  q = grp('heart'); const hs = new THREE.Shape(); hs.moveTo(0, -.06); hs.bezierCurveTo(.07, -.01, .055, .055, 0, .025); hs.bezierCurveTo(-.055, .055, -.07, -.01, 0, -.06); add(q, new THREE.ShapeGeometry(hs), pinkM, .18, F.my + .05, F.mz + .05);
  q = grp('tears'); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(q, S(.03, 6, 4), blue, s * (F.sp + .1), F.ey - .05 - i * .07, F.ez - .02);
  q = grp('hat'); const hat = add(q, K(.16, .4, 10), new THREE.MeshLambertMaterial({ color: 0x9b5cff, emissive: 0x2a0a50 }), .1, .55, 0, 0, 0, -.35); add(hat, S(.05, 6, 5), yel, 0, .21, 0); add(hat, new THREE.TorusGeometry(.13, .02, 5, 14), yel, 0, -.08, 0, Math.PI / 2);
  q = grp('angry'); add(q, B(.1, .02, .02), new THREE.MeshBasicMaterial({ color: 0xff2020 }), .24, .3, .3, 0, 0, .7); add(q, B(.1, .02, .02), new THREE.MeshBasicMaterial({ color: 0xff2020 }), .24, .3, .3, 0, 0, -.7);
  q = grp('ice'); add(q, S(.47, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: .22, depthWrite: false }), 0, 0, 0); for (let i = 0; i < 5; i++) add(q, K(.025, .1, 4), blue, -.16 + i * .08, F.my - .08, F.mz - .02, Math.PI);
  q = grp('blown'); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; add(q, K(.06, .22, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff7a1f : 0xffd23f }), Math.sin(a) * .2, .45, Math.cos(a) * .2, Math.cos(a) * .7, 0, -Math.sin(a) * .7); } add(q, new THREE.TorusGeometry(.3, .05, 6, 16), whiteT, 0, .62, 0, Math.PI / 2);
  q = grp('steam'); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(q, S(.06, 6, 5), whiteT, s * (.42 + i * .05), .05 + i * .06, .05);
  const eyeBase = eyes.map(e => e.scale.clone());
  const cur = N0(); let emo = null, emoT = 0, lastT = 0, blinkT = 2;
  g.userData.emote = (name, dur = 2.8) => { emo = EMO[name] ? name : null; emoT = emo ? dur : 0; };
  g.userData.face = (t, idle = true) => {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t; if (emoT > 0) { emoT -= dt; if (emoT <= 0) emo = null; }
    const E = emo ? EMO[emo] : null, tg = Object.assign(N0(), E ? E.p : {}), k = 1 - Math.exp(-12 * dt);
    for (const key in cur) cur[key] += (tg[key] - cur[key]) * (dt ? k : 1);
    blinkT -= dt; const blink = !E && blinkT < .12 ? .1 : 1; if (blinkT <= 0) blinkT = 2 + Math.random() * 3;
    bL.position.y = F.by + cur.bLy; bR.position.y = F.by + cur.bRy; bL.rotation.z = cur.bLr; bR.rotation.z = cur.bRr;
    eyes.forEach((e, i) => { const sL = (e.position.x < 0 ? cur.eL : cur.eR) * blink; e.scale.set(eyeBase[i].x * cur.eW, eyeBase[i].y * sL * cur.eW, eyeBase[i].z); e.visible = !(E && E.hideEyes); });
    const op = E && E.chatter ? .25 + .25 * Math.sign(Math.sin(t * 30)) : cur.open;
    const isO = op > .15; ring.visible = isO; segs.forEach(s => s.visible = !isO);
    ring.scale.set(cur.ow * (.6 + op * .4), .4 + op * 1.1, 1);
    segs[0].position.y = segs[2].position.y = cur.curve * .03; segs[0].rotation.z = -cur.curve * .45; segs[2].rotation.z = cur.curve * .45; mouth.rotation.z = cur.mRot;
    for (const n in P) P[n].visible = !!(E && E.props && E.props.includes(n));
    if (P.heart.visible) { const c = P.heart.children[0]; c.position.y = F.my + .05 + ((t * .6) % 1) * .3; c.position.x = .18 + Math.sin(t * 5) * .03; }
    if (P.tears.visible) P.tears.children.forEach((c, i) => c.position.y = F.ey - .05 - ((t * 1.5 + (i % 3) * .33) % 1) * .3);
    if (P.steam.visible) P.steam.children.forEach((c, i) => { const f = (t * 1.2 + (i % 3) * .33) % 1; c.position.y = .05 + f * .35; c.scale.setScalar(.6 + f * 1.4); });
    if (P.blown.visible) { const f = Math.min(1, (2.8 - emoT) * 2); P.blown.scale.setScalar(.4 + f * .9); P.blown.children[P.blown.children.length - 1].scale.setScalar(1 + ((t * 2) % 1)); }
    if (P.angry.visible) P.angry.scale.setScalar(1 + Math.sin(t * 12) * .15);
    if (P.stars.visible) P.stars.children.forEach(c => c.rotation.z = t * 3);
    return cur;
  };
}
