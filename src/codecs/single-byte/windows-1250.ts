import windows_1250 from "../../../encodings/windows-1250.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { createSingleByteLookup } from "../../utils/singleByte.js";

const lookupWindows1250CodePoint = createSingleByteLookup(windows_1250);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, lookupWindows1250CodePoint);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("windows-1250", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
