/* ═══════════════════════════════════════════
   ECONOVUS — Interactive Intro Gateway
   "Draw a Circle" — Canvas Trail + Circle Detection
   ═══════════════════════════════════════════ */

import gsap from 'gsap';

// ── Configuration ──
const CONFIG = {
  guideRadius: 140,              // px — radius of the guide circle
  guideRadiusMobile: 100,        // px — mobile
  snapThreshold: 0.88,           // 88% of full circle to trigger completion
  trailLength: 300,              // number of trail points
  trailFadeSpeed: 0.003,         // trail point fade speed
  particleCount: 0,              // particles per frame when moving (disabled for cleaner look)
  detectionTolerance: 80,        // px — how far from the ring the mouse can be
  glowColor: [255, 255, 255],    // pure white glow
  trailColorStart: [255, 255, 255], // pure white
  trailColorEnd: [200, 200, 200],   // soft white
};

// ── State ──
let isActive = false;
let isCompleted = false;
let isDrawing = false;
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let centerX = 0;
let centerY = 0;
let guideRadius = CONFIG.guideRadius;
let trailPoints = [];
let particles = [];
let arcSegments = new Set(); // track which angle segments are filled
let arcProgress = 0;
let animFrameId = null;
let entrancePlayed = false;

// ── DOM refs ──
let gateway, trailCanvas, ctx;
let cursorEl, startDotEl, progressCircle, flashEl;
let promptTitle, promptSubtitle, skipBtn, logoEl;
let svgEl;

// ── Arc tracking ──
const ARC_SEGMENTS = 72; // divide circle into 72 segments (5° each)
const segmentFilled = new Uint8Array(ARC_SEGMENTS);
let drawStartAngle = null;
let lastAngle = null;

// ═══════ INITIALIZE ═══════
export function initIntroPage() {
  gateway = document.getElementById('intro-gateway');
  if (!gateway) return;

  // Strict scroll lock while intro is visible
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  // Get DOM refs
  trailCanvas = document.getElementById('intro-trail-canvas');
  ctx = trailCanvas.getContext('2d');
  cursorEl = document.querySelector('.intro-cursor');
  startDotEl = document.querySelector('.intro-start-dot');
  progressCircle = document.querySelector('.guide-ring-progress');
  flashEl = document.querySelector('.intro-flash');
  promptTitle = document.querySelector('.intro-prompt-title');
  promptSubtitle = document.querySelector('.intro-prompt-subtitle');
  skipBtn = document.querySelector('.intro-skip');
  logoEl = document.querySelector('.intro-logo');
  svgEl = document.querySelector('.intro-guide-ring');

  // Size canvas
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Compute center & guide radius
  computeLayout();

  // Position start dot (top of the circle)
  positionStartDot();

  // Set up SVG arc
  setupArc();

  // Event listeners
  gateway.addEventListener('mousemove', onMouseMove);
  gateway.addEventListener('mousedown', onMouseDown);
  gateway.addEventListener('mouseup', onMouseUp);
  gateway.addEventListener('touchstart', onTouchStart, { passive: false });
  gateway.addEventListener('touchmove', onTouchMove, { passive: false });
  gateway.addEventListener('touchend', onTouchEnd);

  // Skip button
  if (skipBtn) {
    skipBtn.addEventListener('click', () => completeIntro());
  }

  // Entrance animation
  playEntrance();

  // Start render loop
  isActive = true;
  render();
}

// ═══════ LAYOUT ═══════
function computeLayout() {
  centerX = window.innerWidth / 2;
  centerY = window.innerHeight / 2;
  guideRadius = window.innerWidth < 768 ? CONFIG.guideRadiusMobile : CONFIG.guideRadius;
}

function resizeCanvas() {
  trailCanvas.width = window.innerWidth;
  trailCanvas.height = window.innerHeight;
  computeLayout();
  positionStartDot();
}

function positionStartDot() {
  if (!startDotEl) return;
  // Position at the top of the guide circle
  const dotX = centerX;
  const dotY = centerY - guideRadius;
  startDotEl.style.left = dotX + 'px';
  startDotEl.style.top = dotY + 'px';
}

function setupArc() {
  if (!progressCircle) return;
  const circumference = 2 * Math.PI * guideRadius;
  progressCircle.setAttribute('r', guideRadius);
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = circumference;

  // Also update the background ring
  const bgRing = document.querySelector('.guide-ring-bg');
  if (bgRing) bgRing.setAttribute('r', guideRadius);

  // Update SVG viewBox
  if (svgEl) {
    const size = (guideRadius + 20) * 2;
    svgEl.setAttribute('width', size);
    svgEl.setAttribute('height', size);
    svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`);

    // Center the circles within SVG
    const cx = guideRadius + 20;
    const cy = guideRadius + 20;
    progressCircle.setAttribute('cx', cx);
    progressCircle.setAttribute('cy', cy);
    if (bgRing) {
      bgRing.setAttribute('cx', cx);
      bgRing.setAttribute('cy', cy);
    }
  }
}

// ═══════ ENTRANCE ANIMATION ═══════
function playEntrance() {
  if (entrancePlayed) return;
  entrancePlayed = true;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Logo fades in
  tl.to(logoEl, { opacity: 1, duration: 1 }, 0.3);

  // Cursor appears
  tl.to(cursorEl, { opacity: 1, duration: 0.6 }, 0.5);

  // Guide ring fades in (scale from small)
  tl.fromTo(svgEl,
    { opacity: 0, scale: 0.7 },
    { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' },
    0.8
  );

  // Prompt text
  tl.to(promptTitle, { opacity: 1, y: 0, duration: 0.8 }, 1.2);
  tl.to(promptSubtitle, { opacity: 1, y: 0, duration: 0.8 }, 1.5);

  // Start dot
  tl.to(startDotEl, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, 1.4);

  // Skip button
  tl.to(skipBtn, { opacity: 1, duration: 0.6 }, 2.0);
}

// ═══════ MOUSE / TOUCH HANDLERS ═══════
function onMouseMove(e) {
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Update cursor position
  updateCursor(mouseX, mouseY);

  // Always track the arc on mouse move (no click required, like the reference)
  trackArc(mouseX, mouseY);
}

function onMouseDown(e) {
  initAudio();
  isDrawing = true;
  cursorEl?.classList.add('active');
  startDrawingSound();
  trackArc(e.clientX, e.clientY);
}

function onMouseUp() {
  isDrawing = false;
  cursorEl?.classList.remove('active');
  stopDrawingSound();
}

function onTouchStart(e) {
  e.preventDefault();
  initAudio();
  const touch = e.touches[0];
  mouseX = touch.clientX;
  mouseY = touch.clientY;
  isDrawing = true;
  updateCursor(mouseX, mouseY);
  cursorEl?.classList.add('active');
  startDrawingSound();
  // Show cursor on touch
  if (cursorEl) cursorEl.style.opacity = '1';
}

function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  mouseX = touch.clientX;
  mouseY = touch.clientY;
  updateCursor(mouseX, mouseY);
  trackArc(mouseX, mouseY);
}

function onTouchEnd() {
  isDrawing = false;
  cursorEl?.classList.remove('active');
  stopDrawingSound();
}

// ═══════ CURSOR ═══════
function updateCursor(x, y) {
  if (!cursorEl) return;
  cursorEl.style.left = x + 'px';
  cursorEl.style.top = y + 'px';
}

// ── Freeform Tracking State ──
let pathHistory = [];
let totalPathLength = 0;
let lastTrackX = null;
let lastTrackY = null;


// ── Web Audio API ──
let audioCtx;
let drawOsc;
let drawGain;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function startDrawingSound() {
  if (!audioCtx) return;
  if (drawOsc) return;
  drawOsc = audioCtx.createOscillator();
  drawGain = audioCtx.createGain();
  drawOsc.type = 'sine';
  drawOsc.frequency.value = 300;
  drawGain.gain.value = 0;
  drawGain.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.1);
  drawOsc.connect(drawGain);
  drawGain.connect(audioCtx.destination);
  drawOsc.start();
}

function updateDrawingSound(speed) {
  if (!drawOsc) return;
  const freq = 200 + Math.min(speed * 3, 500);
  drawOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
}

function stopDrawingSound() {
  if (!drawOsc) return;
  drawGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
  const oldOsc = drawOsc;
  drawOsc = null;
  setTimeout(() => {
    try {
      oldOsc.stop();
      oldOsc.disconnect();
    } catch(e) {}
  }, 200);
}

function playSuccessSound() {
  if (!audioCtx) return;
  stopDrawingSound();
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const osc3 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc3.type = 'sine';
  
  // Magical completion chord (C major 7th)
  osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
  osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
  osc3.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);
  
  osc1.connect(gain);
  osc2.connect(gain);
  osc3.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc1.start();
  osc2.start();
  osc3.start();
  osc1.stop(audioCtx.currentTime + 3.0);
  osc2.stop(audioCtx.currentTime + 3.0);
  osc3.stop(audioCtx.currentTime + 3.0);
}

// ═══════ ARC TRACKING (ROBUST LOOP CLOSURE) ═══════
function trackArc(x, y) {
  if (isCompleted) return;

  if (lastTrackX === null) {
    lastTrackX = x;
    lastTrackY = y;
    pathHistory.push({ x, y, len: 0 });
    return;
  }

  const dx = x - lastTrackX;
  const dy = y - lastTrackY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Ignore tiny movements to reduce jitter
  if (dist < 5) return;

  totalPathLength += dist;
  pathHistory.push({ x, y, len: totalPathLength });
  
  // Keep history manageable but large enough for giant screen-filling shapes
  if (pathHistory.length > 1000) {
    pathHistory.shift();
  }

  lastTrackX = x;
  lastTrackY = y;

  // Interpolate trail points to fill gaps for a perfectly continuous line
  const steps = Math.max(1, Math.floor(dist / 4));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ix = (x - dx) + dx * t;
    const iy = (y - dy) + dy * t;
    addTrailPoint(ix, iy);
    if (Math.random() > 0.5) spawnParticles(ix, iy);
  }
  
  if (isDrawing) {
    updateDrawingSound(dist);
  }

  // Check for Loop Closure
  // Look back through history to find if we intersect an older part of the line
  let closedLoopFound = false;
  let loopStartIndex = -1;

  // Start checking from older points. 
  // We skip the most recent ~800px of length so we don't intersect immediately with our own tail.
  for (let i = 0; i < pathHistory.length; i++) {
    const pt = pathHistory[i];
    if (totalPathLength - pt.len < 800) continue; // Loop must be at least 800px long

    const idx = x - pt.x;
    const idy = y - pt.y;
    const iDist = Math.sqrt(idx * idx + idy * idy);

    if (iDist < 40) { // If we come within 40px of an old point, the loop is closed!
      closedLoopFound = true;
      loopStartIndex = i;
      break;
    }
  }

  if (closedLoopFound) {
    // Validate that the closed loop is "circle-ish" and not just a weird squiggly line
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = loopStartIndex; i < pathHistory.length; i++) {
      const pt = pathHistory[i];
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    // Must be a decent sized shape (made much larger to let users play around)
    if (width > 250 && height > 250) {
      // Aspect ratio shouldn't be extremely skewed (e.g., a long skinny loop)
      const ratio = Math.min(width, height) / Math.max(width, height);
      if (ratio > 0.4) {
        completeCircle();
      }
    }
  }
}

function updateArcVisual() {
  if (!progressCircle) return;
  const circumference = 2 * Math.PI * guideRadius;
  const offset = circumference * (1 - arcProgress);
  progressCircle.style.strokeDashoffset = offset;

  // Increase glow as progress increases
  const glowIntensity = 2 + arcProgress * 8;
  progressCircle.style.filter = `drop-shadow(0 0 ${glowIntensity}px rgba(200, 224, 48, ${0.3 + arcProgress * 0.5}))`;
}

// ═══════ TRAIL SYSTEM ═══════
function addTrailPoint(x, y) {
  trailPoints.push({ x, y, life: 1.0, size: 24 });
  if (trailPoints.length > 800) trailPoints.splice(0, trailPoints.length - 800);
}

function spawnParticles(x, y) {
  for (let i = 0; i < 2; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2 + 1, // slight fall
      life: 1.0,
      size: 1 + Math.random() * 2,
    });
  }
  if (particles.length > 150) particles.splice(0, particles.length - 150);
}

function render() {
  if (!isActive) return;

  ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  drawTrail();
  drawParticles();

  animFrameId = requestAnimationFrame(render);
}

function drawTrail() {
  if (trailPoints.length === 0) return;

  // 1. Draw solid outer white frost
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 10;
  for (let i = trailPoints.length - 1; i >= 0; i--) {
    const pt = trailPoints[i];
    pt.life -= 0.005; // Fade speed
    if (pt.life <= 0) {
      trailPoints.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${pt.life * 0.25})`;
    ctx.fill();
  }
  ctx.restore();

  // 2. Erase the center completely in one go so borders don't overlap!
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < trailPoints.length; i++) {
    const pt = trailPoints[i];
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${pt.life})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.8})`;
    ctx.shadowColor = 'rgba(200, 255, 255, 0.8)';
    ctx.shadowBlur = 5;
    ctx.fill();
  }
  ctx.restore();
}

function drawCursorGlow() {
  const [r, g, b] = CONFIG.glowColor;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Large soft glow
  const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 50);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.05)`);
  gradient.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, 50, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.restore();
}

// ═══════ CIRCLE COMPLETION ═══════
function completeCircle() {
  if (isCompleted) return;
  isCompleted = true;
  playSuccessSound();
  stopDrawingSound();

  if (animFrameId) cancelAnimationFrame(animFrameId);
  gateway.classList.add('completed');

  // Fill remaining segments
  segmentFilled.fill(1);
  arcProgress = 1;
  updateArcVisual();

  // Completion animation timeline
  const tl = gsap.timeline({
    onComplete: () => completeIntro()
  });

  // Flash effect
  tl.to(flashEl, {
    opacity: 1,
    duration: 0.3,
    ease: 'power2.in',
  }, 0);

  // Instant intense white blast flash
  tl.to(flashEl, {
    opacity: 1,
    duration: 0.1,
    ease: 'power4.in',
  }, 0);

  tl.to(flashEl, {
    opacity: 0,
    duration: 1.2,
    ease: 'power2.out',
  }, 0.1);

  // Hide cursor
  tl.to(cursorEl, {
    opacity: 0,
    scale: 0.5,
    duration: 0.4,
  }, 0.2);

  // Hide skip button and logo
  tl.to([skipBtn, logoEl], {
    opacity: 0,
    duration: 0.3,
  }, 0);

  // Fade out the trail canvas rapidly so it doesn't clutter the text
  tl.to(trailCanvas, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
  }, 0.1);

  // Hide original prompt completely
  tl.to('.intro-prompt', {
    opacity: 0,
    y: -20,
    duration: 0.2,
    ease: 'power4.in',
  }, 0);

  // Darken background for maximum blast contrast
  tl.to('.intro-bg', {
    filter: 'brightness(0.15) saturate(0.2) blur(16px)',
    scale: 1.1,
    duration: 1.5,
  }, 0);

  // Cinematic container
  gsap.set('.intro-cinematic-text', { opacity: 1 });

  // TECH BLAST REVEAL: Aggressive snap down from scaled, blurred, overbright state
  tl.to('.cinematic-word', {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px) brightness(1)',
    duration: 0.8,
    stagger: 0.12,
    ease: 'expo.out',
  }, 0.15);

  // Add a very slow, dramatic scale up to the entire text block while it's on screen
  tl.fromTo('.intro-cinematic-text', 
    { scale: 1 }, 
    { scale: 1.05, duration: 4.0, ease: 'linear' }, 
    0.6
  );

  // Intense text-shadow pulse on "carbon neutral"
  tl.fromTo('#cinematic-glow-word', {
    textShadow: '0 0 0px rgba(200, 224, 48, 0)',
  }, {
    textShadow: '0 0 40px rgba(200, 224, 48, 0.8), 0 0 80px rgba(164, 187, 18, 0.4)',
    duration: 1.5,
    ease: 'power2.out',
  }, 1.2);

  // Hold the text on screen for a moment, then fade it out and blur it slightly
  tl.to('.cinematic-word', {
    opacity: 0,
    y: -30,
    filter: 'blur(8px)',
    duration: 1.2,
    stagger: 0.1,
    ease: 'power3.in'
  }, 3.8);
}

function completeIntro() {
  if (!gateway) return;

  gateway.classList.add('completed');

  // Final fade out of the entire gateway
  gsap.to(gateway, {
    opacity: 0,
    duration: 1.0,
    ease: 'power2.inOut',
    onComplete: () => {
      // Clean up
      isActive = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);

      gateway.classList.add('hidden');

      // Mark as seen for this session
      sessionStorage.setItem('econovus-intro-seen', 'true');

      // Dispatch event for main.js to continue
      window.dispatchEvent(new CustomEvent('introComplete'));
    }
  });
}

// ═══════ CLEANUP ═══════
export function destroyIntroPage() {
  isActive = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (gateway) {
    gateway.removeEventListener('mousemove', onMouseMove);
    gateway.removeEventListener('mousedown', onMouseDown);
    gateway.removeEventListener('mouseup', onMouseUp);
    gateway.removeEventListener('touchstart', onTouchStart);
    gateway.removeEventListener('touchmove', onTouchMove);
    gateway.removeEventListener('touchend', onTouchEnd);
  }
  window.removeEventListener('resize', resizeCanvas);
}
