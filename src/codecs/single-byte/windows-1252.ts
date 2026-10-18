import windows_1252 from "../../../encodings/windows-1252.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { createSingleByteLookup } from "../../utils/singleByte.js";

const lookupWindows1252CodePoint = createSingleByteLookup(windows_1252);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, lookupWindows1252CodePoint);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("windows-1252", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
