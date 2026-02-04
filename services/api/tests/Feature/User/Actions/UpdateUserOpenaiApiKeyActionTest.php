<?php

declare(strict_types=1);

namespace Tests\Feature\User\Actions;

use App\Actions\User\UpdateUserOpenaiApiKeyAction;
use App\Models\User;
use Tests\TestCase;

class UpdateUserOpenaiApiKeyActionTest extends TestCase
{
    public function test_it_can_update_user_openai_api_key(): void
    {
        $user = User::factory()->create([
            'openai_api_key' => null,
        ]);

        $action = app(UpdateUserOpenaiApiKeyAction::class);
        $apiKey = 'sk-test-api-key-12345';

        $updated = $action->handle($user, $apiKey);

        $this->assertInstanceOf(User::class, $updated);
        $this->assertEquals($apiKey, $updated->openai_api_key);
    }

    public function test_it_can_set_openai_api_key_to_null(): void
    {
        $user = User::factory()->create([
            'openai_api_key' => 'sk-existing-api-key',
        ]);

        $action = app(UpdateUserOpenaiApiKeyAction::class);

        $updated = $action->handle($user, null);

        $this->assertInstanceOf(User::class, $updated);
        $this->assertNull($updated->openai_api_key);
    }

    public function test_it_can_update_existing_openai_api_key(): void
    {
        $user = User::factory()->create([
            'openai_api_key' => 'sk-old-api-key',
        ]);

        $action = app(UpdateUserOpenaiApiKeyAction::class);
        $newApiKey = 'sk-new-api-key-67890';

        $updated = $action->handle($user, $newApiKey);

        $this->assertInstanceOf(User::class, $updated);
        $this->assertEquals($newApiKey, $updated->openai_api_key);
        $this->assertNotEquals('sk-old-api-key', $updated->openai_api_key);
    }
}

