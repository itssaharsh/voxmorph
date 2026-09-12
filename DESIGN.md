---
name: Voxmorph
description: A delegate console in a dimmed assembly hall — one voice in, six numbered channels out.
colors:
  hall: "#0C1A1D"
  hall-deep: "#071113"
  panel: "#16282B"
  panel-raised: "#1E3438"
  bevel: "#2C4A4F"
  bevel-lit: "#3E6970"
  focus: "#6BA3AB"
  engrave: "#DDE6E3"
  engrave-dim: "#93A9A8"
  engrave-faint: "#7A9997"
  engrave-faint-raised: "#86A5A3"
  live: "#E4572E"
  live-text: "#F98363"
  lamp-floor: "#F2EDDF"
  lamp-clean: "#E8B44A"
  lamp-boss: "#5BA3D0"
  lamp-team: "#57B894"
  lamp-public: "#B78BD9"
  lamp-tech: "#4FC3D9"
  lamp-family: "#E08CA8"
  lamp-wild: "#C9A227"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    letterSpacing: "0.2em"
  legend:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.13em"
  floor:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  readout:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  none: "0"
  panel: "2px"
  full: "9999px"
spacing:
  hair: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  deck-clearance: "176px"
components:
  rack:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
  floor-panel:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.engrave}"
    typography: "{typography.floor}"
    rounded: "{rounded.panel}"
    padding: "24px 28px"
  channel-strip:
    backgroundColor: "transparent"
    textColor: "{colors.engrave}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "20px 24px"
  lamp:
    rounded: "{rounded.full}"
    size: "6px"
  talk-key:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.live-text}"
    rounded: "{rounded.full}"
    size: "84px"
  talk-key-recording:
    backgroundColor: "{colors.live}"
    textColor: "#2B0F06"
    rounded: "{rounded.full}"
    size: "84px"
  copy-key:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.engrave-dim}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
    padding: "6px 10px"
  copy-key-done:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.lamp-team}"
    rounded: "{rounded.none}"
    padding: "6px 10px"
  icon-key:
    backgroundColor: "transparent"
    textColor: "{colors.engrave-faint}"
    rounded: "{rounded.none}"
    padding: "6px"
  icon-key-hover:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.engrave}"
    rounded: "{rounded.none}"
    padding: "6px"
  wildcard-chip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.engrave-dim}"
    rounded: "{rounded.panel}"
    padding: "4px 12px"
  view-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.engrave-faint}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  view-toggle-active:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.engrave}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  message-editor:
    backgroundColor: "{colors.hall-deep}"
    textColor: "{colors.engrave}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px"
  toast:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "8px 14px"
---

# Design System: Voxmorph

## Overview

**Creative North Star: "The Interpretation Booth"**

A delegate console in a dimmed assembly hall. One speaker enters the room, says a
thing once, and every listener turns to the channel they understand. The ground is
hall dark, not terminal dark — a wide radial wash that is lighter at the top of the
viewport, as if the room itself were lit from the stage. Every surface that holds
content is anodized panel: a fine vertical brush, a lit top bevel, a dark seat
below. Legends are not labels printed on the panel; they are engraved into it,
condensed and uppercase and carrying a faint light on their lower edge.

Identity is carried the way a broadcast desk carries it: by **position and by
light**. Every channel has a fixed two-digit number and a single 6px lamp. It does
not have a tinted background, a coloured border, or an icon badge. This is the
arrangement the console exists to refuse — the dashboard of six equal tinted cards
in a responsive grid, which is what almost every tool in this category ships. The
rack here is one continuous faceplate with channels seated into it and divided by
hairlines; it reads as a single instrument rather than six detached objects.

The system is unusually quiet about weight and radius and loud about **measure,
case and material**. There is exactly one action colour and it belongs to the
microphone and to things that went wrong. There is exactly one moving element that
reports something true. Everything else holds still.

**Key Characteristics:**

- Dimmed hall ground with an anodized panel as the only content surface
- Channel identity is a 6px lamp plus a fixed-width two-digit number — never a fill
- Three type roles, three families, one weight
- 2px machined radius on panel materials; square everywhere else; circles reserved for physical objects
- One action colour, reserved for the microphone and for failure
- Two authored keyframes; the only continuous motion is driven by real microphone RMS

## Colors

A dimmed teal-black room with anodized teal-grey hardware, one warm orange for the
microphone, and eight saturated lamp colours that are allowed to be light and
nothing else.

### Primary

- **Signal Orange** (`{colors.live}`): The action colour, and the only warm hue in
  the system. It fills the talk key body while recording, rings the idle key at 1px,
  borders the alert banner, tints the alert glyph, and draws the strike rule through
  every word the Dictation API's own cleanup removed. It is never a channel colour,
  never a surface fill, and never decoration.
- **Signal Orange Light** (`{colors.live-text}`): The text-safe member of the orange
  family, measured at 6.16:1 on panel. Carries the `MIC LIVE` readout and its
  elapsed counter, the `channel down` error line, warning toasts, the idle
  microphone glyph, and the caret in every editable field.

### Neutral

- **Hall** (`{colors.hall}`): The room. Applied as the midpoint of a fixed radial
  wash on `html` running from `#12262A` at the top through Hall at 42% to Hall Deep
  at the edges, so the console appears lit from above. Also the theme colour of the
  browser chrome.
- **Hall Deep** (`{colors.hall-deep}`): The far corners of the room, the scrollbar
  track, and the recessed ground of the one editable textarea.
- **Panel** (`{colors.panel}`): The anodized faceplate. Ground for the rack, the
  chips, the language selector, the toast and the alert banner.
- **Panel Raised** (`{colors.panel-raised}`): The lighter alloy of the floor channel,
  the pressed state of the view toggle, the resting ground of the copy key, the hover
  ground of the icon keys, and the fill of every loading skeleton bar.
- **Bevel** (`{colors.bevel}`): The 1px machined edge on every panel, every section
  rule, the rack's internal hairlines (at 78% against transparent), the scrollbar
  thumb, and the dark state of an unlit lamp.
- **Bevel Lit** (`{colors.bevel-lit}`): The top edge only. Every panel border sets
  its `border-top-color` to this, which is what makes a flat rectangle read as a
  machined face catching room light. Also the hover edge on interactive panels, the
  border of the open editor, and the selection highlight.
- **Focus Cyan** (`{colors.focus}`): The 2px focus ring at 2px offset, globally, on
  `:focus-visible`. Measured at 5.43:1 on panel.

### Engrave (text)

Engraved legend fill, named for the material rather than a grey step.

- **Engrave** (`{colors.engrave}`): Primary reading colour. Body text on `body`, the
  wordmark, floor-feed transcript, channel messages, lit channel numbers.
- **Engrave Dim** (`{colors.engrave-dim}`): The default legend colour, plus the
  numeric readouts, the language selector, inline `code`, and footer links.
- **Engrave Faint** (`{colors.engrave-faint}`): Supporting and metadata text —
  per-channel character counts and timings, the tally line, the empty-state prose,
  the footer, struck words, and the idle talk-key caption. Measured at 4.98:1 on
  panel.
- **Engrave Faint Raised** (`{colors.engrave-faint-raised}`): The same role on the
  lighter raised floor. It is not applied by hand: `.vx-floor` rebinds
  `--color-engrave-faint` to this value for its whole subtree, so faint text inside
  the floor panel automatically lightens and holds 4.94:1 on its brighter ground.

### Lamps

Eight channel identities. Each is a light source, never a field.

- **Floor** (`{colors.lamp-floor}`) — channel 00, the verbatim floor feed, and the
  standby lamp in the console header.
- **Cleaned Amber** (`{colors.lamp-clean}`) — channel 01, the API's own cleanup.
  Also carries the "N removed by the API" count, the `relayed from floor` notice,
  and (at 70%) the dotted underline under low-confidence words.
- **Boss Blue** (`{colors.lamp-boss}`) — channel 02.
- **Team Green** (`{colors.lamp-team}`) — channel 03. Also the confirmation colour:
  the copy key's border and label for 1600ms after a successful copy, and the
  success toast.
- **Public Violet** (`{colors.lamp-public}`) — channel 04.
- **Technical Cyan** (`{colors.lamp-tech}`) — channel 05.
- **Family Rose** (`{colors.lamp-family}`) — channel 06, and the on-air lamp in the
  console header.
- **Wildcard Gold** (`{colors.lamp-wild}`) — channels 91–93, the ad-hoc instructions.

### Named Rules

**The Lamp Rule.** A channel colour may be light, a hairline, a transient
confirmation border, or a few words of status text. It may never be a background,
a card border at rest, a heading colour, or a full-width band. On a strip carrying
an audience message the channel colour occupies a 6px dot and a 32×1px rule, and
nothing else.

**The One Job Rule.** The orange family marks the microphone and marks failure.
Talk key, on-air readout, alert border and glyph, the strike through what the API
deleted, and the caret. Nothing else in the interface may borrow it — a channel can
never be orange, and an orange fill never means "primary".

**The Rebind Rule.** When a surface changes ground, it rebinds the affected text
token rather than overriding colours at the call site. `.vx-floor` redefines
`--color-engrave-faint` for its subtree. A new lighter surface follows the same
pattern; it does not introduce a one-off text colour.

## Typography

**Legend Font:** Barlow Condensed (with Barlow, then `ui-sans-serif, sans-serif`)
**Body Font:** Barlow (with `ui-sans-serif, system-ui, sans-serif`)
**Mono Font:** Azeret Mono (with `ui-monospace, SF Mono, Menlo, monospace`)

**Character:** Three families with three jobs and no overlap. Barlow Condensed is
the engraved hardware voice — uppercase, widely tracked, small, never used for a
sentence. Barlow is the human voice and carries every piece of prose in the
product, including all six rewritten messages. Azeret Mono is the machine voice: it
carries the verbatim transcript, every numeral, every timing and every error code.
The pairing is deliberately the inverse of the usual developer-tool move — mono is
the evidence, not the personality.

### Hierarchy

- **Display / wordmark** (Condensed, 400, 22px, 0.2em, uppercase): The product name
  in the console header. Used once per page.
- **Floor** (Mono, 400, 26px ≥640px / 16px below, line-height 1.55): The verbatim
  transcript on channel 00. The largest and most prominent text in the product, and
  the only place mono is set at reading size. Constrained to a 44rem measure.
- **Body** (Barlow, 400, 15px, line-height 1.65): Every rewritten channel message
  and the one editable textarea. Constrained to a 28rem measure, which lands around
  71 characters at this size.
- **Prose** (Barlow, 400, 13px, relaxed): Footer explanation, talk-key caption,
  toasts, alert messages.
- **Support** (Barlow, 400, 12px): Inline channel status — `relayed from floor`,
  `channel down`, `edited`, the removed-word count.
- **Legend** (Condensed, 400, 10–11px, 0.13em, uppercase, `engrave-dim`, with a
  `0 1px 0 rgba(255,255,255,0.05)` lower-edge highlight): Section legends, channel
  names, readout labels, the copy key, the view toggles.
- **Readout** (Mono, 400, 11px, tabular): Timings, character counts, error codes,
  `llm_error` values, the tally line, the language selector.
- **Channel number** (Mono, 400, 13px, tabular, zero-padded to two digits): The
  channel's fixed address on the rack.

### Named Rules

**The Three Voices Rule.** Condensed is only ever uppercase hardware legend. Barlow
is only ever prose. Mono is only ever the verbatim floor feed, a numeral, a timing,
or an error code. A sentence never appears in mono outside channel 00; a number
never appears outside mono.

**The One Weight Rule.** The built interface renders entirely at weight 400.
Hierarchy comes from family, size, case, tracking and colour — never from weight.
Barlow and Barlow Condensed are loaded at 400/500/600 and Azeret Mono at 400/500,
so a heavier step is available, but nothing in the shipped system uses one and
adding weight is a change to the system, not a local decision.

**The Tabular Rule.** Every numeral carries `tabular-nums`. Timings, counts,
percentages and channel numbers must not reflow as they update — a readout that
jitters while a value ticks is a broken instrument.

**The Measure Rule.** Prose is always bound by a measure independent of its
container: 44rem for the floor feed, 28rem for a channel message. A channel strip
is full width; its message is not.

## Layout

A single centred column, `max-width: 64rem`, with 16px side gutters (24px ≥640px)
and 176px of bottom clearance reserved for the fixed talk deck. There is no
multi-column grid anywhere in the product.

The page is a vertical stack of horizontally ruled bands, in fixed order:

1. **Console header** — wordmark and tagline left, on-air lamp / standby legend and
   language selector right. 16px vertical padding, closed by a 1px bevel rule.
2. **Alert banner** (conditional) — 20px above the floor.
3. **Floor channel** — full width, 20px below the header.
4. **Rack legend and tally** — "CHANNELS" left, the run summary right, 24px above
   (32px ≥640px), closed by a bevel rule.
5. **The rack** — 12px below the legend.
6. **Wildcard row** (conditional) — 24px below the rack.
7. **Footer** — pushed to the bottom by `margin-top: auto`, opened by a bevel rule.

**The channel strip** is the only internal layout with columns: a two-column grid,
`auto | 1fr` below 640px and `7.5rem | 1fr` at and above it. On mobile the channel
selector is a horizontal row (lamp, number, name); on desktop it becomes a vertical
stack in its fixed 7.5rem gutter — lamp and number on the first line, engraved name
below, then the channel's 32×1px identity rule. The message column is
`min-width: 0` so long unbroken output cannot widen the strip.

**Responsive behaviour** is one breakpoint, 640px (`sm`), and it only ever changes
padding, the floor feed's type size, and the channel selector's axis. No element
appears, disappears or reorders across it except the header tagline, which is
hidden below 640px.

**Rhythm** is a 4px base. Band separations use 12/20/24/32px; component padding uses
4/6/8/10/12/16/20/24/28px; gaps inside a row use 8/10/16/24px. Section boundaries
are always a 1px bevel rule, never whitespace alone and never a heavier divider.

### Named Rules

**The One Column Rule.** Content is one centred column of full-width bands. A
responsive card grid is the arrangement this console exists to refuse — if six
things must be shown at once, they are rows on a rack, ordered and numbered.

**The Deck Clearance Rule.** The talk key is fixed at the bottom centre, so the
scrolling column always reserves 176px of bottom padding and the toast sits at
144px. Any new fixed furniture must extend that reservation rather than overlap
content.

## Elevation & Depth

Depth is **material, not shadow**. Almost nothing casts. The illusion of a machined
console comes from three devices applied consistently: a top-lit border, a
brushed-metal texture, and a top-edge inset highlight.

Every panel material shares the same construction — a 1px `bevel` border whose
`border-top-color` is overridden to `bevel-lit`, a white-to-transparent linear
gradient falling from the top edge, and a 1px-on-3px-pitch vertical brush at
roughly 1.2% white. The three materials differ only in intensity, and that
difference is the entire elevation scale:

- **`.vx-panel`** — the base faceplate. Gradient to 38% at 4.5% white, no shadow.
  Chips, the selector, the toast, the alert banner.
- **`.vx-rack`** — one continuous faceplate holding the channel strips. A weaker
  gradient (3.5% to 22%) plus a 1px inset top highlight at 3%. Its children are
  separated by `border-top` hairlines at 78% bevel — **the rack has no internal gaps
  and its children have no borders of their own**.
- **`.vx-floor`** — the hero channel, mounted in the console rather than laid on it.
  The lighter `panel-raised` alloy, a stronger gradient (7% to 34%), a brighter
  brush, a 7% inset top highlight, and the only real cast shadow in the layout.

### Shadow Vocabulary

- **Floor seat** (`box-shadow: 0 10px 26px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.07)`):
  The raised floor channel only. The one element in the document flow permitted to
  cast.
- **Key seat, idle** (`box-shadow: 0 3px 0 #0A1719, 0 10px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px color-mix(in oklab, var(--color-live) 55%, transparent)`):
  The talk key at rest. A hard 3px offset gives the button physical travel; the
  fourth layer is the thin orange ring that marks it as the microphone.
- **Key seat, recording** (`box-shadow: 0 2px 0 #8C2F16, 0 10px 22px rgba(228,87,46,0.30), inset 0 1px 0 rgba(255,255,255,0.30)`):
  Travel shortens from 3px to 2px and the ambient glow turns orange as the key is
  pressed in.
- **Lamp halo** (`box-shadow: 0 0 0 1px color-mix(in oklab, <lamp> 30%, transparent)`):
  A lit lamp only. 1px, no blur.
- **Toast** (`shadow-lg`): The only floating element, and the only use of a stock
  shadow.

### Named Rules

**The Top-Lit Rule.** Depth is a lit top edge, not a drop shadow. Any new surface
gets the 1px bevel border with `border-top-color: var(--color-bevel-lit)` and a
top-falling white gradient. A surface that needs to read as raised gets a brighter
gradient and a lighter fill before it is allowed a shadow.

**The One Caster Rule.** In the document flow only the floor channel casts a
shadow, because it is the one element mounted above the console face. Strips,
chips, keys and the rack are flush.

## Shapes

**Flat-edged and machined.** The form language is rectangles with a 2px cut corner,
and the exceptions are strictly physical.

- **Panel materials** carry the single radius token, `2px` (`{rounded.panel}`) —
  the rack, the floor channel, chips, the selector, the toast, the alert banner.
  This is the only non-zero radius applied to a surface anywhere.
- **Everything else in the flow is square** (`0`): the copy key, the icon keys, the
  verbatim/cleaned toggle group and its container, the message editor, every
  skeleton bar, and the scrollbar thumb. A bordered control is a cut rectangle, not
  a rounded one.
- **Circles are reserved for physical objects**, of which there are exactly two: the
  84px talk key, because it is a push-button, and the 6px lamp, because it is a
  bulb. Nothing else in the system is round — no avatars, no pills, no round badges,
  no circular icon buttons.

Borders are always exactly 1px. Rules are always exactly 1px, except the
strike-through and the low-confidence underline, which are 1.5px so they survive at
26px mono. Icons are line glyphs (lucide-react) at 14px in controls and 24px in the
talk key; there are no filled icon shapes and no icon backgrounds.

### Named Rules

**The One Radius Rule.** 2px on panel materials, 0 on controls, `9999px` only for
the talk key and the lamp. There is no 4px, no 6px, no 8px, and no `rounded-lg`
anywhere in the system.

## Components

### The Talk Key (signature)

An 84px machined push-button fixed to the bottom centre of the viewport, sitting on
a deck scrim. It is **held, never toggled**.

- **Shape:** a true circle, the sole circular control.
- **Idle:** a vertical gradient `#47787F → panel-raised (48%) → #0E2023`, the idle
  key seat shadow with its 1px orange ring, and a `live-text` microphone glyph.
- **Recording:** the gradient turns `#F07A55 → live (55%) → #A83A1C`, the seat
  shortens to 2px, the glyph darkens to `#2B0F06`, and the caption above becomes
  `MIC LIVE <elapsed>s · release to send` in `live-text`.
- **Busy:** disabled, `cursor: wait`, spinner glyph, caption `patching channels`.
- **Press:** `translateY(2px)` over 100ms — the key seats into the console.
- **The level arc:** a 34px-radius SVG ring rotated -90°, with a static
  `rgba(255,255,255,0.10)` track. While recording, a `#FFD9C9` stroke is drawn over
  it with `stroke-dashoffset` bound to real microphone RMS (0..1), transitioning at
  90ms linear. **This is a meter, not a pulse** — it must always be driven by a real
  measurement.
- **Input:** Pointer Events with `setPointerCapture` on the active pointer id, plus
  `pointercancel` and `lostpointercapture` both releasing, so a drag off the button
  or an interrupted gesture still stops cleanly. `touch-action: none` suppresses
  double-tap zoom locally without disabling pinch-zoom on the page. A held `Space`
  is the equivalent keyboard path and is suppressed while a text field has focus.

**The Deck Scrim.** The fixed deck paints a `::before` scrim extending 150px above
itself, running transparent → 70% hall → fully opaque hall by 48%, so scrolling
content never reads through the key or its caption.

### The Rack and its Channel Strips

- **The rack** is one `.vx-rack` faceplate. Strips are seated into it with
  `border-top` hairlines and **no gaps and no per-strip borders**.
- **A strip** is a row, 20px/16px padding (24px horizontal ≥640px). Left gutter:
  the lamp, the zero-padded channel number in 13px tabular mono, the engraved name
  in 10px legend, and a 32×1px identity rule in the channel colour at 55% opacity
  (`bevel` when the channel is down). Right column: the message at 15px Barlow
  bound to a 28rem measure, then a metadata row.
- **Metadata row:** status text on the left (`relayed from floor · <llm_error>`,
  `channel down · <code>`, `edited`), then an 11px tabular mono readout of character
  count, server time and attempt count; keys on the right.
- **Degraded** channels stay lit and show the amber `relayed from floor` notice with
  the real `llm_error` in mono. **Failed** channels dim their lamp, blank their
  identity rule to `bevel`, and show `channel down` with the real code in
  `live-text`.
- **Skeleton:** the same grid with an unlit lamp, a faint number and two
  `panel-raised` pulse bars. It occupies the strip's real position on the rack, so
  channels do not jump when they land.

### The Floor Channel

The raised `.vx-floor` panel at the top of the stack. Header line: the floor lamp,
the `CH 00 · FLOOR` legend, and `as spoken` in 12px. Right side: the amber removed
count, then a two-button verbatim/cleaned toggle sharing a single 1px bevel box.
Body: 26px mono transcript on a 44rem measure, where **words the API's own cleanup
removed are struck** with a 1.5px `live` rule and words below 0.7 confidence carry a
1.5px dotted amber underline at 4px offset. Footer: a definition list of readouts
(signal, words, length, server, uncertain), each a 10px legend label with an 11px
tabular mono value, separated by a bevel rule.

### Keys (buttons)

There is no "primary button" in this system. The talk key is the only emphatic
control; everything else is a console key.

- **Icon key:** transparent with a transparent 1px border, 6px padding, square,
  `engrave-faint` glyph. Hover reveals a `bevel` border, a `panel-raised` ground and
  an `engrave` glyph. `active:translate-y-px`.
- **Copy key:** square, 1px `bevel` border, `panel-raised` ground, 10px legend label
  with a 14px glyph. Hover lifts the border to `bevel-lit`. On success it holds a
  `lamp-team` border and label with a check glyph for 1600ms, then reverts.
- **Wildcard chip:** `.vx-panel`, 4×12px, 12px `engrave-dim`. Hover lifts the border
  to `bevel-lit`; disabled drops to 40% opacity with `cursor: not-allowed`.
- **View toggle:** two legend keys in one bordered box. The active one takes a
  `panel-raised` ground and `engrave` text and carries `aria-pressed`.

**Every key seats 1px on press** (`active:translate-y-px`); the talk key seats 2px.
Transitions are always explicit property lists — colour, border-colour, background
and transform — never `transition: all`.

### Inputs

- **Message editor:** the one text input in the product, and it edits AI output
  rather than composing content. Square, 1px `bevel-lit` border, recessed
  `hall-deep` ground, 10px padding, 15px Barlow, resizable vertically. Opens focused
  and selected. `Escape` reverts, `Cmd/Ctrl+Enter` commits, blur commits.
- **Language selector:** `.vx-panel`, 4×8px, 11px mono `engrave-dim`. Native
  `<select>`, with its own `outline: none` overridden by the global focus ring.

### Toast

A single ephemeral panel fixed 144px from the bottom, centred, `pointer-events:
none` on its container. `.vx-panel` with `shadow-lg`, 8×14px, 13px. Success is
`lamp-team` with a check; warning is `live-text` with a triangle. Enters on the
`lamp` keyframe and dismisses itself after 2400ms.

### Alert Banner

`.vx-panel` with its border overridden to `live` — the only element permitted a
coloured border at rest, because it reports a real failure. A `live` triangle glyph,
the message in `engrave`, and the raw error code beneath it in 11px mono
`engrave-faint`. `role="alert"`.

### Named Rules

**The Real Readout Rule.** Every number on screen is a measurement — server
milliseconds, character counts, attempt counts, confidence, audio duration, removed
words. There are no illustrative figures, no rounded-for-looks values, and no
progress indicator that is not bound to a real quantity.

**The Honest Failure Rule.** A degraded or failed channel keeps its position and its
number on the rack and shows its real error code in mono. Failure is a lamp going
dark and a code appearing — never a removed row, never a generic "something went
wrong", never a red card.

## Motion

Two authored keyframes, and nothing else may be added without displacing one.

- **`patch`** (`380ms cubic-bezier(0.16, 1, 0.3, 1) both`): a channel seating into
  the rack — from `opacity: 0`, `translate3d(0,-10px,0)` and `clip-path: inset(0 0
  100% 0)` to rest. It reads as a strip sliding down into its slot rather than a
  card fading in. Applied per strip with a **65ms stagger capped at index 6**, so
  the rack fills in order and a long run never drifts into a slow cascade.
- **`lamp`** (`220ms ease-out both`): opacity 0.25 → 1. A light coming up. Used by
  the toast.

Loading uses two stock utilities — a pulse on skeleton bars and a spin on the
busy talk-key glyph. Everything else is an explicit property transition, generally
100–220ms.

**Under `prefers-reduced-motion: reduce`, all animation and transition durations
collapse to 0.01ms globally** and iteration counts drop to 1. The level arc's
90ms `stroke-dashoffset` transition collapses with them; the arc itself remains,
because it is information rather than decoration.

### Named Rules

**The Two Keyframes Rule.** The system has `patch` and `lamp`. A new motion idea
must either reuse one or replace one. Nothing ambient, nothing looping, nothing
decorative — the only continuously moving element in the product is the level arc,
and it is driven by a real microphone measurement.

## Browser Surfaces

The chrome is part of the design and is themed explicitly:

- `color-scheme: dark` on `html`, and `themeColor: #0C1A1D` in the viewport metadata.
- **Selection:** `#3E6970` ground with `#F4FAF9` text.
- **Scrollbars:** thin, `bevel` thumb on a `hall-deep` track; 9px on WebKit with a
  square (`border-radius: 0`) thumb.
- **Caret:** `live-text` in every `input` and `textarea`.
- **Focus:** a global `:focus-visible` ring — `2px solid` `focus` at `2px` offset.
  It is never removed locally; controls that set `outline: none` for their resting
  state still inherit it.

## Do's and Don'ts

### Do:

- **Do** give a new channel a two-digit number, a lamp colour and an engraved name,
  and seat it in the rack as a row.
- **Do** build a new surface from the panel recipe — 1px `bevel` border,
  `border-top-color: var(--color-bevel-lit)`, a top-falling white gradient, and the
  1px-on-3px vertical brush.
- **Do** use `{rounded.panel}` (2px) on surfaces and `0` on controls.
- **Do** set every numeral in Azeret Mono with `tabular-nums`.
- **Do** bind prose to a measure — 44rem for the floor feed, 28rem for a message.
- **Do** rebind `--color-engrave-faint` on any surface lighter than `panel`, the way
  `.vx-floor` does, instead of hand-picking a lighter grey.
- **Do** drive any progress or level indicator from a real measurement, and label
  failures with the real error code.
- **Do** state hierarchy through family, size, case, tracking and colour.

### Don't:

- **Don't** tint a card. No coloured backgrounds, no coloured borders at rest, no
  coloured headings for channel identity — a channel's colour is its 6px lamp and
  its 32×1px rule, and that is the whole budget.
- **Don't** lay out results as a responsive grid of equal cards. The rack is rows,
  ruled and numbered, with no gaps between them.
- **Don't** use `{colors.live}` or `{colors.live-text}` for anything but the
  microphone, the on-air readout, an alert, the caret, or the strike through what
  the API removed.
- **Don't** introduce a radius other than 2px, 0, or a full circle, and don't make
  anything new circular — that vocabulary is spent on the talk key and the lamp.
- **Don't** set a sentence in mono outside the floor feed, or a number outside mono.
- **Don't** add a third keyframe, an ambient loop, a decorative pulse, or a
  `transition: all`.
- **Don't** give an element a drop shadow to make it read as raised. Lighten its
  fill and strengthen its top light first; only the floor channel casts in flow.
- **Don't** add a text input for composing content. Voice is the only content input;
  the single textarea exists to edit the API's output.
- **Don't** remove a failed channel from the rack or replace its error code with
  friendly copy.
