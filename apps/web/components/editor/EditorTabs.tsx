"use client";

import type { ReactElement } from "react";
import { BranchingEditor } from "./BranchingEditor";
import { CtaEditor } from "./CtaEditor";
import { LeadFormEditor } from "./LeadFormEditor";
import { PublishPanel } from "./PublishPanel";
import { ThemeEditor } from "./ThemeEditor";
import { VariablesEditor } from "./VariablesEditor";

/**
 * Editor tabs são switches entre os sub-editors existentes (Theme, LeadForm,
 * CTA, Variables, Branching, Publish). O painel Steps continua renderizado
 * pelo DemoEditor pai porque tem o canvas + sidebar de steps embutidos.
 *
 * Este componente existe para reduzir o switch/case que estava no
 * DemoEditor.tsx monolítico (860 LOC) e isola as tabs dos passos para
 * futuro lazy-load via React.lazy / next/dynamic.
 */

export type EditorTab =
  | "steps"
  | "theme"
  | "leadForm"
  | "cta"
  | "variables"
  | "branching"
  | "publish";

/**
 * Interface mínima que cada sub-editor precisa.
 * Os sub-editors têm props variadas; este shim aceita um tipo genérico.
 */
export interface EditorTabsProps<T = unknown> {
  current: EditorTab;
  demo: T;
  onChange: (demo: T) => void;
}

export function EditorTabs<T = unknown>(props: EditorTabsProps<T>): ReactElement | null {
  const { current, demo, onChange } = props;
  // cast para `unknown` porque cada sub-editor tem props mais específicas
  // mas a estrutura externa é compartilhada.
  const ctx = { demo, onChange };

  switch (current) {
    case "theme":
      return <ThemeEditor {...(ctx as unknown as Parameters<typeof ThemeEditor>[0])} />;
    case "leadForm":
      return <LeadFormEditor {...(ctx as unknown as Parameters<typeof LeadFormEditor>[0])} />;
    case "cta":
      return <CtaEditor {...(ctx as unknown as Parameters<typeof CtaEditor>[0])} />;
    case "variables":
      return <VariablesEditor {...(ctx as unknown as Parameters<typeof VariablesEditor>[0])} />;
    case "branching":
      return <BranchingEditor {...(ctx as unknown as Parameters<typeof BranchingEditor>[0])} />;
    case "publish":
      return <PublishPanel {...(ctx as unknown as Parameters<typeof PublishPanel>[0])} />;
    case "steps":
    default:
      // Passos renderizados diretamente pelo DemoEditor pai
      // (Canvas + Sidebar de steps ocupam mais espaço).
      return null;
  }
}
