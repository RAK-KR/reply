"""3~5편 자동 플레이 공통 도구"""
import os, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

class Tester:
    def __init__(self, root, three, out, page_path):
        self.out = out; os.makedirs(out, exist_ok=True)
        Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
        Handler.log_message = lambda *a: None
        socketserver.TCPServer.allow_reuse_address = True
        self.httpd = socketserver.TCPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        self.errors, self.fails = [], []
        self.p = sync_playwright().start()
        self.b = self.p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'])
        pg = self.pg = self.b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('console', lambda m: self.errors.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: self.errors.append(str(e)))
        pg.route('**/unpkg.com/three@0.160.0/build/three.module.js', lambda r: r.fulfill(path=three, content_type='application/javascript'))
        jsm = os.path.join(os.path.dirname(os.path.dirname(three)), 'examples', 'jsm')
        pg.route('**/unpkg.com/three@0.160.0/examples/jsm/**', lambda r: r.fulfill(path=os.path.join(jsm, r.request.url.split('/examples/jsm/')[1]), content_type='application/javascript'))
        pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
        pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
        pg.add_init_script("localStorage.setItem('reply-unlock-all','1')")
        pg.goto(f'http://127.0.0.1:{self.httpd.server_address[1]}/{page_path}')
        pg.wait_for_function('window.__game', timeout=60000)
        pg.wait_for_timeout(800)
        self.shot('00_title')
        pg.click('#start'); pg.wait_for_timeout(1500)
        pg.evaluate('window.__skipIntro()')
        pg.evaluate('window.__game.link.fast = true')
        self.lock(); pg.wait_for_timeout(600)
        self.shot('01_start')

    def check(self, cond, msg):
        print(('PASS  ' if cond else 'FAIL  ') + msg)
        if not cond: self.fails.append(msg)
    def shot(self, name, full=False): self.pg.screenshot(path=f'{self.out}/{name}.png', full_page=full)
    def lock(self): self.pg.evaluate('window.__game.player.locked = true')
    def wait(self, ms): self.pg.wait_for_timeout(ms)
    def state(self, expr): return self.pg.evaluate(f'window.__game.S.{expr}')
    def goto(self, x, z): self.pg.evaluate(f'(() => {{ const P = window.__game.player; P.pos.x = {x}; P.pos.z = {z}; }})()')
    def aim(self, tx, ty, tz):
        self.pg.evaluate(f'''(() => {{
            const P = window.__game.player;
            const ey = P.sitting ? P.seat.y : 1.6;
            const ex = P.sitting ? P.seat.x : P.pos.x, ez = P.sitting ? P.seat.z : P.pos.z;
            const dx = {tx} - ex, dy = {ty} - ey, dz = {tz} - ez;
            P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
        }})()''')
        self.wait(200)
    def use(self, expected, shot=None, close=True):
        h = self.pg.evaluate('window.__game.hovered')
        self.check(h == expected, f'조준 → {expected} (실제: {h})')
        self.pg.keyboard.press('KeyE'); self.wait(700)
        if shot: self.shot(shot)
        if close: self.esc()
    def esc(self):
        if self.pg.evaluate('window.__game.ui.open'):
            self.pg.keyboard.press('Escape'); self.wait(300)
        self.lock()
    def btn(self, i):
        self.pg.evaluate(f"document.querySelectorAll('#panel-buttons button')[{i}].click()"); self.wait(500)
    def pbtn(self, label):
        ok = self.pg.evaluate('''(l) => { const b = [...document.querySelectorAll('#panel button')].find((x) => x.textContent.includes(l)); if (b) b.click(); return !!b; }''', label)
        self.check(ok, f'버튼 [{label}]'); self.wait(450)
    def send(self, label):
        self.wait_link()
        ok = self.pg.evaluate('''(l) => { const b = [...document.querySelectorAll('.term-sends button')].find((x) => x.textContent.includes(l)); if (b) b.click(); return !!b; }''', label)
        self.check(ok, f'보내기 [{label}]'); self.wait(300); self.wait_link()
    def wait_link(self):
        for _ in range(100):
            if not self.pg.evaluate('window.__game.link.waiting'): break
            self.wait(100)
        self.wait(300)
    def last(self): return self.pg.evaluate('window.__game.link.log.slice(-1)[0]?.text || ""')
    def keys(self, s, enter=True):
        for k in s: self.pg.keyboard.press(k)
        if enter: self.pg.keyboard.press('Enter')
        self.wait(900)
    def cleared(self): return self.pg.evaluate("JSON.parse(localStorage.getItem('reply-cleared') || '[]')")
    def end(self):
        self.b.close(); self.p.stop(); self.httpd.shutdown()
        real = [e for e in self.errors if 'fonts' not in e and 'ERR_FAILED' not in e]
        self.check(not real, '콘솔 에러 없음' + (': ' + ' | '.join(real[:5]) if real else ''))
        print(f'\n실패 {len(self.fails)}건' if self.fails else '\n자동 플레이 전부 통과')
