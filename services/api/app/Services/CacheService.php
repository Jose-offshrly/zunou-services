<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Centralized cache management for app-level and Lighthouse GraphQL caches.
 */
class CacheService
{
    /**
     * Cache TTL constants (in seconds).
     */
    public const TTL_SHORT = 60;         // 1 minute
    public const TTL_MEDIUM = 300;       // 5 minutes
    public const TTL_LONG = 600;         // 10 minutes
    public const TTL_VERY_LONG = 3600;   // 1 hour
    public const TTL_DAY = 86400;        // 24 hours

    /**
     * Cache key prefixes for different domains.
     */
    public const PREFIX_USER = 'user';
    public const PREFIX_ORG = 'org';
    public const PREFIX_PULSE = 'pulse';
    public const PREFIX_QUERY = 'query';

    /**
     * Lighthouse cache tag prefix (matches Lighthouse internals).
     */
    private const LIGHTHOUSE_TAG_PREFIX = 'lighthouse';

    /**
     * Sort array keys recursively for consistent cache key generation.
     */
    public static function normalizeForCacheKey(array $data): string
    {
        $normalized = self::recursiveKsort($data);

        return json_encode($normalized, JSON_THROW_ON_ERROR);
    }

    private static function recursiveKsort(mixed $data): mixed
    {
        if (! is_array($data)) {
            return $data;
        }

        // Check if it's an associative array
        if (array_keys($data) !== range(0, count($data) - 1)) {
            ksort($data);
        }

        // Recursively sort nested arrays
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = self::recursiveKsort($value);
            }
        }

        return $data;
    }

    /**
     * Build a cache key from components.
     *
     * @param  string  $prefix  The cache key prefix
     * @param  mixed  ...$parts  Additional key parts
     */
    public static function key(string $prefix, mixed ...$parts): string
    {
        $parts = array_map(fn ($part) => (string) $part, $parts);

        return implode(':', array_merge([$prefix], $parts));
    }

    /**
     * Cache a value with automatic key generation.
     *
     * @param  string  $prefix  Key prefix
     * @param  array  $identifiers  Unique identifiers for the cache entry
     * @param  int  $ttl  Time to live in seconds
     * @param  callable  $callback  Function to generate value if not cached
     */
    public static function remember(
        string $prefix,
        array $identifiers,
        int $ttl,
        callable $callback
    ): mixed {
        $key = self::key($prefix, ...array_values($identifiers));

        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Forget a cached value.
     *
     * @param  string  $prefix  Key prefix
     * @param  mixed  ...$parts  Additional key parts
     */
    public static function forget(string $prefix, mixed ...$parts): bool
    {
        $key = self::key($prefix, ...$parts);

        return Cache::forget($key);
    }

    /**
     * Clear all user-related caches.
     */
    public static function clearUserCaches(string $userId): void
    {
        $keysToForget = [
            self::key(self::PREFIX_USER, $userId, 'organization-ids'),
            self::key(self::PREFIX_USER, $userId, 'pulse-ids'),
            "pinned_organization_user_ids_{$userId}",
        ];

        foreach ($keysToForget as $key) {
            Cache::forget($key);
        }

        Log::debug('CacheService: cleared user caches', ['user_id' => $userId]);
    }

    /**
     * Clear all organization-related caches.
     */
    public static function clearOrganizationCaches(string $organizationId): void
    {
        $keysToForget = [
            self::key(self::PREFIX_ORG, $organizationId, 'settings'),
            self::key(self::PREFIX_ORG, $organizationId, 'members'),
        ];

        foreach ($keysToForget as $key) {
            Cache::forget($key);
        }

        Log::debug('CacheService: cleared organization caches', ['organization_id' => $organizationId]);
    }

    /**
     * Clear all pulse-related caches.
     */
    public static function clearPulseCaches(string $pulseId): void
    {
        $keysToForget = [
            self::key(self::PREFIX_PULSE, $pulseId, 'members'),
            self::key(self::PREFIX_PULSE, $pulseId, 'labels'),
            "labels:pulse:{$pulseId}",
        ];

        foreach ($keysToForget as $key) {
            Cache::forget($key);
        }

        Log::debug('CacheService: cleared pulse caches', ['pulse_id' => $pulseId]);
    }

    /**
     * Cache a GraphQL query result.
     *
     * @param  string  $queryName  The GraphQL query name
     * @param  array  $args  Query arguments (key order doesn't matter - normalized for consistent hashing)
     * @param  int  $ttl  Time to live in seconds
     * @param  callable  $callback  Function to execute the query
     */
    public static function cacheQuery(
        string $queryName,
        array $args,
        int $ttl,
        callable $callback
    ): mixed {
        // Use normalized JSON to ensure consistent cache keys regardless of key order
        $argsHash = md5(self::normalizeForCacheKey($args));
        $key = self::key(self::PREFIX_QUERY, $queryName, $argsHash);

        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Check if caching is enabled for the current environment.
     */
    public static function isEnabled(): bool
    {
        // Disable caching in testing environment
        if (app()->environment('testing')) {
            return false;
        }

        return config('cache.default') !== 'array';
    }

    /**
     * Get cache statistics (for debugging).
     *
     * @return array Cache driver info
     */
    public static function getStats(): array
    {
        return [
            'driver' => config('cache.default'),
            'prefix' => config('cache.prefix'),
            'supports_tags' => self::supportsCacheTags(),
            'lighthouse_tags_enabled' => config('lighthouse.cache_directive_tags', false),
        ];
    }

    /**
     * Check if the current cache driver supports tags.
     * Only Redis and Memcached support cache tags.
     */
    public static function supportsCacheTags(): bool
    {
        $driver = config('cache.default');

        return in_array($driver, ['redis', 'memcached'], true);
    }

    /**
     * Check if Lighthouse cache tags are enabled and supported.
     */
    public static function lighthouseTagsEnabled(): bool
    {
        return self::supportsCacheTags() && config('lighthouse.cache_directive_tags', false);
    }

    /**
     * Clear Lighthouse GraphQL cache for a specific entity.
     * Tag format: "lighthouse:{TypeName}:{id}"
     */
    public static function clearLighthouseCache(string $typeName, string|int $id): void
    {
        if (! self::lighthouseTagsEnabled()) {
            return;
        }

        try {
            $tag = self::LIGHTHOUSE_TAG_PREFIX.':'.$typeName.':'.$id;
            Cache::tags([$tag])->flush();
        } catch (\Exception $e) {
            Log::warning('Failed to clear Lighthouse cache', [
                'type' => $typeName,
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Clear Lighthouse cache for a specific field.
     * Tag format: "lighthouse:{TypeName}:{id}:{fieldName}"
     */
    public static function clearLighthouseFieldCache(string $typeName, string|int $id, string $fieldName): void
    {
        if (! self::lighthouseTagsEnabled()) {
            return;
        }

        try {
            $tag = self::LIGHTHOUSE_TAG_PREFIX.':'.$typeName.':'.$id.':'.$fieldName;
            Cache::tags([$tag])->flush();
        } catch (\Exception $e) {
            Log::warning('Failed to clear Lighthouse field cache', [
                'type' => $typeName,
                'id' => $id,
                'field' => $fieldName,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @deprecated Use clearLighthouseCache() with entity ID instead.
     */
    public static function clearLighthouseTypeCache(string $typeName): void
    {
        // No-op: Lighthouse requires entity ID for cache clearing
    }

    /**
     * @deprecated Use clearLighthouseCache('User', $userId) instead.
     */
    public static function clearLighthouseUserCache(string $userId): void
    {
        self::clearLighthouseCache('User', $userId);
    }

    /**
     * Clear ALL Lighthouse caches. Use sparingly.
     */
    public static function clearAllLighthouseCache(): void
    {
        if (! self::lighthouseTagsEnabled()) {
            return;
        }

        try {
            Cache::tags([self::LIGHTHOUSE_TAG_PREFIX])->flush();
        } catch (\Exception $e) {
            Log::warning('Failed to clear all Lighthouse caches', ['error' => $e->getMessage()]);
        }
    }
}
