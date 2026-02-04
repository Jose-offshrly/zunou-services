<?php

use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});


Route::get('/preview-markdown', function () {
    return (new \App\Mail\InterestSentMail());
});

Route::get('/documentation', function () {
    try {
        return response()->file(storage_path('app/docs/index.html'));
    } catch (Exception $e) {
        return $e->getMessage();
    }
});

Route::get('/test-docs', function () {
    $paths = [
        'public_path' => public_path('docs/index.html'),
        'storage_path' => storage_path('app/docs/index.html'),
        'base_path' => base_path('public/docs/index.html'),
    ];

    $debug = [];
    foreach ($paths as $name => $path) {
        $debug[$name] = [
            'path' => $path,
            'exists' => file_exists($path),
            'readable' => is_readable($path),
            'directory_exists' => is_dir(dirname($path)),
        ];

        if (is_dir(dirname($path))) {
            $debug[$name]['directory_contents'] = scandir(dirname($path));
        }
    }

    // Also check if public/docs directory exists and what's in it
    $publicDocsDir = public_path('docs');
    $debug['public_docs_directory'] = [
        'path' => $publicDocsDir,
        'exists' => is_dir($publicDocsDir),
        'contents' => is_dir($publicDocsDir) ? scandir($publicDocsDir) : null,
    ];

    return response()->json($debug, 200);
});

Route::post('/stripe/webhook', [
    StripeWebhookController::class,
    'handleWebhook',
]);