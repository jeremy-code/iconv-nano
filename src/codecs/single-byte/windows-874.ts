import windows_874 from "../../../encodings/windows-874.json" with { type: "json" };
import type { Encoder, Decoder } from "../../interfaces.js";
import { encodeSingleByteEncoding } from "../../utils/encodeSingleByteEncoding.js";
import { getCachedTextDecoder } from "../../utils/getCachedTextDecoder.js";
import { createSingleByteLookup } from "../../utils/singleByte.js";

const lookupWindows874CodePoint = createSingleByteLookup(windows_874);

const encode: Encoder = (input) => {
  return encodeSingleByteEncoding(input, lookupWindows874CodePoint);
};

const decode: Decoder = (input, decodeOptions) => {
  const stripBOM = decodeOptions?.stripBOM ?? true;

  return getCachedTextDecoder("windows-874", {
    fatal: false,
    ignoreBOM: !stripBOM,
  }).decode(input);
};

export { encode, decode };
