<?php

namespace App\GraphQL\Queries;

use App\Actions\MeetingSession\FetchCompanionStatusAction;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;

class CompanionStatusQuery
{
    /**
     * @throws ConnectionException
     */
    public function __invoke(null $_, array $args): Collection
    {
        $action = app(FetchCompanionStatusAction::class);

        return $action->handle();
    }
}
