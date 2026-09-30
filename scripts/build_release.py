"""Build an immutable-asset, precompressed static release without npm dependencies."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import html
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
TEXT_TYPES = {".html", ".css", ".js", ".json", ".svg", ".txt", ".xml"}
FINGERPRINT_TYPES = {".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"}
VENDOR_VERSION = "0.160.0"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_catalog() -> list[dict]:
    data = json.loads((PUBLIC / "data/games.json").read_text(encoding="utf-8"))
    games = data.get("games")
    if not isinstance(games, list) or not games:
        raise ValueError("games.json must contain a nonempty games array")
    ids = set()
    for game in games:
        for key in ["id", "title", "englishTitle", "category", "description", "url", "preview"]:
            if not isinstance(game.get(key), str) or not game[key]:
                raise ValueError(f"Invalid game {key}: {game!r}")
        if game["id"] in ids or not re.fullmatch(r"[a-z0-9-]+", game["id"]):
            raise ValueError(f"Invalid or duplicate game id: {game['id']}")
        ids.add(game["id"])
        if not isinstance(game.get("tags"), list) or not all(isinstance(t, str) for t in game["tags"]):
            raise ValueError(f"Invalid tags: {game['id']}")
        if not game["url"].startswith("/games/") or not game["url"].endswith(".html"):
            raise ValueError(f"Invalid game URL: {game['url']}")
        for key in ["url", "preview"]:
            target = (PUBLIC / game[key].lstrip("/")).resolve()
            if not target.is_relative_to(PUBLIC.resolve()) or not target.is_file():
                raise ValueError(f"Missing or unsafe {key}: {game[key]}")
    return games


def fallback_cards(games: list[dict]) -> str:
    e = html.escape
    cards = []
    for number, g in enumerate(games, 1):
        cards.append(
            f'<a class="game-card" href="{e(g["url"], quote=True)}" data-game-id="{e(g["id"])}" data-category="{e(g["category"])}">'
            f'<div class="card-media"><span class="preview-fallback">{e(g["englishTitle"])}</span>'
            f'<img src="{e(g["preview"], quote=True)}" alt="{e(g["title"])}游戏实机画面" width="640" height="360" loading="lazy" decoding="async"></div>'
            f'<div class="card-copy"><div class="card-meta"><span>{number:02d} / {e(g["category"])}</span><span>免费</span></div>'
            f'<h2>{e(g["title"])}</h2><p class="card-en">{e(g["englishTitle"])}</p>'
            f'<p class="card-description">{e(g["description"])}</p><div class="card-footer">'
            f'<span class="card-tags">{e(" · ".join(g["tags"][:2]))}</span><span class="card-start">开玩 ↗</span></div></div></a>'
        )
    return "\n".join(cards)


def rewrite(text: str, mapping: dict[str, str]) -> str:
    for old, new in sorted(mapping.items(), key=lambda item: len(item[0]), reverse=True):
        text = text.replace(old, new)
    return text.replace("/vendor/three/", f"/vendor/three-{VENDOR_VERSION}/")


def build(version: str) -> dict:
    games = read_catalog()
    out = ROOT / "dist"
    # Only the dedicated build directory may be recursively replaced.
    if out.is_symlink() or out.resolve().parent != ROOT.resolve() or out.name != "dist":
        raise ValueError("Unsafe build output")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir()
    for src in PUBLIC.rglob("*"):
        if not src.is_file() or src.suffix in {".gz", ".br"}:
            continue
        if src.is_symlink() or not src.resolve().is_relative_to(PUBLIC.resolve()):
            raise ValueError(f"Unsafe source: {src}")
        dest = out / src.relative_to(PUBLIC)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(src.read_bytes())

    library = out / "games.html"
    text = library.read_text(encoding="utf-8")
    markers = r"(<!-- GAMES_START -->)[\s\S]*?(<!-- GAMES_END -->)"
    if len(re.findall(markers, text)) != 1:
        raise ValueError("games.html must have one static catalog marker pair")
    text = re.sub(markers, lambda m: m[1] + "\n" + fallback_cards(games) + "\n" + m[2], text)
    counter = r'(?P<open><(?P<tag>span|b|strong)\b[^>]*\bdata-game-count[^>]*>)(?P<count>\d+)(?P<close></(?P=tag)>)'
    text = re.sub(counter, lambda m: m['open'] + str(len(games)) + m['close'], text)
    library.write_text(text, encoding="utf-8", newline="\n")

    mapping = {}
    assets = out / "assets"
    # Media already has a SHA-256 filename; never re-encode image/audio bytes.
    for src in list(assets.rglob("*")):
        if not src.is_file() or "media" in src.relative_to(assets).parts or src.suffix in {".js", ".css"}:
            continue
        if src.suffix not in FINGERPRINT_TYPES:
            continue
        dest = src.with_name(src.stem + "." + digest(src.read_bytes())[:12] + src.suffix)
        dest.write_bytes(src.read_bytes())
        rel, newrel = src.relative_to(out).as_posix(), dest.relative_to(out).as_posix()
        mapping["/" + rel] = "/" + newrel
        mapping[rel] = newrel

    # Site scripts are standalone. Rewrite image links before calculating their hash.
    for src in list(assets.rglob("*")):
        if not src.is_file() or src.suffix not in {".js", ".css"}:
            continue
        content = rewrite(src.read_text(encoding="utf-8"), mapping).encode("utf-8")
        src.write_bytes(content)
        dest = src.with_name(src.stem + "." + digest(content)[:12] + src.suffix)
        dest.write_bytes(content)
        rel, newrel = src.relative_to(out).as_posix(), dest.relative_to(out).as_posix()
        mapping["/" + rel] = "/" + newrel
        mapping[rel] = newrel

    vendor = out / "vendor/three"
    vendor.rename(vendor.with_name("three-" + VENDOR_VERSION))
    for path in out.rglob("*"):
        if path.is_file() and path.suffix in {".html", ".json"}:
            path.write_text(rewrite(path.read_text(encoding="utf-8"), mapping), encoding="utf-8", newline="\n")

    (out / "version.json").write_text(json.dumps({"version": version, "games": len(games)}, ensure_ascii=False) + "\n", encoding="utf-8")
    compressible = [p for p in out.rglob("*") if p.is_file() and p.suffix in TEXT_TYPES and p.stat().st_size >= 256]
    for p in compressible:
        p.with_name(p.name + ".gz").write_bytes(gzip.compress(p.read_bytes(), compresslevel=9, mtime=0))
    node = shutil.which("node")
    if node:
        js = "const fs=require('node:fs'),z=require('node:zlib');const paths=JSON.parse(fs.readFileSync(0,'utf8'));for(const p of paths){fs.writeFileSync(p+'.br',z.brotliCompressSync(fs.readFileSync(p),{params:{[z.constants.BROTLI_PARAM_QUALITY]:11}}));}"
        subprocess.run([node, "-e", js], input=json.dumps([str(p) for p in compressible]).encode(), check=True)

    manifest = {p.relative_to(out).as_posix(): {"sha256": digest(p.read_bytes()), "bytes": p.stat().st_size} for p in sorted(out.rglob("*")) if p.is_file()}
    report = {"version": version, "games": len(games), "brotli": bool(node), "files": manifest}
    (ROOT / ".release").mkdir(exist_ok=True)
    (ROOT / ".release/manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"version": version, "games": len(games), "files": len(manifest), "brotli": bool(node), "bytes": sum(p["bytes"] for p in manifest.values())}))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", default="1.0.0")
    build(parser.parse_args().version)
