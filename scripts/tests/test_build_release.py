"""Regression checks for packaging the current portal without rewriting paths."""
from __future__ import annotations

import contextlib
import gzip
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "build_release", Path(__file__).resolve().parents[1] / "build_release.py"
)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class BuildReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.public = self.root / "public"
        self.public.mkdir()
        self.write("assets/games.js", b'window.ARCADE_GAMES = [{id:"demo",path:"game-arcade/games/demo.html",cover:"assets/covers/demo.png"}];')
        self.write("game-arcade/games/demo.html", b'<script src="../vendor/demo.js"></script>' + b' ' * 300)
        self.write("assets/covers/demo.png", b'\x89PNG\r\n\x1a\nimage-data')
        self.write("game-arcade/vendor/demo.js", b'window.demo = true;')
        self.write("index.html", b'<a href="play.html?game=demo">Play</a>')
        self.addCleanup(patch.stopall)
        patch.object(builder, "ROOT", self.root).start()
        patch.object(builder, "PUBLIC", self.public).start()
        patch.object(builder.shutil, "which", return_value=None).start()

    def write(self, name, data):
        path = self.public / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def test_preserves_nested_paths_bytes_and_gzip_payload(self):
        self.write("index.html.gz", b"stale compression")
        with contextlib.redirect_stdout(io.StringIO()):
            report = builder.build("test")
        self.assertEqual(report["games"], 1)
        for source in self.public.rglob("*"):
            if source.is_file() and source.suffix != ".gz":
                self.assertEqual(source.read_bytes(), (self.root / "dist" / source.relative_to(self.public)).read_bytes())
        game = self.root / "dist/game-arcade/games/demo.html"
        self.assertEqual(gzip.decompress(game.with_name(game.name + ".gz").read_bytes()), game.read_bytes())
        self.assertFalse((self.root / "dist/index.html.gz").exists())

    def test_rejects_missing_and_escaping_resources(self):
        for path in ["missing.html", "../outside.html"]:
            with self.subTest(path=path):
                self.write("assets/games.js", f'[{{id:"demo",path:"{path}",cover:"assets/covers/demo.png"}}]'.encode())
                with self.assertRaises(ValueError):
                    builder.catalog_count()

    def test_accepts_json_generated_keys_and_decodes_unicode_paths(self):
        game = {"id": "demo", "path": "game-arcade/games/测试.html", "cover": "assets/covers/demo.png"}
        self.write(game["path"], b"playable")
        self.write("assets/games.js", ("window.ARCADE_GAMES = " + json.dumps([game]) + ";").encode())
        self.assertEqual(builder.catalog_count(), 1)

    def test_rejects_duplicates_and_quoted_escaping_paths(self):
        game = {"id": "demo", "path": "game-arcade/games/demo.html", "cover": "assets/covers/demo.png"}
        for games in [[game, game], [{**game, "path": "../outside.html"}], [{**game, "id": "bad id"}]]:
            with self.subTest(games=games):
                self.write("assets/games.js", ("window.ARCADE_GAMES = " + json.dumps(games) + ";").encode())
                with self.assertRaises(ValueError):
                    builder.catalog_count()

    def test_counts_and_validates_the_classic_catalogue(self):
        self.write("classics/link.html", b"classic game")
        self.write("assets/classics.js", b'window.CLASSIC_GAMES = [{"id":"link","path":"classics/link.html","cover":"assets/covers/demo.png"}];')
        with contextlib.redirect_stdout(io.StringIO()):
            report = builder.build("test")
        self.assertEqual(report["games"], 1)
        self.assertEqual(report["classics"], 1)
        self.assertEqual(report["totalGames"], 2)
        self.assertEqual(json.loads((self.root / "dist/version.json").read_text())["totalGames"], 2)
        self.write("assets/classics.js", b'[{"id":"broken","path":"classics/missing.html","cover":"assets/covers/demo.png"}]')
        with self.assertRaises(ValueError):
            builder.build("invalid")


if __name__ == "__main__":
    unittest.main()
