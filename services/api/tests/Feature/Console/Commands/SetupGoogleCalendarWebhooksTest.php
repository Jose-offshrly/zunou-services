<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SetupGoogleCalendarWebhooksTest extends TestCase
{
    use RefreshDatabase;

    public function test_skips_users_with_valid_webhooks_not_expiring_soon(): void
    {
        config(['google-calendar.webhook_base_url' => 'https://api.example.com']);

        // Webhook expires in 5 days, well beyond the 2-day renewal threshold
        $user = User::factory()->create([
            'google_calendar_refresh_token' => 'test-refresh-token',
            'google_calendar_linked' => true,
            'google_calendar_channel_id' => 'existing-channel-id',
            'google_calendar_resource_id' => 'existing-resource-id',
            'google_calendar_channel_expires_at' => Carbon::now()->addDays(5),
        ]);

        $this->artisan('google:setup-webhooks')
            ->expectsOutputToContain("Found 1 users with Google Calendar linked")
            ->expectsOutputToContain("Skipping user {$user->id}")
            ->expectsOutputToContain("Skipped: 1")
            ->assertSuccessful();

        // Should not touch existing webhook
        $user->refresh();
        $this->assertEquals('existing-channel-id', $user->google_calendar_channel_id);
        $this->assertEquals('existing-resource-id', $user->google_calendar_resource_id);
    }

    public function test_skips_users_without_google_calendar_linked(): void
    {
        config(['google-calendar.webhook_base_url' => 'https://api.example.com']);

        // Has refresh token but not linked
        User::factory()->create([
            'google_calendar_refresh_token' => 'test-refresh-token',
            'google_calendar_linked' => false,
        ]);

        // Linked but no refresh token
        User::factory()->create([
            'google_calendar_refresh_token' => null,
            'google_calendar_linked' => true,
        ]);

        $this->artisan('google:setup-webhooks')
            ->expectsOutputToContain("Found 0 users with Google Calendar linked")
            ->assertSuccessful();
    }

    public function test_fails_when_webhook_base_url_not_configured(): void
    {
        config(['google-calendar.webhook_base_url' => null]);

        User::factory()->create([
            'google_calendar_refresh_token' => 'test-refresh-token',
            'google_calendar_linked' => true,
        ]);

        $this->artisan('google:setup-webhooks')
            ->expectsOutputToContain("GOOGLE_CALENDAR_WEBHOOK_BASE_URL is not set")
            ->assertFailed();
    }

    public function test_webhook_expiring_just_after_two_day_threshold_is_skipped(): void
    {
        config(['google-calendar.webhook_base_url' => 'https://api.example.com']);

        // 2 days + 1 minute - just barely past the threshold, should skip
        $user = User::factory()->create([
            'google_calendar_refresh_token' => 'test-refresh-token',
            'google_calendar_linked' => true,
            'google_calendar_channel_id' => 'safe-channel-id',
            'google_calendar_resource_id' => 'safe-resource-id',
            'google_calendar_channel_expires_at' => Carbon::now()->addDays(2)->addMinute(),
        ]);

        $this->artisan('google:setup-webhooks')
            ->expectsOutputToContain("Skipping user {$user->id}")
            ->expectsOutputToContain("Skipped: 1")
            ->assertSuccessful();

        $user->refresh();
        $this->assertEquals('safe-channel-id', $user->google_calendar_channel_id);
        $this->assertEquals('safe-resource-id', $user->google_calendar_resource_id);
    }

    public function test_webhook_renewal_threshold_is_two_days(): void
    {
        config(['google-calendar.webhook_base_url' => 'https://api.example.com']);

        // 3 days out = safe, should skip
        $userSkipped = User::factory()->create([
            'google_calendar_refresh_token' => 'test-refresh-token-1',
            'google_calendar_linked' => true,
            'google_calendar_channel_id' => 'channel-3-days',
            'google_calendar_resource_id' => 'resource-3-days',
            'google_calendar_channel_expires_at' => Carbon::now()->addDays(3),
        ]);

        $this->artisan('google:setup-webhooks')
            ->expectsOutputToContain("Skipping user {$userSkipped->id}")
            ->assertSuccessful();

        $userSkipped->refresh();
        $this->assertEquals('channel-3-days', $userSkipped->google_calendar_channel_id);
    }

    public function test_multiple_users_are_processed_correctly(): void
    {
        config(['google-calendar.webhook_base_url' => 'https://api.example.com']);

        // Both have valid webhooks, should be skipped
        $user1 = User::factory()->create([
            'google_calendar_refresh_token' => 'token-1',
            'google_calendar_linked' => true,
            'google_calendar_channel_id' => 'channel-1',
            'google_calendar_resource_id' => 'resource-1',
            'google_calendar_channel_expires_at' => Carbon::now()->addDays(5),
        ]);

        $user2 = User::factory()->create([
            'google_calendar_refresh_token' => 'token-2',
            'google_calendar_linked' => true,
            'google_calendar_channel_id' => 'channel-2',
            'google_calendar_resource_id' => 'resource-2',
            'google_calendar_channel_expires_at' => Carbon::now()->addDays(3),
        ]);

        // Not linked, shouldn't be counted
        User::factory()->create([
            'google_calendar_refresh_token' => 'token-3',
            'google_calendar_linked' => false,
        ]);

        $this->artisan('google:setup-webhooks')
            ->expectsOutputToContain("Found 2 users with Google Calendar linked")
            ->expectsOutputToContain("Skipped: 2")
            ->assertSuccessful();

        $user1->refresh();
        $user2->refresh();
        $this->assertEquals('channel-1', $user1->google_calendar_channel_id);
        $this->assertEquals('channel-2', $user2->google_calendar_channel_id);
    }
}
