# Voxmorph design system

The surface is **paper**, not a console. The product's content is prose, and prose
is read rather than monitored: a light ground is easier to read at length, and it
puts distance between this and the dark-dashboard look that most AI tools ship.

Structure comes from hairlines and space. Colour is rationed: one accent with one
meaning, and channel identity carried by a dot and a number rather than a tinted
field. Every value below carries its measured contrast.

---

## Colour

### Grounds
| Token | Value | Role |
|---|---|---|
| `--color-paper` | `#F4F5F6` | the page |
| `--color-surface` | `#FFFFFF` | any raised sheet |
| `--color-sunk` | `#EDEFF1` | wells, inactive toggle track, skeletons |

### Ink
| Token | Value | On paper | Use |
|---|---|---|---|
| `--color-ink` | `#16171A` | 16.42:1 | body, headings, the floor feed |
| `--color-ink-muted` | `#5C6169` | 5.71:1 | labels, secondary controls |
| `--color-ink-faint` | `#6B7078` | 4.57:1 | metadata, placeholders |
| `--color-hairline` | `#E2E4E7` | — | dividers, sheet borders |
| `--color-hairline-strong` | `#CFD3D8` | — | input borders, scrollbar |

**The Body-Legal Rule.** `ink-faint` is the lightest ink in the system and it still
clears 4.5:1. There is no decorative grey below it. If text needs to recede further
than `ink-faint`, it is cut instead.

### The accent
| Token | Value | Contrast | Use |
|---|---|---|---|
| `--color-accent` | `#D93A1E` | white on it, 4.59:1 | fills only: the mic, the strike rule |
| `--color-accent-text` | `#C02E10` | 5.29:1 on paper | accent-coloured text |
| `--color-accent-wash` | `#FDF0EC` | — | the recording halo, error sheet |

**The One Meaning Rule.** The accent means **voice, live, or removed**, and nothing
else. It is on the microphone, on the recording ring, on the rule through a word the
API deleted, and on failure text. It is never used for emphasis, never for a link,
never for a channel.

**Two values, one hue.** `accent` is for fills, where white sits on it.
`accent-text` is the darker sibling for accent-coloured text, because the fill value
is only 4.21:1 on paper and would fail at body size. Reaching for `accent` on text
is the mistake this pair exists to prevent.

### Channel identity
| Channel | Token | Value | On paper |
|---|---|---|---|
| 00 floor | `--color-ch-floor` | `#16171A` | 16.42:1 |
| 01 cleaned | `--color-ch-cleaned` | `#8A6300` | 4.98:1 |
| 02 boss | `--color-ch-boss` | `#1B4FA8` | 7.05:1 |
| 03 team | `--color-ch-team` | `#0E6A6A` | 5.85:1 |
| 04 public | `--color-ch-public` | `#8A2F7B` | 6.94:1 |
| 05 tech | `--color-ch-tech` | `#3A4899` | 7.49:1 |
| 06 family | `--color-ch-family` | `#A8305A` | 5.95:1 |
| 07 custom | `--color-ch-custom` | `#6B4BA8` | 6.02:1 |

**The Dot Rule.** A channel is identified by a 7px dot and a two-digit number, both
in its hue. It is never a filled background, never a coloured border, never tinted
body text. On paper those read as decoration and crowd the prose they are meant to
label.

**The Legal Hue Rule.** Every channel hue clears 4.5:1 on paper, so any of them is
legal as small text. That is why the channel number can be set in its own hue while
staying readable.

---

## Type

Three families, three jobs that do not overlap.

| Family | Token | Job |
|---|---|---|
| Barlow | `--font-sans` | all prose: messages, labels, metadata, UI |
| Barlow Condensed | `--font-legend` | uppercase control legends only, 0.1em tracked |
| Azeret Mono | `--font-mono` | the floor feed, every numeral, error codes, `llm_error` |

**The Three Voices Rule.** Mono is for the record and for numbers, never for prose.
The floor feed is mono because it is a machine transcript; a channel's rewrite is
prose and takes Barlow. Setting body copy in mono to look technical is the failure
this rule prevents.

### Scale
| Role | Size | Notes |
|---|---|---|
| Floor feed | 26px desktop / 17px mobile | the focal object; mono, `-0.01em` |
| Wordmark | 20px semibold | `-0.02em` |
| Message body | 16px / 1.6 | max 62ch |
| Secondary prose | 14–15px | |
| Metadata, status | 13px | |
| Channel number | 12px mono, tabular | |
| Legend | 11px condensed caps | |

**The Measure Rule.** Message bodies cap at 62ch and the floor feed at 52ch. Barlow's
figure advance runs wider than its lowercase average, so a `ch` cap over-measures;
these values were set by reading rendered line lengths, not by trusting `ch`.

**The Tabular Rule.** Every number that can change sits in `tabular-nums` so it does
not jitter as it updates.

---

## Surfaces

One sheet treatment, one radius.

```css
.sheet {
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius);          /* 6px */
  box-shadow: 0 1px 2px rgba(22, 23, 26, 0.04);
}
```

**The One Radius Rule.** 6px on every surface and control. The microphone is the
sole circle, because it is the only thing you physically press and hold.

**The Hairline Rule.** Separation is a 1px `--color-hairline`, not a shadow and not a
gap. Channels are rows inside one sheet divided by hairlines, never a grid of
detached cards: prose needs a measure and a rule, and equal cards are the
arrangement this design refuses.

**Depth is almost absent.** One 1px/2px shadow at 4% opacity on sheets. The only
real elevation in the system is the microphone, and the only glow is its recording
halo.

---

## Motion

anime.js v4, loaded lazily on the client, skipped entirely under
`prefers-reduced-motion`. Three moments, each reporting something true.

| Moment | What it does | Why it earns its place |
|---|---|---|
| Deal-in | a channel lifts 10px and fades in, 460ms, 55ms stagger | marks the arrival of its API response; the stagger is real response order |
| Strike draw | `--draw` 0 → 1 scales the rule across a removed word, 300ms, 110ms apart | shows the removal happening rather than presenting it as already done |
| Count-up | a readout animates to its value, 700ms | the number arrives with the data |

**The Reports-Something Rule.** Motion is tied to real events: a response landing, a
word being deleted, a measurement resolving. There are no ambient loops, no hover
flourishes, no decorative transitions.

**The No-JS Resting State Rule.** `--draw` registers via `@property` with
`initial-value: 1`, so the strike rule is fully drawn with no JavaScript at all.
Animation only ever replays a state that is already correct, which is also exactly
what a reduced-motion user sees.

---

## Browser surfaces

Themed, because they ship with defaults that belong to no design system.

- Selection: `#FBD9D1` with ink text
- Caret: `--color-accent`
- Scrollbar: `--color-hairline-strong` thumb, 3px paper border, fully round
- Focus ring: 2px `--color-accent`, 2px offset, 2px radius

---

## Do

- Reach for a hairline before a border, and space before a hairline.
- Keep the accent on voice, live and removed. Anything else gets ink.
- Put numbers in mono and tabular.
- Let the floor feed be the largest thing on the page. It is the product's proof.

## Don't

- Tint a channel's background or give it a coloured border. It gets a dot.
- Set prose in mono, or a message body over 62ch.
- Use `--color-accent` on text; that is what `--color-accent-text` is for.
- Add a shadow to create separation. Use the hairline.
- Animate anything that is not reporting a real event.
