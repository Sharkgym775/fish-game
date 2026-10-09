function applyTexts() { document.querySelectorAll('[data-t]').forEach(el => { const v = L[el.dataset.t]; if (typeof v === 'string') el.innerHTML = v; }); document.querySelectorAll('[data-ph]').forEach(el => el.placeholder = L[el.dataset.ph]); document.documentElement.lang = L._lang; }
applyTexts();
{ const [a, ...b] = TITRE.split(' '); const lg = document.querySelector('.logo'); if (lg) { lg.querySelector('b').textContent = a; lg.querySelector('small').textContent = b.join(' ').toUpperCase(); } }
buildSeabed(); buildDecor(); buildRays(); buildBubbles(); buildSnow(); buildJellies();
checkAch(); ensureRivals(); save();
G.pbr = S.gfx === 'ultra';
buildPopulation(1234, (GFX[S.gfx] || GFX.high).pop * .8); makePickups(4242);
window.__booted = true; applyDisp(); checkPortrait(); applyGfx(); renderTitle();
if (!S.acct) openAccount(true); else showScreen('sTitre');
requestAnimationFrame(frame);
window.__sff = { G, S: () => S, get Sv() { return S; }, L, Net, IN, PAD, padCands, STAGES, SPC, npcs, schools, pickups, jellies, startMatch, soloRoster, toMenu, save, exportCode, parseCode, applyGfx, applyDisp, hudEditOpen, hudEditClose, setPTab, openAccount, openGarage, emoteMe, toggleWheel, showLevelUp, checkAch, ACH, xpInfo, rollItem, addItem, damage, killFish, eatNPC, useSpecial, applyPick, startAlert, respawnFish, seabed, stageOf, fishGeo, curPR, get dynK() { return dynK; }, get VW() { return VW; }, get VH() { return VH; }, get emoModel() { return emoModel; }, sInd, soundInd, avPortrait, TITRE };
