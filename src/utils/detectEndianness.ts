import type { Endianness, BufferSource } from "../interfaces.js";

const detectEndianness = (input: BufferSource): Endianness | undefined => {
  const bytes =
    input instanceof Uint8Array
      ? input
      : ArrayBuffer.isView(input)
        ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
        : new Uint8Array(input);

  if (bytes.length < 2) {
    return undefined;
  }

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "little-endian";
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return "big-endian";
  }

  return undefined;
};

export { detectEndianness };
