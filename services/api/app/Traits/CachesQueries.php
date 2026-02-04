<?php

declare(strict_types=1);

namespace App\Traits;

use App\Services\CacheService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Trait for adding caching capabilities to Eloquent models.
 *
 * Usage:
 *   use App\Traits\CachesQueries;
 *
 *   class MyModel extends Model
 *   {
 *       use CachesQueries;
 *   }
 *
 *   // Then use:
 *   MyModel::cachedFind($id);
 *   MyModel::cachedWhere(['column' => 'value']);
 *   $model->clearCache();
 */
trait CachesQueries
{
    /**
     * Default cache TTL in seconds (5 minutes).
     */
    protected static int $defaultCacheTtl = 300;

    /**
     * Get the cache key prefix for this model.
     */
    protected static function getCacheKeyPrefix(): string
    {
        return strtolower(class_basename(static::class));
    }

    /**
     * Find a model by ID with caching.
     *
     * @param  int|string  $id  The model ID
     * @param  int|null  $ttl  Cache TTL in seconds (null uses default)
     */
    public static function cachedFind(int|string $id, ?int $ttl = null): ?static
    {
        $ttl = $ttl ?? static::$defaultCacheTtl;
        $cacheKey = static::getCacheKeyPrefix().':find:'.$id;

        return Cache::remember($cacheKey, $ttl, fn () => static::find($id));
    }

    /**
     * Find a model by ID with relations, using cache.
     *
     * @param  int|string  $id  The model ID
     * @param  array  $relations  Relations to eager load (key order doesn't matter)
     * @param  int|null  $ttl  Cache TTL in seconds
     */
    public static function cachedFindWith(int|string $id, array $relations, ?int $ttl = null): ?static
    {
        $ttl = $ttl ?? static::$defaultCacheTtl;
        // Use normalized JSON to ensure consistent cache keys regardless of array key order
        $relationsKey = md5(CacheService::normalizeForCacheKey($relations));
        $cacheKey = static::getCacheKeyPrefix().':findWith:'.$id.':'.$relationsKey;

        return Cache::remember($cacheKey, $ttl, fn () => static::with($relations)->find($id));
    }

    /**
     * Get models matching conditions with caching.
     *
     * @param  array  $conditions  Where conditions (key order doesn't matter)
     * @param  int|null  $ttl  Cache TTL in seconds
     */
    public static function cachedWhere(array $conditions, ?int $ttl = null): Collection
    {
        $ttl = $ttl ?? static::$defaultCacheTtl;
        // Use normalized JSON to ensure consistent cache keys regardless of array key order
        $conditionsKey = md5(CacheService::normalizeForCacheKey($conditions));
        $cacheKey = static::getCacheKeyPrefix().':where:'.$conditionsKey;

        return Cache::remember($cacheKey, $ttl, fn () => static::where($conditions)->get());
    }

    /**
     * Get all models with caching.
     *
     * @param  int|null  $ttl  Cache TTL in seconds
     */
    public static function cachedAll(?int $ttl = null): Collection
    {
        $ttl = $ttl ?? static::$defaultCacheTtl;
        $cacheKey = static::getCacheKeyPrefix().':all';

        return Cache::remember($cacheKey, $ttl, fn () => static::all());
    }

    /**
     * Get a count with caching.
     *
     * @param  array  $conditions  Optional where conditions (key order doesn't matter)
     * @param  int|null  $ttl  Cache TTL in seconds
     */
    public static function cachedCount(array $conditions = [], ?int $ttl = null): int
    {
        $ttl = $ttl ?? static::$defaultCacheTtl;
        // Use normalized JSON to ensure consistent cache keys regardless of array key order
        $conditionsKey = md5(CacheService::normalizeForCacheKey($conditions));
        $cacheKey = static::getCacheKeyPrefix().':count:'.$conditionsKey;

        return Cache::remember($cacheKey, $ttl, function () use ($conditions) {
            $query = static::query();
            if (! empty($conditions)) {
                $query->where($conditions);
            }

            return $query->count();
        });
    }

    /**
     * Clear cache for this specific model instance.
     *
     * This clears:
     * - The individual find cache for this model's ID
     * - The 'all' cache (since any change invalidates the complete collection)
     *
     * Note: cachedWhere() and cachedCount() caches cannot be individually invalidated
     * without knowing all condition combinations. These rely on TTL expiration.
     * For immediate invalidation of all caches, use clearAllCache() or Redis with tags.
     */
    public function clearCache(): void
    {
        $prefix = static::getCacheKeyPrefix();

        // Clear the find cache for this ID
        Cache::forget($prefix.':find:'.$this->getKey());

        // Clear the 'all' cache since any model change invalidates the collection
        Cache::forget($prefix.':all');

        // Note: findWith, where, and count caches use hashed conditions that we can't
        // enumerate. For Redis/Memcached, consider using cache tags for pattern-based clearing.
        // For now, those caches rely on TTL expiration.
    }

    /**
     * Clear all known caches for this model type.
     *
     * This clears:
     * - The 'all' cache
     * - Individual find caches cannot be cleared without knowing IDs
     * - where/count caches cannot be cleared without knowing condition hashes
     *
     * For comprehensive cache clearing, use Redis with cache tags.
     */
    public static function clearAllCache(): void
    {
        $prefix = static::getCacheKeyPrefix();

        // Clear the 'all' cache
        Cache::forget($prefix.':all');

        // Note: For more comprehensive cache clearing with patterns,
        // consider using Redis with Cache::tags() or a cache that supports pattern deletion
    }

    /**
     * Boot the trait - automatically clear cache on model changes.
     */
    protected static function bootCachesQueries(): void
    {
        static::saved(function (Model $model) {
            $model->clearCache();
        });

        static::deleted(function (Model $model) {
            $model->clearCache();
        });
    }
}
