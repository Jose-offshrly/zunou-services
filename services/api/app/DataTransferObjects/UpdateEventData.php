<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Support\Data;
use Illuminate\Support\Carbon;

final class UpdateEventData extends Data
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $summary = null,
        public readonly ?string $description = null,
        public readonly ?string $location = null,
        public readonly ?string $priority = null,
        public readonly ?Carbon $start_at = null,
        public readonly ?Carbon $end_at = null,
        public readonly ?Carbon $date = null,
        public readonly ?array $guests = null,
        public readonly ?array $files = null,
        public readonly ?string $link = null,
        public bool $sync_with_google_calendar = false,
        public readonly bool $hasDescriptionUpdate = false,
        public readonly bool $hasLinkUpdate = false,
    ) {
    }

    public static function fromArray(
        array $data,
        string $timezone = 'UTC',
    ): self {
        $hasDescriptionUpdate = array_key_exists('description', $data);
        $description          = $hasDescriptionUpdate
            ? self::normalizeDescription($data['description'])
            : null;

        $hasLinkUpdate = array_key_exists('link', $data);
        $link          = $hasLinkUpdate ? self::normalizeLink($data['link']) : null;

        return new self(
            name: $data['name']       ?? null,
            summary: $data['summary'] ?? null,
            description: $description,
            location: $data['location'] ?? null,
            priority: $data['priority'] ?? null,
            start_at: isset($data['start_at'])
                ? Carbon::parse($data['start_at'], $timezone)->utc()
                : null,
            end_at: isset($data['end_at'])
                ? Carbon::parse($data['end_at'], $timezone)->utc()
                : null,
            date: isset($data['start_at'])
                ? Carbon::parse($data['start_at'], $timezone)->utc()
                : null,
            guests: $data['guests'] ?? null,
            files: $data['files']   ?? null,
            link: $link,
            sync_with_google_calendar: $data['sync_with_google_calendar'] ?? false,
            hasDescriptionUpdate: $hasDescriptionUpdate,
            hasLinkUpdate: $hasLinkUpdate,
        );
    }

    private static function normalizeDescription(?string $description): ?string
    {
        if ($description === null) {
            return null;
        }

        // Preserve empty strings as empty strings, only trim non-empty strings
        return $description === '' ? '' : trim($description);
    }

    private static function normalizeLink(?string $link): ?string
    {
        if ($link === null) {
            return null;
        }

        // Preserve empty strings as empty strings, only trim non-empty strings
        return $link === '' ? '' : trim($link);
    }

    public function toEventUpdateArray(): array
    {
        $data = [
            'name'     => $this->name,
            'summary'  => $this->summary,
            'location' => $this->location,
            'priority' => $this->priority,
            'start_at' => $this->start_at,
            'end_at'   => $this->end_at,
            'date'     => $this->date,
            'guests'   => $this->guests,
            'files'    => $this->files,
        ];

        // Only include description if it was explicitly provided in the input
        if ($this->hasDescriptionUpdate) {
            $data['description'] = $this->description;
        }

        // Only include link if it was explicitly provided in the input
        if ($this->hasLinkUpdate) {
            $data['link'] = $this->link;
        }

        // Filter out null values except for description and link (we want to explicitly set null when provided)
        return array_filter(
            $data,
            function ($value, $key) {
                if (in_array($key, ['description', 'link'])) {
                    return true; // Always include description and link, even if null or empty string (when explicitly provided)
                }

                return $value !== null;
            },
            ARRAY_FILTER_USE_BOTH,
        );
    }

    public function toGoogleCalendarArray(): array
    {
        $data = [
            'name'        => $this->name,
            'description' => $this->hasDescriptionUpdate
                ? $this->description
                : null,
            'location' => $this->location,
            'start_at' => $this->start_at,
            'end_at'   => $this->end_at,
            'guests'   => $this->guests,
        ];

        // Only include link if it was explicitly provided in the input
        if ($this->hasLinkUpdate) {
            $data['link'] = $this->link;
        }

        // Filter out null values except for description and link (we want to explicitly set null when provided)
        return array_filter(
            $data,
            function ($value, $key) {
                if (in_array($key, ['description', 'link'])) {
                    return true; // Always include description and link, even if null or empty string (when explicitly provided)
                }

                return $value !== null;
            },
            ARRAY_FILTER_USE_BOTH,
        );
    }

    public function hasUpdates(): bool
    {
        return $this->name !== null || $this->summary !== null || $this->hasDescriptionUpdate || $this->location !== null || $this->priority !== null || $this->start_at !== null || $this->end_at !== null || $this->guests !== null || $this->files !== null || $this->hasLinkUpdate;
    }

    public function shouldSyncWithGoogleCalendar(): bool
    {
        return $this->sync_with_google_calendar === true;
    }

    public function hasGoogleCalendarRelevantUpdates(): bool
    {
        return $this->name !== null || $this->summary !== null || $this->hasDescriptionUpdate || $this->location !== null || $this->start_at !== null || $this->end_at !== null || $this->guests !== null || $this->hasLinkUpdate;
    }
}
