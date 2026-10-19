/* The game shares the site's locale and retains the current play session. */
(() => {
  const mount = () => {
    const host = document.createElement('label');
    host.className = 'garden-language'; host.setAttribute('data-no-game-i18n', '');
    host.innerHTML = '<strong>LANGUAGE</strong><select data-game-language aria-label="Language"><option value="zh-Hans">简体中文</option><option value="zh-Hant">繁體中文</option><option value="en">English</option></select>';
    const select = host.querySelector('select');
    select.value = window.GameI18n.locale;
    select.addEventListener('change', () => window.GameI18n.setLocale(select.value));
    window.addEventListener('game:languagechange', () => { select.value = window.GameI18n.locale; });
    document.querySelector('.page-footer').appendChild(host);
  };
  // Defer executes before DOMContentLoaded, so the shared runtime sees this control.
  mount();
})();
