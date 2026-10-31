import { describe, expect, it } from "vitest";

import iso_2022_jp_katakana from "../../encodings/iso-2022-jp-katakana.json" with { type: "json" };
import { PAYLOAD } from "../../encodings/jis0208.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as iso_2022_jp from "./iso-2022-jp.js";

// Every [character, pointer] pair covered by the JIS0208 index, rebuilt from columnar runs
const { cpStarts, ptrStarts, counts } = decodeVlqRuns(PAYLOAD);
const jis0208_entries = Array.from(cpStarts).flatMap((cpStart, i) =>
  Array.from<unknown, [string, number]>({ length: counts[i]! }, (_, offset) => [
    String.fromCodePoint(cpStart + offset),
    ptrStarts[i]! + offset,
  ]),
);

const textEncoder = new TextEncoder();

const ESCAPE_SEQUENCES = {
  ascii: new Uint8Array([0x1b, 0x28, 0x42]), // ESC ( B
  roman: new Uint8Array([0x1b, 0x28, 0x4a]), // ESC ( J
  jis0208: new Uint8Array([0x1b, 0x24, 0x42]), // ESC $ B
};

describe("ISO-2022-JP", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("\"I wish I were a bird.\"「なんで英語喋っとるん？」「娘がアメリカに行くねん。」".encode("iso-2022-jp").hex())'
      expect(
        iso_2022_jp.encode(
          '"I wish I were a bird."「なんで英語喋っとるん？」「娘がアメリカに行くねん。」',
        ),
      ).toEqual(
        Uint8Array.fromHex(
          "2249207769736820492077657265206120626972642e221b24422156244a247324473151386c437d24432448246b24732129215721564c3c242c25222561256a252b244b3954242f244d2473212321571b2842",
        ),
      );
    });

    it("returns empty Uint8Array for empty string", () => {
      expect(iso_2022_jp.encode("")).toHaveLength(0);
    });

    it("returns ASCII characters unchanged excluding control characters", () => {
      const input = Array.from({ length: 0x80 }, (_, i) => i)
        .filter((codePoint) => ![0x0e, 0x0f, 0x1b].includes(codePoint))
        .map((codePoint) => String.fromCharCode(codePoint))
        .join("");

      expect(iso_2022_jp.encode(input)).toEqual(textEncoder.encode(input));
    });

    // https://www.ecma-international.org/wp-content/uploads/ECMA-35_6th_edition_december_1994.pdf#page=30
    it("returns 7-bit bytes exclusively", () => {
      const input = [
        "Hello world!",
        "コンピュータによる文字情報処理が可能になって以来、さまざまな言語のために、コンピュータ上で文字データを表現したいという要求を満たすため、多くの符号化文字集合が作られてきた。",
        "😭",
      ].join("\n");

      expect(iso_2022_jp.encode(input).every((byte) => byte <= 0x7f)).toBe(
        true,
      );
    });

    describe("JIS X 0208 state", () => {
      it("switches to JIS X 0208 and returns to ASCII at the end", () => {
        // "あ" is jis0208 pointer 283 => row 4, cell 2 => [0x24, 0x22]
        expect(iso_2022_jp.encode("あ")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.jis0208,
            0x24,
            0x22,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });

      it("stays in JIS X 0208 for consecutive characters", () => {
        // あ = [0x24, 0x22], い = [0x24, 0x24]
        expect(iso_2022_jp.encode("あい")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.jis0208,
            0x24,
            0x22,
            0x24,
            0x24,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });

      it("switches back to ASCII when an ASCII character follows", () => {
        // あ = [0x24, 0x22]
        expect(iso_2022_jp.encode("aあb")).toEqual(
          new Uint8Array([
            0x61,
            ...ESCAPE_SEQUENCES.jis0208,
            0x24,
            0x22,
            ...ESCAPE_SEQUENCES.ascii,
            0x62,
          ]),
        );
      });

      it("encodes 　 (ideographic space) as [0x21, 0x21]", () => {
        expect(iso_2022_jp.encode("\u3000")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.jis0208,
            0x21,
            0x21,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });

      it("encodes − (U+2212) as － (U+FF0D)", () => {
        const input = "\u2212";
        const encodedInput = iso_2022_jp.encode(input);

        expect(encodedInput).toEqual(iso_2022_jp.encode("\uFF0D"));
        expect(iso_2022_jp.decode(encodedInput)).toBe("\uFF0D");
      });

      it("uses the correct leading and trailing bytes for every pointer", () => {
        for (const [char, pointer] of jis0208_entries) {
          const leading = Math.floor(pointer / 94) + 0x21;
          const trailing = (pointer % 94) + 0x21;

          expect(
            iso_2022_jp.encode(char),
            `U+${char.codePointAt(0)!.toString(16)}`,
          ).toEqual(
            new Uint8Array([
              ...ESCAPE_SEQUENCES.jis0208,
              leading,
              trailing,
              ...ESCAPE_SEQUENCES.ascii,
            ]),
          );
        }
      });
    });

    describe("JIS X 0201 ESCAPE_SEQUENCES.roman", () => {
      it("encodes ¥ as 0x5C in the Roman state", () => {
        expect(iso_2022_jp.encode("¥")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });
      it("encodes ‾ as 0x7E in the Roman state", () => {
        expect(iso_2022_jp.encode("‾")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.roman,
            0x7e,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });
      it("remains in the Roman state for consecutive ¥ and ‾ characters", () => {
        expect(iso_2022_jp.encode("¥‾¥")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            0x7e,
            0x5c,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });
      it("stays in the Roman state for ASCII other than \\ and ~", () => {
        expect(iso_2022_jp.encode("¥abcXYZ123")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            0x61,
            0x62,
            0x63,
            0x58,
            0x59,
            0x5a,
            0x31,
            0x32,
            0x33,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });
      it("switches back to ASCII for \\ and ~", () => {
        expect(iso_2022_jp.encode("¥\\")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            ...ESCAPE_SEQUENCES.ascii,
            0x5c,
          ]),
        );
        expect(iso_2022_jp.encode("¥~")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            ...ESCAPE_SEQUENCES.ascii,
            0x7e,
          ]),
        );
      });
      it("Roman -> JIS X 0208", () => {
        expect(iso_2022_jp.encode("¥あ")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            ...ESCAPE_SEQUENCES.jis0208,
            0x24,
            0x22,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });
      it("JIS X 0208 -> Roman", () => {
        expect(iso_2022_jp.encode("あ¥")).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.jis0208,
            0x24,
            0x22,
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });
      it("ASCII -> Roman -> ASCII", () => {
        expect(iso_2022_jp.encode("a¥b\\c")).toEqual(
          new Uint8Array([
            0x61,
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            0x62,
            ...ESCAPE_SEQUENCES.ascii,
            0x5c,
            0x63,
          ]),
        );
      });
    });
    describe("half-width katakana", () => {
      it("encodes half-width katakana as their full-width equivalents", () => {
        const input = "ﾆｭﾆｭﾆｭ";
        const encodedInput = iso_2022_jp.encode(input);
        expect(encodedInput).toEqual(iso_2022_jp.encode("ニュニュニュ"));
        // ニュ is [0x25, 0x4b, 0x25, 0x65]
        const fullWidthKatakana = [0x25, 0x4b, 0x25, 0x65];
        expect(encodedInput).toEqual(
          new Uint8Array([
            ...ESCAPE_SEQUENCES.jis0208,
            ...fullWidthKatakana,
            ...fullWidthKatakana,
            ...fullWidthKatakana,
            ...ESCAPE_SEQUENCES.ascii,
          ]),
        );
      });

      it("encodes ｡ (U+FF61) as 。 (U+3002)", () => {
        expect(iso_2022_jp.encode("\uFF61")).toEqual(
          iso_2022_jp.encode("\u3002"),
        );
      });

      it("encodes ﾟ (U+FF9F) as ゜ (U+309C)", () => {
        expect(iso_2022_jp.encode("\uFF9F")).toEqual(
          iso_2022_jp.encode("\u309C"),
        );
      });

      it("maps every half-width katakana based on ISO-2022-JP katakana index", () => {
        expect(iso_2022_jp_katakana).toHaveLength(0xff9f - 0xff61 + 1);
        iso_2022_jp_katakana.map((kana, index) =>
          expect(
            iso_2022_jp.encode(String.fromCodePoint(0xff61 + index)),
          ).toEqual(iso_2022_jp.encode(String.fromCharCode(kana))),
        );
      });
    });

    describe("SO, SI, and ESC", () => {
      it.for([0x0e, 0x0f, 0x1b])(
        "replaces U+%i with ? in the ASCII state",
        (codePoint) => {
          expect(iso_2022_jp.encode(String.fromCharCode(codePoint))).toEqual(
            Uint8Array.of(0x3f),
          );
        },
      );

      it.for([0x0e, 0x0f, 0x1b])(
        "replaces U+%i with ? in the Roman state",
        (codePoint) => {
          expect(
            iso_2022_jp.encode("¥" + String.fromCharCode(codePoint)),
          ).toEqual(
            Uint8Array.of(
              ...ESCAPE_SEQUENCES.roman,
              0x5c,
              0x3f,
              ...ESCAPE_SEQUENCES.ascii,
            ),
          );
        },
      );

      it.for([0x0e, 0x0f, 0x1b])(
        "returns to ASCII before replacing U+%i with ? from the JIS X 0208 state",
        (codePoint) => {
          expect(
            iso_2022_jp.encode("あ" + String.fromCharCode(codePoint)),
          ).toEqual(
            Uint8Array.of(
              ...ESCAPE_SEQUENCES.jis0208,
              0x24,
              0x22,
              ...ESCAPE_SEQUENCES.ascii,
              0x3f,
            ),
          );
        },
      );

      it("cannot be used to inject an escape sequence", () => {
        const encoded = iso_2022_jp.encode("\x1b$B");

        expect(encoded).toEqual(Uint8Array.of(0x3f, 0x24, 0x42));
        expect(iso_2022_jp.decode(encoded)).toBe("?$B");
      });
    });
    describe("unencodable characters", () => {
      it("replaces them with ? in the ASCII state", () => {
        expect(iso_2022_jp.encode("a😅b")).toEqual(
          Uint8Array.of(0x61, 0x3f, 0x62),
        );
      });

      it("replaces a surrogate pair with a single ?", () => {
        expect(iso_2022_jp.encode("😅")).toEqual(Uint8Array.of(0x3f));
      });

      it("replaces a lone surrogate with ?", () => {
        expect(iso_2022_jp.encode("a\uD83Db")).toEqual(
          Uint8Array.of(0x61, 0x3f, 0x62),
        );
      });

      it("replaces them with ? in the Roman state without leaving it", () => {
        expect(iso_2022_jp.encode("¥😅¥")).toEqual(
          Uint8Array.of(
            ...ESCAPE_SEQUENCES.roman,
            0x5c,
            0x3f,
            0x5c,
            ...ESCAPE_SEQUENCES.ascii,
          ),
        );
      });
      it("returns to ASCII before replacing them from the JIS X 0208 state", () => {
        expect(iso_2022_jp.encode("あ😅い")).toEqual(
          Uint8Array.of(
            ...ESCAPE_SEQUENCES.jis0208,
            0x24,
            0x22,
            ...ESCAPE_SEQUENCES.ascii,
            0x3f,
            ...ESCAPE_SEQUENCES.jis0208,
            0x24,
            0x24,
            ...ESCAPE_SEQUENCES.ascii,
          ),
        );
      });
      it("replaces characters outside of JIS X 0208", () => {
        expect(iso_2022_jp.encode("é€")).toEqual(textEncoder.encode("??"));
      });
    });

    it.for(["あ", "¥", "ｱ", "あ¥あ", "¥あ¥", "¥a", "あ😅あ"])(
      "finishes in the ASCII state for %s",
      (input) => {
        expect(iso_2022_jp.encode(input).subarray(-3)).toEqual(
          ESCAPE_SEQUENCES.ascii,
        );
      },
    );

    it("does not emit a redundant escape sequence when already in ASCII", () => {
      // No trailing ESC ( B after the final ASCII character
      expect(iso_2022_jp.encode("あa")).toEqual(
        Uint8Array.of(
          ...ESCAPE_SEQUENCES.jis0208,
          0x24,
          0x22,
          ...ESCAPE_SEQUENCES.ascii,
          0x61,
        ),
      );
      expect(iso_2022_jp.encode("abc")).toEqual(
        Uint8Array.of(0x61, 0x62, 0x63),
      );
    });

    it("returns an exactly-sized buffer", () => {
      const encoded = iso_2022_jp.encode("あ¥a");

      expect(encoded.byteOffset).toBe(0);
      expect(encoded.buffer.byteLength).toBe(encoded.length);
    });

    it("does not overrun its buffer in the worst case scenario", () => {
      // Every character requires a 3 byte escape sequence and 2 bytes (or 1)
      const input = "あ¥".repeat(1000);
      const encoded = iso_2022_jp.encode(input);

      expect(encoded).toHaveLength(1000 * (3 + 2 + 3 + 1) + 3);
      expect(iso_2022_jp.decode(encoded)).toBe(input);
    });
  });

  describe("decode", () => {
    it("decodes ASCII", () => {
      expect(
        iso_2022_jp.decode(
          new Uint8Array(Array.from("Hello, world!", (c) => c.charCodeAt(0))),
        ),
      ).toBe("Hello, world!");
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
      }),
    )("%s", ([, input]) => {
      const encodedInput = iso_2022_jp.encode(input);

      expect(iso_2022_jp.decode(encodedInput)).toBe(input);
    });

    it("JIS0208 index", async () => {
      const input = jis0208_entries.map(([char]) => char).join("");
      const encodedInput = iso_2022_jp.encode(input);

      // I believe this bug is related to a Chromium bug involving ISO-2022-JP
      // state, where using a cached TextDecoder will retain state and thus, the
      // output will append the unicode replacement character ("\ufffd")
      // https://issues.chromium.org/issues/467624168
      expect(new TextDecoder("iso-2022-jp").decode(encodedInput)).toBe(input);
    });
  });
});
