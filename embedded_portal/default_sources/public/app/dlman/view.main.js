/**
 * download Manager main view handling
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

app.views.main = (function ( global, app ) {
	// declarations
	var module = {},  // current view
		remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

	/**
	 * main page creation
	 * @return {CPage}
	 */
	function initPage () {
		var component = new CPage();
		component.name = 'CPageMain';
		component.Init(document.body.querySelector('div.page.main'));
		component.$content = component.handle.querySelector('tr.content td.crop');
		/** @param {Event} event */
		component.EventHandler = function ( event ) {
			// component
			if ( module.page.searchBar.EventHandler(event) !== true ) {
				switch ( event.code ) {
					case KEYS.OK:
					case KEYS.PAGE_UP:
					case KEYS.PAGE_DOWN:
					case KEYS.UP:
					case KEYS.DOWN:
					case KEYS.LEFT:
					case KEYS.RIGHT:
					case KEYS.HOME:
					case KEYS.END:
						// bookmark list navigation
						module.page.lister.EventHandler(event);
						break;
					case 32:
						// space selects the current one
						module.actions.select(true);
						event.preventDefault();
						break;
					case KEYS.VOLUME_DOWN:
						module.actions.incPriority(-1);
						break;
					case KEYS.VOLUME_UP:
						module.actions.incPriority(1);
						break;
					case KEYS.MENU:
					case KEYS.INFO:
					case KEYS.F1:
					case KEYS.F2:
						// global keys
						module.page.buttonPanel.EventHandler(event);
						break;
					case KEYS.EXIT:
						module.page.exitButtonPanel.EventHandler(event);
						break;
					case KEYS.BACK:
						module.actions.remove();
						break;
					case KEYS.PLAY_PAUSE:
						module.actions.start();
						break;
					case KEYS.STOP:
						module.actions.stop();
				}
			}
		};
		return component;
	}

	/**
	 * header component
	 * @return {CBreadCrumb}
	 */
	function initBreadCrumb ( page ) {
		var component = new CBreadCrumb(page);
		component.showAttr = 'table-cell';
		component.Init(PATH_IMG_PUBLIC, page.handle.querySelector('.body .header .cbcrumb'));
		component.SetName(_('Download manager'));
		component.Push('/', 'ico_dm.png', '');
		return component;
	}

	/**
	 * header filter component
	 * @return {CFilterInput}
	 */
	function initSearchBar ( page ) {
		var timeout,
			component = new CFilterInput(page, {
				parent: page.handle.querySelector('.body .header .csbar'),
				folded: true,
				hint  : _('Enter part of download name...'),
				events: {
					onFold  : function () {
						page.breadCrumb.Show(true);
					},
					onUnfold: function () {
						page.breadCrumb.Show(false);
					},
					onEnter : function () {
						if ( this.GetValue() !== '' && page.lister.Length() !== 0 ) {
							page.lister.SetFilterText(this.GetValue());
							this.Fold(true);
							// add breadcrumb
							var item = page.breadCrumb.Tip();
							if ( item.iid === 'Filter' ) {
								page.breadCrumb.Pop();
							}
							if ( page.breadCrumb ) {page.breadCrumb.Push('/', 'media/ico_filter.png', this.GetValue(), 'Filter');}
						}
						return true;
					},
					onChange: function () {
						var self = this;
						clearTimeout(timeout);
						timeout = setTimeout(function () {
							page.lister.Focused(page.lister.FirstMatch(self.GetValue()), true, false);
						}, 400);
					}
				}
			});
		return component;
	}

	/**
	 * main content list component
	 * @return {CDownloadsList} page init
	 */
	function initLister ( page ) {
		var component = new CDownloadsList(page);
		component.Init(page.handle.querySelector('.body .content .cslist-main'));
		component.SetButtonPanel(page.buttonPanel);
		component.SetSearchBar(page.searchBar);
		component.onBack = module.actions.exit;
		component.onRemove = function () {
			if ( page.lister.Length() === 0 ) { module.actions.frame(false); }
		};

		app.models.main.downloads.forEach(function ( download ) {
				if ( download.state === 2 || download.state === 1 ) {
					module.actions.startTimer();
					return false;
				}
			}
		);

		// global event on usb mount/unmount
		function refreshStorageData () {
			echo('USB MOUNTED/UNMOUNTED');
			// get the list of all storages
			app.refreshStorageInfo();
			module.refreshDownloads();
		}

		// init events
		stbEvent.bind('player.end', function () {
			stbWindowMgr.windowShow(stbWebWindow.windowId());
		});
		stbEvent.bind('broadcast.storage.mount', function () {
			// show message on mount (at any time)
			setTimeout(function () {new CModalHint(currCPage, _('USB storage is connected'), 3000);}, 0);
			refreshStorageData();
		});
		stbEvent.bind('broadcast.storage.unmount', function () {
			var trash = [],
				real  = [],
				ind, path;

			app.refreshStorageInfo();
			// Storage was removed so find and delete tasks connected to this storage.
			for ( ind = 0; ind < STORAGE_INFO.length; ind++ ) {
				real.push(STORAGE_INFO[ind].mountPath); // collect real devices
			}
			for ( ind = 0; ind < app.models.main.downloads.length; ind++ ) {
				path = app.models.main.downloads[ind].mountPoint;
				if ( real.indexOf(path) === -1 && trash.indexOf(path) === -1 ) {
					trash.push(path);
					stbDownloadManager.InvalidateCatalog(path); // remove trash tasks
				}
			}
			module.refreshDownloads();
		});
		stbEvent.bind('add.download', function ( data ) {
			new CModalDownloadCreate(module.page, {url: data.data, fileName: decodeURIComponent(data.data).split('/').pop() });
		});

		return component;
	}

	/**
	 * exit bottom component
	 * @return {CButtonPanel}
	 */
	function initExitButtonPanel ( page ) {
		var component = new CButtonPanel(page);
		component.Init(remoteControlButtonsImagesPath, page.handle.querySelector('.body .footer .exit div.cbpanel-main'));
		component.btnExit = component.Add(KEYS.EXIT, 'exit.png', configuration.newRemoteControl ? _('Exit') : '', function () {
			module.actions.exit();
		});
		return component;
	}

	/**
	 * bottom line of buttons component
	 * @return {CButtonPanel}
	 */
	function initButtonPanel ( page ) {
		var component = new CButtonPanel(page);
		component.Init(remoteControlButtonsImagesPath, page.handle.querySelector('.body .footer .main div.cbpanel-main'));
		component.btnMenu = component.Add(KEYS.MENU, 'menu.png', configuration.newRemoteControl ? _('Menu') : '', function () {
			module.actions.menu();
		});
		component.btnFrame = component.Add(KEYS.INFO, 'info.png', _('Show<br>info panel'), function () {
			module.actions.frame();
		},app.models.main.downloads.length === 0);
		component.btnAdd = component.Add(KEYS.F1, 'f1.png', _('Add<br>download'), function () {
			if ( app.models.main.environmentData.result.mount_media_ro === 'true' ) {
				new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
			} else {
				module.actions.addDownload();
			}
		});
		component.btnSelect = component.Add(KEYS.F2, 'f2.png', _('Select'), function () {
			module.actions.select(true);
		}, app.models.main.downloads.length === 0);
		return component;
	}

	/**
	 * notification tray component
	 * @return {CBase}
	 */
	function initNotificationTray ( page ) {
		var component = new CBase(page);
		component.Init(page.handle.querySelector('.header .tray'));
		component.Show(false, false);
		component.showAttr = 'table-cell';
		component.iconBuffer = element('img', {className: 'copy'});
		component.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_copy.png';
		component.handleInner.appendChild(component.iconBuffer);
		return component;
	}

	/**
	 * preview side panel component
	 * @return {CBase}
	 */
	function initInfo ( page ) {
		var component = new CBase(page), size = window.width > 1000 ? 200 : 100,
			states = {
				'0': _('Paused '),
				'1': _('Waiting'),
				'2': _('Downloading'),
				'3': _('Completed'),
				'4': _('Error'),
				'5': _('Error')
			};
		component.Init(page.handle.querySelector('.content .sbar'));
		component.Show(false, false);
		component.body = component.handle.querySelector('td.view');
		component.blkAll = component.handle.querySelector('div.block.all');
		component.blkSel = component.handle.querySelector('div.block.sel');
		component.valAll = component.blkAll.querySelector('span.value');
		component.valSel = component.blkSel.querySelector('span.value');
		component.blkAll.querySelector('span.title').innerHTML = _('Downloads:');
		component.blkSel.querySelector('span.title').innerHTML = _('Selected:');
		component.showAttr = 'table-cell';
		component.infoIcon = element('img', {align: 'left', src: PATH_IMG_PUBLIC + 'media/ico_info.png'});

		// Create info element
		elchild(elclear(component.body), element('div', {}, [
			element('div', {}, [
				component.infoIcon,
				component.$info = element('div', {className: 'text'}, '')
			]),
			element('br'),
			element('div', {className: 'lbl'}, [_('File name:'), component.$fileName = element('span', {className: 'txt'}, '')]),
			element('div', {className: 'lbl'}, [_('URL:'), component.$url = element('span', {className: 'txt'}, '')]),
			element('div', {className: 'lbl'}, [_('Storage device:'), component.$device = element('span', {className: 'txt'}, '')]),
			element('div', {className: 'lbl'}, [_('State:'), component.$state = element('span', {className: 'txt'}, '')]),
			element('div', {className: 'lbl'}, [_('Priority:'), component.$priority = element('span', {className: 'txt'}, '')]),
			component.$size = element('div', {className: 'lbl'}, [_('Size:'), component.$totalSize = element('span', {className: 'txt'}, '')])
		]));

		component.onShow = function () {
			// there is an active item
			if ( module.page.lister.activeItem ) {this.info(module.page.lister.activeItem.data);}
		};

		component.SetItemsCount = function () {
			this.valAll.innerHTML = page.lister.Length();
		};

		component.SetSelectedCount = function ( count ) {
			this.valSel.innerHTML = count;
		};

		function prepareString ( str ) {
			//str = str.split('').join('\u200B');
			if ( str.length > size ) {str = str.substr(0, size - 1) + '...';}
			return str;
		}

		function ShowFields ( fields, show ) {
			Array.prototype.forEach.call(fields, function ( field ) {
				field.style.display = show === true ? 'block' : 'none';
			});
		}

		/**
		 * The main method of an item info display
		 * @param {Object} data media item inner data
		 */
		component.info = function ( data ) {
			if ( data.state === page.lister.backState ) {
				component.$info.innerHTML = _('Contains a list of items corresponding to the given filter request');
				ShowFields(component.body.querySelectorAll('.lbl'), false);
			} else {
				var deviceName = '';
				ShowFields(component.body.querySelectorAll('.lbl'), true);
				// get item associated open action and execute
				component.$info.innerHTML = _('Detailed info on selected download');
				app.models.storage.forEach(function ( device ) {
					if ( device.mountPath === data.mountPoint ) {deviceName = device.label;}
				});
				component.$fileName.innerHTML = prepareString(data.filePath.split('/').pop());
				component.$url.innerHTML = prepareString(data.url);
				component.$device.innerHTML = deviceName || data.mountPoint.split('/').pop();
				component.$state.innerHTML = states[data.state];
				component.$priority.innerHTML = data.prioLevel;
				if ( data.sizeTotal > 0 ) {
					component.$size.style.display = 'inline';
					component.$totalSize.innerHTML = prepareSize(data.sizeTotal);
				} else {
					component.$size.style.display = 'none';
				}
			}
			this.SetItemsCount();
		};

		return component;
	}

	function prepareSize ( size ) {
		if ( size > (1024 * 1024 * 1024) ) {
			return (Math.floor(size / 1024 / 1024 / 1024 * 100) / 100) + ' ' + _('GB');
		}
		if ( size > (1024 * 1024) ) {
			return (Math.floor(size / 1024 / 1024 * 100) / 100) + ' ' + _('MB');
		}
		if ( size > (1024) ) {
			return (Math.floor(size / 1024 * 100) / 100) + ' ' + _('KB');
		}
		return size + ' ' + _('B');
	}


	/**
	 * modal menu component
	 * @return {CModal}
	 */
	function initModalMenu ( page ) {
		// modal window with menu
		var component = new CModal(page);
		component.onShow = function () {
			// prepare
			var currentItem = page.lister.Current(),
				itemsAmount = page.lister.Length(),
				states = [];

			// set
			component.menu.gedit.slist.Hidden(component.menu.gedit.decprio, itemsAmount < 2);
			component.menu.gedit.slist.Hidden(component.menu.gedit.incprio, itemsAmount < 2);

			if ( itemsAmount === 0 || currentItem === undefined ) {
				component.menu.gedit.slist.Hidden(component.menu.gedit.iopen, true);
				component.menu.gedit.slist.Hidden(component.menu.gedit.istart, true);
				component.menu.gedit.slist.Hidden(component.menu.gedit.istop, true);
				component.menu.gedit.slist.Hidden(component.menu.gedit.ideselect, true);
				component.menu.gedit.slist.Hidden(component.menu.gedit.iinvert, true);
				component.menu.gedit.slist.Hidden(component.menu.gedit.iselone, true);
				component.menu.gedit.slist.Hidden(component.menu.gedit.iselall, true);
				component.menu.gedit.slist.Hidden(component.menu.gedit.idelete, true);
				component.menu.Hidden(component.menu.gsort, true);
				component.menu.Hidden(component.menu.gview, true);
			} else {
				component.menu.gedit.slist.Hidden(component.menu.gedit.iopen, !currentItem || (currentItem.data.state !== 3 && currentItem.data.state !== 6));
				component.menu.gedit.slist.Hidden(component.menu.gedit.istart, !currentItem || [0, 1, 4, 5].indexOf(currentItem.data.state) === -1);
				component.menu.gedit.slist.Hidden(component.menu.gedit.istop, !currentItem || currentItem.data.state !== 2);
				component.menu.gedit.slist.Hidden(component.menu.gedit.ideselect, !currentItem || (page.lister.states.marked || []).length === 0);
				component.menu.gedit.slist.Hidden(component.menu.gedit.iinvert, !currentItem || component.menu.gedit.ideselect.hidden);
				component.menu.gedit.slist.Hidden(component.menu.gedit.iselone, !currentItem || currentItem.data.state === 6);
				component.menu.gedit.slist.Hidden(component.menu.gedit.iselall, !currentItem || currentItem.data.state === 6 && itemsAmount === 1);
				component.menu.gedit.slist.Hidden(component.menu.gedit.idelete, !currentItem || currentItem.data.state === 6);
				component.menu.Hidden(component.menu.gsort, (itemsAmount === 1 || (itemsAmount === 2 && page.lister.filterText !== '')));

				page.lister.downloads.forEach(function ( download ) {
					if ( states.indexOf(page.lister.classNames[download.state]) === -1 ) {
						states.push(page.lister.classNames[download.state]);
					}
				});

				if ( states.length === 1 ) {
					component.menu.Hidden(component.menu.gview, true);
				} else {
					page.lister.classNames.forEach(function ( cl ) {
						component.menu.gview.slist.Hidden(component.menu.gview[cl], (states.indexOf(cl) === -1));
					});
					component.menu.Hidden(component.menu.gview, false);
				}
			}

			// always go to edit tab
			component.menu.Switch(component.menu.gedit);
			component.menu.Activate();
		};

		/**
		 * main side menu
		 * @type {CGroupMenu}
		 */
		component.menu = new CGroupMenu(component);
		component.menu.Init(page.handle.querySelector('div.cgmenu-main'));

		component.Init(element('div', {className: 'cmodal-menu'}, component.menu.handle));

		// mouse click on empty space should close modal menu
		component.handle.onclick = function () { component.Show(false); };

		component.EventHandler = function ( event ) {
			switch ( event.code ) {
				case KEYS.EXIT:
				case KEYS.MENU:
					page.modalMenu.Show(false);
					break;
				default:
					page.modalMenu.menu.EventHandler(event);
			}
		};

		// group
		component.menu.gedit = component.menu.AddGroup('gedit', _('Operations'), {
			onclick: function () {
				// close the menu and apply
				page.modalMenu.Show(false);
				// selected action id
				switch ( this.iid ) {
					case DOWNLOAD_ACTION_OPEN:
						page.lister.Current().onclick();
						break;
					case DOWNLOAD_ACTION_START:
						module.actions.start();
						break;
					case DOWNLOAD_ACTION_STOP:
						module.actions.stop();
						break;
					case DOWNLOAD_SELECT_ONE:
						module.actions.select(true);
						break;
					case DOWNLOAD_SELECT_ALL:
						// get each and mark
						page.lister.Each(function ( item ) {
							item.self.Marked(item, true);
						});
						break;
					case DOWNLOAD_DESELECT:
						// get each and unmark
						page.lister.Each(function ( item ) {
							item.self.Marked(item, false);
						});
						break;
					case DOWNLOAD_INVERT:
						// get each and invert
						page.lister.Each(function ( item ) {
							item.self.Marked(item, !item.marked);
						});
						break;
					case DOWNLOAD_ACTION_ADD:
						if ( app.models.main.environmentData.result.mount_media_ro === 'true' ) {
							new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
						} else {
							new CModalDownloadCreate(module.page);
						}
						break;
					case DOWNLOAD_ACTION_DELETE:
						module.actions.remove();
						break;
					case DOWNLOAD_ACTION_INC_PRIO:
						module.actions.incPriority(1);
						break;
					case DOWNLOAD_ACTION_DEC_PRIO:
						module.actions.incPriority(-1);
						break;
					case DOWNLOAD_ACTION_CLEAR_CACHE:
						echo('clear cache');
						new CModalHint(currCPage, _('Temporary files cleaning...'), 3000);
						module.actions.cleanCache();
						break;
				}
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gedit.iopen = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_OPEN, _('Open'), {icon: remoteControlButtonsImagesPath + 'ok.png'});
		component.menu.gedit.istart = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_START, _('Resume'), {icon: remoteControlButtonsImagesPath + 'playpause.png'});
		component.menu.gedit.istop = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_STOP, _('Stop'), {icon: remoteControlButtonsImagesPath + 'stop.png'});
		component.menu.gedit.iadditem = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_ADD, _('Add download'), {icon: remoteControlButtonsImagesPath + 'f1.png'});
		component.menu.gedit.incprio = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_INC_PRIO, _('Increase priority'), {icon: remoteControlButtonsImagesPath + 'volume_plus.png'});
		component.menu.gedit.decprio = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_DEC_PRIO, _('Decrease priority'), {icon: remoteControlButtonsImagesPath + 'volume_minus.png'});
		component.menu.gedit.iselone = component.menu.AddItem(component.menu.gedit, DOWNLOAD_SELECT_ONE, _('Select'), {icon: remoteControlButtonsImagesPath + 'f2.png'});
		component.menu.gedit.iselall = component.menu.AddItem(component.menu.gedit, DOWNLOAD_SELECT_ALL, _('Select all'));
		component.menu.gedit.ideselect = component.menu.AddItem(component.menu.gedit, DOWNLOAD_DESELECT, _('Deselect all'));
		component.menu.gedit.iinvert = component.menu.AddItem(component.menu.gedit, DOWNLOAD_INVERT, _('Invert selection'));
		component.menu.gedit.idelete = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_DELETE, _('Delete'), {icon: remoteControlButtonsImagesPath + 'back.png'});
		component.menu.gedit.idelcache = component.menu.AddItem(component.menu.gedit, DOWNLOAD_ACTION_CLEAR_CACHE, _('Clean temporary files'));

		component.menu.gview = component.menu.AddGroup('gview', _('View'), {
			onclick: function () {
				// find and unmark the previous item
				this.self.Marked(this.self.FindOne({marked: true}), false);
				// mark and focus the current one
				this.self.Marked(this, true);
				this.self.Focused(this, true);
				// close the menu and apply filter
				page.modalMenu.Show(false);
				// apply type filtering
				page.lister.SetFilterType(this.iid);
				page.lister.Activate(true);
			}
		});
		// group items
		component.menu.AddItem(component.menu.gview, DOWNLOAD_FILTER_NONE, _('All'), {marked: true, focused: true});
		component.menu.gview.done = component.menu.AddItem(component.menu.gview, DOWNLOAD_FILTER_DONE, _('Done'), {marked: false, focused: false});
		component.menu.gview.waiting = component.menu.AddItem(component.menu.gview, DOWNLOAD_FILTER_WAIT, _('Waiting'), {marked: false, focused: false});
		component.menu.gview.stopped = component.menu.AddItem(component.menu.gview, DOWNLOAD_FILTER_PAUSE, _('Paused'), {marked: false, focused: false});
		component.menu.gview.error = component.menu.AddItem(component.menu.gview, DOWNLOAD_FILTER_ERROR_1, _('Errors'), {marked: false, focused: false});

		// group
		component.menu.gsort = component.menu.AddGroup('gsort', _('Sorting'), {
			onclick: function () {
				// sort method differs from current
				page.lister.SetSortType(this.iid);
				// find and unmark the previous item
				this.self.Marked(this.self.FindOne({marked: true}), false);
				// mark and focus the current one
				this.self.Marked(this, true);
				this.self.Focused(this, true);
				// close the menu and apply sort
				page.modalMenu.Show(false);
				return false;
			}
		});
		// group items

		component.menu.gsort.istate = component.menu.AddItem(component.menu.gsort, DOWNLOAD_SORT_STATE, _('By state'), {focused: true, marked: true});
		component.menu.gsort.iname = component.menu.AddItem(component.menu.gsort, DOWNLOAD_SORT_NAME, _('By name'), {focused: false, marked: false});
		component.menu.gsort.isize = component.menu.AddItem(component.menu.gsort, DOWNLOAD_SORT_SIZE, _('By size'), {focused: false, marked: false});
		component.menu.gsort.ipriority = component.menu.AddItem(component.menu.gsort, DOWNLOAD_SORT_PRIORITY, _('By priority'), {focused: false, marked: false});

		// default group
		component.menu.Switch(component.menu.gedit);
		return component;
	}

	/**
	 * View initialization
	 */
	module.init = function () {
		gettext.init({name: getCurrentLanguage()}, function () {
			echo('ready', 'gettext.init');
			// create all components and fill everything
			module.fill();

			// prepare images to cache
			// buttons
			var imageList = ['exit.png', 'f1.png', 'f2.png', 'f4.png', 'playpause.png', 'menu.png', 'frame.png'].map(function ( image ) {
				return remoteControlButtonsImagesPath + image;
			});

			// backgrounds
			imageList = imageList.concat(['topmenu_bg.png', 'bottommenu_bg.png'].map(function ( image ) {
				return PATH_IMG_PUBLIC + 'backgrounds/' + image;
			}));

			// media
			imageList = imageList.concat(['type_90.png'].map(function ( image ) {
				return PATH_IMG_PUBLIC + 'media/' + image;
			}));
			// images has been loaded
			imageLoader(imageList, function () {
				echo('ready', module.page.name);
				module.show(); // show main page
			});
		});

	};

	/**
	 * View filling with components
	 */
	module.fill = function () {
		// page with its components creation and filling
		module.page = initPage();
		module.page.breadCrumb = initBreadCrumb(module.page);
		module.page.searchBar = initSearchBar(module.page);
		module.page.exitButtonPanel = initExitButtonPanel(module.page);
		module.page.buttonPanel = initButtonPanel(module.page);
		module.page.lister = initLister(module.page);
		module.page.preview = initInfo(module.page);
		module.page.tray = initNotificationTray(module.page);
		module.page.modalMenu = initModalMenu(module.page);

		// get downloads data
		module.page.lister.SetData(app.models.main.downloads);
		// set focus
		module.page.lister.Activate(true);
	};

	/**
	 * View is ready to display
	 */
	module.show = function () {
		// display main page
		module.page.Show(true);
		if ( accessControl.state && accessControl.data.pages.dlman ) {
			accessControl.showLoginForm(function () {
				if ( window.location.search !== '' ) {
					var url = encodeURI(decodeURI(window.location.href.split('?')[1]));
					echo(url, 'downloader should load');
					new CModalDownloadCreate(module.page, {url: url, fileName: decodeURI(url).split('/').pop()});
				}
			}, module.actions.exit);
		} else {
			if ( window.location.search !== '' ) {
				var url = encodeURI(decodeURI(window.location.href.split('?')[1]));
				echo(url, 'downloader should load');
				new CModalDownloadCreate(module.page, {url: url, fileName: decodeURI(url).split('/').pop()});
			}
		}
	};

	module.refreshDownloads = function () {
		var key, el, ids = [];
		app.models.main.load();
		app.models.main.downloads.forEach(function ( download ) {
			el = module.page.lister.indexed[download.id];
			ids.push(download.id.toString());
			if ( el !== undefined ) {
				if ( module.page.lister.activeItem === el && module.page.preview.isVisible ) {
					module.page.preview.info(download);
				}
				if ( el.data.state !== download.state ) {
					el.data.state = download.state;
					el.firstElementChild.className = module.page.lister.classNames[download.state];
				}
				if ( el.data.progressPct !== download.progressPct ) {
					el.data.progressPct = download.progressPct;
					el.querySelector('.progress').style.width = download.progressPct + '%';
				}
				el.data = download;
				el.data.markable = true;
			} else {
				module.page.lister.Refresh(false, app.models.main.downloads);
				module.page.lister.Reposition(download);
			}
		});
		for ( key in module.page.lister.indexed ) {
			if ( module.page.lister.indexed.hasOwnProperty(key) ) {
				if ( ids.indexOf(key) === -1 ) {
					if ( module.page.lister.indexed[key] === module.page.lister.activeItem ) {
						module.page.lister.Delete(module.page.lister.indexed[key], false);
						// fix focus after focused item deletion
						if ( app.models.main.downloads.length ) {
							module.page.lister.Reposition(app.models.main.downloads[0]);
						}
					} else {
						module.page.lister.Delete(module.page.lister.indexed[key], false);
					}
				}
			}
		}
		module.page.buttonPanel.Hidden(module.page.buttonPanel.btnFrame, module.page.lister.isVisible === false);
		module.page.buttonPanel.Hidden(module.page.buttonPanel.btnSelect, module.page.lister.isVisible === false || (module.page.lister.activeItem && module.page.lister.activeItem.data.state === module.page.lister.backState));
	};

	/**
	 * Global navigation key actions
	 * @namespace
	 */
	module.actions = {
		exit: function () {
			var item = module.page.breadCrumb.Tip();
			if ( item.iid === 'Filter' ) {
				module.page.breadCrumb.Pop();
				module.page.searchBar.Reset();
				module.page.lister.SetFilterText('');
				module.page.lister.Activate(true);
				module.page.lister.onFocus(module.page.lister.activeItem);
			} else {
				stbStorage.removeItem(getWindowKey(WINDOWS.DOWNLOAD_MANAGER));
				stbWebWindow.close(); // full exit
			}
		},

		frame: function ( state ) {
			state = state !== undefined ? state : !module.page.preview.isVisible;
			// invert visibility
			module.page.preview.Show(state, false);
			module.page.buttonPanel.Rename(module.page.buttonPanel.btnFrame, module.page.preview.isVisible ? _('Hide<br>info panel') : _('Show<br>info panel'));
			// apply helper css class (for long text trimming)
			module.page.preview.handle.parentNode.className = state ? 'preview' : '';
		},

		startTimer: function () {
			if ( this.interval === undefined ) {
				this.interval = setInterval(function () {
					module.refreshDownloads();
				}, 1000);
			}
		},

		start: function () {
			var items = module.page.lister.ActiveItems();
			items = items.sort(function ( itemL, itemR ) {
				return itemR.data.prioLevel - itemL.data.prioLevel;
			});
			items.forEach(function ( item ) {
				if ( item.data.state !== 3 ) {
					stbDownloadManager.StartJob(item.data.id);
				}
			});
			module.page.preview.info(module.page.lister.activeItem.data);
			module.refreshDownloads();
			this.startTimer();
		},

		stop: function () {
			var items = module.page.lister.ActiveItems();
			items.forEach(function ( item ) {
				if ( item.data.state !== 3 ) {
					stbDownloadManager.StopJob(item.data.id);
					item.firstElementChild.className = 'stopped';
					item.data.state = 0;
					if ( module.page.preview.isVisible ) {
						module.page.preview.info(item.data);
					}
				}
			});
			module.page.preview.info(module.page.lister.activeItem.data);
		},

		menu: function () {
			module.page.modalMenu.Show(true);
		},

		addDownload: function () {
			new CModalDownloadCreate(module.page);
		},

		select: function ( move ) {
			// check if action is permitted
			if ( !module.page.buttonPanel.btnSelect.data.hidden ) {
				// get affected item
				var item = module.page.lister.Current();
				if ( item.data.markable && module.page.lister.Marked(item, !item.marked) ) {
					// optional move to the next after marking
					if ( move !== false ) {module.page.lister.MoveNext(1);}
					module.page.lister.Focused(module.page.lister.Next());
				}
			}
		},

		remove: function () {
			// find all appropriate items
			var items = module.page.lister.ActiveItems();
			if ( items.length ) {
				new CModalDelete(module.page, items);
			}
		},

		cleanCache: function () {
			var allFiles = [],
				tmpFiles = [],
				trash = [],
				downloads = app.views.main.page.lister.downloads,
				registersTypes = configuration.registersTypes;

			STORAGE_INFO.forEach(function ( item ) { // all storages
				gSTB.SetListFilesExt('.' + registersTypes.join(' .') + ' .temp');
				allFiles = app.views.main.page.lister.ListDir(item.mountPath);  // all files in root
				gSTB.SetListFilesExt('.temp');
				tmpFiles = app.views.main.page.lister.ListDir(item.mountPath).files || [];  // all temp files in root
				trash = tmpFiles.filter(function ( item ) {
					for ( var i = 0; i < downloads.length; i++ ) {
						if ( item.name === downloads[i].tempFile ) { return false; }
					}
					return true;
				});
				if ( !allFiles.dirs.length && allFiles.files.length === trash.length ) {
					gSTB.RDir('RemoveDirFull "' + item.mountPath + '"');
				} else {
					trash.forEach(function ( itemL2 ) {
						gSTB.RDir('RemoveFile "' + item.mountPath + '/' + itemL2.name + '"');
					});
				}
			});

			gSTB.SetListFilesExt('.' + registersTypes.join(' .'));
		},

		incPriority: function ( inc ) {
			var items = module.page.lister.ActiveItems();
			if ( items.length ) {
				items.forEach(function ( item ) {
					module.page.lister.IncPriority(item, inc);
				});
			}
			module.page.preview.info(module.page.lister.activeItem.data);
		},

		tv: function () {
			// hide all menus
			module.page.handle.parentNode.style.backgroundColor = '#010101';
			stbWindowMgr.SetVirtualKeyboardCoord('none');
			stbWindowMgr.showPortalWindow();
		}
	};
	// export
	return module;
}(window, app));
