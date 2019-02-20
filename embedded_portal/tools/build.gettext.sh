#!/usr/bin/env bash
# $1 - path to source portal without trailing slash

export EMBEDDED_PORTAL_SDK=true
. ../../includes/initialize.sh
. ../../includes/message.sh

echo "[ ${OutputBlue}GET${OutputWhite} ] Requested action of building gettext localization of embedded portal."

[ "$1" != "" ] && src=$1 || read -p "[${OutputYellow}WARN!${OutputWhite}] Path to embedded portal source directory is not defined. Define it there or Ctrl+Z to abort: " src
[ "$src" == "" ] && src=".."

echo "[ ${OutputBlue}GET${OutputWhite} ] Got path to embedded portal source on PC: ${src}"

nodejs gettext.js -s "${src}/public/app/ibman/lang/ru.po ${src}/system/access.control/lang/ru.po"
nodejs gettext.js -s "${src}/public/app/ibman/lang/de.po ${src}/system/access.control/lang/de.po"
nodejs gettext.js -s "${src}/public/app/ibman/lang/bg.po ${src}/system/access.control/lang/bg.po"
nodejs gettext.js -s "${src}/public/app/ibman/lang/uk.po ${src}/system/access.control/lang/uk.po"
nodejs gettext.js -s "${src}/public/app/ibman/lang/es.po ${src}/system/access.control/lang/es.po"
nodejs gettext.js -s "${src}/public/app/ibman/lang/tr.po ${src}/system/access.control/lang/tr.po"
nodejs gettext.js -s "${src}/public/app/ibman/lang/el.po ${src}/system/access.control/lang/el.po"

nodejs gettext.js -s "${src}/public/app/dlman/lang/ru.po ${src}/system/access.control/lang/ru.po"
nodejs gettext.js -s "${src}/public/app/dlman/lang/de.po ${src}/system/access.control/lang/de.po"
nodejs gettext.js -s "${src}/public/app/dlman/lang/bg.po ${src}/system/access.control/lang/bg.po"
nodejs gettext.js -s "${src}/public/app/dlman/lang/uk.po ${src}/system/access.control/lang/uk.po"
nodejs gettext.js -s "${src}/public/app/dlman/lang/es.po ${src}/system/access.control/lang/es.po"
nodejs gettext.js -s "${src}/public/app/dlman/lang/tr.po ${src}/system/access.control/lang/tr.po"
nodejs gettext.js -s "${src}/public/app/dlman/lang/el.po ${src}/system/access.control/lang/el.po"

nodejs gettext.js -s "${src}/public/app/pvr/lang/ru.po"
nodejs gettext.js -s "${src}/public/app/pvr/lang/de.po"
nodejs gettext.js -s "${src}/public/app/pvr/lang/bg.po"
nodejs gettext.js -s "${src}/public/app/pvr/lang/uk.po"
nodejs gettext.js -s "${src}/public/app/pvr/lang/es.po"
nodejs gettext.js -s "${src}/public/app/pvr/lang/tr.po"
nodejs gettext.js -s "${src}/public/app/pvr/lang/el.po"

nodejs gettext.js -s "${src}/public/app/help/lang/ru.po"
nodejs gettext.js -s "${src}/public/app/help/lang/de.po"
nodejs gettext.js -s "${src}/public/app/help/lang/bg.po"
nodejs gettext.js -s "${src}/public/app/help/lang/uk.po"
nodejs gettext.js -s "${src}/public/app/help/lang/es.po"
nodejs gettext.js -s "${src}/public/app/help/lang/tr.po"
nodejs gettext.js -s "${src}/public/app/help/lang/el.po"

nodejs gettext.js -s "${src}/public/portal/master_settings/lang/ru.po"
nodejs gettext.js -s "${src}/public/portal/master_settings/lang/de.po"
nodejs gettext.js -s "${src}/public/portal/master_settings/lang/bg.po"
nodejs gettext.js -s "${src}/public/portal/master_settings/lang/uk.po"
nodejs gettext.js -s "${src}/public/portal/master_settings/lang/es.po"
nodejs gettext.js -s "${src}/public/portal/master_settings/lang/tr.po"
nodejs gettext.js -s "${src}/public/portal/master_settings/lang/el.po"

nodejs gettext.js -s "${src}/public/portal/lang/ru.po ${src}/system/updater/lang/ru.po ${src}/system/access.control/lang/ru.po"
nodejs gettext.js -s "${src}/public/portal/lang/de.po ${src}/system/updater/lang/de.po ${src}/system/access.control/lang/de.po"
nodejs gettext.js -s "${src}/public/portal/lang/bg.po ${src}/system/updater/lang/bg.po ${src}/system/access.control/lang/bg.po"
nodejs gettext.js -s "${src}/public/portal/lang/uk.po ${src}/system/updater/lang/uk.po ${src}/system/access.control/lang/uk.po"
nodejs gettext.js -s "${src}/public/portal/lang/es.po ${src}/system/updater/lang/es.po ${src}/system/access.control/lang/es.po"
nodejs gettext.js -s "${src}/public/portal/lang/tr.po ${src}/system/updater/lang/tr.po ${src}/system/access.control/lang/tr.po"
nodejs gettext.js -s "${src}/public/portal/lang/el.po ${src}/system/updater/lang/el.po ${src}/system/access.control/lang/el.po"

nodejs gettext.js -s "${src}/system/pages/loader/lang/ru.po ${src}/system/access.control/lang/ru.po"
nodejs gettext.js -s "${src}/system/pages/loader/lang/de.po ${src}/system/access.control/lang/de.po"
nodejs gettext.js -s "${src}/system/pages/loader/lang/bg.po ${src}/system/access.control/lang/bg.po"
nodejs gettext.js -s "${src}/system/pages/loader/lang/uk.po ${src}/system/access.control/lang/uk.po"
nodejs gettext.js -s "${src}/system/pages/loader/lang/es.po ${src}/system/access.control/lang/es.po"
nodejs gettext.js -s "${src}/system/pages/loader/lang/tr.po ${src}/system/access.control/lang/tr.po"
nodejs gettext.js -s "${src}/system/pages/loader/lang/el.po ${src}/system/access.control/lang/el.po"

nodejs gettext.js -s "${src}/system/settings/lang/ru.po ${src}/system/updater/lang/ru.po ${src}/system/access.control/lang/ru.po"
nodejs gettext.js -s "${src}/system/settings/lang/de.po ${src}/system/updater/lang/de.po ${src}/system/access.control/lang/de.po"
nodejs gettext.js -s "${src}/system/settings/lang/bg.po ${src}/system/updater/lang/bg.po ${src}/system/access.control/lang/bg.po"
nodejs gettext.js -s "${src}/system/settings/lang/uk.po ${src}/system/updater/lang/uk.po ${src}/system/access.control/lang/uk.po"
nodejs gettext.js -s "${src}/system/settings/lang/es.po ${src}/system/updater/lang/es.po ${src}/system/access.control/lang/es.po"
nodejs gettext.js -s "${src}/system/settings/lang/tr.po ${src}/system/updater/lang/tr.po ${src}/system/access.control/lang/tr.po"
nodejs gettext.js -s "${src}/system/settings/lang/el.po ${src}/system/updater/lang/el.po ${src}/system/access.control/lang/el.po"

nodejs gettext.js -s "${src}/system/updater/lang/ru.po"
nodejs gettext.js -s "${src}/system/updater/lang/de.po"
nodejs gettext.js -s "${src}/system/updater/lang/bg.po"
nodejs gettext.js -s "${src}/system/updater/lang/uk.po"
nodejs gettext.js -s "${src}/system/updater/lang/es.po"
nodejs gettext.js -s "${src}/system/updater/lang/tr.po"
nodejs gettext.js -s "${src}/system/updater/lang/el.po"
