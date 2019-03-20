/**
 * Modal windows
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

/**
 * Show dialog bow for a PVR record edit
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {Object} data current PVR record data
 * @param {string} label modal message box text
 * @param {string} text modal message box text
 * @class CModalBox
 * @constructor
 */
function CModalEditRecord ( parent, label, text, data ) {
	// parent constructor
	CModalBox.call(this, parent);
	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalEditRecord';

	var self = this,  // for limited scopes
		time = new Date(),
		min = time.getMinutes(),
		hour = time.getHours(),
		day = time.getDate(),
		month = time.getMonth() + 1,
		recLengthHours,
		recLengthMinutes;

	min = min < 10 ? '0' + min : min;
	hour = hour < 10 ? '0' + hour : hour;
	day = day < 10 ? '0' + day : day;
	month = month < 10 ? '0' + month : month;

	time = new Date(data.endTime * 1000);
	var min1 = time.getMinutes(),
		hour1 = time.getHours(),
		day1 = time.getDate(),
		month1 = time.getMonth() + 1,
		year1 = time.getFullYear();

	min1 = min1 < 10 ? '0' + min1 : min1;
	hour1 = hour1 < 10 ? '0' + hour1 : hour1;
	day1 = day1 < 10 ? '0' + day1 : day1;
	month1 = month1 < 10 ? '0' + month1 : month1;


	if ( data.duration > 0 ) {
		recLengthHours = Math.floor(data.duration / 3600);
		recLengthMinutes = Math.floor((data.duration - recLengthHours * 3600) / 60);
		if ( recLengthHours > 24 ) {
			recLengthHours = 23;
			recLengthMinutes = 59;
		}
		recLengthHours = recLengthHours > 9 ? recLengthHours : '0' + recLengthHours;
		recLengthMinutes = recLengthMinutes > 9 ? recLengthMinutes : '0' + recLengthMinutes;
	} else {
		recLengthHours = '00';
		recLengthMinutes = '00';
	}

	this.parseTime = function () {
		var tt = /^([0-9]+)$/;
		echo('parseTime : ' + this.value + ' | ' + tt.test(this.value));
		if ( tt.test(this.value) ) {
			if ( this.value > this.maxValue ) { this.value = this.maxValue; }
			if ( this.value.length === this.maxLength ) {
				setTimeout(function () {
					self.FocusRight();
				}, 50);
			}
		} else if ( this.value.length > 0 ) {
			this.value = this.value.substring(0, this.value.length - 2);
		}
		return false;
	};

	this.checkTime = function () {
		var h, m,
			hourE = self.endTimeHour.value,
			minE = self.endTimeMin.value,
			dayE = self.endTimeDay.value,
			monE = self.endTimeMonth.value - 1,
			yearE = self.endTimeYear.value,
			endTime = new Date(yearE, monE, dayE, hourE, minE),
			delta = (endTime.getTime() - data.startTime * 1000) / 1000;

		echo('task time (ms) end:' + endTime.getTime() + '+ start:' + data.startTime * 1000 );
		if ( delta > 0 ) {
			h = Math.floor(delta / 3600);
			m = Math.floor((delta - h * 3600) / 60);
			if ( h > 24 ) {
				h = 23;
				m = 59;
				self.checkEndTime();
			}
			self.timeHour.value = h > 9 ? h : '0' + h;
			self.timeMin.value = m > 9 ? m : '0' + m;
		} else {
			self.timeHour.value = '00';
			self.timeMin.value = '00';
		}
		return false;
	};

	this.checkEndTime = function () {
		var endTime = new Date(data.startTime * 1000 + (self.timeHour.value * 3600 + self.timeMin.value * 60) * 1000);
		min = endTime.getMinutes();
		min = min < 10 ? '0' + min : min;
		hour = endTime.getHours();
		hour = hour < 10 ? '0' + hour : hour;
		day = endTime.getDate();
		day = day < 10 ? '0' + day : day;
		month = endTime.getMonth() + 1;
		month = month < 10 ? '0' + month : month;
		self.endTimeHour.value = hour;
		self.endTimeMin.value = min;
		self.endTimeDay.value = day;
		self.endTimeMonth.value = month;
		self.endTimeYear.value = endTime.getFullYear();
	};

	var html = element('table', {className : 'main maxw'}, [
		element('tr', {}, [
			element('td', {className : 'name'}, _('End recording:')),
			element('td', {className : 'data'}, [
				element('div', {className : 'box'},
					[this.endTimeHour =
						element('input', {className : 'time', type : 'text', value : hour1, maxLength : 2, minValue : 0, maxValue : 23, oninput : this.parseTime, onchange : this.checkTime}),
						element('div', {className : 'colon'}, ':'),
						this.endTimeMin = element('input', {className : 'time', type : 'text', value : min1, maxLength : 2, minValue : 0, maxValue : 59, oninput : this.parseTime, onchange : this.checkTime})]),
				element('div', {className : 'box'},
					[this.endTimeDay =
						element('input', {className : 'time', type : 'text', value : day1, maxLength : 2, minValue : 1, maxValue : 31, oninput : this.parseTime, onchange : this.checkTime}),
						element('div', {className : 'colon'}, '.'),
						this.endTimeMonth = element('input', {className : 'time', type : 'text', value : month1, maxLength : 2, minValue : 1, maxValue : 12, oninput : this.parseTime, onchange : this.checkTime}),
						element('div', {className : 'colon'}, '.'),
						this.endTimeYear = element('input', {className : 'data_time', type : 'text', value : year1, maxLength : 4, minValue : 1, maxValue : 9999, oninput : this.parseTime, onchange : this.checkTime})])
			])
		]),
		element('tr', {}, [
			element('td', {className : 'name'}, _('Record length:')),
			element('td', {className : 'data'}, [
				element('div', {className : 'box'},
					[this.timeHour = element('input', {className : 'time', type : 'text', value : recLengthHours, maxLength : 2, minValue : 0, maxValue : 23, oninput : this.parseTime, onchange : this.checkEndTime}),
						element('div', {className : 'colon'}, ':'),
						this.timeMin = element('input', {className : 'time', type : 'text', value : recLengthMinutes, maxLength : 2, minValue : 0, maxValue : 59, oninput : this.parseTime, onchange : this.checkEndTime})])
			])
		])
	]);
	this.focusList = [
		[this.endTimeHour, this.endTimeMin, this.endTimeDay, this.endTimeMonth, this.endTimeYear],
		[this.timeHour, this.timeMin]
	];

	this.focusPos = 0;
	this.subFocusPos = 0;
	this.FocusNext = function ( event, manageVK ) {
		if ( this.focusList.length > 0 ) {
			// cycling the index
			if ( ++this.focusPos >= this.focusList.length ) {this.focusPos = 0;}
			// get the next html element in the list
			var el = this.focusList[this.focusPos][0];
			if ( manageVK !== false ) {gSTB.HideVirtualKeyboard();}
			// set focus
			el.focus();
			this.subFocusPos = 0;
			// skip looping select options elements
			if ( event && el.nodeName !== 'SELECT' ) {
				event.preventDefault();
				el.select();
			}
		}
	};

	this.FocusPrev = function ( event, manageVK ) {
		if ( this.focusList.length > 0 ) {
			// cycling the index
			if ( --this.focusPos < 0 ) {this.focusPos = this.focusList.length - 1;}
			// get the next html element in the list
			var el = this.focusList[this.focusPos][0];
			if ( manageVK !== false ) {gSTB.HideVirtualKeyboard();}
			// set focus
			el.focus();
			this.subFocusPos = 0;
			// skip looping select options elements
			if ( el.nodeName !== 'SELECT' ) {
				el.select();
				event.preventDefault();
			}
		}
	};

	this.FocusRight = function ( event ) {
		if ( this.focusList[this.focusPos].length > 1 ) {
			if ( ++this.subFocusPos >= this.focusList[this.focusPos].length ) {this.subFocusPos = 0;}
			var el = this.focusList[this.focusPos][this.subFocusPos];
			el.focus();
			if ( el.nodeName !== 'SELECT' ) {
				el.select();
				if ( event ) {event.preventDefault();}
			}
		}
	};

	this.FocusLeft = function ( event ) {
		if ( this.focusList[this.focusPos].length > 1 ) {
			if ( --this.subFocusPos < 0 ) {this.subFocusPos = this.focusList[this.focusPos].length - 1;}
			var el = this.focusList[this.focusPos][this.subFocusPos];
			el.focus();
			if ( el.nodeName !== 'SELECT' ) {
				el.select();
				if ( event ) {event.preventDefault();}
			}
		}
	};

	this.startPVR = function () {
		var endTime = new Date(self.endTimeYear.value, self.endTimeMonth.value - 1, self.endTimeDay.value, self.endTimeHour.value, self.endTimeMin.value);

		pvrManager.ChangeEndTime(data.id, String(endTime.getTime() / 1000));
		self.Show(false);
		// refresh screen info
		app.views.main.updatePVRData();
	};

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Edit'), function () {
		self.startPVR();
	});

	// filling
	this.SetHeader(label);
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		self.focusList[self.focusPos][0].focus();
		self.focusList[self.focusPos][0].select();
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, 'CModalAlert') ) {return;}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			case KEYS.LEFT:
				self.FocusLeft(event);
				break;
			case KEYS.RIGHT:
				self.FocusRight(event);
				break;
			case KEYS.PAGE_UP:
				// checking min/max Value of input field
				if ( document.activeElement.value >= document.activeElement.minValue && document.activeElement.value < document.activeElement.maxValue ) {
					document.activeElement.value++;
					document.activeElement.onchange();
					if ( document.activeElement.value < 10 ) {
						document.activeElement.value = '0' + document.activeElement.value;
					}
				}
				break;
			case KEYS.PAGE_DOWN:
				// checking min/max Value of input field
				if ( document.activeElement.value > document.activeElement.minValue && document.activeElement.value <= document.activeElement.maxValue ) {
					document.activeElement.value--;
					document.activeElement.onchange();
					if ( document.activeElement.value < 10 ) {
						document.activeElement.value = '0' + document.activeElement.value;
					}
				}
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);

}

// extending
CModalEditRecord.prototype = Object.create(CModalBox.prototype);
CModalEditRecord.prototype.constructor = CModalEditRecord;


///////////////////////////////////////////////////////////////////////////////


/**
 * Show dialog bow for a PVR record delete
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {Array} [data] items for delete
 * @class CModalConfirm
 * @constructor
 */
function CModalDelete ( parent, data ) {
	// for limited scopes
	var self = this;
	var html = element('table', {className: 'main maxw'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Delete related file')),
			self.switchHandle = element('td', {className: 'data'})
		])
	]);

	self.input = new CCheckBox(parent, {parent: self.switchHandle});

	this.onShow = function () {
		setTimeout(function () {self.input.focus();}, 0);
	};

	// parent constructor
	CModalAlert.call(this, parent, _('Delete record'), html, _('Cancel'), 'btnExitClick');

	// forward events to button panel
	self.EventHandler = function ( event ) {
		switch ( event.code ) {
			case KEYS.LEFT:
			case KEYS.RIGHT:
				self.input.EventHandler(event);
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalDelete';

	// additional button
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Delete'), function () {
		data.forEach(function ( item ) {
			echo('deleting (file too? ' + self.input.IsChecked() + ') by id=' + item.data.id);
			// check if record folder is empty now
			var files, dirs, garbage, currentFolder, recordName, evalText,
				alreadyDeleted = false,
				structure = item.data.fileName.split('/');
			recordName = structure.pop();
			garbage = structure.join('/');
			try {
				evalText = gSTB.ListDir(garbage, false);
				evalText = evalText.replace('var dirs = [', 'dirs = [').replace('var files = [', 'files = ['); // fix for strict mode
				eval(evalText);
			} catch ( e ) {
				echo(e);
				dirs = [];
				files = [];
			}
			// check if channel folder is empty
			if ( self.input.IsChecked() && files.length === 1 && (files[0].name === undefined || files[0].name === recordName || files[0].name === recordName + '.tmp.ts') ) {
				alreadyDeleted = true;
				currentFolder = structure.pop();
				garbage = structure.join('/');
				try {
					evalText = gSTB.ListDir(garbage, false);
					evalText = evalText.replace('var dirs = [', 'dirs = [').replace('var files = [', 'files = ['); // fix for strict mode
					eval(evalText);
				} catch ( e ) {
					echo(e);
					dirs = [];
					files = [];
				}
				if ( dirs.length === 2 && dirs[0] === currentFolder + '/' ) {
					echo('delete channel folder:' + garbage);
					gSTB.RDir('RemoveDirFull "' + garbage + '"');
				} else {
					echo('delete time folder:' + garbage);
					gSTB.RDir('RemoveDirFull "' + garbage + '/' + currentFolder + '"');
				}
			}
			// delete task or whole file
			pvrManager.RemoveTask(item.data.id, self.input.IsChecked() && !alreadyDeleted ? 3 : 0);
		});
		parent.lister.DeleteAll(data);
		self.Show(false);
		// refresh screen info
		app.views.main.updatePVRData();
		parent.lister.Activate(true);
	});
}

// extending
CModalDelete.prototype = Object.create(CModalAlert.prototype);
CModalDelete.prototype.constructor = CModalDelete;

///////////////////////////////////////////////////////////////////////////////


function CModalAddRecord ( parent, label, text ) {
	// parent constructor
	CModalBox.call(this, parent);
	/**
	 * The component inner name
	 * @type {string}
	 */
	this.name = 'CModalAddRecord'; // only for debug purposes
	this.tvChannelsList = [];
	var self = this,               // for limited scopes
	    autoCorrection = true;     // start field auto correction flag

	var time = new Date(),
		sec = time.getSeconds(),
		min = time.getMinutes(),
		hour = time.getHours(),
		day = time.getDate(),
		month = time.getMonth() + 1,
		year = time.getFullYear();

	time = new Date(time.getTime() + 3600000); // default record length = 1 hour
	var min1 = time.getMinutes(),
		hour1 = time.getHours(),
		day1 = time.getDate(),
		month1 = time.getMonth() + 1,
		year1 = time.getFullYear();

	sec = sec > 9 ? sec : '0' + sec;
	min = min < 10 ? '0' + min : min;
	hour = hour < 10 ? '0' + hour : hour;
	day = day < 10 ? '0' + day : day;
	month = month < 10 ? '0' + month : month;
	min1 = min1 < 10 ? '0' + min1 : min1;
	hour1 = hour1 < 10 ? '0' + hour1 : hour1;
	day1 = day1 < 10 ? '0' + day1 : day1;
	month1 = month1 < 10 ? '0' + month1 : month1;

	this.parseTime = function () {
		var tt = /^([0-9]+)$/;
		echo('parseTime : ' + this.value + ' | ' + tt.test(this.value));
		if ( tt.test(this.value) ) {
			if ( this.value > this.maxValue ) {    				this.value = this.maxValue;          			}
			if ( this.value.length === this.maxLength ) {
				setTimeout(function () {
					self.FocusRight();
				}, 50);
			}
		}
		else 			if ( this.value.length > 0 ) {
				this.value = this.value.substring(0, this.value.length - 2);

		}
		return false;
	};

	this.checkTime = function () {
		self.startTimeYear.value = self.startTimeYear.value || (new Date()).getFullYear();
		self.startTimeMonth.value = self.startTimeMonth.value || '01';
		self.startTimeDay.value = self.startTimeDay.value || '00';
		self.startTimeHour.value = self.startTimeHour.value || '00';
		self.startTimeMin.value = self.startTimeMin.value || '00';
		self.endTimeYear.value = self.endTimeYear.value || (new Date()).getFullYear();
		self.endTimeMonth.value = self.endTimeMonth.value || '01';
		self.endTimeDay.value = self.endTimeDay.value || '00';
		self.endTimeHour.value = self.endTimeHour.value || '00';
		self.endTimeMin.value = self.endTimeMin.value || '00';

		var startTime = new Date(self.startTimeYear.value, self.startTimeMonth.value - 1, self.startTimeDay.value, self.startTimeHour.value, self.startTimeMin.value),
			endTime = new Date(self.endTimeYear.value, self.endTimeMonth.value - 1, self.endTimeDay.value, self.endTimeHour.value, self.endTimeMin.value),
			delta = (endTime.getTime() - startTime.getTime()) / 1000;
		if ( delta > 0 ) {
			var h = Math.floor(delta / 3600);
			var m = Math.floor((delta - h * 3600) / 60);
			if ( h > 24 ) {
				h = 23;
				m = 59;
				self.checkEndTime();
			}
			self.timeHour.value = h > 9 ? h : '0' + h;
			self.timeMin.value = m > 9 ? m : '0' + m;
		} else {
			self.timeHour.value = '00';
			self.timeMin.value = '00';
		}
		if ( autoCorrection ) {
			self.itemName.value = (self.startTimeHour.value < 10 && self.startTimeHour.value !== '00' ? '0' + Number(self.startTimeHour.value) : self.startTimeHour.value) + ':';
			self.itemName.value += (self.startTimeMin.value < 10 && self.startTimeMin.value !== '00' ? '0' + Number(self.startTimeMin.value) : self.startTimeMin.value) + ':00';
		}
		return false;
	};

	this.checkEndTime = function () {
		var hour = self.startTimeHour.value,
			min = self.startTimeMin.value,
			day = self.startTimeDay.value;
		self.timeHour.value = self.timeHour.value || '00';
		self.timeMin.value = self.timeMin.value || '00';
		var startTime = new Date(self.startTimeYear.value, self.startTimeMonth.value - 1, day, hour, min),
			endTime = new Date(startTime.getTime() + (self.timeHour.value * 3600 + self.timeMin.value * 60) * 1000);

		min = endTime.getMinutes();
		min = min < 10 ? '0' + min : min;
		hour = endTime.getHours();
		hour = hour < 10 ? '0' + hour : hour;
		day = endTime.getDate();
		day = day < 10 ? '0' + day : day;
		month = endTime.getMonth() + 1;
		month = month < 10 ? '0' + month : month;

		self.endTimeHour.value = hour;
		self.endTimeMin.value = min;
		self.endTimeDay.value = day;
		self.endTimeMonth.value = month;
		self.endTimeYear.value = endTime.getFullYear();
	};

	this.unEscapeChannels = function recursive ( arr ) {
		var data = JSON.parse(JSON.stringify(arr));
		for ( var i = 0; i < data.length; i++ ) {
			data[i].id = i;
			if ( data[i].data ) {
				data[i].name = unescape(data[i].name);
				data[i].data = recursive(data[i].data);
				continue;
			}
			data[i].name = unescape(data[i].name);
			data[i].url = unescape(data[i].url);
			data[i].label = data[i].name;
		}
		return data;
	};

	this.loadChannels = function () {
		echo('loadChannels');
		try {
			var text = gSTB.LoadUserData('iptv.json');

			if ( text !== '' ) {
				var data = JSON.parse(text);
				data = self.unEscapeChannels(data);
				var arr = [_('IPTV')];    // root folder name for path
				data.forEach(function recursive ( item ) {
					if ( !item.data ) {
						item.path = arr.slice(0).join('/');
						if ( item.path.length > 33 ) { // if too long we will take only first 15 and last 15 symbols
							item.path = item.path.substring(0, 15) + '...' + item.path.substring(item.path.length - 15, item.path.length);
						}
						self.tvChannelsList.push(item);
					} else {
						arr.push(item.name);
						item.data.forEach(recursive);
						arr.pop();
					}
				});
			} else {
				self.tvChannelsList = [];
			}
		} catch ( e ) {
			echo(e, 'TVChannels parse error');
		}
	};

	this.loadChannels();
	app.refreshStorageInfo();
	echo(app.storage, 'app.storage');
	this.device = new CSelectBox(this,
		{
			data: app.storage.length > 0 ? app.storage : [{id: -1, label: _('No storage device')}],
			nameField: 'label',
			style : 'cselect-box-wide',
			events: {
				onChange: function(){
					self.$freeSize.innerHTML = this.GetSelected().freeSizeGb || '0';
					self.$totlaSize.innerHTML = this.GetSelected().sizeGb || '0';
				}
			}
		});
	this.$channels = new CSelectBox(this,
		{
			data      : this.tvChannelsList.length > 0 ? this.tvChannelsList : [{id : -1, label : _('No channels')}],
			nameField : 'label',
			style     : 'cselect-box-wide',
			events    : {
				onChange : function () {
					var path = self.$channels.GetSelected().path;
					if(path.length > 34){ // if too long we will take only first 15 and last 15 symbols
						path = path.substring(0,15)+'...'+path.substring(path.length-15,path.length);
					}
					self.$chanPath.innerHTML = path;
				}
			}
		});

	var html = element('table', {className: 'main maxw'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('Start recording:')),
			element('td', {className: 'data'}, [
				element('div', {className: 'box'}, [
					this.startTimeHour = element('input', {className: 'time', type: 'text', value: hour, maxLength: 2, minValue: 0, maxValue: 23, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, ':'),
					this.startTimeMin = element('input', {className: 'time', type: 'text', value: min, maxLength: 2, minValue: 0, maxValue: 59, oninput: this.parseTime, onchange: this.checkTime})
				]),
				element('div', {className: 'box'}, [
					this.startTimeDay = element('input', {className: 'time', type: 'text', value: day, maxLength: 2, minValue: 1, maxValue: 31, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.startTimeMonth = element('input', {className: 'time', type: 'text', value: month, maxLength: 2, minValue: 1, maxValue: 12, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.startTimeYear = element('input', {className: 'data_time', type: 'text', value: year, maxLength: 4, minValue: 1, maxValue: 9999, oninput: this.parseTime, onchange: this.checkTime})
				])
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('End recording:')),
			element('td', {className: 'data'}, [
				element('div', {className: 'box'}, [
					this.endTimeHour = element('input', {className: 'time', type: 'text', value: hour1, maxLength: 2, minValue: 0, maxValue: 23, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, ':'),
					this.endTimeMin = element('input', {className: 'time', type: 'text', value: min1, maxLength: 2, minValue: 0, maxValue: 59, oninput: this.parseTime, onchange: this.checkTime})
				]),
				element('div', {className: 'box'}, [
					this.endTimeDay = element('input', {className: 'time', type: 'text', value: day1, maxLength: 2, minValue: 1, maxValue: 31, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.endTimeMonth = element('input', {className: 'time', type: 'text', value: month1, maxLength: 2, minValue: 1, maxValue: 12, oninput: this.parseTime, onchange: this.checkTime}),
					element('div', {className: 'colon'}, '.'),
					this.endTimeYear = element('input', {className: 'data_time', type: 'text', value: year1, maxLength: 4, minValue: 1, maxValue: 9999, oninput: this.parseTime, onchange: this.checkTime})
				])
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Record length:')),
			element('td', {className: 'data'}, [
				element('div', {className: 'box'}, [
					this.timeHour = element('input', {className: 'time', type: 'text', value: '01', maxLength: 2, minValue: 0, maxValue: 23, oninput: this.parseTime, onchange: this.checkEndTime}),
					element('div', {className: 'colon'}, ':'),
					this.timeMin = element('input', {className: 'time', type: 'text', value: '00', maxLength: 2, minValue: 0, maxValue: 59, oninput: this.parseTime, onchange: this.checkEndTime})
				])
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Path:')),
			element('td', {className: 'data'},
				this.$chanPath = element('span', {className: 'size'}, this.$channels.GetSelected().path))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Channel:')),
			element('td', {className: 'data'}, this.$channels.parentNode)
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Record name:')),
			element('td', {className: 'data'}, [
				this.itemName = element('input', {className: 'wide', type: 'text', value: hour + ':' + min + ':' + sec, change: false, onchange: function () {}, oninput: function () { this.change = true; autoCorrection = false; }})
			])
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Record in:')),
			element('td', {className: 'data'}, this.device.parentNode)
		]),
		element('tr', {}, [
			element('td'),
			element('td', {className: 'data'}, [
				_('Free space:') + ' ', (this.$freeSize = element('span', {className: 'size'}, this.device.GetSelected().freeSizeGb || '0')), ' ' + _('GB') + '   ' + _('of') + ' ',
				(this.$totlaSize = element('span', {className: 'size'}, this.device.GetSelected().sizeGb || '0')), ' ' + _('GB')
			])
		])
	]);

	this.focusList = [
		[this.startTimeHour, this.startTimeMin, this.startTimeDay, this.startTimeMonth, this.startTimeYear],
		[this.endTimeHour, this.endTimeMin, this.endTimeDay, this.endTimeMonth, this.endTimeYear],
		[this.timeHour, this.timeMin],
		[this.$channels],
		[this.itemName],
		[this.device]
	];

	this.startTimeHour.oninput = this.parseTime;


	this.focusPos = 0;
	this.subFocusPos = 0;
	this.FocusNext = function ( event, manageVK ) {
		if ( this.focusList.length > 0 ) {
			// cycling the index
			if ( ++this.focusPos >= this.focusList.length ) {this.focusPos = 0;}
			// get the next html element in the list
			var el = this.focusList[this.focusPos][0];
			if ( manageVK !== false ) {gSTB.HideVirtualKeyboard();}
			// set focus
			el.focus();
			this.subFocusPos = 0;
			// skip looping select options elements
			if ( event && el.nodeName !== 'SELECT' ) {
				event.preventDefault();
				if ( el.select ) {el.select();}
			}
		}
	};

	this.FocusPrev = function ( event, manageVK ) {
		if ( this.focusList.length > 0 ) {
			// cycling the index
			if ( --this.focusPos < 0 ) {this.focusPos = this.focusList.length - 1;}
			// get the next html element in the list
			var el = this.focusList[this.focusPos][0];
			if ( manageVK !== false ) {gSTB.HideVirtualKeyboard();}
			// set focus
			el.focus();
			this.subFocusPos = 0;
			// skip looping select options elements
			if ( el.nodeName !== 'SELECT' ) {
				if ( el.select ) {el.select();}
				event.preventDefault();
			}
		}
	};

	this.FocusRight = function ( event ) {
		if ( this.focusList[this.focusPos].length > 1 ) {
			if ( ++this.subFocusPos >= this.focusList[this.focusPos].length ) {this.subFocusPos = 0;}
			var el = this.focusList[this.focusPos][this.subFocusPos];
			el.focus();
			if ( el.nodeName !== 'SELECT' ) {
				if ( el.select ) {el.select();}
				if ( event ) {event.preventDefault();}
			}
		}
	};

	this.FocusLeft = function ( event ) {
		if ( this.focusList[this.focusPos].length > 1 ) {
			if ( --this.subFocusPos < 0 ) {this.subFocusPos = this.focusList[this.focusPos].length - 1;}
			var el = this.focusList[this.focusPos][this.subFocusPos];
			el.focus();
			if ( el.nodeName !== 'SELECT' ) {
				if ( el.select ) {el.select();}
				if ( event ) {event.preventDefault();}
			}
		}
	};

	this.startPVR = function () {
		// if channel list is empty
		if ( self.$channels.GetSelected().id < 0 ) {
			new CModalHint(currCPage, _('Channel list is empty'), 3000);
			return;
		}
		// only 5 active records limit
		var arr, inProgress = 0;
		try {
			arr = JSON.parse(pvrManager.GetAllTasks());
		} catch ( e ) {
			arr = [];
		}
		arr.forEach(function ( item ) {
			if ( item.state === 2 ) {inProgress++;}
		});
		if ( inProgress >= 5 ) {
			new CModalHint(currCPage, _('Error. Too many active records.'), 3000);
			return;
		}
		// no storage device
		if ( self.device.GetSelected().id === -1 ) {
			new CModalHint(currCPage, _('No storage device'), 3000);
			return;
		}
		// there is no free space at usb drive
		if ( self.device.GetSelected().freeSize === 0 ) {
			new CModalHint(currCPage, _('Not enough disk space'), 3000);
			return;
		}

		var url = self.$channels.GetSelected().url.replace(/@/igm, ''),
			devPath = self.device.GetSelected().mountPath,
			chanName = self.$channels.GetSelected().name.replace(/\/|\*|:|\\|\?|\||'|&|"|\^|%|<|>/igm, '');
		echo(url, 'SELECTED CHANNEL IS');
		gSTB.ExecAction('make_dir "' + devPath + '/records"');
		gSTB.ExecAction('make_dir "' + devPath + '/records/' + chanName + '"');
		gSTB.ExecAction('make_dir "' + devPath + '/records/' + chanName + '/' + this.startTimeYear.value + '-' + this.startTimeMonth.value + '-' + this.startTimeDay.value + '"');

		var name = devPath + '/records/' + chanName + '/' + this.startTimeYear.value + '-' + this.startTimeMonth.value + '-' + this.startTimeDay.value + '/' + this.itemName.value.split(':').join('-').replace(/\/|\*|:|\\|\?|\||'|&|"|\^|%|<|>/igm, '') + '.ts',
			hour = self.startTimeHour.value,
			min = self.startTimeMin.value,
			day = self.startTimeDay.value,
			mon = self.startTimeMonth.value - 1,
			year = self.startTimeYear.value,
			startTime = new Date(year, mon, day, hour, min),
			hourE = self.endTimeHour.value,
			minE = self.endTimeMin.value,
			dayE = self.endTimeDay.value,
			monE = self.endTimeMonth.value - 1,
			yearE = self.endTimeYear.value,
			endTime = new Date(yearE, monE, dayE, hourE, minE),
			done = pvrManager.CreateTask(url, name, startTime.getTime() / 1000, endTime.getTime() / 1000),
			text;
		echo('>DONE:' + done);
		if ( done < 0 ) {
			switch ( done ) {
				case '-2':
					text = _('Not enough disk space');
					break;
				case '-3':
					text = _('Incorrect time');
					break;
				case '-5':
					text = _('Wrong name or path');
					break;
				case '-6':
					text = _('Duplicated file');
					break;
				case '-7':
					text = _('Wrong URL');
					break;
				case '-9':
					text = _('Too many active records processed');
					break;
				case '-11':
					text = _('Not enough disk space');
					break;
				default:
					text = _('Error...');
					break;
			}
			new CModalHint(currCPage, text, 3000);
		} else {
			self.Show(false);
			app.views.main.updatePVRData(); // refresh screen info
		}
	};

	this.bpanel = new CButtonPanel();
	this.bpanel.Init(CMODAL_IMG_PATH);
	this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
		self.Show(false);
	});
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Start recording'), function () {
		self.startPVR();
	});

	// filling
	this.SetHeader(label);
	this.SetContent(html);
	this.SetFooter(this.bpanel.handle);

	this.onShow = function () {
		self.focusList[self.focusPos][0].focus();
		self.focusList[self.focusPos][0].select();
	};

	// free resources on hide
	this.onHide = function () {
		elclear(self.bpanel.handle);
		delete self.bpanel;
		self.Free();
	};

	// forward events to button panel
	this.EventHandler = function ( event ) {
		if ( !eventPrepare(event, true, 'CModalAlert') ) {return;}
		if ( document.activeElement.component && document.activeElement.component.constructor === CSelectBox ) {
			document.activeElement.component.EventHandler(event);
		}
		if ( event.stopped === true ) {return;}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event, false);
				event.preventDefault();
				break;
			case KEYS.DOWN:
				self.FocusNext(event, false);
				event.preventDefault();
				break;
			case KEYS.LEFT:
				// go through dir names
				self.FocusLeft(event);
				break;
			case KEYS.RIGHT:
				// go through dir names
				self.FocusRight(event);
				break;
			case KEYS.PAGE_UP:
				// checking min/max Value of input field
				if ( document.activeElement.value >= document.activeElement.minValue && document.activeElement.value < document.activeElement.maxValue ) {
					document.activeElement.value++;
					document.activeElement.onchange();
					if ( document.activeElement.value < 10 ) {
						document.activeElement.value = '0' + document.activeElement.value;
					}
				}
				break;
			case KEYS.PAGE_DOWN:
				// checking min/max Value of input field
				if ( document.activeElement.value > document.activeElement.minValue && document.activeElement.value <= document.activeElement.maxValue ) {
					document.activeElement.value--;
					document.activeElement.onchange();

					if ( document.activeElement.value < 10 ) {
						document.activeElement.value = '0' + document.activeElement.value;
					}
				}
				break;
			default:
				// forward events to button panel
				self.bpanel.EventHandler(event);
		}
	};

	// build and display
	this.Init();
	this.Show(true);
}

// extending
CModalAddRecord.prototype = Object.create(CModalBox.prototype);
CModalAddRecord.prototype.constructor = CModalAddRecord;
