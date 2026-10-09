import { PAYLOAD } from "../../encodings/euc-kr.js";
import type { Encoder, Decoder } from "../interfaces.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";
import { decodeVlqRunsLookup } from "../utils/vlqRuns.js";

// Code point -> pointer lookup over columnar runs of the EUC-KR reverse index,
// decoded once on module load (see `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`)
const lookupEucKrCodePoint = decodeVlqRunsLookup(PAYLOAD);

// https://encoding.spec.whatwg.org/#euc-kr-encoder
const encode: Encoder = (input) => {
  const buf = new Uint8Array(input.length * 2);
  let byteOffset = 0;

  for (const char of input) {
    let codePoint = char.codePointAt(0)!;
    if (isAsciiCodePoint(codePoint)) {
      buf[byteOffset] = codePoint;
      byteOffset++;
    } else {
      const pointer = lookupEucKrCodePoint(codePoint);
      if (pointer === null) {
        buf[byteOffset] = 0x3f; // ?
        byteOffset++;
        continue;
      }
      const leading = Math.floor(pointer / 190) + 0x81;
      const trailing = (pointer % 190) + 0x41;
      buf[byteOffset] = leading;
      buf[byteOffset + 1] = trailing;
      byteOffset += 2;
    }
  }
  return buf.slice(0, byteOffset);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("euc-kr", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
