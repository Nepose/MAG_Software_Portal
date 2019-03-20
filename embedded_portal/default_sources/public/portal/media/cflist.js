/**
 * Media component: file lister
 * files and folders lists with navigation
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * @class CFileList
 * @constructor
 */
function CFileList ( parent ) {
	var self = this;
	// parent constructor
	VList.call(this, {size: 5});

	this.parent = parent;

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CFileList';

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
	 * file extension to media type mapping
	 * @type {Object}
	 */
	this.ext2type = {};

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
	 * list of media objects data
	 * full chain from the root
	 * @type {[Object]}
	 */
	this.path = [];

	/**
	 * array of current level subtitle items
	 * @type {[Object]}
	 */
	this.subList = [];

	/**
	 * array of current level playable items
	 * @type {[Object]}
	 */
	this.playList = [];

	/**
	 * flag if play list was already inited for the current level
	 * should be done after each level down change
	 * reset to false on Clear
	 * @type {boolean}
	 */
	this.playListSet = false;

	/**
	 * list of all media types on the current level
	 * @type {[Number]}
	 */
	this.mtypes = [];

	/**
	 * visibility flag for footer action buttons
	 * @type {boolean}
	 */
	this.hideF2 = true;

	/**
	 * enable to work with favorites
	 * @type {boolean}
	 */
	this.canFav = false;

	this.total = 0;

	// prepare key:value dictionary
	// for file type by its extension
	MEDIA_EXTENSION[MEDIA_TYPE_VIDEO]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_VIDEO; });
	MEDIA_EXTENSION[MEDIA_TYPE_AUDIO]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_AUDIO; });
	MEDIA_EXTENSION[MEDIA_TYPE_IMAGE]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_IMAGE; });
	MEDIA_EXTENSION[MEDIA_TYPE_TEXT]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_TEXT; });
	MEDIA_EXTENSION[MEDIA_TYPE_ISO]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_ISO; });
	MEDIA_EXTENSION[MEDIA_TYPE_PLAYLIST]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_PLAYLIST; });
	MEDIA_EXTENSION[MEDIA_TYPE_CUE]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_CUE; });
	MEDIA_EXTENSION[MEDIA_TYPE_RECORDS_ITEM]
		.forEach(function(item){ self.ext2type[item] = MEDIA_TYPE_RECORDS_ITEM; });


	FileBrowser.init(this);

	this.fileBrowser = FileBrowser;
}

// extending
CFileList.prototype = Object.create(VList.prototype);
CFileList.prototype.constructor = CFileList;



/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CFileList.prototype.SetBreadCrumb = function ( component ) {
	this.bcrumb = component;
};

/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CFileList.prototype.SetSearchBar = function ( component ) {
	this.sbar = component;
};

/**
 *

 /**
 * Open passed data.
 *
 * @param {Object} data folder or file
 * @param {number} level direction of change in the level of explorer
 */
CFileList.prototype.Open = function ( data, level ) {
	echo(data.type, 'CFileList.Open');
	this.fileBrowser.open(data, level);
};


/**
 * Set filter by name.
 *
 * @param {String} text name filter, not case-sensitive
 */
CFileList.prototype.SetFilterText = function ( text ) {
	this.filterText = text;
	this.fileBrowser.filterText(this.filterText);
};


/**
 * Set filter by type, from MEDIA_TYPE_*.
 *
 * @param {Number} type of the content
 */
CFileList.prototype.SetFilterType = function ( type ) {
	this.filterType = type;
	this.fileBrowser.filterType(this.filterType);
};


/**
 * Collects all the playable marked items
 * @return {[Object]}
 */
CFileList.prototype.GetPlaylist = function () {
	var self = this,
		list = [];
	// get all marked items if any
	this.states['marked'].forEach(function(item){
		// allow only some media types
		if ( self.parent.playable.indexOf(item.type) !== -1 ) {
			// append to play list
			list.push(item);
		}
	});
	return list;
};


/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
CFileList.prototype.Clear = function () {
	// dependant component
	if ( this.sbar ) {
		this.sbar.Reset();
	}

	this.filterType = MEDIA_TYPE_NONE;
	this.mtypes = [];
	// clear file list to play
	this.playListSet = false;
};


/**
 * Moves the cursor to the given element
 * @param {Object} data
 * @param {boolean} [manageFocus=true] flag to manage focus handling
 * @return {boolean} operation status
 */
CFileList.prototype.Reposition = function ( data, manageFocus ) {
	var index, viewIndex = this.indexView || 0;
	// find it in the new list if necessary
	echo(data, 'Reposition');
	if ( data ) {
		index = data.index || 0;
		// determine direction
		if ( index >= viewIndex + this.size ) {
			echo('INDEX GREAT');
			// check range
			index = index < this.data.length - 1 ? index : this.data.length - 1;
			// move down
			echo('MOVE DOWN');
			this.indexView = -1;
			this.renderView(index - this.size + 1);
			if ( manageFocus ) {
				echo('lastChild', 'focusItem');
				this.focusItem(this.$body.lastChild);
			}
		} else if ( index < this.data.length ) {
			// check range
			index = index > 0 ? index : 0;
			// move up
			echo({
				indexView: this.indexView,
				'data.length': this.data.length,
				size: this.size,
				index: index
			});

			if ( this.data.length < this.size ) {
				this.indexView = -1;
				this.renderView(0);
			} else {
				if ( this.activeItem.data.index === index ) {
					index = this.data.indexOf(this.activeItem);
					if ( index === -1 ) {
						index = this.activeItem.data.index;
					}
					viewIndex = this.indexView;
					index = viewIndex - index;
				} else if ( this.data.length - this.size > index ) {
					viewIndex = index;
					index = 0;
				} else {
					viewIndex = this.data.length - this.size;
					index -= this.data.length - this.size;
				}
				this.indexView = -1;
				this.renderView(viewIndex);
			}
			if ( manageFocus ) {
				echo(index, 'focusItem');
				this.focusItem(this.$body.children[index]);
			}
		} else {
			// no move
			viewIndex = this.indexView;
			this.indexView = -1;
			this.renderView(viewIndex);
			if ( manageFocus ) {
				echo(index - this.indexView, 'Focus item');
				this.focusItem(this.$body.children[index - this.indexView]);
			}
		}
		return true;
	}
	return false;
};


/**
 * @see parent description
 */
CFileList.prototype.focusItem = function ( item ) {
	var self = this,
		$prev = this.activeItem;

	// different element

	if ( item !== undefined && $prev !== item && item.data ) {
		// some item is focused already
		if ( $prev !== null ) {
			// style
			$prev.classList.remove('focused');
		}
		// reassign
		this.activeItem = item;

		this.activeItem.data = this.data[this.activeItem.index];

		// correct CSS
		item.classList.add('focused');
		// there are no selected items
		if ( this.mode !== MEDIA_TYPE_FAVORITES ) {
			if ( this.canFav && item.data.type !== MEDIA_TYPE_FOLDER && item.data.type !== MEDIA_TYPE_BACK ) {
				this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add,  item.data.stared);
				this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, !item.data.stared);
			} else {
				this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, true);
				this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, true);
			}
		} else {
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, item.data.type === MEDIA_TYPE_BACK);
		}
		if ( item.data.markable ) {
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, item.data.type === MEDIA_TYPE_BACK);
		} else {
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, true);
		}

		// clear delayed call
		if ( this.timer ) {
			clearTimeout(this.timer);
		}
		// preview and MediaBrowser itself are available
		echo(self.parent.Preview.isVisible && self.parent.isVisible, 'self.parent.Preview.isVisible && self.parent.isVisible')
		if ( self.parent.Preview.isVisible && self.parent.isVisible ) {
			// stop current play if any
			MediaPlayer.end(true);
			// add delay
			this.timer = setTimeout(function(){
				// show info in preview block
				self.parent.Preview.Info(item.data);
			}, 400);
		}
		return true;
	}

	// nothing was done
	return false;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
CFileList.prototype.onLevelChange = function ( context, data, level ) {
	// particular direction
	this.data = data;
	this.filterText = context.filterText ? context.filterText : '';
	echo(level, 'onLevelChange')

	if ( level === this.LEVEL_CHANGE_DOWN ) {
		this.indexView = -1;
		this.renderView(0);
		this.focusItem(this.$body.firstChild);

		// build breadcrumbs
		if ( this.filterText ) {
			// filter
			if ( this.bcrumb ) {
				this.bcrumb.Push('/', 'media/ico_filter.png', this.filterText);
			}
		} else if ( this.bcrumb ) {
			// default
			// build breadcrumbs
			this.bcrumb.Push('/', 'media/type_' + context.type+'.png', context.name ? context.name : '');
		}
		// save this step
		this.path.push(context);
		// sef focus to the first item
		this.Activate(true);
	} else if ( !this.Reposition(this.parentItem, true) )  {
		// go up and set focus to either previous or first item
		this.Activate(true);
	}
	// reset tray filter icon
	if ( this.parent.Tray.iconFilter.parentNode === this.parent.Tray.handleInner ) {
		this.parent.Tray.handleInner.removeChild(this.parent.Tray.iconFilter);
	}
	// and hide at all if not necessary
	this.parent.Tray.Show(globalBuffer.size() > 0, false);
	// set current working scheme
	this.mode = this.path[1] !== undefined ? this.path[1].type : MEDIA_TYPE_MB_ROOT;
	this.canFav = this.mode === MEDIA_TYPE_STORAGE_SATA || this.mode === MEDIA_TYPE_STORAGE_USB || this.mode === MEDIA_TYPE_FAVORITES || context.type === MEDIA_TYPE_PLAYLIST;
	// current level item
	this.parentItem = this.path[this.path.length-1];

	this.parent.BPanel.Hidden(this.parent.BPanel.btnF2,    true);
	this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, true);
	this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, true);

	// update info hints
	this.parent.Preview.SetItemsCount();
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
CFileList.prototype.ActiveItems = function () {
	// get all marked items
	var items = this.data.filter(function ( item ) {
		return item.marked;
	});
	// no marked, check current and its type
	if ( items.length === 0 && this.activeItem && this.activeItem.data.markable ) {
		items.push(this.activeItem.data);
	}
	return items;
};


/**
 * Removes the given elements and reposition the focus
 * @param {[Node]} items list of elements to be processed
 */
CFileList.prototype.DeleteAll = function ( items ) {
	var self   = this,
		focusIndex = null;
	// collect affected items
	// there are some
	if ( Array.isArray(items) && items.length > 0 ) {
		// cursor position
		if ( items.indexOf(this.activeItem.data) === -1 ) {
			// not intersect
			focusIndex = this.activeItem.index;
		} else {
			// get the next good (scan down)
			focusIndex = this.activeItem.index;
			echo(this.activeItem, '!!!!!!!!!!!!!!!!!!!!!!!');
			while ( this.data[focusIndex] && this.data[focusIndex].marked ) {
				++focusIndex;
			}
			if ( focusIndex === this.data.length ) {
				focusIndex = 0;
			}
		}
		// apply
		items.forEach(function ( item ) {
			self.Delete(item);
		});
		self.data.forEach(function ( item, index ) {
			item.index = index;
		});
		// the nearest available item
		echo(focusIndex, '!!!!!!!!!!!!!!!!!!!!!!!');
		if ( this.data.length === focusIndex ) {
			--focusIndex;
			this.activeItem.data.index = focusIndex;
			--this.indexView;
		}
		// this.Reposition(this.data[focusIndex], true);
		this.Focused(focusIndex, true);
	}
};


/**
 * Remove the given item and clear inner states if necessary
 * @param {Node} item the element to be processed
 */
CFileList.prototype.Delete = function ( item ) {
	var index;
	// valid html element given
	if ( item ) {
		// clear states
		this.SetState(item, 'marked', false);
		index = this.data.indexOf(item);
		this.data.splice(index, 1);
		--this.total;
	}
};


/**
 * Set inner item flags and decoration
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the operation (true if change is made)
 */
CFileList.prototype.SetStar = function ( item, state ) {
	var indexView = this.indexView,
		result = this.SetState(item, 'stared', state);
	if ( !result ) {
		return false;
	}
	if ( this.activeItem.data === item ) {
		if ( state ) {
			this.activeItem.classList.add('stared');
			this.activeItem.star.style.background = 'url("' + PATH_IMG_PUBLIC + 'ico_fav.png") no-repeat right';
		} else {
			this.activeItem.classList.remove('stared');
			this.activeItem.star.style.background = 'none';
		}
	} else {
		this.indexView = -1;
		this.renderView(indexView);
	}
	return result;
};


/**
 * Handle checked state for the given item according to the file type.
 * Mark only items available for marking.
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
CFileList.prototype.Marked = function ( item, state ) {
	var indexView = this.indexView,
		result;

	// item exists and only allowed types
	if ( item && item.markable ) {
		result = this.SetState(item, 'marked', state);
		if ( !result ) {
			return false;
		}
		if ( item === this.activeItem.data ) {
			// apply CSS
			if ( state ) {
				this.activeItem.classList.add('marked');
			} else {
				this.activeItem.classList.remove('marked');
			}
		} else {
			this.indexView = -1;
			this.renderView(indexView);
		}
		return result;
	}
	return false;
};


/**
 * Finds the first appropriate item
 * @param {string} value
 * @return {Node}
 */
CFileList.prototype.FirstMatch = function ( value ) {
	var len = this.data.length,
		item, i;

	if ( value === '' ) {
		return -1;
	}
	for ( i = 0; i < len; i++ ) {
		item = this.data[i];
		if ( item.type !== MEDIA_TYPE_BACK && item.name && item.name.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
			return i;
		}
	}
};


CFileList.prototype.Focused = function ( index, focus ) {
	if ( index >= this.data.length ) {
		index = this.data.length - 1;
	}
	if ( index >= 0 ) {
		this.data[index].index = index;
		this.Reposition(this.data[index], focus);
	}
};


/**
 * @see parent description
 */
CFileList.prototype.renderItem = function ( $item, attrs ) {
	if ( $item.ready ) {
		$item.$body.innerText = attrs.name;
		$item.$body.style.background = 'url("' + PATH_IMG_PUBLIC + 'media/type_' + attrs.type + '.png") no-repeat left';
	} else {
		$item.innerHTML = '';
		$item.$body = element('div', {className:'data'}, attrs.name);
		$item.star = element('div', {className:'star'});
		// decoration
		$item.$body.style.background = 'url("' + PATH_IMG_PUBLIC + 'media/type_' + attrs.type + '.png") no-repeat left';
		$item.appendChild($item.star);
		$item.appendChild($item.$body);
		$item.ready = true;
	}
};


/**
 * @see parent description
 */
CFileList.prototype.renderView = function ( index ) {
	var self = this,
		$item, i, itemData, prevIndex;

	echo(index, 'renderView');
	if ( this.data.length > this.size ) {
		if ( index > this.data.length - this.size ) {
			return false;
		}
	}
	if ( index !== Number(index) ) {
		index = 0;
	}
	if ( index < 0 ) {
		index = 0;
	}

	// has the view window po
	if ( this.indexView !== index ) {
		// save prev value
		prevIndex = this.indexView;
		// sync global pointer
		this.indexView = index;
		// rebuild all visible items
		for ( i = 0; i < this.size; i++ ) {
			// shortcuts
			$item    = this.$body.children[i];
			itemData = this.data[index];

			// real item or stub
			if ( itemData ) {
				// correct inner data/index and render
				itemData.index = index;
				$item.data  = itemData;
				$item.index = index;
				this.renderItem($item, itemData);

				// apply CSS
				if ( itemData.marked ) {
					$item.classList.add('marked');
				} else {
					$item.classList.remove('marked');
				}

				if ( itemData.stared ) {
					$item.classList.add('stared');
					$item.star.style.background = 'url("' + PATH_IMG_PUBLIC + 'ico_fav.png") no-repeat right';
				} else {
					$item.classList.remove('stared');
					$item.star.style.background = 'none';
				}
			} else {
				// nothing to render
				$item.data = $item.index = undefined;
				if ( $item.ready ) {
					$item.$body.innerText = '';
					$item.$body.style.background = '';
					$item.star.style.background = 'none';
					$item.classList.remove('marked');
				}
			}
			index++;
		}
		echo(this.total, 'this.total')
		if ( this.scrollBar.realSize !== this.total ) {
			this.scrollBar.init({realSize:this.total});
		}

		this.scrollBar.scrollTo(this.indexView);
		if ( this.fileBrowser.onRenderView ) {
			this.fileBrowser.onRenderView(this.indexView, this.indexView > prevIndex);
		}
		// clear delayed call
		if ( this.timer ) {
			clearTimeout(this.timer);
		}
		// preview and MediaBrowser itself are available

		if ( self.parent.Preview.isVisible && self.parent.isVisible ) {
			// stop current play if any
			MediaPlayer.end(true);
			// add delay
			this.timer = setTimeout(function(){
				// show info in preview block
				self.parent.Preview.Info(self.activeItem.data);
			}, 400);
		}
		return true;
	}

	// nothing was done
	return false;
};


/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 */
CFileList.prototype.onFocus = function ( item ) {
	var self = this;
	if ( item ) {
		// there are no selected items
		if ( !this.states.marked || this.states.marked.length === 0 ) {
			if ( this.mode !== MEDIA_TYPE_FAVORITES ) {
				if ( self.canFav && item.data.type !== MEDIA_TYPE_FOLDER && item.data.type !== MEDIA_TYPE_BACK ) {
					this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add,  item.data.stared);
					this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, !item.data.stared);
				} else {
					this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, true);
					this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, true);
				}
			} else {
				this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, item.data.type === MEDIA_TYPE_BACK);
			}
		}
		if ( item.data.markable ) {
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, item.data.type === MEDIA_TYPE_BACK);
		} else {
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, true);
		}
		// if ( this.parent.Preview.isVisible ) {
		// 	// show info in preview block
		// 	this.parent.Preview.Info(this.activeItem.data);
		// }

		// clear delayed call
		// if ( this.timer ) {
		// 	clearTimeout(this.timer);
		// }
		// // preview and MediaBrowser itself are available
		// if ( self.parent.Preview.isVisible && self.parent.isVisible ) {
		// 	// stop current play if any
		// 	MediaPlayer.end();
		// 	// add delay
		// 	this.timer = setTimeout(function(){
		// 		// show info in preview block
		// 		self.parent.Preview.Info(item.data);
		// 	}, 400);
		// }
	}
};


/**
 * @see parent description
 */
CFileList.prototype.Init = function ( config ) {
	var self = this;
	config.onClick = function () {
		if (this.data !== undefined) {
			self.focusItem(this);
			self.fileBrowser.open(this.data);
		}
	};
	VList.prototype.Init.call(this, config);
};


/**
 * Handler for on list overflow event.
 * @param {Object} event meta data
 * @param {Number} event.direction contains KEYS.DOWN or KEYS.UP values
 */
CFileList.prototype.onOverflow = function ( event ) {
	if ( this.fileBrowser.onOverflow ) {
		this.fileBrowser.onOverflow(event);
	}
};


/**
 * Clear the list and fill it again (will try to refocus)
 * @param {boolean} [refocus=true] if true then try to set focus to the previous focused element
 */
CFileList.prototype.Refresh = function ( refocus ) {
	var data = null;
	// some media item is opened at the moment
	if ( this.parentItem !== null ) {
		// get current focused item
		if ( refocus !== false && this.activeItem ) {
			data = this.activeItem.data;
		}
		MediaBrowser.FileList.bcrumb.Pop();
		MediaBrowser.FileList.path.pop();
		// refill
		this.fileBrowser.open(this.parentItem);
		// find it in the new list if necessary
		this.Reposition(data, true);
	}
};
