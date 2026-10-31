import { describe, expect, it } from "vitest";

import {
  decodeVlqRuns,
  decodeVlqRunsLookup,
  type VlqRunsPayload,
} from "./vlqRuns";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * See `encodeVlq` in file://./../../scripts/generate-encodings.ts
 */
const encodeVlq = (n: number): string => {
  let v = n < 0 ? (-n << 1) | 1 : n << 1;
  let s = "";
  do {
    let digit = v & 31;
    v >>>= 5;
    if (v > 0) {
      digit |= 32;
    }
    s += B64[digit]!;
  } while (v > 0);
  return s;
};

/**
 * See `encodeVlqRunsPayload` in file://./../../scripts/generate-encodings.ts
 */
const encodeVlqRunsPayload = (
  runs: { cpStart: number; ptrStart: number; count: number }[],
): VlqRunsPayload => {
  const runCount = runs.length;
  const cpGaps = new Int32Array(runCount);
  const ptrGaps = new Int32Array(runCount);

  if (runCount === 0) {
    throw new Error("At least one run is required");
  }

  for (let i = 1; i < runCount; i++) {
    cpGaps[i - 1] =
      runs[i]!.cpStart - runs[i - 1]!.cpStart - runs[i - 1]!.count;
    ptrGaps[i - 1] =
      runs[i]!.ptrStart - runs[i - 1]!.ptrStart - runs[i - 1]!.count;
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- VlqRunsPayload is a branded type
  return [
    encodeVlq(runs[0]!.cpStart),
    encodeVlq(runs[0]!.ptrStart),
    Array.from(cpGaps).map(encodeVlq).join(""),
    runs.map(({ count }) => encodeVlq(count)).join(""),
    Array.from(ptrGaps).map(encodeVlq).join(""),
  ].join(".") as VlqRunsPayload;
};

describe("decodeVlqRuns", () => {
  it("decodes a single run", () => {
    expect(
      decodeVlqRuns(
        encodeVlqRunsPayload([{ cpStart: 0x41, ptrStart: 10, count: 3 }]),
      ),
    ).toEqual({
      cpStarts: new Int32Array([0x41]),
      ptrStarts: new Int32Array([10]),
      counts: new Int32Array([3]),
    });
  });

  it("decodes multiple runs with gaps", () => {
    expect(
      decodeVlqRuns(
        encodeVlqRunsPayload([
          { cpStart: 0x41, ptrStart: 10, count: 2 },
          { cpStart: 0x50, ptrStart: 20, count: 3 },
          { cpStart: 0x70, ptrStart: 30, count: 1 },
        ]),
      ),
    ).toEqual({
      cpStarts: new Int32Array([0x41, 0x50, 0x70]),
      ptrStarts: new Int32Array([10, 20, 30]),
      counts: new Int32Array([2, 3, 1]),
    });
  });

  it("decodes adjacent runs with zero gaps", () => {
    expect(
      decodeVlqRuns(
        encodeVlqRunsPayload([
          { cpStart: 100, ptrStart: 0, count: 2 },
          { cpStart: 102, ptrStart: 2, count: 2 },
        ]),
      ),
    ).toEqual({
      cpStarts: new Int32Array([100, 102]),
      ptrStarts: new Int32Array([0, 2]),
      counts: new Int32Array([2, 2]),
    });
  });

  it("decodes large VLQ values", () => {
    expect(
      decodeVlqRuns(
        encodeVlqRunsPayload([{ cpStart: 0x10000, ptrStart: 50000, count: 2 }]),
      ),
    ).toEqual({
      cpStarts: new Int32Array([0x10000]),
      ptrStarts: new Int32Array([50000]),
      counts: new Int32Array([2]),
    });
  });
});

describe("decodeVlqRunsLookup", () => {
  it("maps code points to pointers within a run", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([{ cpStart: 0x41, ptrStart: 10, count: 3 }]),
    );
    expect([0x41, 0x42, 0x43].map(lookupCodePoint)).toEqual([10, 11, 12]);
  });

  it("returns -1 for unmapped code points", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([{ cpStart: 0x41, ptrStart: 10, count: 3 }]),
    );
    expect([0x40, 0x44, 0x100].map(lookupCodePoint)).toEqual([-1, -1, -1]);
  });

  it("looks up code points across multiple runs", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([
        { cpStart: 0x41, ptrStart: 10, count: 2 },
        { cpStart: 0x50, ptrStart: 20, count: 3 },
        { cpStart: 0x70, ptrStart: 30, count: 1 },
      ]),
    );
    expect([0x41, 0x42, 0x50, 0x51, 0x52, 0x70].map(lookupCodePoint)).toEqual([
      10, 11, 20, 21, 22, 30,
    ]);
  });

  it("returns -1 for code points in gaps between runs", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([
        { cpStart: 0x41, ptrStart: 10, count: 2 },
        { cpStart: 0x50, ptrStart: 20, count: 2 },
      ]),
    );
    expect([0x43, 0x49, 0x4f, 0x52].map(lookupCodePoint)).toEqual([
      -1, -1, -1, -1,
    ]);
  });

  it("handles runs crossing a 256-code-point block boundary", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([{ cpStart: 0xfe, ptrStart: 100, count: 4 }]),
    );
    expect(
      [0xfd, 0xfe, 0xff, 0x100, 0x101, 0x102].map(lookupCodePoint),
    ).toEqual([-1, 100, 101, 102, 103, -1]);
  });

  it("handles astral code points", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([{ cpStart: 0x1f600, ptrStart: 500, count: 2 }]),
    );
    expect([0x1f600, 0x1f601, 0x1f602].map(lookupCodePoint)).toEqual([
      500, 501, -1,
    ]);
  });

  it("handles the maximum Unicode code point", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([{ cpStart: 0x10ffff, ptrStart: 100, count: 1 }]),
    );
    expect([0x10fffe, 0x10ffff].map(lookupCodePoint)).toEqual([-1, 100]);
  });

  it("returns -1 for code points outside the Unicode range", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([{ cpStart: 0x41, ptrStart: 10, count: 1 }]),
    );
    expect([-1, 0x110000].map(lookupCodePoint)).toEqual([-1, -1]);
  });

  it("supports pointers immediately below the unmapped sentinel", () => {
    const lookupCodePoint = decodeVlqRunsLookup(
      encodeVlqRunsPayload([{ cpStart: 0x41, ptrStart: 0xfffe, count: 1 }]),
    );
    expect(lookupCodePoint(0x41)).toBe(0xfffe);
  });
});
