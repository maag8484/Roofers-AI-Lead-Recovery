// Keep support chat available without downloading its framework on every visit.
// The existing n8n endpoint and support experience are unchanged.
export function initChatLauncher({ document = globalThis.document, loadChat = () => import("https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js") } = {}) {
  const launcher = document.getElementById("roof-ai-chat-launcher");
  const error = document.getElementById("roof-ai-chat-error");
  if (!launcher) return;
  let loading = false;
  let initialized = false;

  launcher.addEventListener("click", async () => {
    if (loading || initialized) return;
    loading = true;
    launcher.disabled = true;
    launcher.setAttribute("aria-busy", "true");
    if (error) error.hidden = true;
    let stylesheet = document.getElementById("roof-ai-chat-style");
    if (!stylesheet) {
      stylesheet = document.createElement("link");
      stylesheet.id = "roof-ai-chat-style";
      stylesheet.rel = "stylesheet";
      stylesheet.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
      document.head.appendChild(stylesheet);
    }
    let observer;
    let timeout;
    const finishLoading = () => {
      loading = false;
      launcher.disabled = false;
      launcher.removeAttribute("aria-busy");
    };
    try {
      const { createChat } = await loadChat();
      // Watch before mounting: the widget may create its native toggle asynchronously.
      const open = () => {
        if (initialized) return true;
        const toggle = document.querySelector(".chat-window-toggle");
        if (!toggle) return false;
        observer?.disconnect();
        clearTimeout(timeout);
        initialized = true;
        launcher.hidden = true;
        finishLoading();
        toggle.click();
        return true;
      };
      observer = new document.defaultView.MutationObserver(() => { open(); });
      observer.observe(document.body, { childList: true, subtree: true });
      createChat({
        webhookUrl: "https://n8n.srv1670750.hstgr.cloud/webhook/c29e3aaa-f1d8-4ae7-8e3f-70cada798b9d/chat",
        mode: "window",
        showWelcomeScreen: true,
        defaultLanguage: "en",
        initialMessages: ["Hi! 👋 I'm the Roof AI assistant.", "How can I help you today?"],
        i18n: { en: { title: "Roof AI Support", subtitle: "We typically reply in seconds.", footer: "", getStarted: "Start Chat", inputPlaceholder: "Type your message..." } },
      });
      if (!open()) {
        timeout = setTimeout(() => {
          observer.disconnect();
          if (!initialized) {
            finishLoading();
            if (error) error.hidden = false;
          }
        }, 10000);
      }
    } catch {
      observer?.disconnect();
      clearTimeout(timeout);
      finishLoading();
      if (error) error.hidden = false;
    }
  });
}

if (typeof document !== "undefined") initChatLauncher();
