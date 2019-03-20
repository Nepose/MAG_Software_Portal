/**
 * Global types
 * @author Stanislav Kalashnik <sk@infomir.eu>
 */

'use strict';

/* jshint unused:false */

// media types ids
var MEDIA_TYPE_NONE         = 0,
	MEDIA_TYPE_STORAGE_SATA = 1,   // internal hdd
	MEDIA_TYPE_STORAGE_USB  = 2,   // ubs stick/hdd
	MEDIA_TYPE_STORAGE_SD   = 3,   // SD card
	MEDIA_TYPE_STORAGE_MMC  = 4,   // MMC card

	// SAMBA
	MEDIA_TYPE_SAMBA_ROOT   = 10,  // samba top level item
	MEDIA_TYPE_SAMBA_GROUP  = 11,  // samba workgroup
	MEDIA_TYPE_SAMBA_HOST   = 12,  // samba computer with shares
	MEDIA_TYPE_SAMBA_SHARE  = 13,  // samba computer share

	// UPnP
	MEDIA_TYPE_UPNP         = 20,  // dlna
	MEDIA_TYPE_UPNP_ROOT    = 21,  // dlna top level, new implementation
	MEDIA_TYPE_UPNP_HOST    = 22,  // dlna server level, new implementation
	MEDIA_TYPE_UPNP_FOLDER  = 23,  // dlna folder level, new implementation

	// NFS
	MEDIA_TYPE_NFS_ROOT     = 30,  // nfs top level item
	MEDIA_TYPE_NFS_HOST     = 31,  // nfs computer with shares
	MEDIA_TYPE_NFS_SHARE    = 32,  // nfs computer share

	// time shift
	MEDIA_TYPE_RECORDS_ROOT = 50,  // time shift main
	MEDIA_TYPE_RECORDS_CHAN = 51,  // time shift channel name
	MEDIA_TYPE_RECORDS_DATE = 52,  // time shift date collection
	MEDIA_TYPE_RECORDS_ITEM = 53,  // time shift media item to play

	// folders and media items
	MEDIA_TYPE_BACK         = 60,
	MEDIA_TYPE_FOLDER       = 61,
	MEDIA_TYPE_VIDEO        = 62,
	MEDIA_TYPE_AUDIO        = 63,
	MEDIA_TYPE_IMAGE        = 64,
	MEDIA_TYPE_TEXT         = 65,  // .txt .srt .sub .ass
	MEDIA_TYPE_ISO          = 66,
	MEDIA_TYPE_PLAYLIST     = 67,  // .m3u .m3u8
	MEDIA_TYPE_CUE          = 68,  // container for .flac .ape .iso .mp3 and so on
	MEDIA_TYPE_CUE_ITEM     = 69,  // .flac .ape .iso .mp3 internal item
	MEDIA_TYPE_URL          = 70,  // links for bookmark manager
	MEDIA_TYPE_GROUP        = 80,  // collection of tv channels
	MEDIA_TYPE_STREAM       = 81,  // a stream/url inside the playlist or tv channel
	MEDIA_TYPE_STREAM_TS    = 82,  // tv channel timeShift
	MEDIA_TYPE_DVB          = 83,
	MEDIA_TYPE_FAVORITES    = 84,  // virtual persistent main playlist

	// PVR
	MEDIA_TYPE_PVR_ROOT     = 90,  // root of all content (home) for Record Manager
	MEDIA_TYPE_PVR_SHED     = 91,  // pvr scheduled record
	MEDIA_TYPE_PVR_REC      = 92,  // pvr recording
	MEDIA_TYPE_PVR_ERR      = 93,  // pvr recording error
	MEDIA_TYPE_PVR_DONE     = 94,  // pvr record complete

	// ROOT
	MEDIA_TYPE_DVB_ROOT     = 100,
	MEDIA_TYPE_IB_ROOT      = 101,  // root of all content (home) for Internet Bookmarks
	MEDIA_TYPE_MB_ROOT      = 102,  // root of all content (home) for MediaBrowser
	MEDIA_TYPE_TV_ROOT      = 103,  // root of all content (home) for IPTV channels
	MEDIA_TYPE_EPG_ROOT     = 105,

	// Help
	MEDIA_TYPE_HELP_ROOT    = 200,
	MEDIA_TYPE_HELP_FOLDER  = 201,
	MEDIA_TYPE_HELP_ARTICLE = 202,
	MEDIA_TYPE_HELP_BACK    = 203;


// media actions ids
var MEDIA_ACTION_OPEN           = 1,
	MEDIA_ACTION_OPEN_SELECTED  = 2,
	MEDIA_ACTION_ITEM_MOUNT     = 3,
	MEDIA_ACTION_ITEM_UNMOUNT   = 4,
	MEDIA_ACTION_MOUNT_EDIT     = 5,
	MEDIA_ACTION_SELECT_ONE     = 6,
	MEDIA_ACTION_SELECT_ALL     = 7,
	MEDIA_ACTION_DESELECT       = 8,
	MEDIA_ACTION_INVERT         = 9,
	MEDIA_ACTION_CUT            = 10,
	MEDIA_ACTION_COPY           = 11,
	MEDIA_ACTION_PASTE          = 12,
	MEDIA_ACTION_DELETE         = 13,
	MEDIA_ACTION_EDIT           = 14,
	MEDIA_ACTION_SAVE           = 15,
	MEDIA_ACTION_CREATE_GROUP   = 16,
	MEDIA_ACTION_SORT_NONE      = 17,
	MEDIA_ACTION_SORT_TYPE      = 18,
	MEDIA_ACTION_SORT_EXT       = 19,
	MEDIA_ACTION_SORT_NAME      = 20,
	MEDIA_ACTION_SORT_SIZE      = 21,
	MEDIA_ACTION_SORT_TIME      = 22,
	MEDIA_ACTION_NEW_GROUP      = 23,
	MEDIA_ACTION_TOOLS_MOUNT    = 24,
	MEDIA_ACTION_TOOLS_UNMOUNT  = 25,
	MEDIA_ACTION_TOOLS_FORMAT   = 26,
	MEDIA_ACTION_TSEND_CICLICK  = 27,
	MEDIA_ACTION_TSEND_STOP     = 28,
	MEDIA_ACTION_TS_ON          = 29,
	MEDIA_ACTION_TS_OFF         = 30,
	MEDIA_ACTION_SUBTITLE_MOUNT = 31,
	MEDIA_ACTION_CREATE_RECORD  = 32,
	MEDIA_ACTION_ADD_ITEM       = 33,
	MEDIA_ACTION_ADD_OPER_TVLIST= 34,
	MEDIA_ACTION_ADD_TVLIST     = 35,
	MEDIA_ACTION_ADD_TVCHANNEL  = 36,
	MEDIA_ACTION_ADD_FOLDER     = 37,
	MEDIA_ACTION_AUTO_SCAN_DVB  = 38,
	MEDIA_ACTION_MANUAL_SCAN_DVB= 39,
	MEDIA_ACTION_DVB_EPG        = 40,
	MEDIA_ACTION_CLEAR_DVB      = 41,
	MEDIA_ACTION_STOP_RECORD    = 43,
	MEDIA_ACTION_ADD_FAV        = 44,
	MEDIA_ACTION_REMOVE_FAV     = 45,
	MEDIA_ACTION_EXPAND_ALL     = 46,
	MEDIA_ACTION_COLLAPSE_ALL   = 47,
	MEDIA_ACTION_DVB_EPG_GRID   = 48,
	MEDIA_ACTION_EXPORT_CHANNEL = 49,
	MEDIA_ACTION_PLAY			= 50;

var MEDIA_EXTENSION = {},
	MEDIA_TYPES = [MEDIA_TYPE_VIDEO, MEDIA_TYPE_AUDIO, MEDIA_TYPE_IMAGE, MEDIA_TYPE_TEXT, MEDIA_TYPE_ISO, MEDIA_TYPE_PLAYLIST, MEDIA_TYPE_CUE, MEDIA_TYPE_RECORDS_ITEM];

MEDIA_EXTENSION[MEDIA_TYPE_VIDEO]        = ['mpg', 'mpeg', 'mov', 'mp4', 'avi', 'mkv', '3gp', 'ts', 'vob', 'wmv', 'mts', 'm2t', 'm2v', 'divx', 'm2ts', 'm2p', 'tp', 'flv', 'mod', 'tod', 'asf', 'tts', 'm4v', 'trp', 'wtv'];
MEDIA_EXTENSION[MEDIA_TYPE_AUDIO]        = ['mp3', 'wav', 'ac3', 'ogg', 'oga', 'aiff', 'wv', 'tta', 'wma', 'aac', 'dts', 'flac', 'ape', 'm4a'];
MEDIA_EXTENSION[MEDIA_TYPE_IMAGE]        = ['jpg', 'jpeg', 'png', 'bmp', 'tif', 'tiff'/*, 'raw', 'gif'*/, 'raw', 'gif', 'cr2', 'nef', 'orf', 'iiq', 'ico', 'psd', 'webp', 'tif', 'tiff'];
MEDIA_EXTENSION[MEDIA_TYPE_TEXT]         = ['txt', 'srt', 'sub', 'ass'];
MEDIA_EXTENSION[MEDIA_TYPE_ISO]          = ['iso'];
MEDIA_EXTENSION[MEDIA_TYPE_PLAYLIST]     = ['m3u', 'm3u8'];  // 'pls','asx','xspf'
MEDIA_EXTENSION[MEDIA_TYPE_CUE]          = ['cue'];
MEDIA_EXTENSION[MEDIA_TYPE_RECORDS_ITEM] = ['tspinf'];
