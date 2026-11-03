import type {
  DecodeOptions,
  Decoder,
  EncodeOptions,
  Encoder,
  Endianness,
} from "../interfaces.js";
import { detectEndianness } from "../utils/detectEndianness.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";

const BYTE_ORDER_MARK = 0xfeff; // BOM in UTF-16
const REPLACEMENT_CHARACTER = 0xfffd;

const encode: Encoder<EncodeOptions & { endianness?: Endianness }> = (
  input,
  options,
) => {
  const addBOM = options?.addBOM ?? false;
  const endianness = options?.endianness ?? "little-endian";
  const isLittleEndian = endianness === "little-endian";

  const data = new Uint8Array(input.length * 2 + (addBOM ? 2 : 0));
  // According to benchmarking on both the DOM and WebWorker, using a DataView
  // is about as fast as using a Uint16Array, even on the native platform's
  // endianness. Hence, handle both cases with DataView for simplicity.
  // https://jsbm.dev/ATDUeL7y9nnz8
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let byteOffset = 0;

  if (addBOM) {
    dataView.setUint16(byteOffset, BYTE_ORDER_MARK, isLittleEndian);
    byteOffset += 2;
  }

  for (let i = 0; i < input.length; i++) {
    const codePoint = input.codePointAt(i)!;
    if (codePoint > 0xffff) {
      i++;
    }

    if (0xd800 <= codePoint && codePoint <= 0xdfff) {
      // Lone surrogate
      dataView.setUint16(byteOffset, REPLACEMENT_CHARACTER, isLittleEndian);
      byteOffset += 2;
    } else if (0x10000 <= codePoint && codePoint <= 0x10ffff) {
      // https://en.wikipedia.org/wiki/UTF-16#Code_points_from_U+010000_to_U+10FFFF
      const highSurrogate = ((codePoint - 0x10000) >> 10) + 0xd800;
      const lowSurrogate = ((codePoint - 0x10000) & 0x3ff) + 0xdc00;

      dataView.setUint16(byteOffset, highSurrogate, isLittleEndian);
      dataView.setUint16(byteOffset + 2, lowSurrogate, isLittleEndian);
      byteOffset += 4;
    } else {
      dataView.setUint16(byteOffset, codePoint, isLittleEndian);
      byteOffset += 2;
    }
  }

  return data;
};

const decode: Decoder<
  DecodeOptions & { endianness?: Endianness; detectEndianness?: boolean }
> = (input, decodeOptions) => {
  const detectedEndianness = decodeOptions?.detectEndianness
    ? detectEndianness(input)
    : undefined;
  const stripBOM = decodeOptions?.stripBOM ?? true;
  const endianness =
    detectedEndianness ?? decodeOptions?.endianness ?? "little-endian";

  return getCachedTextDecoder(
    endianness === "little-endian" ? "utf-16le" : "utf-16be",
    { fatal: false, ignoreBOM: !stripBOM },
  ).decode(input);
};

export { encode, decode };
