﻿/**
 * apply language
 */

'use strict';

/* jshint unused:false */

var fullMonthNames = [_('January'), _('February'), _('March'), _('April'), _('May'), _('June'), _('July'), _('August'), _('September'), _('October'), _('November'), _('December')],
	fullDaysOfWeek = [_('Sunday '), _('Monday '), _('Tuesday '), _('Wednesday '), _('Thursday '), _('Friday '), _('Saturday ')];

var weatherTextById = {
	113 : _('Clear/Sunny'),
	116 : _('Partly Cloudy'),
	119 : _('Cloudy'),
	122 : _('Overcast'),
	143 : _('Mist'),
	176 : _('Patchy rain nearby'),
	179 : _('Patchy snow nearby'),
	182 : _('Patchy sleet nearby'),
	185 : _('Patchy freezing drizzle nearby'),
	200 : _('Thundery outbreaks in nearby'),
	227 : _('Blowing snow'),
	230 : _('Blizzard'),
	248 : _('Fog'),
	260 : _('Freezing fog'),
	263 : _('Patchy light drizzle'),
	266 : _('Light drizzle'),
	281 : _('Freezing drizzle'),
	284 : _('Heavy freezing drizzle'),
	293 : _('Patchy light rain'),
	296 : _('Light rain'),
	299 : _('Moderate rain at times'),
	302 : _('Moderate rain'),
	305 : _('Heavy rain at times'),
	308 : _('Heavy rain'),
	311 : _('Light freezing rain'),
	314 : _('Moderate or Heavy freezing rain'),
	317 : _('Light sleet'),
	320 : _('Moderate or heavy sleet'),
	323 : _('Patchy light snow'),
	326 : _('Light snow'),
	329 : _('Patchy moderate snow'),
	332 : _('Moderate snow'),
	335 : _('Patchy heavy snow'),
	338 : _('Heavy snow'),
	350 : _('Ice pellets'),
	353 : _('Light rain shower'),
	356 : _('Moderate or heavy rain shower'),
	359 : _('Torrential rain shower'),
	362 : _('Light sleet showers'),
	365 : _('Moderate or heavy sleet showers'),
	368 : _('Light snow showers'),
	371 : _('Moderate or heavy snow showers'),
	374 : _('Light showers of ice pellets'),
	377 : _('Moderate or heavy showers of ice pellets'),
	386 : _('Patchy light rain in area with thunder'),
	389 : _('Moderate or heavy rain in area with thunder'),
	392 : _('Patchy light snow in area with thunder'),
	395 : _('Moderate or heavy snow in area with thunder')
};

var lang = {
	today              : _('Today'),
	mediaBrowser       : _('Home Media'),
	tvChannels         : _('IPTV channels'),
	dvbChannels        : _('DVB channels'),
	favorites          : _('Favorites'),
	wildWeb            : _('Internet Browser'),
	wildWebBookmarks   : _('Internet bookmarks'),
	settings           : _('Settings'),
	dlman              : _('Download manager'),
	Internet_services  : _('Internet services'),
	//onlinecinema       : _('Online Media'),
	apps		       : _('Apps'),
	infomirStalker     : _('Infomir Stalker'),
	Manual             : _('Menu Guide'),
	pvr                : _('Record manager'),
	weatherSettings    : _('Weather'),
	weather_in         : _('Weather in'),
	weatherErrorCon    : _('The service is not available at the moment.<br /> Please try again later.'),
	masterSettings     : _('Setup Wizard'),
	weather_change_loc : _('Select city'),
	errorPlaceText     : _('Weather is not found, select another city'),
	saveLocationText   : _('<br>Do you want to save location?'),
	saveLocationYesText: _('Ok'),
	saveLocationNoText : _('Cancel'),
	servicesLoading    : _('Loading service...'),
	servicesUnavailable: _('Service unavailable'),

	humidity   : _('Humidity'),
	wind       : _('Wind'),
	n          : _('N'),
	ne         : _('NE'),
	e          : _('E'),
	se         : _('SE'),
	s          : _('S'),
	sw         : _('SW'),
	w          : _('W'),
	nw         : _('NW'),
	ms         : _('m/s'),
	milesH     : _('miles/h'),
	inProgress : _('Loading data. It may take some time.'),
	noId       : ''
};

var iso639 = [
	{
		code: ['eng', 'en'],
		id: 'English', name: _('English'), nativeName: ''
	},
	{
		code: ['rus', 'ru'],
		id: 'Russian', name: _('Russian'), nativeName: 'Русский'
	},
	{
		code: ['ukr', 'uk'],
		id: 'Ukrainian', name: _('Ukrainian'), nativeName: 'Українська'
	},
	{
		code: ['bel', 'be'],
		id: 'Belarusian', name: _('Belarusian'), nativeName: 'Беларуская'
	},
	{
		code: ['fre', 'fra', 'fr'],
		id: 'French', name: _('French'), nativeName: 'Français'
	},
	{
		code: ['ger', 'deu', 'de'],
		id: 'German', name: _('German'), nativeName: 'Deutsch'
	},
	{
		code: ['ita', 'it'],
		id: 'Italian', name: _('Italian'), nativeName: 'Italiano'
	},
	{
		code: ['spa', 'es'],
		id: 'Spanish', name: _('Spanish'), nativeName: 'Español'
	},
	{
		code: ['por', 'pt'],
		id: 'Portuguese', name: _('Portuguese'), nativeName: 'Português'
	},
	{
		code: ['swe', 'sv'],
		id: 'Swedish', name: _('Swedish'), nativeName: 'Svenska'
	},
	{
		code: ['nor', 'no'],
		id: 'Norwegian', name: _('Norwegian'), nativeName: 'Norsk'
	},
	{
		code: ['dut', 'nld', 'nl'],
		id: 'Dutch', name: _('Dutch'), nativeName: 'Nederlands'
	},
	{
		code: ['srp', 'scc', 'sr'],
		id: 'Serbian', name: _('Serbian'), nativeName: 'Српски'
	},
	{
		code: ['slv', 'sl'],
		id: 'Slovenian', name: _('Slovenian'), nativeName: 'Slovenščina'
	},
	{
		code: ['hrv', 'hr', 'scr'],
		id: 'Croatian', name: _('Croatian'), nativeName: 'Hrvatski'
	},
	{
		code: ['alb', 'sqi', 'sq'],
		id: 'Albanian', name: _('Albanian'), nativeName: 'Shqip'
	},
	{
		code: ['jpn', 'ja'],
		id: 'Japanese', name: _('Japanese'), nativeName: ''
	},
	{
		code: ['chi', 'zho', 'zh'],
		id: 'Chinese', name: _('Chinese'), nativeName: ''
	},
	{
		code: ['kor', 'ko'],
		id: 'Korean', name: _('Korean'), nativeName: ''
	},
	{
		code: ['vie', 'vi'],
		id: 'Vietnamese', name: _('Vietnamese'), nativeName: 'Tiếng Việt'
	},
	{
		code: ['lav', 'lv'],
		id: 'Latvian', name: _('Latvian'), nativeName: 'Latviešu'
	},
	{
		code: ['lit', 'lt'],
		id: 'Lithuanian', name: _('Lithuanian'), nativeName: 'Lietuvių'
	},
	{
		code: ['est', 'et'],
		id: 'Estonian', name: _('Estonian'), nativeName: 'Eesti'
	},
	{
		code: ['fin', 'fi'],
		id: 'Finnish', name: _('Finnish'), nativeName: 'Suomi'
	},
	{
		code: ['hun', 'hu'],
		id: 'Hungarian', name: _('Hungarian'), nativeName: 'Magyar'
	},
	{
		code: ['cze', 'ces', 'cs'],
		id: 'Czech', name: _('Czech'), nativeName: 'Čeština'
	},
	{
		code: ['slo', 'slk', 'sk'],
		id: 'Slovak', name: _('Slovak'), nativeName: 'Slovenčina'
	},
	{
		code: ['bul', 'bg'],
		id: 'Bulgarian', name: _('Bulgarian'), nativeName: 'Български'
	},
	{
		code: ['pol', 'pl'],
		id: 'Polish', name: _('Polish'), nativeName: 'Polski'
	},
	{
		code: ['rum', 'ron', 'ro'],
		id: 'Romanian', name: _('Romanian'), nativeName: 'Română'
	},
	{
		code: ['gre', 'ell', 'el'],
		id: 'Greek', name: _('Greek'), nativeName: 'Ελληνικά'
	},
	{
		code: ['heb', 'he'],
		id: 'Hebrew', name: _('Hebrew'), nativeName: 'עברית'
	},
	{
		code: ['tur', 'tr'],
		id: 'Turkish', name: _('Turkish'), nativeName: 'Türkçe'
	},
	{
		code: ['dan', 'da'],
		id: 'Danish', name: _('Danish'), nativeName: 'Dansk'
	},
	{
		code: ['ice', 'isl', 'is'],
		id: 'Icelandic', name: _('Icelandic'), nativeName: 'Íslenska'
	},
	{
		code: ['hin', 'hi'],
		id: 'Hindi', name: _('Hindi'), nativeName: ''
	},
	{
		code: ['ben', 'bn'],
		id: 'Bengali', name: _('Bengali'), nativeName: ''
	},
	{
		code: ['ara', 'ar'],
		id: 'Arabic', name: _('Arabic'), nativeName: 'العربية'
	},
	{
		code: ['arm', 'hye', 'hy'],
		id: 'Armenian', name: _('Armenian'), nativeName: 'Հայերեն'
	},
	{
		code: ['geo', 'kat', 'ka'],
		id: 'Georgian', name: _('Georgian'), nativeName: ''
	},
	{
		code: ['aze', 'az'],
		id: 'Azerbaijani', name: _('Azerbaijani'), nativeName: 'Azərbaycanca'
	},
	{
		code: ['bak', 'ba'],
		id: 'Bashkir', name: _('Bashkir'), nativeName: 'Башҡорт'
	},
	{
		code: ['baq', 'eus', 'eu'],
		id: 'Basque', name: _('Basque'), nativeName: 'Euskara'
	},
	{
		code: ['bos', 'bs'],
		id: 'Bosnian', name: _('Bosnian'), nativeName: 'Bosanski'
	},
	{
		code: ['bua'],
		id: 'Buriat', name: _('Buriat'), nativeName: 'Буряад хэлэн'
	},
	{
		code: ['bur', 'mya', 'my'],
		id: 'Burmese', name: _('Burmese'), nativeName: ''
	},
	{
		code: ['che', 'ce'],
		id: 'Chechen', name: _('Chechen'), nativeName: 'Нохчийн'
	},
	{
		code: ['wel', 'cym', 'cy'],
		id: 'Welsh', name: _('Welsh'), nativeName: 'Cymraeg'
	},
	{
		code: ['dzo', 'dz'],
		id: 'Dzongkha', name: _('Dzongkha'), nativeName: ''
	},
	{
		code: ['epo', 'eo'],
		id: 'Esperanto', name: _('Esperanto'), nativeName: ''
	},
	{
		code: ['per', 'fa'],
		id: 'Persian', name: _('Persian'), nativeName: 'فارسی'
	},
	{
		code: ['gle', 'ga'],
		id: 'Irish', name: _('Irish'), nativeName: 'Gaeilge'
	},
	{
		code: ['guj', 'gu'],
		id: 'Gujarati', name: _('Gujarati'), nativeName: ''
	},
	{
		code: ['ind', 'id'],
		id: 'Indonesian', name: _('Indonesian'), nativeName: 'Bahasa Indonesia'
	},
	{
		code: ['ira'],
		id: 'Iranian', name: _('Iranian'), nativeName: ''
	},
	{
		code: ['kas', 'ks'],
		id: 'Kashmiri', name: _('Kashmiri'), nativeName: ''
	},
	{
		code: ['kaz', 'kk'],
		id: 'Kazakh', name: _('Kazakh'), nativeName: 'Қазақша'
	},
	{
		code: ['kbd'],
		id: 'Kabardian', name: _('Kabardian'), nativeName: 'Адыгэбзэ'
	},
	{
		code: ['kom', 'kv'],
		id: 'Komi', name: _('Komi'), nativeName: 'Коми'
	},
	{
		code: ['krl'],
		id: 'Karelian', name: _('Karelian'), nativeName: 'Кarjala'
	},
	{
		code: ['kur', 'ku'],
		id: 'Kurdish', name: _('Kurdish'), nativeName: 'Kurdî, كوردی‎'
	},
	{
		code: ['mar', 'mr'],
		id: 'Marathi', name: _('Marathi'), nativeName: ''
	},
	{
		code: ['mac', 'mkd', 'mk'],
		id: 'Macedonian', name: _('Macedonian'), nativeName: 'Македонски'
	},
	{
		code: ['nep', 'ne'],
		id: 'Nepali', name: _('Nepali'), nativeName: ''
	},
	{
		code: ['oss', 'os'],
		id: 'Ossetian', name: _('Ossetian'), nativeName: 'Иронау'
	},
	{
		code: ['sah'],
		id: 'Yakut', name: _('Yakut'), nativeName: 'Саха тыла'
	},
	{
		code: ['som', 'so'],
		id: 'Somali', name: _('Somali'), nativeName: 'Soomaaliga'
	},
	{
		code: ['tam', 'ta'],
		id: 'Tamil', name: _('Tamil'), nativeName: ''
	},
	{
		code: ['tat', 'tt'],
		id: 'Tatar', name: _('Tatar'), nativeName: 'Tatarça'
	},
	{
		code: ['tel', 'te'],
		id: 'Telugu', name: _('Telugu'), nativeName: ''
	},
	{
		code: ['tgk', 'tg'],
		id: 'Tajik', name: _('Tajik'), nativeName: 'Тоҷикӣ'
	},
	{
		code: ['tha', 'th'],
		id: 'Thai', name: _('Thai'), nativeName: ''
	},
	{
		code: ['tuk', 'tk'],
		id: 'Turkmen', name: _('Turkmen'), nativeName: 'Туркмен'
	},
	{
		code: ['udm'],
		id: 'Udmurt', name: _('Udmurt'), nativeName: 'Удмурт кыл'
	},
	{
		code: ['urd', 'ur'],
		id: 'Urdu', name: _('Urdu'), nativeName: 'اردو'
	},
	{
		code: ['uzb', 'uz'],
		id: 'Uzbek', name: _('Uzbek'), nativeName: 'O‘zbek'
	},
	{
		code: ['xal'],
		id: 'Kalmyk', name: _('Kalmyk'), nativeName: 'Хальмг'
	},
	{
		code: ['tib', 'bod', 'bo'],
		id: 'Tibetan', name: _('Tibetan'), nativeName: ''
	},
	{
		code: ['yid', 'yi'],
		id: 'Yiddish', name: _('Yiddish'), nativeName: 'ייִדיש'
	}
];
