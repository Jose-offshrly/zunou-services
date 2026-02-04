<?php

namespace App\GraphQL\Queries;

use App\Models\MonthlySummary;
use Illuminate\Support\Facades\Log;

class MonthlySummaryQuery
{
    public function __invoke($root, array $args)
    {
        $organizationId = $args['organizationId'];
        $pulseId = $args['pulseId'];
        $month = $args['month'];
        $year = $args['year'];

        // Retrieve summary data from the MonthlySummary model
        $monthlySummaryData = MonthlySummary::query()
            ->forOrganization($organizationId)
            ->forPulse($pulseId)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        // If no data is found, return default values instead of throwing an exception
        if (!$monthlySummaryData) {
            Log::info(
                "No summary data found for org: $organizationId, month: $month, year: $year"
            );
            return $this->getDefaultSummaryData();
        }

        // Generate comparison data by passing the current monthly summary data
        $comparisonData = $this->getComparisonData(
            $monthlySummaryData,
            $organizationId,
            $month,
            $year
        );

        // Return the formatted data in the required structure
        return [
            [
                'title' => 'Total Money Saved',
                'value' => $monthlySummaryData->total_money_saved,
                'unit' => '$',
                'comparisonValue' => $comparisonData['moneyComparisonValue'],
                'comparison' => $comparisonData['moneyComparison'],
            ],
            [
                'title' => 'Total Time Saved',
                'value' => $monthlySummaryData->total_time_saved,
                'unit' => 'mins',
                'comparisonValue' => $comparisonData['timeComparisonValue'],
                'comparison' => $comparisonData['timeComparison'],
            ],
            [
                'title' => 'Questions answered',
                'value' => $monthlySummaryData->total_question_count,
                'unit' => null,
                'comparisonValue' =>
                    $comparisonData['questionsComparisonValue'],
                'comparison' => $comparisonData['questionsComparison'],
            ],
            [
                'title' => 'Number of Staff Engaged',
                'value' => $monthlySummaryData->total_user_count,
                'unit' => null,
                'comparisonValue' => $comparisonData['staffComparisonValue'],
                'comparison' => $comparisonData['staffComparison'],
            ],
        ];
    }

    // Helper function to calculate comparison values
    private function getComparisonData(
        $monthlySummaryData,
        $organizationId,
        $month,
        $year
    ) {
        // Get the previous month data for comparison
        $previousMonthData = MonthlySummary::where(
            'organization_id',
            $organizationId
        )
            ->where('month', $month - 1)
            ->where('year', $year)
            ->first();

        if (!$previousMonthData) {
            // If there's no data for the previous month, return default values
            return $this->getDefaultComparisonData();
        }

        // Calculate comparison values
        return [
            'moneyComparisonValue' => abs(
                $monthlySummaryData->total_money_saved -
                    $previousMonthData->total_money_saved
            ),
            'moneyComparison' =>
                $monthlySummaryData->total_money_saved >
                $previousMonthData->total_money_saved
                    ? 'more'
                    : 'less',
            'timeComparisonValue' => abs(
                $monthlySummaryData->total_time_saved -
                    $previousMonthData->total_time_saved
            ),
            'timeComparison' =>
                $monthlySummaryData->total_time_saved >
                $previousMonthData->total_time_saved
                    ? 'more'
                    : 'less',
            'questionsComparisonValue' => abs(
                $monthlySummaryData->total_question_count -
                    $previousMonthData->total_question_count
            ),
            'questionsComparison' =>
                $monthlySummaryData->total_question_count >
                $previousMonthData->total_question_count
                    ? 'more'
                    : 'less',
            'staffComparisonValue' => abs(
                $monthlySummaryData->total_user_count -
                    $previousMonthData->total_user_count
            ),
            'staffComparison' =>
                $monthlySummaryData->total_user_count >
                $previousMonthData->total_user_count
                    ? 'more'
                    : 'less',
        ];
    }

    // Helper function to return default summary data when no records are found
    private function getDefaultSummaryData()
    {
        return [
            [
                'title' => 'Total Money Saved',
                'value' => 0,
                'unit' => '$',
                'comparisonValue' => 0,
                'comparison' => 'same',
            ],
            [
                'title' => 'Total Time Saved',
                'value' => 0,
                'unit' => 'mins',
                'comparisonValue' => 0,
                'comparison' => 'same',
            ],
            [
                'title' => 'Questions answered',
                'value' => 0,
                'unit' => null,
                'comparisonValue' => 0,
                'comparison' => 'same',
            ],
            [
                'title' => 'Number of Staff Engaged',
                'value' => 0,
                'unit' => null,
                'comparisonValue' => 0,
                'comparison' => 'same',
            ],
        ];
    }

    // Helper function to return default comparison data
    private function getDefaultComparisonData()
    {
        return [
            'moneyComparisonValue' => 0,
            'moneyComparison' => 'same',
            'timeComparisonValue' => 0,
            'timeComparison' => 'same',
            'questionsComparisonValue' => 0,
            'questionsComparison' => 'same',
            'staffComparisonValue' => 0,
            'staffComparison' => 'same',
        ];
    }
}
