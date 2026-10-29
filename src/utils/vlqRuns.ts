// Runtime decoder for VLQ-encoded run-length reverse indexes
// written by `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_VALUE: Uint8Array<ArrayBuffer> = /* @__PURE__ */ (() => {
  const table = new Uint8Array(128).fill(255);
  for (let i = 0; i < B64.length; i++) {
    table[B64.charCodeAt(i)] = i;
  }
  return table;
})();

type VlqRunsPayload = string & { __type: "VlqRunsPayload" };

type VlqRuns = {
  /** first code point of each run (runs are pointer-ordered) */
  cpStarts: number[];
  /** first pointer of each run */
  ptrStarts: number[];
  /** run lengths */
  counts: number[];
};

/**
 * Decodes a `<first code point>.<first pointer>.<cp gaps>.<counts>.<pointer gaps>` payload into columnar run arrays
 * (runs are pointer-ordered; both gap columns hold the distance from the end of one run to the start of the next)
 *
 * Decoding the VLQ stream and creating the columnar run arrays is done in one pass without an intermediate array
 * for performance (hence, some code duplication in regards to decodeVlq).
 *
 * @see {@link https://github.com/jeremy-code/iconv-nano/pull/15}
 */
const decodeVlqRuns = (payload: VlqRunsPayload): VlqRuns => {
  const firstCpEnd = payload.indexOf(".");
  const firstPtrEnd = payload.indexOf(".", firstCpEnd + 1);
  const cpGapsEnd = payload.indexOf(".", firstPtrEnd + 1);
  const countsEnd = payload.indexOf(".", cpGapsEnd + 1);

  const decodeVlq = (start: number): number => {
    let value = 0;
    let shift = 0;
    let digit: number;
    do {
      digit = B64_VALUE[payload.charCodeAt(start++)]!;
      value += (digit & 31) << shift;
      shift += 5;
    } while ((digit & 32) !== 0); // Loop while continuation bit = 1
    // https://en.wikipedia.org/wiki/Variable-length_integer#Zigzag_encoding
    return (value & 1) === 1 ? -(value >>> 1) : value >>> 1;
  };

  let cpStart = decodeVlq(0);
  let ptrStart = decodeVlq(firstCpEnd + 1);
  let cpGapIndex = firstPtrEnd + 1;
  let countIndex = cpGapsEnd + 1;
  let ptrGapIndex = countsEnd + 1;
  const capacity = countsEnd - countIndex;
  const cpStarts = new Int32Array(capacity);
  const ptrStarts = new Int32Array(capacity);
  const runCounts = new Int32Array(capacity);

  let runCount = 0;
  while (countIndex < countsEnd) {
    // Equivalent to decodeVlq, inlining as countIndex needs to be mutated
    let value = 0;
    let shift = 0;
    let digit: number;
    do {
      digit = B64_VALUE[payload.charCodeAt(countIndex++)]!;
      value += (digit & 31) << shift;
      shift += 5;
    } while ((digit & 32) !== 0);
    const count = (value & 1) === 1 ? -(value >>> 1) : value >>> 1;
    cpStarts[runCount] = cpStart;
    ptrStarts[runCount] = ptrStart;
    runCounts[runCount] = count;
    runCount++;

    let runCpGap = 0;
    if (cpGapIndex < cpGapsEnd) {
      // Equivalent to decodeVlq, inlining as cpGapIndex needs to be mutated
      value = 0;
      shift = 0;
      do {
        digit = B64_VALUE[payload.charCodeAt(cpGapIndex++)]!;
        value += (digit & 31) << shift;
        shift += 5;
      } while ((digit & 32) !== 0);
      runCpGap = (value & 1) === 1 ? -(value >>> 1) : value >>> 1;
    }
    let runPtrGap = 0;
    if (ptrGapIndex < payload.length) {
      // Equivalent to decodeVlq, inlining as ptrGapIndex needs to be mutated
      value = 0;
      shift = 0;
      do {
        digit = B64_VALUE[payload.charCodeAt(ptrGapIndex++)]!;
        value += (digit & 31) << shift;
        shift += 5;
      } while ((digit & 32) !== 0);
      runPtrGap = (value & 1) === 1 ? -(value >>> 1) : value >>> 1;
    }
    cpStart += count + runCpGap;
    ptrStart += count + runPtrGap;
  }

  return {
    cpStarts: Array.from(cpStarts.subarray(0, runCount)),
    ptrStarts: Array.from(ptrStarts.subarray(0, runCount)),
    counts: Array.from(runCounts.subarray(0, runCount)),
  };
};

type VlqRunsTable = {
  /** block id per code point >> 8, NO_BLOCK when the block has no mapped code point */
  blockIds: Uint16Array<ArrayBuffer>;
  /** pointers laid out per 256-code-point block, 0xffff = unmapped */
  table: Uint16Array<ArrayBuffer>;
};

// Blocks cover the full Unicode code point range: some indexes (big5) map astral code points
// See https://encoding.spec.whatwg.org/#index-big5-pointer
const BLOCK_COUNT = (0x10ffff >> 8) + 1; // 4352
const BLOCK_SIZE = 256;
// At most BLOCK_COUNT (4352) blocks exist, so 0xffff is never a block id
const NO_BLOCK = 0xffff;

// Builds an ICU-style two-stage table:
// O(1) lookups costing ~0.1 ms of build time and 512 B per used 256-code-point block.
// WHATWG index pointers stay below 0xffff, so it doubles as the unmapped sentinel.
const buildVlqRunsTable = (runs: VlqRuns): VlqRunsTable => {
  const { cpStarts, ptrStarts, counts } = runs;
  const present = new Uint8Array(BLOCK_COUNT);
  for (let i = 0; i < cpStarts.length; i++) {
    const firstBlock = cpStarts[i]! >> 8;
    const lastBlock = (cpStarts[i]! + counts[i]! - 1) >> 8;
    for (let block = firstBlock; block <= lastBlock; block++) {
      present[block] = 1;
    }
  }
  const blockIds = new Uint16Array(BLOCK_COUNT).fill(NO_BLOCK);
  let usedBlocks = 0;
  for (let block = 0; block < BLOCK_COUNT; block++) {
    if (present[block] === 1) {
      blockIds[block] = usedBlocks++;
    }
  }
  const table = new Uint16Array(usedBlocks * BLOCK_SIZE).fill(0xffff);
  for (let i = 0; i < cpStarts.length; i++) {
    const cpStart = cpStarts[i]!;
    const pointerStart = ptrStarts[i]!;
    const count = counts[i]!;
    for (let codePoint = cpStart; codePoint < cpStart + count; codePoint++) {
      table[(blockIds[codePoint >> 8]! << 8) | (codePoint & 0xff)] =
        pointerStart + (codePoint - cpStart);
    }
  }
  return { blockIds, table };
};

type VlqRunsLookup = (codePoint: number) => number;

/**
 * Decodes a VLQ runs payload and returns a lookup mapping code points to pointers,
 * or -1 when the code point is not in the index.
 *
 * The payload is materialized into a two-stage table
 * (stage 1: block per code point >> 8, stage 2: pointer values)
 * captured by the returned closure, so each lookup is two typed array loads.
 */
const decodeVlqRunsLookup = /* @__NO_SIDE_EFFECTS__ */ (
  payload: VlqRunsPayload,
): VlqRunsLookup => {
  const { blockIds, table } = buildVlqRunsTable(decodeVlqRuns(payload));
  return (codePoint) => {
    if (codePoint < 0 || codePoint > 0x10ffff) {
      return -1;
    }
    const block = blockIds[codePoint >> 8]!;
    if (block === NO_BLOCK) {
      return -1;
    }
    const pointer = table[(block << 8) | (codePoint & 0xff)]!;
    return pointer === 0xffff ? -1 : pointer;
  };
};

export { decodeVlqRuns, decodeVlqRunsLookup };
export type { VlqRuns, VlqRunsPayload, VlqRunsLookup };
