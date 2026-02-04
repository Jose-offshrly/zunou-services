<?php

namespace App\Services;

use App\Models\DataSource;
use Aws\S3\S3Client;
use Illuminate\Support\Facades\Config;

class SummarizeDataSourceService
{
    private static $prompt = '
You are an AI assistant, designed to help users gain valuable insights from their data. When a user uploads a file containing data, your task is to perform the following:

1. Analyze the data and provide a brief summary of its contents, including the types of information it contains (e.g., sales data, product information, customer demographics, etc.).

2. Based on your analysis, suggest a few sample questions that the user could ask about the data. These should be relevant and insightful questions that demonstrate the potential value of the data and the kinds of insights you can provide.

3. If applicable, recommend additional data sources that the user could upload to complement the existing data. For example, if the user has uploaded product information, you could suggest uploading sales data or customer data to gain more comprehensive insights.

Your response should be friendly, helpful, and tailored to the specific data the user has uploaded. The goal is to excite the user about the potential of their data and demonstrate the value you can provide as an AI assistant capable of generating valuable insights.

If you feel that the purpose of the data is unclear, or you cannot derive any useful insights from it, you should provide a brief explanation of why you think the data is not suitable for this task.

Your response should be formatted with Markdown. It should be no longer than 800 characters.';

    public static function perform(DataSource $dataSource)
    {
        // 1. Fetch the data from storage.
        $s3Client = new S3Client([
            'version'     => 'latest',
            'region'      => Config::get('zunou.aws.region'),
            'credentials' => [
                'key'    => Config::get('zunou.aws.key'),
                'secret' => Config::get('zunou.aws.secret'),
            ],
        ]);

        $key    = $dataSource->file_key;
        $result = $s3Client->getObject([
            'Bucket' => Config::get('zunou.s3.bucket'),
            'Key'    => $key,
        ]);
        $content = (string) $result['Body'];

        // 2. Ask the LLM to summarize it.
        $openAI   = \OpenAI::client(config('zunou.openai.api_key'));
        $response = $openAI->chat()->create([
            'model'    => Config::get('zunou.openai.model'),
            'messages' => [
                ['role' => 'system', 'content' => self::$prompt],
                ['role' => 'user', 'content' => substr($content, 0, 5000)],
                [
                    'role'    => 'user',
                    'content' => 'Data source name: '.$dataSource->name,
                ],
                [
                    'role'    => 'user',
                    'content' => 'Data source description: '.$dataSource->description,
                ],
            ],
            'n' => 1,
        ]);
        $summary             = $response['choices'][0]['message']['content'];
        $dataSource->summary = $summary;
        $dataSource->save();

        return $dataSource;
    }
}
