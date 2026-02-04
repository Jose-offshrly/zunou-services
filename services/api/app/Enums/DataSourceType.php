<?php

namespace App\Enums;

enum DataSourceType: string
{
    case Csv      = 'csv';
    case Doc      = 'doc';
    case Docx     = 'docx';
    case Html     = 'html';
    case Markdown = 'markdown';
    case Pdf      = 'pdf';
    case Ppt      = 'ppt';
    case Pptx     = 'pptx';
    case Text     = 'text';
    case Xls      = 'xls';
    case Xlsx     = 'xlsx';
    case Rtf      = 'rtf';
    case Mp4      = 'mp4';
    case Jpeg     = 'jpeg';
    case Png      = 'png';
}
