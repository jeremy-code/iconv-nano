/// <reference types="node" />

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { format, type FormatConfig } from "oxfmt";

import oxfmtConfig from "../.oxfmtrc.json" with { type: "json" };
import { encodeVlqRunsPayload } from "./utils/vlqRuns.js";

type Indexes = Record<string, (number | null)[]>;
export type EncodingIndex = Record<string, number>;

const parseEncodingIndexArray = (
  encodingIndexArray: Indexes[keyof Indexes],
): EncodingIndex =>
  encodingIndexArray.reduce<EncodingIndex>((acc, codePoint, index) => {
    const char = codePoint !== null ? String.fromCodePoint(codePoint) : null;
    if (char !== null && !(char in acc)) {
      acc[char] = index;
    }
    return acc;
  }, {});

const serializeEncodingData = (
  encoding: string,
  data: EncodingIndex | number[],
): { fileName: string; source: string } => {
  const isParsed = !Array.isArray(data);
  if (isParsed) {
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

const ENCODINGS_DIR = fileURLToPath(new URL("../encodings", import.meta.url));
const INDEXES_URL =
  "https://raw.githubusercontent.com/whatwg/encoding/refs/heads/main/indexes.json";

const main = async () => {
  const parsedArgs = parseArgs({
    options: {
      force: {
        type: "boolean",
        short: "f",
        default: false,
      },
    },
  });

  console.log("Fetching indexes.json from whatwg/encoding...");
  const responses = await fetch(INDEXES_URL).then(
    (response) => [response, response.clone()] as const,
  );
  const [indexes, sha256Hash]: [Indexes, string] = await Promise.all([
    responses[0].json(),
    responses[1]
      .arrayBuffer()
      .then((arrayBuffer) => crypto.subtle.digest("SHA-256", arrayBuffer))
      .then((arrayBuffer) => new Uint8Array(arrayBuffer).toHex()),
  ]);
  console.log("Fetched!");

  if (!parsedArgs.values.force) {
    console.log("Checking indexes.sha256...");
    const prevSha256Hash = await readFile(
      join(ENCODINGS_DIR, `indexes.sha256`),
      { encoding: "utf-8" },
    )
      .then((hash) => hash.split(/\s+/)[0])
      .catch(() => undefined);

    if (prevSha256Hash === sha256Hash) {
      console.log(
        `indexes.json has not been modified since it was last processed. SHA-256 hash: ${sha256Hash}`,
      );
      return;
    }
  }

  await writeFile(
    join(ENCODINGS_DIR, `indexes.sha256`),
    `${sha256Hash}  indexes.json`,
  );
  console.log(`indexes.sha256 has changed. Updating encodings...`);

  // https://encoding.spec.whatwg.org/#indexes
  const encodings = Object.entries(indexes).flatMap<{
    encoding: string;
    data: EncodingIndex | number[];
  }>(([encoding, encodingIndexArray]) => {
    if (encoding === "big5") {
      const encodingIndex = parseEncodingIndexArray(
        encodingIndexArray.fill(null, 0, (0xa1 - 0x81) * 157),
      );
      // Object.fromEntries uses "last key wins" rules
      const inverseEncodingIndex: EncodingIndex = Object.fromEntries(
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
      // Single-byte encoding
      encodingIndexArray.length === 128 ||
      encoding === "iso-2022-jp-katakana" ||
      encoding === "gb18030-ranges"
    ) {
      return [
        {
          encoding,
          // .flat is only necessary for gb18030-ranges, no-op for all other encodings
          data: encodingIndexArray
            .flat()
            // no null values, only number, for isomorphism
            .map((v) => (typeof v === "number" ? v : -1)),
        },
      ];
    }

    // Shift_JIS has no index: its encoder reuses the jis0208 index (src/codecs/shift_jis.ts)
    return [{ encoding, data: parseEncodingIndexArray(encodingIndexArray) }];
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
      );
    }),
  );
  console.log(`Encodings updated!`);
};

void main();
