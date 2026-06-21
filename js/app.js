/* ═══════════════════════════════════════════════
   HK MINIJUNGLE BP — MAIN APP
   Three.js + Lenis + GSAP ScrollTrigger
   ═══════════════════════════════════════════════ */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// ════════════════ GLOBALS ════════════════
let lenis = null;
let scene, camera, renderer;
let particleLayers = [];
const mouse  = { x: 0, y: 0, tx: 0, ty: 0 };
const scroll = { y: 0, ty: 0 };
let isMobile = window.innerWidth < 768;
let perfTier = 'high';

// ════════════════ THREE.JS ════════════════
function detectPerfTier() {
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (isMobile && mem <= 2) perfTier = 'low';
  else if (isMobile || mem <= 4 || cores <= 4) perfTier = 'mid';
  else perfTier = 'high';
}

function getParticleCount() {
  if (perfTier === 'low') return 200;
  if (perfTier === 'mid') return 600;
  return 2000;
}

function initThreeJS() {
  detectPerfTier();
  const count = getParticleCount();
  const canvas = document.getElementById('bg-canvas');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 100);
  camera.position.set(0, 0, 18);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  scene.fog = new THREE.FogExp2('#050505', 0.00035);

  const layers = [
    { count: Math.floor(count * 0.12), size: 0.18, zRange: [-40, -55], speed: 0.025, color: '#0F2A1A', opacity: 0.6,  mouseInf: 0.3 },
    { count: Math.floor(count * 0.38), size: 0.08, zRange: [-15, -28], speed: 0.05,  color: '#2D5A3D', opacity: 0.55, mouseInf: 0.6 },
    { count: Math.floor(count * 0.30), size: 0.04, zRange: [-4, -12],  speed: 0.09,  color: '#5A9A6A', opacity: 0.5,  mouseInf: 1.0 },
    { count: Math.floor(count * 0.20), size: 0.025,zRange: [-1, -5],   speed: 0.14,  color: '#9FD4AA', opacity: 0.65, mouseInf: 1.8, cluster: true },
  ];

  layers.forEach((def) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(def.count * 3);
    const orig = new Float32Array(def.count * 3);
    for (let i = 0; i < def.count; i++) {
      let px, py;
      if (def.cluster) { px = (Math.random() + Math.random() + Math.random()) / 3 * 20 - 10; py = (Math.random() + Math.random() + Math.random()) / 3 * 16 - 8; }
      else { px = (Math.random() - 0.5) * 50; py = (Math.random() - 0.5) * 40; }
      const pz = def.zRange[0] + Math.random() * (def.zRange[1] - def.zRange[0]);
      pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
      orig[i * 3] = px; orig[i * 3 + 1] = py; orig[i * 3 + 2] = pz;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tc = document.createElement('canvas'); tc.width = 48; tc.height = 48;
    const ctx = tc.getContext('2d');
    const g = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, def.color); g.addColorStop(0.15, def.color); g.addColorStop(0.5, def.color + '88'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 48, 48);
    const tex = new THREE.CanvasTexture(tc);
    const mat = new THREE.PointsMaterial({ size: def.size, map: tex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: def.opacity, transparent: true, color: new THREE.Color(def.color) });
    const pts = new THREE.Points(geo, mat);
    pts.userData = { def, orig, phase: Math.random() * Math.PI * 2 };
    scene.add(pts); particleLayers.push(pts);
  });

  // Light rays
  const rc = isMobile ? 40 : 120;
  const rGeo = new THREE.BufferGeometry();
  const rPos = new Float32Array(rc * 3);
  const rOrig = new Float32Array(rc * 3);
  for (let i = 0; i < rc; i++) { const px = (Math.random() - 0.5) * 30, py = (Math.random() - 0.5) * 20, pz = -3 + Math.random() * -8; rPos[i * 3] = px; rPos[i * 3 + 1] = py; rPos[i * 3 + 2] = pz; rOrig[i * 3] = px; rOrig[i * 3 + 1] = py; rOrig[i * 3 + 2] = pz; }
  rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
  const sc = document.createElement('canvas'); sc.width = 8; sc.height = 128;
  const sctx = sc.getContext('2d'); const sg = sctx.createLinearGradient(0, 0, 0, 128);
  sg.addColorStop(0, 'transparent'); sg.addColorStop(0.3, '#8FBF9A44'); sg.addColorStop(0.5, '#8FBF9A88'); sg.addColorStop(0.7, '#8FBF9A44'); sg.addColorStop(1, 'transparent');
  sctx.fillStyle = sg; sctx.fillRect(0, 0, 8, 128);
  const rMat = new THREE.PointsMaterial({ size: 0.35, map: new THREE.CanvasTexture(sc), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.25, transparent: true });
  const rays = new THREE.Points(rGeo, rMat);
  rays.userData = { def: { speed: 0.04, mouseInf: 1.2, opacity: 0.25 }, orig: rOrig, phase: 0 };
  scene.add(rays); particleLayers.push(rays);
}

function animateThreeJS(time) {
  requestAnimationFrame(animateThreeJS);
  mouse.tx += (mouse.x - mouse.tx) * 0.035; mouse.ty += (mouse.y - mouse.ty) * 0.035;
  scroll.ty += (scroll.y - scroll.ty) * 0.06;
  camera.position.x += (mouse.tx * 4.5 - camera.position.x) * 0.025;
  camera.position.y += (-mouse.ty * 3.0 - scroll.ty * 0.18 - camera.position.y) * 0.025;
  camera.lookAt(0, -scroll.ty * 0.12, -8);
  particleLayers.forEach((layer) => {
    const pos = layer.geometry.attributes.position.array;
    const orig = layer.userData.orig; const def = layer.userData.def;
    const count = pos.length / 3; const speed = def.speed; const mi = def.mouseInf || 0.3;
    for (let i = 0; i < count; i++) {
      const idx = i * 3; const phase = i * 0.013 + time * 0.00015 * speed + layer.userData.phase;
      pos[idx] = orig[idx] + Math.sin(phase) * speed * 1.3 + mouse.tx * mi * 1.5;
      pos[idx + 1] = orig[idx + 1] + Math.cos(phase * 0.7) * speed * 1.0 + mouse.ty * mi * 1.5;
    }
    layer.geometry.attributes.position.needsUpdate = true;
    layer.material.opacity = def.opacity + Math.sin(time * 0.0004 + layer.userData.phase) * 0.05;
  });
  renderer.render(scene, camera);
}

function onResize() { isMobile = window.innerWidth < 768; camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
function onMouseMove(e) { mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = (e.clientY / window.innerHeight) * 2 - 1; }

// ════════════════ LENIS ════════════════
async function initLenis() {
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.mjs');
    const LenisClass = mod.default || mod.Lenis;
    lenis = new LenisClass({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), orientation: 'vertical', smoothWheel: true });
    lenis.on('scroll', ({ scroll: s }) => { scroll.y = s / window.innerHeight; });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  } catch { window.addEventListener('scroll', () => { scroll.y = window.scrollY / window.innerHeight; }, { passive: true }); }
}

// ════════════════ GSAP SCROLL ANIMATIONS ════════════════
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('#hero [data-anim="fade-up"]').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.2, delay: i * 0.25, scrollTrigger: { trigger: '#hero', start: 'top 80%' }, ease: 'power3.out' });
  });

  document.querySelectorAll('.pos-line').forEach((line, i) => {
    gsap.fromTo(line, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.9, delay: i * 0.3, scrollTrigger: { trigger: '#positioning', start: 'top 70%' }, ease: 'power3.out' });
  });

  document.querySelectorAll('.product-section').forEach((section) => {
    section.querySelectorAll('[data-anim]').forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.9, delay: i * 0.1, scrollTrigger: { trigger: section, start: 'top 62%', toggleActions: 'play none none none' }, ease: 'power3.out' });
    });
    const bg = section.querySelector('.product-bg-image');
    if (bg) {
      gsap.fromTo(bg, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.8, scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none none' }, ease: 'power2.out' });
      gsap.to(bg, { scale: 1.12, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    }
  });

  document.querySelectorAll('.doctor-tier').forEach((tier, i) => {
    gsap.fromTo(tier, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, delay: i * 0.15, scrollTrigger: { trigger: '#doctor-forest', start: 'top 65%' }, ease: 'power3.out' });
  });

  document.querySelectorAll('.plan-card').forEach((card, i) => {
    gsap.fromTo(card, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, delay: i * 0.1, scrollTrigger: { trigger: '#c-plans', start: 'top 72%' }, ease: 'power3.out' });
  });
}

// ════════════════ LANGUAGE ════════════════
function initLanguageToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  function applyLang(lang) {
    btn.textContent = lang === 'zh' ? 'EN' : '中文';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-en][data-zh]').forEach((el) => {
      const val = el.dataset[lang];
      if (val.includes('<') && val.includes('>')) el.innerHTML = val;
      else el.textContent = val;
    });
    localStorage.setItem('mj_lang', lang);
  }
  applyLang(localStorage.getItem('mj_lang') || 'en');
  btn.addEventListener('click', () => applyLang(document.documentElement.lang === 'en' ? 'zh' : 'en'));
}

// ════════════════ NAV ════════════════
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const fullnav = document.getElementById('fullnav');
  if (!hamburger || !fullnav) return;
  let open = false;
  function toggle() {
    open = !open;
    hamburger.classList.toggle('open', open);
    fullnav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  hamburger.addEventListener('click', toggle);
  fullnav.querySelectorAll('[data-nav-close]').forEach(l => l.addEventListener('click', () => { if (open) toggle(); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) toggle(); });
}

// ════════════════ CART ════════════════
function getCart() { try { return JSON.parse(localStorage.getItem('mj_cart') || '[]'); } catch { return []; } }
function saveCart(c) { localStorage.setItem('mj_cart', JSON.stringify(c)); }
function updateCartUI() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.qty, 0);
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const itemsEl = document.getElementById('cart-items');
  const sumTotal = document.getElementById('cart-sum-total');
  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = 'HK$' + total.toLocaleString();
  if (sumTotal) sumTotal.textContent = 'HK$' + total.toLocaleString();
  if (itemsEl) {
    if (cart.length === 0) itemsEl.innerHTML = '<p class="cart-empty">Empty — add something green.</p>';
    else {
      itemsEl.innerHTML = cart.map((item, idx) => `<div class="cart-item"><div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">HK$${item.price} &times; ${item.qty}</div></div><button class="cart-item-remove" data-cart-idx="${idx}">&times;</button></div>`).join('');
      itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', () => { const c = getCart(); c.splice(parseInt(btn.dataset.cartIdx), 1); saveCart(c); updateCartUI(); }));
    }
  }
}

function initCart() {
  const toggle = document.getElementById('cart-toggle');
  const mini = document.getElementById('mini-cart');
  const close = document.getElementById('cart-close');
  const checkout = document.getElementById('cart-checkout');
  if (toggle && mini) { toggle.addEventListener('click', () => mini.classList.toggle('open')); if (close) close.addEventListener('click', () => mini.classList.remove('open')); }
  if (checkout) { checkout.addEventListener('click', () => { const c = getCart(); if (c.length === 0) return; window.location.href = '/checkout.html?items=' + encodeURIComponent(JSON.stringify(c)); }); }

  document.querySelectorAll('.btn-cart-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.cartName || 'Product';
      const price = btn.dataset.cartPrice || '---';
      const cart = getCart();
      const existing = cart.find(i => i.name === name);
      if (existing) existing.qty++; else cart.push({ name, price, qty: 1 });
      saveCart(cart); updateCartUI();
      btn.textContent = 'ADDED ✓'; btn.classList.add('added');
      setTimeout(() => { btn.textContent = 'ADD TO CART'; btn.classList.remove('added'); }, 1200);
      if (mini) { mini.classList.add('open'); setTimeout(() => mini.classList.remove('open'), 2500); }
    });
  });
  updateCartUI();
}

// ════════════════ INTRO SOUND ════════════════
let audioCtx = null;
function playIntroSound() {
  try {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
    const ctx = audioCtx; const now = ctx.currentTime;
    const master = ctx.createGain(); master.gain.setValueAtTime(0, now); master.gain.linearRampToValueAtTime(0.4, now + 0.3); master.gain.linearRampToValueAtTime(0, now + 5.5); master.connect(ctx.destination);
    function chime(f, s, v = 0.1, d = 1.5) { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, s); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(v, s + 0.05); g.gain.exponentialRampToValueAtTime(0.001, s + d); o.connect(g); g.connect(master); o.start(s); o.stop(s + d); }
    function rise(sf, ef, s, d = 3, v = 0.06) { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(sf, s); o.frequency.exponentialRampToValueAtTime(ef, s + d); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(v, s + 0.4); g.gain.linearRampToValueAtTime(0, s + d); o.connect(g); g.connect(master); o.start(s); o.stop(s + d); }
    rise(180, 520, now, 5, 0.07); rise(220, 660, now + 0.3, 4.5, 0.05);
    chime(523, now + 1.0, 0.12); chime(659, now + 1.6, 0.10); chime(784, now + 2.2, 0.11); chime(1047, now + 3.4, 0.10);
  } catch {}
}

// ════════════════ BOOT ════════════════
async function boot() {
  initThreeJS(); requestAnimationFrame(animateThreeJS);
  await initLenis();
  initScrollAnimations();
  initLanguageToggle();
  initNav();
  initCart();

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', () => { mouse.x = 0; mouse.y = 0; }, { passive: true });

  const soundBtn = document.getElementById('sound-indicator');
  function trySound() { playIntroSound(); if (soundBtn) { soundBtn.textContent = '🔊'; setTimeout(() => { soundBtn.textContent = '🔇'; }, 5500); } document.removeEventListener('click', trySound); }
  document.addEventListener('click', trySound);
  if (soundBtn) soundBtn.addEventListener('click', (e) => { e.stopPropagation(); trySound(); });
}

boot();
