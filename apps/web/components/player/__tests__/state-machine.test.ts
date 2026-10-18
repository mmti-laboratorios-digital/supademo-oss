/**
 * apps/web/components/player/__tests__/state-machine.test.ts
 *
 * Cobertura do reducer puro do DemoPlayer — sem React, sem DOM.
 */
import { describe, it, expect } from "vitest";
import {
  playerReducer,
  initialState,
  type PlayerAction,
} from "../state-machine";

const STEPS = ["step-1", "step-2", "step-3"];

function act(
  state: ReturnType<typeof playerReducer>,
  action: PlayerAction,
) {
  return playerReducer(state, action);
}

describe("DemoPlayer state machine — initial", () => {
  it("initialState é idle sem step selecionado", () => {
    expect(initialState.state).toBe("idle");
    expect(initialState.currentStepId).toBeNull();
    expect(initialState.currentIndex).toBe(0);
  });
});

describe("DemoPlayer state machine — transitions", () => {
  it("START vai para playing e seleciona primeiro step", () => {
    const next = act(initialState, { type: "START", stepIds: STEPS });
    expect(next.state).toBe("playing");
    expect(next.currentIndex).toBe(0);
    expect(next.currentStepId).toBe("step-1");
  });

  it("ADVANCE em playing avança para próximo step", () => {
    const started = act(initialState, { type: "START", stepIds: STEPS });
    const advanced = act(started, { type: "ADVANCE", stepIds: STEPS });
    expect(advanced.state).toBe("playing");
    expect(advanced.currentIndex).toBe(1);
    expect(advanced.currentStepId).toBe("step-2");
  });

  it("ADVANCE no último step vai para completed", () => {
    const started = act(initialState, { type: "START", stepIds: STEPS });
    let s = started;
    s = act(s, { type: "ADVANCE", stepIds: STEPS });
    s = act(s, { type: "ADVANCE", stepIds: STEPS });
    expect(s.state).toBe("playing");
    s = act(s, { type: "ADVANCE", stepIds: STEPS }); // overflow → completed
    expect(s.state).toBe("completed");
  });

  it("GO_BACK retorna para step anterior", () => {
    const started = act(initialState, { type: "START", stepIds: STEPS });
    const advanced = act(started, { type: "ADVANCE", stepIds: STEPS });
    const back = act(advanced, { type: "GO_BACK", stepIds: STEPS });
    expect(back.state).toBe("playing");
    expect(back.currentIndex).toBe(0);
    expect(back.currentStepId).toBe("step-1");
  });

  it("GO_BACK no início mantém em step-1 (não vaza para índice negativo)", () => {
    const started = act(initialState, { type: "START", stepIds: STEPS });
    const back = act(started, { type: "GO_BACK", stepIds: STEPS });
    expect(back.currentIndex).toBe(0);
    expect(back.currentStepId).toBe("step-1");
  });

  it("BRANCH_SELECTED vai para step da branch mantendo índice relativo", () => {
    const started = act(initialState, { type: "START", stepIds: STEPS });
    const branched = act(started, {
      type: "BRANCH_SELECTED",
      stepId: "step-bonus",
    });
    expect(branched.state).toBe("playing");
    expect(branched.currentStepId).toBe("step-bonus");
  });

  it("COMPLETE vai para completed", () => {
    const started = act(initialState, { type: "START", stepIds: STEPS });
    const done = act(started, { type: "COMPLETE" });
    expect(done.state).toBe("completed");
    expect(done.currentStepId).toBe("step-1");
  });

  it("RESTART volta para playing no primeiro step", () => {
    let s = act(initialState, { type: "START", stepIds: STEPS });
    s = act(s, { type: "ADVANCE", stepIds: STEPS });
    s = act(s, { type: "COMPLETE" });
    expect(s.state).toBe("completed");
    const restarted = act(s, { type: "RESTART", stepIds: STEPS });
    expect(restarted.state).toBe("playing");
    expect(restarted.currentIndex).toBe(0);
    expect(restarted.currentStepId).toBe("step-1");
  });
});

describe("DemoPlayer state machine — edge cases", () => {
  it("ADVANCE com stepIds vazio mantém state", () => {
    const started = act(initialState, { type: "START", stepIds: STEPS });
    const next = act(started, { type: "ADVANCE", stepIds: [] });
    expect(next).toEqual(started);
  });

  it("START com stepIds vazio não crasha", () => {
    const next = act(initialState, { type: "START", stepIds: [] });
    expect(next.state).toBe("playing");
    expect(next.currentStepId).toBeNull();
  });
});