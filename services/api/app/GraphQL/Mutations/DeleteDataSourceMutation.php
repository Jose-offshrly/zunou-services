<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\DataSourceStatus;
use App\Models\DataSource;

final readonly class DeleteDataSourceMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $dataSource = DataSource::findOrFail($args['id']);

        $dataSource->status = DataSourceStatus::Deleted->value;
        $dataSource->save();
        $dataSource->delete();

        return $dataSource;
    }
}
