/**
 * Loading screen for multiply portals and error page. Views handling module.
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

app.view = (function ( global ) {
	// declarations
	var module = {};

	/**
	 * Page initialization.
	 */
	module.init = function () {
		// set webkit size
		global.moveTo(0, 0);
		window.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);

		// create new page (main page)
		module.mainPage = new CPage();
		module.mainPage.name = 'main';
		// create new page (fast load page)
		module.fastLoadPage = new CPage();
		module.fastLoadPage.name = 'fastLoadPage';

		// small hack. We have only 1 page. No main screen. No previous pages. That's why we should set currCPage and ServiceMenu.
		window.currCPage = window.ServiceMenu = module.mainPage;

		// init main page
		module.mainPage.Init(document.body.children[0]);
		// init fast loading page
		module.fastLoadPage.Init(document.body.children[1]);

		// create and init scroll list
		module.mainPage.portalList = new CScrollList(module.mainPage);
		module.mainPage.portalList.Init(module.mainPage.handleInner.querySelector('.content .cslist-main'));

		module.mainPage.modalDenied = new CModalBox(module.mainPage);
		module.mainPage.modalDenied.bpanel = new CButtonPanel();
		module.mainPage.modalDenied.bpanel.Init(global.CMODAL_IMG_PATH);
		module.mainPage.modalDenied.bpanel.btnExit = module.mainPage.modalDenied.bpanel.Add(KEYS.OK, 'ok.png', _('Ok'), function () {
			module.mainPage.modalDenied.Show(false);
		});
		module.mainPage.modalDenied.SetHeader(_('Warning'));
		module.mainPage.modalDenied.SetContent([
			element('div', {}, _('Access to the web page you were trying to visit has been blocked due to a report of copyright infringement.')),
			element('div', {}, _('Please contact your IPTV service provider for more information.'))
		]);
		module.mainPage.modalDenied.SetFooter(module.mainPage.modalDenied.bpanel.handle);
		module.mainPage.modalDenied.EventHandler = function ( event ) {
			if ( event.code === KEYS.OK ) {
				module.mainPage.modalDenied.Show(false);
				event.preventDefault();
				event.stopPropagation();
			}
		};
		module.mainPage.modalDenied.Init();

		/**
		 * toggle stand by mode
		 */
		module.standByMode = function () {
			var standByStatus = !gSTB.GetStandByStatus();

			echo('PORTALS_LOADER.standByStatus=' + standByStatus);
			// check stand by mode trigger
			if ( gSTB.StandByMode !== app.standByMode ) {
				gSTB.StandByMode = app.standByMode;
			}
			// deep standBy mode
			if ( app.standByMode === 3 ) {
				gSTB.SetLedIndicatorMode(2);
				gSTB.StandBy(standByStatus);
				gSTB.SetLedIndicatorMode(1);
				return;
			}
			// active standby mode
			gSTB.StandBy(standByStatus);
			if ( standByStatus ) {
				gSTB.SetLedIndicatorMode(2);
			} else {
				gSTB.SetLedIndicatorMode(1);
			}
		};

		stbEvent.bind('window.reload', function () {
			document.body.style.display = 'none';
			stbStorage.removeItem(getWindowKey(WINDOWS.PORTALS_LOADER));
			window.location.reload();
		});

		stbEvent.bind('portal.standbyMode', function () {
			console.log('got portal.standbyMode');
			module.standByMode();
		});
	};


	/**
	 * Fill and show page
	 * @param {Object} data loading portal data from file
	 * @param {Object} envVars portal data from environment
	 */
	module.showMainPage = function ( data, envVars ) {
		echo('showMainPage');

		// load images to cache
		var imageList = ['bg.png', 'home.png', 'local.png', 'net.png', 'settings.png', 'refresh.png', 'info.png', 'lan.png', 'wifi.png', 'connect.png'].map(function ( image ) {
			return PATH_IMG_SYSTEM + 'loader/' + image;
		});

		var someListItem, servNumb, servSetItm, newScheme, oldScheme,
			dontShowUrls = RULES.hidePortalsURL || envVars.custom_url_hider,
			itemsArr     = setServiceItems(data);   // set service items
		servNumb = itemsArr.serviceItemsNumber; // get number of service items
		servSetItm = itemsArr.hasServSetItem;   // get service menu button state
		itemsArr = itemsArr.arr;                // make it simpler


		// fill portals list
		for ( var i = 0; i < itemsArr.length; i++ ) {
			// if (multiportal new scheme loading) => add if portal is turned on
			newScheme = data.enable && itemsArr[i].enable;
			// if (old scheme) => always add portal1, portal2, inner portal (if allowed), try again (if this is error page) and sys settings (if allowed)
			oldScheme = !data.enable && ((i < servNumb + 2) || (servSetItm && (i === (itemsArr.length - 1))));
			// add if they has URL
			if ( ( newScheme || oldScheme) && itemsArr[i].url ) {
				itemsArr[i].name = itemsArr[i].name || (_('Portal') + ' ' + (i - servNumb + 1 )); // don't count service items
				// create element (icon + name + url) and get type of portal to set specific icon
				someListItem = element('div', {className: getPortalType(itemsArr[i].url, itemsArr[i].name)}, '');
				elchild(someListItem, [
					element('div', {className: 'icon'}, ''),
					element('div', {className: 'portalInfo'}, [
						element('div', {className: dontShowUrls || itemsArr[i].servItem ? 'text single' : 'text'}, itemsArr[i].name),
						// if hide url option was applied at ini file
						element('div', {className: 'url'}, dontShowUrls || itemsArr[i].servItem ? '' : itemsArr[i].url)
					])
				]);
				// add element to scroll list
				module.mainPage.portalList.Add(someListItem, {
					url: itemsArr[i].url,
					onclick: function () {
						if ( this.url.indexOf(PATH_SYSTEM + 'settings/index.html') === -1 ) {
							app.loadPortal(this.url); // load focused item page
						} else {
							gSTB.StartLocalCfg(); // load server settings page
						}
						return false; // prevent page from reloading
					}
				});
			}
		}

		if ( app.isItErrorPage ) {
			showErrorModeInfo();           // show lan and wi-fi status, MAC, IP...
			systemStateMonitoring(); // start connection monitoring
		} else {
			showLoaderModeInfo();        // set description
		}

		echo('image loading...');
		imageLoader(imageList, function () {
			echo('ready', 'imageLoader');                    // images has been loaded
			module.mainPage.Show(true);                      // display main page
			module.mainPage.portalList.Activate(true, true); // set focus
			// set page keyHandler
			module.mainPage.EventHandler = function ( event ) {
				echo('mainPage.EventHandler =>' + event.code);
				switch ( event.code ) {
					case KEYS.EXIT:
						break;
					case KEYS.SET:
						// load server settings page (if allowed)
						if ( RULES['page404/allowSystemSettings'] && app.isItErrorPage || RULES['portalsLoader/allowSystemSettings'] && !app.isItErrorPage ) {
							gSTB.StartLocalCfg();
						}
						break;
					case KEYS.POWER:
						module.standByMode();
						break;
					default:
						module.mainPage.portalList.EventHandler(event); // use scroll list keyHandler
				}
			};

			// check if we should show "this url was blocked" modal message
			if ( app.isItBlocked ) {
				module.mainPage.modalDenied.Show(true, true);
			}

			if ( accessControl.state && accessControl.data.events.loader ) {
				window.setTimeout(function () {
					accessControl.showLoginForm(null, null, true);
				}, 0);
			}
		});
	};


	/**
	 * Fill and show fast loader page
	 * @param {Object} envVars environment variables
	 * @param {Object} portalsData loading portal data from file
	 * @param {Object} dataFromDHPC data from DHPC
	 */
	module.showFastLoadPage = function ( envVars, portalsData, dataFromDHPC ) {
		echo('FastLoad');

		var correctPortalURL,
			imageList = ['bg2.jpg', 'loading.png'].map(function ( image ) {
				return PATH_IMG_SYSTEM + 'loader/' + image;
			});

		// set fast loading screen text
		document.body.querySelector('.fastLoad .container .title ').innerHTML = _('Loading portal...');
		document.body.querySelector('.fastLoad .container .second').innerHTML = RULES['portalsLoader/useExtPortalsPage'] ? _('Press MENU to load portal selection screen') : '';
		echo('image loading...');
		imageLoader(imageList, function () {
			echo('images has been loaded', 'imageLoader');
			// get right portal url
			if ( portalsData.enable ) {   // multiportal mode: we should use default portal
				correctPortalURL = Number(portalsData.def) ? portalsData.portals[portalsData.def - 1].url : PATH_ROOT + 'services.html';
			} else {                      // classic mode: we should check only portal1 and portal2
				correctPortalURL = envVars.portal1 || envVars.portal2;
			}
			if ( dataFromDHPC.enable && dataFromDHPC.url ) {      // DHCP mode
				correctPortalURL = dataFromDHPC.url;
			}
			module.fastLoadPage.Show(true); // display fast load page
			// set timeout for default fast loading condition
			if ( accessControl.state && accessControl.data.events.loader ) {
				window.setTimeout(function () {
					accessControl.showLoginForm(function () {
						app.view.fastLoadTimer = setTimeout(function () {
							module.fastLoadPage.Show(false); // hide page
							app.loadPortal(correctPortalURL);
						}, portalsData.enable ? portalsData.time * 1000 || 3000 : 3000);
					}, null, true);
				}, 0);
			} else {
				app.view.fastLoadTimer = setTimeout(function () {
					module.fastLoadPage.Show(false); // hide page
					app.loadPortal(correctPortalURL);
				}, portalsData.enable ? portalsData.time * 1000 || 3000 : 3000);
			}


			module.fastLoadPage.EventHandler = function ( event ) {
				echo('fastLoadPage.EventHandler =>' + event.code);
				switch ( event.code ) {
					case KEYS.OK:
						// stop fast load page timeout and show (or load) another page
						if ( app.view.fastLoadTimer ) {clearTimeout(app.view.fastLoadTimer);}
						// hide current and load new page
						module.fastLoadPage.Show(false);
						app.loadPortal(correctPortalURL);
						break;
					case KEYS.POWER:
						module.standByMode();
						break;
					case KEYS.MENU:
						if ( RULES['portalsLoader/useExtPortalsPage'] !== false ) {
							// stop fast load page timeout and show main page
							if ( app.view.fastLoadTimer ) {clearTimeout(app.view.fastLoadTimer);}
							module.fastLoadPage.Show(false); // hide fast load page
							module.showMainPage(portalsData, envVars); // fill and show main portals page
						}
						break;
				}
			};
		});
	};


	/**
	 * Fill and show warning page (its purpose to tell user about NAND storage problems)
	 *
	 * @param {Object} callback will be called in 30 seconds or if user press "continue" button
	 */
	module.showWarningPage = function ( callback ) {
		module.warningPage = new CPage();
		module.warningPage.name = 'warningPage';
		module.warningPage.Init(document.body.children[2]);

		var imageList = ['bg2.jpg'].map(function ( image ) { return PATH_IMG_SYSTEM + 'loader/' + image; });

		echo('image loading...');
		imageLoader(imageList, function () {
			var modal,
				timeLeft = 20;

			module.warningPage.Show(true); // display fast load page

			modal = new CModalBox(module.warningPage);
			modal.bpanel = new CButtonPanel();
			modal.bpanel.Init(global.CMODAL_IMG_PATH);
			modal.bpanel.btnExit = modal.bpanel.Add(KEYS.OK, 'ok.png', _('Continue') + ' (20)', function () {
				window.clearInterval(app.view.warningPageTimer);
				module.warningPage.Show(false); // hide page
				callback();
			});
			modal.SetHeader(_('Warning!'));
			modal.SetContent([
				element('div', {}, _('The device is loaded in fault-protection mode.')),
				element('div', {}, _('We recommend to update the software.'))
			]);
			modal.SetFooter(modal.bpanel.handle);
			modal.EventHandler = function ( event ) {
				if ( event.code === KEYS.OK ) {
					window.clearInterval(app.view.warningPageTimer);
					module.warningPage.Show(false); // hide page
					callback();
				}
			};
			modal.Init();
			modal.Show(true, true);

			// set timeout for default fast loading condition
			app.view.warningPageTimer = setInterval(function () {
				timeLeft--;
				if ( timeLeft > 0 ) {
					modal.bpanel.btnExit.$name.innerHTML = _('Continue') + ' (' + timeLeft + ')';
				} else {
					window.clearInterval(app.view.warningPageTimer);
					module.warningPage.Show(false); // hide page
					callback();
				}
			}, 1000);
		});
	};


	/**
	 *  set portals loader style and content
	 */
	function showLoaderModeInfo () {
		// set info
		var infoElement = module.mainPage.handleInner.querySelector('.header .info');
		infoElement.innerHTML = _('Select a portal for loading');
		// apply portals loader style
		infoElement = module.mainPage.handleInner.querySelector('.content');
		infoElement.className = infoElement.className + ' loader';
	}


	/**
	 *  set 404 page style and content
	 */
	function showErrorModeInfo () {
		var infoData = [],
			infoElement, answerOne, answerTwo, answerThree, infoBlock, errorClass;

		// set header description
		infoElement = module.mainPage.handleInner.querySelector('.header .info');
		infoElement.innerHTML = _('Page loading error');
		infoElement = module.mainPage.handleInner.querySelector('.content .infoList');

		// Get internet status
		infoBlock = element('div', {className: 'infoBlock'});
		elchild(infoBlock, [
			element('div', {className: 'title'}, [
				element('div', {className: 'internetIcon'}),
				element('div', {}, _('Internet: ')),
				element('span', {className: '', id: 'internet'}, _('Enabled'))
			])
		]);
		infoData.push(infoBlock);

		// Get Ethernet status
		infoBlock = element('div', {className: 'infoBlock'});
		answerOne = gSTB.RDir('IPAddress');      // Get IP
		answerTwo = gSTB.GetDeviceMacAddress();  // Get MAC
		answerThree = gSTB.GetLanLinkStatus();   // Get link
		errorClass = answerTwo ? 'error' : '';
		answerThree = answerThree ? _('Enabled') : _('Not connected');
		elchild(infoBlock, [
			element('hr', {}),
			element('div', {className: 'title'}, [
				element('div', {className: 'ethernetIcon'}),
				element('div', {}, _('Ethernet: ')),
				element('span', {className: answerThree ? '' : errorClass, id: 'ethernet'}, answerThree)
			]),
			element('div', {}, [_('IP: '), element('span', {
				className: answerOne ? '' : errorClass,
				id: 'ethIP'
			}, answerOne || _('Not available'))]),
			element('div', {}, [_('MAC: '), element('span', {className: answerTwo ? '' : errorClass}, answerTwo || _('Not available'))])
		]);
		infoData.push(infoBlock);

		// Get wif - status
		infoBlock = element('div', {className: 'infoBlock'});
		answerOne = gSTB.RDir('WiFi_ip');        // Get IP
		answerTwo = gSTB.GetNetworkWifiMac();    // Get MAC
		answerThree = gSTB.GetWifiLinkStatus();  // Get link
		errorClass = answerTwo ? 'error' : 'noDevice';
		answerThree = answerThree ? _('Enabled') : _('Not connected');
		elchild(infoBlock, [
			element('hr', {}),
			element('div', {className: 'title'}, [
				element('div', {className: 'wifiIcon'}),
				element('div', {}, _('Wi-Fi: ')),
				element('span', {className: answerThree ? '' : errorClass, id: 'wifi'}, answerThree)
			]),
			element('div', {}, [_('IP: '), element('span', {
				className: answerOne ? '' : errorClass,
				id: 'wifiIP'
			}, answerOne || _('Not available'))]),
			element('div', {}, [_('MAC: '), element('span', {
				className: answerTwo ? '' : errorClass,
				id: 'wifiMAC'
			}, answerTwo || _('Not available'))])
		]);
		infoData.push(infoBlock);

		// Get device information
		answerOne = gSTB.GetDeviceModelExt();			 // Get model
		answerTwo = gSTB.GetDeviceImageDesc();          // Get image description
		infoBlock = element('div', {className: 'infoBlock'}, [
			element('hr', {}),
			element('div', {}, [_('Model: '), element('span', {className: 'devInf'}, answerOne)]),
			element('div', {}, [_('Version: '), element('span', {className: 'devInf'}, answerTwo)])
		]);
		infoData.push(infoBlock);

		elchild(infoElement, infoData);// add data to page
		infoElement.style.display = 'block';	// show 404 info block
		// apply 404 page style
		infoElement = module.mainPage.handleInner.querySelector('.content');
		infoElement.className = infoElement.className + ' page404';
		infoElement = module.mainPage.handleInner.querySelector('.header .info');
		infoElement.className = infoElement.className + ' page404';
		elchild(infoElement, element('span', {}, _('Please check the connection and the page URL')));

		// Get internet state
		sendPingRequest();
	}


	/**
	 * Set special item in list
	 * @param {Object} data portals list
	 * @returns {Object} data modified portal list with new items
	 */
	function setServiceItems ( data ) {
		var arr                = [],
			serviceItemsNumber = 0,
			hasServSetItem     = false;

		// set 'try again' as first item (but don't show it for blocked urls)
		if ( app.isItErrorPage && app.badUrl && !app.isItBlocked ) {
			arr.push({name: _('Try again'), url: app.badUrl, enable: true});
			serviceItemsNumber++;
		}
		// Set inner portal as next item (if allowed)
		if ( RULES.allowInnerPortal ) {
			arr.push({name: _('Embedded portal'), url: PATH_ROOT + 'services.html', enable: true, servItem: true});
			serviceItemsNumber++;
		}
		// portals
		(data.portals || []).forEach(function ( item ) { arr.push(item); });
		// Set service menu as next item (if allowed)
		if ( RULES['page404/allowSystemSettings'] && app.isItErrorPage || RULES['portalsLoader/allowSystemSettings'] && !app.isItErrorPage ) {
			arr.push({
				name: _('System settings'),
				url: PATH_SYSTEM + 'settings/index.html',
				enable: true,
				servItem: true
			});
			hasServSetItem = true;
		}
		return {arr: arr, serviceItemsNumber: serviceItemsNumber, hasServSetItem: hasServSetItem};
	}


	/**
	 * Set corresponding icon style
	 * @param {string} url current item url
	 * @param {string} name current item name
	 * @returns {string} iconStyle CSS class name for specific icon.
	 */
	function getPortalType ( url, name ) {
		var urlByParts = parseUri(url), iconClass;

		// settings page
		if ( 'file://' + urlByParts.path === PATH_SYSTEM + 'settings/index.html' ) {
			iconClass = 'settings';
		} else
		// refresh action
		if ( name === _('Try again') ) {
			iconClass = 'refresh';
		} else
		// use internet for portal loading
		if ( urlByParts.protocol === 'http' || urlByParts.protocol === 'https' ) {
			iconClass = 'internet';
		} else
		// use path 'file:///home/...page.html' or '/home/web/...page.html' or '/media/...page.html'
		if ( urlByParts.protocol.indexOf('file') !== -1 || urlByParts.path.indexOf(PATH_ROOT) !== -1 || urlByParts.path.indexOf(PATH_MEDIA) !== -1 ) {
			iconClass = 'home';
		} else {
			iconClass = 'local'; // use local network for loading
		}
		return iconClass;
	}


	configuration.url = {
		// set of ping address
		// randomized on STB start and then use one by one in case of any problems
		ping: [
			'http://echo-01.infomir.com/',
			'http://echo-02.infomir.com/',
			'http://echo-03.infomir.com/',
			'http://echo-04.infomir.com/'
		].shuffle(),
		pingAttempts: 3
	};

	/**
	 * Periodically check online status.
	 * List of address is in the config.
	 */
	function sendPingRequest () {
		// there are some addresses
		if ( configuration.url.ping.length > 0 ) {
			// send
			ajax('get', configuration.url.ping[sendPingRequest.linkIndex] + '?time=' + Date.now(), function ( data, status ) {
				var state       = status > 0 && data === 'ok',
					infoElement = document.getElementById('internet'); // display

				infoElement.className = (state ? '' : 'error');
				infoElement.innerHTML = (state ? _('Enabled') : _('Not available'));

				if ( !state ) {
					// try next address
					sendPingRequest.linkIndex = ++sendPingRequest.linkIndex % configuration.url.ping.length;
					// check limit
					if ( ++sendPingRequest.errorCount >= configuration.url.pingAttempts ) {
						// stop trying
						sendPingRequest.errorCount = 0;
					} else {
						sendPingRequest();
					}
				} else {
					sendPingRequest.errorCount = 0;
				}
			});
		}
	}

	sendPingRequest.errorCount = 0;
	// current active ping address position
	sendPingRequest.linkIndex = 0;


	/***
	 *  display wifi and lan connection, MAC, IP and internet connection status at information block.
	 */
	function systemStateMonitoring () {
		var infoBlock = app.view.mainPage.handleInner.querySelector('.body .content .infoList');
		var oldInf = {
			ethernetState: infoBlock.querySelector('#ethernet'),
			ethIP: infoBlock.querySelector('#ethIP'),
			wifiState: infoBlock.querySelector('#wifi'),
			wifiIP: infoBlock.querySelector('#wifiIP'),
			wifiMAC: infoBlock.querySelector('#wifiMAC')
		};

		app.view.systemMonitoringTimer = setInterval(function () {
			var newInf = {
				ethernetState: gSTB.GetLanLinkStatus(),
				ethIP: gSTB.RDir('IPAddress'),
				wifiState: gSTB.GetWifiLinkStatus(),
				wifiIP: gSTB.RDir('WiFi_ip'),
				wifiMAC: gSTB.GetNetworkWifiMac()
			};
			echo(newInf, 'newInf');

			// Ethernet state
			if ( newInf.ethernetState !== (oldInf.ethernetState.className !== 'error') ) {
				oldInf.ethernetState.className = newInf.ethernetState ? '' : 'error';
				oldInf.ethernetState.innerHTML = newInf.ethernetState ? _('Enabled') : _('Not connected');
			}
			if ( !!newInf.ethIP !== (oldInf.ethIP.className !== 'error') ) {
				oldInf.ethIP.className = !!newInf.ethIP ? '' : 'error';
				oldInf.ethIP.innerHTML = !!newInf.ethIP ? newInf.ethIP : _('Not available');
			}

			// WIFI state
			if ( newInf.wifiMAC ) {
				if ( newInf.wifiState !== (oldInf.wifiState.className !== 'error' && oldInf.wifiState.className !== 'noDevice') ) {
					oldInf.wifiState.className = newInf.wifiState ? '' : 'error';
					oldInf.wifiState.innerHTML = newInf.wifiState ? _('Enabled') : _('Disabled');
				}
				if ( !!newInf.wifiIP !== (oldInf.wifiIP.className !== 'error' && oldInf.wifiIP.className !== 'noDevice'  ) ) {
					oldInf.wifiIP.className = !!newInf.wifiIP ? '' : 'error';
					oldInf.wifiIP.innerHTML = !!newInf.wifiIP ? newInf.wifiIP : _('Not available');
				}
				if ( oldInf.wifiMAC.className === 'error' || oldInf.wifiMAC.className === 'noDevice' ) {
					oldInf.wifiMAC.className = '';
					oldInf.wifiMAC.innerHTML = newInf.wifiMAC;
				}
			} else {
				// no device
				if ( oldInf.wifiMAC.className !== 'noDevice' ) {
					oldInf.wifiState.className = 'noDevice';
					oldInf.wifiState.innerHTML = _('Disabled');
					oldInf.wifiMAC.className = 'noDevice';
					oldInf.wifiMAC.innerHTML = _('Not available');
					oldInf.wifiIP.className = 'noDevice';
					oldInf.wifiIP.innerHTML = _('Not available');
				}
			}

			// get internet connection
			sendPingRequest();
		}, 5000);

	}

	// export
	return module;
})(window);
