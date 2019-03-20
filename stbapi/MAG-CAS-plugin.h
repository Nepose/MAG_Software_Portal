#ifndef _MAG_CAS_PLUGIN_H_
#define _MAG_CAS_PLUGIN_H_

#if defined(__cplusplus)
extern "C"
{
#endif

/**
 * Scrambling types for CAS_Flags_PMT_ECM mode
 */
typedef enum CAS_ScramblingTypes_s{
  CAS_SCRAMBLING_TYPE_NONE=0,
  /**
   * CSA encrypted TS packet
   */
  CAS_SCRAMBLING_TYPE_CSA,
  /**
   * AES ECB encrypted 176 bytes right after TS packet header
   */
  CAS_SCRAMBLING_TYPE_AES,
  /**
   * AES ECB encrypted 176 bytes at the end of TS packet
   */
  CAS_SCRAMBLING_TYPE_AES_END,
  /**
   * AES CBC encrypted 176 bytes right after TS packet header
   */
  CAS_SCRAMBLING_TYPE_AES_CBC,
} CAS_ScramblingTypes_e;

typedef unsigned char byte;

typedef enum CAS_Flags_s{
  /**
   * Do not send whole stream to CAS, just call PMT and ECM callbacks
   */
  CAS_Flags_PMT_ECM=0,
  /**
   * Send whole stream to CAS for decryption. PMT is not encrypted.
   */
  CAS_Flags_DecodeAll=1,
  /**
   * Send whole stream to CAS for decryption. PMT is encrypted.
   */
  CAS_Flags_DecodeAll_PMT=2,
} CAS_Flags_e;

typedef enum ECM_Format_s
{
  /**
   * OnEcm function will be called with a pointer to ECM section data
   */
  ECM_FORMAT_SECTION=0,
  /**
   * OnEcm function will be called with a pointer to full TS packet, that contains ECM
   */
  ECM_FORMAT_TS,
}ECM_Format_e;

/* something you implement CAD -- CA daemon */
typedef struct STB_MAG_Cad_s{
  int (*SetScramblingType) (CAS_ScramblingTypes_e algoType);
  /**
   * odd_even 0 - even key
   *          1 - odd key
   */
  int (*SetScramblingKey) (const char* key, int odd_even);
}STB_MAG_Cad_t;


/* 
 Custom CAS plugin interface 
 If function pointer is NULL -- do not call...  
 not implemented functions must be set to NULL 
*/
typedef struct STB_MAG_Cas_s{
  /**
   * Callback to be called by Player on PMT change
   */
  void (*OnPmtChange)(byte* buffer, int length); 
  /**
   * Callback to be called by Player on every ECM
   */
  void (*OnEcm)(byte* ecm, int length); 
  /**
   * Callback to be called by Player to decrypt transport stream 
   * by CAS module. 
   * in_buffer - pointer to encrypted data. 
   * Input data are always aligned on TS packet boundary. 
   * decrypted data will be put to the in_buffer length - size of 
   * input data 
   *  
   * CAS plugin MUST clear Transport Scrambling Control bits after 
   * decryption. 
   *  
   * Returns size of decrypted data
   */
  int (*Decrypt)(byte* in_buffer, int length); 
  /**
   * Free up CAS module
   */
  void (*Deinit)(void); 
  /**
   * Reset CAS context. Usually called to indicate that user has 
   * switched to another stream
   */
  void (*ResetStream)(void);
  /**
   * Get CAS vendor SysID as defined in DVB. Useful only in 
   * CAS_Flags_PMT_ECM mode 
   */
  int (*GetSysID)(void);
  /**
   * Get CAS vendor SoID as defined in DVB. Useful only in 
   * CAS_Flags_PMT_ECM mode 
   */
  int (*GetSoID)(void);
  /**
   * Get CAS vendor specific flags
   * 
   * @see CAS_Flags_e
   */
  CAS_Flags_e (*GetCasFlags)(void);
  /**
   * Get the format of ECM data expected by the plugin in 
   * CAS_OnEcm 
   */
  ECM_Format_e (*GetEcmFormat)(void);
  /**
   * Set some custom param to CAS plugin.
   * 
   * name - param name always converted to upper case 
   * value - param value
   */
  void (*SetAdditionalParam)(const char* name, const char* value);
}STB_MAG_Cas_t;

/**
 * Create CAS plugin.
 * dynamic library will implement this
 * 
 * @param mag_interface
 *               Contains callback functions to set scrambling key and algorithm
 * @param ini_filename
 *               Optional INI filename
 * 
 * @return Pointer to filled STB_MAG_Cas_t struct.
 */
STB_MAG_Cas_t* CreateCasPlugin(STB_MAG_Cad_t* mag_interface, const char* ini_filename);

/**
 * CAS API implementation version of the CAS vendor library
 * dynamic library will implement this 
 * 
 * @see CAS_API_VERSION
 */
int GetCasApiVersion(void);
/** 
 * Get description of CAS plugin (e.i. Vendor, ...) 
 * dynamic library will implement this  
 */
const char* GetCasPluginDescription(void);

/**
 * MAG STB CAS library interface version
 */
#define CAS_API_VERSION  103

#if defined(__cplusplus)
}
#endif

#endif //_MAG_CAS_PLUGIN_H_
