// Blocks only cover the Basic Multilingual Plane range
const BMP_SIZE = 0x10000;
const BLOCK_COUNT = BMP_SIZE >> 8; // 256
const BLOCK_SIZE = 256;
const NO_BLOCK = 0x00;
// All single-byte encodings have exactly 128 entries since they are all ASCII-compatible. Hence, valid indices range from 0 to 127.
const UNMAPPED = 0xff;

type SingleByteTable = {
  blockIds: Uint16Array<ArrayBuffer>;
  table: Uint8Array<ArrayBuffer>;
};

// Builds an ICU-style two-stage table
const buildSingleByteTable = (codePoints: number[]): SingleByteTable => {
  const blockIds = new Uint16Array(BLOCK_COUNT).fill(NO_BLOCK);
  let blockCount = 1;
  for (let i = 0; i < codePoints.length; i++) {
    const codePoint = codePoints[i];
    if (codePoint === undefined || codePoint < 0 || codePoint > BMP_SIZE) {
      continue;
    }
    const high = codePoint >> 8;
    if (blockIds[high] === 0) {
      blockIds[high] = blockCount;
      blockCount++;
    }
  }
  const table = new Uint8Array(blockCount * BLOCK_SIZE).fill(UNMAPPED);
  for (let i = 0; i < codePoints.length; i++) {
    const codePoint = codePoints[i];
    if (codePoint === undefined || codePoint < 0 || codePoint > BMP_SIZE) {
      continue;
    }
    table[(blockIds[codePoint >> 8]! << 8) | (codePoint & 0xff)] = i;
  }
  return { blockIds, table };
};

type SingleByteLookup = (codePoint: number) => number;

/**
 * Creates a lookup mapping code points to bytes, or -1 when the code point is
 * not in the index.
 *
 * The code points array is materialized into a two-stage table
 * (stage 1: block per code point >> 8, stage 2: pointer values)
 */
const createSingleByteLookup = /* @__NO_SIDE_EFFECTS__ */ (
  values: number[],
): SingleByteLookup => {
  const { blockIds, table } = buildSingleByteTable(values);
  return (codePoint) => {
    if (codePoint < 0 || codePoint > BMP_SIZE) {
      return -1;
    }
    const block = blockIds[codePoint >> 8]!;
    if (block === NO_BLOCK) {
      return -1;
    }
    const pointer = table[(block << 8) | (codePoint & 0xff)]!;
    return pointer === UNMAPPED ? -1 : pointer;
  };
};

export {
  type SingleByteTable,
  buildSingleByteTable,
  type SingleByteLookup,
  createSingleByteLookup,
};
