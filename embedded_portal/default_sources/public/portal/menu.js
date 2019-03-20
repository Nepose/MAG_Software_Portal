'use strict';

/* jshint unused:false */

// application settings
var as = {
	main_lang: 'ru',
	default_lang: 'ru',
	image_dir: '576',
	sizes: {
		480: { cell: { w: 125, h: 96  } },
		576: { cell: { w: 125, h: 105 } },
		720: { cell: { w: 220, h: 150 } },
		1080: { cell: { w: 330, h: 220 } }
	},
	position: {
		old: { x: 0, y: 0 },
		current: { x: 0, y: 0 }
	},
	gWeatherUrlPost: '&v=2',
	itemIcoPre: PATH_IMG_PUBLIC + 'menu',
	layer: 0,
	layers: {
		BASE: 0,  // Main Menu
		WS: 1,  // WeatherSettings
		SL: 2   // saveLocation
	},
	activeSuggest: -1,
	start_weather_place: '',
	ss: ['', '', '', '', ''],
	moveSuggests: false
};

var app = {
	start: function () {
		this.fill();
		window.weather_location = new CFilterInput(this, {
			input: document.getElementById('place'),
			hint: _('Enter your location...'),
			folded: true,
			events: {
				onEvent: function ( event ) {
					switch ( event.code ) {
						case KEYS.DOWN:
							event.preventDefault();
							// only if there is some data
							if ( window.weather_location.GetValue().trim() ) {
								weather.suggestsSelect('down');
							}
							break;
						case KEYS.UP:
							event.preventDefault();
							// only if there is some data
							if ( window.weather_location.GetValue().trim() ) {
								weather.suggestsSelect('up');
							}
							break;
						case KEYS.OK:
							weather.pressOK();
							break;
					}
				},
				onChange: function () {
					weather.getSuggestsList(this.GetValue());
					weather.confirButtonActive = false;
					WeatherPage.BPanel.Hidden(WeatherPage.BPanel.confirmButton, !weather.confirButtonActive);
				},
				onUnfold: function () {
					weather.moveSuggests = true;
					weather.searchBarExit = false;
					WeatherPage.BCrumb.Show(false);
					weather.newLocation();
				},
				onFold: function () {
					WeatherPage.BCrumb.Show(true);
					window.weather_location.blur();
					document.getElementById('suggests').style.display = 'none';
					// if ( as.googleMap ) {
					// 	as.googleMap.Visible(false);
					// }
					weather.confirButtonActive = false;
					WeatherPage.BPanel.Hidden(WeatherPage.BPanel.confirmButton, !weather.confirButtonActive);
				},
				onKey: function () {
					document.getElementById('suggests').style.display = 'none';
				},
				onExit: function () {
					weather.searchBarExit = true;
					if ( weather.noSettings ) {
						gSTB.HideVirtualKeyboard();
						weather.weatherSettingsExit();
					}
				}
			}
		});
		window.weather_location.blur();
	},
	pressExit: function () {
		echo('pressExitFromPortal()');
		var multiFlag = false, data, portals;
		try { // get first multiportal mode trigger
			data = gSTB.LoadUserData('portals.json');
			multiFlag = JSON.parse(data).enable;
		} catch ( err ) {
			echo('JSON.parse(LoadUserData("portals.json")).enable; -> ERROR ->' + err);
			multiFlag = false;
		}
		try { // get second multiportal mode trigger
			data = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['portal1', 'portal2', 'use_portal_dhcp', 'portal_dhcp']}))).result;
		} catch ( err ) {
			echo('JSON.parse(gSTB.GetEnv(JSON.stringify({ varList : [portal1,portal2]}))).result; -> ERROR ->' + err);
			data = {portal1: '', portal2: '', use_portal_dhcp: '', portal_dhcp: ''};
		}
		echo('Multiportal? = ' + multiFlag + ' || (' + Boolean(data.portal1) + '&&' + Boolean(data.portal2) + ')');
		portals =  multiFlag || data.portal1 || data.portal2 || (data.use_portal_dhcp && data.portal_dhcp);
		if ( !accessControl.state && environment.accessControl ) {
			accessControl.showLogoutForm(portals);
		} else {
			if ( portals ) {
				//if ( !accessControl.data.events.portalExit && environment.accessControl || !environment.accessControl ) {
					new CModalConfirm(currCPage,
						_('Confirm'),
						_('Are you sure you want to exit portal?'),
						_('Cancel'),
						function () {},
						_('Exit'),
						function () {
							window.location = PATH_SYSTEM + 'pages/loader/index.html';
						}
					);
				//} else {
				//	accessControl.showLoginForm(function () {
				//		window.location = PATH_SYSTEM + 'pages/loader/index.html';
				//	});
				//}
			}
		}
	},
	doit: function ( i, j ) {
		if ( configuration.menu[j].script ) {
			configuration.menu[j].script();
		} else if ( configuration.menu[j].url ) {
			window.location = configuration.menu[j].url;
		}
	},
	moveit: function ( i, j ) {
		echo('moveit ' + i + ' ' + j);
		as.position.old.y = as.position.current.y;
		as.position.old.x = as.position.current.x;
		as.position.current.x = (j % configuration.desktop.x);
		as.position.current.y = (j / configuration.desktop.x - ((j / configuration.desktop.x) % 1));
		document.getElementById('cursor').style.marginLeft = as.position.current.x * as.sizes[WINDOW_HEIGHT].cell.w + 'px';
		document.getElementById('cursor').style.marginTop = as.position.current.y * as.sizes[WINDOW_HEIGHT].cell.h + 'px';
	},
	fillOne: function ( ico, name, x, y ) {
		var obj = {
			'tag': 'div',
			'attrs': {
				'class': 'box',
				'onclick': 'app.PressOK(' + y + ')',
				'onmouseover': 'app.moveit(' + x + ',' + y + ')'
			},
			'child': [
				{
					'tag': 'div',
					'attrs': {
						'class': 'icon'
					},
					'child': [
						{
							'tag': 'img',
							'attrs': {
								'alt': '',
								'src': ico
							}
						}
					]
				},
				{
					'tag': 'div',
					'attrs': {
						'class': 'label'
					},
					'child': [
						{
							'tag': 'span',
							'attrs': {
								'html': name
							}
						}
					]
				}
			]
		};
		return createHTMLTree(obj);
	},
	fill: function () {
		var i, j, doc;
		for ( i = 0; i < configuration.menu.length; i++ ) {
			document.getElementById('ground').appendChild(createHTMLTree({'tag': 'div', 'attrs': {'id': 'ground' + i, 'class': 'ground' + i}}));
			doc = document.getElementById('ground' + i);
			for ( j = 0; j < configuration.menu[i].length; j++ ) {
				doc.appendChild(this.fillOne(
							as.itemIcoPre + configuration.menu[i][j].ico,
							lang[configuration.menu[i][j].name] || configuration.menu[i][j].name,
						i, j)
				);
			}
		}

		if ( configuration.menu.length < 2 ) {
			document.getElementById('switch_desktop').style.display = 'none';
		}
	},
	switch_page: function () {
		echo('switch_page');
		if ( configuration.desktop.number === 0 ) {
			document.getElementById('ground0').className = 'ground-1';
			document.getElementById('ground1').className = 'ground0';
			configuration.desktop.number = 1;
			if ( configuration.menu[configuration.desktop.number].length - 1 < as.position.current.y * configuration.desktop.x + as.position.current.x ) {
				as.position.current.x = 0;
				as.position.current.y = 0;
			}

			fade(
				{
					show: 'arrow_left',
					hide: 'arrow_right'
				}
			);
		} else {
			document.getElementById('ground0').className = 'ground0';
			document.getElementById('ground1').className = 'ground1';
			configuration.desktop.number = 0;
			fade({show: 'arrow_right', hide: 'arrow_left'});
		}
		var class_num = as.position.current.y * configuration.desktop.x + as.position.current.x;
		if ( class_num < document.getElementById('ground' + as.cur_desktop).getElementsByClassName('box').length ) {
			var num_before = document.getElementById('ground').getElementsByClassName('box')[(as.position.old.y * configuration.desktop.x + as.position.old.x)].getElementsByClassName('icon')[0].getElementsByTagName('img')[0];
			num_before.className = '';
			document.getElementById('cursor').style.marginLeft = as.position.current.x * as.sizes[WINDOW_HEIGHT].cell.w + 'px';
			document.getElementById('cursor').style.marginTop = as.position.current.y * as.sizes[WINDOW_HEIGHT].cell.h + 'px';
			this.tt = setTimeout(
				function () {
					num_before.className = '';
					document.getElementById('ground').getElementsByClassName('box')[class_num].getElementsByClassName('icon')[0].getElementsByTagName('img')[0].className = 'active';
				},
				200
			);
		} else {
			as.position.current.y = as.position.old.y;
			as.position.current.x = as.position.old.x;
		}
	},
	move: function ( button ) {
		var class_num = as.position.current.y * configuration.desktop.x + as.position.current.x;
		switch ( button ) {
			case KEYS.RIGHT:
				if ( (class_num + 1) % configuration.desktop.x === 0 && configuration.menu.length > configuration.desktop.number + 1 ) {
					document.getElementById('ground0').className = 'ground-1';
					document.getElementById('ground1').className = 'ground0';
					configuration.desktop.number++;
					as.position.current.x = 0;
					if ( (configuration.menu[configuration.desktop.number].length < 6 && as.position.current.y > 0) || (configuration.menu[configuration.desktop.number].length < 11 && as.position.current.y > 1) ) {
						as.position.current.y = 0;
					}
					fade(
						{
							show: 'arrow_left',
							hide: 'arrow_right'
						}
					);
				} else {
					as.position.old.y = as.position.current.y;
					as.position.old.x = as.position.current.x;
					if ( as.position.current.x + 1 <= configuration.desktop.x - 1 ) {
						as.position.current.x++;
					} else {
						as.position.current.x = configuration.desktop.x - 1;
					}
				}
				break;
			case KEYS.LEFT:
				if ( configuration.desktop.number > 0 && class_num % configuration.desktop.x === 0 ) {
					document.getElementById('ground0').className = 'ground0';
					document.getElementById('ground1').className = 'ground1';
					configuration.desktop.number--;
					as.position.current.x = configuration.desktop.x - 1;

					fade({show: 'arrow_right', hide: 'arrow_left'});
				} else {
					as.position.old.y = as.position.current.y;
					as.position.old.x = as.position.current.x;
					if ( as.position.current.x - 1 >= 0 ) {
						as.position.current.x--;
					} else {
						as.position.current.x = 0;
					}
				}
				break;
			case KEYS.DOWN:
				if ( configuration.desktop.y <= as.position.current.y + 1 ) {
					break;
				} else {
					as.position.old.y = as.position.current.y;
					as.position.old.x = as.position.current.x;
					if ( as.position.current.y + 1 <= configuration.desktop.y - 1 ) {
						as.position.current.y++;
					} else {
						as.position.current.y = configuration.desktop.y - 1;
					}
				}
				break;
			case KEYS.UP:
				as.position.old.y = as.position.current.y;
				as.position.old.x = as.position.current.x;
				if ( as.position.current.y - 1 >= 0 ) {
					as.position.current.y--;
				} else {
					as.position.current.y = 0;
				}
				break;
		}
		class_num = as.position.current.y * configuration.desktop.x + as.position.current.x;
		if ( class_num < document.getElementById('ground' + configuration.desktop.number).getElementsByClassName('box').length ) {
			var num_before = document.getElementById('ground').getElementsByClassName('box')[(as.position.old.y * configuration.desktop.x + as.position.old.x)].getElementsByClassName('icon')[0].getElementsByTagName('img')[0];
			num_before.className = '';
			document.getElementById('cursor').style.marginLeft = as.position.current.x * as.sizes[WINDOW_HEIGHT].cell.w + 'px';
			document.getElementById('cursor').style.marginTop = as.position.current.y * as.sizes[WINDOW_HEIGHT].cell.h + 'px';
			this.tt = setTimeout(
				function () {
					num_before.className = '';
					document.getElementById('ground').getElementsByClassName('box')[class_num].getElementsByClassName('icon')[0].getElementsByTagName('img')[0].className = 'active';
				},
				200
			);
		} else {
			as.position.current.y = as.position.old.y;
			as.position.current.x = as.position.old.x;
		}
	},
	'press': function ( event ) {

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
		}
	},
	test_timer: 0,
	test_request: function ( url, name ) {

		if ( /http\:/.test(url) ) {
			var xhReq = new XMLHttpRequest();
			xhReq.open('HEAD', url, true);
			var self = this;
			xhReq.onreadystatechange = function () {
				if ( xhReq.readyState === 4 && xhReq.status === 200 ) {
					//if ( name === 'applications' ) {
					//	url = url + '&referrer=' + encodeURIComponent(PATH_ROOT + 'services.html');
					//}
					if ( url.indexOf('?') === -1 ) {
						url = url + '?referrer=' + encodeURIComponent(PATH_ROOT + 'services.html');
					} else {
						url = url + '&referrer=' + encodeURIComponent(PATH_ROOT + 'services.html');
					}
					window.location = url;
				}
				if ( xhReq.readyState === 4 && xhReq.status === 404 ) {
					echo('request status 404: page not found');
					clearTimeout(self.test_timer);
					new CModalHint(currCPage, lang.servicesUnavailable, 3000);
				}
			};
			xhReq.send(null);
			this.test_timer = setTimeout(function () {
				new CModalHint(currCPage, lang.servicesUnavailable, 2000);
			}, 3000);


		} else {
			//if ( name === 'onlinecinema' || name === 'Internet_services') {
			if ( url.indexOf('?') === -1 ) {
				url = url + '?referrer=' + encodeURIComponent(PATH_ROOT + 'services.html');
			} else {
				url = url + '&referrer=' + encodeURIComponent(PATH_ROOT + 'services.html');
			}
			//}
			window.location = url;
		}
	},
	PressOK: function ( id ) {
		var item, name,	data, file;
		id = id || as.position.current.x + as.position.current.y * configuration.desktop.x;
		item = configuration.menu[configuration.desktop.number][id];
		if ( accessControl.state && accessControl.data.pages[item.name] ) {
			accessControl.showLoginForm(this.PressOK);
			return false;
		}
		name = item.stat_name;
		data = {};
		file = gSTB.LoadUserData('visit_data');
		// current item
		echo(item, 'menu item');
		// there is some data
		if ( file ) {
			try {
				data = JSON.parse(file);
			} catch ( e ) {
				echo(e, 'PressOK');
				data = {};
			}
		}
		// inc stats
		data[name] = data[name] !== undefined ? 1 + data[name] : 1;
		// convert to json and save
		gSTB.SaveUserData('visit_data', JSON.stringify(data));
		// exec or redirect
		if ( typeof item.script === 'function' ) {
			item.script();
		} else if ( item.url ) {
			this.test_request(item.url, item.name);
		}
	}
};

function random ( m, n ) {
	return Math.floor(Math.random() * (n - m + 1)) + m;
}

function createHTMLTree ( obj ) {
	var tag = document.createElement(obj.tag);
	for ( var key in obj.attrs ) {
		if ( obj.attrs.hasOwnProperty(key) ) {
			if ( key !== 'html' ) {
				tag.setAttribute(key, obj.attrs[key]);
			} else {
				tag.innerHTML = obj.attrs[key];
			}
		}
	}
	if ( Array.isArray(obj.child) ) {
		obj.child.forEach(function ( item ) {
			tag.appendChild(createHTMLTree(item));
		});
	}
	return tag;
}

function init2 () {
	var  langAuioInd, i,
		sortediso639 = iso639;
	switch ( WINDOW_HEIGHT ) {
		case 480:
			as.image_dir = '576';
			break;
		case 576:
			as.image_dir = '576';
			break;
		case 720:
			as.image_dir = '720';
			break;
		case 1080:
			as.image_dir = '1080';
			break;
		default:
			as.image_dir = '576';
			break;
	}

	environment.language = environment.language.toLowerCase() || as.default_lang;
	// Set default audio lang id (iso639).
	if ( environment.lang_audiotracks === '' ) {
		if ( configuration.defaultAudioLang !== null ) {
			environment.lang_audiotracks = configuration.defaultAudioLang;
		} else {
			langAuioInd = 0;
			for ( i = 0; i < sortediso639.length; i++ ) {
				if ( sortediso639[i].code[1] === environment.language || sortediso639[i].code[2] === environment.language ) {
					langAuioInd = i;
					break;
				}
			}
			environment.lang_audiotracks = langAuioInd;
		}
		gSTB.SetEnv(JSON.stringify({lang_audiotracks: environment.lang_audiotracks}));
	}
	// Set default subtitle lang id (iso639).
	if ( environment.lang_subtitles === '' ) {
		if ( configuration.defaultSubtitleLang !== null ) {
			environment.lang_subtitles = configuration.defaultSubtitleLang;
		} else {
			langAuioInd = 0;
			for ( i = 0; i < sortediso639.length; i++ ) {
				if ( sortediso639[i].code[1] === environment.language || sortediso639[i].code[2] === environment.language ) {
					langAuioInd = i;
					break;
				}
			}
			environment.lang_subtitles = langAuioInd;
		}
		gSTB.SetEnv(JSON.stringify({lang_subtitles: environment.lang_subtitles}));
	}

	document.getElementById('face').style.background = configuration.logoImagePath ? 'url(' + configuration.logoImagePath + ') no-repeat' : 'none';

	weather.load();

	// top menu weather information gag
	var d = document.getElementById('weather_condition');
	if ( weather.set.location !== '' ) {
		d.innerHTML = '<span class="weather_text">' + _('Receiving<br>weather<br>data') + '</span>';
	} else {
		d.innerHTML = '<span class="weather_text">' + _('No<br>weather<br>settings') + '</span>';
	}

	app.start();
}

function fade () {
	document.getElementById('cur_desktop').className = '_' + configuration.desktop.number;
}


/**
 * global weather object
 * @type {CPage}
 */
var WeatherPage = new CPage();

WeatherPage.onInit = function () {
	var remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';
	this.onShow = weather.weatherSettings;
	this.$bcrumb = this.handle.querySelector('.body .header .cbcrumb');
	this.BCrumb = new CBreadCrumb();
	this.BCrumb.Init(PATH_IMG_PUBLIC, this.$bcrumb);
	this.BCrumb.SetName(_('Weather'));
	this.BCrumb.Push('/', 'ico_weather.png', '');

	this.ExitBPanel = new CButtonPanel(this);
	this.ExitBPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .exit div.cbpanel-main'));
	this.ExitBPanel.btnExit = this.ExitBPanel.Add(KEYS.EXIT, 'exit.png', configuration.newRemoteControl ? _('Exit') : '', function () {
		weather.weatherSettingsExit();
	});

	this.contentNode = WeatherPage.handle.querySelector('.content');

	this.BPanel = new CButtonPanel(this);
	this.BPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .main div.cbpanel-main'));
	this.BPanel.confirmButton = this.BPanel.Add(KEYS.OK, 'ok.png', _('Confirm'), function () {
		weather.pressOK();
	}, true);
	// this.BPanel.skipButton = this.BPanel.Add(KEYS.F1, 'f1.png', _('Skip'), function () {
	// 	WeatherPage.contentNode.style.visibility = '';
	// 	WeatherPage.BPanel.Hidden(WeatherPage.BPanel.skipButton, true);
	// 	weather.initWeatherPage(true);
	// 	weather.refreshSet(true, false, null);
	// }, true);
};

WeatherPage.onHide = function () {
	stbWindowMgr.SetVirtualKeyboardCoord('none');
};

WeatherPage.EventHandler = function ( e ) {
	if ( window.weather_location.EventHandler(e) ) {
		return;
	}

	switch ( e.code ) {
		case KEYS.F1:
			WeatherPage.BPanel.EventHandler(e);
			break;
		case KEYS.EXIT:
			weather.weatherSettingsExit();
			break;
	}
};

var weather = {
	url: 'http://weather.infomir.com.ua/',
	hash: '',
	langv: {
		'en': 1,
		'ru': 25
	},
	set: {
		location: '',
		id: '',
		lat: null,
		lon: null
	},
	data: {},
	state: 0,
	toSave: false,
	toSaveData: false,
	tempData: {
		set: {
			location: '',
			lat: null,
			lon: null
		},
		data: {}
	},
	timer: {
		run: false,
		start: function () {
			if ( this.run ) {
				this.stop();
			}
			this.run = true;
			this.id = setTimeout(function () {
				weather.timer.run = false;
				weather.getHash(weather.getData, 0);
			}, 3601000 + random(0, 300000));
		},
		id: {},
		stop: function () {
			this.run = false;
			clearTimeout(this.id);
		}
	},
	confirButtonActive: false,
	showConfirmButton: false,
	googleMapTempData: {
		set: {
			location: '',
			lat: null,
			lon: null
		},
		data: {}
	},
	searchBarExit: false,
	noSettings: false,

	interval: [15000, 60000, 120000, 600000, 1200000, 3600000], //тайминг повторных запросов
	load: function () {  //загрузка настроек погоды и получение погоды или дозапрос настроек
		//console.log('weather load');
		this.set.location = environment.weather_place ? base64Decode(environment.weather_place) : '';

		if ( this.set.location !== '' ) {
			weather.toSave = true;
			this.refreshSet(false, false, null);
			return;
		}

		var file = gSTB.LoadUserData('weatherSet');

		if ( file !== '' ) {
			this.set = JSON.parse(file);

			if ( this.set.location !== '' ) {
				this.refreshSet(false, false, null);
				return;
			}

			if ( this.set.lat && this.set.lon ) {
				setTimeout(function () {
					weather.getHash(weather.getData, 0, false);
				}, random(0, 30000));
				return;
			}

		}
	},
	refreshSet: function ( type, buildGoogleMap, locality ) {//запрос координат города
		//console.log('refreshSet');
		if ( weather.set.location !== '' || weather.googleMapTempData.set.location !== '' || weather.noSettings ) {
			try {
				var request = new XMLHttpRequest();

				if ( locality ) {
					request.open('GET', 'http://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=' + (type ? locality : weather.set.location) + '&accept-language=' + environment.language, true);
				} else {
					request.open('GET', 'http://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=' + (type ? weather.googleMapTempData.set.location : weather.set.location) + '&accept-language=' + environment.language, true);
				}

				request.onload = function () {
					var data, name;

					try {
						data = JSON.parse(request.responseText);
					} catch ( error ) {
						echo(error);
					}

					if ( data && data.length > 0 ) {
						if ( data[0].address ) {
							if ( data[0].address.city ) {
								name = data[0].address.city;
							} else if ( data[0].address.town ) {
								name = data[0].address.town;
							} else if ( data[0].address.village ) {
								name = data[0].address.village;
							} else {
								name = data[0].display_name.split(',')[0];
							}

							if ( data[0].address.county ) {
								name += ', ' + data[0].address.county;
							}
							if ( data[0].address.state ) {
								name += ', ' + data[0].address.state;
							}
							if ( data[0].address.country ) {
								name += ', ' + data[0].address.country + ' ';
							}
						} else {
							name = data[0].display_name;
						}

						if ( buildGoogleMap ) {
							weather.confirButtonActive = true;
							weather.showConfirmButton = false;
							WeatherPage.BPanel.Hidden(WeatherPage.BPanel.confirmButton, !weather.confirButtonActive);
							WeatherPage.BCrumb.SetName(name);

							WeatherPage.contentNode.style.visibility = 'hidden';

							if ( as.activeSuggest !== -1 ) {
								WeatherPage.BPanel.Hidden(WeatherPage.BPanel.confirmButton, true);
								setTimeout(function () {
									as.activeSuggest = -1;
									weather.pressOK();
									setTimeout(function () {
										weather.setDataMainPage();
									}, 500);
								}, 500);
							}
						}

						if ( type ) { //это для временных данных
							weather.googleMapTempData.set.location = name;
							weather.googleMapTempData.set.lat = Math.floor(data[0].lat * 100) / 100;
							weather.googleMapTempData.set.lon = Math.floor(data[0].lon * 100) / 100;
							weather.toSaveData = true;
							echo(weather.toSave, 'weather.toSave');
							if ( weather.toSave ) { //временные данные нужно сохранить (изменение города)
								weather.toSave = false;
								weather.set = weather.googleMapTempData.set;
								var write = JSON.stringify(weather.set);
								gSTB.SaveUserData('weatherSet', write);
								gSTB.SetEnv(JSON.stringify({weather_place: ''}));
								weather.toSaveData = false;
								type = false;
								weather.googleMapTempData.set = {};
							}
						} else {
							weather.set.location = name;
							weather.set.lat = Math.round(data[0].lat * 100) / 100;
							weather.set.lon = Math.round(data[0].lon * 100) / 100;
						}
						weather.getHash(weather.getData, 0, type);
					}
				};
				request.onerror = function () {
					weather.timer.stop();
					setTimeout(function () {
						weather.refreshSet(type, buildGoogleMap, locality);
					}, random(10000, 25000));
				};
				request.send(null);
			} catch ( e ) {
				echo(e);
			}
		} else { //по идее сюда никогда не попадаем, но пускай будет
			weather.set.id = -2;
		}
	},
	getHash: function ( callback, a, type ) { //получение хеша
		/*jshint -W069 */
		//console.log('getHash');

		ajax('get', weather.url + 'getCheck.php?id=' + environment['Image_Desc'] + '&mac=' + gSTB.GetDeviceMacAddress() + '&sn=' + gSTB.GetDeviceSerialNumber(), function ( data, status ) {
			// some data returned
			if ( status === 200 && data && data.code === 0 ) {
				weather.hash = data.data;
				callback(a, type);
			} else {
				weather.timer.stop();
				setTimeout(function () {
					weather.getHash(callback, a, type);
				}, random(10000, 25000));
			}
		}, null, 'json');
	},
	getData: function ( a, type ) { //получение погоды
		//console.log('getData');
		var ask = 'lat=' + (type ? weather.googleMapTempData.set.lat : weather.set.lat) + '&lon=' + (type ? weather.googleMapTempData.set.lon : weather.set.lon);
		var hash = gSTB.GetHashVersion1((type ? weather.googleMapTempData.set.lat : weather.set.lat) + ',' + (type ? weather.googleMapTempData.set.lon : weather.set.lon), weather.hash);
		if ( hash === 'false' ) {
			weather.timer.stop();
			setTimeout(function () {
				weather.getHash(weather.getData, a, type);
			}, 10000);
			return;
		}
		var url = weather.url + 'getData.php?' + ask + '&langid=' + weather.langv[environment.language] + '&fcode=' + a + '&hk=' + hash;
		ajax('get', url, function ( data, status ) {
			if ( status === 200 ) {
				if ( weather.toSave ) {
					type = false;
				}
				//console.log('data.code ' + data.code);
				echo(data.code, 'data.code')
				switch ( data.code ) {
					case 0:
						//console.log(' getData type ' + type)
						if ( type ) {
							weather.googleMapTempData.data = data.data;
							weather.googleMapTempData.data.current.wd = weather.degrToStr(weather.googleMapTempData.data.current.wd);
							weather.googleMapTempData.data.current.wsk = Math.round(weather.googleMapTempData.data.current.wsk / 3.6 * 100) / 100;
						} else {
							weather.data = data.data;
							weather.data.current.wd = weather.degrToStr(weather.data.current.wd);
							weather.data.current.wsk = Math.round(weather.data.current.wsk / 3.6 * 100) / 100;
							if ( !weather.timer.run ) {
								weather.timer.start();
							}
							weather.setDataMainPage();
						}
						//console.log('824 ' + window.currCPage && (currCPage === WeatherPage || currCPage.parent === WeatherPage) && (!weather.moveSuggests || type))
						if ( window.currCPage && (currCPage === WeatherPage || currCPage.parent === WeatherPage) && (!weather.moveSuggests || type) ) {
							if ( WeatherPage.loadingAlert ) {
								WeatherPage.loadingAlert.Show(false);
								document.getElementById('wsbody_today').parentNode.style.display = '';
								document.getElementById('wsbody_wlist').parentNode.style.display = '';
								document.getElementById('wsbody_today').style.display = '';
								document.getElementById('wsbody_wlist').style.display = '';
								WeatherPage.loadingAlert = null;
								weather.initWeatherPage(true);
							} else if ( WeatherPage.contentNode.style.visibility === 'hidden' ) {
								WeatherPage.contentNode.style.visibility = '';
							}
							//console.log('838 ' + !weather.moveSuggests && !weather.searchBarExit)
							if ( !weather.moveSuggests && !weather.searchBarExit ) {
								weather.initWeatherPage(type);
							}
						}
						break;
					case 1:
						if ( (a < weather.interval.length - 1 && !type) || (a < 2 && type) ) {
							if ( weather.timer.run && !type ) {
								weather.timer.stop();
							}
							setTimeout(function () {
								a++;
								weather.getHash(weather.getData, a, type);
							}, parseInt(weather.interval[a], 10) + random(-5000, 10000));
						} else if ( !weather.timer.run && !type ) {
							weather.timer.start();
						}
						break;
					case 2:
						if ( type ) {
							weather.googleMapTempData.data = data.data;
							weather.googleMapTempData.data.current.wd = weather.degrToStr(weather.googleMapTempData.data.current.wd);
							weather.googleMapTempData.data.current.ws = Math.round(weather.googleMapTempData.data.current.ws / 3.6 * 100) / 100;
						} else {
							weather.data = data.data;
							weather.data.current.wd = weather.degrToStr(weather.data.current.wd);
							weather.data.current.wsk = Math.round(weather.data.current.wsk / 3.6 * 100) / 100;
							if ( weather.timer.run ) {
								weather.timer.stop();
							}
							weather.setDataMainPage();
						}
						if ( (currCPage === WeatherPage || (currCPage && currCPage.parent === WeatherPage)) && (!weather.moveSuggests || type) ) {
							if ( !weather.moveSuggests && !weather.searchBarExit ) {
								// weather.googleMapConfirmed = false;
								weather.initWeatherPage(type);
							}
						}
						setTimeout(function () {
							a++;
							weather.getHash(weather.getData, a, type);
						}, parseInt(weather.interval[a], 10));
						break;
					case 5:
						weather.getHash(weather.getData, a, type);
						break;
				}
			} else {
				if ( a < weather.interval.length - 1 && !type || a < 2 && type ) {
					if ( weather.timer.run && !type ) {
						weather.timer.stop();
					}
					setTimeout(function () {
						a++;
						weather.getHash(weather.getData, a, type);
					}, parseInt(weather.interval[a], 10) + random(-5000, 10000));
				} else if ( !weather.timer.run && !type ) {
					weather.timer.start();
				}
			}
		}, null, 'json');
	},
	degrToStr: function ( a ) {
		if ( a < 22.5 ) {
			return lang.n + ', ';
		}
		if ( a < 67.5 ) {
			return lang.ne + ', ';
		}
		if ( a < 112.5 ) {
			return lang.e + ', ';
		}
		if ( a < 157.5 ) {
			return lang.se + ', ';
		}
		if ( a < 202.5 ) {
			return lang.s + ', ';
		}
		if ( a < 247.5 ) {
			return lang.sw + ', ';
		}
		if ( a < 292.5 ) {
			return lang.w + ', ';
		}
		if ( a < 337.5 ) {
			return lang.nw + ', ';
		}
		return lang.n + ', ';

	},
	setDataMainPage: function () {
		//console.log('setDataMainPage');
		if ( typeof weather.data === 'object' ) {
			if ( weather.data.current ) {
				var d = document.getElementById('weather_condition');
				d.className = 'id_' + (weather.data.current.day === 1 ? weather.data.current.id + '_day' : weather.data.current.id + '_night');
				var deg = environment.weather_conf === 'englishSys' ? ((weather.data.current.tcf > 0 ? '+' + weather.data.current.tcf : weather.data.current.tcf) + '&deg;F') : ((weather.data.current.tcc > 0 ? '+' + weather.data.current.tcc : weather.data.current.tcc) + '&deg;C');
				var text = '<span class="text28">' + deg + '</span><br />';
				text += '<span class="text20">' + lang.humidity + ': ' + weather.data.current.h + '%</span><br />';
				var wind = environment.weather_conf === 'englishSys' ? (weather.data.current.wsm + ' ' + lang.milesH) : (weather.data.current.wsk + ' ' + lang.ms);
				text += '<span class="text20">' + lang.wind + ': ' + weather.data.current.wd + wind + '</span>';
				d.innerHTML = text;
				d.style.display = 'block';
			}
		}
		return;
	},
	weatherSettings: function () {
		//console.log('weatherSettings');
		stbWindowMgr.SetVirtualKeyboardCoord('bottom');

		if ( weather.set.location !== '' ) {
			weather.noSettings = false;
			WeatherPage.BCrumb.Show(true);
			WeatherPage.BCrumb.SetName('');
			document.getElementById('suggests').style.display = 'none';
			weather.initWeatherPage(false);
		} else {
			weather.noSettings = true;
			window.weather_location.Fold(false);

			weather.getLocation(weather.refreshSet);
		}
	},
	initWeatherPage: function ( type ) {
		//console.log('initWeatherPage');
		if ( !type ) {
			if ( weather.googleMapTempData.set.location === weather.set.location || !weather.googleMapTempData.set.location || !weather.set.location ) {
				weather.googleMapTempData.set = weather.set;
				weather.googleMapTempData.data = weather.data;
				weather.tempData.set = weather.set;
				weather.tempData.data = weather.data;
			}
		}

		if ( type ) {
			weather.tempData.set = weather.googleMapTempData.set;
			weather.tempData.data = weather.googleMapTempData.data;
		}
		//console.log(JSON.stringify(weather.tempData.data.current));

		WeatherPage.BCrumb.SetName(weather.tempData.set.location);

		if ( weather.tempData.data.current ) {
			// use cache
			var imgList = [], wind, i, arr, date, day, time = 'day', from, deg, to, data;
			WeatherPage.contentNode.style.visibility = '';
			window.weather_location.Fold(true);
			WeatherPage.BCrumb.Show(true);
			document.getElementById('suggests').style.display = 'none';
			wind = environment.weather_conf === 'englishSys' ? (weather.tempData.data.current.wsm.toFixed(1) + ' ' + lang.milesH) : (weather.tempData.data.current.wsk.toFixed(1) + ' ' + lang.ms);
			document.getElementById('forecast_day_0_wind').innerHTML = weather.tempData.data.current.wd + wind;
			document.getElementById('forecast_day_0_hum').innerHTML = weather.tempData.data.current.h + ' %';
			for ( i = 0; i <= 3 && i < weather.tempData.data.days.length; i++ ) {
				data = weather.tempData.data.days[i];
				if ( environment.weather_conf === 'englishSys' ) {
					from = data.tlf;
					deg = 'F';
					to = data.thf;
				} else {
					deg = 'C';
					from = data.tlc;
					to = data.thc;
				}
				from = (from > 0) ? '+' + from : +from;
				to = (to > 0) ? '+' + to : to;
				arr = data.d.split('-');//12/21/2012
				date = new Date(arr[0], arr[1] - 1, arr[2]);
				day = date.getDay();
				document.getElementById('forecast_day_' + i + '_day').innerHTML = fullDaysOfWeek[day];
				document.getElementById('forecast_day_' + i + '_date').innerHTML = arr[2] + ' ' + fullMonthNames[arr[1] - 1];
				document.getElementById('forecast_day_' + i + '_from').innerHTML = from + '&deg;' + deg;
				document.getElementById('forecast_day_' + i + '_to').innerHTML = to + '&deg;' + deg;
				document.getElementById('forecast_day_' + i + '_cond').innerHTML = weatherTextById[data.id];
				// set "_night" class only for today night weather image
				if ( i === 0 && weather.tempData.data.current.day === 0 ) {
					time = 'night';
				}
				document.getElementById('forecast_day_' + i + '_img').className = 'id_' + data.id + '_' + time;
				// add img to cache list
				imgList.push('public/img/weather/' + time + '/' + data.id + '.png');
			}

			// images has been loaded
			imageLoader(imgList, function () {
				echo('ready', 'weathrImageLoader');
				// set display property to weather page
				document.getElementById('wsbody_today').parentNode.style.display = 'table-cell';
				document.getElementById('wsbody_wlist').parentNode.style.display = 'table-cell';
				document.getElementById('wsbody_today').style.display = 'table';
				document.getElementById('wsbody_wlist').style.display = 'table';
			});

			WeatherPage.handle.classList.add('initiated');
		} else {
			if ( weather.tempData.set.id === -2 ) {
				if ( currCPage === WeatherPage ) {
					setTimeout(function () {
						new CModalAlert(WeatherPage, _('Error'), lang.errorPlaceText, _('Close'));
					}, 50);
				}
			} else {
				WeatherPage.BCrumb.SetName(weather.tempData.set.location);
				window.weather_location.Fold(true, currCPage === WeatherPage);
				document.getElementById('wsbody_today').parentNode.style.display = 'none';
				document.getElementById('wsbody_wlist').parentNode.style.display = 'none';
				document.getElementById('wsbody_today').style.display = 'none';
				document.getElementById('wsbody_wlist').style.display = 'none';
				if ( currCPage === WeatherPage ) {
					setTimeout(function () {
						WeatherPage.loadingAlert = new CModalAlert(WeatherPage, '', lang.inProgress, _('Close'));
					}, 50);
				}
			}
		}
	},
	weatherSettingsExit: function () {
		if ( !window.weather_location.IsFolded() ) {
			window.weather_location.Fold(true, true);
			return;
		}
		as.activeSuggest = -1;

		window.weather_location.Fold(true, true);
		document.getElementById('wsbody_today').parentNode.style.display = 'none';
		document.getElementById('wsbody_wlist').parentNode.style.display = 'none';
		document.getElementById('wsbody_today').style.display = 'none';
		document.getElementById('wsbody_wlist').style.display = 'none';

		gSTB.HideVirtualKeyboard();

		if ( weather.confirButtonActive ) {
			weather.showConfirmButton = weather.confirButtonActive = weather.moveSuggests = false;
			WeatherPage.BPanel.Hidden(WeatherPage.BPanel.confirmButton, !weather.confirButtonActive);
		}

		if ( weather.tempData.set.location !== weather.set.location ) {
			new CModalConfirm(WeatherPage, '', lang.saveLocationText,
				lang.saveLocationNoText, function () {
					setTimeout(weather.weatherSettingsExitNo, 100);
				},
				lang.saveLocationYesText, function () {
					setTimeout(weather.weatherSettingsExitYes, 100);
				}
			);
		} else {
			this.weatherSettingsExitNo();
		}

		return;
	},
	weatherSettingsExitYes: function () {
		//console.log('weatherSettingsExitYes');
		var write;
		weather.toSave = true;
		if ( !weather.tempData.data.current ) {
			weather.set = weather.tempData.set;
			write = JSON.stringify(weather.tempData.set);
			gSTB.SetEnv(JSON.stringify({weather_place: ''}));
			gSTB.SaveUserData('weatherSet', write);
			weather.timer.stop();
		} else {
			weather.data = weather.tempData.data;
			weather.timer.stop();
			weather.timer.start();
			weather.setDataMainPage();
			if ( weather.toSaveData ) {
				weather.set = weather.tempData.set;
				write = JSON.stringify(weather.tempData.set);
				gSTB.SetEnv(JSON.stringify({weather_place: ''}));
				gSTB.SaveUserData('weatherSet', write);
			}
		}
		document.getElementById('suggests').style.display = 'none';
		window.weather_location.blur();
		WeatherPage.Show(false);
		weather.noSettings = false;
	},
	weatherSettingsExitNo: function () {
		//console.log('weatherSettingsExitNo');
		weather.toSave = false;
		weather.tempData.set.location = weather.set.location;
		if ( !weather.timer.run ) {
			weather.timer.start();
		}
		document.getElementById('suggests').style.display = 'none';
		window.weather_location.blur();
		WeatherPage.Show(false);
	},
	newLocation: function () {
		//console.log('newLocation');
		weather.toSaveData = false;
		weather.toSave = false;

		if ( this.set.id === -2 ) {
			if ( this.set.location !== '' ) {
				new CModalAlert(WeatherPage, _('Error'), lang.errorPlaceText, _('Close'));
			}
		}

		document.getElementById('suggests').style.display = 'none';
		as.activeSuggest = -1;

		for ( var i = 0; i < 5; i++ ) {
			document.getElementById('s' + i).className = '';
			document.getElementById('s' + i).innerHTML = '';
		}

		window.weather_location.SetValue('');
		window.weather_location.focus();
		gSTB.ShowVirtualKeyboard();
	},
	// send request and fill the list
	getSuggestsList: function ( query ) {
		//console.log('getSuggestsList');
		if ( weather.moveSuggests === true ) {
			if ( query.length > 0 ) {
				try {
					var request = new XMLHttpRequest();
					request.open('GET', 'http://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=' +
						environment.language + '&city=' + query, true);
					var self = weather;
					request.onreadystatechange = function () {
						if ( request.readyState === 4 && request.status === 200 ) {
							try {
								self.setSuggests(JSON.parse(request.responseText), query);
							} catch( e ) {
								echo(e, 'weather response is not valid json');
							}
						}
					};
					request.send(null);
				} catch ( e ) {
					echo(e);
				}
			}
		}
	},
	geo_types: [17 , 37 , 545, 33], // 17 - street; 37 - city; 545 - state; 33 - country
	setSuggests: function ( obj, query ) {
		//console.log('setSuggests');
		var i, j, k, $line, sugg, geo_type,
			onMouseOver = function () {
				if ( as.activeSuggest !== -1 ) {
					document.getElementById('s' + as.activeSuggest).classList.toggle('active');
				}
				as.activeSuggest = this.activeSuggest;
				document.getElementById('s' + as.activeSuggest).classList.toggle('active');
			},
			onClick = function () {
				weather.pressOK();
			};
		if ( query.length > 0 ) {
			if ( obj && obj.length > 0 ) {
				for ( i = 0; i < 5; i++ ) {
					sugg = obj[i];
					$line = document.getElementById('s' + i);
					$line.activeSuggest = i;
					$line.onmouseover = onMouseOver;
					/*$line.onmouseover = function () {
						if ( as.activeSuggest !== -1 ) {
							document.getElementById('s' + as.activeSuggest).classList.toggle('active');
						}
						as.activeSuggest = this.activeSuggest;
						document.getElementById('s' + as.activeSuggest).classList.toggle('active');
					};*/
					$line.onclick = onClick;
					/*$line.onclick = function () {
						weather.pressOK();
					};*/
					elclear($line);
					if ( sugg !== undefined ) {
						geo_type = null;
						// if ( sugg.interpretation !== undefined && sugg.interpretation.term !== undefined ) {
						// 	for ( k = 0; k < this.geo_types.length; k++ ) {
						// 		for ( j = 0; j < sugg.interpretation.term.length; j++ ) {
						// 			if ( sugg.interpretation.term[j].type === this.geo_types[k] ) {
						// 				geo_type = this.geo_types[k];
						// 				break;
						// 			}
						// 		}
						// 		if ( geo_type !== null ) {
						// 			break;
						// 		}
						// 	}
						// }
						$line.style.opacity = 1;
						if ( sugg.address ) {
							//console.log(JSON.stringify(sugg.address));
							if ( sugg.address.city ) {
								as.ss[i] = sugg.address.city;
							} else if ( sugg.address.town ) {
								as.ss[i] = sugg.address.town;
							} else if ( sugg.address.village ) {
								as.ss[i] = sugg.address.village;
							} else {
								as.ss[i] = ''
							}
							if ( sugg.address.state ) {
								as.ss[i] += ', ' + sugg.address.state;
							}
							if ( sugg.address.country ) {
								as.ss[i] += ', ' + sugg.address.country + ' ';
							}
							echo(as.ss[i]);
						} else {
							as.ss[i] = sugg.display_name;
						}
						elchild($line, [element('img', {src: PATH_IMG_PUBLIC + 'geo/abstract.png'}), element('div', {}, as.ss[i])]);
					} else {
						$line.style.opacity = 0;
						as.ss[i] = '';
					}
				}
			}
			document.getElementById('suggests').style.display = 'block';
		} else {
			document.getElementById('suggests').style.display = 'none';
			for ( i = 0; i < 5; i++ ) {
				document.getElementById('s' + i).innerHTML = '';
				as.ss[i] = '';
			}
		}
	},
	suggestsSelect: function ( direction ) {
		if ( weather.moveSuggests === true ) {
			switch ( direction ) {
				case 'down':
					switch ( as.activeSuggest ) {
						case-1:
							as.activeSuggest = 0;
							break;
						case 0:
							as.activeSuggest = 1;
							break;
						case 1:
							as.activeSuggest = 2;
							break;
						case 2:
							as.activeSuggest = 3;
							break;
						case 3:
							as.activeSuggest = 4;
							break;
					}
					break;
				case 'up':
					switch ( as.activeSuggest ) {
						case 0:
							as.activeSuggest = -1;
							break;
						case 1:
							as.activeSuggest = 0;
							break;
						case 2:
							as.activeSuggest = 1;
							break;
						case 3:
							as.activeSuggest = 2;
							break;
						case 4:
							as.activeSuggest = 3;
							break;
					}
					break;
			}
			this.suggestsАill();
		} else {
			document.getElementById('suggests').style.display = 'none';
		}
	},
	suggestsАill: function () {
		for ( var i = 0; i < 5; i++ ) {
			if ( as.activeSuggest === i ) {
				if ( document.getElementById('s' + i).style.opacity > 0 ) {
					document.getElementById('s' + i).className = 'active';
				} else {
					document.getElementById('s' + i).className = '';
					as.activeSuggest--;
					document.getElementById('s' + as.activeSuggest).className = 'active';
				}
			} else {
				document.getElementById('s' + i).className = '';
			}
		}
	},
	pressOK: function () {
		//console.log('pressOK')
		if ( weather.confirButtonActive ) {
			weather.confirButtonActive = false;
			WeatherPage.BPanel.Hidden(WeatherPage.BPanel.confirmButton, !weather.confirButtonActive);
			weather.initWeatherPage(true);
		}

		if ( as.activeSuggest !== -1 && weather.moveSuggests === true ) {
			var value = document.getElementById('s' + as.activeSuggest).lastElementChild.innerHTML;
			window.weather_location.SetValue(value, true);
			document.getElementById('suggests').style.display = 'none';

			if ( weather.googleMapTempData.set.location !== value ) {
				weather.googleMapTempData.set = {};
				weather.googleMapTempData.data = {};
				weather.googleMapTempData.set.location = value;
				weather.googleMapTempData.set.id = -1;
				weather.refreshSet(true, true, null);
			}
		}

	},
	getLocation: function ( callback ) {
		//console.log('getLocation');
		ajax('GET', 'http://weather.infomir.com.ua/getGeo.php', function ( coordinates, status ) {
			if ( status === 200 ) {
				weather.getLocality(coordinates, callback);
			}
		}, null, 'json');
	},
	getLocality: function ( coordinates, callback ) {
		//console.log('getLocality');
		var locality = null,
			language = getCurrentLanguage();

		ajax('GET', 'http://nominatim.openstreetmap.org/reverse?format=json&lat=' + coordinates.data.lat +
			'&zoom=18&addressdetails=1&lon=' + coordinates.data.lon + '&accept-language=' + language,
			function ( location, status ) {
				if ( status === 200 ) {
					if ( location.address ) {
						if ( location.address.city ) {
							locality = location.address.city;
							if ( location.address.state ) {
								locality += ', ' + location.address.state;
							}
							if ( location.address.country ) {
								locality += ', ' + location.address.country + ' ';
							}
						} else {
							locality = locality.display_name;
						}
					}
				}
				if ( locality !== null ) {
					window.weather_location.SetValue(locality, true);
					window.weather_location.select();
				}
				callback(true, true, locality);
		}, null, 'json');
	}
};
