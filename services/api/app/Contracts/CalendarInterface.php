<?php

namespace App\Contracts;

use App\DataTransferObjects\ScheduledEventData;
use App\DataTransferObjects\UpdateEventData;
use App\Models\User;

interface CalendarInterface
{
    public function getEvents(array $params = []): array;

    public function createEvent(ScheduledEventData $data): array;

    public function updateEvent(string $eventId, UpdateEventData $data, User $user): bool;

    public function deleteEvent(string $eventId, User $user): bool;
}

