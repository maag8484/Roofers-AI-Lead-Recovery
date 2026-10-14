import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { initChatLauncher } from "../public/chat-loader.js";

function fixture(loadChat) {
  const dom = new JSDOM('<button id="roof-ai-chat-launcher">Chat</button><p id="roof-ai-chat-error" hidden>Error</p>', { url: "https://example.test" });
  initChatLauncher({ document: dom.window.document, loadChat });
  return dom;
}

test("support chat downloads nothing before a visitor opens it and mounts once", async () => {
  let downloads = 0;
  let mounts = 0;
  let opens = 0;
  let finish;
  let configuration;
  const dom = fixture(() => { downloads++; return new Promise((resolve) => { finish = resolve; }); });
  const { document } = dom.window;
  const launcher = document.getElementById("roof-ai-chat-launcher");
  assert.equal(downloads, 0);
  assert.equal(document.querySelector('link[rel="stylesheet"]'), null);
  launcher.click();
  launcher.click();
  assert.equal(downloads, 1);
  assert.equal(launcher.disabled, true);
  finish({ createChat: (options) => {
    mounts++;
    configuration = options;
    const toggle = document.createElement("button");
    toggle.className = "chat-window-toggle";
    toggle.onclick = () => { opens++; };
    document.body.appendChild(toggle);
  } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(mounts, 1);
  assert.equal(opens, 1);
  assert.equal(launcher.hidden, true);
  assert.equal(configuration.mode, "window");
  assert.equal(configuration.showWelcomeScreen, true);
  assert.equal(document.querySelectorAll('link[rel="stylesheet"]').length, 1);
  dom.window.close();
});

test("a blocked support download provides feedback and can be retried", async () => {
  let downloads = 0;
  const dom = fixture(async () => { downloads++; throw new Error("Offline"); });
  const { document } = dom.window;
  const launcher = document.getElementById("roof-ai-chat-launcher");
  launcher.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(document.getElementById("roof-ai-chat-error").hidden, false);
  assert.equal(launcher.disabled, false);
  launcher.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(downloads, 2);
  assert.equal(document.querySelectorAll('link[rel="stylesheet"]').length, 1);
  dom.window.close();
});
