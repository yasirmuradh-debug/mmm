// ─────────────────────────────────────────────────────────────────────────────
// The Orb — a sphere of particles that breathes when idle and bursts outward
// with your voice. Driven by a single 0..1 "level" the rest of the app feeds it.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

export function createOrb(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.4;

  // Build a fibonacci sphere of points so they're spread evenly.
  const COUNT = 9000;
  const radius = 1.15;
  const positions = new Float32Array(COUNT * 3);
  const home = new Float32Array(COUNT * 3); // resting position per particle
  const rand = new Float32Array(COUNT);     // per-particle jitter seed

  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = i * 2.399963; // golden angle
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    home[i * 3] = x * radius;
    home[i * 3 + 1] = y * radius;
    home[i * 3 + 2] = z * radius;
    positions.set([home[i * 3], home[i * 3 + 1], home[i * 3 + 2]], i * 3);
    rand[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xf0d6b2,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // A soft inner glow sphere.
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xc27a34, transparent: true, opacity: 0.15 })
  );
  scene.add(glow);

  let level = 0;      // target audio level 0..1
  let smooth = 0;     // smoothed level
  let state = 'idle'; // 'idle' | 'listening' | 'speaking'

  function resize() {
    const size = Math.min(canvas.clientWidth, canvas.clientHeight) || 420;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    smooth += (level - smooth) * 0.15;

    const idleBreath = Math.sin(t * 1.2) * 0.04 + 0.04;
    const push = state === 'idle' ? idleBreath : idleBreath + smooth * 0.55;

    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const hx = home[i * 3], hy = home[i * 3 + 1], hz = home[i * 3 + 2];
      // per-particle wobble so the surface shimmers
      const n = Math.sin(t * 2 + rand[i] * 12.0) * 0.02;
      const scale = 1 + push + n * (0.4 + smooth);
      pos[i * 3] = hx * scale;
      pos[i * 3 + 1] = hy * scale;
      pos[i * 3 + 2] = hz * scale;
    }
    geometry.attributes.position.needsUpdate = true;

    points.rotation.y = t * 0.12;
    points.rotation.x = Math.sin(t * 0.2) * 0.15;

    // Colour shifts with state.
    const target = state === 'speaking' ? 0xf2af6e : state === 'listening' ? 0xe6a165 : 0xf0d6b2;
    material.color.lerp(new THREE.Color(target), 0.05);
    glow.material.opacity = 0.12 + smooth * 0.25;
    glow.scale.setScalar(1 + smooth * 0.3);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize);
  resize();
  animate();

  return {
    setLevel: (v) => { level = Math.max(0, Math.min(1, v)); },
    setState: (s) => { state = s; },
  };
}
