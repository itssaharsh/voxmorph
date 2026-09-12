# Voxmorph demo video script

**Target 2:45.** Not 3:00 - never submit a rushed close at exactly the cap.
1080p, captioned. Record all screen capture first, voice-over second, then align.
Live narration while demoing causes stumbles that force full retakes.

Live URL: https://voxmorph-navy.vercel.app

---

## Before you hit record

- [ ] Do Not Disturb on. Close every personal tab. Clean browser profile.
- [ ] Use `/?fresh=1` for the cold open so the page starts empty, then the saved
      example is never on screen during the live take.
- [ ] Test the microphone once. Use the laptop mic, not a headset: assume the
      judge's environment is worse than yours.
- [ ] Have a scratch window open for the paste shot.
- [ ] Record the screen at 1440x900. The console was composed at that width.

---

## THE UTTERANCE

Say this, out loud, with the hesitations left in. Do not clean it up. The fillers
are the point: they are what the API strikes out on screen.

> "Um, so the the migration finished last night. Uh, we had about, I think,
> twenty minutes of downtime, which is, you know, less than we planned for.
> We should probably tell the customers on Thursday. Actually, Friday works better."

About 15 seconds. Two things in it are doing work: **"the the"** is a stutter, and
**"Thursday. Actually, Friday"** is a self-correction. The Dictation API's own
cleanup removes both, and that is what the strike-through shows.

Record this take 5 times and keep the best. **Then use that same audio to reseed
the demo example** (`node scripts/make-seed.mjs <your.wav>`), which also fixes the
channels that currently narrate instead of rewriting.

---

## Shot list

| Time | Shot | What is on screen | Voice-over |
|---|---|---|---|
| 0:00-0:10 | **Cold open** | Empty console. Finger goes down on the key, MIC LIVE lights, the ring moves with your voice. You speak the utterance. Release. | *(none - let the room hear the fillers)* |
| 0:10-0:22 | **The payoff** | Floor feed fills with the verbatim words. Channels patch into the rack one at a time. Hold 2 seconds of silence before speaking. | "One sentence, spoken once. Six channels out." |
| 0:22-0:45 | **The proof** | Cut to the floor feed. Point at the struck words: `um`, `the the`, `Thursday`. Toggle Verbatim / Cleaned. | "This is the part I did not build. Channel zero is `text`, the verbatim transcript. Channel one is `llm_response` with no instruction, which is AssemblyAI's own cleanup. The strike-through is the difference between them. That is their model removing my filler, not a word list of mine." |
| 0:45-1:05 | **Two channels, read them** | Hard cut to YOUR BOSS. Hold 4 seconds so it is readable. Hard cut to FAMILY. Hold 4 seconds. | "Same fifteen seconds of audio. Different `llm_instruction`. That is the whole product." |
| 1:05-1:15 | **Confidence** | Point at the amber dotted underline on a low-confidence word. | "Per-word confidence, straight from the API. Anything under 0.7 gets flagged." |
| 1:15-1:30 | **Copy and paste** | Click COPY on the boss channel. Toast appears. Paste into the scratch window. | "Ready to send. No editing." |
| 1:30-1:45 | **Wildcard** | Click Pirate. A seventh channel patches in from the audio still in memory. | "Same audio. One more instruction. No re-recording." |
| 1:45-2:00 | **Failure, induced** | Load `/?demo=fail` and speak again. The TECHNICAL channel shows `relayed from floor · truncated`. | "Rewrites are best effort. When one fails, the channel relays the API's cleaned transcript instead and names the error. Nothing is hidden. I induced this one, and the error is real: the flag swaps that channel to an instruction that overruns the rewrite's output cap." |
| 2:00-2:15 | **Architecture** | The mermaid diagram from the README. | "One upload from the browser. Six parallel calls, each with a different `llm_instruction`. No other model anywhere in the stack." |
| 2:15-2:30 | **What I sent back** | Scroll `docs/API-FEEDBACK.md`, stop on finding 1. | "I also found an undocumented `llm_error` value that silently discarded three of my six rewrites, deterministically, until I added a length bound. That is written up and going back to AssemblyAI." |
| 2:30-2:45 | **Close** | The console, at rest. URL on screen. | "Voxmorph. Speak once, send everywhere. Built on the AssemblyAI Dictation API." |

---

## Filming discipline

**Safe to film live** - the strike-through, the Verbatim/Cleaned toggle, copy and
paste, the wildcard. All deterministic once the page has loaded.

**Pre-record and splice** - anything involving a real microphone capture and a
round trip. Network variance and one bad transcription will eat your slot.

**The failure shot is a real error, not a mock.** `?demo=fail` swaps one channel to
an instruction that asks for a thousand-word report, which overruns the rewrite's
output cap, so the API genuinely returns `llm_error: "truncated"` and the card
genuinely relays the cleaned transcript. Measured 4 of 4 across two clips, so it
will hold for your own recording. Say on camera that you induced it.

**Cut, do not fix** - the wildcard and failure shots. If two takes fail, drop the
shot and redistribute the time. You are past feature freeze.

**The first 30 seconds decide it.** Judges are watching ~50 entries. The cold open
and the strike-through are your differentiator, so they go first and nothing gets
in front of them. No title card, no logo animation, no "hi, my name is".

---

## If you run short on time

Cut to **90 seconds**: cold open, the payoff, the proof, two channels, close. A
tight 90 beats a padded 2:45, and the proof shot is the only one that is genuinely
irreplaceable.
