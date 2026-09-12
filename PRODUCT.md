# Voxmorph

## What it is

A voice-first tool. You hold a button and say one thing. It comes back written five
ways — for your boss, your team, your users, your engineers, and your family — and
you copy the one you need.

## Mechanism (what is genuinely different)

Every rewrite is a separate `llm_instruction` on the **AssemblyAI Dictation API**.
There is no other model in the stack. Two consequences shape the whole product:

1. **The API returns two texts from one call.** `text` is the verbatim transcript —
   every "um", every stutter, never altered. `llm_response` is the rewritten version;
   with no instruction supplied it is the API's own default cleanup. Voxmorph sends a
   sixth, instruction-less "baseline" call purely to obtain that cleanup, then diffs
   the two. **The struck-through filler words in the transcript are exactly what
   AssemblyAI's model removed** — there is no filler-word list in the codebase. This
   is the product's proof, not an ornament.
2. **One instruction per request**, so six audiences means six parallel calls with
   the same audio. All six responses carry the same verbatim `text`, so the
   transcript survives any five of them failing.

## Primary user and scene

Two audiences at once, and the design must serve both:

- **Hackathon judges**, scanning a live URL and a 3-minute video against ~50 other
  entries. They decide in seconds and they know the API. First impression and
  memorability matter.
- **A person who just left a meeting** and owes four different people an update.
  Desk or phone, repeated use. The task must stay uncompromised by expression.

## Durable constraints (must survive any redesign)

- **Voice is the only content input.** No text field for composing anywhere. The one
  textarea in the product edits the AI's output — the human gate — and that exception
  is part of the pitch.
- **Hold-to-talk, not tap-to-toggle.** Press-and-hold with a ring driven by real mic
  RMS. This gesture is the signature interaction.
- **The verbatim/cleaned diff stays prominent and legible.** It is the single most
  API-specific thing on screen.
- **Honest state reporting.** Degraded and failed cards show their real `llm_error`,
  per-word confidence is visible, timings are real, and the first-load example is
  labelled as a saved response. Transparency is a judging asset, not clutter.
- **Everything on screen is real API output.** No canned rewrites, no fake latency,
  no invented metrics.
- Six audiences: a baseline plus boss / team / public / technical / family, with
  optional wildcard instructions fired against audio already held in memory.
- 19 languages via `language_codes`; speak one, read another.
- Accessibility: keyboard path for recording (hold Space), visible focus, live
  regions for streamed results, `prefers-reduced-motion` honoured.

## Platform

`web`. Mobile web included — mic capture needs a secure context, so localhost or
HTTPS only.

## Stack

Next.js 16 (App Router, Node runtime), React 19, TypeScript, Tailwind v4,
lucide-react. Deployed on Vercel. No state library, no UI kit, no second LLM.
Streaming is SSE with an identical JSON fallback on the same route.

## Brand commitments

None inherited. The existing amber-on-slate palette was a first draft by the same
author, not a brand, and carries no authority. The product name is lowercase
"voxmorph" in running text.

## Evidence and assets

- Live: https://voxmorph-navy.vercel.app · Repo: https://github.com/itssaharsh/voxmorph
- Real captured API responses in `fixtures/` and `src/state/demoSeed.ts`.
- Findings sent back to the vendor in `docs/API-FEEDBACK.md` and
  `docs/SECURITY-NOTES.md`.
