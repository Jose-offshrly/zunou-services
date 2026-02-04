<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

final readonly class NotificationSoundUrlQuery
{
    /**
     * @param mixed $rootValue
     * @param array<string, mixed> $args
     * @return string
     */
    public function __invoke(mixed $rootValue, array $args): string
    {
        $localPath   = public_path('notification.mp3');
        $localUrl    = url('notification.mp3');
        $fallbackUrl = 'https://osjerome.github.io/zunou-sounds/docs/notification.mp3';

        return file_exists($localPath) ? $localUrl : $fallbackUrl;
    }
}
