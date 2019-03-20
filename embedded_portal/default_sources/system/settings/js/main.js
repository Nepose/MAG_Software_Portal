'use strict';

/* jshint unused:false */

var settChanges = 0,
	model = gSTB.RDir('Model'),
	currCPage,
	SettingsPage,
	globalSaveData = {},
	refreshWiFi,
	wifiOff = false,
	remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/',
	localizations = [
		_('No data')
	];

currCPage = SettingsPage = new CPage();
/**
 * Global event
 * @type {Object}
 */
var stbEvent = {
	onEvent: function () {},
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

stbEvent.bind('broadcast.storage.mount', function () {
	echo('broadcast.storage.mount in portal');
	if ( typeof currCPage.onMountAction === 'function' ) {
		currCPage.onMountAction(true);
	} else {
		// use default action
		echo('default settings USB MOUNTED action');
		UpdatePage.RefreshUsbDevices();
	}
	// show message on mount (at any time)
	setTimeout(function () {
		new CModalHint(currCPage, _('USB storage is connected'), 3000);
	}, 0);
});

stbEvent.bind('broadcast.storage.unmount', function () {
	echo('broadcast.storage.unmount in portal');
	if ( typeof currCPage.onMountAction === 'function' ) {
		currCPage.onMountAction(false);
	} else {
		// use default action
		echo('default settings USB UNMOUNTED action');
		UpdatePage.RefreshUsbDevices();
	}
});


window.onload = function () {
	// set webkit size
	window.moveTo(0, 0);


	window.resizeTo(EMULATION ? window.outerWidth : screen.width, EMULATION ? window.outerHeight : screen.height);

	// prevent default right-click menu only for releases
	window.oncontextmenu = EMULATION ? null : function () {
		return false;
	};

	// gSTB.EnableServiceButton(true);
	gSTB.EnableVKButton(true);

	// button
	var imageList = ['back.png', 'exit.png', 'f1.png', 'f3.png', 'f4.png', 'info.png', 'menu.png', 'ok.png', 'refresh.png', 'info.png', 'refresh.png'].map(function ( image ) {
		return remoteControlButtonsImagesPath + image;
	});

	// settings
	imageList = imageList.concat(['device_info.png', 'folder.png', 'folder_lan.png', 'folder_network_info.png', 'folder_refresh.png', 'folder_servers.png', 'folder_serversset.png', 'folder_settings.png', 'folder_keyboard_layout.png', 'folder_sound.png', 'folder_tv.png', 'folder_remote_control.png', 'remote_control.png', 'refresh.png', 'reset.png', 'signal1.png', 'signal2.png', 'signal3.png', 'signal4.png', 'switch.png', 'switch_act.png', 'settings.png', 'device_reset.png', 'user_clear.png', 'closed_wifi.png', 'open_wifi.png', 'priority.png'].map(function ( image ) {
		return PATH_IMG_SYSTEM + 'settings/' + image;
	}));

	// backgrounds
	imageList = imageList.concat(['bottommenu_bg.png', 'exit_wrapper_bg.png', 'topmenu_bg.png'].map(function ( image ) {
		return PATH_IMG_SYSTEM + 'backgrounds/' + image;
	}));

	imageList = imageList.concat(['bg_black_50.png'].map(function ( image ) {
		return PATH_ROOT + 'system/img/backgrounds/' + image;
	}));

	// images
	imageLoader(imageList, function () {
		gettext.init({name: mainLang}, function () {
			mainPageLoad(true);
			document.body.style.display = 'block';
		});
	});
};

SettingsPage.onInit = function () {
	this.name = 'SettingsPage';

	this.BCrumbHandler = document.querySelector('.page.main .cbcrumb');
	this.BCrumbHandler.style.display = 'block';

	this.BCrumb = new CBreadCrumb();
	this.BCrumb.Init(PATH_IMG_SYSTEM + 'settings/', this.BCrumbHandler, 10, 10);

	this.EventHandler = navigation.pressKey;

	// system settings window registration
	if ( !stbStorage.getItem(getWindowKey(WINDOWS.SYSTEM_SETTINGS)) ) {
		stbStorage.setItem(getWindowKey(WINDOWS.SYSTEM_SETTINGS), stbWebWindow.windowId());
	}

	this.ExitBPanel = new CButtonPanel(this);
	this.ExitBPanel.Init(remoteControlButtonsImagesPath, document.querySelector('.body .footer .exit div.cbpanel-main'));
	this.ExitBPanel.btnExit = this.ExitBPanel.Add(KEYS.EXIT, 'exit.png', configuration.newRemoteControl ? _('Exit') : '', function () {
		navigation.exit_press();
	});

	this.bpanel = new CButtonPanel(this);
	this.bpanel.Init(remoteControlButtonsImagesPath, document.querySelector('.body .footer .main div.cbpanel-main'));

	// buttons with handlers
	this.bpanel.AdditionalBtn = this.bpanel.Add(KEYS.F1, 'f1.png', _('More'), function () {
		navigation.f1_press();
	}, false);
	this.bpanel.VolumeUp = this.bpanel.Add(KEYS.VOLUME_UP, 'volume_plus.png', _('Up'), function () {
		navigation.changeLayoutPosition(true);
	}, false);
	this.bpanel.VolumeDown = this.bpanel.Add(KEYS.VOLUME_DOWN, 'volume_minus.png', _('Down'), function () {
		navigation.changeLayoutPosition(false);
	}, false);
	this.bpanel.SaveBtn = this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function ( code ) {
		if ( typeof navigation.elements[navigation.element].onchange === 'function' ) {
			navigation.elements[navigation.element].onchange();
		}
		var event = {code: code};
		switch ( as.page ) {
			case as.pages.UPDATE:
				break;
			case as.pages.ELEMENTS:
				navigation.save();
				break;
			case as.pages.INFO:
				event.preventDefault();
				break;
			default:
				navigation.elements[navigation.element].onclick();
				event.preventDefault();
				break;
		}
	}, false);
	this.bpanel.infoButton = this.bpanel.Add(KEYS.INFO, 'info.png', configuration.newRemoteControl ? _('Info') : '', function () {
		switch ( SettingsPage.BCrumb.Tip().iid ) {
			case 'wiredEthernet':
				new CModalShowWiredEthernetInfo(SettingsPage);
				break;
			case 'PPPoE':
				new CModalShowPPPoEInfo(SettingsPage);
				break;
			case 'wirelessWiFi':
				new CModalShowWirelessWiFiInfo(SettingsPage);
				break;
			case 'wirelessAutoDHCP':
				if ( wiFiInfoSideBar.isVisible ) {
					wiFiInfoSideBar.Show(false, false);
				} else {
					wiFiInfoSideBar.Show(true, false);
				}
				break;
			case 'bluetooth':
				btInfoSideBar.Show(!btInfoSideBar.isVisible, false);
				break;
		}
	}, false);
	this.bpanel.AddNetworkBtn = this.bpanel.Add(KEYS.F2, 'f2.png', _('Add network'), function () {
		switch ( SettingsPage.BCrumb.Tip().iid ) {
			case 'bluetooth':
				forgetBtDeviceHandler();
				break;
			default:
				wiFiAuthenticationLoad(null, true);
				break;
		}
	}, false);
	this.bpanel.GeneratePassBtn = this.bpanel.Add(KEYS.F2, 'f2.png', _('Generate keys'), function () {
		switch ( navigation.elements[1].value ) {
			case 1:
				gen64();
				break;
			case 2:
				gen128();
				break;
		}
	}, false);
	this.bpanel.RemoveNetworkBtn = this.bpanel.Add(KEYS.F4, 'f4.png', _('Remove network'), function () {
		new CModalConfirm(SettingsPage, _('Remove'), _('Do you want to remove this network?'), _('Close'), function(){}, _('Ok'), function(){wiFiDelete();});
	}, true);
	this.bpanel.btnRefresh = this.bpanel.Add(KEYS.REFRESH, 'refresh.png', _('Refresh'), refreshWiFi = function () {
		switch ( SettingsPage.BCrumb.Tip().iid ) {
			case 'wirelessAutoDHCP':
				RefheshWiFi();
				break;
			case 'networkInfoWiredEthernet':
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.btnRefresh, true);
				setTimeout(networkInfoWiredEthernetLoad, 400);
				break;
			case 'networkInfoPPPoE':
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.btnRefresh, true);
				setTimeout(networkInfoPPPoELoad, 400);
				break;
			case 'networkInfoWirelessWiFi':
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.btnRefresh, true);
				setTimeout(networkInfoWirelessWiFiLoad, 400);
				break;
			case 'bluetooth':
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.btnRefresh, true);
				setTimeout(function () {
					scanBluetoothLoad(true);
				}, 400);
				break;
		}
	}, false);

	this.Show(true);
};

SettingsPage.onShow = function () {
	var environmentData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['systemSettingsPassword']}))),
		systemSettingsPassword = environmentData.result.systemSettingsPassword,
		modal;

	if ( systemSettingsPassword ) {
		modal = new CModalPassword(this, systemSettingsPassword);

		setTimeout(function () {
			currCPage = modal;
		}, 0);
	} else {
		accessControl.init();
		window.setTimeout(function () {
			if ( accessControl.state && accessControl.data.pages.systemSettings ) {
				accessControl.showLoginForm(null, navigation.exit);
			}
		},0);
	}
};

function mainEventListener ( event ) {
	// get real key code or exit
	if ( !eventPrepare(event, false, 'mainEventListener ' + currCPage.name) ) {
		return;
	}

	if ( currCPage && typeof currCPage.EventHandler === 'function' ) {
		// stop if necessary
		if ( currCPage.EventHandler(event) ) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
	}

	switch ( event.code ) {
		case 116:
			event.preventDefault();
			event.stopPropagation();
			break;
		case 220:
			echo('\n\n\n<html><head>\n' + document.head.innerHTML + '\n</head>\n<body>\n' + document.body.innerHTML + '\n</body>\n</html>\n');
			break;
		case KEYS.POWER:
			if ( SettingsPage.BCrumb.Tip().iid !== 'updatePage' ) {
				stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || getWindowIdByName(WINDOWS.PORTALS_LOADER), 'portal.standbyMode', '');
			}
			break;
		case KEYS.WEB:
			stbWindowMgr.LoadUrl('http://www.google.ru');
			stbWindowMgr.raiseWebWindow();
			break;
	}
}

function generateTable ( arr ) {
	var d = document.getElementById(as.page_list[as.page]),
		obj = [],
		left = null,
		right = null,
		table = null,
		div = null,
		i = null;

	elclear(d);

	for ( i = 0; i < arr.length; i++ ) {
		if ( !arr[i].title && arr[i].title !== 0 && arr[i].title !== true ) {
			right = element('td', {className: 'center', colSpan: '2'}, arr[i].value);
			obj[i] = element('tr', {}, right);
			continue;
		}

		if ( !arr[i].value && arr[i].value !== 0 && arr[i].value !== true && arr[i].value !== '' ) {
			left = element('td', {className: 'info_header', colSpan: '2'}, arr[i].title);
			obj[i] = element('tr', {}, left);
			continue;
		}

		left = element('td', {className: 'left'}, arr[i].title);
		right = element('td', {className: 'right' + (arr[i].valueClassName ? ' ' + arr[i].valueClassName : '')}, arr[i].value);

		obj[i] = element('tr', {}, [left, right]);
	}

	table = element('table', {}, obj);
	div = element('div', {className: 'box'}, table);

	elchild(d, div);
	d.style.display = 'block';
	d.focus();
}

function generateElements ( arr, generate_only, no_component ) {
	var obj = [],
		inputs = [], input,
		d = element('div', {className: 'list'}),
		div1, div2,
		change = function () {
			if ( this.IsChanged() === true ) {
				if ( !this._is_changed ) {
					settChanges++;
				}

				this._is_changed = true;
			} else {
				if ( this._is_changed ) {
					this._is_changed = false;
					settChanges--;
				}
			}

			if ( !(SettingsPage.BCrumb.Tip().iid === 'advancedSettings' && navigation.element === 0) ) {
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, (settChanges === 0));
			}
		},
		componentOnChange = function ( onChange, noSave ) {
			return function () {
				if ( noSave !== true ) {
					change.call(this, arguments);
				}

				if ( typeof onChange === 'function' ) {
					onChange.call(this, arguments);
				}
			};
		};

	if ( !generate_only ) {
		navigation.elements = [];
	}

	for ( var i = 0; i < arr.length; i++ ) {
		var text = element('div', {className: 'vertical'}, element('div', {className: 'title', innerHTML: arr[i].title}));
		var elem = element('div', {className: 'control'});

		switch ( arr[i].element ) {
			case 'ip':
				var div = element('div'),
					input2, input3, input4;
				if ( arr[i].value === '' ) {
					arr[i].value = '...';
				}
				var ip = arr[i].value.split('.');
				input = element('input', {type: 'text', onfocus: ipOnFocus, oninput: check_leng_ip, maxLength: '3', value: ip[0] !== '' ? ip[0] : 0, 'default': ip[0] !== '' ? ip[0] : 0, className: 'elements ip sub_elements' + i});
				input2 = element('input', {type: 'text', onfocus: ipOnFocus, oninput: check_leng_ip, maxLength: '3', value: ip[1] !== '' ? ip[1] : 0, 'default': ip[0] !== '' ? ip[1] : 0, className: 'ip sub_elements' + i});
				input3 = element('input', {type: 'text', onfocus: ipOnFocus, oninput: check_leng_ip, maxLength: '3', value: ip[2] !== '' ? ip[2] : 0, 'default': ip[0] !== '' ? ip[2] : 0, className: 'ip sub_elements' + i});
				input4 = element('input', {type: 'text', onfocus: ipOnFocus, oninput: check_leng_ip, maxLength: '3', value: ip[3] !== '' ? ip[3] : 0, 'default': ip[0] !== '' ? ip[3] : 0, className: 'ip sub_elements' + i});
				if  (arr[i].no_save !== true){
					inputs.push(input);
					inputs.push(input2);
					inputs.push(input3);
					inputs.push(input4);
				}
				if ( arr[i].disabled ) {
					input.disabled = true;
					input.className = 'elements ip disabled';
					input2.disabled = true;
					input2.className = 'elements ip disabled';
					input3.disabled = true;
					input3.className = 'elements ip disabled';
					input4.disabled = true;
					input4.className = 'elements ip disabled';

				}
				elchild(div, [input, ' . ', input2, ' . ', input3, ' . ', input4]);
				elchild(elem, div);
				break;
			case 'select':
				var selected, j;

				if ( no_component === true ) {
					var select = element('select', {className: 'elements'});

					if ( arr[i].onChange ) {
						select.onchange = arr[i].onChange;
						select.specChange = 'true';
					}

					if  ( arr[i].no_save !== true ){
						inputs.push(select);
					}

					if ( arr[i].option ) {
						for ( j = 0; j < arr[i].option.length; j++ ) {
							var s = element('option', {value: arr[i].option[j].value}, arr[i].option[j].title);

							if ( arr[i].option[j].value === arr[i].selected ) {
								s.selected = true;

								if ( arr[i]['default'] === undefined ) {
									s['default'] = true;
								}
							}

							if ( arr[i]['default'] !== undefined && arr[i]['default'] === arr[i].option[j].value ) {
								s['default'] = true;
							}

							elchild(select, s);
						}
					}
					elchild(elem, select);
				} else {
					for (j = 0; j < arr[i].option.length; j++) {
						if ( arr[i].option[j].value === arr[i].selected ) {
							selected = j;
						}
					}

					input = new CSelectBox(SettingsPage, {
						parent: elem,
						data: arr[i].option,
						idField: 'value',
						nameField: 'title',
						selected: selected,
						style: 'elements',
						events: {
							onChange: componentOnChange(arr[i].onChange, arr[i].no_save)
						}
					});
				}
				break;
			case 'button':
				input = element('input', {type: 'button', value: arr[i].value, onclick: arr[i].onClick, className: 'elements wide500'});

				if ( arr[i].no_save !== true ) {
					inputs.push(input);
				}

				elchild(elem, input);
				break;
			case 'input':
				input = element('input', {type: arr[i].type, 'default': arr[i].value, value: arr[i].value, className: 'elements wide500'});

				if ( arr[i].id ) {
					input.id = arr[i].id;
				}

				if ( arr[i].no_save !== true ) {
					inputs.push(input);
				}

				if ( arr[i].disabled ) {
					input.disabled = true;
					input.className = 'elements wide500 disabled';
				}

				elchild(elem, input);
				break;
			case 'checkbox':
				var label = element('label');
				label.setAttribute('for', arr[i].id ? arr[i].id : 'checkbox-id' + i);
				input = element('input', {type: 'checkbox', className: 'elements', id: arr[i].id ? arr[i].id : 'checkbox-id' + i, code: arr[i].code ? arr[i].code : '', onchange: arr[i].onChange ? arr[i].onChange : function () {}});

				if ( arr[i].no_save !== true){
					inputs.push(input);
				}

				if ( arr[i].checked === 'true' || arr[i].checked === true) {
					input.checked = true;
				}

				input['default'] = !!input.checked;
				elchild(elem, [input, label]);
				break;
			case 'input_spec':
				if (no_component === true){
					div1 = element('div', {className: 'decrease', onclick: arr[i].left, number: i});
					div2 = element('div', {className: 'increase', onclick: arr[i].right, number: i});
					input = element('input', {className: 'elements arrow', type: 'text', 'default':arr[i].value, value: arr[i].value, interval: arr[i].interval, maxsize: arr[i].maxsize, minsize: arr[i].minsize ? arr[i].minsize : 0});

					if ( arr[i].no_save !== true){
						inputs.push(input);
					}

					input.readonly = true;
					input.disabled = true;

					if ( arr[i].onChange ) {
						input.onchange = arr[i].onChange;
					}
					elchild(elem, [div1, div2, input]);
				} else {
					input = new CIntervalBox(SettingsPage, {
						parent: elem,
						max: arr[i].maxsize,
						min: arr[i].minsize || 0,
						interval: arr[i].interval,
						value: arr[i].value,
						style: 'elements',
						events: {
							onChange: componentOnChange(arr[i].onChange, arr[i].no_save),
							onNext: arr[i].right,
							onPrevious: arr[i].left
						}
					});
				}
				break;
			case 'input_check':
				if ( no_component === true ) {
					div1 = element('div', {className: 'decrease', onclick: arr[i].left, number: i});
					div2 = element('div', {className: 'increase', onclick: arr[i].right, number: i});
					input = element('input', {className: 'elements check', type: 'text', 'default': arr[i].value, value: arr[i].value, interval: arr[i].interval, maxsize: arr[i].maxsize, minsize: arr[i].minsize ? arr[i].minsize : 0});

					if ( arr[i].no_save !== true){
						inputs.push(input);
					}

					input.readonly = true;
					input.disabled = true;

					if ( arr[i].onChange ) {
						input.onchange = arr[i].onChange;
					}

					elchild(elem, [div1, div2, input]);
				} else {
					var style;

					if ( SettingsPage.BCrumb.Tip().iid === 'serversPortalsMore' ) {
						style = 'elements small-cinterval-box';
					} else {
						style = 'elements';
					}

					input = new CIntervalBox(SettingsPage, {
						parent: elem,
						max: arr[i].maxsize,
						min: arr[i].minsize || 0,
						interval: arr[i].interval,
						value: arr[i].value,
						style: style,
						events: {
							onChange: componentOnChange(arr[i].onChange, arr[i].no_save),
							onNext: arr[i].right,
							onPrevious: arr[i].left
						}
					});
				}
				break;
		}

		navigation.elements.push(input);
		obj[i] = element('a', {href: '#', className: 'item', onmouseover: mouse_over_element, number: i}, [text, elem]);

		if ( arr[i].sub_id !== undefined ) {
			obj[i].id = arr[i].sub_id;
		}
	}

	inputs.forEach(function(input){
		input.onchange = (function(onChange){
			return function () {
				var changed = false;

				if ( typeof onChange === 'function' ) {
					onChange.call(this);
				}

				settChanges = settChanges || 0;
				echo(this.tagName);

				switch ( this.tagName ) {
					case 'SELECT':
						if ( SettingsPage.BCrumb.Tip().iid === 'videoMore' && navigation.element === 0 && alertFramerateMsg) {
							new CModalAlert(SettingsPage, _('Notice'), _('During file playback, video output frame rate will be automatically adjusted<br/>according to played content.<br />Notes:<br />- works only with HDMI 720p/1080i/1080p video modes<br />- make sure your TV supports required video mode'), _('Close'));
							alertFramerateMsg = false;
						}
						if ( SettingsPage.BCrumb.Tip().iid === 'videoMore' && navigation.element === 1 && alertHdmiMsg) {
							new CModalAlert(SettingsPage, _('Notice'), _('<span style=\"color: red\">With option enabled in DVI mode<br/>HDMI audio will be missing</span>'), _('Close'));
							alertHdmiMsg = false;
						}
						selected = this.options[this.selectedIndex];
						echo(selected.value, 'Value');
						echo(selected['default'], 'Default');
						changed = !(selected.selected === true && selected['default'] === true);
						break;
					case 'INPUT':
						switch (this.type){
							case 'text':
								changed =  (this.value !== this['default']);
								break;
							case 'password':
								changed =  (this.value !== this['default']);
								break;
							case 'checkbox':
								changed =  (this.checked !== this['default']);
								break;
						}
						break;
				}

				if ( changed === true ) {
					if ( !this._is_changed ) {
						settChanges++;
					}

					this._is_changed = true;
				} else {
					if ( this._is_changed ) {
						this._is_changed = false;
						settChanges--;
					}
				}

				if (!layoutOrderChanged) {
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, (settChanges === 0));
				}
			};
		})(input.onchange);

		if ( input.tagName === 'INPUT' && (input.type === 'text' || input.type === 'password') ) {
			input.oninput = input.onchange;
		}
	});

	if ( generate_only !== true ) {
		settChanges = 0;
		document.getElementById(as.page_list[as.page]).style.display = 'none';
		elclear(document.getElementById(as.page_list[as.page]));
		elchild(d, obj);
		elchild(document.getElementById(as.page_list[as.page]), d);
		navigation.pre_elements = d.getElementsByClassName('item');
		navigation.element = 0;
		navigation.oldClass = navigation.pre_elements[navigation.element].className;
		navigation.pre_elements[navigation.element].className += ' active';
		document.getElementById(as.page_list[as.page]).style.display = 'block';
		navigation.pre_elements[navigation.element].focus();
		navigation.elements[navigation.element].focus();
	}
	return obj;
}


function mainPageLoad ( firstLoad ) {
	if ( firstLoad ) {
		var elementsArray = [
			{name: _('Network'), rId: 'Network', className: 'network_settings', func: networkLoad},
			{name: _('Servers'), rId: 'Servers', className: 'servers', func: serversLoad},
			{name: _('Video'), rId: 'Video', className: 'video', func: videoLoad},
			{name: _('Audio'), rId: 'Audio', className: 'audio', func: audioLoad},
			{name: _('Advanced settings'), rId: 'AdvancedSettings', className: 'advSet', func: advancedSettingsLoad},
			{name: _('Keyboard layout'), rId: 'KeyboardLayout', className: 'keyboard_layout', func: keyboardLayoutLoad},
			{name: _('Network info'), rId: 'NetworkInfo', className: 'net_info', func: networkInfoLoad},
			{name: _('Device info'), rId: 'DeviceInfo', className: 'dev_info', func: deviceInfoLoad},
			{name: _('Restart portal'), rId: 'RestartPortal', className: 'reload', func: restartPortalLoad},
			{name: _('Reboot device'), rId: 'RebootDevice', className: 'reboot', func: rebootDeviceLoad},
			{name: _('Reset settings'), rId: 'ResetSettings', className: 'reset', func: resetSettings},
			{name: _('Clear user data'), rId: 'ClearUserData', className: 'clear_ico', func: clearUserDataLoad},
			{name: _('Software update'), rId: 'SoftwareUpdate', className: 'update', func: function () {
				UpdatePage.Show();
			}},
			{name: _('Remote control'), rId: 'RemoteControl', className: 'remoteControl', func: remoteControlLoad}
		];
		list.main = [];
		backIndex = 0;
		backElement = [0];

		elementsArray.forEach(function ( element ) {
			if ( RULES[element.rId] ) {
				list.main.push(element);
			}
		});

		SettingsPage.Init(document.body.querySelector('.page.main'));
		UpdatePage.Init();
	} else {
		document.getElementById(as.page_list[as.page]).style.display = 'none';
		as.page = as.pages.MAIN;
		backElement[backElement[0]] = 0;
		backIndex = 0;
		navigation.element = backElement[0];
	}

	SettingsPage.BCrumb.Reset();
	SettingsPage.BCrumb.SetName(_('System settings'));
	SettingsPage.BCrumb.Push('', 'settings_blue.png', '', 'mainPage');
	generateList(list.main);
	updateFooter();
}


function networkLoad () {
	/*jshint validthis: true */

	var elementsArray,
		model = gSTB.GetDeviceModelExt();

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.LIST;
	navigationBackFunction = mainPageLoad;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'network' ) {
		SettingsPage.BCrumb.Push('', 'folder_lan.png', _('Network'), 'network');
	}

	if ( list.lan.length === 0 ) {
		list.lan = [];
		switch ( model ) {
			case 'IM2100':
			case 'IM2100V':
			case 'IM2100VI':
			case 'IM2101':
			case 'IM2102':
			case 'MAG322':
			case 'MAG324':
			case 'MAG324C':
			case 'MAG325':
			case 'MAG349':
			case 'MAG350':
			case 'MAG351':
			case 'MAG352':
			case 'MAG256':
			case 'MAG257':
			case 'MAG420':
			case 'MAG422':
			case 'MAG424':
			case 'MAG425':
			case 'AuraHD4':
				elementsArray = [
					{name: _('Wired (Ethernet)'), rId: 'Network/Wired(Ethernet)', className: 'ico_folder', func: wiredEthernetLoad},
					{name: _('Wireless (Wi-Fi)'), rId: 'Network/Wireless(Wi-Fi)', className: 'ico_folder', func: wirelessWiFiLoad}
				];
				break;
			default:
				elementsArray = [
					{name: _('Wired (Ethernet)'), rId: 'Network/Wired(Ethernet)', className: 'ico_folder', func: wiredEthernetLoad},
					{name: _('PPPoE'), rId: 'Network/PPPoE', className: 'ico_folder', func: PPPoELoad},
					{name: _('Wireless (Wi-Fi)'), rId: 'Network/Wireless(Wi-Fi)', className: 'ico_folder', func: wirelessWiFiLoad}
				];
				break;
		}
		// TODO: fix when bluetooth will be repaired
		if ( window.stbBluetooth /*&& false*/ ) {
			elementsArray.push(
				{name: _('Bluetooth'), rId: 'Network/Bluetooth', className: 'ico_folder', func: scanBluetoothLoad}
			);
		}


		elementsArray.forEach(function ( element ) {
			if ( RULES[element.rId] ) {
				list.lan.push(element);
			}
		});
	}

	generateList(list.lan);
	updateFooter();
}

function wiredEthernetLoad () {
	/*jshint validthis: true */

	var dict;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	toSave = '';
	saveFunction = function () {
	};
	navigationBackFunction = networkLoad;

	if ( SettingsPage.BCrumb.Tip().iid !== 'wiredEthernet' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Wired (Ethernet)'), 'wiredEthernet');
	}

	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.LIST;

	if ( list.lan_wired.length === 0 ) {
		list.lan_wired = [];
		switch ( model ) {
			case 'IM2100':
			case 'IM2100V':
			case 'IM2100VI':
			case 'IM2101':
			case 'IM2102':
			case 'MAG322':
			case 'MAG324':
			case 'MAG324C':
			case 'MAG325':
			case 'MAG349':
			case 'MAG350':
			case 'MAG351':
			case 'MAG352':
			case 'MAG256':
			case 'MAG257':
			case 'MAG420':
			case 'MAG422':
			case 'MAG424':
			case 'MAG425':
			case 'AuraHD4':
				dict = [
					{name: _('Auto (DHCP)'), rId: 'Network/Wired(Ethernet)/Auto(DHCP)', className: 'ico_folder', func: wiredAutoDHCPLoad},
					{name: _('Auto (DHCP), manual DNS'), rId: 'Network/Wired(Ethernet)/Auto(DHCP),manualDNS', className: 'ico_folder', func: wiredAutoDHCPManualDNSLoad},
					{name: _('Manual'), rId: 'Network/Wired(Ethernet)/Manual', className: 'ico_folder', func: wiredManualLoad}
				];
				break;
			default:
				dict = [
					{name: _('Auto (DHCP)'), rId: 'Network/Wired(Ethernet)/Auto(DHCP)', className: 'ico_folder', func: wiredAutoDHCPLoad},
					{name: _('Auto (DHCP), manual DNS'), rId: 'Network/Wired(Ethernet)/Auto(DHCP),manualDNS', className: 'ico_folder', func: wiredAutoDHCPManualDNSLoad},
					{name: _('Manual'), rId: 'Network/Wired(Ethernet)/Manual', className: 'ico_folder', func: wiredManualLoad},
					{name: _('No IP'), rId: 'Network/Wired(Ethernet)/NoIP', className: 'ico_folder', func: wiredNoIPLoad}
				];
				break;
		}

		dict.forEach(function ( menuItem ) {
			if ( RULES[menuItem.rId] ) {
				list.lan_wired.push(menuItem);
			}
		});
	}

	SettingsPage.bpanel.SetName(SettingsPage.bpanel.infoButton, _('Network info'));
	generateList(list.lan_wired);
	updateFooter(false, false, false, true, false);
}

function wiredAutoDHCPLoad () {
	new CModalConfirm(
		SettingsPage,
		_('Confirm'),
		_('Confirm changes?'),
		_('Cancel'),
		null,
		_('Yes'),
		function () {
			var saveData = {
				lan_noip: '',
				ipaddr_conf: '',
				dnsip: ''
			};

			gSTB.SetEnv(JSON.stringify(saveData));
			gSTB.ServiceControl('network', 'restart');
		}
	);
}

function wiredAutoDHCPManualDNSLoad () {
	/*jshint validthis: true */

	var arr = [];

	//if ( this.number || this.number === 0 ) {
	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;
	//}

	saveFunction = wiredAutoDHCPManualDNSSave;
	if ( SettingsPage.BCrumb.Tip().iid !== 'wiredAutoDHCPManualDNS' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Auto (DHCP), manual DNS'), 'wiredAutoDHCPManualDNS');
	}
	updateFooter();
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	navigationBackFunction = wiredEthernetLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['dnsip']
	})));
	arr = [
		{element: 'ip', title: 'DNS:', value: read.result.dnsip}
	];
	generateElements(arr);
}

function wiredAutoDHCPManualDNSSave () {
	var DNS = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements0')),
		saveData = {
			lan_noip: '',
			ipaddr_conf: ''
		},
		errors = [];

	DNS = DNS === '0.0.0.0' ? '' : DNS;

	if ( DNS !== read.result.dnsip ) {
		if ( cIP(DNS) ) {
			saveData.dnsip = DNS;
		} else {
			errors.push('DNS');
		}
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));
		gSTB.ServiceControl('network', 'restart');
		wiredAutoDHCPManualDNSLoad();
		showSuccessfullySavedMessage();
		return true;
	}
}

function wiredManualLoad () {
	/*jshint validthis: true */

	var dict;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'wiredManual' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Manual'), 'wiredManual');
	}
	updateFooter();
	saveFunction = wiredManualSave;
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	navigationBackFunction = wiredEthernetLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['ipaddr_conf', 'netmask', 'gatewayip', 'dnsip']
	})));
	dict = [
		{element: 'ip', title: _('IP address:'), value: read.result.ipaddr_conf},
		{element: 'ip', title: _('Network mask:'), value: read.result.netmask},
		{element: 'ip', title: _('Gateway:'), value: read.result.gatewayip},
		{element: 'ip', title: _('DNS server:'), value: read.result.dnsip}
	];

	generateElements(dict);
}

function wiredManualSave () {
	var IPAddress = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements0')),
		networkMask = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements1')),
		gateway = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements2')),
		DNSServer = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements3')),
		saveData = {
			lan_noip: ''
		},
		errors = [];

	IPAddress = IPAddress === '0.0.0.0' ? '' : IPAddress;
	networkMask = networkMask === '0.0.0.0' ? '' : networkMask;
	gateway = gateway === '0.0.0.0' ? '' : gateway;
	DNSServer = DNSServer === '0.0.0.0' ? '' : DNSServer;

	if ( IPAddress !== read.result.ipaddr_conf ) {
		if ( cIP(IPAddress) ) {
			saveData.ipaddr_conf = IPAddress;
		} else {
			errors.push(_('IP address:').replace(':', ''));
		}
	}

	if ( networkMask !== read.result.netmask ) {
		if ( cIP(networkMask) ) {
			saveData.netmask = networkMask;
		} else {
			errors.push(_('Network mask:').replace(':', ''));
		}
	}

	if ( gateway !== read.result.gatewayip ) {
		if ( cIP(gateway) ) {
			saveData.gatewayip = gateway;
		} else {
			errors.push(_('Gateway:').replace(':', ''));
		}
	}

	if ( DNSServer !== read.result.dnsip ) {
		if ( cIP(DNSServer) ) {
			saveData.dnsip = DNSServer;
		} else {
			errors.push(_('DNS server:').replace(':', ''));
		}
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));
		gSTB.ServiceControl('network', 'restart');
		wiredManualLoad();
		showSuccessfullySavedMessage();

		return true;
	}
}

function wiredNoIPLoad () {
	new CModalConfirm(
		SettingsPage,
		_('Confirm'),
		_('Confirm changes?'),
		_('Cancel'),
		null,
		_('Yes'),
		function () {
			var saveData = {
				lan_noip: true
			};

			gSTB.SetEnv(JSON.stringify(saveData));
			gSTB.ServiceControl('network', 'restart');
		}
	);
}

function PPPoELoad () {
	var dict;
	navigationBackFunction = networkLoad;

	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';

	as.page = as.pages.LIST;

	//if ( this.number || this.number === 0 ) {
	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;
	//}

	if ( SettingsPage.BCrumb.Tip().iid !== 'PPPoE' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('PPPoE'), 'PPPoE');
	}

	if ( list.lan_pppoe.length === 0 ) {
		list.lan_pppoe = [];

		dict = [
			{name: _('Auto (DHCP)'), rId: 'Network/PPPoE/Auto(DHCP)', className: 'ico_folder', func: pppoeAutoDHCPLoad},
			{name: _('Auto (DHCP), manual DNS'), rId: 'Network/PPPoE/Auto(DHCP),manualDNS', className: 'ico_folder', func: pppoeAutoDHCPManualDNSLoad}
		];

		dict.forEach(function ( menuItem ) {
			if ( RULES[menuItem.rId] ) {
				list.lan_pppoe.push(menuItem);
			}
		});
	}

	SettingsPage.bpanel.SetName(SettingsPage.bpanel.infoButton, _('Network info'));
	generateList(list.lan_pppoe);
	updateFooter(false, false, false, true, false);
}

function pppoeAutoDHCPLoad () {
	/*jshint validthis: true */

	var elementsArray = [];

	navigationBackFunction = PPPoELoad;
	saveFunction = PPPoEAutoDHCPSave;

	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['pppoe_enabled', 'pppoe_login', 'pppoe_pwd']
	})));

	elementsArray = [
		{element: 'checkbox', title: _('PPPoE:'), checked: read.result.pppoe_enabled, onChange: function () {
			if ( this.value ) {
				navigation.elements[1].disabled = false;
				navigation.elements[1].className = 'elements wide500';
				navigation.elements[2].disabled = false;
				navigation.elements[2].className = 'elements wide500';
			} else {
				navigation.elements[1].disabled = true;
				navigation.elements[1].className = 'elements wide500 disabled';
				navigation.elements[2].disabled = true;
				navigation.elements[2].className = 'elements wide500 disabled';
			}
		}},
		{element: 'input', type: 'text', title: _('Login:'), value: read.result.pppoe_login || '', disabled: read.result.pppoe_enabled !== 'true'},
		{element: 'input', type: 'password', title: _('Password:'), value: read.result.pppoe_pwd || '', disabled: read.result.pppoe_enabled !== 'true'}
	];

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'PPPoEAutoDHCP' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Auto (DHCP)'), 'PPPoEAutoDHCP');
	}

	generateElements(elementsArray);
	updateFooter();
}

function PPPoEAutoDHCPSave () {
	var saveData = {
		pppoe_dns1: ''
	};

	if ( navigation.elements[0].checked !== read.result.pppoe_enabled ) {
		saveData.pppoe_enabled = navigation.elements[0].checked;
	}

	if ( navigation.elements[1].value !== read.result.pppoe_login ) {
		saveData.pppoe_login = navigation.elements[1].value;
	}

	if ( navigation.elements[2].value !== read.result.pppoe_pwd ) {
		saveData.pppoe_pwd = navigation.elements[2].value;
	}

	gSTB.SetEnv(JSON.stringify(saveData));
	gSTB.ServiceControl('pppoe', 'restart');
	showSuccessfullySavedMessage();
	pppoeAutoDHCPLoad();

	return true;
}

function pppoeAutoDHCPManualDNSLoad () {
	/*jshint validthis: true */

	var elementsArray = [],
		ipInputs = document.getElementsByClassName('ip'),
		i;

	navigationBackFunction = PPPoELoad;
	saveFunction = PPPoEAutoDHCPManualDNSSave;

	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['pppoe_enabled', 'pppoe_login', 'pppoe_pwd', 'pppoe_dns1']
	})));

	elementsArray = [
		{element: 'checkbox', title: _('PPPoE:'), checked: read.result.pppoe_enabled, onChange: function () {
			if ( this.value ) {
				navigation.elements[1].disabled = false;
				navigation.elements[1].className = 'elements wide500';
				navigation.elements[2].disabled = false;
				navigation.elements[2].className = 'elements wide500';
				for ( i = 0; i < ipInputs.length; i++ ) {
					ipInputs[i].disabled = false;
					ipInputs[i].className = 'elements ip sub_elements3';
				}
			} else {
				navigation.elements[1].disabled = true;
				navigation.elements[1].className = 'elements wide500 disabled';
				navigation.elements[2].disabled = true;
				navigation.elements[2].className = 'elements wide500 disabled';

				for ( i = 0; i < ipInputs.length; i++ ) {
					ipInputs[i].disabled = true;
					ipInputs[i].className = 'elements ip disabled';
				}
			}
		}},
		{element: 'input', type: 'text', title: _('Login:'), value: read.result.pppoe_login || '', disabled: read.result.pppoe_enabled !== 'true'},
		{element: 'input', type: 'password', title: _('Password:'), value: read.result.pppoe_pwd || '', disabled: read.result.pppoe_enabled !== 'true'},
		{element: 'ip', title: _('DNS:'), value: read.result.pppoe_dns1, disabled: read.result.pppoe_enabled !== 'true'}
	];

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'PPPoEAutoDHCPManualDNS' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Auto (DHCP), manual DNS'), 'PPPoEAutoDHCPManualDNS');
	}


	generateElements(elementsArray);
	updateFooter();
}

function PPPoEAutoDHCPManualDNSSave () {
	var errors = [],
		saveData = {},
		DNS;

	if ( navigation.elements[0].checked !== read.result.pppoe_enabled ) {
		saveData.pppoe_enabled = navigation.elements[0].checked;
	}

	if ( navigation.elements[1].value !== read.result.pppoe_login ) {
		saveData.pppoe_login = navigation.elements[1].value;
	}

	if ( navigation.elements[2].value !== read.result.pppoe_pwd ) {
		saveData.pppoe_pwd = navigation.elements[2].value;
	}

	if ( navigation.elements[0].checked ) {
		DNS = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements3'));

		DNS = DNS === '0.0.0.0' ? '' : DNS;

		if ( DNS !== read.result.pppoe_dns1 ) {
			if ( cIP(DNS) ) {
				saveData.pppoe_dns1 = DNS;
			} else {
				errors[0] = 'DNS';
			}
		}
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));
		gSTB.ServiceControl('pppoe', 'restart');
		showSuccessfullySavedMessage();
		pppoeAutoDHCPManualDNSLoad();

		return true;
	}
}

function wirelessWiFiLoad () {
	/*jshint validthis: true */

	var elementsArray;

	globalSaveData = {};
	wifiLoadVariation = 0;
	if ( gSTB.GetNetworkWifiMac() === '' && !wirelessWiFiVisited ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Wi-Fi adapter not connected'), _('Close'));
	} else {
		document.getElementById(as.page_list[as.page]).style.display = 'none';
		as.page = as.pages.LIST;
		wirelessWiFiVisited = false;
		navigationBackFunction = networkLoad;

		if ( SettingsPage.BCrumb.Tip().iid !== 'wirelessWiFi' ) {
			SettingsPage.BCrumb.Push('', 'folder.png', _('Wireless (Wi-Fi)'), 'wirelessWiFi');
		}

		backElement[backIndex] = this && this.number ? this.number : 0;
		backIndex++;
		backElement[backIndex] = 0;

		if ( list.lan_wifi.length === 0 ) {
			list.lan_wifi = [];

			elementsArray = [
				{name: _('Auto (DHCP)'), rId: 'Network/Wireless(Wi-Fi)/Auto(DHCP)', className: 'ico_folder', func: wirelessAutoDHCPLoad},
				{name: _('Auto (DHCP), manual DNS'), rId: 'Network/Wireless(Wi-Fi)/Auto(DHCP),manualDNS', className: 'ico_folder', func: wirelessAutoDHCPManualDNSLoad},
				{name: _('Manual'), rId: 'Network/Wireless(Wi-Fi)/Manual', className: 'ico_folder', func: wirelessManualLoad}
			];

			elementsArray.forEach(function ( element ) {
				if ( RULES[element.rId] ) {
					list.lan_wifi.push(element);
				}
			});
		}

		SettingsPage.bpanel.SetName(SettingsPage.bpanel.infoButton, _('Network info'));
		generateList(list.lan_wifi);
		updateFooter(false, false, false, true, false);
	}
}

function wirelessAutoDHCPLoad () {
	/*jshint validthis: true */
	var environmentData = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['wifi_ssid', 'wifi_off']
	})));

	wirelessWiFiVisited = true;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;
	//wifiLoadVariation = 0;

	read = {result: []};
	wifiOff = environmentData.result['wifi_off'] === '1';
	if ( !wifiOff ) {
		read = JSON.parse(gSTB.GetWifiGroups());
	}

	for ( var i = 0; i < read.result.length; i++ ) {
		if ( read.result[i].ssid === environmentData.result.wifi_ssid ) {
			read.result[i].connected = true;
		}
	}

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.WIFI;
	switch ( wifiLoadVariation ) {
		case 1:
			navigationBackFunction = wirelessAutoDHCPManualDNSLoad;
			break;
		case 2:
			navigationBackFunction = wirelessManualLoad;
			break;
		default:
			if ( SettingsPage.BCrumb.Tip().iid !== 'wirelessAutoDHCP' ) {
				SettingsPage.BCrumb.Push('', 'folder.png', _('Auto (DHCP)'), 'wirelessAutoDHCP');
			}
			navigationBackFunction = wirelessWiFiLoad;
			break;
	}

	if ( !wiFiList ) {
		wiFiList = new CWiFiList(SettingsPage);
		wiFiList.Init(SettingsPage.handle.querySelector('.cslist-main'));
	}
	wiFiInfoSideBar = initInfo(SettingsPage);

	document.getElementById(as.page_list[as.page]).style.display = 'block';
	wiFiList.SetData(read.result);
	wiFiList.Activate(true);
	updateFooter(false, false, false, read.result.length !== 0, !wifiOff, !wifiOff, wiFiList.accessPoints.length && wiFiList.accessPoints[0].connected);
	SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, wifiOff ? _('Enable WiFi') : _('Disable WiFi'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
}

function toggleWifiEnable () {
	// toggle bluetooth enabled
	wifiOff = !wifiOff;

	SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, wifiOff ? _('Enable WiFi') : _('Disable WiFi'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);

	gSTB.SetEnv(JSON.stringify({"wifi_off": wifiOff ? 1 : 0}));
	gSTB.ServiceControl('wifi', 'restart');

	RefheshWiFi();
}

function RefheshWiFi () {
	var environmentData = JSON.parse(gSTB.GetEnv(JSON.stringify({
			varList: ['wifi_ssid']
		}))),
		visible = wiFiInfoSideBar.isVisible && SettingsPage.isVisible;

	read = {result: []};

	if ( !wifiOff ) {
		read = JSON.parse(gSTB.GetWifiGroups());
	}
	for ( var i = 0; i < read.result.length; i++ ) {
		if ( read.result[i].ssid === environmentData.result.wifi_ssid ) {
			read.result[i].connected = true;
		}
	}
	if ( !read.result.length ) {
		wiFiInfoSideBar.Show(false, false);
	}
	wiFiList.SetData(read.result);
	wiFiList.Activate(true);

	setTimeout(function() {
		updateFooter(false, false, false, read.result.length !== 0, !wifiOff, !wifiOff, wiFiList.accessPoints.length && wiFiList.accessPoints[0].connected);
		SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, wifiOff ? _('Enable WiFi') : _('Disable WiFi'));
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
		if ( visible ) {
			// show info in preview block
			wiFiInfoSideBar.Show(read.result.length !== 0, false);
			wiFiInfoSideBar.info(wiFiList.accessPoints[0]);
		}
	}, 400);
}

function wiFiAuthenticationLoad ( accessPoint, flag ) {
	var authenticationModeOptions,
		encryptionOptions,
		elementsArray,
		auth,
		enc,
		passValue;

	if ( flag ) {
		authenticationModeOptions = [
			{ title: _('Open'), value: 'open' },
			{ title: _('Shared key'), value: 'shared' },
			{ title: _('Auto Open/Shared key'), value: 'wep_auto' },
			{ title: 'WPA PSK', value: 'wpapsk' },
			{ title: 'WPA2 PSK', value: 'wpa2psk' }
		];
		encryptionOptions = [
			{ title: _('NONE'), value: 'none' },
			{ title: 'WEP', value: 'wep' },
			{ title: 'TKIP', value: 'tkip' },
			{ title: 'AES', value: 'aes' }
		];

		backElement[backIndex] = 0;
		backIndex++;
		backElement[backIndex] = 0;
		navigationBackFunction = wirelessAutoDHCPLoad;
		saveFunction = wifi_password_save;

		document.getElementById(as.page_list[as.page]).style.display = 'none';
		as.page = as.pages.ELEMENTS;

		if ( SettingsPage.BCrumb.Tip().iid !== 'WiFiAuthentication' ) {
			SettingsPage.BCrumb.Push('', 'folder_lan.png', 'Add', 'WiFiAuthentication');
		}

		elementsArray = [
			{ element: 'input', type: 'text', title: 'SSID:', value: '' },
			{ element: 'select', title: _('Authentication mode:'), option: authenticationModeOptions },
			{ element: 'select', title: _('Encryption:'), option: encryptionOptions, onChange: encoding_check },
			{ element: 'input', type: 'password', title: _('Key or passphrase:'), value: '' }
		];

		generateElements(elementsArray);
		updateFooter();
		SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, _('Keys and encoding setup'));
		encoding_check();
	} else {
		if ( accessPoint ) {
			wiFiAccessPoint = accessPoint;
		}

		read = JSON.parse(gSTB.GetEnv(JSON.stringify({
			varList: ['wifi_ssid', 'wifi_auth', 'wifi_enc', 'wifi_psk', 'wifi_wep_key1']
		})));

		if ( wiFiAccessPoint.state ) {
			var saveData = {
				wifi_ssid: wiFiAccessPoint.ssid,
				wifi_auth: 'open',
				wifi_enc: 'none'
			};
			switch ( wifiLoadVariation ) {
				case 0:
					saveData.wifi_int_dns = '';
				case 1:
					saveData.wifi_int_ip = '';
					saveData.wifi_int_mask = '';
					saveData.wifi_int_gw = '';
					break;
			}
			saveData.wifi_psk = '';
			if ( wiFiList.connectedItem ) {
				wiFiList.connectedItem.classList.remove('connected');
			}
			wiFiList.connectedItem = wiFiList.activeItem.firstChild;
			wiFiList.connectedItem.classList.add('connected');
			gSTB.SetEnv(JSON.stringify(globalSaveData));
			globalSaveData = {};
			gSTB.SetEnv(JSON.stringify(saveData));
			gSTB.ServiceControl('wifi', 'restart');
			mainPageLoad();
			showSuccessfullySavedMessage();
		} else {
			document.getElementById(as.page_list[as.page]).style.display = 'none';
			as.page = as.pages.ELEMENTS;

			authenticationModeOptions = [
				{ title: _('Open'), value: 'open' },
				{ title: _('Shared key'), value: 'shared' },
				{ title: _('Auto Open/Shared key'), value: 'wep_auto' },
				{ title: 'WPA PSK', value: 'wpapsk' },
				{ title: 'WPA2 PSK', value: 'wpa2psk' }
			];
			encryptionOptions = [
				{ title: _('NONE'), value: 'none' },
				{ title: 'WEP', value: 'wep' },
				{ title: 'TKIP', value: 'tkip' },
				{ title: 'AES', value: 'aes' }
			];

			backElement[backIndex] = 0;
			backIndex++;
			backElement[backIndex] = 0;
			navigationBackFunction = wirelessAutoDHCPLoad;
			saveFunction = wifi_password_save;

			if ( SettingsPage.BCrumb.Tip().iid !== 'WiFiAuthentication' ) {
				SettingsPage.BCrumb.Push('', 'folder_lan.png', wiFiAccessPoint.ssid, 'WiFiAuthentication');
			}

			if ( wiFiAccessPoint.ssid === read.result.wifi_ssid ) {
				passValue = true;
			}

			switch ( wiFiAccessPoint.auth ) {
				case 'WPA2':
					auth = 'wpa2psk';
					break;
				case 'WPAAUTO':
					auth = 'wep_auto';
					break;
				case 'WPA':
					auth = 'wpapsk';
					break;
				default:
					auth = 'open';
					break;
			}

			switch ( wiFiAccessPoint.enc ) {
				case 'TKIP':
					enc = 'tkip';
					break;
				case 'WEP':
					enc = 'wep';
					break;
				case 'CCMP':
					enc = 'aes';
					break;
				default:
					enc = 'none';
					break;
			}

			elementsArray = [
				{ element: 'input', type: 'text', title: 'SSID:', value: wiFiAccessPoint.ssid },
				{ element: 'select', title: _('Authentication mode:'), option: authenticationModeOptions, selected: auth },
				{ element: 'select', title: _('Encryption:'), option: encryptionOptions, selected: enc, onChange: encoding_check },
				{ element: 'input', type: 'password', title: _('Key or passphrase:'), value: passValue ? read.result.wifi_psk : '' }
				// { element: 'button', title: '', value: _('Keys and encoding setup'), onClick: wifi_keys }
			];

			generateElements(elementsArray);
			updateFooter();
			SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, _('Keys and encoding setup'));
			encoding_check();
			window.setTimeout( function () {
				//if ( read.result.wifi_ssid !== wiFiAccessPoint.ssid ) {
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, false);
				//}
			}, 0);
		}
	}
}

function wiFiDelete () {
	var saveData = {
		'wifi_psk': '',
		'wifi_ssid': '',
		'wifi_int_ip': '',
		'wifi_auth': '',
		'wifi_enc': ''
	};

	gSTB.SetEnv(JSON.stringify(saveData));
	gSTB.ServiceControl('wifi', 'restart');
	window.setTimeout(refreshWiFi, 200);
}

function wifi_password_save ( noPass ) {
	var SSID = navigation.elements[0].value,
		authenticationMode = navigation.elements[1].value,
		encryption = navigation.elements[2].value,
		keyOrPassphrase = navigation.elements[3].value,
		saveData = {},
		errors = [];

	switch ( wifiLoadVariation ) {
		case 0:
			saveData.wifi_int_dns = '';
		case 1:
			saveData.wifi_int_ip = '';
			saveData.wifi_int_mask = '';
			saveData.wifi_int_gw = '';
			break;
	}

	if ( SSID !== read.result.wifi_ssid ) {
		saveData.wifi_ssid = SSID;
	}

	if ( (authenticationMode === 'wpa2psk' || authenticationMode === 'wpapsk') && keyOrPassphrase.length < 8 ) {
		errors.push(_('Key or passphrase:').replace(':', '') + ' 1');
	}
	if ( authenticationMode !== read.result.wifi_auth ) {
		saveData.wifi_auth = authenticationMode;
	}

	if ( encryption !== read.result.wifi_enc ) {
		saveData.wifi_enc = encryption;
	}

	if ( encryption === 'none' ) {
		saveData.wifi_psk = '';
		saveData.wifi_wep_key1 = '';
		saveData.wifi_wep_key2 = '';
		saveData.wifi_wep_key3 = '';
		saveData.wifi_wep_key4 = '';
	} else {
		if ( encryption === 'wep' ) {
			if ( keyOrPassphrase !== read.result.wifi_wep_key1 ) {
				saveData.wifi_psk = '';
				saveData.wifi_wep_key1 = keyOrPassphrase;
				saveData.wifi_wep_key2 = keyOrPassphrase;
				saveData.wifi_wep_key3 = keyOrPassphrase;
				saveData.wifi_wep_key4 = keyOrPassphrase;
			}
		} else {
			if ( keyOrPassphrase !== read.result.wifi_psk ) {
				if ( keyOrPassphrase.length < 1 ) {
					errors.push(_('Key or passphrase:').replace(':', ''));
				} else {
					saveData.wifi_psk = keyOrPassphrase;
					saveData.wifi_wep_key1 = '';
					saveData.wifi_wep_key2 = '';
					saveData.wifi_wep_key3 = '';
					saveData.wifi_wep_key4 = '';
				}
			}
		}
	}
	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv(JSON.stringify(globalSaveData));
		globalSaveData = {};
		gSTB.SetEnv(JSON.stringify(saveData));
		if ( !noPass ) {
			gSTB.ServiceControl('wifi', 'restart');
			mainPageLoad();
		}
		window.setTimeout(showSuccessfullySavedMessage, 100);

		return true;
	}
}

function wirelessAutoDHCPManualDNSLoad () {
	/*jshint validthis: true */
	wirelessWiFiVisited = true;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	saveFunction = wirelessAutoDHCPManualDNSSave;

	if ( SettingsPage.BCrumb.Tip().iid !== 'wirelessAutoDHCPManualDNS' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Auto (DHCP), manual DNS'), 'wirelessAutoDHCPManualDNS');
	}

	updateFooter();
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	navigationBackFunction = wirelessWiFiLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['wifi_int_dns']
	})));
	var arr = [
		{element: 'ip', title: 'DNS1:', value: read.result.wifi_int_dns}
	];
	generateElements(arr);
}

function wirelessAutoDHCPManualDNSSave () {
	var DNS1 = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements0')),
		saveData = {
			wifi_int_ip: ''
		},
		errors = [];

	DNS1 = DNS1 === '0.0.0.0' ? '' : DNS1;

	if ( DNS1 !== read.result.wifi_int_dns ) {
		if ( cIP(DNS1) ) {
			saveData.wifi_int_dns = DNS1;
		} else {
			errors.push('DNS1');
		}
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		wifiLoadVariation = 1;
		showSuccessfullySavedMessage();
		gSTB.SetEnv(JSON.stringify(saveData));
		window.setTimeout(wirelessAutoDHCPLoad,0);
		return false;
	}
}

function wirelessManualLoad () {
	/*jshint validthis: true */
	wirelessWiFiVisited = true;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	saveFunction = wirelessManualSave;
	toSave = '';

	if ( SettingsPage.BCrumb.Tip().iid !== 'wirelessManual' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Manual'), 'wirelessManual');
	}

	updateFooter();
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	navigationBackFunction = wirelessWiFiLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['wifi_int_ip', 'wifi_int_mask', 'wifi_int_gw', 'wifi_int_dns']
	})));
	var arr = [
		{element: 'ip', title: _('IP address:'), value: read.result.wifi_int_ip},
		{element: 'ip', title: _('Network mask:'), value: read.result.wifi_int_mask},
		{element: 'ip', title: _('Gateway:'), value: read.result.wifi_int_gw},
		{element: 'ip', title: 'DNS1:', value: read.result.wifi_int_dns}
	];
	generateElements(arr);
}

function wirelessManualSave () {
	var IPAddress = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements0')),
		networkMask = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements1')),
		gateway = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements2')),
		DNS1 = toIp(document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements3')),
		saveData = {},
		errors = [];

	IPAddress = IPAddress === '0.0.0.0' ? '' : IPAddress;
	networkMask = networkMask === '0.0.0.0' ? '' : networkMask;
	gateway = gateway === '0.0.0.0' ? '' : gateway;
	DNS1 = DNS1 === '0.0.0.0' ? '' : DNS1;

	if ( IPAddress !== read.result.wifi_int_ip ) {
		if ( cIP(IPAddress) ) {
			saveData.wifi_int_ip = IPAddress;
		} else {
			errors.push(_('IP address:').replace(':', ''));
		}
	}

	if ( networkMask !== read.result.wifi_int_mask ) {
		if ( cIP(networkMask) ) {
			saveData.wifi_int_mask = networkMask;
		} else {
			errors.push(_('Network mask:').replace(':', ''));
		}
	}

	if ( gateway !== read.result.wifi_int_gw ) {
		if ( cIP(gateway) ) {
			saveData.wifi_int_gw = gateway;
		} else {
			errors.push(_('Gateway:').replace(':', ''));
		}
	}

	if ( DNS1 !== read.result.wifi_int_dns ) {
		if ( cIP(DNS1) ) {
			saveData.wifi_int_dns = DNS1;
		} else {
			errors.push('DNS1:'.replace(':', ''));
		}
	}

	echo(saveData,'saveData');
	globalSaveData = saveData;
	//gSTB.SetEnv(JSON.stringify(saveData));
	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		wifiLoadVariation = 2;
		showSuccessfullySavedMessage();
		window.setTimeout(wirelessAutoDHCPLoad,0);
		return true;
	}
}

/**
 * Scan bluetooth on page load or on refresh button press
 *
 * @param {bollean} manual - true if refresh button was pressed
 */
function scanBluetoothLoad ( manual ) {
	var devices = [],
	message;

	navigationBackFunction = function () {
		// clear handler
		stbBluetooth.onDiscoveryStop = function () {};
		stbBluetooth.onDeviceRemoved = function () {};
		networkLoad();
	};
	btList = new CBtList(SettingsPage, connectBluetoothDevice);
	btList.Init(SettingsPage.handle.querySelector('.cslist-main.bluetooth'));
	btList.SetData([]);

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.BT;

	if ( SettingsPage.BCrumb.Tip().iid !== 'bluetooth' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Scan devices'), 'bluetooth');
	}

	if ( !stbBluetooth.enable ) {
		SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, _('Enable Bluetooth'));
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
	} else {
		devices = stbBluetooth.devices;
		updateFooter(false, false, false, devices.length !== 0, false, false);

		btInfoSideBar = initBtInfo(SettingsPage);

		btList.SetData(devices.sort(sortBluetoothDevices));
		btList.Activate(true);
		btList.Show(true);
		if ( btList.Length() ) {
			btList.onFocus(btList.Current());
		}

		document.getElementById(as.page_list[as.page]).style.display = 'block';
		stbBluetooth.onDiscoveryStop = function () {
			btDiscoveredDevices = stbBluetooth.devices.slice();
			updateBluetoothPage();
			message.Show(false);
		};

		stbBluetooth.onDeviceRemoved = function ( device ) {
			btList.SetData(stbBluetooth.devices.sort(sortBluetoothDevices));
			btList.Activate(true);
			btList.Show(true);
		}

		SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, _('Disable Bluetooth'));
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
		if ( !manual && devices.length ) {
			// prevent to scan devices automatically on page load if device list is not empty
			SettingsPage.bpanel.Rename(SettingsPage.bpanel.btnRefresh, _('Search for devices'));
			SettingsPage.bpanel.Hidden(SettingsPage.bpanel.btnRefresh, false);
			return;
		}

		if ( stbBluetooth.startDiscovery() ) {
			message = new CModalHint(SettingsPage, _('Searching ...'), null, true);
			message.EventHandler = function ( event ) {
				event.preventDefault();
				if (event.code === KEYS.EXIT ) {
					message.Show(false);
					stbBluetooth.stopDiscovery();
					SettingsPage.bpanel.Rename(SettingsPage.bpanel.btnRefresh, _('Search for devices'));
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.btnRefresh, false);
					if ( message.timer ) {
						clearTimeout(message.timer);
					}
				}
			}
		} else {
			message = new CModalHint(SettingsPage, _('Scanning devices failed'), 2000, true);
			updateBluetoothPage();
		}
	}
}

function sortBluetoothDevices ( a, b ) {
	var sortResult = 0;

	if ( a.paired && !b.paired ) {
		sortResult = -1;
	} else if ( !a.paired && b.paired ) {
		sortResult = 1;
	} else if ( a.paired && b.paired ) {
		if ( a.active && !b.active ) {
			sortResult = -1;
		} else if ( !a.active && b.active) {
			sortResult = 1;
		} else {
			0
		}
	}

	return sortResult;
}

function updateBluetoothPage () {
	var devices = [];

	// hide all alements if async callback call update when bluetooth adapter is disabled
	if ( !stbBluetooth.enable ) {
		btList.SetData([]);
		updateFooter(false, false, false, false, false, false);
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
		SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, _('Enable Bluetooth'));
		return;
	}

	btList = new CBtList(SettingsPage, connectBluetoothDevice);
	btList.Init(SettingsPage.handle.querySelector('.cslist-main.bluetooth'));
	btInfoSideBar = initBtInfo(SettingsPage);
	devices = stbBluetooth.devices;
	btList.SetData(devices.sort(sortBluetoothDevices));
	btList.Activate(true);
	// if ( btList.Length() && !btList.isVisible ) {
	btList.Show(true);
	// }
	updateFooter(false, false, false, true, true, true);
	SettingsPage.bpanel.Rename(SettingsPage.bpanel.btnRefresh, _('Search for devices'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
	SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn,( stbBluetooth.enable ? _('Disable Bluetooth') : _('Enable Bluetooth')));
	if ( btList.Length() ) {
		btList.onFocus(btList.Current());
	}
}

function setBluetoothDeviceHandlers ( device ) {
	// pin request handler
	device.onPinProvide = function ( pin ) {
		btPinRequestModal = new CModalAlert(
			SettingsPage,
			_('Bluetooth pairing request'),
			_('Enter the code on your device: ' + pin + '<br>' +
				_('Note: After you type this code, you might need to press Enter, OK, or a similar button on your device')),
			_('Ok')
		);
	}

	// authentication handler
	device.onAuthentication = function ( status ) {
		if ( btPinRequestModal && btPinRequestModal.isVisible ) {
			btPinRequestModal.Show(false);
		}
		if ( !status ) {
			new CModalHint(SettingsPage, _('Bluetooth authentication failed'), 2000, true);
		}
	}

	// profiles handlers
	Object.keys(device.profiles).forEach(function ( profile ) {
		device.profiles[profile].onOpen = function ( state ) {
			if ( btPinRequestModal && btPinRequestModal.isVisible ) {
				btPinRequestModal.Show(false);
			}
			if ( SettingsPage.BCrumb.Tip().iid === 'bluetooth' ) {
				setTimeout(updateBluetoothPage, 400);
			}
			if ( state ) {
				if ( btConnectionFailedAlert && btConnectionFailedAlert.isVisible ) { btConnectionFailedAlert.Show(false); }
				new CModalHint(SettingsPage, _('Bluetooth device connected'), 2000);
			}
		}
		device.profiles[profile].onClose = function () {
			new CModalHint(SettingsPage, _('Bluetooth device disconnected'), 2000);

			if ( SettingsPage.BCrumb.Tip().iid === 'bluetooth' ) {
				setTimeout(updateBluetoothPage, 400);
			}
		}
	})

}

var toggleBluetoothEnableInterval = null;

function toggleBluetoothEnable () {
    var previousState = stbBluetooth.enable,
        currentTry    = 0;

    // toggle bluetooth enabled
    stbBluetooth.enable = !stbBluetooth.enable;
    // reset
    clearInterval(toggleBluetoothEnableInterval);
    toggleBluetoothEnableInterval = setInterval(function () {
        if ( currentTry++ <= 6 ) {
            if ( stbBluetooth.enable !== previousState ) {
                // changes was applied so now we can stop check and move on
                clearInterval(toggleBluetoothEnableInterval);
                gSTB.SetEnv(JSON.stringify({bluetoothAdapterEnable: stbBluetooth.enable}));

                if ( stbBluetooth.enable ) {
                    scanBluetoothLoad();
                } else {
                    btList.SetData([]);
                    updateFooter(false, false, false, false, false, false);
                    SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
                    SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, _('Enable Bluetooth'));
                    btInfoSideBar.Show(false, false);
                }
            }
        } else {
            // changes wasn't applied after 7*300ms - it looks like something bad happened
            clearInterval(toggleBluetoothEnableInterval);
            new CModalAlert(
                SettingsPage,
                _('Bluetooth') + ' ' + _('failed'),
                _('Failed to') + ' ' + (previousState ? _('disable') : _('enable')) + ' ' + _('bluetooth'),
                _('close')
            );
        }
    }, 300);
}

function connectBluetoothDevice () {
	var device = btList.Current().data;


	new CModalConfirm(
		SettingsPage,
		_('Connection'),
		_('Device ') + ' ' + (device.name || device.address) + ' ' + ( device.paired ? _('will be connected') : _('will be paired')),
		_('Cancel'),
		null,
		_('Connect'),
		function () {
			var profiles = Object.keys(device.profiles);

			if ( !profiles.length ) {
				new CModalAlert(
					SettingsPage,
					_('Connection failed'),
					_('This device type is not supported'),
					_('close')
				);
			} else {
				profiles.forEach(function ( profileName ) {
					if ( !device.profiles[profileName].open() ) {
						btConnectionFailedAlert = new CModalAlert(
							SettingsPage,
							_('Connection failed'),
							_('Connection to') + ' ' + (device.name || device.address) + ' ' + _('failed'),
							_('close')
						);
					}
				})
			}

		}
	);
}

function forgetBtDeviceHandler () {
	var device = btList.Current().data;

	new CModalConfirm(
		SettingsPage,
		_('Unpaire'),
		_('Device') + ' ' + (device.name || device.address) + ' ' +_('will be unpaired'),
		_('Cancel'),
		null,
		_('Forget'),
		function () {
			device.forget();
			setTimeout(updateBluetoothPage, 400);
		}
	);
}

function videoLoad () {
	var i = 0,
		size = configuration.videoOutputMode.length;
	/*jshint validthis: true */

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	saveFunction = videoSave;

	if ( SettingsPage.BCrumb.Tip().iid !== 'video' ) {
		SettingsPage.BCrumb.Push('', 'folder_tv.png', _('Video'), 'video');
	}

	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['tvsystem', 'graphicres']
	})));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	updateFooter(RULES['Video/More']);

	as.page = as.pages.ELEMENTS;
	navigationBackFunction = mainPageLoad;

	if ( configuration.videoOutputMode[0].translated ) {
		while ( i < size ) {
			if ( !configuration.videoOutputMode[i].translated ) {
				configuration.videoOutputMode[i].title = _(configuration.videoOutputMode[i].title);
				configuration.videoOutputMode[i].translated = true;
			}
			++i;
		}
	}

	var arr = [
		{element: 'select', title: _('Video output mode:'), option: configuration.videoOutputMode, selected: read.result.tvsystem || configuration.videoOutputMode[0].value, onChange: function () {
			navigation.elements[1].SetData(checkResolution());
			if ( navigation.elements[0].GetValue() === 'PAL' || navigation.elements[0].GetValue() === 'NTSC' || navigation.elements[0].GetValue() === '576p-50' ) {
				navigation.elements[1].SetIndex(0);
			} else {
				navigation.elements[1].SetIndex(2);
			}
		}},
		{element: 'select', title: _('Graphic resolution:'), option: checkResolution(read.result.tvsystem || configuration.videoOutputMode[0].value), selected: read.result.graphicres}
	];
	if ( model.toLowerCase() === 'mag200' ) {
		arr[0] = {element: 'select', title: _('Video output mode:'), option: [
			{value: 'PAL',      title: 'PAL (576i)'},
			{value: '576p-50',  title: '576p-50'},
			{value: '720p-50',  title: '720p-50'},
			{value: '1080i-50', title: '1080i-50'},
			{value: 'NTSC',     title: 'NTSC (480i)'},
			{value: '720p-60',  title: '720p-60'},
			{value: '1080i-60', title: '1080i-60'}
		], selected: read.result.tvsystem};
	}
	generateElements(arr);
	if ( read.result.graphicres !== navigation.elements[1].value ) {
		navigation.elements[1].value = read.result.graphicres;
	}
}

function videoSave () {
	var videoOutputMode = navigation.elements[0].value,
		graphicResolution = navigation.elements[1].value,
		graphicResAutoToTvSystemMap = {
			'Auto': 'tvsystem_res',
			'PAL': '720',
			'576p-50': '720',
			'NTSC': '720',
			'720p-50': '1280',
			'720p-60': '1280',
			'1080i-50': '1920',
			'1080p-50': '1920',
			'1080i-60': '1920',
			'1080p-60': '1920',
			'3840x2160p25': '1920',
			'3840x2160p30': '1920',
			'3840x2160p50': '1920',
			'3840x2160p60': '1920'
		},
		saveData = {},
		confirmTimeout = -1,
		confirmInterval = 1,
		timeoutToRollback = 15000,
		confirm = false;

	if ( read.result.graphicres === 'tvsystem_res' ) {
		read.result.graphicres = graphicResAutoToTvSystemMap[read.result.tvsystem];
	}

	if ( graphicResolution === 'tvsystem_res' )  {
		graphicResolution = graphicResAutoToTvSystemMap[videoOutputMode];
	}

	if ( videoOutputMode !== read.result.tvsystem ) {
		saveData.tvsystem = videoOutputMode;

		if ( typeof gSTB.SetDisplayMode === 'function' && graphicResolution === read.result.graphicres ) {
			confirm = true;
		}
	}

	if ( graphicResolution !== read.result.graphicres ) {
		saveData.graphicres = graphicResolution;
	}

	if ( (saveData.tvsystem && !saveData.graphicres) || confirm ) {
		if ( confirm ) {
			gSTB.SetDisplayMode(videoOutputMode, false);
			confirm = new CModalConfirm(SettingsPage, _('Confirm'),
				_('OK to confirm the new mode. <br> EXIT to return to the previous mode. <br> <br> Return to the previous mode after 15 seconds.'),
				_('Cancel'),
				function () {
					confirm = false;
					gSTB.SetDisplayMode(read.result.tvsystem, false);
					clearTimeout(confirmTimeout);
					clearInterval(confirmInterval);
					timeoutToRollback = 15000;
					setTimeout(videoLoad, 0);
				},
				_('Yes'),
				function () {
					confirm = false;
					saveData.graphicres = navigation.elements[1].value;
					gSTB.SetEnv(JSON.stringify(saveData));
					videoLoad();
					showSuccessfullySavedMessage();
					// reset video mode and player resolution data
					stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || 1, 'video.mode.reload', '{"manual": true}');
					clearTimeout(confirmTimeout);
					clearInterval(confirmInterval);
					timeoutToRollback = 15000;
				}
			);
			confirmInterval = setInterval(function () {
				var currentTime = timeoutToRollback / 1000;
				if ( confirm ) {
					confirm.content.innerHTML = confirm.content.innerHTML.replace(currentTime, currentTime - 1);
					timeoutToRollback -= 1000;
				}
			}, 1000);
			confirmTimeout = setTimeout(function () {
				if ( confirm ) {
					clearInterval(confirmInterval);
					gSTB.SetDisplayMode(read.result.tvsystem, false);
					confirm.Show(false);
					videoLoad();
					// reset video mode and player resolution data
					stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL) || 1, 'video.mode.reload', '');
				}
			}, timeoutToRollback);
			return false;
		} else {
			confirm = new CModalConfirm(SettingsPage, _('Confirm'),
				_('OK to confirm the new mode. <br> Confirmation will reboot the device. <br> EXIT to cancel.'),
				_('Cancel'),
				function () {
					var element = navigation.element,
						active = navigation.pre_elements[navigation.element],
						itemHeight = active.offsetHeight;

					setTimeout(function () {
						videoLoad();
						if ( element === navigation.element ) {
							return;
						}

						navigation.sub_element = 0;
						navigation.pre_elements[navigation.element].className = navigation.oldClass;
						navigation.element += 1;

						if ( active.offsetTop - active.parentNode.scrollTop >= (navigation.down[WINDOW_HEIGHT] - 1) * itemHeight ) {
							active.parentNode.scrollTop = active.parentNode.scrollTop + navigation.down[WINDOW_HEIGHT] * itemHeight;
						}

						navigation.oldClass = navigation.pre_elements[navigation.element].className;
						navigation.pre_elements[navigation.element].className += ' active';
						navigation.pre_elements[navigation.element].focus();
						navigation.elements[navigation.element].focus();
					}, 0);
				},
				_('Yes'),
				function () {
					confirm = false;
					gSTB.SetEnv(JSON.stringify(saveData));
					rebootDeviceConfirm();
				}
			);
		}
	} else {
		confirm = new CModalConfirm(SettingsPage, _('Confirm'),
			_('OK to confirm the new mode. <br> Confirmation will reboot the device. <br> EXIT to cancel.'),
			_('Cancel'),
			function () {
				var element = navigation.element,
					active = navigation.pre_elements[navigation.element],
					itemHeight = active.offsetHeight;

				setTimeout(function () {
					videoLoad();
					if ( element === navigation.element ) {
						return;
					}

					navigation.sub_element = 0;
					navigation.pre_elements[navigation.element].className = navigation.oldClass;
					navigation.element += 1;

					if ( active.offsetTop - active.parentNode.scrollTop >= (navigation.down[WINDOW_HEIGHT] - 1) * itemHeight ) {
						active.parentNode.scrollTop = active.parentNode.scrollTop + navigation.down[WINDOW_HEIGHT] * itemHeight;
					}

					navigation.oldClass = navigation.pre_elements[navigation.element].className;
					navigation.pre_elements[navigation.element].className += ' active';
					navigation.pre_elements[navigation.element].focus();
					navigation.elements[navigation.element].focus();
				}, 0);
			},
			_('Yes'),
			function () {
				confirm = false;
				gSTB.SetEnv(JSON.stringify(saveData));
				rebootDeviceConfirm();
			}
		);
	}

	return true;
}

function videoMoreLoad () {
	/*jshint validthis: true */

	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['auto_framerate', 'force_dvi']
	})));
	navigationBackFunction = videoLoad;
	saveFunction = videoMoreSave;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'videoMore' ) {
		SettingsPage.BCrumb.Push('', 'settings.png', _('More'), 'videoMore');
	}

	if ( read.result.auto_framerate === '' ) {
		read.result.auto_framerate = 'Disabled';
	}

	// type cast result to number
	read.result.force_dvi = Number(read.result.force_dvi);

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	var arr = [
		{element: 'select', title: _('Auto frame rate:'), option: [
			{value: 'Disabled', title: _('Disabled')} ,
			{value: '50_60', title: '50/60 Hz'},
			{value: '24_50_60', title: '24/50/60 Hz'},
			{value: '24_50', title: '24/50 Hz'},
			{value: '24_60', title: '24/60 Hz'}
		], selected: read.result.auto_framerate, onChange: function () {
			if ( alertFramerateMsg ) {
				new CModalAlert(SettingsPage, _('Notice'), _('During file playback, video output frame rate will be automatically adjusted<br/>according to played content.<br />Notes:<br />- works only with HDMI 720p/1080i/1080p video modes<br />- make sure your TV supports required video mode'), _('Close'));
				alertFramerateMsg = false;
			}
		}},
		{element: 'select', title: _('HDMI/DVI:'), option: [
			{value: 0, title: _('HDMI')},
			{value: 1, title: _('DVI')}
		], selected: read.result.force_dvi, onChange: function () {
			if ( alertHdmiMsg && navigation.elements[1].value === 1 ) {
				new CModalAlert(SettingsPage, _('Notice'), _('<span style=\'color: red\'>With option enabled in DVI mode<br/>HDMI audio will be missing</span>'), _('Close'));
				alertHdmiMsg = false;
			}
		}}
	];

	updateFooter();
	generateElements(arr);
}

function videoMoreSave () {
	var autoFrameRate = navigation.elements[0].value,
		HDMIDVI = navigation.elements[1].value,
		autoFrameRateFlag = false,
		frameRates = {
			'Disabled': 0,
			'50_60': 6,
			'24_50_60': 7,
			'24_50': 3,
			'24_60': 5
		},
		saveData = {};

	if ( autoFrameRate !== read.result.auto_framerate ) {
		autoFrameRateFlag = true;
		saveData.auto_framerate = autoFrameRate;
	}

	if ( HDMIDVI !== read.result.force_dvi ) {
		reload.device = true;
		saveData.force_dvi = HDMIDVI;
	}

	gSTB.SetEnv(JSON.stringify(saveData));

	if ( autoFrameRateFlag ) {
		gSTB.SetAutoFrameRate(frameRates[autoFrameRate]);
	}

	videoMoreLoad();
	setTimeout(showSuccessfullySavedMessage, 0);

	return true;
}


function advancedSettingsLoad ( MouseEvent, newLanguage, newTimeZone, newUPnP, newBufferSize ) {
	/*jshint validthis: true */

	var language = null,
		currentLanguage = null,
		availableLanguages = null,
		option = null,
		languagesOptions = [],
		languageChangeTimeout = null,
		selectedLanguage = null,
		timeZonesOptions = [],
		selectedTimeZone = null,
		elementsArray = null,
		i = null;

	navigationBackFunction = mainPageLoad;
	saveFunction = advancedSettingsSave;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['language', 'timezone_conf', 'upnp_conf', 'input_buffer_size', 'cec']
	})));

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'advancedSettings' ) {
		SettingsPage.BCrumb.Push('', 'folder_settings.png', _('Advanced settings'), 'advancedSettings');
	} else {
		SettingsPage.BCrumb.Pop();
		SettingsPage.BCrumb.Push('', 'folder_settings.png', _('Advanced settings'), 'advancedSettings');
	}

	currentLanguage = newLanguage || read.result.language;
	availableLanguages = gSTB.RDir('tempfile read languages_utf8.txt').split('\n');

	for ( i = 0; i < availableLanguages.length; i++ ) {
		if ( availableLanguages[i] !== '' ) {
			language = availableLanguages[i].split('\"');

			if ( language[1] === 'bg' || language[1] === 'es'  || language[1] === 'el' ) {
				continue;
			} else {
				option = {value: language[1], title: decodeURIComponent(escape(language[3]))};
			}

			if ( language[1] === currentLanguage ) {
				selectedLanguage = language[1];
			}

			languagesOptions.push(option);
		}
	}

	if ( read.result.timezone_conf === '' ) {
		read.result.timezone_conf = 'Europe/Kiev';
	}

	for ( i = 0; i < TIME_ZONES.length; i++ ) {
		option = {
			value: TIME_ZONES[i].id,
			title: (TIME_ZONES[i].name || TIME_ZONES[i].id)
		};

		if ( TIME_ZONES[i].id === read.result.timezone_conf ) {
			selectedTimeZone = newTimeZone || TIME_ZONES[i].id;
		}

		timeZonesOptions.push(option);
	}

	if ( !selectedTimeZone ) {
		option = {
			value: read.result.timezone_conf,
			title: read.result.timezone_conf
		};
		selectedTimeZone = read.result.timezone_conf;
		timeZonesOptions.push(option);
	}

	if ( read.result.upnp_conf === '' ) {
		read.result.rupnp_conf = 'off';
	}

	if ( read.result.upnp_conf === 'true' ) {
		read.result.rupnp_conf = 'lan';
	}

	if ( read.result.input_buffer_size === '' ) {
		read.result.input_buffer_size = 0;
	} else {
		read.result.input_buffer_size = parseInt(read.result.input_buffer_size, 10);
	}

	elementsArray = [
		{element: 'select', title: _('Language:'), option: languagesOptions, selected: selectedLanguage, 'default': read.result.language, onChange: function () {
			saveButtonActive = false;
			clearTimeout(languageChangeTimeout);
			languageChangeTimeout = setTimeout(function () {
				gettext.init({name: navigation.elements[0].value}, function () {
					advancedSettingsLoad(null, navigation.elements[0].value, navigation.elements[1].value, navigation.elements[2].value, navigation.elements[3].value);
				});
			}, 600);

		}},
		{element: 'select', title: _('Time zone:'), option: timeZonesOptions, selected: selectedTimeZone, 'default': read.result.timezone_conf},
		{element: 'select', title: _('UPnP client enabled:'), option: [
			{value: 'off', title: _('Disabled')},
			{value: 'lan', title: 'LAN'},
			{value: 'wlan', title: _('Wireless')}
		], selected: newUPnP || read.result.upnp_conf},
		{element: 'input_spec', type: 'text', title: _('Buffer size (ms):'), value: newBufferSize || read.result.input_buffer_size, interval: 100, maxsize: 20000}
	];

	if ( window.stbDisplayManager && stbDisplayManager.list.length && 'cec' in stbDisplayManager.list[0] ) {
		read.result.cec = read.result.cec === 'true';
		read.result.cec = read.result.cec ? true : stbDisplayManager.list[0].cec? 'once' : false;
		elementsArray.push({element: 'select', title: _('HDMI-CEC:'), option: [
			{value: false, title: _('Disabled')},
			{value: true, title: _('Enabled')},
			{value: 'once', title: _('Enable once')}
		], selected: read.result.cec });
	}

	generateElements(elementsArray);
	updateFooter(RULES['AdvancedSettings/more']);

	if ( newLanguage && newLanguage !== read.result.language ) {
		settChanges = 1;
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, false);
	} else {
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, true);
	}

	saveButtonActive = true;
}

function advancedSettingsSave () {
	var language = navigation.elements[0].value,
		timeZone = navigation.elements[1].value,
		UPnPClientEnabled = navigation.elements[2].value,
		bufferSize = navigation.elements[3].value,
		languageFlag = false,
		timeZoneFlag = false,
		UPnPClientEnabledFlag = false,
		bufferSizeFlag = false,
		randomNumber = null,
		keyboardFile = {layouts: [], order: []},
		saveData = {},
		cec, i;

	if ( language !== read.result.language ) {
		languageFlag = true;
		mainLang = language;
		saveData.language = language;
	}

	if ( timeZone !== read.result.timezone_conf ) {
		timeZoneFlag = true;
		saveData.timezone_conf = timeZone;
	}

	if ( UPnPClientEnabled !== read.result.upnp_conf ) {
		UPnPClientEnabledFlag = true;
		saveData.upnp_conf = UPnPClientEnabled;
	}

	if ( bufferSize !== read.result.input_buffer_size ) {
		bufferSizeFlag = true;
		saveData.input_buffer_size = bufferSize;
	}

	if ( navigation.elements[4] ) {
		cec = navigation.elements[4].value;
		if ( cec !== read.result.cec ) {
			switch ( cec ) {
				case 'once':
					saveData.cec = false;
					cec = true;
					break;
				default:
					saveData.cec = cec;
					break;
			}
		}
		for ( i = 0; i < stbDisplayManager.list.length; i++ ) {
			stbDisplayManager.list[i].cec = cec;
		}
	}

	gSTB.SetEnv(JSON.stringify(saveData));

	if ( languageFlag ) {
		reload.portal = true;
		gSTB.SetUiLang(mainLang);
		gSTB.SaveUserData('keyboard.json', JSON.stringify(keyboardFile));
		UpdatePage.RefreshPage();
		lang_clear();
	}

	if ( timeZoneFlag ) {
		gSTB.ExecAction('timezone ' + timeZone);
	}

	if ( UPnPClientEnabledFlag ) {
		if ( window.stbUPnP && saveData.upnp_conf === 'off' ) {
			stbUPnP.deinit();
		}
		gSTB.ServiceControl('upnp-service', 'restart');
	}

	if ( bufferSizeFlag ) {
		randomNumber = Math.floor(15360000 / 20000 * bufferSize);
		gSTB.SetBufferSize(bufferSize, randomNumber);
	}

	advancedSettingsLoad();
	setTimeout(showSuccessfullySavedMessage, 0);

	return true;
}

function advancedSettingsMoreLoad () {
	/*jshint validthis: true */

	var noticeMessage = true;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	saveFunction = advancedSettingsMoreSave;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['mount_media_ro', 'igmp_conf', 'mc_proxy_enabled', 'mc_proxy_url']
	})));

	if ( read.result.igmp_conf === '' ) {
		read.result.igmp_conf = 'V2';
	}

	gettext.init({name: mainLang}, function () {
		if ( SettingsPage.BCrumb.Tip().iid !== 'advancedSettingsMore' ) {
			SettingsPage.BCrumb.Push('', 'settings.png', _('More'), 'advancedSettingsMore');
		}
		document.getElementById(as.page_list[as.page]).style.display = 'none';
		as.page = as.pages.ELEMENTS;
		navigationBackFunction = advancedSettingsLoad;
		var arr = [
			{element: 'select', title: _('Storages access mode:'), option: [
				{title: _('full access'), value: 'false'},
				{title: _('read only'), value: 'true'}
			], selected: read.result.mount_media_ro || 'false', onChange: function () {
				if ( noticeMessage ) {
					new CModalHint(SettingsPage, _('This change will take effect after reboot'), 4000);
				}
				noticeMessage = false;
			}},
			{element: 'select', title: _('IGMP version:'), option: [
				{title: 'V2', value: 'V2'},
				{title: 'V3', value: 'V3'}
			], selected: read.result.igmp_conf},
			{element: 'checkbox', checked: read.result.mc_proxy_enabled, title: _('Multicast proxy enabled:'), onChange: function () {
				if ( this.value ) {
					navigation.elements[3].disabled = false;
					navigation.elements[3].className = 'elements wide500';
				} else {
					navigation.elements[3].disabled = true;
					navigation.elements[3].className = 'elements wide500 disabled';
				}
			}},
			{element: 'input', type: 'text', title: _('Multicast proxy URL:'), value: read.result.mc_proxy_url, disabled: read.result.mc_proxy_enabled !== 'true'}
		];

		updateFooter();
		generateElements(arr);
	});
}

function advancedSettingsMoreSave () {
	var storagesAccessMode = navigation.elements[0].value,
		IGMPVersion = navigation.elements[1].value,
		multicastProxyEnabled = navigation.elements[2].checked,
		multicastProxyURL = navigation.elements[3].value,
		saveData = {},
		errors = [],
		multicastProxyEnabledFlag = false,
		multicastProxyURLFlag = false;

	if ( storagesAccessMode !== read.result.mount_media_ro ) {
		reload.device = true;
		saveData.mount_media_ro = storagesAccessMode;
	}

	if ( IGMPVersion !== read.result.igmp_conf ) {
		saveData.igmp_conf = IGMPVersion;
	}

	if ( multicastProxyEnabled !== (read.result.mc_proxy_enabled === 'true' ? true : false) ) {
		multicastProxyEnabledFlag = true;
		saveData.mc_proxy_enabled = multicastProxyEnabled;
	}

	if ( multicastProxyURL !== read.result.mc_proxy_url ) {
		if ( multicastProxyURL === '' || validateUrl(multicastProxyURL) ) {
			multicastProxyURLFlag = true;
			saveData.mc_proxy_url = multicastProxyURL;
		} else {
			errors.push(_('Multicast proxy URL:').replace(':', ''));
		}
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Close'));
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));
		if ( multicastProxyEnabledFlag ) {
			gSTB.EnableMulticastProxy(multicastProxyEnabled);
		}
		if ( multicastProxyURLFlag ) {
			gSTB.SetMulticastProxyURL(multicastProxyURL);
		}
		advancedSettingsMoreLoad();
		setTimeout(showSuccessfullySavedMessage, 0);

		return true;
	}
}


function networkInfoLoad () {
	/*jshint validthis: true */

	var dict,
		model = gSTB.GetDeviceModelExt();

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	toSave = '';
	saveFunction = function () {
	};
	navigationBackFunction = mainPageLoad;
	if ( SettingsPage.BCrumb.Tip().iid !== 'networkInfo' ) {
		SettingsPage.BCrumb.Push('', 'folder_network_info.png', _('Network info'), 'networkInfo');
	}
	updateFooter();
	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.LIST;
	if ( list.lanInfo.length === 0 ) {
		list.lanInfo = [];
		switch ( model ) {
			case 'IM2100':
			case 'IM2100V':
			case 'IM2100VI':
			case 'IM2101':
			case 'IM2102':
			case 'MAG322':
			case 'MAG324':
			case 'MAG324C':
			case 'MAG325':
			case 'MAG349':
			case 'MAG350':
			case 'MAG351':
			case 'MAG352':
			case 'MAG256':
			case 'MAG257':
			case 'MAG420':
			case 'MAG422':
			case 'MAG424':
			case 'MAG425':
			case 'AuraHD4':
				dict = [
					{name: _('Wired (Ethernet)'), rId: 'NetworkInfo/Wired(Ethernet)', className: 'ico_folder', func: networkInfoWiredEthernetLoad},
					{name: _('Wireless (Wi-Fi)'), rId: 'NetworkInfo/Wireless(Wi-Fi)', className: 'ico_folder', func: networkInfoWirelessWiFiLoad}
				];
				break;
			default:
				dict = [
					{name: _('Wired (Ethernet)'), rId: 'NetworkInfo/Wired(Ethernet)', className: 'ico_folder', func: networkInfoWiredEthernetLoad},
					{name: _('PPPoE'), rId: 'NetworkInfo/PPPoE', className: 'ico_folder', func: networkInfoPPPoELoad},
					{name: _('Wireless (Wi-Fi)'), rId: 'NetworkInfo/Wireless(Wi-Fi)', className: 'ico_folder', func: networkInfoWirelessWiFiLoad}
				];
				break;
		}


		dict.forEach(function ( menuItem ) {
			if ( RULES[menuItem.rId] ) {
				list.lanInfo.push(menuItem);
			}
		});
	}
	generateList(list.lanInfo);
}

function networkInfoWiredEthernetLoad () {
	/*jshint validthis: true */
	var tt, tt1, tcur;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	toSave = '';
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.INFO;
	saveFunction = function () {
	};
	navigationBackFunction = networkInfoLoad;

	if ( SettingsPage.BCrumb.Tip().iid !== 'networkInfoWiredEthernet' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Wired (Ethernet)'), 'networkInfoWiredEthernet');
	}

	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['lan_noip', 'ipaddr_conf', 'dnsip']
	})));

	tt = gSTB.GetNetworkGateways();
	tt1 = gSTB.GetNetworkNameServers();

	if ( read.result.lan_noip !== 'true' ) {
		tcur = '';

		if ( !cIP(read.result.ipaddr_conf) ) {
			tcur = 'DHCP';

			if ( cIP(read.result.dnsip) ) {
				tcur += '(' + _('Manual DNS') + ')';
			}
		} else {
			tcur = _('Static IP');
		}
	} else {
		tcur = _('No config');
	}

	var arr = [
		{title: _('Current configuration')},
		{value: tcur},
		{title: _('Current status')},
		{title: _('Link status:'), value: gSTB.GetLanLinkStatus() ? 'UP' : 'DOWN'},
		{title: _('MAC address:'), value: gSTB.GetDeviceMacAddress()},
		{title: _('IP address:'), value: gSTB.RDir('IPAddress')},
		{title: _('Network mask:'), value: gSTB.RDir('IPMask')},
		{title: _('Gateway:'), value: tt === '' ? 'n/a' : tt.replace(/\r\n|\r|\n/g, ', ')},
		{title: _('DNS server:'), value: tt1 === '' ? 'n/a' : tt1.replace(/\r\n|\r|\n/g, ', ')}
	];

	updateFooter(false, false, false, false, true);
	generateTable(arr);
}

function networkInfoPPPoELoad () {
	/*jshint validthis: true */

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	toSave = '';
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.INFO;
	saveFunction = function () {
	};
	navigationBackFunction = networkInfoLoad;
	if ( SettingsPage.BCrumb.Tip().iid !== 'networkInfoPPPoE' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('PPPoE'), 'networkInfoPPPoE');
	}
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['pppoe_enabled', 'pppoe_login', 'pppoe_dns1']
	})));
	var tcur = '';
	if ( read.result.pppoe_enabled !== 'true' ) {
		tcur = _('Disabled');
	} else {
		tcur = read.result.pppoe_login;
	}
	var tip = gSTB.GetPppoeIp();
	var tt = gSTB.GetNetworkGateways();
	var tt1 = gSTB.GetNetworkNameServers();
	var arr = [
		{title: _('Current configuration')},
		{value: tcur},
		{title: _('Current status')},
		{title: _('Link status:'), value: gSTB.GetPppoeLinkStatus() ? 'UP' : 'DOWN'},
		{title: _('IP address:'), value: tip === '' ? 'n/a' : tip},
		{title: _('Gateway:'), value: tt === '' ? 'n/a' : tt.replace(/\r\n|\r|\n/g, ', ')},
		{title: _('DNS server:'), value: tt1 === '' ? 'n/a' : tt1.replace(/\r\n|\r|\n/g, ', ')}
	];
	updateFooter(false, false, false, false, true);
	generateTable(arr);
}

function networkInfoWirelessWiFiLoad () {
	/*jshint validthis: true */

	var tcur, tt, tt1, tmac, tip;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	toSave = '';
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.INFO;
	saveFunction = function () {
	};
	navigationBackFunction = networkInfoLoad;
	if ( SettingsPage.BCrumb.Tip().iid !== 'networkInfoWirelessWiFi' ) {
		SettingsPage.BCrumb.Push('', 'folder.png', _('Wireless (Wi-Fi)'), 'networkInfoWirelessWiFi');
	}
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['wifi_ssid', 'wifi_int_ip']
	})));
	tcur = '';
	tt = gSTB.GetNetworkGateways();
	tt1 = gSTB.GetNetworkNameServers();
	tcur = '"' + read.result.wifi_ssid + '" ( ';

	if ( cIP(read.result.wifi_int_ip) ) {
		tcur += _('Static IP') + ')';
	} else {
		tcur += 'DHCP)';
	}

	tmac = gSTB.GetNetworkWifiMac();
	tip = gSTB.RDir('WiFi_ip');
	var arr = [
		{title: _('Current configuration')},
		{value: tcur},
		{title: _('Current status')},
		{title: _('Link status:'), value: gSTB.GetWifiLinkStatus() ? 'UP' : 'DOWN'},
		{title: _('MAC address:'), value: tmac === '' ? 'n/a' : tmac},
		{title: _('IP address:'), value: tip === '' ? 'n/a' : tip},
		{title: _('Gateway:'), value: tt === '' ? 'n/a' : tt.replace(/\r\n|\r|\n/g, ', ')},
		{title: _('DNS server:'), value: tt1 === '' ? 'n/a' : tt1.replace(/\r\n|\r|\n/g, ', ')}
	];
	updateFooter(false, false, false, false, true);
	generateTable(arr);
}


function restartPortalLoad () {
	new CModalConfirm(SettingsPage, _('Confirm'), _('Restart portal?'), _('Cancel'), null, _('Yes'), restartPortalConfirm);
}

function restartPortalConfirm () {
	var portalWinId = parseInt(getWindowIdByName(WINDOWS.PORTAL) || getWindowIdByName(WINDOWS.PORTALS_LOADER) || 1),
		currentWinId = stbWebWindow.windowId(),
		windowList = JSON.parse(stbWindowMgr.windowList());
	document.body.style.display = 'none';
	gSTB.Stop();
	for ( var i = 0; i < windowList.result.length; i++ ) {
		if ( windowList.result[i] !== portalWinId && windowList.result[i] !== currentWinId ) {
			stbWindowMgr.closeWindow(windowList.result[i]);
		}
	}
	stbStorage.clear();
	stbWindowMgr.windowLoad(portalWinId, PATH_SYSTEM + 'pages/loader/index.html');
	stbWindowMgr.closeWindow(currentWinId);
}


function resetSettings () {
	new CModalConfirm(
		SettingsPage,
		_('Confirm'),
		_('Reset settings?'),
		_('Cancel'),
		null,
		_('Yes'),
		function () {
			reload.device = true;
			gSTB.ServiceControl('local-config', 'reset');
			stbStorage.removeItem(getWindowKey(WINDOWS.SYSTEM_SETTINGS));
		}
	);
}


var UpdatePage = {
	Init: function () {
		var self = this,
			update_types = [
				{value: 0, title: _('HTTP')},
				{value: 1, title: _('USB')}
			];
		if ( Update.CheckUpdateByMulticast() ) {
			update_types.push({value: 2, title: _('Multicast')});
		}
		if ( Update.CheckUpdateByTFTP() ) {
			update_types.push({value: 3, title: _('TFTP')});
		}
		this.web_update_url = this.GetWebUpdateUrl();
		this.UpdateModal = new CUpdateModal(SettingsPage, {
			log: true,
			select: false,
			update_url: this.web_update_url,
			info: false,
			header_text: _('Software update')
		});
		this.name = 'UpdatePage';
		this.$page = document.getElementById('update_page');

		this.$elements = this.$page.getElementsByClassName('type');

		this.$page.getElementsByClassName('update_type_title')[0].innerHTML = _('Update method:');
		this.$update_type = document.getElementById('update_type');
		this.$type_select = new CSelectBox(SettingsPage, {
			content: this.$page.getElementsByClassName('update_type')[0],
			data: update_types,
			nameField: 'title',
			idField: 'value',
			style: 'elements',
			events: {
				onChange: function () {
					switch ( this.GetValue() ) {
						case 0:
							self.ShowWeb();
							break;
						case 1:
							self.ShowUsb();
							break;
						case 2:
							self.ShowMulticast();
							break;
						case 3:
							self.ShowTFTP();
							break;
					}
				}
			}
		});

		var onMouseOver = function ( $item ) {
			return function () {
				self.Navigation.SetActive($item);
			};
		};

		Array.prototype.forEach.call(this.$page.getElementsByClassName('item'), function ( $item ) {
			$item.onmouseover = onMouseOver($item);
			/*$item.onmouseover = (function ( $item ) {
			 return function () {
			 self.Navigation.SetActive($item);
			 }
			 })($item)*/
		});

		// Update from web initialization
		this.$web_update_url = document.getElementById('web_update_url');
		this.$input_web_url = this.$web_update_url.getElementsByClassName('update_url')[0];

		// Update from usb initialization
		this.$usb_device = document.getElementById('usb_device');
		this.$usb_device.getElementsByClassName('title')[0].innerHTML = _('Disk:');
		this.$usb_device_select = new CSelectBox(SettingsPage, {
			content: this.$usb_device.getElementsByClassName('usb_device_select')[0],
			nameField: 'title',
			idField: 'value',
			style: 'elements',
			data: [
				{value: -1, title: _('No disk found')}
			]
		});
		this.$usb_update_url = document.getElementById('usb_update_url');
		this.$usb_update_url.getElementsByClassName('title')[0].innerHTML = _('Path:');
		this.$usb_device_update_url = this.$usb_update_url.getElementsByClassName('usb_device_update_url')[0];
		this.usb_update_url = '/' + model.toLowerCase() + '/imageupdate';
		this.$usb_device_update_url.value = this.usb_update_url;

		this.RefreshUsbDevices();
		this.ShowWeb();
	},
	RefreshUsbDevices: function () {
		getStorageInfo();
		var data = [], i;
		if ( STORAGE_INFO.length > 0 ) {
			for ( i = 0; i < STORAGE_INFO.length; i++ ) {
				data.push({value: STORAGE_INFO[i].mountPath, title: STORAGE_INFO[i].label});
			}
		} else {
			data = [
				{value: -1, title: _('No disk found')}
			];
		}
		this.$usb_device_select.SetData(data);
	},
	Navigation: {
		MoveUp: function () {
			var next = this.FindNext(-1);
			if ( next !== undefined ) {
				this.SetActive(next);
			}
		},
		MoveDown: function () {
			var next = this.FindNext(1);
			if ( next !== undefined ) {
				this.SetActive(next);
			}
		},
		SetActive: function ( active ) {
			if ( this.$active ) {
				this.$active.classList.remove('active');
			}

			this.$active = active;
			var input = this.$active.getElementsByClassName('elements')[0];
			if ( input === undefined ) {
				this.$active.focus();
			} else {
				input.focus();
			}
			this.$active.classList.add('active');
		},
		FindNext: function ( direction ) {
			var pointer = this.$active;
			while ( (pointer = ((direction === 1) ? pointer.nextElementSibling : pointer.previousElementSibling)) ) {
				if ( pointer.style.display !== 'none' ) {
					return pointer;
				}
			}
		}
	},
	onError: function ( errorStr, logStr, status ) {
		new CModalHint(SettingsPage, errorStr, 2000);
		this.UpdateModal.Update.trigger('onError', {
			errorMessage: errorStr,
			logMessage: logStr,
			status: status
		});
	},
	EventHandler: function ( event ) {
		switch ( event.code ) {
			case KEYS.UP:
				this.Navigation.MoveUp();
				event.preventDefault();
				break;
			case KEYS.DOWN:
				this.Navigation.MoveDown();
				event.preventDefault();
				break;
			case KEYS.OK:
				this.validate_function();
				break;
		}
		if ( this.Navigation.$active.id === 'usb_device' ) {
			this.$usb_device_select.EventHandler(event);
		} else if ( this.Navigation.$active.id === 'update_type' ) {
			this.$type_select.EventHandler(event);
		}
	},
	Show: function ( show ) {
		if ( show === false ) {
			mainPageLoad();
		} else {
			backElement[backIndex] = this && this.number ? this.number : 0;
			backIndex++;
			backElement[backIndex] = 0;
			document.getElementById(as.page_list[as.page]).style.display = 'none';
			this.UpdateModal.update_url = this.$input_web_url.value = this.web_update_url;
			this.$page.style.display = 'block';
			as.page = as.pages.UPDATE;
			SettingsPage.BCrumb.Push('', 'refresh.png', _('Software update'), 'updatePage');
			navigationBackFunction = mainPageLoad;
			this.Navigation.SetActive(this.$update_type);
			this.GenerateFooter();
		}
	},
	ShowWeb: function () {
		var self = this;
		this.ShowElements('web');
		this.validate_function = function () {
			if ( !URLC(self.UpdateModal.update_url = self.$input_web_url.value) ) {
				this.onError(_('Incorrect URL'), 'Incorrect URL', 28);
				return;
			}
			self.UpdateModal.Show(true);
		};
	},
	ShowUsb: function () {
		var self = this;
		this.ShowElements('usb');
		this.validate_function = function () {
			if ( self.$usb_device_select.GetValue() === -1 ) {
				this.onError(_('USB device not found!'), 'USB device not found!', 29);
				return;
			}
			self.UpdateModal.update_url = (self.$usb_device_select.GetValue() + self.$usb_device_update_url.value);
			self.UpdateModal.Show(true);
		};
	},
	ShowMulticast: function () {
		this.ShowElements('multicast');
		this.validate_function = function () {
			new CModalConfirm(SettingsPage, _('Warning'), _('<span class="alert">Warning!</span> The device will be rebooted and updated automatically.'), _('Cancel'), function () {
				this.Show(false);
			}, _('Update'), function () {
				if ( Update.StartMulticast(2000) ) {
					new CModalHint(SettingsPage, _('Starting update...'), false, true);
				} else {
					new CModalHint(SettingsPage, _('Some error occurred. Please, contact your operator.'), false);
				}
			});
		};
	},
	ShowTFTP: function () {
		this.ShowElements('tftp');
		this.validate_function = function () {
			new CModalConfirm(SettingsPage, _('Warning'), _('<span class="alert">Warning!</span> The device will be rebooted and updated automatically.'), _('Cancel'), function () {
				this.Show(false);
			}, _('Update'), function () {
				if ( Update.StartTFTP(2000) ) {
					new CModalHint(SettingsPage, _('Starting update...'), false, true);
				} else {
					new CModalHint(SettingsPage, _('Some error occurred. Please, contact your operator.'), false);
				}
			});
		};
	},
	ShowElements: function ( elements ) {
		Array.prototype.forEach.call(this.$elements, function ( element ) {
			element.style.display = element.classList.contains(elements) ? 'table' : 'none';
		});
	},
	GenerateFooter: function () {
		SettingsPage.bpanel.Rename(SettingsPage.bpanel.SaveBtn, _('Verify'));
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, false);
	},
	RefreshPage: function () {
		this.UpdateModal = new CUpdateModal(SettingsPage, {
			log: true,
			select: false,
			update_url: this.web_update_url,
			info: false,
			header_text: _('Software update')
		});
		this.$page.getElementsByClassName('update_type_title')[0].innerHTML = _('Update method:');
		this.$usb_device.getElementsByClassName('title')[0].innerHTML = _('Disk:');
		this.$usb_update_url.getElementsByClassName('title')[0].innerHTML = _('Path:');

		var update_types = [
			{value: 0, title: _('HTTP')},
			{value: 1, title: _('USB')}
		];
		if ( Update.CheckUpdateByMulticast() ) {
			update_types.push({value: 2, title: _('Multicast')});
		}
		if ( Update.CheckUpdateByTFTP() ) {
			update_types.push({value: 3, title: _('TFTP')});
		}

		this.$type_select.SetData(update_types);
		if ( STORAGE_INFO.length === 0 ) {
			this.$usb_device_select.SetData([
				{value: -1, title: _('No disk found')}
			]);
		}
	},
	GetWebUpdateUrl: function () {
		var data = JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['update_url']}))),
			webUpdateUrl = null;

		if ( data.result.update_url.indexOf('http://') === -1 && data.result.update_url.indexOf('https://') === -1 ) {
			webUpdateUrl = gSTB.GetDefaultUpdateUrl();
		} else {
			webUpdateUrl = data.result.update_url;
		}

		return webUpdateUrl;
	}
};


function serversLoad () {
	/*jshint validthis: true */

	var dict;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	navigationBackFunction = mainPageLoad;
	if ( SettingsPage.BCrumb.Tip().iid !== 'servers' ) {
		SettingsPage.BCrumb.Push('', 'folder_servers.png', _('Servers'), 'servers');
	}
	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.LIST;
	if ( list.servers.length === 0 ) {
		list.servers = [];

		if ( JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['custom_url_hider']}))).result.custom_url_hider === 'true' ) {
			RULES['Servers/Portals'] = false; // for backward compatibility purposes (look for 'custom_url_hider' environment variable)
		}

		dict = [
			{name: _('General'), rId: 'Servers/General', className: 'ico_folder_serversset', func: serversGeneralLoad},
			{name: _('Portals'), rId: 'Servers/Portals', className: 'ico_folder_serversset', func: serversPortalsLoad},
			{name: _('More'), rId: 'Servers/More', className: 'ico_folder_serversset', func: serversMoreLoad}
		];

		dict.forEach(function ( menuItem ) {
			if ( RULES[menuItem.rId] ) {
				list.servers.push(menuItem);
			}
		});
	}

	updateFooter();
	generateList(list.servers);
}

function serversGeneralLoad () {
	/*jshint validthis: true */

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	saveFunction = serversGeneralSave;
	navigationBackFunction = serversLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['ntpurl']
	})));

	if ( SettingsPage.BCrumb.Tip().iid !== 'serversGeneral' ) {
		SettingsPage.BCrumb.Push('', 'folder_serversset.png', _('General'), 'serversGeneral');
	}

	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	var arr = [
		{element: 'input', type: 'text', title: _('NTP server:'), value: read.result.ntpurl}
	];
	updateFooter();
	generateElements(arr);
}

function serversGeneralSave () {
	var NTPServer = navigation.elements[0].value,
		saveData = {},
		errors = [];

	if ( NTPServer !== read.result.ntpurl ) {
		if ( NTPServer === '' || validateUrl(NTPServer) ) {
			// reload.device = true;
			saveData.ntpurl = NTPServer;
		} else {
			errors.push(_('NTP server:').replace(':', ''));
		}
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));
		serversGeneralLoad();
		showSuccessfullySavedMessage();
		gSTB.ServiceControl('ntp', 'restart');
		return true;
	}
}

function serversPortalsLoad () {
	/*jshint validthis: true */

	// clean portals data if portal url is empty
	var file = '',
		saveTrigger = false,
		i, l;

	try {
		file = JSON.parse(gSTB.LoadUserData('portals.json'));
	} catch ( error ) {
		echo(error.code);
	}
	//
	if ( file !== '' ) {
		// if portal url is empty we should remove portal name and save changes
		for ( i = 0, l = file.portals.length; i < l; i++ ) {
			if ( file.portals[i].url === '' ) {
				file.portals[i].name = '';
				saveTrigger = true;
			}
		}
		if ( saveTrigger ) {
			gSTB.SaveUserData('portals.json', JSON.stringify(file));
			echo('force environmental vars set completed. New portals data file saved');
		}
	}

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	saveFunction = serversPortalsSave;
	navigationBackFunction = serversLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['portal1', 'portal2']
	})));
	// decode url (non-english url characters support)
	read.result.portal1 = decodeURI(read.result.portal1);
	read.result.portal2 = decodeURI(read.result.portal2);
	if ( SettingsPage.BCrumb.Tip().iid !== 'serversPortals' ) {
		SettingsPage.BCrumb.Push('', 'folder_serversset.png', _('Portals'), 'serversPortals');
	}
	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;

	if ( file === '' ) {
		portals = {enable: false, time: 60, def: 0, portals: []};
		for ( i = 0; i < 8; i++ ) {
			portals.portals[i] = {};
			portals.portals[i].name = '';
			portals.portals[i].url = '';
			portals.portals[i].enable = false;
		}
	} else {
		portals = file;
		echo(portals, portals);
		for ( i = 0; i < 8; i++ ) {
			if ( typeof portals.portals[i] !== 'object' ) {
				portals.portals[i] = {};
				portals.portals[i].name = '';
				portals.portals[i].url = '';
				portals.portals[i].enable = false;
			}
		}
	}
	var arr = [
		{ element: 'input', type: 'text', title: _('Portal 1 name'), value: portals.portals[0].name, disabled: portals.enable },
		{ element: 'input', type: 'text', title: _('Portal 1 URL'), value: read.result.portal1, disabled: portals.enable },
		{ element: 'input', type: 'text', title: _('Portal 2 name'), value: portals.portals[1].name, disabled: portals.enable },
		{ element: 'input', type: 'text', title: _('Portal 2 URL'), value: read.result.portal2, disabled: portals.enable }
	];

	if ( RULES['Servers/Portals/More'] ) {
		updateFooter(true);
	} else {
		updateFooter();
	}
	generateElements(arr);
}

function serversPortalsSave () {
	var portal1Name = navigation.elements[0].value,
		portal1URL = navigation.elements[1].value,
		portal2Name = navigation.elements[2].value,
		portal2URL = navigation.elements[3].value,
		writeData = false,
		saveData = {},
		errors = [];

	if ( portal1Name !== portals.portals[0].name ) {
		writeData = true;
		portals.portals[0].name = portal1Name;
	}

	if ( portal1URL === '' || validateUrl(portal1URL) ) {
		if ( portal1URL !== read.result.portal1 ) {
			saveData.portal1 = portal1URL;
		}
		if ( portal1URL !== portals.portals[0].url ) {
			writeData = true;
			portals.portals[0].url = portal1URL;
		}
	} else {
		errors.push(_('Portal 1 URL'));
	}

	if ( portal2Name !== portals.portals[1].name ) {
		writeData = true;
		portals.portals[1].name = portal2Name;
	}

	if ( portal2URL === '' || validateUrl(portal2URL) ) {
		if ( portal2URL !== read.result.portal2 ) {
			saveData.portal2 = portal2URL;
		}
		if ( portal2URL !== portals.portals[1].url ) {
			writeData = true;
			portals.portals[1].url = portal2URL;
		}
	} else {
		errors.push(_('Portal 2 URL'));
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));

		if ( writeData ) {
			navigation.reloadPortalsLoader = true;
			gSTB.SaveUserData('portals.json', JSON.stringify(portals));
		}

		serversPortalsLoad();
		showSuccessfullySavedMessage();

		return true;
	}
}

function serversPortalsMoreLoad ( noMessage ) {
	/*jshint validthis: true */
	var i;

	SettingsPage.multiportalDhcpError = false;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	checkInp = 1;
	butUdDownDisable = false;
	saveFunction = serversPortalsMoreSave;
	navigationBackFunction = serversPortalsLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['portal1', 'portal2', 'useExtPortalsPage', 'use_portal_dhcp', 'portal_dhcp']
	})));
	// decode url (non-english url characters support)
	read.result.portal1 = decodeURI(read.result.portal1);
	read.result.portal2 = decodeURI(read.result.portal2);
	if ( SettingsPage.BCrumb.Tip().iid !== 'serversPortalsMore' ) {
		SettingsPage.BCrumb.Push('', 'settings.png', _('More'), 'serversPortalsMore');
	}
	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	var file = gSTB.LoadUserData('portals.json');
	if ( file === '' ) {
		portals = {enable: false, time: 60, def: 0, portals: []};
		for ( i = 0; i < 8; i++ ) {
			portals.portals[i] = {};
			portals.portals[i].name = '';
			portals.portals[i].url = '';
			portals.portals[i].enable = false;
		}
	} else {
		portals = JSON.parse(file);
		echo(portals, portals);
		for ( i = 0; i < 8; i++ ) {
			if ( typeof portals.portals[i] !== 'object' ) {
				portals.portals[i] = {};
				portals.portals[i].name = '';
				portals.portals[i].url = '';
				portals.portals[i].enable = false;
			}
		}
	}
	var portLoadDelayArray = [
		{title: '3 ' + _('sec.'), value: '3'},
		{title: '5 ' + _('sec.'), value: '5'},
		{title: '10 ' + _('sec.'), value: '10'},
		{title: '30 ' + _('sec.'), value: '30'},
		{title: '1 ' + _('min.'), value: '60'},
		{title: '2 ' + _('min.'), value: '120'},
		{title: _('Without auto start'), value: '0'}
	];
	var arr = [
		{element: 'checkbox', checked: portals.enable, title: _('Multiportal mode:'), onChange: servers_hideElement},
		{element: 'select', title: _('Default portal:'), option: checkDefaultPortals(), selected: portals.def},
		{element: 'select', title: _('Portal load delay:'), option: portLoadDelayArray, selected: portals.time || 10},
		{element: 'input_check', type: 'text', title: _('Portal:'), value: 1, left: checkInputLeft, right: checkInputRight, interval: 1, maxsize: 8, minsize: 1, no_save: true},
		{element: 'checkbox', checked: portals.portals[0].enable, title: _('Use portal') + ' 1:', id: 'chPortal_1', sub_id: 'sub_chPortal_1', onChange: refreshDefaultPortals},
		{element: 'input', type: 'text', title: _('Name') + ' 1:', value: portals.portals[0].name, id: 'namePortal_1', sub_id: 'sub_namePortal_1', disabled: !portals.portals[0].enable},
		{element: 'input', type: 'text', title: _('URL') + ' 1:', value: portals.portals[0].url || read.result.portal1, id: 'urlPortal_1', sub_id: 'sub_urlPortal_1', disabled: !portals.portals[0].enable}
	];

	updateFooter();
	generateElements(arr);
	servers_hideElement(noMessage);
}

function serversPortalsMoreSave () {
	/*jshint -W018 */

	var useMultiportalsMode = navigation.elements[0].checked,
		defaultPortal = navigation.elements[1].value,
		portalLoadDelay = navigation.elements[2].value,
		usePortal = null,
		name = null,
		URL = null,
		URLElement = null,
		writeData = false,
		usePortalFlag = false,
		saveData = {},
		errors = [];

	if ( useMultiportalsMode !== read.result.useExtPortalsPage ) {
		saveData.useExtPortalsPage = useMultiportalsMode;
	}

	if ( useMultiportalsMode !== portals.enable ) {
		writeData = true;
		portals.enable = useMultiportalsMode;
	}

	if ( defaultPortal !== portals.def ) {
		writeData = true;
		portals.def = defaultPortal;
	}

	if ( portalLoadDelay !== portals.time ) {
		writeData = true;
		portals.time = portalLoadDelay;
	}

	for ( var i = 0; i < portals.portals.length; i++ ) {
		usePortal = document.getElementById('chPortal_' + (i + 1)).checked;
		name = document.getElementById('namePortal_' + (i + 1)).value;
		URL = document.getElementById('urlPortal_' + (i + 1)).value;
		URLElement = document.getElementById('urlPortal_' + (i + 1));

		if ( !usePortal !== portals.portals[i].enable ) {
			writeData = true;
			portals.portals[i].enable = usePortal;
		}

		if ( portals.portals[i].enable ) {
			usePortalFlag = true;
		}

		if ( name !== portals.portals[i].name ) {
			writeData = true;
			portals.portals[i].name = name;
		}

		if ( !URLElement.disabled ) {
			if ( URL && validateUrl(URL) ) {

				if ( i === 0 ) {
					if ( URL !== read.result.portal1 ) {
						saveData.portal1 = URL;
					}
				}

				if ( i === 1 ) {
					if ( URL !== read.result.portal2 ) {
						saveData.portal2 = URL;
					}
				}

				if ( URL !== portals.portals[i].url ) {
					writeData = true;
					portals.portals[i].url = URL;
				}
			} else {
				errors.push('URL ' + (i + 1));
			}
		}
	}

	if ( useMultiportalsMode && !usePortalFlag ) {
		errors.push(_('Not all required fields are filled.'));
	}

	if ( errors.length ) {
		if ( !usePortalFlag ) {
			new CModalAlert(SettingsPage, _('Notice'), errors.join(''), _('Cancel'));
		} else {
			new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
		}
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));

		if ( writeData ) {
			navigation.reloadPortalsLoader = true;
			gSTB.SaveUserData('portals.json', JSON.stringify(portals));
		}

		serversPortalsMoreLoad(true);
		showSuccessfullySavedMessage();

		return true;
	}
}

function serversMoreLoad () {
	/*jshint validthis: true */

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	saveFunction = serversMoreSave;
	navigationBackFunction = serversLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['use_portal_dhcp', 'portal_dhcp', 'bootstrap_url', 'update_url', 'update_channel_url']
	})));
	echo(read, 'read');
	if ( SettingsPage.BCrumb.Tip().iid !== 'serversMore' ) {
		SettingsPage.BCrumb.Push('', 'folder_serversset.png', _('More'), 'serversMore');
	}
	elclear(document.getElementById(as.page_list[as.page]));
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	var arr = [
		{element: 'checkbox', checked: read.result.use_portal_dhcp, title: _('Use DHCP portal:'), onChange: function () {
			if ( this.value ) {
				navigation.elements[1].disabled = false;
				navigation.elements[1].className = 'elements wide500';
			} else {
				navigation.elements[1].disabled = true;
				navigation.elements[1].className = 'elements wide500 disabled';
			}
		}},
		{element: 'input', type: 'text', title: _('DHCP portal:'), value: read.result.portal_dhcp, disabled: read.result.use_portal_dhcp !== 'true'},
		{element: 'input', type: 'text', title: _('Bootstrap URL:'), value: read.result.bootstrap_url},
		{element: 'input', type: 'text', title: _('Update URL:'), value: read.result.update_url},
		{element: 'input', type: 'text', title: _('Control channel URL:'), value: read.result.update_channel_url}
	];

	updateFooter();
	generateElements(arr);
}

function serversMoreSave () {
	var useDHCPPortal = navigation.elements[0].checked,
		DHCPPortal = navigation.elements[1].value,
		bootstrapURL = navigation.elements[2].value,
		updateURL = navigation.elements[3].value,
		controlChannelURL = navigation.elements[4].value,
		saveData = {},
		errors = [];

	if ( useDHCPPortal !== (read.result.use_portal_dhcp === 'true' ? true : false) ) {
		saveData.use_portal_dhcp = useDHCPPortal;
	}

	if ( DHCPPortal !== read.result.portal_dhcp ) {
		if ( DHCPPortal === '' || validateUrl(DHCPPortal) ) {
			//reload.device = true;
			saveData.portal_dhcp = DHCPPortal;
		} else {
			errors.push(_('DHCP portal:').replace(':', ''));
		}
	}

	if ( bootstrapURL !== read.result.bootstrap_url ) {
		if ( bootstrapURL === '' || validateUrl(bootstrapURL) ) {
			saveData.bootstrap_url = bootstrapURL;
		} else {
			errors.push(_('Bootstrap URL:').replace(':', ''));
		}
	}

	if ( updateURL !== read.result.update_url ) {
		if ( updateURL === '' || validateUrl(updateURL) ) {
			saveData.update_url = updateURL;
		} else {
			errors.push(_('Update URL:').replace(':', ''));
		}
	}

	if ( controlChannelURL !== read.result.update_channel_url ) {
		if ( controlChannelURL === '' || validateUrl(controlChannelURL) ) {
			saveData.update_channel_url = controlChannelURL;
		} else {
			errors.push(_('Control channel URL:').replace(':', ''));
		}
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv(JSON.stringify(saveData));
		serversMoreLoad();
		showSuccessfullySavedMessage();

		return true;
	}
}

function servers_hideElement ( noMessage ) {
	var i;

	if ( !navigation.elements[0].checked ) {
		for ( i = 1; i < 7; i++ ) {
			document.getElementsByClassName('item')[i].style.display = 'none';
		}
	} else {
		for ( i = 1; i < 7; i++ ) {
			document.getElementsByClassName('item')[i].style.display = 'table';
		}

		var arr = [], obj, tmpNavElemArray = [];

		for ( i = 2; i < 9; i++ ) {
			arr = arr.concat([
				{element: 'checkbox', checked: portals.portals[i - 1].enable, title: _('Use portal') + ' ' + i + ':', id: 'chPortal_' + i, sub_id: 'sub_chPortal_' + i, onChange: refreshDefaultPortals},
				{element: 'input', type: 'text', title: _('Name') + ' ' + i + ':', value: portals.portals[i - 1].name, id: 'namePortal_' + i, sub_id: 'sub_namePortal_' + i, disabled: !portals.portals[i - 1].enable},
				{element: 'input', type: 'text', title: _('URL') + ' ' + i + ':', value: (i === 2 && read.result.portal2) ? read.result.portal2 : portals.portals[i - 1].url, id: 'urlPortal_' + i, sub_id: 'sub_urlPortal_' + i, disabled: !portals.portals[i - 1].enable}
			]);
		}
		timer.checkLR = {};
		timer.backClass = {};
		obj = generateElements(arr, true, true);
		for ( i = 0; i < obj.length; i++ ) {
			obj[i].style.display = 'none';
		}
		var d = document.getElementById(as.page_list[as.page]).getElementsByClassName('list')[0];
		elchild(d, obj);
		navigation.elements.splice(4);
		tmpNavElemArray = d.getElementsByClassName('elements');

		for ( i = 4; i < tmpNavElemArray.length; i++ ) {
			navigation.elements.push(tmpNavElemArray[i]);
		}

		navigation.pre_elements = d.getElementsByClassName('item');
		// show warning (multi portals loading cannot work properly if dhcp portal enabled)

		if ( !SettingsPage.multiportalDhcpError && read.result.use_portal_dhcp && read.result.portal_dhcp ) {
			SettingsPage.multiportalDhcpError = true;
			if ( !noMessage ) {
				setTimeout(function () {
					new CModalAlert(currCPage, _('Warning'), _('For correct work of "Multiportal mode" it is necessary to turn off "Use DHCP portal" (System settings/Servers/More)'), _('Close'), null);
				}, 0);
			}
		}
	}
}


function audioLoad () {
	/*jshint validthis: true */

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'audio' ) {
		SettingsPage.BCrumb.Push('', 'folder_sound.png', _('Audio'), 'audio');
	}
	navigationBackFunction = mainPageLoad;
	saveFunction = audioSave;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['audio_initial_volume', 'audio_stereo_out_mode']
	})));

	if ( read.result.audio_initial_volume === '' ) {
		read.result.audio_initial_volume = 100;
	}

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	var arr = [
		{element: 'input_spec', type: 'text', title: _('Initial volume:'), value: read.result.audio_initial_volume, interval: 5, maxsize: 100},
		{element: 'select', title: _('Audio output mode:'), option: [
			{value: 'STEREO', title: _('Stereo')},
			{value: 'MONO', title: _('Mono')},
			{value: 'MONO_LEFT', title: _('Mono Left')},
			{value: 'MONO_RIGHT', title: _('Mono Right')},
			{value: 'LT_RT', title: 'Lt/Rt'}
		], selected: read.result.audio_stereo_out_mode}
	];

	updateFooter(RULES['Audio/More']);
	generateElements(arr);
}

function audioSave () {
	var initialVolume = navigation.elements[0].value,
		audioOutputMode = navigation.elements[1].value,
		audioOutputModeFlag = false,
		audioModes = {
			STEREO: 0,
			MONO: 1,
			MONO_LEFT: 2,
			MONO_RIGHT: 3,
			LT_RT: 4
		},
		saveData = {};

	if ( initialVolume !== read.result.audio_initial_volume ) {
		saveData.audio_initial_volume = initialVolume;
	}

	if ( audioOutputMode !== read.result.audio_stereo_out_mode ) {
		audioOutputModeFlag = true;
		saveData.audio_stereo_out_mode = audioOutputMode;
	}

	gSTB.SetEnv(JSON.stringify(saveData));

	if ( audioOutputModeFlag ) {
		gSTB.SetStereoMode(audioModes[audioOutputMode]);
	}

	audioLoad();
	showSuccessfullySavedMessage();

	return true;
}

function audioMoreLoad () {
	/*jshint validthis: true */

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'audioMore' ) {
		SettingsPage.BCrumb.Push('', 'settings.png', _('More'), 'audioMore');
	}

	navigationBackFunction = audioLoad;
	saveFunction = audioMoreSave;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['audio_dyn_range_comp', 'audio_operational_mode', 'audio_spdif_mode', 'audio_hdmi_audio_mode']
	})));

	if ( read.result.audio_spdif_mode === '' ) {
		read.result.audio_spdif_mode = 'BITSTEAM';
	}

	if ( read.result.audio_hdmi_audio_mode === '' ) {
		read.result.audio_hdmi_audio_mode = 'PCM';
	}

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	var arr = [
		// {element: 'select', title: _('Dynamic range compression:'), option: [
		// 	{value: 'OFF', title: _('Disabled')},
		// 	{value: '1', title: '1/8'},
		// 	{value: '2', title: '2/8'},
		// 	{value: '3', title: '3/8'},
		// 	{value: '4', title: '4/8'},
		// 	{value: '5', title: '5/8'},
		// 	{value: '6', title: '6/8'},
		// 	{value: '7', title: '7/8'},
		// 	{value: 'MAX', title: _('Max')}
		// ], selected: read.result.audio_dyn_range_comp},
		{element: 'select', title: _('Operating mode:'), option: [
			{value: 'RF_MODDE', title: 'RF Mode'},
			{value: 'LINE_MODE', title: 'Line Mode'}//,
			// {value: 'CUSTOM0', title: 'Custom 0'},
			// {value: 'CUSTOM1', title: 'Custom 1'}
		], selected: read.result.audio_operational_mode},
		{element: 'select', title: _('SPDIF Mode:'), option: [
			{value: 'PCM', title: 'PCM'},
			{value: 'BITSTEAM', title: 'Bitstream'}
		], selected: read.result.audio_spdif_mode},
		{element: 'select', title: _('HDMI Audio:'), option: [
			{value: 'PCM', title: 'PCM'},
			{value: 'SPDIF', title: 'SPDIF'}
		], selected: read.result.audio_hdmi_audio_mode}
	];

	updateFooter();
	generateElements(arr);
}

function audioMoreSave () {
	var //dynamicRangeCompression = navigation.elements[0].value,
		operationMode = navigation.elements[0].value,
		SPDIFMode = navigation.elements[1].value,
		HDMIAudio = navigation.elements[2].value,
		dynamicRangeCompressionFlag = false,
		operationModeFlag = false,
		SPDIFModeFlag = false,
		HDMIAudioFlag = false,
		operatingModes = {
			RF_MODDE: 0,
			LINE_MODE: 1,
			CUSTOM0: 2,
			CUSTOM1: 3
		},
		saveData = {};

	// if ( dynamicRangeCompression !== read.result.audio_dyn_range_comp ) {
	// 	dynamicRangeCompressionFlag = true;
	// 	saveData.audio_dyn_range_comp = dynamicRangeCompression;
	// }

	if ( operationMode !== read.result.audio_operational_mode ) {
		operationModeFlag = true;
		saveData.audio_operational_mode = operationMode;
	}

	if ( SPDIFMode !== read.result.audio_spdif_mode ) {
		SPDIFModeFlag = true;
		saveData.audio_spdif_mode = SPDIFMode;
	}

	if ( HDMIAudio !== read.result.audio_hdmi_audio_mode ) {
		HDMIAudioFlag = true;
		saveData.audio_hdmi_audio_mode = HDMIAudio;
	}

	gSTB.SetEnv(JSON.stringify(saveData));

	// if ( dynamicRangeCompressionFlag ) {
	// 	switch ( dynamicRangeCompression ) {
	// 		case 'OFF':
	// 			gSTB.SetDRC(0, 0);
	// 			break;
	// 		case 'MAX':
	// 			gSTB.SetDRC(255, 255);
	// 			break;
	// 		default:
	// 			dynamicRangeCompression = parseInt(dynamicRangeCompression, 10);
	// 			gSTB.SetDRC(dynamicRangeCompression * 31, dynamicRangeCompression * 31);
	// 			break;
	// 	}
	// }

	if ( operationModeFlag ) {
		gSTB.SetAudioOperationalMode(operatingModes[operationMode]);
	}

	if ( SPDIFModeFlag ) {
		gSTB.SetupSPdif(SPDIFMode === 'PCM' ? 1 : 2);
	}

	if ( HDMIAudioFlag ) {
		gSTB.SetHDMIAudioOut(HDMIAudio === 'SPDIF' ? 1 : 0);
	}

	audioMoreLoad();
	setTimeout(showSuccessfullySavedMessage, 0);

	return true;
}


function keyboardLayoutLoad () {
	/*jshint validthis: true */

	var array = [],
		keyboardFile,
		keyboardLayouts = [],
		langTitles = {
			ru: _('Russian'),
			uk: _('Ukrainian'),
			en: _('English'),
			de: _('German'),
			tr: _('Turkish'),
			ar: _('Arabic'),
			bg: _('Bulgarian'),
			el: _('Greek'),
			es: _('Spanish')
		},
		i,
		j;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'keyboardLayout' ) {
		SettingsPage.BCrumb.Push('', 'folder_keyboard_layout.png', _('Keyboard layout'), 'keyboardLayout');
	}
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	navigationBackFunction = mainPageLoad;
	saveFunction = keyboardLayoutSave;
	layoutsString = '';
	keyboardFile = gSTB.LoadUserData('keyboard.json');
	try {
		keyboardFile = JSON.parse(keyboardFile);
	} catch ( error ) {
		echo(error, 'keyboard.json parse');
	}
	if ( keyboardFile && keyboardFile.layouts && keyboardFile.layouts.length > 0 ) {
		for ( i = 0; i < keyboardFile.order.length; i++ ) {
			if(keyboardFile.order[i] !== 'es' && keyboardFile.order[i] !== 'el' && keyboardFile.order[i] !== 'bg'){
				keyboardLayouts.push({code: keyboardFile.order[i], title: langTitles[keyboardFile.order[i]]});
			}
		}

		for ( i = 0; i < keyboardLayouts.length; i++ ) {
			for ( j = 0; j < keyboardFile.layouts.length; j++ ) {
				if ( keyboardLayouts[i].code === keyboardFile.layouts[j] ) {
					keyboardLayouts[i].enable = true;
				}
			}
		}
	} else {
		var arr = [];

		for ( i = 0; i < keyboards[mainLang][0].length; i++ ) {
			if ( arr.indexOf(keyboards[mainLang][0][i]) === -1 ) {
				arr.push(keyboards[mainLang][0][i]);
			}
		}

		for ( i = 0; i < keyboards.codes.length; i++ ) {
			if ( arr.indexOf(keyboards.codes[i]) === -1 ) {
				arr.push(keyboards.codes[i]);
			}
		}

		for ( i = 0; i < arr.length; i++ ) {
			keyboardLayouts.push({code: arr[i], title: langTitles[arr[i]]});
		}

		for ( i = 0; i < keyboardLayouts.length; i++ ) {
			for ( j = 0; j < keyboards[mainLang].length; j++ ) {
				if ( keyboardLayouts[i].code === keyboards[mainLang][j][0] ) {
					keyboardLayouts[i].enable = true;
				}
			}
		}
	}

	for ( i = 0; i < keyboardLayouts.length; i++ ) {
		array[i] = {element: 'checkbox', title: _(keyboardLayouts[i].title) + ':', code: keyboardLayouts[i].code, checked: keyboardLayouts[i].enable};
		layoutsString += keyboardLayouts[i].code;
	}

	echo(layoutsString, '!!!! layoutsString !!!!');
	generateElements(array);
	updateFooter(false, false, true);
}

function keyboardLayoutSave () {
	var keyboardFile = {layouts: [], order: []};

	for ( var i = 0; i < navigation.elements.length; i++ ) {
		if ( navigation.elements[i].checked ) {
			keyboardFile.layouts.push(navigation.elements[i].code);
		}
		keyboardFile.order.push(navigation.elements[i].code);
	}

	layoutOrderChanged = false;
	gSTB.SaveUserData('keyboard.json', JSON.stringify(keyboardFile));
	keyboardLayoutLoad();

	if ( keyboardFile.layouts.length === 0 ) {
		new CModalHint(SettingsPage, _('None of the proposed layouts selected.<br>Layouts will be selected according to the location.'), 6000);
	} else {
		showSuccessfullySavedMessage();
	}

	return true;
}

function deviceInfoLoad () {
	/*jshint validthis: true */

	var version    = gSTB.GetDeviceImageVersion(),
		activeBank = gSTB.GetDeviceActiveBank(),
		t_model, imageDate, realActiveBank,
		jsApi = '0';

	if ( window.gSTB.Version ) {
		jsApi = gSTB.Version();
		if ( jsApi !== '' ) {
			jsApi = jsApi.split(';')[0].split(':')[1].trim();
		}
	}

	if ( realActiveBank = stbStorage.getItem('nandEmergencyLoadingLogs') ) {
		activeBank = (JSON.parse(realActiveBank) || '').bootmedia;
		// for user friendly purpose start bank counting from 1
		if ( activeBank === 'bank0' ) {
			activeBank = 'Bank 1';
		} else if ( activeBank === 'bank1' ) {
			activeBank = 'Bank 2';
		}
		activeBank = activeBank + ' (' + _('emergency mode') + ')';
	}

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	toSave = '';
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.INFO;
	saveFunction = function () {};
	navigationBackFunction = mainPageLoad;

	if ( SettingsPage.BCrumb.Tip().iid !== 'deviceInfo' ) {
		SettingsPage.BCrumb.Push('', 'device_info.png', _('Device info'), 'deviceInfo');
	}

	t_model = gSTB.GetDeviceModelExt ? gSTB.GetDeviceModelExt() : gSTB.GetDeviceModel();

	try {
		imageDate = JSON.parse(gSTB.GetEnv(JSON.stringify({ varList :['Image_Date']}))).result.Image_Date;
	} catch ( e ) {
		imageDate = '';
	}

	var arr = [
		{title: _('Model:'), value: t_model},
		{title: _('Serial number:'), value: gSTB.GetDeviceSerialNumber()},
		{title: _('MAC address:'), value: gSTB.GetDeviceMacAddress()},
		{title: _('Vendor:'), value: gSTB.GetDeviceVendor()},
		{title: _('Hardware version:'), value: gSTB.GetDeviceVersionHardware()},
		{title: _('Active bank:'), value: activeBank, valueClassName: (realActiveBank ? 'warning' : '')},
		{title: _('Image version:'), value: version},
		{title: _('Image description:'), value: gSTB.GetDeviceImageDesc()},
		{title: _('Image date:'), value: imageDate},
		{title: _('RootFS version:'), value: gSTB.GetDeviceImageVersionCurrent()},
		{title: _('JS API version:'), value: jsApi}
	];
	updateFooter();
	generateTable(arr);
}


function rebootDeviceLoad () {
	new CModalConfirm(SettingsPage, _('Confirm'), _('Device is going to reboot. Are you sure?'), _('Cancel'), null, _('Yes'), rebootDeviceConfirm);
}

function rebootDeviceConfirm () {
	gSTB.Stop();
	gSTB.ExecAction('reboot');
}


function clearUserDataLoad () {
	new CModalConfirm(
		SettingsPage,
		_('Confirm'),
		_('<span style="color: red">User data will be lost!</span><br>We strongly recommend read Menu Guide.<br>Do you want to do it?'),
		_('Cancel'), null,
		_('Yes'),
		function () {
			reload.portal = true;
			gSTB.ResetUserFs();
			setEnv('weather_place', '');
		}
	);
}


function remoteControlLoad () {
	/*jshint validthis: true */

	var elementsArray = null,
		remoteControlFileData = gSTB.LoadUserData('remoteControl.json');

	navigationBackFunction = mainPageLoad;
	saveFunction = remoteControlSave;

	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;

	backElement[backIndex] = this && this.number ? this.number : 0;
	backIndex++;
	backElement[backIndex] = 0;

	if ( SettingsPage.BCrumb.Tip().iid !== 'remoteControl' ) {
		SettingsPage.BCrumb.Push('', 'folder_remote_control.png', _('Remote control'), 'remoteControl');
	}

	try {
		remoteControlFileData = JSON.parse(remoteControlFileData);
	} catch ( error ) {
		echo(error, 'remoteControl.json parse');
	}

	elementsArray = [
		{element: 'checkbox', title: _('Use remote control:'), checked: remoteControlFileData.enable || false, onChange: function () {
			if ( this.value ) {
				navigation.elements[1].disabled = false;
				navigation.elements[1].className = 'elements wide500';
				navigation.elements[2].disabled = false;
				navigation.elements[2].className = 'elements wide500';
			} else {
				navigation.elements[1].disabled = true;
				navigation.elements[1].className = 'elements wide500 disabled';
				navigation.elements[2].disabled = true;
				navigation.elements[2].className = 'elements wide500 disabled';
			}
		}},
		{element: 'input', type: 'text', title: _('Device name:'), value: remoteControlFileData.deviceName || '', disabled: remoteControlFileData.enable !== true},
		{element: 'input', type: 'password', title: _('Password (numbers only):'), value: remoteControlFileData.password || '', disabled: remoteControlFileData.enable !== true}
	];

	generateElements(elementsArray);
	updateFooter();
}

function remoteControlSave () {
	var useRemoteControl = navigation.elements[0].checked,
		deviceName = navigation.elements[1].value,
		password = navigation.elements[2].value,
		saveData = {},
		errors = [];

	saveData.enable = useRemoteControl;

	if ( useRemoteControl ) {
		if ( deviceName ) {
			saveData.deviceName = deviceName;
		} else {
			errors.push(_('Device name'));
		}

		if ( password && !isNaN(parseInt(password, 10)) ) {
			saveData.password = password;
		} else {
			errors.push(_('Password'));
		}
	} else {
		saveData.deviceName = deviceName;
		saveData.password = password;
	}

	if ( errors.length ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + errors.join(', '), _('Cancel'));
	} else {
		gSTB.SaveUserData('remoteControl.json', JSON.stringify(saveData));
		gSTB.ConfigNetRc(deviceName, password);
		gSTB.SetNetRcStatus(useRemoteControl);
		remoteControlLoad();
		showSuccessfullySavedMessage();
	}
}


function wifi_keys ( pass ) {
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, true);
	backElement[backIndex] = 0;
	backIndex++;
	backElement[backIndex] = 0;
	saveFunction = wifi_keys_save;
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.GeneratePassBtn, false);
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	as.page = as.pages.ELEMENTS;
	navigationBackFunction = wiFiAuthenticationLoad;
	read = JSON.parse(gSTB.GetEnv(JSON.stringify({
		varList: ['wifi_wep_def_key', 'wifi_wep_key1', 'wifi_wep_key2', 'wifi_wep_key3', 'wifi_wep_key4']
	})));
	var arr = [
		{element: 'input', type: 'password', title: _('Passphrase:'), value: pass || ''},
		{element: 'select', title: _('Generate keys:'), option: [
				{title: _('WEP 64'), value: 1},
				{ title: _('WEP 128'), value: 2}
			]},
		// {element: 'button', onClick: gen64, title: '', value: _('Generate WEP 64 keys')},
		// {element: 'button', onClick: gen128, title: '', value: _('Generate WEP 128 keys')},
		{element: 'input', type: 'text', title: _('Default key') + ' (1-4):', value: read.result.wifi_wep_def_key},
		{element: 'input', type: 'password', title: _('Key') + ' 1 (5,10,13,26 ' + _('symbols') + '):', value: read.result.wifi_wep_key1},
		{element: 'input', type: 'password', title: _('Key') + ' 2 (5,10,13,26 ' + _('symbols') + '):', value: read.result.wifi_wep_key2},
		{element: 'input', type: 'password', title: _('Key') + ' 3 (5,10,13,26 ' + _('symbols') + '):', value: read.result.wifi_wep_key3},
		{element: 'input', type: 'password', title: _('Key') + ' 4 (5,10,13,26 ' + _('symbols') + '):', value: read.result.wifi_wep_key4}
	];
	generateElements(arr);
}

function gen64 () {
	var a = navigation.elements[0].value;
	if ( a.length >= 1 ) {
		var key = JSON.parse(gSTB.GetWepKey64ByPassPhrase(a));
		navigation.elements[3].value = key.result['wep64-key1'];
		navigation.elements[4].value = key.result['wep64-key2'];
		navigation.elements[5].value = key.result['wep64-key3'];
		navigation.elements[6].value = key.result['wep64-key4'];
	}
	else {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br />' + _('Passphrase:').replace(':', ''), _('Cancel'));
	}
}

function gen128 () {
	var a = navigation.elements[0].value;
	if ( a.length >= 1 ) {
		var key = JSON.parse(gSTB.GetWepKey128ByPassPhrase(a));
		navigation.elements[3].value = key.result['wep128-key1'];
		navigation.elements[4].value = key.result['wep128-key1'];
		navigation.elements[5].value = key.result['wep128-key1'];
		navigation.elements[6].value = key.result['wep128-key1'];
	}
	else {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br />' + _('Passphrase:').replace(':', ''), _('Cancel'));
	}
}

function wifi_keys_save () {
	var erm = [];
	var pars = /^[1-4]$/;
	toSave += toSave !== '' ? ',"wifi_psk":""' : '"wifi_psk":""';
	var t = navigation.elements[2].value;
	if ( t !== read.result.wifi_wep_def_key ) {
		if ( pars.test(t) ) {
			toSave += ',"wifi_wep_def_key":"' + t + '"';
		} else {
			erm[erm.length] = _('Default key');
		}
	}
	t = navigation.elements[3].value;
	var a = t.length;
	if ( t !== read.result.wifi_wep_key1 ) {
		switch ( t.length ) {
			case 5:
			case 13:
			case 10:
			case 26:
				toSave += ',"wifi_wep_key1":"' + t + '"';
				break;
			default :
				erm[erm.length] = _('Key') + ' 1';
		}
	}
	t = navigation.elements[4].value;
	if ( a === t.length ) {
		if ( t !== read.result.wifi_wep_key2 ) {
			switch ( t.length ) {
				case 5:
				case 13:
				case 10:
				case 26:
					toSave += ',"wifi_wep_key2":"' + t + '"';
					break;

				default :
					erm[erm.length] = _('Key') + ' 2';
			}
		}
	} else {
		erm[erm.length] = _('Key') + ' 2';
	}
	t = navigation.elements[5].value;
	if ( a === t.length ) {
		if ( t !== read.result.wifi_wep_key3 ) {
			switch ( t.length ) {
				case 5:
				case 13:
				case 10:
				case 26:
					toSave += ',"wifi_wep_key3":"' + t + '"';
					break;
				default :
					erm[erm.length] = _('Key') + ' 3';
			}
		}
	}
	else {
		erm[erm.length] = _('Key') + ' 3';
	}
	t = navigation.elements[6].value;
	if ( a === t.length ) {
		if ( t !== read.result.wifi_wep_key4 ) {
			switch ( t.length ) {
				case 5:
				case 13:
				case 10:
				case 26:
					toSave += ',"wifi_wep_key4":"' + t + '"';
					break;
				default :
					erm[erm.length] = _('Key') + ' 4';
			}
		}
	} else {
		erm[erm.length] = _('Key') + ' 4';
	}

	if ( erm.length > 0 ) {
		new CModalAlert(SettingsPage, _('Notice'), _('Following fields filled in incorrectly:') + '<br>' + erm.join(', '), _('Cancel'));
	} else {
		gSTB.SetEnv('{' + toSave + '}');
		gSTB.ServiceControl('wifi', 'restart');
		showSuccessfullySavedMessage();
		mainPageLoad();
	}
}

function checkInputLeft () {
	butUdDownDisable = true;
	check_portal();
}

function checkInputRight () {
	butUdDownDisable = true;
	check_portal();
}

function check_portal () {
	butDisable = true;
	var tmpNavElemArray = [];
	echo(checkInp, 'checkInp');
	var ch = document.getElementById('sub_chPortal_' + checkInp);
	var name = document.getElementById('sub_namePortal_' + checkInp);
	var url = document.getElementById('sub_urlPortal_' + checkInp);
	document.getElementById('chPortal_' + checkInp).className = '';
	document.getElementById('namePortal_' + checkInp).className = 'wide500';
	document.getElementById('urlPortal_' + checkInp).className = 'wide500';
	checkInp = navigation.elements[navigation.element].value;

	echo(checkInp, 'checkInp');
	var ch1 = document.getElementById('sub_chPortal_' + checkInp);
	var name1 = document.getElementById('sub_namePortal_' + checkInp);
	var url1 = document.getElementById('sub_urlPortal_' + checkInp);
	if ( document.getElementById('chPortal_' + checkInp).checked ) {
		document.getElementById('chPortal_' + checkInp).className = 'elements sub_active';
		document.getElementById('namePortal_' + checkInp).className = 'elements wide500 sub_active';
		document.getElementById('urlPortal_' + checkInp).className = 'elements wide500 sub_active';
	} else {
		document.getElementById('chPortal_' + checkInp).className = 'elements';
		document.getElementById('namePortal_' + checkInp).className = 'elements wide500 disabled';
		document.getElementById('urlPortal_' + checkInp).className = 'elements wide500 disabled';
	}
	ch.className = 'noitem';
	name.className = 'noitem';
	url.className = 'noitem';
	ch1.className = 'item';
	name1.className = 'item';
	url1.className = 'item';
	ch.style.display = 'none';
	name.style.display = 'none';
	url.style.display = 'none';
	ch1.style.display = '';
	name1.style.display = '';
	url1.style.display = '';
	var d = document.getElementById(as.page_list[as.page]).getElementsByClassName('list')[0];
	navigation.elements.splice(4);
	tmpNavElemArray = d.getElementsByClassName('elements');
	for ( var i = 4; i < tmpNavElemArray.length; i++ ) {
		navigation.elements.push(tmpNavElemArray[i]);
	}
	navigation.pre_elements = d.getElementsByClassName('item');
	butDisable = false;
	butUdDownDisable = false;
	if ( document.getElementById('chPortal_' + checkInp).checked ) {
		document.getElementById('chPortal_' + checkInp).className = 'elements';
		document.getElementById('namePortal_' + checkInp).className = 'elements wide500';
		document.getElementById('urlPortal_' + checkInp).className = 'elements wide500';
	} else {
		document.getElementById('chPortal_' + checkInp).className = 'elements';
		document.getElementById('namePortal_' + checkInp).className = 'elements wide500 disabled';
		document.getElementById('urlPortal_' + checkInp).className = 'elements wide500 disabled';
	}
}

function check_leng_ip () {
	/*jshint validthis: true */

	var tt = /^([0-9]+)$/;
	if ( tt.test(this.value) ) {
		if ( this.value > 255 ) {
			this.value = 255;
		}
		if ( this.value.length === 3 ) {
			if ( navigation.sub_element < 3 ) {
				navigation.sub_element++;
				setTimeout(ip_input_change, 50);
			} else if ( navigation.element < 3 ) {
				navigation.element++;
				navigation.sub_element = 0;
				setTimeout(ip_input_change, 50);
			}
		}
	} else {
		this.value = 0;
		if ( navigation.sub_element > 0 ) {
			navigation.sub_element--;
			setTimeout(ip_input_change, 50);
			return;
		} else if ( navigation.element > 0 ) {
			navigation.element--;
			navigation.sub_element = 3;
			setTimeout(ip_input_change, 50);
			return;
		}
		setTimeout(function () {
			document.activeElement.select();
		}, 50);
	}
}

function ip_input_change () {
	document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements' + navigation.element)[navigation.sub_element].focus();
}

function mouseOver () {
	/*jshint validthis: true */

	navigation.elements[navigation.element].className = navigation.oldClass;
	navigation.element = this.number;
	navigation.oldClass = navigation.elements[navigation.element].className;
	navigation.elements[navigation.element].className += ' active';
}

function mouse_over_element () {
	/*jshint validthis: true */

	if ( navigation.pre_elements[navigation.element] !== navigation.pre_elements[this.number] ) {
		navigation.pre_elements[navigation.element].className = navigation.oldClass;
		navigation.element = this.number;
		navigation.oldClass = navigation.pre_elements[navigation.element].className;
		navigation.pre_elements[navigation.element].className += ' active';
		navigation.pre_elements[navigation.element].focus();
		navigation.elements[navigation.element].focus();

		if ( SettingsPage.BCrumb.Tip().iid === 'keyboardLayout' ) {
			switch ( navigation.element ) {
				case 0:
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, true);
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
					break;
				case navigation.elements.length - 1:
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, true);
					break;
				default:
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
					SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
					break;
			}
		}
	}
}

function lang_clear () {
	var dict;
	list.main = [];
	list.lan = [];
	list.servers = [];
	list.lanInfo = [];
	list.lan_pppoe = [];
	list.lan_wifi = [];
	list.lan_wired = [];
	list.main = [];
	dict = [
		{name: _('Network'), rId: 'Network', className: 'network_settings', func: networkLoad},
		{name: _('Servers'), rId: 'Servers', className: 'servers', func: serversLoad},
		{name: _('Video'), rId: 'Video', className: 'video', func: videoLoad},
		{name: _('Audio'), rId: 'Audio', className: 'audio', func: audioLoad},
		{name: _('Advanced settings'), rId: 'AdvancedSettings', className: 'advSet', func: advancedSettingsLoad},
		{name: _('Keyboard layout'), rId: 'KeyboardLayout', className: 'keyboard_layout', func: keyboardLayoutLoad},
		{name: _('Network info'), rId: 'NetworkInfo', className: 'net_info', func: networkInfoLoad},
		{name: _('Device info'), rId: 'DeviceInfo', className: 'dev_info', func: deviceInfoLoad},
		{name: _('Restart portal'), rId: 'RestartPortal', className: 'reload', func: restartPortalLoad},
		{name: _('Reboot device'), rId: 'RebootDevice', className: 'reboot', func: rebootDeviceLoad},
		{name: _('Reset settings'), rId: 'ResetSettings', className: 'reset', func: resetSettings},
		{name: _('Clear user data'), rId: 'ClearUserData', className: 'clear_ico', func: clearUserDataLoad},
		{name: _('Software update'), rId: 'SoftwareUpdate', className: 'update', func: function () {
			UpdatePage.Show();
		}},
		{name: _('Remote control'), rId: 'RemoteControl', className: 'remoteControl', func: remoteControlLoad}
	];

	dict.forEach(function ( menuItem ) {
		if ( RULES[menuItem.rId] ) {
			list.main.push(menuItem);
		}
	});
}

function encoding_check () {
	var password = null,
		sub_password = null;

	// button = navigation.elements[4];
	// sub_button = navigation.pre_elements[4];
	password = navigation.elements[3];
	sub_password = navigation.pre_elements[3];

	switch ( navigation.elements[2].value ) {
		case 'none':
			password.className = 'elements_skip wide500';
			SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, true);
			sub_password.style.display = 'none';
			break;
		case 'tkip':
		case 'aes':
			password.className = 'elements wide500';
			SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, true);
			sub_password.style.display = 'table';
			break;
		case 'wep':
			SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, false);
			password.className = 'elements wide500';
			sub_password.style.display = 'table';
			break;
	}
	document.getElementById(as.page_list[as.page]).style.display = 'block';
	navigation.elements[navigation.element].focus();
}

function showSuccessfullySavedMessage () {
	new CModalHint(SettingsPage, _('Successfully saved'), 2000);
}

function checkResolution ( mode ) {
	var model = gSTB.GetDeviceModelExt(),
		resolutions,
		data = [];

	mode = mode || navigation.elements[0].GetValue();
	switch ( model ) {
		case 'IM2100':
		case 'IM2100V':
		case 'IM2100VI':
		case 'MAG322':
		case 'AuraHD4':
			resolutions = [
				{value: 'tvsystem_res', title: _('Same as video'), exceptions: ['3840x2160p25', '3840x2160p30', '3840x2160p50', '3840x2160p60']},
				{value: '720', title: '720x576', exceptions: []},
				{value: '1280', title: '1280x720', exceptions: ['PAL', 'NTSC', '576p-50']}
			];
			break;
		default:
			resolutions = [
				{value: 'tvsystem_res', title: _('Same as video'), exceptions: ['3840x2160p25', '3840x2160p30', '3840x2160p50', '3840x2160p60']},
				{value: '720', title: '720x576', exceptions: []},
				{value: '1280', title: '1280x720', exceptions: ['PAL', 'NTSC', '576p-50']},
				{value: '1920', title: '1920x1080', exceptions: ['PAL', 'NTSC', '576p-50', '720p-50', '720p-60']}
			];
			break;
	}
	resolutions.forEach(function ( res ) {
		if ( res.exceptions.indexOf(mode) === -1 ) {
			data.push(res);
		}
	});
	return data;
}

function checkDefaultPortals () {
	var portArray = [{
			title: _('Embedded portal'), value: '0'
		}],
		i = null;

	for ( i = 0; i < portals.portals.length; i++ ) {
		if ( portals.portals[i].enable === true ) {
			if ( portals.portals[i].name !== '' ) {
				portArray = portArray.concat([{
					title: _('Portal:') + ' ' + (i + 1) + ' (' + portals.portals[i].name + ')', value: (i + 1)
				}]);
			} else {
				portArray = portArray.concat([{
					title: _('Portal:') + ' ' + (i + 1), value: (i + 1)
				}]);
			}
		}
	}
	return portArray;
}

function refreshDefaultPortals () {
	/*jshint validthis: true */

	var id = this.id.replace('chPortal_', ''),
		portArray = [{
			title: _('Embedded portal'), value: '0'
		}],
		i = null;

	id -= 1;

	inputDisable(this);

	for ( i = 0; i < portals.portals.length; i++ ) {
		if ( i === id && portals.portals[i].enable !== this.checked ) {
			portals.portals[i].enable = this.checked;
		}

		if ( portals.portals[i].enable === true ) {
			if ( portals.portals[i].name !== '' ) {
				portArray = portArray.concat([
					{title: _('Portal:') + ' ' + (i + 1) + ' (' + portals.portals[i].name + ')', value: (i + 1)}
				]);
			} else {
				portArray = portArray.concat([
					{title: _('Portal:') + ' ' + (i + 1), value: (i + 1)}
				]);
			}
		}
	}

	navigation.elements[1].SetData(portArray);

	if ( !this.checked ) {
		navigation.elements[1].SetIndex(0);
	}
}

function inputDisable ( element ) {
	var id = element.id.replace('chPortal_', '');

	if ( !element.checked ) {
		document.getElementById('namePortal_' + id).disabled = true;
		document.getElementById('namePortal_' + id).className = 'elements wide500 disabled';
		document.getElementById('urlPortal_' + id).disabled = true;
		document.getElementById('urlPortal_' + id).className = 'elements wide500 disabled';
	} else {
		document.getElementById('namePortal_' + id).disabled = false;
		document.getElementById('namePortal_' + id).className = 'elements wide500';
		document.getElementById('urlPortal_' + id).disabled = false;
		document.getElementById('urlPortal_' + id).className = 'elements wide500';
	}
}

function generateList ( elementsArray ) {
	var div = element('div', {className: 'list'}),
		array = [],
		icon = null,
		text = null,
		i = null;

	settChanges = 0;
	navigation.element = backElement[backIndex];
	div.onscroll = function () {
		scrollPosition = div.scrollTop;
	};
	document.getElementById(as.page_list[as.page]).style.display = 'none';
	elclear(document.getElementById(as.page_list[as.page]));

	for ( i = 0; i < elementsArray.length; i++ ) {
		icon = element('div', {className: 'ico'});
		text = element('div', {className: 'text', innerHTML: '<div>' + elementsArray[i].name + '</div>'});
		array[i] = element('a', {
			className: elementsArray[i].className,
			href: '#',
			onclick: function ( event ) {
				if ( event ) {
					event.preventDefault();
				}

				this.handler();
			},
			handler: elementsArray[i].func,
			number: i,
			onmouseover: mouseOver
		}, [icon, text]);
	}

	elchild(div, array);
	elchild(document.getElementById(as.page_list[as.page]), div);
	navigation.elements = div.getElementsByTagName('a');
	navigation.oldClass = navigation.elements[navigation.element].className;
	navigation.elements[navigation.element].classList.toggle('active');
	document.getElementById(as.page_list[as.page]).style.display = 'block';
	navigation.elements[navigation.element].focus();

	if ( scrollPosition > 0 ) {
		navigation.elements[navigation.element].scrollIntoView();
	}
}

function updateFooter ( additionally, volumeUp, volumeDown, info, refresh, f2, f4 ) {
	SettingsPage.bpanel.Rename(SettingsPage.bpanel.AdditionalBtn, _('More'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AdditionalBtn, additionally !== true);
	SettingsPage.bpanel.Rename(SettingsPage.bpanel.SaveBtn, _('Save'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, true);
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.GeneratePassBtn, true);

	SettingsPage.bpanel.Rename(SettingsPage.bpanel.VolumeUp, _('Up'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, volumeUp !== true);
	SettingsPage.bpanel.Rename(SettingsPage.bpanel.VolumeDown, _('Down'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, volumeDown !== true);

	switch ( SettingsPage.BCrumb.Tip().iid ) {
		case 'wirelessWiFi':
		case 'wiredEthernet':
		case 'PPPoE':
			SettingsPage.bpanel.Rename(SettingsPage.bpanel.infoButton, _('Network info'));
			break;
		case 'wirelessAutoDHCP':
			SettingsPage.bpanel.Rename(SettingsPage.bpanel.infoButton, '');
			break;
	}
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.infoButton, info !== true);

	SettingsPage.bpanel.Rename(SettingsPage.bpanel.btnRefresh, _('Refresh'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.btnRefresh, refresh !== true);

	if ( SettingsPage.BCrumb.Tip().iid === 'wifi_password' && navigation.elements[1].value === 'open' && navigation.elements[2].value === 'none' ) {
		settChanges++;
		SettingsPage.bpanel.Rename(SettingsPage.bpanel.SaveBtn, _('Save'));
		SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, false);
	}

	SettingsPage.bpanel.Rename(SettingsPage.bpanel.AddNetworkBtn, _('Add network'));
	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.AddNetworkBtn, f2 !== true);

	SettingsPage.bpanel.Hidden(SettingsPage.bpanel.RemoveNetworkBtn, f4 !== true);

}


/**
 * preview side panel component
 * @return {CBase}
 */
function initInfo ( page ) {
	var component = new CBase(page);

	component.Init(page.handle.querySelector('.content .sbar'));
	component.Show(false, false);
	component.body = component.handle.querySelector('td.view');
	component.blkAll = component.handle.querySelector('div.block.all');
	component.valAll = component.blkAll.querySelector('span.value');
	component.blkAll.querySelector('span.title').innerHTML = _('Networks:');
	component.showAttr = 'table-cell';
	component.infoIcon = element('img', {align: 'left', src: PATH_IMG_PUBLIC + 'media/ico_info.png'});

	elchild(elclear(component.body), element('div', {}, [
		element('div', {}, [
			component.infoIcon,
			component.$info = element('div', {className: 'text'}, '')
		]),
		element('br'),
		element('div', {className: 'lbl'}, [_('SSID:'), component.$ssid = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Authentication mode:'), component.$authenticationMode = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Encryption:'), component.$encryption = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Frequency:'), component.$frequency = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Channel:'), component.$channel = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Signal info:'), component.$signalInfo = element('span', {className: 'txt'}, '')])
	]));

	component.onShow = function () {
		if ( wiFiList.activeItem ) {
			this.info(wiFiList.activeItem.data);
		}
	};

	component.SetItemsCount = function () {
		this.valAll.innerHTML = wiFiList.Length();
	};

	function showFields ( fields, show ) {
		Array.prototype.forEach.call(fields, function ( field ) {
			field.style.display = show === true ? 'block' : 'none';
		});
	}

	/**
	 * The main method of an item info display
	 * @param {Object} data media item inner data
	 */
	component.info = function ( data ) {
		var frequency, channel;

		showFields(component.body.querySelectorAll('.lbl'), true);

		frequency = data.rfInfo.substring((data.rfInfo.indexOf(':') + 1), data.rfInfo.indexOf('('));
		channel = data.rfInfo.substring((data.rfInfo.indexOf('l') + 1), data.rfInfo.indexOf(')'));

		// get item associated open action and execute
		component.$info.innerHTML = _('Detailed info on selected network');

		component.$ssid.innerHTML = data.ssid;
		component.$authenticationMode.innerHTML = data.auth;
		component.$encryption.innerHTML = data.enc;
		component.$frequency.innerHTML = frequency.trim();
		component.$channel.innerHTML = channel.trim();
		component.$signalInfo.innerHTML = data.signalInfo + ' dB';
		this.SetItemsCount();
	};

	return component;
}

function  initBtInfo ( page ) {
	var component = new CBase(page);
	component.Init(page.handle.querySelector('.content .sbar-bt'));
	component.Show(false, false);
	component.body = component.handle.querySelector('td.view');
	component.blkAll = component.handle.querySelector('div.block.all');
	component.valAll = component.blkAll.querySelector('span.value');
	component.blkAll.querySelector('span.title').innerHTML = _('Devices:');
	component.showAttr = 'table-cell';
	component.infoIcon = element('img', {align: 'left', src: PATH_IMG_PUBLIC + 'media/ico_info.png'});

	elchild(elclear(component.body), element('div', {}, [
		element('div', {}, [
			component.infoIcon,
			component.$info = element('div', {className: 'text'}, '')
		]),
		element('br'),
		element('div', {className: 'lbl'}, [_('Name:'), component.$name = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Address:'), component.$address = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Vendor Id:'), component.$vendorId = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Product Id:'), component.$productId = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Type:'), component.$type = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Paired:'), component.$paired = element('span', {className: 'txt'}, '')]),
		element('div', {className: 'lbl'}, [_('Active:'), component.$active = element('span', {className: 'txt'}, '')])
	]));

	component.onShow = function () {
		if ( btList.activeItem ) {
			this.info(btList.activeItem.data);
		}
	};

	component.SetItemsCount = function () {
		this.valAll.innerHTML = btList.Length();
	};

	function showFields ( fields, show ) {
		Array.prototype.forEach.call(fields, function ( field ) {
			field.style.display = show === true ? 'block' : 'none';
		});
	}

	/**
	 * The main method of an item info display
	 * @param {Object} data media item inner data
	 */
	component.info = function ( data ) {
		var status;

		showFields(component.body.querySelectorAll('.lbl'), true);


		// get item associated open action and execute
		component.$info.innerHTML = _('Detailed info on selected device');

		component.$name.innerHTML = data.name || 'n/a';
		// component.$title.innerHTML = data.title || 'n/a';
		component.$address.innerHTML = data.address || 'n/a';
		component.$vendorId.innerHTML = data.vendorId || 'n/a';
		component.$productId.innerHTML = data.productId || 'n/a';
		component.$type.innerHTML = data.type;
		component.$paired.innerHTML = data.paired ? _('Yes') : _('No');
		component.$active.innerHTML = data.active ? _('Yes') : _('No');

			this.SetItemsCount();
	};

	return component;
}
