/**
 * Download Manager vars
 * @author Igor Kopanev
 */

'use strict';

/**
 * Show dialog bow for a download creation
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {Object} [item] download from browser
 * @class CModalDownloadCreate
 * @constructor
 */
function CModalDownloadCreate ( parent, item ) {
	echo('CModalDownloadCreate');
	// for limited scopes
	var self = this;
	// existing folders selector
	echo(item);
	this.device = new CSelectBox(this,
		{
			data     : app.models.storage.length > 0 ? app.models.storage : [
				{id: -1, label: _('No storage device')}
			],
			nameField: 'label',
			style    : 'cselect-box-wide',
			events   : {
				onChange: function () {
					self.$freeSize.innerHTML = this.GetSelected().freeSizeStr || ('0 ' + _('GB'));
					self.$totlaSize.innerHTML = this.GetSelected().sizeStr || ('0 ' + _('GB'));
				}
			}
		});

	function refreshStorageData () {
		// refresh addModalMessage message view
		self.device.SetData(app.models.storage.length > 0 ? app.models.storage : [
			{id: -1, label: _('No storage device')}
		]);
		self.$freeSize.innerHTML = self.device.GetSelected().freeSizeStr || ('0' + _('GB'));
		self.$totlaSize.innerHTML = self.device.GetSelected().sizeStr || ('0' + _('GB'));
	}

	app.bind('storageUpdated', function () {
		refreshStorageData();
	});

	var html = element('table', {className: 'main maxw'}, [
		element('tr', {}, [
			element('td', {className: 'name'}, _('URL:')),
			element('td', {className: 'data'}, this.$link = element('input', {type: 'text', className: 'wide', value: item ? item.url : 'http://'}))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('File name:')),
			element('td', {className: 'data'}, this.$name = element('input', {type: 'text', className: 'wide', value: item ? item.fileName : ''}))
		]),
		element('tr', {}, [
			element('td', {className: 'name'}, _('Download in:')),
			element('td', {className: 'data'}, this.device.parentNode)
		]),
		element('tr', {}, [
			element('td'),
			element('td', {className: 'data'}, [_('Free space:') + ' ', (this.$freeSize = element('span', {className: 'size'}, ('0  ' + _('GB')))),
					'   ' + _('of') + '   ',
				(this.$totlaSize = element('span', {className: 'size'}, ('0  ' + _('GB'))))
			])
		])
	]);

	this.onShow = function () {
		setTimeout(function () {
			self.$link.focus();
			// show VK in new mode
			if ( !item ) {gSTB.ShowVirtualKeyboard();}
		}, 0);
	};

	// parent constructor
	CModalAlert.call(this, parent, _('Add download'), html, _('Cancel'), 'btnExitClick');

	// fill navigation list

	this.focusList.push(this.$link);
	this.focusList.push(this.$name);
	this.focusList.push(this.device);
	// inner name
	this.name = 'CModalAddDownload';

	// forward events to button panel
	this.EventHandler = function ( e ) {
		if ( !eventPrepare(e, true) ) {return;}
		if ( this.device.IsFocused() ) {this.device.EventHandler(event);}
		if ( event.stopped === true ) {return;}
		switch ( event.code ) {
			case KEYS.CHANNEL_NEXT: // channel+
			case KEYS.CHANNEL_PREV: // channel-
				event.preventDefault(); // to suppress tabbing
				break;
			case KEYS.UP:
				self.FocusPrev(event);
				break;
			case KEYS.DOWN: // down
				self.FocusNext(event);
				break;
			default:
				// forward events to button panel
				this.bpanel.EventHandler(event);
		}
	};

	// additional button
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Create'), function () {
		gSTB.HideVirtualKeyboard();
		var added, fileName, extension, length,
			name = self.$name.value.trim(),
			url = self.$link.value.trim();

		function checkSize () {
			ajax('HEAD', url, function ( response, status, xhr ) {
				length = xhr.getResponseHeader('Content-Length');
				if ( length > self.device.GetSelected().freeSize ) {
					return new CModalAlert(self, _('Not enough disk space'), _('File size: ' + app.prepareSize(length) + ' Free space: ' + app.prepareSize(self.device.GetSelected().freeSize)), _('Close'));
				}
				added = stbDownloadManager.AddJob(url, fileName);
				if ( !added ) {return new CModalAlert(self, _('Create download'), _('File name or URL already used'), _('Close'));  }
				app.views.main.refreshDownloads();
				app.views.main.actions.startTimer();
				if ( parent.lister.Length() > 0 ) {
					parent.buttonPanel.Hidden(parent.buttonPanel.btnFrame, false);
					parent.buttonPanel.Hidden(parent.buttonPanel.btnSelect, false);
				}
				self.Show(false);
			});
		}

		if ( url && validateUrl(url) ) {
			if ( name === '' ) {
				name = decodeURIComponent(url).split('/').pop();
			}

			if ( !name ) {return new CModalAlert(self, _('Wrong data'), _('Provided name is invalid'), _('Close'));}

			if ( self.device.GetValue() === -1 ) {return new CModalHint(self, _('No storage device found'), 3000);}

			fileName = self.device.GetSelected().mountPath + '/' + name.replace(/[\\/<>?%*:|"']/g, '_');

			extension = '.' + url.split('.').pop(); // check and restore file extension ('*.jpeg', '*.mp3', ...)
			if ( extension.length < 6 && (fileName.indexOf(extension) === -1 || fileName.lastIndexOf(extension) < fileName.length - extension.length) ) {
				fileName = fileName + extension;
			}

			if ( configuration.registersTypes.indexOf(fileName.split('.').pop().toLowerCase()) === -1 ) {
				return new CModalHint(self, _('Unsupported file extension'), 3000);
			}

			if ( gSTB.IsFileExist(fileName) ) {
				new CModalConfirm(self, _('Error'), _('File with this name already exist. Do you want rewrite it?'), _('Cancel'), function () {
					this.Show(false);
				}, _('Ok'), function () {
					var dlItems = app.views.main.page.lister.downloads,
						success = false;
					for ( var i = 0; i < dlItems.length; i++ ) { // find file clone id
						if ( dlItems[i].mountPoint + '/' + dlItems[i].name === fileName ) {
							stbDownloadManager.StopJob(dlItems[i].id);
							stbDownloadManager.DeleteJob(dlItems[i].id, true);
							success = true;
							break;
						}
					}
					if ( success || gSTB.RDir('RemoveFile "' + fileName + '"') === 'Ok' ) {
						checkSize();
					} else {
						this.Show(false);
						new CModalHint(self, _('Some error. Please rename the file.'), 3000);
					}
				});
			} else {
				checkSize();
			}

			return true;
		} else {
			return new CModalAlert(self, _('Wrong data'), _('Provided url is invalid'), _('Close'));
		}
	});

	app.refreshStorageInfo();
}

// extending
CModalDownloadCreate.prototype = Object.create(CModalAlert.prototype);
CModalDownloadCreate.prototype.constructor = CModalDownloadCreate;


/**
 * Show dialog bow for a download remove
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {Array} [data] downloads for delete
 * @class CModalConfirm
 * @constructor
 */
function CModalDelete ( parent, data ) {
	// for limited scopes
	var self = this, html = ' ', warning;
	warning = data.some(function ( item ) {  // 3 - completed downloads
		return item.data.state === 3;
	});

	if ( warning ) {
		html = element('table', {className: 'main maxw'}, [
			element('tr', {}, [
				element('td', {className: 'name'}, _('Delete the related file')),
				self.switchHandle = element('td', {className: 'data'})
			])
		]);

		self.input = new CCheckBox(parent, {parent: self.switchHandle});

		this.onShow = function () {
			setTimeout(function () {self.input.focus();}, 0);
		};
	}
	// parent constructor
	CModalAlert.call(this, parent, _('Delete download'), html, _('Cancel'), 'btnExitClick');

	// forward events to button panel
	self.EventHandler = function ( event ) {
		switch ( event.code ) {
			case KEYS.LEFT:
			case KEYS.RIGHT:
				if ( warning ) {self.input.EventHandler(event);}
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
	this.bpanel.Add(KEYS.OK, 'ok.png', _('Apply'), function () {
		parent.lister.removeFiles = warning ? self.input.IsChecked() : true;
		parent.lister.DeleteAll(data);
		self.Show(false);
		// refresh screen info
		parent.lister.Activate(true);
		if ( parent.lister.Length() === 0 ) {
			parent.buttonPanel.Hidden(parent.buttonPanel.btnFrame, true);
			parent.buttonPanel.Hidden(parent.buttonPanel.btnSelect, true);
		}
	});
}

// extending
CModalDelete.prototype = Object.create(CModalAlert.prototype);
CModalDelete.prototype.constructor = CModalDelete;
