<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class AiAgent extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'pulse_id',
        'organization_id',
        'name',
        'description',
        'icon',
        'guidelines',
        'agent_type',
        'credentials',
    ];

    protected $casts = [
        'credentials' => 'encrypted:array',
    ];

    public function pulse()
    {
        return $this->belongsTo(Pulse::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
