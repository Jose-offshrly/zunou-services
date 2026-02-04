<?php

namespace App\Services\Agents\Helpers;

use App\Models\Integration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GitHubHelper
{
    protected $token;

    public function __construct(string $userId, string $pulseId)
    {
        $integration = Integration::where('user_id', $userId)
            ->where('pulse_id', $pulseId)
            ->where('type', 'github')
            ->first();

        $this->token = $integration?->api_key;

        if (! $this->token) {
            Log::warning(
                "GitHub token not found for user {$userId} and pulse {$pulseId}.",
            );
        }
    }

    /**
     * Lists open pull requests for a given repository.
     *
     * @param string $owner
     * @param string $repo
     * @return string
     */
    public function listPullRequests(string $owner, string $repo): string
    {
        $url = "https://api.github.com/repos/{$owner}/{$repo}/pulls";

        $response = Http::withToken($this->token)->get($url);

        if ($response->successful()) {
            $prs = $response->json();
            if (empty($prs)) {
                return 'There are no open pull requests.';
            }
            return collect($prs)
                ->take(5)
                ->map(
                    fn (
                        $pr,
                    ) => "- [#{$pr['number']}] {$pr['title']} by {$pr['user']['login']}",
                )
                ->join("\n");
        }

        Log::error('Failed to list PRs: ' . $response->body());
        return 'Could not retrieve pull requests.';
    }

    /**
     * Triggers a GitHub Actions workflow.
     *
     * @param string $owner
     * @param string $repo
     * @param string $workflowId
     * @param string $ref
     * @return string
     */
    public function runWorkflow(
        string $owner,
        string $repo,
        string $workflowId,
        string $ref,
    ): string {
        $url = "https://api.github.com/repos/{$owner}/{$repo}/actions/workflows/{$workflowId}/dispatches";

        $response = Http::withHeaders([
            'Accept'        => 'application/vnd.github.v3+json',
            'Authorization' => "token {$this->token}",
            'Content-Type'  => 'application/json;charset=utf-8',
        ])->post($url, [
            'ref'    => $ref,
            'inputs' => [
                'personal_token' => $this->token,
            ],
        ]);

        if ($response->successful()) {
            return "Successfully triggered workflow '{$workflowId}' on branch '{$ref}'.";
        }

        Log::error('Failed to trigger workflow: ' . $response->body());
        return 'Could not trigger the workflow.';
    }

    /**
     * Merges a specific pull request for the given repository.
     *
     * @param string $owner       The GitHub username or organization that owns the repository.
     * @param string $repo        The name of the GitHub repository.
     * @param int    $pullNumber  The number of the pull request to merge.
     * @return string             A success or error message for the user.
     */
    public function mergePullRequest(
        string $owner,
        string $repo,
        int $pullNumber,
    ): string {
        $url = "https://api.github.com/repos/{$owner}/{$repo}/pulls/{$pullNumber}/merge";

        $response = Http::withToken($this->token)->put($url, [
            'merge_method' => 'merge',
        ]);

        if ($response->successful()) {
            return "Pull request #{$pullNumber} was successfully merged.";
        }

        $error = $response->json('message') ?? $response->body();
        Log::error("Failed to merge PR #{$pullNumber}: " . $error);
        Log::error('GitHub merge failed: ' . $response->body());
        return "Could not merge the pull request: {$error}";
    }
}
