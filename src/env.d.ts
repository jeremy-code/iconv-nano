declare module "*.txt" {
  import type { VlqRunsPayload } from "./utils/vlqRuns.js";
  const content: VlqRunsPayload;
  export default content;
}
