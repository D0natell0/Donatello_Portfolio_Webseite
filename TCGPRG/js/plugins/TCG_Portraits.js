//=============================================================================
// TCG_Portraits.js  (v1.0)
//-----------------------------------------------------------------------------
// Actor-Portraets im Kampf: neben dem Spielernamen wird ein Bild angezeigt.
// Zwei moegliche Quellen pro Teilnehmer:
//
//   1) Character-Creator-generiert (SRD_CharacterCreatorEX, falls installiert):
//      Das Basisgesicht kommt aus den gewaehlten Ausruestungsteilen. Fuer
//      ECHTE unterschiedliche Ausdruecke wird zusaetzlich eine der beiden
//      Erweiterungen benoetigt:
//        - SRD_CCEX_MessageFaces.js (bevorzugt): arbeitet auf rohen Daten,
//          funktioniert daher auch fuer Mitspieler im Multiplayer (nur die
//          JSON-tauglichen Teile-Daten werden uebertragen, siehe unten).
//        - SRD_CustomFaces.js: braucht einen ECHTEN lokalen Akteur, geht
//          also nur fuer den eigenen Spieler.
//      Ist keine der beiden Erweiterungen installiert, wird immer nur das
//      neutrale Basisgesicht gezeigt (kein Fehler, einfach keine Mimik).
//      Welche "Custom Face"-ID zu welchem Ausdruck gehoert, wird ueber
//      TCG.param.ccAusdruckAktion/-Freude/-Schmerz konfiguriert (Standard 0
//      = kein Override).
//
//   2) Manuelles Sprite Sheet (NPCs, im Studio ausgewaehlt): ein horizontaler
//      4er-Streifen gleich grosser Bilder - neutral, Aktion/Befehl, Freude,
//      Schmerz. Der jeweils passende Ausdruck wird automatisch je nach
//      Spielgeschehen umgeschaltet (siehe Scene_TCGBattle-Anbindung).
//
// Muss NACH TCG_Core.js UND TCG_Battle.js geladen werden.
//=============================================================================

var TCG = TCG || {};

(function() {
'use strict';

// Reihenfolge der 4 Ausdruecke im horizontalen Sprite-Sheet-Streifen.
TCG.PORTRAIT_EXPRESSIONS = ['neutral', 'aktion', 'freude', 'schmerz'];

// Ermittelt, WOHER das Portraet eines Teilnehmers kommen soll.
// profileActorData: das "actorData"-Feld eines Profils (eigenes oder eines
//   Mitspielers, siehe TCG.profile()/TCG_Network.js) - {face: {...}} falls
//   per Character Creator konfiguriert, sonst leer/undefined.
// npcPortraitPath: string|null - Pfad zu einem manuellen 4-Frame-Sprite-Sheet
//   (aus einer NPC-Deck-Vorlage, siehe TCG_Core.js: TCG.opponent()).
// Rueckgabe: {mode:'cc', faceInfo} | {mode:'sheet', path} | null (kein Portraet)
TCG.resolvePortraitSource = function(profileActorData, npcPortraitPath) {
    if (profileActorData && profileActorData.face &&
        typeof $gameCharacterCreations !== 'undefined' && $gameCharacterCreations) {
        return { mode: 'cc', faceInfo: profileActorData.face };
    }
    if (npcPortraitPath) {
        return { mode: 'sheet', path: npcPortraitPath };
    }
    return null;
};

// Ordnet einen Ausdrucksnamen der passenden "Custom Face"-ID zu (siehe
// TCG.param.ccAusdruck*). 'neutral' hat keine ID - das ist immer das
// unveraenderte Basisgesicht.
TCG.ccFaceIdFor = function(expression) {
    switch (expression) {
        case 'aktion':  return TCG.param.ccAusdruckAktion;
        case 'freude':  return TCG.param.ccAusdruckFreude;
        case 'schmerz': return TCG.param.ccAusdruckSchmerz;
        default: return 0;
    }
};

// Prueft, welche der beiden Erweiterungen fuer echte Ausdrucks-Varianten
// beim Character Creator installiert sind:
//   'data'  - SRD_CCEX_MessageFaces.js: arbeitet direkt auf rohen Teile-Daten,
//             funktioniert daher auch fuer per Netzwerk uebertragene
//             Mitspieler-Gesichter (kein echter lokaler Akteur noetig).
//   'actor' - SRD_CustomFaces.js (oder MessageFaces' aeltere Variante):
//             braucht einen echten lokalen $gameActors-Eintrag - nur fuer
//             den eigenen Spieler nutzbar, nicht fuer Netzwerk-Mitspieler.
//   null    - keine Erweiterung installiert: nur das statische Basisgesicht.
TCG.ccExpressionCapability = function() {
    if (typeof $gameCharacterCreations === 'undefined' || !$gameCharacterCreations) return null;
    if (typeof $gameCharacterCreations.buildDataBitmapFaceThatIsCustom === 'function') return 'data';
    if (typeof $gameCharacterCreations.buildBitmapFaceThatIsCustom === 'function') return 'actor';
    return null;
};

//=============================================================================
// Sprite_TCGPortrait
//=============================================================================
function Sprite_TCGPortrait() { this.initialize.apply(this, arguments); }
Sprite_TCGPortrait.prototype = Object.create(Sprite.prototype);
Sprite_TCGPortrait.prototype.constructor = Sprite_TCGPortrait;
window.Sprite_TCGPortrait = Sprite_TCGPortrait;

Sprite_TCGPortrait.prototype.initialize = function(size, actorId) {
    Sprite.prototype.initialize.call(this);
    this._size = size || 40;
    this._actorId = actorId || null; // nur gesetzt, wenn es ein ECHTER lokaler Akteur ist (fuer den 'actor'-Modus)
    this._source = null;
    this._expression = 'neutral';
    this._ccBitmaps = {}; // Ausdruck -> gerenderte Bitmap (Cache, CC-Modus)
    this._sheetBitmap = null;
    this._pendingSheet = false;
    this.bitmap = new Bitmap(this._size, this._size);
};

// source: Rueckgabewert von TCG.resolvePortraitSource (oder null, um das
// Portraet auszublenden - z.B. wenn weder Character-Creator-Daten noch ein
// manuelles Sprite Sheet vorhanden sind).
// actorId: optional - nur setzen, wenn "source" von einem ECHTEN lokalen
// Akteur stammt (fuer den 'actor'-Ausdrucksmodus, siehe TCG.ccExpressionCapability).
Sprite_TCGPortrait.prototype.setSource = function(source, actorId) {
    var changed = JSON.stringify(source) !== JSON.stringify(this._source);
    this._source = source;
    this._actorId = actorId || null;
    if (!changed) return;
    this._ccBitmaps = {};
    this._ccRetriesLeft = 0;
    this._sheetBitmap = null;
    this._pendingSheet = false;
    this.bitmap.clear();
    this.visible = !!source;
    if (!source) return;

    if (source.mode === 'cc') {
        // Neutrales Basisgesicht sofort rendern - ABER: die einzelnen
        // Ausruestungsteil-Bilder laden asynchron, und Bitmap.snapSprite()
        // (im Character-Creator-Plugin) fotografiert einfach den GERADE
        // aktuellen Render-Zustand, ohne auf fertiges Laden zu warten. Der
        // erste Schnappschuss ist deshalb oft noch leer/unvollstaendig -
        // daher zusaetzlich ein paar Sekunden lang regelmaessig neu
        // schnappschiessen (siehe update()), bis alle Teile geladen sind.
        this._ccBitmaps.neutral = $gameCharacterCreations.buildBitmapFromInfo(source.faceInfo, 'face');
        this._ccRetriesLeft = 40;
        this._ccRetryTimer = 0;
        this.redraw();
    } else if (source.mode === 'sheet') {
        // img/faces (RPG-Maker-Standardordner fuer Gesichter), NICHT der
        // Karten-Artwork-Ordner - siehe ImageManager.loadFace.
        this._sheetBitmap = ImageManager.loadFace(source.path);
        if (this._sheetBitmap.isReady()) {
            this.redraw();
        } else {
            this._pendingSheet = true;
        }
    }
};

Sprite_TCGPortrait.prototype.setExpression = function(expr) {
    if (this._expression === expr) return;
    this._expression = expr;
    if (this._source) this.redraw();
};

// Rendert (und cacht) die Bitmap fuer den aktuell gesetzten Ausdruck im
// CC-Modus - nutzt je nach installierter Erweiterung entweder die daten-
// oder akteur-basierte Ueberschreibung (siehe TCG.ccExpressionCapability).
// Faellt lautlos auf 'neutral' zurueck, wenn nichts davon verfuegbar ist.
Sprite_TCGPortrait.prototype.ccBitmapForCurrentExpression = function() {
    if (this._ccBitmaps[this._expression]) return this._ccBitmaps[this._expression];
    if (this._expression === 'neutral') return this._ccBitmaps.neutral;

    var faceId = TCG.ccFaceIdFor(this._expression);
    if (!faceId) return this._ccBitmaps.neutral; // kein Override fuer diesen Ausdruck konfiguriert

    var capability = TCG.ccExpressionCapability();
    var bitmap = null;
    if (capability === 'data') {
        var overridden = $gameCharacterCreations.buildDataBitmapFaceThatIsCustom(this._source.faceInfo, faceId);
        if (overridden) bitmap = $gameCharacterCreations.buildBitmapFromInfo(overridden, 'face');
    } else if (capability === 'actor' && this._actorId) {
        bitmap = $gameCharacterCreations.buildBitmapFaceThatIsCustom(this._actorId, faceId);
    }
    this._ccBitmaps[this._expression] = bitmap || this._ccBitmaps.neutral;
    return this._ccBitmaps[this._expression];
};

Sprite_TCGPortrait.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (this._pendingSheet && this._sheetBitmap && this._sheetBitmap.isReady()) {
        this._pendingSheet = false;
        this.redraw();
    }
    if (this._ccRetriesLeft > 0 && this._source && this._source.mode === 'cc') {
        this._ccRetryTimer++;
        if (this._ccRetryTimer >= 10) { // ca. alle 1/6 Sekunde erneut versuchen
            this._ccRetryTimer = 0;
            this._ccRetriesLeft--;
            // Cache verwerfen (auch fuer bereits berechnete Ausdruecke - die
            // koennten vom selben unvollstaendigen Zustand betroffen sein)
            // und das Basisgesicht neu schnappschiessen.
            this._ccBitmaps = {};
            this._ccBitmaps.neutral = $gameCharacterCreations.buildBitmapFromInfo(this._source.faceInfo, 'face');
            this.redraw();
        }
    }
};

Sprite_TCGPortrait.prototype.redraw = function() {
    this.bitmap.clear();
    if (!this._source) return;
    if (this._source.mode === 'cc') {
        var ccBmp = this.ccBitmapForCurrentExpression();
        if (!ccBmp) return;
        var s = this._size;
        this.bitmap.blt(ccBmp, 0, 0, ccBmp.width, ccBmp.height, 0, 0, s, s);
    } else if (this._source.mode === 'sheet') {
        if (!this._sheetBitmap || !this._sheetBitmap.isReady()) return;
        var frameIndex = Math.max(0, TCG.PORTRAIT_EXPRESSIONS.indexOf(this._expression));
        var fw = this._sheetBitmap.width / TCG.PORTRAIT_EXPRESSIONS.length;
        var fh = this._sheetBitmap.height;
        this.bitmap.blt(this._sheetBitmap, frameIndex * fw, 0, fw, fh, 0, 0, this._size, this._size);
    }
};

})();
