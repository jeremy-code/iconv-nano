import { describe, it, expect } from "vitest";

import * as utf_32 from "./utf-32.js";

describe("UTF-32", () => {
  describe("encode", () => {
    describe("addBOM", () => {
      it("adds BOM when true", () => {
        expect(
          utf_32.encode("A", {
            endianness: "little-endian",
            addBOM: true,
          }),
        ).toEqual(Uint8Array.fromHex("fffe000041000000"));
        expect(
          utf_32.encode("A", {
            endianness: "big-endian",
            addBOM: true,
          }),
        ).toEqual(Uint8Array.fromHex("0000feff00000041"));
      });
      it("does not add BOM when false", () => {
        expect(
          utf_32.encode("A", {
            endianness: "little-endian",
            addBOM: false,
          }),
        ).toEqual(Uint8Array.fromHex("41000000"));
        expect(
          utf_32.encode("A", {
            endianness: "big-endian",
            addBOM: false,
          }),
        ).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x41]));
      });
      it("returns only BOM when encoding empty string when true", () => {
        expect(utf_32.encode("", { addBOM: true })).toEqual(
          new Uint8Array([0xff, 0xfe, 0x00, 0x00]),
        );
        expect(
          utf_32.encode("", { addBOM: true, endianness: "big-endian" }),
        ).toEqual(new Uint8Array([0x00, 0x00, 0xfe, 0xff]));
      });
      it("does not add a BOM by default", () => {
        expect(utf_32.encode("A")).toEqual(
          new Uint8Array([0x41, 0x00, 0x00, 0x00]),
        );
      });
    });

    describe("endianness", () => {
      it("encodes little-endian by default", () => {
        expect(utf_32.encode("Aé")).toEqual(
          Uint8Array.fromHex("41000000e9000000"),
        );
      });
      it("encodes little-endian", () => {
        expect(
          utf_32.encode("ABC", {
            endianness: "little-endian",
          }),
        ).toEqual(Uint8Array.fromHex("410000004200000043000000"));
      });
      it("encodes big-endian", () => {
        expect(
          utf_32.encode("ABC", {
            endianness: "big-endian",
          }),
        ).toEqual(Uint8Array.fromHex("000000410000004200000043"));
        expect(utf_32.encode("Aé", { endianness: "big-endian" })).toEqual(
          Uint8Array.fromHex("00000041000000e9"),
        );
      });
    });

    it("encodes surrogate pairs", () => {
      expect(utf_32.encode("😀", { endianness: "little-endian" })).toEqual(
        new Uint8Array([0x00, 0xf6, 0x01, 0x00]),
      );
      expect(utf_32.encode("😀", { endianness: "big-endian" })).toEqual(
        new Uint8Array([0x00, 0x01, 0xf6, 0x00]),
      );
      expect(utf_32.encode("A😀B")).toEqual(
        Uint8Array.fromHex("4100000000f6010042000000"),
      );
      expect(utf_32.encode("A😀B", { endianness: "big-endian" })).toEqual(
        Uint8Array.fromHex("000000410001f60000000042"),
      );
    });

    it("returns empty Uint8Array for empty string", () => {
      expect(utf_32.encode("")).toHaveLength(0);
    });

    it("returns an exactly-sized buffer", () => {
      const encodedInput = utf_32.encode(
        "𐎀👨‍👩‍👧‍👦🇩🇪🪞\uD83D\uD83D\uDE00\uDE00\uFFFF\uD800",
      );
      expect(encodedInput.byteOffset).toBe(0);
      expect(encodedInput.buffer.byteLength).toBe(encodedInput.length);
    });
  });

  describe("decode", () => {
    describe("stripBOM", () => {
      it("strips the BOM by default", () => {
        expect(utf_32.decode(Uint8Array.fromHex("fffe000041000000"))).toBe("A");
      });
      it("strips the BOM when true", () => {
        expect(
          utf_32.decode(Uint8Array.fromHex("fffe000041000000"), {
            endianness: "little-endian",
            stripBOM: true,
          }),
        ).toBe("A");
        expect(
          utf_32.decode(Uint8Array.fromHex("0000feff00000041"), {
            endianness: "big-endian",
            stripBOM: true,
          }),
        ).toBe("A");
      });
      it("does not strip BOM when false", () => {
        expect(
          utf_32.decode(Uint8Array.fromHex("fffe000041000000"), {
            endianness: "little-endian",
            stripBOM: false,
          }),
        ).toBe("\ufeffA");
        expect(
          utf_32.decode(Uint8Array.fromHex("0000feff00000041"), {
            endianness: "big-endian",
            stripBOM: false,
          }),
        ).toBe("\ufeffA");
      });
      it("only strips BOM in first character when true", () => {
        expect(
          utf_32.decode(Uint8Array.fromHex("fffe0000fffe0000"), {
            endianness: "little-endian",
            stripBOM: true,
          }),
        ).toBe("\ufeff");
        expect(
          utf_32.decode(Uint8Array.fromHex("0000feff0000feff"), {
            endianness: "big-endian",
            stripBOM: true,
          }),
        ).toBe("\ufeff");
      });
    });
    describe("endianness", () => {
      it("decodes little-endian by default", () => {
        expect(utf_32.decode(Uint8Array.fromHex("41000000e9000000"))).toBe(
          "Aé",
        );
      });
      it("decodes big-endian", () => {
        expect(
          utf_32.decode(Uint8Array.fromHex("00000041000000e9"), {
            endianness: "big-endian",
          }),
        ).toBe("Aé");
      });
    });
    describe("detectEndianness", () => {
      it("detects endianness when true", () => {
        expect.hasAssertions();
        (["little-endian", "big-endian"] as const).forEach((endianness) =>
          expect(
            utf_32.decode(
              utf_32.encode("Hello world!🌍😀🚀", {
                endianness,
                addBOM: true,
              }),
              { detectEndianness: true },
            ),
          ).toBe("Hello world!🌍😀🚀"),
        );
      });
      it("does not detect endianness when false", () => {
        expect.hasAssertions();
        (["little-endian", "big-endian"] as const).forEach((endianness) =>
          expect(
            utf_32.decode(
              utf_32.encode("Hello world!🌍😀🚀", {
                endianness,
                addBOM: true,
              }),
              {
                detectEndianness: true,
                endianness:
                  endianness === "big-endian" ? "little-endian" : "big-endian",
              },
            ),
          ).toBe("Hello world!🌍😀🚀"),
        );
      });
      it("uses detected endianness instead of configured endianness", () => {
        expect(
          utf_32.decode(Uint8Array.fromHex("0000feff00000041"), {
            detectEndianness: true,
            endianness: "little-endian",
          }),
        ).toBe("A");
      });
    });
    it("returns empty string for empty Uint8Array", () => {
      expect(utf_32.decode(new Uint8Array())).toBe("");
    });
    it("replaces code points outside the Unicode range (>0x10ffff)", () => {
      expect(
        utf_32.decode(Uint8Array.fromHex("00001100ffffffff41000000")),
      ).toBe("��A");
    });
    it("handles input when length is not a multiple of four", () => {
      // new TextDecoder("utf-16le").decode(new Uint8Array([0])) // "�"
      expect(utf_32.decode(new Uint8Array([0x41, 0x00, 0x00]))).toBe("\ufffd");
      // new TextDecoder("utf-16le").decode(new Uint8Array([0x41,0,0])) // "A�"
      expect(
        utf_32.decode(
          new Uint8Array([0x41, 0x00, 0x00, 0x00, 0x41, 0x00, 0x00]),
        ),
      ).toBe("A\ufffd");
    });
    it("decodes surrogates pairs", () => {
      expect(
        utf_32.decode(Uint8Array.fromHex("4100000000f6010042000000")),
      ).toBe("A😀B");
    });
    it("handles lone surrogates", () => {
      expect(
        utf_32.decode(Uint8Array.fromHex("0000d83d"), {
          endianness: "big-endian",
        }),
      ).toBe("\ufffd");
      expect(
        utf_32.decode(Uint8Array.fromHex("3dd80000"), {
          endianness: "little-endian",
        }),
      ).toBe("\ufffd");
      // d800dc00 is 𐀀 in UTF-16BE
      expect(
        utf_32.decode(Uint8Array.fromHex("0000d8000000dc00"), {
          endianness: "big-endian",
        }),
      ).toBe("\ufffd\ufffd");
      // 00d800dc is 𐀀 in UTF-16LE
      expect(
        utf_32.decode(Uint8Array.fromHex("00d8000000dc0000"), {
          endianness: "little-endian",
        }),
      ).toBe("\ufffd\ufffd");
    });

    it("respects input's byteOffset and byteLength", () => {
      const buffer = new Uint8Array([
        0xff,
        ...Uint8Array.fromHex("41000000"),
        0xff,
      ]);

      expect(utf_32.decode(buffer.slice(1, 5))).toBe("A");
      expect(utf_32.decode(new DataView(buffer.buffer, 1, 4))).toBe("A");
    });

    it.for([
      [
        "Uint8Array",
        // python3 -c 'print("🅰️🅱️🇨🔠🇩🔡".encode("utf-32").hex())'
        Uint8Array.fromHex(
          "70f101000ffe000071f101000ffe0000e8f1010020f50100e9f1010021f50100",
        ),
        "🅰️🅱️🇨🔠🇩🔡",
      ],
      [
        "Uint16Array",
        new Uint16Array(
          Uint8Array.fromHex(
            "70f101000ffe000071f101000ffe0000e8f1010020f50100e9f1010021f50100",
          ).buffer,
        ),
        "🅰️🅱️🇨🔠🇩🔡",
      ],
      [
        "Uint32Array",
        new Uint32Array(
          Uint8Array.fromHex(
            "70f101000ffe000071f101000ffe0000e8f1010020f50100e9f1010021f50100",
          ).buffer,
        ),
        "🅰️🅱️🇨🔠🇩🔡",
      ],
      [
        "ArrayBuffer",
        Uint8Array.fromHex(
          "70f101000ffe000071f101000ffe0000e8f1010020f50100e9f1010021f50100",
        ).buffer,
        "🅰️🅱️🇨🔠🇩🔡",
      ],
      [
        "DataView",
        new DataView(
          Uint8Array.fromHex(
            "70f101000ffe000071f101000ffe0000e8f1010020f50100e9f1010021f50100",
          ).buffer,
        ),
        "🅰️🅱️🇨🔠🇩🔡",
      ],
    ] as const)("handles %s input", ([, data, expectedOutput]) => {
      expect(utf_32.decode(data, { endianness: "little-endian" })).toBe(
        expectedOutput,
      );
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
      }),
    )("%s", ([, input]) => {
      expect(utf_32.decode(utf_32.encode(input))).toBe(input);
    });
  });
});
