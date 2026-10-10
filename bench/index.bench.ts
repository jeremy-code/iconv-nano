import * as iconv from "iconv-nano";
import { describe, expect, it } from "vitest";

const SINGLE_BYTE_CODECS = {
  IBM866: iconv.ibm866,
  "ISO-8859-2": iconv.iso_8859_2,
  "ISO-8859-3": iconv.iso_8859_3,
  "ISO-8859-4": iconv.iso_8859_4,
  "ISO-8859-5": iconv.iso_8859_5,
  "ISO-8859-6": iconv.iso_8859_6,
  "ISO-8859-7": iconv.iso_8859_7,
  "ISO-8859-8": iconv.iso_8859_8,
  "ISO-8859-8-I": iconv.iso_8859_8_i,
  "ISO-8859-10": iconv.iso_8859_10,
  "ISO-8859-13": iconv.iso_8859_13,
  "ISO-8859-14": iconv.iso_8859_14,
  "ISO-8859-15": iconv.iso_8859_15,
  "ISO-8859-16": iconv.iso_8859_16,
  "KOI8-R": iconv.koi8_r,
  "KOI8-U": iconv.koi8_u,
  macintosh: iconv.macintosh,
  "windows-874": iconv.windows_874,
  "windows-1250": iconv.windows_1250,
  "windows-1251": iconv.windows_1251,
  "windows-1252": iconv.windows_1252,
  "windows-1253": iconv.windows_1253,
  "windows-1254": iconv.windows_1254,
  "windows-1255": iconv.windows_1255,
  "windows-1256": iconv.windows_1256,
  "windows-1257": iconv.windows_1257,
  "windows-1258": iconv.windows_1258,
  "x-mac-cyrillic": iconv.x_mac_cyrillic,
};

describe("encoding performance", () => {
  it.for(Object.entries(SINGLE_BYTE_CODECS))(
    "%s",
    async ([, codec], { bench }) => {
      const input = codec
        .decode(Uint8Array.from({ length: 256 }, (_, i) => i))
        .replaceAll("\uFFFD", "?")
        .repeat(3);
      const result = await bench("parse", () => {
        return codec.encode(input);
      }).run();

      expect(result.throughput.mean).toBeGreaterThan(20_000);
    },
  );
});
