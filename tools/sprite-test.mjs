// Sprite guard: every look that existed before 2.0 must render pixel-for-pixel the same (body A = everyone's current character).
// If you changed an old item ON PURPOSE, update DIGEST with the value this test prints.
import crypto from 'node:crypto';
import { compose } from '../js/sprite.js';
// the starting look every pre-2.0 save has stored (new players now start neutral, but old saves keep exactly this)
const LEGACY_EQ = { hair: 'messy', hairColor: 'black', skin: 's2', face: 'glasses', head: null, top: 'tee_gray', bottom: 'jeans', shoes: 'kicks_white', hand: null, back: null };

const LEGACY = ["hair:messy","hair:buzz","hair:bald","hair:curly","hair:spiky","hair:slick","hair:long","hair:knot","hair:mohawk","hairColor:black","hairColor:brown","hairColor:blond","hairColor:red","hairColor:white","hairColor:teal","hairColor:pink","hairColor:blue","skin:s1","skin:s2","skin:s3","skin:s4","face:glasses","face:mask","face:shades_green","face:shades_black","face:monocle","face:visor","head:cap","head:beanie","head:bandana","head:phones","head:ears","head:horns","head:gradcap","head:hardhat","head:tophat","head:propeller","head:halo","head:crown","top:tee_gray","top:tee_black","top:hoodie","top:jacket","top:track","top:varsity","top:tank","top:gi","top:leather","top:hivis","top:turtleneck","top:vc_vest","top:pi_tee","top:labcoat","top:suit","top:shirtless","top:cyber","top:gold","bottom:jeans","bottom:joggers","bottom:shorts","bottom:cargo","bottom:track_pants","bottom:gi_pants","bottom:suit_pants","bottom:cyber_legs","bottom:gold_legs","shoes:kicks_white","shoes:boots","shoes:kicks_red","shoes:kicks_neon","shoes:gold_boots","hand:coffee","hand:wrench","hand:laptop","hand:briefcase","hand:calculator","hand:moneybag","back:barbell","back:cape","back:katana","back:wings_dark","back:wings"];
const DIGEST = 'cd5fd933897e6e79b41d15a5021383155170fad3c482727d7fe5a042a98e1840';

const h = crypto.createHash('sha256');
for (const id of LEGACY) {
  const [slot, key] = id.split(':');
  for (let build = 0; build < 4; build++) for (const bob of [0, 1]) for (const blink of [0, 1]) for (const expr of [0, 1, 2]) {
    const look = { ...LEGACY_EQ, [slot]: key, build, expr }; // pre-2.0 saves have no body key // pre-2.0 saves have no body key
    h.update(JSON.stringify(compose(look, { bob, blink }).d));
  }
}
const got = h.digest('hex');
const ok = got === DIGEST;
console.log(ok ? 'sprite: ' + LEGACY.length + ' legacy items × 4 builds × 12 frames — pixel-identical' : 'sprite: FAIL legacy looks changed, digest ' + got);
// body B must actually differ, and 'a' must equal 'no body key'
const base = { ...LEGACY_EQ, build: 2, expr: 2 }, px = b => JSON.stringify(compose({ ...base, body: b }).d);
const ok2 = px('a') === px(undefined) && px('b') !== px('a');
console.log(ok2 ? 'sprite: body a = legacy, body b differs' : 'sprite: FAIL body switch');
process.exit(ok && ok2 ? 0 : 1);
