/**
 * Help main data model handling
 * @namespace
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */
app.models.main = (function(app){
	'use strict';

	/**
	 * global properties
	 * @namespace
	 */
	var module = {
		tree   : {},
		options : {},
		pagesFile: 'pages.json',
		pagesLocation: 'pages/'
	};

	/**
	 * Loads articles data
	 */
	module.load = function ( ) {
		var self = this, data, path,
			root = window.location.search.split('=')[1],
			language = getCurrentLanguage();
			echo(root,'ROOT');
			if (root){
				path = root.split('/');
			}
		ajax('GET', module.pagesLocation + language + '/' + module.pagesFile, function (pages){
			data = module.prepareData(JSON.parse(pages), module.pagesLocation + language + '/');
			if (path !== undefined){
				path.forEach(function(key){
					if (data.data !== undefined) {data = data.data;}
					data.forEach(function(el){
						if (el.key === key){
							data = el;
						}
					});
				});
			}
			module.tree = data;
			echo(module.tree, 'data');
			self.trigger('onLoad', module.tree);
		});
	};

	/**
	 * Prepare data from file
	 */
	module.prepareData = function ( data, path ) {
		data.forEach(function (el) {
			if (el.data !== undefined){
				el.type = MEDIA_TYPE_HELP_FOLDER;
				module.prepareData(el.data, path + el.key + '/');
			}else{
				el.type = MEDIA_TYPE_HELP_ARTICLE;
			}
			el.opened = true;
			el.path = path + el.key + '.html';
		});
		return data;
	};

	/**
	 * Add events functionality to model
	 */
	Events.inject(module);

	// export
	return module;
}(app));
