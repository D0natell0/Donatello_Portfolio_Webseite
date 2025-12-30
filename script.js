// Translations
const translations = {
    en: {
        'nav.about': 'About me',
        'nav.portfolio': 'Portfolio',
        'nav.skills': 'Skills',
        'nav.contact': 'Contact',
        'nav.language': 'Language',
        'hero.badge': 'Creative Designer',
        'hero.title': 'Welcome to',
        'hero.subtitle': 'Media designer with passion.',
        'about.badge': 'About Me',
        'about.hello': 'Hello',
        'about.title1': 'Crafting',
        'about.title2': 'Visual Experiences',
        'about.text1': "I'm Niklas, a passionate media designer dedicated to creating stunning visual content that captivates and inspires. With expertise in branding, motion graphics, and digital design, I transform ideas into compelling visual stories.",
        'about.text2': 'Every project is an opportunity to push creative boundaries and deliver exceptional results that exceed expectations.',
        'about.skill1': 'Branding',
        'about.skill2': 'Motion Design',
        'about.skill3': '3D Animation',
        'about.skill4': 'Video Production',
        'about.skill5': 'Image Editing',
        'portfolio.badge': 'Portfolio',
        'portfolio.title1': 'Selected',
        'portfolio.title2': 'Works',
        'portfolio.subtitle': 'A curated collection of projects showcasing creativity and attention to detail',
        'portfolio.category1': 'Branding',
        'portfolio.category2': 'Animation',
        'portfolio.category3': 'Marketing',
        'portfolio.category4': 'Product',
        'portfolio.category5': 'Film',
        'portfolio.category6': 'Content',
        'portfolio.project1': 'Brand Identity',
        'portfolio.project2': 'Motion Graphics',
        'portfolio.project3': 'Digital Campaign',
        'portfolio.project4': 'UI Design',
        'portfolio.project5': 'Video Production',
        'portfolio.project6': 'Social Media',
        'portfolio.view': 'Show More',
        'skills.badge': 'Skills',
        'skills.title1': 'What I',
        'skills.title2': 'Do Best',
        'skills.subtitle': 'A versatile skill set honed through years of creative exploration',
        'skills.skill1': 'Brand Design',
        'skills.skill1desc': 'Creating memorable brand identities that resonate with audiences',
        'skills.skill2': 'Motion Graphics',
        'skills.skill2desc': 'Bringing ideas to life through captivating animations',
        'skills.skill3': 'UI/UX Design',
        'skills.skill3desc': 'Modelling and animation for 3D-objects',
        'skills.skill4': 'Illustration',
        'skills.skill4desc': 'Custom illustrations that fits your style',
        'skills.skill5': 'Web Design',
        'skills.skill5desc': 'Modern, responsive designs for digital platforms',
        'skills.skill6': 'Video Production',
        'skills.skill6desc': 'Professional video content from storyboard to the final product',
        'contact.badge': 'Contact',
        'contact.title1': "Let's",
        'contact.title2': 'Connect',
        'contact.subtitle': "Wanna create a project together? Use the formular or contact me directly!",
        'contact.getintouch': 'Get in Touch',
        'contact.email': 'Email',
        'contact.location': 'Location',
        'contact.worldwide': 'Augsburg, Germany',
        'contact.phone': 'Phone',
        'contact.name': 'Your Name',
        'contact.emailaddress': 'Email Address',
        'contact.message': 'Your Message',
        'contact.placeholder': 'Tell me about your idea...',
        'contact.send': 'Send Message',
        'footer.copyright': '© 2025 Donatello Media. All rights reserved.',
        'impressum.footer': 'Imprint',
        'impressum.title': 'Imprint',
        'impressum.name': 'Donatello Media',
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
        'datenschutz.name': 'Donatello Media',
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
        'datenschutz.text4p1': 'If you send inquiries via the contact form, your details including the contact data you provide will be transmitted to me by email and stored for the purpose of processing your request.',
        'datenschutz.text4p2': 'Processed data:',
        'datenschutz.text4p3': 'Name (if provided)',
        'datenschutz.text4p4': 'Email address',
        'datenschutz.text4p5': 'Message',
        'datenschutz.text4p6': 'Purpose of processing:',
        'datenschutz.text4p7': 'Handling and responding to your inquiry',
        'datenschutz.text4p8': 'Legal basis:',
        'datenschutz.text4p9': 'Art. 6 (1) (b) GDPR (pre-contractual measures or contract performance)',
        'datenschutz.text4p10': 'The data will be deleted once your request has been fully processed, provided there are no statutory retention obligations.',
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
        'nav.skills': 'Fähigkeiten',
        'nav.contact': 'Kontakt',
        'nav.language': 'Sprache',
        'hero.badge': 'Kreativer Designer',
        'hero.title': 'Willkommen bei',
        'hero.subtitle': 'Mediengestalter mit Leidenschaft.',
        'about.badge': 'Über mich',
        'about.hello': 'Hallo',
        'about.title1': 'Erschaffung',
        'about.title2': 'visueller Erlebnisse',
        'about.text1': 'Ich bin Niklas, ein leidenschaftlicher Mediengestalter, der sich der Erstellung atemberaubender visueller Inhalte widmet, die fesseln und inspirieren. Mit Expertise in Branding, Motion Graphics und digitalem Design verwandle ich Ideen in fesselnde visuelle Geschichten.',
        'about.text2': 'Jedes Projekt ist eine Gelegenheit, kreative Grenzen zu verschieben und außergewöhnliche Ergebnisse zu liefern, die Erwartungen übertreffen.',
        'about.skill1': 'Branding',
        'about.skill2': 'Motion Design',
        'about.skill3': '3D Animation',
        'about.skill4': 'Videoproduktion',
        'about.skill5': 'Bild Bearbeitung',
        'portfolio.badge': 'Portfolio',
        'portfolio.title1': 'Meine',
        'portfolio.title2': 'Projekte',
        'portfolio.subtitle': 'Eine Zusammenstellung einiger meiner umgesetzten Projekte',
        'portfolio.category1': 'Branding',
        'portfolio.category2': 'Blender 3D',
        'portfolio.category3': 'Animation',
        'portfolio.category4': 'Produkt',
        'portfolio.category5': 'Film',
        'portfolio.category6': 'Content',
        'portfolio.project1': 'Markenidentität',
        'portfolio.project2': '3D-Modellierung',
        'portfolio.project3': 'Logo Animation',
        'portfolio.project4': 'UI Design',
        'portfolio.project5': 'Videoproduktion',
        'portfolio.project6': 'Social Media',
        'portfolio.view': 'Mehr anzeigen',
        'skills.badge': 'Fähigkeiten',
        'skills.title1': 'Was ich',
        'skills.title2': 'alles kann',
        'skills.subtitle': 'Ein vielseitiges Fähigkeitsspektrum, verfeinert durch Jahre kreativer Erkundung',
        'skills.skill1': 'Markendesign',
        'skills.skill1desc': 'Erstellung einprägsamer Markenidentitäten, die beim Publikum ankommen',
        'skills.skill2': 'Motion Graphics',
        'skills.skill2desc': 'Ideen durch fesselnde Animationen zum Leben erwecken',
        'skills.skill3': '3D-Visualisierung',
        'skills.skill3desc': 'Modellierung und Animation von 3D-Objekten',
        'skills.skill4': 'Illustration',
        'skills.skill4desc': 'Individuelle Illustrationen, passend zu deinem Stil',
        'skills.skill5': 'Webdesign',
        'skills.skill5desc': 'Moderne, responsive Designs für digitale Plattformen',
        'skills.skill6': 'Videoproduktion',
        'skills.skill6desc': 'Professionelle Videoinhalte vom Storyboard bis zum finalen Produkt',
        'contact.badge': 'Kontakt',
        'contact.title1': 'Melde dich',
        'contact.title2': 'bei mir',
        'contact.subtitle': 'Du möchtest gemeinsam ein Projekt umsetzen? Dann nutze das Kontaktformular oder schreibe mir direkt!',
        'contact.getintouch': 'Kontakt aufnehmen',
        'contact.email': 'E-Mail',
        'contact.location': 'Standort',
        'contact.worldwide': 'Augsburg, Deutschland',
        'contact.phone': 'Telefon',
        'contact.name': 'Name',
        'contact.emailaddress': 'E-Mail-Adresse',
        'contact.message': 'Nachricht',
        'contact.placeholder': 'Erzähle mir von Deiner Idee...',
        'contact.send': 'Nachricht senden',
        'footer.copyright': '© 2025 Donatello Media. Alle Rechte vorbehalten.',
        'impressum.footer': 'Impressum',
        'impressum.title': 'Impressum',
        'impressum.name': 'Donatello Media',
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
        'datenschutz.name': 'Donatello Media',
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
        'datenschutz.text4p6': 'Zweck der Verarbeitung:',
        'datenschutz.text4p7': 'Beantwortung Ihrer Anfrage',
        'datenschutz.text4p8': 'Rechtsgrundlage:',
        'datenschutz.text4p9': 'Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen bzw. Vertragserfüllung)',
        'datenschutz.text4p10': 'Die Daten werden gelöscht, sobald Ihre Anfrage abschließend bearbeitet wurde und keine gesetzlichen Aufbewahrungspflichten bestehen.',
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

// Language functions
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateContent();
    
    // Close language menu on mobile
    const languageMenus = document.querySelectorAll('.language-menu');
    languageMenus.forEach(menu => menu.classList.remove('open'));
    languageMenuOpen = false;
}

function updateContent() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });

    // Update placeholders
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
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
        if (languageMenuOpen) {
            menu.classList.add('open');
        } else {
            menu.classList.remove('open');
        }
    });
}

// Close language menu when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.language-dropdown')) {
        const languageMenus = document.querySelectorAll('.language-menu');
        languageMenus.forEach(menu => menu.classList.remove('open'));
        languageMenuOpen = false;
    }
});

// Dark Mode Toggle
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    
    if (isDark) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
    
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.body.classList.contains('dark-mode');
    const sunIcons = document.querySelectorAll('.sun-icon');
    const moonIcons = document.querySelectorAll('.moon-icon');
    
    sunIcons.forEach(icon => {
        icon.classList.toggle('hidden', isDark);
    });
    moonIcons.forEach(icon => {
        icon.classList.toggle('hidden', !isDark);
    });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    const closeIcon = document.querySelector('.close-icon');
    
    mobileMenu.classList.toggle('open');
    hamburgerIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
}

// Smooth Scroll
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToTop(event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 20) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

// Skill bars animation on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '-100px'
};

const skillObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skillBars = entry.target.querySelectorAll('.skill-bar');
            skillBars.forEach(bar => {
                const width = bar.getAttribute('data-width');
                setTimeout(() => {
                    bar.style.width = width + '%';
                }, 100);
            });
            skillObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

const skillsSection = document.getElementById('skills');
if (skillsSection) {
    skillObserver.observe(skillsSection);
}

// Form submission
function handleFormSubmit(event) {
    event.preventDefault();
    const messages = {
        en: 'Thank you for your message! I will get back to you soon.',
        de: 'Vielen Dank für Ihre Nachricht! Ich werde mich bald bei Ihnen melden.',
    };
    alert(messages[currentLanguage]);
    event.target.reset();
}

// Initialize on load
window.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
    updateThemeIcons();

    // Initialize language
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
        updateContent();
    }
});

//Impressum
const impressumModal = document.getElementById("impressumModal");

    function openImpressum() {
    impressumModal.classList.remove("hidden");
    requestAnimationFrame(() => {
        impressumModal.classList.add("flex", "opacity-100");
        impressumContent.classList.add("scale-100");
    });
}

    function closeImpressum() {
    impressumModal.classList.remove("opacity-100");
    impressumContent.classList.remove("scale-100");
    setTimeout(() => {
        impressumModal.classList.add("hidden");
    }, 300);
}

    // ESC-Taste schließt Impressum
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && impressumModal && !impressumModal.classList.contains("hidden")) {
            closeImpressum();
        }
});

//Datenschutz
const datenschutzModal = document.getElementById("datenschutzModal");

    function openDatenschutz() {
    datenschutzModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    requestAnimationFrame(() => {
        datenschutzModal.classList.add("flex", "opacity-100");
        datenschutzContent.classList.add("scale-100");
    });
}

    function closeDatenschutz() {
    datenschutzModal.classList.remove("opacity-100");
    datenschutzContent.classList.remove("scale-100");
    setTimeout(() => {
        datenschutzModal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
    }, 300);
}

    // ESC-Taste schließt Datenschutz
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && datenschutzModal && !datenschutzModal.classList.contains("hidden")) {
            closeDatenschutz();
        }
});

//Cookies
function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    document.getElementById("cookieBanner").classList.add("hidden");
}

function declineCookies() {
    document.getElementById("cookieBanner").classList.add("hidden");
}

window.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("cookiesAccepted")) {
        document.getElementById("cookieBanner").classList.remove("hidden");
    }
});

const moveElements = document.querySelectorAll('.move_it');

function updateMove() {
  const scrollY = window.scrollY;
  moveElements.forEach(el => {
    const multiplier = parseFloat(el.dataset.multiplier);
    el.style.transform = `translateX(${scrollY * multiplier}px)`;
    el.style.opacity = Math.max(0, 1 - Math.abs(scrollY * multiplier) / 200);
  });
}

window.addEventListener('scroll', updateMove);
updateMove();