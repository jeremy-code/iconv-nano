// Runtime decoder for VLQ-encoded run-length reverse indexes
// written by `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_VALUE: Uint8Array = /* @__PURE__ */ (() => {
  const table = new Uint8Array(128).fill(255);
  for (let i = 0; i < B64.length; i++) {
    table[B64.charCodeAt(i)] = i;
  }
  return table;
})();

const decodeVlqStream = (stream: string): number[] => {
  const values: number[] = [];
  let i = 0;
  while (i < stream.length) {
    let value = 0;
    let shift = 0;
    let digit: number;
    do {
      digit = B64_VALUE[stream.charCodeAt(i++)]!;
      value += (digit & 31) << shift;
      shift += 5;
    } while ((digit & 32) !== 0);
    values.push((value & 1) === 1 ? -(value >>> 1) : value >>> 1);
  }
  return values;
};

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
 */
const decodeVlqRuns = (payload: VlqRunsPayload): VlqRuns => {
  const [firstCp, firstPtr, cpGaps, counts, ptrGaps] = payload.split(".");
  const runCounts = decodeVlqStream(counts!);
  const runCpGaps = decodeVlqStream(cpGaps!);
  const runPtrGaps = decodeVlqStream(ptrGaps!);
  const cpStarts: number[] = [];
  const ptrStarts: number[] = [];
  let cpStart = decodeVlqStream(firstCp!)[0]!;
  let ptrStart = decodeVlqStream(firstPtr!)[0]!;
  for (let i = 0; i < runCounts.length; i++) {
    const count = runCounts[i]!;
    cpStarts.push(cpStart);
    ptrStarts.push(ptrStart);
    cpStart += count + runCpGaps[i]!;
    ptrStart += count + runPtrGaps[i]!;
  }
  return { cpStarts, ptrStarts, counts: runCounts };
};

type VlqRunsTable = {
  /** block id per code point >> 8, -1 when the block has no mapped code point */
  blockIds: Int32Array;
  /** pointers laid out per 256-code-point block, 0xffff = unmapped */
  table: Uint16Array;
};

// Blocks cover the full Unicode code point range: some indexes (big5) map astral code points
// See https://encoding.spec.whatwg.org/#index-big5-pointer
const BLOCK_COUNT = (0x10ffff >> 8) + 1;
const BLOCK_SIZE = 256;

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
  const blockIds = new Int32Array(BLOCK_COUNT).fill(-1);
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

type VlqRunsLookup = (codePoint: number) => number | null;

/**
 * Decodes a VLQ runs payload and returns a lookup mapping code points to pointers,
 * or null when the code point is not in the index.
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
      return null;
    }
    const block = blockIds[codePoint >> 8]!;
    if (block < 0) {
      return null;
    }
    const pointer = table[(block << 8) | (codePoint & 0xff)]!;
    return pointer === 0xffff ? null : pointer;
  };
};

export { decodeVlqRuns, decodeVlqRunsLookup };
export type { VlqRuns, VlqRunsPayload };
