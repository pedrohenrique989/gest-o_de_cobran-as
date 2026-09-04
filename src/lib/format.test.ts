import { describe, expect, it } from "vitest";
import { addMeses, fmtCompetencia, fmtPct, parseBRL } from "./format";
describe("format", () => {
  it("competência", () => expect(fmtCompetencia("2026-09-01")).toBe("Set/2026"));
  it("addMeses vira o ano", () => expect(addMeses("2026-12-01", 1)).toBe("2027-01-01"));
  it("pct", () => expect(fmtPct(25, 100)).toBe("25,0%"));
  it("parseBRL", () => expect(parseBRL("R$ 1.234,56")).toBe(1234.56));
});
