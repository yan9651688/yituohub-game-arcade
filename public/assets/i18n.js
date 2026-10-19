/* Site interface languages. Game documents keep their own language and state. */
(() => {
  'use strict';
  const storageKey = 'neon-arcade.locale';
  const locales = ['zh-Hans', 'zh-Hant', 'en'];
  const dictionaries = {
    'zh-Hans': { 'site.language': '网站语言' },
    'zh-Hant': { 'site.language': '網站語言' },
    en: { 'site.language': 'Site language' }
  };
  const script = document.currentScript;
  const siteBase = new URL('../', script ? script.src : new URL('assets/i18n.js', location.href));
  const shellPaths = new Set(['', 'index.html', 'games.html', 'classics.html', 'mv.html', 'play.html', 'classics-play.html', 'game-arcade/', 'game-arcade/index.html', 'game-arcade/film.html', 'game-arcade/afang-palace/', 'game-arcade/afang-palace/index.html'].map(path => new URL(path, siteBase).pathname));

  function normalize(value) {
    const tag = String(value || '').replace(/_/g, '-').toLowerCase();
    if (/^en(?:-|$)/.test(tag)) return 'en';
    if (/^zh(?:-|$)/.test(tag)) return /(?:^|-)hant(?:-|$)|(?:^|-)(tw|hk|mo)(?:-|$)/.test(tag) ? 'zh-Hant' : 'zh-Hans';
    return null;
  }
  function readSaved() { try { return normalize(localStorage.getItem(storageKey)); } catch { return null; } }
  function save(value) { try { localStorage.setItem(storageKey, value); } catch { /* URL still carries the choice in private/restricted contexts. */ } }
  function resolve() {
    const query = normalize(new URL(location.href).searchParams.get('lang'));
    if (query) return query;
    const saved = readSaved();
    if (saved) return saved;
    const languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    // The first browser preference wins; unsupported languages use English.
    return languages[0] ? normalize(languages[0]) || 'en' : 'zh-Hans';
  }
  let locale = resolve();
  let languageControlId = 0;
  document.documentElement.lang = locale;
  save(locale);

  function t(key, values = {}) {
    const message = dictionaries[locale]?.[key] ?? dictionaries['zh-Hans'][key] ?? key;
    return String(message).replace(/\{([\w]+)\}/g, (match, name) => Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
  }
  function href(value) {
    if (!value || value.startsWith('#')) return value;
    try {
      const url = new URL(value, document.baseURI);
      if (url.origin !== siteBase.origin || !shellPaths.has(url.pathname)) return value;
      url.searchParams.set('lang', locale);
      return url.href;
    } catch { return value; }
  }
  function nodes(root, selector) {
    return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
  }
  function apply(root = document) {
    nodes(root, '[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    nodes(root, '[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    ['aria-label', 'title', 'placeholder', 'content', 'data-text'].forEach(attribute => {
      nodes(root, '[data-i18n-' + attribute + ']').forEach(el => el.setAttribute(attribute, t(el.getAttribute('data-i18n-' + attribute))));
    });
    nodes(root, 'meta[property="og:locale"]').forEach(el => el.content = { 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', en: 'en_US' }[locale]);
    nodes(root, 'script[type="application/ld+json"]').forEach(el => {
      try {
        const data = JSON.parse(el.textContent);
        if (data['@type'] === 'WebSite') {
          data.inLanguage = locale;
          // Structured SEO copy is independent from the visual interface and
          // page title. Only explicitly localized schema fields are updated.
          const alternateNameKey = el.getAttribute('data-i18n-schema-alternate-name');
          const descriptionKey = el.getAttribute('data-i18n-schema-description');
          if (alternateNameKey) data.alternateName = t(alternateNameKey);
          if (descriptionKey) data.description = t(descriptionKey);
          el.textContent = JSON.stringify(data);
        }
      } catch { /* Unrelated structured data is not part of the interface dictionary. */ }
    });
    nodes(root, 'a[href]').forEach(el => {
      const before = el.getAttribute('href'), after = href(before);
      if (before !== after) el.setAttribute('href', after);
    });
    nodes(root, '[data-language-switcher]').forEach(host => {
      let select = host.querySelector('select[data-site-language]');
      if (!select) {
        host.classList.add('site-language');
        const label = document.createElement('label');
        label.className = 'site-language-label';
        label.lang = 'en';
        label.textContent = 'LANGUAGE';
        const field = document.createElement('div');
        field.className = 'site-language-field';
        const icon = document.createElement('span');
        icon.className = 'site-language-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '◎';
        select = document.createElement('select');
        select.id = 'site-language-' + (++languageControlId);
        label.htmlFor = select.id;
        select.dataset.siteLanguage = '';
        const labels = { 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', en: 'English' };
        locales.forEach(code => { const option = document.createElement('option'); option.value = code; option.textContent = labels[code]; option.lang = code; select.appendChild(option); });
        select.addEventListener('change', () => setLocale(select.value));
        field.append(icon, select);
        host.append(label, field);
      }
      select.value = locale;
      select.setAttribute('aria-label', 'LANGUAGE — ' + t('site.language'));
    });
  }
  function setLocale(value, options = {}) {
    const next = normalize(value);
    if (!next) return;
    const changed = next !== locale;
    locale = next;
    document.documentElement.lang = locale;
    if (options.persist !== false) save(locale);
    if (options.url !== false) {
      const url = new URL(location.href);
      url.searchParams.set('lang', locale);
      try { history.replaceState(history.state, '', url.href); } catch { /* Some embedded contexts do not permit history writes. */ }
    }
    apply();
    if (changed) window.dispatchEvent(new CustomEvent('site:languagechange', { detail: { locale } }));
  }
  window.SiteI18n = Object.freeze({
    get locale() { return locale; },
    locales: Object.freeze(locales.slice()),
    t, href, apply, setLocale,
    register(messages) {
      for (const code of locales) Object.assign(dictionaries[code], messages[code] || {});
      if (document.readyState !== 'loading') apply();
    },
    localizeGame(game) { return { ...game, ...(window.SITE_GAME_TRANSLATIONS?.[locale]?.[game.id] || {}) }; }
  });
  window.addEventListener('storage', event => {
    if (event.key === storageKey && normalize(event.newValue)) setLocale(event.newValue, { persist: false });
  });
  window.addEventListener('popstate', () => setLocale(resolve(), { url: false }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply(), { once: true });
  else apply();
})();
