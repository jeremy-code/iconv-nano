import { PAYLOAD } from "../../encodings/jis0208.js";
import type { Encoder, Decoder } from "../interfaces.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";
import { decodeVlqRunsLookup } from "../utils/vlqRuns.js";

// Code point -> pointer lookup over columnar runs of the JIS0208 reverse index,
// decoded once on module load (see `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`)
const lookupJis0208CodePoint = decodeVlqRunsLookup(PAYLOAD);

// https://encoding.spec.whatwg.org/#euc-jp-encoder
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
    } else if (codePoint === 0x00a5 /* ¥ */) {
      buf[byteOffset] = 0x5c; // \
      byteOffset++;
    } else if (codePoint === 0x203e /* ‾ */) {
      buf[byteOffset] = 0x7e; // ~
      byteOffset++;
    } else if (/* ｡ */ 0xff61 <= codePoint && codePoint <= 0xff9f /* ﾟ */) {
      buf[byteOffset] = 0x8e;
      buf[byteOffset + 1] = codePoint - 0xff61 + 0xa1;
      byteOffset += 2;
    } else {
      const pointer = lookupJis0208CodePoint(
        codePoint === 0x2212 /* − */ ? 0xff0d /* － */ : codePoint,
      );
      if (pointer === null) {
        buf[byteOffset] = 0x3f; // ?
        byteOffset++;
        continue;
      }
      const leading = Math.floor(pointer / 94) + 0xa1;
      const trailing = (pointer % 94) + 0xa1;
      buf[byteOffset] = leading;
      buf[byteOffset + 1] = trailing;
      byteOffset += 2;
    }
  }
  return buf.length !== byteOffset ? buf.slice(0, byteOffset) : buf;
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("euc-jp", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
