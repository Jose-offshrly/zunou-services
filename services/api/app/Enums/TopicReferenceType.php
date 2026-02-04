<?php

namespace App\Enums;

use App\Models\LiveInsightOutbox;

enum TopicReferenceType: string
{
    case INSIGHTS = 'insights';

    /**
     * Get the model class for this reference type.
     */
    public function getModelClass(): string
    {
        return match ($this) {
            self::INSIGHTS => LiveInsightOutbox::class,
        };
    }
}
