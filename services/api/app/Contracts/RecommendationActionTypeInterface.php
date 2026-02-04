<?php

namespace App\Contracts;

use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendation;
use App\Models\LiveInsightRecommendationAction;

interface RecommendationActionTypeInterface
{
    const UNSUPPORTED_OPERATION = 'unsupported_operation';
    /**
     * Execute the action (create, update, delete, etc)
     */
    public function execute(LiveInsightRecommendationAction $actio, LiveInsightOutbox $insight): ?array;

    /**
     * Return the classifications supported by this action type.
     *
     * @return array
     */
    public static function getClassifications(): array;

    /**
     * Classify the operation (create/update/delete/etc).
     *
     * @param array $recommendation
     * @return string
     */
    public static function classifyOperation(array $recommendation): string;

    /**
     * Return the allowed tools for an operation classification.
     *
     * @param string $classification
     * @return array
     */
    public static function getAllowedTools(string $classification): array;

    /**
     * Return the prompt for the given classification & recommendation.
     *
     * @param string $classification
     * @param array $recommendation
     * @return string
     */
    public static function getOperationPrompt(string $classification, array $recommendation, LiveInsightOutbox $insight): string;

    /**
     * Return the JSON schema for the given classification.
     *
     * @param string $classification
     * @return array
     */
    public static function getOperationSchema(string $classification): array;

    /**
     * Save the recommendation action (create/update/delete).
     *
     * @param string $method
     * @param LiveInsightRecommendation $recommendation
     * @param mixed $data
     * @return void
     */
    public static function saveRecommendation(string $method, LiveInsightRecommendation $recommendation, LiveInsightOutbox $insight, array $data): void;
}
