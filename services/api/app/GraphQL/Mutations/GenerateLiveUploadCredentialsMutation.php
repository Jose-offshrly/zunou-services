<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

final readonly class GenerateLiveUploadCredentialsMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $s3Client = new S3Client([
            'version'     => 'latest',
            'region'      => Config::get('zunou.aws.region'),
            'credentials' => [
                'key'    => Config::get('zunou.aws.key'),
                'secret' => Config::get('zunou.aws.secret'),
            ],
        ]);

        $organizationPath = $this->uuidToFolderPath($args['organizationId']);
        $uploadId         = Str::uuid()->toString();
        $liveUploadPath   = $this->uuidToFolderPath($uploadId);
        $fileExtension    = strtolower($args['fileType']);

        $key = "organizations/{$organizationPath}/live-uploads/{$liveUploadPath}.{$fileExtension}";

        $cmd = $s3Client->getCommand('PutObject', [
            'Bucket' => Config::get('zunou.s3.liveUploads'),
            'Key'    => $key,
            'ACL'    => 'private',
        ]);

        $request = $s3Client->createPresignedRequest($cmd, '+30 minutes');
        $url     = (string) $request->getUri();

        return ['key' => $key, 'url' => $url];
    }

    /**
     * Adds a folder prefix to a UUID, to prevent huge lists in S3
     * Before: 23e3d4ef-0fdd-4760-8be2-51f4f82bd74f
     * After:  /23/e3/23e3d4ef-0fdd-4760-8be2-51f4f82bd74f
     */
    private function uuidToFolderPath(string $uuid): string
    {
        $chunks = str_split(substr($uuid, 0, 8), 2);
        return implode('/', $chunks) . '/' . substr($uuid, 9);
    }
}
