#!/bin/bash
# $1/images - path for result.If absent then current directory.
if [ -z "$1" ]; then
RESULTDIR=`pwd`
else
RESULTDIR=$1
fi

rm -f $RESULTDIR/images/Bootstrap_270
entrypoint=0x80801000

#gzipped bootstrap
gzip -c9 $RESULTDIR/images/Bootstrap_270.clean > $RESULTDIR/images/Bootstrap_270.clean.gz
./mksign.sh $RESULTDIR/images/Bootstrap_270.clean.gz $RESULTDIR/images/Bootstrap_270.sign

#uncompressed bootstrap
#./mksign.sh $RESULTDIR/images/Bootstrap_270.clean $RESULTDIR/images/Bootstrap_270.sign

if [ "$?" -ne "0" ]; then
 echo "Error make Bootstrap."
 exit 1
fi

#gzipped bootstrap
./mkimage -A sh -O linux -T kernel -C gzip -a 0x80800000 -e $entrypoint -n 'MAG270 SH4 Kernel Linux 2.6.17' -d $RESULTDIR/images/Bootstrap_270.sign $RESULTDIR/images/Bootstrap_270
#uncompressed bootstrap
#./mkimage -A sh -O linux -T kernel -C none -a 0x80800000 -e 0x80801000 -n 'MAG270 SH4 Kernel Linux 2.6.17' -d $RESULTDIR/images/Bootstrap_270.sign $RESULTDIR/images/Bootstrap_270

rm -f $RESULTDIR/images/Bootstrap_270.sign $RESULTDIR/images/Bootstrap_270.clean.gz
