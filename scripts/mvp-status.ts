import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type StepStatus = "pending" | "in_progress" | "done" | "blocked";

interface Step {
  n: number;
  id: string;
  title: string;
  status: StepStatus;
  done_at: string | null;
  commit: string | null;
  note: string | null;
}

interface Phase {
  id: string;
  name: string;
  gate: string;
  branch: string;
  depends_on: string[];
  status: StepStatus;
  steps: Step[];
}

interface Tasks {
  schema_version: number;
  updated_at: string;
  plan: string;
  progress_log: string;
  scope: string;
  current: { phase: string; step: string | null; status: StepStatus };
  phases: Phase[];
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TASKS_PATH = resolve(ROOT, "specs/mvp-tasks.json");

const MARK: Record<StepStatus, string> = {
  pending: "·",
  in_progress: ">",
  done: "✓",
  blocked: "!",
};

const TONE: Record<StepStatus, string> = {
  pending: "\x1b[90m",
  in_progress: "\x1b[33m",
  done: "\x1b[32m",
  blocked: "\x1b[31m",
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function load(): Tasks {
  return JSON.parse(readFileSync(TASKS_PATH, "utf-8")) as Tasks;
}

function isPhaseUnblocked(phase: Phase, byId: Map<string, Phase>): boolean {
  return phase.depends_on.every((dep) => byId.get(dep)?.status === "done");
}

function printPhase(phase: Phase, verbose: boolean): void {
  console.log(
    `${BOLD}${phase.id}${RESET} — ${phase.name}  ${TONE[phase.status]}[${phase.status}]${RESET}  gate ${phase.gate}  branch ${phase.branch}`,
  );
  for (const step of phase.steps) {
    if (!verbose && step.status === "pending") continue;
    const line = `  ${TONE[step.status]}${MARK[step.status]}${RESET} ${step.id}  ${step.title}`;
    console.log(line);
    if (step.note) console.log(`      nota: ${step.note}`);
    if (step.commit) console.log(`      commit: ${step.commit}`);
  }
}

function main(): void {
  const tasks = load();
  const byId = new Map(tasks.phases.map((p) => [p.id, p]));
  const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");

  const done = tasks.phases.flatMap((p) => p.steps).filter((s) => s.status === "done").length;
  const total = tasks.phases.flatMap((p) => p.steps).length;
  const blocked = tasks.phases.flatMap((p) => p.steps).filter((s) => s.status === "blocked").length;

  console.log("");
  console.log(`${BOLD}EasyDemo — onde o MVP parou${RESET}`);
  console.log(
    `checklist: ${done}/${total} passos concluídos${blocked ? `, ${blocked} bloqueados` : ""}`,
  );
  console.log(`atualizado em: ${tasks.updated_at}`);
  console.log("");

  const current = byId.get(tasks.current.phase);
  if (!current) {
    console.log(`Fase atual "${tasks.current.phase}" não existe no checklist.`);
    process.exitCode = 1;
    return;
  }

  if (!isPhaseUnblocked(current, byId)) {
    const waiting = current.depends_on.filter((d) => byId.get(d)?.status !== "done");
    console.log(
      `${TONE.blocked}Fase ${current.id} BLOQUEADA${RESET} — depende de: ${waiting.join(", ")}`,
    );
    console.log("");
  }

  console.log(`${BOLD}FASE EM ANDAMENTO${RESET}`);
  printPhase(current, verbose);

  const next = current.steps.find((s) => s.status !== "done");
  if (next) {
    console.log("");
    console.log(`${BOLD}PRÓXIMO PASSO${RESET}`);
    console.log(`  ${next.id} — ${next.title}`);
    console.log("");
    console.log("  referência: docs/MVP-PLAN.md §8 (a fase) e §6 (invariantes)");
    console.log("  ao terminar: marque o passo em specs/mvp-tasks.json e siga o passo seguinte");
  } else {
    const nextPhase = tasks.phases.find((p) => p.status !== "done" && isPhaseUnblocked(p, byId));
    if (nextPhase) {
      console.log("");
      console.log(`${BOLD}FASE CONCLUÍDA — próxima é ${nextPhase.id}${RESET} (${nextPhase.name})`);
      console.log(`  branch: ${nextPhase.branch}   gate: ${nextPhase.gate}`);
    } else {
      console.log("");
      console.log(`${TONE.done}TODAS AS FASES CONCLUÍDAS${RESET}`);
    }
  }

  console.log("");
  console.log(`${BOLD}VISÃO DAS 12 FASES${RESET}`);
  for (const phase of tasks.phases) {
    const d = phase.steps.filter((s) => s.status === "done").length;
    const b = phase.steps.filter((s) => s.status === "blocked").length;
    const suffix = b ? ` (${b} bloqueado${b > 1 ? "s" : ""})` : "";
    console.log(
      `  ${TONE[phase.status]}${MARK[phase.status]}${RESET} ${phase.id.padEnd(4)} ${String(d).padStart(2)}/${phase.steps.length} passos  ${phase.gate.padEnd(8)}${suffix}`,
    );
  }
  console.log("");
  console.log("  docs do plano:      docs/MVP-PLAN.md");
  console.log("  log de execução:    docs/MVP-PROGRESS.md");
  console.log("  escopo/pricing:     specs/mvp-scope.json");
  console.log("");
}

main();
