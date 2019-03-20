/**
 * Media component: DVB epg
 * @author Roman Stoian
 */

'use strict';

var remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

/**
 * @class DVBEpg
 * @constructor
 */
var DVBEpg = new CPage();
DVBEpg.name = 'CPageDVBEpg';


DVBEpg.onInit = function () {
	/** link to the object for limited scopes */
	var self = this;

	this.timer = {};

	this.goToChFlag = false;
	this.TVnumber = '';

	this.domChannelNumber = this.handle.querySelector( '.channelNumber' );

	this.BCrumb = new CBreadCrumb( this );
	this.BCrumb.rightItems = WINDOW_WIDTH === 720 ? 1 : 2;
	this.BCrumb.Init( PATH_IMG_PUBLIC, this.handle.querySelector( '.body .header .cbcrumb' ) );
	this.BCrumb.Show( true );

	/**
	 * exit bottom
	 * @type {CButtonPanel}
	 */
	this.ExitBPanel = new CButtonPanel(this);
	this.ExitBPanel.Init(remoteControlButtonsImagesPath, this.handle.querySelector('.body .footer .exit div.cbpanel-main'));
	this.ExitBPanel.btnExit = this.ExitBPanel.Add(KEYS.EXIT, 'exit.png', configuration.newRemoteControl ? _('Exit') : '', function () {
		self.actionExit();
	});

	/**
	 * bottom line of buttons
	 * @type {CButtonPanel}
	 */
	this.BPanel = new CButtonPanel( this );
	this.BPanel.Init( remoteControlButtonsImagesPath, this.handle.querySelector( '.body .footer .main div.cbpanel-main' ) );

	//this.BPanel.btnExit = this.BPanel.Add(KEYS.EXIT, 'exit.png', _('Exit'), function () {
	//	self.actionF1();
	//});

	if ( configuration.mayPVR ) {
		this.BPanel.btnF1 = this.BPanel.Add(KEYS.F1, 'f1.png', _('Record'), function () {
			self.actionF1();
		});
	}

	this.BPanel.btnF3 = this.BPanel.Add(KEYS.F3, 'f3.png', _('Now'), function () {
		self.actionF3();
	});

	this.EPGList = new EpgGrid( this );
	this.EPGList.Init( this.handle.querySelector( '.body .content .clist-main' ) );

	this.EPGList.onFocus = function ( item ) {
		EpgGrid.prototype.onFocus.call ( this, item );
		switch ( self.previous === MediaPlayer? self.previous.parent : self.previous ) {
			case DVBChannels:
				DVBChannels.DVBList.goToChannel( item.number );
				break;
			case IPTVChannels:
				IPTVChannels.TVList.goToChannel( item.number + IPTVChannels.TVList.channelStart );
				break;
		}
	};
	this.EPGList.GetEpg = this.GetEpg;
};


/**
 * Hook on the page appearance
 */
DVBEpg.onShow = function () {
	switch ( this.previous === MediaPlayer? this.previous.parent : this.previous ) {
		case DVBChannels:
			this.BPanel.Hidden(this.BPanel.btnF1, true);
			this.BCrumb.Push('/', 'media/type_' + MEDIA_TYPE_DVB_ROOT + '.png', _('DVB channels'));
			break;
		case IPTVChannels:
			this.BPanel.Hidden(this.BPanel.btnF1, false);
			this.BCrumb.Push('/', 'media/type_' + MEDIA_TYPE_TV_ROOT + '.png', _('IPTV channels'));
			break;
	}
	this.EPGList.InitTimeBlock();
	this.EPGList.FillItems();
	this.EPGList.CheckingTime();
};


DVBEpg.Reset = function () {
	this.EPGList.Clear();
};


DVBEpg.EventHandler = function ( event ) {
	switch ( event.code ) {
		case KEYS.OK:
			if ( DVBEpg.goToChFlag ) {
				clearTimeout( DVBEpg.timer.goToChannel );
				DVBEpg.EPGList.goToChannel( parseInt( DVBEpg.TVnumber, 10 ) );
				DVBEpg.TVnumber = '';
				DVBEpg.goToChFlag = false;
				DVBEpg.domChannelNumber.style.display = 'none';
				event.preventDefault();
				break;
			}
		case KEYS.PAGE_UP:
		case KEYS.PAGE_DOWN:
		case KEYS.UP:
		case KEYS.DOWN:
		case KEYS.LEFT:
		case KEYS.RIGHT:
		case KEYS.HOME:
		case KEYS.END:
			// file list navigation
			DVBEpg.EPGList.EventHandler(event);
			break;
		case KEYS.EXIT:
			DVBEpg.actionExit();
			break;
		case KEYS.F1:
		case KEYS.F3:
			// global keys
			DVBEpg.BPanel.EventHandler(event);
			break;
		case KEYS.NUM0:
		case KEYS.NUM1:
		case KEYS.NUM2:
		case KEYS.NUM3:
		case KEYS.NUM4:
		case KEYS.NUM5:
		case KEYS.NUM6:
		case KEYS.NUM7:
		case KEYS.NUM8:
		case KEYS.NUM9:
			DVBEpg.goToChannel( event.code - KEYS.NUM0 );
			break;
		default:
			// block all the rest
			event.preventDefault();
	}
};


DVBEpg.actionExit = function () {
	for ( var i in this.timer ) {
		clearTimeout(this.timer[i]);
	}
	this.BCrumb.Reset();
	this.EPGList.Exit();
	DVBEpg.Show( false );
};

/**
 * Open add record modal
 */
DVBEpg.actionF1 = function(){
	var item = this.EPGList.ActiveItem(),
		epgData = item.subNavigElements[item.epgActive],
		data = {};

	if ( configuration.mayPVR ) {
		return false;
	}
	if ( epgData && epgData.data ) {
		data.time = epgData.data.start * 1000;
		data.duration = epgData.data.duration * 1000;
		data.name = epgData.data.name;
	}
	new CModalAddRecord(this, _('Recording channel'), data);
};

DVBEpg.actionF3 = function(){
	this.EPGList.GoToRealTime();
};

DVBEpg.actionBack = function () {
	var self = this;
	if ( this.goToChFlag ) {
		clearTimeout( this.timer.goToChannel );
		if ( this.TVnumber.length > 0 ) {
			this.TVnumber = this.TVnumber.slice( 0, this.TVnumber.length - 1 );
			this.domChannelNumber.innerHTML = this.TVnumber;
			MediaPlayer.domChannelNumber.innerHTML = this.TVnumber;
			if ( this.TVnumber.length > 0 ) {
				this.timer.goToChannel = setTimeout( function () {
					self.DVBList.goToChannel( parseInt( self.TVnumber, 10 ) );
					self.TVnumber = '';
					self.goToChFlag = false;
					self.domChannelNumber.style.display = 'none';
					MediaPlayer.domChannelNumber.style.display = 'none';
				}, 2000 );
			} else {
				this.domChannelNumber.style.display = 'none';
				MediaPlayer.domChannelNumber.style.display = 'none';
			}
		}
	}
};


DVBEpg.goToChannel = function ( number ) {
	var self = this;
	clearTimeout( this.timer.goToChannel );
	this.goToChFlag = true;
	this.TVnumber += number;
	this.domChannelNumber.innerHTML = this.TVnumber;
	this.domChannelNumber.style.display = 'block';
	this.timer.goToChannel = setTimeout( function () {
		self.EPGList.goToChannel( parseInt( self.TVnumber, 10 ) );
		self.TVnumber = '';
		self.goToChFlag = false;
		self.domChannelNumber.style.display = 'none';
	}, 2000 );
};


DVBEpg.GetEpg = function ( obj, start, end ) {
	var data;

	if ( !obj ) {
        return null;
    }
    if ( !start ) {
        if ( this.time === null ) {
            this.time = this.GetStartTime();
        }
		start = this.time;
	}
	if ( !end ) {
		end = start + this.timeStep;
	}

	try{
		data = dvbManager.GetEPGScheduleByRange( obj.id, start, end );
		if ( data === '' || data === '{}' ) {
			return null;
		}
		data = JSON.parse( data );
	} catch(e){
		echo(e,'EPG parse error');
		return null;
	}
    echo(data,'GetEpg');
	return data.events;
};
