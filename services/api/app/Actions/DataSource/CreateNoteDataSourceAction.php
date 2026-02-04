<?php

namespace App\Actions\DataSource;

use App\Concerns\TemporaryFileHandler;
use App\Enums\DataSourceOrigin;
use App\Enums\DataSourceType;
use App\Jobs\ProcessFileDataSourceJob;
use App\Models\DataSource;
use App\Models\Note;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CreateNoteDataSourceAction
{
    use TemporaryFileHandler;

    public function __construct(
        private UploadDataSourceFileToS3Action $uploadDataSourceFileToS3Action,
    ) {
    }

    public function handle(
        Note $note,
        string $organizationId,
        string $pulseId,
        string $userId,
        ?string $customName = null,
        ?string $customDescription = null,
    ): DataSource {
        // Use custom name or default to note title
        $name = $customName ?: $note->title;

        // Use custom description or create one from note content
        $description = $customDescription ?: $this->generateDescriptionFromNote($note);

        $dataSource = Model::withoutEvents(function () use (
            $description,
            $name,
            $organizationId,
            $pulseId,
            $userId
        ) {
            $dataSource = DataSource::create([
                'id'              => (string) Str::uuid(),
                'description'     => $description,
                'name'            => $name,
                'organization_id' => $organizationId,
                'type'            => 'text', // Notes are text-based
                'pulse_id'        => $pulseId,
                'origin'          => DataSourceOrigin::CUSTOM->value,
                'is_viewable'     => true, // Notes can be viewable by default
                'created_by'      => $userId,
            ]);

            return $dataSource;
        });

        // Create temporary file with note content using TemporaryFileHandler
        $content      = $this->createNoteContent($note);
        $tempFileData = $this->storeTemporaryFile($dataSource->id, $content);

        // Upload to S3
        $fileKey = $this->uploadDataSourceFileToS3Action->handle(
            organizationId: $organizationId,
            dataSource: $dataSource,
            fileName: $tempFileData->fileName,
            tempFilePath: $tempFileData->tempFilePath,
        );

        // Set the file key using the model's built-in setter
        $dataSource->fileKey  = $fileKey;
        $dataSource->filename = $tempFileData->fileName;
        $dataSource->save();

        ProcessFileDataSourceJob::dispatch($dataSource->id)->onQueue('default');

        if ($note->files->isNotEmpty()) {
            // Create data sources for each file attached to the note
            $this->createDataSourcesFromFiles($note);
        }

        $note->data_source_id = $dataSource->id;
        $note->save();

        return $dataSource->refresh();
    }

    /**
     * Generate a description from the note content
     */
    private function generateDescriptionFromNote(Note $note): string
    {
        $content = strip_tags($note->content);

        // Take first 200 characters as description
        $description = substr($content, 0, 200);

        if (strlen($content) > 200) {
            $description .= '...';
        }

        // If content is too short or empty, use a default description
        if (strlen(trim($description)) < 10) {
            $description = "Note: {$note->title}";

            if (! empty($note->tags)) {
                $description .= ' (Tags: ' . implode(', ', $note->tags) . ')';
            }
        }

        return $description;
    }

    /**
     * Convert MIME type to DataSourceType enum value
     */
    private function mimeTypeToDataSourceType(string $mimeType): string
    {
        return match ($mimeType) {
            'application/pdf'    => DataSourceType::Pdf->value,
            'application/msword' => DataSourceType::Doc->value,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                       => DataSourceType::Docx->value,
            'text/plain'               => DataSourceType::Text->value,
            'text/html'                => DataSourceType::Html->value,
            'text/markdown'            => DataSourceType::Markdown->value,
            'application/vnd.ms-excel' => DataSourceType::Xls->value,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                            => DataSourceType::Xlsx->value,
            'application/vnd.ms-powerpoint' => DataSourceType::Ppt->value,
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                              => DataSourceType::Pptx->value,
            'application/rtf' => DataSourceType::Rtf->value,
            'text/csv'        => DataSourceType::Csv->value,
            'video/mp4'       => DataSourceType::Mp4->value,
            'image/jpeg'      => DataSourceType::Jpeg->value,
            'image/png'       => DataSourceType::Png->value,
            default           => DataSourceType::Text
                ->value, // Default to text for unknown types
        };
    }

    /**
     * Create data sources from attached files
     */
    private function createDataSourcesFromFiles(Note $note): void
    {
        // Loop through each file attached to the note
        \Log::info(
            "Creating data sources for files attached to note: {$note->title}",
        );
        foreach ($note->files as $file) {
            \Log::info("Processing file: {$file->file_name} (ID: {$file->id})");
            // Convert MIME type to DataSourceType
            $dataSourceType = $this->mimeTypeToDataSourceType($file->type);

            // Create a new DataSource for each file
            \Log::info(
                "Creating data source for file: {$file->file_name} (type: {$dataSourceType}) attached to note: {$note->title}",
            );
            $dataSource = DataSource::create([
                'id'              => (string) Str::uuid(),
                'name'            => $file->file_name,
                'description'     => "File attached to note: {$note->title}",
                'organization_id' => $note->organization_id,
                'pulse_id'        => $note->pulse_id,
                'type'            => $dataSourceType,
                'origin'          => DataSourceOrigin::CUSTOM->value,
                'is_viewable'     => true,
                'created_by'      => $note->created_by,
            ]);

            $dataSource->fileKey  = $file->path;
            $dataSource->filename = $file->file_name;
            $dataSource->save();

            $file->data_source_id = $dataSource->id;
            $file->save();
        }
    }

    /**
     * Create content string for the note
     */
    private function createNoteContent(Note $note): string
    {
        // Create content with note title and content
        $content = "# {$note->title}\n\n";
        $content .= $note->content;

        // Add tags if they exist
        if (! empty($note->tags)) {
            $content .= "\n\n**Tags:** " . implode(', ', $note->tags);
        }

        // Add pinned status
        if ($note->pinned) {
            $content .= "\n\n**Status:** Pinned";
        }

        return $content;
    }
}
