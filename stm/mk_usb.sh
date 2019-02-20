#!/bin/bash
rm -f from_usb/sumsubfsnone.img from_usb/uImzlib_null.img
cp sumsubfsnone.img uImzlib_null.img from_usb
tar -czf from_usb.tar.gz from_usb