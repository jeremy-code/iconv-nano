// Runtime decoder for VLQ-encoded run-length reverse indexes
// written by `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_VALUE: Uint8Array = (() => {
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
  /** first code point of each run, sorted */
  cpStarts: number[];
  /** first pointer of each run */
  ptrStarts: number[];
  /** run lengths */
  counts: number[];
};

/**
 * Decodes a `<code point start deltas>.<pointer start deltas>.<counts>`
 * payload into columnar run arrays (runs are code point-sorted)
 */
const decodeVlqRuns = (payload: VlqRunsPayload): VlqRuns => {
  const [cpDeltas, ptrDeltas, counts] = payload.split(".");
  const cpStarts = decodeVlqStream(cpDeltas!);
  const ptrStarts = decodeVlqStream(ptrDeltas!);
  const runCounts = decodeVlqStream(counts!);
  let cpStart = 0;
  let ptrStart = 0;
  for (let i = 0; i < runCounts.length; i++) {
    cpStarts[i] = cpStart += cpStarts[i]!;
    ptrStarts[i] = ptrStart += ptrStarts[i]!;
  }
  return { cpStarts, ptrStarts, counts: runCounts };
};

/**
 * Decodes a VLQ runs payload and returns a lookup mapping code points to pointers,
 * or null when the code point is not in the index.
 *
 * The returned closure captures the columnar arrays and hoisted run count
 * so the binary search hot loop stays monomorphic
 */
const decodeVlqRunsLookup = (
  payload: VlqRunsPayload,
): ((codePoint: number) => number | null) => {
  const { cpStarts, ptrStarts, counts } = decodeVlqRuns(payload);
  const runCount = cpStarts.length;
  return (codePoint) => {
    let lo = 0;
    let hi = runCount;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cpStarts[mid]! <= codePoint) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    const last = lo - 1;
    if (last < 0) {
      return null;
    }
    const cpStart = cpStarts[last]!;
    return codePoint < cpStart + counts[last]!
      ? ptrStarts[last]! + (codePoint - cpStart)
      : null;
  };
};

export { decodeVlqRuns, decodeVlqRunsLookup };
export type { VlqRuns, VlqRunsPayload };
