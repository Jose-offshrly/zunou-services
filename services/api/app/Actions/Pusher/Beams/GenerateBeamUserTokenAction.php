<?php

declare(strict_types=1);

namespace App\Actions\Pusher\Beams;

use App\Facades\Beams;
use App\Models\User;

final class GenerateBeamUserTokenAction
{
    public function handle(User $user): User
    {
        $client = Beams::getClient()->generateToken((string) $user->id);

        $user->pusher_beams_auth_token = $client['token'];
        $user->save();

        return $user;
    }
}
