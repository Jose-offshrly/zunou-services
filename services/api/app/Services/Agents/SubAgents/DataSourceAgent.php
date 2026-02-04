<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\Enums\DataSourceStatus;
use App\GraphQL\Mutations\GenerateDataSourceDownloadLink;
use App\Models\DataSource;
use App\Models\User;
use App\Schemas\BaseSchema;
use App\Schemas\DataSourceSchema;
use App\Services\Agents\Handlers\DataSourceHandler;
use App\Services\Agents\Helpers\DataSourceHelper;
use App\Services\Agents\Tools\RetrievalTools;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

class DataSourceAgent extends BaseSubAgent implements SubAgentInterface
{
    public function __construct($pulse)
    {
        parent::__construct($pulse);
    }

    public function getResponseSchema(): ?array
    {
        return BaseSchema::getResponseSchema([
            BaseSchema::ConfirmationSchema,
            BaseSchema::OptionsSchema,
        ]);
    }

    public function getSystemPrompt(): string
    {
        $basePrompt = $this->getSharedPrompt();

        return <<<EOD
You are the **DataSource Routing Agent**, whose sole responsibility is to route user queries to the organization’s knowledge base by **always** using the `queryDataSource` tool to retrieve information.

---

{$basePrompt}

---

### 📋 "What Have I Missed?" Query Handling

When a user asks "What have I missed?" or similar questions about recent activity, you must provide a comprehensive summary of system activity since their last active timestamp.

   - Query for new or updated documents, files, PDFs since user's last activity
   - Check for any new knowledge base entries or uploaded content

### 🔁 Core Tool Usage Instructions

- **Never generate any answer text yourself.**  
- For **every** user question, you **must**:

  1. If the query includes or implies a specific **file or document title**, first call:  
     ➤ `searchDataSourceByTitle(title)`  
     to retrieve matching data sources by title (optionally using file extension if needed).
     - Use semantic cues and conversation history to infer the intended document title.
     - Remember the filename doesn't always have an extension.
     - **Always check for the most recent, non-deleted, and non-replaced data sources.**
     - **Never assume a file with the same name is the same as before—always re-query for the latest version.**
     - **If multiple data sources have the same or similar name, prioritize the one with the most recent creation or update date.**
     - **Ignore any data sources that are marked as deleted or replaced.**
     - **If a file was renamed, ensure you match by both old and new names if possible, and clarify with the user if there is ambiguity.**
     - If a file was deleted and a new one uploaded with the same name, always use the new, active data source.
     
  2. If title is **not available**, or `searchDataSourceByTitle` returns nothing relevant,  
     ➤ use `findDataSource(query)`  
     to identify the most relevant data source(s) based on content and intent.

  3. Then use `queryDataSource(dataSourceId, query)` on the selected data source to extract precise content.

- Re-run both search and query tools for **every user question** — even if it was asked before.  
- **Never reuse or repeat** a previous response or assume the answer will be the same.
- If no relevant data source is found, clearly say so.
- **Skipping tool calls is strictly prohibited.**
- Even if the **same question was asked previously**, you must **re-run both tools**.
- **Never skip tool calls**, even if the previous result was empty or not found — treat every query as new.
- Do **not repeat** answers from previous tool outputs — always call again to confirm or update.
- **Never reference or use deleted, replaced, or outdated data sources.**
- **Always clarify with the user if there is any ambiguity about which file or version is intended.**

---

### When delivering the response from `queryDataSource` results, ensure it is:  
- **Clear:** Avoid ambiguous terms. The user should easily understand the answer.  
- **Informative:** Include what the answer is, its source, and why it matters.  
- **Helpful:** Structure the info to support user understanding and action.

---

You have access to three tools:  
- `searchDataSourceByTitle(title)`: Search for a data source by its title (and optionally file extension). Use this first if the query includes a known or inferred document name.
- `findDataSource(query)`: Locate the best data source(s) relevant to the query.  
- `queryDataSource(dataSourceId, query)`: Extract detailed content from the chosen data source.

---

**Summary:** You are a routing agent that never answers from your own knowledge or inference. Your job is to find the correct data source and fetch answers directly from it every time.

---

Notes on showing citations: 
When responding with information retrieved from a PDF document, decide whether to include inline citation links by calling the `enableDocumentCitations` tool.
- Only enable citations if the reference is **new** or comes from **a different part of the document** than previously shown.
- Do **not** enable citations for follow-up questions where the context has already been established or is part of an ongoing discussion about the same section.
- Never include citation links for meeting data or meeting-related responses.
- If enabled, the citation link should allow the user to click and scroll to the exact referenced part of the document.

| Context                                                 | Show Citation? | Notes                                                                  |
|---------------------------------------------------------|----------------|-------------------------------------------------------------------------|
| New PDF reference                                       | ✅ Yes         | Enable link to the specific section.                                   |
| Follow-up on same PDF section                           | ❌ No          | Already in context — citation not needed.                              |
| Reference from a different PDF section                  | ✅ Yes         | Different area of the document — citation helps user navigate.         |
| Meeting data or summaries                               | ❌ No          | Citations not allowed for meetings.                                    |
| Non PDF data sources                                    | ❌ No          | Citations not allowed for txt files like meeting transcripts.          |
| Previously cited, asked again                           | ❌ No          | Don't repeat citation for same info unless explicitly needed.          |
| Title-based document lookup (`searchDataSourceByTitle`) | ✅ Yes         | If document is newly referenced via title and it's a PDF               |

### ⚠️ Absolutely Prohibited

- ❌ Generating answers yourself
- ❌ Skipping `findDataSource` or `queryDataSource`
- ❌ Repeating previous tool responses
- ❌ Guessing based on context or memory
- ❌ Returning "same as above" or "as previously answered"
- ❌ Using deleted, replaced, or outdated data sources

** Exceptions to the rule: **

You **may** provide direct answers (without using `queryDataSource`) **only** for listing queries:

**✅ Allowed Direct Responses:**
- Document listings: "What documents do I have?", "Show me all PDFs", "List recent uploads"
- Document counts: "How many documents are uploaded?", "How many meetings do I have?"
- Document metadata: "What's the latest document?", "When was this file uploaded?"
- Document types: "What types of files do I have?", "Do I have any meeting transcripts?"
- Date-based queries: "What documents were uploaded last week?", "Show documents from January"

**❌ Still prohibited for content questions:**
- "What does the document say about X?", "What are the key points?"
- "What are the main findings?", "What are the recommendations?"
- "What are the trends?", "What does this mean?"

Always reason step by step, clarify your actions with the user, and keep answers concise and helpful.
EOD;
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([
            RetrievalTools::searchDataSourceByTitle,
            RetrievalTools::findDataSource,
            RetrievalTools::queryDataSource,
            RetrievalTools::downloadDataSource,
            RetrievalTools::listDataSources,
        ]);
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        switch ($functionName) {
            case 'searchDataSourceByTitle':
                Log::info(
                    '[DataSourceAgent] Received searchFileByTitle call',
                    $arguments,
                );

                $query = DataSource::where('organization_id', $orgId)
                    ->where('pulse_id', $pulseId)
                    ->where('status', 'INDEXED')
                    ->whereNull('deleted_at');

                $title = $arguments['title'];
                $info  = pathinfo($title);

                $filename  = $info['filename'];
                $extension = $info['extension'] ?? null;

                $query->where(function ($q) use ($filename, $title) {
                    $q->orWhereRaw(
                        "to_tsvector('english', name) @@ plainto_tsquery('english', ?)",
                        [$filename],
                    )->orWhereRaw(
                        "to_tsvector('english', description) @@ plainto_tsquery('english', ?)",
                        [$filename],
                    );
                });

                $results = $query->limit(25)->get();
                if ($results->count() === 0) {
                    return 'No data sources found with that file name';
                }

                $resultsArray = $results->map(function ($file) {
                    return [
                        'data_source_id' => $file->id,
                        'file_name'      => $file->name,
                        'description'    => $file->description,
                        'file_type'      => $file->type,
                    ];
                });

                $resultsString = json_encode($resultsArray, JSON_PRETTY_PRINT);

                if (count($resultsArray) > 1) {
                    return "Multiple results found. By default, ask the user which document they are referring to. **Only skip this step if the query includes a unique identifier** (such as a date, entity name, file type/extension or document ID) that clearly matches one of the results. These are different files and should not be treated as interchangeable.
    
    Results:
    \n\n" . $resultsString;
                }

                return $resultsString;

            case 'findDataSource':
                Log::info(
                    '[DataSourceAgent] Received findDataSource call',
                    $arguments,
                );
                $handler = new DataSourceHandler($orgId, $pulseId);

                $search_results = $handler->search($arguments['query']);
                if (! $search_results) {
                    return "No relevant information is found in the documents, respond with: 'I couldn't find any relevant information in the documents to answer your question. If you've already uploaded the document, it might still be processing and will be available later.";
                }
                return "Here are the retrieved documents related to the query. Carefully evaluate and select **only** the document that most accurately matches the user's query.

**Important Instructions**:
- **Do not rely** solely on this content for answering the user's question. These are merely *fragments* from a larger source. If the user is asking about the content, use `queryDataSource` instead.
- The goal is to identify the **most relevant document**, not to generate an answer from these chunks.

**Matching Criteria**:
- Prioritize **strict title matching**. If the title is at least **80% similar** to the query, consider it a likely match.
- If the document includes **dates**, and those dates match the query, it is a strong signal of relevance.
- Use both **semantic similarity** and **exact phrase checks** to determine the best match.

Please select **only one** document that best fits the query based on these guidelines.

Search Results:
                " . $search_results;

                $result = $handler->getRelevantDocument(
                    $arguments['query'],
                    $search_results,
                );
                if (! $result['hasReleventDataSource']) {
                    return 'There is no relevant information found in the documents to answer the question.';
                }

                $retrieveDataSource = $result['dataSource'];
                // replace the name property, some names is in uuid which confuses the llm
                $ds = DataSource::find($retrieveDataSource['data_source_id']);
                if (! $ds) {
                    return 'There is no relevant information found in the documents to answer the question.';
                }

                $retrieveDataSource['name'] = $ds->name;
                // $retrieveDataSource['overview_of_the_document'] = $ds->summary;

                return json_encode($retrieveDataSource);

            case 'queryDataSource':
                Log::info(
                    '[DataSourceAgent] Received queryDataSource call',
                    $arguments,
                );

                $dataSourceRecord = DataSource::withTrashed()
                    ->where('id', $arguments['data_source_id'])
                    ->first();
                if (! $dataSourceRecord) {
                    return 'No data source was found with that ID. Did you pass the correct data source id? If not, please call find data source first then try again.';
                }

                if (
                    $dataSourceRecord->status === DataSourceStatus::Deleted->value
                ) {
                    return 'This meeting record has been deleted and can’t be viewed right now. Respond to user with frienly warm message indicating that the message is deleted';
                }

                $TOKEN_ALLOWANCE = 1000;
                $MODEL_MAX_LIMIT = 1000000; # set model to 1 million, gpt4.1
                if (
                    $dataSourceRecord->token_count >= $MODEL_MAX_LIMIT - $TOKEN_ALLOWANCE
                ) {
                    return 'This document is too large. Please split it into smaller parts.';
                }

                $helper   = new DataSourceHelper($orgId, $pulseId);
                $response = $helper->query(
                    $arguments['query'],
                    $arguments['data_source_id'],
                );

                $responseObj = json_decode($response, true);
                $source_type = $responseObj['source_type'];

                if ($source_type !== 'meeting') {
                    $this->setCurrentToolResponseFormat(
                        'queryDataSource',
                        DataSourceSchema::LookupInformationResponse,
                    );
                } else {
                    $responseObj['citations'] = [];
                }

                $prettyJson = json_encode($responseObj, JSON_PRETTY_PRINT);

                return <<<EOD
Present the response as final response to the user. Do not add or remove to the content.
Always present the final answer in **well-formatted markdown**, regardless of how the initial response is structured.
- Remove malformed bullet points, broken tables, or redundant newlines.
- Use markdown elements **only when helpful** — apply headings, lists, and indentation **selectively** to enhance structure without overloading the layout.
- Make sure its easy, clean for the user experience.

{$prettyJson}

EOD;
                // TODO:
                // case 'summarize' :
                // use google gemini & pass in some mission and other context parameters

            case 'downloadDataSource':
                Log::info(
                    '[DataSourceAgent] Received downloadDataSource call',
                    $arguments,
                );

                if (
                    empty($arguments['data_source_id']) || ! Uuid::isValid($arguments['data_source_id'])
                ) {
                    return 'Invalid data source ID provided. Please provide a valid UUID.';
                }

                $exist = DataSource::find($arguments['data_source_id']);
                if (! $exist) {
                    return 'Data source not found. Please check the data source ID.';
                }

                $resolver = new GenerateDataSourceDownloadLink();

                $result = $resolver(null, [
                    'dataSourceId' => $arguments['data_source_id'],
                    'download'     => true,
                ]);

                return <<<EOD
Here is the download link for the data source: 
```markdown
[{$exist->name}]({$result['url']})
```

Stricly format the link [data source name](download link) in markdown format in you final response.
EOD;
            case 'listDataSources':
                try {
                    $skip = $arguments['skip'] ?? 0;
                    $take = $arguments['take'] ?? 10;

                    $builder = DataSource::where('organization_id', $orgId)
                        ->where('pulse_id', $pulseId)
                        ->where('status', 'INDEXED')
                        ->whereNull('deleted_at')
                        ->orderBy('created_at', 'desc')
                        ->select(
                            'id',
                            'name',
                            'description',
                            'created_at',
                            'type',
                            'origin',
                        );

                    if (! empty($arguments['date_from'])) {
                        if (! Carbon::parse($arguments['date_from'])) {
                            return 'Invalid date_from provided. Please provide a valid date in YYYY-MM-DD format.';
                        }
                        $dataFrom = Carbon::parse(
                            $arguments['date_from'],
                        )->startOfDay();
                        $builder->where('created_at', '>=', $dataFrom);
                    }

                    if (! empty($arguments['date_to'])) {
                        if (! Carbon::parse($arguments['date_to'])) {
                            return 'Invalid date_to provided. Please provide a valid date in YYYY-MM-DD format.';
                        }
                        $dateTo = Carbon::parse(
                            $arguments['date_to'],
                        )->endOfDay();
                        $builder->where('created_at', '<=', $dateTo);
                    }

                    $dataSources = $builder->skip($skip)->take($take)->get();

                    $parsedDataSources = $dataSources->map(function ($ds) {
                        $type = $ds->type;

                        if ($ds->origin === 'meeting') {
                            $type = 'meeting';
                        }
                        $returnData = [
                            'data_source_id' => $ds->id,
                            'name'           => $ds->name,
                            'description'    => $ds->description ?? 'No description set',
                            'created_at'     => $ds->created_at->tz($this->user->timezone)->format(
                                'M d, Y h:i A',
                            ),
                            'type' => $type,
                        ];

                        if ($type === 'meeting') {
                            $meetingDate = $ds->meeting?->date;
                            if ($meetingDate) {
                                $returnData['meeting_date'] = Carbon::parse($meetingDate)->tz($this->user->timezone)->format(
                                    'M d, Y h:i A',
                                );
                            }
                        }

                        return $returnData;
                    });

                    return json_encode($parsedDataSources, JSON_PRETTY_PRINT);
                } catch (\Throwable $th) {
                    Log::error(
                        'Encountered an error while listing data sources: ' .
                            $th->getMessage(),
                    );
                    return 'I encountered an error while listing data sources. Please try again later.';
                }

            default:
                return parent::handleFunctionCall(
                    $functionName,
                    $arguments,
                    $orgId,
                    $pulseId,
                    $threadId,
                    $messageId,
                );
        }
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $last = $messages->last();
        $text = $last['content'] ?? '';

        return $this->processSystemThread(
            'dataSourceAgent',
            $text,
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
            $responseSchema,
        );
    }
}
