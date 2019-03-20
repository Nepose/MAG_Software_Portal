'use strict';

/**
 * Help application base
 * @namespace
 * @author Igor Kopanev
 */
// global event
var stbEvent = {
		onEvent : function(data){},
		onMessage: function( from, message, data ){
			this.trigger(message, {from: from, data: data});
		},
		onBroadcastMessage: function( from, message, data ){
			echo(message, 'onBroadcastMessage');
			this.trigger('broadcast.' + message, {from: from, data: data});
		},
		event : 0
	},
	app = (function(global){
		// declarations
		var module = {
			models : {},
			views  : {}
		};

		/**
		 * main entry point
		 */
		module.init = function(){
			CMODAL_IMG_PATH = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

			// default CPage object
			global.baseCPage = module.views.main.page;

			// main view setup
			module.views.main.init();
		};

		module.exit = function(){
			gSTB.EnableTvButton(true);
			gSTB.HideVirtualKeyboard();
			stbWindowMgr.SetVirtualKeyboardCoord('none');
			stbStorage.removeItem(getWindowKey(WINDOWS.HELP));
			// full exit
			stbWebWindow.close();
		};

		/**
		 * Main event handler
		 * @param {Event} event
		 */
		module.onKeyDown = function(event){
			// get real key code or exit
			if ( !eventPrepare(event, false, global.currCPage && global.currCPage.name) ) return;
			// has active page
			if ( global.currCPage ) {
				// stop if necessary
				if ( global.currCPage.EventHandler(event) ) {
					event.preventDefault();
					event.stopPropagation();
					echo('stop currCPage.EventHandler');
					return;
				}
			}
			// global events
			switch ( event.code ) {
				case KEYS.POWER:
					stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'portal.standbyMode', '');
					break;
				case KEYS.TV:
					module.views.main.actions.tv();
					break;
			}
		};

		// main entry point setup
		global.onload = module.init;

		// set webkit size
		global.moveTo(0, 0);
		window.resizeTo(EMULATION ? WINDOW_WIDTH : screen.width, EMULATION ? WINDOW_HEIGHT : screen.height);

		// prevent default right-click menu only for releases
		global.oncontextmenu = EMULATION ? null : function(){return false;};

		// main event listener setup
		document.addEventListener('keydown', module.onKeyDown);

		gSTB.EnableServiceButton(true);
		gSTB.EnableVKButton(true);
		gSTB.EnableTvButton(false);

		// export
		return module;
	})(window);


Events.inject(stbEvent);
