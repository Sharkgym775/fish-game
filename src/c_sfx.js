/* ================== Son (WebAudio) ================== */
const SFX = (() => {
  let AC = null, master = null, nb = null, eng = null, engG = null, dest = null;
  function init() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = AC.createGain(); master.gain.value = S.son ? .55 : 0; master.connect(AC.destination);
    nb = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const ok = () => AC && S.son && AC.state === 'running';
  function noise(dur, type, f, vol, f2) {
    if (!ok()) return; const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = nb;
    const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || master); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }
  function tone(type, f1, f2, dur, vol, delay = 0) {
    if (!ok()) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type;
    o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + .02);
  }
  let lastMg = 0;
  return {
    init, get ctx() { return AC; },
    at(x, y, z, fn) {
      if (!ok()) return; let pn; try { pn = AC.createPanner(); pn.panningModel = 'equalpower'; pn.distanceModel = 'linear'; pn.rolloffFactor = 0; pn.refDistance = 1; pn.maxDistance = 1e4;
        if (pn.positionX) { pn.positionX.value = x; pn.positionY.value = y; pn.positionZ.value = z; } else pn.setPosition(x, y, z); pn.connect(master); } catch (e) { fn(); return; }
      dest = pn; try { fn(); } finally { dest = null; } setTimeout(() => { try { pn.disconnect(); } catch (e) { } }, 2500);
    },
    listen(cam) { if (!AC) return; const L = AC.listener, p = cam.position, f = cam.getWorldDirection(new THREE.Vector3());
      if (L.positionX) { const t = AC.currentTime; L.positionX.setValueAtTime(p.x, t); L.positionY.setValueAtTime(p.y, t); L.positionZ.setValueAtTime(p.z, t); L.forwardX.setValueAtTime(f.x, t); L.forwardY.setValueAtTime(f.y, t); L.forwardZ.setValueAtTime(f.z, t); L.upX.setValueAtTime(0, t); L.upY.setValueAtTime(1, t); L.upZ.setValueAtTime(0, t); }
      else { L.setPosition(p.x, p.y, p.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); } },
    setOn(v) { if (master) master.gain.value = v ? .55 : 0; if (!v) this.engine(0, false); },
    chomp(v = 1, big = 0) { if (!AC) return; const t = AC.currentTime; if (t - lastMg < .05) return; lastMg = t; noise(.09 + big * .08, 'lowpass', 900 - big * 300, .35 * v, 120); tone('square', 180 - big * 60, 60, .08 + big * .06, .09 * v); },
    gulp(v = 1) { tone('sine', 420, 90, .25, .22 * v); noise(.2, 'lowpass', 500, .3 * v, 80); },
    bubble(v = 1) { tone('sine', rand(500, 900), rand(1200, 1900), .09, .06 * v); },
    bite(v = 1) { noise(.07, 'bandpass', 1400, .2 * v); },
    boom(big = 1, v = 1) { noise(.5 + big * .4, 'lowpass', 600, .6 * v * Math.min(1.3, big), 50); tone('sine', 90, 30, .5 + big * .2, .4 * v); },
    pick() { tone('sine', 660, 1320, .12, .1); tone('triangle', 990, 0, .12, .08, .08); },
    hit(v = 1) { tone('square', 200, 80, .08, .08 * v); noise(.08, 'lowpass', 700, .25 * v); },
    zap() { noise(.25, 'highpass', 3000, .25); tone('sawtooth', 1600, 200, .25, .1); },
    onde() { tone('sine', 70, 25, .8, .5); noise(.6, 'lowpass', 400, .5, 60); },
    sonar() { [0, .35, .7].forEach((d, i) => tone('sine', 1500, 1480, .45, .09 / (i + 1), d)); },
    evolve() { [392, 523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f * 1.01, .3, .12, i * .09)); noise(.8, 'bandpass', 2400, .12); },
    clic() { tone('triangle', 520, 0, .05, .08); },
    bip(f = 660) { tone('square', f, 0, .12, .1); },
    go() { tone('square', 990, 0, .3, .12); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, 0, .25, .15, i * .12)); },
    lose() { [392, 330, 262].forEach((f, i) => tone('triangle', f, 0, .3, .14, i * .18)); },
    horn(t) { if (t === 'airhorn') { tone('sine', 300, 70, .6, .3); noise(.5, 'lowpass', 400, .4, 60); } else if (t === 'roar') { noise(.8, 'lowpass', 300, .6, 80); tone('sawtooth', 90, 55, .8, .2); } },
    siren(v = 1) { if (!ok()) return; [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, 0, .2, .1 * v, i * .12)); },
    levelUp() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone('square', f, 0, .18, .09, i * .08)); },
    engine(speed, on) { // underwater ambience: filtered noise bed + swim whoosh by speed
      if (!AC) return;
      if (!eng && on && S.son) { eng = AC.createBufferSource(); eng.buffer = nb; eng.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; engG = AC.createGain(); engG.gain.value = 0; eng.connect(f); f.connect(engG); engG.connect(master); eng.start(); eng._f = f; }
      if (!eng) return; const t = AC.currentTime;
      eng._f.frequency.setTargetAtTime(260 + Math.abs(speed) * 28, t, .2); engG.gain.setTargetAtTime(on && S.son ? .05 + Math.min(.12, Math.abs(speed) * .005) : 0, t, .2);
    },
  };
})();
const unlockAudio = () => SFX.init();
addEventListener('pointerdown', unlockAudio, true); addEventListener('touchend', unlockAudio, true); addEventListener('keydown', unlockAudio, true);
