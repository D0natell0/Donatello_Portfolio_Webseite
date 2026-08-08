//=============================================================================
// ExitCommandButton.js
//=============================================================================

/*:
 * @plugindesc Adds exit command in the title screen and Game End menu.
 * @author Zeon013
 *
 * @help This plugin is plug and play.
 */

(function() {

	var  _Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow
	Scene_Title.prototype.createCommandWindow = function() {
		_Scene_Title_createCommandWindow.call(this);
		this._commandWindow.setHandler('exit', this.commandExit.bind(this));
	};

	Scene_Title.prototype.commandExit = function() {
    SceneManager.terminate();
	};

	var _Window_TitleCommand_makeCommandList = Window_TitleCommand.prototype.makeCommandList
	Window_TitleCommand.prototype.makeCommandList = function() {
		_Window_TitleCommand_makeCommandList.call(this);
		this.addCommand('Beenden', 'exit');
	};

	var _GameEnd_makeCommandList = Window_GameEnd.prototype.makeCommandList
	Window_GameEnd.prototype.makeCommandList = function() {
		_GameEnd_makeCommandList.call(this);
		this.addCommand('Beenden',  'exit');
	};

	var _Scene_GameEnd_createCommandWindow = Scene_GameEnd.prototype.createCommandWindow
	Scene_GameEnd.prototype.createCommandWindow = function() {
		_Scene_GameEnd_createCommandWindow.call(this);
		this._commandWindow.setHandler('exit',  this.commandExit.bind(this));
	};

	Scene_GameEnd.prototype.commandExit = function() {
    SceneManager.terminate();
	};

})();