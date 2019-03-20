#ifndef _EXT_PROTOCOL_H_
#define _EXT_PROTOCOL_H_

#if defined(__cplusplus)
extern "C" {
#endif

#define PROTOCOL_API_VERSION  1

typedef enum
{
  extStreamTypeMpegTS = 0,
  extStreamTypeMpegPS = 1,
}extStreamType_e;

#define EXT_STATUS_OK           0
/**
 * Error opening media
 */
#define EXT_STATUS_OPEN_ERROR   -1
/**
 * Read error
 */
#define EXT_STATUS_READ_ERROR   -2
/**
 * End of stream while reading
 */
#define EXT_STATUS_EOS          -3
/**
 * Bad argument
 */
#define EXT_STATUS_BAD_ARGUMENT -4


typedef struct ext_protocol ext_protocol_t;
/**
 * Handle to the opened instance of the protocol.
 */
typedef void* ProtocolHandle;

struct ext_protocol {
    /**
     * null-terminated string with protocol name(identifier).
     */
    char        ident[64];
    /**
     * Some private data to be filled and used by the protocol.
     */
    void *      private_data;
    /**
     * Implementation version.
     */
    int         version;
    /**
     * Open stream via protocol.
     *
     * @param e - pointer to protocol
     * @param pHandle - handler to opened instatnce of protocol.
     *        Will be used with all operations applied to opened instance.
     *        In case of error *pHandle should be filled with NULL.
     *        otherwise - with opened handle.
     * @param url - content URL to be played
     * @param extra_data - some extra_data
     *
     * @return 0 if success
     *         error code otherwise.
     */
    int         (*open)         (ext_protocol_t *e, ProtocolHandle* pHandle, const char *url);
    /**
     * Read data from stream.
     * @param   handle - protocol instance handle
     *
     * @return  number of bytes read:
     *          0 - no data received try again
     *          <0 - error code. @See EXT_STATUS_XXX
     */
    int         (*read)         (ProtocolHandle handle, char *buf, int buflen);
    /**
     * Close stream.
     * @param   handle - protocol instance handle
     */
    void        (*close)        (ProtocolHandle handle);
    /**
     * Send command to ext. protocol
     * This function is always called from other thread relative to calls of open,read,setPosTime,...
     * @param   e - pointer to protocol
     * @param   cmd - command to be executed.
     * @param   params - command params.
     *
     * @return  result of command execution allocated by malloc.
     *          free() it after use.
     */
    char *      (*command)      (ext_protocol_t *e, const char *cmd, const char *params);
    /**
     * Send event to protocol
     * @param   e - pointer to protocol
     * @param   event_id - event code.
     */
    void        (*event)        (ext_protocol_t *e, unsigned long event_id);
    /**
     * Seek to specified time (in ms) in stream.
     * @param   handle - protocol instance handle
     * @param   posInMs - position in media in ms since start of media
     *          always from 0 to duration (posInMs is not related to startTime)
     *
     * @return  if success  - >= 0 - success, returns stream position in ms
     *          otherwise   - < 0  - error
     */
    int         (*setPosTime)   (ProtocolHandle handle, unsigned int posInMs);
    /**
     * Get timestamp of media content start point in ms.
     *
     * @param   handle - protocol instance handle
     *
     * @return  start time of the stream in ms if known
     *          otherwise - 0.
     */
    unsigned int(*getStartTime)	(ProtocolHandle handle);
    /**
     * Get the duration of whole media in ms.
     *
     * @param   handle - protocol instance handle
     *
     * @return  duration of the stream in ms if known
     *          otherwise - 0.
     */
    unsigned int(*getDuration)	(ProtocolHandle handle);
    /**
     * Get the stream type of the data that is being read from this protocol.
     *
     * @param   handle - protocol instance handle
     *
     * @return  type of the stream container provided by this protocol.
     */
    extStreamType_e (*getStreamType)(ProtocolHandle handle);
    /**
     * Get video frame rate if available.
     * @param   handle - protocol instance handle
     *
     * @return frame_rate*1000, e.i. 24000, 25000, ... ,
     *         0 if not available
     */
    int         (*getVideoFPS)  (ProtocolHandle handle);
    /**
     * Get content specific meta data information
     * It can be list of chapters etc. It should be JSON string
     * It should contain field "infoType" with string value which explicitly specifies
     * format of returned metadata information.
     */
    const char* (*getMetadataInfo)  (ProtocolHandle handle);
    /**
     * Return whether protocol is realtime or not.
     * @param   e - pointer to protocol
     *
     * Return: non zero - if it is realtime protocol (default)
     *         zero     - otherwise
     */
    int (*isRealTimeProtocol)  (ext_protocol_t *e);
    /**
     * Leave space for future extensions. It must be filled by NULLs.
     */
    void *      padding[8];
};

typedef void             (*ext_event_fn_t)         (ext_protocol_t *e, unsigned long event_id, const char* event_data);
typedef int              (*ext_abort_fn_t)         (ext_protocol_t *e);
typedef ext_protocol_t * (*ext_protocol_init_t)    (ext_event_fn_t ext_event_fn);
typedef void             (*ext_protocol_register_abort_fn_t)(ext_protocol_t *e, ext_abort_fn_t ext_abort_fn);
typedef void             (*ext_protocol_free_t)    (ext_protocol_t **pe);

/* The dynamic library will implement these */

/**
 * Allocate and return ext_protocol_t
 *
 * @param ext_event_fn Event function that will be called from inside ext_protocol
 *
 * @return pointer to protocol instance.
 */
ext_protocol_t *    ext_protocol_init    (ext_event_fn_t ext_event_fn);


/**
 * Register abort function that should be called from inside ext_protocol
 * During long-duration operations such as read, open and setPosTime ext_protocol should periodically
 * call this function to check whether protocol should return from long-duration call with error.
 * ext_abort_fn return 0 if protocol can continue operation, otherwise - abort operation. 
 *  
 * ONLY for ext-protocol V1. 
 * For V2 use per playback abort. 
 *
 * @param   e - pointer to protocol
 * @param   ext_abort_fn abort function.
 *          can be NULL if abort function should not be called.
 */
void                ext_protocol_register_abort_fn(ext_protocol_t *e, ext_abort_fn_t ext_abort_fn);


/**
 * Free ext_protocol_t
 *
 * @param   *e - pointer to protocol
 */
void                ext_protocol_free    (ext_protocol_t **pe);
//==============V2 extension =====================
typedef struct ext_protocol_v2 ext_protocol_v2_t;

typedef void              (*ext_protocol_playback_event_fn_v2_t)(ext_protocol_v2_t *e
                                                                 ,void * context
                                                                 ,unsigned long event_id
                                                                 ,const char* event_data);

typedef int               (*ext_playback_abort_fn_v2_t)        (ext_protocol_v2_t *e
                                                                ,void * context);

struct ext_protocol_v2 {
    /**
     * null-terminated string with protocol name(identifier).
     */
    char        ident[64];
    /**
     * Some private data to be filled and used by the protocol.
     */
    void *      private_data;
    /**
     * Implementation version.
     */
    int         version;
    /**
     * Open stream via protocol.
     *
     * @param e - pointer to protocol
     * @param pHandle - handler to opened instatnce of protocol.
     *        Will be used with all operations applied to opened instance.
     *        In case of error *pHandle should be filled with NULL.
     *        otherwise - with opened handle.
     * @param evt_fn callback to pass events for the corresponding playback
     * @param abort_fn callback to check if stop is required, it's return value:
     *          1 - stop is required;
     *          0 - continue;
     * @param context - passed to evt_fn and abort_fn
     * @param url - content URL to be played
     *
     * @return 0 if success
     *         error code otherwise.
     */
    int         (*open)         (ext_protocol_v2_t *e
                                 ,ProtocolHandle * pHandle
                                 ,ext_protocol_playback_event_fn_v2_t evt_fn
                                 ,ext_playback_abort_fn_v2_t abort_fn
                                 ,void * context
                                 ,const char *url);
    /**
     * Read data from stream.
     * @param   handle - protocol instance handle
     *
     * @return  number of bytes read:
     *          0 - no data received try again
     *          <0 - error code. @See EXT_STATUS_XXX
     */
    int         (*read)         (ProtocolHandle handle, char *buf, int buflen);
    /**
     * Close stream.
     * @param   handle - protocol instance handle
     */
    void        (*close)        (ProtocolHandle handle);
    /**
     * Send command to ext. protocol
     * This function is always called from other thread relative to calls of open,read,setPosTime,...
     * @param   e - pointer to protocol
     * @param   handle the command pertains to, if NULL, command applies to the entire protocol
     * @param   cmd - command to be executed.
     * @param   params - command params.
     *
     * @return  result of command execution allocated by malloc.
     *          free() it after use.
     */
    char *      (*command)      (ext_protocol_v2_t *e, ProtocolHandle handle, const char *cmd, const char *params);
    /**
     * Send event to protocol
     * @param   e - pointer to protocol
     * @param   handle the command pertains to, if NULL, command applies to the entire protocol
     * @param   event_id - event code.
     */
    void        (*event)        (ext_protocol_v2_t *e, ProtocolHandle handle, unsigned long event_id);
    /**
     * Seek to specified time (in ms) in stream.
     * @param   handle - protocol instance handle
     * @param   posInMs - position in media in ms since start of media
     *          always from 0 to duration (posInMs is not related to startTime)
     *
     * @return  if success  - >= 0 - success, returns stream position in ms
     *          otherwise   - < 0  - error
     */
    int         (*setPosTime)   (ProtocolHandle handle, unsigned int posInMs);
    /**
     * Get timestamp of media content start point in ms.
     *
     * @param   handle - protocol instance handle
     *
     * @return  start time of the stream in ms if known
     *          otherwise - 0.
     */
    unsigned int(*getStartTime)	(ProtocolHandle handle);
    /**
     * Get the duration of whole media in ms.
     *
     * @param   handle - protocol instance handle
     *
     * @return  duration of the stream in ms if known
     *          otherwise - 0.
     */
    unsigned int(*getDuration)	(ProtocolHandle handle);
    /**
     * Get the stream type of the data that is being read from this protocol.
     *
     * @param   handle - protocol instance handle
     *
     * @return  type of the stream container provided by this protocol.
     */
    extStreamType_e (*getStreamType)(ProtocolHandle handle);
    /**
     * Get video frame rate if available.
     * @param   handle - protocol instance handle
     *
     * @return frame_rate*1000, e.i. 24000, 25000, ... ,
     *         0 if not available
     */
    int         (*getVideoFPS)  (ProtocolHandle handle);
    /**
     * Get content specific meta data information
     * It can be list of chapters etc. It should be JSON string
     * It should contain field "infoType" with string value which explicitly specifies
     * format of returned metadata information.
     */
    const char* (*getMetadataInfo)  (ProtocolHandle handle);
    /**
     * Return whether protocol is realtime or not.
     * @param   e - pointer to protocol
     *
     * Return: non zero - if it is realtime protocol (default)
     *         zero     - otherwise
     */
    int (*isRealTimeProtocol)  (ext_protocol_v2_t *e);
    /**
     * Leave space for future extensions. It must be filled by NULLs.
     */
    void *      padding[8];
};

typedef void              (*ext_protocol_global_event_fn_v2_t)(ext_protocol_v2_t *e
                                                               ,unsigned long event_id
                                                               ,const char* event_data);


/**
 * Allocate and return ext_protocol_v2
 *
 * @param ext_event_fn Event function that will be called from inside ext_protocol
 *
 * @return pointer to protocol instance.
 */
typedef ext_protocol_v2_t * (*ext_protocol_init_v2_t)    (ext_protocol_global_event_fn_v2_t ext_glob_event_fn);

typedef void              (*ext_protocol_free_v2_t)    (ext_protocol_v2_t **p);

/* The dynamic library will implement these */

ext_protocol_v2_t *    ext_protocol_init_v2    (ext_protocol_global_event_fn_v2_t ext_event_fn);

/**
 * Free ext_protocol_v2
 *
 * @param   *e - pointer to protocol
 */
void                ext_protocol_free_v2    (ext_protocol_v2_t **pe);

#if defined(__cplusplus)
}
#endif

#endif //_EXT_PROTOCOL_H_
