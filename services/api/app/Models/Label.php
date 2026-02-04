<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class Label extends BaseModel
{
    /**
     * The notes that belong to the label (many-to-many).
     */
    public function notes()
    {
        return $this->belongsToMany(
            Note::class,
            'label_note',
            'label_id',
            'note_id'
        );
    }

    /**
     * The pulse that owns the label.
     */
    public function pulse()
    {
        return $this->belongsTo(Pulse::class);
    }

    protected $fillable = ['name', 'pulse_id', 'color'];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }
}
