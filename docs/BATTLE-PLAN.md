# Voxmorph — Battle Plan

**Hackathon:** AssemblyAI Voice Hackathon Week · Sept 9–13, 2026 · Online
**Prizes:** $500 total · Top 10 → $50 each + AAI credits · $50 bounties for feedback / projects / security
**Submission:** https://forms.gle/THwUT2tQ5XvABQqT7
**Event:** https://luma.com/qwckwa01
**API docs:** https://www.assemblyai.com/docs/dictation

---

## 1. ONE-SENTENCE PITCH

> "Explain it once, in your own words — Voxmorph writes it for your boss, your team, your users, and your family."

R2 ✓ — the job is clear (communicate the same thing to multiple audiences), the outcome is clear (speak once, get five ready-to-send messages).

---

## 2. ARCHETYPE

**#2 Voice-First / Hands-Locked** with elements of **#9 Playful Frame on Serious Data.**

The entire interface is voice — no `<input>`, no `<textarea>`, no keyboard for content. You speak to the app, and the app speaks to everyone else. The playful element: your raw rambling transformed into five wildly different versions side by side IS the entertainment. Judges will try it, laugh at the "Family" card, and show the next judge.

---

## 3. WHAT MOVES ON SCREEN (R9)

- **Pulsing waveform** — Canvas-based real-time audio visualization while the mic is hot
- **Card cascade** — audience cards slide in one by one as each parallel API response lands (~200ms apart), fanning out like a hand of playing cards
- **Filler strike-through** — raw transcript animates: filler words get struck through, then fade out, leaving clean text. The before/after IS the API demo
- **Confidence heatmap** — low-confidence words pulse with a subtle amber underline
- **Live character counts** — each card shows a ticking count (email: 340 chars, tweet: 178/280)

The page opens pre-loaded (R30) — a demo utterance with all five cards already visible, so the judge sees the product working before they even speak.

---

## 4. SPONSOR INTEGRATION PROOF (R3, R4)

**Load-bearing API features (every one independently provable):**

| API Feature | How Voxmorph Makes It Load-Bearing |
|---|---|
| `llm_instruction` | THE ENTIRE PRODUCT. Five different instructions = five audience-specific rewrites. Without this parameter, Voxmorph doesn't exist. |
| Filler word removal | Visible in the raw transcript with animated strike-throughs. The "before/after" toggle IS the API demo. |
| 19 languages | Speak in Hindi → get professional English email, casual English Slack, formal Hindi doc. Cross-language audience adaptation. |
| `keyterms_prompt` | Seeded with domain vocabulary so technical terms survive rewriting accurately. |
| `conversation_context` | Multi-turn: second utterance adds context. All five cards update with richer, more detailed versions. |
| `confidence` scores | Low-confidence words get amber underlines. Each audience card handles ambiguity differently — boss version uses safer language, tech version flags `[verify]`. |
| `/warm` endpoint | Pre-warmed on mic press. Transcription starts the instant you stop speaking. |

**Write-back:** The feedback bounty submission IS writing back — detailed performance data on `llm_instruction` across 5+ prompt styles × multiple languages.

---

## 5. CLOSED LOOP (R5)

```
Speak (detect)
  → Dictation API transcribes + removes fillers (diagnose)
  → 5 parallel calls with different llm_instruction (propose)
  → User reviews cards, can tap to edit before sending (human gate)
  → User copies/shares chosen version (act)
  → "Copied!" toast with exact text (verify)
  → History panel logs utterance + all generated versions (audit)
```

Every step visible. Every step reversible.

---

## 6. UNHAPPY PATH DEMO (R6)

**Demo 1 — Rewrite misses a term (20 sec):**
- Speak: something with "Kubernetes" → boss card rewrites it to "container system"
- Tap edit on boss card → change to "Kubernetes" → all cards update
- **Point:** Human gate catches the AI's oversimplification.

**Demo 2 — Rewrite timeout (15 sec):**
- One of five cards shows skeleton loader → "Rewrite timed out, retrying..." → card slides in on retry
- **Point:** System degrades gracefully. Raw transcript is always available. The API's 5-second deadline is handled, not hidden.

**Demo 3 — Low confidence (10 sec):**
- Speak a mumbled word → word appears with amber underline → say "Replace [wrong] with [right]" → all five cards update simultaneously
- **Point:** One correction propagates to all audiences.

---

## 7. CROWD COUNT (R8)

**What every other entry will build:**
- "Speak and see text" transcription demos
- Voice note/journal apps
- Language translation tools
- Voice chatbots wrapping the API

**What zero other entries will build:**
Audience-aware multi-format voice output powered by `llm_instruction`. This parameter is buried in the docs. Most people won't even discover it. You're the only entry showcasing the API's actual differentiator — the built-in rewrite engine.

---

## 8. STACKED TRACKS (R12)

| Prize | Qualification | Expected |
|---|---|---|
| **Top 10 Overall ($50 + credits)** | Unique concept, polished demo, deep API usage | High |
| **Feedback Bounty ($50)** | Stress-testing `llm_instruction` × 5 styles × 19 languages = gold-tier feedback | Guaranteed |
| **Project Bounty ($50)** | Shipped, deployed, documented project | High |
| **Security Bounty ($50)** | Check: can spoken words inject into `llm_instruction`? Report findings | Possible |

**Realistic floor: $100 + credits. Ceiling: $200.**

---

## 9. BUILD TIMELINE

**Today is Sept 11. Hackathon ends Sept 13. Two days.**

| Phase | When | Hours | What |
|---|---|---|---|
| **Core API** | Sept 11 evening | 3h | Next.js scaffold, `/api/transcribe` proxy route, mic recording (MediaRecorder → WAV), basic transcription display |
| **Multi-audience engine** | Sept 11 night | 2h | 5 parallel API calls with different `llm_instruction`, card rendering, loading skeletons |
| **Card cascade + polish** | Sept 12 morning | 3h | Entrance animations, filler strike-through, confidence underlines, waveform viz, dark theme |
| **Features** | Sept 12 afternoon | 2h | Copy button, edit modal, history panel, raw/clean toggle, language switching demo |
| **Video + README** | Sept 12 evening | 3h | Record 3-min video (follow shot list), write README with GIFs, write API feedback doc |
| **Submit** | Sept 13 morning | 1h | Final mobile test, submit Google Form, verify live URL incognito |

**Feature freeze: Sept 12 2:00 PM.** After that, only bug fixes and demo polish.

---

## 10. UI APPROACH

**Design direction:** Dark "command center" — you're the commander, the five cards are your dispatch channels.

| Element | Choice | Why |
|---|---|---|
| **Background** | `#020617` (slate-950) | Dark canvas makes the colored audience cards pop |
| **Accent** | `#f59e0b` (amber-500) | Warm, distinct from the purple/indigo every other entry uses |
| **Cards** | Subtle glass-morph with audience-specific tint | Boss: blue-900/10, Team: green-900/10, Public: purple-900/10, Tech: cyan-900/10, Family: rose-900/10 |
| **Display font** | JetBrains Mono | Monospace = "precision tool"; the raw transcript area |
| **Body font** | Inter | Clean chrome for cards and UI |
| **Mic button** | 72px circle, amber, bottom-center, pulses when active | Thumb-reachable on mobile, unmissable on desktop |
| **Card cascade** | `translateX(100%) → translateX(0)` + `opacity 0→1`, staggered 150ms per card | Cards fan in from right as API responses arrive |
| **Filler animation** | `text-decoration: line-through` + `opacity 1→0.3` on filler words | Shows what the API stripped |

**Anti-patterns killed:**
- ❌ Purple/indigo gradients
- ❌ Glow on text or buttons
- ❌ Emoji as icons (use Lucide icons)
- ❌ Untouched shadcn / Aceternity / Magic UI
- ❌ Fake metrics or testimonials
- ❌ Scroll hijacking

**Finished-feel (R31):**
- Loading skeletons on cards while API processes
- Empty state: "Tap the mic. Say anything." with pulsing button
- Error toast: "Couldn't hear that — try again" with retry
- `prefers-reduced-motion` fallback (no cascade, instant appear)
- Mobile responsive (cards stack vertically on narrow screens)

---

## 11. SUBMISSION CHECKLIST

### Demo Video (3 min, 1080p, captioned)

| Time | Shot | What judge sees |
|---|---|---|
| 0:00–0:10 | **Hook** | "You just left a meeting. You need to tell your CEO, your team, your users, and your mom. That's 30 minutes of writing. Or 15 seconds of talking." (text on screen) |
| 0:10–0:25 | **The app** | Show Voxmorph — dark screen, pulsing mic button, pre-loaded demo. "This is Voxmorph." |
| 0:25–1:00 | **Core demo** | Press mic, speak a real work update (~15 sec). Release. Cards cascade in one by one. Pause on each for 3 seconds. |
| 1:00–1:20 | **Filler forensics** | Toggle "Raw vs Clean." Show struck-through fillers. "The Dictation API does this automatically." |
| 1:20–1:40 | **Multi-language** | Speak in Hindi. Cards appear in English (boss), mixed (team), Hindi (doc). Language badge animates. |
| 1:40–2:00 | **Unhappy path** | Low-confidence word highlighted → voice correction → all cards update. |
| 2:00–2:15 | **Edit + copy** | Tap boss card, edit one word, copy. "Ready to paste into your email." |
| 2:15–2:30 | **Custom audience** | Add custom: "Write as a pirate." Speak. Pirate card appears. Judges laugh. |
| 2:30–2:45 | **Conversation stacking** | Second utterance adds context. Cards get richer. "The API remembers what you said before." |
| 2:45–3:00 | **Close** | "Voxmorph. Speak once, send everywhere. Try it: [URL]" |

### README Structure

```markdown
# 🎙️ Voxmorph — Speak Once, Send Everywhere

> AssemblyAI Voice Hackathon Week · Sept 9–13, 2026

[Hero GIF: speak → 5 cards cascade in]

🔗 **Live Demo:** [Vercel URL]
🎬 **Video:** [YouTube unlisted link]

## The Problem
You have one update. Five audiences. Five different messages. 30 minutes of reformatting.

## The Solution
Speak once. Voxmorph rewrites for your boss, your team, your users, your engineers, and your family. Simultaneously.

## How It Works
[Architecture SVG — mic → API → 5 parallel llm_instructions → 5 cards]

## AssemblyAI API Integration
| Feature | Usage |
|---|---|
| `llm_instruction` | Core engine — 5 different instructions per utterance |
| Filler removal | Visible strike-through animation |
| 19 languages | Cross-language audience adaptation |
| `keyterms_prompt` | Domain vocabulary preservation |
| `conversation_context` | Multi-turn context stacking |
| `confidence` | Per-word accuracy highlighting |
| `/warm` | Pre-warmed connections |

## Voice Commands
| Command | Action |
|---|---|
| "Undo" | Revert last utterance |
| "Clear" | Reset all cards |
| "Replace [X] with [Y]" | Update all cards |
| "Switch to [language]" | Change input language |
| "Add audience: [description]" | Create custom audience card |

## What's Real vs Simulated
- ✅ Real: All transcription, all rewrites, all languages, confidence scores
- ✅ Real: Copy to clipboard, edit before sending
- ⚠️ Simulated: Pre-loaded demo data on first page load

## Run Locally
1. `git clone && cd voxmorph`
2. `cp .env.example .env.local` → add `ASSEMBLYAI_API_KEY`
3. `npm install && npm run dev`

## API Feedback
[Link to detailed feedback doc]
```

### API Feedback Doc (for the $50 bounty)

Test and document:
1. **`llm_instruction` latency** — P50/P95 across 5 prompt styles, 20+ utterances each
2. **Rewrite quality by style** — which prompts produce best results, which hallucinate
3. **Language × style matrix** — does "professional email" work as well in Hindi as English?
4. **Timeout rate** — what % of rewrites hit the 5-second deadline?
5. **Prompt injection surface** — can spoken words leak into `llm_instruction` behavior?
6. **Confidence calibration** — are low-confidence scores actually correlated with errors?
7. **`conversation_context` coherence** — does multi-turn actually improve output?
8. **Doc gaps** — unclear auth (404 vs 401), missing rate limit info, chunked streaming docs sparse

---

## 12. RULE VIOLATIONS TO WATCH

| Rule | Specific Risk | Mitigation |
|---|---|---|
| **R13** (demo before code) | Building features not in the shot list | The shot list above IS the spec. Build ONLY what's in it. |
| **R15** (deliverables T-24h) | Leaving video for Sept 13 | Video DONE by Sept 12 10 PM. Non-negotiable. |
| **R27** (kill vibe-code) | Claude Code defaulting to purple gradients | Paste the exact hex codes in every prompt. Review every generated component. |
| **R47** (cut what flakes) | Waveform viz or card animation breaking on mobile | Test on phone after each feature. Cut anything that stutters. |
| **R61** (polish > complexity) | Adding audience #6, #7, #8 instead of polishing 5 | Hard cap at 5 audiences + 1 custom. Feature freeze Sept 12 2 PM. |
| **R65** (one standout) | Spreading across edit, history, TTS, etc. | The standout is "5 audience cards from 1 utterance." Everything else supports this. |

---

## TECHNICAL ARCHITECTURE

```
                          ┌─────────────────────────────────────┐
                          │        AssemblyAI Dictation API      │
                          │  POST /v1/transcribe/live            │
                          │                                     │
                          │  Call 1: llm_instruction = "boss"   │──► { text, llm_response }
                          │  Call 2: llm_instruction = "team"   │──► { text, llm_response }
┌──────────┐  audio blob  │  Call 3: llm_instruction = "public" │──► { text, llm_response }
│ Browser  │─────────────►│  Call 4: llm_instruction = "tech"   │──► { text, llm_response }
│ Mic      │              │  Call 5: llm_instruction = "family" │──► { text, llm_response }
│ (WAV)    │              └─────────────────────────────────────┘
└──────────┘                              ▲
      │                                   │
      │            ┌──────────────────────┐
      └───────────►│ Next.js API Route    │
     /api/transcribe│ - Receives audio    │
                   │ - Fans out 5 calls   │
                   │ - Injects API key    │
                   │ - Returns all 5      │
                   └──────────────────────┘
```

**Key design decisions:**

1. **5 parallel calls, not 5 sequential** — `Promise.allSettled()` fires all five simultaneously. Total latency = slowest single call (~2s), not sum of all five.

2. **No external LLM** — the Dictation API's built-in `llm_instruction` does all rewriting. Zero additional API dependencies.

3. **Stream results to client** — as each of the 5 calls resolves, immediately SSE/stream the result to the browser. Cards appear one by one as they land. (Fallback: await all, return batch.)

4. **Voice commands are client-side** — simple keyword matching on the raw transcript. "Undo", "clear", "replace X with Y", "switch to Spanish". No LLM call needed.

5. **API key server-side only** — the Next.js API route injects the key. Browser never sees it.

6. **Pre-warm on mic press** — POST to `/api/warm` the instant the user touches the mic button. By the time they finish speaking, the connection is hot.

---

## API DETAILS (for the Claude Code prompt)

```
Endpoint: POST https://dictation.assemblyai.com/v1/transcribe/live
Auth: Header "Authorization: <API_KEY>" (no Bearer prefix)
Content-Type: multipart/form-data

Part 1 — "config" (application/json):
{
  "sample_rate": 16000,
  "channels": 1,
  "language_codes": ["en"],          // or ["hi"], ["es"], etc.
  "keyterms_prompt": "",             // up to 100 terms / 8000 chars
  "llm_instruction": "",             // up to 2048 chars — THIS IS THE CORE
  "conversation_context": ""         // prior utterances for multi-turn
}

Part 2 — "audio" (audio/wav):
Raw 16-bit PCM or WAV, max 120 seconds, max 40 MB

Response (200):
{
  "text": "raw clean transcript (fillers removed)",
  "llm_response": "rewritten text per llm_instruction (null on failure)",
  "words": [{"text": "word", "confidence": 0.95}, ...],
  "confidence": 0.92,
  "llm_error": null,                 // "timeout" or "error" if rewrite failed
  "audio_duration_ms": 8500,
  "request_time_ms": 1200
}

Pre-warm: POST /warm (call on mic press to hide connection setup latency)

Notes:
- Rewrite has 5-second internal deadline
- Rewrite failure still returns 200 with text intact
- Invalid API key returns 404, not 401
- 90-second HTTP timeout recommended
```

---

## THE FIVE AUDIENCE INSTRUCTIONS

```javascript
const AUDIENCES = [
  {
    id: "boss",
    label: "Your Boss",
    icon: "Briefcase",          // Lucide icon name
    tint: "blue",               // card tint color
    llm_instruction: "Rewrite this as a brief professional update for a senior executive. Lead with the conclusion. Be concise — 2-3 sentences max. Include next steps if any. Formal tone, no jargon."
  },
  {
    id: "team",
    label: "Your Team",
    icon: "Users",
    tint: "green",
    llm_instruction: "Rewrite this as a casual team update for colleagues. Be direct and actionable. Use technical terms where appropriate. Include action items as bullet points if relevant. Friendly but efficient tone."
  },
  {
    id: "public",
    label: "The Public",
    icon: "Globe",
    tint: "purple",
    llm_instruction: "Rewrite this as a public-facing message for customers or users. Be reassuring and transparent. Avoid all technical jargon. Focus on impact and what they need to know or do. Warm, professional tone."
  },
  {
    id: "tech",
    label: "Technical",
    icon: "Code",
    tint: "cyan",
    llm_instruction: "Rewrite this as a precise technical summary for engineers. Use exact terminology. Include system names, error codes, and specifics where implied. Structured format. Matter-of-fact tone."
  },
  {
    id: "family",
    label: "Family",
    icon: "Heart",
    tint: "rose",
    llm_instruction: "Rewrite this as a simple, warm explanation for a non-technical family member or friend. No buzzwords, no jargon. Keep it conversational and reassuring. One or two casual sentences."
  }
];
```

---

## DELIVERABLES — FEED TO CLAUDE CODE IN ORDER

### Phase 1: Scaffold + API (Sept 11, ~2h)

**Prompt 1:**
```
Create a Next.js 14 app with App Router, TypeScript, Tailwind CSS.

npx create-next-app@latest voxmorph --ts --tailwind --app --src-dir --no-eslint

Then create these files:

1. src/app/api/transcribe/route.ts
   - POST handler
   - Receives: { audio: base64 string, config: { language_codes, keyterms_prompt, llm_instruction, conversation_context } }
   - Converts base64 audio back to buffer
   - Makes multipart/form-data POST to https://dictation.assemblyai.com/v1/transcribe/live
   - Config part first (application/json), then audio part (audio/wav)
   - Auth header: Authorization: process.env.ASSEMBLYAI_API_KEY (no Bearer)
   - Returns the API response JSON

2. src/app/api/warm/route.ts
   - POST handler
   - Calls AssemblyAI /warm endpoint
   - Returns 200

3. .env.example with ASSEMBLYAI_API_KEY=your_key_here
4. .gitignore includes .env.local
```

**Prompt 2:**
```
Create src/app/api/morph/route.ts — the multi-audience endpoint.

It receives: { audio: base64 string, language_codes: string[], keyterms_prompt?: string, conversation_context?: string }

It fires 5 PARALLEL requests to our own /api/transcribe endpoint, each with a different llm_instruction from these audience configs:

[paste the AUDIENCES array from above]

Use Promise.allSettled() so one failure doesn't block the rest.

Return: {
  raw_text: string (from first successful response's text field),
  audiences: [
    { id, label, text: llm_response || text, error?: string, confidence, words, request_time_ms }
  ]
}

If a rewrite fails (llm_error is not null), fall back to the raw text for that card.
```

### Phase 2: Mic Recording (Sept 11, ~1h)

**Prompt 3:**
```
Create src/components/MicButton.tsx

A mic recording button that:
- Uses MediaRecorder API with mimeType audio/webm (we'll convert server-side) OR audio/wav if available
- On mouse down / touch start: call /api/warm, start recording, emit "recording" state
- Expose analyserNode via callback so parent can draw waveform
- On mouse up / touch end: stop recording, convert to base64 string, call onRecordingComplete(base64Audio)
- Show 3 visual states:
  - Idle: amber circle with mic icon, subtle shadow
  - Recording: pulsing scale animation, red ring, "Recording..." label
  - Processing: spinning loader, "Transforming..." label
- 72px diameter, positioned fixed bottom-center with 32px margin
- Use Lucide React for icons (Mic, Loader2)
- Accessibility: aria-label, keyboard support (hold Space to record)

Style: bg-amber-500 text-white rounded-full shadow-lg shadow-amber-500/20
Recording: ring-2 ring-red-500 animate-pulse scale-110
```

### Phase 3: Main Page + Cards (Sept 11, ~2h)

**Prompt 4:**
```
Create src/app/page.tsx — the main Voxmorph interface.

Layout (dark theme, no keyboard input anywhere):

TOP BAR:
- Left: "Voxmorph" in JetBrains Mono, text-slate-100
- Right: language selector dropdown (EN, ES, HI, FR, DE — value changes language_codes param), word count badge

MAIN AREA (centered, max-w-4xl):
- "You said:" section — shows raw transcript with:
  - Text in JetBrains Mono, text-lg, text-slate-100
  - Low-confidence words (<0.7) get underline decoration-amber-500/50 decoration-dotted
  - Empty state: "Tap and hold the mic. Say anything." in text-slate-500 italic

- "For everyone:" section — 5 audience cards in a responsive grid (3 cols desktop, 1 col mobile):
  Each card:
  - Rounded-xl, bg-slate-900/50 with subtle colored left border (4px, audience tint color)
  - Header: icon + label in audience tint color
  - Body: rewritten text in Inter, text-sm, text-slate-200
  - Footer: character count + copy button + edit button
  - Loading state: skeleton pulse animation
  - Entrance: translateX(20px) opacity-0 → translateX(0) opacity-1, staggered 150ms per card

FLOATING MIC BUTTON: bottom-center (the MicButton component)

HISTORY PANEL: collapsible right sidebar (hidden by default), shows past utterances as a timeline

Page background: bg-slate-950
No <input>, no <textarea>, no contentEditable anywhere for text entry.

State management: React useState/useReducer. No external state library.

Flow:
1. User presses mic → recording starts, waveform shows
2. User releases → audio sent to /api/morph
3. Raw transcript appears in "You said"
4. Cards cascade in as responses arrive
5. User can copy, edit, or speak again to add context
```

**Prompt 5:**
```
Create src/components/AudienceCard.tsx

Props: { audience: { id, label, icon, tint }, text: string, confidence: number, requestTime: number, loading: boolean, index: number }

Features:
- Entrance animation: CSS transition with staggered delay (index * 150ms)
- Copy button: navigator.clipboard.writeText(text), show "Copied!" toast for 2s
- Edit button: opens a modal with the text in a textarea (this is the ONE place we allow keyboard input — editing the AI's output, not creating content). Save updates the card.
- Character count badge in bottom-right
- Loading skeleton: 3 animated pulse bars
- Tint colors: blue-500, green-500, purple-500, cyan-500, rose-500 for the left border and icon

Style strictly: bg-slate-900/50 border-l-4 rounded-xl p-4 shadow-md
```

### Phase 4: Polish (Sept 12, ~3h)

**Prompt 6:**
```
Create src/components/WaveformVisualizer.tsx

A canvas-based real-time audio waveform that shows while recording.

- Takes an AnalyserNode from Web Audio API as prop
- Draws a centered waveform line (amber-500 color) on transparent background
- Smooth, flowing visualization — not harsh bars
- Width: 200px, Height: 48px, positioned above the mic button
- Fades in when recording starts, fades out when recording stops
- prefers-reduced-motion: show a simple pulsing dot instead
```

**Prompt 7:**
```
Add filler word visualization to the raw transcript.

When displaying the raw transcript, compare the API's returned text (clean) with what we can infer were fillers. Since the API only returns clean text, add a "Show raw" toggle that:
- When OFF: shows clean text (default)
- When ON: shows clean text with a small badge "Fillers auto-removed by AssemblyAI Dictation API"

Also add the confidence underline: words with confidence < 0.7 get a dotted amber underline.

Add a voice command system — after each transcription, check if the text matches a command pattern:
- "undo" or "go back" → remove last utterance block
- "clear" or "start over" → clear all blocks
- "replace [X] with [Y]" → find X in current text, replace with Y, re-render all cards
- "switch to spanish/hindi/french" → update language_codes and show toast

Use simple regex/string matching. No LLM.
```

### Phase 5: Custom Audience + Conversation Stacking (Sept 12, ~1h)

**Prompt 8:**
```
Add two features:

1. CUSTOM AUDIENCE: A "+" card at the end of the grid that, when clicked, shows a modal asking "Describe your audience" with a mic button inside. User dictates the audience description (e.g., "a five-year-old" or "a medieval knight"). This becomes a 6th parallel API call with the dictated text as the llm_instruction.

2. CONVERSATION STACKING: When the user speaks a second time, pass the previous utterance's raw text as the conversation_context parameter. All 5 cards update with the combined context — they get richer and more detailed. Show a "Context: 2 utterances" badge.
```

### Phase 6: Deploy + Submit (Sept 12 evening)

**Prompt 9:**
```
Prepare for Vercel deployment:

1. Create vercel.json if needed
2. Make sure all env vars are documented in .env.example
3. Add a proper <title> and meta tags to layout.tsx:
   - Title: "Voxmorph — Speak Once, Send Everywhere"
   - Description: "Dictate once, get messages for your boss, team, users, and family. Powered by AssemblyAI Dictation API."
   - OG image: we'll add later

4. Test on mobile viewport (the cards should stack, mic button should be thumb-reachable)
5. Add a "How it works" expandable section at the bottom with:
   - One-line explanation
   - "Powered by AssemblyAI Dictation API" with link
   - "Built for Voice Hackathon Week 2026"
```

**Prompt 10:**
```
Create README.md following this exact structure:
[paste the README structure from the submission checklist above]
Include a placeholder for GIFs (we'll add screenshots later).
```

---

## CLAUDE CODE COMMANDS

```bash
# Start Claude Code with Opus 4.6 (the most powerful model available):
claude --model opus

# Or switch mid-session:
/model opus

# There is NO "max" mode. Opus 4.6 IS the max.
# For Opus planning + Sonnet execution (faster, cheaper):
/model opusplan
```

---

## THE SINGLE PROMPT (if you want to paste one big prompt instead of phases)

```
Build "Voxmorph" — a voice-first app for the AssemblyAI Voice Hackathon (ends Sept 13).

CONCEPT: You speak once. The app rewrites your words for 5 different audiences simultaneously — your boss, your team, the public, a technical audience, and your family. Powered entirely by AssemblyAI's Dictation API llm_instruction parameter.

ARCHITECTURE:
Browser mic (MediaRecorder, WAV) → Next.js API route (/api/morph) → 5 PARALLEL POST requests to AssemblyAI Dictation API, each with different llm_instruction → 5 audience-specific rewrites returned → displayed as cards that cascade in

TECH STACK:
- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- MediaRecorder API for audio capture
- AssemblyAI Dictation API (HTTP POST, NOT WebSocket)
- Lucide React for icons
- No external LLM — all rewriting via AssemblyAI's llm_instruction
- Deploy to Vercel

API INTEGRATION:
- POST https://dictation.assemblyai.com/v1/transcribe/live
- Auth: Authorization: <API_KEY> (no Bearer)
- Body: multipart/form-data — part 1: "config" (JSON with sample_rate, channels, language_codes, llm_instruction), part 2: "audio" (WAV blob)
- Response: { text, llm_response, words: [{text, confidence}], confidence, llm_error, request_time_ms }
- Pre-warm: POST /warm on mic press
- Max 120 seconds audio, max 40 MB
- Rewrite has 5-second internal deadline; failure returns text without llm_response

5 AUDIENCE llm_instructions:
- boss: "Rewrite as brief professional update for senior exec. Lead with conclusion. 2-3 sentences. Formal, no jargon."
- team: "Rewrite as casual team update for colleagues. Direct, actionable. Technical terms OK. Bullet action items."
- public: "Rewrite as public message for customers. Reassuring, no jargon. Focus on impact. Warm, professional."
- tech: "Rewrite as precise technical summary for engineers. Exact terminology, system names, specifics."
- family: "Rewrite as simple warm explanation for non-technical family. No buzzwords. 1-2 casual sentences."

FEATURES (build in order):
1. /api/transcribe — proxy to AssemblyAI with API key injection
2. /api/warm — pre-warm proxy
3. /api/morph — fans out 5 parallel transcribe calls with different llm_instructions, returns all results
4. MicButton — MediaRecorder, 3 states (idle/recording/processing), amber pulsing
5. Main page — dark theme, raw transcript top, 5 audience cards in grid below, floating mic button
6. AudienceCard — colored left border, copy button, edit modal, entrance animation (staggered slide-in)
7. WaveformVisualizer — Canvas waveform above mic button during recording
8. Voice commands — keyword matching: "undo", "clear", "replace X with Y", "switch to [language]"
9. Confidence underlines — amber dotted on words < 0.7 confidence
10. Custom audience — "+" card, dictate audience description, becomes 6th card
11. Conversation stacking — second utterance passes first as conversation_context
12. History panel — collapsible sidebar with past utterances

UI DESIGN (strict, override all defaults):
- bg-slate-950 page background
- Accent: amber-500 (#f59e0b)
- Text: slate-100 (#f1f5f9)
- Cards: bg-slate-900/50, border-l-4 in audience tint, rounded-xl
- Audience tints: blue-500 (boss), green-500 (team), purple-500 (public), cyan-500 (tech), rose-500 (family)
- Mic: 72px circle, amber bg, fixed bottom-center
- Font: JetBrains Mono for transcript, Inter for UI
- NO purple gradients, NO glow, NO emoji icons, NO shadcn hero templates
- Card entrance: translateX(20px) opacity-0 → translateX(0) opacity-1, 300ms ease-out, stagger 150ms
- Responsive: 3-col grid → 1-col on mobile
- prefers-reduced-motion: instant appear, no cascade

NO <input> or <textarea> for content creation. The ONLY text input is the edit modal for correcting AI output.
Voice is the sole content input. This is the core design constraint.

.env.local needs ASSEMBLYAI_API_KEY. Create .env.example with placeholder.
```

---

## QUICK-REFERENCE CARD

| What | Command / Action |
|---|---|
| **Start Claude Code with Opus** | `claude --model opus` |
| **Switch model mid-session** | `/model opus` |
| **Feature freeze** | Sept 12, 2:00 PM |
| **Video deadline** | Sept 12, 10:00 PM |
| **Submit** | Sept 13 morning via Google Form |
| **Submission form** | https://forms.gle/THwUT2tQ5XvABQqT7 |
| **API docs** | https://www.assemblyai.com/docs/dictation |
| **API credits signup** | https://www.assemblyai.com/dashboard/signup?utm_source=event&utm_medium=credit-grant&utm_campaign=voice_hackathon_week_qr |
| **Demo video reference** | https://www.youtube.com/watch?v=ldH50XCGNXg |