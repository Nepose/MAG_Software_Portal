'use strict';

var MODAL_IMG_PATH = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/',

	/**
	 * @param parent
	 * @param options
	 * @constructor
	 * Phrases that should be translated:
	 *    'Retry', 'Cancel', 'Show log', 'Update', 'Status', 'Check image', 'Exit', 'Current version',
	 *    'New version', 'Description', 'Updating to version', 'Update status', 'Hide log', 'List of changes'
	 *    '<span class='alert'>Warning!</span> Device will be rebooted after update'
	 */
	CUpdateModal = function ( parent, options ) {
		var self = this;

		CModalBox.call(this, parent || null);

		this.isVisible = false;
		this.name = 'CUpdateModal';
		this.baseClass = 'cmodal-main cupdate-modal';
		this.$status = element('td', {className: 'right'}); // status element

		this.F1_func = null;
		this.Info_func = null;

		this.image_info = {}; // image info cache

		CUpdateModal.parameters.forEach(function ( option ) {
			if ( options[option] !== undefined ) {self[option] = options[option];}
		});

		this.bind(this.events);

		this.bpanel = new CButtonPanel();
		this.bpanel.Init(MODAL_IMG_PATH);

		this.Exit_btn = this.bpanel.Add(KEYS.EXIT, 'exit.png', _('Cancel'), function () {
			self.Update.Clear();
			self.Show(false);
		}, this.auto === true);

		this.Info_btn = this.bpanel.Add(KEYS.INFO, 'info.png', _('Show log'), function () {
			self.Info_func();
		}, this.log !== true);

		this.OK_btn = this.bpanel.Add(KEYS.F1, 'f1.png', _('Update'), function () {
			self.F1_func();
		}, true);

		this.ProgressBar = new CProgressBar(this, element('div'));

		this.SetHeader(this.header_text);
		this.SetFooter(this.bpanel.handle);

		this.EventHandler = function ( event ) {
			eventPrepare(event);
			if ( self.select !== undefined && typeof self.select.EventHandler === 'function' ) {
				self.select.EventHandler(event);
			}
			self.bpanel.EventHandler(event);
		};

		this.Init();
	};

CUpdateModal.parameters = ['update_url', 'check', 'auto', 'images', 'log', 'select', 'header_text', 'info', 'events', 'warning']; // parameters list

// extending
CUpdateModal.prototype = Object.create(CModalBox.prototype);
CUpdateModal.prototype.constructor = CUpdateModal;

/**
 * Trigger onHide event
 */
CUpdateModal.prototype.onHide = function () {
	this.trigger('onHide');
};

/**
 * Trigger onShow event
 */
CUpdateModal.prototype.onShow = function () {
	this.trigger('onShow');
};


CUpdateModal.prototype.onInit = function () {
	var self = this;

	this.Update = new Update({
		onReady: function () {
			echo('CUpdateModal.Update: onReady listener');
			self.image_info = self.Update.GetImageInfo(); // get Updating image info
			self.image_description = self.image_info.description;
			self.image_date = self.image_info.date;
			if ( self.auto === true ) { // check autoupdate
				self.UpdateStart(); // if auto start update immediately
			} else {
				self.ImageSelect(); // else show conformation window
			}
			self.trigger('onReady');
		},
		onCheck: function ( data ) {
			echo('CUpdateModal.Update: onCheck listener');
			self._addLogMessage(data.logMessage); // add log message
			self.$status.innerHTML = data.statusMessage; // show current state of check
			self.$status.className = 'right';
			self.trigger('onCheck', data); // trigger onCheck event
			self.bpanel.Rename(self.OK_btn, _('Update'));
		},
		onError: function ( data ) {
			echo('CUpdateModal.Update: onError listener');
			self._addLogMessage(data.logMessage, 'error'); // add log message
			// Show buttons
			self.bpanel.Hidden(self.OK_btn, false); // show OK button
			self.bpanel.Hidden(self.Exit_btn, false); // show Exit button
			self.bpanel.Rename(self.OK_btn, _('Retry'));
			self.bpanel.Rename(self.Exit_btn, _('Exit'));
			self.$status.innerHTML = data.errorMessage; // show Error message in status field
			self.$status.classList.add('error');
			self.trigger('onError', data);
		},
		onProgress: function ( data ) {
			echo('CUpdateModal.Update: onProgress listener');
			self._addLogMessage(data.logMessage); // add log message
			self.$status.innerHTML = data.statusMessage; // show current update state
			self.ProgressBar.SetProgress(data.percent); // set progress bar percent
			self.trigger('onProgress', data);
		},
		onStart: function () {
			echo('CUpdateModal.Update: onStart listener');
			self.UpdateStart();
			CModalBox.prototype.Show.call(self, true);
		}
	});

	if ( this.log === true ) { // check if log activated
		this.log = new CLog(document.body, {
			autofocus: true,
			time: true,
			newest: true,
			defaultType: 'success',
			isVisible: false,
			events: {
				onShow: function () {
					self.$status.parentNode.style.display = 'none';
				},
				onHide: function () {
					self.$status.parentNode.style.display = '';
				}
			}
		});
	}

	this.curr_info = this.Update.GetCurrentImageInfo(); // get info about current image

	if ( typeof this.update_url === 'string' ) { // if update_url specified in params
		this.check = true; // always need check that url
	} else if ( Array.isArray(this.images) ) { // if specified images array
		this.check = false; // check url not necessary
		this.image_description = cutTextWithEllipsis(this.images[0].descr, 200);
		this.image_date = new Date(this.images[0].date);
		if ( this.select === true && this.images.length > 1 ) {
			this.select = new CSelectBox(this, {
				parent: this.new_version = element('div'),
				data: this.images,
				nameField: 'title',
				idField: 'url',
				events: {
					onChange: function () {
						self.$curr_update_descr.innerHTML = cutTextWithEllipsis(this.GetSelected().descr, 200);
						self.update_url = this.GetValue();
						self.$curr_update_date.innerHTML = new Date(this.GetSelected().date).toDateString() + ' ' + new Date(this.GetSelected().date).toLocaleTimeString();
					}
				}
			});
			this.update_url = this.select.GetValue();
		} else { // if select not specified or images.length = 1
			this.new_version = this.images[0].title; // select component not needed
			this.new_version_date = new Date(this.images[0].date);
			this.update_url = this.images[0].url;
		}
	}
};

/**
 * If log component exist add message
 * @param {string} message log message
 * @param {string} type    message type
 * @private
 */
CUpdateModal.prototype._addLogMessage = function ( message, type ) {
	if ( this.log !== undefined ) { this.log.Add(message, type); }
};

/**
 * If log component exist adds it in elements array
 * @param {Array} elements that will be displayed on the page
 * @private
 */
CUpdateModal.prototype._addLog = function ( elements ) {
	var self = this;
	if ( typeof this.log !== 'undefined' ) {
		elements.push(
			element('tr', {className: 'row'}, [element('td', {className: 'log', colSpan: 2}, this.log.handle)])
		);
		this.Info_func = function () {
			self.log.Show(!self.log.isVisible);
			this.bpanel.Rename(this.Info_btn, self.log.isVisible ? _('Hide log') : _('Show log'));
			self.content.querySelector('table').classList.toggle('hidden');
		};
		this.bpanel.Rename(this.Info_btn, self.log.isVisible ? _('Hide log') : _('Show log'));
		this.bpanel.Hidden(this.Info_btn, false);
	}
};

/**
 * Manage the window visibility
 * @param {boolean} show show or hide window
 */
CUpdateModal.prototype.Show = function ( show ) {
	echo('CUpdateModal.prototype.Show:show? ' + show + ', auto? ' + this.auto + ', check? ' + this.check);
	if ( show !== false ) {
		if ( this.auto === true ) {
			this.Update.Start(this.update_url);
			return;
		}
		if ( this.check === true ) {
			this.CheckStatus();
		} else {
			this.ImageSelect();
		}
		if ( this.log && this.log.isVisible ) {
			this.log.Show(false);
		}
	}
	CModalBox.prototype.Show.call(this, show);
};

/**
 * Show check status content in the update window
 */
CUpdateModal.prototype.CheckStatus = function () {
	echo('CUpdateModal.CheckStatus');
	this.layer = this.CheckStatus;
	var self = this,
		elements = [
			element('tr', {className: 'row'},
				[
					element('td', {className: 'left'}, _('Status') + ':'),
					this.$status = element('td', {className: 'right'})
				])
		];
	this._addLog(elements);
	this.SetHeader(_('Check image'));
	this.SetContent(element('table', {className: 'cmodal-update status'}, elements));
	this.F1_func = function () {
		self.$status.innerHtml = status;
		self.$status.className = 'right';
		self.bpanel.Hidden(this.OK_btn, true);
		self.bpanel.Rename(this.Exit_btn, _('Cancel'));
		self.Update.CheckUpdate(self.update_url);
		self.trigger('onCheckStatus');
	};
	self.Update.CheckUpdate(self.update_url);
};

/**
 * Show image select content in the update window
 */
CUpdateModal.prototype.ImageSelect = function () {
	this.layer = this.ImageSelect;
	var self = this, $new_version,
		elements = [
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Current version') + ':'),
					element('td', {className: 'right', innerHTML: this.curr_info.version})
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'},  _('Description') + ':'),
					element('td', {className: 'right'}, element('div', {className:'ellipsis', innerHTML: this.curr_info.description || ''}))
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Date') + ':'),
					element('td', {
						className: 'right',
						innerHTML: isNaN(this.curr_info.date) ? 'n/a' : this.curr_info.date.toDateString() + ' ' + this.curr_info.date.toLocaleTimeString()
					})
				]),
			element('tr', {className: 'row padding info'},
				[
					element('td', {className: 'left'}, _('New version') + ':'),
					element('td', {className: 'right'}, $new_version = element('div'))
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Description') + ':'),
					element('td', {className: 'right'}, self.$curr_update_descr = element('div', {
						className: 'ellipsis',
						innerHTML: this.image_description || ''
					}))
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Date') + ':'),
					self.$curr_update_date = element('td', {
						className: 'right',
						innerHTML: this.image_date.toDateString() + ' ' + this.image_date.toLocaleTimeString()
					})
				])
		];

	if ( this.warning !== false ) {
		elements.unshift(element('tr', {className: 'row info'},
			[
				element('td', {
					className: 'center',
					colSpan: 2,
					innerHTML: _('<span class=\"alert\">Warning!</span> Device will be rebooted after update')
				})
			])
		);
	}

	this.bpanel.Hidden(this.Info_btn, this.info !== true); // hide info button if necessary

	this._addLog(elements);

	this.SetContent(element('table', {className: 'cmodal-update'}, elements));

	if ( this.new_version !== undefined ) {
		if ( typeof this.new_version === 'string' ) {
			$new_version.innerHTML = this.new_version;
			self.$curr_update_date.innerHTML = this.new_version_date.toDateString() + ' ' + this.new_version_date.toLocaleTimeString();
		} else {
			elchild($new_version, this.new_version);
		}
	} else {
		$new_version.innerHTML = this.image_info.version;
		self.$curr_update_date.innerHTML = this.image_info.date.toDateString() + ' ' + this.image_info.date.toLocaleTimeString();
	}

	// Set header
	this.SetHeader(this.header_text || '');

	if ( this.info === true ) {
		this.Info_func = function () {
			self.ShowInfoWindow();
		};
		this.bpanel.Rename(this.Info_btn, _('Change log'));
	}

	this.F1_func = function () {
		self.Update.Start(this.update_url);
	};

	this.bpanel.Hidden(this.OK_btn, false);
	this.bpanel.Hidden(this.Exit_btn, false);

	if ( this._binded !== true ) {
		this.bind('onShow', function () {
			if ( this.layer === this.ImageSelect && this.select && this.select.focus ) {
				this.select.focus();
			}
		});
		this._binded = true;
	}
};

/**
 * Show elements after update start
 */
CUpdateModal.prototype.UpdateStart = function () {
	this.layer = this.UpdateStart;
	var self = this,
		elements = [
			element('tr', {className: 'row info'},
				[
					element('td', {
						className: 'center',
						colSpan: 2,
						innerHTML: _('<span class=\"alert\">Warning!</span> Device will be rebooted after update')
					})
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Current version') + ':'),
					element('td', {className: 'right', innerHTML: this.curr_info.version})
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Description') + ':'),
					element('td', {className: 'right'}, element('div', {
						className: 'ellipsis',
						innerHTML: this.curr_info.description || ''
					}))
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Date') + ':'),
					element('td', {
						className: 'right',
						innerHTML: isNaN(this.curr_info.date) ? 'n/a' : this.curr_info.date.toDateString() + ' ' + this.curr_info.date.toLocaleTimeString()
					})
				]),
			element('tr', {className: 'row info padding'},
				[
					element('td', {className: 'left'}, _('New version') + ':'),
					element('td', {className: 'right', innerHTML: this.image_info.version})
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Description') + ':'),
					element('td', {className: 'right'}, self.$curr_update_descr = element('div', {
						className: 'ellipsis',
						innerHTML: this.image_description || ''
					}))
				]),
			element('tr', {className: 'row info'},
				[
					element('td', {className: 'left'}, _('Date') + ':'),
					element('td', {
						className: 'right',
						innerHTML: this.image_info.date.toDateString() + ' ' + this.image_info.date.toLocaleTimeString()
					})
				]),
			element('tr', {className: 'row padding'},
				[
					element('td', {className: 'left'}, _('Update status') + ':'),
					this.$status
				])
		];

	this.bpanel.Hidden(this.Info_btn, true); // hide info button
	this.bpanel.Hidden(self.Exit_btn, true); // hide Exit button

	this._addLog(elements);

	elements.push(
		element('tr', {className: 'row'},
			[
				element('td', {className: 'center', colSpan: 2}, this.ProgressBar.handle)
			])
	);

	this.SetContent(element('table', {className: 'cmodal-update'}, elements));
	this.bpanel.Hidden(this.OK_btn, true);
	this.bpanel.Hidden(this.Exit_btn, true);
	if ( self.log.isVisible ) {
		self.content.querySelector('table').classList.add('hidden');
	} else {
		self.content.querySelector('table').classList.remove('hidden');
	}

	this.trigger('onShowUpdateStart');

	this.F1_func = function () {
		self.Update.Start(self.update_url, self.$status.classList.contains('error')); // if error then force restart
		self.$status.innerHtml = '';
		self.$status.classList.remove('error');
		self.bpanel.Hidden(this.OK_btn, true);
		self.bpanel.Hidden(this.Exit_btn, true);
	};
};

CUpdateModal.prototype.ShowInfoWindow = function () {
	var modal = new CModalBox(this), $content,
		self = this;
	modal.SetHeader(_('Change log'));
	modal.baseClass = 'cmodal-main image-info-modal';
	modal.name = 'CModalImageInfo';
	modal.bpanel = new CButtonPanel();
	modal.bpanel.Init(MODAL_IMG_PATH);
	modal.bpanel.Add(KEYS.EXIT, 'exit.png', _('Close'), function () {
		modal.Show(false);
		modal.Free();
	});
	modal.EventHandler = function ( event ) {
		switch ( event.code ) {
			case KEYS.UP:
				$content.parentNode.scrollByLines(-2);
				break;
			case KEYS.DOWN:
				$content.parentNode.scrollByLines(2);
				break;
			case KEYS.PAGE_DOWN:
				$content.parentNode.scrollByPages(1);
				break;
			case KEYS.PAGE_UP:
				$content.parentNode.scrollByPages(-1);
				break;
		}
		modal.bpanel.EventHandler(event);
	};
	modal.SetFooter(modal.bpanel.handle);
	modal.SetContent(element('div', {className: 'image-info-content'}, $content = element('div', {className: 'info'}, _('Information not found'))));
	modal.Init();
	if ( this.image_info[this.update_url] === undefined && this.update_url ) {
		var name = this.update_url.split('/').pop();
		ajax('GET', this.update_url.replace(name, '') + 'info/pub/get.php?name=' + name + '&lang=' + getCurrentLanguage(), function ( text, status ) {
			if ( status === 200 ) {
				self.image_info[self.update_url] = text;
			} else {
				self.image_info[self.update_url] = _('Information not found');
			}
			$content.innerHTML = self.image_info[self.update_url];
			modal.Show(true);
			$content.focus();
		});
		return;
	}
	$content.innerHTML = self.image_info[self.update_url];
	modal.Show(true);
	$content.focus();
};

Events.inject(CUpdateModal);

