<?php

namespace App\GraphQL\Mutations;

use App\Models\LiveUpload;
use App\Models\Organization;
use App\Models\Thread;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

class CreateLiveUploadMutation
{
    public function __invoke(null $_, array $args)
    {
        // Get the currently authenticated user
        $loggedInUser = Auth::user();
        // Check if the userId matches the logged-in user

        if ($loggedInUser->id !== $args['userId']) {
            throw new Error(
                'Unauthorized: You can only upload files for your own account.',
            );
        }

        // Check if the user is part of the organization
        $organization = Organization::find($args['organizationId']);
        if (
            ! $organization || ! $loggedInUser->organizations->contains($organization)
        ) {
            throw new Error(
                'Unauthorized: You do not belong to this organization.',
            );
        }

        // Validate that the thread belongs to the user and organization
        $thread = Thread::where('id', $args['threadId'])
            ->where('organization_id', $args['organizationId'])
            ->where('user_id', $args['userId'])
            ->first();

        if (! $thread) {
            throw new Error(
                'Invalid thread: The thread does not belong to the user or organization.',
            );
        }

        $payload = [
            'file_key'        => $args['fileKey'],
            'organization_id' => $args['organizationId'],
            'thread_id'       => $args['threadId'],
            'user_id'         => $args['userId'],
            'status'          => 'UPLOADED',
        ];

        $liveUpload = LiveUpload::create($payload);

        if (! $liveUpload->id) {
            throw new Error('The live upload could not be created');
        }

        return $liveUpload;
    }
}
