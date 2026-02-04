// Voice Agent Tools - Auto-extracted from sources/js/voice_agent_tools.js
// Generated: 2026-01-02T16:06:11.920Z
// DO NOT EDIT - This is the source of truth for Lambda

export const VOICE_AGENT_TOOLS = [
  {
    "type": "function",
    "name": "end_session",
    "description": "End the current voice session. Call this when the user says they are done, wants to stop, says goodbye, or the conversation has reached a natural conclusion.\n\nSAVING BEHAVIOR:\n- If user says \"save\", \"save it\", \"end and save\" → set should_save: true\n- If user says \"don't save\", \"no save\", \"just end\", \"discard\" → set should_save: false\n- If user doesn't specify (just \"I'm done\", \"goodbye\", \"end session\") → omit should_save to show confirmation dialog\n\nCommon triggers: \"I'm done\", \"that's all\", \"goodbye\", \"end session\", \"stop\", \"thanks, that's it\".",
    "description_mini": "End session. should_save: true=save, false=discard, omit=ask user.",
    "help_category": "session",
    "help_examples": [
      "I'm done for now",
      "Save this conversation",
      "End session"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "summary": {
          "type": "string",
          "description": "A brief 1-2 sentence summary of what was discussed and any actions taken"
        },
        "should_save": {
          "type": "boolean",
          "description": "Whether to save the session transcript as a note. true = save, false = discard. Omit this parameter to show user a confirmation dialog asking whether to save."
        }
      },
      "required": [
        "summary"
      ]
    }
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // UNIFIED TASK MANAGEMENT (Phase 2 compression - replaces 5 individual tools)
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    "type": "function",
    "name": "manage_task",
    "description": `Manage tasks with a single unified tool. Actions: create, update, complete, delete, get_details.

ACTIONS:
- create: Create new task. Requires: title. Optional: description, due_date, priority, list_name, assignee_ids
- update: Modify existing task. Requires: task_id. Can change any field.
- complete: Mark task done. Requires: task_id OR task_title (will search)
- delete: Remove task permanently. Requires: task_id. REQUIRES CONFIRMATION.
- get_details: Get full task info. Requires: task_id.

⚠️ For meeting actionables, use send_actionable_to_task instead!
⚠️ Use lookup_pulse_members FIRST before assigning to others.
⚠️ Use lookup_task_lists FIRST to see available lists.`,
    "description_mini": "create/update/complete/delete/get_details task. Use send_actionable_to_task for meeting items.",
    "help_category": "tasks",
    "help_examples": [
      "Create a task to follow up with John",
      "Mark the design review task as done",
      "Delete the old task"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "action": {
          "type": "string",
          "enum": ["create", "update", "complete", "delete", "get_details"],
          "description": "The action to perform"
        },
        "task_id": {
          "type": "string",
          "description": "Task ID or ref (e.g., 'task_1'). Required for update/delete/get_details. Optional for complete (can use task_title instead)."
        },
        "task_title": {
          "type": "string",
          "description": "For complete action only: search by title if task_id not known"
        },
        "title": {
          "type": "string",
          "description": "Task title. Required for create, optional for update."
        },
        "description": {
          "type": "string",
          "description": "Task description/notes"
        },
        "due_date": {
          "type": "string",
          "description": "Due date in YYYY-MM-DD format"
        },
        "priority": {
          "type": "string",
          "enum": ["LOW", "MEDIUM", "HIGH"],
          "description": "Task priority. Default: MEDIUM"
        },
        "status": {
          "type": "string",
          "enum": ["TODO", "INPROGRESS", "COMPLETED"],
          "description": "Task status. For update action only."
        },
        "list_name": {
          "type": "string",
          "description": "Task list name (for create) - must match existing list from lookup_task_lists"
        },
        "task_list_id": {
          "type": "string",
          "description": "Task list ID (for update) - to move task to different list"
        },
        "assignee_ids": {
          "type": "array",
          "items": { "type": "string" },
          "description": "User IDs to assign task to. Use 'self' for current user. Get IDs from lookup_pulse_members."
        }
      },
      "required": ["action"]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY INDIVIDUAL TASK TOOLS (commented out - replaced by manage_task)
  // ─────────────────────────────────────────────────────────────────────────────
  /*
  {
    "type": "function",
    "name": "create_task",
    "description": "Create a NEW standalone task for the user. Tasks can be in the Inbox or belong to a Task List.\n\n⚠️ IMPORTANT: If the user wants to create a task FROM A MEETING ACTIONABLE (action item from meeting analysis), you MUST use send_actionable_to_task instead! That tool links the task to the actionable. Use this create_task tool ONLY for brand new tasks unrelated to meeting actionables.\n\nWORKFLOW FOR STANDALONE TASKS:\n1. Use lookup_task_lists FIRST to see available lists\n2. If user mentions a category/project, match to existing list or ASK which list\n3. If assigning to someone, use lookup_pulse_members FIRST to get their user ID\n4. Tasks can ONLY be assigned to current pulse/team members\n\nBe proactive about organization - suggest lists when appropriate.",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "The task title - should be clear, actionable, and concise (e.g., \"Follow up with John about proposal\")"
        },
        "description": {
          "type": "string",
          "description": "Optional additional details, context, or notes about the task"
        },
        "due_date": {
          "type": "string",
          "description": "Due date in YYYY-MM-DD format. Infer from context like \"tomorrow\", \"next week\", \"Friday\", \"end of month\". If unclear, ask the user."
        },
        "priority": {
          "type": "string",
          "enum": [
            "LOW",
            "MEDIUM",
            "HIGH"
          ],
          "description": "Task priority. Infer from urgency words like \"urgent\", \"ASAP\", \"when you get a chance\". Default to MEDIUM if not specified."
        },
        "list_name": {
          "type": "string",
          "description": "Name of the task list to add this task to (must match an existing list name from lookup_task_lists). If not specified, task goes to Inbox. ALWAYS use lookup_task_lists first to see available lists."
        },
        "assignee_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of user IDs to assign the task to. Use \"self\" to assign to the current user. For other people, use person_N refs or user IDs from lookup_pulse_members. Tasks can ONLY be assigned to people in the current pulse/team."
        }
      },
      "required": [
        "title"
      ]
    }
  },
  END OF LEGACY create_task */
  {
    "type": "function",
    "name": "lookup_task_lists",
    "description": "Get the user's task lists. Use this when they ask about their lists, want to see how tasks are organized, before creating a task in a specific list, or before sending actionables to tasks.",
    "description_mini": "Get task lists. Call before creating task in specific list.",
    "help_category": "tasks",
    "help_examples": [
      "Show my task lists",
      "What lists do I have?"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The pulse/team ID to get task lists for. If not provided, uses the current pulse. Use this when sending actionables to a different team's task list."
        },
        "include_task_counts": {
          "type": "boolean",
          "description": "If true, include count of tasks in each list. Default true."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_task_list",
    "description": "Create a new task list to organize tasks. Use when the user wants to create a new list/category for their tasks, like \"Work Projects\" or \"Personal\".",
    "help_category": "tasks",
    "help_examples": [
      "Create a task list for the project"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "The name of the task list - descriptive and clear"
        },
        "description": {
          "type": "string",
          "description": "Optional description of what this list is for"
        }
      },
      "required": [
        "title"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_tasks",
    "description": "Search and retrieve the user's tasks. Use this when they ask about their tasks, to-do list, what they need to do, or want to review their work. Also use this before marking a task complete if you need to find the task ID.",
    "description_mini": "Search tasks. Filter by status/priority/list. Use before completing task if ID unknown.",
    "help_category": "tasks",
    "help_examples": [
      "Show my tasks for today",
      "What tasks are overdue?",
      "What's on my to-do list?"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": [
            "TODO",
            "INPROGRESS",
            "COMPLETED",
            "OVERDUE",
            "ALL"
          ],
          "description": "Filter by task status. Use TODO for active/open tasks (default), INPROGRESS for in-progress, COMPLETED for done tasks, ALL for everything."
        },
        "priority": {
          "type": "string",
          "enum": [
            "LOW",
            "MEDIUM",
            "HIGH"
          ],
          "description": "Filter by priority level. Only use if user specifically asks for high priority tasks, etc."
        },
        "list_name": {
          "type": "string",
          "description": "Filter by task list name. Use when user asks for tasks \"in [list name]\" or \"from [list name] list\". This filters tasks that belong to a specific task list/folder."
        },
        "search_query": {
          "type": "string",
          "description": "Search text to filter tasks by title or description. Use when user asks about a specific task by name."
        },
        "include_overdue": {
          "type": "boolean",
          "description": "If true, specifically highlight overdue tasks. Use when user asks \"what's overdue?\" or \"what did I miss?\""
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of tasks to return. Default is 10. Use smaller numbers for quick summaries."
        }
      }
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY: get_task_details - replaced by manage_task action: "get_details"
  // ─────────────────────────────────────────────────────────────────────────────
  /*
  {
    "type": "function",
    "name": "get_task_details",
    "description": "Get full details about a specific task including description, assignees, subtasks, and list assignment. Use when user asks about details of a particular task, who is assigned, or wants more information. Use lookup_tasks first if you need to find the task_id.",
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "string",
          "description": "The ID of the task to get details for. Required."
        }
      },
      "required": [
        "task_id"
      ]
    }
  },
  */
  {
    "type": "function",
    "name": "show_task",
    "description": "Display a task in a visual modal popup so the user can see all details on screen. Use when the user says \"show me that task\", \"let me see it\", \"display it\", or wants to visually review a task. The modal shows task title, description, assignees, priority, due date, and list. User can close the modal to continue the conversation, or navigate to the full task page (which will end the voice session).",
    "description_mini": "Display task in modal. Use task ref.",
    "help_category": "tasks",
    "help_examples": [
      "Show me that task"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "string",
          "description": "The ref (e.g., \"task_1\") or exact ID of the task to display. Use lookup_tasks first if needed. Prefer using refs."
        }
      },
      "required": [
        "task_id"
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY: complete_task, update_task, delete_task - replaced by manage_task
  // ─────────────────────────────────────────────────────────────────────────────
  /*
  {
    "type": "function",
    "name": "complete_task",
    "description": "Mark a task as completed. Use when the user says they finished something, completed a task, or want to check something off. If you don't know the task ID, first use lookup_tasks to find it by title.",
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "string",
          "description": "The ID of the task to complete. Get this from lookup_tasks if not known."
        },
        "task_title": {
          "type": "string",
          "description": "The title of the task to find and complete. Use this if task_id is not known - will search for matching task."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "update_task",
    "description": "Update an existing task's details. Can change title, description, due date, priority, status, assignees, or move to a different task list.\n\nIMPORTANT: When changing assignees, use lookup_pulse_members FIRST to get valid user IDs. Tasks can ONLY be assigned to people in the current pulse/team.",
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "string",
          "description": "The ID of the task to update (required)"
        },
        "title": {
          "type": "string",
          "description": "New title for the task"
        },
        "description": {
          "type": "string",
          "description": "New or updated description"
        },
        "due_date": {
          "type": "string",
          "description": "New due date in YYYY-MM-DD format"
        },
        "priority": {
          "type": "string",
          "enum": [
            "LOW",
            "MEDIUM",
            "HIGH"
          ],
          "description": "New priority level"
        },
        "status": {
          "type": "string",
          "enum": [
            "TODO",
            "INPROGRESS",
            "COMPLETED"
          ],
          "description": "New status. Use TODO for open, INPROGRESS for in-progress, COMPLETED for done."
        },
        "task_list_id": {
          "type": "string",
          "description": "ID of the task list to move this task into. Use this to move a task to a different list. Get the list ID from lookup_task_lists first."
        },
        "assignee_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of user IDs to assign the task to. REPLACES all existing assignees. Use \"self\" to assign to the current user. For other people, use person_N refs or user IDs from lookup_pulse_members."
        }
      },
      "required": [
        "task_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_task",
    "description": "Permanently delete a task. Use when user explicitly says \"delete this task\", \"remove that task\", \"get rid of it\". This action CANNOT be undone. Requires confirmation.",
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "string",
          "description": "The ID of the task to delete. Required. Use lookup_tasks first if needed."
        }
      },
      "required": [
        "task_id"
      ]
    }
  },
  END OF LEGACY complete_task, update_task, delete_task */
  {
    "type": "function",
    "name": "delete_task_list",
    "description": "Permanently delete a task list. WARNING: This will also delete ALL tasks in the list. Use only when user explicitly wants to remove an entire list. Requires confirmation.",
    "parameters": {
      "type": "object",
      "properties": {
        "list_id": {
          "type": "string",
          "description": "The ID of the task list to delete. Required. Use lookup_task_lists first to find the ID."
        }
      },
      "required": [
        "list_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_tasks",
    "description": "Display multiple tasks in a visual list modal so the user can see them on screen. Use when the user says \"show me my tasks\", \"let me see them\", \"display the list\", or wants to visually review multiple tasks at once. Much more efficient than describing tasks one by one. User can tap a task to see details, or close to continue conversation.",
    "description_mini": "Display tasks list modal. Get task_ids from lookup_tasks first.",
    "help_category": "tasks",
    "help_examples": [
      "Show me those tasks"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "task_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of task IDs to display. Get these from lookup_tasks first."
        },
        "title": {
          "type": "string",
          "description": "Optional title for the list modal, e.g. \"High Priority Tasks\" or \"Tasks Due Today\""
        }
      },
      "required": [
        "task_ids"
      ]
    }
  },
  {
    "type": "function",
    "name": "manage_note",
    "description": "Unified note management tool. Handles creating, updating, pinning/unpinning, deleting, and getting note details.\n\nACTIONS:\n- create: Create a new note (requires title, content)\n- update: Edit note title, content, or labels (requires note_id)\n- pin: Pin note for quick access (requires note_id)\n- unpin: Unpin a note (requires note_id)\n- delete: Permanently delete note - REQUIRES CONFIRMATION (requires note_id)\n- get_details: Get full note content (requires note_id)\n\nFor browsing/searching notes, use lookup_notes. For displaying notes visually, use show_note/show_notes.",
    "description_mini": "create/update/pin/unpin/delete/get_details note. Use lookup_notes to search.",
    "help_category": "notes",
    "help_examples": [
      "Create a note about the project update",
      "Pin the meeting notes",
      "Delete that note"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "action": {
          "type": "string",
          "enum": ["create", "update", "pin", "unpin", "delete", "get_details"],
          "description": "The action to perform"
        },
        "note_id": {
          "type": "string",
          "description": "Note ID or ref (e.g., 'note_1'). Required for update, pin, unpin, delete, get_details."
        },
        "title": {
          "type": "string",
          "description": "Note title. Required for create, optional for update."
        },
        "content": {
          "type": "string",
          "description": "Note content. Required for create, optional for update (replaces entire content)."
        },
        "append_content": {
          "type": "string",
          "description": "Content to append to existing content (for update action only, alternative to replacing)."
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Tags for categorization (e.g., ['meeting-notes', 'project-x']). For create."
        },
        "labels": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Labels to set on the note (for update, replaces existing labels)."
        },
        "pinned": {
          "type": "boolean",
          "description": "Whether to pin the note on creation. Default false."
        }
      },
      "required": ["action"]
    }
  },
  /* REPLACED BY manage_note
  {
    "type": "function",
    "name": "create_note",
    "description": "Create a note to capture information, ideas, or anything the user wants to remember. Use when they want to jot something down, save an idea, or explicitly ask to create a note.",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Note title - descriptive and searchable"
        },
        "content": {
          "type": "string",
          "description": "Note content - can be detailed, include the full context discussed"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Tags/labels for categorization (e.g., [\"meeting-notes\", \"project-x\"])"
        },
        "pinned": {
          "type": "boolean",
          "description": "Whether to pin the note for quick access. Default false."
        }
      },
      "required": [
        "title",
        "content"
      ]
    }
  },
  */
  {
    "type": "function",
    "name": "lookup_notes",
    "description": "Search for notes. Use when the user asks about something they wrote down, a previous note, or wants to find information they saved. Returns note previews - use get_note_details or show_note for full content.",
    "description_mini": "Search notes. Returns previews - use manage_note(get_details) or show_note for full content.",
    "help_category": "notes",
    "help_examples": [
      "Find my notes about the budget",
      "Show my recent notes"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "search_query": {
          "type": "string",
          "description": "Text to search for in note titles and content"
        },
        "pinned_only": {
          "type": "boolean",
          "description": "If true, only return pinned notes"
        },
        "limit": {
          "type": "number",
          "description": "Maximum notes to return. Default is 5."
        }
      }
    }
  },
  /* REPLACED BY manage_note
  {
    "type": "function",
    "name": "get_note_details",
    "description": "Get full details of a specific note including complete content. Use when user wants to know what a note says, read its content, or get more details about a note found via lookup_notes.",
    "parameters": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "description": "The ID of the note to retrieve"
        }
      },
      "required": [
        "note_id"
      ]
    }
  },
  */
  {
    "type": "function",
    "name": "show_note",
    "description": "Display a note in a visual modal so the user can read it on screen. Use when user says \"show me that note\", \"let me see it\", \"display it\". Shows full title and content. User can close to continue, or navigate to full note page.",
    "description_mini": "Display note in modal. Use note ref.",
    "help_category": "notes",
    "help_examples": [
      "Show me that note"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "description": "The ref (e.g., \"note_1\") or exact ID of the note to display. Prefer using refs from lookup_notes."
        }
      },
      "required": [
        "note_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_notes",
    "description": "Display multiple notes in a list modal for the user to browse. Use when showing search results visually, or when user wants to see several notes at once. User can tap a note to see full details.",
    "description_mini": "Display notes list modal. Get note_ids from lookup_notes first.",
    "help_category": "notes",
    "help_examples": [
      "Show me those notes"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "note_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of note refs or IDs to display (e.g., [\"note_1\", \"note_2\"])"
        },
        "title": {
          "type": "string",
          "description": "Title for the list modal (e.g., \"Search Results\", \"Pinned Notes\")"
        }
      },
      "required": [
        "note_ids"
      ]
    }
  },
  /* REPLACED BY manage_note
  {
    "type": "function",
    "name": "update_note",
    "description": "Edit an existing note - change its title, content, or labels/tags. Use when user says \"change that note\", \"update the title\", \"add to that note\", \"edit\", \"tag this\", \"add labels\". Requires confirmation.",
    "parameters": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "description": "The ID of the note to update"
        },
        "title": {
          "type": "string",
          "description": "New title (if changing)"
        },
        "content": {
          "type": "string",
          "description": "New content (if changing) - replaces entire content"
        },
        "append_content": {
          "type": "string",
          "description": "Content to append to existing content (alternative to replacing)"
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Labels/tags to set on the note (replaces existing labels). Use lowercase strings like \"work\", \"personal\", \"urgent\""
        }
      },
      "required": [
        "note_id"
      ]
    }
  },
  */
  /* REPLACED BY manage_note
  {
    "type": "function",
    "name": "pin_note",
    "description": "Pin a note so it appears at the top of the notes list for quick access. Use when user says \"pin this note\", \"keep this handy\", \"favorite this\".",
    "parameters": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "description": "The ID of the note to pin"
        }
      },
      "required": [
        "note_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "unpin_note",
    "description": "Unpin a note. Use when user says \"unpin this\", \"remove from pinned\".",
    "parameters": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "description": "The ID of the note to unpin"
        }
      },
      "required": [
        "note_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_note",
    "description": "Permanently delete a note. This is destructive and requires confirmation. Use when user explicitly says \"delete this note\", \"remove it\", \"get rid of it\".",
    "parameters": {
      "type": "object",
      "properties": {
        "note_id": {
          "type": "string",
          "description": "The ID of the note to delete"
        }
      },
      "required": [
        "note_id"
      ]
    }
  },
  */
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_note_view",
    "description": "Close the note view modal. Call when user says \"close\", \"dismiss\", \"okay\", \"got it\" while viewing a note.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_notes_list",
    "description": "Close the notes list modal. Call when user says \"close\", \"dismiss\" while viewing a list of notes.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "lookup_events",
    "description": "Search calendar events and meetings. Use when the user asks about their schedule, what meetings they have, or what's coming up. Returns a list of events with basic info.\n\nIMPORTANT: After getting events from this function:\n- For PAST events (dates before today): use show_past_event to display them\n- For UPCOMING events (dates today or future): use show_event to display them\n\nThe response includes pagination info. If has_more_pages is true, you can call again with a higher page number to get more events.\n\nThe event_id returned here can be used with EITHER show function depending on the event's date.\n\nATTENDEE SEARCH: You can search by attendee name (e.g., \"Ricky\", \"John\"). The search checks both event titles AND attendee names. Results include an \"attendees\" field with participant names for easy reference.",
    "description_mini": "Search calendar events. Use show_event (upcoming) or show_past_event (past) to display. Supports attendee search.",
    "help_category": "calendar",
    "help_examples": [
      "What's on my calendar today?",
      "Am I free tomorrow at 2pm?",
      "Show my meetings this week"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "date_from": {
          "type": "string",
          "description": "Start date in YYYY-MM-DD format. Default is today."
        },
        "date_to": {
          "type": "string",
          "description": "End date in YYYY-MM-DD format. Default is 7 days from now."
        },
        "search_query": {
          "type": "string",
          "description": "Filter events by name/title OR attendee name. Searches both event titles and participant names."
        },
        "timeframe": {
          "type": "string",
          "enum": [
            "upcoming",
            "past",
            "today",
            "tomorrow",
            "this_week",
            "next_week"
          ],
          "description": "Quick filter for common timeframes. Overrides date_from/date_to if provided."
        },
        "has_recording": {
          "type": "boolean",
          "description": "Filter to only events with meeting recordings/transcripts"
        },
        "limit": {
          "type": "number",
          "description": "Maximum events per page. Default is 20 for date range/timeframe queries."
        },
        "page": {
          "type": "number",
          "description": "Page number for pagination (1-based). Use when has_more_pages was true in previous response."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_event_details",
    "description": "Get full details for a specific event including attendees, agenda items, talking points, meeting link, importance, and description. Use when user asks about a specific meeting.",
    "description_mini": "Get event details: attendees, agenda, talking points, meeting link.",
    "help_category": "calendar",
    "help_examples": [],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the event (used to search if ID not known)"
        },
        "date_hint": {
          "type": "string",
          "description": "Approximate date of the event to help narrow search (YYYY-MM-DD)"
        }
      }
    }
  },
  {
    "type": "function",
    "name": "show_event",
    "description": "Display an upcoming or current event in a visual modal showing all details. Use when user says \"show me\", \"let me see\", \"display\", or wants to visually review an event.\n\nIMPORTANT: Use the ref (e.g., \"event_1\", \"event_2\") or exact event_id from a previous lookup_events or lookup_event_details call. Refs are preferred as they are simpler and guaranteed to work within this session. Do NOT make up or guess IDs.\n\nNote: This is for UPCOMING/CURRENT events. For past events with recordings, use show_past_event instead.",
    "description_mini": "Display upcoming event modal. Use event ref. For past events use show_past_event.",
    "help_category": "calendar",
    "help_examples": [
      "Show me that meeting"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ref (e.g., \"event_1\") or exact ID of the event from lookup_events. Prefer using the ref."
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_events",
    "description": "Display multiple events in a list modal. Use when user wants to see several events or browse their schedule visually.\n\n⚠️ CRITICAL: Event refs are DATE-SCOPED. You MUST call lookup_events or lookup_past_events FIRST to get valid refs for the date range the user is asking about.\n- If showing TODAY's events, call lookup_events(timeframe: \"today\") first\n- If showing PAST events, call lookup_past_events with the correct date range first\n- DO NOT reuse refs from a previous lookup for a different date - they will not display correctly\n- If this function shows fewer events than expected, the refs are stale - make a new lookup query\n\nPAGINATION: If there are more events than displayed, pass pagination info from the lookup response. The modal will show \"Page X of Y\" and voice navigation hints.",
    "description_mini": "Display events list. Refs are DATE-SCOPED - call lookup_events first for correct date range.",
    "help_category": "calendar",
    "help_examples": [
      "Show me those events"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of event refs from a RECENT lookup for the correct date range (e.g., [\"event_1\", \"event_2\"]). Must be from lookup_events or lookup_past_events for the date you want to show."
        },
        "title": {
          "type": "string",
          "description": "Title for the list modal (e.g., \"This Week's Meetings\", \"Upcoming Events\")"
        },
        "pagination": {
          "type": "object",
          "description": "Pagination info from the lookup response. Pass this to show page navigation.",
          "properties": {
            "current_page": {
              "type": "number"
            },
            "last_page": {
              "type": "number"
            },
            "total": {
              "type": "number"
            },
            "has_more_pages": {
              "type": "boolean"
            }
          }
        }
      },
      "required": [
        "event_ids"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_event_view",
    "description": "Close the event view modal. Call when user says \"close\", \"dismiss\", \"okay\", \"got it\" while viewing an event.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_events_list",
    "description": "Close the events list modal. Call when user says \"close\", \"dismiss\" while viewing a list of events.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "create_event",
    "description": "Create a new calendar event. REQUIRES CONFIRMATION. Use when user wants to schedule a meeting, add something to their calendar, or book time.\n\nIMPORTANT WORKFLOW:\n1. If user doesn't specify duration or end time, ASK \"How long should this be?\" (default 1 hour if they say \"standard\" or \"normal\")\n2. ASK about location: \"Where will this meeting take place? Is it online or in-person?\" Options:\n   - Online: Set add_google_meet=true and enable notetaker\n   - In-person: Ask for location/room name\n   - Hybrid: Can do both (location + Google Meet)\n3. For online meetings with notetaker: After creating the event, call enable_notetaker with the meeting_session_id from this response\n4. Always confirm: name, date, start time, duration, and location/online setting before creating\n\n⚠️ SCHEDULING CONFLICTS - DO NOT GUESS:\n- The system automatically checks for conflicts when creating events\n- Do NOT try to calculate conflicts yourself - you may get it wrong\n- Two events ONLY conflict if their time ranges OVERLAP (e.g., 1:00-2:00 PM overlaps with 1:30-2:30 PM)\n- Events that are BACK-TO-BACK do NOT conflict (e.g., 1:00-2:00 PM and 2:00-3:00 PM are fine)\n- Events at DIFFERENT times do NOT conflict (e.g., 1:30 PM does NOT conflict with 3:00 PM)\n- If the system detects a real conflict, it will tell you in the response\n\n⚠️ CRITICAL - ATTENDEE EMAILS:\n- NEVER guess or fabricate emails. NEVER use \"user@example.com\" or similar placeholders\n- ALWAYS call lookup_org_members FIRST to find the person by name\n- Use ONLY the exact email returned from lookup_org_members\n- If person not found: ASK user to spell out the email, then CONFIRM it back before using\n- Wrong emails = strangers invited to private meetings = SERIOUS security issue\n\nRESPONSE: When add_google_meet=true, the response includes meeting_session_id. Use this when calling enable_notetaker.\n\nCommon durations: 30 min, 1 hour (default), 90 min, 2 hours",
    "description_mini": "Create calendar event. REQUIRES CONFIRMATION. Ask for duration if not given (default 1hr). Ask online/in-person. For online: add_google_meet=true, then call enable_notetaker with meeting_session_id. System auto-checks conflicts. NEVER guess attendee emails - use lookup_org_members first.",
    "help_category": "calendar",
    "help_examples": [
      "Schedule a meeting with Sarah for Friday",
      "Book a 30 minute call tomorrow at 2pm"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Event title/name"
        },
        "date": {
          "type": "string",
          "description": "Date in YYYY-MM-DD format"
        },
        "start_time": {
          "type": "string",
          "description": "Start time in HH:MM format (24-hour). e.g., \"14:30\" for 2:30 PM"
        },
        "end_time": {
          "type": "string",
          "description": "End time in HH:MM format (24-hour). For overnight events (e.g., 10pm to 2am), just provide the times - system auto-detects next day.",
          "description_mini": "End time HH:MM (24hr). System handles overnight."
        },
        "end_date": {
          "type": "string",
          "description": "End date in YYYY-MM-DD format. ONLY for multi-day events spanning multiple calendar days (conferences, retreats). Do NOT use for simple overnight events.",
          "description_mini": "YYYY-MM-DD. Only for multi-day events (conferences)."
        },
        "duration_minutes": {
          "type": "number",
          "description": "Alternative to end_time - specify duration in minutes. e.g., 30 for 30 min meeting, 60 for 1 hour. If provided, end_time is calculated automatically.",
          "description_mini": "Duration in minutes (alternative to end_time)."
        },
        "description": {
          "type": "string",
          "description": "Event description or notes"
        },
        "location": {
          "type": "string",
          "description": "Location (e.g., \"Conference Room A\", \"Online\", \"123 Main St\")"
        },
        "priority": {
          "type": "string",
          "enum": [
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT"
          ],
          "description": "Event importance/priority. In UI this is shown as \"Importance\".",
          "description_mini": "Importance level."
        },
        "attendees": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "⚠️ VALIDATED EMAILS ONLY. Must be real emails from lookup_org_members OR lookup_contacts OR explicitly spelled out and confirmed by user. NEVER guess emails.",
          "description_mini": "Emails from lookup_org_members/lookup_contacts. NEVER guess."
        },
        "add_google_meet": {
          "type": "boolean",
          "description": "Whether to create and attach a Google Meet link"
        }
      },
      "required": [
        "name",
        "date",
        "start_time"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_event",
    "description": "Update an existing event. REQUIRES CONFIRMATION. Changes sync to Google Calendar if linked.\\n\\n⚠️ CRITICAL - ATTENDEE EMAILS:\\n- NEVER guess or fabricate emails. NEVER use \"user@example.com\" or similar placeholders\\n- ALWAYS call lookup_org_members FIRST to find the person by name\\n- Use ONLY the exact email returned from lookup_org_members\\n- If person not found: ASK user to spell out the email, then CONFIRM it back before using\\n- Wrong emails = strangers invited to private meetings = SERIOUS security issue\\n\\nATTENDEE OPERATIONS:\\n- Use \"add_attendees\" when user says \"add X to the meeting\" - this PRESERVES existing attendees\\n- Use \"attendees\" ONLY when you have the complete list and want to replace everyone\\n\\nTIME HANDLING: When changing start_time, the end_time automatically shifts to maintain the original duration.",
    "description_mini": "Update event. REQUIRES CONFIRMATION. Syncs to Google if linked. NEVER guess emails - use lookup_org_members. Use add_attendees to ADD people, attendees to REPLACE all.",
    "help_category": "calendar",
    "help_examples": [
      "Move the meeting to 3pm",
      "Add John to the budget meeting"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event to update"
        },
        "name": {
          "type": "string",
          "description": "New event title (if changing)"
        },
        "date": {
          "type": "string",
          "description": "New date in YYYY-MM-DD format (if rescheduling)"
        },
        "start_time": {
          "type": "string",
          "description": "New start time in HH:MM format (if changing)"
        },
        "end_time": {
          "type": "string",
          "description": "New end time in HH:MM format (if changing). For same-day events, just provide the time. For overnight events (e.g., 10pm to 2am), the system auto-detects next day."
        },
        "end_date": {
          "type": "string",
          "description": "End date in YYYY-MM-DD format. ONLY use this for multi-day events that span more than one calendar day (e.g., conferences, retreats). For overnight events like \"10pm to 2am\", do NOT use this - the system handles it automatically."
        },
        "description": {
          "type": "string",
          "description": "New description (if changing)"
        },
        "location": {
          "type": "string",
          "description": "New location (if changing)"
        },
        "priority": {
          "type": "string",
          "enum": [
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT"
          ],
          "description": "New importance/priority (if changing)"
        },
        "attendees": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "⚠️ VALIDATED EMAILS ONLY. Replaces ALL existing attendees. Must be real emails from lookup_org_members OR lookup_contacts OR explicitly spelled out and confirmed by user."
        },
        "add_attendees": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "⚠️ VALIDATED EMAILS ONLY. ADDs to existing attendees without removing anyone. Must be real emails from lookup_org_members OR lookup_contacts OR explicitly spelled out and confirmed by user."
        },
        "sync_to_google": {
          "type": "boolean",
          "description": "Whether to sync changes to Google Calendar (only if event is linked). Default true if linked."
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_event",
    "description": "Delete an event from the calendar. REQUIRES CONFIRMATION.\n\nIMPORTANT - GOOGLE CALENDAR:\n1. BEFORE calling this function, check if the event has a Google Meet link or was synced from Google Calendar\n2. If it's a Google-linked event, ASK the user: \"Should I also remove this from your Google Calendar, or just from Zunou?\"\n3. Set delete_from_google=true ONLY if user explicitly confirms they want it removed from Google too\n4. If user says \"just delete it\" without specifying, default to delete_from_google=false to be safe\n5. Always confirm what will happen: \"I'll delete [event name] from Zunou\" or \"I'll delete [event name] from both Zunou and Google Calendar\"",
    "description_mini": "Delete event. REQUIRES CONFIRMATION. Ask about Google Calendar sync before deleting.",
    "help_category": "calendar",
    "help_examples": [
      "Cancel the budget meeting"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event to delete"
        },
        "delete_from_google": {
          "type": "boolean",
          "description": "Set to true ONLY if user explicitly confirms they want the event removed from Google Calendar as well. Default to false if not specified."
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_calendar_availability",
    "description": "Find free time slots on a given day or date range. Returns available slots with context about surrounding meetings.\n\nUse this when user asks:\n- \"When am I free today?\"\n- \"Do I have time for a 30-minute call tomorrow?\"\n- \"What's my availability this week?\"\n- \"Find me an hour between 2 and 5pm\"\n\nThe response includes:\n- Free slots with duration\n- Events before and after each slot (for context like \"free at 2pm, but you have Budget Meeting at 1pm and Team Sync at 3:30pm\")\n- Whether slots fall within preferred work hours\n\nFor visual display, use show_availability after getting the data.",
    "description_mini": "Find free time slots. Use show_availability for visual display after.",
    "help_category": "calendar",
    "help_examples": [
      "When am I free today?",
      "Do I have time for a 30-minute call tomorrow?"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "description": "Date to check availability (YYYY-MM-DD). Defaults to today if not specified."
        },
        "date_from": {
          "type": "string",
          "description": "Start of date range (YYYY-MM-DD). Use for multi-day queries."
        },
        "date_to": {
          "type": "string",
          "description": "End of date range (YYYY-MM-DD). Use for multi-day queries."
        },
        "min_duration": {
          "type": "number",
          "description": "Minimum free slot duration in minutes. Default 30. Use 60 for hour slots, 15 for quick calls."
        },
        "preferred_start": {
          "type": "string",
          "description": "Preferred earliest time (HH:MM in 24h format, e.g., \"09:00\"). Default is 08:00."
        },
        "preferred_end": {
          "type": "string",
          "description": "Preferred latest time (HH:MM in 24h format, e.g., \"17:00\"). Default is 18:00."
        },
        "time_preference": {
          "type": "string",
          "enum": [
            "morning",
            "afternoon",
            "evening",
            "any"
          ],
          "description": "Time of day preference. Morning=8am-12pm, Afternoon=12pm-5pm, Evening=5pm-8pm."
        }
      },
      "required": []
    }
  },
  {
    "type": "function",
    "name": "show_availability",
    "description": "Display calendar availability in a beautiful visual timeline modal. Shows the day with hour markers, events as colored blocks, and free slots highlighted.\n\nUse this AFTER lookup_calendar_availability when user wants to SEE their availability visually.\n\nIMPORTANT: Pass the events and free_slots arrays EXACTLY as returned from lookup_calendar_availability. Do NOT modify the datetime strings - do not add \"Z\" suffix or convert timezones. The times are already in the user's local timezone.\n\nFeatures:\n- Hour-by-hour timeline view\n- Events shown as colored blocks (color by importance)\n- Free slots clearly highlighted with duration\n- Suggested meeting times prominently displayed\n- Real-time: modal updates when user says \"show me tomorrow\" or \"what about next Monday\"\n\nUser can:\n- Tap a free slot to select it (for creating an event)\n- Navigate to previous/next day\n- See at a glance where they have time",
    "description_mini": "Show visual timeline of calendar. Use AFTER lookup_calendar_availability. Pass events/free_slots arrays EXACTLY as returned.",
    "help_category": "calendar",
    "help_examples": [
      "Show me my availability"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "description": "Date to display (YYYY-MM-DD)"
        },
        "events": {
          "type": "array",
          "description": "Array of events for this day from lookup_calendar_availability. Pass EXACTLY as returned, do not modify datetime strings.",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "start": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "end": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "importance": {
                "type": "string",
                "enum": [
                  "Critical",
                  "High",
                  "Medium",
                  "Low"
                ]
              }
            }
          }
        },
        "free_slots": {
          "type": "array",
          "description": "Array of free slots from lookup_calendar_availability. Pass EXACTLY as returned, do not modify datetime strings.",
          "items": {
            "type": "object",
            "properties": {
              "start": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "end": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "duration": {
                "type": "number",
                "description": "Duration in minutes"
              },
              "before_event": {
                "type": "string",
                "description": "Name of event before this slot"
              },
              "after_event": {
                "type": "string",
                "description": "Name of event after this slot"
              }
            }
          }
        },
        "suggested_slots": {
          "type": "array",
          "description": "AI-recommended best slots (optional)",
          "items": {
            "type": "object",
            "properties": {
              "start": {
                "type": "string"
              },
              "end": {
                "type": "string"
              },
              "duration": {
                "type": "number"
              },
              "reason": {
                "type": "string",
                "description": "Why this slot is recommended"
              }
            }
          }
        },
        "title": {
          "type": "string",
          "description": "Optional title for the modal (e.g., \"Your Availability\" or \"Finding time for Budget Review\")"
        }
      },
      "required": [
        "date",
        "events",
        "free_slots"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_availability_view",
    "description": "Update the availability modal to show a different day. Use when user says things like \"show me tomorrow instead\" or \"what about Monday?\" while the availability modal is open.\n\nIMPORTANT: You must call lookup_calendar_availability for the new date FIRST to get the events and free_slots data. Do NOT pass empty arrays - always fetch fresh data before updating the view.\n\nPass the events and free_slots arrays EXACTLY as returned from lookup_calendar_availability. Do NOT modify the datetime strings.\n\nThis is more efficient than closing and re-opening the modal.",
    "description_mini": "Update availability modal for different day. Call lookup_calendar_availability FIRST.",
    "help_category": "calendar",
    "parameters": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "description": "New date to display (YYYY-MM-DD)"
        },
        "events": {
          "type": "array",
          "description": "Events for the new date. Pass EXACTLY as returned from lookup_calendar_availability.",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "start": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "end": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "importance": {
                "type": "string",
                "enum": [
                  "Critical",
                  "High",
                  "Medium",
                  "Low"
                ]
              }
            }
          }
        },
        "free_slots": {
          "type": "array",
          "description": "Free slots for the new date. Pass EXACTLY as returned from lookup_calendar_availability.",
          "items": {
            "type": "object",
            "properties": {
              "start": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "end": {
                "type": "string",
                "description": "Local datetime string (pass exactly as returned)"
              },
              "duration": {
                "type": "number",
                "description": "Duration in minutes"
              },
              "before_event": {
                "type": "string"
              },
              "after_event": {
                "type": "string"
              }
            }
          }
        },
        "suggested_slots": {
          "type": "array",
          "description": "Updated suggested slots (optional)",
          "items": {
            "type": "object",
            "properties": {
              "start": {
                "type": "string"
              },
              "end": {
                "type": "string"
              },
              "duration": {
                "type": "number"
              },
              "reason": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "date",
        "events",
        "free_slots"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_availability_view",
    "description": "Close the availability modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "lookup_event_agendas",
    "description": "Get the agenda items for an event. Agendas are visible to all meeting attendees. IMPORTANT: You must use lookup_events first to get the event_id (UUID format).",
    "help_category": "meeting-prep",
    "help_examples": [
      "What's on the agenda for my next meeting?",
      "Show me the agenda for the budget review"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The UUID of the event (e.g., \"9cb4f090-a10f-46de-add5-2f84ba402d92\"). Get this from lookup_events first."
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "create_agenda_item",
    "description": "Add an agenda item to a meeting. Agendas help structure meetings and are shared with all attendees. IMPORTANT: You must use lookup_events first to get the event_id (UUID format).",
    "help_category": "meeting-prep",
    "help_examples": [
      "Add 'Review Q3 numbers' to the agenda",
      "Put budget discussion on the meeting agenda"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The UUID of the event to add agenda to (e.g., \"9cb4f090-a10f-46de-add5-2f84ba402d92\"). Get this from lookup_events first."
        },
        "text": {
          "type": "string",
          "description": "The agenda item text"
        }
      },
      "required": [
        "event_id",
        "text"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_agenda_item",
    "description": "Edit an existing agenda item text.",
    "help_category": "meeting-prep",
    "parameters": {
      "type": "object",
      "properties": {
        "agenda_id": {
          "type": "string",
          "description": "The ID of the agenda item to update"
        },
        "text": {
          "type": "string",
          "description": "The new text for the agenda item"
        },
        "current_text": {
          "type": "string",
          "description": "The current text of the agenda item (for confirmation display)"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the event this agenda belongs to (for confirmation display)"
        }
      },
      "required": [
        "agenda_id",
        "text"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_agenda_item",
    "description": "Remove an agenda item from a meeting.",
    "help_category": "meeting-prep",
    "parameters": {
      "type": "object",
      "properties": {
        "agenda_id": {
          "type": "string",
          "description": "The ID of the agenda item to delete"
        },
        "agenda_text": {
          "type": "string",
          "description": "The text of the agenda item being deleted (for confirmation display)"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the event this agenda belongs to (for confirmation display)"
        }
      },
      "required": [
        "agenda_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_talking_points",
    "description": "Get the user's personal talking points for an event. These are PRIVATE - only the event owner can see them. Like a personal checklist for the meeting.",
    "help_category": "meeting-prep",
    "help_examples": [
      "What are my talking points for the standup?",
      "Show my personal notes for the meeting"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event"
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "create_talking_point",
    "description": "Add a personal talking point/reminder for a meeting. These are private and only visible to you.",
    "help_category": "meeting-prep",
    "help_examples": [
      "Remind me to ask about the timeline",
      "Add a talking point to mention the budget issue"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event"
        },
        "text": {
          "type": "string",
          "description": "The talking point text"
        }
      },
      "required": [
        "event_id",
        "text"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_talking_point",
    "description": "Edit a talking point or mark it as complete/incomplete.",
    "help_category": "meeting-prep",
    "parameters": {
      "type": "object",
      "properties": {
        "talking_point_id": {
          "type": "string",
          "description": "The ID of the talking point"
        },
        "text": {
          "type": "string",
          "description": "New text (if editing)"
        },
        "complete": {
          "type": "boolean",
          "description": "Mark as complete (true) or incomplete (false)"
        },
        "current_text": {
          "type": "string",
          "description": "The current text of the talking point (for confirmation display)"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the event this talking point belongs to (for confirmation display)"
        }
      },
      "required": [
        "talking_point_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "complete_talking_point",
    "description": "Mark a talking point as done/checked off.",
    "help_category": "meeting-prep",
    "parameters": {
      "type": "object",
      "properties": {
        "talking_point_id": {
          "type": "string",
          "description": "The ID of the talking point to complete"
        },
        "talking_point_text": {
          "type": "string",
          "description": "The text of the talking point (for confirmation display)"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the event this talking point belongs to (for confirmation display)"
        }
      },
      "required": [
        "talking_point_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_talking_point",
    "description": "Remove a talking point from a meeting.",
    "help_category": "meeting-prep",
    "parameters": {
      "type": "object",
      "properties": {
        "talking_point_id": {
          "type": "string",
          "description": "The ID of the talking point to delete"
        },
        "talking_point_text": {
          "type": "string",
          "description": "The text of the talking point being deleted (for confirmation display)"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the event this talking point belongs to (for confirmation display)"
        }
      },
      "required": [
        "talking_point_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_meeting_session",
    "description": "Get the meeting session status for an event - whether notetaker is enabled, recording status, etc.",
    "help_category": "meetings",
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event"
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "attach_google_meet",
    "description": "Add a Google Meet link to an event. This creates a meeting session that enables the notetaker bot.\n\nIMPORTANT: This returns a meeting_session_id in the response. If you need to call enable_notetaker immediately after, pass this meeting_session_id to it.",
    "description_mini": "Add Google Meet to event. Returns meeting_session_id for enable_notetaker.",
    "help_category": "meetings",
    "help_examples": [
      "Add a Meet link to my next meeting",
      "Set up Google Meet for the standup"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event to add Google Meet to"
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "enable_notetaker",
    "description": "Turn on the notetaker bot for a meeting. The bot will join and record the meeting.\n\nIMPORTANT: If you just called attach_google_meet, you MUST pass the meeting_session_id from that response to this function. Otherwise the notetaker may fail to enable due to timing issues.",
    "description_mini": "Enable notetaker bot. Pass meeting_session_id from attach_google_meet if just called.",
    "help_category": "meetings",
    "help_examples": [
      "Enable notetaker for my 2pm meeting",
      "Turn on recording for the standup"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event"
        },
        "meeting_session_id": {
          "type": "string",
          "description": "The meeting session ID. REQUIRED if you just called attach_google_meet - use the meeting_session_id from that response."
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "disable_notetaker",
    "description": "Turn off the notetaker bot for a meeting. The bot will NOT join or record.",
    "help_category": "meetings",
    "help_examples": [
      "Disable notetaker for the next meeting",
      "Turn off recording for the 1-on-1"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event"
        },
        "meeting_session_id": {
          "type": "string",
          "description": "The meeting session ID (if known)"
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "stop_meeting_session",
    "description": "Stop an active recording session. REQUIRES CONFIRMATION. This ends the notetaker bot recording immediately.",
    "help_category": "meetings",
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event"
        },
        "meeting_session_id": {
          "type": "string",
          "description": "The meeting session ID"
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_past_events",
    "description": "Search for past meetings and events. Use when the user asks about past meetings, what meetings happened, or wants to find a specific recorded meeting.\n\nReturns events that have already occurred, with indicators for which ones have recordings available.\n\nThe response includes pagination info. If has_more_pages is true, you can call again with a higher page number to get more events.\n\nCommon use cases:\n- \"What meetings did I have last week?\"\n- \"Find the meeting about budget from last month\"\n- \"Show me my recorded meetings\"\n- \"What was the last meeting with the sales team?\"",
    "description_mini": "Search past meetings. Returns recording indicators. Supports pagination.",
    "help_category": "meetings",
    "help_examples": [
      "What meetings did I have yesterday?",
      "Show me my recorded meetings from last week"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "search_query": {
          "type": "string",
          "description": "Filter events by name/title keyword"
        },
        "date_from": {
          "type": "string",
          "description": "Start date in YYYY-MM-DD format. Default is 30 days ago."
        },
        "date_to": {
          "type": "string",
          "description": "End date in YYYY-MM-DD format. Default is today."
        },
        "has_recording": {
          "type": "boolean",
          "description": "If true, only return events that have meeting recordings/transcripts"
        },
        "limit": {
          "type": "number",
          "description": "Maximum events per page. Default is 20 for date range queries, 10 otherwise."
        },
        "page": {
          "type": "number",
          "description": "Page number for pagination (1-based). Use when has_more_pages was true in previous response."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_meeting_transcript",
    "description": "Get the transcript from a recorded meeting. Use when the user asks what was discussed, said, or covered in a past meeting.\n\nIMPORTANT: Use the ref (e.g., \"event_1\", \"event_2\") from a previous lookup_events, lookup_past_events, or show_past_event call. Refs are preferred as they are simpler and guaranteed to work within this session. Do NOT make up or guess event IDs.\n\nCommon use cases:\n- \"What did we discuss in the Q4 planning meeting?\"\n- \"Did anyone mention the budget in yesterday's meeting?\"\n- \"Show me the transcript from the meeting with John\"",
    "description_mini": "Get meeting transcript. Use event ref.",
    "help_category": "meetings",
    "help_examples": [
      "What did we discuss in yesterday's standup?",
      "Show me the transcript from the budget meeting"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ref (e.g., \"event_1\") or exact ID of the event from a previous lookup. Prefer using the ref. NEVER guess or fabricate an ID."
        },
        "event_name": {
          "type": "string",
          "description": "The name of the meeting (used to search if event_id/ref not available)"
        },
        "search_query": {
          "type": "string",
          "description": "Optional: specific topic or keyword to search for in the transcript"
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_meeting_actionables",
    "description": "Get action items that came out of a meeting. Use when the user asks about follow-ups, action items, or what needs to be done from a meeting.\n\nIMPORTANT RULES:\n1. Use the ref (e.g., \"event_1\", \"event_2\") from a previous lookup_events, lookup_past_events, or show_past_event call. NEVER make up or guess event IDs.\n2. After calling this function, you MUST tell the user the actual results using the \"speak_to_user\" field from the response.\n3. If actionables are found, tell the user how many and list them (or summarize if many).\n4. If no actionables are found, tell the user explicitly that none were found.\n5. NEVER fabricate or guess event IDs when talking to the user - only use the event_id and event_name from the response.\n\nCommon use cases:\n- \"What are the action items from the standup?\"\n- \"Show me the follow-ups from the Q4 planning meeting\"\n- \"What needs to be done from yesterday's sync?\"",
    "description_mini": "Get meeting action items. Use event ref. Must communicate results to user.",
    "help_category": "actionables",
    "help_examples": [
      "What are the action items from the standup?",
      "Show me follow-ups from yesterday's meeting"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ref (e.g., \"event_1\") or exact ID of the event from a previous lookup. Prefer using the ref. NEVER guess or fabricate an ID."
        },
        "event_name": {
          "type": "string",
          "description": "The name of the meeting (used to search if event_id/ref not available)"
        },
        "status": {
          "type": "string",
          "enum": [
            "PENDING",
            "COMPLETED",
            "ALL"
          ],
          "description": "Filter actionables by completion status. Default shows all."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_meeting_summary",
    "description": "Get the AI-generated summary and highlights from a recorded meeting. Returns the TL;DR, overview paragraphs, attendees, and keywords/tags.\n\n⚠️ WARNING: The \"has_transcript\", \"has_actionables\", \"has_takeaways\" flags in this response may be INACCURATE.\n- To get actual ACTION ITEMS, always call lookup_meeting_actionables\n- To get actual TAKEAWAYS, always call lookup_meeting_takeaways  \n- To get actual TRANSCRIPT, always call lookup_meeting_transcript\n- Do NOT assume data doesn't exist based on has_* flags - always query specifically when user asks\n\nIMPORTANT: Use the ref (e.g., \"event_1\", \"event_2\") from a previous lookup_events, lookup_past_events, or show_past_event call. Refs are preferred as they are simpler and guaranteed to work within this session. Do NOT make up or guess event IDs.\n\nThis is the \"Highlights\" tab data from past events. For strategies/takeaways, use lookup_meeting_takeaways. For sentiment and analytics, use lookup_meeting_analytics.\n\nCommon use cases:\n- \"Give me the summary of the Q4 planning meeting\"\n- \"What were the key points from yesterday's standup?\"\n- \"Summarize the meeting with the client\"",
    "description_mini": "Get meeting summary/highlights. Use event ref. has_* flags may be inaccurate - always query specific data.",
    "help_category": "meetings",
    "help_examples": [
      "Summarize my last meeting",
      "What were the key points from the standup?"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ref (e.g., \"event_1\") or exact ID of the event from a previous lookup. Prefer using the ref. NEVER guess or fabricate an ID."
        },
        "event_name": {
          "type": "string",
          "description": "The name of the meeting (used to search if event_id/ref not available)"
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_meeting_takeaways",
    "description": "Get the strategies, takeaways, and key learnings from a recorded meeting. These are actionable insights extracted from the meeting.\n\nIMPORTANT: Use the ref (e.g., \"event_1\", \"event_2\") from a previous lookup_events, lookup_past_events, or show_past_event call. Refs are preferred as they are simpler and guaranteed to work within this session. Do NOT make up or guess event IDs.\n\nThis is the \"Take Aways\" tab data from past events. Different from actionables (which are specific follow-up tasks).\n\nCommon use cases:\n- \"What were the takeaways from the strategy meeting?\"\n- \"What did we learn from the retrospective?\"\n- \"What strategies came out of the planning session?\"",
    "description_mini": "Get meeting takeaways/strategies. Use event ref.",
    "help_category": "meetings",
    "help_examples": [
      "What were the takeaways from the strategy meeting?",
      "What did we learn from the retrospective?"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ref (e.g., \"event_1\") or exact ID of the event from a previous lookup. Prefer using the ref. NEVER guess or fabricate an ID."
        },
        "event_name": {
          "type": "string",
          "description": "The name of the meeting (used to search if event_id/ref not available)"
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_meeting_analytics",
    "description": "Get meeting analytics including sentiment analysis, talk time per speaker, and AI-extracted insights.\n\n⚠️ WARNING: This returns LIMITED analytics data only. The \"has_transcript\" and \"has_actionables\" flags in this response may be INACCURATE.\n- To get actual ACTION ITEMS, always call lookup_meeting_actionables\n- To get actual TAKEAWAYS, always call lookup_meeting_takeaways  \n- To get actual TRANSCRIPT, always call lookup_meeting_transcript\n- Do NOT rely on has_* flags to determine if data exists\n\nIMPORTANT: Use the ref (e.g., \"event_1\", \"event_2\") from a previous lookup_events, lookup_past_events, or show_past_event call. Refs are preferred as they are simpler and guaranteed to work within this session. Do NOT make up or guess event IDs.\n\nReturns:\n- sentiment: Overall meeting tone (Positive, Neutral, Negative)\n- talk_times: How much each participant spoke\n- insights: AI observations about the meeting dynamics\n\nCommon use cases:\n- \"How did the meeting go overall?\"\n- \"Who talked the most in the meeting?\"\n- \"What was the sentiment of the client call?\"",
    "description_mini": "Get sentiment, talk times, insights. Use event ref. has_* flags may be inaccurate.",
    "help_category": "meetings",
    "help_examples": [
      "How did the meeting go?",
      "Who talked the most in the standup?"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ref (e.g., \"event_1\") or exact ID of the event from a previous lookup. Prefer using the ref. NEVER guess or fabricate an ID."
        },
        "event_name": {
          "type": "string",
          "description": "The name of the meeting (used to search if event_id/ref not available)"
        }
      }
    }
  },
  {
    "type": "function",
    "name": "show_past_event",
    "description": "Display a past event with its recording data in a visual modal and get a summary. The response includes counts of available data (actionables, takeaways, transcript lines).\n\nIMPORTANT WORKFLOW:\n1. This function shows the event and returns COUNTS of actionables/takeaways/transcript\n2. If user asks about ACTION ITEMS or FOLLOW-UPS, you MUST call lookup_meeting_actionables to get the actual items\n3. If user asks about TAKEAWAYS or STRATEGIES, you MUST call lookup_meeting_takeaways\n4. If user asks about the TRANSCRIPT or what was said, you MUST call lookup_meeting_transcript\n5. Do NOT tell the user there are no action items just because you haven't called lookup_meeting_actionables yet\n\nThe \"actionable_count\" in the response tells you HOW MANY exist. To GET them, call lookup_meeting_actionables.\n\nIMPORTANT: Use the ref (e.g., \"event_1\", \"event_2\") or exact event_id from a previous lookup_past_events call. Refs are preferred. Do NOT make up or guess IDs.",
    "description_mini": "Display past event modal with counts. Use lookup_meeting_* to get actual actionables/takeaways/transcript.",
    "help_category": "meetings",
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ref (e.g., \"event_1\") or exact ID of the past event from lookup_past_events. Prefer using the ref."
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_past_events",
    "description": "Display multiple past events in a list modal. Use when user wants to see several past meetings or browse their meeting history visually.\n\nPAGINATION: If there are more events than displayed, pass pagination info AND date_range from the lookup_past_events response. The modal will show \"Page X of Y\" and allow user to navigate through all pages.",
    "description_mini": "Show past events list modal. Pass pagination and date_range from lookup for paging.",
    "help_category": "meetings",
    "parameters": {
      "type": "object",
      "properties": {
        "event_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of past event refs or IDs to display (e.g., [\"event_1\", \"event_2\"])"
        },
        "title": {
          "type": "string",
          "description": "Title for the list modal (e.g., \"Last Week's Meetings\", \"Recorded Meetings\")"
        },
        "pagination": {
          "type": "object",
          "description": "Pagination info from lookup_past_events response. Pass this to show page navigation.",
          "properties": {
            "current_page": {
              "type": "number"
            },
            "last_page": {
              "type": "number"
            },
            "total": {
              "type": "number"
            },
            "has_more_pages": {
              "type": "boolean"
            }
          }
        },
        "date_range": {
          "type": "object",
          "description": "Date range from lookup_past_events response. Required for pagination to fetch more events.",
          "properties": {
            "from": {
              "type": "string",
              "description": "Start date in YYYY-MM-DD format"
            },
            "to": {
              "type": "string",
              "description": "End date in YYYY-MM-DD format"
            }
          }
        }
      },
      "required": [
        "event_ids"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_past_event_view",
    "description": "Close the past event view modal. Call when user says \"close\", \"dismiss\", \"okay\", \"got it\" while viewing a past meeting.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_past_events_list",
    "description": "Close the past events list modal. Call when user says \"close\", \"dismiss\" while viewing a list of past events.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "lookup_insights",
    "description": "Get insights - items that need the user's attention, pending decisions, or recommended actions from Zunou.\n\nIMPORTANT: When user asks for \"all insights\" or \"list all\" or \"show me everything\", use status=\"ALL\". The default NEEDS_ATTENTION only returns unaddressed items.",
    "description_mini": "Get insights needing attention. Use status=ALL to get all insights.",
    "help_category": "insights",
    "help_examples": [
      "What insights do you have for me?",
      "Do I have any pending decisions?"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": [
            "ALL",
            "NEEDS_ATTENTION",
            "PENDING",
            "ADDRESSED"
          ],
          "description": "Filter by status. Use ALL to get all insights regardless of status. Default is NEEDS_ATTENTION (only unaddressed items)."
        },
        "limit": {
          "type": "number",
          "description": "Maximum insights to return. Default is 5, use higher for \"show all\"."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "close_insight",
    "description": "Mark an insight as COMPLETED/ACTIONED in the system (permanently resolves it).\n\nUSE THIS when user says:\n- \"I've done that\" / \"I handled it\" / \"That's done\"\n- \"I found the location\" / \"I completed that task\" / \"I already did that\"\n- \"Mark that as complete\" / \"Close that insight\" / \"I've actioned that\"\n- Any indication they've resolved the underlying issue\n\nThis is NOT for closing modals - this marks the insight as resolved in the database.\nFor dismissing UI modals, use close_insight_view or close_insights_list instead.",
    "description_mini": "Mark insight as resolved in DB. Not for closing UI modals.",
    "help_category": "insights",
    "parameters": {
      "type": "object",
      "properties": {
        "insight_id": {
          "type": "string",
          "description": "The ref (e.g., \"insight_1\") or ID of the insight to mark as complete"
        },
        "reason": {
          "type": "string",
          "enum": [
            "ACTIONED",
            "DISMISSED",
            "NOT_RELEVANT",
            "DELEGATED"
          ],
          "description": "Why the insight is being closed: ACTIONED (completed), DISMISSED (not needed), NOT_RELEVANT (doesn't apply), DELEGATED (assigned to someone else)"
        }
      },
      "required": [
        "insight_id",
        "reason"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_insight_recommendations",
    "description": "Get AI-generated recommendations for a specific insight. Returns actionable suggestions like creating tasks, notes, or meetings based on the insight.",
    "description_mini": "Get AI recommendations for insight (tasks, notes, meetings).",
    "help_category": "insights",
    "parameters": {
      "type": "object",
      "properties": {
        "insight_id": {
          "type": "string",
          "description": "The ID or ref of the insight to get recommendations for (e.g., \"insight_1\" or full ID)"
        }
      },
      "required": [
        "insight_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_insight",
    "description": "Display a single insight in a modal with its details and recommendations.\n\nIMPORTANT: You must call lookup_insights FIRST to get real insight IDs and refs. Then use the ref (e.g., \"insight_1\") or actual ID from the lookup response. DO NOT make up insight IDs.",
    "description_mini": "Display insight modal. Call lookup_insights first to get refs.",
    "help_category": "insights",
    "parameters": {
      "type": "object",
      "properties": {
        "insight_id": {
          "type": "string",
          "description": "The ref (e.g., \"insight_1\") or ID from lookup_insights response. NEVER fabricate IDs."
        },
        "include_recommendations": {
          "type": "boolean",
          "description": "Whether to also fetch and display AI recommendations. Default is true."
        }
      },
      "required": [
        "insight_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_insights",
    "description": "Display a list of insights in a modal.\n\nCRITICAL: You MUST call lookup_insights FIRST and pass the EXACT insights array from its response. DO NOT fabricate or make up insight data - use the real objects returned by lookup_insights including their actual IDs and refs.",
    "description_mini": "Display insights list. Pass exact array from lookup_insights.",
    "help_category": "insights",
    "help_examples": ["Show my insights", "What needs my attention?"],
    "parameters": {
      "type": "object",
      "properties": {
        "insights": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "Insight ID from lookup_insights"
              },
              "ref": {
                "type": "string",
                "description": "Short ref from lookup_insights (e.g., insight_1)"
              },
              "type": {
                "type": "string",
                "description": "Insight type (DECISION, RISK, OPPORTUNITY, ACTION, INFO)"
              },
              "topic": {
                "type": "string",
                "description": "Insight topic/title"
              },
              "description": {
                "type": "string",
                "description": "Insight description"
              },
              "status": {
                "type": "string",
                "description": "Delivery status"
              },
              "created_at": {
                "type": "string",
                "description": "Creation timestamp"
              }
            }
          },
          "description": "MUST be the exact insights array from lookup_insights response. Do not fabricate."
        },
        "title": {
          "type": "string",
          "description": "Optional title for the modal (e.g., \"Insights Needing Attention\")"
        }
      },
      "required": [
        "insights"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_insight_view",
    "description": "Close the insight detail MODAL (UI only). This does NOT mark the insight as complete - it only dismisses the popup. Use when user wants to dismiss the modal without taking action on the insight itself.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_insights_list",
    "description": "Close the insights list MODAL (UI only). This does NOT mark any insights as complete - it only dismisses the popup. Use when user wants to dismiss the list view without taking action on specific insights.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "review_recommendation",
    "description": "Show a review modal for an insight recommendation. The user can review the proposed task/note/meeting, edit the title and description, then confirm or cancel.\n\nUSE THIS when user wants to:\n- Review a recommendation before executing\n- Edit/modify a recommendation\n- See what will be created\n- Confirm the action with human-in-the-loop\n\nThe modal shows editable fields for:\n- Title\n- Description/details\n- Priority (for tasks)\n\nUser can then:\n- Confirm to create the item with their edits\n- Cancel to go back without creating anything\n\nWORKFLOW:\n1. Call lookup_insight_recommendations to get recommendations\n2. Call this with the insight_id and recommendation to review\n3. Wait for user to confirm or cancel via the modal\n4. Returns success with the edited data if confirmed, or cancelled=true if cancelled",
    "description_mini": "Review recommendation before executing. Human-in-the-loop pattern.",
    "help_category": "insights",
    "help_examples": ["Review the recommendation", "Let me see what you're suggesting"],
    "parameters": {
      "type": "object",
      "properties": {
        "insight_id": {
          "type": "string",
          "description": "The ID or ref of the insight (e.g., \"insight_1\" or full ID)"
        },
        "recommendation": {
          "type": "object",
          "description": "The recommendation object from lookup_insight_recommendations",
          "properties": {
            "id": {
              "type": "string",
              "description": "Recommendation ID"
            },
            "title": {
              "type": "string",
              "description": "Recommendation title"
            },
            "summary": {
              "type": "string",
              "description": "Recommendation summary/description"
            },
            "action_type": {
              "type": "string",
              "description": "Type: task, note, or meeting"
            }
          },
          "required": [
            "id",
            "title",
            "action_type"
          ]
        }
      },
      "required": [
        "insight_id",
        "recommendation"
      ]
    }
  },
  {
    "type": "function",
    "name": "execute_insight_recommendation",
    "description": "Execute an AI recommendation for an insight WITHOUT review. This directly creates the suggested item (task, note, or meeting).\n\n⚠️ PREFER review_recommendation instead - it gives the user a chance to review and edit before creating.\n\nOnly use execute_insight_recommendation when:\n- User explicitly says \"just do it\" or \"execute without review\"\n- User has already reviewed via review_recommendation and just wants to create it\n\nFor the human-in-the-loop pattern, use review_recommendation first.",
    "description_mini": "Execute recommendation without review. Prefer review_recommendation.",
    "help_category": "insights",
    "help_examples": ["Execute the recommendation", "Just do it"],
    "parameters": {
      "type": "object",
      "properties": {
        "insight_id": {
          "type": "string",
          "description": "The ID or ref of the insight (e.g., \"insight_1\" or full ID)"
        },
        "recommendation_id": {
          "type": "string",
          "description": "The ID of the recommendation to execute (from lookup_insight_recommendations)"
        }
      },
      "required": [
        "insight_id",
        "recommendation_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_actionables",
    "description": "Get pending action items from recorded meetings across all meetings.",
    "description_mini": "Get meeting action items across all meetings.",
    "help_category": "actionables",
    "help_examples": [
      "What action items do I have pending?",
      "Show me all my open follow-ups"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": [
            "PENDING",
            "COMPLETED",
            "ALL"
          ],
          "description": "Filter by completion status. Default is PENDING."
        },
        "days_back": {
          "type": "number",
          "description": "Look back this many days for actionables. Default is 14."
        },
        "limit": {
          "type": "number",
          "description": "Maximum actionables to return. Default is 10."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "manage_actionable",
    "description": "Unified action item management tool for meeting actionables. Handles completing, creating, updating, and deleting action items.\n\nACTIONS:\n- complete: Mark actionable as done (requires actionable_id)\n- create: Add new action item to a meeting (requires event_id, description)\n- update: Edit description or status (requires actionable_id)\n- delete: Permanently remove - REQUIRES CONFIRMATION (requires actionable_id)\n\nFor searching actionables, use lookup_actionables or lookup_meeting_actionables.\nFor batch conversion to tasks, use send_actionable_to_task or send_all_actionables_to_tasks.",
    "description_mini": "complete/create/update/delete actionable. Use lookup_actionables to search.",
    "help_category": "actionables",
    "help_examples": [
      "Mark that action item as complete",
      "Add an action item to the meeting"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "action": {
          "type": "string",
          "enum": ["complete", "create", "update", "delete"],
          "description": "The action to perform"
        },
        "actionable_id": {
          "type": "string",
          "description": "Actionable ID or short ref (e.g., 'actionable_1'). Required for complete, update, delete."
        },
        "event_id": {
          "type": "string",
          "description": "Event ID or short ref (e.g., 'event_1'). Required for create action."
        },
        "description": {
          "type": "string",
          "description": "Action item description. Required for create, optional for update."
        },
        "status": {
          "type": "string",
          "enum": ["PENDING", "COMPLETED", "DISMISSED"],
          "description": "Status for update action. PENDING=not done, COMPLETED=done, DISMISSED=no longer relevant."
        },
        "actionable_description": {
          "type": "string",
          "description": "Description for confirmation display (for delete action)."
        },
        "event_name": {
          "type": "string",
          "description": "Event name for confirmation display (for create/delete actions)."
        }
      },
      "required": ["action"]
    }
  },
  /* REPLACED BY manage_actionable
  {
    "type": "function",
    "name": "complete_actionable",
    "description": "Mark a meeting action item as completed.",
    "parameters": {
      "type": "object",
      "properties": {
        "actionable_id": {
          "type": "string",
          "description": "The ID of the actionable to complete"
        }
      },
      "required": [
        "actionable_id"
      ]
    }
  },
  */
  {
    "type": "function",
    "name": "send_actionable_to_task",
    "description": "🎯 USE THIS when user wants to create a task from a MEETING ACTIONABLE. This is the ONLY way to properly link a task to a meeting action item.\n\nCRITICAL WORKFLOW:\n1. FIRST call lookup_meeting_actionables to get the list of actionables with their refs\n2. Find the specific actionable the user wants (e.g., \"actionable_1\", \"actionable_5\")\n3. Call this tool with the EXACT ref from the lookup (e.g., \"actionable_1\")\n\n⚠️ IMPORTANT:\n- Use the EXACT \"ref\" value from lookup_meeting_actionables (e.g., \"actionable_1\")\n- Do NOT make up or guess actionable IDs\n- Do NOT paraphrase the actionable description - use the exact ref\n- If user says \"the first one\", use \"actionable_1\"\n- If user says \"the third one\", use \"actionable_3\"\n\nWHEN TO USE THIS (instead of create_task):\n- User says \"create a task from that actionable\"\n- User says \"send that action item to my tasks\"\n- User references a meeting and wants to track an action item",
    "description_mini": "Create task from meeting actionable. Use ref from lookup_meeting_actionables.",
    "help_category": "actionables",
    "help_examples": [
      "Send that action item to my tasks",
      "Create a task from the first actionable"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "actionable_id": {
          "type": "string",
          "description": "The ref of the actionable from lookup_meeting_actionables (e.g., \"actionable_1\", \"actionable_2\"). Use the EXACT ref value, not a made-up ID."
        },
        "pulse_id": {
          "type": "string",
          "description": "The pulse/team to create the task in. If not provided, uses the current pulse."
        },
        "task_list_id": {
          "type": "string",
          "description": "The ID of the task list to add the task to. If not provided, uses the first available list."
        },
        "new_list_name": {
          "type": "string",
          "description": "If provided, creates a new task list with this name instead of using an existing one"
        }
      },
      "required": [
        "actionable_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "send_all_actionables_to_tasks",
    "description": "Convert all unsent action items from a meeting into tasks. This is a batch operation that creates tasks for all actionables that haven't been converted yet.\n\nIMPORTANT: You must have the event_id from a previous lookup_past_events call.\n\nBy default, tasks are created in the current pulse's default task list. You can specify a different pulse_id to send to a different team's task list.",
    "description_mini": "Batch convert all meeting actionables to tasks.",
    "help_category": "actionables",
    "help_examples": [
      "Send all action items to tasks",
      "Convert all meeting follow-ups to tasks"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the event/meeting to get actionables from"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the meeting (for confirmation display)"
        },
        "pulse_id": {
          "type": "string",
          "description": "The pulse/team to create the tasks in. If not provided, uses the current pulse."
        },
        "pulse_name": {
          "type": "string",
          "description": "The name of the pulse (for confirmation display)"
        },
        "task_list_id": {
          "type": "string",
          "description": "The ID of the task list to add the tasks to. If not provided, uses the first available list."
        },
        "task_list_name": {
          "type": "string",
          "description": "The name of the task list (for confirmation display)"
        },
        "new_list_name": {
          "type": "string",
          "description": "If provided, creates a new task list with this name instead of using an existing one"
        }
      },
      "required": [
        "event_id"
      ]
    }
  },
  /* REPLACED BY manage_actionable
  {
    "type": "function",
    "name": "create_actionable",
    "description": "Create a manual action item linked to a past meeting. Use this when:\n- User wants to add an action item that wasn't captured by the meeting analysis\n- User remembers something from a meeting that needs to be tracked\n- User wants to manually note a follow-up from a specific meeting\n\nIMPORTANT:\n- You must have the event_id from a previous lookup_past_events call\n- The actionable will be linked to that specific meeting\n- Status defaults to 'PENDING'\n\nAfter creating, the user can later use send_actionable_to_task to convert it to a proper task.",
    "parameters": {
      "type": "object",
      "properties": {
        "event_id": {
          "type": "string",
          "description": "The ID of the past event/meeting to link this actionable to. Use the ref from lookup_past_events (e.g., \"event_1\")."
        },
        "description": {
          "type": "string",
          "description": "The action item description - what needs to be done"
        }
      },
      "required": [
        "event_id",
        "description"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_actionable",
    "description": "Update an existing action item's description or status.\n\nIMPORTANT:\n- You must have the actionable_id from a previous lookup_meeting_actionables call\n- Use the ref from the lookup (e.g., \"actionable_1\", \"actionable_2\")\n\nStatus values:\n- \"PENDING\" - Not yet completed (default)\n- \"COMPLETED\" - Done\n- \"DISMISSED\" - No longer relevant",
    "parameters": {
      "type": "object",
      "properties": {
        "actionable_id": {
          "type": "string",
          "description": "The ref of the actionable from lookup_meeting_actionables (e.g., \"actionable_1\")"
        },
        "description": {
          "type": "string",
          "description": "New description for the action item (optional)"
        },
        "status": {
          "type": "string",
          "enum": [
            "PENDING",
            "COMPLETED",
            "DISMISSED"
          ],
          "description": "New status for the action item (optional)"
        }
      },
      "required": [
        "actionable_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_actionable",
    "description": "Permanently delete an action item. This is a destructive action that cannot be undone.\n\nIMPORTANT:\n- You must have the actionable_id from a previous lookup_meeting_actionables call\n- Use the ref from the lookup (e.g., \"actionable_1\", \"actionable_2\")\n- A confirmation modal will be shown before deletion\n\nConsider using update_actionable with status \"DISMISSED\" instead if the user just wants to hide it.",
    "parameters": {
      "type": "object",
      "properties": {
        "actionable_id": {
          "type": "string",
          "description": "The ref of the actionable from lookup_meeting_actionables (e.g., \"actionable_1\")"
        },
        "actionable_description": {
          "type": "string",
          "description": "The description of the actionable (for confirmation display)"
        },
        "event_name": {
          "type": "string",
          "description": "The name of the meeting this actionable is from (for confirmation display)"
        }
      },
      "required": [
        "actionable_id"
      ]
    }
  },
  */
  {
    "type": "function",
    "name": "lookup_org_members",
    "description": "Search for people across the ENTIRE ORGANIZATION (all staff/employees). Use this when:\n- Looking for anyone in the company regardless of team\n- Need to find someone by name when unsure which team they are on\n- Want to find contact info for someone in the organization\n- Looking up how to spell someone's name correctly\n\nSMART MATCHING: This function uses fuzzy and phonetic matching, so it will find:\n- Partial names (e.g., \"Jon\" finds \"Jonathan\")\n- Nicknames (e.g., \"Mike\" finds \"Michael\")\n- Phonetically similar names (e.g., \"Sesh\" finds \"Seth\", \"Satch\")\n- Minor typos or transcription errors\n\nIf no exact match is found, it returns the closest matches. Always present these options to the user to confirm which person they meant.\n\n⚠️ TIP: When looking for someone to add to a meeting or message, ALSO check lookup_contacts in case they are an external person (client, vendor, partner). Search both in parallel!\n\nNote: Returns people from all teams/departments, not just the current team.",
    "description_mini": "Search org members by name (fuzzy match). Also check lookup_contacts for external people.",
    "help_category": "people",
    "help_examples": [
      "Who is John Smith?",
      "Find me Mike's email address"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "search_name": {
          "type": "string",
          "description": "Name or partial name to search for. Can be first name, last name, nickname, or partial spelling. The system will fuzzy-match."
        },
        "limit": {
          "type": "number",
          "description": "Maximum results to return. Default 10."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_pulse_members",
    "description": "Get members of a pulse/channel. Use this when:\n- User asks \"who is on my team\" or \"my team members\" (omit pulse_id for current pulse)\n- User asks about members of a specific channel or DM (provide pulse_id)\n- Need to assign a task (IMPORTANT: tasks can ONLY be assigned to pulse members)\n- Want to verify members after creating a DM\n\nCRITICAL: When assigning tasks, you MUST use this to get valid assignee IDs. Tasks cannot be assigned to people outside the current pulse.",
    "description_mini": "Get pulse members. Required before assigning tasks (must be pulse member).",
    "help_category": "people",
    "help_examples": [
      "Who is on my team?",
      "Show me the members of Design channel"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The pulse ID to check members for. If omitted, uses the current pulse."
        },
        "limit": {
          "type": "number",
          "description": "Maximum members to return. Default 20."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_pulses",
    "description": "List teams/pulses (including DMs) in the organization. Use this when:\n- User wants to see available teams or channels\n- User asks \"what teams are there\" or \"show me all pulses\"\n- Looking for a pulse by name\n\nFor finding a DM with a specific PERSON, use find_dm_with_person instead (it checks members, not just names).\n\nReturns has_team_thread field - if false, the pulse is corrupted and cannot be used for messaging.",
    "description_mini": "List teams/pulses. For DM with person use find_dm_with_person.",
    "help_category": "chat",
    "help_examples": [
      "What teams are there?",
      "Show me all the channels"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "search_name": {
          "type": "string",
          "description": "Filter pulses by name (case-insensitive partial match). E.g., \"marketing\" finds \"Marketing Team\"."
        },
        "category": {
          "type": "string",
          "enum": [
            "TEAM",
            "ONETOONE",
            "PERSONAL"
          ],
          "description": "Filter by pulse category. TEAM = team channels, ONETOONE = DMs, PERSONAL = personal pulse."
        },
        "limit": {
          "type": "number",
          "description": "Maximum pulses to return. Default 50."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "lookup_contacts",
    "description": "Search the user's personal contacts (external people outside the organization). Use this when:\n- User mentions someone by name who might be an external contact\n- Looking for a client, vendor, partner, or external collaborator\n- Need to find an email or phone for someone not in the org\n- Adding external attendees to meetings\n- User says \"find contact\", \"look up contact\", \"who is...\"\n\nSMART MATCHING: Uses fuzzy matching so partial names and nicknames work.\n\nIMPORTANT: For internal colleagues (people in the org), use lookup_org_members instead.\nContacts are PERSONAL to the user - clients, vendors, friends, external collaborators.\n\nReturns contacts with short refs (e.g., contact_1) for easier reference in follow-up commands.",
    "description_mini": "Search personal contacts (external people). Use lookup_org_members for internal colleagues.",
    "help_category": "people",
    "help_examples": [
      "Find my contact Sarah Jones",
      "Look up the client from Acme Corp"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "search": {
          "type": "string",
          "description": "Search term - matches name, email, company, or notes. Leave empty to get all contacts."
        },
        "favorites_only": {
          "type": "boolean",
          "description": "Only return favorite/starred contacts. Default false."
        },
        "limit": {
          "type": "number",
          "description": "Max contacts to return. Default 10."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "manage_contact",
    "description": "Unified contact management tool for your personal address book. Handles creating, updating, deleting, and getting contact details.\n\nACTIONS:\n- create: Add new contact (requires name, optional: email, phone, company, details)\n- update: Edit contact info (requires contact_id)\n- delete: Remove contact - REQUIRES CONFIRMATION (requires contact_id)\n- get_details: Get full contact info (requires contact_id)\n\nFor searching contacts, use lookup_contacts. For displaying contacts visually, use show_contact/show_contacts.",
    "description_mini": "Create/update/delete/get contact. Actions: create, update, delete (confirm required), get_details.",
    "help_category": "people",
    "help_examples": [
      "Save Sarah Jones as a contact",
      "Add John from Acme Corp to my contacts"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "action": {
          "type": "string",
          "enum": ["create", "update", "delete", "get_details"],
          "description": "The action to perform"
        },
        "contact_id": {
          "type": "string",
          "description": "Contact ID or short ref (e.g., 'contact_1'). Required for update, delete, get_details."
        },
        "contact_name": {
          "type": "string",
          "description": "Contact name for confirmation display (for delete action)."
        },
        "name": {
          "type": "string",
          "description": "Contact's full name. Required for create."
        },
        "email": {
          "type": "string",
          "description": "Primary email address."
        },
        "telephone_number": {
          "type": "string",
          "description": "Primary phone number."
        },
        "alt_email": {
          "type": "string",
          "description": "Alternative email."
        },
        "alt_telephone_number": {
          "type": "string",
          "description": "Alternative phone."
        },
        "company": {
          "type": "string",
          "description": "Company/organization name."
        },
        "details": {
          "type": "string",
          "description": "Notes about this contact."
        },
        "is_favorite": {
          "type": "boolean",
          "description": "Mark as favorite."
        }
      },
      "required": ["action"]
    }
  },
  /* REPLACED BY manage_contact
  {
    "type": "function",
    "name": "get_contact_details",
    "description": "Get full details for a specific contact by ID or short reference. Use this when you need complete info about a contact you already found.",
    "parameters": {
      "type": "object",
      "properties": {
        "contact_id": {
          "type": "string",
          "description": "Contact ID (UUID) or short reference (e.g., \"contact_1\")"
        }
      },
      "required": [
        "contact_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "create_contact",
    "description": "Create a new contact in the user's personal address book. Use when user wants to save someone's contact info.\n\nREQUIRED fields: name\nOPTIONAL: email, telephone_number, details, alt_email, alt_telephone_number, company, is_favorite\n\nOnly the name is required. Capture whatever info the user provides - they can always add more later.\nAfter creating, tell the user the contact was saved and offer to show it.",
    "parameters": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Contact's full name (required)"
        },
        "email": {
          "type": "string",
          "description": "Primary email address (optional)"
        },
        "telephone_number": {
          "type": "string",
          "description": "Primary phone number (optional)"
        },
        "details": {
          "type": "string",
          "description": "Notes about this contact (optional) - context like how they know them, what they work on, etc."
        },
        "alt_email": {
          "type": "string",
          "description": "Alternative email (optional)"
        },
        "alt_telephone_number": {
          "type": "string",
          "description": "Alternative phone (optional)"
        },
        "company": {
          "type": "string",
          "description": "Company/organization name (optional)"
        },
        "is_favorite": {
          "type": "boolean",
          "description": "Mark as favorite (optional)"
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_contact",
    "description": "Update an existing contact's information. Requires confirmation. Only include fields that are being changed.",
    "parameters": {
      "type": "object",
      "properties": {
        "contact_id": {
          "type": "string",
          "description": "Contact ID or short reference (e.g., \"contact_1\")"
        },
        "name": {
          "type": "string",
          "description": "New name"
        },
        "email": {
          "type": "string",
          "description": "New primary email"
        },
        "telephone_number": {
          "type": "string",
          "description": "New primary phone"
        },
        "alt_email": {
          "type": "string",
          "description": "New alt email"
        },
        "alt_telephone_number": {
          "type": "string",
          "description": "New alt phone"
        },
        "company": {
          "type": "string",
          "description": "New company name"
        },
        "details": {
          "type": "string",
          "description": "New notes"
        },
        "is_favorite": {
          "type": "boolean",
          "description": "Set favorite status"
        }
      },
      "required": [
        "contact_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_contact",
    "description": "Delete a contact from the address book. Requires confirmation. This is permanent.",
    "parameters": {
      "type": "object",
      "properties": {
        "contact_id": {
          "type": "string",
          "description": "Contact ID or short reference"
        },
        "contact_name": {
          "type": "string",
          "description": "Contact name (for confirmation display)"
        }
      },
      "required": [
        "contact_id"
      ]
    }
  },
  */
  {
    "type": "function",
    "name": "show_contact",
    "description": "Display a contact's details in a visual modal. Use when user wants to see a contact.",
    "help_category": "people",
    "parameters": {
      "type": "object",
      "properties": {
        "contact_id": {
          "type": "string",
          "description": "Contact ID or short reference"
        }
      },
      "required": [
        "contact_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_contacts",
    "description": "Display a list of contacts in a visual modal. Use after lookup_contacts when user wants to see results.",
    "help_category": "people",
    "parameters": {
      "type": "object",
      "properties": {
        "contacts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "Contact ID"
              },
              "ref": {
                "type": "string",
                "description": "Short reference like contact_1"
              },
              "name": {
                "type": "string",
                "description": "Contact name"
              },
              "email": {
                "type": "string",
                "description": "Primary email"
              },
              "telephone_number": {
                "type": "string",
                "description": "Phone"
              },
              "company": {
                "type": "string",
                "description": "Company name"
              },
              "is_favorite": {
                "type": "boolean",
                "description": "Is favorited"
              }
            }
          },
          "description": "Array of contacts to display"
        },
        "title": {
          "type": "string",
          "description": "Modal title (e.g., \"Your Contacts\", \"Search Results\")"
        }
      },
      "required": [
        "contacts"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_contact_view",
    "description": "Close the contact detail view modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_contacts_list",
    "description": "Close the contacts list modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "confirm_pending_action",
    "description": "Confirm a pending action when a confirmation modal is showing. Call this when the user says \"yes\", \"confirm\", \"go ahead\", \"do it\", \"looks good\", \"that's right\", etc.",
    "help_category": "session",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "cancel_pending_action",
    "description": "Cancel a pending action when a confirmation modal is showing. Call this when the user says \"no\", \"cancel\", \"stop\", \"wait\", \"never mind\", \"don't do that\", etc.",
    "help_category": "session",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "modify_pending_action",
    "description": "Request modification to a pending action before confirming. Call this when the user wants to change details like \"make it 4pm instead\", \"add Sarah too\", \"change the priority\", etc.",
    "help_category": "session",
    "parameters": {
      "type": "object",
      "properties": {
        "modifications": {
          "type": "string",
          "description": "Description of what the user wants to change"
        }
      },
      "required": [
        "modifications"
      ]
    }
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // UNIFIED CLOSE MODAL - Replaces 20+ individual close_* tools
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    "type": "function",
    "name": "close_modal",
    "description": "Close any currently open modal. Call when user says \"close\", \"dismiss\", \"okay\", \"got it\", \"thanks\", \"done\", \"hide it\". If no modal_type specified, closes the topmost open modal.",
    "description_mini": "Close modal. No modal_type = close topmost.",
    "help_category": "advanced",
    "parameters": {
      "type": "object",
      "properties": {
        "modal_type": {
          "type": "string",
          "enum": [
            "task", "tasks", "note", "notes", "event", "events",
            "past_event", "past_events", "relay", "relays",
            "insight", "insights", "contact", "contacts",
            "availability", "content", "list", "messages",
            "pulses", "pulse", "topics", "draft"
          ],
          "description": "Optional: specific modal to close. If omitted, closes the topmost visible modal."
        }
      }
    }
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // LEGACY CLOSE TOOLS - Kept for backward compatibility, prefer close_modal
  // ═══════════════════════════════════════════════════════════════════════════════
  /*
  {
    "type": "function",
    "name": "close_task_view",
    "description": "Close the task view modal that is currently being displayed. Call this when the user says \"close\", \"close it\", \"dismiss\", \"hide it\", \"okay\", \"got it\", \"thanks\" while viewing a task. This allows the conversation to continue without navigating away.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_tasks_list",
    "description": "Close the tasks list modal. Call this when the user says \"close\", \"close the list\", \"dismiss\", \"done looking\" while viewing a list of tasks.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "adjust_speaking_pace",
    "description": "Adjust the speaking pace when user asks you to speak faster or slower. Call this IMMEDIATELY when user says things like:\n- \"speak faster\", \"go faster\", \"speed up\", \"too slow\"\n- \"speak slower\", \"slow down\", \"too fast\"\n- \"normal speed\", \"regular pace\"\n\nThis sends a technical command to actually change the pace, not just adjust your speaking style.\nAfter calling this, briefly acknowledge the change and continue the conversation.",
    "description_mini": "Change speaking speed: slower, normal, faster, much_faster.",
    "help_category": "voice-controls",
    "help_examples": [
      "Speak faster",
      "Slow down a bit"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "pace": {
          "type": "string",
          "enum": [
            "slower",
            "normal",
            "faster",
            "much_faster"
          ],
          "description": "The requested pace: slower (deliberate, patient), normal (default), faster (brisk, concise), much_faster (rapid, minimal pauses)"
        },
        "user_feedback": {
          "type": "string",
          "description": "Optional: What the user said that triggered this (helps with debugging)"
        }
      },
      "required": [
        "pace"
      ]
    }
  },
  {
    "type": "function",
    "name": "adjust_speaking_style",
    "description": "Adjust the communication style when user requests a different personality or tone. Call this when user says things like:\n- \"be more professional\", \"be more casual\", \"be friendlier\"\n- \"give me more details\", \"be more concise\", \"get to the point\"\n- \"be more encouraging\", \"be more direct\", \"be more empathetic\"\n- \"talk normally\", \"default style\"\n\nThis changes how you communicate - your tone, level of detail, and personality.\nAfter calling this, briefly acknowledge the change and continue the conversation in the new style.",
    "description_mini": "Change communication style: professional, friendly, concise, detailed, etc.",
    "help_category": "voice-controls",
    "help_examples": [
      "Be more concise",
      "Give me more details"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "style": {
          "type": "string",
          "enum": [
            "professional",
            "friendly",
            "concise",
            "detailed",
            "encouraging",
            "direct",
            "empathetic",
            "neutral"
          ],
          "description": "The communication style: professional (business-like), friendly (warm, casual), concise (brief, to-the-point), detailed (thorough explanations), encouraging (supportive, positive), direct (straightforward, no-nonsense), empathetic (emotionally aware), neutral (default balanced)"
        },
        "user_feedback": {
          "type": "string",
          "description": "Optional: What the user said that triggered this (helps with debugging)"
        }
      },
      "required": [
        "style"
      ]
    }
  },
  {
    "type": "function",
    "name": "request_text_input",
    "description": "Request the user to type something precisely instead of speaking. This opens a text input field in the UI.\n\nUSE THIS WHEN:\n- You need an exact email address (voice recognition often mishears emails)\n- You need a name spelled precisely (especially unusual names)\n- You need a URL or web address\n- You need a phone number\n- The user has repeated themselves multiple times and you're still not getting it right\n- Any time precision is critical and voice transcription might fail\n\nAFTER CALLING THIS:\n- A text input box will appear for the user\n- Wait for the response before proceeding\n- The user may type their response OR cancel\n- Acknowledge what they typed and confirm it's correct\n\nEXAMPLE FLOWS:\n1. \"Add Alex to the meeting\" → lookup_org_members finds no match → call request_text_input asking for email\n2. \"Create a task for...\" (unclear) → after 2+ failed attempts → offer text input option\n3. \"The website is example dot com slash...\" → call request_text_input for the URL",
    "description_mini": "Request typed input for precision (emails, URLs, names). Opens text input UI.",
    "help_category": "voice-controls",
    "parameters": {
      "type": "object",
      "properties": {
        "prompt": {
          "type": "string",
          "description": "What you're asking the user to type. Be specific. E.g., \"Please type the email address\", \"Could you type the person's name?\", \"Please type the URL\""
        },
        "input_type": {
          "type": "string",
          "enum": [
            "text",
            "email",
            "name",
            "url",
            "number",
            "phone"
          ],
          "description": "The type of input expected. This affects the keyboard shown on mobile devices: email shows @ keyboard, number shows numpad, etc."
        },
        "placeholder": {
          "type": "string",
          "description": "Optional placeholder text for the input field. E.g., \"john@example.com\", \"Enter name here\""
        },
        "reason": {
          "type": "string",
          "description": "Brief explanation of why you need typed input. Shown to user. E.g., \"I want to make sure I get this right\", \"Email addresses are tricky to hear correctly\""
        }
      },
      "required": [
        "prompt",
        "input_type"
      ]
    }
  },
  {
    "type": "function",
    "name": "capture_photo",
    "description": "Open the camera to capture a photo for analysis. This enables visual input like scanning business cards, handwritten notes, documents, receipts, or whiteboards.\n\nUSE THIS WHEN:\n- User wants to scan a business card to add a contact\n- User has handwritten notes they want to capture\n- User wants to capture a whiteboard or document\n- User mentions scanning, photographing, or taking a picture of something\n- User says things like \"let me show you\", \"I have a card here\", \"scan this\"\n\nAFTER CALLING THIS:\n- A camera UI will open for the user\n- Wait for the response which contains extracted text/data from the image\n- Based on the scan_type and extracted data, offer to take action:\n  - business_card: Offer to create a contact with extracted info\n  - notes: Offer to create tasks or notes from the content\n  - receipt: Summarize amounts/items found\n  - whiteboard: Summarize or create notes from content\n  - document: Read back or summarize the text\n\nIMPORTANT:\n- The image is analyzed by AI vision - you'll receive extracted text and structured data\n- For business cards, the response includes name, title, company, email, phone if found\n- Always confirm the extracted data with the user before creating anything",
    "description_mini": "Open camera to scan/capture. Types: business_card, notes, document, receipt, whiteboard, general. Response contains extracted data.",
    "help_category": "voice-controls",
    "help_examples": [
      "Scan this business card",
      "Take a photo of these notes"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "scan_type": {
          "type": "string",
          "enum": [
            "business_card",
            "notes",
            "document",
            "receipt",
            "whiteboard",
            "general"
          ],
          "description": "The type of content being scanned. This helps optimize the OCR/extraction: business_card extracts contact info, notes extracts text for tasks/notes, receipt extracts items/amounts, whiteboard/document extract general text."
        },
        "instruction": {
          "type": "string",
          "description": "Optional specific instruction for what to look for or extract from the image. E.g., \"Look for action items\", \"Find the total amount\", \"Extract all names and emails\""
        },
        "reason": {
          "type": "string",
          "description": "Brief explanation shown to user about why you need a photo. E.g., \"I'll scan this business card and extract the contact details\", \"Let me capture those notes for you\""
        }
      },
      "required": [
        "scan_type"
      ]
    }
  },
  {
    "type": "function",
    "name": "log_error_for_developers",
    "description": "Log an error, bug, or feature request for developers to review. Call this when something goes wrong or user reports an issue.\n\n⚠️ IMPORTANT - CHOOSE THE RIGHT SCOPE:\n- Use report_scope=\"voice_agent\" when the issue is ABOUT the voice agent itself (e.g., \"you didn't understand me\", \"the function call failed\", \"audio issues\")\n- Use report_scope=\"general\" when the issue is about THE APP in general (e.g., \"the calendar page is broken\", \"I can't see my tasks\", \"the meeting didn't record properly\")\n\nFor voice_agent scope, the system automatically captures function call history and transcript.\nFor general scope, focus on capturing the user's description of the bug clearly.\n\nBe DETAILED in error_message - include specific error messages, unexpected values, timing issues, etc.",
    "description_mini": "Log bug/error/feature request. Use report_scope: \"voice_agent\" for agent issues, \"general\" for app issues. Be detailed in error_message.",
    "help_category": "advanced",
    "help_examples": ["Something is broken, report this bug", "The audio quality is bad"],
    "parameters": {
      "type": "object",
      "properties": {
        "report_scope": {
          "type": "string",
          "enum": [
            "voice_agent",
            "general"
          ],
          "description": "REQUIRED: \"voice_agent\" for issues WITH the voice agent itself, \"general\" for issues with the app/system that user is reporting through voice",
          "description_mini": "\"voice_agent\" for agent issues, \"general\" for app bugs"
        },
        "error_message": {
          "type": "string",
          "description": "Detailed description of what went wrong. For general issues, capture what the user described as clearly as possible."
        },
        "error_type": {
          "type": "string",
          "enum": [
            "function_call_failed",
            "unexpected_response",
            "audio_issue",
            "connection_issue",
            "user_reported",
            "feature_request",
            "other"
          ],
          "description": "Type of report: user_reported for bugs user noticed in the app, function_call_failed for voice agent API errors",
          "description_mini": "Report type"
        },
        "category": {
          "type": "string",
          "enum": [
            "voice-agent",
            "events",
            "tasks",
            "notes",
            "calendar",
            "agendas",
            "talking-points",
            "notetaker",
            "google-meet",
            "chat",
            "home",
            "schedule",
            "scheduling",
            "insights",
            "ui-ux",
            "performance",
            "recording",
            "transcript",
            "notifications",
            "login",
            "sync",
            "other"
          ],
          "description": "Which feature area this relates to - helps developers find and prioritize issues",
          "description_mini": "Feature area"
        },
        "priority": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ],
          "description": "How urgent is this? Critical = blocking user completely, High = major feature broken, Medium = workaround exists, Low = nice to fix",
          "description_mini": "Urgency level"
        },
        "failed_operation": {
          "type": "string",
          "description": "What specific operation or feature failed? e.g., \"scheduling a meeting\", \"viewing past recordings\", \"loading the home page\"",
          "description_mini": "What operation failed"
        },
        "observed_behavior": {
          "type": "string",
          "description": "What actually happened? Describe what the user experienced.",
          "description_mini": "What happened"
        },
        "expected_behavior": {
          "type": "string",
          "description": "What should have happened? What was the user expecting?",
          "description_mini": "What should have happened"
        },
        "steps_to_reproduce": {
          "type": "string",
          "description": "For general bugs: steps to reproduce the issue if the user described them",
          "description_mini": "Steps to reproduce"
        },
        "user_goal": {
          "type": "string",
          "description": "What was the user ultimately trying to accomplish?",
          "description_mini": "User's goal"
        },
        "hypothesis": {
          "type": "string",
          "description": "Your hypothesis about what might be causing this, if you have one",
          "description_mini": "Possible cause"
        },
        "additional_context": {
          "type": "string",
          "description": "Any other relevant context the user mentioned",
          "description_mini": "Other context"
        }
      },
      "required": [
        "report_scope",
        "error_message",
        "error_type",
        "category"
      ]
    }
  },
  {
    "type": "function",
    "name": "test_error_logging",
    "description": "Test the error logging system by deliberately creating a test error log. Call this when the user says \"test error logging\", \"test the error system\", \"try logging an error\", or similar phrases to verify error logging works.",
    "description_mini": "Test error logging system. Creates a test error log entry.",
    "help_category": "advanced",
    "parameters": {
      "type": "object",
      "properties": {
        "test_message": {
          "type": "string",
          "description": "Optional custom test message. If not provided, uses a default test message."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "report_audio_quality_issue",
    "description": "Report persistent audio quality issues that are preventing meaningful conversation.\n\nWHEN TO USE:\n- User's speech has been garbled/incomprehensible for 2-3 CONSECUTIVE turns\n- You're receiving what appears to be background noise instead of speech\n- You've asked for clarification multiple times but STILL can't understand\n- Transcriptions appear to be random noise rather than coherent words\n\nWHEN NOT TO USE:\n- One unclear word (just ask them to repeat)\n- Brief noise between otherwise clear speech\n- User is speaking clearly but about unexpected/off-topic subjects\n- Normal \"ums\", \"ahs\", or thinking pauses\n- You understood SOME of what they said (just clarify the unclear parts)\n\nThis will:\n1. Mute the microphone\n2. Show the user a modal with options to adjust mic sensitivity\n3. Let them switch to text mode or return to voice with new settings\n\nOnly use this as a last resort after genuinely failing to understand 2-3 turns.",
    "description_mini": "Report audio issues after 2-3 garbled turns. Shows mic settings modal. Last resort only.",
    "help_category": "voice-controls",
    "parameters": {
      "type": "object",
      "properties": {
        "issue_type": {
          "type": "string",
          "enum": [
            "garbled_speech",
            "background_noise",
            "no_clear_speech"
          ],
          "description": "Type of audio issue: garbled_speech (words but unintelligible), background_noise (noise overwhelming speech), no_clear_speech (silence or only noise)"
        },
        "description": {
          "type": "string",
          "description": "Brief description of what you experienced (e.g., \"Last 3 responses were unintelligible\", \"Only hearing background chatter\")"
        },
        "turns_affected": {
          "type": "number",
          "description": "Number of consecutive conversation turns affected (should be 2-5)"
        }
      },
      "required": [
        "issue_type",
        "turns_affected"
      ]
    }
  },
  {
    "type": "function",
    "name": "show_content",
    "description": "Display formatted content in a modal. This is a FALLBACK tool - use ONLY when NO dedicated display tool exists for the content type.\n\n⚠️ PREFER SPECIFIC TOOLS FIRST:\n- For events → use show_event or show_events\n- For tasks → use show_task or show_tasks  \n- For notes → use show_note or show_notes\n- For past events → use show_past_event or show_past_events\n\nUSE THIS TOOL WHEN:\n- Displaying custom-generated content (summaries, explanations, comparisons)\n- Showing formatted lists or tables that don't fit existing tools\n- Presenting analysis results or recommendations\n- Any rich content that needs visual display but has no dedicated modal\n\nRICH FORMATTING SUPPORT:\nBasic Markdown:\n- Headings: # H1, ## H2, ### H3\n- Bold: **text**, Italic: *text*, Strikethrough: ~~text~~\n- Lists: - item or 1. item\n- Checkboxes: - [ ] unchecked, - [x] checked\n- Code: `inline` or ```block```\n- Links: [text](url)\n- Blockquotes: > quote\n\nColors & Styling:\n- Colored text: {red}important{/red}, {green}success{/green}, {blue}info{/blue}\n  Available: red, green, blue, yellow, orange, purple, pink, cyan, gray\n- Highlighted text: {highlight:yellow}highlighted{/highlight}\n- Badges/Pills: [[badge text]] or [badge:green]status[/badge]\n\nVisual Elements:\n- Progress bars: [progress:75] or [progress:75:green]\n- Icons: :icon:ph:star-fill: (use Phosphor icons)\n- Callout blocks:\n  :::info\n  Information callout\n  :::\n  Types: info, success, warning, error, tip\n\n- Colored blockquotes: > [warning] This is a warning",
    "description_mini": "Display formatted content. FALLBACK only - prefer show_event/show_task/show_note. Use for custom summaries, analysis, comparisons. Supports markdown and rich formatting.",
    "help_category": "advanced",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title displayed at the top of the modal (e.g., \"Meeting Summary\", \"Task Analysis\", \"Recommendations\")"
        },
        "content": {
          "type": "string",
          "description": "The content to display. Supports rich markdown formatting with colors, callouts, badges, and progress bars."
        },
        "category": {
          "type": "string",
          "enum": [
            "info",
            "summary",
            "analysis",
            "recommendation",
            "comparison",
            "list",
            "other"
          ],
          "description": "Optional category for styling/icon. Defaults to \"info\"."
        }
      },
      "required": [
        "title",
        "content"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_content_view",
    "description": "Close the content view modal. Call when user says \"close\", \"dismiss\", \"okay\", \"got it\" while viewing content.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "show_list",
    "description": "Display a structured list in a visually appealing modal. This is a FALLBACK tool for generic lists only.\n\n⚠️ DO NOT USE THIS TOOL FOR:\n- Events/meetings → use show_events instead\n- Tasks → use show_tasks instead  \n- Notes → use show_notes instead\n- Actionables → use show_actionables instead\n- People/members → use appropriate lookup tools\n\nUSE THIS TOOL FOR:\n- Custom generated lists (e.g., \"5 ways to improve productivity\")\n- Comparison lists or rankings\n- Step-by-step instructions\n- Feature lists or capabilities\n- Any structured list data without a dedicated display tool\n\nThe tool accepts structured JSON with rich item metadata for visual display.",
    "description_mini": "Display generic list in modal. FALLBACK only - use show_events/show_tasks/show_notes for those types. For custom lists, rankings, instructions.",
    "help_category": "advanced",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title for the list modal (e.g., \"Top 5 Recommendations\", \"Meeting Preparation Steps\")",
          "description_mini": "Modal title"
        },
        "items": {
          "type": "array",
          "description": "Array of list items with optional metadata",
          "description_mini": "List items",
          "items": {
            "type": "object",
            "properties": {
              "text": {
                "type": "string",
                "description": "Primary text/title of the item (required)"
              },
              "subtitle": {
                "type": "string",
                "description": "Secondary text or description"
              },
              "icon": {
                "type": "string",
                "description": "Phosphor icon name (e.g., \"star\", \"check-circle\", \"warning\"). Omit \"ph:\" prefix."
              },
              "status": {
                "type": "string",
                "enum": [
                  "success",
                  "warning",
                  "error",
                  "info",
                  "pending",
                  "neutral"
                ],
                "description": "Status indicator affecting item styling"
              },
              "badge": {
                "type": "string",
                "description": "Small badge/tag text (e.g., \"NEW\", \"IMPORTANT\", \"Optional\")"
              },
              "badge_color": {
                "type": "string",
                "enum": [
                  "green",
                  "red",
                  "blue",
                  "yellow",
                  "orange",
                  "purple",
                  "gray"
                ],
                "description": "Color for the badge. Defaults to gray."
              },
              "checked": {
                "type": "boolean",
                "description": "For checklist style - whether item is checked"
              },
              "progress": {
                "type": "number",
                "description": "Progress percentage (0-100) to show a mini progress bar"
              }
            },
            "required": [
              "text"
            ]
          }
        },
        "style": {
          "type": "string",
          "enum": [
            "bullets",
            "numbered",
            "checklist",
            "cards",
            "minimal"
          ],
          "description": "List display style. Defaults to \"cards\"."
        },
        "sections": {
          "type": "array",
          "description": "Optional: group items into sections with headers",
          "description_mini": "Group items into sections",
          "items": {
            "type": "object",
            "properties": {
              "header": {
                "type": "string",
                "description": "Section header text"
              },
              "items": {
                "type": "array",
                "description": "Items in this section (same structure as top-level items)",
                "items": {
                  "type": "object",
                  "properties": {
                    "text": {
                      "type": "string",
                      "description": "Primary text/title of the item"
                    },
                    "subtitle": {
                      "type": "string",
                      "description": "Secondary text or description"
                    },
                    "icon": {
                      "type": "string",
                      "description": "Phosphor icon name"
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "success",
                        "warning",
                        "error",
                        "info",
                        "pending",
                        "neutral"
                      ]
                    },
                    "badge": {
                      "type": "string",
                      "description": "Badge/tag text"
                    },
                    "badge_color": {
                      "type": "string",
                      "enum": [
                        "green",
                        "red",
                        "blue",
                        "yellow",
                        "orange",
                        "purple",
                        "gray"
                      ]
                    },
                    "checked": {
                      "type": "boolean"
                    },
                    "progress": {
                      "type": "number"
                    }
                  },
                  "required": [
                    "text"
                  ]
                }
              }
            }
          }
        },
        "footer": {
          "type": "string",
          "description": "Optional footer text (supports markdown)"
        }
      },
      "required": [
        "title",
        "items"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_list_view",
    "description": "Close the list view modal. Call when user says \"close\", \"dismiss\", \"okay\", \"done\" while viewing a list.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "display_html_message",
    "description": "Display rich HTML content directly in the chat conversation (TEXT AGENT ONLY).\n\nUse this tool to render beautifully formatted messages with colors, highlights, and styling directly in the chat - NOT in a modal.\n\nWHEN TO USE:\n- Daily digest/briefing summaries with highlighted events\n- Formatted overviews with color-coded priorities\n- Any response that benefits from visual formatting inline with conversation\n- When you want the content to appear as part of the chat flow, not in a popup\n\nHTML STYLING CLASSES (Tailwind-based):\n- Event/item highlights: <span class='bg-blue-100 px-2 py-1 rounded text-sm'>Event Name</span>\n- Color variations: bg-blue-100, bg-yellow-100, bg-purple-100, bg-green-100, bg-red-100, bg-orange-100\n- Subtle context: <p class='text-gray-600 text-sm mt-1'>Additional context</p>\n- Bold labels: <p><strong>Label:</strong> content</p>\n- Spacing: <div class='mt-2'> for sections\n- Priority colors: text-red-600 (urgent), text-yellow-600 (warning), text-green-600 (good)\n\nEXAMPLE FORMAT:\n\"<p><strong>Today:</strong> <span class='bg-yellow-100 px-2 py-1 rounded text-sm'>Board meeting at 2 PM</span> needs final presentation ready.</p>\n<p class='text-gray-600 text-sm mt-1'>Key prep: Review financial projections by 1 PM.</p>\n<div class='mt-2'><strong>Tomorrow:</strong> <span class='bg-blue-100 px-2 py-1 rounded text-sm'>Client call</span> - prepare status update.</div>\"\n\nNOTE: This creates a message in the chat that renders as HTML. Keep content concise and visually scannable.",
    "help_category": "advanced",
    "parameters": {
      "type": "object",
      "properties": {
        "html_content": {
          "type": "string",
          "description": "The HTML content to display. Use Tailwind CSS classes for styling (bg-blue-100, text-sm, rounded, etc.)"
        }
      },
      "required": [
        "html_content"
      ]
    }
  },
  {
    "type": "function",
    "name": "send_message",
    "description": "Send a message to a team pulse or DM. Both Teams and DMs are pulses - Teams have category TEAM, DMs have category ONETOONE.\n\nFor @mentions, wrap the person's name in the message naturally - the system will format it. For AI replies in team channels, include \"@pulse\" in the message.\n\nIf topic_id is provided, the message is sent to that specific topic within the pulse. If omitted, message goes to \"General\" (top-level).\n\nTo reply to a specific message (shows as a linked reply), include reply_to_message_id.",
    "description_mini": "Send message to team/DM. Use pulse_id from lookup. Optional topic_id, reply_to_message_id.",
    "help_category": "chat",
    "help_examples": [
      "Send a message to John",
      "Message the Marketing team about the launch"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse (team channel or DM) to send the message to. Can be a pulse ref like \"pulse_1\" from find_dm_with_person or lookup_pulses, or a full UUID."
        },
        "content": {
          "type": "string",
          "description": "The message content. Plain text - will be formatted automatically."
        },
        "topic_id": {
          "type": "string",
          "description": "Optional: The topic ID to send the message to within the pulse. Omit for General/top-level messages."
        },
        "reply_to_message_id": {
          "type": "string",
          "description": "Optional: The ID of a message to reply to. When provided, this message will appear as a reply linked to the original message. Get the message ID from lookup_messages."
        }
      },
      "required": [
        "pulse_id",
        "content"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_messages",
    "description": "Get recent messages from a pulse (team channel or DM). Returns messages with sender info, timestamps, and content.\n\nIMPORTANT: You must call lookup_pulses first to find the pulse_id. Never guess or fabricate a pulse_id.\n\nUse topic_id to filter messages to a specific topic. Omit topic_id to get messages from all topics (or General).",
    "description_mini": "Get messages from pulse. Call lookup_pulses first to get pulse_id.",
    "help_category": "chat",
    "help_examples": [
      "What's been happening in Marketing?",
      "Show me my recent messages with John"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID or ref (e.g., \"pulse_1\") from lookup_pulses. Must be a valid ID from a previous lookup."
        },
        "topic_id": {
          "type": "string",
          "description": "Optional: Filter to messages in this specific topic. Omit for all messages or General."
        },
        "limit": {
          "type": "number",
          "description": "Maximum messages to return (default 20, max 50)"
        },
        "page": {
          "type": "number",
          "description": "Page number for pagination (default 1)"
        }
      },
      "required": [
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "search_messages",
    "description": "Search for messages in a pulse by keyword. Searches message content and returns matching messages.",
    "description_mini": "Search messages by keyword in pulse.",
    "help_category": "chat",
    "help_examples": [
      "Search for 'budget' in Marketing chat",
      "Find messages about the project deadline"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse to search in"
        },
        "query": {
          "type": "string",
          "description": "The search query/keyword to find in messages"
        },
        "limit": {
          "type": "number",
          "description": "Maximum results to return (default 10)"
        }
      },
      "required": [
        "pulse_id",
        "query"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_unread_counts",
    "description": "Get unread message counts across all pulses (team channels and DMs). Returns pulses that have unread messages.",
    "description_mini": "Get unread counts for all pulses.",
    "help_category": "chat",
    "help_examples": [
      "Do I have any unread messages?",
      "What channels have new messages?"
    ],
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "show_messages",
    "description": "Display messages in a chat-bubble visual modal. Use when user wants to SEE messages, review a conversation, or view search results. Much better than reading messages aloud. Supports messages from lookup_messages, search_messages, or lookup_pinned_messages. IMPORTANT: Pass all message fields from lookup result including reactions, is_pinned, has_replies - do not omit any fields.",
    "description_mini": "Display messages in modal. Pass all fields from lookup.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The pulse ID the messages are from (for navigation)"
        },
        "pulse_name": {
          "type": "string",
          "description": "Name of the pulse/channel to show in header"
        },
        "messages": {
          "type": "array",
          "description": "Array of message objects from lookup_messages or search_messages. Pass all fields from lookup result including reactions and is_pinned.",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "content": {
                "type": "string"
              },
              "sender": {
                "type": "string"
              },
              "sender_id": {
                "type": "string"
              },
              "created_at": {
                "type": "string"
              },
              "reactions": {
                "type": "array",
                "description": "Array of reactions on this message",
                "items": {
                  "type": "object",
                  "properties": {
                    "emoji": {
                      "type": "string"
                    },
                    "count": {
                      "type": "number"
                    }
                  }
                }
              },
              "is_pinned": {
                "type": "boolean"
              },
              "has_replies": {
                "type": "boolean"
              },
              "reply_thread_id": {
                "type": "string"
              }
            }
          }
        },
        "context": {
          "type": "string",
          "description": "Context label: \"Recent messages\", \"Search: keyword\", \"Pinned messages\", \"Topic: name\""
        },
        "topic_id": {
          "type": "string",
          "description": "Optional topic ID if messages are from a specific topic"
        }
      },
      "required": [
        "pulse_id",
        "pulse_name",
        "messages"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_messages_view",
    "description": "Close the messages view modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "show_pulses",
    "description": "Display a list of channels and DMs in a visual modal. Use when user asks to see their channels, teams, or conversations. Shows Teams and DMs in organized sections.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "pulses": {
          "type": "array",
          "description": "Array of pulse objects from lookup_pulses",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "category": {
                "type": "string",
                "enum": [
                  "TEAM",
                  "ONETOONE"
                ]
              },
              "icon": {
                "type": "string"
              },
              "member_count": {
                "type": "number"
              }
            }
          }
        },
        "title": {
          "type": "string",
          "description": "Optional title, e.g. \"Your Channels\" or \"Team Channels\""
        }
      },
      "required": [
        "pulses"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_pulses_list",
    "description": "Close the pulses list modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "show_pulse",
    "description": "Display details of a single pulse/channel in a modal. Shows name, description, member count, and topics. Use when user asks about a specific channel.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "pulse": {
          "type": "object",
          "description": "Pulse object from get_pulse_details",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "category": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "icon": {
              "type": "string"
            },
            "member_count": {
              "type": "number"
            }
          }
        },
        "topics": {
          "type": "array",
          "description": "Optional array of topics in this pulse from lookup_topics",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "title": {
                "type": "string"
              }
            }
          }
        },
        "members": {
          "type": "array",
          "description": "Optional array of first few members from lookup_pulse_members",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "role": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "pulse"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_pulse_view",
    "description": "Close the pulse details modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "show_topics",
    "description": "Display topics list for a pulse in a visual modal. Use when user asks to see topics in a channel.",
    "help_category": "chat",
    "help_examples": ["Show topics in the Design channel", "What topics are in Marketing?"],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The pulse ID (for navigation)"
        },
        "pulse_name": {
          "type": "string",
          "description": "Name of the pulse for header display"
        },
        "topics": {
          "type": "array",
          "description": "Array of topic objects from lookup_topics",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "title": {
                "type": "string"
              },
              "created_by": {
                "type": "string"
              },
              "created_at": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": [
        "pulse_id",
        "pulse_name",
        "topics"
      ]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_topics_list",
    "description": "Close the topics list modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "get_pulse_details",
    "description": "Get detailed information about a specific pulse including name, description, member count, and settings.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse to get details for"
        }
      },
      "required": [
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "create_team_pulse",
    "description": "Create a new team channel (pulse with category TEAM). IMPORTANT: Before creating, use lookup_pulses to check if a similar channel already exists. Only create if user explicitly wants a NEW channel. Requires user confirmation.",
    "description_mini": "Create team channel. Use lookup_pulses first to check for existing. REQUIRES CONFIRMATION.",
    "help_category": "chat",
    "help_examples": [
      "Create a new Marketing channel",
      "Set up a team channel for the project"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Name for the team channel (e.g., \"Marketing Team\", \"Project Alpha\")"
        },
        "description": {
          "type": "string",
          "description": "Optional description of the channel's purpose"
        },
        "icon": {
          "type": "string",
          "enum": [
            "generic",
            "hr",
            "finance",
            "ops",
            "account",
            "sales",
            "marketing",
            "engineering",
            "product",
            "design",
            "support",
            "legal"
          ],
          "description": "Optional icon for the channel. Defaults to \"generic\"."
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "type": "function",
    "name": "find_dm_with_person",
    "description": "Find an existing DM conversation with a specific person by checking pulse members. Use this when:\n- User asks to see messages with someone but lookup_pulses shows no DM with that name\n- There are \"One-to-One\" named pulses that might be the DM\n- You need to verify if a DM exists before telling user there is none\n\nThis tool checks the members of all ONETOONE pulses to find one containing the specified user.\n\nIMPORTANT: Call this BEFORE ever suggesting to create a new DM. If this returns no result, tell the user \"You don't have an existing conversation with [name]\" and ask if they want to start one.",
    "description_mini": "Find existing DM with a person. Call BEFORE suggesting to create DM.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "string",
          "description": "The user ID to find a DM with. Use lookup_org_members first to get the user ID."
        },
        "user_name": {
          "type": "string",
          "description": "The user's name (for display in results). Optional but recommended."
        }
      },
      "required": [
        "user_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "create_dm_pulse",
    "description": "Create a NEW DM conversation with a user. CRITICAL: Before calling this, you MUST first call find_dm_with_person to check if a DM already exists. NEVER call this just because lookup_pulses doesn't show the person's name - some DMs are named \"One-to-One\" instead of the person's name.\n\nOnly call this when:\n1. find_dm_with_person returned no existing DM, AND\n2. User explicitly wants to START or CREATE a new conversation\n\nRequires user confirmation.",
    "description_mini": "Create new DM. MUST call find_dm_with_person first.",
    "help_category": "chat",
    "help_examples": [
      "Start a conversation with John",
      "Create a DM with Sarah"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "string",
          "description": "The user ID to start a DM with. Use lookup_org_members to find user IDs."
        }
      },
      "required": [
        "user_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_pulse",
    "description": "Update a pulse's name, description, or icon. Requires ADMIN or OWNER role in the pulse.",
    "description_mini": "Update pulse name/description/icon. Requires ADMIN/OWNER.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse to update"
        },
        "name": {
          "type": "string",
          "description": "New name for the pulse"
        },
        "description": {
          "type": "string",
          "description": "New description for the pulse"
        },
        "icon": {
          "type": "string",
          "enum": [
            "generic",
            "hr",
            "finance",
            "ops",
            "account",
            "sales",
            "marketing",
            "engineering",
            "product",
            "design",
            "support",
            "legal"
          ],
          "description": "New icon for the pulse"
        }
      },
      "required": [
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_pulse",
    "description": "Delete a pulse (team channel). Only the OWNER can delete a pulse. This action is irreversible and will delete all messages in the channel.",
    "description_mini": "Delete pulse. OWNER only. Irreversible.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse to delete"
        },
        "pulse_name": {
          "type": "string",
          "description": "The name of the pulse (for confirmation display)"
        }
      },
      "required": [
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "add_pulse_member",
    "description": "Add a member to a pulse. Requires ADMIN or OWNER role. Specify the role for the new member.",
    "help_category": "chat",
    "help_examples": ["Add John to the project channel", "Add a member to Marketing"],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse to add the member to"
        },
        "user_id": {
          "type": "string",
          "description": "The user ID to add. Use lookup_org_members to find user IDs."
        },
        "role": {
          "type": "string",
          "enum": [
            "ADMIN",
            "STAFF",
            "GUEST"
          ],
          "description": "Role for the new member. ADMIN can manage members, STAFF is regular member, GUEST has limited access. Default is STAFF."
        }
      },
      "required": [
        "pulse_id",
        "user_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "remove_pulse_member",
    "description": "Remove a member from a pulse. Requires ADMIN or OWNER role. Cannot remove other ADMINs or the OWNER.",
    "help_category": "chat",
    "help_examples": ["Remove Alex from the channel", "Take Sarah off the Marketing team"],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse"
        },
        "pulse_member_id": {
          "type": "string",
          "description": "The pulse_member ID (not user_id) to remove. Get this from lookup_pulse_members."
        },
        "member_name": {
          "type": "string",
          "description": "The name of the member (for confirmation display)"
        }
      },
      "required": [
        "pulse_id",
        "pulse_member_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_topics",
    "description": "Get topics in a pulse. Topics are sub-channels for organizing messages within a pulse.\n\nIMPORTANT: You must call lookup_pulses first to find the pulse_id. Never guess or fabricate a pulse_id.",
    "description_mini": "Get pulse topics. Call lookup_pulses first.",
    "help_category": "chat",
    "help_examples": ["What topics are in the Design channel?", "List topics in Marketing"],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID or ref (e.g., \"pulse_1\") from lookup_pulses. Must be a valid ID from a previous lookup."
        }
      },
      "required": [
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "create_topic",
    "description": "Create a new topic (sub-channel) in a pulse for organizing messages.",
    "description_mini": "Create topic in pulse.",
    "help_category": "chat",
    "help_examples": ["Create a topic for the budget discussion", "Start a new topic in Marketing"],
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse to create the topic in"
        },
        "name": {
          "type": "string",
          "description": "Name for the topic (e.g., \"Q4 Planning\", \"Bug Reports\", \"Announcements\")"
        }
      },
      "required": [
        "pulse_id",
        "name"
      ]
    }
  },
  {
    "type": "function",
    "name": "update_topic",
    "description": "Rename a topic. Use this when user asks to rename, update, or change the name of a topic.",
    "description_mini": "Rename topic.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "topic_id": {
          "type": "string",
          "description": "The ID of the topic to rename. Get this from lookup_topics."
        },
        "new_name": {
          "type": "string",
          "description": "The new name for the topic"
        }
      },
      "required": [
        "topic_id",
        "new_name"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_topic",
    "description": "Delete a topic from a pulse. Messages in the topic will be moved to General.",
    "description_mini": "Delete topic. Messages move to General.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "topic_id": {
          "type": "string",
          "description": "The ID of the topic to delete"
        },
        "topic_name": {
          "type": "string",
          "description": "The name of the topic (for confirmation display)"
        },
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse containing the topic"
        }
      },
      "required": [
        "topic_id",
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "edit_message",
    "description": "Edit your own message content. You can only edit messages you sent.",
    "description_mini": "Edit own message.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "message_id": {
          "type": "string",
          "description": "The ID of the message to edit"
        },
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse containing the message"
        },
        "new_content": {
          "type": "string",
          "description": "The new message content"
        }
      },
      "required": [
        "message_id",
        "pulse_id",
        "new_content"
      ]
    }
  },
  {
    "type": "function",
    "name": "delete_message",
    "description": "Delete your own message. You can only delete messages you sent.",
    "description_mini": "Delete own message.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "message_id": {
          "type": "string",
          "description": "The ID of the message to delete"
        },
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse containing the message"
        }
      },
      "required": [
        "message_id",
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "pin_message",
    "description": "Pin or unpin a message in a pulse. Pinned messages are highlighted and easily accessible.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "message_id": {
          "type": "string",
          "description": "The ID of the message to pin/unpin"
        },
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse containing the message"
        },
        "pinned": {
          "type": "boolean",
          "description": "True to pin, false to unpin"
        }
      },
      "required": [
        "message_id",
        "pulse_id",
        "pinned"
      ]
    }
  },
  {
    "type": "function",
    "name": "lookup_pinned_messages",
    "description": "Get pinned messages in a pulse.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse to get pinned messages from"
        }
      },
      "required": [
        "pulse_id"
      ]
    }
  },
  {
    "type": "function",
    "name": "add_reaction",
    "description": "Add an emoji reaction to a message.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "message_id": {
          "type": "string",
          "description": "The ID of the message to react to"
        },
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse containing the message"
        },
        "reaction": {
          "type": "string",
          "description": "The emoji reaction (e.g., \"👍\", \"❤️\", \"🎉\", \"😊\", \"🔥\")"
        }
      },
      "required": [
        "message_id",
        "pulse_id",
        "reaction"
      ]
    }
  },
  {
    "type": "function",
    "name": "remove_reaction",
    "description": "Remove an emoji reaction from a message. Use this when the user wants to undo or remove a reaction they previously added.",
    "help_category": "chat",
    "parameters": {
      "type": "object",
      "properties": {
        "message_id": {
          "type": "string",
          "description": "The ID of the message to remove the reaction from"
        },
        "pulse_id": {
          "type": "string",
          "description": "The ID of the pulse containing the message"
        },
        "reaction": {
          "type": "string",
          "description": "The emoji reaction to remove (e.g., \"👍\", \"❤️\", \"🎉\", \"😊\", \"🔥\")"
        }
      },
      "required": [
        "message_id",
        "pulse_id",
        "reaction"
      ]
    }
  },
  {
    "type": "function",
    "name": "start_collab",
    "description": "Start a LIVE collaboration call/session with internal team members. This opens the Smart Collab page to initiate real-time communication.\n\nUSE THIS FOR LIVE CALLS with internal team:\n- 'Hop on a call with Sarah'\n- 'Quick sync with the design team'\n- 'Let's jump on a video chat'\n- 'Start a call with marketing'\n- 'I need to sync with John'\n\nKEY CHARACTERISTICS:\n- LIVE real-time communication (video/audio call)\n- Typically INTERNAL team members (org members, pulse members)\n- Often tied to a specific pulse/team channel\n- User wants to START talking to someone NOW\n\nDO NOT USE FOR:\n- Recording conversations (use start_instant_meeting)\n- External meetings with clients/vendors (use start_instant_meeting)\n- Meetings already in progress (use start_instant_meeting)\n- Solo brain dumps (use start_brain_dump)\n\nDISAMBIGUATION:\nIf user says 'meeting' without clear intent, ask: 'Would you like to start a live call with your team, or record a conversation that's happening?'\n\nATTENDEE RESOLUTION:\n- Individual names are resolved via org member lookup\n- 'team'/'whole team' = members of specified pulse\n- Use lookup_pulses first if user mentions a team name\n\nNOTE: This ends the voice session since it navigates away from the modal.",
    "description_mini": "START a live call with internal team. Use for video/audio calls NOW. Ends voice session.",
    "help_category": "collab",
    "help_examples": [
      "Start a call with Sarah",
      "Quick sync with the design team",
      "Hop on a video chat with John"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "attendees": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of attendee names, or [\"team\"]/[\"whole team\"] to include all members of the specified pulse"
        },
        "pulse_id": {
          "type": "string",
          "description": "Optional: The ID of a specific pulse/team to get members from when using \"team\" keyword. Use lookup_pulses to find this."
        },
        "pulse_name": {
          "type": "string",
          "description": "Optional: The name of the team (for confirmation message). Used with pulse_id."
        },
        "is_online": {
          "type": "boolean",
          "description": "Whether this is an online (true) or in-person (false) collaboration. Default: true"
        }
      },
      "required": [
        "attendees"
      ]
    }
  },
  {
    "type": "function",
    "name": "delegate_to_text_agent",
    "description": "Delegate a text-heavy task to the Text Agent for better handling. Use this for:\n- Drafting emails, messages, or documents\n- Writing detailed plans or proposals\n- Creating summaries or reports\n- Any task requiring significant text generation or iteration\n\nThe Text Agent has a much larger context window and is better suited for writing tasks. Results are displayed in an editable modal so the user can review and modify.\n\nWORKFLOW FOR NEW DRAFTS:\n1. Gather requirements from user (recipient, tone, key points)\n2. Call this tool with clear instructions\n3. Tell user you're drafting and it will appear on screen\n4. After completion, offer to read it, make changes, or help them send it\n\nWORKFLOW FOR EDITS:\nWhen user asks to modify an existing draft (make it shorter, more formal, add something, etc.):\n1. Include the current draft in 'current_draft' parameter\n2. Put the edit instructions in 'instructions'\n3. The Text Agent will revise based on the current content",
    "description_mini": "Draft emails/messages/documents. Displays in modal. For edits include current_draft.",
    "help_category": "drafting",
    "help_examples": [
      "Draft an email to John about the budget",
      "Write a project update for the team",
      "Help me compose a message to my manager"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "task_type": {
          "type": "string",
          "enum": ["draft_email", "draft_message", "write_document", "create_plan", "summarize", "other"],
          "description": "The type of text task to perform"
        },
        "instructions": {
          "type": "string",
          "description": "Detailed instructions for what to write or how to edit. For new drafts: include purpose, tone, key points. For edits: describe what changes to make (e.g., 'make it shorter', 'add a greeting', 'make it more formal')."
        },
        "current_draft": {
          "type": "string",
          "description": "REQUIRED FOR EDITS: The current draft content that needs to be revised. Get this from the previous delegate_to_text_agent response or from the draft modal. If empty, a new draft will be created."
        },
        "context": {
          "type": "string",
          "description": "Relevant context: recipient info, meeting details, background information, previous conversation context, etc."
        },
        "recipient": {
          "type": "string",
          "description": "For emails/messages: the recipient's name and/or role"
        },
        "subject": {
          "type": "string",
          "description": "For emails: suggested subject line"
        }
      },
      "required": ["task_type", "instructions"]
    }
  },
  {
    "type": "function",
    "name": "save_draft",
    "description": "Save the current draft to Notes. Use when user says 'save it', 'save the draft', 'save to notes', 'that looks good, save it', etc.\n\nThe draft will be saved with appropriate tags based on type (email-draft, message-draft, etc.) and linked to the voice session.",
    "description_mini": "Save draft to Notes.",
    "help_category": "drafting",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_draft",
    "description": "Close/discard the draft modal without saving. Use when user says 'close it', 'discard', 'never mind', 'cancel', 'don't save', etc.",
    "description_mini": "Discard draft without saving.",
    "help_category": "drafting",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "minimize_draft",
    "description": "Minimize the draft modal to a small tab on the side of the screen. Use when user says 'minimize it', 'put it aside', 'set it aside', 'hide for now', 'I need to check something'. The draft remains accessible and can be restored later.",
    "description_mini": "Minimize draft to side tab.",
    "help_category": "drafting",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "restore_draft",
    "description": "Restore/bring back a minimized draft modal. Use when user says 'bring back the draft', 'show the draft again', 'open the draft', 'where's my draft'. Only works if a draft was previously minimized.",
    "description_mini": "Restore minimized draft.",
    "help_category": "drafting",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "start_instant_meeting",
    "description": "Start RECORDING an unscheduled meeting or conversation. This opens the recording UI to capture audio for transcription and AI analysis.\n\nUSE THIS FOR RECORDING conversations:\n- 'Record this meeting'\n- 'I'm in a meeting with a client, capture this'\n- 'Log this conversation with the vendor'\n- 'Record my call with Alex'\n- 'I'm having a chat with someone, record it'\n- 'Capture this discussion'\n\nKEY CHARACTERISTICS:\n- RECORDS audio for later transcription and AI insights\n- Often EXTERNAL people (clients, vendors, partners, contacts)\n- Meeting may already be IN PROGRESS\n- Produces transcript, action items, and insights after recording\n- Speaker diarization identifies different voices\n\nDO NOT USE FOR:\n- Starting a live call with your team (use start_collab)\n- Internal team syncs (use start_collab)\n- Solo recordings without other people (use start_brain_dump)\n\nDISAMBIGUATION:\nIf user says 'meeting' without clear intent, ask: 'Would you like to start a live call with your team, or record a conversation that's happening?'\n\nATTENDEE RESOLUTION:\n- Check lookup_org_members AND lookup_contacts in parallel\n- External people often in contacts, not org members\n- Names without emails are OK - user can add in UI\n- If no attendees mentioned, just open UI\n\nNOTE: This ends the voice/text session since it navigates away from the modal.",
    "description_mini": "RECORD an unscheduled meeting/conversation. For recording in-progress conversations with clients/vendors. Use start_collab for live team calls. Ends voice session.",
    "help_category": "recording",
    "help_examples": [
      "Record this meeting",
      "Capture this conversation with the client",
      "Start recording my call with Alex"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "attendees": {
          "type": "array",
          "description": "People in the meeting. Can be just names - emails are optional. If you couldn't resolve a name via lookup tools, still include them with just the name.",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "description": "Person's name"
              },
              "email": {
                "type": "string",
                "description": "Person's email address (optional - can be empty if not resolved)"
              },
              "gravatar": {
                "type": "string",
                "description": "Avatar URL if available"
              },
              "source": {
                "type": "string",
                "enum": ["organization", "contact", "email", "name_only"],
                "description": "Where the person was found: organization (org member), contact (from contacts), email (external email), name_only (just a name, no email)"
              }
            },
            "required": ["name"]
          }
        },
        "title": {
          "type": "string",
          "description": "Optional meeting title/topic, e.g., 'Product roadmap discussion'"
        }
      }
    }
  },
  {
    "type": "function",
    "name": "start_brain_dump",
    "description": "Start a personal brain dump recording session. Use when user wants to speak their thoughts out loud and have Zunou analyze them.\n\nCOMMON TRIGGERS:\n- 'Start a brain dump'\n- 'I want to do a brain dump'\n- 'Let me think out loud'\n- 'Record my thoughts'\n- 'I need to brain dump'\n\nBrain dumps are solo - just the user speaking. No other participants. The recording will be transcribed and analyzed by Zunou to generate insights.\n\nNOTE: This ends the voice/text session since it navigates away from the modal.",
    "description_mini": "Start brain dump recording. Solo only, no participants. Ends session.",
    "help_category": "recording",
    "help_examples": [
      "Start a brain dump",
      "I want to think out loud",
      "Record my thoughts"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["on-device", "google-meet"],
          "description": "Recording mode. 'on-device' records directly on the device, 'google-meet' opens a Meet call with Zunou's notetaker bot. Defaults to 'on-device' (recommended)."
        },
        "auto_start": {
          "type": "boolean",
          "description": "If true, automatically start recording in the specified mode without showing mode selection. If false/omitted, show the mode selection step first."
        }
      }
    }
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // RELAY TOOLS
  // Tools for creating and managing Agent Relays
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    "type": "function",
    "name": "spawn_relay",
    "description": "Create a new Agent Relay - an autonomous AI agent that will gather information from one or more people on your behalf.\n\nCOMMON TRIGGERS:\n- 'Send an relay to John'\n- 'Ask Sarah about the budget timeline'\n- 'Get back to me with what Mike thinks about the proposal'\n- 'Ask everyone on the team about their project status'\n- 'Send this question to John, Sarah, and Mike'\n\nTHREADS-ONLY MODEL:\nALL relays use the recipients[] array - even for single recipients. Each recipient gets their own 'thread' of the relay.\n\nMULTI-RECIPIENT MODES:\n- thread_mode: 'parallel' (default, all work simultaneously) or 'sequential' (one at a time)\n- completion_mode: 'all' (wait for all), 'any' (first response completes), 'majority' (>50%)\n- knowledge_sharing: 'shared' (everyone sees all insights) or 'isolated' (individual contexts)\n\nWORKFLOW:\n1. Use lookup_org_members to find recipient(s) first\n2. Create the relay with clear objective and context\n3. Each recipient gets their own 'thread' of the relay\n4. They engage with it at their convenience\n5. AI gathers information through natural conversation with each\n6. Synthesized report is delivered when completion_mode is satisfied",
    "description_mini": "Create an Agent Relay to gather info. Supports 1-10 recipients with parallel threads.",
    "help_category": "relays",
    "help_examples": [
      "Send an relay to John about the budget",
      "Ask Sarah when the report will be ready",
      "Ask John, Sarah and Mike about project status",
      "Send this question to everyone on the team"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "recipients": {
          "type": "array",
          "description": "Array of recipients (1-10). Each creates a thread. REQUIRED - use person_N refs from lookup_org_members.",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "User ID from lookup_org_members (person_N ref or actual ID)" },
              "name": { "type": "string", "description": "Display name" },
              "gravatar": { "type": "string", "description": "Optional gravatar URL" }
            },
            "required": ["id", "name"]
          },
          "minItems": 1,
          "maxItems": 10
        },
        "objective": {
          "type": "string",
          "description": "Clear statement of what information to gather. Be specific about what you need to know."
        },
        "context": {
          "type": "string",
          "description": "Background context to help the relay have an informed conversation. Why do you need this info? What project is this for?"
        },
        "success_criteria": {
          "type": "string",
          "description": "What does a successful response look like? What specific information would satisfy this relay?"
        },
        "questions": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Optional list of specific questions the relay should ask. The AI will use these as a guide but can adapt based on conversation."
        },
        "priority": {
          "type": "string",
          "enum": ["low", "normal", "high", "urgent"],
          "description": "Priority level. 'urgent' relays are highlighted for the recipient. Default is 'normal'."
        },
        "due_date": {
          "type": "string",
          "description": "Optional due date in YYYY-MM-DD format. Infer from context like 'by Friday', 'end of week', 'tomorrow'."
        },
        "thread_mode": {
          "type": "string",
          "enum": ["parallel", "sequential"],
          "description": "For multi-recipient: 'parallel' (default) sends to all at once, 'sequential' sends one at a time."
        },
        "completion_mode": {
          "type": "string",
          "enum": ["all", "any", "majority"],
          "description": "For multi-recipient: when is relay complete? 'all' (default) waits for everyone, 'any' completes on first response, 'majority' on >50%."
        },
        "knowledge_sharing": {
          "type": "string",
          "enum": ["shared", "isolated"],
          "description": "For multi-recipient: 'shared' (default) lets recipients see insights from others, 'isolated' keeps each thread independent."
        },
        "thread_visibility": {
          "type": "string",
          "enum": ["private", "visible"],
          "description": "For multi-recipient: 'private' (default) = threads isolated, recipients only see their own thread. 'visible' = recipients can see who else is on the relay, their status, and gathered insights. Helps collaborative info gathering."
        },
        "expiry_days": {
          "type": "integer",
          "description": "Response deadline in days from now. Default 7. Set to null or omit for no deadline. Recipients must respond before the deadline or the thread auto-closes.",
          "minimum": 1,
          "maximum": 90
        },
        "expiry_policy": {
          "type": "string",
          "enum": ["extendable", "fixed", "none"],
          "description": "'extendable' (default) allows you to extend deadlines later, 'fixed' means hard deadline with no extensions, 'none' means no deadline at all."
        }
      },
      "required": ["recipients", "objective"]
    }
  },
  {
    "type": "function",
    "name": "lookup_relays",
    "description": "Get the user's relays - both sent and incoming.\n\nCOMMON TRIGGERS:\n- 'What relays do I have?'\n- 'Show my incoming relays'\n- 'What relays have I sent?'\n- 'Any relays waiting for me?'\n- 'Check on my relay to John'\n\nReturns relays organized by status (pending, active, returning, complete).",
    "description_mini": "Get user's relays (sent/incoming). Filter by direction and status.",
    "help_category": "relays",
    "help_examples": [
      "What relays do I have?",
      "Show my incoming relays",
      "Check on my relay to John"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "direction": {
          "type": "string",
          "enum": ["sent", "incoming", "both"],
          "description": "Which relays to look up. 'sent' = relays you created, 'incoming' = relays waiting for you to respond. Default 'both'."
        },
        "status": {
          "type": "string",
          "enum": ["pending", "active", "returning", "complete", "cancelled", "all"],
          "description": "Filter by status. Default 'all'."
        },
        "include_threads": {
          "type": "boolean",
          "description": "Include thread details for multi-recipient relays. Default false for list view, set true for detailed view."
        }
      }
    }
  },
  {
    "type": "function",
    "name": "get_relay_details",
    "description": "Get full details of a specific relay including conversation history, gathered knowledge, and thread progress for multi-recipient relays.\n\nFor multi-recipient relays, returns:\n- Overall relay status (derived from threads)\n- Thread progress (pending/active/complete counts)\n- Each thread's status and recipient\n- Shared knowledge pool (if knowledge_sharing=shared)\n\nUse this when the user asks about a specific relay's progress, wants to see what was learned, or needs to review the report.",
    "description_mini": "Get relay details including threads, conversation history and gathered knowledge.",
    "help_category": "relays",
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID to look up. Use relay_N refs from lookup_relays."
        },
        "include_threads": {
          "type": "boolean",
          "description": "Include detailed thread information for multi-recipient relays. Default true."
        }
      },
      "required": ["relay_id"]
    }
  },
  {
    "type": "function",
    "name": "cancel_relay",
    "description": "Cancel an relay that hasn't been completed yet. Only the OWNER (original sender) can cancel their relays.\n\nIMPORTANT: Owners can cancel relays at ANY point in the journey, even after they've been redirected/hopped to other people. This is useful for:\n- Broken or stuck relays\n- Changed priorities\n- Information no longer needed\n\nWhen an owner cancels an relay:\n- Status becomes 'cancelled'\n- All participants are notified\n- Journey stops immediately\n- Cannot be resumed",
    "description_mini": "Cancel relay (OWNER only). Stops journey, notifies all.",
    "help_category": "relays",
    "help_examples": ["Cancel the research relay", "I don't need that anymore"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID to cancel. Use relay_N refs from lookup_relays."
        },
        "reason": {
          "type": "string",
          "description": "Reason for cancellation. Be specific (e.g., 'Information no longer needed', 'Project cancelled', 'Found answer elsewhere')."
        }
      },
      "required": ["relay_id"]
    }
  },
  {
    "type": "function",
    "name": "update_relay_context",
    "description": "Add a context update or follow-up note to an existing relay. Only the relay OWNER can update context.\n\nUse when the owner wants to:\n- Add clarifying information to an existing relay\n- Provide status updates to recipients\n- Add follow-up notes without creating a new relay\n\nExamples:\n- 'Add a note to my relay that I'm still having issues'\n- 'Update the relay to say check Slack for details'\n- 'Append context to relay_1 about the latest findings'\n\nThe context update will be visible to recipients when they view or run the relay. If notify_recipients is true, pending/active recipients will receive a push notification about the update.",
    "description_mini": "Add context update to relay (OWNER only). Optionally nudges recipients.",
    "help_category": "relays",
    "help_examples": [
      "Add a note to my relay that I'm still having issues",
      "Update the relay to say check Slack for details",
      "Append context to relay_1 about the latest findings"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID or short ref (e.g., 'relay_1') to update"
        },
        "update_text": {
          "type": "string",
          "description": "The context update or follow-up note to add. Should be clear and concise. Max 2000 characters."
        },
        "notify_recipients": {
          "type": "boolean",
          "description": "Whether to nudge pending/active recipients about this update. ALWAYS set to true unless the user explicitly asks for a 'quiet', 'silent', or 'no notification' update."
        }
      },
      "required": ["relay_id", "update_text", "notify_recipients"]
    }
  },
  {
    "type": "function",
    "name": "update_relay_visibility",
    "description": "Change the thread visibility mode for a relay. Only the relay OWNER can change this.\n\nVisibility modes:\n- 'private' (default): Recipients only see their own thread. Best for surveys, unbiased opinions, or sensitive topics.\n- 'visible': Recipients can see who else is on the relay, their status (waiting/responded), and gathered insights. Helps collaborative info gathering.\n\nUse when:\n- Owner wants to make a relay more collaborative\n- Owner wants to make a relay more private\n- Changing from private to visible after some responses are in\n\nExamples:\n- 'Make that relay visible to all recipients'\n- 'Let everyone on the relay see each other's responses'\n- 'Make relay_1 private so they can't see each other'",
    "description_mini": "Change relay visibility (OWNER only). 'private' = isolated, 'visible' = see others.",
    "help_category": "relays",
    "help_examples": [
      "Make that relay visible to all recipients",
      "Let everyone see each other's responses",
      "Make the relay private"
    ],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID or short ref (e.g., 'relay_1') to update"
        },
        "visibility": {
          "type": "string",
          "enum": ["private", "visible"],
          "description": "'private' = recipients only see their own thread. 'visible' = recipients see all threads with names, status, and insights."
        }
      },
      "required": ["relay_id", "visibility"]
    }
  },
  // Relay conversation tools (used during relay-conversation sessions)
  {
    "type": "function",
    "name": "relay_log_insight",
    "description": "Log a key insight or piece of information learned during an relay conversation. Call this whenever you learn something valuable.\n\nONLY available during relay-conversation sessions.",
    "help_category": "relay-respond",
    "parameters": {
      "type": "object",
      "properties": {
        "insight": {
          "type": "string",
          "description": "The insight or information learned. Be specific and factual."
        },
        "category": {
          "type": "string",
          "enum": ["answer", "decision", "timeline", "blocker", "action_item", "context", "other"],
          "description": "Category of insight. Helps organize the final report."
        }
      },
      "required": ["insight"]
    }
  },
  {
    "type": "function",
    "name": "relay_add_question",
    "description": "Add an open question that still needs to be answered. Use when recipient doesn't know something yet or needs to get back to you.\n\nONLY available during relay-conversation sessions.",
    "help_category": "relay-partial",
    "parameters": {
      "type": "object",
      "properties": {
        "question": {
          "type": "string",
          "description": "The question that remains open/unanswered."
        }
      },
      "required": ["question"]
    }
  },
  {
    "type": "function",
    "name": "relay_mark_complete",
    "description": "Mark the relay as complete with the information gathered. Call this when you have successfully gathered the information needed.\n\nONLY available during relay-conversation sessions.",
    "help_category": "relay-respond",
    "parameters": {
      "type": "object",
      "properties": {
        "summary": {
          "type": "string",
          "description": "A clear summary of what was learned. This will be shown to the sender."
        },
        "recommendations": {
          "type": "string",
          "description": "Optional recommendations or suggested next steps based on what was learned."
        }
      },
      "required": ["summary"]
    }
  },
  {
    "type": "function",
    "name": "relay_mark_partial",
    "description": "Mark the relay as partially complete - some info gathered but more is needed. Use when recipient needs to get back to you or couldn't answer everything.\n\nONLY available during relay-conversation sessions.",
    "description_mini": "Mark relay partially complete. Some info gathered, more needed.",
    "help_category": "relay-partial",
    "parameters": {
      "type": "object",
      "properties": {
        "summary": {
          "type": "string",
          "description": "Summary of what was learned so far."
        },
        "pending": {
          "type": "string",
          "description": "What information is still pending and why."
        },
        "expected_follow_up": {
          "type": "string",
          "description": "When or how the recipient will follow up with remaining info."
        }
      },
      "required": ["summary", "pending"]
    }
  },
  {
    "type": "function",
    "name": "relay_redirect",
    "description": "Redirect an relay thread to another person. Works in two modes:\n\n**RECIPIENT MODE** (relay-conversation):\nWhen the current recipient can't fully answer but knows who can help.\n- 'You should talk to John about that'\n- 'Sarah would know better than me'\n\n**OWNER MODE** (relay-manager):\nWhen the owner wants to reassign a pending thread to a different person.\n- 'Hop Chris's task to Marcus'\n- 'Redirect the pending thread from Alisa to John'\n\nWORKFLOW:\n1. Use lookup_org_members to find the target recipient\n2. For owner mode: specify from_user_id to indicate which thread to redirect\n3. Call this tool with target and reason\n4. Original thread is marked as 'redirected'\n5. New thread is created for target person with context preserved\n\nIMPORTANT: Can only redirect to org members, not external contacts.",
    "description_mini": "Redirect relay thread to another person. lookup_org_members first.",
    "help_category": "relay-redirect",
    "parameters": {
      "type": "object",
      "properties": {
        "from_user_id": {
          "type": "string",
          "description": "OWNER MODE ONLY: User ID of the current recipient whose thread should be redirected. Use person_N refs. Required when owner is redirecting someone else's thread."
        },
        "target_user_id": {
          "type": "string",
          "description": "User ID of the person to redirect to. Use person_N refs from lookup_org_members."
        },
        "target_user_name": {
          "type": "string",
          "description": "Display name of the person to redirect to."
        },
        "reason": {
          "type": "string",
          "description": "Why redirecting to this person. What context should they have?"
        },
        "conversation_summary": {
          "type": "string",
          "description": "Brief summary of any information gathered before redirecting."
        }
      },
      "required": ["target_user_id", "target_user_name", "reason"]
    }
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // RELAY DISPLAY & MANAGEMENT TOOLS
  // Tools for showing relays in modals and managing them
  // ═══════════════════════════════════════════════════════════════════════════════
  {
    "type": "function",
    "name": "show_relay",
    "description": "Display a single relay in a modal popup. Shows the full relay details including mission, journey, knowledge gathered, and deliverable (if complete).\n\nUse this when:\n- User asks to see/view a specific relay\n- User wants details about an relay\n- After lookup_relays when user wants to focus on one\n\nThe modal has a 'View Full Report' button for completed relays and 'Respond' button for incoming relays.",
    "description_mini": "Show single relay modal. Use relay_N ref from lookup_relays.",
    "help_category": "relays",
    "help_examples": ["Open the details of that relay", "Show me the research relay"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID to display. Use relay_N refs from lookup_relays."
        }
      },
      "required": ["relay_id"]
    }
  },
  {
    "type": "function",
    "name": "show_relays",
    "description": "Display a list of relays in a modal popup. Shows relays with status badges, journey indicators, and quick actions.\n\nIMPORTANT: Call lookup_relays FIRST, then pass the relay refs/IDs here. This tool resolves relays from session context (registered by lookup_relays).\n\nUse this when:\n- User asks to see their relays\n- After lookup_relays to give a visual overview\n- User wants to browse sent or incoming relays\n\nUser can tap an relay to see details or take action.",
    "description_mini": "Show relays list modal. Call lookup_relays FIRST to get refs.",
    "help_category": "relays",
    "parameters": {
      "type": "object",
      "properties": {
        "relay_ids": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of relay IDs or refs (e.g., relay_1, relay_2) from lookup_relays. Use 'all' as single item to show all relays from session context."
        },
        "title": {
          "type": "string",
          "description": "Title for the modal (e.g., 'Sent Relays', 'Incoming Relays', 'All Relays')"
        },
        "filter": {
          "type": "string",
          "enum": ["sent", "incoming", "all"],
          "description": "Which type of relays are being shown (for display purposes)"
        }
      },
      "required": ["relay_ids", "title"]
    }
  },
  /* REPLACED BY close_modal
  {
    "type": "function",
    "name": "close_relay_view",
    "description": "Close the single relay view modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "type": "function",
    "name": "close_relays_list",
    "description": "Close the relays list modal.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  */
  {
    "type": "function",
    "name": "decline_relay",
    "description": "Decline an incoming relay. Only the RECIPIENT can decline an relay that was sent to them.\n\nUse when:\n- User says they can't help with an relay\n- User doesn't have time to respond\n- User isn't the right person (but doesn't know who is - otherwise use redirect)\n\nNote: If user knows someone else who can help, suggest using the relay conversation with redirect instead.",
    "description_mini": "Decline incoming relay (RECIPIENT only). Give reason.",
    "help_category": "relays",
    "help_examples": ["Decline that relay", "I can't help with that one"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID to decline. Use relay_N refs from lookup_relays."
        },
        "reason": {
          "type": "string",
          "description": "Reason for declining. Be specific and helpful (e.g., 'I don't have access to that information', 'This is outside my area')."
        }
      },
      "required": ["relay_id", "reason"]
    }
  },
  {
    "type": "function",
    "name": "add_relay_recipient",
    "description": "Add a new recipient (thread) to an existing relay. Only the OWNER can add recipients.\n\nUse when:\n- User wants to add someone to an already-sent relay\n- 'Also ask John about this'\n- 'Add Sarah to that relay too'\n\nCannot add if relay already has 10 recipients (max limit).\nNew recipient gets their own thread in 'pending' status.\n\nNote: Use lookup_org_members to find the recipient first.",
    "description_mini": "Add recipient to existing relay (OWNER only). Max 10 recipients.",
    "help_category": "relays",
    "help_examples": ["Also ask John about this", "Add Sarah to the budget relay"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID to add recipient to. Use relay_N refs from lookup_relays."
        },
        "recipient": {
          "type": "object",
          "description": "The new recipient to add as a thread.",
          "properties": {
            "id": { "type": "string", "description": "User ID from lookup_org_members (person_N ref or actual ID)" },
            "name": { "type": "string", "description": "Display name" },
            "gravatar": { "type": "string", "description": "Optional gravatar URL" }
          },
          "required": ["id", "name"]
        }
      },
      "required": ["relay_id", "recipient"]
    }
  },
  {
    "type": "function",
    "name": "close_relay_thread",
    "description": "Close/dismiss a recipient's thread on an relay. Only the OWNER can close threads.\n\nUse when:\n- A recipient won't be responding (unavailable, out of office)\n- Owner wants to close a pending thread without cancelling the whole relay\n- 'Close Alex's thread, he's not going to answer'\n- 'Dismiss that thread'\n\nThe thread is marked as 'expired' (closed by owner). Other threads on the relay remain active.\nIf all threads are closed/expired, the relay itself may complete.\n\nNote: This is different from cancel_relay which cancels the ENTIRE relay for ALL recipients.",
    "description_mini": "Close a recipient's thread (OWNER only). Thread marked as expired.",
    "help_category": "relays",
    "help_examples": ["Close Alex's thread", "Dismiss that pending thread", "He's not going to answer"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID. Use relay_N refs from lookup_relays or context."
        },
        "from_user_id": {
          "type": "string",
          "description": "User ID of the recipient whose thread to close. Use person_N refs."
        },
        "reason": {
          "type": "string",
          "description": "Optional reason for closing (e.g., 'Recipient unavailable', 'No longer needed')"
        }
      },
      "required": ["relay_id", "from_user_id"]
    }
  },
  {
    "type": "function",
    "name": "extend_thread_expiry",
    "description": "Extend the response deadline for a recipient's relay thread. Only the OWNER can extend deadlines.\n\nUse when:\n- A recipient needs more time to respond\n- 'Give John another week'\n- 'Extend Sarah's deadline by a few days'\n- 'They need more time'\n\nThe new deadline is calculated from NOW (not from the old deadline). Cannot extend if relay has expiry_policy='fixed'.",
    "description_mini": "Extend a thread's deadline (OWNER only). Adds days from now.",
    "help_category": "relays",
    "help_examples": ["Give John more time", "Extend that deadline", "They need another week"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID. Use relay_N refs from lookup_relays or context."
        },
        "from_user_id": {
          "type": "string",
          "description": "User ID of the recipient whose thread deadline to extend. Use person_N refs."
        },
        "additional_days": {
          "type": "integer",
          "description": "Number of days from now for the new deadline. Default 7.",
          "minimum": 1,
          "maximum": 90
        },
        "reason": {
          "type": "string",
          "description": "Optional reason for extension (e.g., 'Recipient requested more time', 'Waiting for external input')"
        }
      },
      "required": ["relay_id", "from_user_id"]
    }
  },
  {
    "type": "function",
    "name": "remove_thread_expiry",
    "description": "Remove the deadline from a recipient's relay thread entirely. Only the OWNER can remove deadlines.\n\nUse when:\n- No longer time-sensitive\n- 'No rush on this anymore'\n- 'Remove the deadline for John'\n- 'They can take their time'\n\nAfter removal, the thread has no expiration and will stay open indefinitely.",
    "description_mini": "Remove a thread's deadline (OWNER only). Thread has no expiry.",
    "help_category": "relays",
    "help_examples": ["No rush on this", "Remove that deadline", "They can take their time"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID. Use relay_N refs from lookup_relays or context."
        },
        "from_user_id": {
          "type": "string",
          "description": "User ID of the recipient whose thread deadline to remove. Use person_N refs."
        }
      },
      "required": ["relay_id", "from_user_id"]
    }
  },
  {
    "type": "function",
    "name": "send_thread_nudge",
    "description": "Send an AI-generated reminder to a recipient who hasn't responded to an relay. Only the OWNER can send nudges.\n\nThe AI will craft a personalized, context-aware message that feels like a thoughtful follow-up - not a robotic reminder.\n\nUse when:\n- 'Nudge Sarah about this'\n- 'Send a reminder to John'\n- 'Can you follow up with them?'\n- 'Ping Mike about the report'\n- 'They haven't responded yet, remind them'\n- 'Remind them that I'm still having issues'\n\nThe nudge appears in the thread conversation and is visible to both parties for transparency.",
    "description_mini": "Send AI-crafted reminder to recipient (OWNER only). Personal, context-aware.",
    "help_category": "relays",
    "help_examples": ["Nudge them about this", "Send a reminder", "Follow up with Sarah", "Remind them I'm still having issues"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID. Use relay_N refs from lookup_relays or context."
        },
        "from_user_id": {
          "type": "string",
          "description": "User ID of the recipient to nudge. Use person_N refs."
        },
        "message_hint": {
          "type": "string",
          "description": "Optional hint for what to include in the nudge message. If the user says things like 'remind them that I'm still having issues' or 'mention to check Slack', include that here. The AI will incorporate this into a natural-sounding message.",
          "description_mini": "Custom content to include (e.g., 'still having issues, check Slack')."
        }
      },
      "required": ["relay_id", "from_user_id"]
    }
  },
  {
    "type": "function",
    "name": "start_relay_session",
    "description": "Open the relay conversation agent to respond to an incoming relay OR to see live progress of a sent relay.\n\n⚠️ IMPORTANT: This is IRREVERSIBLE - it will close the current agent session and open the relay agent. User must confirm before proceeding.\n\nFor INCOMING relays (recipient):\n- Opens the relay conversation agent\n- User can talk with AI to provide information\n- Can redirect to someone else if needed\n- Can mark complete or partial\n\nFor SENT relays (owner):\n- Opens read-only view of the relay's progress\n- Can see journey, knowledge gathered so far\n- Can cancel if needed\n\nAFTER CALLING: Wait for confirmation. Session will end and new agent will open.",
    "description_mini": "Open relay agent. IRREVERSIBLE - closes current session. REQUIRES CONFIRMATION.",
    "help_category": "relays",
    "help_examples": ["Let me work on that relay", "Open the relay agent for this one"],
    "parameters": {
      "type": "object",
      "properties": {
        "relay_id": {
          "type": "string",
          "description": "The relay ID to open. Use relay_N refs from lookup_relays."
        },
        "mode": {
          "type": "string",
          "enum": ["voice", "text"],
          "description": "Which agent to open - voice or text. Default is same as current session."
        }
      },
      "required": ["relay_id"]
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELP CATEGORIES - Categories for the dynamic help system
// ═══════════════════════════════════════════════════════════════════════════════
// Each tool declares its help_category, and tools are grouped into these categories.
// The frontend fetches /capabilities to get categories populated with available tools.

export const HELP_CATEGORIES = {
  "tasks": {
    id: "tasks",
    icon: "ph:check-square-fill",
    title: "Tasks",
    order: 1
  },
  "calendar": {
    id: "calendar",
    icon: "ph:calendar-fill",
    title: "Calendar",
    order: 2
  },
  "notes": {
    id: "notes",
    icon: "ph:note-fill",
    title: "Notes",
    order: 3
  },
  "drafting": {
    id: "drafting",
    icon: "ph:pencil-line-fill",
    title: "Drafting & Writing",
    order: 4
  },
  "chat": {
    id: "chat",
    icon: "ph:chat-circle-text-fill",
    title: "Chat & Messages",
    order: 5
  },
  "people": {
    id: "people",
    icon: "ph:users-fill",
    title: "People & Contacts",
    order: 6
  },
  "meetings": {
    id: "meetings",
    icon: "ph:video-camera-fill",
    title: "Past Meetings",
    order: 7
  },
  "actionables": {
    id: "actionables",
    icon: "ph:list-checks-fill",
    title: "Action Items",
    order: 8
  },
  "meeting-prep": {
    id: "meeting-prep",
    icon: "ph:clipboard-text-fill",
    title: "Meeting Prep",
    order: 9
  },
  "insights": {
    id: "insights",
    icon: "ph:lightbulb-fill",
    title: "Insights",
    order: 10
  },
  "recording": {
    id: "recording",
    icon: "ph:record-fill",
    title: "Recording",
    order: 11
  },
  "collab": {
    id: "collab",
    icon: "ph:phone-call-fill",
    title: "Team Calls",
    order: 12
  },
  "relays": {
    id: "relays",
    icon: "ph:paper-plane-tilt-fill",
    title: "Relays",
    order: 13
  },
  "voice-controls": {
    id: "voice-controls",
    icon: "ph:microphone-fill",
    title: "Voice Controls",
    order: 14,
    agents: ["voice"]  // Voice-only category
  },
  "session": {
    id: "session",
    icon: "ph:power-fill",
    title: "Session",
    order: 15
  },
  "advanced": {
    id: "advanced",
    icon: "ph:wrench-fill",
    title: "Advanced",
    order: 99,
    isAdvanced: true
  }
};

// Relay-specific categories (shown when in relay-conversation mode)
export const RELAY_HELP_CATEGORIES = {
  "relay-respond": {
    id: "relay-respond",
    icon: "ph:paper-plane-tilt-fill",
    title: "Responding to This Relay",
    order: 1
  },
  "relay-redirect": {
    id: "relay-redirect",
    icon: "ph:arrows-clockwise-fill",
    title: "Redirecting to Someone Else",
    order: 2
  },
  "relay-partial": {
    id: "relay-partial",
    icon: "ph:clock-fill",
    title: "Need More Time",
    order: 3
  },
  "relay-lookup": {
    id: "relay-lookup",
    icon: "ph:magnifying-glass-fill",
    title: "Looking Things Up",
    order: 4
  },
  "relay-other": {
    id: "relay-other",
    icon: "ph:wrench-fill",
    title: "Other",
    order: 5
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION TYPE GROUPS - Define common patterns for tool access
// ═══════════════════════════════════════════════════════════════════════════════
// 
// Session Types (from prompts.mjs):
//   Voice: about-me, daily-debrief, day-prep, event-context, relay-conversation, relay-landing, relay-manager, discover-zunou
//   Text:  daily-debrief, quick-ask, day-prep, event-context, relay-conversation, relay-landing, relay-manager, digest, draft, general, discover-zunou, chat-context, chat-catchup
//
// Groups make it easy to assign tools to common patterns without listing every session

export const SESSION_GROUPS = {
  // All sessions that have full productivity tool access
  FULL_ACCESS: [
    'about-me', 'daily-debrief', 'quick-ask', 'day-prep', 'event-context', 
    'relay-landing', 'relay-manager', 'general', 'discover-zunou', 'chat-context', 'chat-catchup'
  ],
  
  // Voice-only sessions
  VOICE_ONLY: ['about-me', 'chat-catchup'],
  
  // Text-only sessions  
  TEXT_ONLY: ['quick-ask', 'digest', 'draft', 'general'],
  
  // Sessions available in both voice and text
  VOICE_AND_TEXT: [
    'daily-debrief', 'day-prep', 'event-context', 
    'relay-conversation', 'relay-landing', 'relay-manager', 'discover-zunou', 'chat-context'
  ],
  
  // Relay-related sessions (both running relays and reviewing them)
  RELAY_SESSIONS: ['relay-conversation', 'relay-landing', 'relay-manager'],
  
  // Relay runner only (the AI running an active relay conversation)
  RELAY_RUNNER: ['relay-conversation'],
  
  // No tools - just text generation
  NO_TOOLS: ['digest'],
  
  // Draft mode - limited tool access for writing
  DRAFT_MODE: ['draft']
};
// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT-ONLY TOOLS - Tools that MUST be executed on the app, not on Lambda
// ═══════════════════════════════════════════════════════════════════════════════
// These tools interact with Alpine stores, modals, or require browser APIs.
// When delegating to Lambda/Text Agent, these tool calls must be passed back
// to the client for execution - Lambda cannot execute them.

export const CLIENT_ONLY_TOOLS = new Set([
  // Session control (affects Voice Agent state)
  'end_session',
  'confirm_pending_action',
  'cancel_pending_action',
  'modify_pending_action',
  
  // Voice-only UI tools
  'request_text_input',
  'capture_photo',
  
  // Display modals - ALL show_* tools
  'show_task',
  'show_tasks',
  'show_note',
  'show_notes',
  'show_event',
  'show_events',
  'show_past_event',
  'show_past_events',
  'show_relay',
  'show_relays',
  'show_insight',
  'show_insights',
  'show_contact',
  'show_contacts',
  'show_pulse',
  'show_pulses',
  'show_topics',
  'show_messages',
  'show_availability',
  'show_content',
  'show_list',
  'display_html_message',
  
  // Unified close modal (replaces 20+ individual close_* tools)
  'close_modal',
  
  // Legacy close modals - kept for backward compatibility
  'close_task_view',
  'close_tasks_list',
  'close_note_view',
  'close_notes_list',
  'close_event_view',
  'close_events_list',
  'close_past_event_view',
  'close_past_events_list',
  'close_relay_view',
  'close_relays_list',
  'close_insight_view',
  'close_insights_list',
  'close_contact_view',
  'close_contacts_list',
  'close_availability_view',
  'close_content_view',
  'close_list_view',
  
  // Draft/delegation (triggers client-side modals)
  'delegate_to_text_agent',
  'save_draft',
  'close_draft',
  'minimize_draft',
  'restore_draft',
  
  // Navigation (changes app route)
  'navigate_to_event',
  'navigate_to_pulse',
  
  // Recording features (requires device access)
  'start_brain_dump',
  'start_instant_meeting',
  'start_collab',
]);

// Helper function to check if a tool requires client execution
export function isClientOnlyTool(toolName) {
  return CLIENT_ONLY_TOOLS.has(toolName);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SESSION ACCESS - Which session types can use each tool
// ═══════════════════════════════════════════════════════════════════════════════
// Values can be:
//   - Array of session type strings: ['daily-debrief', 'quick-ask', ...]
//   - Group reference: Use SESSION_GROUPS.FULL_ACCESS, etc.
//   - Special value: 'all' means available everywhere (default)

export const TOOL_SESSION_ACCESS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION CONTROL
  // ─────────────────────────────────────────────────────────────────────────────
  "end_session": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  "confirm_pending_action": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  "cancel_pending_action": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  "modify_pending_action": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HYBRID ROUTING - Delegation meta-tool for Voice Agent
  // ─────────────────────────────────────────────────────────────────────────────
  "delegate_action": ['about-me', 'daily-debrief', 'day-prep', 'event-context', 'relay-landing'],
  
  // ─────────────────────────────────────────────────────────────────────────────
  // VOICE-ONLY TOOLS (not available in text sessions)
  // ─────────────────────────────────────────────────────────────────────────────
  "adjust_speaking_pace": ['about-me', 'daily-debrief', 'day-prep', 'event-context', 'relay-conversation', 'relay-landing'],
  "adjust_speaking_style": ['about-me', 'daily-debrief', 'day-prep', 'event-context', 'relay-conversation', 'relay-landing'],
  "request_text_input": ['about-me', 'daily-debrief', 'day-prep', 'event-context', 'relay-conversation', 'relay-landing'],
  "report_audio_quality_issue": ['about-me', 'daily-debrief', 'day-prep', 'event-context', 'relay-conversation', 'relay-landing'],
  "capture_photo": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  
  // ─────────────────────────────────────────────────────────────────────────────
  // TEXT-ONLY TOOLS (not available in voice sessions)
  // ─────────────────────────────────────────────────────────────────────────────
  "display_html_message": ['daily-debrief', 'quick-ask', 'day-prep', 'event-context', 'relay-landing', 'general'],

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIFIED CLOSE MODAL (replaces 20+ individual close_* tools)
  // ─────────────────────────────────────────────────────────────────────────────
  "close_modal": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],

  // ─────────────────────────────────────────────────────────────────────────────
  // TASKS - Full access sessions + relay-conversation (limited use)
  // ─────────────────────────────────────────────────────────────────────────────
  "manage_task": SESSION_GROUPS.FULL_ACCESS,  // Unified: create, update, complete, delete, get_details
  "create_task_list": SESSION_GROUPS.FULL_ACCESS,
  "lookup_tasks": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "lookup_task_lists": SESSION_GROUPS.FULL_ACCESS,
  "show_task": SESSION_GROUPS.FULL_ACCESS,
  "show_tasks": SESSION_GROUPS.FULL_ACCESS,
  "delete_task_list": SESSION_GROUPS.FULL_ACCESS,
  // Legacy (commented out in VOICE_AGENT_TOOLS, kept for reference):
  // "create_task": SESSION_GROUPS.FULL_ACCESS,
  // "get_task_details": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  // "complete_task": SESSION_GROUPS.FULL_ACCESS,
  // "update_task": SESSION_GROUPS.FULL_ACCESS,
  // "delete_task": SESSION_GROUPS.FULL_ACCESS,
  // "close_task_view": SESSION_GROUPS.FULL_ACCESS,  // Replaced by close_modal
  // "close_tasks_list": SESSION_GROUPS.FULL_ACCESS, // Replaced by close_modal

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTES - Full access sessions + relay-conversation (limited use)
  // ─────────────────────────────────────────────────────────────────────────────
  "manage_note": SESSION_GROUPS.FULL_ACCESS,  // Unified: create, update, pin, unpin, delete, get_details
  "lookup_notes": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "show_note": SESSION_GROUPS.FULL_ACCESS,
  "show_notes": SESSION_GROUPS.FULL_ACCESS,
  // Legacy (commented out in VOICE_AGENT_TOOLS, kept for reference):
  // "create_note": SESSION_GROUPS.FULL_ACCESS,
  // "get_note_details": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  // "pin_note": SESSION_GROUPS.FULL_ACCESS,
  // "unpin_note": SESSION_GROUPS.FULL_ACCESS,
  // "update_note": SESSION_GROUPS.FULL_ACCESS,
  // "delete_note": SESSION_GROUPS.FULL_ACCESS,
  // "close_note_view": SESSION_GROUPS.FULL_ACCESS,  // Replaced by close_modal
  // "close_notes_list": SESSION_GROUPS.FULL_ACCESS, // Replaced by close_modal

  // ─────────────────────────────────────────────────────────────────────────────
  // CALENDAR / EVENTS - Full access + relay-conversation (for availability checks)
  // ─────────────────────────────────────────────────────────────────────────────
  "lookup_events": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "lookup_event_details": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "show_event": SESSION_GROUPS.FULL_ACCESS,
  "show_events": SESSION_GROUPS.FULL_ACCESS,
  "close_event_view": SESSION_GROUPS.FULL_ACCESS,
  "close_events_list": SESSION_GROUPS.FULL_ACCESS,
  "create_event": SESSION_GROUPS.FULL_ACCESS,
  "update_event": SESSION_GROUPS.FULL_ACCESS,
  "delete_event": SESSION_GROUPS.FULL_ACCESS,
  "lookup_calendar_availability": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "show_availability": SESSION_GROUPS.FULL_ACCESS,
  "update_availability_view": SESSION_GROUPS.FULL_ACCESS,
  "close_availability_view": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // MEETING PREP (Agendas, Talking Points) - Full access only
  // ─────────────────────────────────────────────────────────────────────────────
  "lookup_event_agendas": SESSION_GROUPS.FULL_ACCESS,
  "create_agenda_item": SESSION_GROUPS.FULL_ACCESS,
  "update_agenda_item": SESSION_GROUPS.FULL_ACCESS,
  "delete_agenda_item": SESSION_GROUPS.FULL_ACCESS,
  "lookup_talking_points": SESSION_GROUPS.FULL_ACCESS,
  "create_talking_point": SESSION_GROUPS.FULL_ACCESS,
  "update_talking_point": SESSION_GROUPS.FULL_ACCESS,
  "complete_talking_point": SESSION_GROUPS.FULL_ACCESS,
  "delete_talking_point": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // MEETING SESSION (Notetaker) - Full access only
  // ─────────────────────────────────────────────────────────────────────────────
  "lookup_meeting_session": SESSION_GROUPS.FULL_ACCESS,
  "attach_google_meet": SESSION_GROUPS.FULL_ACCESS,
  "enable_notetaker": SESSION_GROUPS.FULL_ACCESS,
  "disable_notetaker": SESSION_GROUPS.FULL_ACCESS,
  "stop_meeting_session": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // PAST MEETINGS - Full access only (relay-landing for reviewing recorded meetings)
  // ─────────────────────────────────────────────────────────────────────────────
  "lookup_past_events": SESSION_GROUPS.FULL_ACCESS,
  "lookup_meeting_transcript": SESSION_GROUPS.FULL_ACCESS,
  "lookup_meeting_actionables": SESSION_GROUPS.FULL_ACCESS,
  "lookup_meeting_summary": SESSION_GROUPS.FULL_ACCESS,
  "lookup_meeting_takeaways": SESSION_GROUPS.FULL_ACCESS,
  "lookup_meeting_analytics": SESSION_GROUPS.FULL_ACCESS,
  "show_past_event": SESSION_GROUPS.FULL_ACCESS,
  "show_past_events": SESSION_GROUPS.FULL_ACCESS,
  "close_past_event_view": SESSION_GROUPS.FULL_ACCESS,
  "close_past_events_list": SESSION_GROUPS.FULL_ACCESS,
  "manage_actionable": SESSION_GROUPS.FULL_ACCESS,
  // REPLACED BY manage_actionable: complete_actionable, update_actionable, delete_actionable, create_actionable
  "send_actionable_to_task": SESSION_GROUPS.FULL_ACCESS,
  "send_all_actionables_to_tasks": SESSION_GROUPS.FULL_ACCESS,
  "lookup_actionables": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // INSIGHTS - Full access only
  // ─────────────────────────────────────────────────────────────────────────────
  "lookup_insights": SESSION_GROUPS.FULL_ACCESS,
  "show_insight": SESSION_GROUPS.FULL_ACCESS,
  "show_insights": SESSION_GROUPS.FULL_ACCESS,
  "close_insight_view": SESSION_GROUPS.FULL_ACCESS,
  "close_insights_list": SESSION_GROUPS.FULL_ACCESS,
  "close_insight": SESSION_GROUPS.FULL_ACCESS,
  "lookup_insight_recommendations": SESSION_GROUPS.FULL_ACCESS,
  "review_recommendation": SESSION_GROUPS.FULL_ACCESS,
  "execute_insight_recommendation": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // PEOPLE - Full access + relay-conversation (for redirects)
  // ─────────────────────────────────────────────────────────────────────────────
  "lookup_org_members": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "lookup_pulse_members": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "lookup_contacts": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "manage_contact": SESSION_GROUPS.FULL_ACCESS,  // Unified: create, update, delete, get_details
  "show_contact": SESSION_GROUPS.FULL_ACCESS,
  "show_contacts": SESSION_GROUPS.FULL_ACCESS,
  // Legacy (commented out in VOICE_AGENT_TOOLS, kept for reference):
  // "create_contact": SESSION_GROUPS.FULL_ACCESS,
  // "update_contact": SESSION_GROUPS.FULL_ACCESS,
  // "delete_contact": SESSION_GROUPS.FULL_ACCESS,
  // "get_contact_details": SESSION_GROUPS.FULL_ACCESS,
  // "close_contact_view": SESSION_GROUPS.FULL_ACCESS,  // Replaced by close_modal
  // "close_contacts_list": SESSION_GROUPS.FULL_ACCESS, // Replaced by close_modal

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAT / MESSAGING - Full access only
  // ─────────────────────────────────────────────────────────────────────────────
  "lookup_pulses": SESSION_GROUPS.FULL_ACCESS,
  "lookup_topics": SESSION_GROUPS.FULL_ACCESS,
  "lookup_messages": SESSION_GROUPS.FULL_ACCESS,
  "search_messages": SESSION_GROUPS.FULL_ACCESS,
  "lookup_unread_counts": SESSION_GROUPS.FULL_ACCESS,
  "lookup_pinned_messages": SESSION_GROUPS.FULL_ACCESS,
  "send_message": SESSION_GROUPS.FULL_ACCESS,
  "edit_message": SESSION_GROUPS.FULL_ACCESS,
  "delete_message": SESSION_GROUPS.FULL_ACCESS,
  "pin_message": SESSION_GROUPS.FULL_ACCESS,
  "add_reaction": SESSION_GROUPS.FULL_ACCESS,
  "remove_reaction": SESSION_GROUPS.FULL_ACCESS,
  "get_pulse_details": SESSION_GROUPS.FULL_ACCESS,
  "create_team_pulse": SESSION_GROUPS.FULL_ACCESS,
  "find_dm_with_person": SESSION_GROUPS.FULL_ACCESS,
  "create_dm_pulse": SESSION_GROUPS.FULL_ACCESS,
  "update_pulse": SESSION_GROUPS.FULL_ACCESS,
  "delete_pulse": SESSION_GROUPS.FULL_ACCESS,
  "add_pulse_member": SESSION_GROUPS.FULL_ACCESS,
  "remove_pulse_member": SESSION_GROUPS.FULL_ACCESS,
  "create_topic": SESSION_GROUPS.FULL_ACCESS,
  "update_topic": SESSION_GROUPS.FULL_ACCESS,
  "delete_topic": SESSION_GROUPS.FULL_ACCESS,
  "show_messages": SESSION_GROUPS.FULL_ACCESS,
  "show_pulses": SESSION_GROUPS.FULL_ACCESS,
  "show_pulse": SESSION_GROUPS.FULL_ACCESS,
  "show_topics": SESSION_GROUPS.FULL_ACCESS,
  "close_messages_view": SESSION_GROUPS.FULL_ACCESS,
  "close_pulses_list": SESSION_GROUPS.FULL_ACCESS,
  "close_pulse_view": SESSION_GROUPS.FULL_ACCESS,
  "close_topics_list": SESSION_GROUPS.FULL_ACCESS,
  "start_collab": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // DRAFTING - Full access + draft mode
  // ─────────────────────────────────────────────────────────────────────────────
  "delegate_to_text_agent": [...SESSION_GROUPS.FULL_ACCESS, 'draft'],
  "save_draft": [...SESSION_GROUPS.FULL_ACCESS, 'draft'],
  "close_draft": [...SESSION_GROUPS.FULL_ACCESS, 'draft'],
  "minimize_draft": [...SESSION_GROUPS.FULL_ACCESS, 'draft'],
  "restore_draft": [...SESSION_GROUPS.FULL_ACCESS, 'draft'],

  // ─────────────────────────────────────────────────────────────────────────────
  // NAVIGATION & DISPLAY
  // ─────────────────────────────────────────────────────────────────────────────
  "show_content": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  "show_list": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  "close_content_view": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  "close_list_view": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],

  // ─────────────────────────────────────────────────────────────────────────────
  // DEBUG / LOGGING
  // ─────────────────────────────────────────────────────────────────────────────
  "log_error_for_developers": [...SESSION_GROUPS.FULL_ACCESS, ...SESSION_GROUPS.RELAY_SESSIONS],
  "test_error_logging": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // RECORDING - Full access only
  // ─────────────────────────────────────────────────────────────────────────────
  "start_instant_meeting": SESSION_GROUPS.FULL_ACCESS,
  "start_brain_dump": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // RELAYS - Management tools (spawning, viewing, cancelling)
  // Available in full access sessions for managing relays
  // ─────────────────────────────────────────────────────────────────────────────
  "spawn_relay": SESSION_GROUPS.FULL_ACCESS,
  "lookup_relays": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "get_relay_details": [...SESSION_GROUPS.FULL_ACCESS, 'relay-conversation'],
  "cancel_relay": SESSION_GROUPS.FULL_ACCESS,
  "update_relay_context": SESSION_GROUPS.FULL_ACCESS,  // Owner adds context to sent relays
  "update_relay_visibility": SESSION_GROUPS.FULL_ACCESS,  // Owner toggles visibility mode
  "add_relay_recipient": SESSION_GROUPS.FULL_ACCESS,
  "close_relay_thread": SESSION_GROUPS.FULL_ACCESS,
  "extend_thread_expiry": SESSION_GROUPS.FULL_ACCESS,
  "remove_thread_expiry": SESSION_GROUPS.FULL_ACCESS,
  "send_thread_nudge": SESSION_GROUPS.FULL_ACCESS,
  "show_relay": SESSION_GROUPS.FULL_ACCESS,
  "show_relays": SESSION_GROUPS.FULL_ACCESS,
  "close_relay_view": SESSION_GROUPS.FULL_ACCESS,
  "close_relays_list": SESSION_GROUPS.FULL_ACCESS,
  "decline_relay": ['relay-conversation'],  // Only recipient can decline
  "start_relay_session": SESSION_GROUPS.FULL_ACCESS,

  // ─────────────────────────────────────────────────────────────────────────────
  // RELAY CONVERSATION TOOLS - Only during active relay-conversation
  // These are the AI's tools for running an relay
  // ─────────────────────────────────────────────────────────────────────────────
  "relay_log_insight": SESSION_GROUPS.RELAY_RUNNER,
  "relay_add_question": SESSION_GROUPS.RELAY_RUNNER,
  "relay_mark_complete": SESSION_GROUPS.RELAY_RUNNER,
  "relay_mark_partial": SESSION_GROUPS.RELAY_RUNNER,
  "relay_redirect": SESSION_GROUPS.RELAY_RUNNER
};

export const VOICE_AGENT_RISK_LEVELS = {
  "end_session": "low",
  "confirm_pending_action": "low",
  "cancel_pending_action": "low",
  "modify_pending_action": "low",
  "adjust_speaking_pace": "low",
  "adjust_speaking_style": "low",
  "request_text_input": "low",
  "capture_photo": "low",
  // Unified close modal (replaces 20+ individual close_* tools)
  "close_modal": "low",
  "manage_task": "high",  // High because includes delete/update - handler checks action type
  "create_task_list": "low",
  "lookup_tasks": "low",
  "lookup_task_lists": "low",
  "show_task": "low",
  "show_tasks": "low",
  "delete_task_list": "high",
  // Legacy (commented out in VOICE_AGENT_TOOLS):
  // "create_task": "low",
  // "get_task_details": "low",
  // "close_task_view": "low",
  // "close_tasks_list": "low",
  // "complete_task": "medium",
  // "update_task": "high",
  // "delete_task": "high",
  "manage_note": "low",  // Risk varies by action: delete=high, update=medium, others=low (checked client-side)
  "lookup_notes": "low",
  "show_note": "low",
  "show_notes": "low",
  // Legacy (commented out in VOICE_AGENT_TOOLS):
  // "create_note": "low",
  // "get_note_details": "low",
  // "close_note_view": "low",
  // "close_notes_list": "low",
  // "pin_note": "low",
  // "unpin_note": "low",
  // "update_note": "medium",
  // "delete_note": "high",
  "lookup_events": "low",
  "lookup_event_details": "low",
  "show_event": "low",
  "show_events": "low",
  "close_event_view": "low",
  "close_events_list": "low",
  "create_event": "high",
  "update_event": "high",
  "delete_event": "high",
  "lookup_calendar_availability": "low",
  "show_availability": "low",
  "update_availability_view": "low",
  "close_availability_view": "low",
  "lookup_event_agendas": "low",
  "create_agenda_item": "low",
  "update_agenda_item": "high",
  "delete_agenda_item": "high",
  "lookup_talking_points": "low",
  "create_talking_point": "low",
  "update_talking_point": "high",
  "complete_talking_point": "low",
  "delete_talking_point": "high",
  "lookup_meeting_session": "low",
  "attach_google_meet": "medium",
  "enable_notetaker": "medium",
  "disable_notetaker": "medium",
  "stop_meeting_session": "high",
  "lookup_past_events": "low",
  "lookup_meeting_transcript": "low",
  "lookup_meeting_actionables": "low",
  "lookup_meeting_summary": "low",
  "lookup_meeting_takeaways": "low",
  "lookup_meeting_analytics": "low",
  "show_past_event": "low",
  "show_past_events": "low",
  "close_past_event_view": "low",
  "close_past_events_list": "low",
  "lookup_insights": "low",
  "close_insight": "medium",
  "lookup_insight_recommendations": "low",
  "review_recommendation": "low",
  "execute_insight_recommendation": "medium",
  "show_insight": "low",
  "show_insights": "low",
  "close_insight_view": "low",
  "close_insights_list": "low",
  "lookup_actionables": "low",
  "manage_actionable": "low",  // Risk varies by action: delete=high, complete=medium, others=low (checked client-side)
  // REPLACED BY manage_actionable: complete_actionable=medium, create_actionable=low, update_actionable=low, delete_actionable=high
  "send_actionable_to_task": "medium",
  "send_all_actionables_to_tasks": "medium",
  "lookup_org_members": "low",
  "lookup_pulse_members": "low",
  "lookup_pulses": "low",
  "lookup_contacts": "low",
  "manage_contact": "low",  // Risk varies by action: delete=high, update=medium, others=low (checked client-side)
  "show_contact": "low",
  "show_contacts": "low",
  // Legacy (commented out in VOICE_AGENT_TOOLS):
  // "get_contact_details": "low",
  // "create_contact": "low",
  // "update_contact": "medium",
  // "delete_contact": "high",
  // "close_contact_view": "low",
  // "close_contacts_list": "low",
  "send_message": "high",
  "lookup_messages": "low",
  "search_messages": "low",
  "lookup_unread_counts": "low",
  "show_messages": "low",
  "close_messages_view": "low",
  "show_pulses": "low",
  "close_pulses_list": "low",
  "show_pulse": "low",
  "close_pulse_view": "low",
  "show_topics": "low",
  "close_topics_list": "low",
  "get_pulse_details": "low",
  "find_dm_with_person": "low",
  "create_team_pulse": "high",
  "create_dm_pulse": "high",
  "update_pulse": "medium",
  "delete_pulse": "high",
  "add_pulse_member": "medium",
  "remove_pulse_member": "medium",
  "lookup_topics": "low",
  "create_topic": "low",
  "update_topic": "low",
  "delete_topic": "high",
  "edit_message": "low",
  "delete_message": "medium",
  "pin_message": "low",
  "lookup_pinned_messages": "low",
  "add_reaction": "low",
  "remove_reaction": "low",
  "start_collab": "low",
  "delegate_to_text_agent": "low",
  "save_draft": "low",
  "close_draft": "low",
  "minimize_draft": "low",
  "restore_draft": "low",
  "log_error_for_developers": "low",
  "test_error_logging": "low",
  "report_audio_quality_issue": "low",
  "show_content": "low",
  "close_content_view": "low",
  "show_list": "low",
  "close_list_view": "low",
  "display_html_message": "low",
  "start_instant_meeting": "low",
  "start_brain_dump": "low",
  // Relay tools
  "spawn_relay": "high",
  "lookup_relays": "low",
  "get_relay_details": "low",
  "cancel_relay": "high",
  "update_relay_context": "low",  // Non-destructive, just appending
  "update_relay_visibility": "low",  // Non-destructive, just toggling mode
  "add_relay_recipient": "medium",
  "close_relay_thread": "medium",
  "extend_thread_expiry": "medium",
  "remove_thread_expiry": "medium",
  "send_thread_nudge": "high",  // Calls AI to generate message
  "show_relay": "low",
  "show_relays": "low",
  "close_relay_view": "low",
  "close_relays_list": "low",
  "decline_relay": "high",
  "start_relay_session": "high",
  // Relay conversation tools
  "relay_log_insight": "low",
  "relay_add_question": "low",
  "relay_mark_complete": "medium",
  "relay_mark_partial": "low",
  "relay_redirect": "medium"
};

// Get tools filtered by session type
// ═══════════════════════════════════════════════════════════════════════════════
// AGENT-SPECIFIC TOOLS
// ═══════════════════════════════════════════════════════════════════════════════
// Tools that only make sense for voice agent (audio-related)
const VOICE_ONLY_TOOLS = [
  'adjust_speaking_pace',
  'adjust_speaking_style', 
  'report_audio_quality_issue',
  'request_text_input',  // Only makes sense in voice context
];

// agentType: 'voice' or 'text' - determines if voice-only tools are included
// sessionType: e.g., 'daily-debrief', 'relay-conversation', 'quick-ask', etc.
// Returns only tools available for that session type and agent
export function getTools(agentType = 'voice', sessionType = null) {
  return VOICE_AGENT_TOOLS.filter(tool => {
    // If no session type specified, return all tools (legacy behavior)
    if (!sessionType) return true;
    
    // Filter out voice-only tools when text agent calls
    if (agentType === 'text' && VOICE_ONLY_TOOLS.includes(tool.name)) {
      return false;
    }
    
    // Get allowed sessions for this tool
    const allowedSessions = TOOL_SESSION_ACCESS[tool.name];
    
    // If tool not in TOOL_SESSION_ACCESS, it's not available anywhere
    // (tools must be explicitly listed)
    if (!allowedSessions) return false;
    
    // Check if this session type is allowed
    return Array.isArray(allowedSessions) && allowedSessions.includes(sessionType);
  }).map(tool => {
    // For voice agent, use minified descriptions if available
    if (agentType === 'voice') {
      return minifyToolForVoice(tool);
    }
    // For text agent, strip out _mini fields (they shouldn't see them)
    return stripMiniFields(tool);
  });
}

/**
 * Minify a tool for Voice Agent - use shorter descriptions to save tokens
 * Uses description_mini if available, otherwise keeps full description
 * Also strips internal metadata fields that OpenAI doesn't accept
 */
function minifyToolForVoice(tool) {
  const minified = { ...tool };
  
  // Use minified tool description if available
  if (tool.description_mini) {
    minified.description = tool.description_mini;
  }
  delete minified.description_mini;
  
  // Strip internal metadata fields that OpenAI doesn't accept
  delete minified.help_category;
  delete minified.help_examples;
  
  // Minify parameter descriptions if available
  if (minified.parameters?.properties) {
    minified.parameters = {
      ...minified.parameters,
      properties: { ...minified.parameters.properties }
    };
    
    for (const [key, prop] of Object.entries(minified.parameters.properties)) {
      if (prop.description_mini) {
        minified.parameters.properties[key] = {
          ...prop,
          description: prop.description_mini
        };
      }
      delete minified.parameters.properties[key].description_mini;
    }
  }
  
  return minified;
}

/**
 * Strip internal metadata fields from tools for Text Agent (clean output for OpenAI)
 * Removes _mini fields and help metadata that OpenAI doesn't accept
 */
function stripMiniFields(tool) {
  const clean = { ...tool };
  delete clean.description_mini;
  
  // Strip internal metadata fields that OpenAI doesn't accept
  delete clean.help_category;
  delete clean.help_examples;
  
  if (clean.parameters?.properties) {
    clean.parameters = {
      ...clean.parameters,
      properties: { ...clean.parameters.properties }
    };
    
    for (const key of Object.keys(clean.parameters.properties)) {
      clean.parameters.properties[key] = { ...clean.parameters.properties[key] };
      delete clean.parameters.properties[key].description_mini;
    }
  }
  
  return clean;
}

// Relay conversation tools - minimal set for when AI is running an relay
const RELAY_CONVERSATION_TOOLS = [
  // Core relay actions
  'relay_log_insight',
  'relay_add_question',
  'relay_mark_complete',
  'relay_mark_partial',
  'relay_redirect',
  
  // People lookup (for redirects and context)
  'lookup_org_members',
  'lookup_contacts',
  'lookup_pulse_members',    // See who's on a specific team
  'get_pulse_details',       // Get team info (members, description)
  
  // Information gathering tools
  'lookup_events',           // Check someone's calendar/schedule
  'lookup_tasks',            // See what someone is working on
  'lookup_notes',            // Find relevant notes/documentation
  'lookup_relays',          // Check for related/similar relays
  'get_relay_details',      // Get full relay context
  
  // Precision tools
  'request_text_input',      // Ask user to type precise info
  
  // Dev/debug tools
  'log_error_for_developers', // Report bugs/issues
  
  // Session control
  'end_session'
];

// Get relay conversation tools (filtered set for relay AI)
export function getRelayConversationTools() {
  return VOICE_AGENT_TOOLS
    .filter(tool => RELAY_CONVERSATION_TOOLS.includes(tool.name))
    .map(minifyToolForVoice);
}

// Relay manager tools - for OWNER checking on/managing their sent relays
// SAME as relay-conversation PLUS management tools for threads
const RELAY_MANAGER_TOOLS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ALL relay-conversation tools (manager needs same lookup capabilities)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Core relay actions (from relay-conversation)
  'relay_log_insight',
  'relay_add_question',
  'relay_mark_complete',
  'relay_mark_partial',
  'relay_redirect',
  
  // People lookup (for redirects and context)
  'lookup_org_members',
  'lookup_contacts',
  'lookup_pulse_members',
  'get_pulse_details',
  
  // Information gathering tools
  'lookup_events',
  'lookup_tasks',
  'lookup_notes',
  'lookup_relays',
  'get_relay_details',
  
  // Precision tools
  'request_text_input',
  
  // Dev/debug tools
  'log_error_for_developers',
  
  // Session control
  'end_session',
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MANAGER-ONLY tools (thread/relay management)
  // ═══════════════════════════════════════════════════════════════════════════

  // Thread management
  'add_relay_recipient',    // Add more people to this relay
  'close_relay_thread',     // Close/dismiss a thread (no response expected)
  'cancel_relay',           // Cancel the entire relay
  'update_relay_context',   // Add context update/note to relay (Phase 4.4)

  // Thread deadline management (Phase 4.3)
  'extend_thread_expiry',    // Give recipient more time
  'remove_thread_expiry',    // Remove deadline entirely

  // Nudge/reminder tools (Phase 4.3)
  'send_thread_nudge',       // Send AI-crafted reminder to recipient

  // Display tools (for showing status visually)
  'show_relays',
  'show_relay',
  'display_html_message',    // Rich formatted display (text agent)
  'close_modal',
];

// Get relay manager tools (owner managing their sent relays)
export function getRelayManagerTools() {
  return VOICE_AGENT_TOOLS
    .filter(tool => RELAY_MANAGER_TOOLS.includes(tool.name))
    .map(minifyToolForVoice);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE AGENT TOOL EXCLUSIONS
// ═══════════════════════════════════════════════════════════════════════════════
// 
// By default, Voice Agent gets ALL tools for the session type.
// This list specifies tools to EXCLUDE from Voice Agent.
// 
// Reasons to exclude:
//   1. Token budget constraints (rarely used, complex tools)
//   2. Text-only tools (display_html_message, etc.)
//   3. Tools that don't make sense for voice interaction
//
// ⚠️ ADD TOOLS HERE to remove them from Voice Agent
// ⚠️ REMOVE FROM HERE to give Voice Agent access

export const VOICE_EXCLUDED_TOOLS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // TEXT-ONLY TOOLS (visual display that doesn't make sense in voice)
  // ─────────────────────────────────────────────────────────────────────────────
  'display_html_message',  // Rich HTML content - text chat only
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RARELY USED / TOKEN-HEAVY (exclude to save token budget)
  // ─────────────────────────────────────────────────────────────────────────────
  // Add tools here as needed to reduce token count
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DELEGATION CONTROL (disabled - keep infrastructure but don't expose)
  // ─────────────────────────────────────────────────────────────────────────────
  'delegate_action',  // The delegation meta-tool itself
];

// Legacy: Keep DIRECT_TOOL_NAMES for backwards compatibility but it's no longer used
// @deprecated - Use VOICE_EXCLUDED_TOOLS instead (inversion: exclusion list not inclusion list)
export const DIRECT_TOOL_NAMES = [];

// The delegation meta-tool - kept for infrastructure but excluded from Voice Agent
// NOTE: The category enum should match TOOL_CATEGORIES keys (excluding session/voice which are direct)
export const DELEGATE_ACTION_TOOL = {
  "type": "function",
  "name": "delegate_action",
  "description": `Delegate an action to your assistant (Text Agent). Use this for actions that aren't in your direct toolkit.

USAGE:
- If you know the exact tool name, pass it in 'tool_name' for precise execution
- Otherwise describe the action and let the assistant figure out the right tool

CATEGORIES:
calendar, meeting_prep, past_meetings, insights, messages, writing, recording, relays, notetaker, people

The assistant executes the tool and returns the result. You will see any visual displays it creates.`,
  "parameters": {
    "type": "object",
    "properties": {
      "tool_name": {
        "type": "string",
        "description": "OPTIONAL but RECOMMENDED: Exact tool name to execute (e.g., 'lookup_calendar_availability', 'create_event'). If provided, the assistant will call this tool directly with the args you describe."
      },
      "action": {
        "type": "string",
        "description": "Clear description of what to do. Include specific values like dates, times, names. This becomes the tool arguments."
      },
      "category": {
        "type": "string",
        "enum": ["tasks", "notes", "calendar", "meeting_prep", "notetaker", "past_meetings", "insights", "people", "messages", "writing", "display", "recording", "relays", "other"],
        "description": "Category to help route the action."
      },
      "entities": {
        "type": "object",
        "description": "Any entities from the conversation context to pass along."
      },
      "urgency": {
        "type": "string",
        "enum": ["quick", "normal"],
        "description": "'quick' for lookups, 'normal' for actions that may modify data."
      }
    },
    "required": ["action", "category"]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL CATEGORIES - Maps every tool to a category for dynamic capability building
// ═══════════════════════════════════════════════════════════════════════════════
// When you add/move tools, update this map. The getDelegatedCapabilitySummary()
// function will automatically include/exclude tools based on DIRECT_TOOL_NAMES.

export const TOOL_CATEGORIES = {
  // SESSION CONTROL
  "end_session": "session",
  "confirm_pending_action": "session",
  "cancel_pending_action": "session",
  "modify_pending_action": "session",
  "delegate_action": "session",
  
  // VOICE-SPECIFIC
  "adjust_speaking_pace": "voice",
  "adjust_speaking_style": "voice",
  "request_text_input": "voice",
  "report_audio_quality_issue": "voice",
  
  // UNIFIED CLOSE MODAL (replaces 20+ individual close_* tools)
  "close_modal": "display",
  
  // TASKS
  "manage_task": "tasks",  // Unified: create, update, complete, delete, get_details
  "create_task_list": "tasks",
  "lookup_tasks": "tasks",
  "lookup_task_lists": "tasks",
  "show_task": "tasks",
  "show_tasks": "tasks",
  "delete_task_list": "tasks",
  // Legacy (commented out in VOICE_AGENT_TOOLS):
  // "create_task": "tasks",
  // "get_task_details": "tasks",
  // "complete_task": "tasks",
  // "update_task": "tasks",
  // "delete_task": "tasks",
  // "close_task_view": "tasks",
  // "close_tasks_list": "tasks",
  
  // NOTES
  "manage_note": "notes",  // Unified: create, update, pin, unpin, delete, get_details
  "lookup_notes": "notes",
  "show_note": "notes",
  "show_notes": "notes",
  // Legacy (commented out in VOICE_AGENT_TOOLS):
  // "create_note": "notes",
  // "get_note_details": "notes",
  // "pin_note": "notes",
  // "unpin_note": "notes",
  // "update_note": "notes",
  // "delete_note": "notes",
  // "close_note_view": "notes",
  // "close_notes_list": "notes",
  
  // CALENDAR / EVENTS
  "lookup_events": "calendar",
  "lookup_event_details": "calendar",
  "show_event": "calendar",
  "show_events": "calendar",
  "close_event_view": "calendar",
  "close_events_list": "calendar",
  "create_event": "calendar",
  "update_event": "calendar",
  "delete_event": "calendar",
  "lookup_calendar_availability": "calendar",
  "show_availability": "calendar",
  "update_availability_view": "calendar",
  "close_availability_view": "calendar",
  
  // MEETING PREP
  "lookup_event_agendas": "meeting_prep",
  "create_agenda_item": "meeting_prep",
  "update_agenda_item": "meeting_prep",
  "delete_agenda_item": "meeting_prep",
  "lookup_talking_points": "meeting_prep",
  "create_talking_point": "meeting_prep",
  "update_talking_point": "meeting_prep",
  "complete_talking_point": "meeting_prep",
  "delete_talking_point": "meeting_prep",
  
  // MEETING SESSION (Notetaker)
  "lookup_meeting_session": "notetaker",
  "attach_google_meet": "notetaker",
  "enable_notetaker": "notetaker",
  "disable_notetaker": "notetaker",
  "stop_meeting_session": "notetaker",
  
  // PAST MEETINGS
  "lookup_past_events": "past_meetings",
  "lookup_meeting_transcript": "past_meetings",
  "lookup_meeting_actionables": "past_meetings",
  "lookup_meeting_summary": "past_meetings",
  "lookup_meeting_takeaways": "past_meetings",
  "lookup_meeting_analytics": "past_meetings",
  "show_past_event": "past_meetings",
  "show_past_events": "past_meetings",
  "close_past_event_view": "past_meetings",
  "close_past_events_list": "past_meetings",
  "manage_actionable": "past_meetings",  // Unified: complete, create, update, delete
  // REPLACED BY manage_actionable: complete_actionable, update_actionable, delete_actionable, create_actionable
  "send_actionable_to_task": "past_meetings",
  "send_all_actionables_to_tasks": "past_meetings",
  "lookup_actionables": "past_meetings",
  
  // INSIGHTS
  "lookup_insights": "insights",
  "show_insight": "insights",
  "show_insights": "insights",
  "close_insight_view": "insights",
  "close_insights_list": "insights",
  "close_insight": "insights",
  "lookup_insight_recommendations": "insights",
  "review_recommendation": "insights",
  "execute_insight_recommendation": "insights",
  
  // PEOPLE
  "lookup_org_members": "people",
  "lookup_pulse_members": "people",
  "lookup_contacts": "people",
  "manage_contact": "people",  // Unified: create, update, delete, get_details
  "show_contact": "people",
  "show_contacts": "people",
  // Legacy (commented out in VOICE_AGENT_TOOLS):
  // "create_contact": "people",
  // "update_contact": "people",
  // "delete_contact": "people",
  // "get_contact_details": "people",
  // "close_contact_view": "people",
  // "close_contacts_list": "people",
  
  // CHAT / MESSAGING
  "lookup_pulses": "messages",
  "lookup_topics": "messages",
  "lookup_messages": "messages",
  "search_messages": "messages",
  "lookup_unread_counts": "messages",
  "lookup_pinned_messages": "messages",
  "send_message": "messages",
  "edit_message": "messages",
  "delete_message": "messages",
  "pin_message": "messages",
  "add_reaction": "messages",
  "remove_reaction": "messages",
  "get_pulse_details": "messages",
  "create_team_pulse": "messages",
  "find_dm_with_person": "messages",
  "create_dm_pulse": "messages",
  "update_pulse": "messages",
  "delete_pulse": "messages",
  "add_pulse_member": "messages",
  "remove_pulse_member": "messages",
  "create_topic": "messages",
  "update_topic": "messages",
  "delete_topic": "messages",
  "show_messages": "messages",
  "show_pulses": "messages",
  "show_pulse": "messages",
  "show_topics": "messages",
  "close_messages_view": "messages",
  "close_pulses_list": "messages",
  "close_pulse_view": "messages",
  "close_topics_list": "messages",
  "start_collab": "messages",
  
  // DRAFTING
  "delegate_to_text_agent": "writing",
  "save_draft": "writing",
  "close_draft": "writing",
  "minimize_draft": "writing",
  "restore_draft": "writing",
  
  // DISPLAY
  "show_content": "display",
  "show_list": "display",
  "close_content_view": "display",
  "close_list_view": "display",
  "display_html_message": "display",
  
  // DEBUG
  "log_error_for_developers": "debug",
  "test_error_logging": "debug",
  
  // RECORDING
  "start_instant_meeting": "recording",
  "start_brain_dump": "recording",
  "capture_photo": "recording",
  
  // RELAYS
  "spawn_relay": "relays",
  "lookup_relays": "relays",
  "get_relay_details": "relays",
  "cancel_relay": "relays",
  "update_relay_context": "relays",
  "add_relay_recipient": "relays",
  "close_relay_thread": "relays",
  "extend_thread_expiry": "relays",
  "remove_thread_expiry": "relays",
  "send_thread_nudge": "relays",
  "show_relay": "relays",
  "show_relays": "relays",
  "close_relay_view": "relays",
  "close_relays_list": "relays",
  "decline_relay": "relays",
  "start_relay_session": "relays",
  "relay_log_insight": "relays",
  "relay_add_question": "relays",
  "relay_mark_complete": "relays",
  "relay_mark_partial": "relays",
  "relay_redirect": "relays",
  "update_relay_visibility": "relays"
};

// Human-readable summaries with example triggers for each category
// Format: { summary: "...", triggers: ["example 1", "example 2"] }
export const CATEGORY_SUMMARIES = {
  session: {
    summary: "End session, confirm or cancel pending actions",
    triggers: []
  },
  voice: {
    summary: "Adjust speaking pace and style, handle audio issues",
    triggers: []
  },
  tasks: {
    summary: "Create, update, complete, and delete tasks. Manage task lists",
    triggers: ["update this task", "delete my task", "change task priority", "move task to list"]
  },
  notes: {
    summary: "Create, update, pin, and delete notes",
    triggers: ["update my note", "pin this note", "delete the note"]
  },
  calendar: {
    summary: "Create, update, delete events. Check availability",
    triggers: ["schedule a meeting", "create an event", "when am I free?", "check my availability", "move my meeting", "cancel the event"]
  },
  meeting_prep: {
    summary: "Manage agendas and talking points for upcoming meetings",
    triggers: ["add to agenda", "create talking points", "what should I cover?", "meeting prep"]
  },
  notetaker: {
    summary: "Control the AI notetaker bot for recordings",
    triggers: ["record this meeting", "start notetaker", "stop recording", "add bot to meeting"]
  },
  past_meetings: {
    summary: "Access transcripts, actionables, takeaways, summaries from recorded meetings",
    triggers: ["what was discussed?", "meeting summary", "action items from meeting", "what did they say?", "meeting takeaways"]
  },
  insights: {
    summary: "View AI-generated insights and act on recommendations",
    triggers: ["any insights?", "what should I focus on?", "show recommendations"]
  },
  people: {
    summary: "Create and update personal contacts",
    triggers: ["add a contact", "save this person", "update contact info"]
  },
  messages: {
    summary: "Send messages, manage channels, topics, reactions",
    triggers: ["send a message", "message the team", "create a channel", "start a topic"]
  },
  writing: {
    summary: "Draft emails, documents, messages. Save and manage drafts",
    triggers: ["draft an email", "write a document", "compose a message", "help me write"]
  },
  display: {
    summary: "Show content, lists, and formatted output",
    triggers: []
  },
  debug: {
    summary: "Log errors for developers",
    triggers: ["something's broken", "report a bug"]
  },
  recording: {
    summary: "Start instant meetings, brain dumps, capture photos",
    triggers: ["start brain dump", "quick meeting", "take a photo", "scan this"]
  },
  relays: {
    summary: "Spawn, track, and manage agent relays",
    triggers: ["send an relay", "ask John about", "check my relays", "how many relays?", "relay status"]
  }
};

// Generate a detailed capability summary for Voice Agent's system prompt
// DYNAMICALLY built from actual delegated tools - shows REAL tool names
export function getDelegatedCapabilitySummary() {
  // If delegation is disabled (delegate_action not in DIRECT_TOOL_NAMES), return empty
  if (!DIRECT_TOOL_NAMES.includes('delegate_action')) {
    return '';
  }
  
  // Get all delegated tool names
  const delegatedToolNames = VOICE_AGENT_TOOLS
    .filter(tool => !DIRECT_TOOL_NAMES.includes(tool.name))
    .map(tool => tool.name);
  
  // Group by category
  const categoryTools = {};
  for (const toolName of delegatedToolNames) {
    const category = TOOL_CATEGORIES[toolName] || 'other';
    if (!categoryTools[category]) {
      categoryTools[category] = [];
    }
    categoryTools[category].push(toolName);
  }
  
  // Priority categories first (most commonly used)
  const priorityOrder = ['calendar', 'meeting_prep', 'past_meetings', 'insights', 'messages', 'writing', 'people', 'relays', 'notetaker', 'recording', 'tasks', 'notes'];
  const sortedCategories = Object.entries(categoryTools).sort(([a], [b]) => {
    const aIdx = priorityOrder.indexOf(a);
    const bIdx = priorityOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: COMPLETE TOOL REFERENCE (structured, machine-readable)
  // ═══════════════════════════════════════════════════════════════════════════
  const lines = [
    "╔══════════════════════════════════════════════════════════════════════════════╗",
    "║                    DELEGATED TOOLS REFERENCE                                  ║",
    "║  Use delegate_action with tool_name from this list                           ║",
    "╚══════════════════════════════════════════════════════════════════════════════╝",
    ""
  ];
  
  for (const [category, tools] of sortedCategories) {
    // Skip internal categories
    if (['session', 'voice', 'display', 'debug'].includes(category)) continue;
    
    const catInfo = CATEGORY_SUMMARIES[category] || { summary: category };
    const summary = typeof catInfo === 'string' ? catInfo : catInfo.summary;
    
    // Category header
    lines.push(`[${category.toUpperCase()}] ${summary}`);
    
    // ALL tool names in this category (compact, comma-separated)
    lines.push(`  Tools: ${tools.join(', ')}`);
    lines.push('');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: USAGE INSTRUCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push("─".repeat(78));
  lines.push("USAGE: delegate_action({ tool_name: \"<name>\", action: \"<details>\", category: \"<cat>\" })");
  lines.push("─".repeat(78));
  
  return lines.join('\n');
}

// Get full tool definitions for direct tools only
export function getDirectTools(sessionType = null) {
  // Check if delegation is enabled
  const delegationEnabled = VOICE_EXCLUDED_TOOLS.includes('delegate_action') === false;
  
  let tools;
  
  if (delegationEnabled && VOICE_AGENT_TOOLS.some(t => t.name === 'delegate_action')) {
    // HYBRID MODE: Add delegate_action tool + filtered tools
    tools = [DELEGATE_ACTION_TOOL, ...VOICE_AGENT_TOOLS.filter(t => t.name !== 'delegate_action')];
  } else {
    // STANDARD MODE: All tools except excluded ones
    tools = [...VOICE_AGENT_TOOLS];
  }
  
  // Remove excluded tools
  tools = tools.filter(tool => !VOICE_EXCLUDED_TOOLS.includes(tool.name));
  
  // Filter by session type if specified
  if (sessionType) {
    tools = tools.filter(tool => {
      const allowedSessions = TOOL_SESSION_ACCESS[tool.name];
      if (!allowedSessions) return false;
      return Array.isArray(allowedSessions) && allowedSessions.includes(sessionType);
    });
  }
  
  // Apply minification for voice agent (strip description_mini)
  return tools.map(minifyToolForVoice);
}

// Get full tool definitions for delegated tools (used by Text Agent bridge)
export function getDelegatedTools(sessionType = null) {
  // Delegation only works if delegate_action is NOT in VOICE_EXCLUDED_TOOLS
  const delegationEnabled = VOICE_EXCLUDED_TOOLS.includes('delegate_action') === false;
  if (!delegationEnabled) {
    return [];
  }
  
  // Get only the tools that ARE in VOICE_EXCLUDED_TOOLS (except delegate_action itself)
  let tools = VOICE_AGENT_TOOLS.filter(tool => 
    VOICE_EXCLUDED_TOOLS.includes(tool.name) && tool.name !== 'delegate_action'
  );
  
  // If session type specified, also filter by session access
  if (sessionType) {
    tools = tools.filter(tool => {
      const allowedSessions = TOOL_SESSION_ACCESS[tool.name];
      if (!allowedSessions) return false;
      return Array.isArray(allowedSessions) && allowedSessions.includes(sessionType);
    });
  }
  
  return tools;
}

// Check if a tool is direct (not excluded)
export function isDirectTool(toolName) {
  // A tool is "direct" if it's NOT in the exclusion list
  return !VOICE_EXCLUDED_TOOLS.includes(toolName);
}

// Get token estimate for a tool configuration
export function estimateToolTokens(tools) {
  // Rough estimate: ~4 chars per token
  const totalChars = tools.reduce((sum, tool) => {
    return sum + JSON.stringify(tool).length;
  }, 0);
  return Math.ceil(totalChars / 4);
}

// Utility: Get stats about direct vs delegated tools
export function getHybridStats(sessionType = null) {
  const direct = getDirectTools(sessionType);
  const delegated = getDelegatedTools(sessionType);
  
  return {
    directCount: direct.length,
    directTokens: estimateToolTokens(direct),
    delegatedCount: delegated.length,
    delegatedTokens: estimateToolTokens(delegated),
    totalTools: direct.length + delegated.length,
    budgetRemaining: 28000 - estimateToolTokens(direct)
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC HELP SYSTEM - Build capabilities for help modal
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build capabilities for the help modal based on session type and agent.
 * Returns categories with their available tools/examples.
 * 
 * @param {string} sessionType - The session type (e.g., 'daily-debrief', 'quick-ask')
 * @param {string} agentType - 'voice' or 'text'
 * @returns {Array} Array of categories with items
 */
export function buildCapabilities(sessionType = 'daily-debrief', agentType = 'voice') {
  // Get all available tools for this session
  // Uses the same filtering logic as getTools() but keeps help metadata
  let availableTools;
  
  // Use specialized tool functions for relay sessions (they have hardcoded lists)
  if (sessionType === 'relay-conversation') {
    const relayTools = getRelayConversationTools();
    const relayToolNames = new Set(relayTools.map(t => t.name));
    availableTools = VOICE_AGENT_TOOLS.filter(t => relayToolNames.has(t.name));
  } else if (sessionType === 'relay-manager') {
    const managerTools = getRelayManagerTools();
    const managerToolNames = new Set(managerTools.map(t => t.name));
    availableTools = VOICE_AGENT_TOOLS.filter(t => managerToolNames.has(t.name));
  } else {
    // Filter by TOOL_SESSION_ACCESS (same logic as getTools)
    availableTools = VOICE_AGENT_TOOLS.filter(tool => {
      // Filter out voice-only tools when text agent calls
      if (agentType === 'text' && VOICE_ONLY_TOOLS.includes(tool.name)) {
        return false;
      }
      
      // Get allowed sessions for this tool
      const allowedSessions = TOOL_SESSION_ACCESS[tool.name];
      
      // If tool not in TOOL_SESSION_ACCESS, it's not available
      // (tools must be explicitly listed)
      if (!allowedSessions) return false;
      
      // Check if this session type is allowed
      return Array.isArray(allowedSessions) && allowedSessions.includes(sessionType);
    });
  }
  
  // Determine which category registry to use
  const isRelaySession = sessionType === 'relay-conversation' || sessionType === 'relay-manager';
  const categoryRegistry = isRelaySession ? RELAY_HELP_CATEGORIES : HELP_CATEGORIES;
  
  // Group tools by category
  const categoryMap = {};
  
  for (const tool of availableTools) {
    const catId = tool.help_category;
    if (!catId) continue;  // Skip tools without help metadata
    
    // Get category definition
    const catDef = categoryRegistry[catId] || HELP_CATEGORIES[catId];
    if (!catDef) continue;  // Skip if category not defined
    
    // Check if category is agent-appropriate
    if (catDef.agents && !catDef.agents.includes(agentType)) {
      continue;  // Skip voice-only categories for text agent
    }
    
    // Initialize category if needed
    if (!categoryMap[catId]) {
      categoryMap[catId] = {
        id: catDef.id,
        icon: catDef.icon,
        title: catDef.title,
        order: catDef.order || 99,
        isAdvanced: catDef.isAdvanced || false,
        items: []
      };
    }
    
    // Add tool's examples to category
    const examples = tool.help_examples || [];
    for (const example of examples) {
      categoryMap[catId].items.push({
        text: example,
        tool: tool.name,
        agents: agentType === 'voice' ? 'voice' : 'text',
        note: tool.help_note || null
      });
    }
  }
  
  // Sort categories by order, filter empty ones
  const result = Object.values(categoryMap)
    .filter(cat => cat.items.length > 0)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  
  return result;
}

/**
 * Get session display name for the help modal header.
 * 
 * @param {string} sessionType - The session type
 * @returns {string} Human-readable session name
 */
export function getSessionDisplayName(sessionType) {
  const names = {
    'about-me': 'Getting to Know You',
    'daily-debrief': 'Daily Debrief',
    'quick-ask': 'Quick Ask',
    'day-prep': 'Day Prep',
    'event-context': 'Meeting Prep',
    'relay-conversation': 'Relay Response',
    'relay-landing': 'Relay Hub',
    'relay-manager': 'Relay Manager',
    'discover-zunou': 'Discover Zunou',
    'digest': 'Daily Digest',
    'draft': 'Writing Assistant',
    'general': 'General Chat'
  };
  return names[sessionType] || sessionType || 'Zunou';
}
