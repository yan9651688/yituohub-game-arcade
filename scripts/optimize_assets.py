# Historical v1.0.0 tooling; paths and selectors predate the current portal.
"""Losslessly externalize bundled media from explicit, untouched HTML sources.

No image/audio transcode occurs. The supplied HTML sources remain unchanged.
Only the six application HTML files, their gzip siblings, and hashed media are
written to the output directory. Homepage/catalog files are outside this scope.
"""
from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_URI = re.compile(r"data:(image/(?:webp|jpeg|png|gif));base64,([A-Za-z0-9+/=]+)")
SONG = re.compile(r'<script\b(?=[^>]*\bid\s*=\s*["\']song-data["\'])[^>]*>(.*?)</script\s*>', re.I | re.S)
MUSIC_DEFAULT = re.compile(r"(QS\.get\(['\"]music['\"]\)\s*\|\|\s*)(['\"])([^'\"]+)(\2)")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def media_format(data: bytes) -> tuple[str, str]:
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        if int.from_bytes(data[4:8], "little") + 8 != len(data):
            raise ValueError("Truncated or malformed WebP RIFF payload")
        return "webp", "image/webp"
    if data.startswith(b"\xff\xd8") and data.endswith(b"\xff\xd9"):
        return "jpg", "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "gif", "image/gif"
    if data.startswith(b"ID3") or (len(data) >= 2 and data[0] == 0xFF and data[1] & 0xE0 == 0xE0):
        return "mp3", "audio/mpeg"
    raise ValueError("Unknown media magic; refusing to invent a file extension")


def film_navigation(html: str) -> str:
    """Add a persistent same-origin exit without changing scene/music logic."""
    if 'id="arcade-film-navigation-style"' not in html:
        head = """
<link rel="stylesheet" href="/assets/arcade-navigation.css">
<script defer src="/assets/arcade-navigation.js"></script>
<style id="arcade-film-navigation-style">
.film-home-link{position:fixed;left:max(12px,3vw);bottom:max(14px,env(safe-area-inset-bottom));z-index:40;background:rgba(13,6,24,.92)!important}
@media(max-width:600px){#start .hud.br{bottom:70px}}
</style>
"""
        if html.count("</head>") != 1:
            raise ValueError("Film source needs exactly one closing head tag")
        html = html.replace("</head>", head + "</head>", 1)
    if 'id="arcade-home-link"' not in html:
        anchor = '<a id="arcade-home-link" class="arcade-home-link film-home-link" href="/" aria-label="返回游戏厅"><span aria-hidden="true">←</span><span>返回游戏厅</span></a>\n'
        if html.count("</body>") != 1:
            raise ValueError("Film source needs exactly one closing body tag")
        html = html.replace("</body>", anchor + "</body>", 1)
    html = html.replace("ex.textContent = '退出 · 回首页'", "ex.textContent = '退出 · 回影片菜单'")
    return html


def optimize(source_dir: Path, output_dir: Path) -> dict:
    source_dir, output_dir = source_dir.resolve(), output_dir.resolve()
    if output_dir == source_dir or source_dir in output_dir.parents or output_dir in source_dir.parents:
        raise ValueError("Source and output must be separate, non-overlapping directories")
    media_dir = output_dir / "assets" / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    assets: dict[str, dict] = {}
    results = []
    applications = [p.relative_to(source_dir).as_posix() for p in sorted((source_dir / "games").glob("*.html"))]
    if (source_dir / "film.html").is_file():
        applications.append("film.html")
    if not applications:
        raise ValueError("No application HTML sources found")
    sources_before = {rel: (source_dir / rel).read_bytes() for rel in applications}

    def save_media(raw: bytes, source: str, declared_mime: str | None = None) -> str:
        extension, mime = media_format(raw)
        if declared_mime and declared_mime != mime:
            raise ValueError(f"Declared {declared_mime} differs from actual {mime} in {source}")
        digest = sha256(raw)
        filename = f"{digest}.{extension}"
        destination = media_dir / filename
        if destination.exists():
            if destination.read_bytes() != raw:
                raise ValueError("Existing hashed asset differs from its content hash")
        else:
            destination.write_bytes(raw)
        if sha256(destination.read_bytes()) != digest:
            raise ValueError("Written media failed SHA-256 verification")
        asset = assets.setdefault(filename, {"path": "assets/media/" + filename, "sha256": digest,
                                             "bytes": len(raw), "mime": mime, "sources": []})
        if source not in asset["sources"]:
            asset["sources"].append(source)
        return "/assets/media/" + filename

    for relative in applications:
        raw = sources_before[relative]
        text = raw.decode("utf-8-sig")
        replacements = 0
        def replace_image(match):
            nonlocal replacements
            payload = base64.b64decode(match.group(2), validate=True)
            replacements += 1
            return save_media(payload, relative, match.group(1))
        optimized = DATA_URI.sub(replace_image, text)
        song = SONG.search(optimized)
        music_url = None
        if song:
            music_default = MUSIC_DEFAULT.search(optimized)
            if not music_default:
                raise ValueError("Cannot locate the original music fallback URL")
            music_display_name = music_default.group(3)
            payload = base64.b64decode("".join(song.group(1).split()), validate=True)
            music_url = save_media(payload, relative, "audio/mpeg")
            optimized = optimized[:song.start()] + optimized[song.end():]
            def replace_music(match):
                return match.group(1) + match.group(2) + music_url + match.group(4)
            optimized, count = MUSIC_DEFAULT.subn(replace_music, optimized)
            if count != 1:
                raise ValueError("Expected one music fallback URL; the query-string override must remain")
            optimized = optimized.replace("songEl.oncanplaythrough = onReady(MUSIC.file);",
                                          "songEl.oncanplaythrough = onReady(QS.get('music') || " + json.dumps(music_display_name, ensure_ascii=False) + ");")
        if relative == "film.html":
            optimized = film_navigation(optimized)
        if relative.endswith("fallen-frontier.html") and "DOMContentLoaded" not in optimized:
            raise ValueError("The existing complete-document boot fix must be preserved")
        output = optimized.encode("utf-8")
        destination = output_dir / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(output)
        compressed = gzip.compress(output, compresslevel=9, mtime=0)
        destination.with_name(destination.name + ".gz").write_bytes(compressed)
        if gzip.decompress(compressed) != output:
            raise ValueError("Generated gzip is not a byte-identical representation")
        source_gzip = gzip.compress(raw, compresslevel=9, mtime=0)
        related = [asset for asset in assets.values() if relative in asset["sources"]]
        results.append({"path": relative, "source_sha256": sha256(raw), "output_sha256": sha256(output),
                        "source_bytes": len(raw), "output_bytes": len(output),
                        "source_gzip_bytes": len(source_gzip), "output_gzip_bytes": len(compressed),
                        "external_media_count": len(related), "external_media_bytes": sum(a["bytes"] for a in related),
                        "data_uri_replacements": replacements, "music_url": music_url,
                        "all_resources_cold_payload_estimate": len(compressed) + sum(a["bytes"] for a in related)})
    for relative, raw in sources_before.items():
        if (source_dir / relative).read_bytes() != raw:
            raise ValueError("A source baseline changed during optimization")
    return {"files": results, "assets": sorted(assets.values(), key=lambda a: a["path"]),
            "unique_media_count": len(assets), "unique_media_bytes": sum(a["bytes"] for a in assets.values()),
            "transcoded_media": False, "source_files_unchanged": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=ROOT / "design" / "game-sources")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "public")
    parser.add_argument("--report", type=Path, default=ROOT / "qa" / "performance" / "asset-report.json")
    args = parser.parse_args()
    report = optimize(args.source_dir, args.output_dir)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"files": report["files"], "unique_media_count": report["unique_media_count"],
                      "unique_media_bytes": report["unique_media_bytes"], "transcoded_media": False,
                      "source_files_unchanged": True}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()
