//=============================================================================
// MC_BattleCore.js
//-----------------------------------------------------------------------------
// Monster-Capture-Framework fuer RPG Maker MV
// Schicht 2: Kampf-Core (deterministischer Zustandsautomat)
//
// Implementiert SPEC_Kampfsystem.md. Weicht Code von der Spezifikation ab,
// ist die Spezifikation zu aendern - nicht umgekehrt. Der Node-Schiedsrichter
// implementiert dasselbe Dokument.
//
// Dieses Modul kennt weder PIXI noch Fenster noch $gameParty. Es nimmt einen
// Zustand und Aktionen und liefert einen neuen Zustand samt Ereignisliste.
//=============================================================================

/*:
 * @plugindesc [v0.1.0] Kampf-Core: Zustandsautomat fuer 2v2-Kaempfe mit
 * Ausdauer, Barometer, Kombiangriffen und Wechsel. Ohne Oberflaeche.
 * @author Donatello
 *
 * @param skillFile
 * @text Skill-Datei
 * @desc Dateiname im Ordner data/
 * @default mc_skills.json
 *
 * @param staminaMax
 * @text Ausdauer-Maximum
 * @type number
 * @default 100
 *
 * @param staminaRegen
 * @text Regeneration pro Runde
 * @type number
 * @default 12
 *
 * @param staminaRegenPause
 * @text Regeneration bei erzwungener Pause
 * @type number
 * @default 40
 *
 * @param staminaRegenFailed
 * @text Regeneration bei gescheiterter Kombo
 * @desc Muss deutlich unter der erzwungenen Pause liegen, sonst wird der
 * absichtlich abgelehnte Kombo-Antrag zur billigen Regenerationsrunde.
 * @type number
 * @default 15
 *
 * @param gaugeMax
 * @text Barometer-Maximum
 * @type number
 * @default 100
 *
 * @param critBase
 * @text Basis-Kritchance in Prozent
 * @type number
 * @default 4
 *
 * @param varianceMin
 * @text Schadensvarianz Minimum in Prozent
 * @type number
 * @default 85
 *
 * @param stab
 * @text Typbonus (Angriff entspricht eigenem Typ)
 * @type number
 * @decimals 2
 * @default 1.50
 *
 * @help
 * ============================================================================
 * Aufbau
 * ============================================================================
 *
 * Der Core ist eine reine Funktion:
 *
 *   resolve(State, Actions) -> (State, EventLog)
 *
 * Der EventLog ist die einzige Ausgabe an die Darstellung. Die Szene spielt
 * ihn ab, sie berechnet nichts.
 *
 * ----------------------------------------------------------------------------
 * Determinismus
 * ----------------------------------------------------------------------------
 *
 * Drei Regeln, ohne die der Core nicht serverfaehig ist:
 *
 *   1. Kein Math.random(). Nur MC.Core.RNG mit dem Rundenseed.
 *   2. Feste Verbrauchsreihenfolge der Zufallswerte (siehe drawOrder unten).
 *   3. Keine Iteration ueber Objektschluessel. Alle Sammlungen sind Arrays.
 *
 * Der Zustand ist vollstaendig JSON-serialisierbar. Es liegt bewusst keine
 * RNG-Instanz darin - sie wird bei jedem Zug aus (seed, round, cursor)
 * rekonstruiert. Damit ist jeder Zwischenzustand uebertragbar und jede Runde
 * einzeln nachspielbar.
 *
 * ----------------------------------------------------------------------------
 * Referenzen
 * ----------------------------------------------------------------------------
 *
 * Einheiten haben stabile Referenzen: A0..A3 fuer die eigene Seite, B0..B3
 * fuer die Gegnerseite. Die Referenz bezeichnet ein Monster, nicht einen
 * Feldplatz - wechselt es heraus, wird ein Angriff auf seine Referenz
 * ungueltig und muss umgeleitet werden.
 *
 * ============================================================================
 */

var MC = MC || {};
MC.Battle = MC.Battle || {};

var $dataMonsterSkills = null;

(function ($) {
    'use strict';

    //=========================================================================
    // Konfiguration
    //=========================================================================

    $.config = {
        skillFile: 'mc_skills.json',
        staminaMax: 100,
        staminaRegen: 12,
        staminaRegenPause: 40,
        staminaRegenFailed: 15,
        gaugeMax: 100,
        critBase: 4,
        varianceMin: 85,
        stab: 1.5
    };

    if (typeof PluginManager !== 'undefined') {
        var raw = PluginManager.parameters('MC_BattleCore');
        if (raw && Object.keys(raw).length > 0) {
            $.config.skillFile = String(raw.skillFile || $.config.skillFile);
            $.config.staminaMax = Number(raw.staminaMax || $.config.staminaMax);
            $.config.staminaRegen = Number(raw.staminaRegen || $.config.staminaRegen);
            $.config.staminaRegenPause = Number(raw.staminaRegenPause || $.config.staminaRegenPause);
            $.config.staminaRegenFailed = Number(raw.staminaRegenFailed || $.config.staminaRegenFailed);
            $.config.gaugeMax = Number(raw.gaugeMax || $.config.gaugeMax);
            $.config.critBase = Number(raw.critBase || $.config.critBase);
            $.config.varianceMin = Number(raw.varianceMin || $.config.varianceMin);
            $.config.stab = Number(raw.stab || $.config.stab);
        }
    }

    $.PRIORITY_SWITCH = 6;
    $.PRIORITY_ITEM = 5;

    //=========================================================================
    // Skill-Registry
    //=========================================================================

    $._skills = {};

    $.buildSkillRegistry = function (db) {
        this._skills = {};
        var list = (db && db.skills) || [];
        for (var i = 0; i < list.length; i++) {
            var s = list[i];
            s.kind = s.kind || 'normal';
            s.category = s.category || 'phys';
            s.power = s.power || 0;
            s.accuracy = (s.accuracy === undefined) ? 100 : s.accuracy;
            s.priority = s.priority || 0;
            s.stamina = s.stamina || 0;
            s.gauge = s.gauge || 0;
            s.gaugeCost = s.gaugeCost || 0;
            s.target = s.target || 'one';
            s.effects = s.effects || [];
            this._skills[s.id] = s;
        }
    };

    $.skill = function (id) {
        return this._skills[id] || null;
    };

    //=========================================================================
    // Seed und Zufall
    //=========================================================================

    function hashSeed(a, b) {
        var h = (a ^ Math.imul(b + 0x9E3779B9, 0x85EBCA6B)) >>> 0;
        h ^= h >>> 13;
        h = Math.imul(h, 0xC2B2AE35) >>> 0;
        h ^= h >>> 16;
        return h >>> 0;
    }

    $.hashSeed = hashSeed;

    /**
     * Zieht einen Zufallswert. Die RNG-Instanz wird jedes Mal aus
     * (seed, round, cursor) rekonstruiert, damit der Zustand reines JSON
     * bleibt und uebertragbar ist.
     *
     * VERBRAUCHSREIHENFOLGE (Spezifikation 6.4) - verbindlich:
     *   Rundenbeginn: tiebreak je Feldeinheit in Slot-Reihenfolge
     *   Je Aktion:    1 Trefferpruefung  (nur wenn accuracy < 100)
     *                 2 Kritischer Treffer (nur bei Schadenswirkung)
     *                 3 Schadensvarianz    (nur bei Treffer)
     *                 4 Zusatzeffekt       (nur wenn vorhanden)
     *                 5 Fangwurf           (nur bei capture)
     * Bei Mehrfachzielen wiederholt sich 1-3 je Ziel in Feld-Slot-Reihenfolge.
     * Ungenutzte Schritte werden UEBERSPRUNGEN, nicht gezogen.
     */
    function draw(state) {
        var rng = new MC.Core.RNG(hashSeed(state.seed, state.round));
        for (var i = 0; i < state.rngCursor; i++) rng.next();
        state.rngCursor++;
        return rng.next();
    }

    function drawInt(state, min, max) {
        return min + Math.floor(draw(state) * (max - min + 1));
    }

    $._draw = draw;
    $._drawInt = drawInt;

    //=========================================================================
    // Konstruktion
    //=========================================================================

    /**
     * Baut eine Kampfeinheit aus einem Game_Monster oder aus einer
     * gleichwertigen einfachen Struktur (serverseitig).
     * Die abgeleiteten Werte werden hier einmal berechnet - IVs und EVs
     * bleiben im Account und wandern nicht in den Kampfzustand.
     */
    $.unitFromMonster = function (monster, ref, side) {
        var params = [];
        for (var i = 0; i < 8; i++) params.push(monster.param(i));
        return {
            ref: ref,
            side: side,
            uid: monster.uid(),
            name: monster.name(),
            speciesId: monster.speciesId(),
            level: monster.level(),
            types: monster.types(),
            hp: monster.hp,
            mhp: params[0],
            params: params,
            skills: monster.skillIds(),
            stamina: $.config.staminaMax,
            staminaMax: $.config.staminaMax,
            states: [],
            buffs: [0, 0, 0, 0, 0, 0, 0, 0],
            form: null,
            captureRate: (MC.Core.species(monster.speciesId()) || {}).captureRate || 45,
            statusImmunity: (MC.Core.species(monster.speciesId()) || {}).statusImmunity || [],
            hasActed: false,
            tiebreak: 0
        };
    };

    /**
     * @param {object} cfg
     *   mode      'single' | 'coop' | 'pvp'
     *   seed      Kampfseed
     *   ally      { field: [Monster, Monster], bench: [Monster, ...] }
     *   foe       { field: [Monster, Monster], queue: [Monster, ...] }
     *   owners    nur coop: { A0: playerId, A1: playerId }
     */
    $.createState = function (cfg) {
        var state = {
            v: 1,
            mode: cfg.mode || 'single',
            round: 0,
            phase: 'select',
            seed: (cfg.seed >>> 0) || 1,
            rngCursor: 0,
            units: {},
            sides: {
                ally: { field: [], bench: [], queue: [], gauge: 0, owners: cfg.owners || null },
                foe: { field: [], bench: [], queue: [], gauge: 0, owners: null }
            },
            result: null
        };

        function place(list, sideKey, prefix, target) {
            for (var i = 0; i < list.length; i++) {
                var ref = prefix + target.count++;
                var u = $.unitFromMonster(list[i], ref, sideKey);
                state.units[ref] = u;
                target.arr.push(ref);
            }
        }

        var ac = { count: 0 };
        ac.arr = state.sides.ally.field;
        place(cfg.ally.field || [], 'ally', 'A', ac);
        ac.arr = state.sides.ally.bench;
        place(cfg.ally.bench || [], 'ally', 'A', ac);

        var fc = { count: 0 };
        fc.arr = state.sides.foe.field;
        place(cfg.foe.field || [], 'foe', 'B', fc);
        fc.arr = state.sides.foe.queue;
        place(cfg.foe.queue || [], 'foe', 'B', fc);

        return state;
    };

    //=========================================================================
    // Zugriff
    //=========================================================================

    $.unit = function (state, ref) {
        return state.units[ref] || null;
    };

    $.opposing = function (sideKey) {
        return sideKey === 'ally' ? 'foe' : 'ally';
    };

    /** Refs im Feld, inklusive gefallener - die Slots bleiben bis Rundenende. */
    $.fieldRefs = function (state, sideKey) {
        return state.sides[sideKey].field.slice();
    };

    /** Lebende Einheiten im Feld, in Slot-Reihenfolge. */
    $.activeUnits = function (state, sideKey) {
        var out = [];
        var f = state.sides[sideKey].field;
        for (var i = 0; i < f.length; i++) {
            var u = state.units[f[i]];
            if (u && u.hp > 0) out.push(u);
        }
        return out;
    };

    /** Alle lebenden Feldeinheiten beider Seiten, Slot-Reihenfolge ally->foe. */
    function allActive(state) {
        return $.activeUnits(state, 'ally').concat($.activeUnits(state, 'foe'));
    }

    $.isOnField = function (state, ref) {
        var u = state.units[ref];
        if (!u) return false;
        return state.sides[u.side].field.indexOf(ref) >= 0;
    };

    //=========================================================================
    // Abgeleitete Werte
    //=========================================================================

    function effParam(unit, paramId) {
        var v = unit.params[paramId];
        if (unit.form && unit.form.paramRate) v *= unit.form.paramRate[paramId];
        // Statusmodifikatoren (Verbrennung senkt Nahkampf, Paralyse Tempo).
        for (var i = 0; i < unit.states.length; i++) {
            var def = $.STATUS[unit.states[i].id];
            if (def && def.paramMul && def.paramMul[paramId] !== undefined) {
                v *= def.paramMul[paramId];
            }
        }
        // Buffs: Verhältnisformel, sauber von 0.25x (-6) bis 4x (+6). Die alte
        // lineare Fassung kippte unter Stufe -4 ins Negative und wurde stumpf
        // auf 1 gedeckelt.
        var stage = Math.max(-6, Math.min(6, unit.buffs[paramId]));
        var rate = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        v *= rate;
        return Math.max(1, Math.floor(v));
    }

    $.effParam = effParam;

    function unitTypes(unit) {
        return (unit.form && unit.form.types) ? unit.form.types : unit.types;
    }

    $.unitTypes = unitTypes;

    //=========================================================================
    // Ressourcen
    //=========================================================================

    /**
     * Kosten einer Aktion. Bei der Kombo zahlen beide Beteiligten die vollen
     * Kosten (Spezifikation 11.3 - bewusste Vorbelegung, nicht endgueltig).
     */
    $.staminaCost = function (skill) {
        return skill ? skill.stamina : 0;
    };

    $.canAfford = function (unit, skill) {
        return unit.stamina >= $.staminaCost(skill);
    };

    /** Guenstigster Angriff, den die Einheit ueberhaupt bezahlen koennte. */
    $.cheapestCost = function (unit) {
        var min = Infinity;
        for (var i = 0; i < unit.skills.length; i++) {
            var s = $.skill(unit.skills[i]);
            if (s && s.kind === 'normal') min = Math.min(min, s.stamina);
        }
        return min === Infinity ? 0 : min;
    };

    /** Spezifikation 3.1: erzwungene Pause bei Erschoepfung. */
    $.mustPause = function (unit) {
        return unit.stamina < $.cheapestCost(unit);
    };

    function spendStamina(state, unit, amount, events) {
        unit.stamina = Math.max(0, unit.stamina - amount);
        events.push({ t: 'stamina', actor: unit.ref, delta: -amount, now: unit.stamina });
    }

    function regenStamina(state, unit, amount, events) {
        var before = unit.stamina;
        unit.stamina = Math.min(unit.staminaMax, unit.stamina + amount);
        var delta = unit.stamina - before;
        if (delta !== 0) {
            events.push({ t: 'stamina', actor: unit.ref, delta: delta, now: unit.stamina });
        }
    }

    function addGauge(state, sideKey, amount, events) {
        var side = state.sides[sideKey];
        var before = side.gauge;
        side.gauge = Math.max(0, Math.min($.config.gaugeMax, side.gauge + amount));
        var delta = side.gauge - before;
        if (delta !== 0) {
            events.push({ t: 'gauge', side: sideKey, delta: delta, now: side.gauge });
        }
    }

    //=========================================================================
    // Statuszustände
    //=========================================================================
    //
    // Die Statuslogik hängt an Parameter-Slots und Rundenphasen, nicht an der
    // Typtabelle - sie überlebt die Umstellung auf Rhaigo-Biotope unverändert.
    // Nur die Immunitäts-Zuordnung (welcher Typ ist wogegen immun) ist
    // typabhängig und unten ausdrücklich als PLATZHALTER markiert.
    //
    // Zufallsverbrauch (erweitert Spezifikation 6.4):
    //   Vor der Aktion, NUR wenn der passende Zustand vorliegt, in dieser
    //   Reihenfolge: Frost-Auftauen, Paralyse-Aussetzer, Verwirrungs-
    //   Selbsttreffer. Schlaf zieht nichts (Zähler).
    //   Bei einem Effekt: Chance-Wurf (entfällt bei 100), danach ggf. Dauer-
    //   Wurf für Zustände mit zufälliger Dauer.

    // Verhalten je Zustand an einem Ort.
    $.STATUS = {
        poison:   { dot: 8 },                                 // Schaden mhp/8 am Rundenende
        burn:     { dot: 16, paramMul: { 2: 0.5 } },          // mhp/16 + Nahkampf halbiert
        paralyze: { paramMul: { 6: 0.5 }, skipChance: 25 },   // Tempo halbiert + Aussetzer
        sleep:    { durMin: 1, durMax: 3, act: 'skip' },      // setzt aus, wacht per Zähler
        freeze:   { thawChance: 20, act: 'skip' },            // setzt aus, taut mit Chance
        confuse:  { durMin: 2, durMax: 4, selfHitChance: 33, selfHitPower: 40 }
    };

    function statusDef(id) { return $.STATUS[id] || null; }

    function getStatus(unit, id) {
        for (var i = 0; i < unit.states.length; i++) {
            if (unit.states[i].id === id) return unit.states[i];
        }
        return null;
    }
    function hasStatus(unit, id) { return getStatus(unit, id) !== null; }

    function removeStatus(unit, id) {
        for (var i = unit.states.length - 1; i >= 0; i--) {
            if (unit.states[i].id === id) unit.states.splice(i, 1);
        }
    }

    /**
     * PLATZHALTER-Immunität auf den aktuellen Elementtypen. Wird mit dem echten
     * Rhaigo-Typsystem (Biotop x Element) neu befüllt - der Mechanismus bleibt.
     * Zusätzlich kann jede Spezies über statusImmunity eigene Immunitäten setzen.
     */
    function isImmuneToStatus(unit, id) {
        if (unit.statusImmunity && unit.statusImmunity.indexOf(id) >= 0) return true;
        var types = unitTypes(unit);
        if (id === 'burn' && types.indexOf(2) >= 0) return true;     // Feuer: brandimmun
        if (id === 'paralyze' && types.indexOf(5) >= 0) return true; // Elektro: paralyseimmun
        return false;
    }

    function applyStatus(state, unit, id, events) {
        var def = statusDef(id);
        if (!def || unit.hp <= 0) return;
        if (isImmuneToStatus(unit, id)) {
            events.push({ t: 'immune', target: unit.ref, status: id });
            return;
        }
        if (hasStatus(unit, id)) {
            events.push({ t: 'status_blocked', target: unit.ref, status: id });
            return;
        }
        var entry = { id: id };
        if (def.durMin !== undefined) {
            entry.turns = drawInt(state, def.durMin, def.durMax); // Dauer-Wurf
        }
        unit.states.push(entry);
        events.push({ t: 'status_add', target: unit.ref, status: id, turns: entry.turns || null });
    }

    function applyBuff(state, unit, param, stages, events) {
        var before = unit.buffs[param];
        unit.buffs[param] = Math.max(-6, Math.min(6, before + stages));
        events.push({
            t: 'buff', target: unit.ref, param: param,
            delta: unit.buffs[param] - before, now: unit.buffs[param]
        });
    }

    /**
     * Wendet die Effekte einer Fähigkeit an (Spezifikation 6.4, Schritt 4).
     * Ein Chance-Wurf je Effekt; bei Chance 100 wird nicht gezogen (analog zur
     * Trefferprüfung).
     */
    function applyEffects(state, actor, target, skill, events) {
        var effects = skill.effects || [];
        for (var i = 0; i < effects.length; i++) {
            var ef = effects[i];
            var tgt = (ef.target === 'self') ? actor : target;
            if (!tgt || tgt.hp <= 0) continue;
            if (ef.chance !== undefined && ef.chance < 100) {
                if (drawInt(state, 1, 100) > ef.chance) continue;
            }
            if (ef.kind === 'buff') applyBuff(state, tgt, ef.param, ef.stages, events);
            else if (ef.kind === 'status') applyStatus(state, tgt, ef.status, events);
        }
    }

    /**
     * Prüft vor der Aktion, ob ein Zustand sie verhindert. Zieht Zufall nur,
     * wenn der jeweilige Zustand vorliegt - Einheiten ohne Zustand ziehen hier
     * nichts, damit die bestehende Verbrauchsreihenfolge unberührt bleibt.
     * @return {boolean} true = Aktion wird ausgesetzt
     */
    function preActionStatus(state, actor, events) {
        // Schlaf: Zähler, kein Zufall. Bei 0 aufwachen und handeln.
        var sl = getStatus(actor, 'sleep');
        if (sl) {
            sl.turns--;
            if (sl.turns <= 0) {
                removeStatus(actor, 'sleep');
                events.push({ t: 'status_end', target: actor.ref, status: 'sleep' });
            } else {
                events.push({ t: 'status_active', target: actor.ref, status: 'sleep' });
                return true;
            }
        }
        // Frost: Auftau-Wurf.
        if (hasStatus(actor, 'freeze')) {
            if (drawInt(state, 1, 100) <= $.STATUS.freeze.thawChance) {
                removeStatus(actor, 'freeze');
                events.push({ t: 'status_end', target: actor.ref, status: 'freeze' });
            } else {
                events.push({ t: 'status_active', target: actor.ref, status: 'freeze' });
                return true;
            }
        }
        // Paralyse: Aussetzer-Wurf (Tempo-Senkung ist passiv in effParam).
        if (hasStatus(actor, 'paralyze')) {
            if (drawInt(state, 1, 100) <= $.STATUS.paralyze.skipChance) {
                events.push({ t: 'status_active', target: actor.ref, status: 'paralyze' });
                return true;
            }
        }
        // Verwirrung: Zähler + Selbsttreffer-Wurf.
        var cf = getStatus(actor, 'confuse');
        if (cf) {
            cf.turns--;
            if (cf.turns <= 0) {
                removeStatus(actor, 'confuse');
                events.push({ t: 'status_end', target: actor.ref, status: 'confuse' });
            } else if (drawInt(state, 1, 100) <= $.STATUS.confuse.selfHitChance) {
                var p = $.STATUS.confuse.selfHitPower;
                var A = effParam(actor, 2), D = effParam(actor, 3);
                var dmg = Math.max(1, Math.floor(
                    (Math.floor(2 * actor.level / 5 + 2) * p * A / D) / 50) + 2);
                actor.hp = Math.max(0, actor.hp - dmg);
                events.push({ t: 'confusion_hit', actor: actor.ref, amount: dmg, hp: actor.hp });
                return true;
            }
        }
        return false;
    }

    /** Zustandsschaden am Rundenende (kein Zufall). */
    function tickStatusDamage(state, unit, events) {
        var ids = ['poison', 'burn'];
        for (var i = 0; i < ids.length; i++) {
            if (!hasStatus(unit, ids[i])) continue;
            var def = statusDef(ids[i]);
            if (!def.dot) continue;
            var dmg = Math.max(1, Math.floor(unit.mhp / def.dot));
            unit.hp = Math.max(0, unit.hp - dmg);
            events.push({
                t: 'status_damage', target: unit.ref, status: ids[i],
                amount: dmg, hp: unit.hp
            });
        }
    }

    // Für Tests und Client zugänglich.
    $.hasStatus = hasStatus;
    $.isImmuneToStatus = isImmuneToStatus;

    //=========================================================================
    // Validierung
    //=========================================================================

    /**
     * @return {null|string} null = gueltig, sonst Fehlergrund.
     * Der Server weist ungueltige Aktionen zurueck, statt sie zu korrigieren -
     * eine stillschweigende Korrektur waere ein Desync-Risiko.
     */
    $.validateAction = function (state, action) {
        var u = $.unit(state, action.actor);
        if (!u) return 'unbekannte Einheit';
        if (u.hp <= 0) return 'Einheit gefallen';
        if (!$.isOnField(state, u.ref)) return 'Einheit nicht im Feld';

        if (state.mode === 'coop' && u.side === 'ally' && state.sides.ally.owners) {
            if (state.sides.ally.owners[u.ref] !== action.playerId) {
                return 'fremder Slot';
            }
        }

        switch (action.type) {
            case 'attack':
            case 'combo':
            case 'transform':
                var s = $.skill(action.skillId);
                if (!s) return 'unbekannte Faehigkeit';
                if (u.skills.indexOf(action.skillId) < 0 && s.kind === 'normal') {
                    return 'Faehigkeit nicht gelernt';
                }
                if (!$.canAfford(u, s)) return 'Ausdauer reicht nicht';
                if (s.kind === 'combo' || s.kind === 'transform') {
                    if (state.sides[u.side].gauge < s.gaugeCost) return 'Barometer reicht nicht';
                }
                if (s.kind === 'combo') {
                    var p = $.unit(state, action.partner);
                    if (!p || p.hp <= 0 || !$.isOnField(state, p.ref)) return 'Partner nicht verfuegbar';
                    if (p.side !== u.side) return 'Partner auf falscher Seite';
                    if (!$.canAfford(p, s)) return 'Ausdauer des Partners reicht nicht';
                }
                return null;

            case 'switch':
                var target = $.unit(state, action.target);
                if (!target) return 'unbekanntes Wechselziel';
                if (target.hp <= 0) return 'Wechselziel gefallen';
                if (state.sides[u.side].bench.indexOf(action.target) < 0) return 'Ziel nicht auf der Bank';
                return null;

            case 'capture':
                if (state.mode === 'pvp') return 'Fangen im PVP nicht moeglich';
                var ct = $.unit(state, action.target);
                if (!ct || ct.side !== 'foe' || ct.hp <= 0) return 'ungueltiges Fangziel';
                return null;

            case 'pass':
                return null;
        }
        return 'unbekannter Aktionstyp';
    };

    //=========================================================================
    // Phase 1 - Rundenbeginn
    //=========================================================================

    $.beginRound = function (state) {
        var events = [];
        state.round++;
        state.rngCursor = 0;
        state.phase = 'select';

        var units = allActive(state);
        var i, u;

        // 2. Ausdauerregeneration (verbraucht keinen Zufall)
        for (i = 0; i < units.length; i++) {
            regenStamina(state, units[i], $.config.staminaRegen, events);
        }

        // 3. Zustandseffekte am Rundenbeginn - Haken fuer spaeter
        // (Gift, Regeneration; noch nicht spezifiziert)

        // 4. Handlungsmarkierung zuruecksetzen
        for (i = 0; i < units.length; i++) units[i].hasActed = false;

        // 5. Gleichstandswert ziehen - feste Slot-Reihenfolge, einmal pro Runde.
        //    Stabil ueber die ganze Runde, damit die Neusortierung in Phase 5
        //    das Ergebnis nicht von der Anzahl der Durchlaeufe abhaengig macht.
        for (i = 0; i < units.length; i++) {
            units[i].tiebreak = drawInt(state, 0, 65535);
        }

        // 6. Erschoepfung melden
        for (i = 0; i < units.length; i++) {
            u = units[i];
            if ($.mustPause(u)) {
                events.push({ t: 'exhausted', actor: u.ref });
            }
        }

        events.push({ t: 'round_begin', round: state.round });
        return events;
    };

    //=========================================================================
    // Phase 5 - Auflösung
    //=========================================================================

    function actionPriority(action) {
        if (!action) return -99;
        if (action.type === 'switch') return $.PRIORITY_SWITCH;
        if (action.type === 'item') return $.PRIORITY_ITEM;
        if (action.type === 'pass') return -99;
        if (action.priority !== undefined) return action.priority;
        var s = $.skill(action.skillId);
        return s ? s.priority : 0;
    }

    $.actionPriority = actionPriority;

    /**
     * Loest eine komplette Runde auf.
     *
     * Zwei Punkte, die leicht falsch gemacht werden und deshalb hier
     * ausdruecklich stehen:
     *
     *   hasActed wird VOR der Auflösung gesetzt. Sonst kann eine Aktion, die
     *   die Warteschlange umsortiert, denselben Akteur erneut an die Spitze
     *   bringen - er handelte zweimal.
     *
     *   Neu sortiert wird bei JEDEM Durchlauf. Genau daraus ergibt sich, dass
     *   Prioritaetsstufen zu Rundenbeginn wirken und eine Aktion, die AGI oder
     *   Prioritaet eines noch nicht gehandelten Akteurs aendert, sofort auf
     *   die restliche Runde durchschlaegt.
     */
    $.resolveRound = function (state, actions) {
        var events = [];
        state.phase = 'resolve';

        var map = {};
        var i;
        for (i = 0; i < actions.length; i++) {
            map[actions[i].actor] = actions[i];
        }

        var guard = 0;
        while (true) {
            if (++guard > 64) {
                events.push({ t: 'error', reason: 'Auflösungsschleife abgebrochen' });
                break;
            }

            var cands = allActive(state).filter(function (u) {
                return !u.hasActed && map[u.ref];
            });
            if (cands.length === 0) break;

            cands.sort(function (a, b) {
                var pa = actionPriority(map[a.ref]);
                var pb = actionPriority(map[b.ref]);
                if (pa !== pb) return pb - pa;
                var ga = effParam(a, 6);
                var gb = effParam(b, 6);
                if (ga !== gb) return gb - ga;
                return b.tiebreak - a.tiebreak;
            });

            var actor = cands[0];
            var action = map[actor.ref];

            actor.hasActed = true;
            if (action.type === 'combo' && action.partner) {
                var partner = $.unit(state, action.partner);
                if (partner) partner.hasActed = true;
            }

            resolveAction(state, actor, action, events);
        }

        return events;
    };

    function resolveAction(state, actor, action, events) {
        // Statuszustände können die Aktion vor allem anderen verhindern
        // (Schlaf, Frost, Paralyse-Aussetzer, Verwirrungs-Selbsttreffer).
        // Der Zug ist dann verbraucht, ohne dass Ausdauer fließt.
        if (preActionStatus(state, actor, events)) return;

        // Zweite Ausdauerpruefung (Spezifikation 3.1). Die Ausdauer kann
        // zwischen Wahl und Auflösung durch einen Gegnereffekt gesunken sein.
        // Wird hier nicht geprueft, laufen Client und Server auseinander.
        var skill = $.skill(action.skillId);
        if ((action.type === 'attack' || action.type === 'combo' || action.type === 'transform')
            && skill && !$.canAfford(actor, skill)) {
            events.push({ t: 'pause', actor: actor.ref, reason: 'exhausted' });
            regenStamina(state, actor, $.config.staminaRegenPause, events);
            return;
        }

        switch (action.type) {
            case 'attack': return resolveAttack(state, actor, action, events);
            case 'combo': return resolveCombo(state, actor, action, events);
            case 'transform': return resolveTransform(state, actor, action, events);
            case 'switch': return resolveSwitch(state, actor, action, events);
            case 'capture': return resolveCapture(state, actor, action, events);
            case 'pass': return resolvePass(state, actor, events);
        }
    }

    //=========================================================================
    // Zielauflösung
    //=========================================================================

    /**
     * Spezifikation 6.5: ist das Ziel bei der Auflösung gefallen, gewechselt
     * oder gefangen, wird auf ein anderes gueltiges Ziel derselben Seite
     * umgeleitet. Gibt es keines, verpufft die Aktion.
     */
    function resolveTargets(state, actor, skill, requested, events) {
        var foeSide = $.opposing(actor.side);

        if (skill.target === 'self') return [actor];
        if (skill.target === 'allFoes') return $.activeUnits(state, foeSide);

        var t = requested ? $.unit(state, requested) : null;
        if (t && t.hp > 0 && $.isOnField(state, t.ref)) return [t];

        var alt = $.activeUnits(state, foeSide);
        if (alt.length > 0) {
            events.push({ t: 'redirect', from: requested || null, to: alt[0].ref });
            return [alt[0]];
        }
        return [];
    }

    //=========================================================================
    // Schaden
    //=========================================================================

    /**
     * Zufallsverbrauch je Ziel: Treffer, Krit, Varianz - in dieser Reihenfolge.
     * Bei accuracy >= 100 entfaellt die Trefferpruefung ohne Zug.
     */
    function applyDamage(state, attacker, target, skill, events, powerMult) {
        if (skill.accuracy < 100) {
            var roll = drawInt(state, 1, 100);
            if (roll > skill.accuracy) {
                events.push({ t: 'miss', actor: attacker.ref, target: target.ref });
                return false;
            }
        }

        var luk = effParam(attacker, 7);
        var critChance = $.config.critBase + luk / 20;
        var crit = drawInt(state, 1, 1000) <= Math.round(critChance * 10);

        var variance = drawInt(state, $.config.varianceMin, 100) / 100;

        var isPhys = skill.category === 'phys';
        var A = effParam(attacker, isPhys ? 2 : 4);
        var D = effParam(target, isPhys ? 3 : 5);
        var power = skill.power * (powerMult || 1);

        var base = Math.floor(
            Math.floor(Math.floor(2 * attacker.level / 5 + 2) * power * A / D) / 50
        ) + 2;

        var atkTypes = unitTypes(attacker);
        var defTypes = unitTypes(target);
        var stab = (skill.element > 0 && atkTypes.indexOf(skill.element) >= 0) ? $.config.stab : 1.0;
        var eff = skill.element > 0 ? MC.Core.elementRateFor(defTypes, skill.element) : 1.0;

        var dmg = Math.floor(base * stab * eff * variance * (crit ? 1.5 : 1.0));
        if (eff > 0) dmg = Math.max(1, dmg);

        target.hp = Math.max(0, target.hp - dmg);

        events.push({
            t: 'damage',
            actor: attacker.ref,
            target: target.ref,
            amount: dmg,
            effectiveness: eff,
            crit: crit,
            hp: target.hp
        });

        // Rückgabe = Treffer bestanden (Genauigkeit), unabhängig von der
        // Typwirkung. Ob ein Zusatzeffekt greift, entscheidet die separate
        // Status-Immunität in applyStatus.
        return true;
    }

    //=========================================================================
    // Aktionstypen
    //=========================================================================

    /** Nur-Treffer-Prüfung für schadenslose Fähigkeiten (Schritt 1). */
    function rollAccuracy(state, attacker, target, skill, events) {
        if (skill.accuracy < 100) {
            if (drawInt(state, 1, 100) > skill.accuracy) {
                events.push({ t: 'miss', actor: attacker.ref, target: target.ref });
                return false;
            }
        }
        return true;
    }

    function resolveAttack(state, actor, action, events) {
        var skill = $.skill(action.skillId);
        spendStamina(state, actor, $.staminaCost(skill), events);

        var targets = resolveTargets(state, actor, skill, action.target, events);
        if (targets.length === 0) {
            events.push({ t: 'fizzle', actor: actor.ref, reason: 'kein Ziel' });
            return;
        }

        events.push({ t: 'use', actor: actor.ref, skillId: skill.id, kind: 'normal' });

        // Schadenslose Statusangriffe ziehen keinen Krit-/Varianzwurf (Schritte
        // 2 und 3 entfallen), nur Treffer (1) und Effekt (4).
        var damaging = skill.category !== 'status' && skill.power > 0;
        var anyDamage = false;
        for (var i = 0; i < targets.length; i++) {
            var landed = damaging
                ? applyDamage(state, actor, targets[i], skill, events)
                : rollAccuracy(state, actor, targets[i], skill, events);
            if (landed) {
                applyEffects(state, actor, targets[i], skill, events);
                if (damaging) anyDamage = true;
            }
        }

        // Barometer fuellt nur bei Schaden, einmal pro Aktion - nicht pro Ziel.
        // Sonst skaliert die Mechanik an Mehrfachangriffen vorbei.
        if (anyDamage && skill.gauge > 0) {
            addGauge(state, actor.side, skill.gauge, events);
        }
    }

    function resolveCombo(state, actor, action, events) {
        var skill = $.skill(action.skillId);
        var partner = $.unit(state, action.partner);
        var side = state.sides[actor.side];

        // Tor 3: Bestaetigung. Nur im Koop - im Single und PVP steuert ein
        // Spieler beide Slots, eine Rueckfrage waere sinnlos.
        if (state.mode === 'coop' && action.confirmed !== true) {
            events.push({
                t: 'combo_failed',
                actor: actor.ref,
                partner: action.partner,
                reason: action.confirmed === false ? 'declined' : 'timeout'
            });
            regenStamina(state, actor, $.config.staminaRegenFailed, events);
            if (partner) regenStamina(state, partner, $.config.staminaRegenFailed, events);
            // Weder Barometer noch Ausdauerkosten werden verbraucht.
            return;
        }

        if (!partner || partner.hp <= 0 || !$.isOnField(state, partner.ref)) {
            events.push({ t: 'combo_failed', actor: actor.ref, reason: 'partner_gone' });
            regenStamina(state, actor, $.config.staminaRegenFailed, events);
            return;
        }

        if (side.gauge < skill.gaugeCost) {
            events.push({ t: 'combo_failed', actor: actor.ref, reason: 'gauge' });
            regenStamina(state, actor, $.config.staminaRegenFailed, events);
            return;
        }

        if (!$.canAfford(partner, skill)) {
            events.push({ t: 'combo_failed', actor: actor.ref, reason: 'partner_stamina' });
            regenStamina(state, actor, $.config.staminaRegenFailed, events);
            return;
        }

        // Alle Tore offen: erst jetzt wird bezahlt.
        spendStamina(state, actor, $.staminaCost(skill), events);
        spendStamina(state, partner, $.staminaCost(skill), events);
        addGauge(state, actor.side, -skill.gaugeCost, events);

        var targets = resolveTargets(state, actor, skill, action.target, events);
        if (targets.length === 0) {
            events.push({ t: 'fizzle', actor: actor.ref, reason: 'kein Ziel' });
            return;
        }

        events.push({
            t: 'use', actor: actor.ref, partner: partner.ref,
            skillId: skill.id, kind: 'combo'
        });

        for (var i = 0; i < targets.length; i++) {
            applyDamage(state, actor, targets[i], skill, events);
            applyEffects(state, actor, targets[i], skill, events);
        }
        // Kombos fuellen das Barometer nicht.
    }

    /**
     * Verwandlung. Setzt eine temporaere Ueberlagerung im Kampfzustand.
     * Ruft ausdruecklich NICHT Game_Monster.evolveInto() auf - das schriebe
     * die speciesId dauerhaft ins Monster und im Account-Modus auf den Server.
     */
    function resolveTransform(state, actor, action, events) {
        var skill = $.skill(action.skillId);
        var side = state.sides[actor.side];

        if (side.gauge < skill.gaugeCost) {
            events.push({ t: 'fizzle', actor: actor.ref, reason: 'gauge' });
            return;
        }

        spendStamina(state, actor, $.staminaCost(skill), events);
        addGauge(state, actor.side, -skill.gaugeCost, events);

        actor.form = JSON.parse(JSON.stringify(skill.form || {}));
        actor.form.remaining = (skill.form && skill.form.duration) || 3;

        events.push({
            t: 'transform', actor: actor.ref,
            form: actor.form.name || '', duration: actor.form.remaining
        });
    }

    function resolveSwitch(state, actor, action, events) {
        var side = state.sides[actor.side];
        var incoming = $.unit(state, action.target);
        if (!incoming || incoming.hp <= 0) {
            events.push({ t: 'fizzle', actor: actor.ref, reason: 'Wechselziel weg' });
            return;
        }

        var fieldIdx = side.field.indexOf(actor.ref);
        var benchIdx = side.bench.indexOf(incoming.ref);
        if (fieldIdx < 0 || benchIdx < 0) {
            events.push({ t: 'fizzle', actor: actor.ref, reason: 'Wechsel ungueltig' });
            return;
        }

        side.field[fieldIdx] = incoming.ref;
        side.bench[benchIdx] = actor.ref;

        // Verwandlung endet beim Verlassen des Feldes.
        actor.form = null;
        actor.buffs = [0, 0, 0, 0, 0, 0, 0, 0];

        events.push({ t: 'switch', out: actor.ref, in: incoming.ref, slot: fieldIdx });
    }

    /**
     * Fangformel ist provisorisch (Spezifikation 11.9). Eigenschaften, die
     * feststehen: nur MC.Core.RNG, serverseitig entschieden, der Client
     * erfaehrt das Ergebnis und nicht den Wurf.
     */
    function resolveCapture(state, actor, action, events) {
        var target = $.unit(state, action.target);
        if (!target || target.hp <= 0 || !$.isOnField(state, target.ref)) {
            events.push({ t: 'fizzle', actor: actor.ref, reason: 'Fangziel weg' });
            return;
        }

        var ballFactor = action.ballFactor || 1.0;
        var a = ((3 * target.mhp - 2 * target.hp) * target.captureRate * ballFactor)
            / (3 * target.mhp);
        var chance = Math.min(1, a / 255);
        var success = draw(state) < chance;

        events.push({
            t: 'capture', actor: actor.ref, target: target.ref,
            success: success, chance: Math.round(chance * 1000) / 1000
        });

        if (success) {
            var side = state.sides.foe;
            var idx = side.field.indexOf(target.ref);
            if (idx >= 0) side.field[idx] = null;
            target.captured = true;
        }
    }

    function resolvePass(state, actor, events) {
        events.push({ t: 'pause', actor: actor.ref, reason: 'chosen' });
        regenStamina(state, actor, $.config.staminaRegenPause, events);
    }

    //=========================================================================
    // Phase 6 - Rundenende
    //=========================================================================

    $.endRound = function (state) {
        var events = [];
        var i, u;

        // 1. Zustandsschaden am Rundenende (Gift, Verbrennung).
        var units = allActive(state);
        for (i = 0; i < units.length; i++) {
            tickStatusDamage(state, units[i], events);
        }

        // Verwandlungsdauer
        for (i = 0; i < units.length; i++) {
            u = units[i];
            if (u.form && u.form.remaining !== undefined) {
                u.form.remaining--;
                if (u.form.remaining <= 0) {
                    u.form = null;
                    events.push({ t: 'transform_end', actor: u.ref });
                }
            }
        }

        // 2. Ohnmachtspruefung
        var sides = ['ally', 'foe'];
        for (var s = 0; s < sides.length; s++) {
            var side = state.sides[sides[s]];
            for (i = 0; i < side.field.length; i++) {
                var ref = side.field[i];
                if (!ref) continue;
                var fu = state.units[ref];
                if (fu && fu.hp <= 0 && !fu.fainted) {
                    fu.fainted = true;
                    events.push({ t: 'faint', target: ref });
                }
            }
        }

        // 3. Nachruecken
        for (s = 0; s < sides.length; s++) {
            fillEmptySlots(state, sides[s], events);
        }

        events.push({ t: 'round_end', round: state.round });
        return events;
    };

    /**
     * Fuellt leere Feldplaetze automatisch auf. Bewusste Vereinfachung:
     * spielerisch waere eine eigene Wahlphase besser ("wer kommt nach?"), das
     * ist aber eine zusaetzliche Protokollphase. Der Haken sitzt hier.
     */
    function fillEmptySlots(state, sideKey, events) {
        var side = state.sides[sideKey];
        var pool = sideKey === 'foe' ? side.queue : side.bench;

        for (var i = 0; i < side.field.length; i++) {
            var ref = side.field[i];
            var u = ref ? state.units[ref] : null;
            if (u && u.hp > 0) continue;

            var next = null;
            for (var j = 0; j < pool.length; j++) {
                var cand = state.units[pool[j]];
                if (cand && cand.hp > 0) { next = pool.splice(j, 1)[0]; break; }
            }
            if (next === null) {
                side.field[i] = ref && u && u.hp > 0 ? ref : (u ? ref : null);
                continue;
            }
            if (u) pool.push(ref);
            side.field[i] = next;
            events.push({ t: 'send_out', side: sideKey, slot: i, unit: next });
        }
    }

    //=========================================================================
    // Phase 7 - Kampfende
    //=========================================================================

    function sideHasFighters(state, sideKey) {
        var side = state.sides[sideKey];
        var pools = [side.field, side.bench, side.queue];
        for (var p = 0; p < pools.length; p++) {
            for (var i = 0; i < pools[p].length; i++) {
                var ref = pools[p][i];
                if (!ref) continue;
                var u = state.units[ref];
                if (u && u.hp > 0 && !u.captured) return true;
            }
        }
        return false;
    }

    /** @return {null|'win'|'lose'} */
    $.checkEnd = function (state) {
        if (!sideHasFighters(state, 'foe')) return 'win';
        if (!sideHasFighters(state, 'ally')) return 'lose';
        return null;
    };

    //=========================================================================
    // Vollständige Runde
    //=========================================================================

    /**
     * Bequemlichkeitsfunktion fuer Tests und Singleplayer. Der Server ruft
     * die Phasen einzeln auf, weil zwischen Wahl und Auflösung Netzverkehr
     * liegt.
     */
    $.playRound = function (state, actions) {
        var events = [];
        events = events.concat($.beginRound(state));
        events = events.concat($.resolveRound(state, actions));
        events = events.concat($.endRound(state));
        var result = $.checkEnd(state);
        if (result) {
            state.result = result;
            state.phase = 'end';
            events.push({ t: 'battle_end', result: result });
        }
        return events;
    };

    //=========================================================================
    // Rückschreibung
    //=========================================================================

    /**
     * Uebersetzt den Kampfzustand in Aenderungen am Datenmodell. Der Kampf
     * schreibt nie direkt in $gameMonsters - erst hier, und im PVP gar nicht.
     *
     * @return {object} { hp: {uid: wert}, captured: [refs] }
     */
    $.writeBack = function (state) {
        var out = { hp: {}, captured: [], result: state.result };
        if (state.mode === 'pvp') return out;

        var refs = Object.keys(state.units).sort();
        for (var i = 0; i < refs.length; i++) {
            var u = state.units[refs[i]];
            if (u.side === 'ally') {
                out.hp[u.uid] = u.hp;
            } else if (u.captured) {
                out.captured.push(u.ref);
            }
        }
        return out;
    };

})(MC.Battle);

//=============================================================================
// Einbindung in MV
//=============================================================================

(function () {
    'use strict';

    if (typeof DataManager === 'undefined') return;

    var _loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function () {
        _loadDatabase.call(this);
        DataManager._mcSkillsBuilt = false;
        DataManager.loadDataFile('$dataMonsterSkills', MC.Battle.config.skillFile);
    };

    var _isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () {
        if (!_isDatabaseLoaded.call(this)) return false;
        if (!$dataMonsterSkills) return false;
        if (!DataManager._mcSkillsBuilt) {
            MC.Battle.buildSkillRegistry($dataMonsterSkills);
            DataManager._mcSkillsBuilt = true;
        }
        return true;
    };

})();
