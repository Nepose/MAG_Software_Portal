/**
 * Virtual file list component
 *
 * @author Stanislav Kalashnik <sk@infomir.eu> Igor Zaporozhets <deadbyelpy@gmail.com>
 */

'use strict';


/**
 * Base virtual list implementation.
 * Based on list from stb framework. but event model, and scroll bar type have been removed
 * @link https://github.com/DarkPark/stb/blob/master/app/js/ui/list.js
 *
 * @constructor
 *
 * @param {Object}   [config={}] init parameters (all inherited from the parent)
 * @param {Array}    [config.data=[]] component data to visualize
 * @param {number}   [config.size=5] amount of visible items on a page
 * @param {boolean}  [config.scrollBar=null]  ScrollBar
 */
function VList ( parent ) {
	/**
	 * Link to the currently focused DOM element.
	 *
	 * @type {Element}
	 */
	this.activeItem = null;

	/**
	 * Position of the visible window to render.
	 *
	 * @type {number}
	 */
	this.indexView = null;

	/**
	 * Component data to visualize.
	 *
	 * @type {Array}
	 */
	this.data = [];

	this.scrollBar = null;

	/**
	 * Amount of visible items on a page.
	 *
	 * @type {number}
	 */
	this.size = 7;

	this.states = {};

	// set list size by screen height
	switch ( screen.height ) {
		case 480:
			this.size = 5;
			break;
		case 576:
			this.size = 5;
			break;
		case 720:
			this.size = 7;
			break;
		case 1080:
			this.size = 7;
			break;
	}
	// parent init
	CBase.call(this, parent);
}


// inheritance
VList.prototype = Object.create(CBase.prototype);
VList.prototype.constructor = VList;





/**
 * Return items count.
 *
 * @deprecated created for other list compatibility
 *
 * @return {Number} total items count
 */
VList.prototype.Length = function () {
	return this.data.length;
};


/**
 * Fill the given item with data.
 *
 * @param {Element} $item item DOM link
 * @param {*} attrs associated with this item data
 */
VList.prototype.renderItem = function ( $item, attrs ) {
	$item.innerText = attrs.name;
};


/**
 * Fill the given item with data.
 *
 * @param {Element} $item item DOM link
 * @param {*} attrs associated with this item data
 */
VList.prototype.focus = function ( ) {
	this.$body.focus();
};


/**
 * Default method to move focus according to pressed keys.
 *
 * @param {Event} event generated event source of movement
 */
VList.prototype.EventHandler = function ( event ) {
	switch ( event.code ) {
		case KEYS.UP:
		case KEYS.DOWN:
		case KEYS.RIGHT:
		case KEYS.LEFT:
		case KEYS.PAGE_UP:
		case KEYS.PAGE_DOWN:
		case KEYS.HOME:
		case KEYS.END:
			// cursor move only on arrow keys
			this.move(event.code);
			break;
		case KEYS.OK:
			// there are some listeners
			this.activeItem.onclick();
			break;
	}
	event.preventDefault();
};


/**
 * Initialize list UI.
 *
 * @param {Object} config config object
 * @constructor
 */
VList.prototype.Init = function ( config ) {
	var self = this,
		onClick = false,
		item, i;
	// global store
	if ( config.handle === undefined ) {
		this.handleInner = this.$body = this.$node = document.createElement('div');
	} else {
		this.handleInner = this.$body = this.$node = config.handle;
	}

	// non-empty list
	if (this.size > 0) {
		// clear old items
		this.$body.innerText = null;
	}

	if ( config.onClick !== undefined ) {
		onClick = config.onClick;
	}

	this.$node.classList.add('vlist-main');

	// create new items
	for (i = 0; i < this.size; i++) {
		item = document.createElement('a');
		item.index = i;
		if ( onClick ) {
			item.onclick = onClick;
		}

		//item.addEventListener('click', onClick);
		this.$body.appendChild(item);
	}
	// navigation by mouse
	this.$body.addEventListener('mousewheel', function ( event ) {
		// scrolling by Y axis
		if ( event.wheelDeltaY ) {
			self.move(event.wheelDeltaY > 0 ? KEYS.UP : KEYS.DOWN);
		}
	});

	if ( config.scrollBar && this.scrollBar === null ) {
		this.scrollBar = config.scrollBar;
		this.scrollBar.init({viewSize: self.size, realSize: self.data.length});
	}
};


/**
 * Draw the visible window.
 *
 * @param {number} index start position to render
 *
 * @return {boolean} operation status
 *
 */
VList.prototype.renderView = function ( index ) {
	var $item, i, itemData, prevIndex, currIndex;
	// has the view window position changed
	if ( this.indexView !== index ) {
		// sync global pointer
		this.indexView = currIndex = index;

		// rebuild all visible items
		for ( i = 0; i < this.size; i++ ) {
			// shortcuts
			$item    = this.$body.children[i];
			itemData = this.data[index];

			// real item or stub
			if ( itemData !== undefined ) {
				// correct inner data/index and render
				$item.data  = itemData;
				$item.index = index;
				this.renderItem($item, itemData);

				// apply CSS
				if ( itemData.markable ) {
					$item.classList.add('mark');
				} else {
					$item.classList.remove('mark');
				}
			} else {
				// nothing to render
				$item.data = $item.index = undefined;
				if ( $item.ready ) {
					$item.$body.innerText = '';
					$item.$body.style.background = '';
				}
			}
			index++;
		}

		if ( this.scrollBar !== null ) {
			this.scrollBar.scrollTo(this.indexView);
		}
		// full rebuild
		return true;
	}

	// nothing was done
	return false;
};


/**
 * Move focus to the given direction.
 *
 * @param {number} direction arrow key code
 */
VList.prototype.move = function ( direction ) {
	if ( direction === KEYS.UP ) {
		// still can go backward
		if ( this.activeItem && this.activeItem.index > 0 ) {
			if ( this.activeItem === this.$body.firstChild ) {
				this.renderView(this.indexView - 1);
			} else {
				this.focusItem(this.activeItem.previousSibling);
			}
		} else if ( this.onOverflow ) {
			this.onOverflow({direction: direction});
		}
	}
	if ( direction === KEYS.DOWN ) {
		// still can go forward
		if ( this.activeItem && this.activeItem.index < this.data.length - 1 ) {
			if ( this.activeItem === this.$body.lastChild ) {
				this.renderView(this.indexView + 1);
			} else {
				this.focusItem(this.activeItem.nextSibling);
			}
		} else if ( this.onOverflow ) {
			this.onOverflow({direction: direction});
		}
	}

	if ( direction === KEYS.PAGE_UP ) {
		// determine jump size
		if ( this.indexView < this.size ) {
			// first page
			this.renderView(0);
		} else {
			// second page and further
			this.renderView(this.indexView - this.size + 1);
		}

		this.focusItem(this.$body.firstChild);
	}

	if ( direction === KEYS.PAGE_DOWN ) {
		// data is bigger then one page
		if ( this.data.length > this.size ) {
			// determine jump size
			if ( this.indexView > this.data.length - this.size * 2 ) {
				// last page
				this.renderView(this.data.length - this.size);
			} else {
				// before the last page
				this.renderView(this.indexView + this.size - 1);
			}
			this.focusItem(this.$body.lastChild);
		} else {
			// not the last item on the page
			this.focusItem(this.$body.children[this.data.length - 1]);
		}
	}

	if ( direction === KEYS.HOME || direction === KEYS.LEFT ) {
		this.renderView(0);
		this.focusItem(this.$body.firstChild);
	}

	if ( direction === KEYS.END || direction === KEYS.RIGHT ) {
		// data is bigger then one page
		if ( this.data.length > this.size ) {
			this.renderView(this.data.length - this.size);
			this.focusItem(this.$body.lastChild);
		} else {
			// not the last item on the page
			this.focusItem(this.$body.children[this.data.length - 1]);
		}
	}
};


/**
 * Highlight the given DOM element as focused.
 * Remove focus from the previously focused item and generate associated event.
 *
 * @param {Node|Element} $item element to focus
 *
 * @return {boolean} operation status
 */
VList.prototype.focusItem = function ( $item ) {
	var $prev = this.activeItem;

	// different element
	if ( $item !== undefined && $prev !== $item ) {
		// some item is focused already
		if ( $prev !== null ) {
			// style
			$prev.classList.remove('focused');
		}
		// reassign
		this.activeItem = $item;

		this.activeItem.data = this.data[this.activeItem.index];

		// correct CSS
		$item.classList.add('focused');

		return true;
	}

	// nothing was done
	return false;
};


/**
 * Create new item and put it in the list
 * @param {string} name item label
 * @param {Object} attrs set of item data parameters
 * @param {Object} [states] set of additional parameters (stared)
 *
 * @return {Node|null}
 */
VList.prototype.Add = function ( name, attrs, states ) {
	var prop;
	attrs.name = name;
	if ( states ) {
		for ( prop in states ) {
			attrs.prop = states[prop];
		}
	}
	this.data.push(attrs);
};

/**
 * Clear inner data.
 * If u want update list, call this.renderView();
 */
VList.prototype.Clear = function () {
	this.data = [];
};



/**
 * Set inner item flags and decoration.
 *
 * @param {Object} item the element to be processed
 * @param {string} option item inner flag name
 * @param {boolean} state flag of the operation (true if change is made)
 *
 * @return {boolean} operation status
 */
VList.prototype.SetState = function ( item, option, state ) {
	state = !!state;
	// current and new states are different
	if ( item[option] !== state ) {
		// check if exist
		if ( !this.states[option] ) { this.states[option] = []; }
		var index = this.states[option].indexOf(item);
		//update internal list
		if ( state ) {
			// add to the list
			if ( index === -1 ) { this.states[option].push(item); }
		} else {
			// remove
			if ( index !== -1 ) { this.states[option].splice(index, 1); }
		}
		// flag
		item[option] = state;
		return true;
	}
	// nothing has changed
	return false;
};


/**
 * Syntax sugar for render items from begin and focus first element.
 *
 */
VList.prototype.Render = function () {
	this.indexView = -1;
	this.renderView(0);
	this.focusItem(this.$body.firstChild);
};


/**
 * Set item state and appearance as marked.
 *
 * @return {object} next data object
 */
VList.prototype.Next = function () {
	return this.data[this.activeItem.index + 1];
};


/**
 * Return active (focused) item of the list.
 *
 * @deprecated created for other list compatibility
 *
 * @return {HTMLElement}
 */
VList.prototype.Current = function () {
	return this.activeItem;
};


/**
 * Set position some list element
 * @param {Object} data data item from inner items
 * @param {boolean} [manageFocus] - set actual focus
 */
VList.prototype.SetPosition = function ( data, manageFocus ) {
	var index = this.data.indexOf( data ),
		i, viewIndex;
	if ( index === -1 || index === undefined ) {
		return false;
	}
	this.indexView = -1;
	i = data.index || 0;
	if ( i < this.size ) {
		viewIndex = 0;
	} else if ( i > this.data.length - this.size ) {
		viewIndex = this.data.length - this.size;
		i -= viewIndex;
	}
	this.renderView(viewIndex);
	if ( manageFocus ) {
		this.focusItem(this.$body.children[i]);
	}
	return true;
};


/**
 * Go through all the items
 *
 * @deprecated created for other list compatibility
 *
 * @param {Function} callback iteration callback function
 */
VList.prototype.Each = function ( callback ) {
	this.data.forEach(callback);
};
