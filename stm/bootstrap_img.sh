#!/bin/bash
# Original Bootstrap in ./images/Bootstrap
# Result:
#

mkdir ./bootstrap
cp ./images/Bootstrap  ./bootstrap/Bootstrap
./or_mkfs.jffs2 -d ./bootstrap -o ./images/Bootstrap.img -x zlib -x rtime -s 2048 -e 128KiB  -n
rm -f ./bootstrap/*
rmdir ./bootstrap


