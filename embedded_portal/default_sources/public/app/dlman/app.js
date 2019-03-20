/**
 * Download Manager
 */

'use strict';
// global event
var stbEvent = {
		onEvent           : function ( data ) {},
		onMessage         : function ( from, message, data ) {
			this.trigger(message, {from: from, data: data});
		},
		onBroadcastMessage: function ( from, message, data ) {
			this.trigger('broadcast.' + message, {from: from, data: data});
		},
		event             : 0
	},
	app = (function ( global ) {
		// declarations
		var module = {
			models: {
				storage: []
			},
			views : {}
		};

		/**
		 * main entry point
		 */
		module.init = function () {
			global.CMODAL_IMG_PATH = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';
			// default CPage object
			global.baseCPage = module.views.main.page;
			// window self-registration
			if ( !stbStorage.getItem(getWindowKey(WINDOWS.DOWNLOAD_MANAGER)) ) {
				stbStorage.setItem(getWindowKey(WINDOWS.DOWNLOAD_MANAGER), stbWebWindow.windowId());
			}
			accessControl.init();
			module.refreshStorageInfo();
			app.models.main.load();
			// main view setup
			module.views.main.init();
		};

		/**
		 * Main event handler
		 * @param {Event} event
		 */
		module.onKeyDown = function ( event ) {
			// get real key code or exit
			if ( !eventPrepare(event, false, global.currCPage && global.currCPage.name) ) {return;}
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

		module.refreshStorageInfo = function () {
			var usb, i;
			this.models.storage = [];

			getStorageInfo();
			for ( i = 0; i < STORAGE_INFO.length; i++ ) {
				usb = STORAGE_INFO[i];
				if ( usb.isReadOnly === 0 ) {
					stbDownloadManager.RestoreJobs(usb.mountPath);
					usb.freeSizeStr = module.prepareSize(usb.freeSize);
					usb.sizeStr = module.prepareSize(usb.size);
					usb.id = i;
					this.models.storage.push(usb);
				}
			}
			module.trigger('storageUpdated');
		};

		module.prepareSize = function ( size ) {
			if ( size > (1024 * 1024 * 1024) ) {return (Math.floor(size / 1024 / 1024 / 1024 * 100) / 100) + ' ' + _('GB');}
			if ( size > (1024 * 1024) ) {return (Math.floor(size / 1024 / 1024 * 100) / 100) + ' ' + _('MB');}
			if ( size > (1024) ) {return (Math.floor(size / 1024 * 100) / 100) + ' ' + _('KB');}

			return size + ' ' + _('B');
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

		gSTB.EnableServiceButton(true);
		gSTB.EnableVKButton(true);
		stbWindowMgr.SetVirtualKeyboardCoord('none');

		Events.inject(module);

		// export
		return module;
	})(window);




Events.inject(stbEvent);
