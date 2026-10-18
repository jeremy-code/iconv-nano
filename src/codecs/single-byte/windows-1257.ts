import windows_1257 from "../../../encodings/windows-1257.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { createSingleByteLookup } from "../../utils/singleByte.js";

const lookupWindows1257CodePoint = createSingleByteLookup(windows_1257);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, lookupWindows1257CodePoint);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("windows-1257", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
