import { describe, expect, it } from "vitest";
import { MASCOT_STATES, PHRASES, pickPhrase } from "../src/components/mascota/states";

const BODY_WORDS = /\b(gord[oa]|flac[oa]|barriga|panza|grasa|kilos?|kg|peso|calor[ií]as?|kcal|feo|fea)\b/i;

describe("mascot phrases", () => {
  it("every state has at least 10 phrases", () => {
    for (const s of MASCOT_STATES) expect(PHRASES[s].length).toBeGreaterThanOrEqual(10);
  });
  it("no phrase talks about the student's body, weight or calories", () => {
    for (const s of MASCOT_STATES) for (const p of PHRASES[s]) expect(p.text, `${s}: ${p.text}`).not.toMatch(BODY_WORDS);
  });
  it("no em-dashes in copy", () => {
    for (const s of MASCOT_STATES) for (const p of PHRASES[s]) expect(p.text).not.toMatch(/[—–]/);
  });
  it("pickPhrase is deterministic with a seed", () => {
    expect(pickPhrase("wave", { seed: 0 })).toBe(PHRASES.wave[0]!.text);
    expect(pickPhrase("wave", { seed: 11 })).toBe(PHRASES.wave[1]!.text);
  });
});
