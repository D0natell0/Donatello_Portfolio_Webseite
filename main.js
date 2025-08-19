/* main.js — bereinigt, nur neuer Portfolio-Swiper bleibt */

(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function initAOS() {
    if (window.AOS) AOS.init({ duration: 800, once: true });
  }

  function initMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const mobileNav = document.getElementById('mobile-nav');
    if (!menuBtn || !menuOverlay || !mobileNav) return;

    let menuOpen = false;
    function openMenu() {
      menuOverlay.classList.remove('hidden');
      menuBtn.classList.add('open');
      menuOpen = true;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        mobileNav.classList.remove('scale-95', 'opacity-0');
        mobileNav.classList.add('scale-100', 'opacity-100');
      });
    }
    function closeMenu() {
      mobileNav.classList.remove('scale-100', 'opacity-100');
      mobileNav.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        menuOverlay.classList.add('hidden');
        menuOpen = false;
        document.body.style.overflow = '';
      }, 300);
      menuBtn.classList.remove('open');
    }
    menuBtn.addEventListener('click', e => { e.stopPropagation(); menuOpen ? closeMenu() : openMenu(); });
    menuOverlay.addEventListener('click', closeMenu);
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('click', e => {
      if (!menuOpen) return;
      if (!menuOverlay.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });
  }

  document.addEventListener('DOMContentLoaded', initMenu);

  function initBackToTop() {
    const backBtn = $('#backToTop');
    if (!backBtn) return;
    const toggle = () => {
      if (window.scrollY > 300) backBtn.classList.remove('hidden');
      else backBtn.classList.add('hidden');
    };
    window.addEventListener('scroll', throttle(toggle, 150));
    toggle();
  }

  function throttle(fn, wait = 100) {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  window.showPopup = function showPopup() {
    const popup = $('#popup');
    if (!popup) return;
    popup.classList.remove('hidden');
    popup.style.pointerEvents = 'auto';
    popup.classList.add('opacity-100');
    popup.classList.remove('opacity-0');
    setTimeout(() => {
      popup.classList.remove('opacity-100');
      popup.classList.add('opacity-0');
      popup.style.pointerEvents = 'none';
    }, 5000);
  };

  function initParallax() {
    const elements = $$('.move_it');
    const heroText = $('#heroText');
    let ticking = false;
    function update() {
      const scrollY = window.scrollY || window.pageYOffset;
      elements.forEach(el => {
        const mul = parseFloat(el.dataset.multiplier) || 0;
        const offset = scrollY * mul;
        el.style.transform = `translate3d(${offset}px, 0, 0)`;
      });
      if (heroText) {
        const fadeDistance = 500;
        const progress = Math.min((window.scrollY || 0) / fadeDistance, 1);
        const scale = 1 + progress * 0.5;
        const opacity = 1 - progress;
        heroText.style.transform = `scale(${scale})`;
        heroText.style.opacity = opacity;
      }
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // --- Lightbox, Thumbs, YouTube etc. bleiben unverändert ----------------
  function initLightbox() { /* ... dein bestehender Lightbox-Code ... */ }
  function initThumbnails() { /* ... dein bestehender Thumbnails-Code ... */ }
  function initYouTubeEmbeds() { /* ... dein bestehender YT-Code ... */ }
  function initLazyImages() { }

  function initAll() {
    initAOS();
    initMenu();
    initParallax();
    initSwiper();
    initLightbox();
    initThumbnails();
    initYouTubeEmbeds();
    initBackToTop();
    initLazyImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();

  // --- Swiper ----------------

function initSwiper() {
  // Alle Thumbs + Media Swiper verbinden
  document.querySelectorAll(".thumbs-swiper").forEach((thumbsEl) => {
    const mediaEl = thumbsEl.previousElementSibling;

    // Thumbs-Swiper
    const thumbs = new Swiper(thumbsEl, {
      slidesPerView: 4,
      spaceBetween: 10,
      loop: true,
      watchSlidesProgress: true,
    });

    // Media-Swiper
    new Swiper(mediaEl, {
      loop: true,
      spaceBetween: 10,
      zoom: true,
      fullscreen: { enabled: true },
      thumbs: { swiper: thumbs },
    });
  });

  // Haupt-Swiper (Portfolio Coverflow)
  new Swiper(".portfolio-swiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    coverflowEffect: {
      rotate: 30,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: false,
    },
    autoplay: { delay: 5000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", type: "progressbar" },
  });
}