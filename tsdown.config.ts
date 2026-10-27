import { minify } from "rolldown/utils";
import { defineConfig, type UserConfig } from "tsdown";

const tsdownConfig: UserConfig = defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
  platform: "neutral",
  target: "es2023",
  treeshake: true,
  plugins: [
    {
      name: "minify-json-plugin",
      renderChunk: {
        filter: {
          code: [/^\/\/ encodings\/[^/]+\.json\r?\n/],
        },
        handler(code, chunk) {
          if (chunk.name.endsWith("json")) {
            return minify(chunk.fileName, code);
          }
          return null;
        },
      },
    },
  ],
  // Otherwise, rolldown attempts to format the output, overwriting minify-json-plugin
  minify: false,
  unbundle: true,
  publint: true,
  attw: {
    profile: "esm-only",
  },
  // Does not support "types" package.json export condition
  // https://github.com/rolldown/tsdown/issues/875
  exports: false,
});

export default tsdownConfig;
