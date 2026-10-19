import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, dateRange, localDate, weekday } from "./dates";
import { fastingHints } from "./habits/fasting";
import { computeStreak } from "./habits/streaks";
import type { Hijri } from "./prayer/aladhan";

const hijri = (month: number, day: number): Hijri => ({ day, month, monthEn: "", monthAr: "", year: 1448, holidays: [] });

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2024-03-01", -1), "2024-02-29");
  });
  it("lists an inclusive range", () => {
    assert.deepEqual(dateRange("2026-10-18", "2026-10-20"), ["2026-10-18", "2026-10-19", "2026-10-20"]);
  });
  it("uses the user's timezone for 'today'", () => {
    const at = new Date("2026-10-19T23:30:00Z");
    assert.equal(localDate("Africa/Lagos", at), "2026-10-20");
    assert.equal(localDate("America/New_York", at), "2026-10-19");
  });
  it("knows the weekday", () => assert.equal(weekday("2026-10-19"), 1));
});

describe("streaks", () => {
  const today = "2026-10-19";
  it("counts a run ending today", () => {
    const s = computeStreak(new Set(["2026-10-17", "2026-10-18", "2026-10-19"]), today);
    assert.deepEqual(s, { current: 3, best: 3, doneToday: true });
  });
  it("keeps yesterday's run alive while today is still open", () => {
    const s = computeStreak(new Set(["2026-10-17", "2026-10-18"]), today);
    assert.equal(s.current, 2);
    assert.equal(s.doneToday, false);
  });
  it("resets after a gap but remembers the best run", () => {
    const s = computeStreak(new Set(["2026-10-10", "2026-10-11", "2026-10-12", "2026-10-15"]), today);
    assert.equal(s.current, 0);
    assert.equal(s.best, 3);
  });
});

describe("fasting hints", () => {
  it("suggests Mondays and Thursdays", () => {
    assert.deepEqual(fastingHints("2026-10-19", hijri(5, 8)), ["monday"]);
    assert.deepEqual(fastingHints("2026-10-22", hijri(5, 11)), ["thursday"]);
  });
  it("marks the white days", () => assert.deepEqual(fastingHints("2026-10-24", hijri(5, 13)), ["white_days"]));
  it("labels Ramadan only", () => assert.deepEqual(fastingHints("2027-02-15", hijri(9, 8)), ["ramadan"]));
  it("never hints on Eid or the days of tashreeq", () => {
    assert.deepEqual(fastingHints("2027-03-08", hijri(10, 1)), []);
    assert.deepEqual(fastingHints("2027-05-17", hijri(12, 13)), []);
  });
  it("still works without a Hijri date", () => assert.deepEqual(fastingHints("2026-10-19", null), ["monday"]));
});

describe("safeNext (open-redirect guard)", async () => {
  const { safeNext } = await import("./safe-next");
  it("allows in-locale paths", () => assert.equal(safeNext("/en/join/K7MR2XQ9", "en"), "/en/join/K7MR2XQ9"));
  it("rejects other origins and tricks", () => {
    for (const bad of ["https://evil.test", "//evil.test", "/\evil.test", "/ar/today", "/en/../x", "/en/x?y=1", 42, null])
      assert.equal(safeNext(bad, "en"), null, String(bad));
  });
});

describe("dua keys", async () => {
  const { parseDuaKey, duaKey, ENCOURAGEMENT_DUAS } = await import("./content/hisn-shared");
  it("round-trips curated duas", () => {
    for (const d of ENCOURAGEMENT_DUAS) assert.deepEqual(parseDuaKey(duaKey(d)), d);
  });
  it("rejects anything not curated", () => {
    assert.equal(parseDuaKey("dua.hisn.1.1"), null);
    assert.equal(parseDuaKey("dua.custom.text"), null);
  });
});
