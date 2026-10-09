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
