/**
 * Media components: modal windows
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

var CModalManualScanDVBtext = 0;

/**
 * Show modal message box with single button Exit
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {string} title modal message box caption
 * @param {string} lblUser modal message box text for user name label
 * @param {string} lblPass modal message box text for user pass label
 * @param {string} btnExitTitle exit button caption
 * @param {Function} btnExitClick callback on exit button click
 * @param {string} btnOKTitle ok button caption
 * @param {Function} btnOKClick callback on ok button click
 * @class CModalConfirm
 * @constructor
 */
function CModalAuth ( parent, title, lblUser, lblPass, btnExitTitle, btnExitClick, btnOKTitle, btnOKClick ) {
	// for limited scopes
	var self = this;

	var html = element('table', {className:'main maxw'}, [
		element('tr', {}, [
			element('td', {className:'name'}, lblUser),
			element('td', {className:'data'}, this.user = element('input', {type:'text'}))
		]),
		element('tr', {}, [
			element('td', {className:'name'}, lblPass),
			element('td', {className:'data'}, this.pass = element('input', {type:'password'}))
		])
	]);

	this.user.onkeydown = this.pass.onkeydown = function ( event ) {
		// get real key code or exit
		if (!eventPrepare(event, false, 'CModalAuth')) {
			return;
		}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP: // up
				self.FocusPrev(event);
				break;
			case KEYS.DOWN: // down
				self.FocusNext(event);
				break;
			case KEYS.OK: // enter
				break;
		}
	};

	this.onShow = function(){
		setTimeout(function(){
			self.user.focus();
			gSTB.ShowVirtualKeyboard();
		}, 5);
	};

	// parent constructor
	CModalAlert.call(this, parent, title, html, btnExitTitle, btnExitClick);

	this.focusList.push(this.user);
	this.focusList.push(this.pass);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalAuth';

	// additional button
	this.bpanel.Add(KEYS.OK, 'ok.png', btnOKTitle, function () {
		if ( typeof btnOKClick === 'function' ) {
			if ( btnOKClick.call(self, self.user.value, self.pass.value) ) {
				self.Show(false);
			}
		}
	});
}

// extending
CModalAuth.prototype = Object.create(CModalAlert.prototype);
CModalAuth.prototype.constructor = CModalAuth;


///////////////////////////////////////////////////////////////////////////////


/**
 * Network share mounting
 * @param parent
 * @param link
 * @param type
 * @class CModalMount
 * @constructor
 */
function CModalMount ( parent, link, type ) {
	var smbData = MediaBrowser.FileList.Current().data;

	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalMount';

	// for limited scopes
	var self = this;

	this.type = new CSelectBox(this, {
		data: [{id:'smb', name: 'SMB'}, {id: 'nfs', name: 'NFS'}],
		parent: element('div'),
		events: {
			onChange: function() {
				if ( this.GetValue() === 'smb' ) {
					self.row_user.className = self.row_pass.className = '';
					self.focusList = [self.url, self.folder, self.local, this.handle, self.login, self.pass];
					self.login.disabled = false;
					self.pass.disabled = false;
					self.pass.type = 'password';
				} else {
					self.row_user.className = self.row_pass.className = 'inactive';
					self.login.value = self.pass.value = '';
					self.focusList = [self.url, self.folder, self.local, this.handle];
					self.login.disabled = true;
					self.pass.disabled = true;
					self.pass.type = 'text';
				}
			}
		}
	});

	var html = element('table', {className:'main maxw'}, [
		element('tr', {}, [
			element('td', {className:'name'}, _('Server address:')),
			element('td', {className:'data'}, this.url = element('input', {type:'text'}))
		]),
		element('tr', {}, [
			element('td', {className:'name'}, _('Server folder:')),
			element('td', {className:'data'}, this.folder = element('input', {type:'text'}))
		]),
		element('tr', {}, [
			element('td', {className:'name'}, _('Local folder:')),
			element('td', {className:'data'}, this.local = element('input', {type:'text'}))
		]),
		element('tr', {}, [
			element('td', {className:'name'}, _('Connection type:')),
			element('td', {className:'data'}, this.type.parentNode)
		]),
		this.row_user = element('tr', {}, [
			element('td', {className:'name'}, _('Login:')),
			element('td', {className:'data'}, this.login = element('input', {type:'text'}))
		]),
		this.row_pass = element('tr', {}, [
			element('td', {className:'name'}, _('Password') + ':'),
			element('td', {className:'data'}, this.pass = element('input', {type:'text'}))
		])
	]);

	echo(link, 'link');

	// initial values (the current open samba share) if not edit mode
	if ( link === undefined && (
		MediaBrowser.FileList.parentItem.type === MEDIA_TYPE_SAMBA_SHARE ||
			MediaBrowser.FileList.Current().data.type === MEDIA_TYPE_SAMBA_SHARE ||
			MediaBrowser.FileList.parentItem.type === MEDIA_TYPE_SAMBA_SHARE ||
			MediaBrowser.FileList.Current().data.type === MEDIA_TYPE_SAMBA_SHARE) ) {
		var address = MediaBrowser.FileList.Current().data.address || MediaBrowser.FileList.parentItem.address;
		var smbPath = address.split('/');
		self.url.value    = smbPath[2] || '';
		self.folder.value = smbPath[3] || '';
		self.local.value  = smbPath[3] || '';
		self.login.value  = SMB_AUTH[address] ? (SMB_AUTH.login || '') : '';
		self.pass.value   = SMB_AUTH[address] ? (SMB_AUTH.path || '') : '';
	} else if ( link !== undefined && link instanceof Object ) {
		self.url.value    = link.url    || '';
		self.folder.value = link.folder || '';
		self.local.value  = link.local  || '';
		self.login.value  = link.login  || '';
		self.pass.value   = link.pass   || '';
	}

	if ( type !== undefined ) {
		if (type === MEDIA_TYPE_SAMBA_SHARE) {
			this.type.SetIndex(0);
		}
		if (type === MEDIA_TYPE_NFS_SHARE) {
			this.type.SetIndex(1);
		}
	}

	this.type.trigger('onChange');


	this.prepare = function () {
		self.url.value    = self.url.value.trim();
		self.folder.value = self.folder.value.trim();
		self.local.value  = self.local.value.trim();
		self.login.value  = self.login.value.trim();
		self.pass.value   = self.pass.value.trim();

		// work with slashes
		if ( self.folder.value ) {
			if (self.type.GetValue() === 'nfs' && self.folder.value.charAt(0) !== '/') {
				self.folder.value = '/' + self.folder.value;
			}
			if (self.type.GetValue() === 'smb' && self.folder.value.charAt(0) === '/') {
				self.folder.value = self.folder.value.slice(1);
			}
			if (self.folder.value.charAt(self.folder.value.length - 1) === '/') {
				self.folder.value = self.folder.value.slice(0, -1);
			}
		}

		if ( !self.local.value && self.folder.value ) {
			var parts = self.folder.value.split('/');

			self.local.value = parts[parts.length-1];
		}
	};

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function(){
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', link !== undefined ? _('Save') : _('Connect'), function(){
		var addr;

		gSTB.HideVirtualKeyboard();

		self.prepare();

		// no params
		if ( !self.url.value || !self.folder.value || !self.local.value ) {
			// try again
			new CModalHint(self, _('Wrong connection parameters'), 4000);
		} else {
			// check dupes
			var data, exist, dupl = false;
			// type dependant check if not edit
			if ( link === undefined ) {
				SMB_ARRAY.forEach(function ( item ) {
					if ( item.local === self.local.value ) {
						dupl = true;
					}
				});

				NFS_ARRAY.forEach(function ( item ) {
					if ( item.local === self.local.value ) {
						dupl = true;
					}
				});
			}

			// found
			if ( dupl ) {
				// try again
				new CModalHint(self, _('Local folder with this name already exists'), 4000);
			} else {
				// good
				if ( self.type.GetValue() === 'smb' ) {
					addr = '//' + self.url.value + '/' + self.folder.value;

					// clear
					MediaBrowser.UnmountSMB();
					// try to mount if not edit
					if ( link !== undefined || MediaBrowser.MountSMB({
						addresses: smbData.addresses,
						name     : self.folder.value,
						address  : addr,
						login    : self.login.value,
						pass     : self.pass.value
					}) )
					{
						// prepare
						data = {
							addresses: smbData.addresses,
							url   : self.url.value,
							folder: self.folder.value,
							local : self.local.value,
							login : self.login.value || 'guest',
							pass  : self.pass.value
						};
						// check duplicates if not edit
						exist = false;
						if ( link === undefined ) {
							SMB_ARRAY.forEach(function ( item ) {
								var same = true;
								if ( !exist ) {
									for ( var name in data ) {
										same = same && data[name] === item[name];
									}
									if ( same ) {
										exist = true;
									}
								}
							});
						}
						// only if not a duplicate
						if ( !exist ) {
							setTimeout(function(){
								var index = 0, size;

								if ( link && SMB_ARRAY.indexOf(link) !== -1 ) {
									SMB_ARRAY[SMB_ARRAY.indexOf(link)] = data;
								} else {
									SMB_ARRAY.push(data);
								}
								echo(SMB_ARRAY, 'SMB_ARRAY');
								// resave smb data
								gSTB.SaveUserData('smb_data', JSON.stringify(SMB_ARRAY));
								// edit mode
								if ( link === undefined ) {
									MediaBrowser.Reset(false, false);
									size = MediaBrowser.FileList.data.length;
									while ( index < size ) {
										if ( MediaBrowser.FileList.data[index].link === data ) {
											MediaBrowser.FileList.Reposition({index: index}, true);
											break;
										}
										++index;
									}
									MediaBrowser.FileList.Open(MediaBrowser.FileList.activeItem.data);
								} else {
									var current = MediaBrowser.FileList.Current().data;
									MediaBrowser.FileList.Refresh(false);
									MediaBrowser.FileList.Reposition(current);
								}
								echo(SMB_ARRAY, 'gSTB.SaveUserData');
							}, 5);
							self.Show(false);
							new CModalHint(currCPage, _('Network folder successfully mounted'), 2000);
						} else {
							new CModalHint(self, _('Resource already connected'), 4000);
						}
					} else {
						new CModalHint(self, _('Unable to connect to the resource<br>with the given parameters'), 4000);
					}
				} else {
					// NFS
					addr = self.url.value + ':' + self.folder.value;
					// clear
					MediaBrowser.UnmountNFS();
					// try to mount if not edit
					if ( link !== undefined || MediaBrowser.MountNFS({address:addr}) ) {
						// prepare
						data = {
							url   : self.url.value,
							folder: self.folder.value,
							local : self.local.value
						};
						// check duplicates if not edit
						exist = false;

						if ( link === undefined ) {
							NFS_ARRAY.forEach(function(item){
								var same = true;
								if ( !exist ) {
									for (var name in data) {
										same = same && data[name] === item[name];
									}
									if (same) { exist = true; }
								}
							});
						}
						// only if not a duplicate
						if ( !exist ) {
							setTimeout(function(){
								var index = 0,
									size;

								if ( link && NFS_ARRAY.indexOf(link) !== -1 ) {
									NFS_ARRAY[NFS_ARRAY.indexOf(link)] = data;
								} else {
									NFS_ARRAY.push(data);
								}
								// resave nfs data
								gSTB.SaveUserData('nfs_data', JSON.stringify(NFS_ARRAY));
								// edit mode
								if ( link === undefined ) {
									MediaBrowser.Reset(false, false);
									size = MediaBrowser.FileList.data.length;
									while ( index < size ) {
										if ( MediaBrowser.FileList.data[index].link === data ) {
											MediaBrowser.FileList.Reposition({index: index}, true);
											break;
										}
										++index;
									}
									MediaBrowser.FileList.Open(MediaBrowser.FileList.activeItem.data);
								} else {
									var current = MediaBrowser.FileList.Current().data;
									MediaBrowser.FileList.Refresh(false);
									MediaBrowser.FileList.Reposition(current);
								}
								echo(NFS_ARRAY, 'gSTB.SaveUserData');
							}, 5);
							// hide and destroy
							self.Show(false);
							new CModalHint(currCPage, _('Network folder successfully mounted'), 2000);
						} else {
							new CModalHint(self, _('Resource already connected'), 4000);
						}
					} else {
						new CModalHint(self, _('Unable to connect to the resource<br>with the given parameters'), 4000);
					}
				}
			}
		}
	});

	// filling
	this.SetHeader(link !== undefined ? _('Edit network folder') : _('Connect network folder'));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function(){
		setTimeout(function(){
			self.url.focus();
			// show VK only for new shares
			if (link === undefined) {
				gSTB.ShowVirtualKeyboard();
			}
		}, 100);
	};

	// free resources on hide
	this.onHide = function(){
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( this.focusList[this.focusPos] === self.type.handle ) {
			self.type.EventHandler(event);
		}
		if (event.stopped === true) {
			return;
		}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.prepare();
				self.FocusPrev(event, false);
				break;
			case KEYS.DOWN:
				self.prepare();
				self.FocusNext(event, link === undefined);
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalMount.prototype = Object.create(CModalBox.prototype);
CModalMount.prototype.constructor = CModalMount;


///////////////////////////////////////////////////////////////////////////////


/**
 * Modal dialog to unmount the given network share
 * @param {CBase|CPage} parent
 * @param {Object} [share] autoselect the given share
 * @class CModalUnmount
 * @constructor
 */
function CModalUnmount ( parent, share ) {
	var selected, i;
	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalMount';

	// for limited scopes
	var self = this, shares = [];

	SMB_ARRAY.forEach(function(item){
		shares.push({type:'smb', id: item, name: item.local});
	});
	NFS_ARRAY.forEach(function(item){
		shares.push({type:'nfs', id: item, name: item.local});
	});
	for ( i = 0; i < shares.length; i++){
		if (shares[i].id === share){
			selected = i;
		}
	}
	this.local = new CSelectBox(this, {
		data: shares,
		selected: selected,
		style: 'wide',
		events: {
			onChange: function(){
				var selected = this.GetSelected();
				if (selected.type === 'smb') {
					self.hint.innerHTML = 'smb://' + selected.id.url + '/' + selected.id.folder;
				}
				if (selected.type === 'nfs') {
					self.hint.innerHTML = 'nfs://' + selected.id.url + selected.id.folder;
				}
			}
		},
		parent: element('div')
	});
	var html = element('table', {className:'main maxw'}, [
		element('tr', {}, [
			element('td', {className:'name'}, _('Local folder:'))
		]),
		element('tr', {}, [
			element('td', {className:'data'}, this.local.parentNode)
		]),
		element('tr', {}, [
			element('td', {className:'data'}, this.hint = element('div', {className:'hint'}))
		])
	]);

	this.local.trigger('onChange');

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function(){
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Disconnect'), function(){
		var pos, selected = self.local.GetSelected();
		if ( selected.type === 'smb' ) {
			// SMB
			MediaBrowser.UnmountSMB();
			pos = SMB_ARRAY.indexOf(self.local.GetValue());
			if ( pos !== -1 ) {
				SMB_ARRAY.splice(pos, 1);
			}
			echo(SMB_ARRAY, 'SMB_ARRAY saving');
			gSTB.SaveUserData('smb_data', JSON.stringify(SMB_ARRAY));
		} else if ( selected.type === 'nfs' ) {
			// NFS
			MediaBrowser.UnmountNFS();
			pos = NFS_ARRAY.indexOf(self.local.GetValue());
			if ( pos !== -1 ) {
				NFS_ARRAY.splice(pos, 1);
			}
			echo(NFS_ARRAY, 'NFS_ARRAY saving');
			gSTB.SaveUserData('nfs_data', JSON.stringify(NFS_ARRAY));
		}
		MediaBrowser.Reset(false, false);
		// hide and destroy
		self.Show(false);
		new CModalHint(currCPage, _('Network folder successfully unmounted'), 2000);
	});

	// filling
	this.SetHeader(_('Disconnect network folder'));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function(){
		self.local.focus();
	};

	// free resources on hide
	this.onHide = function(){
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, 'CModalAlert') ) {
			return;
		}

		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
		this.local.EventHandler(event);
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalUnmount.prototype = Object.create(CModalBox.prototype);
CModalUnmount.prototype.constructor = CModalUnmount;


///////////////////////////////////////////////////////////////////////////////


/**
 * Disk formating window
 * @param parent
 * @class CModalFormat
 * @constructor
 */
function CModalFormat ( parent ) {
	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalFormat';

	// for limited scopes
	var self = this, parts = [];

	this.type = new CSelectBox(this, {
		style: 'format',
		data: [
			{ id: 'ext3', name: 'EXT3'},
			{ id: 'ext2', name: 'EXT2'},
			{ id: 'ntfs', name: 'NTFS'},
			{ id: 'ext4', name: 'EXT4'}
		]
	});

		// fill the select list
	if ( HDD_INFO.length > 0 ) {
		for ( var i = 0; i < HDD_INFO.length; i++ ) {
			// not single partitions (only the hdd itself)
			if ( !HDD_INFO[i].partitionNum ) {
				parts.push({
					name: HDD_INFO[i].vendor + ' ' + HDD_INFO[i].model.replace(/\//, '') + ' ' + (HDD_INFO[i].size !== '' ? (Math.floor((HDD_INFO[i].size / 1073741824 * 100) / 100)) + 'GB' : ''),
					id: 'allHDD|' + (HDD_INFO[i].size !== '' ? (Math.floor(HDD_INFO[i].size / 1073741824 * 100) / 100) : 0)
				});
			}
		}
	}

	this.part = new CSelectBox(this, {
		style: 'format',
		data: parts
	});

	var html = element('table', {className:'main maxw'}, [
		this.$file_system = element('tr', {}, [
			element('td', {className:'name'}, _('File system:')),
			element('td', {className:'data'}, this.type.parentNode)
		]),
		this.$partition = element('tr', {}, [
			element('td', {className:'name'}, _('Partition:')),
			element('td', {className:'data'}, this.part.parentNode)
		]),
		this.$progress_bar_row = element('tr', {}, [
			element('td', {colSpan:2}, element('div', {}, this.$progress_bar = element('div', {className:'progressbar formatting'}, element('div', {className:'progressbar_bg maxh'}, [
				this.line = element('div', {className:'progressbar_line maxh'}),
				this.text = element('div', {className:'progressbar_digit'})
			]))))
		])
	]);

	self.focusList = [self.type, self.part];

	this.finish = function(){
		// reset progress bar and label
		this.line.style.width = this.text.innerHTML = '';
		// restore event handling
		document.addEventListener('keydown', mainEventListener);
		// enable select boxes
		this.type.disabled = this.part.disabled = false;
		// return focus
		this.type.focus();
		// clear buttons suppression
		this.bpanel.Activate(true);
	};

	this.check = function(){
		var read_status = {};
		try {
			eval('read_status=' + gSTB.RDir('tempfile read hdd_progress'));
		} catch ( e ) {
			echo(e, 'tempfile read hdd_progress');
		}
		echo(read_status, 'read_status');
		// beginning
		if ( read_status.state === 'undefined' ) {
			// init progress bar and label
			this.line.style.width = this.text.innerHTML = '0%';
			// call later (in 5 sec)
			return setTimeout(function () { self.check(); }, 5000);
		}
		// done
		if ( read_status.state === 'complete' ) {
			this.finish();
			// congratulations
			self.Show(false);
			setTimeout(function(){
				new CModalAlert(parent, _('Formatting'), _('Formatting completed'), _('Close'), function(){ echo('exit'); });
			}, 0);
			return;
		}
		function showElements() {
			self.$partition.style.display = self.$file_system.style.display = 'table-cell';
			self.$exit_key.style.display = self.$ok_key.style.display = 'block';
		}
		// failure
		if ( read_status.state === 'error' ) {
			this.finish();
			switch ( read_status.stage ) {
				case '16':
					showElements();
					new CModalAlert(this, _('Formatting error'), _('Formatting impossible.<br>Make sure the device is not used in:<br>"Download manager", "Record manager"<br>or content playback.'), _('Close'), function(){ echo('exit'); });
					break;
				case '2':
				case '22':
					showElements();
					new CModalAlert(this, _('Formatting error'), _('Formatting impossible'), _('Close'), function(){ echo('exit'); });
					break;
				default :
					showElements();
					new CModalAlert(this, _('Formatting'), _('Formatting error'), _('Close'), function(){ echo('exit'); });
			}
			return;
		}
		// update progress bar and label
		this.line.style.width = this.text.innerHTML = read_status.percent + '%';
		// call later (in 5 sec)
		return setTimeout(function(){ self.check(); }, 500);
	};

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.$exit_key = this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function(){
		// hide and destroy
		self.Show(false);
	});

	this.$ok_key = this.bpanel.Add(KEYS.OK, 'ok.png', _('Start formatting'), function(){
		var part = self.part.GetValue().split('|');
		echo(part);
		echo(self.part.GetValue());
		if ( part[0] ) {
			if ( self.type.GetValue() === 'fat32' && parseInt(part[1], 10) > 320 ) {
				return new CModalAlert(self, _('Formatting error'), _('Selected file system supports disks up to 320GB'), _('Close'), function(){ echo('exit'); });
			}

			new CModalConfirm(self, _('Formatting'), _('<b style="color:red">Warning: </b>after formatting all data in the<br> selected section will be deleted.'),
				_('Cancel'), function(){},
				_('Start formatting'), function(){
					// exit from the hdd to root level if necessary
					if ( MediaBrowser.FileList.mode === MEDIA_TYPE_STORAGE_SATA ) {
						// go to root
						MediaBrowser.Reset();
					}

					// disable main event handling
					document.removeEventListener('keydown', mainEventListener);
					// disable select boxes
					self.type.disabled = self.part.disabled = true;
					// suppress all bottom buttons
					self.bpanel.Activate(false);
					// format command
					var cmd = 'hdd_format ' + self.type.GetValue();
					echo(cmd, 'formatting command');
					gSTB.RDir(cmd);
					// start periodical check
					self.check();

					self.$partition.style.display = self.$file_system.style.display = self.$exit_key.style.display = self.$ok_key.style.display = 'none';
				}
			);
		} else {
			return new CModalAlert(self, _('Formatting error'), _('Formatting impossible'), _('Close'), function(){ echo('exit'); });
		}
	});

	// filling
	this.SetHeader(_('Formatting'));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function(){
		self.type.focus();
	};

	// free resources on hide
	this.onHide = function(){
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( typeof self.focusList[self.focusPos].EventHandler === 'function' ){
			self.focusList[self.focusPos].EventHandler(event);
		}
		if (event.stopped === true) {return;}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);

	// apply darker background
	this.handleInner.className = 'cmodal-main format';
}

// extending
CModalFormat.prototype = Object.create(CModalBox.prototype);
CModalFormat.prototype.constructor = CModalFormat;


///////////////////////////////////////////////////////////////////////////////


/**
 * Different ways to open the given playlist
 * @param parent
 * @class CModalPlayListOpen
 * @constructor
 */
function CModalPlayListOpen ( parent ) {
	// parent constructor
	CModalBox.call(this, parent);
	var $selectBox,
		isFileInUTF8 = gSTB.IsFileUTF8Encoded(this.parent.FileList.Current().data.url),
		encs = [/*'utf-8', */'cp1250', 'cp1251', 'cp1252', 'cp1253', 'cp1254', 'cp1254', 'cp1255', 'cp1256', 'cp1257', 'cp1258', 'iso8859-1', 'iso8859-2', 'iso8859-3', 'iso8859-4', 'iso8859-5', 'iso8859-6', 'iso8859-7', 'iso8859-8', 'iso8859-9', 'iso8859-10', 'iso8859-11', 'iso8859-12', 'iso8859-13', 'iso8859-14', 'iso8859-15', 'iso8859-16'];

	this.content.className = this.content.className + ' cmodal-pls';
	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalPlayListOpen';

	// for limited scopes
	var self = this;
	// callback on F-button click
	var func = function ( code ) {
		setTimeout(function(){
			echo(self.list.value);
			var data = self.parent.FileList.Current().data;
			data.code = code;
			data.encoding = isFileInUTF8 ? null : self.list.value;
			self.parent.FileList.Open(data);
		},5);
		self.Show(false);
	};

	this.list = new CSelectBox(this, {
		data : encs,
		style: 'subtitles'
	});

	this.onShow = function(){
		if(isFileInUTF8){
			$selectBox.style.display = 'none';
		}else{
			setTimeout(function(){
				self.list.focus();
			}, 5);
		}
	};

	this.bpanelMain = new CButtonPanel();
	this.bpanelMain.Init(CMODAL_IMG_PATH);
	this.bpanelMain.Add(KEYS.F1, 'f1.png', _('See playlist content'), func);
	this.bpanelMain.Add(KEYS.F2, 'f2.png', _('Start playing all records'), func);
	this.bpanelMain.Add(KEYS.F3, 'f3.png', _('Add all records to IPTV channels'), func);

	this.bpanelBottom = new CButtonPanel();
	this.bpanelBottom.Init(CMODAL_IMG_PATH);
	this.bpanelBottom.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function(){
		// hide and destroy
		self.Show(false);
	});

	var $html = element('table', {className:'main maxw'}, [
		element('tr', {}, [
			element('td', {className:'name'}, this.bpanelMain.handle)
		]),
		$selectBox = element('tr', {}, [
			element('td', {className:'data'}, [_('File encoding:'), this.list.parentNode])
		])
	]);

	// filling
	this.SetHeader(_('Open playlist'));
	this.SetContent([$html]);
	this.SetFooter(this.bpanelBottom.handle);

	// free resources on hide
	this.onHide = function(){
		elclear(self.bpanelMain.handle);
		elclear(self.bpanelBottom.handle);
		delete self.bpanelMain;
		delete self.bpanelBottom;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( e ) {
		if ( self.bpanelMain ) {self.bpanelMain.EventHandler(e); }
		if ( self.bpanelBottom ) {self.bpanelBottom.EventHandler(e);}
		if ( !isFileInUTF8 && self.list ) {self.list.EventHandler(e);}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalPlayListOpen.prototype = Object.create(CModalBox.prototype);
CModalPlayListOpen.prototype.constructor = CModalPlayListOpen;


///////////////////////////////////////////////////////////////////////////////


/**
 * Dialogue to open the given subtitle file
 * @param {CPage|CBase} parent modal window owner
 * @param {Object} options init parameters
 * @class CModalSubtitleOpen
 * @constructor
 */
function CModalSubtitleOpen ( parent, options ) {
	// for limited scopes
	var self = this,
		encs = [/*'utf-8', */'cp1250','cp1251', 'cp1252', 'cp1253', 'cp1254', 'cp1254', 'cp1255', 'cp1256', 'cp1257', 'cp1258', 'iso8859-1', 'iso8859-2', 'iso8859-3', 'iso8859-4', 'iso8859-5', 'iso8859-6', 'iso8859-7', 'iso8859-8', 'iso8859-9', 'iso8859-10', 'iso8859-11', 'iso8859-12', 'iso8859-13', 'iso8859-14', 'iso8859-15', 'iso8859-16'];

	this.list = new CSelectBox(this, {
		data: encs,
		style: 'subtitles'
	});

	var html = element('table', {className:'main maxw'}, [
		element('tr', {}, [
			element('td', {className:'name'}, _('File:')),
			element('td', {className:'data'}, (options.data.name || ''))
		]),
		element('tr', {}, [
			element('td', {className:'name'}, _('Encoding:')),
			element('td', {className:'data'}, this.list.parentNode)
		])
	]);

	this.onShow = function(){
		setTimeout(function(){
			self.list.focus();
		}, 5);
	};

	// parent constructor
	CModalAlert.call(this, parent, _('Accessing subtitle file'), html, _('Cancel'), function(){
		// close
		self.Show(false);
	});

	this.EventHandler = function(event){
		if ( !eventPrepare(event, true, this.name) ) {
			return;
		}
		self.list.EventHandler(event);
		self.bpanel.EventHandler(event);
	};

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalSubtitleOpen';

	// additional button
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Connection'), function(){
		self.Show(false);
		if ( typeof options.onadd === 'function' ) {
			options.onadd(options, self.list.value);
		}
	});

}

// extending
CModalSubtitleOpen.prototype = Object.create(CModalAlert.prototype);
CModalSubtitleOpen.prototype.constructor = CModalSubtitleOpen;


///////////////////////////////////////////////////////////////////////////////


function CModalCreateGroup ( parent, label, data, toDelete, newGroup) {
	var self = this, group = [],
		done = false;
	// parent constructor
	CModalBox.call(this, parent);

	if ( !data ) {
		data = [];
	}
	if ( !toDelete ) {
		toDelete = [];
	}
	this.content.className = this.content.className + ' cmodal-pls';
	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalCreateGroup';

	// for limited scopes

	var func = function ( code ) {
		switch(code){
			case KEYS.F1:
				break;
			case KEYS.F4:
				toDelete = [];
				break;
		}
		if ( self.newLocal.value === '' ) {
			if(self.local.GetValue() !== false){
				done = self.parent.TVList.createGroup(self.local.GetValue(), data, toDelete);
			}
		} else {
			done = self.parent.TVList.createGroup(self.newLocal.value, data, toDelete);
		}
		if(done){
			self.Show(false);
		}
	};

	var domArr = [];

	if(!newGroup){
		domArr.push(
			[
				element('tr', {}, [
					element('td', {className:'name'},  _('Group:')),
					element('td', {className:'data'}, this.localDiv = element('div'))
				]),
				element('tr', {}, [
					element('td'),
					element('td', {className:'data'}, _('or create and use a new group:'))
				]),
				element('tr', {}, [
					element('td'),
					element('td', {className:'data'}, this.newLocal = element('input', {type:'text', className:'wide'}))
				])
			]
		);
		group = parent.TVList.parentItem.data.slice(parent.TVList.handle.children[0].data.type === MEDIA_TYPE_BACK? 1:0,parent.TVList.channelStart+1);

		if(group.length){
			this.local = new CSelectBox(this, {idField : 'name', nameField : 'name', content: this.localDiv, data: group, style: 'cselect-box-wide'});
		} else {
			this.local = new CSelectBox(this, {content: this.localDiv, data: [{id: false, name : parent.TVList.parentItem.name?parent.TVList.parentItem.name:_('IPTV channels')}], style: 'cselect-box-wide'});
		}
		this.focusList.push(this.local);
		this.focusList.push(this.newLocal);
	} else {
		domArr.push(
			element('tr', {}, [
				element('td', {className:'name'}, _('Group:')),
				element('td', {className:'data'}, this.newLocal = element('input', {type:'text', className:'wide'}))
			])
		);
		this.focusList.push(this.newLocal);
	}
	var html = element('table', {className: 'main maxw'}, domArr);



	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		// hide and destroy
		self.Show(false);
	});
	if(newGroup){
		this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function (){
			if ( self.newLocal.value !== '' ) {
				self.Show(false);
				self.parent.TVList.createGroup(self.newLocal.value, data, toDelete);
			}
		});
	} else  {
		this.bpanel.Add(KEYS.F1, 'f1.png', _('Move'), func);
		this.bpanel.Add(KEYS.F4, 'f4.png', _('Copy'), func);
	}

	// filling
	this.SetHeader(label);
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function (){
		if(newGroup){
			self.newLocal.focus();
		} else {
			self.local.focus();
		}
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, 'CModalAlert') ) {
			return;
		}
		if ( !newGroup && document.activeElement === this.local.handle ) {
			this.local.EventHandler(event);
		}
		switch ( event.code ) {
//			case KEYS.CHANNEL_NEXT: // channel+
//			case KEYS.CHANNEL_PREV: // channel-
//				event.preventDefault(); // to suppress tabbing
//				break;
			case KEYS.UP:
				self.FocusPrev(event);
				break;
			case KEYS.DOWN: // down
				self.FocusNext(event);
				break;
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalCreateGroup.prototype = Object.create(CModalBox.prototype);
CModalCreateGroup.prototype.constructor = CModalCreateGroup;


///////////////////////////////////////////////////////////////////////////////


function CModalAddRecord ( parent, label, defParams ) {
	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalIptvAddRecord';
	var self = this,               // for limited scopes
		autoCorrection = true;     // start field auto correction flag

	if ( !defParams ) {
		defParams = {};
	}

	var time = defParams.time? new Date(defParams.time) : new Date(),
		sec = time.getSeconds(),
		min = time.getMinutes(),
		hour = time.getHours(),
		day = time.getDate(),
		month = time.getMonth() + 1,
		year = time.getFullYear();

	time = new Date(time.getTime() + (defParams.duration? defParams.duration : 3600000)); // default record length = 1 hour
	var min1 = time.getMinutes(),
		hour1 = time.getHours(),
		day1 = time.getDate(),
		month1 = time.getMonth() + 1,
		year1 = time.getFullYear();

	sec = sec > 9 ? sec : '0' + sec;
	min = min < 10 ? '0' + min : min;
	hour = hour < 10 ? '0' + hour : hour;
	day = day < 10 ? '0' + day : day;
	month = month < 10 ? '0' + month : month;
	min1 = min1 < 10 ? '0' + min1 : min1;
	hour1 = hour1 < 10 ? '0' + hour1 : hour1;
	day1 = day1 < 10 ? '0' + day1 : day1;
	month1 = month1 < 10 ? '0' + month1 : month1;

	this.parseTime = function () {
		var tt = /^([0-9]+)$/;
		echo('parseTime : ' + this.value + ' | ' + tt.test(this.value));
		if ( tt.test(this.value) ) {
			if ( this.value > this.maxValue ) {
				this.value = this.maxValue;
			}
			if ( this.value.length === this.maxLength ) {
				setTimeout(function () {
					self.FocusRight();
				}, 50);
			}
		}
		else {
			if ( this.value.length > 0 ) {
				this.value = this.value.substring(0, this.value.length - 2);
			}
		}
		return false;
	};

	this.checkTime = function () {
		self.startTimeYear.value  = self.startTimeYear.value  || (new Date()).getFullYear();
		self.startTimeMonth.value = self.startTimeMonth.value || '01';
		self.startTimeDay.value   = self.startTimeDay.value   || '00';
		self.startTimeHour.value  = self.startTimeHour.value  || '00';
		self.startTimeMin.value   = self.startTimeMin.value   || '00';
		self.endTimeYear.value    = self.endTimeYear.value    || (new Date()).getFullYear();
		self.endTimeMonth.value   = self.endTimeMonth.value   || '01';
		self.endTimeDay.value     = self.endTimeDay.value     || '00';
		self.endTimeHour.value    = self.endTimeHour.value    || '00';
		self.endTimeMin.value     = self.endTimeMin.value     || '00';

		var startTime = new Date(self.startTimeYear.value, self.startTimeMonth.value - 1, self.startTimeDay.value, self.startTimeHour.value, self.startTimeMin.value),
			endTime = new Date(self.endTimeYear.value, self.endTimeMonth.value - 1, self.endTimeDay.value, self.endTimeHour.value, self.endTimeMin.value),
			delta = (endTime.getTime() - startTime.getTime()) / 1000;
		if ( delta > 0 ) {
			var h = Math.floor(delta / 3600);
			var m = Math.floor((delta - h * 3600) / 60);
			if ( h > 24 ) {
				h = 23;
				m = 59;
				self.checkEndTime();
			}
			self.timeHour.value = h > 9 ? h : '0' + h;
			self.timeMin.value = m > 9 ? m : '0' + m;
		} else {
			self.timeHour.value = '00';
			self.timeMin.value = '00';
		}
		if ( autoCorrection ) {
			self.itemName.value = (self.startTimeHour.value < 10 && self.startTimeHour.value !== '00' ? '0' + Number(self.startTimeHour.value) : self.startTimeHour.value) + ':' +
				(self.startTimeMin.value < 10 && self.startTimeMin.value !== '00' ? '0' + Number(self.startTimeMin.value) : self.startTimeMin.value) + ':00';
		}
		return false;
	};

	this.checkEndTime = function () {
		var hour = self.startTimeHour.value,
			min = self.startTimeMin.value,
			day = self.startTimeDay.value;
		self.timeHour.value = self.timeHour.value || '00';
		self.timeMin.value = self.timeMin.value || '00';
		var startTime = new Date(self.startTimeYear.value, self.startTimeMonth.value - 1, day, hour, min),
			endTime = new Date(startTime.getTime() + (self.timeHour.value * 3600 + self.timeMin.value * 60) * 1000);
		min = endTime.getMinutes();
		min = min < 10 ? '0' + min : min;
		hour = endTime.getHours();
		hour = hour < 10 ? '0' + hour : hour;
		day = endTime.getDate();
		day = day < 10 ? '0' + day : day;
		month = endTime.getMonth() + 1;
		month = month < 10 ? '0' + month : month;

		self.endTimeHour.value = hour;
		self.endTimeMin.value = min;
		self.endTimeDay.value = day;
		self.endTimeMonth.value = month;
		self.endTimeYear.value = endTime.getFullYear();
	};

	(function (obj) {
		obj.channels = [];
		IPTVChannels.TVList.parentItem.data.forEach(function ( item ) {
			if ( !item.data ) {
				obj.channels.push(item);
			}
		});
		obj.channels.forEach(function ( item ) {
			item.label = item.name;
		});
	})(this);

	this.refreshStorageInfo = function() {
		this.storage = [];
		getStorageInfo();
		var usb, i;
		for (i = 0; i < STORAGE_INFO.length; i++) {
			usb = STORAGE_INFO[i];
			if (usb.isReadOnly === 0){
				usb.freeSizeGb = Math.floor(usb.freeSize / 1024 / 1024 / 1024 * 100) / 100;
				usb.sizeGb = Math.floor(usb.size / 1024 / 1024 / 1024 * 100) / 100;
				usb.id = i;
				this.storage.push(usb);
			}
		}
	};
	this.refreshStorageInfo();
	echo(this.storage, 'this.storage');
	this.device = new CSelectBox(this,
		{
			data: this.storage.length > 0 ? this.storage : [{id: -1, label: _('No storage device')}],
			nameField: 'label',
			style : 'cselect-box-wide',
			events: {
				onChange: function(){
					self.$freeSize.innerHTML = this.GetSelected().freeSizeGb || '0';
					self.$totlaSize.innerHTML = this.GetSelected().sizeGb || '0';
				}
			}
		});
	this.$channels = new CSelectBox(this,
		{
			data: this.channels.length > 0 ? this.channels : [{id: -1, label: _('No channels')}],
			nameField: 'label',
			style : 'cselect-box-wide'
		});
	// set current channel as default
	if ( defParams.activeChannel ) {
		if ( defParams.activeChannel.type === MEDIA_TYPE_STREAM ) {
			this.$channels.SetIndex(this.channels.indexOf(defParams.activeChannel));
		}
	} else {
		for (var i = 0; i < this.channels.length; i++) {
			if (IPTVChannels.TVList.activeItem.data.index && IPTVChannels.TVList.parentItem.data[IPTVChannels.TVList.activeItem.data.index].type === MEDIA_TYPE_STREAM && this.channels[i].url === IPTVChannels.TVList.parentItem.data[IPTVChannels.TVList.activeItem.data.index].url ) {
				this.$channels.SetIndex(i);
			}
		}
	}

	var html = element('table', {className: 'main maxw'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Start recording:')),
			element('td', {className: 'data'}, [
				element('div', {className: 'box'}, [
					this.startTimeHour = element('input', {className: 'time', type: 'text', value: hour, maxLength: 2, minValue: 0, maxValue: 23, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, ':'),
					this.startTimeMin = element('input', {className: 'time', type: 'text', value: min, maxLength: 2, minValue: 0, maxValue: 59, oninput: this.parseTime, onchange: this.checkTime})
				]),
				element('div', {className: 'box'}, [
					this.startTimeDay = element('input', {className: 'time', type: 'text', value: day, maxLength: 2, minValue: 1, maxValue: 31, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.startTimeMonth = element('input', {className: 'time', type: 'text', value: month, maxLength: 2, minValue: 1, maxValue: 12, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.startTimeYear = element('input', {className: 'data_time', type: 'text', value: year, maxLength: 4, minValue: 1, maxValue: 9999, oninput: this.parseTime, onchange: this.checkTime})
				])
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('End recording:')),
			element('td', {className: 'data'}, [
				element('div', {className: 'box'}, [
					this.endTimeHour = element('input', {className: 'time', type: 'text', value: hour1, maxLength: 2, minValue: 0, maxValue: 23, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, ':'),
					this.endTimeMin = element('input', {className: 'time', type: 'text', value: min1, maxLength: 2, minValue: 0, maxValue: 59, oninput: this.parseTime, onchange: this.checkTime})
				]),
				element('div', {className: 'box'}, [
					this.endTimeDay = element('input', {className: 'time', type: 'text', value: day1, maxLength: 2, minValue: 1, maxValue: 31, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.endTimeMonth = element('input', {className: 'time', type: 'text', value: month1, maxLength: 2, minValue: 1, maxValue: 12, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.endTimeYear = element('input', {className: 'data_time', type: 'text', value: year1, maxLength: 4, minValue: 1, maxValue: 9999, oninput: this.parseTime, onchange: this.checkTime})
				])
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Record length:')),
			element('td', {className: 'data'}, [
				element('div', {className: 'box'}, [
					this.timeHour = element('input', {className: 'time', type: 'text', value: '01', maxLength: 2, minValue: 0, maxValue: 23, oninput: this.parseTime, onchange: this.checkEndTime}),
					element('div', {className: 'colon'}, ':'), this.timeMin = element('input', {className: 'time', type: 'text', value: '00', maxLength: 2, minValue: 0, maxValue: 59, oninput: this.parseTime, onchange: this.checkEndTime})
				])
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Channel:')),
			element('td', {className: 'data'}, this.$channels.parentNode)
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Record name:')),
			element('td', {className: 'data'}, [
				this.itemName = element('input', {className: 'wide', type: 'text', value: defParams.name? defParams.name : hour + ':' + min + ':' + sec, change: false, onchange: function () {}, oninput: function () { this.change = true; autoCorrection = false; }})
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Record in:')),
			element('td', {className: 'data'}, this.device.parentNode)
		]),
		element('tr', {}, [
			element('td'),
			element('td', {className: 'data'}, [_('Free space:') + ' ', (this.$freeSize = element('span', {className: 'size'}, this.device.GetSelected().freeSizeGb || '0')), ' ' + _('GB') + '   ' + _('of') + ' ',
				(this.$totlaSize = element('span', {className: 'size'}, this.device.GetSelected().sizeGb || '0')), ' ' + _('GB')
			])
		])
	]);
//
	this.focusList = [
		[this.startTimeHour, this.startTimeMin, this.startTimeDay, this.startTimeMonth, this.startTimeYear],
		[this.endTimeHour, this.endTimeMin, this.endTimeDay, this.endTimeMonth, this.endTimeYear],
		[this.timeHour, this.timeMin],
		[this.$channels],
		[this.itemName],
		[this.device]
	];

	this.startTimeHour.oninput = this.parseTime;


	this.focusPos = 0;
	this.subFocusPos = 0;
	this.FocusNext = function ( event, manageVK ) {
		if ( this.focusList.length > 0 ) {
			// cycling the index
			if ( ++this.focusPos >= this.focusList.length ) {
				this.focusPos = 0;
			}
			// get the next html element in the list
			var el = this.focusList[this.focusPos][0];
			if ( manageVK !== false ) {
				gSTB.HideVirtualKeyboard();
			}
			// set focus
			el.focus();
			this.subFocusPos = 0;
			// skip looping select options elements
			if ( event && el.nodeName !== 'SELECT' ) {
				event.preventDefault();
				if ( el.select ) {
					el.select();
				}
			}
		}
	};

	this.FocusPrev = function ( event, manageVK ) {
		if ( this.focusList.length > 0 ) {
			// cycling the index
			if ( --this.focusPos < 0 ) {
				this.focusPos = this.focusList.length - 1;
			}
			// get the next html element in the list
			var el = this.focusList[this.focusPos][0];
			if ( manageVK !== false ) {
				gSTB.HideVirtualKeyboard();
			}
			// set focus
			el.focus();
			this.subFocusPos = 0;
			// skip looping select options elements
			if ( el.nodeName !== 'SELECT' ) {
				if ( el.select ) {
					el.select();
				}
				event.preventDefault();
			}
		}
	};

	this.FocusRight = function ( event ) {
		if ( this.focusList[this.focusPos].length > 1 ) {
			if ( ++this.subFocusPos >= this.focusList[this.focusPos].length ) {
				this.subFocusPos = 0;
			}
			var el = this.focusList[this.focusPos][this.subFocusPos];
			el.focus();
			if ( el.nodeName !== 'SELECT' ) {
				if ( el.select ) {
					el.select();
				}
				if ( event ) {
					event.preventDefault();
				}
			}
		}
	};

	this.FocusLeft = function ( event ) {
		if ( this.focusList[this.focusPos].length > 1 ) {
			if ( --this.subFocusPos < 0 ) {
				this.subFocusPos = this.focusList[this.focusPos].length - 1;
			}
			var el = this.focusList[this.focusPos][this.subFocusPos];
			el.focus();
			if ( el.nodeName !== 'SELECT' ) {
				if( el.select ) {
					el.select();
				}
				if ( event ) {
					event.preventDefault();
				}
			}
		}
	};

	this.startPVR = function () {
		// if channel list is empty
		if ( self.$channels.GetSelected().id < 0 ) {
			new CModalHint(currCPage, _('Channel list is empty'), 3000);
			return;
		}
		// only 5 active records limit
		var arr, inProgress = 0;
		try {
			arr = JSON.parse(pvrManager.GetAllTasks());
		} catch( e ) {
			arr = [];
		}
		arr.forEach(function ( item ) {
			if ( item.state === 2 ) {inProgress++;}
		});
		if ( inProgress >= 5 ) {
			new CModalHint(currCPage, _('Error. Too many active records.'), 3000);
			return;
		}
		// there is no free space at usb drive
		if(self.device.GetSelected().freeSize === 0){
			new CModalHint(currCPage, _('Not enough disk space'), 3000);
			return;
		}

		var url = self.$channels.GetSelected().url.replace(/@/igm, '');
		var devPath  = self.device.GetSelected().mountPath;
		var chanName = self.$channels.GetSelected().name.replace(/\/|\*|:|\\|\?|\||'|&|"|\^|%|<|>/igm, '');
		echo(url, 'SELECTED CHANNEL IS');
		gSTB.ExecAction('make_dir "' + devPath + '/records"');
		gSTB.ExecAction('make_dir "' + devPath + '/records/' + chanName + '"');
		gSTB.ExecAction('make_dir "' + devPath + '/records/' + chanName + '/' + this.startTimeYear.value + '-' + this.startTimeMonth.value + '-' + this.startTimeDay.value + '"');
		var name = devPath + '/records/' + chanName + '/' + this.startTimeYear.value + '-' + this.startTimeMonth.value + '-' + this.startTimeDay.value + '/' + this.itemName.value.split(':').join('-').replace(/\/|\*|:|\\|\?|\||'|&|"|\^|%|<|>/igm, '') + '.ts';
		var hour = self.startTimeHour.value;
		var min = self.startTimeMin.value;
		var day = self.startTimeDay.value;
		var mon = self.startTimeMonth.value - 1;
		var year = self.startTimeYear.value;
		var startTime = new Date(year, mon, day, hour, min);
		var hourE = self.endTimeHour.value;
		var minE = self.endTimeMin.value;
		var dayE = self.endTimeDay.value;
		var monE = self.endTimeMonth.value - 1;
		var yearE = self.endTimeYear.value;
		var endTime = new Date(yearE, monE, dayE, hourE, minE);

		var done = pvrManager.CreateTask(url, name, startTime.getTime() / 1000, endTime.getTime() / 1000);
		echo('DONE:'+done);
		if ( done < 0 ) {
			var text;
			switch ( done ) {
				case '-2':
					text = _('Not enough disk space');
					break;
				case '-3':
					text = _('Incorrect time');
					break;
				case '-5':
					text = _('Wrong name or path');
					break;
				case '-6':
					text = _('Duplicated file');
					break;
				case '-7':
					text = _('Wrong URL');
					break;
				case '-9':
					text = _('Too many active records processed');
					break;
				case '-11':
					text = _('Not enough disk space');
					break;
				default:
					text = _('Error...');
					break;
			}
			new CModalHint(currCPage, text, 3000);
		} else {
			if ( parent === IPTVChannels ) {
				IPTVChannels.pvr.start();
			}
			self.Show(false);
		}
	};

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Start recording'), function () {
		self.startPVR();
	});

	// filling
	this.SetHeader(label);
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		self.focusList[self.focusPos][0].focus();
		self.focusList[self.focusPos][0].select();
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// update storage device info on stbEvent
	this.onMountAction = function () {
		echo('IPTV-modals->onMountAction');
		this.refreshStorageInfo();
		// refresh addModalMessage message view
		this.device.SetData(this.storage.length > 0 ? this.storage : [{id : -1, label : _('No storage device')}]);
		this.$freeSize.innerHTML = currCPage.device.GetSelected().freeSizeGb || '0';
		this.$totlaSize.innerHTML = currCPage.device.GetSelected().sizeGb || '0';
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, 'CModalAlert') ) {
			return;
		}
		if ( document.activeElement.component && document.activeElement.component.constructor === CSelectBox ) {
			document.activeElement.component.EventHandler(event);
		}
		if ( event.stopped === true ) {
			return;
		}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			case KEYS.LEFT:
				// go through dir names
				self.FocusLeft(event);
				break;
			case KEYS.RIGHT:
				self.FocusRight(event);
				break;
			case KEYS.PAGE_UP:
				// checking min/max Value of input field
				if ( document.activeElement.value >= document.activeElement.minValue && document.activeElement.value < document.activeElement.maxValue ) {
					document.activeElement.value++;
					document.activeElement.onchange();

					if ( document.activeElement.value < 10 ) {
						document.activeElement.value = '0' + document.activeElement.value;
					}
				}
				break;
			case KEYS.PAGE_DOWN:
				// checking min/max Value of input field
				if ( document.activeElement.value > document.activeElement.minValue && document.activeElement.value <= document.activeElement.maxValue ) {
					document.activeElement.value--;
					document.activeElement.onchange();

					if ( document.activeElement.value < 10 ) {
						document.activeElement.value = '0' + document.activeElement.value;
					}
				}
				break;
			case KEYS.VOLUME_DOWN:
			case KEYS.VOLUME_UP:
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalAddRecord.prototype = Object.create(CModalBox.prototype);
CModalAddRecord.prototype.constructor = CModalAddRecord;




///////////////////////////////////////////////////////////////////////////////


function CModalChannelEdit ( parent, item, data ) {
	// parent constructor
	CModalBox.call(this, parent);
	var self = this;
	/**
	 * The component inner name
	 * @type {string}
	 */

	this.name = 'CModalChannelEdit';
	var html = null;
	if ( item.data.type === MEDIA_TYPE_GROUP ) {
		html = element('table', {className: 'main maxw'}, [
			element('tr', {}, [
				element('td', {className: 'name'}, _('Name :')),
				element('td', {className: 'data'}, this.chName = element('input', {type: 'text', value: data.name}))
			])
		]);
	} else {
		html = element('table', {className: 'main maxw'}, [
			element('tr', {}, [
				element('td', {className: 'name'}, _('Name :')),
				element('td', {className: 'data'}, this.chName = element('input', {type: 'text', value: data.name}))
			]),
			element('tr', {}, [
				element('td', {className: 'name'}, _('URL :')),
				element('td', {className: 'data'}, this.chURL = element('input', {type: 'text', value: (data.sol && data.sol !==''?data.sol+' ':'')+data.url}))
			])
		]);
	}
	this.focusList = [this.chName, this.chURL];


	this.focusPos = 0;
	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function () {
		var arr = [],
			idx, baseUrl;

		data.name = self.chName.value;

		if ( item.data.type === MEDIA_TYPE_STREAM ) {
			arr = self.chURL.value.trim().split(' ');

			if ( arr.length > 1 ) {
				for ( idx = 0; idx < arr.length; idx += 1 ) {
					if ( validateUrl(arr[idx], false, false, false) ) {
						baseUrl = arr[idx];
						break;
					}
				}
			}

			if ( !(validateUrl(self.chURL.value, true, true, false) || (arr.length > 1 && (!idx || idx === 1 && validateUrl(arr[0] + ' ' + baseUrl, true, false, false)))) ) {
				new CModalHint(self, _('Wrong field data'), 4000);
				return;
			}

			data.url = self.chURL.value;

			if ( data.sol ) {
				data.sol = '';
			}

			item.data.url = data.url;
			IPTVChannels.domURL.innerHTML = data.url;
			data.changed = true;
			var tempList = [JSON.parse(JSON.stringify(IPTVChannels.TVList.parentItem.data[item.data.index]))];
			tempList = IPTVChannels.checkSolution(tempList, true);
			tempList = IPTVChannels.checkTS_data(tempList.a, true);
			data = tempList.a[0];
			IPTVChannels.TVList.parentItem.data[item.data.index] = data;
			item.children[2].className = data.tsOn && configuration.mayTimeShift ? 'timeshift tsOn' : 'timeshift';
			IPTVChannels.TVList.timer.OnFocusPlay = setTimeout(function () {MediaPlayer.preparePlayer(data, IPTVChannels, true, false, true);}, 100);
		}
		item.data.name = data.name;
		item.children[1].innerHTML = data.name;
		IPTVChannels.needSave = true;
		IPTVChannels.domInfoTitle.innerHTML = data.name;
		self.Show(false);
	});

	// filling
	this.SetHeader(_('Edit'));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		self.focusList[self.focusPos].focus();
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, 'CModalChannelEdit') ) {
			return;
		}

		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			case KEYS.LEFT:
			case KEYS.RIGHT:
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalChannelEdit.prototype = Object.create(CModalBox.prototype);
CModalChannelEdit.prototype.constructor = CModalChannelEdit;

/////////////////////////////////////////////////////////////////////////////////////////////

function CModalChannelExport ( parent, data ) {
	// parent constructor
	CModalBox.call(this, parent);
	var self = this, html,
		pathList = [];
	/**
	 * The component inner name
	 * @type {string}
	 */

	this.name = 'CModalChannelExport';
	if ( STORAGE_INFO.length > 0 ) {
		for ( var i = 0; i < STORAGE_INFO.length; i++ ) {
			var name = STORAGE_INFO[i].label;
			var value = STORAGE_INFO[i].mountPath;
			pathList.push({name: name, id: value});
		}
	} else {
		pathList.push({title: _('None'), value: ''});
	}

	this.path = new CSelectBox(this, {
		data: pathList,
		parent: element('div', {className: 'control'})
	});

	this.tree = new CCheckBox(this, {
		parent: element('div', {className: 'control'}),
		checked: true
	});

	html = element('table', {className: 'main maxw'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('File location:')),
			element('td', {className: 'data'}, this.path.parentNode)
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('File name:')),
			element('td', {className: 'data'}, this.file = element('input', {type: 'text', value: ''}))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Save from groups:')),
			element('td', {className: 'data'}, this.tree.handle)
		])
	]);

	this.focusList = [this.path, this.file, this.tree];


	this.focusPos = 0;
	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function () {
		var text = [], good;
		if ( self.path.GetValue() === '' || self.file.value === '' ) {
			new CModalHint(self, _('Wrong field data'), 4000);
			return;
		}
		if ( typeof parent.exportChannels === 'function' ) {
			text = parent.exportChannels(data, self.tree.IsChecked());
		}
		try {
			good = gSTB.SaveFile(self.path.GetValue() + '/' + self.file.value + '.m3u', text);
		} catch (e) {
			echo(e, 'SaveFile');
			good = false;
		}
		if ( good ) {
			self.Show(false);
			new CModalHint(currCPage, _('Successfully exported'), 4000);
		} else {
			new CModalHint(self, _('Save error'), 4000);
			return;
		}
	});

	// filling
	this.SetHeader(_('Export channels'));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		self.focusList[self.focusPos].focus();
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if (typeof this.focusList[this.focusPos].EventHandler === 'function') {
			this.focusList[this.focusPos].EventHandler(event);
		}

		if (event.stopped === true) {
			return;
		}

		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			case KEYS.LEFT:
			case KEYS.RIGHT:
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalChannelExport.prototype = Object.create(CModalBox.prototype);
CModalChannelExport.prototype.constructor = CModalChannelExport;

///////////////////////////////////////////////////////////////////////////////


/**
 * add new channel to IPTV Channels or all channels from some playlist
 * @param parent
 * @param {boolean} IsItPlaylist - is it playlist?
 * @class CModalImportTVChannels
 * @constructor
 */
function CModalChannelsAdd ( parent, IsItPlaylist ) {
	// parent constructor
	CModalBox.call(this, parent);

	var self = this;

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalChannelsAdd';

	// navigation elements
	this.focusList = [];
	var $html = element('table', {className: 'main maxw'}), playListHint = '',
		encs = ['utf-8', 'cp1250', 'cp1251', 'cp1252', 'cp1253', 'cp1254', 'cp1254', 'cp1255', 'cp1256', 'cp1257', 'cp1258', 'iso8859-1', 'iso8859-2', 'iso8859-3', 'iso8859-4', 'iso8859-5', 'iso8859-6', 'iso8859-7', 'iso8859-8', 'iso8859-9', 'iso8859-10', 'iso8859-11', 'iso8859-12', 'iso8859-13', 'iso8859-14', 'iso8859-15', 'iso8859-16'];

	if ( IsItPlaylist ) {
		try {// we should use last play list URL as a hint
			playListHint = JSON.parse(gSTB.GetEnv(JSON.stringify({ varList : ['playlist_url']}))).result.playlist_url;
		} catch ( e ) {
			echo('Something wrong with last used playlist URL -> '+e);
			playListHint = '';
		}
		// choose correct encoding
		self.list = new CSelectBox(this, {
			data : encs,
			style: 'subtitles'
		});
		elchild($html, element('tr', {}, [
			element('td', {className: 'name'}, _('File encoding:')),
			element('td', {className: 'data'}, self.list.parentNode)
		]));
		this.focusList.push(self.list);
	} else {
		// we don't need name for playlist
		elchild($html, element('tr', {}, [
			element('td', {className : 'name'}, _('Name :')),
			element('td', {className : 'data'}, self.chName = element('input', {type : 'text', value : '', className : 'wide' }))
		]));
		this.focusList.push(self.chName);
	}

	elchild($html, element('tr', {}, [
		element('td', {className: 'name'}, _('URL :')),
		element('td', {className: 'data'}, self.chURL = element('input', {type: 'text', value: playListHint, className:'wide' }))
	]));

	this.focusList.push(this.chURL);
	this.focusPos = 0;
	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		self.Show(false);
	});

	this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function () {
		// wrong URL
		var arr = self.chURL.value.trim().split(' '),
			xmlhttp, income, extension, idx, baseUrl;

		if ( arr.length > 1 ) {
			for ( idx = 0; idx < arr.length; idx += 1 ) {
				if ( validateUrl(arr[idx], false, false, false) ) {
					baseUrl = arr[idx];
					break;
				}
			}
		}

		if ( !(validateUrl(self.chURL.value, true, true, false) || (arr.length > 1 && (!idx || idx === 1 && validateUrl(arr[0] + ' ' + baseUrl, true, false, false)))) ) {
			new CModalHint(self, _('Wrong field data'), 4000);
		} else {
			if ( IsItPlaylist ) {
				// read and parse playlist file
				xmlhttp = new XMLHttpRequest();
				xmlhttp.overrideMimeType('text/html; charset=' + self.list.value);
				xmlhttp.open('GET', self.chURL.value, false);
				xmlhttp.send(null);
				echo(xmlhttp.responseText, 'response from list');
//				ajax('GET', self.chURL.value, function ( income, status ) {
//				if ( status === 200 ) {
				income = xmlhttp.responseText;
				extension = self.chURL.value.substring(self.chURL.value.length - 3, self.chURL.value.length);
				income = MediaBrowser.ParsePlaylist(extension, income);
				IPTVChannels.TVList.addChannelsToList(IPTVChannels.TVList.parentItem.data, income, true);
				IPTVChannels.needSave = true;
				gSTB.SetEnv(JSON.stringify({playlist_url: self.chURL.value}));
				self.Show(false);
//				} else {
//					echo('bad file');
//					new CModalHint(self, _('Bad playlist file'), 3000);
//				}
//				}, {}, 'text');
			} else {
				// add new channel
				var in_object = [
					{name: self.chName.value, url: self.chURL.value, type: MEDIA_TYPE_STREAM }
				];
				IPTVChannels.TVList.addChannelsToList(IPTVChannels.TVList.parentItem.data, in_object, false);
				IPTVChannels.TVList.Focused(IPTVChannels.TVList.handle.children[IPTVChannels.TVList.handle.children.length-1],true);
				IPTVChannels.needSave = true;
				self.Show(false);
			}
		}
	});

	// filling
	var header = IsItPlaylist ? _('Add IPTV list') : _('Add IPTV channel');
	this.SetHeader(header);
	this.SetContent($html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		self.focusList[self.focusPos].focus();
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, 'CModalAlert') ) {
			return;
		}
		if (typeof this.focusList[this.focusPos].EventHandler === 'function') {
			this.focusList[this.focusPos].EventHandler(event);
		}
		if (event.stopped === true) {
			return;
		}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			case KEYS.LEFT:
			case KEYS.RIGHT:
//				self.list.EventHandler(event);
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalChannelsAdd.prototype = Object.create(CModalBox.prototype);
CModalChannelsAdd.prototype.constructor = CModalChannelsAdd;


///////////////////////////////////////////////////////////////////////////////


/**
 * add new playlist to IPTV Channels from operator's lists
 * @param parent
 * @class CModalImportTVChannels
 * @constructor
 */
function CModalImportTVChannels ( parent ) {
	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalImportTVChannels';

	// for limited scopes
	var self = this;

	this.step1 = new CSelectBox(this, {
		data: [{id: '', name: _('Select country...')}],
		parent: element('div'),
		events: {
			onChange: function(){
				if ( this.GetValue() ) {
					self.step2.startAction(this.GetValue());
				}
				if ( self.step3.GetValue() !== _('Select operator...') ) {
					self.step3.SetData([{id: '', name: _('Select operator...')}]);
				}
				if ( self.step2.GetValue() !==  _('Select city...') ) {
					self.step2.SetData([{id: '', name: _('Select city...')}]);
				}
			}
		}
	});

	this.step2 = new CSelectBox(this, {
		data: [{id: '', name: _('Select city...')}],
		parent: element('div'),
		events: {
			onChange: function(){
				if ( this.GetValue() ) {
					self.step3.startAction(self.step2.GetValue());
				}
			}
		}
	});

	this.step3 = new CSelectBox(this, {
		data: [{id: '', name:_('Select operator...')}],
		parent: element('div')
	});

	var html = element('table', {className: 'main maxw CModalImportTVChannels'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Country:')),
			element('td', {className: 'data'}, this.step1.parentNode)
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('City:')),
			element('td', {className: 'data'}, this.step2.parentNode)
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Operator:')),
			element('td', {className: 'data'}, this.step3.parentNode)
		])
	]);
	// navigation list
	self.focusList = [self.step1, self.step2, self.step3];

	// get country list
	ajax('GET', configuration.url.operatorsTVList + 'country/', function ( countries ) {
		countries.results.unshift({id: '', name: _('Select country...')});
		self.step1.SetData(countries.results);
	}, {}, 'json');

	// get cities list
	this.step2.startAction = function ( country_id ) {
		ajax('GET',configuration.url.operatorsTVList + 'country_cities/' + country_id, function ( cities ) {
			cities.results.unshift({id: '', name: _('Select city...')});
			self.step2.SetData(cities.results);
		}, {}, 'json');
	};


	this.step3.startAction = function ( city_id ) {
		ajax('GET', configuration.url.operatorsTVList + 'city_isp/' + city_id, function ( operators ) {
			operators.results.unshift({id: '', name:_('Select operator...')});
			self.step3.SetData(operators.results);
		}, {}, 'json');
	};


	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function () {
		// no params
		if ( !self.step3.GetValue() ) {
			// try again
			new CModalHint(self, _('Wrong field data'), 4000);
		} else {
			// read and parse file
			try {
				var value = self.step3.GetSelected().playlist;
				ajax('GET', value, function ( income ) {
					self.Show(false);
					var extencion = value.substring(value.length - 3, value.length);
					income = MediaBrowser.ParsePlaylist(extencion, income);
					IPTVChannels.TVList.addChannelsToList(IPTVChannels.TVList.parentItem.data, income, true);
				}, {}, 'text');
			} catch ( err ) {
				new CModalHint(self, _('Bad playlist file'), 4000);
			}
		}
		return false;
	});

	// filling
	this.SetHeader(_('Loading operator playlist'));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		setTimeout(function () {
			self.step1.focus();
		}, 100);
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if (typeof this.focusList[this.focusPos].EventHandler === 'function') {
			this.focusList[this.focusPos].EventHandler(event);
		}
		if (event.stopped === true) {
			return;
		}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			case KEYS.RIGHT:
			case KEYS.LEFT:
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.SetContent(html);
	this.Show(true);
}

// extending
CModalImportTVChannels.prototype = Object.create(CModalBox.prototype);
CModalImportTVChannels.prototype.constructor = CModalImportTVChannels;

/**
 * auto scan from DVB channel list
 * @param parent
 * @class CModalScanDVB
 * @constructor
 */
function CModalScanDVB ( parent ) {
	// for limited scopes
	var self = this,
		html,
		checkedType = [],
		domArr = [],
		model = gSTB.GetDeviceModelExt(),
		data, oldType, i,
		inputNumber = 0;

	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalScanDVB';

	function changeType ( input ) {
		var data = [],
			domArr = [];

		inputNumber = input ? input : inputNumber;
		checkedType = DVBChannels.inputs[inputNumber].currentScanTypes;

		for ( i = 0; i < checkedType.length; i++ ) {
			data.push({
				name: dvbTypes[checkedType[i]],
				value: checkedType[i]
			});
		}

		if ( oldType === checkedType[0] ) {

			return;
		}

		oldType = checkedType[0];

		switch ( oldType ) {
			case DVBChannels.inputs[inputNumber].TYPE_DVB_C: //DVB-C
				switch ( model ) {
					case 'IM2102':
						break;
					default:
						domArr = [
							element('tr', {}, [
								element('td', {className: 'name'}, _('Symbol rate:')),
								element('td', {className: 'data'}, self.stepSRate.parentNode)
							]),
							element('tr', {}, [
								element('td', {className: 'name'}, _('Modulation:')),
								element('td', {className: 'data'}, self.stepModul.parentNode)
							])
						];
						self.focusList = [self.stepSRate, self.stepModul];
						break;
				}
				break;

			case DVBChannels.inputs[inputNumber].TYPE_DVB_T:  //DVB-T(T2)
			case DVBChannels.inputs[inputNumber].TYPE_DVB_T2:
			case DVBChannels.inputs[inputNumber].TYPE_DVB_S2: //DVB-S2
				break;
		}

		if ( data.length > 1 ) {
			self.stepType = new CSelectBox(self, {
				data: data,
				idField: 'value',
				nameField: 'name',
				parent: element('div'),
				events: {
					onChange: function () {
						changeType();
					}
				},
				selected: checkedType[0],
				name: 'type'
			});

			domArr.unshift(element('tr', {}, [
				element('td', {className: 'name'}, _('DVB type:')),
				element('td', {className: 'data'}, self.stepType.parentNode)
			]));

			self.focusList.unshift(self.stepType);
		}

		if ( DVBChannels.inputs.length > 1 ) {
			domArr.splice(0, 0, element('tr', {}, [
					element('td', {className: 'name'}, _('Antenna') + ':'),
					element('td', {className: 'data'}, self.stepAntenna.parentNode)
				])
			);
			self.focusList.splice(0, 0, self.stepAntenna);
		}
		html = element('table', {className: 'main maxw CModalScanDVB'}, domArr);
		self.SetContent(html);
		if ( self.focusList.length ) {
			self.focusList[0].focus();
		}
	}

	if ( DVBChannels.inputs.length > 1 ) {
		data = [];
		for ( var i = 0; i < DVBChannels.inputs.length; i++ ) {
			data.push({value: i, name: _('Antenna') + ' ' + (i + 1)});
		}
		this.stepAntenna = new CSelectBox(this, {
			data: data,
			idField: 'value',
			nameField: 'name',
			parent: element('div'),
			events: {
				onChange: function () {
					changeType(this.GetValue());
				}
			},
			selected: 0
		});
	}

	this.stepSRate = new CIntervalBox(SettingsPage, {
		parent: element('div'),
		max: 7200,
		min: 870,
		interval: 1,
		value: 6875,
		style: 'elements'
	});

	this.stepModul = new CSelectBox(this, {
		data: [
			{
				value: 0,
				name: _('Auto')
			},
			{
				value: 1,
				name: '16 QAM'
			},
			{
				value: 2,
				name: '32 QAM'
			},
			{
				value: 3,
				name: '64 QAM'
			},
			{
				value: 4,
				name: '128 QAM'
			},
			{
				value: 5,
				name: '256 QAM'
			}
		],
		idField: 'value',
		nameField: 'name',
		parent: element('div'),
		events: {
			onChange: function () {
			}
		},
		selected: 0
	});

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Scan'), function () {
		var type,
			config = {};

		if ( self.stepType ) {
			config.type = type = self.stepType.GetValue();
		} else {
			config.type = type = checkedType[0];
		}

		switch ( type ) {
			case DVBChannels.inputs[inputNumber].TYPE_DVB_C:
				switch ( model ) {
					case 'IM2102':
						break;
					default:
						config.symbolRate = self.stepSRate.GetValue() * 1000;
						config.modulation = self.stepModul.GetValue();
						break;
				}
				config.scanMode = 0;
				config.networkId = 0;
			default:
				DVBChannels.startScan(config, inputNumber);
				break;
		}
		self.Show(false);
		return false;
	});

	// filling
	this.SetHeader(_('Start scanning'));
	changeType();
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		setTimeout(function () {
			if ( self.focusList.length ) {
				self.focusList[0].focus();
			}
		}, 100);
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( this.focusList[this.focusPos] && typeof this.focusList[this.focusPos].EventHandler === 'function' ) {
			this.focusList[this.focusPos].EventHandler(event);
		}
		if ( event.stopped === true ) {
			return;
		}
		switch ( event.code ) {
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalScanDVB.prototype = Object.create(CModalBox.prototype);
CModalScanDVB.prototype.constructor = CModalScanDVB;

/**
 * manual scan from DVB channel list
 * @param parent
 * @class CModalScanDVB
 * @constructor
 */
function CModalManualScanDVB ( parent ) {
	var self = this,
		model = gSTB.GetDeviceModelExt(),
		checkedType = [],
		domArr = [],
		data, oldType,
		inputNumber = 0;

	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalManualScanDVB';


	function changeType ( input ) {
		var data = [],
			html,
			domArr = [];

		inputNumber = input ? input : inputNumber;
		checkedType = DVBChannels.inputs[inputNumber].currentScanTypes;

		for ( i = 0; i < checkedType.length; i++ ) {
			data.push({
				name: dvbTypes[checkedType[i]],
				value: checkedType[i]
			});
		}

		if ( oldType === checkedType[0] ) {
			return;
		}

		oldType = checkedType[0];

		switch ( oldType ) {
			case DVBChannels.inputs[inputNumber].TYPE_DVB_C: //DVB-C
				switch ( model ) {
					case 'IM2102':
						domArr = [
							element('tr', {}, [
								element('td', {className: 'name'}, _('Frequency (KHz):')),
								element('td', {className: 'data'}, self.stepFreq.parentNode)
							])
						];
						self.focusList = [self.stepFreq];
						break;
					default:
						domArr = [
							element('tr', {}, [
								element('td', {className: 'name'}, _('Frequency (KHz):')),
								element('td', {className: 'data'}, self.stepFreq.parentNode)
							]),
							element('tr', {}, [
								element('td', {className: 'name'}, _('Symbol rate:')),
								element('td', {className: 'data'}, self.stepSRate.parentNode)
							]),
							element('tr', {}, [
								element('td', {className: 'name'}, _('Modulation:')),
								element('td', {className: 'data'}, self.stepModul.parentNode)
							]),
							element('tr', {}, [
								element('td', {className: 'name'}, _('Network ID:')),
								element('td', {className: 'data'}, self.stepNetId)
							])
						];
						self.focusList = [self.stepFreq, self.stepSRate, self.stepModul, self.stepNetId];
						break;
				}

				break;

			case DVBChannels.inputs[inputNumber].TYPE_DVB_T:  //DVB-T(T2)
			case DVBChannels.inputs[inputNumber].TYPE_DVB_T2:
				domArr = [
					element('tr', {}, [
						element('td', {className: 'name'}, _('DVB type:')),
						element('td', {className: 'data'}, self.stepType.parentNode)
					]),
					element('tr', {}, [
						element('td', {className: 'name'}, _('Frequency (KHz):')),
						element('td', {className: 'data'}, self.stepFreq.parentNode)
					]),
					element('tr', {}, [
						element('td', {className: 'name'}, _('Bandwidth (MHz):')),
						element('td', {className: 'data'}, self.stepBand.parentNode)
					])
				];
				self.focusList = [self.stepType, self.stepFreq, self.stepBand];
				break;

			case DVBChannels.inputs[inputNumber].TYPE_DVB_S2: //DVB-S2
				domArr = [
					element('tr', {}, [
						element('td', {className: 'name'}, _('Frequency from(KHz):')),
						element('td', {className: 'data'}, self.stepFreqFrom.parentNode)
					]),
					element('tr', {}, [
						element('td', {className: 'name'}, _('Frequency to(KHz):')),
						element('td', {className: 'data'}, self.stepFreqTo.parentNode)
					])

				];
				self.focusList = [self.stepFreqFrom, self.stepFreqTo];
				break;
		}

		if ( data.length > 1 ) {
			self.stepType = new CSelectBox(self, {
				data: data,
				idField: 'value',
				nameField: 'name',
				parent: element('div'),
				events: {
					onChange: function () {
						changeType();
					}
				},
				selected: checkedType[0],
				name: 'type'
			});

			domArr.unshift(element('tr', {}, [
				element('td', {className: 'name'}, _('DVB type:')),
				element('td', {className: 'data'}, self.stepType.parentNode)
			]));

			self.focusList.unshift(self.stepType);
		}

		if ( DVBChannels.inputs.length > 1 ) {
			domArr.splice(0, 0, element('tr', {}, [
					element('td', {className: 'name'}, _('Antenna') + ':'),
					element('td', {className: 'data'}, self.stepAntenna.parentNode)
				])
			);
			self.focusList.splice(0, 0, self.stepAntenna);
		}
		html = element('table', {className: 'main maxw CModalScanDVB'}, domArr);
		self.SetContent(html);
		if ( self.focusList.length ) {
			self.focusList[0].focus();
		}
	}

	if ( DVBChannels.inputs.length > 1 ) {
		data = [];
		for ( var i = 0; i < DVBChannels.inputs.length; i++ ) {
			data.push({value: i, name: _('Antenna') + ' ' + (i + 1)});
		}
		this.stepAntenna = new CSelectBox(this, {
			data: data,
			idField: 'value',
			nameField: 'name',
			parent: element('div'),
			events: {
				onChange: function () {
					changeType(this.GetValue());
				}
			},
			selected: 0
		});
	}

	this.stepFreq = new CIntervalBox(SettingsPage, {
		parent: element('div'),
		max: 860000,
		min: 50000,
		interval: 500,
		value: CModalManualScanDVBtext,
		style: 'elements'
	});

	this.stepFreqFrom = new CIntervalBox(SettingsPage, {
		parent: element('div'),
		max: 12750000,
		min: 10700000,
		interval: 1000,
		value: CModalManualScanDVBtext,
		events: {
			onChange: function () {
				if ( this.GetValue() > self.stepFreqTo.GetValue() ) {
					self.stepFreqTo.SetValue(this.GetValue());
				}
			}
		},
		style: 'elements'
	});

	this.stepFreqTo = new CIntervalBox(SettingsPage, {
		parent: element('div'),
		max: 12750000,
		min: 10700000,
		interval: 1000,
		value: CModalManualScanDVBtext,
		events: {
			onChange: function () {
				if ( this.GetValue() < self.stepFreqFrom.GetValue() ) {
					self.stepFreqFrom.SetValue(this.GetValue());
				}
			}
		},
		style: 'elements'
	});

	this.stepBand = new CSelectBox(this, {
		data: [
			{id: 6, name: '6'},
			{id: 7, name: '7'},
			{id: 8, name: '8'}
		],
		idField: 'id',
		nameField: 'name',
		parent: element('div'),
		events: {
			onChange: function () {
			}
		},
		selected: 7
	});

	this.stepSRate = new CIntervalBox(SettingsPage, {
		parent: element('div'),
		max: 7200,
		min: 870,
		interval: 1,
		value: 6875,
		style: 'elements'
	});

	this.stepModul = new CSelectBox(this, {
		data: [
			{
				value: 0,
				name: _('Auto')
			},
			{
				value: 1,
				name: '16 QAM'
			},
			{
				value: 2,
				name: '32 QAM'
			},
			{
				value: 3,
				name: '64 QAM'
			},
			{
				value: 4,
				name: '128 QAM'
			},
			{
				value: 5,
				name: '256 QAM'
			}
		],
		idField: 'value',
		nameField: 'name',
		parent: element('div'),
		events: {
			onChange: function () {
			}
		},
		selected: 0
	});

	this.stepNetId = element('input', {type: 'text'});

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Scan'), function () {
		var type,
			config = {};

		if ( self.stepType ) {
			config.type = type = self.stepType.GetValue();
		} else {
			config.type = type = checkedType[0];
		}

		switch ( type ) {
			case DVBChannels.inputs[inputNumber].TYPE_DVB_C:
				switch ( model ) {
					case 'IM2102':
						config.networkId = 0;
						break;
					default:
						config.symbolRate = self.stepSRate.GetValue() * 1000;
						config.modulation = self.stepModul.GetValue();
						config.networkId = parseInt(self.stepNetId.value) || 0;
						break;
				}

				config.scanMode = 2;
				config.frequency = self.stepFreq.GetValue();
				DVBChannels.startScan(config, inputNumber);
				break;
			case DVBChannels.inputs[inputNumber].TYPE_DVB_T:
			case DVBChannels.inputs[inputNumber].TYPE_DVB_T2:
				CModalManualScanDVBtext = self.stepFreq.GetValue();
				config.from = config.to = CModalManualScanDVBtext;
				config.bandwidth = self.stepBand.GetValue();
				config.step = 1000;
				DVBChannels.startScan(config, inputNumber);
				break;
			case DVBChannels.inputs[inputNumber].TYPE_DVB_S:
			case DVBChannels.inputs[inputNumber].TYPE_DVB_S2:
				CModalManualScanDVBtext = self.stepFreqFrom.GetValue();
				config.from = CModalManualScanDVBtext;
				if ( self.stepFreqFrom.GetValue() > self.stepFreqTo.GetValue() ) {
					new CModalHint(self, _('Wrong field data'), 4000);
					return;
				}
				config.to = self.stepFreqTo.GetValue();
				DVBChannels.startScan(config, inputNumber);
				break;
		}
		self.Show(false);
		return false;
	});

	// filling
	this.SetHeader(_('Start scanning'));
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		setTimeout(function () {
			if ( self.focusList.length ) {
				self.focusList[0].focus();
			}
		}, 100);
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( this.focusList[this.focusPos] && typeof this.focusList[this.focusPos].EventHandler === 'function' ) {
			this.focusList[this.focusPos].EventHandler(event);
		}

		if ( event.stopped === true ) {
			return;
		}

		switch ( event.code ) {
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	//this.SetContent(html);
	changeType();
	this.Show(true);
}

// extending
CModalManualScanDVB.prototype = Object.create(CModalBox.prototype);
CModalManualScanDVB.prototype.constructor = CModalManualScanDVB;


/**
 * init epg info
 * @param parent
 * @param {number} id channel
 * @class CModalInitEPGInfo
 * @constructor
 */
function CModalInitEPGInfo ( parent, id ) {
	var data, up, down;

	this.day = 0;
	this.id = id;
	//TODO remove this try catch when dvbManager will be fixed
	try {
		data = dvbManager.GetEPGSchedule(this.id, this.day);
	} catch (e) {
		data = '{}';
		echo(e.message);
	}
	echo(data,'epg shedule');
	if ( data === '' || data === '{}' ) {
		new CModalHint(currCPage, _('EPG not available'), 3000);
		return;
	}
	try{
		data = JSON.parse(data);
	} catch(e){
		data = {};
		data.events = [];
		echo(e,'EPG parse error');
	}
	if( !data.events || data.events.length === 0 ) {
		new CModalHint(currCPage, _('EPG not available'), 3000);
		return;
	}
	// parent constructor
	CModalBox.call(this, parent);
	var date = new Date();

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalInitEPGInfo';

	// for limited scopes
	var self = this;
	this.EventHandler = function ( event ) {
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
			case KEYS.DOWN:
				self.EPGList.EventHandler(event);
				event.preventDefault();
				break;
			case KEYS.RIGHT:
				event.preventDefault();
				self.changeDay(1);
				break;
			case KEYS.LEFT:
				event.preventDefault();
				self.changeDay(-1);
				break;
			case KEYS.PAGE_DOWN:
				self.domText.scrollTop += self.domText.offsetHeight;
				event.preventDefault();
				break;
			case KEYS.PAGE_UP:
				self.domText.scrollTop -= self.domText.offsetHeight;
				event.preventDefault();
				break;
			case KEYS.INFO:
			case KEYS.EPG:
			case KEYS.EXIT:
				self.Show(false);
				break;
		}
	};

	this.changeDay = function( a ){
		var data;

		this.day +=a;
		if(this.day < 0){
			this.day = 0;
		}
		var date = new Date();
		var time = date.getTime();
		date.setTime(time+this.day*86400000);
		this.domDay.innerHTML = date.getDate()+' '+fullMonthNames[date.getMonth()];
		//TODO remove this try catch when dvbManager will be fixed
		try {
			data = dvbManager.GetEPGSchedule(this.id, this.day);
		} catch (e) {
			data = '';
			echo(e.message);
		}
		if ( data === '' || data === '{}' ) {
			this.EPGList.Clear();
			return;
		}
		try {
			data = JSON.parse(data);
		} catch(e){
			this.EPGList.Clear();
			data = {};
			data.events = [];
			echo(e,'EPG parse error');
		}
		if ( !data.events || data.events.length === 0 ){
			this.EPGList.Clear();
			return;
		}
		this.EPGList.data = data.events;
		this.EPGList.Open({type: MEDIA_TYPE_EPG_ROOT});
	};

	this.Init();
	this.handle.querySelector('.cmodal-body').className += ' '+this.name;
	elchild(this.handle.querySelector('.cmodal-content'),[
		element('div',{className : 'header'},[
			element('div',{className:'left'},_('The program for:')),
			element('a',{},[
				element('div',{className : 'day_left'})
			]),
			this.domDay = element('div',{className:'left'},date.getDate()+' '+fullMonthNames[date.getMonth()]),
			element('a',{},[
				element('div',{className : 'day_right'})
			])
		]),
		this.domList = element('div',{className:'list'}),
		element('div',{className: 'rightBlock'}, [
			up = element('div',{className:'textUp'}),
			this.domText = element('div',{className:'text'}),
			down = element('div',{className:'textDown'})
		])

	]);
	if ( configuration.newRemoteControl || true ) {
		up.style.backgroundImage = 'url(' + PATH_IMG_SYSTEM + 'buttons/new/pgup.png)';
		down.style.backgroundImage = 'url(' + PATH_IMG_SYSTEM + 'buttons/new/pgdown.png)';
	}
	this.EPGList = new EPGList(this);
	this.EPGList.Init(this.domList);
	this.EPGList.data = data.events;
	this.onHide = function () {
		self.Free();
	};

	this.Show(true);
	this.EPGList.Open({type: MEDIA_TYPE_EPG_ROOT});
}

// extending
CModalInitEPGInfo.prototype = Object.create(CModalBox.prototype);
CModalInitEPGInfo.prototype.constructor = CModalInitEPGInfo;

/**
 * init epg info without list
 * @param parent
 * @param {number} id channel
 * @class CModalEPGInfo
 * @constructor
 */
function CModalEPGInfo ( parent, data ) {
	var date,
		self = this;

	// parent constructor
	CModalBox.call(this, parent);
	date = new Date();

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalEPGInfo';

	this.EventHandler = function ( event ) {
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.PAGE_DOWN:
				self.domText.scrollTop += self.domText.offsetHeight;
				event.preventDefault();
				break;
			case KEYS.PAGE_UP:
				self.domText.scrollTop -= self.domText.offsetHeight;
				event.preventDefault();
				break;
			case KEYS.UP:
				self.domText.scrollTop -= 100;
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.domText.scrollTop += 100;
				event.preventDefault();
				break;
			case KEYS.OK:
			case KEYS.EXIT:
				self.Show(false);
				break;
		}
	};

	this.Init();
	this.handle.querySelector('.cmodal-body').className += ' '+this.name;
	elchild(this.handle.querySelector('.cmodal-content'),[
		element('div',{className: 'rightBlock'}, [
			this.domText = element('div',{className:'text'})
		])

	]);
	this.domText.innerHTML = data.info + (data.details? '<p>' + data.details + '</p>' : '');
	this.Show(true);
}

// extending
CModalEPGInfo.prototype = Object.create(CModalBox.prototype);
CModalEPGInfo.prototype.constructor = CModalEPGInfo;

/**
 * @class EPGList
 * @constructor
 */
function EPGList(parent) {
	// parent constructor
	CScrollList.call(this, parent);

	this.data = [];
}

// extending
EPGList.prototype = Object.create(CScrollList.prototype);
EPGList.prototype.constructor = EPGList;


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
EPGList.prototype.SetBreadCrumb = function (component) {
	this.bcrumb = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
EPGList.prototype.SetSearchBar = function (component) {
	this.sbar = component;
};


/**
 * Create new item and put it in the list
 * @param {string} obj item label
 * @param {Object} attrs set of item data parameters
 * @return {Node}
 */
EPGList.prototype.Add = function (obj, attrs) {
	var date = new Date(obj.time*1000),
		h = date.getHours(),
		m = date.getMinutes();
	h = h>9?h:'0'+h;
	m = m>9?m:'0'+m;
	var body = element('div', {className: 'item'}, [element('b',{},h+':'+m), ' '+obj.name]);
	// decoration
	// make sure name is set
	if (!attrs.name) {
		attrs.name = obj.name;
	}
	// actual filling
	var item = CScrollList.prototype.Add.call(this, [body], {
		star: false,
		data: attrs,
		// handlers
		onclick: function () {
			return false;
		},
		oncontextmenu: EMULATION ? null : function () {
			return false;
		}
	});
	return item;
};

/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 */
EPGList.prototype.onFocus = function (item) {
	this.parent.domText.innerHTML = (this.data[item.data.index].details?this.data[item.data.index].details:this.data[item.data.index].info);
};


/**
 * Move one level up
 */
EPGList.prototype.Back = function () {};

/**
 * Enter the item or open it
 * @param {Object} data media item inner data
 */
EPGList.prototype.Open = function (data) {
	if ( data.type !== MEDIA_TYPE_EPG_ROOT ) {
		return;
	}
	this.Clear();
	for (var i = 0; i < this.data.length; i++) {
		var item = this.Add({name: this.data[i].name, index: i, time : this.data[i].start}, {name: this.data[i].name, markable: false, index: i});
		if( this.parent.epgNow && this.parent.epgNow.now.length && this.parent.day === 0 && this.data[i].start === this.parent.epgNow.now[0].start || i === 0 ){
			this.Focused(item,true);
		}
	}
	if ( this.isActive ) {
		this.Activate();
	}
	echo(this.data[this.activeItem.data.index]);
	this.parent.domText.innerHTML = (this.data[this.activeItem.data.index].details?this.data[this.activeItem.data.index].details : this.data[this.activeItem.data.index].info);
};

/**
 * Moves the cursor to the given element
 * @param {Object} data
 * @return {boolean} operation status
 */
EPGList.prototype.SetPosition = function (data) {
	if (data) {
		for (var item, i = 0, l = this.Length(); i < l; i++) {
			item = this.handleInner.children[i];
			// url and type match
			if (data.index === item.data.index) {
				return this.Focused(item, true);
			}
		}
	}
	return false;
};

/**
 * Handle checked state for the given item according to the file type.
 * Mark only items available for marking.
 * @return {boolean} operation status
 */
EPGList.prototype.Marked = function () {
	return false;
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
EPGList.prototype.ActiveItems = function () {
	// get all marked items
	var items = this.states.marked ? this.states.marked.slice() : [];
	// no marked, check current and its type
	if (items.length === 0 && this.activeItem && this.activeItem.data.markable) {
		items.push(this.activeItem);
	}
	return items;
};


/**
 * set antenna power for DVB
 * @param [CPage] parent
 * @param [number] input number of antenna
 * @class CModalScanDVB
 * @constructor
 */
function CModalAntennaPower ( parent, input ) {
	// for limited scopes
	var self = this,
		html, data;
	// parent constructor
	CModalBox.call(this, parent);

	this.name = 'CModalAntennaPower';

	//powerOn = dvbManager.GetAntennaPower(input);

	DVBChannels.inputs[input].currentScanTypes;

	this.focusList = [];
	this.focusPos = 0;
	if ( data[0] === 2 || data[0] === 3 ) {
		this.step1 = new CCheckBox(this, {
			parent: element('div', {className: 'control'}),
			checked: dvbManager.GetAntennaPower(input)
		});
		html = element('table', {className: 'main maxw CModalScanDVB'}, [
			element('tr', {}, [
				element('td', {className: 'name'}, _('DVB type:')),
				element('td', {className: 'data'}, data[0].name)
			]),
			element('tr', {}, [
				element('td', {className: 'name'}, _('Antenna power supply')+':'),
				element('td', {className: 'data'}, this.step1.handle)
			])
		]);
		this.focusList = [this.step1];
	} else {
		html = element('table', {className: 'main maxw CModalScanDVB'}, [
			element('tr', {}, [
				element('td', {className: 'name'}, _('DVB type:')),
				element('td', {className: 'data'}, data[0])
			])
		]);
	}




	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function () {
		DVBChannels.inputs[input].antennaPower = self.step1.IsChecked();
		self.Show(false);
		return false;
	});


	this.onShow = function () {
		setTimeout(function () {
			if ( self.step1 ) {
				self.step1.focus();
			}
		}, 100);
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		event.preventDefault();
		if ( this.focusList.length && typeof this.focusList[this.focusPos].EventHandler === 'function' ) {
			this.focusList[this.focusPos].EventHandler(event);
		}
		if (event.stopped === true) {
			return;
		}
		switch ( event.code ) {
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.SetHeader(_('Antenna') + ' ' + (input+1));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);
	this.Show(true);
}

// extending
CModalAntennaPower.prototype = Object.create(CModalBox.prototype);
CModalAntennaPower.prototype.constructor = CModalAntennaPower;

/**
 * select program to play
 * @param parent
 * @constructor
 */
function CModalStartPlay ( parent ) {
	// parent constructor
	CModalBox.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalStartPlay';

	// for limited scopes
	var self = this,
		domArr,
		data,
		max = 9999999,
		min = 1;


	this.step1 = new CIntervalBox(SettingsPage, {
		parent: element( 'div'),
		max: max,
		min: min,
		interval: 1,
		value: min,
		style: 'elements'
	});

	this.focusList = [this.step1];

	domArr = [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Program number:')),
			element('td', {className: 'data'}, this.step1.parentNode)
		])
	];

	var html = element('table', {className: 'main maxw CModalScanDVB'}, domArr);



	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Scan'), function () {
		var program = self.step1.GetValue();
		self.Show(false);

		MediaBrowser.FileList.fileBrowser.open(MediaBrowser.FileList.activeItem.data, null, {program: program});
	});

	// filling
	this.SetHeader(_('Select program'));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		setTimeout(function () {
			self.focusList[0].focus();
		}, 100);
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if (typeof this.focusList[this.focusPos].EventHandler === 'function'){
			this.focusList[this.focusPos].EventHandler(event);
		}
		if (event.stopped === true) {
			return;
		}
		switch ( event.code ) {
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.SetContent(html);
	this.Show(true);
}

// extending
CModalStartPlay.prototype = Object.create(CModalBox.prototype);
CModalStartPlay.prototype.constructor = CModalStartPlay;

/**
 * set antenna power for DVB
 * @param [CPage] parent
 * @param [number] input number of antenna
 * @class CModalScanDVB
 * @constructor
 */
function CModalAntennaPower ( parent, input ) {
	// for limited scopes
	var self = this,
		html, data;
	// parent constructor
	CModalBox.call(this, parent);

	this.name = 'CModalAntennaPower';

	//powerOn = dvbManager.GetAntennaPower(input);

	data = input.currentScanTypes;
	// try{
	// 	data = JSON.parse( dvbManager.GetCurrentScanTypes(input) );
	// } catch(e){
	// 	echo(e,'GetCurrentScanTypes parse error');
	// }

	this.focusList = [];
	this.focusPos = 0;
	if ( input.capabilities.antennaPower ) {
		this.step1 = new CCheckBox(this, {
			parent: element('div', {className: 'control'}),
			checked: input.antennaPower
		});
		html = element('table', {className: 'main maxw CModalScanDVB'}, [
			element('tr', {}, [
				element('td', {className: 'name'}, _('DVB type:')),
				element('td', {className: 'data'}, dvbTypes[data[0] || 0])
			]),
			element('tr', {}, [
				element('td', {className: 'name'}, _('Antenna power supply')+':'),
				element('td', {className: 'data'}, this.step1.handle)
			])
		]);
		this.focusList = [this.step1];
	} else {
		html = element('table', {className: 'main maxw CModalScanDVB'}, [
			element('tr', {}, [
				element('td', {className: 'name'}, _('DVB type:')),
				element('td', {className: 'data'}, dvbTypes[data[0] || 0])
			])
		]);
	}




	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		// hide and destroy
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Save'), function () {
		input.antennaPower = self.step1.IsChecked();
		self.Show(false);
		return false;
	});


	this.onShow = function () {
		setTimeout(function () {
			if ( self.step1 ) {
				self.step1.focus();
			}
		}, 100);
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		event.preventDefault();
		if ( this.focusList.length && typeof this.focusList[this.focusPos].EventHandler === 'function' ) {
			this.focusList[this.focusPos].EventHandler(event);
		}
		if (event.stopped === true) {
			return;
		}
		switch ( event.code ) {
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.SetHeader(_('Antenna') + ' ' + (input+1));
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);
	this.Show(true);
}

// extending
CModalAntennaPower.prototype = Object.create(CModalBox.prototype);
CModalAntennaPower.prototype.constructor = CModalAntennaPower;
