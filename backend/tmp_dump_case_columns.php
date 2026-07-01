<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\Schema;
$cols = Schema::getColumnListing('case_reports');
echo json_encode($cols, JSON_PRETTY_PRINT) . PHP_EOL;
