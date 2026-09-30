"""Compiled asset links, five game starts, and film exits with real media time."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from playwright.sync_api import sync_playwright
from game_smoke import GAMES, INSTRUMENT, snapshot
from static_fixture import ROOT, start_server

PROBE="""(()=>{window.__integrationAudio=[];window.__integrationRejected=[];const f=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){if(!__integrationAudio.includes(this))__integrationAudio.push(this);return f.apply(this,a)};window.addEventListener('unhandledrejection',e=>__integrationRejected.push(String(e.reason)))})()"""


def audio_info(page):
    return page.evaluate("""()=>({audio:__integrationAudio.map(a=>({src:a.currentSrc,currentTime:a.currentTime,duration:a.duration,paused:a.paused,muted:a.muted,volume:a.volume,error:a.error?{code:a.error.code,message:a.error.message}:null})),rejected:__integrationRejected})""")


def film_link(page):
    return page.evaluate("""()=>{const a=document.querySelector('#arcade-home-link'),r=a.getBoundingClientRect(),p=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);const overlaps=[];for(const b of document.querySelectorAll('#go,#free,#again,#fv button')){const q=b.getBoundingClientRect(),s=getComputedStyle(b);if(s.display==='none'||q.width===0||q.height===0)continue;const n=Math.max(0,Math.min(r.right,q.right)-Math.max(r.left,q.left))*Math.max(0,Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top));if(n>1)overlaps.push({id:b.id,text:b.textContent,area:n})}return {href:a.getAttribute('href'),visible:r.width>0&&r.height>0,within:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:p===a||a.contains(p),rect:{x:r.x,y:r.y,width:r.width,height:r.height},overlaps}}""")


def run_film(browser,base,output,mobile):
    mode="mobile" if mobile else "desktop"
    context=browser.new_context(viewport={"width":390 if mobile else 1440,"height":844 if mobile else 900},has_touch=mobile,is_mobile=mobile)
    context.add_init_script(PROBE)
    page=context.new_page()
    errors,console_errors,responses=[],[],[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.on("console",lambda message:console_errors.append(message.text) if message.type=="error" else None)
    page.on("response",lambda response:responses.append({"url":response.url,"status":response.status}))
    results=[]
    for state in ["menu","directed","free"]:
        result={"kind":"film","viewport":mode,"state":state}
        try:
            page.goto(base+"/film.html",wait_until="load",timeout=60000)
            page.wait_for_function("!document.querySelector('#go').disabled",timeout=90000)
            result["ready_message"]=page.locator("#mstat").inner_text()
            if state!="menu":
                button=page.locator("#go" if state=="directed" else "#free")
                button.tap() if mobile else button.click()
                page.wait_for_function("__integrationAudio.some(a=>!a.paused&&a.readyState>=2)",timeout=10000)
                before=audio_info(page)
                page.wait_for_timeout(3300)
                result["audio"]=audio_info(page)
                result["audio_advanced"]=result["audio"]["audio"][0]["currentTime"]-before["audio"][0]["currentTime"]
                if state=="free":
                    result["free_panel_visible"]=page.locator("#fv").is_visible()
            result["link"]=film_link(page)
            page.screenshot(path=str(output/f"film-{mode}-{state}.png"))
            link=page.locator("#arcade-home-link")
            link.tap() if mobile else link.click()
            page.wait_for_url(base+"/",timeout=15000)
            page.wait_for_load_state("load",timeout=30000)
            result["returned_url"]=page.url
            result["passed"]=bool(result["link"]["href"]=="/" and result["link"]["within"] and result["link"]["hit"] and not result["link"]["overlaps"]
                                  and (state=="menu" or result["audio_advanced"]>=3 and not result["audio"]["rejected"] and not result["audio"]["audio"][0]["error"] and not result["audio"]["audio"][0]["muted"])
                                  and not errors and not console_errors)
        except Exception as error:
            result["exception"]=str(error);result["passed"]=False
        results.append(result)
        print(json.dumps({k:result.get(k) for k in ["kind","viewport","state","passed","audio_advanced","exception"]}),flush=True)
    for result in results:
        result["page_errors"]=errors;result["console_errors"]=console_errors
        result["bad_responses"]=[r for r in responses if r["status"]>=400]
        if result["bad_responses"]:result["passed"]=False
    context.close()
    return results


def run_games(browser,base):
    results=[]
    for game in GAMES:
        context=browser.new_context(viewport={"width":1440,"height":900})
        page=context.new_page();page.add_init_script(INSTRUMENT)
        errors=[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.on("console",lambda message:errors.append(message.text) if message.type=="error" else None)
        result={"kind":"game","slug":game["slug"]}
        try:
            page.goto(base+f"/games/{game['slug']}.html?test=1&qa=1",wait_until="load",timeout=60000)
            page.locator(game["start"]).click(timeout=30000)
            if game["slug"]=="road-fury":page.wait_for_function("window.ROAD_FURY.snapshot().mode==='running'",timeout=15000)
            page.wait_for_timeout(1200)
            result["snapshot"]=snapshot(page,game)
            result["packs"]=page.evaluate("""()=>{const a=window.__ART_TEST__?.status(),m=window.__MOTION_TEST__?.status();return {art:a?{ready:a.ready,failed:a.failed,count:a.count}:null,motion:m?{ready:m.ready,failed:m.failed,count:m.count}:null}}""")
            result["passed"]=bool(not errors and not result["snapshot"]["fatal"] and not result["snapshot"]["menu"]["visible"] and result["snapshot"]["raf"]>2)
            if game["slug"]=="neon-swarm":result["passed"]=result["passed"] and result["packs"]["art"]["ready"] and result["packs"]["motion"]["ready"]
        except Exception as error:
            result["exception"]=str(error);result["passed"]=False
        result["errors"]=errors;results.append(result);context.close()
        print(json.dumps({k:result.get(k) for k in ["kind","slug","passed","exception"]}),flush=True)
    return results


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--web-root",type=Path,default=ROOT/"dist")
    parser.add_argument("--base-url")
    parser.add_argument("--output",default="compiled-integration")
    parser.add_argument("--film-only",action="store_true")
    args=parser.parse_args()
    output=ROOT/"qa"/args.output;output.mkdir(parents=True,exist_ok=True)
    integrity=[]
    for path in (args.web_root/"assets"/"media").glob("*"):
        if path.is_file():integrity.append({"file":path.name,"passed":hashlib.sha256(path.read_bytes()).hexdigest()==path.stem})
    server=None
    base=args.base_url
    if not base:server,base=start_server(web_root=args.web_root)
    results=[]
    try:
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,args=["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"])
            if not args.film_only:results.extend(run_games(browser,base))
            for mobile in [False,True]:results.extend(run_film(browser,base,output,mobile))
            browser.close()
    finally:
        if server:server.shutdown()
    report={"media_integrity":integrity,"results":results,"passed":sum(r["passed"] for r in results),"total":len(results)}
    (output/"results.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"passed":report["passed"],"total":report["total"],"media_integrity_passed":sum(i["passed"] for i in integrity),"results":str(output/"results.json")}),flush=True)


if __name__=="__main__":main()
