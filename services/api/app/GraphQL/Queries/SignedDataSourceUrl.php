<?php

namespace App\GraphQL\Queries;

use App\Models\DataSource;
use Aws\S3\S3Client;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

final readonly class SignedDataSourceUrl
{
    public function __invoke($root, array $args): array
    {
        $user = Auth::user();
        if (! $user) {
            throw new error('No user was found');
        }

        $data_source = DataSource::findOrFail($args['dataSourceId']);

        // Ensure the fileKey exists in the metadata
        if (! isset($data_source->metadata['fileKey'])) {
            throw new error('File key missing in metadata');
        }

        $s3Client = new S3Client([
            'version'     => 'latest',
            'region'      => Config::get('zunou.aws.region'),
            'credentials' => [
                'key'    => Config::get('zunou.aws.key'),
                'secret' => Config::get('zunou.aws.secret'),
            ],
        ]);

        $key = $data_source->metadata['fileKey'];
        $cmd = $s3Client->getCommand('GetObject', [
            'Bucket' => Config::get('zunou.s3.bucket'),
            'Key'    => $key,
            'ACL'    => 'private',
        ]);

        $request = $s3Client->createPresignedRequest($cmd, '+30 minutes');
        $url     = (string) $request->getUri();

        return [
            'mime' => $data_source->type,
            'url'  => $url,
        ];
    }
}
