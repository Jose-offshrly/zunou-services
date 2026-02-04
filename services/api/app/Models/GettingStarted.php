<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GettingStarted extends Model
{
    use HasFactory;

    protected $table = 'getting_started';

    protected $fillable = ['organization_id', 'pulse_id', 'question', 'status'];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function pulse()
    {
        return $this->belongsTo(Pulse::class);
    }
}
