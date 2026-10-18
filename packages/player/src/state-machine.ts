/**
 * State machine finita do player:
 *
 *   idle → playing ⇄ transitioning → completed
 *
 * Implementação via funções puras (sem lib externa) para manter o pacote leve.
 */

export type PlayerState = "idle" | "playing" | "transitioning" | "completed";

type Transition =
  | { from: "idle"; event: "START"; to: "playing" }
  | { from: "playing"; event: "ADVANCE"; to: "transitioning" }
  | { from: "transitioning"; event: "NEXT_LOADED"; to: "playing" }
  | { from: "playing"; event: "FINISH"; to: "completed" }
  | { from: "transitioning"; event: "FINISH"; to: "completed" };

type PlayerEvent = Transition["event"];
export type { PlayerEvent };

const transitions: Transition[] = [
  { from: "idle", event: "START", to: "playing" },
  { from: "playing", event: "ADVANCE", to: "transitioning" },
  { from: "transitioning", event: "NEXT_LOADED", to: "playing" },
  { from: "playing", event: "FINISH", to: "completed" },
  { from: "transitioning", event: "FINISH", to: "completed" },
];

export function createPlayerStateMachine() {
  let state: PlayerState = "idle";

  const dispatch = (event: PlayerEvent): PlayerState => {
    const next = transitions.find(
      (t) => t.from === state && t.event === event,
    );
    if (!next) return state;
    state = next.to;
    return state;
  };

  return {
    getState: () => state,
    dispatch,
  };
}