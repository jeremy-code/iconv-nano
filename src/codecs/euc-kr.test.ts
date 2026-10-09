import { describe, expect, it } from "vitest";

import { PAYLOAD } from "../../encodings/euc-kr.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as euc_kr from "./euc-kr.js";

// Every character covered by the EUC-KR index, rebuilt from columnar runs
const { cpStarts, counts } = decodeVlqRuns(PAYLOAD);
const euc_kr_index = cpStarts
  .reduce((chars, cpStart, i) => {
    const count = counts[i]!;
    for (let cp = cpStart; cp < cpStart + count; cp++) {
      chars.push(String.fromCodePoint(cp));
    }
    return chars;
  }, [] as string[])
  .join("");

describe("EUC-KR", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("비빔밥".encode("euc-kr").hex())'
      expect(euc_kr.encode("비빔밥")).toEqual(
        Uint8Array.fromHex("baf1baf6b9e4"),
      );

      // python3 -c 'print("회귀를 계속하다 보면, 언젠가 네놈을 만날 수도 있는 건가?".encode("euc-kr").hex())'
      expect(
        euc_kr.encode(
          "회귀를 계속하다 보면, 언젠가 네놈을 만날 수도 있는 건가?",
        ),
      ).toEqual(
        Uint8Array.fromHex(
          "c8b8b1cdb8a620b0e8bcd3c7cfb4d920bab8b8e92c20bef0c1a8b0a120b3d7b3f0c0bb20b8b8b3af20bcf6b5b520c0d6b4c220b0c7b0a13f",
        ),
      );
    });

    it("encodes unknown characters as ?", () => {
      const input = "🥘";
      const encodedInput = euc_kr.encode(input);
      expect(encodedInput).toEqual(euc_kr.encode("?"));
      expect(euc_kr.decode(encodedInput)).toBe("?");
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: Array.from({ length: 0x7f }, (_, i) =>
          String.fromCharCode(i),
        ).join(""),
        "EUC-KR index": euc_kr_index,
      }),
    )("%s", ([, input]) => {
      const encodedInput = euc_kr.encode(input);

      expect(euc_kr.decode(encodedInput)).toBe(input);
    });
  });
});
