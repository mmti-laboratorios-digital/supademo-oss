/**
 * apps/web/components/player/state-machine.ts
 *
 * State machine do DemoPlayer — extraída como pure reducer para testabilidade.
 * Componente DemoPlayer.tsx delega a este reducer via useReducer.
 */

export type PlayerState = "idle" | "playing" | "transitioning" | "completed";

export type PlayerAction =
  | { type: "START"; stepIds: string[] }
  | { type: "TRANSITION" }
  | { type: "ADVANCE"; stepIds: string[]; nextId?: string }
  | { type: "GO_BACK"; stepIds: string[] }
  | { type: "BRANCH_SELECTED"; stepId: string }
  | { type: "COMPLETE" }
  | { type: "RESTART"; stepIds: string[] }
  | { type: "RESET" };

export type PlayerStateData = {
  state: PlayerState;
  currentStepId: string | null;
  currentIndex: number;
};

export const initialState: PlayerStateData = {
  state: "idle",
  currentStepId: null,
  currentIndex: 0,
};

/**
 * Reducer puro. NÃO mexe com React, side-effects, eventos — apenas transição.
 *
 * Retorna novo state. Se stepIds vazio, mantém currentStepId.
 */
export function playerReducer(state: PlayerStateData, action: PlayerAction): PlayerStateData {
  switch (action.type) {
    case "START":
      return {
        state: "playing",
        currentIndex: 0,
        currentStepId: action.stepIds?.[0] ?? null,
      };

    // Estado transitório do fade entre steps. Não muda índice nem step —
    // só sinaliza que o componente deve aplicar a transição visual antes
    // do próximo ADVANCE.
    case "TRANSITION":
      if (state.state !== "playing") return state;
      return { ...state, state: "transitioning" };

    // Volta para a tela de início (usado pelo atalho Esc do teclado).
    case "RESET":
      return initialState;

    case "ADVANCE": {
      const stepIds = action.stepIds;
      if (stepIds.length === 0) {
        return state;
      }
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= stepIds.length) {
        return {
          state: "completed",
          currentIndex: stepIds.length - 1,
          currentStepId: stepIds[stepIds.length - 1] ?? null,
        };
      }
      return {
        state: "playing",
        currentIndex: nextIndex,
        currentStepId: stepIds[nextIndex] ?? null,
      };
    }

    case "GO_BACK": {
      const stepIds = action.stepIds;
      if (stepIds.length === 0) return state;
      const prevIndex = Math.max(0, state.currentIndex - 1);
      return {
        state: "playing",
        currentIndex: prevIndex,
        currentStepId: stepIds[prevIndex] ?? null,
      };
    }

    case "BRANCH_SELECTED":
      return {
        state: "playing",
        currentIndex: state.currentIndex, // mantém
        currentStepId: action.stepId,
      };

    case "COMPLETE":
      return {
        state: "completed",
        currentIndex: state.currentIndex,
        currentStepId: state.currentStepId,
      };

    case "RESTART":
      return {
        state: "playing",
        currentIndex: 0,
        currentStepId: action.stepIds?.[0] ?? null,
      };

    default:
      return state;
  }
}

/**
 * Helper para tipo narrowing de action payload (sem usar React types).
 */
export function isPlayerAction(value: unknown): value is PlayerAction {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { type?: unknown }).type === "string";
}
