/// <reference lib="dom" />
// TextEncoder/TextDecoder is in lib.dom.d.ts for some reason, despite being
// present in Node since v11
// https://github.com/microsoft/TypeScript/issues/31535

let textDecoderCache = new Map<string, TextDecoder>();

/**
 * @see {@link https://encoding.spec.whatwg.org/#names-and-labels}
 */
const getCachedTextDecoder = (
  label?: string,
  options?: TextDecoderOptions,
): TextDecoder => {
  const cacheKey =
    (label ?? "") +
    (options
      ? Object.entries(options)
          // Ascending order
          .toSorted((a, b) => (a[0] < b[0] ? -1 : 1))
          .join()
      : "");
  if (textDecoderCache.has(cacheKey)) {
    return textDecoderCache.get(cacheKey)!;
  }

  const textDecoder = new TextDecoder(label, options);
  textDecoderCache.set(cacheKey, textDecoder);
  return textDecoder;
};

export { getCachedTextDecoder };
