(() => {
  'use strict';
  const rows = [
    ['workshop.title', '共创工坊 · NEON ARCADE', '共創工坊 · NEON ARCADE', 'Creator Workshop · NEON ARCADE'],
    ['workshop.description', 'NEON ARCADE 共创工坊，收录不同创作者的小游戏，展示作品与作者，发现更多有趣的游戏。', 'NEON ARCADE 共創工坊，收錄不同創作者的小遊戲，展示作品與作者，發現更多有趣的遊戲。', 'Discover games from independent creators in the NEON ARCADE Creator Workshop, with every game credited to its author.'],
    ['workshop.heading', '共创<em>工坊。</em>', '共創<em>工坊。</em>', 'Creator <em>Workshop.</em>'],
    ['workshop.intro', '来自不同创作者的小游戏，在这里相遇。发现作品，也认识作品背后的人。', '來自不同創作者的小遊戲，在這裡相遇。發現作品，也認識作品背後的人。', 'Games from different creators, together in one place. Discover their work and the people behind it.'],
    ['workshop.author', '作者', '作者', 'By'],
    ['workshop.list', 'NEON ARCADE 共创工坊作品', 'NEON ARCADE 共創工坊作品', 'NEON ARCADE community games'],
    ['workshop.waitingTitle', '作品即将入驻', '作品即將入駐', 'New creations are on the way'],
    ['workshop.waitingDescription', '这里将收录其他创作者的游戏，每部作品都会展示作者名。期待下一份有趣的创作。', '這裡將收錄其他創作者的遊戲，每部作品都會展示作者名。期待下一份有趣的創作。', 'This space will feature games by other creators, with an author credit on every game. Check back for the first arrival.'],
    ['workshop.explore', '先逛逛游戏库', '先逛逛遊戲庫', 'Explore the game library'],
    ['workshop.searchLabel', '搜索游戏、作者或玩法', '搜尋遊戲、作者或玩法', 'Search games, creators or genres'],
    ['workshop.searchPlaceholder', '搜索游戏、作者或玩法', '搜尋遊戲、作者或玩法', 'Search games or creators'],
    ['workshop.emptyHint', '试试游戏名称、作者名，或换一种玩法。', '試試遊戲名稱、作者名，或換一種玩法。', 'Try a game title, a creator name or a different genre.'],
    ['workshop.footer', '好玩的想法，一起实现。', '好玩的想法，一起實現。', 'Made by creators. Shared for play.']
  ];
  window.SiteI18n.register(Object.fromEntries(['zh-Hans', 'zh-Hant', 'en'].map((locale, i) => [locale, Object.fromEntries(rows.map(row => [row[0], row[i + 1]]))])));
})();
