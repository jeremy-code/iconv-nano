import { describe, expect, it } from "vitest";

import { createIndexMap } from "./createIndexMap.js";

describe("createIndexMap", () => {
  it("maps each value to its index", () => {
    expect(createIndexMap([10, 20, 30])).toEqual({
      10: 0,
      20: 1,
      30: 2,
    });
  });

  it("returns an empty object for an empty array", () => {
    expect(createIndexMap([])).toEqual({});
  });

  it("skips -1 values", () => {
    expect(createIndexMap([10, -1, 30])).toEqual({
      10: 0,
      30: 2,
    });
  });

  it("preserves zero and other valid numeric values", () => {
    expect(createIndexMap([0, -2, 1.5])).toEqual({
      0: 0,
      "-2": 1,
      1.5: 2,
    });
  });

  it("uses the last index for duplicate values", () => {
    expect(createIndexMap([10, 20, 10])).toEqual({
      10: 2,
      20: 1,
    });
  });
});
