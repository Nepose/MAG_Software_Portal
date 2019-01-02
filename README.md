# MAG Software Portal
## Improved STB SDK for making firmware

This is a toolchain to compile images for Infomir IPTV STBs - MAG and Aura HD. It is improved version of SDK done by Infomir corporation, manufacturer of set-top-boxes.

## Functions of toolchain
* Compile / prepare following parts of firmware:
  * root file system,
  * user file system (mounted on */mnt/Userfs*),
  * kernel (Linux is used),
  * logotype for bootloader,
  * preconfiguration for STBs (*environment variables*).
* Minify embedded portal.
* Do DHCP / TFTP connection to STB.

Now toolchain **does not** support MAG 424/425 STB.
