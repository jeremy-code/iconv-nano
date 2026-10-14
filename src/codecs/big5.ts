import { PAYLOAD } from "../../encodings/big5.js";
import type { Encoder, Decoder } from "../interfaces.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";
import { decodeVlqRunsLookup } from "../utils/vlqRuns.js";

// Code point -> pointer lookup over columnar runs of the Big5 reverse index,
// decoded once on module load (see `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`)
const lookupBig5CodePoint = decodeVlqRunsLookup(PAYLOAD);

// https://encoding.spec.whatwg.org/#big5-encoder
const encode: Encoder = (input) => {
  const length = input.length;
  const buf = new Uint8Array(length * 2);
  let byteOffset = 0;

  for (let i = 0; i < length; i++) {
    const codePoint = input.codePointAt(i)!;
    if (codePoint > 0xffff) {
      i++;
    }
    if (isAsciiCodePoint(codePoint)) {
      buf[byteOffset] = codePoint;
      byteOffset++;
      continue;
    }
    const pointer = lookupBig5CodePoint(codePoint);
    if (pointer === null) {
      buf[byteOffset] = 0x3f; // ?
      byteOffset++;
      continue;
    }
    const leading = Math.floor(pointer / 157) + 0x81;
    const trailing = pointer % 157;
    const offset = trailing < 0x3f ? 0x40 : 0x62;
    buf[byteOffset] = leading;
    buf[byteOffset + 1] = trailing + offset;
    byteOffset += 2;
  }
  return buf.slice(0, byteOffset);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("big5", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
