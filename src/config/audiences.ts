import raw from "./audiences.json";

export type AudienceId = "baseline" | "boss" | "team" | "public" | "tech" | "family";
export type Tint = "amber" | "blue" | "green" | "purple" | "cyan" | "rose";

export type Audience = {
  id: AudienceId;
  label: string;
  icon: string;
  tint: Tint;
  /** null on `baseline`: the field is OMITTED from the request, which keeps the
   *  API's default cleanup task. Never send an empty string — that would replace
   *  the cleanup with nothing. */
  llm_instruction: string | null;
};

export const AUDIENCES = raw as Audience[];
export const AUDIENCE_IDS = AUDIENCES.map((a) => a.id);
export const BASELINE_ID: AudienceId = "baseline";

export function getAudience(id: string): Audience | undefined {
  return AUDIENCES.find((a) => a.id === id);
}

/** Preset wildcards — same audio, one more instruction. */
export const WILDCARDS: { id: string; label: string; llm_instruction: string }[] = [
  { id: "pirate", label: "Pirate", llm_instruction: "Rewrite in the voice of a pirate." },
  { id: "kid", label: "Five-year-old", llm_instruction: "Rewrite in two or three short sentences a five-year-old would understand." },
  { id: "haiku", label: "Haiku", llm_instruction: "Rewrite as a haiku." },
];
