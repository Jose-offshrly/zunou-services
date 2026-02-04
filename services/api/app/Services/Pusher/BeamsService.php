<?php

namespace App\Services\Pusher;

use InvalidArgumentException;
use Pusher\PushNotifications\PushNotifications;

class BeamsService
{
    private bool $enabled;
    private string $instanceId;
    private string $secretKey;
    private string $interestPrefix;
    private ?PushNotifications $client = null;

    public function __construct(
        bool $enabled,
        string $instanceId,
        string $secretKey,
        string $interestPrefix = '',
    ) {
        $this->enabled        = $enabled;
        $this->instanceId     = $instanceId;
        $this->secretKey      = $secretKey;
        $this->interestPrefix = $interestPrefix;
    }

    public function isEnabled(): bool
    {
        return $this->enabled && $this->instanceId !== '' && $this->secretKey !== '';
    }

    public function getClient(): PushNotifications
    {
        if ($this->client === null) {
            if (! $this->isEnabled()) {
                throw new InvalidArgumentException('Pusher Beams is not configured or disabled.');
            }

            $this->client = new PushNotifications([
                'instanceId' => $this->instanceId,
                'secretKey'  => $this->secretKey,
            ]);
        }

        return $this->client;
    }

    public function publishToInterests(array $interests, array $payload): string
    {
        if (! $this->isEnabled()) {
            return '';
        }

        $normalized = $this->applyInterestPrefix($interests);
        $response   = $this->getClient()->publishToInterests($normalized, $payload);
        return $response->publishId ?? '';
    }

    public function publishToUsers(array $userIds, array $payload): string
    {
        if (! $this->isEnabled()) {
            return '';
        }

        try {
            \Log::info('Publishing to Pusher Beams users', [
                'user_ids' => $userIds,
                'payload_keys' => array_keys($payload),
            ]);

            $response = $this->getClient()->publishToUsers($userIds, $payload);
            
            \Log::info('Pusher Beams publish response', [
                'publish_id' => $response->publishId ?? null,
                'user_ids' => $userIds,
            ]);

            return $response->publishId ?? '';
        } catch (\Exception $e) {
            \Log::error('Pusher Beams publish error', [
                'error' => $e->getMessage(),
                'user_ids' => $userIds,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function deleteUser(string $userId): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        $this->getClient()->deleteUser($userId);
    }

    private function applyInterestPrefix(array $interests): array
    {
        $sanitizedInterests = array_values(array_filter(array_map(function ($interest) {
            $interestString = (string) $interest;
            $interestString = $this->sanitizeInterest($interestString);
            return $interestString !== '' ? $interestString : null;
        }, $interests)));

        if ($this->interestPrefix === '') {
            return $sanitizedInterests;
        }

        $prefix = $this->sanitizeInterest($this->interestPrefix);

        return array_map(function ($interest) use ($prefix) {
            // Use '.' as separator; ':' is forbidden by Beams
            return trim($prefix, '.-') . '.' . trim($interest, '.-');
        }, $sanitizedInterests);
    }

    private function sanitizeInterest(string $interest): string
    {
        // Allowed: ASCII letters/numbers or one of _=@,.;-
        $interest = preg_replace('/[^A-Za-z0-9_=@,.;\-]/', '-', $interest) ?? '';
        // Collapse consecutive separators
        $interest = preg_replace('/[\.-]{2,}/', '-', $interest) ?? '';
        // Trim leading/trailing separators
        $interest = trim($interest, '.-');
        // Enforce reasonable max length (Beams allows up to 164 chars)
        if (strlen($interest) > 164) {
            $interest = substr($interest, 0, 164);
        }
        return $interest;
    }
}
