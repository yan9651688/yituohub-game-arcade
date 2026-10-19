"""Package the current static site without changing source paths or asset bytes."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
TEXT_TYPES = {".html", ".css", ".js", ".json", ".svg", ".txt", ".xml"}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def catalog_count(catalog: str = "assets/games.js") -> int:
    # Both handwritten JS objects and JSON-generated registries use string values.
    # Parse those literals without executing the catalogue's JavaScript.
    source = (PUBLIC / catalog).read_text(encoding="utf-8")

    def values(field: str) -> list[str]:
        key = rf'(?:"{field}"|{field})'
        return [json.loads(value) for value in re.findall(
            rf'(?<![\w$]){key}\s*:\s*("(?:[^"\\]|\\.)*")', source
        )]

    ids, paths, covers = values("id"), values("path"), values("cover")
    if (not ids or any(not re.fullmatch(r"[a-z0-9-]+", value) for value in ids)
            or len(ids) != len(set(ids)) or len(ids) != len(paths) or len(ids) != len(covers)):
        raise ValueError(f"{catalog} must have unique ids and a path and cover for every game")
    for value in paths + covers:
        target = (PUBLIC / value).resolve()
        if not target.is_relative_to(PUBLIC.resolve()) or not target.is_file():
            raise ValueError(f"Missing or unsafe catalog resource: {value}")
    return len(ids)


def build(version: str) -> dict:
    games = catalog_count()
    classics = catalog_count("assets/classics.js") if (PUBLIC / "assets/classics.js").is_file() else 0
    out = ROOT / "dist"
    # Only the dedicated build directory may be recursively replaced.
    if out.is_symlink() or out.resolve().parent != ROOT.resolve() or out.name != "dist":
        raise ValueError("Unsafe build output")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir()
    for src in sorted(PUBLIC.rglob("*")):
        if not src.is_file() or src.suffix in {".gz", ".br"}:
            continue
        if src.is_symlink() or not src.resolve().is_relative_to(PUBLIC.resolve()):
            raise ValueError(f"Unsafe source: {src}")
        dest = out / src.relative_to(PUBLIC)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(src.read_bytes())

    # This optional deployment record is generated only in dist/.
    (out / "version.json").write_text(
        json.dumps({"version": version, "games": games, "classics": classics,
                    "totalGames": games + classics}, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    compressible = [
        p for p in out.rglob("*")
        if p.is_file() and p.suffix in TEXT_TYPES and p.stat().st_size >= 256
    ]
    for path in compressible:
        path.with_name(path.name + ".gz").write_bytes(
            gzip.compress(path.read_bytes(), compresslevel=9, mtime=0)
        )
    node = shutil.which("node")
    if node:
        script = """
const fs = require('node:fs'), z = require('node:zlib');
for (const path of JSON.parse(fs.readFileSync(0, 'utf8'))) {
  const bytes = fs.readFileSync(path);
  fs.writeFileSync(path + '.br', z.brotliCompressSync(bytes, {
    params: { [z.constants.BROTLI_PARAM_QUALITY]: bytes.length > 1048576 ? 6 : 11 }
  }));
}
"""
        subprocess.run(
            [node, "-e", script],
            input=json.dumps([str(p) for p in compressible]).encode(),
            check=True,
        )

    manifest = {
        p.relative_to(out).as_posix(): {"sha256": digest(p.read_bytes()), "bytes": p.stat().st_size}
        for p in sorted(out.rglob("*")) if p.is_file()
    }
    report = {"version": version, "games": games, "classics": classics,
              "totalGames": games + classics, "brotli": bool(node), "files": manifest}
    (ROOT / ".release").mkdir(exist_ok=True)
    (ROOT / ".release/manifest.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({
        "version": version, "games": games, "classics": classics, "totalGames": games + classics,
        "files": len(manifest), "brotli": bool(node),
        "bytes": sum(item["bytes"] for item in manifest.values()),
    }))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", default="1.2.0")
    build(parser.parse_args().version)
