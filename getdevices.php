<?php

$dirs = array_filter(glob('*'), 'is_dir');
$devices = array_values($dirs);

// Remove test device if directory exists
if (($key = array_search('test', $devices)) !== false) {
    unset($devices[$key]);
}

$devices = array_reverse($devices);
sort($devices);

// Output the result
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
echo json_encode($devices);
