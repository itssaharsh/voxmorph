#!/usr/bin/env node
/**
 * Lay the generated segments onto one silent 24 kHz track at their cue times, so
 * the whole voiceover drops onto the timeline as a single file aligned to 0:00.
 */
import { readFileSync, writeFileSync } from "node:fs";
const RATE = 24_000;
const CUES = [
  ["A", 0], ["C1", 40], ["C2", 52], ["C3", 62],
  ["D1", 80], ["D2", 92], ["D3", 104], ["E", 116],
];
const TOTAL = 132; // 2:12

const pcmOf = (f) => {
  const b = readFileSync(f);
  return new Int16Array(b.buffer, b.byteOffset + 44, (b.length - 44) / 2);
};

const track = new Int16Array(TOTAL * RATE);
let end = 0, prevEnd = 0, prevId = null;
for (const [id, at] of CUES) {
  const pcm = pcmOf(`voiceover/${id}.wav`);
  const start = Math.round(at * RATE);
  if (start < prevEnd) console.log(`  ! ${id} overlaps ${prevId} by ${((prevEnd-start)/RATE).toFixed(2)}s`);
  track.set(pcm, start);
  prevEnd = start + pcm.length; prevId = id;
  end = Math.max(end, prevEnd);
  console.log(`  ${id.padEnd(3)} ${at}s -> ${(prevEnd/RATE).toFixed(1)}s`);
}

const data = Buffer.from(track.buffer, 0, end * 2);
const buf = Buffer.alloc(44 + data.length);
buf.write("RIFF", 0, "ascii"); buf.writeUInt32LE(36 + data.length, 4); buf.write("WAVE", 8, "ascii");
buf.write("fmt ", 12, "ascii"); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22); buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28);
buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36, "ascii"); buf.writeUInt32LE(data.length, 40);
data.copy(buf, 44);
writeFileSync("voiceover/full-track.wav", buf);
console.log(`\n  voiceover/full-track.wav  ${(end/RATE).toFixed(1)}s  ${(buf.length/1024/1024).toFixed(2)} MB`);
