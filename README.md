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

According to [official Infomir wiki page about their SDK][InfomirLinkPage]:
_Operator utilities allow to make three different variants of STB software image:

_- **PublicImage** - image which is signed with standard “public key” - STB_PUBLIC.
_Updating variants: Starting from 0.2.14-r8 updates via HTTP or USB from portal to manufacturer STB software version only, _(STB software versions that were assembled directly by the manufacturer and provided for automatic and manual updates located by manufacturer's URL).
_From Booloader menu can be updated on PublicImage or CustomImage (transitional version) via Multicast/USB with bootstrap/TFTP
_ - **CustomImage** - image which is signed with “custom-key”. This key is created by operator without manufacturer.
_Updating variants: Updates via HTTP or USB from portal on STB software versions that are signed by the same key (custom-key). It is used if there is a need in STB update from portal (HTTP or USB update method).
From Booloader menu can be updated on PublicImage or CustomImage (transitional version) via Multicast/USB with bootstrap/TFTP
 - **OperatorImage** - image which is signed with “operator key”. “Operator key” should be **signed by manufacturer**.
_Updating variants: Updates on STB software versions which are signed by “operators key" only._

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
   Syntax of command:
   `./img_make.sh [-v <image version>] [-d <image description>] [-s <STB model>] [-p <link to image profile>]`.
   Options for command:
   - **-v** is responsible for image version. You can specify version either with this option or by `IMAGE_VERSION` property in configuration file.
   - **-d** is responsible for image description. As upper, either it or `IMAGE_DESCRIPTION` property in image profile.
   - **-s** is responsible for STB model. As upper, either it or `STB_MODEL` property in image profile.
   - **-p** is responsible for path to image profile. If this option is not declared:
   	- if `./img_make.profile` file exists, it is used as default profile,
	- if `./img_make.profile` file doesn't exists, you will be prompted to declare path to image profile. You can leave it empty when you want.
	
	To compare with official operator utilities, this is the example taken [from Infomir wiki page][InfomirWikiPage]:
	`./img_make.sh 218 "Test_my_version" ../../254/rootfs-0.2.18r14 MAG254 ./img_make.profile.mag254`
	This is the same in my STB SDK:
	`./img_make.sh -v 218 -d "Test_my_version" -s MAG254 -p ./img_make.profile.mag254` + property declared in image profile: `ROOTFS_PATH = '../../254/rootfs-0.2.18r14'`.
   

[InfomirWikiPage](https://wiki.infomir.eu/eng/set-top-box/for-developers/stb-linux-webkit/stb-software-image-making/operators-utilities-and-instructions-for-building-stb-software-image)
