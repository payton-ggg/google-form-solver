import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Creates a valid RGBA PNG buffer from raw pixel data
 */
function createPng(width, height, rgbaBuffer) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let scanlineOffset = 0;
  let rawOffset = 0;

  for (let y = 0; y < height; y++) {
    scanlines[scanlineOffset++] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      scanlines[scanlineOffset++] = rgbaBuffer[rawOffset++]; // R
      scanlines[scanlineOffset++] = rgbaBuffer[rawOffset++]; // G
      scanlines[scanlineOffset++] = rgbaBuffer[rawOffset++]; // B
      scanlines[scanlineOffset++] = rgbaBuffer[rawOffset++]; // A
    }
  }

  const compressedData = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  
  // CRC32
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Simple CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Draws a modern, sleek FormIQ icon
 */
function drawIcon(size) {
  const buffer = Buffer.alloc(size * size * 4);

  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const radius = size * 0.44; // Squircle size
  const cornerRadius = size * 0.26;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Distance from center for rounded squircle
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      
      // Rounded rectangle distance
      const qx = Math.max(0, dx - (radius - cornerRadius));
      const qy = Math.max(0, dy - (radius - cornerRadius));
      const distFromCorner = Math.sqrt(qx * qx + qy * qy);

      // Anti-aliased squircle mask
      const edge = cornerRadius - distFromCorner;
      let alpha = Math.max(0, Math.min(1, edge + 0.5));

      if (alpha <= 0) {
        // Transparent
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
        continue;
      }

      // Background Gradient (Deep Electric Blue to Cyan Indigo)
      const gradT = (x + y) / (size * 2);
      const r = Math.round(37 + (56 - 37) * gradT);   // #2563eb to #38bdf8
      const g = Math.round(99 + (189 - 99) * gradT);
      const b = Math.round(235 + (248 - 235) * gradT);

      // Draw Icon Shape in center (Geometric 4-point Sparkle / Lightning IQ)
      const nx = (x - cx) / (size * 0.5);
      const ny = (y - cy) / (size * 0.5);

      // Star shape: |x|^0.5 + |y|^0.5 < 0.65
      const starVal = Math.pow(Math.abs(nx), 0.55) + Math.pow(Math.abs(ny), 0.55);
      
      if (starVal < 0.68) {
        // Star highlight
        const starAlpha = Math.max(0, Math.min(1, (0.68 - starVal) * 8));
        const finalR = Math.round(r * (1 - starAlpha) + 255 * starAlpha);
        const finalG = Math.round(g * (1 - starAlpha) + 255 * starAlpha);
        const finalB = Math.round(b * (1 - starAlpha) + 255 * starAlpha);

        buffer[idx] = finalR;
        buffer[idx + 1] = finalG;
        buffer[idx + 2] = finalB;
        buffer[idx + 3] = Math.round(alpha * 255);
      } else {
        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
        buffer[idx + 3] = Math.round(alpha * 255);
      }
    }
  }

  return buffer;
}

// Generate icons
const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach((size) => {
  const rgba = drawIcon(size);
  const png = createPng(size, size, rgba);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
});

console.log('✅ All modern FormIQ icons generated successfully!');
