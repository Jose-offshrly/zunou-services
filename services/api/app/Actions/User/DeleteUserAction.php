<?php

namespace App\Actions\User;

use App\Mail\UserDeletedMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class DeleteUserAction
{
    public function handle(User $user): bool
    {
        // Mark the user as requesting deletion instead of actually deleting
        $updated = $user->update([
            'request_delete_at' => now(),
        ]);

        if ($updated) {
            Mail::to($user->email)->queue(new UserDeletedMail($user->name, $user->email));
        }

        return $updated;
    }
}

