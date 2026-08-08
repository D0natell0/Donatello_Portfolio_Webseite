//=============================================================================
// TCG_Core.js  (v2.0)
//-----------------------------------------------------------------------------
// TCG-Kernsystem fuer RPG Maker MV
// Kartendatenbank (Monster: Normal/Fusion/Ritual, Zauber, Ausruestung),
// Element-Matrix, Seltenheiten, Sammlung, Decks, Booster, Karten-Rendering.
// Muss VOR TCG_Battle.js und TCG_Menus.js geladen werden.
//=============================================================================
/*:
 * @plugindesc v3.0 TCG-Kernsystem: laedt Karten/Decks/Booster/Token/Regeln aus
 * externen JSON-Dateien (data/tcg/*.json) statt aus Plugin-Parametern.
 * @author Donatello Media
 *
 * @help
 * ============================================================================
 * TCG_Core.js v3.0 - Kernsystem (TCG Studio Datenanbindung)
 * ============================================================================
 * Reihenfolge: 1. TCG_Core  2. TCG_Battle  3. TCG_Menus
 *
 * WICHTIGSTE AENDERUNG GEGENUEBER v2: Alle Karten, Decks, Booster, Token-Typen,
 * die Element-Matrix und saemtliche Regel-Zahlen (Start-LP, AP pro Zug, ...)
 * werden NICHT mehr im Plugin-Manager gepflegt, sondern aus JSON-Dateien im
 * Projektordner geladen:
 *
 *   data/tcg/cards.json          Karten (siehe TCG_SCHEMA.md)
 *   data/tcg/decks.json          Deck-Vorlagen (Spieler-Starterdecks + NPC-Decks)
 *   data/tcg/booster.json        Booster-Packs
 *   data/tcg/tokenTypes.json     Token-Typen
 *   data/tcg/elementMatrix.json  Element-Vor-/Nachteile
 *   data/tcg/settings.json       alle Regel-Zahlen (Start-LP, AP, Deckgroesse, ...)
 *
 * Gepflegt werden diese Dateien im "TCG Studio" (separates Electron-Programm) -
 * das exakte Datenformat steht in TCG_SCHEMA.md. Dieses Plugin liest die
 * Dateien einmalig beim Spielstart ueber Node.js (verfuegbar, da RPG Maker MV
 * unter NW.js laeuft). Reines Browser-Hosting ohne NW.js wird NICHT unterstuetzt
 * - die Konsole (F8) meldet das klar, statt still zu scheitern.
 *
 * @help
 * ============================================================================
 * TCG_Core.js v2.0 - Kernsystem
 * ============================================================================
 * Reihenfolge: 1. TCG_Core  2. TCG_Battle  3. TCG_Menus
 *
 * BENOETIGTE GRAFIKEN (alle in KartenBreite x KartenHoehe, Standard 300x420):
 *   img/tcg/frames/rahmen_neutral.png      Normal-Monster je Element
 *   img/tcg/frames/rahmen_feuer.png
 *   img/tcg/frames/rahmen_wasser.png
 *   img/tcg/frames/rahmen_wind.png
 *   img/tcg/frames/rahmen_erde.png
 *   img/tcg/frames/rahmen_licht.png
 *   img/tcg/frames/rahmen_finsternis.png
 *   img/tcg/frames/rahmen_fusion.png       Fusionsmonster
 *   img/tcg/frames/rahmen_ritual.png       Ritualmonster
 *   img/tcg/frames/rahmen_zauber.png       Zauberkarten
 *   img/tcg/frames/rahmen_ausruestung.png  Ausruestungskarten
 *   img/tcg/frames/schimmer_rare.png       (optional) Overlay fuer Rare
 *   img/tcg/frames/schimmer_epic.png       (optional) Overlay fuer Epic
 *   img/tcg/system/kartenruecken.png
 *   <ArtworkOrdner>/<name>.png              Artwork je Karte (Standard: img/tcg/artworks/,
 *                                           Parameter "artwork" nur der Dateiname ohne Endung)
 * Fehlt eine Grafik, zeichnet die Engine einen Platzhalter und meldet den
 * Pfad in der Konsole (F8). Fehlen die Schimmer-Overlays, wird ein dezenter
 * eingebauter Glanzeffekt verwendet.
 *
 * TEXT-LAYOUT AUF DER KARTE (Positionen fuer 300x420, skaliert proportional):
 *   Kosten-Zahl   Zentrum (40, 40),  Feld 12-68 x 20-60,  Schrift 32
 *   Name          Feld 78-286 x 22-48, zentriert, Schrift 22
 *   Typzeile      Feld 78-286 x 48-64, zentriert, Schrift 13
 *   Artwork       Fenster 22-278 x 70-250 (256x180), wird eingepasst
 *   Textbox       Feld 36-264 x 258-386, zentriert, Schrift 14, Zeile 18
 *   ATK-Zahl      Zentrum (40, 384), Feld 12-68 x 364-404, Schrift 28
 *   LP-Zahl       Zentrum (260, 384), Feld 232-288 x 364-404, Schrift 28
 * Zauber/Ausruestung: keine ATK/LP, Textbox 36-264 x 254-390.
 * Das Element-Icon ist Teil deines Rahmen-PNGs (Empfehlung: Kreis um (40,96)).
 *
 * KARTENTYPEN & KOSTEN:
 *   Normal-Monster Stufe 1-3: AP = Stufe
 *   Normal-Monster ab TributAbStufe: AP = Stufe + 1 Tribut
 *   Fusionsmonster: fusionsMaterial (vom Feld und/oder der Hand) + OPTIONAL
 *                   benoetigteKarte (Fusionszauber, leer lassen = nur Material
 *                   noetig). Material je Eintrag per Karten-ID, Element oder
 *                   Mindeststufe waehlbar. Keine AP.
 *   Ritualmonster:  IMMER benoetigteKarte (Zauber) + 1 Tribut + AP = Stufe.
 *                   ritualTribut = "beliebig" (Standard, kein Rabatt) oder eine
 *                   spezifische Anforderung (Karten-ID/Element/Mindeststufe) -
 *                   dann kostet das Ritual 1 AP weniger (Tribut-Einschraenkung
 *                   zaehlt als zusaetzlicher Kostenpunkt).
 *   Zauber:         AP = apKosten, Effekte mit Trigger "beimSpielen"
 *   Ausruestung:    AP = apKosten, atk/lp-Felder = Boni fuer das Monster;
 *                   kann eigene Effekte tragen (z.B. Trigger "beimAngriff")
 *
 * EFFEKT-TRIGGER:
 *   beimSpielen, beimBeschwoeren, beimAngriff, beimZerstoeren (zerstoert
 *   einen Gegner), beiZerstoerung (wird zerstoert), beimErleidenVonSchaden,
 *   beimZugbeginn, beimZugende, dauerhaft (Aura), aktivierbar (Hauptphase,
 *   apKosten, 1x pro Zug)
 * Bedingung (optional, fuer jeden Trigger): bedingungName/bedingungElement -
 * der Effekt wirkt nur, solange ein eigenes Monster den Namen(steil) bzw.
 * das Element traegt.
 *
 * EFFEKT-AKTIONEN:
 *   ziehen, apPlus, schaden (an Spieler), heilen (Spieler),
 *   monsterSchaden (an Monster), lpBuff (heilt Monster),
 *   atkBuff, atkDebuff, zerstoeren, verbannen (ins Exil), suche
 * Bei "dauerhaft"-Auren gilt zusaetzlich "bereich": selbst, angrenzend,
 * alleEigene, alleGegnerischen, gegenueber (Zone direkt gegenueber).
 *
 * PLUGIN-BEFEHLE:
 *   TCG GibKarte <kartenId> <anzahl> / TCG NimmKarte <kartenId> <anzahl>
 *   TCG StarterDeck <deckId>  (Deck-Vorlage mit typ=spieler als neues Deck anlegen)
 */

var TCG = TCG || {};
TCG.Core = TCG.Core || {};

(function() {
'use strict';

//-----------------------------------------------------------------------------
// Externe Daten (TCG Studio): Karten, Decks, Booster, Token-Typen, Element-
// Matrix und Einstellungen liegen als JSON-Dateien im Projektordner unter
// data/tcg/ und werden hier beim Start geladen - siehe TCG_SCHEMA.md.
// Benoetigt Node.js (ueber NW.js), das bei regulaerem RPG-Maker-MV-Desktop-
// Deployment (Testplay, Windows/Mac-Export) immer verfuegbar ist. Reines
// Browser-Hosting ohne NW.js wird NICHT unterstuetzt (siehe Konsole fuer
// eine klare Fehlermeldung, statt stillem Fehlschlagen).
//-----------------------------------------------------------------------------
TCG.Data = TCG.Data || {};

TCG.Data.available = function() { return typeof require === 'function'; };

TCG.Data.projectRoot = function() {
    if (!TCG.Data._root) {
        var path = require('path');
        TCG.Data._root = path.dirname(process.mainModule.filename);
    }
    return TCG.Data._root;
};

TCG.Data.readJson = function(relPath, fallback) {
    try {
        var fs = require('fs');
        var path = require('path');
        var full = path.join(TCG.Data.projectRoot(), relPath);
        if (!fs.existsSync(full)) {
            console.warn('TCG Studio: Datei nicht gefunden, verwende Standardwerte: ' + relPath);
            return fallback;
        }
        return JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (e) {
        console.error('TCG Studio: Fehler beim Laden von ' + relPath + ': ' + e.message);
        return fallback;
    }
};

TCG.Data.loadAll = function() {
    if (!TCG.Data.available()) {
        console.error('TCG: Node.js/NW.js nicht verfuegbar - externe Kartendaten ' +
            '(data/tcg/*.json) koennen nur im Desktop-Deployment (NW.js) geladen ' +
            'werden, nicht im reinen Browser-Modus.');
        return { cards: [], decks: [], booster: [], tokenTypes: [], elementMatrix: [], settings: {} };
    }
    return {
        cards:         TCG.Data.readJson('data/tcg/cards.json', { karten: [] }).karten || [],
        decks:         TCG.Data.readJson('data/tcg/decks.json', { decks: [] }).decks || [],
        booster:       TCG.Data.readJson('data/tcg/booster.json', { booster: [] }).booster || [],
        tokenTypes:    TCG.Data.readJson('data/tcg/tokenTypes.json', { typen: [] }).typen || [],
        elementMatrix: TCG.Data.readJson('data/tcg/elementMatrix.json', { regeln: [] }).regeln || [],
        settings:      TCG.Data.readJson('data/tcg/settings.json', {})
    };
};

var _tcgData = TCG.Data.loadAll();
var _settings = _tcgData.settings;

TCG.param = {
    cards:        _tcgData.cards,
    boosters:     _tcgData.booster,
    deckTemplates:_tcgData.decks,
    elementMods:  _tcgData.elementMatrix,
    startLP:      Number(_settings.startLP || 30),
    handSize:     Number(_settings.handGroesse || 5),
    // Maximale Handkartenzahl am ZUGENDE (waehrend des Zuges darf man mehr
    // haben, z.B. durch Effekte - am Zugende muss auf diese Zahl abgeworfen
    // werden, falls ueberschritten).
    maxHandSize:  Number(_settings.maxHandkarten || 6),
    apFirstTurn:  Number(_settings.apErsterZug !== undefined ? _settings.apErsterZug : 1),
    apPerTurn:    Number(_settings.apProZug || 2),
    apMax:        Number(_settings.apMaximum || 12),
    attackCost:   Number(_settings.angriffKosten || 0),
    tributeStufe: Number(_settings.tributAbStufe || 4),
    deckMin:      Number(_settings.deckMinimum || 30),
    deckMax:      Number(_settings.deckMaximum || 50),
    maxCopies:    Number(_settings.maxKopien || 3),
    cardW:        Number(_settings.kartenBreite || 300),
    cardH:        Number(_settings.kartenHoehe || 420),
    portraitSize: Number(_settings.portraitGroesse || 40),
    // Ordnet die drei Nicht-Neutral-Ausdruecke jeweils einer "Custom Face"-ID
    // aus SRD_CCEX_MessageFaces.js/SRD_CustomFaces.js zu (0 = kein Override,
    // bleibt beim neutralen Basisgesicht). Muss zur Projekt-Konfiguration
    // dieser Plugins passen (siehe deren Plugin-Parameter "Custom Face N").
    ccAusdruckAktion:  Number(_settings.ccAusdruckAktion || 0),
    ccAusdruckFreude:  Number(_settings.ccAusdruckFreude || 0),
    ccAusdruckSchmerz: Number(_settings.ccAusdruckSchmerz || 0),
    ccActorId: Number(_settings.ccActorId || 1), // welcher $gameActors-Akteur der eigene Spieler ist (Character Creator)
    // NPC-Deck-Vorlagen-ID, die fuer automatisch mit KI aufgefuellte Sitzplaetze
    // in einem NETZWERK-Tag-Duell verwendet wird (wenn ein Team nur 1 echten
    // Mitspieler hat). Muss auf eine typ:"npc"-Vorlage in decks.json zeigen.
    tagDuelAiDeckId: _settings.tagDuelAiDeckId || '',
    // Wie lange (ms) bei einem Verbindungsabbruch waehrend eines laufenden
    // Netzwerk-Duells auf eine Wiederverbindung gewartet wird, bevor das
    // Duell automatisch als verloren fuer den Ausgefallenen gewertet wird.
    reconnectGraceMs: Number(_settings.reconnectGraceMs || 90000),
    // Muenzwurf-Animation vor Zugbeginn: zwei Bilddateien in img/pictures
    // (ohne Endung), fuer "Kopf" (= eigene Seite beginnt) und "Zahl" (=
    // Gegner beginnt). Leer = keine Bilder konfiguriert, dann wird die
    // Muenzwurf-Anzeige uebersprungen (kein Fehler).
    coinHeadsImage: _settings.muenzeKopf || '',
    coinTailsImage: _settings.muenzeZahl || '',
    // RPG-Maker-Animationen (aus $dataAnimations, wie im Standard-Kampf-
    // system): pro Element eine Animations-ID, genutzt bei Angriffen UND
    // bei Zauber-Aktivierung (falls der Zauber ein Element hat). Format in
    // settings.json: "elementAnimationen": "{\"Feuer\":3,\"Wasser\":4}".
    elementAnimations: (function() {
        try { return JSON.parse(_settings.elementAnimationen || '{}'); }
        catch (e) { return {}; }
    })(),
    // Rueckfall-Animation fuer Zauber ohne (passendes) Element.
    spellAnimationDefault: Number(_settings.zauberAnimationStandard || 0) || 0,
    // Feste Animationen (nicht element-abhaengig) fuer Ziel-Wahl und
    // Zerstoerung. 0 = keine Animation (deaktiviert).
    targetAnimation:  Number(_settings.zielAnimation || 0) || 0,
    destroyAnimation: Number(_settings.zerstoerungAnimation || 0) || 0,
    resultVar:    Number(_settings.ergebnisVariable || 0),
    timerSwitch:  Number(_settings.timerSchalter || 0),
    timerSeconds: Number(_settings.timerSekunden || 300),
    artworkFolder: (function() {
        var f = String(_settings.artworkOrdner || 'img/tcg/artworks/');
        return f.charAt(f.length - 1) === '/' ? f : f + '/';
    })(),
    tokenTypes: _tcgData.tokenTypes
};

//-----------------------------------------------------------------------------
// Token-Typen (zentral definierte Zusatz-Ressourcen, z.B. "Seelen-Token")
//-----------------------------------------------------------------------------
TCG._tokenMap = null;

TCG.tokenMap = function() {
    if (!TCG._tokenMap) {
        TCG._tokenMap = {};
        TCG.param.tokenTypes.forEach(function(t) {
            t.maximum = Number(t.maximum) || 0;
            t.farbe = t.farbe || '#cccccc';
            TCG._tokenMap[t.id] = t;
        });
    }
    return TCG._tokenMap;
};

TCG.tokenType = function(id) { return TCG.tokenMap()[id] || null; };
TCG.tokenName = function(id) { var t = TCG.tokenType(id); return t ? t.name : id; };
TCG.tokenColor = function(id) { var t = TCG.tokenType(id); return t ? t.farbe : '#cccccc'; };
TCG.tokenMax = function(id) { var t = TCG.tokenType(id); return t ? t.maximum : 0; };

//-----------------------------------------------------------------------------
// Datenbank-Zugriff
//-----------------------------------------------------------------------------
TCG._cardMap = null;

TCG.cardMap = function() {
    if (!TCG._cardMap) {
        TCG._cardMap = {};
        TCG.param.cards.forEach(function(c) {
            c.stufe = Number(c.stufe || c.level || 1);
            c.atk = Number(c.atk) || 0;
            c.lp = Number(c.lp) || 0;
            c.apKosten = Number(c.apKosten) || 0;
            c.kartenTyp = c.kartenTyp || 'monster';
            c.monsterArt = c.monsterArt || 'normal';
            c.seltenheit = c.seltenheit || 'common';
            c.element = c.element || 'Neutral';
            c.effekte = c.effekte || [];
            c.fusionsMaterial = (c.fusionsMaterial || []).map(TCG.normalizeRequirement);
            c.ablageKosten = (c.ablageKosten || []).map(TCG.normalizeRequirement);
            c.tokenKosten = (c.tokenKosten || []).map(function(t) {
                t.typ = t.typ || ''; t.anzahl = t.anzahl || 1; return t;
            });
            c.tokenErsatzTyp = c.tokenErsatzTyp || '';
            c.ritualTribut = TCG.normalizeRequirement(c.ritualTribut || { modus: 'beliebig' });
            c.benoetigteKarte = c.benoetigteKarte || '';
            c.effektText = c.effektText || '';
            // Boss-Vollbild-Animation (nur Stufe 6): "artwork" wird als Sprite
            // Sheet mit animFrames gleich breiten Frames interpretiert, sobald
            // animFrames > 1 gesetzt ist. animTempo = Engine-Frames pro Bild
            // (60 Engine-Frames/Sek.; z.B. 8 = ca. 7,5 Bildwechsel/Sekunde).
            c.animFrames = Number(c.animFrames) || 1;
            c.animTempo = Number(c.animTempo) || 8;
            TCG._cardMap[c.id] = c;
        });
    }
    return TCG._cardMap;
};

TCG.card = function(id) { return TCG.cardMap()[id] || null; };

TCG.isMonster = function(card) { return !!card && card.kartenTyp === 'monster'; };

// Stufe-6-Monster gelten als Boss-Monster: Vollbild-Karte (Full Art), optional animiert.
TCG.isBoss = function(card) {
    return TCG.isMonster(card) && Number(card.stufe) === 6;
};

// Sucht eine Deck-Vorlage (Spieler-Starterdeck oder NPC-Deck) per ID.
TCG.deckTemplate = function(id) {
    for (var i = 0; i < TCG.param.deckTemplates.length; i++) {
        if (TCG.param.deckTemplates[i].id === id) return TCG.param.deckTemplates[i];
    }
    return null;
};

// NPC-Gegner: Deck-Vorlage mit typ="npc". Rueckgabe kompatibel zum bisherigen
// {name, deck}-Format (deck = Array aus {kartenId, anzahl}).
TCG.opponent = function(id) {
    var d = TCG.deckTemplate(id);
    if (!d || d.typ !== 'npc') return null;
    return { name: d.name, deck: d.karten || [], portrait: d.actorPortrait || '' };
};

// Spieler-Starterdecks: alle Deck-Vorlagen mit typ="spieler".
TCG.playerDeckTemplates = function() {
    return TCG.param.deckTemplates.filter(function(d) { return d.typ === 'spieler'; });
};

TCG.booster = function(id) {
    for (var i = 0; i < TCG.param.boosters.length; i++) {
        if (TCG.param.boosters[i].id === id) return TCG.param.boosters[i];
    }
    return null;
};

TCG.availableBoosters = function() {
    return TCG.param.boosters.filter(function(b) {
        var sw = Number(b.freischaltSchalter) || 0;
        return sw === 0 || $gameSwitches.value(sw);
    });
};

//-----------------------------------------------------------------------------
// Regeln & Hilfsfunktionen
//-----------------------------------------------------------------------------
// AP-Kosten einer Beschwoerung (Normal & Ritual: Stufe, Fusion: 0).
// Ritual mit spezifischem Tribut (nicht "beliebig"): -1 AP, da die Einschraenkung
// beim Tribut als zusaetzlicher "Kostenpunkt" gilt.
TCG.summonCost = function(card) {
    if (!TCG.isMonster(card)) return card ? card.apKosten : 0;
    if (card.monsterArt === 'fusion') return 0;
    if (card.monsterArt === 'ritual' && TCG.ritualNeedsSpecificTribute(card)) {
        return Math.max(0, card.stufe - 1);
    }
    return card.stufe;
};

TCG.ritualNeedsSpecificTribute = function(card) {
    return !!(card.ritualTribut && card.ritualTribut.modus !== 'beliebig');
};

TCG.needsTribute = function(card) {
    return TCG.isMonster(card) && (
        (card.monsterArt === 'normal' && card.stufe >= TCG.param.tributeStufe) ||
        card.monsterArt === 'ritual');
};

// Normalisiert eine Material-/Tribut-Anforderung mit Standardwerten (auch
// abwaertskompatibel zu alten Eintraegen ohne die neuen Felder).
TCG.normalizeRequirement = function(m) {
    m = m || {};
    m.modus = m.modus || 'karten';
    m.kartenId = m.kartenId || '';
    m.kartenIds = m.kartenIds || [];
    m.element = m.element || 'Neutral';
    m.elemente = m.elemente || [];
    m.mindestStufe = m.mindestStufe || 1;
    m.namensFragment = m.namensFragment || '';
    m.anzahl = m.anzahl || 1;
    return m;
};

// Prueft, ob eine Karten-ID eine Material-/Tribut-Anforderung erfuellt.
// karten/element unterstuetzen ODER-Listen (kartenIds/elemente); ist die Liste
// leer, greift der Einzelwert (kartenId/element) als Abwaertskompatibilitaet.
TCG.materialMatches = function(req, cardId) {
    var card = TCG.card(cardId);
    if (!card) return false;
    switch (req.modus) {
        case 'element': {
            var elems = (req.elemente && req.elemente.length) ? req.elemente : [req.element];
            return TCG.isMonster(card) && elems.indexOf(card.element) >= 0;
        }
        case 'stufe':
            return TCG.isMonster(card) && card.stufe >= (Number(req.mindestStufe) || 1);
        case 'name':
            return TCG.isMonster(card) && !!req.namensFragment &&
                card.name.indexOf(req.namensFragment) >= 0;
        case 'beliebig':
            return TCG.isMonster(card);
        default: { // 'karten'
            var ids = (req.kartenIds && req.kartenIds.length) ? req.kartenIds : [req.kartenId];
            return ids.indexOf(cardId) >= 0;
        }
    }
};

// Kurzbeschreibung einer einzelnen Material-/Tribut-Anforderung, fuer UI-Texte.
TCG.describeRequirement = function(req) {
    switch (req.modus) {
        case 'element': {
            var elems = (req.elemente && req.elemente.length) ? req.elemente : [req.element];
            return elems.join('/');
        }
        case 'stufe': return 'Stufe ' + (Number(req.mindestStufe) || 1) + '+';
        case 'name': return '"' + (req.namensFragment || '') + '"';
        case 'beliebig': return 'beliebiges Monster';
        default: {
            var ids = (req.kartenIds && req.kartenIds.length) ? req.kartenIds : [req.kartenId];
            var names = ids.map(function(id) {
                var c = TCG.card(id);
                return c ? c.name : ('? (' + id + ')');
            });
            return names.join('/');
        }
    }
};

// Beschreibt eine Liste von Ablage-Kosten-Anforderungen (Karten -> Exil).
TCG.describeGraveCost = function(reqs) {
    if (!reqs || reqs.length === 0) return '';
    return reqs.map(function(r) {
        return (Number(r.anzahl) || 1) + 'x ' + TCG.describeRequirement(r);
    }).join(', ') + ' \u2192 Exil (aus eigener Ablage)';
};

// Beschreibt eine Liste von Token-Kosten-Anforderungen.
TCG.describeTokenCost = function(reqs) {
    if (!reqs || reqs.length === 0) return '';
    return reqs.map(function(r) {
        return (Number(r.anzahl) || 1) + ' ' + TCG.tokenName(r.typ);
    }).join(', ');
};

// Gesamtbeschreibung der Beschwoerungskosten einer Karte (Deck Builder, Infofenster, Dialoge).
TCG.describeSummon = function(card) {
    if (!TCG.isMonster(card)) return card.apKosten + ' AP';
    var graveText = TCG.describeGraveCost(card.ablageKosten);
    var gravePart = graveText ? (' + Ablage: ' + graveText) : '';
    var tokenText = TCG.describeTokenCost(card.tokenKosten);
    var tokenPart = tokenText ? (' + ' + tokenText) : '';
    if (card.monsterArt === 'fusion') {
        var spellCard = card.benoetigteKarte ? TCG.card(card.benoetigteKarte) : null;
        var mats = (card.fusionsMaterial || []).map(function(m) {
            return (Number(m.anzahl) || 1) + 'x ' + TCG.describeRequirement(m);
        }).join(', ');
        return (spellCard ? spellCard.name + ' + ' : '') + (mats || 'Material') + gravePart + tokenPart + ' (0 AP)';
    }
    var apText = card.monsterArt === 'ritual' ? (TCG.summonCost(card) + ' AP') : (card.stufe + ' AP');
    if (card.tokenErsatzTyp) {
        apText += ' (oder ' + TCG.summonCost(card) + ' ' + TCG.tokenName(card.tokenErsatzTyp) + ')';
    }
    if (card.monsterArt === 'ritual') {
        var spell = card.benoetigteKarte ? TCG.card(card.benoetigteKarte) : null;
        var tribut = TCG.ritualNeedsSpecificTribute(card) ?
            'Tribut (' + TCG.describeRequirement(card.ritualTribut) + ')' : 'Tribut (beliebig)';
        return (spell ? spell.name + ' + ' : '') + tribut + gravePart + tokenPart + ' + ' + apText;
    }
    if (TCG.needsTribute(card)) return 'Tribut + ' + apText + gravePart + tokenPart;
    return apText + gravePart + tokenPart;
};

// Beschreibt die Kosten eines aktivierbaren Effekts (AP, Ablage- und/oder Token-Kosten).
TCG.describeEffectCost = function(effect) {
    var parts = [];
    var ap = Number(effect.apKosten) || 0;
    if (ap > 0) parts.push(ap + ' AP');
    var graveText = TCG.describeGraveCost(effect.ablageKosten);
    if (graveText) parts.push('Ablage: ' + graveText);
    var tokenText = TCG.describeTokenCost(effect.tokenKosten);
    if (tokenText) parts.push(tokenText);
    return parts.length > 0 ? parts.join(' + ') : 'kostenlos';
};

// Schadensmodifikator Angreifer-Element vs. Verteidiger-Element
TCG.elementMod = function(attacker, defender) {
    var total = 0;
    TCG.param.elementMods.forEach(function(m) {
        if (m.angreifer === attacker && m.verteidiger === defender) {
            total += Number(m.modifikator) || 0;
        }
    });
    return total;
};

TCG.elementColor = function(element) {
    switch (element) {
        case 'Feuer':      return '#ff6b4a';
        case 'Wasser':     return '#4aa8ff';
        case 'Wind':       return '#7fe0c9';
        case 'Erde':       return '#c9924e';
        case 'Licht':      return '#ffd75e';
        case 'Finsternis': return '#b07aff';
        default:           return '#cccccc';
    }
};

TCG.rarityColor = function(rarity) {
    switch (rarity) {
        case 'rare': return '#7fc9ff';
        case 'epic': return '#e8b34a';
        default:     return '#cccccc';
    }
};

// Typzeile fuer die Karte / Infofenster
TCG.typeLine = function(card) {
    if (card.kartenTyp === 'zauber') return 'Zauber';
    if (card.kartenTyp === 'ausruestung') return 'Ausruestung';
    var art = card.monsterArt === 'fusion' ? 'Fusion' :
              card.monsterArt === 'ritual' ? 'Ritual' : 'Monster';
    return art + ' \u00b7 Stufe ' + card.stufe;
};

// Kostenzahl oben links auf der Karte
TCG.costNumber = function(card) {
    return TCG.isMonster(card) ? card.stufe : card.apKosten;
};

TCG.shuffle = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = array[i]; array[i] = array[j]; array[j] = t;
    }
    return array;
};

// Fairer Muenzwurf (50/50) - genutzt, um zufaellig zu bestimmen, wer/welches
// Team ein Duell beginnt. Bewusst als EIGENE Funktion (nicht direkt
// Math.random() an den Aufrufstellen), damit an EINER Stelle klar ist, wo
// diese Zufallsentscheidung herkommt.
TCG.coinFlip = function() { return Math.random() < 0.5; };

// Liefert die konfigurierte Animations-ID fuer ein Element (siehe
// TCG.param.elementAnimations), oder 0 falls keine hinterlegt ist bzw. das
// Element leer/unbekannt ist.
TCG.resolveElementAnimation = function(element) {
    if (!element) return 0;
    return Number(TCG.param.elementAnimations[element]) || 0;
};

TCG.wrapText = function(bitmap, text, maxWidth) {
    var lines = [];
    String(text || '').split('\n').forEach(function(rawLine) {
        var words = rawLine.split(' ');
        var current = '';
        words.forEach(function(word) {
            var test = current.length > 0 ? current + ' ' + word : word;
            if (bitmap.measureTextWidth(test) > maxWidth && current.length > 0) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        });
        lines.push(current);
    });
    return lines;
};

// Gruppiert eine Liste von Karten-IDs (z.B. Ablage/Exil) zu {id, count}-Eintraegen,
// in der Reihenfolge des ersten Auftretens.
TCG.groupCardCounts = function(ids) {
    var map = {}, order = [];
    (ids || []).forEach(function(id) {
        if (!(id in map)) { map[id] = 0; order.push(id); }
        map[id]++;
    });
    return order.map(function(id) { return { id: id, count: map[id] }; });
};

//-----------------------------------------------------------------------------
// Game_System - Sammlung & Decks
//-----------------------------------------------------------------------------
Game_System.prototype.tcg = function() {
    if (!this._tcg) {
        this._tcg = { collection: {}, decks: [], activeDeck: -1, profil: null };
    }
    // Nachtraeglich ergaenzen, falls aus einem Spielstand geladen, der vor dem
    // Profil-System gespeichert wurde.
    if (!this._tcg.profil) {
        this._tcg.profil = (typeof TCG !== 'undefined' && TCG.Net) ? TCG.Net.createProfile() :
            { id: '', name: 'Spieler', actorData: {} };
    }
    return this._tcg;
};

// Rein lokales Spieler-Profil dieser Speicherdatei (siehe TCG_Network.js fuer
// Erzeugung/Austausch). Kein Account-Server, keine Registrierung - die "id"
// wird einmalig beim ersten Zugriff erzeugt und bleibt danach stabil.
TCG.profile = function() { return $gameSystem.tcg().profil; };

TCG.setProfileName = function(name) {
    TCG.profile().name = String(name || 'Spieler').trim().slice(0, 20) || 'Spieler';
};

// Optionale Anbindung an SRD_CharacterCreatorEX (falls installiert): liest
// das im Charakter-Editor konfigurierte Aussehen eines Akteurs (Standard:
// Akteur 1, typischerweise der Anfuehrer) und legt es im lokalen Profil ab,
// damit es beim Verbindungsaufbau automatisch an Mitspieler mitgeschickt
// wird (siehe TCG_Network.js: Profil-Austausch). Tut nichts und wirft keinen
// Fehler, falls das Plugin nicht geladen ist oder der Akteur noch kein
// eigenes Aussehen konfiguriert hat.
TCG.syncProfileFromCharacterCreator = function(actorId) {
    actorId = actorId || TCG.param.ccActorId;
    if (typeof $gameCharacterCreations === 'undefined' || !$gameCharacterCreations) return false;
    if (!$gameCharacterCreations.hasInfo(actorId)) return false;
    TCG.profile().actorData = {
        char: $gameCharacterCreations.getInfo(actorId, ''),
        face: $gameCharacterCreations.getInfo(actorId, 'face'),
        sv: $gameCharacterCreations.getInfo(actorId, 'sv')
    };
    return true;
};

TCG.collection = function() { return $gameSystem.tcg().collection; };
TCG.cardCount = function(id) { return TCG.collection()[id] || 0; };

TCG.addCard = function(id, amount) {
    if (!TCG.card(id)) return;
    var col = TCG.collection();
    col[id] = (col[id] || 0) + (amount || 1);
};

TCG.removeCard = function(id, amount) {
    var col = TCG.collection();
    col[id] = Math.max(0, (col[id] || 0) - (amount || 1));
    if (col[id] === 0) delete col[id];
};

TCG.ownedCardIds = function() {
    var col = TCG.collection();
    return Object.keys(col).filter(function(id) { return col[id] > 0 && TCG.card(id); });
};

TCG.decks = function() { return $gameSystem.tcg().decks; };

TCG.newDeck = function() {
    var deck = { name: 'Deck ' + (TCG.decks().length + 1), cards: {} };
    TCG.decks().push(deck);
    return deck;
};

TCG.deleteDeck = function(index) {
    var data = $gameSystem.tcg();
    data.decks.splice(index, 1);
    if (data.activeDeck === index) data.activeDeck = -1;
    else if (data.activeDeck > index) data.activeDeck--;
};

TCG.setActiveDeck = function(index) { $gameSystem.tcg().activeDeck = index; };

TCG.activeDeck = function() {
    var data = $gameSystem.tcg();
    return data.decks[data.activeDeck] || null;
};

TCG.deckSize = function(deck) {
    if (!deck) return 0;
    var total = 0;
    for (var id in deck.cards) total += deck.cards[id];
    return total;
};

TCG.deckValid = function(deck) {
    var size = TCG.deckSize(deck);
    return size >= TCG.param.deckMin && size <= TCG.param.deckMax;
};

TCG.buildDrawPile = function(deckCards) {
    var pile = [];
    for (var id in deckCards) {
        for (var i = 0; i < deckCards[id]; i++) {
            if (TCG.card(id)) pile.push(id);
        }
    }
    return TCG.shuffle(pile);
};

//-----------------------------------------------------------------------------
// Booster oeffnen
//-----------------------------------------------------------------------------
TCG.openBooster = function(boosterId) {
    var booster = TCG.booster(boosterId);
    if (!booster || !booster.pool || booster.pool.length === 0) return [];
    var pulls = [];
    var totalWeight = booster.pool.reduce(function(sum, entry) {
        return sum + (Number(entry.gewicht) || 1);
    }, 0);
    var count = Number(booster.kartenProPack) || 5;
    for (var i = 0; i < count; i++) {
        var roll = Math.random() * totalWeight;
        for (var p = 0; p < booster.pool.length; p++) {
            roll -= (Number(booster.pool[p].gewicht) || 1);
            if (roll <= 0) {
                pulls.push(booster.pool[p].kartenId);
                break;
            }
        }
    }
    pulls.forEach(function(id) { TCG.addCard(id, 1); });
    return pulls;
};

//-----------------------------------------------------------------------------
// Plugin-Befehle
//-----------------------------------------------------------------------------
var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command !== 'TCG') return;
    switch (args[0]) {
        case 'GibKarte':
            TCG.addCard(args[1], Number(args[2]) || 1);
            break;
        case 'NimmKarte':
            TCG.removeCard(args[1], Number(args[2]) || 1);
            break;
        case 'StarterDeck': {
            var tmpl = TCG.deckTemplate(args[1]);
            if (!tmpl || tmpl.typ !== 'spieler') {
                $gameMessage.add('TCG: Spieler-Deck-Vorlage "' + args[1] + '" nicht gefunden.');
                break;
            }
            var deck = TCG.newDeck();
            deck.name = tmpl.name || deck.name;
            (tmpl.karten || []).forEach(function(entry) {
                TCG.addCard(entry.kartenId, Number(entry.anzahl) || 1);
                deck.cards[entry.kartenId] = (deck.cards[entry.kartenId] || 0) + (Number(entry.anzahl) || 1);
            });
            TCG.setActiveDeck(TCG.decks().indexOf(deck));
            break;
        }
    }
};

//-----------------------------------------------------------------------------
// Sprite_TCGCard - komponiert eine Karte: Artwork -> Rahmen -> Seltenheit -> Text
//-----------------------------------------------------------------------------
TCG._warnedUrls = {};

function Sprite_TCGCard() {
    this.initialize.apply(this, arguments);
}
window.Sprite_TCGCard = Sprite_TCGCard;

Sprite_TCGCard.prototype = Object.create(Sprite.prototype);
Sprite_TCGCard.prototype.constructor = Sprite_TCGCard;

Sprite_TCGCard.prototype.initialize = function(card, faceDown, animate) {
    Sprite.prototype.initialize.call(this);
    this._sources = null;
    this._composed = true;
    this._animate = animate !== false; // Standard: an. false = keine Bildwechsel (z.B. kleine Hand-Karten)
    this._animFrameIndex = 0;
    this._animTimer = 0;
    this.setCard(card || null, faceDown);
};

Sprite_TCGCard.prototype.setCard = function(card, faceDown) {
    this._card = card;
    this._faceDown = !!faceDown;
    this._animFrameIndex = 0;
    this._animTimer = 0;
    this.refresh();
};

Sprite_TCGCard.prototype.card = function() { return this._card; };

Sprite_TCGCard.prototype.destroy = function() {
    if (Sprite.prototype.destroy) Sprite.prototype.destroy.call(this);
};

// Rahmen-Datei je Kartentyp/Element
TCG.frameName = function(card) {
    if (card.kartenTyp === 'zauber') return 'rahmen_zauber';
    if (card.kartenTyp === 'ausruestung') return 'rahmen_ausruestung';
    if (TCG.isBoss(card)) return 'rahmen_boss'; // ein Vollbild-Rahmen fuer alle Elemente,
                                                 // Element wird als farbiges Kosten-Badge angezeigt
    if (card.monsterArt === 'fusion') return 'rahmen_fusion';
    if (card.monsterArt === 'ritual') return 'rahmen_ritual';
    return 'rahmen_' + String(card.element || 'Neutral').toLowerCase()
        .replace('\u00e4', 'ae').replace('\u00f6', 'oe').replace('\u00fc', 'ue');
};

// Grund-Hintergrund HINTER dem Artwork (Ebene 0, siehe drawFace) - dieselbe
// Element-/Typ-Zuordnung wie frameName, aber ein eigenes Bild: der Rahmen
// hat im Artwork-Fenster ein transparentes Loch, der Hintergrund fuellt
// GENAU diese Flaeche (wichtig, falls das Artwork selbst transparente
// Bereiche hat, z.B. freigestellte Charaktere ohne eigenen Hintergrund).
TCG.backgroundName = function(card) {
    if (card.kartenTyp === 'zauber') return 'hintergrund_zauber';
    if (card.kartenTyp === 'ausruestung') return 'hintergrund_ausruestung';
    if (card.monsterArt === 'fusion') return 'hintergrund_fusion';
    if (card.monsterArt === 'ritual') return 'hintergrund_ritual';
    return 'hintergrund_' + String(card.element || 'Neutral').toLowerCase()
        .replace('\u00e4', 'ae').replace('\u00f6', 'oe').replace('\u00fc', 'ue');
};

Sprite_TCGCard.prototype.refresh = function() {
    var w = TCG.param.cardW;
    var h = TCG.param.cardH;
    if (!this.bitmap || this.bitmap.width !== w || this.bitmap.height !== h) {
        this.bitmap = new Bitmap(w, h);
    }
    if (this._faceDown || !this._card) {
        this._sources = { back: ImageManager.loadBitmap('img/tcg/system/', 'kartenruecken') };
        this._composed = false;
        this.redraw();
        this.updateCompose();
        return;
    }
    var card = this._card;
    this._sources = {
        frame: ImageManager.loadBitmap('img/tcg/frames/', TCG.frameName(card)),
        background: TCG.isBoss(card) ? null : ImageManager.loadBitmap('img/tcg/frames/', TCG.backgroundName(card)),
        art: card.artwork ? ImageManager.loadBitmap(TCG.param.artworkFolder, card.artwork) : null,
        overlay: card.seltenheit === 'rare' ?
                     ImageManager.loadBitmap('img/tcg/frames/', 'schimmer_rare') :
                 card.seltenheit === 'epic' ?
                     ImageManager.loadBitmap('img/tcg/frames/', 'schimmer_epic') : null
    };
    this._composed = false;
    this.redraw();
    this.updateCompose();
};

Sprite_TCGCard.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (!this._composed) this.updateCompose();
    this.updateAnimation();
    this.updateTrigger();
};

// Einfache Sprite-Sheet-Animation fuer Boss-Vollbild-Karten (animFrames > 1):
// zaehlt Engine-Frames mit und schaltet nach "animTempo" Engine-Frames zum
// naechsten Bild im Sprite Sheet weiter (Endlosschleife). Ohne Animation
// (animFrames <= 1) oder wenn deaktiviert (this._animate = false, z.B. kleine
// Hand-Karten) passiert nichts - die Karte bleibt beim ersten/einzigen Bild.
Sprite_TCGCard.prototype.updateAnimation = function() {
    var card = this._card;
    if (!this._animate || this._faceDown || !card || !TCG.isBoss(card)) return;
    var frames = Math.max(1, Number(card.animFrames) || 1);
    if (frames <= 1) return;
    var speed = Math.max(1, Number(card.animTempo) || 8);
    this._animTimer++;
    if (this._animTimer >= speed) {
        this._animTimer = 0;
        this._animFrameIndex = (this._animFrameIndex + 1) % frames;
        this.redraw();
    }
};

Sprite_TCGCard.prototype.updateCompose = function() {
    var s = this._sources;
    if (!s) { this._composed = true; return; }
    for (var key in s) {
        var b = s[key];
        if (b && !b.isReady() && !b.isError()) return;
    }
    this._composed = true;
    for (var k in s) {
        // Fehlende Schimmer-Overlays sind erlaubt (eingebauter Fallback)
        if (s[k] && s[k].isError() && k !== 'overlay' && !TCG._warnedUrls[s[k].url]) {
            TCG._warnedUrls[s[k].url] = true;
            console.error('TCG: Grafik konnte nicht geladen werden: ' + s[k].url);
        }
    }
    this.redraw();
};

Sprite_TCGCard.prototype.ready = function(bitmap) {
    return !!bitmap && bitmap.isReady() && bitmap.width > 0;
};

Sprite_TCGCard.prototype.redraw = function() {
    this.bitmap.clear();
    if (this._faceDown || !this._card) this.drawBack();
    else if (TCG.isBoss(this._card)) this.drawBossFace(this.bitmap, this._card);
    else this.drawFace();
};

Sprite_TCGCard.prototype.drawBack = function() {
    var bmp = this.bitmap;
    var back = this._sources && this._sources.back;
    if (this.ready(back)) {
        bmp.blt(back, 0, 0, back.width, back.height, 0, 0, bmp.width, bmp.height);
    } else {
        bmp.fillRect(0, 0, bmp.width, bmp.height, '#3a4a8f');
        bmp.fillRect(4, 4, bmp.width - 8, bmp.height - 8, '#26306b');
    }
};

Sprite_TCGCard.prototype.drawFace = function() {
    var card = this._card;
    var bmp = this.bitmap;
    var w = bmp.width;
    var h = bmp.height;
    var isMonster = TCG.isMonster(card);
    var s = this._sources;
    var px = function(f) { return Math.round(w * f); };
    var py = function(f) { return Math.round(h * f); };

    // Ebene 0: Hintergrund HINTER dem Artwork (fuellt das spaetere Artwork-
    // Fenster VOLLSTAENDIG aus - wichtig, falls das Artwork selbst
    // transparente Stellen hat, z.B. freigestellte Charaktere).
    var artRect = { x: px(0.0733), y: py(0.1667), w: px(0.8533), h: py(0.4286) };
    if (this.ready(s.background)) {
        bmp.blt(s.background, 0, 0, s.background.width, s.background.height,
            artRect.x, artRect.y, artRect.w, artRect.h);
    } else {
        bmp.gradientFillRect(artRect.x, artRect.y, artRect.w, artRect.h,
            TCG.elementColor(card.element), '#12141c', true);
    }

    // Ebene 1: Artwork (Fenster 22-278 x 70-250 bei 300x420)
    if (this.ready(s.art)) {
        var scale = Math.min(artRect.w / s.art.width, artRect.h / s.art.height);
        var dw = Math.round(s.art.width * scale);
        var dh = Math.round(s.art.height * scale);
        bmp.blt(s.art, 0, 0, s.art.width, s.art.height,
            artRect.x + Math.floor((artRect.w - dw) / 2),
            artRect.y + Math.floor((artRect.h - dh) / 2), dw, dh);
    } else {
        bmp.fillRect(artRect.x, artRect.y, artRect.w, artRect.h, 'rgba(0,0,0,0.35)');
    }

    // Ebene 2: Rahmen (Fallback: dunkle Karte mit Elementrand)
    if (this.ready(s.frame)) {
        bmp.blt(s.frame, 0, 0, s.frame.width, s.frame.height, 0, 0, w, h);
    } else {
        var bc = TCG.elementColor(card.element);
        bmp.fillRect(0, 0, w, py(0.16), 'rgba(10,12,20,0.85)');
        bmp.fillRect(0, py(0.6), w, h - py(0.6), 'rgba(10,12,20,0.85)');
        bmp.fillRect(0, 0, w, 4, bc);
        bmp.fillRect(0, h - 4, w, 4, bc);
        bmp.fillRect(0, 0, 4, h, bc);
        bmp.fillRect(w - 4, 0, 4, h, bc);
    }

    // Ebene 3: Seltenheit (PNG-Overlay oder eingebauter Schimmer)
    if (card.seltenheit === 'rare' || card.seltenheit === 'epic') {
        if (this.ready(s.overlay)) {
            bmp.blt(s.overlay, 0, 0, s.overlay.width, s.overlay.height, 0, 0, w, h);
        } else {
            this.drawShimmer(card.seltenheit, bmp);
        }
    }

    // Ebene 4: Texte
    bmp.outlineColor = 'rgba(0,0,0,0.85)';

    // Kosten-Zahl (Zentrum 40,40)
    bmp.outlineWidth = 4;
    bmp.fontSize = py(0.0762);
    bmp.textColor = '#ffffff';
    bmp.drawText(String(TCG.costNumber(card)), px(0.04), py(0.0476),
        px(0.1867), py(0.0952), 'center');

    // Name (78-286 x 22-48)
    bmp.outlineWidth = 3;
    bmp.fontSize = py(0.0524);
    bmp.drawText(card.name, px(0.26), py(0.0524), px(0.6933), py(0.0619), 'center');

    // Typzeile (78-286 x 48-64)
    bmp.fontSize = py(0.031);
    bmp.textColor = '#e8e0d0';
    bmp.outlineWidth = 2;
    bmp.drawText(TCG.typeLine(card), px(0.26), py(0.1143), px(0.6933), py(0.0381), 'center');

    // Textbox (36-264 x 258-386 bzw. 254-390 bei Effektkarten), zentriert
    bmp.fontSize = py(0.0333);
    bmp.textColor = '#2a2018';
    bmp.outlineWidth = 0;
    var boxX = px(0.12);
    var boxW = px(0.76);
    var boxY = isMonster ? py(0.6143) : py(0.6048);
    var boxH = isMonster ? py(0.3048) : py(0.3238);
    var lineH = py(0.0429);
    var lines = TCG.wrapText(bmp, card.effektText, boxW);
    var maxLines = Math.floor(boxH / lineH);
    var count = Math.min(lines.length, maxLines);
    var startY = boxY + Math.floor((boxH - count * lineH) / 2);
    for (var i = 0; i < count; i++) {
        bmp.drawText(lines[i], boxX, startY + i * lineH, boxW, lineH, 'center');
    }

    // ATK / LP (nur Monster; Zentren 40,384 und 260,384)
    if (isMonster) {
        bmp.outlineWidth = 4;
        bmp.outlineColor = 'rgba(0,0,0,0.85)';
        bmp.fontSize = py(0.0667);
        bmp.textColor = '#ffffff';
        bmp.drawText(String(card.atk), px(0.04), py(0.8667),
            px(0.1867), py(0.0952), 'center');
        bmp.drawText(String(card.lp), px(0.7733), py(0.8667),
            px(0.1867), py(0.0952), 'center');
    }
};

// Boss-Monster (Stufe 6): Vollbild-Karte. Ist "animFrames" > 1 gesetzt, wird
// "artwork" als Sprite Sheet interpretiert: gleich breite Frames nebeneinander
// in einer Reihe, das aktuell faellige Frame wird per Cover-Fill eingepasst
// (siehe updateAnimation fuer den Bildwechsel-Takt). animFrames <= 1 (Standard)
// verhaelt sich wie ein normales statisches Full-Art-Bild.
Sprite_TCGCard.prototype.drawBossFace = function(bmp, card) {
    var w = bmp.width, h = bmp.height;
    var s = this._sources;
    if (this.ready(s.art)) {
        var frames = Math.max(1, Number(card.animFrames) || 1);
        var frameIndex = frames > 1 ? this._animFrameIndex % frames : 0;
        var frameW = Math.floor(s.art.width / frames);
        var frameH = s.art.height;
        var sx = frameIndex * frameW;
        // Cover-Fill innerhalb des aktuellen Frames (nicht des gesamten Sheets)
        var scale = Math.max(w / frameW, h / frameH);
        var dw = Math.round(frameW * scale);
        var dh = Math.round(frameH * scale);
        bmp.blt(s.art, sx, 0, frameW, frameH,
            Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
    } else {
        bmp.gradientFillRect(0, 0, w, h, '#2a2f45', '#0a0c14', true);
    }
    this.drawBossOverlay(bmp, card);
};

// Rahmen, Seltenheit, Name/Kosten/ATK/LP und Kurztext - immer oberhalb von
// Artwork bzw. Animation gezeichnet.
Sprite_TCGCard.prototype.drawBossOverlay = function(bmp, card) {
    var w = bmp.width, h = bmp.height;
    var s = this._sources;
    var px = function(f) { return Math.round(w * f); };
    var py = function(f) { return Math.round(h * f); };

    // Lesbarkeits-Verlaeufe oben/unten
    bmp.gradientFillRect(0, 0, w, py(0.22), 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0)', true);
    bmp.gradientFillRect(0, py(0.72), w, py(0.28), 'rgba(0,0,0,0)', 'rgba(0,0,0,0.88)', true);

    // Rahmen (ein gemeinsamer Boss-Rahmen fuer alle Elemente)
    if (this.ready(s.frame)) {
        bmp.blt(s.frame, 0, 0, s.frame.width, s.frame.height, 0, 0, w, h);
    } else {
        var gold = '#e8b34a';
        bmp.fillRect(0, 0, w, 5, gold);
        bmp.fillRect(0, h - 5, w, 5, gold);
        bmp.fillRect(0, 0, 5, h, gold);
        bmp.fillRect(w - 5, 0, 5, h, gold);
    }

    if (card.seltenheit === 'rare' || card.seltenheit === 'epic') {
        if (this.ready(s.overlay)) {
            bmp.blt(s.overlay, 0, 0, s.overlay.width, s.overlay.height, 0, 0, w, h);
        } else {
            this.drawShimmer(card.seltenheit, bmp);
        }
    }

    bmp.outlineColor = 'rgba(0,0,0,0.9)';

    // Kosten-Badge, in Elementfarbe (ersetzt separate Element-Rahmen je Boss)
    bmp.outlineWidth = 4;
    bmp.fontSize = py(0.0762);
    bmp.textColor = TCG.elementColor(card.element);
    bmp.drawText(String(TCG.costNumber(card)), px(0.04), py(0.0476), px(0.1867), py(0.0952), 'center');

    // "BOSS"-Band + Name
    bmp.fontSize = py(0.028);
    bmp.textColor = '#e8b34a';
    bmp.drawText('BOSS \u00b7 STUFE 6', px(0.26), py(0.016), px(0.6933), py(0.032), 'center');
    bmp.fontSize = py(0.058);
    bmp.textColor = '#ffffff';
    bmp.drawText(card.name, px(0.08), py(0.052), px(0.84), py(0.07), 'center');

    // ATK / LP
    bmp.fontSize = py(0.0667);
    bmp.textColor = '#ffffff';
    bmp.drawText(String(card.atk), px(0.04), py(0.8667), px(0.1867), py(0.0952), 'center');
    bmp.drawText(String(card.lp), px(0.7733), py(0.8667), px(0.1867), py(0.0952), 'center');

    // Kurzer Effekttext (max. 2 Zeilen, Full-Art-Karten haben nur wenig Platz)
    if (card.effektText) {
        bmp.fontSize = py(0.032);
        bmp.textColor = '#f5f0e6';
        bmp.outlineWidth = 3;
        var lines = TCG.wrapText(bmp, card.effektText, px(0.8));
        var lineCount = Math.min(lines.length, 2);
        var lineH = py(0.04);
        var startY = py(0.79) - lineCount * lineH;
        for (var i = 0; i < lineCount; i++) {
            bmp.drawText(lines[i], px(0.1), startY + i * lineH, px(0.8), lineH, 'center');
        }
    }
};

// Frueher: einmalige Trigger-Animation bei Beschwoerung/Angriff (DragonBones).
// Ohne DragonBones gibt es keine diskreten Trigger-Animationen mehr, nur noch
// die dauerhafte Sprite-Sheet-Idle-Schleife (siehe updateAnimation). Bleibt als
// No-Op-Stub bestehen, damit TCG_Battle.js's bestehende Aufrufe unveraendert
// funktionieren (sicher aufrufbar, tut aber nichts).
// Kurze, rein visuelle Rueckmeldung fuer ein Spielereignis - aendert NIE den
// Spielzustand. "kind":
//   'beschwoerung' - Karte wird aufs Feld platziert (Einblenden/Materialisieren)
//   'angriff'      - Karte greift an (kurzer heller Aufblitz)
//   'zerstoerung'  - Karte wird zerstoert (Ausblenden + roter Blitz)
//   'aktivieren'   - Handkarte wird gespielt/aktiviert (goldenes Glimmen)
//   'ziel'         - Karte wird als Ziel gewaehlt (kurzer blauer Aufblitz)
//   'ablage'       - Karte wandert (ohne Zerstoerung, z.B. Kosten/Mahlen) in die Ablage
// Nutzt bewusst NUR opacity + Blendfarbe (nie scale/x/y) - diese werden an
// vielen Stellen extern fuer Positionierung/Groesse gesetzt, eine
// Skalierungs-Animation wuerde damit kollidieren.
Sprite_TCGCard.prototype.playTrigger = function(kind) {
    this._triggerKind = kind;
    this._triggerFrame = 0;
    var durations = {
        beschwoerung: 20, angriff: 16, zerstoerung: 32,
        aktivieren: 26, ziel: 14, ablage: 26
    };
    this._triggerMaxFrames = durations[kind] || 20;
    if (kind === 'beschwoerung') this.opacity = 0;
};

// True waehrend eines "Karte verschwindet"-Auslösers (zerstoerung/ablage) -
// solange verhindert der Aufrufer (z.B. refreshZones), die Sprite vorzeitig
// unsichtbar zu machen, damit die Animation Zeit zum Abspielen hat.
Sprite_TCGCard.prototype.isPlayingExitTrigger = function() {
    return (this._triggerKind === 'zerstoerung' || this._triggerKind === 'ablage') &&
           this._triggerFrame < this._triggerMaxFrames;
};

Sprite_TCGCard.prototype.updateTrigger = function() {
    if (!this._triggerKind) return;
    var t = this._triggerFrame / this._triggerMaxFrames; // 0..1 Fortschritt
    switch (this._triggerKind) {
        case 'beschwoerung':
            this.opacity = Math.min(255, Math.round(255 * Math.min(1, t * 1.8)));
            this._setTriggerBlend(255, 255, 255, Math.round(160 * Math.max(0, 1 - t * 2)));
            break;
        case 'angriff':
            this._setTriggerBlend(255, 200, 80, Math.round(180 * Math.sin(Math.min(1, t) * Math.PI)));
            break;
        case 'zerstoerung':
            this.opacity = Math.round(255 * Math.max(0, 1 - t));
            this._setTriggerBlend(220, 40, 40, Math.round(150 * Math.sin(Math.min(1, t) * Math.PI)));
            break;
        case 'aktivieren':
            this._setTriggerBlend(255, 215, 90, Math.round(120 * Math.abs(Math.sin(t * Math.PI * 2.5))));
            break;
        case 'ziel':
            this._setTriggerBlend(90, 200, 255, Math.round(190 * Math.sin(Math.min(1, t) * Math.PI)));
            break;
        case 'ablage':
            this.opacity = Math.round(255 * Math.max(0, 1 - t));
            this._setTriggerBlend(180, 180, 190, Math.round(90 * Math.sin(Math.min(1, t) * Math.PI)));
            break;
    }
    this._triggerFrame++;
    if (this._triggerFrame >= this._triggerMaxFrames) {
        var wasExit = (this._triggerKind === 'zerstoerung' || this._triggerKind === 'ablage');
        this._triggerKind = null;
        this.opacity = 255;
        this._setTriggerBlend(0, 0, 0, 0);
        if (wasExit) this.visible = false;
    }
};

// Setzt die Blendfarbe, falls die Laufzeitumgebung sie unterstuetzt (echtes
// PIXI-Sprite) - in Testumgebungen ohne setBlendColor passiert einfach nichts.
Sprite_TCGCard.prototype._setTriggerBlend = function(r, g, b, a) {
    if (this.setBlendColor) this.setBlendColor([r, g, b, a]);
};

// Eingebauter Schimmer, falls keine Overlay-PNGs vorhanden sind
Sprite_TCGCard.prototype.drawShimmer = function(rarity, bmp) {
    bmp = bmp || this.bitmap;
    var w = bmp.width;
    var h = bmp.height;
    var ctx = bmp._context;
    if (ctx) {
        ctx.save();
        ctx.globalAlpha = rarity === 'epic' ? 0.22 : 0.14;
        ctx.fillStyle = rarity === 'epic' ? '#ffd75e' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(w * 0.15, 0); ctx.lineTo(w * 0.35, 0);
        ctx.lineTo(0, h * 0.5); ctx.lineTo(0, h * 0.22);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w * 0.75, 0); ctx.lineTo(w * 0.9, 0);
        ctx.lineTo(w * 0.25, h); ctx.lineTo(w * 0.1, h);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        if (bmp._setDirty) bmp._setDirty();
        else if (bmp._baseTexture) bmp._baseTexture.update();
    }
    if (rarity === 'epic') {
        var gold = 'rgba(232,179,74,0.85)';
        bmp.fillRect(0, 0, w, 3, gold);
        bmp.fillRect(0, h - 3, w, 3, gold);
        bmp.fillRect(0, 0, 3, h, gold);
        bmp.fillRect(w - 3, 0, 3, h, gold);
    }
};

})();
