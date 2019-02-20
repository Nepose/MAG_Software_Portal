#!/bin/bash
# $1/images - path for result.If absent then current directory.
if [ -z "$1" ]; then
RESULTDIR=`pwd`
else
RESULTDIR=$1
fi

rm -f $RESULTDIR/images/Bootstrap_256

./mksign.sh $RESULTDIR/images/Bootstrap_256.clean $RESULTDIR/images/Bootstrap_256 SHA256
if [ "$?" -ne "0" ]; then
 echo "Error make Bootstrap."
 exit 1
fi
