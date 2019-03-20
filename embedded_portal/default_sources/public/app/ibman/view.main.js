/**
 * Internet Bookmarks Manager main view handling
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * @namespace
 */
app.views.main = (function ( global, app ) {
	// declarations
	var module = {},  // current view
		screenBoundsA = {  // web window sizes for windowed mode
			480  : {x:47, y:87,  w:640,  h:305},
			576  : {x:55, y:86,  w:637,  h:403},
			720  : {x:40, y:109, w:1200, h:501},
			1080 : {x:50, y:163, w:1820, h:751}
		},
		screenBoundsB = {  // web window sizes for full-screen mode
			480  : {x:47, y:24, w:640,  h:432},
			576  : {x:55, y:24, w:637,  h:528},
			720  : {x:40, y:30, w:1200, h:660},
			1080 : {x:50, y:40, w:1820, h:1000}
		},
		remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

	// view states
	module.MODE_BOOKMARKS = 1;
	module.MODE_BROWSER   = 2;

	// active view state
	module.mode = null;

	module.webWindowHandle       = null;  // handle
	module.webWindowIsVisible    = false; // web content
	module.webWindowIsFullScreen = false; // view mode
	module.webWindowIsVMouse     = false; // 2D navigation
	module.webWindowUrl          = null;  // current address


	// return after playing file in the portal
	stbEvent.bind('player.end', function(){
		stbWindowMgr.raiseWebFaceWindow();
		setTimeout(function () { stbWindowMgr.raiseWebWindow(); }, 0);
	});

	// global events on usb mount/unmount
	stbEvent.bind('broadcast.storage.mount', function () {
		// show message on mount (at any time)
		setTimeout(function () {
			new CModalHint(currCPage, _('USB storage is connected'), 3000);
		}, 0);
	});

	stbEvent.bind('close', function() {
		// removing key pare from stbStorage
		stbStorage.removeItem(getWindowKey(WINDOWS.BROWSER));
		// closing wildweb window if exists
		if ( module.webWindowHandle ) {
			stbWindowMgr.windowClose(module.webWindowHandle);
			stbStorage.removeItem(WINDOWS.BROWSER_VIEW);
		}
		// closing web face window
		stbWebWindow.close();
	});

	stbEvent.bind('broadcast.storage.unmount', function () {});

	stbEvent.bind('load.start', function ( url ) {
		echo('load.start');
		gSTB.HideVirtualKeyboard();
		// there was a redirect
		module.webWindowUrl = url;
		module.addressBar.SetFavicon(url);
		module.addressBar.SetState('load');
		// is in favs
		if ( app.models.main.urls.get(url) ) {
			module.addressBar.FillStar(true);
			module.buttonPanel.Rename(module.buttonPanel.btnF1, _('Remove<br>bookmark'));
		} else {
			module.addressBar.FillStar(false);
			module.buttonPanel.Rename(module.buttonPanel.btnF1, _('Add<br>bookmark'));
		}
	});

	stbEvent.bind('load.finish', function ( status ) {
		echo('load.finish');

		setTimeout(function(){
			module.addressBar.SetProgress(0);
			module.addressBar.ShowFavIcon();
		}, 500);

		echo(status, 'status');
		// on HostNotFoundError
		/** @see http://qt-project.org/doc/qt-4.7/qnetworkreply.html */
		if ( status === 3 && !(currCPage instanceof CModalAlert) ) {
			// exit full-screen mode if any
			module.webWindowFullScreen(false);
			// hide web window
			module.webWindowShow(false);
			// message
			new CModalAlert(currCPage, _('Error'), _('This webpage is not available'), _('Close'), function(){
				// hide and destroy
				this.Show(false);
				module.webWindowShow(true);
			});
		}
	});

	// global event on page loading change
	stbEvent.onWebBrowserProgress = function ( progress, status ) {
		echo(progress, 'progress');
		var currentUrl = stbWindowMgr.getCurrWebUrl();
		if ( module.webWindowUrl !== currentUrl ) {
			stbEvent.trigger('load.start', currentUrl);
		}
		module.addressBar.SetValue(currentUrl, true);
		module.addressBar.SetProgress(progress);
		// done
		if ( progress === 100 ) {
			stbEvent.trigger('load.finish', status);
		}
	};

	// global event on switch from full-screen mode
	stbEvent.onWebBrowserFullScreenExit = function () {
		module.actions.frame();
	};

	// global event on APP press
	stbEvent.onWebBrowserActivate = function () {
		echo('onWebBrowserActivate');

		// page is still loading
		if ( !app.ready ) { return; }

		module.setMode(module.MODE_BROWSER);
		stbWindowMgr.raiseWebFaceWindow();
		stbWindowMgr.SetVirtualKeyboardCoord('bottom');
		gSTB.EnableTvButton(false);
		// correct background
		if ( module.webWindowIsVisible ) {
			stbWindowMgr.raiseWebWindow();
		} else {
			module.addressBar.focus();
		}

		if ( !module.webWindowIsFullScreen ) {
			setTimeout(function () {
				module.page.handle.parentNode.style.backgroundColor = 'transparent';
			},0);
		}
	};

	stbEvent.onMediaAvailable = function ( itemMime, itemLink ) {
		// portal not available
		if(getWindowIdByName(WINDOWS.PORTAL) === null){return;}

		// item additional params
		var itemType     = getMediaType(itemLink),
			itemPlayable = [MEDIA_TYPE_VIDEO, MEDIA_TYPE_AUDIO, MEDIA_TYPE_IMAGE, MEDIA_TYPE_ISO].indexOf(itemType) !== -1;

		// exit full-screen mode if any
		module.webWindowFullScreen(false);
		// hide web window
		module.webWindowShow(false);

		(function ( parent, title, data, btnExitTitle, btnExitClick ) {
			var inst = new CModalAlert();

			// check input
			if ( data ) {
				// parent constructor
				CModalBox.call(inst, parent);
				inst.name = 'CModalLinkOpen';
				inst.bpanel = new CButtonPanel();
				inst.bpanel.Init(CMODAL_IMG_PATH);
				inst.bpanel.btnExit = inst.bpanel.Add(KEYS.EXIT, 'exit.png', btnExitTitle || '', function () {
					typeof btnExitClick === 'function' && btnExitClick.call(inst);
					inst.Show(false);
				});

				// allow to play
				if ( itemPlayable ) {
					inst.bpanel.Add(KEYS.F1, 'f1.png', _('Play'), function(){
						stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'player.play', itemLink);
						inst.Show(false);
						module.webWindowShow(true);
					});
				}

				// allow to download
				inst.bpanel.Add(KEYS.F2, 'f2.png', _('Download'), function () {
					if ( app.models.main.environmentData.result.mount_media_ro === 'true' ) {
						new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
					} else {
						// hide and destroy
						inst.Show(false);
						module.webWindowShow(true);
						// send link to download
						setTimeout(function () {
							var windowKey = getWindowKey(WINDOWS.DOWNLOAD_MANAGER),  // get storage key
								windowID = stbStorage.getItem(windowKey);           // get window id from storage
							if (windowID) {
								// send url to download
								stbWebWindow.messageSend(windowID, 'add.download', itemLink);
								// show it
								stbWindowMgr.windowShow(windowID);
							} else {
								openWindow(WINDOWS.DOWNLOAD_MANAGER, PATH_ROOT + 'public/app/dlman/index.html?' + itemLink);
							}
						}, 0);
						// save only changed data
						if (app.models.main.changed) {
							app.models.main.save();
						}
					}
				});

				inst.SetHeader(title);
				inst.SetContent(data);
				inst.SetFooter(inst.bpanel.handle);

				inst.onHide = function () {
					elclear(inst.bpanel.handle);
					delete inst.bpanel;
					inst.Free();
				};

				// forward events to button panel
				inst.EventHandler = function ( e ) {
					if ( !eventPrepare(e, true, inst.name) ) return;
					inst.bpanel.EventHandler(e);
				};

				inst.Init();
				inst.Show(true);
			}
		}(
			currCPage,
			_('Select action'),
			itemPlayable ? _('To play this file press F1, to save it press F2') : _('To save this file press F2'),
			_('Cancel'),
			function(){module.webWindowShow(true)}
		));
	};


	/**
	 * Get the time in readable format
	 * @param {number} time in seconds
	 * @return {string}
	 */
	function formatTime ( time ) {
		var date  = new Date(time*1000),
			year  = date.getFullYear(),
			month = date.getMonth() + 1,
			day   = date.getDate(),
			hour  = date.getHours(),
			mins  = date.getMinutes();
		return year + '.' +
			(month<=9 ? '0' + month : month) + '.' +
			(day<=9   ? '0' + day   : day) + ' ' +
			(hour<=9  ? '0' + hour  : hour) + ':' +
			(mins<=9  ? '0' + mins  : mins);
	}


	/**
	 * main page creation
	 * @return {CPage}
	 */
	function initPage () {
		var component = new CPage();
		component.name = 'CPageMain';
		component.Init(document.body.querySelector('div.page.main'));
		/** @param {Event} event */
		component.EventHandler = function ( event ) {
			// web mode
			if ( module.mode === module.MODE_BROWSER ) {
				// bookmarks
				if ( module.addressBar.EventHandler(event) !== true ) {
					switch ( event.code ) {
						case KEYS.F2:
							// download manager activation
							module.actions.f2(false);
							break;
						case KEYS.F3:
							// internet bookmarks activation
							module.actions.f3();
							break;
						case KEYS.MENU:
						case KEYS.FRAME:
						case KEYS.F1:
							// global keys
							module.buttonPanel.EventHandler(event);
							break;
						case KEYS.EXIT:
							module.exitButtonPanel.EventHandler(event);
							return true;
						case KEYS.REFRESH:
							stbWebWindow.ReloadDocument();
							break;
					}
				}
			} else {
				// bookmarks
				if ( module.searchBar.EventHandler(event) !== true ) {
					switch ( event.code ) {
						case KEYS.BACK:
							// remove selected items
							module.actions.remove();
							break;
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
							module.lister.EventHandler(event);
							break;
						case 32:
							// space selects the current one
							module.actions.f2(true);
							event.preventDefault();
							break;
						case KEYS.MENU:
						case KEYS.INFO:
						case KEYS.F1:
						case KEYS.F2:
							// global keys
							module.buttonPanel.EventHandler(event);
							break;
						case KEYS.EXIT:
							echo('component.EventHandler');
							module.actions.exit();
							return true;
						case KEYS.DELETE:
							module.actions.remove();
							break;
					}
				}
			}
		};
		return component;
	}


	/**
	 * header filter component
	 * @return {CFilterInput}
	 */
	function initSearchBar () {
		// dom link to the whole block
		var container = module.page.handle.querySelector('.body .header table.bookmarks');
		// main init
		var component = new CFilterInput(this, {
			parent: container.querySelector('.csbar'),
			hint: _('Enter url address or title to filter...'),
			folded: true,
			events:{
				onEnter: function(){
					// no items to filter
					if ( module.lister.Length() === 0 ) {
						this.Fold(true);
						return;
					}
					// clear last filter
					if ( module.lister.path[module.lister.path.length-1].filterText ) {
						module.lister.path.pop();
						module.breadCrumb.Pop();
					}
					// type
					if ( this.GetValue() ) {
						// go deeper
						var clone = {},
							last  = module.lister.path[module.lister.path.length-1];
						// prepare
						for ( var attr in last ) { clone[attr] = last[attr]; }
						clone.filterText = this.GetValue();
						// current node but filtered
						module.lister.Open(clone);
					} else {
						// clear and refresh
						module.lister.path[module.lister.path.length-1].filterText = module.lister.filterText = module.lister.parentItem.filterText = '';
						module.lister.Refresh();
					}
					this.Fold(true);
					module.breadCrumb.Show(true);
					// refresh preview
					module.lister.onFocus(module.lister.Current());
				},
				onChange: function(){
					if ( component.timer ) { clearTimeout(component.timer); }
					// add delay
					component.timer = setTimeout(function(){
						// show info in preview block
						var item = module.lister.FirstMatch(component.GetValue());
						if ( item ) {
							module.lister.Focused(item, true);
							component.focus();
						}
					}, 400);
				},
				onUnfold: function(){
					module.breadCrumb.Show(false);
					gSTB.ShowVirtualKeyboard();
				},
				onFold: function(){
					module.breadCrumb.Show(true);
				},
				onKey: function(){
					this.SetValue(module.lister.path[module.lister.path.length-1].filterText || '');
				},
				onExit: function(){
					echo('CFilterInput onExit');
					this.Reset();
				}
			}
		});
		component.timer = 0;
		component.$container = container;
		// manage the whole block visibility
		component.Show = function ( state ) {
			this.$container.style.display = state ? 'table' : 'none';
		};
		return component;
	}


	/**
	 * header web address component
	 * @return {CWebInput}
	 */
	function initAddressBar () {
		// dom link to the whole block
		var container = module.page.handle.querySelector('.body .header table.browser');
		// main init
		var component = new CWebInput(this, {
			input: document.getElementById('web-filter'),
			hint: _('Enter url address or text to search...'),
			autocomplete:true,
			events:{
				onEnter: function( data ){
					echo('onEnter');
					echo(data.text, 'url');
					echo(data.type, 'type');
					if ( data.type === 'search' ) {
						module.loadUrl('http://www.google.com/search?hl=' + getCurrentLanguage() + '&q=' + data.text);
					} else {
						module.loadUrl(data.text);
					}
				},
				onChange: function(){
					if ( component.timer ) { clearTimeout(component.timer); }
					// add delay
					component.timer = setTimeout(function(){
						//TODO: auto-complete
					}, 400);
				},
				onKey: function(){
					// invert web window visibility
					module.actions.f4();
				},
				onStar: function(){
					module.actions.f1();
				},
				onUnstar: function(){
					module.actions.f1();
				},
				onExit: function(){
					module.actions.exit();
					return true;
				}
			}
		});
		component.timer = 0;
		component.$container = container;
		// manage the whole block visibility
		component.Show = function ( state ) {
			this.$container.style.display = state ? 'table' : 'none';
		};
		// hide web window and activate address bar
		component.handle.onclick = function () {
			module.webWindowShow(false);
		};
		return component;
	}


	/**
	 * header component
	 * @return {CBreadCrumb}
	 */
	function initBreadCrumb () {
		var component = new CBreadCrumb(module.page);
		component.showAttr = 'table-cell';
		component.Init(PATH_IMG_PUBLIC, module.searchBar.$container.querySelector('.cbcrumb'));
		component.SetName(_('Internet bookmarks'));
		return component;
	}


	/**
	 * preview side panel component
	 * @return {CBase}
	 */
	function initPreview () {
		var component = new CBase(module.page);
		component.Init(module.page.handle.querySelector('.content .sbar'));
		component.Show(false, false);
		component.body   = component.handle.querySelector('td.view');
		component.blkAll = component.handle.querySelector('div.block.all');
		component.blkSel = component.handle.querySelector('div.block.sel');
		component.valAll = component.blkAll.querySelector('span.value');
		component.valSel = component.blkSel.querySelector('span.value');
		component.blkAll.querySelector('span.title').innerHTML = _('Items:');
		component.blkSel.querySelector('span.title').innerHTML = _('Selected:');
		component.showAttr = 'table-cell';
		component.infoIcon = element('img', {align: 'left', src: PATH_IMG_PUBLIC + 'media/ico_info.png'});
		// image preview provider
		var sizes = {
			720  : 's',
			1280 : 'm',
			1920 : 'l'
		};
		// check http://free.pagepeeker.com/v2/thumbs_ready.php?size=m&url=google.ru
		component.url = 'http://free.pagepeeker.com/v2/thumbs.php?size=' + sizes[WINDOW_WIDTH] + '&url=';
		// list of info action mapped to the media types
		component.actionInfo = {};

		component.actionInfo[MEDIA_TYPE_BACK] = function ( data ) {
			if ( module.lister.filterText ) {
				elchild(elclear(this.body), element('div', {}, [
					this.infoIcon,
					element('div', {className: 'text'}, _('Contains a list of items corresponding to the given filter request'))
				]));
			} else {
				elchild(elclear(this.body), this.info(module.lister.parentItem));
			}
		};

		component.actionInfo[MEDIA_TYPE_FOLDER] = function ( data ) {
			var size = 200,
				name = data.name.substr(0, size - 1) + (data.name.length > size ? '...' : '');
			elchild(elclear(this.body), element('div', {}, [
				this.infoIcon,
				element('div', {className: 'text'}, _('Gives access to url links organized in groups')),
				element('br'),
				element('div', {className: 'lbl'}, [_('Name:'),      element('span', {className: 'txt'}, name)]),
				element('div', {className: 'lbl'}, [_('Bookmarks:'), element('span', {className: 'txt'}, String(app.models.main.urls.find({dir:data.id}).length))]),
				element('div', {className: 'lbl'}, [_('Time:'),      element('span', {className: 'txt'}, formatTime(data.time))])
			]));
		};

		component.actionInfo[MEDIA_TYPE_URL] = function ( data ) {
			var size = 120,
				name = data.name.substr(0, size - 1) + (data.name.length > size ? '...' : ''),
				link = data.id.substr(0, size - 1) + (data.id.length > size ? '...' : ''),
				uri  = parseUri(data.id),
				info = [
					element('div', {className: 'file'}, [
						this.player = element('img', {className:'empty', src:component.url + uri.host})
					]),
					element('br'),
					element('div', {className: 'lbl'}, [_('Name:'),    element('span', {className: 'txt'}, name)]),
					element('div', {className: 'lbl'}, [_('Address:'), element('span', {className: 'txt'}, link)]),
					element('div', {className: 'lbl'}, [_('Time:'),    element('span', {className: 'txt'}, formatTime(data.time))])
				];
			elchild(elclear(this.body), this.body.info = element('div', {}, info));
		};

		component.onShow = function () {
			// there is an active item
			if ( module.lister.activeItem ) { this.info(module.lister.activeItem.data); }
		};

		component.SetItemsCount = function ( ) {
			this.valAll.innerHTML = module.lister.path.length > 1 ? module.lister.Length()-1 : module.lister.Length();
		};

		/**
		 * The main method of an item info display
		 * @param {Object} data media item inner data
		 */
		component.info = function ( data ) {
			// get item associated open action and execute
			if ( data && data.type && typeof this.actionInfo[data.type] === 'function' ) {
				this.actionInfo[data.type].call(this, data);
			}
			elchild(this.body, element('div', {className:'fade'}));
		};

		return component;
	}


	/**
	 * exit bottom component
	 * @return {CButtonPanel}
	 */
	function initExitButtonPanel () {
		var component = new CButtonPanel(module.page);
		component.Init(remoteControlButtonsImagesPath, module.page.handle.querySelector('.body .footer .exit div.cbpanel-main'));
		// buttons with handlers
		component.btnExit  = component.Add(KEYS.Exit,  'exit.png',  configuration.newRemoteControl ? _('Exit') : '', function(){
			module.actions.exit();
		});
		return component;
	}


	/**
	 * bottom line of buttons component
	 * @return {CButtonPanel}
	 */
	function initButtonPanel () {
		var component = new CButtonPanel(module.page);
		component.Init(remoteControlButtonsImagesPath, module.page.handle.querySelector('.body .footer .main div.cbpanel-main'));
		// buttons with handlers
		component.btnMenu  = component.Add(KEYS.MENU,  'menu.png',  configuration.newRemoteControl ? _('Menu') : '', function(){
			module.actions.menu();
		});
		component.btnFrame = component.Add(KEYS.FRAME, 'frame.png', _('Fullscreen'), function(){
			module.actions.frame();
		});
		component.btnInfo = component.Add(KEYS.INFO, 'info.png', _('Show<br>info panel'), function(){
			module.actions.frame();
		});
		component.btnF1 = component.Add(KEYS.F1, 'f1.png', _('Add<br>bookmark'), function(){
			module.actions.f1();
		});
		component.btnF2 = component.Add(KEYS.F2, 'f2.png', _('Select'), function(){
			module.actions.f2(true);
		});
		return component;
	}


	/**
	 * main content list component
	 * @return {CBookmarkList}
	 */
	function initLister () {
		var component = new CBookmarkList(module.page);
		component.Init(module.page.handle.querySelector('.body .content .cslist-main'));
		component.SetBreadCrumb(module.breadCrumb);
		component.SetSearchBar(module.searchBar);
		component.SetButtonPanel(module.exitButtonPanel);
		component.SetButtonPanel(module.buttonPanel);
		component.SetPreviewPanel(module.preview);
		return component;
	}


	/**
	 * notification tray component
	 * @return {CBase}
	 */
	function initNotificationTray () {
		var component = new CBase(module.page);
		component.Init(module.page.handle.querySelector('.header .tray'));
		component.Show(false, false);
		component.showAttr = 'table-cell';
		component.iconBuffer = element('img', {className: 'copy'});
		component.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_copy.png';
		component.handleInner.appendChild(component.iconBuffer);
		return component;
	}


	/**
	 * modal menu component
	 * @return {CModal}
	 */
	function initBookmarksMenu () {
		// modal window with menu
		var component = new CModal(module.page);
		component.onShow = function () {
			// prepare
			var currentItem = module.lister.Current(),
				activeItems = module.lister.ActiveItems(),
				itemsAmount = module.lister.Length(),
				hasMarkable = itemsAmount > 1 || (itemsAmount === 1 && currentItem.data.type !== MEDIA_TYPE_BACK);
			// correction
			if ( currentItem && currentItem.data.type === MEDIA_TYPE_BACK ) { currentItem = null; }
			// set
			component.menu.gedit.slist.Hidden(component.menu.gedit.iopen,    currentItem === null);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iselone,  module.buttonPanel.btnF2.data.hidden);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iselall,  !hasMarkable);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iedit,    currentItem === null);
			component.menu.gedit.slist.Hidden(component.menu.gedit.ideselect,(module.lister.states.marked || []).length === 0);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iinvert,  component.menu.gedit.ideselect.hidden);
			component.menu.gedit.slist.Hidden(component.menu.gedit.icut,     activeItems.length  === 0); // future use :: this.parent.BPanel.btnF3.data.hidden || activeItems.length === 0 || this.parent.FileList.parentItem.readOnly);
			component.menu.gedit.slist.Hidden(component.menu.gedit.icopy,    activeItems.length  === 0); // future use :: this.parent.BPanel.btnF3.data.hidden || activeItems.length === 0 || (this.parent.FileList.mode === MEDIA_TYPE_FAVORITES || !(this.parent.FileList.mode === MEDIA_TYPE_STORAGE_SATA || this.parent.FileList.mode === MEDIA_TYPE_STORAGE_USB)));
			component.menu.gedit.slist.Hidden(component.menu.gedit.ipaste,   globalBuffer.size() === 0 || globalBuffer.place() === module.lister.parentItem);
			component.menu.gedit.slist.Hidden(component.menu.gedit.idelete,  module.buttonPanel.btnF2.data.hidden || activeItems.length === 0);

			// set tabs visibility
			component.menu.Hidden(component.menu.gsort, itemsAmount === 0);

			// always go to edit tab
			component.menu.Switch(component.menu.gedit);

			component.menu.Activate();
		};

		/**
		 * main side menu
		 * @type {CGroupMenu}
		 */
		component.menu = new CGroupMenu(component);
		component.menu.Init(module.page.handle.querySelector('div.cgmenu-main.bookmarks'));

		component.Init(element('div', {className: 'cmodal-menu'}, component.menu.handle));

		// mouse click on empty space should close modal menu
		component.handle.onclick = function(){ component.Show(false); };

		component.EventHandler = function ( event ) {
			switch ( event.code ) {
				case KEYS.EXIT:
				case KEYS.MENU:
					module.bookmarksMenu.Show(false);
					break;
				default:
					module.bookmarksMenu.menu.EventHandler(event);
			}
		};

		// group
		component.menu.gedit = component.menu.AddGroup('gedit', _('Operations'), {
			onclick: function () {
				var items, iid = this.iid;
				// close the menu and apply
				module.bookmarksMenu.Show(false);
				// selected action id
				switch ( iid ) {
					case MEDIA_ACTION_OPEN:
						module.lister.Current().onclick();
						break;
					case MEDIA_ACTION_ADD_ITEM:
						module.actions.f1();
						break;
					case MEDIA_ACTION_ADD_FOLDER:
						new CModalFolderEdit(module.page);
						break;
					case MEDIA_ACTION_EDIT:
						var item = module.lister.Current();
						if ( item.data.type === MEDIA_TYPE_FOLDER ) {
							new CModalFolderEdit(module.page, item);
						} else {
							new CModalBookmarkEdit(module.page, item);
						}
						break;
					case MEDIA_ACTION_SELECT_ONE:
						module.actions.f2(true);
						break;
					case MEDIA_ACTION_SELECT_ALL:
						// get each and mark
						module.lister.Each(function ( item ) {
							item.self.Marked(item, true);
						});
						break;
					case MEDIA_ACTION_DESELECT:
						// get each and unmark
						module.lister.Each(function ( item ) {
							item.self.Marked(item, false);
						});
						break;
					case MEDIA_ACTION_INVERT:
						// get each and invert
						module.lister.Each(function ( item ) {
							item.self.Marked(item, !item.marked);
						});
						break;
					case MEDIA_ACTION_CUT:
						//TODO:
						// find all appropriate items
						items = module.lister.ActiveItems();
						// reset
						globalBuffer.clear();
						globalBuffer.mode(globalBuffer.MODE_CUT);
						globalBuffer.place(module.lister.parentItem);
						// hook after paste somewhere
						globalBuffer.onPaste = function(item){
							self.FavRemove(item.url);
						};
						items.forEach(function ( item ) {
							// fill buffer
							globalBuffer.add(item.data);
						});
						// show tray
						module.tray.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_cut.png';
						module.tray.Show(true, false);
						break;
					case MEDIA_ACTION_COPY:
						//TODO:
						// find all appropriate items
						items = module.lister.ActiveItems();
						// reset
						globalBuffer.clear();
						globalBuffer.mode(globalBuffer.MODE_COPY);
						globalBuffer.place(module.lister.parentItem);
						// iterate all selected
						items.forEach(function ( item ) {
							// fill buffer
							globalBuffer.add(item.data);
						});
						// show tray
						module.tray.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_copy.png';
						module.tray.Show(true, false);
						break;
					case MEDIA_ACTION_DELETE:
						module.actions.remove();
						break;
					case MEDIA_ACTION_PASTE:
						//TODO:
						globalBuffer.paste(function(item){

						});
						module.lister.Refresh();
						// update info hints
						module.preview.SetItemsCount();
						// hide if not necessary anymore
						module.tray.Show(false, false);
						break;
				}
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gedit.iopen     = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_OPEN,       _('Open'),         {icon: remoteControlButtonsImagesPath + 'ok.png'});
		component.menu.gedit.iadditem  = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_ADD_ITEM,   _('Add bookmark'), {icon: remoteControlButtonsImagesPath + 'f1.png'});
		component.menu.gedit.iaddfld   = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_ADD_FOLDER, _('Add folder'));
		component.menu.gedit.iedit     = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_EDIT,       _('Edit'));
		component.menu.gedit.iselone   = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_SELECT_ONE, _('Select'),       {icon: remoteControlButtonsImagesPath + 'f2.png'});
		component.menu.gedit.iselall   = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_SELECT_ALL, _('Select all'));
		component.menu.gedit.ideselect = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_DESELECT,   _('Deselect all'));
		component.menu.gedit.iinvert   = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_INVERT,     _('Invert selection'));
		component.menu.gedit.idelete   = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_DELETE,     _('Delete'),       {icon: remoteControlButtonsImagesPath + 'back.png'});

		// group
		component.menu.gsort = component.menu.AddGroup('gsort', _('Sort'), {
			onclick: function () {
				// find and unmark the previous item
				this.self.Marked(this.self.FindOne({marked: true}), false);
				// mark and focus the current one
				this.self.Marked(this, true);
				this.self.Focused(this, true);
				// close the menu and apply filter
				module.bookmarksMenu.Show(false);
				// sort method differs from current
				if ( module.lister.sortType !== this.iid ) { module.lister.sortType = this.iid; }
				module.lister.Refresh();
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gsort.iname = component.menu.AddItem(component.menu.gsort, MEDIA_ACTION_SORT_NAME, _('By name'), {marked:true, focused:true});
		component.menu.gsort.itime = component.menu.AddItem(component.menu.gsort, MEDIA_ACTION_SORT_TIME, _('By time'));

		// default group
		component.menu.Switch(component.menu.gedit);
		return component;
	}


	/**
	 * modal menu component
	 * @return {CModal}
	 */
	function initBrowserMenu () {
		// modal window with menu
		var component = new CModal(module.page);
		component.onShow = function () {
			var isAdded = Boolean(app.models.main.urls.get(stbWindowMgr.getCurrWebUrl()));
			component.menu.gedit.slist.Hidden(component.menu.gedit.iadd,    isAdded);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iremove, !isAdded);
			// set visibility
			component.menu.Hidden(component.menu.gedit, module.webWindowHandle === null);
			component.menu.Hidden(component.menu.gview, module.webWindowHandle === null);
			// set start tab
			component.menu.Switch(module.webWindowHandle === null ? component.menu.gtools : component.menu.gedit);
			component.menu.Activate();
		};

		component.onHide = function () {
			module.webWindowShow(true);
		};

		/**
		 * main side menu
		 * @type {CGroupMenu}
		 */
		component.menu = new CGroupMenu(component);
		component.menu.Init(module.page.handle.querySelector('div.cgmenu-main.browser'));

		component.Init(element('div', {className: 'cmodal-menu'}, component.menu.handle));

		// mouse click on empty space should close modal menu
		component.handle.onclick = function(){ component.Show(false); };

		component.EventHandler = function ( event ) {
			switch ( event.code ) {
				case KEYS.EXIT:
				case KEYS.MENU:
					module.browserMenu.Show(false);
					break;
				default:
					module.browserMenu.menu.EventHandler(event);
			}
		};

		// group
		component.menu.gedit = component.menu.AddGroup('gedit', _('Operations'), {
			onclick: function () {
				// close the menu and apply filter
				module.browserMenu.Show(false);
				// selected action id
				switch ( this.iid ) {
					case 1:
						module.actions.goBack();
						break;
					case 2:
						module.actions.goForward();
						break;
					case 3:
						module.actions.stop();
						break;
					case 4:
						module.actions.reload();
						break;
					case 5:
						module.actions.f1();
						break;
				}
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gedit.iprev   = component.menu.AddItem(component.menu.gedit, 1, _('Back'),            {icon: remoteControlButtonsImagesPath + 'prev.png'});
		component.menu.gedit.inext   = component.menu.AddItem(component.menu.gedit, 2, _('Forward'),         {icon: remoteControlButtonsImagesPath + 'next.png'});
		component.menu.gedit.istop   = component.menu.AddItem(component.menu.gedit, 3, _('Stop'),            {icon: remoteControlButtonsImagesPath + 'stop.png'});
		component.menu.gedit.ireload = component.menu.AddItem(component.menu.gedit, 4, _('Reload'),          {icon: remoteControlButtonsImagesPath + 'refresh.png'});
		component.menu.gedit.iadd    = component.menu.AddItem(component.menu.gedit, 5, _('Add bookmark'),    {icon: remoteControlButtonsImagesPath + 'f1.png'});
		component.menu.gedit.iremove = component.menu.AddItem(component.menu.gedit, 5, _('Remove bookmark'), {icon: remoteControlButtonsImagesPath + 'f1.png'});

		// group
		component.menu.gview = component.menu.AddGroup('gview', _('View'), {
			onclick: function () {
				// selected action id
				switch ( this.iid ) {
					case 1:
						module.actions.frame();
						break;
					default:
						// find and unmark the previous item
						this.self.Marked(this.self.FindOne({marked: true}), false);
						// mark and focus the current one
						this.self.Marked(this, true);
						this.self.Focused(this, true);
						// apply
						stbWebWindow.SetZoomFactor(this.iid);
						break;
				}
				// close the menu and apply filter
				module.browserMenu.Show(false);
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gview.iname = component.menu.AddItem(component.menu.gview, 1,   _('Fullscreen'),{icon: remoteControlButtonsImagesPath + 'frame.png'});
		component.menu.gview.itime = component.menu.AddItem(component.menu.gview, 50,  _('Zoom 50%'),  {});
		component.menu.gview.itime = component.menu.AddItem(component.menu.gview, 75,  _('Zoom 75%'),  {});
		component.menu.gview.itime = component.menu.AddItem(component.menu.gview, 100, _('Zoom 100%'), {marked:true});
		component.menu.gview.itime = component.menu.AddItem(component.menu.gview, 150, _('Zoom 150%'), {});
		component.menu.gview.itime = component.menu.AddItem(component.menu.gview, 200, _('Zoom 200%'), {});
		component.menu.gview.itime = component.menu.AddItem(component.menu.gview, 300, _('Zoom 300%'), {});

		// group
		component.menu.gtools = component.menu.AddGroup('gtools', _('Tools'), {
			onclick: function () {
				// close the menu and apply filter
				module.browserMenu.Show(false);
				// selected action id
				switch ( this.iid ) {
					case 1:
						setTimeout(function(){
							module.actions.f2(false);
						}, 0);
						break;
					case 2:
						setTimeout(function(){
							module.actions.f3();
						}, 0);
						break;
					case 3:
						module.webWindowIsVMouse = !module.webWindowIsVMouse;
						stbWindowMgr.setVirtualMouseMode(module.webWindowIsVMouse);
						break;
				}
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gtools.idlman = component.menu.AddItem(component.menu.gtools, 1, _('Download manager'),   {icon: remoteControlButtonsImagesPath + 'f2.png'});
		component.menu.gtools.iibman = component.menu.AddItem(component.menu.gtools, 2, _('Internet bookmarks'), {icon: remoteControlButtonsImagesPath + 'f3.png'});
		component.menu.gtools.imouse = component.menu.AddItem(component.menu.gtools, 3, _('Virtual mouse'),      {icon: remoteControlButtonsImagesPath + 'info.png'});

		// default group
		component.menu.Switch(component.menu.gedit);
		return component;
	}


	function initBookmarksBlock () {
		var component = new CBase(module.page);
		component.Init(module.page.handle.querySelector('tr.content.bookmarks'));
		component.showAttr = 'table-row';
		// change visibility
		component.Transparent = function ( state ) {
			this.handle.style.backgroundColor = state ? 'transparent' : '#010101';
		};
		// display background fade image
		component.ShowBgImage = function ( state ) {
			this.handleInner.cells[0].style.background = state ? 'url("' + PATH_IMG_PUBLIC + 'backgrounds/bg_icon_ibman.png") center center no-repeat no-repeat' : 'none';
		};
		// display lister
		component.ShowLister = function ( state ) {
			this.handleInner.cells[0].children[0].style.display = state ? 'table' : 'none';
		};
		return component;
	}


	function initBrowserBlock () {
		var component = new CBase(module.page);
		component.Init(module.page.handle.querySelector('tr.content.browser'));
		component.showAttr = 'table-row';
		// change visibility
		component.Transparent = function ( state ) {
			component.handle.style.backgroundColor = state ? 'transparent' : '#010101';
		};
		// display background fade image
		component.ShowBgImage = function ( state ) {
			component.handleInner.cells[0].style.background = state ? 'url("' + PATH_IMG_PUBLIC + 'backgrounds/bg_icon_web.png") center center no-repeat no-repeat' : 'none';
		};
		// web window to top
		component.handle.onclick = function () {
			module.webWindowShow(true);
		};
		return component;
	}


	module.loadUrl = function ( url ) {
		module.addressBar.SetValue(url, true);
		module.addressBar.SetFavicon(url);
		module.addressBar.SetState('load');
		module.addressBar.ShowStar(true);

		gSTB.HideVirtualKeyboard();

		// web window params
		var geometry = screenBoundsA[WINDOW_HEIGHT];
		// first time or not
		if ( module.webWindowHandle ) {
			stbWindowMgr.LoadUrl(url);
		} else {
			module.webWindowHandle = stbWindowMgr.initWebWindow(url);
			// save
			stbStorage.setItem(WINDOWS.BROWSER_VIEW, module.webWindowHandle);
			// web window geometry
			stbWindowMgr.resizeWebWindow(geometry.x, geometry.y, geometry.w, geometry.h);
		}
		// apply view mode
		module.setMode(module.MODE_BROWSER, true);
	};


	/**
	 *
	 * @param {number} mode
	 * @param {boolean} [force]
	 */
	module.setMode = function ( mode, force ) {
		// new and old modes are different
		if ( this.mode !== mode || force === true ) {
			this.mode = mode;

			echo(this.mode);
			switch ( this.mode ) {
				case this.MODE_BOOKMARKS:
					// header
					module.searchBar.Show(true);
					module.addressBar.Show(false);
					module.tray.Show(globalBuffer.size() > 0);
					// content
					var count = module.lister.Length();
					module.bookmarksBlock.Show(true, false);
					module.bookmarksBlock.ShowBgImage(count === 0);
					module.bookmarksBlock.ShowLister(count > 0);
					module.browserBlock.Show(false, false);
					module.webWindowShow(false);
					module.lister.Activate(true);
					// footer
					module.buttonPanel.Rename(module.buttonPanel.btnF1, _('Add<br>bookmark'));
					module.buttonPanel.Hidden(module.buttonPanel.btnF1, false);
					module.buttonPanel.Hidden(module.buttonPanel.btnF2, count === 0);
					module.buttonPanel.Rename(module.buttonPanel.btnInfo, module.preview.isVisible ? _('Hide<br>info panel') : _('Show<br>info panel'));
					module.buttonPanel.Hidden(module.buttonPanel.btnInfo, count === 0);
					module.buttonPanel.Hidden(module.buttonPanel.btnFrame, true);
					stbWindowMgr.SetVirtualKeyboardCoord('none');
					break;
				case this.MODE_BROWSER:
					// header
					module.searchBar.Show(false);
					module.addressBar.Show(true);
					module.tray.Show(false);
					// content
					module.browserBlock.Show(true, false);
					module.browserBlock.Transparent(module.webWindowHandle !== null);
					module.browserBlock.ShowBgImage(module.webWindowHandle === null);
					module.bookmarksBlock.Show(false, false);
					module.webWindowShow(true);
					module.lister.Activate(false);
					// footer
					module.buttonPanel.Rename(module.buttonPanel.btnF1, app.models.main.urls.get(stbWindowMgr.getCurrWebUrl()) ? _('Remove<br>bookmark') : _('Add<br>bookmark'));
					module.buttonPanel.Hidden(module.buttonPanel.btnF1, module.webWindowHandle === null);
					module.buttonPanel.Rename(module.buttonPanel.btnFrame, _('Fullscreen') );
					module.buttonPanel.Hidden(module.buttonPanel.btnF2, true);
					module.buttonPanel.Hidden(module.buttonPanel.btnFrame, module.webWindowHandle === null);
					module.buttonPanel.Hidden(module.buttonPanel.btnInfo, true);
					stbWindowMgr.SetVirtualKeyboardCoord('bottom');
					break;
			}
		}
	};


	/**
	 * View initialization
	 */
	module.init = function () {
		// initial view mode
		URL_PARAMS.mode = parseInt(URL_PARAMS.mode, 10) || module.MODE_BOOKMARKS;
		URL_PARAMS.url  = URL_PARAMS.url ? decodeURIComponent(URL_PARAMS.url) : '';
		URL_PARAMS.view  = !!URL_PARAMS.view || false;
		// localization
		gettext.init({name:getCurrentLanguage()}, function(){
			echo('ready', 'gettext.init');
			// create all components and fill everything
			module.fill();

			// prepare images to cache
			// buttons
			var imageList = ['exit.png', 'f1.png', 'f2.png', 'f3.png', 'f4.png'].map(function(image) {
				return remoteControlButtonsImagesPath + image;
			});

			// backgrounds
			imageList = imageList.concat(['topmenu_bg.png', 'bottommenu_bg.png'].map(function(image) {
				return PATH_IMG_PUBLIC + 'backgrounds/' + image;
			}));

			// media
			imageList = imageList.concat(['type_101.png', 'type_60.png', 'type_61.png', 'ico_filter.png'].map(function(image) {
				return PATH_IMG_PUBLIC + 'media/' + image;
			}));

			// images has been loaded
			imageLoader(imageList, function () {
				echo('ready', module.page.name);
				// correct background
				document.body.style.backgroundColor = document.body.parentNode.style.backgroundColor = 'transparent';
				// show main page
				module.show();
				// done
				app.ready = true;
			});
		});

	};


	/**
	 * View filling with components
	 */
	module.fill = function () {
		// page with its components creation and filling
		module.page            = initPage();
		module.searchBar       = initSearchBar();
		module.addressBar      = initAddressBar();
		module.breadCrumb      = initBreadCrumb();
		module.preview         = initPreview();
		module.exitButtonPanel = initExitButtonPanel();
		module.buttonPanel     = initButtonPanel();
		module.lister          = initLister();
		module.tray            = initNotificationTray();
		module.bookmarksMenu   = initBookmarksMenu();
		module.browserMenu     = initBrowserMenu();
		module.bookmarksBlock  = initBookmarksBlock();
		module.browserBlock    = initBrowserBlock();

		// get folders and urls data
		app.models.main.load();
		// apply
		module.lister.SetData(app.models.main.urls, app.models.main.dirs);
		// render root level
		module.lister.Open({type:MEDIA_TYPE_IB_ROOT});
		// set focus
		module.lister.Activate(true);
	};


	/**
	 * View is ready to display
	 */
	module.show = function () {
		// apply view mode
		module.setMode(URL_PARAMS.mode);
		// display main page
		module.page.Show(true);
		// web mode
		if ( accessControl.state && accessControl.data.pages.wildWeb ) {
			accessControl.showLoginForm(function () {
				if ( module.mode === module.MODE_BROWSER ) {
					if ( URL_PARAMS.url ) {
						module.loadUrl(URL_PARAMS.url);
						// enable\disable full screen mode if 'view' present in url arguments
						module.webWindowFullScreen(URL_PARAMS.view);
					} else {
						module.addressBar.focus();
						gSTB.ShowVirtualKeyboard();
					}
				}
			}, app.exit);
		} else {
			if ( module.mode === module.MODE_BROWSER ) {
				if ( URL_PARAMS.url ) {
					module.loadUrl(URL_PARAMS.url);
					// enable\disable full screen mode if 'view' present in url arguments
					module.webWindowFullScreen(URL_PARAMS.view);
				} else {
					module.addressBar.focus();
					gSTB.ShowVirtualKeyboard();
				}
			}
		}

	};


	/**
	 * Global navigation key actions
	 * @namespace
	 */
	module.actions = {
		exit : function () {
			echo('module.actions.exit');
			// web mode
			if ( module.mode === module.MODE_BROWSER ) {
				// mode was changed since the start or not
				if ( URL_PARAMS.mode === module.mode ) {
					// started as browser - full exit
					app.exit();
				} else {
					// started as bookmarks - return to it
					module.webWindowFullScreen(false);
					module.setMode(module.MODE_BOOKMARKS);
				}
			} else { // bookmarks
				// if top level then full exit
				if ( module.lister.parentItem.type === MEDIA_TYPE_IB_ROOT && !module.lister.parentItem.filterText ) {
					if ( URL_PARAMS.mode === module.mode ) {
						// started as bookmarks - full exit
						app.exit();
					} else {
						// started as browser - return to it
						module.setMode(module.MODE_BROWSER);
					}
				} else {
					// just go up
					module.lister.Open({type: MEDIA_TYPE_BACK});
				}
			}
		},

		frame : function ( state ) {
			// web mode
			if ( module.mode === module.MODE_BROWSER ) {
				module.webWindowFullScreen(!module.webWindowIsFullScreen);
			} else {
				// bookmarks
				state = state !== undefined ? state : !module.preview.isVisible;
				// invert visibility
				module.preview.Show(state, false);
				module.buttonPanel.Rename(module.buttonPanel.btnInfo, module.preview.isVisible ? _('Hide<br>info panel') : _('Show<br>info panel'));
				// apply helper css class (for long text trimming)
				module.preview.handle.parentNode.className = state ? 'preview' : '';
			}
		},

		menu : function () {
			// web mode
			if ( module.mode === module.MODE_BROWSER ) {
				// exit full-screen mode if any
				module.webWindowFullScreen(false);
				// hide web window and show menu
				module.webWindowShow(false);
				module.addressBar.autocomplete.Show(false);
				module.browserMenu.Show(true);
			} else {
				// bookmarks
				module.bookmarksMenu.Show(true);
			}
		},

		f1 : function () {
			var options = {};
			// web mode
			if ( module.mode === module.MODE_BROWSER ) {
				// exit full-screen mode if any
				module.webWindowFullScreen(false);
				// hide web window
				module.webWindowShow(false);
				if ( app.models.main.urls.get(stbWindowMgr.getCurrWebUrl()) ) {
					module.actions.remove();
				} else {
					options.name = stbWindowMgr.getCurrentTitle();
					options.link = stbWindowMgr.getCurrWebUrl();
					new CModalBookmarkEdit(module.page, null, options);
				}
			} else {
				new CModalBookmarkEdit(module.page, null, null);
			}
		},

		f2 : function ( move ) {
			// web mode
			if ( module.mode === module.MODE_BROWSER ) {
				openWindow(WINDOWS.DOWNLOAD_MANAGER, PATH_ROOT + 'public/app/dlman/index.html');
				// save only changed data
				if ( app.models.main.changed ) { app.models.main.save(); }
			} else {
				// bookmarks
				// check if action is permitted
				if ( !module.buttonPanel.btnF2.data.hidden ) {
					// get affected item
					var item = module.lister.Current();
					if ( item.data.markable && module.lister.Marked(item, !item.marked) ) {
						// optional move to the next after marking
						if ( move !== false ) {
							module.lister.SetPosition(module.lister.Next(), true, true);
						}
					}
				}
			}
		},

		f3 : function () {
			// exit full-screen mode if any
			module.webWindowFullScreen(false);
			// switch to bookmarks
			module.setMode(module.MODE_BOOKMARKS, true);
		},

		f4 : function () {
			// web mode
			if ( module.mode === module.MODE_BROWSER ) {
				// exit fullscreen if necessary
				module.webWindowFullScreen(false);
				module.webWindowShow(!module.webWindowIsVisible);
				if ( !module.webWindowIsVisible ) {
					module.addressBar.focus();
					module.addressBar.input.select();
				} else {
					module.addressBar.autocomplete.Show(false);
				}
			}
			// restore filter string for this node
			module.searchBar.SetValue(module.lister.path[module.lister.path.length-1].filterText || '', true);
		},

		tv : function () {
			module.page.handle.parentNode.style.backgroundColor = '#010101';

			// save only changed data
			if ( app.models.main.changed ) {
				app.models.main.save();
				app.models.main.changed = false;
			}

			// reset menu if necessary
			if ( module.browserMenu.isVisible ) { module.browserMenu.Show(false); }

			stbWindowMgr.SetVirtualKeyboardCoord('none');
			stbWindowMgr.showPortalWindow();
		},

		remove : function () {
			// find all appropriate items
			var items = module.lister.ActiveItems();
			if ( items.length ) {
				new CModalConfirm(module.page,
					_('Confirm deletion'),
					_('Are you sure you want to delete') + '<br>' + (items.length > 1 ? _('all entries selected?') : _('current entry?')),
					_('Cancel'),
					function(){
						if ( module.mode === module.MODE_BROWSER ) {
							module.webWindowShow(true);
						}
					},
					_('Delete'),
					function(){
						if ( module.mode === module.MODE_BROWSER ) {
							app.models.main.urls.unset(stbWindowMgr.getCurrWebUrl());
							module.addressBar.FillStar(false);
							module.buttonPanel.Rename(module.buttonPanel.btnF1, _('Add<br>bookmark'));
							module.webWindowShow(true);
							module.lister.Refresh(true);
						} else {
							// Bookmarks
							items.forEach(function(item){
								// update linked data
								if ( item.data.type === MEDIA_TYPE_FOLDER ) {
									app.models.main.dirs.unset(item.data.id);
									echo('unset dir ' + item.data.id);
									// find all urls inside this dir
									app.models.main.urls.find({dir:item.data.id}).forEach(function(url){
										app.models.main.urls.unset(url.id);
										echo('unset sub url ' + url.id);
									});
								} else if ( item.data.type === MEDIA_TYPE_URL ) {
									echo('unset url ' + item.data.id);
									app.models.main.urls.unset(item.data.id);
								}
							});
							module.lister.DeleteAll(items);
							// hide buttons if no records
							if ( module.lister.Length() === 0 ) {
								module.bookmarksBlock.ShowBgImage(true);
								module.bookmarksBlock.ShowLister(false);
								module.buttonPanel.Hidden(module.buttonPanel.btnInfo, true);
								module.buttonPanel.Hidden(module.buttonPanel.btnF2, true);
							}
							module.lister.Activate();
						}
						app.models.main.changed = true;
					}
				);
			}
		},

		goBack : function () {
			stbWebWindow.NavigateBack();
		},

		goForward : function () {
			stbWebWindow.NavigateForward();
		},

		stop : function () {
			stbWebWindow.StopLoading();
		},

		reload : function () {
			stbWebWindow.ReloadDocument();
		}
	};


	module.webWindowShow = function ( state ) {
		echo(state, 'webWindowShow');
		// web window was initialized
		if ( module.webWindowHandle !== null ) {
			// new and old states are different
			if ( module.webWindowIsVisible !== state ) {
				if ( state ) {
					echo('raiseWebWindow');
					stbWindowMgr.raiseWebWindow();
					// apply the current url
					module.addressBar.SetValue(stbWindowMgr.getCurrWebUrl(), true);
				} else {
					echo('raiseWebFaceWindow');
					stbWindowMgr.raiseWebFaceWindow();
				}
				module.webWindowIsVisible = state;
			}
		}
	};


	module.webWindowFullScreen = function ( state ) {
		var geometry;
		// web window was initialized
		if ( module.webWindowHandle !== null ) {
			// new and old states are different
			if ( module.webWindowIsFullScreen !== state ) {
				if ( state ) {
					module.addressBar.autocomplete.Show(false);
					geometry = screenBoundsB[WINDOW_HEIGHT];
					module.page.handle.parentNode.style.backgroundColor = '#010101';
					module.page.handle.style.visibility = 'hidden';
				} else {
					geometry = screenBoundsA[WINDOW_HEIGHT];
					module.page.handle.parentNode.style.backgroundColor = 'transparent';
					module.page.handle.style.visibility = 'visible';
				}
				module.webWindowIsFullScreen = state;
				// apply
				stbWindowMgr.resizeWebWindow(geometry.x, geometry.y, geometry.w, geometry.h);
				echo('module.webWindowIsFullScreen');
				echo(module.webWindowIsFullScreen);
				stbWebWindow.SetFullScreenMode(state);
				// to fullscreen mode
				if ( state ) { module.webWindowShow(true); }
			}
		}
	};


	// export
	return module;
}(window, app));
