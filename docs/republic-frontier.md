# 共和国之辉 · 黑潮危机

经典 RTS 风格的独立网页重制。包括盟军、中国、苏军三个阵营，八张遭遇战地图，以及盟军和中国各八关原创战役。游戏需要电脑键盘和鼠标。

## 运行

在仓库根目录启动静态服务：

```sh
python -m http.server 8080 --directory public
```

打开 `http://localhost:8080/play.html?game=republic-frontier`，或直接访问 `http://localhost:8080/game-arcade/games/republic-frontier/index.html`。ES 模块与素材通过 HTTP 加载，不能通过双击 HTML 文件启动。

## 操作

左键选择和下令，拖动框选，右键取消。D 展开基地车，A 攻击移动，S 停止，U 卸载，Ctrl + 数字编队。方向键、地图边缘和中键拖动移动视角，滚轮缩放。Esc 暂停，暂停菜单可切换现代右键下令。

建造发电厂、精炼厂与兵营后逐步解锁生产。桥梁、坡道和地形障碍实际影响路线；雪地、冰面和湿地影响移动速度。保存包含完整战场与任务进度，刷新页面后可继续行动。

## 源码与测试

运行文件在 `public/game-arcade/games/republic-frontier/`。`src/engine.js` 提供不依赖 DOM 的模拟，`maps.js` 和 `terrain.js` 管理地图与通行，`missions.js` 和 `campaigns.js` 管理战役，`renderer.js` 绘制实时战场，`main.js` 负责输入与界面。

```sh
node --test scripts/tests/republic-frontier/*.test.mjs
python scripts/tests/test_build_release.py
python scripts/build_release.py --version republic-frontier-20261019
```

现有站点构建脚本会保持运行文件路径与内容，并在 `dist/` 中生成 gzip 和 Brotli 副本。测试与截图放在 `scripts/tests/`、`docs/`，不作为游戏运行资源发布。

这次包含两处已上线修复：较矮窗口下侧栏不再撑出屏幕，生产区独立滚动；首页地图数量从六张修正为八张。

验收范围见 [浏览器与自动化记录](republic-frontier/verification.md)，素材说明见 [美术来源](republic-frontier/art-provenance.md)，运行文件的仓库相对路径与 SHA-256 见 [运行文件清单](republic-frontier/runtime-hashes.json)。
