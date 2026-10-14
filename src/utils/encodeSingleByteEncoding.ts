import { isAsciiCodePoint } from "./isAsciiCodePoint.js";

// https://encoding.spec.whatwg.org/#single-byte-encoder
// https://encoding.spec.whatwg.org/#legacy-single-byte-encodings
const encodeSingleByteEncoding = (
  input: string,
  encodingIndex: Record<number, number>,
): Uint8Array<ArrayBuffer> => {
  const buf = new Uint8Array(input.length);
  let byteOffset = 0;
  // Avoid re-encoding surrogate pairs
  // https://github.com/jeremy-code/iconv-nano/issues/3
  for (let i = 0; i < input.length; i++) {
    // non-null, i is never larger than input.length
    const codePoint = input.codePointAt(i)!;
    if (codePoint > 0xffff) {
      i++;
    }

    if (isAsciiCodePoint(codePoint)) {
      buf[byteOffset] = codePoint;
    } else {
      const byte = encodingIndex[codePoint];
      buf[byteOffset] = byte !== undefined ? 0x80 + byte : 0x3f; /* ? */
    }
    byteOffset++;
  }
  return buf.slice(0, byteOffset);
};

export { encodeSingleByteEncoding };
