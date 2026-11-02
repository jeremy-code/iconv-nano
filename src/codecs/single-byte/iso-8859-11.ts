import type { Encoder, Decoder } from "../../interfaces.js";
import { codePointsToString } from "../../utils/codePointsToString.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { isAsciiCodePoint } from "../../utils/isAsciiCodePoint.js";

const lookupIso885911CodePoint = (codePoint: number) => {
  if (codePoint === 0xa0 /* non-breaking space */) {
    return 0xa0 - 0x80;
  } else if (
    /* ก */ (0xe01 <= codePoint && codePoint <= 0xe3a) /* ฺ */ ||
    /* ฿ */ (0xe3f <= codePoint && codePoint <= 0xe5b) /* ๛ */
  ) {
    return codePoint - (0xe01 - 0xa1) - 0x80;
  }
  return -1;
};

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, lookupIso885911CodePoint);
};

const decode: Decoder = (input) => {
  const inputBuf =
    input instanceof Uint8Array
      ? input
      : ArrayBuffer.isView(input)
        ? new Uint8Array(input.buffer, input.byteLength, input.byteOffset)
        : new Uint8Array(input);

  // oxlint-disable-next-line unicorn/no-new-array
  const outputArr = new Array(inputBuf.length).fill(0xfffd);

  for (let i = 0; i < inputBuf.length; i++) {
    const byte = inputBuf[i]!;

    if (isAsciiCodePoint(byte) || byte === 0xa0) {
      outputArr[i] = byte;
    } else if (
      (0xa1 <= byte && byte <= 0xda) ||
      (0xdf <= byte && byte <= 0xfb)
    ) {
      outputArr[i] = byte - 0xa1 + 0xe01;
    }
  }

  return codePointsToString(outputArr);
};

export { encode, decode };
