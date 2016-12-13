"use strict"

const DIFFERENTIAL = [0, 1, 2, 3, -4, -3, -2, -1];
const TABLE = [
  [   -8,  -2,  2,   8 ],
  [  -17,  -5,  5,  17 ],
  [  -29,  -9,  9,  29 ],
  [  -42, -13, 13,  42 ],
  [  -60, -18, 18,  60 ],
  [  -80, -24, 24,  80 ],
  [ -106, -33, 33, 106 ],
  [ -183, -47, 47, 183 ],
];
const PIXEL_INDEX = [2, 3, 1, 0];
const SUBBLOCK = [
  [ 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1 ],
  [ 0,0,0,0, 0,0,0,0, 1,1,1,1, 1,1,1,1 ],
]

function clamp(i) {
  if(i < 0) return 0;
  if(255 < i) return 255;
  return i;
}

function unpackEtc1Block(upper, lower) {
  let flipbit = (upper     ) & 1;
  let diffbit = (upper >> 1) & 1;
  let cw = [ (upper >> 5) & 7, (upper >> 2) & 7 ];
  let baseColor = [];

  let r1, g1, b1, r2, g2, b2;

  if(diffbit === 0) {
    b2 = (upper >>  8) & 15;  b2 = b2 << 4 | b2;
    b1 = (upper >> 12) & 15;  b1 = b1 << 4 | b1;
    g2 = (upper >> 16) & 15;  g2 = g2 << 4 | g2;
    g1 = (upper >> 20) & 15;  g1 = g1 << 4 | g1;
    r2 = (upper >> 24) & 15;  r2 = r2 << 4 | r2;
    r1 = (upper >> 28) & 15;  r1 = r1 << 4 | r1;
  }
  else {
    let db = (upper >>  8) &  7;  db = DIFFERENTIAL[db];
        b1 = (upper >> 11) & 31;  b2 = (b1 + db) & 31;
    let dg = (upper >> 16) &  7;  dg = DIFFERENTIAL[dg];
        g1 = (upper >> 19) & 31;  g2 = (g1 + dg) & 31;
    let dr = (upper >> 24) &  7;  dr = DIFFERENTIAL[dr];
        r1 = (upper >> 27) & 31;  r2 = (r1 + dr) & 31;

    r1 = r1 << 3 | (r1 >> 2);
    r2 = r2 << 3 | (r2 >> 2);
    g1 = g1 << 3 | (g1 >> 2);
    g2 = g2 << 3 | (g2 >> 2);
    b1 = b1 << 3 | (b1 >> 2);
    b2 = b2 << 3 | (b2 >> 2);
  }

  baseColor = [ [r1, g1, b1], [r2, g2, b2] ];

  // 4x4
  let block = [];

  let high = (lower >> 16) & 0xffff;
  let low = lower & 0xffff;

  for(let i = 0 ; i < 16 ; i++) {
    let subblock = SUBBLOCK[flipbit][i];
    let base = baseColor[subblock];

    let bit = (i >> 2) | ((i & 3) << 2);
    let lsb = (low >> bit) & 1;
    let msb = (high >> bit) & 1;
    let index = PIXEL_INDEX[msb * 2 + lsb];
    let diff = TABLE[cw[subblock]][index];

    block[i] = [ base[0] + diff, base[1] + diff, base[2] + diff ];
    block[i] = block[i].map(clamp);
  }

  return block;
}

module.exports = unpackEtc1Block;
