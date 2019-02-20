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
	echo "[ ${OutputRed}ERR${OutputWhite} ] The required package $1 is not installed. Install it and then try starting script again. Now aborting."
	[ "$2" != "" ] && echo "      Additional message sent by script: $2"
	kill -s TERM $TOP_PID
fi

}

. /etc/lsb-release
case "$DISTRIB_RELEASE" in
	"18.04"|"18.10")
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
