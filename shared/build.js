// 방을 짓는 공통 도구 (3~5편)
import * as THREE from 'three';
import * as T from './textures.js';

export function makeKit(scene) {
  const colliders = [];
  const hitMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const add = (mesh, x, y, z, parent = scene) => {
    mesh.position.set(x, y, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const kit = {
    THREE, T, colliders, scene,
    std: (o) => new THREE.MeshStandardMaterial(o),
    tex: (c) => T.canvasTexture(c),
    add,
    box: (w, h, d, mat, x, y, z, parent) => add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z, parent),
    cyl: (rt, rb, h, mat, x, y, z, parent, seg = 24) => add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat), x, y, z, parent),
    sphere: (r, mat, x, y, z, parent) => add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat), x, y, z, parent),
    plane(w, h, mat, x, y, z, ry = 0, rx = 0, parent) {
      // 얇은 면도 양쪽 다 그림자를 막게 해서 벽·천장 틈으로 빛이 새지 않게 한다
      if (mat.shadowSide !== THREE.DoubleSide && !mat.transparent) mat.shadowSide = THREE.DoubleSide;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.rotation.set(rx, ry, 0);
      return add(m, x, y, z, parent);
    },
    canvasPlane(c, w, h, x, y, z, ry = 0, rough = 0.85, parent) {
      const m = kit.plane(w, h, new THREE.MeshStandardMaterial({ map: T.canvasTexture(c), roughness: rough, transparent: true }), x, y, z, ry, 0, parent);
      m.castShadow = false;
      return m;
    },
    glowPlane(c, w, h, x, y, z, ry = 0, parent) {
      const m = kit.plane(w, h, new THREE.MeshBasicMaterial({ map: T.canvasTexture(c), toneMapped: false }), x, y, z, ry, 0, parent);
      m.castShadow = false;
      return m;
    },
    hit(id, w, h, d, x, y, z) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
      m.position.set(x, y, z); m.userData.id = id; scene.add(m);
      return m;
    },
    tag(obj, id) { obj.traverse((o) => { o.userData.id = id; }); return obj; },
    collide(x0, x1, z0, z1, off) { colliders.push({ x0, x1, z0, z1, off }); },
    repeat(mat, rx, ry) { const m = mat.clone(); m.map = mat.map.clone(); m.map.repeat.set(rx, ry); m.map.needsUpdate = true; return m; },
    // 벽 한 조각. facing: 벽이 바라보는 방향 (방 안쪽) n/s/e/w. split: 아래 재질 높이
    wall(a, b, y0, y1, fixed, facing, upper, lower = null, split = 1.0) {
      const len = b - a, mid = (a + b) / 2;
      const ry = { s: Math.PI, n: 0, e: Math.PI / 2, w: -Math.PI / 2 }[facing];
      const put = (yy0, yy1, mat) => {
        if (yy1 <= yy0 + 0.001) return;
        const m = kit.repeat(mat, Math.max(0.3, len / 1.2), Math.max(0.2, (yy1 - yy0) / 0.8));
        const hh = yy1 - yy0;
        // 모서리가 살짝 겹치게 (틈으로 빛이 새지 않도록)
        if (facing === 'n' || facing === 's') kit.plane(len + 0.04, hh + 0.02, m, mid, (yy0 + yy1) / 2, fixed, ry);
        else kit.plane(len + 0.04, hh + 0.02, m, fixed, (yy0 + yy1) / 2, mid, ry);
      };
      if (!lower) { put(y0, y1, upper); return; }
      put(y0, Math.min(y1, split), lower);
      put(Math.max(y0, split), y1, upper);
    },
    floor(x0, x1, z0, z1, mat, y = 0) { return kit.plane(x1 - x0 + 0.04, z1 - z0 + 0.04, mat, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, -Math.PI / 2); },
    ceiling(x0, x1, z0, z1, mat, y) { return kit.plane(x1 - x0 + 0.04, z1 - z0 + 0.04, mat, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, Math.PI / 2); },
    // 문 (경첩 그룹). 반환된 pivot의 rotation.y로 연다
    door(x, z, axis, width, mat, id, handleMat) {
      const pivot = new THREE.Group();
      const d = new THREE.Group();
      if (axis === 'x') { kit.box(width, 2.03, 0.05, mat, width / 2, 1.015, 0, d); kit.box(0.12, 0.03, 0.05, handleMat || mat, width - 0.1, 1.0, 0.04, d); }
      else { kit.box(0.05, 2.03, width, mat, 0, 1.015, -width / 2, d); kit.box(0.05, 0.03, 0.12, handleMat || mat, -0.04, 1.0, -width + 0.1, d); }
      pivot.add(d);
      pivot.position.set(x, 0, z);
      scene.add(pivot);
      kit.tag(pivot, id);
      return pivot;
    },
    // dist: 빛이 닿는 거리 (그림자 없는 등이 벽 너머 옆방까지 비추지 않게)
    pointLight(color, intensity, x, y, z, shadow = false, size = 512, dist = 7) {
      const l = new THREE.PointLight(color, intensity, dist, 1.6);
      l.position.set(x, y, z);
      if (shadow) { l.castShadow = true; l.shadow.mapSize.set(size, size); l.shadow.bias = -0.002; l.shadow.radius = 3; }
      scene.add(l);
      return l;
    },
    bulb(x, y, z, color = 0xffd08a, intensity = 4.5, shadow = false) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: color, emissiveIntensity: 3 });
      const b = kit.sphere(0.045, mat, x, y, z); b.castShadow = false;
      kit.cyl(0.005, 0.005, 0.35, kit.std({ color: 0x111111 }), x, y + 0.2, z);
      const l = kit.pointLight(0xffc98a, intensity, x, y - 0.08, z, shadow);
      return { mat, light: l };
    },
  };
  return kit;
}

export function commonMats() {
  return {
    wood: new THREE.MeshStandardMaterial({ map: T.woodTexture(3), roughness: 0.6 }),
    darkWood: new THREE.MeshStandardMaterial({ map: T.woodTexture(9, [58, 36, 22]), roughness: 0.55 }),
    redWood: new THREE.MeshStandardMaterial({ map: T.woodTexture(13, [96, 40, 28]), roughness: 0.5 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd8dcdf, roughness: 0.18, metalness: 1 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 }),
    black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xbfd6d8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18 }),
    metal: new THREE.MeshStandardMaterial({ map: T.metalTexture(), roughness: 0.5, metalness: 0.6 }),
    cloth: new THREE.MeshStandardMaterial({ map: T.clothTexture(), roughness: 1, side: THREE.DoubleSide }),
    wallpaper: new THREE.MeshStandardMaterial({ map: T.wallpaperTexture(), roughness: 0.92 }),
    plaster: new THREE.MeshStandardMaterial({ map: T.plasterTexture(), roughness: 0.95 }),
    ceiling: new THREE.MeshStandardMaterial({ map: T.paintTexture('#e4e0d4', 93), roughness: 1 }),
    floor: new THREE.MeshStandardMaterial({ map: T.floorTexture(), roughness: 0.75 }),
    tile: new THREE.MeshStandardMaterial({ map: T.tileTexture(), roughness: 0.25 }),
    checker: new THREE.MeshStandardMaterial({ map: T.checkerTexture(), roughness: 0.35 }),
    lino: new THREE.MeshStandardMaterial({ map: T.linoleumTexture(), roughness: 0.6 }),
    marble: new THREE.MeshStandardMaterial({ map: T.marbleTexture(), roughness: 0.3 }),
  };
}
