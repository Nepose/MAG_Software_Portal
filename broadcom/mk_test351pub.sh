#!/bin/bash

export MAG200_OP_KEY=STB_PUBLIC
export model=351

if [ -f ./images/uImage_mag${model}.clean ]; then
    rm -f ./uImage_mag${model} ./uImzlib_mag${model}.img Bootstrap global_sig
else
    echo "File 'uImage_mag${model}.clean' not found."
    exit 1
fi

if [ "$MAKE_CUSTOM_IMAGE" != "" ] ; then
    OLD_KEY=$MAG200_OP_KEY
    export MAG200_OP_KEY=STB_PUBLIC
    ./mksign.sh ./images/uImage_mag${model}.clean ./uImage_mag${model} SHA256
    export MAG200_OP_KEY=$OLD_KEY
else
    ./mksign.sh ./images/uImage_mag${model}.clean ./uImage_mag${model} SHA256
fi
cp ./uImage_mag${model} Bootstrap
./mksign.sh Bootstrap uImzlib_mag${model}.img SHA256
echo "====== KERNEL Complete ======="

version="2.20.01-a14"
cur_date=`export LC_TIME=en_US.UTF8; date`
dir_rootfs="../rootfs-mag${model}"
echo "ImageVersion: ${version}-${model} ${cur_date}" > ${dir_rootfs}/Img_Ver.txt

./img_make.sh 220 ${version} ${dir_rootfs} MAG${model} img_make.profile.mag${model}
echo "====== IMAGE Complete ======="
