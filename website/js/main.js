/* ═══════════════════════════════════════════
   ECONOVUS — Main JavaScript
   GSAP ScrollTrigger + All Animations
   ═══════════════════════════════════════════ */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// import { initParticles } from './particles.js';
// import { initCounters } from './counters.js';
import { initThreeScene } from './three-scene.js';
import { initIntroPage } from './intro-page.js';

gsap.registerPlugin(ScrollTrigger);

// ═══════ PRELOADER ═══════
function initPreloader() {
  const preloader = document.getElementById('preloader');
  
  window.addEventListener('load', () => {
    gsap.to(preloader, {
      opacity: 0,
      duration: 0.6,
      delay: 2.2,
      ease: 'power2.out',
      onComplete: () => {
        preloader.classList.add('hide');
        document.body.style.overflow = '';
        initHeroAnimations();
      }
    });
  });
}

// ═══════ HEADER SCROLL EFFECT ═══════
function initHeader() {
  const header = document.getElementById('main-header');
  
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: (self) => {
      if (self.scroll() > 80) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  // Mobile menu
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('header-nav');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      nav.classList.toggle('active');
      mobileBtn.classList.toggle('active');
    });
  }
}

// ═══════ ACTIVE NAV LINK TRACKING ═══════
function initActiveNavTracking() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  sections.forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => updateActiveNav(section.id),
      onEnterBack: () => updateActiveNav(section.id),
    });
  });

  function updateActiveNav(sectionId) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${sectionId}`) {
        link.classList.add('active');
      }
    });
  }
}

// ═══════ SCROLL PROGRESS BAR ═══════
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    progressBar.style.width = progress + '%';
  }, { passive: true });
}

// ═══════ HERO OVERLAY ANIMATIONS ═══════
function initHeroOverlay() {
  const overlay = document.getElementById('hero-overlay');
  if (!overlay) return;

  // Entrance timeline (plays after model loads)
  const entranceTl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });

  // Brand
  entranceTl.to('#hero-brand', {
    opacity: 1,
    y: 0,
    duration: 0.8,
  }, 0.2);

  // Overline
  entranceTl.to('#hero-overline', {
    opacity: 1,
    x: 0,
    duration: 0.7,
  }, 0.5);

  // Title lines (staggered)
  entranceTl.to('.hero-title-line', {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
  }, 0.7);

  // Description
  entranceTl.to('#hero-description', {
    opacity: 1,
    y: 0,
    duration: 0.8,
  }, 1.3);

  // CTA buttons
  entranceTl.to('#hero-cta-group', {
    opacity: 1,
    y: 0,
    duration: 0.8,
  }, 1.5);

  // Stats strip
  entranceTl.to('#hero-stats-strip', {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out',
  }, 1.7);

  // Scroll Indicator
  gsap.set('#scroll-indicator', { opacity: 0 });
  entranceTl.to('#scroll-indicator', {
    opacity: 1,
    y: 0,
    duration: 1.0,
    ease: 'power2.out',
  }, 1.8);

  // Hotspots
  entranceTl.to('.hotspot', {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    stagger: 0.12,
    ease: 'back.out(2)',
  }, 2.0);

  // Listen for model loaded event to play entrance
  window.addEventListener('modelLoaded', () => {
    entranceTl.play();
  });

  // Scroll-linked exit — tied to the EXISTING hero section pin
  // The hero section already has a ScrollTrigger that pins it from top to +=1000
  // We create a parallel exit timeline on the same scroll range
  const exitTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.section-hero',
      start: 'top top',
      end: '+=600', // Exit faster (within first 60% of the hero scroll)
      scrub: 1,
    }
  });

  // Hero brand slides up and fades
  exitTl.to('#hero-brand', {
    opacity: 0,
    y: -30,
    duration: 1,
  }, 0);

  // Overline slides left
  exitTl.to('#hero-overline', {
    opacity: 0,
    x: -40,
    duration: 1,
  }, 0);

  // Fade out the entire text block to cleanly hide the white fade pseudo-element
  exitTl.to('#hero-text-block', {
    opacity: 0,
    duration: 1,
  }, 0);

  // Title lines fly out in different directions
  exitTl.to('.hero-title-line:nth-child(1)', {
    opacity: 0,
    x: -80,
    duration: 1,
  }, 0.1);

  exitTl.to('.hero-title-line:nth-child(2)', {
    opacity: 0,
    y: 40,
    duration: 1,
  }, 0.15);

  exitTl.to('.hero-title-line:nth-child(3)', {
    opacity: 0,
    x: 60,
    duration: 1,
  }, 0.2);

  // Description fades down
  exitTl.to('#hero-description', {
    opacity: 0,
    y: 30,
    duration: 1,
  }, 0.1);

  // CTA scales down
  exitTl.to('#hero-cta-group', {
    opacity: 0,
    scale: 0.9,
    y: 20,
    duration: 1,
  }, 0.15);

  // Stats slide down
  exitTl.to('#hero-stats-strip', {
    opacity: 0,
    y: 40,
    duration: 1,
  }, 0.1);

  // Hotspots fade out
  exitTl.to('.hotspot', {
    opacity: 0,
    scale: 0.5,
    duration: 0.6,
    stagger: 0.05,
  }, 0);

  // Hide entire overlay layer after exit
  exitTl.to('#hero-overlay', {
    visibility: 'hidden',
    duration: 0.01,
  }, 1);
}

// ═══════ PRODUCT HOTSPOT (Single, on the box) ═══════
function initHotspots() {
  const hotspot = document.getElementById('hotspot-product');
  if (!hotspot) return;

  // Position the hotspot every frame (called from Three.js render loop)
  window.__hotspotUpdateFn = (projection) => {
    if (!projection) return;
    const { x, y, visible } = projection;
    
    if (visible) {
      hotspot.style.left = `${x}px`;
      hotspot.style.top = `${y}px`;
    }
  };

  // Click to zoom into the product
  hotspot.addEventListener('click', () => {
    // Pulse animation on the dot
    hotspot.classList.add('zooming');

    // Hide the hero overlay with a cinematic exit
    const overlay = document.getElementById('hero-overlay');
    if (overlay) {
      gsap.to('#hero-brand', { opacity: 0, y: -30, duration: 0.6, ease: 'power2.in' });
      gsap.to('#hero-text-block', { opacity: 0, duration: 0.6, ease: 'power2.in' });
      gsap.to('#hero-overline', { opacity: 0, x: -40, duration: 0.5, ease: 'power2.in' });
      gsap.to('.hero-title-line', { opacity: 0, y: -30, duration: 0.5, stagger: 0.05, ease: 'power2.in' });
      gsap.to('#hero-description', { opacity: 0, y: 20, duration: 0.4, ease: 'power2.in' });
      gsap.to('#hero-cta-group', { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.in' });
      gsap.to('#hero-stats-strip', { opacity: 0, y: 30, duration: 0.5, ease: 'power2.in' });
      gsap.to('.scroll-indicator', { opacity: 0, y: 20, duration: 0.3, ease: 'power2.in' });
      
      // Hide the hotspot itself
      gsap.to(hotspot, { opacity: 0, scale: 0, duration: 0.4, delay: 0.3, ease: 'power2.in' });

      // Hide overlay after animations
      gsap.to(overlay, { visibility: 'hidden', duration: 0.01, delay: 1.0 });
    }

    // Trigger camera zoom (defined in three-scene.js)
    if (window.__zoomToProduct) {
      window.__zoomToProduct();
    }
  });
}

// ═══════ HERO ANIMATIONS ═══════
function initHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Badge
  tl.to('[data-anim="fade-up"][data-delay="0.5"]', {
    opacity: 1,
    y: 0,
    duration: 0.8,
  }, 0.3);

  // Title
  tl.to('.hero-title', {
    opacity: 1,
    duration: 0.1,
  }, 0.5);

  // Animate title chars
  const titleEl = document.querySelector('.hero-title');
  if (titleEl) {
    const text = titleEl.innerHTML;
    // Simple word-by-word animation
    const words = titleEl.textContent.split(/\s+/);
    titleEl.innerHTML = text; // Keep the <br>
    
    tl.fromTo(titleEl, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
      0.5
    );
  }

  // Subtitle
  tl.to('.hero-subtitle', {
    opacity: 1,
    y: 0,
    duration: 0.8,
  }, 1.0);

  // Actions
  tl.to('.hero-actions', {
    opacity: 1,
    y: 0,
    duration: 0.8,
  }, 1.3);

  // Wordmark draw animation
  const wordmarkPaths = document.querySelectorAll('.wordmark-path');
  tl.to('.hero-wordmark', {
    opacity: 1,
    duration: 0.4,
  }, 1.6);

  wordmarkPaths.forEach((path, i) => {
    const length = path.getTotalLength ? path.getTotalLength() : 1000;
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    
    tl.to(path, {
      strokeDashoffset: 0,
      duration: 2,
      ease: 'power2.inOut',
    }, 1.8 + i * 0.1);
  });

  // Scroll indicator
  tl.to('.scroll-indicator', {
    opacity: 1,
    y: 0,
    duration: 0.6,
  }, 2.0);

  // Parallax on hero bg
  gsap.to('.hero-bg-image', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: {
      trigger: '.section-hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    }
  });
}

// ═══════ SCROLL ANIMATIONS ═══════
function initScrollAnimations() {
  // Fade up animations
  document.querySelectorAll('[data-anim="fade-up"]').forEach(el => {
    // Skip hero elements (handled separately)
    if (el.closest('.section-hero')) return;
    
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      }
    });
  });

  // Scale in animations
  document.querySelectorAll('[data-anim="scale-in"]').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      }
    });
  });

  // Split lines animation
  document.querySelectorAll('[data-anim="split-lines"]').forEach(el => {
    // Skip hero (handled separately)
    if (el.closest('.section-hero')) return;

    gsap.fromTo(el, 
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      }
    );
  });

  // Split words (brand statement)
  document.querySelectorAll('[data-anim="split-words"]').forEach(el => {
    const children = el.querySelectorAll('.word-group, .word-accent, .word-highlight');
    
    gsap.fromTo(children,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        }
      }
    );
  });

  // Slide in animations
  document.querySelectorAll('[data-anim="slide-in"]').forEach(el => {
    const delay = parseFloat(el.dataset.delay) || 0;
    
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      delay: delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none reverse',
      }
    });
  });
}

// ═══════ 3D CARD TILT ═══════
function initCardTilt() {
  document.querySelectorAll('[data-anim="card-3d"]').forEach((card, index) => {
    const delay = parseFloat(card.dataset.delay) || 0;

    // Scroll reveal
    gsap.to(card, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 0.8,
      delay: delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      }
    });

    // 3D tilt on mouse move
    const inner = card.querySelector('.card-inner');
    if (!inner) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -6;
      const rotateY = (x - centerX) / centerX * 6;

      gsap.to(inner, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 800,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(inner, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    });
  });
}

// ═══════ STATS SECTION ═══════
function initStatsAnimations() {
  const statsSection = document.querySelector('.section-stats');
  if (!statsSection) return;

  // Stat bars
  ScrollTrigger.create({
    trigger: statsSection,
    start: 'top 70%',
    onEnter: () => {
      document.querySelectorAll('.stat-bar-fill').forEach(bar => {
        const width = bar.dataset.width || 0;
        bar.classList.add('animate');
        setTimeout(() => {
          bar.style.width = width + '%';
        }, 100);
      });
    },
    once: true,
  });

  // Counter animations
  document.querySelectorAll('[data-anim="counter"]').forEach(el => {
    const delay = parseFloat(el.dataset.delay) || 0;
    
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      }
    });
  });
}

// ═══════ SUSTAINABILITY PARALLAX ═══════
function initSustainabilityParallax() {
  const bgImg = document.querySelector('.sustainability-bg-img');
  if (!bgImg) return;

  gsap.to(bgImg, {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.section-sustainability',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    }
  });
}

// ═══════ SCROLL INDICATOR CLICK ═══════
function initScrollIndicator() {
  const btn = document.getElementById('scroll-indicator');
  if (btn) {
    btn.addEventListener('click', () => {
      const nextSection = document.getElementById('brand-statement');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// ═══════ MAGNETIC BUTTON EFFECT ═══════
function initMagneticButtons() {
  document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(btn, {
        x: x * 0.15,
        y: y * 0.15,
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  });
}

// ═══════ CONTACT FORM ═══════
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('#submit-btn');
    const originalText = btn.querySelector('span').textContent;
    
    btn.querySelector('span').textContent = 'Sending...';
    btn.disabled = true;

    // Simulate submission
    setTimeout(() => {
      btn.querySelector('span').textContent = 'Assessment Requested ✓';
      btn.style.background = 'var(--eco-forest)';
      
      setTimeout(() => {
        btn.querySelector('span').textContent = originalText;
        btn.disabled = false;
        btn.style.background = '';
        form.reset();
      }, 3000);
    }, 1500);
  });
}

// ═══════ MAIN SITE INITIALIZATION ═══════
function initMainSite() {
  initThreeScene();

  initHeader();
  initActiveNavTracking();
  initScrollProgress();
  initHeroOverlay();
  initHotspots();
  initScrollAnimations();
  initCardTilt();
  initStatsAnimations();
  // initCounters();
  initSustainabilityParallax();
  initScrollIndicator();
  initMagneticButtons();
  initContactForm();
  initChatbot();

  // Init particles after a short delay (optional now that we have 3D, but can keep as an overlay)
  // setTimeout(() => {
  //   initParticles('hero-particles');
  // }, 100);
}

function initChatbot() {
    const toggleBtn = document.getElementById('toggleChat');
    const closeBtn = document.getElementById('closeChat');
    const widget = document.getElementById('chatbotWidget');
    const sendBtn = document.getElementById('sendChat');
    const inputField = document.getElementById('chatbotInput');
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!toggleBtn || !widget) return;

    // Enhanced Knowledge Base for simple intent matching
    const knowledgeBase = {
        greetings: {
            keywords: ['hi', 'hello', 'hey', 'greetings', 'morning', 'afternoon', 'sup'],
            responses: [
                "Hello there! How can I help you with Econovus packaging today?",
                "Hi! I'm the Econovus AI. What would you like to know about our sustainable solutions?"
            ]
        },
        contact: {
            keywords: ['contact', 'email', 'phone', 'call', 'talk', 'engineer', 'booking', 'meet', 'reach'],
            responses: [
                "You can reach us at info@econovus.co.in. Alternatively, fill out the contact form at the bottom of the page!",
                "Our packaging engineers are ready to help. Please use the contact section below to schedule a detailed assessment."
            ]
        },
        sustainability: {
            keywords: ['sustainable', 'sustainability', 'carbon', 'green', 'environment', 'eco', 'footprint', 'recycle', 'nature'],
            responses: [
                "We are proud to be India's First Carbon-Neutral Packaging Company! We help reduce carbon footprints by up to 93%.",
                "Our solutions use 100% sustainable materials and ensure zero waste to landfill."
            ]
        },
        products: {
            keywords: ['products', 'packaging', 'box', 'heavy', 'export', 'solution', 'container', 'industrial', 'design'],
            responses: [
                "We specialize in heavy-duty industrial containers, ISPM-15 compliant export packaging, and closed-loop returnable systems.",
                "Our engineered packaging can handle 1 Ton+ capacity while being fully foldable and designed for multi-trip use."
            ]
        },
        pricing: {
            keywords: ['price', 'cost', 'quote', 'estimate', 'pricing', 'cheap', 'expensive', 'money'],
            responses: [
                "Our engineered solutions typically offer up to 15% cost savings for our clients. For a customized quote, please reach out via our contact form!"
            ]
        },
        affirmative: {
            keywords: ['yes', 'yeah', 'sure', 'ok', 'okay', 'please', 'do it', 'yup'],
            responses: [
                "Great! Let me know if you have any specific questions about our process.",
                "Excellent. Feel free to explore the site or ask me anything else!"
            ]
        },
        fallback: {
            responses: [
                "I'm still learning! Could you rephrase that? Try asking about our sustainability, products, or contact info.",
                "That's an interesting question! While I'm just an AI, our human engineers would love to answer that for you. Use the contact form below!",
                "I might need a bit more context. Are you looking for information on our export packaging, carbon-neutral approach, or something else?"
            ]
        }
    };

    function getBotResponse(userMessage) {
        const lowerMsg = userMessage.toLowerCase();
        
        for (const intent in knowledgeBase) {
            if (intent === 'fallback') continue;
            const data = knowledgeBase[intent];
            // Check if any keyword matches as a substring
            const match = data.keywords.some(kw => lowerMsg.includes(kw));
            if (match) {
                return data.responses[Math.floor(Math.random() * data.responses.length)];
            }
        }
        
        return knowledgeBase.fallback.responses[Math.floor(Math.random() * knowledgeBase.fallback.responses.length)];
    }

    function toggleChat() {
        widget.classList.toggle('active');
        if (widget.classList.contains('active')) {
            setTimeout(() => inputField.focus(), 300);
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    function addMessage(text, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return typingDiv;
    }

    function handleSend() {
        const text = inputField.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, true);
        inputField.value = '';

        // Simulate AI typing and response
        setTimeout(() => {
            const typingIndicator = showTypingIndicator();

            setTimeout(() => {
                // Remove typing indicator
                if (typingIndicator.parentNode) {
                    typingIndicator.parentNode.removeChild(typingIndicator);
                }
                
                // Get smart contextual response
                const reply = getBotResponse(text);
                addMessage(reply, false);
            }, 1000 + Math.random() * 1000); // 1s - 2s typing delay for realism
        }, 400); // 0.4s initial delay
    }

    const suggestions = document.querySelectorAll('.suggestion-chip');
    suggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            inputField.value = chip.textContent;
            handleSend();
        });
    });

    sendBtn.addEventListener('click', handleSend);
    
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });
}

// ── Global Scroll Lock Helper ──
function preventScroll(e) {
  e.preventDefault();
}

// ═══════ INITIALIZE ═══════
document.addEventListener('DOMContentLoaded', () => {
  // Force scroll to top on reload to prevent browser from restoring a scrolled position
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  // Enforce strict scroll lock universally until cinematic finishes
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });

  // Listen for the final modelLoaded event (after cinematic ends) to unlock scroll
  window.addEventListener('modelLoaded', () => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.removeEventListener('wheel', preventScroll);
    window.removeEventListener('touchmove', preventScroll);
  }, { once: true });

  // Wait for the intro to finish (or be skipped) before initializing the main site
  window.addEventListener('introComplete', () => {
    initMainSite();
  }, { once: true });

  // Start the intro page logic
  initIntroPage();
});
