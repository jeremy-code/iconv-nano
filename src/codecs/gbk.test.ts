import { describe, expect, it } from "vitest";

import { PAYLOAD } from "../../encodings/gb18030.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as gbk from "./gbk.js";

// Every character covered by the GB 18030 index, rebuilt from columnar runs
const { cpStarts, counts } = decodeVlqRuns(PAYLOAD);
const gb18030_index = cpStarts
  .map((cpStart, i) =>
    String.fromCodePoint(
      ...Array.from({ length: counts[i]! }, (_, offset) => cpStart + offset),
    ),
  )
  .join("");

describe("gb18030", () => {
  describe("encode", () => {
    it("encodes € as 0x80", () => {
      expect(gbk.encode("€")).toEqual(new Uint8Array([0x80]));
    });

    it("encodes unsupported characters as ?", () => {
      expect(gbk.encode("\u{1f600}")).toEqual(new Uint8Array([0x3f]));
    });

    it("encodes GBK-compatible characters", () => {
      expect(gbk.encode("你好")).toEqual(
        new Uint8Array([0xc4, 0xe3, 0xba, 0xc3]),
      );
    });

    it("encodes U+E5E5 as ?", () => {
      expect(gbk.encode("\uE5E5")).toEqual(new Uint8Array([0x3f]));
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
        "GB 18030": gb18030_index,
      }),
    )("%s", ([, input]) => {
      const encodedInput = gbk.encode(input);

      expect(gbk.decode(encodedInput)).toBe(input);
    });
  });
});
