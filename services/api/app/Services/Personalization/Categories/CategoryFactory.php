<?php

namespace App\Services\Personalization\Categories;

use App\Models\Pulse;
use App\Services\Personalization\Categories\MentionCategory;
use App\Services\Personalization\OpenAIPersonalizationService;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class CategoryFactory
{
    /**
     * @var \Illuminate\Support\Collection<\App\Services\Personalization\Categories\Category>
     */
    protected Collection $categories;

    protected OpenAIPersonalizationService $openAIService;

    public function __construct(OpenAIPersonalizationService $openAIService)
    {
        $this->openAIService = $openAIService;
        
        $this->categories = collect([
            MentionCategory::NAME => MentionCategory::class,
        ]);
    }

    public function make(string $category, Pulse $pulse): Category
    {
        if (! $this->categories->has($category)) {
            throw new InvalidArgumentException('Invalid Category');
        }

        $categoryClass = $this->categories->get($category);

        // Handle dependency injection based on category type
        switch ($categoryClass) {
            case MentionCategory::class:
                return new MentionCategory($this->openAIService, $pulse);
            default:
                return new $categoryClass;
        }
    }
}
