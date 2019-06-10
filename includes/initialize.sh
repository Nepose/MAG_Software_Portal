#!/bin/bash
# The script initializes the TPUT commands and sends version of toolchain & hello message. Works like a common library. Then checks if not 18.04 or 18.10 unsupported still versions are used.
# Big ask for you: DO NOT EDIT IT. ;)

export STBSDK_Version="2.01"
export STBSDK_Date="2019-06-10"

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
