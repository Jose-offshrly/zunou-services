<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

trait HasMembership
{
    /**
     * Check if a user is a member of the pulse
     */
    public function isMember(User $user): bool
    {
        return $this->members()
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Check if a user has a specific role or multiple roles in the pulse
     */
    public function userHasRole(
        User $user,
        string|array $roles,
        bool $useHierarchy = true,
    ): bool {
        // Normalize roles to an array
        $requestedRoles = is_array($roles) ? $roles : [$roles];

        // Role hierarchy definition
        $roleHierarchy = [
            'owner' => ['OWNER', 'ADMIN', 'STAFF'],
            'admin' => ['ADMIN', 'STAFF'],
            'staff' => ['STAFF'],
        ];

        // If using hierarchy, expand roles
        if ($useHierarchy) {
            $expandedRoles = collect($requestedRoles)
                ->flatMap(function ($role) use ($roleHierarchy) {
                    return $roleHierarchy[$role] ?? [$role];
                })
                ->unique()
                ->toArray();
        } else {
            $expandedRoles = $requestedRoles;
        }

        return $this->members()
            ->where('user_id', $user->id)
            ->whereIn('role', $expandedRoles)
            ->exists();
    }

    /**
     * Get the user's role in the pulse
     */
    public function getUserRole(User $user): ?string
    {
        $membership = $this->members()
            ->where('user_id', $user->id)
            ->first();

        return $membership ? $membership->role : null;
    }

    /**
     * Get all members with a specific role
     */
    public function getMembersByRole(string $role): Collection
    {
        return $this->members()->where('role', $role)->get();
    }

    /**
     * Check if the pulse has any members
     */
    public function hasMembersAssigned(): bool
    {
        return $this->members()->exists();
    }
}
