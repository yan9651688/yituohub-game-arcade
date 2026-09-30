"""One strict HTTPS mobile integration flow, plus cheap media HEAD/Range checks."""
from __future__ import annotations

import argparse
import ipaddress
import json
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright
from integration_smoke import PROBE,audio_info
from static_fixture import ROOT


def first_visible(page,selector):
    choices=page.locator(selector)
    for i in range(choices.count()):
        if choices.nth(i).is_visible():return choices.nth(i)
    raise RuntimeError("No visible link: "+selector)


def visible_path_link(page,path):
    page.wait_for_load_state("load")
    choices=page.locator("a[href]")
    for i in range(choices.count()):
        candidate=choices.nth(i)
        if candidate.is_visible() and candidate.evaluate("(a,path)=>new URL(a.href,location.href).pathname===path",path):
            return candidate
    raise RuntimeError("No visible path link: "+path)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--base-url",default="https://game.yituohub.com")
    args=parser.parse_args();base=args.base_url.rstrip("/")
    output=ROOT/"qa"/"production-integration";output.mkdir(parents=True,exist_ok=True)
    result={"base_url":base,"viewport":[390,844],"ignore_https_errors":False}
    errors,console_errors,requests,responses,protocols=[],[],[],[],[]
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,args=["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"])
        context=browser.new_context(viewport={"width":390,"height":844},has_touch=True,is_mobile=True,ignore_https_errors=False)
        context.add_init_script(PROBE)
        page=context.new_page()
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.on("console",lambda message:console_errors.append(message.text) if message.type=="error" else None)
        page.on("request",lambda request:requests.append(request.url))
        page.on("response",lambda response:responses.append({"url":response.url,"status":response.status,"type":response.headers.get("content-type"),"cache_control":response.headers.get("cache-control"),"encoding":response.headers.get("content-encoding"),"range":response.headers.get("content-range")}))
        cdp=context.new_cdp_session(page);cdp.send("Network.enable")
        cdp.on("Network.responseReceived",lambda event:protocols.append(event["response"].get("protocol")))
        try:
            page.goto(base+"/",wait_until="load",timeout=60000)
            result["homepage_secure_context"]=page.evaluate("window.isSecureContext")
            page.screenshot(path=str(output/"homepage-mobile.png"))
            first_visible(page,'a[href="/film.html"]').tap()
            page.wait_for_url(base+"/film.html",timeout=60000)
            page.wait_for_function("!document.querySelector('#go').disabled",timeout=90000)
            result["film_ready_message"]=page.locator("#mstat").inner_text()
            page.locator("#go").tap()
            page.wait_for_function("__integrationAudio.some(a=>!a.paused&&a.readyState>=2)",timeout=10000)
            before=audio_info(page);result["audio_start"]=before
            page.wait_for_timeout(3300);result["audio"]=audio_info(page)
            result["audio_advanced"]=result["audio"]["audio"][0]["currentTime"]-before["audio"][0]["currentTime"]
            page.screenshot(path=str(output/"film-playing-mobile.png"))
            page.locator("#arcade-home-link").tap();page.wait_for_url(base+"/",timeout=20000)
            result["film_returned_url"]=page.url
            visible_path_link(page,"/games.html").tap();page.wait_for_url(base+"/games.html",timeout=20000)
            visible_path_link(page,"/games/fallen-frontier.html").tap();page.wait_for_url(base+"/games/fallen-frontier.html",timeout=30000)
            page.locator("#start").tap(timeout=20000);page.wait_for_timeout(800)
            result["game_started"]=page.evaluate("window.Frontier.snapshot().state")
            page.locator(".hud-tools .settings-open").tap();page.locator("#arcade-home-pause").wait_for(state="visible",timeout=10000)
            result["game_paused"]=page.evaluate("window.Frontier.snapshot().state")
            page.locator("#arcade-home-pause").tap();page.wait_for_url(base+"/",timeout=20000)
            result["game_returned_url"]=page.url
            media=[]
            for path in sorted((ROOT/"dist"/"assets"/"media").glob("*")):
                if not path.is_file():continue
                url=base+"/assets/media/"+path.name
                response=context.request.head(url,timeout=20000)
                media.append({"url":url,"status":response.status,"type":response.headers.get("content-type"),"cache_control":response.headers.get("cache-control"),"response_url":response.url})
            result["media_heads"]=media
            music=result["audio"]["audio"][0]["src"]
            response=context.request.get(music,headers={"Range":"bytes=0-31"},timeout=20000)
            result["audio_range"]={"status":response.status,"content_range":response.headers.get("content-range"),"cache_control":response.headers.get("cache-control"),"mime":response.headers.get("content-type"),"bytes":len(response.body()),"prefix":response.body()[:3].decode("ascii","replace")}
            insecure=[url for url in requests if url.startswith("http://")]
            ip=[]
            for url in requests:
                hostname=urlsplit(url).hostname
                if hostname:
                    try:
                        ipaddress.ip_address(hostname)
                    except ValueError:
                        continue
                    ip.append(url)
            bad=[r for r in responses if r["status"]>=400]
            result["passed"]=bool(result["homepage_secure_context"] and result["audio_advanced"]>=3 and not result["audio"]["rejected"] and not result["audio"]["audio"][0]["muted"]
                                  and result["game_started"]=="playing" and result["game_paused"]=="paused" and result["game_returned_url"]==base+"/"
                                  and len(media)==48 and all(m["status"]==200 and m["response_url"].startswith(base+"/") for m in media)
                                  and response.status==206 and len(response.body())==32 and not errors and not console_errors and not bad and not insecure and not ip)
            result["insecure_requests"],result["ip_requests"],result["bad_responses"]=insecure,ip,bad
        except Exception as error:
            result["exception"]=str(error);result["passed"]=False
        finally:
            result["page_errors"],result["console_errors"],result["responses"],result["protocols"]=errors,console_errors,responses,sorted(set(protocols))
            context.close();browser.close()
    (output/"results.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({k:result.get(k) for k in ["passed","audio_advanced","game_started","game_paused","film_returned_url","game_returned_url","protocols","audio_range","exception","page_errors","console_errors"]},ensure_ascii=True),flush=True)
    if not result["passed"]:
        raise SystemExit(1)


if __name__=="__main__":main()
