import windows_874 from "../../../encodings/windows-874.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { getSingleByteEncodingIndex } from "../../utils/getSingleByteEncodingIndex.js";

const windows_874_index = getSingleByteEncodingIndex(windows_874);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, windows_874_index);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("windows-874", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
