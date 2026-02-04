<?php

declare(strict_types=1);

namespace App\GraphQL\Resolvers;

use App\Models\LiveInsightRecommendation;

/**
 * Custom GraphQL field resolver that scope the recommmendation actions for logged in user only
 */
class RecommendationActionResolver
{
    /**
     * Return actions ONLY for the authenticated user.
     */
    public function actionsForUser(LiveInsightRecommendation $recommendation, array $args)
    {
        // Reuse your existing Laravel relationship
        return $recommendation->actionForUser()->get();
    }
}