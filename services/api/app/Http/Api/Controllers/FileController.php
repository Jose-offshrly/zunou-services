<?php

namespace App\Http\Api\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DataSource;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    public function stream(
        DataSource $data_source,
    ): JsonResponse|StreamedResponse {
        // Validate the signed URL
        if (! request()->hasValidSignature()) {
            abort(
                403,
                'The link you tried to access has expired or is no longer available.',
            );
        }

        if (! isset($data_source->metadata['fileKey'])) {
            return response()->json(
                ['error' => 'Data source or file key not found'],
                404,
            );
        }

        try {
            $s3 = Storage::disk('s3');

            // Stream the file
            $stream   = $s3->readStream($data_source->metadata['fileKey']);
            $mimeType = $s3->mimeType($data_source->metadata['fileKey']);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to retrieve the file'],
                500,
            );
        }

        return new StreamedResponse(
            function () use ($stream) {
                fpassthru($stream);
            },
            200,
            [
                'Content-Type'        => $mimeType,
                'Cache-Control'       => 'no-cache',
                'Content-Disposition' => 'inline', // This tells the browser to stream instead of downloading
            ],
        );
    }

    public function organizationLogo(string $organizationId)
    {
        $organization = Organization::find($organizationId);
        $metadata     = $organization?->metadata ?? [];
        $fileKey      = $metadata['fileKey']     ?? null;

        if (! $fileKey) {
            return response()->json(['error' => 'Logo not found'], 404);
        }

        try {
            $s3       = Storage::disk('s3');
            $stream   = $s3->readStream($fileKey);
            $mimeType = $s3->mimeType($fileKey);
        } catch (\Exception $e) {
            return response()->json(
                ['error' => 'Failed to retrieve the logo'],
                500,
            );
        }

        return new StreamedResponse(
            function () use ($stream) {
                fpassthru($stream);
            },
            200,
            [
                'Content-Type'        => $mimeType,
                'Cache-Control'       => 'no-cache',
                'Content-Disposition' => 'inline; filename="logo"',
            ],
        );
    }
}
