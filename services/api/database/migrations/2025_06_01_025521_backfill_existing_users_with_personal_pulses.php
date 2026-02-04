<?php

use App\Enums\PulseCategory;
use App\Enums\PulseMemberRole;
use App\Models\OrganizationUser;
use App\Models\Pulse;
use App\Models\PulseMember;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            $users = User::all();
            foreach ($users as $user) {
                // Get all organizations the user belongs to
                $organizationUsers = OrganizationUser::where(
                    'user_id',
                    $user->id,
                )->get();
                foreach ($organizationUsers as $organizationUser) {
                    // Check if the user already has a PERSONAL pulse in this organization
                    $hasPersonalPulse = Pulse::where(
                        'organization_id',
                        $organizationUser->organization_id,
                    )
                        ->where('category', PulseCategory::PERSONAL)
                        ->whereHas('members', function ($query) use ($user) {
                            $query->where('user_id', $user->id);
                        })
                        ->exists();
                    if (! $hasPersonalPulse) {
                        // Create the PERSONAL pulse
                        $pulse = Pulse::create([
                            'id'              => (string) Str::uuid(),
                            'organization_id' => $organizationUser->organization_id,
                            'name'            => $user->name . "'s Personal Pulse",
                            'type'            => 'generic',
                            'description'     => null,
                            'features'        => null,
                            'icon'            => 'generic',
                            'category'        => PulseCategory::PERSONAL,
                        ]);
                        // Add the user as the OWNER member
                        PulseMember::create([
                            'pulse_id' => $pulse->id,
                            'user_id'  => $user->id,
                            'role'     => PulseMemberRole::OWNER,
                        ]);
                    }
                }
            }
        });
    }
};
