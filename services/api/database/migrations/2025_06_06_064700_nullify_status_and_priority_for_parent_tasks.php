<?php

use App\Enums\TaskType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        DB::table('tasks')
            ->where('type', TaskType::LIST->value)
            ->update([
                'status'   => null,
                'priority' => null,
            ]);
    }
};
