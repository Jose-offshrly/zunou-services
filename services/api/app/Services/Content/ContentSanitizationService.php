<?php

namespace App\Services\Content;

use Illuminate\Support\Str;

class ContentSanitizationService
{
    /**
     * Sanitize and parse team message content for security and formatting.
     *
     * @param  string  $content
     * @return array{content: string, metadata: array}
     */
    public function sanitizeAndParseContent(string $content): array
    {
        // Check if content is JSON and sanitize accordingly
        if ($this->isJsonContent($content)) {
            $sanitizedContent = $this->sanitizeJsonContent($content);
        } else {
            // Basic HTML sanitization - remove potentially dangerous tags
            $sanitizedContent = $this->sanitizeHtml($content);
        }
        
        // Wrap content with p tag if not already wrapped
        $wrappedContent = $this->wrapWithPTag($sanitizedContent);
        
        // Parse content for mentions, links, etc.
        $parsedContent = $this->parseContent($wrappedContent);
        
        return [
            'content' => $parsedContent['content'],
            'metadata' => $parsedContent['metadata']
        ];
    }

    /**
     * Wrap content with p tag if not already wrapped.
     */
    private function wrapWithPTag(string $content): string
    {
        $trimmed = trim($content);
        
        // Check if content is already wrapped in p tags
        if (preg_match('/^<p[^>]*>.*<\/p>$/s', $trimmed)) {
            return $content;
        }
        
        // Check if content is already wrapped in any block-level HTML tags
        if (preg_match('/^<(div|section|article|header|footer|main|aside|nav|h[1-6]|blockquote|pre|ul|ol|li|table|form|fieldset|legend|details|summary)[^>]*>/i', $trimmed)) {
            return $content;
        }
        
        // Wrap with p tag
        return '<p>' . $content . '</p>';
    }

    /**
     * Check if content is valid JSON.
     */
    private function isJsonContent(string $content): bool
    {
        $trimmed = trim($content);
        return (str_starts_with($trimmed, '{') && str_ends_with($trimmed, '}')) ||
               (str_starts_with($trimmed, '[') && str_ends_with($trimmed, ']'));
    }

    /**
     * Sanitize JSON content and convert to string format.
     */
    private function sanitizeJsonContent(string $content): string
    {
        // First, try to decode to validate JSON structure
        $decoded = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If not valid JSON, treat as regular content
            return $this->sanitizeHtml($content);
        }
        
        // Convert JSON to a readable string format
        return $this->jsonToString($decoded);
    }

    /**
     * Convert JSON array/object to a readable string format.
     */
    private function jsonToString($data, int $indent = 0): string
    {
        $indentStr = str_repeat('  ', $indent);
        
        if (is_array($data)) {
            if (empty($data)) {
                return '[]';
            }
            
            // Check if it's an associative array (object) or indexed array
            $isAssoc = array_keys($data) !== range(0, count($data) - 1);
            
            if ($isAssoc) {
                $result = "{\n";
                $items = [];
                foreach ($data as $key => $value) {
                    $sanitizedKey = $this->sanitizeJsonKey($key);
                    $sanitizedValue = $this->jsonToString($value, $indent + 1);
                    $items[] = $indentStr . '  "' . $sanitizedKey . '": ' . $sanitizedValue;
                }
                $result .= implode(",\n", $items) . "\n" . $indentStr . "}";
                return $result;
            } else {
                $result = "[\n";
                $items = [];
                foreach ($data as $value) {
                    $sanitizedValue = $this->jsonToString($value, $indent + 1);
                    $items[] = $indentStr . '  ' . $sanitizedValue;
                }
                $result .= implode(",\n", $items) . "\n" . $indentStr . "]";
                return $result;
            }
        } elseif (is_string($data)) {
            $sanitized = $this->sanitizeJsonString($data);
            return '"' . addslashes($sanitized) . '"';
        } elseif (is_bool($data)) {
            return $data ? 'true' : 'false';
        } elseif (is_null($data)) {
            return 'null';
        } else {
            return (string) $data;
        }
    }

    /**
     * Sanitize HTML content to prevent XSS attacks.
     */
    private function sanitizeHtml(string $content): string
    {
        // Remove script tags and their content
        $content = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $content);
        
        // Remove javascript: protocols
        $content = preg_replace('/javascript:/i', '', $content);
        
        // Remove on* event handlers
        $content = preg_replace('/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', '', $content);
        
        // Remove data: URLs that could be dangerous
        $content = preg_replace('/data:(?!image\/[png|jpg|jpeg|gif|webp])[^;]*;base64,/', '', $content);
        
        // Remove potentially dangerous attributes
        $dangerousAttributes = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'];
        foreach ($dangerousAttributes as $attr) {
            $content = preg_replace('/\s*' . preg_quote($attr, '/') . '\s*=\s*["\'][^"\']*["\']/i', '', $content);
        }
        
        return trim($content);
    }

    /**
     * Parse content for mentions, links, and other formatting.
     */
    private function parseContent(string $content): array
    {
        $metadata = [];
        
        // Extract mentions (@username)
        $mentions = $this->extractMentions($content);
        if (!empty($mentions)) {
            $metadata['mentions'] = $mentions;
        }
        
        // Extract URLs
        $urls = $this->extractUrls($content);
        if (!empty($urls)) {
            $metadata['urls'] = $urls;
        }
        
        // Extract hashtags (#hashtag)
        $hashtags = $this->extractHashtags($content);
        if (!empty($hashtags)) {
            $metadata['hashtags'] = $hashtags;
        }
        
        // Clean up content - remove excessive whitespace
        $content = $this->normalizeWhitespace($content);
        
        return [
            'content' => $content,
            'metadata' => $metadata
        ];
    }

    /**
     * Extract user mentions from content.
     */
    private function extractMentions(string $content): array
    {
        preg_match_all('/@(\w+)/', $content, $matches);
        return array_unique($matches[1] ?? []);
    }

    /**
     * Extract URLs from content.
     */
    private function extractUrls(string $content): array
    {
        preg_match_all('/(https?:\/\/[^\s]+)/', $content, $matches);
        return array_unique($matches[1] ?? []);
    }

    /**
     * Extract hashtags from content.
     */
    private function extractHashtags(string $content): array
    {
        preg_match_all('/#(\w+)/', $content, $matches);
        return array_unique($matches[1] ?? []);
    }

    /**
     * Normalize whitespace in content.
     */
    private function normalizeWhitespace(string $content): string
    {
        // Replace multiple spaces with single space
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Replace multiple newlines with double newline max
        $content = preg_replace('/\n{3,}/', "\n\n", $content);
        
        return trim($content);
    }

    /**
     * Sanitize JSON keys to prevent injection.
     */
    private function sanitizeJsonKey(string $key): string
    {
        // Remove potentially dangerous characters from keys
        $key = preg_replace('/[^\w\-\.]/', '', $key);
        
        // Limit key length
        return substr($key, 0, 100);
    }

    /**
     * Sanitize JSON string values.
     */
    private function sanitizeJsonString(string $value): string
    {
        // Remove null bytes and control characters
        $value = str_replace(["\0", "\x1a"], '', $value);
        
        // Remove potentially dangerous script content
        $value = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $value);
        
        // Remove javascript: protocols
        $value = preg_replace('/javascript:/i', '', $value);
        
        // Remove on* event handlers
        $value = preg_replace('/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', '', $value);
        
        // Remove data: URLs that could be dangerous
        $value = preg_replace('/data:(?!image\/[png|jpg|jpeg|gif|webp])[^;]*;base64,/', '', $value);
        
        // Remove excessive whitespace
        $value = preg_replace('/\s+/', ' ', $value);
        
        return trim($value);
    }
}
