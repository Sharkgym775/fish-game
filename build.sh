#!/bin/sh
cd "$(dirname "$0")" && cat src/a_head.js src/b_data.js src/c_sfx.js src/d_render.js src/e_fish.js src/f_game.js src/g_hud.js src/h_net.js src/i_ctl.js src/j_main.js src/k_tail.js src/l_boot.js > game.js && node --check game.js && echo built
