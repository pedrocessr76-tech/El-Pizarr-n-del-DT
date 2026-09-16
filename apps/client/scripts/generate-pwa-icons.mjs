import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public');

const BG = [11, 19, 38]; // #0b1326 navy (identidad del pizarrón)
const PITCH = [14, 59, 40]; // #0e3b28 dark green
const LINE = [165, 208, 185]; // #a5d0b9 light mint

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

class Canvas {
  constructor(size) {
    this.size = size;
    this.px = new Uint8Array(size * size * 4);
  }

  set(x, y, [r, g, b]) {
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (cx < 0 || cy < 0 || cx >= this.size || cy >= this.size) return;
    const i = (cy * this.size + cx) * 4;
    this.px[i] = r;
    this.px[i + 1] = g;
    this.px[i + 2] = b;
    this.px[i + 3] = 255;
  }

  fill([r, g, b]) {
    for (let i = 0; i < this.px.length; i += 4) {
      this.px[i] = r;
      this.px[i + 1] = g;
      this.px[i + 2] = b;
      this.px[i + 3] = 255;
    }
  }

  fillRect(x0, y0, x1, y1, color) {
    for (let y = Math.max(0, Math.round(y0)); y <= Math.min(this.size - 1, Math.round(y1)); y++) {
      for (let x = Math.max(0, Math.round(x0)); x <= Math.min(this.size - 1, Math.round(x1)); x++) {
        this.set(x, y, color);
      }
    }
  }

  strokeRect(x0, y0, x1, y1, w, color) {
    this.fillRect(x0 - w / 2, y0 - w / 2, x1 + w / 2, y0 + w / 2, color);
    this.fillRect(x0 - w / 2, y1 - w / 2, x1 + w / 2, y1 + w / 2, color);
    this.fillRect(x0 - w / 2, y0 + w / 2, x0 + w / 2, y1 - w / 2, color);
    this.fillRect(x1 - w / 2, y0 + w / 2, x1 + w / 2, y1 - w / 2, color);
  }

  fillCircle(cx, cy, r, color) {
    for (let y = Math.round(cy - r); y <= Math.round(cy + r); y++) {
      for (let x = Math.round(cx - r); x <= Math.round(cx + r); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r * r) this.set(x, y, color);
      }
    }
  }

  strokeCircle(cx, cy, r, w, color) {
    const r0 = r - w / 2;
    const r1 = r + w / 2;
    for (let y = Math.round(cy - r1); y <= Math.round(cy + r1); y++) {
      for (let x = Math.round(cx - r1); x <= Math.round(cx + r1); x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 >= r0 * r0 && d2 <= r1 * r1) this.set(x, y, color);
      }
    }
  }

  strokeLine(x0, y0, x1, y1, w, color) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.fillCircle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w / 2, color);
    }
  }

  toPNG() {
    const { size, px } = this;
    const raw = Buffer.alloc(size * (1 + size * 3));
    for (let y = 0; y < size; y++) {
      const row = y * (1 + size * 3);
      raw[row] = 0; // filter: none
      for (let x = 0; x < size; x++) {
        const p = (y * size + x) * 4;
        const o = row + 1 + x * 3;
        raw[o] = px[p];
        raw[o + 1] = px[p + 1];
        raw[o + 2] = px[p + 2];
      }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type: truecolor RGB
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

function drawFieldIcon(size) {
  const canvas = new Canvas(size);
  const n = size;
  canvas.fill(BG);
  const w = Math.max(2, 0.023 * n);
  const x0 = 0.1875 * n;
  const x1 = 0.8125 * n;
  const y0 = 0.3438 * n;
  const y1 = 0.6562 * n;
  canvas.fillRect(x0, y0, x1, y1, PITCH);
  canvas.strokeRect(x0, y0, x1, y1, w, LINE);
  canvas.strokeLine(0.5 * n, y0, 0.5 * n, y1, w, LINE);
  canvas.strokeCircle(0.5 * n, 0.5 * n, 0.086 * n, w, LINE);
  const hw = 0.14 * n;
  const hh = 0.16 * n;
  canvas.strokeRect(x0, y0, x0 + hw, y0 + hh, w, LINE);
  canvas.strokeRect(x1 - hw, y1 - hh, x1, y1, w, LINE);
  canvas.fillCircle(0.5 * n, 0.5 * n, 0.035 * n, LINE);
  return canvas.toPNG();
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b1326"/>
  <rect x="96" y="176" width="320" height="160" rx="12" fill="#0e3b28" stroke="#a5d0b9" stroke-width="12"/>
  <line x1="256" y1="176" x2="256" y2="336" stroke="#a5d0b9" stroke-width="10"/>
  <circle cx="256" cy="256" r="44" fill="none" stroke="#a5d0b9" stroke-width="10"/>
  <circle cx="256" cy="256" r="18" fill="#a5d0b9"/>
  <rect x="96" y="222" width="72" height="68" fill="none" stroke="#a5d0b9" stroke-width="10"/>
  <rect x="344" y="222" width="72" height="68" fill="none" stroke="#a5d0b9" stroke-width="10"/>
</svg>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'pwa-192x192.png'), drawFieldIcon(192));
writeFileSync(join(outDir, 'pwa-512x512.png'), drawFieldIcon(512));
writeFileSync(join(outDir, 'pwa-512x512-maskable.png'), drawFieldIcon(512));
writeFileSync(join(outDir, 'apple-touch-icon.png'), drawFieldIcon(180));
writeFileSync(join(outDir, 'favicon.svg'), FAVICON_SVG);

console.log('PWA icons written to', outDir);