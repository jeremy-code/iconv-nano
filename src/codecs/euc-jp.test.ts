import { describe, expect, it } from "vitest";

import { PAYLOAD } from "../../encodings/jis0208.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as euc_jp from "./euc-jp.js";

// Every character covered by the JIS0208 index, rebuilt from columnar runs
const { cpStarts, counts } = decodeVlqRuns(PAYLOAD);
const jis0208_index = cpStarts
  .map((cpStart, i) =>
    String.fromCodePoint(
      ...Array.from({ length: counts[i]! }, (_, offset) => cpStart + offset),
    ),
  )
  .join("");

describe("EUC-JP", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("「ド 好 み」".encode("euc-jp").hex())'
      expect(euc_jp.encode("「ド 好 み」")).toEqual(
        Uint8Array.fromHex("a1d6a5c920b9a520a4dfa1d7"),
      );

      // python3 -c 'print("失くした言葉を知らないなら各駅停車に乗り込んで".encode("euc-jp").hex())'
      expect(
        euc_jp.encode("失くした言葉を知らないなら各駅停車に乗り込んで"),
      ).toEqual(
        Uint8Array.fromHex(
          "bcbaa4afa4b7a4bfb8c0cdd5a4f2c3cea4e9a4caa4a4a4caa4e9b3c6b1d8c4e4bcd6a4cbbee8a4eab9fea4f3a4c7",
        ),
      );

      // python3 -c 'print("片手にナイフを、その胸に憎悪を、瞳に狂気を漲らせ、上へと歩む。".encode("euc-jp").hex())'
      expect(
        euc_jp.encode(
          "片手にナイフを、その胸に憎悪を、瞳に狂気を漲らせ、上へと歩む。",
        ),
      ).toEqual(
        Uint8Array.fromHex(
          "cad2bceaa4cba5caa5a4a5d5a4f2a1a2a4bda4ceb6bba4cbc1feb0ada4f2a1a2c6b7a4cbb6b8b5a4a4f2defda4e9a4bba1a2bee5a4d8a4c8cae2a4e0a1a3",
        ),
      );
    });

    it("encodes ¥ as \\", () => {
      const encodedInput = euc_jp.encode("¥");
      expect(encodedInput).toEqual(new Uint8Array(["\\".charCodeAt(0)]));
      expect(euc_jp.decode(encodedInput)).toBe("\\");
    });

    it("encodes ‾ as ~", () => {
      const encodedInput = euc_jp.encode("‾");
      expect(encodedInput).toEqual(new Uint8Array(["~".charCodeAt(0)]));
      expect(euc_jp.decode(encodedInput)).toBe("~");
    });

    it("encodes − as －", () => {
      const encodedInput = euc_jp.encode("−");
      expect(encodedInput).toEqual(euc_jp.encode("－"));
      expect(euc_jp.decode(encodedInput)).toBe("－");
    });

    it("encodes unknown characters as ?", () => {
      const encodedInput = euc_jp.encode("🈁");
      expect(encodedInput).toEqual(euc_jp.encode("?"));
      expect(euc_jp.decode(encodedInput)).toBe("?");
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
        "half-width kana": String.fromCodePoint(
          ...Array.from({ length: 0xff9f - 0xff61 }, (_, i) => i + 0xff61),
        ),
        "JIS0208 index": jis0208_index,
      }),
    )("%s", ([, input]) => {
      const encodedInput = euc_jp.encode(input);

      expect(euc_jp.decode(encodedInput)).toBe(input);
    });
  });
});
