/**
 * Popup UI — start/stop, lista de steps capturados, link para upload.
 */

import { fetchClerkSessionToken, getApi } from "../../lib/api";
import { getSession, setSession } from "../../lib/store";

async function getAuthenticatedApi() {
  const token = await fetchClerkSessionToken();
  // Propaga o token para o service worker assim que o popup abre.
  if (token) {
    try {
      await chrome.runtime.sendMessage({ type: "SET_TOKEN", token });
    } catch {
      // SW pode estar dormindo — ignore; o upload envia o token novamente.
    }
  }
  return { api: getApi(undefined, token), token };
}

const apiPromise = getAuthenticatedApi();

const els = {
  toggle: document.getElementById("toggle") as HTMLButtonElement | null,
  upload: document.getElementById("upload") as HTMLButtonElement | null,
  count: document.getElementById("count") as HTMLSpanElement | null,
  steps: document.getElementById("steps") as HTMLUListElement | null,
  auth: document.getElementById("auth") as HTMLSpanElement | null,
  settings: document.getElementById("settings") as HTMLAnchorElement | null,
};

if (!els.toggle || !els.upload || !els.count || !els.steps || !els.auth) {
  throw new Error("popup elements missing");
}

async function refresh(): Promise<void> {
  const session = await getSession();
  const capturing = !!session?.capturing;
  const stepCount = session?.steps.length ?? 0;

  els.toggle!.textContent = capturing ? "Parar captura" : "Iniciar captura";
  els.toggle!.classList.toggle("btn-danger", capturing);
  els.toggle!.classList.toggle("btn-primary", !capturing);
  els.count!.textContent = String(stepCount);
  els.upload!.disabled = stepCount === 0;
  els.steps!.innerHTML = (session?.steps ?? [])
    .map(
      (s, i) =>
        `<li>${i + 1}. ${escapeHtml(s.elementTag)} — ${escapeHtml(s.pageTitle.slice(0, 40))}</li>`,
    )
    .join("");

  // Auth status via /api/v1/me
  try {
    const { api } = await apiPromise;
    const me = await api.getMe();
    els.auth!.textContent = me?.workspaceName
      ? `Workspace: ${me.workspaceName}`
      : "Não autenticado (abra o app EasyDemo numa aba)";
  } catch {
    els.auth!.textContent = "Não autenticado";
  }
}

els.toggle.addEventListener("click", async () => {
  const { api } = await apiPromise;
  const session = await getSession();
  const capturing = !!session?.capturing;

  if (!capturing) {
    // Iniciar nova captura: pedir demoId (em produção, popup separado)
    const demoId = prompt("ID da demo (deixe vazio para criar uma nova):") ?? "";
    if (!demoId) {
      const created = await api.createDemo({
        title: `Demo ${new Date().toISOString().slice(0, 10)}`,
      });
      if (!created) return;
      await setSession({
        capturing: true,
        demoId: created.id,
        demoTitle: created.title,
        steps: [],
        startedAt: Date.now(),
      });
    } else {
      await setSession({
        capturing: true,
        demoId,
        demoTitle: "",
        steps: [],
        startedAt: Date.now(),
      });
    }
  } else {
    // Parar
    await setSession({ ...session!, capturing: false });
  }

  // Toggle overlay
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;
  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: (await getSession())?.capturing ? "OVERLAY_START" : "OVERLAY_STOP",
      });
    } catch {
      // tab pode não ter content script carregado — ignore
    }
  }
  await refresh();
});

els.upload.addEventListener("click", async () => {
  const { api } = await apiPromise;
  const session = await getSession();
  if (!session?.demoId) return;
  els.upload!.disabled = true;
  els.upload!.textContent = "Enviando…";
  const result = await chrome.runtime.sendMessage({
    type: "FINISH_AND_UPLOAD",
    token: api.token,
  });
  if (result?.uploaded != null) {
    const url = `${api.baseUrl.replace(/\/api\/.*$/, "")}/demos/${session.demoId}/edit`;
    chrome.tabs.create({ url });
  } else {
    els.upload!.textContent = "Falhou — tente novamente";
  }
});

els.settings?.addEventListener("click", (e) => {
  e.preventDefault();
  const url = chrome.runtime.getURL("options.html");
  chrome.tabs.create({ url });
});

refresh();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
