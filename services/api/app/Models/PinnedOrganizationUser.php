<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PinnedOrganizationUser extends BaseModel
{
    protected $fillable = [
        'user_id',
        'organization_user_id',
        'organization_id',
        'pinned_at',
    ];

    protected $casts = [
        'pinned_at' => 'datetime',
    ];

    /**
     * Relationship to the user who pinned.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relationship to the organization user being pinned.
     */
    public function organizationUser(): BelongsTo
    {
        return $this->belongsTo(
            OrganizationUser::class,
            'organization_user_id'
        );
    }

    /**
     * Relationship to the organization.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }
}
