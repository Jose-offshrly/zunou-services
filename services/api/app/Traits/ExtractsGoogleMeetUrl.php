<?php

declare(strict_types=1);

namespace App\Traits;

trait ExtractsGoogleMeetUrl
{
    /**
     * Extract Google Meet URL from various event properties with priority order
     */
    public function getGoogleMeetUrl(array $event): ?string
    {
        // Default location of google meet url - check conferenceData entryPoints for video type
        $linkFromEntryPoint = null;
        if (!empty($event['conferenceData']['entryPoints'])) {
            foreach ($event['conferenceData']['entryPoints'] as $entryPoint) {
                if (($entryPoint['entryPointType'] ?? '') === 'video' && !empty($entryPoint['uri'])) {
                    $linkFromEntryPoint = $entryPoint['uri'];
                    break;
                }
            }
        }

        // Extract from location
        $linkFromLocation = $this->extractGoogleMeetUrl($event['location'] ?? '');
        
        // Extract from summary
        $linkFromSummary = $this->extractGoogleMeetUrl($event['summary'] ?? '');
        
        // Extract from description
        $linkFromDescription = $this->extractGoogleMeetUrl($event['description'] ?? '');

        // Return in priority order
        if ($linkFromEntryPoint) {
            return $linkFromEntryPoint;
        } elseif ($linkFromLocation) {
            return $linkFromLocation;
        } elseif ($linkFromSummary) {
            return $linkFromSummary;
        } elseif ($linkFromDescription) {
            return $linkFromDescription;
        }

        return null;
    }

    /**
     * Extract Google Meet URL from text using regex
     */
    private function extractGoogleMeetUrl(string $text): ?string
    {
        // Regex pattern to match Google Meet URLs
        $pattern = '/https?:\/\/meet\.google\.com\/[a-zA-Z0-9\-_]+/';
        
        if (preg_match($pattern, $text, $matches)) {
            return $matches[0];
        }

        return null;
    }
} 