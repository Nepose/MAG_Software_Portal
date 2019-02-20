#!/usr/bin/env bash
# $1 - path to source (unminified portal)
# $2 - path where portal should be minified

export EMBEDDED_PORTAL_SDK=true
. ../../includes/initialize.sh
. ../../includes/message.sh

echo "[ ${OutputBlue}GET${OutputWhite} ] Requested action of minifying embedded portal."

if [[ "$1" == "" && "$2" == "" ]]; then
	nodejs release.js --src ".." --dst "../mini"
elif [[ "$1" != "" && "$2" != "" ]]; then
	nodejs release.js --src "$1" --dst "$2"
fi
