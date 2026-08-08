//=============================================================================
// TCG_Network.js  (v1.0)
//-----------------------------------------------------------------------------
// Peer-to-Peer-Verbindungsschicht fuer Multiplayer (2 Spieler) ueber WebRTC.
// Reine Signalisierung per Copy-Paste-Code (kein eigener Server): der Host
// erzeugt einen Verbindungscode, schickt ihn dem Gast (z.B. per Discord/Chat),
// der Gast erzeugt daraus einen Antwort-Code und schickt ihn zurueck. Danach
// laeuft die Verbindung direkt (echtes P2P) zwischen beiden Rechnern - kein
// Server sieht danach noch Spieldaten.
//
// Nutzt einen oeffentlichen, kostenlosen STUN-Server (nur fuer die NAT-
// Traversal-Aushandlung, sieht ebenfalls keine Spieldaten) - keinen TURN-
// Relay-Server. Das heisst: bei den allermeisten Heim-Internetverbindungen
// funktioniert die direkte Verbindung, bei sehr restriktiven Netzwerken
// (manche Firmen-WLANs/Mobilfunk-Router mit "symmetrischem NAT") kann der
// Verbindungsaufbau fehlschlagen. Das ist eine bewusste Entscheidung fuer
// Phase 1 (siehe Projektbesprechung) - ein TURN-Relay laesst sich spaeter
// ergaenzen, ohne dieses Modul grundlegend umzubauen.
//
// Muss NACH TCG_Core.js geladen werden. Von TCG_Battle.js (Lobby/Kampf-
// Integration) unabhaengig ladbar und einzeln testbar.
//=============================================================================
/*:
 * @plugindesc v1.0 P2P-Netzwerkschicht (WebRTC, serverlose Signalisierung per Copy-Paste-Code) fuer 2-Spieler-Multiplayer.
 * @author Donatello Media
 *
 * @help
 * ============================================================================
 * TCG_Network.js v1.0 - WebRTC-Verbindungsschicht
 * ============================================================================
 * Stellt TCG.Net.Peer bereit: eine kleine Klasse, die eine direkte Peer-to-
 * Peer-Verbindung zwischen zwei Spielern aufbaut und danach JSON-Nachrichten
 * in beide Richtungen verschicken kann.
 *
 * ABLAUF (Host):
 *   var peer = new TCG.Net.Peer();
 *   peer.onOpen = function() { ... Verbindung steht ... };
 *   peer.onMessage = function(msg) { ... Nachricht vom Gast ... };
 *   peer.createHostCode().then(function(code) {
 *       // "code" dem Gast zeigen/kopierbar machen (z.B. per Discord schicken)
 *   });
 *   // Sobald der Gast seinen Antwort-Code zurückschickt:
 *   peer.acceptAnswerCode(antwortCode);
 *
 * ABLAUF (Gast):
 *   var peer = new TCG.Net.Peer();
 *   peer.onOpen = function() { ... Verbindung steht ... };
 *   peer.onMessage = function(msg) { ... Nachricht vom Host ... };
 *   peer.createJoinCode(hostCode).then(function(antwortCode) {
 *       // "antwortCode" dem Host zurueckschicken
 *   });
 *
 * Danach auf beiden Seiten: peer.send({ ...beliebiges JSON... });
 *
 * FUER MEHRERE SPIELER (Kampfzone, bis zu ~4 Spieler): TCG.Net.Hub statt
 * einzelner Peer/Session auf der Host-Seite. Verwaltet mehrere Verbindungen
 * im Stern-Modell (jeder Gast nur mit dem Host verbunden), verteilt die
 * gemeinsame Spielerliste automatisch, und leitet Nachrichten mit "toId"
 * gezielt zwischen Gaesten weiter (die Gaeste sind ja nicht direkt
 * miteinander verbunden). Jeder zusaetzliche Gast braucht einen EIGENEN,
 * frischen Einladungscode (WebRTC-Verbindungen sind immer 1-zu-1):
 *
 *   var hub = new TCG.Net.Hub(TCG.profile());
 *   hub.onRosterChanged = function(spieler) { ... aktuelle Liste ... };
 *   hub.inviteCode().then(function(invite) {
 *       // invite.code der naechsten einzuladenden Person schicken
 *       // sobald deren Antwort-Code zurueckkommt: invite.accept(antwortCode)
 *   });
 *
 * Gast-Seite bleibt normales TCG.Net.Session (siehe oben) - verbindet sich
 * einfach mit dem jeweils erhaltenen Code des Hosts.
 *
 * Kein Plugin-Befehl noetig - dieses Modul ist reine Infrastruktur fuer die
 * Lobby/Kampf-Integration (siehe TCG_Battle.js).
 */

var TCG = TCG || {};
TCG.Net = TCG.Net || {};

(function() {
'use strict';

// Oeffentlicher, kostenloser STUN-Server (nur NAT-Traversal-Aushandlung,
// sieht keine Spieldaten). Kein TURN-Relay in dieser Phase - siehe Header.
var ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

// Wie lange maximal auf den Abschluss der ICE-Kandidatensuche gewartet wird,
// bevor der Verbindungscode trotzdem erzeugt wird (Sicherheitsnetz - manche
// Netzwerke melden "complete" nie zuverlaessig). In Millisekunden.
var ICE_GATHER_TIMEOUT_MS = 8000;

function base64Encode(text) {
    if (typeof btoa === 'function') return btoa(text);
    return Buffer.from(text, 'utf8').toString('base64');
}

function base64Decode(text) {
    if (typeof atob === 'function') return atob(text);
    return Buffer.from(text, 'base64').toString('utf8');
}

// Verpackt eine RTCSessionDescription (Offer/Answer) in einen kurzen,
// kopierbaren Text-Code.
TCG.Net.encodeCode = function(description) {
    var json = JSON.stringify({ type: description.type, sdp: description.sdp });
    return base64Encode(json);
};

TCG.Net.decodeCode = function(code) {
    var json = base64Decode(String(code || '').trim());
    return JSON.parse(json);
};

// Eine einzelne Peer-to-Peer-Verbindung. "role" ist 'host' oder 'client',
// je nachdem welche der beiden Erzeugungsmethoden aufgerufen wurde.
TCG.Net.Peer = function() {
    this.pc = null;
    this.channel = null;
    this.role = null;
    this.onOpen = null;      // function() - Datenkanal steht, Nachrichten koennen fliessen
    this.onMessage = null;   // function(obj) - eingehende Nachricht (bereits geparst)
    this.onClose = null;     // function(reason) - Verbindung getrennt/fehlgeschlagen
};

TCG.Net.Peer.prototype._createConnection = function() {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    var self = this;
    this.pc.onconnectionstatechange = function() {
        if (!self.pc) return; // close() kann bereits gelaufen sein, wenn dieses Event noch nachkommt
        var state = self.pc.connectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            if (self.onClose) self.onClose(state);
        }
    };
};

// Wartet, bis die ICE-Kandidatensuche abgeschlossen ist (oder das Timeout
// erreicht wurde) - fuer die manuelle Copy-Paste-Signalisierung muss der
// GESAMTE Kandidatensatz im Code stecken, da es keinen laufenden Signal-
// Kanal zum Nachliefern einzelner Kandidaten gibt.
TCG.Net.Peer.prototype._waitIceComplete = function() {
    var pc = this.pc;
    return new Promise(function(resolve) {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        var done = false;
        var finish = function() {
            if (done) return;
            done = true;
            pc.removeEventListener('icegatheringstatechange', onChange);
            resolve();
        };
        function onChange() {
            if (pc.iceGatheringState === 'complete') finish();
        }
        pc.addEventListener('icegatheringstatechange', onChange);
        setTimeout(finish, ICE_GATHER_TIMEOUT_MS);
    });
};

TCG.Net.Peer.prototype._setupChannel = function(channel) {
    var self = this;
    this.channel = channel;
    channel.onopen = function() { if (self.onOpen) self.onOpen(); };
    channel.onclose = function() { if (self.onClose) self.onClose('closed'); };
    channel.onerror = function(e) { if (self.onClose) self.onClose('error'); };
    channel.onmessage = function(e) {
        if (!self.onMessage) return;
        try { self.onMessage(JSON.parse(e.data)); }
        catch (err) { console.error('TCG.Net: ungueltige Nachricht empfangen: ' + err.message); }
    };
};

// HOST: erzeugt die Verbindung + den Datenkanal, liefert den Verbindungscode
// (als Promise), den man dem Gast zuschicken kann.
TCG.Net.Peer.prototype.createHostCode = function() {
    this.role = 'host';
    this._createConnection();
    var self = this;
    this._setupChannel(this.pc.createDataChannel('tcg'));
    console.log('[TCG.Net] createHostCode: Angebot wird erstellt...');
    return this.pc.createOffer()
        .then(function(offer) {
            console.log('[TCG.Net] Angebot erstellt, setze lokale Beschreibung...');
            return self.pc.setLocalDescription(offer);
        })
        .then(function() {
            console.log('[TCG.Net] Lokale Beschreibung gesetzt, warte auf ICE-Kandidaten (iceGatheringState=' + self.pc.iceGatheringState + ')...');
            return self._waitIceComplete();
        })
        .then(function() {
            console.log('[TCG.Net] ICE-Sammlung abgeschlossen (iceGatheringState=' + self.pc.iceGatheringState + '), kodiere Code...');
            return TCG.Net.encodeCode(self.pc.localDescription);
        });
};

// HOST: nimmt den Antwort-Code des Gasts entgegen und schliesst den
// Verbindungsaufbau ab. Rueckgabe: Promise, das erfuellt wird, sobald die
// Antwort verarbeitet ist (die Verbindung selbst steht dann kurz darauf -
// siehe onOpen).
TCG.Net.Peer.prototype.acceptAnswerCode = function(code) {
    var answer = TCG.Net.decodeCode(code);
    return this.pc.setRemoteDescription(answer);
};

// GAST: nimmt den Host-Code entgegen, liefert den eigenen Antwort-Code
// (als Promise), den man dem Host zurueckschickt.
TCG.Net.Peer.prototype.createJoinCode = function(hostCode) {
    this.role = 'client';
    this._createConnection();
    var self = this;
    this.pc.ondatachannel = function(e) { self._setupChannel(e.channel); };
    var offer = TCG.Net.decodeCode(hostCode);
    console.log('[TCG.Net] createJoinCode: setze entfernte Beschreibung...');
    return this.pc.setRemoteDescription(offer)
        .then(function() {
            console.log('[TCG.Net] Entfernte Beschreibung gesetzt, erstelle Antwort...');
            return self.pc.createAnswer();
        })
        .then(function(answer) {
            console.log('[TCG.Net] Antwort erstellt, setze lokale Beschreibung...');
            return self.pc.setLocalDescription(answer);
        })
        .then(function() {
            console.log('[TCG.Net] Lokale Beschreibung gesetzt, warte auf ICE-Kandidaten (iceGatheringState=' + self.pc.iceGatheringState + ')...');
            return self._waitIceComplete();
        })
        .then(function() {
            console.log('[TCG.Net] ICE-Sammlung abgeschlossen, kodiere Code...');
            return TCG.Net.encodeCode(self.pc.localDescription);
        });
};

// Verschickt ein beliebiges JSON-serialisierbares Objekt an den anderen
// Spieler. Tut nichts (kein Fehler), wenn der Kanal noch nicht offen ist.
TCG.Net.Peer.prototype.send = function(obj) {
    if (this.channel && this.channel.readyState === 'open') {
        this.channel.send(JSON.stringify(obj));
    }
};

TCG.Net.Peer.prototype.isOpen = function() {
    return !!this.channel && this.channel.readyState === 'open';
};

TCG.Net.Peer.prototype.close = function() {
    if (this.channel) { try { this.channel.close(); } catch (e) {} }
    if (this.pc) { try { this.pc.close(); } catch (e) {} }
    this.channel = null;
    this.pc = null;
};

// Erzeugt eine rein lokale, zufaellige Kennung (v4-aehnlich, nicht
// kryptographisch, dafuer ohne Abhaengigkeiten) - der "Account" ist bewusst
// nichts weiter als das: einmalig pro Speicherdatei erzeugt, nie registriert,
// nie an einen Server geschickt. Dient nur dazu, dass zwei verbundene Spieler
// sich als unterschiedliche Charaktere erkennen.
TCG.Net.generateId = function() {
    function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

// "actorData" ist bewusst ein leeres, freies Feld: sobald das Actor-
// Customizing-Plugin bekannt ist, werden dessen Daten hier einfach mit
// hineingelegt, ohne dass sich am restlichen Profil-System etwas aendern muss.
TCG.Net.createProfile = function() {
    return { id: TCG.Net.generateId(), name: 'Spieler', actorData: {} };
};

// Sitzungs-Wrapper um einen TCG.Net.Peer: tauscht automatisch die beiden
// lokalen Profile aus, sobald die Verbindung steht, und ruft erst dann
// onReady auf (mit dem Profil des jeweils ANDEREN Spielers) - darunter reine
// Netzwerk-Mechanik (siehe TCG.Net.Peer), darueber beginnt erst das eigentliche
// Spiel (Herausfordern, Duell starten, ...).
TCG.Net.Session = function(localProfile) {
    this.peer = new TCG.Net.Peer();
    this.localProfile = localProfile;
    this.remoteProfile = null;
    this.onReady = null;     // function(remoteProfile)
    this.onGameMessage = null; // function(msg) - alles ausser dem Profil-Handshake
    this.onClose = null;

    var self = this;
    this.peer.onOpen = function() {
        self.peer.send({ type: 'profile', payload: self.localProfile });
    };
    this.peer.onMessage = function(msg) {
        if (msg && msg.type === 'profile') {
            self.remoteProfile = msg.payload;
            if (self.onReady) self.onReady(self.remoteProfile);
            return;
        }
        if (self.onGameMessage) self.onGameMessage(msg);
    };
    this.peer.onClose = function(reason) { if (self.onClose) self.onClose(reason); };
};

TCG.Net.Session.prototype.createHostCode = function() { return this.peer.createHostCode(); };
TCG.Net.Session.prototype.createJoinCode = function(hostCode) { return this.peer.createJoinCode(hostCode); };
TCG.Net.Session.prototype.acceptAnswerCode = function(code) { return this.peer.acceptAnswerCode(code); };
TCG.Net.Session.prototype.send = function(obj) { this.peer.send(obj); };
TCG.Net.Session.prototype.isReady = function() { return this.peer.isOpen() && !!this.remoteProfile; };
TCG.Net.Session.prototype.close = function() { this.peer.close(); };

// Verwaltet mehrere TCG.Net.Session-Verbindungen auf der Host-Seite (Stern-
// Modell: jeder Gast ist nur mit dem Host verbunden, nicht direkt mit den
// anderen Gaesten). Haelt die gemeinsame Spielerliste (Roster) aktuell und
// leitet gezielte Nachrichten (z.B. eine Herausforderung von Gast A an
// Gast C) ueber sich selbst weiter, da Gaeste keine direkte Verbindung
// zueinander haben.
TCG.Net.Hub = function(hostProfile, maxPlayers) {
    this.hostProfile = hostProfile;
    this.maxPlayers = maxPlayers || 4;
    this.hostTeam = null;
    this.hostStatus = 'idle';
    this.sessions = []; // { session: TCG.Net.Session, profile: {...}, team, status }
    this.onRosterChanged = null; // function(roster) - roster = [{id,name,actorData,team,status,isHost}, ...] inkl. Host
    this.onRelayedMessage = null; // function(fromId, msg) - Nachricht eines Gasts, die nicht geroutet wurde
    this._pendingReconnects = {}; // profileId -> {resumeInfo, timer, onReconnect}
};

// Markiert einen Spieler (per Profil-ID) als "darf innerhalb von graceMs
// wieder beitreten und wird dann NICHT als normaler neuer Lobby-Gast
// behandelt, sondern ueber onReconnect(remoteProfile, session, resumeInfo)
// gemeldet". Wird bei einem Verbindungsabbruch WAEHREND eines laufenden
// Duells aufgerufen. Laeuft die Kulanzzeit ab, ohne dass die Person
// wiederkommt, wird onExpire() aufgerufen. Der Wiederverbindungs-Callback
// haengt an DIESEM EINEN Eintrag (nicht global am Hub) - so koennen mehrere
// gleichzeitig laufende Duelle unter demselben Host unabhaengig voneinander
// auf Wiederverbindungen warten, ohne sich gegenseitig zu ueberschreiben.
TCG.Net.Hub.prototype.markPendingReconnect = function(profileId, resumeInfo, graceMs, onExpire, onReconnect) {
    this.cancelPendingReconnect(profileId);
    var self = this;
    var timer = setTimeout(function() {
        delete self._pendingReconnects[profileId];
        if (onExpire) onExpire();
    }, graceMs || 90000);
    this._pendingReconnects[profileId] = { resumeInfo: resumeInfo, timer: timer, onReconnect: onReconnect };
};

TCG.Net.Hub.prototype.cancelPendingReconnect = function(profileId) {
    var entry = this._pendingReconnects[profileId];
    if (entry) { clearTimeout(entry.timer); delete this._pendingReconnects[profileId]; }
};

TCG.Net.Hub.prototype.hasPendingReconnect = function(profileId) {
    return !!this._pendingReconnects[profileId];
};

// true, sobald bereits (maxPlayers - 1) Gaeste verbunden sind (der Host
// selbst zaehlt als der verbleibende Platz).
TCG.Net.Hub.prototype.isFull = function() {
    return this.sessions.length >= (this.maxPlayers - 1);
};

// Erzeugt einen frischen Einladungscode fuer GENAU EINEN neuen Gast (siehe
// Modul-Kommentar oben: eine WebRTC-Verbindung ist immer 1-zu-1, daher pro
// Gast ein eigener Code - alle landen trotzdem im selben Stern-Hub). Liefert
// {code, accept}: "code" an die eingeladene Person schicken, "accept(...)"
// mit deren Antwort-Code aufrufen, sobald sie zurueckkommt.
// Genereller Zeitlimit-Helfer: laesst eine Promise NIE unbegrenzt haengen.
// Kann die zugrundeliegende Operation (z.B. eine native WebRTC-Promise, die
// aus irgendeinem Grund nie feststellt) nicht wirklich abbrechen, sorgt aber
// dafuer, dass die BEDIENOBERFLAeCHE nach spaetestens ms Millisekunden mit
// einer klaren Fehlermeldung weitermacht, statt fuer immer zu haengen.
TCG.Net.withTimeout = function(promise, ms, message) {
    return new Promise(function(resolve, reject) {
        var settled = false;
        var timer = setTimeout(function() {
            if (settled) return;
            settled = true;
            reject(new Error(message || ('Zeitlimit ueberschritten (' + ms + 'ms)')));
        }, ms);
        promise.then(function(v) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(v);
        }, function(err) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(err);
        });
    });
};

TCG.Net.Hub.prototype.inviteCode = function() {
    if (this.isFull()) return Promise.reject(new Error('Lobby ist bereits voll (' + this.maxPlayers + ' Spieler).'));
    var self = this;
    var session = new TCG.Net.Session(this.hostProfile);
    var entry = { session: session, profile: null };
    session.onReady = function(remoteProfile) {
        entry.profile = remoteProfile;
        // Wiedererkennung: kehrt hier jemand zurueck, der waehrend eines
        // laufenden Duells die Verbindung verloren hat? Dann NICHT als
        // normalen Lobby-Beitritt behandeln, sondern gezielt melden.
        var pending = self._pendingReconnects[remoteProfile.id];
        if (pending) {
            self.cancelPendingReconnect(remoteProfile.id);
            if (pending.onReconnect) pending.onReconnect(remoteProfile, session, pending.resumeInfo);
            return;
        }
        self._broadcastRoster();
    };
    session.onGameMessage = function(msg) { self._handleGuestMessage(entry, msg); };
    session.onClose = function() {
        var idx = self.sessions.indexOf(entry);
        if (idx >= 0) self.sessions.splice(idx, 1);
        self._broadcastRoster();
    };
    this.sessions.push(entry);
    return TCG.Net.withTimeout(session.createHostCode(), 15000,
        'Verbindungsaufbau (WebRTC) hat zu lange gedauert - Netzwerk-/Firewall-Problem? Bitte erneut versuchen.'
    ).then(function(code) {
        return { code: code, accept: function(answerCode) { return session.acceptAnswerCode(answerCode); } };
    });
};

TCG.Net.Hub.prototype.roster = function() {
    var list = [{
        id: this.hostProfile.id, name: this.hostProfile.name, actorData: this.hostProfile.actorData,
        team: this.hostTeam, status: this.hostStatus, ready: !!this.hostReady, isHost: true
    }];
    this.sessions.forEach(function(e) {
        if (!e.profile) return;
        list.push({
            id: e.profile.id, name: e.profile.name, actorData: e.profile.actorData,
            team: e.team || null, status: e.status || 'idle', ready: !!e.ready, isHost: false
        });
    });
    return list;
};

// Team-/Status-/Bereit-Zuweisung (fuer die Lobby-Oberflaeche - Tag-Duell-
// Teams, "im Duell"-Status, Tag-Duell-Bereitschaft etc.). Loest jeweils eine
// Roster-Aktualisierung an alle Gaeste aus.
TCG.Net.Hub.prototype.setHostTeam = function(team) { this.hostTeam = team; this.hostReady = false; this._broadcastRoster(); };
TCG.Net.Hub.prototype.setHostStatus = function(status) { this.hostStatus = status; this._broadcastRoster(); };
TCG.Net.Hub.prototype.setHostReady = function(ready) { this.hostReady = ready; this._broadcastRoster(); };

TCG.Net.Hub.prototype._findSessionByProfileId = function(id) {
    return this.sessions.filter(function(e) { return e.profile && e.profile.id === id; })[0] || null;
};

TCG.Net.Hub.prototype.setGuestTeam = function(id, team) {
    var e = this._findSessionByProfileId(id);
    if (e) { e.team = team; e.ready = false; this._broadcastRoster(); }
};

TCG.Net.Hub.prototype.setGuestStatus = function(id, status) {
    var e = this._findSessionByProfileId(id);
    if (e) { e.status = status; this._broadcastRoster(); }
};

TCG.Net.Hub.prototype.setGuestReady = function(id, ready) {
    var e = this._findSessionByProfileId(id);
    if (e) { e.ready = ready; this._broadcastRoster(); }
};

TCG.Net.Hub.prototype._broadcastRoster = function() {
    var roster = this.roster();
    this.sessions.forEach(function(e) { e.session.send({ type: 'roster', players: roster }); });
    if (this.onRosterChanged) this.onRosterChanged(roster);
};

// Nachrichten mit "toId" werden an genau den gemeinten Gast weitergeleitet
// (oder, falls toId der Host selbst ist, an onRelayedMessage gemeldet).
// Nachrichten ohne toId gehen direkt an onRelayedMessage (z.B. "ich will
// gegen einen NPC spielen" - betrifft nur den Absender selbst).
TCG.Net.Hub.prototype._handleGuestMessage = function(fromEntry, msg) {
    var fromId = fromEntry.profile ? fromEntry.profile.id : null;
    if (msg && msg.toId && msg.toId !== this.hostProfile.id) {
        var target = this.sessions.filter(function(e) { return e.profile && e.profile.id === msg.toId; })[0];
        if (target) {
            var forwarded = {};
            for (var k in msg) { if (msg.hasOwnProperty(k)) forwarded[k] = msg[k]; }
            forwarded.fromId = fromId;
            target.session.send(forwarded);
            return;
        }
    }
    if (this.onRelayedMessage) this.onRelayedMessage(fromId, msg);
};

// Verschickt eine Nachricht an ALLE verbundenen Gaeste (z.B. "Duell beginnt").
TCG.Net.Hub.prototype.broadcast = function(msg) {
    this.sessions.forEach(function(e) { e.session.send(msg); });
};

// Verschickt eine Nachricht an genau einen Gast (per Profil-ID).
TCG.Net.Hub.prototype.sendTo = function(targetId, msg) {
    var target = this.sessions.filter(function(e) { return e.profile && e.profile.id === targetId; })[0];
    if (target) target.session.send(msg);
};

TCG.Net.Hub.prototype.close = function() {
    this.sessions.forEach(function(e) { e.session.close(); });
    this.sessions = [];
};

//-----------------------------------------------------------------------------
// Perspektiven-Tausch fuer Kampf-Zustands-Snapshots (siehe TCG_Battle.js:
// Game_TCGBattle.prototype.snapshot/applySnapshot). Im kanonischen, auf dem
// Host gefuehrten Zustand ist der Host IMMER Seite 0, der Gast IMMER Seite 1.
// Damit der Gast sich trotzdem wie gewohnt unten auf seinem eigenen Bildschirm
// sieht (Seite 0 = "ich"), vertauscht der Gast beim Empfangen jedes Snapshots
// die beiden Seiten - der Rest von Scene_TCGBattle muss dafuer NICHT
// angepasst werden, er sieht immer nur "Seite 0 = ich, Seite 1 = Gegner".
TCG.Net.swapPerspective = function(snapshot) {
    var swapped = JSON.parse(JSON.stringify(snapshot));
    swapped.players = [snapshot.players[1], snapshot.players[0]];
    swapped.active = snapshot.active === -1 ? -1 : (1 - snapshot.active);
    swapped.winner = snapshot.winner === -1 ? -1 : (1 - snapshot.winner);
    return swapped;
};

})();
