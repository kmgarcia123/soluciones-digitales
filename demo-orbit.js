/* Optional decoration: the demo remains fully functional without WebGL or the CDN. */
(() => {
  'use strict';

  const lab = document.getElementById('demo-lab');
  const canvas = document.getElementById('lab-orbit');
  if (!lab || !canvas || !window.IntersectionObserver) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopViewport = window.matchMedia('(min-width: 701px)');
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
  let renderer;
  let scene;
  let camera;
  let orbital;
  let inView = false;
  let loading = false;
  let failed = false;
  let frame = 0;
  let lastTime = 0;
  let phase = 0;

  const motionAllowed = () => desktopViewport.matches && inView && !document.hidden &&
    !reducedMotion.matches && !lab.classList.contains('lab-motion-paused');

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function fallback() {
    stop();
    failed = true;
    canvas.classList.remove('is-ready');
    if (renderer) renderer.dispose();
    if (scene) {
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
    }
  }

  function draw() {
    if (!renderer || failed || !desktopViewport.matches || !inView || document.hidden) return;
    try {
      renderer.render(scene, camera);
    } catch (_) {
      fallback();
    }
  }

  function resize() {
    if (!renderer || failed) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width || 180);
    const height = Math.max(1, bounds.height || 140);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setSize(Math.round(width * ratio), Math.round(height * ratio), false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }

  function animate(time) {
    frame = 0;
    if (!motionAllowed() || failed) {
      lastTime = 0;
      return;
    }
    // Clamp elapsed time so returning from a sleeping tab never jumps the scene.
    phase += lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    orbital.rotation.y = phase * 0.22;
    orbital.rotation.z = Math.sin(phase * 0.3) * 0.12;
    orbital.children[0].rotation.y = -phase * 0.35;
    draw();
    if (!failed) frame = requestAnimationFrame(animate);
  }

  async function load() {
    if (loading || renderer || failed || !motionAllowed()) return;
    loading = true;
    try {
      const THREE = await import(THREE_URL);
      if (failed || !motionAllowed()) return;
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });
      renderer.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(36, 180 / 140, 0.1, 20);
      camera.position.set(0, 0.25, 5.6);
      camera.lookAt(0, 0, 0);
      orbital = new THREE.Group();
      scene.add(orbital);

      const core = new THREE.Group();
      core.add(new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.43, 1),
        new THREE.MeshBasicMaterial({ color: 0x69e9d3, wireframe: true, transparent: true, opacity: 0.6 })
      ));
      core.add(new THREE.Points(
        new THREE.SphereGeometry(0.56, 18, 12),
        new THREE.PointsMaterial({ color: 0xa6fff0, size: 0.022, transparent: true, opacity: 0.82 })
      ));
      orbital.add(core);

      const colors = [0x55dfd0, 0x7394ff, 0x9ee8ff];
      colors.forEach((color, i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.91 + i * 0.16, 0.009, 6, 80),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 - i * 0.13 })
        );
        ring.rotation.set(0.35 + i * 0.66, i * 0.82, i * 0.48);
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 10, 8),
          new THREE.MeshBasicMaterial({ color })
        );
        const angle = i * 2.1;
        node.position.set(Math.cos(angle) * (0.91 + i * 0.16), Math.sin(angle) * (0.91 + i * 0.16), 0);
        ring.add(node);
        orbital.add(ring);
      });
      resize();
      if (!failed) {
        // Keep the CSS fallback until a real frame can be drawn.
        renderer.render(scene, camera);
        canvas.classList.add('is-ready');
      }
      sync();
    } catch (_) {
      // Network, CSP and WebGL failures intentionally retain the CSS decoration.
      fallback();
    } finally {
      loading = false;
    }
  }

  function sync() {
    if (!motionAllowed() || failed) {
      stop();
      return;
    }
    if (!renderer) {
      load();
    } else if (!frame) {
      frame = requestAnimationFrame(animate);
    }
  }

  const observer = new IntersectionObserver(entries => {
    inView = entries.some(entry => entry.isIntersecting);
    sync();
  }, { threshold: 0 });
  observer.observe(lab);

  const motionObserver = new MutationObserver(sync);
  motionObserver.observe(lab, { attributes: true, attributeFilter: ['class'] });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  reducedMotion.addEventListener('change', sync);
  desktopViewport.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    fallback();
  });
})();
