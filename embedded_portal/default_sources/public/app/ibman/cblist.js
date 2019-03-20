/**
 * Component: bookmarks lister
 * bookmarks and folders lists with navigation
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * @class CBookmarkList
 * @constructor
 */
function CBookmarkList ( parent ) {
	// parent constructor
	CScrollList.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CBookmarkList';

	/**
	 * link to the BreadCrumb component
	 * @type {CBreadCrumb}
	 */
	this.bcrumb = null;

	/**
	 * link to the BreadCrumb component
	 * @type {CFilterInput}
	 */
	this.sbar = null;

	/**
	 * link to the ButtonPanel component
	 * @type {CButtonPanel}
	 */
	this.bpanel = null;

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
	 * list of media objects data
	 * full chain from the root
	 * @type {[Object]}
	 */
	this.path = [];

	/**
	 * current working mode
	 * @type {number}
	 */
	this.mode = MEDIA_TYPE_IB_ROOT;

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
	this.hideInfo = true;

	/**
	 * visibility flag for footer action buttons
	 * @type {boolean}
	 */
	this.hideF2 = true;

	/**
	 *
	 * @type {jsonDbTable}
	 */
	this.urls = null;

	/**
	 *
	 * @type {jsonDbTable}
	 */
	this.dirs = null;

	/**
	 * list of action mapped to the media types
	 * @type {Object}
	 */
	this.openAction = {};
	this.openAction[MEDIA_TYPE_BACK]    = this.OpenBack;
	this.openAction[MEDIA_TYPE_IB_ROOT] = this.OpenRoot;
	this.openAction[MEDIA_TYPE_FOLDER]  = this.OpenFolder;
	this.openAction[MEDIA_TYPE_URL]     = this.OpenUrl;
}

// extending
CBookmarkList.prototype = Object.create(CScrollList.prototype);
CBookmarkList.prototype.constructor = CBookmarkList;


/**
 * Sorts the file data
 * @param {[Object]} list array of file objects (dirs or files)
 * @param {number} sortType sorting method
 * @return {[Object]} list of sorted files
 */
CBookmarkList.prototype.Sort = function ( list, sortType ) {
	list = list || [];
	// check input
	if ( Array.isArray(list) && list.length > 0 ) {
		// case insensitive sort by name
		if ( sortType === MEDIA_ACTION_SORT_NAME && list[0].name !== undefined ) {
			list.sort(function(a, b){ return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
		} else if ( sortType === MEDIA_ACTION_SORT_TIME && list[0].time !== undefined ) {
			list.sort(function(a, b){ return b.time - a.time; });
		}
	}
	return list;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CBookmarkList.prototype.SetBreadCrumb = function ( component ) {
	this.bcrumb = component;
};


/**
 * Setter for linked component
 * @param {CFilterInput} component associated object
 */
CBookmarkList.prototype.SetSearchBar = function ( component ) {
	this.sbar = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CBookmarkList.prototype.SetButtonPanel = function ( component ) {
	this.bpanel = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CBookmarkList.prototype.SetPreviewPanel = function ( component ) {
	this.preview = component;
};


/**
 * Set bookmark data
 * @param {jsonDbTable} urls
 * @param {jsonDbTable} dirs
 */
CBookmarkList.prototype.SetData = function ( urls, dirs ) {
	this.urls = urls;
	this.dirs = dirs;
};


/**
 * Shows/hides items depending on the given filter string match
 * unmarks all hidden items
 */
CBookmarkList.prototype.Filter = function () {
	// link to the object for limited scopes
	var self = this;
	// check all items
	this.Each(function(item){
		// check file name if regular file
		var textOk = item.data.type === MEDIA_TYPE_BACK || (item.data.name && item.data.name.toLowerCase().indexOf(self.filterText) !== -1);
		// check file type if regular file
		var typeOk = item.data.type === self.filterType || self.filterType === MEDIA_TYPE_NONE || item.data.type === MEDIA_TYPE_BACK;
		// hide not matching items
		self.Hidden(item, !(textOk && typeOk));
	});
};


/**
 * Finds the first appropriate item
 * @param {string} value
 * @return {Node}
 */
CBookmarkList.prototype.FirstMatch = function ( value ) {
	// preparing
	var items = this.handleInner.children;  // all list items
	// iterate all items till all items are found
	for ( var i = 0; i < items.length; i++ ) {
		// floating pointer depends on direction
		var item = items[i];
		// check file name if regular file
		if ( item.data.type !== MEDIA_TYPE_BACK && item.data.name && item.data.name.toLowerCase().indexOf(value.toLowerCase()) !== -1 ) {
			return item;
		}
	}
	return null;
};


/**
 * Create new item and put it in the list
 * @param {string} name item label
 * @param {Object} attrs set of item data parameters
 * @return {Node|null}
 */
CBookmarkList.prototype.Add = function ( name, attrs ) {
	var self = this;

	// is it necessary to filter
	if ( this.filterText || this.filterType !== MEDIA_TYPE_NONE ) {
		// check file name if regular file
		var textOk = attrs.type === MEDIA_TYPE_BACK || (name && name.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1);
		// check file type if regular file
		var typeOk = attrs.type === this.filterType || this.filterType === MEDIA_TYPE_NONE || attrs.type === MEDIA_TYPE_BACK;
		// hide not matching items
		if ( !(textOk && typeOk) ) {
			return null;
		}
	}

	// html prepare
	var body = element('div', {className:'data'}, name);
	// decoration
	body.style.background = 'url("' + PATH_IMG_PUBLIC + 'media/type_' + attrs.type + '.png") no-repeat left';
	// make sure name is set
	if ( !attrs.name ) {
		attrs.name = name;
	}

	// make sure markable is set
	if ( attrs.markable === undefined && attrs.type !== MEDIA_TYPE_BACK ) {
		attrs.markable = true;
	}

	// actual filling
	return CScrollList.prototype.Add.call(this, body, {
		$body : body,
		data  : attrs,
		// handlers
		onclick : function(){
			// open or enter the item
			this.self.Open(this.data);
			return false;
		},
		oncontextmenu : EMULATION ? null : function(){
			// mark/unmark the item
			self.parent.actions.f3(false);
			return false;
		}
	});
};


/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 * @param {Node} [previous] the old focused item
 */
CBookmarkList.prototype.onFocus = function ( item, previous ) {
	var self = this;
	if ( item && app.views.main.mode !== app.views.main.MODE_BROWSER ) {
		this.bpanel.Hidden(this.bpanel.btnF2, item.data.type === MEDIA_TYPE_BACK);
		// clear delayed call
		if ( this.timer ) {
			clearTimeout(this.timer);
		}
		// preview and MediaBrowser itself are available
		if ( self.preview.isVisible && self.parent.isVisible ) {
			// add delay
			this.timer = setTimeout(function(){
				// show info in preview block
				self.preview.info(item.data);
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
CBookmarkList.prototype.onStateChange = function ( item, option, oldVal, newVal ) {
	var marked = Array.isArray(this.states.marked) ? this.states.marked : [];
	// there are some selected items
	if ( marked.length > 0 ) {
		// update counter
		this.preview.valSel.innerHTML = marked.length;
	}
	// show/hide counter block
	this.preview.blkSel.style.display = marked.length > 0 ? 'inline-block' : 'none';
};


/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
CBookmarkList.prototype.Clear = function () {
	CScrollList.prototype.Clear.call(this);

	// dependant component
	if ( this.sbar ) {
		this.sbar.Reset();
	}

	this.filterType = MEDIA_TYPE_NONE;
};


/**
 * Enter the item or open it
 * @param {Object} [data] media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CBookmarkList.prototype.OpenRoot = function ( data ) {
	var self = this;
	// clear
	this.Clear();
	// reset view
	window.scrollTo(0, 0);
	// allow to go back in filter
	if ( data.filterText ) {
		this.Add('..', {type:MEDIA_TYPE_BACK});
	}

	// dirs
	this.Sort(this.dirs.find({}), self.sortType).forEach(function(item){
		item.type = MEDIA_TYPE_FOLDER;
		self.Add(item.name, item);
	});

	// links
	this.Sort(this.urls.find({dir:null}), self.sortType).forEach(function(item){
		item.type = MEDIA_TYPE_URL;
		self.Add(item.name, item);
	});

	setTimeout(function(){
		self.Activate(true);
	}, 0);

	this.hideInfo = this.Length() === 0;
	this.hideF2   = this.hideInfo || (app.views.main.mode === app.views.main.MODE_BROWSER);

	// go deeper
	return self.LEVEL_CHANGE_DOWN;
};


/**
 * Enter the item or open it
 * @param {Object} [data] media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CBookmarkList.prototype.OpenBack = function ( data ) {
	var self = this;
	// there are some levels
	if ( this.path.length > 1 ) {
		// normal exit
		this.path.pop();
		if ( this.bcrumb ) {
			this.bcrumb.Pop();
		}
		// render the previous level
		this.Build(this.path[this.path.length-1]);
		// apply specific button visibility
		setTimeout(function(){
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
CBookmarkList.prototype.OpenFolder = function ( data ) {
	var self = this;
	// reset
	this.Clear();
	// reset view
	window.scrollTo(0, 0);
	this.Add('..', {type:MEDIA_TYPE_BACK});

	echo(data);
	this.urls.find({dir:data.id}).forEach(function(item){
		item.markable = true;
		item.type = MEDIA_TYPE_URL;
		self.Add(item.name, item);
	});

	setTimeout(function(){
		self.Activate(true);
	}, 0);

	self.hideInfo = false;

	// go deeper
	return this.LEVEL_CHANGE_DOWN;
};


/**
 * Enter the item or open it
 * @param {Object} [data] media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CBookmarkList.prototype.OpenUrl = function ( data ) {
	// prevent onFocus delayed action
	if ( this.timer ) {
		clearTimeout(this.timer);
	}

	app.views.main.loadUrl(data.id);

	// stay here
	return this.LEVEL_CHANGE_NONE;
};


/**
 * Renders the given media item by executing associated action
 * @param {Object} data media item inner data
 * @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
 */
CBookmarkList.prototype.Build = function ( data ) {
	var levelChange = this.LEVEL_CHANGE_NONE;
	// apply filter parameter from the current node
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
CBookmarkList.prototype.Open = function ( data ) {
	echo(data, 'CBookmarkList.Open :: data');
	// reset footer buttons
	this.hideF2   = true/* || (app.views.main.mode === app.views.main.MODE_BROWSER)*/;
	this.hideInfo = true;

	// render the list
	var levelChange = this.Build(data);

	// level changed
	if ( levelChange !== this.LEVEL_CHANGE_NONE ) {
		// particular direction
		if ( levelChange === this.LEVEL_CHANGE_DOWN ) {
			// build breadcrumbs
			if ( this.filterText ) {
				// filter
				if ( this.bcrumb ) {
					this.bcrumb.Push('/', 'media/ico_filter.png', this.filterText);
				}
			} else {
				// default
				// build breadcrumbs
				if ( this.bcrumb ) {
					this.bcrumb.Push('/', 'media/type_'+data.type+'.png', data.name ? data.name : '');
				}
			}
			// save this step
			this.path.push(data);
		} else {
			// go up
			this.Reposition(this.parentItem);
		}
		// set current working scheme
		this.mode = this.path[1] !== undefined ? this.path[1].type : MEDIA_TYPE_IB_ROOT;
		// current level item
		this.parentItem = this.path[this.path.length-1];
		// show/hide buttons
		this.bpanel.Hidden(this.bpanel.btnF2,   this.hideF2);
		this.bpanel.Hidden(this.bpanel.btnInfo, this.hideInfo);
		// update info hints
		this.preview.SetItemsCount();
	}
	return levelChange;
};


/**
 * Open root, clear all breadcrumbs, search options
 */
CBookmarkList.prototype.Reset = function () {
	this.parentItem = null;
	this.mode       = MEDIA_TYPE_IB_ROOT;
	this.sortType   = MEDIA_ACTION_SORT_NAME;
	this.path       = [];
	this.Clear();
	// reset view
	window.scrollTo(0, 0);
	// linked components
	if ( this.bcrumb ) { this.bcrumb.Reset(); }
	if ( this.sbar ) { this.sbar.Reset(); }
};


/**
 * Clear the list and fill it again (will try to refocus)
 * @param {boolean} [refocus=true] if true then try to set focus to the previous focused element
 */
CBookmarkList.prototype.Refresh = function ( refocus ) {
	var data = null;
	// some media item is opened at the moment
	if ( this.parentItem !== null ) {
		// get current focused item
		if ( refocus !== false && this.activeItem ) { data = this.activeItem.data; }
		// refill
		this.Build(this.parentItem);
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
CBookmarkList.prototype.Marked = function ( item, state ) {
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
CBookmarkList.prototype.SetFilterType = function ( type ) {
	// set global
	this.filterType = type;
	// apply filter
	this.Filter();
};


/**
 * Show/hide file items according to the specified filter options
 * @param {string} text filter file name option
 */
CBookmarkList.prototype.SetFilterText = function ( text ) {
	// set global (case conversion for future string comparison speedup)
	this.filterText = text.toLowerCase();
	// apply filter
	this.Filter();
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
CBookmarkList.prototype.ActiveItems = function () {
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
CBookmarkList.prototype.Reposition = function ( data, manageFocus ) {
	// find it in the new list if necessary
	if ( data ) {
		for ( var item, i = 0, l = this.Length(); i < l; i++ ) {
			item = this.handleInner.children[i];
			// url and type match
			if ( data.id === item.data.id ) {
				// make it active again
				this.SetPosition(item, true, manageFocus !== false);
				// preview is available
				if ( this.preview.isVisible ) {
					// show info in preview block
					this.preview.info(item.data);
				}
				return true;
			}
		}
	}
	return false;
};
