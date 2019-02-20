#!/bin/bash
#    $1 - Image Version (digit)
#    $2 - Image Description
#    $3 - stb model
#    $4 - file profile (if exists)

. ../includes/initialize.sh
. ../includes/message.sh

function not_existing() {
	read -p "[${OutputYellow}WARN!${OutputWhite}] $1 is not defined.${3} Specify its value here or Ctrl+Z to abort: " "$2"
}

if [ "$4" != "" ]; then 
  . $4
  . ../includes/exportVars.sh
elif [ -f "./img_make.profile" ]; then
  . img_make.profile
  . ../includes/exportVars.sh
else
  not_existing "Path to image profile" "IMAGE_PROFILE" " You can either enter path to it or leave field blank to omit it."
fi

if [ "$1" == "" ]; then 
    img_ver=$IMAGE_VERSION 
else 
    img_ver=$1 
fi

if [ "$2" == "" ]; then
    img_desc=$IMAGE_DESCRIPTION
else
    img_desc=$2
fi

if [ "$3" == "" ]; then
    stb_model=$STB_MODEL
else
    stb_model=$3
fi

# Try again if one of necessary values doesn't exist

[ "$img_ver" == "" ] && not_existing "Image version" "img_ver"
[ "$img_desc" == "" ] && not_existing "Image description" "img_desc"
[ "$stb_model" == "" ] && not_existing "STB model" "stb_model"
[ "$ROOTFS_PATH" == "" ] && not_existing "Path to root file system" "ROOTFS_PATH"; export ROOTFS_PATH="$ROOTFS_PATH"
[ "$KERNEL_PATH" == "" ] && not_existing "Path to kernel" "KERNEL_PATH"; export KERNEL_PATH="$KERNEL_PATH"

# Get update API
if [ ! -f $ROOTFS_PATH/etc/VerUpdateAPI.conf ] ; then
    echo -e "[ ${OutputRed}ERR${OutputWhite} ] Update API version is not defined!!!\n"
    exit 1;
fi
verUpdateAPI=`cat $ROOTFS_PATH/etc/VerUpdateAPI.conf | awk '{printf  $1; exit;}'`
echo "[ ${OutputBlue}TRY${OutputWhite} ] Make rootfs image $ROOTFS_PATH"
./mk_rfs.sh $ROOTFS_PATH

# Append digital signature
echo "[ ${OutputBlue}TRY${OutputWhite} ] Append digital signature MAG200_OP_KEY=$MAG200_OP_KEY"
./mksign.sh ./sumsubfsnone.img ./sumsubfsnone.img.sign $HASH_TYPE

# Make One Image
echo "[ ${OutputGreen}OK!${OutputWhite} ] Appending okay. Proceeding to compile output firmware..."
./make_imageupdate.sh $IMAGE_OUTPUT $KERNEL_PATH ./sumsubfsnone.img.sign $img_ver $img_desc $stb_model $verUpdateAPI $HASH_TYPE
rm -f ./sumsubfsnone.img.sign
