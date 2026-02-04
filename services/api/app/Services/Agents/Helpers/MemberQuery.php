<?php

namespace App\Services\Agents\Helpers;

use App\Models\PulseMember;
use App\Models\Pulse;

class MemberQuery
{
    public function __construct(protected Pulse $pulse)
    {
        
    }    

    public function getSystemPrompt(): string
    {
        $pulseId = $this->pulse->id ?? null;

        $members = collect();

        if ($pulseId) {
            $members = PulseMember::query()
                ->where('pulse_id', $pulseId)
                ->with('user:id,name,email')
                ->with('organizationGroups', function ($query) {
                    $query->where('organization_id', $this->pulse->organization_id);
                })
                ->get();
        }
        
        // Format members for LLM prompt (see TaskPipeline::formatPulseMembersForLLM)
        $membersPrompt = $members->map(function ($member) {
            $name = $member->user->name ?? 'N/A';
            $jobDescription = $member->job_description ?? 'N/A';
            $role = $member->role->value ?? 'N/A';
            $responsibilities = $member->responsibilities ?? [];
            $responsibilitiesText = is_array($responsibilities) && !empty($responsibilities)
                ? collect($responsibilities)->map(fn($item) => "- {$item}")->implode("\n")
                : '- N/A';

            $organizationGroups =  $member->organizationGroups->map(function ($group) {
                    return [
                        'name' => $group->name,
                        'description' => $group->name,
                    ];
                },
            )->implode("\n");

            return <<<TEXT
Name: {$name}
Role: {$role}
Job Description: {$jobDescription}
Responsibilities:
{$responsibilitiesText}
Organization Groups: 
{$organizationGroups}
TEXT;
        })->implode("\n\n");

        return <<<EOD
You are the **Member Expertise Agent**. Your job is to help users find the right member(s) for a task based on their job description, role, and responsibilities.

- Use the up-to-date member data below to answer queries like "Which member should be able to do gmail integration?", "Who can handle API work?", or "Find someone with frontend experience".
- Always base your answers on the structured data provided. Do not guess or invent skills.
- If no suitable member is found, respond with a friendly message and suggest clarifying or broadening the query.
- If the query is out of scope (not about member skills/expertise), reroute using the appropriate tool.

---

### Current Members
{$membersPrompt}
EOD;
    }
}
