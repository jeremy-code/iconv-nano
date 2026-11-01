import iso_2022_jp_katakana from "../../encodings/iso-2022-jp-katakana.json" with { type: "json" };
import type { Encoder, Decoder } from "../interfaces.js";
import { lookupJis0208CodePoint } from "../shared/lookupJis0208CodePoint.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";

type EncoderState = "ascii" | "roman" | "jis0208";

const YEN_CODE_POINT = 0xa5; // ¥
const OVERLINE_CODE_POINT = 0x203e; // ‾

// ISO-2022-JP escape sequences as big-endian numbers
const ASCII_ESCAPE_SEQUENCE = 0x1b2842;
const ROMAN_ESCAPE_SEQUENCE = 0x1b284a;
const JIS0208_ESCAPE_SEQUENCE = 0x1b2442;

/**
 * Steps from the specification will have commment "STEP_X".
 *
 * @see {@link https://encoding.spec.whatwg.org/#iso-2022-jp-encoder}
 * @see {@link https://www.rfc-editor.org/info/rfc1468/}
 */
const encode: Encoder = (input) => {
  // Worst case for one code point is: 3 bytes for escape sequence, 2 bytes for
  // the character, and 3 bytes for trailing ASCII escape sequence
  const buf = new Uint8Array(input.length * 5 + 3);
  let byteOffset = 0;
  let encoderState: EncoderState = "ascii";

  let index = 0;
  while (index < input.length) {
    let codePoint = input.codePointAt(index)!;
    const codePointWidth = codePoint > 0xffff ? 2 /* surrogate pair */ : 1;
    index += codePointWidth;

    // STEP_3
    if (
      (encoderState === "ascii" || encoderState === "roman") &&
      (codePoint === 0x0e /* Shift Out (SO) */ ||
        codePoint === 0x0f /* Shift In (SI) */ ||
        codePoint === 0x1b) /* ESCAPE (ESC) */
    ) {
      buf[byteOffset] = 0x3f; // ?
      byteOffset++;
      continue;
    }

    // STEP_4
    if (encoderState === "ascii" && isAsciiCodePoint(codePoint)) {
      buf[byteOffset] = codePoint;
      byteOffset++;
      continue;
    }

    // STEP_5
    if (
      encoderState === "roman" &&
      ((isAsciiCodePoint(codePoint) &&
        codePoint !== 0x5c /* \ */ &&
        codePoint !== 0x7e) /* ~ */ ||
        codePoint === YEN_CODE_POINT ||
        codePoint === OVERLINE_CODE_POINT)
    ) {
      buf[byteOffset] =
        codePoint === YEN_CODE_POINT
          ? 0x5c
          : codePoint === OVERLINE_CODE_POINT
            ? 0x7e
            : codePoint;
      byteOffset++;
      continue;
    }

    // STEP_6
    if (isAsciiCodePoint(codePoint) && encoderState !== "ascii") {
      index -= codePointWidth;
      encoderState = "ascii";
      buf[byteOffset] = (ASCII_ESCAPE_SEQUENCE >> 16) & 0xff;
      buf[byteOffset + 1] = (ASCII_ESCAPE_SEQUENCE >> 8) & 0xff;
      buf[byteOffset + 2] = ASCII_ESCAPE_SEQUENCE & 0xff;
      byteOffset += 3;
      continue;
    }

    // STEP_7
    if (
      (codePoint === YEN_CODE_POINT || codePoint === OVERLINE_CODE_POINT) &&
      encoderState !== "roman"
    ) {
      index -= codePointWidth;
      encoderState = "roman";
      buf[byteOffset] = (ROMAN_ESCAPE_SEQUENCE >> 16) & 0xff;
      buf[byteOffset + 1] = (ROMAN_ESCAPE_SEQUENCE >> 8) & 0xff;
      buf[byteOffset + 2] = ROMAN_ESCAPE_SEQUENCE & 0xff;
      byteOffset += 3;
      continue;
    }

    // STEP_8
    if (codePoint === 0x2212 /* − */) {
      codePoint = 0xff0d; // －
    }

    // STEP_9
    if (/* ｡ */ 0xff61 <= codePoint && codePoint <= 0xff9f /* ﾟ */) {
      // Map half-width kana to full-width equivalent
      codePoint = iso_2022_jp_katakana[codePoint - 0xff61]!;
    }

    // STEP_10
    const pointer = lookupJis0208CodePoint(codePoint);

    // STEP_11
    if (pointer === -1) {
      // Switch back to ASCII and let the codepoint be processed again
      if (encoderState === "jis0208") {
        index -= codePointWidth;
        encoderState = "ascii";
        buf[byteOffset] = (ASCII_ESCAPE_SEQUENCE >> 16) & 0xff;
        buf[byteOffset + 1] = (ASCII_ESCAPE_SEQUENCE >> 8) & 0xff;
        buf[byteOffset + 2] = ASCII_ESCAPE_SEQUENCE & 0xff;
        byteOffset += 3;
        continue;
      }
      buf[byteOffset] = 0x3f; // ?
      byteOffset++;
      continue;
    }
    // pointer is not -1 => pointer < 8836

    // STEP_12
    if (encoderState !== "jis0208") {
      index -= codePointWidth;
      encoderState = "jis0208";
      buf[byteOffset] = (JIS0208_ESCAPE_SEQUENCE >> 16) & 0xff;
      buf[byteOffset + 1] = (JIS0208_ESCAPE_SEQUENCE >> 8) & 0xff;
      buf[byteOffset + 2] = JIS0208_ESCAPE_SEQUENCE & 0xff;
      byteOffset += 3;
      continue;
    }

    buf[byteOffset] = Math.floor(pointer / 94) + 0x21; // STEP_13
    buf[byteOffset + 1] = (pointer % 94) + 0x21; // STEP_14
    byteOffset += 2; // STEP_15
  }

  // STEP_1
  if (encoderState !== "ascii") {
    encoderState = "ascii";
    buf[byteOffset] = (ASCII_ESCAPE_SEQUENCE >> 16) & 0xff;
    buf[byteOffset + 1] = (ASCII_ESCAPE_SEQUENCE >> 8) & 0xff;
    buf[byteOffset + 2] = ASCII_ESCAPE_SEQUENCE & 0xff;
    byteOffset += 3;
  }

  return buf.length !== byteOffset ? buf.slice(0, byteOffset) : buf;
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("iso-2022-jp", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
