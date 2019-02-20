#!/bin/bash
# Original image in ./image/vmlinux.bin
# Result:
#	  uImage 	   -  signed kernel prepared for bootloader  
#	  uImzlib_null.img -  image for partition mtd4
#	  uImzlib.img 	   -  signed image for mtd4 include in updateimage  
#
# Allowed options: --custom -> signes as custom image

. ../includes/initialize.sh
. ../includes/message.sh

if [ "$1" == "--custom" ]
then
	export MAKE_CUSTOM_IMAGE=1
fi

export MODEL_NUMBER=349

rm -f ./uImage_mag${MODEL_NUMBER} ./uImzlib_null_mag${MODEL_NUMBER}.img ./uImzlib_mag${MODEL_NUMBER}.img

if [ "$MAKE_CUSTOM_IMAGE" != "" ] ; then
    OLD_KEY=$MAG200_OP_KEY
    export MAG200_OP_KEY=STB_PUBLIC
    ./mksign.sh ./images/uImage_mag${MODEL_NUMBER}.clean ./uImage_mag${MODEL_NUMBER} SHA256
    export MAG200_OP_KEY=$OLD_KEY
else
    ./mksign.sh ./images/uImage_mag${MODEL_NUMBER}.clean ./uImage_mag${MODEL_NUMBER} SHA256
fi

cp ./uImage_mag${MODEL_NUMBER} uImzlib_null_mag${MODEL_NUMBER}.img

./mksign.sh uImzlib_null_mag${MODEL_NUMBER}.img uImzlib_mag${MODEL_NUMBER}.img SHA256
