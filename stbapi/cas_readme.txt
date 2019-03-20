1. File list:
MAG-CAS-plugin.h - CAS plugin API header file.
test-cas.c - example of simple custom CAS plugin implementation.
mk.sh - example building script.

2. How to use.

Build CAS plugin and put it into /home/default folder of MAG rootfs.
Simultaneously player can use up to 7 custom CAS plugins, with CAS types from 4 to 10.
If user set one of this types, player will search a library with the name
/home/default/libCasCustom_x.so, where _x corresponds to given CAS type.

For example:

STB_SetCASType(hPlayer,STB_CAS_TYPE_CUSTOM4)
or from JavaScript
stb.SetCASType(4);

forces player to search /home/default/libCasCustom4.so library.

3. CAS plugin API.

CAS plugin must implement functions CreateCasPlugin, GetCasApiVersion, GetCasPluginDescription 
and STB_MAG_Cas_t members:


STB_MAG_Cas_t* CreateCasPlugin(STB_MAG_Cad_t* mag_interface, const char* ini_filename); 
	CAS plugin initialization.

int GetCasApiVersion(void);
	CAS API implementation version of the CAS vendor library.

const char* GetCasPluginDescription(void);
	Get description of CAS plugin (e.i. Vendor, ...)

void (*OnPmtChange)(byte* buffer, int length); 
	Callback to be called by Player on PMT change. Optional.

void (*OnEcm)(byte* ecm, int length); 
	Callback to be called by Player on every ECM.
	Necessary only in CAS_Flags_PMT_ECM mode.
	
int (*Decrypt)(byte* in_buffer, int length); 
    Callback to be called by Player to decrypt transport stream 
    by CAS module. 
    Input data are always aligned on TS packet boundary. 
    Decrypted data will be put to the in_buffer 
     
    CAS plugin MUST clear Transport Scrambling Control bits after 
    decryption. 
     
	Returns size of decrypted data 
	
void (*Deinit)(void); 
	Free all CAS resources.

void (*ResetStream)(void);
	Reset CAS context. Usually called to indicate that user has switched to another stream 
	
int (*GetSysID)(void);
	Get CAS vendor SysID as defined in DVB. Useful only in CAS_Flags_PMT_ECM mode.
	
int (*GetSoID)(void);
	Get CAS vendor SoID as defined in DVB. Useful only in CAS_Flags_PMT_ECM mode.

CAS_Flags_e (*GetCasFlags)(void);
	Get CAS vendor specific flags (see. CAS_Flags_e description).

ECM_Format_e (*GetEcmFormat)(void);
	Get the format of ECM data expected by the plugin in CAS_OnEcm.
	ECM_FORMAT_SECTION - ECM section only.
	ECM_FORMAT_TS - full transport packet with ECM data.
	
void (*SetAdditionalParam)(const char* name, const char* value); 
	Set some custom param to CAS plugin.
	
CAS_Flags_e - defines CAS plaugin operating modes:

	CAS_Flags_PMT_ECM
	Do not send whole stream to CAS, just call PMT and ECM callbacks. As a result plugin should set decryption keys and algorithm 
	via SetScramblingType and SetScramblingKey members of STB_MAG_Cad_t.

	CAS_Flags_DecodeAll
	Send whole stream to CAS for decryption. PMT is not encrypted. 

	CAS_Flags_DecodeAll_PMT
	Send whole stream to CAS for decryption. PMT is encrypted. 
		
Any member of STB_MAG_Cas_t that is not implemented MUST be NULL.

STB_MAG_Cad_t struct defines function needed to set  decryption keys and algorithm.


