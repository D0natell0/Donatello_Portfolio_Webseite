//=============================================================================
// TCG_Menus.js
//-----------------------------------------------------------------------------
// TCG-Menues fuer RPG Maker MV
// Deck Builder (Sammlung + aktives Deck), Booster-Shop, Booster-Opening.
// Benoetigt: TCG_Core.js (davor laden)
//=============================================================================
/*:
 * @plugindesc v1.0 TCG-Menues: Deck Builder, Booster Shop, Booster-Opening (nach TCG_Core laden)
 * @author Donatello Media
 *
 * @param MenuEintrag
 * @desc Name des Eintrags im Hauptmenue. Leer lassen = kein Menueeintrag.
 * @default Karten
 *
 * @help
 * ============================================================================
 * TCG_Menus.js - Menuesystem
 * ============================================================================
 * PLUGIN-BEFEHLE:
 *   TCG Menu           Oeffnet das TCG-Menue (aktuell nur: Deck Builder)
 *   TCG DeckBuilder    Oeffnet direkt den Deck Builder
 *   TCG Shop           Oeffnet direkt den Booster-Shop (NICHT ueber das
 *                       Menue erreichbar - bewusst nur per Plugin-Befehl,
 *                       z.B. an einen NPC/Shop-Event gebunden)
 *
 * DECK BUILDER:
 *   - Links:  Deine Sammlung (Anzahl im Besitz / bereits im Deck)
 *   - Rechts: Das gewaehlte Deck
 *   - OK in der Sammlung fuegt eine Kopie hinzu, OK im Deck entfernt eine.
 *   - Wechsel zwischen den Spalten: Pfeiltasten links/rechts, Q/W oder Klick.
 *   - Decks werden automatisch gespeichert.
 *   - "Als aktiv waehlen" bestimmt das Deck fuer Kartenduelle.
 *   - Deckgroesse: DeckMinimum bis DeckMaximum (TCG_Core), MaxKopien pro Karte.
 *
 * BOOSTER SHOP:
 *   - Zeigt alle freigeschalteten Booster (freischaltSchalter in TCG_Core,
 *     per Schalter im Spielverlauf freischaltbar).
 *   - Bezahlt wird mit Gold. Nach dem Kauf startet die Opening-Sequenz:
 *     Karten liegen verdeckt und werden per OK/Klick nacheinander aufgedeckt.
 */

var TCG = TCG || {};
TCG.Menus = TCG.Menus || {};

(function() {
'use strict';

var raw = PluginManager.parameters('TCG_Menus');
TCG.Menus.menuLabel = String(raw['MenuEintrag'] || '').trim();

//=============================================================================
// Hauptmenue-Integration
//=============================================================================
if (TCG.Menus.menuLabel) {
    var _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _Window_MenuCommand_addOriginalCommands.call(this);
        this.addCommand(TCG.Menus.menuLabel, 'tcgMenu', true);
    };

    var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler('tcgMenu', function() {
            SceneManager.push(Scene_TCGMenu);
        });
    };
}

//=============================================================================
// Scene_TCGMenu - Auswahl zwischen Deck Builder und Booster Shop
//=============================================================================
function Scene_TCGMenu() { this.initialize.apply(this, arguments); }
window.Scene_TCGMenu = Scene_TCGMenu;

Scene_TCGMenu.prototype = Object.create(Scene_MenuBase.prototype);
Scene_TCGMenu.prototype.constructor = Scene_TCGMenu;

function Window_TCGMenuCommand() { this.initialize.apply(this, arguments); }
Window_TCGMenuCommand.prototype = Object.create(Window_Command.prototype);
Window_TCGMenuCommand.prototype.constructor = Window_TCGMenuCommand;

Window_TCGMenuCommand.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.x = (Graphics.boxWidth - this.width) / 2;
    this.y = (Graphics.boxHeight - this.height) / 2;
    this.select(0);
};

Window_TCGMenuCommand.prototype.windowWidth = function() { return 300; };

Window_TCGMenuCommand.prototype.makeCommandList = function() {
    this.addCommand('Deck Builder', 'deck');
    // "Booster Shop" bewusst NICHT hier - nur noch ueber den Plugin-Befehl
    // "TCG Shop" direkt erreichbar (siehe To-do-Liste).
    this.addCommand('Zurueck', 'cancel');
};

Scene_TCGMenu.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    var win = new Window_TCGMenuCommand();
    win.setHandler('deck',   function() { SceneManager.push(Scene_TCGDeckBuilder); });
    win.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(win);
    this._commandWindow = win;
};

//=============================================================================
// Deck Builder
//=============================================================================

//--- Deckliste (Auswahl / Neu / Loeschen) -------------------------------------
function Window_TCGDeckSlots() { this.initialize.apply(this, arguments); }
Window_TCGDeckSlots.prototype = Object.create(Window_Selectable.prototype);
Window_TCGDeckSlots.prototype.constructor = Window_TCGDeckSlots;

Window_TCGDeckSlots.prototype.initialize = function() {
    Window_Selectable.prototype.initialize.call(this,
        Math.floor((Graphics.boxWidth - 500) / 2), 120, 500,
        Math.min(384, Graphics.boxHeight - 220));
    this.refresh();
    this.select(0);
    this.activate();
};

Window_TCGDeckSlots.prototype.maxItems = function() {
    return TCG.decks().length + 1; // + "Neues Deck"
};

Window_TCGDeckSlots.prototype.isNewDeck = function(index) {
    return index >= TCG.decks().length;
};

Window_TCGDeckSlots.prototype.drawItem = function(index) {
    var rect = this.itemRectForText(index);
    if (this.isNewDeck(index)) {
        this.changeTextColor(this.textColor(3));
        this.drawText('+ Neues Deck', rect.x, rect.y, rect.width);
        this.resetTextColor();
        return;
    }
    var deck = TCG.decks()[index];
    var size = TCG.deckSize(deck);
    var active = $gameSystem.tcg().activeDeck === index;
    this.changeTextColor(active ? this.textColor(17) : this.normalColor());
    this.drawText((active ? '\u25b6 ' : '') + deck.name, rect.x, rect.y, rect.width - 160);
    this.changeTextColor(TCG.deckValid(deck) ? this.textColor(24) : this.textColor(18));
    this.drawText(size + '/' + TCG.param.deckMax + ' Karten', rect.x, rect.y, rect.width, 'right');
    this.resetTextColor();
};

//--- Optionen fuer ein Deck ---------------------------------------------------
function Window_TCGDeckOptions() { this.initialize.apply(this, arguments); }
Window_TCGDeckOptions.prototype = Object.create(Window_Command.prototype);
Window_TCGDeckOptions.prototype.constructor = Window_TCGDeckOptions;

Window_TCGDeckOptions.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.x = (Graphics.boxWidth - this.width) / 2;
    this.y = (Graphics.boxHeight - this.height) / 2;
    this.hide();
    this.deactivate();
};

Window_TCGDeckOptions.prototype.windowWidth = function() { return 280; };

Window_TCGDeckOptions.prototype.makeCommandList = function() {
    this.addCommand('Bearbeiten', 'edit');
    this.addCommand('Umbenennen', 'rename');
    this.addCommand('Als aktiv waehlen', 'setActive');
    this.addCommand('Loeschen', 'delete');
    this.addCommand('Zurueck', 'cancel');
};

//--- Kartenlisten im Editor ---------------------------------------------------
function Window_TCGCardList() { this.initialize.apply(this, arguments); }
Window_TCGCardList.prototype = Object.create(Window_Selectable.prototype);
Window_TCGCardList.prototype.constructor = Window_TCGCardList;

Window_TCGCardList.prototype.initialize = function(x, y, w, h, mode) {
    this._mode = mode; // 'collection' oder 'deck'
    this._deck = null;
    this._items = [];
    Window_Selectable.prototype.initialize.call(this, x, y, w, h);
};

Window_TCGCardList.prototype.setDeck = function(deck) {
    this._deck = deck;
    this.refresh();
};

Window_TCGCardList.prototype.makeItems = function() {
    var self = this;
    if (this._mode === 'collection') {
        this._items = TCG.ownedCardIds().sort(function(a, b) {
            var ca = TCG.card(a), cb = TCG.card(b);
            if (ca.kartenTyp !== cb.kartenTyp) {
                var order = { monster: 0, zauber: 1, ausruestung: 2 };
                return order[ca.kartenTyp] - order[cb.kartenTyp];
            }
            return ca.name.localeCompare(cb.name);
        });
    } else {
        this._items = this._deck ? Object.keys(this._deck.cards).filter(function(id) {
            return self._deck.cards[id] > 0 && TCG.card(id);
        }).sort(function(a, b) {
            return TCG.card(a).name.localeCompare(TCG.card(b).name);
        }) : [];
    }
};

Window_TCGCardList.prototype.maxItems = function() { return this._items.length; };
Window_TCGCardList.prototype.cardId = function() { return this._items[this.index()]; };
Window_TCGCardList.prototype.card = function() { return TCG.card(this.cardId()); };

Window_TCGCardList.prototype.refresh = function() {
    this.makeItems();
    if (this.index() >= this.maxItems()) this.select(Math.max(0, this.maxItems() - 1));
    Window_Selectable.prototype.refresh.call(this);
};

// Kurzform: M1-6 (Monster+Stufe), F (Fusion), R (Ritual), Z (Zauber), A (Ausruestung)
Window_TCGCardList.prototype.shortType = function(card) {
    if (card.kartenTyp === 'zauber') return 'Z';
    if (card.kartenTyp === 'ausruestung') return 'A';
    if (TCG.isBoss(card)) return 'BOSS';
    if (card.monsterArt === 'fusion') return 'F';
    if (card.monsterArt === 'ritual') return 'R';
    return 'M' + card.stufe;
};

Window_TCGCardList.prototype.drawItem = function(index) {
    var id = this._items[index];
    var card = TCG.card(id);
    if (!card) return;
    var rect = this.itemRectForText(index);
    var inDeck = this._deck ? (this._deck.cards[id] || 0) : 0;
    this.contents.fontSize = 18;

    // Seltenheits-Marker links
    this.contents.textColor = TCG.rarityColor(card.seltenheit);
    this.contents.fontSize = 13;
    this.drawText('\u25cf', rect.x, rect.y + 3, 16);
    this.contents.fontSize = 18;

    // Typ-Kuerzel
    this.changeTextColor(this.textColor(8));
    this.drawText('[' + this.shortType(card) + ']', rect.x + 18, rect.y, 40);

    var nameX = rect.x + 62;
    var nameW = rect.width - 62;
    if (this._mode === 'collection') {
        var owned = TCG.cardCount(id);
        var free = owned - inDeck;
        this.changeTextColor(free > 0 ? this.normalColor() : this.textColor(8));
        this.drawText(card.name, nameX, rect.y, nameW - 70);
        this.drawText(inDeck + '/' + owned, rect.x, rect.y, rect.width, 'right');
    } else {
        this.changeTextColor(this.normalColor());
        this.drawText(card.name, nameX, rect.y, nameW - 40);
        this.drawText('x' + inDeck, rect.x, rect.y, rect.width, 'right');
    }
    this.resetTextColor();
    this.contents.fontSize = 28;
};

//--- Karten-Detailfenster (unten) ---------------------------------------------
function Window_TCGCardDetail() { this.initialize.apply(this, arguments); }
Window_TCGCardDetail.prototype = Object.create(Window_Base.prototype);
Window_TCGCardDetail.prototype.constructor = Window_TCGCardDetail;

Window_TCGCardDetail.prototype.initialize = function(x, y, w, h) {
    Window_Base.prototype.initialize.call(this, x, y, w, h);
    this._card = null;
};

Window_TCGCardDetail.prototype.setCard = function(card) {
    if (this._card === card) return;
    this._card = card;
    this.refresh();
};

Window_TCGCardDetail.prototype.refresh = function() {
    this.contents.clear();
    var card = this._card;
    if (!card) return;
    var w = this.contents.width;
    this.contents.fontSize = 20;
    this.changeTextColor(this.systemColor());
    this.drawText(card.name, 0, 0, w - 260);
    this.contents.fontSize = 15;
    this.contents.textColor = TCG.rarityColor(card.seltenheit);
    this.drawText(card.seltenheit, 0, 0, w, 'right');
    this.contents.fontSize = 16;
    this.contents.textColor = TCG.elementColor(card.element);
    var textY = 50;
    if (TCG.isMonster(card)) {
        this.drawText(card.element + '  \u00b7  ' + TCG.typeLine(card) +
            '  \u00b7  A ' + card.atk + ' / L ' + card.lp, 0, 26, w);
        this.resetTextColor();
        this.contents.fontSize = 13;
        var costLines = TCG.wrapText(this.contents, TCG.describeSummon(card), w);
        var maxCostLines = (card.monsterArt === 'fusion' || card.monsterArt === 'ritual') ? 2 : 1;
        for (var ci = 0; ci < Math.min(costLines.length, maxCostLines); ci++) {
            this.drawText(costLines[ci], 0, 47 + ci * 15, w);
        }
        textY = 47 + Math.min(costLines.length, maxCostLines) * 15 + 4;
    } else {
        var extra = card.kartenTyp === 'ausruestung' ?
            '  \u00b7  +' + card.atk + ' ATK / +' + card.lp + ' LP' : '';
        this.drawText(TCG.typeLine(card) + '  \u00b7  ' + card.apKosten + ' AP' + extra, 0, 26, w);
    }
    this.resetTextColor();
    this.contents.fontSize = 14;
    var lines = TCG.wrapText(this.contents, card.effektText, w);
    var maxLines = Math.max(1, Math.floor((this.contents.height - textY) / 18));
    for (var i = 0; i < Math.min(lines.length, maxLines); i++) {
        this.drawText(lines[i], 0, 50 + i * 18, w);
    }
    this.contents.fontSize = 28;
};

//--- Namenseingabe fuer Decks (nutzt die Standard-Tastatur Window_NameInput) --
function Window_TCGNameEdit() { this.initialize.apply(this, arguments); }
Window_TCGNameEdit.prototype = Object.create(Window_NameEdit.prototype);
Window_TCGNameEdit.prototype.constructor = Window_TCGNameEdit;

Window_TCGNameEdit.prototype.initialize = function(maxLength) {
    var width = this.windowWidth();
    var height = this.windowHeight();
    var totalH = height + Window_NameInput.prototype.windowHeight() + 8;
    var x = Math.floor((Graphics.boxWidth - width) / 2);
    var y = Math.max(20, Math.floor((Graphics.boxHeight - totalH) / 2));
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._maxLength = maxLength;
    this._name = '';
    this._index = 0;
    this._defaultName = '';
    this.deactivate();
};

Window_TCGNameEdit.prototype.windowHeight = function() {
    return this.fittingHeight(3);
};

Window_TCGNameEdit.prototype.faceWidth = function() { return 0; };

Window_TCGNameEdit.prototype.setup = function(name) {
    this._name = String(name || '').slice(0, this._maxLength);
    this._index = this._name.length;
    this._defaultName = this._name;
    this.refresh();
};

// Wie Window_NameEdit.refresh, nur ohne Actor-Gesicht
Window_TCGNameEdit.prototype.refresh = function() {
    this.contents.clear();
    this.contents.fontSize = 18;
    this.changeTextColor(this.systemColor());
    this.drawText('Deck-Name:', 0, 0, this.contents.width, 'center');
    this.resetTextColor();
    this.contents.fontSize = 28;
    for (var i = 0; i < this._maxLength; i++) {
        this.drawUnderline(i);
    }
    for (var j = 0; j < this._name.length; j++) {
        this.drawChar(j);
    }
    var rect = this.itemRect(this._index);
    this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
};

//--- Scene_TCGDeckBuilder -----------------------------------------------------
function Scene_TCGDeckBuilder() { this.initialize.apply(this, arguments); }
window.Scene_TCGDeckBuilder = Scene_TCGDeckBuilder;

Scene_TCGDeckBuilder.prototype = Object.create(Scene_MenuBase.prototype);
Scene_TCGDeckBuilder.prototype.constructor = Scene_TCGDeckBuilder;

Scene_TCGDeckBuilder.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._deckIndex = -1;

    var bw = Graphics.boxWidth;
    var bh = Graphics.boxHeight;
    var previewW = 216;                       // rechte Spalte fuer die Kartenvorschau
    var listY = 72;
    var detailH = 160;
    var listH = bh - listY - detailH;
    var listW = Math.floor((bw - previewW) / 2);

    this._titleWindow = new Window_Base(0, 0, bw, 72);
    this.addWindow(this._titleWindow);
    this.drawTitle('Deck Builder \u2013 Deck waehlen');

    this._slotsWindow = new Window_TCGDeckSlots();
    this._slotsWindow.setHandler('ok',     this.onSlotOk.bind(this));
    this._slotsWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._slotsWindow);

    this._optionsWindow = new Window_TCGDeckOptions();
    this._optionsWindow.setHandler('edit',      this.onEdit.bind(this));
    this._optionsWindow.setHandler('rename',    this.onRename.bind(this));
    this._optionsWindow.setHandler('setActive', this.onSetActive.bind(this));
    this._optionsWindow.setHandler('delete',    this.onDelete.bind(this));
    this._optionsWindow.setHandler('cancel',    this.onOptionsCancel.bind(this));
    this.addWindow(this._optionsWindow);

    // Editor-Fenster (zunaechst versteckt)
    this._collectionWindow = new Window_TCGCardList(0, listY, listW, listH, 'collection');
    this._collectionWindow.setHandler('ok',       this.onCollectionOk.bind(this));
    this._collectionWindow.setHandler('cancel',   this.onEditCancel.bind(this));
    this._collectionWindow.setHandler('pagedown', this.focusDeckList.bind(this));
    this._collectionWindow.hide();
    this.addWindow(this._collectionWindow);

    this._deckWindow = new Window_TCGCardList(listW, listY, listW, listH, 'deck');
    this._deckWindow.setHandler('ok',     this.onDeckOk.bind(this));
    this._deckWindow.setHandler('cancel', this.onEditCancel.bind(this));
    this._deckWindow.setHandler('pageup', this.focusCollection.bind(this));
    this._deckWindow.hide();
    this.addWindow(this._deckWindow);

    this._detailWindow = new Window_TCGCardDetail(0, listY + listH, bw - previewW, detailH);
    this._detailWindow.hide();
    this.addWindow(this._detailWindow);

    // Gerenderte Kartenvorschau in der rechten Spalte
    var pScale = Math.min((previewW - 24) / TCG.param.cardW,
                          (bh - listY - 24) / TCG.param.cardH);
    this._previewSprite = new Sprite_TCGCard(null, false);
    this._previewSprite.scale.x = this._previewSprite.scale.y = pScale;
    this._previewSprite.x = bw - previewW + Math.floor((previewW - TCG.param.cardW * pScale) / 2);
    this._previewSprite.y = listY + Math.floor((bh - listY - TCG.param.cardH * pScale) / 2);
    this._previewSprite.visible = false;
    this._previewCardId = null;
    this.addChild(this._previewSprite);

    // Umbenennen-Fenster
    this._nameEditWindow = new Window_TCGNameEdit(16);
    this._nameEditWindow.hide();
    this.addWindow(this._nameEditWindow);
    this._nameInputWindow = new Window_NameInput(this._nameEditWindow);
    this._nameInputWindow.setHandler('ok', this.onRenameOk.bind(this));
    this._nameInputWindow.hide();
    this._nameInputWindow.deactivate();
    this.addWindow(this._nameInputWindow);
};

Scene_TCGDeckBuilder.prototype.drawTitle = function(text) {
    this._titleWindow.contents.clear();
    this._titleWindow.contents.fontSize = 22;
    this._titleWindow.drawText(text, 0, 0, this._titleWindow.contents.width, 'center');
};

Scene_TCGDeckBuilder.prototype.currentDeck = function() {
    return TCG.decks()[this._deckIndex] || null;
};

//--- Deckauswahl --------------------------------------------------------------
Scene_TCGDeckBuilder.prototype.onSlotOk = function() {
    if (this._slotsWindow.isNewDeck(this._slotsWindow.index())) {
        TCG.newDeck();
        this._slotsWindow.refresh();
        this._slotsWindow.activate();
        SoundManager.playOk();
        return;
    }
    this._deckIndex = this._slotsWindow.index();
    this._optionsWindow.show();
    this._optionsWindow.select(0);
    this._optionsWindow.activate();
};

Scene_TCGDeckBuilder.prototype.onOptionsCancel = function() {
    this._optionsWindow.hide();
    this._optionsWindow.deactivate();
    this._slotsWindow.activate();
};

Scene_TCGDeckBuilder.prototype.onRename = function() {
    this._optionsWindow.hide();
    this._optionsWindow.deactivate();
    this._slotsWindow.hide();
    this._nameEditWindow.setup(this.currentDeck().name);
    this._nameEditWindow.show();
    this._nameInputWindow.select(0);
    this._nameInputWindow.show();
    this._nameInputWindow.activate();
};

Scene_TCGDeckBuilder.prototype.onRenameOk = function() {
    var name = this._nameEditWindow.name();
    if (name) this.currentDeck().name = name;
    SoundManager.playOk();
    this._nameEditWindow.hide();
    this._nameInputWindow.hide();
    this._nameInputWindow.deactivate();
    this._slotsWindow.show();
    this._slotsWindow.refresh();
    this._slotsWindow.activate();
};

Scene_TCGDeckBuilder.prototype.onSetActive = function() {
    TCG.setActiveDeck(this._deckIndex);
    SoundManager.playOk();
    this.onOptionsCancel();
    this._slotsWindow.refresh();
};

Scene_TCGDeckBuilder.prototype.onDelete = function() {
    TCG.deleteDeck(this._deckIndex);
    SoundManager.playOk();
    this.onOptionsCancel();
    this._slotsWindow.refresh();
    this._slotsWindow.select(0);
};

//--- Editor -------------------------------------------------------------------
Scene_TCGDeckBuilder.prototype.onEdit = function() {
    this._optionsWindow.hide();
    this._optionsWindow.deactivate();
    this._slotsWindow.hide();
    this._slotsWindow.deactivate();
    var deck = this.currentDeck();
    this._collectionWindow.setDeck(deck);
    this._deckWindow.setDeck(deck);
    this._collectionWindow.show();
    this._deckWindow.show();
    this._detailWindow.show();
    this.updateEditTitle();
    this.focusCollection();
};

Scene_TCGDeckBuilder.prototype.updateEditTitle = function() {
    var deck = this.currentDeck();
    var size = TCG.deckSize(deck);
    var status = TCG.deckValid(deck) ? 'spielbereit' :
        ('mind. ' + TCG.param.deckMin + ' Karten noetig');
    this.drawTitle(deck.name + '  \u00b7  ' + size + '/' + TCG.param.deckMax +
        ' Karten (' + status + ')   [Q/W: Spalte wechseln]');
};

Scene_TCGDeckBuilder.prototype.focusCollection = function() {
    this._deckWindow.deactivate();
    this._collectionWindow.activate();
    if (this._collectionWindow.index() < 0) this._collectionWindow.select(0);
};

Scene_TCGDeckBuilder.prototype.focusDeckList = function() {
    this._collectionWindow.deactivate();
    this._deckWindow.activate();
    if (this._deckWindow.index() < 0) this._deckWindow.select(0);
};

// Sammlung: Kopie ins Deck legen
Scene_TCGDeckBuilder.prototype.onCollectionOk = function() {
    var deck = this.currentDeck();
    var id = this._collectionWindow.cardId();
    if (!id) { this._collectionWindow.activate(); return; }
    var inDeck = deck.cards[id] || 0;
    var owned = TCG.cardCount(id);
    if (TCG.deckSize(deck) >= TCG.param.deckMax ||
        inDeck >= TCG.param.maxCopies || inDeck >= owned) {
        SoundManager.playBuzzer();
    } else {
        deck.cards[id] = inDeck + 1;
        SoundManager.playCursor();
    }
    this.refreshEditor();
    this._collectionWindow.activate();
};

// Deck: Kopie entfernen
Scene_TCGDeckBuilder.prototype.onDeckOk = function() {
    var deck = this.currentDeck();
    var id = this._deckWindow.cardId();
    if (id) {
        deck.cards[id]--;
        if (deck.cards[id] <= 0) delete deck.cards[id];
        SoundManager.playCursor();
    }
    this.refreshEditor();
    this._deckWindow.activate();
};

Scene_TCGDeckBuilder.prototype.refreshEditor = function() {
    this._collectionWindow.refresh();
    this._deckWindow.refresh();
    this.updateEditTitle();
};

Scene_TCGDeckBuilder.prototype.onEditCancel = function() {
    this._collectionWindow.hide();
    this._collectionWindow.deactivate();
    this._deckWindow.hide();
    this._deckWindow.deactivate();
    this._detailWindow.hide();
    this.drawTitle('Deck Builder \u2013 Deck waehlen');
    this._slotsWindow.show();
    this._slotsWindow.refresh();
    this._slotsWindow.activate();
};

Scene_TCGDeckBuilder.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    if (this._collectionWindow.visible) {
        var active = this._collectionWindow.active ? this._collectionWindow : this._deckWindow;
        var card = active.card ? active.card() : null;
        this._detailWindow.setCard(card);
        this.updatePreview(card);
        // Spaltenwechsel per Pfeiltasten
        if (this._collectionWindow.active && Input.isTriggered('right')) this.focusDeckList();
        else if (this._deckWindow.active && Input.isTriggered('left')) this.focusCollection();
    } else {
        this.updatePreview(null);
    }
};

Scene_TCGDeckBuilder.prototype.updatePreview = function(card) {
    var id = card ? card.id : null;
    if (id !== this._previewCardId) {
        this._previewCardId = id;
        if (card) this._previewSprite.setCard(card, false);
    }
    this._previewSprite.visible = !!card;
};

//=============================================================================
// Booster Shop
//=============================================================================
function Window_TCGBoosterList() { this.initialize.apply(this, arguments); }
Window_TCGBoosterList.prototype = Object.create(Window_Selectable.prototype);
Window_TCGBoosterList.prototype.constructor = Window_TCGBoosterList;

Window_TCGBoosterList.prototype.initialize = function() {
    Window_Selectable.prototype.initialize.call(this, 0, 72, Graphics.boxWidth,
        Graphics.boxHeight - 72 - 100);
    this.refresh();
    this.select(0);
    this.activate();
};

Window_TCGBoosterList.prototype.maxItems = function() {
    return TCG.availableBoosters().length;
};

Window_TCGBoosterList.prototype.booster = function() {
    return TCG.availableBoosters()[this.index()];
};

Window_TCGBoosterList.prototype.isCurrentItemEnabled = function() {
    var b = this.booster();
    return !!b && $gameParty.gold() >= Number(b.preis);
};

Window_TCGBoosterList.prototype.drawItem = function(index) {
    var b = TCG.availableBoosters()[index];
    if (!b) return;
    var rect = this.itemRectForText(index);
    var enabled = $gameParty.gold() >= Number(b.preis);
    this.changePaintOpacity(enabled);
    this.drawText(b.name, rect.x, rect.y, rect.width - 260);
    this.drawText(b.kartenProPack + ' Karten', rect.x, rect.y, rect.width - 140, 'right');
    this.changeTextColor(this.textColor(14));
    this.drawText(b.preis + ' ' + TextManager.currencyUnit, rect.x, rect.y, rect.width, 'right');
    this.resetTextColor();
    this.changePaintOpacity(true);
};

function Scene_TCGShop() { this.initialize.apply(this, arguments); }
window.Scene_TCGShop = Scene_TCGShop;

Scene_TCGShop.prototype = Object.create(Scene_MenuBase.prototype);
Scene_TCGShop.prototype.constructor = Scene_TCGShop;

Scene_TCGShop.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._titleWindow = new Window_Base(0, 0, Graphics.boxWidth - 240, 72);
    this._titleWindow.contents.fontSize = 22;
    this._titleWindow.drawText('Booster Shop', 0, 0, this._titleWindow.contents.width, 'left');
    this.addWindow(this._titleWindow);

    this._goldWindow = new Window_Gold(0, 0);
    this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
    this.addWindow(this._goldWindow);

    this._listWindow = new Window_TCGBoosterList();
    this._listWindow.setHandler('ok',     this.onBuy.bind(this));
    this._listWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._listWindow);

    this._helpWindow = new Window_Base(0, Graphics.boxHeight - 100, Graphics.boxWidth, 100);
    this._helpWindow.contents.fontSize = 16;
    this._helpWindow.drawText('OK: Booster kaufen und sofort oeffnen. Neue Booster werden im', 0, 0,
        this._helpWindow.contents.width);
    this._helpWindow.drawText('Spielverlauf freigeschaltet.', 0, 24, this._helpWindow.contents.width);
    this.addWindow(this._helpWindow);
};

Scene_TCGShop.prototype.onBuy = function() {
    var booster = this._listWindow.booster();
    if (!booster) { this._listWindow.activate(); return; }
    $gameParty.loseGold(Number(booster.preis));
    var pulls = TCG.openBooster(booster.id);
    SoundManager.playShop();
    Scene_TCGBoosterOpening.prepare(booster, pulls);
    SceneManager.push(Scene_TCGBoosterOpening);
};

Scene_TCGShop.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    this._goldWindow.refresh();
    this._listWindow.refresh();
    this._listWindow.activate();
};

//=============================================================================
// Booster-Opening-Sequenz
//=============================================================================
function Scene_TCGBoosterOpening() { this.initialize.apply(this, arguments); }
window.Scene_TCGBoosterOpening = Scene_TCGBoosterOpening;

Scene_TCGBoosterOpening.prepare = function(booster, pulls) {
    Scene_TCGBoosterOpening._booster = booster;
    Scene_TCGBoosterOpening._pulls = pulls;
};

Scene_TCGBoosterOpening.prototype = Object.create(Scene_MenuBase.prototype);
Scene_TCGBoosterOpening.prototype.constructor = Scene_TCGBoosterOpening;

Scene_TCGBoosterOpening.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._booster = Scene_TCGBoosterOpening._booster;
    this._pulls = Scene_TCGBoosterOpening._pulls || [];
    this._revealed = 0;
    this._flipSprite = null;
    this._flipPhase = 0;

    this._titleWindow = new Window_Base(0, 0, Graphics.boxWidth, 72);
    this._titleWindow.contents.fontSize = 22;
    this._titleWindow.drawText(this._booster.name + ' \u2013 OK druecken zum Aufdecken', 0, 0,
        this._titleWindow.contents.width, 'center');
    this.addWindow(this._titleWindow);

    // Karten verdeckt auslegen
    this._cardSprites = [];
    var n = this._pulls.length;
    var scale = Math.min(0.42, 720 / (n * TCG.param.cardW));
    var w = TCG.param.cardW * scale;
    var gap = 14;
    var total = n * w + (n - 1) * gap;
    var startX = (Graphics.boxWidth - total) / 2;
    for (var i = 0; i < n; i++) {
        var sp = new Sprite_TCGCard(null, true);
        sp.anchor.x = 0.5;
        sp.scale.x = sp.scale.y = scale;
        sp.x = startX + i * (w + gap) + w / 2;
        sp.y = 180;
        sp._baseScaleX = scale;
        this.addChild(sp);
        this._cardSprites.push(sp);
    }
};

Scene_TCGBoosterOpening.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);

    // Flip-Animation: zusammenklappen -> Karte tauschen -> aufklappen
    if (this._flipSprite) {
        var sp = this._flipSprite;
        if (this._flipPhase === 0) {
            sp.scale.x -= sp._baseScaleX / 6;
            if (sp.scale.x <= 0) {
                sp.setCard(TCG.card(this._pulls[this._revealed - 1]), false);
                this._flipPhase = 1;
                SoundManager.playCursor();
            }
        } else {
            sp.scale.x += sp._baseScaleX / 6;
            if (sp.scale.x >= sp._baseScaleX) {
                sp.scale.x = sp._baseScaleX;
                this._flipSprite = null;
            }
        }
        return;
    }

    if (Input.isTriggered('ok') || TouchInput.isTriggered()) {
        if (this._revealed < this._pulls.length) {
            this._flipSprite = this._cardSprites[this._revealed];
            this._flipPhase = 0;
            this._revealed++;
        } else {
            SoundManager.playOk();
            this.popScene();
        }
    } else if (Input.isTriggered('cancel') && this._revealed >= this._pulls.length) {
        this.popScene();
    }
};

//=============================================================================
// Plugin-Befehle
//=============================================================================
var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command !== 'TCG') return;
    switch (args[0]) {
        case 'Menu':        SceneManager.push(Scene_TCGMenu); break;
        case 'DeckBuilder': SceneManager.push(Scene_TCGDeckBuilder); break;
        case 'Shop':        SceneManager.push(Scene_TCGShop); break;
    }
};

})();
