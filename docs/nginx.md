# 静态发布与缓存

开发时可以直接用 Python 服务 `public/`。生产先运行 `python scripts/build_release.py --version 1.0.0`，发布生成的 `dist/`，配置示例在 [deploy/nginx.conf](../deploy/nginx.conf)。

构建会给站点 JS、CSS 和预览图增加内容指纹，将目录 JSON 与 HTML 的引用一同改写。48 个图片和音乐资源已经使用完整 SHA-256 名称。Three.js 使用 `three-0.160.0` 版本目录，旧 `/vendor/three/` 请求保留兼容映射。

| 资源 | 策略 |
| --- | --- |
| HTML、游戏目录与版本 JSON | `no-cache`，每次需要时重验证，发布后能及时看到变更 |
| 内容指纹图片、JS、CSS、媒体 | `public, max-age=31536000, immutable`，相同字节保持相同地址 |
| 完整版本目录下的 Three.js | 长期缓存；升级库时升级目录名 |
| 没有指纹的兼容资源地址 | 重验证，不把可变地址当成一年不变 |
| MP3 | `audio/mpeg`、字节 Range，保留流式加载与跳转 |

文本在构建时生成 gzip 与 Brotli，访问时直接发送压缩文件。Brotli 使用 Node.js 内置模块生成，Nginx 使用 `ngx_brotli_static`。Debian 的 `libnginx-mod-http-brotli-static` 可提供该模块；没有模块时不要启用示例中的 `brotli_static` 指令。HTTP/2 配置需要 Nginx 1.25.1 及以上的 HTTP/2 模块。

配置中的指纹正则带引号，避免 Nginx 将 `{12}` 当成配置块。正式环境须先运行 `nginx -t`，通过后再 reload。[Nginx HTTP/2 文档](https://nginx.org/en/docs/http/ngx_http_v2_module.html)、[Brotli 模块说明](https://github.com/google/ngx_brotli)。

## 更新与回滚

发布目录使用独立版本名，先校验资源 SHA，再原子切换 `current` 链接，保留上一版。不要直接覆盖运行中的目录。

可用 `scripts/install_release.py <archive> <manifest> <new-release-directory>` 安装发行包。它拒绝覆盖已有目录，检查归档成员和 SHA，并给部署文件设置新的修改时间。发行包本身可复现地使用固定时间戳，但 Nginx 默认 ETag 与文件修改时间、大小有关；直接保留归档的固定时间戳，可能让同长度的 HTML 更新被误认为没变。使用安装脚本或等价的部署时间更新，避免这个问题。

证书、私钥、SSH 配置、生产日志和密码留在服务器，不进入源码或发行包。HTTP-01 的 `/.well-known/acme-challenge/` 通道应保留在 HTTP 端口，普通页面跳到 HTTPS。证书续期成功后先检查 Nginx 配置，再重载证书。
