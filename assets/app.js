/**
 * Donatello-Media — Konzept "INDEX" · v2
 * i18n (DE/EN) · Dark/Light-Toggle · Trading Card (Tilt + Flip)
 * Scroll-Reveals · Mobile-Nav · Formular
 */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ══════════════════════════════════════════════════════════
       ÜBERSETZUNGEN
    ══════════════════════════════════════════════════════════ */
    const I18N = {
        de: {
            'nav.index': 'Portfolio',
            'nav.about': 'Über',
            'nav.cta': 'Projekt anfragen',

            'hero.status': 'Verfügbar für Projekte',
            'hero.h1a': 'Bewegtbild,',
            'hero.h1b': 'das hängen',
            'hero.h1c': 'bleibt.',
            'hero.lede': 'Ich bin Niklas von Donatello-Media. Als dein Partner helfe ich dir von der ersten Skizze bis zum finalen Produkt',
            'hero.play': 'Showreel abspielen',
            'hero.cta1': 'Arbeiten ansehen',
            'hero.cta2': 'Projekt anfragen',
            'hero.m1v': 'Augsburg',        'hero.m1l': 'Standort',
            'hero.m2v': '6+ Jahre',         'hero.m2l': 'Erfahrung',
            'hero.m3v': 'Viele Skills',       'hero.m3l': 'Ein Anspruch',

            'index.t1': 'Mein',
            'index.t2': 'Portfolio',
            'index.note': 'Fünf Bereiche — ein Verzeichnis',
            'area.motion': 'Motion Design',
            'area.video': 'Videoschnitt',
            'area.3d': '3D-Design',
            'area.branding': 'Branding',
            'area.bild': 'Bildbearbeitung',
            'tags.motion': 'After Effects · 2D · Logo-Animation',
            'tags.video': 'Premiere Pro · Storytelling · Post',
            'tags.3d': 'Blender · Modelling · Rendering',
            'tags.branding': 'Logo · Corporate Design · Print',
            'tags.bild': 'Retusche · Compositing · Photoshop',

            'about.t1': 'Das bin',
            'about.t2': 'ich',
            'about.note': 'Niklas Schubert — Donatello-Media',
            'about.p1': '<strong>Donatello-Media ist nicht „von allem etwas“, es ist ein einziger Standard:</strong> Gestaltung, die sitzt. Als Mediengestalter verbinde ich Motion Design, Videoproduktion, 3D und Branding zu einem Stil — von der ersten Idee bis zum finalen Export.',
            'about.p2': 'Gutes Design lebt nicht von Schriften, Farben und Formen. Gutes Design lebt von einem durchdachten Konzept.',
            'about.p3': 'Ich arbeite mit der Adobe-Creative-Cloud und Blender.',
            'about.s1': 'Jahre Erfahrung',
            'about.s2': 'Abgeschlossene Projekte',
            'about.s3': 'zufriedene Kunden',

            'contact.t1': 'Lass uns',
            'contact.t2': 'loslegen',
            'contact.note': 'Antwort meist innerhalb von 24 h',

            'card.role': 'Mediengestalter · Donatello-Media',
            'card.hint': 'Umdrehen',
            'card.backTitle': 'Kontakt',
            'card.email': 'E-Mail',
            'card.phone': 'Telefon',
            'card.location': 'Standort',
            'card.locationValue': 'Augsburg, Deutschland',
            'card.backHint': 'Klicken zum Umdrehen',
            'card.portraitPh': 'Portrait folgt',

            'form.name': 'Name',
            'form.namePh': 'Max Mustermann',
            'form.email': 'E-Mail',
            'form.emailPh': 'max@mustermann.de',
            'form.msg': 'Projekt',
            'form.msgPh': 'Erzähl mir von deiner Idee …',
            'form.send': 'Nachricht senden',
            'form.privacy': 'Mit dem Absenden stimmst du der Verarbeitung deiner Daten gemäß Datenschutzerklärung zu.',
            'form.sending': 'Wird gesendet …',
            'form.ok': 'Danke! Deine Nachricht ist angekommen.',
            'form.err': 'Das hat leider nicht geklappt. Schreib mir gern direkt per E-Mail.',

            'footer.tag': 'Donatello-Media — Crafted to move.',
            'footer.imprint': 'Impressum',
            'footer.privacy': 'Datenschutz',

            'sub.index': 'Portfolio',
            'sub.t1': 'Ausgewählte',
            'sub.t2': 'Projekte',
            'sub.count': 'Projekte',
            'sub.prev': '← Vorheriger Bereich',
            'sub.next': 'Nächster Bereich →',
            'sub.ctaA': 'Sowas brauchst du auch?',
            'sub.ctaB': 'Lass uns reden',
            'sub.ph': 'Medien folgen',
            'lede.motion': 'Logo-Animationen, Erklärfilme und Titelsequenzen — Bewegung mit Absicht. Jedes Keyframe hat einen Grund, jeder Schnitt einen Rhythmus.',
            'lede.video': 'Vom Rohmaterial zum fertigen Film: Schnitt, Farbkorrektur und Postproduktion mit Fokus auf Storytelling und Timing.',
            'lede.3d': 'Modelling, Texturing, Animation und Rendering in Blender — von stilisierten Szenen bis zu realistischen Visualisierungen.',
            'lede.branding': 'Logos, Farbwelten und Corporate Design mit klarer Formsprache — Marken, die man wiedererkennt, bevor man den Namen liest.',
            'lede.bild': 'Retusche, Compositing und Bildlooks auf hohem Niveau — Bilder, die genau so aussehen, wie sie sich anfühlen sollen.'
        },
        en: {
            'nav.index': 'Portfolio',
            'nav.about': 'About',
            'nav.cta': 'Start a project',

            'hero.status': 'Available for projects',
            'hero.h1a': 'Visuals',
            'hero.h1b': 'that stick',
            'hero.h1c': 'with you.',
            'hero.lede': 'I\u2019m  Niklas, the owner of Donatello-Media. As your partner, I’ll guide you every step of the way, from the initial sketch to the final product.',
            'hero.play': 'Play showreel',
            'hero.cta1': 'View work',
            'hero.cta2': 'Start a project',
            'hero.m1v': 'Augsburg, DE',    'hero.m1l': 'Based in',
            'hero.m2v': '6+ years',         'hero.m2l': 'Experience',
            'hero.m3v': 'Many skills',    'hero.m3l': 'One standard',

            'index.t1': 'My',
            'index.t2': 'Portfolio',
            'index.note': 'Five disciplines — one directory',
            'area.motion': 'Motion Design',
            'area.video': 'Video Editing',
            'area.3d': '3D Design',
            'area.branding': 'Branding',
            'area.bild': 'Image Editing',
            'tags.motion': 'After Effects · 2D · Logo animation',
            'tags.video': 'Premiere Pro · Storytelling · Post',
            'tags.3d': 'Blender · Modelling · Rendering',
            'tags.branding': 'Logo · Corporate design · Print',
            'tags.bild': 'Retouching · Compositing · Photoshop',

            'about.t1': 'That\u2019s',
            'about.t2': 'me',
            'about.note': 'Niklas Schubert — Donatello-Media',
            'about.p1': '<strong>Donatello-Media isn\u2019t a bit of everything, it\u2019s one standard:</strong> design that lands. As a media designer I combine motion design, video production, 3D and branding into one style, from first idea to final export.',
            'about.p2': 'Good design isn’t just about fonts, colors, and shapes. Good design is built on a well-thought-out concept.',
            'about.p3': 'I work with Adobe-Creative-Suite and Blender.',
            'about.s1': 'Years of experience',
            'about.s2': 'Completed projects',
            'about.s3': 'Happy Clients',

            'contact.t1': 'Let\u2019s get',
            'contact.t2': 'started',
            'contact.note': 'Usually replies within 24 h',

            'card.role': 'Media Designer · Donatello-Media',
            'card.hint': 'Flip',
            'card.backTitle': 'Contact',
            'card.email': 'Email',
            'card.phone': 'Phone',
            'card.location': 'Location',
            'card.locationValue': 'Augsburg, Germany',
            'card.backHint': 'Click to flip',
            'card.portraitPh': 'Portrait coming soon',

            'form.name': 'Name',
            'form.namePh': 'Jane Doe',
            'form.email': 'Email',
            'form.emailPh': 'jane@doe.com',
            'form.msg': 'Project',
            'form.msgPh': 'Tell me about your idea …',
            'form.send': 'Send message',
            'form.privacy': 'By submitting you agree to the processing of your data according to the privacy policy.',
            'form.sending': 'Sending …',
            'form.ok': 'Thanks! Your message has arrived.',
            'form.err': 'That didn\u2019t work. Feel free to email me directly.',

            'footer.tag': 'Donatello-Media — Crafted to move.',
            'footer.imprint': 'Legal notice',
            'footer.privacy': 'Privacy',

            'sub.index': 'Portfolio',
            'sub.t1': 'Selected',
            'sub.t2': 'projects',
            'sub.count': 'projects',
            'sub.prev': '← Previous discipline',
            'sub.next': 'Next discipline →',
            'sub.ctaA': 'Need something like this?',
            'sub.ctaB': 'Let\u2019s talk',
            'sub.ph': 'Media coming soon',
            'lede.motion': 'Logo animations, explainer films and title sequences — motion with intent. Every keyframe has a reason, every cut a rhythm.',
            'lede.video': 'From raw footage to finished film: editing, color grading and post-production with a focus on storytelling and timing.',
            'lede.3d': 'Modelling, texturing, animation and rendering in Blender — from stylised scenes to realistic visualisations.',
            'lede.branding': 'Logos, color systems and corporate design with a clear visual language — brands you recognise before reading the name.',
            'lede.bild': 'Retouching, compositing and image looks at a high level — pictures that look exactly the way they should feel.'
        }
    };

    let lang = localStorage.getItem('dm-lang') || 'de';
    function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.de[key] || ''; }

    function applyLang() {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!I18N.de[key]) return;
            if (key === 'about.p1' || key === 'about.p2') { el.innerHTML = t(key); }
            else { el.textContent = t(key); }
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
        });
        const label = document.getElementById('langLabel');
        if (label) label.textContent = lang === 'de' ? 'EN' : 'DE';
        const btn = document.getElementById('langToggle');
        if (btn) btn.setAttribute('aria-label', lang === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln');
        document.querySelectorAll('[data-setlang]').forEach(b =>
            b.classList.toggle('active', b.getAttribute('data-setlang') === lang)
        );
    }

    function initLang() {
        applyLang();
        const btn = document.getElementById('langToggle');
        if (btn) btn.addEventListener('click', () => {
            lang = lang === 'de' ? 'en' : 'de';
            localStorage.setItem('dm-lang', lang);
            applyLang();
        });
        document.querySelectorAll('[data-setlang]').forEach(b =>
            b.addEventListener('click', () => {
                lang = b.getAttribute('data-setlang');
                localStorage.setItem('dm-lang', lang);
                applyLang();
            })
        );
    }

    /* ══════════════════════════════════════════════════════════
       THEME (Dark / Light)
    ══════════════════════════════════════════════════════════ */
    function initTheme() {
        if (localStorage.getItem('dm-theme') === 'light') document.body.classList.add('light');
        const btn = document.getElementById('themeToggle');
        if (btn) btn.addEventListener('click', () => {
            const light = document.body.classList.toggle('light');
            localStorage.setItem('dm-theme', light ? 'light' : 'dark');
        });
    }

    /* ══════════════════════════════════════════════════════════
       TRADING CARD — Tilt (Maus) + Flip (Klick) + Holo
    ══════════════════════════════════════════════════════════ */
    function initCard() {
        const scene = document.getElementById('tcardScene');
        const card = document.getElementById('tcard');
        if (!scene || !card) return;

        let flipped = false, flipping = false;
        let tx = 0, ty = 0, targetX = 0, targetY = 0;

        function setTransform() {
            const y = (flipped ? 180 : 0) + ty;
            card.style.transform = 'rotateY(' + y + 'deg) rotateX(' + tx + 'deg)';
        }

        /* Flip funktioniert immer — bei Reduced Motion sofort statt animiert */
        function flip() {
            if (flipping) return;
            if (reduceMotion) { flipped = !flipped; setTransform(); return; }
            flipping = true;
            const from = flipped ? 180 : 0;
            const to = flipped ? 0 : 180;
            const startTX = tx, startTY = ty;
            const dur = 640;
            const t0 = performance.now();
            function step(now) {
                const p = Math.min((now - t0) / dur, 1);
                const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                const angle = from + (to - from) * e;
                card.style.transform = 'rotateY(' + (angle + startTY * (1 - e)) + 'deg) rotateX(' + (startTX * (1 - e)) + 'deg)';
                if (p < 1) { requestAnimationFrame(step); }
                else { flipped = !flipped; tx = ty = targetX = targetY = 0; flipping = false; setTransform(); }
            }
            requestAnimationFrame(step);
        }

        scene.addEventListener('click', (e) => {
            if (e.target.closest('a')) return; /* Links auf der Rückseite nicht abfangen */
            flip();
        });
        scene.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
        });

        if (reduceMotion) { setTransform(); return; }

        /* Tilt-Loop */
        const lerp = (a, b, f) => a + (b - a) * f;
        (function loop() {
            if (!flipping) {
                tx = lerp(tx, targetX, 0.1);
                ty = lerp(ty, targetY, 0.1);
                setTransform();
            }
            requestAnimationFrame(loop);
        })();

        scene.addEventListener('mousemove', (e) => {
            const r = scene.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width;
            const ny = (e.clientY - r.top) / r.height;
            targetY = (nx - 0.5) * 34;
            targetX = -(ny - 0.5) * 26;
            /* Holo-Position an die Karte weitergeben */
            card.style.setProperty('--mx', Math.round(nx * 100) + '%');
            card.style.setProperty('--my', Math.round(ny * 100) + '%');
        });
        scene.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });
    }

    /* ══════════════════════════════════════════════════════════
       SCROLL-REVEAL
    ══════════════════════════════════════════════════════════ */
    function initReveal() {
        const els = document.querySelectorAll('.reveal:not(.revealed)');
        if (!els.length) return;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('revealed'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
        els.forEach(el => io.observe(el));
    }

    /* ══════════════════════════════════════════════════════════
       MOBILE-NAV
    ══════════════════════════════════════════════════════════ */
    function initNav() {
        const nav = document.querySelector('.nav');
        const burger = document.querySelector('.nav-burger');
        if (!nav || !burger) return;
        burger.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.querySelectorAll('.nav-link, .nav-cta').forEach(a =>
            a.addEventListener('click', () => nav.classList.remove('open'))
        );
    }

    /* ══════════════════════════════════════════════════════════
       KONTAKTFORMULAR (Formspree)
    ══════════════════════════════════════════════════════════ */
    function initForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;
        const status = document.getElementById('formStatus');
        const btn = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
            if (status) { status.textContent = t('form.sending'); status.style.color = ''; }
            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });
                if (!res.ok) throw new Error('send failed');
                form.reset();
                if (status) { status.textContent = t('form.ok'); status.style.color = '#7D37C3'; }
            } catch (err) {
                if (status) { status.textContent = t('form.err'); }
            } finally {
                if (btn) { btn.disabled = false; btn.style.opacity = ''; }
            }
        });
    }

    function initYear() {
        const y = document.getElementById('year');
        if (y) y.textContent = new Date().getFullYear();
    }

    /* ══════════════════════════════════════════════════════════
       PARTIALS — Nav & Footer zentral aus /partials/ laden
       (einmal ändern, gilt auf allen Seiten)
    ══════════════════════════════════════════════════════════ */
    async function loadIncludes() {
        const nodes = Array.from(document.querySelectorAll('[data-include]'));
        await Promise.all(nodes.map(async (node) => {
            try {
                const res = await fetch(node.getAttribute('data-include'), { cache: 'no-cache' });
                if (!res.ok) throw new Error(res.status);
                const tpl = document.createElement('template');
                tpl.innerHTML = (await res.text()).trim();
                node.replaceWith(tpl.content);
            } catch (err) {
                console.warn('Partial konnte nicht geladen werden:', node.getAttribute('data-include'), err);
            }
        }));
    }

    /* ══════════════════════════════════════════════════════════
       SHOWREEL-LIGHTBOX
    ══════════════════════════════════════════════════════════ */
    function initShowreel() {
        const btn = document.getElementById('showreelBtn');
        const box = document.getElementById('showreelBox');
        const video = document.getElementById('showreelVideo');
        const close = document.getElementById('showreelClose');
        if (!btn || !box || !video) return;

        const bgVideo = document.querySelector('.hero-video');

        function open() {
            box.hidden = false;
            requestAnimationFrame(() => box.classList.add('on'));
            if (bgVideo) bgVideo.pause();
            video.play().catch(() => {});
            document.body.style.overflow = 'hidden';
            (close || box).focus?.();
        }
        function shut() {
            video.pause();
            box.classList.remove('on');
            document.body.style.overflow = '';
            setTimeout(() => { box.hidden = true; }, 300);
            if (bgVideo && !reduceMotion) bgVideo.play().catch(() => {});
            btn.focus();
        }
        btn.addEventListener('click', open);
        if (close) close.addEventListener('click', shut);
        box.addEventListener('click', (e) => { if (e.target === box) shut(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !box.hidden) shut();
        });
    }

    /* Theme-Klasse so früh wie möglich setzen (kein Aufblitzen) */
    if (localStorage.getItem('dm-theme') === 'light') document.body.classList.add('light');

    async function boot() {
        await loadIncludes();   /* Nav & Footer zuerst — Toggles leben dort */
        initTheme();
        initLang();
        initReveal();
        initNav();
        initForm();
        initCard();
        initShowreel();
        initYear();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
