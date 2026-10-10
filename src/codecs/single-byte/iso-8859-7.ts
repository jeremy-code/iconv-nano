import iso_8859_7 from "../../../encodings/iso-8859-7.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { getSingleByteEncodingIndex } from "../../utils/getSingleByteEncodingIndex.js";

const iso_8859_7_index = getSingleByteEncodingIndex(iso_8859_7);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, iso_8859_7_index);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("iso-8859-7", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
