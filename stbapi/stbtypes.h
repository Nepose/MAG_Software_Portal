/*
*	STBPlayer types definition file for the STB video and audio subsystems manipulations
*	Date 07/02/2008
*/

#ifndef _STBTYPES_H_
#define _STBTYPES_H_

#ifndef FUNC_PUBLIC
	#ifdef __cplusplus
		#define FUNC_PUBLIC  extern "C"
	#else /* __cplusplus */
		#define FUNC_PUBLIC  extern 
	#endif /* __cplusplus */
#endif /* FUNC_PUBLIC*/

#if defined(__cplusplus)
extern "C" {
#endif

typedef unsigned int STBStatus_e;

#define u8      unsigned char
#define s8      char
#define u16     unsigned short
#define s16     short
#define u32     unsigned int
#define s32     int
#define u64     unsigned long long
#define HANDLE_INVALID NULL

#define STB_API_Version 146

typedef void*	HPlayer;
/**
 * Video plane position and mode
 */
typedef struct	PIG_Info
{
  /**
   * Fullscreen state.
   */
  s16	state;
  /**
   * Picture scale.
   * Real_scale = scale/256.0
   * Ignoring if scale == 0.
   */
  s16	scale;
  /**
   * Picture x offset.
   * Ignoring if xpos < 0.
   */
  s16	xpos;
  /**
   * Picture y offset.
   * Ignoring if ypos < 0.
   */
  s16	ypos;
}PIG_Info;

typedef struct Viewport_Info 
{
	/**
	 * Picture x offset. xpos >= 0.
	 */
	s32 xpos;
	/**
   * Picture y offset. ypos >= 0.
   */
	s32 ypos;
	/**
   * Picture width. width > 0.
   */
	s32 width;
  /**
   *  Picture height. height > 0
   */
	s32 height;
} Viewport_Info;

	/**
	 * Parameters for RTSP client.
	 */
typedef struct STBParamRTSP_s 
{
	/**
	 * Type of the RTSP server.
	 */
  u16 type;      			/* @field RTSP server type see <t STB_RTSP_TYPE_xxx>*/
	/**
	 * RTSP client flags
	 * 
	 * @see STB_RTSP_FLAG_XXX
	 */
	u16 Flags;					/* @field flags see <t STB_RTSP_FLAG_xxx>*/
} STBParamRTSP_t;

/* Select RTSP server type */
#define STB_RTSP_TYPE_VLC			0 /* @demem VLC based RTSP server. */
#define STB_RTSP_TYPE_BITBAND	1 /* @demem BitBand RTSP server. */
#define STB_RTSP_TYPE_KASENNA	2 /* @demem Kasenna RTSP server. */
#define STB_RTSP_TYPE_ARRIS     3 /* @demem Arris RTSP server. */
#define STB_RTSP_TYPE_LIVE555   4 /* @demem Live555 RTSP server. */
#define STB_RTSP_TYPE_ZTE       5 /* @demem ZTE RTSP server. */
#define STB_RTSP_TYPE_NETUP     6 /* @demem NETUP RTSP server. */
#define STB_RTSP_TYPE_ELECARD   7 /* @demem ELECARD RTSP server. */
#define STB_RTSP_TYPA_MAX       7 /* max rtsp type code */

/* Flags for RTSP client*/
#define STB_RTSP_FLAG_KA							(1<<0) /* @demem KeepAlive flag. Sending GET_PARAMETER as keep-alive message*/
#define STB_RTSP_FLAG_ANNOUNCE_EOS		(1<<1) /* @demem Determine End Of Stream in announce (x-notice). */
#define STB_RTSP_FLAG_GET_EOS					(1<<2) /* @demem Determine End Of Stream in GET_PARAMETER response (x-notice). */
#define STB_RTSP_FLAG_TM_EOS					(1<<3) /* @demem Determine End Of Stream after timeout when player can't receive any stream data. */
#define STB_RTSP_FLAG_RTPTIME_EOS			(1<<4) /* @demem EndOfStream after small timeout using rtptime.(At the end of video.) */
#define STB_RTSP_FLAG_UDP							(1<<5) /* @demem Use UDP transport (e.i. for Kasenna RTSP-server). */
#define STB_RTSP_FLAG_RTP_OVER_RTSP			(1<<6) /* @demem Use RTP transport over RTSP connection. */
#define STB_RTSP_FLAG_UPDATE_MEDIA_DURATION	(1<<7) /* @demem Update media duration on every GetMediaLen call. */
#define STB_RTSP_FLAG_NONSMOOTH_PAUSE	(1<<8) /* @demem Use non smooth exit from pause since server streaming leads to overflow. */

typedef struct STB_Lang
{
	union 
	{
		//Language tag ISO 639. tagVal filled with 0 means undefined tag
		unsigned int tagVal:24;
		//Language tag ISO 639. tag filled with 0-s means undefined tag
		char	tag[3];
	};
}STB_Lang;
/**
 * The set of primary and secodary languages
 */
typedef struct STB_LangSet
{
	//primary language tag.
	STB_Lang			lang;
	//secondary language tag.
	STB_Lang			lang2;
}STB_LangSet;

typedef enum
{
  CodecTypeNone = 0,
  //Audio
  CodecTypeMp2a = 1,
  CodecTypeMp3  = 2,
  CodecTypeAC3  = 3,
  CodecTypeAAC  = 4,
  CodecTypePCM  = 5,
  CodecTypeOGG  = 6,
  CodecTypeDTS  = 7,
  CodecTypeEAC3 = 8,
  //Subtitles
  CodecTypeSubDVB  = 0x20,
  CodecTypeSubText = 0x21,
  /**
   * Closed caption
   */
  CodecTypeSubCC   = 0x22,
  CodecTypeSubDVD  = 0x23,
  /**
   * External subtitles
   */
  CodecTypeSubExt  = 0x24,
  /**
   * Teletext subtitles
   */
  CodecTypeSubTtx  = 0x25,
  /**
   * PGS subtitles
   */
  CodecTypeSubPGS  = 0x26,
}STB_CodecType_e;
/**
 * PIDs Info element
 */
typedef struct STB_PIDInfo
{
	// PID number.
	unsigned int	PID;
	//Language tag associated with this PID.
	STB_Lang			lang;
	//Secondary Language tag associated with this PID.
	STB_Lang			lang2;
}STB_PIDInfo;
/**
 * Extended PIDs Info element
 */
typedef struct STB_PIDInfoEx
{
	// PID number.
	unsigned int	PID;
	//Language tag associated with this PID.
	STB_Lang			lang;
	//Secondary Language tag associated with this PID.
	STB_Lang			lang2;
    STB_CodecType_e     codecType;
}STB_PIDInfoEx;


/*
    After event handling is set by STB_SetEventCallback, stbplayer 
    will call callback function with parameter event  according to described below
*/
//	no Event
#define STB_EVENT_NO			0
//	received End of Stream
#define STB_EVENT_EOS			1
//	received tracks Information. 
// 	Now it is possible to read Audio and Video PIDs.
#define STB_EVENT_GOT_TRACKS		2
//	receiver DISCONNECT at stream
#define STB_EVENT_DISCONNECT		3
//	Video and Audio playback started.
#define STB_EVENT_MEDIASTART		4
/**
 * Error opening content (rtsp media not found or connection error)
 */
#define STB_EVENT_OPEN_ERROR		5
/**
 * Detected dual mono audio stream
 */
#define STB_EVENT_DUAL_MONO         6
/**
 * Decoder has got video information:
 * FrameRate, width, height, pixel AR.
 * Now is is possible to read Video Information via STB_GetVideoInfo
 * 
 * @see STB_GetVideoInfo
 */
#define STB_EVENT_VIDEOINFO         7
/**
 * Error loading external subtitles.
 */
#define STB_EVENT_SUBTITLE_LOAD_ERROR    8
/**
 * Tracks information have been updated. 
 * 
 * E.i. player has found new tracks: Closed Caption, Teletext Subtitles, etc.
 */
#define STB_EVENT_TRACKS_INFO_UPDATED    9

#define STB_EVENT_NONBLOCKING       0x20
#define STB_EVENT_NONBLOCKING_MASK  0xE0
/**
 * HDMI connected
 */
#define STB_EVENT_HDMI_CONNECT      STB_EVENT_NONBLOCKING
/**
 * HDMI disconnected
 */
#define STB_EVENT_HDMI_DISCONNECT   (STB_EVENT_NONBLOCKING+1)
/**
 * PVR task completed
 */
#define STB_EVENT_PVR_TASK_COMPLETED  (STB_EVENT_NONBLOCKING+2)
/**
 * PVR task error occured
 */
#define STB_EVENT_PVR_TASK_ERROR    (STB_EVENT_NONBLOCKING+3)
/**
 * External protocol event
 */
#define STB_EVENT_EXT_PROTOCOL_EVENT  (STB_EVENT_NONBLOCKING+4)
/* 
* STB_EVENT_NONBLOCKING+5 and  STB_EVENT_NONBLOCKING+6 are reserved by download manager
*/ 
/**
 * PVR task started recording
 */
#define STB_EVENT_PVR_TASK_STARTED_RECORDING  (STB_EVENT_NONBLOCKING+7)
/**
 * Scan completed
 */
#define STB_EVENT_DVB_SCAN_PROGRESS  (STB_EVENT_NONBLOCKING+8)
/**
 * Found channel during scan
 */
#define STB_EVENT_DVB_SCAN_FOUND      (STB_EVENT_NONBLOCKING+9)
/**
 * EPG has been updated
 */
#define STB_EVENT_EPG_UPDATED         (STB_EVENT_NONBLOCKING+10)
/**
 * Power overload has been occured on antenna input. Usually this happens while enabling power for passive antenna.
 */
#define STB_EVENT_DVB_POWER_OVERLOAD  (STB_EVENT_NONBLOCKING+11)
/**
 * RTP discontinuity detected
 */
#define STB_EVENT_RTPERROR          0x81


#define STB_EVENT_TS_BEGIN          0x82
#define STB_EVENT_TS_LIVE           0x83


/**
 * Event callback type definition
 */
typedef int (*STB_EVENT_CALLBACK) (unsigned int event);
/**
 * Event callback type definition extended version (with arguments) 
 * pJSONParamString - C-string in JSON format. Can be NULL 
 */
typedef int (*STB_EVENT_CALLBACK_EXT) (unsigned int event, const char* pJSONParamString);
/**
 * Event callback type definition extended version (with arguments) 
 * pJSONParamString - C-string in JSON format. Can be NULL 
 */
typedef int (*STB_EVENT_CALLBACK_MULTI) (unsigned int event, const char* pJSONParamString, int PlayerId, int PlaybackId);
/**
 * Event control callback type definition 
 * @see STB_SetEventCtrlCallback 
 */
typedef int (*STB_EVENT_CTRL_CALLBACK) (int enabled);
/**
 * Playback Id assignment callback. It turns off STB_EVENT_CTRL_CALLBACK/STB_SetEventCtrlCallback handling.
 * @see STB_SetEventCtrlCallback 
 */
typedef int (*STB_PLAYBACK_ID_ASSIGN_CALLBACK) (int PlayerId, int PlaybackId);


/**
 * Video information type definition.
 * 
 * Here uiImageWidth and uiImageHeight - size in pixels of encoded video.
 * In common case this size is not proportional. 
 * E.i. we have 4:3 video with 
 *  uiImageWidth = 704
 *  uiImageHeight = 576
 *  uiImagePARh = 12
 *  uiImagePARv = 11
 * 
 * in this case (uiImageWidth / uiImageHeight) != 4/3 because pixels are square
 * but (uiImageWidth * uiImagePARh / uiImagePARv) / uiImageHeight == 4/3
 * 
 * So on TV screen (TV output mode) with square pixels video width should be equal	to 
 *   uiImageWidth * uiImagePARh / uiImagePARv = 768
 * to get proportional video 768 / 576 == 4/3
 */
typedef struct STB_VideoInfo
{
	// Type of the curent video coding. See STB_MEDIATYPE_xxx
	unsigned int			 mediaType;
	// Source image width in pixels. 
	unsigned int       uiImageWidth;     
	// Source image height in pixels.
	unsigned int       uiImageHeight;    
	// Source Pixel Aspect Ratio - horizontal.
	unsigned int       uiImagePARh;      
	// Source Pixel Aspect Ratio - vertical.
	unsigned int       uiImagePARv;      
	// Average bit rate of stream.
	unsigned int       uiAverageBitrate; 
	// Maximum bit rate of stream.
	unsigned int       uiMaxBitrate;     
	// Frame Rate (per sec X 1000).
	unsigned int		   eFrameRate;       
}STB_VideoInfo;



/**
 * Audio information type definition
 */
typedef struct STB_AudioInfo
{
	// Type of the curent audio coding. See STB_MEDIATYPE_xxx
	unsigned int			 mediaType;
	// Sample per second per channel.
	unsigned int       uiSamplesPerSec;   
	// Bits per audio sample (generally 16 bits).
	unsigned short     uiBitsPerSample;   
	// Audio Channels: 1 = mono, 2 = stereo, 3 and up are downmixed to stereo.
	unsigned short     uiChannels;        
	// Bit rate in bits per second (bps).
	unsigned int       uiBitrate;         
	// MPEG Layer.
	unsigned short     uiLayer;           
	// Maximum Bitrate of stream.
	unsigned int       uiMaxBitrate;      
}STB_AudioInfo;
   
/**
 * SPDif configuration flags 
 */
//SPdif off
#define STB_SPDIF_FLAG_OFF 		0x00000000 

//Analog output enabled, SPdif configured to 2-ch PCM mode
#define STB_SPDIF_FLAG_PCM 		0x00000001 

//Audio out configured to transmit compressed audio data through SPdif with disabled analog 
// audio channels (passthrough mode) if audio codec support this (e.i. AC3 audio),
//and works like STB_SPDIF_FLAG_PCM if codec not support this method (mpa, aac ...).
#define STB_SPDIF_FLAG_DATA		0x00000002 

typedef enum
{
  HDMIAudio_PCM   = 0,
  HDMIAudio_SPDIF = 1,
}STB_HDMIAudioType_e;
/**
 * Audio stereo output configuration
 */
typedef enum
{
  /**
   * Line out Stereo mode
   */
  StereoModeStereo  = 0,
  /**
   * Mixed mono in both channels
   */
  StereoModeMono    = 1,
  /**
   * Left channel in both output channels
   */
  StereoModeLeft    = 2,
  /**
   * Right channel in both output channels
   */
  StereoModeRight   = 3,
  /**
   * Lt/Rt mode (for Prologic)
   */
  StereoModeLtRt    = 4,
  StereoModeMAX = StereoModeLtRt+1
}STB_StereoMode_e;
typedef enum
{
  AudioModeRF       = 0,
  AudioModeLine     = 1,
  AudioModeCustom0  = 2,
  AudioModeCustom1  = 3,
}STB_AudioOperationalMode_e;
/**
 * CAS system parameters type definition
 */
typedef struct STB_CAS_s {
	/**
   * Company Name, ignore if NULL
	 */
	char*	companyName;
	/**
	 * CAS server address, ignore if NULL
	 */
	char*	serverAddr;
	/**
	 * CAS server port, ignore if 0
	 */
	unsigned int	serverPort;
	/**
	 * Operator ID, ignore if < 0
	 */
	int opID;
	/**
	 * Error Level, ingnore if -1
	 */
	int errorLevel;
} STB_CAS_t;
#define STB_CAS_TYPE_NONE			0
#define STB_CAS_TYPE_VERIMATRIX		1
#define STB_CAS_TYPE_SECUREMEDIA	2
#define STB_CAS_TYPE_ARES		    3
#define STB_CAS_TYPE_CUSTOM4        4
#define STB_CAS_TYPE_CUSTOM5        5
#define STB_CAS_TYPE_CUSTOM6        6
#define STB_CAS_TYPE_CUSTOM7        7
#define STB_CAS_TYPE_CUSTOM8        8
#define STB_CAS_TYPE_CUSTOM9        9
#define STB_CAS_TYPE_CUSTOM10       10
#define STB_CAS_TYPE_MAX            STB_CAS_TYPE_CUSTOM10
/* 
For STB_CAS_TYPE_CUSTOM_x player will try to find custom CAS library 
/home/default/libCasCustom_x.so, where _x from 4-10. 
 
For example 

STB_SetCASType(hPlayer,STB_CAS_TYPE_CUSTOM4) 
will search for /home/default/libCasCustom4.so 
 
See MAG-CAS-plugin.h for custom CAS interface description.
*/ 

typedef enum{
  STB_SCRAMBLING_TYPE_NONE=0,
  STB_SCRAMBLING_TYPE_CSA,
  /**
   * AES ECB encrypted 176 bytes right after TS packet header
   */
  STB_SCRAMBLING_TYPE_AES,
  /**
   * AES ECB encrypted 176 bytes at the end of TS packet
   */
  STB_SCRAMBLING_TYPE_AES_END,
  /**
   * AES CBC encrypted 176 bytes right after TS packet header
   */
  STB_SCRAMBLING_TYPE_AES_CBC,
} STBScramblingTypes_t;

/**
 * Disable automatic switching of video output framerate
 */
#define STB_AUTO_FRAMERATE_DISABLED 0
/**
 * Enabled switching to 24Hz modes of video output 
 * e.i. 720p24 and 1080p24 modes 
 */
#define STB_AUTO_FRAMERATE_24       1
/**
 * Enabled switching to 50Hz modes of video output
 * e.i. 720p50, 1080i50 and 1080p50 modes 
 */
#define STB_AUTO_FRAMERATE_50       2
/**
 * Enabled switching to 60Hz modes of video output
 * e.i. 720p60, 1080i60 and 1080p60 modes 
 */
#define STB_AUTO_FRAMERATE_60       4

/**
 * Specifies conversion mode that should be used to display 3D video in fullscreen mode.
 */ 
typedef enum{
  /**
   * Treat video as normal 2D video. Default mode. 
   * In case of top-bottom or side-by-side 3D video player displays both stereo views 
   * so TV can reproduce 3D video (with half resolution). 
   * If TV is 3D capable and video contains information about 3D then TV will be automatically 
   * switched to 3D mode. 
   */
  STB_3D_MODE_FULL=0,
  /**
   * Treat video as 3D video in top-bottom(over-under) format with half resolution of each stereo view.
   * In that mode player will stretch top half of the video into fullscreen according to specified aspect.
   */
  STB_3D_MODE_TOP_HALF,
  /**
   * Treat video as 3D video in top-bottom(over-under) format with full resolution of each stereo view.
   * In that mode player will stretch top half of the video into fullscreen according to specified aspect. 
   * The difference between STB_3D_MODE_TOP and STB_3D_MODE_TOP_HALF is that STB_SetAspect with other than auto mode 
   * gives different behaviour and in case of resulting video will be Full resolution HD. 
   */
  STB_3D_MODE_TOP,
  /**
   * Treat video as 3D video in side-by-side format with half resolution of each stereo view.
   * In that mode player will stretch left half of the video into fullscreen according to specified aspect.
   */
  STB_3D_MODE_LEFT_HALF,
  /**
   * Same as STB_3D_MODE_FULL but without automatic TV switch to 3D.
   */
  STB_3D_MODE_FULL_NO_AUTO_SWITCH,
}STB_3DtoFullscreenMode_e;

typedef enum{
  /**
   * exit StandBy mode
   */
  STB_STANDBY_OFF=0,
  /**
   * go to StandBy mode
   */
  STB_STANDBY_ON,
  /**
   * go to Deep StandBy(HibernateOnMemory) mode. If this mode is supported then
   * board will never return from this call.
   */
  STB_STANDBY_DEEP,
}STB_StandBy_Mode_e;
/**
 * Logging to syslog is disabled
 */
#define STB_LOG_LEVEL_QUIET   0
/**
 * Log errors e.i. CC errors
 */
#define STB_LOG_LEVEL_ERROR   1
/**
 * Log warnings
 */
#define STB_LOG_LEVEL_WARNING 2
/**
 * Log info messages e.i. End of stream
 */
#define STB_LOG_LEVEL_INFO    4
/**
 * Log debug messages.
 */
#define STB_LOG_LEVEL_DEBUG   8

#define STB_LOG_LEVEL_ALL     (STB_LOG_LEVEL_ERROR | STB_LOG_LEVEL_WARNING | STB_LOG_LEVEL_INFO | STB_LOG_LEVEL_DEBUG)

#define STB_DVB_MODULATION_AUTO   0
#define STB_DVB_MODULATION_16QAM  1
#define STB_DVB_MODULATION_32QAM  2
#define STB_DVB_MODULATION_64QAM  3
#define STB_DVB_MODULATION_128QAM 4
#define STB_DVB_MODULATION_256QAM 5


typedef enum 
{
  STB_OutputAR_4_3 = 0,
  STB_OutputAR_16_9 = 1,
  STB_OutputAR_LAST = 1,

  STB_OutputAR_UNKNOWN = 255,
}STB_OutputAspectRatio_e;

#define DVB_TYPE_C  1
#define DVB_TYPE_T  2
#define DVB_TYPE_T2 3

/// Return codes for STB routines.
#define STB_STATUS_OK             0x00000000 /* @demem Success */
#define STB_STATUS_ERROR          0x00000001 /* @demem Generic error */
#define STB_STATUS_UNSUPPORTED    0x00000002 /* @demem Unsupported */
#define STB_STATUS_BADARG         0x00000003 /* @demem Bad argument supplied to routine */
#define STB_STATUS_MEMORY         0x00000004 /* @demem Error allocating memory */
#define STB_STATUS_EXECFAILED     0x00000005 /* @demem Error during execution */
#define STB_STATUS_NOBUFAVAIL     0x00000006 /* @demem No more buffers available */
#define STB_STATUS_NOTFOUND       0x00000007 /* @demem Not found */
#define STB_STATUS_OPENERROR      0x00000008 /* @demem Unable to open or initialize */
#define STB_STATUS_READERROR      0x00000009 /* @demem Error reading */
#define STB_STATUS_WRITEERROR     0x0000000A /* @demem Error writing */
#define STB_STATUS_NOTOPEN        0x0000000B /* @demem Not in open state */
#define STB_STATUS_STREAMINGERROR 0x00000011 /* @demem Error between components */
#define STB_STATUS_EOS            0x00000012 /* @demem End of stream */
#define STB_STATUS_STOPPED        0x00000013 /* @demem Invalid in stopped state */
#define STB_STATUS_CONNECTERROR   0x00000014 /* @demem Error connecting components */
#define STB_STATUS_ALREADYOPEN    0x00000015 /* @demem Already opened */
#define STB_STATUS_BUSY           0x00000016 /* @demem Routine or component is busy */
#define STB_STATUS_BADMEDIATYPE   0x00000017 /* @demem Mediatype unsupportted */
#define STB_STATUS_WRONGSTATE     0x00000018 /* @demem Wrong state for action */
#define STB_STATUS_UNKNOWNFORMAT  0x00000019 /* @demem Unknown format */
#define STB_STATUS_TIMEOUT        0x0000001A /* @demem Operation timed out */
#define STB_STATUS_ABORTED        0x0000001B /* @demem Operation aborted */
#define STB_STATUS_BADHANDLE      0x0000001C /* @demem Bad handle supplied to routine */
#define STB_STATUS_BUFTOOSMALL    0x0000001D /* @demem Buffer supplied is too small to fit data */
#define STB_STATUS_BUFNEEDED      0x0000001E /* @demem Buffer must be supplied */
#define STB_STATUS_CONFIGERROR    0x0000001F /* @demem Error parsing configuration setting  */
#define STB_STATUS_SYNTAXERROR    0x00000020 /* @demem Error in command syntax */
#define STB_STATUS_COMPNOTFOUND   0x00000021 /* @demem Component not found */
#define STB_STATUS_UNKNOWNSOLUTION 0x00000022 /* @demem Unknown solution */
#define STB_STATUS_GRAPHEMPTY      0x00000023 /* @demem No components were created in graph. */
#define STB_STATUS_BADPIN          0x00000024 /* @demem Invalid PIN specified. */
#define STB_STATUS_UNKNOWNCOMMAND  0x00000025 /* @demem Command unknown */
#define STB_STATUS_UNKNOWNFUNCTION 0x00000026 /* @demem Function unknown */
#define STB_STATUS_UNKNOWNPARAM    0x00000027 /* @demem Parameter unknown */
#define STB_STATUS_UNSUPPORTEDFORMAT 0x00000028 /* @demem Format is unsupported */
#define STB_STATUS_TOOFULL        0x00000029 /* @demem Buffers are too full to process */
#define STB_STATUS_ALREADYSTARTED 0x0000002A /* @demem Already started */
#define STB_STATUS_MARKERERROR    0x0000002B /* @demem Error processing marker */
#define STB_STATUS_BADSTRTYPE     0x0000002C /* @demem String type not supported */
#define STB_STATUS_FATAL          0x0000002D /* @demem Fatal error */
#define STB_STATUS_IGNORED        0x0000002E /* @demem Action ignored */
#define STB_STATUS_NOINDEX        0x0000002F /* @demem No index was found */
#define STB_STATUS_BADINDEX       0x00000030 /* @demem Index is invalid */
#define STB_STATUS_CORRUPTEDSTREAM  0x00000031 /* @demem Clip has corrupted data */
#define STB_STATUS_FLUSHING       0x00000032 /* @demem Flush in process */
#define STB_STATUS_NOTCONNECTED   0x00000033 /* @demem Component is not connected */
#define STB_STATUS_SEEKERROR      0x00000034 /* @demem Error seeking */
#define STB_STATUS_INSTANDBY      0x00000080 /* @demem Error in StandBy mode */

#define STB_STATUS_HANDLE_INVALID	0x000000f0 /* @demem Bad handle */

#define STB_STATUS_UNSUPPORTEDSPEED 0x00000201 /* @demem Speed unsupported */
#define STB_STATUS_UNSUPPORTEDSEEK  0x00000202 /* @demem Seek unsupported */

#define STB_STATUS_DRMERROR       0x00001000 /* @demem DRM error */
#define STB_STATUS_DRMUNSUPPORTED 0x00001001 /* @demem DRM is unsupported */
#define STB_STATUS_DRMEXPIRED     0x00001002 /* @demem DRM reports expired */
#define STB_STATUS_DRMINITERROR   0x00001003 /* @demem DRM initialization error */
#define STB_STATUS_DRMNOAUTH      0x00001004 /* @demem DRM missing authentication */
#define STB_STATUS_DRMRENTAL      0x00001005 /* @demem DRM rental confirmation required */







//Media type definitions.
// MediaType is unspecified.
#define STB_MEDIATYPE_NONE     0x00000000 
// MPEG video.
#define STB_MEDIATYPE_MPV      0x00000001 
// MPEG-2 video.
#define STB_MEDIATYPE_MPV2     0x00000002 
// MPEG video in MPEG-1 PES stream.
#define STB_MEDIATYPE_MPV_PES1 0x00008003 
// MPEG video in MPEG-2 PES stream.
#define STB_MEDIATYPE_MPV_PES2 0x00008004 
// MPEG-4 video.
#define STB_MEDIATYPE_MPV4     0x00000005 
// Microsoft MPEG-4 video.
#define STB_MEDIATYPE_MPV4_MS  0x00000006 
// MPEG audio (layer unknown).
#define STB_MEDIATYPE_MPA      0x00000010 
// MPEG audio layer 1.
#define STB_MEDIATYPE_MPA1     0x00000011 
// MPEG audio layer 2.
#define STB_MEDIATYPE_MPA2     0x00000012 
// MPEG audio layer 3.
#define STB_MEDIATYPE_MPA3     0x00000013 
// MPEG audio in MPEG-1 PES stream.
#define STB_MEDIATYPE_MPA_PES1 0x00000014 
// MPEG audio in MPEG-2 PES stream.
#define STB_MEDIATYPE_MPA_PES2 0x00000015 
// Windows Media Video.
#define STB_MEDIATYPE_WMV      0x00000040 
// Windows Media Video V7.
#define STB_MEDIATYPE_WMV7     0x00000041 
// Windows Media Video V8.
#define STB_MEDIATYPE_WMV8     0x00000042 
// Windows Media Video V9.
#define STB_MEDIATYPE_WMV9     0x00000043 
// Windows Media Video V9 Advanced Profile.
#define STB_MEDIATYPE_WMV9AP   0x00000044 
// Windows Media Audio.
#define STB_MEDIATYPE_WMA      0x00000100 
// Windows Media Audio (Pro).
#define STB_MEDIATYPE_WMAPRO   0x00000101 
// Dolby AC-3 Audio.
#define STB_MEDIATYPE_AC3      0x00000200 
// AC3 in MPEG-2 PES stream.
#define STB_MEDIATYPE_AC3_PES2 0x00000201 
// AC3 in ATSC stream.
#define STB_MEDIATYPE_AC3_ATSC 0x00000202 
// PCM audio.
#define STB_MEDIATYPE_PCM      0x00000400 
// AAC audio.
#define STB_MEDIATYPE_AAC      0x00000401 
// OGG audio.
#define STB_MEDIATYPE_OGG      0x00000402 
// DTS audio.
#define STB_MEDIATYPE_DTS      0x00000403 
// DivX.
#define STB_MEDIATYPE_DIVX     0x00100000 
#define STB_MEDIATYPE_DIVX30   (STB_MEDIATYPE_DIVX|300)
#define STB_MEDIATYPE_DIVX40   (STB_MEDIATYPE_DIVX|400)
#define STB_MEDIATYPE_DIVX41   (STB_MEDIATYPE_DIVX|410)
#define STB_MEDIATYPE_DIVX50   (STB_MEDIATYPE_DIVX|500)
// XVID 
#define STB_MEDIATYPE_XVID     0x00200000 
// Undefined 
#define STB_MEDIATYPE_UNDEFINED 0x80000000 

typedef enum
{
	TtxChEnglish = 0x00,
	TtxChGerman  = 0x01,
	TtxChSwedishFinnishHungarian = 0x02,
	TtxChItalian = 0x03,
	TtxChFrench = 0x04,
	TtxChPortugueseSpanish = 0x05,
	TtxChCzechSlovak  = 0x06,
	TtxChPolish = 0x08,
	TtxChGerman1  = 0x09,
	TtxChSwedishFinnishHungarian1 = 0x0a,
	TtxChItalian1 = 0x0b,
	TtxChFrench1 = 0x0c,
	TtxChCzechSlovak1  = 0x0e,
	TtxChEnglish1 = 0x10,
	TtxChGerman2  = 0x11,
	TtxChSwedishFinnishHungarian2 = 0x12,
	TtxChItalian2 = 0x13,
	TtxChFrench2 = 0x14,
	TtxChPortugueseSpanish1 = 0x15,
	TtxChTurkish = 0x16,
	TtxChSerbianCroatianSlovenian = 0x1d,
	TtxChRumanian = 0x1f,
	TtxChSerbianCroatian = 0x20,
	TtxChGerman3 = 0x21,
	TtxChEstonian = 0x22,
	TtxChLettishLithuanian = 0x23,
	TtxChRussianBulgarian = 0x24,
	TtxChUkrainian = 0x25,
	TtxChCzechSlovak2 = 0x26,
	TtxChTurkish1 = 0x36,
	TtxChGreek = 0x37,
	TtxChEnglishArabic = 0x80,
	TtxChFrenchArabic = 0x84,
	TtxChArabic = 0x87,
	TtxChHebrewArabic = 0x95,
	TtxChArabic1 = 0x97
} STB_TtxSubCharset_e;

typedef enum
{
      TtxCmd_0 = 0
    , TtxCmd_1 = 1
    , TtxCmd_2 = 2
    , TtxCmd_3 = 3
    , TtxCmd_4 = 4
    , TtxCmd_5 = 5
    , TtxCmd_6 = 6
    , TtxCmd_7 = 7
    , TtxCmd_8 = 8
    , TtxCmd_9 = 9
    , TtxCmdNextPage = 10
    , TtxCmdPrevPage = 11
    , TtxCmdNextSubpage = 12
    , TtxCmdPrevSubpage = 13
    , TtxCmdRed = 14
    , TtxCmdYellow = 15
    , TtxCmdBlue = 16
    , TtxCmdGreen = 17
} STB_TtxCommand;

typedef struct STB_PlayerStat
{
    unsigned int m_decodingErrors;
    unsigned int m_rtpErrors;
    unsigned int m_continuityErrors;
} STB_PlayerStat;

typedef enum
{
      SURFACE_TYPE_GRAPHIC = 0
    , SURFACE_TYPE_VIDEO_1
    , SURFACE_TYPE_VIDEO_2
    , SURFACE_TYPE_MAX_VALUE = SURFACE_TYPE_VIDEO_2
} STB_SurfaceType;

typedef struct STB_Surfaces
{
    unsigned int m_count;
    STB_SurfaceType m_surfaces[SURFACE_TYPE_MAX_VALUE + 1];
} STB_Surfaces;

typedef int (*STB_DVB_SESSION_CALLBACK) (int sessionId);

typedef struct STB_DvbChannelInfo
{
    int frequency;
    int inputIndex;
    int modulation;
    int symbolRate;
    int bandwidth;
    const char *id;
    int type;
    int scrambled;
    const char *name;
    const char *provider;
    int isRadio;
    int channelNumber;
} STB_DvbChannelInfo;

typedef int (*STB_DVB_CHANNEL_FILTER) (const void *context, const STB_DvbChannelInfo *channel);

typedef enum PowerWakeUpSource_e
{
    PowerWakeUp_Unknown = 0,
    PowerWakeUp_IR,
    PowerWakeUp_HotPlugHDMI,
    PowerWakeUp_CEC,
    PowerWakeUp_WakeOnLAN,
    PowerWakeUp_Button,
    PowerWakeUp_Soft,
    PowerWakeUp_Max
}PowerWakeUpSource_e;

typedef enum StandbyMode_e
{
  /**
   * CPU is working as expected power mode 
   */
  StandbyMode_Active = 0,
  /**
   * CPU is on, other periferial can be disabled
   */
  StandbyMode_S1 = 1,
  /**
   * CPU is off, preriferial is off, ethernet is on(for WoL)
   */
  StandbyMode_S2 = 2,
  /**
   * CPU is off, preriferial is off
   */
  StandbyMode_S3 = 3,
  StandbyMode_Max
}StandbyMode_e;

#if defined(__cplusplus)
}
#endif

#endif //_STBTYPES_H_

