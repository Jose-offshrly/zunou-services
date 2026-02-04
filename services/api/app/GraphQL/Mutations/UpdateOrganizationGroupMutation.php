<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\OrganizationGroup;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Validator;

final readonly class UpdateOrganizationGroupMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): OrganizationGroup
    {
        try {
            $this->validateInput($args['input']);

            return $this->updateOrganizationGroup($args['input']);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update organization group: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'id'          => 'required|exists:organization_groups,id',
            'name'        => 'required|string',
            'description' => 'required|string',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function updateOrganizationGroup(array $input): OrganizationGroup
    {
        $group = OrganizationGroup::find($input['id']);

        if (! $group) {
            throw new Error('Organization group not found');
        }

        if (array_key_exists('name', $input)) {
            $group->name = $input['name'];
        }
        if (array_key_exists('description', $input)) {
            $group->description = $input['description'];
        }

        $group->save();

        return $group->refresh();
    }
}
