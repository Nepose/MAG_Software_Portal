#!/bin/bash
# Original Bootstrap in ./images/vmlinux.bin
# Result:
#

if [ "$1" == "" ]; then
    dir=./userfs
else	
    dir=$1
fi 
./or_mkfs.jffs2 -d $dir -o ./images/userfs.img -x zlib -x rtime -s 2048 -e 128KiB  -n


