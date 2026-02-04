<?php

use App\Models\OrganizationUser;
use App\Models\PulseMember;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    public function up(): void
    {
        // Fetch all user_ids where the org role is 'guest'
        $guestUserIds = OrganizationUser::where('role', 'GUEST')->pluck(
            'user_id',
        );

        // Update all matching pulse_members roles to 'guest'
        PulseMember::whereIn('user_id', $guestUserIds)->update([
            'role' => 'GUEST',
        ]);
    }
};
