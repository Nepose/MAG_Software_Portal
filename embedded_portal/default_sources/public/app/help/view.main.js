/**
 * Internet Bookmarks Manager main view handling
 * @namespace
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
app.views.main = (function ( global, app ) {
	'use strict';

	// declarations
	var module = {},  // current view
		remoteControlButtonsImagesPath = configuration.newRemoteControl ? PATH_IMG_SYSTEM + 'buttons/new/' : PATH_IMG_SYSTEM + 'buttons/old/';

	// view states
	module.MODE_LIST = 1;
	module.MODE_ARTICLE   = 2;

	// active view state
	module.mode = null;

	/**
	 * main page creation
	 * @return {CPage}
	 */
	function initPage () {
		var component = new CPage(),
			item;
		component.name = 'CPageMain';
		component.Init(document.body.querySelector('div.page.main'));
		/** @param {Event} event */
		component.EventHandler = function ( event ) {
			// web mode
			if ( module.mode === module.MODE_ARTICLE ) {
				// article
				if ( module.searchBar.EventHandler(event) !== true ) {
					switch ( event.code ) {
						case KEYS.UP:
						case KEYS.DOWN:
						case KEYS.HOME:
						case KEYS.END:
						case KEYS.PAGE_UP:
						case KEYS.PAGE_DOWN:
							module.articleBlock.EventHandler(event);
							break;
						case KEYS.EXIT:
							echo('component.EventHandler');
							module.actions.exit();
							return true;
						case KEYS.TV:
							break;
						case KEYS.REFRESH:
							event.preventDefault();
							break;
					}
				}
			} else {
				// list
				if ( module.searchBar.EventHandler(event) !== true ) {
					switch ( event.code ) {
						case KEYS.OK:
						case KEYS.PAGE_UP:
						case KEYS.PAGE_DOWN:
						case KEYS.UP:
						case KEYS.DOWN:
						case KEYS.LEFT:
						case KEYS.RIGHT:
						case KEYS.HOME:
						case KEYS.END:
							// bookmark list navigation
							module.lister.EventHandler(event);
							break;
						case KEYS.MENU:
						case KEYS.INFO:
							// global keys
							module.buttonPanel.EventHandler(event);
							break;
						case KEYS.EXIT:
							module.exitButtonPanel.EventHandler(event);
							return true;
						case KEYS.TV:
							break;
					}
				} else {
					//return true;
				}
			}
		};
		return component;
	}

	/**
	 * header filter component
	 * @return {CFilterInput}
	 */
	function initSearchBar () {
		// dom link to the whole block
		var container = module.page.handle.querySelector('.body .header table.list');
		// main init
		var component = new CFilterInput(this, {
			parent: container.querySelector('.csbar'),
			hint: _("Enter part of title to filter..."),
			folded: true,
			events:{
				onEnter: function(){
					clearTimeout(component.timer);
					if (module.mode === module.MODE_LIST){
						// type
						if ( this.GetValue() ) {
							// go deeper
							module.lister.filterText = this.GetValue();
							module.lister.Filter();
						} else {
							// clear and refresh
							module.lister.filterText = module.lister.parentItem.filterText = '';
							module.lister.Refresh();
						}
						// refresh preview
						module.lister.onFocus(module.lister.Current());
					}else{
						module.articleBlock.HighlightText(component.GetValue());
						module.articleBlock.FocusFirstHighlighted();
					}
					this.Fold(true);
					module.breadCrumb.Show(true);
					return true;
				},
				onChange: function(){
					if ( component.timer ) clearTimeout(component.timer);
					// add delay
					component.timer = setTimeout(function(){
						// show info in preview block
						if (module.mode === module.MODE_LIST){
							var item = module.lister.FirstMatch(component.GetValue());
							if ( item ) {
								module.lister.SetPosition(item, true, false);
							}
						}else{
							if (component.GetValue().length > 2){
								module.articleBlock.HighlightText(component.GetValue());
								module.articleBlock.FocusFirstHighlighted();
								component.focus();
							}else{
								module.articleBlock.HighlightText('');
							}
						}
					}, 400);
				},
				onUnfold: function(){
					module.breadCrumb.Show(false);
					gSTB.ShowVirtualKeyboard();
				},
				onFold: function(){
					module.breadCrumb.Show(true);
				},
				onExit: function(){
					echo('CFilterInput onExit');
					if (module.mode === module.MODE_LIST){
						this.Reset();
					}
				}
			}
		});
		component.timer = 0;
		component.$container = container;
		return component;
	}

	/**
	 * header component
	 * @return {CBreadCrumb}
	 */
	function initBreadCrumb () {
		var component = new CBreadCrumb(module.page);
		component.showAttr = 'table-cell';
		component.Init(PATH_IMG_PUBLIC + 'media/', module.searchBar.$container.querySelector('.cbcrumb'));
		component.SetName(_('Help'));
		return component;
	}

	/**
	 * preview side panel component
	 * @return {CBase}
	 */
	function initPreview () {
		var component = new CBase(module.page);
		component.Init(module.page.handle.querySelector('.content .sbar'));
		component.Show(false, false);
		component.body   = component.handle.querySelector('td.view');
		component.showAttr = "table-cell";
		component.infoIcon = element('img', {align: 'left', src: PATH_IMG_PUBLIC + 'media/ico_info.png'});
		component.actionInfo = {};
		component.actionInfo[MEDIA_TYPE_HELP_BACK] = function ( data ) {
			elchild(elclear(this.body), this.info(module.lister.parentItem));
		};

		component.actionInfo[MEDIA_TYPE_HELP_FOLDER] = function ( data ) {
			var size = 200,
				annotation = data.annotation.substr(0, size - 1) + (data.annotation.length > size ? '...' : '');
			elchild(elclear(this.body), element('div', {}, [
				this.infoIcon,
				element('div', {className: 'text'}, annotation)
			]));
		};

		component.actionInfo[MEDIA_TYPE_HELP_ARTICLE] = function ( data ) {
			var size = 200,
				annotation = data.annotation.substr(0, size - 1) + (data.annotation.length > size ? '...' : '');
			elchild(elclear(this.body), element('div', {}, [
				this.infoIcon,
				element('div', {className: 'text'}, annotation)
			]));
		};

		component.onShow = function () {
			// there is an active item
			if ( module.lister.activeItem ) this.info(module.lister.activeItem.data);
		};

		component.SetItemsCount = function ( ) {
			this.valAll.innerHTML = module.lister.path.length > 1 ? module.lister.Length()-1 : module.lister.Length();
		};

		/**
		 * The main method of an item info display
		 * @param {Object} data media item inner data
		 */
		component.info = function ( data ) {
			// get item associated open action and execute
			if ( data && data.type && typeof this.actionInfo[data.type] === 'function' ) {
				this.actionInfo[data.type].call(this, data);
			}
			elchild(this.body, element('div', {className:'fade'}));
		};

		return component;
	}

	/**
	 * exit bottom component
	 * @return {CButtonPanel}
	 */
	function initExitButtonPanel () {
		var component = new CButtonPanel(module.page);
		component.Init(remoteControlButtonsImagesPath, module.page.handle.querySelector('.body .footer .exit div.cbpanel-main'));
		// buttons with handlers
		component.btnExit  = component.Add(KEYS.EXIT,  'exit.png',  configuration.newRemoteControl ? _('Exit') : '', function(){
			module.actions.exit();
		});
		return component;
	}

	/**
	 * bottom line of buttons component
	 * @return {CButtonPanel}
	 */
	function initButtonPanel () {
		var component = new CButtonPanel(module.page);
		component.Init(remoteControlButtonsImagesPath, module.page.handle.querySelector('.body .footer .main div.cbpanel-main'));
		// buttons with handlers
		component.btnMenu  = component.Add(KEYS.MENU,  'menu.png',  configuration.newRemoteControl ? _('Menu') : '', function(){
			module.actions.menu();
		});
		component.btnFrame = component.Add(KEYS.INFO, 'info.png', module.preview.isVisible ? _('Hide<br>info panel') : _('Show<br>info panel'), function(){
			module.actions.frame();
		});
		return component;
	}

	/**
	 * main content list component
	 * @return {CHelpList}
	 */
	function initLister () {
		var component = new CHelpList(module.page);
		component.Init(module.page.handle.querySelector('.body .content .cslist-main'));
		component.SetBreadCrumb(module.breadCrumb);
		component.SetSearchBar(module.searchBar);
		component.SetButtonPanel(module.exitButtonPanel);
		component.SetButtonPanel(module.buttonPanel);
		component.SetPreviewPanel(module.preview);
		return component;
	}

	/**
	 * modal menu component
	 * @return {CModal}
	 */
	function initListMenu () {
		 // modal window with menu
		var component = new CModal(module.page);
		component.onShow = function () {
			// prepare
			var currentItem = module.lister.Current();
			// set
			component.menu.gedit.slist.Hidden(component.menu.gedit.iopen,    currentItem === null);

			// always go to edit tab
			component.menu.Switch(component.menu.gedit);

			component.menu.Activate();
		};

		/**
		 * main side menu
		 * @type {CGroupMenu}
		 */
		component.menu = new CGroupMenu(component);
		component.menu.Init(module.page.handle.querySelector('div.cgmenu-main.list'));

		component.Init(element('div', {className: "cmodal-menu"}, component.menu.handle));

		// mouse click on empty space should close modal menu
		component.handle.onclick = function(){ component.Show(false); };

		component.EventHandler = function ( event ) {
			switch ( event.code ) {
				case KEYS.EXIT:
				case KEYS.MENU:
					module.listMenu.Show(false);
					break;
				default:
					module.listMenu.menu.EventHandler(event);
			}
		};

		// group
		component.menu.gedit = component.menu.AddGroup('gedit', _('Operations'), {
			onclick: function () {
				var items, iid = this.iid;
				// close the menu and apply
				module.listMenu.Show(false);
				// selected action id
				switch ( iid ) {
					case MEDIA_ACTION_OPEN:
						module.lister.Current().onclick();
						break;
					case MEDIA_ACTION_EXPAND_ALL:
						module.lister.OpenAll(true);
						module.lister.SetPosition(module.lister.activeItem);
						break;
					case MEDIA_ACTION_COLLAPSE_ALL:
						module.lister.OpenAll(false);
						module.lister.Focused(module.lister.FindOne());
						break;
				}
				// prevent default
				return false;
			}
		});
		// group items
		component.menu.gedit.iopen     = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_OPEN, _('Open'), {icon: remoteControlButtonsImagesPath + 'ok.png'});
		component.menu.gedit.iexpand     = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_EXPAND_ALL, _('Expand all'));
		component.menu.gedit.icollapse   = component.menu.AddItem(component.menu.gedit, MEDIA_ACTION_COLLAPSE_ALL, _('Minimize all'));

		// default group
		component.menu.Switch(component.menu.gedit);
		return component;
	}

	function initListBlock () {
		var component = new CBase(module.page);
		component.Init(module.page.handle.querySelector('tr.content.list'));
		component.showAttr = 'table-row';
		return component;
	}

	function initArticleBlock () {
		var component = new CBase(module.page);
		component.Init(module.page.handle.querySelector('tr.content.article'));
		component.showAttr = 'table-row';
		component.$content = component.handle.querySelector(".content");
		component.SetContent = function( content ){
			component.$content["default"] = content;
			component.$content.innerHTML = content;
		};
		component.onShow = function(){
			component.$content.scrollTop = 0;
		};

		component.HighlightText = function( searchTerm ){
			if (!searchTerm) {
				component.$content.innerHTML = component.$content["default"];
				return;
			}
			var highlightStartTag = "<span class='highlighted' tabindex='1'>",
				highlightEndTag = "</span>",
				bodyText = component.$content["default"],
				newText = '',
				i = -1,
				lcSearchTerm = searchTerm.toLowerCase(),
				lcBodyText = bodyText.toLowerCase();
			while (bodyText.length > 0) {
				i = lcBodyText.indexOf(lcSearchTerm, i+1);
				if (i < 0) {
					newText += bodyText;
					bodyText = '';
				} else {
					// skip anything inside an HTML tag
					if (bodyText.lastIndexOf(">", i) >= bodyText.lastIndexOf("<", i)) {
					// skip anything inside a <script> block
						if (lcBodyText.lastIndexOf("/script>", i) >= lcBodyText.lastIndexOf("<script", i)) {
							newText += bodyText.substring(0, i) + highlightStartTag + bodyText.substr(i, searchTerm.length) + highlightEndTag;
							bodyText = bodyText.substr(i + searchTerm.length);
							lcBodyText = bodyText.toLowerCase();
							i = -1;
						}
					}
				}
			}
			return (component.$content.innerHTML = newText) !== bodyText;
		};

		component.FocusFirstHighlighted = function (){
			var element;
			if (element = component.$content.querySelector(".highlighted"))
				element.focus()
		};

		component.EventHandler = function(event){
			switch (event.code){
				case KEYS.UP:
					component.$content.scrollByLines(-2);
					break;
				case KEYS.DOWN:
					component.$content.scrollByLines(2);
					break;
				case KEYS.PAGE_DOWN:
					component.$content.scrollByPages(1);
					break;
				case KEYS.PAGE_UP:
					component.$content.scrollByPages(-1);
					break; }
		};
		return component;
	}

	/**
	 *
	 * @param {number} mode
	 * @param {boolean} [force]
	 */
	module.setMode = function ( mode, force ) {
		// new and old modes are different
		if ( this.mode !== mode || force === true ) {
			this.mode = mode;
			echo(this.mode);
			switch ( this.mode ) {
				case this.MODE_LIST:
					// content
					module.listBlock.Show(true, false);
					module.articleBlock.Show(false, false);
					module.lister.Activate(true);
					// footer
					module.buttonPanel.Hidden(module.buttonPanel.btnMenu, false);
					module.buttonPanel.Hidden(module.buttonPanel.btnFrame, false);
					break;
				case this.MODE_ARTICLE:
					// content
					module.articleBlock.Show(true, false);
					module.listBlock.Show(false, false);
					module.lister.Activate(false);
					module.searchBar.SetValue('');
					// footer
					module.buttonPanel.Hidden(module.buttonPanel.btnMenu, true);
					module.buttonPanel.Hidden(module.buttonPanel.btnFrame, true);
					break;
			}
		}
	};

	/**
	 * View initialization
	 */
	module.init = function () {
		// localization
		gettext.init({name:getCurrentLanguage()}, function(){
			echo('ready', 'gettext.init');
			// create all components and fill everything
			module.fill();
			// prepare images to cache
			// buttons
			var imageList = ['exit.png', 'menu.png', 'f4.png'].map(function(image) {
				return remoteControlButtonsImagesPath + image;
			});

			// media
			imageList = imageList.concat(['ico_filter.png', 'type_201.png', 'type_202.png'].map(function(image) {
				return  PATH_ROOT + 'public/img/' + (WINDOW_WIDTH > 1280 ? "1920" : "1280") + '/media/' + image;
			}));

			// submenu
			imageList = imageList.concat(['ico_search.png', 'ico_search2.png'].map(function(image) {
				return PATH_IMG_PUBLIC + image;
			}));

			// images has been loaded
			imageLoader(imageList, function () {
				echo('ready', module.page.name);
				// show main page
				module.show();
			});
		});
	};

	/**
	 * View filling with components
	 */
	module.fill = function () {
		// page with its components creation and filling
		module.page            = initPage();
		module.searchBar       = initSearchBar();
		module.breadCrumb      = initBreadCrumb();
		module.preview         = initPreview();
		module.exitButtonPanel = initExitButtonPanel();
		module.buttonPanel     = initButtonPanel();
		module.lister          = initLister();
		module.listMenu        = initListMenu();
		module.listBlock       = initListBlock();
		module.articleBlock    = initArticleBlock();

		// get folders and urls data
		app.models.main.bind("onLoad", function(tree){
			// apply
			if (Array.isArray(tree)){
				// render root level
				module.lister.SetTree(tree, true);
				module.breadCrumb.Push('/', 'type_' + MEDIA_TYPE_HELP_ROOT + '.png','', 'root');
				module.lister.Activate(true);
			}else{
				// set title
				module.breadCrumb.SetName(tree.title);
				module.breadCrumb.Push('/', 'type_' + MEDIA_TYPE_HELP_ROOT + '.png','', 'root');
				if (tree.type === MEDIA_TYPE_HELP_FOLDER){ // if root is folder
					module.lister.SetTree(tree.data, true);
					module.lister.Activate(true);
				} else { // if root is article
					module.lister.SetTree(tree, false);
					module.lister.OpenArticle(tree);
				}
			}
		});

		module.lister.bind("onArticleLoad", function(article){
			module.articleBlock.SetContent(article);
			module.setMode(module.MODE_ARTICLE);
		});

		stbEvent.bind("broadcast.storage.mount", function(){
			// show message on mount (at any time)
			setTimeout(function () {new CModalHint(currCPage, _('USB storage is connected'), 3000);}, 0);
		});

		stbEvent.bind("window.reload", function(){
			// reload window
			document.body.style.display = 'none';
			window.location.reload();
		});

		stbEvent.bind("window.load", function(message){
			// set new URL
			document.body.style.display = 'none';
			window.location = message.data;
		});

		app.models.main.load();
	};

	/**
	 * View is ready to display
	 */
	module.show = function () {
		// apply view mode
		module.setMode(this.MODE_LIST);
		// display main page
		module.page.Show(true);
	};

	/**
	 * Global navigation key actions
	 * @namespace
	 */
	module.actions = {
		exit : function () {
			echo('module.actions.exit');
			if (module.lister.tree.type === MEDIA_TYPE_HELP_ARTICLE){ // root is article
				app.exit();
				return;
			}else{ // root is folder
				if ( module.mode === module.MODE_LIST ) { // list mode
					if (module.lister.filterText === ''){
						app.exit();
					}else{
						module.searchBar.SetValue(module.lister.filterText = '', true);
						module.lister.ShowAll();
						module.breadCrumb.Pop();
					}
				} else { // article mode
					while(module.breadCrumb.Tip().iid !== "root" && module.breadCrumb.Tip().iid !== "filter"){
						module.breadCrumb.Pop();
					}
					if (module.breadCrumb.Tip().iid === "filter"){
						clearTimeout(module.searchBar.timer);
						module.searchBar.SetValue(module.breadCrumb.Tip().querySelector(".cbcrumb-text").innerHTML, true);
					}
					module.setMode(module.MODE_LIST); // switch to list mode
				}
			}
		},

		frame : function ( state ) {
			state = state !== undefined ? state : !module.preview.isVisible;
			// invert visibility
			module.preview.Show(state, false);
			// apply helper css class (for long text trimming)
			module.buttonPanel.Rename(module.buttonPanel.btnFrame, module.preview.isVisible ? _('Hide<br>info panel') : _('Show<br>info panel'));
			if (state === true){
				module.preview.handle.parentNode.classList.add('preview');
			}else{
				module.preview.handle.parentNode.classList.remove('preview');
			}
		},

		menu : function () {
			// web mode
			if ( module.mode === module.MODE_LIST ) {
				module.listMenu.Show(true);
			}
		},

		tv : function () {
			// hide all menus
			module.page.handle.parentNode.style.backgroundColor = '#010101';
			stbWindowMgr.SetVirtualKeyboardCoord('none');
			stbWindowMgr.showPortalWindow();
		}
	};

	// export
	return module;
}(window, app));
