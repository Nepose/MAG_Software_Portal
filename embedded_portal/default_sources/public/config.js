/**
 * Конфигурация внутренего портала
 */

'use strict';

// build option set
configuration = (function(configuration){

	// menu items
	var menu = {
		mediaBrowser: {
			ico      : '/icons/mb.png',
			name     : 'mediaBrowser',
			'script' : function () {
				MediaBrowser.Reset();
				MediaBrowser.Show(true);
			},
			help     : 'menu/home_media',
			stat_name: 'mediabrowser'
		},
		tvChannels: {
			ico      : '/icons/tv.png',
			name     : 'tvChannels',
			help     : 'menu/iptv_channels',
			'script' : function () {
				IPTVChannels.Show(true);
				IPTVChannels.Reset();
			},
			stat_name: 'tvchannels'
		},
		wildWeb: {
			ico      : '/icons/web.png',
			name     : 'wildWeb',
			help     : 'menu/internet_browser',
			'script' : function () {
				setTimeout(function(){
					// Url possible options:
					// mode = Choose page to display Bookmarks = 1, Browser = 2
					// url = if mode is equal to 2, trying to browsing this link
					// view = if isset right url and mode is equal to 2, display browser in full screen
					openWindow(WINDOWS.BROWSER, PATH_ROOT + 'public/app/ibman/index.html?mode=2');
				}, 0);
			},
			stat_name: 'wildweb'
		},
		weatherSettings: {
			ico      : '/icons/weather.png',
			name     : 'weatherSettings',
			help     : 'menu/weather',
			'script' : function () {
				WeatherPage.Show();
			},
			stat_name: 'weather'
		},
		dlman: {
			ico      : '/icons/dm.png',
			name     : 'dlman',
			help     : 'menu/download_manager',
			'script' : function () {
				openWindow(WINDOWS.DOWNLOAD_MANAGER, PATH_ROOT + 'public/app/dlman/index.html');
			},
			stat_name: 'downloadmanager'
		},
		pvr: {
			ico      : '/icons/pvr.png',
			name     : 'pvr',
			help     : 'menu/pvr_manager',
			'script' : function () {
				openWindow(WINDOWS.PVR, PATH_ROOT + 'public/app/pvr/index.html');
			},
			stat_name: 'recordmanager'
		},
		wildWebBookmarks: {
			ico      : '/icons/favs.png',
			name     : 'wildWebBookmarks',
			help     : 'menu/internet_bookmarks',
			'script' : function () {
				setTimeout(function(){
					openWindow(WINDOWS.BROWSER, PATH_ROOT + 'public/app/ibman/index.html?mode=1');
				}, 0);
			},
			stat_name: 'wildweb'
		},
		settings: {
			ico      : '/icons/settings.png',
			name     : 'settings',
			help     : 'menu/settings',
			'script' : function () {
				SettingsPage.Show();
			},
			stat_name: 'settings'
		},
		manual: {
			ico      : '/icons/manual.png',
			name     : 'Manual',
			help     : 'root',
			'script': function(){
				openWindowHelp('root');
			},
			stat_name: 'manual'
		},
		apps: {
			ico      : '/icons/apps.png',
			name     : 'apps',
			help     : 'menu/applications',
			url      : 'http://apps.infomir.com.ua/?language=' + getCurrentLanguage(),
			stat_name: 'apps'
		},
		//onlinecinema : {
		//	ico : '/icons/cinema.png',
		//	name: 'onlinecinema',
		//	help     : 'menu/online_media',
		//	url : 'http://online-media.infomir.com.ua/public_html/?language=' + getCurrentLanguage() + '&only=online_cinema',
		//	stat_name: 'online_cinema'
		//},
		//InternetServices : {
		//	ico : '/icons/iserv.png',
		//	name: 'Internet_services',
		//	help     : 'menu/internet_services',
		//	url : 'http://online-media.infomir.com.ua/public_html/?language=' + getCurrentLanguage() + '&except=online_cinema',
		//	stat_name: 'inet_services'
		//},
		dvbChannels: {
			ico      : '/icons/dvb.png',
			name     : 'dvbChannels',
			'script' : function () {
				DVBChannels.Show(true);
				DVBChannels.Reset();
			},
			stat_name: 'tvchannels'
		},
		masterSettings: {
			ico      : '/icons/master.png',
			name     : 'masterSettings',
			'script' : function () {
				var currentPage = currCPage;
				loadMasterSettings(function() {
					MasterSettings.origin = currentPage;
				});
			},
			stat_name: 'mastersettings'
		},
		magicCast: {
			ico : '/icons/magicCast.png',
			name: 'MAGic Cast',
			help     : 'menu/internet_services',
			url : 'http://magiccast.magapps.net/index.html',
			stat_name: 'magic_cast'
		}
	};

	var defaultSpeedTest = {
		baseURL    : '.leaseweb.net/speedtest/10mb.bin',
		dataCenters: [
			{
				name: 'San Jose',
				lat : 37.3393900,
				long: -121.8949600,
				code: 'us'
			},
			{
				name: 'Washington D.C',
				lat : 38.8951100,
				long: -77.0363700,
				code: 'us'
			},
			{
				name: 'Amsterdam',
				lat : 52.3740300,
				long: 4.8896900,
				code: 'nl'
			},
			{
				name: 'Frankfurt',
				lat : 50.1166700,
				long: 8.6833300,
				code: 'de'
			}
		]
	};

	// traceroute info, set this options to 'false' or disable it in the rules.js if you want to disable this functionality
	var defaultTraceroute = {
		// targets for traceroute
		domains: ['echo-01.infomir.com', 'echo-03.infomir.com'],
		// traceroute duration
		time: 210
	};

	var config = extend({
		screensaversPath: PATH_SYSTEM + 'pages/screensaver',

		url: {
			// set of ping address
			// randomized on STB start and then use one by one in case of any problems
			ping: [
				'http://echo-01.infomir.com/',
				'http://echo-02.infomir.com/',
				'http://echo-03.infomir.com/',
				'http://echo-04.infomir.com/'
			].shuffle(),

			// amount of tries before report failure
			pingAttempts: 3,
			updateList: '',
			operatorsTVList: 'http://playlist.iptv.infomir.com.ua/api/'
		},

		speedTest: defaultSpeedTest,

		traceroute: defaultTraceroute,

		frontPanelIndicator: 0,   // 0 = 'OFF' | 1 = 'clock' | 2 = 'clock/TV channel'

		// desktop of main page
		desktop: {
			x     : 5,
			y     : 3,
			count : 0,
			number: 0
		},


		mayTimeShift: true,
		mayDVB: false,
		mayEPG: true,
		mayPVR: true,
		maySecureM3u: false,

		// volume
		volume: {
			def        : 100,
			mute       : 0,
			step       : 5,
			timer      : null,
			hideTimeOut: 3000
		},

		// Default subtitle and audio lang id (iso639). If null it would be calculated from portal current localisation.
		defaultAudioLang: null,
		defaultSubtitleLang: null,

		// supported file systems
		fileSystemTypes: ['<unknown>', 'fat16', 'fat32', 'ext2', 'ext3', 'ntfs', 'ext4'],

		/**
		 * List of all file types to display
		 * @type {string[]}
		 */
		// REGISTERED_TYPES (dlman also has similar variable)
		registersTypes: [
			'mpg', 'mpeg', 'mkv', 'avi', '3gp', 'ts', 'tspinf', 'm4a', 'mp3', 'mp4', 'ac3', 'mov', 'vob', 'wav', 'ape', 'mts', 'm2t', 'm2v', 'ogg', 'oga', 'divx', 'aiff',
			'm2ts', 'wv', 'm2p', 'tp', 'flv', 'tta', 'mod', 'tod', 'asf', 'wma', 'wmv', 'flac', 'ape', 'cue', 'm3u', 'm3u8', 'jpg', 'jpeg', /*'raw', 'gif',*/
			'png', 'bmp', 'tif', 'tiff', 'iso', 'aac', 'txt', 'srt', 'sub', 'ass', 'm4v', 'trp', 'tts', 'wtv'
		],

		menu: [
			menu.mediaBrowser, menu.tvChannels, menu.magicCast, menu.pvr, menu.dlman,
			menu.wildWeb, menu.weatherSettings, menu.manual, menu.settings
		],
		masterSettingOnStart: false,

		setting: {
			settingsList: ['playback', 'interface', 'update', 'timeShift', 'speedTest', 'settings', 'accessControl', 'teletext'] //,'masterSettings'
		},

		startPage: null
	}, configuration, false);

	var models = {};

	models.IP_STB_HD = {};


	// mag250 without some sockets and codecs
	models.MAG245 = {
		url: {
			updateList: 'http://update.infomir.com/mag/245/update_list.txt'
		}
	};


	// mag250 without some sockets and codecs
	models.MAG245D = extend(models.MAG245, {
		url: {
			updateList: 'http://update.infomir.com/mag/245d/update_list.txt'
		}
	}, false);


	models.MAG250 = {
		url: {
			updateList: 'http://update.infomir.com/mag/250/update_list.txt'
		}
	};


	models.MAG254 = {
		url: {
			updateList: 'http://update.infomir.com/mag/254/update_list.txt'
		}
	};


	models.MAG255 = {
		url: {
			updateList: 'http://update.infomir.com/mag/255/update_list.txt'
		},
		maySecureM3u: true
	};


	// open version of MAG257
	models.MAG256 = extend(models.MAG254, {
		url: {
			updateList: 'http://update.infomir.com/mag/256/r/update_list.txt'
		},
		mayTimeShift: true,
		mayPVR: true,
		menu: [
			menu.mediaBrowser, menu.tvChannels, menu.magicCast, menu.dlman, menu.wildWeb,
			menu.weatherSettings, menu.manual, menu.settings/*, menu.playkey*/, menu.pvr
		],
		setting: {
			settingsList: ['playback', 'interface', 'update', 'timeShift', 'speedTest', 'settings', 'accessControl', 'teletext']
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag256.png',
		registersTypes: ['mpg', 'mpeg', 'mkv', 'avi', '3gp', 'ts', 'tspinf', 'm4a', 'mp3', 'mp4', 'ac3', 'mov', 'vob', 'wav', 'ape', 'mts', 'm2t', 'm2v', 'ogg', 'oga', 'divx', 'aiff',
			'm2ts', 'wv', 'm2p', 'tp', 'flv', 'tta', 'mod', 'tod', 'asf', 'wma', 'wmv', 'flac', 'ape', 'cue', 'm3u', 'm3u8', 'jpg', 'jpeg', /*'raw', 'gif',*/
			'png', 'bmp', 'tif', 'tiff', 'iso', 'aac', 'txt', 'srt', 'sub', 'ass', 'm4v', 'trp', 'tts',
			'raw', 'gif', 'cr2', 'nef', 'orf', 'iiq', 'ico', 'psd', 'webp', 'tif', 'tiff', 'wtv'
		]
	}, false);


	// mag254 without PVR and TimeShift (security version)
	models.MAG257 = extend(models.MAG256, {
		url: {
			updateList: 'http://update.infomir.com/mag/257/update_list.txt'
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag257.png',
		maySecureM3u: true
	}, false);


	// mag254 without PVR and TimeShift
	models.MAG257G = extend(models.MAG256, {
		url: {
			updateList: 'http://update.infomir.com/mag/257G/update_list.txt'
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag257.png'
	}, false);


	// mag254 without PVR and TimeShift
	models.MAG277 = extend(models.MAG256, {
		url: {
			updateList: 'http://update.infomir.com/mag/277/update_list.txt'
		}
	}, false);


	// ~mag255 hybrid (DVB-C, DVB-T)
	models.MAG270 = {
		menu: [
			menu.mediaBrowser, menu.dvbChannels, menu.tvChannels, menu.magicCast, menu.pvr,
			menu.dlman,	menu.wildWeb, menu.weatherSettings, menu.manual, menu.settings
		],
		mayDVB: true,
		url: {
			updateList: 'http://update.infomir.com/mag/270/update_list.txt',
			speedTest: '',
			traceroute: false
		},
		setting: {
			settingsList : ['playback','interface','update','timeShift','speedTest','DVB','settings', 'accessControl', 'teletext']
		}
	};


	// ~mag255 hybrid (DVB-C, DVB-T, DVB-T2)
	models.MAG275 = extend(models.MAG270, {
		url: {
			updateList: 'http://update.infomir.com/mag/275/update_list.txt'
		}
	}, false);


	// security version
	models.MAG276 = extend(models.MAG275, {
		url: {
			updateList: 'http://update.infomir.com/mag/276/update_list.txt'
		}
	}, false);


	models.MAG322 = extend(models.MAG254, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag322.png',
		url: {
			updateList: 'http://update.infomir.com/mag/322/update_list.txt'
		},
		registersTypes: ['mpg', 'mpeg', 'mkv', 'avi', '3gp', 'ts', 'tspinf', 'm4a', 'mp3', 'mp4', 'ac3', 'mov', 'vob', 'wav', 'ape', 'mts', 'm2t', 'm2v', 'ogg', 'oga', 'divx', 'aiff',
			'm2ts', 'wv', 'm2p', 'tp', 'flv', 'tta', 'mod', 'tod', 'asf', 'wma', 'wmv', 'flac', 'ape', 'cue', 'm3u', 'm3u8', 'jpg', 'jpeg', /*'raw', 'gif',*/
			'png', 'bmp', 'tif', 'tiff', 'iso', 'aac', 'txt', 'srt', 'sub', 'ass', 'm4v', 'trp', 'tts',
			'gif', 'cr2', 'nef', 'orf', 'iiq', 'ico', 'webp', 'tif', 'wtv'
		]
	}, false);


	// security version of MAG322
	models.MAG323 = extend(models.MAG322, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag323.png',
		url: {
			updateList: 'http://update.infomir.com/mag/323/update_list.txt'
		}
	}, false);


	models.MAG324 = extend(models.MAG254, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag324.png',
		url: {
			updateList: 'http://update.infomir.com/mag/324/update_list.txt'
		},
		registersTypes: ['mpg', 'mpeg', 'mkv', 'avi', '3gp', 'ts', 'tspinf', 'm4a', 'mp3', 'mp4', 'ac3', 'mov', 'vob', 'wav', 'ape', 'mts', 'm2t', 'm2v', 'ogg', 'oga', 'divx', 'aiff',
			'm2ts', 'wv', 'm2p', 'tp', 'flv', 'tta', 'mod', 'tod', 'asf', 'wma', 'wmv', 'flac', 'ape', 'cue', 'm3u', 'm3u8', 'jpg', 'jpeg', /*'raw', 'gif',*/
			'png', 'bmp', 'tif', 'tiff', 'iso', 'aac', 'txt', 'srt', 'sub', 'ass', 'm4v', 'trp', 'tts',
			'raw', 'gif', 'cr2', 'nef', 'orf', 'iiq', 'ico', 'psd', 'webp', 'tif', 'tiff', 'wtv'
		]
	}, false);


	models.MAG324C = extend(models.MAG275, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag324c.png',
		url: {
			updateList: 'http://update.infomir.com/mag/324c/update_list.txt'
		},
		registersTypes: ['mpg', 'mpeg', 'mkv', 'avi', '3gp', 'ts', 'tspinf', 'm4a', 'mp3', 'mp4', 'ac3', 'mov', 'vob', 'wav', 'ape', 'mts', 'm2t', 'm2v', 'ogg', 'oga', 'divx', 'aiff',
			'm2ts', 'wv', 'm2p', 'tp', 'flv', 'tta', 'mod', 'tod', 'asf', 'wma', 'wmv', 'flac', 'ape', 'cue', 'm3u', 'm3u8', 'jpg', 'jpeg', /*'raw', 'gif',*/
			'png', 'bmp', 'tif', 'tiff', 'iso', 'aac', 'txt', 'srt', 'sub', 'ass', 'm4v', 'trp', 'tts',
			'raw', 'gif', 'cr2', 'nef', 'orf', 'iiq', 'ico', 'psd', 'webp', 'tif', 'tiff', 'wtv'
		]
	}, false);


	models.MAG325 = extend(models.MAG324, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag325.png',
		url: {
			updateList: 'http://update.infomir.com/mag/325/update_list.txt'
		}
	}, false);


	models.MAG330 = extend(models.MAG254, {
		url: {
			updateList: 'http://update.infomir.com/mag/330/update_list.txt'
		}
	}, false);


	// security version
	models.MAG350 = {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag350.png',
		url: {
			updateList: 'http://update.infomir.com/mag/350/update_list.txt'
		},
		menu: [
			menu.mediaBrowser, menu.tvChannels, menu.magicCast, menu.dlman,
			menu.wildWeb, menu.weatherSettings, menu.manual, menu.settings/*menu.playkey*/, menu.pvr
		],
		setting: {
			settingsList: ['playback', 'interface', 'update', 'timeShift', 'speedTest', 'settings', /*'traceroute',*/ 'accessControl', 'teletext']
		},
		registersTypes: ['mpg', 'mpeg', 'mkv', 'avi', '3gp', 'ts', 'tspinf', 'm4a', 'mp3', 'mp4', 'ac3', 'mov', 'vob', 'wav', 'ape', 'mts', 'm2t', 'm2v', 'ogg', 'oga', 'divx', 'aiff',
			'm2ts', 'wv', 'm2p', 'tp', 'flv', 'tta', 'mod', 'tod', 'asf', 'wma', 'wmv', 'flac', 'ape', 'cue', 'm3u', 'm3u8', 'jpg', 'jpeg', /*'raw', 'gif',*/
			'png', 'bmp', 'tif', 'tiff', 'iso', 'aac', 'txt', 'srt', 'sub', 'ass', 'm4v', 'trp', 'tts',
			'raw', 'gif', 'cr2', 'nef', 'orf', 'iiq', 'ico', 'psd', 'webp', 'tif', 'tiff', 'wtv'
		],
		mayTimeShift: true,
		mayPVR: true,
		maySecureM3u: true,
		speedTest: defaultSpeedTest,
		traceroute: false
	};


	// open version
	models.MAG349 = extend(models.MAG350, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag349.png',
		url: {
			updateList: 'http://update.infomir.com/mag/349/update_list.txt'
		},
		maySecureM3u: false
	}, false);


	// security version
	models.MAG352 = extend(models.MAG350, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag352.png',
		url: {
			updateList: 'http://update.infomir.com/mag/352/update_list.txt'
		}
	}, false);


	// open version
	models.MAG351 = extend(models.MAG352, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag351.png',
		url: {
			updateList: 'http://update.infomir.com/mag/351/r/update_list.txt'
		},
		maySecureM3u: false
	}, false);


	models.MAG356 = extend(models.MAG270, {
		url: {
			updateList: 'http://update.infomir.com/mag/356/update_list.txt'
		}
	}, false);


	models.WR320 = extend(models.MAG254, {
		url: {
			updateList: 'http://support.wrtech.ru/update/WR-320/update_list.txt'
		}
	}, false);


	models.MAG424 = extend(models.MAG351, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag424.png',
		url: {
			updateList: 'http://update.infomir.com/mag/424/update_list.txt'
		}
	}, false);


	models.MAG420 = extend(models.MAG424, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag420.png',
		url: {
			updateList: 'http://update.infomir.com/mag/420/update_list.txt'
		}
	}, false);


	models.MAG422 = extend(models.MAG424, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag422.png',
		url: {
			updateList: 'http://update.infomir.com/mag/422/update_list.txt'
		}
	}, false);


	models.MAG425 = extend(models.MAG351, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/mag425.png',
		url: {
			updateList: 'http://update.infomir.com/mag/425/update_list.txt'
		}
	}, false);


	// mag250 + Aura
	models.AuraHD0 = {
		menu: [
			menu.apps, menu.mediaBrowser, menu.tvChannels, menu.magicCast, menu.dlman,
			menu.pvr, menu.wildWeb, menu.wildWebBookmarks, menu.weatherSettings, menu.manual,
			menu.settings
		],
		masterSettingOnStart: true,
		url: {
			updateList: 'http://update.infomir.com/aurahd/hd0-9/update_list.txt'
		},
		blockAdditionalUpdate: true,
		setting: {
			settingsList: ['playback','interface','update','timeShift','speedTest','settings', 'masterSettings', 'traceroute', 'accessControl', 'teletext']
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/aurahd0.png',
		speedTest: defaultSpeedTest,
		traceroute: defaultTraceroute
	};


	// mag250 + Aura + HDD
	models.AuraHD1 = extend(models.AuraHD0, {
		// difference goes here
	}, false);


	// mag255 + Aura
	// AuraHD Plus, BS2
	models.AuraHD2 = extend(models.AuraHD0, {
		url: {
			updateList: 'http://update.infomir.com/aurahd/hd2/update_list.txt'
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/aurahd2.png',
		maySecureM3u: true
	}, false);


	// mag275 + Aura
	models.AuraHD3 = extend(models.AuraHD2, {
		menu: [
			menu.apps, menu.mediaBrowser, menu.dvbChannels, menu.tvChannels, menu.magicCast,
			menu.dlman,	menu.pvr, menu.wildWeb, menu.wildWebBookmarks, menu.weatherSettings,
			menu.manual, menu.settings
		],
		mayDVB: true,
		maySecureM3u: false,
		url: {
			updateList: 'http://update.infomir.com/aurahd/hd3/update_list.txt'
		},
		setting: {
			settingsList : ['playback','interface','update','timeShift','speedTest','DVB', 'settings', 'masterSettings', 'traceroute', 'accessControl', 'teletext']
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/aurahd3.png'
	}, false);


	// mag322 + Aura
	models.AuraHD4 = extend(models.MAG322, {
		menu: [
			menu.apps, menu.mediaBrowser, menu.tvChannels, menu.magicCast, menu.dlman,
			menu.pvr, menu.wildWeb, menu.wildWebBookmarks, menu.weatherSettings, menu.manual,
			menu.settings
		],
		url: {
			updateList: 'http://update.infomir.com/aurahd/hd4/update_list.txt'
		},
		masterSettingOnStart: true,
		setting: {
			settingsList : ['playback','interface','update','timeShift','speedTest', 'settings', 'masterSettings', 'traceroute', 'accessControl', 'teletext']
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/aurahd4.png'
	}, false);


	// mag255 + Aura
	// AuraHD International Second Edition
	models.AuraHD8 = extend(models.AuraHD0, {
		url: {
			updateList: 'http://update.infomir.com/aurahd/hd8/update_list.txt'
		},
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/aurahd8.png'
	}, false);


	// mag250 + Aura
	// AuraHD International
	models.AuraHD9 = extend(models.AuraHD0, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/aurahd9.png'
	}, false);


	models.IM2100 = extend(models.MAG322, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/im2100.png',
		url: {
			updateList: 'http://update.infomir.com/im/2100/update_list.txt'
		}
	}, false);


	models.IM2100V = extend(models.IM2100, {
		url: {
			updateList: 'http://update.infomir.com/im/2100v/update_list.txt'
		},
		maySecureM3u: true
	}, false);


	models.IM2100VI = extend(models.IM2100V, {
		url: {
			updateList: 'http://update.infomir.com/im/2100vi/update_list.txt'
		}
	}, false);


	models.IM2101 = extend(models.MAG324, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/im2101.png',
		url: {
			updateList: 'http://update.infomir.com/im/2101/update_list.txt'
		}
	}, false);


	// rebrending
	models.IM2102 = extend(models.MAG324C, {
		logoImagePath: PATH_IMG_PUBLIC + 'menu/logo/im2102.png',
		url: {
			updateList: 'http://update.infomir.com/im/2102/update_list.txt'
		},
		setting: {
			settingsList : ['playback','interface','update','timeShift','speedTest', 'settings', 'accessControl', 'teletext']
		}
	}, false);

	config = extend(config, models[gSTB.GetDeviceModelExt()]);

	(function () {
		var menu = [],
			i, deskCount, index;

		config.desktop.count = config.desktop.x * config.desktop.y;

		if ( !Array.isArray(config.menu[0]) ) {
			deskCount = Math.ceil(config.menu.length / config.desktop.count);
			for ( i = 0; i < deskCount; i++ ) {
				menu[i] = config.menu.slice(i * config.desktop.count, (i + 1) * config.desktop.count);
			}
			config.menu = menu;
		}
		if ( !config.speedTest ) {
			index = config.setting.settingsList.indexOf('speedTest');
			if ( index !== -1 ) {
				config.setting.settingsList.splice(index, 1);
			}
		}
		if ( !config.traceroute ) {
			index = config.setting.settingsList.indexOf('traceroute');
			if ( index !== -1 ) {
				config.setting.settingsList.splice(index, 1);
			}
		}
	})();


	return config;
})(configuration);
