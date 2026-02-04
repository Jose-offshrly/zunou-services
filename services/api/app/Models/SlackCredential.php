<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SlackCredential extends Model
{
    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The connection name for the model.
     *
     * @var string|null
     */
    protected $connection = null;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = null;

    /**
     * Indicates if the model should be backed by a database table.
     *
     * @var bool
     */
    public $exists = false;
}
