/**
 * Item list navigation module
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * @class CScrollList
 * @param parent
 * @constructor
 */
function CScrollList ( parent ) {
	// parent constructor
	CBase.call(this, parent);

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CScrollList';

	/**
	 * CSS class name associated with the component
	 * @type {string}
	 */
	this.baseClass = 'cslist-main';
    /**
     * Shows the possibility of multiple selection
     * @type {boolean}
     */
    this.multipleSelection = true;

	/**
	 * the current selected item
	 * @type {Node}
	 */
	this.activeItem = null;

	/**
	 * List of items for each state flag
	 * Example: {focused:[item], marked:[item,item]}
	 * @type {Object}
	 */
	this.states = {};

	/**
	 * Default settings for focus management in list
	 * @type {boolean}
	 */
	this.manageFocus = true;

	/**
	 * default item attribute values
	 * used for an item initialization
	 * @namespace
	 * @property {boolean} hidden   display or not
	 * @property {boolean} marked   initial checked state
	 * @property {boolean} disabled can be focused or not
	 * @property {boolean} focused  initial focused state
	 */
	this.defaultParams = {
		hidden   : false,  // display or not
		marked   : false,  // initial checked state
		disabled : false,  // can be focused or not
		focused  : false,  // initial focused state
		href     : '#',    // empty link
		self     : this,   // back link to the component itself
		// flag to manage focus handling
		manageFocus   : true,
		// right mouse click (suppress the context menu)
		oncontextmenu: EMULATION ? null : function () { return false; },
		// mouse click on the item or Ok/Enter key
		onclick : function() {
			// activate item
			this.self.Focused(this, true);
			return false;
		},
		onmouseover : function() {
			// activate item
			this.self.Focused(this, true);
			return false;
		}
	};

	/**
	 * default item filter values
	 * used for focus handling
	 * @type {Object}
	 */
	this.defaultFilter = {
		hidden   : false,  // visible
		disabled : false   // enabled
	};

	/**
	 * scrolling method on up/down arrows
	 * 0 - no special way (default browser shift to the center on focus)
	 * 1 - focus is always centered (convenient but redraw the whole container on each step)
	 * 2 - shift by pages (quick and low resources)
	 * @type {number}
	 */
	this.scrollMode = 2;

	/**
	 * render mode: one by one
	 * @type {number}
	 */
	this.RENDER_MODE_SINGLE = 1;
	/**
	 * render mode: collect all added to the fragment and in the end render everything at once
	 * @type {number}
	 */
	this.RENDER_MODE_BULK   = 2;

	/**
	 * current render mode (one by one is the default)
	 * @type {number}
	 */
	this.renderMode = this.RENDER_MODE_SINGLE;

	/**
	 * buffer for added items in the bulk mode
	 * @type {DocumentFragment}
	 */
	this.fragment = document.createDocumentFragment();
}

// extending
CScrollList.prototype = Object.create(CBase.prototype);
CScrollList.prototype.constructor = CScrollList;


/**
 * Component initialization with its placeholder.
 * Should be called once before use just after constructor invoke and all hooks preparation.
 * @param {Node} handle component placeholder (it should be an empty div element)
 */
CScrollList.prototype.Init = function ( handle ) {
	// parent call init with placeholder
	CBase.prototype.Init.call(this, handle);

	var self = this;
	this.handleInner.onmousewheel = function( event ) {
		// direction and new focused item
		var direction = event.wheelDeltaY > 0;
		var found = self.Next(null, direction);
		// apply
		if ( found ) {
			self.MoveNext(direction ? -1 : 1);
			self.Focused(found, true);
		}
		event.stopPropagation();
		// prevent
		return false;
	};
};


/**
 * Create a new item and add it to the placeholder
 * visible/enabled/not focused and not checked by default
 * corresponding css classes (the same names as flags):
 *     hidden   - for invisible items
 *     marked   - for checked items
 *     disabled - for items that can't be focused or selected
 *     focused  - for a single item active at the moment
 * @param {string|Node|Array} body item content
 * @param {Object} [attrs] list of element attributes
 * @return {Node} created item element
 */
CScrollList.prototype.Add = function ( body, attrs ) {
	// check input
	attrs = attrs || {};
	// new item body
	var item = element('a', this.defaultParams, body);
	// mode-specific
	if ( this.renderMode === this.RENDER_MODE_BULK ) {
		// add item to buffer
		this.fragment.appendChild(item);
	} else {
		// add item to DOM container
		this.handleInner.appendChild(item);
	}
	// apply flags and decoration
	if ( attrs.hidden   ) { this.Hidden(item,   true); }
	if ( attrs.marked   ) { this.Marked(item,   true); }
	if ( attrs.disabled ) { this.Disabled(item, true); }
	if ( attrs.focused  ) { this.Focused(item,  true, attrs.manageFocus); }
	// apply custom attributes with the current defaults
	for ( var name in attrs ) {
		if ( attrs.hasOwnProperty(name) ) { item[name] = attrs[name]; }
	}
	// result element
	return item;
};


/**
 * Add all the added items to the DOM
 */
CScrollList.prototype.Render = function () {
	// add the buffer to DOM container
	if ( this.fragment.childNodes.length > 0 ) {
		this.handleInner.appendChild(this.fragment);
	}
};


/**
 * Reset and clear all items and options.
 * This will make the component ready for a new filling.
 */
CScrollList.prototype.Clear = function () {
	// cleaning all items
	this.handleInner.innerHTML = null;  // not a life-saver :/
	// vars
	this.activeItem = null;
	this.states = {};
};


/**
 * Reset only the given item to the default state
 * @param {Node} item the element to be processed
 */
CScrollList.prototype.Reset = function ( item ) {
	// valid html element given
	if ( item && item.nodeName ) {
		// apply flags and decoration
		this.Hidden(item,   this.defaultParams.hidden);
		this.Marked(item,   this.defaultParams.marked);
		this.Disabled(item, this.defaultParams.disabled);
		this.Focused(item,  this.defaultParams.focused);
		// clear focus pointer if necessary
		if ( item === this.activeItem && !item.focused ) { this.activeItem = null; }
	}
};


/**
 * Removes the given elements and reposition the focus
 * @param {[Node]} items list of elements to be processed
 */
CScrollList.prototype.DeleteAll = function ( items ) {
	var self   = this,
		curPos = null;
	// collect affected items
	// there are some
	if ( Array.isArray(items) && items.length > 0 ) {
		// clear focus (for future refocus)
		if ( document.activeElement !== null && document.activeElement.parentNode === this.handleInner ) { document.activeElement.blur(); }
		// cursor position
		if ( items.indexOf(this.Current()) === -1 ) {
			// not intersect
			curPos = this.Current();
		} else {
			// get the next good (scan down)
			curPos = this.Next({marked:false, hidden:false, disabled:false});
			// not found or the last in the list
			if ( curPos === null || curPos === this.Current() ) {
				// scan up
				curPos = this.Next({marked:false, hidden:false, disabled:false}, true);
			}
		}
		// apply
		items.forEach(function ( item ) {
			self.Delete(item);
		});
		// the nearest available item
		if ( curPos !== null ) {
			this.Focused(curPos, true);
			this.SetPosition(curPos, true);
		}
	}
};


/**
 * Remove the given item and clear inner states if necessary
 * @param {Node} item the element to be processed
 */
CScrollList.prototype.Delete = function ( item ) {
	// valid html element given
	if ( item && item.nodeName && item.parentNode === this.handleInner ) {
		// clear states
		for ( var name in this.states ) {
			if ( this.states.hasOwnProperty(name) ) {
				// find
				var index = this.states[name].indexOf(item);
				// remove
				if ( index !== -1 ) { this.states[name].splice(index, 1); }
			}
		}
		// clear focus pointer if necessary
		if ( item === this.activeItem ) { this.activeItem = null; }
		// delete dom element
		this.handleInner.removeChild(item);
	}
};


/**
 * Getter for currently focused element
 * @return {Node} or null if there is no such item
 */
CScrollList.prototype.Current = function () {
	return this.activeItem;
};


/**
 * Getter for element total number (actual items + buffered and not yet rendered)
 * @return {number}
 */
CScrollList.prototype.Length = function () {
	return this.handleInner.children.length + this.fragment.childNodes.length;
};


/**
 * Set inner item flags and decoration
 * @param {Node} item the element to be processed
 * @param {string} option item inner flag name
 * @param {boolean} state flag of the operation (true if change is made)
 * @return {boolean} operation status
 */
CScrollList.prototype.SetState = function ( item, option, state ) {
	state = Boolean(state);
	// current and new states are different
	if ( item[option] !== state ) {
		// check if exist
		if ( !this.states[option] ) { this.states[option] = []; }
		var index = this.states[option].indexOf(item);
		// update internal list
		if ( state ) {
			// add to the list
			if ( index === -1 ) { this.states[option].push(item); }
		} else {
			// remove
			if ( index !== -1 ) { this.states[option].splice(index, 1); }
		}
		var oldVal = item[option];
		// flag
		item[option] = state;
		// decoration
		if ( state ) {
			// add the corresponding class
			item.classList.add(option);
		} else {
			// remove the corresponding class
			item.classList.remove(option);
		}
		// call user hook
		if ( typeof this.onStateChange === 'function' ) { this.onStateChange(item, option, oldVal, state); }
		return true;
	}
	// nothing has changed
	return false;
};


/**
 * Handle visibility state for the given item
 * also correct check/focus state if hiding
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
CScrollList.prototype.Hidden = function ( item, state ) {
	state = Boolean(state);
	// valid html element given
	if ( item && item.nodeName ) {
		// flag and decoration
		var changed = this.SetState(item, 'hidden', state);
		// operation ok and the item is hidden
		if ( changed && state ) {
			// clear internal cursor if necessary
			if ( item.focused ) { this.activeItem = null; }
			// uncheck and remove focus
			this.SetState(item, 'marked', false);
			this.SetState(item, 'focused', false);
		}
		// operation status
		return changed;
	}
	// failure
	return false;
};


/**
 * Handle checked state for the given item
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
CScrollList.prototype.Marked = function ( item, state ) {
    var self = this;
	state = Boolean(state);
	// valid html element given, enabled and visible
	if ( item && item.nodeName && !item.disabled && !item.hidden ) {
        if (this.multipleSelection === false) {
            (this.states.marked || []).forEach(function(marked){
                self.SetState(marked, 'marked', false);
            });
		}
		// operation status
		return this.SetState(item, 'marked', state);
	}
	// failure
	return false;
};


/**
 * Handle enable/disable state for the given item
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
CScrollList.prototype.Disabled = function ( item, state ) {
	state = Boolean(state);
	// valid html element given
	if ( item && item.nodeName ) {
		// flag and decoration
		var changed = this.SetState(item, 'disabled', state);
		// operation ok and the item is disabled
		if ( changed && state ) {
			// clear internal cursor if necessary
			if ( item.focused ) { this.activeItem = null; }
			// uncheck and remove focus
			this.SetState(item, 'marked', false);
			this.SetState(item, 'focused', false);
		}
		// operation status
		return changed;
	}
	// failure
	return false;
};


/**
 * Handle focus state for the given item
 * also removes the focus from the previously focused item
 * @param {Node} item the element to be processed
 * @param {boolean} [state=true] flag of the state
 * @param {boolean} [manageFocus=true] flag to manage focus handling
 * @return {boolean} operation status
 */
CScrollList.prototype.Focused = function ( item, state, manageFocus ) {
	var changed = false,
		prevent = false;
	state = state !== false;
	if (manageFocus === undefined) { manageFocus = this.manageFocus; }
	// valid html element given, enabled and visible
	if ( item && item.nodeName && !item.disabled && !item.hidden ) {
		// states differ
		if ( state !== item.focused ) {
			if ( state ) {
				// different items (not currently active item)
				if ( item !== this.activeItem ) {
					// call user hook which can prevent further processing
					if ( typeof this.onFocus === 'function' ) { prevent = this.onFocus(item, this.activeItem); }
					// block or not
					if ( !prevent ) {
						// flag and decoration
						changed = this.SetState(item, 'focused', state);
						// clear the previously focused item
						this.Focused(this.activeItem, false, manageFocus);
						// global flag
						this.activeItem = item;
						// set actual focus if necessary
						if ( manageFocus !== false ) { this.activeItem.focus(); }
					}
				}

			} else {
				// flag and decoration
				changed = this.SetState(item, 'focused', state);
				// focus removed if necessary
				if ( manageFocus !== false ) { this.activeItem.blur(); }
				this.activeItem = null;
			}
		}
	}
	// operation status
	return changed;
};


/**
 * Make the whole component active, set focused item and give actual focus
 * give a focus to the appropriate item (last focused or the first one)
 * @param {boolean} [state=true] set active or deactivate
 * @param {boolean} [manageFocus=true] focus handling mode: true - set/remove focus accordingly, false - manual focus management
 * @return {boolean} operation status
 */
CScrollList.prototype.Activate = function ( state, manageFocus ) {
	if (manageFocus === undefined) { manageFocus = this.manageFocus; }
	// parent call
	CBase.prototype.Activate.call(this, state);
	if ( this.isActive ) {
		// get the first good one
		this.activeItem = this.activeItem || this.FindOne();
		// still no active item
		if ( this.activeItem === null ) { return false; }
		// flag and decoration
		this.SetState(this.activeItem, 'focused', true);
		// make it focused
		this.SetPosition(this.activeItem);
		if ( manageFocus !== false ) { this.activeItem.focus(); }
	} else {
		// remove focus if there is an element
		if ( this.activeItem ) { this.activeItem.blur(); }
	}
	// all is ok
	return true;
};


/**
 * Go through all the items
 * @param {Function} callback iteration callback function
 */
CScrollList.prototype.Each = function ( callback ) {
	Array.prototype.forEach.call(this.handleInner.children, callback);
};


/**
 * Get item list according to the given filter conditions and amount limitation
 * @param {Object} [filter=this.defaultFilter] list of attributes for searching
 * @param {number} [limit=0] amount of items to get (0 - all possible)
 * @param {boolean} [reverse=false] to invert search direction (true - search backwards, false - from first to last)
 * @return {Node[]} found items
 */
CScrollList.prototype.Find = function ( filter, limit, reverse ) {
	// preparing
	var match,                              // flag for items comparison
		found = [],                         // result item list
		items = this.handleInner.children,  // all list items
		itlen = items.length,               // item list amount
		citem = null;                       // current item pointer
	// use default if not set
	filter = filter || this.defaultFilter;
	// iterate all items till all items are found
	for ( var i = 0; i < itlen; i++ ) {
		// floating pointer depends on direction
		citem = items[reverse ? itlen-i-1 : i];
		// init state
		match = true;
		// check all the filter attributes (all should match)
		for ( var attr in filter ) {
			if ( filter.hasOwnProperty(attr) ) { match = match && (citem[attr] === filter[attr]); }
		}
		// matched item
		if ( match ) {
			// add to the result list
			found.push(citem);
			// check limit and exit if set and enough
			if ( limit && found.length >= limit ) { break; }
		}
	}
	return found;
};


/**
 * Get the first item matching the given filter conditions
 * @param {Object} [filter=this.defaultFilter] list of attributes for searching
 * @param {boolean} [reverse=false] to invert search direction (true - search backwards, false - from first to last)
 * @return {Node|null} found item or null
 */
CScrollList.prototype.FindOne = function ( filter, reverse ) {
	return this.Find(filter, 1, reverse).pop() || null;
};


/**
 * Get the next/previous item from the current focused item
 * according to the given filter and search direction
 * searching for a closest next item by default
 * can go to the next/previous page with nskip = items-per-page
 * @param {Object} [filter=this.defaultFilter] list of attributes for searching
 * @param {boolean} [reverse=false] to invert search direction (true - return previous, false - next)
 * @param {number} [nskip=0] amount of items to skip
 * @param {boolean} [toend=false] correction for tiled list
 * @return {Node|null} found item or null if there are no suitable ones
 */
CScrollList.prototype.Next = function ( filter, reverse, nskip, toend ) {
	// preparing
	var match,                        // flag for items comparison
		suitable  = this.activeItem,  // the last found matching item (starting from the current)
		pointer   = this.activeItem,  // the floating current item for processing
		skipcount = 0;                // counter of found items per page
	// amount of items to skip
	nskip = nskip || 0;
	// there is a starting item
	if ( pointer ) {
		// use default if not set
		filter = filter || this.defaultFilter;
		// iterate from the current position till the edge of the list
		while ( (pointer = (reverse ? pointer.previousSibling : pointer.nextSibling)) ) {
			// suitable by default
			match = true;
			// check all the filter attributes (all should match)
			for ( var attr in filter ) {
				if ( filter.hasOwnProperty(attr) ) { match = match && (pointer[attr] === filter[attr]); }
			}
			// count only visible items
			if ( !pointer.hidden ) { skipcount++; }
			// suitable item is found
			if ( match ) {
				// matching becomes the current
                if (toend !== false) { suitable = pointer; }
				// skip item correction if necessary
				if ( nskip === 0 || (nskip > 0 && skipcount >= nskip) ) { return pointer; }
			}
		}
	}
	return suitable;
};


/**
 * Set scroll position relatively some list element
 * @param {Object} item
 * @param {boolean} [makeFocused] - apply all attributes and corresponding actions
 * @param {boolean} [manageFocus] - set actual focus
 */
CScrollList.prototype.SetPosition = function ( item, makeFocused, manageFocus ) {
	var index, page;
	if ( makeFocused ) {
		if ( manageFocus === undefined ) { manageFocus = this.manageFocus; }
		this.Focused(item || this.FindOne(), true, manageFocus);
	}
	if ( this.activeItem !== null ) {
		index = this.activeItem.offsetTop / this.itemHeight;
		page = Math.floor(index / this.itemsPerPage);
		// different methods to scroll
		if ( this.scrollMode === 1 ) {
			this.handleInner.scrollTop = (index - Math.floor((this.itemsPerPage - 1) / 2)) * this.itemHeight;
		} else if ( this.scrollMode === 2 ) {
			this.handleInner.scrollTop = (this.itemsPerPage * this.itemHeight * page);
		}
	}
};


/**
 * Handle external events
 * @param {Event} event global event object
 * @param {Object} [filter=this.defaultFilter] list of attributes for searching
 * @param {boolean} [manageFocus=this.manageFocus]
 */
CScrollList.prototype.EventHandler = function ( event, filter, manageFocus ) {
	var found = null;
	if (manageFocus === undefined) { manageFocus = this.manageFocus; }
	if (event.stopped === true) { return; }
	// moving direction
	switch ( event.code ) {
		case KEYS.PAGE_UP:
		case KEYS.PAGE_DOWN:
			// jump to the next/previous item skipping page amount of items
			found = this.Next(filter, event.code !== KEYS.PAGE_DOWN, this.itemsPerPage);
			// correct visible view
			this.handleInner.scrollTop = this.handleInner.scrollTop + (event.code === KEYS.PAGE_UP ? -1 : 1 ) * this.itemsPerPage * this.itemHeight;
			break;
		case KEYS.LEFT:
		case KEYS.RIGHT:
		case KEYS.HOME:
		case KEYS.END:
			// look for a single item from the beginning or end of the list
			found = this.FindOne(filter, event.code === KEYS.RIGHT || event.code === KEYS.END);
			break;
		case KEYS.UP:
		case KEYS.DOWN:
			// jump to the next/previous item
			found = this.Next(filter, event.code === KEYS.UP);
			// there is a selection
			this.MoveNext(event.code === KEYS.UP ? -1 : 1);
			break;
		case KEYS.OK:
			// blank but necessary to prevent suppression
			// !exit!
			if ( this.activeItem ) { this.activeItem.onclick(); }  // commented to prevent double invoke
			event.preventDefault();
			return;
		default:
			// suppress everything else and exit
			//event.preventDefault();
			return;
	}
	event.preventDefault();
	// make focused the first item if not found
	this.Focused(found || this.FindOne(filter), true, manageFocus);
};


/**
 * Scroll by page if needed
 * @param direction scroll direction
 * @constructor
 */
CScrollList.prototype.MoveNext = function (direction){
	if ( this.activeItem !== null ) {
		// different methods to scroll
		if ( this.scrollMode === 1 ) {
			// focus is always centered (convenient but redraw the whole container on each step)
			this.handleInner.scrollTop = this.activeItem.offsetTop - Math.floor((this.itemsPerPage-1)/2) * this.itemHeight + direction * this.itemHeight;
		} else if ( this.scrollMode === 2 ) {
			// shift by pages (quick and low resources)
			if ( direction === -1 ) {
				if ( this.activeItem.offsetTop === this.handleInner.scrollTop ) {
					this.handleInner.scrollTop = this.handleInner.scrollTop - this.itemsPerPage * this.itemHeight;
				}
			} else {
				if ( this.activeItem.offsetTop - this.handleInner.scrollTop === (this.itemsPerPage-1) * this.itemHeight ) {
					this.handleInner.scrollTop = this.handleInner.scrollTop + this.itemsPerPage * this.itemHeight;
				}
			}
		}
	}
};


/**
 * Hook method on focus item change
 * should be declared in child to invoke
 * @param {Node} item the new focused item
 * @param {Node} previous the old focused item
 * @return {boolean} true - prevent focus from changing, false|undefined - usual behaviour
 */
CScrollList.prototype.onFocus = null;


/**
 * Hook method on item internal states change
 * should be declared in child to invoke
 * @param {Node} item the new focused item
 * @param {string} option affected item state name
 * @param {string|boolean} oldVal previous state value
 * @param {string|boolean} newVal new state value
 */
CScrollList.prototype.onStateChange = null;


Object.defineProperty(CScrollList.prototype, 'itemsPerPage', {
	get: function () {
		if ( this._itemsPerPage ) {
			return this._itemsPerPage;
		} else {
			return (this._itemsPerPage = Math.round(this.handleInner.offsetHeight / this.handleInner.firstChild.offsetHeight));
		}
	}
});


Object.defineProperty(CScrollList.prototype, 'itemHeight', {
	get: function () {
		if ( this.handleInner.firstChild ) {
			return this.handleInner.firstChild.offsetHeight;
		} else {
			return 0;
		}
	}
});
