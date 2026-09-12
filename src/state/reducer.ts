import type { Card, MorphEvent, Transcript } from "./types";

export type Status = "idle" | "recording" | "processing" | "ready" | "error";

export type State = {
  status: Status;
  utteranceId: string | null;
  transcript: Transcript | null;
  /** Arrival order — this is what produces the cascade. */
  order: string[];
  cards: Record<string, Card>;
  pending: string[];
  summary: { ok: number; degraded: number; failed: number; totalMs: number; transcriptVariance: boolean } | null;
  error: { code: string; message: string } | null;
  language: string;
  /** True while showing the seeded example rather than a live capture. */
  isExample: boolean;
  recordingMs: number;
};

export type Action =
  | MorphEvent
  | { type: "reset" }
  | { type: "recording:start" }
  | { type: "recording:tick"; ms: number }
  | { type: "recording:stop" }
  | { type: "language"; code: string }
  | { type: "card:edit"; id: string; text: string }
  | { type: "fail"; code: string; message: string }
  | { type: "seed"; state: Partial<State> };

export const initialState: State = {
  status: "idle",
  utteranceId: null,
  transcript: null,
  order: [],
  cards: {},
  pending: [],
  summary: null,
  error: null,
  language: "en",
  isExample: false,
  recordingMs: 0,
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return { ...initialState, language: state.language };

    case "recording:start":
      return { ...state, status: "recording", error: null, recordingMs: 0 };

    case "recording:tick":
      return { ...state, recordingMs: action.ms };

    case "recording:stop":
      return { ...state, status: "processing" };

    case "language":
      return { ...state, language: action.code };

    case "meta":
      // A new utterance clears the previous one and seeds skeletons.
      return {
        ...state,
        status: "processing",
        utteranceId: action.utteranceId,
        transcript: null,
        order: [],
        cards: {},
        pending: action.audiences,
        summary: null,
        error: null,
        isExample: false,
      };

    case "transcript":
      // Emitted up to twice: once by whichever call lands first, then again by the
      // baseline carrying `clean`. Never let a later null clobber a real value.
      return {
        ...state,
        transcript: {
          ...action.transcript,
          clean: action.transcript.clean ?? state.transcript?.clean ?? null,
        },
      };

    case "card": {
      const { card } = action;
      const known = card.id in state.cards;
      return {
        ...state,
        // Upsert: a card can arrive twice (degraded → ok on retry) and must keep
        // its original slot rather than jumping to the end of the grid.
        order: known ? state.order : [...state.order, card.id],
        cards: { ...state.cards, [card.id]: card },
        pending: state.pending.filter((id) => id !== card.id),
      };
    }

    case "card:edit": {
      const existing = state.cards[action.id];
      if (!existing) return state;
      return {
        ...state,
        cards: { ...state.cards, [action.id]: { ...existing, text: action.text, edited: true } as Card },
      };
    }

    case "done":
      return {
        ...state,
        status: "ready",
        pending: [],
        summary: {
          ok: action.ok, degraded: action.degraded, failed: action.failed,
          totalMs: action.totalMs, transcriptVariance: action.transcriptVariance,
        },
      };

    case "error":
      return { ...state, status: "error", pending: [], error: { code: action.code, message: action.message } };

    case "fail":
      return { ...state, status: "error", pending: [], error: { code: action.code, message: action.message } };

    case "seed":
      return { ...state, ...action.state, isExample: true, status: "ready" };

    default:
      return state;
  }
}
