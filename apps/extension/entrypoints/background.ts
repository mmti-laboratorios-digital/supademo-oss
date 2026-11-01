/**
 * Service Worker MV3 — orquestrador de captura.
 *
 * Top-level listeners:
 *   chrome.runtime.onInstalled     → inicializa storage
 *   chrome.runtime.onMessage       → content/popup ↔ SW
 *   chrome.action.onClicked        → toggle overlay
 *   chrome.tabs.onUpdated          → injeta content script
 */

import { defineBackground } from "wxt/sandbox";
import { captureAndStoreStep } from "../components/recorder";
import { uploadQueue } from "../components/uploader";
import { getSession, setSession } from "../lib/store";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async () => {
    const session = await getSession();
    if (!session) {
      await setSession({
        demoId: "",
        demoTitle: "",
        steps: [],
      });
    }
  });

  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id || tab.url?.startsWith("chrome://")) return;

    const session = await getSession();
    const capturing = !session?.capturing;
    await setSession({
      ...(session ?? { demoId: "", demoTitle: "", steps: [] }),
      capturing,
    });

    // toggle overlay na tab ativa
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      await chrome.tabs.sendMessage(tab.id, { type: capturing ? "OVERLAY_START" : "OVERLAY_STOP" });
    } catch (err) {
      console.warn("injection failed", err);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    void (async () => {
      switch (message?.type) {
        case "OVERLAY_STARTED":
          sendResponse({ ok: true });
          break;
        case "OVERLAY_STOPPED":
          sendResponse({ ok: true });
          break;

        case "SET_TOKEN": {
          const session = await getSession();
          await setSession({
            ...(session ?? { demoId: "", demoTitle: "", steps: [] }),
            token: message.token,
          });
          sendResponse({ ok: true });
          break;
        }

        case "CAPTURE_STEP": {
          const tabId = sender.tab?.id;
          if (!tabId) return sendResponse({ error: "NO_TAB" });
          const session = await getSession();
          const step = await captureAndStoreStep(tabId, message.payload, session?.token ?? null);
          sendResponse({ ok: true, step });
          break;
        }

        case "FINISH_AND_UPLOAD": {
          const session = await getSession();
          if (!session?.demoId) return sendResponse({ error: "NO_DEMO_ID" });
          const token = message.token ?? session.token ?? null;
          const result = await uploadQueue(session.demoId, session.steps, token);
          await setSession({
            demoId: session.demoId,
            demoTitle: session.demoTitle,
            steps: [],
          });
          sendResponse({ ok: true, uploaded: result.uploaded });
          break;
        }

        case "GET_STATUS": {
          const session = await getSession();
          sendResponse({ capturing: !!session?.capturing, steps: session?.steps.length ?? 0 });
          break;
        }

        default:
          sendResponse({ ok: true, ignored: true });
      }
    })();
    return true; // mantém o canal aberto para resposta assíncrona
  });
});
