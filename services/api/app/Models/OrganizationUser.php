<?php

namespace App\Models;

use App\Enums\OrganizationUserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class OrganizationUser extends Pivot
{
    use HasFactory;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'organization_users';

    protected $fillable = [
        'job_title',
        'department',
        'profile',
        'organization_id',
        'user_id',
        'role',
        'job_description',
        'responsibilities',
        'status',
    ];

    protected $casts = [
        'responsibilities' => 'array',
    ];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted()
    {
        static::creating(function ($model) {
            $model->id          = (string) Str::orderedUuid();
            $model->invite_code = strtoupper(Str::random(8));
        });
    }

    public function isActive()
    {
        return $this->status === OrganizationUserStatus::Active->value;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeWithName($query, $name)
    {
        return $query->whereHas('user', function ($query) use ($name) {
            $query->where('name', 'ILIKE', "%{$name}%");
        });
    }

    public function scopeWithSearch($query, $search)
    {
        return $query->when($search, function ($q) use ($search) {
            $q->whereHas('user', function ($query) use ($search) {
                $query->where('name', 'ILIKE', "%{$search}%");
            });
        });
    }

    public function getOneToOneAttribute(): ?string
    {
        $authUserId = Auth::id();
        $thisUserId = $this->user_id;

        // Don't return anything if the user is the same as the auth user
        if ($thisUserId === $authUserId) {
            return null;
        }

        $oneToOneMap = $this->getOneToOnePulseMap($authUserId);

        return $oneToOneMap[$thisUserId] ?? null;
    }

    /**
     * @return array<string, string> user_id => pulse_id
     */
    private function getOneToOnePulseMap(string $authUserId): array
    {
        $cacheKey = 'one_to_one_pulse_map_' . $authUserId;

        if (app()->bound($cacheKey)) {
            return app($cacheKey);
        }

        $pulses = Pulse::where('category', 'ONETOONE')
            ->whereHas('members', fn ($q) => $q->where('user_id', $authUserId))
            ->with(['members' => fn ($q) => $q->select('pulse_id', 'user_id')])
            ->get(['id']);

        $map = [];
        foreach ($pulses as $pulse) {
            $otherMember = $pulse->members->firstWhere('user_id', '!=', $authUserId);
            if ($otherMember) {
                $map[$otherMember->user_id] = $pulse->id;
            }
        }

        app()->instance($cacheKey, $map);

        return $map;
    }
}
