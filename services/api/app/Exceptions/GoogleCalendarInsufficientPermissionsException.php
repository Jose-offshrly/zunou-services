<?php

namespace App\Exceptions;

use Exception;

class GoogleCalendarInsufficientPermissionsException extends Exception
{
    //
        } catch (\Exception $e) {
            // Check for Google API insufficient permissions error
            if (
                $e instanceof \Google\Service\Exception &&
                $e->getCode() === 403 &&
                str_contains($e->getMessage(), 'insufficientPermissions')
            ) {
                throw new \App\Exceptions\GoogleCalendarInsufficientPermissionsException(
                    'Google Calendar access token has insufficient permissions. User must re-authenticate with the correct scopes.',
                    403,
                    $e
                );
            }

            Log::error('Failed to bulk fetch events from Google Calendar', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }