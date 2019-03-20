'use strict';

/**
 * @class DVBList
 * @constructor
 * @author Roman Stoian
 */
function DVBList(parent) {
	// parent constructor
	var customParams = {
			onPage : ( function () {
				var count = {
					480: 4,
					576: 6,
					720: 7,
					1080: 7
				};
				return count[ screen.height ];
			}) ()
		},
		self = this;

	CList.call(this, parent, customParams);

	this.data = [];
	this.nativList = null;

	//this.channelsCount = [];
	this.filters = [];
	// this.activeFilters = [];
	// this.numberFilters = [];
	this.count = 0;

	/**
	 * link to the BreadCrumb component
	 * @type {CBreadCrumb}
	 */
	this.bcrumb = null;
	this.sbar = null;

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
	 * type filter for file listing
	 * @type Number
	 */
	this.filterType = MEDIA_TYPE_NONE;

	/**
	 * data filter for file listing
	 * @type String
	 */
	this.filterText = '';

	/**
	 * list of all media types on the current level
	 * @type {Array}
	 */
	this.mtypes = [];

	/**
	 * list of media objects data
	 * full chain from the root
	 * @type {[Object]}
	 */
	this.path = [];

	/**
	 * current media object opened
	 * @type {Object}
	 */
	this.parentItem = null;

	this.timer = {};

	this.prevChannel = null;
	this.lastChannel = null;

	/**
	 * list of action mapped to the media types
	 * @type {[Function]}
	 */
	this.openAction = {};

	this.openAction[MEDIA_TYPE_BACK] = function(){
		var st = this.Back();

		return st;
	};

	this.openAction[MEDIA_TYPE_DVB_ROOT] = function () {
		if ( this.parent.scanningInProgress ) {
			return;
		}
		this.FillItems();
		if ( this.list.length === 0 ) {
			//this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, true);
			this.parent.domInfoTitle.innerHTML = '';
			this.parent.handle.querySelector('.content').querySelector('.crop').className = 'crop defImage';
		} else {
			this.parent.handle.querySelector('.content').querySelector('.crop').className = 'crop';
		}
		return this.LEVEL_CHANGE_DOWN;
	};

	this.openAction[MEDIA_TYPE_DVB] = function ( item, noPlay ) {
		if ( (!MediaPlayer.obj || MediaPlayer.obj.id !== item.data.id) && !noPlay ) {
			var obj = {
				id : item.data.id,
				name : item.name,
				url : item.data.uri,
				type : item.type,
				sol : 'dvb'
			};
			echo(obj);
			MediaPlayer.preparePlayer(obj, this.parent, true, true, true);
		} else {
			MediaPlayer.Show(true, this.parent);
			MediaPlayer.showInfo(true);
			MediaPlayer.timer.showInfo = setTimeout(function () {
				MediaPlayer.showInfo(false);
			}, 3000);
		}
		return this.LEVEL_CHANGE_NONE;
	};

	this.pressOK = function ( item ) {
		self.Open(item);
	};
}

// extending
DVBList.prototype = Object.create(CList.prototype);
DVBList.prototype.constructor = DVBList;

/**
 * Handle external events
 * @param {Event} event global event object
 * @param {boolean} [manageFocus=this.manageFocus]
 */
DVBList.prototype.EventHandler = function ( event, manageFocus ) {
	var found = null;
	if ( manageFocus === undefined ) {
		manageFocus = this.manageFocus;
	}
	if ( event.stopped === true ) {
		return;
	}
	event.preventDefault();
	// moving direction
	switch ( event.code ) {
		case KEYS.PAGE_UP:
			found = this.Prev( this.onPage );
			break;
		case KEYS.PAGE_DOWN:
			found = this.Next( this.onPage );
			break;
		case KEYS.LEFT:
		case KEYS.HOME:
			found = this.Prev( this.count - 1 );
			break;
		case KEYS.RIGHT:
		case KEYS.END:
			found = this.Next( this.count - 1 );
			break;
		case KEYS.UP:
			found = this.Prev();
			break;
		case KEYS.DOWN:
			found = this.Next();
			break;
		case KEYS.OK:
			this.pressOK(this.ActiveItem());
			return;
		default:
			// suppress everything else and exit
			return;
	}
	// make focused the first item if not found
	this.Focused( found || this.ActiveItem(), true, manageFocus );
};

/**
 * Get the next item from the current focused item
 * can go to the next page
 * @param {count} [count=1] count steps next
 * @return {Node|null} found item or null if there are no suitable ones
 */
DVBList.prototype.Next = function ( count ) {
	var next = null,
		endList = false;

	count = count ? count > 0 ? count : 1 : 1;
	this.itemIndex += count;
	this.listIndex += count;
	if ( this.listIndex >= this.count ) {
		this.listIndex = 0;
		// this.listIndex = this.count - 1;
		endList = true;
	}
	if ( this.itemIndex >= this.onPage || endList ) {
		if ( this.RefreshPageIndex() ) {
			next = this.loadChannels( false );
			return next;
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
DVBList.prototype.Prev = function ( count ) {
	var prev = null,
		endList = false;

	count = count ? count > 0 ? count : 1 : 1;
	this.itemIndex -= count;
	this.listIndex -= count;
	if ( this.listIndex < 0 ) {
		this.listIndex = this.count - 1;
		// if ( this.onPage < this.count ) {
		// 	this.itemIndex = this.onPage -1;
		// } else {
		// 	this.itemIndex = this.count -1;
		// }
		endList = true;
	}
	if ( this.itemIndex < 0 || endList ) {
		if ( this.RefreshPageIndex() ) {
			prev = this.loadChannels(false);

			return prev;
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
 * refresh page index.
 * @return {boolean} change page
 */
CList.prototype.RefreshPageIndex = function () {
	var pageIndex = this.pageIndex,
		start, delta;

	this.pageIndex = Math.floor( this.listIndex / this.onPage );
	this.itemIndex = this.listIndex % this.onPage;

	start = this.onPage * this.pageIndex;

	if ( start > 0 && start + this.onPage > this.count ) {
		delta = start - this.count + this.onPage;
		this.itemIndex += delta;
	}

	return pageIndex !== this.pageIndex;
};

/**
 * Create DVB channels list
 */
DVBList.prototype.createList = function () {
	if ( this.filters.length ) {
		this.nativList = stbDvbManager.createChannelList(this.filters, this.nativList || stbDvbManager.channelList);
		this.count = this.nativList.size + 1;
	} else {
		this.nativList = stbDvbManager.channelList;
		this.count = this.nativList.size;
	}


};

DVBList.prototype.loadChannels = function ( noFocus, noFill ) {
	var start, data, i,
		arr = [],
		back = 0,
		delta = 0;

	start = this.onPage * this.pageIndex;
	if ( this.filterText ) {
		if ( start > 0 ) {
			start--;
		} else {
			arr.push({type: MEDIA_TYPE_BACK, name: '..', data: null});
			back = 1;
		}

	}

	if ( start > 0 && start + this.onPage > this.count ) {
		delta = start - this.count + this.onPage;
		start = this.count - this.onPage;
	} else if ( this.itemIndex < 0 ) {
		delta = - this.count % this.onPage;
	}
	data = this.nativList.slice(start, this.onPage - back);
	for ( i = 0; i < data.length; i++ ) {
		arr.push(
			{type: MEDIA_TYPE_DVB, name: data[i].name || data[i].id, data: data[i]}
		)
	}

	this.SetList(arr);

	if ( !noFill ) {
		data = this.FillItems(noFocus, delta);
	} else {
		data = null;
	}
	return data;
};

/**
 * set scroll position
 */
DVBList.prototype.setScroll = function () {
	var margin, percent;

	percent = Math.ceil ( this.onPage / this.count * 100 );
	if ( percent >= 100 ) {
		percent = 0;
	}
	margin = Math.ceil ( this.scrollHandle.offsetHeight / Math.ceil( this.count / this.onPage  ) * this.pageIndex );
	this.scrollThumb.style.height = percent + '%';
	this.scrollThumb.style.marginTop = margin + 'px';
};

DVBList.prototype.RenderItem = function () {
	var i = this.items.length - 1;
	return [
		this.items[i].number = element('div', {className: 'number'}),
		this.items[i].channel = element('div', {className: 'data'}),
		this.items[i].scrambled = element('div', {className: 'scrambled'}),
		this.items[i].star = element('div', {className: 'star'})
	];
};

DVBList.prototype.FillItems = function ( noFocus, delta ) {
	var startPos = this.onPage * this.pageIndex,
		active = null,
		item = null,
		list = [];

	if ( !delta ) {
		delta = 0;
	}
	startPos -= delta;
	this.Focused(this.activeItem, false);
	for ( var i = 0; i < this.onPage; i++ ) {
		item = this.items[i];
		if ( this.list.length > i ) {
			switch ( this.list[i].type ) {
				case MEDIA_TYPE_DVB:
					item.number.innerHTML = this.list[i].data.channelNumber;
					item.channel.innerHTML = this.list[i].name;
					item.name = this.list[i].name;
					item.scrambled.className = this.list[i].data.scrambled === true? 'scrambled on' : 'scrambled';
					item.data = this.list[i].data;
					item.markable = true;
					item.type = this.list[i].type;
					item.listIndex = i + startPos;
					this.SetStar(item, FAVORITES_NEW[ item.data.uri ] || FAVORITES[ item.data.uri ] ? true : false);
					item.number.style.background = '';
					break;
				case MEDIA_TYPE_BACK:
					item.number.innerHTML = '';
					item.number.style.background = 'url("' + PATH_IMG_PUBLIC + 'media/type_' + MEDIA_TYPE_BACK + '.png") no-repeat center';
					item.channel.innerHTML = this.list[i].name;
					item.data = null;
					item.type = this.list[i].type;
					item.markable = false;
					this.SetStar(item, false);
					break;
			}
			this.Hidden(item, false);
			if ( i + startPos === this.listIndex ) {
				active = this.items[i];
				this.itemIndex = i;
			}
			list.push(item.data);
		} else {
			item.index = -1;
			item.data = null;
			this.Hidden(item, true);
		}
	}
	if ( !noFocus ) {
		this.Focused( active, true );
	}
	this.setScroll();
	if ( typeof this.onFillItems === 'function' ) {
		this.onFillItems( active, list );
	}
	return active;
};

DVBList.prototype.onFillItems = function ( active, list ) {};

/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
DVBList.prototype.SetBreadCrumb = function (component) {
	this.bcrumb = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
DVBList.prototype.SetSearchBar = function (component) {
	this.sbar = component;
};


// /**
//  * Shows/hides items depending on the given filter string match
//  * unmarks all hidden items
//  */
// DVBList.prototype.Filter = function () {
// 	// link to the object for limited scopes
// 	var self = this;
// 	// check all items
// 	this.Each(function(item){
// 		// check file name if regular file
// 		var text_ok = item.data.type === MEDIA_TYPE_BACK || (item.data.name && item.data.name.toLowerCase().indexOf(self.filterText) !== -1);
// 		// check file type if regular file
// 		var type_ok = item.data.type === self.filterType || self.filterType === MEDIA_TYPE_NONE || item.data.type === MEDIA_TYPE_BACK;
// 		// hide not matching items
// 		self.Hidden(item, !(text_ok && type_ok));
// 	});
// };
//
// /**
//  * Finds the first appropriate item
//  * @param {string} value
//  * @return {Node}
//  */
// DVBList.prototype.FirstMatch = function ( value ) {
// 	// preparing
// 	var items = this.handleInner.children;  // all list items
// 	// iterate all items till all items are found
// 	for ( var i = 0; i < items.length; i++ ) {
// 		// floating pointer depends on direction
// 		var item = items[i];
// 		// check file name if regular file
// 		if ( item.data.type !== MEDIA_TYPE_BACK && item.data.name && item.data.name.toLowerCase().indexOf(value.toLowerCase()) !== -1 ) {
// 			return item;
// 			}
// 		}
// 		return null;
// };

// /**
//  * Create new item and put it in the list
//  * @param {string} obj item label
//  * @param {Object} attrs set of item data parameters
//  * @param {Object} states set of additional parameters (stared)
//  * @return {Node}
//  */
// DVBList.prototype.Add = function (obj, attrs, states) {
// 	var self = this, number;
// 	if ( this.filterText) { // || this.filterType !== MEDIA_TYPE_NONE
// 		// check file name if regular file
// 		var text_ok = attrs.type === MEDIA_TYPE_BACK || (obj.name && obj.name.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1);
// 		// check file type if regular file
// 		var type_ok = attrs.type === this.filterType || this.filterType === MEDIA_TYPE_NONE || attrs.type === MEDIA_TYPE_BACK;
// 		// hide not matching items
// 		if ( !(text_ok && type_ok) ) {
// 			return null;
// 					}
// 			}
// 	if (this.mtypes.indexOf(attrs.type) === -1){
// 		this.mtypes.push(attrs.type);
// 			}
// 	// html prepare
// 	var body = element('div', {className: 'data'}, obj.name);
// 	var star = element('div', {className: 'star'});
// 	if (obj.number) {
// 		number = element('div', {className: 'number'}, obj.number);
// 		} else {
// 		number = element('div', {className: 'number'});
// 		number.style.background = 'url("' + PATH_IMG_PUBLIC + 'media/type_' + attrs.type + '.png") no-repeat center';
// 		}
// 	var scrambled = element('div', {className: obj.scrambled === 'true'? 'scrambled on' : 'scrambled'});
// 	if (!attrs.name) {
// 		attrs.name = obj.name;
// 	}
// 	// actual filling
// 	var item = CScrollList.prototype.Add.call(this, [number, body, scrambled, star], {
// 		star: star,
// 		data: attrs,
// 		// handlers
// 		onclick: function () {
// 			// open or enter the item
// 			this.self.Open(this.data);
// 			return false;
// 		},
// 		oncontextmenu: EMULATION ? null : function () {
// 			// mark/unmark the item
// 			self.parent.actionF3(false);
// 			return false;
// 	}
// 	});
// 	// mark as favourite
// 	if (states && states.stared) {
// 		item.self.SetStar(item, true);
// 	}
// 	return item;
// };


/**
 * Set inner item flags and decoration
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the operation (true if change is made)
 */
DVBList.prototype.SetStar = function (item, state) {
	if (item.stared === state) {
		return;
	}
	this.SetState(item, 'stared', state);
	if (state !== false) {
		item.star.style.background = 'url("' + PATH_IMG_PUBLIC + 'ico_fav_s.png") no-repeat right';
	} else {
		item.star.style.background = 'none';
	}
};


/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 */
DVBList.prototype.onFocus = function ( item ) {
	var self = this;

	if ( MediaPlayer.ts_inProgress ) {
		if ( MediaPlayer.tsExitCheck( 'focus', item ) ) {
			return true;
		}
	}
	// if ( item.data.markable ) {
	// 	this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, false);
	// } else {
	// 	this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, true);
	// }

	clearTimeout( this.timer.OnFocusPlay );
	if ( item.type === MEDIA_TYPE_DVB ) {
		this.parent.BPanel.Hidden( this.parent.BPanel.btnF3, false );
		if ( !this.states.marked || this.states.marked.length === 0 ) {
			this.parent.BPanel.Hidden( this.parent.BPanel.btnF3add, item.stared );
			this.parent.BPanel.Hidden( this.parent.BPanel.btnF3del, !item.stared );
		}
	} else {
		this.parent.BPanel.Hidden( this.parent.BPanel.btnF3add, true );
		this.parent.BPanel.Hidden( this.parent.BPanel.btnF3del, true );
	}

	this.timer.OnFocusPlay = setTimeout(function () {
		if ( item.type === MEDIA_TYPE_BACK ) {
			if(self.filterText){
				self.parent.domInfoTitle.innerHTML = _('Contains the list of items which are corresponding to the given filter request');
			} else {
				self.parent.domInfoTitle.innerHTML = self.parentItem.name? self.parentItem.name:'';
			}
			self.lastChannel = null;
			MediaPlayer.end();
		} else {
			self.parent.domInfoTitle.innerHTML = item.name + '<br />' +  _('Frequency')+ ': ' + item.data.frequency;
			self.parent.initEPGNow();
			MediaPlayer.preparePlayer({
				id : item.data.id,
				name : item.name,
				url : item.data.uri,
				type : item.type,
				sol : 'dvb'
			}, self.parent, true, false, true);
			self.prevChannel = self.lastChannel;
			self.lastChannel = item.data;
		}
	}, 500);
	return false;
};


/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
DVBList.prototype.Clear = function () {
	this.count = 0;
	this.mtypes = [];
	CList.prototype.Clear.call(this);
};

/**
 * Move one level up
 */
DVBList.prototype.Back = function () {
	var self = this,
		data, active;

	// there are some levels
	if ( this.path.length > 1 ) {
		// exiting from favs and there are some changes
		// normal exit
		this.path.pop();
		data = this.path[this.path.length-1];
		this.lastChannel = null;
		if ( this.bcrumb ) {
			this.bcrumb.Pop();
		}
		// render the previous level
		active = this.activeItem.data;
		this.filterText = data.filterText;
		this.filters = data.filters || [];
		this.createList();
		this.loadChannels();
		if ( active ) {
			this.SetPositionByIndex(this.nativList.indexOf(active.id));
		}
		this.Build(data);
		// apply specific button visibility
		// setTimeout(function(){
		// 	self.onFocus(self.Current());
		// }, 0);
		// go up
		return this.LEVEL_CHANGE_UP;
	}
	// stay here
	return this.LEVEL_CHANGE_NONE;
};

/**
 * Go to channel by number
 * @param {number} number
 */
DVBList.prototype.goToChannel = function ( number ) {
	// var numbers = this.list.map(function(item){
	// 		return item.data.channelNumber;
	// 	}),
	// 	index = numbers.indexOf(number),
	var tempList, ch, index;

	// if ( index === -1 ) {
	tempList = stbDvbManager.createChannelList(['eq', 'channelNumber', number], this.nativList);
	if ( tempList.size > 0 ) {
		ch = tempList.slice(0,1);
		index = this.nativList.indexOf(ch[0].id);
		if ( index >= 0 ) {
			this.SetPositionByIndex(index, true);
		}
	}
	// } else {
	// 	this.itemIndex = index;
	// 	this.Focused(this.items[index], true);
	// }
};

/**
 * Set position some list element
 * @param {number} index of list or dome
 * @param {boolean} [manageFocus] - set actual focus
 */
DVBList.prototype.SetPositionByIndex = function ( index, makeFocused ) {
	if ( index >= this.count ) {
		index = this.count - 1;
	}
	if ( index < 0 ) {
		index = 0;
	}
	this.listIndex = index;
	if ( this.RefreshPageIndex() ) {
		this.loadChannels(!makeFocused);
	} else if ( makeFocused ) {
		this.Focused (this.items[ this.itemIndex ], true);
	}
	return true;
};

/**
 * Enter the item or open it
 * @param {Object} data media item inner data
 */
DVBList.prototype.Open = function (data, noPlay) {
	echo(data, 'DVB OPEN');
	var levelChange = this.Build(data, noPlay);

	// level changed
	if ( levelChange !== this.LEVEL_CHANGE_NONE ) {
		// reset tray filter icon
		if ( this.parent.Tray.iconFilter.parentNode === this.parent.Tray.handleInner ) {
			this.parent.Tray.handleInner.removeChild(this.parent.Tray.iconFilter);
		}
		// and hide at all if not necessary
		this.parent.Tray.Show(globalBuffer.size() > 0, false);
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
			// sef focus to the first item
			this.Activate(true);
			//if( data.list && data.list.length ){ this.onFocus(this.activeItem); }
		} else {
			// go up
			//if ( !this.Reposition(this.parentItem) ){
			this.Activate(true);
			//}
		}
		// current level item
		this.parentItem = this.path[this.path.length-1];
	}
	return levelChange;
};


/**
 * Open root, clear all breadcrumbs, search options
 */
DVBList.prototype.Reset = function () {
	this.parentItem = null;
	this.path = [];
	this.Clear();
	// linked components
	if (this.bcrumb){
		this.bcrumb.Reset();
	}
	if (this.sbar){
		this.sbar.Reset();
	}
};

/**
 * Renders the given media item by executing associated action
 * @param {Object} data media item inner data
 */
DVBList.prototype.Build = function (data, noPlay) {
	var levelChange = this.LEVEL_CHANGE_NONE;

	// apply filter parameter from the current node
	this.filterText = data.filterText ? data.filterText : '';
	this.filters = data.filters || [];
	// get item associated open action and execute
	if ( data && data.type && typeof this.openAction[data.type] === 'function' ) {
		levelChange = this.openAction[data.type].call(this, data, noPlay);
	} else {
		// wrong item type
		new CModalAlert(this.parent, _('Error'), _('Unknown type of selected item'), _('Close'));
	}

	return levelChange;
//	this.filterText = data.filterText ? data.filterText : '';
};

/**
 * Clear the list and fill it again
 */
DVBList.prototype.Refresh = function () {
	// var data = null;

	// if ( this.parentItem !== null ) {
	this.loadChannels();
	if ( this.filters.length ) {
		this.count = this.nativList.size + 1;
	} else {
		this.count = this.nativList.size;
	}
	this.SetPositionByIndex(this.listIndex, true);
		// this.Build(this.parentItem);
		// if ( refocus !== false ) {
		//
		// 	if( this.activeItem ) {
		// 		data = this.activeItem.data;
		// 		// this.Reposition(data);
		// 		this.SetPosition(this.activeItem); // focus handle bug fix (even items per page problem)
		// 	}
		// }
	// }
};

/**
 * Moves the cursor to the given element
 * @param {Object} data
 * @return {boolean} operation status
 */
//DVBList.prototype.Reposition = function (data) {
//	if ( data ) {
//		for (var item, i = 0, l = this.Length(); i < l; i++) {
//			item = this.handleInner.children[i];
//			// url and type match
//			if (data.index === item.data.index) {
//				return this.Focused(item, true);
//			}
//		}
//	}
//	return false;
//};

/**
 * Handle checked state for the given item according to the file type.
 * Mark only items available for marking.
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
DVBList.prototype.Marked = function (item, state) {
	// item exists and only allowed types
	if (item && item.data && item.data.markable) {
		// parent marking
		return CList.prototype.Marked.call(this, item, state);
	}
	return false;
};


/**
 * Show/hide file items according to the specified filter options
 * @param {string} text filter file name option
 */
DVBList.prototype.SetFilterText = function (text) {
	echo('enter to SetFilterText : ' + this.filterText);
	// set global (case conversion for future string comparison speedup)
	this.filterText = text.toLowerCase();
	// apply filter
	this.Filter();
};


/**
 * Shows/hides items depending on the given filter string match
 * unmarks all hidden items
 */
DVBList.prototype.Filter = function () {
	// link to the object for limited scopes
	var self = this;
	// check all items
	this.Each(function (item) {
		// check file name if regular file
		var text_ok = item.data.type === MEDIA_TYPE_BACK || (item.data.name && item.data.name.toLowerCase().indexOf(self.filterText) !== -1);
		// check file type if regular file
		// hide not matching items
		echo('item.data.name : ' + item.data.name + ' ' + text_ok);
		self.Hidden(item, !text_ok);
	});
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
DVBList.prototype.ActiveItems = function () {
	// get all marked items
	var items = this.states.marked ? this.states.marked.slice() : [];
	// no marked, check current and its type
	if (items.length === 0 && this.activeItem && this.activeItem.markable) {
		items.push(this.activeItem);
	}
	return items;
};
