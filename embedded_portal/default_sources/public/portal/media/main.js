/**
 * Media components: general methods
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/**
 * Loads tv channels and favorites data
 * in case not found tries to import from the old format
 */
function importStbParams () {
	var tv_data = gSTB.LoadUserData('iptv.json'),
		fv_data = gSTB.LoadUserData('favorites.json'),
		oldConfFile = gSTB.ReadCFG();

	echo('file iptv.json:' + tv_data);
	echo('file favorites.json:' + fv_data);
	echo('file stb_param:' + oldConfFile);

	// Load data (new type)
	if ( !oldConfFile ) {
		// load new format
		// removed additional check tv_data !== "[]" && fv_data !== '{}'
		// it was messing with data importing forcing to do import on each portal start
		if ( tv_data !== '' && fv_data !== '' ) {
			try {
				tv_data = JSON.parse(tv_data);
				IPTVChannels.TVList.data = IPTVChannels.unescapeChanels(tv_data);
			} catch ( e ) {
				echo(e, 'TVChannels data parsing error');
				IPTVChannels.saveChanels([]);
			}
			try {
				FAVORITES = JSON.parse(fv_data);
				// clone to the FAVORITES_NEW
				for ( var name in FAVORITES ) {
					FAVORITES[name].markable = true;
					FAVORITES_NEW[name] = FAVORITES[name];
				}
			} catch ( e ) {
				echo(e, 'FAVORITES data parsing error');
				FAVORITES = {};
				FAVORITES_NEW = {};
				// save valid blank data
				gSTB.SaveUserData('favorites.json', '{}');
			}
		}
	} else {  // Old data (or both) file type found.
		var files = [],
			tvLastChange,
			fvLastChange,
			oldConfLastChange,
			i, j, data,
			tv_text = '',
			fv_text = '';

		// get last changes date
		gSTB.SetListFilesExt('favorites.json iptv.json stb_params');
		try {
			eval(gSTB.ListDir('/mnt/Userfs', true));
		} catch ( e ) {
			echo(e);
			files = [];
		}
		oldConfLastChange = files[0] ? Number(files[0].last_modified) : 0;
		try {
			eval(gSTB.ListDir('/mnt/Userfs/data', true));
		} catch ( e ) {
			echo(e);
			files = [];
		}
		fvLastChange = files[0] && files[0].last_modified ? Number(files[0].last_modified) : 0;
		tvLastChange = files[1] && files[1].last_modified ? Number(files[1].last_modified) : 0;
		gSTB.SetListFilesExt('.' + configuration.registersTypes.join(' .'));

		echo('iptv LastChange=' + tvLastChange + ', fav LastChange=' + fvLastChange + ', oldConf LastChange=' + oldConfLastChange);

		// Migration from old to new type
		if ( oldConfLastChange >= tvLastChange && oldConfLastChange >= fvLastChange ) {
			// some old data found
			if ( oldConfFile !== '' ) {
				i = oldConfFile.indexOf('[TV Channels]');
				if ( i !== -1 ) {
					j = oldConfFile.indexOf('[/TV Channels]');
					if ( j !== -1 )
						tv_text = oldConfFile.substr(i + 13, j - i - 13);
				}
				i = oldConfFile.indexOf('[Favorites]');
				if ( i !== -1 ) {
					j = oldConfFile.indexOf('[/Favorites]');
					if ( j !== -1 )
						fv_text = oldConfFile.substr(i + 11, j - i - 11);
				}
				try {
					if ( tv_text !== '' && tv_text !== undefined ) {
						data = oldTV_to_new(eval(tv_text));
						data = IPTVChannels.unescapeChanels(data);
						IPTVChannels.checkTS(data, true);
					} else {
						IPTVChannels.saveChanels([]);
					}
				} catch ( e ) {
					IPTVChannels.saveChanels([]);
					echo(e, 'TVChannels parsing from the old file');
				}
				try {
					if ( fv_text !== '' && fv_text !== undefined ) {
						data = oldFV_to_new(eval(fv_text || '{}'));
						MediaBrowser.FavSave(data);
					} else {
						MediaBrowser.FavSave({});
					}
				} catch ( e ) {
					MediaBrowser.FavSave({});
					echo(e, 'Favorites parsing from the old file');
				}
			}
		}
		gSTB.WriteCFG('');
	}
}


/**
 * Converts old format tv channels to the new ones
 * @param {[Object]} data old channels
 * @return {[Object]} new list
 */
function oldTV_to_new ( data ) {
	var arr = [];
	for ( var i = 0; i < data.length; i++ ) {
		arr[i] = {};
		arr[i].name = data[i].name || '';
		if ( data[i].data ) {
			arr[i].data = oldTV_to_new(data[i].data);
			arr[i].type = MEDIA_TYPE_GROUP;
		} else {
			arr[i].type = MEDIA_TYPE_STREAM;
			arr[i].url = data[i].source;
			arr[i].tsOn = data[i].tsOn || false;
		}
	}
	return arr;
}


/**
 * Converts old format favorites to the new ones
 * @param {[Object]} data old favorites
 * @return {Object} new list
 */
function oldFV_to_new ( data ) {
	var list = {};
	if ( Array.isArray(data) ) {
		data.forEach(function ( item ) {
			var fav = {};
			fav.name = unescape(item.name).trim();
			fav.size = fav.size || 0;
			fav.url = unescape(item.source).trim();
			fav.markable = true;
			if ( item.fileType === 'stream' ) {
				fav.type = MEDIA_TYPE_STREAM;
				fav.tsOn = item.tsOn === 'true';
				fav.ext = '';
			} else {
				fav.ext = fav.name.split('.').pop();
				fav.type = MediaBrowser.FileList.ext2type[fav.ext.toLowerCase()];
			}
			list[fav.url] = fav;
		});
	}
	return list;
}


function getLanguageNameByCode ( code ) {
	var i, j, ref_codes;

	if ( code.length ) {
		for ( i = 0; i < iso639.length; i++ ) {
			ref_codes = iso639[i].code;
			for ( j = 0; j < ref_codes.length; j++ ) {
				if ( ref_codes[j] === code[0].toLowerCase() ) {
					code = [];
					code[0] = iso639[i].name;
					code[1] = i;
					return code;
				}
			}
		}
	}
	return null;
}


function getIso639LangCode ( langArr ) {
	var code = '';
	for ( var i = 0; i < langArr.length; i++ ) {
		if ( langArr[i] ) {
			code = langArr[i];
			break;
		}
	}
	return code;
}
