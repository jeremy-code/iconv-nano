import type { Encoder, Decoder } from "../interfaces.js";
import { lookupJis0208CodePoint } from "../shared/lookupJis0208CodePoint.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";

/**
 * The Shift_JIS index is the JIS0208 index with pointers 0x2050 to 0x2283 (the
 * NEC-selected IBM extended characters) excluded. When a pointer is in that
 * range, we instead use the duplicate pointer (0x29DC to 0x2B5F) in the IBM
 * extension area.
 *
 * @see {@link https://itpfdoc.hitachi.co.jp/manuals/3021/30213j4610e/HJ460341.HTM#winnec}
 * @see {@link https://encoding.spec.whatwg.org/#index-shift_jis-pointer}
 */
const lookupShiftJisCodePoint = (codePoint: number): number => {
  const pointer = lookupJis0208CodePoint(codePoint);

  // STEP_1
  if (!(0x2050 <= pointer && pointer <= 0x2283)) {
    return pointer;
  }

  // For example: 黑 maps to 0x21b7 in JIS0208 and 0x2B5F in Shift_JIS
  // 0x2B5F - 0x21b7 = 2472
  if (0x2050 /* 纊 */ <= pointer && pointer <= 0x21b7 /* 黑 */) {
    return pointer + 2472;
  }
  // For example: ⅰ maps to 0x21ba in JIS0208 and 0x29DC in Shift_JIS
  // 0x29DC - 0x21ba = 2082
  if (0x21ba /* ⅰ */ <= pointer && pointer <= 0x21c3 /* ⅹ */) {
    return pointer + 2082;
  }
  // For example: ￤ maps to 0x21c5 in JIS0208 and 0x29F1 in Shift_JIS
  // 0x29F1 - 0x21c5 = 2092
  if (0x21c5 /* ￤ */ <= pointer && pointer <= 0x21c7 /* ＂ */) {
    return pointer + 2092;
  }
  /* v8 ignore start -- Should not happen. For these 191 pointers, they never appear because they are unmapped or have an earlier pointer */
  return -1;
};

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
      if (pointer === -1) {
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
