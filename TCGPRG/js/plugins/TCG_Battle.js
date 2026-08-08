//=============================================================================
// TCG_Battle.js  (v2.0)
//-----------------------------------------------------------------------------
// TCG-Kampfsystem fuer RPG Maker MV
// Monster mit eigenen LP, Tribut-/Fusions-/Ritualbeschwoerung, Ausruestungen,
// Exil, Positions-Auren, Element-Matrix, Effekt-Trigger, KI und Zug-Timer.
// Benoetigt: TCG_Core.js v2 (davor laden)
//=============================================================================
/*:
 * @plugindesc v2.0 TCG-Kampfsystem: Monster-LP, Tribut/Fusion/Ritual, Ausruestung, Exil, Auren, KI (nach TCG_Core laden)
 * @author Donatello Media
 *
 * @param Spielfeldbild
 * @type file
 * @dir img/tcg/system
 * @require 1
 * @desc Optionales Hintergrundbild fuer das Spielfeld. Leer = eingebauter Verlauf.
 * @default
 *
 * @help
 * ============================================================================
 * TCG_Battle.js v2.0 - Kampfsystem
 * ============================================================================
 * PLUGIN-BEFEHL:
 *   TCG Kampf <gegnerId>   (nutzt das aktive Deck; Ergebnis in ErgebnisVariable)
 *
 * ZUGABLAUF:
 *   1. "Ziehen" oder "Aufgeben"
 *   2. Draw Phase: Hand auf 5 aufstocken, AP erhalten (1. eigener Zug: 1 AP,
 *      danach 2 AP, Maximum 12)
 *   3. Hauptphase: Beschwoerungen, Zauber, Ausruestungen, aktivierbare Effekte
 *   4. Kampfphase (ab Spielzug 2): Monster waehlen, Ziel waehlen
 *   5. "Zug beenden"
 *
 * KAMPF:
 *   Schaden = eff. ATK des Angreifers + Element-Modifikator (ElementMatrix).
 *   Der Schaden wird von den LP des verteidigenden Monsters abgezogen.
 *   Faellt es auf 0, wird es zerstoert; ueberschuessiger Schaden geht auf
 *   die LP des Besitzers. Ohne gegnerische Monster: Direktangriff.
 *
 * BESCHWOERUNGEN (per Klick auf die Handkarte):
 *   Normal Stufe 1-3: Stufe AP -> Zone waehlen
 *   Normal ab Stufe 4: Tribut waehlen -> Stufe AP -> Zone waehlen
 *   Fusion: benoetigter Zauber auf der Hand + Materialien (Feld/Hand)
 *   Ritual: benoetigter Zauber + Tribut + Stufe AP
 *   Ausruestung: AP zahlen -> eigenes Monster waehlen (Boni aus atk/lp)
 *
 * STEUERUNG: Maus (Hover vergroessert, Infofenster links), Rechtsklick =
 * Abbrechen. Befehlsfenster zusaetzlich per Tastatur bedienbar.
 */

var TCG = TCG || {};
TCG.Battle = TCG.Battle || {};

(function() {
'use strict';

var battleRaw = PluginManager.parameters('TCG_Battle');
TCG.Battle.fieldImage = String(battleRaw['Spielfeldbild'] || '').trim();

//-----------------------------------------------------------------------------
// Maus-Hover-Tracking
//-----------------------------------------------------------------------------
TCG.mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', function(event) {
    if (Graphics.pageToCanvasX) {
        TCG.mouse.x = Graphics.pageToCanvasX(event.pageX);
        TCG.mouse.y = Graphics.pageToCanvasY(event.pageY);
    }
});

//=============================================================================
// Game_TCGBattle - reine Spiellogik (UI-unabhaengig)
//=============================================================================
function Game_TCGBattle() {
    this.initialize.apply(this, arguments);
}
window.Game_TCGBattle = Game_TCGBattle;

Game_TCGBattle.prototype.initialize = function(playerDeckCards, opponentData) {
    var oppDeckCards = {};
    (opponentData.deck || []).forEach(function(entry) {
        oppDeckCards[entry.kartenId] = (oppDeckCards[entry.kartenId] || 0) + Number(entry.anzahl || 1);
    });
    this._players = [
        this.makePlayer($gameActors.actor(1) ? $gameActors.actor(1).name() : 'Spieler', playerDeckCards),
        this.makePlayer(opponentData.name || 'Gegner', oppDeckCards)
    ];
    this._active = 0;
    this._turnCount = 0;
    this._phase = 'setup';
    this._winner = -1;
    this._floating = null; // Karten-ID einer bezahlten, noch nicht platzierten Beschwoerung
};

// Kompletter Spielzustand als reine JSON-Daten - fuer die Netzwerk-
// Uebertragung (Host schickt dies nach jeder Aktion an alle Mitspieler).
// Bewusst simpel gehalten: einfach ALLE internen Felder, keine Diffs - bei
// einem Kartenspiel mit wenigen KB Zustand ist das voellig ausreichend und
// deutlich weniger fehleranfaellig als Teilaktualisierungen.
Game_TCGBattle.prototype.snapshot = function() {
    return JSON.parse(JSON.stringify({
        players: this._players,
        active: this._active,
        turnCount: this._turnCount,
        phase: this._phase,
        winner: this._winner,
        floating: this._floating
    }));
};

// Ersetzt den kompletten lokalen Zustand durch einen empfangenen Snapshot
// (siehe snapshot()). Wird von Netzwerk-Clients genutzt, um ihre lokale
// Game_TCGBattle-Instanz auf den vom Host autorisierten Stand zu bringen -
// NIE um eigene Berechnungen zu ersetzen, nur um sie zu uebernehmen.
Game_TCGBattle.prototype.applySnapshot = function(data) {
    this._players = data.players;
    this._active = data.active;
    this._turnCount = data.turnCount;
    this._phase = data.phase;
    this._winner = data.winner;
    this._floating = data.floating;
};

Game_TCGBattle.prototype.makePlayer = function(name, deckCards) {
    return {
        name: name,
        lp: TCG.param.startLP,
        ap: 0,
        turnsTaken: 0,
        deck: TCG.buildDrawPile(deckCards),
        hand: [],
        zones: [null, null, null],
        grave: [],
        exile: [],
        tokens: {},      // Token-Typ-ID -> aktuelle Anzahl
        tokensSeen: {},   // Token-Typ-ID -> true, sobald einmal > 0 (fuer HUD-Sichtbarkeit)
        pendingRevival: [] // Warteschlange fuer verzoegerte Selbst-Wiederbelebung (siehe sendToGrave/startTurn)
    };
};

Game_TCGBattle.prototype.player = function(i) { return this._players[i]; };

//--- Token (persistente Spieler-Ressourcen, z.B. "Seelen-Token") --------------
Game_TCGBattle.prototype.tokenCount = function(side, typ) {
    return (this._players[side].tokens[typ]) || 0;
};

// Aendert die Tokenanzahl (amount kann negativ sein). Beachtet ein optionales
// Maximum aus der TokenTypen-Definition und geht nie unter 0.
Game_TCGBattle.prototype.addTokens = function(side, typ, amount) {
    if (!typ) return;
    var p = this._players[side];
    var cur = p.tokens[typ] || 0;
    var next = cur + amount;
    var max = TCG.tokenMax(typ);
    if (max > 0) next = Math.min(max, next);
    next = Math.max(0, next);
    p.tokens[typ] = next;
    if (next > 0) p.tokensSeen[typ] = true;
};

// Gruppiert eine Liste von Token-Kosten-Anforderungen nach Typ (mehrere
// Eintraege desselben Typs werden addiert).
Game_TCGBattle.prototype._groupTokenCosts = function(reqs) {
    var need = {};
    (reqs || []).forEach(function(r) {
        need[r.typ] = (need[r.typ] || 0) + (Number(r.anzahl) || 1);
    });
    return need;
};

Game_TCGBattle.prototype.hasTokens = function(side, reqs) {
    if (!reqs || reqs.length === 0) return true;
    var p = this._players[side];
    var need = this._groupTokenCosts(reqs);
    for (var typ in need) {
        if ((p.tokens[typ] || 0) < need[typ]) return false;
    }
    return true;
};

Game_TCGBattle.prototype.consumeTokens = function(side, reqs) {
    if (!reqs || reqs.length === 0) return;
    var self = this;
    var need = this._groupTokenCosts(reqs);
    for (var typ in need) { self.addTokens(side, typ, -need[typ]); }
};

// Liefert, welche Zahlungsarten fuer die AP-Kosten eines Monsters aktuell
// moeglich sind: 'ap', 'token' oder beides. Leer = nicht bezahlbar.
Game_TCGBattle.prototype.paymentOptions = function(side, card) {
    var cost = TCG.summonCost(card);
    var options = [];
    if (this._players[side].ap >= cost) options.push('ap');
    if (card.tokenErsatzTyp && this.tokenCount(side, card.tokenErsatzTyp) >= cost) options.push('token');
    return options;
};

// Bezahlt die AP-Kosten eines Monsters. "method" ('ap'/'token') kommt von der
// Spielerentscheidung (Szene fragt nach, wenn beide Wege moeglich sind) bzw.
// von der KI. Ohne Angabe: bevorzugt Token, falls moeglich (KI-Standard).
// Rueckgabe: true, wenn mit Token bezahlt wurde (fuer UI-Rueckmeldung).
Game_TCGBattle.prototype.payMonsterAP = function(side, card, method) {
    var cost = TCG.summonCost(card);
    var canToken = !!card.tokenErsatzTyp && this.tokenCount(side, card.tokenErsatzTyp) >= cost;
    var useToken = method ? (method === 'token' && canToken) : canToken;
    if (useToken) {
        this.addTokens(side, card.tokenErsatzTyp, -cost);
        return true;
    }
    this._players[side].ap -= cost;
    return false;
};

// Kann die AP-Kosten eines Monsters ueberhaupt aufgebracht werden (per AP ODER
// per Token-Ersatz)?
Game_TCGBattle.prototype.canPayMonsterAP = function(side, card) {
    return this.paymentOptions(side, card).length > 0;
};

Game_TCGBattle.prototype.active = function() { return this._active; };
Game_TCGBattle.prototype.activePlayer = function() { return this._players[this._active]; };
Game_TCGBattle.prototype.enemyIndex = function(i) { return 1 - i; };
Game_TCGBattle.prototype.phase = function() { return this._phase; };
Game_TCGBattle.prototype.turnCount = function() { return this._turnCount; };
Game_TCGBattle.prototype.winner = function() { return this._winner; };
Game_TCGBattle.prototype.isOver = function() { return this._winner >= 0; };
Game_TCGBattle.prototype.floating = function() { return this._floating; };

Game_TCGBattle.prototype.phaseName = function() {
    switch (this._phase) {
        case 'start':  return 'Zugbeginn';
        case 'draw':   return 'Draw Phase';
        case 'main':   return 'Hauptphase';
        case 'battle': return 'Kampfphase';
        default:       return '';
    }
};

//--- Werte-Berechnung (Auren, Ausruestung, Buffs) -----------------------------
Game_TCGBattle.prototype.slot = function(side, zone) {
    return this._players[side].zones[zone];
};

// Erfuellt der Besitzer die Bedingung eines Effekts?
Game_TCGBattle.prototype.conditionMet = function(side, effect) {
    var name = String(effect.bedingungName || '').trim();
    var elem = effect.bedingungElement && effect.bedingungElement !== 'keine' ?
        effect.bedingungElement : '';
    if (!name && !elem) return true;
    var zones = this._players[side].zones;
    var nameOk = !name, elemOk = !elem;
    for (var z = 0; z < zones.length; z++) {
        if (!zones[z]) continue;
        var card = TCG.card(zones[z].id);
        if (name && card.name.indexOf(name) >= 0) nameOk = true;
        if (elem && card.element === elem) elemOk = true;
    }
    return nameOk && elemOk;
};

// Trifft eine Aura (Quelle side/zone, bereich) die Zielzone targetSide/targetZone?
Game_TCGBattle.prototype.auraHits = function(side, zone, bereich, tSide, tZone) {
    switch (bereich) {
        case 'selbst':            return tSide === side && tZone === zone;
        case 'angrenzend':        return tSide === side && Math.abs(tZone - zone) === 1;
        case 'alleEigene':        return tSide === side;
        case 'alleGegnerischen':  return tSide !== side;
        case 'gegenueber':        return tSide !== side && tZone === zone;
        default:                  return false;
    }
};

Game_TCGBattle.prototype.auraAtk = function(tSide, tZone) {
    var total = 0;
    for (var s = 0; s < 2; s++) {
        for (var z = 0; z < 3; z++) {
            var slot = this._players[s].zones[z];
            if (!slot) continue;
            var effects = TCG.card(slot.id).effekte || [];
            for (var e = 0; e < effects.length; e++) {
                var ef = effects[e];
                if (ef.trigger !== 'dauerhaft') continue;
                if (ef.aktion !== 'atkBuff' && ef.aktion !== 'atkDebuff') continue;
                if (!this.conditionMet(s, ef)) continue;
                if (!this.auraHits(s, z, ef.bereich, tSide, tZone)) continue;
                // Zusaetzliche Zaehlbedingung, z.B. "nur wenn mind. 3 Maschinen
                // auf dem Feld liegen" - Aura wirkt sonst gar nicht (Betrag 0).
                if (ef.feldMindestArchetyp &&
                    this.fieldCount(s, ef.feldMindestArchetyp.archetyp) < ef.feldMindestArchetyp.anzahl) continue;
                // Token-skalierte Aura: Bonus = wert * aktuelle Tokenanzahl dieses Typs
                // (statt eines festen Werts), sobald tokenTyp gesetzt ist.
                // Friedhof-skalierte Aura: Bonus = wert * Anzahl Karten dieses
                // archetyp im eigenen Friedhof, sobald graveArchetyp gesetzt ist -
                // optional gedeckelt durch graveArchetypMax (verhindert unbegrenztes
                // Hochskalieren im späten Spielverlauf).
                var amount;
                if (ef.tokenTyp) {
                    amount = (Number(ef.wert) || 0) * this.tokenCount(s, ef.tokenTyp);
                } else if (ef.graveArchetyp) {
                    var graveCount = this.graveyardCount(s, ef.graveArchetyp);
                    if (ef.graveArchetypMax) graveCount = Math.min(graveCount, ef.graveArchetypMax);
                    amount = (Number(ef.wert) || 0) * graveCount;
                } else {
                    amount = (Number(ef.wert) || 0);
                }
                total += (ef.aktion === 'atkBuff' ? 1 : -1) * amount;
            }
        }
    }
    return total;
};

// Analog zu auraAtk, aber fuer LP-Auren (aktion "lpBuff"/"lpDebuff" mit
// trigger "dauerhaft" - dieselben Karten-Felder bereich/tokenTyp/
// graveArchetyp/feldMindestArchetyp funktionieren identisch).
Game_TCGBattle.prototype.auraLp = function(tSide, tZone) {
    var total = 0;
    for (var s = 0; s < 2; s++) {
        for (var z = 0; z < 3; z++) {
            var slot = this._players[s].zones[z];
            if (!slot) continue;
            var effects = TCG.card(slot.id).effekte || [];
            for (var e = 0; e < effects.length; e++) {
                var ef = effects[e];
                if (ef.trigger !== 'dauerhaft') continue;
                if (ef.aktion !== 'lpBuff' && ef.aktion !== 'lpDebuff') continue;
                if (!this.conditionMet(s, ef)) continue;
                if (!this.auraHits(s, z, ef.bereich, tSide, tZone)) continue;
                if (ef.feldMindestArchetyp &&
                    this.fieldCount(s, ef.feldMindestArchetyp.archetyp) < ef.feldMindestArchetyp.anzahl) continue;
                var amount;
                if (ef.tokenTyp) {
                    amount = (Number(ef.wert) || 0) * this.tokenCount(s, ef.tokenTyp);
                } else if (ef.graveArchetyp) {
                    var graveCountLp = this.graveyardCount(s, ef.graveArchetyp);
                    if (ef.graveArchetypMax) graveCountLp = Math.min(graveCountLp, ef.graveArchetypMax);
                    amount = (Number(ef.wert) || 0) * graveCountLp;
                } else {
                    amount = (Number(ef.wert) || 0);
                }
                total += (ef.aktion === 'lpBuff' ? 1 : -1) * amount;
            }
        }
    }
    return total;
};

Game_TCGBattle.prototype.equipAtk = function(slot) {
    return (slot.equips || []).reduce(function(sum, id) {
        var c = TCG.card(id);
        return sum + (c ? c.atk : 0);
    }, 0);
};

// Zaehlt Karten eines bestimmten "archetyp"-Werts (neues, optionales
// Kartenfeld - z.B. "Untote"/"Maschine") im Friedhof bzw. auf dem Feld einer
// Seite. Grundlage fuer Friedhof-Skalierung und Feld-Zaehlbedingungen.
Game_TCGBattle.prototype.graveyardCount = function(side, archetyp) {
    var p = this._players[side];
    var count = 0;
    for (var i = 0; i < p.grave.length; i++) {
        var c = TCG.card(p.grave[i]);
        if (c && c.archetyp === archetyp) count++;
    }
    return count;
};

Game_TCGBattle.prototype.fieldCount = function(side, archetyp) {
    var p = this._players[side];
    var count = 0;
    for (var z = 0; z < 3; z++) {
        var slot = p.zones[z];
        if (!slot) continue;
        var c = TCG.card(slot.id);
        if (c && c.archetyp === archetyp) count++;
    }
    return count;
};

Game_TCGBattle.prototype.equipLp = function(slot) {
    return (slot.equips || []).reduce(function(sum, id) {
        var c = TCG.card(id);
        return sum + (c ? c.lp : 0);
    }, 0);
};

Game_TCGBattle.prototype.effAtk = function(side, zone) {
    var slot = this.slot(side, zone);
    if (!slot) return 0;
    return Math.max(0, TCG.card(slot.id).atk + slot.atkMod +
        this.equipAtk(slot) + this.auraAtk(side, zone));
};

Game_TCGBattle.prototype.maxLp = function(side, zone) {
    var slot = this.slot(side, zone);
    if (!slot) return 0;
    return Math.max(1, TCG.card(slot.id).lp + slot.lpMod + this.equipLp(slot) + this.auraLp(side, zone));
};

Game_TCGBattle.prototype.curLp = function(side, zone) {
    var slot = this.slot(side, zone);
    if (!slot) return 0;
    return this.maxLp(side, zone) - slot.damage;
};

//--- Effekte eines Slots (Monster + Ausruestungen) je Trigger -----------------
Game_TCGBattle.prototype.slotEffects = function(side, zone, trigger) {
    var slot = this.slot(side, zone);
    if (!slot) return [];
    var self = this;
    var list = [];
    var collect = function(cardId) {
        (TCG.card(cardId).effekte || []).forEach(function(ef) {
            if (ef.trigger === trigger && self.conditionMet(side, ef)) {
                list.push({ side: side, effect: ef, sourceZone: zone });
            }
        });
    };
    collect(slot.id);
    (slot.equips || []).forEach(collect);
    return list;
};

//--- Zugsteuerung -------------------------------------------------------------
Game_TCGBattle.prototype.startTurn = function(playerIndex) {
    this._active = playerIndex;
    this._turnCount++;
    this._phase = 'start';
    var p = this.activePlayer();
    var zones = p.zones;
    for (var i = 0; i < zones.length; i++) {
        if (zones[i]) {
            zones[i].attacked = false;
            zones[i].effectUsed = false;
        }
    }
    // Verzoegerte Wiederbelebungen (siehe sendToGrave) einen Schritt weiter-
    // zaehlen - bei Erreichen von 0 automatisch in eine freie Zone beschwoeren
    // (verfaellt stillschweigend, wenn kein Platz mehr frei ist).
    if (p.pendingRevival && p.pendingRevival.length > 0) {
        var stillPending = [];
        for (var r = 0; r < p.pendingRevival.length; r++) {
            var entry = p.pendingRevival[r];
            entry.turnsLeft--;
            if (entry.turnsLeft > 0) { stillPending.push(entry); continue; }
            var freeZone = -1;
            for (var z = 0; z < 3; z++) { if (!p.zones[z]) { freeZone = z; break; } }
            if (freeZone >= 0) {
                p.zones[freeZone] = {
                    id: entry.cardId, atkMod: 0, lpMod: 0, damage: 0, equips: [],
                    attacked: false, effectUsed: false, summonedTurn: this._turnCount
                };
            }
        }
        p.pendingRevival = stillPending;
    }
};

// Startet die Partie mit einer vollen Hand fuer beide Spieler (einmalig, vor
// dem ersten Zug). Das Ziehen WAEHREND eines Zuges (doDraw) zieht danach nur
// noch 1 Karte pro Zug, nicht mehr auf HandGroesse auf.
Game_TCGBattle.prototype.dealInitialHands = function() {
    for (var i = 0; i < 2; i++) {
        var p = this._players[i];
        while (p.hand.length < TCG.param.handSize && p.deck.length > 0) {
            p.hand.push(p.deck.shift());
        }
    }
};

Game_TCGBattle.prototype.doDraw = function() {
    var p = this.activePlayer();
    this._phase = 'draw';
    var drawn = 0;
    if (p.deck.length === 0) {
        this._winner = this.enemyIndex(this._active);
        return drawn;
    }
    p.hand.push(p.deck.shift());
    drawn = 1;
    p.turnsTaken++;
    // apFirstTurn gilt NUR fuer den allerersten Zug des gesamten Duells
    // (turnCount===1) - nicht fuer den jeweils ersten Zug JEDES Spielers.
    // Wurde zuvor ueber p.turnsTaken===1 geprueft, das ist pro Spieler
    // gezaehlt: der zweite Spieler bekam dadurch faelschlich ERNEUT den
    // Erstzug-Bonus bei seinem eigenen ersten Zug (dem GESAMT zweiten Zug).
    var gain = this._turnCount === 1 ? TCG.param.apFirstTurn : TCG.param.apPerTurn;
    p.ap = Math.min(TCG.param.apMax, p.ap + gain);
    this._phase = 'main';
    return drawn;
};

// Trigger-Sammlung fuer Zugbeginn/-ende der aktiven Seite
// Muss "side" am Zugende Handkarten abwerfen (mehr als TCG.param.maxHandSize)?
// Einfache KI-Heuristik: wirft zuerst die teuersten Karten ab (behaelt
// tendenziell die guenstigeren, flexibler einsetzbaren Karten).
Game_TCGBattle.prototype.aiChooseDiscards = function(side, count) {
    var hand = this.player(side).hand;
    var order = hand.map(function(id, i) { return i; });
    order.sort(function(a, b) {
        var costA = TCG.card(hand[a]) ? (TCG.card(hand[a]).apKosten || 0) : 0;
        var costB = TCG.card(hand[b]) ? (TCG.card(hand[b]).apKosten || 0) : 0;
        return costB - costA;
    });
    return order.slice(0, count);
};

Game_TCGBattle.prototype.needsDiscard = function(side) {
    return this.player(side).hand.length > TCG.param.maxHandSize;
};

// Wirft die Handkarten an den angegebenen Index-Positionen ab (in die
// Ablage). indices werden absteigend sortiert entfernt, damit sich die
// Positionen beim Entfernen nicht gegenseitig verschieben.
Game_TCGBattle.prototype.discardHandCards = function(side, indices) {
    var p = this.player(side);
    var sorted = indices.slice().sort(function(a, b) { return b - a; });
    var discarded = [];
    sorted.forEach(function(i) {
        if (i < 0 || i >= p.hand.length) return;
        var id = p.hand.splice(i, 1)[0];
        p.grave.push(id);
        discarded.push(id);
    });
    return discarded;
};

Game_TCGBattle.prototype.turnTriggers = function(trigger) {
    var list = [];
    for (var z = 0; z < 3; z++) {
        list = list.concat(this.slotEffects(this._active, z, trigger));
    }
    return list;
};

Game_TCGBattle.prototype.battleAllowed = function() { return this._turnCount >= 2; };
Game_TCGBattle.prototype.toBattlePhase = function() {
    if (this.battleAllowed()) this._phase = 'battle';
};
Game_TCGBattle.prototype.surrender = function(i) { this._winner = this.enemyIndex(i); };

//--- Beschwoerungen -----------------------------------------------------------
// Prueft/plant eine Liste von Ablage-Kosten-Anforderungen (Karten aus der
// EIGENEN Ablage). Rueckgabe: Array von Ablage-Indizes (leer = keine Kosten
// noetig) oder null, falls nicht erfuellbar. Dieselbe Ablage-Karte wird nie
// fuer zwei Anforderungen gleichzeitig verwendet.
Game_TCGBattle.prototype.graveyardPlan = function(side, requirements) {
    if (!requirements || requirements.length === 0) return [];
    var grave = this._players[side].grave;
    var used = {};
    var indices = [];
    for (var r = 0; r < requirements.length; r++) {
        var req = requirements[r];
        var need = Number(req.anzahl) || 1;
        for (var i = 0; i < grave.length && need > 0; i++) {
            if (used[i]) continue;
            if (TCG.materialMatches(req, grave[i])) {
                used[i] = true;
                indices.push(i);
                need--;
            }
        }
        if (need > 0) return null;
    }
    return indices;
};

// Entfernt die geplanten Ablage-Karten und verbannt sie ins Exil.
Game_TCGBattle.prototype.consumeGraveyard = function(side, indices) {
    if (!indices || indices.length === 0) return;
    var p = this._players[side];
    indices.slice().sort(function(a, b) { return b - a; }).forEach(function(i) {
        var id = p.grave.splice(i, 1)[0];
        p.exile.push(id);
    });
};

Game_TCGBattle.prototype.hasEmptyZone = function(side) {
    return this._players[side].zones.indexOf(null) >= 0;
};

Game_TCGBattle.prototype.ownMonsterCount = function(side) {
    return this._players[side].zones.filter(function(z) { return !!z; }).length;
};

// Kann die Handkarte (Index) grundsaetzlich gespielt werden?
Game_TCGBattle.prototype.canPlayHandCard = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || this._phase !== 'main') return false;
    if (card.kartenTyp === 'zauber') return this.canPlaySpell(handIndex);
    if (card.kartenTyp === 'ausruestung') return this.canEquip(handIndex);
    if (card.monsterArt === 'fusion') return this.canFusion(handIndex);
    if (card.monsterArt === 'ritual') return this.canRitual(handIndex);
    return this.canNormalSummon(handIndex);
};

Game_TCGBattle.prototype.canNormalSummon = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || !TCG.isMonster(card) || card.monsterArt !== 'normal') return false;
    if (!this.canPayMonsterAP(this._active, card)) return false;
    if (this.graveyardPlan(this._active, card.ablageKosten) === null) return false;
    if (!this.hasTokens(this._active, card.tokenKosten)) return false;
    if (TCG.needsTribute(card)) return this.ownMonsterCount(this._active) > 0;
    return this.hasEmptyZone(this._active);
};

Game_TCGBattle.prototype.canRitual = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || card.monsterArt !== 'ritual') return false;
    if (!this.canPayMonsterAP(this._active, card)) return false;
    if (!this.hasMatchingTribute(card)) return false;
    if (this.graveyardPlan(this._active, card.ablageKosten) === null) return false;
    if (!this.hasTokens(this._active, card.tokenKosten)) return false;
    return this.keyIndex(handIndex) >= 0;
};

// Gibt es im Feld ein Monster, das die ritualTribut-Anforderung der Karte erfuellt?
Game_TCGBattle.prototype.hasMatchingTribute = function(card) {
    var p = this.activePlayer();
    for (var z = 0; z < 3; z++) {
        if (this.tributeMatches(card, z)) return true;
    }
    return false;
};

Game_TCGBattle.prototype.tributeMatches = function(card, zoneIndex) {
    var slot = this.activePlayer().zones[zoneIndex];
    if (!slot) return false;
    if (!TCG.ritualNeedsSpecificTribute(card)) return true; // "beliebig"
    return TCG.materialMatches(card.ritualTribut, slot.id);
};

// Index des benoetigten Zaubers auf der Hand (ungleich handIndex). Kein
// benoetigteKarte gesetzt -> -1 (bei Fusion bedeutet das "kein Zauber noetig",
// bei Ritual ist benoetigteKarte immer Pflicht).
Game_TCGBattle.prototype.keyIndex = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card.benoetigteKarte) return -1;
    for (var i = 0; i < p.hand.length; i++) {
        if (i !== handIndex && p.hand[i] === card.benoetigteKarte) return i;
    }
    return -1;
};

// Fusionsmaterial-Plan: {feld:[zoneIdx], hand:[handIdx], key:handIdx|-1} oder null.
// benoetigteKarte ist bei Fusion OPTIONAL: leer = "nur Material" (kein Zauber noetig).
Game_TCGBattle.prototype.fusionPlan = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || card.monsterArt !== 'fusion') return null;
    var usedHand = {};
    usedHand[handIndex] = true;
    var keyIdx = -1;
    if (card.benoetigteKarte) {
        keyIdx = this.keyIndex(handIndex);
        if (keyIdx < 0) return null; // Zauber verlangt, aber nicht auf der Hand
        usedHand[keyIdx] = true;
    }
    var plan = { feld: [], hand: [], key: keyIdx };
    var mats = card.fusionsMaterial || [];
    for (var m = 0; m < mats.length; m++) {
        var req = mats[m];
        var need = Number(req.anzahl) || 1;
        // zuerst vom Feld nehmen
        for (var z = 0; z < 3 && need > 0; z++) {
            var slot = p.zones[z];
            if (slot && plan.feld.indexOf(z) < 0 && TCG.materialMatches(req, slot.id)) {
                plan.feld.push(z);
                need--;
            }
        }
        // dann von der Hand
        for (var hIdx = 0; hIdx < p.hand.length && need > 0; hIdx++) {
            if (usedHand[hIdx]) continue;
            if (TCG.materialMatches(req, p.hand[hIdx])) {
                usedHand[hIdx] = true;
                plan.hand.push(hIdx);
                need--;
            }
        }
        if (need > 0) return null;
    }
    // Nach Verbrauch muss eine Zone frei sein
    var freeAfter = 3 - (this.ownMonsterCount(this._active) - plan.feld.length);
    if (freeAfter <= 0) return null;
    if (!this.hasTokens(this._active, card.tokenKosten)) return null;
    if (this.graveyardPlan(this._active, card.ablageKosten) === null) return null;
    return plan;
};

Game_TCGBattle.prototype.canFusion = function(handIndex) {
    return !!this.fusionPlan(handIndex);
};

// Konsum-Schritte: bezahlen/verbrauchen, Karte "schwebt" bis zur Zonenwahl.
// Ablage-Kosten werden IMMER VOR dem jeweiligen Tribut/Material-Abwurf geplant,
// damit eine Karte niemals ihre eigenen frisch entstandenen Ablage-Karten
// (z.B. den eigenen Tribut) fuer ihre eigenen Ablage-Kosten verwenden kann.
Game_TCGBattle.prototype.beginNormalSummon = function(handIndex, tributeZone, payMethod) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var gravePlan = this.graveyardPlan(this._active, card.ablageKosten);
    var paidWithToken = this.payMonsterAP(this._active, card, payMethod);
    this.consumeTokens(this._active, card.tokenKosten);
    if (tributeZone !== null && tributeZone !== undefined && tributeZone >= 0) {
        this.sendToGrave(this._active, tributeZone);
    }
    this.consumeGraveyard(this._active, gravePlan);
    this._floating = p.hand.splice(handIndex, 1)[0];
    return paidWithToken;
};

Game_TCGBattle.prototype.beginRitual = function(handIndex, tributeZone, payMethod) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var keyIdx = this.keyIndex(handIndex);
    var gravePlan = this.graveyardPlan(this._active, card.ablageKosten);
    var paidWithToken = this.payMonsterAP(this._active, card, payMethod);
    this.consumeTokens(this._active, card.tokenKosten);
    this.removeHandByIndices(p, [keyIdx], true);
    this.sendToGrave(this._active, tributeZone);
    this.consumeGraveyard(this._active, gravePlan);
    var newIdx = p.hand.indexOf(card.id);
    this._floating = p.hand.splice(newIdx, 1)[0];
    return paidWithToken;
};

Game_TCGBattle.prototype.beginFusion = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var plan = this.fusionPlan(handIndex);
    var gravePlan = this.graveyardPlan(this._active, card.ablageKosten);
    var self = this;
    plan.feld.forEach(function(z) { self.sendToGrave(self._active, z); });
    var handIndices = plan.hand.slice();
    if (plan.key >= 0) handIndices.push(plan.key);
    this.removeHandByIndices(p, handIndices, true);
    this.consumeGraveyard(this._active, gravePlan);
    this.consumeTokens(this._active, card.tokenKosten);
    var newIdx = p.hand.indexOf(card.id);
    this._floating = p.hand.splice(newIdx, 1)[0];
};

// Entfernt Handkarten anhand von Indizes (absteigend sortiert), optional in die Ablage
Game_TCGBattle.prototype.removeHandByIndices = function(p, indices, toGrave) {
    indices.slice().sort(function(a, b) { return b - a; }).forEach(function(i) {
        var id = p.hand.splice(i, 1)[0];
        if (toGrave) p.grave.push(id);
    });
};

// Schwebende Karte in eine leere Zone setzen. Rueckgabe: beimBeschwoeren-Trigger.
Game_TCGBattle.prototype.placeFloating = function(zoneIndex) {
    var p = this.activePlayer();
    if (!this._floating || p.zones[zoneIndex]) return [];
    p.zones[zoneIndex] = {
        id: this._floating, atkMod: 0, lpMod: 0, damage: 0, equips: [],
        attacked: false, effectUsed: false, summonedTurn: this._turnCount
    };
    this._floating = null;
    return this.slotEffects(this._active, zoneIndex, 'beimBeschwoeren');
};

// Stellt den kompletten Spielerzustand aus einem zuvor gesicherten Snapshot
// wieder her (siehe Scene_TCGBattle.prototype.snapshotBeforeSummon) - fuer
// den echten Beschwoerungs-Abbruch mit voller Kostenerstattung.
Game_TCGBattle.prototype.restorePlayer = function(side, snapshot) {
    this._players[side] = snapshot;
};

// Verwirft eine noch nicht platzierte "schwebende" Karte, ohne sie irgendwo
// abzulegen (wird beim Beschwoerungs-Abbruch zusammen mit restorePlayer
// aufgerufen - die Karte liegt durch den Snapshot bereits wieder in der Hand).
Game_TCGBattle.prototype.clearFloating = function() {
    this._floating = null;
};

//--- Zauber & Ausruestung -----------------------------------------------------
Game_TCGBattle.prototype.canPlaySpell = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || card.kartenTyp !== 'zauber') return false;
    if (p.ap < card.apKosten) return false;
    return (card.effekte || []).some(function(e) { return e.trigger === 'beimSpielen'; });
};

Game_TCGBattle.prototype.playSpell = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var self = this;
    p.ap -= card.apKosten;
    p.hand.splice(handIndex, 1);
    p.grave.push(card.id);
    return (card.effekte || []).filter(function(e) {
        return e.trigger === 'beimSpielen' && self.conditionMet(self._active, e);
    }).map(function(e) { return { side: self._active, effect: e }; });
};

Game_TCGBattle.prototype.canEquip = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    return !!card && card.kartenTyp === 'ausruestung' &&
           p.ap >= card.apKosten && this.ownMonsterCount(this._active) > 0;
};

Game_TCGBattle.prototype.equip = function(handIndex, zoneIndex) {
    var p = this.activePlayer();
    var slot = p.zones[zoneIndex];
    if (!slot) return;
    var card = TCG.card(p.hand[handIndex]);
    p.ap -= card.apKosten;
    p.hand.splice(handIndex, 1);
    slot.equips.push(card.id);
};

//--- Aktivierbare Effekte -----------------------------------------------------
Game_TCGBattle.prototype.activatableEffects = function(zoneIndex) {
    return this.slotEffects(this._active, zoneIndex, 'aktivierbar');
};

Game_TCGBattle.prototype.canActivate = function(zoneIndex) {
    var p = this.activePlayer();
    var slot = p.zones[zoneIndex];
    if (!slot || slot.effectUsed || this._phase !== 'main') return false;
    var effects = this.activatableEffects(zoneIndex);
    if (effects.length === 0) return false;
    var effect = effects[0].effect;
    if (p.ap < (Number(effect.apKosten) || 0)) return false;
    if (this.graveyardPlan(this._active, effect.ablageKosten) === null) return false;
    if (!this.hasTokens(this._active, effect.tokenKosten)) return false;
    return true;
};

Game_TCGBattle.prototype.activate = function(zoneIndex) {
    var p = this.activePlayer();
    var effects = this.activatableEffects(zoneIndex);
    var effect = effects[0].effect;
    p.zones[zoneIndex].effectUsed = true;
    p.ap -= (Number(effect.apKosten) || 0);
    this.consumeGraveyard(this._active, this.graveyardPlan(this._active, effect.ablageKosten));
    this.consumeTokens(this._active, effect.tokenKosten);
    return effects;
};

//--- Effekt-Aufloesung --------------------------------------------------------

// Aktionen, die ueberhaupt ein Ziel-Monster brauchen (im Gegensatz zu ziehen/
// apPlus/schaden/heilen/tokenPlus/tokenMinus/suche, die kein Monster als Ziel
// haben).
TCG.ZIEL_AKTIONEN = ['monsterSchaden', 'lpBuff', 'atkBuff', 'atkDebuff', 'zerstoeren', 'verbannen'];

// Abwaertskompatibler Standard fuer Karten ohne explizit gesetztes zielSeite
// (entspricht dem fruehren, fest verdrahteten Verhalten).
TCG.defaultZielSeite = function(aktion) {
    switch (aktion) {
        case 'atkBuff':
        case 'lpBuff': return 'verbuendeter';
        case 'atkDebuff':
        case 'zerstoeren':
        case 'verbannen':
        case 'monsterSchaden': return 'gegner';
        default: return 'gegner';
    }
};

Game_TCGBattle.prototype.needsZielMonster = function(effect) {
    return TCG.ZIEL_AKTIONEN.indexOf(effect.aktion) >= 0;
};

// Liefert die ABSOLUTE Seite (0/1), auf der die Ziel-Zonen liegen - "side" ist
// die Seite des ausloesenden Spielers/Effekts.
Game_TCGBattle.prototype.resolveZielSeite = function(effect, side) {
    var z = effect.zielSeite || TCG.defaultZielSeite(effect.aktion);
    switch (z) {
        case 'gegner':
        case 'alleGegnerische': return this.enemyIndex(side);
        default: return side; // selbst, verbuendeter, alleEigene
    }
};

Game_TCGBattle.prototype.zielModus = function(effect) {
    return effect.zielSeite || TCG.defaultZielSeite(effect.aktion);
};

// Wie viele einzelne Ziele der Spieler nacheinander waehlen soll (nur relevant
// bei zielSeite "gegner"/"verbuendeter" - bei "alle*"/"selbst" irrelevant).
Game_TCGBattle.prototype.effectTargetCount = function(effect) {
    return Math.max(1, Math.min(3, Number(effect.zielAnzahl) || 1));
};

// "suche" bleibt ein eigener Sonderfall (Deck-Interaktion statt Monster-Ziel).
Game_TCGBattle.prototype.effectTargetType = function(effect) {
    if (effect.aktion === 'suche') return 'search';
    if (this.needsZielMonster(effect)) return 'ziel';
    return null;
};

Game_TCGBattle.prototype.searchMatches = function(side, effect) {
    var deck = this._players[side].deck;
    var matches = [];
    for (var i = 0; i < deck.length; i++) {
        var card = TCG.card(deck[i]);
        if (!card) continue;
        if (effect.filterElement && effect.filterElement !== 'beliebig' &&
            card.element !== effect.filterElement) continue;
        var st = Number(effect.filterStufe) || 0;
        if (st > 0 && (!TCG.isMonster(card) || card.stufe !== st)) continue;
        matches.push({ deckIndex: i, card: card });
    }
    return matches;
};

Game_TCGBattle.prototype.takeFromDeck = function(side, deckIndex) {
    var p = this._players[side];
    var id = p.deck.splice(deckIndex, 1)[0];
    p.hand.push(id);
    TCG.shuffle(p.deck);
    return id;
};

// target: Zonen-Index oder null. Rueckgabe: Meldungstext + evtl. Folge-Trigger.
// targetSide/targetZone: ABSOLUTE Seite (0/1) und Zonen-Index des Ziel-Monsters
// (bei monsterSchaden/lpBuff/atkBuff/atkDebuff/zerstoeren/verbannen). Welche
// Seite das ist (eigene/gegnerische/beide je nach effect.zielSeite) entscheidet
// der Aufrufer (siehe resolveZielSeite) - resolveEffect selbst kennt nur noch
// "wo genau", nicht mehr "wessen Seite by default".
Game_TCGBattle.prototype.resolveEffect = function(side, effect, targetSide, targetZone) {
    var p = this._players[side];
    var eSide = this.enemyIndex(side);
    var e = this._players[eSide];
    var w = Number(effect.wert) || 0;
    switch (effect.aktion) {
        case 'ziehen': {
            var drawn = 0;
            for (var i = 0; i < w; i++) {
                if (p.deck.length === 0) break;
                p.hand.push(p.deck.shift());
                drawn++;
            }
            return { text: '+' + drawn + ' Karte(n)' };
        }
        case 'apPlus':
            p.ap = Math.min(TCG.param.apMax, p.ap + w);
            return { text: '+' + w + ' AP' };
        case 'schaden':
            e.lp = Math.max(0, e.lp - w);
            this.checkWin();
            return { text: w + ' Schaden!' };
        case 'heilen':
            p.lp = Math.min(TCG.param.startLP, p.lp + w);
            return { text: '+' + w + ' LP' };
        case 'monsterSchaden': {
            var slot = this._players[targetSide].zones[targetZone];
            if (!slot) return { text: 'Kein Ziel' };
            var name = TCG.card(slot.id).name;
            slot.damage += w;
            if (this.curLp(targetSide, targetZone) <= 0) {
                if (this.blocksDestruction(targetSide, targetZone, effect.trigger === 'beimSpielen')) {
                    slot.damage = this.maxLp(targetSide, targetZone) - 1; // ueberlebt mit 1 LP
                    return { text: name + ' widersteht der Zerstoerung!' };
                }
                var triggers = this.destroyTriggers(targetSide, targetZone, side, null);
                this.sendToGrave(targetSide, targetZone);
                return { text: name + ' zerstoert!', triggers: triggers };
            }
            var hurt = this.slotEffects(targetSide, targetZone, 'beimErleidenVonSchaden');
            return { text: w + ' Schaden an ' + name, triggers: hurt };
        }
        case 'lpBuff': {
            var own = this._players[targetSide].zones[targetZone];
            if (!own) return { text: 'Kein Ziel' };
            own.damage = Math.max(0, own.damage - w);
            return { text: TCG.card(own.id).name + ' +' + w + ' LP' };
        }
        case 'atkBuff':
            if (this._players[targetSide].zones[targetZone]) {
                this._players[targetSide].zones[targetZone].atkMod += w;
                return { text: TCG.card(this._players[targetSide].zones[targetZone].id).name + ' +' + w + ' ATK' };
            }
            return { text: 'Kein Ziel' };
        case 'atkDebuff':
            if (this._players[targetSide].zones[targetZone]) {
                this._players[targetSide].zones[targetZone].atkMod -= w;
                return { text: TCG.card(this._players[targetSide].zones[targetZone].id).name + ' -' + w + ' ATK' };
            }
            return { text: 'Kein Ziel' };
        case 'zerstoeren':
            if (this._players[targetSide].zones[targetZone]) {
                var dName = TCG.card(this._players[targetSide].zones[targetZone].id).name;
                if (this.blocksDestruction(targetSide, targetZone, effect.trigger === 'beimSpielen')) {
                    return { text: dName + ' widersteht der Zerstoerung!' };
                }
                var dTriggers = this.destroyTriggers(targetSide, targetZone, side, null);
                this.sendToGrave(targetSide, targetZone);
                return { text: dName + ' zerstoert!', triggers: dTriggers };
            }
            return { text: 'Kein Ziel' };
        case 'verbannen':
            if (this._players[targetSide].zones[targetZone]) {
                var bName = TCG.card(this._players[targetSide].zones[targetZone].id).name;
                this.banish(targetSide, targetZone);
                return { text: bName + ' verbannt!' };
            }
            return { text: 'Kein Ziel' };
        case 'suche':
            return { text: null };
        case 'tokenPlus':
            this.addTokens(side, effect.tokenTyp, w);
            return { text: '+' + w + ' ' + TCG.tokenName(effect.tokenTyp) };
        case 'tokenMinus':
            this.addTokens(side, effect.tokenTyp, -w);
            return { text: '-' + w + ' ' + TCG.tokenName(effect.tokenTyp) };
        case 'mahlen': {
            var milled = 0;
            for (var m = 0; m < w; m++) {
                if (p.deck.length === 0) break;
                p.grave.push(p.deck.shift());
                milled++;
            }
            return { text: milled + ' Karte(n) ins Grab gelegt' };
        }
        case 'tokenSummon': {
            var tokenSide = side;
            var emptyZone = -1;
            for (var tz = 0; tz < 3; tz++) {
                if (!this._players[tokenSide].zones[tz]) { emptyZone = tz; break; }
            }
            if (emptyZone < 0 || !effect.tokenKartenId || !TCG.card(effect.tokenKartenId)) {
                return { text: 'Kein Platz für Token' };
            }
            this._players[tokenSide].zones[emptyZone] = {
                id: effect.tokenKartenId, atkMod: 0, lpMod: 0, damage: 0, equips: [],
                attacked: false, effectUsed: false, summonedTurn: this._turnCount
            };
            return { text: TCG.card(effect.tokenKartenId).name + ' beschworen!' };
        }
        case 'reviveGrave': {
            var grave = p.grave;
            var reviveIdx = -1;
            for (var gi = grave.length - 1; gi >= 0; gi--) {
                var gc = TCG.card(grave[gi]);
                if (gc && gc.kartenTyp === 'monster' && (!effect.archetyp || gc.archetyp === effect.archetyp)) {
                    reviveIdx = gi;
                    break;
                }
            }
            if (reviveIdx < 0) return { text: 'Kein passendes Monster im Friedhof' };
            var reviveZone = -1;
            for (var rz = 0; rz < 3; rz++) { if (!p.zones[rz]) { reviveZone = rz; break; } }
            if (reviveZone < 0) return { text: 'Kein Platz zum Wiederbeleben' };
            var revivedId = grave.splice(reviveIdx, 1)[0];
            p.zones[reviveZone] = {
                id: revivedId, atkMod: 0, lpMod: 0, damage: 0, equips: [],
                attacked: false, effectUsed: false, summonedTurn: this._turnCount
            };
            return { text: TCG.card(revivedId).name + ' wiederbelebt!' };
        }
        default:
            return { text: null };
    }
};

// Trigger bei Zerstoerung: Opfer "beiZerstoerung", Verursacher-Monster "beimZerstoeren"
Game_TCGBattle.prototype.destroyTriggers = function(victimSide, victimZone, killerSide, killerZone) {
    var list = this.slotEffects(victimSide, victimZone, 'beiZerstoerung');
    if (killerZone !== null && killerZone !== undefined && killerZone >= 0) {
        list = list.concat(this.slotEffects(killerSide, killerZone, 'beimZerstoeren'));
    }
    return list;
};

// Monster (mit Ausruestungen) in die Ablage
Game_TCGBattle.prototype.sendToGrave = function(side, zoneIndex) {
    var p = this._players[side];
    var slot = p.zones[zoneIndex];
    if (!slot) return;
    var card = TCG.card(slot.id);
    var revival = (card.effekte || []).filter(function(e) {
        return e.trigger === 'beiZerstoerung' && e.aktion === 'verzoegerteWiederbelebung';
    })[0];
    if (revival) {
        // Landet NICHT im Friedhof, sondern in einer Warteschlange - wird
        // nach "wert" eigenen Zugbeginnen automatisch wiederbeschworen (siehe
        // startTurn). Ausruestungen gehen trotzdem regulaer in den Friedhof.
        (slot.equips || []).forEach(function(id) { p.grave.push(id); });
        if (!p.pendingRevival) p.pendingRevival = [];
        p.pendingRevival.push({ cardId: slot.id, turnsLeft: Math.max(1, Number(revival.wert) || 1) });
        p.zones[zoneIndex] = null;
        return;
    }
    (slot.equips || []).forEach(function(id) { p.grave.push(id); });
    p.grave.push(slot.id);
    p.zones[zoneIndex] = null;
};

// Monster ins Exil (Ausruestungen in die Ablage)
Game_TCGBattle.prototype.banish = function(side, zoneIndex) {
    var p = this._players[side];
    var slot = p.zones[zoneIndex];
    if (!slot) return;
    (slot.equips || []).forEach(function(id) { p.grave.push(id); });
    p.exile.push(slot.id);
    p.zones[zoneIndex] = null;
};

//--- Kampf --------------------------------------------------------------------
Game_TCGBattle.prototype.canAttack = function(zoneIndex) {
    var p = this.activePlayer();
    var slot = p.zones[zoneIndex];
    return this._phase === 'battle' && !!slot &&
           (slot.attacked || 0) < this.maxAttacksPerTurn(this._active, zoneIndex) &&
           p.ap >= TCG.param.attackCost;
};

// Wie oft ein Monster pro Zug angreifen darf - Standard 1, hoeher bei einem
// dauerhaft-Effekt "mehrfachAngriff" (wert = maximale Angriffe pro Zug).
Game_TCGBattle.prototype.maxAttacksPerTurn = function(side, zone) {
    var slot = this._players[side].zones[zone];
    if (!slot) return 1;
    var effects = TCG.card(slot.id).effekte || [];
    var max = 1;
    for (var i = 0; i < effects.length; i++) {
        var ef = effects[i];
        if (ef.trigger === 'dauerhaft' && ef.aktion === 'mehrfachAngriff') {
            max = Math.max(max, Number(ef.wert) || 1);
        }
    }
    return max;
};

// Prueft, ob eine anstehende Zerstoerung durch eine Schutz-Eigenschaft der
// Zielkarte verhindert wird - und "verbraucht" den Schutz ggf. (bei
// "zerstoerungsschutz" gilt das nur einmal pro Kampf, danach normal
// zerstoerbar). "viaSpell" = true, wenn die aktuelle Aktion von einem
// Zauber ausgeloest wurde (effect.trigger === 'beimSpielen').
Game_TCGBattle.prototype.blocksDestruction = function(side, zone, viaSpell) {
    var slot = this._players[side].zones[zone];
    if (!slot) return false;
    var effects = TCG.card(slot.id).effekte || [];
    if (viaSpell && effects.some(function(e) { return e.trigger === 'dauerhaft' && e.aktion === 'zauberImmun'; })) {
        return true;
    }
    var hasShield = effects.some(function(e) { return e.trigger === 'dauerhaft' && e.aktion === 'zerstoerungsschutz'; });
    if (hasShield && !slot.destroyShieldUsed) {
        slot.destroyShieldUsed = true;
        return true;
    }
    return false;
};

Game_TCGBattle.prototype.enemyHasMonsters = function() {
    return this.ownMonsterCount(this.enemyIndex(this._active)) > 0;
};

// Angriff. defZone = -1 -> Direktangriff. Rueckgabe {text, triggers}
Game_TCGBattle.prototype.attack = function(atkZone, defZone) {
    var atkSide = this._active;
    var defSide = this.enemyIndex(atkSide);
    var attacker = this.slot(atkSide, atkZone);
    if (!attacker) return { text: '', triggers: [] };
    this._players[atkSide].ap -= TCG.param.attackCost;
    attacker.attacked = (attacker.attacked || 0) + 1;
    var atkCard = TCG.card(attacker.id);
    var triggers = this.slotEffects(atkSide, atkZone, 'beimAngriff');

    if (defZone < 0) {
        var dmg = this.effAtk(atkSide, atkZone);
        this._players[defSide].lp = Math.max(0, this._players[defSide].lp - dmg);
        this.checkWin();
        return { text: atkCard.name + ' greift direkt an: ' + dmg + ' Schaden!',
                 triggers: triggers };
    }

    var defender = this.slot(defSide, defZone);
    if (!defender) return { text: '', triggers: [] };
    var defCard = TCG.card(defender.id);
    var mod = TCG.elementMod(atkCard.element, defCard.element);
    var damage = Math.max(0, this.effAtk(atkSide, atkZone) + mod);
    var lpBefore = this.curLp(defSide, defZone);
    defender.damage += damage;
    var text;
    if (this.curLp(defSide, defZone) <= 0) {
        if (this.blocksDestruction(defSide, defZone, false)) {
            defender.damage = this.maxLp(defSide, defZone) - 1; // ueberlebt mit 1 LP
            text = defCard.name + ' widersteht der Zerstoerung!';
        } else {
            var overflow = damage - lpBefore;
            triggers = triggers.concat(this.destroyTriggers(defSide, defZone, atkSide, atkZone));
            this.sendToGrave(defSide, defZone);
            if (overflow > 0) {
                this._players[defSide].lp = Math.max(0, this._players[defSide].lp - overflow);
            }
            text = defCard.name + ' zerstoert!' + (overflow > 0 ? ' (' + overflow + ' Ueberschuss)' : '');
        }
    } else {
        triggers = triggers.concat(this.slotEffects(defSide, defZone, 'beimErleidenVonSchaden'));
        text = damage + ' Schaden an ' + defCard.name;
    }
    if (mod !== 0) text += ' [Element ' + (mod > 0 ? '+' : '') + mod + ']';
    this.checkWin();
    return { text: text, triggers: triggers };
};

Game_TCGBattle.prototype.checkWin = function() {
    if (this._winner >= 0) return;
    if (this._players[0].lp <= 0) this._winner = 1;
    else if (this._players[1].lp <= 0) this._winner = 0;
};

//--- KI -----------------------------------------------------------------------
Game_TCGBattle.prototype.aiNextAction = function() {
    var side = this._active;
    var p = this._players[side];

    if (this._phase === 'main') {
        var h;
        // 1. Nuetzlicher Zauber
        for (h = 0; h < p.hand.length; h++) {
            var card = TCG.card(p.hand[h]);
            if (card && card.kartenTyp === 'zauber' && this.canPlaySpell(h) &&
                this.aiSpellUseful(side, card)) {
                return { type: 'spell', hand: h };
            }
        }
        // 2. Fusion
        for (h = 0; h < p.hand.length; h++) {
            if (this.canFusion(h)) return { type: 'fusion', hand: h };
        }
        // 3. Ritual (nur wenn ein gueltiges, schwaecheres Tributopfer vorhanden ist)
        for (h = 0; h < p.hand.length; h++) {
            if (this.canRitual(h)) {
                var rCard = TCG.card(p.hand[h]);
                var weakest = this.aiWeakestMatchingZone(side, rCard);
                if (weakest !== null && TCG.card(p.zones[weakest].id).atk < rCard.atk) {
                    return { type: 'ritual', hand: h, tribute: weakest };
                }
            }
        }
        // 4. Staerkstes bezahlbares Normal-Monster
        var best = -1, bestAtk = -1, bestTribute = null;
        for (h = 0; h < p.hand.length; h++) {
            var m = TCG.card(p.hand[h]);
            if (!m || !TCG.isMonster(m) || m.monsterArt !== 'normal') continue;
            if (!this.canNormalSummon(h)) continue;
            if (TCG.needsTribute(m)) {
                var weak = this.aiWeakestZone(side);
                if (weak === null || TCG.card(p.zones[weak].id).atk >= m.atk) continue;
                if (m.atk > bestAtk) { bestAtk = m.atk; best = h; bestTribute = weak; }
            } else if (m.atk > bestAtk) {
                bestAtk = m.atk; best = h; bestTribute = null;
            }
        }
        if (best >= 0) return { type: 'summon', hand: best, tribute: bestTribute };
        // 5. Ausruestung auf staerkstes Monster
        for (h = 0; h < p.hand.length; h++) {
            if (this.canEquip(h)) {
                return { type: 'equip', hand: h, zone: this.aiStrongestZone(side) };
            }
        }
        // 6. Aktivierbare Effekte
        for (var z = 0; z < 3; z++) {
            if (this.canActivate(z)) return { type: 'activate', zone: z };
        }
        // 7. Kampfphase
        if (this.battleAllowed() && this.aiBestAttack()) return { type: 'toBattle' };
        return { type: 'endTurn' };
    }

    if (this._phase === 'battle') {
        var plan = this.aiBestAttack();
        if (plan) return { type: 'attack', zone: plan.zone, target: plan.target };
        return { type: 'endTurn' };
    }
    return { type: 'endTurn' };
};

Game_TCGBattle.prototype.aiSpellUseful = function(side, card) {
    var p = this._players[side];
    var e = this._players[this.enemyIndex(side)];
    var self = this;
    return (card.effekte || []).some(function(ef) {
        if (ef.trigger !== 'beimSpielen') return false;
        switch (ef.aktion) {
            case 'ziehen':        return p.deck.length > 0;
            case 'apPlus':        return Number(ef.wert) > card.apKosten;
            case 'schaden':       return true;
            case 'heilen':        return p.lp < TCG.param.startLP;
            case 'monsterSchaden':
            case 'zerstoeren':
            case 'verbannen':
            case 'atkDebuff':     return e.zones.some(function(z) { return !!z; });
            case 'atkBuff':
            case 'lpBuff':        return p.zones.some(function(z) { return !!z; });
            case 'suche':         return self.searchMatches(side, ef).length > 0;
            case 'tokenPlus':     return true;
            case 'tokenMinus':    return false;
            default:              return false;
        }
    });
};

Game_TCGBattle.prototype.aiWeakestZone = function(side) {
    var zones = this._players[side].zones;
    var best = null, bestAtk = Infinity;
    for (var i = 0; i < 3; i++) {
        if (zones[i] && this.effAtk(side, i) < bestAtk) {
            bestAtk = this.effAtk(side, i);
            best = i;
        }
    }
    return best;
};

// Wie aiWeakestZone, aber nur unter Zonen, die die ritualTribut-Anforderung
// der gegebenen Ritualkarte erfuellen.
Game_TCGBattle.prototype.aiWeakestMatchingZone = function(side, ritualCard) {
    var zones = this._players[side].zones;
    var best = null, bestAtk = Infinity;
    for (var i = 0; i < 3; i++) {
        if (!zones[i]) continue;
        if (!this.tributeMatches(ritualCard, i)) continue;
        if (this.effAtk(side, i) < bestAtk) {
            bestAtk = this.effAtk(side, i);
            best = i;
        }
    }
    return best;
};

Game_TCGBattle.prototype.aiStrongestZone = function(side, excludeZones) {
    var zones = this._players[side].zones;
    var best = null, bestAtk = -1;
    for (var i = 0; i < 3; i++) {
        if (excludeZones && excludeZones.indexOf(i) >= 0) continue;
        if (zones[i] && this.effAtk(side, i) > bestAtk) {
            bestAtk = this.effAtk(side, i);
            best = i;
        }
    }
    return best;
};

// Bester Angriff: toete moeglichst das staerkste Monster, sonst maximaler Schaden.
Game_TCGBattle.prototype.aiBestAttack = function() {
    var side = this._active;
    var defSide = this.enemyIndex(side);
    var p = this._players[side];
    var e = this._players[defSide];
    if (p.ap < TCG.param.attackCost) return null;
    var enemyHas = e.zones.some(function(z) { return !!z; });

    for (var z = 0; z < 3; z++) {
        var slot = p.zones[z];
        if (!slot || (slot.attacked || 0) >= this.maxAttacksPerTurn(side, z)) continue;
        var atkCard = TCG.card(slot.id);
        var myAtk = this.effAtk(side, z);
        if (myAtk <= 0) continue;
        if (!enemyHas) return { zone: z, target: -1 };
        var bestKill = -1, bestKillAtk = -1, bestDmg = -1, bestDmgTarget = -1;
        for (var t = 0; t < 3; t++) {
            if (!e.zones[t]) continue;
            var defCard = TCG.card(e.zones[t].id);
            var dmg = Math.max(0, myAtk + TCG.elementMod(atkCard.element, defCard.element));
            if (dmg >= this.curLp(defSide, t)) {
                var tAtk = this.effAtk(defSide, t);
                if (tAtk > bestKillAtk) { bestKillAtk = tAtk; bestKill = t; }
            }
            if (dmg > bestDmg) { bestDmg = dmg; bestDmgTarget = t; }
        }
        if (bestKill >= 0) return { zone: z, target: bestKill };
        if (bestDmg > 0) return { zone: z, target: bestDmgTarget };
    }
    return null;
};

// KI: Zone fuer Beschwoerung (Auren mit "angrenzend" bevorzugen die Mitte)
Game_TCGBattle.prototype.aiPickZone = function(cardId) {
    var zones = this.activePlayer().zones;
    var card = TCG.card(cardId);
    var wantsMiddle = (card.effekte || []).some(function(e) {
        return e.trigger === 'dauerhaft' && e.bereich === 'angrenzend';
    });
    if (wantsMiddle && !zones[1]) return 1;
    for (var i = 0; i < 3; i++) if (!zones[i]) return i;
    return 0;
};

// KI loest eine Trigger-Liste vollautomatisch auf.
Game_TCGBattle.prototype.aiResolveEffects = function(entries) {
    var self = this;
    var texts = [];
    (entries || []).forEach(function(entry) {
        var side = entry.side;
        var ef = entry.effect;
        var type = self.effectTargetType(ef);
        if (type === 'search') {
            var count = Number(ef.wert) || 1;
            for (var i = 0; i < count; i++) {
                var matches = self.searchMatches(side, ef);
                if (matches.length === 0) break;
                matches.sort(function(a, b) { return (b.card.atk || 0) - (a.card.atk || 0); });
                var taken = self.takeFromDeck(side, matches[0].deckIndex);
                texts.push(TCG.card(taken).name + ' gesucht');
            }
            return;
        }
        if (type !== 'ziel') {
            // Kein Ziel-Monster noetig (ziehen/apPlus/schaden/heilen/tokenPlus/tokenMinus)
            var r0 = self.resolveEffect(side, ef, side, null);
            if (r0.text) texts.push(r0.text);
            if (r0.triggers) texts = texts.concat(self.aiResolveEffects(r0.triggers));
            return;
        }
        var modus = self.zielModus(ef);
        var targetSide = self.resolveZielSeite(ef, side);
        if (modus === 'selbst') {
            var srcZone = entry.sourceZone;
            if (srcZone === undefined || srcZone === null || !self.player(side).zones[srcZone]) return;
            var r1 = self.resolveEffect(side, ef, side, srcZone);
            if (r1.text) texts.push(r1.text);
            if (r1.triggers) texts = texts.concat(self.aiResolveEffects(r1.triggers));
        } else if (modus === 'alleEigene' || modus === 'alleGegnerische') {
            for (var z = 0; z < 3; z++) {
                if (!self.player(targetSide).zones[z]) continue;
                var r2 = self.resolveEffect(side, ef, targetSide, z);
                if (r2.text) texts.push(r2.text);
                if (r2.triggers) texts = texts.concat(self.aiResolveEffects(r2.triggers));
            }
        } else {
            // gegner/verbuendeter: KI waehlt bis zu effectTargetCount Ziele (staerkste zuerst,
            // bereits gewaehlte Zonen werden bei nicht-zerstoerenden Effekten ausgeschlossen)
            var remaining = self.effectTargetCount(ef);
            var chosen = [];
            while (remaining > 0) {
                var t = self.aiStrongestZone(targetSide, chosen);
                if (t === null) break;
                chosen.push(t);
                var r3 = self.resolveEffect(side, ef, targetSide, t);
                if (r3.text) texts.push(r3.text);
                if (r3.triggers) texts = texts.concat(self.aiResolveEffects(r3.triggers));
                remaining--;
            }
        }
    });
    return texts;
};

//=============================================================================
// Layout (wird beim Szenenstart aus der tatsaechlichen Aufloesung berechnet)
//=============================================================================
var L = { infoW: 220, zoneW: 84, zoneH: 118, zoneGap: 16, handScale: 0.36 };

// Hand-Faecher & Hover-Wachsen (Feintuning hier zentral anpassbar)
var HAND_ROTATION_STEP = 4 * Math.PI / 180; // Rotation pro Karte Abstand zur Mitte
var HAND_ARC_CURVE = 3.2;                   // je (Abstand zur Mitte)^2 * Wert -> Absenkung nach aussen
var HAND_HOVER_SCALE = 0.85;                // Zielgroesse der fokussierten Karte (Anteil der Originalgroesse)
var HAND_HOVER_LIFT = 46;                   // zusaetzliches Anheben der fokussierten Karte
var HAND_SHRINK_FACTOR = 0.82;              // Schrumpffaktor der uebrigen Karten bei Fokus
var HAND_GAP_PUSH = 30;                     // seitliches Ausweichen benachbarter Karten
var HAND_LERP = 0.28;                       // Animationsgeschwindigkeit (0-1, pro Frame)

// Anteil der Bildschirmhoehe fuer die Karteninfo (obere Haelfte des linken
// Panels) - der Rest (siehe Window_TCGLog) zeigt den Spielverlauf-Log
// darunter. WICHTIG: als FUNKTION (nicht als einmalig beim Laden der Datei
// berechneter fester Wert, wie TCG.Battle.computeLayout auch) - manche
// Aufloesungs-Plugins (z.B. SRD_GameUpgrade fuer eine eigene Screen-Groesse)
// aendern Graphics.boxWidth/boxHeight erst NACH dem anfaenglichen Skript-
// Laden. Eine einmalige Berechnung wuerde dann fuer immer die urspruengliche
// (oft falsche, z.B. 0) Hoehe einfrieren.
TCG.Battle.infoWindowHeight = function() {
    return Math.min(800, Math.floor(Graphics.boxHeight * 0.9));
};

// Oeffentlicher Lesezugriff auf das intern (privat) berechnete Layout-Objekt
// "L" - fuer andere Dateien (z.B. TCG_TagDuel.js), die dieselben Layout-
// Werte brauchen, aber in einem eigenen Sichtbarkeitsbereich liegen.
TCG.Battle.layout = function() { return L; };

TCG.Battle.computeLayout = function() {
    var bw = Graphics.boxWidth;
    var bh = Graphics.boxHeight;
    var scale = Math.min(bw / 816, bh / 624);
    L.zoneW      = Math.round(84 * scale);
    L.zoneH      = Math.round(118 * scale);
    L.zoneGap    = Math.round(16 * scale);
    L.infoW      = Math.round(220 * scale);
    L.handScale  = 0.36 * scale;
    L.uiScale    = scale;

    // Karteninfo (oben links) und Spielverlauf-Log (unten rechts): feste
    // Hoehe 800px (vom Nutzer vorgegeben), aber nie hoeher als 90% der
    // Bildschirmhoehe (Schutz vor Ueberlauf bei kleineren Aufloesungen).
    L.infoH = Math.min(TCG.Battle.infoWindowHeight(), bh - Math.round(96 * scale) - Math.round(40 * scale));
    // Phasenleiste: zurueck unten rechts, Befehle UNTEREINANDER (vertikal),
    // direkt UNTER dem Log. Reservierter Platz fuer bis zu 2 gestapelte
    // Befehlszeilen (Ziehen/Aufgeben bzw. Kampfphase/Zug beenden).
    L.phaseBarH = Math.round(96 * scale);
    L.logW  = L.infoW;
    // Obere Kante des Log-Fensters bleibt UNVERAENDERT (dieselbe Formel wie
    // zuvor) - nur die Hoehe schrumpft, um unten Platz fuer die
    // Phasenleiste zu schaffen.
    L.logY  = bh - TCG.Battle.infoWindowHeight();
    L.logH  = TCG.Battle.infoWindowHeight() - L.phaseBarH;
    L.logX  = bw - L.logW;
    L.phaseBarX = L.logX;
    L.phaseBarY = L.logY + L.logH;

    // Spielfeld liegt zwischen der linken Karteninfo-Spalte und der
    // rechten Log-Spalte - beide gleich breit (L.infoW).
    L.fieldX      = L.infoW;
    L.fieldRightX = bw - L.infoW;
    L.fieldCenterX = (L.fieldX + L.fieldRightX) / 2;

    // Deck/Ablage-Stapel (frueher nahe am rechten Bildschirmrand) muessen
    // jetzt innerhalb von [fieldX, fieldRightX] liegen, damit sie nicht
    // vom neuen Log-Fenster ueberdeckt werden.
    L.pileLeftX   = L.fieldX + Math.round(20 * scale);
    L.pileRightX  = L.fieldRightX - Math.round(20 * scale) - L.zoneW;

    L.zoneStartX  = L.fieldX + Math.floor((L.fieldRightX - L.fieldX - (3 * L.zoneW + 2 * L.zoneGap)) / 2);

    // Mehr vertikaler Abstand zwischen den beiden Spielfeldern, mit
    // EXPLIZITER Platzreserve fuer die ATK/LP-Beschriftungen UNTER jeder
    // Zonenreihe (sonst werden diese abgeschnitten bzw. ueberlappen die
    // Phasenleiste/Handkarten - genau das gemeldete Problem).
    L.zoneInfoH   = Math.round(38 * scale); // Platz fuer ATK-Text + LP-Gauge + LP-Text unter einer Zone
    L.enemyZoneY  = Math.round(90 * scale);
    // Abstand zwischen den beiden Feldreihen: Platz fuer die gegnerische
    // Zonen-Info (ATK/LP unter den Zonen) plus etwas Luft - die
    // Phasenleiste liegt jetzt unten rechts, nicht mehr dazwischen.
    L.playerZoneY = L.enemyZoneY + L.zoneH + L.zoneInfoH + Math.round(40 * scale);

    // Eigenes HUD (Portraet+Name+LP+AP): in der LINKEN Spalte, UNTER der
    // Karteninfo (nicht mehr im Feldbereich - dort wuerde es die Handkarten
    // verdecken). Gegner-HUD: in der RECHTEN Spalte, UEBER dem Log-Fenster.
    L.hudW = L.infoW;
    L.ownHudH = Math.round(120 * scale);
    // Hand-Y wieder FEST von unten verankert (wie vor der letzten
    // Ueberarbeitung) - nicht mehr aus der Feldreihe abgeleitet, das
    // ruckte die Hand zu weit nach unten.
    L.handY       = bh - Math.round(150 * scale);
    L.ownHudX    = 0;
    L.ownHudY    = L.infoH + Math.round(16 * scale);
    L.enemyHudX  = bw - L.infoW;
    L.enemyHudY  = Math.round(10 * scale);

    L.toastY      = L.enemyZoneY + L.zoneH + L.zoneInfoH + Math.round(6 * scale);

    // Bestaetigungsblock (Beschwoerung/Effekt-Aktivierung/Angriff-Ja-Nein):
    // Kartenvorschau LINKS, Ja/Nein-Fenster RECHTS davon - beide als EIN
    // gemeinsam zentrierter Block, damit sie sich nie ueberlappen. Liegt
    // als MODALE Ebene ueber allem anderen (siehe bringConfirmToFront) -
    // die genaue Y-Position darf daher ruhig ueber dem Feld liegen, das
    // wird beim Anzeigen automatisch mitverdunkelt.
    L.confirmCardW = Math.round(170 * scale);
    L.confirmCardScale = L.confirmCardW / TCG.param.cardW;
    L.confirmCardH = TCG.param.cardH * L.confirmCardScale;
    L.confirmWindowW = Math.round(196 * scale);
    L.confirmGap = Math.round(28 * scale);
    var confirmBlockW = L.confirmCardW + L.confirmGap + L.confirmWindowW;
    L.confirmBlockX = Math.round(L.fieldCenterX - confirmBlockW / 2);
    L.confirmY = Math.round((L.playerZoneY + L.handY) / 2 - L.confirmCardH / 2);
    L.confirmCardX = L.confirmBlockX;
    L.confirmWindowX = L.confirmBlockX + L.confirmCardW + L.confirmGap;
    // Rechte Spalte des Bestaetigungsblocks: OBEN der Hinweistext (was
    // gerade passiert, z.B. "Wirklich hier beschwoeren?"), DARUNTER die
    // Ja/Nein-Auswahl - nicht mehr Text unter allem.
    L.confirmHintH = Math.round(70 * scale);
    L.confirmHintY = L.confirmY;
    L.confirmWindowY = L.confirmY + L.confirmHintH + Math.round(10 * scale);

    // Handkarten werden ZENTRIERT im Feldbereich dargestellt (nicht mehr
    // linksbuendig wachsend) - damit sie bei vielen Karten nicht ins
    // Log-Fenster hineinragen, sondern gleichmaessig um die Mitte wachsen.
    L.handAreaW   = L.fieldRightX - L.fieldX - Math.round(24 * scale);
    L.handCenterX = L.fieldCenterX;

    L.uiScale = scale; // fuer Fensterschriftgroessen/-abstaende anderer Klassen zugaenglich
};

function zoneRect(side, index) {
    var y = side === 0 ? L.playerZoneY : L.enemyZoneY;
    return { x: L.zoneStartX + index * (L.zoneW + L.zoneGap), y: y, w: L.zoneW, h: L.zoneH };
}

function pointInRect(x, y, r) {
    return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

//=============================================================================
// Befehlsfenster
//=============================================================================
function Window_TCGCommand() { this.initialize.apply(this, arguments); }
Window_TCGCommand.prototype = Object.create(Window_Command.prototype);
Window_TCGCommand.prototype.constructor = Window_TCGCommand;

Window_TCGCommand.prototype.initialize = function(x, y, commands) {
    this._commands = commands;
    Window_Command.prototype.initialize.call(this, x, y);
    this.deactivate();
    this.hide();
};

Window_TCGCommand.prototype.windowWidth = function() { return Math.round(196 * L.uiScale); };

Window_TCGCommand.prototype.setup = function(commands) {
    this._commands = commands;
    this.height = this.fittingHeight(Math.max(1, commands.length));
    this.refresh();
    this.select(0);
};

Window_TCGCommand.prototype.makeCommandList = function() {
    var self = this;
    (this._commands || []).forEach(function(c) {
        self.addCommand(c.name, c.symbol, c.enabled !== false);
    });
};

//=============================================================================
// Phasenleiste - ersetzt die fruehere reine Zug/Phase-Textanzeige zwischen
// den beiden Spielfeldern. Zeigt dieselben Befehle wie bisher (kontext-
// abhaengig: Ziehen/Aufgeben zu Zugbeginn, Kampfphase/Zug beenden danach),
// aber horizontal (links nach rechts) statt als vertikale Liste. Ist per
// Standard NICHT aktiv (nur sichtbar) - Abbrechen/ESC aktiviert sie (siehe
// onCmdWindowCancel), waehrenddessen ist stattdessen das Feld anklickbar
// (siehe enterZoneNav/updateZoneNav).
//=============================================================================
// Suchfenster
//=============================================================================
function Window_TCGSearch() { this.initialize.apply(this, arguments); }
Window_TCGSearch.prototype = Object.create(Window_Selectable.prototype);
Window_TCGSearch.prototype.constructor = Window_TCGSearch;

Window_TCGSearch.prototype.initialize = function() {
    this._matches = [];
    this._onSelectionChange = null; // Scene setzt dies, um Hover-Info/Kartenvorschau zu aktualisieren
    var sw = Math.round(480 * L.uiScale);
    var sh = Math.min(Math.round(372 * L.uiScale), Graphics.boxHeight - Math.round(240 * L.uiScale));
    Window_Selectable.prototype.initialize.call(this,
        Math.round(L.fieldCenterX - sw / 2), Math.round((Graphics.boxHeight - sh) / 2), sw, sh);
    this.hide();
    this.deactivate();
};

Window_TCGSearch.prototype.setMatches = function(matches) {
    this._matches = matches;
    this.refresh();
    this.select(0);
    if (this._onSelectionChange) this._onSelectionChange(this.match());
};

Window_TCGSearch.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);
    if (this._onSelectionChange) this._onSelectionChange(this.match());
};

Window_TCGSearch.prototype.maxItems = function() { return this._matches.length; };
Window_TCGSearch.prototype.match = function() { return this._matches[this.index()]; };

Window_TCGSearch.prototype.drawItem = function(index) {
    var m = this._matches[index];
    var rect = this.itemRectForText(index);
    var card = m.card;
    var text = card.name;
    if (TCG.isMonster(card)) {
        text += '  (' + card.element + ', St ' + card.stufe + ', A' + card.atk + '/L' + card.lp + ')';
    } else {
        text += '  (' + TCG.typeLine(card) + ', ' + card.apKosten + ' AP)';
    }
    this.contents.fontSize = Math.round(18 * L.uiScale);
    this.changeTextColor(this.normalColor());
    this.drawText(text, rect.x, rect.y, rect.width);
    this.contents.fontSize = Math.round(28 * L.uiScale);
};

//=============================================================================
// Infofenster links
//=============================================================================
function Window_TCGInfo() { this.initialize.apply(this, arguments); }
Window_TCGInfo.prototype = Object.create(Window_Base.prototype);
Window_TCGInfo.prototype.constructor = Window_TCGInfo;

Window_TCGInfo.prototype.initialize = function() {
    Window_Base.prototype.initialize.call(this, 0, 0, L.infoW, TCG.Battle.infoWindowHeight());
    this._card = null;
};

Window_TCGInfo.prototype.setCard = function(card) {
    if (this._card === card) return;
    this._card = card;
    this.refresh();
};

Window_TCGInfo.prototype.refresh = function() {
    this.contents.clear();
    var card = this._card;
    var w = this.contents.width;
    if (!card) {
        this.changeTextColor(this.textColor(8));
        this.contents.fontSize = Math.round(20 * L.uiScale);
        this.drawText('Karteninfo', 0, 0, w, 'center');
        this.resetTextColor();
        this.contents.fontSize = Math.round(28 * L.uiScale);
        return;
    }
    var self = this;
    if (card.artwork) {
        var art = ImageManager.loadBitmap(TCG.param.artworkFolder, card.artwork);
        var expected = card;
        art.addLoadListener(function() {
            if (self._card !== expected) return;
            var maxW = w, maxH = Math.round(110 * L.uiScale);
            var s = Math.min(maxW / art.width, maxH / art.height);
            var dw = Math.round(art.width * s), dh = Math.round(art.height * s);
            self.contents.blt(art, 0, 0, art.width, art.height,
                Math.floor((maxW - dw) / 2), 0, dw, dh);
        });
    }
    var y = Math.round(116 * L.uiScale);
    this.contents.fontSize = Math.round(19 * L.uiScale);
    this.changeTextColor(this.systemColor());
    this.drawText(card.name, 0, y, w, 'left');
    y += Math.round(26 * L.uiScale);
    this.contents.fontSize = Math.round(15 * L.uiScale);
    this.contents.textColor = TCG.rarityColor(card.seltenheit);
    this.drawText(TCG.typeLine(card), 0, y, w, 'left');
    y += Math.round(22 * L.uiScale);
    this.contents.textColor = TCG.elementColor(card.element);
    this.drawText(card.element, 0, y, w, 'left');
    this.resetTextColor();
    if (TCG.isMonster(card)) {
        this.drawText('A ' + card.atk + ' / L ' + card.lp, 0, y, w, 'right');
        y += Math.round(22 * L.uiScale);
        this.contents.fontSize = Math.round(13 * L.uiScale);
        var costLines = TCG.wrapText(this.contents, 'Kosten: ' + TCG.describeSummon(card), w);
        for (var ci = 0; ci < costLines.length; ci++) {
            this.drawText(costLines[ci], 0, y, w, 'left');
            y += Math.round(16 * L.uiScale);
        }
        y += Math.round(6 * L.uiScale);
    } else {
        this.drawText(card.apKosten + ' AP', 0, y, w, 'right');
        y += Math.round(24 * L.uiScale);
        if (card.kartenTyp === 'ausruestung') {
            this.contents.fontSize = Math.round(13 * L.uiScale);
            this.drawText('Boni: +' + card.atk + ' ATK / +' + card.lp + ' LP', 0, y, w, 'left');
            y += Math.round(20 * L.uiScale);
        }
    }
    this.contents.fontSize = Math.round(14 * L.uiScale);
    var lines = TCG.wrapText(this.contents, card.effektText, w);
    for (var i = 0; i < lines.length && y < this.contents.height - 18; i++) {
        this.drawText(lines[i], 0, y, w, 'left');
        y += Math.round(18 * L.uiScale);
    }
    this.contents.fontSize = Math.round(28 * L.uiScale);
};

//=============================================================================
// Window_TCGLog - Spielverlauf (untere Haelfte, direkt unter Window_TCGInfo)
//-----------------------------------------------------------------------------
// Zeigt eine fortlaufende, chronologische Liste: welche Karte gespielt,
// welcher Effekt ausgeloest, welcher Zug/Spieler war dran. Speist sich aus
// Scene_TCGBattle.prototype.logEvent(text) - siehe dort.
//=============================================================================
function Window_TCGLog() { this.initialize.apply(this, arguments); }
Window_TCGLog.prototype = Object.create(Window_Base.prototype);
Window_TCGLog.prototype.constructor = Window_TCGLog;

Window_TCGLog.prototype.initialize = function() {
    Window_Base.prototype.initialize.call(this, L.logX, L.logY, L.logW, L.logH);
    this._entries = [];
    this.contents.fontSize = Math.round(14 * L.uiScale);
    this.refresh();
};

// entry: { text: string, header: bool (Zugwechsel-Markierung, farblich abgesetzt) }
Window_TCGLog.prototype.addEntry = function(text, header) {
    this._entries.push({ text: text, header: !!header });
    if (this._entries.length > 200) this._entries.shift(); // Speicher begrenzen
    this.refresh();
};

Window_TCGLog.prototype.clear = function() {
    this._entries = [];
    this.refresh();
};

Window_TCGLog.prototype.refresh = function() {
    this.contents.clear();
    var w = this.contents.width;
    this.contents.fontSize = Math.round(13 * L.uiScale);
    this.changeTextColor(this.textColor(8));
    this.drawText('Spielverlauf', 0, 0, w, 'left');
    this.resetTextColor();
    var lineH = Math.round(17 * L.uiScale);
    var top = Math.round(20 * L.uiScale);
    var maxLines = Math.max(0, Math.floor((this.contents.height - top) / lineH));
    var visible = this._entries.slice(Math.max(0, this._entries.length - maxLines));
    var y = top;
    for (var vi = 0; vi < visible.length; vi++) {
        var e = visible[vi];
        if (e.header) {
            this.changeTextColor(this.systemColor());
        } else {
            this.resetTextColor();
        }
        this.contents.fontSize = Math.round(13 * L.uiScale);
        var wrapped = TCG.wrapText(this.contents, e.text, w);
        for (var j = 0; j < wrapped.length; j++) {
            this.drawText(wrapped[j], 0, y, w, 'left');
            y += lineH;
        }
    }
    this.resetTextColor();
    this.contents.fontSize = Math.round(28 * L.uiScale);
};

//=============================================================================
// Window_TCGPileView - Uebersicht ueber Ablage & Exil eines Spielers
//=============================================================================
function Window_TCGPileView() { this.initialize.apply(this, arguments); }
Window_TCGPileView.prototype = Object.create(Window_Selectable.prototype);
Window_TCGPileView.prototype.constructor = Window_TCGPileView;

Window_TCGPileView.prototype.initialize = function() {
    this._rows = [];
    var w = 480;
    var h = Math.min(420, Graphics.boxHeight - 160);
    Window_Selectable.prototype.initialize.call(this,
        L.fieldX + Math.floor((Graphics.boxWidth - L.fieldX - w) / 2),
        Math.floor((Graphics.boxHeight - h) / 2), w, h);
    this.hide();
    this.deactivate();
};

Window_TCGPileView.prototype.setTitle = function(text) { this._title = text; };

// rows: Array aus {header:text} | {empty:true,label:text} | {id:kartenId,count:n}
Window_TCGPileView.prototype.setRows = function(rows) {
    this._rows = rows;
    this.refresh();
    this.select(0);
};

Window_TCGPileView.prototype.maxItems = function() { return this._rows.length; };
Window_TCGPileView.prototype.isCurrentItemEnabled = function() { return true; };

// Ruft (falls gesetzt) einen Hook auf, sobald sich die Auswahl aendert - damit
// die Scene das linke Karteninfo-Panel (Window_TCGInfo) synchron mit der
// gerade markierten Ablage-/Exil-Karte halten kann (Bild + Beschreibungstext,
// genau wie beim Hovern von Hand-/Feldkarten).
Window_TCGPileView.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);
    if (this._onSelectChange) this._onSelectChange(this.index());
};

Window_TCGPileView.prototype.drawItem = function(index) {
    var row = this._rows[index];
    if (!row) return;
    var rect = this.itemRectForText(index);
    if (row.header) {
        this.contents.fontSize = Math.round(17 * L.uiScale);
        this.changeTextColor(this.systemColor());
        this.drawText(row.header, rect.x, rect.y, rect.width, 'left');
        this.resetTextColor();
    } else if (row.empty) {
        this.contents.fontSize = Math.round(16 * L.uiScale);
        this.changeTextColor(this.textColor(8));
        this.drawText(row.label, rect.x + 14, rect.y, rect.width - 14, 'left');
        this.resetTextColor();
    } else {
        var card = TCG.card(row.id);
        if (!card) return;
        var text = card.name;
        if (TCG.isMonster(card)) {
            text += '  (' + card.element + ', St ' + card.stufe + ', A' + card.atk + '/L' + card.lp + ')';
        } else {
            text += '  (' + TCG.typeLine(card) + ')';
        }
        this.contents.fontSize = Math.round(16 * L.uiScale);
        this.changeTextColor(this.normalColor());
        this.drawText(text, rect.x + 14, rect.y, rect.width - 74, 'left');
        this.drawText('x' + row.count, rect.x, rect.y, rect.width, 'right');
    }
    this.contents.fontSize = Math.round(28 * L.uiScale);
};

//=============================================================================
// Scene_TCGBattle
//=============================================================================
function Scene_TCGBattle() { this.initialize.apply(this, arguments); }
window.Scene_TCGBattle = Scene_TCGBattle;

Scene_TCGBattle.prototype = Object.create(Scene_Base.prototype);
Scene_TCGBattle.prototype.constructor = Scene_TCGBattle;

// "Welche Seite handelt gerade fuer Eingaben" - beim 1v1-Duell immer 0
// (der Mensch, sobald er am Zug ist, IST active()===0 per Definition - hier
// aendert sich also nichts). Existiert als generische Stelle, damit
// Scene_TCGTagDuel (Hotseat, beide Seiten koennen "aktiv" sein) dieselbe
// Eingabe-/Interaktionslogik verlustfrei wiederverwenden kann, OHNE dass sich
// an der DARSTELLUNG (Seite 0 immer unten) irgendetwas aendert.
// WICHTIG: "meine Seite" ist IMMER Seite 0 - fest, nicht abhaengig davon,
// wer gerade am Zug ist. Frueher gab dies this._game.active() zurueck (die
// GERADE AKTIVE Seite) - das war ein echter Fehler: refreshAll()/refreshHand()
// werden auch WAEHREND des KI-Zugs bzw. des Zugs des Netzwerk-Gegners
// aufgerufen (um die Darstellung live zu aktualisieren), und haetten dabei
// versehentlich die Hand des Gegners im eigenen Handbereich gezeigt. Das
// Spiel-Datenmodell ist ohnehin schon konsequent so aufgebaut, dass "ich"
// immer Seite 0 bin (siehe isAiSide, TCG.Net.swapPerspective fuers
// Netzwerk) - Einzelduelle rotieren dadurch nie, die eigene Seite bleibt
// immer unten, die gegnerische Hand ist nie sichtbar.
Scene_TCGBattle.prototype.mySide = function() { return 0; };
Scene_TCGBattle.prototype.enemySide = function() { return this._game.enemyIndex(this.mySide()); };

// Ist "side" eine KI-gesteuerte Seite? Beim 1v1-Duell immer Seite 1 (wie
// bisher). Scene_TCGTagDuel ueberschreibt dies (in dieser Phase noch keine
// KI - beide Teams sind immer interaktiv/menschlich).
Scene_TCGBattle.prototype.isAiSide = function(side) { return side !== 0; };

Scene_TCGBattle.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
};

Scene_TCGBattle.prepare = function(opponentData) {
    Scene_TCGBattle._opponent = opponentData;
    Scene_TCGBattle._networkSetup = null;
};

// Netzwerk-Duell als HOST vorbereiten: opponentData = Gast-Info (Name+Deck
// im Array-Format), hub = die bestehende Kampfzonen-Verbindung, guestId =
// Profil-ID des Gasts, gegen den dieses Duell laeuft.
Scene_TCGBattle.prepareNetworkHost = function(opponentData, hub, guestId) {
    Scene_TCGBattle._opponent = opponentData;
    Scene_TCGBattle._networkSetup = { role: 'host', connection: hub, guestId: guestId };
};

// Netzwerk-Duell als GAST vorbereiten: initialSnapshot kommt vom Host
// (schon seitenvertauscht) und wird direkt als Startzustand uebernommen -
// das Platzhalter-"_opponent" hier wird dadurch sofort ueberschrieben.
// mySide: welche kanonische Seite (0/1) ICH bin - Standard 1 (normales
// Host<->Gast-Duell). Bei einem Gast-zu-Gast-Duell (siehe TCG.Net.DuelRelay)
// kann Teilnehmer A hier 0 uebergeben bekommen.
Scene_TCGBattle.prepareNetworkGuest = function(session, initialSnapshot, mySide, hostActorData) {
    Scene_TCGBattle._opponent = { name: 'Gastgeber', deck: [], actorData: hostActorData || null };
    Scene_TCGBattle._networkSetup = { role: 'guest', connection: session, initialSnapshot: initialSnapshot,
        mySide: (mySide === undefined || mySide === null) ? 1 : mySide };
};

// ZUSCHAUER: rein lesend, keine eigene Sitzplatz-Zuordnung. names optional
// (fuer die HUD-Anzeige "Spieler A vs. Spieler B" statt der generischen
// Deck-Namen).
Scene_TCGBattle.prepareNetworkSpectator = function(session, initialSnapshot, names) {
    Scene_TCGBattle._opponent = { name: (names && names[1]) || 'Spieler B', deck: [], actorData: null };
    Scene_TCGBattle._networkSetup = { role: 'spectator', connection: session, initialSnapshot: initialSnapshot };
};

Scene_TCGBattle.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    TCG.Battle.computeLayout();
    TCG.syncProfileFromCharacterCreator(); // aktualisiert das eigene Profil, falls Character Creator installiert
    var deck = TCG.activeDeck();
    this._game = new Game_TCGBattle(deck.cards, Scene_TCGBattle._opponent);
    var netSetup = Scene_TCGBattle._networkSetup;
    Scene_TCGBattle._networkSetup = null; // einmalig verbrauchen
    this._wait = 0;
    this._effectQueue = [];
    this._effectDone = null;
    this._searchRemaining = 0;
    this._selectedHand = -1;
    this._selectedZone = -1;
    this._navArea = 'hand';
    this._navFieldIndex = 0;
    this._pendingSummon = null;
    this._timerFrames = TCG.param.timerSeconds * 60;
    this._aiWait = 0;
    this.createBackground();
    this.createFieldSprites();
    this.createHandSprites();
    this.createPortraitSprites();
    this.createOverlays();
    this.createWindowLayer();
    this.createWindows();
    // HUD (Name/LP/AP) und Portraets explizit nach vorn holen, DANACH die
    // Handkarten - die Hand soll auf der Z-Achse ganz oben liegen (ueber
    // allem anderen), unabhaengig von der urspruenglichen Erzeugungs-
    // reihenfolge.
    this.addChild(this._hudSprite);
    this._portraitSprites.forEach(function(sp) { this.addChild(sp); }, this);
    this.addChild(this._handContainer);

    // Eigener, GANZ ZULETZT hinzugefuegter Fensterlayer NUR fuer die
    // beiden modalen FENSTER (Bestaetigung, Suche) - WICHTIG: ein
    // WindowLayer ist fuer ECHTE Window_Base-Instanzen gedacht (eigene
    // Masken-/Render-Logik); rohe Sprites (Verdunkelung, Kartenvorschau,
    // Beschriftung) bleiben normale Szenen-Kinder und werden separat, aber
    // ebenfalls GANZ ZULETZT hinzugefuegt. Da ALLES hier als allerletztes
    // Kind der Szene angelegt wird, liegt es garantiert ueber allem
    // anderen (Feld, HUD, Hand, Phasenleiste).
    this.addChild(this._dimSprite);
    this.addChild(this._bigCardSprite);
    this.addChild(this._confirmLabelSprite);
    this._modalLayer = new WindowLayer();
    this._modalLayer.move(this._windowLayer.x, this._windowLayer.y, this._windowLayer.width, this._windowLayer.height);
    this.addChild(this._modalLayer);
    this._modalLayer.addChild(this._confirmWindow);
    this._modalLayer.addChild(this._searchWindow);

    if (netSetup && netSetup.role === 'host') {
        this.setupNetworkHost(netSetup.connection, netSetup.guestId);
        this._netGuestId = netSetup.guestId;
        this._netAwaitingDuelStart = true;
        var self1 = this;
        this.startCoinFlipThenProceed(function(firstSeat) {
            self1._firstTurnSeat = firstSeat;
            self1._game.dealInitialHands();
            self1._state = 'intro';
            self1.refreshAll();
            self1.startShuffleAnimation();
        });
    } else if (netSetup && netSetup.role === 'guest') {
        this.setupNetworkGuest(netSetup.connection, netSetup.mySide);
        this._game.applySnapshot(netSetup.initialSnapshot);
        this.refreshAll();
        this.syncStateAfterSnapshot();
    } else if (netSetup && netSetup.role === 'spectator') {
        this.setupNetworkSpectator(netSetup.connection);
        this._game.applySnapshot(netSetup.initialSnapshot);
        this.refreshAll();
        this._state = 'spectating';
        this._cmdWindow.hide();
        this._cmdWindow.deactivate();
    } else {
        var self2 = this;
        this.startCoinFlipThenProceed(function(firstSeat) {
            self2._firstTurnSeat = firstSeat;
            self2._game.dealInitialHands();
            self2._state = 'intro';
            self2.refreshAll();
            self2.startShuffleAnimation();
        });
    }
};

//--- Aufbau -------------------------------------------------------------------
Scene_TCGBattle.prototype.createBackground = function() {
    this._backSprite = new Sprite();
    if (TCG.Battle.fieldImage) {
        this._backSprite.bitmap = ImageManager.loadBitmap('img/tcg/system/', TCG.Battle.fieldImage);
    } else {
        var bmp = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        bmp.gradientFillRect(0, 0, bmp.width, bmp.height, '#12203a', '#050a14', true);
        this._backSprite.bitmap = bmp;
    }
    this.addChild(this._backSprite);

    var marks = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
    var drawSlot = function(r, label) {
        marks.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 'rgba(255,255,255,0.14)');
        marks.fillRect(r.x, r.y, r.w, r.h, 'rgba(0,0,0,0.30)');
        if (label) {
            marks.fontSize = Math.round(13 * L.uiScale);
            marks.textColor = 'rgba(255,255,255,0.45)';
            marks.drawText(label, r.x, r.y + r.h / 2 - 9, r.w, 18, 'center');
        }
    };
    for (var s = 0; s < 2; s++) {
        for (var i = 0; i < 3; i++) drawSlot(zoneRect(s, i), 'Monster');
        var py = s === 0 ? L.playerZoneY : L.enemyZoneY;
        drawSlot({ x: L.pileRightX, y: py, w: L.zoneW, h: L.zoneH }, s === 0 ? 'Deck' : 'Ablage');
        drawSlot({ x: L.pileLeftX,  y: py, w: L.zoneW, h: L.zoneH }, s === 0 ? 'Ablage' : 'Deck');
    }
    this._marksSprite = new Sprite(marks);
    this.addChild(this._marksSprite);
};

Scene_TCGBattle.prototype.createFieldSprites = function() {
    var scale = L.zoneW / TCG.param.cardW;
    this._zoneSprites = [[], []];
    this._hoverArtSprites = [[], []];
    for (var s = 0; s < 2; s++) {
        for (var i = 0; i < 3; i++) {
            var sp = new Sprite_TCGCard(null, false);
            var r = zoneRect(s, i);
            sp.x = r.x; sp.y = r.y;
            sp.scale.x = sp.scale.y = scale;
            sp.visible = false;
            this.addChild(sp);
            this._zoneSprites[s].push(sp);

            // Hover-Kunst: das Monster-Artwork "schwebt" vergroessert ueber
            // der eigentlichen Kartenzone (siehe refreshHoverArt). Nutzt
            // dieselbe Rohbild-Quelle wie die Karte selbst, aber OHNE
            // Rahmen/Hintergrund/Text - nur die Kreatur, herausragend.
            var hv = new Sprite();
            hv.anchor.x = 0.5;
            hv.anchor.y = 1; // unterer Rand als Ankerpunkt - waechst nach oben
            hv.visible = false;
            this.addChild(hv);
            this._hoverArtSprites[s].push(hv);
        }
    }
    this._deckSprites = [];
    for (var d = 0; d < 2; d++) {
        var dp = new Sprite_TCGCard(null, true);
        dp.x = d === 0 ? L.pileRightX : L.pileLeftX;
        dp.y = d === 0 ? L.playerZoneY : L.enemyZoneY;
        dp.scale.x = dp.scale.y = scale;
        this.addChild(dp);
        this._deckSprites.push(dp);
    }
    this._graveSprites = [];
    for (var g = 0; g < 2; g++) {
        var gp = new Sprite_TCGCard(null, false, false); // Ablage: keine Animation
        gp.x = g === 0 ? L.pileLeftX : L.pileRightX;
        gp.y = g === 0 ? L.playerZoneY : L.enemyZoneY;
        gp.scale.x = gp.scale.y = scale;
        gp.visible = false;
        this.addChild(gp);
        this._graveSprites.push(gp);
    }
    this._enemyHandSprites = [];
    this._hudSprite = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
    this.addChild(this._hudSprite);
};

Scene_TCGBattle.prototype.createHandSprites = function() {
    this._handSprites = [];
    this._handContainer = new Sprite();
    this.addChild(this._handContainer);
    this._handHoverIndex = -1;   // aktuell fokussierte (vergroesserte) Handkarte, -1 = keine
    this._handKeyboardActive = false;
};

// Actor-Portraets neben dem Spielernamen (siehe TCG_Portraits.js). Quelle:
// eigene Seite (0) -> Character Creator (falls installiert und konfiguriert)
// ueber das eigene Profil; Gegner-Seite (1) -> NPC-Portraet aus der
// Deck-Vorlage (_opponent.portrait) oder - im Netzwerk-Duell - das Profil
// des Mitspielers (siehe Anbindung in TCG_Lobby.js).
Scene_TCGBattle.prototype.createPortraitSprites = function() {
    this._portraitSprites = [
        new Sprite_TCGPortrait(TCG.param.portraitSize || 40),
        new Sprite_TCGPortrait(TCG.param.portraitSize || 40)
    ];
    var self = this;
    this._portraitSprites.forEach(function(sp) { self.addChild(sp); });
    this.refreshPortraits();
};

// Ermittelt fuer beide Seiten, WOHER das Portraet kommt, und positioniert die
// Sprites neben dem jeweiligen Namen (siehe refreshHud fuer die Textposition).
Scene_TCGBattle.prototype.refreshPortraits = function() {
    if (!this._portraitSprites) return;
    var ownSource = TCG.resolvePortraitSource(TCG.profile().actorData, null);
    var oppData = Scene_TCGBattle._opponent || {};
    var oppSource = TCG.resolvePortraitSource(oppData.actorData || null, oppData.portrait || null);
    this._portraitSprites[0].setSource(ownSource, TCG.param.ccActorId);
    this._portraitSprites[1].setSource(oppSource, null); // Gegner-Seite: nie ein ECHTER lokaler Akteur
    // Portraet vertikal zentriert zum Textblock (Name+LP+AP, Hoehe siehe
    // L.ownHudH) - nicht an dessen Oberkante ausgerichtet.
    var portraitSize = TCG.param.portraitSize || 40;
    var vOffset = Math.round((L.ownHudH - portraitSize) / 2);
    this._portraitSprites[1].x = L.enemyHudX;
    this._portraitSprites[1].y = L.enemyHudY + vOffset;
    this._portraitSprites[0].x = L.ownHudX;
    this._portraitSprites[0].y = L.ownHudY + vOffset;
};

// Schaltet kurzzeitig den Ausdruck einer Seite um (nur wirksam bei manuellem
// Sprite-Sheet-Portraet - beim Character Creator gibt es nur ein festes
// Bild, siehe TCG_Portraits.js). Kehrt nach "frames" Engine-Frames wieder
// automatisch zu 'neutral' zurueck.
Scene_TCGBattle.prototype.flashPortraitExpression = function(side, expression, frames) {
    var sp = this._portraitSprites && this._portraitSprites[side];
    if (!sp) return;
    sp.setExpression(expression);
    this._portraitResetTimers = this._portraitResetTimers || [null, null];
    this._portraitResetTimers[side] = { framesLeft: frames || 90 };
};

Scene_TCGBattle.prototype.createOverlays = function() {
    this._dimSprite = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
    this._dimSprite.bitmap.fillRect(0, 0, Graphics.boxWidth, Graphics.boxHeight, 'rgba(0,0,0,0.82)');
    this._dimSprite.visible = false;
    this.addChild(this._dimSprite);

    // Zonen-Hervorhebung: zeigt VOR dem eigentlichen Klick/Bestaetigen, welche
    // Zone gerade per Maus/Tastatur/Controller anvisiert ist (Beschwoerungs-
    // Vorschau, Ziel-Auswahl, Tribut/Ausruestung).
    this._zoneHighlightSprite = new Sprite(new Bitmap(L.zoneW, L.zoneH));
    this._zoneHighlightSprite.visible = false;
    this.addChild(this._zoneHighlightSprite);

    this._bigCardSprite = new Sprite_TCGCard(null, false);
    this._bigCardSprite.visible = false;
    this.addChild(this._bigCardSprite);

    this._toastSprite = new Sprite(new Bitmap(Math.round(520 * L.uiScale), Math.round(40 * L.uiScale)));
    this._toastSprite.x = L.fieldX + Math.floor((Graphics.boxWidth - L.fieldX - Math.round(520 * L.uiScale)) / 2);
    this._toastSprite.y = L.toastY;
    this._toastSprite.visible = false;
    this._toastFrames = 0;
    this.addChild(this._toastSprite);

    this._bannerSprite = new Sprite(new Bitmap(Graphics.boxWidth, Math.round(96 * L.uiScale)));
    this._bannerSprite.y = Math.floor((Graphics.boxHeight - 96) / 2);
    this._bannerSprite.visible = false;
    this._bannerFrames = 0;
    this._afterBanner = null;
    this.addChild(this._bannerSprite);
};

Scene_TCGBattle.prototype.createWindows = function() {
    this._infoWindow = new Window_TCGInfo();
    this.addWindow(this._infoWindow);

    this._logWindow = new Window_TCGLog();
    this.addWindow(this._logWindow);

    this._cmdWindow = new Window_TCGCommand(L.phaseBarX, L.phaseBarY, []);
    this._cmdWindow.setHandler('ziehen',   this.onDraw.bind(this));
    this._cmdWindow.setHandler('aufgeben', this.onSurrenderAsk.bind(this));
    this._cmdWindow.setHandler('kampf',    this.onToBattle.bind(this));
    this._cmdWindow.setHandler('ende',     this.onEndTurn.bind(this));
    this._cmdWindow.setHandler('cancel',   this.onCmdWindowCancel.bind(this));
    this.addWindow(this._cmdWindow);

    // Bestaetigungsfenster (Beschwoerung/Effekt-Aktivierung/Angriff-Ja-Nein
    // usw.): Kartenvorschau links, Auswahl rechts davon (siehe openConfirm
    // fuer die tatsaechliche Positionierung je nach vorhandener Karte).
    this._confirmWindow = new Window_TCGCommand(L.confirmWindowX, L.confirmWindowY, []);
    this._confirmWindow.setHandler('ja',     this.onConfirmYes.bind(this));
    this._confirmWindow.setHandler('nein',   this.onConfirmNo.bind(this));
    this._confirmWindow.setHandler('cancel', this.onConfirmNo.bind(this));
    this.addWindow(this._confirmWindow);

    // Hinweistext (was gerade passiert, z.B. "Wirklich hier beschwoeren?"):
    // OBEN in der rechten Spalte des Bestaetigungsblocks - Karte links,
    // Hinweis oben rechts, Ja/Nein-Auswahl darunter (siehe openConfirm).
    this._confirmLabelSprite = new Sprite(new Bitmap(L.confirmWindowW, L.confirmHintH));
    this._confirmLabelSprite.x = L.confirmWindowX;
    this._confirmLabelSprite.y = L.confirmHintY;
    this._confirmLabelSprite.visible = false;
    this.addChild(this._confirmLabelSprite);

    // Zug-Nummer, klein ueber der Phasenleiste (die Leiste selbst zeigt nur
    // noch die Phasen-Befehle, siehe Window_TCGPhaseBar).
    this._turnLabelSprite = new Sprite(new Bitmap(Math.round(200 * L.uiScale), Math.round(20 * L.uiScale)));
    this._turnLabelSprite.anchor.x = 0.5;
    this._turnLabelSprite.x = L.fieldCenterX;
    this._turnLabelSprite.y = Math.round(48 * L.uiScale);
    this.addChild(this._turnLabelSprite);

    this._searchWindow = new Window_TCGSearch();
    this._searchWindow.setHandler('ok',     this.onSearchOk.bind(this));
    this._searchWindow.setHandler('cancel', this.onSearchCancel.bind(this));
    this.addWindow(this._searchWindow);

    this._pileWindow = new Window_TCGPileView();
    this._pileWindow.setHandler('ok',     this.closePileView.bind(this));
    this._pileWindow.setHandler('cancel', this.closePileView.bind(this));
    this.addWindow(this._pileWindow);
};

// Ablage/Exil-Uebersicht: read-only, jederzeit ausser waehrend anderer Dialoge/
// Zwischensequenzen oeffenbar (Klick auf den Ablagestapel, siehe updateGraveClicks).
Scene_TCGBattle.prototype.openPileView = function(side) {
    var p = this._game.player(side);
    var label = side === 0 ? 'Deine' : (p.name + 's');
    var rows = [];
    rows.push({ header: label + ' Ablage (' + p.grave.length + ')' });
    if (p.grave.length === 0) rows.push({ empty: true, label: '(leer)' });
    else TCG.groupCardCounts(p.grave).forEach(function(e) { rows.push(e); });
    rows.push({ header: label + ' Exil (' + p.exile.length + ')' });
    if (p.exile.length === 0) rows.push({ empty: true, label: '(leer)' });
    else TCG.groupCardCounts(p.exile).forEach(function(e) { rows.push(e); });

    this._stateBeforePile = this._state;
    this._state = 'pileView';
    var self = this;
    this._pileWindow._onSelectChange = function(index) { self.onPileSelectionChange(index); };
    this._pileWindow.setRows(rows);
    this._pileWindow.show();
    this._pileWindow.activate();
    this.onPileSelectionChange(this._pileWindow.index());
};

// Haelt das linke Karteninfo-Panel (Bild + Name + Werte + Effekttext)
// synchron mit der gerade in der Ablage-/Exil-Uebersicht markierten Karte -
// genau dieselbe Darstellung, die Hand- und Feldkarten beim Hovern bekommen.
Scene_TCGBattle.prototype.onPileSelectionChange = function(index) {
    var row = this._pileWindow._rows[index];
    var card = (row && row.id) ? TCG.card(row.id) : null;
    this._infoWindow.setCard(card);
};

Scene_TCGBattle.prototype.closePileView = function() {
    SoundManager.playCancel();
    this._pileWindow.hide();
    this._pileWindow.deactivate();
    this._pileWindow._onSelectChange = null;
    this._infoWindow.setCard(null);
    this._state = this._stateBeforePile || 'main';
};

// Laeuft jeden Frame unabhaengig vom aktuellen Zustand (ausser waehrend
// blockierender Dialoge/Zwischensequenzen), damit die Ablage jederzeit
// einsehbar ist.
Scene_TCGBattle.prototype.updateGraveClicks = function() {
    var blocked = ['intro', 'banner', 'result', 'confirm', 'search', 'placeZone',
        'tributePick', 'equipPick', 'battleTarget', 'targetOwn', 'targetEnemy', 'pileView'];
    if (blocked.indexOf(this._state) >= 0) return;
    if (!TouchInput.isTriggered()) return;
    for (var s = 0; s < 2; s++) {
        var gr = { x: s === 0 ? L.pileLeftX : L.pileRightX,
                   y: s === 0 ? L.playerZoneY : L.enemyZoneY, w: L.zoneW, h: L.zoneH };
        if (pointInRect(TouchInput.x, TouchInput.y, gr)) {
            SoundManager.playCursor();
            this.openPileView(s);
            return;
        }
    }
};

//--- Intro --------------------------------------------------------------------
Scene_TCGBattle.prototype.startShuffleAnimation = function() {
    this._shuffleSprites = [];
    var scale = L.zoneW / TCG.param.cardW;
    for (var s = 0; s < 2; s++) {
        for (var i = 0; i < 5; i++) {
            var sp = new Sprite_TCGCard(null, true);
            sp.x = (s === 0 ? L.pileRightX : L.pileLeftX) + L.zoneW / 2;
            sp.y = (s === 0 ? L.playerZoneY : L.enemyZoneY) + L.zoneH / 2;
            sp.anchor.x = sp.anchor.y = 0.5;
            sp.scale.x = sp.scale.y = scale;
            sp._phase = Math.random() * Math.PI * 2;
            this.addChild(sp);
            this._shuffleSprites.push(sp);
        }
    }
    this._wait = 70;
    this._state = 'intro';
    SoundManager.playEquip();
};

Scene_TCGBattle.prototype.updateIntro = function() {
    var t = this._wait;
    this._shuffleSprites.forEach(function(sp) {
        sp.rotation = Math.sin(sp._phase + t * 0.25) * 0.35;
        sp.x += Math.sin(sp._phase * 2 + t * 0.4) * 1.5;
    });
    if (--this._wait <= 0) {
        var self = this;
        this._shuffleSprites.forEach(function(sp) { self.removeChild(sp); });
        this._shuffleSprites = [];
        this.beginTurn(this.firstTurnSeat());
    }
};

//--- Zugwechsel ---------------------------------------------------------------
Scene_TCGBattle.prototype.beginTurn = function(playerIndex) {
    this._game.startTurn(playerIndex); // wird beim Gast automatisch mitprotokolliert
    if (this.isNetworkGuest()) { this.flushNetworkActionLog(); return; }
    this._timerFrames = TCG.param.timerSeconds * 60;
    this._pendingSummon = null;
    this.refreshAll();
    var name = this._game.player(playerIndex).name;
    var self = this;
    this.logEvent('Zug ' + this._game.turnCount() + ' \u2013 ' + name, true);
    this.showBanner('Zug ' + this._game.turnCount() + ' \u2013 ' + name, 80, function() {
        if (playerIndex === 0) {
            self._state = 'turnStart';
            self._cmdWindow.setup([
                { name: 'Ziehen',   symbol: 'ziehen' },
                { name: 'Aufgeben', symbol: 'aufgeben' }
            ]);
            self._cmdWindow.show();
            self._cmdWindow.activate();
            if (self.isNetworkHost() && self._netAwaitingDuelStart) {
                self._netAwaitingDuelStart = false;
                self._netHub.sendTo(self._netGuestId,
                    { type: 'duelStart', snapshot: TCG.Net.swapPerspective(self._game.snapshot()),
                      hostActorData: TCG.profile().actorData });
            }
        } else if (self.isNetworkHost()) {
            self._state = 'remoteTurn'; // Gast ist am Zug - keine KI, nur auf Netzwerk-Nachrichten warten
            self._cmdWindow.hide();
            self._cmdWindow.deactivate();
        } else {
            self._state = 'aiTurn';
            self._aiWait = 40;
            self._aiDrew = false;
        }
    });
};

Scene_TCGBattle.prototype.showBanner = function(text, frames, callback) {
    var bmp = this._bannerSprite.bitmap;
    bmp.clear();
    bmp.fillRect(0, 0, bmp.width, bmp.height, 'rgba(0,0,0,0.72)');
    bmp.fillRect(0, 0, bmp.width, 2, 'rgba(255,215,94,0.9)');
    bmp.fillRect(0, bmp.height - 2, bmp.width, 2, 'rgba(255,215,94,0.9)');
    bmp.fontSize = Math.round(34 * L.uiScale);
    bmp.textColor = '#ffffff';
    bmp.outlineWidth = 4;
    bmp.drawText(text, 0, 0, bmp.width, bmp.height, 'center');
    this._bannerSprite.opacity = 0;
    this._bannerSprite.visible = true;
    this._bannerFrames = frames;
    this._afterBanner = callback || null;
    this._state = 'banner';
    SoundManager.playCursor();
};

Scene_TCGBattle.prototype.updateBanner = function() {
    if (this._bannerFrames > 0) {
        this._bannerFrames--;
        this._bannerSprite.opacity = Math.min(255, this._bannerSprite.opacity + 20);
        if (this._bannerFrames === 0) {
            this._bannerSprite.visible = false;
            var cb = this._afterBanner;
            this._afterBanner = null;
            if (cb) cb();
        }
    }
};

//--- Befehle ------------------------------------------------------------------
Scene_TCGBattle.prototype.onDraw = function() {
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    var drawn = this._game.doDraw();
    SoundManager.playCursor();
    this.refreshAll();
    if (this._game.isOver()) { this.startResult(); return; }
    this.showToast('+' + drawn + ' Karte(n)');
    // Zugbeginn-Trigger, danach Hauptphase
    this.queueEffects(this._game.turnTriggers('beimZugbeginn'), this.enterMainPhase.bind(this));
};

//=============================================================================
// Netzwerk-Multiplayer: Host autoritativ, Gast zeichnet auf und schickt
//=============================================================================
// Alle veraendernden Game_TCGBattle-Methoden, die durch Spieler-Eingaben
// ausgeloest werden koennen. Beim Gast wird jeder dieser Aufrufe zusaetzlich
// zur normalen (sofortigen, lokalen) Ausfuehrung mitprotokolliert - die
// aufgezeichnete Abfolge wird an den Host geschickt, der sie auf seiner
// EIGENEN autoritativen Instanz noch einmal ausfuehrt (echte Validierung,
// kein blindes Uebernehmen des Gast-Zustands).
TCG.NET_MUTATING_METHODS = [
    'addTokens', 'consumeTokens', 'payMonsterAP', 'startTurn', 'dealInitialHands', 'doDraw',
    'toBattlePhase', 'surrender', 'consumeGraveyard', 'beginNormalSummon', 'beginRitual',
    'beginFusion', 'removeHandByIndices', 'placeFloating', 'restorePlayer', 'clearFloating',
    'playSpell', 'equip', 'activate', 'takeFromDeck', 'resolveEffect', 'destroyTriggers',
    'sendToGrave', 'banish', 'attack', 'discardHandCards'
];

// Manche Methoden nehmen einen Seiten-Index (0/1) als Argument entgegen. Da
// der Gast lokal in VERTAUSCHTER Sicht spielt (er selbst = 0, Host = 1),
// muessen genau diese Argumentpositionen beim Aufzeichnen zurueckgedreht
// werden, BEVOR sie an den Host geschickt werden - sonst wuerde der Host
// z.B. "startTurn(1)" (aus Gast-Sicht: "der Host ist jetzt dran") woertlich
// als "Seite 1 (=Gast in Host-Zaehlung) ist jetzt dran" ausfuehren: das
// Gegenteil des Gemeinten. Die LOKALE Ausfuehrung beim Gast bleibt davon
// unberuehrt (nutzt weiterhin die urspruenglichen, gast-lokalen Argumente).
TCG.NET_SIDE_ARG_POSITIONS = {
    addTokens: [0], consumeTokens: [0], payMonsterAP: [0], startTurn: [0],
    surrender: [0], consumeGraveyard: [0], restorePlayer: [0], takeFromDeck: [0],
    resolveEffect: [0, 2], destroyTriggers: [0, 2], sendToGrave: [0], banish: [0],
    discardHandCards: [0]
};

// Aufruf auf dem GAST: verpackt _game so, dass jeder veraendernde Aufruf
// zusaetzlich mitprotokolliert wird. Lesende Methoden (player(), effAtk(), ...)
// bleiben unangetastet - der Gast sieht seine eigene Rehearsal-Wirkung sofort
// lokal, die Autoritaet liegt aber weiterhin beim Host.
// myCanonicalSide: welche Seite (0/1) dieser Gast im KANONISCHEN Spielstand
// tatsaechlich ist. Beim bisherigen Host<->Gast-Duell ist der Gast IMMER
// Seite 1 (Standard, wenn nicht angegeben) - beim neuen Gast-zu-Gast-Duell
// (siehe TCG.Net.DuelRelay) uebernimmt der Kampfzonen-Host stellvertretend
// die Rolle des "Host", waehrend beide eigentlichen Teilnehmer als Gaeste
// behandelt werden - einer davon ist dann kanonisch Seite 0, muss also seine
// lokalen Seiten-Argumente NICHT drehen (seine lokale Sicht entspricht
// bereits der kanonischen).
// Wird aufgerufen, wenn die Netzwerkverbindung zum Gegner waehrend eines
// laufenden Duells abbricht (Absturz, Verbindungsverlust, bewusstes
// Verlassen). Statt den verbleibenden Spieler auf unbestimmte Zeit warten
// zu lassen (z.B. im 'remoteTurn'-Zustand), wird das Duell sauber beendet -
// als Sieg fuer den verbleibenden Spieler (gaengige Konvention: wer die
// Verbindung verliert, verliert das Duell).
// Wird aufgerufen, wenn die Netzwerkverbindung zum Gegner waehrend eines
// laufenden Duells abbricht. Statt sofort zu beenden, bekommt der HOST eine
// Kulanzzeit (siehe startReconnectGracePeriod) - erst wenn die ablaeuft,
// ohne dass der Gegner zurueckkommt, gilt das Duell als verloren fuer ihn.
// Der GAST selbst kann nicht "warten" (er hat keine Verbindung mehr, ueber
// die er etwas erfahren wuerde) - er kehrt zur Kampfzonen-Lobby zurueck und
// kann sich dort mit einem neuen Einladungscode vom Host erneut verbinden;
// der Host erkennt ihn automatisch anhand seiner Profil-ID wieder.
Scene_TCGBattle.prototype.onNetworkDisconnect = function(reason) {
    if (this._netDisconnected || this._state === 'result' || this._state === 'awaitingReconnect') return;
    if (this.isNetworkHost()) {
        this.startReconnectGracePeriod();
        return;
    }
    this._netDisconnected = true;
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    this._searchWindow.hide();
    this._searchWindow.deactivate();
    this.closeConfirm();
    SoundManager.playMiss();
    this.showToast('Verbindung zum Host verloren - zurueck zur Kampfzone, dort mit neuem Code erneut verbinden.');
    SceneManager.pop();
};

// HOST: statt das Duell sofort zu beenden, wird abgewartet (siehe
// TCG.param.reconnectGraceMs), ob der Gegner sich mit derselben Profil-ID
// erneut verbindet (siehe TCG.Net.Hub.markPendingReconnect/onReconnect).
Scene_TCGBattle.prototype.startReconnectGracePeriod = function() {
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    this._searchWindow.hide();
    this._searchWindow.deactivate();
    this.closeConfirm();
    this.refreshAll();
    var seconds = Math.round((TCG.param.reconnectGraceMs || 90000) / 1000);
    this.showBanner('Verbindung verloren - warte auf Wiederverbindung (' + seconds + 's)...', 999999, null);
    this._bannerFrames = 999999;
    this._state = 'awaitingReconnect';
    var self = this;
    this._netHub.markPendingReconnect(this._netGuestId, null, TCG.param.reconnectGraceMs, function() {
        self.finalizeDisconnect();
    }, function(remoteProfile) {
        self.onGuestReconnected(remoteProfile);
    });
};

// HOST: die Kulanzzeit ist abgelaufen, ohne dass der Gegner zurueckkam -
// jetzt WIRKLICH als Sieg werten (bisheriges Verhalten).
Scene_TCGBattle.prototype.finalizeDisconnect = function() {
    if (this._netDisconnected || this._state === 'result') return;
    this._netDisconnected = true;
    SoundManager.playMiss();
    this.showBanner('Gegner nicht zurueckgekehrt - Duell beendet', 999999, null);
    this._bannerFrames = 999999;
    this._state = 'result';
    this._resultWon = true;
};

// HOST: der Gegner hat sich mit derselben Profil-ID rechtzeitig erneut
// verbunden - Duell wird fortgesetzt. Schickt den aktuellen Zustand als
// "duelStart" (der Gast baut damit seine Szene frisch auf, siehe
// Scene_TCGKampfzone.onClientMessage - exakt derselbe Mechanismus wie beim
// allerersten Verbindungsaufbau, kein Sonderfall noetig).
Scene_TCGBattle.prototype.onGuestReconnected = function(remoteProfile) {
    this._state = this._game.active() === this.mySide() ? 'turnStart' : 'remoteTurn';
    this._cmdWindow.show();
    if (this._game.active() === this.mySide()) this._cmdWindow.activate();
    this.refreshAll();
    this.showToast('Gegner ist zurueckgekehrt - Duell wird fortgesetzt');
    this._netHub.sendTo(remoteProfile.id, {
        type: 'duelStart', snapshot: TCG.Net.swapPerspective(this._game.snapshot()),
        hostActorData: TCG.profile().actorData
    });
};

Scene_TCGBattle.prototype.setupNetworkGuest = function(session, myCanonicalSide) {
    this._netRole = 'guest';
    this._netSession = session;
    this._netActionLog = [];
    this._netMyCanonicalSide = (myCanonicalSide === undefined || myCanonicalSide === null) ? 1 : myCanonicalSide;
    var self = this;
    TCG.NET_MUTATING_METHODS.forEach(function(name) {
        var original = self._game[name].bind(self._game);
        self._game[name] = function() {
            var args = Array.prototype.slice.call(arguments);
            var recorded = args.slice();
            var flipPositions = TCG.NET_SIDE_ARG_POSITIONS[name];
            if (flipPositions && self._netMyCanonicalSide === 1) {
                flipPositions.forEach(function(i) {
                    if (typeof recorded[i] === 'number') recorded[i] = 1 - recorded[i];
                });
            }
            self._netActionLog.push({ method: name, args: recorded });
            return original.apply(null, args); // lokale Ausfuehrung: UNgedrehte, gast-lokale Argumente
        };
    });
    session.onGameMessage = function(msg) { self.onNetworkMessage(msg); };
    session.onClose = function(reason) { self.onNetworkDisconnect(reason); };
};

Scene_TCGBattle.prototype.setupNetworkHost = function(hub, guestId) {
    this._netRole = 'host';
    this._netHub = hub;
    var self = this;
    hub.onRelayedMessage = function(fromId, msg) { self.onNetworkMessage(msg); };
    // Nur DIESER eine Gast ist fuer dieses Duell relevant - andere evtl.
    // noch im Sternmodell verbundene Personen (z.B. weitere Lobby-Gaeste)
    // sollen den Host nicht faelschlich "das Duell ist beendet" glauben lassen.
    var entry = hub.sessions.filter(function(e) { return e.profile && e.profile.id === guestId; })[0];
    if (entry) {
        var original = entry.session.onClose;
        entry.session.onClose = function(reason) {
            if (original) original(reason);
            self.onNetworkDisconnect(reason);
        };
    }
};

// ZUSCHAUER: rein lesend, wendet eingehende Spielstaende an, ohne jemals in
// einen interaktiven Zustand zu wechseln.
Scene_TCGBattle.prototype.setupNetworkSpectator = function(session) {
    this._netRole = 'spectator';
    this._netSession = session;
    var self = this;
    session.onGameMessage = function(msg) { self.onSpectatorMessage(msg); };
    session.onClose = function() {
        self.showToast('Verbindung zum Duell verloren.');
        SceneManager.pop();
    };
};

Scene_TCGBattle.prototype.onSpectatorMessage = function(msg) {
    if (!msg) return;
    if (msg.type !== 'snapshot' && msg.type !== 'duelStart') return;
    this._game.applySnapshot(msg.data || msg.snapshot);
    this.refreshAll();
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    if (this._game.isOver()) {
        this.showBanner(this._game.winner() === 0 ? 'Spieler A gewinnt!' : 'Spieler B gewinnt!', 999999, null);
        this._bannerFrames = 999999;
        this._state = 'result';
        this._resultWon = null; // Zuschauer - kein eigenes Ergebnis, siehe updateResult
    }
};

Scene_TCGBattle.prototype.isNetworked = function() { return !!this._netRole; };
Scene_TCGBattle.prototype.isNetworkGuest = function() { return this._netRole === 'guest'; };
Scene_TCGBattle.prototype.isNetworkHost = function() { return this._netRole === 'host'; };

//--- RPG-Maker-Animationen (aus $dataAnimations) -------------------------------
// Laeuft ZUSAETZLICH zum bestehenden eigenen Effekt-System (Sprite_TCGCard.
// playTrigger, siehe TCG_Core.js) - beide zusammen, nicht als Ersatz.

// Spielt Animation "animationId" auf der angegebenen Sprite (oder an einer
// festen Bildschirmposition, falls kein Sprite gegeben ist - z.B. fuer
// Zauber, die nicht auf dem Feld liegen). id=0 oder unbekannt: kein Fehler,
// einfach keine Animation (z.B. wenn nichts konfiguriert wurde).
Scene_TCGBattle.prototype.playAnimation = function(targetSprite, animationId) {
    if (!animationId) return;
    var data = typeof $dataAnimations !== 'undefined' ? $dataAnimations[animationId] : null;
    if (!data) return;
    var target = targetSprite || this.centerScreenAnimationTarget();
    var sprite = new Sprite_Animation();
    sprite.setup(target, data, false, 0);
    this._animationSprites = this._animationSprites || [];
    this._animationSprites.push(sprite);
    this.addChild(sprite);
};

// Ersatz-"Ziel" fuer Animationen ohne eigene Feld-Sprite (z.B. Zauber) -
// eine ECHTE, unsichtbare Sprite in der Bildschirmmitte (wird einmalig
// angelegt und wiederverwendet). WICHTIG: Sprite_Animation braucht ein
// echtes Sprite-Objekt (u.a. setBlendColor()) - ein einfaches {x,y}-Objekt
// fuehrt zu einem Fehler in rpg_sprites.js.
Scene_TCGBattle.prototype.centerScreenAnimationTarget = function() {
    if (!this._centerAnimTarget) {
        this._centerAnimTarget = new Sprite(new Bitmap(1, 1));
        this._centerAnimTarget.opacity = 0;
        this._centerAnimTarget.anchor.x = this._centerAnimTarget.anchor.y = 0.5;
        this._centerAnimTarget.x = Graphics.boxWidth / 2;
        this._centerAnimTarget.y = Graphics.boxHeight / 2;
        this.addChild(this._centerAnimTarget);
    }
    return this._centerAnimTarget;
};

// Spielt die zu "element" konfigurierte Animation (siehe
// TCG.param.elementAnimations) - fuer Angriffe und Zauber-Aktivierung.
Scene_TCGBattle.prototype.playElementAnimation = function(targetSprite, element, fallbackId) {
    var id = TCG.resolveElementAnimation(element) || fallbackId || 0;
    this.playAnimation(targetSprite, id);
};

// WICHTIG: sprite.update() wird hier BEWUSST NICHT manuell aufgerufen -
// die Sprite ist per addChild() Kind der Szene, die RPG-Maker-Engine ruft
// update() dadurch bereits automatisch jeden Frame auf (Standard-Verhalten
// fuer alle Kind-Sprites, siehe Scene_Base.updateChildren). Ein
// zusaetzlicher manueller Aufruf hier wuerde sie PRO FRAME ZWEIMAL
// aktualisieren - das brachte die interne Zustandslogik von
// Sprite_Animation durcheinander (u.a. wurde this._target zeitweise
// ungueltig, was zu "setBlendColor is not a function" fuehrte). Hier wird
// nur noch geprueft, ob die Animation fertig ist, um sie zu entfernen.
Scene_TCGBattle.prototype.updateAnimationSprites = function() {
    if (!this._animationSprites || this._animationSprites.length === 0) return;
    for (var i = this._animationSprites.length - 1; i >= 0; i--) {
        var sprite = this._animationSprites[i];
        if (!sprite.isPlaying()) {
            this.removeChild(sprite);
            if (sprite.destroy) sprite.destroy();
            this._animationSprites.splice(i, 1);
        }
    }
};

// Schickt die seit dem letzten Flush aufgezeichnete Aufruf-Sequenz an den
// Host und wechselt in den Warte-Zustand (keine lokale Eingabe mehr moeglich,
// bis der Host mit dem autoritativen Spielstand antwortet).
Scene_TCGBattle.prototype.flushNetworkActionLog = function() {
    if (!this.isNetworkGuest()) return;
    if (this._netActionLog.length > 0) {
        this._netSession.send({ type: 'gameAction', log: this._netActionLog });
        this._netActionLog = [];
    }
    this._state = 'remoteTurn';
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
};

Scene_TCGBattle.prototype.onNetworkMessage = function(msg) {
    if (!msg) return;
    if (msg.type === 'gameAction' && this.isNetworkHost()) {
        var self = this;
        msg.log.forEach(function(step) {
            if (TCG.NET_MUTATING_METHODS.indexOf(step.method) < 0) return; // Sicherheit: nur bekannte Methoden
            self._game[step.method].apply(self._game, step.args);
        });
        this.refreshAll();
        if (this._game.isOver()) { this.startResult(); return; }
        this.broadcastSnapshotToGuest();
        this.syncHostUiAfterRemoteAction();
        return;
    }
    if (msg.type === 'snapshot' && this.isNetworkGuest()) {
        this._game.applySnapshot(msg.data);
        this.refreshAll();
        this.syncStateAfterSnapshot();
        return;
    }
    if (msg.type === 'relayDisconnect') {
        this.onNetworkDisconnect('relay');
        return;
    }
    if (msg.type === 'relayWaitingReconnect') {
        this.showRelayWaitingForReconnect();
        return;
    }
    if (msg.type === 'relayReconnected') {
        this.onRelayOpponentReconnected();
        return;
    }
};

// GAST-ZU-GAST-DUELL: der eigene Gegner (NICHT ich selbst) hat die
// Verbindung zum Schiedsrichter (Kampfzonen-Host) verloren - warte, statt
// das Duell direkt zu beenden (der Schiedsrichter meldet sich mit
// "relayReconnected" oder "relayDisconnect", je nachdem wie es ausgeht).
Scene_TCGBattle.prototype.showRelayWaitingForReconnect = function() {
    if (this._state === 'result' || this._state === 'awaitingReconnect') return;
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    this._searchWindow.hide();
    this._searchWindow.deactivate();
    this.closeConfirm();
    var seconds = Math.round((TCG.param.reconnectGraceMs || 90000) / 1000);
    this.showBanner('Gegner hat die Verbindung verloren - warte auf Wiederverbindung (' + seconds + 's)...', 999999, null);
    this._bannerFrames = 999999;
    this._state = 'awaitingReconnect';
};

Scene_TCGBattle.prototype.onRelayOpponentReconnected = function() {
    this.showToast('Gegner ist zurueckgekehrt - Duell wird fortgesetzt');
    // Der naechste "duelStart" (via sendDuelStartTo, ausgeloest vom
    // Schiedsrichter) baut den Zustand korrekt wieder auf - hier nur die
    // Wartemeldung wegnehmen, damit die Bedienung nicht blockiert bleibt,
    // falls "duelStart" aus irgendeinem Grund erst spaeter eintrifft.
    if (this._state === 'awaitingReconnect') {
        this._state = 'remoteTurn';
        this.refreshAll();
    }
};

Scene_TCGBattle.prototype.broadcastSnapshotToGuest = function() {
    var snap = this._game.snapshot();
    this._netHub.broadcast({ type: 'snapshot', data: TCG.Net.swapPerspective(snap) });
};

// GAST: nach Erhalt des autoritativen Zustands - entweder wieder interaktiv
// (ich bin am Zug) oder weiter warten (Gegner/Host ist am Zug).
Scene_TCGBattle.prototype.syncStateAfterSnapshot = function() {
    if (this._game.isOver()) { this.startResult(); return; }
    if (this._game.active() === 0) {
        this._state = this._game.phase() === 'battle' ? 'battle' : 'turnStart';
        if (this._state === 'turnStart') {
            this._cmdWindow.setup([
                { name: 'Ziehen',   symbol: 'ziehen' },
                { name: 'Aufgeben', symbol: 'aufgeben' }
            ]);
        } else {
            this._cmdWindow.setup([{ name: 'Zug beenden', symbol: 'ende' }]);
        }
        this._cmdWindow.show();
        this._cmdWindow.activate();
    } else {
        this._state = 'remoteTurn';
        this._cmdWindow.hide();
        this._cmdWindow.deactivate();
    }
};

// HOST: eigene Oberflaeche nach einer per Netzwerk verarbeiteten Gast-Aktion
// aktualisieren (der Host schaut nur zu, solange der Gast am Zug ist).
Scene_TCGBattle.prototype.syncHostUiAfterRemoteAction = function() {
    if (this._game.active() !== 0) return; // Gast weiterhin am Zug - Host bleibt im Zuschau-Zustand
    // Der Zug ist zum Host zurueckgewechselt (Gast hat "Zug beenden" geschickt)
    this._state = 'turnStart';
    this._cmdWindow.setup([
        { name: 'Ziehen',   symbol: 'ziehen' },
        { name: 'Aufgeben', symbol: 'aufgeben' }
    ]);
    this._cmdWindow.show();
    this._cmdWindow.activate();
};

Scene_TCGBattle.prototype.enterMainPhase = function() {
    if (this.isNetworkGuest()) { this.flushNetworkActionLog(); return; }
    this._state = 'main';
    this._selectedHand = -1;
    this._selectedZone = -1;
    this._pendingSummon = null;
    this._cmdWindow.setup([
        { name: 'Kampfphase',  symbol: 'kampf', enabled: this._game.battleAllowed() },
        { name: 'Zug beenden', symbol: 'ende' }
    ]);
    this._cmdWindow.show();
    this.enterZoneNav('hand');
    this.refreshAll();
};

Scene_TCGBattle.prototype.enterBattlePhase = function() {
    if (this.isNetworkGuest()) { this.flushNetworkActionLog(); return; }
    this._state = 'battle';
    this._selectedZone = -1;
    this._cmdWindow.setup([{ name: 'Zug beenden', symbol: 'ende' }]);
    this._cmdWindow.show();
    this.enterZoneNav('ownField');
    this.refreshAll();
};

// Vollstaendige Tastatursteuerung fuer Haupt-/Kampfphase: statt eines
// einzelnen "Handkarten"-Sonderfalls gibt es jetzt 5 durchnavigierbare
// Bereiche (oben->unten wie auf dem Bildschirm): gegnerisches Feld,
// gegnerische Ablage, eigenes Feld, eigene Ablage, Hand. Hoch/Runter
// wechselt den Bereich, Links/Rechts bewegt den Cursor INNERHALB des
// Bereichs, Bestaetigen wirkt wie ein Klick auf die fokussierte Karte/Zone,
// Abbrechen aktiviert stattdessen das Kommandofenster (Hauptphase-/Kampf-
// phase-/Zugende-Menue) - von dort fuehrt ERNEUTES Abbrechen zurueck in die
// Zonen-Navigation. Maus/Touch funktioniert unveraendert parallel weiter.
Scene_TCGBattle.prototype.enterZoneNav = function(area) {
    this._cmdWindow.deactivate();
    this._navArea = area || 'hand';
    this._navFieldIndex = 0;
    this._handKeyboardActive = (this._navArea === 'hand');
};

Scene_TCGBattle.prototype.onCmdWindowCancel = function() {
    if (this._state !== 'main' && this._state !== 'battle') return;
    SoundManager.playCancel();
    this._cmdWindow.deactivate();
    this.enterZoneNav(this._navArea || 'hand');
};

// Bereiche, die im jeweiligen Zustand per Hoch/Runter erreichbar sind (in
// dieser Reihenfolge, oben->unten auf dem Bildschirm).
Scene_TCGBattle.NAV_AREAS = ['enemyField', 'enemyGrave', 'ownField', 'ownGrave', 'hand'];

Scene_TCGBattle.prototype.updateZoneNav = function() {
    this.updateZoneNavHighlight();
    if (this._cmdWindow.active) return; // Menue hat gerade den Fokus - eigene Bedienung
    if (Input.isTriggered('cancel')) {
        SoundManager.playCancel();
        this._cmdWindow.activate();
        return;
    }
    var areas = Scene_TCGBattle.NAV_AREAS;
    var curIdx = areas.indexOf(this._navArea);
    if (curIdx < 0) curIdx = areas.length - 1; // Fallback: Hand
    if (Input.isTriggered('down')) {
        var nextIdx = (curIdx + 1) % areas.length;
        this.setNavArea(areas[nextIdx]);
        return;
    }
    if (Input.isTriggered('up')) {
        var prevIdx = (curIdx - 1 + areas.length) % areas.length;
        this.setNavArea(areas[prevIdx]);
        return;
    }
    if (this._navArea === 'ownField' || this._navArea === 'enemyField') {
        if (Input.isTriggered('right')) { this._navFieldIndex = (this._navFieldIndex + 1) % 3; SoundManager.playCursor(); }
        else if (Input.isTriggered('left')) { this._navFieldIndex = (this._navFieldIndex + 2) % 3; SoundManager.playCursor(); }
    }
    // Hand-Navigation (links/rechts) laeuft weiterhin ueber
    // updateHandVisuals()/_handKeyboardActive - hier nur OK behandeln.
    if (Input.isTriggered('ok')) this.activateNavFocus();
};

// Positioniert die Cursor-Hervorhebung passend zum aktuell fokussierten
// Bereich (wiederverwendet das bestehende showZoneHighlight/hideZoneHighlight
// aus der Zielwahl) und haelt das Karteninfo-Panel synchron - genau wie beim
// Hovern mit der Maus.
Scene_TCGBattle.prototype.updateZoneNavHighlight = function() {
    if (this._cmdWindow.active || ['main', 'battle', 'battleTarget'].indexOf(this._state) < 0) {
        this.hideZoneHighlight();
        return;
    }
    if (this._navArea === 'ownField') {
        this.showZoneHighlight(this.mySide(), this._navFieldIndex, 'rgba(80,160,255,0.35)');
        var ownSlot = this._game.player(this.mySide()).zones[this._navFieldIndex];
        this._infoWindow.setCard(ownSlot ? TCG.card(ownSlot.id) : null);
    } else if (this._navArea === 'enemyField') {
        this.showZoneHighlight(this.enemySide(), this._navFieldIndex, 'rgba(255,120,80,0.35)');
        var enemySlot = this._game.player(this.enemySide()).zones[this._navFieldIndex];
        this._infoWindow.setCard(enemySlot ? TCG.card(enemySlot.id) : null);
    } else if (this._navArea === 'ownGrave' || this._navArea === 'enemyGrave') {
        var s = this._navArea === 'ownGrave' ? this.mySide() : this.enemySide();
        var gr = { x: s === 0 ? L.pileLeftX : L.pileRightX, y: s === 0 ? L.playerZoneY : L.enemyZoneY, w: L.zoneW, h: L.zoneH };
        var bmp = this._zoneHighlightSprite.bitmap;
        bmp.clear();
        bmp.fillRect(0, 0, bmp.width, bmp.height, 'rgba(200,200,80,0.35)');
        var b = 3;
        bmp.fillRect(0, 0, bmp.width, b, '#ffffff');
        bmp.fillRect(0, bmp.height - b, bmp.width, b, '#ffffff');
        bmp.fillRect(0, 0, b, bmp.height, '#ffffff');
        bmp.fillRect(bmp.width - b, 0, b, bmp.height, '#ffffff');
        this._zoneHighlightSprite.x = gr.x;
        this._zoneHighlightSprite.y = gr.y;
        this._zoneHighlightSprite.visible = true;
    } else {
        this.hideZoneHighlight();
    }
};

Scene_TCGBattle.prototype.setNavArea = function(area) {
    SoundManager.playCursor();
    this._navArea = area;
    this._handKeyboardActive = (area === 'hand');
    if (area === 'hand' && this._handHoverIndex < 0) {
        this._handHoverIndex = this._game.player(this.mySide()).hand.length > 0 ? 0 : -1;
    }
};

// Wirkt wie ein Klick auf das gerade fokussierte Element - fuehrt fuer jeden
// Bereich zur selben Aktion wie der bestehende Maus-Weg.
Scene_TCGBattle.prototype.activateNavFocus = function() {
    switch (this._navArea) {
        case 'hand':
            if (this._handHoverIndex >= 0) this.onHandCardClicked(this._handHoverIndex);
            break;
        case 'ownField':
            if (this._state === 'main') this.tryActivateOwnZone(this._navFieldIndex);
            else if (this._state === 'battle') this.trySelectAttacker(this._navFieldIndex);
            break;
        case 'enemyField':
            // Kein eigenstaendiger Klick-Vorgang ausserhalb der Zielwahl -
            // die Karteninfo wird bereits beim Navigieren aktualisiert
            // (siehe updateZoneNavHighlight). Bestaetigen tut hier nichts
            // zusaetzliches (wie ein Klick auf eine Karte im normalen
            // Spiel, der auch nur die Info anzeigt).
            break;
        case 'ownGrave':
            SoundManager.playCursor();
            this.openPileView(this.mySide());
            break;
        case 'enemyGrave':
            SoundManager.playCursor();
            this.openPileView(this.enemySide());
            break;
    }
};

// Eigenes Feld, Hauptphase: aktivierbaren Effekt ausloesen (identische
// Logik wie der bestehende Maus-Klick in updateMainInput).
Scene_TCGBattle.prototype.tryActivateOwnZone = function(z) {
    if (!this._game.player(this.mySide()).zones[z]) return;
    if (this._game.canActivate(z)) {
        var mCard = TCG.card(this._game.player(this.mySide()).zones[z].id);
        var costText = TCG.describeEffectCost(this._game.activatableEffects(z)[0].effect);
        this._cmdWindow.deactivate();
        this.openConfirm(mCard, 'Effekt von ' + mCard.name + ' aktivieren? (' + costText + ')',
            'activate', z);
    } else if (this._game.slotEffects(this.mySide(), z, 'aktivierbar').length > 0) {
        SoundManager.playBuzzer();
        this.showToast('Effekt nicht verfuegbar', true);
    }
};

// Eigenes Feld, Kampfphase: als Angreifer waehlen (identische Logik wie der
// bestehende Maus-Klick in updateBattleInput).
Scene_TCGBattle.prototype.trySelectAttacker = function(z) {
    if (this._game.canAttack(z)) {
        this._selectedZone = z;
        SoundManager.playCursor();
        if (this._game.enemyHasMonsters()) {
            this._state = 'battleTarget';
            this._cmdWindow.deactivate();
            this._navArea = 'enemyField';
            this._navFieldIndex = this._game.player(this.enemySide()).zones.findIndex(function(s) { return !!s; });
            if (this._navFieldIndex < 0) this._navFieldIndex = 0;
            this.showToast('Ziel waehlen', true);
        } else {
            this._cmdWindow.deactivate();
            var card = TCG.card(this._game.player(this.mySide()).zones[z].id);
            this.openConfirm(null, 'Direktangriff mit ' + card.name + '?', 'directAttack', z);
        }
    } else if (this._game.player(this.mySide()).zones[z]) {
        SoundManager.playBuzzer();
    }
};

Scene_TCGBattle.prototype.onToBattle = function() {
    this._game.toBattlePhase();
    this.enterBattlePhase();
};

Scene_TCGBattle.prototype.onEndTurn = function() {
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    var self = this;
    this.queueEffects(this._game.turnTriggers('beimZugende'), function() {
        self.checkHandSizeThenAdvance();
    });
};

// Wer ist als naechstes dran, wenn der aktuelle Zug (nach evtl. Abwerfen)
// beendet wird? Fuer 1v1 einfach die Gegenseite - Scene_TCGTagDuel
// ueberschreibt dies mit dem naechsten Sitzplatz in der Zugreihenfolge.
Scene_TCGBattle.prototype.nextTurnTarget = function() {
    return this._game.enemyIndex(this._game.active());
};

// Wer beginnt das Duell? Wird durch startCoinFlipThenProceed() VOR dem
// Deck-Mischen entschieden und hier gespeichert (this._firstTurnSeat) -
// diese Methode liefert nur noch den bereits feststehenden Wert. Falls aus
// irgendeinem Grund noch keiner entschieden wurde (Absicherung), wird hier
// als Rueckfall trotzdem ein Muenzwurf gemacht.
Scene_TCGBattle.prototype.firstTurnSeat = function() {
    if (this._firstTurnSeat === undefined || this._firstTurnSeat === null) {
        this._firstTurnSeat = TCG.coinFlip() ? 0 : 1;
    }
    return this._firstTurnSeat;
};

// Zeigt (falls Bilder konfiguriert sind, siehe TCG.param.coinHeadsImage/
// -TailsImage) eine kurze Muenzwurf-Animation VOR dem Deck-Mischen: die
// Muenze "dreht sich" (Bild wechselt, Breite wird gestaucht/gestreckt) und
// landet auf Kopf (= eigene Seite beginnt) oder Zahl (= Gegner beginnt).
// Ruft callback(firstSeat) auf, sobald das Ergebnis feststeht - OHNE
// konfigurierte Bilder wird der Muenzwurf einfach lautlos entschieden und
// callback sofort aufgerufen (kein Fehler, nur keine Anzeige).
Scene_TCGBattle.prototype.startCoinFlipThenProceed = function(callback) {
    if (!TCG.param.coinHeadsImage || !TCG.param.coinTailsImage) {
        callback(TCG.coinFlip() ? 0 : 1);
        return;
    }
    this._coinFlipCallback = callback;
    this._coinHeadsBitmap = ImageManager.loadPicture(TCG.param.coinHeadsImage);
    this._coinTailsBitmap = ImageManager.loadPicture(TCG.param.coinTailsImage);
    this._coinSprite = new Sprite(this._coinHeadsBitmap);
    this._coinSprite.anchor.x = this._coinSprite.anchor.y = 0.5;
    this._coinSprite.x = Graphics.boxWidth / 2;
    this._coinSprite.y = Graphics.boxHeight / 2 - 20;
    this.addChild(this._coinSprite);
    this._coinLabelSprite = new Sprite(new Bitmap(480, 60));
    this._coinLabelSprite.anchor.x = 0.5;
    this._coinLabelSprite.x = Graphics.boxWidth / 2;
    this._coinLabelSprite.y = Graphics.boxHeight / 2 + 90;
    this.addChild(this._coinLabelSprite);
    this._coinFlipStep = 0;
    this._coinFlipSpinFrames = 90;
    this._coinFlipResult = null;
    this._coinFlipWait = 0;
    this._state = 'coinFlip';
};

// Welcher Sitzplatz/welche Seite gehoert zu Kopf bzw. Zahl? 1v1: Seite 0/1.
// Scene_TCGTagDuel ueberschreibt dies mit Sitzplatz 0/2 (Team A/Team B).
Scene_TCGBattle.prototype.coinFlipSeatFor = function(isHeads) {
    return isHeads ? 0 : 1;
};

// Anzeigetext fuer das Ergebnis. 1v1: eigener Name bzw. Gegner-Name.
// Scene_TCGTagDuel ueberschreibt dies mit den Team-Namen.
Scene_TCGBattle.prototype.coinFlipLabelFor = function(isHeads) {
    var myName = TCG.profile().name;
    var oppName = (Scene_TCGBattle._opponent && Scene_TCGBattle._opponent.name) || 'Gegner';
    return isHeads ? myName : oppName;
};

Scene_TCGBattle.prototype.updateCoinFlip = function() {
    if (this._coinFlipResult !== null) {
        // Ergebnis steht schon fest - kurze Pause, damit man es sehen kann,
        // dann aufraeumen und weitermachen.
        if (--this._coinFlipWait > 0) return;
        this.removeChild(this._coinSprite);
        this.removeChild(this._coinLabelSprite);
        var cb = this._coinFlipCallback;
        this._coinFlipCallback = null;
        cb(this.coinFlipSeatFor(this._coinFlipResult === 'heads'));
        return;
    }
    this._coinFlipStep++;
    // Dreh-Effekt: die Breite der Muenze oszilliert (simuliert eine Drehung
    // um die eigene Achse) - an den schmalsten Punkten wird kurz das Bild
    // gewechselt, damit es waehrend der Drehung flackernd zwischen Kopf/Zahl
    // hin- und herspringt (rein optisch, das ECHTE Ergebnis steht erst am Ende fest).
    var scaleX = Math.cos(this._coinFlipStep * 0.55);
    this._coinSprite.scale.x = scaleX;
    if (Math.abs(scaleX) < 0.1) {
        this._coinSprite.bitmap = (this._coinFlipStep % 2 === 0) ? this._coinTailsBitmap : this._coinHeadsBitmap;
    }
    if (this._coinFlipStep >= this._coinFlipSpinFrames) {
        var isHeads = TCG.coinFlip();
        this._coinFlipResult = isHeads ? 'heads' : 'tails';
        this._coinSprite.scale.x = 1;
        this._coinSprite.bitmap = isHeads ? this._coinHeadsBitmap : this._coinTailsBitmap;
        SoundManager.playOk();
        var bmp = this._coinLabelSprite.bitmap;
        bmp.clear();
        bmp.fontSize = Math.round(22 * L.uiScale);
        bmp.drawText((isHeads ? 'Kopf' : 'Zahl') + ' - ' + this.coinFlipLabelFor(isHeads) + ' beginnt!',
            0, 0, bmp.width, bmp.height, 'center');
        this._coinFlipWait = 60;
    }
};

// Nach Zugende-Triggern: muss ich auf TCG.param.maxHandSize abwerfen? Falls
// ja, erst der Abwerf-Ablauf, danach (nach Bestaetigung) geht es weiter zum
// naechsten Zug. Falls nein, direkt weiter wie bisher.
Scene_TCGBattle.prototype.checkHandSizeThenAdvance = function() {
    if (this._game.needsDiscard(this.mySide())) {
        this.enterDiscardHand();
    } else {
        this.beginTurn(this.nextTurnTarget());
    }
};

// Handkarten-Abwerfen: der Spieler waehlt per Klick ODER Tastatur
// (Hand-Navigation, siehe updateZoneNav) so viele Karten aus, bis die
// Handkartenzahl wieder TCG.param.maxHandSize entspricht.
Scene_TCGBattle.prototype.enterDiscardHand = function() {
    this._state = 'discardHand';
    this._discardNeeded = this._game.player(this.mySide()).hand.length - TCG.param.maxHandSize;
    this._discardSelected = [];
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    this._navArea = 'hand';
    this._handKeyboardActive = true;
    this._handHoverIndex = this._game.player(this.mySide()).hand.length > 0 ? 0 : -1;
    this.refreshDiscardToast();
    this.refreshAll();
};

// Zeigt DAUERHAFT (blendet NICHT nach ein paar Sekunden aus) an, wie viele
// Karten noch zum Abwerfen gewaehlt werden muessen. WICHTIG: die normale
// showToast() blendet nach ca. 1.8s IMMER wieder aus - auch mit
// isHint=true, das steuert nur das Mitloggen ins Spielverlauf-Fenster,
// NICHT die Anzeigedauer! Ohne diesen Ueberschreib-Schritt saehe es fuer
// den Spieler so aus, als waere das Spiel beim Zugwechsel haengen
// geblieben, waehrend es in Wahrheit auf die Kartenauswahl wartet (das war
// vermutlich genau das gemeldete Problem).
Scene_TCGBattle.prototype.refreshDiscardToast = function() {
    var remaining = this._discardNeeded - this._discardSelected.length;
    this.showToast(remaining === 1 ?
        'Noch 1 Karte zum Abwerfen waehlen (Handlimit ueberschritten)' :
        'Noch ' + remaining + ' Karten zum Abwerfen waehlen (Handlimit ueberschritten)', true);
    this._toastFrames = 999999;
};

Scene_TCGBattle.prototype.updateDiscardHand = function() {
    var hand = this._game.player(this.mySide()).hand;
    var n = hand.length;
    if (n === 0) { this.finishDiscardHand(); return; }
    if (Input.isTriggered('right')) {
        this._handHoverIndex = Math.min(n - 1, (this._handHoverIndex < 0 ? 0 : this._handHoverIndex) + 1);
        SoundManager.playCursor();
    } else if (Input.isTriggered('left')) {
        this._handHoverIndex = Math.max(0, (this._handHoverIndex < 0 ? 0 : this._handHoverIndex) - 1);
        SoundManager.playCursor();
    }
    var mouseIdx = this.mouseHandIndex();
    var pickedIdx = -1;
    if (mouseIdx >= 0 && TouchInput.isTriggered()) pickedIdx = mouseIdx;
    else if (Input.isTriggered('ok') && this._handHoverIndex >= 0) pickedIdx = this._handHoverIndex;
    if (pickedIdx < 0) return;
    var pos = this._discardSelected.indexOf(pickedIdx);
    if (pos >= 0) {
        this._discardSelected.splice(pos, 1); // erneut anklicken -> Auswahl aufheben
        SoundManager.playCancel();
    } else if (this._discardSelected.length < this._discardNeeded) {
        this._discardSelected.push(pickedIdx);
        SoundManager.playEquip();
    } else {
        SoundManager.playBuzzer();
        return; // schon genug gewaehlt - die dauerhafte Meldung erklaert bereits, was zu tun ist
    }
    this.refreshDiscardHandVisuals();
    if (this._discardSelected.length === this._discardNeeded) {
        this.finishDiscardHand();
    } else {
        this.refreshDiscardToast();
    }
};

// Zeigt an, welche Handkarten gerade zum Abwerfen markiert sind (leicht
// abgedunkelt) - rein visuelles Feedback, aendert keinen Spielzustand.
Scene_TCGBattle.prototype.refreshDiscardHandVisuals = function() {
    var self = this;
    this._handSprites.forEach(function(sp, i) {
        sp.opacity = self._discardSelected.indexOf(i) >= 0 ? 120 : 255;
    });
};

Scene_TCGBattle.prototype.finishDiscardHand = function() {
    var discarded = this._game.discardHandCards(this.mySide(), this._discardSelected);
    this._discardSelected = [];
    this.showToast(discarded.length + ' Karte(n) abgeworfen');
    this.refreshAll();
    this.beginTurn(this.nextTurnTarget());
};

Scene_TCGBattle.prototype.onSurrenderAsk = function() {
    this._cmdWindow.deactivate();
    this.openConfirm(null, 'Wirklich aufgeben?', 'surrender');
};

//--- Bestaetigungsdialog ------------------------------------------------------
// Holt alle modalen Ueberlagerungs-Elemente (Verdunkelung, grosse
// Kartenvorschau, Effekt-Beschriftung) sowie das jeweils aktive Fenster
// (Bestaetigung ODER Suche) explizit an die vorderste Z-Position - VOR die
// Phasenleiste. Ohne dies wuerde die Phasenleiste (im Windowlayer spaeter
// hinzugefuegt als die Ueberlagerungs-Sprites, die direkt zur Szene
// gehoeren) faelschlich ueber dem Bestaetigungsdialog liegen.
// Fragt VOR dem eigentlichen Abbrechen eines Effekts (Zielwahl, Suche usw.)
// nach Bestaetigung - verhindert versehentliches Abbrechen durch ESC/
// Rechtsklick. resumeState wird bei "Nein" wiederhergestellt (siehe
// onConfirmNo), onCancelConfirmed nur bei "Ja" ausgefuehrt.
Scene_TCGBattle.prototype.confirmCancelEffect = function(resumeState, onCancelConfirmed) {
    this._cancelEffectCallback = onCancelConfirmed;
    this.openConfirm(null, 'Effekt wirklich abbrechen?', 'cancelEffect', resumeState,
        ['Ja, abbrechen', 'Nein, weiter']);
};

// Holt das jeweils aktive modale Fenster (Bestaetigung ODER Suche) innerhalb
// des modalen Layers (siehe create()) nochmal nach vorne - fuer den Fall,
// dass beide nacheinander verwendet wurden. Die grundsaetzliche Sichtbarkeit
// VOR der Phasenleiste ist bereits dadurch sichergestellt, dass der gesamte
// modale Layer als allerletztes Kind der Szene angelegt wurde (siehe create()).
Scene_TCGBattle.prototype.bringModalToFront = function(activeWindow) {
    if (activeWindow && this._modalLayer) this._modalLayer.addChild(activeWindow);
};

Scene_TCGBattle.prototype.openConfirm = function(card, hint, mode, payload, labels) {
    this._confirmMode = mode;
    this._confirmPayload = payload;
    this._dimSprite.visible = true;
    if (card) {
        this._bigCardSprite.scale.x = this._bigCardSprite.scale.y = L.confirmCardScale;
        this._bigCardSprite.x = L.confirmCardX;
        this._bigCardSprite.y = L.confirmY;
        this._bigCardSprite.setCard(card, false);
        this._bigCardSprite.visible = true;
    }
    this._confirmWindow.setup([
        { name: (labels && labels[0]) || 'Ja',   symbol: 'ja' },
        { name: (labels && labels[1]) || 'Nein', symbol: 'nein' }
    ]);
    // Ohne Kartenvorschau (z.B. "Wirklich aufgeben?") wird die rechte Spalte
    // (Hinweis + Auswahl) in die Mitte des gesamten Blocks gerueckt statt an
    // dessen rechten Rand, damit sie nicht einseitig verschoben wirkt.
    var rightColumnX = card ? L.confirmWindowX : Math.round(L.fieldCenterX - this._confirmWindow.width / 2);
    this._confirmWindow.x = rightColumnX;
    this._confirmWindow.y = L.confirmWindowY;
    this._confirmWindow.show();
    this._confirmWindow.activate();
    // Hinweistext (was gerade passiert, z.B. "Wirklich hier beschwoeren?")
    // OBEN in der rechten Spalte - Karte links, Hinweis oben rechts,
    // Auswahl darunter.
    this._confirmLabelSprite.anchor.x = 0;
    this._confirmLabelSprite.x = rightColumnX;
    this._confirmLabelSprite.y = L.confirmHintY;
    this.drawHint(hint || '');
    this.bringModalToFront(this._confirmWindow);
    this._stateBeforeConfirm = this._state;
    this._state = 'confirm';
};

// Zeigt die Effekt-/Auswirkungsbeschriftung UNTER dem Bestaetigungsfenster
// (z.B. "Effekt von X aktivieren? (Kosten)") - eigene Sprite, getrennt vom
// normalen Toast, damit beide unabhaengig voneinander sichtbar sein koennen.
Scene_TCGBattle.prototype.drawHint = function(text) {
    var bmp = this._confirmLabelSprite.bitmap;
    bmp.clear();
    if (text) {
        bmp.fillRect(0, 0, bmp.width, bmp.height, 'rgba(0,0,0,0.75)');
        bmp.fontSize = Math.round(15 * L.uiScale);
        bmp.textColor = '#ffd75e';
        bmp.outlineWidth = 3;
        bmp.drawText(text, 0, 0, bmp.width, bmp.height, 'center');
        this._confirmLabelSprite.visible = true;
    }
};

Scene_TCGBattle.prototype.closeConfirm = function() {
    this._confirmWindow.hide();
    this._confirmWindow.deactivate();
    this._dimSprite.visible = false;
    this._bigCardSprite.visible = false;
    this._confirmLabelSprite.visible = false;
};

Scene_TCGBattle.prototype.onConfirmYes = function() {
    var mode = this._confirmMode;
    var payload = this._confirmPayload;
    this.closeConfirm();
    SoundManager.playOk();
    switch (mode) {
        case 'cancelEffect': {
            var cb = this._cancelEffectCallback;
            this._cancelEffectCallback = null;
            if (cb) cb();
            break;
        }
        case 'searchTake':
            this.onSearchTakeConfirmed(payload);
            break;
        case 'surrender':
            this._game.surrender(0);
            this.startResult();
            break;
        case 'payment':
            this.resolvePaymentChoice(payload, 'ap');
            break;
        case 'placeZone':
            this.finishPlacement(payload);
            break;
        case 'ritualPay':
            this._pendingSummon = { kind: 'ritual', hand: payload.handIndex, payMethod: payload.method };
            this._state = 'tributePick';
            this._cursorZone = null;
            this._cmdWindow.deactivate();
            this.showToast('Tribut waehlen (eigenes Monster)', true);
            break;
        case 'spell': {
            var spellCard = TCG.card(this._game.player(this.mySide()).hand[payload]);
            var effects = this._game.playSpell(payload);
            if (spellCard) this.playElementAnimation(null, spellCard.element, TCG.param.spellAnimationDefault);
            this.refreshAll();
            this.queueEffects(effects, this.enterMainPhase.bind(this));
            break;
        }
        case 'activate': {
            var actEffects = this._game.activate(payload);
            this.refreshAll();
            this.queueEffects(actEffects, this.enterMainPhase.bind(this));
            break;
        }
        case 'equip':
            this._pendingSummon = { kind: 'equip', hand: payload };
            this._state = 'equipPick';
            this._cursorZone = null;
            this._cmdWindow.deactivate();
            this.showToast('Eigenes Monster fuer die Ausruestung waehlen', true);
            break;
        case 'fusion': {
            var fusionMaterialZones = this._game.fusionPlan(payload).feld;
            this.snapshotBeforeSummon();
            this._game.beginFusion(payload);
            SoundManager.playEquip();
            var self1 = this;
            fusionMaterialZones.forEach(function(z) {
                var sp = self1._zoneSprites && self1._zoneSprites[self1.mySide()] && self1._zoneSprites[self1.mySide()][z];
                if (sp) sp.playTrigger('ablage');
            });
            this.refreshAll();
            this.enterPlaceZone();
            break;
        }
        case 'ritual':
            this._pendingSummon = { kind: 'ritual', hand: payload };
            this._state = 'tributePick';
            this._cursorZone = null;
            this._cmdWindow.deactivate();
            this.showToast('Tribut waehlen (eigenes Monster)', true);
            break;
        case 'directAttack': {
            var atkSprite = this._zoneSprites[this.mySide()][payload];
            if (atkSprite) atkSprite.playTrigger('angriff');
            var result = this._game.attack(payload, -1);
            this.afterAttack(result);
            break;
        }
    }
};

// Loest die Zahlungsart-Wahl auf (Ja = AP, Nein = Token) und macht dort weiter,
// wo die Beschwoerung eigentlich hingehoert (direkt platzieren, Tribut waehlen,
// oder erst die normale Ritual-Bestaetigung anzeigen).
Scene_TCGBattle.prototype.resolvePaymentChoice = function(payload, method) {
    var g = this._game;
    var handIndex = payload.handIndex;
    var card = TCG.card(g.player(this.mySide()).hand[handIndex]);
    if (payload.nextKind === 'ritual') {
        this._cmdWindow.deactivate();
        this.openConfirm(card, 'Ritual? Verbraucht ' + TCG.describeSummon(card),
            'ritualPay', { handIndex: handIndex, method: method });
        return;
    }
    if (payload.nextKind === 'tribut') {
        this._pendingSummon = { kind: 'tribut', hand: handIndex, payMethod: method };
        this._state = 'tributePick';
        this._cursorZone = null;
        this._cmdWindow.deactivate();
        this.showToast('Tribut waehlen (eigenes Monster)', true);
        return;
    }
    // 'normal': keine Tribut-/Ritual-Zwischenschritte, direkt platzieren
    this.snapshotBeforeSummon();
    var paid = g.beginNormalSummon(handIndex, -1, method);
    if (paid) this.showToast(TCG.tokenName(card.tokenErsatzTyp) + ' statt AP bezahlt');
    this.refreshAll();
    this.enterPlaceZone();
};

Scene_TCGBattle.prototype.onConfirmNo = function() {
    if (this._confirmMode === 'searchTake') {
        this.closeConfirm();
        SoundManager.playCancel();
        this._state = 'search';
        this._searchWindow.activate();
        return;
    }
    if (this._confirmMode === 'cancelEffect') {
        var resumeState = this._confirmPayload;
        this._cancelEffectCallback = null;
        this.closeConfirm();
        SoundManager.playOk();
        if (resumeState === 'search') {
            this._state = 'search';
            this._searchWindow.activate();
        } else {
            this._state = resumeState;
        }
        return;
    }
    if (this._confirmMode === 'payment') {
        var payload = this._confirmPayload;
        this.closeConfirm();
        SoundManager.playOk();
        this.resolvePaymentChoice(payload, 'token');
        return;
    }
    if (this._confirmMode === 'placeZone') {
        this.closeConfirm();
        SoundManager.playCancel();
        this._state = 'placeZone';
        this.showToast('Andere Zone waehlen - Abbrechen mit ESC/B (Kosten werden erstattet)', true);
        return;
    }
    this.closeConfirm();
    SoundManager.playCancel();
    if (this._stateBeforeConfirm === 'turnStart') {
        this._state = 'turnStart';
        this._cmdWindow.setup([
            { name: 'Ziehen',   symbol: 'ziehen' },
            { name: 'Aufgeben', symbol: 'aufgeben' }
        ]);
        this._cmdWindow.show();
        this._cmdWindow.activate();
    } else if (this._stateBeforeConfirm === 'battle') {
        this.enterBattlePhase();
    } else {
        this.enterMainPhase();
    }
};

//--- Zonenwahl fuer schwebende Beschwoerung -----------------------------------
// Sichert den kompletten Spielerzustand (AP, Hand, Ablage, Exil, Token...)
// UNMITTELBAR bevor Kosten fuer eine Beschwoerung abgebucht werden. Bricht der
// Spieler die Platzierung danach ab (siehe updatePlaceZone), wird exakt dieser
// Zustand wiederhergestellt - eine echte Rueckerstattung, kein "irgendwo
// platzieren".
Scene_TCGBattle.prototype.snapshotBeforeSummon = function() {
    this._preSummonSnapshot = JSON.parse(JSON.stringify(this._game.player(0)));
};

Scene_TCGBattle.prototype.enterPlaceZone = function() {
    this._state = 'placeZone';
    this._cmdWindow.deactivate();
    this._cursorZone = null;
    this.showToast('Zone waehlen (Pfeiltasten+OK oder Maus) - Abbrechen mit ESC/B (Kosten werden erstattet)', true);
};

Scene_TCGBattle.prototype.showZoneHighlight = function(side, index, color) {
    var r = zoneRect(side, index);
    var bmp = this._zoneHighlightSprite.bitmap;
    bmp.clear();
    bmp.fillRect(0, 0, bmp.width, bmp.height, color || 'rgba(80,160,255,0.35)');
    var b = 3;
    bmp.fillRect(0, 0, bmp.width, b, '#ffffff');
    bmp.fillRect(0, bmp.height - b, bmp.width, b, '#ffffff');
    bmp.fillRect(0, 0, b, bmp.height, '#ffffff');
    bmp.fillRect(bmp.width - b, 0, b, bmp.height, '#ffffff');
    this._zoneHighlightSprite.x = r.x;
    this._zoneHighlightSprite.y = r.y;
    this._zoneHighlightSprite.visible = true;
};

Scene_TCGBattle.prototype.hideZoneHighlight = function() {
    this._zoneHighlightSprite.visible = false;
};

// Generischer Zonen-Cursor fuer alle Auswahl-Zustaende (Beschwoerungs-Zone,
// Ziel-Auswahl, Tribut, Ausruestung): Pfeiltasten/D-Pad bewegen ihn zwischen
// den (bis zu 3) gueltigen Zonen einer Seite (isValid(z) prueft, welche
// Zonen gerade waehlbar sind - z.B. nur leere bei der Beschwoerung). Die
// Maus setzt den Cursor beim Hovern ebenso, sodass Maus und Tastatur/
// Controller sich nahtlos abwechseln lassen. Rueckgabe: gewaehlte Zone
// (0-2) bei OK/Klick auf die Cursor-Zone, sonst -1.
Scene_TCGBattle.prototype.updateZoneCursor = function(side, isValid, highlightColor) {
    if (this._cursorZone === null || this._cursorZone === undefined || !isValid(this._cursorZone)) {
        this._cursorZone = null;
        for (var i = 0; i < 3; i++) { if (isValid(i)) { this._cursorZone = i; break; } }
    }
    for (var z = 0; z < 3; z++) {
        if (isValid(z) && pointInRect(TCG.mouse.x, TCG.mouse.y, zoneRect(side, z))) {
            this._cursorZone = z;
            break;
        }
    }
    if (this._cursorZone === null) { this.hideZoneHighlight(); return -1; }
    this.showZoneHighlight(side, this._cursorZone, highlightColor);

    if (Input.isTriggered('right')) this.moveZoneCursor(1, isValid);
    if (Input.isTriggered('left')) this.moveZoneCursor(-1, isValid);

    var confirmedByKey = Input.isTriggered('ok');
    var confirmedByClick = TouchInput.isTriggered() &&
        pointInRect(TouchInput.x, TouchInput.y, zoneRect(side, this._cursorZone));
    if (confirmedByKey || confirmedByClick) return this._cursorZone;
    return -1;
};

Scene_TCGBattle.prototype.moveZoneCursor = function(dir, isValid) {
    if (this._cursorZone === null || this._cursorZone === undefined) return;
    var next = this._cursorZone;
    for (var i = 0; i < 3; i++) {
        next = (next + dir + 3) % 3;
        if (isValid(next)) { this._cursorZone = next; SoundManager.playCursor(); return; }
    }
};

// Bricht die laufende Beschwoerung vollstaendig ab: stellt den vor der
// Kostenzahlung gesicherten Spielerzustand wieder her (AP, Hand, Ablage,
// Exil, Token - eine echte Rueckerstattung statt "irgendwo platzieren").
Scene_TCGBattle.prototype.cancelSummon = function() {
    SoundManager.playCancel();
    this.hideZoneHighlight();
    if (this._preSummonSnapshot) {
        this._game.restorePlayer(0, this._preSummonSnapshot);
        this._preSummonSnapshot = null;
    }
    this._game.clearFloating();
    this.showToast('Beschw\u00f6rung abgebrochen - Kosten erstattet');
    this.refreshAll();
    this.enterMainPhase();
};

Scene_TCGBattle.prototype.updatePlaceZone = function() {
    if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
        this.cancelSummon();
        return;
    }
    var self = this;
    var picked = this.updateZoneCursor(self.mySide(), function(z) { return !self._game.player(self.mySide()).zones[z]; },
        'rgba(80,160,255,0.35)');
    if (picked >= 0) {
        this.hideZoneHighlight();
        var card = TCG.card(this._game._floating);
        this._cmdWindow.deactivate();
        this.openConfirm(card, 'Wirklich hier beschw\u00f6ren? (ESC/B: zur\u00fcck zur Auswahl)',
            'placeZone', picked, ['Ja, beschw\u00f6ren', 'Zur\u00fcck zur Auswahl']);
    }
};

Scene_TCGBattle.prototype.finishPlacement = function(zoneIndex) {
    this._preSummonSnapshot = null; // final platziert - kein Abbruch mehr moeglich/noetig
    var effects = this._game.placeFloating(zoneIndex);
    SoundManager.playEquip();
    this.refreshAll();
    var sp = this._zoneSprites[this.mySide()][zoneIndex];
    if (sp) sp.playTrigger('beschwoerung');
    this.queueEffects(effects, this.enterMainPhase.bind(this));
};

//--- Tribut- und Ausruestungswahl ---------------------------------------------
Scene_TCGBattle.prototype.updateTributePick = function() {
    if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
        SoundManager.playCancel();
        this.hideZoneHighlight();
        this.enterMainPhase();
        return;
    }
    var self = this;
    var picked = this.updateZoneCursor(self.mySide(), function(z) { return !!self._game.player(self.mySide()).zones[z]; },
        'rgba(80,160,255,0.35)');
    if (picked < 0) return;
    var pending = this._pendingSummon;
    var pendingCard = TCG.card(this._game.player(this.mySide()).hand[pending.hand]);
    if (pending.kind === 'ritual') {
        if (!this._game.tributeMatches(pendingCard, picked)) {
            SoundManager.playBuzzer();
            this.showToast('Dieses Monster erfuellt die Tribut-Anforderung nicht', true);
            return;
        }
        this.snapshotBeforeSummon();
        var tributeSprite1 = this._zoneSprites && this._zoneSprites[this.mySide()] && this._zoneSprites[this.mySide()][picked];
        var paidRitual = this._game.beginRitual(pending.hand, picked, pending.payMethod);
        if (tributeSprite1) tributeSprite1.playTrigger('ablage');
        if (paidRitual) this.showToast(TCG.tokenName(pendingCard.tokenErsatzTyp) + ' statt AP bezahlt');
    } else {
        this.snapshotBeforeSummon();
        var tributeSprite2 = this._zoneSprites && this._zoneSprites[this.mySide()] && this._zoneSprites[this.mySide()][picked];
        var paidTribut = this._game.beginNormalSummon(pending.hand, picked, pending.payMethod);
        if (tributeSprite2) tributeSprite2.playTrigger('ablage');
        if (paidTribut) this.showToast(TCG.tokenName(pendingCard.tokenErsatzTyp) + ' statt AP bezahlt');
    }
    this._pendingSummon = null;
    SoundManager.playEquip();
    this.refreshAll();
    this.hideZoneHighlight();
    this.enterPlaceZone();
};

Scene_TCGBattle.prototype.updateEquipPick = function() {
    if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
        SoundManager.playCancel();
        this.hideZoneHighlight();
        this._pendingSummon = null;
        this.enterMainPhase();
        return;
    }
    var self = this;
    var picked = this.updateZoneCursor(self.mySide(), function(z) { return !!self._game.player(self.mySide()).zones[z]; },
        'rgba(80,160,255,0.35)');
    if (picked < 0) return;
    this._game.equip(this._pendingSummon.hand, picked);
    this._pendingSummon = null;
    SoundManager.playEquip();
    this.showToast('Ausruestung angelegt');
    this.refreshAll();
    this.hideZoneHighlight();
    this.enterMainPhase();
};

//--- Effekt-Warteschlange (Spieler-Seite mit Zielwahl, KI-Seite automatisch) --
Scene_TCGBattle.prototype.queueEffects = function(entries, onDone) {
    this._effectQueue = (entries || []).slice();
    this._effectDone = onDone;
    this.processEffectQueue();
};

// Prueft, ob an (side, zone) VOR einem Effekt ein Monster stand und JETZT
// nicht mehr - falls ja, spielt die Zerstoerungs-Animation auf der
// zugehoerigen Sprite ab (muss VOR dem naechsten refreshAll() aufgerufen
// werden, siehe isPlayingExitTrigger).
Scene_TCGBattle.prototype.checkAndAnimateDestroy = function(side, zone, hadMonsterBefore) {
    if (!hadMonsterBefore) return;
    if (this._game.player(side).zones[zone]) return; // steht noch da - keine Zerstoerung
    var sp = this._zoneSprites && this._zoneSprites[side] && this._zoneSprites[side][zone];
    if (sp) sp.playTrigger('zerstoerung');
    this.playAnimation(sp, TCG.param.destroyAnimation);
    this.flashPortraitExpression(side, 'schmerz', 90);
};

Scene_TCGBattle.prototype.processEffectQueue = function() {
    if (this._game.isOver()) { this.startResult(); return; }
    if (this._effectQueue.length === 0) {
        this.refreshAll();
        if (this._effectDone) {
            var cb = this._effectDone;
            this._effectDone = null;
            cb();
        }
        return;
    }
    var entry = this._effectQueue.shift();
    // KI-seitige Trigger automatisch aufloesen
    if (this.isAiSide(entry.side)) {
        var texts = this._game.aiResolveEffects([entry]);
        if (texts.length > 0) this.showToast(texts.join(' \u00b7 '));
        this.refreshAll();
        this.processEffectQueue();
        return;
    }
    var effect = entry.effect;
    var type = this._game.effectTargetType(effect);
    if (!type) {
        var result = this._game.resolveEffect(this.mySide(), effect, this.mySide(), null);
        if (result.text) this.showToast(result.text);
        if (result.triggers) this._effectQueue = result.triggers.concat(this._effectQueue);
        this.refreshAll();
        this.processEffectQueue();
        return;
    }
    this._currentEffect = effect;
    this._currentEffectSourceZone = entry.sourceZone;
    if (type === 'ziel') {
        var modus = this._game.zielModus(effect);
        var targetSide = this._game.resolveZielSeite(effect, this.mySide());
        if (modus === 'selbst') {
            var srcZone = entry.sourceZone;
            if (srcZone === undefined || srcZone === null || !this._game.player(this.mySide()).zones[srcZone]) {
                this.processEffectQueue();
                return;
            }
            var r0 = this._game.resolveEffect(this.mySide(), effect, this.mySide(), srcZone);
            if (r0.text) this.showToast(r0.text);
            if (r0.triggers) this._effectQueue = r0.triggers.concat(this._effectQueue);
            this.checkAndAnimateDestroy(this.mySide(), srcZone, true);
            this.refreshAll();
            this.processEffectQueue();
        } else if (modus === 'alleEigene' || modus === 'alleGegnerische') {
            var texts2 = [];
            for (var z = 0; z < 3; z++) {
                if (!this._game.player(targetSide).zones[z]) continue;
                var r1 = this._game.resolveEffect(this.mySide(), effect, targetSide, z);
                if (r1.text) texts2.push(r1.text);
                if (r1.triggers) this._effectQueue = this._effectQueue.concat(r1.triggers);
                this.checkAndAnimateDestroy(targetSide, z, true);
            }
            if (texts2.length > 0) this.showToast(texts2.join(' \u00b7 '));
            this.refreshAll();
            this.processEffectQueue();
        } else {
            // gegner/verbuendeter: Spieler waehlt (bis zu) effectTargetCount Ziele nacheinander
            if (!this.anyZone(targetSide)) { this.showToast('Kein Ziel', true); this.processEffectQueue(); return; }
            this._targetPicksRemaining = this._game.effectTargetCount(effect);
            this._pickedZones = [];
            this._cursorZone = null;
            this._state = targetSide === this.mySide() ? 'targetOwn' : 'targetEnemy';
            this.showToast((targetSide === this.mySide() ? 'Eigenes' : 'Gegnerisches') + ' Monster als Ziel w\u00e4hlen' +
                (this._targetPicksRemaining > 1 ? ' (noch ' + this._targetPicksRemaining + ')' : '') +
                ' - Abbrechen mit ESC/B', true);
        }
    } else if (type === 'search') {
        this._searchRemaining = Number(effect.wert) || 1;
        this.openSearch();
    }
};

Scene_TCGBattle.prototype.anyZone = function(side) {
    return this._game.player(side).zones.some(function(z) { return !!z; });
};

Scene_TCGBattle.prototype.openSearch = function() {
    var matches = this._game.searchMatches(0, this._currentEffect);
    if (matches.length === 0 || this._searchRemaining <= 0) {
        this._searchWindow.hide();
        this._searchWindow.deactivate();
        this._bigCardSprite.visible = false;
        this._infoWindow.setCard(null);
        this.processEffectQueue();
        return;
    }
    this._state = 'search';
    var self = this;
    this._searchWindow.setMatches(matches);
    // Visuelle Kartenvorschau + Info-Panel folgen der Auswahl (wie beim
    // Hovern ueber Hand-/Feldkarten) - links neben der Liste positioniert.
    this._searchWindow._onSelectionChange = function(match) {
        if (!match) { self._bigCardSprite.visible = false; self._infoWindow.setCard(null); return; }
        self._infoWindow.setCard(match.card);
        self._bigCardSprite.scale.x = self._bigCardSprite.scale.y = L.confirmCardScale;
        self._bigCardSprite.x = self._searchWindow.x - L.confirmCardW - Math.round(20 * L.uiScale);
        self._bigCardSprite.y = self._searchWindow.y;
        self._bigCardSprite.setCard(match.card, false);
        self._bigCardSprite.visible = true;
    };
    this._searchWindow._onSelectionChange(this._searchWindow.match());
    this._searchWindow.show();
    this._searchWindow.activate();
    this.bringModalToFront(this._searchWindow);
};

Scene_TCGBattle.prototype.onSearchOk = function() {
    var match = this._searchWindow.match();
    if (!match) { this.openSearch(); return; }
    this._searchWindow.deactivate();
    var self = this;
    this._pendingSearchMatch = match;
    this.openConfirm(match.card, match.card.name + ' wirklich w\u00e4hlen?', 'searchTake', match);
};

Scene_TCGBattle.prototype.onSearchTakeConfirmed = function(match) {
    var id = this._game.takeFromDeck(0, match.deckIndex);
    this.showToast(TCG.card(id).name + ' auf die Hand');
    this._searchRemaining--;
    this.refreshAll();
    this.openSearch();
};

Scene_TCGBattle.prototype.onSearchCancel = function() {
    this._searchWindow.deactivate();
    var self = this;
    this.confirmCancelEffect('search', function() {
        self._searchWindow.hide();
        self._bigCardSprite.visible = false;
        self._infoWindow.setCard(null);
        self.processEffectQueue();
    });
};

//--- Angriff ------------------------------------------------------------------
Scene_TCGBattle.prototype.afterAttack = function(result) {
    SoundManager.playEnemyDamage();
    if (result.text) this.showToast(result.text);
    this._selectedZone = -1;
    this.refreshAll();
    if (this._game.isOver()) { this.startResult(); return; }
    this.queueEffects(result.triggers || [], this.enterBattlePhase.bind(this));
};

//--- Ergebnis -----------------------------------------------------------------
Scene_TCGBattle.prototype.startResult = function() {
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    this._searchWindow.hide();
    this._searchWindow.deactivate();
    this.closeConfirm();
    this.refreshAll();
    var won = this._game.winner() === 0;
    if (won) SoundManager.playRecovery(); else SoundManager.playMiss();
    this.showBanner(won ? 'SIEG!' : 'NIEDERLAGE ...', 999999, null);
    this._bannerFrames = 999999;
    this._state = 'result';
    this._resultWon = won;
};

Scene_TCGBattle.prototype.updateResult = function() {
    this._bannerSprite.opacity = Math.min(255, this._bannerSprite.opacity + 15);
    if (Input.isTriggered('ok') || TouchInput.isTriggered()) {
        if (TCG.param.resultVar > 0 && this._netRole !== 'spectator') {
            $gameVariables.setValue(TCG.param.resultVar, this._resultWon ? 1 : 2);
        }
        SceneManager.pop();
    }
};

//--- KI-Zug -------------------------------------------------------------------
Scene_TCGBattle.prototype.updateAiTurn = function() {
    if (this._aiWait > 0) { this._aiWait--; return; }
    if (this._game.isOver()) { this.startResult(); return; }

    if (!this._aiDrew) {
        this._aiDrew = true;
        this._game.doDraw();
        this.refreshAll();
        if (this._game.isOver()) { this.startResult(); return; }
        var startTexts = this._game.aiResolveEffects(this._game.turnTriggers('beimZugbeginn'));
        if (startTexts.length > 0) this.showToast(startTexts.join(' \u00b7 '));
        this._aiWait = 45;
        return;
    }

    var g = this._game;
    var action = g.aiNextAction();
    var texts;
    switch (action.type) {
        case 'spell': {
            var card = TCG.card(g.activePlayer().hand[action.hand]);
            var effects = g.playSpell(action.hand);
            this.showAiCard(card);
            this.playElementAnimation(null, card.element, TCG.param.spellAnimationDefault);
            texts = g.aiResolveEffects(effects);
            if (texts.length > 0) this.showToast(texts.join(' \u00b7 '));
            this._aiWait = 75;
            break;
        }
        case 'summon': {
            var mCard = TCG.card(g.activePlayer().hand[action.hand]);
            var summonTributeZone = (action.tribute === null || action.tribute === undefined) ? -1 : action.tribute;
            g.beginNormalSummon(action.hand, summonTributeZone);
            if (summonTributeZone >= 0) {
                var summonTributeSp = this._zoneSprites && this._zoneSprites[this.enemySide()] && this._zoneSprites[this.enemySide()][summonTributeZone];
                if (summonTributeSp) summonTributeSp.playTrigger('ablage');
            }
            var summonZone = g.aiPickZone(mCard.id);
            var sEffects = g.placeFloating(summonZone);
            this.showAiCard(mCard);
            SoundManager.playEquip();
            this.refreshAll();
            var summonSp = this._zoneSprites[this.enemySide()][summonZone];
            if (summonSp) summonSp.playTrigger('beschwoerung');
            texts = g.aiResolveEffects(sEffects);
            if (texts.length > 0) this.showToast(texts.join(' \u00b7 '));
            this._aiWait = 75;
            break;
        }
        case 'fusion': {
            var fCard = TCG.card(g.activePlayer().hand[action.hand]);
            var fusionMaterialZones = g.fusionPlan(action.hand).feld;
            g.beginFusion(action.hand);
            var self2 = this;
            fusionMaterialZones.forEach(function(z) {
                var sp = self2._zoneSprites && self2._zoneSprites[self2.enemySide()] && self2._zoneSprites[self2.enemySide()][z];
                if (sp) sp.playTrigger('ablage');
            });
            var fusionZone = g.aiPickZone(fCard.id);
            var fEffects = g.placeFloating(fusionZone);
            this.showAiCard(fCard);
            SoundManager.playEquip();
            this.showToast('Fusionsbeschwoerung: ' + fCard.name);
            this.refreshAll();
            var fusionSp = this._zoneSprites[this.enemySide()][fusionZone];
            if (fusionSp) fusionSp.playTrigger('beschwoerung');
            g.aiResolveEffects(fEffects);
            this._aiWait = 85;
            break;
        }
        case 'ritual': {
            var rCard = TCG.card(g.activePlayer().hand[action.hand]);
            var ritualTributeSp = this._zoneSprites && this._zoneSprites[this.enemySide()] && this._zoneSprites[this.enemySide()][action.tribute];
            g.beginRitual(action.hand, action.tribute);
            if (ritualTributeSp) ritualTributeSp.playTrigger('ablage');
            var ritualZone = g.aiPickZone(rCard.id);
            var rEffects = g.placeFloating(ritualZone);
            this.showAiCard(rCard);
            SoundManager.playEquip();
            this.showToast('Ritualbeschwoerung: ' + rCard.name);
            this.refreshAll();
            var ritualSp = this._zoneSprites[this.enemySide()][ritualZone];
            if (ritualSp) ritualSp.playTrigger('beschwoerung');
            g.aiResolveEffects(rEffects);
            this._aiWait = 85;
            break;
        }
        case 'equip': {
            var eCard = TCG.card(g.activePlayer().hand[action.hand]);
            g.equip(action.hand, action.zone);
            this.showAiCard(eCard);
            this.showToast(eCard.name + ' ausgeruestet');
            this._aiWait = 65;
            break;
        }
        case 'activate': {
            var aEffects = g.activate(action.zone);
            texts = g.aiResolveEffects(aEffects);
            if (texts.length > 0) this.showToast(texts.join(' \u00b7 '));
            this._aiWait = 60;
            break;
        }
        case 'toBattle':
            g.toBattlePhase();
            this.showToast('Kampfphase');
            this._aiWait = 40;
            break;
        case 'attack': {
            var atkSp = this._zoneSprites[this.enemySide()][action.zone];
            if (atkSp) atkSp.playTrigger('angriff');
            var result = g.attack(action.zone, action.target);
            SoundManager.playEnemyAttack();
            if (result.text) this.showToast(result.text);
            var trigTexts = g.aiResolveEffects(result.triggers);
            // Spieler-seitige Trigger (z.B. beiZerstoerung) sind in aiResolveEffects
            // enthalten, da entries ihre Seite mitfuehren.
            this._aiWait = 70;
            break;
        }
        case 'endTurn':
        default:
            this.hideAiCard();
            g.aiResolveEffects(g.turnTriggers('beimZugende'));
            if (g.needsDiscard(g.active())) {
                var discardCount = g.player(g.active()).hand.length - TCG.param.maxHandSize;
                g.discardHandCards(g.active(), g.aiChooseDiscards(g.active(), discardCount));
            }
            this.afterOpponentTurnEnds();
            return;
    }
    this.refreshAll();
    if (this._game.isOver()) this.startResult();
};

// Was nach einem KI-Zug als naechstes beginnt - beim 1v1-Duell immer Seite 0
// (der Mensch). Scene_TCGTagDuel ueberschreibt dies (naechster Sitzplatz in
// der Rotation statt einfach "Seite 0").
Scene_TCGBattle.prototype.afterOpponentTurnEnds = function() { this.beginTurn(0); };

Scene_TCGBattle.prototype.showAiCard = function(card) {
    this._bigCardSprite.scale.x = this._bigCardSprite.scale.y = 1;
    this._bigCardSprite.x = L.fieldX + Math.floor((Graphics.boxWidth - L.fieldX - TCG.param.cardW) / 2);
    this._bigCardSprite.y = Math.max(20, Math.floor((Graphics.boxHeight - TCG.param.cardH) / 2) - 30);
    this._bigCardSprite.setCard(card, false);
    this._bigCardSprite.visible = true;
    this._aiShowCardSprite = true;
    this._aiCardFrames = 60;
};

Scene_TCGBattle.prototype.hideAiCard = function() {
    this._bigCardSprite.visible = false;
    this._aiShowCardSprite = false;
};

//--- Toast --------------------------------------------------------------------
// isHint: true fuer reine Navigations-/Auswahl-Hinweise ("Zone waehlen..."),
// die NICHT in den Spielverlauf-Log gehoeren (kein eigentliches Spielereignis).
// Standard (false/weggelassen): der Text landet zusaetzlich im Log.
Scene_TCGBattle.prototype.showToast = function(text, isHint) {
    var bmp = this._toastSprite.bitmap;
    bmp.clear();
    bmp.fillRect(0, 0, bmp.width, bmp.height, 'rgba(0,0,0,0.72)');
    bmp.fontSize = Math.round(17 * L.uiScale);
    bmp.textColor = '#ffffff';
    bmp.outlineWidth = 3;
    bmp.drawText(text, 0, 0, bmp.width, bmp.height, 'center');
    this._toastSprite.visible = true;
    this._toastFrames = 110;
    if (!isHint) this.logEvent(text);
};

// Fuegt einen Eintrag zum Spielverlauf-Fenster hinzu (unten links).
Scene_TCGBattle.prototype.logEvent = function(text, header) {
    if (this._logWindow) this._logWindow.addEntry(text, header);
};

//--- Update -------------------------------------------------------------------
Scene_TCGBattle.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    if (this._toastFrames > 0 && --this._toastFrames === 0) {
        this._toastSprite.visible = false;
    }
    if (this._aiShowCardSprite && --this._aiCardFrames <= 0) this.hideAiCard();
    this.updatePortraitTimers();
    this.updateAnimationSprites();
    this.refreshHoverArt();
    this.updateTimer();
    this.updateGraveClicks();
    switch (this._state) {
        case 'intro':        this.updateIntro();        break;
        case 'banner':       this.updateBanner();       break;
        case 'result':       this.updateResult();       break;
        case 'aiTurn':       this.updateAiTurn();       break;
        case 'remoteTurn':   /* Event-getrieben (onNetworkMessage) - kein Update noetig */ break;
        case 'awaitingReconnect': /* Event-getrieben (onGuestReconnected/finalizeDisconnect) - kein Update noetig */ break;
        case 'discardHand':  this.updateDiscardHand();  break;
        case 'coinFlip':     this.updateCoinFlip();     break;
        case 'spectating': /* Event-getrieben (onSpectatorMessage) - kein Update noetig */ break;
        case 'main':         this.updateMainInput();    break;
        case 'placeZone':    this.updatePlaceZone();    break;
        case 'tributePick':  this.updateTributePick();  break;
        case 'equipPick':    this.updateEquipPick();    break;
        case 'battle':       this.updateBattleInput();  break;
        case 'battleTarget': this.updateBattleTarget(); break;
        case 'targetOwn':    this.updateTargetPick(this.mySide());    break;
        case 'targetEnemy':  this.updateTargetPick(this.enemySide()); break;
    }
    this.updateHandVisuals();
    this.updateHover();
};

Scene_TCGBattle.prototype.isPlayerActing = function() {
    return ['turnStart', 'main', 'placeZone', 'tributePick', 'equipPick', 'battle',
            'battleTarget', 'targetOwn', 'targetEnemy', 'search', 'confirm']
        .indexOf(this._state) >= 0;
};

// Schaltet nach Ablauf der "flash"-Dauer den Ausdruck einer Seite automatisch
// zurueck auf 'neutral' (siehe flashPortraitExpression).
Scene_TCGBattle.prototype.updatePortraitTimers = function() {
    if (!this._portraitResetTimers) return;
    for (var side = 0; side < 2; side++) {
        var t = this._portraitResetTimers[side];
        if (!t) continue;
        if (--t.framesLeft <= 0) {
            this._portraitResetTimers[side] = null;
            if (this._portraitSprites && this._portraitSprites[side]) {
                this._portraitSprites[side].setExpression('neutral');
            }
        }
    }
};

Scene_TCGBattle.prototype.updateTimer = function() {
    if (!this.timerActive()) return;
    if (!this.isPlayerActing()) return;
    if (this._timerFrames > 0) {
        this._timerFrames--;
        if (this._timerFrames % 60 === 0) this.refreshHud();
        if (this._timerFrames === 0) {
            this.closeConfirm();
            this._cmdWindow.hide();
            this._cmdWindow.deactivate();
            this._searchWindow.hide();
            this._searchWindow.deactivate();
            this._effectQueue = [];
            this._effectDone = null;
            // Schwebende Karte notfalls automatisch platzieren
            if (this._game.floating()) {
                var zones = this._game.player(this.mySide()).zones;
                for (var f = 0; f < 3; f++) {
                    if (!zones[f]) { this._game.placeFloating(f); break; }
                }
            }
            this.showToast('Zeit abgelaufen!');
            this.beginTurn(this._game.enemyIndex(this._game.active()));
        }
    }
};

Scene_TCGBattle.prototype.timerActive = function() {
    var sw = TCG.param.timerSwitch;
    return sw > 0 && $gameSwitches.value(sw);
};

//--- Eingabe: Hauptphase ------------------------------------------------------
Scene_TCGBattle.prototype.updateMainInput = function() {
    this.updateZoneNav();
    if (!TouchInput.isTriggered()) return;
    var x = TouchInput.x, y = TouchInput.y;

    if (this._handHoverIndex >= 0 && this.pointInHandCard(x, y, this._handHoverIndex)) {
        this.onHandCardClicked(this._handHoverIndex);
        return;
    }

    // Eigenes Monster mit aktivierbarem Effekt?
    for (var z = 0; z < 3; z++) {
        if (pointInRect(x, y, zoneRect(this.mySide(), z)) && this._game.player(this.mySide()).zones[z]) {
            this.tryActivateOwnZone(z);
            return;
        }
    }
};

Scene_TCGBattle.prototype.onHandCardClicked = function(handIndex) {
    var g = this._game;
    var card = TCG.card(g.player(this.mySide()).hand[handIndex]);
    if (!card) return;
    var handSprite = this._handSprites && this._handSprites[handIndex];
    if (handSprite) handSprite.playTrigger('aktivieren');
    this.flashPortraitExpression(this.mySide(), 'aktion', 60);

    if (card.kartenTyp === 'zauber') {
        if (g.canPlaySpell(handIndex)) {
            this._cmdWindow.deactivate();
            this.openConfirm(card, card.name + ' spielen? (' + card.apKosten + ' AP)',
                'spell', handIndex);
        } else {
            SoundManager.playBuzzer();
            this.showToast('Nicht spielbar (AP oder kein Effekt)', true);
        }
        return;
    }
    if (card.kartenTyp === 'ausruestung') {
        if (g.canEquip(handIndex)) {
            this._cmdWindow.deactivate();
            this.openConfirm(card, card.name + ' ausruesten? (' + card.apKosten + ' AP)',
                'equip', handIndex);
        } else {
            SoundManager.playBuzzer();
            this.showToast('Nicht genug AP oder kein Monster', true);
        }
        return;
    }
    // Monster
    if (card.monsterArt === 'fusion') {
        if (g.canFusion(handIndex)) {
            var plan = g.fusionPlan(handIndex);
            var parts = [];
            if (plan.key >= 0) parts.push(TCG.card(g.player(this.mySide()).hand[plan.key]).name);
            var self = this;
            plan.feld.forEach(function(z) { parts.push(TCG.card(g.player(self.mySide()).zones[z].id).name); });
            plan.hand.forEach(function(h) { parts.push(TCG.card(g.player(self.mySide()).hand[h]).name); });
            var graveText = TCG.describeGraveCost(card.ablageKosten);
            var tokenText = TCG.describeTokenCost(card.tokenKosten);
            var fusionHint = 'Fusion? Verbraucht: ' + parts.join(', ') +
                (graveText ? ' + Ablage: ' + graveText : '') +
                (tokenText ? ' + ' + tokenText : '');
            this._cmdWindow.deactivate();
            this.openConfirm(card, fusionHint, 'fusion', handIndex);
        } else {
            SoundManager.playBuzzer();
            this.showToast('Fusionsbedingungen nicht erfuellt', true);
        }
        return;
    }
    if (card.monsterArt === 'ritual') {
        if (g.canRitual(handIndex)) {
            this._cmdWindow.deactivate();
            if (g.paymentOptions(0, card).length === 2) {
                this.openPaymentChoice(card, handIndex, 'ritual');
            } else {
                this.openConfirm(card, 'Ritual? Verbraucht ' + TCG.describeSummon(card), 'ritual', handIndex);
            }
        } else {
            SoundManager.playBuzzer();
            this.showToast('Ritualbedingungen nicht erfuellt (Zauber/Tribut/AP pruefen)', true);
        }
        return;
    }
    // Normal-Monster
    if (!g.canNormalSummon(handIndex)) {
        SoundManager.playBuzzer();
        this.showToast(TCG.needsTribute(card) ?
            'Benoetigt Tribut + ' + TCG.summonCost(card) + ' AP' : 'Nicht genug AP/Token oder keine freie Zone', true);
        return;
    }
    SoundManager.playCursor();
    this._cmdWindow.deactivate();
    if (g.paymentOptions(0, card).length === 2) {
        this.openPaymentChoice(card, handIndex, TCG.needsTribute(card) ? 'tribut' : 'normal');
        return;
    }
    if (TCG.needsTribute(card)) {
        this._pendingSummon = { kind: 'tribut', hand: handIndex };
        this._state = 'tributePick';
        this._cursorZone = null;
        this.showToast('Tribut waehlen (' + TCG.summonCost(card) + ' AP)', true);
    } else {
        this.snapshotBeforeSummon();
        var paidNormal = g.beginNormalSummon(handIndex, -1);
        if (paidNormal) this.showToast(TCG.tokenName(card.tokenErsatzTyp) + ' statt AP bezahlt');
        this.refreshAll();
        this.enterPlaceZone();
    }
};

// Oeffnet die Zahlungsart-Wahl (AP oder Token-Ersatz), wenn beide Wege
// aktuell moeglich sind - der Spieler entscheidet explizit (z.B. Token
// lieber fuer einen skalierenden Buff aufsparen statt sie zu verbrauchen).
Scene_TCGBattle.prototype.openPaymentChoice = function(card, handIndex, nextKind) {
    var cost = TCG.summonCost(card);
    var labels = [cost + ' AP zahlen', cost + ' ' + TCG.tokenName(card.tokenErsatzTyp) + ' zahlen'];
    this.openConfirm(card, 'Wie moechtest du bezahlen?', 'payment',
        { handIndex: handIndex, nextKind: nextKind }, labels);
};

//--- Eingabe: Kampfphase ------------------------------------------------------
Scene_TCGBattle.prototype.updateBattleInput = function() {
    this.updateZoneNav();
    if (!TouchInput.isTriggered()) return;
    for (var z = 0; z < 3; z++) {
        if (pointInRect(TouchInput.x, TouchInput.y, zoneRect(this.mySide(), z))) {
            this.trySelectAttacker(z);
            return;
        }
    }
};

Scene_TCGBattle.prototype.updateBattleTarget = function() {
    if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
        SoundManager.playCancel();
        this._selectedZone = -1;
        this.enterBattlePhase();
        return;
    }
    this.updateZoneNavHighlight();
    var self = this;
    var isValidTarget = function(z) { return !!self._game.player(self.enemySide()).zones[z]; };
    if (Input.isTriggered('right')) { this.moveNavFieldIndex(1, isValidTarget); }
    else if (Input.isTriggered('left')) { this.moveNavFieldIndex(-1, isValidTarget); }
    else if (Input.isTriggered('ok') && isValidTarget(this._navFieldIndex)) {
        this.executeAttack(this._navFieldIndex);
        return;
    }
    if (!TouchInput.isTriggered()) return;
    for (var z = 0; z < 3; z++) {
        if (pointInRect(TouchInput.x, TouchInput.y, zoneRect(this.enemySide(), z)) &&
            this._game.player(this.enemySide()).zones[z]) {
            this.executeAttack(z);
            return;
        }
    }
};

// Fuehrt den eigentlichen Angriff aus - gemeinsam fuer Maus-Klick UND
// Tastatur-Bestaetigen, damit beide Wege exakt dasselbe tun.
Scene_TCGBattle.prototype.executeAttack = function(z) {
    var atkSprite = this._zoneSprites[this.mySide()][this._selectedZone];
    if (atkSprite) atkSprite.playTrigger('angriff');
    this.flashPortraitExpression(this.mySide(), 'aktion', 60);
    var defSprite = this._zoneSprites && this._zoneSprites[this.enemySide()] && this._zoneSprites[this.enemySide()][z];
    var atkSlot = this._game.player(this.mySide()).zones[this._selectedZone];
    var atkCard = atkSlot ? TCG.card(atkSlot.id) : null;
    if (atkCard) this.playElementAnimation(defSprite || atkSprite, atkCard.element);
    var result = this._game.attack(this._selectedZone, z);
    if (defSprite && !this._game.player(this.enemySide()).zones[z]) {
        defSprite.playTrigger('zerstoerung');
        this.playAnimation(defSprite, TCG.param.destroyAnimation);
        this.flashPortraitExpression(this.enemySide(), 'schmerz', 90);
        this.flashPortraitExpression(this.mySide(), 'freude', 90);
    }
    this.afterAttack(result);
};

// Bewegt _navFieldIndex um "dir" Schritte (umlaufend), ueberspringt dabei
// ungueltige Zonen (z.B. leere Gegner-Zonen bei der Zielwahl) - anders als
// die freie Feld-Navigation in der Haupt-/Kampfphase, wo der Cursor bewusst
// auch auf leeren Zonen stehen darf (siehe fruehere Absprache).
Scene_TCGBattle.prototype.moveNavFieldIndex = function(dir, isValid) {
    var start = this._navFieldIndex;
    for (var i = 0; i < 3; i++) {
        this._navFieldIndex = (this._navFieldIndex + dir + 3) % 3;
        if (isValid(this._navFieldIndex)) { SoundManager.playCursor(); return; }
    }
    this._navFieldIndex = start; // keine gueltige Zone gefunden - Cursor bleibt stehen
};

//--- Eingabe: Effektziel ------------------------------------------------------
Scene_TCGBattle.prototype.updateTargetPick = function(side) {
    if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
        var resumeState = this._state;
        var self = this;
        this.confirmCancelEffect(resumeState, function() {
            self.showToast('Effekt verpufft');
            self._targetPicksRemaining = 0;
            self.hideZoneHighlight();
            self.processEffectQueue();
        });
        return;
    }
    var self = this;
    var picked = this.updateZoneCursor(side, function(z) {
        return !!self._game.player(side).zones[z] && self._pickedZones.indexOf(z) < 0;
    }, 'rgba(255,140,80,0.35)');
    if (picked < 0) return;

    var pickedSprite = this._zoneSprites && this._zoneSprites[side] && this._zoneSprites[side][picked];
    if (pickedSprite) pickedSprite.playTrigger('ziel');
    this.playAnimation(pickedSprite, TCG.param.targetAnimation);
    var hadMonster = !!this._game.player(side).zones[picked];
    var result = this._game.resolveEffect(this.mySide(), this._currentEffect, side, picked);
    if (result.text) this.showToast(result.text);
    if (result.triggers) this._effectQueue = result.triggers.concat(this._effectQueue);
    this.checkAndAnimateDestroy(side, picked, hadMonster);
    this.refreshAll();
    this._pickedZones.push(picked);
    this._targetPicksRemaining--;
    this._cursorZone = null;
    // Weitere Ziele fuer denselben Effekt noetig (zielAnzahl > 1) und noch
    // mindestens ein gueltiges (noch nicht gewaehltes) Ziel uebrig? Dann in
    // der gleichen Auswahl bleiben, statt die Warteschlange weiterzuschieben.
    var stillAvailable = [0, 1, 2].some(function(z) {
        return !!self._game.player(side).zones[z] && self._pickedZones.indexOf(z) < 0;
    });
    if (this._targetPicksRemaining > 0 && stillAvailable) {
        this.showToast('Noch ' + this._targetPicksRemaining + ' Ziel(e) w\u00e4hlen - Abbrechen mit ESC/B', true);
        return;
    }
    this.hideZoneHighlight();
    this.processEffectQueue();
};

//--- Hover --------------------------------------------------------------------
Scene_TCGBattle.prototype.updateHover = function() {
    if (this._state === 'result' || this._state === 'banner' || this._state === 'intro' || this._state === 'pileView') return;
    var hoverCard = null;

    if (this._handHoverIndex >= 0) {
        hoverCard = TCG.card(this._game.player(this.mySide()).hand[this._handHoverIndex]);
    } else {
        var x = TCG.mouse.x, y = TCG.mouse.y;
        for (var s = 0; s < 2 && !hoverCard; s++) {
            for (var z = 0; z < 3; z++) {
                if (pointInRect(x, y, zoneRect(s, z)) && this._game.player(s).zones[z]) {
                    hoverCard = TCG.card(this._game.player(s).zones[z].id);
                    break;
                }
            }
        }
        if (!hoverCard) {
            for (var g = 0; g < 2; g++) {
                var gr = { x: g === 0 ? L.pileLeftX : L.pileRightX,
                           y: g === 0 ? L.playerZoneY : L.enemyZoneY, w: L.zoneW, h: L.zoneH };
                var grave = this._game.player(g).grave;
                if (pointInRect(x, y, gr) && grave.length > 0) {
                    hoverCard = TCG.card(grave[grave.length - 1]);
                }
            }
        }
    }
    this._infoWindow.setCard(hoverCard);
};

//--- Handkarten: Faecher-Layout, Hover-Wachsen, Tastatur/Controller -----------
// Ruheposition jeder Handkarte (Faecher-Kurve), unabhaengig vom Hover-Zustand.
Scene_TCGBattle.prototype.computeHandBaseLayout = function() {
    var hand = this._game.player(this.mySide()).hand;
    var n = hand.length;
    var cardW = TCG.param.cardW * L.handScale;
    var areaW = L.handAreaW;
    var spacing = n > 1 ? Math.min(cardW + 8, (areaW - cardW) / (n - 1)) : 0;
    // Zentriert um L.handCenterX statt linksbuendig ab einer festen
    // Startposition zu wachsen - so ragt der Faecher bei vielen Karten
    // gleichmaessig nach beiden Seiten aus, statt einseitig ins Log-Fenster.
    var totalWidth = n > 0 ? (n - 1) * spacing + cardW : 0;
    var startX = L.handCenterX - totalWidth / 2;
    var center = (n - 1) / 2;
    var layout = [];
    for (var i = 0; i < n; i++) {
        var offset = i - center;
        layout.push({
            x: startX + i * spacing + cardW / 2,   // Mittelpunkt der Karte (Ankerpunkt unten-mittig)
            y: L.handY + TCG.param.cardH * L.handScale,
            rotation: offset * HAND_ROTATION_STEP,
            scale: L.handScale
        });
    }
    return layout;
};

// Prueft, ob (x,y) innerhalb der AKTUELLEN (animierten) Flaeche der Handkarte liegt.
Scene_TCGBattle.prototype.pointInHandCard = function(x, y, index) {
    var sp = this._handSprites[index];
    if (!sp || !sp._hitRect) return false;
    var r = sp._hitRect;
    return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
};

// Ermittelt per Maus die aktuell gehoverte Handkarte (oberste zuerst prueft
// die zuletzt gezeichnete/oberste Karte), anhand der animierten Hitboxen.
Scene_TCGBattle.prototype.mouseHandIndex = function() {
    for (var i = this._handSprites.length - 1; i >= 0; i--) {
        if (this.pointInHandCard(TCG.mouse.x, TCG.mouse.y, i)) return i;
    }
    return -1;
};

// Wird jeden Frame aufgerufen: aktualisiert Fokus-Index (Maus/Tastatur) und
// animiert Position/Groesse/Rotation aller Handkarten sanft in Richtung Ziel.
Scene_TCGBattle.prototype.updateHandVisuals = function() {
    var sprites = this._handSprites;
    if (!sprites || sprites.length === 0) return;
    if (['intro', 'banner', 'result'].indexOf(this._state) >= 0) return;

    var base = this.computeHandBaseLayout();
    var n = sprites.length;

    // Fokus bestimmen: Maus hat Vorrang, sonst Tastatur/Controller-Auswahl
    var mouseIdx = this.mouseHandIndex();
    if (mouseIdx >= 0) {
        this._handHoverIndex = mouseIdx;
        this._handKeyboardActive = false;
    } else if ((this._state === 'main' || this._state === 'battle') && !this._cmdWindow.active &&
               this._navArea === 'hand' && n > 0) {
        if (Input.isTriggered('right')) {
            this._handKeyboardActive = true;
            this._handHoverIndex = Math.min(n - 1, (this._handHoverIndex < 0 ? 0 : this._handHoverIndex) + 1);
        } else if (Input.isTriggered('left')) {
            this._handKeyboardActive = true;
            this._handHoverIndex = Math.max(0, (this._handHoverIndex < 0 ? 0 : this._handHoverIndex) - 1);
        } else if (!this._handKeyboardActive) {
            this._handHoverIndex = -1;
        }
    } else if (!(this._state === 'main' || this._state === 'battle')) {
        this._handHoverIndex = -1;
        this._handKeyboardActive = false;
    } else if (!this._handKeyboardActive) {
        this._handHoverIndex = -1;
    }
    if (this._handHoverIndex >= n) this._handHoverIndex = -1;

    // Hovertierte Karte an den Anfang der Rendersequenz? Nein - ans ENDE der
    // Kindliste, damit sie ueber ihren Nachbarn gezeichnet wird.
    if (this._handHoverIndex >= 0 && this._lastFrontIndex !== this._handHoverIndex) {
        this._handContainer.addChild(sprites[this._handHoverIndex]);
        this._lastFrontIndex = this._handHoverIndex;
    }

    for (var i = 0; i < n; i++) {
        var sp = sprites[i];
        var b = base[i];
        var isHover = i === this._handHoverIndex;
        var targetScale, targetX, targetY, targetRot;

        if (isHover) {
            targetScale = HAND_HOVER_SCALE;
            targetX = b.x;
            targetY = b.y - HAND_HOVER_LIFT;
            targetRot = 0;
        } else {
            var dist = this._handHoverIndex >= 0 ? (i - this._handHoverIndex) : 0;
            var push = this._handHoverIndex >= 0 ?
                Math.sign(dist) * HAND_GAP_PUSH * Math.max(0, 1 - 0.3 * Math.abs(dist)) : 0;
            targetScale = this._handHoverIndex >= 0 ? b.scale * HAND_SHRINK_FACTOR : b.scale;
            targetX = b.x + push;
            targetY = b.y;
            targetRot = b.rotation;
        }

        if (sp._curX === undefined) {
            // Erstinitialisierung: sofort auf Zielposition setzen (kein Einflug-Effekt)
            sp._curX = targetX; sp._curY = targetY; sp._curScale = targetScale; sp._curRot = targetRot;
        } else {
            sp._curX += (targetX - sp._curX) * HAND_LERP;
            sp._curY += (targetY - sp._curY) * HAND_LERP;
            sp._curScale += (targetScale - sp._curScale) * HAND_LERP;
            sp._curRot += (targetRot - sp._curRot) * HAND_LERP;
        }

        sp.anchor.x = 0.5; sp.anchor.y = 1.0;
        sp.x = sp._curX;
        sp.y = sp._curY;
        sp.scale.x = sp.scale.y = sp._curScale;
        sp.rotation = sp._curRot;

        var w = TCG.param.cardW * sp._curScale;
        var h = TCG.param.cardH * sp._curScale;
        sp._hitRect = { x: sp._curX - w / 2, y: sp._curY - h, w: w, h: h };
    }
};

//--- Anzeige aktualisieren ----------------------------------------------------
Scene_TCGBattle.prototype.refreshAll = function() {
    this.refreshZones();
    this.refreshHoverArt();
    this.refreshHand();
    this.refreshEnemyHand();
    this.refreshHud();
};

// Laesst das Monster-Artwork vergroessert ueber der eigentlichen Kartenzone
// "schweben" (nur Rohbild, ohne Rahmen/Hintergrund/Text) - waechst nach
// oben aus der Karte heraus, verankert am unteren Rand des normalen
// Artwork-Fensters. Nur fuer Monster mit Artwork; sonst unsichtbar.
Scene_TCGBattle.prototype.refreshHoverArt = function() {
    if (!this._hoverArtSprites) return;
    // Gleiche Anteile wie Sprite_TCGCard.prototype.drawFace's artRect
    // (siehe TCG_Core.js) - damit das schwebende Artwork exakt ueber dem
    // normalen Artwork-Fenster der Karte zentriert ist.
    var artFrac = { x: 0.0733, y: 0.1667, w: 0.8533, h: 0.4286 };
    var hoverScaleFactor = 1.8; // wie viel groesser als das normale Fenster
    for (var s = 0; s < 2; s++) {
        for (var i = 0; i < 3; i++) {
            var slot = this._game.player(s).zones[i];
            var hv = this._hoverArtSprites[s][i];
            var card = slot ? TCG.card(slot.id) : null;
            if (!card || !TCG.isMonster(card) || !card.artwork) { hv.visible = false; continue; }
            var art = ImageManager.loadBitmap(TCG.param.artworkFolder, card.artwork);
            if (!art.isReady() || art.isError()) { hv.visible = false; continue; }
            if (hv.bitmap !== art) hv.bitmap = art;

            var zsp = this._zoneSprites[s][i];
            var r = zoneRect(s, i);
            var cardScreenW = TCG.param.cardW * zsp.scale.x;
            var cardScreenH = TCG.param.cardH * zsp.scale.y;
            var artScreenX = r.x + artFrac.x * cardScreenW;
            var artScreenY = r.y + artFrac.y * cardScreenH;
            var artScreenW = artFrac.w * cardScreenW;
            var artScreenH = artFrac.h * cardScreenH;

            var fitScale = Math.min(artScreenW * hoverScaleFactor / art.width, artScreenH * hoverScaleFactor / art.height);
            hv.scale.x = hv.scale.y = fitScale;
            hv.x = Math.round(artScreenX + artScreenW / 2);
            hv.y = Math.round(artScreenY + artScreenH);
            hv.visible = true;
        }
    }
};

Scene_TCGBattle.prototype.refreshZones = function() {
    for (var s = 0; s < 2; s++) {
        for (var i = 0; i < 3; i++) {
            var slot = this._game.player(s).zones[i];
            var sp = this._zoneSprites[s][i];
            if (slot) {
                if (!sp.visible || !sp.card() || sp.card().id !== slot.id) {
                    sp.setCard(TCG.card(slot.id), false);
                }
                sp.visible = true;
            } else if (!sp.isPlayingExitTrigger || !sp.isPlayingExitTrigger()) {
                sp.visible = false;
            }
        }
        var grave = this._game.player(s).grave;
        var gp = this._graveSprites[s];
        if (grave.length > 0) {
            var topId = grave[grave.length - 1];
            if (!gp.visible || !gp.card() || gp.card().id !== topId) {
                gp.setCard(TCG.card(topId), false);
            }
            gp.visible = true;
        } else {
            gp.visible = false;
        }
        this._deckSprites[s].visible = this._game.player(s).deck.length > 0;
    }
};

Scene_TCGBattle.prototype.refreshHand = function() {
    var self = this;
    this._handSprites.forEach(function(sp) {
        self._handContainer.removeChild(sp);
        if (sp.destroy) sp.destroy();
    });
    this._handSprites = [];
    this._lastFrontIndex = -1;
    var hand = this._game.player(this.mySide()).hand;
    for (var i = 0; i < hand.length; i++) {
        var sp = new Sprite_TCGCard(TCG.card(hand[i]), false, false); // Hand: keine Animation (Thumbnail)
        sp.scale.x = sp.scale.y = L.handScale;
        this._handContainer.addChild(sp);
        this._handSprites.push(sp);
    }
    if (this._handHoverIndex >= hand.length) this._handHoverIndex = -1;
};

Scene_TCGBattle.prototype.refreshEnemyHand = function() {
    var self = this;
    this._enemyHandSprites.forEach(function(sp) { self.removeChild(sp); });
    this._enemyHandSprites = [];
    var n = this._game.player(this.enemySide()).hand.length;
    var scale = 0.13 * L.uiScale;
    var w = TCG.param.cardW * scale;
    var totalW = n > 0 ? n * w + (n - 1) * Math.round(4 * L.uiScale) : 0;
    var startX = L.handCenterX - totalW / 2;
    for (var i = 0; i < n; i++) {
        var sp = new Sprite_TCGCard(null, true);
        sp.scale.x = sp.scale.y = scale;
        sp.x = startX + i * (w + Math.round(4 * L.uiScale));
        sp.y = Math.round(6 * L.uiScale);
        this.addChild(sp);
        this._enemyHandSprites.push(sp);
    }
};

// Einfacher Balken-Gauge: Hintergrund + proportionale Fuellung + dezenter Glanzrand.
Scene_TCGBattle.prototype.drawGauge = function(bmp, x, y, w, h, ratio, bg, fill) {
    ratio = Math.max(0, Math.min(1, isFinite(ratio) ? ratio : 0));
    bmp.fillRect(x, y, w, h, bg);
    if (ratio > 0) bmp.fillRect(x, y, Math.round(w * ratio), h, fill);
    bmp.fillRect(x, y, w, 1, 'rgba(255,255,255,0.22)');
};

// Aktualisiert die kleine Zug-Nummer-Anzeige ueber der Phasenleiste.
Scene_TCGBattle.prototype.syncPhaseBarLabel = function() {
    if (!this._turnLabelSprite) return;
    var bmp = this._turnLabelSprite.bitmap;
    bmp.clear();
    var text = 'Zug ' + this._game.turnCount();
    if (this._game.phaseName()) text += ' \u2013 ' + this._game.phaseName();
    bmp.fontSize = Math.round(13 * L.uiScale);
    bmp.textColor = '#ffd75e';
    bmp.outlineWidth = 2;
    bmp.drawText(text, 0, 0, bmp.width, bmp.height, 'center');
};

Scene_TCGBattle.prototype.refreshHud = function() {
    var bmp = this._hudSprite.bitmap;
    bmp.clear();
    var game = this._game;
    var self = this;

    // Spieler-Zeilen: Name (oben) + LP-Gauge + AP-Gauge + optionale Token-
    // Badges. Breite richtet sich nach L.hudW (dieselbe Breite wie Karten-
    // info/Log), damit eigenes und gegnerisches HUD optisch dazu passen.
    function drawHudLine(side, x, y) {
        var p = game.player(side);
        var portraitSize = Math.round((TCG.param.portraitSize || 40) * L.uiScale);
        var textX = x + portraitSize + Math.round(10 * L.uiScale) + 50; // Platz fuer Portraet + 50px Rand links
        var textW = L.hudW - portraitSize - Math.round(10 * L.uiScale) - 100; // je 50px Rand links und rechts
        bmp.fontSize = Math.round(17 * L.uiScale);
        bmp.outlineWidth = 3;
        bmp.textColor = side === 0 ? '#8fd0ff' : '#ff9d8f';
        bmp.drawText(p.name, textX, y, textW, Math.round(20 * L.uiScale), 'left');
        bmp.outlineWidth = 0;

        // Hoehere Balken, damit die Zahlen INNERHALB des Balkens Platz haben
        // (statt separat darueber, wie zuvor - das wirkte zu gequetscht).
        var gw = textW, gh = Math.round(22 * L.uiScale);
        var gy1 = y + Math.round(28 * L.uiScale);
        var gy2 = gy1 + gh + Math.round(8 * L.uiScale);
        self.drawGauge(bmp, textX, gy1, gw, gh, p.lp / TCG.param.startLP, 'rgba(255,255,255,0.12)', '#e05a5a');
        self.drawGauge(bmp, textX, gy2, gw, gh, p.ap / TCG.param.apMax, 'rgba(255,255,255,0.12)', '#5a9ee0');
        bmp.fontSize = Math.round(13 * L.uiScale);
        bmp.outlineWidth = 2;
        bmp.textColor = '#ffffff';
        bmp.drawText('LP ' + p.lp + '/' + TCG.param.startLP, textX, gy1, gw, gh, 'center');
        bmp.drawText('AP ' + p.ap + '/' + TCG.param.apMax, textX, gy2, gw, gh, 'center');

        // Token-Badges: nur Typen, die dieser Spieler schon einmal besessen hat
        var tx = textX;
        var ty = gy2 + gh + Math.round(10 * L.uiScale);
        var badgeH = Math.round(14 * L.uiScale);
        bmp.fontSize = Math.round(11 * L.uiScale);
        TCG.param.tokenTypes.forEach(function(t) {
            if (!p.tokensSeen[t.id]) return;
            var count = p.tokens[t.id] || 0;
            var label = count + ' ' + TCG.tokenName(t.id);
            var w = bmp.measureTextWidth(label) + Math.round(10 * L.uiScale);
            bmp.outlineWidth = 0;
            bmp.fillRect(tx, ty, w, badgeH, TCG.tokenColor(t.id));
            bmp.textColor = '#1a1a1a';
            bmp.drawText(label, tx + Math.round(5 * L.uiScale), ty, w, badgeH, 'left');
            tx += w + Math.round(6 * L.uiScale);
        });
        bmp.outlineWidth = 2;
    }
    // Eigenes HUD: unten links (ueber der Hand). Gegner-HUD: oben rechts.
    drawHudLine(1, L.enemyHudX, L.enemyHudY);
    drawHudLine(0, L.ownHudX, L.ownHudY);

    // Stapel-Zaehler (Deck / Ablage / Exil) - Ablage/Exil zusaetzlich anklickbar (siehe updateGraveClicks)
    bmp.fontSize = Math.round(13 * L.uiScale);
    bmp.outlineWidth = 2;
    bmp.textColor = '#dddddd';
    var count = function(x, y, text) {
        bmp.drawText(text, x - Math.round(8 * L.uiScale), y, L.zoneW + Math.round(16 * L.uiScale), Math.round(16 * L.uiScale), 'center');
    };
    count(L.pileRightX, L.playerZoneY + L.zoneH + Math.round(3 * L.uiScale), 'x' + game.player(0).deck.length);
    count(L.pileLeftX,  L.playerZoneY + L.zoneH + Math.round(3 * L.uiScale),
        'x' + game.player(0).grave.length + ' \u00b7 Exil ' + game.player(0).exile.length);
    count(L.pileLeftX,  L.enemyZoneY + L.zoneH + Math.round(3 * L.uiScale), 'x' + game.player(1).deck.length);
    count(L.pileRightX, L.enemyZoneY + L.zoneH + Math.round(3 * L.uiScale),
        'x' + game.player(1).grave.length + ' \u00b7 Exil ' + game.player(1).exile.length);
    bmp.fontSize = Math.round(10 * L.uiScale);
    bmp.textColor = 'rgba(255,255,255,0.5)';
    bmp.drawText('(anklicken)', L.pileLeftX - Math.round(8 * L.uiScale), L.playerZoneY + L.zoneH + Math.round(17 * L.uiScale), L.zoneW + Math.round(16 * L.uiScale), Math.round(12 * L.uiScale), 'center');
    bmp.drawText('(anklicken)', L.pileRightX - Math.round(8 * L.uiScale), L.enemyZoneY + L.zoneH + Math.round(17 * L.uiScale), L.zoneW + Math.round(16 * L.uiScale), Math.round(12 * L.uiScale), 'center');

    // Monsterkarten: ATK-Zahl, LP-Gauge, Bereitschafts-Pip, Ausruestungs-Marker
    for (var s = 0; s < 2; s++) {
        for (var z = 0; z < 3; z++) {
            var slot = game.player(s).zones[z];
            if (!slot) continue;
            var r = zoneRect(s, z);
            var eff = game.effAtk(s, z);
            var base = TCG.card(slot.id).atk;

            bmp.fontSize = Math.round(13 * L.uiScale);
            bmp.outlineWidth = 2;
            bmp.textColor = eff > base ? '#6dff8a' : (eff < base ? '#ff7a6d' : '#ffd75e');
            bmp.drawText('ATK ' + eff, r.x - Math.round(8 * L.uiScale), r.y + r.h + Math.round(3 * L.uiScale), r.w + Math.round(16 * L.uiScale), Math.round(14 * L.uiScale), 'center');

            var cur = game.curLp(s, z), maxLp = game.maxLp(s, z);
            this.drawGauge(bmp, r.x, r.y + r.h + Math.round(19 * L.uiScale), r.w, Math.round(7 * L.uiScale), maxLp > 0 ? cur / maxLp : 0,
                'rgba(255,255,255,0.18)', cur / maxLp <= 0.3 ? '#ff6b4a' : '#5adf8a');
            bmp.fontSize = Math.round(11 * L.uiScale);
            bmp.textColor = '#ffffff';
            bmp.drawText(cur + '/' + maxLp, r.x - Math.round(8 * L.uiScale), r.y + r.h + Math.round(27 * L.uiScale), r.w + Math.round(16 * L.uiScale), Math.round(12 * L.uiScale), 'center');

            if ((slot.equips || []).length > 0) {
                bmp.fontSize = Math.round(12 * L.uiScale);
                bmp.textColor = '#ffd75e';
                bmp.drawText('\u2694' + slot.equips.length, r.x + r.w - Math.round(24 * L.uiScale), r.y + Math.round(2 * L.uiScale), Math.round(24 * L.uiScale), Math.round(14 * L.uiScale), 'right');
            }
            // Bereitschafts-Pip: nur fuer die gerade aktive Seite waehrend der Kampfphase relevant
            if (game.phase() === 'battle' && s === game.active()) {
                var ready = (slot.attacked || 0) < game.maxAttacksPerTurn(s, z);
                var pip = Math.round(9 * L.uiScale);
                bmp.fillRect(r.x + Math.round(3 * L.uiScale), r.y + Math.round(3 * L.uiScale), pip, pip, ready ? '#ffd75e' : 'rgba(120,120,120,0.7)');
            }
        }
    }

    // Zug/Phase wird jetzt ueber die Phasenleiste (Window_TCGPhaseBar,
    // siehe createWindows) dargestellt, nicht mehr als eigenes Text-Banner.
    // syncPhaseBarLabel() haelt deren Beschriftung mit dem aktuellen
    // Zug-/Phasenstand synchron.
    this.syncPhaseBarLabel();

    if (this.timerActive()) {
        var seconds = Math.ceil(this._timerFrames / 60);
        bmp.fontSize = Math.round(15 * L.uiScale);
        bmp.outlineWidth = 2;
        bmp.textColor = seconds <= 30 ? '#ff6b4a' : '#ffd75e';
        bmp.drawText('\u23f1 ' + seconds + 's', badgeX + badgeW + 10, badgeY + (badgeH - 20) / 2, 90, 20, 'left');
    }
};

//=============================================================================
// Plugin-Befehl: TCG Kampf <gegnerId>
//=============================================================================
var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command !== 'TCG') return;
    if (args[0] === 'Kampf' || args[0] === 'Battle') {
        var opponent = TCG.opponent(args[1]);
        if (!opponent) {
            $gameMessage.add('TCG: Gegner "' + args[1] + '" nicht gefunden.');
            return;
        }
        var deck = TCG.activeDeck();
        if (!deck || !TCG.deckValid(deck)) {
            $gameMessage.add('Dein aktives Deck ist ungueltig!');
            $gameMessage.add('(' + TCG.param.deckMin + '-' + TCG.param.deckMax +
                ' Karten, im Deck Builder waehlen)');
            return;
        }
        Scene_TCGBattle.prepare(opponent);
        SceneManager.push(Scene_TCGBattle);
    }
};

})();
