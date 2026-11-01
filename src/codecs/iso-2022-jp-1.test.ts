import { describe, expect, it } from "vitest";

import iso_2022_jp_katakana from "../../encodings/iso-2022-jp-katakana.json" with { type: "json" };
import { PAYLOAD as JIS_0208_PAYLOAD } from "../../encodings/jis0208.js";
import { PAYLOAD as JIS_0212_PAYLOAD } from "../../encodings/jis0212.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as iso_2022_jp_1 from "./iso-2022-jp-1.js";

// Every [character, pointer] pair covered by the JIS0208 index, rebuilt from columnar runs
const [jis0208_entries, jis0212_entries] = [
  JIS_0208_PAYLOAD,
  JIS_0212_PAYLOAD,
].map((payload) => {
  const { cpStarts, ptrStarts, counts } = decodeVlqRuns(payload);
  return Array.from(cpStarts).flatMap((cpStart, i) =>
    Array.from<unknown, [string, number]>(
      { length: counts[i]! },
      (_, offset) => [
        String.fromCodePoint(cpStart + offset),
        ptrStarts[i]! + offset,
      ],
    ),
  );
});

describe("ISO-2022-JP-1", () => {
  describe("encode", () => {
    it("returns empty Uint8Array for empty string", () => {
      expect(iso_2022_jp_1.encode("")).toHaveLength(0);
    });

    it("encodes ISO-2022-JP input", () => {
      // Should be compatible with ISO-2022-JP
      // python3 -c 'print("\"I wish I were a bird.\"「なんで英語喋っとるん？」「娘がアメリカに行くねん。」".encode("iso-2022-jp-1").hex())'
      expect(
        iso_2022_jp_1.encode(
          '"I wish I were a bird."「なんで英語喋っとるん？」「娘がアメリカに行くねん。」',
        ),
      ).toEqual(
        Uint8Array.fromHex(
          "2249207769736820492077657265206120626972642e221b24422156244a247324473151386c437d24432448246b24732129215721564c3c242c25222561256a252b244b3954242f244d2473212321571b2842",
        ),
      );
    });

    it("encodes input with JIS X 0212 and JIS X 0208 characters", () => {
      // 丂, 丄, 丅 are unique to JIS X 0212
      // python3 -c 'print("「漢字の丂丄丅を調べる。」".encode("iso-2022-jp-1").hex())'
      expect(iso_2022_jp_1.encode("「漢字の丂丄丅を調べる。」")).toEqual(
        Uint8Array.fromHex(
          "1b2442215634413b7a244e1b2428443021302230231b2442247244342459246b212321571b2842",
        ),
      );
      // python3 -c 'print("猫が丂歩く丄姿".encode("iso-2022-jp-1").hex())'
      expect(iso_2022_jp_1.encode("猫が丂歩く丄姿")).toEqual(
        Uint8Array.fromHex(
          "1b2442472d242c1b24284430211b24424a62242f1b24284430221b24423b511b2842",
        ),
      );
    });

    it("encodes input with only JIS X 0212 characters", () => {
      // python3 -c 'print("丂丄丅".encode("iso-2022-jp-1").hex())'
      expect(iso_2022_jp_1.encode("丂丄丅")).toEqual(
        Uint8Array.fromHex("1b2428443021302230231b2842"),
      );

      // python3 -c 'print("丂鼙鼚鼛鼟".encode("iso-2022-jp-1").hex())'
      expect(iso_2022_jp_1.encode("丂鼙鼚鼛鼟")).toEqual(
        Uint8Array.fromHex("1b24284430216d2d6d2e6d2f6d301b2842"),
      );
    });
  });

  describe("decode", () => {
    it("returns empty string for empty Uint8Array", () => {
      expect(iso_2022_jp_1.decode(new Uint8Array())).toHaveLength(0);
    });

    it("decodes ISO-2022-JP input", () => {
      expect(
        iso_2022_jp_1.decode(
          Uint8Array.fromHex(
            "2249207769736820492077657265206120626972642e221b24422156244a247324473151386c437d24432448246b24732129215721564c3c242c25222561256a252b244b3954242f244d2473212321571b2842",
          ),
        ),
      ).toEqual(
        '"I wish I were a bird."「なんで英語喋っとるん？」「娘がアメリカに行くねん。」',
      );
    });

    it("decodes input with only JIS X 0212 characters", () => {
      // python3 -c 'print("丂丄丅".encode("iso-2022-jp-1").hex())'
      expect(
        iso_2022_jp_1.decode(Uint8Array.fromHex("1b2428443021302230231b2842")),
      ).toEqual("丂丄丅");

      // python3 -c 'print("丂鼙鼚鼛鼟".encode("iso-2022-jp-1").hex())'
      expect(
        iso_2022_jp_1.decode(
          Uint8Array.fromHex("1b24284430216d2d6d2e6d2f6d301b2842"),
        ),
      ).toEqual("丂鼙鼚鼛鼟");
    });

    it("decodes input with both JIS X 0212 and JIS X 0208 characters", () => {
      // 丂, 丄, 丅 are unique to JIS X 0212
      // python3 -c 'print("「漢字の丂丄丅を調べる。」".encode("iso-2022-jp-1").hex())'
      expect(
        iso_2022_jp_1.decode(
          Uint8Array.fromHex(
            "1b2442215634413b7a244e1b2428443021302230231b2442247244342459246b212321571b2842",
          ),
        ),
      ).toEqual("「漢字の丂丄丅を調べる。」");

      // python3 -c 'print("猫が丂歩く丄姿".encode("iso-2022-jp-1").hex())'
      expect(
        iso_2022_jp_1.decode(
          Uint8Array.fromHex(
            "1b2442472d242c1b24284430211b24424a62242f1b24284430221b24423b511b2842",
          ),
        ),
      ).toEqual("猫が丂歩く丄姿");
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i).filter(
            (codePoint) => ![0x0e, 0x0f, 0x1b].includes(codePoint),
          ),
        ),
        "ISO-2022-JP katakana index":
          Object.keys(iso_2022_jp_katakana).join(""),
        "JIS0208 index": jis0208_entries!.map(([char]) => char).join(""),
        "JIS0212 index": jis0212_entries!.map(([char]) => char).join(""),
      }),
    )("%s", ([, input]) => {
      expect(iso_2022_jp_1.decode(iso_2022_jp_1.encode(input))).toBe(input);
    });
  });
});
