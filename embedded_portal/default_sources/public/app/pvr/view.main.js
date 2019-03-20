/**
 * Records Manager main view handling
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

app.views.main = (function ( global, app ) {
	// declarations
	var module = {},  // current view
		remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

	/** main page creation */
	function initPage () {
		var component = new CPage();
		component.name = 'CPageMain';
		component.Init(document.body.querySelector('div.page.main'));
		/* @param {Event} event */
		component.EventHandler = function ( event ) {
			// component
			if ( !module.page.input.IsFolded() ) {
				echo('send key press to search handler');
				module.page.input.EventHandler(event);
			} else {
				switch ( event.code ) {
					case KEYS.F4:
						module.actions.f4(); // search bar activation
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
						// PVR records list navigation
						module.page.lister.EventHandler(event);
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
						module.page.buttonPanel.EventHandler(event);
						break;
					case KEYS.EXIT:
						module.page.exitButtonPanel.EventHandler(event);
						break;
					case KEYS.BACK:
						module.actions.remove();
						break;
					case KEYS.STOP:
						var itemsFound = false,
							date = new Date();
						// if we have marked files with 'in progress status' we should use them instead of focused item
						if ( component.lister.states.marked && component.lister.states.marked.length > 0 ) {
							var itemsForUnmark = component.lister.states.marked.slice(0);
							component.lister.states.marked.forEach(function ( item ) {
								if ( item.data.state === 2 ) {  // item 'in progress'
									pvrManager.ChangeEndTime(item.data.id, String(date.getTime() / 1000));
									itemsFound = true;
								}
							});
							itemsForUnmark.forEach(function ( item ) {
								component.lister.Marked(item, false);
							});
						}
						if ( !itemsFound && component.lister.Current().data.state === 2 ) {
							// so there is no right marked files and we should use focused one
							pvrManager.ChangeEndTime(component.lister.Current().data.id, String(date.getTime() / 1000));
						}
						break;
					default:
				}
			}
		};
		return component;
	}

	/** header component */
	function initBreadCrumb ( page ) {
		var component = new CBreadCrumb(page);
		component.showAttr = 'table-cell';
		component.Init(PATH_IMG_PUBLIC, page.handle.querySelector('.body .header .cbcrumb'));
		component.SetName(_('Record manager'));
		return component;
	}

	/** header filter component */
	function initCFilterInput () {
		var timeout,
			component = new CFilterInput(this, {
				input  : document.getElementById('place'),
				folded : true,
				hint   : _('Enter record name...'),
				events: {
					onFold  : function () {
						module.page.breadCrumb.Show(true);
					},
					onUnfold: function () {
						module.page.breadCrumb.Show(false);
						gSTB.ShowVirtualKeyboard();
						module.page.input.focus();
					},
					onChange: function () {
						var self = this;
						clearTimeout(timeout);
						timeout = setTimeout(function () {
							module.page.lister.Focused(module.page.lister.FirstMatch(self.GetValue()), true, false);
						}, 400);
					},
					onExit  : function () {
						this.Reset();
						app.views.main.updatePVRData();
					},
					onEnter : function () {
						var last,
							clone = {};
						// no items to filter
						if ( module.page.lister.Length() === 0 ) {
							this.Fold(true);
							return;
						}
						// clear last filter
						if ( module.page.lister.path[module.page.lister.path.length - 1].filterText ) {
							module.page.lister.path.pop();
							module.page.breadCrumb.Pop();
						}
						// type
						if ( this.GetValue() ) {
							// go deeper
							last = module.page.lister.path[module.page.lister.path.length - 1];
							// prepare
							for ( var attr in last ) {if ( last.hasOwnProperty(attr) ) {clone[attr] = last[attr];}}
							clone.filterText = this.GetValue();
							clone.name = 'Filter';
							echo('clone.filterText 0=' + clone.filterText);
							// current node but filtered
							module.page.lister.Open(clone);
						} else {
							// clear and refresh
							module.page.lister.path[module.page.lister.path.length - 1].filterText = module.page.lister.filterText = module.page.lister.parentItem.filterText = '';
							module.page.lister.Refresh();
						}
						module.page.breadCrumb.Show(true);
						// refresh preview
						module.page.lister.onFocus(module.page.lister.Current(), null);
						this.Fold(true, true, true);
					}
				}
			});


		return component;
	}

	/** main content list component */
	function initLister ( page ) {
		var component = new CPVRList(page);
		component.Init(page.handle.querySelector('.body .content .cslist-main'));
		component.SetBreadCrumb(page.breadCrumb);

		// global event on usb mount/unmount
		function refreshStorageData(){
			echo('PVR->onMountAction');
			app.refreshStorageInfo(); // get the list of all storages
			// refresh addModalMessage message view
			if(currCPage && currCPage instanceof CModalBox){
				currCPage.device.SetData(app.storage.length > 0 ? app.storage : [{id: -1, label: _('No storage device')}]);
				currCPage.$freeSize.innerHTML = currCPage.device.GetSelected().freeSizeGb || '0';
				currCPage.$totlaSize.innerHTML = currCPage.device.GetSelected().sizeGb || '0';
			}
		}

		// init events
		stbEvent.bind('player.end', function(){
			stbWindowMgr.windowShow(stbWebWindow.windowId());
		});
		stbEvent.bind('broadcast.storage.mount', function(){
			refreshStorageData();
			// show message on mount (at any time)
			setTimeout(function () {
			new CModalHint(currCPage, _('USB storage is connected'), 3000);
			}, 0);
		});
		stbEvent.bind('broadcast.storage.unmount', function(){
			refreshStorageData();
		});

		return component;
	}

	/** exit bottom component */
	function initExitButtonPanel ( page ) {
		var component = new CButtonPanel(page);
		component.Init(remoteControlButtonsImagesPath, page.handle.querySelector('.body .footer .exit div.cbpanel-main'));
		component.btnExit = component.Add(KEYS.EXIT,  'exit.png',  configuration.newRemoteControl ? _('Exit') : '', function(){
			module.actions.exit();
		});
		return component;
	}

	/** bottom line of buttons component */
	function initButtonPanel ( page ) {
		var component = new CButtonPanel(page);
		component.Init(remoteControlButtonsImagesPath, page.handle.querySelector('.body .footer .main div.cbpanel-main'));
		component.btnMenu = component.Add(KEYS.MENU,  'menu.png',  configuration.newRemoteControl ? _('Menu') : '', function(){
			module.actions.menu();
		});
		component.btnFrame = component.Add(KEYS.INFO, 'info.png', _('Show<br>info panel'), function(){
			module.actions.frame();
		});
		component.btnF1 = component.Add(KEYS.F1, 'f1.png', _('Add<br>record'), function(){
			if ( app.models.main.environmentData.result.mount_media_ro === 'true' ) {
				new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
			} else {
				module.actions.f1();
			}
		});
		component.btnF2 = component.Add(KEYS.F2, 'f2.png', _('Select'), function(){
			module.actions.f2(true);
		});
		return component;
	}


	/**
	 * preview side panel component
	 * @return {CBase}
	 */
	function initPreview ( page ) {
		var component = new CBase(page);
		component.Init(page.handle.querySelector('.content .sbar'));
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

		// list of info action mapped to the media types
		component.actionInfo = {};

		component.actionInfo[MEDIA_TYPE_BACK] = function ( data ) {
			elchild(elclear(this.body),
				element('div', {}, [
					component.infoIcon,
					element('div', {className : 'text', innerHTML : _('Contains a list of items corresponding to the given filter request')})
				]));
		};

		component.actionInfo[MEDIA_TYPE_PVR_SHED] = actionRecordInfo;
		component.actionInfo[MEDIA_TYPE_PVR_REC]  = actionRecordInfo;
		component.actionInfo[MEDIA_TYPE_PVR_ERR]  = actionRecordInfo;
		component.actionInfo[MEDIA_TYPE_PVR_DONE] = actionRecordInfo;

		/** show detailed info about record at info block */
		function actionRecordInfo ( data ) {
			var size = 120,
				name = data.name.substr(0, size - 1) + (data.name.length > size ? '...' : ''),
				startTime = parseDate(new Date(data.startTime * 1000)),
				endTime = parseDate(new Date(data.endTime * 1000)),
				durTime = { hours: Math.floor(data.duration / 3600), minute: Math.ceil(data.duration / 60 % 60) },
				channel = data.fileName.split('records/')[1].split('/')[0],
				info = [
					element('div', {}, [
						component.infoIcon,
						element('div', {className: 'text'}, _('Detailed information about the selected record'))
					]),
					element('br'),
					element('div', {className: 'lbl'}, [_('Name:'), element('span', {className: 'txt'}, name)]),
					element('div', {className: 'lbl'}, [_('Status:'), element('span', {className: 'txt'}, data.status)]),
					element('div', {className: 'lbl'}, [_('Start:'), element('span', {className: 'txt'}, startTime)]),
					element('div', {className: 'lbl'}, [_('End:'), element('span', {className: 'txt'}, endTime)]),
					element('div', {className: 'lbl'}, [_('Duration:'), element('span', {className: 'txt'}, durTime.hours ? durTime.hours + ' ' + _('h.') + ' ' + durTime.minute + ' ' + _('m.') : durTime.minute + ' ' + _('m.'))]),
					element('div', {className: 'lbl'}, [_('Channel:'), element('span', {className: 'txt'}, channel)])
				];

			// link for future use
			elchild(elclear(this.body), this.body.info = element('div', {}, info));
		}

		component.onShow = function () {
			// there is an active item
			if ( module.page.lister.activeItem ) {this.info(module.page.lister.activeItem.data);}
		};

		component.SetItemsCount = function ( ) {
			var itemsAmount = page.lister.states.hidden ? page.lister.Length() - page.lister.states.hidden.length : page.lister.Length();
			this.valAll.innerHTML = page.lister.path.length > 1 ? itemsAmount-1 : itemsAmount;
		};

		/** hint helper */
		component.infoBack = function ( data ) {
			elchild(elclear(this.body), this.info(page.lister.parentItem));
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

		function parseDate ( from ) {
			var month = [_('Jan'), _('Feb'), _('Mar'), _('Apr'), _('May'), _('Jun'), _('Jul'), _('Aug'), _('Sep'), _('Oct'), _('Nov'), _('Dec')],
				dayF = from.getDate(),
				monF = from.getMonth(),
				mF = from.getMinutes(),
				hF = from.getHours();
			return dayF + ' ' + month[monF] + ' ' + (hF > 9 ? hF : '0' + hF) + ':' + (mF > 9 ? mF : '0' + mF);
		}

		return component;
	}

	/** modal menu component */
	function initModalMenu ( page ) {
		 // modal window with menu
		var component = new CModal(page);
		component.onShow = function () {
			var self = this;
			var currentItem = page.lister.Current(),
				activeItems = page.lister.ActiveItems(),
				// we have hidden elements at search result page
				itemsAmount = page.lister.states.hidden ? page.lister.Length() - page.lister.states.hidden.length : page.lister.Length(),
				hasMarkable = itemsAmount > 1 || (itemsAmount === 1 && currentItem.data.type !== MEDIA_TYPE_BACK),
				realRecordsAmount = itemsAmount,
				isStopBtnVisible;

			// correction
			if ( currentItem && currentItem.data.type === MEDIA_TYPE_BACK ) {currentItem = null;}
			if( page.lister.handle.children.length && page.lister.handle.children[0].data.type === MEDIA_TYPE_BACK){realRecordsAmount--;}
			// stop button visibility
			isStopBtnVisible = (currentItem !== null && currentItem.data.type === MEDIA_TYPE_PVR_REC);
			if ( !isStopBtnVisible ) {
				// let's try to find at least one record with 'in progress' status in 'marked items' list
				isStopBtnVisible = page.lister.states.marked && page.lister.states.marked.some(function ( item ) {
					if ( item.data.state === 2 ) {return true;}
				});
			}
			// set
			component.menu.gedit.slist.Hidden(component.menu.gedit.iopen,      currentItem === null || currentItem.data.type !== MEDIA_TYPE_PVR_DONE);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iselone,    currentItem === null);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iselall,    !(realRecordsAmount > 1));
			component.menu.gedit.slist.Hidden(component.menu.gedit.istop,      !isStopBtnVisible);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iedit,      currentItem === null || (currentItem.data.type !== MEDIA_TYPE_PVR_REC && currentItem.data.type !== MEDIA_TYPE_PVR_SHED ));
			component.menu.gedit.slist.Hidden(component.menu.gedit.ideselect,  (page.lister.states.marked || []).length === 0);
			component.menu.gedit.slist.Hidden(component.menu.gedit.iinvert,    component.menu.gedit.ideselect.hidden);
			component.menu.gedit.slist.Hidden(component.menu.gedit.idelete,    activeItems.length === 0);

			// find and unmark all previous items
			(component.menu.gsort.slist.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			component.menu.gsort.slist.Marked(component.menu.gsort.slist.FindOne({iid: page.lister.sortType}), true);

			// reset available types list
			page.lister.mtypes = [];
			// collect all media types on the current level (for filtering)
			page.lister.data.forEach(function ( item ) {
				echo(item.type, 'item.data.type');
				if ( self.filterText ) {  // current level this is search results
					if ( item.name && item.name.toLowerCase().indexOf(self.filterText) !== -1 && page.lister.mtypes.indexOf(item.type) === -1 ) {
						page.lister.mtypes.push(item.type);
					}
				} else if ( page.lister.mtypes.indexOf(item.type) === -1 ) { // usual list
					page.lister.mtypes.push(item.type);
				}
			});
			component.menu.gview.slist.Each(function ( item ) {
				// enable/disable menu items depending on the file list content
				page.modalMenu.menu.gview.slist.Hidden(item, item.iid !== MEDIA_TYPE_NONE && page.lister.mtypes.indexOf(item.iid) === -1);
			});

			// hide additional options if zero items
			component.menu.Hidden(component.menu.gsort, !(realRecordsAmount > 1));

			if ( page.modalMenu.menu.gview.slist.states.hidden && (page.modalMenu.menu.gview.slist.states.hidden.length >= page.modalMenu.menu.gview.slist.Length() - 2) ) {
				component.menu.Hidden(component.menu.gview, true);
			} else {
				component.menu.Hidden(component.menu.gview, !hasMarkable);
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
				var iid = this.iid;
				// close the menu and apply
				page.modalMenu.Show(false);
				// selected action id
				switch ( iid ) {
					case MEDIA_ACTION_OPEN:
						page.lister.Current().onclick();
						break;
					case MEDIA_ACTION_ADD_ITEM:
						if ( app.models.main.environmentData.result.mount_media_ro === 'true' ) {
							new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
						} else {
							new CModalAddRecord(module.page, _('Add record'), '');
						}
						break;
					case MEDIA_ACTION_EDIT:
						var item = page.lister.Current();
						new CModalEditRecord(module.page, _('Edit record'), '', item.data);
						break;
					case MEDIA_ACTION_SELECT_ONE:
						module.actions.f2(true);
						break;
					case MEDIA_ACTION_SELECT_ALL:
						// get each and mark
						page.lister.Each(function ( item ) {
							item.self.Marked(item, true);
						});
						break;
					case MEDIA_ACTION_DESELECT:
						// get each and unmark
						page.lister.Each(function ( item ) {
							item.self.Marked(item, false);
						});
						break;
					case MEDIA_ACTION_INVERT:
						// get each and invert
						page.lister.Each(function ( item ) {
							item.self.Marked(item, !item.marked);
						});
						break;
					case MEDIA_ACTION_STOP_RECORD:
						var itemsForUnmark,
							itemsFound = false,
							date = new Date();
						// if we have marked files with 'in progress status' we should use them instead of focused item
						if ( page.lister.states.marked && page.lister.states.marked.length > 0 ) {
							itemsForUnmark = page.lister.states.marked.slice(0);
							page.lister.states.marked.forEach(function ( item ) {
								if ( item.data.state === 2 ) {  // item 'in progress'
									pvrManager.ChangeEndTime(item.data.id, String(date.getTime() / 1000));
									itemsFound = true;
								}
							});
							itemsForUnmark.forEach(function ( item ) {
								page.lister.Marked(item, false);
							});
						}
						if ( !itemsFound && page.lister.Current().data.state === 2 ) {
							// so there is no right marked files and we should use focused one
							pvrManager.ChangeEndTime(page.lister.Current().data.id, String(date.getTime() / 1000));
						}
						break;
					case MEDIA_ACTION_DELETE:
						// find all appropriate items
						var items = page.lister.ActiveItems();
						new CModalDelete(module.page, items);
						break;
				}
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gedit.iopen      = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_OPEN,        _('Open'),       {icon:remoteControlButtonsImagesPath + 'ok.png'});
		component.menu.gedit.iadditem   = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_ADD_ITEM,    _('Add record'), {icon : remoteControlButtonsImagesPath + 'f1.png'});
		component.menu.gedit.iedit      = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_EDIT,        _('Edit'));
		component.menu.gedit.istop      = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_STOP_RECORD, _('Stop'));
		component.menu.gedit.iselone    = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_SELECT_ONE,  _('Select'), {icon : remoteControlButtonsImagesPath + 'f2.png'});
		component.menu.gedit.iselall    = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_SELECT_ALL,  _('Select all'));
		component.menu.gedit.ideselect  = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_DESELECT,    _('Deselect all'));
		component.menu.gedit.iinvert    = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_INVERT,      _('Invert selection'));
		component.menu.gedit.idelete    = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_DELETE,      _('Delete'), {icon : remoteControlButtonsImagesPath + 'back.png'});

		// group
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
				// prevent default
				return false;
			}
		});

		// group items
		component.menu.AddItem(component.menu.gview, MEDIA_TYPE_NONE,       _('All'), {marked: true, focused: true});
		component.menu.AddItem(component.menu.gview, MEDIA_TYPE_PVR_SHED,   _('Scheduled'));
		component.menu.AddItem(component.menu.gview, MEDIA_TYPE_PVR_REC,    _('In progress'));
		component.menu.AddItem(component.menu.gview, MEDIA_TYPE_PVR_ERR,    _('Errors'));
		component.menu.AddItem(component.menu.gview, MEDIA_TYPE_PVR_DONE,   _('Completed'));

		// group
		component.menu.gsort = component.menu.AddGroup('gsort', _('Sort'), {
			onclick: function () {
				// close the menu and apply filter
				page.modalMenu.Show(false);
				if ( page.lister.sortType !== this.iid ) {
					page.lister.sortType = this.iid;
				}
				page.lister.Refresh();
				// prevent focus lose
				module.page.lister.Focused(module.page.lister.FindOne(), true);
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gsort.iname     = component.menu.AddItem(component.menu.gsort, MEDIA_ACTION_SORT_NAME, _('By name'), {focused: true});
		component.menu.gsort.itime     = component.menu.AddItem(component.menu.gsort, MEDIA_ACTION_SORT_TIME, _('By time'));
		component.menu.gsort.itype     = component.menu.AddItem(component.menu.gsort, MEDIA_ACTION_SORT_TYPE, _('By state'));
		component.menu.gsort.iduration = component.menu.AddItem(component.menu.gsort, MEDIA_ACTION_SORT_SIZE, _('By duration'));

		// default group
		component.menu.Switch(component.menu.gedit);
		return component;
	}

	/**
	 * View initialization
	 */
	module.init = function () {
		gettext.init({name: getCurrentLanguage()}, function () {
			// create all components and fill everything
			module.fill();

			// prepare images to cache
			// buttons
			var imageList = ['exit.png', 'f1.png', 'f2.png', 'f4.png'].map(function ( image ) {
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
				// show main page
				module.show();
			});
		});

	};

	/**
	 * View filling with components
	 */
	module.fill = function () {
		// page with its components creation and filling
		module.page = initPage();
		module.page.breadCrumb      = initBreadCrumb(module.page);
		module.page.lister          = initLister(module.page);
		module.page.preview         = initPreview(module.page);
		module.page.exitButtonPanel = initExitButtonPanel(module.page);
		module.page.buttonPanel     = initButtonPanel(module.page);
		module.page.modalMenu       = initModalMenu(module.page);
		module.page.input           = initCFilterInput();

		// get stored PVR records and set to lister
		module.page.lister.SetData(app.models.main.load());
		// render root level
		module.page.lister.Open({type: MEDIA_TYPE_PVR_ROOT});
		// set focus
		module.page.lister.Activate(true);
		//
		module.page.lister.onFocus = function ( current, previous ) {
			if ( current === null ) {
				current = module.page.lister.FindOne();
				module.page.lister.Focused(current, true, true);
			}
			module.page.buttonPanel.Hidden(module.page.buttonPanel.btnF2, !current.data.markable);
			module.page.preview.info(current.data);
		};

		module.updatePVRData = function () {
			// get stored PVR records and set to lister
			module.page.lister.UpdateList(app.models.main.load());
			module.page.preview.SetItemsCount();
			// hide or show buttons
			if ( module.page.lister.Length() > 0 === module.page.lister.hideF2 ) {
				module.page.lister.hideF2 = !module.page.lister.hideF2;
				module.page.buttonPanel.Hidden(module.page.buttonPanel.btnF2, module.page.lister.hideF2);
			}
			// hide button and preview
			if ( module.page.lister.Length() > 0 === module.page.lister.hideFrameBtn ) {
				module.page.lister.hideFrameBtn = !module.page.lister.hideFrameBtn;
				module.page.buttonPanel.Hidden(module.page.buttonPanel.btnFrame, module.page.lister.hideFrameBtn);
				if ( module.page.lister.hideFrameBtn && module.page.preview.isVisible ) {
					module.page.preview.Show(false);
				}
			}

			if ( !module.page.lister.Current() && module.page.lister.handle.children.length !== 0 ) {
				// if there is items but no focused apply focus to the first one
				if ( !module.page.lister.isActive ) {
					module.page.lister.Activate();
				}
				module.page.lister.Focused(module.page.lister.FindOne(), true);
			}
			// show background picture
			if ( module.page.lister.handle.children.length === 0 && module.page.lister.isVisible ) {
				module.page.lister.Show(false);
			}
			// show background picture
			if ( module.page.lister.handle.children.length !== 0 && !module.page.lister.isVisible ) {
				module.page.lister.Show(true);
			}
		};

		module.timer = window.setInterval(function () {
			module.updatePVRData();
		}, 6000);
	};

	/**
	 * View is ready to display
	 */
	module.show = function () {
		module.page.Show(true); // display main page
		module.updatePVRData(); // refresh data
	};

	/**
	 * Global navigation key actions
	 * @namespace
	 */
	module.actions = {
		exit: function () {
			if ( !module.page.lister.parentItem.filterText ) {
				stbStorage.removeItem(getWindowKey(WINDOWS.PVR));
				stbWebWindow.close(); // full exit
			} else {
				module.page.lister.Open({type: MEDIA_TYPE_BACK});
				module.updatePVRData();
				if ( module.page.lister.Length() !== 0 ) {
					module.page.lister.Activate(true);
					module.page.lister.Focused(module.page.lister.FindOne(), true, true);
				}
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

		menu : function () {
			module.page.modalMenu.Show(true);
		},

		f1 : function () {
			echo('F1 was pressed');
			new CModalAddRecord(module.page, _('Add record'), '');
		},

		f2: function ( move ) {
			echo('F2 was pressed');
			// check if action is permitted
			if ( !module.page.buttonPanel.btnF2.data.hidden ) {
				// get affected item
				var item = module.page.lister.Current();
				if ( item.data.markable && module.page.lister.Marked(item, !item.marked) ) {
					// optional move to the next after marking
					if ( move !== false ) {module.page.lister.MoveNext(1);}
					module.page.lister.Focused(module.page.lister.Next());
				}
			}
		},

		f4: function () {
			module.page.input.Fold(!module.page.input.IsFolded);
		},

		remove: function () {
			// find all appropriate items
			var items = module.page.lister.ActiveItems();
			if ( items.length ) { new CModalDelete(module.page, items);}
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
