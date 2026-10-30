/**
 * Content script — overlay de captura + listener de cliques.
 *
 * Injeta um Shadow DOM com anel visual em cada elemento clicado.
 * Encaminha seleção para o service worker via chrome.runtime.sendMessage.
 */

import { maskSensitiveValue, shouldMask } from "../lib/mask";
import { getCSSPath } from "../lib/selectors";

type CapturePayload = {
  elementTag: string;
  elementSelector: string;
  elementText: string;
  boundingRect: { x: number; y: number; width: number; height: number };
  pageUrl: string;
  pageTitle: string;
  timestamp: number;
};

let overlayHost: HTMLDivElement | null = null;
let ring: HTMLDivElement | null = null;
let active = false;

function ensureOverlay(): void {
  if (overlayHost) return;
  overlayHost = document.createElement("div");
  overlayHost.id = "easydemo-capture-overlay";
  overlayHost.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
  document.documentElement.appendChild(overlayHost);
}

function ringElement(rect: DOMRect): void {
  ensureOverlay();
  if (!overlayHost) return;
  ring?.remove();
  ring = document.createElement("div");
  ring.style.cssText = `
    position:absolute;
    left:${rect.left}px;top:${rect.top}px;
    width:${rect.width}px;height:${rect.height}px;
    border:3px solid #2563eb;
    border-radius:6px;
    box-shadow:0 0 0 9999px rgba(37,99,235,0.08);
    transition:all 200ms ease;
  `;
  overlayHost.appendChild(ring);
}

function deactivate(): void {
  ring?.remove();
  ring = null;
  overlayHost?.remove();
  overlayHost = null;
  active = false;
  document.removeEventListener("click", onClick, true);
}

async function onClick(e: MouseEvent): Promise<void> {
  const target = e.target as HTMLElement | null;
  if (!target || target.closest("#easydemo-capture-overlay")) return;

  e.preventDefault();
  e.stopPropagation();

  const rect = target.getBoundingClientRect();
  ringElement(rect);

  // LGPD: mascara campos sensíveis antes de enviar
  const value = target instanceof HTMLInputElement ? target.value : (target.textContent ?? "");
  const maskedValue = shouldMask(target) ? maskSensitiveValue(value) : value;

  const payload: CapturePayload = {
    elementTag: target.tagName.toLowerCase(),
    elementSelector: getCSSPath(target),
    elementText: maskedValue.slice(0, 200),
    boundingRect: {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    pageUrl: location.href,
    pageTitle: document.title,
    timestamp: Date.now(),
  };

  await chrome.runtime.sendMessage({
    type: "CAPTURE_STEP",
    payload,
  });
}

function activate(): void {
  if (active) return;
  ensureOverlay();
  active = true;
  document.addEventListener("click", onClick, true);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "OVERLAY_START") activate();
  if (message?.type === "OVERLAY_STOP") deactivate();
  return false;
});
