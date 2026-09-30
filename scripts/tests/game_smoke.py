"""Read-only desktop and touch browser smoke checks for the five HTML games."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from threading import Thread
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
GAMES = [
    {"slug": "fallen-frontier", "name": "星陨前线", "start": "#start", "menu": "#menu", "touch": "#joystick", "hud": "#hud"},
    {"slug": "iron-front", "name": "智械前线", "start": "#startBtn", "menu": "#home", "touch": "#world", "hud": "#hud"},
    {"slug": "neon-swarm", "name": "霓潮", "start": "#startBtn", "menu": "#home", "touch": "#stick", "hud": "#hud"},
    {"slug": "road-fury", "name": "公路狂徒", "start": "#start", "menu": "#menu", "touch": ".touch-button[data-touch='ArrowRight']", "hud": "#hud"},
    {"slug": "thunderwing", "name": "雷霆战翼", "start": "#start-btn", "menu": "#intro", "touch": "#game", "hud": ".field-hud"},
]

INSTRUMENT = """(() => {
  window.__deploymentQA = {raf: 0, touch: 0, lastTouch: null, errors: []};
  const original = window.requestAnimationFrame;
  window.requestAnimationFrame = function (callback) {
    return original.call(window, function (time) {
      window.__deploymentQA.raf++;
      return callback(time);
    });
  };
  window.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {window.__deploymentQA.touch++; window.__deploymentQA.lastTouch = e.target.id || e.target.className;}
  }, true);
  window.addEventListener('unhandledrejection', e => window.__deploymentQA.errors.push(String(e.reason)));
})()"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            # Navigating away cancels in-flight browser asset requests.
            pass


def snapshot(page, game):
    return page.evaluate("""(game) => {
      const get = selector => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect(), s = getComputedStyle(el);
        return {visible: !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0,
          text: el.innerText.slice(0, 220), bounds: {x:r.x,y:r.y,width:r.width,height:r.height},
          disabled: !!el.disabled};
      };
      let engine=null;
      try {
        if (game.slug==='fallen-frontier' && typeof player!=='undefined')
          engine={state,time:simTime,position:player?{x:player.x,z:player.z}:null,touchMove:typeof touchMove!=='undefined'?touchMove:null};
        if (game.slug==='iron-front') {const s=window.ironFront?.snapshot();if(s)engine={state:s.state,time:s.t,position:{x:s.x},targetX:s.targetX,distance:s.dist};}
        if (game.slug==='road-fury') {const s=window.ROAD_FURY?.snapshot();if(s)engine={state:s.mode,time:s.time,distance:s.distance,speed:s.speed,position:{x:window.ROAD_FURY.test?.player.x},rightPressed:!!window.ROAD_FURY.test?.keys.ArrowRight};}
        if (game.slug==='neon-swarm') {const s=window.__SWARM_TEST__?.snapshot();if(s)engine={state:s.state,time:s.elapsed,position:s.position};}
        if (game.slug==='thunderwing') {const s=window.__TW?.snapshot();if(s)engine={state:s.mode,time:s.time,position:{x:s.player.x,y:s.player.y},target:{x:s.player.tx,y:s.player.ty}};}
      } catch(e) {engine={unavailable:String(e)};}
      return {engine,raf:window.__deploymentQA.raf, touch:window.__deploymentQA.touch,
        lastTouch:window.__deploymentQA.lastTouch, rejections:window.__deploymentQA.errors.slice(),
        menu:get(game.menu), hud:get(game.hud), controls:get(game.touch),
        fatal:Array.from(document.querySelectorAll('#fatal,#error,.error')).map(el => {
          const r=el.getBoundingClientRect(),s=getComputedStyle(el);
          return {visible:!el.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0,text:el.innerText.slice(0,400)};
        }).filter(item=>item.visible),
        pointerLocked:!!document.pointerLockElement,
        canvas:Array.from(document.querySelectorAll('canvas')).map(c=>({id:c.id,width:c.width,height:c.height})),
        hudText:document.querySelector(game.hud)?.innerText.slice(0,450) || ''};
    }""", game)


def within_viewport(box, width, height):
    return bool(box and box["width"] > 0 and box["height"] > 0
                and box["x"] >= -1 and box["y"] >= -1
                and box["x"] + box["width"] <= width + 1
                and box["y"] + box["height"] <= height + 1)


def run_game(browser, game, base, output, mobile):
    mode = "mobile" if mobile else "desktop"
    viewport = {"width": 390, "height": 844} if mobile else {"width": 1440, "height": 900}
    context = browser.new_context(viewport=viewport, device_scale_factor=1,
                                  has_touch=mobile, is_mobile=mobile)
    page = context.new_page()
    page.add_init_script(INSTRUMENT)
    errors, console_errors, failed_requests = [], [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.on("requestfailed", lambda request: failed_requests.append({"url": request.url, "reason": request.failure}))
    url = f"{base.rstrip('/')}/games/{game['slug']}.html?test=1&qa=1"
    result = {"game": game["name"], "slug": game["slug"], "mode": mode, "url": url, "viewport": viewport}
    try:
        response = page.goto(url, wait_until="load", timeout=60000)
        result["status"] = response.status if response else None
        page.wait_for_timeout(1400)
        start = page.locator(game["start"])
        start.wait_for(state="visible", timeout=15000)
        start_box = start.bounding_box()
        result["initial"] = snapshot(page, game)
        result["start_bounds"] = start_box
        result["start_in_viewport"] = within_viewport(start_box, **viewport)
        prefix = f"{game['slug']}-{mode}"
        page.screenshot(path=str(output / f"{prefix}-initial.png"))
        start.click(timeout=20000)
        page.wait_for_timeout(1800)
        if game["slug"] == "road-fury":
            page.wait_for_function("window.ROAD_FURY?.snapshot().mode === 'running'", timeout=15000)
        result["after_start"] = snapshot(page, game)
        if mobile:
            target = page.locator(game["touch"]).first
            target.wait_for(state="visible", timeout=5000)
            box = target.bounding_box()
            result["touch_bounds"] = box
            result["touch_in_viewport"] = within_viewport(box, **viewport)
            x, y = box["x"] + box["width"] * .5, box["y"] + box["height"] * .5
            cdp = context.new_cdp_session(page)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
            page.wait_for_timeout(150)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": min(385, x + 20), "y": max(5, y - 20)}]})
            page.wait_for_timeout(650)
            result["while_touching"] = snapshot(page, game)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        else:
            key = "ArrowRight" if game["slug"] in {"iron-front", "road-fury"} else "KeyD"
            page.keyboard.down(key)
            page.wait_for_timeout(850)
            result["while_key_down"] = snapshot(page, game)
            page.keyboard.up(key)
        first = page.screenshot(path=str(output / f"{prefix}-running-1.png"))
        page.wait_for_timeout(4000)
        second = page.screenshot(path=str(output / f"{prefix}-running-2.png"))
        result["final"] = snapshot(page, game)
        result["changed_pixels"] = hashlib.sha256(first).hexdigest() != hashlib.sha256(second).hexdigest()
        result["raf_progress"] = result["final"]["raf"] - result["after_start"]["raf"]
        result["menu_hidden_after_start"] = result["after_start"]["menu"] is None or not result["after_start"]["menu"]["visible"]
        result["passed"] = bool(result["status"] == 200 and result["menu_hidden_after_start"]
                                and result["raf_progress"] > 2 and result["changed_pixels"]
                                and not errors and not result["final"]["fatal"]
                                and not result["final"]["rejections"]
                                and (not mobile or result["final"]["touch"] > 0))
    except Exception as error:
        result["exception"] = str(error)
        result["passed"] = False
        try:
            page.screenshot(path=str(output / f"{game['slug']}-{mode}-failure.png"))
        except Exception:
            pass
    finally:
        result["page_errors"], result["console_errors"], result["request_failures"] = errors, console_errors, failed_requests
        context.close()
    print(json.dumps({key: result.get(key) for key in ("slug", "mode", "passed", "exception", "raf_progress", "changed_pixels", "start_in_viewport", "touch_in_viewport", "page_errors", "console_errors")}, ensure_ascii=True), flush=True)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url")
    parser.add_argument("--output", default="game-smoke")
    parser.add_argument("--desktop-only", action="store_true")
    parser.add_argument("--mobile-only", action="store_true")
    parser.add_argument("--only", choices=[game["slug"] for game in GAMES])
    args = parser.parse_args()
    output = ROOT / "qa" / args.output
    output.mkdir(parents=True, exist_ok=True)
    server = None
    base = args.base_url
    if not base:
        handler = partial(QuietHandler, directory=str(ROOT / "public"))
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}"
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True,
            args=["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"])
        for game in GAMES:
            if args.only and game["slug"] != args.only:
                continue
            for mobile in ([False] if args.desktop_only else [True] if args.mobile_only else [False, True]):
                results.append(run_game(browser, game, base, output, mobile))
                (output / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
        browser.close()
    if server:
        server.shutdown()
    print(json.dumps({"total": len(results), "passed": sum(r["passed"] for r in results), "results": str(output / "results.json")}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()
