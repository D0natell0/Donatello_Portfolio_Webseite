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
  function initThumbnails() { /* ... dein bestehender Thumbnails-Code ... */ }
  function initYouTubeEmbeds() { /* ... dein bestehender YT-Code ... */ }
  function initLazyImages() { }

  function initAll() {
    initAOS();
    initMenu();
    initParallax();
    initSwiper();
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
  // Media Swiper (Videos, Bilder, iFrames)
  document.querySelectorAll(".media-swiper").forEach((mediaEl) => {
    const swiper = new Swiper(mediaEl, {
      loop: true,
      spaceBetween: 10,
      zoom: true,
      navigation: {
        nextEl: mediaEl.querySelector(".swiper-button-next"),
        prevEl: mediaEl.querySelector(".swiper-button-prev"),
      },
      pagination: {
        el: mediaEl.querySelector(".swiper-pagination"),
        clickable: true,
      },
      on: {
        init: function () {
          lazyLoadMedia(this.slides[this.activeIndex]);
        },
        slideChange: function () {
          lazyLoadMedia(this.slides[this.activeIndex]);
        },
      },
    });
  });

  // Haupt-Swiper (Portfolio)
  new Swiper(".portfolio-swiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    coverflowEffect: {
      rotate: 30,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    autoplay: { delay: 10000, disableOnInteraction: true },
    pagination: { el: ".swiper-pagination" },
    breakpoints: {
      1024: { slidesPerView: 2 },
      768: { slidesPerView: 1.5 },
      480: { slidesPerView: 1.5 },
    },
  });

function lazyLoadMedia(slideEl) {
  if (!slideEl) return;

  // Lade Videos
  slideEl.querySelectorAll("video[data-src]").forEach((video) => {
    if (!video.src) {
      video.src = video.getAttribute("data-src");
      video.load();
    }
  });

  // Lade Iframes
  slideEl.querySelectorAll("iframe[data-src]").forEach((iframe) => {
    if (!iframe.src) {
      iframe.src = iframe.getAttribute("data-src");
    }
  });

  // Lade Bilder
  slideEl.querySelectorAll("img[data-src]").forEach((img) => {
    if (!img.src) {
      img.src = img.getAttribute("data-src");
    }
  });
}


// Funktion zum Starten des Fullscreens
function enableFullscreenOnClick() {
  let currentGroup = null;  // Speichert die aktuelle Gruppe
  let fullscreenSwiper = null; // Die Instanz des Fullscreen-Swipers

  // Klick-Event für Bilder/Videos
  document.querySelectorAll("img, video").forEach((media) => {
    media.addEventListener("click", (event) => {
      // Verhindere das Öffnen des Fullscreens für Iframes
      if (media.tagName.toLowerCase() === "iframe") return;

      // Bestimme die Gruppe des angeklickten Bildes
      currentGroup = media.closest('.swiper-slide').dataset.group;

      // Alle Medien der Gruppe finden
      const mediaItems = [...document.querySelectorAll(`.swiper-slide[data-group="${currentGroup}"]`)];

      // Verhindere doppelte Duplikation, wenn der Fullscreen bereits offen ist
      if (!fullscreenSwiper) {
        fullscreenSwiper = new Swiper('.fullscreen-swiper', {
          loop: true,
          zoom: true,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          on: {
            init: function () {
              // Entferne alle vorherigen Slides im Fullscreen-Swiper
              this.removeAllSlides();

              // Dupliziere die Bilder/Videos
              mediaItems.forEach((item, index) => {
                // Dupliziere den Slide (inklusive der Daten)
                const slideClone = item.cloneNode(true);

                // Lazy Load für das duplizierte Bild/Video
                lazyLoadMedia(slideClone);

                // Passe das Seitenverhältnis des Bildes an (16:9)
                adjustImageAspectRatio(slideClone);

                // Füge den duplizierten Slide dem Fullscreen-Swiper hinzu
                this.appendSlide(slideClone);

                // Initiale Auswahl des angeklickten Bildes im Fullscreen
                if (item === media.closest('.swiper-slide')) {
                  this.slideTo(index);
                }
              });
            },
            slideChange: function () {
              // Lazy Loading für das aktuelle Slide im Fullscreen
              lazyLoadMedia(this.slides[this.activeIndex]);
              adjustImageAspectRatio(this.slides[this.activeIndex]); // Anpassung des Bildverhältnisses
            },
          }
        });
      }

      // Zeige den Fullscreen-Wrapper
      document.querySelector('.fullscreen-wrapper').classList.add('visible');
    });
  });

  // Schließen-Button
  document.querySelector('.fullscreen-close').addEventListener('click', () => {
    document.querySelector('.fullscreen-wrapper').classList.remove('visible');
    
    if (fullscreenSwiper) {
      // Zerstöre nur den Fullscreen-Swiper (entfernt alle duplizierten Slides)
      fullscreenSwiper.destroy(true, true);  // Der zweite Parameter sorgt dafür, dass auch die Slides entfernt werden
      fullscreenSwiper = null;  // Setze auf null, um beim nächsten Öffnen neu zu erstellen
    }
  });
}

// Funktion für Lazy Loading (Bilder, Videos, iFrames)
function lazyLoadMedia(slideEl) {
  if (!slideEl) return;

  // Lade Videos
  slideEl.querySelectorAll("video[data-src]").forEach((video) => {
    if (!video.src) {
      video.src = video.getAttribute("data-src");
      video.load();
    }
  });

  // Lade Iframes
  slideEl.querySelectorAll("iframe[data-src]").forEach((iframe) => {
    if (!iframe.src) {
      iframe.src = iframe.getAttribute("data-src");
    }
  });

  // Lade Bilder
  slideEl.querySelectorAll("img[data-src]").forEach((img) => {
    if (!img.src) {
      img.src = img.getAttribute("data-src");
    }
  });
}

// Funktion für das 16:9 Seitenverhältnis (Bilder und Videos anpassen)
function adjustImageAspectRatio(slideEl) {
  if (!slideEl) return;

  const media = slideEl.querySelector("img, video");

  if (media) {
    // Berechne das Seitenverhältnis für Bilder und Videos
    const aspectRatio = 16 / 9;
    const width = media.width || media.videoWidth;
    const height = media.height || media.videoHeight;

    if (width && height) {
      const mediaAspect = width / height;

      // Wenn das Bild/Video nicht im 16:9-Verhältnis ist, passt es sich an
      if (mediaAspect > aspectRatio) {
        media.style.width = '100%';
        media.style.height = 'auto'; // Höhe anpassen
      } else {
        media.style.height = '100%';
        media.style.width = 'auto'; // Breite anpassen
      }
    }
  }
}

// Lazy Load für die Medien
function lazyLoadMedia(slideEl) {
  if (!slideEl) return;

  // Lade Videos
  slideEl.querySelectorAll("video[data-src]").forEach((video) => {
    if (!video.src) {
      video.src = video.getAttribute("data-src");
      video.load();
    }
  });

  // Lade Iframes
  slideEl.querySelectorAll("iframe[data-src]").forEach((iframe) => {
    if (!iframe.src) {
      iframe.src = iframe.getAttribute("data-src");
    }
  });

  // Lade Bilder
  slideEl.querySelectorAll("img[data-src]").forEach((img) => {
    if (!img.src) {
      img.src = img.getAttribute("data-src");
    }
  });
}

// Initialisieren der Fullscreen-Funktion
document.addEventListener("DOMContentLoaded", function () {
  enableFullscreenOnClick(); // Klick-Event für Fullscreen
});

}

  const articles = document.querySelectorAll("#skills article");

  articles.forEach(article => {
    article.addEventListener("click", () => {
      // erst ALLE Artikel schließen
      articles.forEach(a => {
        const text = a.querySelector("p");
        const icon = a.querySelector("[data-lucide='chevron-down']");
        if (text) text.classList.add("hidden");
        if (icon) icon.classList.remove("rotate-180");
      });

      // dann nur den geklickten öffnen (falls vorhanden)
      const text = article.querySelector("p");
      const icon = article.querySelector("[data-lucide='chevron-down']");
      if (text) text.classList.remove("hidden");
      if (icon) icon.classList.add("rotate-180");
    });
  });

 // Dein Popup Befehl
  window.showPopup = function showPopup() {
    const popup = document.getElementById('popup');
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

  // Formular Submit
  function handleSubmit(e) {
    e.preventDefault();

    // hCaptcha Token prüfen
    const token = hcaptcha.getResponse();
    if (!token) {
      alert('Bitte bestätige, dass du kein Roboter bist!');
      return false;
    }

    // Formular absenden
    document.getElementById('myForm').submit();
    return true;
  }

  // Popup anzeigen, wenn iFrame lädt
  document.querySelector('iframe[name="hidden_iframe"]').addEventListener('load', function() {
    showPopup();
  });

  // DSGVO-konformes Laden von hCaptcha erst beim Benutzerinteresse
  let hcaptchaLoaded = false;
  function loadHCaptcha() {
    if (hcaptchaLoaded) return;
    hcaptchaLoaded = true;

    const script = document.createElement('script');
    script.src = 'https://hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    script.onload = function() {
      hcaptcha.render('hcaptcha-container', {
        sitekey: '1e5c66a6-139c-4e86-8fbc-91cc8bbebb58'
      });
    };
    document.body.appendChild(script);
  }

  // Trigger: Nutzer klickt in ein Feld
  const formFields = document.querySelectorAll('#myForm input, #myForm textarea');
  formFields.forEach(field => field.addEventListener('focus', loadHCaptcha, { once: true }));