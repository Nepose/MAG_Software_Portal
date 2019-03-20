/**
 * Component: downloads lister
 * downloads lists with navigation
 * @author Igor Kopanev
 * @extends CScrollList
 */

'use strict';

/**
 * @class CDownloadsList
 * @constructor
 */
function CDownloadsList ( parent ) {
	// parent constructor
	CScrollList.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CDownloadsList';

	/**
	 * link to the CFilterInput component
	 * @type {CFilterInput}
	 */
	this.sbar = null;

	/**
	 * type filter for download name
	 * @type {number}
	 */
	this.filterType = DOWNLOAD_FILTER_NONE;

	/**
	 * data filter for download name
	 * @type {string}
	 */
	this.filterText = '';

	/**
	 * file items sort method
	 * @type {number}
	 */
	this.sortType = DOWNLOAD_SORT_STATE;

	/**
	 * Downloads
	 * @type {Array}
	 */
	this.downloads = null;


	/**
	 * Indexed table for downloads
	 * @type {Object}
	 */
	this.indexed = {};

	this.classNames = ['stopped', 'waiting', 'running', 'done', 'error', 'error', 'back'];

	this.backState = 6;

	this.playableTypes = [MEDIA_TYPE_VIDEO, MEDIA_TYPE_AUDIO, MEDIA_TYPE_IMAGE, MEDIA_TYPE_ISO];
}

// extending
CDownloadsList.prototype = Object.create(CScrollList.prototype);
CDownloadsList.prototype.constructor = CDownloadsList;

/**
 * Sorts the file data
 * @param {number} [sortType] sorting method
 */
CDownloadsList.prototype.Sort = function ( sortType ) {
	var states = {2: 1, 1: 2, 0: 3, 3: 4, 4: 5, 5: 5};
	sortType = sortType || this.sortType;
	if ( Array.isArray(this.downloads) && this.downloads.length > 0 ) {
		switch ( sortType ) {
			case DOWNLOAD_SORT_STATE:
				this.downloads.sort(function ( a, b ) {
					return states[a.state] - states[b.state];
				});
				break;
			case DOWNLOAD_SORT_NAME:
				this.downloads.sort(function ( a, b ) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase());});
				break;
			case DOWNLOAD_SORT_SIZE:
				this.downloads.sort(function ( a, b ) {
					return b.sizeTotal - a.sizeTotal;
				});
				break;
			case DOWNLOAD_SORT_PRIORITY:
				this.downloads.sort(function ( a, b ) {return b.prio - a.prio;});
				break;
		}
	}
};

/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CDownloadsList.prototype.SetSearchBar = function ( component ) {
	this.sbar = component;
};

CDownloadsList.prototype.SetButtonPanel = function ( component ) {
	this.bpanel = component;
};

/**
 * Set downloads data
 * @param {[Object]} downloads
 */
CDownloadsList.prototype.SetData = function ( downloads ) {
	var self = this;
	this.downloads = downloads.slice();
	this.Clear();
	this.indexed = {};
	this.Sort();
	if ( Array.isArray(this.downloads) && this.downloads.length > 0 ) {
		if ( this.filterText !== '' ) {
			this.Focused(this.Add({name: '..', state: this.backState, markable: false}), true);
		}
		this.downloads.forEach(function ( download ) {
			self.Add(download);
		});
	} else {
		this.Show(false);
	}
};

/**
 * Shows/hides items depending on the given filter string match
 * unmarks all hidden items
 * @param {Object} download data
 */
CDownloadsList.prototype.Filter = function ( download ) {
	// link to the object for limited scopes
	var hide = true;
	// check file name if regular file
	if ( this.filterType === DOWNLOAD_FILTER_NONE ) {
		hide = false;
	} else if ( download.state === this.filterType - DOWNLOAD_FILTER_PREFIX ) {
		hide = false;
	} else if ( (DOWNLOAD_FILTER_ERROR_2 - DOWNLOAD_FILTER_PREFIX ) === download.state && this.filterType === DOWNLOAD_FILTER_ERROR_1 ) {
		hide = false;
	}
	if ( this.filterText && hide === false ) {
		hide = (download.name || (download.name = download.filePath.split('/').pop())) && download.name.toLowerCase().indexOf(this.filterText) === -1;
	}

	return hide;
};

/**
 * Finds the first appropriate item
 * @param {string} value
 * @return {Node}
 */
CDownloadsList.prototype.FirstMatch = function ( value ) {
	// preparing
	var items = this.handleInner.children;  // all list items
	// iterate all items till all items are found
	for ( var i = 0; i < items.length; i++ ) {
		// floating pointer depends on direction
		var item = items[i];
		// check file name if regular file
		if ( item.data.name && item.data.name.toLowerCase().indexOf(value.toLowerCase()) !== -1 ) {return item;}
	}
	return null;
};

/**
 * Create new item and put it in the list
 * @param {Object} download item label
 * @return {Node|null}
 */
CDownloadsList.prototype.Add = function ( download ) {
	var $name, $priority, $ico, $progress, $wrapper, item, $empty,
		self = this,
		hidden = false;
	if ( download !== undefined ) {
		// is it necessary to filter
		download.name || (download.name = download.filePath.split('/').pop());
		if ( download.state !== this.backState ) {
			hidden = this.Filter(download);
		} else {
			hidden = false;
		}

		$progress = element('div', {className: 'progress', id: 'progress_' + download.id});
		download.progressPct = Math.floor(download.progressPct * 10) / 10;
		if ( download.progressPct < 0 ) {
			download.progressPct = 0;
		}
		$progress.style.width = download.progressPct + '%';
		$ico = element('div', {className: 'ico'});
		$name = element('div', {className: 'name'}, download.name || download.filePath.split('/').pop());
		$priority = element('div', {className: 'priority'}, [
			element('div', {className: 'full'}),
			$empty = element('div', {className: 'empty'})
		]);
		$wrapper = element('div', {className: this.classNames[download.state]}, [$progress, $ico, $name, $priority]);
		if ( this.isVisible !== true ) {
			this.Show(true);
		}
		if ( download.markable !== false ) {download.markable = true;}
		download.name = download.name || download.filePath.split('/').pop();
		item = CScrollList.prototype.Add.call(this, $wrapper, {
			$body        : $wrapper,
			hidden       : hidden,
			data         : download,
			// handlers
			onclick      : function () {
				if ( this.data.state === 3 ) {
					self.Open(this.data);
				} else if ( this.data.state === self.backState ) {
					self.SetFilterText('');
					self.onBack();
				}
				return false;
			},
			oncontextmenu: EMULATION ? null : function () {
				return false;
			}
		});
		$empty.style.height = (20 * (5 - download.prioLevel)) + '%';
		item.$priority = $empty;
		this.parent.preview.SetItemsCount();
		if ( download.state !== this.backState ) { this.indexed[download.id] = item;}
	}
	return item;
};
/**
 * Remove download from list
 * @param {Node} item download to remove
 * @param {boolean} file remove file with download
 */
CDownloadsList.prototype.Delete = function ( item, file ) {
	delete this.indexed[item.data.id];
	this.downloads.splice(this.downloads.indexOf(item.data), 1);
	stbDownloadManager.StopJob(item.data.id);
	stbDownloadManager.DeleteJob(item.data.id, this.removeFiles);
	CScrollList.prototype.Delete.call(this, item);
	if ( this.handle.childNodes.length === 0 ) { this.Show(false); }
	this.parent.preview.SetItemsCount();
	if ( typeof this.onRemove === 'function' ) { this.onRemove(); }
};

/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 * @param {Node} [previous] the old focused item
 */
CDownloadsList.prototype.onFocus = function ( item, previous ) {
	var self = this;
	if ( item ) {
		// clear delayed call
		if ( this.timer ) {clearTimeout(this.timer);}
		// preview and MediaBrowser itself are available
		if ( self.parent.preview.isVisible && self.parent.isVisible ) {
			// add delay
			this.timer = setTimeout(function () {
				// show info in preview block
				self.parent.preview.info(item.data);
			}, 400);
		}
	}
};

/**
 * Hook method on item internal states change
 * should be declared in child to invoke
 * @param {Node} item the new focused item
 * @param {string} option affected item state name
 * @param {string|boolean} oldVal previous state value
 * @param {string|boolean} newVal new state value
 */
CDownloadsList.prototype.onStateChange = function ( item, option, oldVal, newVal ) {
	var marked = Array.isArray(this.states.marked) ? this.states.marked : [];
	// there are some selected items
	if ( marked.length > 0 ) {
		// update counter
		this.parent.preview.SetSelectedCount(marked.length);
	}
	if ( newVal === true && option === 'focused' ) {
		if ( item && item.data.state === this.backState ) {
			this.bpanel.Hidden(this.bpanel.btnSelect, true);
		} else {
			this.bpanel.Hidden(this.bpanel.btnSelect, false);
		}
	}
	// show/hide counter block
	this.parent.preview.blkSel.style.display = marked.length > 0 ? 'inline-block' : 'none';
};

/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
CDownloadsList.prototype.Clear = function () {
	CScrollList.prototype.Clear.call(this);
};

/**
 * The main method of an item opening
 * @param {Object} download media item inner data
 */
CDownloadsList.prototype.Open = function ( download ) {
	echo(download, 'CDownloadsList.Open :: data');
	var path = download.mountPoint + '/' + download.filePath;
	if ( gSTB.IsFileExist(path) ) {
		if ( this.playableTypes.indexOf(getMediaType(download.name || download.filePath.split('/').pop())) !== -1 ) {
			stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'player.play', path);
		} else {
			new CModalHint(this.parent, _('Unsupported format'), 5000);
		}
	} else {
		new CModalHint(this.parent, _('File not found'), 5000);
	}

};

/**
 * Open root, clear all breadcrumbs, search options
 */
CDownloadsList.prototype.Reset = function () {
	this.parentItem = null;
	this.mode = MEDIA_TYPE_IB_ROOT;
	this.sortType = DOWNLOAD_SORT_STATE;
	this.path = [];
	this.filterType = MEDIA_TYPE_NONE;
	this.SetData(this.downloads);
	// reset view
	window.scrollTo(0, 0);
	// linked components
	if ( this.sbar ) {this.sbar.Reset();}
};


/**
 * Clear the list and fill it again (will try to refocus)
 * @param {boolean} [refocus=true] if true then try to set focus to the previous focused element
 * @param {Object} downloads downloads data
 */
CDownloadsList.prototype.Refresh = function ( refocus, downloads ) {
	var data = null;
	// some media item is opened at the moment
	if ( this.parentItem !== null ) {
		// get current focused item
		if ( refocus !== false && this.activeItem ) {data = this.activeItem.data;}
		// refill
		this.SetData(downloads || this.downloads);
		// find it in the new list if necessary
		this.Reposition(data);
	}
};


/**
 * Handle checked state for the given item according to the file type.
 * Mark only items available for marking.
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
CDownloadsList.prototype.Marked = function ( item, state ) {
	// item exists and only allowed types
	if ( item && item.data && item.data.markable ) {
		// parent marking
		return CScrollList.prototype.Marked.call(this, item, state);
	}
	return false;
};
/**
 * Increase of decrease download priority
 * @param {Node} item item to increase priority
 * @param {number} inc inc priority to this
 */
CDownloadsList.prototype.IncPriority = function ( item, inc ) {
	var download = item.data;
	download.prioLevel += inc;
	if ( download.prioLevel < 1 ) {
		download.prioLevel = 1;
	} else if ( download.prioLevel > 5 ) {
		download.prioLevel = 5;
	}
	stbDownloadManager.AdjustJobPriorityV2(download.id, download.prioLevel);
	item.$priority.style.height = (20 * (5 - download.prioLevel)) + '%';
};


/**
 * Show/hide file items according to the specified filter options
 * @param {number} type filter file type option
 */
CDownloadsList.prototype.SetSortType = function ( type ) {
	// set global
	this.sortType = type;
	// apply filter
	this.Refresh(true);
};
/**
 * Show/hide file items according to the specified filter options
 * @param {number} type filter file type option
 */
CDownloadsList.prototype.SetFilterType = function ( type ) {
	// set global
	this.filterType = type;
	// apply filter
	this.Refresh(true);
};

CDownloadsList.prototype.Length = function () {
	var length = 0, self = this;
	this.Each(function ( item ) {
		if ( item.hidden !== true && item.data.state != self.backState ) {length++;}
	});
	return length;
};

/**
 * Show/hide file items according to the specified filter options
 * @param {string} text filter file name option
 */
CDownloadsList.prototype.SetFilterText = function ( text ) {
	// set global (case conversion for future string comparison speedup)
	this.filterText = text.toLowerCase();
	// apply filter
	this.Refresh(true);
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
CDownloadsList.prototype.ActiveItems = function () {
	// get all marked items
	var items = Array.isArray(this.states.marked) ? this.states.marked.slice() : [];
	// no marked, check current and its type
	if ( items.length === 0 && this.activeItem && this.activeItem.data.markable ) {
		items.push(this.activeItem);
	}
	return items;
};


/**
 * Moves the cursor to the given element
 * @param {Object} data
 * @param {boolean} [manageFocus=true] flag to manage focus handling
 * @return {boolean} operation status
 */
CDownloadsList.prototype.Reposition = function ( data, manageFocus ) {
	// find it in the new list if necessary
	if ( data ) {
		for ( var item, i = 0, l = this.Length(); i < l; i++ ) {
			item = this.handleInner.children[i];
			// url and type match
			if ( data.id === item.data.id ) {
				// make it active again
				if ( item.style.display !== 'hidden' ) {
					this.SetPosition(item, true, manageFocus !== false);
					// preview is available
					if ( this.parent.preview.isVisible ) {
						// show info in preview block
						this.parent.preview.info(item.data);
					}
					return true;
				} else {
					return false;
				}
			}
		}
	}
	return false;
};


/**
 * Global object ListDir wrapper
 * @param {string} path directory to list
 * @return {{dirs:[{name:String}], files:[{name:String, ext:String, size:Number, type:Number}]}}
 */
CDownloadsList.prototype.ListDir = function ( path ) {
	// result list
	var dirs, files,
		data = { dirs: [], files: [] };
	// check input
	if ( path !== undefined && path !== '' ) {
		// get data
		try {
			eval(gSTB.ListDir(path, false));
		} catch ( e ) {
			echo(e);
			dirs = [];
			files = [];
		}
		// fill list of dirs
		if ( Array.isArray(dirs) && dirs.length > 0 ) {
			// clear from empty items
			dirs = dirs.filter(function ( dir ) {
				return dir !== '';
			});
			// fill dirs
			dirs.forEach(function ( dir ) {
				// strip ending slash
				dir = dir.slice(0, -1);
				// valid filled name
				if ( dir ) {data.dirs.push({name: dir, type: MEDIA_TYPE_FOLDER});}
			});
		}
		// fill list of files
		if ( Array.isArray(files) && files.length > 0 ) {
			// clear from empty items
			files = files.filter(function ( file ) {
				return file.name !== undefined;
			});
			// add file types
			files.forEach(function ( file ) {
				file.ext = file.name.split('.').pop();
			});
			data.files = files;
		}
	}

	return data;
};
