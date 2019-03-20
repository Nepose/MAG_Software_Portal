/**
 * Media component: DVB channels
 * @author Roman Stoian
 */

'use strict';

var remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

/**
 * @class DVBChannels
 * @constructor
 */
var DVBChannels = new CPage();
DVBChannels.name = 'CPageDVBChannels';
DVBChannels.menuId = 'dvbChannels';


DVBChannels.onInit = function () {
	/** link to the object for limited scopes */
	var self = this,
		i;

	this.lastChannel = null;

	this.needSave = false;
	this.goToChFlag = false;
	this.TVnumber = '';
	this.timer = {};
	this.scanningInProgress = false;
	this.scanTotalFound = 0;
	this.inputs = [];
	this.list = null;

	if ( !configuration.mayDVB ) {
		return 0;
	}

	if ( window.stbDvbManager ) {
		this.inputs = stbDvbManager.inputs;
	} else {
		return 0;
	}

	if ( this.inputs.length === 0 ) {
		return 0;
	}

	dvbTypes = ['DVB-C', 'DVB-T', 'DVB-T2', 'DVB-S/DVB-S2'];
	if ( this.inputs[0].TYPE_DVB_C ) dvbTypes[this.inputs[0].TYPE_DVB_C] = 'DVB-C';
	if ( this.inputs[0].TYPE_DVB_T ) dvbTypes[this.inputs[0].TYPE_DVB_T] = 'DVB-T';
	if ( this.inputs[0].TYPE_DVB_T2 ) dvbTypes[this.inputs[0].TYPE_DVB_T2] = 'DVB-T2';
	if ( this.inputs[0].TYPE_DVB_S ) dvbTypes[this.inputs[0].TYPE_DVB_S] = 'DVB-S';
	if ( this.inputs[0].TYPE_DVB_S2 ) dvbTypes[this.inputs[0].TYPE_DVB_S2] = 'DVB-S2';

	this.DVBType = (function(){
		self.inputs[0].currentScanTypes[0];
	})();




	for ( i = 0; i < this.inputs.length; i++ ) {
		if ( this.inputs[i].capabilities.antennaPower ) {
			this.inputs[i].antennaPower = true;
		}
	}

	function onScanProgress ( data ) {
		if ( data.state === self.inputs[0].STATE_STOP || data.state === self.inputs[0].STATE_ERROR ) {
			self.scanningInProgress = false;
			self.domScanInProgress.style.display = 'none';
			if ( self.loadChannels(true) && (currCPage === self || MediaPlayer.parent === self) ) {
				self.Reset();
			}
		} else {
			self.domPercentScan.innerHTML = data.progress + '%';
			self.domTitleFreqScanText.innerHTML = data.frequency;
		}
	}

	function onChannelFound ( data ) {
		self.scanTotalFound++;
		self.domTitleTotalScanText.innerHTML = self.scanTotalFound;

		self.domTitleLastScanText.innerHTML = data.name;
	}

	function onAntennaPower ( state ) {
		if ( !state ) {
			self.ModalMenu.Menu.gdvbAntena.slist.Marked(self.ModalMenu.Menu.gdvbAntena.ion, false);
			self.ModalMenu.Menu.gdvbAntena.slist.Marked(self.ModalMenu.Menu.gdvbAntena.ioff, true);
			if ( currCPage && MediaPlayer.dvbPowerManualOn ) {
				new CModalHint(currCPage, _('Detected passive antenna type'), 2000);
			}
			MediaPlayer.dvbPowerManualOn = false;
		}

	}

	for ( i = 0; i < this.inputs.length; i++ ) {
		this.inputs[i].onScanProgress = onScanProgress;
		this.inputs[i].onChannelFound = onChannelFound;
		this.inputs[i].onAntennaPower = onAntennaPower;
	}



	this.ModalMenu = new CModal(this);

	this.epgNow  = {
		id : null,
		now : []
	};

	this.domPercentScan = this.handle.querySelector('.percentScan');
	this.domChannelNumber = this.handle.querySelector('.channelNumber');
	this.domScanInProgress = this.handle.querySelector('.scanInProgress');
	this.domEpgNow = this.handle.querySelector('.epgNow');
	this.domEpgNext = this.handle.querySelector('.epgNext');
	this.domInfoTitle = this.handle.querySelector('.infoTitle');
	this.domTitleFreqScanText = this.handle.querySelector('.titleFreqScanText');
	this.domTitleLastScanText = this.handle.querySelector('.titleLastScanText');
	this.domTitleTotalScanText = this.handle.querySelector('.titleTotalScanText');

	this.handle.querySelector('.titleFreqScan').innerHTML = '<b>'+_('Frequency')+':&nbsp;&nbsp;</b>';
	this.handle.querySelector('.titleTotalScan').innerHTML = '<b>'+_('Total found')+':&nbsp;&nbsp;</b>';
	this.handle.querySelector('.titleLastScan').innerHTML = '<b>'+_('Last found')+':&nbsp;&nbsp;</b>';

	/**
	 * main side menu
	 * @type {CGroupMenu}
	 */
	this.ModalMenu.Menu = new CGroupMenu(this.ModalMenu);
	this.ModalMenu.Menu.Init(this.handle.querySelector('div.cgmenu-main'));

	this.ModalMenu.Init(element('div', {className: 'cmodal-menu'}, this.ModalMenu.Menu.handle));
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
			self.ModalMenu.Show(false);
			switch (this.iid) {
				case MEDIA_ACTION_OPEN:
					self.DVBList.Open(self.DVBList.activeItem);
					break;
				//case MEDIA_ACTION_SELECT_ALL:
				//	self.DVBList.Each(function (item) {
				//		item.self.Marked(item, true);
				//	});
				//	break;
				//case MEDIA_ACTION_DESELECT:
				//	self.DVBList.Each(function (item) {
				//		item.self.Marked(item, false);
				//	});
				//	break;
				//case MEDIA_ACTION_INVERT:
				//	// get each and invert
				//	self.DVBList.Each(function (item) {
				//		item.self.Marked(item, !item.marked);
				//	});
				//	break;
				case MEDIA_ACTION_DELETE:
					var items = self.DVBList.ActiveItems();

					new CModalConfirm(self,
						_('Confirm deletion'),
						_('Are you sure you want to delete') + '<br>' + (items.length > 1 ? _('all entries selected?') : _('current entry?')),
						_('Cancel'),
						function () {},
						_('Yes'),
						function () {
							setTimeout(function () {
								var data = [], i = 0;

								items.forEach(function (item) {
									data[i] =  item.data;
									if ( FAVORITES_NEW[data[i].uri] || FAVORITES[data[i].uri] ) {
										MediaBrowser.FavRemove( data[i].uri );
									}
									if ( item.focused ) {
										self.domInfoTitle.innerHTML = '';
										MediaPlayer.end();
										self.clearEPG();
									}
									i++;
								});
								self.actionFileDelete( data );
								//self.DVBList.DeleteAll( items );

							}, 5);
						}
					);
					break;
			}
			return false;
		}
	});

	this.ModalMenu.Menu.gedit.iopen     = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_OPEN,          _('Open'), {icon: remoteControlButtonsImagesPath + 'ok.png'});
	//this.ModalMenu.Menu.gedit.iselect = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_SELECT_ALL, _('Select all'));
	//this.ModalMenu.Menu.gedit.ideselect = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_DESELECT, _('Deselect all'));
	//this.ModalMenu.Menu.gedit.iinvert = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_INVERT, _('Invert selection'));
	this.ModalMenu.Menu.gedit.idelete = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_DELETE, _('Delete'));
	// default group

	this.ModalMenu.Menu.gdvb = this.ModalMenu.Menu.AddGroup('gdvb', _('DVB menu'), {
		onclick: function () {
			self.ModalMenu.Show(false);
			switch (this.iid) {
				case MEDIA_ACTION_DVB_EPG:
					self.actionInfo();
					break;
				case MEDIA_ACTION_AUTO_SCAN_DVB:
					new CModalScanDVB(self);
					break;
				case MEDIA_ACTION_MANUAL_SCAN_DVB:
					new CModalManualScanDVB(self);
					break;
				case MEDIA_ACTION_CLEAR_DVB:
					new CModalConfirm(self,
						_('Confirm deletion'),
						_('Are you sure you want to delete') + '<br>' +  _('all entries?'),
						_('Cancel'),
						function () {},
						_('Yes'),
						function () {
							setTimeout(function () {
								self.DVBList.list.forEach(function ( data ) {
									if ( FAVORITES_NEW [ data.uri ] || FAVORITES [ data.uri ] ) {
										MediaBrowser.FavRemove( data.uri );
									}
								});
								self.DVBList.data = [];
								self.domInfoTitle.innerHTML = '';
								stbDvbManager.channelList.clear();
								MediaPlayer.end();
								self.Reset(true);
							}, 5);
						}
					);
					break;
				case MEDIA_ACTION_DVB_EPG_GRID:
					self.loadEPGGrid();
					break;
			}
			return false;
		}
	});
	this.ModalMenu.Menu.gdvb.gepg = this.ModalMenu.Menu.AddItem( this.ModalMenu.Menu.gdvb, MEDIA_ACTION_DVB_EPG, _('EPG'), {icon: remoteControlButtonsImagesPath + 'info.png'} );
	this.ModalMenu.Menu.gdvb.gepggrid = this.ModalMenu.Menu.AddItem( this.ModalMenu.Menu.gdvb, MEDIA_ACTION_DVB_EPG_GRID, _( 'EPG grid ') );
	this.ModalMenu.Menu.gdvb.gascan     = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvb, MEDIA_ACTION_AUTO_SCAN_DVB,_('Auto scan'));
	this.ModalMenu.Menu.gdvb.gmscan = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvb, MEDIA_ACTION_MANUAL_SCAN_DVB, _('Manual scan'));
	this.ModalMenu.Menu.gdvb.gclear = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvb, MEDIA_ACTION_CLEAR_DVB, _('Clear list'));

	if ( this.inputs.length && this.inputs[0].capabilities.antennaPower || this.inputs.length > 1 ) {
		this.ModalMenu.Menu.gdvbAntena = this.ModalMenu.Menu.AddGroup('gdvbAntena', _('Antenna type'), {
			onclick: function () {
				switch ( this.data ) {
					case 1:
						(self.ModalMenu.Menu.gdvbAntena.slist.states.marked || []).forEach(function ( item ) {
							item.self.Marked(item, false);
						});
						for ( i = 0; i < self.inputs.length; i++ ) {
							if ( this.inputs[i].capabilities.antennaPower ) {
								self.inputs[i].antennaPower = true;
							}
						}
						MediaPlayer.dvbPowerManualOn = true;
						break;
					case 2:
						(self.ModalMenu.Menu.gdvbAntena.slist.states.marked || []).forEach(function ( item ) {
							item.self.Marked(item, false);
						});
						MediaPlayer.dvbPowerManualOn = false;
						for ( i = 0; i < self.inputs.length; i++ ) {
							if ( this.inputs[i].capabilities.antennaPower ) {
								self.inputs[i].antennaPower = false;
							}
						}
						break;
				}
				self.ModalMenu.Show(false);
				return false;
			}
		});

		this.ModalMenu.Menu.gdvbAntena.ion = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvbAntena, 1, _('Active'), {data: 1});
		this.ModalMenu.Menu.gdvbAntena.ioff = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvbAntena, 2, _('Passive'), {data: 2});
	}



	this.ModalMenu.Menu.Switch(this.ModalMenu.Menu.gedit);

	this.ModalMenu.onShow = function () {
		var currentItem = self.DVBList.ActiveItem(),
			activeItems = self.DVBList.ActiveItems();

		if ( currentItem ) {
			this.Menu.Hidden ( this.Menu.gedit, false );
			this.Menu.gdvb.slist.Hidden ( this.Menu.gdvb.gepg, false );
			this.Menu.gdvb.slist.Hidden ( this.Menu.gdvb.gepggrid, false );
			this.Menu.gdvb.slist.Hidden ( this.Menu.gdvb.gclear, false );
		} else {
			this.Menu.Hidden ( this.Menu.gedit, true );
			this.Menu.Switch ( this.Menu.gdvb );
			this.Menu.gdvb.slist.Hidden ( this.Menu.gdvb.gepg, true );
			this.Menu.gdvb.slist.Hidden ( this.Menu.gdvb.gepggrid, true );
			this.Menu.gdvb.slist.Hidden ( this.Menu.gdvb.gclear, true );
		}
		this.Menu.gedit.slist.Hidden ( this.Menu.gedit.idelete,  activeItems.length === 0 ); //this.parent.BPanel.btnF2.data.hidden ||
		this.Menu.Activate();
		this.Menu.ApplyArrows();
	};
	/**
	 * @type {CBreadCrumb}
	 */
	this.BCrumb = new CBreadCrumb(this);
	this.BCrumb.rightItems = WINDOW_WIDTH === 720 ? 1 : 2;
	this.BCrumb.Init(PATH_IMG_PUBLIC, this.handle.querySelector('.body .header .cbcrumb'));
	this.BCrumb.SetName(_('DVB channels'));

	// this.SearchBar = new CFilterInput(this, {
	// 	parent: this.handle.querySelector('.body .header .csbar'),
	// 	hint: _('Enter name...'), // @TODO localize
	// 	folded: true,
	// 	events:{
	// 		onEnter: function(){
	// 			// clear last filter
	// 				if ( self.DVBList.path[self.DVBList.path.length-1].filterText ) {
	// 					self.DVBList.path.pop();
	// 					self.BCrumb.Pop();
	// 				}
	// 			// type
	// 			var filter = this.GetValue();
	// 			if ( filter !== '' ) {
	// 				// go deeper
	// 				var clone = {},
	// 					last  = self.DVBList.path[self.DVBList.path.length-1];
	// 				// prepare
	// 				for ( var attr in last ) {
	// 					clone[attr] = last[attr];
	// 				}
	// 				clone.filterText = filter;
	// 				// current node but filtered
	// 				echo(clone,'clone Open');
	// 				self.DVBList.Open(clone);
	// 			} else {
	// 				// clear and refresh
	// 				self.DVBList.path[self.DVBList.path.length-1].filterText = self.DVBList.filterText = self.DVBList.parentItem.filterText = '';
	// 				self.DVBList.Refresh();
	// 			}
	// 			self.BCrumb.Show(true);
	// 			this.Fold(true);
	// 			// refresh preview
	// 			self.DVBList.onFocus(self.DVBList.Current());
	// 			return true;
	// 		},
	// 		onChange: function(){
	// 			if ( self.SearchBar.timer ) {
	// 				clearTimeout(self.SearchBar.timer);
	// 			}
	// 			// add delay
	// 			self.SearchBar.timer = setTimeout(function(){
	// 				// show info in preview block
	// 				var item = self.DVBList.FirstMatch(self.SearchBar.GetValue());
    //
	// 				if ( item ) {
	// 					self.DVBList.Focused(item, true);
	// 					self.SearchBar.focus();
	// 				}
	// 			}, 800);
	// 		},
	// 		onUnfold: function(){
	// 			self.BCrumb.Show(false);
	// 		},
	// 		onFold: function(){
	// 			self.BCrumb.Show(true);
	// 		},
	// 		onKey: function(){
	// 			this.SetValue(self.DVBList.path[self.DVBList.path.length-1].filterText || '');
	// 		}
	// 	}
	// });
	// this.SearchBar.timer = 0;

	this.SearchBar = new CFilterInput(this, {
		parent: this.handle.querySelector('.body .header .csbar'),
		hint: _('Enter name...'), // @TODO localize
		folded: true,
		events:{
			onEnter: function(){
				var filter = this.GetValue(),
					filters;

				// type
				filters = ['ct', 'name', filter];
				self.DVBList.filterText = filter;
				if ( filter !== '' ) {
					if ( self.DVBList.path[self.DVBList.path.length-1].filterText ) {
						self.DVBList.path.pop();
						self.BCrumb.Pop();
					}
					// show info in preview block
					self.DVBList.filters = filters;
					// self.DVBList.filters = self.DVBList.filters.concat(filters);
					self.DVBList.pageIndex = 0;
					self.DVBList.itemIndex = 0;
					self.DVBList.listIndex = 0;
					self.DVBList.createList();
					self.DVBList.loadChannels(true, true);
					self.DVBList.Open({type: MEDIA_TYPE_DVB_ROOT, data: self.DVBList.list, filterText: filter, filters: filters, count: self.DVBList.count});

				} else {
					if ( self.DVBList.path.length > 1 ) {
						self.DVBList.Open({type: MEDIA_TYPE_BACK});
					}
				}
				self.BCrumb.Show(true);
				this.Fold(true);
				// refresh preview
				//self.DVBList.onFocus(self.DVBList.Current());
				return true;
			},
			onChange: function(){
				//if ( self.SearchBar.timer ) {
				//	clearTimeout(self.SearchBar.timer);
				//}
				// add delay
				//self.SearchBar.timer = setTimeout(function(){
				//	// show info in preview block
				//	//var item = self.DVBList.FirstMatch(self.SearchBar.GetValue());
				//	//if ( item ) {
				//	//	self.DVBList.Focused(item, true);
				//	//	self.SearchBar.focus();
				//	//}
				//}, 400);
			},
			onUnfold: function(){
				self.BCrumb.Show(false);
			},
			onFold: function(){
				self.BCrumb.Show(true);
			},
			onKey: function(){
				this.SetValue(self.DVBList.path[self.DVBList.path.length-1].filterText || '');
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
		DVBChannels.actionExit();
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
	//this.BPanel.btnF2 = this.BPanel.Add(KEYS.F2, 'f2.png', _('Select'), function () {
	//	self.actionF2();
	//});
	this.BPanel.btnF3add = this.BPanel.Add(KEYS.F3, 'f3.png', _('Add to<br>favorites'), function () {
		self.actionF3add();
	});
	this.BPanel.btnF3del = this.BPanel.Add(KEYS.F3, 'f3.png', _('Remove from<br>favorites'), function () {
		self.actionF3del();
	}, true);

	this.DVBList = new DVBList(this);
	this.DVBList.Init(this.handle.querySelector('.body .content .clist-main'));
	this.DVBList.SetBreadCrumb(this.BCrumb);
	this.DVBList.SetSearchBar(this.SearchBar);

	this.Tray = new CBase(this);
	this.Tray.Init(this.handle.querySelector('.header .tray'));
	this.Tray.Show(false, false);
	this.Tray.showAttr = 'table-cell';
	this.Tray.iconFilter = element('img');
	this.Tray.iconBuffer = element('img', {className: 'copy', src: PATH_IMG_PUBLIC + 'ico_copy.png'});


	//DVBEpg.Init( document.getElementById('pageDVBEpg') );
};


/**
 * Hook on the page appearance
 */
DVBChannels.onShow = function () {
	MediaPlayer.changeScreenMode(true);
	// DVBChannels.DVBList.Activate();
};


DVBChannels.Reset = function ( refresh ) {
	var index = this.DVBList.listIndex;
	//var map = null,
	//	index = -1;
	this.DVBList.Reset();
	this.clearEPG();

	if ( !refresh ) {
		this.loadChannels();
		if ( this.DVBList.list.length === 0 ) {
			setTimeout(function () {
				new CModalConfirm(DVBChannels,
					_('No DVB channels'),
					_('Start auto scan?'),
					_('Cancel'),function(){},
					_('Start'), function(){new CModalScanDVB(currCPage);}
				);
			}, 5);
			this.DVBList.Open( {type: MEDIA_TYPE_DVB_ROOT, data: this.DVBList.list} );
			return;
		}
		//if ( this.lastChannel && this.lastChannel.length ) {
		//	this.DVBList.parentItem = {type: MEDIA_TYPE_ROOT_DVB, data: this.DVBList.data};
		//	for ( var i = 0; i < this.lastChannel.length-1; i++ ) {
		//		map = this.DVBList.parentItem.data.map(mapGroup);
		//		index = map.indexOf( this.lastChannel[i].name );
		//		if ( index !== -1 ) {
		//			this.DVBList.path.push( this.DVBList.parentItem );
		//			this.DVBList.bcrumb.Push('/', 'media/type_'+this.DVBList.parentItem.data[index].type+'.png', this.DVBList.parentItem.data[index].name ? this.DVBList.parentItem.data[index].name : '');
		//			this.DVBList.parentItem = this.DVBList.parentItem.data[index];
		//		} else {
		//			this.DVBList.Open({type: MEDIA_TYPE_ROOT_DVB,data:this.DVBList.data});
		//			return;
		//		}
		//	}
		//	this.DVBList.Open(this.DVBList.parentItem);
		//	index = -1;
		//	if ( this.lastChannel[this.lastChannel.length-1] ) {
		//		if ( this.lastChannel[this.lastChannel.length-1].id ) {
		//			map = this.DVBList.parentItem.data.map(mapDVB);
		//			index = map.indexOf( this.lastChannel[this.lastChannel.length-1].name + ' ' + this.lastChannel[this.lastChannel.length-1].id );
		//		} else {
		//			map = this.DVBList.parentItem.data.map(mapGroup);
		//			index = map.indexOf( this.lastChannel[this.lastChannel.length-1].name );
		//		}
		//		if ( index !== -1 ) {
		//			this.DVBList.Focused(this.DVBList.handle.children[index+(this.DVBList.handle.children[0].data.type === MEDIA_TYPE_BACK? 1:0)], true);
		//			if ( this.lastChannel[this.lastChannel.length-1].id ) {
		//				this.DVBList.Open(this.DVBList.activeItem.data, false);
		//			}
		//		}
		//	}
		//	return;
		//}
	}
	if ( refresh ) {
		this.DVBList.SetPositionByIndex(index, true);
	}
	this.DVBList.Open( {type: MEDIA_TYPE_DVB_ROOT, data: this.DVBList.list, filters: this.DVBList.filters, count: this.DVBList.count} );
};


DVBChannels.EventHandler = function (event) {
	if( DVBChannels.scanningInProgress && event.code !== KEYS.EXIT ) {
		event.preventDefault();
		return false;
	}
	if ( this.SearchBar.EventHandler(event) !== true ) {
		// default
		switch (event.code) {
			//case KEYS.F2:
			//	// search bar activation
			//	DVBChannels.actionF2();
			//	break;
			case KEYS.OK:
				if (DVBChannels.goToChFlag) {
					clearTimeout(DVBChannels.timer.goToChannel);
					DVBChannels.DVBList.goToChannel(parseInt(DVBChannels.TVnumber, 10));
					DVBChannels.TVnumber = '';
					DVBChannels.goToChFlag = false;
					DVBChannels.domChannelNumber.style.display = 'none';
					MediaPlayer.domChannelNumber.style.display = 'none';
					event.preventDefault();
					break;
				}
				/* falls through */
			case KEYS.PAGE_UP:
			case KEYS.PAGE_DOWN:
			case KEYS.UP:
			case KEYS.DOWN:
			case KEYS.LEFT:
			case KEYS.RIGHT:
				// file list navigation
				DVBChannels.DVBList.EventHandler(event);
				break;
			case KEYS.EXIT:
				DVBChannels.actionExit();
				break;
			case KEYS.EPG:
			case KEYS.INFO:
				DVBChannels.actionInfo();
				break;
			case KEYS.BACK:
			case KEYS.MENU:
			case KEYS.F1:
			case KEYS.F3:
				// global keys
				DVBChannels.BPanel.EventHandler(event);
				break;
			case KEYS.PLAY_PAUSE:
				DVBChannels.actionPlayPause();
				break;
			case KEYS.STOP:
				if (DVBChannels.DVBList.activeItem.data.type === MEDIA_TYPE_STREAM) {
					MediaPlayer.end();
				}
				break;
			case KEYS.REFRESH:
				DVBChannels.actionRefresh();
				break;
			case KEYS.NUM0:
				DVBChannels.goToChannel('0');
				break;
			case KEYS.NUM1:
				DVBChannels.goToChannel('1');
				break;
			case KEYS.NUM2:
				DVBChannels.goToChannel('2');
				break;
			case KEYS.NUM3:
				DVBChannels.goToChannel('3');
				break;
			case KEYS.NUM4:
				DVBChannels.goToChannel('4');
				break;
			case KEYS.NUM5:
				DVBChannels.goToChannel('5');
				break;
			case KEYS.NUM6:
				DVBChannels.goToChannel('6');
				break;
			case KEYS.NUM7:
				DVBChannels.goToChannel('7');
				break;
			case KEYS.NUM8:
				DVBChannels.goToChannel('8');
				break;
			case KEYS.NUM9:
				DVBChannels.goToChannel('9');
				break;
			default:
				// block all the rest
				event.preventDefault();
		}
	}
};

function unTune () {
	var i,
		tuners = stbDvbManager.tuners;

	for ( i = 0; i < tuners.length; i++ ) {
		tuners[i].untune();
	}
};


DVBChannels.actionExit = function () {
	var self = this;

	if( this.scanningInProgress ) {
		new CModalConfirm(this,_('Scanning'),_('Stop scanning?'),
			_('Cancel'),function(){},
			_('Stop'),function() {
				var i;

				DVBChannels.scanningInProgress = false;
				DVBChannels.domScanInProgress.style.display = 'none';
				for ( i = 0; i < self.inputs.length; i++ ) {
					self.inputs[i].stopScan();
				}
				DVBChannels.Reset(true);
			}
		);
		return;
	}
	if ( DVBChannels.DVBList.path.length > 1 ) {
		DVBChannels.DVBList.Back();
		return;
	}
	if ( !MediaPlayer.end() ) {
		return false;
	}

	if ( FAVORITES_CHANGED ) {
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
	clearTimeout(DVBChannels.DVBList.timer.OnFocusPlay);
	this.DVBList.Clear();
	this.DVBList.filters = [];
	//this.saveLastChannels();
	// dvbManager.RemoveFilters();
	unTune();
	DVBChannels.Show(false);
};

DVBChannels.actionRefresh = function () {
	if ( this.DVBList.prevChannel ) {
		this.DVBList.goToChannel(this.DVBList.prevChannel.channelNumber);
	}
};

DVBChannels.actionBack = function () {
	if (DVBChannels.goToChFlag) {
		clearTimeout(DVBChannels.timer.goToChannel);
		if (DVBChannels.TVnumber.length > 0) {
			DVBChannels.TVnumber = DVBChannels.TVnumber.slice(0, DVBChannels.TVnumber.length - 1);
			DVBChannels.domChannelNumber.innerHTML = DVBChannels.TVnumber;
			MediaPlayer.domChannelNumber.innerHTML = DVBChannels.TVnumber;
			if (DVBChannels.TVnumber.length > 0) {
				DVBChannels.timer.goToChannel = setTimeout(function () {
					DVBChannels.DVBList.goToChannel(parseInt(DVBChannels.TVnumber, 10));
					DVBChannels.TVnumber = '';
					DVBChannels.goToChFlag = false;
					DVBChannels.domChannelNumber.style.display = 'none';
					MediaPlayer.domChannelNumber.style.display = 'none';
				}, 2000);
			} else {
				DVBChannels.domChannelNumber.style.display = 'none';
				MediaPlayer.domChannelNumber.style.display = 'none';
			}
		}
	}
};

DVBChannels.loadEPGGrid = function ( parent ) {
	var list = [],
		delta = this.DVBList.filterText ? 1 : 0,
		data, i;


	data = this.DVBList.nativList.slice(0, this.DVBList.nativList.size);
	for ( i = 0; i < data.length; i++ ) {
		list.push({
			id: data[i].id,
			name:  data[i].name ? data[i].name : data[i].id,
			channel_number:  data[i].channelNumber
		});
	}

	if ( list.length ) {
		DVBEpg.EPGList.SetList( list );
		if ( this.DVBList.activeItem && this.DVBList.activeItem.data ) {
			DVBEpg.EPGList.SetPosition( list[this.DVBList.listIndex - delta] );
		}
		DVBEpg.Show( true, parent? parent : this );
	}
};

DVBChannels.actionInfo = function(){
	DVBChannels.initEPG();
};

DVBChannels.actionMenu = function () {
	this.ModalMenu.Show(true);
};

DVBChannels.actionF1 = function () {
	if (this.DVBList.activeItem.data.type === MEDIA_TYPE_STREAM) {
		new CModalAddRecord(this, _('Recording channel'), _('Group name') + ':', {});
	}
};

DVBChannels.goToChannel = function ( number ) {
	clearTimeout(this.timer.goToChannel);
	this.goToChFlag = true;
	this.TVnumber += number;
	this.domChannelNumber.innerHTML = this.TVnumber;
	MediaPlayer.domChannelNumber.innerHTML = this.TVnumber;
	this.domChannelNumber.style.display = 'block';
	MediaPlayer.domChannelNumber.style.display = 'block';
	var self = this;
	this.timer.goToChannel = setTimeout(function () {
		self.DVBList.goToChannel( parseInt( self.TVnumber, 10 ) );
		self.TVnumber = '';
		self.goToChFlag = false;
		self.domChannelNumber.style.display = 'none';
		MediaPlayer.domChannelNumber.style.display = 'none';
	}, 2000);
};

DVBChannels.SetPosition = function ( index ) {
	this.DVBList.SetPositionByIndex(index);
};

DVBChannels.actionPlayPause = function () {
	if ( MediaPlayer.playNow ) {
		MediaPlayer.playPause();
	} else if ( this.DVBList.activeItem.type === MEDIA_TYPE_DVB ) {
		MediaPlayer.preparePlayer(this.DVBList.parentItem.data[this.DVBList.activeItem.data.index], this, true, true, false);
	}
};

/**
 * mark/unmark the current item
 * @param {boolean} [move=true] move to the next after marking
 * Global key
 */
//DVBChannels.actionF2 = function (move) {
//	if (!this.BPanel.btnF2.data.hidden) {
//		var item = this.DVBList.ActiveItem();
//		if (item.markable && this.DVBList.Marked(item, !item.marked)) {
//			if (move !== false) {
//				this.DVBList.Focused(this.DVBList.Next(), true);
//			}
//			if (!this.BPanel.btnF3add.data.hidden || !this.BPanel.btnF3del.data.hidden) {
//				this.BPanel.Hidden(this.BPanel.btnF3add, false);
//				this.BPanel.Hidden(this.BPanel.btnF3del, true);
//			}
//		}
//	}
//};

/**
 * Add to the global list selected files (selected dirs are ignored)
 */
DVBChannels.actionF3add = function () {
	var self = this;
	// check if action is permitted
	if (!this.BPanel.btnF3add.data.hidden) {
		// collect affected items
		var items = this.DVBList.ActiveItems();
		if (items.length > 0) {
			// apply
			items.forEach(function (item) {
				// only files
				if (item.data.type !== MEDIA_TYPE_GROUP) {
					self.DVBList.SetStar(item, true);
					MediaBrowser.FavAdd( item.data.uri, {
						name: item.data.name,
						url: item.data.uri,
						type: item.type,
						markable: true
					});
				}
			});
			// switch buttons
			this.BPanel.Hidden(this.BPanel.btnF3add, true);
			this.BPanel.Hidden(this.BPanel.btnF3del, false);
		}
	}
};


/**
 * Remove from the global list
 */
DVBChannels.actionF3del = function () {
	var self = this;

	if ( !this.BPanel.btnF3del.data.hidden ) {
		var items = this.DVBList.ActiveItems();
		if (items.length > 0) {
			// apply
			items.forEach(function (item) {
				MediaBrowser.FavRemove( item.data.uri );
				self.DVBList.SetStar(item, false);
			});
			this.BPanel.Hidden(this.BPanel.btnF3add, false);
			this.BPanel.Hidden(this.BPanel.btnF3del, true);
		}
	}
};


/**
 * File/directory removal
 * @param {Array} data channels array
 */
DVBChannels.actionFileDelete = function ( data ) {
	var reset = false;

	for ( var i = 0; i < data.length; i++ ) {
		stbDvbManager.channelList.remove(data[i].id);
		if ( this.DVBList.activeItem.data === data ) {
			reset = true;
		}
		// dvbManager.RemoveChannel( data[i].id );
	}
	// dvbManager.RemoveFilters();
	MediaPlayer.end();

	this.DVBList.Refresh();
	//if (this.DVBList.parentItem.data.length === 0) {
	//	//this.BPanel.Hidden(this.BPanel.btnF2, true);
	//	this.BPanel.Hidden(this.BPanel.btnF3add, true);
	//	this.BPanel.Hidden(this.BPanel.btnF3del, true);
	//	MediaPlayer.end();
	//}

	return true;
};

DVBChannels.getListBlock = function ( start, amount ) {
	var arr = [],
		data, i;

	data = this.DVBList.nativList.slice(start, amount);

	for ( i = 0; i < data.length; i++ ) {
		data[i].channel_number = data[i].channelNumber;
		arr.push({
			name: data[i].name,
			channel_number: data[i].channelNumber,
			type: MEDIA_TYPE_DVB,
			id: data[i].id,
			url: data[i].uri
		});
	}

	return arr;
};



/**
 * Load DVB channels
 * @param {boolean} refresh reload data list
 */
DVBChannels.loadChannels = function ( refresh ) {
	var text, i,
		lastNumber = 0,
		count = 0;

	this.DVBList.count = count;
	this.DVBList.createList();
	this.DVBList.loadChannels( false, true );
	if ( this.DVBList.list.length > 0 ) {
		this.handle.querySelector('.content').querySelector('.crop').className = 'crop';
	} else {
		this.handle.querySelector('.content').querySelector('.crop').className = 'crop defImage';
	}
	return true;

	for ( i = 0; i < this.DVBList.data.length; i++ ) {
		this.DVBList.data[i].type = '';
		this.DVBList.data[i].type = MEDIA_TYPE_DVB;
		this.DVBList.data[i].channel_number = parseInt(this.DVBList.data[i].channel_number);
		if( this.DVBList.data[i].channel_number ){
			lastNumber = this.DVBList.data[i].channel_number;
		} else {
			lastNumber++;
			this.DVBList.data[i].channel_number = lastNumber;
		}
		echo(this.DVBList.data[i]);
	}

	if ( !refresh ) {
		text = gSTB.LoadUserData('dvbtv.last.json');
		if (text !== '') {
			this.lastChannel = JSON.parse(text);
		} else {
			this.lastChannel = null;
		}
	}
};

DVBChannels.saveLastChannels = function () {
	var last = JSON.stringify(this.lastChannel),
		now = [],
		active = this.DVBList.activeItem? this.DVBList.parentItem.data[ this.DVBList.activeItem.data.index ] : null;

	for (var i = 1; i < this.DVBList.path.length; i++ ) {
		if ( this.DVBList.path[i].type === MEDIA_TYPE_GROUP ) {
			now.push( {name: this.DVBList.path[i].name} );
		} else {
			now.push( { name: this.DVBList.path[i].name, id: this.DVBList.path[i].id } );
		}
	}
	if( active ) {
		if ( active.type === MEDIA_TYPE_GROUP ) {
			now.push( { name: active.name } );
		}  else {
			now.push( { name: active.name, id: active.id } );
		}
	} else {
		now.push( null );
	}
	echo(now,'TO SAVE POSITION');
	now = JSON.stringify(now);
	if ( now !== last ) {
		gSTB.SaveUserData('dvbtv.last.json', now);
	}

};

/**
 * Init epg info block
 */
DVBChannels.initEPGNow = function ( channel ){
	var data, date, sH,
		sM, eH, eM,
		init = false;

	if ( this.DVBList.activeItem.type !== MEDIA_TYPE_DVB ) {
		this.clearEPG();
		return;
	}

	if( !channel ){
		channel = this.DVBList.activeItem.data;
	}

	data = stbEpgManager.getBrief({uri: channel.uri});

	if ( !data.length ) {
		this.clearEPG();

		return;
	}

	if ( this.epgNow.id !== channel.id ) {
		this.epgNow.id = channel.id;
		this.epgNow.now = data;
		init = true;
	} else if ( this.epgNow.now[0].start !== data[0].start ) {
		this.epgNow.now = data;
		init = true;
	}
	if ( init ) {
		date = new Date(data[0].start*1000);
		sH = date.getHours();
		sH = sH>9?sH:'0'+sH;
		sM = date.getMinutes();
		sM = sM>9?sM:'0'+sM;
		date.setTime((data[0].start + data[0].duration)*1000);
		eH = date.getHours();
		eH = eH>9?eH:'0'+eH;
		eM = date.getMinutes();
		eM = eM>9?eM:'0'+eM;

		this.domEpgNow.innerHTML = '<b>' + sH + ':' + sM + '-' + eH + ':' + eM + '</b> ' + data[0].name;
		if ( data.length > 1 ) {
			date.setTime(data[1].start*1000);
			sH = date.getHours();
			sH = sH>9?sH:'0'+sH;
			sM = date.getMinutes();
			sM = sM>9?sM:'0'+sM;
			date.setTime((data[1].start + data[1].duration)*1000);
			eH = date.getHours();
			eH = eH>9?eH:'0'+eH;
			eM = date.getMinutes();
			eM = eM>9?eM:'0'+eM;
			this.domEpgNext.innerHTML = '<b>' + sH + ':' + sM + '-' + eH + ':' + eM + '</b> ' + data.name;
		} else {
			this.domEpgNext.innerHTML = '';
		}

	}
};

/**
 * Init epg block
 */
DVBChannels.initEPG = function () {
	if ( this.DVBList.activeItem.type !== MEDIA_TYPE_DVB ) {
		return;
	}
	if ( currCPage === this || currCPage.parent === this ){
		new CModalInitEPGInfo(currCPage === MediaPlayer? MediaPlayer : this, this.DVBList.activeItem.data.id);
	}
};

/**
 * Clear epg dom elements
 */
DVBChannels.clearEPG = function () {
	this.epgNow = {
		id : null,
		now : []
	};
	this.domEpgNow.innerHTML = '';
	this.domEpgNext.innerHTML = '';
};

/**
 * start auto scan
 * @param {number} type DVB type
 * @param {number} input antenna index
 */
DVBChannels.startScan = function( config, input ) {
	input = input? input: 0;
	this.scanTotalFound = 0;
	this.domTitleTotalScanText.innerHTML = '0';
	this.domTitleLastScanText.innerHTML = '';
	MediaPlayer.end();
	this.domPercentScan.innerHTML = '0%';
	for ( var i = 0; i < DVBChannels.inputs.length; i++ ) {
		DVBChannels.inputs[i].stopScan();
	}
	window.setTimeout(function(){
		DVBChannels.inputs[input].startScan(config);
	}, 100);
	this.scanningInProgress = true;
	this.domScanInProgress.style.display = 'block';
};
