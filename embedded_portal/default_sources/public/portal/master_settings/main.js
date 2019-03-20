'use strict';

/* jshint unused:false */

var MasterSettings = new CPage(),
	currentLanguage = null,
	newLanguage = null,
	headerDiv = null,
	mainDiv = null,
	footerDiv = null,
	masterSetGoogleMap = null,
	wepFlag = null,
	remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

MasterSettings.onInit = function () {
	gSTB.EnableVKButton(true);
	headerDiv = document.getElementById('pageMasterSettings_header');
	mainDiv = document.getElementById('pageMasterSettings_main');
	footerDiv = document.getElementById('pageMasterSettings_footer');
};

MasterSettings.EventHandler = function ( e ) {
	var ec = e.code;

	if ( buttonDisable ) {
		e.preventDefault();
		return;
	}

	switch ( ec ) {
		case KEYS.BACK:
			break;
		case 9:
			e.preventDefault();
			break;
		case KEYS.OK:
			pressingOkButton(e);
			break;
		case KEYS.EXIT:
			pressingExitButton();
			break;
		case KEYS.UP:
			switch ( masterSettingsScreen ) {
				case 1:
					MasterSettings.LanguagesScrollList.EventHandler(e);
					break;
				case 6:
					if ( focusElement === -1 ) {
						break;
					}
					e.preventDefault();
					if ( focusElement > 0 ) {
						if ( focusElement < 5 ) {
							navigElements[focusElement].className = 'item navig_element';
							focusElement--;
							navigElements[focusElement].className = 'item_focus navig_element';
						}
						else {
							focusElement = navigElements.length - 1;
							navigElements[focusElement].className = 'item_focus navig_element';
						}
					}
					break;
				case 7:
					MasterSettings.TimeZoneScrollList.EventHandler(e);
					break;
				case 52:
					MasterSettings.WifiScrollList.EventHandler(e);
					break;
				case 522:
					if ( focusElement > 0 ) {
						focusElement--;
						navigElements[focusElement].focus();
					}
					e.preventDefault();
					break;
			}
			break;
		case KEYS.DOWN:
			switch ( masterSettingsScreen ) {
				case 1:
					MasterSettings.LanguagesScrollList.EventHandler(e);
					break;
				case 6:
					e.preventDefault();
					if ( focusElement === -1 ) {
						break;
					}
					if ( focusElement < 4 ) {
						if ( focusElement < navigElements.length ) {
							navigElements[focusElement].className = 'item navig_element';
							focusElement++;
							navigElements[focusElement].className = 'item_focus navig_element';
						}
						else {
							navigElements[focusElement].className = 'item navig_element';
							focusElement = 5;
						}
					}
					else if ( focusElement !== 5 ) {
						navigElements[focusElement].className = 'item navig_element';
						focusElement = 5;
					}
					break;
				case 7:
					MasterSettings.TimeZoneScrollList.EventHandler(e);
					break;
				case 52:
					MasterSettings.WifiScrollList.EventHandler(e);
					break;
				case 522:
					if ( focusElement < navigElements.length - 1 ) {
						focusElement++;
						navigElements[focusElement].focus();
					}
					e.preventDefault();
					break;
			}
			break;
		case KEYS.LEFT:
			switch ( masterSettingsScreen ) {
				case 1:
					MasterSettings.LanguagesScrollList.EventHandler(e);
					break;
				case 2:
				case 3:
				case 4:
					if ( focusElement > 0 ) {
						navigElements[focusElement].className = 'item navig_element';
						focusElement--;
						navigElements[focusElement].className = 'item_focus navig_element';
					}
					break;
				case 52:
					MasterSettings.WifiScrollList.EventHandler(e);
					break;
				case 7:
					MasterSettings.TimeZoneScrollList.EventHandler(e);
					break;
			}
			break;
		case KEYS.RIGHT:
			switch ( masterSettingsScreen ) {
				case 1:
					MasterSettings.LanguagesScrollList.EventHandler(e);
					break;
				case 2:
				case 3:
				case 4:
					if ( focusElement < navigElements.length - 1 ) {
						navigElements[focusElement].className = 'item navig_element';
						focusElement++;
						navigElements[focusElement].className = 'item_focus navig_element';
					}
					break;
				case 52:
					MasterSettings.WifiScrollList.EventHandler(e);
					break;
				case 7:
					MasterSettings.TimeZoneScrollList.EventHandler(e);
					break;
			}
			break;
		case KEYS.F1:
			pressingF1Button();
			break;
		case KEYS.F4:
			pressingF4Button();
			break;
		case KEYS.REFRESH:
			pressingRefreshButton();
			break;
		case KEYS.PAGE_UP:
			switch ( masterSettingsScreen ) {
				case 1:
					MasterSettings.LanguagesScrollList.EventHandler(e);
					break;
				case 52:
					MasterSettings.WifiScrollList.EventHandler(e);
					break;
				case 7:
					MasterSettings.TimeZoneScrollList.EventHandler(e);
					break;
			}
			break;
		case KEYS.PAGE_DOWN:
			switch ( masterSettingsScreen ) {
				case 1:
					MasterSettings.LanguagesScrollList.EventHandler(e);
					break;
				case 52:
					MasterSettings.WifiScrollList.EventHandler(e);
					break;
				case 7:
					MasterSettings.TimeZoneScrollList.EventHandler(e);
					break;
			}
			break;
		case KEYS.SET:
		case KEYS.APP:
		case KEYS.TV:
			break;
	}
};

var weatherObj = {
	mapCanvas: null,
	googleMap: null,
	googleMapMarker: null,
	getLocationXHR: null,
	getLocalityXHR: null,

	getSuggestedList: function ( query ) {
		var self = this;

		if ( this.getLocationXHR ) {
			this.getLocationXHR.abort();
		}

		if ( this.getLocalityXHR ) {
			this.getLocalityXHR.abort();
		}

		document.getElementById('weatherOkButton').style.display = 'none';
		if ( query.length > 0 ) {
			ajax('GET', as.gSuggestsUrl + query + '&hl=' + newLanguage, function ( suggestedList ) {
				self.setSuggestedList(suggestedList, query);
			}, null, 'json');
		} else {
			document.getElementById('weather_suggest').style.display = 'none';
		}
	},
	setSuggestedList: function ( suggestedList, query ) {
		if ( query.length > 0 ) {
			var d = document.getElementById('weather_suggest');
			d.innerHTML = '';
			if ( suggestedList.suggestion ) {
				var html = '';
				for ( var i = 0; i < suggestedList.suggestion.length && i < 5; i++ ) {
					html += '<div class="item navig_element">' + suggestedList.suggestion[i].query + '</div>';
				}
				d.innerHTML = html;
				d.style.display = 'block';
				navigElements = document.getElementById('pageMasterSettings').getElementsByClassName('navig_element');
				settingUpNavigationElement();
				focusElement = 5;
			} else {
				d.style.display = 'none';
				focusElement = -1;
			}
		} else {
			document.getElementById('weather_suggest').style.display = 'none';
		}
	},
	getLocation: function ( callback ) {
		var self = this;
		this.getLocationXHR = ajax('GET', 'http://weather.infomir.com.ua/getGeo.php', function ( coordinates, status ) {
			if ( status === 200 ) {
				self.getLocality(coordinates, callback, weatherObj.getWeatherData);
				self.getTimeZone(coordinates);
			}
		}, null, 'json');
	},
	getLocality: function ( coordinates, callback, getWeatherData ) {
		var locality = null;
		this.getLocalityXHR = ajax('GET', 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + coordinates.data.lat + ',' + coordinates.data.lon + '&language=' + newLanguage, function ( location, status ) {
			if ( status === 200 ) {
				for ( var i = 0; i < location.results.length; i++ ) {
					for ( var j = 0; j < location.results[i].types.length; j++ ) {
						switch ( location.results[i].types[j] ) {
							case 'locality':
								locality = location.results[i].formatted_address;
								break;
							case 'administrative_area_level_1':
								locality = location.results[i].formatted_address;
								break;
							case 'administrative_area_level_2':
								locality = location.results[i].formatted_address;
								break;
							case 'country':
								locality = location.results[i].formatted_address;
								break;
						}
					}
					if ( locality !== null ) {
						break;
					}
				}
			}
			if ( locality !== null && masterSettingsScreen === 6 ) {
				document.getElementById('weather_input').value = locality;
				document.getElementById('weather_input').select();
				if ( getWeatherData ) {
					getWeatherData(locality);
				}
			}
			callback();
		}, null, 'json');
	},
	getTimeZone: function ( coordinates ) {
		ajax('GET', 'https://maps.googleapis.com/maps/api/timezone/json?location=' + coordinates.data.lat + ',' + coordinates.data.lon + '&timestamp=' + Math.round(new Date().getTime() / 1000) + '&language=' + newLanguage, function ( timeZoneData, status ) {
			if ( status === 200 ) {
				timeZoneId = timeZoneData.timeZoneId;
			}
		}, null, 'json');
	},
	getWeatherData: function ( locality ) {
		document.getElementById('weather_suggest').style.display = 'none';
		buttonDisable = true;
		ajax('GET', 'http://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(locality), function ( data, status ) {
			if ( status === 200 ) {
				if ( data.status === 'OK' && data.results && data.results.length > 0 ) {

					var mapOptions = {
						zoom: 10,
						center: new google.maps.LatLng(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng),
						disableDefaultUI: true
					};

					masterSetGoogleMap.BuildMap(mapOptions, true, false);

					MasterSettings.temp_geoweather_data = JSON.stringify({
						lat: Math.floor(data.results[0].geometry.location.lat * 100) / 100,
						lon: Math.floor(data.results[0].geometry.location.lng * 100) / 100
					});
					document.getElementById('weatherOkButton').style.display = 'block';
				}
			}
		}, null, 'json');
		masterToWrite[1] = '"weather_place":"' + base64Encode(locality) + '"';
		rebootDevice = true;
		gSTB.HideVirtualKeyboard();
		setTimeout(function () {
			buttonDisable = false;
		}, 1000);
		stbWindowMgr.SetVirtualKeyboardCoord('none');
	}
};


var initPageMasterSettings = {
	screen1: function () {
		mainDiv.className = 'screen1';
		headerDiv.innerHTML = '<div class="title">' + _('Welcome') + '</div>';
		mainDiv.innerHTML = '<div class="title">' + _('Select language') + '</div><div class="irda"></div><div id="language" class="cslist-main"></div>';

		// check whether the settings are set by default if not enable Exit button
		if ( typeof(SMB_ARRAY) !== 'undefined' && environment.settMaster ) {
			footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_navig">' + _('Use Up and Down, Left and Right buttons for selecting. Press OK button to confirm.') + '</div>';
		} else {
			footerDiv.innerHTML = '<div class="btn_navig">' + _('Use Up and Down, Left and Right buttons for selecting. Press OK button to confirm.') + '</div>';
		}

		if ( configuration.newRemoteControl ) {
			document.querySelector('.irda').style.backgroundImage = 'url(' + PATH_IMG_PUBLIC + 'master_settings/irda_new.png)';
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 1;
		languagesArr = loadLanguages();

		document.getElementById('loading').style.display = 'none';
		document.getElementById('pageMasterSettings').style.display = 'none';
		document.getElementById('pageMasterSettings').style.display = 'block';

		MasterSettings.LanguagesScrollList = new CScrollList(MasterSettings);
		MasterSettings.LanguagesScrollList.scrollMode = 1;
		MasterSettings.LanguagesScrollList.Init(MasterSettings.handle.querySelector('.cslist-main'));

		for ( var i = 0; i < languagesArr.length; i++ ) {
			var item = MasterSettings.LanguagesScrollList.Add(languagesArr[i].title, {number: i, onclick: pressingOkButton});

			if ( newLanguage ) {
				if ( languagesArr[i].value === newLanguage ) {
					MasterSettings.LanguagesScrollList.SetPosition(item, true, true);
				}
			} else {
				if ( languagesArr[i].value === currentLanguage ) {
					MasterSettings.LanguagesScrollList.SetPosition(item, true, true);
				}
			}
		}

		MasterSettings.LanguagesScrollList.Activate(true, true);
	},
	screen2: function () {
		mainDiv.className = 'screen2';
		headerDiv.innerHTML = '<div class="title">' + _('AuraHD Setup Wizard') + '</div>';
		mainDiv.innerHTML = '<div class="upper_text">' + _('Use the SetUp Wizard to edit Internet access settings, select display options and set your time zone') + '</div><div class="item_focus navig_element"><div class="ico_master"></div><div class="master">' + _('Run the Setup Wizard') + '</div></div><div class="item navig_element"><div class="ico_manual"></div><div class="manual">' + _('Set up manually later') + '</div></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_navig">' + _('Use Up and Down, Left and Right buttons for selecting. Press OK button to confirm.') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 2;
		focusElement = 0;
		navigElements = document.getElementById('pageMasterSettings').getElementsByClassName('navig_element');
		settingUpNavigationElement();

		document.getElementById('pageMasterSettings').style.display = 'none';
		timeout[2] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
		}, 100);
	},
	screen3: function () {
		mainDiv.className = 'screen3';
		headerDiv.innerHTML = '<div class="title">' + _('Step 1: Connecting to your TV') + '</div>';
		mainDiv.innerHTML = '<div class="upper_text">' + _('For optimal display settings, specify your TV model and AuraHD connection type. Please, read the TV user guide before you do it.') + '</div><div class="item_focus navig_element"><div class="tv_sd"></div>' + _('RCA cable') + '</div><div class="item navig_element"><div class="tv_hd"></div>' + _('HDMI cable') + '</div><div class="item navig_element"><div class="tv_1080"></div>' + _('HDMI cable') + '</div><div class="bottom_text"><span class="orange">' + _('Attention:') + '</span> ' + _('For TVs with the HDMI interface, we recommend to use an HDMI cable for connecting AuraHD to maximize image quality (HD or Full HD).') + '</div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 3;
		masterToWrite[3] = '';
		focusElement = 0;
		navigElements = document.getElementById('pageMasterSettings').getElementsByClassName('navig_element');
		settingUpNavigationElement();

		document.getElementById('pageMasterSettings').style.display = 'none';
		timeout[3] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
		}, 100);
	},
	screen4: function () {
		mainDiv.className = 'screen4';
		headerDiv.innerHTML = '<div class="title">' + _('Step 2: Connecting AuraHD to LAN and/or to the Internet') + '</div>';
		mainDiv.innerHTML = '<div class="upper_text">' + _('Active AuraHD Internet connection gives you access to web resources from your TV and also makes it possible to view media files located on your computer or local network. Select the connection type:') + '</div><div class="item_focus navig_element"><div class="net_lan"></div>' + _('Wired') + '</div><div class="item navig_element"><div class="net_wifi"></div>' + _('Wireless') + '</div><div class="item navig_element"><div class="net_no"></div>' + _('Skip') + '</div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 4;
		focusElement = 0;
		navigElements = document.getElementById('pageMasterSettings').getElementsByClassName('navig_element');
		settingUpNavigationElement();

		document.getElementById('pageMasterSettings').style.display = 'none';
		timeout[4] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
		}, 100);
	},
	screen51: function ( wifi ) {
		mainDiv.className = 'screen9';
		headerDiv.innerHTML = '<div class="title">' + (wifi ? _('Step 2.3: Checking wireless network and Internet connection') : _('Step 2.1: Checking local network and Internet connection')) + '</div>';
		mainDiv.innerHTML = '<div class="connection"><div class="title">' +
			(wifi ? _('Checking wireless network') : _('Checking local network connection')) + '</div><div class="counter">1 ' + _('sec.') + '</div><div class="loader"></div></div>' +
			'<div class="connection" style="display:none;"><div class="title">' + _('Checking Internet connection') + '</div><div class="counter">0 ' + _('sec.') + '</div><div class="loader"></div></div><div class="description"></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_ok1" onclick="pressingOkButton()" style="display:none;">' +
			_('Cancel') + '</div><div class="btn_red" onclick="pressingF1Button()" style="display:none;">' + _('Information') + '</div><div class="btn_refr" onclick="pressingRefreshButton()" style="display:none;">' + _('Refresh') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 51;
		focusElement = 0;
		ethernetMonitorTime = 1;
		netMessageType = -1;

		document.getElementById('pageMasterSettings').style.display = 'none';
		setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
			if ( !wifi ) {
				setTimeout(function () {
					dhcpEhernetLoad();
				}, 350);
				wifiLoad = false;
			}
			else {
				setTimeout(function () {
					wifiEhernetMonitor();
				}, 350);
				wifiLoad = true;
			}
		}, 10);
	},
	screen511: function () {
		mainDiv.className = 'main screen7';
		headerDiv.innerHTML = '<div class="title">' + _('Information') + '</div>';
		mainDiv.innerHTML = '<div class="info"><div class="info_title">' + _('Information') + '</div><span class="info_text">' + _('To access additional/advanced settings in the Main Menu, press the SET/SETUP button on the remote control.') + '</span></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_ok1" onclick="pressingOkButton()">' + _('Close') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 511;

		document.getElementById('pageMasterSettings').style.display = 'none';
		timeout[6] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
		}, 100);
	},
	screen52: function () {
		var read = JSON.parse(gSTB.GetWifiGroups());
		mainDiv.className = 'screen5';
		headerDiv.innerHTML = '<div class="title">' + _('Step 2.1: Connecting to the Wireless LAN') + '</div>';
		mainDiv.innerHTML = '<div class="left_block block_wifi">' + _('Select LAN') + '<div class="block_text">' + _('Select preferred wireless LAN or set it up manually') + '</div></div><div class="cslist-main"></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 52;
		wifiOrTzoneArr.length = 0;

		if ( read.result !== '' ) {
			wifiOrTzoneArr = read.result;
		}

		wifiOrTzoneArr.push({
			ssid: _('Manual settings')
		});

		document.getElementById('pageMasterSettings').style.display = 'none';
		document.getElementById('pageMasterSettings').style.display = 'block';

		MasterSettings.WifiScrollList = new CScrollList(MasterSettings);
		MasterSettings.WifiScrollList.scrollMode = 1;
		MasterSettings.WifiScrollList.Init(MasterSettings.handle.querySelector('.cslist-main'));
		for ( var i = 0; i < wifiOrTzoneArr.length; i++ ) {
			MasterSettings.WifiScrollList.Add(wifiOrTzoneArr[i].ssid, {number: i, onclick: pressingOkButton});
		}
		MasterSettings.WifiScrollList.Activate(true, true);
		MasterSettings.WifiScrollList.scrollMode = 2;
	},
	screen521: function ( wep ) {
		mainDiv.className = 'screen10';
		headerDiv.innerHTML = '<div class="title">' + _('Step 2.2: Password') + '</div>';
		mainDiv.innerHTML = '<div class="forms"><div><div class="caption">' + _('Password') + ':</div><input type="password" id="wifi_pass" oninput="wiFiPasswordInput(this.value)" /></div></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_ok1" style="display: none" onclick="pressingOkButton()">' + _('Next') + '</div><div class="btn_kb" onclick="pressingKeyboardButton()">' + _('Keyboard') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 521;

		if ( wep ) {
			wepFlag = true;
		} else {
			wepFlag = false;
		}

		document.getElementById('pageMasterSettings').style.display = 'none';
		window.wifi_pass.addEventListener('keydown', function ( event ) {
			if ( event.keyCode === KEYS.EXIT ) {
				pressingExitButton();
			}
		});
		timeout[8] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
			document.getElementById('wifi_pass').focus();
		}, 100);
	},
	screen522: function () {
		mainDiv.className = 'screen11';
		headerDiv.innerHTML = '<div class="title">' + _('Step 2.2: Advanced settings') + '</div>';
		mainDiv.innerHTML = '<div class="forms"><div><div class="caption">' + _('Authentication:') + '</div><div class="sub_select"><select class="select navig_element"><option value="open">' + _('Open') + '</option><option value="shared">' + _('Shared key') + '</option><option value="wpapsk">' + _('Auto Open/Shared key') + '</option><option value="wpa2psk">WPA2 PSK</option></select></div></div>' + '<div><div class="caption">' + _('Encryption:') + '</div><div class="sub_select"><select class="select navig_element"><option value="none">' + _('Disabled') + '</option><option value="wep">WEP</option><option value="tkip">TKIP</option><option value="aes">AES</option></select></div></div>' + '<div><div class="caption">' + _('SSID (network):') + '</div><input class="navig_element" type="text" /></div>' + '<div><div class="caption">' + _('Password') + ':</div><input class="navig_element" type="password" /></div></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_ok1" onclick="pressingOkButton()">' + _('Select/Next') + '</div><div class="btn_kb" onclick="pressingKeyboardButton()">' + _('Keyboard') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 522;
		focusElement = 0;
		navigElements = document.getElementById('pageMasterSettings').getElementsByClassName('navig_element');
		settingUpNavigationElement();

		document.getElementById('pageMasterSettings').style.display = 'none';
		timeout[9] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
			navigElements[0].focus();
		}, 100);
	},
	screen6: function () {
		stbWindowMgr.SetVirtualKeyboardCoord('bottom');
		mainDiv.className = 'screen8';
		headerDiv.innerHTML = '<div class="title">' + _('Step 3: Weather forecast') + '</div>';
		mainDiv.innerHTML = '<div class="left_block block_weather">' + _('Weather forecast') + '<div class="block_text">' + _('Select your city and press OK') + '</div></div><div class="sub_suggest"><div id="weather_suggest" class="suggest" style="display:none;"></div></div><input type="text" id="weather_input" name="name" oninput="weatherObj.getSuggestedList(this.value);" />';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div>' + '<div class="btn_ok1" id="weatherOkButton" onclick="pressingOkButton()" style="display: none">' + _('Next') + '</div>' + '<div class="btn_blue" onclick="pressingF4Button()">' + _('Skip') + '</div>' + '<div class="btn_kb" id="keyboardButton" onclick="pressingKeyboardButton()">' + _('Keyboard') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 6;
		focusElement = -1;
		masterToWrite[1] = '';
		masterSetGoogleMap = new CMap(this, {
			container: document.getElementById('masterSettingsMapCanvas'),
			events: {
				onGoogleMapsApiScriptCallback: function () {
					weatherObj.getLocation(function () {
						document.getElementById('pageMasterSettings').style.display = 'block';
						document.getElementById('weather_input').focus();
						document.getElementById('weather_input').select();
					});
				},
				onGoogleMapReady: function () {
				}
			}
		});

		document.getElementById('pageMasterSettings').style.display = 'block';
		document.getElementById('weather_input').focus();

		if ( window.googleMapsApiScriptLoaded ) {
			weatherObj.getLocation(function () {
				if ( masterSettingsScreen === 6 ) {
					document.getElementById('pageMasterSettings').style.display = 'block';
					document.getElementById('weather_input').focus();
					document.getElementById('weather_input').select();
				}
			});
		} else {
			masterSetGoogleMap.LoadGoogleMapsApiScript('masterSetGoogleMap', newLanguage);
		}
	},
	screen7: function () {
		mainDiv.className = 'screen8';
		headerDiv.innerHTML = '<div class="title">' + _('Step 4: Time zone') + '</div>';
		mainDiv.innerHTML = '<div class="left_block block_time">' + _('Select your time zone') + '</div><div class="cslist-main"></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 7;

		if ( masterSetGoogleMap ) {
			elclear(masterSetGoogleMap.container);
			masterSetGoogleMap = null;
		}

		document.getElementById('pageMasterSettings').style.display = 'none';
		document.getElementById('pageMasterSettings').style.display = 'block';

		MasterSettings.TimeZoneScrollList = new CScrollList(MasterSettings);
		MasterSettings.TimeZoneScrollList.scrollMode = 1;
		MasterSettings.TimeZoneScrollList.Init(MasterSettings.handle.querySelector('.cslist-main'));
		for ( var i = 0; i < TIME_ZONES.length; i++ ) {
			var item = MasterSettings.TimeZoneScrollList.Add(TIME_ZONES[i].name || TIME_ZONES[i].id, {number: i, onclick: pressingOkButton});
			if ( TIME_ZONES[i].id === timeZoneId ) {
				MasterSettings.TimeZoneScrollList.SetPosition(item, true, true);
			}
		}
		MasterSettings.TimeZoneScrollList.Activate(true, true);
		MasterSettings.TimeZoneScrollList.scrollMode = 2;
	},
	screen8: function () {
		mainDiv.className = 'screen7';
		headerDiv.innerHTML = '<div class="title">' + _('Setup completed') + '</div>';
		mainDiv.innerHTML = '<div class="info"><div class="info_title">' + _('Thank you!') + '</div><span class="info_text">' + _('The Setup Wizard is complete. All selected settings will be stored in the device’s memory. To edit the system settings any time, press SET or SETUP on your remote control and open the Main Menu.') + '</span></div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_ok1" onclick="pressingOkButton()">' + _('Close') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		navigElements = document.getElementById('pageMasterSettings').getElementsByClassName('navig_element');

		document.getElementById('pageMasterSettings').style.display = 'none';
		timeout[2] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
		}, 100);
	},
	screen9: function () {
		mainDiv.className = 'screen9';
		headerDiv.innerHTML = '<div class="title">' + _('Terms of use') + '</div>';
		mainDiv.innerHTML = '<div class="upper_text">' + _('&nbsp;&nbsp;Dear user, please read the terms and conditions for services integrated into AuraHD  device.<br />&nbsp;&nbsp;The AuraHD network media player is directly intended for digital content playback from the Internet (media files including streaming video), LANs and removable media including flash memory connected via USB port. The manufacturer is not responsible for quality and stability of the web services integrated into the device\'s software. The manufacturer also reserves the right to make occasional changes to the device\'s software and interface without prior notice in order to modify or improve its function.<br />&nbsp;&nbsp;Services by third parties offered in the AuraHD’s menu (Online Cinema, web services) are provided \"as is\" without warranty of any kind. The manufacturer cannot guarantee accuracy, timeliness, validity, completeness, compliance with any standards and laws or supplier\'s declaration of the service characteristics. The services are transferred by third parties via networks and data transfer means beyond the control of the device’s manufacturer.<br />&nbsp;&nbsp;If you do not agree to these terms and conditions for services integrated into the AuraHD device, please stop using it and return the device to the store where it was purchased within 14 days of purchase.') + '</div>';
		footerDiv.innerHTML = '<div class="btn_exit" onclick="pressingExitButton()"></div><div class="btn_ok1" onclick="pressingOkButton()">' + _('Continue') + '</div>';

		if ( configuration.newRemoteControl ) {
			footerDiv.firstChild.style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
			footerDiv.firstChild.innerHTML = _('Exit');
		}

		masterSettingsScreen = 10;

		document.getElementById('pageMasterSettings').style.display = 'none';
		timeout[13] = setTimeout(function () {
			document.getElementById('pageMasterSettings').style.display = 'block';
		}, 100);
	}
};

function initMasterSettings () {
	currentLanguage = getCurrentLanguage();

	gSTB.EnableServiceButton(false);
	gSTB.EnableAppButton(false);
	gSTB.EnableTvButton(false);

	initPageMasterSettings.screen1();
}

function loadLanguages () {
	var lg = gSTB.RDir('tempfile read languages_utf8.txt').split('\n');
	timezone = gSTB.RDir('tempfile read timezone_list.conf').split('\n');
	var lang_arr = [];
	for ( var i = 0; i < lg.length; i++ ) {
		if ( lg[i] !== '' ) {
			var tt = lg[i].split('\"');
			var tt2 = decodeURIComponent(escape(tt[3])).split(' ');
			if ( tt[1] === 'bg' || tt[1] === 'es' || tt[1] === 'el' ) {
				lg.splice(i, 1);
				i--;
			} else {
				lang_arr[i] = {
					value: tt[1],
					title: tt2[0]
				};
			}
		}
	}
	return lang_arr;
}

function dhcpEhernetLoad () {
	gSTB.SetEnv('{"lan_noip":"","ipaddr_conf":"","dnsip":""}');
	var nt = JSON.parse(gSTB.ServiceControl('network', 'restart'));
	if ( nt.result.status.toUpperCase() === 'OK' ) {
		dhcpEhernetMonitor();
	}
	else {
		clearTimeout(masterSettingsTimer.dhcp);
	}

}

function dhcpEhernetMonitor () {
	if ( gSTB.GetLanLinkStatus() ) {
		if ( gSTB.RDir('IPAddress') && gSTB.GetNetworkNameServers() ) {
			try {
				document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[0].innerHTML = '';
				document.getElementById('pageMasterSettings_main').getElementsByClassName('connection')[1].style.display = 'block';
				document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_done';
				document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].style.display = 'block';
			} catch ( e ) {
				echo(e);
			}
			internetMonitor();
			clearTimeout(masterSettingsTimer.dhcp);
		} else {
			if ( ethernetMonitorTime >= 60 ) {
				try {
					document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].style.display = 'none';
					document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_fail';
				} catch ( e ) {
					echo(e);
				}
				internetMonitorText(0);
			} else {
				ethernetMonitorTime++;
				try {
					document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[0].innerHTML = ethernetMonitorTime + ' ' + _('sec.');
				} catch ( e ) {
					echo(e);
				}
				masterSettingsTimer.dhcp = setTimeout(dhcpEhernetMonitor, 1000);
			}
		}
	} else {
		if ( ethernetMonitorTime >= 60 ) {
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].style.display = 'none';
			document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_fail';
			internetMonitorText(0);
		} else {
			ethernetMonitorTime++;
			document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[0].innerHTML = ethernetMonitorTime + ' ' + _('sec.');
			masterSettingsTimer.dhcp = setTimeout(dhcpEhernetMonitor, 1000);
		}
	}
}

function wifiEhernetMonitor () {
	if ( gSTB.GetWifiLinkStatus() ) {
		if ( gSTB.RDir('WiFi_ip') && gSTB.GetNetworkNameServers() ) {
			internetMonitor(false, true);
			document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[0].innerHTML = '';
			document.getElementById('pageMasterSettings_main').getElementsByClassName('connection')[1].style.display = 'block';
			document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_done';
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].style.display = 'block';
		}
		else {
			if ( ethernetMonitorTime >= 60 ) {
				document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].style.display = 'none';
				document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_fail';
				internetMonitorText(0);
			} else {
				ethernetMonitorTime++;
				document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[0].innerHTML = ethernetMonitorTime + ' ' + _('sec.');
				masterSettingsTimer.dhcp = setTimeout(wifiEhernetMonitor, 1000);
			}
		}
	}
	else {
		if ( ethernetMonitorTime >= 60 ) {
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].style.display = 'none';
			document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_fail';
			internetMonitorText(0);
		} else {
			ethernetMonitorTime++;
			document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[0].innerHTML = ethernetMonitorTime + ' ' + _('sec.');
			masterSettingsTimer.dhcp = setTimeout(wifiEhernetMonitor, 1000);
		}
	}
}

function internetMonitor ( reload, wifi ) {
	netMessageType = 0;
	if ( configuration.url.ping.length > 0 ) {
		internetMonitorFlag = true;
		masterSettingsTimer.timer1 = setTimeout(function () {
			if ( internetMonitorFlag ) {
				internetMonitorFlag = false;
				pingXmlhttp.abort();
				internetMonitor(true);
			}
		}, 5000);
		pingXmlhttp = new XMLHttpRequest();
		setTimeout(function () {
			pingXmlhttp.open('GET', configuration.url.ping[sendPingRequest.linkIndex], true);
			pingXmlhttp.onreadystatechange = function () {
				if ( (pingXmlhttp.readyState === 4) && internetMonitorFlag ) {
					// any positive status - internet is available
					if ( pingXmlhttp.status ) {
						internetMonitorFlag = false;
						clearTimeout(masterSettingsTimer.timer);
						clearTimeout(masterSettingsTimer.timer1);
						clearInterval(masterSettingsTimer.interval);
						document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[1].innerHTML = '';
						document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_done';
						internetMonitorText(2, wifi);
					} else {
						internetMonitorFlag = false;
						clearTimeout(masterSettingsTimer.timer1);
						internetMonitor(true);
					}
				}
			};
			pingXmlhttp.send();
		}, 1000);

		if ( !reload ) {
			internetMonitorTimer();
		}
	} else {
		clearTimeout(masterSettingsTimer.timer);
		clearInterval(masterSettingsTimer.interval);
		document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_fail';
		internetMonitorText(1);
	}
}

function internetMonitorTimer () {
	ethernetMonitorTime = 1;
	if ( masterSettingsTimer.interval ) {
		clearInterval(masterSettingsTimer.interval);
	}
	masterSettingsTimer.interval = window.setInterval(function () {
		ethernetMonitorTime++;
		document.getElementById('pageMasterSettings_main').getElementsByClassName('counter')[1].innerHTML = ethernetMonitorTime + ' ' + _('sec.');
	}, 1000);
	if ( masterSettingsTimer.timer ) {
		clearTimeout(masterSettingsTimer.timer);
	}
	masterSettingsTimer.timer = setTimeout(function () {
		clearInterval(masterSettingsTimer.interval);
		clearTimeout(masterSettingsTimer.timer1);
		if ( internetMonitorFlag ) {
			internetMonitorFlag = false;
			pingXmlhttp.abort();
		}
		document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_fail';
		internetMonitorText(1);
	}, 60000);
}

function internetMonitorText ( a, wifi ) {
	netMessageType = a;
	switch ( a ) {
		case 0:
			document.getElementById('pageMasterSettings_main').getElementsByClassName('description')[0].innerHTML = _('Unfortunately, the Setup Wizard was unable to connect your device to LAN and Internet.<br />Please, check general connection terms:<br /> - the Ethernet cable connected to the appropriate slot of the device;<br /> - Wi-Fi status.<br />Try to connect again.');
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_red')[0].style.display = 'block';
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_refr')[0].style.display = 'block';
			netMessageType = -1;
			break;
		case 1:
			document.getElementById('pageMasterSettings_main').getElementsByClassName('description')[0].innerHTML = _('Network connection successful. No Internet connection.<br />Possibly, no access to external services.<br />Check your Internet connection status.');
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_red')[0].style.display = 'block';
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].innerHTML = _('Next');
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_refr')[0].style.display = 'block';
			break;
		case 2:
			document.getElementById('pageMasterSettings_main').getElementsByClassName('description')[0].innerHTML = wifi ? _('Wireless network connection successful. Internet connection available.') : _('Network connection successful. Internet connection available.');
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_red')[0].style.display = 'none';
			document.getElementById('pageMasterSettings_footer').getElementsByClassName('btn_ok1')[0].innerHTML = _('Next');
			break;
	}
}

function save_TVResolution () {
	var to_write = '';
	var read = JSON.parse(gSTB.GetEnv('{"varList":["tvsystem","graphicres"]}'));
	switch ( focusElement ) {
		case 0:
			if ( read.result.tvsystem === 'NTSC' ) {
				if ( read.result.graphicres !== 'tvsystem_res' ) {
					to_write = '"graphicres":"tvsystem_res"';
					rebootDevice = true;
				}
			}
			else {
				if ( read.result.tvsystem !== 'PAL' ) {
					if ( read.result.graphicres !== '720' ) {
						to_write = '"graphicres":"720","tvsystem":"PAL"';
						rebootDevice = true;
					}
					else {
						to_write = '"tvsystem":"PAL"';
						rebootDevice = true;
					}
				}
				else {
					if ( read.result.graphicres !== '720' ) {
						to_write = '"graphicres":"720"';
						rebootDevice = true;
					}
				}
			}
			break;
		case 1:
			if ( read.result.tvsystem !== '720p-50' ) {
				if ( read.result.graphicres !== '1280' ) {
					to_write = '"graphicres":"1280","tvsystem":"720p-50"';
					rebootDevice = true;
				}
				else {
					to_write = '"tvsystem":"720p-50"';
					rebootDevice = true;
				}
			}
			else {
				if ( read.result.graphicres !== '1280' ) {
					to_write = '"graphicres":"1280"';
					rebootDevice = true;
				}
			}
			break;
		case 2:
			if ( read.result.tvsystem !== '1080i-50' ) {
				if ( read.result.graphicres !== '1280' ) {
					to_write = '"graphicres":"1280","tvsystem":"1080i-50"';
					rebootDevice = true;
				}
				else {
					to_write = '"tvsystem":"1080i-50"';
					rebootDevice = true;
				}
			}
			else {
				if ( read.result.graphicres !== '1280' ) {
					to_write = '"graphicres":"1280"';
					rebootDevice = true;
				}
			}
			break;
	}
	masterToWrite[3] = to_write;
	if ( to_write !== '' ) {
		rebootDevice = true;
	}
}


function cIP ( ip ) {
	if ( ip === '' || ip === '0.0.0.0' ) {
		return false;
	}

	var test = ip.split('.');
	var pip = /^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})$/;
	if ( test.length !== 4 ){
		return false;
	}
	if ( pip.test(ip) ) {
		for ( var i = 0; i < 4; i++ ) {
			if ( parseInt(test[i], 10) < 0 || parseInt(test[i], 10) > 255 ) {
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
}

function pressingOkButton ( event ) {
	var to_save, t1, t2, i;

	switch ( masterSettingsScreen ) {
		case 1:
			masterToWrite[0] = '';
			if ( languagesArr[MasterSettings.LanguagesScrollList.Current().number].value === currentLanguage && !newLanguage ) {
				initPageMasterSettings.screen9();
			} else {
				newLanguage = languagesArr[MasterSettings.LanguagesScrollList.Current().number].value;
				environment.language = newLanguage;

				gSTB.SetInputLang(newLanguage);
				gSTB.SetEnv(JSON.stringify({language: newLanguage}));

				gettext.init({name: newLanguage, path: 'public/portal/master_settings/lang'}, function () {
					rebootDevice = true;
					initPageMasterSettings.screen9();
				});
			}

			event.preventDefault();
			break;
		case 10:
			initPageMasterSettings.screen2();
			break;
		case 2:
			switch ( focusElement ) {
				case 0:
					initPageMasterSettings.screen3();
					break;
				case 1:
					masterToWrite[1] = '';
					masterToWrite[2] = '';
					masterToWrite[3] = '';
					to_save = '{';

					for ( i = 0; i < masterToWrite.length; i++ ) {
						if ( masterToWrite[i] !== '' ) {
							to_save += masterToWrite[i] + ',';
						}
					}

					to_save += '"settMaster":"1"}';
					echo('save : ' + to_save);
					gSTB.SetEnv(to_save);

					if ( rebootDevice ) {
						gSTB.ExecAction('reboot');
					} else {
						window.location.reload(true);
					}

					break;
			}
			break;
		case 3:
			save_TVResolution();
			initPageMasterSettings.screen4();
			break;
		case 4:
			switch ( focusElement ) {
				case 0:
					masterSettingsScreen = 51;
					initPageMasterSettings.screen51();
					break;
				case 1:
					if ( gSTB.GetNetworkWifiMac() === '' ) {
						new CModalAlert(MasterSettings, _('Notice'), _('Wi-Fi adapter not connected'), _('Close'));
					} else {
						initPageMasterSettings.screen52();
					}
					break;
				case 2:
					masterSettingsScreen = 9;
					initPageMasterSettings.screen8();
					break;
			}
			break;
		case 6:
			var locality,
				weatherInput = document.getElementById('weather_input'),
				initNewScreen = false;

			if ( masterSetGoogleMap.container.style.visibility === 'visible' ) {
				masterSetGoogleMap.Visible(false);
				elclear(masterSetGoogleMap.container);
				initNewScreen = true;
				initPageMasterSettings.screen7();
			}

			if ( focusElement !== -1 && focusElement !== 5 ) {
				locality = navigElements[focusElement].textContent;
				weatherInput.value = locality;
				weatherObj.getWeatherData(locality);
				focusElement = -1;
			} else if ( !initNewScreen && document.getElementById('weatherOkButton').style.display !== 'none' ) {
				masterSetGoogleMap.Visible(true);
				document.getElementById('keyboardButton').style.display = 'none';
				weatherInput.disabled = true;
			}
			break;
		case 7:
			var ntpUrl = 'pool.ntp.org';
			var timeZoneId = TIME_ZONES[MasterSettings.TimeZoneScrollList.Current().number].id;
			masterToWrite[2] = '"timezone_conf":"' + timeZoneId + '","ntpurl":"' + ntpUrl + '"';
			rebootDevice = true;
			masterSettingsScreen = 8;
			initPageMasterSettings.screen8();
			event.preventDefault();
			break;
		case 8:
		case 9:
		case 511:
			to_save = '{';
			for ( i = 0; i < masterToWrite.length; i++ ) {
				if ( masterToWrite[i] !== '' ) {
					to_save += masterToWrite[i] + ',';
				}
			}
			to_save += '"settMaster":"1"}';
			echo('save : ' + to_save);
			gSTB.SetEnv(to_save);
			gSTB.SaveUserData('weatherSet', MasterSettings.temp_geoweather_data);
			if ( rebootDevice ) {
				gSTB.ExecAction('reboot');
			}
			else {
				window.location.reload(true);
			}
			break;
		case 51:
			switch ( netMessageType ) {
				case 0:
					internetMonitorFlag = false;
					clearTimeout(masterSettingsTimer.timer);
					clearTimeout(masterSettingsTimer.timer1);
					clearInterval(masterSettingsTimer.interval);
					document.getElementById('pageMasterSettings_main').getElementsByClassName('loader')[0].className = 'loader_fail';
					internetMonitorText(1);
					break;
				case 1:
					clearTimeout(masterSettingsTimer.timer);
					clearTimeout(masterSettingsTimer.timer1);
					clearInterval(masterSettingsTimer.interval);
					masterSettingsScreen = 9;
					initPageMasterSettings.screen8();
					break;
				case 2:
					clearTimeout(masterSettingsTimer.timer);
					clearTimeout(masterSettingsTimer.timer1);
					clearInterval(masterSettingsTimer.interval);
					initPageMasterSettings.screen6();
					break;
			}
			break;
		case 52:
			if ( MasterSettings.WifiScrollList.Current().number < wifiOrTzoneArr.length - 1 ) {
				switch ( wifiOrTzoneArr[MasterSettings.WifiScrollList.Current().number].auth ) {
					case 'WPA2':
						t1 = 'wpa2psk';
						break;
					case 'WPAAUTO':
						t1 = 'wep_auto';
						break;
					case 'WPA':
						t1 = 'wpapsk';
						break;
					default:
						t1 = 'open';
						break;
				}
				switch ( wifiOrTzoneArr[MasterSettings.WifiScrollList.Current().number].enc ) {
					case 'TKIP':
						t2 = 'tkip';
						break;
					case 'WEP':
						t2 = 'wep';
						break;
					case 'CCMP':
						t2 = 'aes';
						break;
					default:
						t2 = 'none';
						break;
				}
				if ( t2 === 'none' ) {
					wifiSave = '{"wifi_int_ip":"","wifi_ssid":"' + wifiOrTzoneArr[MasterSettings.WifiScrollList.Current().number].ssid + '","wifi_auth":"' + t1 + '","wifi_enc":"' + t2 + '","wifi_wep_key1":"","wifi_wep_key2":"","wifi_wep_key3":"","wifi_wep_key4":"","wifi_psk":""}';
					gSTB.SetEnv(wifiSave);
					gSTB.ServiceControl('wifi', 'restart');
					initPageMasterSettings.screen51(true);
					masterSettingsScreen = 51;
				} else if ( t2 === 'wep' ) {
					wifiSave = '{"wifi_int_ip":"","wifi_ssid":"' + wifiOrTzoneArr[MasterSettings.WifiScrollList.Current().number].ssid + '","wifi_auth":"' + t1 + '","wifi_enc":"' + t2 + '","wifi_psk":"",';
					gSTB.ServiceControl('wifi', 'restart');
					initPageMasterSettings.screen521('wep');
				} else {
					wifiSave = '{"wifi_int_ip":"","wifi_ssid":"' + wifiOrTzoneArr[MasterSettings.WifiScrollList.Current().number].ssid + '","wifi_auth":"' + t1 + '","wifi_enc":"' + t2 + '","wifi_wep_key1":"","wifi_wep_key2":"","wifi_wep_key3":"","wifi_wep_key4":"",';
					gSTB.ServiceControl('wifi', 'restart');
					initPageMasterSettings.screen521();
				}
			} else {
				initPageMasterSettings.screen522();
			}
			event.preventDefault();
			break;
		case 521:
			gSTB.HideVirtualKeyboard();
			var d = document.getElementById('wifi_pass');
			if ( !wepFlag ) {
				wifiSave += '"wifi_psk":"' + d.value + '"}';
			}
			else {
				wifiSave += '"wifi_wep_key1":"' + d.value + '","wifi_wep_key2":"' + d.value + '","wifi_wep_key3":"' + d.value + '","wifi_wep_key4":"' + d.value + '"}';
			}
			gSTB.SetEnv(wifiSave);
			gSTB.ServiceControl('wifi', 'restart');
			masterSettingsScreen = 51;
			initPageMasterSettings.screen51(true);
			break;
		case 522:
			if ( navigElements[focusElement].tagName !== 'SELECT' ) {
				gSTB.HideVirtualKeyboard();
				switch ( navigElements[0].value ) {
					case 'WPA2':
						t1 = 'wpa2psk';
						break;
					case 'WPAAUTO':
						t1 = 'wep_auto';
						break;
					case 'WPA':
						t1 = 'wpapsk';
						break;
					default:
						t1 = 'open';
						break;
				}
				switch ( navigElements[1].value ) {
					case 'TKIP':
						t2 = 'tkip';
						break;
					case 'WEP':
						t2 = 'wep';
						break;
					case 'CCMP':
						t2 = 'aes';
						break;
					default:
						t2 = 'none';
						break;
				}
				if ( t2 === 'none' ) {
					wifiSave = '{"wifi_int_ip":"","wifi_ssid":"' + navigElements[2].value + '","wifi_auth":"' + t1 + '","wifi_enc":"' + t2 + '","wifi_wep_key1":"","wifi_wep_key2":"","wifi_wep_key3":"","wifi_wep_key4":"","wifi_psk":""}';
					gSTB.SetEnv(wifiSave);
					gSTB.ServiceControl('wifi', 'restart');
					masterSettingsScreen = 51;
					initPageMasterSettings.screen51(true);
				}
				else if ( t2 === 'wep' ) {
					wifiSave = '{"wifi_int_ip":"","wifi_ssid":"' + navigElements[2].value + '","wifi_auth":"' + t1 + '","wifi_enc":"' + t2 + '","wifi_psk":"","wifi_wep_key1":"' + navigElements[3].value + '","wifi_wep_key2":"' + navigElements[3].value + '","wifi_wep_key3":"' + navigElements[3].value + '","wifi_wep_key4":"' + navigElements[3].value + '"}';
					gSTB.SetEnv(wifiSave);
					gSTB.ServiceControl('wifi', 'restart');
					masterSettingsScreen = 51;
					initPageMasterSettings.screen51(true);
				}
				else {
					wifiSave = '{"wifi_int_ip":"","wifi_ssid":"' + navigElements[2].value + '","wifi_auth":"' + t1 + '","wifi_enc":"' + t2 + '","wifi_wep_key1":"","wifi_wep_key2":"","wifi_wep_key3":"","wifi_wep_key4":"","wifi_psk":"' + navigElements[3].value + '"}';
					gSTB.SetEnv(wifiSave);
					gSTB.ServiceControl('wifi', 'restart');
					masterSettingsScreen = 51;
					initPageMasterSettings.screen51(true);
				}
			}
			break;
	}
}

function pressingExitButton () {
	switch ( masterSettingsScreen ) {
		case 1:
			// check whether the settings are set by default if not enable Exit button
			if ( typeof(SMB_ARRAY) !== 'undefined' && environment.settMaster ) {
				newLanguage = null;
				environment.language = currentLanguage;

				for ( var i in timeout ) {
					clearTimeout(timeout[i]);
				}

				gSTB.EnableServiceButton(true);
				gSTB.EnableAppButton(true);
				gSTB.EnableTvButton(true);

				gSTB.SetInputLang(currentLanguage);
				gSTB.SetEnv(JSON.stringify({language: currentLanguage}));

				// change from "settings" to "portal" language *.po file
				gettext.init({name: currentLanguage, path: 'public/portal/lang'},
					MasterSettings.origin.Show(true)
				);
			}
			break;
		case 8:
			masterToWrite[2] = '';
			initPageMasterSettings.screen7();
			break;
		case 9:
			initPageMasterSettings.screen4();
			break;
		case 10:
			initPageMasterSettings.screen1();
			break;
		case 51:
		case 52:
		case 511:
			internetMonitorFlag = false;
			clearInterval(masterSettingsTimer.interval);
			clearTimeout(masterSettingsTimer.timer);
			clearTimeout(masterSettingsTimer.dhcp);
			clearTimeout(masterSettingsTimer.timer1);
			initPageMasterSettings.screen4();
			break;
		case 6:
			var weatherInput = document.getElementById('weather_input');

			if ( masterSetGoogleMap.container.style.visibility === 'hidden' ) {
				gSTB.HideVirtualKeyboard();
				stbWindowMgr.SetVirtualKeyboardCoord('none');
				initPageMasterSettings.screen4();
				elclear(masterSetGoogleMap.container);
				masterSetGoogleMap = null;
				masterToWrite[1] = '';
			} else {
				masterSetGoogleMap.Visible(false);
				document.getElementById('keyboardButton').style.display = 'block';
				weatherInput.disabled = false;
			}
			break;
		case 521:
			gSTB.HideVirtualKeyboard();
			initPageMasterSettings.screen52();
			break;
		case 522:
			gSTB.HideVirtualKeyboard();
			initPageMasterSettings.screen52();
			break;
		default:
			var funct = initPageMasterSettings['screen' + (masterSettingsScreen - 1)];
			funct();
			break;
	}
}

function pressingF1Button () {
	switch ( masterSettingsScreen ) {
		case 51:
			initPageMasterSettings.screen511();
			break;
	}
}

function pressingF4Button () {
	switch ( masterSettingsScreen ) {
		case 6:
			masterSetGoogleMap.Visible(false);
			initPageMasterSettings.screen7();
			break;
	}
}

function pressingRefreshButton () {
	switch ( masterSettingsScreen ) {
		case 51:
			if ( netMessageType === 1 || (ethernetMonitorTime >= 60 && netMessageType === -1) ) {
				initPageMasterSettings.screen51(wifiLoad);
				clearInterval(masterSettingsTimer.interval);
				clearTimeout(masterSettingsTimer.timer);
				clearTimeout(masterSettingsTimer.dhcp);
				clearTimeout(masterSettingsTimer.timer1);
			}
			break;
	}
}

function pressingKeyboardButton () {
	if ( !gSTB.IsVirtualKeyboardActive() ) {
		gSTB.ShowVirtualKeyboard();
		document.getElementById('weather_input').focus();
	} else {
		gSTB.HideVirtualKeyboard();
		document.getElementById('weather_input').focus();
	}
}

function settingUpNavigationElement () {
	for ( var i = 0; i < navigElements.length; i++ ) {
		navigElements[i].elementNumber = i;
		navigElements[i].onmouseover = mouseOver;
		if ( navigElements[i].tagName !== 'INPUT' && navigElements[i].tagName !== 'SELECT' ) {
			navigElements[i].onclick = pressingOkButton;
		}
	}
}

function mouseOver ( event ) {
	switch ( masterSettingsScreen ) {
		case 6:
			if ( focusElement === 5 ) {
				focusElement = event.target.elementNumber;
				navigElements[focusElement].className = 'item_focus navig_element';
			} else {
				navigElements[focusElement].className = 'item navig_element';
				focusElement = event.target.elementNumber;
				navigElements[focusElement].className = 'item_focus navig_element';
			}
			break;
		default :
			if ( event.target.elementNumber !== undefined ) {
				navigElements[focusElement].className = 'item navig_element';
				focusElement = event.target.elementNumber;
				navigElements[focusElement].className = 'item_focus navig_element';
			} else {
				navigElements[focusElement].className = 'item navig_element';
				focusElement = event.target.parentElement.elementNumber;
				navigElements[focusElement].className = 'item_focus navig_element';
			}
			break;
	}
}

function wiFiPasswordInput ( value ) {
	if ( value === '' ) {
		document.getElementsByClassName('btn_ok1')[0].style.display = 'none';
	} else {
		document.getElementsByClassName('btn_ok1')[0].style.display = 'block';
	}
}
