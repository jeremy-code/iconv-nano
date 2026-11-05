import type { Decoder, Encoder } from "../interfaces.js";
import { encode as utf_32_encode, decode as utf_32_decode } from "./utf-32.js";

const encode: Encoder = (input, options) =>
  utf_32_encode(input, { ...options, endianness: "little-endian" });

const decode: Decoder = (input, options) =>
  utf_32_decode(input, {
    ...options,
    endianness: "little-endian",
    detectEndianness: false,
  });

export { encode, decode };
