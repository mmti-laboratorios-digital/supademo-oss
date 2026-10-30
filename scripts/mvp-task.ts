import { readFileSync, writeFileSync } from "node:fs";
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
  gates: string[];
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
  purpose: string;
  status_values: Record<string, string>;
  current: { phase: string; step: string | null; status: StepStatus };
  phases: Phase[];
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TASKS_PATH = resolve(ROOT, "specs/mvp-tasks.json");

const VALID: StepStatus[] = ["pending", "in_progress", "done", "blocked"];

function usage(): never {
  console.error(`
Uso:
  pnpm scripts:mvp-task <PASSO> <STATUS> "<nota>" [--commit <sha>] [--date AAAA-MM-DD]

  PASSO   id do passo, ex.: F3.2  (ou o número: 3.2)
  STATUS  pending | in_progress | done | blocked
  nota    uma frase com o que foi feito (obrigatória para done e blocked)

Exemplos:
  pnpm scripts:mvp-task F3.2 done "LeadForm valida consentimento e grava em app.leads"
  pnpm scripts:mvp-task F8.1 blocked "DPO ainda não contratado — quem resolve: jurídico"
`);
  process.exit(2);
}

function load(): Tasks {
  return JSON.parse(readFileSync(TASKS_PATH, "utf-8")) as Tasks;
}

/** Colapsa os objetos de passo em uma linha, mantendo o arquivo legível. */
function collapse(text: string, expected: number): string {
  const pattern =
    /\{\s*"n": (\d+),\s*"id": "([^"]*)",\s*"title": ("(?:[^"\\]|\\.)*"),\s*"status": "([^"]*)",\s*"done_at": (null|"[^"]*"),\s*"commit": (null|"[^"]*"),\s*"note": (null|"(?:[^"\\]|\\.)*")\s*\}/g;
  let count = 0;
  const out = text.replace(pattern, (_m, n, id, title, status, at, commit, note) => {
    count++;
    return `{ "n": ${n}, "id": ${JSON.stringify(id)}, "title": ${title}, "status": ${JSON.stringify(status)}, "done_at": ${at}, "commit": ${commit}, "note": ${note} }`;
  });
  if (count !== expected) {
    throw new Error(`serialize: ${count} passos colapsados de ${expected} esperados — abortando`);
  }
  return out;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();

  const target = args[0];
  const status = args[1] as StepStatus;
  if (!VALID.includes(status)) usage();

  let note = "";
  let commit: string | null = null;
  let date: string | null = null;
  for (let i = 2; i < args.length; i++) {
    const a = args[i];
    if (a === "--commit") {
      commit = args[++i] ?? null;
    } else if (a === "--date") {
      date = args[++i] ?? null;
    } else if (!note) {
      note = a;
    }
  }
  note = note.replace(/^["']|["']$/g, "");

  if ((status === "done" || status === "blocked") && !note.trim()) {
    console.error(
      "Erro: 'done' e 'blocked' exigem uma nota (o que foi feito / o que falta e quem resolve).",
    );
    process.exit(2);
  }

  const tasks = load();
  const allSteps = tasks.phases.flatMap((p) => p.steps);
  const step =
    allSteps.find((s) => s.id === target) ??
    allSteps.find((s) => `${s.id.split(".")[0]}.${s.n}` === target);
  if (!step) {
    console.error(`Passo "${target}" não existe. Rode: pnpm scripts:mvp-status`);
    process.exit(1);
  }

  const phase = tasks.phases.find((p) => p.steps.some((s) => s.id === step.id));
  if (!phase) {
    console.error(`Fase do passo ${step.id} não encontrada.`);
    process.exit(1);
  }

  step.status = status;
  step.note = note.trim() || null;
  if (status === "done") {
    step.done_at = date ?? new Date().toISOString().slice(0, 10);
    step.commit = commit ?? step.commit;
  } else if (status === "blocked") {
    step.done_at = date ?? new Date().toISOString().slice(0, 10);
  }

  // status da fase
  const allDone = phase.steps.every((s) => s.status === "done");
  const anyBlocked = phase.steps.some((s) => s.status === "blocked");
  phase.status = allDone ? "done" : anyBlocked ? "in_progress" : "in_progress";

  // próxima fase a fazer
  const nextPhase = tasks.phases.find(
    (p) =>
      p.status !== "done" &&
      p.depends_on.every((d) => tasks.phases.find((x) => x.id === d)?.status === "done"),
  );
  if (nextPhase) {
    tasks.current = {
      phase: nextPhase.id,
      step:
        nextPhase.steps.find((s) => s.status === "pending" || s.status === "in_progress")?.id ??
        null,
      status: nextPhase.status,
    };
  }

  tasks.updated_at = new Date().toISOString().slice(0, 10);

  const total = allSteps.length;
  const done = allSteps.filter((s) => s.status === "done").length;
  const serialized = collapse(JSON.stringify(tasks, null, 2), total);
  writeFileSync(TASKS_PATH, `${serialized}\n`, "utf-8");

  console.log(`✓ ${step.id} → ${status}`);
  if (step.note) console.log(`  nota: ${step.note}`);
  console.log(
    `  fase ${phase.id}: ${phase.steps.filter((s) => s.status === "done").length}/${phase.steps.length} passos`,
  );
  console.log(`  total: ${done}/${total}`);
  const next = tasks.current;
  console.log(`  agora: fase ${next.phase}${next.step ? ` · próximo passo ${next.step}` : ""}`);
}

main();
