/**
 * Media component: IPTV channels
 * @author Roman Stoian
 */

'use strict';

var remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

/**
 * @class IPTVChannels
 * @constructor
 */
var IPTVChannels = new CPage();
IPTVChannels.name = 'CPageIPTVChannels';
IPTVChannels.menuId = 'tvChannels';

IPTVChannels.onInit = function () {
	/** link to the object for limited scopes */
	var self = this;

	/**
	 * modal window with menu
	 * @type {CModal}
	 */
	this.needSave = false;
	this.goToChFlag = false;
	this.TVnumber = '';
	this.timer = {};

	this.epgNow  = {
		id : null,
		now : []
	};

	pvrManager.SetMaxRecordingCnt(5);

	this.domChannelNumber = this.handle.querySelector('.channelNumber');
	this.domURL = this.handle.querySelector('.URL');
	this.domPVR = this.handle.querySelector('.pvrStatus');
	this.domPVRText = this.domPVR.querySelector('.pvrText');
	this.domPVRDone = this.domPVR.querySelector('.done');
	this.domPVRWait = this.domPVR.querySelector('.wait');
	this.domPVRError = this.domPVR.querySelector('.error');
	this.domPVRWrite = this.domPVR.querySelector('.write');
	this.domPVRText.innerHTML = _('Record status') + ':';
	this.domEpgNow = this.handle.querySelector('.epgNow');
	this.domEpgNext = this.handle.querySelector('.epgNext');

	this.domInfoTitle = this.handle.querySelector('.infoTitle');

	this.lastChannel = null;

	this.ModalMenu = new CModal(this);


	/**
	 * main side menu
	 * @type {CGroupMenu}
	 */
	this.ModalMenu.Menu = new CGroupMenu(this.ModalMenu);
	this.ModalMenu.Menu.Init(this.handle.querySelector('div.cgmenu-main'));

	this.ModalMenu.onShow = function () {
		var currentItem = this.parent.TVList.Current();
		var activeItems = this.parent.TVList.ActiveItems();
		this.Menu.gedit.slist.Hidden ( this.Menu.gedit.iedit, !currentItem || currentItem.data.type === MEDIA_TYPE_BACK );
		this.Menu.gedit.slist.Hidden ( this.Menu.gedit.iopen, !currentItem );
		this.Menu.gedit.slist.Hidden ( this.Menu.gedit.igroup, !currentItem );
		this.Menu.gedit.slist.Hidden ( this.Menu.gedit.isave, !(self.needSave || FAVORITES_CHANGED) );
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iselone,  this.parent.BPanel.btnF2.data.hidden);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iselect,  this.parent.BPanel.btnF2.data.hidden);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.ideselect,this.parent.BPanel.btnF2.data.hidden || this.parent.TVList.states.marked === undefined || this.parent.TVList.states.marked.length === 0);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iinvert,  this.Menu.gedit.ideselect.hidden);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.icut,     activeItems.length  === 0);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.icopy,    activeItems.length  === 0);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.ipaste,   globalBuffer.size() === 0 || self.TVList.parentItem === globalBuffer.place());
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.idelete,  this.parent.BPanel.btnF2.data.hidden || activeItems.length === 0);
		this.Menu.Activate();
	};

	this.ModalMenu.Init(element('div', {className: 'cmodal-menu'}, this.ModalMenu.Menu.handle));

	// mouse click on empty space should close modal menu
	this.ModalMenu.handle.onclick = function(){ self.ModalMenu.Show(false); };

	this.ModalMenu.EventHandler = function (event) {
		switch (event.code) {
			case KEYS.EXIT:
			case KEYS.MENU:
				self.ModalMenu.Show(false);
				break;
			default:
				self.ModalMenu.Menu.EventHandler(event);
		}
	};

	this.ModalMenu.Menu.gedit = this.ModalMenu.Menu.AddGroup('gedit', _('Operations'), {
		onclick: function () {
			var items, list;
			self.ModalMenu.Show(false);
			switch (this.iid) {
				case MEDIA_ACTION_OPEN:
					self.TVList.Current().onclick();
					break;
				case MEDIA_ACTION_SELECT_ONE:
					self.actionF2();
					break;
				case MEDIA_ACTION_SELECT_ALL:
					// get each and mark
					self.TVList.Each(function (item) {
						item.self.Marked(item, true);
					});
					break;
				case MEDIA_ACTION_DESELECT:
					// get each and unmark
					self.TVList.Each(function (item) {
						item.self.Marked(item, false);
					});
					break;
				case MEDIA_ACTION_INVERT:
					// get each and invert
					self.TVList.Each(function (item) {
						item.self.Marked(item, !item.marked);
					});
					break;
				case MEDIA_ACTION_DELETE:
					items = self.TVList.ActiveItems();
					self.domURL.innerHTML = '';
					self.domInfoTitle.innerHTML = '';
					new CModalConfirm(self,
						_('Confirm deletion'),
						_('Are you sure you want to delete') + '<br>' + (items.length > 1 ? _('all entries selected?') : _('current entry?')),
						_('Cancel'),
						function () {},
						_('Yes'),
						function () {
							setTimeout(function () {
								var arr = [],
									active = self.TVList.activeItem;
								items.forEach(function (item) {
									arr.push(self.TVList.parentItem.data[item.data.index]);
								});
								self.TVList.DeleteAll(items);
								self.actionFileDelete(arr,self.TVList.parentItem.data);
								self.TVList.Activate(true);
								items.some(function ( item ) {
									if ( item === active ) {
										clearTimeout(self.TVList.timer.OnFocusPlay);
										return true;
									}
								});
							}, 5);
						}
					);
					break;
				case MEDIA_ACTION_CUT:
					globalBuffer.clear();
					globalBuffer.mode(globalBuffer.MODE_CUT);
					list = globalBuffer.place(self.TVList.parentItem);
					globalBuffer.onPaste = function (item) {
						self.actionFileDelete([item], list.data);
					};
					items = self.TVList.ActiveItems();
					items.forEach(function (item) {
						globalBuffer.add(self.TVList.parentItem.data[item.data.index]);
					});
					self.Tray.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_cut.png';
					self.Tray.handleInner.appendChild(self.Tray.iconBuffer);
					self.Tray.Show(true, false);
					break;
				case MEDIA_ACTION_COPY:
					items = self.TVList.ActiveItems();
					// apply the action
					globalBuffer.clear();
					globalBuffer.place(self.TVList.parentItem);
					globalBuffer.mode(globalBuffer.MODE_COPY);
					list = globalBuffer.place(self.TVList.parentItem);
					items.forEach(function (item) {
						globalBuffer.add(self.TVList.parentItem.data[item.data.index]);
					});
					self.Tray.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_copy.png';
					self.Tray.handleInner.appendChild(self.Tray.iconBuffer);
					self.Tray.Show(true, false);
					break;
				case MEDIA_ACTION_PASTE:
					globalBuffer.paste(function (item) {
						var obj = item;
						self.TVList.addChannelsToList(self.TVList.parentItem.data, [obj], false);
						self.TVList.activeItem = item;
						return true;
					});
					self.TVList.Refresh(true);
					// remove copy icon from tray
					if ( self.Tray.iconBuffer.parentNode === self.Tray.handleInner ) {
						self.Tray.handleInner.removeChild(self.Tray.iconBuffer);
					}
					// hide if not necessary anymore
					self.Tray.Show(self.Tray.handleInner.children.length !== 0, false);
					self.TVList.Activate(true);
					break;
				case MEDIA_ACTION_CREATE_GROUP:
					items = self.TVList.ActiveItems();
					if (items.length > 0) {
						var data = [];
						var arr = [];
						items.forEach(function (item) {
							arr.push(self.TVList.parentItem.data[item.data.index]);
							data.push(self.TVList.parentItem.data[item.data.index]);
						});
						new CModalCreateGroup(self, _('Make group'), data, arr);
					}
					break;
				case MEDIA_ACTION_NEW_GROUP:
					new CModalCreateGroup(self, _('Create group'), [], [],true);
					break;
				case MEDIA_ACTION_EDIT:
					new CModalChannelEdit(self, self.TVList.activeItem, self.TVList.parentItem.data[self.TVList.activeItem.data.index]);
					break;
				case MEDIA_ACTION_SAVE:
					if (self.needSave) {
						self.saveChanels(self.TVList.data);
					}
					if (FAVORITES_CHANGED) {
						MediaBrowser.FavSave();
					}
					break;
				case MEDIA_ACTION_ADD_OPER_TVLIST:
					new CModalImportTVChannels(self);
					break;
				case MEDIA_ACTION_ADD_TVLIST:
					new CModalChannelsAdd(self, true);
					break;
				case MEDIA_ACTION_ADD_TVCHANNEL:
					new CModalChannelsAdd(self);
					break;
				case MEDIA_ACTION_EXPORT_CHANNEL:
					new CModalChannelExport(self, self.TVList.parentItem.data);
					break;
			}
			return false;
		}
	});

	this.ModalMenu.Menu.gedit.iopen     = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_OPEN, _('Open'), {icon: remoteControlButtonsImagesPath + 'ok.png'});
	this.ModalMenu.Menu.gedit.iselone   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_SELECT_ONE, _('Select'), {icon: remoteControlButtonsImagesPath + 'f2.png'});
	this.ModalMenu.Menu.gedit.iselect = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_SELECT_ALL, _('Select all'));
	this.ModalMenu.Menu.gedit.ideselect = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_DESELECT, _('Deselect all'));
	this.ModalMenu.Menu.gedit.iinvert = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_INVERT, _('Invert selection'));
	this.ModalMenu.Menu.gedit.icut = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_CUT, _('Cut'));
	this.ModalMenu.Menu.gedit.icopy = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_COPY, _('Copy'));
	this.ModalMenu.Menu.gedit.ipaste = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_PASTE, _('Paste'));
	this.ModalMenu.Menu.gedit.idelete = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_DELETE, _('Delete'), {icon: remoteControlButtonsImagesPath + 'back.png'});
	this.ModalMenu.Menu.gedit.iedit = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_EDIT, _('Edit'));
	this.ModalMenu.Menu.gedit.isave = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_SAVE, _('Save changes'));
	this.ModalMenu.Menu.gedit.igroup = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_CREATE_GROUP, _('Add to group'));
	this.ModalMenu.Menu.gedit.inewgroup = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_NEW_GROUP, _('Create group'));
	// adding new functions for creation play lists
	this.ModalMenu.Menu.gedit.ioperlist = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_ADD_OPER_TVLIST, _('Add operator\'s IPTV list'));
	this.ModalMenu.Menu.gedit.iaddlist = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_ADD_TVLIST, _('Add IPTV list'));
	this.ModalMenu.Menu.gedit.iaddchannel = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_ADD_TVCHANNEL, _('Add IPTV channel'));
	this.ModalMenu.Menu.gedit.iexport = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_EXPORT_CHANNEL, _('Export channels'));
	// default group
	this.ModalMenu.Menu.Switch(this.ModalMenu.Menu.gedit);


	if ( configuration.mayEPG ) {
		this.ModalMenu.Menu.gepg = this.ModalMenu.Menu.AddGroup('gepg', _('EPG'), {
			onclick: function () {
				self.ModalMenu.Show(false);
				switch (this.iid) {
					case MEDIA_ACTION_DVB_EPG:
						self.actionInfo();
						break;
					case MEDIA_ACTION_DVB_EPG_GRID:
						self.loadEPGGrid();
						break;
				}
				return false;
			}
		});
		this.ModalMenu.Menu.gepg.gepg = this.ModalMenu.Menu.AddItem( this.ModalMenu.Menu.gepg, MEDIA_ACTION_DVB_EPG, _('EPG'), {icon: remoteControlButtonsImagesPath + 'info.png'} );
		this.ModalMenu.Menu.gepg.gepggrid = this.ModalMenu.Menu.AddItem( this.ModalMenu.Menu.gepg, MEDIA_ACTION_DVB_EPG_GRID, _( 'EPG grid ') );
	}


	this.ModalMenu.Menu.Switch(this.ModalMenu.Menu.gedit);
	/**
	 * @type {CBreadCrumb}
	 */
	this.BCrumb = new CBreadCrumb(this);
	this.BCrumb.rightItems = WINDOW_WIDTH === 720 ? 1 : 2;
	this.BCrumb.Init(PATH_IMG_PUBLIC, this.handle.querySelector('.body .header .cbcrumb'));
	this.BCrumb.SetName(_('IPTV channels'));

	/**
	 * top panel
	 * @type {CSearchBar}
	 */
	this.SearchBar = new CFilterInput(this, {
		parent: this.handle.querySelector('.body .header .csbar'),
		hint: _('Enter channel or group name...'), // @TODO localize
		folded: true,
		events:{
			onEnter: function(){
				// clear last filter
				if ( self.TVList.path[self.TVList.path.length-1].filterText ) {
					self.TVList.path.pop();
					self.BCrumb.Pop();
				}
				// type
				var filter = this.GetValue();
				if ( filter !== '' ) {
					// go deeper
					var clone = {},
						last  = self.TVList.path[self.TVList.path.length-1];
					// prepare
					for ( var attr in last ) {
						clone[attr] = last[attr];
					}
					clone.filterText = filter;
					// current node but filtered
					echo(clone,'clone Open');
					self.TVList.Open(clone);
				} else {
					// clear and refresh
					self.TVList.path[self.TVList.path.length-1].filterText = self.TVList.filterText = self.TVList.parentItem.filterText = '';
					self.TVList.Refresh();
				}
				self.BCrumb.Show(true);
				this.Fold(true);
				// refresh preview
				self.TVList.onFocus(self.TVList.Current());
				return true;
			},
			onChange: function(){
				if ( self.SearchBar.timer ) {
					clearTimeout(self.SearchBar.timer);
				}
				// add delay
				self.SearchBar.timer = setTimeout(function(){
					// show info in preview block
					var item = self.TVList.FirstMatch(self.SearchBar.GetValue());
					if ( item ) {
						self.TVList.Focused(item, true);
						self.SearchBar.focus();
					}
				}, 400);
			},
			onUnfold: function(){
				self.BCrumb.Show(false);
			},
			onFold: function(){
				self.BCrumb.Show(true);
			},
			onKey: function(){
				this.SetValue(self.TVList.path[self.TVList.path.length-1].filterText || '');
			}
		}
	});
	this.SearchBar.timer = 0;

	/**
	 * exit bottom
	 * @type {CButtonPanel}
	 */
	this.ExitBPanel = new CButtonPanel(this);
	this.ExitBPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .exit div.cbpanel-main'));
	this.ExitBPanel.btnExit = this.ExitBPanel.Add(KEYS.EXIT, 'exit.png', configuration.newRemoteControl ? _('Exit') : '', function () {
		IPTVChannels.actionExit();
	});

	/**
	 * bottom line of buttons
	 * @type {CButtonPanel}
	 */
	this.BPanel = new CButtonPanel(this);
	this.BPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .main div.cbpanel-main'));
	this.BPanel.btnMenu = this.BPanel.Add(KEYS.MENU, 'menu.png', configuration.newRemoteControl ? _('Menu') : '', function () {
		self.actionMenu();
	});
	if ( configuration.mayPVR ) {
		this.BPanel.btnF1 = this.BPanel.Add(KEYS.F1, 'f1.png', _('Record'), function () {
			if ( environment.mount_media_ro === 'true' ) {
				new CModalAlert(IPTVChannels, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
			} else {
				self.actionF1();
			}
		});
	}
	this.BPanel.btnF2 = this.BPanel.Add(KEYS.F2, 'f2.png', _('Select'), function () {
		self.actionF2();
	});
	this.BPanel.btnF3add = this.BPanel.Add(KEYS.F3, 'f3.png', _('Add to<br>favorites'), function () {
		self.actionF3add();
	});
	this.BPanel.btnF3del = this.BPanel.Add(KEYS.F3, 'f3.png', _('Remove from<br>favorites'), function () {
		self.actionF3del();
	}, true);

	this.TVList = new TVList(this);
	this.TVList.Init(this.handle.querySelector('.body .content .cslist-main'));
	this.TVList.SetBreadCrumb(this.BCrumb);
	this.TVList.SetSearchBar(this.SearchBar);

	this.Tray = new CBase(this);
	this.Tray.Init(this.handle.querySelector('.header .tray'));
	this.Tray.Show(false, false);
	this.Tray.showAttr = 'table-cell';
	this.Tray.iconFilter = element('img');
	this.Tray.iconBuffer = element('img', {className: 'copy', src: PATH_IMG_PUBLIC + 'ico_copy.png'});

	this.loadChanels();
};

/**
 * Init epg info block
 */
IPTVChannels.initEPGNow = function (index){
	//TODO remove this try catch when dvbManager will be fixed
	try {
		if ( configuration.mayEPG ) {
			if( !index && index !== 0 ) {
				index = this.TVList.activeItem.data.index;
			}
			var data = dvbManager.GetEPGBrief(this.TVList.parentItem.data[index].url);
			echo(data,'EPG');
			var init = false;
			if(data === '' || data === '{}'){
				this.clearEPG();
				return;
			}
			try{
				data = JSON.parse(data);
			} catch(e){
				echo(e,'EPG parse error');
			}
			if(!data.events || data.events.length === 0){
				this.clearEPG();
				return;
			}
			if( this.epgNow.id !== this.TVList.parentItem.data[index].url ){
				this.epgNow.id = this.TVList.parentItem.data[index].url;
				this.epgNow.now = data.events;
				init = true;
			} else if( this.epgNow.now[0].start !== data.events[0].start ) {
				init = true;
			}
			if ( init ) {
				var date = new Date(data.events[0].start*1000);
				var sH = date.getHours();
				sH = sH>9?sH:'0'+sH;
				var sM = date.getMinutes();
				sM = sM>9?sM:'0'+sM;
				date.setTime((data.events[0].start+data.events[0].duration)*1000);
				var eH = date.getHours();
				eH = eH>9?eH:'0'+eH;
				var eM = date.getMinutes();
				eM = eM>9?eM:'0'+eM;
				this.domEpgNow.innerHTML = '<b>' + sH + ':' + sM + '-' + eH + ':' + eM + '</b> ' + data.events[0].name;
				date.setTime(data.events[1].start*1000);
				sH = date.getHours();
				sH = sH>9?sH:'0'+sH;
				sM = date.getMinutes();
				sM = sM>9?sM:'0'+sM;
				date.setTime((data.events[1].start+data.events[1].duration)*1000);
				eH = date.getHours();
				eH = eH>9?eH:'0'+eH;
				eM = date.getMinutes();
				eM = eM>9?eM:'0'+eM;
				this.domEpgNext.innerHTML = '<b>' + sH + ':' + sM + '-' + eH + ':' + eM + '</b> ' + data.events[1].name;
			}
		}
	} catch (e) {
		echo(e);
	}
};

/**
 * Init epg block
 * @param {number} index of data array
 */
IPTVChannels.initEPG = function (index){
	if ( !configuration.mayEPG || this.TVList.activeItem.data.type !== MEDIA_TYPE_STREAM ) {
		return;
	}
	if ( currCPage === this || currCPage.parent === this ){
		if ( !index && index !== 0 ){
			index = this.TVList.activeItem.data.index;
		}
		new CModalInitEPGInfo(currCPage === MediaPlayer? MediaPlayer : this, this.TVList.parentItem.data[index].url);
	}
};

IPTVChannels.loadEPGGrid = function ( parent ) {
	var i;
	if ( !configuration.mayEPG ) {
		return;
	}
	var items = this.TVList.handleInner.children,
		list = [], active;
	for ( i = 0; i < items.length; i++ ) {
		if ( items[ i ].data && items[ i ].data.type !== MEDIA_TYPE_BACK && items[ i ].data.type !== MEDIA_TYPE_GROUP && !items[i].hidden ) {
			list.push({
				id: this.TVList.parentItem.data[items[ i ].data.index].url,
				name: items[ i ].data.name,
				channel_number: items[ i ].data.number
			});
			if ( this.TVList.activeItem === items[i] ) {
				active = list.length -1;
			}
		}
	}
	if ( list.length ) {
		DVBEpg.EPGList.SetList ( list );
		if ( this.TVList.activeItem && this.TVList.activeItem.data ) {
			DVBEpg.EPGList.SetPosition( list[active] );
		}
		DVBEpg.Show( true, parent? parent : this );
	}
};

IPTVChannels.getListBlock = function ( start, amount ) {
	var data = [];
	start += (this.TVList.channelStart > 0? this.TVList.channelStart: 0) + (this.TVList.handle.children[0].data.type === MEDIA_TYPE_BACK? 1:0);
	for ( var i = start; i < this.TVList.handle.children.length; i++  ) {
		echo(this.TVList.handle.children[i].data,i);
		data.push({
			name: this.TVList.handle.children[i].data.name,
			id: this.TVList.parentItem.data[this.TVList.handle.children[i].data.index].url,
			channelNumber: this.TVList.handle.children[i].data.number
		});
		if ( data.length >= amount ) {
			break;
		}
	}
	return data;
};

/**
 * Clear epg dom elements
 */
IPTVChannels.clearEPG = function(){
	this.epgNow  = {
		id : null,
		now : []
	};
	this.domEpgNow.innerHTML = '';
	this.domEpgNext.innerHTML = '';
};

/**
 * Hook on the page appearance
 */
IPTVChannels.onShow = function () {
	var arr;
	MediaPlayer.changeScreenMode(true);
	if (this.TVList.data.length === 0) {
		setTimeout(function () {
			new CModalHint(IPTVChannels, _('No IPTV channels'), 3000);
		}, 5);
	} else {
		if(this.TVList.activeItem && this.TVList.Activate){
			this.TVList.SetPosition(this.TVList.activeItem);
			this.TVList.activeItem.focus();
		}

	}

	try {
		arr = JSON.parse(pvrManager.GetAllTasks());
	} catch ( e ) {
		arr = [];
	}
	if ( arr.length ) {
		this.pvr.start();
	}
};

IPTVChannels.pvr = {
	id: null,
	run: false,
	interval: 60000,
	arr: [],
	map: [],
	start: function () {
		this.check();
		if ( this.run ) {
			return;
		}
		this.id = window.setInterval(this.check, this.interval);
		this.run = true;
	},
	stop: function () {
		if ( this.run ) {
			clearInterval(this.id);
		}
		this.arr = [];
		this.map = [];
		IPTVChannels.domPVR.style.display = 'none';
	},
	check: function ( noUpdate ) {
		var index, url,
			s1 = 0,
			s2 = 0,
			s3 = 0,
			s4 = 0;

		if ( !IPTVChannels.TVList.activeItem || !IPTVChannels.TVList.activeItem.data ) {

			return;
		}
		if ( !noUpdate ) {
			try {
				this.arr = JSON.parse(pvrManager.GetAllTasks());
			} catch ( e ) {
				this.arr = [];
			}
			echo(this.arr,'PVR Array');
			if ( !this.arr.length ) {
				this.stop();
				return;
			}
		}

		this.map = this.arr.map(function( item ){return item.url;});
		echo(this.map,'Check map');
		url = IPTVChannels.TVList.parentItem.data[IPTVChannels.TVList.activeItem.data.index].url;
		index = this.map.indexOf(url);
		if ( index !== -1 ) {
			for ( var i = 0; i < this.arr.length; i++ ) {
				if ( this.arr[i].url !== url ) {
					continue;
				}
				switch(this.arr[i].state) {
					case 1:
						s1++;
						break;
					case 2:
						s2++;
						break;
					case 3:
						s3++;
						break;
					case 4:
						s4++;
						break;
				}
			}
			if ( s1 > 0 ) {
				IPTVChannels.domPVRWait.classList.add('active');
			} else {
				IPTVChannels.domPVRWait.classList.remove('active');
			}
			if ( s2 > 0 ) {
				IPTVChannels.domPVRWrite.classList.add('active');
			} else {
				IPTVChannels.domPVRWrite.classList.remove('active');
			}
			if ( s3 > 0 ) {
				IPTVChannels.domPVRError.classList.add('active');
			} else {
				IPTVChannels.domPVRError.classList.remove('active');
			}
			if ( s4 > 0 ) {
				IPTVChannels.domPVRDone.classList.add('active');
			} else {
				IPTVChannels.domPVRDone.classList.remove('active');
			}
			IPTVChannels.domPVR.style.display = 'table';
		} else {
			IPTVChannels.domPVR.style.display = 'none';
		}
	}
};

IPTVChannels.Reset = function () {
	var map = null,
		index = -1;


	function mapFun ( item ) {
		return item.type === MEDIA_TYPE_GROUP? item.name : null;
	}

	MediaPlayer.ts_on = environment.ts_on;
	this.TVList.Reset();

	if ( this.lastChannel && this.lastChannel.length ) {
		this.TVList.parentItem = {type: MEDIA_TYPE_TV_ROOT, data:this.TVList.data};
		for ( var i = 0; i < this.lastChannel.length-1; i++ ) {
			map = this.TVList.parentItem.data.map(mapFun);
			index = map.indexOf( this.lastChannel[i].name );
			if ( index !== -1 ) {
				this.TVList.path.push( this.TVList.parentItem );
				this.TVList.bcrumb.Push('/', 'media/type_'+this.TVList.parentItem.data[index].type+'.png', this.TVList.parentItem.data[index].name ? this.TVList.parentItem.data[index].name : '');
				this.TVList.parentItem = this.TVList.parentItem.data[index];
			} else {
				this.TVList.Open({type: MEDIA_TYPE_TV_ROOT,data:this.TVList.data});
				if ( IPTV_PLAYBACK_ON_START && this.TVList.activeItem && this.TVList.activeItem.data.type === MEDIA_TYPE_STREAM ) {
					this.TVList.Open(this.TVList.activeItem.data, false);
				}
				return;
			}
		}
		this.TVList.Open(this.TVList.parentItem);
		index = -1;
		if ( this.lastChannel[this.lastChannel.length-1] ) {
			if ( this.lastChannel[this.lastChannel.length-1].url ) {
				map = this.TVList.parentItem.data.map(function(item){return item.type === MEDIA_TYPE_STREAM?item.name+' '+item.url:null;});
				index = map.indexOf( this.lastChannel[this.lastChannel.length-1].name + ' ' + this.lastChannel[this.lastChannel.length-1].url );
			} else {
				map = this.TVList.parentItem.data.map(function(item){return item.type === MEDIA_TYPE_GROUP?item.name:null;});
				index = map.indexOf( this.lastChannel[this.lastChannel.length-1].name );
			}
			if ( index !== -1 ) {
				this.TVList.Focused(this.TVList.handle.children[index+(this.TVList.handle.children[0].data.type === MEDIA_TYPE_BACK? 1:0)], true);
				if ( this.lastChannel[this.lastChannel.length-1].url ) {
					this.TVList.Open(this.TVList.activeItem.data, false);
				}

				return;
			}
		}
		if ( IPTV_PLAYBACK_ON_START && this.TVList.activeItem && this.TVList.activeItem.data.type === MEDIA_TYPE_STREAM ) {
			this.TVList.Open(this.TVList.activeItem.data, false);
		}
	} else {
		this.TVList.Open({type: MEDIA_TYPE_TV_ROOT,data:this.TVList.data});
		if ( IPTV_PLAYBACK_ON_START && this.TVList.activeItem && this.TVList.activeItem.data.type === MEDIA_TYPE_STREAM ) {
			this.TVList.Open(this.TVList.activeItem.data, false);
		}
	}
};


IPTVChannels.EventHandler = function (event) {
	if (IPTVChannels.SearchBar.EventHandler(event) !== true) {
		// default
		switch (event.code) {
			case KEYS.OK:
				if ( IPTVChannels.goToChFlag ) {
					clearTimeout(IPTVChannels.timer.goToChannel);
					IPTVChannels.TVList.goToChannel(parseInt(IPTVChannels.TVnumber, 10) + IPTVChannels.TVList.channelStart);
					IPTVChannels.TVnumber = '';
					IPTVChannels.goToChFlag = false;
					IPTVChannels.domChannelNumber.style.display = 'none';
					MediaPlayer.domChannelNumber.style.display = 'none';
					event.preventDefault();
					break;
				}
				/* falls through */
			case KEYS.HOME:
			case KEYS.END:
			case KEYS.PAGE_UP:
			case KEYS.PAGE_DOWN:
			case KEYS.UP:
			case KEYS.DOWN:
			case KEYS.LEFT:
			case KEYS.RIGHT:
				// file list navigation
				IPTVChannels.TVList.EventHandler(event);
				break;
			case KEYS.EXIT:
				IPTVChannels.actionExit();
				break;
			case KEYS.EPG:
			case KEYS.INFO:
				IPTVChannels.actionInfo();
				break;
			case KEYS.BACK:
				IPTVChannels.actionBack();
				break;
			case KEYS.REFRESH:
				IPTVChannels.actionRefresh();
				break;
			case KEYS.MENU:
			case KEYS.F1:
			case KEYS.F2:
			case KEYS.F3:
				// global keys
				IPTVChannels.BPanel.EventHandler(event);
				break;
			case KEYS.PLAY_PAUSE:
				IPTVChannels.actionPlayPause();
				break;
			case KEYS.STOP:
				if (IPTVChannels.TVList.activeItem.data.type === MEDIA_TYPE_STREAM) {
					MediaPlayer.end();
				}
				break;
			case KEYS.NUM0:
				IPTVChannels.goToChannel('0');
				break;
			case KEYS.NUM1:
				IPTVChannels.goToChannel('1');
				break;
			case KEYS.NUM2:
				IPTVChannels.goToChannel('2');
				break;
			case KEYS.NUM3:
				IPTVChannels.goToChannel('3');
				break;
			case KEYS.NUM4:
				IPTVChannels.goToChannel('4');
				break;
			case KEYS.NUM5:
				IPTVChannels.goToChannel('5');
				break;
			case KEYS.NUM6:
				IPTVChannels.goToChannel('6');
				break;
			case KEYS.NUM7:
				IPTVChannels.goToChannel('7');
				break;
			case KEYS.NUM8:
				IPTVChannels.goToChannel('8');
				break;
			case KEYS.NUM9:
				IPTVChannels.goToChannel('9');
				break;
			default:
				// block all the rest
				event.preventDefault();
		}
	}
};


IPTVChannels.actionExit = function () {
	var self = this;

	if (this.TVList.path.length > 1) {
		this.TVList.Open({type : MEDIA_TYPE_BACK});
		return;
	}
	this.pvr.stop();
	if (!MediaPlayer.end()) {
		return false;
	}
	if (this.needSave) {
		// ask to save changes of reset
		new CModalConfirm(this,
			_('IPTV channel list was changed'),
			_('Save updated IPTV channel list?'),
			_('Exit without saving'),
			function () {
				setTimeout(function () {
					var active = self.TVList.activeItem;
					self.needSave = false;
					if (FAVORITES_CHANGED) {
						MediaBrowser.FavRestore();
					}
					self.loadChanels();
					if ( active && self.TVList.Activate && self.TVList.data.length ) {
						self.TVList.SetPosition(active);
						self.TVList.activeItem.focus();
					}
					self.actionExit();
				}, 5);
			},
			_('Save'),
			function () {
				setTimeout(function () {
					self.saveChanels(self.TVList.data);
					if (FAVORITES_CHANGED) {
						MediaBrowser.FavSave();
					}
					self.actionExit();
				}, 5);
			}
		);
		return false;
	}
	if (FAVORITES_CHANGED) {
		// ask to save changes of reset
		new CModalConfirm(this,
			_('The list of favourite records has changed'),
			_('Save updated list of favourite records?'),
			_('Exit without saving'),
			function () {
				setTimeout(function () {
					MediaBrowser.FavRestore();
					self.actionExit();
				}, 5);
			},
			_('Save'),
			function () {
				setTimeout(function () {
					MediaBrowser.FavSave();
					self.actionExit();
				}, 5);
			}
		);
		return false;
	}
	// prevent player start
	clearTimeout(IPTVChannels.TVList.timer.OnFocusPlay);
	IPTVChannels.saveLastChannels();
	IPTVChannels.Show(false);
};

IPTVChannels.saveLastChannels = function(){
	var last = JSON.stringify(this.lastChannel),
		now = [],
		nowSave = '',
		active = this.TVList.activeItem? this.TVList.parentItem.data[ this.TVList.activeItem.data.index ] : null;
	for (var i = 1; i < this.TVList.path.length; i++ ) {
		if ( this.TVList.path[i].type === MEDIA_TYPE_GROUP ) {
			now.push( {name: this.TVList.path[i].name} );
		} else {
			now.push( { name: this.TVList.path[i].name, url: this.TVList.path[i].url } );
		}
	}
	if( active ) {
		if ( active.type === MEDIA_TYPE_GROUP ) {
			now.push( { name: active.name } );
		}  else {
			now.push( { name: active.name, url : active.url } );
		}
	} else {
		now.push( null );
	}
	echo(now,'TO SAVE POSITION');
	nowSave = JSON.stringify(now);
	if ( nowSave !== last ) {
		this.lastChannel = now;
		gSTB.SaveUserData('iptv.last.json', nowSave);
	}

};

IPTVChannels.actionRefresh = function () {
	var number = -1;
	if ( this.TVList.prevChannel ) {
		number = this.TVList.parentItem.data.indexOf( this.TVList.prevChannel );
		if ( number !== -1) {
			this.TVList.goToChannel( number );
		}
	}
};

IPTVChannels.actionBack = function () {
	var self = this;
	if (IPTVChannels.goToChFlag) {
		clearTimeout(IPTVChannels.timer.goToChannel);
		if (IPTVChannels.TVnumber.length > 0) {
			IPTVChannels.TVnumber = IPTVChannels.TVnumber.slice(0, IPTVChannels.TVnumber.length - 1);
			IPTVChannels.domChannelNumber.innerHTML = IPTVChannels.TVnumber;
			MediaPlayer.domChannelNumber.innerHTML = IPTVChannels.TVnumber;
			if (IPTVChannels.TVnumber.length > 0) {
				IPTVChannels.timer.goToChannel = setTimeout(function () {
					IPTVChannels.TVList.goToChannel(parseInt(IPTVChannels.TVnumber, 10) + IPTVChannels.TVList.channelStart);
					IPTVChannels.TVnumber = '';
					IPTVChannels.goToChFlag = false;
					IPTVChannels.domChannelNumber.style.display = 'none';
					MediaPlayer.domChannelNumber.style.display = 'none';
				}, 2000);
			} else {
				IPTVChannels.domChannelNumber.style.display = 'none';
				MediaPlayer.domChannelNumber.style.display = 'none';
			}
		}
	} else {
		var items = this.TVList.ActiveItems();
		if(this.BPanel.btnF2.data.hidden || items.length === 0){
			return;
		}
		this.domURL.innerHTML = '';
		this.domInfoTitle.innerHTML = '';
		new CModalConfirm(this,
			_('Confirmation'),
			_('Are you sure you want to delete') + '<br>' + (items.length > 1 ? _('all entries selected?') : _('current entry?')),
			_('Cancel'),
			function () {},
			_('Yes'),
			function () {
				setTimeout(function () {
					var arr = [],
						active = self.TVList.activeItem;
					items.forEach(function (item) {
						arr.push(self.TVList.parentItem.data[item.data.index]);
					});
					items.some(function ( item ) {
						if ( item === active ) {
							clearTimeout(self.TVList.timer.OnFocusPlay);
							return true;
						}
					});
					self.TVList.DeleteAll(items);
					self.actionFileDelete(arr,self.TVList.parentItem.data);
				}, 5);
			}
		);
	}
};


IPTVChannels.actionMenu = function () {
	this.ModalMenu.Show(true);
};


IPTVChannels.actionF1 = function () {
	if ( !configuration.mayPVR ) {
		return false;
	}
	new CModalAddRecord(this, _('Recording channel'));
};

IPTVChannels.actionInfo = function(){
	if ( configuration.mayEPG ) {
		IPTVChannels.initEPG();
	}
};


IPTVChannels.goToChannel = function (number) {
	clearTimeout(this.timer.goToChannel);
	this.goToChFlag = true;
	this.TVnumber += number;
	this.domChannelNumber.innerHTML = this.TVnumber;
	MediaPlayer.domChannelNumber.innerHTML = this.TVnumber;
	this.domChannelNumber.style.display = 'block';
	MediaPlayer.domChannelNumber.style.display = 'block';
	var self = this;
	this.timer.goToChannel = setTimeout(function () {
		self.TVList.goToChannel(parseInt(self.TVnumber, 10) + self.TVList.channelStart);
		self.TVnumber = '';
		self.goToChFlag = false;
		self.domChannelNumber.style.display = 'none';
		MediaPlayer.domChannelNumber.style.display = 'none';
	}, 2000);
};


IPTVChannels.actionPlayPause = function () {
	if (MediaPlayer.playNow) {
		MediaPlayer.playPause();
	} else if (this.TVList.activeItem.data.type === MEDIA_TYPE_STREAM) {
		MediaPlayer.preparePlayer(this.TVList.parentItem.data[this.TVList.activeItem.data.index], this, true, true, false);
	}
};


/**
 * mark/unmark the current item
 * @param {boolean} [move=true] move to the next after marking
 * Global key
 */
IPTVChannels.actionF2 = function ( move ) {
	if ( !this.BPanel.btnF2.data.hidden ) {
		var item = this.TVList.Current();
		if ( item.data.markable && this.TVList.Marked(item, !item.marked) ) {
			if ( move !== false ) {
				this.TVList.SetPosition(this.TVList.Next(), true, true);
			}
			if ( !this.BPanel.btnF3add.data.hidden || !this.BPanel.btnF3del.data.hidden ) {
				this.BPanel.Hidden(this.BPanel.btnF3add, false);
				this.BPanel.Hidden(this.BPanel.btnF3del, true);
			}
		}
	}
};


/**
 * Add to the global list selected files (selected dirs are ignored)
 */
IPTVChannels.actionF3add = function () {
	var self = this;
	// check if action is permitted
	if (!this.BPanel.btnF3add.data.hidden) {
		// collect affected items
		var items = this.TVList.ActiveItems();
		if ( items.length > 0 ) {
			// apply
			items.forEach(function (item) {
				// only files
				if (item.data.type !== MEDIA_TYPE_GROUP) {
					self.TVList.SetStar(item, true);
					MediaBrowser.FavAdd((self.TVList.parentItem.data[item.data.index].sol? self.TVList.parentItem.data[item.data.index].sol + ' ' : '') + self.TVList.parentItem.data[item.data.index].url, {
						name: self.TVList.parentItem.data[item.data.index].name,
						url: (self.TVList.parentItem.data[item.data.index].sol? self.TVList.parentItem.data[item.data.index].sol + ' ' : '') + self.TVList.parentItem.data[item.data.index].url,
						sol: self.TVList.parentItem.data[item.data.index].sol,
						type: self.TVList.parentItem.data[item.data.index].type,
						markable: true
					});
				}
			});
			// switch buttons
		}
	}
};


/**
 * Remove from the global list
 */
IPTVChannels.actionF3del = function () {
	var self = this;
	// check if action is permitted
	if (!this.BPanel.btnF3del.data.hidden) {
		var items = this.TVList.ActiveItems();
		if (items.length > 0) {
			// apply
			items.forEach(function (item) {
				MediaBrowser.FavRemove((self.TVList.parentItem.data[item.data.index].sol? self.TVList.parentItem.data[item.data.index].sol + ' ' : '') + self.TVList.parentItem.data[item.data.index].url);
				self.TVList.SetStar(item, false);
			});
		}
	}
};


/**
 * File/directory removal
 */
IPTVChannels.actionFileDelete = function (data, list) {
	var obj = null,
		deleteTrue = true;
	if ( !list ) {
		list = this.TVList.parentItem.data;
	}
	for(var i=0; i<data.length; i++){
		var number = list.indexOf(data[i]);
		if (number < 0){
			deleteTrue = false;
			continue;
		}
		if (data[i].type === MEDIA_TYPE_GROUP) {
			this.TVList.channelStart--;
		}
		obj = list.splice(number, 1);
	}

	if (this.TVList.parentItem.data.length === 0) {
		this.BPanel.Hidden(this.BPanel.btnF1, true);
		this.BPanel.Hidden(this.BPanel.btnF2, true);
		this.BPanel.Hidden(this.BPanel.btnF3add, true);
		this.BPanel.Hidden(this.BPanel.btnF3del, true);
		MediaPlayer.end();
	}
	this.needSave = true;
	if ( this.TVList.parentItem.data.length && list === this.TVList.parentItem.data ){
		this.TVList.RefreshIndex();
	}
	return deleteTrue;
};


/**
 * add channel list to channels
 * @param {Array} arr channel list
 * @param {boolean} [save] need save
 * @return {number|boolean} amount of added items or false on failure
 */
IPTVChannels.addChannels = function (arr, save) {
	if (Array.isArray(arr)) {
		var self = this,
			current_urls = this.TVList.data.map(function (el) {return el.url;});

		// remove all files excluding streams, rename existsing urls
		arr = arr.filter(function (el) {
			var test = true, index;
			if (( index = current_urls.indexOf(el.url)) !== -1) {
				if (!self.TVList.data[index].changed) {
					self.TVList.data[index].name = el.name;
				}
				test = false;
			}
			return test;
		});
		this.TVList.data = this.TVList.data.concat(arr);
		IPTVChannels.checkSolution(this.TVList.data, true);
		IPTVChannels.checkTS_data(this.TVList.data, true);
		if (save) {
			IPTVChannels.saveChanels(this.TVList.data);
		}
		return arr.length;
	}
	return false;
};

IPTVChannels.loadChanels = function () {
	try {
		var text = gSTB.LoadUserData('iptv.json'),
			data = null;
		if (text !== '') {
			data = JSON.parse(text);
			IPTVChannels.TVList.data = IPTVChannels.unescapeChanels(data);
		} else {
			IPTVChannels.TVList.data = [];
		}
		text = gSTB.LoadUserData('iptv.last.json');
		if (text !== '') {
			this.lastChannel = JSON.parse(text);
		} else {
			this.lastChannel = null;
		}
	} catch (e) {
		echo(e, 'TVChannels parse');
	}
};

IPTVChannels.saveChanels = function (data) {
	var arr = this.escapeChanels(data || this.TVList.data);
	gSTB.SaveUserData('iptv.json', JSON.stringify(arr));
	this.needSave = false;
};

/**
 * Export channel list to text from m3u8
 * @param {object} data channels list
 * @param {boolean} tree save channels in group
 * @return {string} channels list in text rormat
 */
IPTVChannels.exportChannels = function ( data, tree ) {
	var text = '#EXTM3U\r\n',
		temp = '', i;
	for ( i = 0; i < data.length; i++ ) {
		if ( data[i].type === MEDIA_TYPE_GROUP ) {
			if ( tree ) {
				temp = IPTVChannels.exportChannels(data[i].data, tree);
				text += temp;
			}
			continue;
		}
		text += '#EXTINF:-1,' + data[i].name + '\r\n';
		text += (data[i].sol? data[i].sol + ' ' : '') + data[i].url  + '\r\n';
	}
	return text;
};


IPTVChannels.checkTS = function (data, check) {
	var save = false;

	if ( !configuration.mayTimeShift ) {
		return;
	}
	if ( data.length > 0 ) {
		var arr = data.slice();
		var temp = IPTVChannels.checkTS_data(arr, check);
		save = temp.save;
		if (save) {
			IPTVChannels.saveChanels(temp.a);
		}
	}
};

IPTVChannels.checkSolution = function (a, check) {
	var l = a.length,
		save = false,
		i;

	for ( i = 0; i < l; i++ ) {
		if ( a[i].type === MEDIA_TYPE_GROUP ) {
			var temp = IPTVChannels.checkSolution(a[i].data, check);
			a[i].data = temp.a;
			save = save ? save : temp.save;
			continue;
		}
		if ( typeof a[l - 1].sol === 'undefined' ) {
			save = true;
			if ( a[i].url ) {
				var tempsource = a[i].url.trim().split(' ');

				if ( tempsource.length > 1 && validateUrl(tempsource[0] + ' ' + tempsource[1], true) ) {
					a[i].url = tempsource[1];
					for ( var j = 2; j < tempsource.length; j++ ) {
						a[i].url += ' ' + tempsource[j];
					}
					a[i].sol = tempsource[0];
				}
			}
		}
	}
	return {a: a, save: save};
};

IPTVChannels.checkTS_data = function (a, check) {
	var l = a.length,
		save = false;

	if ( !configuration.mayTimeShift ) {
		return {a: a, save: false};
	}

	for (var i = 0; i < l; i++) {
		if ( a[i].type === MEDIA_TYPE_GROUP ) {
			var temp = IPTVChannels.checkTS_data(a[i].data, check);
			a[i].data = temp.a;
			save = save ? save : temp.save;
			continue;
		}
		if ( typeof a[l - 1].tsOn === 'undefined' || check ) {
			save = true;
			if ((typeof a[i].tsOn === 'undefined' || check) && a[i].url) {
				var tempsource = a[i].url;
				if ( /rtp\:|udp\:/.test(tempsource) || /ffrt\s/.test(tempsource) || a[i].sol === 'ffrt' ) {
					a[i].tsOn = true;
				} else {
					a[i].tsOn = false;
				}
			}
		}
	}
	return {a: a, save: save};
};


IPTVChannels.escapeChanels = function (arr) {
	var data = JSON.parse(JSON.stringify(arr));
	for (var i = 0; i < data.length; i++) {
		if (data[i].data) {
			data[i].name = escape(data[i].name);
			data[i].data = IPTVChannels.escapeChanels(data[i].data);
			continue;
		}
		data[i].name = escape(data[i].name);
		data[i].url = escape(data[i].url);
	}
	return data;
};


IPTVChannels.unescapeChanels = function (arr) {
	var data = JSON.parse(JSON.stringify(arr));
	for (var i = 0; i < data.length; i++) {
		if (data[i].data) {
			data[i].name = unescape(data[i].name);
			data[i].data = IPTVChannels.unescapeChanels(data[i].data);
			continue;
		}
		data[i].name = unescape(data[i].name);
		data[i].url = unescape(data[i].url);
	}
	return data;
};
