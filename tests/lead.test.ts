import { describe, expect, it } from "vitest";
import { fieldErrors, leadSchema } from "../src/lib/validation/lead";

const valid = { name: "Mariana", phone: "310 482 1967", goal: "perder_grasa", modality: "casa", consent: "on" };

describe("leadSchema", () => {
  it("accepts a valid lead and normalizes the phone", () => {
    const r = leadSchema.parse(valid);
    expect(r.phone).toBe("3104821967");
    expect(r.website).toBe("");
  });
  it("accepts +57 prefix", () => {
    expect(leadSchema.parse({ ...valid, phone: "+57 (310) 482-1967" }).phone).toBe("+573104821967");
  });
  it("rejects bad phone, missing consent, unknown modality", () => {
    const r = leadSchema.safeParse({ ...valid, phone: "12", consent: undefined, modality: "playa" });
    expect(r.success).toBe(false);
    const errs = fieldErrors(r.error!);
    expect(Object.keys(errs).sort()).toEqual(["consent", "modality", "phone"]);
  });
  it("rejects a filled honeypot", () => {
    expect(leadSchema.safeParse({ ...valid, website: "spam.com" }).success).toBe(false);
  });
});
