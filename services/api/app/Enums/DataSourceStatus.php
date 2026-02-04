<?php

namespace App\Enums;

enum DataSourceStatus: string
{
    case Deleted  = 'DELETED';
    case Failed   = 'FAILED';
    case Indexed  = 'INDEXED';
    case Indexing = 'INDEXING';
}
