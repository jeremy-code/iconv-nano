import { describe, it, expect } from "vitest";

import * as utf_32 from "./utf-32.js";

describe("UTF-16", () => {
  // python3 -c 'print("🌍".encode("utf-32").hex())'
  it("correctly encodes samples", () => {
    expect(utf_32.encode("🌍", { addBOM: true })).toEqual(
      Uint8Array.fromHex("fffe00000df30100"),
    );
  });
  it("correctly decodes samples", () => {
    expect(
      utf_32.decode(Uint8Array.fromHex("fffe00000df30100"), {
        endianness: "little-endian",
        stripBOM: true,
      }),
    ).toEqual("🌍");
    expect(
      utf_32.decode(Uint8Array.fromHex("fffe00000df30100"), {
        endianness: "little-endian",
        stripBOM: false,
      }),
    ).toEqual("\ufeff🌍");
  });

  // python3 -c 'print("\ufeff🌍😀🚀🧑".encode("utf-32").hex())'
});
