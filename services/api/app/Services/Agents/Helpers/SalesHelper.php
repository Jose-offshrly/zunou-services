<?php

namespace App\Services\Agents\Helpers;

use App\Services\VectorDBService;

class SalesHelper
{
    protected $vectorDBService;

    public function __construct()
    {
        $this->vectorDBService = new VectorDBService();
    }
}
