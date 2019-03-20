/**
 * Portal init script
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/* jshint unused:false */

var remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

/**
 * Global event
 * @type {Object}
 */
var stbEvent = {
	onEvent: function () {},
	onNetworkStateChange: function ( state ) {
		echo(state, 'stbEvent.onNetworkStateChange');
	},
	onInternetStateChange: function ( state ) {
		echo(state, 'stbEvent.onInternetStateChange');
	},
	onMessage: function( from, message, data ){
		echo(message, 'Portal.onMessage');
		switch (message) {
			case 'player.timeshift.status':
				stbWebWindow.messageSend(from, message, MediaPlayer.ts_inProgress);
				break;
		}
//		// example for task #14644
// 		if ( message === 'player.timeshift.status' ) {
// 			stbWebWindow.messageSend(from, 'player.timeshift.status', 'true');
// 		}
		this.trigger(message, {from: from, data: data});
	},
	onBroadcastMessage: function( from, message, data ){
		echo(message, 'Portal.onBroadcastMessage');
		this.trigger('broadcast.' + message, {from: from, data: data});
	},
	onInputLanguageChange: function () {
		echo('stbEvent.onInputLanguageChange');

		var currentInputLanguage = gSTB.GetInputLang(),
			nextInputLanguage, i;

		for ( i = 0; i < keyboards[environment.language].length; i++ ) {
			if ( currentInputLanguage === keyboards[environment.language][i][0] ) {
				keyboards.index = i;
			}
		}

		nextInputLanguage = keyboards[environment.language][keyboards.index][1];

		for ( i = 0; i < keyboards[environment.language].length; i++ ) {
			if ( nextInputLanguage === keyboards[environment.language][i][0] ) {
				if ( keyboards.index !== i ) {
					keyboards.index = i;
					gSTB.SetInputLang(nextInputLanguage);
				}
				break;
			}
		}
	}
};

Events.inject(stbEvent);

// write portal window key to stbStorage
stbStorage.setItem(getWindowKey(WINDOWS.PORTAL), stbWebWindow.windowId());

// set webkit size
window.moveTo(0, 0);
window.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);

// prevent default right-click menu only for releases
window.oncontextmenu = EMULATION ? null : function () { return false; };

// image preloading
// media
var imageList = ['type_1.png', 'type_2.png', 'type_3.png', 'type_4.png', 'type_10.png', 'type_11.png', 'type_12.png', 'type_13.png', 'type_20.png', 'type_21.png',  'type_22.png', 'type_23.png', 'type_32.png', 'type_50.png', 'type_51.png', 'type_52.png', 'type_53.png', 'type_60.png', 'type_61.png', 'type_62.png', 'type_63.png', 'type_64.png', 'type_65.png', 'type_66.png', 'type_67.png', 'type_68.png', 'type_69.png',  'type_70.png', 'type_80.png', 'type_81.png',  'type_90.png',  'type_91.png',  'type_92.png',  'type_93.png',  'type_94.png',  'type_100.png', 'type_101.png', 'type_102.png', 'type_103.png', 'type_200.png', 'type_201.png', 'type_202.png', 'ico_sub.png'].map(function(image) {
	return PATH_IMG_PUBLIC + 'media/' + image;
});

imageList = imageList.concat(['aspect.png'].map(function(image) {
	return PATH_ROOT + 'public/img/' + image;
}));

imageLoader(imageList);


// main home screen menu
var ServiceMenu = new CPage();
ServiceMenu.name = 'ServiceMenu';
ServiceMenu.needToCheckUpdate = false;   // property which needs to start check firmware at the end of portal loading

// set as the default page
baseCPage = ServiceMenu;

ServiceMenu.EventHandler = function ( event ) {
	switch ( as.layer ) {
		case as.layers.SL:
			break;
		case as.layers.WS:
			break;
		case as.layers.BASE:
			switch ( event.code ) {
				case KEYS.RIGHT:
				case KEYS.LEFT:
				case KEYS.DOWN:
				case KEYS.UP:
					app.move(event.code);
					break;
				case KEYS.OK:
					app.PressOK();
					break;
				case KEYS.INFO:
					var id = as.position.current.x + as.position.current.y * configuration.desktop.x,
						item = configuration.menu[configuration.desktop.number][id];
					openWindowHelp(item.help);
					break;
				case KEYS.EXIT:
					app.pressExit();
					break;
			}
			break;
	}
};


/**
 * Main page load handler
 */
window.onload = function () {
	echo('******** STB STARTED ********');

	checkEnvVars(); // environment variables check mechanism

	try {
		environment = loadEnvironmentVars(null);

		gSTB.SetSettingsInitAttr(JSON.stringify({
			url: PATH_SYSTEM + 'settings/index.html',
			backgroundColor: '#000'
		}));
		stbWindowMgr.setVirtualKeyboardInitAttr(JSON.stringify({
			url: PATH_SYSTEM + 'keyboard/index.html?nodebug=true'
		}));

		// postponed tasks with 20s delay
		setTimeout(function () {
			// statistics to server
			sendVisitData();
			// set screensaver default implementation
			if (!environment.ssaverName) {
				environment.ssaverName = 'clock';
				gSTB.SetEnv(JSON.stringify({ssaverName:environment.ssaverName}));
			}
			gSTB.SetScreenSaverInitAttr(JSON.stringify({
				url: configuration.screensaversPath + '/' + environment.ssaverName + '/index.html?nodebug=true',
				backgroundColor: '#000'
			}));
			// set screensaver activation interval
			gSTB.SetScreenSaverTime(environment.ssaverDelay*10);
			// launch auto power down
			if ( typeof gSTB.SetAutoPowerDownInitAttr === 'function' ) {
				gSTB.SetAutoPowerDownInitAttr(JSON.stringify({
					url: PATH_SYSTEM + 'pages/standby/index.html',
					backgroundColor: 'transparent'
				}));
				gSTB.SetAutoPowerDownTime(environment.autoPowerDownTime); // time, 0 - disable, 10-86400 sec
			}
		}, 20000);

		// load localization
		gettext.init({name: environment.language, path:'public/portal/lang'}, function () {
			loadScript('public/portal/lang.js', function () {
				echo(WINDOW_WIDTH + 'x' + WINDOW_HEIGHT, 'screen resolution');
				echo(environment.language, 'current language');
				try {
					gSTB.ShowVirtualKeyboard(true);
					// turn on app button

					gSTB.EnableServiceButton(true);
					gSTB.EnableAppButton(true);
					gSTB.EnableTvButton(false);

					fillPage();
					// menu
					init2();
					startPortal();

					// get the list of all storages
					getStorageInfo();

					// media components initialization
					MediaBrowser.Init(document.getElementById('pageMediaBrowser'));
					MediaPlayer.Init(document.getElementById('pageMediaPlayer'));
					WeatherPage.Init(document.getElementById('weatherSettings'));
					IPTVChannels.Init(document.getElementById('pageTVChannels'));

					if ( configuration.mayDVB ) {
						DVBChannels.Init(document.getElementById('pageDVBChannels'));
					}

					if ( configuration.mayDVB || configuration.mayEPG ) {
						DVBEpg.Init( document.getElementById('pageDVBEpg') );
					}

					importStbParams();

					// force unmount all shares
					MediaBrowser.UnmountSMB(true);
					MediaBrowser.UnmountNFS(true);

					// image preloading
					// buttons
					var imageList = ['back.png', 'chnl_minus.png', 'chnl_plus.png', 'exit.png', 'f1.png', 'f2.png', 'f3.png', 'f4.png', 'frame.png', 'info.png', 'menu.png', 'next.png', 'ok.png', 'pgdown.png', 'pgup.png', 'playpause.png', 'prev.png', 'refresh.png', 'stop.png'].map(function(image) {
						return remoteControlButtonsImagesPath + image;
					});

					// menu
					imageList = imageList.concat(['cinema.png', 'def.png', 'dm.png', 'favs.png', 'iserv.png', 'manual.png', 'master.png', 'mb.png', 'nettv.png', 'pvr.png', 'radio.png', 'settings.png', 'tv.png', 'weather.png', 'web.png'].map(function(image) {
						return PATH_IMG_PUBLIC + 'menu/icons/' + image;
					}));

					// backgrounds
					imageList = imageList.concat(['topmenu_bg.png', 'bottommenu_bg.png', 'select_list_bg.png', 'player_menu_bg.png'].map(function(image) {
						return PATH_IMG_PUBLIC + 'backgrounds/' + image;
					}));

					// settings
					imageList = imageList.concat(['update.png', 'timeshift.png', 'speedtest.png', 'settings.png', 'master.png', 'settings_blue.png', 'subtitles.png', 'screenmenu.png', 'dvb.png', 'access.png'].map(function(image) {
						return PATH_IMG_PUBLIC + 'settings/' + image;
					}));

					// indicator
					imageList = imageList.concat(['indicator_lan.png', 'indicator_net.png', 'indicator_wifi.png'].map(function(image) {
						return PATH_IMG_PUBLIC + 'indicator/' + image;
					}));

					// submenu
					imageList = imageList.concat(['ico_water.png', 'ico_moon.png', 'ico_wind.png', 'ico_sun.png', 'ico_filter.png', 'ico_search.png', 'ico_search2.png'].map(function(image) {
						return PATH_IMG_PUBLIC + image;
					}));

					// volume
					imageList = imageList.concat(['volume_bar.png', 'volume_bg.png', 'volume_left.png', 'volume_off.png'].map(function(image) {
						return PATH_IMG_PUBLIC + 'volume/' + image;
					}));

					// codec
					imageList = imageList.concat(['0.png','1.png','2.png','3.png','4.png','5.png','6.png','7.png','8.png'].map(function(image) {
						return PATH_IMG_PUBLIC + 'codec/' + image;
					}));

					// focus background
					imageList = imageList.concat(['glass.png'].map(function(image) {
						return PATH_IMG_PUBLIC + 'menu/' + image;
					}));

					getNetState(true);

					// cache images and show Home screen when is ready
					imageLoader(imageList, synchronizeOperatorChannels(function () {
						// show home page
						var map = [],
							i = 0,
							index = -1;
						document.getElementById('loading').style.display = 'none';
						document.addEventListener('keydown', mainEventListener);
						accessControl.init();
						if ( environment.startPage ) {
							configuration.startPage = environment.startPage;
						}
						if ( configuration.startPage && configuration.startPage !== 'null' ) {
							for ( i = 0; i < configuration.menu.length; i++ ) {
								map = configuration.menu[i].map(function(item){return item.name;});
								index = map.indexOf(configuration.startPage);
								if ( index !== -1) {
									break;
								}
							}
							if ( index !== -1 && configuration.menu[i][index].script ) {
								currCPage = ServiceMenu;
								configuration.desktop.number = i;
								app.moveit(0,index);
								if ( accessControl.state && ( accessControl.data.events.portalOpen || accessControl.data.pages[configuration.menu[i][index].name] ) ) {
									ServiceMenu.Show();
									accessControl.showLoginForm(configuration.menu[i][index].script, null, true);
								} else {
									configuration.menu[i][index].script();
								}
							} else {
								ServiceMenu.Show();
								if ( accessControl.state && accessControl.data.events.portalOpen ) {
									accessControl.showLoginForm(null, null, true);
								}
							}
						} else {
							ServiceMenu.Show();
							if ( accessControl.state && accessControl.data.events.portalOpen ) {
								accessControl.showLoginForm(null, null, true);
							}
						}

						// декоративная накладка слева для панели звука
						document.getElementById('volumeLeft').src = PATH_IMG_PUBLIC + 'volume/volume_left.png';
						// set volume
						if ( environment.audio_initial_volume  || environment.audio_initial_volume === 0 ) {
							volumeSetVolume(environment.audio_initial_volume);
						} else {
							gSTB.SetVolume(environment.audio_initial_volume = configuration.volume.def);
						}

						if ( !EMULATION && DEBUG && DEBUG_NAME && DEBUG_SERVER ) {
							if ( window.ProxyServer ) {
								var proxy = new ProxyServer();
								proxy.init({name:DEBUG_NAME, host:DEBUG_SERVER});
							}
						}

						// bind all window messages
						stbEvent.bind('window.reload', function() {
							document.body.style.display = 'none';
							stbStorage.removeItem(getWindowKey(WINDOWS.PORTAL));
							window.location = PATH_SYSTEM + 'pages/loader/index.html';
						});

						// react to video output mode change
						stbEvent.bind('video.mode.reload', function ( data ) {
							var newVideoMode;

							if ( data && data.data ) {
								data = JSON.parse(data.data);
							} else {
								data = {};
							}
							try {
								newVideoMode = gSTB.RDir('vmode');
							} catch ( e ) {
								echo(e, 'vmode rdir error');
							}
							if ( newVideoMode !== VIDEO_MODE ) {
								echo('VIDEO_MODE was:' + VIDEO_MODE + ' now:' + newVideoMode);
								VIDEO_MODE = newVideoMode;
								// reset MediaBrowser
								MediaBrowser.refreshPreviewViewport();
								// reset MediaPlayer
								MediaPlayer.fullScreen = !MediaPlayer.fullScreen;
								MediaPlayer.changeScreenMode();
								if ( data.manual ) {
									MediaPlayer.standByOff(true);
								}
							}
						});

						stbEvent.bind('portal.standbyMode', function ( message ) {
							var standByStatus = !gSTB.GetStandByStatus(),
								isHdmiEvent   = (message.data === 'hdmiEvent');

							// check stand by mode trigger
							if ( gSTB.StandByMode !== Number(environment.standByMode) ) {
								gSTB.StandByMode = Number(environment.standByMode)
							}

							// deep standBy mode
							if ( Number(environment.standByMode) === 3 ) {
								if ( !MediaPlayer.standByOn(isHdmiEvent) ) {
									gSTB.SetLedIndicatorMode(2);
									gSTB.StandBy(standByStatus);
									// deep standby is a sync operation so following js code will be executed
									// only after next POWER button press
								}
								gSTB.SetLedIndicatorMode(1);
								MediaPlayer.standByOff();
								return;
							}
							// active standBy mode
							echo('isHdmiEvent = ' + isHdmiEvent);
							echo('standByStatus=' + standByStatus);
							if ( standByStatus ) {
								if ( !MediaPlayer.standByOn(isHdmiEvent) ) {
									gSTB.StandBy(standByStatus);
									gSTB.SetLedIndicatorMode(2);
								}
							} else {
								gSTB.StandBy(standByStatus);
								gSTB.SetLedIndicatorMode(1);
								MediaPlayer.standByOff();
							}
						});

						stbEvent.bind('broadcast.storage.mount', function () {
							echo('broadcast.storage.mount in portal');
							// show message on mount (at any time)
							setTimeout(function () {
								new CModalHint(currCPage, _('USB storage is connected'), 3000);
							}, 0);
							if ( currCPage && typeof currCPage.onMountAction === 'function' ) {
								currCPage.onMountAction(true);
							} else {
								// use default action
								echo('default portal USB MOUNTED action');
								getStorageInfo();// get the list of all storages
								// refresh root if visible
								if ( MediaBrowser.isVisible && MediaBrowser.FileList.mode === MEDIA_TYPE_MB_ROOT ) {
									MediaBrowser.FileList.Refresh();
									MediaBrowser.Preview.SetItemsCount();
								}
							}
						});

						stbEvent.bind('broadcast.storage.unmount', function () {
							echo('broadcast.storage.unmount in portal');
							if ( currCPage && typeof currCPage.onMountAction === 'function' ) {
								currCPage.onMountAction(false);
							} else {
								// use default action
								echo('default portal USB UNMOUNTED action');
								getStorageInfo();// get the list of all storages
								// refresh root if visible
								if ( MediaBrowser.isVisible && MediaBrowser.FileList.mode === MEDIA_TYPE_MB_ROOT ) {
									MediaBrowser.FileList.Refresh();
									MediaBrowser.FileList.Activate(true);
									MediaBrowser.Preview.Info(MediaBrowser.FileList.activeItem ? MediaBrowser.FileList.activeItem.data : null);
									MediaBrowser.Preview.SetItemsCount();
								} else if ( MediaBrowser.FileList.mode === MEDIA_TYPE_STORAGE_SATA || MediaBrowser.FileList.mode === MEDIA_TYPE_STORAGE_USB ) {
									// the current dir is not available anymore so go to root
									if ( !gSTB.IsFolderExist(MediaBrowser.FileList.parentItem.url) ) { MediaBrowser.Reset(); }
								}
							}
						});

						stbEvent.bind('environment.reload', function() {
							environment = loadEnvironmentVars(environment.audio_initial_volume);
						});


						gSTB.SetLedIndicatorLevels(parseInt(environment.defaultLedLevel), parseInt(environment.standbyLedLevel));
						// this property will be true only if loaded page is the portal menu page
						if ( ServiceMenu.needToCheckUpdate ) {
							// this call is here and not in the initialization function,
							// because in case of loading portal via http, update modal window
							// appears on top of the loader "Loading ..."
							SettingsPage.loadUpdateList(true);
						}

						echo('done');
					}));
				} catch (err) {
					echo(err);
				}
			});
		});
	} catch (err) {
		echo(err);
	}
};

/**
 * Update operators tv list if OPERATORS_PLS_AUTOREFRESH set to 1
 * @param {Function} callback will be called if sync finished or canceled
 */
function synchronizeOperatorChannels ( callback ) {
	if ( OPERATORS_PLS_AUTOREFRESH === 1 ) { // check synchronization enabled
		var currList = [], hash = {}, changed = false, timeout = null, save, group, newList, i, client,
			root = {
				type: MEDIA_TYPE_GROUP,
				data: []
			};

		if ( typeof OPERATORS_PLS_URL === 'string' && validateUrl(OPERATORS_PLS_URL) ) { // validate list url
			try {
				var text = gSTB.LoadUserData('iptv.json');
				if ( text !== '' ) {
					text = JSON.parse(text);
					currList = IPTVChannels.unescapeChanels(text);
				}
			} catch ( e ) {
				currList = [];
				echo(e, 'TVChannels parse');
			}

			if ( OPERATORS_PLS_GROUP_NAME ) { // if group name specified find it in channels list
				for ( i = 0; i < currList.length; i++ ) {
					if ( currList[i].name === OPERATORS_PLS_GROUP_NAME && Array.isArray(currList[i].data) ) { // found group with specified name
						group = currList[i];
						break;
					}
				}
				if ( !group ) { // group not found
					currList = [].concat(group = { // create new group
						data: [],
						name: OPERATORS_PLS_GROUP_NAME,
						type: MEDIA_TYPE_GROUP
					}, currList);
				}
			} else {
				group = root;
				group.data = currList;
			}

			client = new XMLHttpRequest();
			client.open('GET', OPERATORS_PLS_URL, true);
			client.responseType = 'text';
			client.onload = function () {
				var data = client.responseText;

				clearTimeout(timeout);
				if ( !data || data.indexOf('#EXTINF:') === -1 ) { // return if something wrong and list of channels not loaded
					callback();
					return false;
				}
				newList = MediaBrowser.ParsePlaylist(OPERATORS_PLS_URL.split('.').pop(), data); // parse channels list

				if ( group.data.length !== newList.length ) {
					changed = true;
				} else {
					// hash from new list
					for ( i = 0, hash.length = newList.length; i < newList.length; i++ ) {
						if ( newList[i].url !== undefined ) {hash[newList[i].url] = newList[i];}
					}
					changed = group.data.some(function ( channel ) { // check changes in channels list
						if ( channel.url !== undefined ) { // is not a group
							if ( newList[channel.url] !== undefined && newList[channel.url].name === channel.name ) {
								return false; // no changes found
							}
						}
						return true; // something changed
					});
				}
				// save changes
				if ( changed ) {
					if ( OPERATORS_PLS_GROUP_NAME ) {
						group.data = newList;
						IPTVChannels.checkTS_data(currList);
						save = IPTVChannels.escapeChanels(currList);
					} else {
						IPTVChannels.checkTS_data(newList);
						save = IPTVChannels.escapeChanels(newList);
					}
					gSTB.SaveUserData('iptv.json', JSON.stringify(save));
					IPTVChannels.loadChanels(); // apply all saved changes at iptv
				}
				callback();
			};
			client.onerror = function () {
				echo('ajax error happened during playlist update! abort.');
				clearTimeout(timeout);
				callback();
			};
			try {
				client.send(null);
			} catch ( e ) {
				echo('error during playlist update: ' + e);
			}
			// abort after some time (20s)
			timeout = setTimeout(function () {
				client.abort();
				callback();
				echo('ajax abort on timeout during playlist update');
			}, 20000);
		}
	} else {
		callback();
	}
}

// Локализация
function fillPage () {
	echo('start filling page');
	echo(MODEL_TYPE, 'STB mtype');

	gSTB.SetObjectCacheCapacities(1000000, 7000000, 20000000);

	if ( environment.autoupdateURL ) {
		configuration.url.updateList = environment.autoupdateURL;
	}

	SettingsPage.Init(document.getElementById('pageSettings'));
}


// ициализация встроенного портала
function startPortal () {
	echo('Start Embeded Portal');

	// set bookmark page url
	stbWindowMgr.setWebFaceInitAttr(JSON.stringify({
		// URL possible options:
		// mode = Choose page to display Bookmarks = 1, Browser = 2
		// url = if mode is equal to 2, trying to browsing this link
		// view = if isset right url and mode is equal to 2, display browser in full screen
		url: PATH_ROOT + 'public/app/ibman/index.html?mode=2'
	}));

	STORAGE_INFO.forEach(function(item){
		stbDownloadManager.RestoreJobs(item.mountPath);
	});

	try {
		VIDEO_MODE = gSTB.RDir('vmode');
	} catch ( e ) { echo(e, 'vmode rdir error'); }
	echo(VIDEO_MODE, 'current video mode');

	pageOn();
}


function pageOn () {
	gSTB.EnableServiceButton(true);
	gSTB.EnableVKButton(true);

	var settMaster = JSON.parse(gSTB.GetEnv(JSON.stringify({varList:['settMaster','Image_Desc']})));
	if ( !settMaster.result.settMaster && (new RegExp('factory image')).test(settMaster.result.Image_Desc.toLowerCase()) && configuration.masterSettingOnStart) {
		var currentPage = currCPage;
		loadMasterSettings(function() {
			MasterSettings.origin = currentPage;
		});
	} else {
        ServiceMenu.Init(document.getElementById('pageServiceMenu'));
        // master page doesn't start, and we need to check update firmware
        ServiceMenu.needToCheckUpdate = true;
		pageOnContinue();
	}
}


function pageOnContinue () {
	// SMB
	try {
		SMB_ARRAY = JSON.parse(gSTB.LoadUserData('smb_data'));
		if ( SMB_ARRAY && Array.isArray(SMB_ARRAY) ) {
			SMB_ARRAY.forEach(function(item){
				if (item.folder.charAt(item.folder.length - 1) === '/') {
					item.folder = item.folder.slice(0, -1);
				}
				if ( item.automount === undefined ) {
					// cache auth data
					SMB_AUTH['//'+item.url+'/'+item.folder] = {login:item.login, pass:item.pass};
				}
			});
		} else {
			SMB_ARRAY = [];
		}
	}  catch ( e ) {
		echo(e, 'SMB data parsing error');
		// save valid blank data
		gSTB.SaveUserData('smb_data', '[]');
	}

	// NFS
	try {
		NFS_ARRAY = JSON.parse(gSTB.LoadUserData('nfs_data'));
		if ( NFS_ARRAY && Array.isArray(NFS_ARRAY) ) {
			NFS_ARRAY.forEach(function(item){
				if (item.folder && item.folder.charAt(0) !== '/') {
					item.folder = '/' + item.folder;
				}
				if (item.folder.charAt(item.folder.length - 1) === '/') {
					item.folder = item.folder.slice(0, -1);
				}
			});
		} else {
			NFS_ARRAY = [];
		}
	}  catch ( e ) {
		echo(e, 'NFS data parsing error');
		// save valid blank data
		gSTB.SaveUserData('nfs_data', '[]');
	}
}


function mainEventListener ( event ) {
	// get real key code or exit
	if ( !eventPrepare(event, false, currCPage.name) ) { return; }
	// has active page
	if ( currCPage ) {
		// stop if necessary
		if ( currCPage.EventHandler(event) ) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
	}
	// global events
	switch ( event.code ) {
		// Print Screen
		case 220:
			echo('\n\n\n<html><head>\n' + document.head.innerHTML + '\n</head>\n<body>\n' + document.body.innerHTML + '\n</body>\n</html>\n');
			break;
		// sound volume
		case KEYS.MUTE:
			toggleMuteState();
			break;
		case KEYS.VOLUME_UP:
			if ( [MediaBrowser, MediaPlayer, ServiceMenu, IPTVChannels, DVBChannels].indexOf(currCPage) !== -1 ) {
				if (environment.audio_initial_volume < 100) {
					environment.audio_initial_volume += configuration.volume.step;
				}
				volumeSetVolume(environment.audio_initial_volume);
				event.preventDefault();
				event.stopPropagation();
			}
			break;
		case KEYS.VOLUME_DOWN:
			// event.srcElement === HTMLInputElement
			if ( [MediaBrowser, MediaPlayer, ServiceMenu, IPTVChannels, DVBChannels].indexOf(currCPage) !== -1 ) {
				if (environment.audio_initial_volume > 0) {
					environment.audio_initial_volume -= configuration.volume.step;
				}
				volumeSetVolume(environment.audio_initial_volume);
				event.preventDefault();
				event.stopPropagation();
			}
			break;
		case KEYS.POWER:
			stbWebWindow.messageSend(stbWebWindow.windowId(), 'portal.standbyMode', '');
			getNetState(!gSTB.GetStandByStatus());
			break;
		case KEYS.TV: // tv channels
			if ( (currCPage !== IPTVChannels && currCPage.parent !== IPTVChannels && !(currCPage instanceof CModal) && currCPage !== window.MasterSettings ) /*|| (currCPage === MediaPlayer && MediaPlayer.parent !== IPTVChannels )*/ ) {
				if ( accessControl.state && accessControl.data.pages[IPTVChannels.menuId] ) {
					accessControl.showLoginForm(function () {
						MediaPlayer.SubscribersReset();
						MediaPlayer.end();
						IPTVChannels.Reset();
						IPTVChannels.Show(true, ServiceMenu);
					});
					break;
				}
				MediaPlayer.SubscribersReset();
				MediaPlayer.end();
				IPTVChannels.Reset();
				IPTVChannels.Show(true, ServiceMenu);
			}
			break;
		case KEYS.WEB: // web
			stbWindowMgr.LoadUrl('http://www.google.ru');
			stbWindowMgr.raiseWebWindow();
			break;
	}
}


function sendVisitData () {
	// read data
	var file = gSTB.LoadUserData('visit_data');
	// there is some data
	if ( file ) {
		try {
			var post = [],
				data = JSON.parse(file);
			for ( var name in data ) {
				if ( data.hasOwnProperty(name) ) {
					post.push(name + '=' + data[name]);
				}
			}
			// really non-empty
			if ( post.length > 0 ) {
				// send
				var xmlhttp = new XMLHttpRequest();
				xmlhttp.open('PUT', 'http://stat.infomir.com/' + gSTB.RDir('MACAddress'), true);
				xmlhttp.onreadystatechange = function () {
					if ( xmlhttp.readyState === 4 && xmlhttp.status === 200 ) {
						// clear on success
						gSTB.SaveUserData('visit_data', '{}');
					}
				};
				echo(data, 'send user data');
				xmlhttp.send(post.join('&'));
			}
		} catch ( e ) {
			echo(e, 'sendVisitData');
			// wrong format so clearing
			gSTB.SaveUserData('visit_data', '{}');
		}
	}
}


/**
 * Periodically check online status.
 * List of address is in the config. Try one by one configuration.url.pingAttempts times.
 */
function sendPingRequest () {
	// there are some addresses
	if ( configuration.url.ping.length > 0 ) {
		// send
		ajax('get', configuration.url.ping[sendPingRequest.linkIndex] + '?time=' + Date.now(), function(data, status) {
			var state = status > 0 && data === 'ok';
			// display
			document.getElementById('network_status').className = (state ? 'active' : '');

			if ( state ) {
				// exec callback
				if ( CURRENT_INTERNET_STATE !== state ) { stbEvent.onInternetStateChange(true); }
				// update global flag
				CURRENT_INTERNET_STATE = true;
				sendPingRequest.errorCount = 0;
			} else {
				// try next address
				sendPingRequest.linkIndex = ++sendPingRequest.linkIndex % configuration.url.ping.length;
				// check limit
				if ( ++sendPingRequest.errorCount >= configuration.url.pingAttempts ) {
					// stop trying
					sendPingRequest.errorCount = 0;
					// exec callback
					if ( CURRENT_INTERNET_STATE !== state ) {
						stbEvent.onInternetStateChange(false);
					}
					// update global flag
					CURRENT_INTERNET_STATE = false;
				} else {
					sendPingRequest();
				}
			}
		}, {'Cache-Control': 'no-cache'});
	}
}

// amount of consecutive ping failures
sendPingRequest.errorCount = 0;

// current active ping address position
sendPingRequest.linkIndex = 0;


CURRENT_WIFI_STATE = gSTB.GetWifiLinkStatus();

stbEvent.onWifiStateChange = function ( state ) {
	state = !!state;
	if ( CURRENT_WIFI_STATE !== state ) {
		CURRENT_WIFI_STATE = state;
		document.getElementById('wifi_status').className = state ? 'active' : '';
		if ( getNetworkState() ) { sendPingRequest(); }
	}
};

/**
 * periodical web/lan check
 * @return {boolean} state
 */
function getNetworkState () {
	var lan   = gSTB.GetLanLinkStatus(),
		state = lan || CURRENT_WIFI_STATE;
	// set decoration
	document.getElementById('lan_status').className  = lan  ? 'active' : '';

	if ( !state ) {
		document.getElementById('network_status').className = '';
	}

	// exec callback
	if ( CURRENT_NETWORK_STATE !== state && typeof stbEvent.onNetworkStateChange === 'function' ) {
		stbEvent.onNetworkStateChange(state);
	}
	// network is down so inet is down
	if ( !state && CURRENT_INTERNET_STATE !== false ) {
		CURRENT_INTERNET_STATE = false;
		// exec inet callback
		if ( typeof stbEvent.onInternetStateChange === 'function' ) {
			stbEvent.onInternetStateChange(CURRENT_INTERNET_STATE);
		}
	}
	// update global flag
	CURRENT_NETWORK_STATE = state;
	return state;
}


/**
 * Local network and internet check timer
 * @type {number}
 */
var getNetStateTimer = null;

/**
 * Check local network and internet
 * @param {boolean} state
 */
function getNetState ( state ) {
	var pcounter = 0;

	if ( state ) {
		// check network and online statuses
		document.getElementById('wifi_status').className = CURRENT_WIFI_STATE ? 'active' : '';
		if ( getNetworkState() ) { sendPingRequest(); }

		if ( getNetStateTimer !== null ) {
			clearInterval(getNetStateTimer);
			getNetStateTimer = null;
		}
		getNetStateTimer = setInterval(function () {
			// check network and online statuses
			if ( getNetworkState() && pcounter >= 9 ) {
				sendPingRequest();
				pcounter = 0;
			}
			pcounter++;
		}, EMULATION ? 700000 : 7000);
	} else {
		clearInterval(getNetStateTimer);
		getNetStateTimer = null;
	}
}


var SettingsPage = new CPage();
SettingsPage.name = 'SettingsPage';

SettingsPage.onInit = function() {
	var self = this, map = [];
	settingsClockControl();
	settingsFrontPanelControl();
	this.FileList = new CScrollList(this);
	this.FileList.Init(this.handle.querySelector('.body .content .cslist-main'));
	this.FileList.Add = generate;
	this.FileList.AddElement = generate_elements;
	this.FileList.AddTable = generate_table;
	this.update_list = [];


	this.FileList.EventHandler = function( event ){
		var element =  SettingsPage.FileList.elements[SettingsPage.FileList.activeItem.number];
		if (typeof element.EventHandler === 'function') {
			element.EventHandler(event);
		} else {
			switch (event.code) {
				case KEYS.LEFT:
				case KEYS.RIGHT:
					event.stopped = true;
					break;
			}
		}
		CScrollList.prototype.EventHandler.call(this, event);
	};

	this.BCrumb = new CBreadCrumb();
	this.BCrumb.Init(PATH_IMG_PUBLIC + 'settings/', this.handle.querySelector('.body .header .cbcrumb'));
	this.BCrumb.SetName(_('Settings'));
	this.BCrumb.Push('/', 'settings_blue.png', '');
	this.pressExit = sett_pressExit;
	this.save = settingsSave;
	this.loadUpdateList = loadUpdateList;
	this.advanced = function(){};

	this.changes = {};
	this.main = [];
	this.FileList.initPages = {
		Playback: sett_Playback_init,
		Interface: sett_Interface_init,
		AutoUpdate: sett_AutoUbdate_init,
		TS: sett_TS_init,
		SpeedTest: sett_speed_test_init,
		Traceroute: sett_traceroute_init,
		Setup: sett_setup_init,
		MasterSettingsStart: sett_master_settings_init,
		DVB: sett_DVB_init,
		accessControl: settAccessControl,
		Main: function() {
			SettingsPage.BPanel.Hidden(SettingsPage.buttons.F1, true);
			SettingsPage.BPanel.Hidden(SettingsPage.buttons.F2, true);
			SettingsPage.BPanel.Hidden(SettingsPage.buttons.OK, true);
			SettingsPage.FileList.layer = SettingsPage.FileList.layers.mainPage;
			SettingsPage.FileList.Add(SettingsPage.main);
		},
		Teletext: sett_Teletext_init
	};
	(function () {
		var tmpList = [], item,
			dict = {
				playback      : {name: _('Playback'), rId: 'Playback', className: 'subtitles', func: self.FileList.initPages.Playback},
				'interface'   : {name: _('Interface'), rId: 'Interface', className: 'screenmenu', func: self.FileList.initPages.Interface},
				update        : {name: _('Software autoupdate'), rId: 'SoftwareAutoUpdate', className: 'update', func: self.FileList.initPages.AutoUpdate},
				timeShift     : {name: _('TimeShift'), rId: 'TimeShift', className: 'timeshift', func: self.FileList.initPages.TS},
				settings      : {name: _('System settings'), rId: 'SystemSettings', className: 'settings', func: self.FileList.initPages.Setup},
				masterSettings: {name: _('Setup Wizard'), rId: 'SetupWizard', className: 'masterSettings', func: self.FileList.initPages.MasterSettingsStart},
				DVB           : {name: _('DVB'), rId: 'DVB', className: 'dvb', func: self.FileList.initPages.DVB},
				accessControl  : {name: _('Access control'), rId: 'accessControl', className: 'accessControl', func: self.FileList.initPages.accessControl},
				teletext  : {name: _('Teletext'), rId: 'teletext', className: 'teletext', func: self.FileList.initPages.Teletext}
			};

		if ( configuration.setting.settingsList.indexOf('traceroute') !== -1 && RULES.Traceroute && configuration.setting.settingsList.indexOf('speedTest') !== -1 && RULES.SpeedTest ) {
			dict.speedTest = {name: _('Network Diagnostics'), rId: 'SpeedTest', className: 'speedtest', func: self.FileList.initPages.SpeedTest};
			dict.traceroute = {rId: false};
		} else if ( configuration.setting.settingsList.indexOf('speedTest') !== -1 && RULES.SpeedTest ) {
			dict.speedTest = {name: _('Speed test'), rId: 'SpeedTest', className: 'speedtest', func: self.FileList.initPages.SpeedTest};
			dict.traceroute = {rId: false};
		} else if ( configuration.setting.settingsList.indexOf('traceroute') !== -1 && RULES.Traceroute ) {
			dict.traceroute = {name: _('Network Diagnostics'), rId: 'Traceroute', className: 'traceroute', func: self.FileList.initPages.Traceroute};
			dict.speedTest = {rId: false};
		} else {
			dict.speedTest = {rId: false};
			dict.traceroute = {rId: false};
		}

		for ( var i = 0; i < configuration.setting.settingsList.length; i++ ) {
			item = dict[configuration.setting.settingsList[i]];
			tmpList.push(item);
			echo(item, i);
			if ( RULES[item.rId] ) { map.push(configuration.setting.settingsList[i]);self.main.push(item);}
		}

		if ( configuration.setting.settingsList.indexOf('traceroute') !== -1 && RULES.Traceroute && configuration.setting.settingsList.indexOf('speedTest') !== -1 && RULES.SpeedTest ) {
			// not in menu but must to be exists in layers
			map.push('traceroute');
		}

		//tmpList.forEach(function ( item ) {
		//	echo([item.rId, item.name]);
		//	if ( RULES[item.rId] ) { map.push(item.name);self.main.push(item); }
		//});
	})();
	this.FileList.layers = {
		mainPage: 0,
		playback: map.indexOf('playback') + 1,
		Interface: map.indexOf('interface') + 1,
		AutoUpdate: map.indexOf('update') + 1,
		TS: map.indexOf('timeShift') + 1,
		SpeedTest: map.indexOf('speedTest') + 1,
		Setup: map.indexOf('settings') + 1,
		MasterSettingsStart: map.indexOf('masterSettings') + 1,
		DVB: map.indexOf('DVB') + 1,
		accessControl: map.indexOf('accessControl') + 1,
		Traceroute: map.indexOf('traceroute') + 1,
		teletext: map.indexOf('teletext') + 1
	};

	this.ExitBPanel = new CButtonPanel(this);
	this.ExitBPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .exit div.cbpanel-main'));
	this.ExitBPanel.btnExit = this.ExitBPanel.Add(KEYS.EXIT, 'exit.png', configuration.newRemoteControl ? _('Exit') : '', function () {
		SettingsPage.pressExit();
	});

	this.BPanel = new CButtonPanel(this);
	this.BPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .main div.cbpanel-main'));
	this.buttons = {};
	this.buttons.F1 = this.BPanel.Add(KEYS.F1, 'f1.png', _('Advanced'), function(){SettingsPage.advanced();}, true);
	this.buttons.F2 = this.BPanel.Add(KEYS.F2, 'f2.png', _('Update manually'), function () {
		UpdatePage.Show(false, false);
	}, true);
	this.buttons.OK = this.BPanel.Add(KEYS.OK, 'ok.png', _('Save'), this.save, true);


	this.BPanelTraceroute = new CButtonPanel(this);
	this.BPanelTraceroute.listButtons = [];
	this.BPanelTraceroute.activeItemIndex = 0;
	this.BPanelTraceroute.EventHandler = function ( event ) {
		if ( event.code === KEYS.OK ) {
			echo(this.listButtons[this.activeItemIndex].data.onclick);
			this.listButtons[this.activeItemIndex].data.onclick();
			return;
		}
		this.listButtons[this.activeItemIndex].classList.remove('focused');
		if ( event.code === KEYS.LEFT ) {
			--this.activeItemIndex;
			if ( this.activeItemIndex < 0 ) {
				this.activeItemIndex = this.listButtons.length - 1;
			}
		} else if ( event.code === KEYS.RIGHT ) {
			++this.activeItemIndex;
			if ( this.activeItemIndex === this.listButtons.length ) {
				this.activeItemIndex = 0;
			}
		}
		this.listButtons[this.activeItemIndex].classList.add('focused');
	};

	this.mouse_over = function(e) {
		SettingsPage.FileList.Focused(e.currentTarget, true, true);
	};
	this.mouse_over_element = function(e) {
		SettingsPage.FileList.Focused(e.currentTarget, true, true);
	};

};


SettingsPage.onShow = function() {
	this.loadUpdateList();
	if ( SettingsPage.FileList.layer !== SettingsPage.FileList.layers.MasterSettingsStart ) {
		this.FileList.back_element = [0, 0, 0, 0, 0, 0, 0, 0];
	}
	this.FileList.initPages.Main();
};

SettingsPage.onMountAction = function () {
	echo('onMountAction in timeshift settings');
	getStorageInfo();// get the list of all storages
	// if this is TimeShift settings page
	if ( SettingsPage.FileList.layer === SettingsPage.FileList.layers.TS ) {
		var path_list = [], name, value, no_path = true;
		if ( STORAGE_INFO.length > 0 ) {
			for (var i = 0; i < STORAGE_INFO.length; i++) {
				name = STORAGE_INFO[i].label;
				value = STORAGE_INFO[i].mountPath;
				path_list[i] = {title : name, value : value};
				if ( environment.ts_path === value ) {
					no_path = false;
				}
			}
			if ( no_path ) {
				path_list.splice(0, 0, {title : _('None'), value : ''});
			}
		} else {
			path_list.splice(0, 0, {title : _('None'), value : ''});
		}
		SettingsPage.FileList.elements[2].SetData(path_list);
		SettingsPage.FileList.elements[2].SelectById(environment.ts_path, false);
	}
};

SettingsPage.EventHandler = function(e) {
	switch (SettingsPage.FileList.layer) {
		case SettingsPage.FileList.layers.mainPage: // Main page
			var found;
			switch (e.code) {
				case KEYS.EXIT:
					SettingsPage.pressExit();
					break;
				case KEYS.DOWN:
					found = this.FileList.Next(null, false, 2, false);
					break;
				case KEYS.UP:
					found = this.FileList.Next(null, true, 2, false);
					break;
				case KEYS.LEFT:
					found = this.FileList.Next(null, true);
					break;
				case KEYS.RIGHT:
					found = this.FileList.Next(null, false);
					break;
				case KEYS.OK:
					SettingsPage.FileList.back_element[SettingsPage.FileList.layer] = SettingsPage.FileList.activeItem.number;
					SettingsPage.FileList.elements[SettingsPage.FileList.activeItem.number].onclick();
			}
			this.FileList.Focused(found, true);
			e.preventDefault();
			break;
		case SettingsPage.FileList.layers.AutoUpdate:
			if ( e.code === KEYS.F2 ) {
				SettingsPage.loadUpdateList(false, true);
				break;
			}
			/* falls through */
		case SettingsPage.FileList.layers.playback:
		case SettingsPage.FileList.layers.Interface:
		case SettingsPage.FileList.layers.TS:
		case SettingsPage.FileList.layers.DVB:
		case SettingsPage.FileList.layers.teletext:
		case SettingsPage.FileList.layers.accessControl:
			this.FileList.EventHandler(e);
			if (e.stopped === true) {
				break;
			}
			switch (e.code) {
				case KEYS.EXIT:
					SettingsPage.pressExit();
					e.preventDefault();
					break;
				case KEYS.OK:
				case KEYS.F1:
					SettingsPage.BPanel.EventHandler(e);
					break;
			}
			break;
		case SettingsPage.FileList.layers.SpeedTest:
			switch (e.code) {
				case KEYS.EXIT:
					SettingsPage.pressExit();
					e.preventDefault();
					break;
				default :
					if ( configuration.setting.settingsList.indexOf('traceroute') !== -1 && RULES.Traceroute ) {
						this.BPanelTraceroute.EventHandler(e);
					}
					break;
			}
			break;
		case SettingsPage.FileList.layers.Traceroute:
			switch (e.code) {
				case KEYS.EXIT:
					SettingsPage.pressExit();
					e.preventDefault();
					break;
			}
			break;
	}
};


/**
 * @function loadUpdateList load updating data from server, can show update modal
 * @param {boolean} check show update modal window with choice (update or not) or force updating
 * @param {boolean} forceShow update modal window forced show if true
 */
function loadUpdateList(check, forceShow) {
	var req           = new XMLHttpRequest(),
		hashData      = '',
		environment = gSTB.GetEnv(JSON.stringify({varList:['language','portal1','portal2', 'autoupdate_cond']})),
		currTimeStamp = Math.round(new Date().getTime() / 1000);

	try {
		environment = JSON.parse(environment).result;
		environment['autoupdate_cond'] = parseInt(environment['autoupdate_cond'], 10) || 0;
	} catch ( error ) {
		console.log('can\'t parse environment ' + error);
		environment = {}
	}

	if ( (check && (environment.autoupdate_cond == 0 || environment.autoupdate_cond == 1)) || forceShow ) {
		req.open('GET', configuration.url.updateList + '?mac=' + gSTB.GetDeviceMacAddress(), true);
		echo(configuration.url.updateList + '?mac=' + gSTB.GetDeviceMacAddress(), 'update list');
		req.onreadystatechange = function() {
			if (req.readyState === 4) {
				if (req.status === 200) {
					try {
						SettingsPage.update_list = JSON.parse(req.responseText);
					} catch ( ex ) {
						SettingsPage.update_list = [];
					}

					if (check) {
						switch (environment.autoupdate_cond) {
							case 0:
								UpdatePage.Show(true, false);
								break;
							case 1:
								UpdatePage.Show(true, true);
								break;
						}
					} else if ( forceShow ) {
						UpdatePage.Show(false, false);
					}
				}
			}
		};

		// modelNameEx + currentVersion + serialNumber + macAddr + currentLang + portalUrl + porta1 + portal2 + userAgent + current_t_wo_sec
		hashData += (gSTB.GetDeviceModelExt ? gSTB.GetDeviceModelExt() : gSTB.GetDeviceModel());
		hashData += gSTB.GetDeviceImageDesc() + gSTB.GetDeviceSerialNumber() + gSTB.GetDeviceMacAddress();
		hashData += (environment.language || 'en') + location.href + (environment.portal1 || '') + (environment.portal2 || '');
		hashData += navigator.userAgent + (currTimeStamp - currTimeStamp % 60);
		// echo(hashData);
		req.setRequestHeader('X-CurrentVersion', gSTB.GetDeviceImageDesc());
		req.setRequestHeader('X-SerialNumber', gSTB.GetDeviceSerialNumber());
		req.setRequestHeader('X-MacAddress', gSTB.GetDeviceMacAddress());
		req.setRequestHeader('X-ModelNameEx', gSTB.GetDeviceModelExt ? gSTB.GetDeviceModelExt() : gSTB.GetDeviceModel());
		req.setRequestHeader('X-Language', environment.language || 'en');
		if ( environment.portal1 ) { req.setRequestHeader('X-Portal1', environment.portal1); }
		if ( environment.portal2 ) { req.setRequestHeader('X-Portal2', environment.portal2); }
		req.setRequestHeader('X-PortalUrl', location.href);
		req.setRequestHeader('X-Hash', gSTB.GetHashVersion1(hashData, ''));

		req.send();
	}
}

function generate(arr) {
	var obj = [];
	SettingsPage.FileList.elements = [];
	elclear(SettingsPage.FileList.handle);
	for (var i = 0; i < arr.length; i++) {
		var ico = element('div', {className: 'ico'});
		var text = element('div', {className: 'text', innerHTML: '<div>' + arr[i].name + '</div>'});
		obj[i] = element('a', {className: arr[i].className, href: '#', onclick: arr[i].func, number: i, onmouseover: SettingsPage.mouse_over, disabled: false, hidden: false}, [ico, text]);
		if (i ===  SettingsPage.FileList.back_element[SettingsPage.FileList.layer]) {
			SettingsPage.FileList.activeItem = obj[i];
		}
		SettingsPage.FileList.elements[i] = obj[i];
	}
	elchild(SettingsPage.FileList.handle, obj);
	SettingsPage.FileList.Activate(true, false);
}


function generate_table(arr, tableClass) {
	var obj = [], left, right;
	tableClass = tableClass ? tableClass : '';
	elclear(SettingsPage.FileList.handle);
	for (var i = 0; i < arr.length; i++) {
		if (!arr[i].title && arr[i].title !== 0 && arr[i].title !== true) {
			right = element('td', {className: 'center', colSpan: '2', id: arr[i].id ? arr[i].id + '_center' : ''}, arr[i].value);
			obj[i] = element('tr', {}, right);
			continue;
		}
		if (!arr[i].value && arr[i].value !== 0 && arr[i].value !== true) {
			left = element('td', {className: 'info_header', colSpan: '2', id: arr[i].id ? arr[i].id + '_header' : ''}, arr[i].title);
			obj[i] = element('tr', {}, left);
			continue;
		}
		left = element('td', {className: 'left', id: arr[i].id ? arr[i].id + '_left' : ''}, arr[i].title);
		right = element('td', {className: 'right', id: arr[i].id ? arr[i].id + '_rigth' : ''}, arr[i].value);
		obj[i] = element('tr', {}, [left, right]);
	}
	var table = element('table', {className: tableClass}, obj);
	var div = element('div', {className: 'box'}, table);
	elchild(SettingsPage.FileList.handle, div);
	SettingsPage.FileList.Activate(true, true);
}


function generate_elements(arr, callback, page) {
	var obj = [], i, input,
		onClick = function () {
			return false;
		},
		onChange = function ( onChange, page ) {
			return function(){
				if ( typeof onChange === 'function' ) {onChange();}
				if (this.IsChanged() === true){
					if (!this._is_changed) {
						SettingsPage.changes[page]++;
					}
					this._is_changed = true;
				}else{
					if (this._is_changed){
						this._is_changed = false;
						SettingsPage.changes[page]--;
					}
				}
				SettingsPage.BPanel.Hidden(SettingsPage.buttons.OK, SettingsPage.changes[page] === 0);
				echo(SettingsPage.changes, this.name);
			};
		},
		onFocus = function () {
			SettingsPage.FileList.elements[this.number].focus();
		};

	SettingsPage.changes[page] = 0;
	SettingsPage.FileList.elements = [];
	SettingsPage.FileList.pre_elements = [];
	elclear(SettingsPage.FileList.handle);
	for (i = 0; i < arr.length; i++) {
		var text = element('div', {className: 'vertical'}, element('div', {className: 'title', innerHTML: arr[i].title})),
			elem = element('div', {className: 'control'}),
			onchange = onChange(arr[i].onChange, page);
			/*onchange = (function(onChange, page){
				return function(){
					if ( typeof onChange === 'function' ) {onChange();}
					if (this.IsChanged() === true){
						if (!this._is_changed) {
							SettingsPage.changes[page]++;
						}
						this._is_changed = true;
					}else{
						if (this._is_changed){
							this._is_changed = false;
							SettingsPage.changes[page]--;
						}
					}
					SettingsPage.BPanel.Hidden(SettingsPage.buttons.OK, SettingsPage.changes[page] === 0);
					echo(SettingsPage.changes, this.name);
				};
			})(arr[i].onChange, page);*/
		input = null;

		obj[i] = element(
			'a',
			{
				href: '#',
				disabled: false,
				hidden: false,
				onclick: onClick,
				className: 'item',
				onmouseover: SettingsPage.mouse_over_element,
				number: i,
				onfocus: onFocus
			},
			[text, elem]
		);

		SettingsPage.FileList.pre_elements[i] = obj[i];

		switch (arr[i].element) {
			case 'select':
				input = new CSelectBox(SettingsPage.FileList, {
					parent: elem,
					data: arr[i].option,
					idField: arr[i].idField? arr[i].idField : 'value',
					nameField: arr[i].nameField? arr[i].nameField : 'title',
					selectedId: arr[i].selected,
					events: {
						onChange: onchange
					},
					container: SettingsPage.FileList.handle
				});
				break;
			case 'button':
				input = element('input', {type: 'button', value: arr[i].value, onclick: arr[i].onClick, className: 'elements wide500'});
				elchild(elem, input);
				break;
			case 'input':
				input = element('input', {type: arr[i].type || 'text', value: arr[i].value, className: 'elements wide500'});
				elchild(elem, input);
				break;
			case 'cinput':
				input = new CInput(SettingsPage.FileList, {
					value: arr[i].value,
					parent: elem,
					name: arr[i].name,
					events: {
						onChange: onchange,
						onKey: arr[i].onKey
					},
					type:  arr[i].type || 'text'
				});
				if (arr[i].id) {
					input.element.id = arr[i].id;
				}
				break;
			case 'checkbox':
				input = new CCheckBox(SettingsPage.FileList, {
					checked: !!arr[i].checked,
					parent: elem,
					name: arr[i].name,
					events: {
						onChange: onchange
					}
				});
				break;
			case 'input_spec':
				input = new CIntervalBox(SettingsPage, {
					parent: elem,
					max: arr[i].maxsize,
					min: arr[i].minsize || 0,
					interval: arr[i].interval,
					value: arr[i].value,
					style: 'elements',
					events: {
						onChange: onchange,
						onNext: arr[i].right,
						onPrevious: arr[i].left
					}
				});
				break;
			case 'info':
				elem.className = 'vertical';
				input =  element('div', {className: 'info'}, arr[i].value);
				elchild(elem, input);
				break;
		}
		SettingsPage.FileList.elements[i] = input;
	}
	elchild(SettingsPage.FileList.handleInner, obj);
	SettingsPage.FileList.activeItem = null;
	SettingsPage.FileList.Activate(true, true);
	if (callback) {
		callback();
	}
}


function sett_pressExit() {
	echo(SettingsPage.FileList.layer, 'sett_pressExit');
	SettingsPage.advanced = function(){};
	switch (SettingsPage.FileList.layer) {
		case SettingsPage.FileList.layers.mainPage:
			SettingsPage.Show(false);
			break;
		case SettingsPage.FileList.layers.SpeedTest:
			if ( configuration.setting.settingsList.indexOf('traceroute') === -1 && !RULES.Traceroute ) {
				SettingsPage.speedtest.stop();
			}
			SettingsPage.BCrumb.Pop();
			SettingsPage.FileList.initPages.Main();
			break;
		case SettingsPage.FileList.layers.Traceroute:
			if ( !SettingsPage.FileList.layers.SpeedTest ) {
				SettingsPage.BCrumb.Pop();
				SettingsPage.FileList.initPages.Main();
			} else {
				SettingsPage.BCrumb.Pop();
				SettingsPage.BCrumb.Pop();
				SettingsPage.FileList.initPages.SpeedTest();
			}
			break;
		default :
			if (SettingsPage.changes[SettingsPage.FileList.layer] !== 0 && SettingsPage.changes[SettingsPage.FileList.layer] !== undefined){
				new CModalConfirm(SettingsPage, _('Confirm'),  _('Some settings have been changed'), _('Cancel'), function(){
					SettingsPage.BCrumb.Pop();
					SettingsPage.FileList.initPages.Main();
				}, _('Save'), function(){
					SettingsPage.save();
					SettingsPage.BCrumb.Pop();
					SettingsPage.FileList.initPages.Main();
				});
			} else {
				SettingsPage.BCrumb.Pop();
				SettingsPage.FileList.initPages.Main();
			}
			break;
	}
}


function sett_Playback_init() {
	SettingsPage.BCrumb.Push('', 'subtitles.png',  _('Playback'));
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.playback;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;
	var list1 = sortingABC(iso639),
		list2 = list1.slice(),
		list3 = [
			{value: 18, title: _('Small')},
			{value: 20, title: _('Normal')},
			{value: 23, title: _('Large')},
			{value: 26, title: _('Huge')}
		],
		list4 = [
			{value: 0xFFFFFF, title: _('White')},
			{value: 0x000000, title: _('Black')},
			{value: 0xFF0000, title: _('Red')},
			{value: 0x0000FF, title: _('Blue')},
			{value: 0x00FF00, title: _('Green')},
			{value: 0xFFFF00, title: _('Yellow')},
			{value: 0x00FFFF, title: _('Cyan')},
			{value: 0xFF00FF, title: _('Magenta')},
			{value: 0xC0C0C0, title: _('Silver')},
			{value: 0x808080, title: _('Gray')},
			{value: 0x800000, title: _('Maroon')},
			{value: 0x808000, title: _('Olive')},
			{value: 0x800080, title: _('Purple')},
			{value: 0x008080, title: _('Teal')},
			{value: 0x000080, title: _('Navy')}
		],
		list5 = [
			{value: 0x10, title: _('Fit on')},
			{value: 0x40, title: _('Zoom')},
			{value: 0x50, title: _('Optimal')},
			{value: 0x00, title: _('Stretch')}
		];
	list2.unshift({title: _('Disabled'), code: 'off', value: -1});

	var arr = [
		{element    : 'select',
			title   : _('Primary audio track language'),
			option  : list1,
			selected: String(environment.lang_audiotracks)
		},
		{element    : 'select',
			title   : _('Primary subtitle language'),
			option  : list2,
			selected: environment.subtitles_on ? String(environment.lang_subtitles) : -1
		},
		{element    : 'select',
			title   : _('Subtitle size'),
			option  : list3,
			selected: environment.subtitlesSize || 20
		},
		{element    : 'select',
			title   : _('Subtitle color'),
			option  : list4,
			selected: environment.subtitlesColor
		},
		{element    : 'select',
			title   : _('Aspect Ratio'),
			option  : list5,
			selected: environment.aspect
		}
	];
	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.playback);
	return false;
}


function sett_Interface_init() {
	SettingsPage.BCrumb.Push('', 'screenmenu.png', _('Interface'));
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.Interface;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;
	var dirs, arr,
		startPageSelected = null,
		findDVBChannels = true,
		screensaverIntervalOptions = null,
		screensaverOptions = [],
		options = [],
		startPageOptions = [
			{title: _('Main menu'), value: 'null'},
			{title: _('IPTV channels'), value: 'tvChannels'},
			{title: _('Home Media'), value: 'mediaBrowser'}
		];

	for ( var i = 0; i < configuration.menu.length; i++ ) {
		for ( var j = 0; j < configuration.menu[i].length; j++ ) {
			if ( findDVBChannels && configuration.menu[i][j].name === 'dvbChannels' ) {
				findDVBChannels = false;
				startPageOptions.push({title: _('DVB channels'), value: configuration.menu[i][j].name});
				break;
			}
		}
	}

	if ( environment.startPage ) {
		startPageSelected = environment.startPage;
	} else if ( configuration.startPage ) {
		startPageSelected = configuration.startPage;
	} else {
		startPageSelected = 'null';
	}

	try {
		var screensavers = JSON.parse(readJSON(configuration.screensaversPath, 'screensavers.json'));
		echo(screensavers, 'screensavers');

		dirs = Object.keys(screensavers);
		echo(dirs, 'dirs');
	} catch ( error ) {
		echo(error, 'screensavers JSON parse error');
		return;
	}

	if ( dirs && dirs.length ) {
		screensaverIntervalOptions = [
			{ title: _('Disabled'), value: 0 },
			{ title: _('1 minute'), value: 6 },
			{ title: _('3 minutes'), value: 18 },
			{ title: _('5 minutes'), value: 30 },
			{ title: _('10 minutes'), value: 60 },
			{ title: _('30 minutes'), value: 180 }
		];

		for ( i = 0; i < dirs.length; i++ ) {
			echo(dirs[i], 'name');
			screensaverOptions.push({title: dirs[i], value: dirs[i]});
		}
	} else {
		screensaverIntervalOptions = [
			{ title: _('Disabled'), value: 0 }
		];
	}

	arr = [
		{element: 'select', title: _('Start page'), option: startPageOptions, selected: startPageSelected},
		{element   : 'select', title: _('Weather system format'), option: [
			{title: _('Metric (Celsius, meters per second)'), value: 'metricSys'},
			{title: _('English (Fahrenheit, miles per hour)'), value: 'englishSys'}
		], selected: environment.weather_conf},
		{element   : 'select', title: _('HDMI event reaction:'), option: [
			{title: _('Disabled'), value: '0'},
			{title: _('Enabled'), value: '5'},  // default delay = 5 sec
			{title: _('5 minutes delay'), value: '300'},
			{title: _('10 minutes delay'), value: '600'}
		], selected: environment.hdmi_event_delay},
		{element   : 'select', title: _('Screensaver interval'), option: screensaverIntervalOptions, selected: environment.ssaverDelay},
		{element: 'select', title: _('Screensaver'), option: screensaverOptions, selected: environment.ssaverName},
		{element: 'checkbox', checked: environment.playerClock, title: _('Clock during playing')},
		{element: 'input_spec', title: _('LED brightness:'), value: environment.defaultLedLevel, interval: 5, maxsize: 100},
		{element: 'input_spec', title: _('LED brightness(blink/standby):'), value: environment.standbyLedLevel, interval: 5, maxsize: 100},
		{element   : 'select', title: _('RC model'), option: [
			{title: 'SRC-4807', value: 'SRC4807'},
			{title: 'SRC-4513 (slim)', value: 'SRC4513'}
		], selected: environment.controlModel? environment.controlModel : configuration.newRemoteControl? 'SRC4813' : 'SRC4807'}
	];

	if ( gSTB.SupportedStandByModes && gSTB.SupportedStandByModes.length > 1 ) {
		for ( i = 0; i < gSTB.SupportedStandByModes.length; i++ ) {
			options.push({
				title: ['', _('Active'), '', _('Deep')][gSTB.SupportedStandByModes[i]] || 'n/a',
				value: gSTB.SupportedStandByModes[i]
			});
		}
		arr.push({element: 'select', title: _('Stand by mode:'), option: options, selected: Number(environment.standByMode)});
	}
	arr.push({element   : 'select', title: _('Auto power down:'), option: [
		{title: _('Off'), value: '0'},
		{title: '20 ' + _('minutes'), value: 19*60},
		{title: _('1 hour'), value: 59*60},
		{title: _('2 hours'), value: 119*60},
		{title: _('4 hours'), value: 239*60},
		{title: _('8 hours'), value: 479*60},
	], selected: environment.autoPowerDownTime});

	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.Interface);
	return false;
}


function sett_AutoUbdate_init() {
	SettingsPage.BCrumb.Push('', 'update.png', _('Software autoupdate'));
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.AutoUpdate;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;
	var arr = [
		{element: 'select', title: _('Autoupdate'), option: [{title: _('Enabled'), value: 0}, {title: _('With confirmation'), value: 1}, {title: _('Disabled'), value: 2}], selected: environment.autoupdate_cond},
		{element: 'checkbox', checked: environment.betaupdate_cond, title: _('Update to beta versions')}
	];
	SettingsPage.BPanel.Hidden(SettingsPage.buttons.F2, false);
	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.AutoUpdate);
	return false;
}


function sett_TS_init() {
	SettingsPage.BCrumb.Push('', 'timeshift.png', _('TimeShift'));
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.TS;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;
	var path_list = [];
	var no_path = true;
	if ( STORAGE_INFO.length > 0 ) {
		for (var i = 0; i < STORAGE_INFO.length; i++) {
			var name = STORAGE_INFO[i].label;
			var value = STORAGE_INFO[i].mountPath;

			path_list[i] = {title: name, value: value};
			if (environment.ts_path === value) {
				no_path = false;
			}
		}
		if (no_path) {
			path_list.splice(0,0,{title: _('None'), value: ''});
		}
	} else {
		path_list.splice(0,0,{title: _('None'), value: ''});
	}
	var arr = [
		{element: 'checkbox', checked: environment.ts_on, title: _('Use TimeShift')},
		{element: 'checkbox', checked: environment.ts_icon, title: _('Icon enable')},
		{element: 'select', title: _('File location'), option: path_list, selected: environment.ts_path},
		{element: 'select', title: _('Length'), option: [{title: '15 ' + _('minutes'), value: 900}, {title: '30 ' + _('minutes'), value: 1800}, {title: '1 ' + _('hour'), value: 3600}, {title: _('2 hours'), value: 7200}, {title: _('3 hours'), value: 10800}, {title: _('5 hours'), value: 18000}, {title: _('10 hours'), value: 36000}, {title: _('20 hours'), value: 72000}, {title: _('24 hours'), value: 86400}], selected: environment.ts_time},
		{element: 'select', title: _('Using buffer mode'), option: [{title: _('Cyclic record mode'), value: 1}, {title: _('Stop when out of space'), value: 2}], selected: environment.ts_endType},
		{element: 'select', title: _('On exit'), option: [{title: _('Do not save buffer'), value: 1}, {title: _('Save buffer'), value: 2}, {title: _('Request to save'), value: 3}], selected: environment.ts_exitType},
		{element: 'select', title: _('Delay'), option: [{title: _('By pressing Pause button'), value: 0}, {title: '1 ' + _('sec.'), value: 1}, {title: '3 ' + _('sec.'), value: 3}, {title: '5 ' + _('sec.'), value: 5}, {title: '10 ' + _('sec.'), value: 10}], selected: environment.ts_lag}
	];
	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.TS);
	return false;
}


function sett_speed_test_init() {
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.SpeedTest;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;

	// old style
	if ( configuration.setting.settingsList.indexOf('traceroute') !== -1 && RULES.Traceroute ) {
		SettingsPage.BCrumb.Push('', 'speedtest.png', _('Network Diagnostics'));

		elclear(SettingsPage.FileList.handle);
		SettingsPage.BPanelTraceroute.Init(PATH_IMG_PUBLIC + 'settings', SettingsPage.FileList.handle);
		SettingsPage.BPanelTraceroute.handleInner.classList.add('speedtest-bpanel');
		SettingsPage.BPanelTraceroute.listButtons = [];
		SettingsPage.BPanelTraceroute.listButtons.push(SettingsPage.BPanelTraceroute.Add(KEYS.OK, 'inet_speed.png', _('Speed test'), sett_speed_test_start));
		SettingsPage.BPanelTraceroute.listButtons.push(SettingsPage.BPanelTraceroute.Add(KEYS.OK, 'traceroute.png', _('Extended diagnostics'), sett_traceroute_init));
		SettingsPage.BPanelTraceroute.activeItemIndex = 0;
		SettingsPage.BPanelTraceroute.handleInner.firstChild.classList.add('focused');
	} else if ( !sett_speed_test_prepare() ) {
		new CModalHint(SettingsPage, _('Error'), 3000);
	} else {
		SettingsPage.BCrumb.Push('', 'speedtest.png', _('Speed test'));
		SettingsPage.FileList.AddTable([
			{title: ''},
			{title: 'LAN:', value: gSTB.GetLanLinkStatus() ? _('Available') : _('Not available')},
			{title: 'WiFi:', value: gSTB.GetWifiLinkStatus() ? _('Available') : _('Not available')},
			{title: _('Speed:'), value: _('Waiting'), id: 'speed_test'}
		]);
		SettingsPage.speedtest.onSuccess(function(speed) {
			SettingsPage.FileList.handle.querySelector('#speed_test_rigth').innerHTML = speed;
		});
		SettingsPage.speedtest.onCheck(function(result) {
			echo(result,'speedtest.onCheck');
			if (result.state === 2) {
				SettingsPage.FileList.handle.querySelector('#speed_test_rigth').innerHTML = _('Testing');
			} else if (result.state === 4 || result.state === 5) {
				SettingsPage.FileList.handle.querySelector('#speed_test_rigth').innerHTML = _('Error');
			} else if (result.state === 1) {
				SettingsPage.FileList.handle.querySelector('#speed_test_rigth').innerHTML = _('Waiting');
			}
		});
		SettingsPage.speedtest.start();
	}
	return false;
}


function sett_speed_test_start () {
	var resultSpan = element('span', {id: 'speed_test_rigth'}, _('Waiting')), modal;
	if ( !sett_speed_test_prepare() ) {
		new CModalHint(SettingsPage, _('Error'), 3000);
		return;
	}

	SettingsPage.speedtest.onSuccess(function( speed ) {
		if ( resultSpan ) {
			resultSpan.innerHTML = speed;
		}
		sendStatistic();
	});
	SettingsPage.speedtest.onCheck(function(result) {
		if ( !resultSpan ) {
			return;
		}
		echo(result,'speedtest.onCheck');
		if (result.state === 2) {
			resultSpan.innerHTML = _('Testing');
		} else if (result.state === 4 || result.state === 5) {
			resultSpan.innerHTML = _('Error');
		} else if (result.state === 1) {
			resultSpan.innerHTML = _('Waiting');
		}
	});
	modal = new CModalAlert(SettingsPage, _('Test results'), [
		element('div', {}, gSTB.GetLanLinkStatus() ? 'LAN: ' + _('Available') : 'LAN: ' + _('Not available')),
		element('div', {}, gSTB.GetWifiLinkStatus() ? 'WiFi: ' + _('Available') : 'WiFi: ' + _('Not available')),
		element('span', {}, _('Speed:') + ' '),
		resultSpan
	], '' , function () {
		resultSpan = null;
	});
	modal.handleInner.classList.add('speedtestModal');
	SettingsPage.speedtest.start();
	return false;
}


function sett_speed_test_prepare () {
	var localCoordinates = gSTB.LoadUserData('weatherSet'),
		speedTestURL = null,
		i;

	try {
		localCoordinates = JSON.parse(localCoordinates);
	} catch ( error ) {
		// no file 'weatherSet' or wrong structure
		echo(error, 'weatherSet.json parse');
		localCoordinates = {
			lat: 0,
			lon: 0
		}
	}

	for ( i = 0; i  < configuration.speedTest.dataCenters.length; i++ ) {
		configuration.speedTest.dataCenters[i].distance = calculateTheDistance(localCoordinates.lat, localCoordinates.lon, configuration.speedTest.dataCenters[i].lat, configuration.speedTest.dataCenters[i].long);
	}

	configuration.speedTest.dataCenters.sort(function(a, b) {
		return a.distance - b.distance;
	});

	SettingsPage.speedtest = new Speedtest(speedTestURL ? speedTestURL : 'http://mirror.' + configuration.speedTest.dataCenters[0].code + configuration.speedTest.baseURL );
	return true;
}


/**
 * Traceroute to hard coded domains (domain1, domain2).
 * Send result to statistic server.
 */
function sett_traceroute_start () {
	var resultPre = document.createElement('div'),
		downloads = JSON.parse(stbDownloadManager.GetQueueInfo()),
		loadingQueue = [],
		date = new Date(),
		endDate = new Date(),
		minutes = date.getMinutes(),
		time = configuration.traceroute.time || 0,
		domains = configuration.traceroute.domains,
		endMinutes, i, len;

	resultPre.setAttribute('tabindex', 0); // set tabindex attribute, we need to focus this element at the end of traceroute

	endDate.setSeconds(date.getSeconds() + (time * domains.length) + 60);
	if ( minutes < 10 ) {
		minutes = '0' + minutes;
	}
	endMinutes = endDate.getMinutes();
	if ( endMinutes < 10 ) {
		endMinutes = '0' + endMinutes;
	}

	// save all active jobs, because mtr can ruin downloads
	for ( i = 0, len = downloads.length; i < len; ++i ) {
		if ( downloads[i].state === 1 || downloads[i].state === 2 ) {
			loadingQueue.push(downloads[i]);
			stbDownloadManager.StopJob(downloads[i].id);
		}
	}
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.Traceroute;

	SettingsPage.BCrumb.Push('', 'traceroute.png', _('Test result'));

	elclear(SettingsPage.FileList.handle);
	SettingsPage.FileList.handle.appendChild(resultPre);
	new CModalHint(currCPage, _('Perform diagnostics') + '...' +
		'<br>' + _('Start') + ': ' + date.getHours() + ':' + minutes +
		'<br>' + _('Estimated time of completion') + ': ' + endDate.getHours() + ':' + endMinutes, 1500);

	// hack to run mtr before browser render all page
	setTimeout(function () { // run mtr
		var table = element('table', {className: 'netanalyzeTable'}),
			handlerLink = SettingsPage.EventHandler,
			count = domains.length,
			results = '',
			i, result;

		SettingsPage.EventHandler = function() {};

		table.appendChild(element('tr', {}, [
			element('th', {}, _('IP Address')),
			element('th', {}, _('Loss')),
			element('th', {}, _('Ping'))
		]));

		setTimeout(function () {
			if ( time ) {
				for ( i = 0; i < count; ++i ) {
					result = gSTB.RDir('mtr --report --no-dns --report-cycles ' + time + ' ' + domains[i]);
					results += 'Traceroute to domain: ' + domains[i] + '\n' + result + '\n';
				}
				echo(result, 'result');
				// parsing mtr output
				result = result.split('\n');
				result.shift();
				result.shift();
				result.pop();
				result.forEach(function ( item ) {
					var data = item.trim().replace(/\s{2,}/g, ' ').split(' ');
					table.appendChild(element('tr', {}, [
						element('td', {}, data[1]),
						element('td', {}, data[2]),
						element('td', {}, '' + Math.round(data[5]))
					]));
				});
				sendStatistic(results);
			}

			resultPre.innerHTML = '';
			resultPre.appendChild(table);
			// restore active downloads
			for ( i = 0, len = loadingQueue.length; i < len; ++i ) {
				stbDownloadManager.StartJob(loadingQueue[i].id);
			}
			// hack to restore event handler, browser pass events with delay
			setTimeout(function () {
				SettingsPage.EventHandler = handlerLink;
				resultPre.focus();
			}, 0);
		}, 0)
	}, 0);
}


function sett_traceroute_init () {
	new CModalConfirm(
		SettingsPage,
		'<span style="color: red;text-shadow: 1px 1px 1px #000;">' + _('Attention') + '!</span>',
		_('Estimated time to complete the test - 10 minutes.<br> You can not interrupt the test before it is completed'),
		_('Cancel'), null,
		_('Run the test'),
		sett_traceroute_start
	);
}


function sendStatistic ( data ) {
	var mac, envs, request;
	// prevent sending statistic from another devices
	if ( gSTB.GetDeviceModelExt().toLowerCase().indexOf('aura') < 0 ) {
		return;
	}
	mac  = gSTB.RDir('MACAddress');
	envs = gSTB.GetEnv(JSON.stringify({varList:['language','igmp_conf','upnp_conf','mc_proxy_enabled','mc_proxy_url','input_buffer_size','timezone_conf','audio_initial_volume','audio_dyn_range_comp','audio_operational_mode','audio_stereo_out_mode','audio_spdif_mode','audio_hdmi_audio_mode','lan_noip','ipaddr_conf','dnsip','pppoe_enabled','pppoe_login','pppoe_dns1','wifi_ssid','wifi_int_ip','portal1','portal2','portal_dhcp','use_portal_dhcp','bootstrap_url','update_url','update_channel_url','ntpurl','mcip_img_conf','mcport_img_conf','netmask','tvsystem','graphicres','auto_framerate','force_dvi','gatewayip','pppoe_pwd','wifi_int_dns','wifi_auth','wifi_enc','wifi_psk','wifi_wep_key1','wifi_int_mask','wifi_int_gw','wifi_wep_def_key','wifi_wep_key2','wifi_wep_key3','wifi_wep_key4','ethinit','partition','kernel','Ver_Forced','componentout','bootupgrade','do_factory_reset','serial#','Boot_Version','timezone_conf_int','showlogo','logo_x','logo_y','bg_color','fg_color','video_clock','front_panel','ts_endType','Image_Date','Image_Version','Image_Desc','ts_on','lang_audiotracks','autoupdate_cond','settMaster','stdin','stdout','stderr','bootcmd','ethaddr','betaupdate_cond','lang_subtitles','subtitles_on','ssaverDelay','autoupdateURL']}));
	request = new XMLHttpRequest();
	request.open('PUT', 'http://stat.infomir.com/api/env/' + mac, true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.onreadystatechange = function () {
		if ( request.readyState === 4 ) {
			if ( request.status === 200 ) {
				echo(request.responseText, 'success stat sending');
			} else if( request.status === 0 || request.status === 404 ){
				echo('Sending vars error');
			}
		}
	};
	if ( data ) {
		try {
			envs = JSON.parse(envs);
			envs.result.traceroute = data;
			envs = JSON.stringify(envs);
		} catch ( e ) {
			envs = {errCode: 0, errMsg: '', result: data};
		}
	}
	request.send(envs);
}


function sett_setup_init() {
	gSTB.StartLocalCfg();
	return false;
}


function sett_master_settings_init() {
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.MasterSettingsStart;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;
	if (window.MasterSettings === undefined) {
		// cold start
		var currentPage = currCPage;
		loadMasterSettings(function() {
			MasterSettings.origin = currentPage;
		});
	} else {
		// already warmed
		MasterSettings.Show(true);
		initMasterSettings();
	}
	return false;
}


// function sett_DVB_init() {
// 	var i,
// 		supported = DVBChannels.inputs[0].supportedScanTypes,
// 		typeArr = [],
// 		checkedType = DVBChannels.inputs[0].currentScanTypes;
//
// 	if ( checkedType.length ) {
// 		checkedType = checkedType[0];
// 	} else {
// 		checkedType = 0;
// 	}
// 	for ( i = 0; i < supported.length; i++ ) {
// 		typeArr.push({
// 			name: dvbTypes[supported[i]],
// 			value: supported[i]
// 		});
// 	}
//
// 	SettingsPage.BCrumb.Push('', 'dvb.png', _('DVB'));
// 	SettingsPage.FileList.layer = SettingsPage.FileList.layers.DVB;
// 	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;
//
// 	// try{
// 	// 	currentScanTypes[0]
// 	// var text = dvbManager.GetSupportedScanTypes();
// 	// 	typeArr = JSON.parse(text);
// 	// } catch(e){
// 	// 	echo(e,'GetSupportedScanTypes parse error');
// 	// }
// 	// if(environment.dvb_type){
// 	// 	checkedType = environment.dvb_type;
// 	// } else {
// 	// 	try{
// 	// 		var data = JSON.parse(dvbManager.GetCurrentScanTypes());
// 	// 		checkedType = data[0].name;
// 	// 	} catch(e){
// 	// 		echo(e,'GetCurrentScanTypes parse error');
// 	// 	}
// 	// }
// 	var typeSelectChange = function () {
// 		if ( SettingsPage.FileList.elements[0].GetValue() === 2 || SettingsPage.FileList.elements[0].GetValue() === 3 ) {
// 			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[1], false);
// 		} else {
// 			if ( SettingsPage.FileList.pre_elements[1] === SettingsPage.FileList.activeItem ) {
// 				SettingsPage.FileList.Focused(SettingsPage.FileList.pre_elements[0], true);
// 			}
// 			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[1], true);
// 		}
// 	};
//
// 	//var powerChange = function () {
// 	//	if ( SettingsPage.FileList.elements[1].IsChecked() === true && SettingsPage.FileList.elements[0].GetValue() === 'DVB-C' ) {
// 	//		SettingsPage.FileList.elements[1].Check(false);
// 	//		new CModalAlert(currCPage,_('Error'),_('Antenna with such signal type can\'t be powered up.'));
// 	//}
// 	//};
//
// 	var arr = [
// 		{element: 'select', title: _('Signal type'), option: typeArr, idField: 'value', nameField: 'name', selected: checkedType, onChange: typeSelectChange},
// 		{element: 'info', title: _('Antenna type'), value: DVBChannels.inputs[0].antennaPower ? _('Active'): _('Passive')}
// 		//{element: 'checkbox', checked: environment.dvb_power, title: _('Antenna power supply'), onChange: powerChange}
// 	];
// 	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.DVB);
// 	typeSelectChange();
// 	return false;
// }

function sett_DVB_init() {
	var i, j,
		supported, typeArr, checkedType,
		n = 0,
		arr, powerChange, typeSelectChange;

	SettingsPage.BCrumb.Push('', 'dvb.png', _('DVB'));
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.DVB;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;

	arr = [];

	for ( i = 0; i < DVBChannels.inputs.length; i++ ) {
		supported = DVBChannels.inputs[i].supportedScanTypes;
		checkedType = DVBChannels.inputs[i].currentScanTypes;

		if ( checkedType.length ) {
			checkedType = checkedType[0];
		} else {
			checkedType = 0;
		}

		typeArr = [];
		for ( j = 0; j < supported.length; j++ ) {
			typeArr.push({
				name: dvbTypes[supported[j]],
				value: supported[j]
			});
		}

		n = i * 2 - 1;
		// powerChange = function () {
		// 	if ( SettingsPage.FileList.elements[n].IsChecked() === true && SettingsPage.FileList.elements[n-1].GetValue() !== 2
		// 		&& SettingsPage.FileList.elements[n-1].GetValue() !== 3 ) {
		// 		SettingsPage.FileList.elements[n].Check(false);
		// 		new CModalAlert(currCPage,_('Error'),_('Antenna with such signal type can\'t be powered up.'));
		// 	}
		// };

		typeSelectChange = function () {
			if ( SettingsPage.FileList.elements[n-1].GetValue() === 2 || SettingsPage.FileList.elements[n-1].GetValue() === 3 ) {
				SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[n], false);
			} else {
				if ( SettingsPage.FileList.pre_elements[n] === SettingsPage.FileList.activeItem ) {
					SettingsPage.FileList.Focused(SettingsPage.FileList.pre_elements[n-1], true);
				}
				SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[n-1], true);
			}
		};

		arr.push({
			element: 'select', title: DVBChannels.inputs.length > 1 ?  _('Signal type') + ' ' + ( i + 1 ) : _('Signal type'), option: typeArr, idField: 'value', nameField: 'name', selected: checkedType, onChange: typeSelectChange
		});

		arr.push({
			element: 'info', title: DVBChannels.inputs.length > 1 ? _('Antenna type')+ ' ' + ( i + 1 ) : _('Antenna type'), value: DVBChannels.inputs[i].antennaPower ? _('Active'): _('Passive')
		});
	}

	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.DVB);
	for ( i = 0; i < DVBChannels.inputs.length; i++ ) {
		n = i * 2;

		if ( SettingsPage.FileList.elements[n].GetValue() === 2 || SettingsPage.FileList.elements[n].GetValue() === 3 ) {
			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[n+1], false);
		} else {
			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[n+1], true);
		}
	}
	return false;
}

function settAccessControl () {
	var arr, check, i, j,
		advanced = true;
	if ( accessControl.state ) {
		accessControl.showLoginForm(SettingsPage.FileList.initPages.accessControl);
		return false;
	}
	SettingsPage.BCrumb.Push('', 'access.png', _('Access control'));
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.accessControl;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;

	function isEmpty ( obj ) {
		for ( var prop in obj ) {
			if ( obj.hasOwnProperty(prop) ) {
				return false;
			}
		}

		return true;
	}

	check = function ( firstcheck ) {
		if ( SettingsPage.FileList.elements[0].IsChecked() ) {
			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[1], false);
			SettingsPage.FileList.elements[1].SetValue(environment.acPassword);
			SettingsPage.BPanel.Hidden(SettingsPage.buttons.F1, false);
		} else {
			advanced = true;
			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[1], true);
			SettingsPage.BPanel.Hidden(SettingsPage.buttons.F1, true);
		}
		if ( !firstcheck ) {
			if ( SettingsPage.FileList.elements[0].IsChecked() && isEmpty(accessControl.data.pages) ) {
				SettingsPage.FileList.elements[2].Check(true, true);
				SettingsPage.FileList.elements[3].Check(true, true);
				SettingsPage.FileList.elements[4].Check(true, true);
			}
		}

		for ( i = 2; i < SettingsPage.FileList.pagesLength.start; i++ ) {
			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[i], advanced);
		}

		if ( SettingsPage.FileList.elements[4].IsChecked() || advanced ) {
			for ( i = SettingsPage.FileList.pagesLength.start; i < SettingsPage.FileList.pagesLength.end; i ++ ) {
				SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[i], true);
			}
		} else {
			for ( i = SettingsPage.FileList.pagesLength.start; i < SettingsPage.FileList.pagesLength.end; i ++ ) {
				SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[i], false);
			}
		}

	};

	arr = [
		{element: 'checkbox', checked: environment.accessControl, onChange: check, title: _('Access control')},
		{element: 'cinput', value: environment.acPassword, title: _('Password') + ' ( ' + _('Digits only') + ' )', type: 'password'},
		{element: 'checkbox', checked: accessControl.data.pages.systemSettings, name: 'systemSettings', title: _('System settings')},
		{element: 'checkbox', checked: accessControl.data.events.loader, name: 'loader', title: _('Portals loader')},
		{element: 'checkbox', checked: accessControl.data.events.portalOpen, name: 'portalOpen', title: _('Main menu')}
	];

	for ( i = 0; i < configuration.menu.length; i++ ) {
		for ( j = 0; j < configuration.menu[i].length; j++ ) {
			arr.push({element: 'checkbox', checked: accessControl.data.pages[configuration.menu[i][j].name], name: configuration.menu[i][j].name, title: lang[configuration.menu[i][j].name] || configuration.menu[i][j].name});
		}
	}
	//arr.push({element: 'checkbox', checked: accessControl.data.pages.systemSettings, name: 'systemSettings', title: _('System settings')});


	SettingsPage.advanced = function () {
		if ( !SettingsPage.FileList.elements[0].IsChecked() ) {
			return false;
		}
		advanced = !advanced;
		for ( i = 2; i < SettingsPage.FileList.pagesLength.start; i ++ ) {
			SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[i], advanced);
		}

		if ( SettingsPage.FileList.elements[4].IsChecked() || advanced ) {
			for ( i = SettingsPage.FileList.pagesLength.start; i < SettingsPage.FileList.pagesLength.end; i ++ ) {
				SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[i], true);
			}
		} else {
			for ( i = SettingsPage.FileList.pagesLength.start; i < SettingsPage.FileList.pagesLength.end; i ++ ) {
				SettingsPage.FileList.Hidden(SettingsPage.FileList.pre_elements[i], false);
			}
		}

		if ( advanced ) {
			SettingsPage.FileList.Focused(SettingsPage.FileList.pre_elements[0]);
		}

	};
	SettingsPage.FileList.pagesLength = {start: 5, end: arr.length};
	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.accessControl);
	check(true);
	return false;
}

function sett_Teletext_init() {
	var arr = [];

	SettingsPage.BCrumb.Push('', 'tvtext.png', _('Teletext'));
	SettingsPage.FileList.layer = SettingsPage.FileList.layers.teletext;
	SettingsPage.FileList.back_element[SettingsPage.FileList.layers.mainPage] = SettingsPage.FileList.layer - 1;

	arr.push({
		element: 'checkbox',
		checked: environment.teletext_on === 'on',
		title: _('Use Teletext')
	});
	arr.push({
		element: 'select',
		title: _('Force charset'),
		option: [
			{value: 'disabled', title: _('Disabled')},
			{value: 'auto', title: _('Auto')},
			{value: '0x00', title: 'English'},
			//{value: '0x01', title: 'German'},
			//{value: '0x02', title: 'Swedish/Finnish/Hungarian'},
			//{value: '0x03', title: 'Italian'},
			//{value: '0x04', title: 'French'},
			{value: '0x05', title: 'Portuguese/Spanish'},
			//{value: '0x06', title: 'Czech/Slovak'},
			{value: '0x08', title: 'Polish'},
			{value: '0x09', title: 'German'},
			{value: '0x0a', title: 'Swedish/Finnish/Hungarian'},
			{value: '0x0b', title: 'Italian'},
			{value: '0x0c', title: 'French'},
			{value: '0x0e', title: 'Czech/Slovak'},
			//{value: '0x10', title: 'English'},
			//{value: '0x11', title: 'German'},
			//{value: '0x12', title: 'Swedish/Finnish/Hungarian'},
			//{value: '0x13', title: 'Italian'},
			//{value: '0x14', title: 'French'},
			//{value: '0x15', title: 'Portuguese/Spanish'},
			{value: '0x16', title: 'Turkish'},
			{value: '0x1d', title: 'Serbian/Croatian/Slovenian'},
			{value: '0x1f', title: 'Rumanian'},
			{value: '0x20', title: 'Serbian/Croatian'},
			//{value: '0x21', title: 'German'},
			{value: '0x22', title: 'Estonian'},
			{value: '0x23', title: 'Lettish/Lithuanian'},
			{value: '0x24', title: 'Russian/Bulgarian'},
			{value: '0x25', title: 'Ukrainian'},
			//{value: '0x26', title: 'Czech/Slovak'},
			//{value: '0x36', title: 'Turkish'},
			{value: '0x37', title: 'Greek'},
			{value: '0x80', title: 'English/Arabic'},
			{value: '0x84', title: 'French/Arabic'},
			{value: '0x87', title: 'Arabic'},
			{value: '0x95', title: 'Hebrew/Arabic'},
			{value: '0x97', title: 'Arabic'}
		],
		selected: environment.teletext_charset
	});
	if ( WINDOW_HEIGHT >= 720 ) {
		arr.push({
			element: 'select',
			title: _('Aspect Ratio'),
			option: [
				{title: '4:3', value: '0'},
				{title: '16:9', value: '1'}
			],
			selected: environment.teletext_ratio
		});
	}
	arr.push({
		element: 'select',
		title: _('Opacity level'),
		option: [
			{value: '0',   title: '0'},
			{value: '25',  title: '10'},
			{value: '50',  title: '20'},
			{value: '75',  title: '30'},
			{value: '100', title: '40'},
			{value: '125', title: '50'},
			{value: '150', title: '60'},
			{value: '175', title: '70'},
			{value: '200', title: '80'},
			{value: '225', title: '90'},
			{value: '255', title: '100'}
		],
		selected: environment.teletext_opacity
	});
	SettingsPage.FileList.AddElement(arr, null, SettingsPage.FileList.layers.teletext);
	return false;
}


/**
 * Update page object
 */

var UpdatePage = {
	Show: function(auto, manual){
		var versions = [], header,
			cur_ImageDate, image;
		if ( environment.Image_Date ) {
			cur_ImageDate = parseDate(environment.Image_Date);
		} else {
			cur_ImageDate = new Date();
			cur_ImageDate.setFullYear(1990);
		}
		this.auto = auto;
		this.manual = manual;

		for (var i = SettingsPage.update_list.length - 1; i > (-1); i--) {
			image = SettingsPage.update_list[i];
			if ((Date.parse(image.date) > cur_ImageDate.getTime()) || (isNaN(cur_ImageDate.getTime())) || !auto) {
				if (((image.type === 'release') || (environment.betaupdate_cond && !(/alpha/igm.test(image.type)))) || !auto) {
					image.title = image.name +' <span class="grey">(' + new Date(image.date).toDateString() + ') </span>';
					versions.push(image);
				}
			}
		}

		if (versions.length === 0){
			echo('Got images list from server. No need for update.');
			if (!auto) {
				new CModalHint(SettingsPage, _('Sorry, no firmware image at the moment'));
			}
			return;
		}

		if (auto) {
			header = _('Software autoupdate');
		} else {
			header = _('Software update');
		}

		this.UpdateModal = new CUpdateModal(/*auto ? ServiceMenu : SettingsPage*/ currCPage, {
			images: versions,
			auto: (auto && !manual),
			select: true,
			header_text: header,
			info: true,
			log: true,
			events: {
				onStart: function(){
					echo('services.js->UpdateModal.onStart(); autoupdate_cond: ' + environment.autoupdate_cond);
					if (environment.autoupdate_cond === 0){
						if (this.images !== undefined){
							var image;
							if (typeof this.select === 'object'){
								image = this.select.GetSelected();
							}else{
								image = this.images[0];
							}
							if (Date.parse(image.date) < cur_ImageDate.getTime()){
								gSTB.SetEnv(JSON.stringify({autoupdate_cond: 1}));
							}
						}
					}
				},
				onError: function(){
					echo('services.js->UpdateModal; error happened. Prevent cyclic autoupdate. Set autoupdate_cond to:' + environment.autoupdate_cond);
					gSTB.SetEnv(JSON.stringify({autoupdate_cond: environment.autoupdate_cond}));
					this.auto = false; // prevent cyclic autoupdate
				}
			}
		});

		this.UpdateModal.Show(true);
	}
};

/**
 * End of update page object
 */

function settingsSave() {
	SettingsPage.changes = {};
	var to_save = {},
		needReboot = false,
		needReload = false,
		i, value, reg, wakeUpSources,
		delta = 0;

	SettingsPage.advanced = function(){};
	switch (SettingsPage.FileList.layer) {
		case SettingsPage.FileList.layers.playback:
			var defLang = '';
			for ( i=0; i<iso639.length; i++) {
				for (var j=0; j<iso639[i].code.length; j++) {
					if (iso639[i].code[j] === environment.language){
						defLang = iso639[i].code[0];
						break;
					}
				}
				if(defLang !== ''){
					break;
				}
			}

			if ( SettingsPage.FileList.elements[0].GetValue() !== environment.lang_audiotracks ) {
				environment.lang_audiotracks = SettingsPage.FileList.elements[0].GetValue();
				to_save.lang_audiotracks = environment.lang_audiotracks;
				gSTB.SetAudioLangs(environment.lang_audiotracks === '' ? '' : iso639[environment.lang_audiotracks].code[0], defLang);
			}

			if ( SettingsPage.FileList.elements[1].GetValue() !== environment.lang_subtitles ) {
				environment.lang_subtitles = SettingsPage.FileList.elements[1].GetValue();
				if ( environment.lang_subtitles !== -1 ) {
					to_save.lang_subtitles = environment.lang_subtitles;
					to_save.subtitles_on = true;
					environment.subtitles_on = true;
					MediaPlayer.subtitles_on = true;
					gSTB.SetSubtitles(true);
					gSTB.SetSubtitleLangs(environment.lang_subtitles === '' ? '' : iso639[environment.lang_subtitles].code[0], defLang);
				} else {
					to_save.subtitles_on = false;
					environment.subtitles_on = false;
					MediaPlayer.subtitles_on = false;
					gSTB.SetSubtitles(false);
				}
			}

			if ( SettingsPage.FileList.elements[2].GetValue() !== environment.subtitlesSize ) {
				environment.subtitlesSize = SettingsPage.FileList.elements[2].GetValue();
				to_save.subtitlesSize = environment.subtitlesSize;
				gSTB.SetSubtitlesSize(environment.subtitlesSize);
			}

			if ( SettingsPage.FileList.elements[3].GetValue() !== environment.subtitlesColor ) {
				environment.subtitlesColor = SettingsPage.FileList.elements[3].GetValue();
				to_save.subtitlesColor = environment.subtitlesColor;
				gSTB.SetSubtitlesColor(environment.subtitlesColor);
			}

			if ( SettingsPage.FileList.elements[4].GetValue() !== environment.aspect ) {
				environment.aspect = SettingsPage.FileList.elements[4].GetValue();
				to_save.aspect = environment.aspect;
				MediaPlayer.initAspect();
			}
			break;
		case SettingsPage.FileList.layers.Interface:
			if ( environment.startPage !== SettingsPage.FileList.elements[0].GetValue() ) {
				environment.startPage = SettingsPage.FileList.elements[0].GetValue();
				to_save.startPage = environment.startPage;
			}

			if ( environment.weather_conf !== SettingsPage.FileList.elements[1].GetValue() ) {
				environment.weather_conf = SettingsPage.FileList.elements[1].GetValue();
				to_save.weather_conf = environment.weather_conf;
				weather.setDataMainPage();
				weather.initWeatherPage();
			}
			if ( environment.hdmi_event_delay !== SettingsPage.FileList.elements[2].GetValue() ) {
				environment.hdmi_event_delay = SettingsPage.FileList.elements[2].GetValue();
				to_save.hdmi_event_delay = environment.hdmi_event_delay;
				// Correct wake up sources to fix hdmi wake up reaction in deep standby mode
				if ( typeof gSTB.GetWakeUpSources === 'function' && (gSTB.SupportedWakeUpSources || []).indexOf(2) !== -1 ) {
					wakeUpSources = gSTB.GetWakeUpSources() || [];
					if ( Number(environment.hdmi_event_delay) === 0 && wakeUpSources.indexOf(2) !== -1 ) {
						wakeUpSources.splice(wakeUpSources.indexOf(2), 1);
						gSTB.SetWakeUpSources(wakeUpSources); // hdmi reaction turned off so it's not a wake up src anymore
					} else if ( Number(environment.hdmi_event_delay) !== 0 && wakeUpSources.indexOf(2) === -1 ) {
						wakeUpSources.push(2);
						gSTB.SetWakeUpSources(wakeUpSources); // hdmi reaction turned on so add it as wake up src
					}
				}
			}

			if ( environment.ssaverDelay !== SettingsPage.FileList.elements[3].GetValue() ) {
				environment.ssaverDelay = SettingsPage.FileList.elements[3].GetValue();
				to_save.ssaverDelay = environment.ssaverDelay;
				gSTB.SetScreenSaverTime(environment.ssaverDelay * 10);
			}

			if ( environment.ssaverName !== SettingsPage.FileList.elements[4].GetValue() ) {
				environment.ssaverName = SettingsPage.FileList.elements[4].GetValue();
				to_save.ssaverName = environment.ssaverName;
				gSTB.SetScreenSaverInitAttr(JSON.stringify({
					url: configuration.screensaversPath + '/' + environment.ssaverName + '/index.html',
					backgroundColor: '#000'
				}));
			}

			if ( environment.playerClock !== SettingsPage.FileList.elements[5].IsChecked() ) {
				environment.playerClock = SettingsPage.FileList.elements[5].IsChecked();
				to_save.playerClock = environment.playerClock;
				if ( environment.playerClock ) {
					MediaPlayer.domPlayerClockOptional.style.display = 'block';
				} else {
					MediaPlayer.domPlayerClockOptional.style.display = 'none';
				}
			}

			if ( environment.defaultLedLevel !== SettingsPage.FileList.elements[6].GetValue() ) {
				environment.defaultLedLevel = SettingsPage.FileList.elements[6].GetValue();
				to_save.defaultLedLevel = environment.defaultLedLevel;
				gSTB.SetLedIndicatorLevels(SettingsPage.FileList.elements[6].GetValue(), SettingsPage.FileList.elements[7].GetValue());
			}

			if ( environment.standbyLedLevel !== SettingsPage.FileList.elements[7].GetValue() ) {
				environment.standbyLedLevel = SettingsPage.FileList.elements[7].GetValue();
				to_save.standbyLedLevel = environment.standbyLedLevel;
				gSTB.SetLedIndicatorLevels(SettingsPage.FileList.elements[6].GetValue(), SettingsPage.FileList.elements[7].GetValue());
			}
			if ( environment.controlModel !== SettingsPage.FileList.elements[8].GetValue() ) {
				environment.controlModel = SettingsPage.FileList.elements[8].GetValue();
				to_save.controlModel = environment.controlModel;
				needReload = true;
			}

			if ( gSTB.SupportedStandByModes && gSTB.SupportedStandByModes.length > 1 ) {
				if ( Number(environment.standByMode) !== SettingsPage.FileList.elements[9].GetValue() ) {
					environment.standByMode = SettingsPage.FileList.elements[9].GetValue();
					to_save.standByMode = environment.standByMode;
					gSTB.StandByMode = environment.standByMode;
				}
				delta++;
			}
			if ( SettingsPage.FileList.elements[9 + delta].GetValue() !== environment.autoPowerDownTime ) {
				environment.autoPowerDownTime = SettingsPage.FileList.elements[9 + delta].GetValue();
				to_save.autoPowerDownTime = environment.autoPowerDownTime;
				if ( gSTB.SetAutoPowerDownTime ) {
					gSTB.SetAutoPowerDownTime(environment.autoPowerDownTime);
				}
			}
			break;
		case SettingsPage.FileList.layers.AutoUpdate:
			if (environment.autoupdate_cond !== SettingsPage.FileList.elements[0].GetValue()) {
				environment.autoupdate_cond = SettingsPage.FileList.elements[0].GetValue();
				to_save.autoupdate_cond = environment.autoupdate_cond;
			}
			if (environment.betaupdate_cond !== SettingsPage.FileList.elements[1].IsChecked()) {
				environment.betaupdate_cond = SettingsPage.FileList.elements[1].IsChecked();
				to_save.betaupdate_cond = environment.betaupdate_cond;
			}
			break;
		case SettingsPage.FileList.layers.TS:
			if (environment.ts_on !== SettingsPage.FileList.elements[0].IsChecked()) {
				environment.ts_on = SettingsPage.FileList.elements[0].IsChecked();
				to_save.ts_on = environment.ts_on;
				MediaPlayer.ts_on = environment.ts_on;
				(MediaPlayer.ModalMenu.Menu.gts.slist.states.marked || []).forEach(function(item) {
					item.self.Marked(item, false);
				});
				MediaPlayer.ModalMenu.Menu.gts.slist.Marked(MediaPlayer.ts_on?MediaPlayer.ModalMenu.Menu.gts.ion:MediaPlayer.ModalMenu.Menu.gts.ioff, true);
			}
			if (environment.ts_icon !== SettingsPage.FileList.elements[1].IsChecked()) {
				environment.ts_icon = SettingsPage.FileList.elements[1].IsChecked();
				to_save.ts_icon = environment.ts_icon;
				MediaPlayer.ts_icon = environment.ts_icon;
			}
			if (environment.ts_path !== SettingsPage.FileList.elements[2].GetValue()) {
				environment.ts_path = SettingsPage.FileList.elements[2].GetValue();
				to_save.ts_path = environment.ts_path;
				timeShift.SetTimeShiftFolder(environment.ts_path + '/records');
				gSTB.ExecAction('make_dir ' + environment.ts_path + '/records');
			}
			if (environment.ts_time !== SettingsPage.FileList.elements[3].GetValue()) {
				environment.ts_time = SettingsPage.FileList.elements[3].GetValue();
				to_save.ts_time = environment.ts_time;
				timeShift.SetMaxDuration(environment.ts_time);
			}
			if (environment.ts_endType !== SettingsPage.FileList.elements[4].GetValue()) {
				environment.ts_endType = SettingsPage.FileList.elements[4].GetValue();
				to_save.ts_endType = environment.ts_endType;
				MediaPlayer.ts_endType = environment.ts_endType;
			}
			if (environment.ts_exitType !== SettingsPage.FileList.elements[5].GetValue()) {
				environment.ts_exitType = parseInt(SettingsPage.FileList.elements[5].GetValue(), 10);
				to_save.ts_exitType = environment.ts_exitType;
			}
			if (environment.ts_lag !== SettingsPage.FileList.elements[6].GetValue()) {
				environment.ts_lag = SettingsPage.FileList.elements[6].GetValue();
				to_save.ts_lag = environment.ts_lag;
			}
			break;
		case SettingsPage.FileList.layers.DVB:
			for ( i = 0; i < DVBChannels.inputs.length; i++ ) {
				DVBChannels.inputs[i].setSignalType(SettingsPage.FileList.elements[i * 2 + 1].GetValue());
				if ( DVBChannels.inputs[i].currentScanTypes.indexOf(SettingsPage.FileList.elements[i * 2 + 1].GetValue()) === -1 ) {
					needReboot = true;
				}
			}

			// if ( environment.dvb_type !== SettingsPage.FileList.elements[0].GetValue() ) {
			// 	// environment.dvb_type = SettingsPage.FileList.elements[0].GetValue();
			// 	// to_save.dvb_type = environment.dvb_type;
			// 	needReboot = true;
			// }
			//if (environment.dvb_power !== SettingsPage.FileList.elements[1].IsChecked()) {
			//	environment.dvb_power = SettingsPage.FileList.elements[1].IsChecked();
			//	to_save.dvb_power = environment.dvb_power;
			//	if( !needReboot ){
			//		dvbManager.SetAntennaPower(environment.dvb_power, 0);
			//	}
			//}
			break;
		case SettingsPage.FileList.layers.teletext:
			if ( SettingsPage.FileList.elements[0].IsChecked() ) {
				to_save.teletext_on = environment.teletext_on = 'on';
				gSTB.SetTeletext(true);
			} else {
				to_save.teletext_on = environment.teletext_on = 'off';
				gSTB.SetTeletext(false);
			}
			to_save.teletext_charset = environment.teletext_charset = SettingsPage.FileList.elements[1].GetValue();
			if ( to_save.teletext_charset === '' || to_save.teletext_charset === 'auto' || to_save.teletext_charset === 'disabled' ) {
				gSTB.ForceTtxCharset(0, true);
			} else {
				gSTB.ForceTtxCharset(+to_save.teletext_charset, false);
			}
			if ( WINDOW_HEIGHT >= 720 ) {
				to_save.teletext_ratio = environment.teletext_ratio = SettingsPage.FileList.elements[2].GetValue();
				to_save.teletext_opacity = environment.teletext_opacity = SettingsPage.FileList.elements[3].GetValue();
			} else {
				to_save.teletext_opacity = environment.teletext_opacity = SettingsPage.FileList.elements[2].GetValue();
			}
			break;
		case SettingsPage.FileList.layers.accessControl:
			value = SettingsPage.FileList.elements[1].GetValue();
			reg = /^[0-9]+$/i;
			if ( ( value.length > 10 || !reg.test(value) || value.length === 0 ) && SettingsPage.FileList.elements[0].IsChecked() ) {
				new CModalAlert(currCPage, _('Attention'), _('Incorrect password. Use digits only. Space doesn\'t allow. Maximum length is 10 symbols.'));
				return;
			}
			if ( environment.accessControl !== SettingsPage.FileList.elements[0].IsChecked() ) {
				environment.accessControl = SettingsPage.FileList.elements[0].IsChecked();
				to_save.accessControl = environment.accessControl;
			}
			if ( environment.acPassword !== SettingsPage.FileList.elements[1].GetValue() && environment.accessControl ) {
				environment.acPassword = SettingsPage.FileList.elements[1].GetValue();
				to_save.acPassword = environment.acPassword;
				accessControl.password = environment.acPassword;
			}
			if ( environment.acPassword ) {
				accessControl.login(accessControl.password, true);
			} else {
				accessControl.logout();
			}
			if ( environment.accessControl ) {
				accessControl.data.pages[SettingsPage.FileList.elements[2].name] = SettingsPage.FileList.elements[2].IsChecked();
				accessControl.data.events[SettingsPage.FileList.elements[3].name] = SettingsPage.FileList.elements[3].IsChecked();
				accessControl.data.events[SettingsPage.FileList.elements[4].name] = SettingsPage.FileList.elements[4].IsChecked();
				for ( i = SettingsPage.FileList.pagesLength.start; i < SettingsPage.FileList.pagesLength.end; i++ ) {
					accessControl.data.pages[SettingsPage.FileList.elements[i].name] = SettingsPage.FileList.elements[i].IsChecked();
				}
				accessControl.save();
			}
			break;
	}
	try {
		var str = JSON.stringify(to_save);
		echo(str, 'settings to save');
		gSTB.SetEnv(str);
		echo(to_save, 'to_save');
		SettingsPage.BPanel.Hidden(SettingsPage.buttons.OK, true);
        if( needReboot ){
			new CModalConfirm(currCPage, _('Successfully saved'), _('Device reboot is required to apply changes. Reboot now?'),
				_('Cancel'), function(){},
				_('Ok'), function(){ gSTB.ExecAction('reboot'); }
			);
		} else {
			if ( needReload ) {
				new CModalConfirm(currCPage, _('Confirm'), _('Restart portal?'), _('Cancel'), null, _('Yes'), function () {
					var portalWinId = parseInt(getWindowIdByName(WINDOWS.PORTAL) || getWindowIdByName(WINDOWS.PORTALS_LOADER) || 1),
						windowList = JSON.parse(stbWindowMgr.windowList());
					document.body.style.display = 'none';
					gSTB.Stop();
					for ( var i = 0; i < windowList.result.length; i++ ) {
						if ( windowList.result[i] !== portalWinId ) {// && windowList.result[i] !== currentWinId
							stbWindowMgr.closeWindow(windowList.result[i]);
						}
					}
					stbStorage.clear();
					stbWindowMgr.windowLoad(portalWinId, PATH_SYSTEM + 'pages/loader/index.html');
				});
			} else {
				new CModalHint(currCPage, _('Successfully saved'), 2000);
			}
		}
	} catch (e) {
		echo(e, 'settings save error');
	}
}


function loadMasterSettings ( handler ) {
	gettext.init({
		name: getCurrentLanguage(),
		path: 'public/portal/master_settings/lang'
	}, function() {
		loadScript('public/portal/master_settings/variables.js', function() {
			loadScript('public/portal/master_settings/main.js', function() {
				if (typeof MasterSettings !== undefined) {
					MasterSettings.Init(document.getElementById('pageMasterSettings'));
				}

				MasterSettings.Show(true);
				initMasterSettings();

				if ( handler && typeof handler === 'function' ) {
					handler();
				}
			});
		});
	});
}


function settingsFrontPanelControl () {
	if ( !configuration.frontPanelIndicator ) {
		// Выключаем индикацию на передней панели STB
		gSTB.ExecAction('front_panel caption ' + 'KKKK');
		gSTB.ExecAction('front_panel colon-off');
	} else {
		gSTB.ExecAction('front_panel colon-on');
	}
}


var clockTimer = null;
function settingsClockControl () {
	// Запускаем часы
	if ( !environment.ssaverDelay &&  environment.ssaverDelay !== 0) {
		gSTB.SetEnv(JSON.stringify({ssaverDelay:18}));
		environment.ssaverDelay = 18;
	}
	clockSetup();
	clearInterval(clockTimer);
	clockTimer = setInterval(clockSetup, 10000);
}


function clockSetup () {
	var date = new Date();
	var h = date.getHours();
	var m = date.getMinutes();
	var today = date.getDate();
	var month = date.getMonth();
	var day = date.getDay();
	if ( m.toString().length === 1 ) {
		m = '0' + m;
	}
	document.getElementById('screenClockMinutes_main').innerHTML = h + ':' + m;
	if ( MediaPlayer.domPlayerClock ) {
		MediaPlayer.domPlayerClock.innerHTML = h + ':' + m;
		MediaPlayer.domPlayerClockOptional.innerHTML = h + ':' + m;
	}
	document.getElementById('screenClockDate_main').innerHTML = fullDaysOfWeek[day] + ',<br>' + today + ' ' + fullMonthNames[month];
	if ( date.getFullYear() < 2012 ) {
		document.getElementById('screenClockMinutes_main').innerHTML = ' ';
		document.getElementById('screenClockDate_main').innerHTML = ' <br> ';
	}
	if ( configuration.frontPanelIndicator ) {
		if ( h.toString().length === 1 ) {
			h = '@' + h;
		}
		gSTB.ExecAction('front_panel caption ' + h + m);
		gSTB.ExecAction('front_panel colon-on');
	}
}

   // TODO: wrong sorting for uk lang
function sortingABC ( array ) {
	var i, arr = [], resArray = [], langFullName;
	for ( i = 0; i < array.length; i++ ) {
		langFullName = array[i].nativeName ? array[i].id + ' (' +array[i].nativeName + ')' :  array[i].id;
		arr.push(langFullName + '@' + array[i].code[0] + '@' + i);
	}
	arr = arr.sort();
	var item, a;
	for ( i = 0; i < arr.length; i++ ) {
		item = {};
		a = arr[i].split('@');
		item.title = a[0];
		item.code = a[1];
		item.value = a[2];
		resArray.push(item);
	}
	return resArray;
}


function toggleMuteState () {
	if ( configuration.volume.mute ) {
		document.getElementById('mute').style.visibility = 'hidden';
		document.getElementById('toolsPan').style.display = 'none';
		configuration.volume.mute = 0;            // MUTE Выкл. (звук включен)
	}
	else {
		volumeCloseForm();
		document.getElementById('mute').style.visibility = 'visible';
		document.getElementById('toolsPan').style.display = 'block';
		configuration.volume.mute = 1;            // MUTE Вкл. (звук выключен)
		if ( configuration.volume.timer ) {
			clearTimeout(configuration.volume.timer);
		}
	}
	gSTB.SetMute(configuration.volume.mute);
	if ( UPnPRenderer.state ) {
		stbUPnPRenderer.sendMute(configuration.volume.mute);
	}
}


function volumeSetVolume ( vol ) {
	if ( configuration.volume.timer ) {
		clearTimeout(configuration.volume.timer);
	}
	document.getElementById('mute').style.visibility = 'hidden';
	var step_px;                 //  шаг смещения ползунка при изменении громкости на 5% (px)

	if ( WINDOW_WIDTH === 1920 ) {
		step_px = 15;
	} else {
		step_px = 10;
	}

	/*WINDOW_WIDTH === 1920 ? step_px = 15 : step_px = 10;*/
	var valueDiv = document.getElementById('volumeForm');
	var volumeNum = document.getElementById('volume_num');
	var bar = document.getElementById('volume_right');
	var control = document.getElementById('volume_bar');
	var vol_idx = vol / 5;
	if ( vol_idx ) {
		var value = vol_idx * step_px - 5;
		bar.style.width = value + 'px';
		if ( configuration.volume.mute ) {
			toggleMuteState();  // Выкл. MUTE (включить звук)
		}
		control.style.visibility = 'visible';
	} else {
		control.style.visibility = 'hidden';
	}
	environment.audio_initial_volume = vol;
	volumeNum.innerHTML = environment.audio_initial_volume + '%';
	gSTB.SetVolume(vol);
	configuration.volume.timer = setTimeout(volumeCloseForm, configuration.volume.hideTimeOut);
	valueDiv.style.visibility = 'visible';
	document.getElementById('toolsPan').style.display = 'block';

	if ( UPnPRenderer.state ) {
		stbUPnPRenderer.sendVolume(vol);
	}
}


function volumeCloseForm () {
	configuration.volume.timer = null;
	document.getElementById('volumeForm').style.visibility = 'hidden';
	if ( environment.audio_initial_volume >= 5 ) {
		document.getElementById('volume_bar').style.visibility = 'hidden';
	}
	document.getElementById('toolsPan').style.display = 'none';
}

function secondsToTimeString ( time ) {
	var h = Math.floor(time / 3600);
	var m = Math.floor((time - h * 3600) / 60);
	var s = time - h * 3600 - m * 60;
	return (h > 9 ? h : '0' + h) + ':' + (m > 9 ? m : '0' + m) + ':' + (s > 9 ? s : '0' + s);
}


/**
 * Collects environment vars
 */
function loadEnvironmentVars ( volume ) {
	// prepare
	var environment, wakeUpSources,
		query = { varList : [
			'front_panel',
			'autoupdate_cond', 'betaupdate_cond', 'lang_audiotracks',
			'subtitles_on','lang_subtitles','ts_path',
			'ts_time','ts_endType','ts_exitType',
			'ts_lag','ts_on','ts_icon',
			'settMaster','Image_Desc','Image_Date','Image_Version',
			'weather_place','audio_initial_volume','graphicres',
			'tvsystem','autoupdateURL','ssaverDelay','ssaverName', 'autoPowerDownTime',
			'subtitles_on', 'upnp_conf', 'weather_conf',
			'dvb_type', 'auto_framerate', 'standByMode',
			'startPage', 'hdmi_event_delay', 'defaultLedLevel', 'standbyLedLevel',
			'mount_media_ro', 'playerClock', 'subtitlesSize', 'subtitlesColor',
			'teletext_on', 'teletext_charset', 'teletext_ratio', 'teletext_opacity',
			'mount_media_ro', 'playerClock', 'subtitlesSize',
			'controlModel', 'acPassword', 'accessControl', 'syslog_srv',
			'aspect'
		]},
		keyboardFile = gSTB.LoadUserData('keyboard.json'),
		remoteControlFileData = gSTB.LoadUserData('remoteControl.json');

	try {
		// collect data
		environment = JSON.parse(gSTB.GetEnv(JSON.stringify(query))).result;
		// postprocessing numeric results
		if ( environment.ts_time === '' ) {
			environment.ts_time = ts_time;
		}
		if ( environment.ts_endType === '' ) {
			environment.ts_endType = ts_endType;
		}
		if ( environment.ts_exitType === '' ) {
			environment.ts_exitType = ts_exitType;
		}
		if ( environment.ts_lag === '' ) {
			environment.ts_lag = ts_lag;
		}
		if ( environment.controlModel === '' ) {
			environment.controlModel = controlModel;
		}
		if ( environment.hdmi_event_delay === '' || ( parseInt(environment.hdmi_event_delay, 10) < 5 && environment.hdmi_event_delay !== '0' ) ) {
			environment.hdmi_event_delay = '5';
			gSTB.SetEnv(JSON.stringify({hdmi_event_delay : '5'}));
		}
		if ( environment.standByMode === '' ) {
			environment.standByMode = gSTB.StandByMode;
			gSTB.SetEnv(JSON.stringify({standByMode: gSTB.StandByMode}));
		}
		if ( environment.defaultLedLevel === '' ) {
			environment.defaultLedLevel = 10;
		}
		if ( environment.standbyLedLevel === '' ) {
			environment.standbyLedLevel = 100;
		}
		if ( volume !== null && environment.audio_initial_volume === '' ) {
			environment.audio_initial_volume = volume;
		}
		if ( environment.teletext_on === '' ) {
			environment.teletext_on = 'on';
		}
		if ( environment.teletext_charset === '' ) {
			environment.teletext_charset = 'disabled';
		}
		if ( environment.teletext_ratio === '' ) {
			environment.teletext_ratio = '0';
		}
		if ( environment.teletext_opacity === '' ) {
			environment.teletext_opacity = '125';
		}

		if ( environment.subtitlesColor === '' ) {
			environment.subtitlesColor = 0xFFFFFF;
		}

		if ( !environment.aspect && environment.aspect !== 0 ) {
			environment.aspect = 0x10;
		}

		//different init states 0 and ''
		environment.audio_initial_volume = parseInt(environment.audio_initial_volume, 10);
		[
			'ts_exitType', 'autoupdate_cond', 'ssaverDelay', 'autoPowerDownTime', 'ts_time','ts_endType','ts_lag',
			'defaultLedLevel', 'standbyLedLevel', 'lang_subtitles', 'subtitlesSize', 'subtitlesColor', 'aspect'
		].forEach(function(item){
			// empty or invalid strings are resolved to zero
			environment[item] = parseInt(environment[item], 10) || 0;
		});
		// postprocessing boolean results
		['ts_on', 'ts_icon', 'subtitles_on', 'dvb_power', 'playerClock', 'accessControl'].forEach(function(item){
			// empty or invalid strings are resolved to false
			environment[item] = environment[item] === 'true';
		});

		environment.betaupdate_cond = environment.betaupdate_cond === '1' || environment.betaupdate_cond === 'true';
		// manual lang
		environment.language = getCurrentLanguage();
	} catch ( e ) {
		echo(e, 'Environment load');
		environment = {};
	}

	if ( keyboardFile ) {
		try {
			keyboardFile = JSON.parse(keyboardFile);
		} catch ( error ) {
			keyboardFile = {layouts: [], order: []};
			gSTB.SaveUserData('keyboard.json', JSON.stringify(keyboardFile));
		}

		if ( keyboardFile.layouts && keyboardFile.layouts.length ) {
			for ( var i = 0; i < keyboardFile.layouts.length; i++ ) {
				if ( keyboards.codes.indexOf(keyboardFile.layouts[i]) === -1 ) {
					keyboardFile.layouts.splice(i, 1);
				}
			}

			if ( keyboardFile.layouts.length ) {
				keyboards[environment.language] = [];

				for ( i = 0; i < keyboardFile.layouts.length; i++ ) {
					if ( i === (keyboardFile.layouts.length - 1) ) {
						keyboards[environment.language][keyboards[environment.language].length] = [keyboardFile.layouts[i], keyboardFile.layouts[0]];
					} else {
						keyboards[environment.language][keyboards[environment.language].length] = [keyboardFile.layouts[i], keyboardFile.layouts[i + 1]];
					}
				}
			}
		}
	}

	gSTB.SetInputLang(keyboards[environment.language][0][0]);

	try {
		remoteControlFileData = JSON.parse(remoteControlFileData);
	} catch (error) {
		remoteControlFileData = {enable:false, deviceName:'', password:''};
		gSTB.SaveUserData('remoteControl.json', JSON.stringify(remoteControlFileData));
	}

	gSTB.ConfigNetRc(remoteControlFileData.deviceName, remoteControlFileData.password);
	gSTB.SetNetRcStatus(remoteControlFileData.enable);

	// Correct wake up sources to fix hdmi wake up reaction in deep standby mode
	if ( typeof gSTB.GetWakeUpSources === 'function' && (gSTB.SupportedWakeUpSources || []).indexOf(2) !== -1 ) {
		wakeUpSources = gSTB.GetWakeUpSources() || [];
		if ( Number(environment.hdmi_event_delay) === 0 && wakeUpSources.indexOf(2) !== -1 ) {
			wakeUpSources.splice(wakeUpSources.indexOf(2), 1);
			gSTB.SetWakeUpSources(wakeUpSources); // hdmi reaction turned off so it's not a wake up src anymore
		} else if ( Number(environment.hdmi_event_delay) !== 0 && wakeUpSources.indexOf(2) === -1 ) {
			wakeUpSources.push(2);
			gSTB.SetWakeUpSources(wakeUpSources); // hdmi reaction turned on so add it as wake up src
		}
	}

	return environment;
}

function calculateTheDistance ( latA, longA, latB, longB ) {
	var earthRadius = 6372795,

		lat1 = latA * Math.PI / 180,
		lat2 = latB * Math.PI / 180,
		long1 = longA * Math.PI / 180,
		long2 = longB * Math.PI / 180,

		cosLat1 = Math.cos(lat1),
		cosLat2 = Math.cos(lat2),
		sinLat1 = Math.sin(lat1),
		sinLat2 = Math.sin(lat2),

		delta = long2 - long1,
		cosDelta = Math.cos(delta),
		sinDelta = Math.sin(delta),

		x = sinLat1 * sinLat2 + cosLat1 * cosLat2 * cosDelta,
		y = Math.sqrt(Math.pow(cosLat2 * sinDelta, 2) + Math.pow(cosLat1 * sinLat2 - sinLat1 * cosLat2 * cosDelta, 2)),

		ad = Math.atan2(y, x);

	return Math.ceil(ad * earthRadius);
}
