History
=======

## 2018.12.10 ##

* support difference between mag254 and mag322 wifi event status implementation
* add mag420 model support


## 2018.12.05 ##

* correct updateList for MAG422


## 2018.11.30 ##

* fix UPnPRendererClear error
* change keydown listener to keypress in tattelecom code
* update dvb scanning modals


## 2018.11.15 ##

* fix focused out of array
* fix code style


## 2018.11.07 ##

* add mag422, remove PPPoE for mag422, mag424, mag425 from system settings


## 2018.10.30 ##

* fix error handler for playlist update request
* remove forcing enabling service button
* hide unsupported settings for IM2100V, IM2100VI (resolution and network settings)


## 2018.09.18 ##

* add contact data to warning text at "url is blocked" page
* add IM2100VI model support


## 2018.09.07 ##

* add check for async work of bluetooth API function at mag424 (stbBluetooth.enable)
* fix channels list loading
* fix start play object without url in player


## 2018.08.23 ##

* fix event propagation


## 2018.08.21 ##

* update manual
* update localization
* fix empty audio_initial_volume state


## 2018.08.13 ##

* fix change position


## 2018.08.07 ##

* fix localization


## 2018.07.30 ##

* fix saving zero volume
* fix localization


## 2018.07.19 ##

* disable stbUPnPRenderer and clear code


## 2018.07.11 ##

* fix current image date check in update


## 2018.06.01 ##

* increase portal loading delay in multiportal mode to fix slow wifi start


## 2018.05.24 ##

* add IM2100V model support
* remove games from portal
* remove games section from manual


## 2018.05.17 ##

* fix update check: remove influence of device local time zone


## 2018.05.07 ##

* fix incorrectly encoded urls in API event


## 2018.04.27 ##

* add IM2101 device support
* fix navigation in favorite, fix style in DVB Channels


## 2018.04.24 ##

* remove DVB settings for IM2102
* fix navigation in DVB channels
* fix DVB channels item style


## 2018.04.13 ##

* fix access control settings


## 2018.04.12 ##

* add modal window with info on url blocking


## 2018.04.10 ##

* add IM2102 device support


## 2018.04.03 ##

* add IM2100 device support
* change title LED brightness (standby) in settings
* add stbUPnP.deinit in system settings


## 2018.03.26 ##

* add MAG424 device support
* fix checkbox style in settings
* correct configs for MAG424/425/351/352


## 2018.02.19 ##

* add new timezone codes
* always check environment variables portal1 and portal2 for possible operator changes (and apply them)
* change statistic server url
* optimise auto update requests
* disable 1920x1080 graphic resolution for AuraHD4


## 2018.02.16 ##

* fix translation
* fix opening Home Media resources after UPnP failure
* fix retrieving search data from Google for autocomplete
* improve saving algorithm in timeshift
* don't show auto power down if timeshift is active
* renew environment variables values after correction by operator


## 2018.01.24 ##

* remove 1080p resolution selection in settings for mag322


## 2018.01.19 ##

* request timeout for retrieving the help archive has been increased
* fix video settings
* fix wifi keys generation page


## 2018.01.09 ##

* fix mounting share by hand
* remove DVB setting for AuraHD4


## 2017.12.26 ##

* fix wrong url for auto update on MAG276
* remove misspelling from auto update url in auraHD4
* comment cleanup trash download tasks for unmounted storages (cleanup triggers by unmount event)
* cleanup trash download tasks for unmounted storages (cleanup triggers by unmount event)


## 2017.12.18 ##

* fix value parsing for auto update condition variable


## 2017.11.29 ##

* add missing codec image to cache list
* fix item focusing in media browser on player event
* fix missing environment variables for sending headers on update
* optimize player and explorer pages switching

## 2017.11.27 ##

* add new headers (X-Portal1 and X-Portal2) in update list request
* fix save resolution in settings
* don't send update check request after update modal window exit


## 2017.11.20 ##

* add new headers in update list request
* disable password field for NFS mounting
* change logo for AuraHD 4


## 2017.11.17 ##

* add AC3+ audio type
* fix interface error in download app on quick multiple tasks creation
* add speed test for mag35*


## 2017.11.07 ##

* remove PPPoE for AuraHD*
* update updateList url for MAG256 and MAG351


## 2017.10.30 ##

* fix reload portal after change settings


## 2017.10.13 ##

* add untune dvb input in DVB channels
* fix focus item in Media Browser
* correct supported files types list for mag322


## 2017.09.28 ##

* add AuraHD4 device config and logo
* fix pause icon in download manager
* fix reload portal after change settings
* fix teletext settings
* add logo for mag425


## 2017.09.14 ##

* fix reboot device after reset settings
* fix problem with chapters list in player for DVD content
* fix reload portal message after reset settings
* add mag324c and mag325c logo images


## 2017.09.04 ##

* add mag324c and mag325c logo images


## 2017.08.28 ##

* fix wifi, internet and network states
* update localizations
* add .wtv extension to supported files


## 2017.08.17 ##

* fix mag349 config
* change format wifi_off from boolean to number
* update registers types in config for mag3** series
* fix wifi state change


## 2017.08.11 ##

* add wifi disable button and state change hook
* fix enable wifi button state


## 2017.08.09 ##

* fix ts time save
* add to settings information about rootFS version
* fix update url for mag324c
* remove 'No ip' settings for MAG322, MAG324C


## 2017.07.28 ##

* fix editing iptv channels, remove unc option from SMB mount


## 2017.07.26 ##

* remove PPPoE from network settings on MAG324C


## 2017.07.25 ##

* fix adding channels to IPTV playlist
* checking API version for set appropriate method signatures on open samba host
* fix unc address syntax on cifs mount


## 2017.07.24 ##

* add hash info to build metadata
* add MAG324C model support
* protect parsing AJAX request for update list result
* remove PPPoE from settings for MAG322


## 2017.07.14 ##

* add auth for SMB servers and rework error handling
* fix tv url parsing
* hide password and fix mounting share by hand
* fix manual mounting in SAMBA browser
* store auth data of successful connections to SMB servers
* open SAMBA server even if it's password protected


## 2017.06.23 ##

* hide info panel on bluetooth disable
* realize opening shares with multiple IPs


## 2017.06.14 ##

* add mac to auto update list request as query param


## 2017.05.22 ##

* add warning message in case of NAND bank damage
* show actual NAND number in settings (with emergency status info)


## 2017.05.15 ##

* add MAGic Cast menu item
* fix bluetooth adapter disabling when some device is connected
* fix .m3u parser
* fix audio playing info panel state in player


## 2017.04.26 ##

* add "wtv" video file format support


## 2017.04.25 ##

* fix playback on video mode change
* fix empty Bluetooth device list handlers


## 2017.04.14 ##

* set dynamic range compression for DolbyDigital audio on player initialization
* remove "Dynamic range compression" option from settings
* restrict "Operating mode" audio setting to "RF Mode" and "Line Mode" only


## 2017.04.12 ##

* update codec icons in player


## 2017.04.05 ##

* correct manual localization


## 2017.03.31 ##

* fix selected chapter after change position in DVD or ISO files
* fix #6534, read cue  and m3u playlists equally
* remove dead code (variable STB_MODE_STANDBY) and fix multiple net status function call
* add flag IPTV_PLAYBACK_ON_START to start first channel in full screen


## 2017.03.29 ##

fix usb unmount when something is playing


## 2017.03.28 ##

* save bluetooth enabled state in environment
* remove unused device characteristics


## 2017.03.27 ##

* fix player preview position
* bluetooth: sort devices by paired and active
* fix bug with partially transparent overlay
* fix localization


## 2017.03.16 ##

* add device config to json generator
* add devices logos
* add bluetooth translations
* rework bluetooth api
* add MAG323 model support
* fix image preview
* fix subtitles and teletext subtitles
* add rotate image in player menu
* fix localisation


## 2017.03.01 ##

* Add MAG324/MAG325 device support
* Add img format #11116
* Solve #11048


## 2017.02.22 ##

* hide gSTB error message until we get localisation for it
* title field shouldn't rewrite lang field and if title field available use it instead of localised type text
* upgrade error page ping
