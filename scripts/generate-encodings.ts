/// <reference types="node" />

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, type ParseArgsOptionsConfig } from "node:util";

import { format } from "oxfmt";

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

// Reverse indexes stored as VLQ-encoded run-length payloads (decoded at runtime by `src/utils/vlqRuns.ts`)
const VLQ_RUNS_ENCODINGS = new Set(["euc-kr"]);

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

const encodeDeltas = (values: number[]): string => {
  let prev = 0;
  let s = "";
  for (const v of values) {
    s += encodeVlq(v - prev);
    prev = v;
  }
  return s;
};

// Encodes a char -> pointer reverse index as code point-sorted runs [cpStart, pointerStart, count],
// column delta + VLQ compressed into "<code point start deltas>.<pointer start deltas>.<counts>"
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
  const order = cpStarts
    .map((_, i) => i)
    .toSorted(
      (a, b) => cpStarts[a]! - cpStarts[b]! || ptrStarts[a]! - ptrStarts[b]!,
    );
  const column = <T>(values: T[]): T[] => order.map((i) => values[i]!);
  return `${encodeDeltas(column(cpStarts))}.${encodeDeltas(column(ptrStarts))}.${column(counts).map(encodeVlq).join("")}`;
};

const serializeEncodingData = (
  encoding: string,
  data: Record<string, number> | [number, number][],
): { fileName: string; source: string } => {
  if (VLQ_RUNS_ENCODINGS.has(encoding) && !Array.isArray(data)) {
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
    data: Record<string, number> | [number, number][];
  }>(([encoding, encodingIndexArray]) => {
    if (encoding === "gb18030-ranges") {
      return [
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- gb18030-ranges has a different type to represent ranges
        { encoding, data: encodingIndexArray as unknown as [number, number][] },
      ];
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
        (await format(fileName, source)).code,
        { encoding: "utf-8" },
      );
    }),
  );
  console.log(`Encodings updated!`);
};

void main();
