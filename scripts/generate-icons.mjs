import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
function crc32(data) {
 let crc = 0xffffffff;
 for (const byte of data) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
 return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
 const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
 length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
 return Buffer.concat([length, name, data, crc]);
}
for (const size of [192,512]) {
 const rows = Buffer.alloc((size * 4 + 1) * size);
 for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const u = x / size, v = y / size;
  const border = u > .26 && u < .74 && v > .29 && v < .73 && (u < .30 || u > .70 || v < .33 || v > .69);
  const tape = u > .47 && u < .53 && v > .29 && v < .50;
  const white = border || tape;
  const offset = y * (size * 4 + 1) + 1 + x * 4;
  rows.set(white ? [255,255,255,255] : [37,99,235,255], offset);
 }
 const header = Buffer.alloc(13); header.writeUInt32BE(size,0); header.writeUInt32BE(size,4); header[8] = 8; header[9] = 6;
 writeFileSync(`public/icon-${size}.png`, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]));
}
