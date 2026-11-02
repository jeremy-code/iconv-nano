import type { Endianness, BufferSource } from "../interfaces.js";

const BYTE_ORDER_MARK = 0xfeff;

const detectEndianness = (input: BufferSource): Endianness | undefined => {
  if (input.byteLength < 2) {
    return undefined;
  }

  const bytes =
    input instanceof Uint8Array
      ? input
      : ArrayBuffer.isView(input)
        ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
        : new Uint8Array(input);

  if (
    bytes[0] === (BYTE_ORDER_MARK & 0xff) &&
    bytes[1] === ((BYTE_ORDER_MARK >> 8) & 0xff)
  ) {
    return "little-endian";
  } else if (
    bytes[0] === ((BYTE_ORDER_MARK >> 8) & 0xff) &&
    bytes[1] === (BYTE_ORDER_MARK & 0xff)
  ) {
    return "big-endian";
  }

  return undefined;
};

export { detectEndianness };
