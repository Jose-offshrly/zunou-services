<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\DataSource;
use Aws\S3\S3Client;
use Illuminate\Support\Facades\Config;

final readonly class GenerateDataSourceDownloadLink
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $dataSource = DataSource::findOrFail($args['dataSourceId']);

        $s3Client = new S3Client([
            'version'     => 'latest',
            'region'      => Config::get('zunou.aws.region'),
            'credentials' => [
                'key'    => Config::get('zunou.aws.key'),
                'secret' => Config::get('zunou.aws.secret'),
            ],
        ]);

        $key = $dataSource->metadata['fileKey'];

        $getObjectArgs = [
            'Bucket' => Config::get('zunou.s3.bucket'),
            'Key'    => $key,
            'ACL'    => 'private',
        ];

        if (isset($args['download']) && $args['download'] === true) {
            $filename  = $dataSource->name ?? $dataSource->metadata['filename'];
            $extension = pathinfo(
                $dataSource->metadata['filename'],
                PATHINFO_EXTENSION,
            );
            $dlFilename                                  = $filename . '.' . $extension;
            $getObjectArgs['ResponseContentDisposition'] = 'attachment; filename="' . $dlFilename . '"';
        }

        $cmd = $s3Client->getCommand('GetObject', $getObjectArgs);

        $request = $s3Client->createPresignedRequest($cmd, '+30 minutes');
        $url     = (string) $request->getUri();

        return ['url' => $url];
    }
}
