<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DataSource;
use Illuminate\Support\Facades\Storage;

final readonly class DownloadDataSourceQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $dataSource = DataSource::findOrFail($args['dataSourceId']);

        $fileKey = $dataSource->metadata['fileKey'];

        if ($fileKey !== null && Storage::disk('s3')->exists($fileKey)) {
            try {
                $filename = $fileKey;
                if (isset($dataSource->metadata['filename'])) {
                    $filename = $dataSource->metadata['filename'];
                }
                $url = Storage::disk('s3')->temporaryUrl(
                    $fileKey,
                    now()->addMinutes(30),
                    [
                        'ResponseContentDisposition' => 'attachment; filename="' . $filename . '"',
                    ],
                );

                return [
                    'url' => $url,
                ];
            } catch (\Exception $e) {
                throw new \Exception(
                    'Unable to generate download URL: ' . $e->getMessage(),
                );
            }
        }
        throw new \Exception('File not found');
    }
}
