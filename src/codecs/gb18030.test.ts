import { describe, expect, it } from "vitest";

import { PAYLOAD } from "../../encodings/gb18030.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as gb18030 from "./gb18030.js";

// Every character covered by the GB 18030 index, rebuilt from columnar runs
const { cpStarts, counts } = decodeVlqRuns(PAYLOAD);
const gb18030_index = cpStarts
  .map((cpStart, i) =>
    String.fromCodePoint(
      ...Array.from({ length: counts[i]! }, (_, offset) => cpStart + offset),
    ),
  )
  .join("");

const COMPAT_TABLE: Record<string, readonly [number, number]> =
  Object.fromEntries(
    (
      [
        [0xe78d, [0xa6, 0xd9]],
        [0xe78e, [0xa6, 0xda]],
        [0xe78f, [0xa6, 0xdb]],
        [0xe790, [0xa6, 0xdc]],
        [0xe791, [0xa6, 0xdd]],
        [0xe792, [0xa6, 0xde]],
        [0xe793, [0xa6, 0xdf]],
        [0xe794, [0xa6, 0xec]],
        [0xe795, [0xa6, 0xed]],
        [0xe796, [0xa6, 0xf3]],
        [0xe81e, [0xfe, 0x59]],
        [0xe826, [0xfe, 0x61]],
        [0xe82b, [0xfe, 0x66]],
        [0xe82c, [0xfe, 0x67]],
        [0xe832, [0xfe, 0x6d]],
        [0xe843, [0xfe, 0x7e]],
        [0xe854, [0xfe, 0x90]],
        [0xe864, [0xfe, 0xa0]],
      ] as const
    ).map(([codePoint, bytes]) => [String.fromCodePoint(codePoint), bytes]),
  );

describe("gb18030", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("食言者当受食岩之罚".encode("gb18030").hex())'
      expect(gb18030.encode("食言者当受食岩之罚")).toEqual(
        Uint8Array.fromHex("cab3d1d4d5dfb5b1cadccab3d1d2d6aeb7a3"),
      );

      // python3 -c 'print("欲买桂花同载酒，终不似，少年游".encode("gb18030").hex())'
      expect(gb18030.encode("欲买桂花同载酒，终不似，少年游")).toEqual(
        Uint8Array.fromHex(
          "d3fbc2f2b9f0bba8cdacd4d8bec6a3acd6d5b2bbcbc6a3acc9d9c4ead3ce",
        ),
      );

      // python3 -c 'print("近前看端详。上写着秦香莲她三十二岁，状告当朝驸马郎。欺君王、瞒皇上，悔婚男儿招东床。".encode("gb18030").hex())'
      expect(
        gb18030.encode(
          "近前看端详。上写着秦香莲她三十二岁，状告当朝驸马郎。欺君王、瞒皇上，悔婚男儿招东床。",
        ),
      ).toEqual(
        Uint8Array.fromHex(
          "bdfcc7b0bfb4b6cbcfeaa1a3c9cfd0b4d7c5c7d8cfe3c1abcbfdc8fdcaaeb6fecbeaa3acd7b4b8e6b5b1b3afe6e2c2edc0c9a1a3c6dbbefdcdf5a1a2c2f7bbcac9cfa3acbbdabbe9c4d0b6f9d5d0b6abb4b2a1a3",
        ),
      );
    });

    it("encodes ASCII", () => {
      expect(gb18030.encode("Hello")).toEqual(Uint8Array.fromHex("48656c6c6f"));
    });

    it("encodes GB18030 two-byte characters", () => {
      expect(gb18030.encode("你好世界")).toEqual(
        Uint8Array.fromHex("c4e3bac3cac0bde7"),
      );
    });

    it("encodes a mixture of ASCII and two-byte characters", () => {
      expect(gb18030.encode("Hello 世界!")).toEqual(
        Uint8Array.fromHex("48656c6c6f20cac0bde721"),
      );
    });

    it("encodes a four-byte GB18030 character", () => {
      // U+10000 -> 90 30 81 30
      expect(gb18030.encode("\u{10000}")).toEqual(
        Uint8Array.fromHex("90308130"),
      );
      expect(gb18030.encode("\u0080")).toEqual(Uint8Array.fromHex("81308130"));
    });

    it("encodes an astral Unicode character using four-byte GB18030", () => {
      // U+1F600 GRINNING FACE -> 94 39 FC 36
      expect(gb18030.encode("😀")).toEqual(
        new Uint8Array([0x94, 0x39, 0xfc, 0x36]),
      );
    });

    it("encodes U+E7C7 correctly", () => {
      // U+E7C7 -> pointer 7457 -> 81 35 F4 37
      expect(gb18030.encode("\uE7C7")).toEqual(
        new Uint8Array([0x81, 0x35, 0xf4, 0x37]),
      );
    });

    it("encodes characters from the explicit compatibility table", () => {
      expect(gb18030.encode("\uE78D")).toEqual(new Uint8Array([0xa6, 0xd9]));

      expect(gb18030.encode("\uE81E")).toEqual(new Uint8Array([0xfe, 0x59]));

      expect(gb18030.encode("\uE864")).toEqual(new Uint8Array([0xfe, 0xa0]));
    });

    it.for(Object.entries(COMPAT_TABLE))(
      "encodes GB18030 compatibility characters",
      ([char, bytes]) => {
        expect(gb18030.encode(char)).toEqual(new Uint8Array(bytes));
      },
    );

    it("encodes U+E5E5 as ?", () => {
      expect(gb18030.encode("\uE5E5")).toEqual(new Uint8Array([0x3f]));
    });

    it("encodes unknown characters using four-byte GB18030", () => {
      expect(gb18030.encode("\u{20000}")).toEqual(
        Uint8Array.fromHex("95328236"),
      );
    });

    describe("GBK", () => {
      it("encodes € as 0x80", () => {
        expect(gb18030.encode("€", { isGBK: true })).toEqual(
          new Uint8Array([0x80]),
        );
      });

      it("encodes unsupported characters as ?", () => {
        expect(gb18030.encode("\u{1f600}", { isGBK: true })).toEqual(
          new Uint8Array([0x3f]),
        );
      });

      it("encodes GBK-compatible characters", () => {
        expect(gb18030.encode("你好", { isGBK: true })).toEqual(
          new Uint8Array([0xc4, 0xe3, 0xba, 0xc3]),
        );
      });

      it("encodes U+E5E5 as ?", () => {
        expect(gb18030.encode("\uE5E5", { isGBK: true })).toEqual(
          new Uint8Array([0x3f]),
        );
      });
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
        "GB 18030": gb18030_index,
        // These code points intentionally do not survive roundtrip conversion
        // "compatibility table": String.fromCodePoint(...[Array.from({ length: 0xe796 - 0xe78d + 1 }, (_, i) => 0xe78d + i),  [0xe81e, 0xe826, 0xe82b, 0xe82c, 0xe832, 0xe843, 0xe854, 0xe864]].flat()),
      }),
    )("%s", ([, input]) => {
      const encodedInput = gb18030.encode(input);

      expect(gb18030.decode(encodedInput)).toBe(input);
    });
  });
});
