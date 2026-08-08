/*:
 * @plugindesc Macht alle Fenster im RPG Maker MV komplett undurchsichtig.
 * @author Niklas
 */

(function() {

    Window_Base.prototype.standardBackOpacity = function() {
        return 255;
    };

    Window_Base.prototype.standardOpacity = function() {
        return 255;
    };

    Window_Message.prototype.standardBackOpacity = function() {
    return 255;
    };

})();