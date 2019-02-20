# MAG Software Portal
## Improved STB SDK for making firmware

This is a toolchain to compile images for Infomir IPTV STBs - MAG and Aura HD. It is improved version of SDK done by Infomir corporation, manufacturer of set-top-boxes.

The toolchain is a part of **MAG Software Portal** project, which also includes ready-made custom firmware and wiki for Operators.

## Functions of toolchain
* Compile / prepare following parts of firmware:
  * root file system,
  * user file system (mounted on */mnt/Userfs*),
  * kernel (Linux is used),
  * logotype for bootloader,
  * preconfiguration for STBs (*environment variables*),
  * bootstrap image for STM-based STBs,
  * logotype for bootloader.
* Minify embedded portal.
* Do DHCP / TFTP connection to STB.

The toolchain doesn't support MAG 424/425 STBs. The toolchain is available **only for Linux** (bash is necessary, recommended Debian-based system).

According to official Infomir wiki page about STB SDK:
*Operator utilities allow to make three different variants of STB software image:

 - PublicImage - image which is signed with standard “public key” - STB_PUBLIC.
Updating variants: Starting from 0.2.14-r8 updates via HTTP or USB from portal to manufacturer STB software version only, (STB software versions that were assembled directly by the manufacturer and provided for automatic and manual updates located by manufacturer's URL).
From Booloader menu can be updated on PublicImage or CustomImage (transitional version) via Multicast/USB with bootstrap/TFTP
 - CustomImage - image which is signed with “custom-key”. This key is created by operator without manufacturer.
Updating variants: Updates via HTTP or USB from portal on STB software versions that are signed by the same key (custom-key). It is used if there is a need in STB update from portal (HTTP or USB update method).
From Booloader menu can be updated on PublicImage or CustomImage (transitional version) via Multicast/USB with bootstrap/TFTP
 - OperatorImage - image which is signed with “operator key”. “Operator key” should be signed by manufacturer.
Updating variants: Updates on STB software versions which are signed by “operators key" only.*

Utilities with my modification work exactly like the official ones, but also contain some add-ons like:
 - verification if the requirements of operator utilities are done properly. The requirements are:
	- OS Ubuntu 12.04 - 16.04 or fork distro like Mint basing on it,
	- installed package mtd-utils (if 64-bit system than lib32z1 is additionally required),
	- when using embedded portal minifier required are: git, nodejs, npm, python-software-properties.
 - a few cosmetic fixes and improvements,
 - update checker (I'm going to update this SDK constantly),
 - adding the ready-made embedded portal minifier to STB SDK. On official operator utilities the embedded portal minifier is the different part.

## Using toolchain

Again referring to the official Infomir guide for easier comparing my utilities with the official ones, these are key points of SDK usage:

1. **Preparing of uImage, uImzlib.img**
   Exactly the same. You download from [soft.infomir.com](http://soft.infomir.com) the proper kernel and sources and then place kernel in *images/* directory.

2. **Kernel sign**
   For signing kernel the file `kernel_sign_<modelNumber>.sh` is used like in official SDK. The only difference is that for signing with custom or operator key you don't use `kernel_sign_<modelNumber>_custom.sh`. Instead, you start the first script with `--custom` option, like here for MAG 349:
   `./kernel_sign_349.sh --custom`

3. **Profile preparing**
   The new sections are added to image configuration file (profile):
   - `ROOTFS_PATH` -> path to root file system, moved there from command `./img_make.sh`,
   - `IMAGE_OUTPUT` -> specify name of imageupdate other than default if you want.

4. **Imageupdate preparing**
   
