<?php

namespace App\Models;

use App\Observers\TimesheetObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[ObservedBy(TimesheetObserver::class)]
class Timesheet extends BaseModel
{
    protected $fillable = ['user_id', 'checked_in_at', 'checked_out_at'];

    protected $casts = [
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUserId($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeDate($query, $date)
    {
        return $query->when($date, function ($q) use ($date) {
            $q->whereDate(
                'checked_in_at',
                '=',
                \Carbon\Carbon::parse($date)->toDateString()
            );
        });
    }

    public function scopeDateRange($query, $range)
    {
        return $query->when(
            isset($range['from'], $range['to']) &&
                $range['from'] &&
                $range['to'],
            fn($q) => $q->whereBetween('checked_in_at', [
                $range['from'],
                $range['to'],
            ])
        );
    }

    public function getTotalAttribute()
    {
        if (empty($this->checked_in_at) || empty($this->checked_out_at)) {
            return null;
        }
        $in =
            $this->checked_in_at instanceof Carbon
                ? $this->checked_in_at
                : Carbon::parse($this->checked_in_at);
        $out =
            $this->checked_out_at instanceof Carbon
                ? $this->checked_out_at
                : Carbon::parse($this->checked_out_at);

        return round(abs($out->floatDiffInMinutes($in)) / 60, 2);
    }
}
