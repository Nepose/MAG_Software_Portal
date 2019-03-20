/**
 * Internet Bookmarks Manager main data model handling
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * @namespace
 */
app.models.main = (function () {
	/**
	 * global properties
	 * @namespace
	 */
	var module = {
		urls    : {},
		dirs    : {},
		options : {},
		changed : false,
		environmentData: null
	};

	/**
	 * Indexed DataBase
	 * @type {jsonDb}
	 */
	var db = new jsonDb();

	/**
	 * file to store all the data
	 * @type {string}
	 */
	var dbFileName = 'bookmarks.json';

	/**
	 * Loads bookmarks data
	 * Makes the migration from the old to the new data format if necessary
	 */
	module.load = function () {
		var	bmData      = gSTB.LoadUserData(dbFileName),
			BM_TYPE_FLD = 0,  // bookmark type const: folder
			BM_TYPE_URL = 1;  // bookmark type const: web address

		// no new data
		if ( bmData === '' ) {
			// data tables creation (duplication of data tables creation is more optimal in this case. reduces the frequency of such calls)
			module.urls    = db.table('urls');
			module.dirs    = db.table('dirs');
			module.options = db.table('options');

			// tables structure
			module.urls.init('id', 'name', 'time', 'dir');
			module.dirs.init('id', 'name', 'time');
			module.options.init('id', 'data');

			// get the old one
			bmData = gSTB.LoadUserData('bmdata');

			// parse and convert old bookmarks to new
			if ( bmData ) {
				// find data in the string
				try {
					// current timestamp
					var time = Math.round(+new Date()/1000);
					// start from root elements
					var rootItems = /\[root](.*)\[\/root]/.exec(bmData);
					// there are some items found
					if ( Array.isArray(rootItems) && rootItems[1] ) { rootItems = eval(rootItems[1]); }
					// prepare all items
					if ( Array.isArray(rootItems) ) {
						rootItems.forEach(function(rootItem){
							// folder
							if ( parseInt(rootItem.type, 10) === BM_TYPE_FLD ) {
								var dirId = module.dirs.genId();
								module.dirs.add(dirId, decodeURI(rootItem.name), time);
								// look for sub-folder data
								var subItems = (new RegExp('\\[' + rootItem.name + '](.*)\\[/' + rootItem.name + ']')).exec(bmData);
								// sub-folder block is found
								if ( Array.isArray(subItems) && subItems[1] ) { subItems = eval(subItems[1]); }
								// prepare all sub-items
								if ( Array.isArray(subItems) ) {
									subItems.forEach(function(subItem){
										// only urls (there should be no sub-folders)
										if ( parseInt(subItem.type, 10) === BM_TYPE_URL ) {
											module.urls.add(subItem.url, decodeURI(subItem.name), time, dirId);
										}
									});
								}
							} // url
							else if ( parseInt(rootItem.type, 10) === BM_TYPE_URL ) {
								module.urls.add(rootItem.url, decodeURI(rootItem.name), time);
							}
						});
					}
				} catch ( e ) {
					echo(e, 'bmdata data parsing error');

					module.setDefaults(module.urls);
				}
			} else {
				module.setDefaults(module.urls);
			}

			// resave anyway
			module.save();
		} else {
			// new bookmarks are found so parse
			try {
				// link received data to db
				db.data = JSON.parse(bmData);

				// data tables linking
				module.urls    = db.table('urls');
				module.dirs    = db.table('dirs');
				module.options = db.table('options');
			} catch ( e ) {
				echo(e, dbFileName + ' data parsing error');

				// data tables creation (duplication of data tables creation is more optimal in this case. reduces the frequency of such calls)
				module.urls    = db.table('urls');
				module.dirs    = db.table('dirs');
				module.options = db.table('options');

				// tables structure
				module.urls.init('id', 'name', 'time', 'dir');
				module.dirs.init('id', 'name', 'time');
				module.options.init('id', 'data');

				module.setDefaults(module.urls);

				// save defaults
				module.save();
			}
		}

		module.environmentData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList:['mount_media_ro']})));

		echo(db.data, dbFileName + ' db data');
	};

	/**
	 * Sets default bookmarks
	 */
	module.setDefaults = function ( urls ) {
		var bookmarks = [
				{
					name: 'Google',
					url: 'http://www.google.com/'
				},
				{
					name: 'Yandex',
					url: 'http://www.yandex.ru/'
				},
				{
					name: 'Rambler',
					url: 'http://www.rambler.ru/'
				},
				{
					name: 'Yahoo',
					url: 'http://www.yahoo.com/'
				}
			],
			max = bookmarks.length,
			i;

		for ( i = 0; i < max; i++ ) {
			urls.set(bookmarks[i].url, {
				name: bookmarks[i].name,
				time: Math.round(+new Date()/1000),
				dirId: null
			});
		}
	};

	/**
	 * Stores the db data
	 */
	module.save = function () {
		gSTB.SaveUserData(dbFileName, JSON.stringify(db.data));
	};

	// export
	return module;
}());
