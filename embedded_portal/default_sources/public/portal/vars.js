/**
 * Global variables and objects
 */

'use strict';

/* jshint unused:false */

var MODEL_TYPE             = gSTB.GetDeviceModelExt(),  // STB identifier
	environment            = {},     // global environment vars

	STORAGE_INFO           = [],  // result of /usr/bin/get_storage_info.sh
	HDD_INFO               = [],  // result of /usr/bin/get_hdd_info.sh

	SMB_ARRAY              = [],              // list of all auto-mounted samba folders
	SMB_DATA               = null,            // current mounted samba share
	SMB_MOUNTED            = false,           // flag is a samba share mounted to the SMB_PATH
	//SMB_MOUNTED_ADDR       = '',              // address of successfully mounted SMB share due to multiple IPs
	SMB_AUTH               = {},              // samba shares login and pass in form: {ip:{share_name:{login:"",pass:""},}}
	SMB_SRV_AUTH           = {},              // samba servers login and pass in form: {url: {login: "", password: ""},}
	SMB_PATH               = '/ram/mnt/smb',  // dir for samba mount point

	NFS_ARRAY              = [],              // list of all auto-mounted nfs folders
	NFS_DATA               = null,            // current mounted nfs share
	NFS_MOUNTED            = false,           // flag is a nfs share mounted to the NFS_PATH
	NFS_PATH               = '/ram/mnt/nfs',  // dir for nfs mount point

	FAVORITES              = {},     // list of saved items
	FAVORITES_NEW          = {},     // updated list of items (initially is the same as FAVORITES)
	FAVORITES_CHANGED      = false,  // flag to monitor fav list change

	CURRENT_NETWORK_STATE  = false,  // network is set or not
	CURRENT_WIFI_STATE	   = false,
	CURRENT_INTERNET_STATE = false,  // internet is present or not

	currCPage              = null,  // active and visible at the moment CPage object
	baseCPage              = null,  // default CPage object (should be assigned asap)

	PLSCFG                 = {},

// auto-update operator playlist
	OPERATORS_PLS_AUTOREFRESH = 0,     // 0 - function disabled, 1 - function enabled
	OPERATORS_PLS_GROUP_NAME  = '',    // group name in which to save channels (if empty string root location will be used)
	OPERATORS_PLS_URL         = 'http://192.168.1.60:8000/list.m3u',
	IPTV_PLAYBACK_ON_START	  = false,

	// default value (redefined later on portal init)
	VIDEO_MODE = '576i',
	controlModel = 'SRC4807',

	// TimeShift settings
	ts_time     = 3600,
	ts_endType  = 1,
	ts_exitType = 1,
	ts_lag      = 0,
	ts_sol      = {
		720  : [290,12],
		1280 : [650,14],
		1920 : [975,21]
	},
	dvbTypes = [];
