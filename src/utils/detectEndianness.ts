import type { Endianness, BufferSource } from "../interfaces.js";

const BYTE_ORDER_MARK = 0xfeff;

/**
 * @param bytesPerElement - Number of bytes per element (e.g. UTF-16 = 2, UTF-32
 *                          = 4)
 */
const detectEndianness = (
  input: BufferSource,
  bytesPerElement = 2,
): Endianness | undefined => {
  if (input.byteLength < bytesPerElement) {
    return undefined;
  }

  const bytes =
    input instanceof Uint8Array
      ? input
      : ArrayBuffer.isView(input)
        ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
        : new Uint8Array(input);

  // Little-endian BOM: FF FE [00 ...]
  if (
    bytes[0] === (BYTE_ORDER_MARK & 0xff) &&
    bytes[1] === ((BYTE_ORDER_MARK >> 8) & 0xff)
  ) {
    for (let index = 2; index < bytesPerElement; index++) {
      if (bytes[index] !== 0) {
        return undefined;
      }
    }
    return "little-endian";
  }

  // Big-endian BOM: [00 ...] FE FF
  if (
    bytes[bytesPerElement - 2] === ((BYTE_ORDER_MARK >> 8) & 0xff) &&
    bytes[bytesPerElement - 1] === (BYTE_ORDER_MARK & 0xff)
  ) {
    for (let index = 0; index < bytesPerElement - 2; index++) {
      if (bytes[index] !== 0) {
        return undefined;
      }
    }
    return "big-endian";
  }

  return undefined;
};

export { detectEndianness };
