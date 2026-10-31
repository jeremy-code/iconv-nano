type DecodeOptions = {
  /**
   * Skip the byte order mark when decoding the input
   * @default true
   */
  stripBOM?: boolean;
};

/**
 * For UTF-8 and single-byte encodings, there are no encode options because both
 * options are both meaningless when encoding. It is kept in
 * {@link DecodeOptions} because it has meaning when decoding
 *
 * @see {@link https://www.w3.org/International/questions/qa-byte-order-mark}
 */
type EncodeOptions = {
  /**
   * Add the byte order mark when encoding the input
   * @default false
   */
  addBOM?: boolean;
};

/**
 * Equivalent to DOM type {@link AllowSharedBufferSource}
 */
type BufferSource = ArrayBufferLike | ArrayBufferView;

type Endianness = "big-endian" | "little-endian";

type Encoder<TOptions extends EncodeOptions = EncodeOptions> = (
  input: string,
  options?: TOptions,
) => Uint8Array<ArrayBuffer>;
type Decoder<TOptions extends DecodeOptions = DecodeOptions> = (
  input: BufferSource,
  decodeOptions?: TOptions,
) => string;

export type {
  EncodeOptions,
  DecodeOptions,
  BufferSource,
  Endianness,
  Encoder,
  Decoder,
};
