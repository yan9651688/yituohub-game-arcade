# 静态发布与缓存

开发时可以直接用 Python 服务 `public/`。生产先运行 `python scripts/build_release.py --version 1.2.0`，发布生成的 `dist/`，版本号按实际发布调整。配置示例在 [deploy/nginx.conf](../deploy/nginx.conf)。

当前构建保持 `public/` 的目录与源文件内容，额外生成文本的压缩副本和 `version.json`。它不重写链接、不拆分游戏里的内嵌媒体，也不为资源添加内容指纹。游戏库和加载页共用 `assets/games.js`，原游戏、影片及 Three.js 位于 `game-arcade/` 下；发布时需要保留整个目录。

| 资源 | 策略 |
| --- | --- |
| HTML、JS、CSS、封面、第三方库与版本 JSON | `no-cache`，浏览器可保存副本，使用前重验证 |
| 以后另行加入的内容指纹资源 | 只有文件地址随内容变化时，再配置长期缓存与 `immutable` |

游戏加载页会流式读取 HTML，压缩响应的 `Content-Length` 不能用作解压后字节的进度分母，因此压缩下载期间显示已读取量与不确定进度，下载完成后继续等待游戏画面准备。

文本在构建时生成 gzip 和可选 Brotli。示例的 `gzip_static` 需要 Nginx 包含对应模块；`brotli_static` 默认注释，安装并加载模块后再启用。`http2 on` 需要 Nginx 1.25.1 及以上并包含 HTTP/2 模块。参考 [Nginx gzip_static 文档](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html)、[HTTP/2 文档](https://nginx.org/en/docs/http/ngx_http_v2_module.html) 和 [Brotli 模块说明](https://github.com/google/ngx_brotli)。

配置是部署模板，并非服务器配置快照。按环境修改域名、证书与发布路径，确认主配置已加载 `mime.types`，再运行 `nginx -t`，通过后 reload。检查首页、游戏库、统一加载页、放映厅、游戏返回和影片返回路径，以及实际的 HTTPS 与压缩响应。

## 更新与回滚

发布目录使用独立版本名，先校验资源 SHA，再原子切换 `current` 链接，保留上一版。不要直接覆盖运行中的目录。

可用 `scripts/install_release.py <archive> <manifest> <new-release-directory>` 安装发行包。它拒绝覆盖已有目录，检查归档成员和 SHA，并给部署文件设置新的修改时间。发行包本身可复现地使用固定时间戳，但 Nginx 默认 ETag 与文件修改时间、大小有关；直接保留归档的固定时间戳，可能让同长度的 HTML 更新被误认为没变。使用安装脚本或等价的部署时间更新，避免这个问题。

证书、私钥、SSH 配置、生产日志和密码留在服务器，不进入源码或发行包。HTTP-01 的 `/.well-known/acme-challenge/` 通道应保留在 HTTP 端口，普通页面跳到 HTTPS。证书续期成功后先检查 Nginx 配置，再重载证书。
