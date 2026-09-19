import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildDiorama } from './warehouse-builder.js';

gsap.registerPlugin(ScrollTrigger);

// Force page to start at the top on reload so intro cinematic plays correctly
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Fix ScrollTrigger recalculation on tab switch / alt-tab
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(() => ScrollTrigger.refresh(), 200);
  }
});
window.addEventListener('focus', () => {
  setTimeout(() => ScrollTrigger.refresh(), 200);
});

export function initThreeScene() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  // Product hotspot tracks the main container position
  // We'll compute this dynamically once mainContainer is loaded
  let productHotspotPos = { x: -2, y: 2.5, z: 7 };

  // ── Scene ──
  const scene = new THREE.Scene();
  const sceneGroup = new THREE.Group();
  scene.add(sceneGroup);

  scene.background = new THREE.Color(0xf4f4f5);
  // Light fog to match background
  scene.fog = new THREE.FogExp2(0xf4f4f5, 0.003);

  // ── Camera ──
  const sizes = { width: window.innerWidth, height: window.innerHeight };
  // Narrow FOV for isometric feel
  const getFov = (width) => width < 768 ? 45 : (width < 1024 ? 35 : 25);
  const camera = new THREE.PerspectiveCamera(getFov(sizes.width), sizes.width / sizes.height, 0.1, 1000);
  scene.add(camera);

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ── Lighting (Studio Setup from Diorama) ──
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  sceneGroup.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.4); // Reduced to enhance shadows
  hemiLight.position.set(0, 20, 0);
  sceneGroup.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 3.5); // Slightly stronger, pure white
  dirLight.position.set(20, 30, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  dirLight.shadow.bias = -0.0001;
  dirLight.shadow.normalBias = 0.02;
  sceneGroup.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xaaccff, 1.2);
  fillLight.position.set(-20, 20, -20);
  sceneGroup.add(fillLight);

  // ── Build Diorama ──
  // Shift the entire sceneGroup down and back so it fits well in the viewport
  sceneGroup.position.set(0, -5, -10);

  // Create a group for everything that should vanish later
  const vanishGroup = new THREE.Group();
  sceneGroup.add(vanishGroup);

  const diorama = buildDiorama(vanishGroup, renderer);

  // ── Model Loading ──
  const loader = new GLTFLoader();
  let mainContainer = null;
  let showcaseClone0 = null;
  let showcaseClone1 = null;
  let showcaseClone2 = null;
  const backgroundContainers = [];
  const dragGroup = new THREE.Group();

  const basePath = import.meta.env.BASE_URL;
  loader.load(`${basePath}models/industrial-container.glb`, (gltf) => {
    const model = gltf.scene;

    // Premium materials
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.metalness = 0.5;
          child.material.roughness = 0.4;
        }
      }
    });

    // Scale to fit realistically within the diorama (which has boxes ~1 unit tall)
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1.2 / maxDim; // Container is about 1.2m tall
    model.scale.set(s, s, s);

    // Re-center
    const boxAfter = new THREE.Box3().setFromObject(model);
    const center = boxAfter.getCenter(new THREE.Vector3());
    model.position.sub(center);

    dragGroup.add(model);

    // Create a wrapper for the main container so we can position it easily
    mainContainer = new THREE.Group();
    mainContainer.add(dragGroup);
    
    // Position it in the staging area of the diorama.
    mainContainer.position.set(-2, 1.2, 7);
    mainContainer.rotation.set(0, 0.3, 0);
    // Add to vanishGroup so it drops with the warehouse!
    vanishGroup.add(mainContainer);

    // -- SHOWCASE CLONES FOR CAROUSEL --
    showcaseClone0 = new THREE.Group();
    showcaseClone0.visible = false;
    const dragGroup0 = new THREE.Group();
    dragGroup0.add(model.clone());
    showcaseClone0.add(dragGroup0);
    // Start completely hidden underground bottom-left
    showcaseClone0.position.set(-15, -15, 7); 
    sceneGroup.add(showcaseClone0);

    showcaseClone1 = new THREE.Group();
    showcaseClone1.visible = false;
    const dragGroup1 = new THREE.Group();
    dragGroup1.add(model.clone());
    showcaseClone1.add(dragGroup1);
    // Start completely hidden underground
    showcaseClone1.position.set(-15, -15, 7); 
    sceneGroup.add(showcaseClone1);

    showcaseClone2 = new THREE.Group();
    showcaseClone2.visible = false;
    const dragGroup2 = new THREE.Group();
    dragGroup2.add(model.clone());
    showcaseClone2.add(dragGroup2);
    showcaseClone2.position.set(-15, -15, 7); 
    sceneGroup.add(showcaseClone2);

    // Place other containers in the staging area around the main one
    const bgPositions = [
      { x: -2, z: 8.2, ry: 0 },
      { x: -3.5, z: 7.5, ry: 0.5 },
      { x: 4, z: 6, ry: -0.2 },
      { x: 5, z: 7, ry: 0.1 },
      { x: 5.5, z: 5.5, ry: -0.5 }
    ];

    bgPositions.forEach(({ x, z, ry }) => {
      const clone = new THREE.Group();
      const mClone = model.clone();
      clone.add(mClone);
      clone.position.set(x, 0.6, z);
      clone.rotation.set(0, ry, 0);
      // Add background containers to vanishGroup
      vanishGroup.add(clone);
      backgroundContainers.push(clone);
    });

    setupScrollAnimations();

    // Hide preloader, then play intro cinematic
    gsap.to('#preloader', {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        const pl = document.getElementById('preloader');
        if (pl) pl.style.display = 'none';
        // Keep scroll locked during intro
        document.body.style.overflow = 'hidden';
        playIntroCinematic();
      }
    });
  });

  // ── Intro Cinematic Flythrough ──
  let introMode = true;
  // Start camera inside the warehouse, eye-level near the racks
  // sceneGroup is at (0, -5, -10), so world positions:
  // Racks are around world x:-24 to 24, y:-5 to 1, z:-18 to -10
  const introCam = { x: 12, y: -1, z: -16 };
  const introLookAt = { x: -8, y: -3, z: -16 };

  function playIntroCinematic() {
    const introTl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        // Cinematic done — switch to normal camera mode
        introMode = false;
        // Copy final intro position into baseCamPos
        baseCamPos.x = introCam.x;
        baseCamPos.y = introCam.y;
        baseCamPos.z = introCam.z;
        // Enable scrolling
        document.body.style.overflow = '';
        // Now fire modelLoaded to trigger hero text animation
        window.dispatchEvent(new Event('modelLoaded'));
      }
    });

    // --- KEYFRAME 1 → 2: Pan along the racks (close-up of inventory) ---
    // Camera glides sideways through the warehouse, showing boxes and barrels
    introTl.to(introCam, {
      x: -12, y: 0, z: -14,
      duration: 2.0,
    }, 0);
    introTl.to(introLookAt, {
      x: -20, y: -3.5, z: -15,
      duration: 2.0,
    }, 0);

    // --- KEYFRAME 2 → 3: Sweep to staging area, see the containers ---
    introTl.to(introCam, {
      x: 6, y: -1.5, z: 0,
      duration: 1.8,
    }, 2.0);
    introTl.to(introLookAt, {
      x: -2, y: -4, z: -3,
      duration: 1.8,
    }, 2.0);

    // --- KEYFRAME 3 → 4: Dramatic rise — reveal the full warehouse ---
    introTl.to(introCam, {
      x: 35, y: 20, z: 30,
      duration: 2.0,
      ease: 'power2.out',
    }, 3.8);
    introTl.to(introLookAt, {
      x: 0, y: -5, z: -5,
      duration: 2.0,
      ease: 'power2.out',
    }, 3.8);

    // --- KEYFRAME 4 → 5: Settle to resting wide shot ---
    introTl.to(introCam, {
      x: 55, y: 40, z: 55,
      duration: 2.0,
      ease: 'power2.inOut',
    }, 5.8);
    introTl.to(introLookAt, {
      x: -2 + (55 * 0.02), y: window.innerWidth <= 768 ? 5.5 : -3.4, z: -3,
      duration: 2.0,
      ease: 'power2.inOut',
    }, 5.8);
  }

  // ── Scroll Animations ──
  // Resting wide shot (updated after intro finishes)
  const baseCamPos = { x: 55, y: 40, z: 55 };
  
  // Camera focus offsets to easily frame the product on different sides of the screen
  const cameraFocus = { panX: 0, panY: 0 };

  function setupScrollAnimations() {
    if (!mainContainer) return;

    // ─── SCROLL 1: WIDE TO PRODUCT FOCUS ───
    // Pin the hero section to create 1000px of scroll space for the zoom-in effect
    ScrollTrigger.create({
      trigger: '.section-hero',
      start: 'top top',
      end: '+=1000',
      pin: true,
      pinSpacing: true
    });

    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: '.section-hero',
        start: 'top top',
        end: '+=1000',
        scrub: 1.5
      }
    });

    // Slow cinematic pan of the warehouse (keeps the view zoomed out)
    tl1.fromTo(baseCamPos, 
      { x: 55, y: 40, z: 55 },
      { x: 45, y: 35, z: 45, ease: 'none' }, 
    0);
    
    // Rotate the product slightly as we pan
    tl1.fromTo(mainContainer.rotation, 
      { x: 0, y: 0.3, z: 0 },
      { x: 0, y: -0.5, z: 0, ease: 'power2.inOut' }, 
    0);

    // Gradually shift the camera focus to the target offset. 
    // Because the camera is far away, this won't visibly push the box off-screen,
    // but it prepares the camera for a perfectly straight dolly-in later!
    const isMobile = window.innerWidth <= 768;
    const targetPanX = isMobile ? 0 : -1.5;
    const targetPanY = isMobile ? -3.0 : -0.6; // Pull camera lookAt down during product showcase to bring the box up

    tl1.fromTo(cameraFocus, 
      { panX: 0, panY: 0 },
      { panX: targetPanX, panY: targetPanY, ease: 'power2.inOut' }, 
    0);


    // ─── SCROLL 2: BRAND STATEMENT → SOLUTIONS (MASTER TIMELINE) ───
    // We use a SINGLE master timeline for this entire section to ensure 
    // smooth scrubbing forward and backward without overlapping bugs.
    const tlMaster = gsap.timeline({
      scrollTrigger: {
        trigger: '.section-solutions',
        start: 'top bottom', // Start exactly when section enters
        end: () => "+=" + (window.innerHeight + 3500), // Entry (100vh) + Pin Duration (3500px)
        scrub: 1.5,
        invalidateOnRefresh: true,
        onEnter: () => {
          gsap.to('#main-header', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', pointerEvents: 'auto' });
          canvas.classList.add('interactive');
        },
        onLeaveBack: () => {
          gsap.to('#main-header', { opacity: 0, y: -100, duration: 0.4, ease: 'power2.in', pointerEvents: 'none' });
          canvas.classList.remove('interactive');
        }
      }
    });

    // -- THE GRAND TRANSITION (Duration: 1.0, Starts at 0) --
    // A single, beautifully smooth cinematic fly-in.
    // By setting duration to 1.0, we ensure this transition completely finishes EXACTLY as the 
    // 100vh section reaches the top of the screen and pins.
    
    // 1. Warehouse drops smoothly out of frame (no weird shrinking)
    tlMaster.to(vanishGroup.position, { y: -80, ease: 'power2.inOut', duration: 1.0 }, 0);
    tlMaster.to(scene.background, { r: 1, g: 1, b: 1, ease: 'power2.inOut', duration: 1.0 }, 0);
    tlMaster.to(scene.fog.color, { r: 1, g: 1, b: 1, ease: 'power2.inOut', duration: 1.0 }, 0);

    // 2. Camera dollies straight in.
    const dollyX = isMobile ? -2.0 : -6.0;
    const dollyY = isMobile ? 1.0 : -2.4;
    const dollyZ = isMobile ? 9.5 : 4.5;
    tlMaster.fromTo(baseCamPos, 
      { x: 45, y: 35, z: 45, immediateRender: false },
      { x: dollyX, y: dollyY, z: dollyZ, ease: 'power2.inOut', duration: 1.0, overwrite: 'auto' }, 
    0);

    // ── SHOWCASE CAROUSEL (Duration: 4.0, starts at 1.0) ──
    // 3 "slides" of containers entering from alternating sides.
    // Uses separate clone objects so scrubbing forward/backward is perfectly smooth.

    const slides = [
      document.getElementById('solutions-slide-1'),
      document.getElementById('solutions-slide-2'),
      document.getElementById('solutions-slide-3'),
    ];
    const dots = document.querySelectorAll('.solutions-progress-dot');

    // Slide 1 (0.4 → 2.2)
    // Box enters during the grand transition dolly-in
    tlMaster.set(showcaseClone0, { visible: true }, 0.4);
    tlMaster.fromTo(showcaseClone0.position, 
      { x: -15, y: -15, z: 7, immediateRender: false },
      { x: -2, y: 1.2, z: 7, duration: 0.6, ease: 'power2.out' }, 
    0.4);
    tlMaster.fromTo(showcaseClone0.rotation, 
      { y: 0, immediateRender: false },
      { y: Math.PI * 0.9, duration: 1.2, ease: 'none' }, 
    1.0);
    // Slide 1 exits to BOTTOM-LEFT
    tlMaster.to(showcaseClone0.position, { x: -15, y: -15, z: 7, duration: 0.6, ease: 'power2.in' }, 1.6);
    tlMaster.set(showcaseClone0, { visible: false }, 2.2);
    
    // Slide 1 text exits
    tlMaster.to(slides[0], { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in' }, 1.6);
    tlMaster.to(dots[0], { width: 8, borderRadius: '50%', background: '#d1d5db', boxShadow: 'none', duration: 0.3 }, 1.8);
    
    // Slide 2 text enters
    tlMaster.to(dots[1], { width: 32, borderRadius: 50, background: 'linear-gradient(135deg, #a4bb12, #0e5314)', boxShadow: '0 0 12px rgba(164, 187, 18, 0.4)', duration: 0.3 }, 1.9);
    tlMaster.fromTo(slides[1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.0);

    // Slide 2 (2.2 → 3.4): showcaseClone1 enters from BOTTOM-LEFT
    tlMaster.set(showcaseClone1, { visible: true }, 2.2);
    tlMaster.fromTo(showcaseClone1.position, 
      { x: -15, y: -15, z: 7, immediateRender: false },
      { x: -2, y: 1.2, z: 7, duration: 0.6, ease: 'power2.out' }, 
    2.2);
    tlMaster.fromTo(showcaseClone1.rotation, 
      { y: Math.PI * 1.5, immediateRender: false },
      { y: Math.PI * 1.0, duration: 1.2, ease: 'none' }, 
    2.2);
    
    // Slide 2 exits to BOTTOM-LEFT
    tlMaster.to(showcaseClone1.position, { x: -15, y: -15, z: 7, duration: 0.6, ease: 'power2.in' }, 3.4);
    tlMaster.set(showcaseClone1, { visible: false }, 4.0);

    // Slide 2 text exits
    tlMaster.to(slides[1], { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in' }, 3.2);
    tlMaster.to(dots[1], { width: 8, borderRadius: '50%', background: '#d1d5db', boxShadow: 'none', duration: 0.3 }, 3.4);

    // Slide 3 text enters
    tlMaster.to(dots[2], { width: 32, borderRadius: 50, background: 'linear-gradient(135deg, #a4bb12, #0e5314)', boxShadow: '0 0 12px rgba(164, 187, 18, 0.4)', duration: 0.3 }, 3.5);
    tlMaster.fromTo(slides[2], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 3.6);

    // Slide 3 (3.4 → 4.6): showcaseClone2 enters from BOTTOM-LEFT
    tlMaster.set(showcaseClone2, { visible: true }, 3.4);
    tlMaster.fromTo(showcaseClone2.position, 
      { x: -15, y: -15, z: 7, immediateRender: false },
      { x: -2, y: 1.2, z: 7, duration: 0.6, ease: 'power2.out' }, 
    3.4);
    tlMaster.fromTo(showcaseClone2.rotation, 
      { y: Math.PI * 0.2, immediateRender: false },
      { y: Math.PI * 0.8, duration: 1.2, ease: 'none' }, 
    3.4);

    // ─── PIN SOLUTIONS SECTION ───
    // Let the user scroll in place to admire the 3D product perfectly framed next to the copy
    ScrollTrigger.create({
      trigger: '.section-solutions',
      start: 'top top', // Pin when the 100vh section hits the top of the screen
      end: '+=3500', // Massive pin duration (approx 22-30 scrolls)
      pin: true,
      pinSpacing: true
    });

    // ─── SCROLL 3: SOLUTIONS → STATS ───
    const tl3 = gsap.timeline({
      scrollTrigger: {
        trigger: '.section-stats',
        start: 'top bottom',
        end: 'top center',
        scrub: 1.5
      }
    });

    // Gently rotate the product to show a different angle, but KEEP IT HUGE!
    // We intentionally do NOT change baseCamPos here so it stays zoomed in.
    tl3.to(mainContainer.rotation, { 
      y: Math.PI * 1.2, 
      ease: 'power2.inOut',
      immediateRender: false
    }, 0);
  }

  // ── Drag to Rotate Product ──
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let targetDragRotation = { x: 0, y: 0 };

  // Use mousedown on the entire document, then check if it's over the 3D area
  document.addEventListener('mousedown', (e) => {
    // Only start drag if not clicking on a button, link, or other interactive HTML
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.target.closest('.header') || e.target.closest('nav')) return;
    
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
    canvas.classList.add('dragging');
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.classList.remove('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging && dragGroup) {
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      // Adjust rotation speed
      targetDragRotation.y += deltaMove.x * 0.005;
      targetDragRotation.x += deltaMove.y * 0.005;

      // Clamp X rotation to prevent flipping upside down
      targetDragRotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, targetDragRotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  // ── Render Loop ──
  const clock = new THREE.Clock();

  const tick = () => {
    const dt = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // ── Camera Mode Switch ──
    if (introMode) {
      // During intro cinematic: use intro camera variables
      camera.position.set(introCam.x, introCam.y, introCam.z);
      camera.lookAt(introLookAt.x, introLookAt.y, introLookAt.z);
    } else {
      // Normal mode: scroll-driven camera
      camera.position.x = baseCamPos.x;
      camera.position.y = baseCamPos.y;
      camera.position.z = baseCamPos.z;

      const isMob = window.innerWidth <= 768;
      const baseTargetY = isMob ? 5.5 : -3.4; // Unified offset for mobile to push scene down
      const targetX = -2 + cameraFocus.panX + (baseCamPos.x * 0.02);
      const targetY = baseTargetY + cameraFocus.panY; 
      const targetZ = -3; 
      camera.lookAt(targetX, targetY, targetZ);
    }

    // Apply manual drag rotation smoothly
    if (dragGroup) {
      dragGroup.rotation.y += (targetDragRotation.y - dragGroup.rotation.y) * 0.1;
      dragGroup.rotation.x += (targetDragRotation.x - dragGroup.rotation.x) * 0.1;
    }

    // Subtle idle float on main container
    if (mainContainer) {
      mainContainer.children[0].position.y = Math.sin(elapsed * 1.5) * 0.05;
    }

    // Project product hotspot to 2D screen coordinate
    if (window.__hotspotUpdateFn && mainContainer) {
      // Use the mainContainer's actual world position (slightly above center)
      const worldPos = new THREE.Vector3(
        productHotspotPos.x,
        productHotspotPos.y,
        productHotspotPos.z
      );
      sceneGroup.localToWorld(worldPos);
      const ndc = worldPos.clone().project(camera);
      window.__hotspotUpdateFn({
        x: (ndc.x * 0.5 + 0.5) * sizes.width,
        y: (-ndc.y * 0.5 + 0.5) * sizes.height,
        visible: ndc.z < 1 && ndc.x > -1 && ndc.x < 1 && ndc.y > -1 && ndc.y < 1
      });
    }

    // Expose zoom function for click-to-zoom
    if (!window.__zoomToProduct) {
      window.__zoomToProduct = () => {
        if (!mainContainer) return;

        const isMob = window.innerWidth <= 768;
        // Target camera position: close-up of the product, slightly offset for a hero framing
        const zoomTarget = isMob ? { x: -2.0, y: 1.0, z: 9.5 } : { x: -6, y: -2.4, z: 4.5 };
        const zoomFocus = isMob ? { panX: 0, panY: -3.0 } : { panX: -1.5, panY: -0.6 };

        // Animate camera dolly-in
        gsap.to(baseCamPos, {
          x: zoomTarget.x,
          y: zoomTarget.y,
          z: zoomTarget.z,
          duration: 2.0,
          ease: 'power2.inOut',
        });

        gsap.to(cameraFocus, {
          panX: zoomFocus.panX,
          panY: zoomFocus.panY,
          duration: 2.0,
          ease: 'power2.inOut',
        });

        // Rotate product to a nice angle
        gsap.to(mainContainer.rotation, {
          y: Math.PI * 0.6,
          duration: 2.0,
          ease: 'power2.inOut',
        });

        // Drop warehouse away
        gsap.to(vanishGroup.position, {
          y: -80,
          duration: 2.0,
          ease: 'power2.inOut',
        });

        // Transition background to white
        gsap.to(scene.background, {
          r: 1, g: 1, b: 1,
          duration: 2.0,
          ease: 'power2.inOut',
        });
        gsap.to(scene.fog.color, {
          r: 1, g: 1, b: 1,
          duration: 2.0,
          ease: 'power2.inOut',
        });

        // After zoom completes, scroll to solutions section
        setTimeout(() => {
          const solutions = document.querySelector('.section-solutions');
          if (solutions) {
            window.scrollTo({
              top: solutions.offsetTop - 80,
              behavior: 'smooth'
            });
          }
        }, 2200);
      };
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  tick();

  // ── Resize ──
  window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.fov = getFov(sizes.width);
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ScrollTrigger.refresh();
  });
}
