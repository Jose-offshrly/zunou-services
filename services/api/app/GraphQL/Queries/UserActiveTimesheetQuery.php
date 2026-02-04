<?php

namespace App\GraphQL\Queries;

use App\Models\Timesheet;

class UserActiveTimesheetQuery
{
    public function __invoke($root, array $args)
    {
        $query = TimeSheet::query();

        $query->where('user_id', $args['userId'])->whereNull('checked_out_at');

        return $query->latest()->first();
    }
}
