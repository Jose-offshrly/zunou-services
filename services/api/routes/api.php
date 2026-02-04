<?php

use App\Http\Api\Controllers\BeamsAuthController;
use App\Http\Api\Controllers\FileController;
use App\Http\Api\Controllers\PusherAuthController;
use App\Http\Api\Controllers\TextAgentController;
use App\Http\Controllers\FirefliesWebhookController;
use App\Http\Controllers\GoogleCalendarWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/stream/{data_source}', [FileController::class, 'stream'])->name(
    'file.stream',
);

Route::get('/organization/{organizationId}/logo', [
    FileController::class,
    'organizationLogo',
])->name('organization.logo');

Route::post('/{user}/{api_key}/fireflies/webhook', [
    FirefliesWebhookController::class,
    'handle',
])->name('fireflies.webhook');

Route::post('/google-calendar/webhook', [
    GoogleCalendarWebhookController::class,
    'handle',
])->name('google-calendar.webhook');

Route::middleware('auth:jwt')
    ->post('/broadcast/auth', PusherAuthController::class)
    ->name('broadcast.auth');

Route::middleware('auth:jwt')
    ->get('/pusher/beams-auth', BeamsAuthController::class)
    ->name('beams.auth');

// Text Agent streaming endpoint for AI chat
// OPTIONS preflight is handled by Laravel's CORS middleware (HandleCors)
// but we explicitly define it here to ensure proper routing
Route::options('/v1/text-agent/completion', function () {
    return response('', 200);
})->name('text-agent.options');

Route::middleware('auth:jwt')
    ->post('/v1/text-agent/completion', [TextAgentController::class, 'completion'])
    ->name('text-agent.completion');
