<?php

namespace App\Actions\Summary;

use App\DataTransferObjects\SummaryData;
use App\Models\Summary;

class UpdateSummaryAction
{
    public function handle(SummaryData $data, Summary $summary): Summary
    {
        $summary->update([
            'summary' => $data->summary,
            'name'    => $data->name,
        ]);

        return $summary->refresh();
    }
}
