<?php

namespace App\GraphQL\Mutations;

use App\Models\Organization;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Validator;

final readonly class UpdateOrganizationMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): Organization
    {
        try {
            $this->validateInput($args);

            return $this->updateOrganization($args);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update organization: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'name'        => 'nullable|string',
            'description' => 'nullable|string',
            'domain'      => 'nullable|string',
            'file_key'    => 'nullable|string',
            'file_name'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function updateOrganization(array $input): Organization
    {
        $organization = Organization::find($input['organizationId']);

        if (! $organization) {
            throw new error('Organization not found');
        }

        if (isset($input['file_key'])) {
            $organization->fileKey = $input['file_key'];
        }

        if (isset($input['file_name'])) {
            $organization->fileName = $input['file_name'];
        }

        if (isset($input['name'])) {
            $organization->name = $input['name'];
        }

        if (isset($input['domain'])) {
            $organization->domain = $input['domain'];
        }

        if (isset($input['industry'])) {
            $organization->industry = $input['industry'];
        }

        if (isset($input['description'])) {
            $organization->description = $input['description'];
        }

        $organization->save();

        return $organization->refresh();
    }
}
