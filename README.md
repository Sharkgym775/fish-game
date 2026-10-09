# STIMM Feeding Frenzy

3D underwater eat-and-grow game (three.js, plays in the browser, built for iPhone landscape, also works on desktop and with a PS5 controller).

**Play:** https://sharkgym775.github.io/fish-game/

- You are a fish: eat smaller fish to grow, avoid anything bigger than you.
- Evolve: Minnow → Piranha → Barracuda → Shark → Megalodon → Blue Whale. The first player to become a Blue Whale wins, otherwise the highest score after 6:00. The last minute is the **Feeding Frenzy**: golden schools appear and are worth ×3.
- AI fish schools of many sizes, roaming predators, jellyfish, 4 ocean zones (Sunlit Reef, Kelp Forest, Twilight Drop, Midnight Abyss).
- Power-ups: speed boost, magnet, shield bubble, frenzy ×2, heal, pearl. Every stage has its own special ability.
- Solo waves, ranked mode, online up to 10 players (PeerJS, host-authoritative; players eat each other by size).
- Account + 3D avatar, emote head, levels/XP, inventory with rarity, achievements that unlock exclusive skins (incl. the SharkGym shark skin), save export code.
- Quality presets Low / Medium / High / Ultra (caustics, god rays, fog, bubbles, kelp, bloom), display settings & HUD editor.

Controls: touch joystick + Bite / Boost / Special buttons · keyboard WASD/arrows, Space bite, Shift boost, X slow, E special · PS5 controller (stick swim, R2 boost, L2 slow, R1 bite, L1 special).

The game title is a single constant (`TITRE`) in `src/a_head.js`. `game.js` is generated with `./build.sh` (concatenates `src/*.js`).
