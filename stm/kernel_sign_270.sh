#!/bin/bash
# Original image in ./image/vmlinux.bin
# Result:
#         uImage           -  signed kernel prepared for bootloader
#         uImzlib_null.img -  image for partition mtd4
#         uImzlib.img      -  signed image for mtd4 include in updateimage
#
# Allowed options: --custom -> signes as custom image

. ../includes/initialize.sh
. ../includes/message.sh

if [ "$1" == "--custom" ]
then
	export MAKE_CUSTOM_IMAGE=1
fi

export MODEL_NUMBER=270


rm -f ./uImage_mag${MODEL_NUMBER} ./uImzlib_null_mag${MODEL_NUMBER}.img ./uImzlib_mag${MODEL_NUMBER}.img
if [ -e ./images/vmlinux.mag${MODEL_NUMBER} ]; then
searchstr="start address"
entrypoint=`sh4-linux-objdump -f ./images/vmlinux.mag${MODEL_NUMBER} | grep "$searchstr" | tail --bytes=11`
else
entrypoint=0x80801000
fi
gzip -c9 ./images/vmlinux.bin.mag${MODEL_NUMBER} > ./vmlinux.bin.gz

if [ "$MAKE_CUSTOM_IMAGE" != "" ] ; then
    OLD_KEY=$MAG200_OP_KEY
    export MAG200_OP_KEY=STB_PUBLIC
    ./mksign.sh vmlinux.bin.gz vmlinux.sign
    export MAG200_OP_KEY=$OLD_KEY
else
    ./mksign.sh vmlinux.bin.gz vmlinux.sign
fi
./mkimage -A sh -O linux -T kernel -C gzip -a 0x80800000 -e $entrypoint -n "MAG${MODEL_NUMBER} SH4 Kernel Linu
x 2.6.17" -d ./vmlinux.sign ./uImage_mag${MODEL_NUMBER}
rm -f vmlinux.bin.gz vmlinux.sign
rm -f ./uImzlib_mag${MODEL_NUMBER}.img
rm -f -R ./kernel
mkdir ./kernel
cp ./uImage_mag${MODEL_NUMBER} ./kernel/uImage
./or_mkfs.jffs2 -d ./kernel -o uImzlib_null_mag${MODEL_NUMBER}.img -x zlib -x rtime -s 2048 -e 128KiB  -n
rm -f ./kernel/*
rmdir ./kernel
./mksign.sh uImzlib_null_mag${MODEL_NUMBER}.img uImzlib_mag${MODEL_NUMBER}.img


