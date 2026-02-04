#!/usr/bin/env php
<?php
use App\Helpers\DocumentParsingHelper;

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

// Step 2: Create and bootstrap a console kernel instance
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

// Bootstrap the application
$kernel->bootstrap();

print DocumentParsingHelper::parseFromFile(
    '/Users/mu.kong/Downloads/kot_manual_admin_pt2.docx'
);

