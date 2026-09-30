"""Bounded static-download benchmark. Request concurrency is not a player-capacity guarantee."""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import ssl
import statistics
import time
import urllib.request


def nginx_sample():
    ticks = 0
    rss = 0
    if os.name != "posix" or not Path("/proc").exists():
        return {"ticks": 0, "rss_bytes": 0}
    for proc in Path("/proc").iterdir():
        if not proc.name.isdigit():
            continue
        try:
            if proc.joinpath("comm").read_text().strip() != "nginx":
                continue
            fields = proc.joinpath("stat").read_text().split(")", 1)[1].split()
            ticks += int(fields[11]) + int(fields[12])
            rss += int(proc.joinpath("statm").read_text().split()[1]) * os.sysconf("SC_PAGE_SIZE")
        except (OSError, ValueError, IndexError):
            pass
    return {"ticks": ticks, "rss_bytes": rss}


def percentile(values, fraction):
    return sorted(values)[min(len(values) - 1, int(len(values) * fraction))]


def run(base, registry_root, concurrency, requests, duration=0, rate=100):
    ctx = ssl.create_default_context()
    media = sorted((registry_root / "assets/media").glob("*.webp"))
    audio = next((registry_root / "assets/media").glob("*.mp3"))
    image = max(media, key=lambda path: path.stat().st_size)
    paths = ["/", "/games.html", "/data/games.json", "/games/fallen-frontier.html", "/games/neon-swarm.html", "/" + image.relative_to(registry_root).as_posix(), "/" + audio.relative_to(registry_root).as_posix()]
    def fetch(number):
        path = paths[number % len(paths)]
        headers = {"Accept-Encoding": "gzip", "User-Agent": "NEON-ARCADE-bounded-QA/1.0"}
        if path.endswith(".mp3"):
            headers["Range"] = "bytes=0-65535"
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(urllib.request.Request(base + path, headers=headers), context=ctx, timeout=20) as response:
                data = response.read()
                expected = 206 if path.endswith(".mp3") else 200
                return {"ms": (time.perf_counter() - started) * 1000, "bytes": len(data), "status": response.status, "ok": response.status == expected}
        except Exception as error:
            return {"ms": (time.perf_counter() - started) * 1000, "bytes": 0, "status": 0, "ok": False, "error": type(error).__name__}
    for number in range(len(paths)):
        assert fetch(number)["ok"], "Warm-up request failed"
    before = nginx_sample()
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        if duration:
            pending = set()
            results = []
            number = 0
            deadline = started + duration
            while time.perf_counter() < deadline:
                due = started + number / rate
                if due > time.perf_counter():
                    time.sleep(min(due - time.perf_counter(), .05))
                    continue
                done = {future for future in pending if future.done()}
                results.extend(future.result() for future in done)
                pending -= done
                if len(pending) < concurrency:
                    pending.add(pool.submit(fetch, number))
                    number += 1
                else:
                    time.sleep(.001)
            results.extend(future.result() for future in pending)
            requests = len(results)
        else:
            results = list(pool.map(fetch, range(requests)))
    elapsed = time.perf_counter() - started
    after = nginx_sample()
    latencies = [result["ms"] for result in results]
    hz = os.sysconf("SC_CLK_TCK") if os.name == "posix" else 100
    return {
        "concurrency": concurrency, "requests": requests, "errors": sum(not result["ok"] for result in results),
        "seconds": round(elapsed, 3), "requests_per_second": round(requests / elapsed, 2),
        "p50_ms": round(statistics.median(latencies), 2), "p95_ms": round(percentile(latencies, .95), 2), "max_ms": round(max(latencies), 2),
        "body_bytes": sum(result["bytes"] for result in results),
        "nginx_cpu_percent_one_core": round(max(0, after["ticks"] - before["ticks"]) / hz / elapsed * 100, 2),
        "nginx_rss_sum_mib": round(after["rss_bytes"] / 1048576, 2),
        "scenario": "mixed compressed HTML/catalog, largest WebP, 64KiB MP3 Range; new verified TLS HTTP/1.1 connections",
        "scheduled_rate": rate if duration else None, "scheduled_seconds": duration or None
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--site", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--concurrency", default="1,10,50,100")
    parser.add_argument("--duration", type=int, default=0)
    parser.add_argument("--rate", type=int, default=100)
    args = parser.parse_args()
    levels = [int(value) for value in args.concurrency.split(",")]
    if any(level < 1 or level > 100 for level in levels):
        raise ValueError("The bounded benchmark accepts concurrency 1..100 only")
    if args.duration < 0 or args.duration > 60 or args.rate < 1 or args.rate > 200:
        raise ValueError("Sustained runs are bounded to 60 seconds and 200 requests/second")
    report = {"method": "same-host generator for Nginx overhead; excludes public uplink, geography and device rendering", "cpu_count": os.cpu_count(), "rows": []}
    for level in levels:
        row = run(args.base_url.rstrip("/"), args.site, level, max(100, level * 3), args.duration, args.rate)
        report["rows"].append(row)
        print(json.dumps(row), flush=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if any(row["errors"] for row in report["rows"]):
        raise SystemExit(1)
