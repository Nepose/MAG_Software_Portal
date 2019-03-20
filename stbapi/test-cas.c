#include "MAG-CAS-plugin.h"
#include "stdio.h"
#define DEBUG(x...) {}//printf(x)
#define DEBUG_CALL() DEBUG("Called function %s\n",__FUNCTION__)

STB_MAG_Cas_t PluginInterface;
STB_MAG_Cad_t DescramblerInterface = {NULL,NULL};

/**
 * Callback to be called by Player on PMT change
 */
void CAS_OnPmtChange(byte* buffer, int length)
{
  DEBUG_CALL();
  //extract some necessary information for decryption if needed
  //this function is used in CAS_Flags_PMT_ECM mode only 
  return;
}; 
/**
 * Callback to be called by Player on every ECM
 */
void CAS_OnEcm(byte* ecm, int length)
{
  DEBUG_CALL();
  //extract some necessary information for decryption if needed
  //this function is used in CAS_Flags_PMT_ECM mode only 

  //for example set keys and algorithm
  if(DescramblerInterface.SetScramblingKey && DescramblerInterface.SetScramblingType)
  {
    DescramblerInterface.SetScramblingType(CAS_SCRAMBLING_TYPE_AES);
    char evenKey[16]={0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15};
    char oddKey[16]={0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15};
    DescramblerInterface.SetScramblingKey(evenKey,0);
    DescramblerInterface.SetScramblingKey(oddKey,1);
  }
  return;
}; 
/**
 * Callback to be called by Player to decrypt transport stream 
 * by CAS module. 
 * in_buffer - pointer to encrypted data. 
 * decrypted data will be put to the in_buffer
 * length - size of input data 
 *  
 * CAS plugin MUST clear Transport Scrambling Control bits after 
 * decryption. 
 *  
 * Returns size of decrypted data
 */
int CAS_Decrypt(byte* in_buffer, int length)
{
  DEBUG_CALL();
  //this function is used in CAS_Flags_DecodeAll or CAS_Flags_DecodeAll_PMT mode
  //decrypt stream

  //For CAS_Flags_DecodeAll_PMT mode probably there should be pre-decryption of whole stream


  int offs = 0;
  for(offs = 0; offs < length; offs += 188)
  {//process single TS Packet
    //check scrambling control bits
    int sc = (in_buffer[offs+3]>>6)&0x3;
    if(sc == 0 || sc == 1)
    {//not encrypted
      continue;
    }
    if(sc == 2)
    {
      //decrypt packet using even key
    }else
    {
      //decrypt packet using odd key
    }
    //!!!!!!!!!DO NOT FORGET to clear scrambling control bits
    in_buffer[offs+3] = in_buffer[offs+3]&0x3f;
  }
  return length;
}; 
/**
 * Free up CA module
 */
void CAS_Deinit(void)
{
  DEBUG_CALL();
  //release all resources allocated by CreateCas
  return;
}; 
/**
 * Reset CAS context. Usually called to indicate that user has 
 * switched to another stream
 */
void CAS_ResetStream(void)
{
  DEBUG_CALL();
  //decryption context has changed
  return;
};
/**
 * Get CAS vendor SysID as defined in DVB. Useful only in 
 * CAS_Flags_PMT_ECM mode 
 */
int CAS_GetSysID(void)
{
  DEBUG_CALL();
  return 0;
};
/**
 * Get CAS vendor SoID as defined in DVB. Useful only in 
 * CAS_Flags_PMT_ECM mode 
 */
int CAS_GetSoID(void)
{
  DEBUG_CALL();
  return 0;
};
/**
 * Get CAS vendor specific flags
 * 
 * @see CAS_Flags_e
 */
CAS_Flags_e CAS_GetCasFlags(void)
{
  DEBUG_CALL();
  return CAS_Flags_DecodeAll;
};
/**
 * Get the format of ECM data expected by the plugin in 
 * CAS_OnEcm 
 */
ECM_Format_e CAS_GetEcmFormat(void)
{
  DEBUG_CALL();
  return ECM_FORMAT_SECTION;
};
/**
 * Set some custom param to CAS plugin.
 * 
 * name - param name always converted to upper case 
 * value - param value
 */
void CAS_SetAdditionalParam(const char* name, const char* value)
{
  DEBUG_CALL();
  DEBUG("CAS Plugin param: name '%s' value '%s'\n",name,value);
};


/* dynamic library will implement this */
STB_MAG_Cas_t* CreateCasPlugin(STB_MAG_Cad_t* mag_interface, const char* ini_filename)
{
  if(mag_interface)
  {
    DescramblerInterface.SetScramblingKey = mag_interface->SetScramblingKey;
    DescramblerInterface.SetScramblingType = mag_interface->SetScramblingType;
  }
  PluginInterface.Decrypt = CAS_Decrypt;
  PluginInterface.Deinit = CAS_Deinit;
  PluginInterface.GetCasFlags = CAS_GetCasFlags;
  PluginInterface.GetEcmFormat = NULL;
  PluginInterface.GetSoID = NULL;
  PluginInterface.GetSysID = NULL;
  PluginInterface.OnEcm = NULL;
  PluginInterface.OnPmtChange = NULL;
  PluginInterface.ResetStream = CAS_ResetStream;
  PluginInterface.SetAdditionalParam = CAS_SetAdditionalParam;
  return &PluginInterface;
};

/**
 * CAS API implementation version of the CAS vendor library
 * dynamic library will implement this 
 * 
 * @see CAS_API_VERSION
 */
int GetCasApiVersion(void)
{
  return CAS_API_VERSION;
};
/** 
 * Get description of CAS plugin (e.i. Vendor, ...) 
 */
const char* GetCasPluginDescription(void)
{
  return "simple CAS plugin example in CAS_Flags_DecodeAll mode";
};

