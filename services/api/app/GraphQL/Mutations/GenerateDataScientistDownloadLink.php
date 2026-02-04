<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Organization;
use App\Policies\OrganizationPolicy;
use Aws\S3\S3Client;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;

final readonly class GenerateDataScientistDownloadLink
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        if (! str_starts_with($args['filePath'], '/files/')) {
            throw new Error('The file path is invalid');
        }

        preg_match('/files\/(\d+)/', $args['filePath'], $matches);
        $zunouAiOrgId = $matches[1] ?? null;

        if (! $zunouAiOrgId) {
            throw new Error(
                'The file path does not contain an organization ID',
            );
        }

        $organization = Organization::where(
            'zunou_ai_organization_id',
            $zunouAiOrgId,
        )->first();
        if (! $organization) {
            throw new Error('The organization could not be found');
        }

        $policy = new OrganizationPolicy();
        if (! $policy->view($user, [], $organization)) {
            throw new Error("You don't have permission to access this file");
        }

        $s3Client = new S3Client([
            'version'     => 'latest',
            'region'      => Config::get('zunou.aws.region'),
            'credentials' => [
                'key'    => Config::get('zunou.aws.key'),
                'secret' => Config::get('zunou.aws.secret'),
            ],
        ]);

        $cmd = $s3Client->getCommand('GetObject', [
            'Bucket' => Config::get('zunou.s3.data_scientist_bucket'),
            'Key'    => ltrim($args['filePath'], '/files/'), // Remove the /files/ prefix - it's just for routing.
            'ACL'    => 'private',
        ]);

        $request = $s3Client->createPresignedRequest($cmd, '+30 minutes');
        $url     = (string) $request->getUri();

        return ['url' => $url];
    }
}
