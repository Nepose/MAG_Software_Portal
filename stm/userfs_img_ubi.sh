#!/bin/bash
# Original Bootstrap in ./images/vmlinux.bin
# Result:
#

if [ "$1" == "" ]; then
    dir=./userfs
else	
    dir=$1
fi 
./or_mkfs.ubifs -r $dir -m 2048 -e 126976 -c 224 ./images/userfs_ubi.img


