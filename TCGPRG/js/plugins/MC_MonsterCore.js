//=============================================================================
// MC_MonsterCore.js
//-----------------------------------------------------------------------------
// Monster-Capture-Framework fuer RPG Maker MV
// Schicht 1: Datenmodell (Spezies-Registry, Monster-Instanzen, Party/Box)
//
// Plattformen: NW.js (Desktop), Browser, Cordova (Mobil)
// -> Kein require(), kein fs, kein ES6-Modulsystem, kein Optional Chaining.
//=============================================================================

/*:
 * @plugindesc [v0.1.0] Datenmodell fuer Monster: Spezies-Registry, Game_Monster,
 * Party/Box-Verwaltung und versionierte Serialisierung.
 * @author Donatello
 *
 * @param speciesFile
 * @text Spezies-Datei
 * @desc Dateiname im Ordner data/
 * @default mc_species.json
 *
 * @param maxLevel
 * @text Maximales Level
 * @type number
 * @min 1
 * @max 999
 * @default 100
 *
 * @param maxParty
 * @text Maximale Party-Groesse
 * @type number
 * @min 1
 * @max 12
 * @default 6
 *
 * @param maxSkills
 * @text Maximale Skills pro Monster
 * @type number
 * @min 1
 * @max 8
 * @default 4
 *
 * @param maxIv
 * @text Maximaler IV-Wert
 * @type number
 * @min 0
 * @max 255
 * @default 31
 *
 * @param evCapPerStat
 * @text EV-Grenze pro Wert
 * @type number
 * @min 0
 * @default 252
 *
 * @param evCapTotal
 * @text EV-Grenze gesamt
 * @type number
 * @min 0
 * @default 510
 *
 * @param persistence
 * @text Persistenz-Modus
 * @type select
 * @option local
 * @option account
 * @desc local = im Spielstand speichern (Singleplayer).
 * account = Serverseitig, Spielstand bleibt unberuehrt.
 * @default local
 *
 * @help
 * ============================================================================
 * Was dieses Plugin macht
 * ============================================================================
 *
 * Es stellt das Datenmodell fuer gefangene Monster bereit. Ausdruecklich NICHT
 * enthalten: Kampfablauf, Fang-Mechanik, UI, Netzwerk. Das sind eigene Plugins,
 * die auf diesem hier aufsetzen.
 *
 * ----------------------------------------------------------------------------
 * Zwei Datenklassen, strikt getrennt
 * ----------------------------------------------------------------------------
 *
 *   Spezies (statisch)  - Basiswerte, Typen, Lernsatz, Fangrate.
 *                         Kommt aus data/mc_species.json, wird nie veraendert
 *                         und nie in den Spielstand oder zum Server geschrieben.
 *
 *   Instanz  (dynamisch) - Game_Monster. Level, IVs, EVs, Wesen, Spitzname,
 *                          aktuelle HP. Das ist das Einzige, was persistiert.
 *
 * ----------------------------------------------------------------------------
 * Wichtigste Regel der Serialisierung
 * ----------------------------------------------------------------------------
 *
 * Es werden nur EINGABEN gespeichert, niemals ABGELEITETE Werte.
 * Gespeichert wird speciesId, Level, IVs, EVs, Wesen. Nicht gespeichert wird
 * mhp, atk, def usw. - die berechnet jede Seite selbst aus den Eingaben neu.
 *
 * Der Grund ist die spaetere PVP-Faehigkeit: der Server traut dem Client keinen
 * einzigen Kampfwert. Er bekommt speciesId + Level + IVs, rechnet mit derselben
 * Formel und vergleicht. Wer im DevTools-Fenster seinen Angriffswert hochsetzt,
 * aendert damit nichts, was uebertragen wird.
 *
 * ----------------------------------------------------------------------------
 * Der Protagonist bleibt ein Game_Actor
 * ----------------------------------------------------------------------------
 *
 * Der Hauptcharakter laeuft weiter ueber MVs normales Actor-System: er bewegt
 * sich auf der Karte, traegt Ausruestung, ist $gameParty.leader().
 * Die Monster leben in einer parallelen Sammlung ($gameMonsters). Beide werden
 * getrennt gespeichert - der Actor im Spielstand, die Monster am Account.
 *
 * ----------------------------------------------------------------------------
 * Typ-Effektivitaet ueber MVs Trait-System
 * ----------------------------------------------------------------------------
 *
 * Die Typen einer Spezies werden beim Laden in TRAIT_ELEMENT_RATE-Traits (Code
 * 11) uebersetzt. MV multipliziert gleichartige Raten (traitsPi), deshalb
 * ergeben zwei Typen automatisch das korrekte Produkt: Feuer 2.0 mal Flug 0.5
 * wird zu 1.0. Es braucht also keinen eigenen Effektivitaets-Code - das
 * Standard-Verhalten von Game_Action.calcElementRate greift bereits.
 *
 * ----------------------------------------------------------------------------
 * Portabilitaet zum Node-Server
 * ----------------------------------------------------------------------------
 *
 * Alles unterhalb von MC.Core (RNG, Formeln, Registry) meidet bewusst MVs
 * Prototype-Erweiterungen wie Number.prototype.clamp, damit derselbe Code
 * spaeter unveraendert im Node-Schiedsrichter laufen kann.
 * Game_Monster selbst haengt an Game_Battler und bleibt clientseitig.
 *
 * ============================================================================
 * Script-Aufrufe
 * ============================================================================
 *
 *   MC.Core.create(speciesId, level)     -> neues Game_Monster (Zufalls-IVs)
 *   $gameMonsters.add(monster)           -> in Party, sonst in Box
 *   $gameMonsters.party()                -> Array der aktiven Monster
 *   $gameMonsters.toBox(uid)             -> Party nach Box
 *   $gameMonsters.toParty(uid)           -> Box nach Party
 *   $gameMonsters.find(uid)              -> Instanz suchen
 *   $gameMonsters.toJSON()               -> serialisierbares Objekt
 *
 * ============================================================================
 */

var MC = MC || {};
MC.Core = MC.Core || {};

var $dataMonsterDB = null;
var $gameMonsters = null;

(function ($) {
    'use strict';

    //=========================================================================
    // Parameter
    //=========================================================================

    var raw = PluginManager.parameters('MC_MonsterCore');

    $.params = {
        speciesFile: String(raw.speciesFile || 'mc_species.json'),
        maxLevel: Number(raw.maxLevel || 100),
        maxParty: Number(raw.maxParty || 6),
        maxSkills: Number(raw.maxSkills || 4),
        maxIv: Number(raw.maxIv || 31),
        evCapPerStat: Number(raw.evCapPerStat || 252),
        evCapTotal: Number(raw.evCapTotal || 510),
        persistence: String(raw.persistence || 'local')
    };

    // MV-Parameter-Indizes: 0 MHP, 1 MMP, 2 ATK, 3 DEF, 4 MAT, 5 MDF, 6 AGI, 7 LUK
    $.PARAM_COUNT = 8;

    //=========================================================================
    // Hilfsfunktionen (bewusst ohne MV-Prototype-Erweiterungen)
    //=========================================================================

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    $.clamp = clamp;

    //=========================================================================
    // Deterministischer RNG (mulberry32)
    //-------------------------------------------------------------------------
    // Wird jetzt schon gebraucht, weil IV-Wuerfe reproduzierbar sein muessen:
    // der Server erzeugt ein Wildmonster aus einem Seed, der Client zeigt
    // dasselbe Monster. Math.random() waere hier nicht nachvollziehbar.
    //=========================================================================

    function RNG(seed) {
        this._s = (seed >>> 0) || 1;
    }

    RNG.prototype.next = function () {
        this._s = (this._s + 0x6D2B79F5) >>> 0;
        var t = this._s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    RNG.prototype.int = function (min, max) {
        return min + Math.floor(this.next() * (max - min + 1));
    };

    RNG.prototype.pick = function (arr) {
        return arr[this.int(0, arr.length - 1)];
    };

    RNG.prototype.state = function () {
        return this._s;
    };

    $.RNG = RNG;

    // Standard-RNG fuer alles, was nicht reproduzierbar sein muss.
    $.defaultRng = function () {
        return new RNG((Math.random() * 0xFFFFFFFF) >>> 0);
    };

    //=========================================================================
    // Wesen (Naturen)
    //-------------------------------------------------------------------------
    // Jedes Wesen hebt einen Wert um 10% und senkt einen anderen um 10%.
    // Index 0 = neutral. Die Tabelle laesst sich in der JSON ueberschreiben.
    //=========================================================================

    $.natures = [
        { id: 0, name: 'Ausgeglichen', up: -1, down: -1 }
    ];

    $.natureMod = function (natureId, paramId) {
        var n = this.natures[natureId];
        if (!n || n.up === n.down) return 1.0;
        if (n.up === paramId) return 1.1;
        if (n.down === paramId) return 0.9;
        return 1.0;
    };

    //=========================================================================
    // Wachstumskurven: benoetigte Gesamt-EXP fuer ein Level
    //=========================================================================

    $.growthCurves = {
        fast: function (n) { return Math.floor(4 * Math.pow(n, 3) / 5); },
        mediumFast: function (n) { return Math.pow(n, 3); },
        mediumSlow: function (n) {
            return Math.max(0, Math.floor(6 / 5 * Math.pow(n, 3) - 15 * n * n + 100 * n - 140));
        },
        slow: function (n) { return Math.floor(5 * Math.pow(n, 3) / 4); }
    };

    $.expForLevel = function (curve, level) {
        var fn = this.growthCurves[curve] || this.growthCurves.mediumFast;
        return fn(clamp(level, 1, this.params.maxLevel));
    };

    $.levelForExp = function (curve, exp) {
        var lv = 1;
        while (lv < this.params.maxLevel && this.expForLevel(curve, lv + 1) <= exp) lv++;
        return lv;
    };

    //=========================================================================
    // Werte-Formel
    //-------------------------------------------------------------------------
    // Bewusst als eigene Funktion, nicht in Game_Monster: der Node-Server muss
    // sie unveraendert aufrufen koennen, um Client-Angaben nachzurechnen.
    //=========================================================================

    $.calcParam = function (paramId, base, iv, ev, level, natureId) {
        var e = Math.floor(ev / 4);
        if (paramId === 0) {
            // MHP
            return Math.floor((2 * base + iv + e) * level / 100) + level + 10;
        }
        var v = Math.floor((2 * base + iv + e) * level / 100) + 5;
        return Math.floor(v * this.natureMod(natureId, paramId));
    };

    //=========================================================================
    // Spezies-Registry
    //=========================================================================

    $._species = {};
    $._typeChart = {};
    $._maxElementId = 0;

    $.buildRegistry = function (db) {
        this._species = {};
        this._typeChart = db.typeChart || {};

        if (db.natures && db.natures.length > 0) {
            this.natures = db.natures;
        }

        // Anzahl Elemente aus der MV-Datenbank, sonst aus der JSON.
        if (typeof $dataSystem !== 'undefined' && $dataSystem && $dataSystem.elements) {
            this._maxElementId = $dataSystem.elements.length - 1;
        } else {
            this._maxElementId = db.elementCount || 0;
        }

        var list = db.species || [];
        for (var i = 0; i < list.length; i++) {
            var sp = list[i];
            sp.types = sp.types || [];
            sp.growth = sp.growth || 'mediumFast';
            sp.learnset = sp.learnset || [];
            sp.evYield = sp.evYield || [0, 0, 0, 0, 0, 0, 0, 0];
            sp.captureRate = (sp.captureRate === undefined) ? 45 : sp.captureRate;
            // MV erwartet auf Trait-Objekten .traits und .note
            sp.traits = (sp.traits || []).concat(this.elementTraits(sp.types));
            sp.note = sp.note || '';
            sp.meta = sp.meta || {};
            this._species[sp.id] = sp;
        }
    };

    /**
     * Effektivitaet gegen eine Typkombination. Portabel - kein MV noetig.
     * Der Kampf-Core und der Node-Server benutzen diese Funktion, die
     * MV-Seite bekommt dasselbe Ergebnis ueber elementTraits().
     */
    $.elementRateFor = function (types, elementId) {
        var rate = 1;
        var row = this._typeChart[String(elementId)];
        if (row) {
            for (var i = 0; i < types.length; i++) {
                var m = row[String(types[i])];
                if (m !== undefined) rate *= m;
            }
        }
        return rate;
    };

    /**
     * Erzeugt TRAIT_ELEMENT_RATE-Traits (Code 11) aus der Typtabelle.
     * Bei zwei Typen werden die Raten multipliziert - genau das macht MVs
     * traitsPi anschliessend auch, also stimmt das Ergebnis ohne Zusatzcode.
     */
    $.elementTraits = function (types) {
        var traits = [];
        for (var e = 1; e <= this._maxElementId; e++) {
            var rate = this.elementRateFor(types, e);
            if (rate !== 1) {
                traits.push({ code: 11, dataId: e, value: rate });
            }
        }
        return traits;
    };

    $.species = function (id) {
        return this._species[id] || null;
    };

    $.allSpecies = function () {
        var out = [];
        for (var k in this._species) {
            if (this._species.hasOwnProperty(k)) out.push(this._species[k]);
        }
        return out;
    };

    //=========================================================================
    // UID-Erzeugung
    //-------------------------------------------------------------------------
    // Provisorisch clientseitig. Der Account-Server vergibt beim ersten Sync
    // eine autoritative ID und ersetzt diese hier.
    //=========================================================================

    $._uidCounter = 0;

    $.newUid = function () {
        this._uidCounter++;
        var t = Date.now().toString(36);
        var r = Math.floor(Math.random() * 0x1000000).toString(36);
        return 'tmp-' + t + '-' + r + '-' + this._uidCounter;
    };

    //=========================================================================
    // Fabrik
    //=========================================================================

    /**
     * @param {number} speciesId
     * @param {number} level
     * @param {object} [opt] uid, ivs, evs, natureId, nickname, skills, rng, seed
     */
    $.create = function (speciesId, level, opt) {
        return new Game_Monster(speciesId, level, opt || {});
    };

    $.rollIvs = function (rng) {
        var ivs = [];
        for (var i = 0; i < this.PARAM_COUNT; i++) {
            ivs.push(rng.int(0, this.params.maxIv));
        }
        return ivs;
    };

    //=========================================================================
    // Speicher-Adapter
    //-------------------------------------------------------------------------
    // Das Account-Plugin ersetzt spaeter MC.Core.Storage komplett. Diese
    // Schnittstelle existiert jetzt schon, damit dafuer keine Zeile im
    // Datenmodell angefasst werden muss.
    //=========================================================================

    $.Storage = {
        mode: 'local',
        save: function (payload) { return Promise.resolve(payload); },
        load: function () { return Promise.resolve(null); }
    };

})(MC.Core);

//=============================================================================
// Game_Monster
//-----------------------------------------------------------------------------
// Global, nicht in der IIFE: MVs JsonEx rekonstruiert Klassen ueber
// window[className]. Alle Game_*-Klassen muessen deshalb global sein.
//=============================================================================

function Game_Monster() {
    this.initialize.apply(this, arguments);
}

Game_Monster.prototype = Object.create(Game_Battler.prototype);
Game_Monster.prototype.constructor = Game_Monster;

Game_Monster.SCHEMA_VERSION = 1;

//-----------------------------------------------------------------------------
// Aufbau
//-----------------------------------------------------------------------------

Game_Monster.prototype.initialize = function (speciesId, level, opt) {
    Game_Battler.prototype.initialize.call(this);
    if (speciesId) this.setup(speciesId, level || 1, opt || {});
};

Game_Monster.prototype.initMembers = function () {
    Game_Battler.prototype.initMembers.call(this);
    this._uid = '';
    this._speciesId = 0;
    this._level = 1;
    this._exp = 0;
    this._ivs = [0, 0, 0, 0, 0, 0, 0, 0];
    this._evs = [0, 0, 0, 0, 0, 0, 0, 0];
    this._natureId = 0;
    this._nickname = '';
    this._skills = [];
    this._side = 'foe';
    this._originalTrainer = '';
    this._caughtAt = 0;
};

Game_Monster.prototype.setup = function (speciesId, level, opt) {
    var C = MC.Core;
    var sp = C.species(speciesId);
    if (!sp) throw new Error('MC: Unbekannte Spezies-ID ' + speciesId);

    var rng = opt.rng || (opt.seed !== undefined ? new C.RNG(opt.seed) : C.defaultRng());

    this._uid = opt.uid || C.newUid();
    this._speciesId = speciesId;
    this._level = C.clamp(level, 1, C.params.maxLevel);
    this._exp = (opt.exp !== undefined) ? opt.exp : C.expForLevel(sp.growth, this._level);
    this._ivs = opt.ivs ? opt.ivs.slice() : C.rollIvs(rng);
    this._evs = opt.evs ? opt.evs.slice() : [0, 0, 0, 0, 0, 0, 0, 0];
    this._natureId = (opt.natureId !== undefined) ? opt.natureId : rng.int(0, C.natures.length - 1);
    this._nickname = opt.nickname || '';
    this._originalTrainer = opt.originalTrainer || '';
    this._caughtAt = opt.caughtAt || 0;

    if (opt.skills) {
        this._skills = opt.skills.slice();
    } else {
        this.relearnDefaultSkills();
    }

    this.recoverAll();
};

//-----------------------------------------------------------------------------
// Stammdaten
//-----------------------------------------------------------------------------

Game_Monster.prototype.species = function () {
    return MC.Core.species(this._speciesId);
};

Game_Monster.prototype.uid = function () { return this._uid; };
Game_Monster.prototype.setUid = function (uid) { this._uid = uid; };
Game_Monster.prototype.speciesId = function () { return this._speciesId; };
Game_Monster.prototype.level = function () { return this._level; };
Game_Monster.prototype.exp = function () { return this._exp; };
Game_Monster.prototype.natureId = function () { return this._natureId; };
Game_Monster.prototype.ivs = function () { return this._ivs.slice(); };
Game_Monster.prototype.evs = function () { return this._evs.slice(); };
Game_Monster.prototype.types = function () { return this.species().types.slice(); };

Game_Monster.prototype.name = function () {
    return this._nickname || this.species().name;
};

Game_Monster.prototype.setNickname = function (n) {
    this._nickname = String(n || '').substring(0, 16);
};

Game_Monster.prototype.hasNickname = function () {
    return this._nickname.length > 0;
};

Game_Monster.prototype.battlerName = function () {
    return this.species().battlerName || '';
};

Game_Monster.prototype.characterName = function () {
    return this.species().characterName || '';
};

Game_Monster.prototype.characterIndex = function () {
    return this.species().characterIndex || 0;
};

Game_Monster.prototype.faceName = function () {
    return this.species().faceName || '';
};

Game_Monster.prototype.faceIndex = function () {
    return this.species().faceIndex || 0;
};

//-----------------------------------------------------------------------------
// Seitenzuordnung
//-----------------------------------------------------------------------------
// isActor()/isEnemy() geben bewusst beide false zurueck. Game_Monster ist weder
// ein Game_Actor noch ein Game_Enemy, und MVs Standard-BattleManager wird nicht
// benutzt - der Kampf laeuft ueber den eigenen deterministischen Core.
// Wer die Seite braucht, fragt side() ab.
//-----------------------------------------------------------------------------

Game_Monster.prototype.isActor = function () { return false; };
Game_Monster.prototype.isEnemy = function () { return false; };
Game_Monster.prototype.isMonster = function () { return true; };

Game_Monster.prototype.side = function () { return this._side; };
Game_Monster.prototype.setSide = function (s) { this._side = s; };
Game_Monster.prototype.isAlly = function () { return this._side === 'ally'; };

//-----------------------------------------------------------------------------
// Werte
//-----------------------------------------------------------------------------

Game_Monster.prototype.paramBase = function (paramId) {
    var sp = this.species();
    var base = (sp.baseParams && sp.baseParams[paramId]) || 0;
    return MC.Core.calcParam(
        paramId, base, this._ivs[paramId] || 0, this._evs[paramId] || 0,
        this._level, this._natureId
    );
};

/**
 * Species vor states: MV liest allTraits in dieser Reihenfolge, und bei
 * Trait-Codes mit "erstes gewinnt"-Semantik soll der Zustand Vorrang haben.
 */
Game_Monster.prototype.traitObjects = function () {
    return [this.species()].concat(Game_Battler.prototype.traitObjects.call(this));
};

Game_Monster.prototype.attackElements = function () {
    var t = this.species().types;
    return t.length > 0 ? [t[0]] : [];
};

//-----------------------------------------------------------------------------
// Skills
//-----------------------------------------------------------------------------

Game_Monster.prototype.skills = function () {
    var out = [];
    for (var i = 0; i < this._skills.length; i++) {
        var s = $dataSkills[this._skills[i]];
        if (s) out.push(s);
    }
    return out;
};

Game_Monster.prototype.skillIds = function () {
    return this._skills.slice();
};

Game_Monster.prototype.isLearnedSkill = function (skillId) {
    return this._skills.indexOf(skillId) >= 0;
};

Game_Monster.prototype.hasSkillRoom = function () {
    return this._skills.length < MC.Core.params.maxSkills;
};

/**
 * @return {boolean} false wenn kein Platz war - der Aufrufer muss dann den
 *                   Spieler fragen, welcher Skill ersetzt wird.
 */
Game_Monster.prototype.learnSkill = function (skillId) {
    if (this.isLearnedSkill(skillId)) return true;
    if (!this.hasSkillRoom()) return false;
    this._skills.push(skillId);
    return true;
};

Game_Monster.prototype.forgetSkill = function (skillId) {
    var i = this._skills.indexOf(skillId);
    if (i >= 0) this._skills.splice(i, 1);
};

Game_Monster.prototype.replaceSkill = function (oldId, newId) {
    var i = this._skills.indexOf(oldId);
    if (i >= 0) this._skills[i] = newId;
    else this.learnSkill(newId);
};

Game_Monster.prototype.learnableSkillsAt = function (level) {
    var out = [];
    var ls = this.species().learnset;
    for (var i = 0; i < ls.length; i++) {
        if (ls[i].level === level) out.push(ls[i].skillId);
    }
    return out;
};

Game_Monster.prototype.relearnDefaultSkills = function () {
    var max = MC.Core.params.maxSkills;
    var ls = this.species().learnset;
    var pool = [];
    for (var i = 0; i < ls.length; i++) {
        if (ls[i].level <= this._level && pool.indexOf(ls[i].skillId) < 0) {
            pool.push(ls[i].skillId);
        }
    }
    this._skills = pool.slice(Math.max(0, pool.length - max));
};

Game_Monster.prototype.attackSkillId = function () {
    return this._skills.length > 0 ? this._skills[0] : 1;
};

//-----------------------------------------------------------------------------
// EXP und Level
//-----------------------------------------------------------------------------

Game_Monster.prototype.expForLevel = function (level) {
    return MC.Core.expForLevel(this.species().growth, level);
};

Game_Monster.prototype.nextLevelExp = function () {
    return this.expForLevel(this._level + 1);
};

Game_Monster.prototype.expRate = function () {
    if (this._level >= MC.Core.params.maxLevel) return 1;
    var cur = this.expForLevel(this._level);
    var next = this.nextLevelExp();
    return next > cur ? (this._exp - cur) / (next - cur) : 0;
};

/**
 * @return {object} Bericht statt Nebenwirkungen auf der UI:
 *   { levels: [12, 13], learned: [{level, skillId, ok}], evolved: null|speciesId }
 *   Damit kann derselbe Aufruf headless auf dem Server laufen, und der Client
 *   spielt den Bericht nur als Animation ab.
 */
Game_Monster.prototype.gainExp = function (amount) {
    var C = MC.Core;
    var report = { levels: [], learned: [], evolution: null };
    if (amount <= 0 || this._level >= C.params.maxLevel) return report;

    this._exp += amount;
    var maxExp = this.expForLevel(C.params.maxLevel);
    if (this._exp > maxExp) this._exp = maxExp;

    while (this._level < C.params.maxLevel && this._exp >= this.nextLevelExp()) {
        this._level++;
        report.levels.push(this._level);
        var ids = this.learnableSkillsAt(this._level);
        for (var i = 0; i < ids.length; i++) {
            report.learned.push({
                level: this._level,
                skillId: ids[i],
                ok: this.learnSkill(ids[i])
            });
        }
    }

    if (report.levels.length > 0) {
        report.evolution = this.checkEvolution('level');
        this.refresh();
    }
    return report;
};

Game_Monster.prototype.changeLevel = function (level, keepHpRate) {
    var C = MC.Core;
    var rate = keepHpRate ? this.hpRate() : 1;
    this._level = C.clamp(level, 1, C.params.maxLevel);
    this._exp = this.expForLevel(this._level);
    this.refresh();
    this.setHp(Math.max(1, Math.floor(this.mhp * rate)));
};

//-----------------------------------------------------------------------------
// EVs
//-----------------------------------------------------------------------------

Game_Monster.prototype.evTotal = function () {
    var sum = 0;
    for (var i = 0; i < this._evs.length; i++) sum += this._evs[i];
    return sum;
};

Game_Monster.prototype.gainEv = function (paramId, amount) {
    var C = MC.Core;
    var room = Math.min(
        C.params.evCapPerStat - this._evs[paramId],
        C.params.evCapTotal - this.evTotal()
    );
    var add = Math.max(0, Math.min(amount, room));
    if (add > 0) {
        this._evs[paramId] += add;
        this.refresh();
    }
    return add;
};

Game_Monster.prototype.gainEvYieldFrom = function (defeated) {
    var y = defeated.species().evYield;
    for (var i = 0; i < y.length; i++) {
        if (y[i] > 0) this.gainEv(i, y[i]);
    }
};

//-----------------------------------------------------------------------------
// Entwicklung
//-----------------------------------------------------------------------------

/**
 * @param {string} trigger 'level' | 'item' | 'trade'
 * @return {number|null} Ziel-Spezies-ID, wenn eine Bedingung erfuellt ist.
 *   Loest die Entwicklung NICHT aus - der Aufrufer entscheidet (Abbruch durch
 *   den Spieler, Bestaetigung durch den Server).
 */
Game_Monster.prototype.checkEvolution = function (trigger, value) {
    var evos = this.species().evolutions || [];
    for (var i = 0; i < evos.length; i++) {
        var e = evos[i];
        if (e.type !== trigger) continue;
        if (trigger === 'level' && this._level >= e.value) return e.toId;
        if (trigger === 'item' && value === e.value) return e.toId;
        if (trigger === 'trade') return e.toId;
    }
    return null;
};

/**
 * Identitaet bleibt erhalten: uid, IVs, EVs, Wesen, Spitzname, aktuelle HP-Rate.
 * Nur die Spezies wechselt, Werte werden neu abgeleitet.
 */
Game_Monster.prototype.evolveInto = function (speciesId) {
    if (!MC.Core.species(speciesId)) return false;
    var rate = this.hpRate();
    this._speciesId = speciesId;
    this.refresh();
    this.setHp(Math.max(1, Math.floor(this.mhp * rate)));
    return true;
};

//-----------------------------------------------------------------------------
// Serialisierung
//-----------------------------------------------------------------------------
// Kurze Schluessel, weil das Objekt bei jedem Sync ueber die Leitung geht und
// eine Box mit einigen hundert Monstern sonst unnoetig gross wird.
//-----------------------------------------------------------------------------

Game_Monster.prototype.toJSON = function () {
    return {
        v: Game_Monster.SCHEMA_VERSION,
        uid: this._uid,
        sp: this._speciesId,
        lv: this._level,
        xp: this._exp,
        iv: this._ivs.slice(),
        ev: this._evs.slice(),
        na: this._natureId,
        nk: this._nickname,
        sk: this._skills.slice(),
        hp: this._hp,
        mp: this._mp,
        st: this._states.slice(),
        ot: this._originalTrainer,
        ca: this._caughtAt
    };
};

/**
 * Migrationen von Schema-Version N auf N+1.
 * Account-gebundene Daten ueberleben Spiel-Updates, also wird das gebraucht -
 * lieber jetzt die leere Struktur als spaeter ein Datenverlust.
 */
Game_Monster._migrations = {
    // 1: function (d) { d.newField = 0; d.v = 2; return d; }
};

Game_Monster.migrate = function (data) {
    var v = data.v || 1;
    while (v < Game_Monster.SCHEMA_VERSION) {
        var m = Game_Monster._migrations[v];
        if (!m) throw new Error('MC: Keine Migration von Schema v' + v);
        data = m(data);
        v = data.v;
    }
    return data;
};

Game_Monster.fromJSON = function (data) {
    data = Game_Monster.migrate(data);
    var m = new Game_Monster(data.sp, data.lv, {
        uid: data.uid,
        exp: data.xp,
        ivs: data.iv,
        evs: data.ev,
        natureId: data.na,
        nickname: data.nk,
        skills: data.sk,
        originalTrainer: data.ot,
        caughtAt: data.ca
    });
    m.setHp(data.hp);
    m.setMp(data.mp);
    m._states = (data.st || []).slice();
    return m;
};

//=============================================================================
// Game_MonsterCollection
//-----------------------------------------------------------------------------
// Party (aktives Team) + Box (Lager). Beides account-gebunden.
//=============================================================================

function Game_MonsterCollection() {
    this.initialize.apply(this, arguments);
}

Game_MonsterCollection.SCHEMA_VERSION = 1;

Game_MonsterCollection.prototype.initialize = function () {
    this._party = [];
    this._box = [];
};

Game_MonsterCollection.prototype.party = function () { return this._party.slice(); };
Game_MonsterCollection.prototype.box = function () { return this._box.slice(); };
Game_MonsterCollection.prototype.all = function () { return this._party.concat(this._box); };
Game_MonsterCollection.prototype.partySize = function () { return this._party.length; };

Game_MonsterCollection.prototype.isPartyFull = function () {
    return this._party.length >= MC.Core.params.maxParty;
};

Game_MonsterCollection.prototype.aliveMembers = function () {
    return this._party.filter(function (m) { return m.isAlive(); });
};

Game_MonsterCollection.prototype.isWipedOut = function () {
    return this._party.length > 0 && this.aliveMembers().length === 0;
};

Game_MonsterCollection.prototype.find = function (uid) {
    var all = this.all();
    for (var i = 0; i < all.length; i++) {
        if (all[i].uid() === uid) return all[i];
    }
    return null;
};

/**
 * @return {string} 'party' oder 'box' - wohin es gewandert ist.
 */
Game_MonsterCollection.prototype.add = function (monster) {
    monster.setSide('ally');
    if (this.isPartyFull()) {
        this._box.push(monster);
        return 'box';
    }
    this._party.push(monster);
    return 'party';
};

Game_MonsterCollection.prototype.toBox = function (uid) {
    for (var i = 0; i < this._party.length; i++) {
        if (this._party[i].uid() === uid) {
            this._box.push(this._party.splice(i, 1)[0]);
            return true;
        }
    }
    return false;
};

Game_MonsterCollection.prototype.toParty = function (uid) {
    if (this.isPartyFull()) return false;
    for (var i = 0; i < this._box.length; i++) {
        if (this._box[i].uid() === uid) {
            this._party.push(this._box.splice(i, 1)[0]);
            return true;
        }
    }
    return false;
};

Game_MonsterCollection.prototype.swapPartySlots = function (a, b) {
    if (a < 0 || b < 0 || a >= this._party.length || b >= this._party.length) return false;
    var t = this._party[a];
    this._party[a] = this._party[b];
    this._party[b] = t;
    return true;
};

Game_MonsterCollection.prototype.release = function (uid) {
    var lists = [this._party, this._box];
    for (var l = 0; l < lists.length; l++) {
        for (var i = 0; i < lists[l].length; i++) {
            if (lists[l][i].uid() === uid) {
                lists[l].splice(i, 1);
                return true;
            }
        }
    }
    return false;
};

Game_MonsterCollection.prototype.healAll = function () {
    var all = this.all();
    for (var i = 0; i < all.length; i++) {
        all[i].recoverAll();
    }
};

Game_MonsterCollection.prototype.toJSON = function () {
    function ser(m) { return m.toJSON(); }
    return {
        v: Game_MonsterCollection.SCHEMA_VERSION,
        party: this._party.map(ser),
        box: this._box.map(ser)
    };
};

Game_MonsterCollection.fromJSON = function (data) {
    var c = new Game_MonsterCollection();
    if (!data) return c;
    function de(d) {
        var m = Game_Monster.fromJSON(d);
        m.setSide('ally');
        return m;
    }
    c._party = (data.party || []).map(de);
    c._box = (data.box || []).map(de);
    return c;
};

//=============================================================================
// Einbindung in MV
//=============================================================================

(function () {
    'use strict';

    //-------------------------------------------------------------------------
    // Laden der Spezies-Datei
    //-------------------------------------------------------------------------
    // Ueber DataManager.loadDataFile, weil das XHR benutzt und damit auf
    // NW.js, im Browser und unter Cordova gleichermassen funktioniert.
    // require('fs') wuerde nur auf dem Desktop laufen.
    //-------------------------------------------------------------------------

    var _loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function () {
        _loadDatabase.call(this);
        DataManager._mcRegistryBuilt = false;
        DataManager.loadDataFile('$dataMonsterDB', MC.Core.params.speciesFile);
    };

    var _isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () {
        if (!_isDatabaseLoaded.call(this)) return false;
        if (!$dataMonsterDB) return false;
        if (!DataManager._mcRegistryBuilt) {
            MC.Core.buildRegistry($dataMonsterDB);
            DataManager._mcRegistryBuilt = true;
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Objekt-Erzeugung
    //-------------------------------------------------------------------------

    var _createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function () {
        _createGameObjects.call(this);
        $gameMonsters = new Game_MonsterCollection();
    };

    //-------------------------------------------------------------------------
    // Spielstand
    //-------------------------------------------------------------------------
    // Im Modus 'account' wird bewusst NICHTS in den Spielstand geschrieben.
    // Sonst gibt es zwei Wahrheiten - eine im Save, eine auf dem Server - und
    // beim Login muesste gemergt werden. Der Spielstand haelt den Weltzustand
    // (Karte, Schalter, Story), der Account haelt die Monster.
    //
    // Gespeichert wird ausserdem die einfache JSON-Form, nicht das lebende
    // Objekt: eine einzige Serialisierungsroute fuer Save und Netzwerk, und
    // JsonEx muss die Klassen gar nicht erst rekonstruieren.
    //-------------------------------------------------------------------------

    var _makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function () {
        var contents = _makeSaveContents.call(this);
        if (MC.Core.params.persistence === 'local' && $gameMonsters) {
            contents.mcMonsters = $gameMonsters.toJSON();
        }
        return contents;
    };

    var _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _extractSaveContents.call(this, contents);
        if (MC.Core.params.persistence === 'local') {
            $gameMonsters = Game_MonsterCollection.fromJSON(contents.mcMonsters);
        } else {
            $gameMonsters = new Game_MonsterCollection();
        }
    };

    //-------------------------------------------------------------------------
    // Plugin-Befehle
    //-------------------------------------------------------------------------

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _pluginCommand.call(this, command, args);
        if (command !== 'MCMonster') return;

        switch (String(args[0]).toLowerCase()) {
            case 'give':
                // MCMonster give <speciesId> <level>
                $gameMonsters.add(MC.Core.create(Number(args[1]), Number(args[2] || 5)));
                break;
            case 'heal':
                $gameMonsters.healAll();
                break;
            case 'count':
                // MCMonster count <variableId>
                $gameVariables.setValue(Number(args[1]), $gameMonsters.all().length);
                break;
        }
    };

})();
