# Historical v1.0.0 tooling; paths and selectors predate the current portal.
"""Compare cold, unchanged revisit, and code-revision media-cache behavior.

The local fixture is HTTP/1.1 with gzip. Browser networking is throttled to a
fixed 10 Mbps and 40 ms latency; this is not production user-capacity testing.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from playwright.sync_api import sync_playwright
from static_fixture import ROOT,start_server

CASES=[("neon","/games/neon-swarm.html"),("road","/games/road-fury.html"),("film","/film.html")]
PROBE="""(()=>{window.__benchMedia=[];const p=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...a){if(!__benchMedia.includes(this))__benchMedia.push(this);return p.apply(this,a)}})()"""


def ready(page,kind):
    if kind=="neon":
        page.wait_for_function("window.__MOTION_TEST__ && !document.querySelector('#startBtn').disabled && window.__MOTION_TEST__.status().ready",timeout=60000)
    elif kind=="road":
        page.wait_for_function("window.ROAD_FURY && document.querySelector('#start') && !document.querySelector('#start').disabled",timeout=30000)
    else:
        page.wait_for_function("!document.querySelector('#go').disabled",timeout=60000)


def run(browser,mode,base,kind,path):
    context=browser.new_context(viewport={"width":1440,"height":900})
    page=context.new_page()
    page.add_init_script(PROBE)
    cdp=context.new_cdp_session(page)
    cdp.send("Network.enable")
    cdp.send("Performance.enable")
    cdp.send("Network.emulateNetworkConditions",{"offline":False,"latency":40,"downloadThroughput":1250000,"uploadThroughput":250000})
    requests={}
    current=[]
    cdp.on("Network.requestWillBeSent",lambda event:requests.update({event["requestId"]:{"url":event["request"]["url"],"type":event.get("type")}}))
    def receive(event):
        record=requests.get(event["requestId"],{}).copy()
        record.update({"encoded_bytes":event["encodedDataLength"]})
        current.append(record)
    cdp.on("Network.loadingFinished",receive)
    outcomes=[]
    for visit in ["cold","unchanged-revisit","code-revision"]:
        current.clear()
        revision="2" if visit=="code-revision" else "1"
        url=base+path+"?test=1&revision="+revision
        started=time.monotonic()
        page.goto(url,wait_until="load",timeout=120000)
        ready(page,kind)
        ready_seconds=time.monotonic()-started
        page.wait_for_load_state("networkidle",timeout=30000)
        cdp.send("Runtime.evaluate",{"expression":"0"})
        performance=page.evaluate("""()=>({navigation:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize,transferSize:r.transferSize,duration:r.duration})),heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null})""")
        metrics={m["name"]:m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
        media=[r for r in current if "/assets/media/" in r.get("url","")]
        network=[r for r in current if r.get("url","").startswith("http")]
        outcome={"mode":mode,"case":kind,"visit":visit,"ready_seconds":round(ready_seconds,3),
                 "navigation_encoded_body_bytes":performance["navigation"]["encodedBodySize"],
                 "navigation_response_end_ms":performance["navigation"]["responseEnd"],
                 "total_network_encoded_bytes":sum(r["encoded_bytes"] for r in network),
                 "media_network_encoded_bytes":sum(r["encoded_bytes"] for r in media),
                 "media_requests":len(media),"cached_media_resources":sum(1 for r in performance["resources"] if "/assets/media/" in r["name"] and r["transferSize"]==0),
                 "script_duration_seconds":metrics.get("ScriptDuration"),"js_heap_used_bytes":metrics.get("JSHeapUsedSize"),
                 "resources":performance["resources"],"network":network}
        outcomes.append(outcome)
        print(json.dumps({k:outcome[k] for k in ["mode","case","visit","ready_seconds","navigation_encoded_body_bytes","navigation_response_end_ms","total_network_encoded_bytes","media_network_encoded_bytes","cached_media_resources"]}),flush=True)
    context.close()
    return outcomes


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--only",choices=[c[0] for c in CASES])
    parser.add_argument("--output",default="resource-benchmark")
    args=parser.parse_args()
    output=ROOT/"qa"/args.output
    output.mkdir(parents=True,exist_ok=True)
    results=[]
    servers={mode:start_server(mode) for mode in ["baseline","optimized"]}
    try:
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,args=["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"])
            for kind,path in CASES:
                if args.only and args.only!=kind:continue
                for mode,(server,base) in servers.items():
                    results.extend(run(browser,mode,base,kind,path))
                    (output/"results.json").write_text(json.dumps({"profile":{"download_mbps":10,"latency_ms":40,"viewport":[1440,900],"renderer":"Chromium headless SwiftShader","fixture":"local gzip HTTP/1.1"},"results":results},ensure_ascii=False,indent=2),encoding="utf-8")
            browser.close()
    finally:
        for server,base in servers.values():server.shutdown()
    print(json.dumps({"completed":len(results),"results":str(output/"results.json")}),flush=True)


if __name__=="__main__":
    main()
