<?php

namespace App\GraphQL\Queries;

use App\Models\MonthlyQuestion;

class MonthlyQuestionsQuery
{
    public function __invoke($root, array $args)
    {
        $organizationId = $args['organizationId'];
        $pulseId = $args['pulseId'];
        $month = $args['month'];
        $year = $args['year'];

        // Fetch the top 10 questions for the specified organization, month, and year
        $questions = MonthlyQuestion::query()
            ->forOrganization($organizationId)
            ->forPulse($pulseId)
            ->where('month', $month)
            ->where('year', $year)
            ->orderBy('rank', 'asc')
            ->limit(10)
            ->get();

        // Return in the expected format
        return $questions->map(function ($question) {
            return [
                'question' => $question->question,
                'rank' => $question->rank,
            ];
        });
    }
}
