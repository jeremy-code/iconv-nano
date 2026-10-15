/// <reference types="node" />

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, type ParseArgsOptionsConfig } from "node:util";

import { format, type FormatConfig } from "oxfmt";

import oxfmtConfig from "../.oxfmtrc.json" with { type: "json" };

type Indexes = Record<string, (number | null)[]>;

const ENCODINGS_DIR = fileURLToPath(new URL("../encodings", import.meta.url));

const parseEncodingIndexArray = (encodingIndexArray: Indexes[keyof Indexes]) =>
  encodingIndexArray.reduce<Record<string, number>>((acc, codePoint, index) => {
    const char = codePoint !== null ? String.fromCodePoint(codePoint) : null;
    if (char !== null && !(char in acc)) {
      acc[char] = index;
    }
    return acc;
  }, {});

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const encodeVlq = (n: number): string => {
  let v = n < 0 ? (-n << 1) | 1 : n << 1;
  let s = "";
  do {
    let digit = v & 31;
    v >>>= 5;
    if (v > 0) {
      digit |= 32;
    }
    s += B64[digit]!;
  } while (v > 0);
  return s;
};

// Encodes a char -> pointer reverse index as pointer-ordered runs [cpStart, pointerStart, count],
//
// VLQ compressed into
// "<first code point>.<first pointer>.<cp gaps>.<counts>.<pointer gaps>"
//
// where each gap is the distance from the end of one run to the start of the next
// (mostly 0 or small in regular index regions, so most tokens are a single character)
const encodeVlqRunsPayload = (
  encodingIndex: Record<string, number>,
): string => {
  const cpStarts: number[] = [];
  const ptrStarts: number[] = [];
  const counts: number[] = [];
  let prevCp = -2;
  let prevPtr = -2;
  // Object.entries iterates in pointer order, the insertion order of parseEncodingIndexArray
  for (const [char, pointer] of Object.entries(encodingIndex)) {
    const cp = char.codePointAt(0)!;
    if (pointer === prevPtr + 1 && cp === prevCp + 1) {
      counts[counts.length - 1]!++;
    } else {
      cpStarts.push(cp);
      ptrStarts.push(pointer);
      counts.push(1);
    }
    prevCp = cp;
    prevPtr = pointer;
  }
  const runCount = counts.length;
  const cpGaps: number[] = [];
  const ptrGaps: number[] = [];
  for (let i = 0; i < runCount; i++) {
    const next = i + 1;
    cpGaps.push(
      next < runCount ? cpStarts[next]! - (cpStarts[i]! + counts[i]!) : 0,
    );
    ptrGaps.push(
      next < runCount ? ptrStarts[next]! - (ptrStarts[i]! + counts[i]!) : 0,
    );
  }
  return [
    encodeVlq(cpStarts[0]!),
    encodeVlq(ptrStarts[0]!),
    cpGaps.map(encodeVlq).join(""),
    counts.map(encodeVlq).join(""),
    ptrGaps.map(encodeVlq).join(""),
  ].join(".");
};

const serializeEncodingData = (
  encoding: string,
  data: Record<string, number> | unknown[],
): { fileName: string; source: string } => {
  const parsed = !Array.isArray(data);
  if (parsed) {
    return {
      fileName: `${encoding}.ts`,
      source:
        `/* oxlint-disable */\n\n` +
        `import type { VlqRunsPayload } from "../src/utils/vlqRuns.js";\n\n` +
        `export const PAYLOAD =\n` +
        `  ${JSON.stringify(encodeVlqRunsPayload(data))} as VlqRunsPayload;\n`,
    };
  }
  return { fileName: `${encoding}.json`, source: JSON.stringify(data) };
};

const generateEncodingsOptions = {
  force: {
    type: "boolean",
    short: "f",
    default: false,
  },
} satisfies ParseArgsOptionsConfig;

const main = async () => {
  const parsedArgs = parseArgs({ options: generateEncodingsOptions });

  console.log("Fetching indexes.json from whatwg/encoding...");
  const responses = await fetch(
    `https://raw.githubusercontent.com/whatwg/encoding/refs/heads/main/indexes.json`,
  ).then((response) => [response, response.clone()] as const);
  const [indexes, sha256Hash]: [Indexes, string] = await Promise.all([
    responses[0].json(),
    responses[1]
      .bytes()
      .then((bytes) => crypto.subtle.digest("SHA-256", bytes))
      .then((arrayBuffer) => new Uint8Array(arrayBuffer).toHex()),
  ]);
  console.log("Fetched!");

  if (!parsedArgs.values.force) {
    console.log("Checking indexes.sha256...");
    const currSha256Hash = await readFile(
      join(ENCODINGS_DIR, `indexes.sha256`),
      {
        encoding: "utf-8",
      },
    )
      .then((hash) => hash.split(/\s+/)[0])
      .catch(() => undefined);

    if (currSha256Hash === sha256Hash) {
      console.log(
        `indexes.json has not been modified since it was last processed. SHA-256 hash: ${sha256Hash}`,
      );
      return;
    }
  }

  await writeFile(
    join(ENCODINGS_DIR, `indexes.sha256`),
    `${sha256Hash}  indexes.json`,
    { encoding: "utf-8" },
  );
  console.log(`indexes.sha256 has changed. Updating encodings...`);

  // https://encoding.spec.whatwg.org/#indexes
  const encodings = Object.entries(indexes).flatMap<{
    encoding: string;
    data: Record<string, number> | (number | null)[];
  }>(([encoding, encodingIndexArray]) => {
    if (encoding === "gb18030-ranges") {
      return [{ encoding, data: encodingIndexArray.flat() }];
    } else if (encoding === "big5") {
      const encodingIndex = parseEncodingIndexArray(
        encodingIndexArray.fill(null, 0, (0xa1 - 0x81) * 157),
      );
      // Object.fromEntries uses "last key wins" rules
      const inverseEncodingIndex = Object.fromEntries(
        encodingIndexArray.flatMap((codePoint, i) =>
          codePoint !== null ? [[String.fromCodePoint(codePoint), i]] : [],
        ),
      );

      [0x2550, 0x255e, 0x2561, 0x256a, 0x5341, 0x5345].forEach((codePoint) => {
        const char = String.fromCodePoint(codePoint);
        encodingIndex[char] = inverseEncodingIndex[char]!;
      });

      return [{ encoding, data: encodingIndex }];
    } else if (
      encodingIndexArray.length === 128 ||
      encoding === "iso-2022-jp-katakana"
    ) {
      return [
        {
          encoding,
          data: Array.from(encodingIndexArray, (v) =>
            typeof v === "number" ? v : -1,
          ),
        },
      ];
    }

    const encodingIndex = parseEncodingIndexArray(encodingIndexArray);

    if (encoding === "jis0208") {
      return [
        { encoding, data: encodingIndex },
        {
          encoding: "shift_jis",
          data: parseEncodingIndexArray(
            encodingIndexArray.fill(null, 8272, 8835),
          ),
        },
      ];
    }
    return [{ encoding, data: encodingIndex }];
  });

  await Promise.all(
    encodings.map(async ({ encoding, data }) => {
      const { fileName, source } = serializeEncodingData(encoding, data);
      await writeFile(
        join(ENCODINGS_DIR, fileName),
        (
          await format(
            fileName,
            source,
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- oxfmtConfig is a FormatConfig
            oxfmtConfig as FormatConfig,
          )
        ).code,
        { encoding: "utf-8" },
      );
    }),
  );
  console.log(`Encodings updated!`);
};

void main();
