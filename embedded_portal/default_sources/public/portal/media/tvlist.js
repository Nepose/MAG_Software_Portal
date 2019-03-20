'use strict';

/**
 * @class TVList
 * @constructor
 * @author Roman Stoian
 */
function TVList(parent) {
	// parent constructor
	CScrollList.call(this, parent);

	/**
	 * link to the object for limited scopes
	 * @type {TVList}
	 */
	var self = this;

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
	 * @type Number
	 */
	this.filterType = MEDIA_TYPE_NONE;

	/**
	 * data filter for file listing
	 * @type String
	 */
	this.filterText = '';

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
	this.parentItem = {};

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
	this.openAction[MEDIA_TYPE_TV_ROOT] = function () {
		var j = 0;
		var item = null;
		this.channelStart = -1;
		this.Clear();
		if ( this.filterText) {
			this.Add({name: '..'}, {type: MEDIA_TYPE_BACK});
			this.channelStart++;
		}

		if (this.data.length > 0) {
			for (var i = 0; i < this.data.length; i++) {
				if (this.data[i].type === MEDIA_TYPE_GROUP) {
					item = this.Add({name: this.data[i].name}, {name: this.data[i].name, index: i, markable: true, data: this.data[i].data, type: MEDIA_TYPE_GROUP});
					if(item){
						this.channelStart = i;
					}
				} else {
					item = this.Add({name: this.data[i].name, number: j+1, tsOn: configuration.mayTimeShift && this.data[i].tsOn}, {name: this.data[i].name, markable: true, index: i, number: j+1, type: MEDIA_TYPE_STREAM}, {stared: FAVORITES_NEW[(this.data[i].sol? this.data[i].sol + ' ' : '') + this.data[i].url] ? true : false});
					if(item){
						j++;
					}
				}
			}
			self.parent.domInfoTitle.innerHTML = self.data[0].name?self.data[0].name:'';
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF1, false);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, false);
			this.parent.handle.querySelector('.content').querySelector('.crop').className = 'crop';
		} else {
			if ( this.filterText) {
				self.parent.domURL.innerHTML = '';
				self.parent.domInfoTitle.innerHTML = '';
			}
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF1, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, true);
			this.parent.handle.querySelector('.content').querySelector('.crop').className = 'crop defImage';
		}
		return this.LEVEL_CHANGE_DOWN;
	};

	this.openAction[MEDIA_TYPE_GROUP] = function (data) {
		var item =  null;
		this.Clear();
		this.Add({name: '..'}, {type: MEDIA_TYPE_BACK});
		var j = 0;
		this.channelStart = -1;
		if (data.data.length > 0) {
			for (var i = 0; i < data.data.length; i++) {
				if (data.data[i].type === MEDIA_TYPE_GROUP) {
					item = this.Add({name: data.data[i].name}, {name: data.data[i].name, index: i, markable: true, data: data.data[i].data, type: MEDIA_TYPE_GROUP});
					if(item){
						this.channelStart = i;
					}
				} else {
					item = this.Add({name: data.data[i].name, number: j+1, tsOn: configuration.mayTimeShift && data.data[i].tsOn}, {name: data.data[i].name, markable: true, index: i, number: j+1, type: MEDIA_TYPE_STREAM}, {stared: FAVORITES_NEW[(data.data[i].sol? data.data[i].sol + ' ' : '') + data.data[i].url] ? true : false});
					if(item){
						j++;
					}
				}
			}
			self.parent.domInfoTitle.innerHTML = self.data[0].name?self.data[0].name:'';
		} else {
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF1, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, true);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, true);
		}
		return this.LEVEL_CHANGE_DOWN;
	};

	this.openAction[MEDIA_TYPE_STREAM] = function (data, noPlay) {
		if (MediaPlayer.obj !== self.parentItem.data[data.index] && !noPlay) {
			MediaPlayer.preparePlayer(self.parentItem.data[data.index], this.parent, true, true, true);
		} else {
			if (MediaPlayer.ts_inProgress) {
				if ( environment.ts_icon ){
					MediaPlayer.domTSIndicator.style.display = 'block';
				}
				MediaPlayer.runner.start();
			}
			MediaPlayer.Show(true, this.parent);
			MediaPlayer.showInfo(true);
			MediaPlayer.timer.showInfo = setTimeout(function () {
				MediaPlayer.showInfo(false);
			}, 3000);
		}
		return this.LEVEL_CHANGE_NONE;
	};
}

// extending
TVList.prototype = Object.create(CScrollList.prototype);
TVList.prototype.constructor = TVList;


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
TVList.prototype.SetBreadCrumb = function ( component ) {
	this.bcrumb = component;
};


/**
 * Setter for linked component
 * @param {CBase} component associated object
 */
TVList.prototype.SetSearchBar = function ( component ) {
	this.sbar = component;
};


/**
 * Shows/hides items depending on the given filter string match
 * unmarks all hidden items
 */
TVList.prototype.Filter = function () {
	// link to the object for limited scopes
	var self = this;
	// check all items
	this.Each(function(item){
		// check file name if regular file
		var text_ok = item.data.type === MEDIA_TYPE_BACK || (item.data.name && item.data.name.toLowerCase().indexOf(self.filterText) !== -1);
		// check file type if regular file
		var type_ok = item.data.type === self.filterType || self.filterType === MEDIA_TYPE_NONE || item.data.type === MEDIA_TYPE_BACK;
		// hide not matching items
		self.Hidden(item, !(text_ok && type_ok));
	});
};

/**
 * Finds the first appropriate item
 * @param {string} value
 * @return {Node}
 */
TVList.prototype.FirstMatch = function ( value ) {
	// preparing
	var items;

	if ( value === '' ) {
		return null;
	}
	items = this.handleInner.children;  // all list items
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
 * @param {string} obj item label
 * @param {Object} attrs set of item data parameters
 * @param {Object} states set of additional parameters (stared)
 * @return {Node}
 */
TVList.prototype.Add = function (obj, attrs, states) {
	var self = this, number;

	// is it necessary to filter
	if ( this.filterText) { // || this.filterType !== MEDIA_TYPE_NONE
		// check file name if regular file
		var text_ok = attrs.type === MEDIA_TYPE_BACK || (obj.name && obj.name.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1);
		// check file type if regular file
		var type_ok = attrs.type === this.filterType || this.filterType === MEDIA_TYPE_NONE || attrs.type === MEDIA_TYPE_BACK;
		// hide not matching items
		if ( !(text_ok && type_ok) ) {
			return null;
		}
	}
	if (this.mtypes.indexOf(attrs.type) === -1) {
		this.mtypes.push(attrs.type);
	}
	// html prepare
	var body = element('div', {className: 'data'}, obj.name);
	var star = element('div', {className: 'star'});
	if (obj.number) {
		number = element('div', {className: 'number'}, obj.number);
	} else {
		number = element('div', {className: 'number'});
		number.style.background = 'url("' + PATH_IMG_PUBLIC + 'media/type_' + attrs.type + '.png") no-repeat center';
	}
	var timeshift = element('div', {className: obj.tsOn? 'timeshift tsOn' : 'timeshift'});
	// decoration
	// make sure name is set
	if (!attrs.name) {
		attrs.name = obj.name;
	}
	// actual filling
	var item = CScrollList.prototype.Add.call(this, [number, body, timeshift, star], {
		star: star,
		data: attrs,
		// handlers
		onclick: function () {
			// open or enter the item
			this.self.Open(this.data);
			return false;
		},
		oncontextmenu: EMULATION ? null : function () {
			// mark/unmark the item
			self.parent.actionF2(false);
			return false;
		}
	});
	if(obj.number){
		item.domNumber = number;
	}
	// mark as favourite
	if (states && states.stared) {
		item.self.SetStar(item, true);
	}
	return item;
};


/**
 * Set inner item flags and decoration
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the operation (true if change is made)
 */
TVList.prototype.SetStar = function (item, state) {
	if (item.stared === state) {
		return;
	}
	this.SetState(item, 'stared', state);
	if (state !== false) {
		item.star.style.background = 'url("' + PATH_IMG_PUBLIC + 'ico_fav_s.png") no-repeat right';
	} else {
		item.star.style.background = 'none';
	}
	this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, state !== false ? true : false);
	this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, state !== false ? false : true);
};


/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 */
TVList.prototype.onFocus = function (item) {
	var self = this;
	if ( MediaPlayer.ts_inProgress ) {
		if (MediaPlayer.tsExitCheck('focus', item)) {
			return true;
		}
	}
	clearTimeout(this.timer.OnFocusPlay);
	if ( item.data.markable ) {
		this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, false);
	} else {
		this.parent.BPanel.Hidden(this.parent.BPanel.btnF2, true);
	}
	if (item.data.type === MEDIA_TYPE_STREAM) {
		if (!this.states.marked || this.states.marked.length === 0) {
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, item.stared);
			this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, !item.stared);
		} else {
			echo(this.states.marked[0].data,'this.states.marked');
		}
	} else {
		this.parent.BPanel.Hidden(this.parent.BPanel.btnF3add, true);
		this.parent.BPanel.Hidden(this.parent.BPanel.btnF3del, true);
	}
	self.parent.clearEPG();
	this.timer.OnFocusPlay = setTimeout(function () {
		if ( item.data.type === MEDIA_TYPE_BACK ){
			if(self.filterText){
				self.parent.domInfoTitle.innerHTML = _('Contains the list of items corresponding to the given filter request');
			} else {
				self.parent.domInfoTitle.innerHTML = self.parentItem.name?self.parentItem.name:'';
			}
		} else {
			self.parent.initEPGNow();
			self.parent.domInfoTitle.innerHTML = item.data.name?item.data.name:'';
		}
		if (item.data.type === MEDIA_TYPE_STREAM) {
			self.prevChannel = self.lastChannel;
			self.lastChannel = self.parentItem.data[item.data.index];
			self.parent.domURL.innerHTML = (self.parentItem.data[item.data.index].sol && self.parentItem.data[item.data.index].sol !==''?self.parentItem.data[item.data.index].sol+' ':'')+self.parentItem.data[item.data.index].url;
			if ( MediaPlayer.obj !== self.parentItem.data[item.data.index] ) {
				MediaPlayer.preparePlayer(self.parentItem.data[item.data.index], self.parent, true, false, true);
			}
			if ( self.parent.pvr.arr.length ) {
				self.parent.pvr.check(true);
			}
		} else {
			self.lastChannel = null;
			self.parent.domURL.innerHTML = '';
			MediaPlayer.end();
		}
	}, 500);
	return false;
};


/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
TVList.prototype.Clear = function () {
	CScrollList.prototype.Clear.call(this);
	this.parent.domURL.innerHTML = '';
	this.parent.domInfoTitle.innerHTML = '';
	this.filterType = MEDIA_TYPE_NONE;
	this.mtypes = [];
};


/**
 * Move one level up
 */
TVList.prototype.Back = function () {
	var self = this;
	// there are some levels
	if ( this.path.length > 1 ) {
		// exiting from favs and there are some changes
		// normal exit
		this.path.pop();
		self.lastChannel = null;
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
 * Go to channel by number
 * @param {number} number
 */
TVList.prototype.goToChannel = function (number) {
	if (this.handle.children.length > number && number > this.channelStart) {
		this.Focused(this.handle.children[number+(this.handle.children[0].data.type === MEDIA_TYPE_BACK? 1:0)], true);
		this.SetPosition(this.activeItem);
	}
};

/**
 * Enter the item or open it
 * @param {Object} data media item inner data
 */
TVList.prototype.Open = function (data, noPlay) {
	// render the list
	echo(data,'data Open');
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
			if( data.data && data.data.length ){ this.onFocus(this.activeItem); }
		} else {
			// go up
			if ( !this.Reposition(this.parentItem) ){
				this.Activate(true);
			}
		}
		// current level item
		this.parentItem = this.path[this.path.length-1];
	}
	return levelChange;
};


/**
 * Open root, clear all breadcrumbs, search options
 */
TVList.prototype.Reset = function () {
	this.parentItem = null;
	this.path = [];
	this.Clear();
	// linked components
	if ( this.bcrumb ) {
		this.bcrumb.Reset();
	}
	if ( this.sbar ) {
		this.sbar.Reset();
	}
};

/**
 * Renders the given media item by executing associated action
 * @param {Object} data media item inner data
 */
TVList.prototype.Build = function (data, noPlay) {
	var levelChange = this.LEVEL_CHANGE_NONE;
	// apply filter parameter from the current node
	this.filterText = data.filterText ? data.filterText : '';
	// get item associated open action and execute
	if ( data && data.type && typeof this.openAction[data.type] === 'function' ) {
		levelChange = this.openAction[data.type].call(this, data, noPlay);
	} else {
		// wrong item type
		new CModalAlert(this.parent, _('Error'), _('Unknown type of selected item'), _('Close'));
	}
	return levelChange;
};

/**
 * Clear the list and fill it again (will try to refocus)
 * @param {boolean} [refocus=true] if true then try to set focus to the previous focused element
 */
TVList.prototype.Refresh = function (refocus) {
	var data = {data : null};
	// some media item is opened at the moment
	if ( this.parentItem !== null ) {
		// get current focused item
		this.Build(this.parentItem);
		if ( refocus !== false) {
			if ( this.activeItem ) {
				data = this.activeItem;
			} else {
				data = this.FirstMatch(this.filterText);
			}
		}
		// refill
		// find it in the new list if necessary
		if ( data && data.data ) {
			this.Reposition(data.data);
		} else {
			this.Reposition(data);
		}
	}
};

/**
 * refresh list index in dom objects
 */
TVList.prototype.RefreshIndex = function () {
	this.channelStart = this.parentItem.type === MEDIA_TYPE_GROUP? 0 : -1;
	var i = 0,
		j = 1,
		items = this.handleInner.children,
		delta = 0;
	if ( this.parentItem !== null && items.length ) {
		delta = items[0].data.type === MEDIA_TYPE_BACK? 1: 0;
		for(i = delta; i < items.length; i++){
			items[i].data.index = i - delta;
			if(items[i].data.type === MEDIA_TYPE_GROUP){
				this.channelStart = i;
			} else {
				items[i].data.number = j;
				items[i].domNumber.innerHTML = j;
				j++;
			}
		}
	} else {
		this.Refresh(true);
	}
};


/**
 * Moves the cursor to the given element
 * @param {Object} data
 * @return {boolean} operation status
 */
TVList.prototype.Reposition = function (data) {
	var change = false;
	if ( data ) {
		for ( var item, i = 0, l = this.Length(); i < l; i++ ) {
			item = this.handleInner.children[i];
			// url and type match
			if (data.index === item.data.index || (data.data && !data.index && data.data.index === item.data.index)) {
				change = this.Focused(item, true);
				this.SetPosition(this.activeItem);  // focus handle bug fix (even items per page problem)
				if(!change){
					this.onFocus(item);
				}
				return change;
			}
		}
	}
	return false;
};

/**
 * Handle checked state for the given item according to the file type.
 * Mark only items available for marking.
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the state
 * @return {boolean} operation status
 */
TVList.prototype.Marked = function (item, state) {
	// item exists and only allowed types
	if (item && item.data && item.data.markable) {
		// parent marking
		return CScrollList.prototype.Marked.call(this, item, state);
	}
	return false;
};


/**
 * Show/hide file items according to the specified filter options
 * @param {string} text filter file name option
 */
TVList.prototype.SetFilterText = function (text) {
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
TVList.prototype.Filter = function () {
	// link to the object for limited scopes
	var self = this;
	// check all items
	this.Each(function (item) {
		// check file name if regular file
		var text_ok = item.data.type === MEDIA_TYPE_BACK || (item.data.name && item.data.name.toLowerCase().indexOf(self.filterText) !== -1);
		self.Hidden(item, !text_ok);
	});
};


/**
 * Return all appropriate items available for actions (either marked or current with suitable type)
 * @return {Array} list of found Nodes
 */
TVList.prototype.ActiveItems = function () {
	// get all marked items
	var items = this.states.marked ? this.states.marked.slice() : [];
	// no marked, check current and its type
	if (items.length === 0 && this.activeItem && this.activeItem.data.markable) {
		items.push(this.activeItem);
	}
	return items;
};


/**
 * Create group of channels
 */
TVList.prototype.createGroup = function (name, data, toDelete, deleteList) {
	var obj = {}, dataMap = [];
	var map = this.parentItem.data.map(function(item){return item.type === MEDIA_TYPE_GROUP?item.name:null;});
	var toAdd = map.indexOf(name);
	echo(toDelete,'toDelete');
	if(toAdd === -1){
		obj.name = name;
		obj.type = MEDIA_TYPE_GROUP;
		obj.data = [];
		this.parentItem.data.splice(this.channelStart + 1, 0, obj);
	} else {
		dataMap = data.map(function(item){if(item.type === MEDIA_TYPE_GROUP){return item.name;}});
		for(var i=0; i<dataMap.length; i++){
			if(map.indexOf(dataMap[i]) !== -1){
				new CModalAlert(currCPage,_('Error'),_('Copying error'));
				return false;
			}
		}
		obj = this.parentItem.data[toAdd];
	}
	var ansvCode = this.addChannelsToList(obj.data, JSON.parse(JSON.stringify(data)), false, true);
	if(ansvCode !== 0){
		this.parent.actionFileDelete(toDelete,deleteList);
	}
	this.Refresh(false);
	if(toAdd === -1){
		this.Focused(this.handle.children[this.channelStart+(this.handle.children[0].data.type === MEDIA_TYPE_BACK? 1:0)], true);
	} else {
		this.Focused(this.handle.children[toAdd+(this.handle.children[0].data.type === MEDIA_TYPE_BACK? 1:0)], true);
	}
	if (this.isActive) {
		this.Activate();
	}
	return true;
};

/**
 * Add channels to group
 * @param {Array} list - group to add
 * @param {Array} data - channels array
 * @param {boolean} [refocus] - need refocus
 * @param {boolean} [noRefresh] - don't refresh list
 * @return {boolean} need checked list
 */
TVList.prototype.addChannelsToList = function (list, data, refocus, noRefresh) {
	echo(list,'ADD TO LIST');
	echo(data,'ADD DATA');
	var needCheck = false, tempList = [], channelStart = -1;
	var map = this.path.map(function(item){return item.data;});
	var mapList = list.map(function(item){return item.type;});
	channelStart = mapList.lastIndexOf(MEDIA_TYPE_GROUP);
	if (data){
		for (var i = 0; i < data.length; i++) {
			if ( data[i].type === MEDIA_TYPE_GROUP && map.indexOf(data[i].data) !== -1 ){
				new CModalAlert(this.parent,_('Error'),_('Copying error'));
				return 0;
			}
		}
		for ( i = 0; i < data.length; i++ ) {
			var needAdd = true;
			for (var j = 0; j < list.length; j++) {
				if (list[j].name === data[i].name && list[j].type === data[i].type && (list[j].url === data[i].url || list[j].sol +' '+ list[j].url === data[i].url || list[j].url === data[i].sol +' '+ data[i].url)) {
					needAdd = false;
					break;
				}
			}
			if (needAdd) {
				if(data[i].type === MEDIA_TYPE_GROUP){
					channelStart++;
					list.splice(channelStart, 0, data[i]);
				} else {
					list.push(data[i]);
				}
				needCheck = true;
			}
		}
	}
	if(needCheck){
		tempList = list.slice();
		tempList = IPTVChannels.checkTS_data(tempList,true);
		list = tempList.a;
	}
	this.parent.needSave = true;
	if( !noRefresh ){
		this.Refresh(refocus);
	}
	return needCheck;
};
