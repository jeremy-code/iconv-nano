import { PAYLOAD } from "../../encodings/jis0208.js";
import { decodeVlqRunsLookup, type VlqRunsLookup } from "../utils/vlqRuns.js";

// Code point -> pointer lookup over columnar runs of the JIS0208 reverse index,
// decoded once on module load (see `encodeVlqRunsPayload` in `scripts/generate-encodings.ts`)
//
// Shared by EUC-JP, ISO-2022-JP, and Shift_JIS
const lookupJis0208CodePoint: VlqRunsLookup = decodeVlqRunsLookup(PAYLOAD);

export { lookupJis0208CodePoint };
