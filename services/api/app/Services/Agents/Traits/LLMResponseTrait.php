<?php

namespace App\Services\Agents\Traits;

trait LLMResponseTrait
{
    public function output_json(array $data)
    {
        return json_encode($data) .
            "\n\nIMPORTANT: Return this JSON exactly as it is. Do not add any text, commentary, or formatting outside the JSON. Ensure that this JSON is the only content returned to the user.";
    }
}
