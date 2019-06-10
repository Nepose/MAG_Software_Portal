#!/bin/bash
trap "exit 1" TERM
export TOP_PID=$$

echo "${OutputBeginBold}Infomir STB SDK - MAG Software Portal"
echo "Version ${STBSDK_Version} -> ${STBSDK_Date}"
echo "==============================================${OutputEndBold}${OutputWhite}"

##
# Checking system requirements
#

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
			;;
		"y"|"Y"|"yes"|"Yes"|"yES"|"yEs"|"YeS"|"YES"|"YEs"|"yeS")
			sudo apt-get update
			sudo apt-get install "$1"
			;;
		*)
			echo "[ ${OutputRed}ERR${OutputWhite} ] Invalid input. Aborting."
			kill -s TERM $TOP_PID
			;;
	esac
fi

}

. /etc/lsb-release
case "$DISTRIB_RELEASE" in
	"16.10"|"17"|"17.04"|"17.10"|"18"|"18.04"|"18.10"|"19"|"19.04")
		echo "[ ${OutputRed}ERR${OutputWhite} ] You are using system which bases on Ubuntu ${DISTRIB_RELEASE}. This version is unfortunately not supported now. The supported systems are Ubuntu 12.04 to 16.04 based."
		exit 1
		;;
esac

if [ "$EMBEDDED_PORTAL_SDK" == "true" ]; then
	checkIfPackage 'python-software-properties'
	checkIfPackage 'nodejs'
	checkIfPackage 'git'
	checkIfPackage 'npm'
fi

checkIfPackage 'mtd-utils'

machineSystem=`uname -m`
[ "$machineSystem" == 'x86_64' ] && checkIfPackage 'lib32z1' 'You are using 64-bit system so additionally this package is required in order to set dependencies for 32-bit utilities.'

echo "[ ${OutputGreen}OK!${OutputWhite} ] All dependencies and requirements are filled successfully."
