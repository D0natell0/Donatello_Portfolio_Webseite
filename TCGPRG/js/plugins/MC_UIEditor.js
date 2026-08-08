//=============================================================================
// MC_UIEditor.js
//=============================================================================
/*:
 * @plugindesc v0.5.0 Live-UI-Editor: Elemente bearbeiten, stapeln, durch Bilder
 * ersetzen, Textstil aendern, Hover-Buttons, Gauges und dynamischer Text.
 * @author Donatello Media
 *
 * @param Hotkey
 * @desc Keycode zum Oeffnen/Schliessen des Editors. 121 = F10, 122 = F11.
 * @default 121
 *
 * @param LayoutFile
 * @desc Pfad der Layout-Datei, relativ zum Projektordner.
 * @default data/UILayout.json
 *
 * @param EditorPage
 * @desc Pfad der Editor-Seite, relativ zum Projektordner.
 * @default js/plugins/MC_UIEditor/editor.html
 *
 * @param ImageFolder
 * @desc Ordner fuer UI-Grafiken, relativ zum Projektordner. Mit Schraegstrich am Ende.
 * @default img/ui/
 *
 * @param FontFolder
 * @desc Ordner fuer Schriftdateien, relativ zum Projektordner.
 * @default fonts/
 *
 * @param GridSize
 * @desc Raster fuer den Drag-Modus in Pixeln. 1 = kein Raster.
 * @default 1
 *
 * @param HoverSe
 * @desc SE beim Ueberfahren eines Buttons. Leer lassen fuer keinen Ton.
 * @default Cursor1
 *
 * @param ClickSe
 * @desc SE beim Klick auf einen Button. Leer lassen fuer keinen Ton.
 * @default Ok1
 *
 * @help
 * ---------------------------------------------------------------------------
 * Installation
 * ---------------------------------------------------------------------------
 * 1. MC_UIEditor.js  ->  js/plugins/
 * 2. editor.html     ->  js/plugins/MC_UIEditor/editor.html
 * 3. Ordner img/ui/ anlegen und dort die UI-Grafiken ablegen (PNG).
 * 4. Plugin im Plugin-Manager aktivieren, Playtest starten, F10 druecken.
 *
 * ---------------------------------------------------------------------------
 * Reiter im Editor
 * ---------------------------------------------------------------------------
 * ELEMENT  Position, Groesse, Deckkraft, Skalierung, Ersatzgrafik und Textstil.
 *          Der Textstil greift in die Zeichenroutinen des Fensters ein und
 *          aendert Schrift, Groesse, Farbe, Kontur, Zeilenhoehe, Innenabstand
 *          und Ausrichtung des bereits vorhandenen Inhalts.
 *          Im Baum lassen sich Eintraege per Ziehen stapeln. Erlaubt ist das
 *          nur zwischen echten Geschwistern, also Fenster mit Fenstern und
 *          Sprites mit Sprites.
 * BUTTONS  Befehlsfenster durch Bild-Buttons mit vier Zustaenden ersetzen.
 * GAUGES   Animierte Balken aus Hintergrund, Fuellung und Rahmen.
 * TEXT     Dynamischer Text mit Schrift, Farbe, Kontur und Ausrichtung.
 * SZENE    Hintergrundbild unter allen Fenstern, Overlay darueber.
 *
 * ---------------------------------------------------------------------------
 * Ausdruecke
 * ---------------------------------------------------------------------------
 * Gauges binden an einen Ausdruck, der 0 bis 1 liefert.
 * Text arbeitet mit Vorlagen: alles in geschweiften Klammern wird ausgewertet.
 *
 *   {a.hp} / {a.mhp}
 *   Lv. {a.level}
 *   {a.name()}
 *   {Math.floor(v.value(3) / 10)} Splitter
 *
 * Verfuegbare Kuerzel in beiden Faellen:
 *   a  aktueller Actor (Menue: gewaehlter Actor, Kampf: aktiver, sonst Anfuehrer)
 *   p  $gameParty   v  $gameVariables   s  $gameSwitches   g  $gameSystem
 *
 * ---------------------------------------------------------------------------
 * Schriften
 * ---------------------------------------------------------------------------
 * Schriftdateien (ttf, otf, woff, woff2) in den Ordner fonts/ legen. Der Editor
 * listet sie automatisch. Beim Spielstart werden nur die tatsaechlich benutzten
 * Schriften registriert, das funktioniert auch im deployten Spiel.
 *
 * Dieses Plugin ergaenzt Bitmap um die Eigenschaft fontBold, die es in MV
 * standardmaessig nicht gibt. Andere Plugins bleiben davon unberuehrt.
 *
 * ---------------------------------------------------------------------------
 * Deployment
 * ---------------------------------------------------------------------------
 * Der Editor laeuft nur im Playtest. Im fertigen Spiel wird die Layout-Datei
 * gelesen und angewendet.
 *
 * Die Option "Nicht verwendete Dateien ausschliessen" kennt img/ui/ nicht und
 * entfernt den Ordner beim Deployen. Option abschalten oder Ordner danach von
 * Hand zurueckkopieren.
 * ---------------------------------------------------------------------------
 */

var Imported = Imported || {};
Imported.MC_UIEditor = '0.5.0';

var MCUI = MCUI || {};

(function() {
    'use strict';

    var params      = PluginManager.parameters('MC_UIEditor');
    var HOTKEY      = Number(params['Hotkey'] || 121);
    var FILE        = String(params['LayoutFile'] || 'data/UILayout.json');
    var EDITOR_URL  = String(params['EditorPage'] || 'js/plugins/MC_UIEditor/editor.html');
    var IMG_FOLDER  = String(params['ImageFolder'] || 'img/ui/');
    var FONT_FOLDER = String(params['FontFolder'] || 'fonts/');
    var GRID        = Math.max(1, Number(params['GridSize'] || 1));
    var HOVER_SE    = String(params['HoverSe'] || '');
    var CLICK_SE    = String(params['ClickSe'] || '');

    var HIDDEN = ['ScreenSprite', 'Sprite_Destination', 'Sprite_Timer'];
    var OPAQUE = ['Window_Base', 'Spriteset_Base', 'Sprite_Button', 'Tilemap'];

    //=========================================================================
    // Hilfsfunktionen
    //=========================================================================

    function className(obj) {
        return (obj && obj.constructor && obj.constructor.name) || 'Object';
    }

    function isA(obj, names) {
        for (var i = 0; i < names.length; i++) {
            var C = window[names[i]];
            if (C && obj instanceof C) return true;
        }
        return false;
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    ImageManager.loadUI = function(filename) {
        if (!filename) return ImageManager.loadEmptyBitmap();
        return this.loadBitmap(IMG_FOLDER, filename, 0, true);
    };

    function playSe(name) {
        if (!name) return;
        AudioManager.playStaticSe({ name: name, volume: 90, pitch: 100, pan: 0 });
    }

    // MV kennt kein fettes Bitmap-Font. Wir ergaenzen es vertraeglich.
    var _Bitmap_makeFontNameText = Bitmap.prototype._makeFontNameText;
    Bitmap.prototype._makeFontNameText = function() {
        if (this.fontBold) {
            return (this.fontItalic ? 'Italic ' : '') + 'Bold ' +
                   this.fontSize + 'px ' + this.fontFace;
        }
        return _Bitmap_makeFontNameText.call(this);
    };

    //=========================================================================
    // Ausdruecke auswerten
    //=========================================================================

    function contextActor() {
        var scene = SceneManager._scene;
        if (scene && scene._actor) return scene._actor;
        if (window.BattleManager && BattleManager.actor) {
            var a = BattleManager.actor();
            if (a) return a;
        }
        return window.$gameParty ? $gameParty.leader() : null;
    }

    var exprCache = {};

    function compile(expr) {
        if (!exprCache[expr]) {
            exprCache[expr] = new Function('a', 'p', 'v', 's', 'g', 'return (' + expr + ');');
        }
        return exprCache[expr];
    }

    function runExpression(expr) {
        var actor = contextActor();
        return compile(expr)(
            actor,
            window.$gameParty,
            window.$gameVariables,
            window.$gameSwitches,
            window.$gameSystem
        );
    }

    function evaluateRate(expr) {
        if (!expr) return 0;
        try {
            var result = runExpression(expr);
            if (typeof result !== 'number' || !isFinite(result)) return 0;
            return clamp(result, 0, 1);
        } catch (e) {
            return 0;
        }
    }

    function resolveTemplate(template) {
        if (!template) return '';
        return String(template).replace(/\{([^{}]+)\}/g, function(match, expr) {
            try {
                var result = runExpression(expr);
                return (result === undefined || result === null) ? '' : String(result);
            } catch (e) {
                return '?';
            }
        });
    }

    MCUI.resolveTemplate = resolveTemplate;

    //=========================================================================
    // Zeigerverfolgung  (MV kennt kein Hover, das bauen wir selbst)
    //=========================================================================

    MCUI.Pointer = { x: -1, y: -1, inside: false, enabled: !Utils.isMobileDevice() };

    function installPointer() {
        var canvas = Graphics._canvas;
        if (!canvas || canvas.__mcuiPointer) return;
        canvas.__mcuiPointer = true;

        document.addEventListener('mousemove', function(event) {
            MCUI.Pointer.x = Graphics.pageToCanvasX(event.pageX);
            MCUI.Pointer.y = Graphics.pageToCanvasY(event.pageY);
            MCUI.Pointer.inside = Graphics.isInsideCanvas(MCUI.Pointer.x, MCUI.Pointer.y);
        });
        document.addEventListener('mouseleave', function() {
            MCUI.Pointer.inside = false;
        });
    }

    //=========================================================================
    // Button mit vier Zustaenden
    //=========================================================================

    function MCUI_Button() {
        this.initialize.apply(this, arguments);
    }

    MCUI_Button.prototype = Object.create(Sprite.prototype);
    MCUI_Button.prototype.constructor = MCUI_Button;
    MCUI.Button = MCUI_Button;

    MCUI_Button.prototype.initialize = function(config) {
        Sprite.prototype.initialize.call(this);
        this._images = {};
        this._state = null;
        this._enabled = true;
        this._touching = false;
        this._wasHovered = false;
        this._clickHandler = null;
        this._hoverHandler = null;
        this.setImages(config || {});
    };

    MCUI_Button.prototype.setImages = function(config) {
        this._images = {
            normal:   config.normal   || '',
            hover:    config.hover    || config.normal || '',
            pressed:  config.pressed  || config.hover || config.normal || '',
            disabled: config.disabled || config.normal || ''
        };
        this._state = null;
        this.refreshState('normal');
    };

    MCUI_Button.prototype.setClickHandler = function(fn) { this._clickHandler = fn; };
    MCUI_Button.prototype.setHoverHandler = function(fn) { this._hoverHandler = fn; };
    MCUI_Button.prototype.setEnabled = function(v) { this._enabled = !!v; };

    MCUI_Button.prototype.refreshState = function(state) {
        if (this._state === state) return;
        this._state = state;
        var name = this._images[state];
        this.bitmap = name ? ImageManager.loadUI(name) : null;
    };

    MCUI_Button.prototype.isHovered = function() {
        if (!MCUI.Pointer.enabled || !MCUI.Pointer.inside) return false;
        return this.containsPoint(MCUI.Pointer.x, MCUI.Pointer.y);
    };

    MCUI_Button.prototype.containsPoint = function(x, y) {
        if (!this.bitmap || !this.visible || !this.worldVisible) return false;
        var b = this.getBounds();
        return x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height;
    };

    MCUI_Button.prototype.update = function() {
        Sprite.prototype.update.call(this);
        var hovered = this.isHovered();

        if (!this._enabled) {
            this.refreshState('disabled');
            this._touching = false;
            this._wasHovered = false;
            return;
        }

        if (hovered && !this._wasHovered) {
            playSe(HOVER_SE);
            if (this._hoverHandler) this._hoverHandler();
        }
        this._wasHovered = hovered;

        if (TouchInput.isTriggered() && this.containsPoint(TouchInput.x, TouchInput.y)) {
            this._touching = true;
        }
        if (this._touching && TouchInput.isReleased()) {
            this._touching = false;
            if (this.containsPoint(TouchInput.x, TouchInput.y)) {
                playSe(CLICK_SE);
                if (this._clickHandler) this._clickHandler();
            }
        }

        if (this._touching)   this.refreshState('pressed');
        else if (hovered)     this.refreshState('hover');
        else                  this.refreshState('normal');
    };

    //=========================================================================
    // Gauge aus drei Grafiken
    //=========================================================================

    function MCUI_Gauge() {
        this.initialize.apply(this, arguments);
    }

    MCUI_Gauge.prototype = Object.create(Sprite.prototype);
    MCUI_Gauge.prototype.constructor = MCUI_Gauge;
    MCUI.Gauge = MCUI_Gauge;

    MCUI_Gauge.prototype.initialize = function(config) {
        Sprite.prototype.initialize.call(this);
        this._back  = new Sprite();
        this._fill  = new Sprite();
        this._frame = new Sprite();
        this.addChild(this._back);
        this.addChild(this._fill);
        this.addChild(this._frame);
        this._display = 0;
        this._rate = 0;
        this.setConfig(config || {});
    };

    MCUI_Gauge.prototype.setConfig = function(config) {
        this._config = config;
        this._back.bitmap  = config.back  ? ImageManager.loadUI(config.back)  : null;
        this._frame.bitmap = config.frame ? ImageManager.loadUI(config.frame) : null;
        this._fill.bitmap  = config.fill  ? ImageManager.loadUI(config.fill)  : null;
        this._display = 0;
    };

    MCUI_Gauge.prototype.rate = function() { return this._rate; };
    MCUI_Gauge.prototype.displayRate = function() { return this._display; };

    MCUI_Gauge.prototype.update = function() {
        Sprite.prototype.update.call(this);
        var cfg = this._config;
        this._rate = evaluateRate(cfg.bind);

        var ease = cfg.ease === undefined ? 0.15 : Number(cfg.ease);
        if (ease >= 1) {
            this._display = this._rate;
        } else {
            this._display += (this._rate - this._display) * ease;
            if (Math.abs(this._rate - this._display) < 0.002) this._display = this._rate;
        }
        this.redraw();
    };

    MCUI_Gauge.prototype.redraw = function() {
        var bmp = this._fill.bitmap;
        if (!bmp || !bmp.isReady() || bmp.width <= 0) return;

        var bw = bmp.width;
        var bh = bmp.height;
        var r  = clamp(this._display, 0, 1);
        var mode = this._config.mode || 'fillDrain';
        var w, h;

        if (mode === 'verticalUp' || mode === 'verticalDown') {
            h = Math.round(bh * r);
            if (h <= 0) { this._fill.visible = false; return; }
            this._fill.visible = true;
            if (mode === 'verticalUp') {
                this._fill.setFrame(0, bh - h, bw, h);
                this._fill.x = 0;
                this._fill.y = bh - h;
            } else {
                this._fill.setFrame(0, 0, bw, h);
                this._fill.x = 0;
                this._fill.y = 0;
            }
        } else {
            w = Math.round(bw * r);
            if (w <= 0) { this._fill.visible = false; return; }
            this._fill.visible = true;
            if (mode === 'slideDrain') {
                this._fill.setFrame(bw - w, 0, w, bh);
                this._fill.x = bw - w;
                this._fill.y = 0;
            } else {
                this._fill.setFrame(0, 0, w, bh);
                this._fill.x = 0;
                this._fill.y = 0;
            }
        }
    };

    //=========================================================================
    // Dynamischer Text
    //=========================================================================

    var measureBitmap = null;

    function measurer() {
        if (!measureBitmap) measureBitmap = new Bitmap(1, 1);
        return measureBitmap;
    }

    function applyFont(bitmap, cfg) {
        bitmap.fontFace     = cfg.font || 'GameFont';
        bitmap.fontSize     = Number(cfg.size) || 24;
        bitmap.fontItalic   = !!cfg.italic;
        bitmap.fontBold     = !!cfg.bold;
        bitmap.textColor    = cfg.color || '#ffffff';
        bitmap.outlineColor = cfg.outlineColor || 'rgba(0, 0, 0, 0.5)';
        bitmap.outlineWidth = Number(cfg.outlineWidth) || 0;
    }

    function MCUI_Text() {
        this.initialize.apply(this, arguments);
    }

    MCUI_Text.prototype = Object.create(Sprite.prototype);
    MCUI_Text.prototype.constructor = MCUI_Text;
    MCUI.Text = MCUI_Text;

    MCUI_Text.prototype.initialize = function(config) {
        Sprite.prototype.initialize.call(this);
        this._config = config || {};
        this._lastText = null;
        this._lastStyle = null;
        this.refresh(true);
    };

    MCUI_Text.prototype.setConfig = function(config) {
        this._config = config || {};
        this.refresh(true);
    };

    MCUI_Text.prototype.styleKey = function() {
        var c = this._config;
        return [c.font, c.size, c.bold, c.italic, c.color, c.outlineColor,
                c.outlineWidth, c.align, c.width, c.lineSpacing].join('|');
    };

    MCUI_Text.prototype.currentText = function() {
        return resolveTemplate(this._config.text || '');
    };

    MCUI_Text.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.refresh(false);
    };

    MCUI_Text.prototype.refresh = function(force) {
        var text = this.currentText();
        var style = this.styleKey();
        if (!force && text === this._lastText && style === this._lastStyle) return;
        this._lastText = text;
        this._lastStyle = style;
        this.redraw(text);
    };

    MCUI_Text.prototype.redraw = function(text) {
        var cfg = this._config;
        var size = Number(cfg.size) || 24;
        var spacing = cfg.lineSpacing === undefined ? 8 : Number(cfg.lineSpacing);
        var lineHeight = size + spacing;
        var outline = Number(cfg.outlineWidth) || 0;
        var pad = Math.ceil(outline / 2) + 2;
        var lines = String(text).split('\n');

        var boxWidth = Number(cfg.width) || 0;
        if (!boxWidth) {
            var probe = measurer();
            applyFont(probe, cfg);
            var widest = 0;
            for (var i = 0; i < lines.length; i++) {
                widest = Math.max(widest, probe.measureTextWidth(lines[i]));
            }
            boxWidth = Math.ceil(widest) + 4;
        }

        var totalWidth  = Math.max(1, boxWidth + pad * 2);
        var totalHeight = Math.max(1, lines.length * lineHeight + pad * 2);

        if (!this.bitmap || this.bitmap.width !== totalWidth || this.bitmap.height !== totalHeight) {
            this.bitmap = new Bitmap(totalWidth, totalHeight);
        } else {
            this.bitmap.clear();
        }

        applyFont(this.bitmap, cfg);
        var align = cfg.align || 'left';
        for (var j = 0; j < lines.length; j++) {
            this.bitmap.drawText(lines[j], pad, pad + j * lineHeight,
                                 boxWidth, lineHeight, align);
        }

        this.opacity = cfg.opacity === undefined ? 255 : clamp(Number(cfg.opacity), 0, 255);
    };

    //=========================================================================
    // Datenmodell
    //=========================================================================

    MCUI.data = { version: 5, scenes: {} };

    function emptyScene() {
        return {
            background: null, overlay: null,
            elements: {}, gauges: [], texts: [], order: {}
        };
    }

    function migrate(parsed) {
        if (!parsed || !parsed.scenes) return { version: 5, scenes: {} };
        var version = parsed.version || 1;
        var out;

        if (version === 1) {
            out = { version: 5, scenes: {} };
            Object.keys(parsed.scenes).forEach(function(key) {
                out.scenes[key] = {
                    background: null, overlay: null,
                    elements: parsed.scenes[key] || {},
                    gauges: [], texts: [], order: {}
                };
            });
            return out;
        }

        parsed.version = 5;
        Object.keys(parsed.scenes).forEach(function(key) {
            var cfg = parsed.scenes[key];
            if (!cfg.elements) cfg.elements = {};
            if (!cfg.gauges) cfg.gauges = [];
            if (!cfg.texts) cfg.texts = [];
            if (!cfg.order) cfg.order = {};
        });
        return parsed;
    }

    MCUI.sceneKey = function() {
        return SceneManager._scene ? className(SceneManager._scene) : null;
    };

    MCUI.sceneConfig = function(create) {
        var key = MCUI.sceneKey();
        if (!key) return null;
        if (!MCUI.data.scenes[key] && create) MCUI.data.scenes[key] = emptyScene();
        var cfg = MCUI.data.scenes[key];
        if (cfg) {
            if (!cfg.gauges) cfg.gauges = [];
            if (!cfg.texts) cfg.texts = [];
            if (!cfg.order) cfg.order = {};
        }
        return cfg || null;
    };

    MCUI.elementConfig = function(elementKey, create) {
        var cfg = MCUI.sceneConfig(create);
        if (!cfg) return null;
        if (!cfg.elements) cfg.elements = {};
        if (!cfg.elements[elementKey] && create) cfg.elements[elementKey] = {};
        return cfg.elements[elementKey] || null;
    };

    MCUI.hasOverride = function(elementKey) {
        var cfg = MCUI.sceneConfig(false);
        return !!(cfg && cfg.elements && cfg.elements[elementKey]);
    };

    //=========================================================================
    // Schriften
    //=========================================================================

    MCUI.registerFonts = function() {
        if (!Graphics.loadFont) return;
        var seen = {};

        function register(entry) {
            if (!entry || !entry.font || !entry.fontFile || seen[entry.font]) return;
            seen[entry.font] = true;
            try {
                Graphics.loadFont(entry.font, FONT_FOLDER + entry.fontFile);
            } catch (e) {
                console.warn('MC_UIEditor: Schrift konnte nicht geladen werden: ' +
                             entry.font, e);
            }
        }

        Object.keys(MCUI.data.scenes).forEach(function(sceneKey) {
            var cfg = MCUI.data.scenes[sceneKey];
            (cfg.texts || []).forEach(register);
            Object.keys(cfg.elements || {}).forEach(function(key) {
                register(cfg.elements[key].style);
            });
        });
    };

    MCUI.listFonts = function() {
        if (!Utils.isNwjs()) return [];
        try {
            var fs   = require('fs');
            var path = require('path');
            var dir  = path.join(MCUI.projectPath(), FONT_FOLDER);
            if (!fs.existsSync(dir)) return [];
            return fs.readdirSync(dir)
                .filter(function(f) { return /\.(ttf|otf|woff2?)$/i.test(f); })
                .map(function(f) {
                    return { file: f, name: f.replace(/\.(ttf|otf|woff2?)$/i, '') };
                })
                .sort(function(a, b) { return a.name.localeCompare(b.name); });
        } catch (e) {
            return [];
        }
    };

    //=========================================================================
    // Laden und Speichern
    //=========================================================================

    MCUI._loaded = false;
    MCUI.dirty = false;

    MCUI.projectPath = function() {
        var path = require('path');
        try {
            return path.dirname(process.mainModule.filename);
        } catch (e) {
            var p = decodeURIComponent(window.location.pathname);
            return path.dirname(p.replace(/^\/([A-Za-z]:)/, '$1'));
        }
    };

    MCUI.loadLayout = function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', FILE + '?v=' + Date.now());
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                try {
                    MCUI.data = migrate(JSON.parse(xhr.responseText));
                    MCUI.registerFonts();
                } catch (e) {
                    console.warn('MC_UIEditor: Layout-Datei ist kein gueltiges JSON.', e);
                }
            }
            MCUI._loaded = true;
        };
        xhr.onerror = function() { MCUI._loaded = true; };
        xhr.send();
    };

    // NW.js 0.29 laeuft auf Node 9. Die Option { recursive: true } gibt es erst
    // ab Node 10.12 und wird hier stillschweigend ignoriert, weshalb mkdirSync
    // bei einem vorhandenen Ordner mit EEXIST abbricht. Also selbst anlegen.
    function ensureDir(dir) {
        var fs   = require('fs');
        var path = require('path');
        if (!dir || fs.existsSync(dir)) return;
        var parent = path.dirname(dir);
        if (parent && parent !== dir) ensureDir(parent);
        try {
            fs.mkdirSync(dir);
        } catch (e) {
            if (e.code !== 'EEXIST') throw e;
        }
    }

    MCUI.save = function() {
        if (!Utils.isNwjs()) return { ok: false, message: 'Speichern geht nur im Playtest.' };
        try {
            var fs   = require('fs');
            var path = require('path');
            var full = path.join(MCUI.projectPath(), FILE);
            ensureDir(path.dirname(full));
            fs.writeFileSync(full, JSON.stringify(MCUI.data, null, 2), 'utf8');
            MCUI.dirty = false;
            return { ok: true, message: 'Gespeichert: ' + FILE };
        } catch (e) {
            return { ok: false, message: 'Schreiben fehlgeschlagen: ' + e.message };
        }
    };

    MCUI.listImages = function() {
        if (!Utils.isNwjs()) return [];
        try {
            var fs   = require('fs');
            var path = require('path');
            var dir  = path.join(MCUI.projectPath(), IMG_FOLDER);
            if (!fs.existsSync(dir)) return [];
            return fs.readdirSync(dir)
                .filter(function(f) { return /\.png$/i.test(f); })
                .map(function(f) { return f.replace(/\.png$/i, ''); })
                .sort();
        } catch (e) {
            return [];
        }
    };

    //=========================================================================
    // Szenen-Scanner
    //=========================================================================

    MCUI.index = {};
    MCUI.order = [];

    MCUI.scan = function() {
        MCUI.index = {};
        MCUI.order = [];
        var scene = SceneManager._scene;
        if (!scene) return null;

        var root = { key: className(scene), cls: className(scene), isScene: true, children: [] };
        MCUI.index[root.key] = scene;
        walk(scene, root, 0);
        return root;
    };

    // Der Schluessel wird einmal pro Objekt vergeben und danach am Objekt
    // gespeichert. Sonst wuerde jedes Umsortieren im Baum alle Schluessel
    // verschieben und saemtliche Overrides ins Leere laufen lassen.
    function keyFor(parentNode, child, counts) {
        if (child.__mcuiKey) return child.__mcuiKey;
        var cls = className(child);
        counts[cls] = (counts[cls] || 0) + 1;
        var key = parentNode.key + '>' + cls + '[' + (counts[cls] - 1) + ']';
        while (MCUI.index[key]) key += '+';
        child.__mcuiKey = key;
        return key;
    }

    function walk(parent, parentNode, depth) {
        if (depth > 6 || !parent.children) return;
        var counts = {};

        for (var i = 0; i < parent.children.length; i++) {
            var child = parent.children[i];
            if (!child || child.__mcuiInternal) continue;

            var cls = className(child);
            if (HIDDEN.indexOf(cls) >= 0) continue;

            var key = keyFor(parentNode, child, counts);

            if (window.WindowLayer && child instanceof WindowLayer) {
                // Die Fensterebene selbst zeigen wir nicht an, brauchen sie aber
                // im Index, weil sie der echte Container ihrer Fenster ist.
                MCUI.index[key] = child;
                var pass = { key: key, cls: cls, children: [] };
                walk(child, pass, depth);
                Array.prototype.push.apply(parentNode.children, pass.children);
                continue;
            }

            var node = {
                key: key,
                parentKey: parentNode.key,
                cls: cls,
                isWindow: !!(window.Window_Base && child instanceof Window_Base),
                isCommand: !!(child._list && child._list.length),
                hasOverride: MCUI.hasOverride(key),
                children: []
            };
            MCUI.index[key] = child;
            MCUI.order.push(key);
            parentNode.children.push(node);

            if (!isA(child, OPAQUE)) walk(child, node, depth + 1);
        }
    }

    //=========================================================================
    // Stapelreihenfolge
    //=========================================================================

    // Jedes gelistete Kind wandert der Reihe nach ans Ende seines Containers.
    // Deckt die Liste alle Kinder ab, steht am Ende genau die gespeicherte
    // Reihenfolge; nicht gelistete Kinder bleiben davor.
    MCUI.applyOrder = function() {
        var cfg = MCUI.sceneConfig(false);
        if (!cfg || !cfg.order) return;

        Object.keys(cfg.order).forEach(function(containerKey) {
            var container = MCUI.index[containerKey];
            if (!container || !container.children) return;
            cfg.order[containerKey].forEach(function(childKey) {
                var child = MCUI.index[childKey];
                if (child && child.parent === container) {
                    container.setChildIndex(child, container.children.length - 1);
                }
            });
        });
    };

    MCUI.snapshot = function(key) {
        var obj = MCUI.index[key];
        if (!obj) return null;
        var cfg = MCUI.elementConfig(key, false) || {};
        var windowLike = isWindow(obj);
        var snap = {
            key: key,
            cls: className(obj),
            x: Math.round(obj.x),
            y: Math.round(obj.y),
            width: Math.round(obj.width || 0),
            height: Math.round(obj.height || 0),
            resizable: windowLike && typeof obj.move === 'function',
            visible: obj.visible !== false,
            opacity: obj.opacity !== undefined ? Math.round(obj.opacity) : 255,
            scaleX: obj.scale ? Number(obj.scale.x.toFixed(3)) : 1,
            scaleY: obj.scale ? Number(obj.scale.y.toFixed(3)) : 1,
            isWindow: windowLike,
            isCommand: !!(obj._list && obj._list.length),
            hasOverride: MCUI.hasOverride(key),
            skin: cfg.skin || '',
            buttonize: !!cfg.buttonize,
            style: cfg.style || null
        };
        if (windowLike) snap.contentsOpacity = Math.round(obj.contentsOpacity);
        return snap;
    };

    MCUI.commandList = function(key) {
        var obj = MCUI.index[key];
        if (!obj || !obj._list) return [];
        var cfg = MCUI.elementConfig(key, false) || {};
        var buttons = cfg.buttons || {};
        return obj._list.map(function(cmd, i) {
            var b = buttons[cmd.symbol] || {};
            return {
                symbol: cmd.symbol,
                name: cmd.name,
                index: i,
                enabled: cmd.enabled !== false,
                normal:   b.normal   || '',
                hover:    b.hover    || '',
                pressed:  b.pressed  || '',
                disabled: b.disabled || '',
                x: b.x !== undefined ? b.x : 0,
                y: b.y !== undefined ? b.y : 0
            };
        });
    };

    //=========================================================================
    // Overrides anwenden
    //=========================================================================

    function rememberOriginal(obj) {
        if (obj.__mcuiOrig) return;
        obj.__mcuiOrig = {
            x: obj.x, y: obj.y,
            width: obj.width, height: obj.height,
            visible: obj.visible,
            opacity: obj.opacity,
            contentsOpacity: obj.contentsOpacity,
            scaleX: obj.scale ? obj.scale.x : 1,
            scaleY: obj.scale ? obj.scale.y : 1
        };
    }

    //=========================================================================
    // Textstil vorhandener Fenster
    //=========================================================================

    var STYLE_METHODS = ['standardFontFace', 'standardFontSize', 'lineHeight',
                         'standardPadding', 'textPadding', 'normalColor', 'drawText'];

    function isWindow(obj) {
        return !!(obj && window.Window_Base && obj instanceof Window_Base);
    }

    function rebuildWindow(win) {
        try {
            if (typeof win.createContents === 'function') win.createContents();
            if (typeof win.refresh === 'function') win.refresh();
            if (typeof win.select === 'function' && typeof win.index === 'function') {
                win.select(win.index());
            }
        } catch (e) {
            console.warn('MC_UIEditor: Fenster liess sich nicht neu zeichnen.', e);
        }
    }

    MCUI.clearWindowStyle = function(win, silent) {
        if (!isWindow(win) || !win.__mcuiStyled) return;
        STYLE_METHODS.forEach(function(name) { delete win[name]; });
        if (win.__mcuiBaseReset) {
            win.resetFontSettings = win.__mcuiBaseReset;
            delete win.__mcuiBaseReset;
        } else {
            delete win.resetFontSettings;
        }
        delete win.__mcuiStyled;
        if (!silent) rebuildWindow(win);
    };

    MCUI.applyWindowStyle = function(win, style) {
        if (!isWindow(win)) return;
        MCUI.clearWindowStyle(win, true);
        if (!style || !Object.keys(style).length) { rebuildWindow(win); return; }

        win.__mcuiStyled = true;

        if (style.font) {
            win.standardFontFace = function() { return style.font; };
        }
        if (style.size !== undefined) {
            win.standardFontSize = function() { return Number(style.size); };
        }
        if (style.lineHeight !== undefined) {
            win.lineHeight = function() { return Number(style.lineHeight); };
        }
        if (style.padding !== undefined) {
            win.standardPadding = function() { return Number(style.padding); };
        }
        if (style.textPadding !== undefined) {
            win.textPadding = function() { return Number(style.textPadding); };
        }
        if (style.color) {
            win.normalColor = function() { return style.color; };
        }
        if (style.align) {
            // Erzwingt die Ausrichtung fuer alle drawText-Aufrufe des Fensters.
            // drawTextEx laeuft daran vorbei, dort bleibt es beim Original.
            win.drawText = function(text, x, y, maxWidth, align) {
                Window_Base.prototype.drawText.call(this, text, x, y, maxWidth,
                                                    style.align || align);
            };
        }

        win.__mcuiBaseReset = win.resetFontSettings;
        win.resetFontSettings = function() {
            win.__mcuiBaseReset.call(this);
            if (!this.contents) return;
            this.contents.fontBold = !!style.bold;
            this.contents.fontItalic = !!style.italic;
            if (style.outlineColor) this.contents.outlineColor = style.outlineColor;
            if (style.outlineWidth !== undefined) {
                this.contents.outlineWidth = Number(style.outlineWidth);
            }
        };

        rebuildWindow(win);
    };

    MCUI.resizeWindow = function(win, width, height) {
        if (typeof win.move !== 'function') return;
        var pad = typeof win.standardPadding === 'function' ? win.standardPadding() : 18;
        var minimum = pad * 2 + 8;
        var w = Math.max(minimum, Math.round(width));
        var h = Math.max(minimum, Math.round(height));
        if (win.width === w && win.height === h) return;

        win.move(win.x, win.y, w, h);
        try {
            if (typeof win.createContents === 'function') win.createContents();
            if (typeof win.refresh === 'function') win.refresh();
            if (typeof win.select === 'function' && typeof win.index === 'function') {
                win.select(win.index());
            }
            if (typeof win.updateCursor === 'function') win.updateCursor();
        } catch (e) {
            console.warn('MC_UIEditor: Neuaufbau nach Groessenaenderung fehlgeschlagen.', e);
        }
    };

    MCUI.applyProp = function(obj, prop, value) {
        rememberOriginal(obj);
        switch (prop) {
            case 'x':       obj.x = Math.round(value); break;
            case 'y':       obj.y = Math.round(value); break;
            case 'width':   MCUI.resizeWindow(obj, value, obj.height); break;
            case 'height':  MCUI.resizeWindow(obj, obj.width, value); break;
            case 'visible': obj.visible = !!value; break;
            case 'opacity': obj.opacity = clamp(Math.round(value), 0, 255); break;
            case 'contentsOpacity':
                if (obj.contentsOpacity !== undefined) {
                    obj.contentsOpacity = clamp(Math.round(value), 0, 255);
                }
                break;
            case 'scaleX': if (obj.scale) obj.scale.x = Number(value); break;
            case 'scaleY': if (obj.scale) obj.scale.y = Number(value); break;
        }
    };

    var TRANSFORM_PROPS = ['width', 'height', 'x', 'y', 'visible',
                           'opacity', 'contentsOpacity', 'scaleX', 'scaleY'];

    MCUI.applyAll = function() {
        MCUI.scan();
        var cfg = MCUI.sceneConfig(false);

        // Stil zuerst: er veraendert Innenabstand und Zeilenhoehe und damit auch
        // die Groesse, die anschliessend ueberschrieben werden darf.
        MCUI.order.forEach(function(key) {
            var obj = MCUI.index[key];
            if (!isWindow(obj)) return;
            var style = cfg && cfg.elements && cfg.elements[key]
                        ? cfg.elements[key].style : null;
            if (style && Object.keys(style).length) MCUI.applyWindowStyle(obj, style);
            else MCUI.clearWindowStyle(obj);
        });

        if (cfg && cfg.elements) {
            Object.keys(cfg.elements).forEach(function(key) {
                var obj = MCUI.index[key];
                if (!obj) return;
                var props = cfg.elements[key];
                TRANSFORM_PROPS.forEach(function(p) {
                    if (props[p] !== undefined) MCUI.applyProp(obj, p, props[p]);
                });
            });
        }

        MCUI.applyOrder();
        MCUI.buildLayers();
    };

    //=========================================================================
    // Bildlayer
    //=========================================================================

    MCUI.layerBack  = null;
    MCUI.layerFront = null;
    MCUI._skins     = [];
    MCUI._buttons   = [];
    MCUI._gauges    = [];
    MCUI._texts     = [];

    function makeLayer() {
        var c = new Sprite();
        c.__mcuiInternal = true;
        return c;
    }

    MCUI.buildLayers = function() {
        var scene = SceneManager._scene;
        if (!scene) return;

        MCUI._skins = [];
        MCUI._buttons = [];
        MCUI._gauges = [];
        MCUI._texts = [];

        if (MCUI.layerBack && MCUI.layerBack.parent) {
            MCUI.layerBack.parent.removeChild(MCUI.layerBack);
        }
        if (MCUI.layerFront && MCUI.layerFront.parent) {
            MCUI.layerFront.parent.removeChild(MCUI.layerFront);
        }

        MCUI.layerBack  = makeLayer();
        MCUI.layerFront = makeLayer();

        var wl = scene._windowLayer;
        if (wl && wl.parent === scene) {
            scene.addChildAt(MCUI.layerBack, scene.getChildIndex(wl));
        } else {
            scene.addChild(MCUI.layerBack);
        }
        scene.addChild(MCUI.layerFront);

        var cfg = MCUI.sceneConfig(false);
        if (!cfg) return;

        if (cfg.background) {
            var bg = new Sprite(ImageManager.loadUI(cfg.background));
            bg.__mcuiInternal = true;
            MCUI.layerBack.addChild(bg);
        }

        if (cfg.elements) {
            Object.keys(cfg.elements).forEach(function(key) {
                buildElementGraphics(key, cfg.elements[key]);
            });
        }

        (cfg.gauges || []).forEach(buildGauge);
        (cfg.texts || []).forEach(buildText);

        if (cfg.overlay) {
            var ov = new Sprite(ImageManager.loadUI(cfg.overlay));
            ov.__mcuiInternal = true;
            MCUI.layerFront.addChild(ov);
        }
    };

    function buildElementGraphics(key, props) {
        var target = MCUI.index[key];
        if (!target) return;

        if (props.skin) {
            rememberOriginal(target);
            target.opacity = 0;
            var skin = new Sprite(ImageManager.loadUI(props.skin));
            skin.__mcuiInternal = true;
            MCUI.layerBack.addChild(skin);
            MCUI._skins.push({ sprite: skin, target: target });
        }

        if (props.buttonize && target._list) {
            rememberOriginal(target);
            target.opacity = 0;
            target.contentsOpacity = 0;
            target.isTouchedInsideFrame = function() { return false; };

            var buttons = props.buttons || {};
            target._list.forEach(function(cmd, index) {
                var conf = buttons[cmd.symbol];
                if (!conf || !conf.normal) return;
                var btn = new MCUI_Button(conf);
                btn.__mcuiInternal = true;
                btn.x = conf.x || 0;
                btn.y = conf.y || 0;
                btn.setClickHandler(function() {
                    if (!target.active) return;
                    target.select(index);
                    target.processOk();
                });
                btn.setHoverHandler(function() {
                    if (target.active) target.select(index);
                });
                MCUI.layerFront.addChild(btn);
                MCUI._buttons.push({ button: btn, window: target, index: index });
            });
        }
    }

    function resolveParent(id) {
        if (!id) return null;
        if (MCUI.index[id]) return MCUI.index[id];
        for (var i = 0; i < MCUI._gauges.length; i++) {
            if (MCUI._gauges[i].config.id === id) return MCUI._gauges[i].gauge;
        }
        return null;
    }

    function buildGauge(config) {
        if (!config || !config.fill) return;
        var gauge = new MCUI_Gauge(config);
        gauge.__mcuiInternal = true;
        gauge.x = config.x || 0;
        gauge.y = config.y || 0;

        var layer = (config.layer === 'back') ? MCUI.layerBack : MCUI.layerFront;
        layer.addChild(gauge);
        MCUI._gauges.push({ gauge: gauge, config: config, parent: resolveParent(config.parent) });
    }

    function buildText(config) {
        if (!config || !config.text) return;
        var sprite = new MCUI_Text(config);
        sprite.__mcuiInternal = true;
        sprite.x = config.x || 0;
        sprite.y = config.y || 0;

        var layer = (config.layer === 'back') ? MCUI.layerBack : MCUI.layerFront;
        layer.addChild(sprite);
        MCUI._texts.push({ sprite: sprite, config: config, parent: resolveParent(config.parent) });
    }

    function followParent(entry) {
        if (!entry.parent) return;
        entry.sprite.x = entry.parent.x + (entry.config.x || 0);
        entry.sprite.y = entry.parent.y + (entry.config.y || 0);
        if (entry.parent.openness !== undefined) {
            entry.sprite.visible = entry.parent.visible && entry.parent.openness > 0;
        } else {
            entry.sprite.visible = entry.parent.visible;
        }
    }

    MCUI.updateLayers = function() {
        var i;
        for (i = 0; i < MCUI._skins.length; i++) {
            var s = MCUI._skins[i];
            s.sprite.x = s.target.x;
            s.sprite.y = s.target.y;
            s.sprite.visible = s.target.visible && s.target.openness > 0;
        }
        for (i = 0; i < MCUI._buttons.length; i++) {
            var b = MCUI._buttons[i];
            var win = b.window;
            b.button.visible = win.visible && win.openness >= 255;
            b.button.setEnabled(win.isCommandEnabled ? win.isCommandEnabled(b.index) : true);
            if (win._windowCursorSprite) win._windowCursorSprite.visible = false;
        }
        for (i = 0; i < MCUI._gauges.length; i++) {
            var g = MCUI._gauges[i];
            followParent({ sprite: g.gauge, config: g.config, parent: g.parent });
        }
        for (i = 0; i < MCUI._texts.length; i++) {
            followParent(MCUI._texts[i]);
        }
    };

    //=========================================================================
    // API fuer das Editor-Fenster
    //=========================================================================

    MCUI.selectedKey = null;
    MCUI.dragEnabled = true;
    MCUI.grid = GRID;
    MCUI.win = null;

    MCUI.isAvailable = function() {
        return Utils.isNwjs() && Utils.isOptionValid('test');
    };

    function findInList(listName, id) {
        var cfg = MCUI.sceneConfig(false);
        if (!cfg) return null;
        var list = cfg[listName] || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function liveGauge(id) {
        for (var i = 0; i < MCUI._gauges.length; i++) {
            if (MCUI._gauges[i].config.id === id) return MCUI._gauges[i].gauge;
        }
        return null;
    }

    function liveText(id) {
        for (var i = 0; i < MCUI._texts.length; i++) {
            if (MCUI._texts[i].config.id === id) return MCUI._texts[i].sprite;
        }
        return null;
    }

    MCUI.host = {

        tree: function() { return JSON.stringify(MCUI.scan()); },

        images: function() { return JSON.stringify(MCUI.listImages()); },

        fonts: function() { return JSON.stringify(MCUI.listFonts()); },

        imageFolder: function() { return IMG_FOLDER; },

        elementKeys: function() {
            var cfg = MCUI.sceneConfig(false);
            return JSON.stringify({
                elements: MCUI.order.map(function(key) {
                    return { key: key, cls: className(MCUI.index[key]) };
                }),
                gauges: ((cfg && cfg.gauges) || []).map(function(g) {
                    return { key: g.id, cls: g.name || 'Gauge' };
                })
            });
        },

        snapshot: function(key) {
            var s = MCUI.snapshot(key);
            return s ? JSON.stringify(s) : null;
        },

        commands: function(key) { return JSON.stringify(MCUI.commandList(key)); },

        scene: function() {
            var cfg = MCUI.sceneConfig(false) || {};
            return JSON.stringify({
                key: MCUI.sceneKey(),
                background: cfg.background || '',
                overlay: cfg.overlay || ''
            });
        },

        select: function(key) {
            MCUI.selectedKey = MCUI.index[key] ? key : null;
        },

        setProp: function(key, prop, value) {
            var obj = MCUI.index[key];
            if (!obj) return false;
            MCUI.applyProp(obj, prop, value);
            var cfg = MCUI.elementConfig(key, true);
            cfg[prop] = (prop === 'visible') ? !!value : Number(value);
            MCUI.dirty = true;
            return true;
        },

        setOrder: function(containerKey, keysJson) {
            var container = MCUI.index[containerKey];
            if (!container) return false;
            var keys;
            try { keys = JSON.parse(keysJson); } catch (e) { return false; }
            if (!Array.isArray(keys)) return false;

            var cfg = MCUI.sceneConfig(true);
            if (!cfg.order) cfg.order = {};
            cfg.order[containerKey] = keys;
            MCUI.dirty = true;
            MCUI.applyOrder();
            return true;
        },

        setStyle: function(key, prop, value) {
            var cfg = MCUI.elementConfig(key, true);
            if (!cfg.style) cfg.style = {};

            var numeric = ['size', 'outlineWidth', 'lineHeight', 'padding', 'textPadding'];
            var boolean = ['bold', 'italic'];

            if (value === '' || value === null || value === undefined) {
                delete cfg.style[prop];
            } else if (numeric.indexOf(prop) >= 0) {
                cfg.style[prop] = Number(value);
            } else if (boolean.indexOf(prop) >= 0) {
                cfg.style[prop] = !!value;
            } else {
                cfg.style[prop] = value;
            }

            if (!Object.keys(cfg.style).length) delete cfg.style;
            MCUI.dirty = true;
            MCUI.rebuild();
            return true;
        },

        setStyleFont: function(key, name, file) {
            var cfg = MCUI.elementConfig(key, true);
            if (!cfg.style) cfg.style = {};
            if (!name || name === 'GameFont') {
                delete cfg.style.font;
                delete cfg.style.fontFile;
            } else {
                cfg.style.font = name;
                cfg.style.fontFile = file || '';
            }
            if (!Object.keys(cfg.style).length) delete cfg.style;
            MCUI.registerFonts();
            MCUI.dirty = true;
            MCUI.rebuild();
            return true;
        },

        clearStyle: function(key) {
            var cfg = MCUI.elementConfig(key, false);
            if (cfg) delete cfg.style;
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        setSkin: function(key, image) {
            var cfg = MCUI.elementConfig(key, true);
            if (image) cfg.skin = image; else delete cfg.skin;
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        setButtonize: function(key, value) {
            var cfg = MCUI.elementConfig(key, true);
            cfg.buttonize = !!value;
            if (!cfg.buttonize) {
                var obj = MCUI.index[key];
                if (obj && obj.__mcuiOrig) {
                    obj.opacity = obj.__mcuiOrig.opacity;
                    obj.contentsOpacity = obj.__mcuiOrig.contentsOpacity;
                    delete obj.isTouchedInsideFrame;
                }
            }
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        setButton: function(key, symbol, prop, value) {
            var cfg = MCUI.elementConfig(key, true);
            if (!cfg.buttons) cfg.buttons = {};
            if (!cfg.buttons[symbol]) cfg.buttons[symbol] = {};
            if (prop === 'x' || prop === 'y') cfg.buttons[symbol][prop] = Number(value);
            else if (value) cfg.buttons[symbol][prop] = String(value);
            else delete cfg.buttons[symbol][prop];
            MCUI.dirty = true;
            MCUI.rebuild();
            return true;
        },

        nudgeButton: function(key, symbol, dx, dy) {
            var cfg = MCUI.elementConfig(key, true);
            if (!cfg.buttons || !cfg.buttons[symbol]) return;
            var b = cfg.buttons[symbol];
            b.x = (b.x || 0) + Number(dx);
            b.y = (b.y || 0) + Number(dy);
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        setSceneImage: function(prop, image) {
            var cfg = MCUI.sceneConfig(true);
            cfg[prop] = image || null;
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        // ---- Gauges ----

        gauges: function() {
            var cfg = MCUI.sceneConfig(false);
            var list = (cfg && cfg.gauges) || [];
            return JSON.stringify(list.map(function(g) {
                var live = liveGauge(g.id);
                return {
                    id: g.id,
                    name: g.name || 'Gauge',
                    x: g.x || 0, y: g.y || 0,
                    back: g.back || '', fill: g.fill || '', frame: g.frame || '',
                    mode: g.mode || 'fillDrain',
                    bind: g.bind || '',
                    ease: g.ease === undefined ? 0.15 : g.ease,
                    layer: g.layer || 'front',
                    parent: g.parent || '',
                    value: live ? Math.round(live.rate() * 100) : null
                };
            }));
        },

        addGauge: function() {
            var cfg = MCUI.sceneConfig(true);
            var id = 'g' + Date.now().toString(36);
            cfg.gauges.push({
                id: id, name: 'Gauge ' + (cfg.gauges.length + 1),
                x: 20, y: 20,
                back: '', fill: '', frame: '',
                mode: 'fillDrain',
                bind: 'a.hp / a.mhp',
                ease: 0.15, layer: 'front', parent: null
            });
            MCUI.dirty = true;
            MCUI.rebuild();
            return id;
        },

        removeGauge: function(id) {
            var cfg = MCUI.sceneConfig(false);
            if (!cfg) return;
            cfg.gauges = cfg.gauges.filter(function(g) { return g.id !== id; });
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        setGauge: function(id, prop, value) {
            var g = findInList('gauges', id);
            if (!g) return false;
            if (prop === 'x' || prop === 'y' || prop === 'ease') g[prop] = Number(value);
            else if (prop === 'parent') g[prop] = value || null;
            else g[prop] = value;
            MCUI.dirty = true;
            MCUI.rebuild();
            return true;
        },

        nudgeGauge: function(id, dx, dy) {
            var g = findInList('gauges', id);
            if (!g) return;
            g.x = (g.x || 0) + Number(dx);
            g.y = (g.y || 0) + Number(dy);
            MCUI.dirty = true;
            var live = liveGauge(id);
            if (live && !g.parent) { live.x = g.x; live.y = g.y; }
            else MCUI.rebuild();
        },

        // ---- Text ----

        texts: function() {
            var cfg = MCUI.sceneConfig(false);
            var list = (cfg && cfg.texts) || [];
            return JSON.stringify(list.map(function(t) {
                var live = liveText(t.id);
                return {
                    id: t.id,
                    name: t.name || 'Text',
                    text: t.text || '',
                    x: t.x || 0, y: t.y || 0,
                    font: t.font || 'GameFont',
                    fontFile: t.fontFile || '',
                    size: t.size === undefined ? 24 : t.size,
                    bold: !!t.bold,
                    italic: !!t.italic,
                    color: t.color || '#ffffff',
                    outlineColor: t.outlineColor || 'rgba(0, 0, 0, 0.5)',
                    outlineWidth: t.outlineWidth === undefined ? 4 : t.outlineWidth,
                    align: t.align || 'left',
                    width: t.width || 0,
                    lineSpacing: t.lineSpacing === undefined ? 8 : t.lineSpacing,
                    opacity: t.opacity === undefined ? 255 : t.opacity,
                    layer: t.layer || 'front',
                    parent: t.parent || '',
                    resolved: live ? live.currentText() : resolveTemplate(t.text || '')
                };
            }));
        },

        addText: function() {
            var cfg = MCUI.sceneConfig(true);
            var id = 't' + Date.now().toString(36);
            cfg.texts.push({
                id: id, name: 'Text ' + (cfg.texts.length + 1),
                text: '{a.hp} / {a.mhp}',
                x: 20, y: 20,
                font: 'GameFont', fontFile: '',
                size: 24, bold: false, italic: false,
                color: '#ffffff',
                outlineColor: 'rgba(0, 0, 0, 0.5)',
                outlineWidth: 4,
                align: 'left', width: 0, lineSpacing: 8,
                opacity: 255, layer: 'front', parent: null
            });
            MCUI.dirty = true;
            MCUI.rebuild();
            return id;
        },

        removeText: function(id) {
            var cfg = MCUI.sceneConfig(false);
            if (!cfg) return;
            cfg.texts = cfg.texts.filter(function(t) { return t.id !== id; });
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        setText: function(id, prop, value) {
            var t = findInList('texts', id);
            if (!t) return false;
            var numeric = ['x', 'y', 'size', 'outlineWidth', 'width', 'lineSpacing', 'opacity'];
            var boolean = ['bold', 'italic'];
            if (numeric.indexOf(prop) >= 0) t[prop] = Number(value);
            else if (boolean.indexOf(prop) >= 0) t[prop] = !!value;
            else if (prop === 'parent') t[prop] = value || null;
            else t[prop] = value;

            if (prop === 'font' || prop === 'fontFile') MCUI.registerFonts();
            MCUI.dirty = true;
            MCUI.rebuild();
            return true;
        },

        setTextFont: function(id, name, file) {
            var t = findInList('texts', id);
            if (!t) return false;
            t.font = name || 'GameFont';
            t.fontFile = file || '';
            MCUI.registerFonts();
            MCUI.dirty = true;
            MCUI.rebuild();
            return true;
        },

        nudgeText: function(id, dx, dy) {
            var t = findInList('texts', id);
            if (!t) return;
            t.x = (t.x || 0) + Number(dx);
            t.y = (t.y || 0) + Number(dy);
            MCUI.dirty = true;
            var live = liveText(id);
            if (live && !t.parent) { live.x = t.x; live.y = t.y; }
            else MCUI.rebuild();
        },

        // ---- Pruefen ----

        testBinding: function(expr) {
            try {
                var actor = contextActor();
                if (!actor) return JSON.stringify({ ok: false, message: 'Kein Actor verfügbar.' });
                var result = runExpression(expr);
                if (typeof result !== 'number' || !isFinite(result)) {
                    return JSON.stringify({ ok: false, message: 'Ergebnis ist keine Zahl.' });
                }
                return JSON.stringify({
                    ok: true,
                    message: 'Aktueller Wert: ' + Math.round(clamp(result, 0, 1) * 100) + ' %'
                });
            } catch (e) {
                return JSON.stringify({ ok: false, message: e.message });
            }
        },

        testTemplate: function(template) {
            var resolved = resolveTemplate(template);
            var ok = resolved.indexOf('?') < 0 || template.indexOf('?') >= 0;
            return JSON.stringify({
                ok: ok,
                message: ok ? 'Ergibt: ' + resolved
                            : 'Mindestens ein Ausdruck ließ sich nicht auswerten: ' + resolved
            });
        },

        // ---- Zuruecksetzen ----

        resetElement: function(key) {
            var obj = MCUI.index[key];
            MCUI.clearWindowStyle(obj, true);
            if (obj && obj.__mcuiOrig) {
                var o = obj.__mcuiOrig;
                if (o.width !== undefined && typeof obj.move === 'function') {
                    MCUI.resizeWindow(obj, o.width, o.height);
                }
                obj.x = o.x;
                obj.y = o.y;
                obj.visible = o.visible;
                if (o.opacity !== undefined) obj.opacity = o.opacity;
                if (o.contentsOpacity !== undefined) obj.contentsOpacity = o.contentsOpacity;
                if (obj.scale) { obj.scale.x = o.scaleX; obj.scale.y = o.scaleY; }
                delete obj.isTouchedInsideFrame;
            }
            var cfg = MCUI.sceneConfig(false);
            if (cfg && cfg.elements) delete cfg.elements[key];
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        resetScene: function() {
            var cfg = MCUI.sceneConfig(false);
            if (cfg && cfg.elements) {
                Object.keys(cfg.elements).forEach(function(k) { MCUI.host.resetElement(k); });
            }
            delete MCUI.data.scenes[MCUI.sceneKey()];
            MCUI.dirty = true;
            MCUI.rebuild();
        },

        save: function() { return JSON.stringify(MCUI.save()); },

        status: function() {
            return JSON.stringify({
                scene: MCUI.sceneKey(),
                dirty: MCUI.dirty,
                selected: MCUI.selectedKey,
                file: FILE
            });
        },

        setDragEnabled: function(v) { MCUI.dragEnabled = !!v; },
        setGrid: function(v) { MCUI.grid = Math.max(1, Number(v) || 1); }
    };

    MCUI.rebuild = function() {
        var keep = MCUI.selectedKey;
        MCUI.applyAll();
        MCUI.selectedKey = MCUI.index[keep] ? keep : null;
    };

    //=========================================================================
    // Editor-Fenster
    //=========================================================================

    MCUI.openEditor = function() {
        if (!MCUI.isAvailable()) return;
        if (MCUI.win) {
            try { MCUI.win.focus(); return; } catch (e) { MCUI.win = null; }
        }
        nw.Window.open(EDITOR_URL, {
            width: 520, height: 920, frame: true, id: 'mcui_editor'
        }, function(win) {
            MCUI.win = win;
            var attach = function() {
                try {
                    win.window.MCUI_HOST = MCUI.host;
                    if (typeof win.window.MCUI_boot === 'function') win.window.MCUI_boot();
                } catch (e) { /* Seite laedt noch */ }
            };
            attach();
            win.on('loaded', attach);
            win.on('closed', function() {
                MCUI.win = null;
                MCUI.selectedKey = null;
                hideOutline();
            });
        });
    };

    MCUI.closeEditor = function() {
        if (MCUI.win) { try { MCUI.win.close(true); } catch (e) {} }
        MCUI.win = null;
        MCUI.selectedKey = null;
        hideOutline();
    };

    MCUI.toggleEditor = function() {
        if (MCUI.win) MCUI.closeEditor(); else MCUI.openEditor();
    };

    function notify(fnName, arg) {
        if (!MCUI.win) return;
        try {
            var fn = MCUI.win.window[fnName];
            if (typeof fn === 'function') fn(arg);
        } catch (e) { /* Fenster geschlossen */ }
    }

    //=========================================================================
    // Auswahl-Rahmen als DOM-Overlay
    //=========================================================================

    var outline = null;

    function ensureOutline() {
        if (outline) return outline;
        outline = document.createElement('div');
        outline.style.cssText = [
            'position:fixed', 'pointer-events:none',
            'border:1px solid #4da3ff',
            'box-shadow:0 0 0 1px rgba(0,0,0,.6)',
            'background:rgba(77,163,255,.08)',
            'z-index:9999', 'display:none'
        ].join(';');
        document.body.appendChild(outline);
        return outline;
    }

    function hideOutline() {
        if (outline) outline.style.display = 'none';
    }

    function updateOutline() {
        if (!MCUI.win || !MCUI.selectedKey) { hideOutline(); return; }
        var obj = MCUI.index[MCUI.selectedKey];
        var canvas = Graphics._canvas;
        if (!obj || !canvas || !obj.visible || !obj.worldVisible) { hideOutline(); return; }

        var b = obj.getBounds();
        var r = canvas.getBoundingClientRect();
        var sx = r.width / Graphics.width;
        var sy = r.height / Graphics.height;

        var el = ensureOutline();
        el.style.display = 'block';
        el.style.left   = (r.left + b.x * sx) + 'px';
        el.style.top    = (r.top  + b.y * sy) + 'px';
        el.style.width  = Math.max(1, b.width  * sx) + 'px';
        el.style.height = Math.max(1, b.height * sy) + 'px';
    }

    //=========================================================================
    // Ziehen im Spielfenster
    //=========================================================================

    var drag = null;

    function canvasPoint(event) {
        return {
            x: Graphics.pageToCanvasX(event.pageX),
            y: Graphics.pageToCanvasY(event.pageY)
        };
    }

    function pickAt(x, y) {
        for (var i = MCUI.order.length - 1; i >= 0; i--) {
            var key = MCUI.order[i];
            var obj = MCUI.index[key];
            if (!obj || !obj.visible || !obj.worldVisible) continue;
            var b = obj.getBounds();
            if (b.width <= 0 || b.height <= 0) continue;
            if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) return key;
        }
        return null;
    }

    function snap(v) { return Math.round(v / MCUI.grid) * MCUI.grid; }

    function onCanvasMouseDown(event) {
        if (!MCUI.win || !MCUI.dragEnabled || event.button !== 0) return;
        var p = canvasPoint(event);
        var key = pickAt(p.x, p.y);
        if (!key) return;
        event.preventDefault();
        event.stopPropagation();

        var obj = MCUI.index[key];
        MCUI.selectedKey = key;
        notify('MCUI_onSelect', key);

        if (event.altKey && typeof obj.move === 'function') {
            drag = { key: key, mode: 'resize', startX: p.x, startY: p.y,
                     baseW: obj.width, baseH: obj.height };
        } else {
            drag = { key: key, mode: 'move', offsetX: p.x - obj.x, offsetY: p.y - obj.y };
        }
    }

    function onCanvasMouseMove(event) {
        if (!drag) return;
        event.preventDefault();
        event.stopPropagation();
        var p = canvasPoint(event);

        if (drag.mode === 'resize') {
            MCUI.host.setProp(drag.key, 'width',  snap(drag.baseW + (p.x - drag.startX)));
            MCUI.host.setProp(drag.key, 'height', snap(drag.baseH + (p.y - drag.startY)));
        } else {
            MCUI.host.setProp(drag.key, 'x', snap(p.x - drag.offsetX));
            MCUI.host.setProp(drag.key, 'y', snap(p.y - drag.offsetY));
        }
        notify('MCUI_onSelect', drag.key);
    }

    function onCanvasMouseUp(event) {
        if (!drag) return;
        event.preventDefault();
        event.stopPropagation();
        drag = null;
    }

    function installDrag() {
        var canvas = Graphics._canvas;
        if (!canvas || canvas.__mcuiDrag) return;
        canvas.__mcuiDrag = true;
        canvas.addEventListener('mousedown', onCanvasMouseDown);
        canvas.addEventListener('mousemove', onCanvasMouseMove);
        canvas.addEventListener('mouseup',   onCanvasMouseUp);
    }

    //=========================================================================
    // Hooks
    //=========================================================================

    var _DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        _DataManager_loadDatabase.call(this);
        MCUI.loadLayout();
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        return _DataManager_isDatabaseLoaded.call(this) && MCUI._loaded;
    };

    var _Scene_Base_start = Scene_Base.prototype.start;
    Scene_Base.prototype.start = function() {
        _Scene_Base_start.call(this);
        installPointer();
        MCUI.applyAll();
        MCUI.selectedKey = null;
        notify('MCUI_onSceneChanged');
    };

    var _Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _Scene_Base_update.call(this);
        MCUI.updateLayers();
        if (MCUI.isAvailable()) {
            installDrag();
            updateOutline();
        }
    };

    var _Scene_Base_terminate = Scene_Base.prototype.terminate;
    Scene_Base.prototype.terminate = function() {
        MCUI._skins = [];
        MCUI._buttons = [];
        MCUI._gauges = [];
        MCUI._texts = [];
        MCUI.layerBack = null;
        MCUI.layerFront = null;
        _Scene_Base_terminate.call(this);
    };

    if (MCUI.isAvailable()) {
        document.addEventListener('keydown', function(event) {
            if (event.keyCode === HOTKEY) {
                event.preventDefault();
                MCUI.toggleEditor();
            }
        });
    }

})();
