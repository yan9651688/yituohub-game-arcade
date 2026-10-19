/* Game presentation languages. World data, saves and controls retain their original values. */
(() => {
  'use strict';
  if (window.GameI18n) return;
  const config = window.ARCADE_GAME_LOCALE || {};
  const locales = ['zh-Hans', 'zh-Hant', 'en'];
  const storageKey = 'neon-arcade.locale';
  const canonical = value => String(value).replace(/\s+/g, ' ').trim();
  const cjk = /[\u3400-\u9fff]/;
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entries = new Map();
  for (const row of [...(config.entries || []), ...(config.fragments || [])]) {
    if (Array.isArray(row) && row.length >= 3 && row[0]) entries.set(canonical(row[0]), row);
  }
  const fragmentKeys = [...entries.keys()].filter(key => cjk.test(key)).sort((a, b) => b.length - a.length);
  const fragments = fragmentKeys.length ? new RegExp(fragmentKeys.map(escape).join('|'), 'g') : null;
  const patterns = (config.patterns || []).map(row => [new RegExp(row[0]), row[1], row[2]]);
  const cache = new Map();
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const excluded = 'script,style,noscript,code,pre,textarea,[data-no-game-i18n],[contenteditable="true"]';
  const translatableAttributes = ['title', 'aria-label', 'placeholder', 'alt', 'label'];
  const pending = new Set();
  let flushQueued = false, observer, picker;
  let parentWindow, parentAPI;
  try {
    if (window.parent !== window) {
      parentWindow = window.parent;
      parentAPI = parentWindow.SiteI18n || parentWindow.GameI18n;
    }
  } catch { /* Direct game links and isolated frames still support local languages. */ }

  function normalize(value) {
    const tag = String(value || '').replace(/_/g, '-').toLowerCase();
    if (/^en(?:-|$)/.test(tag)) return 'en';
    if (/^zh(?:-|$)/.test(tag)) return /(?:^|-)(hant|tw|hk|mo)(?:-|$)/.test(tag) ? 'zh-Hant' : 'zh-Hans';
    return null;
  }
  function saved() { try { return normalize(localStorage.getItem(storageKey)); } catch { return null; } }
  function resolve() {
    return normalize(parentAPI?.locale) || normalize(new URL(location.href).searchParams.get('lang')) || saved() || normalize(navigator.languages?.[0] || navigator.language) || 'en';
  }
  let locale = resolve();
  let languageIndex = locales.indexOf(locale);

  function replaceFragments(value) {
    return fragments && cjk.test(value) ? value.replace(fragments, key => entries.get(key)[languageIndex] ?? key) : value;
  }
  function translate(value) {
    const source = String(value);
    if (!languageIndex || !source.trim()) return source;
    if (cache.has(source)) return cache.get(source);
    const key = canonical(source), direct = entries.get(key);
    let translated = direct ? direct[languageIndex] : null;
    if (translated == null && cjk.test(key)) {
      for (const [pattern, hant, english] of patterns) {
        if (pattern.test(key)) {
          translated = replaceFragments(key.replace(pattern, languageIndex === 1 ? hant : english));
          break;
        }
      }
    }
    if (translated == null) translated = replaceFragments(key);
    const result = translated === key ? source : source.match(/^\s*/)[0] + translated + source.match(/\s*$/)[0];
    if (cache.size >= 2048) cache.clear();
    cache.set(source, result);
    return result;
  }
  function blocked(node) { return !!node.parentElement?.closest(excluded); }
  function translateText(node) {
    if (blocked(node)) return;
    let item = textSources.get(node);
    if (!item || node.data !== item.rendered) item = { source: node.data };
    item.rendered = translate(item.source);
    textSources.set(node, item);
    if (node.data !== item.rendered) node.data = item.rendered;
  }
  function translateAttributes(element) {
    if (element.closest(excluded)) return;
    let records = attributeSources.get(element);
    if (!records) { records = new Map(); attributeSources.set(element, records); }
    for (const name of translatableAttributes) {
      if (!element.hasAttribute(name)) continue;
      const value = element.getAttribute(name);
      let item = records.get(name);
      if (!item || value !== item.rendered) item = { source: value };
      item.rendered = translate(item.source);
      records.set(name, item);
      if (value !== item.rendered) element.setAttribute(name, item.rendered);
    }
  }
  function visit(root) {
    if (root.nodeType === Node.TEXT_NODE) { translateText(root); return; }
    if (![Node.ELEMENT_NODE, Node.DOCUMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(root.nodeType)) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (root.closest(excluded)) return;
      translateAttributes(root);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: node => blocked(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    while (walker.nextNode()) translateText(walker.currentNode);
    root.querySelectorAll?.('[title],[aria-label],[placeholder],[alt],[label]').forEach(translateAttributes);
  }
  function observe() {
    observer?.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: translatableAttributes });
  }
  function flush() {
    flushQueued = false;
    observer?.disconnect();
    const roots = [...pending]; pending.clear();
    for (const root of roots) if (root.isConnected) visit(root);
    observe();
  }
  function apply(root = document) {
    observer?.disconnect();
    visit(root);
    document.documentElement.lang = locale;
    if (picker) {
      picker.value = locale;
      picker.setAttribute('aria-label', ['游戏语言', '遊戲語言', 'Game language'][languageIndex]);
    }
    observe();
  }
  function setLocale(value, { propagate = true, persist = true } = {}) {
    const next = normalize(value);
    if (!next) return;
    const changed = next !== locale;
    locale = next; languageIndex = locales.indexOf(locale);
    if (persist) try { localStorage.setItem(storageKey, locale); } catch { /* Storage is optional. */ }
    if (propagate && parentAPI?.locale !== locale) parentAPI?.setLocale(locale);
    if (window.parent === window && location.protocol !== 'file:') {
      try { const url = new URL(location.href); url.searchParams.set('lang', locale); history.replaceState(history.state, '', url); } catch { /* Sandboxed documents may not update URLs. */ }
    }
    if (changed) cache.clear();
    apply();
    if (changed) window.dispatchEvent(new CustomEvent('game:languagechange', { detail: { locale } }));
  }
  window.GameI18n = Object.freeze({
    get locale() { return locale; },
    locales: Object.freeze(locales.slice()), t: translate, setLocale, apply, normalize
  });
  document.documentElement.lang = locale;

  // Games draw labels directly as well as through DOM overlays. Translate measurements
  // and drawing together so alignment follows the displayed copy, not its source length.
  for (const type of ['CanvasRenderingContext2D', 'OffscreenCanvasRenderingContext2D']) {
    const proto = window[type]?.prototype;
    if (!proto) continue;
    for (const method of ['fillText', 'strokeText', 'measureText']) {
      const original = proto[method];
      if (typeof original !== 'function') continue;
      proto[method] = function (text, ...args) { return original.call(this, translate(text), ...args); };
    }
  }
  for (const method of ['alert', 'confirm', 'prompt']) {
    const original = window[method];
    if (typeof original === 'function') window[method] = function (message, ...args) { return original.call(window, translate(message), ...args); };
  }
  function connectParent() {
    if (!parentAPI || !parentWindow) return;
    parentWindow.addEventListener('site:languagechange', onParentLanguage);
    parentWindow.addEventListener('game:languagechange', onParentLanguage);
  }
  function onParentLanguage(event) { setLocale(event.detail.locale, { propagate: false }); }
  connectParent();
  window.addEventListener('pagehide', () => {
    if (!parentWindow || !parentAPI) return;
    parentWindow.removeEventListener('site:languagechange', onParentLanguage);
    parentWindow.removeEventListener('game:languagechange', onParentLanguage);
  });
  window.addEventListener('pageshow', () => { connectParent(); if (parentAPI) setLocale(parentAPI.locale, { propagate: false }); });
  window.addEventListener('storage', event => {
    if (event.key === storageKey && normalize(event.newValue)) setLocale(event.newValue, { propagate: false, persist: false });
  });
  window.addEventListener('popstate', () => setLocale(resolve(), { propagate: false }));
  function ready() {
    apply();
    // The site's loader already provides a language selector. A standalone game gets
    // the same three choices without adding another overlay to its embedded controls.
    if (!parentAPI && !document.querySelector('[data-game-language]')) {
      const host = document.createElement('label');
      host.setAttribute('data-no-game-i18n', '');
      host.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483000;font:12px system-ui;color:#fff;background:#172331e8;border:1px solid #ffffff45;border-radius:8px;padding:5px;';
      picker = document.createElement('select'); picker.dataset.gameLanguage = '';
      picker.style.cssText = 'font:inherit;color:inherit;background:#172331;border:0;min-height:28px;max-width:110px;';
      locales.forEach((value, index) => { const option = document.createElement('option'); option.value = value; option.textContent = ['简体中文', '繁體中文', 'English'][index]; picker.appendChild(option); });
      picker.addEventListener('change', () => setLocale(picker.value)); host.appendChild(picker); document.body.appendChild(host);
      apply();
    }
    observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') {
          if (record.target.data !== textSources.get(record.target)?.rendered) pending.add(record.target);
        } else if (record.type === 'attributes') {
          if (record.target.getAttribute(record.attributeName) !== attributeSources.get(record.target)?.get(record.attributeName)?.rendered) pending.add(record.target);
        } else for (const node of record.addedNodes) if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) pending.add(node);
      }
      if (pending.size && !flushQueued) { flushQueued = true; queueMicrotask(flush); }
    });
    observe();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
