/**
 * Internet Bookmarks Manager application base
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

// global event
var stbEvent = {
	onEvent : function() {},
	onMessage: function( from, message, data ){
		this.trigger(message, {from: from, data: data});
	},
	onBroadcastMessage: function( from, message, data ){
		echo(message, 'onBroadcastMessage');
		this.trigger('broadcast.' + message, {from: from, data: data});
	},
	event : 0
	},

	/**
	 * @namespace
	 */
	app = (function(global){
		// declarations
		var module = {
			models : {},
			views  : {},
			ready  : false,
			lastTopWin: null
		};


		/**
		 * main entry point
		 */
		module.init = function(){
			accessControl.init();
			CMODAL_IMG_PATH = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

			// default CPage object
			global.baseCPage = module.views.main.page;
			// window self-registration
			if ( !stbStorage.getItem(getWindowKey(WINDOWS.BROWSER)) ) {
				stbStorage.setItem(getWindowKey(WINDOWS.BROWSER), stbWebWindow.windowId());
			}
			// main view setup
			module.views.main.init();

			// additional localizations
			_('Search in Google');
			_('Open link');

			echo('here', 'ere');
		};

		module.exit = function(){
			echo('app.exit');

			gSTB.EnableTvButton(true);
			gSTB.HideVirtualKeyboard();
			stbWindowMgr.SetVirtualKeyboardCoord('none');

			if ( module.views.main.webWindowHandle ) {
				stbWindowMgr.closeWindow(module.views.main.webWindowHandle);
			}

			// save only changed data
			if ( app.models.main.changed ) {
				app.models.main.save();
			}
			// clear
			stbStorage.removeItem(getWindowKey(WINDOWS.BROWSER));
			stbStorage.removeItem(getWindowKey(WINDOWS.BROWSER_VIEW));

			// full exit
			stbWebWindow.close();
		};

		/**
		 * Main event handler
		 * @param {Event} event
		 */
		module.onKeyDown = function(event){
			// get real key code or exit
			if ( !eventPrepare(event, false, global.currCPage && global.currCPage.name) ) {
				return;
			}
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
					// save only changed data
					if ( app.models.main.changed ) {
						app.models.main.save();
					}
					break;
			}
		};

		// main entry point setup
		global.onload = module.init;

		// set webkit size
		global.moveTo(0, 0);
		global.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);

		// prevent default right-click menu only for releases
		global.oncontextmenu = EMULATION ? null : function(){ return false; };

		// main event listener setup
		document.addEventListener('keydown', module.onKeyDown);

		gSTB.EnableServiceButton(true);
		gSTB.EnableVKButton(true);
		gSTB.EnableTvButton(false);

		// export
		return module;
	})(window);

Events.inject(stbEvent);
