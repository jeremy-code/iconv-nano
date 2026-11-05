import type {
  DecodeOptions,
  Decoder,
  EncodeOptions,
  Encoder,
  Endianness,
} from "../interfaces.js";
import { detectEndianness } from "../utils/detectEndianness.js";

const BYTE_ORDER_MARK = 0xfeff; // BOM
const MAX_CODE_POINT = 0x10ffff;
const REPLACEMENT_CHARACTER = 0xfffd;

const encode: Encoder<EncodeOptions & { endianness?: Endianness }> = (
  input,
  options,
) => {
  const addBOM = options?.addBOM ?? false;
  const endianness = options?.endianness ?? "little-endian";
  const isLittleEndian = endianness === "little-endian";

  const buf = new Uint8Array(input.length * 4 + (addBOM ? 4 : 0));
  const dataView = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let byteOffset = 0;

  if (addBOM) {
    dataView.setUint32(byteOffset, BYTE_ORDER_MARK, isLittleEndian);
    byteOffset += 4;
  }

  for (let i = 0; i < input.length; i++) {
    const codePoint = input.codePointAt(i)!;
    if (codePoint > 0xffff) {
      i++;
    }

    if (0xd800 <= codePoint && codePoint <= 0xdfff) {
      // Lone surrogate
      dataView.setUint32(byteOffset, REPLACEMENT_CHARACTER, isLittleEndian);
      byteOffset += 4;
    } else {
      dataView.setUint32(byteOffset, codePoint, isLittleEndian);
      byteOffset += 4;
    }
  }

  return buf.byteLength !== byteOffset ? buf.slice(0, byteOffset) : buf;
};

const decode: Decoder<
  DecodeOptions & { endianness?: Endianness; detectEndianness?: boolean }
> = (input, decodeOptions) => {
  const detectedEndianness = decodeOptions?.detectEndianness
    ? detectEndianness(input, 4)
    : undefined;
  const stripBOM = decodeOptions?.stripBOM ?? true;
  const endianness =
    detectedEndianness ?? decodeOptions?.endianness ?? "little-endian";

  if (input.byteLength === 0) {
    return "";
  }

  const dataView =
    input instanceof DataView
      ? input
      : ArrayBuffer.isView(input)
        ? new DataView(input.buffer, input.byteOffset, input.byteLength)
        : new DataView(input);
  const isLittleEndian = endianness === "little-endian";
  const codePointsLength = dataView.byteLength - (dataView.byteLength % 4);

  // https://jsbm.dev/OhV0sPKP2R441
  let output = "";
  for (let i = 0; i < codePointsLength; i += 4) {
    const codePoint = dataView.getUint32(i, isLittleEndian);
    if (
      (0xd800 <= codePoint && codePoint <= 0xdfff) /* lone surrogate */ ||
      MAX_CODE_POINT < codePoint
    ) {
      output += "\ufffd";
      continue;
    }
    if (stripBOM && i === 0 && codePoint === BYTE_ORDER_MARK) {
      continue;
    }
    output += String.fromCodePoint(codePoint);
  }
  if (codePointsLength !== dataView.byteLength) {
    output += "\ufffd";
  }
  return output;
};

export { encode, decode };
