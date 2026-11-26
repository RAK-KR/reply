"""4편 자동 플레이"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shared'))
from playtest_core import Tester
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
t = Tester(ROOT, sys.argv[1], sys.argv[2], 'ep4/index.html')
VX = lambda i: 2.0 + i * 0.52
ORDER = ['V4', 'V1', 'V6', 'V2', 'V5', 'V3']
def valve(v):
    i = ORDER.index(v); t.goto(VX(i), -2.9); t.aim(VX(i), 1.3, -3.6); t.use('valve_' + v)
t.goto(-4.3, 1.5); t.aim(-4.93, 1.4, 1.5); t.use('breaker'); t.check(t.state('power'), '전원')
t.goto(-2.9, -1.6); t.aim(-2.9, 0.6, -2.3); t.use('generator', '02_fuel')
t.goto(-1.2, -2.0); t.aim(-1.2, 0.05, -3.0); t.use('b4hatch'); t.wait(1200); t.shot('03_flooded')
t.goto(0.55, 2.2); t.aim(0.55, 0.6, 3.3); t.use('printer', '04_roll')
t.goto(-0.2, 2.6); t.aim(-0.2, 1.0, 3.42); t.use('t4', close=False); t.wait_link()
t.send('물에 잠겨'); t.send('9107'); t.shot('05_chat'); t.esc()
t.goto(0.55, 2.2); t.aim(0.55, 0.6, 3.3); t.use('printer', '06_roll_live')
t.goto(3.9, 2.3); t.aim(4.55, 1.2, 2.3); t.use('mlocker', close=False); t.keys('9504'); t.check(not t.state('lockerOpen'), '9504 오답')
t.keys('9107'); t.wait(800); t.check(t.state('lockerOpen'), '사물함 열림'); t.btn(0); t.wait(300); t.shot('07_mnote'); t.esc()
t.goto(-0.2, -2.9); t.aim(-0.2, 1.6, -3.96); t.use('schem', '08_schem')
t.goto(1.2, -2.4); t.aim(1.2, 1.4, -3.92); t.use('pumpbox', '09_pump_wrong')
t.check(not t.state('drained'), '처음 밸브로는 안 빠짐')
for v in ['V1', 'V3', 'V4']: valve(v)
t.goto(1.2, -2.4); t.aim(1.2, 1.4, -3.92); t.use('pumpbox'); t.check(not t.state('drained'), 'V5가 열려 있으면 안 빠짐')
valve('V5')
t.goto(2.5, -1.5); t.aim(3.2, 1.3, -3.6); t.shot('10_valves')
t.goto(1.2, -2.4); t.aim(1.2, 1.4, -3.92); t.use('pumpbox'); t.check(t.state('drained'), '물이 빠짐')
t.wait(4000); t.goto(-1.2, -2.0); t.aim(-1.2, 0.05, -3.0); t.shot('11_drained'); t.use('b4hatch'); t.wait(5000)
t.check(t.state('done'), '지하 4층으로'); t.shot('12_ending')
t.goto(0, 0); t.check(4 in t.cleared(), '4편 완료 기록')
t.end()
