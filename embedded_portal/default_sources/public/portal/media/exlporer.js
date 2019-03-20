/**
 * Media component: file browser
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

var remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

/**
 * @class CMediaBrowser
 * @constructor
 */
var MediaBrowser     = new CPage();
MediaBrowser.name    = 'CPageMediaBrowser';
MediaBrowser.Preview = new CBase(MediaBrowser);
MediaBrowser.menuId = 'mediaBrowser';

/**
 * Callback hook on page initialization
 */
MediaBrowser.onInit = function () {
	/** link to the object for limited scopes */
	var self = this;

	/** checking if strict mode is enforced*/
	this.isStrictMode = (function() { return !this; })();

	/**
	 * list of media types that can be played
	 * @type {[Number]}
	 */
	this.playable = [MEDIA_TYPE_VIDEO, MEDIA_TYPE_AUDIO, MEDIA_TYPE_IMAGE, MEDIA_TYPE_ISO, MEDIA_TYPE_RECORDS_ITEM, MEDIA_TYPE_STREAM, MEDIA_TYPE_DVB, MEDIA_TYPE_CUE_ITEM];

	/**
	 * List of all file types to display
	 * @type {string}
	 */

	// apply list dir rules
	gSTB.SetListFilesExt('.' + configuration.registersTypes.join(' .'));

	/**
	 * list of events associated with player
	 * @type {Object}
	 */
	this.subscribeEvents = {};

	/** player event hook */
	this.subscribeEvents[MediaPlayer.EVENT_START] = function () {
		var file = self.FileList.activeItem.data;
		// preview available
		if ( self.Preview.isVisible ) {
			self.Preview.player.className = file.type === MEDIA_TYPE_AUDIO ? 'player audio' : 'player play';
			if ( self.Preview.body.info && self.Preview.body.info.time === undefined && MediaPlayer.totalTime > 0 ) {
				var time = MediaPlayer.parseTime(MediaPlayer.totalTime);
				self.Preview.body.info.time = element('div', {className: 'lbl'}, [_('Duration:'), element('span', {className: 'txt'}, time.hour + ':' + time.min + ':' + time.sec)]);
				elchild(self.Preview.body.info, self.Preview.body.info.time);
			}
		}
	};

	/** player event hook */
	this.subscribeEvents[MediaPlayer.EVENT_STOP] = function () {
		var fileIndex = self.FileList.data.indexOf(MediaPlayer.list[MediaPlayer.PlayList.playIndex]);
		// preview and player window are available
		if ( self.Preview.isVisible && self.Preview.player ) {
			self.Preview.player.className = 'player stop';
			self.Preview.SetProgress(0);
		}

		if ( fileIndex !== -1 ) {
			self.FileList.data[fileIndex].index = fileIndex;
			self.FileList.Focused(fileIndex, true);
		}
		// TODO: support ISO chunks, becase MediaPlayer.list contains a list of iso parts, not files
	};

	/** player event hook */
	this.subscribeEvents[MediaPlayer.EVENT_PAUSE] = function ( state ) {
		var file = self.FileList.activeItem.data;
		// preview available
		if ( this.Preview.isVisible ) {
			if ( state ) {
				this.Preview.player.className = 'player stop';
			} else {
				this.Preview.player.className = file.type === MEDIA_TYPE_AUDIO ? 'player audio' : 'player play';
			}
		}
	};

	/** player event hook */
	this.subscribeEvents[MediaPlayer.EVENT_PROGRESS] = function ( position ) {
		// preview available
		if ( this.Preview.isVisible ) {
			this.Preview.SetProgress(position);
		}
	};

	/** player event hook */
	this.subscribeEvents[MediaPlayer.EVENT_ERROR] = function ( ) {
		// preview and player window are available
		if ( this.Preview.isVisible && this.Preview.player ) {
			this.Preview.player.className = 'player stop';
			this.Preview.SetProgress(0);
		}
	};

	/** player event hook */
	this.subscribeEvents[MediaPlayer.EVENT_OK] = function ( ) {
		echo('MediaPlayer.EVENT_OK');
		var fileIndex = self.FileList.data.indexOf(MediaPlayer.list[MediaPlayer.PlayList.playIndex]),
			file;

		if ( fileIndex !== -1 && self.FileList.activeItem.index !== fileIndex ) {
			self.FileList.data[fileIndex].index = fileIndex;
			self.FileList.Focused(fileIndex, true);
		}


		file = self.FileList.activeItem.data;
		// make sure it's playable
		if ( this.playable.indexOf(file.type) !== -1 ) {
			// make sure it's visible
			this.actionFrame(true);
			// activate only if preview window is ready
			// need for extracted DVD
			if ( this.Preview.player ) {
				self.Preview.Info(self.FileList.activeItem.data);
				this.Preview.player.className = file.type === MEDIA_TYPE_AUDIO ? 'player audio' : 'player play';
				// prevent unnecessary pooling
				if ( gSTB.IsPlaying() ) {
					MediaPlayer.runner.start();
				}
				MediaPlayer.Show(false, false);
				MediaPlayer.changeScreenMode(false);
			}
		}
	};

	/** player event hook */
	this.subscribeEvents[MediaPlayer.EVENT_EXIT] = function ( ) {
		var self = this;
		this.Preview.SetProgress(0);
		if ( this.Preview.isVisible ) {
			if ( this.FileList.timer ) {
				clearTimeout(this.FileList.timer);
			}
			// add delay
			this.FileList.timer = setTimeout(function(){
				// show info in preview block
				self.Preview.Info(self.FileList.activeItem.data);
			}, 400);
		}
	};

	/**
	 * modal window with menu
	 * @type {CModal}
	 */
	this.ModalMenu = new CModal(this);
	this.ModalMenu.onShow = function () {
		var self = this, readOnly;

		// activate filters
		this.Menu.gview.slist.Each(function ( item ) {
			// enable/disable menu items depending on the file list content
			self.Menu.gview.slist.Hidden(item, item.iid !== MEDIA_TYPE_NONE && self.parent.FileList.mtypes.indexOf(item.iid) === -1);
		});
		// hide in case there is only one item "All"
		this.Menu.Hidden(this.Menu.gview, (this.Menu.gview.slist.Length() - (self.Menu.gview.slist.states.hidden || []).length) === 1);

		var currentItem = this.parent.FileList.activeItem;
		var activeItems = this.parent.FileList.ActiveItems();
		var lastPathItemType = this.parent.FileList.path[this.parent.FileList.path.length - 1].type;

		if ( this.parent.FileList.path.length > 1 && this.parent.FileList.path[1].type === MEDIA_TYPE_STORAGE_USB ) {
			readOnly = this.parent.FileList.path[1].readOnly;
		}
		// set
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iopen,    currentItem.data.type === MEDIA_TYPE_BACK || currentItem.data.type === MEDIA_TYPE_TEXT);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.ismount,  currentItem.data.type !== MEDIA_TYPE_TEXT);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iopensl,  this.parent.FileList.states.marked === undefined || this.parent.FileList.states.marked.length === 0);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iselone,  this.parent.BPanel.btnF2.data.hidden);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iselall,  this.parent.BPanel.btnF2.data.hidden);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.imount,   !(currentItem.data.link === undefined && (currentItem.data.type === MEDIA_TYPE_SAMBA_SHARE || currentItem.data.type === MEDIA_TYPE_NFS_SHARE)));
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iunmount, !(currentItem.data.link !== undefined && (currentItem.data.type === MEDIA_TYPE_SAMBA_SHARE || currentItem.data.type === MEDIA_TYPE_NFS_SHARE)));
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iedit,    readOnly || !(currentItem.data.link !== undefined && (currentItem.data.type === MEDIA_TYPE_SAMBA_SHARE || currentItem.data.type === MEDIA_TYPE_NFS_SHARE)));
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.ideselect,this.parent.BPanel.btnF2.data.hidden || this.parent.FileList.states.marked === undefined || this.parent.FileList.states.marked.length === 0);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iinvert,  this.Menu.gedit.ideselect.hidden);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.icut,     activeItems.length  === 0 ||  this.parent.FileList.parentItem.type !== MEDIA_TYPE_FAVORITES); // future use :: this.parent.BPanel.btnF3.data.hidden || activeItems.length === 0 || this.parent.FileList.parentItem.readOnly);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.icopy,    activeItems.length  === 0 || (this.parent.FileList.parentItem.type !== MEDIA_TYPE_FAVORITES && this.parent.FileList.parentItem.type !== MEDIA_TYPE_PLAYLIST)); // future use :: this.parent.BPanel.btnF3.data.hidden || activeItems.length === 0 || (this.parent.FileList.mode === MEDIA_TYPE_FAVORITES || !(this.parent.FileList.mode === MEDIA_TYPE_STORAGE_SATA || this.parent.FileList.mode === MEDIA_TYPE_STORAGE_USB)));
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.ipaste,   readOnly || globalBuffer.size() === 0 ||  this.parent.FileList.parentItem.type !== MEDIA_TYPE_FAVORITES || (globalBuffer.place().url === this.parent.FileList.parentItem.url && globalBuffer.place().type === this.parent.FileList.parentItem.type) /*this.parent.FileList.parentItem.type !== MEDIA_TYPE_PLAYLIST*/); // future use :: globalBuffer.size() === 0 || this.parent.FileList.parentItem.readOnly);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.idelete,  readOnly || this.parent.BPanel.btnF2.data.hidden || activeItems.length === 0 || lastPathItemType === MEDIA_TYPE_PLAYLIST || this.parent.FileList.mode === MEDIA_TYPE_RECORDS_ROOT || this.parent.FileList.mode === MEDIA_TYPE_FAVORITES);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iaddfav,  this.parent.BPanel.btnF3add.data.hidden);
		this.Menu.gedit.slist.Hidden(this.Menu.gedit.iremfav,  this.parent.BPanel.btnF3del.data.hidden);

		// hide in case there are no visible items
		this.Menu.Hidden(this.Menu.gedit, (this.Menu.gedit.slist.Length() - (self.Menu.gedit.slist.states.hidden || []).length) === 0);

		// tools menu: show unmount if there are some shares
		this.Menu.gtools.slist.Disabled(this.Menu.gtools.imount, !CURRENT_NETWORK_STATE);
		this.Menu.gtools.slist.Disabled(this.Menu.gtools.iunmount, !CURRENT_NETWORK_STATE || (SMB_ARRAY.length === 0 && NFS_ARRAY.length === 0));

		// find and unmark all previous items
		(this.Menu.gsort.slist.states.marked || []).forEach(function ( item ) {
			item.self.Marked(item, false);
		});
		if ( this.parent.FileList.mode !== MEDIA_TYPE_FAVORITES ) {
			this.Menu.gsort.slist.Marked(this.Menu.gsort.slist.FindOne({iid: this.parent.FileList.sortType}), true);
		}

		this.Menu.Hidden(this.Menu.goptions, currentItem.data.type !== MEDIA_TYPE_VIDEO);

		// show in favs and in case there are items to select
		this.Menu.Hidden(this.Menu.gsort, this.parent.BPanel.btnF2.data.hidden && this.parent.FileList.mode !== MEDIA_TYPE_FAVORITES);

		// start from the first visible tab
		for ( var i = 0; i < MediaBrowser.ModalMenu.Menu.handleInner.children.length; i++ ) {
			var group = MediaBrowser.ModalMenu.Menu.handleInner.children[i];
			if ( group.options.hidden === false ) {
				this.Menu.Switch(group);
				this.Menu.Activate();
				return;
			}
		}
	};


	/**
	 * main side menu
	 * @type {CGroupMenu}
	 */
	this.ModalMenu.Menu = new CGroupMenu(this.ModalMenu);
	this.ModalMenu.Menu.Init(this.handle.querySelector('div.cgmenu-main'));

	this.ModalMenu.Init(element('div', {className: 'cmodal-menu'}, this.ModalMenu.Menu.handle));

	// mouse click on empty space should close modal menu
	this.ModalMenu.handle.onclick = function(){ self.ModalMenu.Show(false); };

	this.ModalMenu.EventHandler = function ( event ) {
		switch ( event.code ) {
			case KEYS.EXIT:
			case KEYS.MENU:
				self.ModalMenu.Show(false);
				break;
			case KEYS.TV:
				self.ModalMenu.Show(false);
				self.Show(false);
				break;
			default:
				self.ModalMenu.Menu.EventHandler(event);
		}
	};

	// group
	this.ModalMenu.Menu.gedit = this.ModalMenu.Menu.AddGroup('gedit', _('Operations'), {
		onclick: function () {
			var iid = this.iid;
			// close the menu and apply
			self.ModalMenu.Show(false);
			// selected action id
			switch ( iid ) {
				case MEDIA_ACTION_OPEN:
					self.FileList.activeItem.onclick();
					break;
				case MEDIA_ACTION_OPEN_SELECTED:
					var list = self.FileList.GetPlaylist();
					if ( list.length > 0 ) {
						MediaPlayer.prepareList(list);
						MediaPlayer.preparePlayer(list[0], self, true, true, (!self.BPanel.btnF3add.data.hidden || !self.BPanel.btnF3del.data.hidden), true);
						self.FileList.playListSet = false;
					}
					break;
				case MEDIA_ACTION_SUBTITLE_MOUNT:
					self.FileList.activeItem.onclick();
					break;
				case MEDIA_ACTION_ITEM_MOUNT:
					new CModalMount(self);
					break;
				case MEDIA_ACTION_ITEM_UNMOUNT:
					new CModalUnmount(self, self.FileList.activeItem.data.link);
					break;
				case MEDIA_ACTION_MOUNT_EDIT:
					new CModalMount(self, self.FileList.activeItem.data.link, self.FileList.activeItem.data.type);
					break;
				case MEDIA_ACTION_SELECT_ONE:
					// get each and mark
					self.FileList.Marked(self.FileList.activeItem.data, true);
					self.Preview.valSel.innerText = self.FileList.states['marked'].length;
					break;
				case MEDIA_ACTION_SELECT_ALL:
					// get each and mark
					self.FileList.data.forEach(function ( item ) {
						self.FileList.Marked(item, true);
					});
					self.Preview.valSel.innerText = self.FileList.states['marked'].length;
					break;
				case MEDIA_ACTION_DESELECT:
					// get each and unmark
					self.FileList.Each(function ( item ) {
						self.FileList.Marked(item, false);
					});
					break;
				case MEDIA_ACTION_INVERT:
					// get each and invert
					self.FileList.data.forEach(function ( item ) {
						self.FileList.Marked(item, !item.marked);
					});
					break;
				case MEDIA_ACTION_CUT:
				case MEDIA_ACTION_COPY:
				case MEDIA_ACTION_DELETE:
					// find all appropriate items
					var items = self.FileList.ActiveItems();
					// apply the action
					switch ( iid ) {
						case MEDIA_ACTION_CUT:
							echo('MEDIA_ACTION_CUT');
							// reset
							globalBuffer.clear();
							globalBuffer.mode(globalBuffer.MODE_CUT);
							globalBuffer.place(self.FileList.parentItem);
							// only for favs
							if ( self.FileList.mode === MEDIA_TYPE_FAVORITES ) {
								// hook after paste somewhere
								globalBuffer.onPaste = function(item){
									self.FavRemove(item.url);
								};
							}
							// iterate all selected
							items.forEach(function ( item ) {
								// fill buffer
								globalBuffer.add(item);
							});
							// show tray
							self.Tray.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_cut.png';
							self.Tray.handleInner.appendChild(self.Tray.iconBuffer);
							self.Tray.Show(true, false);
							break;
						case MEDIA_ACTION_COPY:
							echo('MEDIA_ACTION_COPY');
							// reset
							globalBuffer.clear();
							globalBuffer.mode(globalBuffer.MODE_COPY);
							globalBuffer.place(self.FileList.parentItem);
							// iterate all selected
							items.forEach(function ( item ) {
								// fill buffer
								globalBuffer.add(item);
							});
							// show tray
							self.Tray.iconBuffer.src = PATH_IMG_PUBLIC + 'ico_copy.png';
							self.Tray.handleInner.appendChild(self.Tray.iconBuffer);
							self.Tray.Show(true, false);
							break;
						case MEDIA_ACTION_DELETE:
							echo('MEDIA_ACTION_DELETE');
							self.actionDelete();
							break;
					}
					break;
				case MEDIA_ACTION_PASTE:
					// only for favs
					if ( self.FileList.mode === MEDIA_TYPE_FAVORITES ) {
						globalBuffer.paste(function(item){
							self.FavAdd(item.url, item);
						});
						self.FileList.Refresh();
						// update info hints
						self.Preview.SetItemsCount();

						// remove copy icon from tray
						if ( self.Tray.iconBuffer.parentNode === self.Tray.handleInner ) {
							self.Tray.handleInner.removeChild(self.Tray.iconBuffer);
						}
						// hide if not necessary anymore
						self.Tray.Show(self.Tray.handleInner.children.length !== 0, false);
					}
					break;
				case MEDIA_ACTION_ADD_FAV:
					self.actionF3add();
					break;
				case MEDIA_ACTION_REMOVE_FAV:
					self.actionF3del();
					break;
			}
			// prevent default
			return false;
		}
	});
	// group items
	this.ModalMenu.Menu.gedit.iopen     = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_OPEN,          _('Open'), {icon: remoteControlButtonsImagesPath + 'ok.png'});
	this.ModalMenu.Menu.gedit.iopensl   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_OPEN_SELECTED, _('Open selected'));
	this.ModalMenu.Menu.gedit.ismount   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_SUBTITLE_MOUNT,_('Mount'));
	this.ModalMenu.Menu.gedit.imount    = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_ITEM_MOUNT,    _('Mount share'));
	this.ModalMenu.Menu.gedit.iunmount  = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_ITEM_UNMOUNT,  _('Unmount share'));
	this.ModalMenu.Menu.gedit.iedit     = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_MOUNT_EDIT,    _('Edit share'));
	this.ModalMenu.Menu.gedit.iselone   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_SELECT_ONE,    _('Select'), {icon: remoteControlButtonsImagesPath + 'f2.png'});
	this.ModalMenu.Menu.gedit.iselall   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_SELECT_ALL,    _('Select all'));
	if (WINDOW_WIDTH !== 720) {
		this.ModalMenu.Menu.gedit.iaddfav   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_ADD_FAV,       _('Add to favorites'), {icon: remoteControlButtonsImagesPath + 'f3.png'});
		this.ModalMenu.Menu.gedit.iremfav   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_REMOVE_FAV,    _('Remove from favorites'), {icon: remoteControlButtonsImagesPath + 'f3.png'});
	}
	this.ModalMenu.Menu.gedit.ideselect = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_DESELECT,      _('Deselect all'));
	this.ModalMenu.Menu.gedit.iinvert   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_INVERT,        _('Invert selection'));
	this.ModalMenu.Menu.gedit.icut      = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_CUT,           _('Cut'));
	this.ModalMenu.Menu.gedit.icopy     = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_COPY,          _('Copy'));
	this.ModalMenu.Menu.gedit.ipaste    = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_PASTE,         _('Paste'));
	this.ModalMenu.Menu.gedit.idelete   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gedit, MEDIA_ACTION_DELETE,        _('Delete'), {icon: remoteControlButtonsImagesPath + 'back.png'});




	// group
	this.ModalMenu.Menu.gview = this.ModalMenu.Menu.AddGroup('gview', _('View'), {
		onclick: function () {
			// find and unmark the previous item
			this.self.Marked(this.self.FindOne({marked: true}), false);
			// mark and focus the current one
			this.self.Marked(this, true);
			this.self.Focused(this, true);
			// close the menu and apply filter
			self.ModalMenu.Show(false);
			// apply type filtering
			self.FileList.SetFilterType(this.iid);
			//self.FileList.Activate(true);
			// show tray if some filters
			if ( this.iid !== MEDIA_TYPE_NONE || globalBuffer.size() > 0 ) {
				elclear(self.Tray.handleInner);
				if ( this.iid !== MEDIA_TYPE_NONE ) {
					self.Tray.iconFilter.src = PATH_IMG_PUBLIC + 'media/type_' + this.iid + '.png';
					self.Tray.handleInner.appendChild(self.Tray.iconFilter);
				}
				if ( globalBuffer.size() > 0 ) {
					self.Tray.iconBuffer.src = PATH_IMG_PUBLIC + (globalBuffer.mode() === globalBuffer.MODE_COPY ? 'ico_copy.png' : 'ico_cut.png');
					self.Tray.handleInner.appendChild(self.Tray.iconBuffer);
				}
				self.Tray.Show(true, false);
			} else {
				self.Tray.Show(false, false);
			}
			// prevent default
			return false;
		}
	});
	// group items
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_NONE,     _('All'), {marked: true, focused: true});
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_FOLDER,   _('Folders'));
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_AUDIO,    _('Audio'));
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_VIDEO,    _('Video'));
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_IMAGE,    _('Images'));
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_PLAYLIST, _('Playlists'));
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_ISO,      _('ISO'));
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_TEXT,     _('Subtitles'));
	this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gview, MEDIA_TYPE_STREAM,   _('Streams'));

	// group
	this.ModalMenu.Menu.gsort = this.ModalMenu.Menu.AddGroup('gsort', _('Sort'), {
		onclick: function () {
			// close the menu and apply filter
			self.ModalMenu.Show(false);
			// different modes
			if ( self.FileList.mode === MEDIA_TYPE_FAVORITES ) {
				self.FavSort(this.iid);
			} else {
				// sort method differs from current
				if ( self.FileList.sortType !== this.iid ) {
					self.FileList.sortType = this.iid;
				}
			}
			self.FileList.Refresh();
			// prevent default
			return false;
		}
	});
	// group items
	this.ModalMenu.Menu.gsort.iname = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsort, MEDIA_ACTION_SORT_NAME, _('By name'), {focused: true});
	this.ModalMenu.Menu.gsort.isize = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsort, MEDIA_ACTION_SORT_SIZE, _('By size'));
	this.ModalMenu.Menu.gsort.itype = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsort, MEDIA_ACTION_SORT_TYPE, _('By type'));
	this.ModalMenu.Menu.gsort.iext  = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsort, MEDIA_ACTION_SORT_EXT,  _('By extension'));

	// group
	this.ModalMenu.Menu.gtools = this.ModalMenu.Menu.AddGroup('gtools', _('Tools'), {
		onclick: function () {
			// close the menu and apply filter
			self.ModalMenu.Show(false);
			// selected action id
			switch ( this.iid ) {
				case MEDIA_ACTION_TOOLS_MOUNT:
					new CModalMount(self);
					break;
				case MEDIA_ACTION_TOOLS_UNMOUNT:
					new CModalUnmount(self, self.FileList.activeItem.data.link);
					break;
				case MEDIA_ACTION_TOOLS_FORMAT:
					new CModalFormat(self);
					break;
			}
			// prevent default
			return false;
		}
	});
	// group items
	this.ModalMenu.Menu.gtools.imount   = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gtools, MEDIA_ACTION_TOOLS_MOUNT,   _('Connect NFS/SMB'));
	this.ModalMenu.Menu.gtools.iunmount = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gtools, MEDIA_ACTION_TOOLS_UNMOUNT, _('Disconnect NFS/SMB'), {disabled: true});
	// formatting is only for internal sata disks
	this.ModalMenu.Menu.gtools.iformat  = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gtools, MEDIA_ACTION_TOOLS_FORMAT,  _('Disk formatting'), {hidden: HDD_INFO.length === 0});

	// options
	this.ModalMenu.Menu.goptions = this.ModalMenu.Menu.AddGroup('goptions', _('Options'), {
		onclick: function () {
			// close the menu and apply filter
			self.ModalMenu.Show(false);
			// selected action id
			switch ( this.iid ) {
				case MEDIA_ACTION_PLAY:
					new CModalStartPlay(self);
					break;
			}
			// prevent default
			return false;
		}
	});
	this.ModalMenu.Menu.goptions.playProgramm = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.goptions, MEDIA_ACTION_PLAY,       _('Play program'));

	// default group
	this.ModalMenu.Menu.Switch(this.ModalMenu.Menu.gedit);

	/**
	 * @type {CBreadCrumb}
	 */
	this.BCrumb = new CBreadCrumb(this);
	this.BCrumb.showAttr = 'table-cell';
	this.BCrumb.rightItems = WINDOW_WIDTH === 720 ? 1 : 2;
	this.BCrumb.Init(PATH_IMG_PUBLIC, this.handle.querySelector('.body .header .cbcrumb'));
	this.BCrumb.SetName(_('Home Media'));

	/**
	 * top panel
	 * @type {CSearchBar}
	 */
	this.SearchBar = new CFilterInput(this, {
		parent: this.handle.querySelector('.body .header .csbar'),
		hint: _('Enter path or file name...'),
		folded: true,
		events:{
			onEnter: function(){
				echo(this.GetValue(), 'this.GetValue()')
				// clear last filter
				if ( self.FileList.path[self.FileList.path.length-1].filterText ) {
					self.FileList.path.pop();
					self.BCrumb.Pop();
				}
				// type
				if ( this.GetValue() ) {
					// go deeper
					//var clone = {},
					//	last  = self.FileList.path[self.FileList.path.length-1];
					//// prepare
					//for ( var attr in last ) {
					//	clone[attr] = last[attr];
					//}
					//clone.filterText = this.GetValue();
					self.FileList.SetFilterText(this.GetValue());
					//// current node but filtered
					//self.FileList.Open(clone);
				} else {
					// clear and refresh
					self.FileList.path[self.FileList.path.length-1].filterText = self.FileList.filterText = self.FileList.parentItem.filterText = '';
					self.FileList.Refresh();
				}
				self.BCrumb.Show(true);
				// refresh preview
				self.FileList.onFocus(self.FileList.activeItem);
				return true;
			},
			onChange: function(){
				if ( self.SearchBar.timer ) {
					clearTimeout(self.SearchBar.timer);
				}
				// add delay
				self.SearchBar.timer = setTimeout(function(){
					// show info in preview block
					var index = self.FileList.FirstMatch(self.SearchBar.GetValue());

					if ( typeof index !== 'undefined' && index !== -1 ) {
						self.FileList.Focused(index, true);
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
				this.SetValue(self.FileList.path[self.FileList.path.length-1].filterText || '');
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
	this.ExitBPanel.btnExit  = this.ExitBPanel.Add(KEYS.EXIT,  'exit.png', configuration.newRemoteControl ? _('Exit') : '',   function () { MediaBrowser.actionBack(); });
	/**
	 * bottom line of buttons
	 * @type {CButtonPanel}
	 */
	this.BPanel = new CButtonPanel(this);
	this.BPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .main div.cbpanel-main'));
	this.BPanel.btnMenu  = this.BPanel.Add(KEYS.MENU,  'menu.png',  configuration.newRemoteControl ? _('Menu') : '',   function () { self.actionMenu(); });
	this.BPanel.btnFrame = this.BPanel.Add(KEYS.INFO,  'info.png', _('Show<br>info panel'),  function () { self.actionFrame(); });
	this.BPanel.btnF2    = this.BPanel.Add(KEYS.F2,    'f2.png',    _('Select'),     function () { self.actionF2(); });
	this.BPanel.btnF3add = this.BPanel.Add(KEYS.F3,    'f3.png',    _('Add to<br>favorites'), function () { self.actionF3add(); });
	this.BPanel.btnF3del = this.BPanel.Add(KEYS.F3,    'f3.png',    _('Remove from<br>favorites'), function () { self.actionF3del(); }, true);


	/**
	 * main list of dirs/files
	 * @type {CFileList}
	 */
	this.FileList = new CFileList(this);
	this.FileList.Init({
		handle: this.handle.querySelector('.body .content .vlist-main'),
		scrollBar: new VScrollBar({
			$node: this.handle.querySelector('.body .content .vscroll')
		})
	});
	this.FileList.SetBreadCrumb(this.BCrumb);
	this.FileList.SetSearchBar(this.SearchBar);

	/**
	 * file preview side panel
	 */
	this.Preview.Init(this.handle.querySelector('.content .sbar'));
	this.Preview.Show(false, false);
	this.Preview.body   = this.Preview.handle.querySelector('td.view');
	this.Preview.blkAll = this.Preview.handle.querySelector('div.block.all');
	this.Preview.blkSel = this.Preview.handle.querySelector('div.block.sel');
	this.Preview.valAll = this.Preview.blkAll.querySelector('span.value');
	this.Preview.valSel = this.Preview.blkSel.querySelector('span.value');
	this.Preview.blkAll.querySelector('span.title').innerHTML = _('Items:');
	this.Preview.blkSel.querySelector('span.title').innerHTML = _('Selected:');
	this.Preview.showAttr = 'table-cell';
	this.Preview.infoIcon = element('img', {align: 'left', src: PATH_IMG_PUBLIC + 'media/ico_info.png'});
	// list of info action mapped to the media types
	this.Preview.actionInfo = {};
	this.Preview.actionInfo[MEDIA_TYPE_BACK]         = this.Preview.InfoBack;
	this.Preview.actionInfo[MEDIA_TYPE_SAMBA_ROOT]   = this.Preview.InfoSambaRoot;
	this.Preview.actionInfo[MEDIA_TYPE_SAMBA_GROUP]  = this.Preview.InfoSambaGroup;
	this.Preview.actionInfo[MEDIA_TYPE_SAMBA_HOST]   = this.Preview.InfoSambaHost;
	this.Preview.actionInfo[MEDIA_TYPE_SAMBA_SHARE]  = this.Preview.InfoSambaShare;
	this.Preview.actionInfo[MEDIA_TYPE_NFS_SHARE]    = this.Preview.InfoNfsShare;
	this.Preview.actionInfo[MEDIA_TYPE_UPNP]         = this.Preview.InfoUpnp;
	this.Preview.actionInfo[MEDIA_TYPE_RECORDS_ROOT] = this.Preview.InfoRecordsRoot;
	this.Preview.actionInfo[MEDIA_TYPE_RECORDS_CHAN] = this.Preview.InfoRecordsChan;
	this.Preview.actionInfo[MEDIA_TYPE_RECORDS_DATE] = this.Preview.InfoRecordsDate;
	this.Preview.actionInfo[MEDIA_TYPE_STORAGE_SATA] = this.Preview.InfoStorage;
	this.Preview.actionInfo[MEDIA_TYPE_STORAGE_USB]  = this.Preview.InfoStorage;
	this.Preview.actionInfo[MEDIA_TYPE_STORAGE_SD]   = this.Preview.InfoStorage;
	this.Preview.actionInfo[MEDIA_TYPE_STORAGE_MMC]  = this.Preview.InfoStorage;
	this.Preview.actionInfo[MEDIA_TYPE_FAVORITES]    = this.Preview.InfoFavorites;
	this.Preview.actionInfo[MEDIA_TYPE_FOLDER]       = this.Preview.InfoFolder;
	this.Preview.actionInfo[MEDIA_TYPE_VIDEO]        = this.Preview.InfoFile;
	this.Preview.actionInfo[MEDIA_TYPE_AUDIO]        = this.Preview.InfoFile;
	this.Preview.actionInfo[MEDIA_TYPE_IMAGE]        = this.Preview.InfoFile;
	this.Preview.actionInfo[MEDIA_TYPE_ISO]          = this.Preview.InfoFile;
	this.Preview.actionInfo[MEDIA_TYPE_RECORDS_ITEM] = this.Preview.InfoFile;
	this.Preview.actionInfo[MEDIA_TYPE_PLAYLIST]     = this.Preview.InfoPlaylist;
	this.Preview.actionInfo[MEDIA_TYPE_STREAM]       = this.Preview.InfoStream;
	this.Preview.actionInfo[MEDIA_TYPE_TEXT]         = this.Preview.InfoText;
	this.Preview.actionInfo[MEDIA_TYPE_CUE]          = this.Preview.InfoCue;
	this.Preview.actionInfo[MEDIA_TYPE_CUE_ITEM]     = this.Preview.InfoFile;

	this.Preview.onShow = function () {
		// there is an active item
		if ( self.FileList.activeItem ) {
			this.Info(self.FileList.activeItem.data);
		}
	};


	this.Preview.SetProgress = function ( value ) {
		if ( this.isVisible && this.pgval ) {
			// boundary check
			if ( value >= 100 ) { value = 100; }
			if ( value < 0 ) { value = 0; }
			// apply
			this.pgval.style.width = value + '%';
		}
	};

	this.Preview.SetItemsCount = function ( ) {
		this.valAll.innerHTML = this.parent.FileList.path.length > 1 ? this.parent.FileList.Length()-1 : this.parent.FileList.Length();
	};

	this.Preview.Rewind = function () {
		// preview and player window are available and in the process
		if ( this.isVisible && this.player && gSTB.IsPlaying() ) {
			MediaPlayer.setPos(-1);
		}
	};
	this.Preview.Forward = function () {
		// preview and player window are available and in the process
		if ( this.isVisible && this.player && gSTB.IsPlaying() ) {
			MediaPlayer.setPos(1);
		}
	};

	this.Preview.PlayPause = function () {
		echo('Preview.PlayPause')
		// show side preview panel
		this.parent.actionFrame(true);
		// playing or not
		if ( MediaPlayer.playNow || MediaPlayer.obj !== null ) {
			echo('MediaPlayer.playPause()')
			MediaPlayer.playPause();
		} else {
			// init player with list of files in the current level
			echo(this.parent.FileList.playListSet, 'this.parent.FileList.playListSet ');
			if ( !this.parent.FileList.playListSet ) {
				MediaPlayer.prepareList(this.parent.FileList.playList);
				MediaPlayer.setSubList(this.parent.FileList.subList);
				this.parent.FileList.playListSet = true;
			}

			// check current selected item that it can be played
			var file = this.parent.FileList.activeItem.data;
			if ( this.parent.playable.indexOf(file.type) !== -1 ) {
				this.player.className = 'player load';
				// start playing
				MediaPlayer.preparePlayer(file, this.parent, false, false, (!this.parent.BPanel.btnF3add.data.hidden || !this.parent.BPanel.btnF3del.data.hidden), false);
				// only images or audio
				if ( file.type === MEDIA_TYPE_IMAGE ) {
					this.player.className = 'player play';
				}
			}
		}
	};

	/**
	 * small player window size for preview
	 * @return {{x:Number,y:Number,a:Number,b:Number}}
	 */
	this.Preview.GetRect = function () {
		switch ( VIDEO_MODE ) {
			case '480i':
			case '480p':
				switch ( window.screen.width ) {
					case 720  : return {x: 458, y: 94, a: 228, b: 151};
					case 1280 : return {x: 476, y: 100, a: 220, b: 180};
					case 1920 : return {x: 480, y: 100, a: 220, b: 180};
				}
				break;
			case '576i':
			case '576p':
				switch ( window.screen.width ) {
					case 720  : return {x: 463, y: 110, a: 228, b: 151};
					case 1280 : return {x: 476, y: 100, a: 220, b: 180};
					case 1920 : return {x: 480, y: 100, a: 220, b: 180};
				}
				break;
			case '720p':
			case '720p60':
				switch ( window.screen.width ) {
					case 720  : return {x: 822, y: 134, a: 407, b: 190};
					case 1280 : return {x: 846, y: 130, a: 394, b: 220};
					case 1920 : return {x: 850, y: 133, a: 400, b: 220};
				}
				break;
			case '1080i':
			case '1080i60':
			case '1080p':
			case '1080p60':
				switch ( window.screen.width ) {
					case 720  : return {x: 1232, y: 201, a: 613, b: 288};
					case 1280 : return {x: 1266, y: 194, a: 590, b: 328};
					case 1920 : return {x: 1278, y: 196, a: 592, b: 327};
				}
				break;
			case '3840x2160p30':
			case '3840x2160p25':
			case '3840x2160p50':
			case '3840x2160p60':
				switch ( window.screen.width ) {
					case 720  : return {x: 2464, y: 402, a: 1216, b: 576};
					case 1280 : return {x: 2532, y: 388, a: 1180, b: 656};
					case 1920 : return {x: 2556, y: 392, a: 1184, b: 654};
				}
				break;
		}
		// just in case
		return {x:0, y:0, a:0, b:0};
	};
	this.Preview.playerRect = this.Preview.GetRect();

	/**
	 * header tray with filter type and buffer flag icons
	 * @type {CBase}
	 */
	this.Tray = new CBase(this);
	this.Tray.Init(this.handle.querySelector('.header .tray'));
	this.Tray.Show(false, false);
	this.Tray.showAttr = 'table-cell';
	this.Tray.iconFilter = element('img');
	this.Tray.iconBuffer = element('img', {className: 'copy'});
};


/**
 * Hook on page show
 */
MediaBrowser.onShow = function () {
	// set focus
	this.FileList.Activate();

	// init player preview window
	MediaPlayer.setCoord(this.Preview.playerRect.x, this.Preview.playerRect.y, this.Preview.playerRect.a, this.Preview.playerRect.b);

	if ( !MediaPlayer.playNow && !MediaPlayer.startingPlay ) {
		// player hooks
		MediaPlayer.Subscribe(this, MediaPlayer.EVENT_START);
		MediaPlayer.Subscribe(this, MediaPlayer.EVENT_STOP);
		MediaPlayer.Subscribe(this, MediaPlayer.EVENT_PAUSE);
		MediaPlayer.Subscribe(this, MediaPlayer.EVENT_PROGRESS);
		MediaPlayer.Subscribe(this, MediaPlayer.EVENT_ERROR);
		MediaPlayer.Subscribe(this, MediaPlayer.EVENT_OK);
		MediaPlayer.Subscribe(this, MediaPlayer.EVENT_EXIT);

		// update collected previous data
		getStorageInfo();
	}
};


/**
 * Events handler entry point
 * @param {Event} event global event object
 */
MediaBrowser.EventHandler = function ( event ) {
	if ( this.SearchBar.EventHandler(event) !== true ) {
		// default
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
				// file list navigation
				this.FileList.EventHandler(event);
				break;
			case 32:
				// space selects the current one
				this.actionF2();
				event.preventDefault();
				break;
			case KEYS.EXIT:
				this.actionBack();
				break;
			case KEYS.BACK:
				this.actionDelete();
				break;
			case KEYS.MENU:
			case KEYS.INFO:
			case KEYS.F2:
			case KEYS.F3:
				// global keys
				this.BPanel.EventHandler(event);
				break;
			case KEYS.PLAY_PAUSE:
				this.Preview.PlayPause();
				break;
			case KEYS.REWIND:
				this.Preview.Rewind();
				break;
			case KEYS.FORWARD:
				this.Preview.Forward();
				break;
			case KEYS.STOP:
				MediaPlayer.end();
				break;
			case 49:  // key 1
			case 50:  // key 2
			case 51:  // key 3
			case 52:  // key 4
				this.ModalMenu.Show(true);
				var tabs = {49:'gedit', 50:'gview', 51:'gsort', 52:'gtools'};
				this.ModalMenu.Menu.Switch(this.ModalMenu.Menu[tabs[event.code]]);
				break;
			default:
			// block all the rest
			//event.preventDefault();
		}
	}
};


/**
 * Reset the whole page to the default state
 * @param {boolean} [unmount=true] unmount or not the network shares
 * @param {boolean} [unbind=true] unsubscribe or not from player events
 */
MediaBrowser.Reset = function ( unmount, unbind ) {
	// network shares
	if ( unmount !== false ) {
		this.UnmountSMB();
		this.UnmountNFS();
	}
	// list of files
	this.FileList.path = [];
	this.BCrumb.Reset();
	this.FileList.Open({type: MEDIA_TYPE_MB_ROOT});
	// hide preview
	this.actionFrame(false);
	// reset preview
	elclear(this.Preview.body);
	// clear hooks
	if ( unbind !== false ) {
		MediaPlayer.Unsubscribe(this, MediaPlayer.EVENT_START);
		MediaPlayer.Unsubscribe(this, MediaPlayer.EVENT_STOP);
		MediaPlayer.Unsubscribe(this, MediaPlayer.EVENT_PAUSE);
		MediaPlayer.Unsubscribe(this, MediaPlayer.EVENT_PROGRESS);
		MediaPlayer.Unsubscribe(this, MediaPlayer.EVENT_ERROR);
		MediaPlayer.Unsubscribe(this, MediaPlayer.EVENT_OK);
		MediaPlayer.Unsubscribe(this, MediaPlayer.EVENT_EXIT);
	}
	// stop play
	MediaPlayer.end();
};


/**
 * Global key
 * @return {boolean} false if can't exit immediately
 */
MediaBrowser.actionExit = function () {
	var self = this;

	this.Reset();

	// there are some changes
	if ( FAVORITES_CHANGED ) {
		// ask to save changes of reset
		new CModalConfirm(this,
			_('The list of favourite records has changed'),
			_('Save updated list of favourite records?'),
			_('Exit without saving'),
			function () {
				setTimeout(function () {
					self.FavRestore();
					self.actionExit();
				}, 5);
			},
			_('Save'),
			function () {
				setTimeout(function () {
					self.FavSave();
					self.actionExit();
				}, 5);
			}
		);
		return false;
	}

	// hide this and show previous
	this.Show(false);

	return true;
};


/**
 * Global key
 */
MediaBrowser.actionBack = function () {
	MediaPlayer.end();
	// if top level
	if ( MediaBrowser.FileList.parentItem.type === MEDIA_TYPE_MB_ROOT && !MediaBrowser.FileList.parentItem.filterText ) {
		this.actionExit();
	} else {
		this.FileList.Open({type: MEDIA_TYPE_BACK});
	}
};


/**
 * Global key
 */
MediaBrowser.actionMenu = function () {
	this.ModalMenu.Show(true);
};


/**
 * mark/unmark the current item
 * @param {boolean} [move=true] move to the next after marking
 * Global key
 */
MediaBrowser.actionF2 = function ( move ) {
	// check if action is permitted
	if ( !this.BPanel.btnF2.data.hidden ) {
		// action place
		var infav  = this.FileList.mode === MEDIA_TYPE_FAVORITES,
			canAdd = false;
		// get affected item
		//var item = this.FileList.Current();
		var item = this.FileList.activeItem;

		if ( item.data.markable && this.FileList.Marked(item.data, !item.data.marked) ) {
			// optional move to the next after marking
			if ( move !== false ) {
				//this.FileList.SetPosition(this.FileList.Next(), true, true);
				this.FileList.move(KEYS.DOWN);
			}
			this.Preview.valSel.innerText = this.FileList.states['marked'].length;
			// not in FAVORITES and item became marked
			if ( !infav && item.data.marked ) {
				// are there any items to add in selection
				this.FileList.states.marked.forEach(function(item){
					if ( item.type !== MEDIA_TYPE_FOLDER ) { canAdd = true; }
				});
				// do we have fav functions here?
				if ( this.FileList.canFav && canAdd ) {
					this.BPanel.Hidden(this.BPanel.btnF3add, false);
					this.BPanel.Hidden(this.BPanel.btnF3del, true);
				}
			}
		}
	}
};


/**
 * Add to the global list selected files (selected dirs are ignored)
 */
MediaBrowser.actionF3add = function () {
	var self = this;
	// check if action is permitted
	if ( !this.BPanel.btnF3add.data.hidden ) {
		// collect affected items
		var items = this.FileList.ActiveItems();
		if ( items.length > 0 ) {
			var count = 0;
			// apply
			items.forEach(function ( item ) {
				// only files
				if ( item.type !== MEDIA_TYPE_FOLDER ) {
					self.FileList.SetStar(item, true);
					self.FavAdd(item.url, item);
					count++;
				}
			});
			// switch buttons
			if ( count > 0 ) {
				this.BPanel.Hidden(this.BPanel.btnF3add, true);
				this.BPanel.Hidden(this.BPanel.btnF3del, false);
			}
		}
	}
};


/**
 * Remove from the global list
 */
MediaBrowser.actionF3del = function () {
	var self   = this,
		curPos = null;
	// check if action is permitted
	if ( !this.BPanel.btnF3del.data.hidden ) {
		// action place
		var infav = this.FileList.parentItem.type === MEDIA_TYPE_FAVORITES;
		// collect affected items
		var items = this.FileList.ActiveItems();
		// there are some
		if ( items.length > 0 ) {
			// apply
			items.forEach(function ( item ) {
				self.FavRemove(item.url);
				// regular file list
				if ( !infav ) {
					self.FileList.SetStar(item, false);
				}
			});
			// not in FAVORITES
			if ( !infav ) {
				// switch buttons
				this.BPanel.Hidden(this.BPanel.btnF3add, false);
				this.BPanel.Hidden(this.BPanel.btnF3del, true);
			} else {
				this.FileList.DeleteAll(items);
				// file list has no items
				if ( this.FileList.Length() === 0 ) {
					// hide buttons
					this.BPanel.Hidden(this.BPanel.btnF2, true);
					this.BPanel.Hidden(this.BPanel.btnF3del, true);
				} else {
					// the nearest available item
					if ( curPos !== null ) { self.FileList.Focused(curPos, true); }
				}
				this.FileList.Activate();
			}
		}
	}
};


/**
 * Global key
 */
MediaBrowser.actionFrame = function ( state ) {
	state = state !== undefined ? state : !this.Preview.isVisible;
	// invert visibility
	this.Preview.Show(state, false);

	this.BPanel.Rename(this.BPanel.btnFrame, this.Preview.isVisible ? _('Hide<br>info panel') : _('Show<br>info panel'));
	// apply helper css class (for long text trimming)
	this.Preview.handle.parentNode.className = state ? 'preview' : '';
	// stop playing on hide
	if ( !this.Preview.isVisible ) {
		MediaPlayer.end();
	}
};



/**
 * Global key
 */
MediaBrowser.refreshPreviewViewport = function () {
	this.Preview.playerRect = MediaBrowser.Preview.GetRect();
	if ( MediaBrowser.isVisible ) {
		MediaPlayer.setCoord(this.Preview.playerRect.x, this.Preview.playerRect.y, this.Preview.playerRect.a, this.Preview.playerRect.b);
	}
};


/**
 * File/directory/fav removal
 */
MediaBrowser.actionDelete = function () {

	var self = this;
	// find all appropriate items
	var items = this.FileList.ActiveItems();
	// exit if no valid items
	if ( items.length === 0 ) {
		return;
	}

	var status = true;  // no errors while deleting
	// media type
	if ( this.FileList.mode === MEDIA_TYPE_FAVORITES ) {
		this.actionF3del();
	} else if ( [MEDIA_TYPE_STORAGE_SATA, MEDIA_TYPE_STORAGE_USB, MEDIA_TYPE_STORAGE_SD, MEDIA_TYPE_STORAGE_MMC].indexOf(this.FileList.mode) !== -1 ) {
		if ( environment.mount_media_ro === 'true' ) {
			new CModalAlert(this, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
		} else {
			// ask user
			new CModalConfirm(this,
				_('Confirm deletion'),
					_('Are you sure you want to delete') + '<br>' + (items.length > 1 ? _('all entries selected?') : _('current entry?')),
				_('Cancel'),
				function () {},
				_('Yes'),
				function () {
					setTimeout(function () {
						var itemList = [];
						// iterate all selected
						items.forEach(function (item) {
							// actual removal
							if (self.actionFileDelete(item)) {
								// clear deleted item from buffers
								globalBuffer.remove(item);
								// clear deleted item from favorites
								if (item.stared) {
									self.FavRemove(item.url);
								}
								// clear file list
								itemList.push(item);
							} else {
								status = false;
							}
						});

						// batch remove
						self.FileList.DeleteAll(itemList);
						// update free size
						getStorageInfo();
						// empty buffers so hide from tray
						if (globalBuffer.size() === 0) {
							// safe to remove
							if (self.Tray.iconBuffer.parentNode === self.Tray.handleInner) {
								self.Tray.handleInner.removeChild(self.Tray.iconBuffer);
							}
							self.Tray.Show(self.Tray.handleInner.children.length !== 0, false);
						}
						self.FileList.Activate(true);
						echo(status, 'status');
						// report on failure
						if (!status) {
							// show warning
							new CModalAlert(self, _('Deletion error'), _('Unable to remove all selected items'), _('Close'),
								function () {
									setTimeout(function () {
										self.FileList.Activate(true);
									}, 5);
								}
							);
						}

						// rework playlist and send to player
						self.FileList.playList = [];
						self.FileList.Each(function ( item ) {
							if ( self.playable.indexOf(item.type) !== -1 ) {
								self.FileList.playList.push(item);
							}
						});
						MediaPlayer.prepareList(self.FileList.playList);
						self.FileList.playListSet = true;
					}, 5);
				}
			);
		}
	}
};


/**
 * File/directory removal
 */
MediaBrowser.actionFileDelete = function ( data ) {
	var status, command;
	// actual file/dir removal
	if ( data.type === MEDIA_TYPE_FOLDER ) {
		// remove trailing slash if exists
		command = 'RemoveDirFull "' + (data.url.charAt(data.url.length - 1) === '/' ? data.url.substr(0, data.url.length - 1) : data.url) + '"';
	} else {
		command = 'RemoveFile "' + data.url + '"';
	}
	echo(command, 'actionFileDelete command');
	status = gSTB.RDir(command) === 'Ok';
	return status;
};


/**
 * Delete the given fav item from the global list
 * @param {string} name fav item key
 * @param {Object} data fav item value
 */
MediaBrowser.FavAdd = function ( name, data ) {
	// check input (skip folders and groups)
	if ( name && data && data.type !== MEDIA_TYPE_FOLDER && data.type !== MEDIA_TYPE_GROUP ) {
		if ( this.FileList.mode === MEDIA_TYPE_RECORDS_ROOT ) {
			var path = this.FileList.path;
			data.name = path[path.length - 2].name + ' / ' + path[path.length - 1].name + ' / ' + data.name;
		}
		echo('MediaBrowser.FavAdd');
		FAVORITES_NEW[name] = data;
		FAVORITES_CHANGED = true;
	}
};


/**
 * Delete the given fav item from the global list
 * @param {string} name fav item key
 * @return {boolean} operation status
 */
MediaBrowser.FavRemove = function ( name ) {
	if ( FAVORITES_NEW[name] ) {
		delete FAVORITES_NEW[name];
		FAVORITES_CHANGED = true;
	} else {
		FAVORITES_CHANGED = false;
	}
	echo(FAVORITES_CHANGED, 'MediaBrowser.FavRemove');
	return FAVORITES_CHANGED;
};


/**
 * Dump favorites to file, sync fav lists (current and new), reset modification flag
 * @param {Object} [data] new list of fav items
 */
MediaBrowser.FavSave = function ( data ) {
	echo('MediaBrowser.FavSave');
	// favs given
	if ( data !== undefined && data instanceof Object ) {
		FAVORITES_NEW = data;
	}
	// prepare
	FAVORITES = {};
	// resave new
	for ( var name in FAVORITES_NEW ) {
		FAVORITES[name] = FAVORITES_NEW[name];
	}
	// save and exit
	gSTB.SaveUserData('favorites.json', JSON.stringify(FAVORITES));
	// clear flags
	FAVORITES_CHANGED = false;
};


/**
 * Cancel saving, revert new list to current, reset modification flag
 */
MediaBrowser.FavRestore = function () {
	echo('MediaBrowser.FavRestore');
	FAVORITES_NEW = {};
	// restore old items
	for ( var name in FAVORITES ) {
		FAVORITES_NEW[name] = FAVORITES[name];
	}
	// clear flags
	FAVORITES_CHANGED = false;
};


/**
 * Favorite items sorting
 * @param {number} sortType id of sorting method
 */
MediaBrowser.FavSort = function ( sortType ) {
	echo('MediaBrowser.FavSort');
	var list = [];
	// convert hash to array for sorting
	for ( var name in FAVORITES_NEW ) {
		list.push(FAVORITES_NEW[name]);
	}
	// case insensitive sort by name
	list.sort(function ( a, b ) {
		return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
	});
	// additional sorting
	if ( sortType === MEDIA_ACTION_SORT_TYPE ) {
		list.sort(function ( a, b ) {
			return a.type - b.type;
		});
	} else if ( sortType === MEDIA_ACTION_SORT_EXT ) {
		list.sort(function ( a, b ) {
			return a.ext.toLowerCase().localeCompare(b.ext.toLowerCase());
		});
	} else if ( sortType === MEDIA_ACTION_SORT_SIZE ) {
		list.sort(function ( a, b ) {
			return a.size - b.size;
		});
	}
	echo(list, 'FavSort list');
	FAVORITES_NEW = {};
	list.forEach(function ( item ) {
		FAVORITES_NEW[item.url] = item;
	});
	echo(FAVORITES_NEW, 'FAVORITES_NEW');
	FAVORITES_CHANGED = true;
};


/**
 * Check mount status and disconnect
 * @param {boolean} [force=false] flag to forcefully unmount the resource
 */
MediaBrowser.UnmountSMB = function ( force ) {
	if ( SMB_MOUNTED || force === true ) {
		// unmount the previous share
		gSTB.ExecAction('umount_dir ' + SMB_PATH);
		// global flag
		SMB_MOUNTED = false;
		SMB_DATA = null;
		echo('umount ' + SMB_PATH);
	}
};


/**
 * Check mount status and disconnect
 * @param {boolean} [force=false] flag to forcefully unmount the resource
 */
MediaBrowser.UnmountNFS = function ( force ) {
	if ( NFS_MOUNTED || force === true ) {
		// unmount the previous share
		gSTB.ExecAction('umount_dir ' + NFS_PATH);
		// global flag
		NFS_MOUNTED = false;
		NFS_DATA = null;
		echo('umount ' + NFS_PATH);
	}
};


/**
 * Mount if no connection with the given parameters.
 *
 * @param {Object} data mount options
 * @param {String} data.address ip address
 * @param {String} data.login needed login
 * @param {String} data.pass needed pass
 *
 * @return {boolean} operation status
 */
MediaBrowser.MountSMB = function ( data ) {
	var login, pass, command, status, idx;

	if ( SMB_MOUNTED ) {
		return true;
	}

	if ( !data.addresses && (!data.link || !data.link.addresses) ) {
		data.addresses = data.address ? [data.address.match(/(\d+\.){3}\d+/)[0]] : [];
	}

	if ( data && (data.addresses || data.link.addresses) ) {
		for ( idx = 0; idx < (data.addresses || data.link.addresses).length; idx += 1 ) {
			data.address = '//' + (data.addresses || data.link.addresses)[idx] + '/' + (data.link ? data.link.folder : data.name);
			// TODO: think about memory overhead due to save potentially unsuccessful connections
			if ( data.login ) {
				SMB_AUTH[data.address] = {login: data.login, pass: data.pass};
			}
			data.address = data.address.charAt(data.address.length - 1) === '/' ? data.address.substr(0, data.address.length - 1) : data.address;
			login = data.login || (SMB_AUTH[data.address] && SMB_AUTH[data.address].login ? SMB_AUTH[data.address].login : 'guest');
			pass = data.pass || (SMB_AUTH[data.address] && SMB_AUTH[data.address].pass ? SMB_AUTH[data.address].pass : '');
			command = 'mount cifs "' + data.address + '" "' + SMB_PATH + '" username=' + login + ',password=' + pass + ',iocharset=utf8';/*,unc=' + data.address.replace(/\//g, '\\')*/

			//console.log(command);

			status = gSTB.RDir(command).trim();
			echo(status, command);
			// global flag
			SMB_MOUNTED = status === 'Ok';

			//console.log(status);
			//console.log(SMB_MOUNTED);

			// ok
			if ( SMB_MOUNTED ) {
				// update auth data
				if ( !SMB_AUTH[data.address] ) {
					SMB_AUTH[data.address] = {};
				}
				SMB_AUTH[data.address].login = login;
				SMB_AUTH[data.address].pass = pass;
				SMB_DATA = data.link;

				//SMB_MOUNTED_ADDR = data.address;

				return SMB_MOUNTED;
			}
		}
	}

	return false;
};


/**
 * Mount if no connection with the given parameters
 * @param {Object} data mount options
 * @return {boolean} operation status
 */
MediaBrowser.MountNFS = function ( data ) {
	if ( NFS_MOUNTED ) {
		return true;
	}
	// check address
	if ( data && data.address ) {
		data.address = data.address.charAt(data.address.length - 1) === '/' ? data.address.substr(0, data.address.length - 1) : data.address;
		var command = 'mount nfs "' + data.address + '" "' + NFS_PATH + '" nolock,ro,rsize=4096,wsize=4096,udp';
		var status = gSTB.RDir(command);
		echo(status, command);
		// global flag
		NFS_MOUNTED = status === 'Ok';
		// ok so save link
		if ( NFS_MOUNTED ) {
			NFS_DATA = data.link;
		}
		return NFS_MOUNTED;
	}
	return false;
};


/**
 * Convert number of bytes into human readable format
 * @param {number} bytes Number of bytes to convert
 * @param {number} precision Number of digits after the decimal separator
 * @return string
 */
MediaBrowser.bytesToSize = function ( bytes, precision ) {
	var kilobyte = 1024;
	var megabyte = kilobyte * 1024;
	var gigabyte = megabyte * 1024;
	var terabyte = gigabyte * 1024;

	if ( (bytes >= 0) && (bytes < kilobyte) ) {
		return bytes + ' B';
	} else if ( (bytes >= kilobyte) && (bytes < megabyte) ) {
		return (bytes / kilobyte).toFixed(precision) + ' KB';
	} else if ( (bytes >= megabyte) && (bytes < gigabyte) ) {
		return (bytes / megabyte).toFixed(precision) + ' MB';
	} else if ( (bytes >= gigabyte) && (bytes < terabyte) ) {
		return (bytes / gigabyte).toFixed(precision) + ' GB';
	} else if ( bytes >= terabyte ) {
		return (bytes / terabyte).toFixed(precision) + ' TB';
	} else {
		return bytes + ' B';
	}
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoBack = function () {
	if ( this.parent.FileList.filterText ) {
		elchild(elclear(this.body), element('div', {}, [
			this.infoIcon,
			element('div', {className: 'text'}, _('Contains a list of items corresponding to the given filter request'))
		]));
	} else {
		elchild(elclear(this.body), this.Info(this.parent.FileList.parentItem));
	}
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoSambaRoot = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('LAN supports SMB/CIFS protocol, contains available working groups'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoSambaGroup = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('List of working group computers'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoSambaHost = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('List of available folders for every computer'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoSambaShare = function ( data ) {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Access to folders and files of selected network folder')),
		element('br'),
		element('div', {className: 'lbl'}, [_('Folder:'), element('span', {className: 'txt'}, data.name)]),
		element('div', {className: 'lbl'}, [_('Address:'), element('span', {className: 'txt'}, data.address)]),
		element('div', {className: 'lbl'}, [_('Type:'), element('span', {className: 'txt'}, 'SMB/CIFS')])
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoNfsShare = function ( data ) {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Access to folders and files of selected network folder')),
		element('br'),
		element('div', {className: 'lbl'}, [_('Folder:'), element('span', {className: 'txt'}, data.name)]),
		element('div', {className: 'lbl'}, [_('Address:'), element('span', {className: 'txt'}, data.address)]),
		element('div', {className: 'lbl'}, [_('Type:'), element('span', {className: 'txt'}, 'NFS')])
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoUpnp = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Plug&Play, a set of protocols for seamless connection of network devices, home and corporate. Easy and user-friendly access to media files in LAN.'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoRecordsRoot = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Access to list of Timeshift and PVR records collected from all available at the moment storages. All records are grouped by the channel names.'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoRecordsChan = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Opens a list of Timeshift and PVR records sorted by record date'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoRecordsDate = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Access to list of Timeshift and PVR records sorted by record time'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoFavorites = function () {
	var total = 0,
		name;

	for ( name in FAVORITES ) {
		total++;
	}
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Opens a full editable list of favourite records')),
		element('br'),
		element('div', {className: 'lbl'}, [_('Saved items:'), element('span', {className: 'txt'}, String(total))]),
		element('div', {className: 'lbl'}, [_('Unsaved changes:'), element('span', {className: 'txt'}, FAVORITES_CHANGED ? _('yes') : _('no'))])
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoFolder = function () {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Access to folders and files'))
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoFile = function ( data ) {
	var self = this,
		size = 120,
		name = data.name.substr(0, size - 1) + (data.name.length > size ? '...' : ''),
		info = [
			element('div', {className: 'file'}, [
				this.player = element('div', {className: 'player stop', onclick: function () {
					self.PlayPause();
					setTimeout(function(){ self.parent.FileList.Activate(true); }, 5);
				}}),
				this.pgbar = element('div', {className: 'pgbar'}),
				this.pgval = element('div', {className: 'pgval'})
			]),
			element('br'),
			//element('div', {className: 'lbl'}, [_('Name:'), element('span', {className: 'txt'}, name.split('').join('\u200B'))])	// changed to css word-wrap
			element('div', {className: 'lbl'}, [_('Name:'), element('span', {className: 'txt'}, name)])
		];

	if ( data.size !== undefined ) {
		info.push(element('div',
			{className: 'lbl'}, [
				_('Size:'),
				element('span', {className: 'txt'}, this.parent.bytesToSize(data.size, 1))
			]
		));
	}
	if ( data.performer !== undefined ) {
		info.push(element('div',
			{className: 'lbl'}, [
				_('Performer:'),
				element('span',	{className: 'txt'},	data.performer)
			]
		));
	}
	if ( data.file !== undefined ) {
		info.push(element('div',
			{className: 'lbl'},	[
				_('File:'),
				element('span', {className: 'txt'}, data.file)
			]
		));
	}

	// link for future use
	elchild(elclear(this.body), this.body.info = element('div', {}, info));

	// show images at once
	if ( data.type === MEDIA_TYPE_IMAGE ) {
		echo('data.type === MEDIA_TYPE_IMAGE')
		this.parent.Preview.PlayPause();
	}
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoPlaylist = function ( data ) {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('List of files or network streams to play')),
		element('br'),
		element('div', {className: 'lbl'}, [_('Size:'), element('span', {className: 'txt'}, this.parent.bytesToSize(data.size, 1))])
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoText = function ( data ) {
	elchild(elclear(this.body), element('div', {}, [
		this.infoIcon,
		element('div', {className: 'text'}, _('Text file with media subtitles or other data')),
		element('br'),
		element('div', {className: 'lbl'}, [_('Size:'), element('span', {className: 'txt'}, this.parent.bytesToSize(data.size, 1))])
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoStream = function ( data ) {
	var self = this,
		size = 100,
		name = data.name.substr(0, size / 2 - 1) + (data.name.length > size / 2 ? '...' : ''),
		url = data.url.substr(0, size - 1) + (data.url.length > size ? '...' : ''),
		urlParts;

	// this code needs, because i hate player, because he removes solution from url
	urlParts = url.trim().split(' ');
	if ( urlParts.length === 1 && data.sol ) {
		data.url = data.sol + ' ' + data.url;
		url = data.url.substr(0, size - 1) + (data.url.length > size ? '...' : '');
		// yep, this code looks strange
	}

	elchild(elclear(this.body), element('div', {}, [
		element('div', {className: 'file'}, [
			this.player = element('div', {className: 'player stop', onclick: function () {
				self.PlayPause();
			}}),
			this.pgbar = element('div', {className: 'pgbar'}),
			this.pgval = element('div', {className: 'pgval'})
		]),
		element('br'),
		element('div', {className: 'lbl'}, [_('Name:'), element('span', {className: 'txt'}, name)]),
		element('div', {className: 'lbl'}, [_('Address:'), element('span', {className: 'txt'}, url)])
	]));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoCue = function ( data ) {
	if ( data.cue === undefined ) {
		data.cue = this.parent.ParseCue(gSTB.RDir('GetFile "' + data.url + '"'));
	}
	var info = [
		this.infoIcon,
		element('div', {className: 'text'}, _('List of album files with additional info')),
		element('br')
	];
	if ( data.cue.title      !== undefined ) { info.push(element('div', {className: 'lbl'}, [_('Name:'),       element('span', {className: 'txt'}, data.cue.title)])); }
	if ( data.cue.performer  !== undefined ) { info.push(element('div', {className: 'lbl'}, [_('Performer:') , element('span', {className: 'txt'}, data.cue.performer)])); }
	if ( data.cue.songwriter !== undefined ) { info.push(element('div', {className: 'lbl'}, [_('Song by:'),    element('span', {className: 'txt'}, data.cue.songwriter)])); }
	if ( data.cue.genre      !== undefined ) { info.push(element('div', {className: 'lbl'}, [_('Genre:'),      element('span', {className: 'txt'}, data.cue.genre)])); }
	if ( data.cue.date       !== undefined ) { info.push(element('div', {className: 'lbl'}, [_('Date:'),       element('span', {className: 'txt'}, data.cue.date)])); }
	if ( data.cue.place      !== undefined ) { info.push(element('div', {className: 'lbl'}, [_('Place:'),      element('span', {className: 'txt'}, data.cue.place)])); }
	if ( data.cue.comment    !== undefined ) { info.push(element('div', {className: 'lbl'}, [_('Comment:'),    element('span', {className: 'txt'}, data.cue.comment)])); }
	if ( data.cue.files.length === 1 ) {
		info.push(element('div', {className: 'lbl'}, [_('File:'), element('span', {className: 'txt'}, data.cue.files[0].name)]));
	} else {
		info.push(element('div', {className: 'lbl'}, [_('Files:'), element('span', {className: 'txt'}, data.cue.files.length)]));
	}
	elchild(elclear(this.body), element('div', {}, info));
};


/**
 * Display the given item info
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.InfoStorage = function ( data ) {
	var canvas = element('canvas');
	var ctx = canvas.getContext('2d');

	elchild(elclear(this.body), element('div', {}, [
		element('div', {className: 'draw'}, canvas),
		element('div', {className: 'hint'}, _('Available') + ' ' + this.parent.bytesToSize(data.free, 1) + ' ' + _('from') + ' ' + this.parent.bytesToSize(data.size, 1)),
		element('div', {className: 'lbl'}, [_('Read only:'), element('span', {className: 'txt'}, data.readOnly ? _('yes') : _('no'))]),
		element('div', {className: 'lbl'}, [_('Type:'), element('span', {className: 'txt'}, configuration.fileSystemTypes[data.fsType] || '(n/a)')])
	]));

	var lastend = 0;
	var vals = [data.size - data.free, data.free];
	var myTotal = 0;
	var myColor = ['#ffc20e', '#2a2c2f'];
	for ( var e = 0; e < vals.length; e++ ) {
		myTotal += vals[e];
	}
	canvas.width = canvas.height = MediaBrowser.Preview.handleInner.scrollHeight / 4;
	for ( var i = 0; i < vals.length; i++ ) {
		ctx.fillStyle = myColor[i];
		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, canvas.height / 2);
		ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, lastend, lastend + (Math.PI * 2 * (vals[i] / myTotal)), false);
		ctx.lineTo(canvas.width / 2, canvas.height / 2);
		ctx.fill();
		lastend += Math.PI * 2 * (vals[i] / myTotal);
	}
};


/**
 * The main method of an item info display
 * @param {Object} data media item inner data
 */
MediaBrowser.Preview.Info = function ( data ) {
	// get item associated open action and execute
	if ( data && data.type && typeof this.actionInfo[data.type] === 'function' ) {
		this.actionInfo[data.type].call(this, data);
	}
	elchild(this.body, element('div', {className:'fade'}));
};


/**
 * Checks file encoding and reads the given file content
 * @param {string} fileName
 * @param {string} encoding - file encoding (utf-8, cp1250, ...)
 * @return {string}
 */
MediaBrowser.ReadFile = function ( fileName, encoding ) {
	encoding = encoding || 'utf-8';
	var result,
		xmlhttp = new XMLHttpRequest();
	// read raw data
	try {
		xmlhttp.overrideMimeType('text/html; charset=' + encoding);
		xmlhttp.open('GET', 'file://' + fileName, false);
		xmlhttp.send(null);
		result = xmlhttp.responseText;
	} catch ( e ) {
		echo(e, 'some xmlhttp error');
		result = '';
	}
	echo(result, 'file ' + fileName);
	return result;
};


/**
 * Parses the given CUE data
 * @param {string} text data to parse
 * @return {Object}
 */
MediaBrowser.ParseCue = function ( text ) {
	var currFile = null, currTrack = null, data = {files:[]};
	text.split('\n').forEach(function(line) {
		line = line.trim();
		var lineParts = line.split(' '),
			lineCmd   = lineParts.shift().toLowerCase();
		// strip command name
		var value = line.slice(lineCmd.length).trim();
		// check all
		switch ( lineCmd ) {
			case 'title':
			case 'performer':
			case 'songwriter':
				// strip trailing quotes
				if ( value.charAt(0) === '"' && value.charAt(value.length-1) === '"' ) {
					value = value.slice(1, value.length-1);
				}
				if ( currTrack !== null ) {
					currTrack[lineCmd] = value;
				} else {
					data[lineCmd] = value;
				}
				break;
			case 'file':
				currFile = {tracks:[]};
				var parts = value.split(' ');
				// has additional info
				if ( parts.length > 1 && value.charAt(value.length-1) !== '"' ) {
					currFile.type = parts.pop();
					// strip type part
					value = value.slice(0, -currFile.type.length).trim();
				}
				// strip trailing quotes
				if ( value.charAt(0) === '"' && value.charAt(value.length-1) === '"' ) {
					value = value.slice(1, value.length-1);
				}
				currFile.name = value;
				data.files.push(currFile);
				break;
			case 'track':
				currTrack = {
					number : lineParts[0],
					type   : lineParts[1],
					index  : []
				};
				currFile.tracks.push(currTrack);
				break;
			case 'rem':
				if ( ['GENRE', 'DATE', 'COMMENT', 'PLACE'].indexOf(lineParts[0]) !== -1 ) {
					value = value.slice(lineParts[0].length).trim();
					var field = lineParts[0].toLowerCase();
					// strip trailing quotes
					if ( value.charAt(0) === '"' && value.charAt(value.length-1) === '"' ) {
						value = value.slice(1, value.length-1);
					}
					if ( currTrack !== null ) {
						currTrack[field] = value;
					} else {
						data[field] = value;
					}
				}
				break;
			case 'index':
				if ( currTrack !== null ) {
					var time = (lineParts[1] || '00:00:00').split(':');
					currTrack.index.push(parseInt(time[0], 10) * 60 + parseInt(time[1], 10));
				}
				break;
		}
	});
	return data;
};



/**
 * Parse M3U playlists
 *
 * @example
 * #EXTM3U
 * #EXTCFG OPTION = VALUE
 * #EXTINF:419,Alice In Chains - Rotten Apple
 * Alice In Chains_Jar Of Flies_01_Rotten Apple.mp3
 */
MediaBrowser.ParseM3u = function ( text ) {
	var lines     = text.trim().split('\n'),
		currItem  = {},
		data      = {
			strict : false,
			config : {},
			items  : []
		};

	// remove whitespaces from both sides of each string
	lines = lines.map(Function.prototype.call, String.prototype.trim);
	// remove all empty strings
	lines = lines.filter(Boolean);

	// not empty file
	if ( lines.length > 0 ) {
		// validate header
		if ( lines[0] === '#EXTM3U' ) {
			// correct
			data.strict = true;
			// so remove from further parsing
			lines.shift();
		}

		// main parsing
		lines.forEach(function ( line ) {
			var comment, divPos, optKey, optVal;

			// data or comment/option
			if ( line.charAt(0) === '#' ) {
				// comment/option
				// try to extract directive name
				switch ( line.substr(1, 6).toUpperCase() ) {
					case 'EXTCFG':
						// raw line: "OPTION = VALUE" or "OPTION.PARAM = VALUE"
						comment = line.substr(7).trim();
						// position of the divider
						divPos = comment.indexOf('=');
						if ( divPos > 0 ) {
							// extract and set option with value
							optKey = comment.substr(0, divPos).trim();
							optVal = comment.substr(divPos+1).trim();
							// both parts are present
							if ( optKey && optVal ) {
								// find sub-options
								optKey = optKey.split('.');
								// plain or multilevel
								if ( optKey.length === 1 ) {
									// simple
									data.config[optKey[0]] = optVal;
								} else {
									// nested
									// init the structure
									if ( typeof data.config[optKey[0]] !== 'object' ) { data.config[optKey[0]] = {}; }
									// fill it
									data.config[optKey[0]][optKey[1]] = optVal;
								}
							}
						}
						break;
					case 'EXTINF':
						// raw line: "419,Alice In Chains - Rotten Apple"
						comment = line.substr(8).trim();
						// position of the divider
						divPos = comment.indexOf(',');
						if ( divPos > 0 ) {
							// extract and set time with title
							currItem.time = comment.substr(0, divPos).trim();
							currItem.name = comment.substr(divPos+1).trim();
						}
						break;
				}
			} else {
				if ( line.indexOf('://') === -1 ) {
					// static file

					// replace window slashes to unix slashes
					line = line.replace(/\\/g, '/');

					line = MediaBrowser.FileList.path[MediaBrowser.FileList.path.length-1].url + '/' + line;
					echo(line.split('.'));
					currItem.ext = line.split('.').pop().toLowerCase();
					currItem.type = MediaBrowser.FileList.ext2type[currItem.ext];
				} else {
					// remote link
					currItem.type = MEDIA_TYPE_STREAM;
				}
				// extend already collected data with url
				currItem.url  = line;
				// name always should be filled with either name or url
				currItem.name = currItem.name || currItem.url;
				// append to already found
				data.items.push(currItem);
				// reset
				currItem = {};
			}
		});

		if ( data.config ) {
			// correct config value types
			['VM_IPTV_ENABLED', 'VM_OTT_ENABLED', 'VM_OTT_LOG_ENABLED'].forEach(function ( name ) {
				if ( data.config[name] ) {
					data.config[name] = ['true', 'yes', '1'].indexOf(data.config[name].toLowerCase()) !== -1;
				}
			});
		}
	}

	echo(data, 'parsed m3u');
	return data;
};


/**
 * Parses the given data
 * @param {string} text data to parse
 * @return {[{name:String, url:String}]}
 */
//MediaBrowser.ParsePlaylistM3u = function ( text ) {
//	var self = this, result = [];
//	if ( /#EXTINF/.test(text) ) {
//		// divide by the separator
//		text.split('#EXTINF:').forEach(function ( item ) {
//			// each item
//			var entry = self.ParsePlaylistM3uEntry(item);
//			// append
//			if ( entry.name !== undefined ) {
//				result.push(entry);
//			}
//		});
//	} else {
//		var arr = text.split(/\n/);
//		for ( var i = 0; i < arr.length; i++ ) {
//			arr[i] = arr[i].replace(/\r/, '');
//			if ( arr[i] ) {
//				var entry = {};
//				entry.url = arr[i].trim();
//				entry.time = '-1';
//				var tempname = arr[i].split(/\//);
//				entry.name = tempname[(tempname.length - 1)].trim();
//				result.push(entry);
//			}
//		}
//	}
//	return result;
//};


/**
 * Разбор одной записи
 * @param {string} entry одна запись в формате m3u
 * @return {{name:String, url:String, time:Number}} объект {name: track_name, time: track_time, source: track_path}
 */
//MediaBrowser.ParsePlaylistM3uEntry = function ( entry ) {
//	var result = {},
//		arr;
//
//	entry = entry.trim().replace(/\r/, '');
//	arr   = entry.split('\n');
//
//	if ( arr && arr.length >= 2 && arr[1] ) {
//		var tmp = arr[1];
//		result.url = tmp.trim();  // URL or path
//		arr = arr[0].split(',');
//		result.time = arr[0];
//		result.name = arr[1] ? arr[1].replace(/"/gm, '').trim() : result.url;
//	}
//	return result;
//};


MediaBrowser.ParsePlaylist = function ( ext, text ) {
	var data = [], tmp = [], m3uData = text.trim(), type, extension;
	// remove BOM
	m3uData = m3uData.replace(/^\ufeff/, '');
	// let's hope it's a real playlist
	if ( ['m3u', 'm3u8'].indexOf(ext.toLowerCase()) >= 0 ) {
		// parse
		//tmp = this.ParsePlaylistM3u(m3uData);
		tmp = this.ParseM3u(m3uData).items;
		// tmp[i].url.split('.').pop().toLowerCase() - getting lowercased file extension from url
		for ( var i = 0; i < tmp.length; i++ ) {//
			extension = tmp[i].url.split('.').pop().toLowerCase();
			type = this.FileList.ext2type[extension];
			tmp[i].type = (typeof type === 'undefined' || ['m3u', 'm3u8'].indexOf(extension) !== -1) ? tmp[i].type : type;
			tmp[i].ext = extension;
			// replace window slashes to unix slashes
			tmp[i].url = tmp[i].url.replace(/\\/g, '/');
			data.push(tmp[i]);
		}
	}
	return data;
};
