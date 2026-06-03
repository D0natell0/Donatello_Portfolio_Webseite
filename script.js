// Translations
const translations = {
    en: {
        'nav.about': 'About me',
        'nav.portfolio': 'Portfolio',
        'nav.portfolio.videobearbeitung': 'Video edit',
        'nav.contact': 'Contact',
        'nav.language': 'Language',
        'hero.reelLabel': 'Showreel 2025',
        'hero.subtitle': 'Media designer, specializing in After Effects, Blender 3D, and visual storytelling.',
        'hero.ctaPrimary': 'View Portfolio',
        'hero.ctaSecondary': 'Start a Project',
        'about.badge': 'About Me',
        'about.hello': 'Hey!',
        'about.text1': "My name is Niklas, and I’m the owner of Donatello-Media. As your partner, I’ll guide you every step of the way, from the initial sketch to the final product. Whether you need a logo that makes an instant impact, a video that sticks in people’s minds, or an animation that brings your brand to life.",
        'about.text2': 'Good design isn’t just about fonts, colors, and shapes. Good design is built on a well-thought-out concept.',
        'about.statYears': 'Years Experience',
        'about.statProjects': 'Projects',
        'about.clients': 'Happy Clients',
        'about.skill1': 'Branding',
        'about.skill2': 'Motion Design',
        'about.skill3': '3D Animation',
        'about.skill4': 'Video Production',
        'about.skill5': 'Image Editing',
        'portfolio.badge': 'Portfolio',
        'portfolio.title1': 'My',
        'portfolio.title2': 'Portfolio',
        'portfolio.subtitle': 'A selection of projects I\'ve had the pleasure of working on',
        'portfolio.metaLabel': 'Projects · 2025–2026',
        'portfolio.category1': '2D Animation',
        'portfolio.category2': '3D Animation',
        'portfolio.category3': 'Video Editing',
        'portfolio.category4': 'Branding',
        'portfolio.category5': 'Image Editing',
        'portfolio.category6': 'Social Media',
        'portfolio.filterAll': 'All',
        'portfolio.project1': 'Dynamic graphics and explainer videos',
        'portfolio.project2': 'Three-dimensional animations and visualizations',
        'portfolio.project3': 'Editing, effects, and post-production',
        'portfolio.project4': 'Corporate design with character',
        'portfolio.project5': 'Professional image retouching & editing',
        'portfolio.project6': 'Content for every platform',
        'portfolio.view': 'View Project',
        'skills.badge': 'Skills',
        'skills.title1': 'What I',
        'skills.title2': 'Can Do',
        'skills.subtitle': 'Tools and disciplines I actually use, picked up across years of creative work.',
        'skills.skill1desc': '3D modeling, texturing and animation for realistic and stylized scenes. From the first shape to the final render.',
        'skills.skill2desc': 'Dynamic motion design and visual effects that grab attention. Animations that bring ideas to life.',
        'skills.skill3desc': 'Professional video editing with a strong sense of storytelling and pacing. From raw footage to the final cut.',
        'skills.skill4desc': 'High-quality image editing, compositing and retouching. Polished visuals down to the smallest detail.',
        'skills.skill5desc': 'Vector-based illustrations and graphics with a clear visual language. Scalable, precise and brand-focused.',
        'skills.skill6desc': 'Structured layouts for print and digital media. Designs that present content clearly and effectively.',
        'skills.skill7desc': 'UI/UX design for intuitive and modern interfaces. From wireframes to interactive prototypes.',
        'skills.skill8desc': 'Clean, well-structured HTML and modern, responsive CSS. Layouts that work on every device.',
        'skills.skill9desc': 'Interactive features and dynamic content for modern websites. Logic that supports design and user experience.',
        'contact.badge': 'Contact',
        'contact.title1': "Let's",
        'contact.title2': 'Talk',
        'contact.subtitle': "Got a project in mind? Drop me a message. I'd love to hear about it.",
        'contact.getintouch': 'How to reach me',
        'contact.email': 'Email',
        'contact.location': 'Location',
        'contact.worldwide': 'Augsburg, Germany',
        'contact.phone': 'Phone',
        'contact.name': 'Your Name',
        'contact.emailaddress': 'Email Address',
        'contact.message': 'Your Message',
        'contact.placeholder': 'Tell me about your idea...',
        'contact.send': 'Send Message',
        'contact.sending': 'Sending...',
        'contact.senddata': 'By submitting, you agree to the processing of your data in accordance with the privacy policy.',
        'contact.success': '✅ Message sent successfully!',
        'contact.error': '❌ Something went wrong.',
        'contact.captcha': 'Please confirm you are not a robot.',
        'contact.captchaRequired': 'Please complete the reCAPTCHA.',
        'footer.copyright': '© 2026 Donatello-Media. All rights reserved.',
        'impressum.footer': 'Imprint',
        'impressum.title': 'Imprint',
        'impressum.name': 'Donatello-Media',
        'impressum.owner': 'Owner',
        'impressum.address': 'Mariusstraße 16, 86199 Augsburg',
        'impressum.email': 'Email',
        'impressum.close': 'Close',
        'datenschutz.footer': 'Privacy Policy',
        'datenschutz.title': 'Privacy Policy',
        'datenschutz.hl1': '1. General Information',
        'datenschutz.text1': 'The protection of your personal data is important to me. Personal data on this website is processed only to the extent necessary for technical operation and for handling inquiries. No data is shared with third parties.',
        'datenschutz.hl2': '2. Data Controller',
        'datenschutz.text2': 'The controller responsible for data processing on this website is:',
        'datenschutz.name': 'Donatello-Media',
        'datenschutz.owner': 'Owner',
        'datenschutz.address': 'Mariusstraße 16, 86199 Augsburg',
        'datenschutz.email': 'Email',
        'datenschutz.hl3': '3. Server Log Files',
        'datenschutz.text3p1': 'When visiting this website, the hosting provider automatically collects information in so-called server log files, including:',
        'datenschutz.text3p2': 'IP address (shortened or anonymized)',
        'datenschutz.text3p3': 'Date and time of the request',
        'datenschutz.text3p4': 'Browser type and version',
        'datenschutz.text3p5': 'Operating system',
        'datenschutz.text3p6': 'These data are used exclusively for technical monitoring and security purposes and are not merged with other data sources.',
        'datenschutz.hl4': '4. Contact Form',
        'datenschutz.text4p1': 'If you send me an inquiry via the contact form, the information you provide, including your contact details, will be transmitted to me via Formspree and stored for the purpose of processing your request.',
        'datenschutz.text4p2': 'Processed data:',
        'datenschutz.text4p3': 'Name (if provided)',
        'datenschutz.text4p4': 'Email address',
        'datenschutz.text4p5': 'Message',
        'datenschutz.text4p6': 'Any additional information entered in the form (optional)',
        'datenschutz.text4p7': 'Purpose of processing:',
        'datenschutz.text4p8': 'Responding to your inquiry',
        'datenschutz.text4p9': 'Contacting you',
        'datenschutz.text4p10': 'Legal basis:',
        'datenschutz.text4p11': 'Art. 6(1)(b) GDPR (pre-contractual measures or contract performance)',
        'datenschutz.text4p12': 'Consent according to Art. 6(1)(a) GDPR (by submitting the form)',
        'datenschutz.text4p13': 'Recipients of the data:',
        'datenschutz.text4p14': 'Formspree (service provider for transmitting form data via email)',
        'datenschutz.text4p15': 'Yourself and the data controller (Donatello-Media)',
        'datenschutz.text4p16': 'The data will be deleted as soon as your inquiry has been fully processed and no legal retention obligations exist.',
        'datenschutz.hl5': '5. Google Fonts',
        'datenschutz.text5': 'This website uses Google Fonts hosted locally. No connection to Google servers is established, and no personal data is transferred to Google.',
        'datenschutz.hl6': '6. Social Media Links',
        'datenschutz.text6p1': 'This website contains links to external social media profiles (e.g. Instagram, YouTube). When clicking these links, you leave this website. From that point on, the privacy policies of the respective platforms apply.',
        'datenschutz.text6p2': 'No social media plugins or tracking tools are used on this website.',
        'datenschutz.hl7': '7. Your Rights',
        'datenschutz.text7p1': 'You have the right at any time to:',
        'datenschutz.text7p2': 'Access your stored personal data',
        'datenschutz.text7p3': 'Request correction or deletion',
        'datenschutz.text7p4': 'Restrict processing',
        'datenschutz.text7p5': 'Object to processing',
        'datenschutz.text7p6': 'For this purpose, an informal email to the address listed above is sufficient.',
        'datenschutz.close': 'Close',
        'cookie.text': 'This site uses cookies to improve your experience.',
        'cookie.decline': 'Decline',
    },
    de: {
        'nav.about': 'Über mich',
        'nav.portfolio': 'Portfolio',
        'nav.portfolio.videobearbeitung': 'Videobearbeitung',
        'nav.contact': 'Kontakt',
        'nav.language': 'Sprache',
        'hero.reelLabel': 'Showreel 2025',
        'hero.subtitle': 'Mediengestalter, spezialisiert auf After Effects, Blender 3D und visuelles Storytelling.',
        'hero.ctaPrimary': 'Portfolio ansehen',
        'hero.ctaSecondary': 'Projekt anfragen',
        'about.badge': 'Über mich',
        'about.hello': 'Hey!',
        'about.text1': 'Ich bin Niklas, Inhaber von Donatello-Media. Als dein Partner helfe ich dir von der ersten Skizze bis zum finalen Produkt. Egal ob du ein Logo brauchst, das sofort sitzt, ein Video, das in Erinnerung bleibt, oder eine Animation, die deine Marke zum Leben erweckt.',
        'about.text2': 'Gutes Design lebt nicht von Schriften, Farben und Formen. Gutes Design lebt von einem durchdachten Konzept.',
        'about.statYears': 'Jahre Erfahrung',
        'about.statProjects': 'Projekte',
        'about.clients': 'Zufriedene Kunden',
        'about.skill1': 'Branding',
        'about.skill2': 'Motion Design',
        'about.skill3': '3D Animation',
        'about.skill4': 'Videoproduktion',
        'about.skill5': 'Bildbearbeitung',
        'portfolio.badge': 'Portfolio',
        'portfolio.title1': 'Mein',
        'portfolio.title2': 'Portfolio',
        'portfolio.subtitle': 'Eine Auswahl an Projekten, an denen ich gearbeitet habe',
        'portfolio.metaLabel': 'Projekte · 2025–2026',
        'portfolio.category1': '2D-Animation',
        'portfolio.category2': '3D-Animation',
        'portfolio.category3': 'Videobearbeitung',
        'portfolio.category4': 'Branding',
        'portfolio.category5': 'Bildbearbeitung',
        'portfolio.category6': 'Social Media',
        'portfolio.filterAll': 'Alle',
        'portfolio.project1': 'Dynamische Grafiken und Erklärvideos',
        'portfolio.project2': 'Dreidimensionale Animationen und Visualisierungen',
        'portfolio.project3': 'Schnitt, Effekte und Postproduktion',
        'portfolio.project4': 'Corporate Design mit Charakter',
        'portfolio.project5': 'Professionelle Bildretusche und -bearbeitung',
        'portfolio.project6': 'Content für alle Plattformen',
        'portfolio.view': 'Mehr anzeigen',
        'skills.badge': 'Skills',
        'skills.title1': 'Was ich',
        'skills.title2': 'draufhabe',
        'skills.subtitle': 'Tools und Bereiche, mit denen ich wirklich arbeite.',
        'skills.skill1desc': '3D-Modelling, Texturing und Animation für realistische und stilisierte Szenen. Von der ersten Form bis zum finalen Render.',
        'skills.skill2desc': 'Dynamische Motion Designs und visuelle Effekte, die Aufmerksamkeit erzeugen. Animationen, die Ideen lebendig machen.',
        'skills.skill3desc': 'Professioneller Videoschnitt mit Fokus auf Storytelling und Rhythmus. Vom Rohmaterial bis zum fertigen Film.',
        'skills.skill4desc': 'Bildbearbeitung, Compositing und Retusche auf hohem Niveau. Perfekte Visuals bis ins kleinste Detail.',
        'skills.skill5desc': 'Vektorbasierte Illustrationen und Grafiken mit klarer Formsprache. Skalierbar, präzise und markenstark.',
        'skills.skill6desc': 'Strukturiertes Layout für Print- und Digitalmedien. Designs, die Inhalte klar und ansprechend präsentieren.',
        'skills.skill7desc': 'UI/UX-Design für intuitive und moderne Benutzeroberflächen. Von Wireframes bis zu interaktiven Prototypen.',
        'skills.skill8desc': 'Sauber strukturierter HTML-Code und modernes, responsives CSS. Layouts, die auf allen Geräten überzeugen.',
        'skills.skill9desc': 'Interaktive Funktionen und dynamische Inhalte für moderne Webseiten. Logik, die Design und Benutzererlebnis ergänzt.',
        'contact.badge': 'Kontakt',
        'contact.title1': 'Meld dich',
        'contact.title2': 'gerne',
        'contact.subtitle': 'Du hast ein Projekt? Schreib mir einfach, ich freu mich drauf.',
        'contact.getintouch': 'So erreichst du mich',
        'contact.email': 'E-Mail',
        'contact.location': 'Standort',
        'contact.worldwide': 'Augsburg, Deutschland',
        'contact.phone': 'Telefon',
        'contact.name': 'Name',
        'contact.emailaddress': 'E-Mail-Adresse',
        'contact.message': 'Nachricht',
        'contact.placeholder': 'Erzähle mir von Deiner Idee...',
        'contact.send': 'Nachricht senden',
        'contact.sending': 'Wird gesendet…',
        'contact.senddata': 'Mit dem Absenden erklärst du dich mit der Verarbeitung deiner Daten gemäß Datenschutzerklärung einverstanden.',
        'contact.success': '✅ Nachricht erfolgreich gesendet!',
        'contact.error': '❌ Leider ist etwas schiefgelaufen.',
        'contact.captcha': 'Bitte bestätige, dass du kein Roboter bist.',
        'contact.captchaRequired': 'Bitte schließe das reCAPTCHA ab.',
        'footer.copyright': '© 2026 Donatello-Media. Alle Rechte vorbehalten.',
        'impressum.footer': 'Impressum',
        'impressum.title': 'Impressum',
        'impressum.name': 'Donatello-Media',
        'impressum.owner': 'Inhaber',
        'impressum.address': 'Mariusstraße 16, 86199 Augsburg',
        'impressum.email': 'E-Mail',
        'impressum.close': 'Schließen',
        'datenschutz.footer': 'Datenschutz',
        'datenschutz.title': 'Datenschutzerklärung',
        'datenschutz.hl1': '1. Allgemeine Hinweise',
        'datenschutz.text1': 'Der Schutz Ihrer persönlichen Daten ist mir ein wichtiges Anliegen. Personenbezogene Daten werden auf dieser Website nur im technisch notwendigen Umfang sowie zur Bearbeitung von Anfragen verarbeitet. Eine Weitergabe an Dritte erfolgt nicht.',
        'datenschutz.hl2': '2. Verantwortlicher',
        'datenschutz.text2': 'Verantwortlich für die Datenverarbeitung auf dieser Website ist:',
        'datenschutz.name': 'Donatello-Media',
        'datenschutz.owner': 'Inhaber',
        'datenschutz.address': 'Mariusstraße 16, 86199 Augsburg',
        'datenschutz.email': 'E-Mail',
        'datenschutz.hl3': '3. Zugriffsdaten (Server-Logfiles)',
        'datenschutz.text3p1': 'Beim Besuch dieser Website werden durch den Hostinganbieter automatisch Informationen erfasst (sogenannte Server-Logfiles), z. B.:',
        'datenschutz.text3p2': 'IP-Adresse (gekürzt oder anonymisiert)',
        'datenschutz.text3p3': 'Datum und Uhrzeit der Anfrage',
        'datenschutz.text3p4': 'Browsertyp und -version',
        'datenschutz.text3p5': 'Betriebssystem',
        'datenschutz.text3p6': 'Diese Daten dienen ausschließlich der technischen Überwachung und Sicherheit der Website und werden nicht mit anderen Datenquellen zusammengeführt.',
        'datenschutz.hl4': '4. Kontaktformular',
        'datenschutz.text4p1': 'Wenn Sie mir über das Kontaktformular Anfragen senden, werden Ihre Angaben aus dem Formular inklusive der von Ihnen angegebenen Kontaktdaten per E-Mail an mich übermittelt und zur Bearbeitung der Anfrage gespeichert.',
        'datenschutz.text4p2': 'Verarbeitete Daten:',
        'datenschutz.text4p3': 'Name (falls angegeben)',
        'datenschutz.text4p4': 'E-Mail-Adresse',
        'datenschutz.text4p5': 'Nachricht',
        'datenschutz.text4p6': 'Weitere im Formular eingegebene Angaben (optional)',
        'datenschutz.text4p7': 'Zweck der Verarbeitung:',
        'datenschutz.text4p8': 'Beantwortung Ihrer Anfrage',
        'datenschutz.text4p9': 'Kontaktaufnahme',
        'datenschutz.text4p10': 'Rechtsgrundlage:',
        'datenschutz.text4p11': 'Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen bzw. Vertragserfüllung)',
        'datenschutz.text4p12': 'Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO (durch das Absenden des Formulars)',
        'datenschutz.text4p13': 'Empfänger der Daten:',
        'datenschutz.text4p14': 'Formspree (Dienstleister zur Übermittlung der Formulardaten per E-Mail)',
        'datenschutz.text4p15': 'Sie selbst und der Verantwortliche (Donatello-Media)',
        'datenschutz.text4p16': 'Die Daten werden gelöscht, sobald Ihre Anfrage abschließend bearbeitet wurde und keine gesetzlichen Aufbewahrungspflichten bestehen.',
        'datenschutz.hl5': '5. Google Fonts',
        'datenschutz.text5': 'Auf dieser Website werden Schriftarten (Google Fonts) lokal eingebunden. Es findet keine Verbindung zu Servern von Google statt. Eine Übertragung personenbezogener Daten an Google erfolgt nicht.',
        'datenschutz.hl6': '6. Social-Media-Links',
        'datenschutz.text6p1': 'Diese Website enthält Links zu externen Social-Media-Profilen (z. B. Instagram, YouTube). Beim Anklicken dieser Links verlassen Sie meine Website. Erst dann gelten die Datenschutzbestimmungen der jeweiligen Plattformen.',
        'datenschutz.text6p2': 'Es werden keine Social-Media-Plugins oder Tracking-Tools eingesetzt.',
        'datenschutz.hl7': '7. Ihre Rechte',
        'datenschutz.text7p1': 'Sie haben jederzeit das Recht auf:',
        'datenschutz.text7p2': 'Auskunft über Ihre gespeicherten Daten',
        'datenschutz.text7p3': 'Berichtigung oder Löschung',
        'datenschutz.text7p4': 'Einschränkung der Verarbeitung',
        'datenschutz.text7p5': 'Widerspruch gegen die Verarbeitung',
        'datenschutz.text7p6': 'Hierzu genügt eine formlose E-Mail an die oben genannte Adresse.',
        'datenschutz.close': 'Schließen',
        'cookie.text': 'Diese Seite verwendet Cookies um Ihre Erfahrung zu verbessern.',
        'cookie.decline': 'Ablehnen',
    },
};

let currentLanguage = 'en';
let languageMenuOpen = false;

// ── Language ────────────────────────────────────────
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateContent();
    const languageMenus = document.querySelectorAll('.language-menu');
    languageMenus.forEach(menu => menu.classList.remove('open'));
    languageMenuOpen = false;
}

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
}

function toggleLanguageMenu(event) {
    event.stopPropagation();
    const languageMenus = document.querySelectorAll('.language-menu');
    languageMenus.forEach(menu => {
        languageMenuOpen = !languageMenuOpen;
        menu.classList.toggle('open', languageMenuOpen);
    });
}

document.addEventListener('click', function(event) {
    if (!event.target.closest('.language-dropdown')) {
        document.querySelectorAll('.language-menu').forEach(menu => menu.classList.remove('open'));
        languageMenuOpen = false;
    }
});

// ── Dark Mode ───────────────────────────────────────
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    body.classList.toggle('dark-mode', !isDark);
    body.classList.toggle('light-mode', isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelectorAll('.sun-icon').forEach(icon => icon.classList.toggle('hidden', isDark));
    document.querySelectorAll('.moon-icon').forEach(icon => icon.classList.toggle('hidden', !isDark));
}

// ── Mobile Menu ─────────────────────────────────────
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    const closeIcon = document.querySelector('.close-icon');
    mobileMenu.classList.toggle('open');
    hamburgerIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
}

// ── Smooth Scroll ───────────────────────────────────
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop(event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Navbar Scroll Effect ────────────────────────────
// Scroll-Effekt nur auf der Startseite – Unterseiten bleiben immer eingeblendet
const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';

window.addEventListener('scroll', function() {
    if (!isHomepage) return;
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.classList.toggle('navbar-scrolled', window.scrollY > 20);
}, { passive: true });

document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    if (isHomepage) {
        navbar.classList.toggle('navbar-scrolled', window.scrollY > 20);
    } else {
        navbar.classList.add('navbar-scrolled');
    }
});

// ── Init on Load ────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
    updateThemeIcons();

    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
        updateContent();
    }
});

// ── Impressum ───────────────────────────────────────
const impressumModal = document.getElementById("impressumModal");

function openImpressum() {
    impressumModal.classList.remove("hidden");
    requestAnimationFrame(() => {
        impressumModal.classList.add("flex", "opacity-100");
        impressumContent.classList.add("scale-100");
    });
}

function closeImpressum(event) {
    if (event && event.target !== impressumModal) return;
    impressumModal.classList.remove("opacity-100");
    impressumContent.classList.remove("scale-100");
    setTimeout(() => impressumModal.classList.add("hidden"), 300);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && impressumModal && !impressumModal.classList.contains("hidden")) {
        impressumModal.classList.remove("opacity-100");
        impressumContent.classList.remove("scale-100");
        setTimeout(() => impressumModal.classList.add("hidden"), 300);
    }
});

// ── Datenschutz ─────────────────────────────────────
const datenschutzModal = document.getElementById("datenschutzModal");

function openDatenschutz() {
    datenschutzModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    requestAnimationFrame(() => {
        datenschutzModal.classList.add("flex", "opacity-100");
        datenschutzContent.classList.add("scale-100");
    });
}

function closeDatenschutz(event) {
    if (event && event.target !== datenschutzModal) return;
    datenschutzModal.classList.remove("opacity-100");
    datenschutzContent.classList.remove("scale-100");
    setTimeout(() => {
        datenschutzModal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
    }, 300);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && datenschutzModal && !datenschutzModal.classList.contains("hidden")) {
        datenschutzModal.classList.remove("opacity-100");
        datenschutzContent.classList.remove("scale-100");
        setTimeout(() => {
            datenschutzModal.classList.add("hidden");
            document.body.classList.remove("overflow-hidden");
        }, 300);
    }
});

// ── Cookies ─────────────────────────────────────────
function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.classList.add("hidden");
}
function declineCookies() {
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.classList.add("hidden");
}
window.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("cookieBanner");
    if (banner && !localStorage.getItem("cookiesAccepted")) {
        banner.classList.remove("hidden");
    }
});

// ── Hero Parallax (move_it) ─────────────────────────
const moveElements = document.querySelectorAll('.move_it');
function updateMove() {
    const scrollY = window.scrollY;
    moveElements.forEach(el => {
        const multiplier = parseFloat(el.dataset.multiplier);
        el.style.transform = `translateX(${scrollY * multiplier}px)`;
        el.style.opacity = Math.max(0, 1 - Math.abs(scrollY * multiplier) / 200);
    });
}
window.addEventListener('scroll', updateMove, { passive: true });
updateMove();

// ── Mobile Portfolio Cards (tap to reveal) ──────────
if (window.innerWidth < 768) {
    let activeCard = null;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            if (entry.isIntersecting) {
                if (!el.classList.contains('is-visible') || el.dataset.manual !== "true") showTemporary(el);
            } else {
                hideOverlay(el);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.project-card').forEach(el => {
        observer.observe(el);
        el.addEventListener('click', (e) => {
            // Overlay already visible + user tapped directly on the link → navigate
            if (el.dataset.manual === "true" && e.target.closest('.project-link')) {
                return;
            }
            e.preventDefault();
            el.blur();
            if (el.dataset.manual === "true") {
                hideOverlay(el);
            } else {
                if (activeCard && activeCard !== el) hideOverlay(activeCard);
                showOverlay(el);
            }
        });
    });

    function showTemporary(el) {
        clearTimeout(el._timeout);
        el.classList.add('is-visible');
        el._timeout = setTimeout(() => {
            if (el.dataset.manual !== "true") el.classList.remove('is-visible');
            el._timeout = null;
        }, 3000);
    }
    function showOverlay(el) {
        clearTimeout(el._timeout);
        el.dataset.manual = "true";
        el.classList.add('is-visible');
        activeCard = el;
    }
    function hideOverlay(el) {
        clearTimeout(el._timeout);
        el.classList.remove('is-visible');
        el.dataset.manual = "false";
        if (activeCard === el) activeCard = null;
    }
}

// ── Trading Card (Tilt + Flip + Glitter) ────────────
const glitterLayer = document.getElementById('glitterLayer');
if (glitterLayer) {
    const glitterColors = [
        'rgba(200,160,255,1)', 'rgba(160,210,255,1)',
        'rgba(255,210,160,1)', 'rgba(160,255,210,1)', 'rgba(255,160,200,1)',
    ];
    const dots = [
        {x:12,y:18,s:1.5,d:3.2,del:0},   {x:54,y:7, s:1,  d:4.1,del:0.7},
        {x:230,y:22,s:1.5,d:3.8,del:1.1},{x:260,y:60,s:1, d:5.0,del:0.3},
        {x:140,y:35,s:1.2,d:4.4,del:1.8},{x:80, y:90,s:1, d:3.6,del:2.2},
        {x:200,y:120,s:1.5,d:4.8,del:0.9},{x:30,y:150,s:1,d:3.3,del:1.5},
        {x:250,y:180,s:1.2,d:5.2,del:2.6},{x:110,y:200,s:1.5,d:4.0,del:0.4},
        {x:60,y:240,s:1, d:3.9,del:1.9}, {x:220,y:260,s:1.5,d:4.6,del:2.9},
        {x:160,y:310,s:1.2,d:3.5,del:0.6},{x:40,y:330,s:1,d:4.9,del:2.1},
        {x:240,y:350,s:1.5,d:4.3,del:1.3},{x:130,y:370,s:1,d:3.7,del:3.1},
        {x:70,y:390,s:1.2,d:5.1,del:0.2},{x:190,y:75,s:1,d:4.2,del:2.4},
    ];
    dots.forEach((d, i) => {
        const el = document.createElement('div');
        el.className = 'glitter-dot';
        const color = glitterColors[i % glitterColors.length];
        el.style.cssText = `left:${d.x}px;top:${d.y}px;width:${d.s*2}px;height:${d.s*2}px;background:${color};box-shadow:0 0 ${d.s*2}px ${color};animation:twinkle-${['a','b','c'][i%3]} ${d.d}s ease-in-out ${d.del}s infinite;`;
        glitterLayer.appendChild(el);
    });
}

const scene = document.getElementById('cardScene');
const inner = document.getElementById('cardInner');
if (scene && inner) {
    const holoSweep = document.getElementById('holoSweep');
    const tiltLabel = document.getElementById('tiltLabel');
    let isFlipped = false, flipping = false;
    let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
    let raf;

    const lerp = (a, b, t) => a + (b - a) * t;

    function setTransform() {
        const yRot = isFlipped ? 180 + tiltY : tiltY;
        inner.style.transform = `rotateY(${yRot}deg) rotateX(${tiltX}deg)`;
    }
    function tiltLoop() {
        if (!flipping) {
            tiltX = lerp(tiltX, targetX, 0.1);
            tiltY = lerp(tiltY, targetY, 0.1);
            setTransform();
        }
        raf = requestAnimationFrame(tiltLoop);
    }
    tiltLoop();

    scene.addEventListener('mousemove', (e) => {
        if (flipping) return;
        const r = scene.getBoundingClientRect();
        const nx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const ny = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        targetY = nx * 20;
        targetX = -ny * 15;
        if (!isFlipped && holoSweep) {
            const px = Math.round((e.clientX - r.left) / r.width * 100);
            const py = Math.round((e.clientY - r.top) / r.height * 100);
            holoSweep.style.opacity = '1';
            holoSweep.style.background = `radial-gradient(ellipse at ${px}% ${py}%, rgba(255,255,255,0.12) 0%, rgba(125,55,195,0.07) 45%, transparent 70%)`;
        }
        if (tiltLabel) tiltLabel.style.opacity = '0';
    });

    scene.addEventListener('mouseleave', () => {
        targetX = 0; targetY = 0;
        if (holoSweep) holoSweep.style.opacity = '0';
        if (tiltLabel) tiltLabel.style.opacity = '1';
    });

    scene.addEventListener('click', () => {
        // iOS: Gyro-Berechtigung beim ersten Tap auf die Karte anfragen
        scene._requestGyro?.();

        if (flipping) return;
        flipping = true;
        if (holoSweep) holoSweep.style.opacity = '0';

        const startYTilt = tiltY;
        const startXTilt = tiltX;
        const flipDelta = isFlipped ? -180 : 180;
        const startFlipBase = isFlipped ? 180 : 0;
        const duration = 680;
        const t0 = performance.now();
        targetX = 0; targetY = 0;

        function animFlip(now) {
            const p = Math.min((now - t0) / duration, 1);
            const ease = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
            tiltX = startXTilt * (1 - ease);
            tiltY = startYTilt * (1 - ease);
            const flipAngle = startFlipBase + flipDelta * ease;
            inner.style.transform = `rotateY(${flipAngle + tiltY}deg) rotateX(${tiltX}deg)`;
            if (p < 1) {
                raf = requestAnimationFrame(animFlip);
            } else {
                isFlipped = !isFlipped;
                tiltX = 0; tiltY = 0;
                setTransform();
                flipping = false;
                raf = requestAnimationFrame(tiltLoop);
                if (isFlipped) {
                    setTimeout(() => {
                        document.querySelectorAll('.skill-fill').forEach(b => b.style.width = b.dataset.w + '%');
                    }, 50);
                } else {
                    document.querySelectorAll('.skill-fill').forEach(b => b.style.width = '0');
                }
            }
        }
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(animFlip);
    });

    if (typeof DeviceOrientationEvent !== 'undefined') {
        let baseB = null, baseG = null;
        const gyroHandler = (e) => {
            if (e.beta === null && e.gamma === null) return;
            if (baseB === null) { baseB = e.beta; baseG = e.gamma; }
            targetY = Math.max(-20, Math.min(20, (e.gamma - baseG) * 0.9));
            targetX = Math.max(-15, Math.min(15, -(e.beta - baseB) * 0.7));
        };

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+: permission must be requested from a user gesture
            scene._gyroReady = false;
            scene._requestGyro = () => {
                if (scene._gyroReady) return;
                DeviceOrientationEvent.requestPermission()
                    .then(state => {
                        if (state === 'granted') {
                            scene._gyroReady = true;
                            baseB = null; baseG = null;
                            window.addEventListener('deviceorientation', gyroHandler, { passive: true });
                            if (tiltLabel) tiltLabel.textContent = 'Gerät neigen zum Kippen';
                        }
                    })
                    .catch(() => {});
            };
            if (tiltLabel) tiltLabel.textContent = 'Tippen um Gyroskop zu aktivieren';
        } else {
            // Android / Desktop – listener direkt hinzufügen
            window.addEventListener('deviceorientation', gyroHandler, { passive: true });
        }
    }
}

// ── Contact Form ────────────────────────────────────
const form = document.getElementById('contactForm');
const button = document.getElementById('submitBtn');
const status = document.getElementById('formStatus');
const toast = document.getElementById('toast');

if (form) {
    let formStartTime = Date.now();
    let spamScore = 0;
    let recaptchaLoaded = false;

    function t(key) {
        return translations[currentLanguage]?.[key] || key;
    }

    form.addEventListener('focusin', () => {
        if (!formStartTime) formStartTime = Date.now();
    });

    form.querySelector('[name="_gotcha"]')?.addEventListener('input', () => {
        spamScore += 5;
    });

    function analyzeMessage(text) {
        const links = (text.match(/https?:\/\//g) || []).length;
        const keywords = ['crypto', 'seo', 'viagra', 'casino'];
        if (links > 1) spamScore += 3;
        keywords.forEach(word => {
            if (text.toLowerCase().includes(word)) spamScore += 2;
        });
    }

    function loadRecaptcha() {
        if (recaptchaLoaded) return;
        recaptchaLoaded = true;
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js';
        script.async = true; script.defer = true;
        document.body.appendChild(script);
        document.getElementById('recaptcha-container').classList.remove('hidden');
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('opacity-0', 'translate-y-4');
        toast.classList.add('opacity-100');
        setTimeout(() => {
            toast.classList.remove('opacity-100');
            toast.classList.add('opacity-0', 'translate-y-4');
        }, 3000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const elapsed = (Date.now() - formStartTime) / 1000;
        if (elapsed < 3) spamScore += 3;
        analyzeMessage(form.message.value);

        if (spamScore >= 5 && !recaptchaLoaded) {
            loadRecaptcha();
            showToast(t('contact.captcha'));
            return;
        }

        const recaptchaResponse = document.querySelector('[name="g-recaptcha-response"]');
        if (recaptchaLoaded && (!recaptchaResponse || !recaptchaResponse.value)) {
            showToast(t('contact.captchaRequired'));
            return;
        }

        button.disabled = true;
        button.querySelector('.btn-text').classList.add('hidden');
        button.querySelector('.btn-loading').classList.remove('hidden');

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                showToast(t('contact.success'));
                if (status) status.textContent = '';
                form.reset();
                spamScore = 0;
                formStartTime = Date.now();
            } else {
                throw new Error();
            }
        } catch {
            showToast(t('contact.error'));
        } finally {
            button.disabled = false;
            button.querySelector('.btn-text').classList.remove('hidden');
            button.querySelector('.btn-loading').classList.add('hidden');
        }
    });
}

// ── Portfolio Filter ────────────────────────────────
function filterPortfolio(category) {
    const cards = document.querySelectorAll('.portfolio-grid .project-card');
    const buttons = document.querySelectorAll('.portfolio-filter-btn');

    // Update active filter button
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === category);
    });

    cards.forEach(card => {
        const match = category === 'all' || card.dataset.category === category;
        if (match) {
            card.style.display = '';
            // Trigger re-entrance animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            });
        } else {
            card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateY(8px)';
            setTimeout(() => { card.style.display = 'none'; }, 200);
        }
    });
}