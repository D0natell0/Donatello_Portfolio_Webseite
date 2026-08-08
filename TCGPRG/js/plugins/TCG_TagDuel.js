//=============================================================================
// TCG_TagDuel.js  (v1.0)
//-----------------------------------------------------------------------------
// Eigenstaendige Tag-Duell-Engine (2 gegen 2, oder 2 gegen ein KI-Team):
// geteiltes LP/AP/Feld pro TEAM, aber getrenntes Deck/Hand pro SITZPLATZ.
// Zugreihenfolge rotiert durch bis zu 4 Sitzplaetze: TeamA-Spieler1 ->
// TeamB-Spieler1 -> TeamA-Spieler2 -> TeamB-Spieler2 -> wieder von vorn.
//
// BEWUSST eine eigene, von Game_TCGBattle GETRENNTE Klasse (siehe
// Projektbesprechung) - das bestehende, gut getestete 1v1-Kampfsystem bleibt
// dadurch komplett unangetastet. Die komplette Effekt-/Kampf-/Beschwoerungs-
// Logik ist trotzdem fast 1:1 von dort uebernommen: Jede Methode, die dort
// "this._players[side]" gelesen/geschrieben hat, tut hier dasselbe ueber
// "this.player(teamIndex)" - eine "Team-Sicht", die sich fuer die Logik exakt
// wie ein normaler Spieler verhaelt (lp/ap sind echte Durchgriffe per Getter/
// Setter aufs Team-Objekt, zones/grave/exile/tokens sind geteilte Referenzen),
// nur hand/deck kommen vom gerade aktiven Sitzplatz des jeweiligen Teams.
//
// STAND DIESER PHASE: reine Spiellogik, lokal spielbar (z.B. per Hotseat-
// Bedienung an einem Rechner). Noch NICHT enthalten (bewusst zurueckgestellt,
// naechste Ausbauschritte):
//   - Scene/Rendering (eigene Kampf-Szene fuer 4 Sitzplaetze)
//   - KI fuer ein Team (2 KI-gesteuerte Sitzplaetze, die sich Ressourcen teilen)
//   - Netzwerk-Synchronisation (mehrere echte Mitspieler ueber die Kampfzone)
//   - snapshot()/applySnapshot() (fuer die spaetere Netzwerk-Phase)
//
// Muss NACH TCG_Core.js UND TCG_Battle.js geladen werden (nutzt einige
// gemeinsame TCG.*-Hilfsfunktionen und -Konstanten von dort, z.B.
// TCG.buildDrawPile, TCG.elementMod, TCG.materialMatches, TCG.ZIEL_AKTIONEN).
//=============================================================================
/*:
 * @plugindesc v1.0 Tag-Duell-Engine (2v2, geteiltes LP/AP/Feld pro Team) - reine Spiellogik, noch ohne eigene Kampf-Szene.
 * @author Donatello Media
 *
 * @help
 * ============================================================================
 * TCG_TagDuel.js v1.0
 * ============================================================================
 * Stellt Game_TCGTagDuel bereit - siehe Kommentar am Dateianfang fuer die
 * Architektur. Kein Plugin-Befehl in dieser Phase (noch keine eigene Szene) -
 * wird bislang nur aus Testcode/zukuenftigem Szenen-Code heraus instanziiert:
 *
 *   var g = new Game_TCGTagDuel(
 *       [deckA1, deckA2, deckB1, deckB2],           // je {cardId: Anzahl}
 *       ['Team Rot', 'Team Blau'],                   // Team-Namen
 *       ['Alex', 'Sam', 'Kim', 'Jo']                 // Sitzplatz-Namen
 *   );
 *   g.dealInitialHands();
 *   g.startTurn(0); // TeamA-Spieler1 beginnt
 */

var TCG = TCG || {};

(function() {
'use strict';

function Game_TCGTagDuel() { this.initialize.apply(this, arguments); }
window.Game_TCGTagDuel = Game_TCGTagDuel;

// Sitzplatz-Reihenfolge: 0=TeamA-Spieler1, 1=TeamA-Spieler2, 2=TeamB-Spieler1,
// 3=TeamB-Spieler2. Zugreihenfolge rotiert: A1 -> B1 -> A2 -> B2 -> wieder A1...
// (siehe Projektbesprechung: geteiltes LP/AP/Feld pro Team, aber getrenntes
// Deck/Hand pro Sitzplatz).
Game_TCGTagDuel.TURN_ORDER = [0, 2, 1, 3];

// seatDecks: Array aus 4 Karten-Maps ({cardId: Anzahl}), je ein Deck pro
// Sitzplatz (Reihenfolge: TeamA-Spieler1, TeamA-Spieler2, TeamB-Spieler1,
// TeamB-Spieler2). teamNames: [TeamAName, TeamBName]. seatNames: [a1,a2,b1,b2].
// seatPortraits: optional, Array aus 4 Portraet-Pfaden (4er-Sprite-Sheet aus
// img/faces, wie bei NPC-Decks) - Sitzplatz 0 (der Spieler) braucht hier
// KEINEN Eintrag (nutzt stattdessen automatisch TCG.profile().actorData,
// siehe Scene_TCGTagDuel.refreshPortraits).
Game_TCGTagDuel.prototype.initialize = function(seatDecks, teamNames, seatNames, seatPortraits) {
    this._teams = [this.makeTeam(teamNames[0]), this.makeTeam(teamNames[1])];
    this._seats = [];
    for (var i = 0; i < 4; i++) {
        this._seats.push(this.makeSeat(seatNames[i], Math.floor(i / 2), seatDecks[i] || {},
            seatPortraits ? seatPortraits[i] : null));
    }
    this._turnIndex = 0; // Index in TURN_ORDER
    this._turnCount = 0;
    this._phase = 'setup';
    this._winner = -1;
    this._floating = null;
};

// Kompletter Spielzustand als reines JSON-Objekt (fuer Netzwerk-Sync, siehe
// Game_TCGBattle.prototype.snapshot fuers 1v1 - gleiches Prinzip, nur
// team/sitzplatz-basiert statt 2-seitig). Enthaelt bewusst ALLE 4 Haende
// (auch die "fremder" Sitzplaetze) - genau wie beim 1v1 wird das Verstecken
// von Handkarten NICHT auf Netzwerk-Ebene erzwungen, sondern nur in der
// Darstellung (siehe Scene_TCGTagDuel) nicht gerendert.
Game_TCGTagDuel.prototype.snapshot = function() {
    return JSON.parse(JSON.stringify({
        teams: this._teams,
        seats: this._seats,
        turnIndex: this._turnIndex,
        turnCount: this._turnCount,
        phase: this._phase,
        winner: this._winner,
        floating: this._floating,
        lastActiveSeatOfTeam: this._lastActiveSeatOfTeam || null
    }));
};

// Ersetzt den kompletten lokalen Zustand durch einen empfangenen Snapshot -
// wird von Netzwerk-Teilnehmern genutzt, um ihre lokale Game_TCGTagDuel-
// Instanz auf den vom Host autorisierten Stand zu bringen.
Game_TCGTagDuel.prototype.applySnapshot = function(data) {
    this._teams = data.teams;
    this._seats = data.seats;
    this._turnIndex = data.turnIndex;
    this._turnCount = data.turnCount;
    this._phase = data.phase;
    this._winner = data.winner;
    this._floating = data.floating;
    this._lastActiveSeatOfTeam = data.lastActiveSeatOfTeam || null;
};

Game_TCGTagDuel.prototype.makeTeam = function(name) {
    return {
        name: name, lp: TCG.param.startLP, ap: 0,
        zones: [null, null, null], grave: [], exile: [],
        tokens: {}, tokensSeen: {}, pendingRevival: []
    };
};

Game_TCGTagDuel.prototype.makeSeat = function(name, teamIndex, deckCards, portrait) {
    return { name: name, teamIndex: teamIndex, deck: TCG.buildDrawPile(deckCards), hand: [], portrait: portrait || null };
};

// Aktueller Sitzplatz-Index (0-3) am Zug.
Game_TCGTagDuel.prototype.activeSeatIndex = function() {
    return Game_TCGTagDuel.TURN_ORDER[this._turnIndex % 4];
};

// Welcher Sitzplatz nach dem aktuellen an der Reihe ist (fuer "Zug beenden").
Game_TCGTagDuel.prototype.nextSeatIndex = function() {
    return Game_TCGTagDuel.TURN_ORDER[(this._turnIndex + 1) % 4];
};

//=============================================================================
// Plugin-Befehl: TCG TagDuell <partnerId> <gegner1Id> <gegner2Id>
//-----------------------------------------------------------------------------
// Spieler (eigenes aktives Deck) + ein KI-Partner gegen ein KI-Team aus zwei
// Gegnern. partnerId/gegner1Id/gegner2Id sind NPC-Deck-Vorlagen-IDs (genau
// wie bei "TCG Kampf <gegnerId>" fuer normale Duelle). Das Gegner-Team ist
// immer KI-gesteuert; der eigene Partner in dieser einfachen Befehlsform
// ebenfalls (fuer echtes Hotseat mit einem zweiten Menschen am selben Geraet
// siehe Scene_TCGTagDuel.prepare(...) direkt aus eigenem Event-Code heraus).
//=============================================================================
(function() {
    function deckArrayToMap(deckArr) {
        var m = {};
        (deckArr || []).forEach(function(e) { m[e.kartenId] = (m[e.kartenId] || 0) + Number(e.anzahl || 1); });
        return m;
    }

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command !== 'TCG') return;
        if (args[0] !== 'TagDuell' && args[0] !== 'TagDuel') return;

        var playerDeck = TCG.activeDeck();
        if (!playerDeck || !TCG.deckValid(playerDeck)) {
            $gameMessage.add('Dein aktives Deck ist ungueltig!');
            $gameMessage.add('(' + TCG.param.deckMin + '-' + TCG.param.deckMax +
                ' Karten, im Deck Builder waehlen)');
            return;
        }
        var partner = TCG.opponent(args[1]);
        var gegner1 = TCG.opponent(args[2]);
        var gegner2 = TCG.opponent(args[3]);
        if (!partner || !gegner1 || !gegner2) {
            $gameMessage.add('TCG: TagDuell-Teilnehmer nicht gefunden (' +
                args[1] + ' / ' + args[2] + ' / ' + args[3] + ').');
            return;
        }

        var playerName = $gameActors.actor(1) ? $gameActors.actor(1).name() : 'Spieler';
        var seatDecks = [playerDeck.cards, deckArrayToMap(partner.deck), deckArrayToMap(gegner1.deck), deckArrayToMap(gegner2.deck)];
        var teamNames = [playerName + ' & ' + partner.name, gegner1.name + ' & ' + gegner2.name];
        var seatNames = [playerName, partner.name, gegner1.name, gegner2.name];
        var seatPortraits = [null, partner.portrait, gegner1.portrait, gegner2.portrait];

        // Sitzplatz 0 (der Spieler) ist der einzige Mensch - Partner (1) und
        // beide Gegner (2, 3) sind KI-gesteuert.
        Scene_TCGTagDuel.prepare(seatDecks, teamNames, seatNames, [1, 2, 3], seatPortraits);
        SceneManager.push(Scene_TCGTagDuel);
    };
})();

Game_TCGTagDuel.prototype.seatInfo = function(i) { return this._seats[i]; };
Game_TCGTagDuel.prototype.activeTeamIndex = function() { return this.seatInfo(this.activeSeatIndex()).teamIndex; };

// Welcher Sitzplatz eines Teams gerade "aktiv" ist (fuer die Hand-Anzeige) -
// ausserhalb des eigenen Zugs ist das schlicht der zuletzt aktive Sitzplatz
// dieses Teams (Standard: der erste, bevor das Team ueberhaupt dran war).
Game_TCGTagDuel.prototype.activeSeatOfTeam = function(teamIndex) {
    if (this.activeTeamIndex() === teamIndex) return this.activeSeatIndex();
    return this._lastActiveSeatOfTeam && this._lastActiveSeatOfTeam[teamIndex] !== undefined ?
        this._lastActiveSeatOfTeam[teamIndex] : (teamIndex === 0 ? 0 : 2);
};

// "Spieler"-Sicht auf ein TEAM, kompatibel zur bestehenden Kampf-/Effekt-
// Logik (die urspruenglich fuer Game_TCGBattle gebaut wurde): lp/ap/zones/
// grave/exile/tokens kommen direkt vom TEAM (geteilt), hand/deck vom gerade
// aktiven Sitzplatz dieses Teams (getrennt). lp/ap sind ueber Getter/Setter
// echte Durchgriffe auf das Team-Objekt, keine Kopien - Mutationen wie
// "player(0).ap -= 2" wirken sich also korrekt auf das Team aus.
Game_TCGTagDuel.prototype.player = function(teamIndex) {
    var team = this._teams[teamIndex];
    var seat = this.seatInfo(this.activeSeatOfTeam(teamIndex));
    var proxy = {
        name: team.name, zones: team.zones, grave: team.grave, exile: team.exile,
        tokens: team.tokens, tokensSeen: team.tokensSeen, pendingRevival: team.pendingRevival,
        hand: seat.hand, deck: seat.deck
    };
    Object.defineProperty(proxy, 'lp', { get: function () { return team.lp; }, set: function (v) { team.lp = v; }, enumerable: true });
    Object.defineProperty(proxy, 'ap', { get: function () { return team.ap; }, set: function (v) { team.ap = v; }, enumerable: true });
    return proxy;
};

Game_TCGTagDuel.prototype.tokenCount = function(side, typ) {
    return (this.player(side).tokens[typ]) || 0;
};

// Aendert die Tokenanzahl (amount kann negativ sein). Beachtet ein optionales
// Maximum aus der TokenTypen-Definition und geht nie unter 0.
Game_TCGTagDuel.prototype.addTokens = function(side, typ, amount) {
    if (!typ) return;
    var p = this.player(side);
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
Game_TCGTagDuel.prototype._groupTokenCosts = function(reqs) {
    var need = {};
    (reqs || []).forEach(function(r) {
        need[r.typ] = (need[r.typ] || 0) + (Number(r.anzahl) || 1);
    });
    return need;
};

Game_TCGTagDuel.prototype.hasTokens = function(side, reqs) {
    if (!reqs || reqs.length === 0) return true;
    var p = this.player(side);
    var need = this._groupTokenCosts(reqs);
    for (var typ in need) {
        if ((p.tokens[typ] || 0) < need[typ]) return false;
    }
    return true;
};

Game_TCGTagDuel.prototype.consumeTokens = function(side, reqs) {
    if (!reqs || reqs.length === 0) return;
    var self = this;
    var need = this._groupTokenCosts(reqs);
    for (var typ in need) { self.addTokens(side, typ, -need[typ]); }
};

// Liefert, welche Zahlungsarten fuer die AP-Kosten eines Monsters aktuell
// moeglich sind: 'ap', 'token' oder beides. Leer = nicht bezahlbar.
Game_TCGTagDuel.prototype.paymentOptions = function(side, card) {
    var cost = TCG.summonCost(card);
    var options = [];
    if (this.player(side).ap >= cost) options.push('ap');
    if (card.tokenErsatzTyp && this.tokenCount(side, card.tokenErsatzTyp) >= cost) options.push('token');
    return options;
};

// Bezahlt die AP-Kosten eines Monsters. "method" ('ap'/'token') kommt von der
// Spielerentscheidung (Szene fragt nach, wenn beide Wege moeglich sind) bzw.
// von der KI. Ohne Angabe: bevorzugt Token, falls moeglich (KI-Standard).
// Rueckgabe: true, wenn mit Token bezahlt wurde (fuer UI-Rueckmeldung).
Game_TCGTagDuel.prototype.payMonsterAP = function(side, card, method) {
    var cost = TCG.summonCost(card);
    var canToken = !!card.tokenErsatzTyp && this.tokenCount(side, card.tokenErsatzTyp) >= cost;
    var useToken = method ? (method === 'token' && canToken) : canToken;
    if (useToken) {
        this.addTokens(side, card.tokenErsatzTyp, -cost);
        return true;
    }
    this.player(side).ap -= cost;
    return false;
};

// Kann die AP-Kosten eines Monsters ueberhaupt aufgebracht werden (per AP ODER
// per Token-Ersatz)?
Game_TCGTagDuel.prototype.canPayMonsterAP = function(side, card) {
    return this.paymentOptions(side, card).length > 0;
};

Game_TCGTagDuel.prototype.active = function() { return this.activeTeamIndex(); };
Game_TCGTagDuel.prototype.activePlayer = function() { return this.player(this.activeTeamIndex()); };
Game_TCGTagDuel.prototype.enemyIndex = function(i) { return 1 - i; };
Game_TCGTagDuel.prototype.phase = function() { return this._phase; };
Game_TCGTagDuel.prototype.turnCount = function() { return this._turnCount; };
Game_TCGTagDuel.prototype.winner = function() { return this._winner; };
Game_TCGTagDuel.prototype.isOver = function() { return this._winner >= 0; };
Game_TCGTagDuel.prototype.floating = function() { return this._floating; };

Game_TCGTagDuel.prototype.phaseName = function() {
    switch (this._phase) {
        case 'start':  return 'Zugbeginn';
        case 'draw':   return 'Draw Phase';
        case 'main':   return 'Hauptphase';
        case 'battle': return 'Kampfphase';
        default:       return '';
    }
};

//--- Werte-Berechnung (Auren, Ausruestung, Buffs) -----------------------------
Game_TCGTagDuel.prototype.slot = function(side, zone) {
    return this.player(side).zones[zone];
};

// Erfuellt der Besitzer die Bedingung eines Effekts?
Game_TCGTagDuel.prototype.conditionMet = function(side, effect) {
    var name = String(effect.bedingungName || '').trim();
    var elem = effect.bedingungElement && effect.bedingungElement !== 'keine' ?
        effect.bedingungElement : '';
    if (!name && !elem) return true;
    var zones = this.player(side).zones;
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
Game_TCGTagDuel.prototype.auraHits = function(side, zone, bereich, tSide, tZone) {
    switch (bereich) {
        case 'selbst':            return tSide === side && tZone === zone;
        case 'angrenzend':        return tSide === side && Math.abs(tZone - zone) === 1;
        case 'alleEigene':        return tSide === side;
        case 'alleGegnerischen':  return tSide !== side;
        case 'gegenueber':        return tSide !== side && tZone === zone;
        default:                  return false;
    }
};

Game_TCGTagDuel.prototype.auraAtk = function(tSide, tZone) {
    var total = 0;
    for (var s = 0; s < 2; s++) {
        for (var z = 0; z < 3; z++) {
            var slot = this.player(s).zones[z];
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
Game_TCGTagDuel.prototype.auraLp = function(tSide, tZone) {
    var total = 0;
    for (var s = 0; s < 2; s++) {
        for (var z = 0; z < 3; z++) {
            var slot = this.player(s).zones[z];
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

Game_TCGTagDuel.prototype.equipAtk = function(slot) {
    return (slot.equips || []).reduce(function(sum, id) {
        var c = TCG.card(id);
        return sum + (c ? c.atk : 0);
    }, 0);
};

// Zaehlt Karten eines bestimmten "archetyp"-Werts (neues, optionales
// Kartenfeld - z.B. "Untote"/"Maschine") im Friedhof bzw. auf dem Feld einer
// Seite. Grundlage fuer Friedhof-Skalierung und Feld-Zaehlbedingungen.
Game_TCGTagDuel.prototype.graveyardCount = function(side, archetyp) {
    var p = this.player(side);
    var count = 0;
    for (var i = 0; i < p.grave.length; i++) {
        var c = TCG.card(p.grave[i]);
        if (c && c.archetyp === archetyp) count++;
    }
    return count;
};

Game_TCGTagDuel.prototype.fieldCount = function(side, archetyp) {
    var p = this.player(side);
    var count = 0;
    for (var z = 0; z < 3; z++) {
        var slot = p.zones[z];
        if (!slot) continue;
        var c = TCG.card(slot.id);
        if (c && c.archetyp === archetyp) count++;
    }
    return count;
};

Game_TCGTagDuel.prototype.equipLp = function(slot) {
    return (slot.equips || []).reduce(function(sum, id) {
        var c = TCG.card(id);
        return sum + (c ? c.lp : 0);
    }, 0);
};

Game_TCGTagDuel.prototype.effAtk = function(side, zone) {
    var slot = this.slot(side, zone);
    if (!slot) return 0;
    return Math.max(0, TCG.card(slot.id).atk + slot.atkMod +
        this.equipAtk(slot) + this.auraAtk(side, zone));
};

Game_TCGTagDuel.prototype.maxLp = function(side, zone) {
    var slot = this.slot(side, zone);
    if (!slot) return 0;
    return Math.max(1, TCG.card(slot.id).lp + slot.lpMod + this.equipLp(slot) + this.auraLp(side, zone));
};

Game_TCGTagDuel.prototype.curLp = function(side, zone) {
    var slot = this.slot(side, zone);
    if (!slot) return 0;
    return this.maxLp(side, zone) - slot.damage;
};

//--- Effekte eines Slots (Monster + Ausruestungen) je Trigger -----------------
Game_TCGTagDuel.prototype.slotEffects = function(side, zone, trigger) {
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
// seatIndex: welcher der 4 Sitzplaetze jetzt an der Reihe ist (0-3, siehe
// Game_TCGTagDuel.TURN_ORDER fuer die Rotationsreihenfolge).
Game_TCGTagDuel.prototype.startTurn = function(seatIndex) {
    var orderPos = Game_TCGTagDuel.TURN_ORDER.indexOf(seatIndex);
    if (orderPos >= 0) this._turnIndex = orderPos;
    this._turnCount++;
    this._phase = 'start';
    if (!this._lastActiveSeatOfTeam) this._lastActiveSeatOfTeam = {};
    this._lastActiveSeatOfTeam[this.seatInfo(seatIndex).teamIndex] = seatIndex;

    var p = this.activePlayer(); // Team-Sicht des jetzt aktiven Teams
    var zones = p.zones;
    for (var i = 0; i < zones.length; i++) {
        if (zones[i]) {
            zones[i].attacked = 0;
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
                    attacked: 0, effectUsed: false, summonedTurn: this._turnCount
                };
            }
        }
        p.pendingRevival = stillPending;
    }
};

// Startet die Partie mit einer vollen Hand fuer alle VIER Sitzplaetze
// (einmalig, vor dem ersten Zug). Das Ziehen WAEHREND eines Zuges (doDraw)
// zieht danach nur noch 1 Karte pro Zug, nicht mehr auf HandGroesse auf.
Game_TCGTagDuel.prototype.dealInitialHands = function() {
    for (var i = 0; i < 4; i++) {
        var p = this._seats[i];
        while (p.hand.length < TCG.param.handSize && p.deck.length > 0) {
            p.hand.push(p.deck.shift());
        }
    }
};

Game_TCGTagDuel.prototype.doDraw = function() {
    var p = this.activePlayer();
    this._phase = 'draw';
    var drawn = 0;
    if (p.deck.length === 0) {
        this._winner = this.enemyIndex(this.activeTeamIndex());
        return drawn;
    }
    p.hand.push(p.deck.shift());
    drawn = 1;
    p.turnsTaken++;
    // Gleicher Fix wie bei Game_TCGBattle.doDraw: nur der allererste Zug
    // des gesamten Duells bekommt den Erstzug-AP-Bonus.
    var gain = this._turnCount === 1 ? TCG.param.apFirstTurn : TCG.param.apPerTurn;
    p.ap = Math.min(TCG.param.apMax, p.ap + gain);
    this._phase = 'main';
    return drawn;
};

// Trigger-Sammlung fuer Zugbeginn/-ende der aktiven Seite
// Muss der aktive Sitzplatz von "side" (Team-Index) am Zugende Handkarten
// abwerfen? player(side).hand loest bereits auf den aktiven Sitzplatz des
// Teams auf (siehe player()-Proxy).
Game_TCGTagDuel.prototype.needsDiscard = function(side) {
    return this.player(side).hand.length > TCG.param.maxHandSize;
};

Game_TCGTagDuel.prototype.discardHandCards = function(side, indices) {
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

Game_TCGTagDuel.prototype.aiChooseDiscards = function(side, count) {
    var hand = this.player(side).hand;
    var order = hand.map(function(id, i) { return i; });
    order.sort(function(a, b) {
        var costA = TCG.card(hand[a]) ? (TCG.card(hand[a]).apKosten || 0) : 0;
        var costB = TCG.card(hand[b]) ? (TCG.card(hand[b]).apKosten || 0) : 0;
        return costB - costA;
    });
    return order.slice(0, count);
};

Game_TCGTagDuel.prototype.turnTriggers = function(trigger) {
    var list = [];
    for (var z = 0; z < 3; z++) {
        list = list.concat(this.slotEffects(this.activeTeamIndex(), z, trigger));
    }
    return list;
};

Game_TCGTagDuel.prototype.battleAllowed = function() { return this._turnCount >= 2; };
Game_TCGTagDuel.prototype.toBattlePhase = function() {
    if (this.battleAllowed()) this._phase = 'battle';
};
Game_TCGTagDuel.prototype.surrender = function(i) { this._winner = this.enemyIndex(i); };

//--- Beschwoerungen -----------------------------------------------------------
// Prueft/plant eine Liste von Ablage-Kosten-Anforderungen (Karten aus der
// EIGENEN Ablage). Rueckgabe: Array von Ablage-Indizes (leer = keine Kosten
// noetig) oder null, falls nicht erfuellbar. Dieselbe Ablage-Karte wird nie
// fuer zwei Anforderungen gleichzeitig verwendet.
Game_TCGTagDuel.prototype.graveyardPlan = function(side, requirements) {
    if (!requirements || requirements.length === 0) return [];
    var grave = this.player(side).grave;
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
Game_TCGTagDuel.prototype.consumeGraveyard = function(side, indices) {
    if (!indices || indices.length === 0) return;
    var p = this.player(side);
    indices.slice().sort(function(a, b) { return b - a; }).forEach(function(i) {
        var id = p.grave.splice(i, 1)[0];
        p.exile.push(id);
    });
};

Game_TCGTagDuel.prototype.hasEmptyZone = function(side) {
    return this.player(side).zones.indexOf(null) >= 0;
};

Game_TCGTagDuel.prototype.ownMonsterCount = function(side) {
    return this.player(side).zones.filter(function(z) { return !!z; }).length;
};

// Kann die Handkarte (Index) grundsaetzlich gespielt werden?
Game_TCGTagDuel.prototype.canPlayHandCard = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || this._phase !== 'main') return false;
    if (card.kartenTyp === 'zauber') return this.canPlaySpell(handIndex);
    if (card.kartenTyp === 'ausruestung') return this.canEquip(handIndex);
    if (card.monsterArt === 'fusion') return this.canFusion(handIndex);
    if (card.monsterArt === 'ritual') return this.canRitual(handIndex);
    return this.canNormalSummon(handIndex);
};

Game_TCGTagDuel.prototype.canNormalSummon = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || !TCG.isMonster(card) || card.monsterArt !== 'normal') return false;
    if (!this.canPayMonsterAP(this.activeTeamIndex(), card)) return false;
    if (this.graveyardPlan(this.activeTeamIndex(), card.ablageKosten) === null) return false;
    if (!this.hasTokens(this.activeTeamIndex(), card.tokenKosten)) return false;
    if (TCG.needsTribute(card)) return this.ownMonsterCount(this.activeTeamIndex()) > 0;
    return this.hasEmptyZone(this.activeTeamIndex());
};

Game_TCGTagDuel.prototype.canRitual = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || card.monsterArt !== 'ritual') return false;
    if (!this.canPayMonsterAP(this.activeTeamIndex(), card)) return false;
    if (!this.hasMatchingTribute(card)) return false;
    if (this.graveyardPlan(this.activeTeamIndex(), card.ablageKosten) === null) return false;
    if (!this.hasTokens(this.activeTeamIndex(), card.tokenKosten)) return false;
    return this.keyIndex(handIndex) >= 0;
};

// Gibt es im Feld ein Monster, das die ritualTribut-Anforderung der Karte erfuellt?
Game_TCGTagDuel.prototype.hasMatchingTribute = function(card) {
    var p = this.activePlayer();
    for (var z = 0; z < 3; z++) {
        if (this.tributeMatches(card, z)) return true;
    }
    return false;
};

Game_TCGTagDuel.prototype.tributeMatches = function(card, zoneIndex) {
    var slot = this.activePlayer().zones[zoneIndex];
    if (!slot) return false;
    if (!TCG.ritualNeedsSpecificTribute(card)) return true; // "beliebig"
    return TCG.materialMatches(card.ritualTribut, slot.id);
};

// Index des benoetigten Zaubers auf der Hand (ungleich handIndex). Kein
// benoetigteKarte gesetzt -> -1 (bei Fusion bedeutet das "kein Zauber noetig",
// bei Ritual ist benoetigteKarte immer Pflicht).
Game_TCGTagDuel.prototype.keyIndex = function(handIndex) {
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
Game_TCGTagDuel.prototype.fusionPlan = function(handIndex) {
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
    var freeAfter = 3 - (this.ownMonsterCount(this.activeTeamIndex()) - plan.feld.length);
    if (freeAfter <= 0) return null;
    if (!this.hasTokens(this.activeTeamIndex(), card.tokenKosten)) return null;
    if (this.graveyardPlan(this.activeTeamIndex(), card.ablageKosten) === null) return null;
    return plan;
};

Game_TCGTagDuel.prototype.canFusion = function(handIndex) {
    return !!this.fusionPlan(handIndex);
};

// Konsum-Schritte: bezahlen/verbrauchen, Karte "schwebt" bis zur Zonenwahl.
// Ablage-Kosten werden IMMER VOR dem jeweiligen Tribut/Material-Abwurf geplant,
// damit eine Karte niemals ihre eigenen frisch entstandenen Ablage-Karten
// (z.B. den eigenen Tribut) fuer ihre eigenen Ablage-Kosten verwenden kann.
Game_TCGTagDuel.prototype.beginNormalSummon = function(handIndex, tributeZone, payMethod) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var gravePlan = this.graveyardPlan(this.activeTeamIndex(), card.ablageKosten);
    var paidWithToken = this.payMonsterAP(this.activeTeamIndex(), card, payMethod);
    this.consumeTokens(this.activeTeamIndex(), card.tokenKosten);
    if (tributeZone !== null && tributeZone !== undefined && tributeZone >= 0) {
        this.sendToGrave(this.activeTeamIndex(), tributeZone);
    }
    this.consumeGraveyard(this.activeTeamIndex(), gravePlan);
    this._floating = p.hand.splice(handIndex, 1)[0];
    return paidWithToken;
};

Game_TCGTagDuel.prototype.beginRitual = function(handIndex, tributeZone, payMethod) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var keyIdx = this.keyIndex(handIndex);
    var gravePlan = this.graveyardPlan(this.activeTeamIndex(), card.ablageKosten);
    var paidWithToken = this.payMonsterAP(this.activeTeamIndex(), card, payMethod);
    this.consumeTokens(this.activeTeamIndex(), card.tokenKosten);
    this.removeHandByIndices(p, [keyIdx], true);
    this.sendToGrave(this.activeTeamIndex(), tributeZone);
    this.consumeGraveyard(this.activeTeamIndex(), gravePlan);
    var newIdx = p.hand.indexOf(card.id);
    this._floating = p.hand.splice(newIdx, 1)[0];
    return paidWithToken;
};

Game_TCGTagDuel.prototype.beginFusion = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var plan = this.fusionPlan(handIndex);
    var gravePlan = this.graveyardPlan(this.activeTeamIndex(), card.ablageKosten);
    var self = this;
    plan.feld.forEach(function(z) { self.sendToGrave(self.activeTeamIndex(), z); });
    var handIndices = plan.hand.slice();
    if (plan.key >= 0) handIndices.push(plan.key);
    this.removeHandByIndices(p, handIndices, true);
    this.consumeGraveyard(this.activeTeamIndex(), gravePlan);
    this.consumeTokens(this.activeTeamIndex(), card.tokenKosten);
    var newIdx = p.hand.indexOf(card.id);
    this._floating = p.hand.splice(newIdx, 1)[0];
};

// Entfernt Handkarten anhand von Indizes (absteigend sortiert), optional in die Ablage
Game_TCGTagDuel.prototype.removeHandByIndices = function(p, indices, toGrave) {
    indices.slice().sort(function(a, b) { return b - a; }).forEach(function(i) {
        var id = p.hand.splice(i, 1)[0];
        if (toGrave) p.grave.push(id);
    });
};

// Schwebende Karte in eine leere Zone setzen. Rueckgabe: beimBeschwoeren-Trigger.
Game_TCGTagDuel.prototype.placeFloating = function(zoneIndex) {
    var p = this.activePlayer();
    if (!this._floating || p.zones[zoneIndex]) return [];
    p.zones[zoneIndex] = {
        id: this._floating, atkMod: 0, lpMod: 0, damage: 0, equips: [],
        attacked: false, effectUsed: false, summonedTurn: this._turnCount
    };
    this._floating = null;
    return this.slotEffects(this.activeTeamIndex(), zoneIndex, 'beimBeschwoeren');
};

// Stellt den kompletten Spielerzustand aus einem zuvor gesicherten Snapshot
// wieder her (siehe Scene_TCGBattle.prototype.snapshotBeforeSummon) - fuer
// den echten Beschwoerungs-Abbruch mit voller Kostenerstattung.
Game_TCGTagDuel.prototype.restorePlayer = function(side, snapshot) {
    var team = this._teams[side];
    team.lp = snapshot.lp; team.ap = snapshot.ap;
    team.zones = snapshot.zones; team.grave = snapshot.grave; team.exile = snapshot.exile;
    team.tokens = snapshot.tokens; team.tokensSeen = snapshot.tokensSeen; team.pendingRevival = snapshot.pendingRevival;
    var seat = this.seatInfo(this.activeSeatOfTeam(side));
    seat.hand = snapshot.hand; seat.deck = snapshot.deck;
};

// Verwirft eine noch nicht platzierte "schwebende" Karte, ohne sie irgendwo
// abzulegen (wird beim Beschwoerungs-Abbruch zusammen mit restorePlayer
// aufgerufen - die Karte liegt durch den Snapshot bereits wieder in der Hand).
Game_TCGTagDuel.prototype.clearFloating = function() {
    this._floating = null;
};

//--- Zauber & Ausruestung -----------------------------------------------------
Game_TCGTagDuel.prototype.canPlaySpell = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    if (!card || card.kartenTyp !== 'zauber') return false;
    if (p.ap < card.apKosten) return false;
    return (card.effekte || []).some(function(e) { return e.trigger === 'beimSpielen'; });
};

Game_TCGTagDuel.prototype.playSpell = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    var self = this;
    p.ap -= card.apKosten;
    p.hand.splice(handIndex, 1);
    p.grave.push(card.id);
    return (card.effekte || []).filter(function(e) {
        return e.trigger === 'beimSpielen' && self.conditionMet(self.activeTeamIndex(), e);
    }).map(function(e) { return { side: self.activeTeamIndex(), effect: e }; });
};

Game_TCGTagDuel.prototype.canEquip = function(handIndex) {
    var p = this.activePlayer();
    var card = TCG.card(p.hand[handIndex]);
    return !!card && card.kartenTyp === 'ausruestung' &&
           p.ap >= card.apKosten && this.ownMonsterCount(this.activeTeamIndex()) > 0;
};

Game_TCGTagDuel.prototype.equip = function(handIndex, zoneIndex) {
    var p = this.activePlayer();
    var slot = p.zones[zoneIndex];
    if (!slot) return;
    var card = TCG.card(p.hand[handIndex]);
    p.ap -= card.apKosten;
    p.hand.splice(handIndex, 1);
    slot.equips.push(card.id);
};

//--- Aktivierbare Effekte -----------------------------------------------------
Game_TCGTagDuel.prototype.activatableEffects = function(zoneIndex) {
    return this.slotEffects(this.activeTeamIndex(), zoneIndex, 'aktivierbar');
};

Game_TCGTagDuel.prototype.canActivate = function(zoneIndex) {
    var p = this.activePlayer();
    var slot = p.zones[zoneIndex];
    if (!slot || slot.effectUsed || this._phase !== 'main') return false;
    var effects = this.activatableEffects(zoneIndex);
    if (effects.length === 0) return false;
    var effect = effects[0].effect;
    if (p.ap < (Number(effect.apKosten) || 0)) return false;
    if (this.graveyardPlan(this.activeTeamIndex(), effect.ablageKosten) === null) return false;
    if (!this.hasTokens(this.activeTeamIndex(), effect.tokenKosten)) return false;
    return true;
};

Game_TCGTagDuel.prototype.activate = function(zoneIndex) {
    var p = this.activePlayer();
    var effects = this.activatableEffects(zoneIndex);
    var effect = effects[0].effect;
    p.zones[zoneIndex].effectUsed = true;
    p.ap -= (Number(effect.apKosten) || 0);
    this.consumeGraveyard(this.activeTeamIndex(), this.graveyardPlan(this.activeTeamIndex(), effect.ablageKosten));
    this.consumeTokens(this.activeTeamIndex(), effect.tokenKosten);
    return effects;
};

//--- Effekt-Aufloesung --------------------------------------------------------

// Hinweis: TCG.ZIEL_AKTIONEN/TCG.defaultZielSeite sind bereits in
// TCG_Battle.js definiert (gemeinsamer TCG-Namespace) - hier bewusst NICHT
// erneut definiert, um Verwechslungen ueber zwei Quellen zu vermeiden.

Game_TCGTagDuel.prototype.needsZielMonster = function(effect) {
    return TCG.ZIEL_AKTIONEN.indexOf(effect.aktion) >= 0;
};

// Liefert die ABSOLUTE Seite (0/1), auf der die Ziel-Zonen liegen - "side" ist
// die Seite des ausloesenden Spielers/Effekts.
Game_TCGTagDuel.prototype.resolveZielSeite = function(effect, side) {
    var z = effect.zielSeite || TCG.defaultZielSeite(effect.aktion);
    switch (z) {
        case 'gegner':
        case 'alleGegnerische': return this.enemyIndex(side);
        default: return side; // selbst, verbuendeter, alleEigene
    }
};

Game_TCGTagDuel.prototype.zielModus = function(effect) {
    return effect.zielSeite || TCG.defaultZielSeite(effect.aktion);
};

// Wie viele einzelne Ziele der Spieler nacheinander waehlen soll (nur relevant
// bei zielSeite "gegner"/"verbuendeter" - bei "alle*"/"selbst" irrelevant).
Game_TCGTagDuel.prototype.effectTargetCount = function(effect) {
    return Math.max(1, Math.min(3, Number(effect.zielAnzahl) || 1));
};

// "suche" bleibt ein eigener Sonderfall (Deck-Interaktion statt Monster-Ziel).
Game_TCGTagDuel.prototype.effectTargetType = function(effect) {
    if (effect.aktion === 'suche') return 'search';
    if (this.needsZielMonster(effect)) return 'ziel';
    return null;
};

Game_TCGTagDuel.prototype.searchMatches = function(side, effect) {
    var deck = this.player(side).deck;
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

Game_TCGTagDuel.prototype.takeFromDeck = function(side, deckIndex) {
    var p = this.player(side);
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
Game_TCGTagDuel.prototype.resolveEffect = function(side, effect, targetSide, targetZone) {
    var p = this.player(side);
    var eSide = this.enemyIndex(side);
    var e = this.player(eSide);
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
            var slot = this.player(targetSide).zones[targetZone];
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
            var own = this.player(targetSide).zones[targetZone];
            if (!own) return { text: 'Kein Ziel' };
            own.damage = Math.max(0, own.damage - w);
            return { text: TCG.card(own.id).name + ' +' + w + ' LP' };
        }
        case 'atkBuff':
            if (this.player(targetSide).zones[targetZone]) {
                this.player(targetSide).zones[targetZone].atkMod += w;
                return { text: TCG.card(this.player(targetSide).zones[targetZone].id).name + ' +' + w + ' ATK' };
            }
            return { text: 'Kein Ziel' };
        case 'atkDebuff':
            if (this.player(targetSide).zones[targetZone]) {
                this.player(targetSide).zones[targetZone].atkMod -= w;
                return { text: TCG.card(this.player(targetSide).zones[targetZone].id).name + ' -' + w + ' ATK' };
            }
            return { text: 'Kein Ziel' };
        case 'zerstoeren':
            if (this.player(targetSide).zones[targetZone]) {
                var dName = TCG.card(this.player(targetSide).zones[targetZone].id).name;
                if (this.blocksDestruction(targetSide, targetZone, effect.trigger === 'beimSpielen')) {
                    return { text: dName + ' widersteht der Zerstoerung!' };
                }
                var dTriggers = this.destroyTriggers(targetSide, targetZone, side, null);
                this.sendToGrave(targetSide, targetZone);
                return { text: dName + ' zerstoert!', triggers: dTriggers };
            }
            return { text: 'Kein Ziel' };
        case 'verbannen':
            if (this.player(targetSide).zones[targetZone]) {
                var bName = TCG.card(this.player(targetSide).zones[targetZone].id).name;
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
                if (!this.player(tokenSide).zones[tz]) { emptyZone = tz; break; }
            }
            if (emptyZone < 0 || !effect.tokenKartenId || !TCG.card(effect.tokenKartenId)) {
                return { text: 'Kein Platz für Token' };
            }
            this.player(tokenSide).zones[emptyZone] = {
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
Game_TCGTagDuel.prototype.destroyTriggers = function(victimSide, victimZone, killerSide, killerZone) {
    var list = this.slotEffects(victimSide, victimZone, 'beiZerstoerung');
    if (killerZone !== null && killerZone !== undefined && killerZone >= 0) {
        list = list.concat(this.slotEffects(killerSide, killerZone, 'beimZerstoeren'));
    }
    return list;
};

// Monster (mit Ausruestungen) in die Ablage
Game_TCGTagDuel.prototype.sendToGrave = function(side, zoneIndex) {
    var p = this.player(side);
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
Game_TCGTagDuel.prototype.banish = function(side, zoneIndex) {
    var p = this.player(side);
    var slot = p.zones[zoneIndex];
    if (!slot) return;
    (slot.equips || []).forEach(function(id) { p.grave.push(id); });
    p.exile.push(slot.id);
    p.zones[zoneIndex] = null;
};

//--- Kampf --------------------------------------------------------------------
Game_TCGTagDuel.prototype.canAttack = function(zoneIndex) {
    var p = this.activePlayer();
    var slot = p.zones[zoneIndex];
    return this._phase === 'battle' && !!slot &&
           (slot.attacked || 0) < this.maxAttacksPerTurn(this.activeTeamIndex(), zoneIndex) &&
           p.ap >= TCG.param.attackCost;
};

//--- KI (adaptiert von Game_TCGBattle) -----------------------------------------
Game_TCGTagDuel.prototype.aiNextAction = function() {
    var side = this.activeTeamIndex();
    var p = this.player(side);

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

Game_TCGTagDuel.prototype.aiSpellUseful = function(side, card) {
    var p = this.player(side);
    var e = this.player(this.enemyIndex(side));
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

Game_TCGTagDuel.prototype.aiWeakestZone = function(side) {
    var zones = this.player(side).zones;
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
Game_TCGTagDuel.prototype.aiWeakestMatchingZone = function(side, ritualCard) {
    var zones = this.player(side).zones;
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

Game_TCGTagDuel.prototype.aiStrongestZone = function(side, excludeZones) {
    var zones = this.player(side).zones;
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
Game_TCGTagDuel.prototype.aiBestAttack = function() {
    var side = this.activeTeamIndex();
    var defSide = this.enemyIndex(side);
    var p = this.player(side);
    var e = this.player(defSide);
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
Game_TCGTagDuel.prototype.aiPickZone = function(cardId) {
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
Game_TCGTagDuel.prototype.aiResolveEffects = function(entries) {
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

// Wie oft ein Monster pro Zug angreifen darf - Standard 1, hoeher bei einem
// dauerhaft-Effekt "mehrfachAngriff" (wert = maximale Angriffe pro Zug).

//=============================================================================
// Scene_TCGTagDuel - schlanke Unterklasse von Scene_TCGBattle
//-----------------------------------------------------------------------------
// Erbt so gut wie ALLES (Zeichnen, Layout, Eingabe-Logik) unveraendert von
// Scene_TCGBattle - moeglich, weil Scene_TCGBattle inzwischen "wer gerade
// dran ist" ueber this.mySide()/this.enemySide() abfragt statt fest Seite 0/1
// anzunehmen (siehe TCG_Battle.js). Ueberschrieben wird nur: der Spielaufbau
// (Game_TCGTagDuel statt Game_TCGBattle, 4 Sitzplaetze statt 2 Spieler), der
// Zugwechsel (rotiert durch 4 Sitzplaetze statt zwischen 2 Seiten zu
// wechseln) und isAiSide (in dieser Phase keine KI - beide Teams sind immer
// interaktiv/Hotseat).
//
// Darstellung wie besprochen: Team A (Sitzplaetze 0+1) IMMER unten, Team B
// (Sitzplaetze 2+3) IMMER oben - unabhaengig davon, wer gerade dran ist (wie
// an einem echten Tisch). Nur die Handkarten-Anzeige (unten) und die
// Eingabe-Ziele wechseln automatisch zum jeweils aktiven Sitzplatz/Team.
//
// NOCH NICHT enthalten (naechste Ausbauschritte): KI fuer ein Team,
// Netzwerk-Synchronisation fuer Tag-Duelle.
//=============================================================================
function Scene_TCGTagDuel() { this.initialize.apply(this, arguments); }
window.Scene_TCGTagDuel = Scene_TCGTagDuel;
Scene_TCGTagDuel.prototype = Object.create(Scene_TCGBattle.prototype);
Scene_TCGTagDuel.prototype.constructor = Scene_TCGTagDuel;

// seatDecks: [deckA1, deckA2, deckB1, deckB2] (je {cardId:Anzahl}).
// teamNames: [TeamAName, TeamBName]. seatNames: [a1,a2,b1,b2].
// aiSeats: optional, Array von SITZPLATZ-Indizes (0-3), die KI-gesteuert
// sind (z.B. [1,2,3] fuer "nur Sitzplatz 0/der Spieler ist Mensch"). Ohne
// Angabe: keine KI (voller Hotseat, alle 4 Sitzplaetze menschlich).
// seatPortraits: optional, siehe Game_TCGTagDuel.prototype.initialize.
Scene_TCGTagDuel.prepare = function(seatDecks, teamNames, seatNames, aiSeats, seatPortraits) {
    Scene_TCGTagDuel._seatDecks = seatDecks;
    Scene_TCGTagDuel._teamNames = teamNames;
    Scene_TCGTagDuel._seatNames = seatNames;
    Scene_TCGTagDuel._aiSeats = aiSeats || [];
    Scene_TCGTagDuel._seatPortraits = seatPortraits || null;
    Scene_TCGTagDuel._networkSetup = null;
};

// HOST: bereitet ein Netzwerk-Tag-Duell vor - baut lokal ganz normal auf
// (siehe prepare()), verdrahtet zusaetzlich den Broadcast an entfernte
// Mitspieler. remoteSeats: [{seatIndex, id}, ...].
Scene_TCGTagDuel.prepareNetworkHost = function(seatDecks, teamNames, seatNames, aiSeats, seatPortraits, hub, remoteSeats, mySeatIndex) {
    Scene_TCGTagDuel.prepare(seatDecks, teamNames, seatNames, aiSeats, seatPortraits);
    Scene_TCGTagDuel._networkSetup = { role: 'tagduel-host', hub: hub, remoteSeats: remoteSeats, mySeatIndex: mySeatIndex };
};

// TEILNEHMER: initialSnapshot kommt vom Host (unveraendert, keine Drehung
// noetig) - seatDecks/aiSeats hier sind nur Platzhalter fuer den lokalen
// Aufbau, werden durch applySnapshot() sofort ueberschrieben.
Scene_TCGTagDuel.prepareNetworkGuest = function(teamNames, seatNames, aiSeats, seatPortraits, session, mySeatIndex, initialSnapshot) {
    Scene_TCGTagDuel.prepare([{}, {}, {}, {}], teamNames, seatNames, aiSeats, seatPortraits);
    Scene_TCGTagDuel._networkSetup = { role: 'tagduel-guest', session: session, mySeatIndex: mySeatIndex, initialSnapshot: initialSnapshot };
};

Scene_TCGTagDuel.prepareNetworkSpectator = function(teamNames, seatNames, aiSeats, seatPortraits, session, initialSnapshot) {
    Scene_TCGTagDuel.prepare([{}, {}, {}, {}], teamNames, seatNames, aiSeats, seatPortraits);
    Scene_TCGTagDuel._networkSetup = { role: 'tagduel-spectator', session: session, initialSnapshot: initialSnapshot };
};

Scene_TCGTagDuel.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    TCG.Battle.computeLayout();
    TCG.syncProfileFromCharacterCreator(); // aktualisiert das eigene Profil, falls Character Creator installiert
    this._game = new Game_TCGTagDuel(
        Scene_TCGTagDuel._seatDecks, Scene_TCGTagDuel._teamNames, Scene_TCGTagDuel._seatNames,
        Scene_TCGTagDuel._seatPortraits);
    var netSetup = Scene_TCGTagDuel._networkSetup;
    Scene_TCGTagDuel._networkSetup = null; // einmalig verbrauchen
    this._aiSeats = Scene_TCGTagDuel._aiSeats || [];
    this._wait = 0;
    this._effectQueue = [];
    this._effectDone = null;
    this._searchRemaining = 0;
    this._selectedHand = -1;
    this._selectedZone = -1;
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

    if (netSetup && netSetup.role === 'tagduel-host') {
        this.setupNetworkTagDuelHost(netSetup.hub, netSetup.remoteSeats, netSetup.mySeatIndex);
        var self1 = this;
        this.startCoinFlipThenProceed(function(firstSeat) {
            self1._firstTurnSeat = firstSeat;
            self1._game.dealInitialHands();
            self1._state = 'intro';
            self1.refreshAll();
            self1.startShuffleAnimation();
        });
    } else if (netSetup && netSetup.role === 'tagduel-guest') {
        this.setupNetworkTagDuelGuest(netSetup.session, netSetup.mySeatIndex);
        this._game.applySnapshot(netSetup.initialSnapshot);
        this.refreshAll();
        this.refreshPortraits();
        this.syncTagDuelStateAfterSnapshot();
    } else if (netSetup && netSetup.role === 'tagduel-spectator') {
        this.setupNetworkTagDuelSpectator(netSetup.session);
        this._game.applySnapshot(netSetup.initialSnapshot);
        this.refreshAll();
        this.refreshPortraits();
        this.syncTagDuelStateAfterSnapshot();
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

// Ist der SITZPLATZ (0-3) KI-gesteuert? Konfiguriert ueber
// Scene_TCGTagDuel.prepare(...)'s aiSeats-Parameter.
// Tag-Duelle nutzen "Seite" als TEAM-Index (0/1), nicht Sitzplatz-Index.
// Lokal (Hotseat, mehrere Menschen am selben Bildschirm) zeigt der
// Bildschirm bewusst IMMER das gerade aktive Team unten - das ist Absicht
// (siehe TURN_ORDER), da hier tatsaechlich verschiedene Personen abwechselnd
// vor demselben Geraet sitzen. Im NETZWERK-Betrieb dagegen hat jeder
// Teilnehmer sein eigenes Bild - "meine Seite" muss dort FEST das eigene
// Team bleiben (siehe Scene_TCGBattle.mySide fuers 1v1-Pendant), sonst
// wuerde beim Zug des Teampartners auf einem anderen Geraet dessen Hand im
// eigenen Handbereich erscheinen.
Scene_TCGTagDuel.prototype.mySide = function() {
    if (!this._netRole) return this._game.active(); // lokal/Hotseat: dynamisch, Absicht
    if (this._netMySeat === -1 || this._netMySeat === undefined) return 0; // Zuschauer: neutral
    return this._game.seatInfo(this._netMySeat).teamIndex;
};
Scene_TCGTagDuel.prototype.enemySide = function() { return this._game.enemyIndex(this.mySide()); };

// Wer beginnt das Tag-Duell? Wird durch startCoinFlipThenProceed() VOR dem
// Deck-Mischen entschieden und hier gespeichert - Team A (Sitzplatz 0) oder
// Team B (Sitzplatz 2). Die jeweils andere Teamhaelfte folgt danach ganz
// normal ueber die bestehende Zugreihenfolge (TURN_ORDER).
Scene_TCGTagDuel.prototype.firstTurnSeat = function() {
    if (this._firstTurnSeat === undefined || this._firstTurnSeat === null) {
        this._firstTurnSeat = TCG.coinFlip() ? 0 : 2;
    }
    return this._firstTurnSeat;
};

// Kopf = Team A (Sitzplatz 0), Zahl = Team B (Sitzplatz 2) - Anzeige nutzt
// die Team-Namen statt einzelner Spielernamen (bei einem Tag-Duell koennte
// "Kopf = Du" fuer bis zu 4 Teilnehmer missverstaendlich sein).
Scene_TCGTagDuel.prototype.coinFlipSeatFor = function(isHeads) {
    return isHeads ? 0 : 2;
};

Scene_TCGTagDuel.prototype.coinFlipLabelFor = function(isHeads) {
    return this._game._teams[isHeads ? 0 : 1].name;
};

Scene_TCGTagDuel.prototype.isAiSeat = function(seatIndex) {
    return this._aiSeats.indexOf(seatIndex) >= 0;
};

// Steuere ICH (dieser Client) diesen Sitzplatz? Ohne Netzwerk-Setup: immer
// true (lokales Hotseat - jeder Sitzplatz, der nicht KI ist, wird lokal
// bedient). Im Netzwerk-Modus: nur der eigene zugewiesene Sitzplatz (Host:
// sein eigener Sitzplatz UND alle KI-Sitzplaetze, die er lokal mit ausfuehrt).
Scene_TCGTagDuel.prototype.isMySeat = function(seatIndex) {
    if (this.isAiSeat(seatIndex)) return !!this._netIsHost || !this._netRole; // KI laeuft immer beim Host (bzw. lokal ohne Netzwerk)
    if (!this._netRole) return true; // reines Hotseat
    return seatIndex === this._netMySeat;
};

// HOST: verdrahtet das eigene, autoritative Game_TCGTagDuel mit bis zu 3
// entfernten Mitspielern. remoteSeats: Array aus {seatIndex, id} - welcher
// entfernte Mitspieler (Hub-Profil-ID) welchen Sitzplatz steuert (NICHT der
// Host selbst, NICHT KI). Jede mutierende Methode wird umschlossen: nach
// JEDER Ausfuehrung (ob vom Host selbst, KI, oder einem entfernten
// Mitspieler ausgeloest) wird der neue Zustand an ALLE entfernten
// Mitspieler verschickt - keine Perspektiven-Drehung noetig (siehe
// Datei-Kommentar: Team-Position ist immer fest).
// Wird aufgerufen, wenn waehrend eines laufenden Tag-Duells die Verbindung
// zu einem Teilnehmer abbricht. Beendet das GESAMTE Duell (nicht nur den
// betroffenen Sitzplatz) - das Team des Ausgefallenen verliert automatisch,
// analog zur 1v1-Konvention (siehe Scene_TCGBattle.onNetworkDisconnect).
Scene_TCGTagDuel.prototype.onTagDuelNetworkDisconnect = function(disconnectedTeamIndex) {
    if (this._netDisconnected || this._state === 'result') return;
    this._netDisconnected = true;
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    this.refreshAll();
    SoundManager.playMiss();
    var loserTeam = this._game._teams[disconnectedTeamIndex].name;
    this.showBanner('Verbindung verloren - ' + loserTeam + ' hat das Duell verlassen', 999999, null);
    this._bannerFrames = 999999;
    this._state = 'result';
    var myTeamIndex = this._game.seatInfo(this._netMySeat).teamIndex;
    this._resultWon = (disconnectedTeamIndex !== myTeamIndex);
};

Scene_TCGTagDuel.prototype.setupNetworkTagDuelHost = function(hub, remoteSeats, mySeatIndex) {
    this._netRole = 'tagduel-host';
    this._netIsHost = true;
    this._netHub = hub;
    this._netMySeat = mySeatIndex;
    this._netRemoteSeats = remoteSeats; // [{seatIndex, id}, ...]
    var self = this;
    TCG.NET_MUTATING_METHODS.forEach(function(name) {
        var original = self._game[name].bind(self._game);
        self._game[name] = function() {
            var result = original.apply(null, arguments);
            self.broadcastTagDuelSnapshot();
            return result;
        };
    });
    hub.onRelayedMessage = function(fromId, msg) { self.onTagDuelHostMessage(fromId, msg); };
    // Verbindungsabbruch-Erkennung: haengt sich an das bestehende
    // session.onClose (Lobby-Roster-Bereinigung) dran, ohne es zu ersetzen.
    remoteSeats.forEach(function(r) {
        var entry = hub.sessions.filter(function(e) { return e.profile && e.profile.id === r.id; })[0];
        if (!entry) return;
        var original = entry.session.onClose;
        entry.session.onClose = function(reason) {
            if (original) original(reason);
            self.startTagDuelReconnectGracePeriod(r.seatIndex, r.id);
        };
    });
};

// HOST: statt sofort zu beenden, wird eine Kulanzzeit abgewartet (siehe
// TCG.param.reconnectGraceMs) - alle ANDEREN entfernten Mitspieler bekommen
// eine Wartemeldung statt eines sofortigen "Duell verloren".
Scene_TCGTagDuel.prototype.startTagDuelReconnectGracePeriod = function(seatIndex, disconnectedId) {
    var teamIndex = this._game.seatInfo(seatIndex).teamIndex;
    var self = this;
    this._netRemoteSeats.forEach(function(other) {
        if (other.id !== disconnectedId) self._netHub.sendTo(other.id, { type: 'tagDuelWaitingReconnect', teamIndex: teamIndex });
    });
    var myTeamIndex = this._game.seatInfo(this._netMySeat).teamIndex;
    if (myTeamIndex !== teamIndex) {
        // Betrifft nicht mein eigenes Team - ich (Host) bleibe voll
        // interaktiv, nur die anderen entfernten Mitspieler warten.
    } else if (this._state !== 'result') {
        this._cmdWindow.hide();
        this._cmdWindow.deactivate();
        var seconds = Math.round((TCG.param.reconnectGraceMs || 90000) / 1000);
        this.showBanner('Teamkollege hat die Verbindung verloren - warte auf Wiederverbindung (' + seconds + 's)...', 999999, null);
        this._bannerFrames = 999999;
    }
    this._netHub.markPendingReconnect(disconnectedId, null, TCG.param.reconnectGraceMs, function() {
        self.onTagDuelNetworkDisconnect(teamIndex); // Kulanzzeit abgelaufen - jetzt wirklich beenden
        self._netRemoteSeats.forEach(function(other) {
            if (other.id !== disconnectedId) self._netHub.sendTo(other.id, { type: 'tagDuelDisconnect', teamIndex: teamIndex });
        });
    }, function(remoteProfile) {
        self.onTagDuelSeatReconnected(seatIndex, remoteProfile);
    });
};

// HOST: der entfernte Mitspieler ist rechtzeitig mit derselben Profil-ID
// zurueckgekehrt - Duell laeuft weiter, alle Beteiligten werden aktualisiert.
Scene_TCGTagDuel.prototype.onTagDuelSeatReconnected = function(seatIndex, remoteProfile) {
    var teamIndex = this._game.seatInfo(seatIndex).teamIndex;
    var myTeamIndex = this._game.seatInfo(this._netMySeat).teamIndex;
    if (myTeamIndex === teamIndex && this._state !== 'result') {
        this._state = this._game.activeSeatIndex() === this._netMySeat ? 'turnStart' : 'remoteTurn';
        if (this._state === 'turnStart') { this._cmdWindow.show(); this._cmdWindow.activate(); }
        this.refreshAll();
    }
    this.showToast('Mitspieler ist zurueckgekehrt - Duell wird fortgesetzt');
    var self = this;
    this._netRemoteSeats.forEach(function(other) {
        if (other.id !== remoteProfile.id) self._netHub.sendTo(other.id, { type: 'tagDuelReconnected', teamIndex: teamIndex });
    });
    // Wieder aktiv verdrahten (die alte Session-Referenz ist mit der neuen
    // Verbindung bereits identisch geroutet, siehe TCG.Net.Hub - der Host
    // muss nur den frischen Zustand schicken).
    this.broadcastTagDuelSnapshot();
};

Scene_TCGTagDuel.prototype.onTagDuelHostMessage = function(fromId, msg) {
    if (!msg || msg.type !== 'gameAction') return;
    var self = this;
    (msg.log || []).forEach(function(step) {
        if (TCG.NET_MUTATING_METHODS.indexOf(step.method) < 0) return;
        self._game[step.method].apply(self._game, step.args); // laeuft durch den Broadcast-Wrapper
    });
    this.refreshAll();
    if (this._game.isOver()) this.startResult();
};

// Verschickt den aktuellen Spielstand an alle entfernten Mitspieler - inkl.
// Team-/Sitzplatznamen/-Portraets/KI-Liste bei JEDER Nachricht (nicht nur der
// ersten): so kann die ERSTE ankommende Nachricht beim Empfaenger direkt die
// komplette Szene aufbauen (siehe Scene_TCGKampfzone.onClientMessage,
// "tagDuelState"), waehrend spaetere Nachrichten einfach nur den Zustand
// aktualisieren (siehe onTagDuelGuestMessage) - keine zwei verschiedenen
// Nachrichtentypen noetig.
Scene_TCGTagDuel.prototype.broadcastTagDuelSnapshot = function() {
    if (!this._netRemoteSeats) return;
    var snap = this._game.snapshot();
    var hub = this._netHub;
    var self = this;
    var teamNames = [this._game._teams[0].name, this._game._teams[1].name];
    var seatNames = [0, 1, 2, 3].map(function(i) { return self._game.seatInfo(i).name; });
    var seatPortraits = [0, 1, 2, 3].map(function(i) { return self._game.seatInfo(i).portrait; });
    this._netRemoteSeats.forEach(function(r) {
        hub.sendTo(r.id, {
            type: 'tagDuelState', snapshot: snap, mySeatIndex: r.seatIndex,
            teamNames: teamNames, seatNames: seatNames, seatPortraits: seatPortraits, aiSeats: self._aiSeats
        });
    });
};

// TEILNEHMER (nicht Host): verdrahtet die eigene, lokale Spiegel-Instanz -
// zeichnet nur Aktionen fuer den EIGENEN Sitzplatz auf (siehe isMySeat) und
// uebernimmt eingehende Snapshots vom Host 1:1 (keine Drehung noetig).
Scene_TCGTagDuel.prototype.setupNetworkTagDuelGuest = function(session, mySeatIndex) {
    this._netRole = 'tagduel-guest';
    this._netIsHost = false;
    this._netSession = session;
    this._netMySeat = mySeatIndex;
    var self = this;
    TCG.NET_MUTATING_METHODS.forEach(function(name) {
        var original = self._game[name].bind(self._game);
        self._game[name] = function() {
            var args = Array.prototype.slice.call(arguments);
            self._netActionLog = self._netActionLog || [];
            self._netActionLog.push({ method: name, args: args });
            return original.apply(null, args);
        };
    });
    session.onGameMessage = function(msg) { self.onTagDuelGuestMessage(msg); };
    session.onClose = function() {
        if (self._netDisconnected || self._state === 'result') return;
        self._netDisconnected = true;
        self._cmdWindow.hide();
        self._cmdWindow.deactivate();
        SoundManager.playMiss();
        self.showToast('Verbindung zum Host verloren - zurueck zur Kampfzone, dort mit neuem Code erneut verbinden.');
        SceneManager.pop();
    };
};

// ZUSCHAUER: rein lesend. Braucht KEINE Aktions-Aufzeichnung (spielt nie
// selbst) - die bestehende isMySeat()/syncTagDuelStateAfterSnapshot()-Logik
// behandelt _netMySeat=-1 bereits automatisch korrekt als "nie mein
// Sitzplatz", ohne Sonderfall.
Scene_TCGTagDuel.prototype.setupNetworkTagDuelSpectator = function(session) {
    this._netRole = 'tagduel-spectator';
    this._netIsHost = false;
    this._netSession = session;
    this._netMySeat = -1;
    var self = this;
    session.onGameMessage = function(msg) { self.onTagDuelGuestMessage(msg); };
    session.onClose = function() {
        self.showToast('Verbindung zum Duell verloren.');
        SceneManager.pop();
    };
};

Scene_TCGTagDuel.prototype.onTagDuelGuestMessage = function(msg) {
    if (!msg) return;
    if (msg.type === 'tagDuelDisconnect') {
        this.onTagDuelNetworkDisconnect(msg.teamIndex);
        return;
    }
    if (msg.type === 'tagDuelWaitingReconnect') {
        if (this._state === 'result' || this._netDisconnected) return;
        var loserTeam = this._game._teams[msg.teamIndex].name;
        this._cmdWindow.hide();
        this._cmdWindow.deactivate();
        var seconds = Math.round((TCG.param.reconnectGraceMs || 90000) / 1000);
        this.showBanner(loserTeam + ' hat die Verbindung verloren - warte auf Wiederverbindung (' + seconds + 's)...', 999999, null);
        this._bannerFrames = 999999;
        return;
    }
    if (msg.type === 'tagDuelReconnected') {
        this.showToast('Mitspieler ist zurueckgekehrt - Duell wird fortgesetzt');
        return;
    }
    if (msg.type !== 'tagDuelState') return;
    this._game.applySnapshot(msg.snapshot);
    this.refreshAll();
    this.refreshPortraits();
    this.syncTagDuelStateAfterSnapshot();
    if (this._game.isOver()) this.startResult();
};

// Nach jedem empfangenen Snapshot: passenden Szenen-Zustand herstellen -
// interaktiv, falls jetzt der eigene Sitzplatz aktiv ist, sonst warten.
Scene_TCGTagDuel.prototype.syncTagDuelStateAfterSnapshot = function() {
    var seatIndex = this._game.activeSeatIndex();
    if (this.isMySeat(seatIndex)) {
        this._state = 'turnStart';
        this._cmdWindow.setup([
            { name: 'Ziehen',   symbol: 'ziehen' },
            { name: 'Aufgeben', symbol: 'aufgeben' }
        ]);
        this._cmdWindow.show();
        this._cmdWindow.activate();
    } else {
        this._state = 'remoteTurn';
        this._cmdWindow.hide();
        this._cmdWindow.deactivate();
    }
};

// TEILNEHMER: schickt die aufgezeichneten eigenen Aktionen zum Host.
Scene_TCGTagDuel.prototype.flushTagDuelActionLog = function() {
    if (!this._netActionLog || this._netActionLog.length === 0) return;
    this._netSession.send({ type: 'gameAction', log: this._netActionLog });
    this._netActionLog = [];
};

// Tag-Duelle: das Portraet zeigt IMMER den gerade aktiven Sitzplatz des
// jeweiligen Teams (kann sich zwischen Zuegen aendern, da ein Team aus 2
// Sitzplaetzen besteht - siehe beginTurn). Sitzplatz 0 (der Spieler) nutzt
// automatisch TCG.profile().actorData (Character Creator) - alle anderen
// Sitzplaetze nutzen ihr im Konstruktor hinterlegtes Portraet (siehe
// Game_TCGTagDuel: seatPortraits).
Scene_TCGTagDuel.prototype.refreshPortraits = function() {
    if (!this._portraitSprites) return;
    var layout = TCG.Battle.layout();
    for (var team = 0; team < 2; team++) {
        var seatIdx = this._game.activeSeatOfTeam(team);
        var seat = this._game.seatInfo(seatIdx);
        var source = (seatIdx === 0) ?
            TCG.resolvePortraitSource(TCG.profile().actorData, null) :
            TCG.resolvePortraitSource(null, seat.portrait);
        this._portraitSprites[team].setSource(source, seatIdx === 0 ? TCG.param.ccActorId : null);
    }
    this._portraitSprites[1].x = layout.fieldX + 8;
    this._portraitSprites[1].y = 6;
    this._portraitSprites[0].x = layout.fieldX + 8;
    this._portraitSprites[0].y = layout.playerHudY - 2;
};

// "side" ist hier ein TEAM-Index (0/1) - wird von geerbtem Code aus
// Scene_TCGBattle aufgerufen (z.B. processEffectQueue, um zu pruefen, ob ein
// Effekt automatisch statt interaktiv aufgeloest werden soll). Prueft dafuer,
// ob der GERADE AKTIVE Sitzplatz dieses Teams KI-gesteuert ist.
Scene_TCGTagDuel.prototype.isAiSide = function(teamIndex) {
    return this.isAiSeat(this._game.activeSeatOfTeam(teamIndex));
};

// seatIndex statt playerIndex/side: welcher der 4 Sitzplaetze jetzt beginnt.
Scene_TCGTagDuel.prototype.beginTurn = function(seatIndex) {
    this._game.startTurn(seatIndex); // wird beim Netzwerk-Teilnehmer automatisch mitprotokolliert
    if (this._netRole === 'tagduel-guest') { this.flushTagDuelActionLog(); this._state = 'remoteTurn'; this._cmdWindow.hide(); this._cmdWindow.deactivate(); return; }
    this._timerFrames = TCG.param.timerSeconds * 60;
    this._pendingSummon = null;
    this.refreshAll();
    this.refreshPortraits();
    var seat = this._game.seatInfo(seatIndex);
    var teamName = this._game._teams[seat.teamIndex].name;
    var self = this;
    var bannerText = 'Zug ' + this._game.turnCount() + ' \u2013 ' + teamName + ' (' + seat.name + ')';
    this.logEvent(bannerText, true);
    this.showBanner(bannerText, 80, function() {
        if (self.isAiSeat(seatIndex)) {
            self._state = 'aiTurn';
            self._aiWait = 40;
            self._aiDrew = false;
        } else if (self._netRole === 'tagduel-host' && !self.isMySeat(seatIndex)) {
            // Entfernter Mitspieler ist dran - der Host wartet nur (Event-
            // getrieben ueber onTagDuelHostMessage), keine eigene Eingabe.
            self._state = 'remoteTurn';
            self._cmdWindow.hide();
            self._cmdWindow.deactivate();
        } else {
            self._state = 'turnStart';
            self._cmdWindow.setup([
                { name: 'Ziehen',   symbol: 'ziehen' },
                { name: 'Aufgeben', symbol: 'aufgeben' }
            ]);
            self._cmdWindow.show();
            self._cmdWindow.activate();
        }
    });
};

// Rotiert zum NAECHSTEN SITZPLATZ (nicht einfach dem "Gegner" wie im 1v1) -
// sowohl nach einem menschlichen als auch nach einem KI-gesteuerten Zug.
// Naechster Sitzplatz in der Zugreihenfolge (statt einfacher Gegenseite wie
// beim 1v1 - siehe Scene_TCGBattle.nextTurnTarget).
Scene_TCGTagDuel.prototype.nextTurnTarget = function() {
    return this._game.nextSeatIndex();
};

Scene_TCGTagDuel.prototype.onEndTurn = function() {
    this._cmdWindow.hide();
    this._cmdWindow.deactivate();
    var self = this;
    this.queueEffects(this._game.turnTriggers('beimZugende'), function() {
        self.checkHandSizeThenAdvance();
    });
};

Scene_TCGTagDuel.prototype.afterOpponentTurnEnds = function() {
    this.beginTurn(this._game.nextSeatIndex());
};

Game_TCGTagDuel.prototype.maxAttacksPerTurn = function(side, zone) {
    var slot = this.player(side).zones[zone];
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
Game_TCGTagDuel.prototype.blocksDestruction = function(side, zone, viaSpell) {
    var slot = this.player(side).zones[zone];
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

Game_TCGTagDuel.prototype.enemyHasMonsters = function() {
    return this.ownMonsterCount(this.enemyIndex(this.activeTeamIndex())) > 0;
};

// Angriff. defZone = -1 -> Direktangriff. Rueckgabe {text, triggers}
Game_TCGTagDuel.prototype.attack = function(atkZone, defZone) {
    var atkSide = this.activeTeamIndex();
    var defSide = this.enemyIndex(atkSide);
    var attacker = this.slot(atkSide, atkZone);
    if (!attacker) return { text: '', triggers: [] };
    this.player(atkSide).ap -= TCG.param.attackCost;
    attacker.attacked = (attacker.attacked || 0) + 1;
    var atkCard = TCG.card(attacker.id);
    var triggers = this.slotEffects(atkSide, atkZone, 'beimAngriff');

    if (defZone < 0) {
        var dmg = this.effAtk(atkSide, atkZone);
        this.player(defSide).lp = Math.max(0, this.player(defSide).lp - dmg);
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
                this.player(defSide).lp = Math.max(0, this.player(defSide).lp - overflow);
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

Game_TCGTagDuel.prototype.checkWin = function() {
    if (this._winner >= 0) return;
    if (this.player(0).lp <= 0) this._winner = 1;
    else if (this.player(1).lp <= 0) this._winner = 0;
};

})();
