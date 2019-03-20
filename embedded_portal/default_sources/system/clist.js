/**
 * Item list without native scroll navigation module
 * @author Roman Stoian
 */

'use strict';

/**
 * @class CList
 * @param parent
 * @param {Object} customParams
 * @constructor
 */
function CList ( parent, customParams ) {
	// parent constructor
	CBase.call( this, parent );

	if ( !customParams ) {
		customParams = {};
	}

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CList';

	/**
	 * CSS class name associated with the component
	 * @type {string}
	 */
	this.baseClass = 'clist-main';
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
	this.items = [];
	this.list = [];
	this.itemIndex = 0;
	this.listIndex = 0;
	this.pageIndex = 0;
	this.itemsHandle = null;
	this.scrollHandle = null;
	this.scrollThumb = null;

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
	this.manageFocus = false;

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
		hidden: false,  // display or not
		marked: false,  // initial checked state
		disabled: false,  // can be focused or not
		focused: false,  // initial focused state
		self: this,   // back link to the component itself
		index: -1, // index of list elements
		data: null,
		// flag to manage focus handling
		manageFocus: false,
		// right mouse click (suppress the context menu)
		oncontextmenu: EMULATION? null : function () {
			return false;
		},
		// mouse click on the item or Ok/Enter key
		onclick: function () {
			// activate item
			this.self.OnMouseover( this  );
			this.self.pressOK( this );
			return false;
		},
		onmouseover: function () {
			// activate item
			this.self.OnMouseover( this );
			return false;
		}
	};

	if ( customParams.defaultParams ) {
		this.defaultParams = extend ( this.defaultParams, customParams.defaultParams );
	}

	this.onPage = customParams.onPage ? customParams.onPage : (function () {
		var count = {
			480: 5,
			576: 6,
			720: 7,
			1080: 7
		};
		return count[ screen.height ];
	})();

	this.fillsName = customParams.fillsName ? customParams.fillsName : {
		text: 'text',
		data: 'data'
	};

	/**
	 * default item filter values
	 * used for focus handling
	 * @type {Object}
	 */
	this.defaultFilter = {
		hidden: false,  // visible
		disabled: false   // enabled
	};

	/**
	 * buffer for added items in the bulk mode
	 * @type {DocumentFragment}
	 */
	this.fragment = document.createDocumentFragment();
}

// extending
CList.prototype = Object.create ( CBase.prototype );
CList.prototype.constructor = CList;


/**
 * set list.
 * @param {Array} list
 */
CList.prototype.SetList = function ( list ) {
	if ( Array.isArray ( list ) ) {
		this.list = list;
		return true;
	}
	return false;
};

/**
 * set list.
 * @param {Array} arr list elements
 * @param {number} start position in list
 * @param {number} deleteCount count delete elements in list
 */
CList.prototype.InsertToList = function ( arr, start, deleteCount ) {
	var lastIndex = 0,
		activeItem = this.list[ this.listIndex ];
	if ( Array.isArray( arr ) && this.list.length !== 0 ) {
		lastIndex = ( this.pageIndex + 1 ) * this.onPage - 1;
		if ( !start && start !== 0 ) {
			start = this.list.length;
		}
		if ( !deleteCount ) {
			deleteCount = 0;
		} else {
			this.list.splice ( start, deleteCount );
		}
		for ( var i = 0; i < arr.length; i++ ) {
			this.list.splice ( start + i, 0, arr[ i ] );
		}
		if ( lastIndex >= start ) {
			if ( start <= this.listIndex ) {
				this.listIndex = this.FindByElement( activeItem );
				this.RefreshPageIndex();
			}
			this.FillItems();
		}
		return true;
	}
	return false;
};

/**
 * set list.
 * @param {Array} arr list elements
 */
CList.prototype.DeleteFromList = function ( arr ) {
	var index = -1,
		listIndex = this.listIndex,
		activeItem = this.list[ this.listIndex ];
	if ( Array.isArray( arr ) && this.list.length !== 0 ) {
		for ( var i = 0; i < arr.length; i++ ){
			index = this.list.indexOf( arr[ i ] );
			if( index !== -1 ) {
				this.list.splice( index, 1 );
				if ( index < listIndex ) {
					listIndex--;
				}
			}
		}
		index = this.list.indexOf( activeItem );
		if ( index === -1 ) {
			this.listIndex = listIndex;
			if ( this.listIndex >= this.list.length ){
				this.listIndex = this.list.length - 1;
			}
		} else {
			this.listIndex = index;
		}
		this.RefreshPageIndex();
		this.FillItems();
		return true;
	}
	return false;
};

/**
 * refresh page index.
 * @return {boolean} change page
 */
CList.prototype.RefreshPageIndex = function () {
	var pageIndex = this.pageIndex;

	this.pageIndex = Math.floor( this.listIndex / this.onPage );
	this.itemIndex = this.listIndex % this.onPage;

	return pageIndex !== this.pageIndex;
};

/**
 * find by element in list.
 * @param {Object} obj list elements
 * @return {number} index of element in list
 */
CList.prototype.FindByElement = function ( obj ) {
	return this.list.indexOf( obj );
};

/**
 * find by fild of element in list.
 * @param {*} value
 * @param {string} fild of list element
 * @return {number} index of element in list
 */
CList.prototype.FindByFild = function ( value, fild ) {
	var index = -1,
		map = [];
	if ( value !== undefined ) {
		if ( !fild ) {
			fild = this.fillsName.data;
		}
		map = this.list.map( function ( item ) {
			return item[ fild ];
		});
		index = map.indexOf( value );
	}
	return index;
};

/**
 * Component initialization with its placeholder.
 * Should be called once before use just after constructor invoke and all hooks preparation.
 * @param {Node} handle component placeholder (it should be an empty div element)
 */
CList.prototype.Init = function ( handle ) {
	// parent call init with placeholder
	CBase.prototype.Init.call( this, handle );
	var self = this,
		table = null;
	table = element ( 'table', {className: 'maxh maxw'},
		element ( 'tr', {}, [
			this.itemsHandle = element ( 'td', {className: 'list'} ),
			element ('td', {className: 'scroll'},
				this.scrollHandle = element ( 'div' )
			)
		])
	);
	elchild ( this.scrollHandle, this.scrollThumb = element ( 'div', {className: 'thumb'} ) );
	elchild ( this.handleInner, table );
	this.handleInner.onmousewheel = function (event) {
		// direction and new focused item
		var direction = event.wheelDeltaY > 0;
		var found = direction ? self.Prev() : self.Next();
		// apply
		if (found) {
			self.Focused(found, true);
		}
		event.stopPropagation();
		// prevent
		return false;
	};
	this.RenderBody();
};

/**
 * On show event
 */
CList.prototype.onShow = function () {
	this.setScroll();
};

/**
 * Add all the added items to the DOM
 */
CList.prototype.RenderBody = function () {
	if (this.itemsHandle.children.length === 0 || this.items.length === 0) {  //generate dome elements if this need
		this.items = [];
		for (var i = 0; i < this.onPage; i++) {
			this.items[i] = this.fragment.appendChild( element ( 'div', this.defaultParams ));
			elchild(this.items[i],this.RenderItem());
		}
		this.itemsHandle.appendChild( this.fragment );
	}
};

/**
 * Generate body item
 */
CList.prototype.RenderItem = function () {
	return null;
};

/**
 * set scroll position
 */
CList.prototype.setScroll = function () {
	var margin = 0,
		percent = 0;
	percent = Math.ceil ( this.onPage / this.list.length * 100 );
	if (percent >= 100) {
		percent = 0;
	}
	margin = Math.ceil ( this.scrollHandle.offsetHeight / Math.ceil( this.list.length / this.onPage  ) * this.pageIndex );
	this.scrollThumb.style.height = percent + '%';
	this.scrollThumb.style.marginTop = margin + 'px';
};

/**
 * Fill items
 * @params {boolean} noFocus don't set focus
 */
CList.prototype.FillItems = function ( noFocus ) {
	var startPos = this.onPage * this.pageIndex,
		listLength = this.list.length,
		active = null,
		list = [];
	for (var i = 0; i < this.onPage; i++) {
		if ( listLength > i + startPos ) {
			this.items[ i ].innerHTML = this.list[ i + startPos ][ this.fillsName.text ];
			list.push( this.list[ i + startPos ] );
			if ( this.list[ i + startPos ][ this.fillsName.data ] ) {
				this.items[ i ].data = this.list[ i + startPos ][ this.fillsName.data ];
			}
			this.items[ i ].index = i + startPos;
			this.Hidden( this.items[ i ], false );
			if ( i + startPos === this.listIndex ) {
				active = this.items[ i ];
			}
		} else {
			this.items[ i ].index = -1;
			this.items[ i ].data = null;
			this.Hidden( this.items[ i ], true );
		}
	}
	this.Reset ( active );
	if ( !noFocus ) {
		this.Focused( active, true );
	}
	this.setScroll();
	if ( typeof this.onFillItems === 'function' ) {
		this.onFillItems( active, list );
	}
	return active;
};

/**
 * Fill items
 * @params {Object} active item
 * @param {Array} list items on page
 */
CList.prototype.onFillItems = null;

/**
 * Reset and clear all items and options.
 * This will make the component ready for a new filling.
 */
CList.prototype.Clear = function () {
	// cleaning all items
	this.list = [];
	this.pageIndex = 0;
	this.itemIndex = 0;
	this.listIndex = 0;
	// vars
	this.activeItem = null;
	this.states = {};
	this.FillItems();
};


/**
 * Reset only the given item to the default state
 * @param {Node} item the element to be processed
 */
CList.prototype.Reset = function ( item ) {
	// valid html element given
	if ( item && item.nodeName ) {
		// apply flags and decoration
		this.Hidden( item, this.defaultParams.hidden );
		this.Marked( item, this.defaultParams.marked );
		this.Disabled( item, this.defaultParams.disabled );
		// clear focus pointer if necessary
		if ( item === this.activeItem && !item.focused ) {
			this.activeItem = null;
		}
		this.Focused( item, this.defaultParams.focused );
	}
};


/**
 * Getter for list length
 * @return {number}
 */
CList.prototype.Length = function () {
	return this.list.length;
};


/**
 * Set inner item flags and decoration
 * @param {Node} item the element to be processed
 * @param {string} option item inner flag name
 * @param {boolean} state flag of the operation (true if change is made)
 * @return {boolean} operation status
 */
CList.prototype.SetState = function ( item, option, state ) {
	state = Boolean( state );
	// current and new states are different
	if ( item[ option ] !== state ) {
		// check if exist
		if ( !this.states[ option ] ) {
			this.states[ option ] = [];
		}
		var index = this.states[ option ].indexOf( item );
		// update internal list
		if ( state ) {
			// add to the list
			if ( index === -1 ) {
				this.states[ option ].push( item );
			}
		} else {
			// remove
			if ( index !== -1 ) {
				this.states[ option ].splice( index, 1 );
			}
		}
		var oldVal = item[ option ];
		// flag
		item[ option ] = state;
		// decoration
		if ( state ) {
			// add the corresponding class
			item.classList.add( option );
		} else {
			// remove the corresponding class
			item.classList.remove( option );
		}
		// call user hook
		if ( typeof this.onStateChange === 'function' ) {
			this.onStateChange( item, option, oldVal, state );
		}
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
CList.prototype.Hidden = function ( item, state ) {
	state = Boolean( state );
	// valid html element given
	if ( item && item.nodeName ) {
		// flag and decoration
		var changed = this.SetState( item, 'hidden', state );
		// operation ok and the item is hidden
		if (changed && state) {
			// clear internal cursor if necessary
			if ( item.focused ) {
				this.activeItem = null;
			}
			// uncheck and remove focus
			this.SetState( item, 'marked', false );
			this.SetState( item, 'focused', false );
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
CList.prototype.Marked = function ( item, state ) {
	var self = this;
	state = Boolean( state );
	// valid html element given, enabled and visible
	if ( item && item.nodeName && !item.disabled && !item.hidden ) {
		if ( this.multipleSelection === false ) {
			( this.states.marked || [] ).forEach( function ( marked ) {
				self.SetState( marked, 'marked', false );
			});
		}
		// operation status
		return this.SetState( item, 'marked', state );
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
CList.prototype.Disabled = function ( item, state ) {
	state = Boolean( state );
	// valid html element given
	if ( item && item.nodeName ) {
		// flag and decoration
		var changed = this.SetState( item, 'disabled', state );
		// operation ok and the item is disabled
		if ( changed && state ) {
			// clear internal cursor if necessary
			if ( item.focused ) {
				this.activeItem = null;
			}
			// uncheck and remove focus
			this.SetState( item, 'marked', false );
			this.SetState( item, 'focused', false );
		}
		// operation status
		return changed;
	}
	// failure
	return false;
};

/**
 * Handle focus state for the given item on mouseover
 * also removes the focus from the previously focused item
 * @param {Node} item the element to be processed
 */
CList.prototype.OnMouseover = function ( item ) {
	if ( this.listIndex === item.index ) {
		return false;
	}
	this.listIndex = item.index;
	this.RefreshPageIndex();
	this.Focused( item, true );
};


/**
 * Handle focus state for the given item
 * also removes the focus from the previously focused item
 * @param {Node} item the element to be processed
 * @param {boolean} [state=true] flag of the state
 * @param {boolean} [manageFocus=true] flag to manage focus handling
 * @return {boolean} operation status
 */
CList.prototype.Focused = function ( item, state, manageFocus ) {
	var changed = false,
		prevent = false;
	state = state !== false;

	if ( manageFocus === undefined ) {
		manageFocus = this.manageFocus;
	}
	// valid html element given, enabled and visible
	if ( item && item.nodeName && !item.disabled && !item.hidden ) {
		// states differ
		if ( state !== item.focused ) {
			if ( state ) {
				// different items (not currently active item)
				if ( item !== this.activeItem ) {
					// call user hook which can prevent further processing
					if ( typeof this.onFocus === 'function' ) {
						prevent = this.onFocus( item, this.activeItem );
					}
					// block or not
					if ( !prevent ) {
						// flag and decoration
						changed = this.SetState( item, 'focused', state );
						// clear the previously focused item
						this.Focused( this.activeItem, false, manageFocus );
						// global flag
						this.activeItem = item;
						// set actual focus if necessary
						if ( manageFocus !== false ) {
							this.activeItem.focus();
						}
					}
				}

			} else {
				// flag and decoration
				changed = this.SetState( item, 'focused', state );
				// focus removed if necessary
				if ( manageFocus !== false ) {
					this.activeItem.blur();
				}
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
CList.prototype.Activate = function ( state, manageFocus ) {
	if ( manageFocus === undefined ) {
		manageFocus = this.manageFocus;
	}
	// parent call
	CBase.prototype.Activate.call( this, state );
	if ( this.isActive ) {
		// get the first good one
		this.activeItem = this.activeItem || this.ActiveItem();
		// still no active item
		if ( this.activeItem === null ) {
			return false;
		}
		// flag and decoration
		this.itemIndex = this.activeItem.index;
		if ( this.RefreshPageIndex() ) {
			this.FillItems();
		} else {
			this.SetState( this.activeItem, 'focused', true );
		}
		// make it focused
		if ( manageFocus === true ) {
			this.activeItem.focus();
		}
	} else {
		// remove focus if there is an element
		if ( this.activeItem ) {
			this.activeItem.blur();
		}
	}
	// all is ok
	return true;
};

/**
 * Get active item
 * @return {Node|null} found item or null
 */
CList.prototype.ActiveItem = function () {
	return this.items[ this.itemIndex ] || null;
};

/**
 * Get active items
 * @return {Array} found items
 */
CList.prototype.ActiveItems = function () {
	var list = [];
	this.items.forEach( function ( item ) {
		if ( !item.disabled && !item.hidden ) {
			list.push( item );
		}
	});
	return list;
};

/**
 * Get the next item from the current focused item
 * can go to the next page
 * @param {count} [count=1] count steps next
 * @return {Node|null} found item or null if there are no suitable ones
 */
CList.prototype.Next = function ( count ) {
	var next = null,
		endList = false;
	count = count ? count > 0 ? count : 1 : 1;
	this.itemIndex += count;
	this.listIndex += count;
	if ( this.listIndex >= this.list.length ) {
		this.listIndex = this.list.length - 1;
		endList = true;
	}
	if ( this.itemIndex >= this.onPage || endList ) {
		if ( this.RefreshPageIndex() ) {
			next = this.FillItems( false );
		} else {
			next = this.items[ this.itemIndex ];
		}
	} else {
		next = this.items[ this.itemIndex ];
	}
	this.Focused( next, true );
	return next;
};

/**
 * Get the previous item from the current focused item
 * can go to the previous page
 * @param {count} [count=1] count steps next
 * @return {Node|null} found item or null if there are no suitable ones
 */
CList.prototype.Prev = function ( count ) {
	var prev = null;
	count = count ? count > 0 ? count : 1 : 1;
	this.itemIndex -= count;
	this.listIndex -= count;
	if ( this.listIndex < 0 ) {
		this.listIndex = 0;
	}
	if ( this.itemIndex < 0 ) {
		if ( this.RefreshPageIndex() ) {
			prev = this.FillItems( false );
		} else {
			prev = this.items[ this.itemIndex ];
		}
	} else {
		prev = this.items[ this.itemIndex ];
	}
	this.Focused( prev, true );
	return prev;
};

/**
 * Set position some list element
 * @param {Object|Node} item of list or dome
 * @param {boolean} [manageFocus] - set actual focus
 */
CList.prototype.SetPosition = function ( item, makeFocused ) {
	var index = this.items.indexOf( item );
	if ( index === -1 ) {
		index = this.list.indexOf( item );
	} else {
		index = item.index;
	}
	if ( index === -1 || index === undefined ) {
		return false;
	}
	this.listIndex = index;
	if ( this.RefreshPageIndex() ) {
		this.FillItems();
	} else if ( makeFocused ) {
		this.Focused( this.items[ this.itemIndex ], true );
	}
	return true;
};

/**
 * Handle external events
 * @param {Event} event global event object
 * @param {Object} [filter=this.defaultFilter] list of attributes for searching
 * @param {boolean} [manageFocus=this.manageFocus]
 */
CList.prototype.EventHandler = function ( event, filter, manageFocus ) {
	var found = null;
	if ( manageFocus === undefined ) {
		manageFocus = this.manageFocus;
	}
	if ( event.stopped === true ) {
		return;
	}
	// moving direction
	switch ( event.code ) {
		case KEYS.PAGE_UP:
			this.Prev( this.onPage );
			break;
		case KEYS.PAGE_DOWN:
			this.Next( this.onPage );
			break;
		case KEYS.LEFT:
		case KEYS.HOME:
			this.Prev( this.list.length );
			break;
		case KEYS.RIGHT:
		case KEYS.END:
			this.Next( this.list.length );
			break;
		case KEYS.UP:
			this.Prev();
			break;
		case KEYS.DOWN:
			this.Next();
			break;
		case KEYS.OK:
			this.pressOK(this.ActiveItem());
			event.preventDefault();
			return;
		default:
			// suppress everything else and exit
			return;
	}
	event.preventDefault();
	// make focused the first item if not found
	this.Focused( found || this.ActiveItem(), true, manageFocus );
};

/**
 * Hook method on focus item change
 * should be declared in child to invoke
 * @param {Node} item the new focused item
 */
CList.prototype.pressOK = function () {};

/**
 * Hook method on focus item change
 * should be declared in child to invoke
 * @param {Node} item the new focused item
 * @param {Node} previous the old focused item
 * @return {boolean} true - prevent focus from changing, false|undefined - usual behaviour
 */
CList.prototype.onFocus = null;


/**
 * Hook method on item internal states change
 * should be declared in child to invoke
 * @param {Node} item the new focused item
 * @param {string} option affected item state name
 * @param {string|boolean} oldVal previous state value
 * @param {string|boolean} newVal new state value
 */
CList.prototype.onStateChange = null;
