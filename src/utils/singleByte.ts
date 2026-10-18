// Blocks only cover the Basic Multilingual Plane range
const BLOCK_SHIFT = 8;
const BLOCK_MASK: number = (1 << BLOCK_SHIFT) - 1; /* 255 (0xff) */
const BLOCK_SIZE = 1 << BLOCK_SHIFT; // 256 (0x100)
const BMP_SIZE = 0x10000; /* Basic Multilingual Plane */
// All single-byte encodings have exactly 128 entries since they are all ASCII-compatible. Hence, valid indices range from 0 to 127.
const UNMAPPED = 0xff;

type SingleByteTable = {
  blockIds: Uint16Array<ArrayBuffer>;
  table: Uint8Array<ArrayBuffer>;
};

// Builds an ICU-style two-stage table
const buildSingleByteTable = (values: number[]): SingleByteTable => {
  const blockIds = new Uint16Array(/* 256 */ BMP_SIZE >> BLOCK_SHIFT);
  let blockCount = 1;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (
      value === undefined ||
      !Number.isInteger(value) ||
      value < 0 ||
      value >= BMP_SIZE
    ) {
      continue;
    }
    const high = value >> BLOCK_SHIFT;
    if (blockIds[high] === 0) {
      blockIds[high] = blockCount++;
    }
  }

  const table = new Uint8Array(blockCount * BLOCK_SIZE).fill(UNMAPPED);
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (
      value === undefined ||
      !Number.isInteger(value) ||
      value < 0 ||
      value >= BMP_SIZE
    ) {
      continue;
    }
    table[
      (blockIds[value >> BLOCK_SHIFT]! << BLOCK_SHIFT) | (value & BLOCK_MASK)
    ] = index;
  }

  return { blockIds, table };
};

type SingleByteLookup = (codePoint: number) => number;

/**
 * Creates a lookup mapping code points to bytes, or -1 when the code point is
 * not in the index.
 *
 * The code points array is materialized into a two-stage table
 */
const createSingleByteLookup = /* @__NO_SIDE_EFFECTS__ */ (
  values: number[],
): SingleByteLookup => {
  const { blockIds, table } = buildSingleByteTable(values);
  return (codePoint) => {
    if (codePoint < 0 || codePoint >= BMP_SIZE) {
      return -1;
    }
    const block = blockIds[codePoint >> BLOCK_SHIFT]!;
    if (block === 0) {
      return -1;
    }
    const byte = table[(block << BLOCK_SHIFT) | (codePoint & BLOCK_MASK)]!;
    return byte === UNMAPPED ? -1 : byte;
  };
};

export {
  type SingleByteTable,
  buildSingleByteTable,
  type SingleByteLookup,
  createSingleByteLookup,
};
