<?php

namespace App\Enums;

enum OrganizationStatus: string
{
    case Active                = 'ACTIVE';
    case OnboardingComplete    = 'ONBOARDING_COMPLETE';
    case OnboardingDataSources = 'ONBOARDING_DATA_SOURCES';
    case OnboardingSlack       = 'ONBOARDING_SLACK';
    case OnboardingTerms       = 'ONBOARDING_TERMS';
}
