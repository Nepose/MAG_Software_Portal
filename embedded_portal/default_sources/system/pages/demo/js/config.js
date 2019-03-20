var pageElements = {
		contentType: {
			name: 'contentType',
			title: 'Type',
			type: 'select',
			data: [
				{value: 'auto', title: 'auto'},
				{value: 'rtp', title: 'rtp'},
				{value: 'rtsp', title: 'rtsp'},
				{value: 'rtpac3', title: 'rtpac3'},
				{value: 'rtsp_ac3', title: 'rtsp_ac3'},
				{value: 'rtpmpeg4', title: 'rtpmpeg4'},
				{value: 'rtpmpeg4_aac', title: 'rtpmpeg4_aac'},
				{value: 'mpegts', title: 'mpegts'},
				{value: 'mpegps', title: 'mpegps'},
				{value: 'file', title: 'file'},
				{value: 'mp4', title: 'mp4'},
				{value: 'mp4_mpa', title: 'mp4_mpa'},
				{value: 'fm', title: 'fm'},
				{value: 'ffmpeg', title: 'ffmpeg'},
				{value: 'ffrt', title: 'ffrt'},
				{value: 'ffrt2', title: 'ffrt2'},
				{value: 'ffrt3', title: 'ffrt3'}
			],
			value: 'auto',
			handler: ['PlaySolution'],
			domElement: null,
			onChange: function () {
				handlers.PlaySolution.action();
			}
		},
		contentPath: {
			name: 'contentPath',
			title: 'Path',
			type: 'input',
			value: 'rtp://239.1.1.1:1234',
			handler: ['PlaySolution'],
			domElement: null
		},
		contentSource: {
			name: 'contentSource',
			title: 'Source',
			type: 'select',
			data: [],
			handler: ['PlaySolution'],
			domElement: null,
			onChange: function () {
				page.getStorageFiles(pageElements.contentSource.domElement.value);
			}
		},
		storageFile: {
			name: 'storageFile',
			title: 'File',
			type: 'select',
			data: [],
			handler: ['PlaySolution'],
			domElement: null,
			active: false
		},
		windowMode: {
			name: 'windowMode',
			title: 'Mode',
			type: 'select',
			data: [
				{value: 0, title: 'window'},
				{value: 1, title: 'full screen'}
			],
			value: 1,
			handler: ['SetPIG'],
			domElement: null,
			onChange: function () {
				if ( parseInt(pageElements.windowMode.domElement.value) ) {
					for ( var i = 0; i < pageElements.windowMode.managedElements.length; i++ ) {
						pageElements[pageElements.windowMode.managedElements[i]].domElement.disabled = true;
						pageElements[pageElements.windowMode.managedElements[i]].domElement.className += ' disabled';
						pageElements[pageElements.windowMode.managedElements[i]].domElement.value = '';
					}
					pageElements.windowScale.domElement.value = 256;
					pageElements.windowAspect.domElement.disabled = false;
					pageElements.windowAspect.domElement.className = '';
					handlers.SetPIG.action();
				} else {
					for ( var i = 0; i < pageElements.windowMode.managedElements.length; i++ ) {
						if ( pageElements.windowMode.managedElements[i] !== 'windowWidth' && pageElements.windowMode.managedElements[i] !== 'windowHeight' ) {
							pageElements[pageElements.windowMode.managedElements[i]].domElement.disabled = false;
							pageElements[pageElements.windowMode.managedElements[i]].domElement.className = '';
						}
					}
					pageElements.coordX.domElement.value = 0;
					pageElements.coordY.domElement.value = 0;
					pageElements.windowAspect.domElement.disabled = true;
					pageElements.windowAspect.domElement.className += ' disabled';
					handlers.SetPIG.action();
				}
			},
			managedElements: ['windowScale', 'windowWidth', 'windowHeight', 'coordX', 'coordY']
		},
		windowScale: {
			name: 'windowScale',
			title: 'Scale',
			type: 'select',
			data: [
				{value: 64, title: '1:4'},
				{value: 128, title: '1:2'},
				{value: 256, title: '1:1'},
				{value: 512, title: '2:1'},
				{value: 'custom', title: 'custom'}
			],
			value: 256,
			handler: ['SetPIG'],
			domElement: null,
			onChange: function () {
				var videoInfo = {};
				if ( pageElements.windowScale.domElement.value === 'custom' ) {
					videoInfo = page.getVideoInfo();
					for ( var i = 0; i < pageElements.windowScale.managedElements.length; i++ ) {
						pageElements[pageElements.windowScale.managedElements[i]].domElement.disabled = false;
						pageElements[pageElements.windowScale.managedElements[i]].domElement.className = '';
					}
					pageElements.windowWidth.domElement.value = videoInfo.pictureWidth;
					pageElements.windowHeight.domElement.value = videoInfo.pictureHeight;
					handlers.SetViewport.action();
				} else {
					for ( var i = 0; i < pageElements.windowScale.managedElements.length; i++ ) {
						pageElements[pageElements.windowScale.managedElements[i]].domElement.disabled = true;
						pageElements[pageElements.windowScale.managedElements[i]].domElement.className += ' disabled';
					}
					pageElements.windowWidth.domElement.value = '';
					pageElements.windowHeight.domElement.value = '';
					handlers.SetPIG.action();
				}
			},
			managedElements: ['windowWidth', 'windowHeight']
		},
		windowWidth: {
			name: 'windowWidth',
			title: 'Width',
			type: 'input',
			value: null,
			handler: ['SetViewport'],
			domElement: null
		},
		windowHeight: {
			name: 'windowHeight',
			title: 'Height',
			type: 'input',
			value: null,
			handler: ['SetViewport'],
			domElement: null
		},
		coordX: {
			name: 'coordX',
			title: 'X',
			type: 'input',
			value: null,
			handler: ['SetPIG', 'SetViewport'],
			domElement: null
		},
		coordY: {
			name: 'coordY',
			title: 'Y',
			type: 'input',
			value: null,
			handler: ['SetPIG', 'SetViewport'],
			domElement: null
		},
		windowAspect: {
			name: 'windowAspect',
			title: 'Aspect',
			type: 'select',
			data: [
				{value: aspects[0].mode, title: aspects[0].text},
				{value: aspects[1].mode, title: aspects[1].text},
				{value: aspects[2].mode, title: aspects[2].text},
				{value: aspects[3].mode, title: aspects[3].text}
			],
			value: aspects[0].mode,
			handler: ['SetAspect'],
			domElement: null,
			onChange: function () {
				handlers.SetAspect.action();
			}
		},
		windowOnTop: {
			name: 'windowOnTop',
			title: 'On top of all windows',
			type: 'select',
			data: [
				{value: 1, title: 'on'},
				{value: 0, title: 'off'}
			],
			value: 0,
			handler: ['SetTopWin'],
			domElement: null,
			onChange: function () {
				handlers.SetTopWin.action();
			}
		},
		videoWindow: {
			name: 'videoWindow',
			title: 'Video window',
			type: 'input',
			value: 255,
			handler: ['SetWinAlphaLevel'],
			domElement: null
		},
		graphicalWindow: {
			name: 'graphicalWindow',
			title: 'Graphical window',
			type: 'input',
			value: 200,
			handler: ['SetWinAlphaLevel'],
			domElement: null
		},
		chromaKeyState: {
			name: 'chromaKeyState',
			title: 'State',
			type: 'select',
			data: [
				{value: 1, title: 'on'},
				{value: 0, title: 'off'}
			],
			value: 0,
			handler: ['SetWinMode'],
			domElement: null,
			onChange: function () {
				if ( parseInt(pageElements.chromaKeyState.domElement.value) ) {
					for ( var i = 0; i < pageElements.chromaKeyState.managedElements.length; i++ ) {
						pageElements[pageElements.chromaKeyState.managedElements[i]].domElement.disabled = false;
						pageElements[pageElements.chromaKeyState.managedElements[i]].domElement.className = '';
					}
				} else {
					for ( var i = 0; i < pageElements.chromaKeyState.managedElements.length; i++ ) {
						pageElements[pageElements.chromaKeyState.managedElements[i]].domElement.disabled = true;
						pageElements[pageElements.chromaKeyState.managedElements[i]].domElement.className += ' disabled';
					}
				}
				handlers.SetWinMode.action();
			},
			managedElements: ['chromaKeyColor']
		},
		chromaKeyColor: {
			name: 'color',
			title: 'Color',
			type: 'select',
			data: [
				{value: 0x000000, title: 'black'},
				{value: 0xffffff, title: 'white'},
				{value: 0xffc20e, title: 'yellow'}
			],
			value: 0x000000,
			handler: ['SetTransparentColor'],
			domElement: null,
			onChange: function () {
				handlers.SetTransparentColor.action();
			}
		},
		subtitlesState: {
			name: 'subtitlesState',
			title: 'State',
			type: 'select',
			data: [
				{value: 1, title: 'on'},
				{value: 0, title: 'off'}
			],
			value: 0,
			handler: ['SetSubtitles'],
			domElement: null,
			onChange: function () {
				handlers.SetSubtitles.action();

				if ( parseInt(pageElements.subtitlesState.domElement.value) ) {
					for ( var i = 0; i < pageElements.subtitlesState.managedElements.length; i++ ) {
						pageElements[pageElements.subtitlesState.managedElements[i]].domElement.disabled = false;
						pageElements[pageElements.subtitlesState.managedElements[i]].domElement.className = '';
					}

					pageElements.subtitlesPID.onChange();
				} else {
					for ( var i = 0; i < pageElements.subtitlesState.managedElements.length; i++ ) {
						pageElements[pageElements.subtitlesState.managedElements[i]].domElement.disabled = true;
						pageElements[pageElements.subtitlesState.managedElements[i]].domElement.className += ' disabled';
					}
				}
			},
			managedElements: ['subtitlesPID', 'subtitlesStart', 'subtitlesEnd', 'subtitlesText', 'subtitlesFont', 'subtitlesFontSize', 'subtitlesOffset']
		},
		subtitlesPID: {
			name: 'subtitlesPID',
			title: 'Track',
			type: 'select',
			data: [],
			handler: ['SetSubtitlePID'],
			domElement: null,
			onChange: function () {
				if ( parseInt(pageElements.subtitlesState.domElement.value) && pageElements.subtitlesPID.domElement.value === 'custom subtitles' ) {
					for ( var i = 0; i < pageElements.subtitlesPID.managedElements.length; i++ ) {
						pageElements[pageElements.subtitlesPID.managedElements[i]].domElement.disabled = false;
						pageElements[pageElements.subtitlesPID.managedElements[i]].domElement.className = '';
					}

					handlers.ShowSubtitle.action();
					setTimeout(function () {
						handlers.SetSubtitlesFont.action();
						handlers.SetSubtitlesSize.action();
						handlers.SetSubtitlesOffs.action();
					}, 0);
				} else {
					for ( var i = 0; i < pageElements.subtitlesPID.managedElements.length; i++ ) {
						pageElements[pageElements.subtitlesPID.managedElements[i]].domElement.disabled = true;
						pageElements[pageElements.subtitlesPID.managedElements[i]].domElement.className += ' disabled';
					}

					handlers.SetSubtitlePID.action();
				}
			},
			managedElements: ['subtitlesStart', 'subtitlesEnd', 'subtitlesText', 'subtitlesFont', 'subtitlesFontSize']
		},
		subtitlesStart: {
			name: 'subtitlesStart',
			title: 'Start (s)',
			type: 'input',
			value: null,
			handler: ['ShowSubtitle'],
			domElement: null
		},
		subtitlesEnd: {
			name: 'subtitlesEnd',
			title: 'End (s)',
			type: 'input',
			value: null,
			handler: ['ShowSubtitle'],
			domElement: null
		},
		subtitlesText: {
			name: 'subtitlesText',
			title: 'Text',
			type: 'input',
			value: 'Example text',
			handler: ['ShowSubtitle'],
			domElement: null
		},
		subtitlesFont: {
			name: 'subtitlesFont',
			title: 'Font',
			type: 'select',
			data: [],
			handler: ['SetSubtitlesFont'],
			domElement: null,
			onChange: function () {
				handlers.SetSubtitlesFont.action();
				setTimeout(function () {
					handlers.ShowSubtitle.action();
				}, 0);
			}
		},
		subtitlesFontSize: {
			name: 'subtitlesFontSize',
			title: 'Font size',
			type: 'select',
			data: [
				{value: 12, title: '12'},
				{value: 16, title: '16'},
				{value: 20, title: '20'},
				{value: 24, title: '24'},
				{value: 28, title: '28'},
				{value: 32, title: '32'}
			],
			value: 24,
			handler: ['SetSubtitlesSize'],
			domElement: null,
			onChange: function () {
				handlers.SetSubtitlesSize.action();
			}
		},
		subtitlesOffset: {
			name: 'subtitlesOffset',
			title: 'Offset',
			type: 'select',
			data: [
				{value: -100, title: '-100'},
				{value: 0, title: '0'},
				{value: 100, title: '100'},
				{value: 200, title: '200'},
				{value: 300, title: '300'},
				{value: 400, title: '400'},
				{value: 500, title: '500'}
			],
			value: 0,
			handler: ['SetSubtitlesOffs'],
			domElement: null,
			onChange: function () {
				handlers.SetSubtitlesOffs.action();
			}
		},
		audioState: {
			name: 'audioState',
			title: 'State',
			type: 'select',
			data: [
				{value: 0, title: 'on'},
				{value: 1, title: 'off'}
			],
			value: 0,
			handler: ['SetMute'],
			domElement: null,
			onChange: function () {
				handlers.SetMute.action();
				if ( parseInt(pageElements.audioState.domElement.value) ) {
					for ( var i = 0; i < pageElements.audioState.managedElements.length; i++ ) {
						pageElements[pageElements.audioState.managedElements[i]].domElement.disabled = true;
						pageElements[pageElements.audioState.managedElements[i]].domElement.className += ' disabled';
					}
				} else {
					for ( var i = 0; i < pageElements.audioState.managedElements.length; i++ ) {
						pageElements[pageElements.audioState.managedElements[i]].domElement.disabled = false;
						pageElements[pageElements.audioState.managedElements[i]].domElement.className = '';
					}
				}
			},
			managedElements: ['audioPID']
		},
		audioPID: {
			name: 'audioPID',
			title: 'Track',
			type: 'select',
			data: [],
			handler: ['SetAudioPID'],
			domElement: null,
			onChange: function () {
				handlers.SetAudioPID.action();
			}
		},
		playbackSpeed: {
			name: 'playbackSpeed',
			title: 'Speed',
			type: 'select',
			data: [
				{value: 1, title: '1x'},
				{value: 2, title: '2x'},
				{value: 3, title: '4x'},
				{value: 4, title: '8x'},
				{value: 8, title: '12x'},
				{value: 5, title: '16x'}

			],
			value: 1,
			handler: ['SetSpeed'],
			domElement: null,
			onChange: function () {
				handlers.SetSpeed.action();
			}
		},
		playbackLoop: {
			name: 'playbackLoop',
			title: 'Repetition',
			type: 'select',
			data: [
				{value: 1, title: 'on'},
				{value: 0, title: 'off'}
			],
			value: 0,
			handler: ['SetLoop'],
			domElement: null,
			onChange: function () {
				handlers.SetLoop.action();
			}
		}
	},
	elementsTree = [
		{
			name: 'mediaContent',
			title: 'Media content',
			inputs: ['contentType', 'contentPath', 'contentSource', 'storageFile']
		},
		{
			name: 'videoWindow',
			title: 'Video window',
			inputs: ['windowMode', 'windowScale', 'windowWidth', 'windowHeight', 'coordX', 'coordY', 'windowAspect', 'windowOnTop']
		},
		{
			name: 'transparency',
			title: 'Transparency',
			inputs: ['videoWindow', 'graphicalWindow']
		},
		{
			name: 'chromaKey',
			title: 'Chroma Key',
			inputs: ['chromaKeyState', 'chromaKeyColor']
		},
		{
			name: 'subtitles',
			title: 'Subtitles',
			inputs: ['subtitlesState', 'subtitlesPID']
		},
		{
			name: 'customizableSubtitles',
			title: 'Customizable subtitles',
			inputs: ['subtitlesStart', 'subtitlesEnd', 'subtitlesText', 'subtitlesFont', 'subtitlesFontSize', 'subtitlesOffset']
		},
		{
			name: 'audio',
			title: 'Audio',
			inputs: ['audioState', 'audioPID']
		},
		{
			name: 'playback',
			title: 'Playback',
			inputs: ['playbackSpeed', 'playbackLoop']
		}
	],
	handlers = {
		PlaySolution: {
			active: false,
			action: function () {
				if ( navigationRows[pageElements.contentSource.domElement.number].style.display === 'none' ) {
					gSTB.PlaySolution(pageElements.contentType.domElement.value, pageElements.contentPath.domElement.value);
				} else {
					gSTB.PlaySolution(pageElements.contentType.domElement.value, pageElements.contentSource.domElement.value + '/' + pageElements.storageFile.domElement.value);
				}
				setTimeout(function () {
					page.getSubtitlesPIDs();
					page.getAudioPIDs();
					pageElements.subtitlesState.onChange();
					pageElements.subtitlesPID.onChange();
					pageElements.audioPID.onChange();
				}, 2000);
				this.active = false;
			}
		},
		SetPIG: {
			active: false,
			action: function () {
				if ( pageElements.windowScale.domElement.value !== 'custom' ) {
					gSTB.SetPIG(pageElements.windowMode.domElement.value, pageElements.windowScale.domElement.value, pageElements.coordX.domElement.value, pageElements.coordY.domElement.value);
					this.active = false;
				}
			}
		},
		SetViewport: {
			active: false,
			action: function () {
				if ( pageElements.windowScale.domElement.value === 'custom' ) {
					gSTB.SetViewport(pageElements.windowWidth.domElement.value, pageElements.windowHeight.domElement.value, pageElements.coordX.domElement.value, pageElements.coordY.domElement.value);
					this.active = false;
				}
			}
		},
		SetAspect: {
			active: false,
			action: function () {
				if ( parseInt(pageElements.windowMode.domElement.value) ) {
					gSTB.SetAspect(pageElements.windowAspect.domElement.value);
					this.active = false;
				}
			}
		},
		SetTopWin: {
			active: false,
			action: function () {
				gSTB.SetTopWin(parseInt(pageElements.windowOnTop.domElement.value));
				this.active = false;

				if ( parseInt(pageElements.windowOnTop.domElement.value) ) {
					contentWrapper.style.visibility = 'hidden';
				} else {
					contentWrapper.style.visibility = 'visible';
				}
			}
		},
		SetWinAlphaLevel: {
			active: false,
			action: function () {
				gSTB.SetWinAlphaLevel(1, pageElements.videoWindow.domElement.value);
				gSTB.SetWinAlphaLevel(0, pageElements.graphicalWindow.domElement.value);
				this.active = false;
			}
		},
		SetWinMode: {
			active: false,
			action: function () {
				gSTB.SetWinMode(1, parseInt(pageElements.chromaKeyState.domElement.value));
				this.active = false;
			}
		},
		SetTransparentColor: {
			active: false,
			action: function () {
				gSTB.SetTransparentColor(pageElements.chromaKeyColor.domElement.value);
				this.active = false;
			}
		},
		SetSubtitles: {
			active: false,
			action: function () {
				gSTB.SetSubtitles(parseInt(pageElements.subtitlesState.domElement.value));
				this.active = false;
			}
		},
		SetSubtitlePID: {
			active: false,
			action: function () {
				if ( pageElements.subtitlesPID.domElement.value !== 'custom subtitles' ) {
					gSTB.SetSubtitlePID(parseInt(pageElements.subtitlesPID.domElement.value));
					this.active = false;
				}
			}
		},
		ShowSubtitle: {
			active: false,
			action: function () {
				gSTB.ShowSubtitle((parseInt(pageElements.subtitlesStart.domElement.value) * 1000), (parseInt(pageElements.subtitlesEnd.domElement.value) * 1000), pageElements.subtitlesText.domElement.value);
				this.active = false;
			}
		},
		SetSubtitlesFont: {
			active: false,
			action: function () {
				gSTB.SetSubtitlesFont(pageElements.subtitlesFont.domElement.value);
				this.active = false;
			}
		},
		SetSubtitlesSize: {
			active: false,
			action: function () {
				gSTB.SetSubtitlesSize(parseInt(pageElements.subtitlesFontSize.domElement.value));
				gSTB.ShowSubtitle((parseInt(pageElements.subtitlesStart.domElement.value) * 1000), (parseInt(pageElements.subtitlesEnd.domElement.value) * 1000), pageElements.subtitlesText.domElement.value);
				this.active = false;
			}
		},
		SetSubtitlesOffs: {
			active: false,
			action: function () {
				gSTB.SetSubtitlesOffs(parseInt(pageElements.subtitlesOffset.domElement.value));
				this.active = false;
			}
		},
		SetMute: {
			active: false,
			action: function () {
				gSTB.SetMute(parseInt(pageElements.audioState.domElement.value));
				this.active = false;
			}
		},
		SetAudioPID: {
			active: false,
			action: function () {
				gSTB.SetAudioPID(parseInt(pageElements.audioPID.domElement.value));
				this.active = false;
			}
		},
		SetSpeed: {
			active: false,
			action: function () {
				gSTB.SetSpeed(parseInt(pageElements.playbackSpeed.domElement.value));
				this.active = false;
			}
		},
		SetLoop: {
			active: false,
			action: function () {
				gSTB.SetLoop(parseInt(pageElements.playbackLoop.domElement.value));
				this.active = false;
			}
		}
	};