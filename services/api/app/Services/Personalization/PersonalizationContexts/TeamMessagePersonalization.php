<?php

namespace App\Services\Personalization\PersonalizationContexts;

use App\Models\PersonalizationSource;
use App\Services\Personalization\Categories\CategoryFactory;
use App\Services\Personalization\Categories\MentionCategory;
use Illuminate\Support\Collection;

class TeamMessagePersonalization
{
    protected CategoryFactory $categoryFactory;
    
    public function __construct()
    {
        $this->categoryFactory = app(CategoryFactory::class);
    }

    public function categories()
    {
        return [
            MentionCategory::NAME,
        ];
    }

    public function applyCategories(Collection $sources)
    {
        $sources->each(function (PersonalizationSource $source) {
            $teamMessage = $source->source;
            $pulse = $teamMessage?->teamThread?->pulse;

            if (!$pulse) {
                return;
            }

            foreach ($this->categories() as $categoryName) {
                $category = $this->categoryFactory->make($categoryName, $pulse);

                $category->setContent(
                    "Sender: {$teamMessage->user->name}. Message: $teamMessage->content"  
                );

                $category->setPersonalizationSource($source);
                $category->apply();
            }
        });
    }
}