/**
 * apps/web/lib/__tests__/analytics-funnel.test.ts
 *
 * Testes determinísticos do calculador de funil — pure function, sem DB.
 */
import { describe, it, expect } from "vitest";
import { computeFunnel, type FunnelEvent } from "../analytics/funnel";

const T0 = Date.parse("2024-01-01T00:00:00Z");

function mk(
  sessionId: string,
  type: FunnelEvent["type"],
  stepId: string | undefined,
  offsetMs: number,
): FunnelEvent {
  return { sessionId, type, stepId, ts: T0 + offsetMs };
}

describe("computeFunnel — happy path", () => {
  it("100% convert: 1 session vê 3 steps e completa", () => {
    const events: FunnelEvent[] = [
      mk("s1", "view", undefined, 0),
      mk("s1", "step_seen", "step-a", 100),
      mk("s1", "step_seen", "step-b", 200),
      mk("s1", "step_seen", "step-c", 300),
      mk("s1", "complete", undefined, 400),
    ];
    const result = computeFunnel(events);
    expect(result.totalSessions).toBe(1);
    expect(result.completers).toBe(1);
    expect(result.conversionRate).toBe(100);
    expect(result.steps).toHaveLength(4); // null (view) + 3 step_seen
    expect(result.steps[0].pct_continue).toBe(100);
    // Cada step subsequente tem pct_continue = 100% (mesmo session)
    for (let i = 1; i < result.steps.length; i++) {
      expect(result.steps[i].pct_continue).toBe(100);
    }
  });
});

describe("computeFunnel — pct_continue", () => {
  it("calcula corretamente: 10 sessions, 4 chegam em step-a, 2 em step-b", () => {
    const events: FunnelEvent[] = [];
    for (let i = 0; i < 10; i++) {
      events.push(mk(`s${i}`, "view", undefined, i * 1000));
    }
    // 4 sessions avançam para step-a
    for (let i = 0; i < 4; i++) {
      events.push(mk(`s${i}`, "step_seen", "step-a", i * 1000 + 50));
    }
    // 2 sessions avançam para step-b
    for (let i = 0; i < 2; i++) {
      events.push(mk(`s${i}`, "step_seen", "step-b", i * 1000 + 60));
    }
    const result = computeFunnel(events);
    expect(result.totalSessions).toBe(10);
    expect(result.steps[0].reach).toBe(10); // view
    expect(result.steps[1].reach).toBe(4); // step-a
    expect(result.steps[2].reach).toBe(2); // step-b
    expect(result.steps[1].pct_continue).toBe(40); // 4/10
    expect(result.steps[2].pct_continue).toBe(50); // 2/4
  });
});

describe("computeFunnel — edge cases", () => {
  it("lida com array vazio", () => {
    const result = computeFunnel([]);
    expect(result.totalSessions).toBe(0);
    expect(result.completers).toBe(0);
    expect(result.steps).toEqual([]);
    expect(result.conversionRate).toBe(0);
  });

  it("lida com múltiplas session_ids diferentes", () => {
    const events: FunnelEvent[] = [
      // session 1: 3 steps
      mk("s1", "view", undefined, 0),
      mk("s1", "step_seen", "a", 10),
      mk("s1", "step_seen", "b", 20),
      // session 2: só view (bounce)
      mk("s2", "view", undefined, 100),
      mk("s2", "bounce", undefined, 110),
      // session 3: view + complete (passou direto, sem step_seen)
      mk("s3", "view", undefined, 200),
      mk("s3", "complete", undefined, 210),
    ];
    const result = computeFunnel(events);
    expect(result.totalSessions).toBe(3);
    expect(result.completers).toBe(1);
    expect(result.conversionRate).toBeCloseTo(33.33, 1);
    expect(result.steps[0].reach).toBe(3); // todos viram
    expect(result.steps.find((s) => s.stepId === "a")?.reach).toBe(1);
    expect(result.steps.find((s) => s.stepId === "b")?.reach).toBe(1);
  });

  it("deduplica step_seen repetido na mesma session", () => {
    const events: FunnelEvent[] = [
      mk("s1", "view", undefined, 0),
      mk("s1", "step_seen", "a", 10),
      mk("s1", "step_seen", "a", 20), // dup
      mk("s1", "step_seen", "a", 30), // dup
    ];
    const result = computeFunnel(events);
    expect(result.steps.find((s) => s.stepId === "a")?.reach).toBe(1);
  });

  it("tolera eventos fora de ordem temporal", () => {
    const events: FunnelEvent[] = [
      mk("s1", "step_seen", "b", 200),
      mk("s1", "view", undefined, 0),
      mk("s1", "step_seen", "a", 100),
    ];
    const result = computeFunnel(events);
    // Após sort: view (null), step_a, step_b
    expect(result.steps[0].stepId).toBeNull();
    expect(result.steps[1].stepId).toBe("a");
    expect(result.steps[2].stepId).toBe("b");
  });
});