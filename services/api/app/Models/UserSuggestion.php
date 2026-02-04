<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSuggestion extends Model
{
    use HasFactory;

    protected $table = 'user_suggestions';

    protected $fillable = [
        'id',
        'pulse_id',
        'organization_id',
        'user_id',
        'suggestion',
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    public function pulse()
    {
        return $this->belongsTo(Pulse::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
