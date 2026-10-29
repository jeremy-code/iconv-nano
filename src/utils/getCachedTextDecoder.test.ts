import { describe, expect, it } from "vitest";

import { getCachedTextDecoder } from "./getCachedTextDecoder.js";

describe("getCachedTextDecoder", () => {
  it("returns a TextDecoder", () => {
    expect(getCachedTextDecoder("utf-8")).toBeInstanceOf(TextDecoder);
  });

  it("defaults to UTF-8 when no label is given", () => {
    expect(getCachedTextDecoder()).toHaveProperty("encoding", "utf-8");
  });

  it("return TextEncoder with correct default properties when no arguments are given", () => {
    const defaultTextDecoder = new TextDecoder();
    expect(getCachedTextDecoder()).toHaveProperty(
      "encoding",
      defaultTextDecoder.encoding,
    );
    expect(getCachedTextDecoder()).toHaveProperty(
      "fatal",
      defaultTextDecoder.fatal,
    );
    expect(getCachedTextDecoder()).toHaveProperty(
      "ignoreBOM",
      defaultTextDecoder.ignoreBOM,
    );
  });

  it("normalizes labels to the canonical encoding name", () => {
    expect(getCachedTextDecoder("latin1")).toHaveProperty(
      "encoding",
      "windows-1252",
    );
  });

  it("returns the same instance for the same label", () => {
    expect(getCachedTextDecoder("windows-1251")).toBe(
      getCachedTextDecoder("windows-1251"),
    );
  });

  it("returns the same instance for the same label and options", () => {
    const options = { fatal: false, ignoreBOM: true };
    expect(getCachedTextDecoder("utf-16le", options)).toBe(
      getCachedTextDecoder("utf-16le", { ...options }),
    );
  });

  it("returns the same instance regardless of option key order", () => {
    expect(
      getCachedTextDecoder("utf-8", { fatal: true, ignoreBOM: false }),
    ).toBe(getCachedTextDecoder("utf-8", { ignoreBOM: false, fatal: true }));
  });

  it("returns different instances for different labels", () => {
    expect(getCachedTextDecoder("utf-16le")).not.toBe(
      getCachedTextDecoder("utf-16be"),
    );
  });

  it("returns different instances for different options", () => {
    expect(getCachedTextDecoder("utf-8", { fatal: true })).not.toBe(
      getCachedTextDecoder("utf-8", { fatal: false }),
    );
    expect(getCachedTextDecoder("utf-8", { ignoreBOM: true })).not.toBe(
      getCachedTextDecoder("utf-8", { ignoreBOM: false }),
    );
  });

  it("returns the same instance with and without options", () => {
    expect(getCachedTextDecoder("utf-8")).toBe(
      getCachedTextDecoder("utf-8", { fatal: false, ignoreBOM: false }),
    );
  });

  it("honors the 'fatal' option", () => {
    const invalidInput = Uint8Array.of(0xff, 0xfe, 0xfd);
    expect(() =>
      getCachedTextDecoder("utf-8", { fatal: true }).decode(invalidInput),
    ).toThrow(TypeError);
    expect(
      getCachedTextDecoder("utf-8", { fatal: false }).decode(invalidInput),
    ).toBe("\ufffd\ufffd\ufffd");
  });

  it("throws a RangeError for unknown labels", () => {
    expect(() => getCachedTextDecoder("utf-64")).toThrow(RangeError);
  });

  it("does not cache failures", () => {
    expect(() => getCachedTextDecoder("utf-64")).toThrow(RangeError);
    expect(() => getCachedTextDecoder("utf-64")).toThrow(RangeError);
  });
});
