/*
 * background service worker
 * 有効/無効の状態に応じてツールバーアイコンと説明を切り替える。
 *   enabled = true  -> 赤ロゴ + 斜線（ブロック中）
 *   enabled = false -> 赤ロゴのみ（無効）
 */
"use strict";

const ICON_ON = {
  16: "icons/icon16.png",
  48: "icons/icon48.png",
  128: "icons/icon128.png",
};
const ICON_OFF = {
  16: "icons/icon_off16.png",
  48: "icons/icon_off48.png",
  128: "icons/icon_off128.png",
};

function updateIcon(enabled) {
  chrome.action.setIcon({ path: enabled ? ICON_ON : ICON_OFF });
  chrome.action.setTitle({
    title: enabled
      ? "YouTube Shorts Disabler: 有効（ショートを非表示中）"
      : "YouTube Shorts Disabler: 無効",
  });
}

function refresh() {
  chrome.storage.sync.get({ enabled: true }, (s) => {
    updateIcon(s.enabled);
  });
}

chrome.runtime.onInstalled.addListener(refresh);
chrome.runtime.onStartup.addListener(refresh);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && "enabled" in changes) {
    updateIcon(changes.enabled.newValue);
  }
});

// サービスワーカー起動時にも反映
refresh();
