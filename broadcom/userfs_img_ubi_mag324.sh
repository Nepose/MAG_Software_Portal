#!/bin/bash

if [ "$1" == "" ]; then
    dir=./userfs
else
    dir=$1
fi
./or_mkfs.ubifs -r $dir -m 4096 -e 253952 -c 88 -o ./images/userfs_mag324.img

