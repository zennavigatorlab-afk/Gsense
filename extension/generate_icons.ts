import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate a simple uncompressed PNG with RGBA data
function createPng(width: number, height: number, rgbaBuffer: Buffer): Buffer {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * scanlineLength;
    rawData[rawOffset] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * 4;
      const dstOffset = rawOffset + 1 + x * 4;
      rawData[dstOffset] = rgbaBuffer[srcOffset];
      rawData[dstOffset + 1] = rgbaBuffer[srcOffset + 1];
      rawData[dstOffset + 2] = rgbaBuffer[srcOffset + 2];
      rawData[dstOffset + 3] = rgbaBuffer[srcOffset + 3];
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 implementation for PNG chunks
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate the G-SENSE logo icon with rounded square and blue synapse
function renderIconBuffer(size: number): Buffer {
  const buf = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const radius = size * 0.45;
  const innerRadius = size * 0.25;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded container (Dark slate #0f172a with subtle blue border)
      const margin = size * 0.08;
      const isInsideRect =
        x >= margin && x < size - margin && y >= margin && y < size - margin;

      if (isInsideRect) {
        // Dark slate base: #0f172a
        let r = 15;
        let g = 23;
        let b = 42;
        let a = 255;

        // Neural circular G-contour arc in bright blue #3b82f6
        if (Math.abs(dist - radius * 0.65) < size * 0.12) {
          // Angle check to form 'G' shape
          const angle = Math.atan2(dy, dx); // -PI to PI
          if (angle < Math.PI * 0.6 || angle > Math.PI * 0.85 || (dy >= -2 && dy <= 2 && dx >= 0)) {
            r = 59;
            g = 130;
            b = 246;
          }
        }

        // Center synapse node in electric blue #60a5fa
        if (dist < size * 0.16) {
          r = 96;
          g = 165;
          b = 250;
        }

        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = a;
      } else {
        // Transparent outside
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
      }
    }
  }
  return buf;
}

const iconsDir = path.resolve(process.cwd(), 'extension/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach((size) => {
  const rgba = renderIconBuffer(size);
  const png = createPng(size, size, rgba);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
});
