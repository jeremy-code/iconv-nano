import { describe, expect, it } from "vitest";

import { PAYLOAD } from "../../encodings/shift_jis.js";
import { decodeVlqRuns } from "../utils/vlqRuns.js";
import * as shift_jis from "./shift_jis.js";

// Every character covered by the Shift_JIS index, rebuilt from columnar runs
const { cpStarts, counts } = decodeVlqRuns(PAYLOAD);
const shift_jis_index = cpStarts
  .map((cpStart, i) =>
    String.fromCodePoint(
      ...Array.from({ length: counts[i]! }, (_, offset) => cpStart + offset),
    ),
  )
  .join("");

describe("Shift_JIS", () => {
  describe("encode", () => {
    it("correctly encodes sample inputs", () => {
      // python3 -c 'print("月が綺麗ですね。".encode("shift_jis").hex())'
      expect(shift_jis.encode("月が綺麗ですね。")).toEqual(
        Uint8Array.fromHex("8c8e82aae35997ed82c582b782cb8142"),
      );

      // python3 -c 'print("祇園精舍の鐘の声、諸行無常の響きあり。".encode("shift_jis").hex())'
      expect(
        shift_jis.encode("祇園精舍の鐘の声、諸行無常の響きあり。"),
      ).toEqual(
        Uint8Array.fromHex(
          "8b5f898090b8e47182cc8fe082cc90ba81418f948d7396b38fed82cc8bbf82ab82a082e88142",
        ),
      );

      // python3 -c 'print("だって… あの さっき チェンソーで戦ってたから……".encode("shift_jis").hex())'
      expect(
        shift_jis.encode("だって… あの さっき チェンソーで戦ってたから……"),
      ).toEqual(
        Uint8Array.fromHex(
          "82be82c182c481632082a082cc2082b382c182ab20836083468393835c815b82c590ed82c182c482bd82a982e781638163",
        ),
      );
    });

    it("encodes ¥ as \\", () => {
      const encodedInput = shift_jis.encode("¥");
      expect(encodedInput).toEqual(new Uint8Array(["\\".charCodeAt(0)]));
      expect(shift_jis.decode(encodedInput)).toBe("\\");
    });

    it("encodes ‾ as ~", () => {
      const encodedInput = shift_jis.encode("‾");
      expect(encodedInput).toEqual(new Uint8Array(["~".charCodeAt(0)]));
      expect(shift_jis.decode(encodedInput)).toBe("~");
    });

    it("encodes − as －", () => {
      const encodedInput = shift_jis.encode("−");
      expect(encodedInput).toEqual(shift_jis.encode("－"));
      expect(shift_jis.decode(encodedInput)).toBe("－");
    });

    it("encodes unknown characters as ?", () => {
      const encodedInput = shift_jis.encode("🈲");
      expect(encodedInput).toEqual(shift_jis.encode("?"));
      expect(shift_jis.decode(encodedInput)).toBe("?");
    });
  });

  // The codec does not actually survive roundtrip conversion per the spec: "¥"
  // returns "\" and "‾" returns "~" due to ASCII compatibility
  describe("survives roundtrip conversion", () => {
    it.for(
      Object.entries({
        ASCII: String.fromCodePoint(
          ...Array.from({ length: 0x7f }, (_, i) => i),
        ),
        "U+0080 (PAD)": String.fromCodePoint(0x80),
        "half-width kana": String.fromCodePoint(
          ...Array.from({ length: 0xff9f - 0xff61 }, (_, i) => i + 0xff61),
        ),
        "Shift_JIS index": shift_jis_index,
      }),
    )("%s", ([, input]) => {
      const encodedInput = shift_jis.encode(input);

      expect(shift_jis.decode(encodedInput)).toBe(input);
    });
  });
});
