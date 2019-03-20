var navigationRows = [],
	rowNumber = 0,
	defaultClassName = 'elementTr',
	STORAGE_INFO,
	REGISTERED_TYPES = ["mpg", "mpeg", "mkv", "avi", "ts", "tspinf", "m4a", "mp3", "mp4", "ac3", "mov", "vob", "wav", "ape", "mts", "m2t", "m2v", "ogg", "oga", "divx", "aiff", "m2ts", "wv", "m2p", "tp", "flv", "tta", "mod", "tod", "asf", "wma", "wmv", "flac", "ape", "cue", "m3u", "jpg", "jpeg", "png", "bmp", "tif", "tiff", "iso", "aac", "mpl", "txt", "srt", "sub", "ass", "ttf"],
	aspects = [
		{
			name: 'fit',
			mode: 0x10,
			text: 'Fit on'
		},
		{
			name: 'big',
			mode: 0x40,
			text: 'Zoom'
		},
		{
			name: 'opt',
			mode: 0x50,
			text: 'Optimal'
		},
		{
			name: 'exp',
			mode: 0x00,
			text: 'Stretch'
		}
	],
	fontPath = '/home/default',
	playbackStopped = false,
	contentWrapper = null,
	volume = {
		timer: null,
		hideTimeOut: 3000,
		def: 100,
		step: 5
	},
	environment = {
		audio_initial_volume: null
	},
	playbackTimer = null,
	secondsSpan = null,
	minutesSpan = null,
	hoursSpan = null;