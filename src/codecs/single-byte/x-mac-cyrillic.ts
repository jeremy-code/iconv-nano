import x_mac_cyrillic from "../../../encodings/x-mac-cyrillic.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { getSingleByteEncodingIndex } from "../../utils/getSingleByteEncodingIndex.js";

const x_mac_cyrillic_index = getSingleByteEncodingIndex(x_mac_cyrillic);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, x_mac_cyrillic_index);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("x-mac-cyrillic", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
