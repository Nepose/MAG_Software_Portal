#!/bin/bash
# The script initializes the TPUT commands and sends version of toolchain & hello message. Works like a common library. Then checks if not 18.04 or 18.10 unsupported still versions are used.
# Big ask for you: DO NOT EDIT IT. ;)

function checkIfPackage() {
# $1 -> name of package to check
# $2 -> additional message to display in case of error if required

if [ $(dpkg-query -W -f='${Status}' `echo $1` 2>/dev/null | grep -c "ok installed") -eq 0 ]
then
	echo "[ ${OutputRed}ERR${OutputWhite} ] The required package $1 is not installed."
	[ "$2" != "" ] && echo "      Additional message sent by script: $2"
	read -p "      Do you want to install it now? (Y/n)" install
	case "$install" in
		"n"|"N"|"nO"|"No"|"NO")
			kill -s TERM $TOP_PID
		"y"|"Y"|"yes"|"Yes"|"yES"|"yEs"|"YeS"|"YES"|"YEs"|"yeS")
			sudo apt-get update
			sudo apt-get install "$1"
		*)
			echo "[ ${OutputRed}ERR${OutputWhite} ] Invalid input. Aborting."
			kill -s TERM $TOP_PID
fi

}

export STBSDK_Version="2.00.1"
export STBSDK_Date="2019-02-22"

export OutputRed=`tput setaf 1`
export OutputGreen=`tput setaf 2`
export OutputBlue=`tput setaf 4`
export OutputWhite=`tput setaf 7`
export OutputYellow=`tput setaf 3`

export OutputBeginBold=`tput bold`
export OutputEndBold=`tput sgr0`

################################################################
# Checking of system requirements is done in message.sh script #
################################################################
