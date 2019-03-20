var UPnPRenderer = {
		state: false,
		data: null,
		meta: {}
	},
	UPnPRendererClear = function () {
		UPnPRenderer = {
			state: false,
			data: null,
			meta: {}
		};
	};

if ( window.stbUPnPRenderer && false ) { //remove false when wrapper will be write
	stbUPnPRenderer.start({name: gSTB.GetDeviceModelExt()});

	stbUPnPRenderer.autoMode = false;
	stbUPnPRenderer.sendVolume(environment.audio_initial_volume);
	stbUPnPRenderer.sendMute(configuration.volume.mute);
	window.body.addListener('unload', function () {
		stbUPnPRenderer.stop();

		stbUPnPRenderer.autoMode = true;
	});

	stbUPnPRenderer.onPlay = function ( data ) {
		console.log('onPlay');
		console.log(data);

		if ( !data ) {
			if ( UPnPRenderer.data ) {
				UPnPRenderer.state = true;
				MediaPlayer.preparePlayer(UPnPRenderer.data, ServiceMenu, true, true, false);
			}

			return;
		}

		if ( MediaPlayer.playNow || MediaPlayer.startingPlay ) {
			if ( MediaPlayer.exit('upnpStart') ) {
				UPnPRenderer.state = true;
				MediaPlayer.preparePlayer(UPnPRenderer.data, ServiceMenu, true, true, false);
			}
		} else {
			UPnPRenderer.state = true;
			MediaPlayer.preparePlayer(UPnPRenderer.data, ServiceMenu, true, true, false);
		}
	};

	stbUPnPRenderer.onSetUri = function ( data ) {
		var ext = data.uri.split('.').pop().toLowerCase();

		console.log('onSetUri');
		console.log(data);
		if ( !data ) {
			return;
		}
		UPnPRendererClear();
		UPnPRenderer.data = {
			name: data.meta.title,
			url: data.uri,
			type: MediaBrowser.FileList.ext2type[ext]
		};
		UPnPRenderer.meta = data.meta;

	};

	stbUPnPRenderer.onStop = function ( data ) {
		console.log('onStop');
		console.log(data);
		MediaPlayer.exit();
		UPnPRendererClear();
	};

	stbUPnPRenderer.onPause = function ( data ) {
		console.log('onPause');
		console.log(data);
		MediaPlayer.playPause(true);
	};

	stbUPnPRenderer.onSeek = function ( data ) {
		console.log('onSeek');
		console.log(data);
		MediaPlayer.setPosTimeManual(Math.ceil(data.position / 1000));
	};

	stbUPnPRenderer.onSetVolume = function ( data ) {
		console.log('onSetVolume');
		console.log(data);
		volumeSetVolume(Math.ceil(data.volume / 5) * 5);
	};

	stbUPnPRenderer.onMute = function ( data ) {
		console.log('onMute');
		console.log(data);
		configuration.volume.mute = data.state ? 1 : 0;
		toggleMuteState();
	};
}
