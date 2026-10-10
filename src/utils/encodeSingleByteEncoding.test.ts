import { describe, expect, it } from "vitest";

import { encodeSingleByteEncoding } from "./encodeSingleByteEncoding.js";

const encodingIndex = Array.from({
  length: 128,
  0: "€".codePointAt(0),
  0x69: "é".codePointAt(0),
  0x7f: "я".codePointAt(0),
}).map((val) => (val === undefined ? null : val));

// UTF-8 is compatible with ASCII
const textEncoder = new TextEncoder();

describe("encodeSingleByteEncoding", () => {
  it("returns an empty array for an empty string", () => {
    expect(encodeSingleByteEncoding("", encodingIndex)).toEqual(
      new Uint8Array(0),
    );
  });

  it("returns ASCII unchanged", () => {
    const input = "Hello, World!\u0000\u007f";
    expect(encodeSingleByteEncoding(input, encodingIndex)).toEqual(
      textEncoder.encode(input),
    );
  });

  it.for(Object.entries({ "€": 0, é: 0x69, я: 0x7f }))(
    "returns non-ASCII characters (%s) as 0x80 + their value (%d)",
    ([codePoint, value]) => {
      expect(encodeSingleByteEncoding(codePoint, encodingIndex)).toEqual(
        new Uint8Array([0x80 + value]),
      );
    },
  );

  it("returns ASCII and mapped characters", () => {
    expect(encodeSingleByteEncoding("a€bécяd", encodingIndex)).toEqual(
      new Uint8Array([0x61, 0x80, 0x62, 0xe9, 0x63, 0xff, 0x64]),
    );
  });

  it("replaces unmappable characters with '?' (0x3f)", () => {
    expect(encodeSingleByteEncoding("a日b曰c目d", encodingIndex)).toEqual(
      new Uint8Array([0x61, 0x3f, 0x62, 0x3f, 0x63, 0x3f, 0x64]),
    );
  });

  // https://eev.ee/blog/2015/09/12/dark-corners-of-unicode/#javascript-has-no-string-type
  it("returns one '?' for astral characters with multiple UTF-16 code units", () => {
    expect("😅").toHaveLength(2);
    expect(encodeSingleByteEncoding("😅", encodingIndex)).toEqual(
      textEncoder.encode("?"),
    );
  });

  it("replaces lone surrogates with '?'", () => {
    expect(encodeSingleByteEncoding("\ud83d", encodingIndex)).toEqual(
      textEncoder.encode("?"),
    );
  });

  it("returns a Uint8Array with a different length from input with lone surrogates", () => {
    const input = "a€😅";
    const result = encodeSingleByteEncoding(input, encodingIndex);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).not.toHaveLength(input.length);
  });

  // ASCII should not be mapped incorrectly
  it("does not look up ASCII characters in the index", () => {
    expect(encodeSingleByteEncoding("a", ["a".codePointAt(0)!])).toEqual(
      textEncoder.encode("a"),
    );
  });
});
