<?php

namespace App\GraphQL\Queries;

use App\Models\Organization;
use Illuminate\Support\Facades\Storage;

class OrganizationLogoQuery
{
    public function __invoke($root, array $args)
    {
        $organization = Organization::findOrFail($args['organizationId']);
        $metadata     = $organization->metadata ?? [];
        $fileKey      = $metadata['fileKey']    ?? null;
        $fileName     = $metadata['fileName']   ?? null;

        if (! $fileKey) {
            return ['url' => null, 'fileName' => null];
        }

        $url = Storage::disk('s3')->temporaryUrl(
            $fileKey,
            now()->addMinutes(5),
        );

        return [
            'url'      => $url,
            'fileName' => $fileName,
        ];
    }
}
