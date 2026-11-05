import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer with 1 extra byte per scanline for PNG filter type 0
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const color = drawFn(x, y, width, height);
      rawData[pixelOffset] = color[0];     // R
      rawData[pixelOffset + 1] = color[1]; // G
      rawData[pixelOffset + 2] = color[2]; // B
      rawData[pixelOffset + 3] = color[3]; // A
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc ^ byte) & 1 ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Emerald theme icon drawer
function drawAppIcon(isMaskable) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;

    // Background gradient: Emerald green (#047857 to #064e3b)
    let r = Math.round(4 + (6 - 4) * ny);
    let g = Math.round(120 - 42 * ny);
    let b = Math.round(87 - 28 * ny);
    let a = 255;

    // Corner radius for non-maskable icons
    if (!isMaskable) {
      const radius = 0.22;
      const dx = Math.max(0, Math.max(radius - nx, nx - (1 - radius)));
      const dy = Math.max(0, Math.max(radius - ny, ny - (1 - radius)));
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }

    // Draw central scale silhouette
    // Central pillar: x between 0.47 and 0.53, y between 0.28 and 0.75
    if (nx >= 0.47 && nx <= 0.53 && ny >= 0.28 && ny <= 0.72) {
      return [255, 255, 255, 255]; // white pillar
    }

    // Top beam: y between 0.32 and 0.36, x between 0.20 and 0.80
    if (ny >= 0.32 && ny <= 0.36 && nx >= 0.20 && nx <= 0.80) {
      return [253, 224, 71, 255]; // Gold beam
    }

    // Central pivot circle
    const cdx = nx - 0.5;
    const cdy = ny - 0.34;
    if (cdx * cdx + cdy * cdy <= 0.05 * 0.05) {
      return [253, 224, 71, 255]; // Gold pivot
    }

    // Left pan strings
    const leftDist1 = Math.abs((ny - 0.35) * 0.15 - (nx - 0.25) * 0.25);
    if (leftDist1 < 0.008 && ny >= 0.35 && ny <= 0.60 && nx >= 0.15 && nx <= 0.35) {
      return [255, 255, 255, 240];
    }
    // Left bowl: curved bowl around nx=0.25, ny=0.60
    const bdx1 = nx - 0.25;
    const bdy1 = ny - 0.58;
    if (bdx1 * bdx1 * 4 + bdy1 * bdy1 * 8 <= 0.015 && ny >= 0.58) {
      return [253, 224, 71, 255]; // Gold pan
    }

    // Right pan strings
    const rightDist1 = Math.abs((ny - 0.35) * 0.15 - (nx - 0.75) * -0.25);
    if (rightDist1 < 0.008 && ny >= 0.35 && ny <= 0.60 && nx >= 0.65 && nx <= 0.85) {
      return [255, 255, 255, 240];
    }
    // Right bowl
    const bdx2 = nx - 0.75;
    const bdy2 = ny - 0.58;
    if (bdx2 * bdx2 * 4 + bdy2 * bdy2 * 8 <= 0.015 && ny >= 0.58) {
      return [253, 224, 71, 255]; // Gold pan
    }

    // Weight cube on right pan
    if (nx >= 0.72 && nx <= 0.78 && ny >= 0.52 && ny <= 0.58) {
      return [255, 255, 255, 255];
    }

    // Base of the scale
    if (nx >= 0.35 && nx <= 0.65 && ny >= 0.72 && ny <= 0.78) {
      return [255, 255, 255, 255];
    }
    if (nx >= 0.30 && nx <= 0.70 && ny >= 0.78 && ny <= 0.82) {
      return [253, 224, 71, 255];
    }

    return [r, g, b, a];
  };
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192 standard icon
const buf192 = createPNG(192, 192, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buf192);

// 512x512 standard icon
const buf512 = createPNG(512, 512, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buf512);

// 512x512 maskable icon (full-bleed background with padding)
const bufMaskable = createPNG(512, 512, drawAppIcon(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), bufMaskable);

// 180x180 Apple touch icon
const bufApple = createPNG(180, 180, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), bufApple);

console.log('PWA PNG icons generated successfully in public/');
