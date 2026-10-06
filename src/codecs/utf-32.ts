import type {
  DecodeOptions,
  Decoder,
  EncodeOptions,
  Encoder,
  Endianness,
} from "../interfaces.js";

const BYTE_ORDER_MARK = 0xfeff; // BOM
const MAX_CODE_POINT = 0x10ffff;

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
    dataView.setUint32(byteOffset, codePoint, isLittleEndian);
    byteOffset += 4;
  }

  return buf.byteLength !== byteOffset ? buf.slice(0, byteOffset) : buf;
};

const decode: Decoder<DecodeOptions & { endianness?: Endianness }> = (
  input,
  decodeOptions,
) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;
  const endianness = decodeOptions?.endianness ?? "little-endian";

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

  // https://jsbm.dev/OhV0sPKP2R441
  let output = "";
  for (let i = 0; i < dataView.byteLength; i += 4) {
    const codePoint = dataView.getUint32(i, isLittleEndian);
    if (codePoint > MAX_CODE_POINT) {
      output += "�";
      continue;
    }
    if (stripBOM && i === 0 && codePoint === BYTE_ORDER_MARK) {
      continue;
    }
    output += String.fromCodePoint(codePoint);
  }
  return output;
};

export { encode, decode };
