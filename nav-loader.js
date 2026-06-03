/**
 * nav-loader.js
 * Lädt die Navigation aus /nav.html und fügt sie an den Anfang des <body> ein.
 *
 * Auf Unterseiten (nicht "/") wird die Navbar sofort mit navbar-scrolled angezeigt,
 * statt erst nach dem Scrollen einzublenden.
 *
 * Einbindung in jede HTML-Seite (einmalig, ganz oben im <body>):
 *   <script src="/nav-loader.js"></script>
 */
(function () {
    const isSubpage = window.location.pathname !== '/' &&
                      window.location.pathname !== '/index.html';

    fetch('/nav.html')
        .then(res => {
            if (!res.ok) throw new Error('nav.html not found');
            return res.text();
        })
        .then(html => {
            const placeholder = document.createElement('div');
            placeholder.innerHTML = html.trim();
            const nav = placeholder.firstElementChild;

            // Unterseiten: Hintergrund sofort sichtbar, kein Fade-in nötig
            if (isSubpage) {
                nav.classList.add('navbar-scrolled', 'navbar-always-visible');
            }

            document.body.insertBefore(nav, document.body.firstChild);

            // Sprache auf die neu injizierten Nav-Elemente anwenden
            if (typeof updateContent === 'function') {
                updateContent();
            } else {
                // script.js noch nicht ausgeführt – warten bis DOM+Scripts fertig
                window.addEventListener('DOMContentLoaded', function () {
                    if (typeof updateContent === 'function') updateContent();
                });
            }
            // Dark-Mode-Icons synchronisieren
            if (typeof syncDarkModeIcons === 'function') syncDarkModeIcons();
        })
        .catch(err => console.warn('Navigation konnte nicht geladen werden:', err));
})();