#!/bin/sh
export MAG200_OP_KEY=STB_PUBLIC 
./kernel_sign_256.sh
./img_make.sh 220 "0.2.20-a6.13-sp-256" /opt/STM/STLinux-2.4/devkit/armv7/target_dm_dhcp/share/i256-splash-6.13/ MAG256 img_make.profile.mag256
