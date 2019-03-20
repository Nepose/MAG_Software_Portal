/*
*	Interface definition file for the STB MAG 200 video and audio subsystems manipulations
*	Date 02/03/2007
*	Version 1.00
*	Base interface
*	
*	15/03/2007
*	Version 1.01: STB_SetViewport function is added.
*	
*	21/03/2007
*	Version 1.02: STB_SetupRTSP and STB_GetAPIVersion function is added.
*	
*	28/03/2007
*	Version 1.03: Use of languages, media information, Event Callback and STB_Action() is added.
*
*	08.06.2007
*	Version 1.04: Added STB_IsPlaying function
*
*	25.06.2007
*	Version 1.05: Added STB_SetupSPdif function
*
* 18.07.2007
* Version 1.06:	Added STB_SetSubtitleSize & STB_SetSubtitleFont function
*
* 05.09.2007
* Version 1.07: Added STB_GetPIGState, STB_GetWinAlphaLevel, STB_GetChromaKey functions
*
* 12.12.2007
* Version 1.08: Added STB_IgnoreUpdates , STB_SetCASType, STB_SetCASParam, STB_LoadCASIniFile, STB_StandBy
*               STB_GetAspect, STB_GetSpeed
*
* 02.12.2008
* Version 1.09: Added STB_SetScramblingType , STB_SetScramblingKey, STB_SetCASDescrambling
*
* 08.07.2009
* Version 1.10: Added ARRIS RTSP server support
*
* 13.07.2009
* Version 1.11: Added LIVE555 RTSP server support
*
* 24.07.2009
* Version 1.12: Added OPEN_ERROR event.
* 
* 27.07.2009
* Version 1.13: Added functions STB_GetBrightness, STB_GetContrast, STB_GetSaturation for SD output
* 
* 19.08.2009
* Version 1.14: Added STB_SCRAMBLING_TYPE_AES_END decryption algorithm.
* 
* 01.12.2009
* Version 1.15: Added STB_SetPosTimeEx and STB_GetPosTimeEx
* 
* 22.12.2009
* Version 1.16: Added STB_SetStereoMode and STB_SetDRC
*               Added STB_EVENT_DUAL_MONO event
* 
* 05.02.2010
* Version 1.17: Added STB_SetAudioOperationalMode, STB_ShowSubtitle() and STB_GetAudioPIDsEx
* 
* 11.02.2010
* Version 1.18: Added STB_SetHDMIAudioOut function
* 
* 25.02.2010
* Version 1.19 Added STB_SetEventCtrlCallback function
*               Added ARES CAS support
*
* 16.06.2010
* Version 1.20 Added STB_RTSP_TYPE_ZTE RTSP server support
*
* 26.10.2010
* Version 1.21 Added STB_EVENT_HDMI_CONNECT and STB_EVENT_HDMI_DISCONNECT events
*
* 10.11.2010
* Version 1.22 Added STB_RTSP_TYPE_NETUP RTSP server support
*
* 19.11.2010
* Version 1.23 Added STB_SetAdditionalCasParam function
* 
* 07.04.2011
* Version 1.24 Added support for Custom CAS plugins
*              Added STB_SetInputBufferSize,STB_GetInputBufferLoad
*
* 27.07.2011
* Version 1.25 Added STB_EVENT_VIDEOINFO event
*              Added support for RTP over RTSP mode
* 
* 29.08.2011
* Version 1.26 Added PVR support 
* 
* 13.10.2011
* Version 1.27 Added AutoFrameRate support
*              Added STB_GetMetadataInfo function
*              
* 10.11.2011
* Version 1.28 Added STB_ForceDVI function
* 
* 23.11.2011
* Version 1.29 Added STB_SetSubtitlesEncoding and STB_LoadExternalSubtitles functions
* Changed format of return values in STB_GetMetadataInfo, STB_PVR_GetAllTasks, STB_PVR_GetTasksByIDs
* and STB_PVR_GetTaskByID according to JSON notation.
* 
* 27.01.2012
* Version 1.30 Added STB_SetSubtitlesLangC,STB_SetTeletextLangC and STB_SetAudioLangC for compatibility with pure C code.
*
* 06.02.2012
* Version 1.31 Added STB_SetCustomHeader, STB_Set3DtoFullscreenConversionMode and STB_Get3DtoFullscreenConversionMode functions.
*              Added external protocol support.
* 
* 28.05.2012 Added STB_SetTeletextPID, STB_GetTeletextPID, STB_GetTeletextPIDs functions - NOT functional for MAG200.
*
* 28.09.2012
* Version 1.32 Added STB_GetHDMIConnectionState function.
*
* Version 1.33 Added STB_SetTimeShiftFolder, STB_SetTimeShiftDurationMax, STB_TimeShiftOn, STB_TimeShiftOff,
* STB_TimeShiftOffAndSave, STB_StopTimeShiftAndSave functions - NOT functional for MAG200.
* 
* Version 1.34 Added STB_GetStatistics, STB_ClearStatistics, STB_SetLogLevel functions.
*              Added STB_RTSP_FLAG_UPDATE_MEDIA_DURATION RTSP flag.
* 
* Version 1.35 Added STB_SetViewportEx, STB_SetOutputAspectRatio, STB_GetOutputAspectRatio, STB_GetSupportedSpeeds,
* STB_GetFetchedBytes, STB_GetMediaSizeBytes.
* 
*
* Version 1.36 Added DVB support. MAG270/275 ONLY.
* Added STB_GetHLSInfo.
*
* Version 1.37 Added STB_DVB_GetEPGScheduleByRange function. MAG270/275 ONLY.
* 
* Version 1.38 Added EXPERIMENTAL functions STB_SetWebCASLogging, STB_SetupWebCAS, STB_ForceTtxSubCharset for testing purpose ONLY
*
* Version 1.39 Added functions STB_DVB_SetScanParams, STB_GetPlayerOption, STB_SetPlayerOption, STB_ResetPlayerOptions
* 
* Version 1.40 Added function STB_GetTopWin.
* 
* Version 1.41 Added functions STB_ForceTtxSubCharset, STB_GetTtxSubForceCharset, STB_GetSubtitlePIDsEx.
* 
* Version 1.42 Added functions STB_SetTeletextViewport, STB_SetDefaultTtxSubCharset, STB_GetDefaultTtxSubCharset,
* STB_SetTeletextPage, STB_RunTeletextCommand, STB_ShowTeletext, STB_SetTeletextTransparency, STB_EPG_SetPreferredLang, STB_EPG_Enable
* Updated enum STB_3DtoFullscreenMode_e.
*
* Version 1.43 Added functions STB_DVB_TunerCount, STB_DVB_RemoveChannelIndex, STB_DVB_GetSupportedScanTypesRaw,
* STB_DVB_GetCurrentScanTypesRaw, STB_DVB_GetPreferredLang, STB_EPG_GetPreferredLang, STB_SetDvbSessionCallback, 
* STB_GetDvbChannelCount, STB_GetDvbChannelInfo, STB_FilterDvbChannel
*
* Version 1.44 Added functions STB_ForceTtxCharset, STB_GetTtxForceCharset, STB_SetDefaultTtxCharset, STB_GetDefaultTtxCharset
*
* Version 1.45 Added function STB_ForceTtxCharsetUltimate
*
* Version 1.46 Added PiP and Deep Standby support (for MAG254/255/270/275).
*  Added function STB_GetAutoFrameRateSourcePlayerId
*/

#ifndef _STBPLAYER_H_
#define _STBPLAYER_H_

#include "stbtypes.h"
/**
 * Create player instance.
 * 
 * @return Pointer to new player instance.
 *         HANDLE_INVALID - if error.
 */
FUNC_PUBLIC HPlayer		STB_CreatePlayer();
/**
 * Release player instance.
 * 
 * @param hPlayer player handle
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_ReleasePlayer(HPlayer hPlayer);

/**
 * Start playback media.
 * 
 * @param  hPlayer player handle
 * @param AStr    media description in form:
 *        "type URL atrack:num vtrack:num", where type is the
 *        solution type or "auto", atrack and vtrack are
 *        optional field that specify audio and video track
 *        selection (PIDs for MPEGTS).
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_Play(HPlayer hPlayer,const char *AStr);
/**
 * Start media playback for specified solution
 * 
 * @param hPlayer player handle
 * @param solution solution type(mpegps, rtp, rtsp, mp3, ogg,
 *                 aac, mp4, pcm...) or "auto"
 * @param URL      media location e.i.:
 *                 local - /media/1.mp3
 *                 rtp   - rtp://addr:port
 *                 udp   - udp://addr:port
 * @return STB_STATUS_OK if success
 * @example STB_PlaySolution(hPlayer,"mpegps","/media/1.mpg") -
 * play Mpeg2 Programm Stream file /media/1.mpg
 * STB_PlaySolution(hPlayer,"auto","/media/1.mpg")
 * STB_PlaySolution(hPlayer,"rtp","udp://224.10.0.30:5004") -
 * play IGMP multicast Mpeg2   Transport Stream over UDP from
 * specified address (224.10.0.30) and port (5004).
 */
FUNC_PUBLIC STBStatus_e	STB_PlaySolution(HPlayer hPlayer,const char *solution,const char * URL);
/**
 * Start media playback for specified audio/video tracks
 * 
 * @param hPlayer  player handle
 * @param solution solution type(mpegps,rtp,rtsp,mp3,...) or "auto"
 * @param URL      media location e.i.:
 *                 local - /media/1.mp3
 *                 rtp   - rtp://addr:port
 *                 udp   - udp://addr:port
 * @param atrack   Audio track(or PID for MPEGTS) number, ignore
 *                 if -1
 * @param vtrack   Video track(or PID for MPEGTS) number, ignore
 *                 if -1
 * 
 * @return STB_STATUS_OK if success
 * @example STB_PlayTracks(hPlayer,"auto","/media/1.mpg",920,930)
 * STB_PlayTracks(hPlayer,"rtp","udp://224.10.0.30:5004",920,930)
 */
FUNC_PUBLIC STBStatus_e	STB_PlayTracks(HPlayer hPlayer,const char *solution,const char * URL,int atrack,int vtrack);
FUNC_PUBLIC STBStatus_e	STB_PlayPosTime(HPlayer hPlayer,const char *AStr,u32 time);
FUNC_PUBLIC STBStatus_e	STB_PlaySolutionPosTime(HPlayer hPlayer,const char *solution,const char * URL,u32 time);
FUNC_PUBLIC STBStatus_e	STB_PlayTracksPosTime(HPlayer hPlayer,const char *solution,const char * URL,int atrack,int vtrack,u32 time);
/**
 * Stop media playback
 * 
 * @param hPlayer player handle
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_Stop(HPlayer hPlayer);
/**
 * Pause media playback
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_Pause(HPlayer hPlayer);
/**
 * Continue media playback after Pause(hPlayer)
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_Continue(HPlayer hPlayer);
/**
 * Set current media position
 * 
 * @param hPlayer player handle
 * @param AStr    Position in media in percent,byte,time in format:
 *                "hr:min:sec" - "1:23:23"
 *                "min:sec" - "12:32"
 *                "byte_position" - "12345"
 *                "0-100%" - "10%"
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetPos(HPlayer hPlayer,const char *AStr);
/**
 * Set current position in seconds
 * 
 * @param hPlayer player handle
 * @param time    time in seconds
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetPosTime(HPlayer hPlayer,u32 time);
/**
 * Set current position in miliseconds
 * 
 * @param hPlayer player handle
 * @param time    time in miliseconds
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetPosTimeEx(HPlayer hPlayer,u32 time);
/**
 * Set current position in percent*100
 * 
 * @param hPlayer player handle
 * @param prc     position in percent*100
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetPosPercent(HPlayer hPlayer,u32 prc);
/**
 * get current position in seconds
 * 
 * @param hPlayer player handle
 * @return current position in seconds
 */
FUNC_PUBLIC s32			STB_GetPosTime(HPlayer hPlayer);
/**
 * get current position in miliseconds
 * 
 * @param hPlayer player handle
 * @return current position in miliseconds
 */
FUNC_PUBLIC s32			STB_GetPosTimeEx(HPlayer hPlayer);
/**
 * get current position in percent*100
 * 
 * @param hPlayer player handle
 * @return current position in percent*100
 */
FUNC_PUBLIC s32			STB_GetPosPercent(HPlayer hPlayer);
/**
 * Get the lenght of the current media in seconds
 * 
 * @param hPlayer player handle
 * @return media lenght in seconds if known, else 0.
 */
FUNC_PUBLIC u32			STB_GetMediaLen(HPlayer hPlayer);
/**
 * Get the lenght of the current media in miliseconds
 * 
 * @param hPlayer player handle
 * @return media lenght in seconds if known, else 0.
 */
FUNC_PUBLIC u32			STB_GetMediaLenEx(HPlayer hPlayer);
/**
 * set playback speed
 * 
 * @param hPlayer player handle
 * @param speed   playback speed:
 *                1 - normal
 *                2 - 2x
 *                3 - 4x
 *                4 - 8x
 *                5 - 16x
 *                6 - half speed
 *                7 - quarter speed
 *                8 - 12x
 *                9 - 32x
 *                10 - 64x
 *                -1 - backward
 *                -2 - 2x backward
 *                -3 - 4x backward
 *                -4 - 8x backward
 *                -5 - 16x backward
 *                -6 - half speed backward
 *                -7 - quarter speed backward
 *                -8 - 12x backward
 *                -9 - 32x backward
 *                -10 - 64x backward
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetSpeed(HPlayer hPlayer,s8 speed);
/**
 * Get current speed
 * 
 * @param hPlayer player handle
 * @return See SetSpeed()
 *         if error - return 0
 */
FUNC_PUBLIC s8		 	STB_GetSpeed(HPlayer hPlayer);
/**
 * Set Audio PID
 * 
 * @param hPlayer player handle
 * @param PID     Audio PID
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetAudioPID(HPlayer hPlayer,u16 PID);
/**
 * Set video plane position and mode
 * 
 * @param hPlayer player handle
 * @param pig     video plane position and mode struct
 * @return STB_STATUS_OK if success
 * @see PIG_Info
 */
FUNC_PUBLIC STBStatus_e	STB_SetPIG(HPlayer hPlayer,PIG_Info * pig);

/**
 * Get video plane position and mode
 *
 * @param hPlayer player handle
 * @param pig     struct to store video plane position and mode
 * @return STB_STATUS_OK if success
 * @see PIG_Info
 */
FUNC_PUBLIC STBStatus_e	STB_GetPIG(HPlayer hPlayer,PIG_Info * pig);

/**
 * Get video plane position and mode
 * 
 * @param hPlayer player handle
 * @param pig     video plane position and mode struct
 * @return STB_STATUS_OK if success
 * @see PIG_Info
 */
FUNC_PUBLIC STBStatus_e	STB_GetPIG(HPlayer hPlayer,PIG_Info* pig);
/**
 * Set video plane alpha level.
 * 
 * @param hPlayer player handle
 * @param alpha   Alpha level
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetAlphaLevel(HPlayer hPlayer,u8 alpha);
/**
 * Get video plane alpha level.
 * 
 * @param hPlayer player handle
 * @return video plane alpha level.
 */
FUNC_PUBLIC u8		 	STB_GetAlphaLevel(HPlayer hPlayer);
/**
 * Set volume.
 * 
 * @param hPlayer player handle
 * @param volume  volume 0-100
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetVolume(HPlayer hPlayer,u8 volume);
/**
 * Get volume
 * 
 * @param hPlayer player handle
 * @return current volume
 */
FUNC_PUBLIC u8			STB_GetVolume(HPlayer hPlayer);
/**
 * Set user control of enabling/disabling flicker filter
 * 
 * @param hPlayer player handle
 * @param mode    when mode == 1 player never change flicker filter mode
 *                when mode == 0 player change flicker filter mode in different stage of playback
 * @return STB_STATUS_OK if success
 * @see SetFlicker
 */
FUNC_PUBLIC STBStatus_e 	STB_SetUserFlickerControl(HPlayer hPlayer,u8 mode);
/**
 * Set flicker filter mode
 * 
 * @param hPlayer player handle
 * @param state   1 - turn on
 *                0 - turn off
 * @param flk     smoothness value, when on
 * @param shp     sharpness value, when on
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetFlicker(HPlayer hPlayer,u8 state,u8 flk,u8 shp);
/**
 * Set default flicker filter values
 * 
 * @param hPlayer player handle
 * @param state   0 - disable flicker filter
 *                1 - enable flicker filter with default
 *                parameters
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetDefaultFlicker(HPlayer hPlayer,u8 state);
/**
 * Set playback looping
 * 
 * @param hPlayer player handle
 * @param state   0 - off
 *                1 - on
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetLoop(HPlayer hPlayer,u8 state);

/**
 * Is playback looping
 *
 * @param hPlayer player handle
 * @return 0 - off
 *         1 - on
 */
FUNC_PUBLIC int 	STB_GetLoop(HPlayer hPlayer);

/**
 * Set user control of enabbling/disabling video plane.
 * 
 * @param hPlayer player handle
 * @param mode    0 - player automatically enable/disable video plane
 *                1 - user enable/disable video plane using
 *                SetVideoState
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetVideoControl(HPlayer hPlayer,u8 mode);

/**
 * Get user control of enabbling/disabling video plane.
 *
 * @param hPlayer player handle
 * @return  0 - player automatically enable/disable video plane
 *          1 - user enable/disable video plane using SetVideoState
 */
FUNC_PUBLIC u8 STB_GetVideoControl(HPlayer hPlayer);

/**
 * Ensble/disable video plane.
 * 
 * @param hPlayer player handle
 * @param state   0 - disable video plane.
 *                1 - enable video plane.
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetVideoState(HPlayer hPlayer,u8 state);

/**
 * Get information is the video plane Ensbled/disabled
 *
 * @param hPlayer player handle
 * @return 0 - disable video plane.
 *         1 - enable video plane.
 */
FUNC_PUBLIC u8 STB_GetVideoState(HPlayer hPlayer);

/**
 * Set Chroma key and mask for whole screen
 * 
 * @param hPlayer player handle
 * @param key     chroma key
 * @param mask    chroma mask
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetChromaKey(HPlayer hPlayer,u32 key,u32 mask);
/**
 * Set chroma keying mode for video plane.
 * The pixel in graphic plane satisfying to a chroma key and mask is displayed atop of video plane
 * 
 * @param hPlayer player handle
 * @param mode    0 - disable keying mode
 *                1 - enable keying mode
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetMode(HPlayer hPlayer,u8 mode);
/**
 * Set chroma keying mode for given window.
 * The pixel in opposite window satisfying to a chroma key and mask is displayed atop of given window.
 * 
 * @param hPlayer player handle
 * @param winNum  Window number:
 *                0 - graphic
 *                1 - video
 * @param mode    0 - disable keying mode
 *                1 - enable keying mode
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetWinMode(HPlayer hPlayer,u8 winNum,u8 mode);

/**
 * Set the given window atop of another.
 * 
 * @param hPlayer player handle
 * @param wNum    Window number:
 *                0 - graphic
 *                1 - video
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetTopWin(HPlayer hPlayer,u8 wNum);

/**
 * Set surface order.
 *
 * @param hPlayer player handle
 * @param order   Surface order
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e STB_SetSurfaceOrder(HPlayer hPlayer, STB_Surfaces *order);

/**
 * Get surface order.
 *
 * @param hPlayer player handle
 * @param order   Surface order
 * @return STB_STATUS_OK if success
 *
 * Do not free() surfaces pointer in returned value.
 */
FUNC_PUBLIC STBStatus_e STB_GetSurfaceOrder(HPlayer hPlayer, STB_Surfaces *order);

/**
 * Get default surface order.
 *
 * @param hPlayer player handle
 * @param order   Surface order
 * @return STB_STATUS_OK if success
 *
 * Do not free() surfaces pointer in returned value.
 */
FUNC_PUBLIC STBStatus_e STB_GetDefaultSurfaceOrder(HPlayer hPlayer, STB_Surfaces *order);

/**
 * Set default surface order.
 *
 * @param hPlayer player handle
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e STB_SetDefaultSurfaceOrder(HPlayer hPlayer);

/**
 * Set the given window atop of another.
 *
 * @param hPlayer player handle
 * @param wNum    Window number:
 *                0 - graphic
 *                1 - video
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetTopWin(HPlayer hPlayer,u8 wNum);

/**
 * Set the given alpha level to the given window.
 * 
 * @param hPlayer player handle
 * @param wNum    Window number:
 *                0 - graphic
 *                1 - video
 * @param alpha   alpha level
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetWinAlphaLevel(HPlayer hPlayer,u8 wNum,u8 alpha);
/**
 * Set display aspect ratio.
 * 
 * @param hPlayer player handle
 * @param aspect  display aspect ratio:
 * In windowed mode(in lower tetrad):
 *                0 - auto
 *                1 - 20:9
 *                2 - 16:9
 *                3 - 4:3
 * In fullscreen mode(in upper tetrad): 
 *                0 - auto (stretch video to fullscreen)
 *                1 - do letter box format conversation
 *                2 - do pan&scan format conversation
 *                3 - combined mode (between letter box and
 *                    pan&scan)
 *                4 - Zoom
 *                5 - Optimal
 *                 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetAspect(HPlayer hPlayer,u8 aspect);
/**
 * Rotate video.
 * 
 * @param hPlayer player handle
 * @param angle   Rotate angle must be 0,90,180,270 degrees
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_Rotate(HPlayer hPlayer,u16 angle);
/**
 * Mute the audio output.
 * 
 * @param hPlayer player handle
 * @param mode    0 - mute off
 *                1 - mute on
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetMute(HPlayer hPlayer,u8 mode);
/**
 * Get muted state.
 * 
 * @param hPlayer player handle
 * @return 0 - mute off
 *         1 - mute on
 */
FUNC_PUBLIC u8		 	STB_GetMute(HPlayer hPlayer);
/**
 * Set the microphone volume.
 * 
 * @param hPlayer player handle
 * @param volume  microphone volume.
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_SetMicVolume(HPlayer hPlayer,u8 volume);
/**
 * Get the current microphone volume.
 * 
 * @param hPlayer player handle
 * @return the current microphone volume.
 */
FUNC_PUBLIC u8		 	STB_GetMicVolume(HPlayer hPlayer);

/**
 * Step one video frame
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e 	STB_Step(HPlayer hPlayer);


/**
 * Set video plane position and size in pixels.
 * 
 * @param hPlayer player handle
 * @param view     video plane position and size in pixels
 * @return STB_STATUS_OK if success
 * @see Viewport_Info
 */
FUNC_PUBLIC STBStatus_e STB_SetViewport(HPlayer hPlayer, Viewport_Info * view);

/**
 * Set RTSP type and parameters.
 * 
 * @param hPlayer player handle
 * @param param     parameters for RTSP client
 * @return STB_STATUS_OK if success
 * @see STBParamRTSP_t
 */
FUNC_PUBLIC STBStatus_e STB_SetupRTSP(HPlayer hPlayer, STBParamRTSP_t* param);

/**
 * Get RTSP type and parameters.
 *
 * @param hPlayer player handle
 * @param store parameters for RTSP client
 * @return STB_STATUS_OK if success
 * @see STBParamRTSP_t
 */
FUNC_PUBLIC STBStatus_e STB_GetRTSP(HPlayer hPlayer, STBParamRTSP_t* param);

/**
 * Get STB API Version.
 * 
 * @return STB API Version.
 */
FUNC_PUBLIC unsigned int STB_GetAPIVersion();

/**
 * Get STB Engine Version.
 * 
 * @return STB Engine Version.
 */
FUNC_PUBLIC unsigned int STB_GetEngineVersion();

/**
 * Get info for all audio pids.
 * 
 * @param pidCnt   in *pidCnt returns the number of audio PIDs
 *                 in pids array
 * @param pids     in *pids returns the pointer to array of
 *                 STB_PIDInfo elements.
 * 
 * @return info for all audio pids.
 *         STB_STATUS_OK if ok.
 * @see STB_PIDInfo
 */
FUNC_PUBLIC STBStatus_e  STB_GetAudioPIDs(HPlayer hPlayer,int* pidCnt,STB_PIDInfo** pids);
/**
 * Get extended info for all audio pids.
 * 
 * @param pidCnt   in *pidCnt returns the number of audio PIDs
 *                 in pids array
 * @param pids     in *pids returns the pointer to array of
 *                 STB_PIDInfoEx elements.
 * 
 * @return info for all audio pids.
 *         STB_STATUS_OK if ok.
 * @see STB_PIDInfo
 */
FUNC_PUBLIC STBStatus_e  STB_GetAudioPIDsEx(HPlayer hPlayer,int* pidCnt,STB_PIDInfoEx** pids);
/**
 * Retreives the audio PID.
 * 
 * @param hPlayer player handle
 * @return return the audio PID.
 */
FUNC_PUBLIC unsigned int	STB_GetAudioPID(HPlayer hPlayer);
/**
 * Retreives the video PID.
 * 
 * @param hPlayer player handle
 * @return return the video PID.
 */
FUNC_PUBLIC unsigned int	STB_GetVideoPID(HPlayer hPlayer);

#if defined(__cplusplus)
/**
 * Set the primary and secondary languages for audio.
 * 
 * @param hPlayer player handle
 * @param langSet 	the set of languages.
 * 
 * @return STB_STATUS_OK if no error.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_SetAudioLang(HPlayer hPlayer,STB_LangSet& langSet);
#else
/**
 * Set the primary and secondary languages for audio. 
 * Pure C version of STB_SetAudioLang function
 * 
 * @param hPlayer player handle
 * @param langSet 	the set of languages.
 * 
 * @return STB_STATUS_OK if no error.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_SetAudioLangC(HPlayer hPlayer,STB_LangSet* langSet);
#endif
/**
 * Get the primary and secondary languages for audio.
 * 
 * @param hPlayer player handle
 * @param langSet 	pointer to the set of languages.
 * 
 * @return STB_STATUS_OK if no error. Fill *langSet by 
 *         laguages. If not defined - STB_Lang fills by 0-s.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_GetAudioLang(HPlayer hPlayer,STB_LangSet* langSet);

/**
 * Set callback function for event handling
 * Mutually exclusive with STB_SetEventCallbackExt 
 * 
 * @param hPlayer player handle
 * @param cb      Callback function.
 *                Set cb to NULL to clear it.
 * 
 * @return STB_STAUS_OK if no error.
 * @see STB_EVENT_CALLBACK
 */
FUNC_PUBLIC STBStatus_e STB_SetEventCallback(HPlayer hPlayer, STB_EVENT_CALLBACK cb);
/**
 * Set callback function for extended event handling. 
 * Mutually exclusive with STB_SetEventCallback
 * 
 * @param hPlayer player handle
 * @param cb      Callback function.
 *                Set cb to NULL to clear it.
 * 
 * @return STB_STAUS_OK if no error.
 * @see STB_EVENT_CALLBACK_EXT
 */
FUNC_PUBLIC STBStatus_e STB_SetEventCallbackExt(HPlayer hPlayer, STB_EVENT_CALLBACK_EXT cb);
/**
 * Set callback function for extended event handling for multiple player instance. 
 * Mutually exclusive with STB_SetEventCallback and STB_SetEventCallbackExt 
 * Need to be used to get STB_PLAYBACK_ID_ASSIGN_CALLBACK working.
 * 
 * @param hPlayer player handle
 * @param cb      Callback function.
 *                Set cb to NULL to clear it.
 * 
 * @return STB_STAUS_OK if no error.
 * @see STB_EVENT_CALLBACK_MULTI
 */
FUNC_PUBLIC STBStatus_e STB_SetEventCallbackMulti(HPlayer hPlayer, STB_EVENT_CALLBACK_MULTI cb);
/**
 * Set callback function for Playback Id assignment by the player.
 * User should save playback Id for corresponding player Id to get rid of stale events.
 * User should check these values with values sent via STB_EVENT_CALLBACK_MULTI
 * 
 * @param hPlayer player handle
 * @param cb      Callback function.
 *                Set cb to NULL to clear it.
 * 
 * @return STB_STAUS_OK if no error.
 * @see STB_PLAYBACK_ID_ASSIGN_CALLBACK
 */
FUNC_PUBLIC STBStatus_e STB_SetPlaybackIdAssignPlayback(HPlayer hPlayer, STB_PLAYBACK_ID_ASSIGN_CALLBACK cb);
/**
 * Retrieves the last event code.
 * 
 * @param hPlayer player handle
 * 
 * @return the last event code
 */
FUNC_PUBLIC unsigned int STB_GetLastEvent(HPlayer hPlayer);

/**
 * Retrieves the decoded video information
 * 
 * @param hPlayer player handle
 * @param vinfo  video information
 * 
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_GetVideoInfo(HPlayer hPlayer,STB_VideoInfo* vinfo);
/**
 * Retrieves the decoded audio information
 * 
 * @param hPlayer player handle
 * @param ainfo  audio information
 * 
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_GetAudioInfo(HPlayer hPlayer,STB_AudioInfo* ainfo);
/**
 * Turns on(enable!=0) or off(enable==0) subtitles
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if no error
 */
FUNC_PUBLIC STBStatus_e STB_SetSubtitles(HPlayer hPlayer,unsigned int enable);


/**
 * Retrieves whether subtitles enabled or disabled.
 * 
 * @param hPlayer player handle
 * @return 0 - disabled
 *         other - enabled
 */
FUNC_PUBLIC unsigned int STB_GetSubtitles(HPlayer hPlayer);
/**
 * Turns on(enable!=0) or off(enable==0) teletext
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if no error
 */
FUNC_PUBLIC STBStatus_e STB_SetTeletext(HPlayer hPlayer,unsigned int enable);

/**
 * Set teletext position and size in pixels.
 *
 * @param hPlayer player handle
 * @param view teletext position and size in pixels
 * @return STB_STATUS_OK if success
 * @see Viewport_Info
 */
FUNC_PUBLIC STBStatus_e STB_SetTeletextViewport(HPlayer hPlayer, Viewport_Info * view);

/**
 * Get teletext position and size in pixels.
 *
 * @param hPlayer player handle
 * @param view teletext position and size in pixels
 * @return STB_STATUS_OK if success
 * @see Viewport_Info
 */
FUNC_PUBLIC STBStatus_e STB_GetTeletextViewport(HPlayer hPlayer, Viewport_Info * view);


/**
 * Retrieves whether teletext enabled or disabled.
 * 
 * @param hPlayer player handle
 * @return 0 - disabled
 *         other - enabled
 */
FUNC_PUBLIC unsigned int STB_GetTeletext(HPlayer hPlayer);

#if defined(__cplusplus)
/**
 * Set the primary and secondary language for Subtitles.
 * 
 * @param hPlayer player handle
 * @param langSet 	the set of languages.
 * 
 * @return STB_STATUS_OK if no error.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_SetSubtitlesLang(HPlayer hPlayer,STB_LangSet& langSet);
#else
/**
 * Set the primary and secondary language for Subtitles. 
 * Pure C verion of STB_SetSubtitlesLang function 
 * 
 * @param hPlayer player handle
 * @param langSet 	the set of languages.
 * 
 * @return STB_STATUS_OK if no error.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_SetSubtitlesLangC(HPlayer hPlayer,STB_LangSet* langSet);
#endif
/**
 * Get the primary and secondary languages for Subtitles.
 * 
 * @param hPlayer player handle
 * @param langSet 	pointer to the set of languages.
 * 
 * @return STB_STATUS_OK if no error. Fill *langSet by 
 *         laguages. If not defined - STB_Lang fills by 0-s.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_GetSubtitlesLang(HPlayer hPlayer,STB_LangSet* langSet);
#if defined(__cplusplus)
/**
 * Set the primary and secondary language for Teletext.
 * 
 * @param hPlayer player handle
 * @param langSet 	the set of languages.
 * 
 * @return STB_STATUS_OK if no error.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_SetTeletextLang(HPlayer hPlayer,STB_LangSet& langSet);
#else
/**
 * Set the primary and secondary language for Teletext. 
 * Pure C version of STB_SetTeletextLang function.
 * 
 * @param hPlayer player handle
 * @param langSet 	the set of languages.
 * 
 * @return STB_STATUS_OK if no error.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_SetTeletextLangC(HPlayer hPlayer,STB_LangSet* langSet);
#endif

/**
 * Force to use charset for teletext subtitles.
 * 
 * @param hPlayer player handle
 * @param ttxSubDefCharset the charset code for teletext subtitles decoding.
 * @param enable 0 - disable
 *               1 - enable
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_ForceTtxSubCharset(HPlayer hPlayer, int forceTtxCharset, int enable);

/**
 * Get the 'force' charset for teletext subtitles.
 * 
 * @param hPlayer player handle
 * 
 * @return the 'force' charset for teletext subtitles.
 *         -1 if disabled
 * @see STB_TtxSubCharset_e 
 */
FUNC_PUBLIC int STB_GetTtxSubForceCharset(HPlayer hPlayer);

/**
 * Set default teletext charset.
 * 
 * @param hPlayer player handle
 * @param ttxSubDefCharset the charset code for teletext subtitles decoding.
 * @param enable 0 - disable
 *               1 - enable
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_SetDefaultTtxSubCharset(HPlayer hPlayer, int ttxDefaultCharset, int enable);

/**
 * Get default teletext charset.
 * 
 * @param hPlayer player handle
 * 
 * @return the 'default' charset for teletext subtitles.
 *         -1 if disabled
 * @see STB_TtxSubCharset_e 
 */
FUNC_PUBLIC int STB_GetDefaultTtxSubCharset(HPlayer hPlayer);

/**
 * Force to use charset for teletext.
 *
 * @param hPlayer player handle
 * @param ttxDefCharset the charset code for teletext decoding.
 * @param enable 0 - disable
 *               1 - enable
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_ForceTtxCharset(HPlayer hPlayer, int forceCharset, int enable);

/**
 * Force to use charset for teletext.
 *
 * @param hPlayer player handle
 * @param ttxDefCharset the charset code for teletext decoding.
 * @param enable 0 - disable
 *               1 - enable
 * @param ultimate 0 - force only level 1 charset
 *                 1 - use forceCharset for all data
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_ForceTtxCharsetUltimate(HPlayer hPlayer, int forceCharset, int enable, int ultimate);

/**
 * Get the 'force' charset for teletext.
 *
 * @param hPlayer player handle
 *
 * @return the 'force' charset for teletext.
 *         -1 if disabled
 * @see STB_TtxCharset_e
 */
FUNC_PUBLIC int STB_GetTtxForceCharset(HPlayer hPlayer);

/**
 * Set default teletext charset.
 *
 * @param hPlayer player handle
 * @param ttxDefCharset the charset code for teletext decoding.
 * @param enable 0 - disable
 *               1 - enable
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_SetDefaultTtxCharset(HPlayer hPlayer, int ttxDefaultCharset, int enable);

/**
 * Get default teletext charset.
 *
 * @param hPlayer player handle
 *
 * @return the 'default' charset for teletext.
 *         -1 if disabled
 * @see STB_TtxCharset_e
 */
FUNC_PUBLIC int STB_GetDefaultTtxCharset(HPlayer hPlayer);

/**
 * Get the primary and secondary languages for Teletext.
 * 
 * @param hPlayer player handle
 * @param langSet 	pointer to the set of languages.
 * 
 * @return STB_STATUS_OK if no error. Fill *langSet by 
 *         laguages. If not defined - STB_Lang fills by 0-s.
 * @see STB_LangSet
 */

FUNC_PUBLIC STBStatus_e STB_GetTeletextLang(HPlayer hPlayer,STB_LangSet* langSet);

/**
 * Execute some action on STB, such PowerDown, Reboot etc.
 * STB calls /home/default/stbaction.sh with actionID as argument and extraArgs as additional arguments
 * 
 * @param hPlayer player handle
*  @param cmdArgs script arguments.
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_Action(HPlayer hPlayer,const char* cmdArgs);
/**
 * Retrieves whether player playing back video now.
 * 
 * @param hPlayer player handle
 * @return 0 - video not playing back now other - video is
 *         playing back now
 */
FUNC_PUBLIC int STB_IsPlaying(HPlayer hPlayer);

/**
 * Retrieves playback state.
 *
 * @param hPlayer player handle
 * @return 0 - video not playing
 *         1 - video is playing now
 *         2 - video on pause now
 */
FUNC_PUBLIC int STB_PlayibackState(HPlayer hPlayer);

/**
 * Setup spdif mode
 * 
 * @param hPlayer player handle
 * @param flags see STB_SPDIF_FLAG_XXX
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetupSPdif(HPlayer hPlayer,unsigned int flags);

/**
 * Set size for text subtitles
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if no error
 */
FUNC_PUBLIC STBStatus_e STB_SetSubtitleSize(HPlayer hPlayer,unsigned int size);

/**
 * Get size for text subtitles
 *
 * @param hPlayer player handle
 * @return size for text subtitles
 */
FUNC_PUBLIC unsigned int STB_GetSubtitleSize(HPlayer hPlayer);

/**
 * Sets lowest position of subtitles (80<=pos<=550)
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if no error
 */
FUNC_PUBLIC STBStatus_e STB_SetSubtitlePos(HPlayer hPlayer,int pos);

/**
 * Gets lowest position of subtitles (80<=pos<=550)
 *
 * @param hPlayer player handle
 * @return lowest position of subtitles
 */
FUNC_PUBLIC int STB_GetSubtitlePos(HPlayer hPlayer);

/**
 * Set font for text subtitles
 * 
 * @param hPlayer player handle
 * @return STB_STATUS_OK if no error
 */
FUNC_PUBLIC STBStatus_e STB_SetSubtitleFont(HPlayer hPlayer,char* pFont);

/**
 * Get font for text subtitles
 *
 * @param hPlayer player handle
 * @return font for text subtitles
 */
FUNC_PUBLIC const char* STB_GetSubtitleFont(HPlayer hPlayer);

/**
 * returns current PIG state: 0 - fullscreen , 1 - window
 * 
 * @param hPlayer player handle
 */
FUNC_PUBLIC int STB_GetPIGState(HPlayer hPlayer);


/**
 * Returns the alpha level to the given window.
 * 
 * @param hPlayer player handle
 * @param wNum    Window number:
 *                0 - graphic
 *                1 - video
 */
FUNC_PUBLIC u8 	STB_GetWinAlphaLevel(HPlayer hPlayer,u8 wNum);

/**
 * returns Chroma key and mask for whole screen
 * 
 * @param hPlayer player handle
 * @return chroma key and mask
 */
FUNC_PUBLIC STBStatus_e 	STB_GetChromaKey(HPlayer hPlayer,u32* key,u32* mask);

/**
 * Switching Browser Screen Updates Blocker
 * 
 * @param hPlayer player handle
 * @param bIgnore:
 *          1 - browser screen update disabled
 *          0 - browser screen update enabled
 */
FUNC_PUBLIC STBStatus_e 	STB_IgnoreUpdates(HPlayer hPlayer,u8 bIgnore);

/**
 * Select CAS
 * 
 * @param hPlayer player handle
 * @param CASType @see <t STB_CAS_TYPE_xxx>:
 */
FUNC_PUBLIC STBStatus_e 	STB_SetCASType(HPlayer hPlayer,int CASType);

/**
 * Setup CAS parameters.
 * 
 * @param hPlayer player handle
 * @param pCAS @see <t STB_CAS_t>:
 */
FUNC_PUBLIC STBStatus_e 	STB_SetCASParam(HPlayer hPlayer,STB_CAS_t* pCAS);
/**
 * Load CAS params from ini file
 * 
 * @param hPlayer player handle
 * @param iniFile - full name of ini file
 */
FUNC_PUBLIC STBStatus_e 	STB_LoadCASIniFile(HPlayer hPlayer,const char* iniFile);
/**
 * Sets whether to use software or hardware descrambling if 
 * selected CAS supports it. 
 * E.i. with Verimatrix CAS we can use software descrambling 
 * only with RC-4 and AES algorithms but hardware - only with 
 * AES and DVB-CSA algorithms 
 *  
 * @param hPlayer player handle
 * @param isSoftware: 
 *    0 - use hardware descrambling (default)
 *    1 - use software descrambling
 */
FUNC_PUBLIC STBStatus_e 	STB_SetCASDescrambling(HPlayer hPlayer,u8 isSoftware);

/**
 * Switch system Standby mode.
 * 
 * @param hPlayer player handle
 * @return  mode :
 *                0 - exit StandBy mode
 *                1 - go to StandBy mode
 */
FUNC_PUBLIC STBStatus_e 	STB_StandBy(HPlayer hPlayer,u8 mode);
/**
 * Get current display aspect ratio.
 * 
 * @param hPlayer player handle
 * @return  display aspect ratio: 
 * In windowed mode: 
 *                0 - auto
 *                1 - 20:9
 *                2 - 16:9
 *                3 - 4:3
 * In fullscreen mode: 
 *                0 - auto (stretch video to fullscreen)
 *                1 - do letter box format conversation
 *                2 - do pan&scan format conversation
 *                3 - combined mode (between letter box and
 *                    pan&scan)
 *                4 - Zoom
 *                5 - Optimal
 *                 
*/
FUNC_PUBLIC u8 	STB_GetAspect(HPlayer hPlayer);

/**
 * Set Subtitles PID
 * 
 * @param hPlayer player handle
 * @param PID     Subtitles PID
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetSubtitlePID(HPlayer hPlayer,u16 PID);

/**
 * Get info for all subtitles pids.
 * 
 * @param pidCnt   in *pidCnt returns the number of audio PIDs
 *                 in pids array
 * @param pids     in *pids returns the pointer to array of
 *                 STB_PIDInfo elements.
 * 
 * @return info for all subtitle pids.
 *         STB_STATUS_OK if ok.
 * @see STB_PIDInfo
 */
FUNC_PUBLIC STBStatus_e  STB_GetSubtitlePIDs(HPlayer hPlayer,int* pidCnt,STB_PIDInfo** pids);

/**
 * Get extended info for all subtitles pids.
 * 
 * @param pidCnt   in *pidCnt returns the number of audio PIDs
 *                 in pids array
 * @param pids     in *pids returns the pointer to array of
 *                 STB_PIDInfo elements.
 * 
 * @return info for all subtitle pids.
 *         STB_STATUS_OK if ok.
 * @see STB_PIDInfo
 */
FUNC_PUBLIC STBStatus_e  STB_GetSubtitlePIDsEx(HPlayer hPlayer,int* pidCnt,STB_PIDInfoEx** pids);

/**
 * Retreives the subtitles PID.
 * 
 * @param hPlayer player handle
 * @return return the subtitle PID.
 */
FUNC_PUBLIC unsigned int	STB_GetSubtitlePID(HPlayer hPlayer);

/**
 * Set scrambling algorithm to decrypt TS
 * 
 * @param hPlayer player handle
 * @param type    Scrambling algorithm
 * 
 * @return STB_STATUS_OK if success
 * @see STBScramblingTypes_t
 */
FUNC_PUBLIC STBStatus_e  STB_SetScramblingType(HPlayer hPlayer,STBScramblingTypes_t type);

/**
 * Set key for descrambling
 * 
 * @param key      pointer to key data
 * @param odd_even 0 - even key
 *                 1 - odd key
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e  STB_SetScramblingKey(HPlayer hPlayer,const char* key, int odd_even);

/**
 * Set brightness in SD mode
 * 
 * @param hPlayer player handle
 * @param bri     brightness: 1..254 default: 128 
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetBrightness(HPlayer hPlayer,unsigned char bri);
/**
 * Set contrast in SD mode
 * 
 * @param hPlayer player handle
 * @param con     contrast: -128..127
 *                default: 0
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetContrast(HPlayer hPlayer,signed char con);
/**
 * Set saturation in SD mode
 * 
 * @param hPlayer player handle
 * @param sat     saturation: 1..254 default: 128 
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetSaturation(HPlayer hPlayer,unsigned char sat);
/**
 * Get current brightness
 * 
 * @param hPlayer player handle
 * 
 * @return brightness: 1..254
 */
FUNC_PUBLIC unsigned char STB_GetBrightness(HPlayer hPlayer);
/**
 * Get current contrast
 * 
 * @param hPlayer player handle
 * 
 * @return contrast: -128..127
 */
FUNC_PUBLIC signed char   STB_GetContrast(HPlayer hPlayer);
/**
 * Get current saturation
 * 
 * @param hPlayer player handle
 * 
 * @return saturation: 1..254
 */
FUNC_PUBLIC unsigned char STB_GetSaturation(HPlayer hPlayer);

/**
 * Switch RGB/YUV Component output mode
 * 
 * @param hPlayer player handle
 * @param mode    0 - YUV mode
 *                1 - RGB mode (available only for SD mode)
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetComponentMode(HPlayer hPlayer,int mode);

/**
 * Set synchronization mode
 * 
 * @param hPlayer  player handle
 * @param bEnabled 0 - do not use PCR clocks
 *                 1 - use PCR clocks (default on init)
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetPCRModeEnabled(HPlayer hPlayer,int bEnabled);

/**
 * Get synchronization mode
 *
 * @param hPlayer  player handle
 * @return 0 - do not use PCR clocks
 *         1 - use PCR clocks (default on init)
 */
FUNC_PUBLIC int STB_GetPCRModeEnabled(HPlayer hPlayer);

/**
 * Set video window mode during AV synchronization process
 * 
 * @param hPlayer  player handle
 * @param bEnabled  0 - show video window only when sync 
 *                  achieved (default on init)
 *                  1 - show video window immediately after
 *                  video frame ready
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_ShowVideoImmediately(HPlayer hPlayer,int bShow);

/**
 * Get video window mode during AV synchronization process
 *
 * @param hPlayer  player handle
 * @return 0 - show video window only when sync
 *             achieved (default on init)
 *         1 - show video window immediately after
 *             video frame ready
 */
FUNC_PUBLIC int STB_GetShowVideoImmediately(HPlayer hPlayer);

/**
 * Set text subtitle color
 * 
 * @param hPlayer  player handle
 * @param color - color in RGB format
 *  
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetSubtitleColor(HPlayer hPlayer,unsigned int color);

/**
 * Get text subtitle color
 *
 * @param hPlayer  player handle
 * @return color - color in RGB format
 */
FUNC_PUBLIC unsigned int STB_GetSubtitleColor(HPlayer hPlayer);

/**
 * Set Stereo output mode
 * 
 * @param mode - stereo output mode
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetStereoMode(HPlayer hPlayer,int mode);
/**
 * Set Dynamic Range Compression
 * 
 * @param high - cutting factor for high range
 * @param low -  boost factor for low range
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetDRC(HPlayer hPlayer,u8 high, u8 low);
/**
 * Set Audio Operational mode
 * 
 * @param mode - audio operational mode
 * 				 0 - RF Mode
 * 				 1 - Line Mode
 * 				 2 - Custom0 Mode
 * 				 3 - Custom1 Mode
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetAudioOperationalMode(HPlayer hPlayer,int mode);

/**
 * Get Audio Operational mode
 *
 * @return mode - audio operational mode
 * 				 0 - RF Mode
 * 				 1 - Line Mode
 * 				 2 - Custom0 Mode
 * 				 3 - Custom1 Mode
 */
FUNC_PUBLIC STBStatus_e STB_GetAudioOperationalMode(HPlayer hPlayer,int *mode);

/**
 * Show subtitle given by text string.
 * 
 * @param hPlayer player handle
 * @param start   subtitle start time in ms
 * @param stop    subtitle stop time in ms
 * @param text    subtitle text in UTF-8 format
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_ShowSubtitle(HPlayer hPlayer, unsigned int start, unsigned int stop, const char* text);
/**
 * Setup HDMI audio mode
 * 
 * @param hPlayer player handle
 * @param HDMI Audio type see STB_HDMIAudioType_e
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetHDMIAudioOut(HPlayer hPlayer,unsigned int type);
/**
 * Set callback function to control event handling.
 * 
 * Because of asynchronous behaviour of STB_Play...() functions
 * we need to be sure that recieved event belongs to the last
 * call of STB_Play...() function. To ensure this, set event 
 * control callback via current function. During call of 
 * STB_Play...() function event handling (except 
 * STB_EVENT_NONBLOCKING events) is automatically disabled, 
 * until this command is actually executed and then enabled 
 * event handling again. So in disabled state, treat all events 
 * as out of date. 
 * 
 * @param hPlayer player handle
 * @param cb      Callback function.
 *                Set cb to NULL to clear it.
 * 
 * @return STB_STAUS_OK if no error.
 * @see STB_EVENT_CTRL_CALLBACK
 */
FUNC_PUBLIC STBStatus_e STB_SetEventCtrlCallback(HPlayer hPlayer,STB_EVENT_CTRL_CALLBACK cb);

//Use following function only with RTSP to get/set npt time or absolute clock time
/**
 * Get current position of RTSP media in string format according to RFC-2326(RTSP)
 * 
 * @param hPlayer player handle
 * @param buff    pointer to preallocated buffer to put current position into
 * @param bufLen  length of buff
 * 
 * @return STB_STAUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e	STB_GetPosStr(HPlayer hPlayer,char* buff, int bufLen);
/**
 * Set current position of RTSP media in string format according
 * to RFC-2326(RTSP) 
 * 
 * @param hPlayer player handle
 * @param pos    pointer to position in string format
 * 
 * @return STB_STAUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e	STB_SetPosStr(HPlayer hPlayer,const char* pos);
FUNC_PUBLIC STBStatus_e	STB_PlayFullStr(HPlayer hPlayer,const char *AStr,const char* pos,int speed);
/**
 * Set additional CAS settings.
 * Need to be called before STB_SetCASType.
 * Settings are specific for every CAS type.
 * 
 * @param hPlayer player handle
 * @param name    setting name
 * @param value   setting value
 * 
 * @return STB_STAUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_SetAdditionalCasParam(HPlayer hPlayer,const char* name, const char* value);
/**
 * Set input buffer size.
 * Affects only on some solutions (file, ffmpeg, ffrt*...).
 * Actually buffer size will be changed after next STB_Play.
 * 
 * @param hPlayer  player handle
 * @param sizeInMs Buffer size in ms.
 * @param sizeInBytes
 *                 buffer size in bytes.
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetInputBufferSize(HPlayer hPlayer,int sizeInMs, int sizeInBytes);
/**
 * Get input buffer load in percents.
 * 
 * @param hPlayer  player handle
 * @return buffer load in percents
 */
FUNC_PUBLIC int STB_GetInputBufferLoad(HPlayer hPlayer);
/**
 * Set synchronization offset for rtpm solution
 * ONLY for MAG250 !!!!!!
 * 
 * @param hPlayer player handle
 * @param offset  Synchronization offset
 *                The greater offset means the greater delay of appearence audio and video relative to incoming stream.
 *                Values less than zero can leed to audio
 *                artifacts or absence of video and audio.
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e 	STB_SetSyncOffsetForRT(HPlayer hPlayer,int offset);
/**
 * ONLY for MAG250 !!!!!!
 * Get synchronization offset for rtpm solution
 */
FUNC_PUBLIC int STB_GetSyncOffsetForRT(HPlayer hPlayer);

/**
 * Create new PVR task
 * 
 * @param hPlayer player handle
 * @param url       content URL
 * @param fileName  file name to save recording into
 * @param startTime UTC start time in format "YYYYMMDDThhmmss" or UTC ticks (number of seconds since Epoch)
 * @param endTime   UTC end time in format "YYYYMMDDThhmmss" or UTC ticks (number of seconds since Epoch)
 * @param isTaskCreated
 *                  0 if OK
 *                  error code <= 0 if error
 * 
 * @return unique task ID. If isTaskCreated < 0 then return string is "-1"
 */
FUNC_PUBLIC const char* STB_PVR_CreateTask(HPlayer hPlayer, const char* url, const char* fileName, 
                                       const char* startTime, const char* endTime, int* isTaskCreated);
/**
 * Get array of all tasks in JSON notation: [task_1, ...,task_n] 
 * where task_n looks like 
 * {"id":1,"state":0,"errorCode":0,"filename":"/media/usbdisk/1.ts","url":"http://","startTime":"3452344145","endTime":"3452345345"}
 * 
 * @param hPlayer player handle
 *  
 * @return Return string in JSON notation
 */
FUNC_PUBLIC const char* STB_PVR_GetAllTasks(HPlayer hPlayer);
/**
 * Get array of tasks by id list in JSON notation: [task_1, ...,task_n] 
 * 
 * @param hPlayer player handle
 * @param idList list of ID in form
 *               [id1,id2,...,idN]
 * 
 * @return Return string in JSON notation
 */
FUNC_PUBLIC const char* STB_PVR_GetTasksByIDs(HPlayer hPlayer, const char* idList);
/**
 * Get task by its ID in JSON notation
 * 
 * @param hPlayer player handle
 * @param id     task ID
 * 
 * @return Return string in JSON notation
 */
FUNC_PUBLIC const char* STB_PVR_GetTaskByID(HPlayer hPlayer, const char* id);
/**
 * Stop task and remove it from list.
 * 
 * @param hPlayer player handle
 * @param id         task ID
 * @param removeType 0 - do not remove any files
 *                   1 - if temporary file exists, rename it into resulting file
 *                   2 - remove only temporary file
 *                   3 - remove both temporary and resulting file
 * 
 * @return 
 */
FUNC_PUBLIC void STB_PVR_RemoveTask(HPlayer hPlayer, const char* id, int removeType);
/**
 * change duration if recording has not finished yet
 * 
 * @param hPlayer player handle
 * @param id      task ID
 * @param endTime new UTC end time in format "YYYYMMDDThhmmss" or UTC ticks (number of seconds since Epoch)
 * 
 * @return 0 - OK
 *         <0 - error code
 */
FUNC_PUBLIC int STB_PVR_ChangeEndTime(HPlayer hPlayer, const char* id, const char* endTime);
/**
 * Set maximum count of simultaneous recording 
 *  
 * @param hPlayer player handle
 * @param maxCnt maximum count of simultaneous recording 
 *  
 */
FUNC_PUBLIC void STB_PVR_SetMaxRecordingCnt(HPlayer hPlayer, int maxCnt);

/**
 * Get metadata information from current media content.
 * It can be data from ID3 tags.
 * 
 * @return C-string in JSON notation with metadata fields
 *         For example:
 *          {"album":"Whisper From The Mirror","album_artist":"Keiko Matsui","artist":"Keiko
 *         Matsui","comment":"","composer":"Keiko Matsui","copyright":"","date":"2000","disc":"","encoder":"","encoded_by":"",
 *         "filename":"","genre":"","language":"","performer":"","publisher":"Narada","title":"Midnight Stone","track":"9"}
 *         
 *         Do not free() this string.
 */
FUNC_PUBLIC const char* STB_GetMetadataInfo(HPlayer hPlayer);

/**
 * Set auto framerate mode.
 * If player has detected movie framerate then it can
 * automaticaly perform switching of video output framerate.
 * Affects only 720p50/60, 1080i50/60 and 1080p50/60 video output modes.
 * After stopping playback video output will return to its base mode.
 * WARNING: 1080p24 may be unsupported by User's TV.
 * 
 * @param hPlayer player handle
 * @param mode    auto framerate mode.
 *                mode is a bitwise OR of STB_AUTO_FRAMERATE_XXX flags.
 * 
 * @return 
 * @example STB_SetAutoFrameRate(hPlayer,STB_AUTO_FRAMERATE_DISABLE) 
 *          disables auto framerate feature
 * 
 *          STB_SetAutoFrameRate(hPlayer,STB_AUTO_FRAMERATE_24|STB_AUTO_FRAMERATE_60)
 *          enables framerate switching to 24Hz and 60Hz video output mode.
 */
FUNC_PUBLIC void STB_SetAutoFrameRate(HPlayer hPlayer, int mode);

/**
 * Get auto framerate mode.
 * If player has detected movie framerate then it can
 * automaticaly perform switching of video output framerate.
 * Affects only 720p50/60, 1080i50/60 and 1080p50/60 video output modes.
 * After stopping playback video output will return to its base mode.
 * WARNING: 1080p24 may be unsupported by User's TV.
 *
 * @param hPlayer player handle
 * @return auto framerate mode.
 *         mode is a bitwise OR of STB_AUTO_FRAMERATE_XXX flags.
 */
FUNC_PUBLIC int STB_GetAutoFrameRate(HPlayer hPlayer);

/**
 * Get auto framerate source playerId.
 *
 * @param hPlayer player handle
 * @return auto framerate source playerId.
  */
FUNC_PUBLIC int STB_GetAutoFrameRateSourcePlayerId(HPlayer hPlayer);

/**
 * Force HDMI output to DVI mode.
 * 
 * @param hPlayer player handle
 * @return  forceDVI :
 *                0 - do not force DVI mode
 *                1 - force DVI mode
 */
FUNC_PUBLIC STBStatus_e 	STB_ForceDVI(HPlayer hPlayer,int forceDVI);

FUNC_PUBLIC int 	STB_GetForceDVI(HPlayer hPlayer);

/**
 * Load external subtitles for current playback
 * 
 * @param hPlayer player handle
 * @param pURL    subtitles URL.
 * 
 * @return 
 */
FUNC_PUBLIC void  STB_LoadExternalSubtitles(HPlayer hPlayer, const char* pURL);
/**
 * Set encoding for external subtitles
 * 
 * @param hPlayer  player handle
 * @param encoding encoding: e.i. UTF-8,CP1250,CP1251,...,CP1258
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetSubtitlesEncoding(HPlayer hPlayer, const char* encoding);

/**
 * Set encoding for external subtitles
 *
 * @param hPlayer  player handle
 * @return encoding encoding: e.i. UTF-8,CP1250,CP1251,...,CP1258
 */
FUNC_PUBLIC const char* STB_GetSubtitlesEncoding(HPlayer hPlayer);

/**
 * Set custom header that will be inserted into all HTTP and RTSP requests.
 * Takes effect on next playback.
 * 
 * @param hPlayer player handle
 * @param pCustomHeader custom header without new line.
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetCustomHeader(HPlayer hPlayer, const char* pCustomHeader);
/**
 * Set 3D conversion mode that specifies how to display 3d video (top-bottom, side-by-side)
 * in fullscreen mode according to the current aspect.
 * 
 * @param hPlayer player handle
 * @param mode    conversion mode
 * 
 * @return 
 * @see STB_3DtoFullscreenMode_e
 */
FUNC_PUBLIC STBStatus_e STB_Set3DtoFullscreenConversionMode(HPlayer hPlayer, STB_3DtoFullscreenMode_e mode);
/**
 * Get current 3D-to-Fullscreen conversion mode.
 * 
 * @param hPlayer player handle
 * 
 * @return current conversion mode
 * @see STB_3DtoFullscreenMode_e
 */
FUNC_PUBLIC STB_3DtoFullscreenMode_e STB_Get3DtoFullscreenConversionMode(HPlayer hPlayer);
/**
 * Get string representing a list of loaded external protocol plugins
 * 
 * @param hPlayer player handle
 * 
 * @return JSON array of loaded external protocol pluguns, e.i.:
 *         [{"name":"test"},{"name":"test2"}]
 */
FUNC_PUBLIC const char* STB_GetExtProtocolList(HPlayer hPlayer);
/**
 * Execute external protocol command
 * 
 * @param hPlayer player handle
 * @param ident   protocol identification name
 * @param cmd     command to be executed
 * @param params  command arguments
 * 
 * @return result of command execution.
 *         Stbplayer user MUST free() it after use.
 */
FUNC_PUBLIC char* STB_ExtProtocolCommand(HPlayer hPlayer, const char* ident, const char* cmd, const char* params);
/**
 * Set whether to check SSL certificate while operating with https content.
 * 
 * @param hPlayer player handle
 * @param enable  0 - disable check
 *                1 - enable check (default)
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetCheckSSLCertificate(HPlayer hPlayer, int enable);

/**
 * Get whether to check SSL certificate while operating with https content.
 *
 * @param hPlayer player handle
 * @return 0 - disable check
 *         1 - enable check (default)
 */
FUNC_PUBLIC int STB_GetCheckSSLCertificate(HPlayer hPlayer);

/**
 * Set Teletext PID 
 * Warning: Not for MAG200 
 * 
 * @param hPlayer player handle
 * @param PID     Teletext PID
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetTeletextPID(HPlayer hPlayer,u16 PID);

/**
 * Set Teletext Page 
 * Warning: Not for MAG200 
 * 
 * @param hPlayer player handle
 * @param page     Teletext page
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetTeletextPage(HPlayer hPlayer, u16 page);

/**
 * Run Teletext command
 * Warning: Not for MAG200
 *
 * @param hPlayer player handle
 * @param command Teletext command which need to run
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_RunTeletextCommand(HPlayer hPlayer, STB_TtxCommand command);

/**
 * Show/hide teletext
 * Warning: Not for MAG200
 *
 * @param hPlayer player handle
 * @param visible Hide teletext if visible == 0, show if not
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_ShowTeletext(HPlayer hPlayer, int visible);

/**
 * is teletext visible
 * Warning: Not for MAG200
 *
 * @param hPlayer player handle
 * @return 1 if teletext visible
 *         0 if not
 */
FUNC_PUBLIC int	STB_GetShowTeletext(HPlayer hPlayer);

/**
 * Set teletext transparency
 * Warning: Not for MAG200
 *
 * @param hPlayer player handle
 * @param transparency Teletext transparency level for background [0..255]
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e	STB_SetTeletextTransparency(HPlayer hPlayer, int transparency);

/**
 * Set teletext transparency
 * Warning: Not for MAG200
 *
 * @param hPlayer player handle
 * @return teletext transparency
 */
FUNC_PUBLIC int	STB_GetTeletextTransparency(HPlayer hPlayer);

/**
 * Retreives the Teletext PID.
 * 
 * @param hPlayer player handle
 * @return return the Teletext PID.
 */

FUNC_PUBLIC unsigned int	STB_GetTeletextPID(HPlayer hPlayer);
/**
 * Get info for all teletext pids.
 * Warning: Not for MAG200 
 * 
 * @param pidCnt   in *pidCnt returns the number of teletext PIDs
 *                 in pids array
 * @param pids     in *pids returns the pointer to array of
 *                 STB_PIDInfo elements.
 * 
 * @return info for all teletext pids.
 *         STB_STATUS_OK if ok.
 * @see STB_PIDInfo
 */
FUNC_PUBLIC STBStatus_e  STB_GetTeletextPIDs(HPlayer hPlayer,int* pidCnt,STB_PIDInfo** pids);
/**
 * Get current HDMI connection state.
 * 
 * @param hPlayer player handle
 * 
 * @return 0 - HDMI disconnected from TV.
 *         1 - HDMI connected to TV, but not in active state e.i. standby mode, TV is off ...
 *         2 - HDMI connected to TV in active state.
 */
FUNC_PUBLIC int STB_GetHDMIConnectionState(HPlayer hPlayer);
/**
 * Set folder for timeshift files
 * 
 * @param hPlayer player handle
 * @param pFolderPath path to folder 
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetTimeShiftFolder(HPlayer hPlayer, const char* pFolderPath);
/**
 * Set maximum size of timeshift window
 * 
 * @param hPlayer player handle
 * @param duration max duration of timeshift window in seconds
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetTimeShiftDurationMax(HPlayer hPlayer, int duration);
/**
 * Switch to TimeShift mode (start recording channel).
 * 
 * @param hPlayer player handle
 * @param pause   0   - do not pause player after switching to TimeShift
 *                > 0 - pause player after switching to TimeShift
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_TimeShiftEnter(HPlayer hPlayer);
/**
 * Switch from TimeShift mode to Live mode. TimeShift buffer will be released.
 * 
 * @param hPlayer  player handle
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_TimeShiftExit(HPlayer hPlayer);
/**
 * Switch from TimeShift mode to Live mode. TimeShift buffer will be saved as PVR task.
 * 
 * @param hPlayer  player handle
 * @param name     name of the recording (only filename without path)
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e STB_TimeShiftExitAndSave(HPlayer hPlayer, const char* path, const char* name);
/**
 * Save timeshift buffer and stop playback.
 * It is possible to continue recording (see duration)
 * 
 * @param hPlayer  player handle
 * @param name     name of the recording (only filename without path)
 * @param duration duration of the recording in seconds.
 *                 If > 0 - PVR will record additional "duration" seconds of content.
 *                 If == 0 - PVR just reports about finished job.
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e STB_TimeShiftExitAndSaveDuration(HPlayer hPlayer, const char* path, const char* name, int duration);
/**
 * Set sliding timeshift mode which defines what happens after reaching the left boundary of timeshift buffer in paused mode.
 * 
 * @param hPlayer player handle
 * @param OnOff   0   - do not slide after buffer overflow in pause mode. 
 *				  STB_EVENT_EXT_PROTOCOL_EVENT will appear with code 4. From this point we can play or seek inside current timeshift buffer but right biundary will never grow
 *				  until we switch into realtime mode.
 *                1 - slide timeshift buffer after overflow in paused mode.
 *				  STB_EVENT_EXT_PROTOCOL_EVENT will appear with code 3. Buffer continues writing from right boundary and drop all data from left boundary in paused mode.
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetTimeShiftSlidingMode(HPlayer hPlayer, int OnOff);
/**
 * Get full list of DVB channels in JSON format, e.i.: 
 * {"channels":[ {"frequency": "634000", "id": "C_4601_634000",	"scrambled": 
 *  "false", "name": "ServiceName", "provider":
 * "testProvider","isRadio":"false"},...] } 
 * 
 * 
 * Pointer MUST be freed by caller.
 *  
 * @param hPlayer player handle
 *  
 * @return pointer to C-string or NULL
 */
FUNC_PUBLIC char* STB_DVB_GetChannelList(HPlayer hPlayer);

/**
 * Get dvb tuner count
 *
 * @param hPlayer player handle
 *
 * @return dvb tuner count
 */
FUNC_PUBLIC int STB_DVB_TunerCount(HPlayer hPlayer);

/**
 * Get full list of DVB channels in JSON format, e.i.: 
 * {"channels":[ {"frequency": "634000", "id": "C_4601_634000",	"scrambled": 
 *  "false", "name": "ServiceName", "provider":
 * "testProvider","isRadio":"false"},...] } 
 * 
 * 
 * Pointer MUST be freed by caller.
 *  
 * @param hPlayer player handle
 * @param id     channel id
 *  
 * @return pointer to C-string or NULL
 */
FUNC_PUBLIC char* STB_DVB_GetChannelInfo(HPlayer hPlayer, const char* id);
/**
 * Remove all channels from list.
 * 
 * @param hPlayer player handle
 *  
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_ClearChannelList(HPlayer hPlayer);
/**
 * Remove specified channel from list
 * 
 * @param hPlayer player handle
 * @param id     channel id
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_RemoveChannel(HPlayer hPlayer, const char* id);

/**
 * Remove specified channel from list
 *
 * @param hPlayer player handle
 * @param sessionId - session id
 * @param index     channel index, showld be less then STB_GetDvbChannelCount result
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_RemoveChannelIndex(HPlayer hPlayer, int sessionId, int index);

/**
 * Start automatic dvb channel scan.
 * 
 * When frequency with some channels is found, player will trigger event STB_EVENT_DVB_SCAN_FOUND.
 * When scan has finished, player will trigger event STB_EVENT_DVB_SCAN_PROGRESS with status = finished.
 * 
 * @param hPlayer  player handle
 * @param DVB_Type DVB type, see DVB_TYPE_XX
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_StartChannelScan(HPlayer hPlayer, int DVB_Type);
/**
 * Start dvb channel scan in manual mode.
 * 
 * When frequency with some channels is found, player will trigger event STB_EVENT_DVB_SCAN_FOUND.
 * When scan has finished, player will trigger event STB_EVENT_DVB_SCAN_PROGRESS with status = finished.
 * 
 * @param hPlayer  player handle
 * @param from     Frequency range start in KHz
 * @param to       Frequency range end in KHz
 * @param DVB_Type DVB type, see DVB_TYPE_XX
 * @param step     scan step in KHz
 * @param BW       Bandwidth in MHz
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_StartChannelScanManual(HPlayer hPlayer, int from, int to, int DVB_Type, int step, int BW);
/**
 * Stop scan process
 *  
 * @param hPlayer player handle
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_StopChannelScan(HPlayer hPlayer);
/**
 * Tune to specified frequency.
 * Used for manual scan, e.i.:
 * For given frequency call XXX, then check signal quality with XXX.
 * When there is some signal call XXX
 * 
 * @param hPlayer player handle
 * @param freq   Frequency in KHz
 * @param BW     don't care
 * @param DVB_Type DVB type, see DVB_TYPE_XX
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_TuneChannel(HPlayer hPlayer, int freq, int BW, int DVB_Type);
/**
 * Get signal level
 * 
 * @param hPlayer player handle
 *  
 * @return signal level: 0-100
 */
FUNC_PUBLIC int STB_DVB_GetLevel(HPlayer hPlayer);
/**
 * Get signal quality
 * 
 * @param hPlayer player handle
 *  
 * @return signal level: 0-100
 */
FUNC_PUBLIC int STB_DVB_GetQuality(HPlayer hPlayer);
/**
 * Get Bit Error Rate
 * 
 * @param hPlayer player handle
 *  
 * @return (Bit Error Rate)*10^7
 */
FUNC_PUBLIC unsigned int STB_DVB_GetBER(HPlayer hPlayer);
/**
 * Untune frequency.
 * Recommended to call right after manual scan.
 *  
 * @param hPlayer player handle
 *  
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC int STB_DVB_UnTuneChannel(HPlayer hPlayer);
/**
 * Get full EPG(program schedule) for specified channel
 * 
 * 
 * Pointer MUST be freed by caller.
 * 
 * @param hPlayer player handle
 * @param id      channel id
 * @param day     Specifies whether to return whole EPG or only for required day.
 *                Numeration starts from 0.
 *                -1 means whole EPG.
 * 
 * @return pointer to C-string or NULL
 */
FUNC_PUBLIC char* STB_DVB_GetEPGSchedule(HPlayer hPlayer, const char* id, int day);
/**
 * Get full EPG(program schedule) for specified channel within
 * specified time range
 *
 * Pointer MUST be freed by caller.
 *
 * @param hPlayer player handle
 * @param id      channel id
 * @param start   Range start in seconds since epoch.
 * @param end     Range end in seconds since epoch.
 *
 * @return pointer to C-string or NULL
 */
FUNC_PUBLIC char* STB_DVB_GetEPGScheduleByRange(HPlayer hPlayer, const char* id, u32 start, u32 end);
/**
 * Get brief EPG(present and following program) for specified channel
 * 
 * 
 * Pointer MUST be freed by caller.
 *  
 * @param hPlayer player handle
 * @param id     channel id
 *  
 * @return pointer to C-string or NULL
 */
FUNC_PUBLIC char* STB_DVB_GetEPGBrief(HPlayer hPlayer, const char* id);
/**
 * Get all DVB types supported by this STB.(depends on model).
 * To switch for example from DVB-T to DVB-C reboot is required.
 * 
 * @param hPlayer player handle
 * 
 * @return JSON array of all supported DVB types, e.i.:
 *         [{"type":1,"name":"DVB-C"},...,{"type":3,"name":"DVB-T2"}]
 * DO NOT free returned pointer.
 */
FUNC_PUBLIC const char* STB_DVB_GetSupportedScanTypes(HPlayer hPlayer);
/**
 * Get all DVB types supported by this STB.(depends on model).
 * To switch for example from DVB-T to DVB-C reboot is required.
 *
 * @param hPlayer player handle
 * @param size - pointer to store count of supported dvb types
 * @return pointer to array of supported DVB types
 * DO NOT free returned pointer.
 */
FUNC_PUBLIC const char* STB_DVB_GetSupportedScanTypesRaw(HPlayer hPlayer, int *typesCount);

/**
 * Get DVB types supported by this STB in current session.
 * For example if STB has support for DVB-C, DVB-T, DVB-T2, then probably
 * in current session will be available either DVB-C or both DVB-T and DVB-T2.
 * If both DVB-T and DVB-T2 are available then player can scan both DVB-T and DVB-T2 without reboot.
 * But to switch for example from DVB-T to DVB-C reboot is required.
 * (Also user should set bootloader variable "dvb_type" with corresponding value e.i. "DVB-C").
 * 
 * @param hPlayer player handle
 * 
 * @return JSON array of current supported DVB types, e.i.:
 *         [{"type":2,"name":"DVB-T"},...,{"type":3,"name":"DVB-T2"}]
 * DO NOT free returned pointer.
 */
FUNC_PUBLIC const char* STB_DVB_GetCurrentScanTypes(HPlayer hPlayer);

/**
 * Get DVB types supported by this STB in current session.
 * For example if STB has support for DVB-C, DVB-T, DVB-T2, then probably
 * in current session will be available either DVB-C or both DVB-T and DVB-T2.
 * If both DVB-T and DVB-T2 are available then player can scan both DVB-T and DVB-T2 without reboot.
 * But to switch for example from DVB-T to DVB-C reboot is required.
 * (Also user should set bootloader variable "dvb_type" with corresponding value e.i. "DVB-C").
 *
 * @param hPlayer player handle
 * @param size - pointer to store count of current dvb types
 *
 * @return pointer to array of current DVB types
 * DO NOT free returned pointer.
 */
FUNC_PUBLIC const char* STB_DVB_GetCurrentScanTypesRaw(HPlayer hPlayer, int *typesCount);


#if defined(__cplusplus)
/**
 * Set preferred language for DVB subsystem
 * 
 * @param hPlayer player handle
 * @param langSet languages, e.i. lang1 can be eng  and lang2 can be en
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_DVB_SetPreferredLang(HPlayer hPlayer,STB_LangSet& langSet);

/**
 * Get the primary and secondary languages for dvb.
 *
 * @param hPlayer player handle
 * @param langSet pointer to the set of languages.
 *
 * @return STB_STATUS_OK if no error. Fill *langSet by
 *         laguages. If not defined - STB_Lang fills by 0-s.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_DVB_GetPreferredLang(HPlayer hPlayer, STB_LangSet &langSet);

#endif //__cplusplus



/**
 * Enable/disable antenna power.
 * 
 * If power is enabled on passive antenna then power will be disabled and event STB_EVENT_DVB_POWER_OVERLOAD occured.
 * 
 * @param hPlayer player handle
 * @param enabled 0 - disable antenna power
 *                1 - enable antenna power
 * 
 * @return STB_STATUS_OK if success
 */
FUNC_PUBLIC STBStatus_e STB_DVB_SetAntennaPower(HPlayer hPlayer, int enabled);
/**
 * Check whether antenna power is enabled
 * 
 * @param hPlayer player handle
 * 
 * @return 0 - antenna power is disabled
 *         1 - antenna power is enabled
 */
FUNC_PUBLIC int STB_DVB_GetAntennaPower(HPlayer hPlayer);
/**
 * Get player statistics.
 *  
 * @param hPlayer  player handle
 *  
 * @return player statistics in JSON format.
 */
FUNC_PUBLIC const char* STB_GetStatistics(HPlayer hPlayer);

/**
 * Get player statistics.
 *
 * @param hPlayer  player handle
 *
 * @return player statistics struct.
 */
FUNC_PUBLIC STBStatus_e STB_GetRawStatistics(HPlayer hPlayer, STB_PlayerStat *stat);

/**
 * Clear all player statistics
 *  
 * @param hPlayer  player handle
 *  
 * @return 
 */
FUNC_PUBLIC void STB_ClearStatistics(HPlayer hPlayer);
/**
 * Set syslog logging level.
 * By default logging to syslog is disabled: STB_LOG_LEVEL_QUIET
 * 
 * @param hPlayer player handle
 * @param level   See STB_LOG_LEVEL_XXX.
 *                Can be OR-ed e.i.
 *                STB_LOG_LEVEL_ERROR | STB_LOG_LEVEL_INFO
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetLogLevel(HPlayer hPlayer, unsigned int level);
/**
 * Get media size in bytes.
 * 
 * @param hPlayer player handle
 * 
 * @return media size in bytes.
 *         0 - not available.
 */
FUNC_PUBLIC u64  STB_GetMediaSizeBytes(HPlayer hPlayer);
/**
 * Get count of bytes read from last SetPos or Stop.
 * 
 * @param hPlayer player handle
 * 
 * @return count of bytes read from last SetPos or Stop.
 */
FUNC_PUBLIC u64  STB_GetFetchedBytes(HPlayer hPlayer);
/**
 * Fill array with speeds supported by current content.
 * 
 * @param hPlayer   player handle
 * @param pSpeedArray
 *                  pointer to array of speeds
 *                  See STB_SetSpeed for speed values.
 *                  Speed value 0 means that content can be paused.
 * @param arraySize size of pSpeedArray
 * 
 * @return count of speed values written into pSpeedArray
 */
FUNC_PUBLIC int  STB_GetSupportedSpeeds(HPlayer hPlayer, s8* pSpeedArray, int arraySize);
/**
 * Get current Aspect Ratio signalled by video output to TV
 * 
 * @param hPlayer player handle
 * 
 * @return current output aspect ratio
 */
FUNC_PUBLIC STB_OutputAspectRatio_e STB_GetOutputAspectRatio(HPlayer hPlayer);
/**
 * Set aspect ratio to be signalled to video output
 * 
 * @param hPlayer player handle
 * @param aspect  new aspect ratio
 * 
 * @return ST_STATUS_OK - OK
 *         otherwise    - error
 */
FUNC_PUBLIC STBStatus_e STB_SetOutputAspectRatio(HPlayer hPlayer,STB_OutputAspectRatio_e aspect);
/**
 * Set video plane position and size in pixels and clipping rectangle for input video.
 * 
 * @param hPlayer  player handle
 * @param view     video plane position and size in pixels
 * @param clip     position and size of clip rectangle.
 *                 Only this rectangle will be shown in specified viewport.
 *                 
 *                 If width==0 or height==0 in clip rectangle then clip will be ignored.
 *                 
 *                 If clip rectangle is ignored or has size equal to encoded video size
 *                 then aspect ratio conversion will be performed in viewport rectangle
 *                 according to the current aspect for fullscreen mode.
 *                 
 *                 Clip rectangle size and position should be in pixels of the encoded
 *                 video.
 *                 Width and height of encoded video can be retrieved via STB_GetVideoInfo.
 *                 See uiImageWidth and uiImageHeight fields of STB_VideoInfo struct.
 *  
 * @param saveClip whether player should save clip region over the sequential playbacks:
 *                 0 - use this clip only for current playback
 *                 1 - use this clip till next call of STB_SetViewportEx, STB_SetViewport, STB_SetPIG
 * 
 * @return STB_STATUS_OK if success
 * @see Viewport_Info
 */
FUNC_PUBLIC STBStatus_e STB_SetViewportEx(HPlayer hPlayer, Viewport_Info * view, Viewport_Info * clip, u8 saveClip);

/**
 * Get video plane position and size in pixels and clipping rectangle for input video.
 *
 * @param hPlayer  player handle
 * @param view     if not null store video plane position and size in pixels
 * @param clip     if not null store position and size of clip rectangle.
 *                 Only this rectangle will be shown in specified viewport.
 *
 *                 If width==0 or height==0 in clip rectangle then clip will be ignored.
 *
 *                 If clip rectangle is ignored or has size equal to encoded video size
 *                 then aspect ratio conversion will be performed in viewport rectangle
 *                 according to the current aspect for fullscreen mode.
 *
 *                 Clip rectangle size and position should be in pixels of the encoded
 *                 video.
 *                 Width and height of encoded video can be retrieved via STB_GetVideoInfo.
 *                 See uiImageWidth and uiImageHeight fields of STB_VideoInfo struct.
 *
 * @param saveClip if not null store info whether player should save clip region over the sequential playbacks:
 *                 0 - use this clip only for current playback
 *                 1 - use this clip till next call of STB_SetViewportEx, STB_SetViewport, STB_SetPIG
 *
 * @return STB_STATUS_OK if success
 * @see Viewport_Info
 */
FUNC_PUBLIC STBStatus_e STB_GetViewportEx(HPlayer hPlayer, Viewport_Info * view, Viewport_Info * clip, u8 *saveClip);


/**
 * Get information about HLS stream variants (mostly about bitrates) in JSON format.
 * 
 * @param hPlayer Player handle.
 * 
 * @return information about bitrates of HLS stream variants in JSON format:
 *         {"currentVariant" : 1, "variants" : [ 323613, 533981, 755232, 1384811, 2020273]}
 *         variants is available only for Apple HLS streams.
 *         variants - list of bitrates for all variants. Can be empty.
 *         currentVariant - number of currently active variant in variants array.
 *         
 *         Do not free.
 */
FUNC_PUBLIC const char* STB_GetHLSInfo(HPlayer hPlayer);

/**
 * Get information about HLS stream variants (mostly about bitrates) in JSON format.
 *
 * @param hPlayer Player handle.
 *
 * @return information about bitrates of HLS stream variants in JSON format:
 *         {"currentBitrate" : 323613, "bitrateList" : [ 323613, 533981, 755232, 1384811, 2020273]}
 *         bitrateList is available only for Apple HLS streams.
 *         bitrateList - list of bitrates for all variants. Can be empty.
 *         currentBitrate - number of currently active variant in variants array.
 *         could be zero in case of errors
 *         Do not free.
 */
FUNC_PUBLIC const char* STB_GetHLSInfo_v2(HPlayer hPlayer);

/**
 * Setup Verimatrix Web CAS client.
 * 
 * @param hPlayer player handle
 * @param bootServer Boot server address ("name:port")
 * @param companyName
 *                   Company name
 * 
 * @return ST_STATUS_OK - OK
 *         otherwise    - error
 */
FUNC_PUBLIC STBStatus_e STB_SetupWebCAS(HPlayer hPlayer, const char* bootServer, const char* companyName);
/**
 * Enable/disable logging of Verimatrix Web client
 * 
 * @param hPlayer player handle
 * @param enable logging
 */
FUNC_PUBLIC void STB_SetWebCASLogging(HPlayer hPlayer, int enable);
/**
 * Set params for DVB channel scan.
 * 
 * @param hPlayer   player handle
 * @param pJsonData parameters in json format, e.i.:
 *                  {
 *                  "type": 1,
 *                  "symRate": 6875,
 *                  "modulation": 4,
 *                  "scanMode": 1,
 *                  "frequency": 506000,
 *                  "networkId": 3333
 *                  }
 *                  Where:
 *                  type - DVB_Type see DVB_TYPE_XXX
 *                  symRate - symbolRate in Ks/sec
 *                  modulation - see STB_DVB_MODULATION_XXX
 *                  scanMode:
 *                  0 - network,
 *                  1 - full,
 *                  2 - fast (use NIT)
 *                  frequency - frequency for fast scan in KHz
 *                  networkId - network ID (0 - auto)
 * 
 * @return STB_STATUS_OK if no error.
 * @see STB_DVB_MODULATION_XXX
 */
FUNC_PUBLIC STBStatus_e STB_DVB_SetScanParams(HPlayer hPlayer, const char* pJsonData);
/**
 * Get player option.
 * 
 * @param hPlayer player handle
 * @param name   option name
 * 
 * @return option value - NULL or C-string
 *         MUST be freed.
 */
FUNC_PUBLIC char* STB_GetPlayerOption(HPlayer hPlayer, const char* name);
/**
 * Set player option
 * 
 * @param hPlayer player handle
 * @param name   option name
 * @param value  option value
 * 
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_SetPlayerOption(HPlayer hPlayer, const char* name, const char* value);
/**
 * Reset player options.
 *  
 * @param hPlayer player handle
 * 
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_ResetPlayerOptions(HPlayer hPlayer);
/**
 * Get current top window
 * 
 * @param hPlayer player handle
 * 
 * @return top window number:
 *         0 - graphic
 *         1 - video
 */
FUNC_PUBLIC u8 	STB_GetTopWin(HPlayer hPlayer);
#if defined(__cplusplus)
/**
 * Set preferred language for EPG subsystem
 * 
 * @param hPlayer player handle
 * @param langSet languages, e.i. lang1 can be eng  and lang2 can be en
 * 
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_EPG_SetPreferredLang(HPlayer hPlayer,STB_LangSet& langSet);

/**
 * Get the primary and secondary languages for epg.
 *
 * @param hPlayer player handle
 * @param langSet pointer to the set of languages.
 *
 * @return STB_STATUS_OK if no error. Fill *langSet by
 *         laguages. If not defined - STB_Lang fills by 0-s.
 * @see STB_LangSet
 */
FUNC_PUBLIC STBStatus_e STB_EPG_GetPreferredLang(HPlayer hPlayer, STB_LangSet &langSet);

#endif //__cplusplus
/**
 * Enable EPG
 * 
 * @param hPlayer player handle
 * @param enable  0 - disable
 *                1 - enable
 * 
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_EPG_Enable(HPlayer hPlayer, unsigned int enable);
/**
 * Set active Player by ID
 * 
 * @param hPlayer  Player handle
 * @param PlayerId active player instance
 * 
 * @return 
 */
FUNC_PUBLIC STBStatus_e STB_SetActivePlayer(HPlayer hPlayer, int PlayerId);
/**
 * Get active player instance id
 * 
 * @param hPlayer player handle
 * 
 * @return Active Player id
 */
FUNC_PUBLIC int STB_GetActivePlayer(HPlayer hPlayer);
/**
 * Get count of available player instances.
 * 
 * @param hPlayer player handle
 * 
 * @return count of available player instances
 */
FUNC_PUBLIC int STB_GetPlayerCnt(HPlayer hPlayer);
/**
 * Swap main and PiP players
 * 
 * @param hPlayer player handle
 *
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_SwapPlayers(HPlayer hPlayer, int playerId1, int playerId2);
/**
 * Get audio source player id
 *
 * @param hPlayer player handle
 *
 * @return player id if audio source exists, -1 if audio source not found
 */
FUNC_PUBLIC int STB_GetAudioSource(HPlayer hPlayer);
/**
 * Set player as audio source
 *
 * @param hPlayer player handle
 * @param playerId - player id
 *
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_SetAudioSource(HPlayer hPlayer, int playerId);
/**
 * Disable player as audio source
 *
 * @param hPlayer player handle
 * @param playerId - player id
 *
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_DisableAudioSource(HPlayer hPlayer, int playerId);
/**
 * Disable all audio sources
 *
 * @param hPlayer player handle
 *
 * @return STB_STATUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_DisableAllAudioSources(HPlayer hPlayer);
/**
 * Get primary playerId
 * 
 * @param hPlayer player handle
 * 
 * @return primary player id.
 */
FUNC_PUBLIC int STB_GetPrimaryPlayerId(HPlayer hPlayer);

/**
 * Set callback function for dvb session handling.
 *
 * @param hPlayer player handle
 * @param cb      Callback function.
 *                Set cb to NULL to clear it.
 * @paran sessionId - will be set to current session id
 *
 * @return STB_STAUS_OK if no error.
 * @see STB_EVENT_CALLBACK
 */
FUNC_PUBLIC STBStatus_e STB_SetDvbSessionCallback(HPlayer hPlayer, STB_DVB_SESSION_CALLBACK cb, int *sessionId);

/**
 * Get dvb channel count according to session id
 *
 * @param hPlayer player handle
 *
 * @return dvb channel count
 */
FUNC_PUBLIC int STB_GetDvbChannelCount(HPlayer hPlayer, int sessionId);

/**
 * Get dvb channel information by session id and channel index
 *
 * @param hPlayer player handle
 * @param sessionId - session id
 * @param channelIndex - channel should be less then channel count
 * @channel - pointer to return value if success
 *
 * @return STB_STAUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_GetDvbChannelInfo(HPlayer hPlayer, int sessionId, int channelIndex, STB_DvbChannelInfo *channel);

/**
 * Check if dvb channel satisfies condition
 *
 * @param hPlayer player handle
 * @param sessionId - session id
 * @param index - channel. should be less then channel count
 * @param filter - pointer to filter function
 * @param context - pointer to context which used in filter function
 *
 * @return 0 - if channel not satisfies condition
 *         1 - if channel satisfies condition
 */
FUNC_PUBLIC int STB_FilterDvbChannel(HPlayer hPlayer, int sessionId, int index, STB_DVB_CHANNEL_FILTER filter, const void *context);

/**
 * Get standby mode which will be applied on next standby
 * entering
 * 
 * @param hPlayer player handle
 * 
 * @return see StandbyMode_e
 */
FUNC_PUBLIC StandbyMode_e STB_GetStandByMode(HPlayer hPlayer);
/**
 * Set standby mode which will be applied on next standby
 * entering
 * 
 * @param hPlayer player handle
 * @param mode    StandbyMode_e
 * 
 * @return 
 */
FUNC_PUBLIC void STB_SetStandByMode(HPlayer hPlayer, StandbyMode_e mode);
/**
 * Returns whether player is in standby mode now.
 * 
 * @param hPlayer player handle
 * 
 * @return false - in active state
 *         true  - in standby state
 */
FUNC_PUBLIC bool STB_GetStandByState(HPlayer hPlayer);
/**
 * Get list of all supported standby modes
 * 
 * @param pModes pointer to resulting array of modes StandbyMode_e.
 * @param count  count of elements in pModes
 * 
 * @return count of actually filled modes.
 */
FUNC_PUBLIC int STB_GetSupportedStandbyModes(HPlayer hPlayer, StandbyMode_e* pModes, int count);
/**
 * Get list of all supported wakeup sources
 * 
 * @param pSources pointer to resulting array of sources
 * @param count  count of elements in pSources
 * 
 * @return count of actually filled sources.
 */
FUNC_PUBLIC int STB_GetSupportedWakeUpSources(HPlayer hPlayer, PowerWakeUpSource_e* pSources, int count);
/**
 * Set a new list of active wakeup sources
 * 
 * @param pSources pointer to resulting array of sources
 * @param count    count of elements in pSources
 * 
 * @return STB_STAUS_OK if no error.
 */
FUNC_PUBLIC STBStatus_e STB_SetWakeUpSources(HPlayer hPlayer, PowerWakeUpSource_e* pSources, int count);
/**
 * Get list of active wakeup sources
 * 
 * @param pSources pointer to resulting array of sources
 * @param count    count of elements in pSources
 * 
 * @return count of actually filled sources.
 */
FUNC_PUBLIC int STB_GetWakeUpSources(HPlayer hPlayer, PowerWakeUpSource_e* pSources, int count);

#endif //_STBPLAYER_H_
