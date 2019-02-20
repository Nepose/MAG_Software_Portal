#!/bin/bash
# Parameters:
# 	$1 - name file of results
# 	$2 - name file of kernel
# 	$3 - name file of root file system signed by operator's key
# 	$4 - Image Version (digit)
# 	$5 - Image Description (Text. Bootloader show first 23 characters from this string)
# 	$6 - STB model
#	$7 - Update API Version
#	$8 - SHA256 if required

. ../includes/initialize.sh

gpg_option=""
if [ "$8" == "SHA256" ]; then
    gpg_option="--digest-algo=sha256"
fi
calc_glsign=./global_sig

append_section_with_dsa () {
    if [ -f $2 ]; then
        echo "[ ${OutputBlue}TRY${OutputWhite} ] Create section \"$1\" and append file $2."
	f=`du -b $2`
	size=${f%%	$2} 
	f=`du -b $3.tmp`
	pos=${f%%	$3.tmp} 
        echo "$1"$size" "$pos >> $3
	
	rm -f $2.sig
	gpg --force-v3-sigs -u $MAG200_OP_KEY ${gpg_option} --detach-sign $2
	if [ "$?" -ne "0" ]; then
	 echo "[ ${OutputRed}ERR${OutputWhite} ] Error make digital signature for section $1 and file $2"
	 return 1
	fi
	if [ -f $3.tmp ]; then
	    cat $2 >> $3.tmp
	else
	    cat $2 > $3.tmp
	fi
	./dsign -a -i $2.sig $3.tmp
	if [ "$?" -ne "0" ]; then
	  echo "[ ${OutputRed}ERR${OutputWhite} ] Error append digital signature for section $1 and file $2."
	  rm -f $2.sig    
	  return 1
	fi
	./dsign -a -i $2.sig $3.glsign
	rm -f $2.sig
    else
      echo "[ ${OutputRed}ERR${OutputWhite} ] Section \"$1\" not present. File $2 doesn't exist or not a regular file."	
      return 1
    fi
}



append_section () {
    if [ -f $2 ]; then
        echo "[ ${OutputBlue}TRY${OutputWhite} ] Create section \"$1\" and append file $2."
	f=`du -b $2`
	size=${f%%	$2} 
        echo "$1"$size >> $3

	if [ -f $3.tmp ]; then
	    cat $2 >> $3.tmp
	else
	    cat $2 > $3.tmp
	fi
        tail -c 263 $2 >> $3.glsign
    else
        echo "[ ${OutputRed}ERR${OutputWhite} ] Section \"$1\" not present. File $2 doesn't exist or not a regular file."	
    fi
}

# Check access gpg
gpg --version
if [ "$?" -ne "0" ]; then
    echo "[ ${OutputRed}ERR${OutputWhite} ] Application gpg not found!"
    exit 1
fi

# Make bootimage: Start
if [ -z "$4" ]; then 
    echo "[ ${OutputRed}ERR${OutputWhite} ] Image Version is not present!"
    exit 1
fi
img_version=$4
let img_version+=0
if [ "$?" -ne "0" ]; then
    echo "[ ${OutputRed}ERR${OutputWhite} ] Error Image Version not digit"
    exit 1
fi

# Check Bootstrap Version
if [ "$BOOTSTRAP_VERSION" != "" ]; then 
    img_version=$BOOTSTRAP_VERSION
    let img_version+=0
    if [ "$?" -ne "0" ]; then
        echo "[ ${OutputRed}ERR${OutputWhite} ] Error Bootstrap Version not digit"
        exit 1
    fi
fi

echo "[ ${OutputGreen}OK!${OutputWhite} ] Found valid image output value. File result: $1"
rm -f $1.glsign

if [ "$6" != "" ]; then
  echo "STB Model:"$6 >$1
else
  echo "STB Model:MAG200" >$1
fi
date1=`export LC_TIME=en_US.UTF8; date` 
echo "Date:"$date1 >>$1
echo "Image Version:"$4 >>$1
echo "Image Description:"$5 >>$1

if [ "$7" == "" ] ; then
    echo -e "\n[ ${OutputRed}ERR${OutputWhite} ] Update API version is not defined!!!"
    exit 1;
fi
echo "VerUpdateAPI:"$7 >>$1

append_section "Kernel size:" $2 $1
append_section "Image  size:" $3 $1
if [ -n "$ENV_VARIABLE_PATH" ] && [ -f $ENV_VARIABLE_PATH ]; then
  append_section_with_dsa "Env size:" $ENV_VARIABLE_PATH $1
fi
if [ -n "$BOOTSTRAP_PATH" ] && [ -f $BOOTSTRAP_PATH ] && [ "$BOOTSTRAP_VERSION" != "" ]; then
    echo "Bootstrap Version:"$BOOTSTRAP_VERSION >>$1
    append_section_with_dsa "Bootstrap size:" $BOOTSTRAP_PATH $1
fi
if [ -n "$USERFS_PATH" ] && [ -f $USERFS_PATH ] && [ "$USERFS_VERSION" != "" ]; then
    echo "Userfs Version:"$USERFS_VERSION >>$1
    append_section_with_dsa "Userfs size:" $USERFS_PATH $1
fi
if [ -n "$SECONDBOOT_PATH" ] && [ -f $SECONDBOOT_PATH ]; then
    append_section_with_dsa "SecondBoot size:" $SECONDBOOT_PATH $1
fi
if [ -n "$LOGOTYPE_PATH" ] && [ -f $LOGOTYPE_PATH ]; then
    append_section_with_dsa "Logotype  size:" $LOGOTYPE_PATH $1
fi

echo "Start data..." >>$1

# Global sign
cat $1 > $calc_glsign
cat $1.glsign >> $calc_glsign
gpg --force-v3-sigs -u $MAG200_OP_KEY ${gpg_option} --detach-sign $calc_glsign
if [ "$?" -ne "0" ]; then
 echo "[ ${OutputRed}ERR${OutputWhite} ] Error make digital signature for header"
 exit 1
fi
./dsign -a -i $calc_glsign.sig $1.tmp
if [ "$?" -ne "0" ]; then
  echo "[ ${OutputRed}ERR${OutputWhite} ] Error append digital signature for section header."
  rm -f $calc_glsign.sig $1.glsign     
  exit 1
fi
rm -f $calc_glsign.sig $1.glsign

# Make a digital signature for all data
cat $1.tmp >> $1
rm  -f $1.tmp
echo "[ ${OutputGreen}OK!${OutputWhite} ] Firmware $1 created successfully!!!"

# Make bootimage: End
