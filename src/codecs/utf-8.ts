import type { Encoder, Decoder } from "../interfaces.js";
import { getCachedTextDecoder } from "../utils/getCachedTextDecoder.js";
import { getCachedTextEncoder } from "../utils/getCachedTextEncoder.js";

/**
 * {@link EncodeOptions.addBOM} is ignored. If you want it to be output, append
 * "\ufeff" to your string
 */
const encode: Encoder = (input) => {
  return getCachedTextEncoder().encode(input);
};

/**
 * {@link DecodeOptions.stripBOM} will strip BOM if it is found at the beginning
 * of input
 */
const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("utf-8", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
