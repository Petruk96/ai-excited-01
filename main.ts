const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { deflateSync } = require('node:zlib');

// A small, deterministic raster painter: no external assets or dependencies.
const W = 800, H = 800;
const pixels = Buffer.alloc(W * H * 3);
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
function set(x: number, y: number, c: number[]) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  pixels[i] = c[0]; pixels[i + 1] = c[1]; pixels[i + 2] = c[2];
}
function blend(x: number, y: number, c: number[], a: number) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  pixels[i] = clamp(pixels[i] * (1 - a) + c[0] * a);
  pixels[i + 1] = clamp(pixels[i + 1] * (1 - a) + c[1] * a);
  pixels[i + 2] = clamp(pixels[i + 2] * (1 - a) + c[2] * a);
}
function ellipse(cx: number, cy: number, rx: number, ry: number, c: number[], alpha = 1) {
  const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(W - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(H - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d <= 1) blend(x, y, c, alpha * Math.min(1, (1 - d) * 24));
  }
}
function line(x1: number, y1: number, x2: number, y2: number, width: number, c: number[], alpha = 1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ellipse(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, width / 2, c, alpha);
  }
}
function path(points: number[][], width: number, color: number[], alpha = 1) {
  for (let i = 1; i < points.length; i++) line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], width, color, alpha);
}
function polygon(points: number[][], color: number[], alpha = 1) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [x1, y1] = points[i], [x2, y2] = points[j];
      if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(W - 1, xs[k + 1]); x++) blend(x, y, color, alpha);
  }
}
function curve(p0: number[], p1: number[], p2: number[], p3: number[], width: number, c: number[], alpha = 1) {
  const pts: number[][] = [];
  for (let i = 0; i <= 45; i++) {
    const t = i / 45, u = 1 - t;
    pts.push([u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]]);
  }
  path(pts, width, c, alpha);
}

// Sunset sky, luminous horizon and a low molten sun.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const t = y / H;
  const glow = Math.max(0, 1 - Math.hypot((x - 570) / 470, (y - 390) / 310));
  set(x, y, [18 + 226 * Math.max(0, 1 - t * 1.18) + 57 * glow,
    34 + 94 * Math.max(0, 1 - t * 1.45) + 94 * glow,
    73 + 98 * Math.max(0, 1 - t * 1.1) + 46 * glow]);
}
ellipse(604, 383, 78, 78, [255, 205, 126], 0.18);
ellipse(604, 383, 51, 51, [255, 224, 164], 0.88);
// Long, painterly sunset cloud streaks.
for (let i = 0; i < 8; i++) {
  const y = 135 + i * 30;
  curve([-40, y + 28], [160, y - 14], [300, y + 39], [470, y + 3], 10 + (i % 3) * 4, [255, 185, 150], 0.25);
  curve([515, y + 12], [620, y - 13], [718, y + 17], [850, y - 9], 8, [255, 225, 186], 0.22);
}

// Distant sea line and reflected amber light.
for (let y = 420; y < 800; y++) {
  const t = (y - 420) / 380;
  for (let x = 0; x < W; x++) {
    const glint = Math.max(0, 1 - Math.abs(x - 604) / (35 + t * 190)) * (1 - t) * 0.38;
    blend(x, y, [5 + 15 * t, 92 + 25 * t, 117 + 28 * t], 0.95);
    if (glint > 0) blend(x, y, [255, 192, 116], glint);
  }
}
// Choppy distant horizon strokes.
for (let i = 0; i < 26; i++) {
  const x = (i * 137 + 31) % 810, y = 429 + (i * 23) % 52;
  line(x, y, x + 18 + (i % 4) * 8, y - 1, 2 + i % 3, [155, 220, 204], 0.33);
}

// The wave's dark, towering face and curled turquoise lip.
polygon([[0, 800], [0, 535], [70, 490], [138, 441], [213, 404], [294, 381], [376, 379], [450, 397], [511, 432], [555, 475], [579, 519], [590, 558], [590, 596], [576, 631], [548, 662], [516, 690], [476, 722], [435, 758], [399, 800]], [5, 69, 91]);
polygon([[0, 800], [0, 567], [83, 518], [159, 472], [240, 444], [321, 432], [396, 439], [464, 466], [518, 509], [546, 554], [548, 594], [524, 631], [478, 663], [432, 697], [385, 744], [351, 800]], [7, 131, 148]);
polygon([[0, 800], [0, 635], [90, 582], [180, 544], [274, 520], [366, 523], [439, 547], [488, 582], [499, 616], [475, 648], [431, 678], [386, 719], [343, 800]], [8, 170, 174]);
// Curled barrel shadow, giving the wave a deep hollow.
polygon([[184, 505], [264, 465], [345, 451], [414, 462], [468, 489], [502, 525], [511, 562], [492, 595], [456, 614], [459, 581], [444, 548], [414, 521], [370, 505], [318, 500], [264, 508], [216, 532]], [3, 47, 67], 0.82);

// Sunlit ridges sweeping down the wave face.
curve([23, 615], [126, 537], [265, 490], [420, 504], 17, [46, 204, 190], 0.56);
curve([4, 682], [117, 593], [275, 548], [427, 562], 12, [35, 218, 198], 0.48);
curve([41, 755], [158, 661], [291, 614], [416, 626], 10, [20, 192, 182], 0.47);
curve([130, 800], [211, 723], [310, 682], [389, 687], 8, [91, 231, 203], 0.42);
for (let i = 0; i < 13; i++) {
  const x = 25 + i * 30, y = 570 + (i * 37) % 188;
  curve([x, y], [x + 35, y - 19], [x + 66, y - 31], [x + 93, y - 29], 3 + i % 3, [138, 235, 211], 0.35);
}
// Crest foam folds over in a bright, wind-torn arc.
curve([0, 550], [130, 432], [283, 366], [402, 390], 33, [105, 233, 216], 0.78);
curve([8, 530], [140, 414], [284, 358], [405, 385], 19, [222, 250, 222], 0.9);
curve([24, 526], [144, 423], [283, 375], [405, 392], 8, [255, 246, 217], 0.92);
curve([415, 396], [486, 408], [542, 459], [563, 513], 16, [221, 248, 229], 0.8);
curve([426, 394], [492, 412], [539, 455], [558, 503], 7, [255, 251, 224], 0.95);
// Foam streamers and spray, all placed from fixed arithmetic for repeatability.
for (let i = 0; i < 45; i++) {
  const x = 390 + (i * 47) % 190, y = 368 + (i * 31) % 154;
  const len = 10 + (i * 13) % 34;
  curve([x, y], [x + len * 0.2, y - 8], [x + len * 0.7, y - 6], [x + len, y - 14], 2 + i % 4, [244, 251, 230], 0.6);
}
for (let i = 0; i < 100; i++) {
  const x = 395 + (i * 73) % 190, y = 338 + (i * 41) % 210;
  const r = 1 + (i % 4) * 0.7;
  ellipse(x, y, r, r * 1.2, i % 3 ? [242, 250, 230] : [255, 215, 161], 0.8);
}

// Surfer: compact, unmistakable silhouette in a dynamic descending stance.
// Board first, then legs, torso, arms and head to create a clean overlap.
polygon([[361, 610], [452, 596], [475, 601], [451, 609], [370, 621]], [255, 224, 174]);
line(407, 588, 392, 608, 12, [20, 31, 43]);
line(407, 589, 430, 603, 11, [20, 31, 43]);
line(399, 566, 407, 591, 17, [23, 33, 44]);
line(400, 570, 374, 580, 10, [23, 33, 44]);
line(401, 570, 431, 575, 10, [23, 33, 44]);
line(374, 580, 356, 568, 6, [23, 33, 44]);
line(431, 575, 451, 559, 6, [23, 33, 44]);
ellipse(399, 550, 8, 9, [24, 33, 44]);
// Warm rim light along the figure catches the sunset.
line(400, 565, 400, 578, 3, [255, 187, 116], 0.85);
line(399, 588, 389, 604, 2, [255, 187, 116], 0.8);
// Flying droplets in the wake emphasize speed and scale.
for (let i = 0; i < 28; i++) {
  const x = 340 - (i * 17) % 118, y = 555 + (i * 29) % 119;
  ellipse(x, y, 1.2 + (i % 3), 2 + (i % 4), [232, 249, 226], 0.65);
}

// Tiny distant birds keep the huge sunset sky from feeling empty.
for (const [x, y, s] of [[158, 211, 1], [188, 198, 0.8], [682, 245, 0.75], [710, 257, 0.65]]) {
  curve([x - 11 * s, y], [x - 5 * s, y - 7 * s], [x - 3 * s, y - 7 * s], [x, y], 2, [57, 55, 68], 0.75);
  curve([x, y], [x + 5 * s, y - 7 * s], [x + 7 * s, y - 6 * s], [x + 12 * s, y + 1 * s], 2, [57, 55, 68], 0.75);
}

// PNG encoder with explicit CRCs; fixed filter and zlib settings make output stable.
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
function crc(buf: Buffer) { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Buffer) {
  const name = Buffer.from(type), body = Buffer.concat([name, data]), out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(crc(body), data.length + 8); return out;
}
const raw = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) pixels.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', Buffer.from([0, 0, 3, 32, 0, 0, 3, 32, 8, 2, 0, 0, 0])),
  chunk('IDAT', deflateSync(raw, { level: 9, strategy: 0 })), chunk('IEND', Buffer.alloc(0))]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
