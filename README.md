> 🤝 联系与交流可找 [颜](https://github.com/yan9651688) 和 [蓝梦](https://github.com/lanmengSakura)。

<div align="center">

# NEON ARCADE · AI 小游戏游戏厅

**打开网页，挑一款游戏，免费开玩。**

5 款小游戏 · 《千禧凝思》歌词影片 · PC 与手机 · 无需登录

[![在线游玩](https://img.shields.io/badge/在线游玩-game.yituohub.com-05d9e8)](https://game.yituohub.com/)
[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![游戏](https://img.shields.io/badge/小游戏-5款-ff2a6d)](#-游戏库)
[![纯静态](https://img.shields.io/badge/部署-纯静态-success)](#-本地运行)
[![欢迎贡献](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-一起加新游戏)

</div>

---

这里放着我们做的几款 AI 小游戏。首页沿用设计师的新稿，保留霓虹街机的气氛，点击「游戏库」就能选游戏。没有账号、登录和付费步骤，游戏在你的浏览器里运行。

《千禧凝思》也留在这里。想歇一会儿，可以从首页进入这段歌词影片，再回游戏厅继续玩。

## 🌐 在线开玩

**[https://game.yituohub.com/](https://game.yituohub.com/)**

电脑使用键盘和鼠标，手机使用游戏内的触屏操作。具体按键以各款游戏的开始页或暂停菜单为准，手机横屏通常能看到更完整的战场。

游戏的开始页与暂停菜单都提供「返回游戏厅」，影片也可以返回首页。

## 👀 看看游戏厅

<table>
<tr>
<td width="50%" align="center"><img src="docs/assets/home-preview.png" width="100%" alt="NEON ARCADE 首页实机预览"><br><sub><b>霓虹首页 · 保留《千禧凝思》影片入口</b></sub></td>
<td width="50%" align="center"><img src="docs/assets/library-preview.png" width="100%" alt="五款小游戏的游戏库实机预览"><br><sub><b>游戏库 · 实机截图、分类筛选与搜索</b></sub></td>
</tr>
</table>

## 🎮 游戏库

| 游戏 | 玩什么 |
| --- | --- |
| [星陨前线](https://game.yituohub.com/games/fallen-frontier.html) | 第三人称科幻占点战场，枪械与战甲作战 |
| [智械前线](https://game.yituohub.com/games/iron-front.html) | 扩军、拾取军械与重装，突破机器人防线 |
| [霓潮](https://game.yituohub.com/games/neon-swarm.html) | 在敌潮中生存，升级武器与技能，继续挑战无尽模式 |
| [公路狂徒](https://game.yituohub.com/games/road-fury.html) | 驾车作战，在公路上冲过封锁 |
| [雷霆战翼](https://game.yituohub.com/games/thunderwing.html) | 驾驶战机穿越航线，拾取补给并升级火力 |

游戏库使用 [JSON 清单](public/data/games.json) 管理。以后加游戏，只需放入游戏文件和封面、补充清单，再做一次浏览器检查，首页会根据清单显示新条目。具体步骤见 [添加游戏](docs/adding-game.md)。

## 🎬 千禧凝思

**[观看《千禧凝思》](https://game.yituohub.com/film.html)**

影片保留独立入口与播放页面。声音会在点击播放后开启，主页不会提前下载整段音频。

## ⚡ 人多了会不会卡

每个人的战斗画面、敌人和特效都由自己的浏览器计算。服务器负责把页面与资源发过去，访问量增加主要影响打开页面和下载资源的速度。

首次打开的快慢还受网络带宽影响，战斗帧率则取决于设备、浏览器和游戏画面。静态资源压缩与缓存可以减少重复下载；后续扩容也可以从带宽和静态资源分发入手。

本次优化内容、页面大小和并发测试结果见 [性能与容量说明](docs/performance.md)。性能数字以这份记录的测试环境和实际结果为准。

## 🚀 本地运行

```bash
git clone https://github.com/yan9651688/yituohub-game-arcade.git
cd yituohub-game-arcade
python -m http.server 8080 --directory public
```

然后打开 [http://localhost:8080](http://localhost:8080)。

运行站点只需要一个静态文件服务器，无需数据库和游戏服务端。生产部署可以使用仓库内的 [Nginx 配置示例](deploy/nginx.conf)。

维护与本地预览使用 `public/`。构建生产发布文件时运行

```bash
python scripts/build_release.py --version 1.0.0
```

脚本从 `public/` 生成 `dist/`，检查游戏清单并生成带内容指纹的资源链接与 gzip 文件。电脑上有 Node.js 时，还会用内置模块生成 Brotli 文件。生产服务器发布 `dist/`。

## 🗂 项目结构

```text
public/
  index.html           游戏厅首页
  film.html            千禧凝思影片
  data/games.json      游戏清单
  games/               五款游戏
  assets/              首页、影片与公共交互资源
  vendor/              本地第三方库及其许可证
design/
  designer-home.html   设计师提供的首页原稿
  game-sources/        游戏与影片的原始文件
docs/
  adding-game.md       新游戏接入说明
  performance.md       优化与容量测试记录
  assets/              README 展示素材
scripts/
  optimize_assets.py   从原始文件重建资源优化结果
  build_release.py     构建静态发布文件
deploy/
  nginx.conf           Nginx 部署配置示例
```

## 🤝 找我们聊聊

<div align="center">

<table>
<tr>
<td width="50%" align="center"><img src="docs/assets/qr-yan.jpg" width="200" height="200" alt="颜的微信二维码"><br><sub><b>颜</b> · <a href="https://github.com/yan9651688">yan9651688</a></sub></td>
<td width="50%" align="center"><img src="docs/assets/qr-lanmeng.jpg" width="200" height="200" alt="蓝梦的微信二维码"><br><sub><b>蓝梦</b> · <a href="https://github.com/lanmengSakura">lanmengSakura</a></sub></td>
</tr>
</table>

欢迎扫码聊小游戏、AI 创作，也欢迎告诉我们哪里玩得不顺。

</div>

## 💡 一起加新游戏

可以通过 [Issue](https://github.com/yan9651688/yituohub-game-arcade/issues) 报告问题，或提交 Pull Request。

新游戏请附玩法介绍和电脑、手机的操作方式，并确认开始页、暂停菜单与返回游戏厅都能使用。涉及画面或布局的修改，附一张截图会更方便讨论。提交素材时，请说明来源与使用许可。

## 📄 许可与素材

项目代码使用 [MIT 许可证](LICENSE)。第三方库保留各自的许可证，包括 Three.js 的 MIT 作者署名。影片音乐、视觉素材与作者二维码的来源和使用范围见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)，不随代码许可一并授权。
