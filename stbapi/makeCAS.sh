#!/bin/sh

sh4-linux-gcc test-cas.c -shared -o libCasCustom4.so


sh4-linux-strip libCasCustom*.so -K CreateCasPlugin -K GetCasApiVersion -K GetCasPluginDescription
