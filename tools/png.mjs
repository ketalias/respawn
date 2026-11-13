// Minimal PNG encoder + sprite rasteriser for build-time assets (icons, previews).
import zlib from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, c]);
};

export function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

export function parseColor(c) {
  if (c.startsWith('#')) {
    const n = c.slice(1);
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), n.length === 8 ? parseInt(n.slice(6, 8), 16) : 255];
  }
  const m = c.match(/[\d.]+/g).map(Number);
  return [m[0], m[1], m[2], m[3] === undefined ? 255 : Math.round(m[3] * 255)];
}

export class Canvas {
  constructor(w, h, bg = [0, 0, 0, 0]) { this.w = w; this.h = h; this.d = Buffer.alloc(w * h * 4); if (bg[3]) this.fill(0, 0, w, h, bg); }
  fill(x, y, w, h, [r, g, b, a = 255]) {
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
      const o = (j * this.w + i) * 4, k = a / 255;
      this.d[o] = r * k + this.d[o] * (1 - k); this.d[o + 1] = g * k + this.d[o + 1] * (1 - k); this.d[o + 2] = b * k + this.d[o + 2] * (1 - k);
      this.d[o + 3] = Math.max(this.d[o + 3], a);
    }
  }
  // draw a sprite buffer (from sprite.js compose) at integer scale; crop = [sx, sy, sw, sh]
  sprite(buf, ox, oy, scale, crop = [0, 0, buf.w, buf.h]) {
    const [sx, sy, sw, sh] = crop;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const c = buf.d[(sy + y) * buf.w + sx + x];
      if (c) this.fill(ox + x * scale, oy + y * scale, scale, scale, parseColor(c));
    }
  }
  png() { return encodePNG(this.w, this.h, this.d); }
}
