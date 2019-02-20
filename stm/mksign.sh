#!/bin/bash
# Utility to check signing.

    if [ -z $MAG200_OP_KEY ]; then
        echo "[ ${OutputRed}ERR${OutputWhite} ] You must set environment variable MAG200_OP_KEY as User ID of your key signing. Example: export MAG200_OP_KEY=STB_PUBLIC."
        exit 1
    fi
    
    if [[ ! $(gpg --list-keys | grep -w "$MAG200_OP_KEY") ]]; then
        echo "[ ${OutputRed}ERR${OutputWhite} ]"
        echo "     Error: Key with USER_ID $MAG200_OP_KEY not present in gpg"
        echo "            Append in gpg default public key with USER_ID - STB_PUBLIC:"
        echo "            gpg --import ./stb_secbin.key "
        echo ""
        exit 1
    fi
if [ "$?" -ne "0" ]; then
    exit 1
fi

rm   -f $1.sig
if [ "$3" = "SHA256" ] ; then
    gpg --force-v3-sigs -u $MAG200_OP_KEY --digest-algo=sha256 --detach-sign $1
else
    gpg --force-v3-sigs -u $MAG200_OP_KEY --detach-sign $1
fi

if [ "$?" -ne "0" ]; then
 echo "[ ${OutputRed}ERR${OutputWhite} ] Error make digital signature."
 rm -f $1.sig
 exit 1
fi
cat $1 > $2
./dsign -a -i $1.sig $2
if [ "$?" -ne "0" ]; then
 echo "[ ${OutputRed}ERR${OutputWhite} ] Error append digital signature."
 rm -f $1.sig $2
 exit 1
fi
rm  -f $1.sig 
echo "[ ${OutputGreen}OK!${OutputWhite} ] File $2 create - successfully!!!"
