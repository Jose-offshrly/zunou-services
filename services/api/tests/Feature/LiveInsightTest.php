<?php

namespace Tests\Feature;

use App\Models\Pulse;
use App\Services\Agents\SubAgents\MeetingAgent;
use App\Services\Agents\SubAgents\NotesAgent;
use App\Services\Agents\SubAgents\TaskAgent;
use App\Services\Agents\SubAgents\TeamChatAgent;
use App\Services\RecommendationActionType\Meeting;
use App\Services\RecommendationActionType\Note;
use App\Services\RecommendationActionType\Task;
use App\Services\RecommendationActionType\TeamChat;
use Tests\TestCase;

class LiveInsightTest extends TestCase
{
    private function getToolNames(array $functions): array
    {
        return array_map(
            fn ($tool) => $tool['function']['name'] ?? null,
            $functions
        );
    }

    // ---- TeamChatAgent ----

    public function test_team_chat_agent_returns_only_allowed_tools_when_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        $allowedTools = TeamChat::getAllowedTools('create');
        $agent = new TeamChatAgent($pulse);
        $agent->setAllowedTools($allowedTools);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        $this->assertSame(
            ['findTaskByName', 'findNoteByName', 'findMultipleTasksByName'],
            $toolNames,
            'When allowedTools is set (job context), only find* tools should be exposed; postToTeamChat must not be available.'
        );
    }

    public function test_team_chat_agent_returns_all_tools_when_not_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        $agent = new TeamChatAgent($pulse);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        $this->assertSame(
            ['askTheTeamChat', 'postToTeamChat', 'findTaskByName', 'findNoteByName', 'findMultipleTasksByName'],
            $toolNames,
            'When allowedTools is not set, all tools should be returned.'
        );
    }

    // ---- TaskAgent ----

    public function test_task_agent_returns_only_allowed_tools_when_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        $allowedTools = Task::getAllowedTools('create');
        $agent = new TaskAgent($pulse);
        $agent->setAllowedTools($allowedTools);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        // Order follows TaskAgent's $tools array (getTaskDetails before searchTasksAndTaskLists)
        $this->assertSame(
            ['queryTasks', 'searchAssignees', 'getTaskDetails', 'searchTasksAndTaskLists'],
            $toolNames,
            'When allowedTools is set (job context), only read/search task tools should be exposed.'
        );
    }

    public function test_task_agent_returns_all_tools_when_not_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        $agent = new TaskAgent($pulse);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        $expected = [
            'findDataSource',
            'retrieveMeetings',
            'createTasks',
            'createTaskList',
            'queryTasks',
            'searchAssignees',
            'getTaskDetails',
            'searchTasksAndTaskLists',
            'updateTasks',
            'deleteTask',
            'communicateWithOtherAgents',
        ];
        $this->assertSame(
            $expected,
            $toolNames,
            'When allowedTools is not set, all TaskAgent tools should be returned.'
        );
    }

    // ---- MeetingAgent ----

    public function test_meeting_agent_returns_only_allowed_tools_when_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        // create_summary uses default branch in getAllowedTools → findMeetings, getLatestMeeting only
        $allowedTools = Meeting::getAllowedTools('create_summary');
        $agent = new MeetingAgent($pulse);
        $agent->setAllowedTools($allowedTools);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        $this->assertSame(
            ['findMeetings', 'getLatestMeeting'],
            $toolNames,
            'When allowedTools is set (job context), only find/get meeting tools should be exposed.'
        );
    }

    public function test_meeting_agent_returns_all_tools_when_not_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        $agent = new MeetingAgent($pulse);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        $expected = [
            'generateMeetingSummary',
            'extractMeetingActionItems',
            'notifyNewlyCreatedMeetingSummary',
            'editMeetingSummary',
            'viewAndCreatePersonalizedVersionOfMeetingSummary',
            'getUpcommingMeetings',
            'findMeetings',
            'getLatestMeeting',
            'getMeetingSummary',
            'answerMeetingQuestion',
        ];
        $this->assertSame(
            $expected,
            $toolNames,
            'When allowedTools is not set, all MeetingAgent tools should be returned.'
        );
    }

    // ---- NotesAgent ----

    public function test_notes_agent_returns_only_allowed_tools_when_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        $allowedTools = Note::getAllowedTools(Note::CREATE_NOTE);
        $agent = new NotesAgent($pulse);
        $agent->setAllowedTools($allowedTools);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        // CREATE_NOTE allows only ['searchLabels']; NotesAgent has no searchLabels tool, so result is empty.
        $this->assertSame(
            [],
            $toolNames,
            'When allowedTools is set for CREATE_NOTE (job context), only allowed tools; createNotes must not be available.'
        );
    }

    public function test_notes_agent_returns_all_tools_when_not_set(): void
    {
        $pulse = Pulse::first();
        $this->assertNotNull($pulse, 'Need at least one pulse in DB');

        $agent = new NotesAgent($pulse);
        $toolNames = $this->getToolNames($agent->getFunctionCalls());

        $this->assertSame(
            ['createNotes', 'queryNotes', 'updateNotes', 'deleteNote', 'getNoteDetails'],
            $toolNames,
            'When allowedTools is not set, all NotesAgent tools should be returned.'
        );
    }
}
