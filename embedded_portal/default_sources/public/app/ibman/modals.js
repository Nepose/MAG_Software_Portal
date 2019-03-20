/**
 * Modal windows
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * Show dialog bow for a bookmark item creation or edit
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {Object} [item] CBookmarkList element to edit
 * @class CModalBookmarkEdit
 * @constructor
 */
function CModalBookmarkEdit ( parent, item, options ) {
	// for limited scopes
	var self = this;

	var html = element('table', {className:'main maxw'}, [
		element('tr', {}, [
			element('td', {className:'name'}, _('Name:')),
			element('td', {className:'data'}, this.$name = element('input', {type:'text', className:'wide'}))
		]),
		element('tr', {}, [
			element('td', {className:'name'}, _('URL:')),
			element('td', {className:'data'}, this.$link = element('input', {type:'text', className:'wide'}))
		]),
		element('tr', {}, [
			element('td', {className:'name'}, _('Folder:')),
			element('td', {className:'data'}, this.$curDir = element('div'))
		]),
		element('tr', {}, [
			element('td'),
			element('td', {className:'data'}, _('or create and use a new folder:'))
		]),
		element('tr', {}, [
			element('td'),
			element('td', {className:'data'}, this.$newDir = element('input', {type:'text', className:'wide', oninput:function(){ self.folder.SetIndex(0); }}))
		])
	]);

	// fill the list of dirs sorted by name
	var dirs = [{id:null, name:_('Internet bookmarks')}].concat(
		app.models.main.dirs.find({}).sort(function(a,b){ return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); })
	);

	// existing folders selector
	this.folder = new CSelectBox(this, {content: this.$curDir, data: dirs, style: 'cselect-box-wide'});

	// edit mode
	if ( item ) {
		this.$name.value = item.data.name;
		this.$link.value = item.data.id;
		this.folder.SelectById(item.data.dir);
	} else {
		// select the current dir
		var curDirId = app.views.main.lister.parentItem.id;
		if ( curDirId ) { this.folder.SelectById(curDirId); }
	}

	// web window mode
	if ( options ) {
		this.$name.value = options.name;
		this.$link.value = options.link;
	}

	this.onShow = function(){
		stbWindowMgr.SetVirtualKeyboardCoord('none');
		setTimeout(function(){
			self.$name.focus();
			// show VK in new mode
			if ( !item ) { gSTB.ShowVirtualKeyboard(); }
		}, 0);
	};

	// parent constructor
	CModalAlert.call(this, parent, item ? _('Modify bookmark') : _('Create bookmark'), html, _('Cancel'), function(){
		echo('cancel');
		if ( app.views.main.mode === app.views.main.MODE_BROWSER ) { app.views.main.webWindowShow(true); }
	});

	this.onHide = function(){
		if ( app.views.main.mode === app.views.main.MODE_BROWSER ) { stbWindowMgr.SetVirtualKeyboardCoord('bottom'); }
	};

	// fill navigation list
	this.focusList.push(this.$name);
	this.focusList.push(this.$link);
	this.focusList.push(this.folder);
	this.focusList.push(this.$newDir);

	// inner name
	this.name = 'CModalBookmarkEdit';

	// forward events to button panel
	this.EventHandler = function ( e ) {
		if ( !eventPrepare(e, true, self.name) ) { return; }
		if ( document.activeElement === this.folder.handle ) { this.folder.EventHandler(event); }
		if (event.stopped === true) { return; }
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
	this.bpanel.Add(KEYS.OK, 'ok.png', item ? _('Apply') : _('Create'), function(){
		echo('ok');
		gSTB.HideVirtualKeyboard();

		var urlName = self.$name.value.trim(),
			urlLink = self.$link.value.trim(),
			dirId   = null,
			dirName = self.$newDir.value.trim(),
			time    = Math.round(+new Date()/1000),
			curItem = app.views.main.lister.Current();

		if ( urlName && urlLink && validateUrl(urlLink) ) {
			// a new dir is given
			if ( dirName ) {
				// correct name
				self.$newDir.value = dirName;
				// already exists
				if ( app.models.main.dirs.find({name:dirName}).length > 0 ) {
					return new CModalAlert(self, _('Create folder'), _('Folder with this name already exists'), _('Close'), function(){ echo('exit'); });
				} else {
					dirId = app.models.main.dirs.genId();
					app.models.main.dirs.add(dirId, dirName, time);
				}
			} else {
				dirId = self.folder.GetValue();
			}
			// remove the old one
			if ( item && item.data.id ) { app.models.main.urls.unset(item.data.id); }
			// add a new or update the old
			app.models.main.urls.set(urlLink, {
				name : urlName,
				time : time,
				dir  : dirId
			});
			app.models.main.changed = true;

			if ( app.views.main.mode === app.views.main.MODE_BOOKMARKS ) {
				app.views.main.bookmarksBlock.ShowBgImage(false);
				app.views.main.bookmarksBlock.ShowLister(true);
				app.views.main.buttonPanel.Hidden(app.views.main.buttonPanel.btnInfo, false);
				app.views.main.buttonPanel.Hidden(app.views.main.buttonPanel.btnF2, false);
			} else {
				app.views.main.addressBar.FillStar(true);
				app.views.main.buttonPanel.Rename(app.views.main.buttonPanel.btnF1, _('Remove<br>bookmark'));
			}
		} else {
			return new CModalAlert(self, _('Wrong data'), _('Provided url name or address is invalid'), _('Close'), function(){ echo('exit'); });
		}

		self.Show(false);

		app.views.main.lister.Refresh();
		// select any appropriate item
		app.views.main.lister.Reposition({id:urlLink}) || app.views.main.lister.Reposition({id:dirId}) || app.views.main.lister.Reposition({id:curItem.data.id});

		if ( app.views.main.mode === app.views.main.MODE_BROWSER ) { app.views.main.webWindowShow(true); }

		return true;
	});
}

// extending
CModalBookmarkEdit.prototype = Object.create(CModalAlert.prototype);
CModalBookmarkEdit.prototype.constructor = CModalBookmarkEdit;


/**
 * Show dialog bow for a bookmark folder creation or edit
 * @param {CPage|CBase} [parent] object owner (document.body if not set)
 * @param {Object} [item] CBookmarkList element to edit
 * @class CModalFolderEdit
 * @constructor
 */
function CModalFolderEdit ( parent, item ) {
	// for limited scopes
	var self = this;

	var html = element('table', {className:'main maxw'}, [
		element('tr', {}, [
			element('td', {className:'name'}, _('Name:')),
			element('td', {className:'data'}, this.$name = element('input', {type:'text', className:'wide'}))
		])
	]);

	// edit mode
	if ( item ) {
		this.$name.value = item.data.name;
	}

	this.onShow = function(){
		setTimeout(function(){
			self.$name.focus();
			// show VK in new mode
			if ( !item ) { gSTB.ShowVirtualKeyboard(); }
		}, 0);
	};

	// parent constructor
	CModalAlert.call(this, parent, item ? _('Modify folder') : _('Create folder'), html, _('Cancel'), function(){});

	// inner name
	this.name = 'CModalFolderEdit';

	// additional button
	this.bpanel.Add(KEYS.OK, 'ok.png', item ? _('Apply') : _('Create'), function(){
		gSTB.HideVirtualKeyboard();

		// prepare data
		var data = {
			name : self.$name.value,
			time : Math.round(+new Date()/1000),
			type : MEDIA_TYPE_FOLDER
		};

		// edit mode
		if ( item ) {
			// update row in the list
			item.$body.innerHtml = data.name;
		} else {
			// not already exists
			if ( app.models.main.dirs.find({name:data.name}).length === 0 ) {
				// create a new one
				data.id = app.models.main.dirs.genId();
				item = app.views.main.lister.Add(data.name, data);
			}
			// show
			app.views.main.bookmarksBlock.ShowBgImage(false);
			app.views.main.bookmarksBlock.ShowLister(true);
			app.views.main.buttonPanel.Hidden(app.views.main.buttonPanel.btnInfo, false);
			app.views.main.buttonPanel.Hidden(app.views.main.buttonPanel.btnF2, false);
		}

		if ( item ) {
			// update linked data
			app.models.main.dirs.set(item.data.id, data);
			app.models.main.changed = true;
		}

		self.Show(false);

		app.views.main.lister.Refresh();
		// select any appropriate item
		app.views.main.lister.Reposition({id:data.id}, true);
	});
}

// extending
CModalFolderEdit.prototype = Object.create(CModalAlert.prototype);
CModalFolderEdit.prototype.constructor = CModalFolderEdit;
