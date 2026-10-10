import { isAsciiCodePoint } from "./isAsciiCodePoint.js";

// https://encoding.spec.whatwg.org/#single-byte-encoder
// https://encoding.spec.whatwg.org/#legacy-single-byte-encodings
const encodeSingleByteEncoding = (
  input: string,
  encodingIndex: (number | null)[],
): Uint8Array<ArrayBuffer> => {
  const buf = new Uint8Array(input.length);
  let byteOffset = 0;
  // for...of loop is faster
  // https://jsbm.dev/YK2fFDSwJPc6E
  // https://github.com/jeremy-code/iconv-nano/issues/3
  for (const char of input) {
    // non-null, 0 is never larger than input.length
    const codePoint = char.codePointAt(0)!;
    if (isAsciiCodePoint(codePoint)) {
      buf[byteOffset] = codePoint;
    } else {
      const byte = encodingIndex.indexOf(codePoint);
      buf[byteOffset] = byte !== -1 ? 0x80 + byte : 0x3f; /* ? */
    }
    byteOffset++;
  }
  return buf.slice(0, byteOffset);
};

export { encodeSingleByteEncoding };
