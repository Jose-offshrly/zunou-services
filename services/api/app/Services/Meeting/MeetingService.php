<?php

namespace App\Services\Meeting;

use App\Contracts\ActionInterface;
use App\DataTransferObjects\MeetingData;
use App\Models\Meeting;

class MeetingService
{
    private string $driver = 'manual';

    public function getDriver(): string
    {
        return $this->driver;
    }

    public function driver(string $driver): self
    {
        $this->driver = $driver;
        return $this;
    }

    public function create(MeetingData $data): Meeting
    {
        $creatorClass = config("meeting.drivers.{$this->driver}.creator");

        if ($creatorClass === null) {
            throw new \Exception('driver not found');
        }

        /** @var ActionInterface $creator */
        $creator = app($creatorClass);

        return $creator->handle($data);
    }
}
