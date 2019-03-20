/**
 * Records Manager main data model handling
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';

app.models.main = (function ( app ) {
	// declarations
	var module = {
		environmentData: null
	};
	// PVR records data
	var data = [];

	/**
	 * Loads data
	 * @return {Array} data extracted by API
	 */
	module.load = function () {
		var arr = [],
			name;

		try {
			arr = JSON.parse(pvrManager.GetAllTasks());
		} catch ( e ) {
			echo(e);
			arr = [];
		}

		arr.forEach(function ( item ) {
			name = item.fileName.split('/');
			item.name = name[name.length - 3] + ' ' + name[name.length - 1].split('_').join(':');
			item.duration = item.startTime && item.endTime ? item.endTime - item.startTime : 0;

			if ( Number(item.errorCode) === 0 ) {
				switch ( item.state ) {
					case 1: // waiting
						item.status = _('Scheduled');
						item.type = MEDIA_TYPE_PVR_SHED;
						break;
					case 2: // write
						item.status = _('Recording');
						item.type = MEDIA_TYPE_PVR_REC;
						break;
					case 3: // stay error
						item.status = _('Recording error');
						item.type = MEDIA_TYPE_PVR_ERR;
						break;
					case 4: // complete
						item.status = _('Completed');
						item.type = MEDIA_TYPE_PVR_DONE;
						break;
				}
			} else {  // try to decide what kind of error it is
				item.state = 3;
				item.type = MEDIA_TYPE_PVR_ERR;
				switch ( item.errorCode ) {
					case -2:
						item.status = _('Not enough disk space');
						break;
					case -3:
						item.status = _('Incorrect time');
						break;
					case -5:
						item.status = _('Wrong name or path');
						break;
					case -6:
						item.status = _('Duplicated file');
						break;
					case -7:
						item.status = _('Wrong URL');
						break;
					case -9:
						item.status = _('Too many active records processed');
						break;
					case -11:
						item.status = _('Not enough disk space');
						break;
					default:
						item.status = _('Recording error');
						break;
				}
			}
		});

		module.environmentData = JSON.parse(gSTB.GetEnv(JSON.stringify({varList:['mount_media_ro']})));

		return arr;
	};

	/**
	 * getter
	 */
	module.get = function () {
		return data;
	};

	// export
	return module;
}(app));
