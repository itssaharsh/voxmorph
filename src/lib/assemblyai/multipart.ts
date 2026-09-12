import { randomBytes } from "node:crypto";

export type DictationConfig = {
  language_codes?: string[];
  stt_prompt?: string;
  keyterms_prompt?: string[];
  llm_instruction?: string | null;
  // sample_rate / channels are deliberately absent: for WAV they are read from the
  // RIFF header and the config fields are ignored. Only raw PCM needs them.
};

/** Drop null/undefined/empty so we never send `llm_instruction: ""`, which would
 *  replace the API's default cleanup with nothing. */
function compact(config: DictationConfig): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config).filter(([, v]) =>
      v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
    )
  );
}

export const newBoundary = () => `----voxmorph${randomBytes(12).toString("hex")}`;

/**
 * Hand-rolled multipart body, deliberately NOT FormData.
 *
 *  1. A Buffer is REPLAYABLE — the same body is reused across all six concurrent
 *     calls and every retry. A FormData body is single-use, so one instance sent to
 *     six parallel fetches leaves five with an empty body. That is the classic bug
 *     in exactly this fan-out shape.
 *  2. `config` must precede `audio` (the server transcribes as the body arrives and
 *     rejects audio-first with a silent 400). Here the ordering is explicit.
 *  3. Each part's Content-Type is stated outright — the server 415s on format.
 */
export function buildMultipartBody(
  config: DictationConfig,
  audio: Buffer,
  boundary: string
): Buffer {
  const head = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="config"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(compact(config))}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="audio"; filename="audio.wav"\r\n` +
      `Content-Type: audio/wav\r\n\r\n`,
    "utf8"
  );
  return Buffer.concat([head, audio, Buffer.from(`\r\n--${boundary}--\r\n`, "utf8")]);
}
