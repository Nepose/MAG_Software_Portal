#!/bin/bash
# Parameters:
# $1 - parth to rootfs
# $2 - name output image file
# $3 - length partition suze MB

#EXT4_ZIP=1
NAME_RFS="rootfs"
IMG_TMP="${PWD}/${NAME_RFS}.tmp"
DIR_TMP="${PWD}/tmp_${NAME_RFS}_ext4"

if (( "$#" > 0 )); then
    SRC_RFS="$1"
else
    SRC_RFS="${PWD}/source/"
fi
if (( "$#" > 1 )); then
    IMG_RFS="$2"
else
    IMG_RFS="${PWD}/${NAME_RFS}.img"
fi
if (( "$#" > 2 )); then
    LEN_RFS="$3"
else
    LEN_RFS=`du -sb $SRC_RFS | awk '{print$1}'`
    LEN_RFS=$(($LEN_RFS/1048576))
    if (( "$LEN_RFS" < 100)); then
        LEN_RFS=$(($LEN_RFS/4+$LEN_RFS))
    else
        LEN_RFS=$(($LEN_RFS/3+$LEN_RFS))
    fi
fi
if (( "$LEN_RFS" < 16 )); then
    LEN_RFS=16
fi
if (( "$LEN_RFS" > 1024 )); then
    LEN_RFS=1024
fi
echo ">>>>> Partition size=${LEN_RFS}"

echo ">>>>> Make ${IMG_RFS}"
rm -f ${IMG_TMP}
rm -f ${IMG_RFS}
mkdir -p -m 0777 ${DIR_TMP}
#chown root:root ${SRC_RFS}/* -R

dd if=/dev/zero of=${IMG_TMP} bs=1M count=${LEN_RFS} > /dev/null 2>&1
if [ "$?" -ne "0" ]; then
    echo "Error make empty image"
    exit 1
fi

echo ">>>>> Format image"
#mkfs.ext4 -F -b 4096 -I 256 ${IMG_TMP} > /dev/null 2>&1
yes | mkfs.ext4 -b 4096 -I 256 ${IMG_TMP} > /dev/null 2>&1
if [ "$?" -ne "0" ]; then
    echo "Error format image"
    rm -f -R ${DIR_TMP}
    rm ${IMG_TMP}
    exit 2
fi

echo ">>>>> Mount image"
sudo mount -o loop ${IMG_TMP} ${DIR_TMP}
if [ "$?" -ne "0" ]; then
    echo "Error mount image"
    rm -f -R ${DIR_TMP}
    rm ${IMG_TMP}
    exit 3
fi

echo ">>>>> Copy files"
sudo cp -R ${SRC_RFS}/* ${DIR_TMP}
if [ "$?" -ne "0" ]; then
    echo "Error copy files"
    umount ${DIR_TMP}
    rm -f -R ${DIR_TMP}
    rm -f ${IMG_TMP}
    exit 4
fi
sync

echo ">>>>> Umount image"
sudo umount ${DIR_TMP}
rm -f -R ${DIR_TMP}
chmod 666 ${IMG_TMP}

if [ "$EXT4_ZIP" == "1" ]; then
    echo ">>>>> Compress image"
    gzip -c ${IMG_TMP} > ${IMG_RFS}
    if [ "$?" -ne "0" ]; then
        echo "Error compress image"
        rm -f ${IMG_TMP}
        rm -f ${IMG_RFS}
        exit 5
    fi
    rm -f ${IMG_TMP}
else
    mv -f ${IMG_TMP} ${IMG_RFS}
fi

echo ">>>>> Complete"
exit 0