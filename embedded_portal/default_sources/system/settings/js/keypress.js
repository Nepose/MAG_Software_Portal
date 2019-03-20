'use strict';

var navigation = {
	element: 0,
	sub_element: 0,
	elements: [],
	pre_elements: [],
	oldClass: '',
	reloadPortalsLoader: false,
	down: {
		480: 4,
		576: 5,
		720: 5,
		1080: 5
	},
	down_wifi: {
		480: 7,
		576: 9,
		720: 9,
		1080: 9
	},

	pressKey: function ( event ) {
		var active,
			itemHeight,
			prev;

		if ( !eventPrepare(event, false, 'keypress.js pressKey') ) {
			return;
		}

		echo('keypress.js pressKey');
		echo(butDisable, 'butDisable: ');

		if ( document.activeElement.component instanceof CSimpleSelect ) {
			document.activeElement.component.EventHandler(event);

			if ( event.stopped === true ) {
				return;
			}
		}

		switch ( event.code ) {
			case KEYS.OK:
				if ( navigation.elements[navigation.element].type === 'checkbox' ) {
					if ( typeof navigation.elements[navigation.element].onchange === 'function' ) {
						navigation.elements[navigation.element].onchange();
					}

					if ( settChanges !== 0 ) {
						navigation.save();
					} else {
						if ( layoutOrderChanged && SettingsPage.BCrumb.Tip().iid === 'keyboardLayout' ) {
							navigation.save();
						}
					}

					event.preventDefault();
					break;
				} else if ( as.page === 0 && navigation.element === 0 ) {
					navigation.elements[navigation.element].onclick();
					event.preventDefault();
					break;
				} else {
					this.bpanel.EventHandler(event);
				}
				break;
			case KEYS.F1:
				this.bpanel.EventHandler(event);
				break;
			case KEYS.F2:
			case KEYS.F3:
			case KEYS.F4:
				this.bpanel.EventHandler(event);
				break;
			case KEYS.EXIT:
				navigation.exit_press();
				break;
			case KEYS.INFO:
				this.bpanel.EventHandler(event);
				break;
			case KEYS.REFRESH:
				event.preventDefault();
				this.bpanel.EventHandler(event);
				break;
		}
		switch ( as.page ) {
			case as.pages.UPDATE:
				UpdatePage.EventHandler(event);
				break;
			case as.pages.MAIN:
				active = navigation.elements[navigation.element];
				itemHeight = active.offsetHeight;

				switch ( event.code ) {
					case KEYS.UP:
						echo('UP');
						event.preventDefault();

						if ( navigation.element - 2 < 0 ) {
							break;
						}

						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element -= 2;

						if ( Math.floor(navigation.element / 2) * itemHeight < active.parentNode.scrollTop ) {
							active.parentNode.scrollTop = active.parentNode.scrollTop - navigation.down[WINDOW_HEIGHT] * itemHeight;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						break;
					case KEYS.DOWN:
						event.preventDefault();
						if ( navigation.element + 2 >= navigation.elements.length ) {
							break;
						}

						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element += 2;

						if ( active.offsetTop - active.parentNode.scrollTop >= (navigation.down[WINDOW_HEIGHT] - 1) * itemHeight ) {
							active.parentNode.scrollTop = active.parentNode.scrollTop + navigation.down[WINDOW_HEIGHT] * itemHeight;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						break;
					case KEYS.LEFT:
						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element -= 1;

						if ( navigation.element <= 0 ) {
							navigation.element = 0;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						event.preventDefault();
						break;
					case KEYS.RIGHT:
						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element += 1;

						if ( navigation.element >= navigation.elements.length ) {
							navigation.element = navigation.elements.length - 1;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						event.preventDefault();
						break;
					case KEYS.PAGE_DOWN:
						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element += navigation.down[WINDOW_HEIGHT] * 2;

						if ( navigation.element >= navigation.elements.length ) {
							navigation.element = navigation.elements.length - 1;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						event.preventDefault();
						break;
					case KEYS.PAGE_UP:
						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element -= navigation.down[WINDOW_HEIGHT] * 2;

						if ( navigation.element < 0 ) {
							navigation.element = 0;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						event.preventDefault();
						break;
				}
				break;
			case as.pages.LIST:
				if ( navigation.elements[0] === undefined ) {
					break;
				}

				switch ( event.code ) {
					case KEYS.UP:
						event.preventDefault();

						if ( navigation.element - 1 < 0 ) {
							break;
						}

						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element -= 1;
						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						break;
					case KEYS.DOWN:
						event.preventDefault();

						if ( navigation.element + 1 >= navigation.elements.length ) {
							break;
						}

						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element += 1;
						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						break;
					case KEYS.PAGE_DOWN:
						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element += navigation.down_wifi[WINDOW_HEIGHT];

						if ( navigation.element >= navigation.elements.length ) {
							navigation.element = navigation.elements.length - 1;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						event.preventDefault();
						break;
					case KEYS.PAGE_UP:
						navigation.elements[navigation.element].className = navigation.oldClass;
						navigation.element -= navigation.down_wifi[WINDOW_HEIGHT];

						if ( navigation.element < 0 ) {
							navigation.element = 0;
						}

						navigation.oldClass = navigation.elements[navigation.element].className;
						navigation.elements[navigation.element].className += ' active';
						navigation.elements[navigation.element].focus();
						event.preventDefault();
						break;
				}
				break;
			case as.pages.ELEMENTS:
				if ( navigation.elements[0] === undefined ) {
					break;
				}

				if ( !navigation.element ) {
					navigation.element = 0;
				}

				active = navigation.pre_elements[navigation.element];
				itemHeight = active.offsetHeight;

				switch ( event.code ) {
					case KEYS.UP:
						event.preventDefault();

						if ( butUdDownDisable ) {
							break;
						}

						if ( navigation.element - 1 < 0 ) {
							break;
						}

						prev = navigation.pre_elements[navigation.element - 1];

						if ( prev && prev.style.display === 'none' ) {
							break;
						}

						navigation.sub_element = 0;
						navigation.pre_elements[navigation.element].className = navigation.oldClass;
						navigation.element -= 1;

						if ( navigation.element * itemHeight < active.parentNode.scrollTop ) {
							active.parentNode.scrollTop = active.parentNode.scrollTop - navigation.down[WINDOW_HEIGHT] * itemHeight;
						}

						navigation.oldClass = navigation.pre_elements[navigation.element].className;
						navigation.pre_elements[navigation.element].className += ' active';
						navigation.pre_elements[navigation.element].focus();
						navigation.elements[navigation.element].focus();

						if ( SettingsPage.BCrumb.Tip().iid === 'keyboardLayout' ) {
							if ( navigation.element !== (navigation.elements.length - 1) ) {
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
							}

							if ( navigation.element === 0 ) {
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, true);
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
							}
						}
						break;
					case KEYS.DOWN:
						event.preventDefault();
						var next = navigation.pre_elements[navigation.element + 1];

						if ( butUdDownDisable ) {
							break;
						}

						if ( navigation.element + 1 >= navigation.elements.length || (next !== undefined && next.style.display === 'none') ) {
							break;
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

						if ( SettingsPage.BCrumb.Tip().iid === 'keyboardLayout' ) {
							if ( navigation.element !== 0 ) {
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
							}

							if ( navigation.element === (navigation.elements.length - 1) ) {
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
								SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, true);
							}
						}
						break;
					case KEYS.LEFT:
						switch ( (navigation.elements[navigation.element].tagName).toLowerCase() ) {
							case 'input':
								if ( (new RegExp('check')).test(navigation.elements[navigation.element].className) ) {
									event.preventDefault();
									checkInputLeft();
									break;
								}

								if ( (new RegExp('arrow')).test(navigation.elements[navigation.element].className) ) {
									event.preventDefault();
									/*specInputLeft();*/
									break;
								}

								if ( (new RegExp('sub_elements')).test(navigation.elements[navigation.element].className) ) {
									event.preventDefault();

									if ( navigation.sub_element > 0 ) {
										navigation.sub_element--;
									}

									document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements' + navigation.element)[navigation.sub_element].focus();
									break;
								}

								if ( navigation.elements[navigation.element].type === 'checkbox' ) {
									navigation.elements[navigation.element].checked = true;
								}

								break;
						}

						if ( typeof navigation.elements[navigation.element].onchange === 'function' ) {
							navigation.elements[navigation.element].onchange();
						}

						break;
					case KEYS.RIGHT:
						switch ( (navigation.elements[navigation.element].tagName).toLowerCase() ) {
							case 'input':
								if ( (new RegExp('check')).test(navigation.elements[navigation.element].className) ) {
									event.preventDefault();
									checkInputRight();
									break;
								}

								if ( (new RegExp('arrow')).test(navigation.elements[navigation.element].className) ) {
									event.preventDefault();
									/*specInputRight();*/
									break;
								}

								if ( (new RegExp('sub_elements')).test(navigation.elements[navigation.element].className) ) {
									event.preventDefault();

									if ( navigation.sub_element < 3 ) {
										navigation.sub_element++;
									}

									document.getElementById(as.page_list[as.page]).getElementsByClassName('sub_elements' + navigation.element)[navigation.sub_element].focus();
									break;
								}

								if ( navigation.elements[navigation.element].type === 'checkbox' ) {
									navigation.elements[navigation.element].checked = false;
								}

								break;
						}

						if ( typeof navigation.elements[navigation.element].onchange === 'function' ) {
							navigation.elements[navigation.element].onchange();
						}

						break;
					case KEYS.PAGE_UP:
					case KEYS.PAGE_DOWN:
						// jump to the next/previous item skipping page amount of items
						navigation.pre_elements[navigation.element].className = navigation.oldClass;
						navigation.element += navigation.down[WINDOW_HEIGHT] * (event.code === KEYS.PAGE_UP ? -1 : 1);

						if ( navigation.element < 0 ) {
							navigation.element = 0;
						} else if ( navigation.element > navigation.elements.length ) {
							navigation.element = navigation.elements.length - 1;
						}

						// correct visible view
						active.parentNode.scrollTop += (event.code === KEYS.PAGE_UP ? -1 : 1 ) * navigation.down[WINDOW_HEIGHT] * itemHeight;
						navigation.oldClass = navigation.pre_elements[navigation.element].className;
						navigation.pre_elements[navigation.element].className += ' active';
						navigation.pre_elements[navigation.element].focus();
						navigation.elements[navigation.element].focus();
						event.preventDefault();
						break;
					case KEYS.VOLUME_UP:
						if ( SettingsPage.BCrumb.Tip().iid === 'keyboardLayout' ) {
							navigation.changeLayoutPosition(true);
						}

						break;
					case KEYS.VOLUME_DOWN:
						if ( SettingsPage.BCrumb.Tip().iid === 'keyboardLayout' ) {
							navigation.changeLayoutPosition(false);
						}

						break;
					case KEYS.CHANNEL_NEXT:
					case KEYS.CHANNEL_PREV:
						event.preventDefault();
						break;
				}
				break;
			case as.pages.WIFI:
				wiFiList.EventHandler(event);
				break;
			case as.pages.BT:
				btList.EventHandler(event);
				break;
			case as.pages.INFO:
				switch ( event.code ) {
					case KEYS.PAGE_DOWN:
						break;
					case KEYS.PAGE_UP:
						break;
				}
				break;
			default:
				event.preventDefault();
				break;
		}
	},

	exit: function () {
		if ( reload.device ) {
			new CModalConfirm(SettingsPage, _('Confirm'), _('You have changed some settings.<br>To apply new settings it is necessary to reboot device.<br>Reboot now?'), _('Cancel'),
				function () {
					// unset and close system settings window
					stbStorage.removeItem(getWindowKey(WINDOWS.SYSTEM_SETTINGS));
					stbWebWindow.close();
				},
				_('Yes'), rebootDeviceConfirm);
			return;
		}

		if ( reload.portal ) {
			new CModalConfirm(SettingsPage, _('Confirmation'), _('You have changed some settings.<br>To apply new settings it is necessary to restart portal.<br>Restart now?'), _('Cancel'),
				function () {
					// unset and close system settings window
					stbStorage.removeItem(getWindowKey(WINDOWS.SYSTEM_SETTINGS));
					stbWebWindow.close();
				},
				_('Yes'), restartPortalConfirm);
			return;
		}

		// if portals data was changed we should reload portals loader window
		var portalsLoaderWinId = stbStorage.getItem(getWindowKey(WINDOWS.PORTALS_LOADER));

		if ( navigation.reloadPortalsLoader && portalsLoaderWinId ) {
			echo('reload portals loader page');
			gSTB.LoadURL(PATH_SYSTEM + 'pages/loader/index.html');
			// TODO: we should use stbWindowMgr.windowLoad() instead of gSTB.LoadURL()
		}

		// unset and close system settings window
		stbStorage.removeItem(getWindowKey(WINDOWS.SYSTEM_SETTINGS));
		stbWebWindow.close();
	},

	exit_press: function () {
		if ( as.page === as.pages.MAIN ) {
			navigation.exit();
		} else {
			if ( settChanges !== 0 && settChanges !== undefined || layoutOrderChanged ) {
				if ( SettingsPage.BCrumb.Tip().iid === 'wifi_password' && navigation.elements[1].value === 'open' && navigation.elements[2].value === 'none' ) {
					settChanges = 0;
					navigation.back();
				} else {
					myConfirm(_('Some settings have been changed'),
						function () {
							if ( navigation.save() ) {
								navigation.back();
							}
						},
						function () {
							if ( SettingsPage.BCrumb.Tip().iid === 'advancedSettings' ) {
								gettext.init({name: mainLang}, function () {
									advancedSettingsLoad.new_lang = null;
									navigation.back();
								});
							} else {
								setTimeout(navigation.back, 0);
							}
						}
					);
				}
			} else {
				clearTimeout(timer.checkLR);
				clearTimeout(timer.backClass);
				navigation.back();
			}
		}
	},

	back: function () {
		var tip;

		settChanges = 0;
		layoutOrderChanged = false;

		if ( as.page !== as.pages.MAIN ) {
			tip = SettingsPage.BCrumb.Tip();

			if ( tip && tip.iid !== 'serversPortalsMore' ) {
				backElement[backIndex] = 0;
				backIndex--;
				navigation.element = backElement[backIndex];
			}
		}

		if ( SettingsPage.BCrumb.Tip().iid !== 'advancedSettings' ) {
			SettingsPage.BCrumb.Pop();
		}

		navigationBackFunction();
	},

	save: function ( bool ) {
		if ( saveButtonActive ) {
			if ( saveFunction(bool) ) {
				var portalWinId = parseInt(getWindowIdByName(WINDOWS.PORTAL));
				settChanges = 0;

				if ( portalWinId ) {
					stbWebWindow.messageSend(portalWinId, 'environment.reload', '');
				}

				return true;
			}
		}

		return false;
	},

	// loads a page with additional options
	f1_press: function () {
		if ( SettingsPage.BCrumb.Tip().iid === 'WiFiAuthentication' ) {
			navigation.save(true);
			navigation.switch_load_page();

			return;
		}
		if ( settChanges !== 0 && settChanges !== undefined ) {
			myConfirm(_('Some settings have been changed'),
				function () {
					navigation.save();
					navigation.switch_load_page();
				},
				function () {
					if ( SettingsPage.BCrumb.Tip().iid === 'advancedSettings' ) {
						advancedSettingsLoad.new_lang = null;
						advancedSettingsLoad();
					}

					navigation.switch_load_page();
				}
			);
		} else {
			navigation.switch_load_page();
		}
	},

	// selects a page to load for f1_press function
	switch_load_page: function () {
		switch ( SettingsPage.BCrumb.Tip().iid ) {
			case 'video':
				videoMoreLoad();
				break;
			case 'audio':
				audioMoreLoad();
				break;
			case 'advancedSettings':
				advancedSettingsMoreLoad();
				break;
			case 'serversPortals':
				serversPortalsMoreLoad();
				break;
			case 'bluetooth':
				toggleBluetoothEnable();
				break;
			case 'wirelessAutoDHCP':
				toggleWifiEnable();
				break;
			case 'WiFiAuthentication':
				wifi_keys(navigation.elements[3].value);
				break;
		}
	},

	changeLayoutPosition: function ( state ) {
		var parentDiv = document.getElementById('elements_page').firstChild,
			listRow = parentDiv.getElementsByClassName('item'),
			currentLayouts = '';

		if ( state ) {
			if ( navigation.element !== 0 ) {
				parentDiv.insertBefore(listRow[navigation.element], listRow[navigation.element - 1]);
				navigation.element -= 1;
			}

			if ( navigation.element === 0 ) {
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, true);
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
			} else {
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
			}
		} else {
			if ( navigation.element !== (listRow.length - 1) ) {
				listRow[navigation.element + 1].parentNode.insertBefore(listRow[navigation.element], listRow[navigation.element + 1].nextSibling);
				navigation.element += 1;
			}

			if ( navigation.element === (listRow.length - 1) ) {
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, true);
			} else {
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeUp, false);
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.VolumeDown, false);
			}
		}

		navigation.elements = parentDiv.getElementsByClassName('elements');
		navigation.elements[navigation.element].focus();

		for ( var i = 0; i < navigation.elements.length; i++ ) {
			currentLayouts += navigation.elements[i].code;
			listRow[i].number = i;
		}

		if ( currentLayouts !== layoutsString ) {
			layoutOrderChanged = true;
			SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, false);
		} else {
			layoutOrderChanged = false;

			if ( settChanges === 0 ) {
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, true);
			} else {
				SettingsPage.bpanel.Hidden(SettingsPage.bpanel.SaveBtn, false);
			}
		}

		currentLayouts = '';
	}
};
