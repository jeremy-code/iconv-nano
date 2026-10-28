import type { EncodingIndex } from "../generate-encodings.js";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const encodeVlq = (n: number): string => {
  let v = n < 0 ? (-n << 1) | 1 : n << 1;
  let s = "";
  do {
    let digit = v & 31;
    v >>>= 5;
    if (v > 0) {
      digit |= 32;
    }
    s += B64[digit]!;
  } while (v > 0);
  return s;
};

// Encodes a char -> pointer reverse index as pointer-ordered runs [cpStart, pointerStart, count],
//
// VLQ compressed into
// "<first code point>.<first pointer>.<cp gaps>.<counts>.<pointer gaps>"
//
// where each gap is the distance from the end of one run to the start of the next
// (mostly 0 or small in regular index regions, so most tokens are a single character)
const encodeVlqRunsPayload = (encodingIndex: EncodingIndex): string => {
  const cpStarts: number[] = [];
  const ptrStarts: number[] = [];
  const counts: number[] = [];
  let prevCp = -2;
  let prevPtr = -2;
  // Object.entries iterates in pointer order, the insertion order of parseEncodingIndexArray
  for (const [char, pointer] of Object.entries(encodingIndex)) {
    const cp = char.codePointAt(0)!;
    if (pointer === prevPtr + 1 && cp === prevCp + 1) {
      counts[counts.length - 1]!++;
    } else {
      cpStarts.push(cp);
      ptrStarts.push(pointer);
      counts.push(1);
    }
    prevCp = cp;
    prevPtr = pointer;
  }
  const runCount = counts.length;
  const cpGaps: number[] = [];
  const ptrGaps: number[] = [];
  for (let i = 0; i < runCount; i++) {
    const next = i + 1;
    cpGaps.push(
      next < runCount ? cpStarts[next]! - (cpStarts[i]! + counts[i]!) : 0,
    );
    ptrGaps.push(
      next < runCount ? ptrStarts[next]! - (ptrStarts[i]! + counts[i]!) : 0,
    );
  }
  return [
    encodeVlq(cpStarts[0]!),
    encodeVlq(ptrStarts[0]!),
    cpGaps.map(encodeVlq).join(""),
    counts.map(encodeVlq).join(""),
    ptrGaps.map(encodeVlq).join(""),
  ].join(".");
};

export { encodeVlqRunsPayload };
