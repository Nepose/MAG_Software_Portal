#!/bin/bash
# $1 - name file with command 
# IP_CMD - ip multicast group for sending command
# PORT_CMD - port for sending command  

IP_CMD=224.10.0.52
PORT_CMD=9002 

cmd2=tmpcmd2
rm -f $cmd2
f=`du -b $1`
size=${f%%	$1}
echo "Command size:"$size > $cmd2
echo "Date: "`date +"%F %R:%S %s"` >> $cmd2
echo "Start data..." >> $cmd2
cat  $1 >> $cmd2
rm   -f $1.sig
gpg -u $MAG200_OP_KEY --detach-sign $1
if [ "$?" -ne "0" ]; then
 echo "Error make digital signature"
 rm -f $cmd2
 exit 1
fi
cat $1.sig >> $cmd2
./mcsend -f $cmd2 -ip $IP_CMD:$PORT_CMD -once
echo "Done"
rm  -f $1.sig $cmd2



   