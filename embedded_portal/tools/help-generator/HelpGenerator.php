<?php

define("TEMP_DIR", './tmp');

require_once 'inc/init.php';
require_once DOKU_INC . 'inc/parser/parser.php';
require_once DOKU_INC . 'inc/parser/xhtml.php';

function dump ( $data, $label ) {
	$data = print_r($data, true);
	file_put_contents(TEMP_DIR . '/build.log', ($label ? $label."\n":'') . $data . "\n", FILE_APPEND);
}

function delTree($dir) { 
	$files = array_diff(scandir($dir), array('.','..'));
	foreach ($files as $file) { 
		(is_dir("$dir/$file")) ? delTree("$dir/$file") : unlink("$dir/$file"); 
	} 
	return rmdir($dir); 
}

function Zip($source, $destination)
{
	if (!extension_loaded('zip') || !file_exists($source)) {
		return false;
	}

	$zip = new ZipArchive();
	if (!$zip->open($destination, ZIPARCHIVE::CREATE)) {
		return false;
	}

	$source = str_replace('\\', '/', realpath($source));

	if (is_dir($source) === true)
	{
		$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($source), RecursiveIteratorIterator::SELF_FIRST);

		foreach ($files as $file)
		{
			$file = str_replace('\\', '/', $file);

			// Ignore "." and ".." folders
			if( in_array(substr($file, strrpos($file, '/')+1), array('.', '..')) )
				continue;

			$file = realpath($file);

			if (is_dir($file) === true)
			{
				$zip->addEmptyDir(str_replace($source . '/', '', $file . '/'));
			}
			else if (is_file($file) === true)
			{
				$zip->addFromString(str_replace($source . '/', '', $file), file_get_contents($file));
			}
		}
	}
	else if (is_file($source) === true)
	{
		$zip->addFromString(basename($source), file_get_contents($source));
	}

	return $zip->close();
}

class HelpGenerator{
	function __construct($config){
		$this->config = $config;
		$this->help_dir = TEMP_DIR."/help";
		$this->pages_dir = $this->config['savedir']."/pages";
	}

	function parseFile($dir, $name){
		$pages = array();
		if (is_dir($dir.'/'.$name) && is_file($file = $dir.'/'.$name.'.txt')){
			if ($file = fopen($file,'r')){
				while(!feof($file)) {
					$line = fgets($file);
					//if ($res = preg_match_all('/\|\s*\[\[.+\]\]\s*\|\s*\[\[.+:(\w+)\s*\|\s*(.*)\s*\]\]\s*\|\s*(.+)\s*\|/', $line, $media)){
					if ($res = preg_match_all('/\|.*{{.+}}.*\|\s*\[\[.+:(\w+)\s*\|\s*(.*)\s*\]\]\s*\|\s*(.+)\s*\|/', $line, $media)){
						$page = array(
							"key" => trim($media[1][0]),
							"title" => trim($media[2][0]),
							"annotation" => trim($media[3][0])
						);
						if (is_dir($dir.'/'.$name.'/'.$page["key"])){
							$page['data'] = $this->parseFile($dir.'/'.$name, $page["key"]);
						}
						$pages[] = $page;
					}
				}
				fclose($file);
			}
		}
		return $pages;
	}

	function renderFile($file){
		$this->parser = & new Doku_Parser();
		$this->parser->Handler = & new Doku_Handler();

		$this->parser->addMode('listblock',new Doku_Parser_Mode_ListBlock());
		$this->parser->addMode('preformatted',new Doku_Parser_Mode_Preformatted());
		$this->parser->addMode('notoc',new Doku_Parser_Mode_NoToc());
		$this->parser->addMode('header',new Doku_Parser_Mode_Header());
		$this->parser->addMode('table',new Doku_Parser_Mode_Table());

		$formats = array (
			'strong', 'emphasis', 'underline', 'monospace',
			'subscript', 'superscript', 'deleted',
		);

		foreach ( $formats as $format ) {
			$this->parser->addMode($format,new Doku_Parser_Mode_Formatting($format));
		}

		$this->parser->addMode('linebreak',new Doku_Parser_Mode_Linebreak());
		$this->parser->addMode('footnote',new Doku_Parser_Mode_Footnote());
		$this->parser->addMode('hr',new Doku_Parser_Mode_HR());

		$this->parser->addMode('internallink',new Doku_Parser_Mode_InternalLink());
		$this->parser->addMode('externallink',new Doku_Parser_Mode_ExternalLink());

		$this->parser->addMode('unformatted',new Doku_Parser_Mode_Unformatted());
		$this->parser->addMode('code',new Doku_Parser_Mode_Code());
		$this->parser->addMode('file',new Doku_Parser_Mode_File());
		$this->parser->addMode('quote',new Doku_Parser_Mode_Quote());

		$this->parser->addMode('multiplyentity',new Doku_Parser_Mode_MultiplyEntity());
		$this->parser->addMode('quotes',new Doku_Parser_Mode_Quotes());
		$this->parser->addMode('media',new Doku_Parser_Mode_Media());
		$this->parser->addMode('eol',new Doku_Parser_Mode_Eol());
		$doc = file_get_contents($file);
		$instructions = $this->parser->parse($doc);
		$Renderer = & new Doku_Renderer_XHTML();
		foreach ( $instructions as $instruction ) {
			call_user_func_array(array(&$Renderer, $instruction[0]),$instruction[1]);
		}
		return $Renderer->doc;
	}

	function updateImages($html, $path){
		$level = substr_count($path, "/");
		if ($_GET['relative_path']){
			$client_path = $_GET['relative_path'].'/'.$path.'/';
		}
		for ($i=0, $relative = ""; $i < $level; $i++) { 
			$relative .= "../";
		}
		//if ($res = preg_match_all('/<img.*src=[\'"]{1}([^\'"]*[:|=]([^\'"]*))[\'"]{1}.*\/>?/i', $html, $media)){
		if ($res = preg_match_all('/<img[^>]*src=[\'"]{1}([^\'"]*[:|=]([^\'"]*))[\'"]{1}[^>]*\/>?/i', $html, $media)){
			foreach ($media[1] as $key => $src) {
				$image_url = $relative.'images/'.$media[2][$key];
				$html = str_replace($src, $client_path.$image_url, $html);
				file_put_contents($this->help_dir.'/'.$path.'/'.$image_url, file_get_contents("http://".$_SERVER['HTTP_HOST'].$src));
			}
		}
		return $html;
	}

	function generatePart($pages, $path, $relative){
		foreach ($pages as $page) {
			$part = $relative ? $relative.'/'.$page['key'] : $page['key'];
			if ($page['data']){
				mkdir($this->help_dir.'/'.$path.'/'.$part, 0777, true);
				$this->generatePart($page['data'], $path, $part);
			}else{
				$html = $this->renderFile($this->pages_dir.'/'.$path.'/'.$this->config['start'].'/'.$part.'.txt');
				$html = $this->updateImages($html, $path.'/'.$relative);
				file_put_contents($this->help_dir.'/'.$path.'/'.$part.'.html', $html);
			}
		}
	}

	function prepareTmp(){
		delTree(TEMP_DIR);
		mkdir($this->help_dir, 0777, true);
	}

	function generate(){
		$languages = explode(" ", $this->config['plugin']['translation']['translations']);
		//dump($languages);
		$pages = array();
		foreach ($languages as $language) {
			if (is_dir($directory = $this->pages_dir.'/'.$language)){
				//dump($language);
				$pages = $this->parseFile($directory, $this->config['start']);
				//dump($pages);
				mkdir($this->help_dir.'/'.$language.'/images', 0777, true);
				$this->generatePart($pages, $language, '');
				file_put_contents($this->help_dir.'/'.$language.'/pages.json', json_encode($pages));
			}
		}
	}

	function createArchive($zip){
		Zip($this->help_dir, $zip);
	}

	function redirectToZip($zip){
		header("HTTP/1.1 200 OK");
		header("Location: $zip");
	}
}

$Generator = new HelpGenerator($conf);
$Generator->prepareTmp();
$Generator->generate();

$zip = TEMP_DIR.'/help.zip';
$Generator->createArchive($zip);
$Generator->redirectToZip($zip);
