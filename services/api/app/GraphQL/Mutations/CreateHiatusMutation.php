<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Hiatus\CreateHiatusAction;
use App\DataTransferObjects\HiatusData;
use App\Models\Hiatus;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class CreateHiatusMutation
{
    public function __construct(private CreateHiatusAction $createHiatusAction)
    {
    }

    public function __invoke(null $_, array $args): Hiatus
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        Log::info('args: ' . json_encode($args));

        $data = new HiatusData(
            user_id: $args['userId'],
            timesheet_id: $args['timesheetId'],
        );

        return $this->createHiatusAction->handle($data);
    }
}
