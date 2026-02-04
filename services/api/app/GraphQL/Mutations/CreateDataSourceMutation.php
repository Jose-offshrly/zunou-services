<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\DataSourceType;
use App\Models\DataSource;
use App\Services\SummarizeDataSourceService;
use GraphQL\Error\Error;

final readonly class CreateDataSourceMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $payload = [
            'name'            => $args['name'],
            'organization_id' => $args['organization_id'],
            'type'            => $args['type'],
            'created_by'      => auth()->id(),
        ];
        if (isset($args['description'])) {
            $payload['description'] = $args['description'];
        }

        if (isset($args['pulse_id'])) {
            $payload['pulse_id'] = $args['pulse_id'];
        }

        $dataSource = DataSource::create($payload);

        if (isset($args['file_key'])) {
            $dataSource->fileKey = $args['file_key'];
            $dataSource->save();
        }

        if (isset($args['file_name'])) {
            $dataSource->filename = $args['file_name'];
            $dataSource->save();
        }

        if (! $dataSource->id) {
            throw new Error('The dataSource could not be created');
        }
        $dataSource = DataSource::find($dataSource->id);

        if ($dataSource->type === DataSourceType::Csv->value) {
            $dataSource = SummarizeDataSourceService::perform($dataSource);
        }

        return $dataSource;
    }
}
