/**
 * Component: PVR lister
 * lists with navigation
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

/**
 * @class CPVRList
 * @constructor
 * @param {[Object]} parent - parent page
 */
function CPVRList ( parent ) {
	// parent constructor
	CScrollList.call(this, parent);

	// quick mode
	this.renderMode = this.RENDER_MODE_BULK;

	/** sort types */
	this.MEDIA_ACTION_SORT_NONE = 16;
	this.MEDIA_ACTION_SORT_TYPE = MEDIA_ACTION_SORT_TYPE;
	this.MEDIA_ACTION_SORT_TIME = MEDIA_ACTION_SORT_TIME;
	this.MEDIA_ACTION_SORT_NAME = MEDIA_ACTION_SORT_NAME;
	this.MEDIA_ACTION_SORT_SIZE = MEDIA_ACTION_SORT_SIZE;

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CPVRList';

	/**
	 * link to the BreadCrumb component
	 * @type {CBreadCrumb}
	 */
	this.bcrumb = null;

	/**
	 * link to the BreadCrumb component
	 * @type {CSearchBar}
	 */
	this.sbar = null;

	/**
	 * type filter for file listing
	 * @type {number}
	 */
	this.filterType = MEDIA_TYPE_NONE;

	/**
	 * data filter for file listing
	 * @type {string}
	 */
	this.filterText = '';

	/**
	 * file items sort method
	 * @type {number}
	 */
	this.sortType = MEDIA_ACTION_SORT_NAME;

	/**
	 * list of all media types on the current level
	 * @type {[Number]}
	 */
	this.mtypes = [];


	/**
	 * list of media objects data
	 * full chain from the root
	 * @type {[Object]}
	 */
	this.path = [];

	/**
	 * current working mode
	 * @type {number}
	 */
	this.mode = MEDIA_TYPE_PVR_ROOT;

	/**
	 * current media object opened
	 * @type {Object}
	 */
	this.parentItem = null;

	/**
	 * hierarchy change flag: no change
	 * @type {number}
	 */
	this.LEVEL_CHANGE_NONE = 0;

	/**
	 * hierarchy change flag: go level up
	 * @type {number}
	 */
	this.LEVEL_CHANGE_UP = -1;

	/**
	 * hierarchy change flag: go level deeper
	 * @type {number}
	 */
	this.LEVEL_CHANGE_DOWN = 1;

	/**
	 * visibility flag for footer action buttons
	 * @type {boolean}
	 */
	this.hideF2 = true;

	/**
	 * PVR records data
	 * @type {Array}
	 */
	this.data = null;

	/**
	 * visibility flag for footer action buttons
	 * @type {boolean}
	 */
	this.hideFrameBtn = false;

	/***
	 * index table for cslist and real data corresponding
	 * @type {Array}
	 */
	this.indexTable = {};

	/**
	 * list of action mapped to the media types
	 * @type {Object}
	 */
	this.openAction = {};
	this.openAction[MEDIA_TYPE_BACK] = this.OpenBack;
	this.openAction[MEDIA_TYPE_PVR_ROOT] = this.OpenRoot;
	this.openAction[MEDIA_TYPE_PVR_SHED] = function () {return false;};
	this.openAction[MEDIA_TYPE_PVR_REC] = function () {return false;};
	this.openAction[MEDIA_TYPE_PVR_ERR] = function () {return false;};
	this.openAction[MEDIA_TYPE_PVR_DONE] = this.OpenRecord;
}

// extending
CPVRList.prototype = Object.create(CScrollList.prototype);
CPVRList.prototype.constructor = CPVRList;


/**
 * Sorts the file data
 * @param {[Object]} list array of file objects (dirs or files)
 * @param {number} sortType sorting method
 * @return {[Object]} list of sorted files
 */
CPVRList.prototype.Sort = function ( list, sortType ) {
	list = list || [];
	echo('sortType' + sortType);
	// check input
	if ( Array.isArray(list) && list.length > 0 ) {
		// case insensitive sort by name
		list.sort(function ( a, b ) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });

		// additional sorting
		if ( sortType === this.MEDIA_ACTION_SORT_TYPE && list[0].type !== undefined ) {
			list.sort(function ( a, b ) { return a.type - b.type; });
			echo('MEDIA_ACTION_SORT_TYPE');
		} else if ( sortType === MEDIA_ACTION_SORT_NAME && list[0].name !== undefined ) {
			// case insensitive sort by name
			list.sort(function ( a, b ) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase());});
			echo('MEDIA_ACTION_SORT_NAME');
		} else if ( sortType === MEDIA_ACTION_SORT_TIME && list[0].startTime !== undefined ) {
			list.sort(function ( a, b ) { return b.startTime - a.startTime; });
			echo('MEDIA_ACTION_SORT_TIME');
		} else if ( sortType === this.MEDIA_ACTION_SORT_SIZE && list[0].duration !== undefined ) {
			echo('MEDIA_ACTION_SORT_SIZE');
			list.sort(function ( a, b ) { return a.duration - b.duration; });
		}
	}
	return list;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CPVRList.prototype.SetBreadCrumb = function ( component ) {
	this.bcrumb = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CPVRList.prototype.SetSearchBar = function ( component ) {
	this.sbar = component;
};


/**
 * Set PVR records data
 * @param {Array} data set PVR data
 */
CPVRList.prototype.SetData = function ( data ) {
	this.data = data;
};


/**
 * Shows/hides items depending on the given filter string match. Unmark all hidden items
 */
CPVRList.prototype.Filter = function () {
	// link to the object for limited scopes
	var self = this;
	// check all items
	this.Each(function ( item ) {
		// check file name if regular file
		var textOk = item.data.type === MEDIA_TYPE_BACK || (item.data.name && item.data.name.toLowerCase().indexOf(self.filterText) !== -1),
		// check file type if regular file
			typeOk = item.data.type === self.filterType || self.filterType === MEDIA_TYPE_NONE || item.data.type === MEDIA_TYPE_BACK;
		// hide not matching items
		self.Hidden(item, !(textOk && typeOk));
	});
	app.views.main.page.preview.SetItemsCount();
};


/**
 * Finds the first appropriate item
 * @param {string} value - item name
 * @return {Object} item - first appropriate item
 */
CPVRList.prototype.FirstMatch = function ( value ) {
	// preparing
	var items = this.handleInner.children;  // all list items
	// iterate all items till all items are found
	for ( var i = 0; i < items.length; i++ ) {
		// floating pointer depends on direction
		var item = items[i];
		// check file name if regular file
		if ( item.data.type !== MEDIA_TYPE_BACK && item.data.name && item.data.name.toLowerCase().indexOf(value.toLowerCase()) !== -1 ) {return item;}
	}
	return null;
};


/**
 * Create new item and put it in the list
 * @param {string} name item label
 * @param {Object} inAttrs set of item data parameters
 * @return {Object} item new item
 */
CPVRList.prototype.Add = function ( name, inAttrs ) {
	var $name, $ico, $progress, $wrapper, item,
		hidden = false,
		progress = 0,
		attrs = inAttrs,
		className = ['', 'waiting', 'running', 'error', 'done'];

	if ( attrs && attrs.type !== MEDIA_TYPE_BACK ) {
		$progress = element('div', {className: 'progress'});
		progress = (((new Date()).getTime() / 1000 - attrs.startTime) / attrs.duration) * 100;
		if ( attrs.progressPct < 0 ) { attrs.progressPct = 0; }
		attrs.progressPct = Math.floor(progress);
		$progress.style.width = (attrs.type === MEDIA_TYPE_PVR_REC) ? attrs.progressPct + '%' : '0%';
		$ico = element('div', {className: 'ico'});
		$name = element('div', {className: 'name'}, attrs.name);
		$wrapper = element('div', {className: className[attrs.state]}, [$progress, $ico, $name]);
		attrs.$progress = $progress;
	}

	// is it necessary to filter
	if ( this.filterText ) {
		// check file name if regular file
		hidden = !(attrs.name && attrs.name.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1);
	}
	if ( attrs.type !== MEDIA_TYPE_BACK ) {
		attrs.markable = true;
	} else {
		// this is 'back' item
		$wrapper = element('div', {className: 'back'}, [
			element('div', {className: 'ico'}),
			element('div', {className: 'name'}, '..')
		]);
		hidden = false;
		attrs.markable = false;
	}
	item = CScrollList.prototype.Add.call(this, $wrapper, {
		$body        : $wrapper,
		hidden       : hidden,
		disabled     : false,
		markable     : attrs.markable,
		data         : attrs,
		// handlers
		onclick      : function () {
			// open or enter the item
			if ( this.data.type === MEDIA_TYPE_BACK ) {
				this.self.Open(this.data);
				app.views.main.updatePVRData();
			}
			if ( this.data.type === MEDIA_TYPE_PVR_DONE ) { this.self.Open(this.data); }
			return false;
		},
		oncontextmenu: EMULATION ? null : function () { return false; }
	});

	if ( attrs.type !== MEDIA_TYPE_BACK && !this.indexTable[attrs.id] ) {
		echo('WE ARE ADDING NEW ITEM WITH ID' + attrs.id);
		this.indexTable[attrs.id] = item;
		// add new item to data
		var hasAlready = false;
		this.data.some(function ( item ) {
			if ( item.id === attrs.id ) {
				hasAlready = true;
				return true;
			}
		});
		if ( !hasAlready ) {this.data[attrs.id] = attrs;}
	}
	return item;
};


CPVRList.prototype.Delete = function ( item ) {
	echo('CPVRList.prototype.Delete');
	delete this.indexTable[item.data.id];
	this.data.splice(this.data.indexOf(item.data), 1);
	CScrollList.prototype.Delete.call(this, item);
	if ( this.handle.childNodes.length === 0 ) {this.Show(false); }
	this.parent.preview.SetItemsCount();
	if ( this.Length() === 0 ) {
		app.views.main.actions.frame(false); // hide info panel
	}
};


/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 * @param {Node} [previous] the old focused item
 */
CPVRList.prototype.onFocus = function ( item, previous ) {
	this.parent.buttonPanel.Hidden(this.parent.buttonPanel.btnF3, item.data.type === MEDIA_TYPE_BACK);
	return false;
};


/**
 * Hook method on item internal states change
 * should be declared in child to invoke
 * @param {Node} item the new focused item
 * @param {string} option affected item state name
 * @param {string|boolean} oldVal previous state value
 * @param {string|boolean} newVal new state value
 */
CPVRList.prototype.onStateChange = function ( item, option, oldVal, newVal ) {
	var marked = Array.isArray(this.states.marked) ? this.states.marked : [];
	// there are some selected items
	if ( marked.length > 0 ) {
		// update counter
		this.parent.preview.valSel.innerHTML = marked.length;
	}
	// show/hide counter block
	this.parent.preview.blkSel.style.display = marked.length > 0 ? 'inline-block' : 'none';
};


/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
CPVRList.prototype.Clear = function () {
	// cleaning all items
	this.handleInner.innerHTML = null;  // not a life-saver :/
	// vars
	this.activeItem = null;
	this.states = {};
	this.indexTable = {};
	// dependant component
	if ( this.sbar ) {this.sbar.Reset();}
	this.filterType = MEDIA_TYPE_NONE;
};


/**
 * Enter the item or open it
 * @param {Object} [data] media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CPVRList.prototype.OpenRoot = function ( data ) {
	echo(data, 'CPVRList.prototype.OpenRoot data:');
	var self = this;
	// clear
	this.Clear();
	// reset view
	window.scrollTo(0, 0);
	// allow to go back in filter
	if ( data.filterText ) {
		self.Add('..', {type: MEDIA_TYPE_BACK, markable: false});
	}
	// this.filterText
	this.Sort(this.data, self.sortType).forEach(function ( item ) {
		if ( !self.indexTable[item.id] ) {
			echo(item.name, 'NEW ITEM ADDED');
			item.markable = true;
			self.Add(item.fileName.split('records/')[1].split('/')[0] + ' ' + item.name, item);
		}
	});
	// Apply filter
	if ( this.filterText ) {this.Filter();}
	// hide buttons
	if ( this.Length() > 0 ) {this.hideF2 = false;}
	this.Render();
	// go deeper
	return self.LEVEL_CHANGE_DOWN;
};


/**
 * Enter the item or open it
 * @param {Object} [data] media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CPVRList.prototype.OpenBack = function ( data ) {
	var self = this;
	// there are some levels
	if ( this.path.length > 1 ) {
		// normal exit
		this.path.pop();
		if ( this.bcrumb ) {this.bcrumb.Pop();}
		// render the previous level
		this.Build(this.path[this.path.length - 1]);
		// apply specific button visibility
		setTimeout(function () {
			self.onFocus(self.Current());
		}, 0);
		// go up
		return this.LEVEL_CHANGE_UP;
	}
	// stay here
	return this.LEVEL_CHANGE_NONE;
};


/**
 * Enter the item or open it
 * @param {Object} [data] media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CPVRList.prototype.OpenRecord = function ( data ) {
	// prevent onFocus delayed action
	if ( this.timer ) {clearTimeout(this.timer);}
	echo(data.fileName);

	if ( gSTB.IsFileExist(data.fileName) ) {
		stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'player.play', data.fileName);
	} else {
		new CModalHint(this.parent, _('File not found'), 5000);
	}

	return this.LEVEL_CHANGE_NONE;
};


/**
 * Renders the given media item by executing associated action
 * @param {Object} data media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CPVRList.prototype.Build = function ( data ) {
	var levelChange = this.LEVEL_CHANGE_NONE;
	this.filterText = data.filterText ? data.filterText : '';
	// get item associated open action and execute
	if ( data && data.type && typeof this.openAction[data.type] === 'function' ) {
		levelChange = this.openAction[data.type].call(this, data);
	} else {
		// wrong item type
		new CModalAlert(this.parent, _('Error'), _('Unknown type of selected item'), _('Close'));
	}
	return levelChange;
};


/**
 * The main method of an item opening
 * @param {Object} data media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CPVRList.prototype.Open = function ( data ) {
	echo('CPVRList.Open :: data');
	// reset footer buttons
	this.hideF2 = true;
	// render the list
	var levelChange = this.Build(data);
	// level changed
	if ( levelChange !== this.LEVEL_CHANGE_NONE ) {
		// particular direction
		if ( levelChange === this.LEVEL_CHANGE_DOWN ) {
			// build breadcrumbs
			if ( this.filterText ) {
				// filter
				if ( this.bcrumb ) {this.bcrumb.Push('/', 'media/ico_filter.png', this.filterText);}
			} else {
				// default. build breadcrumbs
				if ( this.bcrumb ) {this.bcrumb.Push('/', 'media/type_' + data.type + '.png', data.name ? data.name : '');}
			}
			// save this step
			this.path.push(data);
		}
		// set current working scheme
		this.mode = (this.path[1] !== undefined) ? this.path[1].type : MEDIA_TYPE_PVR_ROOT;
		// current level item
		this.parentItem = this.path[this.path.length - 1];
		// show/hide F3 & F4 buttons
		this.parent.buttonPanel.Hidden(this.parent.buttonPanel.btnF2, this.hideF2);
		// update info hints
		this.parent.preview.SetItemsCount();
	}
	return levelChange;
};


/**
 * Open root, clear all breadcrumbs, search options
 */
CPVRList.prototype.Reset = function () {
	this.parentItem = null;
	this.mode = MEDIA_TYPE_PVR_ROOT;
	this.sortType = MEDIA_ACTION_SORT_TYPE;
	this.path = [];
	this.Clear();
	// reset view
	window.scrollTo(0, 0);
	// linked components
	if ( this.bcrumb ) {this.bcrumb.Reset();}
	if ( this.sbar ) {this.sbar.Reset();}
};


/**
 * Clear the list and fill it again (will try to refocus)
 * @param {boolean} [refocus=true] if true then try to set focus to the previous focused element
 */
CPVRList.prototype.Refresh = function ( refocus ) {
	echo('refresh');
	this.indexTable = {};
	// some media item is opened at the moment. refill
	if ( this.parentItem !== null ) { this.Build(this.parentItem); }
};


/**
 * Handle checked state for the given item according to the file type.
 * Mark only items available for marking.
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
CPVRList.prototype.Marked = function ( item, state ) {
	// item exists and only allowed types
	if ( item && item.data && item.data.markable ) {
		// parent marking
		return CScrollList.prototype.Marked.call(this, item, state);
	}
	return false;
};


/**
 * Show/hide file items according to the specified filter options
 * @param {number} type filter file type option
 */
CPVRList.prototype.SetFilterType = function ( type ) {
	// set global
	this.filterType = type;
	// apply filter
	this.Filter();
};


/**
 * Show/hide file items according to the specified filter options
 * @param {string} text filter file name option
 */
CPVRList.prototype.SetFilterText = function ( text ) {
	// set global (case conversion for future string comparison speedup)
	this.filterText = text.toLowerCase();
	// apply filter
	this.Filter();
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
CPVRList.prototype.ActiveItems = function () {
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
 * @param {Array} dataForUpdate - new data
 */
CPVRList.prototype.UpdateList = function ( dataForUpdate ) {
	var progressPct, currItem,
		self = this,
		newItem = null,
		infoRefreshFlag = false,
		className = ['', 'waiting', 'running', 'error', 'done'];

	dataForUpdate.forEach(function ( item ) {
		if ( !self.indexTable[item.id] ) {
			// Add new items
			echo(item, 'UpdateList->add new item');
			item.markable = true;
			newItem = self.Add(item.name, item);
		} else {
			// Update current item if necessary
			infoRefreshFlag = true;
			currItem = self.indexTable[item.id];
			if ( currItem.data.state !== item.state ) {
				echo(currItem, 'update item state by id ' + item.id);
				echo('className[item.state]' + className[item.state]);
				currItem.$body.className = className[item.state];
				currItem.data.type = 90 + item.state;
				currItem.data.state = item.state;
				currItem.data.status = item.status;
			}
			if ( currItem.data.endTime !== item.endTime ) {
				currItem.data.endTime = item.endTime;
				currItem.data.duration = currItem.data.endTime - currItem.data.startTime;
			}
			if ( currItem.data.type === MEDIA_TYPE_PVR_REC ) {
				progressPct = (((new Date()).getTime() / 1000 - currItem.data.startTime) / currItem.data.duration) * 100;
				progressPct = progressPct < 0 ? 0 : Math.floor(progressPct);
				currItem.data.$progress.style.width = progressPct + '%';
			}
		}
	});
	self.Render();
	if ( currCPage === 'CPageMain' ) {self.Activate(true);}
	if ( newItem ) {self.Focused(newItem, true, true);}
	if ( infoRefreshFlag && currCPage.preview && currCPage.preview.isVisible ) {currCPage.preview.onShow();}    // renew info panel
};
