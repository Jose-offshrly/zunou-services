<?php

namespace App\Services\Personalization\Traits;

use App\Models\Pulse;
use App\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

trait UserLookupUtilities
{
    protected function findUserByName(string $name, Pulse $pulse): ?User
    {
        try {
            $name = trim($name);
            
            if (empty($name)) {
                return null;
            }

            return User::whereHas('pulseMemberships', function ($query) use ($pulse) {
                $query->where('pulse_id', $pulse->id);
            })->where('name', 'ilike', '%' . $name . '%')->first();
        } catch (Exception $e) {
            Log::error('Failed to find user by name', [
                'name' => $name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return null;
        }
    }

    protected function findUsersByNames(array $names, Pulse $pulse): Collection
    {
        try {
            $cleanNames = array_filter(array_map('trim', $names), function ($name) {
                return !empty($name);
            });

            if (empty($cleanNames)) {
                return new Collection();
            }

            $query = User::whereHas('pulseMemberships', function ($query) use ($pulse) {
                $query->where('pulse_id', $pulse->id);
            });
            
            foreach ($cleanNames as $index => $name) {
                if ($index === 0) {
                    $query->where('name', 'ilike', '%' . $name . '%');
                } else {
                    $query->orWhere('name', 'ilike', '%' . $name . '%');
                }
            }

            return $query->get();
        } catch (Exception $e) {
            Log::error('Failed to find users by names', [
                'names' => $names,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return new Collection();
        }
    }

    protected function findUserJobDescription(string $id, Pulse $pulse): ?string
    {
        try {
            $pulseMember = $pulse->members()->where('user_id', $id)->first();
            
            return $pulseMember?->job_description;
        } catch (Exception $e) {
            Log::error('Failed to find user job description', [
                'id' => $id,
                'pulse_id' => $pulse->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return null;
        }
    }

    protected function findUserResponsibilities(string $id, Pulse $pulse): ?array
    {
        try {
            $pulseMember = $pulse->members()->where('user_id', $id)->first();
            
            return $pulseMember?->responsibilities;
        } catch (Exception $e) {
            Log::error('Failed to find user responsibilities', [
                'id' => $id,
                'pulse_id' => $pulse->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return null;
        }
    }
}