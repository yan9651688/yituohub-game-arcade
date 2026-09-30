from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading,json
root=Path(__file__).resolve().parent.parent
source=root/'public'
target=root/'public/assets/previews';target.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(source)))
threading.Thread(target=server.serve_forever,daemon=True).start()
cases=[('fallen-frontier','start'),('iron-front','startBtn'),('neon-swarm','startBtn'),('road-fury','start'),('thunderwing','start-btn')]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--enable-unsafe-swiftshader'])
 for slug,button in cases:
  page=browser.new_page(viewport={'width':1200,'height':675},device_scale_factor=1)
  page.goto(f'http://127.0.0.1:{server.server_port}/games/{slug}.html',wait_until='networkidle',timeout=60000)
  page.locator('#'+button).wait_for(state='visible',timeout=60000)
  page.wait_for_function('(id)=>!document.getElementById(id).disabled',arg=button,timeout=60000)
  page.locator('#'+button).click()
  page.wait_for_timeout(6500 if slug=='road-fury' else 2500)
  page.screenshot(path=str(target/(slug+'.jpg')),type='jpeg',quality=78)
  page.close()
  print(json.dumps({'preview':slug,'bytes':(target/(slug+'.jpg')).stat().st_size}),flush=True)
 browser.close()
server.shutdown()
