<?php

namespace App\Concerns;

use App\Models\DataSource;
use App\Services\FirefliesMeetingProcessorService;

trait DataSourceHandler
{
    private function updateDataSourceMetaData(
        DataSource $dataSource,
        string $s3Path,
        string $fileName,
    ): DataSource {
        // Set metadata with filename and file path before upserting chunks
        $dataSource->metadata = array_merge($dataSource->metadata ?? [], [
            'fileKey'  => $s3Path,
            'filename' => $fileName,
        ]);

        $dataSource->save();

        return $dataSource->refresh();
    }

    private function generateDataSourceSummary(
        DataSource $dataSource,
        string $summaryRawText,
        ?string $pulseId = null,
    ): void {
        $firefliesProcessorService = new FirefliesMeetingProcessorService();
        $generatedAISummary        = $firefliesProcessorService->generateSummaryInMarkdownFormat(
            $summaryRawText,
            $pulseId,
        );

        $decodedAISummary = json_decode($generatedAISummary, true);
        $sentiment        = $decodedAISummary['sentiment'] ?? null;
        $tldr             = $decodedAISummary['tldr']      ?? null;
        $keyterms         = $decodedAISummary['keywords'] ?? null;

        unset($decodedAISummary['sentiment']);
        unset($decodedAISummary['tldr']);

        $generatedAISummary = json_encode($decodedAISummary);

        $dataSource->summary   = $generatedAISummary;
        $dataSource->sentiment = $sentiment;
        $dataSource->tldr      = $tldr;
        $dataSource->keyterms  = $keyterms;

        $dataSource->save();
    }
}
