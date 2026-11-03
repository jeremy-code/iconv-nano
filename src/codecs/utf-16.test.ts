import { describe, it, expect } from "vitest";

import * as utf_16 from "./utf-16.js";

const isLittleEndianPlatform = () => {
  const buf = new Uint16Array([1]);
  const isLittleEndian =
    new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)[0] === 1;

  return isLittleEndian;
};

describe("UTF-16", () => {
  describe("encode", () => {
    describe("addBOM", () => {
      it("encodes byte order mark when true", () => {
        expect(
          utf_16.encode("", {
            addBOM: true,
            endianness: "little-endian",
          }),
        ).toEqual(new Uint8Array([0xff, 0xfe]));
        expect(
          utf_16.encode("", {
            addBOM: true,
            endianness: "big-endian",
          }),
        ).toEqual(new Uint8Array([0xfe, 0xff]));
      });
      it("does not encode byte order mark when false", () => {
        expect(
          utf_16.encode("", {
            addBOM: false,
            endianness: "little-endian",
          }),
        ).toEqual(new Uint8Array());
        expect(
          utf_16.encode("", {
            addBOM: false,
            endianness: "big-endian",
          }),
        ).toEqual(new Uint8Array());
      });
    });

    describe("endianness", () => {
      it("encodes input with system endianness correctly", () => {
        const input = "Hello world!😀🚀🧑‍🧑‍🧒‍🧒";
        expect(
          utf_16.encode(input, {
            addBOM: false,
            endianness: isLittleEndianPlatform()
              ? "little-endian"
              : "big-endian",
          }),
        ).toEqual(
          new Uint8Array(
            new Uint16Array(
              Array.from({ length: input.length }, (_, i) =>
                input.charCodeAt(i),
              ),
            ).buffer,
          ),
        );
      });
      it("defaults to little endian", () => {
        const input = "Hello world!😀🚀🧑‍🧑‍🧒‍🧒";
        expect(utf_16.encode(input)).toEqual(
          utf_16.encode(input, {
            endianness: "little-endian",
          }),
        );
      });
    });

    // Lone surrogates should be silently replaced with Unicode replacement
    // character to match TextEncoder implementation
    //
    // new TextEncoder().encode("\ud83d") // Uint8Array([0xef, 0xbf, 0xbd]])
    it("handles lone surrogates", () => {
      expect(
        utf_16.encode("\ud83d", {
          endianness: "big-endian",
        }),
      ).toEqual(new Uint8Array([0xff, 0xfd]));
      expect(
        utf_16.encode("\ud83d", {
          endianness: "little-endian",
        }),
      ).toEqual(new Uint8Array([0xfd, 0xff]));
    });
  });

  describe("decode", () => {
    describe("addBOM", () => {
      it("defaults to true", () => {
        expect(
          utf_16.decode(new Uint8Array([0xff, 0xfe]), {
            endianness: "little-endian",
          }),
        ).toEqual("");
        expect(
          utf_16.decode(new Uint8Array([0xfe, 0xff]), {
            stripBOM: true,
            endianness: "big-endian",
          }),
        ).toEqual("");
      });
      it("strips byte order mark when true", () => {
        expect(
          utf_16.decode(new Uint8Array([0xff, 0xfe]), {
            stripBOM: true,
            endianness: "little-endian",
          }),
        ).toEqual("");
        expect(
          utf_16.decode(new Uint8Array([0xfe, 0xff]), {
            stripBOM: true,
            endianness: "big-endian",
          }),
        ).toEqual("");
      });
      it("does not strip byte order mark when false", () => {
        expect(
          utf_16.decode(new Uint8Array([0xff, 0xfe]), {
            stripBOM: false,
            endianness: "little-endian",
          }),
        ).toEqual("\ufeff");
        expect(
          utf_16.decode(new Uint8Array([0xfe, 0xff]), {
            stripBOM: false,
            endianness: "big-endian",
          }),
        ).toEqual("\ufeff");
      });
    });

    describe("detectEndianness", () => {
      it("detects endianness when true", () => {
        expect(
          utf_16.decode(
            utf_16.encode("Hello world!🌍😀🚀", {
              endianness: "big-endian",
              addBOM: true,
            }),
            {
              detectEndianness: true,
            },
          ),
        ).toBe("Hello world!🌍😀🚀");
      });
      it("does not detect endianness when false", () => {
        expect(
          utf_16.decode(
            utf_16.encode("Hello world!🌍😀🚀", {
              endianness: "big-endian",
              addBOM: true,
            }),
            { detectEndianness: false },
          ),
        ).toBe("￾䠀攀氀氀漀 眀漀爀氀搀℀㳘ෟ㷘Þ㷘胞");
      });
      it("does not override endianness", () => {
        expect(
          utf_16.decode(
            utf_16.encode("Hello world!🌍😀🚀", {
              endianness: "big-endian",
              addBOM: true,
            }),
            { endianness: "little-endian" },
          ),
        ).toBe("￾䠀攀氀氀漀 眀漀爀氀搀℀㳘ෟ㷘Þ㷘胞");
      });
    });
  });
});
