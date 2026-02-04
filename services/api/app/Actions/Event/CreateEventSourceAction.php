<?php

declare(strict_types=1);

namespace App\Actions\Event;

use App\Models\EventSource;
use Illuminate\Support\Arr;

class CreateEventSourceAction
{
    public function handle(array $attributes): EventSource
    {
        $payload = [
            'source'    => Arr::get($attributes, 'source'),
            'source_id' => Arr::get($attributes, 'source_id'),
            'user_id'   => Arr::get($attributes, 'user_id'),
            'date'      => Arr::get($attributes, 'date'),
            'data'      => Arr::get($attributes, 'data', []),
        ];

        return EventSource::create($payload);
    }
}


