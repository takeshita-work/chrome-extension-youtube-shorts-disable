/* ポップアップ: 設定の読み込みと保存 */
(() => {
  "use strict";

  const DEFAULTS = { enabled: true, redirect: true };
  const enabledEl = document.getElementById("enabled");
  const redirectEl = document.getElementById("redirect");

  // リダイレクトは「無効化」が ON のときのみ意味を持つ
  function syncDisabledState() {
    redirectEl.disabled = !enabledEl.checked;
  }

  chrome.storage.sync.get(DEFAULTS, (s) => {
    enabledEl.checked = s.enabled;
    redirectEl.checked = s.redirect;
    syncDisabledState();
  });

  enabledEl.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: enabledEl.checked });
    syncDisabledState();
  });

  redirectEl.addEventListener("change", () => {
    chrome.storage.sync.set({ redirect: redirectEl.checked });
  });
})();
