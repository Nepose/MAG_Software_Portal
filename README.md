# MAG Software Portal
## Improved STB SDK for making firmware

This is a toolchain to compile images for Infomir IPTV STBs - MAG and Aura HD. It is improved version of SDK done by Infomir corporation, manufacturer of set-top-boxes.

The toolchain is a part of **MAG Software Portal** project, which also includes ready-made custom firmware and wiki for Operators. This SDK comes with already set dependencies and some documentation from Infomir to better work with.

To install toolchain, just clone this Git repo or download source code from releases card.

## Functions of toolchain
* Compile / prepare following parts of firmware:
  * root file system,
  * user file system (mounted on */mnt/Userfs*),
  * kernel (Linux is used),
  * logotype for bootloader,
  * preconfiguration for STBs (*environment variables*),
  * bootstrap image for STM-based STBs,
  * logotype for bootloader.
* Prepare embedded portal:
  * generate localization in STB-readable format from PO files,
  * minify embedded portal,
  * generate offline documentation (*Menu Guide* app) from Infomir resources.
* Do DHCP/TFTP and multicast control connection to STB.

The toolchain doesn't support MAG 424/425 STBs. The toolchain is available **only for Linux**. Embedded portal part is available also for Windows, but Windows script don't contain my modifications (factory state).

## Directory structure
* `broadcom` -> utilities to build imageupdate for Broadcom STBs.
* `docs` -> documentation, refer to *Documentation* section.
* `embedded_portal` -> SDK for embedded portal, refer to *Build embedded portal* section.
* `includes` -> directory with some libraries used by SDK, you don't have to do anything there ;)
* `multicast_dhcp` -> directory with utilities to connect to STB with multicast or DHCP protocol.
* `stm` -> utilities to build imageupdate for STM STBs.

<cite>According to official Infomir wiki page about STB SDK:</cite>

<blockquote>
*Operator utilities allow to make three different variants of STB software image:*

 - *__PublicImage__ - image which is signed with standard “public key” (STB_PUBLIC).*
*Updating variants: Starting from 0.2.14-r8 updates via HTTP or USB from portal to manufacturer STB software version only, (STB software versions that were assembled directly by the manufacturer and provided for automatic and manual updates located by manufacturer's URL).*
*From Bootloader menu can be updated on PublicImage or CustomImage (transitional version) via Multicast/USB with bootstrap/TFTP.*

 - *__CustomImage__ - image which is signed with “custom-key”. This key is created by operator without manufacturer.*
*Updating variants: Updates via HTTP or USB from portal on STB software versions that are signed by the same key (custom-key). It is used if there is a need in STB update from portal (HTTP or USB update method).*
*From Booloader menu can be updated on PublicImage or CustomImage (transitional version) via Multicast/USB with bootstrap/TFTP.*

 - *__OperatorImage__ - image which is signed with “operator key”. “Operator key” should be signed by manufacturer.
Updating variants: Updates on STB software versions which are signed by “operators key" only.*

</blockquote>

Utilities with my modification work exactly like the official ones, but also contain some add-ons like:
 - verification if the requirements of operator utilities are done properly. The requirements are:
	- OS Ubuntu 12.04 - 16.04 or fork distro like Mint basing on it,
	- installed package mtd-utils (if 64-bit system than lib32z1 is additionally required),
	- when using embedded portal minifier required are: git, nodejs, npm, python-software-properties.
 - a few cosmetic fixes and improvements,
 - update checker (I'm going to update this SDK constantly),
 - adding the ready-made embedded portal minifier to STB SDK. On official operator utilities the embedded portal minifier is the different part.

## Using toolchain

### Firmware developing

The code for firmware developing is placed in `broadcom/` and `stm/` directories. Again referring to the official Infomir guide for easier comparing my utilities with the official ones, these are key points of SDK usage:

0. **The zero step**: If you don't have standard public key in your keyring, import it by going to broadcom or stm folder and `gpg --import stb_secbin.key`.

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

   Syntax for preparing:

   `img_make.sh [-v <value>] [-d <value>] [-s <value>] [-p <value>]`

   Where following options mean (order of options doesn't matter):
   - **-v** is image version (digit). Instead it you can use variable `IMAGE_VERSION` in image profile.
   - **-d** is image description (string without spaces and max. 40 chars). As upper, instead it you can use variable `IMAGE_DESCRIPTION` in profile.
   - **-s** is STB model. As upper, equivalent is `STB_MODEL` variable in profile.
   - **-p** is path to image profile file.

   Example for creating imageupdate:
   `./img_make.sh -v 220 -s MAG254 -p ./img_make.profile.mag`.
   This will create image for MAG254 with declared image version 220 and path to profile in `img_make.profile.mag` file.

   Imageupdate consists of sections. Required sections are:
   * version, description and STB model (declared by you either with options of command or by properties in image profile. If you declare both, the value from option is taken),
   * date of image (detected by computer),
   * kernel,
   * root file system.

   Other optional sections are:
   * user file system,
   * bootstrap image (for STM-based images),
   * logotype for bootloader,
   * list of environment variables to set or overwrite.

### Building embedded portal
My operator utilities contain ready to use SDK for embedded portal. This SDK allows you to:
- prepare minified version of embedded portal,
- build localization for embedded portal from PO files,
- build help from Infomir resources.

The most common scripts you will use are:

1. **build.gettext.sh**
   Syntax: `build.gettext.sh <path to embedded portal>`. The script will build gettext localization on the path you entered.

2. **build.release.sh**
   Syntax. `build.release.sh <path-to-embedded-portal> <path-where-portal-should-be-minified>` As you see, this script takes two arguments - path where source is located and path where embedded portal minified output should be put.

3. **build.help.sh**
   This doesn't take any arguments - just builds help from Infomir server docs, although this function is still in beta. In case the script returns errors, try visiting [stbhelp.iptv.infomir.com.ua](//stbhelp.iptv.infomir.com.ua), where the default docs are hosted.

### Documentation
On the `docs/` folder you can find some guides taken from Infomir website [soft.infomir.com](//soft.infomir.com) to help you dealing with utilities and HTML documentation of JavaScript API. There is nothing to explain - just read the docs when you need. Note please those two things:
* A few of guides were translated from Russian so it may look strangely, but context and overtone is still understandable ;)
* On most of guides (expect STB API) only MAG 200 is mentioned as STB, but in fact the guides apply to all models of STBs and there is no need to rewrite docs with changing name.
* And remember that there still is [Infomir Wiki](//wiki.infomir.eu) and [my wiki](//firmware.magboxes.xyz/docs) with some useful information.

## Checking for updates

The toolchain is going to be constantly improved so I've added a script to check for updates. To run it, when being at root directory of toolchain:

`./includes/checkForUpdates.sh`

Nothing more to explain, it will just check and download latest version :)

## Contribution

Every contribution is appreciated, like in entire project. For more information go to website of MAG Software Portal https://firmware.magboxes.xyz. In case of any problems you can write in any of forums listed on page (or enter new thread in your forum, which is also very appreciated) or open Issue or Pull Request in repository of SDK.
