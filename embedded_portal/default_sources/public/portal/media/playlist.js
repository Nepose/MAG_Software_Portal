/**
 * Media component: global player playlist
 * @author Roman Stoian
 */

'use strict';

/**
 * @class PlayList
 * @constructor
 */
function PlayList ( parent ) {
	// parent constructor
	CScrollList.call(this, parent);

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
}

// extending
PlayList.prototype = Object.create(CScrollList.prototype);
PlayList.prototype.constructor = PlayList;


/**
 * Create new item and put it in the list
 * @param {string} name item label
 * @param {Object} attrs set of item data parameters
 * @param {Object} states set of additional parameters (stared)
 * @return {Node}
 */
PlayList.prototype.Add = function ( name, attrs, states ) {
	// html prepare
	var body = element('div', {className: 'data'}, name);
	var star = element('div', {className: 'star'});

	// actual filling
	var item = CScrollList.prototype.Add.call(this, [body, star], {
		star         : star,
		data         : {index: attrs.index || attrs.index === 0 ? attrs.index : '', url: attrs.url ? attrs.url : '', pos: attrs.pos || attrs.pos === 0 ? attrs.pos : '', parentI: attrs.parentI || attrs.parentI === 0 ? attrs.parentI : '', sol:  attrs.sol},
		disabled     : attrs.disabled ? true : false,
		focused      : attrs.focused ? true : false,
		marked       : attrs.marked ? true : false,
		// handlers
		onclick      : function () {
			// open or enter the item
			this.self.Open(this.data);
			if ( MediaPlayer.playListShow ) {
				MediaPlayer.domPlayerList.style.visibility = 'hidden';
				MediaPlayer.handle.querySelector('#playerHideplist').innerHTML = _('Show<br />playlist');
				MediaPlayer.playListShow = false;
			}
			return false;
		},
		oncontextmenu: EMULATION ? null : function () {
			return false;
		}
	});
	// mark as favourite
	if ( states && states.stared ) {
		item.self.SetStar(item, true);
	}
	return item;
};


/**
 * Set inner item flags and decoration
 * @param {Node} item the element to be processed
 * @param {boolean} state flag of the operation (true if change is made)
 */
PlayList.prototype.SetStar = function ( item, state ) {
	if ( item.stared === state ) {
		return;
	}
	this.SetState(item, 'stared', state);
};


/**
 * Hook method on focus item change
 * @param {Node} item the new focused item
 * @param {Node} previous the old focused item
 */
PlayList.prototype.onFocus = null;


/**
 * Reset and clear all items
 * This will make the component ready for a new filling.
 */
PlayList.prototype.Clear = function () {
	CScrollList.prototype.Clear.call(this);

	this.filterType = MEDIA_TYPE_NONE;
	this.filterText = '';
	this.mtypes = [];
};


PlayList.prototype.Open = function ( data ) {
	( this.states.marked || []).forEach(function ( item ) {
		item.self.Marked(item, false);
	});
	this.Marked(this.activeItem, true);
	if ( MediaPlayer.timer.slideShow ) {
		clearTimeout( MediaPlayer.timer.slideShow );
	}
	switch ( MediaPlayer.obj.type ) {
		case MEDIA_TYPE_CUE_ITEM:
			MediaPlayer.obj = MediaPlayer.list[this.activeItem.data.index];
			MediaPlayer.domPlayerTitle.innerHTML = MediaPlayer.obj.name;
			gSTB.SetPosTime(MediaPlayer.obj.time);
			break;
		case MEDIA_TYPE_ISO:
			(this.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			this.Marked(this.states.focused[0], true);
			if ( this.parentIndex === data.parentI ) {
				if ( this.playIndex !== data.index ) {
					gSTB.SetPosTime(parseInt(MediaPlayer.dataDVD.titles[data.parentI].chapters[data.index].startTime / 1000, 10));
				}
			} else {
				var param = '?title=' + data.parentI + ' position:' + parseInt(MediaPlayer.dataDVD.titles[data.parentI].chapters[data.index].startTime / 1000, 10);
				MediaPlayer.playNow = false;
				MediaPlayer.runner.stop();
				gSTB.Play((MediaPlayer.sol ? MediaPlayer.sol + ' ' : 'auto ') + MediaPlayer.obj.url + param);
			}
			break;
		default:
			MediaPlayer.prepare(MediaPlayer.list[data.index], true);
			break;
	}
	this.playIndex = data.index;
	this.parentIndex = data.parentI;
	if ( this.parent.parent === MediaBrowser ) {
		MediaBrowser.FileList.Reposition(this.parent.obj);
	}
};


PlayList.prototype.Reset = function () {
	this.parentItem = null;
	this.path = [];
	this.Clear();
};


PlayList.prototype.Refresh = function () {
	this.Activate();
	if ( this.states.marked && this.states.marked[0] ) {
		this.Focused(this.states.marked[0], true);
	} else {
		this.Focused(this.handle.children[0], true);
	}
};


/**
 * if we have even number of items per page we should prepare hidden element to get focus.
 * Otherwise border items will be cut in half.
 * @param {Object} item item to prepare
 */
PlayList.prototype.PreparePosition = function ( item ) {
	// if there is a problem situation
	if ( this.activeItem !== item && this.itemsPerPage%2 === 0 ) {
		// manage item visibility
		this.handleInner.scrollTop = item.offsetTop - /*Math.floor*/((this.itemsPerPage)/2) * this.itemHeight;
	}
};
