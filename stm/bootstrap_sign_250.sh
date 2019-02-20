#!/bin/bash
# $1/images - path for result.If absent then current directory.
if [ -z "$1" ]; then
RESULTDIR=`pwd`
else
RESULTDIR=$1
fi

rm -f $RESULTDIR/images/Bootstrap_250
entrypoint=0x80801000
./mksign.sh $RESULTDIR/images/Bootstrap_250.clean $RESULTDIR/images/Bootstrap_250.sign
if [ "$?" -ne "0" ]; then
 echo "Error make Bootstrap."
 exit 1
fi
./mkimage -A sh -O linux -T kernel -C none -a 0x80800000 -e 0x80801000 -n 'MAG250 SH4 Kernel Linux 2.6.17' -d $RESULTDIR/images/Bootstrap_250.sign $RESULTDIR/images/Bootstrap_250
rm -f $RESULTDIR/images/Bootstrap_250.sign
