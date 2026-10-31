(() => {
  'use strict';
  const i18n = window.SiteI18n;
  const game = window.ARCADE_GAMES.find(item => item.id === document.body.dataset.gameInfo);
  if (!game) return;
  function refresh() {
    const local = i18n.localizeGame(game);
    const url = new URL(game.detailsPath, 'https://game.yituohub.com/');
    if (i18n.locale !== 'zh-Hans') url.searchParams.set('lang', i18n.locale);
    const launch = new URL('play.html', 'https://game.yituohub.com/');
    launch.searchParams.set('game', game.id);
    if (i18n.locale !== 'zh-Hans') launch.searchParams.set('lang', i18n.locale);
    const title = i18n.t('info.pageTitle', { title: local.title });
    document.title = title;
    document.querySelector('link[rel="canonical"]').href = url.href;
    for (const selector of ['meta[property="og:title"]','meta[name="twitter:title"]']) document.querySelector(selector).content = title;
    document.querySelector('meta[property="og:url"]').content = url.href;
    document.querySelector('meta[property="og:locale"]').content = { 'zh-Hans':'zh_CN','zh-Hant':'zh_TW',en:'en_US' }[i18n.locale];
    const play = document.getElementById('game-info-play');
    play.href = i18n.href('../play.html?game=' + encodeURIComponent(game.id));
    play.setAttribute('aria-label', i18n.t('lib.playAria', { title: local.title }));
    play.title = i18n.t('lib.newTab');
    document.querySelector('.game-info-art img').alt = i18n.t('info.coverAlt', { title: local.title });
    const schema = document.getElementById('game-info-schema');
    const data = JSON.parse(schema.textContent);
    const entry = data['@graph'].find(item => item['@type'] === 'VideoGame');
    Object.assign(entry, { '@id': url.href + '#game', name: local.title, alternateName: local.en, description: i18n.t('info.' + game.id + '.meta'), genre: [local.category, ...local.tags], url: url.href });
    entry.potentialAction.target = launch.href;
    const crumbs = data['@graph'].find(item => item['@type'] === 'BreadcrumbList');
    crumbs.itemListElement.forEach((crumb,index) => {
      const destination = new URL(index === 0 ? '' : index === 1 ? 'games.html' : game.detailsPath, 'https://game.yituohub.com/');
      if (i18n.locale !== 'zh-Hans') destination.searchParams.set('lang', i18n.locale);
      crumb.item = destination.href;
      crumb.name = index === 0 ? i18n.t('catalog.home') : index === 1 ? i18n.t('catalog.library') : local.title;
    });
    schema.textContent = JSON.stringify(data);
  }
  window.addEventListener('site:languagechange', refresh);
  i18n.apply();
  refresh();
})();
