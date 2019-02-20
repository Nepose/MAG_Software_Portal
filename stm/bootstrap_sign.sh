#!/bin/bash
# $1/images - path for result.If absent then current directory.
if [ -z "$1" ]; then
RESULTDIR=`pwd`
else
RESULTDIR=$1
fi

rm -f $RESULTDIR/images/Bootstrap
entrypoint=0x84602000
./mksign.sh $RESULTDIR/images/Bootstrap.clean $RESULTDIR/images/Bootstrap.sign
if [ "$?" -ne "0" ]; then
 echo "Error make Bootstrap."
 exit 1
fi

./mkimage -A sh4 -O linux -T kernel -C none -a 0x84601000 -e $entrypoint -n 'SH4 Kernel Linux 2.6.17' -d $RESULTDIR/images/Bootstrap.sign $RESULTDIR/images/Bootstrap
rm -f $RESULTDIR/images/Bootstrap.sign
