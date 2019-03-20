/**
 * Loading screen for multiply portals and error page. Main module.
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

/**
 * @namespace
 */
var app = (function ( global ) {
	// declarations
	var module = {};

	// turn off all service buttons and screen saver
	gSTB.EnableServiceButton(false);
	gSTB.EnableAppButton(false);
	gSTB.EnableTvButton(false);
	gSTB.SetScreenSaverTime(0);
	stbStorage.setItem(getWindowKey(WINDOWS.PORTALS_LOADER), stbWebWindow.windowId()); // portals loader window registration
	gSTB.SetSettingsInitAttr(JSON.stringify({                                          // prepare settings page
		url: PATH_SYSTEM + 'settings/index.html',
		backgroundColor: '#000'
	}));
	/**
	 * main entry point
	 */
	module.init = function () {
		echo('initialization start');
		var portalsData,  // portals data from file
			dataFromDHPC, // portals data from DHCP
			wakeUpSources,// currently applied wake up sources
			envVars     = module.data.getEnvData(), // portals data from environment variables
			pageUrl     = parseUri(window.location),
			controlData = module.data.getRCData();

		// init player ( this is also HDMI events handler )
		gSTB.InitPlayer();
		// init remote control
		gSTB.ConfigNetRc(controlData.deviceName, controlData.password);
		gSTB.SetNetRcStatus(controlData.enable);
		// launch auto power down
		app.standByMode = parseInt(envVars.standByMode, 10);
		// Correct wake up sources to fix hdmi wake up reaction in deep standby mode
		if ( typeof gSTB.GetWakeUpSources === 'function' && (gSTB.SupportedWakeUpSources || []).indexOf(2) !== -1 ) {
			wakeUpSources = gSTB.GetWakeUpSources() || [];
			if ( envVars.hdmiEventDelay === 0 && wakeUpSources.indexOf(2) !== -1 ) {
				wakeUpSources.splice(wakeUpSources.indexOf(2), 1);
				gSTB.SetWakeUpSources(wakeUpSources); // hdmi reaction turned off so it's not a wake up src anymore
			} else if ( envVars.hdmiEventDelay !== 0 && wakeUpSources.indexOf(2) === -1 ) {
				wakeUpSources.push(2);
				gSTB.SetWakeUpSources(wakeUpSources); // hdmi reaction turned on so add it as wake up src
			}
		}
		if ( typeof gSTB.SetAutoPowerDownInitAttr === 'function' ) {
			gSTB.SetAutoPowerDownInitAttr(JSON.stringify({
				url: PATH_SYSTEM + 'pages/standby/index.html',
				backgroundColor: 'transparent'
			}));
			gSTB.SetAutoPowerDownTime(envVars.autoPowerDownTime); // time, 0 - disable, 10-86400 sec
		}
		// getting data about DHCP loading
		dataFromDHPC = module.data.getDHCPData();
		gettext.init({name: getCurrentLanguage()}, function () {
			if ( pageUrl.queryKey.fallbackstate || pageUrl.queryKey.btnstate ) {
				stbStorage.setItem('nandEmergencyLoadingLogs', JSON.stringify({bootmedia: pageUrl.queryKey.bootmedia}));
				module.view.showWarningPage(continueLoading);
			} else {
				continueLoading();
			}

			function continueLoading () {
				module.isItErrorPage = !pageUrl.queryKey.bootmedia && pageUrl.query; // 404 error page
				echo('is it 404 page? ' + module.isItErrorPage);

				if ( module.isItErrorPage ) {
					module.isItBlocked = pageUrl.queryKey.blocked === 'true';
					if ( pageUrl.queryKey.url ) {
						module.badUrl = decodeURIComponent(pageUrl.queryKey.url);
					} else {
						module.badUrl = decodeURIComponent(pageUrl.query);
					}
				}

				// check if migration needed (portals.json not found of empty)
				module.data.migration(envVars);
				// getting data about portals from portals.json
				portalsData = module.data.getPortals();
				// environment variables check mechanism
				checkEnvVars();
				// renew env data
				envVars = module.data.getEnvData();
				// if operator set env variables by force we should use and save them
				portalsData = module.data.checkForceEnvSet(portalsData, envVars);
				// vars use rules
				var is = {
					// this is new multi portal scheme fix
					case1: portalsData.enable && !portalsData.empty,
					// this is old multi portal scheme
					case2: (envVars.portal1 && envVars.portal2 && (!portalsData.enable)),
					// this is new multi portal scheme WITHOUT auto start flag
					case3: (portalsData.enable && (Number(portalsData.time) === 0)),
					// this is allowed DHCP portal loading
					case4: dataFromDHPC.enable && dataFromDHPC.url
				};
				if ( !module.isItErrorPage && !envVars.portal1 && !envVars.portal2 && !is.case4 && !is.case1 ) {
					echo('There is no portal for loading. Redirecting to inner portal');
					document.getElementById('loading').style.display = 'block';
					module.loadPortal(PATH_ROOT + 'services.html');
				}
				// cpage, cslist... creation. I mean all graphic things creation.
				module.view.init();
				accessControl.init();
				if ( !module.isItErrorPage && ((!is.case2 && !is.case3) || is.case4)/* || is.case1 */ ) {
					// show portal loading screen.
					module.view.showFastLoadPage(envVars, portalsData, dataFromDHPC);
				} else {
					// fill and show portals selection page
					module.view.showMainPage(portalsData, envVars);
				}
			}
		});
	};


	// Main event listener
	function mainEventListener ( event ) {
		// get real key code or exit
		if ( !eventPrepare(event, false, 'mainEventListener ' + currCPage.name) ) {return;}
		if ( currCPage && typeof currCPage.EventHandler === 'function' ) {
			// stop if necessary
			if ( currCPage.EventHandler(event) ) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
	}


	/**
	 * hide loader and load portal
	 * @param {string} url - url for loading
	 */
	module.loadPortal = function ( url ) {
		url = parseUri(decodeURI(url));
		if ( app.view.systemMonitoringTimer ) { clearInterval(app.view.systemMonitoringTimer); }
		if ( module.view.mainPage ) {module.view.mainPage.Show(false); }
		if ( module.view.fastLoadPage ) {module.view.fastLoadPage.Show(false); }
		// restore server settings page button
		gSTB.EnableServiceButton(true);
		// load portal
		setTimeout(function () {
			// is it local file or we should use http protocol to load it
			if ( !url.protocol ) { url.source = gSTB.IsFileExist(url.source) ? 'file:///' + url.source : 'http://' + url.source; }
			stbStorage.removeItem(getWindowKey(WINDOWS.PORTALS_LOADER));
			stbStorage.removeItem(getWindowKey(WINDOWS.PORTAL));
			echo(url.source, 'LOAD PORTAL:');
			window.location = url.source;
		}, 10);
	};

	// main entry point setup
	global.onload = module.init;
	// Main event listener
	document.addEventListener('keydown', mainEventListener);
	// prevent default right-click menu
	global.oncontextmenu = EMULATION ? null : function () {return false;};

	// export
	return module;
}(window));


// global event
var stbEvent = {
	onEvent: function ( data ) {},
	onMessage: function ( from, message, data ) {
		this.trigger(message, {from: from, data: data});
	},
	onBroadcastMessage: function ( from, message, data ) {
		echo(message, 'onBroadcastMessage');
		this.trigger('broadcast.' + message, {from: from, data: data});
	},
	event: 0
};

Events.inject(stbEvent);
