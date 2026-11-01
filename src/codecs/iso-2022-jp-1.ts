import iso_2022_jp_katakana from "../../encodings/iso-2022-jp-katakana.json" with { type: "json" };
import { PAYLOAD } from "../../encodings/jis0212.js";
import type { Decoder, Encoder } from "../interfaces.js";
import { lookupJis0208CodePoint } from "../shared/lookupJis0208CodePoint.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { isAsciiCodePoint } from "../utils/isAsciiCodePoint.js";
import { decodeVlqRunsLookup } from "../utils/vlqRuns.js";

const lookupJis0212CodePoint = decodeVlqRunsLookup(PAYLOAD);

const enum EncoderState {
  Ascii,
  Roman,
  Jis0208,
  Jis0212,
}

// ISO-2022-JP-1 escape sequences as big-endian numbers
const enum EscapeSequence {
  Ascii = 0x1b2842,
  Roman = 0x1b284a,
  Jis0208 = 0x1b2442,
  Jis0212 = 0x1b242844,
}

const YEN_CODE_POINT = 0xa5; // ¥
const OVERLINE_CODE_POINT = 0x203e; // ‾

/**
 * @see {@link https://www.rfc-editor.org/info/rfc2237/}
 */
const encode: Encoder = (input) => {
  const buf = new Uint8Array(input.length * 6 + 3);
  let byteOffset = 0;
  let encoderState: EncoderState = EncoderState.Ascii;

  let index = 0;
  while (index < input.length) {
    let codePoint = input.codePointAt(index)!;
    const codePointWidth = codePoint > 0xffff ? 2 : 1;
    index += codePointWidth;

    if (
      (encoderState === EncoderState.Ascii ||
        encoderState === EncoderState.Roman) &&
      (codePoint === 0x0e /* Shift Out (SO) */ ||
        codePoint === 0x0f /* Shift In (SI) */ ||
        codePoint === 0x1b) /* ESCAPE (ESC) */
    ) {
      buf[byteOffset] = 0x3f;
      byteOffset++;
      continue;
    }

    // STEP_4
    if (encoderState === EncoderState.Ascii && isAsciiCodePoint(codePoint)) {
      buf[byteOffset] = codePoint;
      byteOffset++;
      continue;
    }

    // STEP_5
    if (
      encoderState === EncoderState.Roman &&
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

    if (isAsciiCodePoint(codePoint) && encoderState !== EncoderState.Ascii) {
      index -= codePointWidth;
      encoderState = EncoderState.Ascii;
      buf[byteOffset] = (EscapeSequence.Ascii >> 16) & 0xff;
      buf[byteOffset + 1] = (EscapeSequence.Ascii >> 8) & 0xff;
      buf[byteOffset + 2] = EscapeSequence.Ascii & 0xff;
      byteOffset += 3;
      continue;
    }

    if (
      (codePoint === YEN_CODE_POINT || codePoint === OVERLINE_CODE_POINT) &&
      encoderState !== EncoderState.Roman
    ) {
      index -= codePointWidth;
      encoderState = EncoderState.Roman;
      buf[byteOffset] = (EscapeSequence.Roman >> 16) & 0xff;
      buf[byteOffset + 1] = (EscapeSequence.Roman >> 8) & 0xff;
      buf[byteOffset + 2] = EscapeSequence.Roman & 0xff;
      byteOffset += 3;
      continue;
    }

    if (codePoint === 0x2212 /* − */) {
      codePoint = 0xff0d; // －
    }

    if (/* ｡ */ 0xff61 <= codePoint && codePoint <= 0xff9f /* ﾟ */) {
      // Map half-width kana to full-width equivalent
      codePoint = iso_2022_jp_katakana[codePoint - 0xff61]!;
    }

    const jis0208Pointer = lookupJis0208CodePoint(codePoint);
    const jis0212Pointer =
      jis0208Pointer === -1 ? lookupJis0212CodePoint(codePoint) : -1;
    let pointer = jis0208Pointer !== -1 ? jis0208Pointer : jis0212Pointer;

    if (pointer === -1) {
      // Switch back to ASCII and let the codepoint be processed again
      if (
        encoderState === EncoderState.Jis0208 ||
        encoderState === EncoderState.Jis0212
      ) {
        index -= codePointWidth;
        encoderState = EncoderState.Ascii;
        buf[byteOffset] = (EscapeSequence.Ascii >> 16) & 0xff;
        buf[byteOffset + 1] = (EscapeSequence.Ascii >> 8) & 0xff;
        buf[byteOffset + 2] = EscapeSequence.Ascii & 0xff;
        byteOffset += 3;
        continue;
      }
      buf[byteOffset] = 0x3f; // ?
      byteOffset++;
      continue;
    }

    if (encoderState !== EncoderState.Jis0208 && jis0208Pointer !== -1) {
      index -= codePointWidth;
      encoderState = EncoderState.Jis0208;
      buf[byteOffset] = (EscapeSequence.Jis0208 >> 16) & 0xff;
      buf[byteOffset + 1] = (EscapeSequence.Jis0208 >> 8) & 0xff;
      buf[byteOffset + 2] = EscapeSequence.Jis0208 & 0xff;
      byteOffset += 3;
      continue;
    } else if (encoderState !== EncoderState.Jis0212 && jis0212Pointer !== -1) {
      index -= codePointWidth;
      encoderState = EncoderState.Jis0212;
      buf[byteOffset] = (EscapeSequence.Jis0212 >> 24) & 0xff;
      buf[byteOffset + 1] = (EscapeSequence.Jis0212 >> 16) & 0xff;
      buf[byteOffset + 2] = (EscapeSequence.Jis0212 >> 8) & 0xff;
      buf[byteOffset + 3] = EscapeSequence.Jis0212 & 0xff;
      byteOffset += 4;
      continue;
    }

    buf[byteOffset] = Math.floor(pointer / 94) + 0x21;
    buf[byteOffset + 1] = (pointer % 94) + 0x21;
    byteOffset += 2;
  }

  if (encoderState !== EncoderState.Ascii) {
    encoderState = EncoderState.Ascii;
    buf[byteOffset] = (EscapeSequence.Ascii >> 16) & 0xff;
    buf[byteOffset + 1] = (EscapeSequence.Ascii >> 8) & 0xff;
    buf[byteOffset + 2] = EscapeSequence.Ascii & 0xff;
    byteOffset += 3;
  }

  return buf.length !== byteOffset ? buf.slice(0, byteOffset) : buf;
};

// Equivalent to (0xa1 & ~0x80) <= byte && byte <= (0xfe & ~0x80)
const isJis0212Byte = (byte: number) => 0x21 <= byte && byte <= 0x7e;

// https://encoding.spec.whatwg.org/#euc-jp-decoder
const decodeJis0212 = (bytes: Uint8Array): string => {
  const buf = new Uint8Array(Math.ceil(bytes.length / 2) * 3);

  let byteOffset = 0;
  let index = 0;
  while (index < bytes.length) {
    const leading = bytes[index]!;
    index++;
    const trailing = bytes[index];

    if (
      isJis0212Byte(leading) &&
      trailing !== undefined &&
      isJis0212Byte(trailing)
    ) {
      buf[byteOffset] = 0x8f;
      buf[byteOffset + 1] = leading | 0x80;
      buf[byteOffset + 2] = trailing | 0x80;
      byteOffset += 3;
      index++;
    } else {
      buf[byteOffset] = 0xff;
      byteOffset++;
    }
  }

  return getCachedTextDecoder("euc-jp", {
    fatal: false,
  }).decode(buf.subarray(0, byteOffset));
};

const isEscapeSequence = (
  values: ArrayLike<number>,
  escapeSequence: EscapeSequence,
) => {
  if (escapeSequence === EscapeSequence.Jis0212) {
    return (
      values.length === 4 &&
      values[0] === ((escapeSequence >> 24) & 0xff) &&
      values[1] === ((escapeSequence >> 16) & 0xff) &&
      values[2] === ((escapeSequence >> 8) & 0xff) &&
      values[3] === (escapeSequence & 0xff)
    );
  }

  return (
    values.length === 3 &&
    values[0] === ((escapeSequence >> 16) & 0xff) &&
    values[1] === ((escapeSequence >> 8) & 0xff) &&
    values[2] === (escapeSequence & 0xff)
  );
};

// https://encoding.spec.whatwg.org/#euc-jp-decoder
const decodeIso2022Jp = (bytes: Uint8Array): string => {
  const startsWithAscii = isEscapeSequence(
    bytes.subarray(0, 3),
    EscapeSequence.Ascii,
  );
  // If it's the final segment, it could end in ASCII
  const endWithAscii = isEscapeSequence(
    bytes.subarray(bytes.length - 3),
    EscapeSequence.Ascii,
  );

  const buf = new Uint8Array(
    (startsWithAscii ? bytes.byteLength - 3 : bytes.byteLength) +
      (endWithAscii ? 0 : 3),
  );
  buf.set(startsWithAscii ? bytes.subarray(3) : bytes, 0);
  if (!endWithAscii) {
    buf[buf.length - 3] = (EscapeSequence.Ascii >> 16) & 0xff;
    buf[buf.length - 2] = (EscapeSequence.Ascii >> 8) & 0xff;
    buf[buf.length - 1] = EscapeSequence.Ascii & 0xff;
  }

  return new TextDecoder("iso-2022-jp", { fatal: false }).decode(buf);
};

/**
 * @see {@link https://www.rfc-editor.org/info/rfc2237/}
 */
const decode: Decoder = (input) => {
  const buf =
    input instanceof Uint8Array
      ? input
      : ArrayBuffer.isView(input)
        ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
        : new Uint8Array(input);

  if (buf.length === 0) {
    return "";
  }

  let encoderState: EncoderState = EncoderState.Ascii;

  let totalSegmentsLength: number | undefined;
  let index = 0;
  const outputArr: string[] = [];

  while (index < buf.length) {
    if (index + 2 < buf.length) {
      const sequence = buf.subarray(index, index + 3);

      if (isEscapeSequence(sequence, EscapeSequence.Ascii)) {
        encoderState = EncoderState.Ascii;
        index += 3;
        continue;
      } else if (isEscapeSequence(sequence, EscapeSequence.Roman)) {
        encoderState = EncoderState.Roman;
        index += 3;
        continue;
      } else if (isEscapeSequence(sequence, EscapeSequence.Jis0208)) {
        encoderState = EncoderState.Jis0208;
        index += 3;
        continue;
      }
    }
    if (index + 3 < buf.length) {
      if (
        isEscapeSequence(buf.subarray(index, index + 4), EscapeSequence.Jis0212)
      ) {
        const iso2022JpSegment = buf.subarray(totalSegmentsLength ?? 0, index);
        outputArr.push(decodeIso2022Jp(iso2022JpSegment));
        totalSegmentsLength =
          (totalSegmentsLength ?? 0) + iso2022JpSegment.length + 4;
        index += 4;
        let nextEncoderStateChange = -1;

        for (let j = index; j < buf.length; j += 2) {
          if (j + 2 < buf.length) {
            const sequence = buf.subarray(j, j + 3);
            if (
              isEscapeSequence(sequence, EscapeSequence.Ascii) ||
              isEscapeSequence(sequence, EscapeSequence.Roman) ||
              isEscapeSequence(sequence, EscapeSequence.Jis0208)
            ) {
              nextEncoderStateChange = j;
              break;
            }
          }
        }

        if (nextEncoderStateChange !== -1) {
          const jis0208Segment = buf.subarray(index, nextEncoderStateChange);
          totalSegmentsLength += jis0208Segment.byteLength;
          outputArr.push(decodeJis0212(jis0208Segment));
          index = nextEncoderStateChange;
        }
        continue;
      }
    }

    index += encoderState === EncoderState.Jis0208 ? 2 : 1;
    // encoderState is never set to EncoderState.Jis0212
  }

  // No Jis0212
  if (totalSegmentsLength === undefined) {
    return decodeIso2022Jp(buf);
  } else if (totalSegmentsLength + 3 !== buf.byteLength) {
    outputArr.push(decodeIso2022Jp(buf.subarray(totalSegmentsLength)));
  }

  return outputArr.join("");
};

export { encode, decode };
