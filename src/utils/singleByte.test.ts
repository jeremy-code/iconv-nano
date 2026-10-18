import { describe, expect, it } from "vitest";

import { buildSingleByteTable, createSingleByteLookup } from "./singleByte.js";

const BLOCK_SIZE = 0x100;
const BMP_SIZE = 0x10000;
const UNMAPPED = 0xff;

describe("buildSingleByteTable", () => {
  it("creates an empty table when no values are provided", () => {
    const { blockIds, table } = buildSingleByteTable([]);

    expect(blockIds).toHaveLength(BMP_SIZE / BLOCK_SIZE);
    expect(blockIds).toEqual(new Uint16Array(BMP_SIZE / BLOCK_SIZE));
    expect(table).toEqual(new Uint8Array(BLOCK_SIZE).fill(UNMAPPED));
  });

  it("assigns compact block IDs in order of first occurrence", () => {
    const values = [0x1234, 0x0041, 0x12ff, 0xabcd];

    const { blockIds, table } = buildSingleByteTable(values);

    expect(blockIds[0x12]).toBe(1);
    expect(blockIds[0]).toBe(2);
    expect(blockIds[0xab]).toBe(3);

    // One reserved block plus three allocated blocks.
    expect(table).toHaveLength(4 * BLOCK_SIZE);

    expect(table[(1 << 8) | 0x34]).toBe(0);
    expect(table[(2 << 8) | 0x41]).toBe(1);
    expect(table[(1 << 8) | 0xff]).toBe(2);
    expect(table[(3 << 8) | 0xcd]).toBe(3);
  });

  it("reuses an existing block for values with the same high byte", () => {
    const values = [0x1234, 0x1278, 0x12ab];

    const { blockIds, table } = buildSingleByteTable(values);

    expect(blockIds[0x12]).toBe(1);
    expect(table).toHaveLength(2 * BLOCK_SIZE);

    expect(table[(1 << 8) | 0x34]).toBe(0);
    expect(table[(1 << 8) | 0x78]).toBe(1);
    expect(table[(1 << 8) | 0xab]).toBe(2);
  });

  it("initializes unmapped table entries to 0xff", () => {
    const { table } = buildSingleByteTable([0x0041]);

    expect(table[0]).toBe(UNMAPPED);
    expect(table[(1 << 8) | 0x41]).toBe(0);
    expect(table[(1 << 8) | 0x42]).toBe(UNMAPPED);
    expect(table[(1 << 8) | 0xff]).toBe(UNMAPPED);
  });

  it("ignores undefined, non-integer, negative, and out-of-range values", () => {
    const values: number[] = [];

    // Leave index 1 as a hole, which produces undefined during iteration.
    values[0] = 0x0041;
    values[2] = -1;
    values[3] = Number.NaN;
    values[4] = Number.POSITIVE_INFINITY;
    values[5] = 1.5;
    values[6] = BMP_SIZE;
    values[7] = 0xffff;

    const { blockIds, table } = buildSingleByteTable(values);

    // Only U+0041 and U+FFFF allocate blocks.
    expect(blockIds[0]).toBe(1);
    expect(blockIds[0xff]).toBe(2);
    expect(table).toHaveLength(3 * BLOCK_SIZE);

    // Original array indices are preserved.
    expect(table[(1 << 8) | 0x41]).toBe(0);
    expect(table[(2 << 8) | 0xff]).toBe(7);
  });

  it("uses the last index when a code point occurs more than once", () => {
    const { blockIds, table } = buildSingleByteTable([0x0041, 0x0042, 0x0041]);

    expect(table[(blockIds[0]! << 8) | 0x41]).toBe(2);
  });

  it("handles the first and last BMP code points", () => {
    const { blockIds, table } = buildSingleByteTable([0x0000, 0xffff]);

    expect(table[(blockIds[0]! << 8) | 0x00]).toBe(0);
    expect(table[(blockIds[0xff]! << 8) | 0xff]).toBe(1);
  });
});

describe("createSingleByteLookup", () => {
  it("returns the index for mapped code points", () => {
    const lookup = createSingleByteLookup([0x0041, 0x00e9, 0x2603, 0xffff]);

    expect(lookup(0x0041)).toBe(0);
    expect(lookup(0x00e9)).toBe(1);
    expect(lookup(0x2603)).toBe(2);
    expect(lookup(0xffff)).toBe(3);
  });

  it("returns -1 for unmapped code points", () => {
    const lookup = createSingleByteLookup([0x0041, 0x0100]);

    // Missing entries within allocated blocks.
    expect(lookup(0x0042)).toBe(-1);
    expect(lookup(0x01ff)).toBe(-1);

    // Code points in unallocated blocks.
    expect(lookup(0x0200)).toBe(-1);
    expect(lookup(0x2000)).toBe(-1);
  });

  it("returns -1 for code points outside the BMP", () => {
    const lookup = createSingleByteLookup([0x0041]);

    expect(lookup(-1)).toBe(-1);
    expect(lookup(BMP_SIZE)).toBe(-1);
    expect(lookup(0x1f600)).toBe(-1);
  });

  it("returns -1 for all lookups when the input is empty", () => {
    const lookup = createSingleByteLookup([]);

    expect(lookup(0)).toBe(-1);
    expect(lookup(0x0041)).toBe(-1);
    expect(lookup(0xffff)).toBe(-1);
  });

  it("returns the last index for duplicate code points", () => {
    const lookup = createSingleByteLookup([0x0041, 0x0042, 0x0041]);

    expect(lookup(0x0041)).toBe(2);
    expect(lookup(0x0042)).toBe(1);
  });

  it("preserves indices up to 127 for a 128-entry single-byte encoding", () => {
    const values = Array.from({ length: 128 }, (_, index) => 0x0100 + index);
    const lookup = createSingleByteLookup(values);

    expect(lookup(0x0100)).toBe(0);
    expect(lookup(0x017e)).toBe(126);
    expect(lookup(0x017f)).toBe(127);
    expect(lookup(0x0180)).toBe(-1);
  });

  it("handles code points at both BMP boundaries", () => {
    const lookup = createSingleByteLookup([0x0000, 0xffff]);

    expect(lookup(0x0000)).toBe(0);
    expect(lookup(0xffff)).toBe(1);
    expect(lookup(-1)).toBe(-1);
    expect(lookup(0x10000)).toBe(-1);
  });
});
