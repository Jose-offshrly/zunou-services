<?php

namespace App\Actions;

use App\DataTransferObjects\RegistrationData;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RegisterUserAction
{
    public function handle(RegistrationData $data): User
    {
        $user = User::firstOrCreate(
            ['email' => $data->email],
            ['name' => $data->name, 'password' => Hash::make($data->password)],
        );

        return $user->refresh();
    }
}
