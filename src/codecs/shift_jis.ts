import { PAYLOAD } from "../../encodings/shift_jis.js";
import type { Encoder, Decoder } from "../interfaces.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";
import { decodeVlqRunsLookup } from "../utils/vlqRuns.js";

// Code point -> pointer lookup over columnar runs of the Shift_JIS reverse index,
// decoded once on module load (see `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`)
const lookupShiftJisCodePoint = decodeVlqRunsLookup(PAYLOAD);

// https://encoding.spec.whatwg.org/#shift_jis-encoder
const encode: Encoder = (input) => {
  const length = input.length;
  const buf = new Uint8Array(length * 2);
  let byteOffset = 0;

  for (let i = 0; i < length; i++) {
    const codePoint = input.codePointAt(i)!;
    if (codePoint > 0xffff) {
      i++;
    }
    if (isAsciiCodePoint(codePoint) || codePoint === 0x80) {
      buf[byteOffset] = codePoint;
      byteOffset++;
    } else if (codePoint === 0xa5 /* ¥ */) {
      buf[byteOffset] = 0x5c; // \
      byteOffset++;
    } else if (codePoint === 0x203e /* ‾ */) {
      buf[byteOffset] = 0x7e; // ~
      byteOffset++;
    } else if (/* ｡ */ 0xff61 <= codePoint && codePoint <= 0xff9f /* ﾟ */) {
      buf[byteOffset] = codePoint - 0xff61 + 0xa1;
      byteOffset++;
    } else {
      const pointer = lookupShiftJisCodePoint(
        codePoint === 0x2212 /* − */ ? 0xff0d /* － */ : codePoint,
      );
      if (pointer === null) {
        buf[byteOffset] = 0x3f; // ?
        byteOffset++;
        continue;
      }
      const leading = Math.floor(pointer / 188);
      const leadingOffset = leading < 0x1f ? 0x81 : 0xc1;
      const trailing = pointer % 188;
      const offset = trailing < 0x3f ? 0x40 : 0x41;
      buf[byteOffset] = leading + leadingOffset;
      buf[byteOffset + 1] = trailing + offset;
      byteOffset += 2;
    }
  }
  return buf.length !== byteOffset ? buf.slice(0, byteOffset) : buf;
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("shift_jis", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
