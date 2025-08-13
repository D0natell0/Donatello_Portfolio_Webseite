/* main.js — gebündeltes, optimiertes JS
   - deferred in HTML
   - no globals leaked (IIFE)
*/

(() => {
  'use strict';

  // --- Helper --------------------------------------------------------------
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // --- AOS init -----------------------------------------------------------
  function initAOS() {
    if (window.AOS) AOS.init({ duration: 800, once: true });
  }

  // --- Burger Menu -----------------------------------------------------------
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

    // Body scroll sperren
    document.body.style.overflow = 'hidden';

    // Animation starten
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

      // Body scroll wieder erlauben
      document.body.style.overflow = '';
    }, 300);

    menuBtn.classList.remove('open');
  }


    // Toggle Menü
    menuBtn.addEventListener('click', e => {
      e.stopPropagation(); // verhindert sofortiges Schließen
      menuOpen ? closeMenu() : openMenu();
    });

    // Klick auf Overlay schließt Menü
    menuOverlay.addEventListener('click', closeMenu);

    // Klick auf Navigation schließt Menü
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    // Klick außerhalb schließt Menü
    document.addEventListener('click', e => {
      if (!menuOpen) return;
      if (!menuOverlay.contains(e.target) && !menuBtn.contains(e.target)) {
        closeMenu();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initMenu);

  // --- Back to top button -------------------------------------------------
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

  // throttle helper
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

  // --- Popup for contact form ---------------------------------------------
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

  // --- Parallax / hero effects (rAF) -------------------------------------
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

  // --- Swiper init --------------------------------------------------------
  function initSwiper() {
    if (window.Swiper) {
      // eslint-disable-next-line no-unused-vars
      const swiper = new Swiper('.skills-slider', {
        effect: 'cards',
        grabCursor: true,
        centeredSlides: true,
        rewind: true,
        slidesPerView: 'auto',
        coverflowEffect: { rotate: 0, stretch: 0, depth: 200, modifier: 1.5, slideShadows: false },
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
      });
    }
  }

// --- Lightbox & Gallery -------------------------------------------------
function initLightbox() {
  const lightbox = $('#lightbox');
  const mediaContainer = $('#lightbox-media');
  const closeBtn = $('#lightbox-close');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');

  // Build galleries (ignore miniatures)
  const items = Array.from(document.querySelectorAll('[data-gallery]'))
    .filter(el => !el.closest('.miniatures')); // Miniaturen ausschließen
  const galleries = {};
  items.forEach(item => {
    const name = item.dataset.gallery;
    if (!name) return;
    if (!galleries[name]) galleries[name] = [];
    galleries[name].push(item);
  });

  let currentGallery = null;
  let currentIndex = 0;

  function showLightbox(name, index) {
    const gallery = galleries[name];
    if (!gallery || !gallery[index]) return;
    currentGallery = name;
    currentIndex = index;
    const item = gallery[index];
    mediaContainer.innerHTML = '';

    const tag = item.tagName.toLowerCase();
    if (tag === 'video') {
      const v = item.cloneNode(true);
      v.controls = true;
      v.autoplay = true;
      mediaContainer.appendChild(v);
    } else if (tag === 'img') {
      const img = item.cloneNode(true);
      img.classList.remove('hidden');
      img.style.filter = 'none';
      mediaContainer.appendChild(img);
    }

    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.remove('hidden');
  }

  function showNext() {
    const gallery = galleries[currentGallery] || [];
    currentIndex = (currentIndex + 1) % gallery.length;
    showLightbox(currentGallery, currentIndex);
  }
  function showPrev() {
    const gallery = galleries[currentGallery] || [];
    currentIndex = (currentIndex - 1 + gallery.length) % gallery.length;
    showLightbox(currentGallery, currentIndex);
  }

  // Attach click listeners (inklusive Miniaturen)
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      const gallery = item.dataset.gallery;
      const idx = parseInt(item.dataset.index || items.indexOf(item), 10);
      showLightbox(gallery, idx);
    });
  });

  prevBtn?.addEventListener('click', e => { e.stopPropagation(); showPrev(); });
  nextBtn?.addEventListener('click', e => { e.stopPropagation(); showNext(); });

  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    mediaContainer.innerHTML = '';
    lightbox.classList.add('hidden');
  }

  closeBtn?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });
}

// --- Thumbnails for galleries -------------------------------------------
function initThumbnails() {
  const galleryEntries = Object.entries(
    Array.from(document.querySelectorAll('[data-gallery]'))
      .filter(el => !el.classList.contains('miniatures'))
      .reduce((acc, el) => {
        const name = el.dataset.gallery;
        if (!name) return acc;
        if (!acc[name]) acc[name] = [];
        acc[name].push(el);
        return acc;
      }, {})
  );

  galleryEntries.forEach(([name, items]) => {
    const container = document.querySelector(`.miniatures[data-gallery="${name}"]`);
    if (!container || items.length <= 1) return;
    const maxThumbs = 3;
    const hiddenCount = items.length - 1 - maxThumbs;
    items.slice(1, 1 + maxThumbs).forEach((item, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'relative';
      const thumb = item.cloneNode(true);
      thumb.classList.remove('hidden');
      thumb.classList.add('w-12', 'h-12', 'object-cover', 'rounded', 'shadow', 'cursor-pointer', 'border-2', 'border-white');
      thumb.addEventListener('click', () => {
        // Öffne direkt das Originalbild im Lightbox
        const idx = parseInt(item.dataset.index || items.indexOf(item), 10);
        item.click(); // klickt auf das Original, nicht die Miniatur selbst
      });
      wrapper.appendChild(thumb);

      if (i === maxThumbs - 1 && hiddenCount > 0) {
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black/60 text-white text-xs flex items-center justify-center rounded';
        overlay.style.pointerEvents = 'none';
        overlay.textContent = `+${hiddenCount}`;
        wrapper.appendChild(overlay);
      }
      container.appendChild(wrapper);
    });
    container.classList.remove('hidden');
  });
}


  // --- YouTube lazy embeds (nocookie) ------------------------------------
  function initYouTubeEmbeds() {
    const embeds = document.querySelectorAll('.youtube-embed');
    embeds.forEach(wrapper => {
      const videoId = wrapper.dataset.videoId;
      if (!videoId) return;
      const thumbnail = wrapper.querySelector('img');
      const button = wrapper.querySelector('.play-button');

      function loadIframe() {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        wrapper.innerHTML = '';
        wrapper.appendChild(iframe);
      }

      thumbnail?.addEventListener('click', loadIframe);
      button?.addEventListener('click', loadIframe);
    });
  }

  // --- Lazy-loading images background (optional IntersectionObserver) ----
  function initLazyImages() {
    // Most images use loading="lazy" attribute; additional behaviors can be placed here.
    // Example: replace small placeholders with real images when visible.
  }

  // --- Utilities initialisation -------------------------------------------
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

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();