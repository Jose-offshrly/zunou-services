<?php

namespace App\Services\Agents\Helpers;

class MarkdownParser
{
    /**
     * clean markdown, remove \n and replace with new lines
     */
    public static function clean(string $markdown)
    {
        // Replace newline characters (\n) with markdown line breaks (two spaces + newline)
        return str_replace("\n", "  \n", $markdown);
    }
}
