#!/bin/bash
# The script initializes the TPUT commands and sends version of toolchain & hello message. Works like a common library. Then checks if not 18.04 or 18.10 unsupported still versions are used.
# Big ask for you: DO NOT EDIT IT. ;)

export STBSDK_Version="2.00-beta"
export STBSDK_Date="2019-02-18"

export OutputRed=`tput setaf 1`
export OutputGreen=`tput setaf 2`
export OutputBlue=`tput setaf 4`
export OutputWhite=`tput setaf 7`
export OutputYellow=`tput setaf 3`

export OutputBeginBold=`tput bold`
export OutputEndBold=`tput sgr0`

. /etc/lsb-release
case "$DISTRIB_RELEASE" in
	"18.04"|"18.10")
		echo "[ ${OutputRed}ERR${OutputWhite} ] You are using system which bases on Ubuntu ${DISTRIB_RELEASE}. This version is unfortunately not supported now. The supported systems are Ubuntu 12.04 to 16.04 based."
		exit 1
		;;
esac
