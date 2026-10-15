import { describe, expect, it } from "vitest";

import { PAYLOAD } from "../../encodings/big5.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as big5 from "./big5.js";

// Every character covered by the Big5 index, rebuilt from columnar runs
const { cpStarts, counts } = decodeVlqRuns(PAYLOAD);
const big5_index = cpStarts
  .map((cpStart, i) =>
    String.fromCodePoint(
      ...Array.from({ length: counts[i]! }, (_, offset) => cpStart + offset),
    ),
  )
  .join("");

describe("Big5", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("我愛你".encode("big5").hex())'
      expect(big5.encode("我愛你")).toEqual(Uint8Array.fromHex("a7dab752a741"));

      // python3 -c 'print("大五碼（英語：Big5，又稱五大專案碼、五大碼）是繁体中文社群最常用的電腦漢字字符集標準，共收錄13060個漢字。".encode("big5").hex())'
      // https://zh.wikipedia.org/wiki/%E5%A4%A7%E4%BA%94%E7%A2%BC
      expect(
        big5.encode(
          "大五碼（英語：Big5，又稱五大專案碼、五大碼）是繁体中文社群最常用的電腦漢字字符集標準，共收錄13060個漢字。",
        ),
      ).toEqual(
        Uint8Array.fromHex(
          "a46aa4adbd58a15dad5ebb79a14742696735a141a453bad9a4ada46ab14daed7bd58a142a4ada46abd58a15eac4fc163ca5ea4a4a4e5aac0b873b3ccb160a5ceaabab971b8a3ba7ea672a672b2c5b6b0bcd0b7c7a141a640a6acbffd3133303630add3ba7ea672a143",
        ),
      );
    });

    it("encodes unknown characters as ?", () => {
      const input = "🧋";
      const encodedInput = big5.encode(input);
      expect(encodedInput).toEqual(big5.encode("?"));
      expect(big5.decode(encodedInput)).toBe("?");
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCharCode(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
        "Big5 index": big5_index,
      }),
    )("%s", ([, input]) => {
      const encodedInput = big5.encode(input);

      expect(big5.decode(encodedInput)).toBe(input);
    });
  });
});
