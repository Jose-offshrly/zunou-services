<?php

namespace App\GraphQL\Mutations;

use App\Actions\RegisterUserAction;
use App\DataTransferObjects\RegistrationData;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SignUpMutation
{
    public function __construct(private readonly RegisterUserAction $action)
    {
    }

    public function __invoke($_, array $args): User
    {
        $this->validateArgs($args);

        return $this->createUser($args);
    }

    private function validateArgs(array $args): void
    {
        try {
            Validator::make(
                data: $args,
                rules: $this->validationRules(),
                messages: $this->customMessages(),
            )->validate();
        } catch (ValidationException $e) {
            throw $e;
        }
    }

    private function validationRules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    private function customMessages(): array
    {
        return [
            'name.required'     => 'The name field is required.',
            'email.required'    => 'The email field is required.',
            'password.required' => 'The password field is required.',
        ];
    }

    private function createUser(array $args): User
    {
        $data = new RegistrationData(
            name: $args['name'],
            email: $args['email'],
            password: $args['password'],
        );

        return $this->action->handle($data);
    }
}
