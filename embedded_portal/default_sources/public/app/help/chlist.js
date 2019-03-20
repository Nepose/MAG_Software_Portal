/**
 * Component: bookmarks lister
 * bookmarks and folders lists with navigation
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * @class CHelpList
 * @constructor
 */
function CHelpList ( parent ) {
	// parent constructor
	CTreeList.call(this, parent);

	/**
	 * link to the object for limited scopes
	 * @type {CHelpList}
	 */
	var self = this;

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CHelpList';

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
	 * link to the ButtonPanel component
	 * @type {CButtonPanel}
	 */
	this.bpanel = null;

	/**
	 * data filter for file listing
	 * @type {string}
	 */
	this.filterText = '';

	/**
	 * file items sort method
	 * @type {number}
	 */
	this.sortType = MEDIA_ACTION_SORT_TYPE;

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
	this.mode = MEDIA_TYPE_HELP_ROOT;

	/**
	 * current media object opened
	 * @type {Object}
	 */
	this.parentItem = null;

	/**
	 * field in data that contains the data of the branch
	 * @type {string}
	 */
	this.contentField = 'data';

	/**
	 * field in data that contains the title of list element
	 * @type {string}
	 */
	this.titleField = 'title';
}

// extending
CHelpList.prototype = Object.create(CTreeList.prototype);
CHelpList.prototype.constructor = CHelpList;



/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CHelpList.prototype.SetBreadCrumb = function ( component ) {
	this.bcrumb = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CHelpList.prototype.SetSearchBar = function ( component ) {
	this.sbar = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CHelpList.prototype.SetButtonPanel = function ( component ) {
	this.bpanel = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CHelpList.prototype.SetPreviewPanel = function ( component ) {
	this.preview = component;
};

CHelpList.prototype.BcrumbReset = function (){
	this.bcrumb.Reset();
	this.bcrumb.SetName(_('Help'));
	this.bcrumb.Push('/', 'type_' + MEDIA_TYPE_HELP_ROOT + '.png','', 'root');
};

/**
 * Shows/hides items depending on the given filter string match
 * unmarks all hidden items
 */
CHelpList.prototype.Filter = function () {
	// link to the object for limited scopes
	// check all items
	this.BcrumbReset();
	this.bcrumb.Push('/', 'ico_filter.png', this.filterText, 'filter');
	CTreeList.prototype.Filter.call(this, this.filterText);
};


/**
 * Finds the first appropriate item
 * @param {string} value
 * @return {Node}
 */
CHelpList.prototype.FirstMatch = function ( value ) {
	// preparing
	var items = this.handleInner.children;  // all list items
	// iterate all items till all items are found
	for ( var i = 0; i < items.length; i++ ) {
		// floating pointer depends on direction
		var item = items[i];
		// check file name if regular file
		if ( item.data.type !== MEDIA_TYPE_HELP_BACK && item.text && item.text.toLowerCase().indexOf(value.toLowerCase()) !== -1 ) { return item; }
	}
	return null;
};


/**
* Create new item and put it in the list
* @param {Object} options set of item data parameters
* @return {Node|null}
*/
CHelpList.prototype.Add = function ( options ) {
	var self = this, item;
	// actual filling
	options.data[this.titleField] = element('div', {className:'data'}, options.data['old_title'] = options.data[this.titleField]);
	if (options.data.parent !== undefined){
		options.data.sentence = (options.data.parent.data.sentence || '') + ' ' + options.data.old_title;
	}else{
		options.data.sentence = options.data.old_title;
	}
	if (options.data.type !== MEDIA_TYPE_HELP_FOLDER){
		options.data[this.titleField].style.background = "url('" + PATH_IMG_PUBLIC + 'media/type_' + options.data.type + ".png') no-repeat left";
	}
	options.attrs = {
		// handlers
			markable: true,
			onclick : function(){
				// open or enter the item
				if (this.data.type === MEDIA_TYPE_HELP_FOLDER){
					self.OpenBranch(this, !this.data.opened);
				} else {
					self.OpenArticle(this.data);
				}
				return false;
			},
			oncontextmenu : EMULATION ? null : function(){
				// mark/unmark the item
				self.parent.actions.f3(false);
				return false;
			}
		};
	item = CTreeList.prototype.Add.call(this, options);
	return item;
};


/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 * @param {Node} [previous] the old focused item
 */
CHelpList.prototype.onFocus = function ( item, previous ) {
	var self = this;
	// clear delayed call
	if ( this.timer ) {clearTimeout(this.timer);}
	if ( self.preview.isVisible && self.parent.isVisible ) {
		// add delay
		this.timer = setTimeout(function(){
			// show info in preview block
			self.preview.info(item.data);
		}, 400);
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
CHelpList.prototype.onStateChange = function ( item, option, oldVal, newVal ) {};


/**
* Reset and clear all items
* This will make the component ready for a new filling.
*/
CHelpList.prototype.Clear = function () {
	CScrollList.prototype.Clear.call(this);
	// dependant component
	if ( this.sbar ) {this.sbar.SetValue('', true);}
};

/**
* Open the specified article
* @param {Object} [item] media item inner data
* @return {number} hierarchy change flag: 0 - no change, 1 - go level deeper, -1 - go level up
*/
CHelpList.prototype.OpenArticle = function ( item ) {
	var self = this, parents = [], parent = item;
	if (parent.data){
		while(parent = parent.data.parent){
			if (parent.data.type !== MEDIA_TYPE_HELP_ROOT) {parents.push(parent);}
		}
		parents.reverse().forEach(function(parent){
			self.bcrumb.Push('/', 'type_' + MEDIA_TYPE_HELP_FOLDER + '.png', parent.data.old_title);
		});
	}
	ajax('GET', item.path, function(article){
		self.trigger('onArticleLoad', article);
	});
};


/**
 * Open root, clear all breadcrumbs, search options
 */
CHelpList.prototype.Reset = function () {
	this.parentItem = null;
	this.mode       = MEDIA_TYPE_HELP_ROOT;
	this.sortType   = MEDIA_ACTION_SORT_TYPE;
	this.filterType = MEDIA_TYPE_NONE;
	this.path       = [];
	this.Clear();
	// reset view
	window.scrollTo(0, 0);
	// linked components
	if ( this.bcrumb ) {this.bcrumb.Reset();}
	if ( this.sbar ) {this.sbar.Reset();}
};


/**
 * Handle checked state for the given item according to the file type.
 * Mark only items available for marking.
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
CHelpList.prototype.Marked = function ( item, state ) {
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
CHelpList.prototype.SetFilterType = function ( type ) {
	// set global
	this.filterType = type;
	// apply filter
	this.Filter();
};


/**
 * Show/hide file items according to the specified filter options
 * @param {string} text filter file name option
 */
CHelpList.prototype.SetFilterText = function ( text ) {
	// set global (case conversion for future string comparison speedup)
	this.filterText = text.toLowerCase();
	// apply filter
	this.Filter();
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
CHelpList.prototype.ActiveItems = function () {
	// get all marked items
	var items = Array.isArray(this.states.marked) ? this.states.marked.slice() : [];
	// no marked, check current and its type
	if ( items.length === 0 && this.activeItem && this.activeItem.data.markable ) {
		items.push(this.activeItem);
	}
	return items;
};


//Add events functionality to CHelpList
Events.inject(CHelpList);
