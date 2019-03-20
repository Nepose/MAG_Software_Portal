gettext.js - NodeJS скрипт генерации js файлов на основании gettext po файлов
	пример вызова:
		node gettext.js -f "../public/app/dlman/lang/ru.po"
	получение справки:
		node gettext.js --help

build.gettext.cmd - скрипт автоматической генерации js файлов на основании gettext po файлов для всего проекта
	вызывается без параметров

release.js - NodeJS скрипт сборки релиза с вычленением всех зависимостей и склейки в общий файл для каждого html файла
	пример вызова (пути по умолчанию):
		node release.js
	пример вызова (пути в явном виде):
		node release.js -s "../../current_portal_path" -d "../../new_minified_version"