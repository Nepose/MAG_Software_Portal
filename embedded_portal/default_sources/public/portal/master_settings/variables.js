'use strict';

/* jshint unused:false */

var focusElement = 0,
	masterSettingsScreen = 1,
	ethernetMonitorTime = 1,
	netMessageType = -1,
	wifiSave = '',
	timeZoneId = '',
	wifiLoad = false,
	rebootDevice = false,
	buttonDisable = false,
	internetMonitorFlag = true,
	languagesArr = null,
	masterToWrite = ['', '', '', ''],
	wifiOrTzoneArr = [],
	timeout = [],
	navigElements = [],
	language = [],
	timezone = [],
	masterSettingsTimer = [],
	pingXmlhttp = {};
