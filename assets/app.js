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
            'form.produkt': 'Bereich',
            'form.produktEmpty': 'Bitte wählen',
            'form.produktOther': 'Sonstiges / weiß noch nicht',
            'form.paket': 'Paket',
            'form.paketEmpty': 'Bitte wählen',
            'form.paketStart': 'Start',
            'form.paketStudio': 'Studio',
            'form.paketSignature': 'Signature',
            'form.paketUnsure': 'Weiß ich noch nicht',
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
            'sub.ctaA': 'Interessiert?',
            'sub.ctaB': 'Lass uns reden',
            'sub.ph': 'Medien folgen',
            'price.eyebrow': 'Pakete & Preise',
            'price.t1': 'Fair',
            'price.t2': 'kalkuliert',
            'price.lede': 'Drei Pakete — vom schnellen Einstieg bis zur kompletten Produktion. Alle Preise sind Einstiegspreise und richten sich nach Umfang und Material.',
            'price.from': 'ab',
            'price.request': 'Auf Anfrage',
            'price.badge': 'Beliebt',
            'price.cta': 'Anfragen',
            'price.ctaSig': 'Beratung anfragen',
            'price.note': 'Alle Preise verstehen sich als Richtwerte zzgl. USt. — das finale Angebot gibt\u2019s nach einem kurzen, kostenlosen Briefing.',
            'price.ctaA': 'Nicht sicher, welches Paket passt?',
            'price.ctaB': 'Lass uns kurz reden',
            'price.sig.d': 'Maßgeschneidert — für alles, was aus dem Rahmen fällt.',
            'price.sig.f1': 'Konzept gemeinsam entwickelt',
            'price.sig.f2': 'Umfang & Leistungen nach Absprache',
            'price.sig.f3': 'Laufende Betreuung möglich',
            'price.sig.f4': 'Persönliches Angebot in 24 h',
            'price.video.d1': 'Der schnelle Schnitt für Social Media — aus deinem Material wird ein fertiger Clip.',
            'price.video.f1a': '1 Video bis ca. 60 Sekunden',
            'price.video.f1b': 'Schnitt, Musik & Basis-Farbkorrektur',
            'price.video.f1c': 'Export für 1 Plattform (z. B. Reels)',
            'price.video.f1d': '1 Korrekturschleife',
            'price.video.d2': 'Der runde Auftritt — mit Motion-Elementen und Feinschliff bis ins Detail.',
            'price.video.f2a': '1 Video bis ca. 3–5 Minuten',
            'price.video.f2b': 'Sounddesign & Color Grading',
            'price.video.f2c': 'Animierte Bauchbinden & Untertitel',
            'price.video.f2d': '2 Korrekturschleifen',
            'price.motion.d1': 'Der schnelle Einstieg — deine Marke kommt in Bewegung.',
            'price.motion.f1a': 'Logo-Animation bis ca. 10 Sekunden',
            'price.motion.f1b': 'Sounddesign inklusive',
            'price.motion.f1c': 'Exporte für Web & Social Media',
            'price.motion.f1d': '1 Korrekturschleife',
            'price.motion.d2': 'Das komplette Motion-Paket — vom Storyboard bis zum Sound.',
            'price.motion.f2a': 'Erklärvideo oder Animation bis ca. 60 Sek.',
            'price.motion.f2b': 'Storyboard & Stilfindung inklusive',
            'price.motion.f2c': 'Voiceover-Einbindung & Sounddesign',
            'price.motion.f2d': '2 Korrekturschleifen',
            'price.3d.d1': 'Dein Produkt oder Logo als hochwertiges 3D-Bild.',
            'price.3d.f1a': '1 Produkt-Still oder kurzer Loop',
            'price.3d.f1b': 'Modelling & Texturing inklusive',
            'price.3d.f1c': 'Rendering in 4K',
            'price.3d.f1d': '1 Korrekturschleife',
            'price.3d.d2': 'Die komplette 3D-Animation — von der Szene bis zum finalen Render.',
            'price.3d.f2a': 'Animation bis ca. 30 Sekunden',
            'price.3d.f2b': 'Szenenaufbau, Licht & Kamerafahrt',
            'price.3d.f2c': 'Sounddesign inklusive',
            'price.3d.f2d': '2 Korrekturschleifen',
            'price.branding.d1': 'Das Fundament deiner Marke — Logo und Farbwelt aus einem Guss.',
            'price.branding.f1a': 'Logo-Design (2 Entwürfe, 1 Ausarbeitung)',
            'price.branding.f1b': 'Farbwelt & Schriftempfehlung',
            'price.branding.f1c': 'Alle Dateiformate für Print & Web',
            'price.branding.f1d': '2 Korrekturschleifen',
            'price.branding.d2': 'Der komplette Markenauftritt — konsistent bis zur Visitenkarte.',
            'price.branding.f2a': 'Logo-System mit Varianten',
            'price.branding.f2b': 'Geschäftsausstattung (Visitenkarte, Briefbogen)',
            'price.branding.f2c': 'Mini-Styleguide als PDF',
            'price.branding.f2d': 'Social-Media-Basispaket',
            'price.bild.d1': 'Professionelle Retusche — fair pro Bild kalkuliert.',
            'price.bild.f1a': 'Beauty- oder Produktretusche, pro Bild',
            'price.bild.f1b': 'Farb- & Belichtungskorrektur',
            'price.bild.f1c': 'Freisteller auf Wunsch',
            'price.bild.f1d': 'Lieferung in 2–3 Werktagen',
            'price.bild.d2': 'Bildserien und Composings mit aufwendiger Bearbeitung.',
            'price.bild.f2a': 'Serie bis 10 Bilder oder 1 Composing',
            'price.bild.f2b': 'Einheitlicher Farblook',
            'price.bild.f2c': 'Druck- & Web-Export',
            'price.bild.f2d': '2 Korrekturschleifen',
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
            'form.produkt': 'Category',
            'form.produktEmpty': 'Please select',
            'form.produktOther': 'Something else / not sure yet',
            'form.paket': 'Package',
            'form.paketEmpty': 'Please select',
            'form.paketStart': 'Start',
            'form.paketStudio': 'Studio',
            'form.paketSignature': 'Signature',
            'form.paketUnsure': 'Not sure yet',
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
            'sub.ctaA': 'Interested?',
            'sub.ctaB': 'Let\u2019s talk',
            'sub.ph': 'Media coming soon',
            'price.eyebrow': 'Packages & Pricing',
            'price.t1': 'Fairly',
            'price.t2': 'priced',
            'price.lede': 'Three packages — from a quick start to full production. All prices are starting points and depend on scope and material.',
            'price.from': 'from',
            'price.request': 'On request',
            'price.badge': 'Popular',
            'price.cta': 'Enquire',
            'price.ctaSig': 'Request consultation',
            'price.note': 'All prices are guide prices plus VAT — you\u2019ll get the final quote after a short, free briefing.',
            'price.ctaA': 'Not sure which package fits?',
            'price.ctaB': 'Let\u2019s have a quick chat',
            'price.sig.d': 'Tailor-made — for everything beyond the standard.',
            'price.sig.f1': 'Concept developed together',
            'price.sig.f2': 'Scope & services by agreement',
            'price.sig.f3': 'Ongoing support available',
            'price.sig.f4': 'Personal quote within 24 h',
            'price.video.d1': 'The quick edit for social media — your footage becomes a finished clip.',
            'price.video.f1a': '1 video up to approx. 60 seconds',
            'price.video.f1b': 'Editing, music & basic color correction',
            'price.video.f1c': 'Export for 1 platform (e.g. Reels)',
            'price.video.f1d': '1 revision round',
            'price.video.d2': 'The polished result — with motion elements and fine-tuning down to the detail.',
            'price.video.f2a': '1 video up to approx. 3–5 minutes',
            'price.video.f2b': 'Sound design & color grading',
            'price.video.f2c': 'Animated lower thirds & subtitles',
            'price.video.f2d': '2 revision rounds',
            'price.motion.d1': 'The quick start — your brand starts moving.',
            'price.motion.f1a': 'Logo animation up to approx. 10 seconds',
            'price.motion.f1b': 'Sound design included',
            'price.motion.f1c': 'Exports for web & social media',
            'price.motion.f1d': '1 revision round',
            'price.motion.d2': 'The full motion package — from storyboard to sound.',
            'price.motion.f2a': 'Explainer or animation up to approx. 60 sec.',
            'price.motion.f2b': 'Storyboard & style development included',
            'price.motion.f2c': 'Voiceover integration & sound design',
            'price.motion.f2d': '2 revision rounds',
            'price.3d.d1': 'Your product or logo as a high-quality 3D visual.',
            'price.3d.f1a': '1 product still or short loop',
            'price.3d.f1b': 'Modelling & texturing included',
            'price.3d.f1c': '4K rendering',
            'price.3d.f1d': '1 revision round',
            'price.3d.d2': 'The complete 3D animation — from scene to final render.',
            'price.3d.f2a': 'Animation up to approx. 30 seconds',
            'price.3d.f2b': 'Scene setup, lighting & camera moves',
            'price.3d.f2c': 'Sound design included',
            'price.3d.f2d': '2 revision rounds',
            'price.branding.d1': 'Your brand\u2019s foundation — logo and colors from one mold.',
            'price.branding.f1a': 'Logo design (2 drafts, 1 final)',
            'price.branding.f1b': 'Color palette & font recommendation',
            'price.branding.f1c': 'All file formats for print & web',
            'price.branding.f1d': '2 revision rounds',
            'price.branding.d2': 'The complete brand identity — consistent down to the business card.',
            'price.branding.f2a': 'Logo system with variants',
            'price.branding.f2b': 'Stationery (business card, letterhead)',
            'price.branding.f2c': 'Mini style guide as PDF',
            'price.branding.f2d': 'Social media starter kit',
            'price.bild.d1': 'Professional retouching — fairly priced per image.',
            'price.bild.f1a': 'Beauty or product retouching, per image',
            'price.bild.f1b': 'Color & exposure correction',
            'price.bild.f1c': 'Cut-outs on request',
            'price.bild.f1d': 'Delivery in 2–3 working days',
            'price.bild.d2': 'Image series and composites with advanced editing.',
            'price.bild.f2a': 'Series up to 10 images or 1 composite',
            'price.bild.f2b': 'Consistent color look',
            'price.bild.f2c': 'Print & web export',
            'price.bild.f2d': '2 revision rounds',
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


    /* ══════════════════════════════════════════════════════════
       EXKLUSIV-TON — maximal ein Video/Audio mit Ton gleichzeitig.
       Alle Medien laufen parallel (stumm); sobald bei einem der
       Ton aktiviert wird (Klick auf Lautsprecher-Icon in den
       nativen Controls oder Lautstärke hochgedreht), werden
       automatisch alle anderen Medien auf der Seite stummgeschaltet.
    ══════════════════════════════════════════════════════════ */
    function initExclusiveAudio() {
        function muteOthers(active) {
            document.querySelectorAll('video, audio').forEach(el => {
                if (el !== active && !el.muted) el.muted = true;
            });
        }
        function onSound(e) {
            const el = e.target;
            if (!(el instanceof HTMLMediaElement)) return;
            if (el.muted || el.volume === 0 || el.paused) return;
            muteOthers(el);
        }
        document.addEventListener('volumechange', onSound, true);
        document.addEventListener('play', onSound, true);
    }


    /* ══════════════════════════════════════════════════════════
       FORMULAR-VORBEFÜLLUNG — Klick auf ein Paket einer Unterseite
       (z.B. /Video/ -> Studio-Button) führt zu
       /?produkt=video&paket=studio#kontakt. Hier werden die
       beiden Dropdowns im Kontaktformular entsprechend vorbelegt,
       danach wird die URL wieder sauber auf /#kontakt gekürzt.
    ══════════════════════════════════════════════════════════ */
    function initFormPrefill() {
        const params = new URLSearchParams(window.location.search);
        const produkt = params.get('produkt');
        const paket = params.get('paket');
        if (!produkt && !paket) return;

        const PRODUKT_MAP = {
            motion: 'Motion Design', video: 'Videoschnitt', '3d': '3D-Animation',
            branding: 'Branding', bild: 'Bildbearbeitung'
        };
        const PAKET_MAP = { start: 'Start', studio: 'Studio', signature: 'Signature' };

        const selProdukt = document.getElementById('f-produkt');
        const selPaket = document.getElementById('f-paket');
        if (selProdukt && PRODUKT_MAP[produkt]) selProdukt.value = PRODUKT_MAP[produkt];
        if (selPaket && PAKET_MAP[paket]) selPaket.value = PAKET_MAP[paket];

        /* URL aufräumen, Sprungmarke zum Kontaktformular behalten */
        const clean = window.location.pathname + (window.location.hash || '#kontakt');
        window.history.replaceState({}, '', clean);

        /* Anchor-Sprung nachholen, falls der Browser vor dem Query-Cleanup
           schon (falsch) gescrollt hat */
        const target = document.getElementById('kontakt');
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    async function boot() {
        await loadIncludes();   /* Nav & Footer zuerst — Toggles leben dort */
        initTheme();
        initLang();
        initReveal();
        initNav();
        initForm();
        initFormPrefill();
        initCard();
        initShowreel();
        initExclusiveAudio();
        initYear();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
