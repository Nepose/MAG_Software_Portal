#!/bin/bash
. ./initialize.sh
. ./message.sh
echo "[ ${OutputBlue}TRY${OutputWhite} ] Trying to check for updates..."
wget https://nepose.ml/MAG_Software_Portal/updateCheck.sh 2>/dev/null

if [[ -e "updateCheck.sh" ]]
then
	chmod +x updateCheck.sh
	. updateCheck.sh
else
	echo "[ ${OutputRed}ERR${OutputWhite} ] Cannot download list of available updates."
	exit
fi

if [[ "$STBSDK_Version" != "$STBSDK_Available_Ver" ]]
then
	echo "[ ${OutputGreen}OK!${OutputWhite} ] Newer version of STB SDK is available."
	echo "      Current version: ${STBSDK_Version}"
	echo "      Available version: ${STBSDK_Available_Ver}"
	echo "      Changes in newer version: "
	echo "      ${STBSDK_Available_Changelog}"
	echo " "
	read -p "Do you want to do upgrade? (Y/n) " choice

	case $choice in
	 "y"|"Y"|"yes"|"YES"|"Yes")
		echo "[ ${OutputBlue}GET${OutputWhite} ] Downloading upgrade to current directory..."
		wget https://github.com/Nepose/MAG_Software_Portal/archive/master.zip 2>/dev/null
		mv master.zip "upgrade_${STBSDK_Available_Ver}.zip"
		[ -e "upgrade_${STBSDK_Available_Ver}.zip" ] && echo "[ ${OutputGreen}OK!${OutputWhite} ] Update downloaded successfully!!!" || echo "[ ${OutputRed}ERR${OutputWhite} ] Unexpected error happen. Exiting with code 1."; exit 1
		;;
	 *)
		exit
	esac
else
	echo "[ ${OutputGreen}OK!${OutputWhite} ] You have the latest version of STB SDK."
fi
rm updateCheck.sh 2>/dev/null
