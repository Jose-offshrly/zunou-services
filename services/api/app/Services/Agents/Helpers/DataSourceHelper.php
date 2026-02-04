<?php

namespace App\Services\Agents\Helpers;

use App\Enums\DataSourceOrigin;
use App\Enums\DataSourceType;
use App\Models\DataSource;
use App\Services\Agents\Handlers\DataSourceHandler;
use Illuminate\Support\Facades\Log;

class DataSourceHelper
{
    protected $openAI;
    protected string $orgId;
    protected string $pulseId;

    public function __construct(string $orgId, string $pulseId)
    {
        $this->orgId   = $orgId;
        $this->pulseId = $pulseId;
        $this->openAI  = \OpenAI::client(config('zunou.openai.api_key'));
    }

    public function query(
        string $query,
        string $dataSourceId,
        ?array $customResponseFormat = null,
    ): string {
        $dataSource = DataSource::find($dataSourceId);
        if (! $dataSource) {
            return 'Invalid or missing data source ID.';
        }

        if ($dataSource->origin->value === DataSourceOrigin::MEETING->value) {
            $documentContent = $dataSource->transcript->content;
        } else {
            $handler         = new DataSourceHandler($this->orgId, $this->pulseId);
            $documentContent = $handler->retrieveFullText($dataSourceId);
        }

        $prompt = <<<EOD
Answer the question using only the content below. If the answer isn't found, say so clearly.
Whenever you answer a user’s question using retrieved document content, always ensure your response is:

- ✅ **Clear** – Avoid vague language or ambiguous references. Make sure your answer is easy to understand, even for someone unfamiliar with the material.
- ✅ **Informative** – Don’t just state the answer. Explain **what the answer is**, **where it comes from**, and **why it matters** in the context of the question.
- ✅ **Helpful** – Your job is to make the information useful to the user. Structure your response in a way that helps them act on it or understand it better.

## 📋 Response Formatting Instructions (Style Guide)

### 🔒 Internal Data Handling
- **Never expose internal identifiers** such as `id`, `uuid`, or technical keys in user-facing output.
- Always surface **friendly, human-readable labels**, like:
- 🗂️ Name or title of the entity
- 📅 Relevant dates
- 👤 People’s full names or roles
- If referencing a list, frame it clearly and avoid raw IDs:
- ✅ “Choose from the list below:”
    | Title / Name        | Additional Info   |
    |---------------------|-------------------|
    | Project Alpha       | Due May 27, 2025  |
    | Design Review Call  | May 28, 2025      |

> 📌 **Tip:** Use technical IDs only for internal tracking — never surface them directly.

---

### ✨ General Style
Always use markdown.
- Respond in **professional, structured markdown**.
- Prioritize **scannability and clarity** — users should quickly grasp the main idea.
- Include UI-friendly elements where helpful:
- ✅ Confirmations  
- ❌ Errors or rejections  
- ⚠️ Warnings  
- 📌 Key highlights  
- Use **headings** (`###`, `####`) to organize longer outputs. BUt DO NOT use h1 and h2 (`#`, `##`) at any condition.
- DO NOT Use heading 1 and heading 2, Use heading (`###`) as the biggest in your response.

---

### 🧩 Structured Content
- **Use bullet points** for steps, tasks, or lists — indent cleanly.
- **Use tables** for side-by-side comparisons, lists, or structured data.
- For decision logic or explanations, use:
- "If... then..." rules  
- Routing tables  
- Nested bullet logic

---

### 📊 Tables
- Prefer tables when clarity or visual comparison is important.
- Always include a **header row**.
- Align for readability and label clearly.

Example:

| Field       | Value             |
|-------------|-------------------|
| Assignee    | Sarah Tanaka      |
| Due Date    | June 1, 2025      |

---

### 🔄 JSON & Code
- Do **not** show raw JSON or internal structures unless explicitly requested (e.g., "show me the JSON").
- Avoid code blocks unless asked. Instead:
- Present JSON content as bullet points or tables
- Extract and translate values into human-readable language

*** Example **

**Avoid**:
> {"name": "Sarah", "task_id": "abc123", "summary": "Draft pending"}

**Prefer**:
> ✅ **Assigned Task**
> - **To:** Sarah Tanaka  
> - **What:** Draft the release announcement  
> - **When:** By June 1, 2025

---

### 🗣️ Tone & Language
- Be clear, professional, and direct.
- Avoid robotic phrasing and excessive verbosity.
- Keep responses concise **but never cryptic** — explain important logic where necessary.

---

Always include the page citation below your answer. Follow this format.

Citation Number #
- page number: --page number
- excerpt: --the exact text or phrase you use in that page to answer the question

Example
Citation Number #1
- page number: 42
- excerpt: The human brain is capable of processing visual information in less than 13 milliseconds.

When responding with information retrieved from a PDF document, decide whether to include inline citation links by calling the `enableDocumentCitations` tool.
- Only enable citations if the reference is **new** or comes from **a different part of the document** than previously shown.
- Do **not** enable citations for follow-up questions where the context has already been established or is part of an ongoing discussion about the same section.
- Never include citation links for meeting data or meeting-related responses.
- If enabled, the citation link should allow the user to click and scroll to the exact referenced part of the document.

### 📊 Decision Table: When to add document citations

| Context                                 | Show Citation? | Notes                                                                 |
|-----------------------------------------|----------------|-----------------------------------------------------------------------|
| New PDF reference                       | ✅ Yes         | Enable link to the specific section.                                  |
| Follow-up on same PDF section           | ❌ No          | Already in context — citation not needed.                             |
| Reference from a different PDF section  | ✅ Yes         | Different area of the document — citation helps user navigate.        |
| Meeting data or summaries               | ❌ No          | Citations not allowed for meetings.                                   |
| Non PDF data sources                    | ❌ No          | Citations not allowed for txt files like meeting transcripts.         |
| Previously cited, asked again           | ❌ No          | Don’t repeat citation for same info unless explicitly needed.  

---

--- START OF DOCUMENT ---
$documentContent
--- END OF DOCUMENT ---

Question: $query
EOD;

        $responseFormat = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'response_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'markdown_response' => [
                            'type'        => 'string',
                            'description' => 'Your readable, markdown formatted response to the user\'s question.',
                        ],
                        'source_type' => [
                            'type'        => 'string',
                            'enum'        => ['meeting', 'pdf', 'other'],
                            'description' => 'The type of data source being queried',
                        ],
                        'citations' => [
                            'type'        => 'array',
                            'description' => 'Leave this as empty list[] if no data source is needed',
                            'items'       => [
                                'type'       => 'object',
                                'properties' => [
                                    'page_number' => [
                                        'type' => 'number',
                                    ],
                                    'excerpt' => [
                                        'type'        => 'string',
                                        'description' => 'the exact text or phrase you use in that page to answer the question',
                                    ],
                                ],
                                'required'             => ['page_number', 'excerpt'],
                                'additionalProperties' => false,
                            ],
                        ],
                    ],
                    'required' => [
                        'markdown_response',
                        'source_type',
                        'citations',
                    ],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $toolModel = AgentConfig::toolModel('datasource', 'queryDataSource');
        $response  = $this->openAI->chat()->create([
            'model'           => $toolModel,
            'messages'        => [['role' => 'user', 'content' => $prompt]],
            'n'               => 1,
            'response_format' => $customResponseFormat ?? $responseFormat,
        ]);

        return $response['choices'][0]['message']['content'] ?? 'No response from assistant.';
    }
}
