/**
 * footer-loader.js
 * Lädt Footer, Toast, Impressum und Datenschutz aus /footer.html
 * und fügt sie ans Ende des <body> ein.
 *
 * Einbindung in jede HTML-Seite (einmalig, ganz unten im <body>):
 *   <script src="/footer-loader.js"></script>
 */
(function () {
    fetch('/footer.html')
        .then(res => {
            if (!res.ok) throw new Error('footer.html not found');
            return res.text();
        })
        .then(html => {
            const placeholder = document.createElement('div');
            placeholder.innerHTML = html.trim();

            // Alle direkten Kindelemente ans Ende von <body> hängen
            while (placeholder.firstElementChild) {
                document.body.appendChild(placeholder.firstElementChild);
            }

            // Sprache auf die neu injizierten Elemente anwenden
            if (typeof updateContent === 'function') {
                updateContent();
            } else {
                window.addEventListener('DOMContentLoaded', function () {
                    if (typeof updateContent === 'function') updateContent();
                });
            }
        })
        .catch(err => console.warn('Footer konnte nicht geladen werden:', err));
})();
