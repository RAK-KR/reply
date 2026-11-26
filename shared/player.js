// 1인칭 이동과 시점 (걸을 수 있는 구역과 문을 room.js에서 받는다)
import * as THREE from 'three';

const EYE = 1.6, RADIUS = 0.24, SPEED = 1.9;

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3(-2.4, EYE, 1.9);
    this.yaw = 0;
    this.pitch = -0.05;
    this.keys = {};
    this.areas = [];       // { x0, x1, z0, z1, open?: () => bool }
    this.colliders = [];   // { x0, x1, z0, z1 }
    this.seat = null;      // 앉았을 때 눈 위치 (Vector3)
    this.seatYaw = Math.PI;
    this.sitting = false;
    this.sitT = 0;
    this.bob = 0;
    this.sensitivity = 1;
    this.onStep = null;
    this.stepAcc = 0;
    this.locked = false;
    this.frozen = false;

    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || this.frozen) return;
      const s = 0.0022 * this.sensitivity;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      const lim = this.sitting ? 0.9 : 1.45;
      this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
      if (this.sitting) this.yaw = Math.max(this.seatYaw - 1.3, Math.min(this.seatYaw + 1.3, this.yaw));
    });
  }

  walkable(x, z) {
    const r = RADIUS;
    let inside = false;
    for (const a of this.areas) {
      if (a.open && !a.open()) continue;
      const m = a.tight ? 0 : r;
      if (x > a.x0 + m && x < a.x1 - m && z > a.z0 + m && z < a.z1 - m) { inside = true; break; }
    }
    if (!inside) return false;
    for (const c of this.colliders) {
      if (c.off && c.off()) continue;
      if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return false;
    }
    return true;
  }

  sit(seatEye, yaw) {
    this.sitting = true;
    this.seat = seatEye.clone();
    this.seatYaw = yaw;
    this.yaw = yaw;
    this.pitch = 0.02;
  }

  stand(x, z) {
    this.sitting = false;
    this.pos.set(x, EYE, z);
  }

  update(dt) {
    const k = this.keys;
    if (!this.sitting && !this.frozen) {
      let fx = 0, fz = 0;
      if (k.KeyW || k.ArrowUp) fz -= 1;
      if (k.KeyS || k.ArrowDown) fz += 1;
      if (k.KeyA || k.ArrowLeft) fx -= 1;
      if (k.KeyD || k.ArrowRight) fx += 1;
      const len = Math.hypot(fx, fz);
      if (len > 0) {
        fx /= len; fz /= len;
        const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
        const dx = (fx * cos + fz * sin) * SPEED * dt;
        const dz = (-fx * sin + fz * cos) * SPEED * dt;
        const before = this.pos.clone();
        if (this.walkable(this.pos.x + dx, this.pos.z)) this.pos.x += dx;
        if (this.walkable(this.pos.x, this.pos.z + dz)) this.pos.z += dz;
        const moved = before.distanceTo(this.pos);
        this.bob += moved * 9;
        this.stepAcc += moved;
        if (this.stepAcc > 0.62) { this.stepAcc = 0; this.onStep && this.onStep(); }
      }
    }
    this.sitT += ((this.sitting ? 1 : 0) - this.sitT) * Math.min(1, dt * 5);
    const standEye = new THREE.Vector3(this.pos.x, EYE + Math.sin(this.bob) * 0.018, this.pos.z);
    const eye = this.seat ? standEye.lerp(this.seat, this.sitT) : standEye;
    this.camera.position.copy(eye);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
