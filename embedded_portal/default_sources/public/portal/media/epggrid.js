'use strict';

/**
 * @class Epg Grid
 * @constructor
 * @author Roman Stoian
 */
function EpgGrid ( parent ) {
	// parent constructor
	var customParams = {
			onPage : ( function () {
				var count = {
					480: 4,
					576: 6,
					720: 6,
					1080: 6
				};
				return count[ screen.height ];
			}) ()
		};
	this.sheduleWidth = ( function () {
		var width = {
			480: 327,
			576: 327,
			720: 824,
			1080: 1235
		};
		return width[ screen.height ];
	})();


	CList.call( this, parent, customParams );

	/**
	 * link to the object for limited scopes
	 * @type {DVBList}
	 */

	this.time = null;
	this.day = 0;
	this.timeStep = ( function () {
		var width = {
			480: 60 * 60,
			576: 60 * 60,
			720: 120 * 60,
			1080: 120 * 60
		};
		return width[ screen.height ];
	})();
	this.countOfSteps = ( function () {
		var width = {
			480: 2,
			576: 2,
			720: 4,
			1080: 4
		};
		return width[ screen.height ];
	})();
	this.sheduleBlock = this.sheduleWidth / this.timeStep;
	this.timeLine = null;
	this.timeLineMargin = ( function () {
		var margin = {
			480: 338,
			576: 338,
			720: 390,
			1080: 585
		};
		return margin[ screen.height ];
	})();
	this.startEPGTime = null;


	this.domTimeblocks = this.parent.handle.querySelector('.content .timeblocks');

	this.timer = {};
	this.internal = {};
	this.epgMode = 0;// 0- real time 1- in focus
	this.domEpgItemFocus = null;
	this.domProgramBlock = this.parent.handle.querySelector('.content .current_prog');

	this.pressOK = function ( item ) {
		var data;
		if ( item.subNavigElements.length ) {
			data = item.subNavigElements[item.epgActive].data || {};
			if ( !data.details && !data.info ) {
				return false;
			}
			new CModalEPGInfo(currCPage, data);
		}
	};
}

// extending
EpgGrid.prototype = Object.create( CList.prototype );
EpgGrid.prototype.constructor = EpgGrid;


EpgGrid.prototype.EventHandler = function ( event ) {
	switch ( event.code ) {
		case KEYS.PAGE_UP:
		case KEYS.PAGE_DOWN:
		case KEYS.UP:
		case KEYS.DOWN:
		case KEYS.HOME:
		case KEYS.END:
		case KEYS.OK:
			// clist navigation
			CList.prototype.EventHandler.call ( this, event );
			break;
		case KEYS.LEFT:
			this.SubPrev();
			break;
		case KEYS.RIGHT:
			this.SubNext();
			break;
		default:
			// block all the rest
			event.preventDefault();
	}
};

EpgGrid.prototype.Init = function ( handle ) {
	// parent call init with placeholder
	CList.prototype.Init.call( this, handle );
	for ( var i = 0; i < this.onPage; i++ ) {
		this.items[ i ].domElements = {
			channelNumber : this.items[ i ].querySelector( '.channel_number' ),
			channelName : this.items[ i ].querySelector( '.channel_name' ),
			epgList : this.items[ i ].querySelector( '.schedule_line' )
		};
		this.items[ i ].epgActive = 0;
		this.items[ i ].number = -1;
		this.items[ i ].day = 0;
		this.items[ i ].epgData = null;
		this.items[ i ].subNavigElements = [];
	}
	this.timeLine = this.parent.handle.querySelector('.content .timeline');
};

/**
 * exit
 */
EpgGrid.prototype.Exit = function () {
	var i;
	for ( i in this.timer ) {
		clearTimeout( this.timer[i] );
	}
	for ( i in this.internal ) {
		clearInterval( this.internal[i] );
	}
	this.time = null;
	this.SetList ( [] );
	return true;
};

/**
 * Generate body item
 */
EpgGrid.prototype.RenderItem = function () {
	var item = [
		element ( 'div', { className: 'channel_block' }, [
			element ( 'div', { className: 'channel_number' } ),
			element ( 'div', { className: 'channel_name' } )
		]),
		element ( 'div', { className: 'schedule_line' } )
	];

	return item;
};

/**
 * Fill items
 * @params {boolean} noFocus don't set focus
 */
EpgGrid.prototype.FillItems = function ( noFocus ) {
	var startPos = this.onPage * this.pageIndex,
		listLength = this.list.length,
		active = null,
		list = [];

	for ( var i = 0; i < this.onPage; i++ ) {
		this.items[ i ].epgActive = 0;
		this.items[ i ].epgData = null;
		this.items[ i ].subNavigElements = [];
		elclear( this.items[ i ].domElements.epgList );
		if ( listLength > i + startPos ) {
			this.items[ i ].domElements.channelNumber.innerHTML = this.list[ i + startPos ].channel_number;
			this.items[ i ].domElements.channelName.innerHTML = this.list[ i + startPos ].name;
			this.items[ i ].data = this.list[ i + startPos ];
			this.items[ i ].index = i + startPos;
			this.items[ i ].number = this.list[ i + startPos ].channel_number;
			list.push( this.items[ i ] );
			this.Hidden( this.items[ i ], false );
			if ( i + startPos === this.listIndex ) {
				active = this.items[ i ];
			}
			this.items[ i ].day = this.day;
		} else {
			this.items[ i ].domElements.channelNumber.innerHTML = '';
			this.items[ i ].domElements.channelName.innerHTML = '';
			this.items[ i ].data = null;
			this.items[ i ].index = -1;
			this.items[ i ].number = -1;
			this.items[ i ].day = 0;
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
EpgGrid.prototype.onFillItems = function ( active, list ) {
    if ( typeof this.GetEpg === 'function' ) {
		for ( var i = 0; i < list.length; i++ ){
			this.InitEPG( list[ i ], this.GetEpg ( list[ i ].data ) );
		}
	}
};


/**
 * on Focus
 * @params {Node} item
 */
EpgGrid.prototype.onFocus = function ( item ) {
	elclear(this.domProgramBlock);
	this.CheckEPGActive( item );
	this.SubFocused ( item.subNavigElements[ item.epgActive ], true );
};

/**
 * Set current program
 * @params {Object} data
 */
EpgGrid.prototype.SetCurrentProgram = function ( data ) {
	var startTime = null,
		endTime = null,
		min = null,
		h = null,
		time = '';
	elclear( this.domProgramBlock );
	if ( data ) {
		startTime = new Date ( data.start * 1000 );
		endTime = new Date ( ( data.start + data.duration ) * 1000 );
		min = startTime.getMinutes();
		h = startTime.getHours();
		min = min > 9? min : '0' + min;
		h = h > 9? h : '0' + h;
		time += h + ':' + min + ' - ';
		min = endTime.getMinutes();
		h = endTime.getHours();
		min = min > 9? min : '0' + min;
		h = h > 9? h : '0' + h;
		time += h + ':' + min;
		elchild( this.domProgramBlock, time + ' ' + ( data.info? data.info : data.name ) );
	}
};

/**
 * Go to channel by number
 * @param {number} number
 * @return {number} index of channel
 */
EpgGrid.prototype.goToChannel = function ( number ) {
    var index = this.FindByFild ( number, 'channel_number' );

	if ( index !== -1 ) {
		this.listIndex = index;
		if ( this.RefreshPageIndex() ) {
			this.FillItems();
		} else {
			this.Focused ( this.items [ this.itemIndex ] );
		}
	}
	return index;
};

/**
 * Reposition time line
 */
EpgGrid.prototype.ReposTimeLine = function () {
	var newTime = new Date(),
		left = 0,
		time = newTime.getTime()/1000;
	if ( time > this.time && ( this.time + this.timeStep ) > time ) {
		left = Math.ceil( ( time - this.time ) / this.timeStep * this.sheduleWidth );
		left += this.timeLineMargin;
		this.timeLine.style.display = 'block';
		this.timeLine.style.left = left + 'px';
	} else {
		this.timeLine.style.display = 'none';
	}
};


/**
 * Checking EPG in time
 */
EpgGrid.prototype.CheckingTime = function () {
	var self = this;
	if ( this.internal.checkingTime ) {
		clearInterval( this.internal.checkingTime );
	}
	this.ReposTimeLine();
	this.internal.checkingTime = window.setInterval( function () {
		var newTime = self.GetStartTime(),
			index = 0;
		if ( !self.epgMode ) {
			if ( self.activeItem && self.activeItem.subNavigElements.length ) {
				index = self.activeItem.epgActive;
				self.CheckEPGActive( self.activeItem );
				if ( self.activeItem.epgActive !== index ) {
					self.SubFocused ( self.activeItem.subNavigElements[ self.activeItem.epgActive ], true );
				}
			}
			if ( self.time !== newTime ) {
				self.time = newTime;
				self.InitTimeBlock();
				self.RefreshEPG();
			}
		}
		self.ReposTimeLine();
	}, 60000 );
};

/**
 * Refresh EPG item
 * @param {boolean} focusOnLast do focus last element
 */
EpgGrid.prototype.RefreshEPG = function ( focusOnLast ) {
    var items = this.ActiveItems();
	for ( var i = 0; i < items.length; i++ ) {
		this.InitEPG( items[ i ], this.GetEpg ( items[ i ].data ), focusOnLast );
	}
};

/**
 * Checking EPG data by event
 */
EpgGrid.prototype.CheckEPGData = function () {
    var items = this.ActiveItems(),
		newData = null;
	if ( typeof this.GetEpg !== 'function' ) {
		return false;
	}
	for ( var i = 0; i < items.length; i++ ) {
		newData = this.GetEpg ( items[ i ].data );
		if ( newData && newData.length ) {
			if ( !items[ i ].epgData || items[ i ].epgData.length === 0 || newData[ 0 ].start !== items[ i ].epgData[ 0 ].start ) {
				this.InitEPG( items[ i ], newData );
			}
		}
	}
	return true;
};


/**
 * Init time block
 */
EpgGrid.prototype.InitTimeBlock = function () {
	if( this.time === null ) {
		this.time = this.GetStartTime();
	}
	var time = new Date( this.time *1000 ),
		step = this.timeStep/ this.countOfSteps,
		dayName = fullDaysOfWeek [ time.getDay() ],
		min = time.getMinutes(),
		hour = time.getHours(),
		month = time.getMonth()+1,
		day = time.getDate(),
		year = time.getFullYear(),
		dateText = dayName + ' ' + ( day < 10? '0' + day : day ) + '.' + ( month < 10? '0' + month : month ) + '.' + year,
		elements = element ( 'div', { className: 'mainblock'}, [
			element ( 'span', {}, dateText ),
			( hour < 10? '0' + hour : hour ) + ':' + ( min < 10? '0' + min: min )
		]);
	elclear( this.domTimeblocks );
	elchild( this.domTimeblocks, elements );
	for ( var i = 1; i <= this.countOfSteps; i++ ) {
		time.setTime( ( this.time + i * step) *1000 );
		min = time.getMinutes();
		hour = time.getHours();
		elchild( this.domTimeblocks, element ( 'div', {className: 'block' }, ( hour < 10? '0' + hour : hour ) + ':' + ( min < 10? '0' + min: min ) ) );
	}
};

/**
 * Get start time
 */
EpgGrid.prototype.GetStartTime = function () {
	var date = new Date(),
		time = 0,
		step = this.timeStep/ this.countOfSteps;
	time = date.getMinutes() * 60;
	if ( time % step === 0 ) {
		return Math.ceil( date.getTime()/1000 ) - step;
	}
	if ( time < step ) {
		return Math.ceil( date.getTime()/1000 ) - time;
	}
	return Math.ceil( date.getTime()/1000 ) - time + step;
};

/**
 * Init EPG list from element
 * @param {Node} item
 * @param {Array} list
 * @param {boolean} focusOnLast do focus last element
 */
EpgGrid.prototype.InitEPG = function ( item, list, focusOnLast ) {
	var epgItems = [], i,
		before = this.time;
	if ( Array.isArray ( list ) ) {
		if ( item.epgData !== list ) {
			item.epgData = list;
		}
	} else {
		if ( !Array.isArray ( item.epgData ) || !item.epgData.length ) {
			this.ClearEPGList ( item );
			return false;
		}
	}
	echo(item.epgData,'item.epgData');
	for ( i = 0; i < item.epgData.length; i++ ) {
		if( item.epgData[ i ].start >= this.time + this.timeStep - 60 ) {
			break;
		}
		if ( item.epgData[i].start + item.epgData[i].duration > this.time ) {
			if ( item.epgData[i].start <= before ) {
				before = item.epgData[ i ].start + item.epgData[i].duration;
				epgItems.push ( item.epgData[i] );
				continue;
			}
			epgItems.push ({
				start: before,
				duration: item.epgData[i].start - before,
				name: '',
				info: '',
				details: '',
				hidden: true
			});
			before = item.epgData[i].start;
			i--;
		}
	}
	echo (epgItems,'epgItems');
	this.RenderEPG( item, epgItems, focusOnLast );
	return true;
};

/**
 * Clear EPG list from element
 * @param {Node} item
 */
EpgGrid.prototype.ClearEPGList = function ( item ) {
	elclear( item.domElements.epgList );
	if ( item.focused ) {
		item.subNavigElements = [];
		this.domEpgItemFocus = null;
		this.SetCurrentProgram ();
	}
	elchild( item.domElements.epgList, element ( 'div', { className: 'empty' }, _('EPG is missing') ) );
};

/**
 * Render EPG list from element
 * @param {Node} item
 * @param {Array} list
 * @param {boolean} focusOnLast do focus last element
 */
EpgGrid.prototype.RenderEPG = function ( item, list, focusOnLast ) {
	var itemsList = [],
		finalList = [],
		width = 0, i;
	elclear( item.domElements.epgList );
	if ( !Array.isArray( list ) || list.length === 0 ) {
		this.ClearEPGList ( item );
		return;
	}
	for ( i = 0; i < list.length; i++ ) {
		itemsList[ i ] = element ( 'div', { className: 'block' + (list[ i ].hidden? ' hidden':'')}, list[ i ].name );
		itemsList[ i ].data = list [ i ];
		if ( list[ i ].start < this.time ){
			width = this.sheduleBlock * ( list[ i ].duration - ( this.time - list[ i ].start ) );
		} else {
			width = this.sheduleBlock * list[ i ].duration;
		}
		width = Math.floor( width );
		itemsList[ i ].style.width = width + 'px';
		itemsList[ i ].data = list[ i ];
	}
	for ( i = 0; i < itemsList.length; i++ ) {
		if ( !itemsList[i].data.hidden ) {
			finalList.push(itemsList[i]);
		}
	}
	item.subNavigElements = finalList;
	if ( item.focused ) {
		if ( !focusOnLast ) {
			this.CheckEPGActive ( item );
		} else {
			item.epgActive = item.subNavigElements.length? item.subNavigElements.length-1 : 0;
		}
		this.SubFocused ( item.subNavigElements[ item.epgActive ], true );
	}
	elchild( item.domElements.epgList, itemsList );
};

/**
 * Check sub active elements
 * @param {Node} item
 */
EpgGrid.prototype.CheckEPGActive = function ( item ) {
	var index = 0,
		time = new Date();
	if ( this.epgMode === 0 ) {
		time = time.getTime() / 1000;
	} else if ( this.activeItem ) {
		if ( this.activeItem.subNavigElements.length ) {
			time = this.activeItem.subNavigElements[ this.activeItem.epgActive ].data.start;
		} else {
			item.epgActive = index;
			return;
		}
	}
	for ( var i = 0; i < item.subNavigElements.length; i++ ) {
		if ( item.subNavigElements[ i ].data.start <= time && ( item.subNavigElements[ i ].data.start + item.subNavigElements[ i ].data.duration ) >= time ) {
			index = i;
			break;
		}
	}
	item.epgActive = index;
};


/**
 * Handle focus state for the given item
 * also removes the focus from the previously focused item
 * @param {Node} subitem the element to be processed
 * @param {boolean} [state=true] flag of the state
 * @return {boolean} operation status
 */
EpgGrid.prototype.SubFocused = function ( subitem, state ) {
	var changed = false;
	state = state !== false;
	// valid html element given, enabled and visible
	if ( subitem && subitem.nodeName ) {
		// states differ
		if ( state !== subitem.focused ) {
			if ( state ) {
				// different subitem (not currently active item)
				if ( subitem !== this.domEpgItemFocus ) {
					if ( this.domEpgItemFocus ) {
						this.domEpgItemFocus.focused = false;
						this.domEpgItemFocus.classList.remove( 'focus' );
					}
					this.domEpgItemFocus = subitem;
					subitem.focused = state;
					subitem.classList.add( 'focus' );
					this.onSubFocus ( subitem );
				}

			} else {
				// flag and decoration
				subitem.classList.remove( 'focus' );
				if ( subitem === this.domEpgItemFocus ) {
					this.domEpgItemFocus = null;
				}
			}
			changed = true;
		}
	} else {
		if ( this.domEpgItemFocus ) {
			this.domEpgItemFocus.focused = false;
			this.domEpgItemFocus.classList.remove( 'focus' );
			changed = true;
		}
	}
	// operation status
	return changed;
};

/**
 * @param {Node} subitem the element to be processed
 */
EpgGrid.prototype.onSubFocus = function ( subitem ) {
	this.SetCurrentProgram ( subitem.data );
};

/**
 * Set focus on next sunelement
 */
EpgGrid.prototype.SubNext = function () {
	var item = this.activeItem;
	this.epgMode = 1;
	if ( item.subNavigElements.length > item.epgActive + 1 ) {
		item.epgActive ++;
		this.SubFocused ( item.subNavigElements [ item.epgActive ] );
	} else {
		item.epgActive = 0;
		this.time += this.timeStep;
		this.InitTimeBlock();
		this.RefreshEPG();
		this.ReposTimeLine();
	}
};

/**
 * Set focus on prev sunelement
 */
EpgGrid.prototype.SubPrev = function () {
	var item = this.activeItem,
		focusLast = true,
		time = this.GetStartTime();
	this.epgMode = 1;
	if ( item.epgActive > 0 ) {
		item.epgActive --;
		this.SubFocused ( item.subNavigElements [ item.epgActive ] );
	} else {
		if ( Math.round(this.time/100) !== Math.round(time/100) ) {
			this.time -= this.timeStep;
			if ( this.time < time ) {
				this.time = time;
			}
			this.InitTimeBlock();
			this.RefreshEPG( focusLast );
			this.ReposTimeLine();
		}
	}
};

/**
 * Go to real time position
 */
EpgGrid.prototype.GoToRealTime = function () {
	var item = this.activeItem,
		time = this.GetStartTime();
	if ( this.epgMode ) {
		this.epgMode = 0;
		this.day = 0;
		if ( this.time !== time ) {
			this.time = time;
			this.InitTimeBlock();
			this.RefreshEPG();
			this.ReposTimeLine();
		} else {
			this.CheckEPGActive ( item );
			this.SubFocused ( item.subNavigElements [ item.epgActive ] );
		}
	}
};



