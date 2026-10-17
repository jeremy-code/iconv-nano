import { describe, it, expect } from "vitest";

import * as utf_8 from "./utf-8.js";

describe("UTF-8", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("Hello world‼👋🌍".encode("utf-8").hex())'
      expect(utf_8.encode("Hello world‼👋🌍")).toEqual(
        Uint8Array.fromHex("48656c6c6f20776f726c64e280bcf09f918bf09f8c8d"),
      );
    });

    it("encodes byte order mark if appended to input", () => {
      expect(utf_8.encode("\ufeffABC")).toEqual(
        new Uint8Array([0xef, 0xbb, 0xbf, 0x41, 0x42, 0x43]),
      );
    });
  });

  describe("decode", () => {
    describe("stripBOM", () => {
      it("defaults to true", () => {
        expect(utf_8.decode(utf_8.encode("\ufeffHello world!"))).toBe(
          "Hello world!",
        );
      });
      it("strips BOM when true", () => {
        expect(
          utf_8.decode(utf_8.encode("\ufeffHello world!"), {
            stripBOM: true,
          }),
        ).toBe("Hello world!");
      });
      it("does nothing when true and there isn't a BOM", () => {
        expect(
          utf_8.decode(utf_8.encode("Hello world!"), {
            stripBOM: true,
          }),
        ).toBe("Hello world!");
      });
      it("does not strip BOM when false", () => {
        expect(
          utf_8.decode(utf_8.encode("\ufeffHello world!"), {
            stripBOM: false,
          }),
        ).toBe("\ufeffHello world!");
      });
    });

    describe("handles buffer sources", () => {
      it("ArrayBuffer", () => {
        expect(
          utf_8.decode(utf_8.encode("\ufeffHello world!").buffer, {
            stripBOM: true,
          }),
        ).toBe("Hello world!");
      });
    });
  });
});
