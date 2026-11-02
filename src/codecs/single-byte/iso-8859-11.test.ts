import { describe, expect, it } from "vitest";

import * as iso_8859_11 from "./iso-8859-11.js";

describe("ISO-8859-11", () => {
  describe("encode", () => {
    it("returns empty Uint8Array for empty string", () => {
      expect(iso_8859_11.encode("")).toHaveLength(0);
    });

    it("correctly encodes input", () => {
      expect(iso_8859_11.encode("ก")).toEqual(new Uint8Array([0xa1]));
      expect(iso_8859_11.encode("ฺ")).toEqual(new Uint8Array([0xda]));
      expect(iso_8859_11.encode("฿")).toEqual(new Uint8Array([0xdf]));
      expect(iso_8859_11.encode("๛")).toEqual(new Uint8Array([0xfb]));
    });
  });

  describe("decode", () => {
    it("returns empty string for empty Uint8Array", () => {
      expect(iso_8859_11.decode(new Uint8Array())).toBe("");
    });
  });

  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
        "U+00A0 (NBSP)": String.fromCodePoint(0xa0),
        // https://en.wikipedia.org/wiki/Thai_(Unicode_block)
        Thai: String.fromCodePoint(
          ...Array.from({ length: 0xe3a - 0xe01 + 1 }, (_, i) => i + 0xe01),
          ...Array.from({ length: 0xe5b - 0xe3f + 1 }, (_, i) => i + 0xe3f),
        ),
      }),
    )("%s", ([, input]) => {
      const encodedInput = iso_8859_11.encode(input);

      expect(iso_8859_11.decode(encodedInput)).toBe(input);
    });
  });
});
