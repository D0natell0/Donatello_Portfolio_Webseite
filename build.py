#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py — Donatello Media
────────────────────────────────────────────────────────────
Backt die zentralen Partials (Nav & Footer) fest in alle
HTML-Seiten ein. Kein Laufzeit-Nachladen, kein Cache-Problem.

Workflow:
  1. /partials/nav.html oder /partials/footer.html ändern
  2. `python3 build.py` ausführen (oder Doppelklick auf build.bat)
  3. Fertig — alle Seiten sind aktualisiert.

Das Skript ist idempotent: Es ersetzt sowohl die ursprünglichen
<div data-include="…"> Platzhalter als auch bereits eingebackene
Blöcke (erkennbar an den include-Kommentaren). Beliebig oft
ausführbar.
"""
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
PAGES = sorted(
    list(ROOT.glob('*.html')) +
    [p for p in ROOT.glob('*/index.html') if p.parent.name != 'partials']
)

def load_partial(path_str):
    p = ROOT / path_str.lstrip('/')
    if not p.exists():
        print(f'  ⚠  Partial fehlt: {path_str}')
        return None
    return io.open(p, encoding='utf-8').read().rstrip('\n')

def bake(html):
    changed = False

    # 1) Bereits eingebackene Blöcke auffrischen:
    #    <!-- include:/partials/x.html --> … <!-- /include -->
    def refresh(m):
        nonlocal changed
        content = load_partial(m.group(1))
        if content is None:
            return m.group(0)
        changed = True
        return f'<!-- include:{m.group(1)} -->\n{content}\n    <!-- /include -->'
    html = re.sub(
        r'<!-- include:(/partials/[\w.-]+\.html) -->.*?<!-- /include -->',
        refresh, html, flags=re.S)

    # 2) Ursprüngliche Platzhalter ersetzen:
    #    <div data-include="/partials/x.html"></div>
    def inject(m):
        nonlocal changed
        content = load_partial(m.group(1))
        if content is None:
            return m.group(0)
        changed = True
        return f'<!-- include:{m.group(1)} -->\n{content}\n    <!-- /include -->'
    html = re.sub(
        r'<div data-include="(/partials/[\w.-]+\.html)"></div>',
        inject, html)

    return html, changed

def main():
    print('Donatello Media — Build')
    print('─' * 40)
    for page in PAGES:
        src = io.open(page, encoding='utf-8').read()
        out, changed = bake(src)
        if changed:
            io.open(page, 'w', encoding='utf-8').write(out)
            print(f'  ✓  {page.relative_to(ROOT)}')
        else:
            print(f'  ·  {page.relative_to(ROOT)} (keine Include-Marker)')
    print('─' * 40)
    print('Fertig. Nav & Footer sind in allen Seiten aktuell.')

if __name__ == '__main__':
    sys.exit(main())
