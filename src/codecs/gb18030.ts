import gb18030_ranges from "../../encodings/gb18030-ranges.json" with { type: "json" };
import { PAYLOAD } from "../../encodings/gb18030.js";
import type { Encoder, Decoder, EncodeOptions } from "../interfaces.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";
import { decodeVlqRunsLookup } from "../utils/vlqRuns.js";

// Code point -> pointer lookup over columnar runs of the GB 18030 reverse index,
// decoded once on module load (see `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`)
const lookupGb18030CodePoint = decodeVlqRunsLookup(PAYLOAD);

// -1 if not a code point with a value in the compatibility table. Using
// switch/case instead of sparse hash map due to performance
// (https://github.com/jeremy-code/iconv-nano/issues/27)
const getGb18030CompatBytes = (codePoint: number): number => {
  switch (codePoint) {
    case 0xe78d:
      return 0xa6d9;
    case 0xe78e:
      return 0xa6da;
    case 0xe78f:
      return 0xa6db;
    case 0xe790:
      return 0xa6dc;
    case 0xe791:
      return 0xa6dd;
    case 0xe792:
      return 0xa6de;
    case 0xe793:
      return 0xa6df;
    case 0xe794:
      return 0xa6ec;
    case 0xe795:
      return 0xa6ed;
    case 0xe796:
      return 0xa6f3;
    case 0xe81e:
      return 0xfe59;
    case 0xe826:
      return 0xfe61;
    case 0xe82b:
      return 0xfe66;
    case 0xe82c:
      return 0xfe67;
    case 0xe832:
      return 0xfe6d;
    case 0xe843:
      return 0xfe7e;
    case 0xe854:
      return 0xfe90;
    case 0xe864:
      return 0xfea0;
    default:
      return -1;
  }
};

// https://encoding.spec.whatwg.org/#indexes
const getGb18030RangesPointer = (codePoint: number) => {
  if (codePoint === 0xe7c7) {
    return 7457;
  }

  let rangeIndex = -1;
  let left = 0;
  let right = (gb18030_ranges.length >> 1) - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;

    // Code point offset of range `mid` is at the odd index
    if (gb18030_ranges[mid * 2 + 1]! <= codePoint) {
      rangeIndex = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  /* v8 ignore next -- all non-ASCII Unicode code points are covered by the GB18030 ranges */
  if (rangeIndex === -1) {
    throw new Error("Somehow, no range was found");
  }

  const pointerOffset = gb18030_ranges[rangeIndex * 2]!;
  const codePointOffset = gb18030_ranges[rangeIndex * 2 + 1]!;
  return pointerOffset + codePoint - codePointOffset;
};

// https://encoding.spec.whatwg.org/#gb18030-encoder
const encode: Encoder<EncodeOptions & { isGBK?: boolean }> = (
  input,
  encodeOptions,
) => {
  const length = input.length;
  const buf = new Uint8Array(length * 4);
  let isGBK = encodeOptions?.isGBK ?? false;
  let byteOffset = 0;

  for (let i = 0; i < length; i++) {
    const codePoint = input.codePointAt(i)!;
    if (codePoint > 0xffff) {
      i++;
    }
    if (isAsciiCodePoint(codePoint)) {
      buf[byteOffset] = codePoint;
      byteOffset++;
    } else if (codePoint === 0xe5e5) {
      buf[byteOffset] = 0x3f;
      byteOffset++;
    } else if (isGBK && codePoint === 0x20ac) {
      buf[byteOffset] = 0x80;
      byteOffset++;
    } else {
      const compatBytes = getGb18030CompatBytes(codePoint);

      if (compatBytes !== -1) {
        buf[byteOffset] = compatBytes >> 8;
        buf[byteOffset + 1] = compatBytes & 0xff;
        byteOffset += 2;
        continue;
      }

      let pointer = lookupGb18030CodePoint(codePoint);

      if (pointer !== -1) {
        const leading = Math.floor(pointer / 190) + 0x81;
        const trailing = pointer % 190;
        const offset = trailing < 0x3f ? 0x40 : 0x41;
        buf[byteOffset] = leading;
        buf[byteOffset + 1] = trailing + offset;
        byteOffset += 2;
        continue;
      }

      if (isGBK) {
        buf[byteOffset] = 0x3f;
        byteOffset += 1;
        continue;
      }

      pointer = getGb18030RangesPointer(codePoint);
      const byte1 = Math.floor(pointer / (10 * 126 * 10));
      pointer = pointer % (10 * 126 * 10);
      const byte2 = Math.floor(pointer / (10 * 126));
      pointer = pointer % (10 * 126);
      const byte3 = Math.floor(pointer / 10);
      const byte4 = pointer % 10;
      buf[byteOffset] = byte1 + 0x81;
      buf[byteOffset + 1] = byte2 + 0x30;
      buf[byteOffset + 2] = byte3 + 0x81;
      buf[byteOffset + 3] = byte4 + 0x30;
      byteOffset += 4;
    }
  }
  return buf.length !== byteOffset ? buf.slice(0, byteOffset) : buf;
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("gb18030", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
