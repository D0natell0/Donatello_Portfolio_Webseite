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
        'portfolio.view': 'View Project',
        'skills.badge': 'Skills',
        'skills.title1': 'What I',
        'skills.title2': 'Do Best',
        'skills.subtitle': 'A versatile skill set honed through years of creative exploration',
        'skills.skill1': 'Brand Design',
        'skills.skill1desc': 'Creating memorable brand identities that resonate with audiences',
        'skills.skill2': 'Motion Graphics',
        'skills.skill2desc': 'Bringing ideas to life through captivating animations',
        'skills.skill3': 'UI/UX Design',
        'skills.skill3desc': 'Designing intuitive and beautiful user experiences',
        'skills.skill4': 'Illustration',
        'skills.skill4desc': 'Custom illustrations that tell unique stories',
        'skills.skill5': 'Web Design',
        'skills.skill5desc': 'Modern, responsive designs for digital platforms',
        'skills.skill6': 'Video Production',
        'skills.skill6desc': 'Professional video content from concept to delivery',
        'contact.badge': 'Contact',
        'contact.title1': "Let's",
        'contact.title2': 'Connect',
        'contact.subtitle': "Have a project in mind? Let's create something amazing together",
        'contact.getintouch': 'Get in Touch',
        'contact.email': 'Email',
        'contact.location': 'Location',
        'contact.worldwide': 'Augsburg, Germany',
        'contact.phone': 'Phone',
        'contact.name': 'Your Name',
        'contact.emailaddress': 'Email Address',
        'contact.message': 'Your Message',
        'contact.placeholder': 'Tell me about your project...',
        'contact.send': 'Send Message',
        'footer.copyright': '© 2025 Donatello Media. All rights reserved.',
        'impressum.footer': 'Imprint',
        'impressum.title': 'Imprint',
        'impressum.name': 'Donatello Media',
        'impressum.owner': 'Owner',
        'impressum.address': 'Mariusstraße 16, 86199 Augsburg',
        'impressum.email': 'Email',
        'impressum.close': 'Close',
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
        'portfolio.view': 'Projekt ansehen',
        'skills.badge': 'Fähigkeiten',
        'skills.title1': 'Was ich',
        'skills.title2': 'am besten kann',
        'skills.subtitle': 'Ein vielseitiges Fähigkeitsspektrum, verfeinert durch Jahre kreativer Erkundung',
        'skills.skill1': 'Markendesign',
        'skills.skill1desc': 'Erstellung einprägsamer Markenidentitäten, die beim Publikum ankommen',
        'skills.skill2': 'Motion Graphics',
        'skills.skill2desc': 'Ideen durch fesselnde Animationen zum Leben erwecken',
        'skills.skill3': 'UI/UX Design',
        'skills.skill3desc': 'Gestaltung intuitiver und schöner Benutzererlebnisse',
        'skills.skill4': 'Illustration',
        'skills.skill4desc': 'Individuelle Illustrationen, die einzigartige Geschichten erzählen',
        'skills.skill5': 'Webdesign',
        'skills.skill5desc': 'Moderne, responsive Designs für digitale Plattformen',
        'skills.skill6': 'Videoproduktion',
        'skills.skill6desc': 'Professionelle Videoinhalte vom Konzept bis zur Auslieferung',
        'contact.badge': 'Kontakt',
        'contact.title1': 'Lass uns',
        'contact.title2': 'reden',
        'contact.subtitle': 'Du möchtest ein Projekt umsetzen? Melde dich bei mir!',
        'contact.getintouch': 'Kontakt aufnehmen',
        'contact.email': 'E-Mail',
        'contact.location': 'Standort',
        'contact.worldwide': 'Augsburg, Deutschland',
        'contact.phone': 'Telefon',
        'contact.name': 'Name',
        'contact.emailaddress': 'E-Mail-Adresse',
        'contact.message': 'Nachricht',
        'contact.placeholder': 'Erzählen Sie mir von Ihrem Projekt...',
        'contact.send': 'Nachricht senden',
        'footer.copyright': '© 2025 Donatello Media. Alle Rechte vorbehalten.',
        'impressum.footer': 'Impressum',
        'impressum.title': 'Impressum',
        'impressum.name': 'Donatello Media',
        'impressum.owner': 'Inhaber',
        'impressum.address': 'Mariusstraße 16, 86199 Augsburg',
        'impressum.email': 'E-Mail',
        'impressum.close': 'Schließen',
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
