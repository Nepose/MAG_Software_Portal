/**
 * Media component: global player object
 * @author Roman Stoian
 */

'use strict';

/**
 * @class MediaPlayer
 * @constructor
 */
var MediaPlayer = new CPage();
MediaPlayer.name = 'CPageMediaPlayer';


/**
 * Event types
 * need to be available on early loading stages
 * @type {number}
 */
MediaPlayer.EVENT_START = 1;
MediaPlayer.EVENT_STOP = 2;
MediaPlayer.EVENT_PAUSE = 3;
MediaPlayer.EVENT_PROGRESS = 4;
MediaPlayer.EVENT_ERROR = 5;
MediaPlayer.EVENT_OK = 6;
MediaPlayer.EVENT_EXIT = 7;

MediaPlayer.TIME_HIDE_HINT = 5000;
MediaPlayer.TIME_HIDE_INFO = 5000;


MediaPlayer.onInit = function () {
	var self = this,
		remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/',
		i;

	MediaPlayer.initPlayer();

	this.currentRotation = 0;
	this.subCModal = null;
	this.countError = 0;
	this.errorTimer = null;
	this.errorTime = 300;
	this.pos = 0;
	this.posTime = '';
	this.posMod = 0;
	this.posIntervals = [0, 10, 20];
	this.curTime = 0;
	this.totalTime = 0;
	this.infoFlag = true;
	this.showHls = false;
	this.coord = {};
	this.oldSol = '';
	this.sol = 'auto';
	this.oldURL = '';
	this.playNow = false;
	this.startingPlay = false;
	this.posModFlag = false;
	this.favorites = false;
	this.fullScreen = true;
	this.next = false;
	this.repeat = false;
	this.type = null;               // type of the object: "media", "image" ...
	this.obj = null;
	this.timer = {};
	this.interval = {};
	this.dataDVD = {};
	this.slideOn = 5;
	this.list = [];
	this.subList = [];
	this.inStandBy = false;
	this.forcedSubtitles = null;
	this.isVideo = true;


	this.audioPid = null;
	this.subtitlesPid = null;
	this.subscribers = {};
	this.subtitlesData = null;
	this.subtitlesEncoding = null;
	this.SubscribersReset();

	this.playListShow = false;

	this.ts_inProgress = false;
	this.ts_on = environment.ts_on;
	this.ts_endType = environment.ts_endType;
	this.subtitles_on = environment.subtitles_on;

	this.aspects = [
		{
			name: 'fit',
			mode: 0x10,
			text: _('Fit on')
		},
		{
			name: 'big',
			mode: 0x40,
			text: _('Zoom')
		},
		{
			name: 'opt',
			mode: 0x50,
			text: _('Optimal')
		},
		{
			name: 'exp',
			mode: 0x00,
			text: _('Stretch')
		}
	];

	this.activeAspect = 0;
	this.initAspect();

	this.progress = {
		480: 620,
		576: 620,
		720: 1180,
		1080: 1770
	};

	this.domPlayerTotalTime = this.handle.querySelector('#playerTotalTime');
	this.domPlayerCurrentTime = this.handle.querySelector('#playerCurrentTime');
	this.domPlayerBar = this.handle.querySelector('#playerBar');
	this.domPlayerTitle = this.handle.querySelector('#playerTitle');
	this.domPlayerBufferBar = this.handle.querySelector('#playerBufferBar');
	this.domPlayerProgressBar = this.handle.querySelector('#playerProgressBar');
	this.domPlayerHeader = this.handle.querySelector('#playerHeader');
	this.domPlayerFooter = this.handle.querySelector('#playerFooter');
	this.domTSIndicator = this.handle.querySelector('#ts_indicator');
	this.domPlayerList = this.handle.querySelector('#playerListBox');
	this.domPlayerClock = this.handle.querySelector('#playerClock');
	this.domPlayerClockOptional = this.handle.querySelector('#playerClockOptional');
	if ( environment.playerClock ) {
		this.domPlayerClockOptional.style.display = 'block';
	} else {
		this.domPlayerClockOptional.style.display = 'none';
	}
	this.domChannelNumber = this.handle.querySelector('.channelNumber');
	this.domHeaderBlue = this.handle.querySelector('#playerHeaderBlue');
	this.domAspectBlock = document.querySelector('#mediaHeader_Aspect');
	this.domAspectText = this.domAspectBlock.querySelector('span');
	this.domSlideContainer = this.handle.querySelector('#slideContainer');

	if ( configuration.newRemoteControl ) {
		if ( !this.handle.classList.contains('new-remote-control') ) {
			this.handle.classList.add('new-remote-control');
		}

		this.handle.querySelector('#playerHeaderExit').style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'exit.png)';
		this.handle.querySelector('#playerHideplayer').style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'info.png)';
		this.handle.querySelector('#playerHeaderSetting').style.backgroundImage = 'url(' + remoteControlButtonsImagesPath + 'menu.png)';

		this.handle.querySelector('#playerHeaderExit').innerHTML = _('Exit');
	}

	this.handle.querySelector('#playerHideplist').innerHTML = _('Show<br />playlist');
	this.handle.querySelector('#playerHeaderSetting').innerHTML = _('Settings');
	this.handle.querySelector('#playerHideplayer').innerHTML = _('Hide<br />player');
	this.domHeaderBlue.innerHTML = _('Add to<br>favorites');
	this.handle.querySelector('#playlistPrev').innerHTML = _('Previous<br />media');
	this.handle.querySelector('#playlistNext').innerHTML = _('Next<br />media');


	this.init = [];
	this.init[MEDIA_TYPE_VIDEO] = function ( refresh ) {
		self.domPlayerTotalTime.innerHTML = '00:00:00';
		self.domPlayerCurrentTime.innerHTML = '00:00:00';
		self.domPlayerBufferBar.style.width = '0px';
		self.domPlayerProgressBar.style.width = '0px';
		if ( !refresh ) {
			self.domPlayerBar.style.display = 'block';
			self.domPlayerCurrentTime.style.display = 'block';
			self.domPlayerBufferBar.style.display = 'none';
			self.domPlayerProgressBar.style.display = 'block';
			self.handle.querySelector('#playerPause').style.display = 'block';
			self.handle.querySelector('#playerREW').style.display = 'block';
			self.handle.querySelector('#playerFFWD').style.display = 'block';
			self.handle.querySelector('#playerTotalTime').style.display = 'block';
			self.handle.querySelector('#playerCurrentTime').style.display = 'block';
			self.handle.querySelector('#playerSlash').style.display = 'block';
		}

		self.curTime = 0;
		self.totalTime = 0;
		self.posIntervals = [0, 10, 20];
	};
	this.init[MEDIA_TYPE_RECORDS_ITEM] = this.init[MEDIA_TYPE_VIDEO];
	this.init[MEDIA_TYPE_AUDIO] = function ( refresh ) {
		self.init[MEDIA_TYPE_VIDEO](refresh);
		self.domSlideContainer.style.display = 'block';
	};
	this.init[MEDIA_TYPE_CUE_ITEM] = this.init[MEDIA_TYPE_VIDEO];
	this.init[MEDIA_TYPE_STREAM] = function ( refresh ) {
		if ( !refresh ) {
			self.domPlayerBar.style.display = 'none';
			self.domPlayerCurrentTime.style.display = 'none';
			self.domPlayerBufferBar.style.display = 'none';
			self.domPlayerProgressBar.style.display = 'none';
			self.handle.querySelector('#playerHideplist').style.display = 'none';
			self.handle.querySelector('#playerPause').style.display = 'none';
			self.handle.querySelector('#playerREW').style.display = 'none';
			self.handle.querySelector('#playerFFWD').style.display = 'none';
			self.handle.querySelector('#playerTotalTime').style.display = 'none';
			self.handle.querySelector('#playerCurrentTime').style.display = 'none';
			self.handle.querySelector('#playerSlash').style.display = 'none';
		}
	};
	this.init[MEDIA_TYPE_DVB] = function ( refresh ) {
		self.init[MEDIA_TYPE_STREAM](refresh);
	};
	this.init[MEDIA_TYPE_STREAM_TS] = function ( refresh ) {
		if ( !refresh ) {
			self.init[MEDIA_TYPE_VIDEO]();
			self.domPlayerBufferBar.style.display = 'block';
			if ( self.ts_endType === 2 ) {
				timeShift.SetSlidingMode(false);
			} else {
				timeShift.SetSlidingMode(true);
			}
		}

		var curTime = self.parseTime(environment.ts_time);
		self.domPlayerTotalTime.innerHTML = curTime.hour + ':' + curTime.min + ':' + curTime.sec;
	};

	this.init[MEDIA_TYPE_IMAGE] = function () {
		self.domPlayerBar.style.display = 'none';
		self.domPlayerCurrentTime.style.display = 'none';
		self.domPlayerBufferBar.style.display = 'none';
		self.domPlayerProgressBar.style.display = 'none';
		self.handle.querySelector('#playerPause').style.display = 'none';
		self.handle.querySelector('#playerREW').style.display = 'none';
		self.handle.querySelector('#playerFFWD').style.display = 'none';
		self.handle.querySelector('#playerTotalTime').style.display = 'none';
		self.handle.querySelector('#playerCurrentTime').style.display = 'none';
		self.handle.querySelector('#playerSlash').style.display = 'none';
	};

	this.init[MEDIA_TYPE_ISO] = function ( refresh ) {
		if ( !refresh ) {
			self.init[MEDIA_TYPE_VIDEO]();
		}
	};


	/**
	 * Return a specific teletext lang code (number) by language code (string)
	 * @param lang {string} standart language code
	 * @return {number} teletext language code
	 */
	this.getTeletextDefaultCharset = function ( lang ) {
		switch ( environment.language ) {
			case 'en':
				return 0x00;
				break;
			case 'de':
				return 0x09;
				break;
			case 'sv':
			case 'fi':
			case 'hu':
				return 0x0a;
				break;
			case 'it':
				return 0x0b;
				break;
			case 'fr':
				return 0x04c;
				break;
			case 'pt':
			case 'es':
				return 0x15;
				break;
			case 'cs':
			case 'sk':
				return 0x0e;
				break;
			case 'pl':
				return 0x08;
				break;
			case 'tr':
				return 0x16;
				break;
			case 'sr':
			case 'hr':
			case 'sl':
				return 0x1d;
				break;
			case 'ro':
				return 0x1f;
				break;
			case 'et':
				return 0x22;
				break;
			case 'lv':
			case 'lt':
				return 0x23;
				break;
			case 'ru':
			case 'bg':
				return 0x24;
				break;
			case 'uk':
				return 0x25;
				break;
			case 'el':
				return 0x37;
				break;
			case 'ar':
				return 0x87;
				break;
			default:
				return 'auto';
				break;
		}
	};

	this.PlayList = new PlayList(this);
	this.PlayList.Init(this.handle.querySelector('#playerList'));
	stbEvent.onEvent = this.event;

	this.onShow = function () {
		var items = self.PlayList.handle.children || [],
			value = null;
		if ( this.parent === IPTVChannels ) {
			for ( var i = 0; i < items.length; i++ ) {
				value = self.list[self.PlayList.handle.children[i].data.index];
				self.PlayList.SetStar(self.PlayList.handle.children[i], FAVORITES_NEW[(value.sol? value.sol + ' ' : '') + value.url]);
			}
		} else {
			for ( var i = 0; i < items.length; i++ ) {
				self.PlayList.SetStar(self.PlayList.handle.children[i], FAVORITES_NEW[self.PlayList.handle.children[i].data.url]);
			}
		}
		if ( self.PlayList.activeItem && self.PlayList.activeItem.stared ) {
			self.domHeaderBlue.innerHTML = _('Remove from<br>favorites');
		} else {
			self.domHeaderBlue.innerHTML = _('Add to<br>favorites');
		}
	};

	this.ModalMenu = new CModal(this);

	/**
	 * main side menu
	 * @type {CGroupMenu}
	 */
	this.ModalMenu.Menu = new CGroupMenu(this.ModalMenu);
	this.ModalMenu.Menu.Init(this.handle.querySelector('div.cgmenu-main'));

	this.ModalMenu.onShow = function () {
		this.Menu.Activate();
	};

	this.ModalMenu.Init(element('div', {className: 'cmodal-menu'}, this.ModalMenu.Menu.handle));

	// mouse click on empty space should close modal menu
	this.ModalMenu.handle.onclick = function () {
		self.ModalMenu.Show(false);
	};

	this.ModalMenu.EventHandler = function ( event ) {
		switch ( event.code ) {
			case KEYS.EXIT:
			case KEYS.MENU:
				self.ModalMenu.Show(false);
				break;
			default:
				self.ModalMenu.Menu.EventHandler(event);
		}
	};

	this.ModalMenu.Menu.gaudio = this.ModalMenu.Menu.AddGroup('gaudio', _('Audio tracks'), {
		onclick: function () {
			(self.ModalMenu.Menu.gaudio.slist.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			self.ModalMenu.Menu.gaudio.slist.Marked(this, true);
			self.ModalMenu.Show(false);
			self.audioPid = this.data;
			gSTB.SetAudioPID(this.data);
			clearTimeout(self.timer.audio);
			self.handle.querySelector('#audioType').src = PATH_IMG_PUBLIC + 'codec/' + this.type + '.png';
			self.handle.querySelector('#audioText').innerHTML = this.innerHTML;
			self.handle.querySelector('#cright').style.display = 'block';
			self.timer.audio = setTimeout(function () {
				MediaPlayer.handle.querySelector('#cright').style.display = 'none';
			}, self.TIME_HIDE_HINT);
			return false;
		}
	});

	this.ModalMenu.Menu.gsubtitle = this.ModalMenu.Menu.AddGroup('gsubtitle', _('Subtitles'), {
		onclick: function () {
			switch ( this.data.type ) {
				case 1:
					(self.ModalMenu.Menu.gsubtitle.slist.states.marked || []).forEach(function ( item ) {
						item.self.Marked(item, false);
					});
					self.subtitles_on = false;
					self.subtitlesPid = null;
					self.ModalMenu.Menu.gsubtitle.slist.Marked(this, true);
					if ( this.data.value === 'OFF' ) {
						gSTB.SetSubtitles(false);
					}
					break;
				case 2:
					self.subtitlesPid = this.data.value;
					gSTB.SetSubtitlePID(this.data.value);
					self.subtitles_on = true;
					gSTB.SetSubtitles(true);
					self.ModalMenu.Menu.gsubtitle.slist.Marked(this, true);
					self.showSubtitleHint(this.data); // do all the job
					break;
				case 3:
					self.ModalMenu.Show(false);
					self.subtitles_on = true;
					var item = this;
					self.openSubtitle(self.subList[this.data.index], function () {
						self.ModalMenu.Menu.gsubtitle.slist.Marked(item, true);
					});
					return false;
			}
			self.ModalMenu.Show(false);
			return false;
		}
	});
	this.ModalMenu.Menu.gsubtitle.slist.multipleSelection = false;
	this.ModalMenu.Menu.gts = this.ModalMenu.Menu.AddGroup('gts', _('TimeShift'), {
		onclick: function () {
			self.ModalMenu.Show(false);
			if ( this.data !== self.ts_on ) {
				self.ts_on = this.data;
				(self.ModalMenu.Menu.gts.slist.states.marked || []).forEach(function ( item ) {
					item.self.Marked(item, false);
				});
				self.ModalMenu.Menu.gts.slist.Marked(this, true);
				if ( self.ts_on ) {
					if ( !self.ts_inProgress && self.type === MEDIA_TYPE_STREAM ) {
						if ( !self.checkUsb(environment.ts_path) ) {
							if ( environment.mount_media_ro === 'true' ) {
								new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
							} else {
								new CModalConfirm(currCPage, _('Error'), _('No storage device selected as the \"File location\" in TimeShift settings. Disable TimeShift?'),
									_('No'), function () {},
									_('Yes'), function () {
										MediaPlayer.tsOnOff(false);
									});
							}
						} else {
							if ( self.sol !== 'extTimeShift' ) {
								self.play();
							}
						}
					}
				} else {
					if ( self.ts_inProgress ) {
						self.tsExitCheck('stop');
					}
				}
			}
			return false;
		}
	});


	this.ModalMenu.Menu.gts.ion = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gts, MEDIA_ACTION_TS_ON, _('Enabled'), {data: true});
	this.ModalMenu.Menu.gts.ioff = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gts, MEDIA_ACTION_TS_OFF, _('Disabled'), {data: false});

	this.ModalMenu.Menu.gtsend = this.ModalMenu.Menu.AddGroup('gtsend', _('TimeShift buffer'), {
		onclick: function () {
			if ( this.data !== self.ts_endType ) {
				self.ts_endType = this.data;
				(self.ModalMenu.Menu.gtsend.slist.states.marked || []).forEach(function ( item ) {
					item.self.Marked(item, false);
				});
				self.ModalMenu.Menu.gtsend.slist.Marked(this, true);
				if ( self.ts_endType === 1 ) {
					timeShift.SetSlidingMode(true);
				} else {
					timeShift.SetSlidingMode(false);
				}
			}

			self.ModalMenu.Show(false);
			return false;
		}
	});

	this.ModalMenu.Menu.gtsend.iciclick = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gtsend, MEDIA_ACTION_TSEND_CICLICK, _('Cyclic recording mode'), {data: 1});
	this.ModalMenu.Menu.gtsend.istop = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gtsend, MEDIA_ACTION_TSEND_STOP, _('Stop when out of space'), {data: 2});

	this.ModalMenu.Menu.gepg = this.ModalMenu.Menu.AddGroup('gepg', _('EPG'), {
		onclick: function () {
			self.ModalMenu.Show(false);
			switch ( this.iid ) {
				case MEDIA_ACTION_DVB_EPG:
					if ( typeof self.parent.initEPG === 'function' ) {
						self.parent.initEPG();
					}
					break;
				case  MEDIA_ACTION_DVB_EPG_GRID:
					if ( typeof self.parent.loadEPGGrid === 'function' ) {
						self.parent.loadEPGGrid(self);
					}
					break;
			}
		}
	});

	this.ModalMenu.Menu.gepg.epg = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gepg, MEDIA_ACTION_DVB_EPG, _('EPG'));
	this.ModalMenu.Menu.gepg.gepggrid = this.ModalMenu.Menu.AddItem( this.ModalMenu.Menu.gepg, MEDIA_ACTION_DVB_EPG_GRID, _( 'EPG grid ') );

	this.ModalMenu.Menu.g3d = this.ModalMenu.Menu.AddGroup('g3d', _('3D mode'), {
		onclick: function () {
			(self.ModalMenu.Menu.g3d.slist.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			self.ModalMenu.Menu.g3d.slist.Marked(this, true);
			self.ModalMenu.Show(false);
			gSTB.Set3DConversionMode(this.data);
			return false;
		}
	});

	this.ModalMenu.Menu.g3d.i1 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.g3d, 1, _('Mode') + ' 1', {data: 0});
	this.ModalMenu.Menu.g3d.i2 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.g3d, 2, _('Mode') + ' 2', {data: 1});
	this.ModalMenu.Menu.g3d.i3 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.g3d, 3, _('Mode') + ' 3', {data: 2});
	this.ModalMenu.Menu.g3d.i4 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.g3d, 4, _('Mode') + ' 4', {data: 3});

	this.ModalMenu.Menu.gslideOn = this.ModalMenu.Menu.AddGroup('gslideOn', _('Slide-show'), {
		onclick: function () {
			(self.ModalMenu.Menu.gslideOn.slist.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			self.ModalMenu.Menu.gslideOn.slist.Marked(this, true);
			self.ModalMenu.Show(false);
			self.slideOn = this.data;
			clearTimeout(self.timer.slideShow);
			self.timer.slideShow = null;
			if ( self.slideOn > 0 ) {
				self.timer.slideShow = setTimeout(function () {
					if ( self.list.length > 1 && self.fullScreen ) {
						if ( self.PlayList.playIndex + 1 < self.list.length ) {
							self.PlayList.playIndex++;
							( self.PlayList.states.marked || []).forEach(function ( item ) {
								item.self.Marked(item, false);
							});
							self.PlayList.Marked(self.PlayList.handle.children[self.PlayList.playIndex], true);
							self.prepare(self.list[self.PlayList.handle.children[self.PlayList.playIndex].data.index], true, true);
							// if ( self.parent === MediaBrowser ) {
							// 	MediaBrowser.FileList.Reposition(self.obj);
							// }
						}
					}
				}, self.slideOn * 1000);
			}
			return false;
		}
	});

	this.ModalMenu.Menu.gslideOn.ioff = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gslideOn, 1, _('Disabled'), {data: 0});
	this.ModalMenu.Menu.gslideOn.i3 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gslideOn, 2, '3 ' + _('sec.'), {data: 3});
	this.ModalMenu.Menu.gslideOn.i5 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gslideOn, 2, '5 ' + _('sec.'), {
		data: 5,
		marked: true
	});
	this.ModalMenu.Menu.gslideOn.i10 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gslideOn, 2, '10 ' + _('sec.'), {data: 10});
	this.ModalMenu.Menu.gslideOn.i20 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gslideOn, 2, '20 ' + _('sec.'), {data: 20});
	this.ModalMenu.Menu.gslideOn.i30 = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gslideOn, 2, '30 ' + _('sec.'), {data: 30});

	this.ModalMenu.Menu.grotate = this.ModalMenu.Menu.AddGroup('grotate', _('Rotate'), {
		onclick: function () {
			(self.ModalMenu.Menu.grotate.slist.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			self.ModalMenu.Menu.grotate.slist.Marked(this, true);
			self.ModalMenu.Show(false);
			MediaPlayer.actionRotate(this.data);
			return false;
		}
	});

	this.ModalMenu.Menu.grotate.iright = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.grotate, 1, _('Left'), {data: -90, icon: remoteControlButtonsImagesPath + 'f1.png'});
	this.ModalMenu.Menu.grotate.ileft = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.grotate, 2, _('Right'), {data: 90, icon: remoteControlButtonsImagesPath + 'f4.png'});

	this.ModalMenu.Menu.gplay = this.ModalMenu.Menu.AddGroup('gplay', _('Play'), {
		onclick: function () {
			switch ( this.data ) {
				case 1:
					(self.ModalMenu.Menu.gplay.slist.states.marked || []).forEach(function ( item ) {
						item.self.Marked(item, false);
					});
					self.ModalMenu.Menu.gplay.slist.Marked(this, true);
					self.next = false;
					self.repeat = false;
					break;
				case 2:
					(self.ModalMenu.Menu.gplay.slist.states.marked || []).forEach(function ( item ) {
						item.self.Marked(item, false);
					});
					self.ModalMenu.Menu.gplay.slist.Marked(this, true);
					self.next = true;
					self.repeat = false;
					break;
				case 3:
					self.mixList();
					break;
				case 4:
					(self.ModalMenu.Menu.gplay.slist.states.marked || []).forEach(function ( item ) {
						item.self.Marked(item, false);
					});
					self.ModalMenu.Menu.gplay.slist.Marked(this, true);
					self.next = false;
					self.repeat = true;
					break;
				case 5:
					(self.ModalMenu.Menu.gplay.slist.states.marked || []).forEach(function ( item ) {
						item.self.Marked(item, false);
					});
					self.ModalMenu.Menu.gplay.slist.Marked(this, true);
					self.next = true;
					self.repeat = true;
					break;
			}
			self.ModalMenu.Show(false);
			return false;
		}
	});

	this.ModalMenu.Menu.gplay.ione = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gplay, 1, _('One file once'), {data: 1});
	this.ModalMenu.Menu.gplay.ilist = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gplay, 2, _('Each file once'), {data: 2});
	this.ModalMenu.Menu.gplay.ioner = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gplay, 1, _('Repeat file'), {data: 4});
	this.ModalMenu.Menu.gplay.ilistr = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gplay, 2, _('Repeat everything'), {data: 5});
	this.ModalMenu.Menu.gplay.imix = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gplay, 2, _('Playlist shuffle'), {data: 3});

	//this.ModalMenu.Menu.gdvbAntena = this.ModalMenu.Menu.AddGroup('gdvbAntena', _('Antenna type'), {
	//	onclick: function () {
	//		switch ( this.data ) {
	//			case 1:
	//				(self.ModalMenu.Menu.gdvbAntena.slist.states.marked || []).forEach(function ( item ) {
	//					item.self.Marked(item, false);
	//				});
	//				dvbManager.SetAntennaPower(true, 0);
	//				self.dvbPowerManualOn = true;
	//				break;
	//			case 2:
	//				(self.ModalMenu.Menu.gdvbAntena.slist.states.marked || []).forEach(function ( item ) {
	//					item.self.Marked(item, false);
	//				});
	//				self.dvbPowerManualOn = false;
	//				dvbManager.SetAntennaPower(false, 0);
	//				break;
	//		}
	//		self.ModalMenu.Show(false);
	//		return false;
	//	}
	//});
    //
	//this.ModalMenu.Menu.gdvbAntena.ion = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvbAntena, 1, _('Active'), {data: 1});
	//this.ModalMenu.Menu.gdvbAntena.ioff = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvbAntena, 2, _('Passive'), {data: 2});

	//this.ModalMenu.Menu.gdvbAntena.ion = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvbAntena, 1, _('Enabled'), {data: 1});
	//this.ModalMenu.Menu.gdvbAntena.ioff = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gdvbAntena, 2, _('Disabled'), {data: 2});

	gSTB.SetTeletext(environment.teletext_on === 'on');

	if ( environment.teletext_charset === '' || environment.teletext_charset === 'auto' || environment.teletext_charset === 'disabled' ) {
		gSTB.ForceTtxCharset(0, true);
	} else {
		gSTB.ForceTtxCharset(+environment.teletext_charset, false);
	}

	this.ModalMenu.Menu.gTeletext = this.ModalMenu.Menu.AddGroup('gTeletext', _('Teletext'), {
		onclick: function ( ) {
			var viewport = {top: 0, left: 0, width: 0, height: 0},
				defaultCharset;
			switch ( this.data.type ) {
				case 2:
					(self.ModalMenu.Menu.gTeletext.slist.states.marked || []).forEach(function ( item ) {
						item.self.Marked(item, false);
					});
					echo(this.data.value, 'SetTeletextPID');
					gSTB.SetTeletextPID(this.data.value);
					gSTB.TeletextTransparency(environment.teletext_opacity);

					if ( self.ModalMenu.Menu.gTeletext.editModal ) {
						self.ModalMenu.Menu.gTeletext.editModal.elements[0].SelectById(environment.teletext_charset);
						switch ( VIDEO_MODE ) {
							case '480i':
							case '480p':
							case '576i':
							case '576p':
								self.ModalMenu.Menu.gTeletext.editModal.elements[1].SelectById(environment.teletext_ratio);
								break;
							default :
								self.ModalMenu.Menu.gTeletext.editModal.elements[1].SelectById(environment.teletext_ratio);
								self.ModalMenu.Menu.gTeletext.editModal.elements[2].SelectById(environment.teletext_opacity);
								break;
						}
					}
					switch ( VIDEO_MODE ) {
						case '480i':
						case '480p':
							viewport.top = 24;
							viewport.height = 432;
							viewport.left = 47;
							viewport.width = 640;
							break;
						case '576i':
						case '576p':
							viewport.top = 24;
							viewport.height = 528;
							viewport.left = 55;
							viewport.width = 636;
							break;
						case '720p':
						case '720p60':
							viewport.top = 30;
							viewport.height = 670;
							if ( environment.teletext_ratio === '0' ) {
								viewport.left = 193;
								viewport.width = 894;
							} else {
								viewport.left = 40;
								viewport.width = 1200;
							}
							break;
						case '1080i':
						case '1080i60':
						case '1080p':
						case '1080p60':
							viewport.top = 40;
							viewport.height = 1000;
							if ( environment.teletext_ratio === '0' ) {
								viewport.left = 273;
								viewport.width = 1374;
							} else {
								viewport.left = 50;
								viewport.width = 1820;
							}
							break;
					}
					echo(viewport, 'SetTeletextViewport');
					gSTB.SetTeletextViewport(viewport.width, viewport.height, viewport.left, viewport.top);
					gSTB.TeletextShow(true);
					MediaPlayer.showInfo(false);
					self.ModalMenu.Menu.gTeletext.lastParams = {
						viewport: viewport,
						opacity: environment.teletext_opacity,
						pid: this.data.value
					};
					self.ModalMenu.Menu.gTeletext.mediaHandler = MediaPlayer.EventHandler;
					MediaPlayer.EventHandler = self.ModalMenu.Menu.gTeletext.teletextHandler;
					break;
				default:
					break;
			}
			self.ModalMenu.Show(false);
			return false;
		}
	});
	this.ModalMenu.Menu.gTeletext.slist.multipleSelection = false;

	/**
	 * Show teletext settings.
	 */
	this.ModalMenu.Menu.gTeletext.showEditModal = function () {
		var self = this,
			arr = [],
			table,
			tRow, i, size, elem;

		if ( this.editModal ) {
			this.editModal.activeElementIndex = 0;
			this.editModal.Show(true);
			this.editModal.elements[self.editModal.activeElementIndex].handle.focus();
			this.editModal.elements[self.editModal.activeElementIndex].SelectById(gSTB.GetForceTtxCharset());
		} else {
			table = element('table');
			this.editModal = new CModalBox(MediaPlayer);
			this.editModal.SetHeader(_('Current channel teletext settings'));
			this.editModal.bpanel = new CButtonPanel();
			this.editModal.bpanel.Init(MODAL_IMG_PATH);
			this.editModal.bpanel.Add(KEYS.EXIT, 'exit.png', _('Close'), function() {
				self.editModal.Show(false);
			});
			this.editModal.bpanel.Add(KEYS.OK, 'ok.png', _('Ok'), function() {
				var charset = self.editModal.elements[0].GetValue(),
					viewport = {top: 0, left: 0, width: 0, height: 0},
					ratio;

				gSTB.ForceTtxCharset(charset === 'auto' ? 0 : +charset, charset === 'auto');

				MediaPlayer.ModalMenu.Menu.gTeletext.lastParams = {
					viewport: null,
					opacity: null,
					pid: MediaPlayer.ModalMenu.Menu.gTeletext.lastParams.pid,
					charset: charset
				};
				switch ( VIDEO_MODE ) {
					case '720p':
					case '720p60':
						ratio = self.editModal.elements[1].GetValue();
						viewport.top = 30;
						viewport.height = 670;
						if ( ratio === '0' ) {
							viewport.left = 193;
							viewport.width = 894;
						} else {
							viewport.left = 40;
							viewport.width = 1200;
						}
						gSTB.SetTeletextViewport(viewport.width, viewport.height, viewport.left, viewport.top);
						gSTB.TeletextTransparency(self.editModal.elements[2].GetValue());
						MediaPlayer.ModalMenu.Menu.gTeletext.lastParams.opacity = self.editModal.elements[2].GetValue();
						break;
					case '1080i':
					case '1080i60':
					case '1080p':
					case '1080p60':
						ratio = self.editModal.elements[1].GetValue();
						viewport.top = 40;
						viewport.height = 1000;
						if ( ratio === '0' ) {
							viewport.left = 273;
							viewport.width = 1374;
						} else {
							viewport.left = 50;
							viewport.width = 1820;
						}
						gSTB.SetTeletextViewport(viewport.width, viewport.height, viewport.left, viewport.top);
						gSTB.TeletextTransparency(self.editModal.elements[2].GetValue());
						MediaPlayer.ModalMenu.Menu.gTeletext.lastParams.opacity = self.editModal.elements[2].GetValue();
						break;
					default :
						gSTB.TeletextTransparency(self.editModal.elements[1].GetValue());
						MediaPlayer.ModalMenu.Menu.gTeletext.lastParams.opacity = self.editModal.elements[1].GetValue();
						break;
				}
				MediaPlayer.ModalMenu.Menu.gTeletext.lastParams.viewport = viewport;
				self.editModal.Show(false);
			});
			arr.push({
				title: _('Force charset'),
				option: [
					{value: 'auto', title: _('Auto')},
					{value: 0x00, title: 'English'},
					//{value: '0x01', title: 'German'},
					//{value: '0x02', title: 'Swedish/Finnish/Hungarian'},
					//{value: '0x03', title: 'Italian'},
					//{value: '0x04', title: 'French'},
					{value: 0x05, title: 'Portuguese/Spanish'},
					//{value: '0x06', title: 'Czech/Slovak'},
					{value: 0x08, title: 'Polish'},
					{value: 0x09, title: 'German'},
					{value: 0x0a, title: 'Swedish/Finnish/Hungarian'},
					{value: 0x0b, title: 'Italian'},
					{value: 0x0c, title: 'French'},
					{value: 0x0e, title: 'Czech/Slovak'},
					//{value: '0x10', title: 'English'},
					//{value: '0x11', title: 'German'},
					//{value: '0x12', title: 'Swedish/Finnish/Hungarian'},
					//{value: '0x13', title: 'Italian'},
					//{value: '0x14', title: 'French'},
					//{value: '0x15', title: 'Portuguese/Spanish'},
					{value: 0x16, title: 'Turkish'},
					{value: 0x1d, title: 'Serbian/Croatian/Slovenian'},
					{value: 0x1f, title: 'Rumanian'},
					{value: 0x20, title: 'Serbian/Croatian'},
					//{value: '0x21', title: 'German'},
					{value: 0x22, title: 'Estonian'},
					{value: 0x23, title: 'Lettish/Lithuanian'},
					{value: 0x24, title: 'Russian/Bulgarian'},
					{value: 0x25, title: 'Ukrainian'},
					//{value: '0x26', title: 'Czech/Slovak'},
					//{value: '0x36', title: 'Turkish'},
					{value: 0x37, title: 'Greek'},
					{value: 0x80, title: 'English/Arabic'},
					{value: 0x84, title: 'French/Arabic'},
					{value: 0x87, title: 'Arabic'},
					{value: 0x95, title: 'Hebrew/Arabic'},
					{value: 0x97, title: 'Arabic'}
				],
				selected: gSTB.GetForceTtxCharset()
			});
			if ( WINDOW_HEIGHT >= 720 ) {
				arr.push({
					title: _('Aspect Ratio'),
					option: [
						{title: '4:3', value: '0'},
						{title: '16:9', value: '1'}
					],
					selected: environment.teletext_ratio
				});
			}
			arr.push({
				title: _('Opacity level'),
				option: [
					{value: '0',   title: '0'},
					{value: '25',  title: '10'},
					{value: '50',  title: '20'},
					{value: '75',  title: '30'},
					{value: '100', title: '40'},
					{value: '125', title: '50'},
					{value: '150', title: '60'},
					{value: '175', title: '70'},
					{value: '200', title: '80'},
					{value: '225', title: '90'},
					{value: '255', title: '100'}
				],
				selected: environment.teletext_opacity
			});
			this.editModal.elements = [];
			for ( i = 0, size = arr.length; i < size; ++i ) {
				elem = element('td');
				tRow = element('tr');
				tRow.appendChild(element('td', {innerHTML: arr[i].title}));
				tRow.appendChild(elem);

				self.editModal.elements[i] = new CSelectBox(MediaBrowser, {
					parent: elem,
					data: arr[i].option,
					idField: arr[i].idField? arr[i].idField : 'value',
					nameField: arr[i].nameField? arr[i].nameField : 'title',
					selectedId: arr[i].selected
				});
				elchild(table, tRow);
			}
			elchild(this.editModal.content, table);
			this.editModal.Init();
			this.editModal.handleInner.classList.add('teletextSettings');
			this.editModal.EventHandler = function( event ) {
				self.editModal.elements[self.editModal.activeElementIndex].EventHandler(event);
				if ( !self.editModal.elements[self.editModal.activeElementIndex].dropdown.isVisible ) {
					if ( event.code === KEYS.DOWN ) {
						++self.editModal.activeElementIndex;
						if ( self.editModal.activeElementIndex >= arr.length ) {
							self.editModal.activeElementIndex = 0;
						}
						echo(self.editModal.activeElementIndex, 'self.editModal.activeElementIndex')
						self.editModal.elements[self.editModal.activeElementIndex].handle.focus();
					} else if ( event.code === KEYS.UP ) {
						--self.editModal.activeElementIndex;
						if ( self.editModal.activeElementIndex < 0 ) {
							self.editModal.activeElementIndex = 2;
						}
						echo(self.editModal.activeElementIndex, 'self.editModal.activeElementIndex')
						self.editModal.elements[self.editModal.activeElementIndex].handle.focus();
					}
					self.editModal.bpanel.EventHandler(event);
				}
			};
			this.editModal.Show(true);
			this.editModal.SetFooter(this.editModal.bpanel.handle);
			this.editModal.activeElementIndex = 0;
			this.editModal.elements[0].Show(true, true);
		}
	};

	/**
	 *
	 * @param event
	 */
	this.ModalMenu.Menu.gTeletext.teletextHandler = function ( event ) {
		/*
		 *  Value | Description
		 * -------|-------------
		 *  0     | digit 0
		 *  1     | digit 1
		 *  2     | digit 2
		 *  3     | digit 3
		 *  4     | digit 4
		 *  5     | digit 5
		 *  6     | digit 6
		 *  7     | digit 7
		 *  8     | digit 8
		 *  9     | digit 9
		 *  10    | NextPage
		 *  11    | PrevPage
		 *  12    | NextSubpage
		 *  13    | PrevSubpage
		 *  14    | Red
		 *  15    | Yellow
		 *  16    | Blue
		 *  17    | Green
		 */
		switch ( event.code ) {
			case KEYS.NUM0:
				event.teletextCode = 0;
				break;
			case KEYS.NUM1:
				event.teletextCode = 1;
				break;
			case KEYS.NUM2:
				event.teletextCode = 2;
				break;
			case KEYS.NUM3:
				event.teletextCode = 3;
				break;
			case KEYS.NUM4:
				event.teletextCode = 4;
				break;
			case KEYS.NUM5:
				event.teletextCode = 5;
				break;
			case KEYS.NUM6:
				event.teletextCode = 6;
				break;
			case KEYS.NUM7:
				event.teletextCode = 7;
				break;
			case KEYS.NUM8:
				event.teletextCode = 8;
				break;
			case KEYS.NUM9:
				event.teletextCode = 9;
				break;
			case KEYS.UP:
				event.teletextCode = 10;
				break;
			case KEYS.DOWN:
				event.teletextCode = 11;
				break;
			case KEYS.RIGHT:
				event.teletextCode = 12;
				break;
			case KEYS.LEFT:
				event.teletextCode = 13;
				break;
			case KEYS.F1:
				event.teletextCode = 14;
				break;
			case KEYS.F3:
				event.teletextCode = 15;
				break;
			case KEYS.F4:
				event.teletextCode = 16;
				break;
			case KEYS.F2:
				event.teletextCode = 17;
				break;
			case KEYS.EXIT:
				gSTB.TeletextShow(false);
				if ( environment.teletext_charset === '' || environment.teletext_charset === 'auto' || environment.teletext_charset === 'disabled' ) {
					gSTB.ForceTtxCharset(0, true);
				} else {
					gSTB.ForceTtxCharset(+environment.teletext_charset, false);
				}
				MediaPlayer.EventHandler = MediaPlayer.ModalMenu.Menu.gTeletext.mediaHandler;
				break;
			case KEYS.MENU:
				MediaPlayer.ModalMenu.Menu.gTeletext.showEditModal();
				break;
			default:
				break;
		}
		if ( event.teletextCode !== undefined ) {
			echo(event.teletextCode , 'TeletextCommand');
			gSTB.TeletextCommand(event.teletextCode);
		}
	};

	this.modalInit = {};

	this.modalInit[MEDIA_TYPE_STREAM] = function () {
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gaudio, false);
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gsubtitle, false);
		if ( typeof self.parent.initEPG === 'function' ) {
			self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gepg, false);
		}
		if ( configuration.mayTimeShift ) {
			self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gts, false);
			self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gtsend, false);
			if ( self.ts_on ) {
				self.ModalMenu.Menu.gts.slist.Marked(self.ModalMenu.Menu.gts.ion, true);
				self.ModalMenu.Menu.gts.slist.Marked(self.ModalMenu.Menu.gts.ioff, false);
			} else {
				self.ModalMenu.Menu.gts.slist.Marked(self.ModalMenu.Menu.gts.ion, false);
				self.ModalMenu.Menu.gts.slist.Marked(self.ModalMenu.Menu.gts.ioff, true);
			}
			if ( self.ts_endType === 2 ) {
				self.ModalMenu.Menu.gtsend.slist.Marked(self.ModalMenu.Menu.gtsend.istop, true);
				self.ModalMenu.Menu.gtsend.slist.Marked(self.ModalMenu.Menu.gtsend.iciclick, false);
			} else {
				self.ModalMenu.Menu.gtsend.slist.Marked(self.ModalMenu.Menu.gtsend.iciclick, true);
				self.ModalMenu.Menu.gtsend.slist.Marked(self.ModalMenu.Menu.gtsend.istop, false);
			}
		}
		echo(environment.teletext_on, 'environment.teletext_on');
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gTeletext, environment.teletext_on === 'on' ? false : true);
		if ( !self.ModalMenu.isVisible ) {
			self.ModalMenu.Menu.Switch(self.ModalMenu.Menu.gaudio);
		}
	};
	this.modalInit[MEDIA_TYPE_DVB] = function () {
		var powerOn = dvbManager.GetAntennaPower();
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gaudio, false);
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gsubtitle, false);
		//self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gdvbAntena, environment.dvb_type === 'DVB-C');
		if ( typeof self.parent.initEPG === 'function' ) {
			self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gepg, false);
		}
		//self.ModalMenu.Menu.gdvbAntena.slist.Marked(self.ModalMenu.Menu.gdvbAntena.ion, powerOn);
		//self.ModalMenu.Menu.gdvbAntena.slist.Marked(self.ModalMenu.Menu.gdvbAntena.ioff, !powerOn);
		echo(environment.teletext_on, 'environment.teletext_on');
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gTeletext, environment.teletext_on === 'on' ? false : true);
	};
	this.modalInit[MEDIA_TYPE_STREAM_TS] = this.modalInit[MEDIA_TYPE_STREAM];

	this.modalInit[MEDIA_TYPE_ISO] = function () {
		self.modalInit[MEDIA_TYPE_VIDEO]();
	};
	this.modalInit[MEDIA_TYPE_IMAGE] = function () {
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gslideOn, false);
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.grotate, false);
		self.ModalMenu.Menu.Switch(self.ModalMenu.Menu.gslideOn);
	};
	this.modalInit[MEDIA_TYPE_AUDIO] = function () {
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gplay, false);
		(self.ModalMenu.Menu.gplay.slist.states.marked || []).forEach(function ( item ) {
			item.self.Marked(item, false);
		});
		if ( self.next ) {
			self.ModalMenu.Menu.gplay.slist.Marked(self.ModalMenu.Menu.gplay.ilist, true);
		} else {
			self.ModalMenu.Menu.gplay.slist.Marked(self.ModalMenu.Menu.gplay.ione, true);
		}
		self.ModalMenu.Menu.Switch(self.ModalMenu.Menu.gplay);
	};
	this.modalInit[MEDIA_TYPE_CUE_ITEM] = this.modalInit[MEDIA_TYPE_AUDIO];
	this.modalInit[MEDIA_TYPE_VIDEO] = function () {
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gaudio, false);
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gsubtitle, false);
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.g3d, false);
		echo(environment.teletext_on, 'environment.teletext_on')
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gTeletext, environment.teletext_on === 'on' ? false : true);
		(self.ModalMenu.Menu.g3d.slist.states.marked || []).forEach(function (item) {
			item.self.Marked(item, false);
		});
		self.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gplay, false);
		(self.ModalMenu.Menu.gplay.slist.states.marked || []).forEach(function ( item ) {
			item.self.Marked(item, false);
		});
		if ( self.next ) {
			self.ModalMenu.Menu.gplay.slist.Marked(self.ModalMenu.Menu.gplay.ilist, true);
		} else {
			self.ModalMenu.Menu.gplay.slist.Marked(self.ModalMenu.Menu.gplay.ione, true);
		}
		self.ModalMenu.Menu.g3d.slist.Marked(self.ModalMenu.Menu.g3d.i1, true);
		self.ModalMenu.Menu.Switch(self.ModalMenu.Menu.gaudio);
	};
	this.modalInit[MEDIA_TYPE_RECORDS_ITEM] = this.modalInit[MEDIA_TYPE_VIDEO];

	this.ModalMenu.Menu.Switch(this.ModalMenu.Menu.gaudio);


	this.askedWindow = null;

	// Events initialization
	stbEvent.bind('player.play', function ( message ) {
		var item = {
			name: decodeURIComponent(message.data).split('/').pop(),
			url: message.data,
			type: getMediaType(message.data)
		};
		if ( currCPage instanceof CModal ) { // we have modal message at portal window
			currCPage.Show(false);
		}
		MediaPlayer.preparePlayer(item, currCPage, true, true, true, false);
		MediaPlayer.askedWindow = message.from;
		setTimeout(function () {
			stbWindowMgr.windowShow(stbWebWindow.windowId());
		}, 1000);
	});
};

MediaPlayer.applyCAS = function ( config ) {
	if ( config ) {
		if ( config.VM_IPTV_ENABLED ) {
			gSTB.SetCASParam(config.VM_IPTV_BOOT_HOST, config.VM_IPTV_BOOT_PORT, '', -1, -1);
			// additional params
			if ( config.VM_IPTV_CAS_PARAM ) {
				for ( var name in config.VM_IPTV_CAS_PARAM ) {
					if ( config.VM_IPTV_CAS_PARAM.hasOwnProperty(name) ) {
						gSTB.SetAdditionalCasParam(name, config.VM_IPTV_CAS_PARAM[name]);
					}
				}
			}
			gSTB.SetCASType(1);
		}

		if ( config.VM_OTT_ENABLED ) {
			gSTB.SetupWebCAS(config.VM_OTT_BOOT_SERVER, config.VM_OTT_COMPANY || '');
			gSTB.SetWebCASLogging(config.VM_OTT_LOG_ENABLED);
		}
	}
};



MediaPlayer.initPlayer = function () {
	var defLang = '';
	for ( var i = 0; i < iso639.length; i++ ) {
		for ( var j = 0; j < iso639[i].code.length; j++ ) {
			if ( iso639[i].code[j] === environment.language ) {
				defLang = iso639[i].code[0];
				break;
			}
		}
		if ( defLang !== '' ) {
			break;
		}
	}

	gSTB.InitPlayer();

	if ( configuration.maySecureM3u ) {
		gSTB.SetPlayerOption('HlsFastStart', '1');
		gSTB.SetPlayerOption('HlsStartQuality', '1');
	}

	gSTB.SetAspect(0x10);
	gSTB.SetVideoControl(0);
	gSTB.SetVideoState(0);
	gSTB.SetTopWin(0);
//	gSTB.SetWinMode(0, 0);
//	gSTB.SetWinMode(1, 0);
	gSTB.SetMode(0);
	gSTB.SetWinAlphaLevel(0, 255);
	gSTB.SetWinAlphaLevel(1, 255);
	gSTB.SetDRC(255,255);
//	gSTB.SetChromaKey(1, 0xFFFFFF);
	gSTB.SetPIG(1, 0, 0, 0);
	gSTB.SetAudioLangs(environment.lang_audiotracks === '' ? '' : iso639[environment.lang_audiotracks].code[0], defLang);
	gSTB.SetSubtitleLangs(environment.lang_subtitles === '' || environment.lang_subtitles === -1 ? '' : iso639[environment.lang_subtitles].code[0], defLang);
	gSTB.SetSubtitlesFont('/usr/lib/fonts/Ubuntu.ttf');
	this.dvbPowerManualOn = false;
	if ( environment.subtitlesColor ) {
		gSTB.SetSubtitlesColor(environment.subtitlesColor);
	}
	if ( environment.subtitlesSize ) {
		gSTB.SetSubtitlesSize(environment.subtitlesSize);
	}

	if ( configuration.mayDVB && (environment.dvb_type === 'DVB-T' || environment.dvb_type === 'DVB-T2') ) {
		dvbManager.SetAntennaPower(true, 0);
	}

	timeShift.SetMaxDuration(environment.ts_time);
	timeShift.SetTimeShiftFolder(environment.ts_path + '/records');

	if ( VIDEO_MODE === '576i' ) {
		gSTB.SetFlicker(1, 0, 0);
	}

	if ( configuration.maySecureM3u ) {
		// PLS
		try {
			PLSCFG = JSON.parse(gSTB.LoadUserData('plscfg.json') || '{}');
			MediaPlayer.applyCAS(PLSCFG);
		} catch ( e ) {
			echo(e, 'PLSCFG no data');
			PLSCFG = {};
		}
	}
};


MediaPlayer.EventHandler = function (e) {
	switch (e.code) {
		case KEYS.UP:
		case KEYS.DOWN:
			if ( MediaPlayer.playListShow && MediaPlayer.infoFlag ) {
				MediaPlayer.PlayList.EventHandler(e);
			} else {
				if ( e.code === KEYS.DOWN ) {
					MediaPlayer.channelNext(e);
				} else {
					MediaPlayer.channelPrev(e);
				}
			}
			break;
		case KEYS.PAGE_DOWN:
			MediaPlayer.nextMedia(e);
			e.preventDefault();
			break;
		case KEYS.PAGE_UP:
			MediaPlayer.prevMedia(e);
			e.preventDefault();
			break;
		case KEYS.OK:
			e.preventDefault();
			if ( MediaPlayer.posModFlag ) {
				clearTimeout(this.timer.setPos);
				echo(MediaPlayer.pos, 'set pos:');
				gSTB.SetPosTime(MediaPlayer.pos);
				MediaPlayer.curTime = MediaPlayer.pos;
				MediaPlayer.pos = 0;
				MediaPlayer.posTime = '';
				MediaPlayer.posMod = 0;
				MediaPlayer.domPlayerCurrentTime.className = 'time_cur';
				if ( !gSTB.IsPlaying() ) {
					gSTB.Continue();
				}
				MediaPlayer.posModFlag = false;
				MediaPlayer.timer.showInfo = setTimeout(function () {
					MediaPlayer.showInfo(false);
				}, 5);
				if ( MediaPlayer.obj.type === MEDIA_TYPE_ISO ) {
					MediaPlayer.checkISOChapter();
				}
				break;
			}
			if ( MediaPlayer.playListShow && MediaPlayer.infoFlag ) {
				MediaPlayer.PlayList.EventHandler(e);
				break;
			}
			MediaPlayer.subscribers[MediaPlayer.EVENT_OK].forEach(function ( subscriber ) {
				subscriber.subscribeEvents[MediaPlayer.EVENT_OK].call(subscriber);
			});
			switch ( MediaPlayer.parent ) {
				case IPTVChannels:
					if ( IPTVChannels.goToChFlag ) {
						clearTimeout(IPTVChannels.timer.goToChannel);
						IPTVChannels.TVList.goToChannel(parseInt(IPTVChannels.TVnumber) + IPTVChannels.TVList.channelStart);
						IPTVChannels.TVnumber = '';
						IPTVChannels.goToChFlag = false;
						IPTVChannels.domChannelNumber.style.display = 'none';
						MediaPlayer.domChannelNumber.style.display = 'none';
					} else {
						MediaPlayer.Show(false, false);
					}
					break;
				case DVBChannels:
					if ( DVBChannels.goToChFlag ) {
						clearTimeout(DVBChannels.timer.goToChannel);
						DVBChannels.DVBList.goToChannel(parseInt(DVBChannels.TVnumber, 10));
						DVBChannels.TVnumber = '';
						DVBChannels.goToChFlag = false;
						DVBChannels.domChannelNumber.style.display = 'none';
						MediaPlayer.domChannelNumber.style.display = 'none';
					} else {
						MediaPlayer.Show(false);
					}
					break;
			}
			break;
		case KEYS.INFO:
			MediaPlayer.showInfo();
			break;
		case KEYS.MENU:
			MediaPlayer.ModalMenu.Show(true);
			break;
		case KEYS.BACK:
			if ( IPTVChannels.goToChFlag && MediaPlayer.parent === IPTVChannels ) {
				IPTVChannels.actionBack();
			}
			break;
		case KEYS.EPG:
			if ( typeof MediaPlayer.parent.initEPG === 'function' ) {
				MediaPlayer.parent.initEPG();
			}
			break;
		case KEYS.EXIT: // Exit
			e.preventDefault();
			if ( MediaPlayer.posModFlag ) {
				clearTimeout(this.timer.setPos);
				MediaPlayer.pos = 0;
				MediaPlayer.posTime = '';
				MediaPlayer.posMod = 0;
				MediaPlayer.domPlayerCurrentTime.className = 'time_cur';
				MediaPlayer.posModFlag = false;
				MediaPlayer.timer.showInfo = setTimeout(function () {
					MediaPlayer.showInfo(false);
				}, 5);
				break;
			}
			MediaPlayer.exit();
			break;
		case KEYS.FRAME:
			MediaPlayer.aspect();
			break;
		case KEYS.PLAY_PAUSE:
			MediaPlayer.playPause();
			break;
		case KEYS.STOP:
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_STREAM_TS:
					MediaPlayer.tsExitCheck('stop');
					break;
				default:
					MediaPlayer.exit();
					break;
			}
			break;
		case KEYS.LEFT:
		case KEYS.REWIND:
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_VIDEO:
				case MEDIA_TYPE_ISO:
				case MEDIA_TYPE_AUDIO:
				case MEDIA_TYPE_RECORDS_ITEM:
				case MEDIA_TYPE_STREAM_TS:
					MediaPlayer.setPos(-1);
					break;
			}
			break;
		case KEYS.RIGHT:
		case KEYS.FORWARD:
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_VIDEO:
				case MEDIA_TYPE_ISO:
				case MEDIA_TYPE_AUDIO:
				case MEDIA_TYPE_RECORDS_ITEM:
				case MEDIA_TYPE_STREAM_TS:
					MediaPlayer.setPos(1);
					break;
			}
			break;
		case KEYS.CHANNEL_NEXT:
			MediaPlayer.channelNext();
			break;
		case KEYS.CHANNEL_PREV:
			MediaPlayer.channelPrev();
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
			switch ( MediaPlayer.parent ) {
				case IPTVChannels:
					if ( MediaPlayer.ts_inProgress ) {
						MediaPlayer.setPosTime('' + (e.code - KEYS.NUM0));
					} else {
						IPTVChannels.goToChannel('' + (e.code - KEYS.NUM0));
					}
					break;
				case DVBChannels:
					if ( MediaPlayer.ts_inProgress ) {
						MediaPlayer.setPosTime('' + (e.code - KEYS.NUM0));
					} else {
						DVBChannels.goToChannel('' + (e.code - KEYS.NUM0));
					}
					break;
				default :
					MediaPlayer.setPosTime('' + (e.code - KEYS.NUM0));
					break;
			}
			break;
		case KEYS.F1:
			if ( (MediaPlayer.parent === IPTVChannels) && !MediaPlayer.ts_inProgress ) {
				if ( environment.mount_media_ro === 'true' ) {
					new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
				} else {
					var item = IPTVChannels.TVList.Current();
					echo('F1 desicion ' + ( MediaPlayer.parent === IPTVChannels ) + !MediaPlayer.ts_inProgress + ( item.data.type === MEDIA_TYPE_STREAM ));
					if ( item.data.type === MEDIA_TYPE_STREAM && configuration.mayPVR ) {
						new CModalAddRecord(this, _('Recording channel'), _('Group name') + ':', {});
					}
				}
				break;
			}
			if ( MediaPlayer.type === MEDIA_TYPE_IMAGE ) {
				MediaPlayer.actionRotate(-90);
			}
			break;
		case KEYS.F2:
			MediaPlayer.actionF2();
			break;
		case KEYS.F3:
			MediaPlayer.actionF3();
			break;
		case KEYS.F4:
			if ( MediaPlayer.type === MEDIA_TYPE_IMAGE ) {
				MediaPlayer.actionRotate(90);
			}
			break;
		case KEYS.REFRESH:
			if ( MediaPlayer.parent && MediaPlayer.parent.actionRefresh ) {
				MediaPlayer.parent.actionRefresh();
			}
			break;
		case KEYS.AUDIO:
			MediaPlayer.showHlsInfo();
			break;
		default :
			e.preventDefault();
			break;
	}
};

MediaPlayer.nextMedia = function () {
	if ( MediaPlayer.list.length > 1 ) {
		if ( MediaPlayer.PlayList.playIndex + 1 < MediaPlayer.list.length ) {
			MediaPlayer.PlayList.playIndex++;
			echo(MediaPlayer.PlayList.playIndex, 'prepare index');
			(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
			MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true);
			// if ( this.parent === MediaBrowser ) {
			// 	MediaBrowser.FileList.Reposition(this.obj);
			// }
		}
	}
	return false;
};

MediaPlayer.prevMedia = function () {
	if ( MediaPlayer.list.length > 1 ) {
		if ( MediaPlayer.PlayList.playIndex > 0 ) {
			MediaPlayer.PlayList.playIndex--;
			(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
			MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true);
			// if ( this.parent === MediaBrowser ) {
			// 	MediaBrowser.FileList.Reposition(this.obj);
			// }
		}
	}
	return false;
};

MediaPlayer.channelNext = function ( event ) {
	var item;
	switch ( MediaPlayer.parent ) {
		case IPTVChannels:
			item = IPTVChannels.TVList.Next(false, false);
			if ( item.data.type === MEDIA_TYPE_STREAM ) {
				clearTimeout(IPTVChannels.timer.goToChannel);
				MediaPlayer.domChannelNumber.innerHTML = (item.data.index - IPTVChannels.TVList.channelStart);
				MediaPlayer.domChannelNumber.style.display = 'block';
				IPTVChannels.TVList.Focused(item, true);
				IPTVChannels.timer.goToChannel = setTimeout(function () {
					MediaPlayer.domChannelNumber.style.display = 'none';
				}, 2000);
			}
			break;
		case DVBChannels:
			item = DVBChannels.DVBList.Next();
			if ( item.data.type === MEDIA_TYPE_DVB ) {
				clearTimeout(DVBChannels.timer.goToChannel);
				MediaPlayer.domChannelNumber.innerHTML = (item.data.index - DVBChannels.DVBList.channelStart);
				MediaPlayer.domChannelNumber.style.display = 'block';
				DVBChannels.DVBList.Focused(item, true);
				DVBChannels.timer.goToChannel = setTimeout(function () {
					MediaPlayer.domChannelNumber.style.display = 'none';
				}, 2000);
			}
			break;
		case MediaBrowser:
			MediaPlayer.nextMedia(event);
			break;
	}
};

MediaPlayer.channelPrev = function ( event ) {
	var item;
	switch ( MediaPlayer.parent ) {
		case IPTVChannels:
			item = IPTVChannels.TVList.Next(false, true);
			if ( item.data.type === MEDIA_TYPE_STREAM ) {
				clearTimeout(IPTVChannels.timer.goToChannel);
				MediaPlayer.domChannelNumber.innerHTML = (item.data.index - IPTVChannels.TVList.channelStart);
				MediaPlayer.domChannelNumber.style.display = 'block';
				IPTVChannels.TVList.Focused(item, true);
				IPTVChannels.timer.goToChannel = setTimeout(function () {
					MediaPlayer.domChannelNumber.style.display = 'none';
				}, 2000);
			}
			break;
		case DVBChannels:
			item = DVBChannels.DVBList.Prev();
			if ( item.data.type === MEDIA_TYPE_DVB ) {
				clearTimeout(DVBChannels.timer.goToChannel);
				MediaPlayer.domChannelNumber.innerHTML = (item.data.index - DVBChannels.DVBList.channelStart);
				MediaPlayer.domChannelNumber.style.display = 'block';
				DVBChannels.DVBList.Focused(item, true);
				DVBChannels.timer.goToChannel = setTimeout(function () {
					MediaPlayer.domChannelNumber.style.display = 'none';
				}, 2000);
			}
			break;
		case MediaBrowser:
			MediaPlayer.prevMedia(event);
			break;
	}
};

MediaPlayer.actionRotate = function ( d ) {
	if ( MediaPlayer.type === MEDIA_TYPE_IMAGE ) {
		this.currentRotation += d;
		if ( this.currentRotation < 0 ) {
			this.currentRotation += 360;
		}
		if ( this.currentRotation > 360 ) {
			this.currentRotation -= 360;
		}
		gSTB.Rotate(this.currentRotation);
	}
	return false;
};


MediaPlayer.actionF2 = function () {
	if ( MediaPlayer.list.length > 1 ) {
		if ( !MediaPlayer.infoFlag && MediaPlayer.playListShow ) {
			MediaPlayer.showInfo(true);
			MediaPlayer.PlayList.Refresh();
			return false;
		}
		if ( MediaPlayer.playListShow ) {
			MediaPlayer.playListShow = false;
			MediaPlayer.handle.querySelector('#playerHideplist').innerHTML = _('Show<br />playlist');
			MediaPlayer.domPlayerList.style.visibility = 'hidden';
		} else {
			MediaPlayer.playListShow = true;
			MediaPlayer.handle.querySelector('#playerHideplist').innerHTML = _('Hide<br />playlist');
			MediaPlayer.showInfo(true);
			MediaPlayer.domPlayerList.style.visibility = 'visible';
			MediaPlayer.PlayList.Refresh();
		}
	}
	return false;
};

MediaPlayer.actionF3 = function () {
	if ( MediaPlayer.favorites ) {
		if ( FAVORITES_NEW[(MediaPlayer.list[MediaPlayer.PlayList.playIndex].sol? MediaPlayer.list[MediaPlayer.PlayList.playIndex].sol + ' ' : '') + MediaPlayer.list[MediaPlayer.PlayList.playIndex].url] ) {
			MediaPlayer.actionF3del();
		} else {
			MediaPlayer.actionF3add();
		}
	}
	return false;
};

/**
 * Add to the global list selected files (selected dirs are ignored)
 */
MediaPlayer.actionF3add = function () {
	if ( typeof this.parent.actionF3add === 'function' ) {
		this.parent.actionF3add();
	} else {
		MediaBrowser.FavAdd(this.list[this.PlayList.playIndex].url, {
			name: this.list[this.PlayList.playIndex].name,
			url: this.list[this.PlayList.playIndex].url,
			type: this.list[this.PlayList.playIndex].type,
			markable: true
		});
	}
	this.domHeaderBlue.innerHTML = _('Remove from<br>favorites');
};


/**
 * Remove from the global list
 */
MediaPlayer.actionF3del = function () {
	if ( typeof this.parent.actionF3del === 'function' ) {
		this.parent.actionF3del();
	} else {
		MediaBrowser.FavRemove(this.list[this.PlayList.playIndex].url);
	}
	this.domHeaderBlue.innerHTML = _('Add to<br>favorites');
};


MediaPlayer.mixList = function () {
	var self = this;
	var list = this.list.slice();
	var mixedList = [];
	var i = 1;
	mixedList[0] = list.splice(this.PlayList.playIndex, 1)[0];
	while ( true ) {
		if ( list.length === 0 ) {
			break;
		}
		mixedList[i] = list.splice(random(0, list.length - 1), 1)[0];
		i++;
	}
	this.prepareList(mixedList);
	setTimeout(function () {
		self.PlayList.Focused(self.PlayList.handle.children[self.PlayList.playIndex], false);
		self.PlayList.Marked(self.PlayList.handle.children[self.PlayList.playIndex], true);
	}, 5);
};


/**
 * Mount the given external subtitle and show it
 * @param {Object} item subtitle menu item with data
 */
MediaPlayer.showSubtitleHint = function ( item ) {
	var self = this;
	self.handle.querySelector('#subText').innerHTML = item.name;
	self.handle.querySelector('#cright_bottom_sub').style.display = 'block';
	clearTimeout(self.timer.sub);
	self.timer.sub = setTimeout(function () {
		self.handle.querySelector('#cright_bottom_sub').style.display = 'none';
	}, self.TIME_HIDE_HINT);
};


MediaPlayer.openSubtitle = function ( sub, callback ) {
	var self = this;
	this.subtitlesPid = null;
	if ( !gSTB.IsFileUTF8Encoded(sub.url) && !sub.encoding ) {
		self.subCModal = new CModalSubtitleOpen(currCPage, {
			data: sub,
			closeParent: true,
			item: this,
			onadd: function ( options, encoding ) {
				if ( !self.loadSubtitles(options.data, encoding, callback) ) {
					new CModalHint(currCPage, _('Selected subtitle file is not available'), 5000);
				}
			}
		});
	} else {
		if ( !self.loadSubtitles(sub, sub.encoding || 'utf-8', callback) ) {
			new CModalHint(currCPage, _('Selected subtitle file is not available'), 5000);
		}
	}
};


/**
 * Load external subtitles
 * @param {Object} data Subtitle
 * @param {string} encoding subtitle encoding
 * @param {Function} callback on load
 * @return {boolean} preparing is done
 */
MediaPlayer.loadSubtitles = function ( data, encoding, callback ) {
	if ( !data.url || !encoding || !gSTB.IsFileExist(data.url) ) {
		return false;
	}
	gSTB.SetSubtitlesEncoding(encoding);
	gSTB.LoadExternalSubtitles(data.url);
	this.subtitles_on = true;
	this.subtitlesData = data;
	this.subtitlesEncoding = encoding;
	gSTB.SetSubtitles(true);
	this.showSubtitleHint(data);
	if ( typeof callback === 'function' ) {
		callback();
	}
	return true;
};


/**
 * Load forced subtitles
 * @param {Object} data Subtitle
 * @param {string} encoding subtitle encoding
 */
MediaPlayer.setForcedSubtitles = function ( data, encoding ) {
	this.forcedSubtitles = Object.create(data);
	this.forcedSubtitles.marked = true;
	this.forcedSubtitles.encoding = encoding;
	//this.forcedSubtitles = data;
};


/**
 * prepare SubList
 * @return {Array} prepeared list of subtitles
 */
MediaPlayer.prepareSubList = function () {
	var subList = [],
		marked = false;
	if ( this.forcedSubtitles !== null ) {
		subList.push(this.forcedSubtitles);
		marked = true;
	}
	for ( var i = 0; i < this.subList.length; i++ ) {
		if ( (this.forcedSubtitles !== null && this.forcedSubtitles.url !== this.subList[i].url) || this.forcedSubtitles === null ) {
			if ( this.obj.ext && this.obj.ext.length && this.obj.name.slice(0, -this.obj.ext.length) === this.subList[i].name.slice(0, -this.subList[i].ext.length) && !marked ) {
				marked = this.subList[i].marked = true;
			} else {
				this.subList[i].marked = false;
			}
			subList.push(this.subList[i]);
		}
	}
	this.forcedSubtitles = null;
	this.subList = subList;
	return subList;
};


/**
 * set SubList array
 * @param {Array} subList array Subtitles list
 * @return {boolean} preparing is done
 */
MediaPlayer.setSubList = function ( subList ) {
	if ( subList.length > 0 && Array.isArray(subList) ) {
		this.subList = subList;
		return true;
	} else {
		this.subList = [];
	}
	return false;
};


/**
 * prepare Playlist
 * @param {Array} list array playlist
 * @return {boolean} preparing is done
 */
MediaPlayer.prepareList = function ( list, index ) {
	if ( list.length === 0 || !Array.isArray(list) ) {
		return false;
	}
	if ( this.playNow && this.type === MEDIA_TYPE_ISO ) {
		return false;
	}
	echo(index, 'prepareList');
	if ( typeof index !== 'undefined' ) {
		this.PlayList.playIndex = index;
	} else {
		this.PlayList.playIndex = 0;
	}
	this.list = [];
	this.list = list;
	this.PlayList.Reset();
	for ( var i = 0; i < this.list.length; i++ ) {
		this.PlayList.Add(list[i].name, {
			index: i,
			url: list[i].url
		}, {stared: FAVORITES_NEW[list[i].url] ? true : false});
	}
	return true;
};


/**
 * prepare Player to play and init playlist
 * @param {Object} obj Object to play
 * @param {Object} parent parent page
 * @param {boolean} fullScreen play in fullScreen
 * @param {boolean} show show player
 * @param {boolean} [favorites] may Add to favorites
 * @param {boolean} [next] play next file automatically
 * @param {Object} [options] options to play
 * @return {boolean} preparing is done
 */
MediaPlayer.preparePlayer = function ( obj, parent, fullScreen, show, favorites, next ) {
	var number = this.list.indexOf(obj);

	echo(obj, 'obj player');
	show = !!show;
	if ( number === -1 ) {
		this.prepareList([obj]);
		number = 0;
	}
	this.audioPid = null;
	this.subtitlesPid = null;
	this.subtitles_on = environment.subtitles_on;
	this.PlayList.playIndex = number;
	(this.PlayList.states.marked || []).forEach(function ( item ) {
		item.self.Marked(item, false);
	});
	this.PlayList.Focused(this.PlayList.handle.children[number], true, show);
	this.PlayList.Marked(this.PlayList.handle.children[number], true);
	if ( this.list.length === 0 || !parent || !obj ) {
		return false;
	}
	this.playListShow = false;
	this.domPlayerList.style.visibility = 'hidden';
	this.parent = parent;
	this.fullScreen = fullScreen !== false;
	this.fullScreen = !this.fullScreen;
	this.favorites = favorites !== false;
	this.next = !!next;
	this.repeat = false;
	if ( this.favorites ) {
		this.domHeaderBlue.style.display = 'block';
	} else {
		this.domHeaderBlue.style.display = 'none';
	}
	if ( !this.prepare(this.list[number], true) ) {
		return false;
	}
	if ( this.list.length > 1 || this.type === MEDIA_TYPE_ISO ) {
		this.handle.querySelector('#playerHideplist').style.display = 'block';
		this.handle.querySelector('#playerHideplist').innerHTML = _('Show<br />playlist');
	} else {
		this.handle.querySelector('#playerHideplist').style.display = 'none';
	}
	this.resetModalMenu();
	if ( show ) {
		this.Show(true, parent);
	}

	this.changeScreenMode(fullScreen);
	return true;
};

/**
 * reset modal menu
 */
MediaPlayer.resetModalMenu = function () {
	//var self = this;
	(this.ModalMenu.Menu.gplay.slist.states.marked || []).forEach(function ( item ) {
		item.self.Marked(item, false);
	});
	if ( this.next ) {
		if ( this.repeat ) {
			this.ModalMenu.Menu.gplay.slist.Marked(this.ModalMenu.Menu.gplay.ilistr, true);
		} else {
			this.ModalMenu.Menu.gplay.slist.Marked(this.ModalMenu.Menu.gplay.ilist, true);
		}
	} else {
		if ( this.repeat ) {
			this.ModalMenu.Menu.gplay.slist.Marked(this.ModalMenu.Menu.gplay.ioner, true);
		} else {
			this.ModalMenu.Menu.gplay.slist.Marked(this.ModalMenu.Menu.gplay.ione, true);
		}
	}
};

MediaPlayer.prepare = function ( obj, play, noInfo ) {
	var tempUrl = '';

	if ( this.obj === obj || !obj || !obj.url ) {
		return false;
	}
	clearTimeout(this.timer.showInfo);
	clearTimeout(this.timer.startPlaying);
	gSTB.Set3DConversionMode(0);
	this.domTSIndicator.style.display = 'none';
	this.domPlayerTotalTime.innerHTML = '00:00:00';
	this.domPlayerCurrentTime.innerHTML = '00:00:00';
	this.domPlayerBufferBar.style.width = '0px';
	this.domPlayerProgressBar.style.width = '0px';
	document.getElementById('cright').style.display = 'none';
	document.getElementById('cright_bottom_sub').style.display = 'none';
	document.getElementById('cright_bottom_tvtext').style.display = 'none';
	document.getElementById('cright_hls').style.display = 'none';
	this.audioPid = null;
	this.subtitlesPid = null;
	this.ModalMenu.Menu.gaudio.slist.Clear();
	this.ModalMenu.Menu.gsubtitle.slist.Clear();
	if ( this.favorites ) {
		if ( this.parent === IPTVChannels ) {
			tempUrl = (obj.sol? obj.sol + ' ' : '') + obj.url;
		} else {
			tempUrl = obj.url;
		}
		if ( FAVORITES_NEW[tempUrl] ) {
			this.domHeaderBlue.innerHTML = _('Remove from<br>favorites');
		} else {
			this.domHeaderBlue.innerHTML = _('Add to<br>favorites');
		}
	}
	this.pos = 0;
	this.curTime = 0;
	this.totalTime = 0;
	this.infoFlag = !noInfo ? false : this.infoFlag;
	this.ts_inProgress = false;
	this.countError = 0;
	clearTimeout(MediaPlayer.errorTimer);
	// this.obj = null;
	this.obj = obj;
	switch ( this.parent ) {
		case IPTVChannels:
			if ( IPTVChannels.TVList.activeItem ) {
				this.domPlayerTitle.innerHTML = '<span>' + IPTVChannels.TVList.activeItem.data.number + '</span>' + '&nbsp;&nbsp;&nbsp;' + obj.name;
			}
			break;
		case DVBChannels:
			if ( DVBChannels.DVBList.activeItem ) {
				this.domPlayerTitle.innerHTML = '<span>' + DVBChannels.DVBList.activeItem.data.channelNumber + '</span>' + '&nbsp;&nbsp;&nbsp;' + obj.name;
			}
			break;
		default:
			this.domPlayerTitle.innerHTML = obj.name;
			break;
	}
	if ( this.type !== obj.type ) {
		this.domSlideContainer.style.display = 'none';
		this.type = obj.type;
		if ( typeof this.init[this.type] === 'function' ) {
			this.init[this.type]();
		} else {
			return false;
		}
		for ( var a = 0; a < this.ModalMenu.Menu.handleInner.children.length; a++ ) {
			this.ModalMenu.Menu.Hidden(this.ModalMenu.Menu.handleInner.children[a], true);
		}
		if ( typeof this.modalInit[this.type] === 'function' ) {
			this.modalInit[this.type]();
		} else {
			return false;
		}
	}
	if ( play ) {
		this.runner.stop();
		this.timer.startPlaying = setTimeout(function () {
			if ( !noInfo ) {
				MediaPlayer.showInfo(true);
			}
			MediaPlayer.play();
		}, 5);
	}
	return true;
};


MediaPlayer.play = function ( restore ) {
	var param = '', i;

	if ( !this.obj ) {
		return;
	}
	if ( gSTB.GetStandByStatus() ) {
		this.inStandBy = true;
		return;
	}
	this.currentRotation = 0;
	clearTimeout(this.timer.mono);
	this.handle.querySelector('#dualmono_indicator').style.display = 'none';
	this.sol = this.obj.sol !== '' ? this.obj.sol : 'auto';
	for ( i in this.obj.options ) {
		if ( this.obj.options[i] ) {
			param += ' ' + i + ':' + this.obj.options[i];
		}
	}


	switch ( this.type ) {
		case MEDIA_TYPE_DVB:
			this.sol = 'dvb';
			break;
		case MEDIA_TYPE_STREAM:
			clearTimeout(this.timer.ts_timer);
			this.ModalMenu.Menu.gaudio.slist.Clear();
			this.ModalMenu.Menu.gsubtitle.slist.Clear();
			var arr = this.obj.url.trim().split(' ');
			this.obj.url = this.obj.url.replace(/^[A-Za-z0-9]+\s/, '');
			if ( arr.length > 1 && arr[0].indexOf('://') === -1 ) {
				this.obj.sol = arr[0];
				this.sol = this.obj.sol;
			}
			this.oldSol = this.obj.sol;
			this.oldURL = this.obj.url;
			if ( this.obj.tsOn && this.ts_on ) {
				this.sol = 'extTimeShift';
				if ( !this.checkUsb(environment.ts_path) ) {
					if ( !restore ) {
						if ( environment.mount_media_ro === 'true' ) {
							new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
						} else {
							new CModalConfirm(currCPage, _('Error'), _('No storage device selected as the \"File location\" in TimeShift settings. Disable TimeShift?'),
								_('No'), function () {},
								_('Yes'), function () {
									MediaPlayer.tsOnOff(false);
								});
						}
					}
				}
			}
			break;
		case MEDIA_TYPE_IMAGE:
			this.sol = 'jpeg';
			break;
		case MEDIA_TYPE_RECORDS_ITEM:
			this.sol = 'extTimeShiftPlayer';
			break;
		case MEDIA_TYPE_ISO:
			this.sol = 'extBDDVD';
			break;
		case MEDIA_TYPE_CUE_ITEM:
			param = ' position:' + this.obj.time;
			break;
	}
	this.playNow = false;
	this.startingPlay = true;
	this.isVideo = true;
	echo('gSTB PLAY  ' + (this.sol ? this.sol + ' ' : 'auto ') + this.obj.url + param)
	gSTB.Play((this.sol ? this.sol + ' ' : 'auto ') + this.obj.url + param);
};


MediaPlayer.setPos = function ( a ) {
	echo(this.playNow, 'this.playNow ' + a);
	if ( !this.playNow ) {
		return;
	}
	this.posModFlag = true;
	clearTimeout(this.timer.setPos);
	clearTimeout(this.timer.showInfo);
	this.posTime = '';
	this.runner.stop();
	if ( this.pos === 0 ) {
		this.curTime = gSTB.GetPosTime();
		this.showInfo(true, 0, false);
		this.pos = this.curTime;
	}
	if ( this.posMod !== a ) {
		this.posMod = a;
		this.posIntervals = [0, 0, 10];
	} else {
		this.posIntervals.splice(0, 1);
		echo(this.posIntervals, 'splice');
		this.posIntervals[this.posIntervals.length] = this.posIntervals[this.posIntervals.length - 1] + 10;
	}
	var to = 0;
	for ( var i = 0; i < this.posIntervals.length; i++ ) {
		to += a * this.posIntervals[i];
	}
	if ( to > 1800 ) {
		to = 1800;
	}
	if ( to < -1800 ) {
		to = -1800;
	}
	this.pos += to;
	if ( this.pos > this.totalTime ) {
		this.pos = this.totalTime - 1;
	}
	if ( this.pos < 0 ) {
		this.pos = 3;
	}
	var curTime, px;
	if ( MediaPlayer.type === MEDIA_TYPE_STREAM_TS ) {
		px = Math.round(this.pos / environment.ts_time * this.progress[WINDOW_HEIGHT]);
		curTime = this.parseTime(this.totalTime - this.pos);
		this.domPlayerCurrentTime.innerHTML = '-' + curTime.hour + ':' + curTime.min + ':' + curTime.sec;
	} else {
		curTime = this.parseTime(this.pos);
		px = Math.round(this.pos / this.totalTime * this.progress[WINDOW_HEIGHT]);
		this.domPlayerCurrentTime.innerHTML = curTime.hour + ':' + curTime.min + ':' + curTime.sec;
	}
	this.domPlayerProgressBar.style.width = px + 'px';
	this.timer.setPos = setTimeout(function () {
		MediaPlayer.setPosTimeManual(MediaPlayer.pos);
	}, 2000);
	return false;
};


MediaPlayer.setPosTimeManual = function ( pos ) {
	this.curTime = gSTB.GetPosTime();
	this.showInfo(true, 0, false);
	this.pos = pos;
	gSTB.SetPosTime(this.pos);
	if ( UPnPRenderer.state ) {
		stbUPnPRenderer.sendPosition(pos);
	}
	this.curTime = this.pos;
	this.pos = 0;
	this.domPlayerCurrentTime.className = 'time_cur';
	this.posMod = 0;
	if ( !gSTB.IsPlaying() ) {
		gSTB.Continue();
	}
	this.posModFlag = false;
	if ( this.obj.type === MEDIA_TYPE_CUE_ITEM && this.list.length > 1 ) {
		for ( var i = 0; i < this.list.length; i++ ) {
			if ( this.pos > this.list[i].time ) {
				this.PlayList.playIndex = i - 1;
				this.PlayList.Focused(this.PlayList.handle.children[this.PlayList.playIndex], true);
				this.obj = this.list[this.PlayList.activeItem.data.index];
				this.domPlayerTitle.innerHTML = this.obj.name;
				break;
			}
		}
	}
	if ( this.obj.type === MEDIA_TYPE_ISO ) {
		this.checkISOChapter();
	}
};


MediaPlayer.checkISOChapter = function () {
	for ( this.PlayList.playIndex = 0; this.PlayList.playIndex < MediaPlayer.list.length -1; this.PlayList.playIndex++ ) {
		if ( this.curTime >= this.dataDVD.titles[this.PlayList.parentIndex].chapters[this.PlayList.playIndex].startTime / 1000 && this.curTime < this.dataDVD.titles[this.PlayList.parentIndex].chapters[this.PlayList.playIndex+1].startTime / 1000 ) {
			(this.PlayList.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			this.PlayList.Marked(this.PlayList.handle.children[this.dataDVD.titles[this.PlayList.parentIndex].chapters[this.PlayList.playIndex].chN], true);
			break;
		}
	}
};


MediaPlayer.setPosTime = function ( a ) {
	if ( !this.playNow ) {
		return;
	}
	this.posModFlag = true;
	this.showInfo(true, 0, false);
	this.posMod = 0;
	clearTimeout(this.timer.setPos);
	clearTimeout(this.timer.showInfo);
	this.runner.stop();
	this.posTime += a;
	echo(this.posTime, 'this.posTime');
	this.posTime = parseInt(this.posTime, 10);
	this.pos = this.splitTime(this.posTime);
	if ( this.pos > this.totalTime ) {
		this.pos = this.totalTime;
	}
	var curTime, px;
	if ( MediaPlayer.type === MEDIA_TYPE_STREAM_TS ) {
		px = Math.round(this.pos / environment.ts_time * this.progress[WINDOW_HEIGHT]);
		curTime = this.parseTime(this.totalTime - this.pos);
		this.domPlayerCurrentTime.innerHTML = '-' + curTime.hour + ':' + curTime.min + ':' + curTime.sec;
	} else {
		curTime = this.parseTime(this.pos);
		px = Math.round(this.pos / this.totalTime * this.progress[WINDOW_HEIGHT]);
		this.domPlayerCurrentTime.innerHTML = curTime.hour + ':' + curTime.min + ':' + curTime.sec;
	}
	this.domPlayerCurrentTime.className = 'time_cur input';
	this.domPlayerProgressBar.style.width = px + 'px';
	this.timer.setPos = setTimeout(function () {
		gSTB.SetPosTime(MediaPlayer.pos);
		MediaPlayer.curTime = MediaPlayer.pos;
		MediaPlayer.pos = 0;
		MediaPlayer.posTime = '';
		MediaPlayer.posMod = 0;
		MediaPlayer.domPlayerCurrentTime.className = 'time_cur';
		if ( !gSTB.IsPlaying() ) {
			gSTB.Continue();
		}
		MediaPlayer.posModFlag = false;
		if ( MediaPlayer.obj.type === MEDIA_TYPE_CUE_ITEM && MediaPlayer.list.length > 1 ) {
			for ( var i = 0; i < MediaPlayer.list.length; i++ ) {
				if ( MediaPlayer.pos > MediaPlayer.list[i].time ) {
					MediaPlayer.PlayList.playIndex = i - 1;
					MediaPlayer.PlayList.Focused(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
					MediaPlayer.obj = MediaPlayer.list[MediaPlayer.PlayList.activeItem.data.index];
					MediaPlayer.domPlayerTitle.innerHTML = MediaPlayer.obj.name;
					break;
				}
			}
		}
		if ( MediaPlayer.obj.type === MEDIA_TYPE_ISO ) {
			MediaPlayer.checkISOChapter();
		}
	}, 2000);
};


MediaPlayer.playPause = function ( pause ) {
	var self = this;
	if ( !this.playNow ) {
		if ( this.type === MEDIA_TYPE_IMAGE ) {
			echo(this.timer.slideShow, 'this.timer.slideShow')
			echo(this.slideOn, 'this.slideOn')
			if ( this.timer.slideShow ) {
				echo('CLEAR TIMEOUT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11111111111111111111')
				clearTimeout(this.timer.slideShow);
				this.timer.slideShow = null;
			} else if ( this.slideOn > 0 ) {
				this.timer.slideShow = setTimeout(function () {
					echo(self.list.length > 1 && self.fullScreen, 'self.list.length > 1 && self.fullScreen')
					if ( self.list.length > 1 && self.fullScreen ) {
						if ( self.PlayList.playIndex + 1 < self.list.length ) {
							self.PlayList.playIndex++;
							( self.PlayList.states.marked || [] ).forEach(function ( item ) {
								item.self.Marked(item, false);
							});
							self.PlayList.Marked(self.PlayList.handle.children[self.PlayList.playIndex], true);
							self.prepare(self.list[self.PlayList.handle.children[self.PlayList.playIndex].data.index], true, true);
							// if ( self.parent === MediaBrowser ) {
							// 	MediaBrowser.FileList.Reposition(self.obj);
							// }
						}
					}
				}, this.slideOn * 1000);
				echo(this.timer.slideShow, 'setTimeout')
			}
		} else {
			return;
		}
	}
	clearTimeout(this.timer.showInfo);
	if ( this.sol === 'extTimeShift' && !this.ts_inProgress && this.type === MEDIA_TYPE_STREAM ) {
		if ( !this.checkUsb(environment.ts_path) ) {
			if ( environment.mount_media_ro === 'true' ) {
				new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
			} else {
				new CModalConfirm(currCPage, _('Error'), _('No storage device selected as the \"File location\" in TimeShift settings. Disable TimeShift?'),
					_('No'), function () {},
					_('Yes'), function () {
						MediaPlayer.tsOnOff(false);
					});
			}
		} else {
			this.ts_start(0, true);
			this.runner.start();
		}
		return;
	}
	echo(gSTB.IsPlaying() || pause , 'gSTB.IsPlaying() || pause ')
	if ( gSTB.IsPlaying() || pause ) {
		this.showInfo(true, 0, false);
		gSTB.Pause();
		this.subscribers[this.EVENT_PAUSE].forEach(function ( subscriber ) {
			subscriber.subscribeEvents[self.EVENT_PAUSE].call(subscriber, true);
		});
		if ( this.type !== MEDIA_TYPE_STREAM_TS ) {
			this.runner.stop();
		}
	} else {
		echo('gSTB CONTINUE!C C C C')
		gSTB.Continue();
		this.subscribers[this.EVENT_PAUSE].forEach(function ( subscriber ) {
			subscriber.subscribeEvents[self.EVENT_PAUSE].call(subscriber, false);
		});
		if ( this.type !== MEDIA_TYPE_STREAM_TS ) {
			this.runner.start();
		}
		if ( this.type !== MEDIA_TYPE_AUDIO ) {
			this.timer.showInfo = setTimeout(function () {
				MediaPlayer.showInfo(false);
			}, 5);
		}
	}
};


MediaPlayer.event = function ( e, info ) {
	echo('event : ' + e);
	e = parseInt(e, 10);
	switch ( e ) {
		case 1:
			if ( MediaPlayer.ModalMenu.Menu.gTeletext.mediaHandler ) {
				MediaPlayer.EventHandler = MediaPlayer.ModalMenu.Menu.gTeletext.mediaHandler
			}
			MediaPlayer.startingPlay = false;
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_STREAM:
//					MediaPlayer.countError += 10;
//					if ( MediaPlayer.countError > MediaPlayer.errorTime ) {
//						MediaPlayer.countError = MediaPlayer.errorTime;
//					}
					clearTimeout(MediaPlayer.errorTimer);
					MediaPlayer.errorTimer = window.setTimeout(function () {
						MediaPlayer.play(true);
					}, 3000);
//					MediaPlayer.countError++;
//					if (MediaPlayer.countError < 5 && (currCPage === MediaPlayer || currCPage === IPTVChannels || currCPage.parent === MediaPlayer || currCPage.parent === IPTVChannels)) {
//						MediaPlayer.play(true);
//					} else {
//						// call all subscribers hooks
//						MediaPlayer.subscribers[MediaPlayer.EVENT_ERROR].forEach(function (subscriber) {
//							subscriber.subscribeEvents[MediaPlayer.EVENT_ERROR].call(subscriber);
//						});
//						setTimeout(function () {
//							new CModalHint(currCPage, _('Playing error'), 3000);
//						}, 5);
//						MediaPlayer.end();
//					}
					break;
				case MEDIA_TYPE_CUE_ITEM:
					if ( currCPage === MediaPlayer || currCPage.parent === MediaPlayer ) {
						MediaPlayer.exit();
					} else {
						MediaPlayer.end();
					}
					break;
				case MEDIA_TYPE_ISO:
					if ( MediaPlayer.PlayList.parentIndex + 2 < MediaPlayer.dataDVD.titles.length ) {
						MediaPlayer.PlayList.parentIndex++;
						var param = '?title=' + MediaPlayer.PlayList.parentIndex;
						echo((MediaPlayer.sol ? MediaPlayer.sol + ' ' : 'auto ') + MediaPlayer.obj.url + param, 'TO PLAY');
						MediaPlayer.playNow = false;
						MediaPlayer.runner.stop();
						gSTB.Play((MediaPlayer.sol ? MediaPlayer.sol + ' ' : 'auto ') + MediaPlayer.obj.url + param);
					} else {
						if ( currCPage === MediaPlayer ) {
							MediaPlayer.exit();
						} else {
							MediaPlayer.end();
						}
					}
					break;
				default:
					if ( MediaPlayer.next ) {
						if ( MediaPlayer.list.length > 1 && MediaPlayer.fullScreen ) {
							if ( MediaPlayer.PlayList.playIndex + 1 < MediaPlayer.list.length ) {
								MediaPlayer.PlayList.playIndex++;
								(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
									item.self.Marked(item, false);
								});
								MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
								MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true);
								// if ( MediaPlayer.parent === MediaBrowser ) {
								// 	MediaBrowser.FileList.Reposition(MediaPlayer.obj);
								// }
								break;
							} else {
								if ( MediaPlayer.repeat ) {
									MediaPlayer.PlayList.playIndex = 0;
									(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
										item.self.Marked(item, false);
									});
									MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
									MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true);
									// if ( MediaPlayer.parent === MediaBrowser ) {
									// 	MediaBrowser.FileList.Reposition(MediaPlayer.obj);
									// }
									break;
								}
							}
						}
					} else {
						if ( MediaPlayer.repeat ) {
							MediaPlayer.play();
							break;
						}
					}
					if ( currCPage === MediaPlayer || currCPage.parent === MediaPlayer ) {
						MediaPlayer.exit();
					} else {
						MediaPlayer.end();
					}
					break;
			}
			break;
		case 2:
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_ISO:
				case MEDIA_TYPE_RECORDS_ITEM:
				case MEDIA_TYPE_AUDIO:
				case MEDIA_TYPE_CUE_ITEM:
				case MEDIA_TYPE_VIDEO:
					MediaPlayer.curTime = 0;
					MediaPlayer.totalTime = gSTB.GetMediaLen();
					var curTime = MediaPlayer.parseTime(MediaPlayer.totalTime);
					MediaPlayer.domPlayerTotalTime.innerHTML = curTime.hour + ':' + curTime.min + ':' + curTime.sec;
					break;
			}
			MediaPlayer.setAudioMenu();
			MediaPlayer.initSubtitleMenu();
			MediaPlayer.initTeletextMenu();
			break;
		case 4:
			MediaPlayer.startingPlay = false;
			if ( !MediaPlayer.playNow ) {
				MediaPlayer.subscribers[MediaPlayer.EVENT_START].forEach(function ( subscriber ) {
					subscriber.subscribeEvents[MediaPlayer.EVENT_START].call(subscriber);
				});
			}
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_ISO:
					if ( !MediaPlayer.playNow ) {
						MediaPlayer.setDVDInfo();
					}
					MediaPlayer.timer.showInfo = setTimeout(function () {
						MediaPlayer.showInfo(false);
					}, MediaPlayer.TIME_HIDE_INFO);
					if ( !MediaPlayer.isVideo ) {
						MediaPlayer.domSlideContainer.style.display = 'block';
					}
					MediaPlayer.runner.start();
					break;
				/* falls through */
				case MEDIA_TYPE_AUDIO:
					if ( !MediaPlayer.isVideo ) {
						MediaPlayer.domSlideContainer.style.display = 'block';
					}
					MediaPlayer.runner.start();
					break;
				case MEDIA_TYPE_VIDEO:
				case MEDIA_TYPE_STREAM_TS:
				case MEDIA_TYPE_RECORDS_ITEM:
				case MEDIA_TYPE_CUE_ITEM:
				case MEDIA_TYPE_DVB:
					MediaPlayer.runner.start();
					MediaPlayer.timer.showInfo = setTimeout(function () {
						MediaPlayer.showInfo(false);
					}, MediaPlayer.TIME_HIDE_INFO);
					break;
				case MEDIA_TYPE_STREAM:
					clearTimeout(MediaPlayer.errorTimer);
					MediaPlayer.timer.showInfo = setTimeout(function () {
						MediaPlayer.showInfo(false);
					}, MediaPlayer.TIME_HIDE_INFO);
					if ( MediaPlayer.obj.tsOn && MediaPlayer.ts_on && environment.ts_lag > 0 && !MediaPlayer.ts_inProgress && !MediaPlayer.playNow ) {
						if ( MediaPlayer.checkUsb(environment.ts_path) ) {
							MediaPlayer.ts_start(environment.ts_lag);
						}
					}
					break;
			}
			MediaPlayer.playNow = gSTB.IsPlaying();
			break;
		case 5:
			if ( MediaPlayer.ModalMenu.Menu.gTeletext.mediaHandler ) {
				MediaPlayer.EventHandler = MediaPlayer.ModalMenu.Menu.gTeletext.mediaHandler
			}
			MediaPlayer.startingPlay = false;
			MediaPlayer.runner.stop();
			MediaPlayer.subscribers[MediaPlayer.EVENT_ERROR].forEach(function ( subscriber ) {
				subscriber.subscribeEvents[MediaPlayer.EVENT_ERROR].call(subscriber);
			});
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_STREAM:
					clearTimeout(MediaPlayer.errorTimer);
					MediaPlayer.errorTimer = window.setTimeout(function () {
						MediaPlayer.play(true);
					}, 3000);
					break;
				case MEDIA_TYPE_STREAM_TS:
				case MEDIA_TYPE_VIDEO:
				case MEDIA_TYPE_DVB:
				case MEDIA_TYPE_AUDIO:
					if ( MediaPlayer.next ) {
						if ( MediaPlayer.list.length > 1 && MediaPlayer.fullScreen ) {
							if ( MediaPlayer.PlayList.playIndex + 1 < MediaPlayer.list.length ) {
								MediaPlayer.PlayList.playIndex++;
								(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
									item.self.Marked(item, false);
								});
								MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
								MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true);
								// if ( MediaPlayer.parent === MediaBrowser ) {
								// 	MediaBrowser.FileList.Reposition(MediaPlayer.obj);
								// }
								break;
							} else {
								if ( MediaPlayer.repeat ) {
									MediaPlayer.PlayList.playIndex = 0;
									(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
										item.self.Marked(item, false);
									});
									MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
									MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true);
									// if ( MediaPlayer.parent === MediaBrowser ) {
									// 	MediaBrowser.FileList.Reposition(MediaPlayer.obj);
									// }
									break;
								}
							}
						}
					}
					if ( currCPage === MediaPlayer || currCPage.parent === MediaPlayer ) {
						MediaPlayer.exit();
					} else {
						MediaPlayer.end();
					}
					setTimeout(function () {
						new CModalHint(currCPage, _('Playing error'), 3000);
					}, 5);
					break;
				case MEDIA_TYPE_CUE_ITEM:
				case MEDIA_TYPE_ISO:
					if ( currCPage === MediaPlayer || currCPage.parent === MediaPlayer ) {
						MediaPlayer.exit();
					} else {
						MediaPlayer.end();
					}
					setTimeout(function () {
						new CModalHint(currCPage, _('Playing error'), 3000);
					}, 5);
					break;
				case MEDIA_TYPE_IMAGE:
					clearTimeout(MediaPlayer.timer.slideShow);
					MediaPlayer.timer.slideShow = null;
					if ( MediaPlayer.slideOn > 0 ) {
						if ( MediaPlayer.list.length > 1 && MediaPlayer.fullScreen ) {
							if ( MediaPlayer.PlayList.playIndex + 1 < MediaPlayer.list.length ) {
								MediaPlayer.PlayList.playIndex++;
								(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
									item.self.Marked(item, false);
								});
								MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
								MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true);
								// if ( MediaPlayer.parent === MediaBrowser ) {
								// 	MediaBrowser.FileList.Reposition(MediaPlayer.obj);
								// }
							}
						}
					}
					break;
			}
			break;
		case 6:
			MediaPlayer.handle.querySelector('#dualmono_indicator').style.display = 'block';
			clearTimeout(MediaPlayer.timer.mono);
			MediaPlayer.timer.mono = window.setTimeout(function () {
				MediaPlayer.handle.querySelector('#dualmono_indicator').style.display = 'none';
			}, 3000);
			break;
		case 7:
			switch ( MediaPlayer.type ) {
				case MEDIA_TYPE_IMAGE:
					clearTimeout(MediaPlayer.timer.slideShow);
					MediaPlayer.timer.slideShow = null;
					if ( MediaPlayer.slideOn > 0 ) {
						MediaPlayer.timer.slideShow = setTimeout(function () {
							if ( MediaPlayer.list.length > 1 && MediaPlayer.fullScreen ) {
								if ( MediaPlayer.PlayList.playIndex + 1 < MediaPlayer.list.length ) {
									MediaPlayer.PlayList.playIndex++;
									(MediaPlayer.PlayList.states.marked || []).forEach(function ( item ) {
										item.self.Marked(item, false);
									});
									MediaPlayer.PlayList.Marked(MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex], true);
									MediaPlayer.prepare(MediaPlayer.list[MediaPlayer.PlayList.handle.children[MediaPlayer.PlayList.playIndex].data.index], true, true);
									// if ( MediaPlayer.parent === MediaBrowser ) {
									// 	MediaBrowser.FileList.Reposition(MediaPlayer.obj);
									// }
								}
							}
						}, MediaPlayer.slideOn * 1000);
					}
					break;

				default:
					try {
						info = gSTB.GetVideoInfo();
						if ( info ) {
							info = info.replace(/,/g, '","').replace(/:/g, '":"').replace('{', '{"').replace('}', '"}').replace(/""/g, '"');
							info = JSON.parse(info);
						}
					} catch ( e ) {
						echo(e, 'gSTB.GetVideoInfo catch');
					}

					if ( parseInt(info.pictureWidth, 10) > 0 && parseInt(info.pictureHeight, 0) > 0 ) {
						MediaPlayer.isVideo = true;
						MediaPlayer.domSlideContainer.style.display = 'none';
					} else {
						MediaPlayer.isVideo = false;
					}
					break;
			}
			break;
		case 9:
			MediaPlayer.initSubtitleMenu();
			MediaPlayer.initTeletextMenu();
			break;
		case 32:
			// reset video mode and player resolution data
			stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'video.mode.reload', '');
			if ( environment.hdmi_event_delay !== '0' ) {
				clearTimeout(MediaPlayer.standByTimer);
				if ( gSTB.GetStandByStatus() ) {
					stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'portal.standbyMode', 'hdmiEvent');
				}
			}
			break;
		case 33:
			if ( environment.hdmi_event_delay !== '0' ) {
				clearTimeout(MediaPlayer.standByTimer);
				MediaPlayer.standByTimer = setTimeout(function () {
					if ( !gSTB.GetStandByStatus() ) {
						stbWebWindow.messageSend(getWindowIdByName(WINDOWS.PORTAL), 'portal.standbyMode', 'hdmiEvent');
					}
				}, environment.hdmi_event_delay * 1000);
			}
			break;
		case 36:
			if ( !info ) {
				return;
			}
			info = JSON.parse(info);
			echo(info, 'info');
			if ( !MediaPlayer.ts_inProgress || info.ident !== 'TimeShift' ) {
				return;
			}
			switch ( info.event_code ) {
				case 1:
					break;
				case 2:
					break;
				case 3:
					gSTB.SetPosTime(12);
					gSTB.Continue();
					break;
				case 4:
					if ( MediaPlayer.ts_endType === 2 ) {
						gSTB.SetPosTime(gSTB.GetPosTime());
						new CModalHint(currCPage, _('Buffer is full'), 3000);
					}
					break;
				case 5:
					MediaPlayer.showInfo(true);
					break;
				case 6:
					if ( !gSTB.IsPlaying() ) {
						gSTB.Continue();
					}
					switch ( parseInt(info.event_data, 10) ) {
						case 1:
							if ( IPTVChannels.TVList.activeItem ) {
								IPTVChannels.TVList.activeItem.querySelector('.timeshift').className = 'timeshift tsOn';
							}
							clearTimeout(MediaPlayer.timer.ts_timer);
							MediaPlayer.ts_inProgress = false;
							MediaPlayer.sol = MediaPlayer.oldSol;
							MediaPlayer.obj.url = MediaPlayer.oldURL;
							MediaPlayer.type = MediaPlayer.obj.type;
							MediaPlayer.init[MediaPlayer.type]();
							if ( environment.ts_icon ) {
								MediaPlayer.domTSIndicator.style.display = 'none';
							}
							new CModalConfirm(currCPage, _('Writing error'), _('Check storage device.<br />Disable TimeShift?'),
								_('No'), function () {},
								_('Yes'), function () {
									MediaPlayer.tsOnOff(false);
								});
							break;
						case 2:
							MediaPlayer.tsExitCheck('error');
							break;
					}
					break;
				case 7:
					if ( MediaPlayer.ts_inProgress && MediaPlayer.ts_endType === 2 ) {
						gSTB.Pause();

						document.getElementById('ts_playbutt').style.background = 'url(img/' + win.width + '/audioplay_pause.png) no-repeat';
						var del = ts_sol[win.width];
						var wid = del[0] - del[1];
						document.getElementById('ts_curtime').innerHTML = '-' + secondsToTimeString(0);
						document.getElementById('ts_progress').style.width = '100%';
						document.getElementById('ts_runner').style.marginLeft = wid + 'px';
						document.getElementById('ts_setpos_form').style.display = 'block';
						clearInterval(ts_runInterval);
					}
					break;
			}
			break;
		case 40:
			info = JSON.parse(info);
			echo(info, 'Scanning DVB Channel in progress');
			if ( info.state && info.state === 'finished' ) {
				DVBChannels.scanningInProgress = false;
				DVBChannels.domScanInProgress.style.display = 'none';
				if ( DVBChannels.loadChanels(true) && (currCPage === DVBChannels || MediaPlayer.parent === DVBChannels) ) {
					DVBChannels.Reset();
				}
			} else {
				DVBChannels.domPercentScan.innerHTML = info.progress + '%';
				DVBChannels.domTitleFreqScanText.innerHTML = info.frequency;
			}
			break;
		case 41:
			try {
				info = JSON.parse(info);
			} catch ( error ) {
				echo(error, 'Scanning DVB Channel found');
				break;
			}
			echo(info, 'Scanning DVB Channel found');
			DVBChannels.scanTotalFound++;
			DVBChannels.domTitleTotalScanText.innerHTML = DVBChannels.scanTotalFound;
//			try {
//				var data = JSON.parse(dvbManager.GetChannelInfo(info.id));
//			} catch ( error ) {
//				echo(error, 'dvbManager.GetChannelInfo');
//				break;
//			}
			DVBChannels.domTitleLastScanText.innerHTML = info.name;
			break;
		case 42:
			echo(info,'info 42');
			switch (currCPage) {
				case DVBEpg:
					DVBEpg.EPGList.CheckEPGData();
					if ( DVBEpg.previous === MediaPlayer ) {
						if ( typeof MediaPlayer.parent.initEPGNow === 'function' ) {
							MediaPlayer.parent.initEPGNow();
						}
					} else {
						if ( typeof DVBEpg.previous.initEPGNow === 'function' ) {
							DVBEpg.previous.initEPGNow();
						}
					}
					break;
				case MediaPlayer:
					if ( typeof MediaPlayer.parent.initEPGNow === 'function' ) {
						MediaPlayer.parent.initEPGNow();
					}
					break;
				case DVBChannels:
					DVBChannels.initEPGNow();
					break;
				case IPTVChannels:
					IPTVChannels.initEPGNow();
					break;
				default:
					if ( currCPage.parent === DVBChannels  || currCPage.previous === DVBChannels  ) {
						DVBChannels.initEPGNow();
					}
					if ( currCPage.parent === IPTVChannels || currCPage.previous === IPTVChannels ) {
						IPTVChannels.initEPGNow();
					}
					break;
			}
			break;
		case 43:
			echo(info,'info 43');
			DVBChannels.ModalMenu.Menu.gdvbAntena.slist.Marked(DVBChannels.ModalMenu.Menu.gdvbAntena.ion, false);
			DVBChannels.ModalMenu.Menu.gdvbAntena.slist.Marked(DVBChannels.ModalMenu.Menu.gdvbAntena.ioff, true);
			if ( currCPage && MediaPlayer.dvbPowerManualOn ) {
				new CModalHint(currCPage, _('Detected passive antenna type'), 2000);
			}
			MediaPlayer.dvbPowerManualOn = false;
			break;
	}
};

MediaPlayer.initAspect = function () {
	var i;

	if ( environment.aspect || environment.aspect === 0 ) {
		for ( i = 0; i < this.aspects.length; i++ ) {
			if ( this.aspects[i].mode === environment.aspect ) {
				this.activeAspect = i;
				break;
			}
		}
		gSTB.SetAspect(this.aspects[this.activeAspect].mode);
	}
};

MediaPlayer.aspect = function () {
	clearTimeout(this.timer.hideAspect);
	this.activeAspect++;
	if ( this.activeAspect >= this.aspects.length ) {
		this.activeAspect = 0;
	}
	gSTB.SetAspect(this.aspects[this.activeAspect].mode);
	this.domAspectText.innerHTML = this.aspects[this.activeAspect].text;
	document.getElementById('toolsPan').style.display = 'block';
	this.domAspectBlock.style.display = 'block';
	this.timer.hideAspect = (function ( block ) {
		return setTimeout(function () {
			block.style.display = 'none';
		}, 2000);
	})(this.domAspectBlock);
};


MediaPlayer.tsOnOff = function ( flag ) {
	if ( this.ts_on === flag ) {
		return;
	}
	this.ts_on = flag;
	if ( this.ts_on ) {
		this.ModalMenu.Menu.gts.slist.Marked(this.ModalMenu.Menu.gts.ion, true);
		this.ModalMenu.Menu.gts.slist.Marked(this.ModalMenu.Menu.gts.ioff, false);
	} else if ( this.obj ) {
		this.sol = this.oldSol;
		this.obj.url = this.oldURL;
		this.type = this.obj.type;
		this.ModalMenu.Menu.gts.slist.Marked(this.ModalMenu.Menu.gts.ion, false);
		this.ModalMenu.Menu.gts.slist.Marked(this.ModalMenu.Menu.gts.ioff, true);
		this.init[this.type]();
	}
	this.play();
};


MediaPlayer.ts_start = function ( start, stop ) {
	if ( !start ) {
		start = 0;
	}
	clearTimeout(this.timer.ts_timer);
	this.timer.ts_timer = setTimeout(function () {
		var done = timeShift.EnterTimeShift();
		if ( done === 0 ) {
			if ( MEDIA_TYPE_STREAM_TS !== MediaPlayer.type ) {
				MediaPlayer.type = MEDIA_TYPE_STREAM_TS;
				MediaPlayer.init[MEDIA_TYPE_STREAM_TS]();
				MediaPlayer.modalInit[MEDIA_TYPE_STREAM_TS]();
			}
			MediaPlayer.ts_inProgress = true;
			if ( environment.ts_icon ) {
				MediaPlayer.domTSIndicator.style.display = 'block';
			}
			IPTVChannels.TVList.activeItem.querySelector('.timeshift').className = 'timeshift tsActive';
			if ( stop ) {
				gSTB.Pause();
				MediaPlayer.showInfo(true);
			}
			MediaPlayer.runner.start();
		} else {
			MediaPlayer.tsExit('stop');
			MediaPlayer.ts_inProgress = false;
			new CModalAlert(currCPage, _('Error'), _('Start TimeShift error'), _('Close'));
		}
	}, start * 1000);
};


MediaPlayer.checkUsb = function ( usb ) {
	var usbs = JSON.parse(gSTB.GetStorageInfo('{}')).result || [];
	for ( var i = 0; i < usbs.length; i++ ) {
		if ( usb === usbs[i].mountPath && usbs[i].isReadOnly === 0 ) {
			return true;
		}
	}
	return false;
};


MediaPlayer.tsExitCheck = function ( type, item ) {
	gSTB.Pause();
	MediaPlayer.runner.stop();
	if ( IPTVChannels.TVList.activeItem ) {
		IPTVChannels.TVList.activeItem.querySelector('.timeshift').className = 'timeshift tsOn';
	}
	if ( environment.ts_icon ) {
		MediaPlayer.domTSIndicator.style.display = 'none';
	}
	clearTimeout(MediaPlayer.timer.ts_timer);
	this.ts_inProgress = false;
	switch ( environment.ts_exitType ) {
		case 1:
			MediaPlayer.tsExit(type, item);
			return false;
		case 2:
			MediaPlayer.tsSave(type, item);
			return true;
		case 3:
			if ( type === 'standByHDMI' ) {
				MediaPlayer.tsExit(type, item);
				return true;
			}
			new CModalConfirm(currCPage, _('Request to save'), _('Save TimeShift buffer?'),
				_('No'), function () {
					MediaPlayer.tsExit(type, item);
				},
				_('Yes'), function () {
					MediaPlayer.tsSave(type, item);
				}
			);
			return true;
	}
	return false;
};


MediaPlayer.tsSave = function ( type, item ) {
	var date = new Date();
	var day = date.getDate();
	var mon = date.getMonth() + 1;
	var year = date.getFullYear();
	var min = date.getMinutes();
	var hour = date.getHours();
	var sec = date.getSeconds();
	var name = this.obj.name.replace(/\//g, '-').replace(/\>/g, '-').replace(/</g, '-').replace(/\|/g, '-').replace(/\?/g, '-').replace(/\*/g, '-').replace(/\\/g, '-').replace(/\:/g, '-');
	var cor = timeShift.ExitTimeShiftAndSave(
		environment.ts_path + '/records/' + name + '/' + year + '-' + (mon > 9 ? mon : '0' + mon) + '-' + (day > 9 ? day : '0' + day) + '/',
		(hour > 9 ? hour : '0' + hour) + '-' + (min > 9 ? min : '0' + min) + '-' + (sec > 9 ? sec : '0' + sec)
	);
	if ( cor !== 0 ) {
		setTimeout(function () {
			new CModalAlert(type === 'exit' ? IPTVChannels : currCPage, _('Error'), _('Saving error'), _('Close'), function () {
				if ( type === 'exit' ) {
					MediaPlayer.tsExit(type, item);
				}
			});
		}, 200);
	} else {
		setTimeout(function () {
			new CModalHint(type === 'exit' ? IPTVChannels : currCPage, _('Save to:') + ' Records/' + name + '/' + year + '-' + (mon > 9 ? mon : '0' + mon) + '-' + (day > 9 ? day : '0' + day) + '/' + (hour > 9 ? hour : '0' + hour) + ':' + (min > 9 ? min : '0' + min) + ':' + (sec > 9 ? sec : '0' + sec) + '.tspinf', 3100);
		}, 200);
	}
	switch ( type ) {
		case 'error':
			if ( environment.mount_media_ro === 'true' ) {
				new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
			} else {
				new CModalConfirm(currCPage, _('Error'), _('No storage device selected as the \"File location\" in TimeShift settings. Disable TimeShift?'),
					_('No'), function () {},
					_('Yes'), function () {
						MediaPlayer.tsOnOff(false);
					});
			}
			break;
		case 'stop':
			MediaPlayer.obj.url = MediaPlayer.oldURL;
			MediaPlayer.sol = MediaPlayer.oldSol;
			MediaPlayer.type = MediaPlayer.obj.type;
			MediaPlayer.init[MediaPlayer.type]();
			MediaPlayer.play();
			break;
		case 'exit':
			if ( cor === 0 ) {
				MediaPlayer.exit();
			}
			break;
		case 'focus':
			setTimeout(function () {
				IPTVChannels.TVList.Focused(item, true, true);
			}, 5);
			break;
		case 'standByHDMI':
		case 'standBy':
			gSTB.StandBy(true);
			gSTB.ExecAction('front_panel led-on');
			break;
		case 'upnpStart':
			stbUPnPRenderer.onPlay();
			break;
	}
};


MediaPlayer.tsExit = function ( type, item ) {
	timeShift.ExitTimeShift();
	switch ( type ) {
		case 'error':
			if ( environment.mount_media_ro === 'true' ) {
				new CModalAlert(currCPage, _('Warning!'), _('"Storage read only access mode" is enabled in System Settings'), _('Close'));
			} else {
				new CModalConfirm(currCPage, _('Error'), _('No storage device selected as the \"File location\" in TimeShift settings. Disable TimeShift?'),
					_('No'), function () {},
					_('Yes'), function () {
						MediaPlayer.tsOnOff(false);
					});
			}
			break;
		case 'stop':
			MediaPlayer.obj.url = MediaPlayer.oldURL;
			MediaPlayer.sol = MediaPlayer.oldSol;
			MediaPlayer.type = MediaPlayer.obj.type;
			MediaPlayer.init[MediaPlayer.type]();
			MediaPlayer.play();
			break;
		case 'exit':
			setTimeout(function () {
				MediaPlayer.end();
				if ( currCPage === MediaPlayer ) {
					MediaPlayer.exit();
				}
			}, 5);
			break;
		case 'focus':
			setTimeout(function () {
				IPTVChannels.TVList.Focused(item, true, true);
			}, 5);
			break;
		case 'standByHDMI':
		case 'standBy':
			gSTB.StandBy(true);
			gSTB.ExecAction('front_panel led-on');
			break;
		case 'upnpStart':
			stbUPnPRenderer.onPlay();
			break;
	}
};


/**
 * Stop player.
 *
 * @param {boolean} silent don't call all subscribers
 * @param {String} type TS exit type
 *
 * @return {boolean} ?
 */
MediaPlayer.end = function ( silent, type ) {

	echo(this.obj, 'end');
	if ( !this.obj ) {
		return true;
	}
	if ( UPnPRenderer.state ) {
		UPnPRendererClear();
	}
	clearTimeout(this.timer.mono);
	this.handle.querySelector('#dualmono_indicator').style.display = 'none';
	this.startingPlay = false;
	echo('MediaPlayer.end');
	clearTimeout(MediaPlayer.errorTimer);
	MediaPlayer.countError = 0;
	var self = this;
	if ( this.ts_inProgress ) {
		if ( this.tsExitCheck(type ? type : 'exit') ) {
			return false;
		}
	}
	if ( !silent ) {
		this.subscribers[this.EVENT_STOP].forEach(function ( subscriber ) {
			subscriber.subscribeEvents[self.EVENT_STOP].call(subscriber);
		});
	}

	if ( this.askedWindow !== null ) {
		stbWebWindow.messageSend(this.askedWindow, 'player.end', '');
		this.askedWindow = null;
	}

	this.obj = null;
	this.type = null;
	this.runner.stop();
	var i;
	for ( i in this.timer ) {
		if ( this.timer.hasOwnProperty(i) ) {
			clearTimeout(this.timer[i]);
		}
	}
	for ( i in this.interval ) {
		if ( this.interval.hasOwnProperty(i) ) {
			clearInterval(this.interval[i]);
		}
	}
	document.getElementById('toolsPan').style.display = 'none';
	this.domAspectBlock.style.display = 'none';
	if ( this.ModalMenu.isVisible ) {
		this.ModalMenu.Show(false, false);
	}
	gSTB.Stop();
	echo('gSTB.Stop()');
//	gSTB.SetMode(0);
	this.subtitlesData = null;
	this.subtitlesEncoding = null;
	this.subList = [];
	this.playNow = false;
	return true;
};


MediaPlayer.exit = function ( type ) {
	echo('MediaPlayer.exit');
	var self = this;
	if ( this.subCModal ) {
		this.subCModal.Show(false);
	}
	this.handle.querySelector('#cright').style.display = 'none';
	this.playListShow = false;
	this.handle.querySelector('#playerHideplist').innerHTML = _('Show<br />playlist');
	this.domPlayerList.style.visibility = 'hidden';
	if ( this.end(false, type) ) {
		if ( environment.ts_icon ) {
			this.domTSIndicator.style.display = 'none';
		}
		// call all subscribers hooks
		this.subscribers[this.EVENT_EXIT].forEach(function ( subscriber ) {
			subscriber.subscribeEvents[self.EVENT_EXIT].call(subscriber);
		});
		if ( currCPage === this || currCPage.parent === this ) {
			this.Show(false);
		}

		return true;
	}
	return false;
};


/**
 * set coordinates from preview mode
 * @param {number} x
 * @param {number} y
 * @param {number} a
 * @param {number} b
 */
MediaPlayer.setCoord = function ( x, y, a, b ) {
	if ( x ) {
		this.coord.x = x;
	}
	if ( y ) {
		this.coord.y = y;
	}
	if ( a ) {
		this.coord.a = a;
	}
	if ( b ) {
		this.coord.b = b;
	}
};


/**
 * Chande screen mode and set Viewport
 * @param {boolean} fullScreen
 */
MediaPlayer.changeScreenMode = function ( fullScreen ) {
	echo(this.fullScreen + '/' + fullScreen, 'MediaPlayer.changeScreenMode (fullScreen old/new)');

	if ( fullScreen === true || fullScreen === false ) {
		if ( this.fullScreen === fullScreen ) {
			return;
		}
		this.fullScreen = fullScreen;
	} else {
		this.fullScreen = !this.fullScreen;
	}
	if ( this.fullScreen ) {
		gSTB.SetPIG(1, 0, 0, 0);
	} else {
		if ( this.coord.a && this.coord.b ) {
			echo('SET VIEW PORT TO WINDOW');
			gSTB.SetViewport(this.coord.a, this.coord.b, this.coord.x, this.coord.y);
		}
	}
};

MediaPlayer.hlsInfo = function () {
	var data = JSON.parse(gSTB.GetHLSInfo()),
		text = '';

	echo(data);

	if ( data && data.variants && data.variants.length ) {
		data.variants[data.currentVariant] = '<div style="color:red">' + data.variants[data.currentVariant] + '</div>';
		text = data.variants.join(', ');
	}

	hlsInfo.innerHTML = 'Bitrate: ' + (text || 'n/a');
};

MediaPlayer.showHlsInfo = function () {
	if ( configuration.maySecureM3u ) {
		if ( this.showHls ) {
			this.handle.querySelector('#cright_hls').style.display = 'none';
			hlsInfo.innerHTML = 'Bitrate: n/a';
			clearInterval(this.timer.hlsInfo);
		} else {
			MediaPlayer.hlsInfo();
			this.handle.querySelector('#cright_hls').style.display = 'block';
			this.timer.hlsInfo = setInterval(MediaPlayer.hlsInfo, 3000);
		}
		this.showHls = !this.showHls;
	}
};

MediaPlayer.showInfo = function ( show, hidetime, showHeader ) {
	clearTimeout(this.timer.showInfo);
	if ( show === false || show === true ) {
		if ( show === this.infoFlag ) {
			if ( hidetime ) {
				this.timer.showInfo = setTimeout(function () {
					MediaPlayer.showInfo(!MediaPlayer.infoFlag);
				}, hidetime);
			}
			return;
		}
		this.infoFlag = !show;
	}
	if ( this.infoFlag ) {
		this.domPlayerHeader.style.visibility = 'hidden';
		this.domPlayerList.style.visibility = 'hidden';
		this.domPlayerFooter.style.visibility = 'hidden';
		if ( this.type === MEDIA_TYPE_AUDIO ) {
			this.domSlideContainer.style.display = 'none';
		}
	} else {
		if ( showHeader !== false ) {
			this.domPlayerHeader.style.visibility = 'visible';
			if ( this.playListShow ) {
				this.domPlayerList.style.visibility = 'visible';
				this.PlayList.Refresh();
			}
			if ( this.type === MEDIA_TYPE_AUDIO ) {
				this.domSlideContainer.style.display = 'block';
			}
		} else {
			this.domPlayerHeader.style.visibility = 'hidden';
		}
		this.domPlayerFooter.style.visibility = 'visible';
	}
	this.infoFlag = !this.infoFlag;
	if ( hidetime ) {
		this.timer.showInfo = setTimeout(function () {
			MediaPlayer.showInfo(!MediaPlayer.infoFlag);
		}, hidetime);
	}
	return false;
};


MediaPlayer.parseTime = function ( a ) {
	var h, m, s;
	if ( a >= 0 ) {
		h = Math.floor(a / 3600);
		m = Math.floor((a - h * 3600) / 60);
		s = a - h * 3600 - m * 60;
		if ( h < 10 ) {
			h = '0' + h;
		}
		if ( s < 10 ) {
			s = '0' + s;
		}
		if ( m < 10 ) {
			m = '0' + m;
		}
	} else {
		a = Math.abs(a);
		h = Math.floor(a / 3600);
		m = Math.floor((a - h * 3600) / 60);
		s = a - h * 3600 - m * 60;
		if ( h < 10 ) {
			h = '0' + h;
		}
		if ( s < 10 ) {
			s = '0' + s;
		}
		if ( m < 10 ) {
			m = '0' + m;
		}
		h = '-' + h;
	}
	return {hour: h, min: m, sec: s};
};


MediaPlayer.splitTime = function ( a ) {
	a = parseInt(a, 10);
	var s = a % 100;
	var m = (a % 10000 - s) / 100;
	var h = Math.floor(a / 10000);
	if ( s > 59 ) {
		s = 59;
	}
	if ( m > 59 ) {
		m = 59;
	}
	return s + m * 60 + h * 3600;
};


MediaPlayer.runner = {
	id: {},
	run: false,
	start: function () {
		var px, curTime, persent, buf;
		if ( this.run ) {
			return;
		}
		MediaPlayer.curTime = gSTB.GetPosTime();
		if ( MediaPlayer.type === MEDIA_TYPE_STREAM_TS ) {
			MediaPlayer.totalTime = gSTB.GetMediaLen();
			if ( MediaPlayer.totalTime > environment.ts_time ) {
				MediaPlayer.totalTime = environment.ts_time;
			}
			if ( MediaPlayer.curTime > MediaPlayer.totalTime ) {
				MediaPlayer.curTime = MediaPlayer.totalTime;
			}
			if ( MediaPlayer.curTime < 0 ) {
				MediaPlayer.curTime = 0;
			}
			px = Math.round(MediaPlayer.curTime / environment.ts_time * MediaPlayer.progress[WINDOW_HEIGHT]);
			buf = Math.round(MediaPlayer.totalTime / environment.ts_time * MediaPlayer.progress[WINDOW_HEIGHT]);
			MediaPlayer.domPlayerBufferBar.style.width = buf + 'px';
			curTime = MediaPlayer.parseTime(MediaPlayer.totalTime - MediaPlayer.curTime);
			MediaPlayer.domPlayerCurrentTime.innerHTML = '-' + curTime.hour + ':' + curTime.min + ':' + curTime.sec;
		} else {
			if ( MediaPlayer.curTime > MediaPlayer.totalTime ) {
				MediaPlayer.curTime = MediaPlayer.totalTime;
			}
			if ( MediaPlayer.curTime < 0 ) {
				MediaPlayer.curTime = 0;
			}
			px = Math.round(MediaPlayer.curTime / MediaPlayer.totalTime * MediaPlayer.progress[WINDOW_HEIGHT]);
			curTime = MediaPlayer.parseTime(MediaPlayer.curTime);
			persent = Math.round(MediaPlayer.curTime / MediaPlayer.totalTime * 100);
			// call all subscribers hooks
			MediaPlayer.subscribers[MediaPlayer.EVENT_PROGRESS].forEach(function ( subscriber ) {
				subscriber.subscribeEvents[MediaPlayer.EVENT_PROGRESS].call(subscriber, persent);
			});
			MediaPlayer.domPlayerCurrentTime.innerHTML = curTime.hour + ':' + curTime.min + ':' + curTime.sec;
			if ( MediaPlayer.type === MEDIA_TYPE_CUE_ITEM ) {
				MediaPlayer.activeCUE();
			}
			if ( MediaPlayer.type === MEDIA_TYPE_ISO ) {
				MediaPlayer.activeDVD();
			}
		}
		MediaPlayer.domPlayerProgressBar.style.width = px + 'px';
		this.id = window.setInterval(function () {
			MediaPlayer.curTime = gSTB.GetPosTime();
			if ( MediaPlayer.type === MEDIA_TYPE_STREAM_TS ) {
				MediaPlayer.totalTime = gSTB.GetMediaLen();
				if ( MediaPlayer.totalTime > environment.ts_time ) {
					MediaPlayer.totalTime = environment.ts_time;
				}
				if ( MediaPlayer.curTime > MediaPlayer.totalTime ) {
					MediaPlayer.curTime = MediaPlayer.totalTime - 20;
				}
				echo('MediaPlayer.curTime : ' + MediaPlayer.curTime + ' MediaPlayer.totalTime : ' + MediaPlayer.totalTime);
				px = Math.round(MediaPlayer.curTime / environment.ts_time * MediaPlayer.progress[WINDOW_HEIGHT]);
				buf = Math.round(MediaPlayer.totalTime / environment.ts_time * MediaPlayer.progress[WINDOW_HEIGHT]);
				MediaPlayer.domPlayerBufferBar.style.width = buf + 'px';
				curTime = MediaPlayer.parseTime(MediaPlayer.totalTime - MediaPlayer.curTime);
				MediaPlayer.domPlayerCurrentTime.innerHTML = '-' + curTime.hour + ':' + curTime.min + ':' + curTime.sec;
			} else {
				if ( MediaPlayer.curTime > MediaPlayer.totalTime ) {
					MediaPlayer.curTime = MediaPlayer.totalTime;
				}
				if ( MediaPlayer.curTime < 0 ) {
					MediaPlayer.curTime = 0;
				}
				persent = Math.round(MediaPlayer.curTime / MediaPlayer.totalTime * 100);
				// call all subscribers hooks
				MediaPlayer.subscribers[MediaPlayer.EVENT_PROGRESS].forEach(function ( subscriber ) {
					subscriber.subscribeEvents[MediaPlayer.EVENT_PROGRESS].call(subscriber, persent);
				});
				px = Math.round(MediaPlayer.curTime / MediaPlayer.totalTime * MediaPlayer.progress[WINDOW_HEIGHT]);
				curTime = MediaPlayer.parseTime(MediaPlayer.curTime);
				MediaPlayer.domPlayerCurrentTime.innerHTML = curTime.hour + ':' + curTime.min + ':' + curTime.sec;
				if ( MediaPlayer.type === MEDIA_TYPE_CUE_ITEM ) {
					MediaPlayer.activeCUE();
				}
				if ( MediaPlayer.type === MEDIA_TYPE_ISO ) {
					MediaPlayer.activeDVD();
				}
			}
			MediaPlayer.domPlayerProgressBar.style.width = px + 'px';
		}, 1000);
		this.run = true;
	},
	stop: function () {
		if ( this.run ) {
			this.run = false;
			clearInterval(this.id);
		}
	}
};


MediaPlayer.activeCUE = function () {
	if ( this.PlayList.playIndex + 1 < this.list.length ) {
		if ( this.curTime >= this.list[this.PlayList.playIndex + 1].time ) {
			this.PlayList.playIndex++;
			(this.PlayList.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			this.PlayList.Marked(this.PlayList.handle.children[this.PlayList.playIndex], true);
			this.obj = this.list[this.PlayList.activeItem.data.index];
			this.domPlayerTitle.innerHTML = this.obj.name;
		}
	}
};


MediaPlayer.activeDVD = function () {
	if ( this.PlayList.playIndex + 1 < this.dataDVD.titles[this.PlayList.parentIndex].chapters.length ) {
		if ( this.curTime >= this.dataDVD.titles[this.PlayList.parentIndex].chapters[this.PlayList.playIndex + 1].startTime / 1000 ) {
			this.PlayList.playIndex++;
			(this.PlayList.states.marked || []).forEach(function ( item ) {
				item.self.Marked(item, false);
			});
			this.PlayList.Marked(this.PlayList.handle.children[this.dataDVD.titles[this.PlayList.parentIndex].chapters[this.PlayList.playIndex].chN], true);
		}
	}
};


/**
 * Clears/inits all subscribers
 * @constructor
 */
MediaPlayer.SubscribersReset = function () {
	this.subscribers[this.EVENT_START] = [];
	this.subscribers[this.EVENT_STOP] = [];
	this.subscribers[this.EVENT_PAUSE] = [];
	this.subscribers[this.EVENT_PROGRESS] = [];
	this.subscribers[this.EVENT_ERROR] = [];
	this.subscribers[this.EVENT_OK] = [];
	this.subscribers[this.EVENT_EXIT] = [];
};


/**
 * Subscribe to player events
 * @param {CBase|CPage|Object} subscriber
 * @param {number} eventType event id (see MediaPlayer.EVENT_START and so on)
 */
MediaPlayer.Subscribe = function ( subscriber, eventType ) {
	// valid subscriber and has associated method
	if ( subscriber.subscribeEvents && typeof subscriber.subscribeEvents[eventType] === 'function' ) {
		// doesn't already have it
		if ( this.subscribers[eventType].indexOf(subscriber) === -1 ) {
			// subscribe
			this.subscribers[eventType].push(subscriber);
		}
	}
};


/**
 * Unsubscribe from player events
 * @param {CBase|CPage|Object} subscriber
 * @param {number} eventType event id (see MediaPlayer.EVENT_START and so on)
 */
MediaPlayer.Unsubscribe = function ( subscriber, eventType ) {
	// find
	var index = this.subscribers[eventType].indexOf(subscriber);
	// and remove
	if ( index !== -1 ) {
		this.subscribers[eventType].splice(index, 1);
	}
};


MediaPlayer.setAudioMenu = function () {
	var audArr,
		types = [
			'',
			'mpeg2audio',
			'mp3',
			'DD',
			'AAC',
			'LinearPCM',
			'Ogg',
			'dts',
			'DD'
		];

	function timeout () {
		MediaPlayer.handle.querySelector('#cright').style.display = 'none';
	}

	try {
		//FIXME: shouldn't use a JSON.parse
		audArr = eval(gSTB.GetAudioPIDsEx());
	} catch ( e ) {
		audArr = [];
		echo(e);
	}
	echo(audArr, 'audArr');
	if ( this.audioPid ) {
		gSTB.SetAudioPID(this.audioPid);
	}
	var currAud = gSTB.GetAudioPID();
	this.ModalMenu.Menu.gaudio.slist.Clear();
	if ( audArr.length > 0 && audArr[0] && (audArr[0].pid || audArr[0].pid === 0 ) ) {
		for ( var i = 0; i < audArr.length; i++ ) {
			var lang_info = getLanguageNameByCode(audArr[i].lang);
			if ( !lang_info ) {
				lang_info = [];
//				lang_info[0] = _('unknown') + ' ("' + getIso639LangCode(audArr[i].lang) + '")';
				lang_info[0] = '';
				lang_info[1] = 'null';
			}
			if ( audArr[i].title ) {
				lang_info[0] = audArr[i].title;
			}
			var fl = currAud === audArr[i].pid;
			this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gaudio, lang_info[1],
				lang_info[0] !== '' ? (lang_info[0] + ( audArr[i].type ? ' (' + types[audArr[i].type] + ')' : '')) :
				_('unknown') + (audArr[i].type ? ' (' + types[audArr[i].type] + ')' : ''),
				{
					data: audArr[i].pid,
					marked: fl,
					type: audArr[i].type
			});
			if ( fl ) {
				clearTimeout(this.timer.audio);
				if ( lang_info[0] === '' ) {
					if ( audArr[i].type === 0 ) {
						continue;
					}
				}
				this.handle.querySelector('#audioType').src = PATH_IMG_PUBLIC + 'codec/' + audArr[i].type + '.png';
				this.handle.querySelector('#audioText').innerHTML = lang_info[0] !== '' ? lang_info[0] : types[audArr[i].type];
				this.handle.querySelector('#cright').style.display = 'block';
				this.timer.audio = setTimeout(timeout, MediaPlayer.TIME_HIDE_HINT);
			}
		}
	} else {
		this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gaudio, 'no', _('No'), {disabled: true});
	}
};


/**
 * Initialization of subtitle menu
 */
MediaPlayer.initSubtitleMenu = function () {
	var subArr, currSub, lang_info, marked, i;
	if ( this.subtitlesPid && this.subtitlesPid !== 'OFF' ) {
		gSTB.SetSubtitles(true);
		gSTB.SetSubtitlePID(this.subtitlesPid);
	}
	currSub = this.subtitlesPid && this.subtitlesPid !== 'OFF' ? this.subtitlesPid : gSTB.GetSubtitlePID();

	function timeout () {
		MediaPlayer.handle.querySelector('#cright_bottom_sub').style.display = 'none';
	}

	try {
		//FIXME: shouldn't use a JSON.parse
		subArr = eval(gSTB.GetSubtitlePIDs());
	} catch ( e ) {
		subArr = [];
		echo(e, 'subtitle parse error');
	}
	this.ModalMenu.Menu.gsubtitle.slist.Clear();
	gSTB.SetSubtitles(this.subtitles_on === true);
	echo(subArr, 'subArr');
	if ( subArr.length > 0 ) {
		this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsubtitle, 'OFF', _('Disabled'), {
			data: {type: 1, value: 'OFF'},
			marked: !this.subtitles_on,
			focused: !this.subtitles_on
		});
		for ( i = 0; i < subArr.length; i++ ) {
			if ( subArr[i].pid === 8192 ) {
				continue;
			}
			lang_info = getLanguageNameByCode(subArr[i].lang);
			if ( !lang_info ) {
				lang_info = [];
				lang_info[0] = _('unknown') + ' ("' + getIso639LangCode(subArr[i].lang) + '")';
				lang_info[1] = 'null';
			}
			marked = !this.extSubtitles && currSub === subArr[i].pid && this.subtitles_on === true;
			this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsubtitle, lang_info[1], lang_info[0], {
				data: {
					type: 2,
					value: subArr[i].pid,
					name: lang_info[0]
				}, marked: marked, focused: marked
			});
			if ( marked ) {
				clearTimeout(this.timer.sub);
				this.handle.querySelector('#subText').innerHTML = lang_info[0];
				this.handle.querySelector('#cright_bottom_sub').style.display = 'block';
				this.timer.sub = setTimeout(timeout, MediaPlayer.TIME_HIDE_HINT);
			}
		}
	} else {
		this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsubtitle, 'OFF', _('Disabled'), {
			data: {type: 1, value: 'OFF'},
			marked: true,
			focused: true
		});
	}

	echo('initSubtitleMenu');
	this.prepareSubList();

	if ( this.subList.length > 0 ) {
		this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsubtitle, 'ext', _('External subtitles:'), {disabled: true});
		var item = null;
		for ( i = 0; i < this.subList.length; i++ ) {
			item = this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gsubtitle, this.subList[i].url, this.subList[i].name, {
				data: {
					index: i,
					type: 3
				}, marked: this.subList[i].marked === true, focused: this.subList[i].marked === true
			});
			if ( this.subList[i].marked === true ) {
				this.openSubtitle(this.subList[i]);
			}
		}
	}
};


/**
 * Initialization of teletext menu
 */
MediaPlayer.initTeletextMenu = function () {
	var self = this,
		pids = gSTB.GetTeletextPIDs(),
		lang;

	try {
		pids = eval(pids);
	} catch ( e ) {
		pids = [];
	}

	function timeout () {
		MediaPlayer.handle.querySelector('#cright_bottom_tvtext').style.display = 'none';
	}
	clearTimeout(this.timer.teletext);
	this.ModalMenu.Menu.gTeletext.slist.Clear();
	if ( environment.teletext_on !== 'on' ) {
		self.ModalMenu.Menu.Switch(self.ModalMenu.Menu.Next({hidden:false}, true), true);
		MediaPlayer.ModalMenu.Menu.Hidden(self.ModalMenu.Menu.gTeletext, true);
	} else if ( pids.length > 0 ) {
		self.timer.teletext = setTimeout(timeout, MediaPlayer.TIME_HIDE_HINT);
		MediaPlayer.handle.querySelector('#cright_bottom_tvtext').style.display = 'block';
		pids.forEach(function ( item ) {
			if ( item.lang && item.lang.length > 0 ) {
				lang = item.lang[0];
			} else {
				lang = _('unknown');
			}
			self.ModalMenu.Menu.AddItem(self.ModalMenu.Menu.gTeletext, lang, lang, {data: {type: 2, value: item.pid}, marked: false, focused: true});
		})
	} else {
		this.ModalMenu.Menu.AddItem(this.ModalMenu.Menu.gTeletext, 'OFF', _('Disabled'), {data: {type: 1, value: 'OFF'}, marked: true, focused: true});
	}
	echo('initTeletextMenu');
};


MediaPlayer.setDVDInfo = function () {
	var temp = gSTB.GetMetadataInfo(),
		y = 1,
		chN = 0;

	this.PlayList.Reset();

	this.list = [];
	this.PlayList.parentIndex = 0;

	if ( !temp || temp === '{}' ) {
		echo('GetMetadataInfo has not data');
		return;
	}

	try {
		this.dataDVD = JSON.parse(temp);
	} catch ( e ) {
		this.dataDVD = {};
		echo(e);
	}


	if ( this.dataDVD.titles ) {
		for ( var i = 0; i < this.dataDVD.titles.length; i++ ) {
			if ( this.dataDVD.titles[i].Titleduration > 10000 ) {
				var cTitle = (i === this.dataDVD.infoCurtitle);
				if ( cTitle ) {
					this.PlayList.parentIndex = i;
				}
				this.list.push(this.dataDVD.titles[i]);
				this.PlayList.Add(_('Title') + ' ' + y, {disabled: true}, {stared: false});
				chN++;
				if ( this.dataDVD.titles[i].chapters ) {
					for ( var j = 0; j < this.dataDVD.titles[i].chapters.length; j++ ) {
						this.list.push(this.dataDVD.titles[i].chapters[j]);
						var time = this.parseTime(parseInt( (this.dataDVD.titles[i].chapters[j].startTime || 0) / 1000, 10));
						this.PlayList.Add(_('Chapter') + ' ' + (j + 1) + ' ' + time.hour + ':' + time.min + ':' + time.sec, {
							index: j,
							parentI: i,
							marked: j === 0 && cTitle,
							focused: j === 0 && cTitle,
							pos: this.dataDVD.titles[i].chapters[j].startTime || 0,
							disabled: false
						}, {stared: false});
						this.dataDVD.titles[i].chapters[j].chN = chN;
						chN++;
					}
				}
				y++;
			}
		}
	}
	this.PlayList.playIndex = 0;
};


MediaPlayer.onClick = function () {
	MediaPlayer.showInfo();
};

/**
 *
 * @param {boolean} hdmiEvent is it hdmi event
 * @returns {boolean}
 */
MediaPlayer.standByOn = function ( hdmiEvent ) {
	switch ( this.parent ) {
		case IPTVChannels:
			IPTVChannels.saveLastChannels();
			break;
		case DVBChannels:
			DVBChannels.saveLastChannels();
			break;
	}
	if ( this.playNow || this.startingPlay ) {
		this.inStandBy = true;
		this.runner.stop();
		var i;
		for ( i in this.timer ) {
			if ( this.timer.hasOwnProperty(i) ) {
				clearTimeout(this.timer[i]);
			}
		}
		for ( i in this.interval ) {
			if ( this.interval.hasOwnProperty(i) ) {
				clearInterval(this.interval[i]);
			}
		}
		document.getElementById('toolsPan').style.display = 'none';
		this.domAspectBlock.style.display = 'none';
		if ( this.ModalMenu.isVisible ) {
			this.ModalMenu.Show(false, false);
		}
		switch ( this.type ) {
			case MEDIA_TYPE_DVB:
			case MEDIA_TYPE_STREAM:
			case MEDIA_TYPE_IMAGE:
				gSTB.Stop();
				this.playNow = false;
				this.pos = 0;
				break;
			case MEDIA_TYPE_STREAM_TS:
				this.pos = 0;
				this.obj.sol = this.oldSol;
				this.obj.url = this.oldURL;
				this.type = this.obj.type;
				this.init[this.obj.type]();
				this.modalInit[this.obj.type]();
				this.playNow = false;
				if ( this.ts_inProgress ) {
					if ( this.tsExitCheck(hdmiEvent ? 'standByHDMI' : 'standBy') ) {
						return true;
					}
				}
				gSTB.Stop();
				break;
			default:
				if ( gSTB.GetPosTime() > 0 ) {
					this.pos = gSTB.GetPosTime();
				}
				if ( !this.playNow ) {
					if ( this.type === MEDIA_TYPE_IMAGE ) {
						clearTimeout(this.timer.slideShow);
						this.timer.slideShow = null;
					} else {
						return;
					}
				}
				clearTimeout(this.timer.showInfo);
				this.showInfo(true, 0, false);
				gSTB.Stop();
				this.runner.stop();
				break;
		}
		gSTB.ExecAction('front_panel led-on');
		gSTB.StandBy(true);
		return true;
	}
	return false;
};

MediaPlayer.standByOff = function ( manual ) {
	var lastTeletextParams;

	if ( this.inStandBy || manual ) {
		this.inStandBy = false;
		this.ModalMenu.Menu.gaudio.slist.Clear();
		this.ModalMenu.Menu.gsubtitle.slist.Clear();
//		if ( accessControl.state && accessControl.data.pages[this.parent.menuId] || accessControl.state && this.parent === ServiceMenu && accessControl.data.events.portalOpen ) {
//			accessControl.showLoginForm(
//				function () {
//					if ( MediaPlayer.playNow ) {
//						if ( MediaPlayer.subtitles_on ) {
//							if ( MediaPlayer.subtitlesData && MediaPlayer.subtitlesEncoding ) {
//								gSTB.SetSubtitlesEncoding(MediaPlayer.subtitlesEncoding);
//								gSTB.LoadExternalSubtitles(MediaPlayer.subtitlesData.url);
//								gSTB.SetSubtitles(true);
//							}
//						}
//						MediaPlayer.playNow = false;
//						gSTB.Play((MediaPlayer.sol ? MediaPlayer.sol + ' ' : 'auto ') + MediaPlayer.obj.url + ' position:' + MediaPlayer.pos);
//					} else {
//						MediaPlayer.play();
//					}
//				},
//				function () {
//					ServiceMenu.Show(true);
//				},
//				this.parent === ServiceMenu && accessControl.data.events.portalOpen
//			);
//			return true;
//		}
		if ( this.playNow || this.startingPlay ) {
			if ( this.subtitles_on ) {
				if ( this.subtitlesData && this.subtitlesEncoding ) {
					gSTB.SetSubtitlesEncoding(this.subtitlesEncoding);
					gSTB.LoadExternalSubtitles(this.subtitlesData.url);
					gSTB.SetSubtitles(true);
				}
			}
			this.playNow = false;
			this.startingPlay = true;
			if ( manual ) {
				this.pos = gSTB.GetPosTime();
			}
			gSTB.Play((this.sol ? this.sol + ' ' : 'auto ') + this.obj.url + ' position:' + this.pos);

			if ( MediaPlayer.EventHandler === MediaPlayer.ModalMenu.Menu.gTeletext.teletextHandler ) {
				// restoring teletext layer
				lastTeletextParams = MediaPlayer.ModalMenu.Menu.gTeletext.lastParams;
				if ( lastTeletextParams.charset ) {
					gSTB.ForceTtxCharset(lastTeletextParams.charset === 'auto' ? 0 : +lastTeletextParams.charset, lastTeletextParams.charset !== 'auto');
				}
				gSTB.SetTeletextPID(lastTeletextParams.pid);
				gSTB.TeletextTransparency(lastTeletextParams.opacity);
				gSTB.SetTeletextViewport(lastTeletextParams.viewport.width, lastTeletextParams.viewport.height, lastTeletextParams.viewport.left, lastTeletextParams.viewport.top);
				gSTB.TeletextShow(true);
				MediaPlayer.showInfo(false);
			}
		} else {
			if ( !manual ) {
				this.play();
			}
		}
		return true;
	}
	return false;
};
