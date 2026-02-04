<?php

namespace App\Models;

use Parental\HasParent;

class TextDataSource extends DataSource
{
    // We use Parental single-table-inheritance to define child models.
    use HasParent;

    protected $fillable = ['description', 'name', 'organization_id'];
}
