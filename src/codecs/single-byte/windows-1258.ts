import windows_1258 from "../../../encodings/windows-1258.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { getSingleByteEncodingIndex } from "../../utils/getSingleByteEncodingIndex.js";

const windows_1258_index = getSingleByteEncodingIndex(windows_1258);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, windows_1258_index);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("windows-1258", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
