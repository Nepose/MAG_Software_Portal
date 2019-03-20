/**
 * Loading screen for multiply portals and error page. Data handling module.
 * @author Fedotov Dmytro <comeOn.doYouWantToLiveForever@gmail.com>
 */

'use strict';


app.data = (function () {
	// declarations
	var module = {};

	/**
	 * get all data about portals from storage
	 * @returns {Object} data portals data
	 */
	module.getPortals = function () {
		var data = gSTB.LoadUserData('portals.json');
		try {
			data = JSON.parse(data);
		} catch ( err ) {
			echo('JSON.parse(LoadUserData("portals.json")); -> ERROR ->' + err);
			return {'enable': false};
		}
		echo(data, 'data JSON.parse(LoadUserData("portals.json"))');

		// Multiportal mode should use same minimal delay time as default mode.
		// This fix problems with slow wifi start.
		if ( data.time === 1 || data.time === "1" ) {
			data.time = 3; // migration to new minimal value
			gSTB.SaveUserData('portals.json', JSON.stringify(data));
		}

		return data;
	};


	/**
	 * Read DHCP portal load permission from file. Get DHCP portal url.
	 * @returns {Object} data portal url and permission
	 */
	module.getDHCPData = function () {
		var answer, data;
		// get data from file
		answer = gSTB.GetEnv(JSON.stringify({varList: ['use_portal_dhcp', 'portal_dhcp']}));
		answer = JSON.parse(answer);

		if ( answer.result.errMsg ) {
			// data read error. Turn off DHCP loading.
			data = {enable: false, url: ''};
		} else {
			data = {enable: answer.result.use_portal_dhcp === 'true', url: answer.result.portal_dhcp};
		}

		return data;
	};


	/**
	 * Read environment variables.
	 * @returns {Object} data environment variables
	 */
	module.getEnvData = function () {
		var answer, data;
		// get data from file
		answer = gSTB.GetEnv(JSON.stringify({varList: ['portal1', 'portal2', 'custom_url_hider', 'autoPowerDownTime', 'standByMode', 'hdmi_event_delay']}));
		answer = JSON.parse(answer);

		if ( answer.result.errMsg ) {
			data = {portal1: '', portal2: '', custom_url_hider: false, autoPowerDownTime: 0, hdmi_event_delay:0}; // data read error.
		} else {
			data = {
				portal1: decodeURI(answer.result.portal1),
				portal2: decodeURI(answer.result.portal2),
				custom_url_hider: answer.result.custom_url_hider === 'true',
				standByMode: Number(answer.result.standByMode),
				hdmiEventDelay: Number(answer.result.hdmi_event_delay || 0),
				autoPowerDownTime: Number(answer.result.autoPowerDownTime || 0)
			};
		}

		return data;
	};


	/**
	 * Read remote control access data from user fs.
	 * @returns {Object} data access data
	 */
	module.getRCData = function () {
		var remoteControlFileData = gSTB.LoadUserData('remoteControl.json');
		try {
			remoteControlFileData = JSON.parse(remoteControlFileData);
		} catch ( error ) {
			remoteControlFileData = {enable: false, deviceName: '', password: ''};
			gSTB.SaveUserData('remoteControl.json', JSON.stringify(remoteControlFileData));
		}

		return remoteControlFileData;
	};


	/**
	 * ini files read and system migration function.
	 * @param {Object} envVars environment data
	 */
	module.migration = function ( envVars ) {
		var newPortalsFile;

		// create portals.json file if not exist
		if ( gSTB.LoadUserData('portals.json') === '' ) {
			newPortalsFile = {
				'enable': false,
				'time': '0',
				'def': 0,
				'portals': [
					{'name': '', 'url': '', 'enable': false},
					{'name': '', 'url': '', 'enable': false},
					{'name': '', 'url': '', 'enable': false},
					{'name': '', 'url': '', 'enable': false},
					{'name': '', 'url': '', 'enable': false},
					{'name': '', 'url': '', 'enable': false},
					{'name': '', 'url': '', 'enable': false},
					{'name': '', 'url': '', 'enable': false}
				]
			};
			// if we have portal1 we should save it
			if ( envVars.portal1 ) {
				newPortalsFile.def = 1;
				newPortalsFile.portals[0].enable = true;
				newPortalsFile.portals[0].name = '';
				newPortalsFile.portals[0].url = envVars.portal1;
			}
			// if we have portal2 we should save it too
			if ( envVars.portal2 ) {
				newPortalsFile.def = 2;
				newPortalsFile.portals[1].enable = true;
				newPortalsFile.portals[1].name = '';
				newPortalsFile.portals[1].url = envVars.portal2;
			}
			gSTB.SaveUserData('portals.json', JSON.stringify(newPortalsFile));
			echo('Migration completed. New portals data file saved');
		}
	};

	/**
	 * if operator set env variables by force we should save and use it
	 * @param {Object} portalsData portals data from portals.json
	 * @param {Object} envVars environmental variables values
	 */
	module.checkForceEnvSet = function ( portalsData, envVars ) {
		var saveTrigger = false;
		// if we have new portal1 we should save it
		if ( portalsData.portals[0].url !== envVars.portal1 ) {
			portalsData.def = envVars.portal1 ? 1 : portalsData.def;
			portalsData.portals[0].enable = envVars.portal1 ? true : false;
			portalsData.portals[0].name = '';
			portalsData.portals[0].url = envVars.portal1;
			saveTrigger = true;
		}
		// if we have new portal2 we should save it too
		if ( portalsData.portals[1].url !== envVars.portal2 ) {
			portalsData.def = envVars.portal2 ? 2 : portalsData.def;
			portalsData.portals[1].enable = envVars.portal2 ? true : false;
			portalsData.portals[1].name = '';
			portalsData.portals[1].url = envVars.portal2;
			saveTrigger = true;
		}

		if ( saveTrigger ) {
			gSTB.SaveUserData('portals.json', JSON.stringify(portalsData));
			echo('force environmental vars set completed. New portals data file saved');
		}

		// check if there is at least one working portal
		portalsData.empty = !portalsData.portals.some(function ( item ) {return item.url && item.enable;});

		return portalsData;
	};

	// export
	return module;
}());
