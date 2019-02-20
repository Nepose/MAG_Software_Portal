#!/bin/bash
#
# $1 - directory where place rootfs
# Result:
#   sumsubfsnone.img - jffs2 image root filesystem for mtd5
#
make_image_jffs2()
{
# $1 - rootfs folder
# $2 - output file name
    ./or_mkfs.jffs2 -d $1 -o $2 -X zlib -s 4096 -e 128KiB -n
}

make_image_ubi()
{
# $1 - rootfs folder
# $2 - output file name
# $3 - partition size in LEBs
    ./or_mkfs.ubifs -r $1 -m 2048 -e 126976 -c $3 -o $2
}


rm -f sumsubfsnone.img
rm -f -R ./tmp
mkdir ./tmp
cp -R -f $1 ./tmp/rootfs

###### Changes between rootfs-nfs and rootfs-nand ##############
#cp -R ./nand_src/* ./tmp/rootfs/
################################################################

###### This is the place for operator's Addons in rootfs #######

################################################################

case $ROOTFS_FS_TYPE in
    ubi)
	make_image_ubi ./tmp/rootfs ./sumsubfsnone.img 1710
    ;;
    ext4)
    ;;
    jffs2)
	make_image_jffs2 ./tmp/rootfs ./sumsubfsnone.img
    ;;
    *)
	make_image_jffs2 ./tmp/rootfs ./sumsubfsnone.img
    ;;
esac

rm -f -R ./tmp
