"""Verify and install a static release into a new directory; never replace an existing release."""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import os
import tarfile
import time


def install(archive: Path, manifest_path: Path, target: Path) -> None:
    target = target.resolve()
    if target.exists():
        raise ValueError("Use a new release directory; existing releases are never overwritten")
    expected = json.loads(manifest_path.read_text(encoding="utf-8"))["files"]
    with tarfile.open(archive) as bundle:
        members = bundle.getmembers()
        files = set()
        for member in members:
            name = PurePosixPath(member.name)
            if name.is_absolute() or ".." in name.parts or not (member.isfile() or member.isdir()):
                raise ValueError(f"Unsafe archive member: {member.name}")
            if member.isfile():
                if member.name in files:
                    raise ValueError(f"Duplicate archive member: {member.name}")
                files.add(member.name)
        if files != set(expected):
            raise ValueError("Archive member list differs from the verified release manifest")
        target.mkdir(parents=True, mode=0o755)
        bundle.extractall(target, filter="data")
    deployed_at = time.time()
    for name, info in expected.items():
        path = target / name
        if hashlib.sha256(path.read_bytes()).hexdigest() != info["sha256"]:
            raise ValueError(f"Checksum mismatch: {name}")
        path.chmod(0o644)
        # Archives have reproducible timestamps. Give each deployment fresh
        # validators: Nginx ETags combine mtime and size, including mutable HTML.
        os.utime(path, (deployed_at, deployed_at))
    for path in target.rglob("*"):
        if path.is_dir():
            path.chmod(0o755)
    print(f"Verified {len(expected)} files for {target.name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("target", type=Path)
    args = parser.parse_args()
    install(args.archive, args.manifest, args.target)
