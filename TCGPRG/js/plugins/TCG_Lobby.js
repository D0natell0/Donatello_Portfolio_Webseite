//=============================================================================
// TCG_Lobby.js  (v1.0)
//-----------------------------------------------------------------------------
// Kampfzonen-Lobby: die Spieler-Oberflaeche fuer Multiplayer (siehe
// TCG_Network.js fuer die eigentliche Verbindungsschicht). Wird typischerweise
// per Plugin-Befehl aus einem Kartenevent geoeffnet (z.B. "betritt ein
// Gebaeude" in der Map). Bis zu 4 Spieler (1 Host + 3 Gaeste) verbinden sich
// im Sternmodell, sehen eine gemeinsame Spielerliste und koennen sich
// gegenseitig herausfordern, Teams bilden oder gegen NPCs spielen.
//
// WICHTIG: Diese Szene deckt NUR den Verbindungsaufbau + die Lobby-Oberflaeche
// ab. Das eigentliche "Herausforderung angenommen -> Duell startet synchron
// ueber das Netzwerk" ist der naechste Ausbauschritt (siehe TCG_Battle.js)
// und noch NICHT enthalten - "Herausfordern" fuehrt aktuell nur bis zum
// Bestaetigen der Anfrage.
//
// Die Copy-Paste-Codes sind zu lang fuer RPG Makers virtuelle Tastatur
// (ueber 1000 Zeichen) - deshalb ausschliesslich ueber die System-
// Zwischenablage (NW.js' nw.gui-Clipboard-API). Kein Server, keine
// durchsuchbare Lobby-Liste (siehe Projektbesprechung) - der Gastgeber
// verschickt jeden Code manuell (z.B. per Discord).
//
// Muss NACH TCG_Core.js UND TCG_Network.js geladen werden.
//=============================================================================
/*:
 * @plugindesc v1.0 Kampfzonen-Lobby-Oberflaeche (Hosten/Beitreten, Spielerliste, Herausfordern/Teams) fuer bis zu 4 Spieler.
 * @author Donatello Media
 *
 * @help
 * ============================================================================
 * TCG_Lobby.js v1.0 - Kampfzonen-Lobby
 * ============================================================================
 * PLUGIN-BEFEHL (z.B. im "Betreten"-Ereignis eines Kampfzonen-Gebaeudes):
 *   TCG Kampfzone
 *
 * ABLAUF:
 *   1. Spieler waehlt "Kampfzone hosten" oder "Kampfzone beitreten"
 *   2. Hosten: Code wird automatisch in die Zwischenablage kopiert (z.B. per
 *      Discord an Freunde schicken). Sobald jemand seinen Antwort-Code
 *      zurueckschickt: "Antwort einfuegen" liest ihn aus der Zwischenablage.
 *      Weitere Spieler: "Naechsten Spieler einladen" fuer einen neuen Code.
 *   3. Beitreten: "Code einfuegen" liest den Code des Gastgebers aus der
 *      Zwischenablage, erzeugt automatisch einen Antwort-Code (wird direkt
 *      in die Zwischenablage kopiert) - diesen dem Gastgeber zurueckschicken.
 *   4. Sobald verbunden: gemeinsame Spielerliste, darauf auswaehlbar:
 *      herausfordern, Team A/B beitreten, verlassen.
 *
 * Kein eigener Server, keine durchsuchbare Lobby-Liste - rein manuelle
 * Codes zwischen den Spielern (siehe TCG_Network.js fuer die Begruendung).
 */

var TCG = TCG || {};

// Absicherung: TCG_Lobby.js braucht TCG.Net aus TCG_Network.js. Ohne diese
// Pruefung wuerde der naechste Zugriff (z.B. "TCG.Net.DuelRelay = ...")
// weiter unten mit einem kryptischen "Cannot set property of undefined"
// abbrechen - typischerweise, weil TCG_Network.js im Plugin-Manager fehlt,
// deaktiviert ist, oder NACH TCG_Lobby.js einsortiert wurde (falsche
// Reihenfolge). Diese Meldung sagt sofort, woran es liegt.
if (!TCG.Net) {
    var _tcgLobbyMsg = 'TCG_Lobby.js: TCG.Net fehlt - TCG_Network.js wurde nicht ' +
        '(rechtzeitig) geladen. Im Plugin-Manager pruefen: TCG_Network.js muss ' +
        'vorhanden, aktiviert UND VOR TCG_Lobby.js einsortiert sein ' +
        '(Reihenfolge: TCG_Core -> TCG_Battle -> TCG_Menus -> TCG_Network -> TCG_Lobby -> TCG_TagDuel -> TCG_Portraits).';
    console.error(_tcgLobbyMsg);
    if (typeof alert === 'function') alert(_tcgLobbyMsg);
}

//-----------------------------------------------------------------------------
// Zwischenablage (NW.js) - Codes sind zu lang fuer die virtuelle Tastatur.
//-----------------------------------------------------------------------------
TCG.clipboardWrite = function(text) {
    try {
        var gui = require('nw.gui');
        gui.Clipboard.get().set(text, 'text');
        return true;
    } catch (e) {
        console.error('TCG: Zwischenablage-Schreibzugriff fehlgeschlagen: ' + e.message);
        return false;
    }
};

TCG.clipboardRead = function() {
    try {
        var gui = require('nw.gui');
        return gui.Clipboard.get().get('text') || '';
    } catch (e) {
        console.error('TCG: Zwischenablage-Lesezugriff fehlgeschlagen: ' + e.message);
        return '';
    }
};

//-----------------------------------------------------------------------------
// Plugin-Befehl: TCG Kampfzone
//-----------------------------------------------------------------------------
(function() {
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command !== 'TCG') return;
        if (args[0] === 'Kampfzone') {
            SceneManager.push(Scene_TCGKampfzone);
        }
    };
})();

//-----------------------------------------------------------------------------
// Window_TCGLobbyChoice - Einstiegsmenue
//-----------------------------------------------------------------------------
function Window_TCGLobbyChoice() { this.initialize.apply(this, arguments); }
Window_TCGLobbyChoice.prototype = Object.create(Window_Command.prototype);
Window_TCGLobbyChoice.prototype.constructor = Window_TCGLobbyChoice;

Window_TCGLobbyChoice.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.x = Math.floor((Graphics.boxWidth - this.width) / 2);
    this.y = Math.floor((Graphics.boxHeight - this.height) / 2);
};

Window_TCGLobbyChoice.prototype.windowWidth = function() { return 320; };

Window_TCGLobbyChoice.prototype.makeCommandList = function() {
    this.addCommand('Kampfzone hosten', 'host');
    this.addCommand('Kampfzone beitreten', 'join');
    this.addCommand('Zurueck', 'cancel');
};

//-----------------------------------------------------------------------------
// Window_TCGLobbyStatus - reine Textanzeige (Anleitung/Zustand)
//-----------------------------------------------------------------------------
function Window_TCGLobbyStatus() { this.initialize.apply(this, arguments); }
Window_TCGLobbyStatus.prototype = Object.create(Window_Base.prototype);
Window_TCGLobbyStatus.prototype.constructor = Window_TCGLobbyStatus;

Window_TCGLobbyStatus.prototype.initialize = function(x, y, w, h) {
    Window_Base.prototype.initialize.call(this, x, y, w, h);
    this._lines = [];
};

Window_TCGLobbyStatus.prototype.setLines = function(lines) {
    this._lines = lines || [];
    this.refresh();
};

Window_TCGLobbyStatus.prototype.refresh = function() {
    this.contents.clear();
    var y = 4;
    for (var i = 0; i < this._lines.length; i++) {
        this.drawText(this._lines[i], 6, y, this.contentsWidth() - 12, 'left');
        y += this.lineHeight();
    }
};

//-----------------------------------------------------------------------------
// Window_TCGLobbyActions - kontextabhaengige Aktionsknoepfe
//-----------------------------------------------------------------------------
function Window_TCGLobbyActions() { this.initialize.apply(this, arguments); }
Window_TCGLobbyActions.prototype = Object.create(Window_Command.prototype);
Window_TCGLobbyActions.prototype.constructor = Window_TCGLobbyActions;

Window_TCGLobbyActions.prototype.initialize = function(x, y) {
    this._commandList = [];
    Window_Command.prototype.initialize.call(this, x, y);
};

Window_TCGLobbyActions.prototype.windowWidth = function() { return 280; };

Window_TCGLobbyActions.prototype.setCommands = function(list) {
    this._commandList = list; // [{name, symbol}, ...]
    this.refresh();
    this.select(0);
};

Window_TCGLobbyActions.prototype.makeCommandList = function() {
    var self = this;
    (this._commandList || []).forEach(function(c) { self.addCommand(c.name, c.symbol, c.enabled !== false); });
};

//-----------------------------------------------------------------------------
// Window_TCGLobbyRoster - gemeinsame Spielerliste
//-----------------------------------------------------------------------------
function Window_TCGLobbyRoster() { this.initialize.apply(this, arguments); }
Window_TCGLobbyRoster.prototype = Object.create(Window_Selectable.prototype);
Window_TCGLobbyRoster.prototype.constructor = Window_TCGLobbyRoster;

Window_TCGLobbyRoster.prototype.initialize = function(x, y, w, h) {
    this._roster = [];
    Window_Selectable.prototype.initialize.call(this, x, y, w, h);
    this.refresh();
};

Window_TCGLobbyRoster.prototype.setRoster = function(roster) {
    this._roster = roster || [];
    this.refresh();
    if (this.index() >= this._roster.length) this.select(Math.max(0, this._roster.length - 1));
};

Window_TCGLobbyRoster.prototype.maxItems = function() { return this._roster.length; };
Window_TCGLobbyRoster.prototype.itemHeight = function() { return this.lineHeight() + 8; };
Window_TCGLobbyRoster.prototype.current = function() { return this._roster[this.index()] || null; };

Window_TCGLobbyRoster.prototype.drawItem = function(index) {
    var p = this._roster[index];
    if (!p) return;
    var rect = this.itemRect(index);
    var label = p.name + (p.isHost ? '  (Host)' : '') +
        (p.team ? '  [Team ' + p.team + ']' : '') +
        (p.status && p.status !== 'idle' ? '  - ' + p.status : '');
    this.drawText(label, rect.x + 4, rect.y + 4, rect.width - 8, 'left');
};

//-----------------------------------------------------------------------------
// Window_TCGLobbyPlayerActions - Aktionen fuer einen ausgewaehlten Mitspieler
//-----------------------------------------------------------------------------
function Window_TCGLobbyPlayerActions() { this.initialize.apply(this, arguments); }
Window_TCGLobbyPlayerActions.prototype = Object.create(Window_Command.prototype);
Window_TCGLobbyPlayerActions.prototype.constructor = Window_TCGLobbyPlayerActions;

Window_TCGLobbyPlayerActions.prototype.initialize = function(x, y) {
    this._commandList = [];
    Window_Command.prototype.initialize.call(this, x, y);
};

Window_TCGLobbyPlayerActions.prototype.windowWidth = function() { return 260; };

Window_TCGLobbyPlayerActions.prototype.setCommands = function(list) {
    this._commandList = list;
    this.refresh();
    this.select(0);
};

Window_TCGLobbyPlayerActions.prototype.makeCommandList = function() {
    var self = this;
    (this._commandList || []).forEach(function(c) { self.addCommand(c.name, c.symbol, c.enabled !== false); });
};

//-----------------------------------------------------------------------------
// Scene_TCGKampfzone
//-----------------------------------------------------------------------------
//=============================================================================
// TCG.Net.DuelRelay - "unsichtbarer Schiedsrichter" fuer ein Duell zwischen
// ZWEI GAESTEN, die nicht direkt miteinander verbunden sind (Sternmodell -
// nur der Host hat zu jedem Gast eine direkte Verbindung). Der Host fuehrt
// dafuer selbst eine autoritative Game_TCGBattle-Instanz stellvertretend
// aus, OHNE dass er persoenlich am Duell teilnimmt: rein event-getrieben,
// KEINE eigene Szene/Darstellung noetig (niemand sitzt am Host-Bildschirm,
// um dieses Duell zu verfolgen).
//
// participantA gilt kanonisch als Seite 0, participantB als Seite 1 (intern
// willkuerlich, aber konsistent) - jede der beiden Seiten bekommt ihren
// Spielstand in DER Perspektive geschickt, in der sie sich selbst als
// "Seite 0" sehen (siehe snapshotFor/TCG.Net.swapPerspective).
//=============================================================================
TCG.Net.DuelRelay = function(hub, participantA, participantB) {
    this.hub = hub;
    this.aId = participantA.id;
    this.bId = participantB.id;
    this.aName = participantA.name || 'Spieler A';
    this.bName = participantB.name || 'Spieler B';
    this.aActorData = participantA.actorData || null;
    this.bActorData = participantB.actorData || null;
    this.spectatorIds = [];
    var deckArrayB = Object.keys(participantB.deck || {}).map(function(id) {
        return { kartenId: id, anzahl: participantB.deck[id] };
    });
    this.game = new Game_TCGBattle(participantA.deck || {}, { name: this.bName, deck: deckArrayB });
    this.game.dealInitialHands();
    this.game.startTurn(TCG.coinFlip() ? 0 : 1);
    this.onDuelOver = null;
};

// Fuegt einen Zuschauer hinzu - bekommt ab sofort bei jedem broadcastState()
// den aktuellen Spielstand mit (kanonische, nicht gedrehte Perspektive - wie
// Teilnehmer A ihn saehe). Rein lesend, keine eigene Sitzplatz-Interaktion.
TCG.Net.DuelRelay.prototype.addSpectator = function(id) {
    if (this.spectatorIds.indexOf(id) < 0) this.spectatorIds.push(id);
    this.hub.sendTo(id, { type: 'duelStart', snapshot: this.game.snapshot(), mySide: -1,
        hostActorData: null, spectateNames: [this.aName, this.bName] });
};

// Spielstand aus Sicht von "participantId" (dreht die Perspektive, falls es
// sich um Teilnehmer B - kanonisch Seite 1 - handelt).
TCG.Net.DuelRelay.prototype.snapshotFor = function(participantId) {
    var snap = this.game.snapshot();
    return participantId === this.bId ? TCG.Net.swapPerspective(snap) : snap;
};

TCG.Net.DuelRelay.prototype.sendDuelStart = function() {
    this.hub.sendTo(this.aId, { type: 'duelStart', snapshot: this.snapshotFor(this.aId), mySide: 0, hostActorData: this.bActorData });
    this.hub.sendTo(this.bId, { type: 'duelStart', snapshot: this.snapshotFor(this.bId), mySide: 1, hostActorData: this.aActorData });
};

// Wie sendDuelStart, aber nur an EINEN Teilnehmer - fuer die Wiederverbindung
// (der ANDERE Teilnehmer braucht keinen neuen "duelStart", der wartet ja
// bereits interaktiv/passiv im laufenden Duell).
TCG.Net.DuelRelay.prototype.sendDuelStartTo = function(participantId) {
    var isA = participantId === this.aId;
    this.hub.sendTo(participantId, {
        type: 'duelStart', snapshot: this.snapshotFor(participantId), mySide: isA ? 0 : 1,
        hostActorData: isA ? this.bActorData : this.aActorData
    });
};

TCG.Net.DuelRelay.prototype.broadcastState = function() {
    this.hub.sendTo(this.aId, { type: 'snapshot', data: this.snapshotFor(this.aId) });
    this.hub.sendTo(this.bId, { type: 'snapshot', data: this.snapshotFor(this.bId) });
    var self = this;
    this.spectatorIds.forEach(function(id) { self.hub.sendTo(id, { type: 'snapshot', data: self.game.snapshot() }); });
};

// Verarbeitet eine Nachricht von fromId - Rueckgabe true, wenn sie zu DIESEM
// Relay gehoerte (also verarbeitet wurde), sonst false (z.B. eine normale
// Lobby-Nachricht oder ein anderes, gleichzeitig laufendes Relay).
TCG.Net.DuelRelay.prototype.handleMessage = function(fromId, msg) {
    if (fromId !== this.aId && fromId !== this.bId) return false;
    if (!msg || msg.type !== 'gameAction') return false;
    var self = this;
    (msg.log || []).forEach(function(step) {
        if (TCG.NET_MUTATING_METHODS.indexOf(step.method) < 0) return;
        self.game[step.method].apply(self.game, step.args);
    });
    this.broadcastState();
    if (this.game.isOver() && this.onDuelOver) this.onDuelOver();
    return true;
};

//=============================================================================
// TCG.Net.TagDuelRelay - "unsichtbarer Schiedsrichter" fuer ein Tag-Duell,
// bei dem der Kampfzonen-Host selbst NICHT mitspielt (analog zu
// TCG.Net.DuelRelay beim 1v1, aber fuer bis zu 4 Sitzplaetze). Fuehrt die
// autoritative Game_TCGTagDuel-Instanz stellvertretend aus, rein event-
// getrieben, ohne eigene Szene/Darstellung.
//
// EINSCHRAENKUNG (bewusst, fuer diese Ausbaustufe): unterstuetzt nur Tag-
// Duelle, bei denen ALLE 4 Sitzplaetze von echten Mitspielern besetzt sind
// (kein KI-Sitzplatz) - eine "kopflose" KI-Zugsteuerung ohne Szene ist ein
// eigenstaendiges, groesseres Stueck Arbeit (siehe To-do-Liste). Enthaelt
// zusaetzlich eine einfache Zuschauer-Liste: Zuschauer bekommen denselben
// Zustand wie die Teilnehmer, aber mit mySeatIndex=-1 (rein lesend, keine
// eigene Sitzplatz-Interaktion).
//=============================================================================
TCG.Net.TagDuelRelay = function(hub, seatDecks, teamNames, seatNames, seatPortraits, remoteSeats, aiSeats) {
    this.hub = hub;
    this.remoteSeats = remoteSeats; // [{seatIndex, id}, ...] - menschliche Sitzplaetze
    this.aiSeats = aiSeats || []; // Sitzplatz-Indizes (0-3), die "kopflos" von der KI gesteuert werden
    this.spectatorIds = [];
    this.game = new Game_TCGTagDuel(seatDecks, teamNames, seatNames, seatPortraits);
    this.game.dealInitialHands();
    this.game.startTurn(TCG.coinFlip() ? 0 : 2); // Team A (Sitzplatz 0) oder Team B (Sitzplatz 2) beginnt
    var self = this;
    TCG.NET_MUTATING_METHODS.forEach(function(name) {
        var original = self.game[name].bind(self.game);
        self.game[name] = function() {
            var result = original.apply(null, arguments);
            self.broadcastState();
            return result;
        };
    });
    this.onDuelOver = null;
    this.runAiTurnsIfNeeded();
};

TCG.Net.TagDuelRelay.prototype.mySeatIndexFor = function(id) {
    var entry = this.remoteSeats.filter(function(r) { return r.id === id; })[0];
    return entry ? entry.seatIndex : -1;
};

TCG.Net.TagDuelRelay.prototype.broadcastState = function() {
    var self = this;
    this.remoteSeats.forEach(function(r) { self.sendStateTo(r.id, r.seatIndex); });
    this.spectatorIds.forEach(function(id) { self.sendStateTo(id, -1); });
};

// Wie broadcastState, aber nur an EINEN Empfaenger - fuer die
// Wiederverbindung (die anderen Teilnehmer/Zuschauer brauchen keinen neuen
// vollen Zustand, sie laufen ja bereits).
TCG.Net.TagDuelRelay.prototype.sendStateTo = function(id, mySeatIndex) {
    var self = this;
    var snap = this.game.snapshot();
    var teamNames = [this.game._teams[0].name, this.game._teams[1].name];
    var seatNames = [0, 1, 2, 3].map(function(i) { return self.game.seatInfo(i).name; });
    var seatPortraits = [0, 1, 2, 3].map(function(i) { return self.game.seatInfo(i).portrait; });
    this.hub.sendTo(id, {
        type: 'tagDuelState', snapshot: snap, mySeatIndex: mySeatIndex,
        teamNames: teamNames, seatNames: seatNames, seatPortraits: seatPortraits, aiSeats: []
    });
};

TCG.Net.TagDuelRelay.prototype.addSpectator = function(id) {
    if (this.spectatorIds.indexOf(id) < 0) this.spectatorIds.push(id);
    this.broadcastState();
};

TCG.Net.TagDuelRelay.prototype.handleMessage = function(fromId, msg) {
    var isKnownSeat = this.remoteSeats.some(function(r) { return r.id === fromId; });
    if (!isKnownSeat) return false;
    if (!msg || msg.type !== 'gameAction') return false;
    var self = this;
    (msg.log || []).forEach(function(step) {
        if (TCG.NET_MUTATING_METHODS.indexOf(step.method) < 0) return;
        self.game[step.method].apply(self.game, step.args);
    });
    if (this.game.isOver() && this.onDuelOver) { this.onDuelOver(); return true; }
    this.runAiTurnsIfNeeded();
    if (this.game.isOver() && this.onDuelOver) this.onDuelOver();
    return true;
};

// Fuehrt so lange KI-Zuege headless (ohne eigene Szene) hintereinander aus,
// bis wieder ein MENSCHLICHER Sitzplatz dran ist oder das Duell vorbei ist -
// z.B. wenn zwei KI-Sitzplaetze direkt aufeinander folgen.
TCG.Net.TagDuelRelay.prototype.runAiTurnsIfNeeded = function() {
    var safety = 0;
    while (this.aiSeats.indexOf(this.game.activeSeatIndex()) >= 0 && !this.game.isOver() && safety++ < 20) {
        this.runOneAiTurn();
    }
};

// Ein kompletter KI-Zug: Ziehen, Zugbeginn-Trigger, dann Aktionen bis
// "endTurn", dann Zugende-Trigger und Weitergabe an den naechsten Sitzplatz.
// Reine Spiellogik - keine Animationen/Toasts/Sounds (kein Publikum dafuer
// noetig, das laeuft ja ohne eigene Szene).
TCG.Net.TagDuelRelay.prototype.runOneAiTurn = function() {
    var g = this.game;
    g.doDraw();
    if (g.isOver()) return;
    g.aiResolveEffects(g.turnTriggers('beimZugbeginn'));
    var safety = 0;
    while (safety++ < 60) {
        if (g.isOver()) return;
        var action = g.aiNextAction();
        if (!action || action.type === 'endTurn') break;
        this.executeAiAction(action);
    }
    if (g.isOver()) return;
    g.aiResolveEffects(g.turnTriggers('beimZugende'));
    g.startTurn(g.nextSeatIndex());
};

// Fuehrt EINE KI-Entscheidung aus - deckungsgleich mit dem Schalter in
// Scene_TCGBattle.prototype.updateAiTurn, nur ohne alles Darstellungs-
// bezogene (playTrigger/showAiCard/showToast/SoundManager).
TCG.Net.TagDuelRelay.prototype.executeAiAction = function(action) {
    var g = this.game;
    switch (action.type) {
        case 'spell': {
            var effects = g.playSpell(action.hand);
            g.aiResolveEffects(effects);
            break;
        }
        case 'summon': {
            var mCard = TCG.card(g.activePlayer().hand[action.hand]);
            var tribute = (action.tribute === null || action.tribute === undefined) ? -1 : action.tribute;
            g.beginNormalSummon(action.hand, tribute);
            var zone = g.aiPickZone(mCard.id);
            g.aiResolveEffects(g.placeFloating(zone));
            break;
        }
        case 'fusion': {
            var fCard = TCG.card(g.activePlayer().hand[action.hand]);
            g.beginFusion(action.hand);
            var fZone = g.aiPickZone(fCard.id);
            g.aiResolveEffects(g.placeFloating(fZone));
            break;
        }
        case 'ritual': {
            var rCard = TCG.card(g.activePlayer().hand[action.hand]);
            g.beginRitual(action.hand, action.tribute);
            var rZone = g.aiPickZone(rCard.id);
            g.aiResolveEffects(g.placeFloating(rZone));
            break;
        }
        case 'equip':
            g.equip(action.hand, action.zone);
            break;
        case 'activate':
            g.aiResolveEffects(g.activate(action.zone));
            break;
        case 'toBattle':
            g.toBattlePhase();
            break;
        case 'attack': {
            var result = g.attack(action.zone, action.target);
            g.aiResolveEffects(result.triggers);
            break;
        }
    }
};

function Scene_TCGKampfzone() { this.initialize.apply(this, arguments); }
window.Scene_TCGKampfzone = Scene_TCGKampfzone;
window.Window_TCGLobbyRoster = Window_TCGLobbyRoster; // fuer direkte Testbarkeit
Scene_TCGKampfzone.prototype = Object.create(Scene_MenuBase.prototype);
Scene_TCGKampfzone.prototype.constructor = Scene_TCGKampfzone;

Scene_TCGKampfzone.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
    this._hub = null;          // gesetzt, wenn wir hosten
    this._client = null;       // gesetzt, wenn wir beigetreten sind (Session)
    this._isHost = false;
    this._roster = [];
    this._pendingInvite = null;   // { code, accept } - noch nicht beantworteter Einladungscode (Host)
    this._pendingHostCode = null; // Code, den wir als Gast gerade verarbeiten
};

Scene_TCGKampfzone.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);

    this._statusWindow = new Window_TCGLobbyStatus(0, 0, Graphics.boxWidth, 4 * 36 + 16);
    this.addWindow(this._statusWindow);

    this._choiceWindow = new Window_TCGLobbyChoice();
    this._choiceWindow.setHandler('host',   this.commandHost.bind(this));
    this._choiceWindow.setHandler('join',   this.commandJoin.bind(this));
    this._choiceWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._choiceWindow);

    var actionsY = this._statusWindow.height + 8;
    this._actionsWindow = new Window_TCGLobbyActions(16, actionsY);
    this._actionsWindow.setHandler('inviteNext',  this.commandInviteNext.bind(this));
    this._actionsWindow.setHandler('pasteAnswer', this.commandPasteAnswer.bind(this));
    this._actionsWindow.setHandler('pasteHost',   this.commandPasteHostCode.bind(this));
    this._actionsWindow.setHandler('roster',      this.commandGoToRoster.bind(this));
    this._actionsWindow.setHandler('watchDuel',    this.commandWatchDuel.bind(this));
    this._actionsWindow.setHandler('cancel',      this.commandLeaveLobby.bind(this));
    this.addWindow(this._actionsWindow);

    var rosterX = this._actionsWindow.x + this._actionsWindow.width + 16;
    this._rosterWindow = new Window_TCGLobbyRoster(rosterX, actionsY, Graphics.boxWidth - rosterX - 16, 260);
    this._rosterWindow.setHandler('ok',     this.commandOpenPlayerActions.bind(this));
    this._rosterWindow.setHandler('cancel', this.commandBackToActions.bind(this));
    this.addWindow(this._rosterWindow);

    this._playerActionsWindow = new Window_TCGLobbyPlayerActions(
        Math.floor((Graphics.boxWidth - 260) / 2), Math.floor((Graphics.boxHeight - 200) / 2));
    this._playerActionsWindow.setHandler('challenge', this.commandChallenge.bind(this));
    this._playerActionsWindow.setHandler('teamA',     this.commandJoinTeam.bind(this, 'A'));
    this._playerActionsWindow.setHandler('teamB',     this.commandJoinTeam.bind(this, 'B'));
    this._playerActionsWindow.setHandler('toggleReady', this.commandToggleReady.bind(this));
    this._playerActionsWindow.setHandler('cancel',    this.commandBackToRosterFromPlayer.bind(this));
    this.addWindow(this._playerActionsWindow);

    this.enterChoice();
};

Scene_TCGKampfzone.prototype.terminate = function() {
    if (this._hub) this._hub.close();
    if (this._client) this._client.close();
    Scene_MenuBase.prototype.terminate.call(this);
};

//--- Zustaende -----------------------------------------------------------------
Scene_TCGKampfzone.prototype.showOnly = function(visible) {
    var all = [this._choiceWindow, this._actionsWindow, this._rosterWindow, this._playerActionsWindow];
    all.forEach(function(w) {
        var show = visible.indexOf(w) >= 0;
        w.visible = show;
        if (show) w.activate(); else w.deactivate();
    });
};

Scene_TCGKampfzone.prototype.enterChoice = function() {
    this._statusWindow.setLines([
        'Kampfzone: hier triffst du andere Spieler zum Duellieren.',
        'Kein Server, keine offene Lobby-Liste - Verbindung per Code (Zwischenablage).'
    ]);
    this._choiceWindow.select(0);
    this.showOnly([this._choiceWindow]);
};

//--- Hosten --------------------------------------------------------------------
Scene_TCGKampfzone.prototype.commandHost = function() {
    this._isHost = true;
    this._hub = new TCG.Net.Hub(TCG.profile()); // max. 4 Verbundene insgesamt (Host + 3 Gaeste)
    this._hub.onRosterChanged = this.onRosterChanged.bind(this);
    this._hub.onRelayedMessage = this.onHostRelayedMessage.bind(this);
    this.enterLobby();
    this.generateNextInvite();
};

Scene_TCGKampfzone.prototype.generateNextInvite = function() {
    var self = this;
    this._statusWindow.setLines(['Erzeuge Einladungscode...']);
    this._hub.inviteCode().then(function(invite) {
        self._pendingInvite = invite;
        var copied = TCG.clipboardWrite(invite.code);
        self._statusWindow.setLines([
            copied ? 'Code in Zwischenablage kopiert - an einen Mitspieler schicken (z.B. Discord).'
                   : 'Zwischenablage nicht verfuegbar - siehe Konsole (F8).',
            'Sobald er/sie dir einen Antwort-Code zurueckschickt: "Antwort einfuegen".'
        ]);
        self.refreshActionsForHost();
    }).catch(function(err) {
        // Ohne dieses catch() blieb die Szene bei einem Fehlschlag (z.B.
        // WebRTC-Verbindungsaufbau schlaegt fehl) fuer immer bei "Erzeuge
        // Einladungscode..." haengen, OHNE sichtbare Fehlermeldung - genau
        // das gemeldete Problem.
        self._statusWindow.setLines(['Einladungscode konnte nicht erzeugt werden: ' + (err && err.message ? err.message : err) + ' - bitte erneut versuchen.']);
        self.refreshActionsForHost();
    });
};

Scene_TCGKampfzone.prototype.commandInviteNext = function() {
    if (this._hub.isFull()) {
        this._statusWindow.setLines(['Lobby ist bereits voll (' + this._hub.maxPlayers + ' Spieler).']);
        this._actionsWindow.activate();
        return;
    }
    this.generateNextInvite();
};

Scene_TCGKampfzone.prototype.commandPasteAnswer = function() {
    var self = this;
    var code = TCG.clipboardRead();
    if (!code || !this._pendingInvite) {
        this._statusWindow.setLines(['Zwischenablage ist leer oder es gibt keine offene Einladung.']);
        this._actionsWindow.activate();
        return;
    }
    this._pendingInvite.accept(code).then(function() {
        self._pendingInvite = null;
        self._statusWindow.setLines(['Antwort verarbeitet - warte auf Verbindungsaufbau...']);
        self.refreshActionsForHost();
    }).catch(function(err) {
        self._statusWindow.setLines(['Ungueltiger Antwort-Code: ' + err.message]);
        self._actionsWindow.activate();
    });
};

Scene_TCGKampfzone.prototype.refreshActionsForHost = function() {
    var list = [];
    list.push({ name: 'Naechsten Spieler einladen', symbol: 'inviteNext', enabled: !this._hub.isFull() });
    list.push({ name: 'Antwort einfuegen', symbol: 'pasteAnswer', enabled: !!this._pendingInvite });
    list.push({ name: 'Zur Spielerliste', symbol: 'roster' });
    list.push({ name: 'Laufendes Duell ansehen', symbol: 'watchDuel', enabled: this.hasWatchableDuel() });
    list.push({ name: 'Kampfzone verlassen', symbol: 'cancel' });
    this._actionsWindow.setCommands(list);
};

//--- Beitreten -----------------------------------------------------------------
Scene_TCGKampfzone.prototype.commandJoin = function() {
    this._isHost = false;
    this._client = new TCG.Net.Session(TCG.profile());
    this._client.onGameMessage = this.onClientMessage.bind(this);
    this._client.onClose = this.onClientDisconnected.bind(this);
    this.enterLobby();
    this._statusWindow.setLines([
        'Lass dir von einem Gastgeber dessen Einladungscode schicken,',
        'kopiere ihn (z.B. aus Discord), dann hier "Code einfuegen".'
    ]);
    this.refreshActionsForJoining();
};

Scene_TCGKampfzone.prototype.refreshActionsForJoining = function() {
    var list = [{ name: 'Code einfuegen', symbol: 'pasteHost' }];
    if (this._client && this._client.remoteProfile) {
        list.push({ name: 'Zur Spielerliste', symbol: 'roster' });
        list.push({ name: 'Laufendes Duell ansehen', symbol: 'watchDuel' });
    }
    list.push({ name: 'Kampfzone verlassen', symbol: 'cancel' });
    this._actionsWindow.setCommands(list);
};

Scene_TCGKampfzone.prototype.commandPasteHostCode = function() {
    var self = this;
    var code = TCG.clipboardRead();
    if (!code) {
        this._statusWindow.setLines(['Zwischenablage ist leer - erst den Code des Gastgebers kopieren.']);
        this._actionsWindow.activate();
        return;
    }
    TCG.Net.withTimeout(this._client.createJoinCode(code), 15000,
        'Verbindungsaufbau (WebRTC) hat zu lange gedauert - Netzwerk-/Firewall-Problem? Bitte erneut versuchen.'
    ).then(function(answerCode) {
        var copied = TCG.clipboardWrite(answerCode);
        self._statusWindow.setLines([
            copied ? 'Antwort-Code kopiert - an den Gastgeber zurueckschicken.'
                   : 'Zwischenablage nicht verfuegbar - siehe Konsole (F8).',
            'Warte auf Verbindungsaufbau, sobald der Gastgeber die Antwort verarbeitet hat...'
        ]);
        self._actionsWindow.activate();
    }).catch(function(err) {
        self._statusWindow.setLines(['Ungueltiger Code: ' + err.message]);
        self._actionsWindow.activate();
    });
};

Scene_TCGKampfzone.prototype.onClientDisconnected = function() {
    this._statusWindow.setLines(['Verbindung zum Gastgeber verloren.']);
    this._roster = [];
    this._rosterWindow.setRoster([]);
};

//--- Gemeinsame Lobby (Host + Gast) ---------------------------------------------
Scene_TCGKampfzone.prototype.enterLobby = function() {
    this._roster = [];
    this._rosterWindow.setRoster([]);
    this._statusWindow.visible = true;
    this._rosterWindow.visible = true;
    this._rosterWindow.deactivate();
    this._actionsWindow.visible = true;
    this._actionsWindow.activate();
    this._choiceWindow.visible = false;
    this._playerActionsWindow.visible = false;
    if (this._isHost) this.refreshActionsForHost(); else this.refreshActionsForJoining();
};

Scene_TCGKampfzone.prototype.onRosterChanged = function(roster) {
    this._roster = roster;
    this._rosterWindow.setRoster(roster);
};

Scene_TCGKampfzone.prototype.onClientMessage = function(msg) {
    if (msg.type === 'roster') {
        this._roster = msg.players;
        this._rosterWindow.setRoster(this._roster);
        return;
    }
    if (msg.type === 'challenge') {
        this.showChallengePrompt(msg.fromId);
        return;
    }
    if (msg.type === 'challengeResponse') {
        this.onChallengeResponse(msg.accepted);
        return;
    }
    if (msg.type === 'duelStart') {
        if (msg.mySide === -1) {
            this.startNetworkSpectateAsGuest(msg.snapshot, msg.spectateNames);
        } else {
            this.startNetworkDuelAsGuest(msg.snapshot, msg.mySide, msg.hostActorData);
        }
        return;
    }
    if (msg.type === 'tagDuelState') {
        if (msg.mySeatIndex === -1) {
            this.startNetworkTagDuelSpectateAsGuest(msg);
        } else {
            this.startNetworkTagDuelAsGuest(msg);
        }
        return;
    }
    if (msg.type === 'watchDenied') {
        this._statusWindow.setLines([msg.message]);
        return;
    }
};

Scene_TCGKampfzone.prototype.onHostRelayedMessage = function(fromId, msg) {
    if (!msg) return;
    // Laufende Gast-zu-Gast-Duelle (1v1 UND Tag-Duelle) haben Vorrang bei
    // "gameAction"-Nachrichten (die eigentlichen Spielzuege waehrend eines
    // bereits laufenden Duells).
    if (this._activeRelays && this._activeRelays.length > 0) {
        for (var i = 0; i < this._activeRelays.length; i++) {
            if (this._activeRelays[i].handleMessage(fromId, msg)) return;
        }
    }
    if (this._activeTagDuelRelays && this._activeTagDuelRelays.length > 0) {
        for (var j = 0; j < this._activeTagDuelRelays.length; j++) {
            if (this._activeTagDuelRelays[j].handleMessage(fromId, msg)) return;
        }
    }
    if (msg.type === 'challenge' && msg.targetId === TCG.profile().id) {
        this.showChallengePrompt(fromId);
        return;
    }
    if (msg.type === 'challengeResponse' && msg.targetId === TCG.profile().id) {
        this.onChallengeResponse(msg.accepted);
        return;
    }
    if (msg.type === 'deckOffer') {
        if (!msg.opponentId || msg.opponentId === TCG.profile().id) {
            // Bestehender Fall: Duell mit MIR (dem Host) selbst.
            this.startNetworkDuelAsHost(fromId, msg.deck, msg.deckName, msg.actorData);
        } else {
            // Gast-zu-Gast: Deck-Angebot zwischenspeichern, bis BEIDE Seiten
            // ihres vorliegen (siehe onRelayDeckOffer).
            this.onRelayDeckOffer(fromId, msg.opponentId, msg.deck, msg.deckName, msg.actorData);
        }
        return;
    }
    if (msg.type === 'teamJoin') {
        this._hub.setGuestTeam(fromId, msg.team);
        return;
    }
    if (msg.type === 'readyToggle') {
        if (msg.ready) {
            this._readyInfo = this._readyInfo || {};
            this._readyInfo[fromId] = { deck: msg.deck, actorData: msg.actorData };
        }
        this._hub.setGuestReady(fromId, msg.ready);
        this.checkTagDuelAutoStart();
        return;
    }
    if (msg.type === 'watchRequest') {
        this.grantWatchRequest(fromId);
        return;
    }
};

Scene_TCGKampfzone.prototype.commandGoToRoster = function() {
    this._actionsWindow.deactivate();
    this._rosterWindow.activate();
    if (this._roster.length > 0) this._rosterWindow.select(0);
};

Scene_TCGKampfzone.prototype.commandBackToActions = function() {
    this._rosterWindow.deactivate();
    this._actionsWindow.activate();
};

Scene_TCGKampfzone.prototype.commandOpenPlayerActions = function() {
    var p = this._rosterWindow.current();
    if (!p) { this._rosterWindow.activate(); return; }
    var isSelf = p.id === TCG.profile().id;
    var list = [];
    if (!isSelf) list.push({ name: 'Herausfordern', symbol: 'challenge' });
    list.push({ name: 'Team A beitreten', symbol: 'teamA' });
    list.push({ name: 'Team B beitreten', symbol: 'teamB' });
    if (isSelf && p.team) {
        list.push({ name: p.ready ? 'Bereit (abwaehlen)' : 'Bereit melden (Tag-Duell)', symbol: 'toggleReady' });
    }
    list.push({ name: 'Zurueck', symbol: 'cancel' });
    this._playerActionsTarget = p;
    this._rosterWindow.deactivate();
    this._playerActionsWindow.visible = true;
    this._playerActionsWindow.setCommands(list);
    this._playerActionsWindow.activate();
};

Scene_TCGKampfzone.prototype.commandBackToRosterFromPlayer = function() {
    this._playerActionsWindow.visible = false;
    this._playerActionsWindow.deactivate();
    this._rosterWindow.activate();
};

Scene_TCGKampfzone.prototype.commandChallenge = function() {
    var target = this._playerActionsTarget;
    this._lastChallengedId = target.id;
    if (this._isHost) {
        this._hub.sendTo(target.id, { type: 'challenge', targetId: target.id, fromId: TCG.profile().id });
    } else {
        this._client.send({ type: 'challenge', toId: target.id, targetId: target.id });
    }
    this._statusWindow.setLines(['Herausforderung an ' + target.name + ' geschickt - warte auf Antwort...']);
    this.commandBackToRosterFromPlayer();
};

Scene_TCGKampfzone.prototype.commandJoinTeam = function(team) {
    var target = this._playerActionsTarget;
    var isSelf = target.id === TCG.profile().id;
    if (isSelf) {
        if (this._isHost) {
            this._hub.setHostTeam(team);
        } else {
            this._client.send({ type: 'teamJoin', team: team });
        }
    }
    this._statusWindow.setLines(['Team ' + team + ' beigetreten.']);
    this.commandBackToRosterFromPlayer();
};

// Meldet sich bereit/nicht bereit fuers Tag-Duell. Beim Bereit-Melden wird
// das eigene (gueltige) Deck + Portraet-Daten gleich mitgeschickt, damit der
// Host sie fuer den spaeteren Duell-Aufbau bereits hat (siehe
// checkTagDuelAutoStart). Ungueltiges Deck -> Bereit-Meldung wird abgelehnt.
Scene_TCGKampfzone.prototype.commandToggleReady = function() {
    var wasReady = this._playerActionsTarget.ready;
    var newReady = !wasReady;
    if (newReady) {
        var deck = TCG.activeDeck();
        if (!deck || !TCG.deckValid(deck)) {
            this._statusWindow.setLines(['Dein aktives Deck ist ungueltig - kann nicht bereit melden.']);
            this.commandBackToRosterFromPlayer();
            return;
        }
    }
    if (this._isHost) {
        if (newReady) this._readyInfo = Object.assign({}, this._readyInfo, this._readyEntryFor(TCG.profile().id, deck));
        this._hub.setHostReady(newReady);
        this.checkTagDuelAutoStart();
    } else {
        var gDeck = TCG.activeDeck();
        this._client.send({ type: 'readyToggle', ready: newReady,
            deck: newReady ? gDeck.cards : null, deckName: TCG.profile().name, actorData: TCG.profile().actorData });
    }
    this._statusWindow.setLines([newReady ? 'Bereit gemeldet.' : 'Bereitschaft zurueckgezogen.']);
    this.commandBackToRosterFromPlayer();
};

// Baut einen einzelnen {id: {deck, actorData}}-Eintrag - kleine Hilfsfunktion,
// damit commandToggleReady/onHostRelayedMessage denselben Aufbau nutzen.
Scene_TCGKampfzone.prototype._readyEntryFor = function(id, deck) {
    var entry = {};
    entry[id] = { deck: deck.cards, actorData: TCG.profile().actorData };
    return entry;
};

function tcgDeckArrayToMap(deckArr) {
    var m = {};
    (deckArr || []).forEach(function(e) { m[e.kartenId] = (m[e.kartenId] || 0) + Number(e.anzahl || 1); });
    return m;
}

// HOST: prueft nach jeder Team-/Bereitschafts-Aenderung, ob beide Teams
// bereit sind ein Tag-Duell zu starten - sobald ja, startet es automatisch
// (kein manueller "Los geht's"-Klick noetig).
Scene_TCGKampfzone.prototype.checkTagDuelAutoStart = function() {
    if (!this._isHost || this._tagDuelStarting) return;
    var roster = this._hub.roster();
    var teamA = roster.filter(function(p) { return p.team === 'A'; });
    var teamB = roster.filter(function(p) { return p.team === 'B'; });
    // Jedes Team braucht mindestens 1, hoechstens 2 echte Mitspieler.
    if (teamA.length === 0 || teamB.length === 0 || teamA.length > 2 || teamB.length > 2) return;
    var allReady = teamA.concat(teamB).every(function(p) { return p.ready; });
    if (!allReady) return;
    this._tagDuelStarting = true;
    this.startTagDuelFromRoster(teamA, teamB);
};

// HOST: baut aus den beiden Team-Rosterlisten (1-2 echte Mitspieler je Team)
// die vollen 4 Sitzplaetze auf - fehlende Sitzplaetze werden mit der in
// TCG.param.tagDuelAiDeckId konfigurierten NPC-Vorlage KI-aufgefuellt.
Scene_TCGKampfzone.prototype.startTagDuelFromRoster = function(teamA, teamB) {
    var aiTemplate = TCG.opponent(TCG.param.tagDuelAiDeckId);
    if ((teamA.length < 2 || teamB.length < 2) && !aiTemplate) {
        this._statusWindow.setLines(['Kein KI-Deck konfiguriert (TCG.param.tagDuelAiDeckId) - Tag-Duell kann nicht starten.']);
        this._tagDuelStarting = false;
        return;
    }
    var self = this;
    var hostId = TCG.profile().id;
    function deckFor(id) {
        if (id === hostId) return TCG.activeDeck().cards;
        return (self._readyInfo && self._readyInfo[id] && self._readyInfo[id].deck) || {};
    }
    function actorDataFor(id) {
        if (id === hostId) return TCG.profile().actorData;
        return (self._readyInfo && self._readyInfo[id] && self._readyInfo[id].actorData) || null;
    }
    function buildTeamSeats(teamPlayers) {
        var seats = teamPlayers.map(function(p) {
            return { humanId: p.id, name: p.name, deck: deckFor(p.id), actorData: actorDataFor(p.id), portrait: null, isAi: false };
        });
        while (seats.length < 2) {
            seats.push({ humanId: null, name: aiTemplate.name, deck: tcgDeckArrayToMap(aiTemplate.deck),
                actorData: null, portrait: aiTemplate.portrait, isAi: true });
        }
        return seats;
    }
    var seatsA = buildTeamSeats(teamA);
    var seatsB = buildTeamSeats(teamB);
    var allSeats = seatsA.concat(seatsB); // Reihenfolge passt zu Game_TCGTagDuel: [A1,A2,B1,B2]

    var seatDecks = allSeats.map(function(s) { return s.deck; });
    var seatNames = allSeats.map(function(s) { return s.name; });
    var seatPortraits = allSeats.map(function(s) { return s.portrait; });
    var aiSeats = [];
    allSeats.forEach(function(s, i) { if (s.isAi) aiSeats.push(i); });
    var teamNames = [
        seatsA.map(function(s) { return s.name; }).join(' & '),
        seatsB.map(function(s) { return s.name; }).join(' & ')
    ];

    this._statusWindow.setLines(['Tag-Duell startet: ' + teamNames[0] + ' vs. ' + teamNames[1] + '...']);
    this.startNetworkTagDuel(allSeats, seatDecks, teamNames, seatNames, seatPortraits, aiSeats);
};

// HOST: baut die eigentliche Netzwerk-Synchronisation fuer bis zu 4
// Sitzplaetze auf. allSeats: [{humanId, name, deck, actorData, portrait, isAi}, ...]
// in Sitzplatz-Reihenfolge (siehe startTagDuelFromRoster). Der Host kann,
// muss aber nicht selbst mitspielen - spielt er nicht mit, uebernimmt
// TCG.Net.TagDuelRelay als unsichtbarer Schiedsrichter (nur unterstuetzt,
// wenn ALLE 4 Sitzplaetze menschlich besetzt sind - kein KI-Sitzplatz ohne
// Host-Teilnahme, siehe TCG.Net.TagDuelRelay-Kommentar).
Scene_TCGKampfzone.prototype.startNetworkTagDuel = function(allSeats, seatDecks, teamNames, seatNames, seatPortraits, aiSeats) {
    var hostId = TCG.profile().id;
    var mySeatIndex = -1;
    var remoteSeats = [];
    allSeats.forEach(function(s, i) {
        if (s.humanId === hostId) mySeatIndex = i;
        else if (s.humanId) remoteSeats.push({ seatIndex: i, id: s.humanId });
    });

    if (mySeatIndex < 0) {
        var relay = new TCG.Net.TagDuelRelay(this._hub, seatDecks, teamNames, seatNames, seatPortraits, remoteSeats, aiSeats);
        this._activeTagDuelRelays = this._activeTagDuelRelays || [];
        this._activeTagDuelRelays.push(relay);
        var self = this;
        relay.onDuelOver = function() {
            var idx = self._activeTagDuelRelays.indexOf(relay);
            if (idx >= 0) self._activeTagDuelRelays.splice(idx, 1);
        };
        wireRelayDisconnectDetection(this._hub, remoteSeats.map(function(r) { return r.id; }), function(disconnectedId) {
            if (self._activeTagDuelRelays.indexOf(relay) < 0) return; // Duell schon regulaer beendet
            var seatIndex = remoteSeats.filter(function(r) { return r.id === disconnectedId; })[0].seatIndex;
            var teamIndex = relay.game.seatInfo(seatIndex).teamIndex;
            remoteSeats.forEach(function(r) {
                if (r.id !== disconnectedId) self._hub.sendTo(r.id, { type: 'tagDuelWaitingReconnect', teamIndex: teamIndex });
            });
            self._hub.markPendingReconnect(disconnectedId, null, TCG.param.reconnectGraceMs, function() {
                // Kulanzzeit abgelaufen, ohne dass die Person zurueckkam - jetzt WIRKLICH beenden.
                var idx = self._activeTagDuelRelays.indexOf(relay);
                if (idx < 0) return;
                self._activeTagDuelRelays.splice(idx, 1);
                remoteSeats.forEach(function(r) {
                    if (r.id !== disconnectedId) self._hub.sendTo(r.id, { type: 'tagDuelDisconnect', teamIndex: teamIndex });
                });
            }, function(remoteProfile) {
                // Rechtzeitig zurueckgekehrt (gleiche Profil-ID) - Duell laeuft weiter.
                remoteSeats.forEach(function(r) {
                    if (r.id !== remoteProfile.id) self._hub.sendTo(r.id, { type: 'tagDuelReconnected', teamIndex: teamIndex });
                });
                relay.sendStateTo(remoteProfile.id, seatIndex);
            });
        });
        relay.broadcastState();
        this._statusWindow.setLines([teamNames[0] + ' vs. ' + teamNames[1] + ' - Tag-Duell gestartet (du bist Schiedsrichter).']);
        this._tagDuelStarting = false;
        return;
    }

    Scene_TCGTagDuel.prepareNetworkHost(seatDecks, teamNames, seatNames, aiSeats, seatPortraits,
        this._hub, remoteSeats, mySeatIndex);
    SceneManager.push(Scene_TCGTagDuel);
};

Scene_TCGKampfzone.prototype.commandLeaveLobby = function() {
    if (this._hub) { this._hub.close(); this._hub = null; }
    if (this._client) { this._client.close(); this._client = null; }
    this._playerActionsWindow.visible = false;
    this._rosterWindow.visible = false;
    this.enterChoice();
};

//--- Herausforderung annehmen/ablehnen -----------------------------------------
Scene_TCGKampfzone.prototype.showChallengePrompt = function(fromId) {
    this._pendingChallengeFromId = fromId;
    var from = this._roster.filter(function(p) { return p.id === fromId; })[0];
    this._statusWindow.setLines([(from ? from.name : 'Jemand') + ' fordert dich zu einem Duell heraus!']);
    this._rosterWindow.deactivate();
    this._playerActionsWindow.visible = false;
    this._actionsWindow.setCommands([
        { name: 'Annehmen',  symbol: 'acceptChallenge' },
        { name: 'Ablehnen',  symbol: 'declineChallenge' }
    ]);
    this._actionsWindow.setHandler('acceptChallenge', this.commandAcceptChallenge.bind(this));
    this._actionsWindow.setHandler('declineChallenge', this.commandDeclineChallenge.bind(this));
    this._actionsWindow.activate();
};

Scene_TCGKampfzone.prototype.restoreLobbyActions = function() {
    if (this._isHost) this.refreshActionsForHost(); else this.refreshActionsForJoining();
};

Scene_TCGKampfzone.prototype.commandDeclineChallenge = function() {
    var fromId = this._pendingChallengeFromId;
    this._pendingChallengeFromId = null;
    var response = { type: 'challengeResponse', toId: fromId, targetId: fromId, accepted: false };
    if (this._isHost) this._hub.sendTo(fromId, response); else this._client.send(response);
    this._statusWindow.setLines(['Herausforderung abgelehnt.']);
    this.restoreLobbyActions();
};

// Nimmt die Herausforderung an. Nur wenn WIR selbst nicht der Host sind,
// schicken wir unser Deck - und zwar IMMER an den HOST (nicht an den
// Herausforderer direkt!), da nur der Host autoritativ ein Duell aufbauen
// kann. "opponentId" verraet dem Host, mit wem dieses Deck-Angebot gilt -
// entscheidend fuer Gast-zu-Gast-Duelle, bei denen der Host selbst gar
// nicht mitspielt (siehe onHostRelayedMessage/onRelayDeckOffer).
Scene_TCGKampfzone.prototype.commandAcceptChallenge = function() {
    var fromId = this._pendingChallengeFromId;
    this._pendingChallengeFromId = null;
    var response = { type: 'challengeResponse', toId: fromId, targetId: fromId, accepted: true };
    if (this._isHost) {
        this._hub.sendTo(fromId, response);
    } else {
        this._client.send(response);
        var deck = TCG.activeDeck();
        var hostId = this._client.remoteProfile ? this._client.remoteProfile.id : fromId;
        this._client.send({ type: 'deckOffer', toId: hostId, opponentId: fromId,
            deck: deck ? deck.cards : {}, deckName: TCG.profile().name, actorData: TCG.profile().actorData });
    }
    this._statusWindow.setLines(['Herausforderung angenommen - Duell wird vorbereitet...']);
};

// Antwort auf die EIGENE Herausforderung. Nur relevant, wenn WIR selbst nicht
// der Host sind - unser Deck geht (wie oben) IMMER an den Host, mit
// opponentId = wen wir herausgefordert haben.
Scene_TCGKampfzone.prototype.onChallengeResponse = function(accepted) {
    if (!accepted) {
        this._statusWindow.setLines(['Herausforderung wurde abgelehnt.']);
        return;
    }
    if (this._isHost) return;
    this._statusWindow.setLines(['Herausforderung angenommen - schicke Deck...']);
    var deck = TCG.activeDeck();
    var targetId = this._lastChallengedId;
    var hostId = this._client.remoteProfile ? this._client.remoteProfile.id : targetId;
    this._client.send({ type: 'deckOffer', toId: hostId, opponentId: targetId,
        deck: deck ? deck.cards : {}, deckName: TCG.profile().name, actorData: TCG.profile().actorData });
};

// HOST: baut das eigentliche Duell auf (autoritativ) - guestDeck kommt vom
// herausgeforderten ODER herausfordernden Gast (deckOffer-Nachricht), als
// Karten-Map ({cardId: Anzahl}) - Game_TCGBattle erwartet fuer Gegner-Decks
// aber das Array-Format [{kartenId, anzahl}], daher die Umwandlung hier.
Scene_TCGKampfzone.prototype.startNetworkDuelAsHost = function(guestId, guestDeck, guestName, guestActorData) {
    var hostDeck = TCG.activeDeck();
    if (!hostDeck || !TCG.deckValid(hostDeck)) {
        this._statusWindow.setLines(['Dein aktives Deck ist ungueltig - Duell kann nicht starten.']);
        return;
    }
    if (!guestDeck || !TCG.deckValid({ cards: guestDeck })) {
        this._statusWindow.setLines(['Das Deck des Mitspielers ist ungueltig - Duell kann nicht starten.']);
        return;
    }
    var guestDeckArray = Object.keys(guestDeck).map(function(id) {
        return { kartenId: id, anzahl: guestDeck[id] };
    });
    Scene_TCGBattle.prepareNetworkHost({ name: guestName || 'Gegner', deck: guestDeckArray, actorData: guestActorData || null }, this._hub, guestId);
    SceneManager.push(Scene_TCGBattle);
};

// GAST: der Host hat das Duell gestartet und schickt den initialen
// (bereits seitenvertauschten) Spielstand mit - direkt beitreten.
Scene_TCGKampfzone.prototype.startNetworkDuelAsGuest = function(initialSnapshot, mySide, hostActorData) {
    Scene_TCGBattle.prepareNetworkGuest(this._client, initialSnapshot, mySide, hostActorData);
    SceneManager.push(Scene_TCGBattle);
};

// TEILNEHMER (nicht Host): erste "tagDuelState"-Nachricht baut die eigene
// Szene auf. Nachrichten NACH diesem Aufruf gehen nicht mehr durch diesen
// Lobby-Handler, sondern direkt an Scene_TCGTagDuel.onTagDuelGuestMessage
// (setupNetworkTagDuelGuest haengt session.onGameMessage um).
Scene_TCGKampfzone.prototype.startNetworkTagDuelAsGuest = function(msg) {
    Scene_TCGTagDuel.prepareNetworkGuest(msg.teamNames, msg.seatNames, msg.aiSeats, msg.seatPortraits,
        this._client, msg.mySeatIndex, msg.snapshot);
    SceneManager.push(Scene_TCGTagDuel);
};

Scene_TCGKampfzone.prototype.startNetworkSpectateAsGuest = function(snapshot, spectateNames) {
    Scene_TCGBattle.prepareNetworkSpectator(this._client, snapshot, spectateNames);
    SceneManager.push(Scene_TCGBattle);
};

Scene_TCGKampfzone.prototype.startNetworkTagDuelSpectateAsGuest = function(msg) {
    Scene_TCGTagDuel.prepareNetworkSpectator(msg.teamNames, msg.seatNames, msg.aiSeats, msg.seatPortraits,
        this._client, msg.snapshot);
    SceneManager.push(Scene_TCGTagDuel);
};

// HOST: sammelt Deck-Angebote fuer ein Duell zwischen ZWEI ANDEREN Gaesten
// (der Host selbst spielt nicht mit). Wartet, bis BEIDE Seiten ihr Deck
// geschickt haben, bevor der Schiedsrichter (TCG.Net.DuelRelay) aufgebaut wird.
Scene_TCGKampfzone.prototype.onRelayDeckOffer = function(fromId, opponentId, deck, deckName, actorData) {
    this._pendingRelayOffers = this._pendingRelayOffers || {};
    var pairKey = [fromId, opponentId].sort().join('|');
    var pair = this._pendingRelayOffers[pairKey] = this._pendingRelayOffers[pairKey] || {};
    pair[fromId] = { id: fromId, deck: deck, name: deckName, actorData: actorData || null };
    var other = pair[opponentId];
    if (!other) {
        this._statusWindow.setLines(['Warte auf das Deck des Gegners...']);
        return;
    }
    delete this._pendingRelayOffers[pairKey];
    this.startDuelRelay(pair[fromId], other);
};

// HOST: baut den unsichtbaren Schiedsrichter fuer ein Gast-zu-Gast-Duell auf
// - der Host selbst nimmt NICHT teil, sondern fuehrt nur die autoritative
// Game_TCGBattle-Instanz stellvertretend aus und leitet Zustaende weiter.
// Haengt sich an das BESTEHENDE session.onClose (Lobby-Roster-Bereinigung)
// dran, ohne es zu ersetzen - ruft zusaetzlich onAnyDisconnect(id, reason)
// auf, wenn einer der uebergebenen Teilnehmer die Verbindung verliert.
function wireRelayDisconnectDetection(hub, participantIds, onAnyDisconnect) {
    participantIds.forEach(function(id) {
        var entry = hub.sessions.filter(function(e) { return e.profile && e.profile.id === id; })[0];
        if (!entry) return;
        var original = entry.session.onClose;
        entry.session.onClose = function(reason) {
            if (original) original(reason);
            onAnyDisconnect(id, reason);
        };
    });
}

Scene_TCGKampfzone.prototype.hasWatchableDuel = function() {
    return (this._activeRelays && this._activeRelays.length > 0) ||
           (this._activeTagDuelRelays && this._activeTagDuelRelays.length > 0);
};

// Zuschauen ist AKTUELL nur fuer Schiedsrichter-Duelle (Gast-zu-Gast bzw.
// Tag-Duell-Schiedsrichter-Modus) moeglich - Duelle, bei denen der Host
// selbst mitspielt, laufen in dessen EIGENER Scene_TCGBattle/-TagDuel-
// Instanz und sind hierueber (noch) nicht erreichbar (siehe To-do-Liste).
Scene_TCGKampfzone.prototype.commandWatchDuel = function() {
    if (this._isHost) {
        this.grantWatchRequest(TCG.profile().id);
    } else {
        this._client.send({ type: 'watchRequest' });
        this._statusWindow.setLines(['Anfrage zum Zuschauen geschickt...']);
    }
    this._actionsWindow.activate();
};

// HOST: gewaehrt einer Profil-ID Zuschauerzugriff auf das ERSTE aktive
// Schiedsrichter-Duell (1v1-Relay bevorzugt, sonst Tag-Duell-Relay).
Scene_TCGKampfzone.prototype.grantWatchRequest = function(requesterId) {
    if (this._activeRelays && this._activeRelays.length > 0) {
        this._activeRelays[0].addSpectator(requesterId);
        return;
    }
    if (this._activeTagDuelRelays && this._activeTagDuelRelays.length > 0) {
        this._activeTagDuelRelays[0].addSpectator(requesterId);
        return;
    }
    this._hub.sendTo(requesterId, { type: 'watchDenied', message: 'Aktuell kein zuschaubares Duell (nur Schiedsrichter-Duelle unterstuetzt).' });
};

Scene_TCGKampfzone.prototype.startDuelRelay = function(participantA, participantB) {
    if (!TCG.deckValid({ cards: participantA.deck }) || !TCG.deckValid({ cards: participantB.deck })) {
        this._hub.sendTo(participantA.id, { type: 'relayError', message: 'Eines der beiden Decks ist ungueltig - Duell kann nicht starten.' });
        this._hub.sendTo(participantB.id, { type: 'relayError', message: 'Eines der beiden Decks ist ungueltig - Duell kann nicht starten.' });
        return;
    }
    var relay = new TCG.Net.DuelRelay(this._hub, participantA, participantB);
    this._activeRelays = this._activeRelays || [];
    this._activeRelays.push(relay);
    var self = this;
    relay.onDuelOver = function() {
        var idx = self._activeRelays.indexOf(relay);
        if (idx >= 0) self._activeRelays.splice(idx, 1);
    };
    wireRelayDisconnectDetection(this._hub, [participantA.id, participantB.id], function(disconnectedId) {
        if (self._activeRelays.indexOf(relay) < 0) return; // Duell schon regulaer beendet
        var otherId = disconnectedId === participantA.id ? participantB.id : participantA.id;
        self._hub.sendTo(otherId, { type: 'relayWaitingReconnect' });
        self._hub.markPendingReconnect(disconnectedId, null, TCG.param.reconnectGraceMs, function() {
            // Kulanzzeit abgelaufen, ohne dass die Person zurueckkam - jetzt WIRKLICH beenden.
            var idx = self._activeRelays.indexOf(relay);
            if (idx < 0) return;
            self._activeRelays.splice(idx, 1);
            self._hub.sendTo(otherId, { type: 'relayDisconnect' });
        }, function(remoteProfile) {
            // Rechtzeitig zurueckgekehrt (gleiche Profil-ID) - Duell laeuft weiter.
            self._hub.sendTo(otherId, { type: 'relayReconnected' });
            relay.sendDuelStartTo(remoteProfile.id);
        });
    });
    relay.sendDuelStart();
    this._statusWindow.setLines([participantA.name + ' vs. ' + participantB.name + ' - Duell gestartet (du bist Schiedsrichter).']);
};

