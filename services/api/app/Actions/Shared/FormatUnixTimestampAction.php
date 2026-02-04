<?php

namespace App\Actions\Shared;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FormatUnixTimestampAction
{
    /**
     * @throws \Exception
     */
    public function handle(string $unixTimestamp): string
    {
        try {
            return Carbon::createFromTimestampMs($unixTimestamp)->format(
                'Y-m-d H:i:s',
            );
        } catch (\Exception $exception) {
            Log::error('Date format error: ' . $exception->getMessage());
        }
    }
}
