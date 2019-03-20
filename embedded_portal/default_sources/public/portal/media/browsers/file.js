/**
 * File browser for all types of files except upnp nodes
 *
 * @author Igor Zaporozhets <deadbyelpy@gmail.com>
 */

'use strict';

(function () {
	var routes = {},
		textFilter = '',
		typeFilter = MEDIA_TYPE_NONE,
		listLink,
		content;

	function pushContent (attrs) {
		var textOk, typeOk;

		// is it necessary to filter
		if ( textFilter || typeFilter !== MEDIA_TYPE_NONE ) {
			// check file name if regular file
			textOk = (attrs.name && attrs.name.toLowerCase().indexOf(textFilter.toLowerCase()) !== -1);
			// check file type if regular file
			typeOk = attrs.type === typeFilter || typeFilter === MEDIA_TYPE_NONE;
			// hide not matching items
			if ( !(textOk && typeOk) ) {
				return;
			}
		}

		// fill file list to play
		if ( listLink.parent.playable.indexOf(attrs.type) !== -1 ) {
			// allow only playable media types
			listLink.playList.push(attrs);
			listLink.playListSet = false;
		} else if ( attrs.type === MEDIA_TYPE_TEXT ) {
			// allow only subtitles
			listLink.subList.push(attrs);
			listLink.playListSet = false;
		}

		// collect all media types on the current level (for filtering)
		if ( listLink.mtypes.indexOf(attrs.type) === -1 ) {
			listLink.mtypes.push(attrs.type);
		}
		content.push(attrs);
	}

	function openError () {
		new CModalAlert(listLink.parent, _('Error'), _('Unknown type of selected item'), _('Close'));
	}

	/**
	 * Sorts the file data
	 * @param {[Object]} list array of file objects (dirs or files)
	 * @param {number} sortType sorting method
	 * @return {[Object]} list of sorted files
	 */
	function fileSort( list, sortType ) {
		list = list || [];
		// check input
		if ( Array.isArray(list) && list.length > 0 ) {
			// case insensitive sort by name
			list.sort(function(a, b){ return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });

			// additional sorting
			if ( sortType === MEDIA_ACTION_SORT_TYPE && list[0].type !== undefined ) {
				list.sort(function(a, b){ return a.type - b.type; });
			} else if ( sortType === MEDIA_ACTION_SORT_EXT && list[0].ext !== undefined ) {
				list.sort(function(a, b){ return a.ext.toLowerCase().localeCompare(b.ext.toLowerCase()); });
			} else if ( sortType === MEDIA_ACTION_SORT_SIZE && list[0].size !== undefined ) {
				list.sort(function(a, b){ return a.size - b.size; });
			}
		}
		return list;
	}

	function listDir ( path ) {
		// result list
		var //self = this,
			dirs = [],
			files = [],
			data = { dirs : [], files : [], url: path},
			result;
		// check input
		console.log('listDir: ' + path);
		if ( path !== undefined && path !== '' ) {
			// get ListDir result string and remove vars for eval
			result = gSTB.ListDir( path, false );
			// if strict mode is enforced remove vars from eval code
			if ( MediaBrowser.isStrictMode ) {
				result = result.replace( 'var dirs = [', 'dirs = [' ).replace( 'var files = [' , 'files = [' );
			}
			try {
				eval(result);
			} catch ( e ) {
				echo(e);
				dirs = [];
				files = [];
			}
			// fill list of dirs
			if ( Array.isArray(dirs) && dirs.length > 0 ) {
				// clear from empty items
				dirs = dirs.filter(function(dir){ return dir !== ''; });
				// fill dirs
				dirs.forEach(function(dir){
					// strip ending slash
					dir = dir.slice(0, -1);
					// valid filled name
					if ( dir ) {
						data.dirs.push({name:dir, type:MEDIA_TYPE_FOLDER});
					}
				});
			}
			// fill list of files
			if ( Array.isArray(files) && files.length > 0 ) {
				// clear from empty items
				files = files.filter(function(file){ return file.name !== undefined; });
				// add file types
				files.forEach(function(file){
					file.ext  = file.name.split('.').pop();
					file.type = listLink.ext2type[file.ext.toLowerCase()];
				});
				data.files = files;
			}
		}
		return data;
	}

	/**
	 * Opem root of the home media
	 * @param {Object} [data] media item inner data
	 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
	 */
	function openRoot ( data, level ) {
		// show "Records" virtual folder?
		var isRecords = false,
			i, len;

		// allow to go back in filter
		if ( textFilter ) {
			content.push({name: '..', type:MEDIA_TYPE_BACK});
		}

		// main net items if there is net
		if ( CURRENT_NETWORK_STATE ) {
			pushContent({name: _('Network'), markable:false, readOnly:true, type:MEDIA_TYPE_SAMBA_ROOT});
			// check if upnp activated
			if ( environment.upnp_conf !== '' && environment.upnp_conf !== 'off' ) {
				if ( window.stbUPnP && window.stbUPnP.getServerListSync ) {
					if ( !window.UPnPBrowser.ready ) {
						window.UPnPBrowser.init(listLink);
					}
					pushContent({name: 'UPnP', markable: false, readOnly: true, url: '/UPnP', type:MEDIA_TYPE_UPNP_ROOT});
				} else {
					pushContent({name: 'UPnP', markable:false, readOnly:true, url:PATH_MEDIA + 'UPnP', type: MEDIA_TYPE_UPNP});
				}
			}
		}
		// check "records" dir on each storage
		STORAGE_INFO.forEach(function(item){ if ( gSTB.IsFolderExist(item.mountPath+'/records') ) { isRecords = true; } });

		// timeshift + pvr
		if ( isRecords ) {
			pushContent({name: _('Records'), markable:false, readOnly:true, type:MEDIA_TYPE_RECORDS_ROOT});
		}
		// user defined set of files
		pushContent({name: _('Favorites'), markable:false, readOnly:true, type:MEDIA_TYPE_FAVORITES});

		// usb
		for ( i = 0, len = STORAGE_INFO.length; i < len; ++i ) {
			pushContent({name: STORAGE_INFO[i].label, markable:false, readOnly:Boolean(STORAGE_INFO[i].isReadOnly), url:STORAGE_INFO[i].mountPath, size:STORAGE_INFO[i].size, free:STORAGE_INFO[i].freeSize, type:STORAGE_INFO[i].mediaType, fsType:STORAGE_INFO[i].fsType});
		}

		// main net items if there is net
		if ( CURRENT_NETWORK_STATE ) {
			// net smb shares
			for ( i = 0, len = SMB_ARRAY.length; i < len; ++i ) {
				pushContent({name: SMB_ARRAY[i].local, markable:false, readOnly:true, url:SMB_PATH, address:'//'+SMB_ARRAY[i].url+'/'+SMB_ARRAY[i].folder, link:SMB_ARRAY[i], type:MEDIA_TYPE_SAMBA_SHARE});
			}

			for ( i = 0, len = NFS_ARRAY.length; i < len; ++i ) {
				pushContent({name: NFS_ARRAY[i].local, markable:false, readOnly:true, url:NFS_PATH, address:NFS_ARRAY[i].url+':'+NFS_ARRAY[i].folder, link:NFS_ARRAY[i], type:MEDIA_TYPE_NFS_SHARE});
			}

		}
		listLink.total = content.length;
		listLink.onLevelChange(data, content, level);
	}


	/**
	 * Open previous (by path) complex item
	 *
	 */
	function openBack () {
		echo('openBack');
		// there are some levels
		if ( listLink.path.length > 1 ) {
			// exiting from favs and there are some changes
			if ( listLink.mode === MEDIA_TYPE_FAVORITES && FAVORITES_CHANGED ) {
				// ask to save changes of reset
				new CModalConfirm(listLink.parent,
					_('The list of favourite records has changed'),
					_('Save updated list of favourite records?'),
					_('Exit without saving'),
					function () {
						listLink.parent.FavRestore();
						listLink.Open({type: MEDIA_TYPE_BACK});
					},
					_('Save'),
					function () {
						listLink.parent.FavSave();
						listLink.Open({type: MEDIA_TYPE_BACK});
					}
				);
				return;
			}

			if ( listLink.bcrumb ) {
				listLink.bcrumb.Pop();
			}
			// normal exit
			listLink.path.pop();
			textFilter = listLink.path[listLink.path.length-1].filterText ? listLink.path[listLink.path.length-1].filterText : '';
			typeFilter = MEDIA_TYPE_NONE;
			FileBrowser.open(listLink.path[listLink.path.length-1], listLink.LEVEL_CHANGE_UP);
		}
	}

	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openSambaRoot ( data, level ) {
		var groups = null;

		try {
			groups = JSON.parse(gSTB.GetSmbGroups());
			echo(groups, 'gSTB.GetSmbGroups');
		} catch ( e ) { echo(e); }
		// some data received
		if ( groups && Array.isArray(groups.result) && groups.result.length > 0 ) {
			// ok
			content.push({name: '..', type:MEDIA_TYPE_BACK});
			groups.result.forEach(function(group){
				if ( !group ) {
					return;
				}
				pushContent({markable:false, readOnly:data.readOnly, name:group, url:group, type:MEDIA_TYPE_SAMBA_GROUP});
			});
			// go deeper
			listLink.total = content.length;
			listLink.onLevelChange(data, content, level);
		} else {
			// different failures
			new CModalAlert(listLink.parent, _('Error'), _('Unable to get working group list') + /*(groups.errMsg ? ':<br>'+groups.errMsg :*/ '.'/*)*/,
				_('Close'), function(){ setTimeout(function(){listLink.Activate(true);}, 5); });
		}
	}

	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openSambaGroup ( data, level ) {
		var servers = null;
		try {
			servers = JSON.parse(gSTB.GetSmbServers(JSON.stringify({group:data.name})));
			echo(servers, 'gSTB.GetSmbServers');
		} catch ( e ) { echo(e); }
		// some data received
		if ( servers && Array.isArray(servers.result) && servers.result.length > 0 ) {
			// ok
			content.push({name: '..', type:MEDIA_TYPE_BACK});
			servers.result.forEach(function( server ){
				if ( !server ) {
					return;
				}
				pushContent({markable:false, readOnly:data.readOnly, name:server, url:data.url+'/'+server, type:MEDIA_TYPE_SAMBA_HOST});
			});
			// go deeper
			listLink.total = content.length;
			listLink.onLevelChange(data, content, level);
		} else {
			// different failures
			new CModalAlert(listLink.parent, _('Error'), _('Unable to get working group servers') + /*(servers.errMsg ? ':<br>'+servers.errMsg :*/ '.'/*)*/,
				_('Close'), function(){ setTimeout(function(){listLink.Activate(true);}, 5); });
		}
	}

	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 * @param {number} level
	 */
	function openSambaHost ( data, level ) {
		var shares = null,
			smbStoreAuth = SMB_SRV_AUTH[data.url],
			modalAuth, currFocus;

		try {
			if ( smbStoreAuth ) {
				// try to open server with auth data
				shares = JSON.parse(gSTB.GetSmbShares(JSON.stringify({server: data.name, login: smbStoreAuth.login, password: smbStoreAuth.password})));
			} else {
				shares = JSON.parse(gSTB.GetSmbShares(JSON.stringify({server: data.name})));
			}

			echo(shares, 'gSTB.GetSmbShares');

			if ( shares.errCode === 0 ) {
				parseSambaHost(shares);
			} else { // here we check API version because not every API version accepts authentication
				if ( +gSTB.Version().split(';')[0].split(':')[1].trim() < 343 ) {
					parseSambaHost();
				} else {
					currFocus = document.activeElement;
					// maybe need authorization
					new CModalConfirm(listLink.parent,
						_('Network connection'),
						_('Unable to open the server.<br>Authorization may be necessary.<br>Specify login and password?'),
						_('Cancel'),
						function(){ currFocus.focus(); },
						_('Yes'),
						function(){
							// get login/pass
							modalAuth = new CModalAuth(listLink.parent,
								_('Authorization'),
								_('Login:'),
								_('Password') + ':',
								_('Cancel'),
								function () { listLink.prevFocus = currFocus; },
								_('Connection'),
								function ( login, pass ) {
									// try to open server with auth data
									shares = JSON.parse(gSTB.GetSmbShares(JSON.stringify({server: data.name, login: login, password: pass})));

									if ( shares.errCode === 0 ) {
										SMB_SRV_AUTH[data.url] = {login: login, password: pass};
										parseSambaHost(shares);
										listLink.prevFocus = currFocus;
										return true;
									} else {
										echo(modalAuth.name);
										new CModalHint(modalAuth, _('Unable to connect to the resource<br>with the given parameters'), 4000);
										return false;
									}
								}
							);
						}
					);
				}
			}
		} catch ( e ) {
			echo(e);
		}

		function parseSambaHost ( shares ) {
			// some data received
			// allow to open server without shares
			if ( shares && shares.result && Array.isArray(shares.result.shares) /*&& shares.result.shares.length > 0*/ ) {
				// ok
				content.push({name: '..', type: MEDIA_TYPE_BACK});
				shares.result.shares.forEach(function( share ){
					if ( !share ) {
						return;
					}

					pushContent({
						name: share,
						markable: false,
						readOnly: data.readOnly,
						url: SMB_PATH,
						address: '//' + shares.result.serverIP + '/' + share,
						addresses: [shares.result.serverIP].concat(shares.result.additionalIPs || []),
						folder: share,
						type: MEDIA_TYPE_SAMBA_SHARE
					});
				});
				// go deeper
				listLink.total = content.length;
				listLink.onLevelChange(data, content, level);
			} else {
				// different failures
				new CModalAlert(listLink.parent, _('Error'), _('Unable to get server shares') + /*(shares.errMsg ? ':<br>'+shares.errMsg :*/ '.'/*)*/,
					_('Close'), function(){ setTimeout(function(){listLink.Activate(true);}, 5); });
			}
		}
	}

	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openFolder ( data, level ) {
		// result list
		var result = listDir(data.url),
			isISO = false;

		content.push({name: '..', type:MEDIA_TYPE_BACK});
		listLink.playList = [];
		listLink.subList = [];

		fileSort(result.dirs, MEDIA_ACTION_SORT_NAME).concat(fileSort(result.files, listLink.sortType)).forEach(function(item){
			item.url = data.url  + '/' + item.name;
			item.markable = true;
			item.readOnly = content.readOnly;
			// check if opened item is root of usb or hdd
			// set unmarkable and readonly if item name is records
			if ( content.fsType !== undefined && item.name === 'records' ) {
				item.readOnly = true;
				item.markable = false;
			}
			// check if unpacked dvd/Blu-ray iso folder
			if ( ['VIDEO_TS', 'BDMV', 'video_ts', 'bdmv', 'video_ts.ifo', 'VIDEO_TS.IFO'].indexOf(item.name) !== -1 ) {
				isISO = true;
			}
			item.stared = item.markable && FAVORITES_NEW[item.url] ? true : false;
			// fill list
			echo(item.type, 'item.type');
			pushContent(item);
		});

		if ( isISO ) {
			// protect from focus loose
			setTimeout(function(){
				// choose to play or open
				new CModalConfirm(listLink.parent,
					_('Multimedia content'),
					_('The directory contains DVD or Blu-ray structure.<br>Begin playing?'),
					_('Cancel'),
					function(){},
					_('Yes'),
					function(){
						// send to player and start
						MediaPlayer.preparePlayer({
							name: data.name,
							url : data.url,
							type: MEDIA_TYPE_ISO
						}, listLink.parent, true, true, (!listLink.parent.BPanel.btnF3add.data.hidden || !listLink.parent.BPanel.btnF3del.data.hidden), false);
					}
				);
			}, 5);
		}

		// file list has some items then show F3 and F4 buttons
		if ( result.dirs.length + result.files.length > 0 ) {
			listLink.hideF3add = false;
			listLink.hideF2 = false;
		}
		// go deeper
		listLink.total = content.length;
		listLink.onLevelChange(data, content, level);
	}

	/**
	 * Enter SMB share
	 * mount it if necessary
	 *
	 * @param {Object} data media item inner data
	 */
	function openSambaShare ( data, level ) {
		var modalAuth, currFocus;

		// reset
		listLink.parent.UnmountSMB();
		// was not able to mount
		if ( listLink.parent.MountSMB(data) ) {
			// folder was mounted so list it
			openFolder({name:data.name, url:SMB_PATH, type:MEDIA_TYPE_FOLDER, index: data.index}, level);
		} else {
			currFocus = document.activeElement;
			// maybe need authorization
			new CModalConfirm(listLink.parent,
				_('Network connection'),
				_('Unable to mount the folder.<br>Authorization may be necessary.<br>Specify login and password?'),
				_('Cancel'),
				function(){ currFocus.focus(); },
				_('Yes'),
				function(){
					// get login/pass
					modalAuth = new CModalAuth(listLink.parent,
						_('Authorization'),
						_('Login:'),
						_('Password') + ':',
						_('Cancel'),
						function () { listLink.prevFocus = currFocus; },
						_('Connection'),
						function ( login, pass ) {
							// store auth data
							data.login = login;
							data.pass = pass;
							// try to mount
							if ( !listLink.parent.MountSMB(data) ) {
								echo(modalAuth.name);
								new CModalHint(modalAuth, _('Unable to connect to the resource<br>with the given parameters'), 4000);
								return false;
							} else {
								listLink.prevFocus = currFocus;
								// do file listing
								setTimeout(function(){ listLink.Open(data); }, 5);
								return true;
							}
						}
					);
				}
			);
		}
	}

	/**
	 * Enter NFS share
	 * mount it if necessary
	 *
	 * @param {Object} data media item inner data
	 */
	function openNfsShare ( data, level ) {
		var modalAuth, currFocus;

		// reset
		listLink.parent.UnmountNFS();
		// was not able to mount
		if ( listLink.parent.MountNFS(data) ) {
			// folder was mounted so list it
			openFolder({name:data.name, url:NFS_PATH, type:MEDIA_TYPE_FOLDER, index: data.index}, level);
		} else {
			currFocus = document.activeElement;
			// maybe need authorization
			new CModalConfirm(listLink.parent,
				_('Network connection'),
				_('Unable to mount the folder.<br>Authorization may be necessary.<br>Specify login and password?'),
				_('Cancel'),
				function(){ currFocus.focus(); },
				_('Yes'),
				function(){
					// get login/pass
					modalAuth = new CModalAuth(listLink.parent,
						_('Authorization'),
						_('Login:'),
						_('Password') + ':',
						_('Cancel'),
						function () { listLink.prevFocus = currFocus; },
						_('Connection'),
						function ( login, pass ) {
							// store auth data
							SMB_AUTH[data.address] = {login:login, pass:pass};
							// try to mount
							if ( !listLink.parent.MountSMB(data) ) {
								echo(modalAuth.name);
								new CModalHint(modalAuth, _('Unable to connect to the resource<br>with the given parameters'), 4000);
								return false;
							} else {
								listLink.prevFocus = currFocus;
								// do file listing
								setTimeout(function(){ listLink.Open(data); }, 5);
								return true;
							}
						}
					);
				}
			);
		}
	}


	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openFavorites ( data, level ) {
		var path;
		content.push({name: '..', type:MEDIA_TYPE_BACK});
		// filling
		for ( path in FAVORITES_NEW ) {
			if ( FAVORITES_NEW.hasOwnProperty(path) ) {
				FAVORITES_NEW[path].markable = true;
				FAVORITES_NEW[path].stared = false;
				pushContent(FAVORITES_NEW[path]);
			}
		}
		// file list has some items
		if ( content.length > 1 ) {
			listLink.hideF2 = listLink.hideF3del = false;
		}
		listLink.total = content.length;
		listLink.onLevelChange(data, content, level);
	}


	/**
	 * Merge a set of folders from different storages
	 *
	 * @param {[String]} paths list of dir paths
	 */
	function openRecordsFolder ( paths ) {
		var dHash = {},  // unique list of names with real dirs for each
			dList = [];  // list of dirs data for add

		paths.forEach(function(path){
			var structure = listDir(path);
			// get all dir data individually
			structure.dirs.forEach(function(dir){
				echo(dir, 'dir')
				// join it in one hash table with path arrays
				dHash[dir.name] = dHash[dir.name] || [];
				dHash[dir.name].push(path + '/' + dir.name);
			});
			structure.files.forEach(function(file){
				echo(file, 'file')
				// join it in one hash table with path arrays
				file.url = path + '/' + file.name;
				dList.push(file);
			});
		});
		// fill the dir list
		for ( var name in dHash ) {
			if ( dHash.hasOwnProperty(name) ) {
				dList.push({name:name, url:name, paths:dHash[name]});
			}
		}
		// sort the list
		return fileSort(dList, MEDIA_ACTION_SORT_NAME);
	}


	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data	 *
	 */
	function openRecordsRoot ( data, level ) {
		var paths = [], path;
		content.push({name: '..', type:MEDIA_TYPE_BACK});

		// get "records" dir on each storage
		STORAGE_INFO.forEach(function(item){
			path = item.mountPath + '/records';
			if ( gSTB.IsFolderExist(path) ) {
				paths.push(path);
			}
		});

		// get merged content of all dirs
		openRecordsFolder(paths).forEach(function(item){
			item.type = MEDIA_TYPE_RECORDS_CHAN;
			pushContent(item);
		});

		listLink.total = content.length;
		listLink.onLevelChange(data, content, level);
	}


	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openRecordsChan ( data, level ) {
		content.push({name: '..', type:MEDIA_TYPE_BACK});

		// get merged content of all sub-dirs
		openRecordsFolder(data.paths).forEach(function(item){
			item.type = item.type || MEDIA_TYPE_RECORDS_CHAN;
			pushContent(item);
		});

		listLink.total = content.length;
		listLink.onLevelChange(data, content, level);
	}


	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openRecordsDate( data, level ) {
		var list = [];

		content.push({name: '..', type:MEDIA_TYPE_BACK});

		data.paths.forEach(function(path){
			listDir(path).files.forEach(function(item){
				item.url = path + '/' + item.name;
				list.push(item);
			});
		});
		// prepare
		list = fileSort(list, listLink.sortType);
		// render
		list.forEach(function(item){
			item.markable = true;
			item.name = item.name.split('-').join(':');
			item.stared = FAVORITES_NEW[item.url] ? true : false;
			pushContent(item);
		});
		// can select and add to favs
		if ( list.length > 0 ) {
			listLink.hideF2 = listLink.listLink = false;
		}
		listLink.total = content.length;
		listLink.onLevelChange(data, content, level);
	}


	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openFile ( data, level, options ) {

		// prevent onFocus delayed action
		if ( listLink.timer ) { clearTimeout(listLink.timer); }

		// init player with list of files and subs in the current level
		if ( !listLink.playListSet ) {
			MediaPlayer.prepareList(listLink.playList, listLink.playList.indexOf(data));
			MediaPlayer.setSubList(listLink.subList);
			listLink.playListSet = true;
		}

		// playing video (showing a picture) or not
		if ( MediaPlayer.playNow || MediaPlayer.obj !== null ) {
			MediaPlayer.Show(true, listLink.parent);
			setTimeout(function(){MediaPlayer.changeScreenMode(true);},0);
		} else {
			data.options = options || {};
			MediaPlayer.preparePlayer(data, listLink.parent, true, true, (!listLink.parent.BPanel.btnF3add.data.hidden || !listLink.parent.BPanel.btnF3del.data.hidden), false, options);
		}
	}


	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openText ( data ) {
		// check file encoding
		if ( !gSTB.IsFileUTF8Encoded(data.url) ) {
			// ask user
			new CModalSubtitleOpen(listLink.parent, {
				data: data,
				onadd: function(options, encoding){
					MediaPlayer.setForcedSubtitles(options.data, encoding);
					new CModalHint(currCPage, _('Selected subtitle will appear<br>during next player launch'), 3000);
				}
			});
		} else {
			// can apply at once
			MediaPlayer.setForcedSubtitles(data, 'utf-8');
			new CModalHint(currCPage, _('Selected subtitle will appear<br>during next player launch'), 3000);
		}
	}


	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openCue ( data, level ) {
		var folder, filename;

		// maybe already parsed previously
		if ( data.cue === undefined ) {
			folder = data.url.split('/')
			filename = folder.pop();
			folder = listDir(folder.join('/'));
			folder.files.forEach(function ( file ) {
				if ( file.name === filename ) {
					if ( file.size === 0 ) {
						// no items in the playlist
						new CModalAlert(listLink.parent, _('Error'), _('No records in this playlist'), _('Close'));
						return;
					}
				}
			});
			data.cue = listLink.parent.ParseCue(listLink.parent.ReadFile(encodeURI(data.url), data.encoding));
		}

		if ( data.cue.files.length === 0 ) {
			new CModalAlert(listLink.parent, _('Error'), _('Cyrillic symbols in path or file name are not allowed'), _('Close'));
			return;
		}

		echo(data, 'openCue');
		content.push({name: '..', type:MEDIA_TYPE_BACK});

		// fill the list
		data.cue.files.forEach(function( file ) {
			file.tracks.forEach(function( track ){
				var info = {
					name : track.number + '. ' + track.title,
					type : MEDIA_TYPE_CUE_ITEM,
					time : (track.index[track.index.length-1] || 0),
					url  : listLink.parentItem.url + '/' + file.name
				};
				if ( data.cue.files.length > 1 ) {
					info.file = file.name;
				}
				if ( track.performer !== data.cue.performer && track.performer !== undefined ) {
					info.performer = track.performer;
				}
				pushContent(info);
			});
		});
		listLink.total = content.length;
		listLink.onLevelChange(data, content, level);
	}

	/**
	 * Enter the item or open it
	 *
	 * @param {Object} [data] media item inner data
	 */
	function openPlaylist ( data, level ) {
		var code = data.code,
			folder, filename;

		data.readOnly = true;

		// reopen for filtering
		if ( data.filterText ) {
			code = KEYS.F1;
		}

		// initial show
		if ( !code ) {
			// protect from focus loose
			setTimeout(function(){
				// ask user
				new CModalPlayListOpen(listLink.parent);
			}, 5);
			return;
		}

		// read and parse the given file
		//plsData = listLink.parent.ParsePlaylist(data.ext, listLink.parent.ReadFile(encodeURI(data.url), data.encoding));
		folder = data.url.split('/');
		filename = folder.pop();
		folder = listDir(folder.join('/'));
		folder.files.forEach(function ( file ) {
			if ( file.name === filename ) {
				if ( file.size === 0 ) {
					// no items in the playlist
					new CModalAlert(listLink.parent, _('Error'), _('No records in this playlist'), _('Close'));
					return;
				}
			}
		});

		var m3uData = listLink.parent.ParseM3u(listLink.parent.ReadFile(encodeURI(data.url), data.encoding)),
			plsData = m3uData.items,
			hasNew  = false;

		if ( configuration.maySecureM3u ) {
			if ( 'SYSLOG_SRV' in m3uData.config && environment.syslog_srv !== m3uData.config.SYSLOG_SRV ) {
				echo('new syslog');
				environment.syslog_srv = m3uData.config.SYSLOG_SRV;
				gSTB.SetEnv(JSON.stringify({syslog_srv: environment.syslog_srv}));
				hasNew = true;
			}

			delete m3uData.config.SYSLOG_SRV;

			if ( m3uData.config && JSON.stringify(m3uData.config) !== JSON.stringify(PLSCFG) ) {
				echo('new IPTV/OTT');
				gSTB.SaveUserData('plscfg.json', JSON.stringify(m3uData.config));
				// first activation
				if ( Object.keys(PLSCFG).length === 0 ) {
					echo('apply IPTV/OTT');
					MediaPlayer.applyCAS(m3uData.config);
				} else {
					hasNew = true;
				}
				PLSCFG = m3uData.config;
			}

			if ( hasNew ) {
				new CModalAlert(
					listLink.parent,
					_('New settings'), _('New settings were found. Please reboot the device for activation.'),
					_('Close'),
					function () {
						setTimeout(function(){listLink.Activate(true);}, 5);
					}
				);
			}
		}


		// no items in the playlist
		if ( plsData.length === 0 ) {
			new CModalAlert(listLink.parent, _('Error'), _('Cyrillic symbols in path or file name are not allowed'), _('Close'));
			return;
		}

		// clear for next calls
		data.code = null;

		switch ( code ) {
			case KEYS.F1: // open
			case KEYS.F2: // play
				// reset
				content.push({name: '..', type:MEDIA_TYPE_BACK});
				// render
				plsData.forEach(function(item){
					item.markable = true;
					item.stared = FAVORITES_NEW[item.url] ? true : false;
					pushContent(item);
				});
				// can select and add to favs
				if ( plsData.length > 0 ) {
					listLink.hideF2 = listLink.hideF3add = false;
				}
				if ( code === KEYS.F2 ) {
					// set focus and enable footer buttons
					setTimeout(function(){
						listLink.Reposition(plsData[0]);
						listLink.onFocus(listLink.Current());
					}, 0);
					// prepare playlist
					MediaPlayer.prepareList(plsData);
					listLink.playListSet = true;
					// send to player and start
					MediaPlayer.preparePlayer(plsData[0] || {}, listLink.parent, true, true, true, true);
				}
				// go deeper
				listLink.total = content.length;
				listLink.onLevelChange(data, content, level);
				break;
			case KEYS.F3:
				// protect from focus loose
				setTimeout(function(){
					var result = IPTVChannels.addChannels(plsData, true);
					// tell user
					if ( result === false ) {
						new CModalAlert(listLink.parent, _('Add to IPTV channels'), _('Unable to add the selected records'), _('Close'));
					} else if ( result === 0 ) {
						new CModalAlert(listLink.parent, _('Add to IPTV channels'), _('No new channels for selected records'), _('Close'));
					} else {
						var conf = new CModalAlert(listLink.parent, _('Add to IPTV channels'), _('Channels added successfully:') + ' ' + result, _('Close'));
						conf.bpanel.Add(KEYS.TV, 'tv.png', _('Go to IPTV channels'), function(){
							// hide and destroy
							conf.Show(false);
							MediaBrowser.Reset();
							MediaBrowser.Show(false);
							IPTVChannels.Reset();
							IPTVChannels.Show(true);
							return true;
						});
					}
				}, 5);
				break;
		}
	}

	function route( data, level, options ) {
		content = [];
		listLink.Clear();
		level = level || listLink.LEVEL_CHANGE_DOWN;
		if ( !data ) {
			MediaBrowser.FileList.states['marked'] = [];
			MediaBrowser.Preview.valSel.innerText = 0;
			openError(data, level);
		} else if ( !routes[data.type] ) {
			MediaBrowser.FileList.states['marked'] = [];
			MediaBrowser.Preview.valSel.innerText = 0;
			openError(data, level);
		} else {
			listLink.fileBrowser = FileBrowser;
			if ( routes[data.type] !== openFile ) {
				MediaBrowser.FileList.states['marked'] = [];
				MediaBrowser.Preview.valSel.innerText = 0;
			}
			routes[data.type](data, level, options);
		}
	}


	window.FileBrowser = {
		init: function ( list ) {
			listLink = list;
			// init routes
			routes[MEDIA_TYPE_MB_ROOT]      = openRoot;
			routes[MEDIA_TYPE_BACK]         = openBack;
			routes[MEDIA_TYPE_SAMBA_ROOT]   = openSambaRoot;
			routes[MEDIA_TYPE_SAMBA_GROUP]  = openSambaGroup;
			routes[MEDIA_TYPE_SAMBA_HOST]   = openSambaHost;
			routes[MEDIA_TYPE_SAMBA_SHARE]  = openSambaShare;
			routes[MEDIA_TYPE_NFS_SHARE]    = openNfsShare;
			routes[MEDIA_TYPE_FOLDER]       = openFolder;
			routes[MEDIA_TYPE_STORAGE_USB]  = openFolder;
			routes[MEDIA_TYPE_STORAGE_SATA] = openFolder;
			routes[MEDIA_TYPE_STORAGE_SD]   = openFolder;
			routes[MEDIA_TYPE_STORAGE_MMC]  = openFolder;
			routes[MEDIA_TYPE_UPNP]         = openFolder;
			routes[MEDIA_TYPE_FAVORITES]    = openFavorites;
			routes[MEDIA_TYPE_RECORDS_ROOT] = openRecordsRoot;
			routes[MEDIA_TYPE_RECORDS_CHAN] = openRecordsChan;
			routes[MEDIA_TYPE_RECORDS_DATE] = openRecordsDate;
			routes[MEDIA_TYPE_RECORDS_ITEM] = openFile;
			routes[MEDIA_TYPE_VIDEO]        = openFile;
			routes[MEDIA_TYPE_AUDIO]        = openFile;
			routes[MEDIA_TYPE_IMAGE]        = openFile;
			routes[MEDIA_TYPE_ISO]          = openFile;
			routes[MEDIA_TYPE_STREAM]       = openFile;
			routes[MEDIA_TYPE_DVB]          = openFile;
			routes[MEDIA_TYPE_CUE]          = openCue;
			routes[MEDIA_TYPE_CUE_ITEM]     = openFile;
			routes[MEDIA_TYPE_TEXT]         = openText;
			routes[MEDIA_TYPE_PLAYLIST]     = openPlaylist;

			routes[MEDIA_TYPE_UPNP_ROOT]    = function ( data, level ) {
				if ( UPnPBrowser ) {
					UPnPBrowser.open(data, level);
				}
			};

			// remap global object
			window.FileBrowser = {
				open: route,
				filterText: function ( text ) {
					var clone = {},
						last  = listLink.path[listLink.path.length-1];

					textFilter = text;
					// go deeper
					// prepare
					for ( var attr in last ) {
						clone[attr] = last[attr];
					}
					clone.filterText = text;
					// current node but filtered
					listLink.Open(clone);
				},
				filterType: function ( type ) {
					var typeOk, textOk, data;

					typeFilter = type;
					// check all items
					data = content.filter(function ( item ) {
						textOk = item.type === MEDIA_TYPE_BACK || (item.name && item.name.toLowerCase().indexOf(textFilter) !== -1);
						// check file type if regular file
						typeOk = item.type === typeFilter || typeFilter === MEDIA_TYPE_NONE || item.type === MEDIA_TYPE_BACK;
						return textOk && typeOk;
					});

					listLink.data = data;
					listLink.indexView = -1;
					listLink.total = data.length;
					listLink.renderView(0);
					if ( !listLink.activeItem.data ) {
						listLink.focusItem(listLink.$body.firstChild);
					}
				}
			};
		}
	};
})();
