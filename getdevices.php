<?php

header('Content-Type: application/json');

// Lookup all devices directories
$dirs = array_filter(glob('*'), 'is_dir');
$devices = array_values($dirs);

// Remove test device if directory exists
if (($key = array_search('test', $devices)) !== false) {
    unset($devices[$key]);
}

// Output the result
$devices = array_reverse($devices);
sort($devices);
echo json_encode($devices);
