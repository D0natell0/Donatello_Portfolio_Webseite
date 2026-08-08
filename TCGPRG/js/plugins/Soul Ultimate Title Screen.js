//-------------------------------------------------------------------------------------------
// SOUL Ultimate Title Screen.js
//-------------------------------------------------------------------------------------------
/*:
* @plugindesc The best and ultimate multiple functioned title screen designer.
* @author Soulpour777
* 
* @help
Soul Ultimate Title Screen
Author: Soulpour777

INTRODUCTION

Are you tired using the same title screen plugin over and over
again with your multiple RPG Maker MV games? Are you tired seeing
the same particle system and design overused in your games?
Introducing Soul Ultimate Title Screen, the plugin that would
allow you to design your title screen the way you want it,
the way you want it remembered!

FEATURES
- Mouse Supported, Adjustable, Multiple Buttons
- Multiple Fogs
- Multiple Overlay Images
- Adjustable Logo
- Extra Objects
- Mouse Effects
- Particle System (Built In)

HELP DOCUMENTATION

Current Version: 1.0 as of 6 / 13 / 2016
 - Original Creation Date

Each button is categorized within Position and Image.

X and Y determines what part in the screen they
will be displayed. Each has their own function
and you can use your mouse or tap from your
mobile (once exported) to select it.

LOGO

A. X and Y Axis

There are only two properties of the logo, the x and y
axis. You can place the logo anywhere you want,
as opposed to the default centered logo. The logo
is no other than the Title Logo Image, that you
can set up via the plugin parameter.

Other images aside from title backgrounds should be in img / ultimate_title folder

BUTTONS

A. Image

You can set up which image is used for each action that
is executed by the button, either active or inactive.

B. X and Y Axis

You can setup the image's position via the X and Y
property of the buttons.

FOGS

Fogs have Scrollable properties. It means that
you can scroll them both horizontally, 
verrtically or diagonally depending on the
speed and direction you placed on the Scroll
X and Scroll Y properties.

You can also decide whether you want to use them or
not using the Use Property.

TITLE OBJECTS

A. Property
The title objects are images that can be displayed on the
screen that have three properties. It can be a:

Sprite - a Sprite Object.
TilingSprite - a scrollable image.
Sprite_Button - you can tie in a function once the image
is clicked / tapped.

B. Action
When you use the 'website' action for the title object,
you can go to the WEB tag and place down the website URL
that the game engine would go to once the title object
is clicked / tapped.

When you use the 'command' action for the title object,
you can go to the CMD tag and place down the function code
that the game engine would execute once the title object
is clicked / tapped. The user of this plugin is adviced
that you only use the command property if you have an
advanced knowledge in JavaScript or you know what functions
you can place inside the command. If they don't exist,
it will return you an error.

CHAPTER SYSTEM

The Chapter System allows you to change the background
used in the title screen depending on what chapter
currently the game is in. This only works
if you are in game, changed the chapter and return
to the title screen.

To change a chapter, do this plugin command:

Soul_UltimateTitleScreen Chapter_Set x

where x is the chapter number you want the title
to change into.

The title backgrounds should be inside img / titles1

The naming is done like this: 'Chapter' + Chapter Number.
So the background for Chapter 1 should be named 'Chapter1'.
That goes for 2...3... and so on.

MOUSE EFFECT

A mouse effect is another feature of the ultimate title screen.
What the mouse effect does is that when the mouse accepts a condition, 
the title screen background actually creates an
effect. By default, the user of the plugin is given the property
that the background changes opacity. But, there are other effects
that you can do.

    Conditions
        - When the mouse reaches the end of the screen
        - when the mouse is clicked

For the ambitious users, they can create their own effects via
javascript eval commands!

Each condition is determined from each eval function the user
is going to input.


Game Screen functions don't work, for a headstart.

MULTIPLE IMAGES

Another feature that this plugin that needs explanation is
the multiple images overlay.

What this means is that your background will be overlayed
with 26 other images that you place in the plugin manager.
They are, however, overlayed below the logo, so they
need to appear perfectly on the screen and blend
with the logo and the other overlays. Please be
reminded that each overlay are placed numerically.

1 is overlayed with 2, 2 with 3, etc.

PARTICLE SYSTEM

You can also have some small particle system effect
on the title screen. Each function on the last
part of the plugin's commands denote this.

For my terms of use: https://soulxregalia.wordpress.com/terms-of-use/

Thank you for using this plugin. 
Each parameter is well explained in the Plugin Manager.

*
* @param -- SETTING --
*
* @param Command Visible
* @desc Would you like the command to be visible?
* @default false
*
* @param Command Selectable
* @desc Would you like the command to be seen and selectable on screen?
* @default false
*
* @param Use Title 1
* @desc Would you like to show and use Title Image 1 on the screen? 
* @default false
*
* @param Title 1 Property
* @desc What is the property of Title Image 1? Choices: (Sprite / TilingSprite / Sprite_Button) 
* @default Sprite_Button
*
* @param Title 1 Action
* @desc What is the action of Title Image 1? Choices: (website / command) 
* @default website
*
* @param WEB | Title 1
* @desc If you chose 'website' as Title 1 Action, what's the URL of your website when this button is clicked?
* @default https://www.wattpad.com/user/Fuurinkazan
*
* @param CMD | Title 1
* @desc If you chose 'command' as Title 1 Action, what's the javascript command activated when clicked?
* @default this.commandNewGame();
*
* @param Title 1 Scroll X
* @desc If you chose 'TilingSprite' as a property, this is the horizontal scroll value and speed for Title Image #1.
* @default 0
*
* @param Title 1 Scroll Y
* @desc If you chose 'TilingSprite' as a property, this is the vertical scroll value and speed for Title Image #1.
* @default 0
*
* @param Use Title 2
* @desc Would you like to show and use Title Image 2 on the screen? 
* @default false
*
* @param Title 2 Property
* @desc What is the property of Title Image 2? Choices: (Sprite / TilingSprite / Sprite_Button) 
* @default Sprite_Button
*
* @param Title 2 Action
* @desc What is the action of Title Image 2? Choices: (website / command) 
* @default website
*
* @param WEB | Title 2
* @desc If you chose 'website' as Title 2 Action, what's the URL of your website when this button is clicked?
* @default 
*
* @param CMD | Title 2
* @desc If you chose 'command' as Title 2 Action, what's the javascript command activated when clicked?
* @default 
*
* @param Title 2 Scroll X
* @desc If you chose 'TilingSprite' as a property, this is the horizontal scroll value and speed for Title Image #2.
* @default 0
*
* @param Title 2 Scroll Y
* @desc If you chose 'TilingSprite' as a property, this is the vertical scroll value and speed for Title Image #2.
* @default 0
*
* @param Use Title 3
* @desc Would you like to show and use Title Image 3 on the screen? 
* @default false

* @param Title 3 Property
* @desc What is the property of Title Image 3? Choices: (Sprite / TilingSprite / Sprite_Button) 
* @default Sprite_Button
*
* @param Title 3 Action
* @desc What is the action of Title Image 3? Choices: (website / command) 
* @default website
*
* @param WEB | Title 3
* @desc If you chose 'website' as Title 3 Action, what's the URL of your website when this button is clicked?
* @default 
*
* @param CMD | Title 3
* @desc If you chose 'command' as Title 3 Action, what's the javascript command activated when clicked?
* @default 
*
* @param Title 3 Scroll X
* @desc If you chose 'TilingSprite' as a property, this is the horizontal scroll value and speed for Title Image #3.
* @default 0
*
* @param Title 3 Scroll Y
* @desc If you chose 'TilingSprite' as a property, this is the vertical scroll value and speed for Title Image #3.
* @default 0
*
* @param Use Title 4
* @desc Would you like to show and use Title Image 4 on the screen? 
* @default false
*
* @param Title 4 Property
* @desc What is the property of Title Image 4? Choices: (Sprite / TilingSprite / Sprite_Button) 
* @default Sprite_Button
*
* @param Title 4 Action
* @desc What is the action of Title Image 4? Choices: (website / command) 
* @default website
*
* @param WEB | Title 4
* @desc If you chose 'website' as Title 4 Action, what's the URL of your website when this button is clicked?
* @default 
*
* @param CMD | Title 4
* @desc If you chose 'command' as Title 4 Action, what's the javascript command activated when clicked?
* @default 
*
* @param Title 4 Scroll X
* @desc If you chose 'TilingSprite' as a property, this is the horizontal scroll value and speed for Title Image #4.
* @default 0
*
* @param Title 4 Scroll Y
* @desc If you chose 'TilingSprite' as a property, this is the vertical scroll value and speed for Title Image #4.
* @default 0
*
* @param Use Title 5
* @desc Would you like to show and use Title Image 5 on the screen? 
* @default false
*
* @param Title 5 Property
* @desc What is the property of Title Image 5? Choices: (Sprite / TilingSprite / Sprite_Button) 
* @default Sprite_Button
*
* @param Title 5 Action
* @desc What is the action of Title Image 5? Choices: (website / command) 
* @default website
*
* @param WEB | Title 5
* @desc If you chose 'website' as Title 5 Action, what's the URL of your website when this button is clicked?
* @default 
*
* @param CMD | Title 5
* @desc If you chose 'command' as Title 5 Action, what's the javascript command activated when clicked?
* @default 
*
* @param Title 5 Scroll X
* @desc If you chose 'TilingSprite' as a property, this is the horizontal scroll value and speed for Title Image #5.
* @default 0
*
* @param Title 5 Scroll Y
* @desc If you chose 'TilingSprite' as a property, this is the vertical scroll value and speed for Title Image #5.
* @default 0
*
* @param Use Title 6
* @desc Would you like to show and use Title Image 6 on the screen? 
* @default false

* @param Title 6 Property
* @desc What is the property of Title Image 6? Choices: (Sprite / TilingSprite / Sprite_Button) 
* @default Sprite_Button
*
* @param Title 6 Action
* @desc What is the action of Title Image 6? Choices: (website / command) 
* @default website
*
* @param WEB | Title 6
* @desc If you chose 'website' as Title 6 Action, what's the URL of your website when this button is clicked?
* @default 
*
* @param CMD | Title 6
* @desc If you chose 'command' as Title 6 Action, what's the javascript command activated when clicked?
* @default 
*
* @param Title 6 Scroll X
* @desc If you chose 'TilingSprite' as a property, this is the horizontal scroll value and speed for Title Image #6.
* @default 0
*
* @param Title 6 Scroll Y
* @desc If you chose 'TilingSprite' as a property, this is the vertical scroll value and speed for Title Image #6.
* @default 0
*
* @param -- POSITION --
*
* @param Logo X Axis
* @desc X axis of logo image.
* @default 0
*
* @param Logo Y Axis
* @desc Y axis of logo image.
* @default -20
*
* @param Press Start X Axis
* @desc X axis of Press Start button image.
* @default 150
*
* @param Press Start Y Axis
* @desc Y axis of Press Start button image.
* @default 440
*
* @param Press Start Frame Count
* @desc The opacity frame count of Press Start button image to blink on screen.
* @default 10
*
* @param New Game X
* @desc The x axis of the New Game button.
* @default 460
*
* @param New Game Y
* @desc The y axis of the New Game button.
* @default 260
*
* @param Continue Game X
* @desc The x axis of the Continue button.
* @default 460
*
* @param Continue Game Y
* @desc The y axis of the Continue button.
* @default 320
*
* @param Options X
* @desc The x axis of the Options button.
* @default 460
*
* @param Options Y
* @desc The y axis of the Options button.
* @default 380
*
* @param -- IMAGES --
*
* @param Press Start Image
* @desc Image file name for your Press Start Button.
* @default Press_Start
*
* @param Backsprite3 1
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 1 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 1 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 2
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 2 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 2 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 3
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 3 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 3 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 4
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 4 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 4 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 5
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 5 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 5 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 6
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 6 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 6 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 7
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 7 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 7 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 8
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 8 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 8 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 9
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 9 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 9 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 10
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 10 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 10 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 11
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 11 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 11 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 12
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 12 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 12 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 13
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 13 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 13 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 14
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 14 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 14 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 15
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 15 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 15 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 16
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 16 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 16 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 17
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 17 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 17 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 18
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 18 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 18 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 19
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 19 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 19 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 20
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 20 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 20 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 21
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 21 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 21 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 22
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 22 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 22 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 23
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 23 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 23 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 24
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 24 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 24 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 25
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 25 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 25 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 26
* @desc The image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 26 X
* @desc X position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Backsprite3 26 Y
* @desc Y position of the image overlayed on top of the background before the logo.
* @default 
*
* @param Title Logo Image
* @desc Image file name for your title logo.
* @default Logo
*
* @param New Game On Image
* @desc Image used for the New Game Option
* @default new_game
*
* @param New Game Off Image
* @desc Image used if the New Game command is not selected
* @default new_gameOff
*
* @param Continue On Image
* @desc Image used for the Continue Option
* @default continue
*
* @param Continue Off Image
* @desc Image used if the Continue command is not selected
* @default continueOff
*
* @param Continue Unavailable Image
* @desc Image used if save file does not exist in your game.
* @default continueOffNoSave
*
* @param Options On Image
* @desc Image used if Options command is being selected.
* @default options
*
* @param Options Off Image
* @desc Image used if Options command is not being selected.
* @default optionsOff
*
* @param Credits On Image
* @desc Image used if Options command is being selected.
* @default credits_on
*
* @param Credits Off Image
* @desc Image used if Options command is not being selected.
* @default credits_off

* @param Title 1 Image
* @desc First extra image visible on the screen. 
* @default twitter_logo
*
* @param Title 2 Image
* @desc Second extra image visible on the screen. 
* @default 
*
* @param Title 3 Image
* @desc First extra image visible on the screen. 
* @default 
*
* @param Title 4 Image
* @desc Second extra image visible on the screen. 
* @default 
*
* @param Title 5 Image
* @desc First extra image visible on the screen. 
* @default 
*
* @param Title 6 Image
* @desc Second extra image visible on the screen. 
* @default 
*
* @param -- FOGS --
*
* @param Use Fog1
* @desc Do you want to use Fog1 in your title screen?
* @default true
*
* @param Fog1 Image
* @desc What is the image name of Fog1 used?
* @default Fog_1
*
* @param Fog1 X Scroll
* @desc Horizontal movement of Fog1.
* @default 1
*
* @param Fog1 Y Scroll
* @desc Vertical movement of Fog1.
* @default 0
*
* @param Use Fog2
* @desc Do you want to use Fog2 in your title screen?
* @default true
*
* @param Fog2 Image
* @desc What is the image name of Fog2 used?
* @default Fog_2
*
* @param Fog2 X Scroll
* @desc Horizontal movement of Fog2.
* @default -1
*
* @param Fog2 Y Scroll
* @desc Vertical movement of Fog2.
* @default 0
*
* @param -- MOUSE EFFECTS --
*
* @param Effect1 Eval 1
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #1
* @default 
*
* @param Effect1 Eval 2
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #2
* @default 
*
* @param Effect1 Eval 3
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #3
* @default 
*
* @param Effect1 Eval 4
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #4
* @default 
*
* @param Effect1 Eval 5
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #5
* @default 
*
* @param Effect1 Eval 6
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #6
* @default 
*
* @param Effect1 Eval 7
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #7
* @default 
*
* @param Effect1 Eval 8
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #8
* @default 
*
* @param Effect1 Eval 9
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #9
* @default 
*
* @param Effect1 Eval 10
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #10
* @default 
*
* @param Effect2 Eval 1
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #1
* @default 
*
* @param Effect2 Eval 2
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #2
* @default 
*
* @param Effect2 Eval 3
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #3
* @default 
*
* @param Effect2 Eval 4
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #4
* @default 
*
* @param Effect2 Eval 5
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #5
* @default 
*
* @param Effect2 Eval 6
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #6
* @default 
*
* @param Effect2 Eval 7
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #7
* @default 
*
* @param Effect2 Eval 8
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #8
* @default 
*
* @param Effect2 Eval 9
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #9
* @default 
*
* @param Effect2 Eval 10
* @desc Javascript command that will be executed when the mouse reaches the end of the screen. #10
* @default 
*
* @param -- PARTICLES --
*
* @param Use Particles
* @desc Do you want to use particles in your title screen?
* @default true
*
* @param Particle Image
* @desc Image name of the Particle Image.
* @default glitter
*
* @param Max Particles
* @desc How many particles are drawn in the screen by default?
* @default 3
*
* @param Particle X Axis
* @desc Horizontal movement of particles.
* @default 0
*
* @param Particle Y Axis
* @desc Vertical movement of particles.
* @default -0.75
*
**/


(function(){

    var Imported = Imported || {};    
    var SOUL_MV = SOUL_MV || {};
    SOUL_MV.UltimateTitleSceeen = {};

    // Title Objects
    SOUL_MV.UltimateTitleSceeen.useTitle1 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Title 1"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.useTitle2 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Title 2"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.useTitle3 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Title 3"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.useTitle4 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Title 4"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.useTitle5 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Title 5"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.useTitle6 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Title 6"] === "true" ? true : false;

    // Title Object Properties
    SOUL_MV.UltimateTitleSceeen.title1Property = PluginManager.parameters('Soul Ultimate Title Screen')["Title 1 Property"];
    SOUL_MV.UltimateTitleSceeen.title2Property = PluginManager.parameters('Soul Ultimate Title Screen')["Title 2 Property"];
    SOUL_MV.UltimateTitleSceeen.title3Property = PluginManager.parameters('Soul Ultimate Title Screen')["Title 3 Property"];
    SOUL_MV.UltimateTitleSceeen.title4Property = PluginManager.parameters('Soul Ultimate Title Screen')["Title 4 Property"];
    SOUL_MV.UltimateTitleSceeen.title5Property = PluginManager.parameters('Soul Ultimate Title Screen')["Title 5 Property"];
    SOUL_MV.UltimateTitleSceeen.title6Property = PluginManager.parameters('Soul Ultimate Title Screen')["Title 6 Property"];

    // Title Actions

    SOUL_MV.UltimateTitleSceeen.title1ActionLaunch = PluginManager.parameters('Soul Ultimate Title Screen')["Title 1 Action"];
    SOUL_MV.UltimateTitleSceeen.title1ActionLaunchWEB = PluginManager.parameters('Soul Ultimate Title Screen')["WEB | Title 1"];
    SOUL_MV.UltimateTitleSceeen.title1ActionLaunchCMD = PluginManager.parameters('Soul Ultimate Title Screen')["CMD | Title 1"];

    SOUL_MV.UltimateTitleSceeen.title2ActionLaunch = PluginManager.parameters('Soul Ultimate Title Screen')["Title 2 Action"];
    SOUL_MV.UltimateTitleSceeen.title2ActionLaunchWEB = PluginManager.parameters('Soul Ultimate Title Screen')["WEB | Title 2"];
    SOUL_MV.UltimateTitleSceeen.title2ActionLaunchCMD = PluginManager.parameters('Soul Ultimate Title Screen')["CMD | Title 2"];

    SOUL_MV.UltimateTitleSceeen.title3ActionLaunch = PluginManager.parameters('Soul Ultimate Title Screen')["Title 3 Action"];
    SOUL_MV.UltimateTitleSceeen.title3ActionLaunchWEB = PluginManager.parameters('Soul Ultimate Title Screen')["WEB | Title 3"];
    SOUL_MV.UltimateTitleSceeen.title3ActionLaunchCMD = PluginManager.parameters('Soul Ultimate Title Screen')["CMD | Title 3"];

    SOUL_MV.UltimateTitleSceeen.title4ActionLaunch = PluginManager.parameters('Soul Ultimate Title Screen')["Title 4 Action"];
    SOUL_MV.UltimateTitleSceeen.title4ActionLaunchWEB = PluginManager.parameters('Soul Ultimate Title Screen')["WEB | Title 4"];
    SOUL_MV.UltimateTitleSceeen.title4ActionLaunchCMD = PluginManager.parameters('Soul Ultimate Title Screen')["CMD | Title 4"];

    SOUL_MV.UltimateTitleSceeen.title5ActionLaunch = PluginManager.parameters('Soul Ultimate Title Screen')["Title 5 Action"];
    SOUL_MV.UltimateTitleSceeen.title5ActionLaunchWEB = PluginManager.parameters('Soul Ultimate Title Screen')["WEB | Title 5"];
    SOUL_MV.UltimateTitleSceeen.title5ActionLaunchCMD = PluginManager.parameters('Soul Ultimate Title Screen')["CMD | Title 5"];

    SOUL_MV.UltimateTitleSceeen.title6ActionLaunch = PluginManager.parameters('Soul Ultimate Title Screen')["Title 6 Action"];
    SOUL_MV.UltimateTitleSceeen.title6ActionLaunchWEB = PluginManager.parameters('Soul Ultimate Title Screen')["WEB | Title 6"];
    SOUL_MV.UltimateTitleSceeen.title6ActionLaunchCMD = PluginManager.parameters('Soul Ultimate Title Screen')["CMD | Title 6"];


    SOUL_MV.UltimateTitleSceeen.commandVisible = PluginManager.parameters('Soul Ultimate Title Screen')["Command Visible"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.preventCommandSight = PluginManager.parameters('Soul Ultimate Title Screen')["Command Selectable"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.newGameX = PluginManager.parameters('Soul Ultimate Title Screen')["New Game X"];
    SOUL_MV.UltimateTitleSceeen.newGameY = PluginManager.parameters('Soul Ultimate Title Screen')["New Game Y"];
    SOUL_MV.UltimateTitleSceeen.continueX = PluginManager.parameters('Soul Ultimate Title Screen')["Continue Game X"];
    SOUL_MV.UltimateTitleSceeen.continueY = PluginManager.parameters('Soul Ultimate Title Screen')["Continue Game Y"];
    SOUL_MV.UltimateTitleSceeen.optionsX = PluginManager.parameters('Soul Ultimate Title Screen')["Options X"];
    SOUL_MV.UltimateTitleSceeen.optionsY = PluginManager.parameters('Soul Ultimate Title Screen')["Options Y"];
    SOUL_MV.UltimateTitleSceeen.logo = PluginManager.parameters('Soul Ultimate Title Screen')["Title Logo Image"];
    SOUL_MV.UltimateTitleSceeen.newGameImage = PluginManager.parameters('Soul Ultimate Title Screen')["New Game On Image"];
    SOUL_MV.UltimateTitleSceeen.newGameOffImage = PluginManager.parameters('Soul Ultimate Title Screen')["New Game Off Image"];
    SOUL_MV.UltimateTitleSceeen.continueGameImage = PluginManager.parameters('Soul Ultimate Title Screen')["Continue On Image"];
    SOUL_MV.UltimateTitleSceeen.continueGameOffImage = PluginManager.parameters('Soul Ultimate Title Screen')["Continue Off Image"];
    SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage = PluginManager.parameters('Soul Ultimate Title Screen')["Continue Unavailable Image"];
    SOUL_MV.UltimateTitleSceeen.optionsOnImage = PluginManager.parameters('Soul Ultimate Title Screen')["Options On Image"];
    SOUL_MV.UltimateTitleSceeen.optionsOffImage = PluginManager.parameters('Soul Ultimate Title Screen')["Options Off Image"];

    SOUL_MV.UltimateTitleSceeen.title1Image = PluginManager.parameters('Soul Ultimate Title Screen')["Title 1 Image"];
    SOUL_MV.UltimateTitleSceeen.title1ScrollX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 1 Scroll X"]);
    SOUL_MV.UltimateTitleSceeen.title1ScrollY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 1 Scroll Y"]);
    SOUL_MV.UltimateTitleSceeen.title2Image = PluginManager.parameters('Soul Ultimate Title Screen')["Title 2 Image"];
    SOUL_MV.UltimateTitleSceeen.title2ScrollX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 2 Scroll X"]);
    SOUL_MV.UltimateTitleSceeen.title2ScrollY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 2 Scroll Y"]);
    SOUL_MV.UltimateTitleSceeen.title3Image = PluginManager.parameters('Soul Ultimate Title Screen')["Title 3 Image"];
    SOUL_MV.UltimateTitleSceeen.title3ScrollX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 3 Scroll X"]);
    SOUL_MV.UltimateTitleSceeen.title3ScrollY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 3 Scroll Y"]);
    SOUL_MV.UltimateTitleSceeen.title4Image = PluginManager.parameters('Soul Ultimate Title Screen')["Title 4 Image"];
    SOUL_MV.UltimateTitleSceeen.title4ScrollX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 4 Scroll X"]);
    SOUL_MV.UltimateTitleSceeen.title4ScrollY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 4 Scroll Y"]);
    SOUL_MV.UltimateTitleSceeen.title5Image = PluginManager.parameters('Soul Ultimate Title Screen')["Title 5 Image"];
    SOUL_MV.UltimateTitleSceeen.title5ScrollX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 5 Scroll X"]);
    SOUL_MV.UltimateTitleSceeen.title5ScrollY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 5 Scroll Y"]);
    SOUL_MV.UltimateTitleSceeen.title6Image = PluginManager.parameters('Soul Ultimate Title Screen')["Title 6 Image"];
    SOUL_MV.UltimateTitleSceeen.title6ScrollX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 6 Scroll X"]);
    SOUL_MV.UltimateTitleSceeen.title6ScrollY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Title 6 Scroll Y"]);

    // BG ON TOP

    SOUL_MV.UltimateTitleSceeen.backSpriteX1 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 1"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX1_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 1 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX1_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 1 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX2 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 2"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX2_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 2 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX2_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 2 Y"]); 

    SOUL_MV.UltimateTitleSceeen.backSpriteX3 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 3"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX3_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 3 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX3_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 3 Y"]);


    SOUL_MV.UltimateTitleSceeen.backSpriteX4 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 4"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX4_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 4 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX4_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 4 Y"]);


    SOUL_MV.UltimateTitleSceeen.backSpriteX5 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 5"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX5_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 5 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX5_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 5 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX6 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 6"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX6_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 6 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX6_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 6 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX7 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 7"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX7_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 7 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX7_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 7 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX8 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 8"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX8_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 9 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX8_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 9 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX9 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 9"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX9_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 9 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX9_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 9 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX10 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 10"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX10_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 10 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX10_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 10 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX11 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 11"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX11_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 11 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX11_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 11 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX12 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 12"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX12_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 12 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX12_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 12 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX13 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 13"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX13_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 13 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX13_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 13 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX14 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 14"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX14_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 14 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX14_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 14 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX15 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 15"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX15_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 15 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX15_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 15 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX16 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 16"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX16_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 16 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX16_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 16 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX17 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 17"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX17_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 17 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX17_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 17 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX18 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 18"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX18_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 18 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX18_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 18 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX19 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 19"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX19_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 19 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX19_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 19 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX20 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 20"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX20_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 20 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX20_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 20 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX21 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 21"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX21_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 21 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX21_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 21 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX22 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 22"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX22_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 22 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX22_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 22 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX23 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 23"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX23_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 23 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX23_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 23 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX24 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 24"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX24_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 24 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX24_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 24 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX25 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 25"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX25_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 25 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX25_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 25 Y"]);

    SOUL_MV.UltimateTitleSceeen.backSpriteX26 = PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 26"];
    SOUL_MV.UltimateTitleSceeen.backSpriteX26_X = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 26 X"]);
    SOUL_MV.UltimateTitleSceeen.backSpriteX26_Y = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Backsprite3 26 Y"]);


    SOUL_MV.UltimateTitleSceeen.logoX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Logo X Axis"]);
    SOUL_MV.UltimateTitleSceeen.logoY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Logo Y Axis"]);

    SOUL_MV.UltimateTitleSceeen.pressStartImage = PluginManager.parameters('Soul Ultimate Title Screen')["Press Start Image"];
    SOUL_MV.UltimateTitleSceeen.frameCount = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Press Start Frame Count"]);
    SOUL_MV.UltimateTitleSceeen.pressStartX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Press Start X Axis"]);
    SOUL_MV.UltimateTitleSceeen.pressStartY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Press Start Y Axis"]);

    SOUL_MV.UltimateTitleSceeen.useParticles = PluginManager.parameters('Soul Ultimate Title Screen')["Use Particles"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.particleNumber = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Max Particles"]);
    SOUL_MV.UltimateTitleSceeen.particleMoveX = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Particle X Axis"]);
    SOUL_MV.UltimateTitleSceeen.particleMoveY = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Particle Y Axis"]);
    SOUL_MV.UltimateTitleSceeen.particleImageName = PluginManager.parameters('Soul Ultimate Title Screen')["Particle Image"];

    SOUL_MV.UltimateTitleSceeen.useFog1 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Fog1"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.fog1Image = PluginManager.parameters('Soul Ultimate Title Screen')["Fog1 Image"];
    SOUL_MV.UltimateTitleSceeen.fog1XScroll = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Fog1 X Scroll"]);
    SOUL_MV.UltimateTitleSceeen.fog1YScroll = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Fog1 Y Scroll"]);
    SOUL_MV.UltimateTitleSceeen.useFog2 = PluginManager.parameters('Soul Ultimate Title Screen')["Use Fog2"] === "true" ? true : false;
    SOUL_MV.UltimateTitleSceeen.fog2Image = PluginManager.parameters('Soul Ultimate Title Screen')["Fog2 Image"];
    SOUL_MV.UltimateTitleSceeen.fog2XScroll = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Fog2 X Scroll"]);
    SOUL_MV.UltimateTitleSceeen.fog2YScroll = Number(PluginManager.parameters('Soul Ultimate Title Screen')["Fog2 Y Scroll"]);

    SOUL_MV.UltimateTitleSceeen.eval1 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 1"];
    SOUL_MV.UltimateTitleSceeen.eval2 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 2"];
    SOUL_MV.UltimateTitleSceeen.eval3 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 3"];
    SOUL_MV.UltimateTitleSceeen.eval4 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 4"];
    SOUL_MV.UltimateTitleSceeen.eval5 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 5"];
    SOUL_MV.UltimateTitleSceeen.eval6 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 6"];
    SOUL_MV.UltimateTitleSceeen.eval7 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 7"];
    SOUL_MV.UltimateTitleSceeen.eval8 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 8"];
    SOUL_MV.UltimateTitleSceeen.eval9 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect1 Eval 9"];
    SOUL_MV.UltimateTitleSceeen.eval10 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 1"];
    SOUL_MV.UltimateTitleSceeen.eval11 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 2"];
    SOUL_MV.UltimateTitleSceeen.eval12 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 3"];
    SOUL_MV.UltimateTitleSceeen.eval13 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 4"];
    SOUL_MV.UltimateTitleSceeen.eval14 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 5"];
    SOUL_MV.UltimateTitleSceeen.eval15 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 6"];
    SOUL_MV.UltimateTitleSceeen.eval16 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 7"];
    SOUL_MV.UltimateTitleSceeen.eval17 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 8"];
    SOUL_MV.UltimateTitleSceeen.eval18 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 8"];
    SOUL_MV.UltimateTitleSceeen.eval19 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 9"];
    SOUL_MV.UltimateTitleSceeen.eval20 = PluginManager.parameters('Soul Ultimate Title Screen')["Effect2 Eval 10"];


    // Compatibility fix with Yanfly's Credits Page plugin
    if (Imported.YEP_CreditsPage) {
        SOUL_MV.UltimateTitleSceeen.creditsOnImage = PluginManager.parameters('Soul Ultimate Title Screen')["Credits On Image"];
        SOUL_MV.UltimateTitleSceeen.creditsOffImage = PluginManager.parameters('Soul Ultimate Title Screen')["Credits Off Image"];    
        SOUL_MV.UltimateTitleSceeen.creditsX = PluginManager.parameters('Soul Ultimate Title Screen')["Credits X"];
        SOUL_MV.UltimateTitleSceeen.creditsY = PluginManager.parameters('Soul Ultimate Title Screen')["Credits Y"];
    }

    SOUL_MV.UltimateTitleSceeen.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
	    SOUL_MV.UltimateTitleSceeen.Game_Interpreter_pluginCommand.call(this, command, args);
	    if (command === 'Soul_UltimateTitleScreen') {
	    	if (args[0] === 'Chapter_Set') {
	    		$gameSystem._chapter = Number(args[1]);
	    	}
	    }
	};   

    SOUL_MV.UltimateTitleSceeen.gameSystem_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        SOUL_MV.UltimateTitleSceeen.gameSystem_initialize.call(this);
        this._chapter = 1;
    };


    SOUL_MV.UltimateTitleSceeen.SceneTitle_initialize = Scene_Title.prototype.initialize;
    Scene_Title.prototype.initialize = function() {
        SOUL_MV.UltimateTitleSceeen.SceneTitle_initialize.call(this);
        this._pressStartOK = true;
        this._PSframeCount = SOUL_MV.UltimateTitleSceeen.frameCount;
    };


    SOUL_MV.UltimateTitleSceeen.SceneTitle_commandNewGame = Scene_Title.prototype.commandNewGame;
    Scene_Title.prototype.commandNewGame = function() {
        SOUL_MV.UltimateTitleSceeen.SceneTitle_commandNewGame.call(this);
            if (Imported.YEP_CreditsPage) {
                this._spriteNewGame.visible = false;
                this._spriteContinueGame.visible = false;
                this._spriteOptions.visible = false;
                this._spriteCredits.visible = false;
            } else {
                this._spriteNewGame.visible = false;
                this._spriteContinueGame.visible = false;
                this._spriteOptions.visible = false;   
            }
    };

    SOUL_MV.UltimateTitleSceeen.sceneTitle_createCommandWindow = Scene_Title.prototype.createCommandWindow;
    Scene_Title.prototype.createCommandWindow = function() {
        this._commandWindow = new Window_TitleCommand();
        if (!this._pressStartOK) {
            this._commandWindow.setHandler('newGame',  this.commandNewGame.bind(this));
            this._commandWindow.setHandler('continue', this.commandContinue.bind(this));
            this._commandWindow.setHandler('options',  this.commandOptions.bind(this));
            this.addWindow(this._commandWindow);
        }
    };


    SOUL_MV.UltimateTitleSceeen.SceneTitleCreate = Scene_Title.prototype.create;
    Scene_Title.prototype.create = function() {
        SOUL_MV.UltimateTitleSceeen.SceneTitleCreate.call(this);
        this.create_title_buttons();
        if (SOUL_MV.UltimateTitleSceeen.commandVisible) {
            this._commandWindow.visible = true;
        } else {
            this._commandWindow.visible = false;
        }
        if (SOUL_MV.UltimateTitleSceeen.preventCommandSight) {
            this._commandWindow.x = Graphics.boxWidth * 2;
            this._commandWindow.y = Graphics.boxHeight * 9;
        }
        this.createpressStartButton();
        if (SOUL_MV.UltimateTitleSceeen.useParticles) this.create_title_particles();
        if (SOUL_MV.UltimateTitleSceeen.useFog1) this.create_title_fog1();
        if (SOUL_MV.UltimateTitleSceeen.useFog2) this.create_title_fog2();
        if(!this._pressStartOK) {
            this.createCommandWindow();   
        }    

        this.createTitleObjects();
          
    };

    Scene_Title.prototype.createTitleObjects = function() {
        if (SOUL_MV.UltimateTitleSceeen.useTitle1) {
            switch(SOUL_MV.UltimateTitleSceeen.title1Property) {
                case 'Sprite':
                    this.title1ImageObject = new Sprite();
                    this.title1ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title1Image);
                    this.title1ImageObject.x = 80;
                    this.title1ImageObject.y = 520;
                    this.addChild(this.title1ImageObject);
                    break;
                case 'Sprite_Button':
                    this.title1ImageObject = new Sprite_Button();
                    this.title1ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title1Image);
                    this.title1ImageObject.setClickHandler(this.setTitle1SpriteButtonAction.bind(this));
                    this.title1ImageObject.x = 450;
                    this.title1ImageObject.y = 520;                
                    this.addChild(this.title1ImageObject);
                    break;
                case 'TilingSprite':
                    this.title1ImageObject = new TilingSprite();
                    this.title1ImageObject.move(0, 0, Graphics.width, Graphics.height);
                    this.title1ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title1Image);
                    this.addChild(this.title1ImageObject);
                    break;
                default:
                    alert('Error!! Soul Ultimate Title Screen Title Object 1 Property not recognized!' + '\n'
                        + 'Please use Sprite, Sprite_Button and TilingSprite as settings only!');
                    SceneManager.exit();
                    break;
            }
        }
        if (SOUL_MV.UltimateTitleSceeen.useTitle2) {
            switch(SOUL_MV.UltimateTitleSceeen.title2Property) {
                case 'Sprite':
                    this.title2ImageObject = new Sprite();
                    this.title2ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title2Image);
                    this.addChild(this.title2ImageObject);
                    break;
                case 'Sprite_Button':
                    this.title2ImageObject = new Sprite_Button();
                    this.title2ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title2Image);
                    this.addChild(this.title2ImageObject);
                    break;
                case 'TilingSprite':
                    this.title2ImageObject = new TilingSprite();
                    this.title2ImageObject.move(0, 0, Graphic.width, Graphics.height);
                    this.title2ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title2Image);
                    this.addChild(this.title2ImageObject);
                    break;
                default:
                    alert('Error!! Soul Ultimate Title Screen Title Object 2 Property not recognized!' + '\n'
                        + 'Please use Sprite, Sprite_Button and TilingSprite as settings only!');
                    SceneManager.exit();
                    break;
            }
        }
        if (SOUL_MV.UltimateTitleSceeen.useTitle3) {
            switch(SOUL_MV.UltimateTitleSceeen.title3Property) {
                case 'Sprite':
                    this.title3ImageObject = new Sprite();
                    this.title3ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title3Image);
                    this.addChild(this.title3ImageObject);
                    break;
                case 'Sprite_Button':
                    this.title3ImageObject = new Sprite_Button();
                    this.title3ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title3Image);
                    this.addChild(this.title3ImageObject);
                    break;
                case 'TilingSprite':
                    this.title3ImageObject = new TilingSprite();
                    this.title3ImageObject.move(0, 0, Graphic.width, Graphics.height);
                    this.title3ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title3Image);
                    this.addChild(this.title3ImageObject);
                    break;
                default:
                    alert('Error!! Soul Ultimate Title Screen Title Object 3 Property not recognized!' + '\n'
                        + 'Please use Sprite, Sprite_Button and TilingSprite as settings only!');
                    SceneManager.exit();
                    break;
            }
        }    
        if (SOUL_MV.UltimateTitleSceeen.useTitle4) {
            switch(SOUL_MV.UltimateTitleSceeen.title4Property) {
                case 'Sprite':
                    this.title4ImageObject = new Sprite();
                    this.title4ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title4Image);
                    this.addChild(this.title4ImageObject);
                    break;
                case 'Sprite_Button':
                    this.title4ImageObject = new Sprite_Button();
                    this.title4ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title4Image);
                    this.addChild(this.title4ImageObject);
                    break;
                case 'TilingSprite':
                    this.title4ImageObject = new TilingSprite();
                    this.title4ImageObject.move(0, 0, Graphic.width, Graphics.height);
                    this.title4ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title4Image);
                    this.addChild(this.title4ImageObject);
                    break;
                default:
                    alert('Error!! Soul Ultimate Title Screen Title Object 4 Property not recognized!' + '\n'
                        + 'Please use Sprite, Sprite_Button and TilingSprite as settings only!');
                    SceneManager.exit();
                    break;
            }
        }    
        if (SOUL_MV.UltimateTitleSceeen.useTitle5) {
            switch(SOUL_MV.UltimateTitleSceeen.title5Property) {
                case 'Sprite':
                    this.title5ImageObject = new Sprite();
                    this.title5ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title5Image);
                    this.addChild(this.title5ImageObject);
                    break;
                case 'Sprite_Button':
                    this.title5ImageObject = new Sprite_Button();
                    this.title5ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title5Image);
                    this.addChild(this.title5ImageObject);
                    break;
                case 'TilingSprite':
                    this.title5ImageObject = new TilingSprite();
                    this.title5ImageObject.move(0, 0, Graphic.width, Graphics.height);
                    this.title5ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title5Image);
                    this.addChild(this.title5ImageObject);
                    break;
                default:
                    alert('Error!! Soul Ultimate Title Screen Title Object 5 Property not recognized!' + '\n'
                        + 'Please use Sprite, Sprite_Button and TilingSprite as settings only!');
                    SceneManager.exit();
                    break;
            }
        }     
        if (SOUL_MV.UltimateTitleSceeen.useTitle6) {
            switch(SOUL_MV.UltimateTitleSceeen.title6Property) {
                case 'Sprite':
                    this.title6ImageObject = new Sprite();
                    this.title6ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title6Image);
                    this.addChild(this.title6ImageObject);
                    break;
                case 'Sprite_Button':
                    this.title6ImageObject = new Sprite_Button();
                    this.title6ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title6Image);
                    this.addChild(this.title6ImageObject);
                    break;
                case 'TilingSprite':
                    this.title6ImageObject = new TilingSprite();
                    this.title6ImageObject.move(0, 0, Graphic.width, Graphics.height);
                    this.title6ImageObject.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.title6Image);
                    this.addChild(this.title6ImageObject);
                    break;
                default:
                    alert('Error!! Soul Ultimate Title Screen Title Object 6 Property not recognized!' + '\n'
                        + 'Please use Sprite, Sprite_Button and TilingSprite as settings only!');
                    SceneManager.exit();
                    break;
            }
        }     
    }

    Scene_Title.prototype.setTitle1SpriteButtonAction = function() {
        if (SOUL_MV.UltimateTitleSceeen.title1ActionLaunch === 'website') {
            this.commandTitle1();
        }
        if (SOUL_MV.UltimateTitleSceeen.title1ActionLaunch === 'command') {
            eval(SOUL_MV.UltimateTitleSceeen.title1ActionLaunchCMD);
        }    
    };

    Scene_Title.prototype.setTitle2SpriteButtonAction = function() {
        if (SOUL_MV.UltimateTitleSceeen.title2ActionLaunch === 'website') {
            this.commandTitle2();
        }
        if (SOUL_MV.UltimateTitleSceeen.title2ActionLaunch === 'command') {
            eval(SOUL_MV.UltimateTitleSceeen.title2ActionLaunchCMD);
        }    
    };

    Scene_Title.prototype.setTitle3SpriteButtonAction = function() {
        if (SOUL_MV.UltimateTitleSceeen.title3ActionLaunch === 'website') {
            this.commandTitle3();
        }
        if (SOUL_MV.UltimateTitleSceeen.title1ActionLaunch === 'command') {
            eval(SOUL_MV.UltimateTitleSceeen.title3ActionLaunchCMD);
        }    
    };

    Scene_Title.prototype.setTitle4SpriteButtonAction = function() {
        if (SOUL_MV.UltimateTitleSceeen.title4ActionLaunch === 'website') {
            this.commandTitle4();
        }
        if (SOUL_MV.UltimateTitleSceeen.title4ActionLaunch === 'command') {
            eval(SOUL_MV.UltimateTitleSceeen.title1ActionLaunchCMD);
        }    
    };

    Scene_Title.prototype.setTitle5SpriteButtonAction = function() {
        if (SOUL_MV.UltimateTitleSceeen.title5ActionLaunch === 'website') {
            this.commandTitle5();
        }
        if (SOUL_MV.UltimateTitleSceeen.title5ActionLaunch === 'command') {
            eval(SOUL_MV.UltimateTitleSceeen.title1ActionLaunchCMD);
        }    
    };

    Scene_Title.prototype.setTitle6SpriteButtonAction = function() {
        if (SOUL_MV.UltimateTitleSceeen.title6ActionLaunch === 'website') {
            this.commandTitle6();
        }
        if (SOUL_MV.UltimateTitleSceeen.title6ActionLaunch === 'command') {
            eval(SOUL_MV.UltimateTitleSceeen.title1ActionLaunchCMD);
        }    
    };

    Scene_Title.prototype.commandTitle1 = function() {
        TouchInput.clear();
        Input.clear();
        this._commandWindow.activate();
        var win = window.open(SOUL_MV.UltimateTitleSceeen.title1ActionLaunchWEB, '_blank');
        if (win) {
            win.focus();
        }
    };

    Scene_Title.prototype.commandTitle2 = function() {
        TouchInput.clear();
        Input.clear();
        this._commandWindow.activate();
        var win = window.open(SOUL_MV.UltimateTitleSceeen.title2ActionLaunchWEB, '_blank');
        if (win) {
            win.focus();
        } 
    };

    Scene_Title.prototype.commandTitle3 = function() {
        TouchInput.clear();
        Input.clear();
        this._commandWindow.activate();
        var win = window.open(SOUL_MV.UltimateTitleSceeen.title3ActionLaunchWEB, '_blank');
        if (win) {
            win.focus();
        } 
    };

    Scene_Title.prototype.commandTitle4 = function() {
        TouchInput.clear();
        Input.clear();
        this._commandWindow.activate();
        var win = window.open(SOUL_MV.UltimateTitleSceeen.title4ActionLaunchWEB, '_blank');
        if (win) {
            win.focus();
        }
    };

    Scene_Title.prototype.commandTitle5 = function() {
        TouchInput.clear();
        Input.clear();
        this._commandWindow.activate();
        var win = window.open(SOUL_MV.UltimateTitleSceeen.title5ActionLaunchWEB, '_blank');
        if (win) {
            win.focus();
        }
    };

    Scene_Title.prototype.commandTitle6 = function() {
        TouchInput.clear();
        Input.clear();
        this._commandWindow.activate();
        var win = window.open(SOUL_MV.UltimateTitleSceeen.title6ActionLaunchWEB, '_blank');
        if (win) {
            win.focus();
        }
    };



    Scene_Title.prototype.createpressStartButton = function() {
        this._sprite_PressStart = new Sprite_Button();
        this._sprite_PressStart.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.pressStartImage);
        this._sprite_PressStart.x = SOUL_MV.UltimateTitleSceeen.pressStartX;
        this._sprite_PressStart.y = SOUL_MV.UltimateTitleSceeen.pressStartY;
        this._sprite_PressStart.setClickHandler(this.commandPressStartDone.bind(this));
        this.addChild(this._sprite_PressStart);
    }

    Scene_Title.prototype.commandPressStartDone = function() {
        this._pressStartOK = false;
        this.removeChild(this._sprite_PressStart);
    }

    Scene_Title.prototype.create_title_fog1 = function() {
        this._fog1 = new TilingSprite();
        this._fog1.move(0, 0, Graphics.boxWidth, Graphics.boxHeight);
        this._fog1.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.fog1Image);
        this.addChildAt(this._fog1, 4);      
    }

    Scene_Title.prototype.create_title_fog2 = function() { 
        this._fog2 = new TilingSprite();
        this._fog2.move(0, 0, Graphics.boxWidth, Graphics.boxHeight);
        this._fog2.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.fog2Image);
        this.addChildAt(this._fog2, 4);      
    }

    Scene_Title.prototype.create_title_particles = function() {
        this._particles = new SOUL_MV_Particles();
        this.addChildAt(this._particles, 5);    
    }

    Scene_Title.prototype.create_title_buttons = function() {
        this._spriteNewGame = new Sprite_Button();
        this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameImage);
        this._spriteNewGame.x = SOUL_MV.UltimateTitleSceeen.newGameX;
        this._spriteNewGame.y = SOUL_MV.UltimateTitleSceeen.newGameY;
        this._spriteNewGame.setClickHandler(this.onCreateNewGame.bind(this));

        this._spriteContinueGame = new Sprite_Button();
        this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
        this._spriteContinueGame.x = SOUL_MV.UltimateTitleSceeen.continueX;
        this._spriteContinueGame.y = SOUL_MV.UltimateTitleSceeen.continueY; 
        this._spriteContinueGame.setClickHandler(this.onContinueNewGame.bind(this));

        this._spriteOptions = new Sprite_Button();
        this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsImage);
        this._spriteOptions.x = SOUL_MV.UltimateTitleSceeen.optionsX;
        this._spriteOptions.y = SOUL_MV.UltimateTitleSceeen.optionsY;   
        this._spriteOptions.setClickHandler(this.onOptionsButton.bind(this));

        this._spriteLogo = new Sprite_Button();
        this._spriteLogo.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.logo);
        this._spriteLogo.x = SOUL_MV.UltimateTitleSceeen.logoX;
        this._spriteLogo.y = SOUL_MV.UltimateTitleSceeen.logoY;

        if (Imported.YEP_CreditsPage) {
            this._spriteCredits = new Sprite_Button();
            this._spriteCredits.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.creditsOnImage);
            this._spriteCredits.setClickHandler(this.commandCredits.bind(this));
            this._spriteCredits.x = SOUL_MV.UltimateTitleSceeen.creditsX;
            this._spriteCredits.y = SOUL_MV.UltimateTitleSceeen.creditsY;
            this.addChild(this._spriteCredits);
        } 
        this.addChild(this._spriteLogo);
        this.addChild(this._spriteNewGame);
        this.addChild(this._spriteContinueGame);
        this.addChild(this._spriteOptions);
    }

    ImageManager.loadUltimateTitle = function(filename, hue) {
        return this.loadBitmap('img/ultimate_title/', filename, hue, true);
    };

    Scene_Title.prototype.onCreateNewGame = function() {
        SoundManager.playOk();
        this.commandNewGame();
    }

    Scene_Title.prototype.onContinueNewGame = function() {
        if (DataManager.isAnySavefileExists()) {
            SoundManager.playOk();
            this._commandWindow.index = 1;
            if (SOUL_MV.UltimateTitleSceeen.commandVisible)this._commandWindow.close();
            SceneManager.push(Scene_Load);   
        } else {
            SoundManager.playBuzzer();
        }

    }

    Scene_Title.prototype.onOptionsButton = function() {
        SoundManager.playOk();
        this.commandOptions();
    }

    Scene_Title.prototype.updateTouchinputEffect = function() {
        if (TouchInput.effectMouseX >= Graphics.boxWidth - 20 || TouchInput.effectMouseX <= 10 || TouchInput.effectMouseY >= Graphics.boxHeight - 20 || TouchInput.effectMouseY <= 10) {
            eval(SOUL_MV.UltimateTitleSceeen.eval1);
            eval(SOUL_MV.UltimateTitleSceeen.eval2);
            eval(SOUL_MV.UltimateTitleSceeen.eval3);
            eval(SOUL_MV.UltimateTitleSceeen.eval4);
            eval(SOUL_MV.UltimateTitleSceeen.eval5);
            eval(SOUL_MV.UltimateTitleSceeen.eval6);
            eval(SOUL_MV.UltimateTitleSceeen.eval7);
            eval(SOUL_MV.UltimateTitleSceeen.eval8);
            eval(SOUL_MV.UltimateTitleSceeen.eval9);
            eval(SOUL_MV.UltimateTitleSceeen.eval10);
                    
        }
        if (TouchInput.isTriggered()) {
            eval(SOUL_MV.UltimateTitleSceeen.eval11);
            eval(SOUL_MV.UltimateTitleSceeen.eval12);
            eval(SOUL_MV.UltimateTitleSceeen.eval13);
            eval(SOUL_MV.UltimateTitleSceeen.eval14);
            eval(SOUL_MV.UltimateTitleSceeen.eval15);
            eval(SOUL_MV.UltimateTitleSceeen.eval16);
            eval(SOUL_MV.UltimateTitleSceeen.eval17);
            eval(SOUL_MV.UltimateTitleSceeen.eval18);
            eval(SOUL_MV.UltimateTitleSceeen.eval19);
            eval(SOUL_MV.UltimateTitleSceeen.eval20);        
        }
    }

    Scene_Title.prototype.update = function() {

    	if (Input.isPressed('ok')) {
    		this.commandPressStartDone();
    	}

        this.updateTouchinputEffect();
        if (SOUL_MV.UltimateTitleSceeen.useParticles) this._particles._updateAllSprites();

        if (SOUL_MV.UltimateTitleSceeen.useFog1) {
            this._fog1.origin.x += SOUL_MV.UltimateTitleSceeen.fog1XScroll;
            this._fog1.origin.y += SOUL_MV.UltimateTitleSceeen.fog1YScroll;
        }
        if (SOUL_MV.UltimateTitleSceeen.useFog2) {
            this._fog2.origin.x += SOUL_MV.UltimateTitleSceeen.fog2XScroll;
            this._fog2.origin.y += SOUL_MV.UltimateTitleSceeen.fog2YScroll;
        }

        if (!this.isBusy()) {
            this._commandWindow.open();
        }

        if (!this._pressStartOK) {
            this._commandWindow.setHandler('newGame',  this.commandNewGame.bind(this));
            this._commandWindow.setHandler('continue', this.commandContinue.bind(this));
            this._commandWindow.setHandler('options',  this.commandOptions.bind(this));
            this.addWindow(this._commandWindow);
        }    

        if (this._pressStartOK) {
            if (Imported.YEP_CreditsPage) {
                this.removeChild(this._spriteNewGame);
                this.removeChild(this._spriteContinueGame);
                this.removeChild(this._spriteOptions);
                this.removeChild(this._spriteCredits);
            } else {
                this.removeChild(this._spriteNewGame);
                this.removeChild(this._spriteContinueGame);
                this.removeChild(this._spriteOptions);            
            }        

        } else {
            if (Imported.YEP_CreditsPage) {
                this.addChild(this._spriteNewGame);
                this.addChild(this._spriteContinueGame);
                this.addChild(this._spriteOptions);
                this.addChild(this._spriteCredits);
            } else {
                this.addChild(this._spriteNewGame);
                this.addChild(this._spriteContinueGame);
                this.addChild(this._spriteOptions);            
            }
        }

        this._PSframeCount++;
        this._PSframeCount %= 20;
        this._sprite_PressStart.opacity = (20 - this._PSframeCount) * 6; 

        if (Imported.YEP_CreditsPage) {
            if (this._commandWindow._index === 0) {
                this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameImage);
                this._spriteCredits.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.creditsOffImage);
                if (DataManager.isAnySavefileExists()) { 
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
                } else {    
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage);
                }
                this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsOffImage);
            } 
            if (this._commandWindow._index === 1) {
                this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameOffImage);
                this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsOffImage);    
                this._spriteCredits.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.creditsOffImage);        
                if (DataManager.isAnySavefileExists()) { 
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
                } else {
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage);
                }
            } 
            if (this._commandWindow._index === 2) {
                this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameOffImage); 
                this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsOffImage);
                this._spriteCredits.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.creditsOnImage); 
                if (DataManager.isAnySavefileExists()) { 
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
                } else {
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage);
                }
            } 
            if (this._commandWindow._index === 3) {
                this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsOnImage);
                this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameOffImage);  
                this._spriteCredits.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.creditsOffImage);
                if (DataManager.isAnySavefileExists()) { 
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
                } else {
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage);
                }
            }     
        } else {
            if (this._commandWindow._index === 0) {
                this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameImage);
                if (DataManager.isAnySavefileExists()) { 
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
                } else {    
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage);
                }
                this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsOffImage);
            } 
            if (this._commandWindow._index === 1) {
                this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameOffImage);
                this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsOffImage);            
                if (DataManager.isAnySavefileExists()) { 
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
                } else {
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage);
                }
            } 
            if (this._commandWindow._index === 2) {
                this._spriteNewGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.newGameOffImage);
                if (DataManager.isAnySavefileExists()) { 
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameImage);
                } else {
                    this._spriteContinueGame.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.continueGameUnavailableImage);
                }
                this._spriteOptions.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.optionsOnImage);
            } 
        }

        if (SOUL_MV.UltimateTitleSceeen.title1Property === 'TilingSprite' && SOUL_MV.UltimateTitleSceeen.useTitle1) {
            this.title1ImageObject.origin.x += SOUL_MV.UltimateTitleSceeen.title1ScrollX;
            this.title1ImageObject.origin.y += SOUL_MV.UltimateTitleSceeen.title1ScrollY;
        }
        if (SOUL_MV.UltimateTitleSceeen.title2Property === 'TilingSprite' && SOUL_MV.UltimateTitleSceeen.useTitle2) {
            this.title2ImageObject.origin.x += SOUL_MV.UltimateTitleSceeen.title2ScrollX;
            this.title2ImageObject.origin.y += SOUL_MV.UltimateTitleSceeen.title2ScrollY;
        }
        if (SOUL_MV.UltimateTitleSceeen.title3Property === 'TilingSprite' && SOUL_MV.UltimateTitleSceeen.useTitle3) {
            this.title3ImageObject.origin.x += SOUL_MV.UltimateTitleSceeen.title3ScrollX;
            this.title3ImageObject.origin.y += SOUL_MV.UltimateTitleSceeen.title3ScrollY;
        }
        if (SOUL_MV.UltimateTitleSceeen.title4Property === 'TilingSprite' && SOUL_MV.UltimateTitleSceeen.useTitle4) {
            this.title4ImageObject.origin.x += SOUL_MV.UltimateTitleSceeen.title4ScrollX;
            this.title4ImageObject.origin.y += SOUL_MV.UltimateTitleSceeen.title4ScrollY;
        }  
        if (SOUL_MV.UltimateTitleSceeen.title5Property === 'TilingSprite' && SOUL_MV.UltimateTitleSceeen.useTitle5) {
            this.title5ImageObject.origin.x += SOUL_MV.UltimateTitleSceeen.title5ScrollX;
            this.title5ImageObject.origin.y += SOUL_MV.UltimateTitleSceeen.title5ScrollY;
        }
        if (SOUL_MV.UltimateTitleSceeen.title6Property === 'TilingSprite' && SOUL_MV.UltimateTitleSceeen.useTitle6) {
            this.title6ImageObject.origin.x += SOUL_MV.UltimateTitleSceeen.title6ScrollX;
            this.title6ImageObject.origin.y += SOUL_MV.UltimateTitleSceeen.title6ScrollY;
        }       

        Scene_Base.prototype.update.call(this);
    }

    SOUL_MV.UltimateTitleSceeen.sceneTitle_createBackground = Scene_Title.prototype.createBackground;
    Scene_Title.prototype.createBackground = function() {
        SOUL_MV.UltimateTitleSceeen.sceneTitle_createBackground.call(this);
        this._backSprite1 = new TilingSprite();
        this._backSprite1.bitmap = ImageManager.loadTitle1('Chapter' + $gameSystem._chapter);
        this._backSprite2 = new TilingSprite();
        this._backSprite2.bitmap = ImageManager.loadTitle2($dataSystem.title2Name);
        this._backSprite1.move(0, 0, Graphics.width, Graphics.height);
        this._backSprite2.move(0, 0, Graphics.width, Graphics.height);


        this._backSprite3_1 = new Sprite();
        this._backSprite3_1.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX1);
        this._backSprite3_1.x = SOUL_MV.UltimateTitleSceeen.backSpriteX1_X;
        this._backSprite3_1.y = SOUL_MV.UltimateTitleSceeen.backSpriteX1_Y;

        this._backSprite3_2 = new Sprite();
        this._backSprite3_2.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX2);
        this._backSprite3_2.x = SOUL_MV.UltimateTitleSceeen.backSpriteX2_X;
        this._backSprite3_2.y = SOUL_MV.UltimateTitleSceeen.backSpriteX2_Y;


        this._backSprite3_3 = new Sprite();
        this._backSprite3_3.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX3);
        this._backSprite3_3.x = SOUL_MV.UltimateTitleSceeen.backSpriteX3_X;
        this._backSprite3_3.y = SOUL_MV.UltimateTitleSceeen.backSpriteX3_Y;

        this._backSprite3_4 = new Sprite();
        this._backSprite3_4.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX4);
        this._backSprite3_4.x = SOUL_MV.UltimateTitleSceeen.backSpriteX4_X;
        this._backSprite3_4.y = SOUL_MV.UltimateTitleSceeen.backSpriteX4_Y;

        this._backSprite3_5 = new Sprite();
        this._backSprite3_5.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX5);
        this._backSprite3_5.x = SOUL_MV.UltimateTitleSceeen.backSpriteX5_X;
        this._backSprite3_5.y = SOUL_MV.UltimateTitleSceeen.backSpriteX5_Y;

        this._backSprite3_6 = new Sprite();
        this._backSprite3_6.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX6);
        this._backSprite3_6.x = SOUL_MV.UltimateTitleSceeen.backSpriteX6_X;
        this._backSprite3_6.y = SOUL_MV.UltimateTitleSceeen.backSpriteX6_Y;


        this._backSprite3_7 = new Sprite();
        this._backSprite3_7.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX7);
        this._backSprite3_7.x = SOUL_MV.UltimateTitleSceeen.backSpriteX7_X;
        this._backSprite3_7.y = SOUL_MV.UltimateTitleSceeen.backSpriteX7_Y;

        this._backSprite3_8 = new Sprite();
        this._backSprite3_8.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX8);
        this._backSprite3_8.x = SOUL_MV.UltimateTitleSceeen.backSpriteX8_X;
        this._backSprite3_8.y = SOUL_MV.UltimateTitleSceeen.backSpriteX8_Y;

        this._backSprite3_9 = new Sprite();
        this._backSprite3_9.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX9);
        this._backSprite3_9.x = SOUL_MV.UltimateTitleSceeen.backSpriteX9_X;
        this._backSprite3_9.y = SOUL_MV.UltimateTitleSceeen.backSpriteX9_Y;

        this._backSprite3_10 = new Sprite();
        this._backSprite3_10.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX10);
        this._backSprite3_10.x = SOUL_MV.UltimateTitleSceeen.backSpriteX10_X;
        this._backSprite3_10.y = SOUL_MV.UltimateTitleSceeen.backSpriteX10_Y;

        this._backSprite3_11 = new Sprite();
        this._backSprite3_11.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX11);
        this._backSprite3_11.x = SOUL_MV.UltimateTitleSceeen.backSpriteX11_X;
        this._backSprite3_11.y = SOUL_MV.UltimateTitleSceeen.backSpriteX11_Y;

        this._backSprite3_12 = new Sprite();
        this._backSprite3_12.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX12);
        this._backSprite3_12.x = SOUL_MV.UltimateTitleSceeen.backSpriteX12_X;
        this._backSprite3_12.y = SOUL_MV.UltimateTitleSceeen.backSpriteX12_Y;

        this._backSprite3_13 = new Sprite();
        this._backSprite3_13.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX13);
        this._backSprite3_13.x = SOUL_MV.UltimateTitleSceeen.backSpriteX13_X;
        this._backSprite3_13.y = SOUL_MV.UltimateTitleSceeen.backSpriteX13_Y;

        this._backSprite3_14 = new Sprite();
        this._backSprite3_14.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX14);
        this._backSprite3_14.x = SOUL_MV.UltimateTitleSceeen.backSpriteX14_X;
        this._backSprite3_14.y = SOUL_MV.UltimateTitleSceeen.backSpriteX14_Y;

        this._backSprite3_15 = new Sprite();
        this._backSprite3_15.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX15);
        this._backSprite3_15.x = SOUL_MV.UltimateTitleSceeen.backSpriteX15_X;
        this._backSprite3_15.y = SOUL_MV.UltimateTitleSceeen.backSpriteX15_Y;

        this._backSprite3_16 = new Sprite();
        this._backSprite3_16.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX16);
        this._backSprite3_16.x = SOUL_MV.UltimateTitleSceeen.backSpriteX16_X;
        this._backSprite3_16.y = SOUL_MV.UltimateTitleSceeen.backSpriteX16_Y;

        this._backSprite3_17 = new Sprite();
        this._backSprite3_17.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX17);
        this._backSprite3_17.x = SOUL_MV.UltimateTitleSceeen.backSpriteX17_X;
        this._backSprite3_17.y = SOUL_MV.UltimateTitleSceeen.backSpriteX17_Y;

        this._backSprite3_18 = new Sprite();
        this._backSprite3_18.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX18);
        this._backSprite3_18.x = SOUL_MV.UltimateTitleSceeen.backSpriteX18_X;
        this._backSprite3_18.y = SOUL_MV.UltimateTitleSceeen.backSpriteX18_Y;

        this._backSprite3_19 = new Sprite();
        this._backSprite3_19.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX19);
        this._backSprite3_19.x = SOUL_MV.UltimateTitleSceeen.backSpriteX19_X;
        this._backSprite3_19.y = SOUL_MV.UltimateTitleSceeen.backSpriteX19_Y;

        this._backSprite3_20 = new Sprite();
        this._backSprite3_20.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX20);    
        this._backSprite3_20.x = SOUL_MV.UltimateTitleSceeen.backSpriteX20_X;
        this._backSprite3_20.y = SOUL_MV.UltimateTitleSceeen.backSpriteX20_Y;

        this._backSprite3_21 = new Sprite();
        this._backSprite3_21.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX21);
        this._backSprite3_21.x = SOUL_MV.UltimateTitleSceeen.backSpriteX21_X;
        this._backSprite3_21.y = SOUL_MV.UltimateTitleSceeen.backSpriteX21_Y;

        this._backSprite3_22 = new Sprite();
        this._backSprite3_22.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX22);
        this._backSprite3_22.x = SOUL_MV.UltimateTitleSceeen.backSpriteX22_X;
        this._backSprite3_22.y = SOUL_MV.UltimateTitleSceeen.backSpriteX22_Y;

        this._backSprite3_23 = new Sprite();
        this._backSprite3_23.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX23);
        this._backSprite3_1.x = SOUL_MV.UltimateTitleSceeen.backSpriteX23_X;
        this._backSprite3_1.y = SOUL_MV.UltimateTitleSceeen.backSpriteX23_Y;

        this._backSprite3_24 = new Sprite();
        this._backSprite3_24.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX24);
        this._backSprite3_24.x = SOUL_MV.UltimateTitleSceeen.backSpriteX24_X;
        this._backSprite3_24.y = SOUL_MV.UltimateTitleSceeen.backSpriteX24_Y;

        this._backSprite3_25 = new Sprite();
        this._backSprite3_25.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX25);
        this._backSprite3_25.x = SOUL_MV.UltimateTitleSceeen.backSpriteX25_X;
        this._backSprite3_25.y = SOUL_MV.UltimateTitleSceeen.backSpriteX25_Y;

        this._backSprite3_26 = new Sprite();
        this._backSprite3_26.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.backSpriteX26);    
        this._backSprite3_26.x = SOUL_MV.UltimateTitleSceeen.backSpriteX26_X;
        this._backSprite3_26.y = SOUL_MV.UltimateTitleSceeen.backSpriteX26_Y;

        this.addChild(this._backSprite1);
        this.addChild(this._backSprite3_1);
        this.addChild(this._backSprite3_2);
        this.addChild(this._backSprite3_3);
        this.addChild(this._backSprite3_4);
        this.addChild(this._backSprite3_5);
        this.addChild(this._backSprite3_6);
        this.addChild(this._backSprite3_7);
        this.addChild(this._backSprite3_8);
        this.addChild(this._backSprite3_9);
        this.addChild(this._backSprite3_10);
        this.addChild(this._backSprite3_11);
        this.addChild(this._backSprite3_12);
        this.addChild(this._backSprite3_13);
        this.addChild(this._backSprite3_14);
        this.addChild(this._backSprite3_15);
        this.addChild(this._backSprite3_16);
        this.addChild(this._backSprite3_17);
        this.addChild(this._backSprite3_18);
        this.addChild(this._backSprite3_19);
        this.addChild(this._backSprite3_20);
        this.addChild(this._backSprite3_21);
        this.addChild(this._backSprite3_22);
        this.addChild(this._backSprite3_23);
        this.addChild(this._backSprite3_24);
        this.addChild(this._backSprite3_25);
        this.addChild(this._backSprite3_26);
        this.addChild(this._backSprite2);
    };



    function SOUL_MV_Particles() {
        this.initialize.apply(this, arguments);
    }

    SOUL_MV_Particles.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
    SOUL_MV_Particles.prototype.constructor = SOUL_MV_Particles;

    SOUL_MV_Particles.prototype.initialize = function() {
        PIXI.DisplayObjectContainer.call(this);
        this._width = Graphics.width;
        this._height = Graphics.height;
        this._sprites = [];
        this._createBitmaps();

        /**
         * The origin point of the SOUL_MV_Particles for scrolling.
         *
         * @property origin
         * @type Point
         */
        this.origin = new Point();
    };

    /**
     * Updates the SOUL_MV_Particles for each frame.
     *
     * @method update
     */
    SOUL_MV_Particles.prototype.update = function() {
        this._updateAllSprites();
    };

    /**
     * @method _createBitmaps
     * @private
     */
    SOUL_MV_Particles.prototype._createBitmaps = function() {
        this._snowBitmap = new Bitmap(9, 9);
    };


    /**
     * @method _updateAllSprites
     * @private
     */
    SOUL_MV_Particles.prototype._updateAllSprites = function() {
        while (this._sprites.length < SOUL_MV.UltimateTitleSceeen.particleNumber) {
            this._addSprite();
        }
        while (this._sprites.length > SOUL_MV.UltimateTitleSceeen.particleNumber) {
            this._removeSprite();
        }
        this._sprites.forEach(function(sprite) {
            this._updateSprite(sprite);
            sprite.x = sprite.ax - this.origin.x;
            sprite.y = sprite.ay - this.origin.y;
        }, this);
    };

    /**
     * @method _addSprite
     * @private
     */
    SOUL_MV_Particles.prototype._addSprite = function() {
        var sprite = new Sprite(this.viewport);
        sprite.opacity = 0;
        this._sprites.push(sprite);
        this.addChild(sprite);
    };

    /**
     * @method _removeSprite
     * @private
     */
    SOUL_MV_Particles.prototype._removeSprite = function() {
        this.removeChild(this._sprites.pop());
    };

    /**
     * @method _updateSprite
     * @param {Sprite} sprite
     * @private
     */
    SOUL_MV_Particles.prototype._updateSprite = function(sprite) {
        this._updateParticleSprite(sprite);
        if (sprite.opacity < 40) {
            this._rebornSprite(sprite);
        }
    };

    /**
     * @method _updateParticleSprite
     * @param {Sprite} sprite
     * @private
     */
    SOUL_MV_Particles.prototype._updateParticleSprite = function(sprite) {
        sprite.bitmap = ImageManager.loadUltimateTitle(SOUL_MV.UltimateTitleSceeen.particleImageName);
        sprite.rotation = Math.PI / 16;
        sprite.ax -= SOUL_MV.UltimateTitleSceeen.particleMoveX;
        sprite.ay += SOUL_MV.UltimateTitleSceeen.particleMoveY;
        sprite.opacity -= 1;
    };

    /**
     * @method _rebornSprite
     * @param {Sprite} sprite
     * @private
     */
    SOUL_MV_Particles.prototype._rebornSprite = function(sprite) {
        sprite.ax = Math.randomInt(Graphics.width + 100) - 100 + this.origin.x;
        sprite.ay = Math.randomInt(Graphics.height + 200) - 200 + this.origin.y;
        sprite.opacity = 160 + Math.randomInt(60);
    };

    TouchInput._onMouseMove = function(event) {

        if (this._mousePressed) {
            var x = Graphics.pageToCanvasX(event.pageX);
            var y = Graphics.pageToCanvasY(event.pageY);
            this._onMove(x, y);
        } else {
            this.effectMouseX = Graphics.pageToCanvasX(event.pageX);
            this.effectMouseY = Graphics.pageToCanvasY(event.pageY);        
        }
    };

})();