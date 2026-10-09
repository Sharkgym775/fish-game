/* ================== Commandes ================== */
const IN = { jx: 0, jy: 0, fire: false, turbo: false, brake: false, wpnN: 0, specN: 0, cycN: 0, keys: new Set() };
(() => {
  const zone = $('zoneJoy'), joy = $('joy'), knob = joy.firstElementChild; let jid = null, ox = 0, oy = 0;
  zone.addEventListener('pointerdown', e => { if (jid !== null) return; jid = e.pointerId; ox = e.clientX; oy = e.clientY; const fixed = S.disp.joy === 'fixed';
    if (fixed) { const r = $('joyHint').getBoundingClientRect(); if (r.width) { ox = r.left + r.width / 2; oy = r.top + r.height / 2; } }
    joy.style.display = 'block'; joy.style.left = ox + 'px'; joy.style.top = (oy - zone.getBoundingClientRect().top) + 'px'; knob.style.transform = ''; if (!fixed) $('joyHint').style.display = 'none'; try { zone.setPointerCapture(jid); } catch (er) { } e.preventDefault(); if (fixed) move(e); });
  const move = e => { if (e.pointerId !== jid) return; let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy), R = 50 * (S.disp.bs / 100) * fitK(); if (d > R) { dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx / ((S.disp.bs / 100) * fitK())}px,${dy / ((S.disp.bs / 100) * fitK())}px)`; IN.jx = dx / R; IN.jy = dy / R; IN.touchT = performance.now(); };
  zone.addEventListener('pointermove', move);
  const end = e => { if (e.pointerId !== jid) return; jid = null; IN.jx = IN.jy = 0; joy.style.display = 'none'; };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
  const hold = (id, k) => { const el = $(id); const set = v => { IN[k] = v; el.classList.toggle('on', v); };
    el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (er) { } set(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => el.addEventListener(t, () => set(false))); };
  const tap = (id, k) => { const el = $(id); el.addEventListener('pointerdown', e => { e.preventDefault(); IN[k]++; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 120); }); };
  hold('bFeu', 'fire'); hold('bTurbo', 'turbo'); hold('bFrein', 'brake'); tap('bArme', 'wpnN'); tap('bSpec', 'specN');
  $('wep').addEventListener('pointerdown', e => { e.preventDefault(); IN.cycN++; SFX.clic(); });
  addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; const k = e.key.toLowerCase();
    if (!IN.keys.has(k)) { if (k === 'q' || k === 'e' || k === 'f') IN.specN++; if (k === 'r' || k === 'tab') IN.cycN++; if ((k === 'escape' || k === 'p') && (G.mode === 'play' || G.mode === 'countdown')) pauseGame(); }
    IN.keys.add(k); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) e.preventDefault(); });
  addEventListener('keyup', e => IN.keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => { IN.keys.clear(); IN.fire = IN.turbo = IN.brake = false; });
  document.addEventListener('gesturestart', e => e.preventDefault());
  if (!matchMedia('(pointer:coarse)').matches) document.body.classList.add('desk');
})();
function readInput(ct) {
  const K = IN.keys; const up = K.has('w') || K.has('arrowup') || K.has('z'), dn = K.has('s') || K.has('arrowdown'), lf = K.has('a') || K.has('arrowleft'), rt = K.has('d') || K.has('arrowright');
  let jx = IN.jx, jy = IN.jy; const m = Math.hypot(jx, jy), dz = S.ctl.dz / 100;
  if (m < dz) jx = jy = 0; else { const k = Math.min(1, (m - dz) / (1 - dz)) / m; jx *= k; jy *= k; }
  jx = clamp(Math.sign(jx) * Math.pow(Math.abs(jx), 1.3) * S.ctl.sens / 100, -1, 1); jy = clamp(Math.sign(jy) * Math.pow(Math.abs(jy), 1.2), -1, 1);
  IN.sx = (IN.sx || 0) + (jx - (IN.sx || 0)) * .35; IN.sy = (IN.sy || 0) + (jy - (IN.sy || 0)) * .35;
  if (Math.abs(IN.sx) < .01) IN.sx = 0; const sx = IN.sx, sy = IN.sy, inv = S.ctl.auto ? -1 : 1;
  ct.steer = rt ? 1 : lf ? -1 : sx; ct.pitch = up ? 1 : dn ? -1 : clamp(-sy * 1.15 * inv, -1, 1);
  ct.bite = IN.fire || K.has(' '); ct.boost = IN.turbo || K.has('shift'); ct.slow = IN.brake || K.has('x');
  if (PAD.on && PAD.used) { if (PAD.steer) ct.steer = PAD.steer; if (PAD.pitch) ct.pitch = PAD.pitch; ct.bite = ct.bite || PAD.bite; ct.boost = ct.boost || PAD.boost; ct.slow = ct.slow || PAD.slow; }
  ct.specN = IN.specN;
}
/* ================== Manette (Gamepad API) ================== */
const PAD = { on: false, used: false, id: '', prev: [], steer: 0, pitch: 0, bite: false, boost: false, slow: false, focus: null, navT: 0, navDir: '', wait: null };
const GLYPH = ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3', 'D↑', 'D↓', 'D←', 'D→', 'PS', 'Touchpad'];
const GLC = { 0: 'x', 1: 'o', 2: 's', 3: 't' };
const gl = i => `<span class="gl ${GLC[i] || ''}">${GLYPH[i] || 'B' + i}</span>`;
function padHelp() { const P = S.pad; $('padHelp').innerHTML = `L-stick: swim · ${gl(P.boost)} ${L.padAct.boost} · ${gl(P.slow)} ${L.padAct.slow} · ${gl(P.bite)} ${L.padAct.bite} · ${gl(P.special)} ${L.padAct.special} · ${gl(P.emote)} ${L.padAct.emote}`; }
function setPadUsed(v) { if (PAD.used === v) return; PAD.used = v; document.body.classList.toggle('pad', v); if (v) padHelp(); else { document.querySelectorAll('.padFocus').forEach(e => e.classList.remove('padFocus')); PAD.focus = null; } }
addEventListener('gamepadconnected', e => { PAD.on = true; PAD.id = e.gamepad.id; alertMsg(L.padConn); renderCtl(); });
addEventListener('gamepaddisconnected', () => { const any = [...(navigator.getGamepads ? navigator.getGamepads() : [])].some(g => g && g.connected); if (!any) { PAD.on = false; setPadUsed(false); alertMsg(L.padDisc); renderCtl(); } });
addEventListener('pointerdown', e => { if (e.pointerType === 'touch' || e.pointerType === 'mouse') setPadUsed(false); }, true);
function padDz(v, d = .16) { return Math.abs(v) < d ? 0 : Math.sign(v) * (Math.abs(v) - d) / (1 - d); }
function inGame() { return (G.mode === 'play' || G.mode === 'countdown') && !G.paused && !document.querySelector('.screen.on') && !document.body.classList.contains('hudEdit'); }
function pollPad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const g of gps) if (g && g.connected) { gp = g; break; }
  if (!gp) { PAD.steer = PAD.pitch = 0; PAD.bite = PAD.boost = PAD.slow = false; return; }
  if (!PAD.on) { PAD.on = true; PAD.id = gp.id; }
  const B = gp.buttons, bv = i => B[i] ? (typeof B[i] === 'object' ? B[i].value || (B[i].pressed ? 1 : 0) : +B[i]) : 0, cur = []; for (let i = 0; i < B.length; i++) cur[i] = bv(i) > .4;
  const ax = gp.axes || [], lx = ax[0] || 0, ly = ax[1] || 0;
  const prev = PAD.prev; const pr = i => cur[i] && !prev[i]; PAD.prev = cur;
  if (cur.some(x => x) || Math.abs(lx) > .4 || Math.abs(ly) > .4) setPadUsed(true);
  if (!PAD.used) return;
  const P = S.pad;
  if (PAD.wait) { const i = cur.findIndex((x, k) => x && pr(k)); if (i >= 0) padAssign(PAD.wait, i); return; }
  if ($('emoWheel').classList.contains('on')) { padWheel(lx, ly, pr); return; }
  if (inGame()) {
    PAD.steer = clamp(padDz(lx) * S.ctl.sens / 100, -1, 1); PAD.pitch = clamp(-padDz(ly) * (S.ctl.auto ? -1 : 1), -1, 1);
    PAD.boost = bv(P.boost) > .3 || (P.boost === 7 && cur[0]); PAD.slow = bv(P.slow) > .3; PAD.bite = !!(cur[P.bite] || (P.bite === 5 && cur[2]));
    if (pr(P.special) || (P.special === 4 && pr(3))) IN.specN++;
    if (pr(P.pause)) pauseGame(); if (pr(P.emote) || (P.emote === 17 && pr(8))) toggleWheel(true);
    return;
  }
  PAD.steer = PAD.pitch = 0; PAD.bite = PAD.boost = PAD.slow = false;
  // navigation menus
  const now = performance.now(); let dir = pr(12) ? 'u' : pr(13) ? 'd' : pr(14) ? 'l' : pr(15) ? 'r' : '';
  const sd = Math.abs(lx) > .6 || Math.abs(ly) > .6 ? (Math.abs(lx) > Math.abs(ly) ? (lx > 0 ? 'r' : 'l') : (ly > 0 ? 'd' : 'u')) : '';
  if (!dir && sd) { if (sd !== PAD.navDir) { dir = sd; PAD.navT = now + 380; } else if (now > PAD.navT) { dir = sd; PAD.navT = now + 140; } }
  PAD.navDir = sd;
  if (dir) padMove(dir);
  if (pr(0)) padConfirm(); else if (pr(1)) padBack(); else if (pr(P.pause) && G.paused && !G.ended) { const b = $('bReprendre'); if (b && b.offsetParent) b.click(); }
}
function padRoot() { if (document.body.classList.contains('hudEdit')) return $('hudEdit'); if ($('lvlUp').classList.contains('on')) return $('lvlUp'); return document.querySelector('.screen.on'); }
function padCands() { const r = padRoot(); if (!r) return []; return [...r.querySelectorAll('button,input,textarea,.vcard,.avb,.swb,.dc,[data-nav]')].filter(e => { if (e.disabled) return false; const b = e.getBoundingClientRect(); return b.width > 2 && b.height > 2 && e.offsetParent !== null; }); }
function padSetFocus(e) { document.querySelectorAll('.padFocus').forEach(x => x.classList.remove('padFocus')); PAD.focus = e; if (e) { e.classList.add('padFocus'); try { e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (er) { } } }
function padMove(d) {
  const cs = padCands(); if (!cs.length) return; let f = PAD.focus; if (!f || !cs.includes(f)) { padSetFocus(cs[0]); return; }
  if (f.type === 'range' && (d === 'l' || d === 'r')) { const st = +f.step || 1; f.value = +f.value + (d === 'r' ? st : -st); f.dispatchEvent(new Event('input')); SFX.clic(); return; }
  const a = f.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, V = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[d];
  let best = null, bs = 1e9; for (const e of cs) { if (e === f) continue; const b = e.getBoundingClientRect(), dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay, along = dx * V[0] + dy * V[1]; if (along < 4) continue; const orth = Math.abs(dx * V[1] - dy * V[0]); const sc = along + orth * 2.2; if (sc < bs) { bs = sc; best = e; } }
  if (best) { padSetFocus(best); SFX.clic(); }
}
function padConfirm() { const cs = padCands(); let f = PAD.focus; if (!f || !cs.includes(f)) { padSetFocus(cs[0]); return; } if (f.tagName === 'INPUT' && f.type !== 'range') { f.focus(); return; } f.click(); SFX.clic(); setTimeout(() => { const c2 = padCands(); if (!c2.includes(PAD.focus)) padSetFocus(c2.find(e => e.classList.contains('big')) || c2[0]); }, 60); }
function padBack() { const r = padRoot(); if (!r) return; if (r.id === 'hudEdit') { $('bHeDone').click(); return; } if (r.id === 'sPause') { $('bReprendre').click(); return; } if (r.id === 'lvlUp') { $('bLuOk').click(); return; }
  const b = [...r.querySelectorAll('button')].find(e => e.offsetParent !== null && (/^bRetour|Ret$|^bLnRetour|^bLnQuit|^bDraftMenu|^bMenu$/.test(e.id) || e.dataset.t === 'back')); if (b) { b.click(); SFX.clic(); setTimeout(() => padSetFocus(padCands()[0]), 60); } }
function padWheel(lx, ly, pr) { const bs = [...document.querySelectorAll('#emoWheel button[data-e]')]; if (!bs.length) return; let hl = bs.find(b => b.classList.contains('hl'));
  if (Math.hypot(lx, ly) > .5) { const a = Math.atan2(ly, lx), n = bs.length; let i = Math.round(((a + Math.PI / 2) / (Math.PI * 2)) * n); i = ((i % n) + n) % n; bs.forEach((b, k) => b.classList.toggle('hl', k === i)); hl = bs[i]; }
  if (pr(0) && hl) { emoteMe(hl.dataset.e, 'manual'); toggleWheel(false); } else if (pr(1) || pr(S.pad.emote)) toggleWheel(false); }
function padAssign(act, i) { const P = S.pad; for (const k in P) if (k !== act && P[k] === i) P[k] = P[act]; P[act] = i; PAD.wait = null; save(); renderCtl(); padHelp(); }
function renderCtl() {
  if (!$('padMap')) return; $('padStat').textContent = PAD.on ? L.padOn(PAD.id || 'gamepad') : L.padNone;
  $('padMap').innerHTML = Object.keys(L.padAct).map(k => `<span>${L.padAct[k]}</span><button data-act="${k}" class="${PAD.wait === k ? 'wait' : ''}">${PAD.wait === k ? L.padPress : gl(S.pad[k])}</button>`).join('');
  $('cDz').value = S.ctl.dz; $('oDz').textContent = S.ctl.dz + '%'; $('cSens').value = S.ctl.sens; $('oSens').textContent = S.ctl.sens + '%';
  document.querySelectorAll('#cAuto button').forEach(b => b.classList.toggle('sel', +b.dataset.v === S.ctl.auto));
}
$('padMap').addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (!b) return; PAD.wait = PAD.wait === b.dataset.act ? null : b.dataset.act; PAD.prev = PAD.prev.map(() => true); renderCtl(); });
$('bPadReset').onclick = () => { S.pad = PADDEF(); PAD.wait = null; save(); renderCtl(); padHelp(); };
$('cDz').addEventListener('input', () => { S.ctl.dz = +$('cDz').value; save(); renderCtl(); });
$('cSens').addEventListener('input', () => { S.ctl.sens = +$('cSens').value; save(); renderCtl(); });
$('cAuto').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.ctl.auto = +b.dataset.v; save(); renderCtl(); });
