# 添加下一款游戏

游戏目录由 `public/data/games.json` 管理，页面从同一个清单读取标题、类型、介绍和封面。

1. 将可独立运行的游戏放到 `public/games/your-game.html`。使用本地资源或 HTTPS 地址，不加入登录、收费或未说明的外部服务。
2. 将真实游戏截图放到 `public/assets/previews/your-game.jpg`。不要用其他游戏截图代替。
3. 在 JSON 的 `games` 数组追加一条记录，`id` 使用唯一的小写英文、数字和连字符。

```json
{
  "id": "your-game",
  "title": "你的游戏名",
  "englishTitle": "YOUR GAME",
  "category": "游戏类型",
  "description": "一句说明玩家在游戏里做什么。",
  "tags": ["标签一", "标签二"],
  "url": "/games/your-game.html",
  "preview": "/assets/previews/your-game.jpg"
}
```

4. 用 `python -m http.server 8080 --directory public` 本地检查，确认游戏库出现新条目，搜索和分类能找到它，电脑与手机能开始、暂停及返回游戏厅。
5. 运行 `python scripts/build_release.py --version 1.0.1`。构建会检查文件存在、ID 唯一，更新没有 JavaScript 时的直链列表和游戏数量，并生成带内容指纹的缓存 URL、gzip 和 Brotli 文件。Brotli 生成使用 Node.js 内置模块；未安装 Node 时仍可生成 gzip 包。
6. 将 `dist/` 发布到静态服务器，先检查新版本再切换；保留上一版目录便于回滚。更新版本号后在 GitHub 发布对应标签。

不要直接修改已经按 SHA-256 命名的媒体文件。需要替换素材时，以新字节生成新名称并更新引用，否则长期缓存中的玩家会继续使用旧内容。

已有游戏/影片内的大段 data URI 可通过 `scripts/optimize_assets.py` 从 `design/game-sources/` 无损提取。新增作品应遵循相同的媒体分离原则；该脚本当前处理的是仓库已有的六份基线，添加其它命名的作品前先查看脚本的输入约定。
