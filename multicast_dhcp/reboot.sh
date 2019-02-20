#!/bin/sh
# Command's format
# First line  : COMMAND (example Reboot)
#	      : text
# End Command : ####### END COMMAND #######

cmd=tmpcmd
rm -f $cmd
echo "Reboot">$cmd
echo "####### END COMMAND #######">>$cmd
./cmd_send.sh $cmd
rm -f $cmd
