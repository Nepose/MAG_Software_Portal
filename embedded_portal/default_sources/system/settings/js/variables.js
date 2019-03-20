'use strict';

/* jshint unused:false */

var mainLang = getCurrentLanguage(),
	butDisable = false,
	portals = {},
	butUdDownDisable = false,
	toSave = '',
	navigationBackFunction = null,
	saveFunction = null,
	backElement = [],
	backIndex = 0,
	wifiLoadVariation = 0,
	scrollPosition = 0,
	update_url = '',
	timer = {},
	checkInp = 1,
	settChanges = 0,
	STORAGE_INFO = [],
	HDD_INFO = [],
	layoutOrderChanged = false,
	layoutsString = '',
	wiFiList = null,
	btList = null,
	BT_DEVICE_NEW = 0, // new discovered device
	BT_DEVICE_PAIRED = 1, // paired device
	BT_DEVICE_CONNECTED = 2, // paired and connected device
	btInfoSideBar = null,
	btPinRequestModal = null,
	btConnectionFailedAlert = null,
	btDiscoveredDevices = [],
	wirelessWiFiVisited = false,
	wiFiAccessPoint = null,
	wiFiInfoSideBar = null,
	saveButtonActive = true,
	read = null,
	alertFramerateMsg = true,
	alertHdmiMsg = true,
	reload = {
		device: false,
		portal: false
	},
	as = {
		page: 0,
		pages: {
			MAIN: 0,
			LIST: 1,
			INFO: 2,
			ELEMENTS: 3,
			WIFI: 4,
			UPDATE: 5,
			BT: 6
		},
		page_list: {
			0: 'main_page',
			1: 'list_page',
			2: 'info_page',
			3: 'elements_page',
			4: 'wifi_page',
			5: 'update_page',
			6: 'bluetooth_page'
		},
		list: 0,
		lists: {
			main: 0,
			lan: 1
		}
	},
	list = {
		main: [],
		lan: [],
	    servers: [],
		lan_wired: [],
		lan_pppoe: [],
		lan_wifi: [],
		lan_bt: [],
		lanInfo: [],
		footers: []
	};
