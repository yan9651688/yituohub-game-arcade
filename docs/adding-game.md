# 添加下一款游戏

游戏库与统一加载页共用 `public/assets/games.js` 中的 `window.ARCADE_GAMES`。清单里的 `path` 和 `cover` 相对 `public/` 根目录。

1. 将可独立运行的游戏放到 `public/game-arcade/games/your-game.html`，检查它的相对资源路径。使用本地资源或 HTTPS 地址，保持无需登录、免费游玩。
2. 将游戏封面放到 `public/assets/covers/v2/your-game.png`。说明素材来源，不使用其他游戏画面冒充作品。
3. 在 `games.js` 的数组中追加以下记录，保留外层 `Object.freeze([...].map(Object.freeze))`。`id` 使用唯一的小写英文、数字和连字符，`sizeBytes` 填游戏 HTML 的实际字节数。

```js
{
  id: "your-game",
  title: "你的游戏名",
  en: "YOUR GAME",
  category: "游戏类型",
  tags: ["标签一", "标签二"],
  description: "一句说明玩家在游戏里做什么。",
  controls: "WASD 移动 · 鼠标操作 · 手机触屏",
  path: "game-arcade/games/your-game.html",
  sizeBytes: 123456,
  cover: "assets/covers/v2/your-game.png"
}
```

4. 同时更新 `public/games.html` 的 `<noscript>` 直链列表。正常入口由游戏库自动生成 `play.html?game=your-game`，无需为每款游戏复制加载页。
5. 用 `python -m http.server 8080 --directory public` 本地检查。确认新条目、搜索与分类正常，加载页能进入游戏；电脑与触屏视口能开始、暂停，并通过右侧「游戏库」返回。鼠标锁定时先按 Esc。还要检查网络中断时的重试、取消，以及直接访问原游戏文件时的资源路径。
6. 运行 `python scripts/build_release.py --version 1.1.0`，版本号按实际发布调整。构建检查 ID 唯一及游戏、封面文件存在，保持全部源文件路径与内容，生成 gzip 和可选 Brotli。Brotli 使用 Node.js 内置模块；未安装 Node 时仍可生成 gzip 包。
7. 将 `dist/` 发布到静态服务器，先检查新版本再切换；保留上一版目录便于回滚。构建不会自动创建 GitHub 标签或发布线上服务。

当前封面、JS、CSS 和第三方库使用固定路径。发布时使用可重验证的缓存策略，详见 [Nginx 部署说明](nginx.md)。如果以后引入内容指纹与长期缓存，需要同时更新所有资源引用。

`scripts/optimize_assets.py`、`capture_previews.py` 与原有的游戏 smoke、资源 benchmark 脚本是 v1.0.0 的历史工具，目录约定与当前改版不同。请在对应标签的独立副本中复现历史结果，不要用旧拆分脚本重建当前 `public/`。当前构建回归检查使用 `python scripts/tests/test_build_release.py`。

## 增加放映厅作品

作品清单在 `public/assets/mv-hub.js` 的 `videos` 数组中。加入独立播放页与海报后，追加 `title`、`en`、`type`、`meta`、`duration`、`description`、`cover` 和 `href`；`cover`、`href` 同样相对 `public/` 根目录。当前《千禧凝思》的页面是 `game-arcade/film.html`，返回链接指向 `../mv.html`。

检查海报与播放页能打开、声音在用户操作后启动、影片可返回放映厅。游戏构建检查只覆盖 `ARCADE_GAMES`，不会代替影片的浏览器检查。
