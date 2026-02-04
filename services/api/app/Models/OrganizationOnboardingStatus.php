<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationOnboardingStatus extends Model
{
    protected $table   = 'organization_onboarding_status';
    public $timestamps = true; // Enable timestamps if not already enabled

    protected $fillable = [
        'organization_id',
        'item_id',
        'is_completed',
        'last_asked_at',
        'completed_at',
        'notes',
    ];

    /**
     * Get the organization that owns the onboarding status.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    /**
     * Get the onboarding item associated with the status.
     */
    public function onboardingItem()
    {
        return $this->belongsTo(OnboardingItem::class, 'item_id');
    }
}
