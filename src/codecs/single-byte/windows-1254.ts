import windows_1254 from "../../../encodings/windows-1254.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { createSingleByteLookup } from "../../utils/singleByte.js";

const lookupWindows1254CodePoint = createSingleByteLookup(windows_1254);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, lookupWindows1254CodePoint);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("windows-1254", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
