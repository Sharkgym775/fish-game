/* STIMM Feeding Frenzy — 3D underwater eat-and-grow (three.js, procedural low-poly) */
import * as THREE from 'three';
import { AVATARS, AVK, AV_OUTFIT, AV_NEON, buildAvatar, disposeAvatar, EMOTES, EMOJI } from './avatars.js';
// ⬇️ Working title — change it here only (title screen, <title>, toasts all read this constant)
const TITRE = 'STIMM Feeding Frenzy';
const SAVE_KEY = 'stimm_fish_v1';
const SAVE_PREFIX = 'SFF1-';
const NET_PREFIX = 'stimmfish-room-';
const MAX_JOUEURS = 10;
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = a => a[Math.random() * a.length | 0];
const lerp = (a, b, k) => a + (b - a) * k;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
document.title = TITRE;
/* ================== Texts (every UI string) ================== */
const STR = {
  en: {
    _lang: 'en',
    tagline: 'Eat. Grow. Evolve. Rule the reef.',
    account: '👤 Profile', createAccount: 'Create your STIMM profile', editAccount: 'Your STIMM profile', accountSub: 'Pick your gamer tag, clan tag and the 3D avatar that represents you.', gamerTag: 'Gamer tag', clanTag: 'Clan tag', avatar: 'Avatar', outfitCol: 'Outfit color', neonCol: 'Neon color', saveProfile: 'Save profile', createBtn: 'Create account', needTag: 'Enter a gamer tag first.', avLockedBy: a => `🔒 Unlock: ${a}`, avReward: 'Avatar',
    avNames: { dog: 'Cyber Pup', snowman: 'Neon Snowman', chicken: 'Neon Rooster', shark: 'SharkGym', teddy: 'Teddy Bruiser', operator: 'Shadow Op', frost: 'Frost Visor', neko: 'Neko Static', gamer: 'Red Visor', toxic: 'Toxic Bloom', king: 'Crown Leader', ronin: 'Red Ronin' },
    emotes: 'Emotes', draft: 'Draft', draftBtn: 'Draft', draftSub: '', teamA: 'Team A', teamB: 'Team B', pool: 'Players', yourPick: '', picking: () => '', draftDone: '', captain: '', lastKills: '',
    play: 'Solo', online: 'Online', inventory: 'Inventory', stats: 'Stats', settings: 'Settings', back: 'Back',
    level: 'Level', lv: 'Lv', wave: 'Wave', win1: 'win', winN: 'wins',
    chooseVehicle: 'Choose your fish', paint: 'Evolution path', loadout: 'Gear', letsGo: 'Dive in!', confirm: 'Confirm', edit: 'Edit',
    speed: 'Speed', armor: 'Health', handling: 'Agility', special: 'Special', size: 'Size',
    unlockAt: n => `Unlocks at level ${n}`,
    totalXp: 'Total XP', bestWave: 'Best wave', wins: 'Wins', podiums: 'Podiums (top 3)', matches: 'Matches played', onlineMatches: 'Online matches', kills: 'Rivals eaten', bestKills: 'Most rivals eaten in a match', dmgDealt: 'Fish eaten', items: 'Items owned', bestSize: 'Biggest size', bestScore: 'Best score',
    pilotName: 'Gamer tag', namePh: 'Your name', soundOn: '🔊 Sound: on', soundOff: '🔇 Sound: off', graphics: 'Graphics quality',
    q_low: 'Low', q_medium: 'Medium', q_high: 'High', q_ultra: 'Ultra', gfxNote: 'High is recommended. Ultra = native resolution (DPR 3), animated caustics, volumetric god rays, glowing bioluminescence + bloom, more fish, kelp and bubbles, glossy PBR fish and soft shadows — dynamic resolution keeps it smooth; your phone may get warm.',
    general: 'General', display: 'Display', dispHud: 'HUD & controls', hudScale: 'HUD scale', btnSize: 'Button size', btnOpacity: 'Button opacity', edgeMargin: 'Edge margin', joystick: 'Joystick', joyFloat: 'Floating', joyFixed: 'Fixed', editHud: 'Edit HUD layout', resetHud: 'Reset layout', done: 'Done', on: 'On', off: 'Off',
    dispNote: 'Safe areas (Dynamic Island, home bar) are always respected; Edge margin adds extra padding. Edit layout: drag any HUD element, then tap Done.', editHudSub: 'Drag the outlined elements to move them.', dispView: 'View & performance', fov: 'Field of view', camDist: 'Camera distance', resScale: 'Resolution', dynRes: 'Dynamic res.', fpsCounter: 'FPS counter', dispDefaults: 'Restore display defaults',
    dispInfo: (w, h, d, r) => `Screen ${w}×${h} pt · DPR ${d} · rendering ${r}`,
    saveCode: 'Save code', saveCodeNote: 'Export a code to keep your progress safe or move it to another device. Paste a code and tap Import to restore it.',
    savePh: 'SFF1-…', exportBtn: 'Export', importBtn: 'Import', copied: '✅ Code copied!', copyManual: 'Code shown above: select it and copy it.',
    imported: (n, k) => `✅ Save restored: level ${n}, ${k} items.`,
    resetAll: 'Erase everything', resetConfirm: 'Tap again to erase', resetDone: 'Progress erased.',
    errPrefix: 'This code must start with ', errIncomplete: 'Incomplete code.', errInvalid: 'Invalid or badly copied code.', errUnreadable: 'Unreadable code.',
    pause: 'Paused', resume: 'Resume', quit: 'Quit match', pauseNote: 'Online match: the ocean keeps moving while paused!',
    victory: '🏆 Apex of the ocean!', destroyed: 'Eaten!', place: r => `${STR.en.ord(r)} place!`, ord: r => r + (r % 10 === 1 && r % 100 !== 11 ? 'st' : r % 10 === 2 && r % 100 !== 12 ? 'nd' : r % 10 === 3 && r % 100 !== 13 ? 'rd' : 'th'),
    onlineMatch: n => `Online match · ${n} fish`, waveCleared: w => `Wave ${w} cleared! The next ocean is hungrier.`, waveLost: (w, r, n) => `Wave ${w} · you finished ${STR.en.ord(r)} of ${n}`,
    rank: 'Rank', xpEarned: 'XP earned', loot: 'Loot:', results: 'Leaderboard', score: 'Score', fishEaten: 'Fish eaten', finalSize: 'Final size',
    nextWave: 'Next wave', retry: 'Try again', backLobby: 'Back to lobby', vehiclesBtn: 'Fish & skins', menu: 'Menu',
    levelUp: 'LEVEL UP!', rewards: 'Rewards', awesome: 'Awesome!', newVehicle: 'New skin:', newPaint: 'New skin:', pickInGarage: 'Pick it in Fish & skins',
    hp: 'HP', cdHint: 'Eat smaller fish · avoid bigger ones!', go: 'GO!', wrecked: 'EATEN!', wreckedBig: '😋 CHOMP!', respawning: 'Respawning smaller…',
    youKilled: n => `You ate ${n}`, killedYou: n => `${n} ate you`, eatenBy: n => `Eaten by a ${n}`, exploded: n => `${n} was eaten`, leftBot: n => `${n} left (bot takes over)`,
    fire: 'BITE', weapon: 'POWER', specialBtn: 'SPECIAL', turbo: 'BOOST', brake: 'SLOW', joyHint: 'Drag here<br>to swim',
    keysHelp: 'A/D or ←/→: turn · W/S or ↑/↓: rise/dive · Space: bite · Shift: boost · Q: special · T: emotes · Esc: pause',
    rotate: 'Rotate your phone', map: 'Ocean', controls: 'Controls', touchCtl: 'Touch controls', deadZone: 'Dead zone', sensitivity: 'Steering sensitivity', autoAccel: 'Invert dive', touchNote: 'Your fish always swims forward. Stick left/right turns, up/down rises or dives (or the opposite with Invert dive).', gamepad: 'Controller', padReset: 'Reset controller mapping', padNone: 'No controller detected. Pair a PS5 DualSense, Xbox or MFi controller over Bluetooth, then press any button.', padOn: id => `🎮 Connected: ${id}`, padConn: '🎮 Controller connected', padDisc: '🎮 Controller disconnected', padPress: 'Press…',
    padAct: { boost: 'Boost', slow: 'Slow down', bite: 'Bite / lunge', special: 'Special', pause: 'Pause', emote: 'Emote wheel' }, rotateSub: 'STIMM Feeding Frenzy plays in landscape',
    slotWeapon: 'Jaws', slotMod: 'Charm', empty: 'Empty', equip: 'Equip', recycle: 'Recycle', recycleConfirm: 'Tap again to recycle', noItems: 'No items yet. Win matches to earn loot!', itemsWord: 'items',
    gunDps: 'Bite', hpBonus: 'HP', speedBonus: 'Speed', invNote: 'Pick a slot, then tap an item and Equip. Loot drops after matches and level ups.',
    rarity: ['Common', 'Rare', 'Epic', 'Legendary'], gunType: 'Jaws', modType: 'Charm',
    jawDesc: (d, r, g) => `Bite damage ${d} · reach +${r}% · growth +${g}%`,
    onlineTitle: 'Online ocean', onlineIntro: 'Create a room and share the code, or join a friend\'s room. Up to 10 players, bots fill empty spots. Bigger fish eat smaller players!',
    createRoom: 'Create a room', join: 'Join', codePh: 'CODE', roomCode: 'Room code', totalVehicles: 'Fish players in the match', start: 'Start match', changeVehicle: 'Change skin', leave: 'Leave',
    waitingHost: 'Waiting for the host to start…', human: 'player', humans: 'players', vehicles: 'fish', bot: 'Bot', botFill: 'fills the spot', player: 'Player',
    connServer: 'Connecting to server…', errModule: 'Could not load the online module. Check your Internet connection.', giveCode: 'Share this code with your friends (up to 9). Empty spots are filled by bots.',
    enterCode: 'Enter the 4-character room code.', connecting: 'Connecting…', noAnswer: 'No answer. Check the code and try again.', connected: 'Connected! Waiting for the host to start the match.',
    roomNotFound: 'Room not found. Check the code.', roomFull: 'The room is full (10 players max).', roomBusy: 'A match is already running in this room. Try again in a moment.',
    hostLeft: 'The host left the match.', hostClosed: 'The host closed the room.', serverDown: 'Connection server unreachable. Try again in a moment.', connError: 'Connection error. Try again.',
    onlineNote: 'Works best on Wi-Fi. Some mobile networks block direct connections.',
    botNames: ['Bubbles', 'Finn', 'Chomper', 'Reef Rex', 'Gilly', 'Nemo-ish', 'Sushi', 'Big Blue', 'Razor', 'Tide', 'Krill Bill', 'Coral', 'Jaws Jr', 'Mako'],
    stages: { minnow: 'Minnow', piranha: 'Piranha', barracuda: 'Barracuda', shark: 'Shark', megalodon: 'Megalodon', whale: 'Blue Whale' },
    specs: { dart: ['Quick Dart', 'Burst of speed and 0.8 s of untouchable dodging.'], frenzy: ['Piranha Frenzy', '5 s: triple bite speed, longer reach, eat fish your own size.'], lunge: ['Spear Lunge', 'Huge forward lunge with double bite reach.'], sonar: ['Shark Sense', '8 s: radar range ×2 and +15 % speed.'], quake: ['Tail Quake', 'Shockwave that stuns nearby fish and bumps rivals.'], vacuum: ['Krill Vacuum', '3 s: sucks every smaller fish in front of you into your mouth.'] },
    npc: { krill: 'Krill', sardine: 'Sardine', clown: 'Clownfish', tang: 'Blue Tang', puffer: 'Pufferfish', snapper: 'Red Snapper', angler: 'Anglerfish', tuna: 'Tuna', ray: 'Manta Ray', reef: 'Reef Shark', orca: 'Orca', gold: 'Golden Fish' },
    zones: ['Sunlit Reef', 'Kelp Forest', 'Twilight Drop', 'Midnight Abyss'], depth: 'Depth', evolved: s => `Evolved into ${s}!`, nextStage: (s, p) => `next: ${s} ${p}%`, maxStage: 'Apex size', canEat: 'Edible', danger: 'Danger',
    jaws: { serrated: 'Serrated Jaws', crusher: 'Crusher Jaws', venom: 'Venom Fangs', vacuum: 'Vacuum Maw' },
    mods: {
      fins: ['Turbo Fins', v => `+${v}% swim speed`], scales: ['Armored Scales', v => `+${v}% max HP`], bubble: ['Bubble Gland', v => `+${v} max shield`],
      gills: ['Deep Gills', v => `+${v}% boost recharge`], lure: ['Glow Lure', v => `+${v}% magnet & bite reach`], belly: ['Big Belly', v => `+${v}% growth`], fang: ['Sharp Fang', v => `-${v}% special cooldown`],
    },
    skins: { classic: 'Natural', sharkgym: 'SharkGym Shark', reef: 'Reef Candy', tiger: 'Tiger Stripe', neon: 'STIMM Neon', gold: 'Solid Gold', ghost: 'Ghost Glass', lava: 'Lava Scale', abyss: 'Abyss Black', rainbow: 'Rainbow Pearl' },
    killGoal: () => 'Grow into a Blue Whale or top the score', myKills: 'Score', top3: 'Top 3', timeUp: "Time's up!", reachedGoal: n => `${n} became a Blue Whale!`,
    alert: '🔥 FEEDING FRENZY 🔥', alertSub: 'Golden fish ×3 score — final minute!', megaSpawn: '✨ Golden schools are swimming in!', deaths: 'Times eaten',
    tiers: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion'],
    casual: 'Casual', ranked: 'Ranked', rp: 'RP', rankPts: 'Rank points', rankedBoard: 'Ranked leaderboard (this device)', boardNote: 'Local leaderboard vs. rival fish. A worldwide leaderboard would need an online server.',
    tierUp: t => `Promoted to ${t}!`, tierDown: t => `Dropped to ${t}`, you: 'You', profile: 'Profile', modeLabel: 'Mode', rankedNote: 'Ranked: win rank points by finishing high, lose some by finishing low.',
    achievements: 'Achievements', achUnlocked: '🏆 Achievement unlocked!', reward: 'Reward', exclusive: 'Exclusive', equipped: 'Equipped', locked: 'Locked', unlocked: 'Unlocked',
    rwSkin: 'Fish skin', rwTrail: 'Bubble trail', rwHorn: 'Chomp sound', rwTitle: 'Title', none: 'None', achNote: 'Rewards here are exclusive: you can only get them from achievements.', achLock: 'Exclusive: unlock it in Achievements',
    rivalNames: ['Coral Queen', 'Deep Dave', 'Kelp Kara', 'Tidal Tom', 'Reef Rex', 'Mia Moray', 'Big Lou', 'Zed Squid', 'Jet Jackie', 'Bolt Benny', 'Rhea Ray', 'Max Mako', 'Sasha Shoal', 'Gus Grouper'],
    ach: {
      first_win: ['First Win', 'Win a match.'], kills100: ['Bottomless', 'Eat 300 fish in total.'], flawless: ['Untouchable', 'Win a match without being eaten.'],
      ranked10: ['Ranked Shark', 'Win 10 ranked matches.'], legendary: ['Jackpot', 'Find a Legendary item.'], wave10: ['Deep Diver', 'Reach wave 10 in solo.'],
      online5: ['School Spirit', 'Play 5 online matches.'], multi5: ['Cannibal', 'Eat 5 rival players in a single match.'], level10: ['Veteran', 'Reach level 10.'],
      special50: ['Special Agent', 'Use your special 50 times.'], champion: ['Apex Predator', 'Reach Champion rank (2000 RP).'], mega: ['Prehistoric', 'Evolve into a Megalodon.'], whale: ['Leviathan', 'Evolve into a Blue Whale.'],
    },
    titles: { untouchable: 'Untouchable', diver: 'Deep Diver', veteran: 'Veteran', apex: 'Apex Predator', leviathan: 'Leviathan' },
    trails: { inferno: 'Lava Bubbles', electric: 'Violet Storm', rainbow: 'Rainbow' },
    horns: { airhorn: 'Big Gulp', roar: 'Mega Roar' },
    picks: { speed: 'Speed Boost', magnet: 'Fish Magnet', bubble: 'Shield Bubble', frenzy: 'Frenzy ×2', heal: 'Kelp Snack', pearl: 'Golden Pearl' },
    health: 'Health', shield: 'Shield', baseW: 'base', gearW: 'gear', shBonus: 'Shield', regenNote: 'Shield absorbs bites first and regenerates after 3.5 s without hits. Stage evolutions raise both.',
  },
};
const L = STR.en;

/* ================== Data ================== */
// Player evolution stages (size = cube root of mass)
const STAGES = [
  { id: 'minnow', size: 1, shape: 'slim', col: 0x8fb8d8, bel: 0xf0f6ff, fin: 0x5f8fb8, speed: 10.5, turn: 2.7, hp: 60, spec: 'dart', cd: 6, ic: '🐟' },
  { id: 'piranha', size: 1.5, shape: 'piranha', col: 0x6b7a88, bel: 0xe0403a, fin: 0x3e4a55, speed: 11.5, turn: 2.5, hp: 80, spec: 'frenzy', cd: 10, ic: '🦷' },
  { id: 'barracuda', size: 2.2, shape: 'barracuda', col: 0x9aa9b8, bel: 0xeef3f7, fin: 0x55606b, speed: 13, turn: 2.3, hp: 100, spec: 'lunge', cd: 7, ic: '🗡️' },
  { id: 'shark', size: 3.2, shape: 'shark', col: 0x5b7c99, bel: 0xf2f4f7, fin: 0x46627c, speed: 13.5, turn: 2.05, hp: 130, spec: 'sonar', cd: 12, ic: '🦈' },
  { id: 'megalodon', size: 4.6, shape: 'mega', col: 0x4d5e70, bel: 0xc9ced6, fin: 0x1b2229, speed: 13, turn: 1.8, hp: 170, spec: 'quake', cd: 11, ic: '🦖' },
  { id: 'whale', size: 6.5, shape: 'whale', col: 0x2a4f7a, bel: 0xc8d8e8, fin: 0x1f3b5c, speed: 12, turn: 1.55, hp: 220, spec: 'vacuum', cd: 12, ic: '🐋' },
];
const stageOf = size => { let s = 0; STAGES.forEach((x, i) => { if (size >= x.size - 1e-6) s = i; }); return s; };
const WIN_SIZE = STAGES[5].size;
// AI fish species (NPC). zone: 0 reef, 1 kelp, 2 twilight, 3 abyss
const SPC = {
  krill: { base: .4, col: 0xff8fa3, bel: 0xffd6de, fin: 0xff6f8a, shape: 'krill', school: [10, 16], zones: [0, 1, 2, 3], sp: 4.5 },
  sardine: { base: .62, col: 0x86aed0, bel: 0xeef6fc, fin: 0x5a7fa0, shape: 'slim', school: [10, 16], zones: [0, 1, 2], sp: 7 },
  clown: { base: .82, col: 0xff7a1f, bel: 0xffffff, fin: 0x1a1a1a, shape: 'round', stripes: 1, school: [4, 7], zones: [0], sp: 5.5 },
  tang: { base: 1.15, col: 0x2a6cff, bel: 0xffd21f, fin: 0x0a2a6b, shape: 'disc', school: [5, 8], zones: [0, 1], sp: 6.5 },
  puffer: { base: 1.45, col: 0xf2d16b, bel: 0xfff6d8, fin: 0xc79a2a, shape: 'puff', school: [1, 3], zones: [0, 1], sp: 4 },
  snapper: { base: 2.0, col: 0xd9483b, bel: 0xffc0a8, fin: 0xa02a20, shape: 'fish', school: [4, 7], zones: [1, 2], sp: 7.5 },
  angler: { base: 2.5, col: 0x2a2233, bel: 0x4a3a55, fin: 0x1a1420, shape: 'angler', glow: 0x7ef2ff, school: [1, 2], zones: [3], sp: 6, pred: 1 },
  tuna: { base: 3.1, col: 0x23395d, bel: 0xdfe6ee, fin: 0xffc21f, shape: 'fish', school: [3, 6], zones: [1, 2], sp: 10 },
  ray: { base: 4.6, col: 0x2e3f52, bel: 0xe8eef4, fin: 0x22303f, shape: 'ray', school: [1, 2], zones: [1, 2, 3], sp: 6 },
  reef: { base: 5.6, col: 0x6f7f8f, bel: 0xeef2f5, fin: 0x55626e, shape: 'shark', school: [1, 1], zones: [2, 3], sp: 10.5, pred: 1 },
  orca: { base: 8.6, col: 0x111318, bel: 0xffffff, fin: 0x111318, shape: 'orca', school: [1, 1], zones: [3], sp: 10, pred: 1 },
  gold: { base: .95, col: 0xffc21f, bel: 0xfff2a8, fin: 0xff9a1f, shape: 'round', glow: 0xffd84d, school: [6, 9], zones: [0, 1, 2], sp: 6.5, gold: 1 },
};
const SPK = Object.keys(SPC);
// population recipe: [species, schools]
const POP = [['krill', 3], ['sardine', 3], ['clown', 3], ['tang', 3], ['puffer', 3], ['snapper', 3], ['angler', 3], ['tuna', 3], ['ray', 3], ['reef', 3], ['orca', 2]];
const RAR = [
  { coul: '#b8c4d0', m: 1, cad: 0 },
  { coul: '#3fa9ff', m: 1.15, cad: .05 },
  { coul: '#b06cff', m: 1.32, cad: .1 },
  { coul: '#ffb21f', m: 1.55, cad: .15 },
];
const JAWS = {
  serrated: { ic: '🦷', dmg: 1, reach: 0, grow: 0 },
  crusher: { ic: '🪨', dmg: 1.3, reach: 0, grow: 0 },
  venom: { ic: '🧪', dmg: 1.1, reach: 6, grow: 3 },
  vacuum: { ic: '🌀', dmg: .9, reach: 14, grow: 0 },
};
const MODS = {
  fins: { ic: '🪽', val: [4, 7, 10, 14], k: 'vit' },
  scales: { ic: '🛡️', val: [10, 18, 26, 36], k: 'hp' },
  bubble: { ic: '🫧', val: [12, 20, 32, 48], k: 'sh' },
  gills: { ic: '🌬️', val: [12, 20, 30, 45], k: 'gills' },
  lure: { ic: '💡', val: [8, 14, 20, 28], k: 'lure' },
  belly: { ic: '🍽️', val: [4, 7, 10, 14], k: 'belly' },
  fang: { ic: '🗡️', val: [8, 14, 20, 28], k: 'cd' },
};
const W_SH = [0, 5, 10, 18];
const RADAR_RANGE = 70;
const PK_RAR = [0, 0, 1, 0, 2, 1, 0, 3];
const PK_AMT = { heal: [.35, .5, .7, 1], bubble: [1.35, 1.5, 1.65, 1.85] };
const SKINS = [
  { id: 'classic', niv: 1 },
  { id: 'sharkgym', niv: 2, c: 0x5b7c99, b: 0xf2f4f7, f: 0x22e5ff, sg: 1 },
  { id: 'reef', niv: 3, c: 0xff7a1f, b: 0xffffff, f: 0x1a1a1a, st: 1 },
  { id: 'tiger', niv: 5, c: 0x9a7a3a, b: 0xf0e2c0, f: 0x3a2a10, st: 1 },
  { id: 'neon', niv: 7, c: 0x101827, b: 0x2a1040, f: 0xff2bd6, em: 1 },
  { id: 'rainbow', niv: 10, c: 0xffffff, b: 0xffffff, f: 0xffffff, rb: 1 },
  { id: 'gold', niv: 999, ach: 'first_win', c: 0xd4a017, b: 0xffe680, f: 0x8a5a00, metal: 1 },
  { id: 'ghost', niv: 999, ach: 'ranked10', c: 0x9fe8ff, b: 0xe8fbff, f: 0x22e5ff, ghost: 1 },
  { id: 'lava', niv: 999, ach: 'kills100', c: 0x1b1b1f, b: 0x3a1a10, f: 0xff5a1f, em: 1 },
  { id: 'abyss', niv: 999, ach: 'mega', c: 0x0b0b0f, b: 0x22222a, f: 0xd61f1f, em: 1 },
];
const TIERS = [{ min: 0, coul: '#cd7f32', ic: '🥉' }, { min: 200, coul: '#c0c8d0', ic: '🥈' }, { min: 500, coul: '#ffc21f', ic: '🥇' }, { min: 900, coul: '#5fe0d0', ic: '💠' }, { min: 1400, coul: '#7ab8ff', ic: '💎' }, { min: 2000, coul: '#ff4d6d', ic: '👑' }];
const tierOf = rp => { let t = 0; TIERS.forEach((x, i) => { if (rp >= x.min) t = i; }); return t; };
const TRAILS = { '': [0xbfefff, 0xffffff, 0x9fe8ff], inferno: [0xff5a1f, 0xffc21f, 0xe3261a], electric: [0x7b2cff, 0xd0a0ff, 0xffffff], rainbow: [0xff3b3b, 0xffc21f, 0x7ef29d, 0x2fa8ff, 0xb06cff] };
const ACH = [
  { id: 'first_win', ic: '🏆', goal: 1, val: () => S.victoires, rw: { t: 'skin', id: 'gold' }, av: 'king' },
  { id: 'kills100', ic: '🍽️', goal: 300, val: () => S.eaten, rw: { t: 'skin', id: 'lava' }, av: 'dog' },
  { id: 'flawless', ic: '🛡️', goal: 1, val: () => S.flawless, rw: { t: 'title', id: 'untouchable' } },
  { id: 'ranked10', ic: '🥇', goal: 10, val: () => S.rankedWins, rw: { t: 'skin', id: 'ghost' } },
  { id: 'legendary', ic: '🌟', goal: 1, val: () => S.legend, rw: { t: 'horn', id: 'airhorn' }, av: 'snowman' },
  { id: 'wave10', ic: '🌊', goal: 10, val: () => S.meilleureVague, rw: { t: 'trail', id: 'inferno' } },
  { id: 'online5', ic: '🌐', goal: 5, val: () => S.enLigne, rw: { t: 'trail', id: 'electric' } },
  { id: 'multi5', ic: '🔥', goal: 5, val: () => S.meilleursKills, rw: { t: 'horn', id: 'roar' }, av: 'ronin' },
  { id: 'level10', ic: '⭐', goal: 10, val: () => xpInfo().n, rw: { t: 'title', id: 'veteran' }, av: 'toxic' },
  { id: 'special50', ic: '🦈', goal: 50, val: () => S.specials, rw: { t: 'trail', id: 'rainbow' } },
  { id: 'champion', ic: '👑', goal: 2000, val: () => S.rpMax, rw: { t: 'title', id: 'apex' } },
  { id: 'mega', ic: '🦖', goal: 5, val: () => S.maxStage + 1, rw: { t: 'skin', id: 'abyss' } },
  { id: 'whale', ic: '🐋', goal: 6, val: () => S.maxStage + 1, rw: { t: 'title', id: 'leviathan' } },
];
const PICK = {
  speed: { ic: '⚡', coul: 0x22e5ff },
  magnet: { ic: '🧲', coul: 0xff3b5c },
  bubble: { ic: '🫧', coul: 0x9fe8ff },
  frenzy: { ic: '🔥', coul: 0xff8a1f },
  heal: { ic: '💚', coul: 0x35e06a },
  pearl: { ic: '🦪', coul: 0xfff2c0 },
};
const PKK = Object.keys(PICK);
const MATCH_TIME = 360, ALERT_AT = 300;
const BOT_NOMS = L.botNames;
STAGES.forEach(s => { s.nom = L.stages[s.id]; s.specNom = L.specs[s.spec][0]; s.specDesc = L.specs[s.spec][1]; });
for (const k in SPC) SPC[k].nom = L.npc[k];
RAR.forEach((r, i) => r.nom = L.rarity[i]); TIERS.forEach((t, i) => t.nom = L.tiers[i]);
for (const k in JAWS) JAWS[k].nom = L.jaws[k];
for (const k in MODS) { MODS[k].nom = L.mods[k][0]; MODS[k].d = L.mods[k][1]; }
SKINS.forEach(s => s.nom = L.skins[s.id]);
for (const k in PICK) PICK[k].nom = L.picks[k];

/* ================== Save ================== */
const DEF = () => ({ v: 1, pseudo: '', xp: 0, niveau: 1, vague: 1, meilleureVague: 1, victoires: 0, parties: 0, kills: 0, eaten: 0, meilleursKills: 0, podiums: 0, bestSize: 1, bestScore: 0, maxStage: 0,
  son: true, gfx: 'high', lang: 'en', skin: 'classic', items: [{ u: 1, t: 'arme', b: 'serrated', r: 0 }], uid: 2, equip: { arme: 1, mods: [0, 0] }, enLigne: 0, rp: 0, rpMax: 0, rankedWins: 0, rankedMatches: 0, flawless: 0, legend: 0, specials: 0, ach: {}, style: { trail: '', horn: '', title: '' }, rivals: null, ranked: false, clan: 'STIMM', av: { id: 'shark', a: '', n: '' }, acct: 0, disp: DDEF(), pad: PADDEF(), ctl: { dz: 18, sens: 100, auto: 0 } });
function PADDEF() { return { boost: 7, slow: 6, bite: 5, special: 4, pause: 9, emote: 17 }; }
function sanPad(o) { const d = PADDEF(); if (o && typeof o === 'object') for (const k in d) { const v = Math.round(+o[k]); if (isFinite(v) && v >= 0 && v < 20) d[k] = v; } return d; }
function sanCtl(o) { o = o && typeof o === 'object' ? o : {}; const n = (v, a, b, def) => { v = Math.round(+v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : def; }; return { dz: n(o.dz, 5, 40, 18), sens: n(o.sens, 50, 160, 100), auto: o.auto ? 1 : 0 }; }
function DDEF() { return { hs: 100, bs: 100, bo: 90, edge: 0, joy: 'float', fov: 0, cam: 100, res: 100, dyn: 1, fps: 0, lay: {} }; }
const HUDW = { moi: 1, top3: 1, wep: 1, info: 1, pauseB: 1, feed: 1, emoBox: 1, bEmo: 1, mini: 1, vitals: 1, btns: 1, joyHint: 1 };
function sanDisp(o) { const d = DDEF(); if (!o || typeof o !== 'object') return d; const n = (v, a, b, def) => { v = Math.round(+v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : def; };
  d.hs = n(o.hs, 60, 140, 100); d.bs = n(o.bs, 60, 150, 100); d.bo = n(o.bo, 25, 100, 90); d.edge = n(o.edge, 0, 48, 0); d.joy = o.joy === 'fixed' ? 'fixed' : 'float'; d.fov = n(o.fov, -12, 20, 0); d.cam = n(o.cam, 70, 150, 100); d.res = n(o.res, 50, 100, 100); d.dyn = o.dyn === 0 ? 0 : 1; d.fps = o.fps ? 1 : 0;
  if (o.lay && typeof o.lay === 'object') for (const k in HUDW) { const v = o.lay[k]; if (Array.isArray(v)) d.lay[k] = [n(v[0], -3000, 3000, 0), n(v[1], -3000, 3000, 0)]; } return d; }
const HEX = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '';
const sanAv = o => { o = o && typeof o === 'object' ? o : {}; return { id: AVK.includes(o.id) ? o.id : 'operator', a: HEX(o.a), n: HEX(o.n) }; };
const sanClan = v => String(v == null ? 'STIMM' : v).replace(/[^A-Za-z0-9_]/g, '').toUpperCase().slice(0, 5);
let S = load();
function sanitize(o) {
  const d = DEF(); if (!o || typeof o !== 'object') throw new Error('format');
  const num = (v, max) => { v = Math.floor(+v); if (!isFinite(v) || v < 0) return 0; return Math.min(v, max); };
  d.pseudo = String(o.pseudo || '').replace(/[<>]/g, '').slice(0, 12);
  for (const k of ['xp', 'victoires', 'parties', 'kills', 'eaten', 'meilleursKills', 'podiums', 'bestScore', 'enLigne', 'rp', 'rpMax', 'rankedWins', 'rankedMatches', 'flawless', 'legend', 'specials']) d[k] = num(o[k], 1e10);
  d.bestSize = clamp(+o.bestSize || 1, 1, 99); d.maxStage = Math.min(5, num(o.maxStage, 5));
  d.niveau = Math.max(1, num(o.niveau, 999)); d.vague = Math.max(1, num(o.vague, 999)); d.meilleureVague = Math.max(d.vague, num(o.meilleureVague, 999));
  d.ranked = !!o.ranked; d.clan = sanClan(o.clan); d.av = sanAv(o.av || { id: 'shark' }); d.acct = o.acct ? 1 : 0; d.disp = sanDisp(o.disp); d.pad = sanPad(o.pad); d.ctl = sanCtl(o.ctl);
  if (o.ach && typeof o.ach === 'object') for (const a of ACH) if (o.ach[a.id]) d.ach[a.id] = 1;
  if (o.style && typeof o.style === 'object') { d.style.trail = TRAILS[o.style.trail] ? String(o.style.trail) : ''; d.style.horn = L.horns[o.style.horn] ? String(o.style.horn) : ''; d.style.title = L.titles[o.style.title] ? String(o.style.title) : ''; }
  if (Array.isArray(o.rivals)) d.rivals = o.rivals.slice(0, 20).filter(r => r && typeof r === 'object').map(r => ({ n: String(r.n || '?').replace(/[<>]/g, '').slice(0, 20), rp: num(r.rp, 99999) }));
  d.son = o.son !== false; d.gfx = ['low', 'medium', 'high', 'ultra'].includes(o.gfx) ? o.gfx : 'high'; d.lang = 'en';
  d.skin = SKINS.some(s => s.id === o.skin) ? o.skin : 'classic';
  if (Array.isArray(o.items)) {
    const seen = new Set(); d.items = [];
    for (const it of o.items.slice(0, 80)) {
      if (!it || typeof it !== 'object') continue; const u = num(it.u, 1e9); if (!u || seen.has(u)) continue;
      const t = it.t === 'mod' ? 'mod' : 'arme'; const b = String(it.b); if (t === 'arme' ? !JAWS[b] : !MODS[b]) continue;
      seen.add(u); d.items.push({ u, t, b, r: Math.min(3, num(it.r, 3)) });
    }
    if (!d.items.length) d.items = DEF().items;
  }
  d.uid = Math.max(num(o.uid, 1e9), ...d.items.map(i => i.u + 1));
  const has = (u, t) => d.items.some(i => i.u === u && i.t === t);
  if (o.equip && typeof o.equip === 'object') {
    const a = num(o.equip.arme, 1e9); d.equip.arme = has(a, 'arme') ? a : (d.items.find(i => i.t === 'arme') || {}).u || 0;
    const m = Array.isArray(o.equip.mods) ? o.equip.mods : []; d.equip.mods = [0, 1].map(i => { const u = num(m[i], 1e9); return has(u, 'mod') ? u : 0; });
    if (d.equip.mods[0] && d.equip.mods[0] === d.equip.mods[1]) d.equip.mods[1] = 0;
  } else d.equip.arme = (d.items.find(i => i.t === 'arme') || {}).u || 0;
  return d;
}
function load() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY)); return o ? sanitize(o) : DEF(); } catch (e) { return DEF(); } }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function hash32(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
function exportCode() { const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); return SAVE_PREFIX + b64 + '-' + hash32(b64); }
function parseCode(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (!code.startsWith(SAVE_PREFIX)) throw new Error(L.errPrefix + SAVE_PREFIX);
  const body = code.slice(SAVE_PREFIX.length), k = body.lastIndexOf('-'); if (k < 1) throw new Error(L.errIncomplete);
  const b64 = body.slice(0, k), h = body.slice(k + 1); if (hash32(b64) !== h) throw new Error(L.errInvalid);
  let o; try { o = JSON.parse(decodeURIComponent(escape(atob(b64)))); } catch (e) { throw new Error(L.errUnreadable); }
  return sanitize(o);
}
const pseudo = () => S.pseudo || L.player;
function checkAch() { const out = []; for (const a of ACH) { if (!S.ach[a.id] && a.val() >= a.goal) { S.ach[a.id] = 1; out.push(a); } } if (out.length) save(); return out; }
function rwName(rw) { return rw.t === 'skin' ? L.skins[rw.id] : rw.t === 'trail' ? L.trails[rw.id] : rw.t === 'horn' ? L.horns[rw.id] : L.titles[rw.id]; }
function rwType(rw) { return { skin: L.rwSkin, trail: L.rwTrail, horn: L.rwHorn, title: L.rwTitle }[rw.t]; }
function ensureRivals() { if (S.rivals && S.rivals.length) return; S.rivals = L.rivalNames.map((n, i) => ({ n, rp: Math.round(60 + i * 160 + Math.random() * 90) })); }
function tierHTML(rp) { const t = TIERS[tierOf(rp)]; return `<span class="tier" style="color:${t.coul}">${t.ic} ${t.nom}</span>`; }
const xpNeed = n => 200 + (n - 1) * 120;
function xpInfo() { let n = 1, x = S.xp; while (x >= xpNeed(n) && n < 999) { x -= xpNeed(n); n++; } return { n, x, need: xpNeed(n) }; }
/* Items: jaws (main slot) + 2 charms */
const itemById = u => S.items.find(i => i.u === u);
function itemNom(it) { return it.t === 'arme' ? JAWS[it.b].nom : MODS[it.b].nom; }
function itemIc(it) { return it.t === 'arme' ? JAWS[it.b].ic : MODS[it.b].ic; }
function jawStats(b, r) { const j = JAWS[b] || JAWS.serrated, R = RAR[r]; return { b, r, dmg: j.dmg * R.m, reach: j.reach + r * 4, grow: j.grow + r * 2 }; }
function itemDesc(it) { if (it.t === 'arme') { const j = jawStats(it.b, it.r); return L.jawDesc(j.dmg.toFixed(2), j.reach, j.grow); } return MODS[it.b].d(MODS[it.b].val[it.r]); }
function rollItem(bonus = 0) {
  const x = Math.random(); const pl = .03 + bonus * .03, pe = pl + .1 + bonus * .05, pr = pe + .3 + bonus * .05;
  const r = x < pl ? 3 : x < pe ? 2 : x < pr ? 1 : 0;
  const t = Math.random() < .3 ? 'arme' : 'mod';
  const b = pick(Object.keys(t === 'arme' ? JAWS : MODS));
  return { u: S.uid++, t, b, r };
}
function addItem(it) { if (it.r === 3) S.legend++; S.items.push(it); if (S.items.length > 60) { const i = S.items.findIndex(x => x.r === 0 && x.u !== S.equip.arme && !S.equip.mods.includes(x.u)); if (i >= 0) S.items.splice(i, 1); } }
function blankLo() { return { jaw: jawStats('serrated', 0), hp: 0, vit: 0, sh: 0, gills: 0, lure: 0, belly: 0, cd: 0 }; }
function myLoadout() {
  const lo = blankLo(); const a = itemById(S.equip.arme); lo.jaw = jawStats(a ? a.b : 'serrated', a ? a.r : 0);
  for (const u of S.equip.mods) { const m = itemById(u); if (m) lo[MODS[m.b].k] += MODS[m.b].val[m.r]; }
  lo.sh += W_SH[a ? a.r : 0]; return lo;
}
function botLoadout(k) { const lo = blankLo(); const r = Math.random() < k * .5 ? 1 + (Math.random() < k * .4 ? 1 : 0) : 0; lo.jaw = jawStats(pick(Object.keys(JAWS)), r); lo.sh = W_SH[r]; lo.vit = Math.random() < k ? 4 : 0; return lo; }
function sanitizeLo(lo) {
  try { const n = (v, m) => clamp(+v || 0, 0, m); const j = lo.jaw || {}; const out = blankLo(); out.jaw = jawStats(JAWS[j.b] ? j.b : 'serrated', clamp(j.r | 0, 0, 3));
    out.hp = n(lo.hp, 72); out.vit = n(lo.vit, 28); out.sh = n(lo.sh, 114); out.gills = n(lo.gills, 90); out.lure = n(lo.lure, 56); out.belly = n(lo.belly, 28); out.cd = n(lo.cd, 56); return out;
  } catch (e) { return botLoadout(0); }
}
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
    float hh = position.y; transformed.x += sin(uT * 1.1 + ip.x * .3 + ip.z * .2 + hh * 2.6) * hh * hh * 1.8; transformed.z += cos(uT * .8 + ip.z * .25 + hh * 2.0) * hh * hh * 1.1;`); };
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
/* ================== Réseau (PeerJS / WebRTC, hôte autoritaire en étoile) ================== */
const PDBG = /[?&]debug/.test(location.search) ? 2 : 0;
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res();
  const urls = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
  const tryN = i => { if (i >= urls.length) return rej(new Error('cdn')); const s = document.createElement('script'); s.src = urls[i]; s.async = true; s.onload = () => window.Peer ? res() : tryN(i + 1); s.onerror = () => { s.remove(); tryN(i + 1); }; document.head.appendChild(s); }; tryN(0); }); }
function genCode() { const C = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += C[Math.random() * C.length | 0]; return s; }
const Net = {
  peer: null, role: null, code: '', conns: new Map(), host: null, slots: 6, lobby: [], inT: 0, snapT: 0, lastRx: 0,
  open() { return this.role === 'host' ? !!this.peer : !!(this.host && this.host.open); },
  send(m) { try { if (this.host && this.host.open) this.host.send(m); } catch (e) { } },
  broadcast(m) { for (const [, p] of this.conns) { try { if (p.conn.open) p.conn.send(m); } catch (e) { } } },
  close() {
    if (this.role === 'guest') this.send({ t: 'bye' }); if (this.role === 'host') this.broadcast({ t: 'bye' });
    const conns = [...this.conns.values()].map(p => p.conn); if (this.host) conns.push(this.host);
    setTimeout(() => conns.forEach(c => { try { c.close(); } catch (e) { } }), 150);
    if (this.peer) { const p = this.peer; setTimeout(() => { try { p.destroy(); } catch (e) { } }, 250); }
    this.peer = null; this.host = null; this.conns = new Map(); this.role = null; this.lobby = [];
  },
};
const myHello = () => ({ t: 'hello', av: S.av, cl: S.clan, nom: pseudo(), sk: S.skin, lo: myLoadout(), niv: xpInfo().n, rp: S.rp, ti: S.style.title, tr: S.style.trail, hn: S.style.horn });
// heartbeat: detects closed tabs / dropped peers even without a clean 'close'
setInterval(() => {
  const now = performance.now();
  if (Net.role === 'guest' && Net.open()) { Net.send({ t: 'hb' }); if (Net.lastRx && now - Net.lastRx > 12000) guestLost(); }
  if (Net.role === 'host') { Net.broadcast({ t: 'hb' }); for (const [pid, p] of [...Net.conns]) if (p.rx && now - p.rx > 9000) { try { p.conn.close(); } catch (e) { } hostLost(pid); } }
}, 2000);
addEventListener('pagehide', () => { if (Net.role) Net.close(); });
function lnMsg(m) { $('lnMsg').textContent = m; }
async function hostCreate(retry) {
  lnUI('salle'); lnMsg(L.connServer); $('lnCode').textContent = '····';
  try { await loadPeer(); } catch (e) { lnMsg(L.errModule); lnUI('choix'); return; }
  if (!retry) Net.close(); Net.role = 'host'; Net.code = genCode();
  const peer = new Peer(NET_PREFIX + Net.code, { debug: PDBG }); Net.peer = peer;
  peer.on('open', () => { if (Net.peer !== peer) return; $('lnCode').textContent = Net.code; lnMsg(L.giveCode); renderLobby(); });
  peer.on('connection', c => { if (Net.peer !== peer) return;
    if (Net.conns.size >= MAX_JOUEURS - 1 || G.net === 'host' && (G.mode === 'play' || G.mode === 'countdown')) { c.on('open', () => { c.send({ t: Net.conns.size >= MAX_JOUEURS - 1 ? 'full' : 'busy' }); setTimeout(() => c.close(), 400); }); return; }
    c.on('open', () => { Net.conns.set(c.peer, { rx: performance.now(), conn: c, nom: L.player, sk: 'classic', lo: null }); });
    c.on('data', d => { if (Net.peer === peer) hostData(c.peer, d); });
    c.on('close', () => { if (Net.peer === peer) hostLost(c.peer); }); c.on('error', () => { if (Net.peer === peer) hostLost(c.peer); });
  });
  peer.on('error', err => { if (Net.peer !== peer) return; if (err.type === 'unavailable-id') { Net.peer = null; try { peer.destroy(); } catch (e) { } hostCreate(true); return; } netError(err); });
  peer.on('disconnected', () => { if (Net.peer === peer && !peer.destroyed) setTimeout(() => { try { peer.reconnect(); } catch (e) { } }, 1000); });
}
function hostData(pid, d) {
  if (!d || typeof d !== 'object') return; const p = Net.conns.get(pid); if (!p) return; p.rx = performance.now();
  if (d.t === 'hello') { p.nom = String(d.nom || L.player).replace(/[<>]/g, '').slice(0, 12) || L.player; p.sk = SKINS.some(s => s.id === d.sk) ? d.sk : 'classic'; p.lo = sanitizeLo(d.lo); p.niv = clamp(d.niv | 0, 1, 999); p.rp = clamp(d.rp | 0, 0, 99999); p.ti = L.titles[d.ti] ? d.ti : ''; p.tr = TRAILS[d.tr] ? d.tr : ''; p.hn = L.horns[d.hn] ? d.hn : ''; p.av = sanAv(d.av); p.cl = sanClan(d.cl || ''); broadcastLobby(); }
  else if (d.t === 'emo') { const c = G.fish.find(c => c.peer === pid); const n = EMOTES[d.k | 0]; if (c && n && (!p.emoT || performance.now() - p.emoT > 900)) { p.emoT = performance.now(); netEmote(c, n); } }
  else if (d.t === 'in' && Array.isArray(d.c)) { const c = G.fish.find(c => c.peer === pid); if (!c) return; const a = d.c, ct = c.ctrl;
    ct.steer = clamp(+a[0] || 0, -1, 1); ct.pitch = clamp(+a[1] || 0, -1, 1); const f = a[2] | 0; ct.boost = !!(f & 1); ct.slow = !!(f & 2); ct.bite = !!(f & 4); ct.specN = a[3] | 0; }
  else if (d.t === 'bye') hostLost(pid);
}
function hostLost(pid) {
  const p = Net.conns.get(pid); if (!p) return; Net.conns.delete(pid);
  const c = G.fish.find(c => c.peer === pid);
  if (c && (G.mode === 'play' || G.mode === 'countdown')) { c.peer = null; c.bot = true; c.ai.k = .5; const d = document.createElement('div'); d.textContent = L.leftBot(c.nom); $('feed').prepend(d); setTimeout(() => d.remove(), 4000); }
  broadcastLobby();
}
function lobbyList() {
  const l = [{ pid: 'hote', nom: pseudo(), sk: S.skin, niv: xpInfo().n, hote: 1, rp: S.rp, ti: S.style.title, av: S.av, cl: S.clan }];
  for (const [pid, p] of Net.conns) l.push({ pid, nom: p.nom, sk: p.sk, niv: p.niv || 1, rp: p.rp || 0, ti: p.ti || '', av: p.av || sanAv(), cl: p.cl || '' });
  return l;
}
function broadcastLobby() { if (Net.role !== 'host') return; Net.lobby = lobbyList(); Net.broadcast({ t: 'lobby', l: Net.lobby, slots: Net.slots, code: Net.code, ranked: Net.ranked ? 1 : 0 }); renderLobby(); }
function hostStart() {
  if (Net.role !== 'host') return;
  const humans = lobbyList(); const n = Math.max(humans.length, Math.min(MAX_JOUEURS, Net.slots));
  const roster = []; const noms = [...BOT_NOMS].sort(() => Math.random() - .5);
  humans.forEach((h, i) => { const p = Net.conns.get(h.pid); roster.push(h.hote ? { id: i, nom: h.nom, sk: S.skin, lo: myLoadout(), local: true, tr: S.style.trail, ti: S.style.title, av: S.av, cl: S.clan, hn: S.style.horn } : { id: i, nom: p.nom, sk: p.sk, lo: p.lo || botLoadout(0), peer: h.pid, tr: p.tr, ti: p.ti, av: p.av, cl: p.cl, hn: p.hn }); });
  for (let i = humans.length; i < n; i++) roster.push({ id: i, nom: noms[i % noms.length] + ' 🤖', sk: botSkin(), bot: true, k: .6, lo: botLoadout(.6), av: botAv(), cl: pick(BOT_CLANS) });
  const seed = Math.random() * 1e9 | 0, pop = 1;
  const pub = roster.map(r => ({ id: r.id, nom: r.nom, sk: r.sk, lo: r.lo, tr: r.tr || '', ti: r.ti || '', hn: r.hn || '', bot: r.bot ? 1 : 0, k: r.k, peer: r.peer || null, av: r.av, cl: r.cl || '' }));
  for (const [pid, p] of Net.conns) { const me = roster.find(r => r.peer === pid); if (!me) continue; try { p.conn.send({ t: 'start', ranked: Net.ranked ? 1 : 0, seed, pop, roster: pub, you: me.id }); } catch (e) { } }
  startMatch(roster, (roster.find(r => r.local) || roster[0]).id, 'host', seed, pop);
}
async function guestJoin(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { lnMsg(L.enterCode); return; }
  lnMsg(L.connecting);
  try { await loadPeer(); } catch (e) { lnMsg(L.errModule); return; }
  Net.close(); Net.role = 'guest'; Net.code = code;
  const peer = new Peer({ debug: PDBG }); Net.peer = peer;
  const to = setTimeout(() => { if (Net.peer === peer && !Net.open()) { lnMsg(L.noAnswer); Net.close(); lnUI('choix'); } }, 15000);
  peer.on('open', () => { if (Net.peer !== peer) return; const c = peer.connect(NET_PREFIX + code, { reliable: true }); Net.host = c;
    c.on('open', () => { if (Net.host !== c) return; clearTimeout(to); c.send(myHello()); lnUI('salle'); $('lnCode').textContent = code; lnMsg(L.connected); });
    c.on('data', d => { if (Net.host === c) { Net.lastRx = performance.now(); guestData(d); } });
    c.on('close', () => { if (Net.host === c) guestLost(); }); c.on('error', () => { if (Net.host === c) guestLost(); }); });
  peer.on('error', err => { if (Net.peer !== peer) return; clearTimeout(to); if (err.type === 'peer-unavailable') { lnMsg(L.roomNotFound); Net.close(); lnUI('choix'); } else netError(err); });
}
function guestData(d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'lobby') { Net.lobby = d.l || []; Net.slots = d.slots | 0; Net.ranked = !!d.ranked; renderLobby(); }
  else if (d.t === 'full' || d.t === 'busy') { lnMsg(d.t === 'full' ? L.roomFull : L.roomBusy); Net.close(); lnUI('choix'); }
  else if (d.t === 'start') { Net.ranked = !!d.ranked; const roster = (d.roster || []).map(r => ({ ...r, lo: sanitizeLo(r.lo), local: r.id === d.you })); startMatch(roster, d.you, 'client', d.seed | 0, clamp(+d.pop || 1, .5, 1.4)); }
  else if (d.t === 's') applySnap(d);
  else if (d.t === 'end') { if (G.net === 'client' && G.mode !== 'end') { G.ended = true; showResults((d.res || []).map(r => ({ ...r }))); } }
  else if (d.t === 'bye') guestLost();
}
function guestLost() {
  const inGame = G.net === 'client' && (G.mode === 'play' || G.mode === 'countdown');
  Net.close(); G.net = null;
  if (inGame) { toMenu(); alertMsg(L.hostLeft); }
  else if ($('sLigne').classList.contains('on')) { lnUI('choix'); lnMsg(L.hostClosed); }
}
function netError(err) { console.warn('réseau', err && err.type); if (G.net && (G.mode === 'play' || G.mode === 'countdown')) return;
  lnMsg(err && (err.type === 'network' || err.type === 'server-error') ? L.serverDown : L.connError); Net.close(); lnUI('choix'); }
const r2 = v => Math.round(v * 100) / 100;
const TFLAG = ['biteT', 'dartT', 'frenzyT', 'sonarT', 'vacT', 'magT', 'frzT', 'spdT', 'lungeT', 'stunT', 'spawnT'];
function sendSnap() {
  const a = G.fish.map(c => { let fl = (c.alive ? 1 : 0) | (c.boostOn ? 2 : 0); TFLAG.forEach((k, i) => { if (c[k] > 0) fl |= 4 << i; });
    return [c.id, r2(c.pos.x), r2(c.pos.y), r2(c.pos.z), r2(c.yaw), r2(c.pitch), Math.round(c.mass * 1000) / 1000, Math.ceil(c.hp), fl, c.score, c.kills, c.deaths, Math.ceil(c.sh), c.shMax, c.maxHp, r2(c.specCd), Math.round(c.turbo), r2(c.speed), c.eaten]; });
  const base = { t: 's', mt: r2(G.mt), al: G.alert ? 1 : 0, a, pk: pickups.map(p => p.on ? 1 : 0).join(''), ev: G.ev };
  for (const [pid, p] of Net.conns) { const c = G.fish.find(f => f.peer === pid); const P = c ? c.pos : null; const n = [];
    for (const f of npcs) { if (!f.alive) continue; if (P && (Math.abs(f.pos.x - P.x) > 130 || Math.abs(f.pos.z - P.z) > 130)) continue; n.push(f.i, Math.round(f.pos.x * 10), Math.round(f.pos.y * 10), Math.round(f.pos.z * 10), Math.round(f.vel.x * 10), Math.round(f.vel.y * 10), Math.round(f.vel.z * 10)); }
    try { if (p.conn.open) p.conn.send({ ...base, n }); } catch (e) { } }
  G.ev = [];
}
const fishById = id => G.fish.find(c => c.id === id);
function applySnap(d) {
  if (G.net !== 'client' || !G.me) return; const now = performance.now(); if (typeof d.mt === 'number') G.mt = d.mt;
  if (d.al && !G.alert) startAlert();
  for (const e of d.a || []) {
    const c = fishById(e[0]); if (!c) continue; const fl = e[8];
    const wasAlive = c.alive; c.alive = !!(fl & 1); c.boostOn = !!(fl & 2); TFLAG.forEach((k, i) => { const on = !!(fl & (4 << i)); if (c !== G.me || k !== 'biteT') c[k] = on ? Math.max(c[k], .25) : 0; });
    if (Math.abs(c.mass - e[6]) > 1e-3) c.setMass(e[6]);
    c.hp = e[7]; c.score = e[9]; c.kills = e[10]; c.deaths = e[11]; if (c === G.me && e[12] < c.sh - .5) flashShield(); c.sh = e[12]; c.shMax = e[13]; c.maxHp = e[14]; c.specCd = e[15]; c.turbo = e[16]; c.eaten = e[18];
    if (!wasAlive && c.alive) { c.pos.set(e[1], e[2], e[3]); c.yaw = e[4]; c.pitch = e[5]; c.growK = .5; if (c === G.me) { G.deadMsg = 0; centreMsg(L.go, '', .6); camInit = true; } }
    if (c === G.me) { const dx = e[1] - c.pos.x, dy = e[2] - c.pos.y, dz = e[3] - c.pos.z, dd = Math.hypot(dx, dy, dz);
      if (dd > 8 || !c.alive) { c.pos.set(e[1], e[2], e[3]); c.yaw = e[4]; c.pitch = e[5]; } else { c.pos.x += dx * .2; c.pos.y += dy * .2; c.pos.z += dz * .2; c.yaw += angDiff(c.yaw, e[4]) * .1; } }
    else { c.net = { x: e[1], y: e[2], z: e[3], yaw: e[4], pitch: e[5], sp: e[17], t: now }; if (!c.netInit) { c.netInit = 1; c.pos.set(e[1], e[2], e[3]); c.yaw = e[4]; } }
  }
  const n = d.n || [], seen = new Set();
  for (let k = 0; k + 6 < n.length; k += 7) { const f = npcs[n[k]]; if (!f) continue; seen.add(f);
    const x = n[k + 1] / 10, y = n[k + 2] / 10, z = n[k + 3] / 10; f.net = { x, y, z, vx: n[k + 4] / 10, vy: n[k + 5] / 10, vz: n[k + 6] / 10, t: now };
    if (!f.alive || Math.abs(f.pos.x - x) + Math.abs(f.pos.y - y) + Math.abs(f.pos.z - z) > 15) f.pos.set(x, y, z); f.alive = true; }
  for (const f of npcs) if (!seen.has(f)) f.alive = false;
  if (typeof d.pk === 'string') pickups.forEach((p, i) => { const on = d.pk[i] === '1'; if (p.on !== on) { p.on = on; p.g.visible = on; } });
  for (const e of d.ev || []) {
    if (e.e === 'eat') { const f = npcs[e.i], a = fishById(e.c); if (f) { f.alive = false; if (a) eatFx(a, f); } }
    else if (e.e === 'emo') { const c = fishById(e.c); if (c && c !== G.me) showEmote(c, EMOTES[e.k | 0]); }
    else if (e.e === 'endmsg') { const c = fishById(e.c); centreMsg(e.w === 'time' ? '⏱️' : '🐋', e.w === 'goal' ? L.reachedGoal(c ? c.nom : '') : L.timeUp, 2); }
    else if (e.e === 'kill') { const v = fishById(e.v), k = fishById(e.k); if (v) { v.killer = e.k; if (v.alive) v.alive = false; fxEat(v.pos.x, v.pos.y, v.pos.z, v.size * 1.4, STAGES[v.stage].col, 0); feedKill(v, k, e.w); } }
    else if (e.e === 'bite') { const c = fishById(e.c); if (c) { biteFx(c, e.j ? 0xff5ad8 : 0xff4040); if (c === G.me) flashDmg(); } }
    else if (e.e === 'sp') { const c = fishById(e.c); if (c) specFx(c, e.k); }
    else if (e.e === 'pk') { const p = pickups[e.i]; if (p) { p.on = false; p.g.visible = false; } if (e.c === G.me.id && p) { SFX.pick(); toastPk(p.t, p.r); } }
  }
}
function puppet(c, dt) {
  const n = c.net; if (!n) return; const lag = Math.min(.2, (performance.now() - n.t) / 1000);
  const cp = Math.cos(n.pitch), tx = n.x + Math.sin(n.yaw) * cp * n.sp * lag, ty = n.y + Math.sin(n.pitch) * n.sp * lag, tz = n.z + Math.cos(n.yaw) * cp * n.sp * lag, k = 1 - Math.exp(-12 * dt);
  c.pos.x += (tx - c.pos.x) * k; c.pos.y += (ty - c.pos.y) * k; c.pos.z += (tz - c.pos.z) * k; c.yaw += angDiff(c.yaw, n.yaw) * k; c.pitch += (n.pitch - c.pitch) * k; c.speed = n.sp;
}
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
