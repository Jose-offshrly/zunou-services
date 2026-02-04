<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\DataSourceStatus;
use App\Models\File;

final readonly class DeleteNoteAttachmentMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $file = File::findOrFail($args['fileId']);

        // If file is added as data source, update and delete the data source following the DeleteDataSourceMutation logic
        if ($file->data_source_id && $file->data_source) {
            $dataSource         = $file->data_source;
            $dataSource->status = DataSourceStatus::Deleted->value;
            $dataSource->save();
            $dataSource->delete();
        }

        return $file->delete();
    }
}
