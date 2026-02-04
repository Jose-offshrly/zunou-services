<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;

class TextAgentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        // Validate user belongs to the organization
        $organizationId = $this->input('organization_id');
        return $user->organizations()->where('organizations.id', $organizationId)->exists();
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedAuthorization()
    {
        $user = Auth::user();
        
        if (!$user) {
            throw new HttpResponseException(response()->json([
                'errors' => [['message' => 'Authentication required: Please log in again']]
            ], 401));
        }

        throw new HttpResponseException(response()->json([
            'errors' => [['message' => 'You do not have access to this organization']]
        ], 403));
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'errors' => collect($validator->errors()->all())->map(fn($msg) => ['message' => $msg])->toArray()
        ], 400));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'organization_id' => ['required', 'string', 'uuid', 'exists:organizations,id'],
            'model' => ['sometimes', 'string', 'max:100'],
            'stream' => ['sometimes', 'boolean'],
            'instructions' => ['required', 'string', 'max:32000'],
            'input' => ['required', 'array', 'min:1'],
            'input.*.role' => ['sometimes', 'string', 'in:user,assistant,system'],
            'input.*.type' => ['sometimes', 'string'], // For function_call_output
            'input.*.content' => ['sometimes', 'string'],
            'input.*.call_id' => ['sometimes', 'string'], // For function_call_output
            'input.*.output' => ['sometimes', 'string'], // For function_call_output
            'tools' => ['sometimes', 'array'],
            'tools.*.type' => ['required_with:tools', 'string', 'in:function'],
            'tools.*.name' => ['required_with:tools', 'string', 'max:256'],
            'tools.*.description' => ['sometimes', 'string', 'max:4096'],
            'tools.*.parameters' => ['sometimes', 'array'],
            'tool_choice' => ['sometimes', 'string', 'in:auto,none,required'],
            'temperature' => ['sometimes', 'numeric', 'min:0', 'max:2'],
            'max_output_tokens' => ['sometimes', 'integer', 'min:1', 'max:128000'],
            'previous_response_id' => ['sometimes', 'string', 'max:100'],
            'conversation' => ['sometimes', 'string', 'max:100'],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'organization_id.required' => 'Organization ID is required',
            'organization_id.exists' => 'Organization not found',
            'instructions.required' => 'System instructions are required',
            'input.required' => 'Conversation input is required',
            'input.min' => 'At least one message is required',
        ];
    }
}
