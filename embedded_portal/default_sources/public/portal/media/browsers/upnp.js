/**
 * Browser for upnp nodes.
 *
 * @author Igor Zaporozhets <deadbyelpy@gmail.com>
 */

'use strict';

(function () {
	var routes = {},
		inServer = false,
		prevPage = 0,
		topEl,
		itr = 0,
		loadingHint, listLink, levelChange, pageDirection, context;

	function openError (data) {
		echo(data, 'openError');
		new CModalAlert(listLink.parent, _('Error'), _('Unknown type of selected item'), _('Close'));
	}

	function prepareContent ( list ) {
		var result = [], item;
		while ( (item = list.shift()) ) {
			switch ( item.ContentType ) {
				case stbUPnP.TYPE_FOLDER:
					item.type = MEDIA_TYPE_UPNP_FOLDER;
					item.url = item.ID;
					break;
				case stbUPnP.TYPE_AUDIO:
					item.type = MEDIA_TYPE_AUDIO;
					break;
				case stbUPnP.TYPE_VIDEO:
					item.type = MEDIA_TYPE_VIDEO;
					break;
				case stbUPnP.TYPE_IMAGE:
					item.type = MEDIA_TYPE_IMAGE;
					break;
				default :
					item.type = MEDIA_TYPE_TEXT;
					break;
			}
			item.markable = false;
			if ( item.type !== stbUPnP.TYPE_FOLDER && item.Resources && item.Resources.length ) {
				item.url = item.Resources[0].Value;
				item.size = item.Resources[0].Size;
			}
			item.Resources = null;
			item.readOnly = true;
			item.name = item.Title;
			// fill file list to play
			if ( listLink.parent.playable.indexOf(item.type) !== -1 ) {
				// allow only playable media types
				listLink.playList.push(item);
			}
			result.push(item);
			++itr;
		}
		// collect all media types on the current level (for filtering)
		listLink.mtypes.push(MEDIA_TYPE_UPNP_FOLDER);
		listLink.mtypes.push(MEDIA_TYPE_AUDIO);
		listLink.mtypes.push(MEDIA_TYPE_VIDEO);
		listLink.mtypes.push(MEDIA_TYPE_IMAGE);
		echo(result.length, 'prepareContent');
		return result;
	}

	function onOpenContext ( data, error ) {
		var content = [];

		if ( error ) { // some error happend, notify user about it
			echo(error, 'onOpenContext.error');
			loadingHint.Show(false);
			new CModalHint(listLink.parent, _('Unable to connect to the resource<br>with the given parameters'), 4000);
			openBack();
			return;
		}

		echo(data, 'onOpenContext');

		prevPage = 0;
		content.push({type:MEDIA_TYPE_BACK, name: '..'});
		listLink.total = stbUPnP.pagesCount * stbUPnP.pageSize;
		// some data received
		if ( data && Array.isArray(data) && content.length > 0 ) {
			// ok
			content = content.concat(prepareContent(data));
			if ( content.length > stbUPnP.pageSize ) {
				topEl = content.pop();
			} else {
				topEl = false;
			}
		}
		loadingHint.Show(false);
		listLink.onLevelChange(context, content, levelChange);
	}

	function onOpenPage ( data, error ) {
		var page = stbUPnP.pageNumber;

		if ( error ) { // some error happend, do nothing
			echo(error, 'onOpenPage.error');
			loadingHint.Show(false);
			return;
		}

		echo(page, 'onOpenPage');

		if ( page === 0 ) {
			data = prepareContent(data);
			data.unshift({type:MEDIA_TYPE_BACK, name: '..'});
			if ( data.length > stbUPnP.pageSize ) {
				topEl = data.pop();
			} else {
				topEl = false;
			}
			listLink.data = data;
			if ( page < prevPage ) {
				listLink.indexView = data.length;
				listLink.renderView(data.length - listLink.size);
				listLink.focusItem(listLink.$body.lastChild);
			} else {
				listLink.indexView = -1;
				listLink.renderView(0);
				listLink.focusItem(listLink.$body.firstChild);
			}
			listLink.total = stbUPnP.pagesCount * stbUPnP.pageSize;
		} else if ( data && Array.isArray(data) && data.length > 0 ) {
			data = prepareContent(data);
			if ( page < prevPage ) {
				listLink.data = data;
				listLink.indexView = data.length;
				listLink.renderView(data.length - listLink.size);
				listLink.focusItem(listLink.$body.lastChild);
			} else if ( stbUPnP.pagesCount - 1 === page ) {
				echo(topEl, 'DADAADADAD');
				if ( topEl ) {
					data.push(topEl);
				}
				listLink.data = data;
				listLink.indexView = -1;
				listLink.renderView(0);
				listLink.focusItem(listLink.$body.firstChild);
			} else { // go down
				listLink.data = data;
				listLink.indexView = -1;
				listLink.renderView(0);
				listLink.focusItem(listLink.$body.firstChild);
			}
			prevPage = page;
		}
	}

	/**
	 * Enter the root UPnP item or open it
	 * @param {Object} [data] media item inner data
	 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
	 */
	function openUPnPRoot ( data, level ) {
		var servers = stbUPnP.getServerListSync(),
			content = [];

		content.push({name: '..', type: MEDIA_TYPE_BACK});

		console.log('openUPnPRoot');
		// some data received
		if ( servers && Array.isArray(servers) && servers.length > 0 ) {
			servers.forEach(function(server){
				content.push({markable:false, readOnly: true, name:server.FriendlyName, url: server.UDN, type:MEDIA_TYPE_UPNP_HOST});
			});
			// go deeper
			inServer = false;
			levelChange = level;
			listLink.total = content.length;
			listLink.onLevelChange(context, content, level);
		} else {
			// different failures
			new CModalAlert(listLink.parent, _('Error'), _('Unable to get dlna group servers') + /*(servers.errMsg ? ':<br>'+servers.errMsg :*/ '.'/*)*/,
				_('Close'), function(){ setTimeout(function(){listLink.Activate(true);}, 5); });
		}
	}

	/**
	 * Enter the server UPnP item or open it
	 * @param {Object} [data] media item inner data
	 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
	 */
	function openUPnPHost ( data, level ) {
		inServer = true;

		if ( loadingHint ) {
			loadingHint.Free();
			loadingHint = new CModalHint(listLink.parent, _('Loading...'), false, true);
		} else {
			loadingHint = new CModalHint(listLink.parent, _('Loading...'), false, true);
		}

		levelChange = level;
		stbUPnP.openServer(data.url);
	}


	/**
	 * Enter the folder in UPnP server.
	 *
	 * @param {Object} [data] media item inner data *
	 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
	 */
	function openUPnPFolder ( data, level ) {
		if ( loadingHint ) {
			loadingHint.Free();
			loadingHint = new CModalHint(listLink.parent, _('Loading...'), false, true);
		} else {
			loadingHint = new CModalHint(listLink.parent, _('Loading...'), false, true);
		}
		// save opened context ID in the previous context in the custom 'pId' field
		listLink.path[listLink.path.length - 1].pId = data.ID;
		levelChange = level;
		if ( level === listLink.LEVEL_CHANGE_UP ) {
			echo(data.pId, 'data.pId');
			stbUPnP.openContext(data.pId);
		} else {
			stbUPnP.openContext(data.ID);
		}
	}


	/**
	 * Open previous (by path) complex item
	 *
	 * @param {Object} [data] media item inner data
	 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
	 */
	function openBack () {
		// normal exit
		listLink.path.pop();

		if ( listLink.bcrumb ) {
			listLink.bcrumb.Pop();
		}

		stbUPnP.setFilterName(listLink.path[listLink.path.length-1].filterText ? listLink.path[listLink.path.length-1].filterText : '');
		stbUPnP.setFilterType(MEDIA_TYPE_NONE);
		UPnPBrowser.open(listLink.path[listLink.path.length-1], listLink.LEVEL_CHANGE_UP);
	}

	/**
	 * Enter the item or open it
	 * @param {Object} [data] media item inner data
	 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
	 */
	function openFile ( data ) {
		// prevent onFocus delayed action
		if ( listLink.timer ) { clearTimeout(listLink.timer); }

		// init player with list of files and subs in the current level
		if ( !listLink.playListSet ) {
			MediaPlayer.prepareList(listLink.playList);
			MediaPlayer.setSubList(listLink.subList);
			listLink.playListSet = true;
		}

		// playing video (showing a picture) or not
		if ( MediaPlayer.playNow || MediaPlayer.obj !== null ) {
			MediaPlayer.Show(true, listLink.parent);
			setTimeout(function(){MediaPlayer.changeScreenMode(true);},0);
		} else {
			MediaPlayer.preparePlayer(data, listLink.parent, true, true, (!listLink.parent.BPanel.btnF3add.data.hidden || !listLink.parent.BPanel.btnF3del.data.hidden), false);
		}
	}

	/**
	 * Browser open action which use data type for route to the special open data handler.
	 *
	 * @param {Object} data object to open
	 * @param {Number} [level=listLink.LEVEL_CHANGE_DOWN] changed level
	 */
	function route( data, level ) {
		var isLevel = level !== undefined;

		level = level || listLink.LEVEL_CHANGE_DOWN;
		context = data;
		listLink.Clear();

		if ( !data ) {
			openError(data, level);
		} else if ( !routes[data.type] ) {
			isLevel ? openError(data, level) : routes[MEDIA_TYPE_MB_ROOT](data, level);
		} else {
			listLink.fileBrowser = UPnPBrowser;
			routes[data.type](data, level);
		}
	}

	function onRenderView ( ) {
		listLink.scrollBar.scrollTo(stbUPnP.pageNumber * stbUPnP.pageSize);
	}

	/**
	 * On list overflow.handler.
	 */
	function onOverflow ( event ) {
		if ( !inServer ) {
			return;
		}
		if ( stbUPnP.pagesCount === 1 ) {
			return;
		}
		if ( event.direction === KEYS.DOWN && stbUPnP.pagesCount === stbUPnP.pageNumber - 1 ) {
			return;
		}
		if ( event.direction === KEYS.UP && stbUPnP.pageNumber === 0 ) {
			return;
		}
		if ( event.direction === KEYS.DOWN ) {
			pageDirection = true;
			stbUPnP.openPage(stbUPnP.pageNumber + 1);
		} else if ( event.direction === KEYS.UP ) {
			pageDirection = false;
			stbUPnP.openPage(stbUPnP.pageNumber - 1);
		}
	}


	window.UPnPBrowser = {
		init: function ( list ) {
			listLink = list;
			stbUPnP.init();
			stbUPnP.onOpenContext = onOpenContext;
			stbUPnP.onOpenServer = onOpenContext;
			stbUPnP.onOpenPage = onOpenPage;
			stbUPnP.pageSize = list.size;

			routes[MEDIA_TYPE_UPNP_ROOT]    = openUPnPRoot;
			routes[MEDIA_TYPE_UPNP_HOST]    = openUPnPHost;
			routes[MEDIA_TYPE_UPNP_FOLDER]  = openUPnPFolder;
			routes[MEDIA_TYPE_BACK]         = openBack;
			routes[MEDIA_TYPE_RECORDS_ITEM] = openFile;
			routes[MEDIA_TYPE_VIDEO]        = openFile;
			routes[MEDIA_TYPE_AUDIO]        = openFile;
			routes[MEDIA_TYPE_IMAGE]        = openFile;
			routes[MEDIA_TYPE_ISO]          = openFile;
			routes[MEDIA_TYPE_STREAM]       = openFile;
			routes[MEDIA_TYPE_DVB]          = openFile;
			routes[MEDIA_TYPE_CUE_ITEM]     = openFile;
			routes[MEDIA_TYPE_MB_ROOT]      = function ( data, level ) {
				if ( FileBrowser ) {
					FileBrowser.open(data, level);
				}
			};

			window.UPnPBrowser = {
				ready: true,
				open: route,
				filterText: function ( text ) {
					stbUPnP.setFilterName(text);
					prevPage = -1;
					stbUPnP.openPage(0);
				},
				filterType: function ( type ) {
					stbUPnP.setFilterType(type);
					prevPage = -1;
					stbUPnP.openPage(0);
				},
				onRenderView: onRenderView,
				onOverflow: onOverflow
			};
		}
	};
})();
