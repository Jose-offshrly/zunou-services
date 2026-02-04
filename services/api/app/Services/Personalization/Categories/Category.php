<?php

namespace App\Services\Personalization\Categories;

use App\Services\Personalization\Traits\PersonalizationContextManager;

abstract class Category
{
    use PersonalizationContextManager;

    public const NAME = '';

    protected string $content;

    protected $personalizationSource;

    public function setContent(string $content)
    {
        $this->content = $content;
    }

    public function setPersonalizationSource($personalizationSource)
    {
        $this->personalizationSource = $personalizationSource;
    }

    public function updatePersonalizationSourceTimestamp(): void
    {
        $this->personalizationSource->update([
            'last_used_at' => now(),
        ]);
    }

    public function shouldSkipProcessing(): bool
    {
        // Check if content is empty or only whitespace
        if (empty(trim($this->content))) {
            return true;
        }

        // Check if PersonalizationSource is set
        if (! isset($this->personalizationSource)) {
            return true;
        }

        // Check if PersonalizationSource has a valid user through its source
        $user = null;
        
        if ($this->personalizationSource->source) {
            $user = $this->personalizationSource->source->user ?? null;
        }
        
        if (! $user) {
            return true;
        }

        return false;
    }

    abstract public function apply(): void;
}
