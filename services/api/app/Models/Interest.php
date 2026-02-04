<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Interest extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
    'name',
    'email',
    'company_name',
    'company_size',
    'looking_for',
    ];
}
