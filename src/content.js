/*
 * YouTube Shorts Disabler — content script
 * - Shorts 関連UIの非表示（<html> へのクラス付与で styles.css を適用）
 * - /shorts/<id> へのアクセスを /watch?v=<id> にリダイレクト
 * YouTube は SPA のため、初回ロードとページ内遷移の両方を処理する。
 */
(() => {
  "use strict";

  const HIDE_CLASS = "ysd-hide-shorts";
  const DEFAULTS = { enabled: true, redirect: true };

  let settings = { ...DEFAULTS };

  // --- UI 非表示の切り替え ---
  function applyHideClass() {
    const root = document.documentElement;
    if (!root) return;
    root.classList.toggle(HIDE_CLASS, settings.enabled);
  }

  // 起動直後はデフォルト（enabled=true）で先に隠し、ちらつきを抑える
  applyHideClass();

  // --- /shorts/... へのアクセスを YouTube トップにリダイレクト ---
  function maybeRedirect() {
    if (!settings.enabled || !settings.redirect) return;
    if (!/^\/shorts(\/|$)/.test(location.pathname)) return;
    location.replace(`${location.origin}/`);
  }

  // --- 設定の読み込みと監視 ---
  function loadSettings() {
    try {
      chrome.storage.sync.get(DEFAULTS, (stored) => {
        if (chrome.runtime.lastError) {
          settings = { ...DEFAULTS };
        } else {
          settings = { ...DEFAULTS, ...stored };
        }
        applyHideClass();
        maybeRedirect();
      });
    } catch (_e) {
      // storage が使えない場合はデフォルトで動作
      settings = { ...DEFAULTS };
      applyHideClass();
      maybeRedirect();
    }
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      if ("enabled" in changes) settings.enabled = changes.enabled.newValue;
      if ("redirect" in changes) settings.redirect = changes.redirect.newValue;
      applyHideClass();
      maybeRedirect();
    });
  } catch (_e) {
    /* noop */
  }

  loadSettings();

  // --- SPA 遷移への対応 ---
  // YouTube は遷移ごとに yt-navigate-finish を発火する
  document.addEventListener("yt-navigate-finish", () => {
    applyHideClass();
    maybeRedirect();
  });

  // 念のため history API もフック（早期リダイレクト用）
  const fireNav = () => {
    applyHideClass();
    maybeRedirect();
  };
  const origPush = history.pushState;
  history.pushState = function (...args) {
    const r = origPush.apply(this, args);
    fireNav();
    return r;
  };
  const origReplace = history.replaceState;
  history.replaceState = function (...args) {
    const r = origReplace.apply(this, args);
    fireNav();
    return r;
  };
  window.addEventListener("popstate", fireNav);
})();
