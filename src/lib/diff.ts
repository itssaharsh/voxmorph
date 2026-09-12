/**
 * Word-level diff of the verbatim transcript against the API's default cleanup.
 *
 * This is the demo's centrepiece and it is honest: `text` is what the speaker
 * actually said and `llm_response` (with no llm_instruction) is AssemblyAI's own
 * cleanup of it, so the struck-through words are exactly what their model removed.
 * No regex filler list of ours is involved.
 *
 * We only mark DELETIONS. Cleanup also inserts punctuation and fixes
 * capitalization; surfacing those as "changes" would bury the signal in noise.
 */

export type DiffToken = { text: string; removed: boolean };

/** Compare on lowercased, punctuation-stripped forms so "Friday?" matches "friday". */
const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

export function diffVerbatim(verbatim: string, clean: string | null): DiffToken[] {
  const vTokens = verbatim.split(/\s+/).filter(Boolean);
  if (!clean) return vTokens.map((text) => ({ text, removed: false }));

  const a = vTokens.map(norm);
  const b = clean.split(/\s+/).filter(Boolean).map(norm);

  // LCS table. Utterances are ≤120s of speech, so a few hundred tokens — O(n·m)
  // is nothing, and an approximate diff would mis-mark words on camera.
  const n = a.length, m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] && a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffToken[] = [];
  let i = 0, j = 0;
  while (i < n) {
    if (j < m && a[i] && a[i] === b[j]) {
      out.push({ text: vTokens[i], removed: false });
      i++; j++;
    } else if (j < m && dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ text: vTokens[i], removed: true }); // dropped by cleanup
      i++;
    } else if (j < m) {
      j++; // cleanup inserted something; ignore insertions
    } else {
      out.push({ text: vTokens[i], removed: true });
      i++;
    }
  }
  return out;
}

export const removedCount = (t: DiffToken[]) => t.filter((x) => x.removed).length;
