/**
 * Records Manager application base
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

/**
 * @namespace
 */
var stbEvent = {
		onEvent           : function ( data ) {},
		onMessage         : function ( from, message, data ) {
			this.trigger(message, {from: from, data: data});
		},
		onBroadcastMessage: function ( from, message, data ) {
			echo(message, 'onBroadcastMessage');
			this.trigger('broadcast.' + message, {from: from, data: data});
		},
		event             : 0
	},
	app = (function ( global ) {
		// declarations
		var module = {
			models: {},
			views : {}
		};
		module.storage = [];

		/**
		 * main entry point
		 */
		module.init = function () {
			global.CMODAL_IMG_PATH = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';
			// default CPage object
			global.baseCPage = module.views.main.page;
			// main view setup
			module.views.main.init();
		};

		/**
		 * Main event handler
		 * @param {Object} event button code
		 */
		module.onKeyDown = function ( event ) {
			// get real key code or exit
			if ( !eventPrepare(event, false, global.currCPage && global.currCPage.name) ) { return;}
			// has active page
			if ( global.currCPage ) {
				// stop if necessary
				if ( global.currCPage.EventHandler(event) ) {
					event.preventDefault();
					event.stopPropagation();
					return;
				}
			}
			// global events
			switch ( event.code ) {
				case KEYS.POWER:
					stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'portal.standbyMode', '');
					break;
				case KEYS.TV: // tv channels
					module.views.main.actions.tv();
					break;
				case KEYS.WEB: // web
					break;
			}
		};

		/**
		 * update storage data
		 */
		module.refreshStorageInfo = function () {
			module.storage = [];
			getStorageInfo();
			var usb, i;
			for ( i = 0; i < STORAGE_INFO.length; i++ ) {
				usb = STORAGE_INFO[i];
				if ( usb.isReadOnly === 0 ) {
					usb.freeSizeGb = Math.floor(usb.freeSize / 1024 / 1024 / 1024 * 100) / 100;
					usb.sizeGb = Math.floor(usb.size / 1024 / 1024 / 1024 * 100) / 100;
					usb.id = i;
					module.storage.push(usb);
				}
			}
		};

		// main entry point setup
		global.onload = module.init;
		// set webkit size
		global.moveTo(0, 0);
		global.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);
		// prevent default right-click menu only for releases
		global.oncontextmenu = EMULATION ? null : function () {return false;};
		// main event listener setup
		document.addEventListener('keydown', module.onKeyDown);
		// turn on service buttons
		gSTB.EnableServiceButton(true);
		gSTB.EnableVKButton(true);
		stbWindowMgr.SetVirtualKeyboardCoord('none');

		// export
		return module;
	})(window);


Events.inject(stbEvent);
