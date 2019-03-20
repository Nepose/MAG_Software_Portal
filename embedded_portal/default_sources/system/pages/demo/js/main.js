var stbEvent = {
		onEvent: function ( event ) {
			event = parseInt(event, 10);
			switch ( event ) {
				case 1:
					clearInterval(playbackTimer);

					if ( !parseInt(pageElements.playbackLoop.domElement.value, 10) ) {
						gSTB.Stop();
						playbackStopped = true;
						pageElements.windowOnTop.domElement.value = '0';
						handlers.SetTopWin.action();
					}
					break;
				case 7:
					var videoInfoData = gSTB.GetVideoInfo(),
						totalDuration = gSTB.GetMediaLen(),
						playbackSeconds = 0,
						playbackMinutes = 0,
						playbackHours = 0,
						seconds = null,
						minutes = null,
						hours = null,
						miscalculation = null,
						i = null;

					clearInterval(playbackTimer);

					if ( pageElements.storageFile.active ) {
						videoInfoData = videoInfoData.replace('{', '');
						videoInfoData = videoInfoData.replace('}', '');
						videoInfoData = videoInfoData.split(',');

						for ( i = 0; i < videoInfoData.length; i++ ) {
							videoInfoData[i] = videoInfoData[i].substring(videoInfoData[i].indexOf(':') + 1);
						}

						minutes = Math.floor((totalDuration / 60));

						if ( minutes > 0 ) {
							seconds = totalDuration - (minutes * 60);
						} else {
							seconds = totalDuration;
						}

						hours = Math.floor((minutes / 60));

						if ( hours > 0 ) {
							minutes = minutes - (hours * 60);
						}

						miscalculation = totalDuration - ((((hours * 60) + minutes) * 60) + seconds);

						if ( seconds < 10 ) {
							seconds = '0' + seconds;
						}

						if ( minutes < 10 ) {
							minutes = '0' + minutes;
						}

						if ( hours < 10 ) {
							hours = '0' + hours;
						}


						playbackTimer = setInterval(function () {
							playbackSeconds++;

							if ( playbackSeconds > 60 ) {
								playbackSeconds = 0;
								playbackMinutes++;

								if ( playbackMinutes > 60 ) {
									playbackMinutes = 0;
									playbackHours++;
								}
							}

							secondsSpan.innerText = (playbackSeconds < 10) ? '0' + playbackSeconds : playbackSeconds;
							minutesSpan.innerText = (playbackMinutes < 10) ? '0' + playbackMinutes : playbackMinutes;
							hoursSpan.innerText = (playbackHours < 10) ? '0' + playbackHours : playbackHours;
						}, 1000);

						secondsSpan.innerText = '00';
						minutesSpan.innerText = '00';
						hoursSpan.innerText = '00';

						document.querySelector('.frame-rate').innerText = videoInfoData[0] / 1000;
						document.querySelector('.picture-width').innerText = videoInfoData[1];
						document.querySelector('.picture-height').innerText = videoInfoData[2];
						document.querySelector('.total-duration').innerText = hours + ':' + minutes + ':' + seconds;
						document.querySelector('.info-panel').style.display = 'block';
						document.querySelector('.storage').style.display = 'block';
						document.querySelector('.stream').style.display = 'none';
					} else {
						videoInfoData = gSTB.GetVideoInfo();
						videoInfoData = videoInfoData.replace('{', '');
						videoInfoData = videoInfoData.replace('}', '');
						videoInfoData = videoInfoData.split(',');

						for ( i = 0; i < videoInfoData.length; i++ ) {
							videoInfoData[i] = videoInfoData[i].substring(videoInfoData[i].indexOf(':') + 1);
						}

						document.querySelector('.frame-rate').innerText = videoInfoData[0] / 1000;
						document.querySelector('.picture-width').innerText = videoInfoData[1];
						document.querySelector('.picture-height').innerText = videoInfoData[2];
						document.querySelector('.info-panel').style.display = 'block';
						document.querySelector('.storage').style.display = 'none';
						document.querySelector('.stream').style.display = 'block';
					}
					break;
			}
		},
		onBroadcastMessage: function ( id, message, data ) {
			if ( message === 'storage.mount' || message === 'storage.unmount' ) {
				page.getStorageDevice();
				switch ( document.activeElement.number ) {
					case 1:
					case 2:
					case 3:
						navigationRows[document.activeElement.number].className = defaultClassName;
						rowNumber = 0;
						navigationRows[0].className += ' focused';
						navigationRows[0].innerElement.focus();
						break;
				}
			}
		},
		event: 0
	},
	page = {
		init: function () {
			gSTB.SetListFilesExt('.' + REGISTERED_TYPES.join(' .')); // set the list of file extensions
			gSTB.InitPlayer(); // player initialization
			gSTB.Play('rtp://239.1.1.1:1234'); // start the playback of media content
			gSTB.SetPIG(1, 0, 0, 0); // set the coordinates and the mode of the video window (0/1 - full screen/window, scale, x, y)
			gSTB.SetTopWin(0); // set the specified window on top of others (0 - graphic, 1 - video)
			gSTB.SetWinAlphaLevel(0, 200); // set the alpha transparency of the graphic window
			gSTB.SetWinAlphaLevel(1, 255); // set the alpha transparency of the video window
			gSTB.SetWinMode(0, 0); // turn on or off ChromaKey for the specified window (0 - graphic, 1 - video / 0 - off, 1 - on)
			gSTB.SetWinMode(1, 0); // turn on or off ChromaKey for the specified window (0 - graphic, 1 - video / 0 - off, 1 - on)
			gSTB.EnableServiceButton(false); // enable/disable pressing 'SET' button
			gSTB.SetVolume(environment.audio_initial_volume = volume.def);

			this.generateElements();
			this.getStorageDevice();

			pageElements.windowMode.onChange();
			pageElements.chromaKeyState.onChange();
			pageElements.audioState.onChange();

			setTimeout(function () {
				page.getSubtitlesPIDs();
				page.getAudioPIDs();
				pageElements.subtitlesState.onChange();
				pageElements.subtitlesPID.onChange();
				pageElements.audioPID.onChange();
			}, 2000);
			this.getSubtitlesFonts();

			secondsSpan = document.querySelector('.seconds');
			minutesSpan = document.querySelector('.minutes');
			hoursSpan = document.querySelector('.hours');
		},
		generateElements: function () {
			var parentDiv = document.getElementById('content'),
				table = element('table'),
				headerTr,
				elementTr,
				titleTd,
				elementTd,
				input,
				option;

			contentWrapper = parentDiv.parentNode;

			for ( var i = 0; i < elementsTree.length; i++ ) {
				headerTr = element('tr', {}, element('td', {colSpan: 2}, element('p', {className: 'header'}, elementsTree[i].title)));
				table = elchild(table, headerTr);
				for ( var j = 0; j < elementsTree[i].inputs.length; j++ ) {
					elementTr = element('tr', {className: 'elementTr', innerElement: null});
					titleTd = element('td', {}, element('p', {className: 'title'}, pageElements[elementsTree[i].inputs[j]].title + ':'));
					switch ( pageElements[elementsTree[i].inputs[j]].type ) {
						case 'input':
							input = element('input', {type: 'text', value: pageElements[elementsTree[i].inputs[j]].value, number: j});

							input.oninput = (function ( input, handler ) {
								return function () {
									for ( var l = 0; l < handler.length; l++ ) {
										handlers[handler[l]].active = true;
									}
								}
							})(input, pageElements[elementsTree[i].inputs[j]].handler);

							pageElements[elementsTree[i].inputs[j]].domElement = input;
							elementTr.innerElement = input;
							elementTd = element('td', {}, element('div', {}, input));
							elementTr = elchild(elementTr, [titleTd, elementTd]);
							break;
						case 'select':
							input = element('select', {number: j});

							input.onСhange = (function ( input, handler, onChange ) {
								return function () {
									for ( var l = 0; l < handler.length; l++ ) {
										handlers[handler[l]].active = true;
									}
									if ( typeof onChange === 'function' ) {
										onChange();
									}
								}
							})(input, pageElements[elementsTree[i].inputs[j]].handler, pageElements[elementsTree[i].inputs[j]].onChange);

							if ( pageElements[elementsTree[i].inputs[j]].data.length > 0 ) {
								for ( var k = 0; k < pageElements[elementsTree[i].inputs[j]].data.length; k++ ) {
									option = element('option', {value: pageElements[elementsTree[i].inputs[j]].data[k].value}, pageElements[elementsTree[i].inputs[j]].data[k].title);
									if ( pageElements[elementsTree[i].inputs[j]].data[k].value === pageElements[elementsTree[i].inputs[j]].value ) {
										option.selected = true;
									}
									input = elchild(input, option);
								}
							}
							pageElements[elementsTree[i].inputs[j]].domElement = input;
							elementTr.innerElement = input;
							elementTd = element('td', {}, element('div', {className: 'selectWrapper'}, [element('div', {className: 'arrowLeft'}), input, element('div', {className: 'arrowRight'})]));
							elementTr = elchild(elementTr, [titleTd, elementTd]);
							break;
					}
					table = elchild(table, elementTr);
				}
				elchild(parentDiv, table);
			}

			navigationRows = document.getElementsByClassName('elementTr');
			navigationRows[rowNumber].className += ' focused';
			navigationRows[rowNumber].innerElement.focus();
		},
		getStorageDevice: function () {
			var option;
			getStorageInfo();
			if ( STORAGE_INFO.length ) {
				navigationRows[pageElements.contentPath.domElement.number].style.display = 'none';
				navigationRows[pageElements.contentSource.domElement.number].style.display = 'table-row';
				navigationRows[pageElements.storageFile.domElement.number].style.display = 'table-row';
				pageElements.playbackSpeed.domElement.disabled = false;
				pageElements.playbackLoop.domElement.disabled = false;
				pageElements.playbackSpeed.domElement.className = '';
				pageElements.playbackLoop.domElement.className = '';
				pageElements.storageFile.active = true;
				elclear(pageElements.contentSource.domElement);
				for ( var i = 0; i < STORAGE_INFO.length; i++ ) {
					option = element('option', {value: STORAGE_INFO[i].mountPath}, STORAGE_INFO[i].label);
					elchild(pageElements.contentSource.domElement, option);
				}
				this.getStorageFiles(pageElements.contentSource.domElement.value);
				handlers.PlaySolution.action();
			} else {
				navigationRows[pageElements.contentSource.domElement.number].style.display = 'none';
				navigationRows[pageElements.storageFile.domElement.number].style.display = 'none';
				navigationRows[pageElements.contentPath.domElement.number].style.display = 'table-row';
				pageElements.playbackSpeed.domElement.disabled = true;
				pageElements.playbackLoop.domElement.disabled = true;
				pageElements.playbackSpeed.domElement.className += ' disabled';
				pageElements.playbackLoop.domElement.className += ' disabled';
				pageElements.storageFile.active = false;
				handlers.PlaySolution.action();
			}
		},
		getStorageFiles: function ( mountPath ) {
			var option;
			eval(gSTB.ListDir(mountPath));
			elclear(pageElements.storageFile.domElement);
			for ( var i = 0; i < files.length; i++ ) {
				option = element('option', {value: files[i].name}, files[i].name);
				elchild(pageElements.storageFile.domElement, option);
			}
		},
		getVideoInfo: function () {
			var videoInfo = {},
				videoInfoString;

			videoInfoString = gSTB.GetVideoInfo();
			videoInfoString = 'videoInfo = ' + videoInfoString;
			videoInfo = eval(videoInfoString);

			return videoInfo;
		},
		getSubtitlesPIDs: function () {
			var result = eval(gSTB.GetSubtitlePIDs()),
				subtitlesPIDs = [],
				option;

			if ( result.length > 0 ) {
				for ( var i = 0; i < result.length; i++ ) {
					for ( var j = 0; j < result[i].lang.length; j++ ) {
						if ( result[i].lang[j] !== '' ) {
							subtitlesPIDs[i] = {value: result[i].pid, title: result[i].lang[j]};
							break;
						} else {
							subtitlesPIDs[i] = {value: result[i].pid, title: result[i].pid};
						}
					}
				}
				subtitlesPIDs.push({value: 'custom subtitles', title: 'custom subtitles'});
			} else {
				subtitlesPIDs[0] = {value: 'custom subtitles', title: 'custom subtitles'};
			}

			elclear(pageElements.subtitlesPID.domElement);

			for ( var i = 0; i < subtitlesPIDs.length; i++ ) {
				option = element('option', {value: subtitlesPIDs[i].value}, subtitlesPIDs[i].title);
				elchild(pageElements.subtitlesPID.domElement, option);
			}
		},
		getSubtitlesFonts: function () {
			var fonts = [],
				option;

			eval(gSTB.ListDir(fontPath));

			for ( var i = 0; i < files.length; i++ ) {
				if ( files[i].name.indexOf('.ttf') !== -1 ) {
					fonts.push(files[i].name);
				}
			}

			elclear(pageElements.subtitlesFont.domElement);

			if ( fonts.length > 0 ) {
				for ( var i = 0; i < fonts.length; i++ ) {
					option = element('option', {value: fontPath + '/' + fonts[i]}, fonts[i]);
					elchild(pageElements.subtitlesFont.domElement, option);
				}
			} else {
				option = element('option', {value: 'no fonts'}, 'no fonts');
				elchild(pageElements.subtitlesFont.domElement, option);
			}
		},
		getAudioPIDs: function () {
			var result = eval(gSTB.GetAudioPIDs()),
				audioPIDs = [],
				option;

			if ( result.length > 0 ) {
				for ( var i = 0; i < result.length; i++ ) {
					for ( var j = 0; j < result[i].lang.length; j++ ) {
						if ( result[i].lang[j] !== '' ) {
							audioPIDs[i] = {value: result[i].pid, title: result[i].lang[j]};
							break;
						} else {
							audioPIDs[i] = {value: result[i].pid, title: result[i].pid};
						}
					}
				}
			} else {
				audioPIDs[0] = {value: 'no audio', title: 'no audio'};
			}

			elclear(pageElements.audioPID.domElement);
			for ( var i = 0; i < audioPIDs.length; i++ ) {
				option = element('option', {value: audioPIDs[i].value}, audioPIDs[i].title);
				elchild(pageElements.audioPID.domElement, option);
			}
		},
		filteringNumericData: function () {
			if ( this.value < +this.minValue ) {
				this.value = this.minValue;
			}
		},
		applyChanges: function () {
			for ( var handler in handlers ) {
				if ( handlers[handler].active ) {
					handlers[handler].action();
				}
			}
		},
		isNumber: function ( value ) {
			return !isNaN(parseFloat(value)) && isFinite(value);
		},
		showY: function ( element ) {
			var parentDiv = document.getElementById('content'),
				OTe = element.offsetTop,
				OHe = element.offsetHeight,
				STc = parentDiv.scrollTop,
				OHc = parentDiv.offsetHeight;
			if ( OTe < STc || OHe > OHc ) {
				if ( OTe === OHe ) {
					parentDiv.scrollTop = 0;
				} else {
					parentDiv.scrollTop = OTe;
				}
			} else if ( OTe + OHe > STc + OHc ) {
				parentDiv.scrollTop = OTe + OHe - OHc;
			}
		},
		volumeSetVolume: function ( vol ) {
			if ( volume.timer ) {
				clearTimeout(volume.timer);
			}

			var step_px;
			WINDOW_WIDTH == 1920 ? step_px = 15 : step_px = 10;
			var valueDiv = document.getElementById('volumeForm');
			var volumeNum = document.getElementById('volume_num');
			var bar = document.getElementById('volume_right');
			var control = document.getElementById('volume_bar');
			var vol_idx = vol / 5;
			if ( vol_idx ) {
				var value = vol_idx * step_px - 5;
				bar.style.width = value + 'px';
				control.style.visibility = 'visible';
			} else {
				control.style.visibility = 'hidden';
			}
			volumeNum.innerHTML = environment.audio_initial_volume + '%';
			gSTB.SetVolume(vol);
			volume.timer = setTimeout(page.volumeCloseForm, volume.hideTimeOut);
			valueDiv.style.visibility = 'visible';
		},
		volumeCloseForm: function () {
			volume.timer = null;
			document.getElementById('volumeForm').style.visibility = 'hidden';
			if ( environment.audio_initial_volume >= 5 ) {
				document.getElementById('volume_bar').style.visibility = 'hidden';
			}
		},
		onKeyDown: function ( event ) {
			var activeElement = document.activeElement;

			if ( !eventPrepare(event) ) {
				return;
			}

			switch ( event.code ) {
				case KEYS.OK:
					if ( parseInt(pageElements.windowOnTop.domElement.value, 10) ) {
						event.preventDefault();
						event.stopPropagation();
						break;
					}
					if ( activeElement.type === 'select-one' ) {
						this.applyChanges();
						event.preventDefault();
					} else {
						this.applyChanges();
					}
					break;
				case KEYS.UP:
					if ( parseInt(pageElements.windowOnTop.domElement.value, 10) ) {
						event.preventDefault();
						event.stopPropagation();
						break;
					}
					event.preventDefault();
					for ( var i = rowNumber - 1; i >= 0; i-- ) {
						if ( navigationRows[i].style.display !== 'none' ) {
							navigationRows[rowNumber].className = defaultClassName;
							rowNumber = i;
							this.showY(navigationRows[i]);
							navigationRows[i].className += ' focused';
							navigationRows[i].innerElement.focus();
							if ( navigationRows[i].innerElement.type === 'text' && !navigationRows[i].innerElement.disabled ) {
								navigationRows[i].innerElement.select();
							}
							break;
						}
					}
					break;
				case KEYS.DOWN:
					if ( parseInt(pageElements.windowOnTop.domElement.value, 10) ) {
						event.preventDefault();
						event.stopPropagation();
						break;
					}
					event.preventDefault();
					for ( var i = rowNumber + 1; i < navigationRows.length; i++ ) {
						if ( navigationRows[i].style.display !== 'none' ) {
							navigationRows[rowNumber].className = defaultClassName;
							rowNumber = i;
							this.showY(navigationRows[i]);
							navigationRows[i].className += ' focused';
							navigationRows[i].innerElement.focus();
							if ( navigationRows[i].innerElement.type === 'text' && !navigationRows[i].innerElement.disabled ) {
								navigationRows[i].innerElement.select();
							}
							break;
						}
					}
					break;
				case KEYS.LEFT:
				case KEYS.RIGHT:
					if ( parseInt(pageElements.windowOnTop.domElement.value, 10) ) {
						event.preventDefault();
						event.stopPropagation();
						break;
					}
					if ( navigationRows[rowNumber].innerElement.disabled ) {
						event.preventDefault();
						break;
					}
					if ( activeElement.type === 'select-one' ) {
						setTimeout(function () {
							activeElement.onСhange();
						}, 0);
					}
					break;
				case KEYS.PAGE_UP:
				case KEYS.PAGE_DOWN:
					if ( parseInt(pageElements.windowOnTop.domElement.value, 10) ) {
						event.preventDefault();
						event.stopPropagation();
						break;
					}
					if ( activeElement.type === 'select-one' ) {
						event.preventDefault();
					}
					break;
				case KEYS.PLAY_PAUSE:
					if ( gSTB.IsPlaying() ) {
						gSTB.Pause();
					} else {
						if ( playbackStopped ) {
							handlers.PlaySolution.action();
							playbackStopped = false;
						} else {
							gSTB.Continue();
						}
					}

					break;
				case KEYS.EXIT:
					if ( pageElements.windowOnTop.domElement.value !== '0' ) {
						pageElements.windowOnTop.domElement.value = '0';
						handlers.SetTopWin.action();
					}

					if ( pageElements.windowOnTop.domElement.value === '0' ) {
						gSTB.Stop();
						document.body.style.display = 'none';
						gSTB.LoadURL(PATH_SYSTEM + 'pages/loader/index.html');
					}

					break;
				case KEYS.VOLUME_UP:
					if ( environment.audio_initial_volume < 100 ) {
						environment.audio_initial_volume += volume.step;
					}
					page.volumeSetVolume(environment.audio_initial_volume);
					event.preventDefault();
					event.stopPropagation();
					break;
				case KEYS.VOLUME_DOWN:
					if ( environment.audio_initial_volume > 0 ) {
						environment.audio_initial_volume -= volume.step;
					}
					page.volumeSetVolume(environment.audio_initial_volume);
					event.preventDefault();
					event.stopPropagation();
					break;
			}
		}
	};
