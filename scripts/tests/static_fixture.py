"""Local gzip/cache/range fixture for application QA, never a production server."""
from __future__ import annotations

import gzip
import hashlib
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
APPLICATIONS = {"film.html", *[f"games/{slug}.html" for slug in
                            ["fallen-frontier", "iron-front", "neon-swarm", "road-fury", "thunderwing"]]}


def start_server(mode="optimized", cache=True, web_root=None):
    public_dir=(Path(web_root) if web_root else ROOT/"public").resolve()
    payloads={}
    def payload(relative,revision="1"):
        key=relative,revision
        if key in payloads:return payloads[key]
        base=ROOT/"design"/"game-sources" if mode=="baseline" and relative in APPLICATIONS else public_dir
        path=(base/relative).resolve()
        if base.resolve() not in path.parents or not path.is_file():return None
        raw=path.read_bytes()
        if revision=="2" and relative in APPLICATIONS:
            raw+=b"\n<!-- fixture-only code revision; media URLs and game behavior unchanged -->\n"
        compressed=gzip.compress(raw,compresslevel=9,mtime=0) if path.suffix in {".html",".js",".css",".json"} else None
        result=(raw,mimetypes.guess_type(path.name)[0] or "application/octet-stream",'"'+hashlib.sha256(raw).hexdigest()+'"',compressed)
        payloads[key]=result
        return result
    # Compression is performed before measurement, matching gzip_static behavior.
    for path in public_dir.rglob("*"):
        if path.is_file() and path.suffix in {".html",".js",".css",".json"}:
            relative=path.relative_to(public_dir).as_posix()
            payload(relative)
            if relative in APPLICATIONS:payload(relative,"2")
    class Handler(BaseHTTPRequestHandler):
        protocol_version="HTTP/1.1"
        def log_message(self, *_args):
            pass

        def do_HEAD(self):
            self.respond(head=True)

        def do_GET(self):
            self.respond(head=False)

        def respond(self, head):
            request_url=urlsplit(self.path)
            relative=unquote(request_url.path).lstrip("/") or "index.html"
            revision="2" if parse_qs(request_url.query).get("revision")==["2"] else "1"
            item=payload(relative,revision)
            if item is None:
                self.send_error(404)
                return
            raw,mime,tag,compressed=item
            immutable=relative.startswith("assets/media/") or relative.startswith("vendor/")
            cache_header="public, max-age=31536000, immutable" if cache and immutable else "no-cache" if cache else "no-store"
            if cache and self.headers.get("If-None-Match")==tag:
                self.send_response(304)
                self.send_header("ETag",tag)
                self.send_header("Cache-Control",cache_header)
                self.end_headers()
                return
            body=raw
            content_range=None
            compression=False
            request_range=self.headers.get("Range")
            if request_range and request_range.startswith("bytes=") and "," not in request_range:
                parts=request_range[6:].split("-",1)
                begin=int(parts[0] or 0)
                end=min(int(parts[1]) if parts[1] else len(raw)-1,len(raw)-1)
                if begin> end or begin>=len(raw):
                    self.send_error(416)
                    return
                body=raw[begin:end+1]
                content_range=f"bytes {begin}-{end}/{len(raw)}"
            elif "gzip" in self.headers.get("Accept-Encoding","") and compressed is not None:
                body=compressed
                compression=True
            self.send_response(206 if content_range else 200)
            self.send_header("Content-Type",mime)
            self.send_header("Content-Length",str(len(body)))
            self.send_header("Cache-Control",cache_header)
            self.send_header("ETag",tag)
            self.send_header("Accept-Ranges","bytes")
            if compression:
                self.send_header("Content-Encoding","gzip")
                self.send_header("Vary","Accept-Encoding")
            if content_range:
                self.send_header("Content-Range",content_range)
            self.end_headers()
            if not head:
                try:
                    self.wfile.write(body)
                except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):
                    pass
    server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
    Thread(target=server.serve_forever,daemon=True).start()
    return server,f"http://127.0.0.1:{server.server_port}"


if __name__=="__main__":
    from threading import Event
    server,base=start_server()
    print(base,flush=True)
    try:
        Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown()
