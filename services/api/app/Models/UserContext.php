<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UserContext extends Model
{
    use HasFactory;

    protected $table = 'user_context'; // Define custom table name

    // Set the primary key to 'id' and specify that it is a UUID
    protected $primaryKey = 'id';
    public $incrementing  = false; // Disable auto-incrementing
    protected $keyType    = 'uuid'; // Set key type to UUID

    // Specify fillable attributes for mass assignment
    protected $fillable = ['user_id', 'context_data'];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::orderedUuid();
        });
    }

    // Define the relationship to the User model (if applicable)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
