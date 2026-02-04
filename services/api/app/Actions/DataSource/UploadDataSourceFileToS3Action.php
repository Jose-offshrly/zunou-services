<?php

namespace App\Actions\DataSource;

use App\Models\DataSource;
use Aws\S3\S3Client;
use Illuminate\Support\Facades\Config;

class UploadDataSourceFileToS3Action
{
    public function handle(
        string $organizationId,
        DataSource $dataSource,
        string $fileName,
        string $tempFilePath,
    ): string {
        // create new instance of the s3 client
        $s3Client = new S3Client([
            'version'     => 'latest',
            'region'      => Config::get('zunou.aws.region'),
            'credentials' => [
                'key'    => Config::get('zunou.aws.key'),
                'secret' => Config::get('zunou.aws.secret'),
            ],
        ]);

        // Define S3 path
        $key = 'organizations/' .
            $this->uuidToFolderPath($organizationId) .
            '/data-sources/' .
            $this->uuidToFolderPath($dataSource->id) .
            '/' .
            $fileName;

        $s3Client->putObject([
            'Bucket'     => Config::get('zunou.s3.bucket'),
            'Key'        => $key,
            'SourceFile' => $tempFilePath,
            'ACL'        => 'private',
        ]);

        //         Delete temporary file
        unlink($tempFilePath);

        return $key;
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
