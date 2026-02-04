/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date string with format `Y-m-d`, e.g. `2011-05-23`. */
  Date: { input: string; output: string; }
  /** A datetime string with format `Y-m-d H:i:s`, e.g. `2018-05-23 13:43:32`. */
  DateTime: { input: string; output: string; }
  JSON: { input: any; output: any; }
  UUID: { input: string; output: string; }
};

/** Input for accepting invite */
export type AcceptInvitationInput = {
  /** The user's invitation code. */
  inviteCode?: InputMaybe<Scalars['String']['input']>;
};

/** Input for acknowledging a misalignment alert. */
export type AcknowledgeMisalignmentAlertInput = {
  /** The ID of the misalignment alert to acknowledge. */
  id: Scalars['String']['input'];
  /** The organization that this misalignment alert belongs to. */
  organizationId: Scalars['String']['input'];
};

export type ActionItem = {
  __typename?: 'ActionItem';
  assignees?: Maybe<Array<Maybe<TAssignee>>>;
  description?: Maybe<Scalars['String']['output']>;
  due_date?: Maybe<Scalars['String']['output']>;
  is_existing?: Maybe<Scalars['Boolean']['output']>;
  priority?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export enum ActionMethods {
  Create = 'create',
  CreateSummary = 'create_summary',
  Delete = 'delete',
  Update = 'update',
  UpdateSummary = 'update_summary',
  View = 'view'
}

export enum ActionStatus {
  Completed = 'completed',
  Failed = 'failed'
}

export enum ActionTypes {
  Meeting = 'meeting',
  Note = 'note',
  Task = 'task',
  TeamChat = 'team_chat'
}

/** An actionable resource */
export type Actionable = {
  __typename?: 'Actionable';
  created_at: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  event?: Maybe<Event>;
  event_id?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  organization: Organization;
  organization_id: Scalars['ID']['output'];
  pulse: Pulse;
  pulse_id: Scalars['ID']['output'];
  status?: Maybe<Scalars['String']['output']>;
  task?: Maybe<Task>;
  task_id?: Maybe<Scalars['ID']['output']>;
  updated_at: Scalars['DateTime']['output'];
};

/** Activity for an organization. */
export type Activity = {
  __typename?: 'Activity';
  causer: User;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  feedType?: Maybe<FeedType>;
  id: Scalars['ID']['output'];
  organizationId: Scalars['ID']['output'];
  properties: Scalars['JSON']['output'];
  pulseId?: Maybe<Scalars['ID']['output']>;
  receiverId?: Maybe<Scalars['ID']['output']>;
  subjectType: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** A paginated list of Activity items. */
export type ActivityPaginator = {
  __typename?: 'ActivityPaginator';
  /** A list of Activity items. */
  data: Array<Activity>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export type AddInsightSourcesInput = {
  insightId: Scalars['ID']['input'];
  sources: Array<InsightSourceInput>;
};

export type Agenda = {
  __typename?: 'Agenda';
  created_at: Scalars['DateTime']['output'];
  event: Event;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organization_id: Scalars['ID']['output'];
  position: Scalars['Int']['output'];
  pulse_id: Scalars['ID']['output'];
  updated_at: Scalars['DateTime']['output'];
};

/** Input for updating the order of agendas. */
export type AgendaOrderInput = {
  id: Scalars['ID']['input'];
  position: Scalars['Int']['input'];
};

/** An agent belonging to a Zunou organization. */
export type Agent = {
  __typename?: 'Agent';
  /** Timestamp when the agent was created. */
  createdAt: Scalars['DateTime']['output'];
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** The name of the agent */
  name: AgentName;
  /** The associated organization */
  organization?: Maybe<Organization>;
  /** The ID of the organization */
  organizationId?: Maybe<Scalars['UUID']['output']>;
  /** The prompt */
  prompt: Scalars['String']['output'];
  /** Timestamp when the agent was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};

/** The type of file being uploaded. */
export enum AgentName {
  Concierge = 'Concierge'
}

/** A paginated list of Agent items. */
export type AgentPaginator = {
  __typename?: 'AgentPaginator';
  /** A list of Agent items. */
  data: Array<Agent>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export type AiAgent = {
  __typename?: 'AiAgent';
  agent_type: AiAgentType;
  created_at: Scalars['DateTime']['output'];
  credentials: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  guidelines?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  pulseId: Scalars['ID']['output'];
  updated_at: Scalars['DateTime']['output'];
};

/** The AI Agent Type */
export enum AiAgentType {
  Github = 'GITHUB',
  Jira = 'JIRA',
  Slack = 'SLACK',
  Zunou = 'ZUNOU'
}

/** A assignee resource */
export type Assignee = {
  __typename?: 'Assignee';
  id: Scalars['ID']['output'];
  user: User;
};

export type AttachContactToUserInput = {
  contactId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type AttachMeetingSessionToEventInput = {
  eventId: Scalars['ID']['input'];
  meetingSessionId: Scalars['ID']['input'];
};

export type Attachment = {
  __typename?: 'Attachment';
  body: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  message_id: Scalars['ID']['output'];
  subject: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
};

/** A attendee resource */
export type Attendee = {
  __typename?: 'Attendee';
  id: Scalars['ID']['output'];
  user: User;
};

export type Automation = {
  __typename?: 'Automation';
  activities: Array<AutomationLog>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  nextRunAt: Scalars['DateTime']['output'];
  onQueue: Scalars['Boolean']['output'];
  strategyId: Scalars['ID']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type AutomationLog = {
  __typename?: 'AutomationLog';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  properties?: Maybe<AutomationRunLog>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AutomationLogEntry = {
  __typename?: 'AutomationLogEntry';
  context?: Maybe<Array<Scalars['String']['output']>>;
  level: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type AutomationRunLog = {
  __typename?: 'AutomationRunLog';
  logs: Array<AutomationLogEntry>;
  runAt: Scalars['String']['output'];
};

export type Background = {
  __typename?: 'Background';
  active: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  image_url: Scalars['String']['output'];
  metadata: Metadata;
  organizationId: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
};

/** A paginated list of Background items. */
export type BackgroundPaginator = {
  __typename?: 'BackgroundPaginator';
  /** A list of Background items. */
  data: Array<Background>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export type BatchUpdateError = {
  __typename?: 'BatchUpdateError';
  insightId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
};

export type BatchUpdateInsightStatusInput = {
  insightIds: Array<Scalars['ID']['input']>;
  preventDowngrade?: InputMaybe<Scalars['Boolean']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  status: InsightStatus;
};

export type BatchUpdateInsightStatusOutput = {
  __typename?: 'BatchUpdateInsightStatusOutput';
  errors: Array<BatchUpdateError>;
  insights: Array<LiveInsightOutbox>;
  updatedCount: Scalars['Int']['output'];
};

export type BookmarkInsightInput = {
  id: Scalars['ID']['input'];
};

/** A category resource */
export type Category = {
  __typename?: 'Category';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

/** A Checklist resource */
export type Checklist = {
  __typename?: 'Checklist';
  complete: Scalars['Boolean']['output'];
  created_at: Scalars['DateTime']['output'];
  event?: Maybe<Event>;
  eventInstance?: Maybe<EventInstance>;
  event_id?: Maybe<Scalars['ID']['output']>;
  event_instance_id?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organization_id: Scalars['ID']['output'];
  position: Scalars['Int']['output'];
  pulse_id: Scalars['ID']['output'];
  updated_at: Scalars['DateTime']['output'];
};

/** Input for updating the order of checklists. */
export type ChecklistOrderInput = {
  id: Scalars['ID']['input'];
  position: Scalars['Int']['input'];
};

export type CheckoutSessionResponse = {
  __typename?: 'CheckoutSessionResponse';
  url: Scalars['String']['output'];
};

/** A Collaboration resource */
export type Collaboration = {
  __typename?: 'Collaboration';
  attendees: Array<Maybe<Attendee>>;
  description: Scalars['String']['output'];
  end_at: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  meeting_link: Scalars['String']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  pulseId: Scalars['ID']['output'];
  start_at: Scalars['String']['output'];
  status: CollaborationStatus;
};

export enum CollaborationStatus {
  Ended = 'ENDED',
  Live = 'LIVE'
}

export type CompanionDetails = {
  __typename?: 'CompanionDetails';
  bot_id?: Maybe<Scalars['String']['output']>;
  ended_at?: Maybe<Scalars['String']['output']>;
  heartbeat_age_minutes?: Maybe<Scalars['String']['output']>;
  is_active?: Maybe<Scalars['Boolean']['output']>;
  joined_at?: Maybe<Scalars['String']['output']>;
  last_heartbeat?: Maybe<Scalars['String']['output']>;
  meeting_id?: Maybe<Scalars['String']['output']>;
  meeting_status?: Maybe<Scalars['String']['output']>;
  original_status?: Maybe<Scalars['String']['output']>;
  started_at?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  transcription_generated?: Maybe<Scalars['String']['output']>;
};

export enum CompanionStatus {
  Joined = 'JOINED'
}

/** Input for companion webhook. */
export type CompanionWebhookInput = {
  companionStatus?: InputMaybe<CompanionStatus>;
  meetingSessionId: Scalars['ID']['input'];
};

/** A Contact resource */
export type Contact = {
  __typename?: 'Contact';
  alt_email?: Maybe<Scalars['String']['output']>;
  alt_telephone_number?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  details?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owners: Array<User>;
  settings?: Maybe<Scalars['JSON']['output']>;
  telephone_number?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** A paginated list of Contact items. */
export type ContactPaginator = {
  __typename?: 'ContactPaginator';
  /** A list of Contact items. */
  data: Array<Contact>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export type CreateActionableInput = {
  data_source_id?: InputMaybe<Scalars['ID']['input']>;
  description: Scalars['String']['input'];
  event_id?: InputMaybe<Scalars['ID']['input']>;
  organization_id: Scalars['ID']['input'];
  pulse_id: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  task_id?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateAgendaInput = {
  event_id?: InputMaybe<Scalars['ID']['input']>;
  event_instance_id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  organization_id: Scalars['ID']['input'];
  pulse_id: Scalars['ID']['input'];
};

/** Input for creating agents. */
export type CreateAgentInput = {
  /** The name of the agent. */
  name: AgentName;
  /** The organization that agent belongs to. */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** The prompt. */
  prompt?: InputMaybe<Scalars['String']['input']>;
  /** The organization that agent belongs to. */
  pulseId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAiAgentInput = {
  agent_type: AiAgentType;
  credentials: Scalars['JSON']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  guidelines?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};

export type CreateAssistantOnboardingInput = {
  organizationId: Scalars['String']['input'];
};

/** Input for creating task list actions. */
export type CreateAssistantTaskListActionsInput = {
  /** ID of the task list */
  taskListId: Scalars['String']['input'];
  /** ID of the thread to send the summary to */
  threadId: Scalars['String']['input'];
};

export type CreateAttachmentInput = {
  body: Scalars['String']['input'];
  message_id: Scalars['ID']['input'];
  subject: Scalars['String']['input'];
};

export type CreateBackgroundInput = {
  active: Scalars['Boolean']['input'];
  /** The S3 key that the data file was uploaded to. */
  fileKey?: InputMaybe<Scalars['String']['input']>;
  /** The file name of the data source */
  fileName?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** Input for creating a checklist. */
export type CreateChecklistInput = {
  complete?: InputMaybe<Scalars['Boolean']['input']>;
  event_id?: InputMaybe<Scalars['ID']['input']>;
  event_instance_id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  organization_id: Scalars['ID']['input'];
  pulse_id: Scalars['ID']['input'];
};

/** Input for creating a pulse feed. */
export type CreateCollaborationInput = {
  attendees: Array<InputMaybe<Scalars['String']['input']>>;
  description: Scalars['String']['input'];
  external_attendees?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  invite_pulse: Scalars['Boolean']['input'];
  meeting_type?: InputMaybe<MeetingType>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
};

export type CreateCompletionInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateContactInput = {
  alt_email?: InputMaybe<Scalars['String']['input']>;
  alt_telephone_number?: InputMaybe<Scalars['String']['input']>;
  details?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  settings?: InputMaybe<Array<SettingsEntryInput>>;
  telephone_number?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating custom pulses. */
export type CreateCustomPulseInput = {
  /** Description of the custom pulse. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Features for the custom pulse */
  features?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Name of the custom pulse. */
  name: Scalars['String']['input'];
  /** ID of the organization to associate the new pulse with. */
  organizationId: Scalars['ID']['input'];
};

/** Input for creating data sources. */
export type CreateDataSourceInput = {
  /** A description of the data source's contents, and what the data can be used for. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The S3 key that the data file was uploaded to. */
  fileKey?: InputMaybe<Scalars['String']['input']>;
  /** The file name of the data source */
  fileName?: InputMaybe<Scalars['String']['input']>;
  /** The name of the data source. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The organization that data source belongs to. */
  organizationId: Scalars['String']['input'];
  /** The origin of the data source. */
  origin?: InputMaybe<DataSourceOrigin>;
  /** The pulse ID that data source belongs to. */
  pulseId?: InputMaybe<Scalars['String']['input']>;
  /** The type of data source. */
  type: DataSourceType;
};

export type CreateDirectMessageInput = {
  content: Scalars['String']['input'];
  directMessageThreadId: Scalars['ID']['input'];
  files?: InputMaybe<Array<DirectMessageFileInput>>;
  organizationId: Scalars['ID']['input'];
  repliedToMessageId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateEventInput = {
  attendees?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  create_event: Scalars['Boolean']['input'];
  date: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  end_at: Scalars['String']['input'];
  files?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  invite_pulse?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organization_id: Scalars['ID']['input'];
  priority?: InputMaybe<EventPriority>;
  pulse_id: Scalars['ID']['input'];
  start_at: Scalars['String']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
  user_id: Scalars['ID']['input'];
};

export type CreateEventInstanceInput = {
  event_id: Scalars['ID']['input'];
  local_description?: InputMaybe<Scalars['String']['input']>;
  organization_id: Scalars['ID']['input'];
  priority?: InputMaybe<Scalars['String']['input']>;
  pulse_id: Scalars['ID']['input'];
};

export type CreateEventSummaryInput = {
  eventId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
};

export type CreateHiatusInput = {
  timesheetId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type CreateInsightsCompletionInput = {
  insightId: Scalars['ID']['input'];
  message: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};

export type CreateIntegrationInput = {
  api_key: Scalars['String']['input'];
  pulse_id: Scalars['String']['input'];
  secret_key?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type CreateInterestInput = {
  company_name: Scalars['String']['input'];
  company_size: Scalars['String']['input'];
  email: Scalars['String']['input'];
  looking_for?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateKestraMessageInput = {
  message: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

/** Input for creating a label. */
export type CreateLabelInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  pulse_id: Scalars['ID']['input'];
};

/** Input for creating a new live upload. */
export type CreateLiveUploadInput = {
  /** The key of the file stored in S3. */
  fileKey: Scalars['String']['input'];
  /** The ID of the organization. */
  organizationId: Scalars['ID']['input'];
  /** The ID of the thread. */
  threadId: Scalars['ID']['input'];
  /** The ID of the user uploading the file. */
  userId: Scalars['ID']['input'];
};

/** Input for adding a meeting as datasource. */
export type CreateMeetingDataSourceInput = {
  integrationId: Scalars['ID']['input'];
  meetingId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
};

/** Input for adding a meeting as datasource. */
export type CreateMeetingInput = {
  /** Optional event ID to link transcript to a calendar event */
  eventId?: InputMaybe<Scalars['ID']['input']>;
  /** Optional event instance ID for recurring events */
  eventInstanceId?: InputMaybe<Scalars['ID']['input']>;
  metadata?: InputMaybe<MetadataInput>;
  participants?: InputMaybe<Scalars['String']['input']>;
  pulseId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  transcript?: InputMaybe<Scalars['String']['input']>;
};

/** Input for createing a meeting session */
export type CreateMeetingSessionInput = {
  attendees?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_at?: InputMaybe<Scalars['String']['input']>;
  event_id?: InputMaybe<Scalars['ID']['input']>;
  event_instance_id?: InputMaybe<Scalars['ID']['input']>;
  external_attendees?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  gcal_meeting_id?: InputMaybe<Scalars['String']['input']>;
  invite_pulse: Scalars['Boolean']['input'];
  meeting_type?: InputMaybe<MeetingType>;
  meeting_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  passcode?: InputMaybe<Scalars['String']['input']>;
  pulseId: Scalars['ID']['input'];
  recurring_invite?: InputMaybe<Scalars['Boolean']['input']>;
  recurring_meeting_id?: InputMaybe<Scalars['String']['input']>;
  start_at?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MeetingSessionStatus>;
  type: MeetingSessionType;
};

export type CreateMessageInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a note as a data source. */
export type CreateNoteDataSourceInput = {
  /** Custom description for the data source (optional, defaults to note content preview). */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Custom name for the data source (optional, defaults to note title). */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the note to convert to a data source. */
  noteId: Scalars['String']['input'];
  /** The organization that the note belongs to. */
  organizationId: Scalars['String']['input'];
  /** The pulse ID that the note belongs to. */
  pulseId: Scalars['String']['input'];
};

export type CreateNoteInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  labels?: InputMaybe<Array<Scalars['String']['input']>>;
  organizationId: Scalars['ID']['input'];
  paths?: InputMaybe<Array<NoteAttachmentInput>>;
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
  pulseId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

/** Input for creating a notification. */
export type CreateNotificationInput = {
  description: Scalars['String']['input'];
  kind?: InputMaybe<NotificationKind>;
  notifiableId?: InputMaybe<Scalars['String']['input']>;
  notifyActiveMembers?: InputMaybe<Scalars['Boolean']['input']>;
  notifyPulseMembers?: InputMaybe<Scalars['Boolean']['input']>;
  organizationId?: InputMaybe<Scalars['String']['input']>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
  summaryId?: InputMaybe<Scalars['String']['input']>;
  type: NotificationType;
};

export type CreateNotificationPreferenceInput = {
  mode: NotificationPreferenceMode;
  scopeId?: InputMaybe<Scalars['ID']['input']>;
  scopeType: NotificationPreferenceScopeType;
};

/** Input for creating organization group. */
export type CreateOrganizationGroupInput = {
  /** The group description */
  description: Scalars['String']['input'];
  /** The group name */
  name: Scalars['String']['input'];
  /** The associated organization id */
  organizationId: Scalars['ID']['input'];
  /** The associated pulse id */
  pulseId: Scalars['ID']['input'];
};

/** Input for creating organizations. */
export type CreateOrganizationInput = {
  /** The name of the organization. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The email address of the organization'sowner. */
  ownerEmail?: InputMaybe<Scalars['String']['input']>;
  /** The name of the organization'sowner. */
  ownerName?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating pulse from master pulse template. */
export type CreatePulseInput = {
  /** Category of the Pulse */
  category: PulseCategory;
  /** Description of the Pulse */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The icon of the pulse. */
  icon?: InputMaybe<PulseType>;
  /** ID of the master pulse to copy from. */
  masterPulseId?: InputMaybe<Scalars['ID']['input']>;
  /** Tha name of the pulse */
  name: Scalars['String']['input'];
  /** ID of the organization to associate the new pulse with. */
  organizationId: Scalars['ID']['input'];
};

/** Input for creating a pulse member. */
export type CreatePulseMemberInput = {
  /** The role for the user member. */
  role: PulseGuestRole;
  /** ID of the user member. */
  userId: Scalars['ID']['input'];
};

/** Input for creating a pulse task status */
export type CreatePulseTaskStatusInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  position?: InputMaybe<Scalars['Int']['input']>;
  pulse_id: Scalars['ID']['input'];
};

/** Input for creating reply team threads. */
export type CreateReplyTeamThreadInput = {
  content: Scalars['String']['input'];
  metadata?: InputMaybe<TeamMessageMetadataInput>;
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
  teamThreadId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
  userId: Scalars['ID']['input'];
};

export type CreateSettingInput = {
  color: Scalars['String']['input'];
  /** The S3 key that the data file was uploaded to. */
  fileKey?: InputMaybe<Scalars['String']['input']>;
  /** The file name of the data source */
  fileName?: InputMaybe<Scalars['String']['input']>;
  mode: SettingMode;
  organizationId: Scalars['ID']['input'];
  theme: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
  weekendDisplay?: InputMaybe<WeekendDisplay>;
};

export type CreateSmartAgendaInput = {
  event_id?: InputMaybe<Scalars['ID']['input']>;
  event_instance_id?: InputMaybe<Scalars['ID']['input']>;
  organization_id: Scalars['ID']['input'];
  pulse_id: Scalars['ID']['input'];
};

/** Input for creating a smart checklist. */
export type CreateSmartChecklistInput = {
  event_id?: InputMaybe<Scalars['ID']['input']>;
  event_instance_id?: InputMaybe<Scalars['ID']['input']>;
  organization_id: Scalars['ID']['input'];
  pulse_id: Scalars['ID']['input'];
};

export type CreateSmartNotesInput = {
  note: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** Input for creating smart tasks from transcript. */
export type CreateSmartTasksInput = {
  /** Entity ID (e.g., Pulse ID) */
  entity_id: Scalars['ID']['input'];
  /** Entity type */
  entity_type: TaskEntity;
  /** Organization ID */
  organization_id: Scalars['ID']['input'];
  /** ID of existing task list to use (optional). If not provided, creates new list. */
  task_list_id?: InputMaybe<Scalars['ID']['input']>;
  /** Name of the task list (required only when creating new list) */
  task_list_name?: InputMaybe<Scalars['String']['input']>;
  /** Transcript containing tasks, one per line */
  transcript: Scalars['String']['input'];
};

/** Input for creating a pulse strategy. */
export type CreateStrategyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  freeText?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  prompt_description?: InputMaybe<Scalars['String']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  type: Scalars['String']['input'];
};

/** Input for creating summary options. */
export type CreateSummaryOptionsInput = {
  /** ID of the summary */
  summaryId: Scalars['String']['input'];
  /** ID of the thread to send the summary to */
  threadId: Scalars['String']['input'];
};

/** Input for creating a task. */
export type CreateTaskInput = {
  assignees?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  category_id?: InputMaybe<Scalars['ID']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  dependency_task_ids?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  due_date?: InputMaybe<Scalars['String']['input']>;
  entity_id: Scalars['ID']['input'];
  entity_type: TaskEntity;
  organization_id: Scalars['ID']['input'];
  parent_id?: InputMaybe<Scalars['ID']['input']>;
  priority?: InputMaybe<TaskPriority>;
  progress?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Source>;
  start_date?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TaskStatus>;
  task_phase_id?: InputMaybe<Scalars['ID']['input']>;
  task_status_id?: InputMaybe<Scalars['ID']['input']>;
  task_type: TaskType;
  title: Scalars['String']['input'];
};

/** Input for creating a task phase */
export type CreateTaskPhaseInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  pulse_id: Scalars['ID']['input'];
};

/** Input for creating team messages. */
export type CreateTeamMessageInput = {
  content: Scalars['String']['input'];
  files?: InputMaybe<Array<TeamMessageFileInput>>;
  metadata?: InputMaybe<TeamMessageMetadataInput>;
  repliedToMessageId?: InputMaybe<Scalars['ID']['input']>;
  replyTeamThreadId?: InputMaybe<Scalars['ID']['input']>;
  teamThreadId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
  userId: Scalars['ID']['input'];
};

/** Input for creating team threads. */
export type CreateTeamThreadInput = {
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
};

/** Input for creating threads. */
export type CreateThreadInput = {
  /** The name of the thread. */
  name: Scalars['String']['input'];
  /** The organization that this thread belongs to. */
  organizationId: Scalars['String']['input'];
  /** The pulse that this thread belongs to. Optional for now. */
  pulseId?: InputMaybe<Scalars['String']['input']>;
  /** Type of thread - 'admin', 'user', or 'guest', defaults to 'user' */
  type: Scalars['String']['input'];
};

/** Input for creating topics. */
export type CreateTopicInput = {
  name: Scalars['String']['input'];
  /** Used when creating a topic-specific thread if teamThreadId is not provided. */
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  referenceId?: InputMaybe<Scalars['ID']['input']>;
  referenceType?: InputMaybe<TopicReferenceType>;
  teamThreadId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateWidgetInput = {
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** A CSV data source belonging to an Organization. */
export type CsvDataSource = {
  __typename?: 'CsvDataSource';
  /** Timestamp when the source was created. */
  createdAt: Scalars['DateTime']['output'];
  /** A description of the CSV's contents, and what the data can be used for. */
  description?: Maybe<Scalars['String']['output']>;
  /** Key of the uploaded file in cloud storage. */
  fileKey: Scalars['String']['output'];
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** Unique name. */
  name: Scalars['String']['output'];
  /** The ID of the organization that owns the data source. */
  organizationId: Scalars['UUID']['output'];
  /** Status of the data source. */
  status: DataSourceStatus;
  /** The type of data source */
  type: DataSourceType;
  /** Timestamp when the data source was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};

/** An data source belonging to an Organization. */
export type DataSource = {
  __typename?: 'DataSource';
  /** The action items from summaries associated with this data source */
  actionItems: Array<Maybe<ActionItem>>;
  /** Timestamp when the source was created. */
  createdAt: Scalars['DateTime']['output'];
  /** A description of the data source's contents, and what the data can be used for. */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** Indicates whether the data source is visible to users outside the organization. */
  is_viewable?: Maybe<Scalars['Boolean']['output']>;
  /** The associated meeting of the data source */
  meeting?: Maybe<Meeting>;
  /** Unique name. */
  name: Scalars['String']['output'];
  /** The ID of the organization that owns the data source. */
  organizationId: Scalars['UUID']['output'];
  /** The origin of the data source (preset by admin or added by user) */
  origin: DataSourceOrigin;
  /** The ID of the pulse that owns the data source. */
  pulseId: Scalars['UUID']['output'];
  /** The sentiment of the data source */
  sentiment?: Maybe<Scalars['String']['output']>;
  /** Status of the data source. */
  status: DataSourceStatus;
  /** An auto-generated summary of the data source. */
  summary?: Maybe<Scalars['String']['output']>;
  /** The tl;dr of the data source */
  tldr?: Maybe<Scalars['String']['output']>;
  /** The associated transcript of the data source */
  transcript?: Maybe<Transcript>;
  /** The type of data source */
  type: DataSourceType;
  /** Timestamp when the data source was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};

/** The origin of the data source. */
export enum DataSourceOrigin {
  Custom = 'CUSTOM',
  Meeting = 'MEETING',
  Note = 'NOTE',
  OnDevice = 'ON_DEVICE',
  Preset = 'PRESET'
}

/** A paginated list of DataSource items. */
export type DataSourcePaginator = {
  __typename?: 'DataSourcePaginator';
  /** A list of DataSource items. */
  data: Array<DataSource>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

/** The status of the data source. */
export enum DataSourceStatus {
  Deleted = 'DELETED',
  Failed = 'FAILED',
  Indexed = 'INDEXED',
  Indexing = 'INDEXING'
}

/** The type of data source. */
export enum DataSourceType {
  Csv = 'csv',
  Doc = 'doc',
  Docx = 'docx',
  Html = 'html',
  Jpeg = 'jpeg',
  Markdown = 'markdown',
  Mp4 = 'mp4',
  Pdf = 'pdf',
  Png = 'png',
  Ppt = 'ppt',
  Pptx = 'pptx',
  Rtf = 'rtf',
  Text = 'text',
  Xls = 'xls',
  Xlsx = 'xlsx'
}

/** A CSV data source belonging to an Organization. */
export type DataSourceUrl = {
  __typename?: 'DataSourceUrl';
  /** Mime type for the data source file */
  mime: Scalars['String']['output'];
  /** Url of the data source */
  url: Scalars['String']['output'];
};

export type DateRangeInput = {
  from?: InputMaybe<Scalars['Date']['input']>;
  to?: InputMaybe<Scalars['Date']['input']>;
};

export type DeleteContactInput = {
  contactId: Scalars['ID']['input'];
};

/** Input for deleting data sources. */
export type DeleteDataSourceInput = {
  /** The ID of the data source to delete */
  id: Scalars['UUID']['input'];
  /** The organization that data source belongs to. */
  organizationId: Scalars['UUID']['input'];
};

/** Input for deleting a pulse task status */
export type DeletePulseTaskStatusInput = {
  id: Scalars['ID']['input'];
};

export type DeleteSummaryInput = {
  id: Scalars['ID']['input'];
};

/** Input for deleting team messages. */
export type DeleteTeamMessageInput = {
  teamMessageId: Scalars['ID']['input'];
};

/** Input for deleting a thread. */
export type DeleteThreadInput = {
  /** The ID of the thread to delete */
  id: Scalars['String']['input'];
};

/** Input for deleting topics. */
export type DeleteTopicInput = {
  topicId: Scalars['ID']['input'];
};

export type DirectMessage = {
  __typename?: 'DirectMessage';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  directMessageThreadId: Scalars['ID']['output'];
  files?: Maybe<Array<File>>;
  groupedReactions: Array<DirectMessageGroupedReaction>;
  id: Scalars['ID']['output'];
  isEdited: Scalars['Boolean']['output'];
  isPinned: Scalars['Boolean']['output'];
  isRead: Scalars['Boolean']['output'];
  repliedToMessage?: Maybe<DirectMessage>;
  repliedToMessageId?: Maybe<Scalars['ID']['output']>;
  sender: User;
  updatedAt: Scalars['DateTime']['output'];
};

export type DirectMessageFileInput = {
  fileKey: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type DirectMessageGroupedReaction = {
  __typename?: 'DirectMessageGroupedReaction';
  count: Scalars['Int']['output'];
  reaction: Scalars['String']['output'];
  users: Array<User>;
};

export type DirectMessageReaction = {
  __typename?: 'DirectMessageReaction';
  createdAt: Scalars['DateTime']['output'];
  directMessageId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  reaction: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['ID']['output'];
};

export type DirectMessageThread = {
  __typename?: 'DirectMessageThread';
  createdAt: Scalars['DateTime']['output'];
  directMessages?: Maybe<Array<Maybe<DirectMessage>>>;
  id: Scalars['ID']['output'];
  isPinned: Scalars['Boolean']['output'];
  organizationId: Scalars['ID']['output'];
  otherParticipant: User;
  participants: Array<Scalars['ID']['output']>;
  unreadCount: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Input for direct message thread pagination. */
export type DirectMessageThreadPaginationInput = {
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  receiverId: Scalars['ID']['input'];
};

/** Paginated result of direct message thread */
export type DirectMessageThreadPaginator = {
  __typename?: 'DirectMessageThreadPaginator';
  data: Array<DirectMessage>;
  paginatorInfo: PaginatorInfo;
  threadId: Scalars['ID']['output'];
};

export type DismissRecommendationActionInput = {
  recommendationActionsId: Scalars['ID']['input'];
};

/** A signed download URL */
export type DownloadUrl = {
  __typename?: 'DownloadUrl';
  /** The signed URL linking to the download */
  url: Scalars['String']['output'];
};

export type Event = {
  __typename?: 'Event';
  actionables?: Maybe<Array<Maybe<Actionable>>>;
  agendas?: Maybe<Array<Agenda>>;
  attendees?: Maybe<Array<Maybe<Attendee>>>;
  currentMeetingSession?: Maybe<MeetingSession>;
  date: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  end_at: Scalars['String']['output'];
  files?: Maybe<Scalars['JSON']['output']>;
  google_event_id?: Maybe<Scalars['String']['output']>;
  guests?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  link?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  meeting?: Maybe<Meeting>;
  meetingSession?: Maybe<MeetingSession>;
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organization_id: Scalars['ID']['output'];
  participants: Array<Participant>;
  priority?: Maybe<EventPriority>;
  pulse?: Maybe<Pulse>;
  pulse_id: Scalars['ID']['output'];
  start_at: Scalars['String']['output'];
  summary?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  user_id: Scalars['ID']['output'];
};

export type EventInstance = {
  __typename?: 'EventInstance';
  created_at?: Maybe<Scalars['DateTime']['output']>;
  event?: Maybe<Event>;
  event_id: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  local_description?: Maybe<Scalars['String']['output']>;
  priority?: Maybe<Scalars['String']['output']>;
  pulse?: Maybe<Pulse>;
  pulse_id: Scalars['ID']['output'];
  updated_at?: Maybe<Scalars['DateTime']['output']>;
};

export enum EventPriority {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
  Urgent = 'URGENT'
}

export enum EventSortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type EventsInput = {
  dateRange?: InputMaybe<Array<Scalars['String']['input']>>;
  hasMeetingSession?: InputMaybe<Scalars['Boolean']['input']>;
  hasMeetingSessionWithDataSource?: InputMaybe<Scalars['Boolean']['input']>;
  hasNoMeetingSession?: InputMaybe<Scalars['Boolean']['input']>;
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['ID']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<EventSortOrder>;
  userId: Scalars['ID']['input'];
};

export type ExecuteInsightRecommendationInput = {
  insightId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
  recommendationId: Scalars['ID']['input'];
};

export type ExecutionResult = {
  __typename?: 'ExecutionResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum FeedType {
  CollabStarted = 'COLLAB_STARTED',
  Directmessage = 'DIRECTMESSAGE',
  OrggroupCreated = 'ORGGROUP_CREATED',
  PulsememberAdded = 'PULSEMEMBER_ADDED',
  TaskAssigned = 'TASK_ASSIGNED',
  TaskCreated = 'TASK_CREATED',
  Teammesage = 'TEAMMESAGE'
}

export type FetchGoogleCalendarEventsInput = {
  /** Date range start (YYYY-MM-DD format). Defaults to start of current week. */
  fromDate?: InputMaybe<Scalars['Date']['input']>;
  /** Whether to store the fetched events in the database as Event records. Defaults to false. */
  storeEvents?: InputMaybe<Scalars['Boolean']['input']>;
  /** Date range end (YYYY-MM-DD format). Defaults to end of current week. */
  toDate?: InputMaybe<Scalars['Date']['input']>;
};

export type FetchUserCalendarEventsInput = {
  /** The organization ID for authorization. Required for all operations */
  organizationId: Scalars['ID']['input'];
  /** The pulse ID where calendar events should be saved. If not provided, events will be saved to all user's personal pulses within the specified organization */
  pulseId?: InputMaybe<Scalars['ID']['input']>;
};

export type FetchUserCalendarEventsResponse = {
  __typename?: 'FetchUserCalendarEventsResponse';
  /** Success or error message */
  message: Scalars['String']['output'];
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
};

export type FetchUserGoogleCalendarSourcedEventsInput = {
  /** The organization ID for authorization. Required for all operations */
  organizationId: Scalars['ID']['input'];
  /** The pulse ID where sourced calendar events should be saved. If not provided, events will be saved to all user's personal pulses within the specified organization */
  pulseId?: InputMaybe<Scalars['ID']['input']>;
};

export type FetchUserGoogleCalendarSourcedEventsResponse = {
  __typename?: 'FetchUserGoogleCalendarSourcedEventsResponse';
  /** Success or error message */
  message: Scalars['String']['output'];
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
};

/** A file object. */
export type File = {
  __typename?: 'File';
  created_at: Scalars['DateTime']['output'];
  dataSource?: Maybe<DataSource>;
  dataSourceId?: Maybe<Scalars['String']['output']>;
  entity_id: Scalars['String']['output'];
  entity_type: Scalars['String']['output'];
  file_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  organization_id: Scalars['ID']['output'];
  path: Scalars['String']['output'];
  pulse_id?: Maybe<Scalars['ID']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updated_at: Scalars['DateTime']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

/** The type of file being uploaded. */
export enum FileType {
  Csv = 'CSV',
  Doc = 'Doc',
  Docx = 'Docx',
  Html = 'Html',
  Jpg = 'Jpg',
  Markdown = 'Markdown',
  Mp4 = 'Mp4',
  Pdf = 'Pdf',
  Png = 'Png',
  Ppt = 'Ppt',
  Pptx = 'Pptx',
  Rtf = 'Rtf',
  Svg = 'Svg',
  Txt = 'Txt',
  Webp = 'Webp',
  Xls = 'Xls',
  Xlsx = 'Xlsx'
}

export type GenerateAssemblyaiRealtimeClientSecretInput = {
  /**
   * Optional system instructions applied when creating a Realtime session.
   * Used to guide the assistant’s behavior for the duration of the session.
   */
  instructions?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
};

/** Input for generating download credentials for Data Scientist files on S3 */
export type GenerateDataScientistDownloadLinkInput = {
  /** The path to the file to download. */
  filePath?: InputMaybe<Scalars['String']['input']>;
};

/** Input for generating download credentials for Data Source files on S3 */
export type GenerateDataSourceDownloadLinkInput = {
  /** The ID of the data source to download. */
  dataSourceId?: InputMaybe<Scalars['String']['input']>;
  /** The organization that owns the file */
  organizationId?: InputMaybe<Scalars['String']['input']>;
};

export type GenerateEntitiesFromTextInput = {
  fields: Scalars['String']['input'];
  input: Scalars['String']['input'];
};

export type GenerateEventBreakMessageInput = {
  nextEventId: Scalars['ID']['input'];
  previousEventId: Scalars['ID']['input'];
};

export type GenerateJobDescriptionResponse = {
  __typename?: 'GenerateJobDescriptionResponse';
  /** The generated job description */
  jobDescription: Scalars['String']['output'];
  /** The generated responsibilities */
  responsibilities: Array<Maybe<Scalars['String']['output']>>;
};

export type GenerateRealtimeClientSecretInput = {
  /**
   * Optional system instructions applied when creating a Realtime session.
   * Used to guide the assistant’s behavior for the duration of the session.
   */
  instructions?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
};

/** Input for generating a thread title */
export type GenerateThreadTitleInput = {
  threadId: Scalars['UUID']['input'];
};

/** Input for generating upload credentials for S3 */
export type GenerateUploadCredentialsInput = {
  /** The type of file being uploaded. */
  fileType?: InputMaybe<FileType>;
  /** The organization that owns the file */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** The type of upload being generated. */
  uploadType?: InputMaybe<UploadType>;
};

export type GiveLiveInsightFeedbackInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  outboxId: Scalars['ID']['input'];
  rating: Scalars['Int']['input'];
  tags?: InputMaybe<Scalars['JSON']['input']>;
};

export type GoogleCalendarAttendee = {
  __typename?: 'GoogleCalendarAttendee';
  displayName?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  responseStatus: Scalars['String']['output'];
};

export type GoogleCalendarConferenceData = {
  __typename?: 'GoogleCalendarConferenceData';
  entryPoints: Array<GoogleCalendarEntryPoint>;
};

export type GoogleCalendarDateTime = {
  __typename?: 'GoogleCalendarDateTime';
  dateTime: Scalars['String']['output'];
  timeZone: Scalars['String']['output'];
};

export type GoogleCalendarEntryPoint = {
  __typename?: 'GoogleCalendarEntryPoint';
  entryPointType: Scalars['String']['output'];
  uri: Scalars['String']['output'];
};

export type GoogleCalendarEvent = {
  __typename?: 'GoogleCalendarEvent';
  attendees?: Maybe<Array<GoogleCalendarAttendee>>;
  conferenceData?: Maybe<GoogleCalendarConferenceData>;
  description?: Maybe<Scalars['String']['output']>;
  end: GoogleCalendarDateTime;
  id: Scalars['String']['output'];
  location?: Maybe<Scalars['String']['output']>;
  recurring_meeting_id?: Maybe<Scalars['String']['output']>;
  start: GoogleCalendarDateTime;
  summary: Scalars['String']['output'];
};

export type GoogleCalendarLinkResponse = {
  __typename?: 'GoogleCalendarLinkResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type GoogleCalendarRevokeResponse = {
  __typename?: 'GoogleCalendarRevokeResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type GoogleCalendarWebhookRefreshResponse = {
  __typename?: 'GoogleCalendarWebhookRefreshResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  webhook_url?: Maybe<Scalars['String']['output']>;
};

export type GroupMember = {
  __typename?: 'GroupMember';
  id: Scalars['ID']['output'];
  job_description?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['String']['output']>;
  responsibilities?: Maybe<Array<Scalars['String']['output']>>;
  role?: Maybe<PulseMemberRole>;
  user: User;
};

export type GroupedStrategies = {
  __typename?: 'GroupedStrategies';
  alerts?: Maybe<Array<Strategy>>;
  automations?: Maybe<Array<Strategy>>;
  kpis?: Maybe<Array<Strategy>>;
  missions?: Maybe<Array<Strategy>>;
};

export type Hiatus = {
  __typename?: 'Hiatus';
  end_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  start_at: Scalars['String']['output'];
  timesheetId: Scalars['String']['output'];
  total?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};

export type InsightSource = {
  __typename?: 'InsightSource';
  contribution_weight: Scalars['Float']['output'];
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  insight: LiveInsightOutbox;
  insight_id: Scalars['ID']['output'];
  source_id: Scalars['ID']['output'];
  source_type: Scalars['String']['output'];
};

export type InsightSourceInput = {
  contribution_weight?: InputMaybe<Scalars['Float']['input']>;
  source_id: Scalars['ID']['input'];
  source_type: Scalars['String']['input'];
};

export enum InsightStatus {
  Closed = 'closed',
  Delivered = 'delivered',
  Pending = 'pending',
  Seen = 'seen'
}

export enum InsightType {
  Action = 'action',
  Decision = 'decision',
  Risk = 'risk'
}

/** Integration resource for a pulse */
export type Integration = {
  __typename?: 'Integration';
  api_key: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  pulse_id: Scalars['String']['output'];
  sync_status: SyncStatus;
  type: Scalars['String']['output'];
  user_id: Scalars['String']['output'];
};

/** Integration resource for a pulse */
export type Interest = {
  __typename?: 'Interest';
  company_name: Scalars['String']['output'];
  company_size: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  looking_for?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

/** input for inviting guest to pulses */
export type InvitePulseGuestInput = {
  /** email of the guest user */
  email: Scalars['String']['input'];
  /** ID of the organization to associate the guest user */
  organizationId: Scalars['ID']['input'];
  /** ID of the pulse to associate the guest user */
  pulseId: Scalars['ID']['input'];
  /** role of the guest user */
  role: PulseGuestRole;
};

/** Input for inviting users to join an organization. */
export type InviteUserInput = {
  /** The email address of the user. */
  email?: InputMaybe<Scalars['String']['input']>;
  /** The name of the user. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The organization that the user belongs to. */
  organizationId: Scalars['String']['input'];
  /** The user's role in the organization. */
  role?: InputMaybe<OrganizationUserRole>;
};

/** A label for categorizing entities. */
export type Label = {
  __typename?: 'Label';
  color?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  notes?: Maybe<Array<Note>>;
  pulse?: Maybe<Pulse>;
};

export type LiveInsightOutbox = {
  __typename?: 'LiveInsightOutbox';
  bookmarked_at?: Maybe<Scalars['DateTime']['output']>;
  closed_at?: Maybe<Scalars['DateTime']['output']>;
  closed_reason?: Maybe<Scalars['String']['output']>;
  created_at: Scalars['DateTime']['output'];
  delivered_at?: Maybe<Scalars['DateTime']['output']>;
  delivery_status: InsightStatus;
  description?: Maybe<Scalars['String']['output']>;
  explanation?: Maybe<Scalars['String']['output']>;
  feedback?: Maybe<LiveInsightOutboxFeedback>;
  id: Scalars['ID']['output'];
  is_bookmarked?: Maybe<Scalars['Boolean']['output']>;
  item_hash: Scalars['String']['output'];
  meeting: Meeting;
  meeting_id: Scalars['ID']['output'];
  organization: Organization;
  primarySource?: Maybe<InsightSource>;
  pulse: Pulse;
  pulse_id: Scalars['ID']['output'];
  read_at?: Maybe<Scalars['DateTime']['output']>;
  recommendations: Array<LiveInsightRecommendation>;
  remind_at?: Maybe<Scalars['DateTime']['output']>;
  snooze_count: Scalars['Int']['output'];
  sources: Array<InsightSource>;
  topic?: Maybe<Scalars['String']['output']>;
  topicThread?: Maybe<Topic>;
  type: InsightType;
  updated_at: Scalars['DateTime']['output'];
  user: User;
  user_id: Scalars['ID']['output'];
};

export type LiveInsightOutboxFeedback = {
  __typename?: 'LiveInsightOutboxFeedback';
  comment?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  outbox_id: Scalars['ID']['output'];
  rating: Scalars['Int']['output'];
  tags?: Maybe<Scalars['JSON']['output']>;
  user_id: Scalars['ID']['output'];
};

export type LiveInsightRecommendation = {
  __typename?: 'LiveInsightRecommendation';
  actions?: Maybe<Array<Maybe<LiveInsightRecommendationAction>>>;
  created_at: Scalars['DateTime']['output'];
  executedBy?: Maybe<User>;
  execution_result?: Maybe<Scalars['String']['output']>;
  execution_result_data?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  is_executed: Scalars['Boolean']['output'];
  relatedNotes?: Maybe<Array<Maybe<RelatedNote>>>;
  relatedTasks?: Maybe<Array<Maybe<RelatedTask>>>;
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type LiveInsightRecommendationAction = {
  __typename?: 'LiveInsightRecommendationAction';
  data?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['String']['output'];
  method: ActionMethods;
  status: ActionStatus;
  type: ActionTypes;
};

export type LiveInsightsFilter = {
  bookmarked?: InputMaybe<Scalars['Boolean']['input']>;
  meetingId?: InputMaybe<Scalars['ID']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  since?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<InsightStatus>;
  statuses?: InputMaybe<Array<InsightStatus>>;
  type?: InputMaybe<InsightType>;
};

/** Represents a live upload. */
export type LiveUpload = {
  __typename?: 'LiveUpload';
  createdAt: Scalars['DateTime']['output'];
  fileKey: Scalars['String']['output'];
  fullContent?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  organizationId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  summaryContent?: Maybe<Scalars['String']['output']>;
  threadId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

/** MCP Authorization Server Information */
export type McpAuthServerInfo = {
  __typename?: 'MCPAuthServerInfo';
  /** Authorization endpoint URL */
  authorizationEndpoint: Scalars['String']['output'];
  /** Client ID used for authorization */
  clientId: Scalars['String']['output'];
  /** Supported grant types */
  grantTypesSupported?: Maybe<Array<Scalars['String']['output']>>;
  /** Client registration endpoint (if available) */
  registrationEndpoint?: Maybe<Scalars['String']['output']>;
  /** Supported response types */
  responseTypesSupported?: Maybe<Array<Scalars['String']['output']>>;
  /** Supported scopes */
  scopesSupported?: Maybe<Array<Scalars['String']['output']>>;
  /** Token endpoint URL */
  tokenEndpoint: Scalars['String']['output'];
};

/** MCP Authorization Flow response */
export type McpAuthorizationFlow = {
  __typename?: 'MCPAuthorizationFlow';
  /** Authorization server information discovered */
  authServerInfo?: Maybe<McpAuthServerInfo>;
  /** OAuth authorization URL to redirect user to */
  authUrl: Scalars['String']['output'];
  /** MCP server URL being authorized */
  mcpUrl: Scalars['String']['output'];
  /** OAuth state parameter for security validation */
  state: Scalars['String']['output'];
};

/** MCP OAuth Callback Response */
export type McpCallbackResponse = {
  __typename?: 'MCPCallbackResponse';
  /** Response message */
  message: Scalars['String']['output'];
  /** Success status of the callback */
  success: Scalars['Boolean']['output'];
  /** Token data if successful */
  tokenData?: Maybe<McpTokenData>;
};

export enum McpServer {
  Jira = 'JIRA'
}

/** MCP Token Data */
export type McpTokenData = {
  __typename?: 'MCPTokenData';
  /** OAuth access token */
  accessToken: Scalars['String']['output'];
  /** Token expiry time in seconds */
  expiresIn?: Maybe<Scalars['Int']['output']>;
  /** MCP server URL */
  mcpUrl: Scalars['String']['output'];
  /** OAuth refresh token */
  refreshToken?: Maybe<Scalars['String']['output']>;
  /** OAuth scope */
  scope?: Maybe<Scalars['String']['output']>;
  /** Token type (usually Bearer) */
  tokenType: Scalars['String']['output'];
};

export type ManuallyCreateRecurringMeetingInput = {
  delay_minutes: Scalars['Int']['input'];
  meeting_session_id: Scalars['ID']['input'];
  next_meeting_session_id: Scalars['ID']['input'];
};

export type MarkDirectMessageReadInput = {
  directMessageId: Scalars['ID']['input'];
};

export type MarkLiveInsightClosedInput = {
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type MarkLiveInsightSeenInput = {
  id: Scalars['ID']['input'];
};

/** Input for marking team messages as read */
export type MarkTeamMessageReadInput = {
  teamMessageId: Scalars['ID']['input'];
};

export type MasterPulse = {
  __typename?: 'MasterPulse';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  features?: Maybe<Array<Scalars['String']['output']>>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status?: Maybe<Scalars['String']['output']>;
  type: PulseType;
  updatedAt: Scalars['DateTime']['output'];
};

/** A paginated list of MasterPulse items. */
export type MasterPulsePaginator = {
  __typename?: 'MasterPulsePaginator';
  /** A list of MasterPulse items. */
  data: Array<MasterPulse>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

/** Meeting resource */
export type Meeting = {
  __typename?: 'Meeting';
  dataSourceId?: Maybe<Scalars['String']['output']>;
  date: Scalars['DateTime']['output'];
  event?: Maybe<Event>;
  id: Scalars['ID']['output'];
  is_viewable?: Maybe<Scalars['Boolean']['output']>;
  meetingId: Scalars['String']['output'];
  meetingSession?: Maybe<MeetingSession>;
  organizer?: Maybe<Scalars['String']['output']>;
  pulseId: Scalars['String']['output'];
  source: Scalars['String']['output'];
  status: MeetingStatus;
  timezone?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

/** A MeetingSession resource */
export type MeetingSession = {
  __typename?: 'MeetingSession';
  attendees: Array<Maybe<Attendee>>;
  companion_details?: Maybe<CompanionDetails>;
  companion_status?: Maybe<Scalars['String']['output']>;
  dataSource?: Maybe<DataSource>;
  description?: Maybe<Scalars['String']['output']>;
  end_at?: Maybe<Scalars['String']['output']>;
  event?: Maybe<Event>;
  eventInstance?: Maybe<EventInstance>;
  event_id?: Maybe<Scalars['String']['output']>;
  event_instance_id?: Maybe<Scalars['String']['output']>;
  external_attendees?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  gcal_meeting_id?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  internal_meeting_id?: Maybe<Scalars['String']['output']>;
  invite_pulse: Scalars['Boolean']['output'];
  meetingId: Scalars['String']['output'];
  meetingUrl: Scalars['String']['output'];
  meeting_type?: Maybe<MeetingType>;
  name?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  pulse?: Maybe<Pulse>;
  pulseId: Scalars['ID']['output'];
  recurring_invite?: Maybe<Scalars['Boolean']['output']>;
  recurring_meeting_id?: Maybe<Scalars['String']['output']>;
  start_at?: Maybe<Scalars['String']['output']>;
  status: MeetingSessionStatus;
  type: MeetingSessionType;
  userId?: Maybe<Scalars['ID']['output']>;
};

export enum MeetingSessionStatus {
  Active = 'ACTIVE',
  Ended = 'ENDED',
  Inactive = 'INACTIVE',
  Paused = 'PAUSED',
  Start = 'START',
  Stopped = 'STOPPED'
}

export type MeetingSessionStatusResponse = {
  __typename?: 'MeetingSessionStatusResponse';
  id: Scalars['ID']['output'];
  status: MeetingSessionStatus;
};

export enum MeetingSessionType {
  Collab = 'COLLAB',
  Meeting = 'MEETING'
}

export enum MeetingStatus {
  Added = 'added',
  Ignored = 'ignored',
  Pending = 'pending'
}

export enum MeetingType {
  BrainDump = 'BRAIN_DUMP',
  Meeting = 'MEETING'
}

/** An message belonging to a thread. */
export type Message = {
  __typename?: 'Message';
  /** Message content. */
  content?: Maybe<Scalars['String']['output']>;
  /** Message content formatted as HTML. */
  content_html: Scalars['String']['output'];
  /** Timestamp when the message was created. */
  createdAt: Scalars['DateTime']['output'];
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** The saved state of the message */
  is_saved?: Maybe<Scalars['Boolean']['output']>;
  /** ID of the organization that this message belongs to. */
  organizationId: Scalars['UUID']['output'];
  /** The role of the user who wrote the message. */
  role: MessageRole;
  /** The saved message resource */
  savedMessages?: Maybe<SavedMessage>;
  /** The status of the message */
  status: MessageStatus;
  /** ID of the thread that this message belongs to. */
  thread_id: Scalars['UUID']['output'];
  /** ID of topic */
  topic_id?: Maybe<Scalars['UUID']['output']>;
  /** Timestamp when the message was last updated. */
  updatedAt: Scalars['DateTime']['output'];
  /** The user that this message belongs to. */
  user?: Maybe<User>;
  /** ID of the user that this message belongs to. */
  userId: Scalars['UUID']['output'];
};

export type MessageOrderByClause = {
  column: Scalars['String']['input'];
  order: SortOrder;
};

/** A paginated list of Message items. */
export type MessagePaginator = {
  __typename?: 'MessagePaginator';
  /** A list of Message items. */
  data: Array<Message>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export enum MessageRole {
  Assistant = 'assistant',
  Kestra = 'kestra',
  Tool = 'tool',
  User = 'user'
}

export enum MessageSortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

export enum MessageStatus {
  Complete = 'COMPLETE',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type Metadata = {
  __typename?: 'Metadata';
  fileKey?: Maybe<Scalars['String']['output']>;
  fileName?: Maybe<Scalars['String']['output']>;
};

export type MetadataInput = {
  fileKey?: InputMaybe<Scalars['String']['input']>;
  fileName?: InputMaybe<Scalars['String']['input']>;
};

export type MisalignmentAlert = {
  __typename?: 'MisalignmentAlert';
  /** Indicates whether the alert has been acknowledged by the manager. */
  acknowledged: Scalars['Boolean']['output'];
  /** Timestamp when the alert was acknowledged. */
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Timestamp when the alert was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The date and time when the misalignment was detected. */
  detectedAt: Scalars['DateTime']['output'];
  /** Unique primary key. */
  id: Scalars['ID']['output'];
  /** The organization related to the alert. */
  organization: Organization;
  /** The ID of the organization. */
  organizationId: Scalars['UUID']['output'];
  /** The severity of the violation. */
  severity: Scalars['String']['output'];
  /** A summary explanation for the violation (with privacy protection). */
  summary: Scalars['String']['output'];
  /** Timestamp when the alert was last updated. */
  updatedAt: Scalars['DateTime']['output'];
  /** The value that was violated. */
  violatedValue: Scalars['String']['output'];
};

/** A paginated list of MisalignmentAlert items. */
export type MisalignmentAlertPaginator = {
  __typename?: 'MisalignmentAlertPaginator';
  /** A list of MisalignmentAlert items. */
  data: Array<MisalignmentAlert>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export type MonthlyQuestion = {
  __typename?: 'MonthlyQuestion';
  question?: Maybe<Scalars['String']['output']>;
  rank?: Maybe<Scalars['Int']['output']>;
};

export type MonthlySummary = {
  __typename?: 'MonthlySummary';
  comparison?: Maybe<Scalars['String']['output']>;
  comparisonValue?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

/** Indicates what mutation operations are available. */
export type Mutation = {
  __typename?: 'Mutation';
  /** Accepts the invitation */
  acceptInvitation?: Maybe<User>;
  /** Acknowledge a misalignment alert. */
  acknowledgeMisalignmentAlert: MisalignmentAlert;
  addInsightSources: LiveInsightOutbox;
  /** attach an existing contact to another user */
  attachContactToUser: Contact;
  /** Attaches a Google Meet link to an event if it doesn't have one. */
  attachGoogleMeetToEvent: Event;
  attachMeetingSessionToEvent: Event;
  batchUpdateInsightStatus: BatchUpdateInsightStatusOutput;
  bookmarkInsight: LiveInsightOutbox;
  checkIn: Timesheet;
  checkOut?: Maybe<Timesheet>;
  clearNotifications: Scalars['Boolean']['output'];
  clearOrganizationNotifications: Scalars['Boolean']['output'];
  clearTeamMessages: Scalars['Boolean']['output'];
  /** Webhook endpoint for pulse companion events */
  companionWebhook: MeetingSession;
  /** Complete OAuth 2.1 callback flow for MCP server */
  completeMCPAuthorization: McpCallbackResponse;
  /** Creates a new actionable. */
  createActionable: Actionable;
  /** Creates a new agenda. */
  createAgenda: Agenda;
  /** Creates a new agent. */
  createAgent?: Maybe<Agent>;
  /** Creates a new ai agent related to a pulse. */
  createAiAgent?: Maybe<AiAgent>;
  /** Creates a new onboarding session. */
  createAssistantOnboarding: Thread;
  /** Creates a new onboarding session. */
  createAssistantTaskListActions: Message;
  /** Creates an attachment */
  createAttachment: Attachment;
  /** create the user setting background */
  createBackground: Background;
  /** Creates a new checklist. */
  createChecklist: Checklist;
  /** Creates a Stripe Checkout session for a subscription or payment. */
  createCheckoutSession: CheckoutSessionResponse;
  /** create a collaboration resource */
  createCollaboration: Collaboration;
  /** Creates a new completion. */
  createCompletion: Array<Message>;
  /** create a contact */
  createContact: Contact;
  /** Create a custom pulse for an organization. */
  createCustomPulse: Pulse;
  /** Creates a new data source. */
  createDataSource?: Maybe<DataSource>;
  createDirectMessage: DirectMessage;
  /** Creates a new event. */
  createEvent: Event;
  /** Creates a new event instance. */
  createEventInstance: EventInstance;
  createEventSummary: Scalars['String']['output'];
  /** create a hiatus resource for the given user and timesheet */
  createHiatus: Hiatus;
  /** Creates a new insights completion. */
  createInsightsCompletion: Array<Message>;
  createIntegration: Integration;
  createInterest?: Maybe<Interest>;
  /** Creates a new label. */
  createLabel: Label;
  /** Creates a new live upload. */
  createLiveUpload?: Maybe<LiveUpload>;
  /** creates a meeting resource */
  createMeeting: Meeting;
  /** add meeting as a datasource */
  createMeetingDataSource: DataSource;
  /** create a meeting session resource */
  createMeetingSession: MeetingSession;
  /** Creates a new message. */
  createMessage: Message;
  /** Create a new note. */
  createNote: Note;
  /** Creates a data source from a note. */
  createNoteDataSource?: Maybe<DataSource>;
  /** Creates a notification */
  createNotification?: Maybe<Notification>;
  /** Creates a notification preference for the authenticated user */
  createNotificationPreference: NotificationPreference;
  /** Creates a new data organization. */
  createOrganization?: Maybe<Organization>;
  /** Creates a new organiztion group */
  createOrganizationGroup?: Maybe<OrganizationGroup>;
  /** Creates a new organiztion group member */
  createOrganizationGroupMember?: Maybe<Array<Maybe<PulseMember>>>;
  /** Create a pulse for an organization by selecting from available master pulses. */
  createPulse: Pulse;
  /** Create a pulse member for a user that is associated to a pulse. */
  createPulseMember?: Maybe<Array<PulseMember>>;
  /** Create a pulse task status */
  createPulseTaskStatus: TaskStatusType;
  /** Creates a new reply team thread. */
  createReplyTeamThread?: Maybe<ReplyTeamThread>;
  /** create the user settings */
  createSetting: Setting;
  /** Creates a smart agenda. */
  createSmartAgenda: Array<Agenda>;
  /** Creates a smart checklist. */
  createSmartChecklist: Array<Checklist>;
  /** Create smart notes from text. */
  createSmartNotes: SmartNoteResponse;
  /** Create smart tasks from transcript */
  createSmartTasks: Array<Maybe<Task>>;
  /** Creates a pulse strategy */
  createStrategy: Strategy;
  /** create a strategy description */
  createStrategyDescription: StrategyDescription;
  /** create summary options */
  createSummaryOptions: Message;
  /** create a task resource */
  createTask: Array<Maybe<Task>>;
  /** Create a task phase */
  createTaskPhase: TaskPhaseType;
  /** Creates a new team message. */
  createTeamMessage?: Maybe<TeamMessage>;
  /** Creates a new team thread. */
  createTeamThread?: Maybe<TeamThread>;
  /** Creates a new thread. */
  createThread?: Maybe<Thread>;
  /** Creates a new topic. */
  createTopic?: Maybe<Topic>;
  /** create a widget resource for the given user */
  createWidget: Widget;
  /** Deletes an actionable. */
  deleteActionable: Actionable;
  /** Deletes an agenda. */
  deleteAgenda: Agenda;
  /** Deletes an ai agent by ID. */
  deleteAiAgent: AiAgent;
  /** Deletes a background */
  deleteBackground: Background;
  /** Deletes a checklist. */
  deleteChecklist: Checklist;
  /** delete a contact - detaches user if other owners exist, otherwise soft deletes the contact */
  deleteContact: Contact;
  /** Deletes a data source. */
  deleteDataSource?: Maybe<DataSource>;
  /** Deletes a direct message */
  deleteDirectMessage?: Maybe<DirectMessage>;
  /** Deletes an event. */
  deleteEvent: Event;
  /** Deletes an event instance. */
  deleteEventInstance: EventInstance;
  /** delete a given pulsemember */
  deleteIntegration: Scalars['Boolean']['output'];
  /** Delete a label. */
  deleteLabel: Label;
  /** Deletes the currently authenticated user. */
  deleteMe: Scalars['Boolean']['output'];
  /** Deletes a meeting session. */
  deleteMeetingSession: MeetingSession;
  deleteMeetingSummary: ExecutionResult;
  /** Deletes a note. */
  deleteNote: Note;
  deleteNoteFileAttachement: Scalars['Boolean']['output'];
  /** Deletes multiple notes. */
  deleteNotes: Scalars['Boolean']['output'];
  /** Deletes an organization group. */
  deleteOrganizationGroup: OrganizationGroup;
  /** delete a organization member */
  deleteOrganizationUser: Scalars['Boolean']['output'];
  deletePulse?: Maybe<Scalars['Boolean']['output']>;
  /** delete a given pulsemember */
  deletePulseMember: Scalars['Boolean']['output'];
  /** Delete a pulse task status */
  deletePulseTaskStatus: Scalars['Boolean']['output'];
  deleteSavedMessage?: Maybe<Scalars['Boolean']['output']>;
  /** Deletes a pulse strategy */
  deleteStrategy?: Maybe<Scalars['Boolean']['output']>;
  /** Delete a given task */
  deleteTask?: Maybe<Task>;
  /** Delete a task phase */
  deleteTaskPhase: Scalars['Boolean']['output'];
  /** Deletes a team message. */
  deleteTeamMessage: Scalars['Boolean']['output'];
  /** Deletes a thread */
  deleteThread: Thread;
  /** Deletes a topic. */
  deleteTopic?: Maybe<Scalars['Boolean']['output']>;
  /** delete a given widget */
  deleteWidget: Scalars['Boolean']['output'];
  dismissRecommendationAction: ExecutionResult;
  executeInsightRecommendation: ExecutionResult;
  /** Fetch and save authenticated user's calendar events to a specific pulse or all personal pulses */
  fetchUserCalendarEvents: FetchUserCalendarEventsResponse;
  /** Fetch and save authenticated user's sourced calendar events from Google Calendar to a specific pulse or all personal pulses */
  fetchUserGoogleCalendarSourcedEvents: FetchUserGoogleCalendarSourcedEventsResponse;
  generateAssemblyaiRealtimeClientSecret: Scalars['String']['output'];
  /** Generates S3 credentials suitable for downloading a data source file. */
  generateDataScientistDownloadLink?: Maybe<DownloadUrl>;
  /** Generates S3 credentials suitable for downloading a data source file. */
  generateDataSourceDownloadLink?: Maybe<DownloadUrl>;
  /** Generates entities from free-form text based on a given schema or type. */
  generateEntitiesFromText: Scalars['String']['output'];
  /** Generates a message for a scout event break */
  generateEventBreakMessage: Scalars['String']['output'];
  /** Generates a message for a scout event break */
  generateJobDescription: GenerateJobDescriptionResponse;
  /** Generates S3 credentials suitable for uploading to development bucket. */
  generateLiveUploadCredentials?: Maybe<UploadCredentials>;
  generateRealtimeClientSecret: Scalars['String']['output'];
  /** Generates a title for a thread based on its messages. */
  generateThreadTitle?: Maybe<ThreadTitleResponse>;
  /** Generates S3 credentials suitable for uploading. */
  generateUploadCredentials?: Maybe<UploadCredentials>;
  getOrCreateDirectMessageThread: DirectMessageThreadPaginator;
  giveLiveInsightFeedback: LiveInsightOutboxFeedback;
  googleCalendarRevoke: GoogleCalendarRevokeResponse;
  /** Human in the loop mutation for mapping users to speakers */
  humanInTheLoop: Scalars['Boolean']['output'];
  ignoreMeeting: Meeting;
  importGoogleCalendarMeetings: Array<MeetingSession>;
  /** Invite a guest to a pulse */
  invitePulseGuest: User;
  /** Invites a new user. */
  inviteUser?: Maybe<Array<Maybe<User>>>;
  kestraMessage: Message;
  linkGoogleCalendar: GoogleCalendarLinkResponse;
  manuallyScheduleRecurringMeetingSummary: Scalars['String']['output'];
  /** Mark a direct message as read */
  markDirectMessageRead: Scalars['Boolean']['output'];
  markDirectMessagesAsRead: Scalars['Boolean']['output'];
  markLiveInsightClosed: LiveInsightOutbox;
  markLiveInsightSeen: LiveInsightOutbox;
  /** Mark a team message as read */
  markTeamMessageRead: Scalars['Boolean']['output'];
  markTeamMessagesAsRead: Scalars['Boolean']['output'];
  /** Agrees to the terms on behalf of an organization */
  onboardingAgreeToTerms?: Maybe<Organization>;
  /** Confirms that an organization has completed onboarding */
  onboardingComplete?: Maybe<Organization>;
  /** Confirms that an organization has sufficient data sources set up during onboarding */
  onboardingConfirmDataSources: DataSourcePaginator;
  /** Confirms that an organization has installed the Slack app during onboarding */
  onboardingConfirmSlack?: Maybe<Organization>;
  /** Generates A Slack installation URI. */
  onboardingGenerateSlackInstallUri: SlackInstallUri;
  pinDirectMessage: DirectMessage;
  pinNotes: Array<Note>;
  /** Pins an organization user for direct messages */
  pinOrganizationUser: OrganizationUser;
  pinTeamMessage: TeamMessage;
  /** make the notification read for the given user */
  readNotification: Notification;
  /** make all notifications read for the given user */
  readNotifications: Array<Notification>;
  /** Redo a message by deleting it and all subsequent messages from the user, then resending the original message. */
  redoMessage: Message;
  refetchIntegration: Integration;
  /** Refreshes actionables for a specific event by deleting existing ones and creating new ones. */
  refreshEventActionables: Scalars['Boolean']['output'];
  /** Force refresh Google Calendar webhook setup for the authenticated user */
  refreshGoogleCalendarWebhook: GoogleCalendarWebhookRefreshResponse;
  /** Re-ingest a meeting session's transcript into a target pulse; returns the created Meeting */
  reingestMeetingSessionTranscript: Meeting;
  saveMessage: SavedMessage;
  /** Signs a user in after Auth0 authentication. */
  signInUser?: Maybe<User>;
  /** Register a new user */
  signup?: Maybe<User>;
  snoozeInsight: LiveInsightOutbox;
  /** Start OAuth 2.1 authorization flow for MCP server */
  startMCPAuthorization: McpAuthorizationFlow;
  subscribeToWebPush?: Maybe<Scalars['Boolean']['output']>;
  /** Sync a single event from Google Calendar to local database */
  syncSingleEvent: SyncSingleEventResponse;
  toggleDirectMessageReaction: Scalars['Boolean']['output'];
  toggleTeamMessageReaction: Scalars['Boolean']['output'];
  /** Unpins an organization user for direct messages */
  unpinOrganizationUser: OrganizationUser;
  /** Updates an AI message content without changing timestamps. */
  updateAIMessage: Message;
  /** Updates an existing actionable. */
  updateActionable: Actionable;
  updateActiveThread: Thread;
  /** Updates an existing agenda. */
  updateAgenda: Agenda;
  /** Update the order of given agendas */
  updateAgendaOrder: Array<Agenda>;
  /** Updates an agent. */
  updateAgent?: Maybe<Agent>;
  /** Update an AI agent */
  updateAiAgent: AiAgent;
  /** Updates an attachment */
  updateAttachment: Attachment;
  /** Update a given collaboration */
  updateBackground: Background;
  /** Updates an existing checklist. */
  updateChecklist: Checklist;
  /** Update the order of given checklists */
  updateChecklistOrder: Array<Checklist>;
  /** Update a given collaboration */
  updateCollaboration: Collaboration;
  /** update a contact (patch - only provided fields will be updated) */
  updateContact: Contact;
  /** Updates a data source. */
  updateDataSource?: Maybe<DataSource>;
  updateDirectMessage?: Maybe<DirectMessage>;
  /** Updates an existing event. */
  updateEvent: Event;
  /** update the given hiatus resource */
  updateHiatus: Hiatus;
  updateInsightStatus: LiveInsightOutbox;
  /** Update an existing label. */
  updateLabel: Label;
  /** Updates the currently signed-in user. */
  updateMe?: Maybe<User>;
  /** Update a given meeting session */
  updateMeetingSession: MeetingSessionStatusResponse;
  updateMeetingSessionInvitePulse: MeetingSession;
  /** Updates an existing note. */
  updateNote: Note;
  /** Update the order of given notes */
  updateNoteOrder: Array<Note>;
  /** Updates a notification status */
  updateNotificationStatus: Notification;
  /** Updates an organization. */
  updateOrganization?: Maybe<Organization>;
  /** Update the details of the organization group */
  updateOrganizationGroup: OrganizationGroup;
  /** Updates the currently signed-in user organization user details. */
  updateOrganizationUser?: Maybe<OrganizationUser>;
  /** Update an org user role */
  updateOrganizationUserRole: OrganizationUser;
  /** Update the details of a given pulse */
  updatePulse: Pulse;
  updatePulseLastVisited: PulseMember;
  /** Update a pulse member details */
  updatePulseMember: PulseMember;
  /** Update a pulse member role */
  updatePulseMemberRole: PulseMember;
  updatePulseOrder?: Maybe<Array<Pulse>>;
  /** Update a pulse task status */
  updatePulseTaskStatus: TaskStatusType;
  updateRecommendationAction: ExecutionResult;
  /** udpate the user settings */
  updateSetting: Setting;
  /** Updates a pulse strategy */
  updateStrategy: Strategy;
  updateSummary?: Maybe<Summary>;
  /** Update a given task */
  updateTask: Task;
  /** update the order of given tasks */
  updateTaskOrder?: Maybe<Array<Task>>;
  /** Update a task phase */
  updateTaskPhase: TaskPhaseType;
  /** Update the status of a task */
  updateTaskStatus: Task;
  /** Update the order of task statuses */
  updateTaskStatusOrder: Array<TaskStatusType>;
  /** Updates an existing team message. */
  updateTeamMessage?: Maybe<TeamMessage>;
  /** Updates a thread. */
  updateThread?: Maybe<Thread>;
  /** Updates a timesheet. */
  updateTimesheet?: Maybe<Timesheet>;
  /** Updates an existing topic. */
  updateTopic?: Maybe<Topic>;
  /** Updates the AssemblyAI API key for the currently signed-in user. */
  updateUserAssemblyaiKey?: Maybe<User>;
  /** Updates the OpenAI API key for the currently signed-in user. */
  updateUserOpenaiApiKey?: Maybe<User>;
  /** update a widget resource */
  updateWidget: Widget;
  /** update the order of given widgets */
  updateWidgetOrder?: Maybe<Array<Widget>>;
};


/** Indicates what mutation operations are available. */
export type MutationAcceptInvitationArgs = {
  input: AcceptInvitationInput;
};


/** Indicates what mutation operations are available. */
export type MutationAcknowledgeMisalignmentAlertArgs = {
  input: AcknowledgeMisalignmentAlertInput;
};


/** Indicates what mutation operations are available. */
export type MutationAddInsightSourcesArgs = {
  input: AddInsightSourcesInput;
};


/** Indicates what mutation operations are available. */
export type MutationAttachContactToUserArgs = {
  input: AttachContactToUserInput;
};


/** Indicates what mutation operations are available. */
export type MutationAttachGoogleMeetToEventArgs = {
  eventId: Scalars['ID']['input'];
  invite_pulse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationAttachMeetingSessionToEventArgs = {
  input: AttachMeetingSessionToEventInput;
};


/** Indicates what mutation operations are available. */
export type MutationBatchUpdateInsightStatusArgs = {
  input: BatchUpdateInsightStatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationBookmarkInsightArgs = {
  input: BookmarkInsightInput;
};


/** Indicates what mutation operations are available. */
export type MutationClearNotificationsArgs = {
  pulseId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationClearOrganizationNotificationsArgs = {
  organizationId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationClearTeamMessagesArgs = {
  organizationId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationCompanionWebhookArgs = {
  input: CompanionWebhookInput;
};


/** Indicates what mutation operations are available. */
export type MutationCompleteMcpAuthorizationArgs = {
  code: Scalars['String']['input'];
  state: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationCreateActionableArgs = {
  input: CreateActionableInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateAgendaArgs = {
  input: CreateAgendaInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateAgentArgs = {
  input: CreateAgentInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateAiAgentArgs = {
  input: CreateAiAgentInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateAssistantOnboardingArgs = {
  input: CreateAssistantOnboardingInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateAssistantTaskListActionsArgs = {
  input: CreateAssistantTaskListActionsInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateAttachmentArgs = {
  input: CreateAttachmentInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateBackgroundArgs = {
  input: CreateBackgroundInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateChecklistArgs = {
  input: CreateChecklistInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateCheckoutSessionArgs = {
  price_id: Scalars['String']['input'];
  quantity?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationCreateCollaborationArgs = {
  input: CreateCollaborationInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateCompletionArgs = {
  input: CreateCompletionInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateContactArgs = {
  input: CreateContactInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateCustomPulseArgs = {
  input: CreateCustomPulseInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateDataSourceArgs = {
  input: CreateDataSourceInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateDirectMessageArgs = {
  input?: InputMaybe<CreateDirectMessageInput>;
};


/** Indicates what mutation operations are available. */
export type MutationCreateEventArgs = {
  input: CreateEventInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateEventInstanceArgs = {
  input: CreateEventInstanceInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateEventSummaryArgs = {
  input: CreateEventSummaryInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateHiatusArgs = {
  input: CreateHiatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateInsightsCompletionArgs = {
  input: CreateInsightsCompletionInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateIntegrationArgs = {
  input: CreateIntegrationInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateInterestArgs = {
  input?: InputMaybe<CreateInterestInput>;
};


/** Indicates what mutation operations are available. */
export type MutationCreateLabelArgs = {
  input: CreateLabelInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateLiveUploadArgs = {
  input: CreateLiveUploadInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateMeetingArgs = {
  input: CreateMeetingInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateMeetingDataSourceArgs = {
  input: CreateMeetingDataSourceInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateMeetingSessionArgs = {
  input: CreateMeetingSessionInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateMessageArgs = {
  input: CreateMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateNoteArgs = {
  input: CreateNoteInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateNoteDataSourceArgs = {
  input: CreateNoteDataSourceInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateNotificationArgs = {
  input: CreateNotificationInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateNotificationPreferenceArgs = {
  input: CreateNotificationPreferenceInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateOrganizationGroupArgs = {
  input: CreateOrganizationGroupInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateOrganizationGroupMemberArgs = {
  input: UpdateOrCreateOrganizationGroupMemberInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreatePulseArgs = {
  input: ProvisionPulseInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreatePulseMemberArgs = {
  input?: InputMaybe<Array<CreatePulseMemberInput>>;
  pulseId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationCreatePulseTaskStatusArgs = {
  input: CreatePulseTaskStatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateReplyTeamThreadArgs = {
  input: CreateReplyTeamThreadInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateSettingArgs = {
  input: CreateSettingInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateSmartAgendaArgs = {
  input: CreateSmartAgendaInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateSmartChecklistArgs = {
  input: CreateSmartChecklistInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateSmartNotesArgs = {
  input: CreateSmartNotesInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateSmartTasksArgs = {
  input: CreateSmartTasksInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateStrategyArgs = {
  input: CreateStrategyInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateStrategyDescriptionArgs = {
  input: StrategyDescriptionInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateSummaryOptionsArgs = {
  input?: InputMaybe<CreateSummaryOptionsInput>;
};


/** Indicates what mutation operations are available. */
export type MutationCreateTaskArgs = {
  input?: InputMaybe<Array<CreateTaskInput>>;
};


/** Indicates what mutation operations are available. */
export type MutationCreateTaskPhaseArgs = {
  input: CreateTaskPhaseInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateTeamMessageArgs = {
  input: CreateTeamMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateTeamThreadArgs = {
  input: CreateTeamThreadInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateThreadArgs = {
  input: CreateThreadInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateTopicArgs = {
  input: CreateTopicInput;
};


/** Indicates what mutation operations are available. */
export type MutationCreateWidgetArgs = {
  input: CreateWidgetInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteActionableArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteAgendaArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteAiAgentArgs = {
  aiAgentId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteBackgroundArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteChecklistArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteContactArgs = {
  input: DeleteContactInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteDataSourceArgs = {
  input: DeleteDataSourceInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteDirectMessageArgs = {
  directMessageId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteEventArgs = {
  id: Scalars['ID']['input'];
  sync_with_google_calendar?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteEventInstanceArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteIntegrationArgs = {
  integrationId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteLabelArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteMeetingSessionArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteMeetingSummaryArgs = {
  input: DeleteSummaryInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteNoteArgs = {
  noteId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteNoteFileAttachementArgs = {
  fileId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteNotesArgs = {
  noteIds: Array<Scalars['ID']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteOrganizationGroupArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteOrganizationUserArgs = {
  organizationUserId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeletePulseArgs = {
  pulseId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeletePulseMemberArgs = {
  pulseMemberId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeletePulseTaskStatusArgs = {
  input: DeletePulseTaskStatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteSavedMessageArgs = {
  savedMessageId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteStrategyArgs = {
  strategyId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteTaskPhaseArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDeleteTeamMessageArgs = {
  input: DeleteTeamMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteThreadArgs = {
  input: DeleteThreadInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteTopicArgs = {
  input: DeleteTopicInput;
};


/** Indicates what mutation operations are available. */
export type MutationDeleteWidgetArgs = {
  widgetId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationDismissRecommendationActionArgs = {
  input: DismissRecommendationActionInput;
};


/** Indicates what mutation operations are available. */
export type MutationExecuteInsightRecommendationArgs = {
  input: ExecuteInsightRecommendationInput;
};


/** Indicates what mutation operations are available. */
export type MutationFetchUserCalendarEventsArgs = {
  input?: InputMaybe<FetchUserCalendarEventsInput>;
};


/** Indicates what mutation operations are available. */
export type MutationFetchUserGoogleCalendarSourcedEventsArgs = {
  input?: InputMaybe<FetchUserGoogleCalendarSourcedEventsInput>;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateAssemblyaiRealtimeClientSecretArgs = {
  input: GenerateAssemblyaiRealtimeClientSecretInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateDataScientistDownloadLinkArgs = {
  input: GenerateDataScientistDownloadLinkInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateDataSourceDownloadLinkArgs = {
  input: GenerateDataSourceDownloadLinkInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateEntitiesFromTextArgs = {
  input: GenerateEntitiesFromTextInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateEventBreakMessageArgs = {
  input: GenerateEventBreakMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateJobDescriptionArgs = {
  organizationUserId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationGenerateLiveUploadCredentialsArgs = {
  input: GenerateUploadCredentialsInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateRealtimeClientSecretArgs = {
  input: GenerateRealtimeClientSecretInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateThreadTitleArgs = {
  input: GenerateThreadTitleInput;
};


/** Indicates what mutation operations are available. */
export type MutationGenerateUploadCredentialsArgs = {
  input: GenerateUploadCredentialsInput;
};


/** Indicates what mutation operations are available. */
export type MutationGetOrCreateDirectMessageThreadArgs = {
  input: DirectMessageThreadPaginationInput;
};


/** Indicates what mutation operations are available. */
export type MutationGiveLiveInsightFeedbackArgs = {
  input: GiveLiveInsightFeedbackInput;
};


/** Indicates what mutation operations are available. */
export type MutationHumanInTheLoopArgs = {
  bot_meeting_id: Scalars['String']['input'];
  maps: Array<UserSpeakerMapInput>;
  transcript_id: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationIgnoreMeetingArgs = {
  meetingId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationImportGoogleCalendarMeetingsArgs = {
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationInvitePulseGuestArgs = {
  input: InvitePulseGuestInput;
};


/** Indicates what mutation operations are available. */
export type MutationInviteUserArgs = {
  input: Array<InviteUserInput>;
};


/** Indicates what mutation operations are available. */
export type MutationKestraMessageArgs = {
  input: CreateKestraMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationLinkGoogleCalendarArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationManuallyScheduleRecurringMeetingSummaryArgs = {
  input: ManuallyCreateRecurringMeetingInput;
};


/** Indicates what mutation operations are available. */
export type MutationMarkDirectMessageReadArgs = {
  input: MarkDirectMessageReadInput;
};


/** Indicates what mutation operations are available. */
export type MutationMarkDirectMessagesAsReadArgs = {
  threadId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationMarkLiveInsightClosedArgs = {
  input: MarkLiveInsightClosedInput;
};


/** Indicates what mutation operations are available. */
export type MutationMarkLiveInsightSeenArgs = {
  input: MarkLiveInsightSeenInput;
};


/** Indicates what mutation operations are available. */
export type MutationMarkTeamMessageReadArgs = {
  input: MarkTeamMessageReadInput;
};


/** Indicates what mutation operations are available. */
export type MutationMarkTeamMessagesAsReadArgs = {
  threadId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationOnboardingAgreeToTermsArgs = {
  input: OnboardingAgreeToTermsInput;
};


/** Indicates what mutation operations are available. */
export type MutationOnboardingCompleteArgs = {
  input: OnboardingCompleteInput;
};


/** Indicates what mutation operations are available. */
export type MutationOnboardingConfirmDataSourcesArgs = {
  first?: Scalars['Int']['input'];
  input: OnboardingConfirmDataSourcesInput;
  page?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationOnboardingConfirmSlackArgs = {
  input: OnboardingConfirmSlackInput;
};


/** Indicates what mutation operations are available. */
export type MutationOnboardingGenerateSlackInstallUriArgs = {
  input: OnboardingGenerateSlackInstallUriInput;
};


/** Indicates what mutation operations are available. */
export type MutationPinDirectMessageArgs = {
  directMessageId: Scalars['ID']['input'];
  pinned: Scalars['Boolean']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationPinNotesArgs = {
  noteIds: Array<Scalars['ID']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationPinOrganizationUserArgs = {
  input: PinOrganizationUserInput;
};


/** Indicates what mutation operations are available. */
export type MutationPinTeamMessageArgs = {
  pinned: Scalars['Boolean']['input'];
  teamMessageId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationReadNotificationArgs = {
  input: ReadNotificationInput;
};


/** Indicates what mutation operations are available. */
export type MutationRedoMessageArgs = {
  input: RedoMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationRefetchIntegrationArgs = {
  input: RefetchIntegrationInput;
};


/** Indicates what mutation operations are available. */
export type MutationRefreshEventActionablesArgs = {
  eventId: Scalars['String']['input'];
  meetingId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationReingestMeetingSessionTranscriptArgs = {
  input: ReingestMeetingSessionTranscriptInput;
};


/** Indicates what mutation operations are available. */
export type MutationSaveMessageArgs = {
  input: SaveMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationSignInUserArgs = {
  input: SignInUserInput;
};


/** Indicates what mutation operations are available. */
export type MutationSignupArgs = {
  input: UserSignUpInput;
};


/** Indicates what mutation operations are available. */
export type MutationSnoozeInsightArgs = {
  input: SnoozeInsightInput;
};


/** Indicates what mutation operations are available. */
export type MutationStartMcpAuthorizationArgs = {
  mcpServer: McpServer;
  redirectUri?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what mutation operations are available. */
export type MutationSubscribeToWebPushArgs = {
  input: WebPushSubscriptionInput;
};


/** Indicates what mutation operations are available. */
export type MutationSyncSingleEventArgs = {
  input: SyncSingleEventInput;
};


/** Indicates what mutation operations are available. */
export type MutationToggleDirectMessageReactionArgs = {
  input: ToggleDirectMessageReactionInput;
};


/** Indicates what mutation operations are available. */
export type MutationToggleTeamMessageReactionArgs = {
  input: ToggleTeamMessageReactionInput;
};


/** Indicates what mutation operations are available. */
export type MutationUnpinOrganizationUserArgs = {
  input: UnpinOrganizationUserInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateAiMessageArgs = {
  input: UpdateAiMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateActionableArgs = {
  input: UpdateActionableInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateActiveThreadArgs = {
  threadId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationUpdateAgendaArgs = {
  input: UpdateAgendaInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateAgendaOrderArgs = {
  input: Array<AgendaOrderInput>;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateAgentArgs = {
  input: UpdateAgentInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateAiAgentArgs = {
  input: UpdateAiAgentInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateAttachmentArgs = {
  input: UpdateAttachmentInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateBackgroundArgs = {
  input: UpdateBackgroundInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateChecklistArgs = {
  input: UpdateChecklistInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateChecklistOrderArgs = {
  input: Array<ChecklistOrderInput>;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateCollaborationArgs = {
  input: UpdateCollaborationInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateContactArgs = {
  input: UpdateContactInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateDataSourceArgs = {
  input: UpdateDataSourceInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateDirectMessageArgs = {
  input: UpdateDirectMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateEventArgs = {
  input: UpdateEventInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateHiatusArgs = {
  hiatusId: Scalars['ID']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationUpdateInsightStatusArgs = {
  input: UpdateInsightStatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateLabelArgs = {
  input: UpdateLabelInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateMeArgs = {
  input: UpdateMeInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateMeetingSessionArgs = {
  input: UpdateMeetingSessionInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateMeetingSessionInvitePulseArgs = {
  input: UpdateMeetingSessionInvitePulseInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateNoteArgs = {
  input: UpdateNoteInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateNoteOrderArgs = {
  input: Array<NoteOrderInput>;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateNotificationStatusArgs = {
  input: UpdateNotificationStatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateOrganizationArgs = {
  input: UpdateOrganizationInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateOrganizationGroupArgs = {
  input: UpdateOrganizationGroupInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateOrganizationUserArgs = {
  input: UpdateOrganizationUserInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateOrganizationUserRoleArgs = {
  input: UpdateOrganizationUserRoleInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdatePulseArgs = {
  input: UpdatePulseInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdatePulseLastVisitedArgs = {
  lastVisited?: InputMaybe<Scalars['DateTime']['input']>;
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what mutation operations are available. */
export type MutationUpdatePulseMemberArgs = {
  input: UpdatePulseMemberInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdatePulseMemberRoleArgs = {
  input: UpdatePulseMemberRoleInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdatePulseOrderArgs = {
  input?: InputMaybe<Array<UpdatePulseOrderInput>>;
};


/** Indicates what mutation operations are available. */
export type MutationUpdatePulseTaskStatusArgs = {
  input: UpdatePulseTaskStatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateRecommendationActionArgs = {
  input: UpdateRecommendationActionInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateSettingArgs = {
  input: UpdateSettingInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateStrategyArgs = {
  input: UpdateStrategyInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateSummaryArgs = {
  input?: InputMaybe<UpdateSummaryOptionsInput>;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTaskArgs = {
  input: UpdateTaskInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTaskOrderArgs = {
  input?: InputMaybe<Array<TaskOrderInput>>;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTaskPhaseArgs = {
  input: UpdateTaskPhaseInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTaskStatusArgs = {
  input: UpdateTaskStatusInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTaskStatusOrderArgs = {
  input: Array<TaskStatusOrderInput>;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTeamMessageArgs = {
  input: UpdateTeamMessageInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateThreadArgs = {
  input: UpdateThreadInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTimesheetArgs = {
  input: UpdateTimesheetInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateTopicArgs = {
  input: UpdateTopicInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateUserAssemblyaiKeyArgs = {
  input: UpdateUserAssemblyaiKeyInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateUserOpenaiApiKeyArgs = {
  input: UpdateUserOpenaiApiKeyInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateWidgetArgs = {
  input: UpdateWidgetInput;
};


/** Indicates what mutation operations are available. */
export type MutationUpdateWidgetOrderArgs = {
  input?: InputMaybe<Array<WidgetOrderInput>>;
};

/** A note object. */
export type Note = {
  __typename?: 'Note';
  content?: Maybe<Scalars['String']['output']>;
  dataSource?: Maybe<DataSource>;
  dataSourceId?: Maybe<Scalars['String']['output']>;
  files?: Maybe<Array<File>>;
  id: Scalars['ID']['output'];
  labels?: Maybe<Array<Label>>;
  pinned: Scalars['Boolean']['output'];
  position: Scalars['String']['output'];
  pulse?: Maybe<Pulse>;
  pulseId?: Maybe<Scalars['ID']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type NoteAttachmentInput = {
  fileKey: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

/** Input for updating the order of notes. */
export type NoteOrderInput = {
  id: Scalars['ID']['input'];
  position: Scalars['Int']['input'];
};

export type Notification = {
  __typename?: 'Notification';
  context?: Maybe<NotificationContext>;
  created_at: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isArchived?: Maybe<Scalars['Boolean']['output']>;
  kind: NotificationKind;
  organization: Organization;
  pulse?: Maybe<Pulse>;
  readAt?: Maybe<Scalars['DateTime']['output']>;
  status: NotificationStatus;
  summary?: Maybe<Summary>;
  updated_at: Scalars['String']['output'];
  users?: Maybe<Array<Maybe<NotificationUser>>>;
};

export type NotificationContext = {
  __typename?: 'NotificationContext';
  id: Scalars['ID']['output'];
  isArchived: Scalars['Boolean']['output'];
  summaryId?: Maybe<Scalars['String']['output']>;
  taskId?: Maybe<Scalars['String']['output']>;
};

export enum NotificationKind {
  AssigneeCreated = 'assignee_created',
  ChatMention = 'chat_mention',
  Information = 'information',
  SummaryOption = 'summary_option',
  Survey = 'survey'
}

/** A paginated list of Notification items. */
export type NotificationPaginator = {
  __typename?: 'NotificationPaginator';
  /** A list of Notification items. */
  data: Array<Notification>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export type NotificationPreference = {
  __typename?: 'NotificationPreference';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mode: NotificationPreferenceMode;
  pulse?: Maybe<Pulse>;
  scopeId?: Maybe<Scalars['ID']['output']>;
  scopeType: NotificationPreferenceScopeType;
  topic?: Maybe<Topic>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
};

export enum NotificationPreferenceMode {
  All = 'all',
  Mentions = 'mentions',
  Off = 'off'
}

export enum NotificationPreferenceScopeType {
  Global = 'global',
  Pulse = 'pulse',
  Topic = 'topic'
}

export enum NotificationStatus {
  Dismissed = 'dismissed',
  Pending = 'pending',
  Resolved = 'resolved'
}

export enum NotificationType {
  Organization = 'ORGANIZATION',
  Pulse = 'PULSE',
  Users = 'USERS'
}

export type NotificationUser = {
  __typename?: 'NotificationUser';
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notifications: Array<Notification>;
};

/** Input for agreeing to terms during onboarding. */
export type OnboardingAgreeToTermsInput = {
  /** The organization that is agreeing to terms. */
  organizationId: Scalars['UUID']['input'];
};

/** Input for marking onboarding as complete. */
export type OnboardingCompleteInput = {
  /** The organization that is completing onboarding. */
  organizationId: Scalars['UUID']['input'];
};

/** Input for confirming the presence of data sources during onboarding. */
export type OnboardingConfirmDataSourcesInput = {
  /** The organization that is confirming data sources. */
  organizationId: Scalars['UUID']['input'];
};

/** Input for confirming Slack installation during onboarding. */
export type OnboardingConfirmSlackInput = {
  code: Scalars['String']['input'];
  /** The organization that is confirming Slack installation. */
  organizationId: Scalars['UUID']['input'];
};

/** Input for generating a Slack installation URI. */
export type OnboardingGenerateSlackInstallUriInput = {
  /** The organization that is installing Slack. */
  organizationId: Scalars['String']['input'];
  redirectUri: Scalars['String']['input'];
};

/** Allows ordering a list of records. */
export type OrderByClause = {
  /** The column that is used for ordering. */
  column: Scalars['String']['input'];
  /** The direction that is used for ordering. */
  order: SortOrder;
};

/** Aggregate functions when ordering by a relation without specifying a column. */
export enum OrderByRelationAggregateFunction {
  /** Amount of items. */
  Count = 'COUNT'
}

/** Aggregate functions when ordering by a relation that may specify a column. */
export enum OrderByRelationWithColumnAggregateFunction {
  /** Average. */
  Avg = 'AVG',
  /** Amount of items. */
  Count = 'COUNT',
  /** Maximum. */
  Max = 'MAX',
  /** Minimum. */
  Min = 'MIN',
  /** Sum. */
  Sum = 'SUM'
}

/** An organization that uses Zunou. */
export type Organization = {
  __typename?: 'Organization';
  /** Timestamp when the organization was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The description of the organization */
  description?: Maybe<Scalars['String']['output']>;
  /** The domain of the organization */
  domain?: Maybe<Scalars['String']['output']>;
  /** determines if an organization has guest */
  hasGuest?: Maybe<Scalars['Boolean']['output']>;
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** The industry of the organization */
  industry?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  logo?: Maybe<Scalars['String']['output']>;
  /** The metadata of the organization */
  metadata?: Maybe<Metadata>;
  /** Unique organization name. */
  name: Scalars['String']['output'];
  /** The pulses of the organization */
  pulses: PulsePaginator;
  /** The ID of the organization's Slack team */
  slackTeamId?: Maybe<Scalars['String']['output']>;
  /** The status of the organization */
  status: OrganizationStatus;
  /** Status of the organization's Stripe billing subscription */
  subscriptionStatus?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the organization was last updated. */
  updatedAt: Scalars['DateTime']['output'];
  /** The ID of the head staff member in Zunou AI */
  zunouAiStaffId?: Maybe<Scalars['Int']['output']>;
  /** The ID of a user to use in Zunou AI */
  zunouAiUserId?: Maybe<Scalars['Int']['output']>;
};


/** An organization that uses Zunou. */
export type OrganizationPulsesArgs = {
  first?: Scalars['Int']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
};

/** The organization group of a pulse */
export type OrganizationGroup = {
  __typename?: 'OrganizationGroup';
  /** The group created at */
  created_at: Scalars['DateTime']['output'];
  /** The group description */
  description: Scalars['String']['output'];
  /** Unique primary key. */
  id: Scalars['ID']['output'];
  /** The group name */
  name: Scalars['String']['output'];
  /** The associated organization */
  organization: Organization;
  pulse: Pulse;
  /** The list of members */
  pulseMembers?: Maybe<Array<Maybe<GroupMember>>>;
};

export type OrganizationGroupsResult = {
  __typename?: 'OrganizationGroupsResult';
  organizationGroups: Array<OrganizationGroup>;
  unassignedPulseMembers: Array<PulseMember>;
};

export type OrganizationLogo = {
  __typename?: 'OrganizationLogo';
  fileName?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

/** A paginated list of Organization items. */
export type OrganizationPaginator = {
  __typename?: 'OrganizationPaginator';
  /** A list of Organization items. */
  data: Array<Organization>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

/** The status of the organization. */
export enum OrganizationStatus {
  Active = 'ACTIVE',
  OnboardingComplete = 'ONBOARDING_COMPLETE',
  OnboardingDataSources = 'ONBOARDING_DATA_SOURCES',
  OnboardingSlack = 'ONBOARDING_SLACK',
  OnboardingTerms = 'ONBOARDING_TERMS'
}

/** A user of a Zunou organization. */
export type OrganizationUser = {
  __typename?: 'OrganizationUser';
  /** Timestamp when the organization user was created. */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** The department of the user */
  department?: Maybe<Scalars['String']['output']>;
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** Whether this organization user is pinned by the current user */
  isPinned: Scalars['Boolean']['output'];
  /** The job description of the user */
  jobDescription?: Maybe<Scalars['String']['output']>;
  /** The job title of the user */
  jobTitle?: Maybe<Scalars['String']['output']>;
  /** One to one pulse ID */
  one_to_one?: Maybe<Scalars['String']['output']>;
  /** The associated organization */
  organization: Organization;
  /** The ID of the organization */
  organizationId: Scalars['UUID']['output'];
  /** The profile of the user */
  profile?: Maybe<Scalars['String']['output']>;
  /** The responsibilities of the user */
  responsibilities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The role of the user in the organization. */
  role: OrganizationUserRole;
  /** The invite status of the user */
  status: OrganizationUserStatus;
  /** Timestamp when the organization was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The associated user */
  user: User;
  /** The ID of the user */
  userId: Scalars['UUID']['output'];
};

/** A paginated list of OrganizationUser items. */
export type OrganizationUserPaginator = {
  __typename?: 'OrganizationUserPaginator';
  /** A list of OrganizationUser items. */
  data: Array<OrganizationUser>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

/** The role of the user in the organization. */
export enum OrganizationUserRole {
  Guest = 'GUEST',
  Owner = 'OWNER',
  User = 'USER'
}

/** The status of the organization user. */
export enum OrganizationUserStatus {
  Active = 'ACTIVE',
  Invited = 'INVITED'
}

export enum Origin {
  Pulse = 'PULSE',
  Vitals = 'VITALS'
}

export type PaginatedEvents = {
  __typename?: 'PaginatedEvents';
  data: Array<Event>;
  paginatorInfo: PaginatorInfo;
};

export type PaginatedLiveInsights = {
  __typename?: 'PaginatedLiveInsights';
  data: Array<LiveInsightOutbox>;
  paginatorInfo: PaginatorInfo;
};

export type PaginatedNotes = {
  __typename?: 'PaginatedNotes';
  data: Array<Note>;
  paginatorInfo: PaginatorInfo;
};

export type PaginatedNotesInput = {
  /** Filter by content. Accepts SQL LIKE wildcards `%` and `_`. */
  content?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  /** Filter by pinned status */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  /** Filter by title. Accepts SQL LIKE wildcards `%` and `_`. */
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
  /** If true, show all labels including those from personal pulses, even if notes are outside a personal pulse. */
  viewAllLabels?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PaginatorInfo = {
  __typename?: 'PaginatorInfo';
  count: Scalars['Int']['output'];
  currentPage: Scalars['Int']['output'];
  firstItem?: Maybe<Scalars['Int']['output']>;
  hasMorePages: Scalars['Boolean']['output'];
  lastItem?: Maybe<Scalars['Int']['output']>;
  lastPage: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Participant = {
  __typename?: 'Participant';
  email?: Maybe<Scalars['String']['output']>;
  gravatar: Scalars['String']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** Input for pinning an organization user */
export type PinOrganizationUserInput = {
  /** The ID of the organization */
  organizationId: Scalars['ID']['input'];
  /** The ID of the organization user to pin */
  organizationUserId: Scalars['ID']['input'];
};

export type ProvisionPulseInput = {
  /** The dataSources for the pulse */
  dataSources?: InputMaybe<Array<InputMaybe<CreateDataSourceInput>>>;
  /** The members for the pulse */
  members?: InputMaybe<Array<InputMaybe<CreatePulseMemberInput>>>;
  /** The pulse details */
  pulse?: InputMaybe<CreatePulseInput>;
  /** The strategies for the pulse */
  strategies?: InputMaybe<Array<InputMaybe<CreateStrategyInput>>>;
};

export type Pulse = {
  __typename?: 'Pulse';
  category?: Maybe<PulseCategory>;
  created_at?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  features?: Maybe<Array<Scalars['String']['output']>>;
  hasGuest?: Maybe<Scalars['Boolean']['output']>;
  icon?: Maybe<PulseType>;
  id: Scalars['ID']['output'];
  latest_update?: Maybe<Scalars['String']['output']>;
  member_count?: Maybe<Scalars['String']['output']>;
  members: Array<PulseMember>;
  name: Scalars['String']['output'];
  notification_count?: Maybe<Scalars['String']['output']>;
  notifications?: Maybe<Array<Notification>>;
  organization?: Maybe<Organization>;
  saved_message_count?: Maybe<Scalars['String']['output']>;
  status_option?: Maybe<PulseStatusOption>;
  strategies?: Maybe<Array<Strategy>>;
  summary?: Maybe<Scalars['String']['output']>;
  team_thread?: Maybe<TeamThread>;
  threads?: Maybe<Array<Thread>>;
  type: PulseType;
  unread_notifications?: Maybe<Scalars['String']['output']>;
  unread_team_messages: Array<TeamMessage>;
  updated_at?: Maybe<Scalars['DateTime']['output']>;
};

export enum PulseCategory {
  Onetoone = 'ONETOONE',
  Personal = 'PERSONAL',
  Team = 'TEAM'
}

/** The role of the user in the organization. */
export enum PulseGuestRole {
  Admin = 'ADMIN',
  Guest = 'GUEST',
  Staff = 'STAFF'
}

export type PulseMember = {
  __typename?: 'PulseMember';
  created_at?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  job_description?: Maybe<Scalars['String']['output']>;
  last_visited?: Maybe<Scalars['DateTime']['output']>;
  one_to_one?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  organizationUser?: Maybe<OrganizationUser>;
  pulse?: Maybe<Pulse>;
  pulseId: Scalars['ID']['output'];
  responsibilities?: Maybe<Array<Scalars['String']['output']>>;
  role: PulseMemberRole;
  updated_at?: Maybe<Scalars['DateTime']['output']>;
  user: User;
  userId: Scalars['ID']['output'];
};

/** A paginated list of PulseMember items. */
export type PulseMemberPaginator = {
  __typename?: 'PulseMemberPaginator';
  /** A list of PulseMember items. */
  data: Array<PulseMember>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

/** The role of the user in the organization. */
export enum PulseMemberRole {
  Admin = 'ADMIN',
  Guest = 'GUEST',
  Owner = 'OWNER',
  Staff = 'STAFF'
}

/** A paginated list of Pulse items. */
export type PulsePaginator = {
  __typename?: 'PulsePaginator';
  /** A list of Pulse items. */
  data: Array<Pulse>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export enum PulseStatusOption {
  Custom = 'CUSTOM',
  Default = 'DEFAULT'
}

/** Enum representing different types of pulses. */
export enum PulseType {
  Account = 'account',
  Admin = 'admin',
  App = 'app',
  Book = 'book',
  Diversity = 'diversity',
  Finance = 'finance',
  Generic = 'generic',
  Hr = 'hr',
  Linked = 'linked',
  Location = 'location',
  Mcp = 'mcp',
  Note = 'note',
  Ops = 'ops',
  Rocket = 'rocket',
  Sdk = 'sdk',
  Text = 'text'
}

export type PulseWelcomeData = {
  __typename?: 'PulseWelcomeData';
  dataSources: Array<DataSource>;
  lastVisited?: Maybe<Scalars['DateTime']['output']>;
  meetings: Array<Meeting>;
  pulseId: Scalars['ID']['output'];
  sentences: Array<WelcomeSentence>;
  tasks: Array<Task>;
  teamMessages: Array<TeamMessage>;
  userId: Scalars['ID']['output'];
};

/** Indicates what fields are available at the top level of a query operation. */
export type Query = {
  __typename?: 'Query';
  /** Get recommendations for a specific insight. */
  GetInsightRecommendations: Array<LiveInsightRecommendation>;
  /** Find a single actionable by ID. */
  actionable?: Maybe<Actionable>;
  /** List multiple actionables. */
  actionables: Array<Actionable>;
  /** Find a single thread by ID. */
  activeThread?: Maybe<Thread>;
  /** List multiple feed available for a pulse. */
  activities: ActivityPaginator;
  /** List multiple agendas. */
  agendas: Array<Agenda>;
  /** Find a single agent by ID. */
  agent?: Maybe<Agent>;
  /** List multiple agents. */
  agents: AgentPaginator;
  /** Find a single AiAgent by ID. */
  aiAgent?: Maybe<AiAgent>;
  /** Get AiAgents by Pulse ID */
  aiAgents: Array<AiAgent>;
  /** Get attachment by ID */
  attachment: Attachment;
  automationLog: Array<AutomationLog>;
  /** List multiple backgrounds. */
  backgrounds: BackgroundPaginator;
  /** Get a single checklist by ID. */
  checklist?: Maybe<Checklist>;
  /** List multiple checklists. */
  checklists: Array<Checklist>;
  collabs: Array<MeetingSession>;
  companionStatus: Array<MeetingSession>;
  /** Fetch a single contact by ID */
  contact?: Maybe<Contact>;
  /** Fetch all contacts for a user */
  contacts: ContactPaginator;
  /** Find a single data source by ID. */
  dataSource?: Maybe<DataSource>;
  /** List multiple data sources. */
  dataSources: DataSourcePaginator;
  /** Filter datasources by origin */
  dataSourcesByOrigin: DataSourcePaginator;
  directMessages: Array<DirectMessageThread>;
  /** Generate a download link */
  downloadDataSource: DownloadUrl;
  /** Find a single event by ID. */
  event?: Maybe<Event>;
  /** List event instances for a given pulse and organization. */
  eventInstances: Array<EventInstance>;
  /** List events with filters and pagination. */
  events: PaginatedEvents;
  /** The fireflies webhook url, requires pulseId */
  fireFliesWebhookUrl?: Maybe<Scalars['String']['output']>;
  /** Get all events from the user's Google Calendar. */
  googleCalendarEvents: Array<GoogleCalendarEvent>;
  /** Find a single hiatus by ID. */
  hiatus?: Maybe<Hiatus>;
  /** Find a single integration by pulseId and type. */
  integration?: Maybe<Integration>;
  /** fetch user integrations */
  integrations?: Maybe<Array<Integration>>;
  jumpTeamThreadMessage?: Maybe<TeamMessagePaginator>;
  /** List labels for a pulse. If the pulse is personal and belongs to the authenticated user, also include labels used by that user's notes in other pulses. */
  labels: Array<Label>;
  /** Fetch a single insight by id (ownership enforced by policy). */
  liveInsight?: Maybe<LiveInsightOutbox>;
  /** List all available master pulses. */
  masterPulses: MasterPulsePaginator;
  /** Return the current user. */
  me?: Maybe<User>;
  /** Get meeting session by ID */
  meetingSession: MeetingSession;
  /** List multiple meeting session available for a pulse. */
  meetingSessions: Array<MeetingSession>;
  /** fetch user meetings */
  meetings?: Maybe<Array<Meeting>>;
  /** List multiple messages for a thread. */
  messages: MessagePaginator;
  /** Retrieve the top 10 questions asked for the month in a specific organization. */
  monthlyQuestions: Array<MonthlyQuestion>;
  /** List monthly summary data for an organization. */
  monthlySummary: Array<MonthlySummary>;
  /** List monthly time saved data. */
  monthlyTimeSaved: Array<TimeSavedDataPoint>;
  /** List monthly trending topics. */
  monthlyTrendingTopics: Array<TrendingTopic>;
  /** Return the authenticated user's AssemblyAI API key. */
  myAssemblyaiKey?: Maybe<Scalars['String']['output']>;
  /** Your inbox only (defaults to open items: pending/delivered). */
  myLiveInsights: PaginatedLiveInsights;
  /** Return the authenticated user's OpenAI API key. */
  myOpenAiApiKey?: Maybe<Scalars['String']['output']>;
  /** get a single task */
  note: Note;
  /** List all notes. */
  notes: Array<Note>;
  /** Get a single notification by ID. */
  notification: Notification;
  /** List all notification preferences for a user. Defaults to current user if userId is not provided. */
  notificationPreferences: Array<NotificationPreference>;
  /** The public S3 URL for the notification sound. */
  notificationSoundUrl: Scalars['String']['output'];
  /** Find a single organization by ID. */
  organization?: Maybe<Organization>;
  /** Find a single organization group by id */
  organizationGroup?: Maybe<OrganizationGroup>;
  /** List multiple organization groups */
  organizationGroups: OrganizationGroupsResult;
  /** Fetch organization logo */
  organizationLogo?: Maybe<OrganizationLogo>;
  /** List all notifications for an organization */
  organizationNotifications: NotificationPaginator;
  /** Find a single organization user by ID  */
  organizationUser?: Maybe<OrganizationUser>;
  /** List multiple organization users. */
  organizationUsers: OrganizationUserPaginator;
  /** List multiple organizations. */
  organizations: OrganizationPaginator;
  /** List notes with filters and pagination. */
  paginatedNotes: PaginatedNotes;
  pinnedDirectMessages?: Maybe<DirectMessageThreadPaginator>;
  pinnedTeamMessages?: Maybe<TeamMessagePaginator>;
  previousActiveThread?: Maybe<Thread>;
  /** Find Pulse for the given Pulse ID. */
  pulse: Pulse;
  /** A single pulse member by its ID. */
  pulseMember: PulseMember;
  /** List all members for a pulse */
  pulseMembers: PulseMemberPaginator;
  /** List all notifications for a pulse */
  pulseNotifications: Array<Notification>;
  pulseWelcomeData: PulseWelcomeData;
  /** List multiple pulses available for an organization. */
  pulses: Array<Pulse>;
  /** List multiple messages for a reply team thread. */
  replyTeamThreadMessages?: Maybe<ReplyTeamThreadPaginator>;
  /** Find a single saved message by ID. */
  savedMessage?: Maybe<SavedMessage>;
  /** List multiple saved messages */
  savedMessages: SavedMessagePaginator;
  /** Get scheduler scale status */
  schedulerScaleStatus: SchedulerScaleStatus;
  /** scout AI reminders */
  scoutReminders: Scalars['String']['output'];
  searchDirectMessages?: Maybe<DirectMessageThreadPaginator>;
  searchTeamThreadMessages?: Maybe<TeamMessagePaginator>;
  /** Find a single setting by ID. */
  setting?: Maybe<Setting>;
  /** Fetch setting image */
  settingImage?: Maybe<SettingImage>;
  /** Signed Data Source Url */
  signedDataSourceUrl: DataSourceUrl;
  /** Find Slack credentials for the given Slack team ID. */
  slackCredentials: Array<SlackCredential>;
  /** Find a single user by an identifying attribute. */
  slackUser?: Maybe<User>;
  /** List multiple strategies available for a given pulse. */
  strategies: GroupedStrategies;
  /** Find a single summary by ID. */
  summary?: Maybe<Summary>;
  /** get a single task */
  task: Task;
  /** Get a single task phase by ID */
  taskPhase?: Maybe<TaskPhaseType>;
  /** Get all task phases for a pulse */
  taskPhases: Array<TaskPhaseType>;
  /** Get a single task status by ID */
  taskStatus?: Maybe<TaskStatusType>;
  /** Get all task statuses for a pulse or default task statuses. pulseId and defaults are mutually exclusive. */
  taskStatuses: Array<TaskStatusType>;
  /** list multiple tasks for a given entity */
  tasks: Array<Maybe<Task>>;
  /** List multiple messages for a team thread. */
  teamThreadMessages?: Maybe<TeamMessagePaginator>;
  /** Find a single thread by ID. */
  thread?: Maybe<Thread>;
  /** List multiple saved messages for a given thread */
  threadSavedMessages: SavedMessagePaginator;
  /** List multiple threads. */
  threads: ThreadPaginator;
  timesheets: Array<Timesheet>;
  topic?: Maybe<Topic>;
  /** List topics for a team thread. */
  topics?: Maybe<TopicPaginator>;
  /** Find and single transcript */
  transcript?: Maybe<Transcript>;
  unacknowledgedMisalignmentAlerts: MisalignmentAlertPaginator;
  /** Get all unread direct messages for the current user */
  unreadDirectMessages?: Maybe<Array<User>>;
  /** Get all unread team messages for the current user */
  unreadTeamMessages?: Maybe<Array<Pulse>>;
  /** Find a single user by an identifying attribute. */
  user?: Maybe<User>;
  /** Fetch the active time sheet for the logged in user */
  userActiveTimesheet?: Maybe<Timesheet>;
  /** List multiple users. */
  users: UserPaginator;
  /** Validates whether emails belong to Pulse users and returns their associated organizations. */
  validateEmails: Array<ValidatedUser>;
  /** Welcome message endpoint */
  welcomeMessage: Scalars['String']['output'];
  /** List widgets available for a user. */
  widgets: Array<Widget>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryGetInsightRecommendationsArgs = {
  id: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryActionableArgs = {
  actionableId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryActionablesArgs = {
  eventId?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryActiveThreadArgs = {
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  type: ThreadType;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryActivitiesArgs = {
  first?: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
  receiverId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryAgendasArgs = {
  eventId?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryAgentArgs = {
  agentId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryAgentsArgs = {
  first?: Scalars['Int']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryAiAgentArgs = {
  aiAgentId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryAiAgentsArgs = {
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryAttachmentArgs = {
  attachmentId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryAutomationLogArgs = {
  strategyId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryBackgroundsArgs = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  first?: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryChecklistArgs = {
  checklistId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryChecklistsArgs = {
  eventId?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  pulseId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryCollabsArgs = {
  default: Scalars['Boolean']['input'];
  organizationId: Scalars['ID']['input'];
  origin?: InputMaybe<Origin>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryCompanionStatusArgs = {
  organizationId: Scalars['ID']['input'];
  origin?: InputMaybe<Origin>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryContactArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryContactsArgs = {
  first?: Scalars['Int']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryDataSourceArgs = {
  dataSourceId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryDataSourcesArgs = {
  first?: Scalars['Int']['input'];
  is_viewable?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryDataSourcesByOriginArgs = {
  first?: Scalars['Int']['input'];
  meetingName?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  origin: DataSourceOrigin;
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryDirectMessagesArgs = {
  organizationId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryDownloadDataSourceArgs = {
  dataSourceId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryEventArgs = {
  eventId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryEventInstancesArgs = {
  input: EventsInput;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryEventsArgs = {
  input: EventsInput;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryFireFliesWebhookUrlArgs = {
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryGoogleCalendarEventsArgs = {
  dateRange?: InputMaybe<Array<Scalars['Date']['input']>>;
  onDate?: InputMaybe<Scalars['Date']['input']>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryHiatusArgs = {
  hiatusId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryIntegrationArgs = {
  integrationId?: InputMaybe<Scalars['String']['input']>;
  pulseId: Scalars['String']['input'];
  type: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryIntegrationsArgs = {
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryJumpTeamThreadMessageArgs = {
  messageId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
  replyTeamThreadId?: InputMaybe<Scalars['ID']['input']>;
  topicId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryLabelsArgs = {
  pulseId: Scalars['ID']['input'];
  viewAll?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryLiveInsightArgs = {
  id: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMasterPulsesArgs = {
  first?: Scalars['Int']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMeetingSessionArgs = {
  meetingSessionId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMeetingSessionsArgs = {
  dateRange?: InputMaybe<Array<Scalars['Date']['input']>>;
  onDate?: InputMaybe<Scalars['Date']['input']>;
  organizationId: Scalars['String']['input'];
  origin?: InputMaybe<Origin>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MeetingSessionStatus>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMeetingsArgs = {
  added?: InputMaybe<Scalars['Boolean']['input']>;
  ignored?: InputMaybe<Scalars['Boolean']['input']>;
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMessagesArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  first?: Scalars['Int']['input'];
  isSystem?: InputMaybe<Scalars['Boolean']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  threadId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMonthlyQuestionsArgs = {
  month: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMonthlySummaryArgs = {
  month: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMonthlyTimeSavedArgs = {
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMonthlyTrendingTopicsArgs = {
  month: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryMyLiveInsightsArgs = {
  filter?: InputMaybe<LiveInsightsFilter>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryNoteArgs = {
  noteId: Scalars['ID']['input'];
  viewAllLabels?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryNotesArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
  viewAllLabels?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryNotificationArgs = {
  notificationId: Scalars['ID']['input'];
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryNotificationPreferencesArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationArgs = {
  organizationId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationGroupArgs = {
  organizationGroupId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationGroupsArgs = {
  pulseId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationLogoArgs = {
  organizationId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationNotificationsArgs = {
  first?: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationUserArgs = {
  organizationId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationUsersArgs = {
  first?: Scalars['Int']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryOrganizationsArgs = {
  first?: Scalars['Int']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  slackTeamId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPaginatedNotesArgs = {
  input: PaginatedNotesInput;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPinnedDirectMessagesArgs = {
  directMessageThreadId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPinnedTeamMessagesArgs = {
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  teamThreadId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPreviousActiveThreadArgs = {
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPulseArgs = {
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPulseMemberArgs = {
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPulseMembersArgs = {
  first?: Scalars['Int']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPulseNotificationsArgs = {
  pulseId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPulseWelcomeDataArgs = {
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryPulsesArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  type?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryReplyTeamThreadMessagesArgs = {
  input: ReplyTeamThreadPaginationInput;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySavedMessageArgs = {
  savedMessageId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySavedMessagesArgs = {
  first?: Scalars['Int']['input'];
  organizationId?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryScoutRemindersArgs = {
  input: ReminderInput;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySearchDirectMessagesArgs = {
  directMessageThreadId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySearchTeamThreadMessagesArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['ID']['input'];
  query: Scalars['String']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySettingArgs = {
  organizationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySettingImageArgs = {
  settingId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySignedDataSourceUrlArgs = {
  dataSourceId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySlackCredentialsArgs = {
  slackTeamId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySlackUserArgs = {
  organizationId: Scalars['String']['input'];
  slackId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryStrategiesArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  pulseId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QuerySummaryArgs = {
  summaryId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTaskArgs = {
  taskId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTaskPhaseArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTaskPhasesArgs = {
  pulseId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTaskStatusArgs = {
  id: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTaskStatusesArgs = {
  defaults?: InputMaybe<Scalars['Boolean']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTasksArgs = {
  assigneeId?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  entityId?: InputMaybe<Scalars['String']['input']>;
  excludeAssigneeId?: InputMaybe<Scalars['String']['input']>;
  excludePriority?: InputMaybe<TaskPriority>;
  excludeStatus?: InputMaybe<TaskStatus>;
  excludeWithChildren?: InputMaybe<Scalars['Boolean']['input']>;
  isScheduled?: InputMaybe<Scalars['Boolean']['input']>;
  orderBy?: InputMaybe<TaskOrder>;
  organizationId: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  priority?: InputMaybe<TaskPriority>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TaskStatus>;
  type?: InputMaybe<TaskType>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTeamThreadMessagesArgs = {
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryThreadArgs = {
  organizationId: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryThreadSavedMessagesArgs = {
  first?: Scalars['Int']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  threadId?: InputMaybe<Scalars['ID']['input']>;
  userId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryThreadsArgs = {
  first?: Scalars['Int']['input'];
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTimesheetsArgs = {
  date?: InputMaybe<Scalars['Date']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTopicArgs = {
  topicId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTopicsArgs = {
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['ID']['input'];
  type?: InputMaybe<TopicEntityType>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryTranscriptArgs = {
  dataSourceId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryUnacknowledgedMisalignmentAlertsArgs = {
  first?: Scalars['Int']['input'];
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryUnreadDirectMessagesArgs = {
  organizationId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryUnreadTeamMessagesArgs = {
  organizationId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryUserArgs = {
  organizationId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryUserActiveTimesheetArgs = {
  userId: Scalars['ID']['input'];
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryUsersArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  first?: Scalars['Int']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryValidateEmailsArgs = {
  emails: Array<Scalars['String']['input']>;
};


/** Indicates what fields are available at the top level of a query operation. */
export type QueryWidgetsArgs = {
  organizationId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type ReadNotificationInput = {
  notificationId: Scalars['ID']['input'];
};

export type ReadNotificationsInput = {
  notificationIds: Array<Scalars['ID']['input']>;
};

export type RedoMessageInput = {
  messageId: Scalars['String']['input'];
};

export type RefetchIntegrationInput = {
  pulse_id: Scalars['String']['input'];
  type: Scalars['String']['input'];
  user_id: Scalars['String']['input'];
};

/** Input for re-ingesting a meeting session transcript to a target pulse */
export type ReingestMeetingSessionTranscriptInput = {
  meetingSessionId: Scalars['ID']['input'];
  targetPulseId: Scalars['ID']['input'];
};

export type RelatedNote = {
  __typename?: 'RelatedNote';
  id: Scalars['String']['output'];
  similarity_score: Scalars['Float']['output'];
  title: Scalars['String']['output'];
};

export type RelatedTask = {
  __typename?: 'RelatedTask';
  id: Scalars['String']['output'];
  similarity_score: Scalars['Float']['output'];
  status: TaskStatus;
  title: Scalars['String']['output'];
};

export type ReminderInput = {
  context?: InputMaybe<Scalars['String']['input']>;
  dateRangeConsider?: InputMaybe<Array<Scalars['String']['input']>>;
  dateRangeFocus?: InputMaybe<Array<Scalars['String']['input']>>;
  eventsConsider?: InputMaybe<Array<Scalars['String']['input']>>;
  eventsFocus?: InputMaybe<Array<Scalars['String']['input']>>;
  organizationId: Scalars['ID']['input'];
  origin: ReminderRequestOrigin;
  pulseId: Scalars['ID']['input'];
  refresh?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum ReminderRequestOrigin {
  App = 'APP',
  Schedule = 'SCHEDULE'
}

/** Input for removing member from all organization groups. */
export type RemoveOrganizationGroupMemberInput = {
  /** The associated pulse id */
  pulseId: Scalars['ID']['input'];
  /** The associated member id */
  pulseMemberId: Scalars['ID']['input'];
};

/** Reply team thread resource */
export type ReplyTeamThread = {
  __typename?: 'ReplyTeamThread';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  files?: Maybe<Array<File>>;
  groupedReactions: Array<TeamMessageGroupedReaction>;
  id: Scalars['ID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isEdited: Scalars['Boolean']['output'];
  isParentReply: Scalars['Boolean']['output'];
  isPinned: Scalars['Boolean']['output'];
  isRead: Scalars['Boolean']['output'];
  metadata?: Maybe<TeamMessageMetadata>;
  repliedToMessage?: Maybe<TeamMessage>;
  repliedToMessageId?: Maybe<Scalars['ID']['output']>;
  replyTeamThreadId?: Maybe<Scalars['ID']['output']>;
  teamThreadId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['ID']['output'];
};

/** Input for reply team thread messages pagination. */
export type ReplyTeamThreadPaginationInput = {
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['ID']['input'];
  replyTeamThreadId: Scalars['ID']['input'];
};

/** Paginated result of reply team threads */
export type ReplyTeamThreadPaginator = {
  __typename?: 'ReplyTeamThreadPaginator';
  data: Array<ReplyTeamThread>;
  paginatorInfo: PaginatorInfo;
};

/** Input for saving messages. */
export type SaveMessageInput = {
  /** ID of the message to save. */
  messageId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId: Scalars['ID']['input'];
  /** ID of the thread associated to the message. */
  threadId: Scalars['ID']['input'];
};

export type SavedMessage = {
  __typename?: 'SavedMessage';
  created_at: Scalars['DateTime']['output'];
  data: ThreadMessage;
  id: Scalars['ID']['output'];
  messageId: Scalars['ID']['output'];
  thread?: Maybe<Thread>;
  updated_at: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

/** A paginated list of SavedMessage items. */
export type SavedMessagePaginator = {
  __typename?: 'SavedMessagePaginator';
  /** A list of SavedMessage items. */
  data: Array<SavedMessage>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

/** Scheduler scale status summary */
export type SchedulerScaleStatus = {
  __typename?: 'SchedulerScaleStatus';
  active: Scalars['Int']['output'];
  maxInstances: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
  running: Scalars['Int']['output'];
};

export type Setting = {
  __typename?: 'Setting';
  color: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metadata: Metadata;
  mode: SettingMode;
  organizationId: Scalars['ID']['output'];
  theme: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
  weekendDisplay: WeekendDisplay;
};

export type SettingImage = {
  __typename?: 'SettingImage';
  fileName?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export enum SettingMode {
  Color = 'COLOR',
  Image = 'IMAGE'
}

export type SettingsEntryInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

/** Input for signing users into an organization. */
export type SignInUserInput = {
  /** The Auth0 user ID (sub). Optional - will be extracted from JWT token if not provided. */
  auth0UserId?: InputMaybe<Scalars['String']['input']>;
  /** The user's invitation code. */
  inviteCode?: InputMaybe<Scalars['String']['input']>;
  /** The name of the user. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The user's profile picture. */
  picture?: InputMaybe<Scalars['String']['input']>;
  /** The authentication provider (apple or google). Optional - will be detected from token if not provided. */
  provider?: InputMaybe<Scalars['String']['input']>;
};

/** An access token for accessing Slack programatically. */
export type SlackCredential = {
  __typename?: 'SlackCredential';
  /** The ID of the organization that the credentials belong to. */
  organizationId: Scalars['UUID']['output'];
  /** The Slack API access token. */
  slackAccessToken?: Maybe<Scalars['String']['output']>;
};

/** A URI for installing Slack. */
export type SlackInstallUri = {
  __typename?: 'SlackInstallUri';
  /** The URI to use to install the Slack app. */
  uri: Scalars['String']['output'];
};

export type SmartNoteResponse = {
  __typename?: 'SmartNoteResponse';
  labels: Array<Scalars['String']['output']>;
  note: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type SnoozeInsightInput = {
  id: Scalars['ID']['input'];
  remindAt: Scalars['DateTime']['input'];
};

/** Directions for ordering a list of records. */
export enum SortOrder {
  /** Sort records in ascending order. */
  Asc = 'ASC',
  /** Sort records in descending order. */
  Desc = 'DESC'
}

export type Source = {
  id?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<TaskSource>;
};

/** A strategy for a pulse. */
export type Strategy = {
  __typename?: 'Strategy';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  free_text?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  prompt_description?: Maybe<Scalars['String']['output']>;
  pulseId: Scalars['ID']['output'];
  status?: Maybe<Scalars['String']['output']>;
  type: StrategyType;
  updatedAt: Scalars['DateTime']['output'];
};

export type StrategyDescription = {
  __typename?: 'StrategyDescription';
  description: Scalars['String']['output'];
  isSuccess: Scalars['Boolean']['output'];
  prompt_description: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type StrategyDescriptionInput = {
  freeText: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  type: StrategyType;
};

export enum StrategyType {
  Alerts = 'alerts',
  Automations = 'automations',
  Kpis = 'kpis',
  Missions = 'missions'
}

export type Summary = {
  __typename?: 'Summary';
  action_items: Array<Maybe<ActionItem>>;
  attendees: Array<Maybe<Scalars['String']['output']>>;
  data_source_id: Scalars['UUID']['output'];
  date: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  potential_strategies: Array<Maybe<Scalars['String']['output']>>;
  pulse_id: Scalars['UUID']['output'];
  summary: Scalars['String']['output'];
  user_id: Scalars['UUID']['output'];
};

export type SyncSingleEventInput = {
  /** The local event ID to sync from Google Calendar */
  eventId: Scalars['String']['input'];
};

export type SyncSingleEventResponse = {
  __typename?: 'SyncSingleEventResponse';
  /** The updated event data */
  event?: Maybe<Event>;
  /** Success or error message */
  message: Scalars['String']['output'];
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
};

export enum SyncStatus {
  Done = 'DONE',
  Failed = 'FAILED',
  InProgress = 'IN_PROGRESS'
}

export type TAssignee = {
  __typename?: 'TAssignee';
  id?: Maybe<Scalars['UUID']['output']>;
  name: Scalars['String']['output'];
};

/** A Task resource */
export type Task = {
  __typename?: 'Task';
  assignees?: Maybe<Array<Assignee>>;
  category?: Maybe<Category>;
  children?: Maybe<Array<Task>>;
  color?: Maybe<Scalars['String']['output']>;
  completed_children_count?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  dependencies?: Maybe<Array<Task>>;
  dependents?: Maybe<Array<Task>>;
  description?: Maybe<Scalars['String']['output']>;
  due_date?: Maybe<Scalars['String']['output']>;
  entity?: Maybe<Pulse>;
  entity_id: Scalars['ID']['output'];
  entity_type: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  order?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  parent?: Maybe<Task>;
  priority?: Maybe<TaskPriority>;
  progress?: Maybe<Scalars['String']['output']>;
  start_date?: Maybe<Scalars['String']['output']>;
  status?: Maybe<TaskStatus>;
  taskPhase?: Maybe<TaskPhaseType>;
  taskStatus?: Maybe<TaskStatusType>;
  task_number?: Maybe<Scalars['String']['output']>;
  task_phase_id?: Maybe<Scalars['ID']['output']>;
  task_status_id?: Maybe<Scalars['ID']['output']>;
  title: Scalars['String']['output'];
  type?: Maybe<TaskType>;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<User>;
};


/** A Task resource */
export type TaskChildrenArgs = {
  assigneeId?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  priority?: InputMaybe<TaskPriority>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TaskStatus>;
};

export enum TaskEntity {
  Pulse = 'PULSE'
}

export enum TaskOrder {
  AssigneeAsc = 'ASSIGNEE_ASC',
  AssigneeDesc = 'ASSIGNEE_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  DueDateAsc = 'DUE_DATE_ASC',
  DueDateDesc = 'DUE_DATE_DESC',
  PriorityAsc = 'PRIORITY_ASC',
  PriorityDesc = 'PRIORITY_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC',
  TitleAsc = 'TITLE_ASC',
  TitleDesc = 'TITLE_DESC',
  UpdatedAtAsc = 'UPDATED_AT_ASC',
  UpdatedAtDesc = 'UPDATED_AT_DESC'
}

export type TaskOrderInput = {
  order: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  taskId: Scalars['ID']['input'];
};

/** A TaskPhase resource */
export type TaskPhaseType = {
  __typename?: 'TaskPhaseType';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  pulse_id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum TaskPriority {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
  Urgent = 'URGENT'
}

export enum TaskSource {
  Meeting = 'MEETING'
}

export enum TaskStatus {
  Completed = 'COMPLETED',
  Inprogress = 'INPROGRESS',
  Overdue = 'OVERDUE',
  Todo = 'TODO'
}

/** Input for updating task status order */
export type TaskStatusOrderInput = {
  id: Scalars['ID']['input'];
  position: Scalars['Int']['input'];
};

/** A TaskStatus resource */
export type TaskStatusType = {
  __typename?: 'TaskStatusType';
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  position?: Maybe<Scalars['Int']['output']>;
  pulse_id?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export enum TaskType {
  List = 'LIST',
  Milestone = 'MILESTONE',
  Task = 'TASK'
}

/** Team message resource */
export type TeamMessage = {
  __typename?: 'TeamMessage';
  content?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  files?: Maybe<Array<File>>;
  groupedReactions: Array<TeamMessageGroupedReaction>;
  id: Scalars['ID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isEdited: Scalars['Boolean']['output'];
  isParentReply: Scalars['Boolean']['output'];
  isPinned: Scalars['Boolean']['output'];
  isRead: Scalars['Boolean']['output'];
  metadata?: Maybe<TeamMessageMetadata>;
  repliedToMessage?: Maybe<TeamMessage>;
  repliedToMessageId?: Maybe<Scalars['ID']['output']>;
  replyTeamThreadId?: Maybe<Scalars['ID']['output']>;
  teamThreadId: Scalars['ID']['output'];
  topic?: Maybe<Topic>;
  topicId?: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['ID']['output'];
};

export type TeamMessageFileInput = {
  fileKey: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type TeamMessageGroupedReaction = {
  __typename?: 'TeamMessageGroupedReaction';
  count: Scalars['Int']['output'];
  reaction: Scalars['String']['output'];
  users: Array<User>;
};

/** Metadata for a team message */
export type TeamMessageMetadata = {
  __typename?: 'TeamMessageMetadata';
  excerpt?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  type?: Maybe<TeamMessageType>;
};

export type TeamMessageMetadataInput = {
  excerpt?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<TeamMessageType>;
};

/** Paginated result of team messages */
export type TeamMessagePaginator = {
  __typename?: 'TeamMessagePaginator';
  data: Array<TeamMessage>;
  paginatorInfo: PaginatorInfo;
  teamThreadId: Scalars['ID']['output'];
  unreadCount: Scalars['Int']['output'];
};

export type TeamMessageReaction = {
  __typename?: 'TeamMessageReaction';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  reaction: Scalars['String']['output'];
  teamMessageId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['ID']['output'];
};

export enum TeamMessageType {
  Alert = 'ALERT'
}

/** Team thread resource */
export type TeamThread = {
  __typename?: 'TeamThread';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  organizationId: Scalars['ID']['output'];
  pulseId: Scalars['ID']['output'];
  teamMessages?: Maybe<Array<TeamMessage>>;
  topics?: Maybe<Array<Topic>>;
  updatedAt: Scalars['DateTime']['output'];
};

/** An thread started by a user. */
export type Thread = {
  __typename?: 'Thread';
  /** Timestamp when the thread was created. */
  createdAt: Scalars['DateTime']['output'];
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** Set this to the active thread */
  isActive?: Maybe<Scalars['Boolean']['output']>;
  /** Unique thread name. */
  name: Scalars['String']['output'];
  /** ID of the organization that this thread belongs to. */
  organizationId: Scalars['UUID']['output'];
  /** The associated pulse to the thread */
  pulse?: Maybe<Pulse>;
  /** ID of the pulse that this thread belongs to. */
  pulseId?: Maybe<Scalars['UUID']['output']>;
  /** Saved messages in this thread */
  savedMessages?: Maybe<Array<SavedMessage>>;
  /** Type of thread */
  type: Scalars['String']['output'];
  /** Timestamp when the thread was last updated. */
  updatedAt: Scalars['DateTime']['output'];
  /** The user that this thread belongs to. */
  user?: Maybe<User>;
  /** ID of the user that this thread belongs to. */
  userId: Scalars['UUID']['output'];
};

export type ThreadMessage = {
  __typename?: 'ThreadMessage';
  content: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  is_saved?: Maybe<Scalars['Boolean']['output']>;
  organizationId: Scalars['ID']['output'];
  role: Scalars['String']['output'];
  threadId: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
};

/** A paginated list of Thread items. */
export type ThreadPaginator = {
  __typename?: 'ThreadPaginator';
  /** A list of Thread items. */
  data: Array<Thread>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

/** A thread title response. */
export type ThreadTitleResponse = {
  __typename?: 'ThreadTitleResponse';
  title: Scalars['String']['output'];
};

export enum ThreadType {
  Admin = 'admin',
  Guest = 'guest',
  User = 'user'
}

export type TimeSavedDataPoint = {
  __typename?: 'TimeSavedDataPoint';
  month?: Maybe<Scalars['Int']['output']>;
  time?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Timesheet = {
  __typename?: 'Timesheet';
  checked_in_at: Scalars['DateTime']['output'];
  checked_out_at?: Maybe<Scalars['DateTime']['output']>;
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  total?: Maybe<Scalars['Float']['output']>;
  updated_at: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type ToggleDirectMessageReactionInput = {
  directMessageId: Scalars['ID']['input'];
  reaction: Scalars['String']['input'];
};

export type ToggleTeamMessageReactionInput = {
  reaction: Scalars['String']['input'];
  teamMessageId: Scalars['ID']['input'];
};

/** Topic resource */
export type Topic = {
  __typename?: 'Topic';
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  creator?: Maybe<User>;
  id: Scalars['ID']['output'];
  insight?: Maybe<LiveInsightOutbox>;
  messages?: Maybe<Array<Message>>;
  name: Scalars['String']['output'];
  teamMessages?: Maybe<Array<TeamMessage>>;
  teamThread?: Maybe<TeamThread>;
  thread?: Maybe<Thread>;
  /** Number of unread messages in this topic for the current user */
  unreadCount: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum TopicEntityType {
  TeamThread = 'teamThread',
  Thread = 'thread'
}

/** Paginated result of topics */
export type TopicPaginator = {
  __typename?: 'TopicPaginator';
  data: Array<Topic>;
  paginatorInfo: PaginatorInfo;
};

export enum TopicReferenceType {
  Insights = 'insights'
}

/** A Transcript resource */
export type Transcript = {
  __typename?: 'Transcript';
  content: Scalars['String']['output'];
  dataSourceId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  meeting?: Maybe<Meeting>;
  meetingId: Scalars['String']['output'];
  speakers?: Maybe<Scalars['JSON']['output']>;
};

/** Specify if you want to include or exclude trashed results from a query. */
export enum Trashed {
  /** Only return trashed results. */
  Only = 'ONLY',
  /** Return both trashed and non-trashed results. */
  With = 'WITH',
  /** Only return non-trashed results. */
  Without = 'WITHOUT'
}

export type TrendingTopic = {
  __typename?: 'TrendingTopic';
  title?: Maybe<Scalars['String']['output']>;
};

/** Input for unpinning an organization user */
export type UnpinOrganizationUserInput = {
  /** The ID of the organization user to unpin */
  organizationUserId: Scalars['ID']['input'];
};

export type UpdateAiMessageInput = {
  content: Scalars['String']['input'];
  id: Scalars['String']['input'];
};

export type UpdateActionableInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  event_id?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  task_id?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateAgendaInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating agents. */
export type UpdateAgentInput = {
  /** The ID of the agent to update */
  id: Scalars['String']['input'];
  /** The organization that agent belongs to. */
  organizationId: Scalars['String']['input'];
  /** The prompt. */
  prompt?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAiAgentInput = {
  credentials?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  guidelines?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};

export type UpdateAttachmentInput = {
  attachment_id: Scalars['ID']['input'];
  body?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating background */
export type UpdateBackgroundInput = {
  active: Scalars['Boolean']['input'];
  backgroundId: Scalars['ID']['input'];
};

/** Input for updating a checklist. */
export type UpdateChecklistInput = {
  complete?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating collaboration */
export type UpdateCollaborationInput = {
  collaborationId: Scalars['ID']['input'];
  status: CollaborationStatus;
};

export type UpdateContactInput = {
  alt_email?: InputMaybe<Scalars['String']['input']>;
  alt_telephone_number?: InputMaybe<Scalars['String']['input']>;
  contactId: Scalars['ID']['input'];
  details?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<Array<SettingsEntryInput>>;
  telephone_number?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating data sources. */
export type UpdateDataSourceInput = {
  /** A description of the Data Source's contents, and what the data can be used for. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Key of the uploaded file in cloud storage. */
  fileKey?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the data source to update */
  id: Scalars['UUID']['input'];
  /** Indicates whether the data source is visible to users outside the organization. */
  is_viewable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The name of the data source. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The organization that agent belongs to. */
  organizationId: Scalars['String']['input'];
  /** The pulse ID that data source belongs to. */
  pulseId: Scalars['UUID']['input'];
  /** A summary of the Data Source's contents, and what the data can be used for. */
  summary?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDirectMessageInput = {
  content: Scalars['String']['input'];
  directMessageId: Scalars['ID']['input'];
  files?: InputMaybe<Array<DirectMessageFileInput>>;
  organizationId: Scalars['ID']['input'];
};

export type UpdateEventInput = {
  date?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_at?: InputMaybe<Scalars['String']['input']>;
  files?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  guests?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id: Scalars['ID']['input'];
  link?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<EventPriority>;
  start_at?: InputMaybe<Scalars['String']['input']>;
  summary?: InputMaybe<Scalars['String']['input']>;
  sync_with_google_calendar?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateInsightStatusInput = {
  id: Scalars['ID']['input'];
  preventDowngrade?: InputMaybe<Scalars['Boolean']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  status: InsightStatus;
};

/** Input for updating a label. */
export type UpdateLabelInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  pulse_id: Scalars['ID']['input'];
};

/** Input for updating users. */
export type UpdateMeInput = {
  /** The ID of the last organization that the user accessed. */
  lastOrganizationId: Scalars['String']['input'];
  /** The user's name. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Whether the user has completed onboarding. */
  onboarded?: InputMaybe<Scalars['Boolean']['input']>;
  /** The user's presence */
  presence?: InputMaybe<UserPresence>;
  /** The user's Slack ID. */
  slackId?: InputMaybe<Scalars['String']['input']>;
  /** The user's timezone */
  timezone?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating meeting session */
export type UpdateMeetingSessionInput = {
  meetingSessionId: Scalars['ID']['input'];
  status: MeetingSessionStatus;
};

/** Input for updating meeting session invite_pulse */
export type UpdateMeetingSessionInvitePulseInput = {
  invite_pulse: Scalars['Boolean']['input'];
  meetingSessionId: Scalars['ID']['input'];
  recurring_invite?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for updating a note. Works like a PUT request - only provide fields you want to update. */
export type UpdateNoteInput = {
  /** The content of the note */
  content?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the note to update */
  id: Scalars['ID']['input'];
  /** List of label IDs to attach to the note */
  labels?: InputMaybe<Array<Scalars['ID']['input']>>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  /** File attachments to update for the note */
  paths?: InputMaybe<Array<NoteAttachmentInput>>;
  /** Whether the note is pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  /** The title of the note */
  title: Scalars['String']['input'];
};

export type UpdateNotificationStatusInput = {
  notificationId: Scalars['ID']['input'];
  status: NotificationStatus;
};

/** Input for creating organization group. */
export type UpdateOrCreateOrganizationGroupMemberInput = {
  /** The associated member id */
  orderedMemberIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  /** The associated group id */
  organizationGroupId?: InputMaybe<Scalars['ID']['input']>;
  /** The associated pulse id */
  pulseId: Scalars['ID']['input'];
};

/** Input for updating organization group. */
export type UpdateOrganizationGroupInput = {
  /** The group description */
  description: Scalars['String']['input'];
  /** The ID of the organization group to update */
  id: Scalars['ID']['input'];
  /** The group name */
  name: Scalars['String']['input'];
};

/** Input for updating organizations. */
export type UpdateOrganizationInput = {
  /** The description of the organization. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The domain of the organization. */
  domain?: InputMaybe<Scalars['String']['input']>;
  /** The S3 key that the data file was uploaded to. */
  fileKey?: InputMaybe<Scalars['String']['input']>;
  /** The file name of the data source */
  fileName?: InputMaybe<Scalars['String']['input']>;
  /** The industry of the organization. */
  industry?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** The name of the organization. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the organization to update */
  organizationId: Scalars['String']['input'];
  /** The ID of the organization's Slack team */
  slackTeamId?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating ogranizationUser. */
export type UpdateOrganizationUserInput = {
  /** The department of the organization user */
  department?: InputMaybe<Scalars['String']['input']>;
  /** The job description of the organization user */
  jobDescription?: InputMaybe<Scalars['String']['input']>;
  /** The job title of the organization user */
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the ogranizationUser to update */
  organizationUserId: Scalars['String']['input'];
  /** The profile of the organization user */
  profile?: InputMaybe<Scalars['String']['input']>;
  /** The responsibilities or the organization user */
  responsibilities?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** The ID of the user to update */
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateOrganizationUserRoleInput = {
  /** ID of the org associated to the member. */
  organizationId: Scalars['ID']['input'];
  /** The role for the user member. */
  role: OrganizationUserRole;
  /** ID of the user member. */
  userId: Scalars['ID']['input'];
};

export type UpdatePulseInput = {
  /** Description of the pulse. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** icon of the pulse. */
  icon?: InputMaybe<PulseType>;
  /** Name of the pulse. */
  name: Scalars['String']['input'];
  /** ID of the pulse to update. */
  pulseId: Scalars['String']['input'];
  /** Status option of the pulse. */
  status_option?: InputMaybe<PulseStatusOption>;
};

/** Input for updating a pulse member. */
export type UpdatePulseMemberInput = {
  /** Job Description of the member */
  jobDescription: Scalars['String']['input'];
  /** ID of the pulse member */
  pulseMemberId: Scalars['ID']['input'];
  /** Responsibilities of the member */
  responsibilities: Array<Scalars['String']['input']>;
};

/** Input for update a pulse member role. */
export type UpdatePulseMemberRoleInput = {
  /** ID of the organization associated to the member. */
  organizationId: Scalars['ID']['input'];
  /** ID of the pulse associated to the member. */
  pulseId: Scalars['ID']['input'];
  /** The role for the user member. */
  role: PulseMemberRole;
  /** ID of the user member. */
  userId: Scalars['ID']['input'];
};

export type UpdatePulseOrderInput = {
  order: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
};

/** Input for updating a pulse task status */
export type UpdatePulseTaskStatusInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateRecommendationActionInput = {
  changes: Scalars['String']['input'];
  recommendationActionsId: Scalars['ID']['input'];
  type: ActionTypes;
};

export type UpdateSettingInput = {
  color: Scalars['String']['input'];
  /** The S3 key that the data file was uploaded to. */
  fileKey?: InputMaybe<Scalars['String']['input']>;
  /** The file name of the data source */
  fileName?: InputMaybe<Scalars['String']['input']>;
  mode: SettingMode;
  settingId: Scalars['ID']['input'];
  theme: Scalars['String']['input'];
  weekendDisplay?: InputMaybe<WeekendDisplay>;
};

/** Input for updating a pulse strategy. */
export type UpdateStrategyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a task. */
export type UpdateTaskInput = {
  assignees?: InputMaybe<Array<Scalars['ID']['input']>>;
  category_id?: InputMaybe<Scalars['ID']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  dependency_task_ids?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  due_date?: InputMaybe<Scalars['String']['input']>;
  organization_id: Scalars['ID']['input'];
  parent_id?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<TaskPriority>;
  progress?: InputMaybe<Scalars['String']['input']>;
  start_date?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TaskStatus>;
  taskId: Scalars['ID']['input'];
  task_phase_id?: InputMaybe<Scalars['ID']['input']>;
  task_status_id?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

/** Input for updating a task phase */
export type UpdateTaskPhaseInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating the status of a task. */
export type UpdateTaskStatusInput = {
  organization_id: Scalars['ID']['input'];
  status?: InputMaybe<TaskStatus>;
  taskId: Scalars['ID']['input'];
  task_status_id?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating team messages. */
export type UpdateTeamMessageInput = {
  content: Scalars['String']['input'];
  files?: InputMaybe<Array<TeamMessageFileInput>>;
  teamMessageId: Scalars['ID']['input'];
};

/** Input for updating threads. */
export type UpdateThreadInput = {
  /** The ID of the thread to update */
  id: Scalars['String']['input'];
  /** The name of the thread. */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a timesheet */
export type UpdateTimesheetInput = {
  /** The check-in time for the timesheet */
  checked_in_at?: InputMaybe<Scalars['DateTime']['input']>;
  /** The check-out time for the timesheet */
  checked_out_at?: InputMaybe<Scalars['DateTime']['input']>;
  /** The ID of the timesheet to update */
  id: Scalars['ID']['input'];
};

/** Input for updating topics. */
export type UpdateTopicInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  topicId: Scalars['ID']['input'];
};

/** Input for updating user's AssemblyAI API key. */
export type UpdateUserAssemblyaiKeyInput = {
  /** The AssemblyAI API key to set for the user. Can be null to remove the key. */
  assemblyaiKey?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating user's OpenAI API key. */
export type UpdateUserOpenaiApiKeyInput = {
  /** The OpenAI API key to set for the user. Can be null to remove the key. */
  openaiApiKey?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWidgetInput = {
  columns: Scalars['String']['input'];
  name: Scalars['String']['input'];
  widgetId: Scalars['String']['input'];
};

/** Credentials allowing users to upload files */
export type UploadCredentials = {
  __typename?: 'UploadCredentials';
  /** The S3 key that the file will be uploaded to */
  key: Scalars['String']['output'];
  /** A signed URL suitable for uploading files to S3 */
  url: Scalars['String']['output'];
};

/** The type of file being uploaded. */
export enum UploadType {
  Asset = 'ASSET',
  DataSource = 'DATA_SOURCE'
}

/** Account of a person who uses Zunou. */
export type User = {
  __typename?: 'User';
  /** Timestamp when the account was created. */
  createdAt: Scalars['DateTime']['output'];
  /** Timestamp when the user was deleted. */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  directMessageThreads?: Maybe<Array<DirectMessageThread>>;
  /** Unique email address. */
  email: Scalars['String']['output'];
  /** Timestamp when the email was verified. */
  emailVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Timestamp when the user first logged in. */
  firstLoginAt?: Maybe<Scalars['DateTime']['output']>;
  /** Whether the user has linked their Google Calendar */
  google_calendar_linked: Scalars['Boolean']['output'];
  gravatar?: Maybe<Scalars['String']['output']>;
  /** Unique primary key. */
  id: Scalars['UUID']['output'];
  /** The ID of the last organization that the user accessed. */
  lastOrganizationId?: Maybe<Scalars['UUID']['output']>;
  /** Non-unique name. */
  name: Scalars['String']['output'];
  /** Whether the user has completed onboarding. */
  onboarded?: Maybe<Scalars['Boolean']['output']>;
  /** Paginated list of organizations that this user has access to. */
  organizationUsers: OrganizationUserPaginator;
  /** The organizations the user is a part of */
  organizations?: Maybe<Array<Maybe<Organization>>>;
  /** The permissions that are assigned to this user */
  permissions: Array<Scalars['String']['output']>;
  /** The user's profile picture. */
  picture?: Maybe<Scalars['String']['output']>;
  /** The user's presence */
  presence?: Maybe<UserPresence>;
  /** Pulse memberships of the user */
  pulseMemberships: PulseMemberPaginator;
  /** Timestamp when the user requested deletion. */
  requestDeleteAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user's Slack ID. */
  slackId?: Maybe<Scalars['String']['output']>;
  /** User timezone. */
  timezone?: Maybe<Scalars['String']['output']>;
  unread_direct_messages: Array<DirectMessage>;
  /** Timestamp when the account was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};


/** Account of a person who uses Zunou. */
export type UserOrganizationUsersArgs = {
  first?: Scalars['Int']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
};


/** Account of a person who uses Zunou. */
export type UserPulseMembershipsArgs = {
  first?: Scalars['Int']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
};

/** A paginated list of User items. */
export type UserPaginator = {
  __typename?: 'UserPaginator';
  /** A list of User items. */
  data: Array<User>;
  /** Pagination information about the list of items. */
  paginatorInfo: PaginatorInfo;
};

export enum UserPresence {
  Active = 'active',
  Busy = 'busy',
  Hiatus = 'hiatus',
  Offline = 'offline'
}

/** Input for registering user. */
export type UserSignUpInput = {
  /** The email of the user */
  email: Scalars['String']['input'];
  /** The name of the user. */
  name: Scalars['String']['input'];
  /** The password */
  password: Scalars['String']['input'];
};

/** Input for mapping a user to a speaker */
export type UserSpeakerMapInput = {
  speaker: Scalars['String']['input'];
  user_name: Scalars['String']['input'];
};

/** Output for validateEmails query */
export type ValidatedUser = {
  __typename?: 'ValidatedUser';
  email: Scalars['String']['output'];
  organizationIds: Array<Scalars['UUID']['output']>;
  userId: Scalars['UUID']['output'];
};

export type WebPushSubscriptionInput = {
  auth: Scalars['String']['input'];
  contentEncoding?: InputMaybe<Scalars['String']['input']>;
  endpoint: Scalars['String']['input'];
  p256dh: Scalars['String']['input'];
};

export enum WeekendDisplay {
  BlockedOut = 'blocked_out',
  Default = 'default',
  Hidden = 'hidden'
}

export type WelcomeSentence = {
  __typename?: 'WelcomeSentence';
  metadata?: Maybe<WelcomeSentenceMetadata>;
  text: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type WelcomeSentenceMetadata = {
  __typename?: 'WelcomeSentenceMetadata';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Widget = {
  __typename?: 'Widget';
  columns: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  order: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
};

export type WidgetOrderInput = {
  order: Scalars['String']['input'];
  widgetId: Scalars['String']['input'];
};

/** Input for udpating summary */
export type UpdateSummaryOptionsInput = {
  name: Scalars['String']['input'];
  summary: Scalars['String']['input'];
  /** ID of the meeting to create a summary of */
  summaryId: Scalars['String']['input'];
};

export type AgentFragmentFragment = { __typename?: 'Agent', createdAt: string, id: string, name: AgentName, organizationId?: string | null, prompt: string, updatedAt: string } & { ' $fragmentName'?: 'AgentFragmentFragment' };

export type AiAgentFragmentFragment = { __typename?: 'AiAgent', id: string, pulseId: string, organizationId: string, name: string, description?: string | null, guidelines?: string | null, agent_type: AiAgentType, credentials: any, created_at: string, updated_at: string } & { ' $fragmentName'?: 'AiAgentFragmentFragment' };

export type BackgroundFragmentFragment = { __typename?: 'Background', id: string, userId: string, active: boolean, image_url: string, metadata: { __typename?: 'Metadata', fileKey?: string | null, fileName?: string | null } } & { ' $fragmentName'?: 'BackgroundFragmentFragment' };

export type DataSourceFragmentFragment = { __typename?: 'DataSource', createdAt: string, description?: string | null, id: string, is_viewable?: boolean | null, name: string, organizationId: string, status: DataSourceStatus, summary?: string | null, type: DataSourceType, updatedAt: string, origin: DataSourceOrigin, tldr?: string | null, meeting?: { __typename?: 'Meeting', id: string, meetingId: string, title: string, date: string, meetingSession?: { __typename?: 'MeetingSession', id: string, event_id?: string | null, start_at?: string | null, end_at?: string | null } | null } | null, transcript?: { __typename?: 'Transcript', id: string } | null } & { ' $fragmentName'?: 'DataSourceFragmentFragment' };

export type MessageFragmentFragment = { __typename?: 'Message', content?: string | null, createdAt: string, id: string, is_saved?: boolean | null, organizationId: string, role: MessageRole, status: MessageStatus, updatedAt: string, thread_id: string, topic_id?: string | null, savedMessages?: { __typename?: 'SavedMessage', id: string } | null } & { ' $fragmentName'?: 'MessageFragmentFragment' };

export type OrganizationFragmentFragment = { __typename?: 'Organization', createdAt: string, id: string, name: string, slackTeamId?: string | null, status: OrganizationStatus, subscriptionStatus?: string | null, updatedAt: string, zunouAiStaffId?: number | null, zunouAiUserId?: number | null, industry?: Array<string | null> | null, description?: string | null, domain?: string | null, logo?: string | null, metadata?: { __typename?: 'Metadata', fileKey?: string | null, fileName?: string | null } | null, pulses: { __typename?: 'PulsePaginator', data: Array<{ __typename?: 'Pulse', name: string, id: string }> } } & { ' $fragmentName'?: 'OrganizationFragmentFragment' };

export type OrganizationUserFragmentFragment = { __typename?: 'OrganizationUser', createdAt?: string | null, id: string, organizationId: string, role: OrganizationUserRole, status: OrganizationUserStatus, userId: string, updatedAt?: string | null, jobTitle?: string | null, department?: string | null, profile?: string | null, one_to_one?: string | null, isPinned: boolean, organization: { __typename?: 'Organization', name: string, status: OrganizationStatus, subscriptionStatus?: string | null, domain?: string | null, industry?: Array<string | null> | null }, user: { __typename?: 'User', id: string, name: string, presence?: UserPresence | null, gravatar?: string | null } } & { ' $fragmentName'?: 'OrganizationUserFragmentFragment' };

export type PaginatorInfoFragmentFragment = { __typename?: 'PaginatorInfo', count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } & { ' $fragmentName'?: 'PaginatorInfoFragmentFragment' };

export type ThreadFragmentFragment = { __typename?: 'Thread', createdAt: string, id: string, name: string, organizationId: string, updatedAt: string, pulseId?: string | null, type: string } & { ' $fragmentName'?: 'ThreadFragmentFragment' };

export type UserFragmentFragment = { __typename?: 'User', createdAt: string, email: string, emailVerifiedAt?: string | null, id: string, lastOrganizationId?: string | null, name: string, permissions: Array<string>, slackId?: string | null, updatedAt: string, gravatar?: string | null, presence?: UserPresence | null, google_calendar_linked: boolean, timezone?: string | null, firstLoginAt?: string | null, onboarded?: boolean | null, requestDeleteAt?: string | null, organizations?: Array<{ __typename?: 'Organization', id: string, name: string, domain?: string | null, industry?: Array<string | null> | null, description?: string | null, logo?: string | null } | null> | null, pulseMemberships: { __typename?: 'PulseMemberPaginator', data: Array<{ __typename?: 'PulseMember', role: PulseMemberRole, pulse?: { __typename?: 'Pulse', name: string, id: string, organization?: { __typename?: 'Organization', id: string } | null } | null }> } } & { ' $fragmentName'?: 'UserFragmentFragment' };

export type UnacknowledgedMisalignmentFragmentFragment = { __typename?: 'MisalignmentAlert', id: string, violatedValue: string, summary: string, severity: string } & { ' $fragmentName'?: 'UnacknowledgedMisalignmentFragmentFragment' };

export type PulseFragmentFragment = { __typename?: 'Pulse', id: string, icon?: PulseType | null, name: string, type: PulseType, features?: Array<string> | null, description?: string | null, created_at?: string | null, updated_at?: string | null, unread_notifications?: string | null, hasGuest?: boolean | null, member_count?: string | null, saved_message_count?: string | null, notification_count?: string | null, category?: PulseCategory | null, threads?: Array<{ __typename?: 'Thread', id: string, name: string, type: string, isActive?: boolean | null, userId: string }> | null } & { ' $fragmentName'?: 'PulseFragmentFragment' };

export type MasterPulseFragmentFragment = { __typename?: 'MasterPulse', id: string, name: string, type: PulseType, status?: string | null, features?: Array<string> | null, description?: string | null, createdAt: string, updatedAt: string } & { ' $fragmentName'?: 'MasterPulseFragmentFragment' };

export type StrategyFragmentFragment = { __typename?: 'Strategy', id: string, name: string, pulseId: string, organizationId: string, description?: string | null, createdAt: string, updatedAt: string, type: StrategyType } & { ' $fragmentName'?: 'StrategyFragmentFragment' };

export type SavedMessageFragmentFragment = { __typename?: 'SavedMessage', id: string, messageId: string, userId: string, created_at: string, updated_at: string, data: { __typename?: 'ThreadMessage', id: string, content: string, organizationId: string, role: string, threadId: string, userId: string }, thread?: { __typename?: 'Thread', id: string, type: string, pulseId?: string | null, pulse?: { __typename?: 'Pulse', name: string } | null } | null } & { ' $fragmentName'?: 'SavedMessageFragmentFragment' };

export type NotificationFragmentFragment = { __typename?: 'Notification', id: string, created_at: string, updated_at: string, status: NotificationStatus, description: string, kind: NotificationKind, readAt?: string | null, isArchived?: boolean | null, pulse?: { __typename?: 'Pulse', id: string, name: string } | null, summary?: { __typename?: 'Summary', id: string, data_source_id: string, pulse_id: string } | null, context?: { __typename?: 'NotificationContext', taskId?: string | null, summaryId?: string | null } | null, users?: Array<{ __typename?: 'NotificationUser', id?: string | null, name?: string | null } | null> | null } & { ' $fragmentName'?: 'NotificationFragmentFragment' };

export type MeetingFragmentFragment = { __typename?: 'Meeting', id: string, pulseId: string, userId: string, meetingId: string, title: string, date: string, organizer?: string | null, source: string, timezone?: string | null, status: MeetingStatus, dataSourceId?: string | null, meetingSession?: (
    { __typename?: 'MeetingSession' }
    & { ' $fragmentRefs'?: { 'MeetingSessionFragmentFragment': MeetingSessionFragmentFragment } }
  ) | null } & { ' $fragmentName'?: 'MeetingFragmentFragment' };

export type IntegrationFragmentFragment = { __typename?: 'Integration', id: string, pulse_id: string, user_id: string, type: string, api_key: string, sync_status: SyncStatus } & { ' $fragmentName'?: 'IntegrationFragmentFragment' };

export type PulseMemberFragmentFragment = { __typename?: 'PulseMember', id: string, pulseId: string, userId: string, role: PulseMemberRole, job_description?: string | null, responsibilities?: Array<string> | null, created_at?: string | null, updated_at?: string | null, one_to_one?: string | null, user: { __typename?: 'User', id: string, name: string, email: string, presence?: UserPresence | null, gravatar?: string | null }, organizationUser?: { __typename?: 'OrganizationUser', id: string, jobTitle?: string | null, jobDescription?: string | null, responsibilities?: Array<string | null> | null, profile?: string | null, department?: string | null, role: OrganizationUserRole } | null } & { ' $fragmentName'?: 'PulseMemberFragmentFragment' };

export type GroupMemberFragmentFragment = { __typename?: 'GroupMember', id: string, role?: PulseMemberRole | null, order?: string | null, job_description?: string | null, responsibilities?: Array<string> | null, user: { __typename?: 'User', id: string, name: string, email: string, presence?: UserPresence | null, gravatar?: string | null } } & { ' $fragmentName'?: 'GroupMemberFragmentFragment' };

export type SettingFragmentFragment = { __typename?: 'Setting', id: string, userId: string, organizationId: string, theme: string, weekendDisplay: WeekendDisplay, color: string, mode: SettingMode, metadata: { __typename?: 'Metadata', fileKey?: string | null, fileName?: string | null } } & { ' $fragmentName'?: 'SettingFragmentFragment' };

export type SummaryFragmentFragment = { __typename?: 'Summary', id: string, data_source_id: string, summary: string, date: string, name: string, pulse_id: string, attendees: Array<string | null>, potential_strategies: Array<string | null>, user_id: string, action_items: Array<{ __typename?: 'ActionItem', title: string, description?: string | null, status?: string | null, priority?: string | null, due_date?: string | null, is_existing?: boolean | null, assignees?: Array<{ __typename?: 'TAssignee', id?: string | null, name: string } | null> | null } | null> } & { ' $fragmentName'?: 'SummaryFragmentFragment' };

export type StrategyDescriptionFragmentFragment = { __typename?: 'StrategyDescription', title: string, description: string, prompt_description: string, isSuccess: boolean } & { ' $fragmentName'?: 'StrategyDescriptionFragmentFragment' };

export type TaskFragmentFragment = { __typename?: 'Task', id: string, task_number?: string | null, description?: string | null, due_date?: string | null, start_date?: string | null, priority?: TaskPriority | null, status?: TaskStatus | null, task_status_id?: string | null, title: string, type?: TaskType | null, color?: string | null, progress?: string | null, order?: string | null, createdAt: string, updatedAt: string, assignees?: Array<{ __typename?: 'Assignee', id: string, user: { __typename?: 'User', id: string, name: string, gravatar?: string | null } }> | null, parent?: { __typename?: 'Task', id: string } | null, taskStatus?: { __typename?: 'TaskStatusType', id: string, label: string, color?: string | null } | null, dependencies?: Array<{ __typename?: 'Task', id: string, title: string, task_number?: string | null }> | null, dependents?: Array<{ __typename?: 'Task', id: string }> | null, entity?: { __typename?: 'Pulse', id: string, name: string } | null, children?: Array<(
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskChildFragmentFragment': TaskChildFragmentFragment } }
  )> | null, createdBy?: { __typename?: 'User', id: string, name: string } | null, updatedBy?: { __typename?: 'User', id: string, name: string } | null } & { ' $fragmentName'?: 'TaskFragmentFragment' };

export type TaskChildFragmentFragment = { __typename?: 'Task', id: string, description?: string | null, due_date?: string | null, start_date?: string | null, priority?: TaskPriority | null, status?: TaskStatus | null, task_status_id?: string | null, title: string, type?: TaskType | null, color?: string | null, progress?: string | null, order?: string | null, assignees?: Array<{ __typename?: 'Assignee', id: string, user: { __typename?: 'User', id: string, name: string, gravatar?: string | null } }> | null, parent?: { __typename?: 'Task', id: string, title: string } | null, taskStatus?: { __typename?: 'TaskStatusType', id: string, label: string, color?: string | null } | null, dependencies?: Array<{ __typename?: 'Task', id: string }> | null, dependents?: Array<{ __typename?: 'Task', id: string }> | null, entity?: { __typename?: 'Pulse', id: string, name: string } | null } & { ' $fragmentName'?: 'TaskChildFragmentFragment' };

export type WidgetFragmentFragment = { __typename?: 'Widget', id: string, userId: string, organizationId: string, name: string, order: string, columns: string } & { ' $fragmentName'?: 'WidgetFragmentFragment' };

export type OrganizationGroupFragmentFragment = { __typename?: 'OrganizationGroup', id: string, name: string, description: string, created_at: string, pulse: (
    { __typename?: 'Pulse' }
    & { ' $fragmentRefs'?: { 'PulseFragmentFragment': PulseFragmentFragment } }
  ), organization: (
    { __typename?: 'Organization' }
    & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
  ), pulseMembers?: Array<(
    { __typename?: 'GroupMember' }
    & { ' $fragmentRefs'?: { 'GroupMemberFragmentFragment': GroupMemberFragmentFragment } }
  ) | null> | null } & { ' $fragmentName'?: 'OrganizationGroupFragmentFragment' };

export type TranscriptFragmentFragment = { __typename?: 'Transcript', id: string, meetingId: string, content: string, dataSourceId: string, speakers?: any | null, meeting?: (
    { __typename?: 'Meeting' }
    & { ' $fragmentRefs'?: { 'MeetingFragmentFragment': MeetingFragmentFragment } }
  ) | null } & { ' $fragmentName'?: 'TranscriptFragmentFragment' };

export type MeetingSessionFragmentFragment = { __typename?: 'MeetingSession', id: string, meetingId: string, meetingUrl: string, type: MeetingSessionType, status: MeetingSessionStatus, pulseId: string, userId?: string | null, organizationId: string, name?: string | null, description?: string | null, start_at?: string | null, end_at?: string | null, external_attendees?: Array<string | null> | null, invite_pulse: boolean, gcal_meeting_id?: string | null, recurring_invite?: boolean | null, attendees: Array<{ __typename?: 'Attendee', id: string, user: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } } | null>, dataSource?: { __typename?: 'DataSource', id: string } | null } & { ' $fragmentName'?: 'MeetingSessionFragmentFragment' };

export type ActivityFragmentFragment = { __typename?: 'Activity', id: string, description: string, subjectType: string, organizationId: string, pulseId?: string | null, receiverId?: string | null, properties: any, createdAt: string, updatedAt: string, feedType?: FeedType | null, causer: { __typename?: 'User', id: string, name: string, gravatar?: string | null, presence?: UserPresence | null } } & { ' $fragmentName'?: 'ActivityFragmentFragment' };

export type PulseWelcomeDataFragmentFragment = { __typename?: 'PulseWelcomeData', pulseId: string, userId: string, lastVisited?: string | null, dataSources: Array<(
    { __typename?: 'DataSource' }
    & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
  )>, meetings: Array<(
    { __typename?: 'Meeting' }
    & { ' $fragmentRefs'?: { 'MeetingFragmentFragment': MeetingFragmentFragment } }
  )>, tasks: Array<(
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskFragmentFragment': TaskFragmentFragment } }
  )> } & { ' $fragmentName'?: 'PulseWelcomeDataFragmentFragment' };

export type EventFragmentFragment = { __typename?: 'Event', id: string, name: string, date: string, start_at: string, end_at: string, location?: string | null, priority?: EventPriority | null, guests?: any | null, files?: any | null, pulse_id: string, organization_id: string, user_id: string, google_event_id?: string | null, link?: string | null, summary?: string | null, attendees?: Array<{ __typename?: 'Attendee', id: string, user: { __typename?: 'User', name: string, email: string, gravatar?: string | null } } | null> | null, participants: Array<{ __typename?: 'Participant', name?: string | null, email?: string | null, gravatar: string }>, meetingSession?: (
    { __typename?: 'MeetingSession' }
    & { ' $fragmentRefs'?: { 'MeetingSessionFragmentFragment': MeetingSessionFragmentFragment } }
  ) | null, meeting?: { __typename?: 'Meeting', dataSourceId?: string | null } | null } & { ' $fragmentName'?: 'EventFragmentFragment' };

export type EventInstanceFragmentFragment = { __typename?: 'EventInstance', id: string, event_id: string, pulse_id: string, local_description?: string | null, priority?: string | null, created_at?: string | null, updated_at?: string | null, event?: (
    { __typename?: 'Event' }
    & { ' $fragmentRefs'?: { 'EventFragmentFragment': EventFragmentFragment } }
  ) | null, pulse?: { __typename?: 'Pulse', id: string } | null } & { ' $fragmentName'?: 'EventInstanceFragmentFragment' };

export type ActionableFragmentFragment = { __typename?: 'Actionable', id: string, description: string, pulse_id: string, organization_id: string, event_id?: string | null, task_id?: string | null, status?: string | null, created_at: string, updated_at: string } & { ' $fragmentName'?: 'ActionableFragmentFragment' };

export type NotificationPreferenceFragmentFragment = { __typename?: 'NotificationPreference', id: string, scopeType: NotificationPreferenceScopeType, scopeId?: string | null, mode: NotificationPreferenceMode, createdAt: string, updatedAt: string } & { ' $fragmentName'?: 'NotificationPreferenceFragmentFragment' };

export type AcknowledgeMisalignmentAlertMutationVariables = Exact<{
  input: AcknowledgeMisalignmentAlertInput;
}>;


export type AcknowledgeMisalignmentAlertMutation = { __typename?: 'Mutation', acknowledgeMisalignmentAlert: { __typename?: 'MisalignmentAlert', id: string } };

export type AttachGoogleMeetToEventMutationVariables = Exact<{
  eventId: Scalars['ID']['input'];
  invite_pulse?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type AttachGoogleMeetToEventMutation = { __typename?: 'Mutation', attachGoogleMeetToEvent: { __typename?: 'Event', id: string, name: string, start_at: string, end_at: string, meetingSession?: { __typename?: 'MeetingSession', id: string, status: MeetingSessionStatus, invite_pulse: boolean } | null } };

export type CheckInMutationVariables = Exact<{ [key: string]: never; }>;


export type CheckInMutation = { __typename?: 'Mutation', checkIn: { __typename?: 'Timesheet', id: string, userId: string, checked_in_at: string, checked_out_at?: string | null, total?: number | null } };

export type CheckOutMutationVariables = Exact<{ [key: string]: never; }>;


export type CheckOutMutation = { __typename?: 'Mutation', checkOut?: { __typename?: 'Timesheet', id: string, userId: string, checked_in_at: string, checked_out_at?: string | null, total?: number | null } | null };

export type ClearNotificationsMutationVariables = Exact<{
  pulseId: Scalars['String']['input'];
}>;


export type ClearNotificationsMutation = { __typename?: 'Mutation', clearNotifications: boolean };

export type ClearOrganizationNotificationsMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type ClearOrganizationNotificationsMutation = { __typename?: 'Mutation', clearOrganizationNotifications: boolean };

export type ClearTeamMessagesMutationVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type ClearTeamMessagesMutation = { __typename?: 'Mutation', clearTeamMessages: boolean };

export type CompleteMcpAuthorizationMutationVariables = Exact<{
  code: Scalars['String']['input'];
  state: Scalars['String']['input'];
}>;


export type CompleteMcpAuthorizationMutation = { __typename?: 'Mutation', completeMCPAuthorization: { __typename?: 'MCPCallbackResponse', success: boolean, message: string, tokenData?: { __typename?: 'MCPTokenData', mcpUrl: string, accessToken: string, tokenType: string, expiresIn?: number | null, refreshToken?: string | null, scope?: string | null } | null } };

export type CreateAgendaMutationVariables = Exact<{
  input: CreateAgendaInput;
}>;


export type CreateAgendaMutation = { __typename?: 'Mutation', createAgenda: { __typename?: 'Agenda', id: string, name: string, pulse_id: string, organization_id: string, position: number, created_at: string, updated_at: string, event: { __typename?: 'Event', id: string, name: string } } };

export type CreateAgentMutationVariables = Exact<{
  input: CreateAgentInput;
}>;


export type CreateAgentMutation = { __typename?: 'Mutation', createAgent?: (
    { __typename?: 'Agent' }
    & { ' $fragmentRefs'?: { 'AgentFragmentFragment': AgentFragmentFragment } }
  ) | null };

export type CreateAiAgentMutationVariables = Exact<{
  input: CreateAiAgentInput;
}>;


export type CreateAiAgentMutation = { __typename?: 'Mutation', createAiAgent?: (
    { __typename?: 'AiAgent' }
    & { ' $fragmentRefs'?: { 'AiAgentFragmentFragment': AiAgentFragmentFragment } }
  ) | null };

export type CreateAssistantOnboardingMutationVariables = Exact<{
  input: CreateAssistantOnboardingInput;
}>;


export type CreateAssistantOnboardingMutation = { __typename?: 'Mutation', createAssistantOnboarding: { __typename?: 'Thread', id: string } };

export type CreateBackgroundMutationVariables = Exact<{
  input: CreateBackgroundInput;
}>;


export type CreateBackgroundMutation = { __typename?: 'Mutation', createBackground: (
    { __typename?: 'Background' }
    & { ' $fragmentRefs'?: { 'BackgroundFragmentFragment': BackgroundFragmentFragment } }
  ) };

export type CreateChecklistMutationVariables = Exact<{
  input: CreateChecklistInput;
}>;


export type CreateChecklistMutation = { __typename?: 'Mutation', createChecklist: { __typename?: 'Checklist', id: string, name: string, pulse_id: string, organization_id: string, event_id?: string | null, position: number, created_at: string, updated_at: string } };

export type CreateCheckoutSessionMutationVariables = Exact<{
  price_id: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
}>;


export type CreateCheckoutSessionMutation = { __typename?: 'Mutation', createCheckoutSession: { __typename?: 'CheckoutSessionResponse', url: string } };

export type CreateCompletionMutationVariables = Exact<{
  input: CreateCompletionInput;
}>;


export type CreateCompletionMutation = { __typename?: 'Mutation', createCompletion: Array<{ __typename?: 'Message', id: string, content?: string | null, status: MessageStatus }> };

export type CreateDataSourceMutationVariables = Exact<{
  input: CreateDataSourceInput;
}>;


export type CreateDataSourceMutation = { __typename?: 'Mutation', createDataSource?: (
    { __typename?: 'DataSource' }
    & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
  ) | null };

export type CreateDirectMessageMutationVariables = Exact<{
  input: CreateDirectMessageInput;
}>;


export type CreateDirectMessageMutation = { __typename?: 'Mutation', createDirectMessage: { __typename?: 'DirectMessage', id: string, directMessageThreadId: string, content: string, createdAt: string, updatedAt: string, sender: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } } };

export type CreateEventInstanceMutationVariables = Exact<{
  input: CreateEventInstanceInput;
}>;


export type CreateEventInstanceMutation = { __typename?: 'Mutation', createEventInstance: { __typename?: 'EventInstance', id: string, event_id: string, pulse_id: string, local_description?: string | null, priority?: string | null, created_at?: string | null, updated_at?: string | null } };

export type CreateEventMutationVariables = Exact<{
  input: CreateEventInput;
}>;


export type CreateEventMutation = { __typename?: 'Mutation', createEvent: (
    { __typename?: 'Event' }
    & { ' $fragmentRefs'?: { 'EventFragmentFragment': EventFragmentFragment } }
  ) };

export type CreateEventSummaryMutationMutationVariables = Exact<{
  input: CreateEventSummaryInput;
}>;


export type CreateEventSummaryMutationMutation = { __typename?: 'Mutation', createEventSummary: string };

export type CreateIntegrationMutationMutationVariables = Exact<{
  input: CreateIntegrationInput;
}>;


export type CreateIntegrationMutationMutation = { __typename?: 'Mutation', createIntegration: (
    { __typename?: 'Integration' }
    & { ' $fragmentRefs'?: { 'IntegrationFragmentFragment': IntegrationFragmentFragment } }
  ) };

export type CreateInterestMutationMutationVariables = Exact<{
  input: CreateInterestInput;
}>;


export type CreateInterestMutationMutation = { __typename?: 'Mutation', createInterest?: { __typename?: 'Interest', id: string, name: string, email: string, company_name: string, company_size: string, looking_for?: string | null } | null };

export type CreateMeetingDataSourceMutationVariables = Exact<{
  input: CreateMeetingDataSourceInput;
}>;


export type CreateMeetingDataSourceMutation = { __typename?: 'Mutation', createMeetingDataSource: (
    { __typename?: 'DataSource' }
    & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
  ) };

export type CreateMeetingMutationVariables = Exact<{
  input: CreateMeetingInput;
}>;


export type CreateMeetingMutation = { __typename?: 'Mutation', createMeeting: (
    { __typename?: 'Meeting' }
    & { ' $fragmentRefs'?: { 'MeetingFragmentFragment': MeetingFragmentFragment } }
  ) };

export type CreateNoteDataSourceMutationVariables = Exact<{
  input: CreateNoteDataSourceInput;
}>;


export type CreateNoteDataSourceMutation = { __typename?: 'Mutation', createNoteDataSource?: (
    { __typename?: 'DataSource' }
    & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
  ) | null };

export type CreateLabelMutationVariables = Exact<{
  input: CreateLabelInput;
}>;


export type CreateLabelMutation = { __typename?: 'Mutation', createLabel: { __typename?: 'Label', id: string, name: string, color?: string | null } };

export type CreateNoteMutationVariables = Exact<{
  input: CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'Note', id: string, title: string, content?: string | null, pinned: boolean, updatedAt: string, labels?: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null }> | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, entity_type: string, entity_id: string, organization_id: string, pulse_id?: string | null, created_at: string, updated_at: string }> | null } };

export type CreateNotificationMutationVariables = Exact<{
  input: CreateNotificationInput;
}>;


export type CreateNotificationMutation = { __typename?: 'Mutation', createNotification?: { __typename?: 'Notification', id: string, status: NotificationStatus, description: string, kind: NotificationKind } | null };

export type CreateNotificationPreferenceMutationVariables = Exact<{
  input: CreateNotificationPreferenceInput;
}>;


export type CreateNotificationPreferenceMutation = { __typename?: 'Mutation', createNotificationPreference: { __typename?: 'NotificationPreference', id: string, scopeType: NotificationPreferenceScopeType, scopeId?: string | null, mode: NotificationPreferenceMode, createdAt: string, updatedAt: string } };

export type CreateOrganizationGroupMutationVariables = Exact<{
  input: CreateOrganizationGroupInput;
}>;


export type CreateOrganizationGroupMutation = { __typename?: 'Mutation', createOrganizationGroup?: { __typename?: 'OrganizationGroup', id: string, name: string, description: string, pulse: { __typename?: 'Pulse', id: string }, organization: { __typename?: 'Organization', id: string } } | null };

export type CreateOrganizationMutationVariables = Exact<{
  input: CreateOrganizationInput;
}>;


export type CreateOrganizationMutation = { __typename?: 'Mutation', createOrganization?: (
    { __typename?: 'Organization' }
    & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
  ) | null };

export type CreatePulseMemberMutationMutationVariables = Exact<{
  pulseId: Scalars['String']['input'];
  input?: InputMaybe<Array<CreatePulseMemberInput> | CreatePulseMemberInput>;
}>;


export type CreatePulseMemberMutationMutation = { __typename?: 'Mutation', createPulseMember?: Array<(
    { __typename?: 'PulseMember' }
    & { ' $fragmentRefs'?: { 'PulseMemberFragmentFragment': PulseMemberFragmentFragment } }
  )> | null };

export type CreatePulseMutationVariables = Exact<{
  input: ProvisionPulseInput;
}>;


export type CreatePulseMutation = { __typename?: 'Mutation', createPulse: (
    { __typename?: 'Pulse' }
    & { ' $fragmentRefs'?: { 'PulseFragmentFragment': PulseFragmentFragment } }
  ) };

export type CreatePulseTaskStatusMutationVariables = Exact<{
  input: CreatePulseTaskStatusInput;
}>;


export type CreatePulseTaskStatusMutation = { __typename?: 'Mutation', createPulseTaskStatus: { __typename?: 'TaskStatusType', id: string, pulse_id?: string | null, label: string, color?: string | null, position?: number | null, createdAt: string, updatedAt: string } };

export type CreateReplyTeamThreadMutationVariables = Exact<{
  input: CreateReplyTeamThreadInput;
}>;


export type CreateReplyTeamThreadMutation = { __typename?: 'Mutation', createReplyTeamThread?: { __typename?: 'ReplyTeamThread', replyTeamThreadId?: string | null, teamThreadId: string, userId: string, content: string, createdAt: string, updatedAt: string } | null };

export type CreateSettingMutationVariables = Exact<{
  input: CreateSettingInput;
}>;


export type CreateSettingMutation = { __typename?: 'Mutation', createSetting: (
    { __typename?: 'Setting' }
    & { ' $fragmentRefs'?: { 'SettingFragmentFragment': SettingFragmentFragment } }
  ) };

export type CreateSmartAgendaMutationVariables = Exact<{
  input: CreateSmartAgendaInput;
}>;


export type CreateSmartAgendaMutation = { __typename?: 'Mutation', createSmartAgenda: Array<{ __typename?: 'Agenda', id: string, name: string, pulse_id: string, organization_id: string, position: number, created_at: string, updated_at: string, event: { __typename?: 'Event', id: string, name: string } }> };

export type CreateSmartChecklistMutationVariables = Exact<{
  input: CreateSmartChecklistInput;
}>;


export type CreateSmartChecklistMutation = { __typename?: 'Mutation', createSmartChecklist: Array<{ __typename?: 'Checklist', id: string, name: string, pulse_id: string, organization_id: string, event_id?: string | null, position: number, created_at: string, updated_at: string }> };

export type CreateStrategyDescriptionMutationVariables = Exact<{
  input: StrategyDescriptionInput;
}>;


export type CreateStrategyDescriptionMutation = { __typename?: 'Mutation', createStrategyDescription: (
    { __typename?: 'StrategyDescription' }
    & { ' $fragmentRefs'?: { 'StrategyDescriptionFragmentFragment': StrategyDescriptionFragmentFragment } }
  ) };

export type CreateStrategyMutationVariables = Exact<{
  input: CreateStrategyInput;
}>;


export type CreateStrategyMutation = { __typename?: 'Mutation', createStrategy: (
    { __typename?: 'Strategy' }
    & { ' $fragmentRefs'?: { 'StrategyFragmentFragment': StrategyFragmentFragment } }
  ) };

export type CreateSummaryOptionsMutationVariables = Exact<{
  input: CreateSummaryOptionsInput;
}>;


export type CreateSummaryOptionsMutation = { __typename?: 'Mutation', createSummaryOptions: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFragmentFragment': MessageFragmentFragment } }
  ) };

export type CreateTaskMutationVariables = Exact<{
  input: Array<CreateTaskInput> | CreateTaskInput;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: Array<(
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskFragmentFragment': TaskFragmentFragment } }
  ) | null> };

export type CreateTeamMessageMutationVariables = Exact<{
  input: CreateTeamMessageInput;
}>;


export type CreateTeamMessageMutation = { __typename?: 'Mutation', createTeamMessage?: { __typename?: 'TeamMessage', id: string, teamThreadId: string, topicId?: string | null, userId: string, content?: string | null, createdAt: string, updatedAt: string, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null, topic?: { __typename?: 'Topic', id: string, name: string } | null } | null };

export type CreateTeamThreadMutationVariables = Exact<{
  input: CreateTeamThreadInput;
}>;


export type CreateTeamThreadMutation = { __typename?: 'Mutation', createTeamThread?: { __typename?: 'TeamThread', id: string, pulseId: string, organizationId: string, createdAt: string, updatedAt: string } | null };

export type CreateThreadMutationVariables = Exact<{
  input: CreateThreadInput;
}>;


export type CreateThreadMutation = { __typename?: 'Mutation', createThread?: { __typename?: 'Thread', id: string, name: string, type: string, pulseId?: string | null } | null };

export type CreateTopicMutationVariables = Exact<{
  input: CreateTopicInput;
}>;


export type CreateTopicMutation = { __typename?: 'Mutation', createTopic?: { __typename?: 'Topic', id: string, name: string, createdBy: string, createdAt: string, updatedAt: string, creator?: { __typename?: 'User', id: string, name: string } | null, teamThread?: { __typename?: 'TeamThread', id: string } | null, thread?: { __typename?: 'Thread', id: string } | null } | null };

export type CreateWidgetMutationVariables = Exact<{
  input: CreateWidgetInput;
}>;


export type CreateWidgetMutation = { __typename?: 'Mutation', createWidget: (
    { __typename?: 'Widget' }
    & { ' $fragmentRefs'?: { 'WidgetFragmentFragment': WidgetFragmentFragment } }
  ) };

export type DeleteAgendaMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAgendaMutation = { __typename?: 'Mutation', deleteAgenda: { __typename?: 'Agenda', id: string, name: string, pulse_id: string, organization_id: string, position: number, created_at: string, updated_at: string, event: { __typename?: 'Event', id: string, name: string } } };

export type DeleteAiAgentMutationVariables = Exact<{
  aiAgentId: Scalars['String']['input'];
}>;


export type DeleteAiAgentMutation = { __typename?: 'Mutation', deleteAiAgent: (
    { __typename?: 'AiAgent' }
    & { ' $fragmentRefs'?: { 'AiAgentFragmentFragment': AiAgentFragmentFragment } }
  ) };

export type DeleteBackgroundMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteBackgroundMutation = { __typename?: 'Mutation', deleteBackground: { __typename?: 'Background', id: string } };

export type DeleteChecklistMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteChecklistMutation = { __typename?: 'Mutation', deleteChecklist: { __typename?: 'Checklist', id: string, name: string, pulse_id: string, organization_id: string, event_id?: string | null, position: number, created_at: string, updated_at: string } };

export type DeleteDataSourceMutationVariables = Exact<{
  input: DeleteDataSourceInput;
}>;


export type DeleteDataSourceMutation = { __typename?: 'Mutation', deleteDataSource?: (
    { __typename?: 'DataSource' }
    & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
  ) | null };

export type DeleteDirectMessageMutationVariables = Exact<{
  directMessageId: Scalars['ID']['input'];
}>;


export type DeleteDirectMessageMutation = { __typename?: 'Mutation', deleteDirectMessage?: { __typename?: 'DirectMessage', id: string, content: string, createdAt: string, updatedAt: string, isEdited: boolean, deletedAt?: string | null } | null };

export type DeleteIntegrationMutationVariables = Exact<{
  integrationId: Scalars['ID']['input'];
}>;


export type DeleteIntegrationMutation = { __typename?: 'Mutation', deleteIntegration: boolean };

export type DeleteNoteAttachmentMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type DeleteNoteAttachmentMutation = { __typename?: 'Mutation', deleteNoteFileAttachement: boolean };

export type DeleteLabelMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteLabelMutation = { __typename?: 'Mutation', deleteLabel: { __typename?: 'Label', id: string, name: string } };

export type DeleteNoteMutationVariables = Exact<{
  noteId: Scalars['ID']['input'];
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote: { __typename?: 'Note', id: string, title: string, content?: string | null, pinned: boolean, labels?: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null }> | null } };

export type DeleteOrganizationUserMutationVariables = Exact<{
  organizationUserId: Scalars['ID']['input'];
}>;


export type DeleteOrganizationUserMutation = { __typename?: 'Mutation', deleteOrganizationUser: boolean };

export type DeletePulseMemberMutationVariables = Exact<{
  pulseMemberId: Scalars['ID']['input'];
}>;


export type DeletePulseMemberMutation = { __typename?: 'Mutation', deletePulseMember: boolean };

export type DeletePulseMutationVariables = Exact<{
  pulseId: Scalars['String']['input'];
}>;


export type DeletePulseMutation = { __typename?: 'Mutation', deletePulse?: boolean | null };

export type DeletePulseTaskStatusMutationVariables = Exact<{
  input: DeletePulseTaskStatusInput;
}>;


export type DeletePulseTaskStatusMutation = { __typename?: 'Mutation', deletePulseTaskStatus: boolean };

export type DeleteSavedMessageMutationVariables = Exact<{
  savedMessageId: Scalars['String']['input'];
}>;


export type DeleteSavedMessageMutation = { __typename?: 'Mutation', deleteSavedMessage?: boolean | null };

export type DeleteStrategyMutationVariables = Exact<{
  strategyId: Scalars['String']['input'];
}>;


export type DeleteStrategyMutation = { __typename?: 'Mutation', deleteStrategy?: boolean | null };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask?: (
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskFragmentFragment': TaskFragmentFragment } }
  ) | null };

export type DeleteTeamMessageMutationVariables = Exact<{
  input: DeleteTeamMessageInput;
}>;


export type DeleteTeamMessageMutation = { __typename?: 'Mutation', deleteTeamMessage: boolean };

export type DeleteThreadMutationVariables = Exact<{
  input: DeleteThreadInput;
}>;


export type DeleteThreadMutation = { __typename?: 'Mutation', deleteThread: (
    { __typename?: 'Thread' }
    & { ' $fragmentRefs'?: { 'ThreadFragmentFragment': ThreadFragmentFragment } }
  ) };

export type DeleteTopicMutationVariables = Exact<{
  input: DeleteTopicInput;
}>;


export type DeleteTopicMutation = { __typename?: 'Mutation', deleteTopic?: boolean | null };

export type DeleteWidgetMutationVariables = Exact<{
  widgetId: Scalars['ID']['input'];
}>;


export type DeleteWidgetMutation = { __typename?: 'Mutation', deleteWidget: boolean };

export type GetDirectMessageThreadUnreadCountMutationVariables = Exact<{
  input: DirectMessageThreadPaginationInput;
}>;


export type GetDirectMessageThreadUnreadCountMutation = { __typename?: 'Mutation', getOrCreateDirectMessageThread: { __typename?: 'DirectMessageThreadPaginator', threadId: string } };

export type DismissRecommendationActionMutationVariables = Exact<{
  input: DismissRecommendationActionInput;
}>;


export type DismissRecommendationActionMutation = { __typename?: 'Mutation', dismissRecommendationAction: { __typename?: 'ExecutionResult', success: boolean, message?: string | null } };

export type ExecuteInsightRecommendationMutationVariables = Exact<{
  input: ExecuteInsightRecommendationInput;
}>;


export type ExecuteInsightRecommendationMutation = { __typename?: 'Mutation', executeInsightRecommendation: { __typename?: 'ExecutionResult', success: boolean, message?: string | null } };

export type FetchUserCalendarEventsMutationVariables = Exact<{
  input: FetchUserCalendarEventsInput;
}>;


export type FetchUserCalendarEventsMutation = { __typename?: 'Mutation', fetchUserCalendarEvents: { __typename?: 'FetchUserCalendarEventsResponse', success: boolean, message: string } };

export type FetchUserGoogleCalendarSourcedEventsMutationVariables = Exact<{
  input: FetchUserGoogleCalendarSourcedEventsInput;
}>;


export type FetchUserGoogleCalendarSourcedEventsMutation = { __typename?: 'Mutation', fetchUserGoogleCalendarSourcedEvents: { __typename?: 'FetchUserGoogleCalendarSourcedEventsResponse', success: boolean, message: string } };

export type GenerateDataScientistDownloadLinkMutationVariables = Exact<{
  input: GenerateDataScientistDownloadLinkInput;
}>;


export type GenerateDataScientistDownloadLinkMutation = { __typename?: 'Mutation', generateDataScientistDownloadLink?: { __typename?: 'DownloadUrl', url: string } | null };

export type GenerateDataSourceDownloadLinkMutationVariables = Exact<{
  input: GenerateDataSourceDownloadLinkInput;
}>;


export type GenerateDataSourceDownloadLinkMutation = { __typename?: 'Mutation', generateDataSourceDownloadLink?: { __typename?: 'DownloadUrl', url: string } | null };

export type GenerateEntitiesFromTextMutationVariables = Exact<{
  input: GenerateEntitiesFromTextInput;
}>;


export type GenerateEntitiesFromTextMutation = { __typename?: 'Mutation', generateEntitiesFromText: string };

export type GenerateThreadTitleMutationVariables = Exact<{
  input: GenerateThreadTitleInput;
}>;


export type GenerateThreadTitleMutation = { __typename?: 'Mutation', generateThreadTitle?: { __typename?: 'ThreadTitleResponse', title: string } | null };

export type GetActionablesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  eventId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetActionablesQuery = { __typename?: 'Query', actionables: Array<(
    { __typename?: 'Actionable' }
    & { ' $fragmentRefs'?: { 'ActionableFragmentFragment': ActionableFragmentFragment } }
  )> };

export type GetActiveThreadQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  type: ThreadType;
}>;


export type GetActiveThreadQuery = { __typename?: 'Query', activeThread?: (
    { __typename?: 'Thread' }
    & { ' $fragmentRefs'?: { 'ThreadFragmentFragment': ThreadFragmentFragment } }
  ) | null };

export type GetActivitiesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  receiverId: Scalars['String']['input'];
  pulseId?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetActivitiesQuery = { __typename?: 'Query', activities: { __typename?: 'ActivityPaginator', data: Array<(
      { __typename?: 'Activity' }
      & { ' $fragmentRefs'?: { 'ActivityFragmentFragment': ActivityFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetAgentQueryVariables = Exact<{
  agentId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetAgentQuery = { __typename?: 'Query', agent?: (
    { __typename?: 'Agent' }
    & { ' $fragmentRefs'?: { 'AgentFragmentFragment': AgentFragmentFragment } }
  ) | null };

export type GetAgentsQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAgentsQuery = { __typename?: 'Query', agents: { __typename?: 'AgentPaginator', data: Array<(
      { __typename?: 'Agent' }
      & { ' $fragmentRefs'?: { 'AgentFragmentFragment': AgentFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetAiAgentQueryVariables = Exact<{
  aiAgentId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetAiAgentQuery = { __typename?: 'Query', aiAgent?: (
    { __typename?: 'AiAgent' }
    & { ' $fragmentRefs'?: { 'AiAgentFragmentFragment': AiAgentFragmentFragment } }
  ) | null };

export type GetAiAgentsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetAiAgentsQuery = { __typename?: 'Query', aiAgents: Array<(
    { __typename?: 'AiAgent' }
    & { ' $fragmentRefs'?: { 'AiAgentFragmentFragment': AiAgentFragmentFragment } }
  )> };

export type GetAutomationLogQueryVariables = Exact<{
  strategyId: Scalars['String']['input'];
}>;


export type GetAutomationLogQuery = { __typename?: 'Query', automationLog: Array<{ __typename?: 'AutomationLog', id: string, description: string, createdAt: string, updatedAt: string, properties?: { __typename?: 'AutomationRunLog', runAt: string, logs: Array<{ __typename?: 'AutomationLogEntry', level: string, message: string, context?: Array<string> | null }> } | null }> };

export type GetBackgroundsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  active?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetBackgroundsQuery = { __typename?: 'Query', backgrounds: { __typename?: 'BackgroundPaginator', data: Array<(
      { __typename?: 'Background' }
      & { ' $fragmentRefs'?: { 'BackgroundFragmentFragment': BackgroundFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetChecklistsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId?: InputMaybe<Scalars['String']['input']>;
  eventId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetChecklistsQuery = { __typename?: 'Query', checklists: Array<{ __typename?: 'Checklist', id: string, name: string, pulse_id: string, organization_id: string, event_id?: string | null, position: number, created_at: string, updated_at: string, complete: boolean }> };

export type GetCollabsQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  default: Scalars['Boolean']['input'];
  origin?: InputMaybe<Origin>;
}>;


export type GetCollabsQuery = { __typename?: 'Query', collabs: Array<{ __typename?: 'MeetingSession', id: string, meetingId: string, meetingUrl: string, type: MeetingSessionType, status: MeetingSessionStatus, pulseId: string, userId?: string | null, organizationId: string, name?: string | null, description?: string | null, start_at?: string | null, end_at?: string | null, external_attendees?: Array<string | null> | null, invite_pulse: boolean, gcal_meeting_id?: string | null, companion_status?: string | null, meeting_type?: MeetingType | null, attendees: Array<{ __typename?: 'Attendee', id: string, user: { __typename?: 'User', id: string, name: string, gravatar?: string | null } } | null>, pulse?: { __typename?: 'Pulse', name: string } | null }> };

export type GetDataSourceQueryVariables = Exact<{
  dataSourceId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetDataSourceQuery = { __typename?: 'Query', dataSource?: (
    { __typename?: 'DataSource' }
    & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
  ) | null };

export type GetDataSourceUrlQueryVariables = Exact<{
  dataSourceId: Scalars['ID']['input'];
}>;


export type GetDataSourceUrlQuery = { __typename?: 'Query', signedDataSourceUrl: { __typename?: 'DataSourceUrl', mime: string, url: string } };

export type GetDataSourcesByOriginQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  origin: DataSourceOrigin;
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDataSourcesByOriginQuery = { __typename?: 'Query', dataSourcesByOrigin: { __typename?: 'DataSourcePaginator', data: Array<(
      { __typename?: 'DataSource' }
      & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetDataSourcesByOriginWithInfiniteQueryQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  meetingName?: InputMaybe<Scalars['String']['input']>;
  origin: DataSourceOrigin;
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDataSourcesByOriginWithInfiniteQueryQuery = { __typename?: 'Query', dataSourcesByOrigin: { __typename?: 'DataSourcePaginator', data: Array<(
      { __typename?: 'DataSource' }
      & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetDataSourcesQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDataSourcesQuery = { __typename?: 'Query', dataSources: { __typename?: 'DataSourcePaginator', data: Array<(
      { __typename?: 'DataSource' }
      & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetDirectMessagesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type GetDirectMessagesQuery = { __typename?: 'Query', directMessages: Array<{ __typename?: 'DirectMessageThread', id: string, createdAt: string, unreadCount: number, otherParticipant: { __typename?: 'User', id: string, name: string, gravatar?: string | null, presence?: UserPresence | null }, directMessages?: Array<{ __typename?: 'DirectMessage', id: string, content: string, createdAt: string, isRead: boolean, sender: { __typename?: 'User', id: string, name: string, gravatar?: string | null, presence?: UserPresence | null } } | null> | null }> };

export type GetDownloadDataSourceQueryVariables = Exact<{
  dataSourceId: Scalars['String']['input'];
}>;


export type GetDownloadDataSourceQuery = { __typename?: 'Query', downloadDataSource: { __typename?: 'DownloadUrl', url: string } };

export type GetEventQueryVariables = Exact<{
  eventId: Scalars['ID']['input'];
}>;


export type GetEventQuery = { __typename?: 'Query', event?: (
    { __typename?: 'Event', agendas?: Array<{ __typename?: 'Agenda', id: string, name: string, position: number }> | null, meetingSession?: { __typename?: 'MeetingSession', id: string, name?: string | null, meetingUrl: string, start_at?: string | null, end_at?: string | null, status: MeetingSessionStatus, invite_pulse: boolean, companion_status?: string | null, external_attendees?: Array<string | null> | null, attendees: Array<{ __typename?: 'Attendee', id: string, user: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } } | null> } | null }
    & { ' $fragmentRefs'?: { 'EventFragmentFragment': EventFragmentFragment } }
  ) | null };

export type GetEventInstancesQueryVariables = Exact<{
  input: EventsInput;
}>;


export type GetEventInstancesQuery = { __typename?: 'Query', eventInstances: Array<(
    { __typename?: 'EventInstance' }
    & { ' $fragmentRefs'?: { 'EventInstanceFragmentFragment': EventInstanceFragmentFragment } }
  )> };

export type GetEventsQueryVariables = Exact<{
  input: EventsInput;
}>;


export type GetEventsQuery = { __typename?: 'Query', events: { __typename?: 'PaginatedEvents', data: Array<(
      { __typename?: 'Event' }
      & { ' $fragmentRefs'?: { 'EventFragmentFragment': EventFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetFirefliesWebhookUrlQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
}>;


export type GetFirefliesWebhookUrlQuery = { __typename?: 'Query', fireFliesWebhookUrl?: string | null };

export type GetInsightRecommendationsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
}>;


export type GetInsightRecommendationsQuery = { __typename?: 'Query', GetInsightRecommendations: Array<{ __typename?: 'LiveInsightRecommendation', id: string, title: string, summary: string, created_at: string, updated_at: string, is_executed: boolean, execution_result?: string | null, execution_result_data?: any | null, executedBy?: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } | null, actions?: Array<{ __typename?: 'LiveInsightRecommendationAction', id: string, type: ActionTypes, method: ActionMethods, data?: any | null, status: ActionStatus } | null> | null, relatedTasks?: Array<{ __typename?: 'RelatedTask', id: string, title: string, similarity_score: number, status: TaskStatus } | null> | null, relatedNotes?: Array<{ __typename?: 'RelatedNote', id: string, title: string, similarity_score: number } | null> | null }> };

export type GetIntegrationQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  type: Scalars['String']['input'];
}>;


export type GetIntegrationQuery = { __typename?: 'Query', integration?: (
    { __typename?: 'Integration' }
    & { ' $fragmentRefs'?: { 'IntegrationFragmentFragment': IntegrationFragmentFragment } }
  ) | null };

export type GetIntegrationsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetIntegrationsQuery = { __typename?: 'Query', integrations?: Array<(
    { __typename?: 'Integration' }
    & { ' $fragmentRefs'?: { 'IntegrationFragmentFragment': IntegrationFragmentFragment } }
  )> | null };

export type JumpTeamThreadMessageQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
  messageId: Scalars['ID']['input'];
  replyTeamThreadId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type JumpTeamThreadMessageQuery = { __typename?: 'Query', jumpTeamThreadMessage?: { __typename?: 'TeamMessagePaginator', paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, firstItem?: number | null, hasMorePages: boolean, lastItem?: number | null, lastPage: number, perPage: number, total: number }, data: Array<{ __typename?: 'TeamMessage', id: string, teamThreadId: string, topicId?: string | null, userId: string, replyTeamThreadId?: string | null, repliedToMessageId?: string | null, isParentReply: boolean, content?: string | null, createdAt: string, updatedAt: string, isEdited: boolean, isDeleted: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean }> } | null };

export type GetLiveInsightQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
}>;


export type GetLiveInsightQuery = { __typename?: 'Query', liveInsight?: { __typename?: 'LiveInsightOutbox', id: string, item_hash: string, meeting_id: string, pulse_id: string, type: InsightType, topic?: string | null, description?: string | null, explanation?: string | null, user_id: string, delivery_status: InsightStatus, delivered_at?: string | null, read_at?: string | null, closed_at?: string | null, closed_reason?: string | null, created_at: string, updated_at: string, meeting: { __typename?: 'Meeting', id: string, meetingId: string }, pulse: { __typename?: 'Pulse', id: string, name: string }, feedback?: { __typename?: 'LiveInsightOutboxFeedback', id: string, outbox_id: string, rating: number, comment?: string | null } | null, topicThread?: { __typename?: 'Topic', id: string, name: string, thread?: { __typename?: 'Thread', id: string } | null } | null } | null };

export type GetLiveInsightsQueryVariables = Exact<{
  filter?: InputMaybe<LiveInsightsFilter>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetLiveInsightsQuery = { __typename?: 'Query', myLiveInsights: { __typename?: 'PaginatedLiveInsights', data: Array<{ __typename?: 'LiveInsightOutbox', id: string, item_hash: string, topic?: string | null, description?: string | null, type: InsightType, explanation?: string | null, created_at: string, delivery_status: InsightStatus, organization: { __typename?: 'Organization', id: string }, pulse: { __typename?: 'Pulse', id: string }, feedback?: { __typename?: 'LiveInsightOutboxFeedback', id: string, outbox_id: string, rating: number, comment?: string | null } | null, meeting: { __typename?: 'Meeting', id: string, meetingId: string } }>, paginatorInfo: { __typename: 'PaginatorInfo', count: number, currentPage: number, firstItem?: number | null, hasMorePages: boolean, lastItem?: number | null, lastPage: number, perPage: number, total: number } } };

export type GetMasterPulsesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMasterPulsesQuery = { __typename?: 'Query', masterPulses: { __typename?: 'MasterPulsePaginator', data: Array<(
      { __typename?: 'MasterPulse' }
      & { ' $fragmentRefs'?: { 'MasterPulseFragmentFragment': MasterPulseFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetMeetingSessionQueryVariables = Exact<{
  meetingSessionId: Scalars['ID']['input'];
}>;


export type GetMeetingSessionQuery = { __typename?: 'Query', meetingSession: { __typename?: 'MeetingSession', id: string, meetingId: string, meetingUrl: string, name?: string | null, description?: string | null, start_at?: string | null, end_at?: string | null, status: MeetingSessionStatus, type: MeetingSessionType, organizationId: string, invite_pulse: boolean, gcal_meeting_id?: string | null, external_attendees?: Array<string | null> | null, recurring_meeting_id?: string | null, companion_status?: string | null, pulse?: { __typename?: 'Pulse', id: string, name: string } | null, attendees: Array<{ __typename?: 'Attendee', id: string, user: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } } | null>, event?: { __typename?: 'Event', id: string, name: string, date: string, start_at: string, end_at: string, location?: string | null, priority?: EventPriority | null, guests?: any | null, files?: any | null, pulse_id: string, organization_id: string, user_id: string, google_event_id?: string | null, link?: string | null, summary?: string | null, attendees?: Array<{ __typename?: 'Attendee', id: string, user: { __typename?: 'User', name: string, email: string, gravatar?: string | null } } | null> | null, participants: Array<{ __typename?: 'Participant', name?: string | null, email?: string | null, gravatar: string }>, meeting?: { __typename?: 'Meeting', dataSourceId?: string | null } | null } | null } };

export type GetMeetingsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
  added?: InputMaybe<Scalars['Boolean']['input']>;
  ignored?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetMeetingsQuery = { __typename?: 'Query', meetings?: Array<(
    { __typename?: 'Meeting' }
    & { ' $fragmentRefs'?: { 'MeetingFragmentFragment': MeetingFragmentFragment } }
  )> | null };

export type GetMessagesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMessagesQuery = { __typename?: 'Query', messages: { __typename?: 'MessagePaginator', data: Array<(
      { __typename?: 'Message' }
      & { ' $fragmentRefs'?: { 'MessageFragmentFragment': MessageFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetMonthlyQuestionsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetMonthlyQuestionsQuery = { __typename?: 'Query', monthlyQuestions: Array<{ __typename?: 'MonthlyQuestion', question?: string | null }> };

export type GetmonthlySummaryQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetmonthlySummaryQuery = { __typename?: 'Query', monthlySummary: Array<{ __typename?: 'MonthlySummary', title?: string | null, value?: number | null, unit?: string | null, comparisonValue?: number | null, comparison?: string | null }> };

export type GetMonthlyTimeSavedQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetMonthlyTimeSavedQuery = { __typename?: 'Query', monthlyTimeSaved: Array<{ __typename?: 'TimeSavedDataPoint', time?: number | null, month?: number | null, year?: number | null }> };

export type GetMonthlyTrendingTopicsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetMonthlyTrendingTopicsQuery = { __typename?: 'Query', monthlyTrendingTopics: Array<{ __typename?: 'TrendingTopic', title?: string | null }> };

export type GetNoteQueryVariables = Exact<{
  noteId: Scalars['ID']['input'];
}>;


export type GetNoteQuery = { __typename?: 'Query', note: { __typename?: 'Note', id: string, title: string, content?: string | null, pinned: boolean, updatedAt: string, labels?: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null }> | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, entity_type: string, entity_id: string, organization_id: string, pulse_id?: string | null, created_at: string, updated_at: string, url?: string | null, size?: number | null }> | null, dataSource?: { __typename?: 'DataSource', id: string, name: string } | null } };

export type GetLabelsQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
  viewAll?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetLabelsQuery = { __typename?: 'Query', labels: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null }> };

export type GetNotesQueryVariables = Exact<{
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  organizationId: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
  viewAllLabels?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetNotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'Note', id: string, title: string, content?: string | null, pinned: boolean, updatedAt: string, position: string, dataSourceId?: string | null, pulseId?: string | null, labels?: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null, pulse?: { __typename?: 'Pulse', id: string, name: string, icon?: PulseType | null, type: PulseType, unread_notifications?: string | null, notification_count?: string | null, member_count?: string | null, saved_message_count?: string | null, features?: Array<string> | null, description?: string | null, summary?: string | null, created_at?: string | null, updated_at?: string | null, latest_update?: string | null, hasGuest?: boolean | null, category?: PulseCategory | null } | null }> | null, pulse?: { __typename?: 'Pulse', id: string } | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, entity_type: string, entity_id: string, organization_id: string, pulse_id?: string | null, created_at: string, updated_at: string, url?: string | null, size?: number | null }> | null, dataSource?: { __typename?: 'DataSource', id: string, name: string } | null }> };

export type GetNotificationPreferencesQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetNotificationPreferencesQuery = { __typename?: 'Query', notificationPreferences: Array<(
    { __typename?: 'NotificationPreference' }
    & { ' $fragmentRefs'?: { 'NotificationPreferenceFragmentFragment': NotificationPreferenceFragmentFragment } }
  )> };

export type GetOrCreateDirectMessageThreadMutationVariables = Exact<{
  input: DirectMessageThreadPaginationInput;
}>;


export type GetOrCreateDirectMessageThreadMutation = { __typename?: 'Mutation', getOrCreateDirectMessageThread: { __typename?: 'DirectMessageThreadPaginator', threadId: string, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, firstItem?: number | null, hasMorePages: boolean, lastItem?: number | null, lastPage: number, perPage: number, total: number }, data: Array<{ __typename?: 'DirectMessage', id: string, directMessageThreadId: string, content: string, createdAt: string, updatedAt: string, isEdited: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean, repliedToMessageId?: string | null, groupedReactions: Array<{ __typename?: 'DirectMessageGroupedReaction', reaction: string, count: number, users: Array<{ __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null, createdAt: string, updatedAt: string, google_calendar_linked: boolean, onboarded?: boolean | null, picture?: string | null, permissions: Array<string> }> }>, repliedToMessage?: { __typename?: 'DirectMessage', id: string, directMessageThreadId: string, content: string, createdAt: string, updatedAt: string, isEdited: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean, repliedToMessageId?: string | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, size?: number | null, entity_type: string, entity_id: string, pulse_id?: string | null, organization_id: string, created_at: string, updated_at: string, dataSourceId?: string | null, url?: string | null }> | null, sender: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } } | null, sender: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null }, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, size?: number | null, entity_type: string, entity_id: string, pulse_id?: string | null, organization_id: string, created_at: string, updated_at: string, dataSourceId?: string | null, url?: string | null }> | null }> } };

export type OrganizationGroupQueryVariables = Exact<{
  organizationGroupId: Scalars['ID']['input'];
}>;


export type OrganizationGroupQuery = { __typename?: 'Query', organizationGroup?: { __typename?: 'OrganizationGroup', id: string, name: string, description: string, pulseMembers?: Array<{ __typename?: 'GroupMember', id: string, user: { __typename?: 'User', email: string, name: string, gravatar?: string | null, presence?: UserPresence | null } } | null> | null } | null };

export type OrganizationGroupsQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
}>;


export type OrganizationGroupsQuery = { __typename?: 'Query', organizationGroups: { __typename?: 'OrganizationGroupsResult', organizationGroups: Array<(
      { __typename?: 'OrganizationGroup' }
      & { ' $fragmentRefs'?: { 'OrganizationGroupFragmentFragment': OrganizationGroupFragmentFragment } }
    )>, unassignedPulseMembers: Array<(
      { __typename?: 'PulseMember' }
      & { ' $fragmentRefs'?: { 'PulseMemberFragmentFragment': PulseMemberFragmentFragment } }
    )> } };

export type GetOrganizationLogoQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type GetOrganizationLogoQuery = { __typename?: 'Query', organizationLogo?: { __typename?: 'OrganizationLogo', url?: string | null, fileName?: string | null } | null };

export type GetOrganizationQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type GetOrganizationQuery = { __typename?: 'Query', organization?: (
    { __typename?: 'Organization' }
    & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
  ) | null };

export type GetOrganizationUserQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
}>;


export type GetOrganizationUserQuery = { __typename?: 'Query', organizationUser?: (
    { __typename?: 'OrganizationUser' }
    & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
  ) | null };

export type GetOrganizationUsersInfiniteQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetOrganizationUsersInfiniteQuery = { __typename?: 'Query', organizationUsers: { __typename?: 'OrganizationUserPaginator', data: Array<(
      { __typename?: 'OrganizationUser', user: (
        { __typename?: 'User', presence?: UserPresence | null }
        & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
      ) }
      & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetOrganizationUsersQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetOrganizationUsersQuery = { __typename?: 'Query', organizationUsers: { __typename?: 'OrganizationUserPaginator', data: Array<(
      { __typename?: 'OrganizationUser', user: (
        { __typename?: 'User', presence?: UserPresence | null }
        & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
      ) }
      & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetOrganizationsQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  slackTeamId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetOrganizationsQuery = { __typename?: 'Query', organizations: { __typename?: 'OrganizationPaginator', data: Array<(
      { __typename?: 'Organization' }
      & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetPaginatedNotesQueryVariables = Exact<{
  input: PaginatedNotesInput;
}>;


export type GetPaginatedNotesQuery = { __typename?: 'Query', paginatedNotes: { __typename?: 'PaginatedNotes', data: Array<{ __typename?: 'Note', id: string, title: string, content?: string | null, pinned: boolean, updatedAt: string, position: string, dataSourceId?: string | null, pulseId?: string | null, labels?: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null, pulse?: { __typename?: 'Pulse', id: string } | null }> | null, pulse?: { __typename?: 'Pulse', id: string } | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, url?: string | null, size?: number | null }> | null, dataSource?: { __typename?: 'DataSource', id: string, name: string } | null }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, firstItem?: number | null, hasMorePages: boolean, lastItem?: number | null, lastPage: number, perPage: number, total: number } } };

export type PinnedDirectMessagesQueryVariables = Exact<{
  directMessageThreadId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type PinnedDirectMessagesQuery = { __typename?: 'Query', pinnedDirectMessages?: { __typename?: 'DirectMessageThreadPaginator', threadId: string, data: Array<{ __typename?: 'DirectMessage', id: string, directMessageThreadId: string, content: string, createdAt: string, updatedAt: string, isEdited: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean, repliedToMessageId?: string | null, sender: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, firstItem?: number | null, hasMorePages: boolean, lastItem?: number | null, lastPage: number, perPage: number, total: number } } | null };

export type GetPinnedTeamMessagesQueryVariables = Exact<{
  teamThreadId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPinnedTeamMessagesQuery = { __typename?: 'Query', pinnedTeamMessages?: { __typename?: 'TeamMessagePaginator', teamThreadId: string, unreadCount: number, data: Array<{ __typename?: 'TeamMessage', id: string, teamThreadId: string, topicId?: string | null, userId: string, replyTeamThreadId?: string | null, isParentReply: boolean, content?: string | null, createdAt: string, updatedAt: string, isEdited: boolean, isDeleted: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean, metadata?: { __typename?: 'TeamMessageMetadata', excerpt?: string | null, status?: string | null } | null, user?: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, size?: number | null, entity_type: string, entity_id: string, pulse_id?: string | null, organization_id: string, created_at: string, updated_at: string, dataSourceId?: string | null, url?: string | null }> | null, topic?: { __typename?: 'Topic', id: string, name: string } | null }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, hasMorePages: boolean } } | null };

export type GetPreviousActiveThreadQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
}>;


export type GetPreviousActiveThreadQuery = { __typename?: 'Query', previousActiveThread?: (
    { __typename?: 'Thread' }
    & { ' $fragmentRefs'?: { 'ThreadFragmentFragment': ThreadFragmentFragment } }
  ) | null };

export type GetPulseMemberQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
}>;


export type GetPulseMemberQuery = { __typename?: 'Query', pulseMember: (
    { __typename?: 'PulseMember' }
    & { ' $fragmentRefs'?: { 'PulseMemberFragmentFragment': PulseMemberFragmentFragment } }
  ) };

export type GetPulseMembersQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPulseMembersQuery = { __typename?: 'Query', pulseMembers: { __typename?: 'PulseMemberPaginator', data: Array<(
      { __typename?: 'PulseMember' }
      & { ' $fragmentRefs'?: { 'PulseMemberFragmentFragment': PulseMemberFragmentFragment } }
    )> } };

export type GetPulseQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type GetPulseQuery = { __typename?: 'Query', pulse: { __typename?: 'Pulse', id: string, name: string, icon?: PulseType | null, category?: PulseCategory | null, description?: string | null, type: PulseType, status_option?: PulseStatusOption | null, team_thread?: { __typename?: 'TeamThread', id: string } | null, threads?: Array<{ __typename?: 'Thread', id: string, type: string, savedMessages?: Array<{ __typename?: 'SavedMessage', id: string, created_at: string, updated_at: string, data: { __typename?: 'ThreadMessage', content: string, role: string }, thread?: { __typename?: 'Thread', id: string, pulse?: { __typename?: 'Pulse', name: string } | null } | null }> | null }> | null } };

export type GetPulseWelcomeDataQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
}>;


export type GetPulseWelcomeDataQuery = { __typename?: 'Query', pulseWelcomeData: (
    { __typename?: 'PulseWelcomeData' }
    & { ' $fragmentRefs'?: { 'PulseWelcomeDataFragmentFragment': PulseWelcomeDataFragmentFragment } }
  ) };

export type GetPulsesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type GetPulsesQuery = { __typename?: 'Query', pulses: Array<(
    { __typename?: 'Pulse' }
    & { ' $fragmentRefs'?: { 'PulseFragmentFragment': PulseFragmentFragment } }
  )> };

export type GetReplyTeamThreadMessagesQueryVariables = Exact<{
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pulseId: Scalars['ID']['input'];
  replyTeamThreadId: Scalars['ID']['input'];
}>;


export type GetReplyTeamThreadMessagesQuery = { __typename?: 'Query', replyTeamThreadMessages?: { __typename?: 'ReplyTeamThreadPaginator', data: Array<{ __typename?: 'ReplyTeamThread', id: string, userId: string, content: string, createdAt: string, updatedAt: string, isEdited: boolean, isDeleted: boolean, repliedToMessageId?: string | null, deletedAt?: string | null, isParentReply: boolean, teamThreadId: string, isPinned: boolean, user?: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } | null, metadata?: { __typename?: 'TeamMessageMetadata', excerpt?: string | null, type?: TeamMessageType | null } | null, groupedReactions: Array<{ __typename?: 'TeamMessageGroupedReaction', reaction: string, count: number, users: Array<{ __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null, google_calendar_linked: boolean, createdAt: string, onboarded?: boolean | null, picture?: string | null, permissions: Array<string> }> }>, repliedToMessage?: { __typename?: 'TeamMessage', id: string, content?: string | null, isDeleted: boolean, isEdited: boolean, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null } | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, size?: number | null, entity_type: string, entity_id: string, pulse_id?: string | null, organization_id: string, created_at: string, updated_at: string, dataSourceId?: string | null, url?: string | null }> | null }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } } | null };

export type GetSavedMessagesQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  organizationId?: InputMaybe<Scalars['String']['input']>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSavedMessagesQuery = { __typename?: 'Query', savedMessages: { __typename?: 'SavedMessagePaginator', data: Array<(
      { __typename?: 'SavedMessage' }
      & { ' $fragmentRefs'?: { 'SavedMessageFragmentFragment': SavedMessageFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type SchedulerScaleStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type SchedulerScaleStatusQuery = { __typename?: 'Query', schedulerScaleStatus: { __typename?: 'SchedulerScaleStatus', running: number, active: number, pending: number, maxInstances: number } };

export type SettingImageQueryVariables = Exact<{
  settingId: Scalars['ID']['input'];
}>;


export type SettingImageQuery = { __typename?: 'Query', settingImage?: { __typename?: 'SettingImage', url?: string | null, fileName?: string | null } | null };

export type GetSettingQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
}>;


export type GetSettingQuery = { __typename?: 'Query', setting?: (
    { __typename?: 'Setting' }
    & { ' $fragmentRefs'?: { 'SettingFragmentFragment': SettingFragmentFragment } }
  ) | null };

export type GetStrategiesQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
}>;


export type GetStrategiesQuery = { __typename?: 'Query', strategies: { __typename?: 'GroupedStrategies', alerts?: Array<(
      { __typename?: 'Strategy' }
      & { ' $fragmentRefs'?: { 'StrategyFragmentFragment': StrategyFragmentFragment } }
    )> | null, kpis?: Array<(
      { __typename?: 'Strategy' }
      & { ' $fragmentRefs'?: { 'StrategyFragmentFragment': StrategyFragmentFragment } }
    )> | null, automations?: Array<(
      { __typename?: 'Strategy' }
      & { ' $fragmentRefs'?: { 'StrategyFragmentFragment': StrategyFragmentFragment } }
    )> | null, missions?: Array<(
      { __typename?: 'Strategy' }
      & { ' $fragmentRefs'?: { 'StrategyFragmentFragment': StrategyFragmentFragment } }
    )> | null } };

export type GetSummaryQueryVariables = Exact<{
  summaryId: Scalars['String']['input'];
}>;


export type GetSummaryQuery = { __typename?: 'Query', summary?: (
    { __typename?: 'Summary' }
    & { ' $fragmentRefs'?: { 'SummaryFragmentFragment': SummaryFragmentFragment } }
  ) | null };

export type GetTaskQueryVariables = Exact<{
  taskId: Scalars['String']['input'];
}>;


export type GetTaskQuery = { __typename?: 'Query', task: (
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskFragmentFragment': TaskFragmentFragment } }
  ) };

export type GetTaskStatusesQueryVariables = Exact<{
  pulseId?: InputMaybe<Scalars['ID']['input']>;
  defaults?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetTaskStatusesQuery = { __typename?: 'Query', taskStatuses: Array<{ __typename?: 'TaskStatusType', id: string, pulse_id?: string | null, label: string, color?: string | null, position?: number | null, createdAt: string, updatedAt: string }> };

export type GetTasksQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  entityId?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<TaskPriority>;
  status?: InputMaybe<TaskStatus>;
  date?: InputMaybe<Scalars['Date']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
  assigneeId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  excludeStatus?: InputMaybe<TaskStatus>;
  excludePriority?: InputMaybe<TaskPriority>;
  excludeAssigneeId?: InputMaybe<Scalars['String']['input']>;
  excludeWithChildren?: InputMaybe<Scalars['Boolean']['input']>;
  isScheduled?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetTasksQuery = { __typename?: 'Query', tasks: Array<{ __typename?: 'Task', id: string, description?: string | null, due_date?: string | null, start_date?: string | null, priority?: TaskPriority | null, status?: TaskStatus | null, color?: string | null, task_status_id?: string | null, title: string, type?: TaskType | null, task_number?: string | null, order?: string | null, assignees?: Array<{ __typename?: 'Assignee', id: string, user: { __typename?: 'User', id: string, name: string, gravatar?: string | null } }> | null, parent?: { __typename?: 'Task', id: string, title: string } | null, taskStatus?: { __typename?: 'TaskStatusType', id: string, label: string, color?: string | null } | null, entity?: { __typename?: 'Pulse', id: string, name: string } | null, dependencies?: Array<{ __typename?: 'Task', id: string }> | null, dependents?: Array<{ __typename?: 'Task', id: string }> | null, children?: Array<(
      { __typename?: 'Task' }
      & { ' $fragmentRefs'?: { 'TaskChildFragmentFragment': TaskChildFragmentFragment } }
    )> | null } | null> };

export type GetTeamMessagesQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetTeamMessagesQuery = { __typename?: 'Query', teamThreadMessages?: { __typename?: 'TeamMessagePaginator', teamThreadId: string, data: Array<{ __typename?: 'TeamMessage', id: string, userId: string, replyTeamThreadId?: string | null, content?: string | null, createdAt: string, updatedAt: string, isParentReply: boolean, isDeleted: boolean, isEdited: boolean, isPinned: boolean, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null, metadata?: { __typename?: 'TeamMessageMetadata', excerpt?: string | null, status?: string | null } | null, groupedReactions: Array<{ __typename?: 'TeamMessageGroupedReaction', reaction: string, count: number, users: Array<{ __typename?: 'User', id: string, name: string }> }>, repliedToMessage?: { __typename?: 'TeamMessage', id: string, content?: string | null, isDeleted: boolean, isEdited: boolean, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null } | null, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, size?: number | null, entity_type: string, entity_id: string, pulse_id?: string | null, organization_id: string, created_at: string, updated_at: string, dataSourceId?: string | null, url?: string | null }> | null }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } } | null };

export type GetTeamThreadMessagesQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetTeamThreadMessagesQuery = { __typename?: 'Query', teamThreadMessages?: { __typename?: 'TeamMessagePaginator', teamThreadId: string, unreadCount: number, data: Array<{ __typename?: 'TeamMessage', id: string, teamThreadId: string, topicId?: string | null, userId: string, replyTeamThreadId?: string | null, repliedToMessageId?: string | null, isParentReply: boolean, content?: string | null, createdAt: string, updatedAt: string, isEdited: boolean, isDeleted: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean, repliedToMessage?: { __typename?: 'TeamMessage', id: string, content?: string | null, isDeleted: boolean, isEdited: boolean, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null } | null, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null, topic?: { __typename?: 'Topic', id: string, name: string } | null, metadata?: { __typename?: 'TeamMessageMetadata', excerpt?: string | null, status?: string | null, type?: TeamMessageType | null } | null, groupedReactions: Array<{ __typename?: 'TeamMessageGroupedReaction', reaction: string, count: number, users: Array<{ __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null, createdAt: string, picture?: string | null }> }>, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, size?: number | null, entity_type: string, entity_id: string, pulse_id?: string | null, organization_id: string, created_at: string, updated_at: string, dataSourceId?: string | null, url?: string | null }> | null }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } } | null };

export type GetThreadsQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  type?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetThreadsQuery = { __typename?: 'Query', threads: { __typename?: 'ThreadPaginator', data: Array<(
      { __typename?: 'Thread' }
      & { ' $fragmentRefs'?: { 'ThreadFragmentFragment': ThreadFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetTimesheetsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['String']['input']>;
  dateRange?: InputMaybe<DateRangeInput>;
}>;


export type GetTimesheetsQuery = { __typename?: 'Query', timesheets: Array<{ __typename?: 'Timesheet', id: string, checked_in_at: string, checked_out_at?: string | null, total?: number | null, user?: { __typename?: 'User', name: string } | null }> };

export type GetTopicQueryVariables = Exact<{
  topicId: Scalars['ID']['input'];
}>;


export type GetTopicQuery = { __typename?: 'Query', topic?: { __typename?: 'Topic', id: string, name: string, createdBy: string, createdAt: string, updatedAt: string, teamThread?: { __typename?: 'TeamThread', id: string } | null, thread?: { __typename?: 'Thread', id: string } | null, creator?: { __typename?: 'User', id: string, name: string } | null, teamMessages?: Array<{ __typename?: 'TeamMessage', id: string, content?: string | null, createdAt: string, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null }> | null, messages?: Array<{ __typename?: 'Message', id: string, content?: string | null, createdAt: string, role: MessageRole, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null }> | null } | null };

export type GetTopicsQueryQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  type?: InputMaybe<TopicEntityType>;
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTopicsQueryQuery = { __typename?: 'Query', topics?: { __typename?: 'TopicPaginator', data: Array<{ __typename?: 'Topic', id: string, name: string, createdBy: string, createdAt: string, updatedAt: string, unreadCount: number, teamThread?: { __typename?: 'TeamThread', id: string } | null, thread?: { __typename?: 'Thread', id: string } | null, creator?: { __typename?: 'User', id: string, name: string } | null, teamMessages?: Array<{ __typename?: 'TeamMessage', id: string, content?: string | null, createdAt: string, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null }> | null, messages?: Array<{ __typename?: 'Message', id: string, content?: string | null, createdAt: string, role: MessageRole, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null }> | null }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } } | null };

export type GetTranscriptQueryVariables = Exact<{
  dataSourceId: Scalars['ID']['input'];
}>;


export type GetTranscriptQuery = { __typename?: 'Query', transcript?: (
    { __typename?: 'Transcript' }
    & { ' $fragmentRefs'?: { 'TranscriptFragmentFragment': TranscriptFragmentFragment } }
  ) | null };

export type GetUnacknowledgedMisalignmentAlertsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type GetUnacknowledgedMisalignmentAlertsQuery = { __typename?: 'Query', unacknowledgedMisalignmentAlerts: { __typename?: 'MisalignmentAlertPaginator', data: Array<(
      { __typename?: 'MisalignmentAlert' }
      & { ' $fragmentRefs'?: { 'UnacknowledgedMisalignmentFragmentFragment': UnacknowledgedMisalignmentFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetUnreadTeamMessagesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type GetUnreadTeamMessagesQuery = { __typename?: 'Query', unreadTeamMessages?: Array<{ __typename?: 'Pulse', id: string, name: string, unread_team_messages: Array<{ __typename?: 'TeamMessage', id: string, content?: string | null, createdAt: string, user?: { __typename?: 'User', id: string, name: string, picture?: string | null, gravatar?: string | null } | null }> }> | null };

export type GetUsersQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users: { __typename?: 'UserPaginator', data: Array<(
      { __typename?: 'User' }
      & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type GetWidgetsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
}>;


export type GetWidgetsQuery = { __typename?: 'Query', widgets: Array<(
    { __typename?: 'Widget' }
    & { ' $fragmentRefs'?: { 'WidgetFragmentFragment': WidgetFragmentFragment } }
  )> };

export type GiveLiveInsightFeedbackMutationVariables = Exact<{
  input: GiveLiveInsightFeedbackInput;
}>;


export type GiveLiveInsightFeedbackMutation = { __typename?: 'Mutation', giveLiveInsightFeedback: { __typename?: 'LiveInsightOutboxFeedback', id: string, outbox_id: string, user_id: string, rating: number, tags?: any | null, comment?: string | null, created_at?: string | null } };

export type GetGoogleCalendarEventsQueryVariables = Exact<{
  onDate?: InputMaybe<Scalars['Date']['input']>;
  dateRange?: InputMaybe<Array<Scalars['Date']['input']> | Scalars['Date']['input']>;
  pulseId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetGoogleCalendarEventsQuery = { __typename?: 'Query', googleCalendarEvents: Array<{ __typename?: 'GoogleCalendarEvent', id: string, summary: string, description?: string | null, location?: string | null, recurring_meeting_id?: string | null, start: { __typename?: 'GoogleCalendarDateTime', dateTime: string, timeZone: string }, end: { __typename?: 'GoogleCalendarDateTime', dateTime: string, timeZone: string }, attendees?: Array<{ __typename?: 'GoogleCalendarAttendee', email: string, displayName?: string | null, responseStatus: string }> | null, conferenceData?: { __typename?: 'GoogleCalendarConferenceData', entryPoints: Array<{ __typename?: 'GoogleCalendarEntryPoint', entryPointType: string, uri: string }> } | null }> };

export type GoogleCalendarRevokeMutationVariables = Exact<{ [key: string]: never; }>;


export type GoogleCalendarRevokeMutation = { __typename?: 'Mutation', googleCalendarRevoke: { __typename?: 'GoogleCalendarRevokeResponse', success: boolean, message: string } };

export type HumanInTheLoopMutationVariables = Exact<{
  bot_meeting_id: Scalars['String']['input'];
  transcript_id: Scalars['String']['input'];
  maps: Array<UserSpeakerMapInput> | UserSpeakerMapInput;
}>;


export type HumanInTheLoopMutation = { __typename?: 'Mutation', humanInTheLoop: boolean };

export type IgnoreMeetingMutationVariables = Exact<{
  meetingId: Scalars['String']['input'];
}>;


export type IgnoreMeetingMutation = { __typename?: 'Mutation', ignoreMeeting: (
    { __typename?: 'Meeting' }
    & { ' $fragmentRefs'?: { 'MeetingFragmentFragment': MeetingFragmentFragment } }
  ) };

export type InvitePulseGuestMutationVariables = Exact<{
  input: InvitePulseGuestInput;
}>;


export type InvitePulseGuestMutation = { __typename?: 'Mutation', invitePulseGuest: (
    { __typename?: 'User' }
    & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
  ) };

export type InviteUserMutationVariables = Exact<{
  input: Array<InviteUserInput> | InviteUserInput;
}>;


export type InviteUserMutation = { __typename?: 'Mutation', inviteUser?: Array<(
    { __typename?: 'User' }
    & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
  ) | null> | null };

export type LinkGoogleCalendarMutationVariables = Exact<{
  organizationId: Scalars['ID']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
}>;


export type LinkGoogleCalendarMutation = { __typename?: 'Mutation', linkGoogleCalendar: { __typename?: 'GoogleCalendarLinkResponse', success: boolean, message?: string | null } };

export type MarkDirectMessagesAsReadMutationVariables = Exact<{
  threadId: Scalars['ID']['input'];
}>;


export type MarkDirectMessagesAsReadMutation = { __typename?: 'Mutation', markDirectMessagesAsRead: boolean };

export type MarkTeamMessagesAsReadMutationVariables = Exact<{
  threadId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type MarkTeamMessagesAsReadMutation = { __typename?: 'Mutation', markTeamMessagesAsRead: boolean };

export type GetMeetingSessionsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  pulseId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MeetingSessionStatus>;
  onDate?: InputMaybe<Scalars['Date']['input']>;
  dateRange?: InputMaybe<Array<Scalars['Date']['input']> | Scalars['Date']['input']>;
  origin: Origin;
}>;


export type GetMeetingSessionsQuery = { __typename?: 'Query', meetingSessions: Array<{ __typename?: 'MeetingSession', id: string, meetingId: string, meetingUrl: string, name?: string | null, description?: string | null, start_at?: string | null, end_at?: string | null, status: MeetingSessionStatus, type: MeetingSessionType, organizationId: string, invite_pulse: boolean, gcal_meeting_id?: string | null, external_attendees?: Array<string | null> | null, recurring_meeting_id?: string | null, companion_status?: string | null, pulse?: { __typename?: 'Pulse', id: string, name: string } | null, attendees: Array<{ __typename?: 'Attendee', id: string, user: { __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null } } | null>, event?: { __typename?: 'Event', id: string, priority?: EventPriority | null, name: string, date: string, agendas?: Array<{ __typename?: 'Agenda', id: string, name: string, position: number }> | null } | null }> };

export type NotificationSoundUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationSoundUrlQuery = { __typename?: 'Query', notificationSoundUrl: string };

export type OnboardingAgreeToTermsMutationVariables = Exact<{
  input: OnboardingAgreeToTermsInput;
}>;


export type OnboardingAgreeToTermsMutation = { __typename?: 'Mutation', onboardingAgreeToTerms?: (
    { __typename?: 'Organization' }
    & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
  ) | null };

export type OnboardingCompleteMutationVariables = Exact<{
  input: OnboardingCompleteInput;
}>;


export type OnboardingCompleteMutation = { __typename?: 'Mutation', onboardingComplete?: (
    { __typename?: 'Organization' }
    & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
  ) | null };

export type OnboardingConfirmDataSourcesMutationVariables = Exact<{
  input: OnboardingConfirmDataSourcesInput;
}>;


export type OnboardingConfirmDataSourcesMutation = { __typename?: 'Mutation', onboardingConfirmDataSources: { __typename?: 'DataSourcePaginator', data: Array<(
      { __typename?: 'DataSource' }
      & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
    )> } };

export type OnboardingConfirmSlackMutationVariables = Exact<{
  input: OnboardingConfirmSlackInput;
}>;


export type OnboardingConfirmSlackMutation = { __typename?: 'Mutation', onboardingConfirmSlack?: (
    { __typename?: 'Organization' }
    & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
  ) | null };

export type OnboardingGenerateSlackInstallUriMutationVariables = Exact<{
  input: OnboardingGenerateSlackInstallUriInput;
}>;


export type OnboardingGenerateSlackInstallUriMutation = { __typename?: 'Mutation', onboardingGenerateSlackInstallUri: { __typename?: 'SlackInstallUri', uri: string } };

export type OrganizationNotificationsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type OrganizationNotificationsQuery = { __typename?: 'Query', organizationNotifications: { __typename?: 'NotificationPaginator', data: Array<(
      { __typename?: 'Notification' }
      & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
    )>, paginatorInfo: (
      { __typename?: 'PaginatorInfo' }
      & { ' $fragmentRefs'?: { 'PaginatorInfoFragmentFragment': PaginatorInfoFragmentFragment } }
    ) } };

export type PinOrganizationUserMutationVariables = Exact<{
  input: PinOrganizationUserInput;
}>;


export type PinOrganizationUserMutation = { __typename?: 'Mutation', pinOrganizationUser: (
    { __typename?: 'OrganizationUser' }
    & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
  ) };

export type PulseNotificationsQueryVariables = Exact<{
  pulseId: Scalars['String']['input'];
}>;


export type PulseNotificationsQuery = { __typename?: 'Query', pulseNotifications: Array<(
    { __typename?: 'Notification' }
    & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
  )> };

export type ReadNotificationMutationVariables = Exact<{
  input: ReadNotificationInput;
}>;


export type ReadNotificationMutation = { __typename?: 'Mutation', readNotification: { __typename?: 'Notification', id: string } };

export type ReadNotificationsMutationVariables = Exact<{ [key: string]: never; }>;


export type ReadNotificationsMutation = { __typename?: 'Mutation', readNotifications: Array<{ __typename?: 'Notification', id: string }> };

export type RedoMessageMutationVariables = Exact<{
  input: RedoMessageInput;
}>;


export type RedoMessageMutation = { __typename?: 'Mutation', redoMessage: (
    { __typename?: 'Message' }
    & { ' $fragmentRefs'?: { 'MessageFragmentFragment': MessageFragmentFragment } }
  ) };

export type RefetchIntegrationMutationMutationVariables = Exact<{
  input: RefetchIntegrationInput;
}>;


export type RefetchIntegrationMutationMutation = { __typename?: 'Mutation', refetchIntegration: (
    { __typename?: 'Integration' }
    & { ' $fragmentRefs'?: { 'IntegrationFragmentFragment': IntegrationFragmentFragment } }
  ) };

export type SaveMessageMutationVariables = Exact<{
  input: SaveMessageInput;
}>;


export type SaveMessageMutation = { __typename?: 'Mutation', saveMessage: { __typename?: 'SavedMessage', messageId: string, userId: string, data: { __typename?: 'ThreadMessage', id: string, content: string, role: string, threadId: string, userId: string, organizationId: string }, thread?: { __typename?: 'Thread', pulse?: { __typename?: 'Pulse', name: string } | null } | null } };

export type SearchTeamThreadMessagesQueryVariables = Exact<{
  pulseId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
  topicId?: InputMaybe<Scalars['ID']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  order?: InputMaybe<Scalars['String']['input']>;
}>;


export type SearchTeamThreadMessagesQuery = { __typename?: 'Query', searchTeamThreadMessages?: { __typename?: 'TeamMessagePaginator', teamThreadId: string, unreadCount: number, data: Array<{ __typename?: 'TeamMessage', id: string, teamThreadId: string, topicId?: string | null, userId: string, replyTeamThreadId?: string | null, repliedToMessageId?: string | null, isParentReply: boolean, content?: string | null, createdAt: string, updatedAt: string, isEdited: boolean, isDeleted: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean, repliedToMessage?: { __typename?: 'TeamMessage', id: string, content?: string | null, isDeleted: boolean, isEdited: boolean, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null } | null, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null, topic?: { __typename?: 'Topic', id: string, name: string } | null, metadata?: { __typename?: 'TeamMessageMetadata', excerpt?: string | null, status?: string | null } | null, groupedReactions: Array<{ __typename?: 'TeamMessageGroupedReaction', reaction: string, count: number, users: Array<{ __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null, createdAt: string, picture?: string | null }> }>, files?: Array<{ __typename?: 'File', id: string, path: string, file_name?: string | null, type?: string | null, size?: number | null, entity_type: string, entity_id: string, pulse_id?: string | null, organization_id: string, created_at: string, updated_at: string, dataSourceId?: string | null, url?: string | null }> | null }>, paginatorInfo: { __typename?: 'PaginatorInfo', count: number, currentPage: number, hasMorePages: boolean, lastPage: number, perPage: number, total: number } } | null };

export type StartMcpAuthorizationMutationVariables = Exact<{
  mcpServer: McpServer;
  redirectUri?: InputMaybe<Scalars['String']['input']>;
}>;


export type StartMcpAuthorizationMutation = { __typename?: 'Mutation', startMCPAuthorization: { __typename?: 'MCPAuthorizationFlow', authUrl: string, state: string, mcpUrl: string, authServerInfo?: { __typename?: 'MCPAuthServerInfo', authorizationEndpoint: string, tokenEndpoint: string, registrationEndpoint?: string | null, clientId: string, scopesSupported?: Array<string> | null, responseTypesSupported?: Array<string> | null, grantTypesSupported?: Array<string> | null } | null } };

export type ToggleDirectMessageReactionMutationVariables = Exact<{
  input: ToggleDirectMessageReactionInput;
}>;


export type ToggleDirectMessageReactionMutation = { __typename?: 'Mutation', toggleDirectMessageReaction: boolean };

export type ToggleTeamMessageReactionMutationVariables = Exact<{
  input: ToggleTeamMessageReactionInput;
}>;


export type ToggleTeamMessageReactionMutation = { __typename?: 'Mutation', toggleTeamMessageReaction: boolean };

export type UnpinOrganizationUserMutationVariables = Exact<{
  input: UnpinOrganizationUserInput;
}>;


export type UnpinOrganizationUserMutation = { __typename?: 'Mutation', unpinOrganizationUser: (
    { __typename?: 'OrganizationUser' }
    & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
  ) };

export type UnreadDirectMessagesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type UnreadDirectMessagesQuery = { __typename?: 'Query', unreadDirectMessages?: Array<{ __typename?: 'User', id: string, name: string, email: string, gravatar?: string | null, presence?: UserPresence | null, directMessageThreads?: Array<{ __typename?: 'DirectMessageThread', id: string, organizationId: string, unreadCount: number }> | null, unread_direct_messages: Array<{ __typename?: 'DirectMessage', id: string, directMessageThreadId: string, content: string, createdAt: string, isRead: boolean }> }> | null };

export type UnreadTeamMessagesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type UnreadTeamMessagesQuery = { __typename?: 'Query', unreadTeamMessages?: Array<{ __typename?: 'Pulse', id: string, name: string, description?: string | null, created_at?: string | null, updated_at?: string | null, category?: PulseCategory | null, unread_team_messages: Array<{ __typename?: 'TeamMessage', id: string }> }> | null };

export type UpdateActiveThreadMutationVariables = Exact<{
  threadId: Scalars['String']['input'];
}>;


export type UpdateActiveThreadMutation = { __typename?: 'Mutation', updateActiveThread: (
    { __typename?: 'Thread' }
    & { ' $fragmentRefs'?: { 'ThreadFragmentFragment': ThreadFragmentFragment } }
  ) };

export type UpdateAgendaMutationVariables = Exact<{
  input: UpdateAgendaInput;
}>;


export type UpdateAgendaMutation = { __typename?: 'Mutation', updateAgenda: { __typename?: 'Agenda', id: string, name: string, pulse_id: string, organization_id: string, position: number, created_at: string, updated_at: string, event: { __typename?: 'Event', id: string, name: string } } };

export type UpdateAgendaOrderMutationVariables = Exact<{
  input: Array<AgendaOrderInput> | AgendaOrderInput;
}>;


export type UpdateAgendaOrderMutation = { __typename?: 'Mutation', updateAgendaOrder: Array<{ __typename?: 'Agenda', id: string, name: string, pulse_id: string, organization_id: string, position: number, created_at: string, updated_at: string, event: { __typename?: 'Event', id: string, name: string } }> };

export type UpdateAgentMutationVariables = Exact<{
  input: UpdateAgentInput;
}>;


export type UpdateAgentMutation = { __typename?: 'Mutation', updateAgent?: (
    { __typename?: 'Agent' }
    & { ' $fragmentRefs'?: { 'AgentFragmentFragment': AgentFragmentFragment } }
  ) | null };

export type UpdateAiAgentMutationVariables = Exact<{
  input: UpdateAiAgentInput;
}>;


export type UpdateAiAgentMutation = { __typename?: 'Mutation', updateAiAgent: (
    { __typename?: 'AiAgent' }
    & { ' $fragmentRefs'?: { 'AiAgentFragmentFragment': AiAgentFragmentFragment } }
  ) };

export type UpdateBackgroundMutationVariables = Exact<{
  input: UpdateBackgroundInput;
}>;


export type UpdateBackgroundMutation = { __typename?: 'Mutation', updateBackground: (
    { __typename?: 'Background' }
    & { ' $fragmentRefs'?: { 'BackgroundFragmentFragment': BackgroundFragmentFragment } }
  ) };

export type UpdateChecklistMutationVariables = Exact<{
  input: UpdateChecklistInput;
}>;


export type UpdateChecklistMutation = { __typename?: 'Mutation', updateChecklist: { __typename?: 'Checklist', id: string, name: string, pulse_id: string, organization_id: string, event_id?: string | null, position: number, created_at: string, updated_at: string } };

export type UpdateChecklistOrderMutationVariables = Exact<{
  input: Array<ChecklistOrderInput> | ChecklistOrderInput;
}>;


export type UpdateChecklistOrderMutation = { __typename?: 'Mutation', updateChecklistOrder: Array<{ __typename?: 'Checklist', id: string, name: string, pulse_id: string, organization_id: string, event_id?: string | null, position: number, created_at: string, updated_at: string }> };

export type UpdateDataSourceMutationVariables = Exact<{
  input: UpdateDataSourceInput;
}>;


export type UpdateDataSourceMutation = { __typename?: 'Mutation', updateDataSource?: (
    { __typename?: 'DataSource' }
    & { ' $fragmentRefs'?: { 'DataSourceFragmentFragment': DataSourceFragmentFragment } }
  ) | null };

export type UpdateDirectMessageMutationVariables = Exact<{
  input: UpdateDirectMessageInput;
}>;


export type UpdateDirectMessageMutation = { __typename?: 'Mutation', updateDirectMessage?: { __typename?: 'DirectMessage', id: string, content: string, createdAt: string, updatedAt: string } | null };

export type UpdateEventMutationVariables = Exact<{
  input: UpdateEventInput;
}>;


export type UpdateEventMutation = { __typename?: 'Mutation', updateEvent: { __typename?: 'Event', id: string, organization_id: string, pulse_id: string } };

export type MarkLiveInsightClosedMutationVariables = Exact<{
  input: MarkLiveInsightClosedInput;
}>;


export type MarkLiveInsightClosedMutation = { __typename?: 'Mutation', markLiveInsightClosed: { __typename?: 'LiveInsightOutbox', id: string, delivery_status: InsightStatus } };

export type MarkLiveInsightSeenMutationVariables = Exact<{
  input: MarkLiveInsightSeenInput;
}>;


export type MarkLiveInsightSeenMutation = { __typename?: 'Mutation', markLiveInsightSeen: { __typename?: 'LiveInsightOutbox', id: string, delivery_status: InsightStatus } };

export type UpdateMeMutationVariables = Exact<{
  input: UpdateMeInput;
}>;


export type UpdateMeMutation = { __typename?: 'Mutation', updateMe?: (
    { __typename?: 'User', organizationUsers: { __typename?: 'OrganizationUserPaginator', data: Array<(
        { __typename?: 'OrganizationUser' }
        & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
      )> } }
    & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
  ) | null };

export type UpdateNoteOrderMutationVariables = Exact<{
  input: Array<NoteOrderInput> | NoteOrderInput;
}>;


export type UpdateNoteOrderMutation = { __typename?: 'Mutation', updateNoteOrder: Array<{ __typename?: 'Note', id: string, title: string, content?: string | null, pinned: boolean, labels?: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null }> | null }> };

export type UpdateLabelMutationVariables = Exact<{
  input: UpdateLabelInput;
}>;


export type UpdateLabelMutation = { __typename?: 'Mutation', updateLabel: { __typename?: 'Label', id: string, name: string, color?: string | null } };

export type UpdateNoteMutationVariables = Exact<{
  input: UpdateNoteInput;
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote: { __typename?: 'Note', id: string, title: string, content?: string | null, pinned: boolean, updatedAt: string, labels?: Array<{ __typename?: 'Label', id: string, name: string, color?: string | null }> | null, files?: Array<{ __typename?: 'File', id: string, path: string, entity_type: string, entity_id: string, organization_id: string, pulse_id?: string | null, created_at: string, updated_at: string }> | null } };

export type UpdateNotificationStatusMutationVariables = Exact<{
  input: UpdateNotificationStatusInput;
}>;


export type UpdateNotificationStatusMutation = { __typename?: 'Mutation', updateNotificationStatus: (
    { __typename?: 'Notification' }
    & { ' $fragmentRefs'?: { 'NotificationFragmentFragment': NotificationFragmentFragment } }
  ) };

export type UpdateOrganizationGroupMemberMutationVariables = Exact<{
  input: UpdateOrCreateOrganizationGroupMemberInput;
}>;


export type UpdateOrganizationGroupMemberMutation = { __typename?: 'Mutation', createOrganizationGroupMember?: Array<(
    { __typename?: 'PulseMember' }
    & { ' $fragmentRefs'?: { 'PulseMemberFragmentFragment': PulseMemberFragmentFragment } }
  ) | null> | null };

export type UpdateOrganizationGroupMutationVariables = Exact<{
  input: UpdateOrganizationGroupInput;
}>;


export type UpdateOrganizationGroupMutation = { __typename?: 'Mutation', updateOrganizationGroup: (
    { __typename?: 'OrganizationGroup' }
    & { ' $fragmentRefs'?: { 'OrganizationGroupFragmentFragment': OrganizationGroupFragmentFragment } }
  ) };

export type UpdateOrganizationMutationVariables = Exact<{
  input: UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { __typename?: 'Mutation', updateOrganization?: (
    { __typename?: 'Organization' }
    & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
  ) | null };

export type UpdateOrganizationUserMutationVariables = Exact<{
  input: UpdateOrganizationUserInput;
}>;


export type UpdateOrganizationUserMutation = { __typename?: 'Mutation', updateOrganizationUser?: (
    { __typename?: 'OrganizationUser' }
    & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
  ) | null };

export type UpdateOrganizationUserRoleMutationVariables = Exact<{
  input: UpdateOrganizationUserRoleInput;
}>;


export type UpdateOrganizationUserRoleMutation = { __typename?: 'Mutation', updateOrganizationUserRole: { __typename?: 'OrganizationUser', id: string, userId: string, role: OrganizationUserRole } };

export type PinDirectMessageMutationVariables = Exact<{
  directMessageId: Scalars['ID']['input'];
  pinned: Scalars['Boolean']['input'];
}>;


export type PinDirectMessageMutation = { __typename?: 'Mutation', pinDirectMessage: { __typename?: 'DirectMessage', id: string, directMessageThreadId: string, content: string, createdAt: string, updatedAt: string, isEdited: boolean, deletedAt?: string | null, isRead: boolean, isPinned: boolean, repliedToMessageId?: string | null } };

export type UpdatePinTeamMessageMutationVariables = Exact<{
  teamMessageId: Scalars['ID']['input'];
  pinned: Scalars['Boolean']['input'];
}>;


export type UpdatePinTeamMessageMutation = { __typename?: 'Mutation', pinTeamMessage: { __typename?: 'TeamMessage', id: string, teamThreadId: string, isPinned: boolean } };

export type UpdatePulseLastVisitedMutationVariables = Exact<{
  pulseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
}>;


export type UpdatePulseLastVisitedMutation = { __typename?: 'Mutation', updatePulseLastVisited: (
    { __typename?: 'PulseMember' }
    & { ' $fragmentRefs'?: { 'PulseMemberFragmentFragment': PulseMemberFragmentFragment } }
  ) };

export type UpdatePulseMemberMutationVariables = Exact<{
  input: UpdatePulseMemberInput;
}>;


export type UpdatePulseMemberMutation = { __typename?: 'Mutation', updatePulseMember: (
    { __typename?: 'PulseMember' }
    & { ' $fragmentRefs'?: { 'PulseMemberFragmentFragment': PulseMemberFragmentFragment } }
  ) };

export type UpdatePulseMemberRoleMutationVariables = Exact<{
  input: UpdatePulseMemberRoleInput;
}>;


export type UpdatePulseMemberRoleMutation = { __typename?: 'Mutation', updatePulseMemberRole: { __typename?: 'PulseMember', role: PulseMemberRole } };

export type UpdatePulseMutationVariables = Exact<{
  input: UpdatePulseInput;
}>;


export type UpdatePulseMutation = { __typename?: 'Mutation', updatePulse: (
    { __typename?: 'Pulse' }
    & { ' $fragmentRefs'?: { 'PulseFragmentFragment': PulseFragmentFragment } }
  ) };

export type UpdatePulseOrderMutationVariables = Exact<{
  input?: InputMaybe<Array<UpdatePulseOrderInput> | UpdatePulseOrderInput>;
}>;


export type UpdatePulseOrderMutation = { __typename?: 'Mutation', updatePulseOrder?: Array<(
    { __typename?: 'Pulse' }
    & { ' $fragmentRefs'?: { 'PulseFragmentFragment': PulseFragmentFragment } }
  )> | null };

export type UpdatePulseTaskStatusMutationVariables = Exact<{
  input: UpdatePulseTaskStatusInput;
}>;


export type UpdatePulseTaskStatusMutation = { __typename?: 'Mutation', updatePulseTaskStatus: { __typename?: 'TaskStatusType', id: string, pulse_id?: string | null, label: string, color?: string | null, createdAt: string, updatedAt: string } };

export type UpdateRecommendationActionMutationVariables = Exact<{
  input: UpdateRecommendationActionInput;
}>;


export type UpdateRecommendationActionMutation = { __typename?: 'Mutation', updateRecommendationAction: { __typename?: 'ExecutionResult', success: boolean, message?: string | null } };

export type UpdateSettingMutationVariables = Exact<{
  input: UpdateSettingInput;
}>;


export type UpdateSettingMutation = { __typename?: 'Mutation', updateSetting: (
    { __typename?: 'Setting' }
    & { ' $fragmentRefs'?: { 'SettingFragmentFragment': SettingFragmentFragment } }
  ) };

export type UpdateStrategyMutationVariables = Exact<{
  input: UpdateStrategyInput;
}>;


export type UpdateStrategyMutation = { __typename?: 'Mutation', updateStrategy: (
    { __typename?: 'Strategy' }
    & { ' $fragmentRefs'?: { 'StrategyFragmentFragment': StrategyFragmentFragment } }
  ) };

export type UpdateTaskMutationVariables = Exact<{
  input: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: (
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskFragmentFragment': TaskFragmentFragment } }
  ) };

export type UpdateTaskOrderMutationVariables = Exact<{
  input?: InputMaybe<Array<TaskOrderInput> | TaskOrderInput>;
}>;


export type UpdateTaskOrderMutation = { __typename?: 'Mutation', updateTaskOrder?: Array<(
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskFragmentFragment': TaskFragmentFragment } }
  )> | null };

export type UpdateTaskStatusMutationVariables = Exact<{
  input: UpdateTaskStatusInput;
}>;


export type UpdateTaskStatusMutation = { __typename?: 'Mutation', updateTaskStatus: (
    { __typename?: 'Task' }
    & { ' $fragmentRefs'?: { 'TaskFragmentFragment': TaskFragmentFragment } }
  ) };

export type UpdateTaskStatusOrderMutationVariables = Exact<{
  input: Array<TaskStatusOrderInput> | TaskStatusOrderInput;
}>;


export type UpdateTaskStatusOrderMutation = { __typename?: 'Mutation', updateTaskStatusOrder: Array<{ __typename?: 'TaskStatusType', id: string, pulse_id?: string | null, label: string, color?: string | null, position?: number | null, createdAt: string, updatedAt: string }> };

export type UpdateTeamMessageMutationVariables = Exact<{
  input: UpdateTeamMessageInput;
}>;


export type UpdateTeamMessageMutation = { __typename?: 'Mutation', updateTeamMessage?: { __typename?: 'TeamMessage', id: string, teamThreadId: string, userId: string, content?: string | null, createdAt: string, updatedAt: string, isParentReply: boolean, replyTeamThreadId?: string | null, topicId?: string | null, user?: { __typename?: 'User', id: string, name: string, gravatar?: string | null } | null, metadata?: { __typename?: 'TeamMessageMetadata', excerpt?: string | null, status?: string | null } | null } | null };

export type UpdateThreadMutationVariables = Exact<{
  input: UpdateThreadInput;
}>;


export type UpdateThreadMutation = { __typename?: 'Mutation', updateThread?: (
    { __typename?: 'Thread' }
    & { ' $fragmentRefs'?: { 'ThreadFragmentFragment': ThreadFragmentFragment } }
  ) | null };

export type UpdateTimesheetMutationVariables = Exact<{
  input: UpdateTimesheetInput;
}>;


export type UpdateTimesheetMutation = { __typename?: 'Mutation', updateTimesheet?: { __typename?: 'Timesheet', id: string, checked_in_at: string, checked_out_at?: string | null, total?: number | null, user?: { __typename?: 'User', name: string } | null } | null };

export type UpdateTopicMutationVariables = Exact<{
  input: UpdateTopicInput;
}>;


export type UpdateTopicMutation = { __typename?: 'Mutation', updateTopic?: { __typename?: 'Topic', id: string, name: string, createdBy: string, createdAt: string, updatedAt: string, creator?: { __typename?: 'User', id: string, name: string } | null, teamThread?: { __typename?: 'TeamThread', id: string } | null } | null };

export type UpdateWidgetMutationVariables = Exact<{
  input: UpdateWidgetInput;
}>;


export type UpdateWidgetMutation = { __typename?: 'Mutation', updateWidget: (
    { __typename?: 'Widget' }
    & { ' $fragmentRefs'?: { 'WidgetFragmentFragment': WidgetFragmentFragment } }
  ) };

export type UpdateWidgetsOrderMutationVariables = Exact<{
  input?: InputMaybe<Array<WidgetOrderInput> | WidgetOrderInput>;
}>;


export type UpdateWidgetsOrderMutation = { __typename?: 'Mutation', updateWidgetOrder?: Array<(
    { __typename?: 'Widget' }
    & { ' $fragmentRefs'?: { 'WidgetFragmentFragment': WidgetFragmentFragment } }
  )> | null };

export type UserActiveTimesheetQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UserActiveTimesheetQuery = { __typename?: 'Query', userActiveTimesheet?: { __typename?: 'Timesheet', id: string, checked_in_at: string, checked_out_at?: string | null, userId: string, total?: number | null } | null };

export type AcceptInvitationMutationVariables = Exact<{
  input: AcceptInvitationInput;
}>;


export type AcceptInvitationMutation = { __typename?: 'Mutation', acceptInvitation?: { __typename?: 'User', id: string, name: string } | null };

export type CreateCompletionBaseMutationVariables = Exact<{
  input: CreateCompletionInput;
}>;


export type CreateCompletionBaseMutation = { __typename?: 'Mutation', createCompletion: Array<{ __typename?: 'Message', id: string, content?: string | null }> };

export type CreateLiveUploadMutationVariables = Exact<{
  input: CreateLiveUploadInput;
}>;


export type CreateLiveUploadMutation = { __typename?: 'Mutation', createLiveUpload?: { __typename?: 'LiveUpload', fileKey: string, userId: string, status: string, fullContent?: string | null, summaryContent?: string | null, createdAt: string, updatedAt: string, id: string } | null };

export type GenerateLiveUploadCredentialsMutationVariables = Exact<{
  input: GenerateUploadCredentialsInput;
}>;


export type GenerateLiveUploadCredentialsMutation = { __typename?: 'Mutation', generateLiveUploadCredentials?: { __typename?: 'UploadCredentials', key: string, url: string } | null };

export type GenerateUploadCredentialsMutationVariables = Exact<{
  input: GenerateUploadCredentialsInput;
}>;


export type GenerateUploadCredentialsMutation = { __typename?: 'Mutation', generateUploadCredentials?: { __typename?: 'UploadCredentials', key: string, url: string } | null };

export type SignInUserMutationVariables = Exact<{
  input: SignInUserInput;
}>;


export type SignInUserMutation = { __typename?: 'Mutation', signInUser?: { __typename?: 'User', createdAt: string, email: string, emailVerifiedAt?: string | null, id: string, name: string, updatedAt: string } | null };

export type AgentsQueryQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  pulseId: Scalars['String']['input'];
}>;


export type AgentsQueryQuery = { __typename?: 'Query', agents: { __typename?: 'AgentPaginator', data: Array<(
      { __typename?: 'Agent' }
      & { ' $fragmentRefs'?: { 'AgentFragmentFragment': AgentFragmentFragment } }
    )> } };

export type MeQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQueryQuery = { __typename?: 'Query', me?: (
    { __typename?: 'User', organizationUsers: { __typename?: 'OrganizationUserPaginator', data: Array<(
        { __typename?: 'OrganizationUser' }
        & { ' $fragmentRefs'?: { 'OrganizationUserFragmentFragment': OrganizationUserFragmentFragment } }
      )> } }
    & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
  ) | null };

export type OrganizationsQueryQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  slackTeamId?: InputMaybe<Scalars['String']['input']>;
}>;


export type OrganizationsQueryQuery = { __typename?: 'Query', organizations: { __typename?: 'OrganizationPaginator', data: Array<(
      { __typename?: 'Organization' }
      & { ' $fragmentRefs'?: { 'OrganizationFragmentFragment': OrganizationFragmentFragment } }
    )> } };

export type SlackCredentialsQueryQueryVariables = Exact<{
  slackTeamId: Scalars['String']['input'];
}>;


export type SlackCredentialsQueryQuery = { __typename?: 'Query', slackCredentials: Array<{ __typename?: 'SlackCredential', organizationId: string, slackAccessToken?: string | null }> };

export type GetSlackUserQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  slackId: Scalars['String']['input'];
}>;


export type GetSlackUserQuery = { __typename?: 'Query', slackUser?: (
    { __typename?: 'User' }
    & { ' $fragmentRefs'?: { 'UserFragmentFragment': UserFragmentFragment } }
  ) | null };

export const AgentFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AgentFragmentFragment, unknown>;
export const AiAgentFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AiAgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AiAgent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guidelines"}},{"kind":"Field","name":{"kind":"Name","value":"agent_type"}},{"kind":"Field","name":{"kind":"Name","value":"credentials"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<AiAgentFragmentFragment, unknown>;
export const BackgroundFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackgroundFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Background"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"image_url"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<BackgroundFragmentFragment, unknown>;
export const MessageFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_saved"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"thread_id"}},{"kind":"Field","name":{"kind":"Name","value":"topic_id"}},{"kind":"Field","name":{"kind":"Name","value":"savedMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MessageFragmentFragment, unknown>;
export const OrganizationUserFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]} as unknown as DocumentNode<OrganizationUserFragmentFragment, unknown>;
export const PaginatorInfoFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<PaginatorInfoFragmentFragment, unknown>;
export const ThreadFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Thread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<ThreadFragmentFragment, unknown>;
export const UserFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<UserFragmentFragment, unknown>;
export const UnacknowledgedMisalignmentFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UnacknowledgedMisalignmentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MisalignmentAlert"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"violatedValue"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}}]}}]} as unknown as DocumentNode<UnacknowledgedMisalignmentFragmentFragment, unknown>;
export const MasterPulseFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MasterPulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MasterPulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MasterPulseFragmentFragment, unknown>;
export const StrategyFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StrategyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Strategy"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<StrategyFragmentFragment, unknown>;
export const SavedMessageFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedMessageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedMessage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<SavedMessageFragmentFragment, unknown>;
export const NotificationFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"data_source_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"summaryId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]} as unknown as DocumentNode<NotificationFragmentFragment, unknown>;
export const IntegrationFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"api_key"}},{"kind":"Field","name":{"kind":"Name","value":"sync_status"}}]}}]} as unknown as DocumentNode<IntegrationFragmentFragment, unknown>;
export const PulseMemberFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<PulseMemberFragmentFragment, unknown>;
export const SettingFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SettingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Setting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"weekendDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<SettingFragmentFragment, unknown>;
export const SummaryFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SummaryFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Summary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"data_source_id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"}},{"kind":"Field","name":{"kind":"Name","value":"potential_strategies"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"action_items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"is_existing"}}]}}]}}]} as unknown as DocumentNode<SummaryFragmentFragment, unknown>;
export const StrategyDescriptionFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StrategyDescriptionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StrategyDescription"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_description"}},{"kind":"Field","name":{"kind":"Name","value":"isSuccess"}}]}}]} as unknown as DocumentNode<StrategyDescriptionFragmentFragment, unknown>;
export const WidgetFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WidgetFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Widget"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}}]}}]} as unknown as DocumentNode<WidgetFragmentFragment, unknown>;
export const PulseFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}}]} as unknown as DocumentNode<PulseFragmentFragment, unknown>;
export const OrganizationFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<OrganizationFragmentFragment, unknown>;
export const GroupMemberFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}}]}}]} as unknown as DocumentNode<GroupMemberFragmentFragment, unknown>;
export const OrganizationGroupFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationGroupFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupMemberFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}}]}}]} as unknown as DocumentNode<OrganizationGroupFragmentFragment, unknown>;
export const MeetingSessionFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MeetingSessionFragmentFragment, unknown>;
export const MeetingFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MeetingFragmentFragment, unknown>;
export const TranscriptFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TranscriptFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Transcript"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"speakers"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}}]} as unknown as DocumentNode<TranscriptFragmentFragment, unknown>;
export const ActivityFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"causer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subjectType"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"receiverId"}},{"kind":"Field","name":{"kind":"Name","value":"properties"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"feedType"}}]}}]} as unknown as DocumentNode<ActivityFragmentFragment, unknown>;
export const DataSourceFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<DataSourceFragmentFragment, unknown>;
export const TaskChildFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}}]} as unknown as DocumentNode<TaskChildFragmentFragment, unknown>;
export const TaskFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}}]} as unknown as DocumentNode<TaskFragmentFragment, unknown>;
export const PulseWelcomeDataFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseWelcomeDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseWelcomeData"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"lastVisited"}},{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<PulseWelcomeDataFragmentFragment, unknown>;
export const EventFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"google_event_id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<EventFragmentFragment, unknown>;
export const EventInstanceFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventInstanceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventInstance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"local_description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"google_event_id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}}]} as unknown as DocumentNode<EventInstanceFragmentFragment, unknown>;
export const ActionableFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActionableFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Actionable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<ActionableFragmentFragment, unknown>;
export const NotificationPreferenceFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationPreferenceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPreference"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scopeType"}},{"kind":"Field","name":{"kind":"Name","value":"scopeId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<NotificationPreferenceFragmentFragment, unknown>;
export const AcknowledgeMisalignmentAlertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcknowledgeMisalignmentAlert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcknowledgeMisalignmentAlertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acknowledgeMisalignmentAlert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AcknowledgeMisalignmentAlertMutation, AcknowledgeMisalignmentAlertMutationVariables>;
export const AttachGoogleMeetToEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AttachGoogleMeetToEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invite_pulse"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attachGoogleMeetToEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"eventId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}}},{"kind":"Argument","name":{"kind":"Name","value":"invite_pulse"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invite_pulse"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}}]}}]}}]}}]} as unknown as DocumentNode<AttachGoogleMeetToEventMutation, AttachGoogleMeetToEventMutationVariables>;
export const CheckInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CheckIn"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkIn"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"checked_in_at"}},{"kind":"Field","name":{"kind":"Name","value":"checked_out_at"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<CheckInMutation, CheckInMutationVariables>;
export const CheckOutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CheckOut"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkOut"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"checked_in_at"}},{"kind":"Field","name":{"kind":"Name","value":"checked_out_at"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<CheckOutMutation, CheckOutMutationVariables>;
export const ClearNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}]}]}}]} as unknown as DocumentNode<ClearNotificationsMutation, ClearNotificationsMutationVariables>;
export const ClearOrganizationNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearOrganizationNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearOrganizationNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}]}]}}]} as unknown as DocumentNode<ClearOrganizationNotificationsMutation, ClearOrganizationNotificationsMutationVariables>;
export const ClearTeamMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearTeamMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearTeamMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}]}]}}]} as unknown as DocumentNode<ClearTeamMessagesMutation, ClearTeamMessagesMutationVariables>;
export const CompleteMcpAuthorizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteMCPAuthorization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"state"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeMCPAuthorization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"state"},"value":{"kind":"Variable","name":{"kind":"Name","value":"state"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"tokenData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpUrl"}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"tokenType"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}}]}}]}}]}}]} as unknown as DocumentNode<CompleteMcpAuthorizationMutation, CompleteMcpAuthorizationMutationVariables>;
export const CreateAgendaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAgenda"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAgendaInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAgenda"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<CreateAgendaMutation, CreateAgendaMutationVariables>;
export const CreateAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAgentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateAgentMutation, CreateAgentMutationVariables>;
export const CreateAiAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAiAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAiAgentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAiAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AiAgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AiAgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AiAgent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guidelines"}},{"kind":"Field","name":{"kind":"Name","value":"agent_type"}},{"kind":"Field","name":{"kind":"Name","value":"credentials"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<CreateAiAgentMutation, CreateAiAgentMutationVariables>;
export const CreateAssistantOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAssistantOnboarding"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAssistantOnboardingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAssistantOnboarding"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateAssistantOnboardingMutation, CreateAssistantOnboardingMutationVariables>;
export const CreateBackgroundDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBackground"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateBackgroundInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBackground"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackgroundFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackgroundFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Background"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"image_url"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<CreateBackgroundMutation, CreateBackgroundMutationVariables>;
export const CreateChecklistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChecklist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateChecklistInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChecklist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<CreateChecklistMutation, CreateChecklistMutationVariables>;
export const CreateCheckoutSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCheckoutSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"price_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"quantity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCheckoutSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"price_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"price_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"quantity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"quantity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>;
export const CreateCompletionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCompletion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCompletionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCompletion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreateCompletionMutation, CreateCompletionMutationVariables>;
export const CreateDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<CreateDataSourceMutation, CreateDataSourceMutationVariables>;
export const CreateDirectMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDirectMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDirectMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDirectMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"directMessageThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateDirectMessageMutation, CreateDirectMessageMutationVariables>;
export const CreateEventInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEventInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEventInstanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEventInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"local_description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<CreateEventInstanceMutation, CreateEventInstanceMutationVariables>;
export const CreateEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEventInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"google_event_id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}}]} as unknown as DocumentNode<CreateEventMutation, CreateEventMutationVariables>;
export const CreateEventSummaryMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createEventSummaryMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEventSummaryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEventSummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<CreateEventSummaryMutationMutation, CreateEventSummaryMutationMutationVariables>;
export const CreateIntegrationMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createIntegrationMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateIntegrationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createIntegration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"api_key"}},{"kind":"Field","name":{"kind":"Name","value":"sync_status"}}]}}]} as unknown as DocumentNode<CreateIntegrationMutationMutation, CreateIntegrationMutationMutationVariables>;
export const CreateInterestMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createInterestMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInterestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInterest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"company_name"}},{"kind":"Field","name":{"kind":"Name","value":"company_size"}},{"kind":"Field","name":{"kind":"Name","value":"looking_for"}}]}}]}}]} as unknown as DocumentNode<CreateInterestMutationMutation, CreateInterestMutationMutationVariables>;
export const CreateMeetingDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMeetingDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMeetingDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMeetingDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<CreateMeetingDataSourceMutation, CreateMeetingDataSourceMutationVariables>;
export const CreateMeetingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMeeting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMeetingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMeeting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}}]} as unknown as DocumentNode<CreateMeetingMutation, CreateMeetingMutationVariables>;
export const CreateNoteDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNoteDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNoteDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNoteDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<CreateNoteDataSourceMutation, CreateNoteDataSourceMutationVariables>;
export const CreateLabelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLabel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLabelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLabel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<CreateLabelMutation, CreateLabelMutationVariables>;
export const CreateNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"labels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]}}]} as unknown as DocumentNode<CreateNoteMutation, CreateNoteMutationVariables>;
export const CreateNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNotificationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]} as unknown as DocumentNode<CreateNotificationMutation, CreateNotificationMutationVariables>;
export const CreateNotificationPreferenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNotificationPreference"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNotificationPreferenceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNotificationPreference"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scopeType"}},{"kind":"Field","name":{"kind":"Name","value":"scopeId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateNotificationPreferenceMutation, CreateNotificationPreferenceMutationVariables>;
export const CreateOrganizationGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganizationGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganizationGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationGroupMutation, CreateOrganizationGroupMutationVariables>;
export const CreateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationMutation, CreateOrganizationMutationVariables>;
export const CreatePulseMemberMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePulseMemberMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePulseMemberInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPulseMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseMemberFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<CreatePulseMemberMutationMutation, CreatePulseMemberMutationMutationVariables>;
export const CreatePulseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePulse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProvisionPulseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPulse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}}]} as unknown as DocumentNode<CreatePulseMutation, CreatePulseMutationVariables>;
export const CreatePulseTaskStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePulseTaskStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePulseTaskStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPulseTaskStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreatePulseTaskStatusMutation, CreatePulseTaskStatusMutationVariables>;
export const CreateReplyTeamThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateReplyTeamThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateReplyTeamThreadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createReplyTeamThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateReplyTeamThreadMutation, CreateReplyTeamThreadMutationVariables>;
export const CreateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SettingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SettingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Setting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"weekendDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<CreateSettingMutation, CreateSettingMutationVariables>;
export const CreateSmartAgendaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSmartAgenda"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSmartAgendaInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSmartAgenda"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<CreateSmartAgendaMutation, CreateSmartAgendaMutationVariables>;
export const CreateSmartChecklistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSmartChecklist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSmartChecklistInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSmartChecklist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<CreateSmartChecklistMutation, CreateSmartChecklistMutationVariables>;
export const CreateStrategyDescriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStrategyDescription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StrategyDescriptionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStrategyDescription"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StrategyDescriptionFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StrategyDescriptionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StrategyDescription"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"prompt_description"}},{"kind":"Field","name":{"kind":"Name","value":"isSuccess"}}]}}]} as unknown as DocumentNode<CreateStrategyDescriptionMutation, CreateStrategyDescriptionMutationVariables>;
export const CreateStrategyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStrategy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStrategyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStrategy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StrategyFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StrategyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Strategy"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<CreateStrategyMutation, CreateStrategyMutationVariables>;
export const CreateSummaryOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSummaryOptions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSummaryOptionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSummaryOptions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_saved"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"thread_id"}},{"kind":"Field","name":{"kind":"Name","value":"topic_id"}},{"kind":"Field","name":{"kind":"Name","value":"savedMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateSummaryOptionsMutation, CreateSummaryOptionsMutationVariables>;
export const CreateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTaskInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateTaskMutation, CreateTaskMutationVariables>;
export const CreateTeamMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTeamMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeamMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"topicId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"topic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTeamMessageMutation, CreateTeamMessageMutationVariables>;
export const CreateTeamThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTeamThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamThreadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeamThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateTeamThreadMutation, CreateTeamThreadMutationVariables>;
export const CreateThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateThreadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}}]}}]}}]} as unknown as DocumentNode<CreateThreadMutation, CreateThreadMutationVariables>;
export const CreateTopicDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTopic"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTopicInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTopic"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"creator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamThread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTopicMutation, CreateTopicMutationVariables>;
export const CreateWidgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWidget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWidgetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWidget"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WidgetFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WidgetFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Widget"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}}]}}]} as unknown as DocumentNode<CreateWidgetMutation, CreateWidgetMutationVariables>;
export const DeleteAgendaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAgenda"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAgenda"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<DeleteAgendaMutation, DeleteAgendaMutationVariables>;
export const DeleteAiAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAiAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"aiAgentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAiAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"aiAgentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"aiAgentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AiAgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AiAgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AiAgent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guidelines"}},{"kind":"Field","name":{"kind":"Name","value":"agent_type"}},{"kind":"Field","name":{"kind":"Name","value":"credentials"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<DeleteAiAgentMutation, DeleteAiAgentMutationVariables>;
export const DeleteBackgroundDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBackground"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBackground"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteBackgroundMutation, DeleteBackgroundMutationVariables>;
export const DeleteChecklistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteChecklist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteChecklist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<DeleteChecklistMutation, DeleteChecklistMutationVariables>;
export const DeleteDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<DeleteDataSourceMutation, DeleteDataSourceMutationVariables>;
export const DeleteDirectMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDirectMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"directMessageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDirectMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"directMessageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"directMessageId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]}}]} as unknown as DocumentNode<DeleteDirectMessageMutation, DeleteDirectMessageMutationVariables>;
export const DeleteIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"integrationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteIntegration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"integrationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"integrationId"}}}]}]}}]} as unknown as DocumentNode<DeleteIntegrationMutation, DeleteIntegrationMutationVariables>;
export const DeleteNoteAttachmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNoteAttachment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNoteFileAttachement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}}]}]}}]} as unknown as DocumentNode<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>;
export const DeleteLabelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLabel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLabel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DeleteLabelMutation, DeleteLabelMutationVariables>;
export const DeleteNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"noteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"noteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"noteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"labels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}}]}}]}}]} as unknown as DocumentNode<DeleteNoteMutation, DeleteNoteMutationVariables>;
export const DeleteOrganizationUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOrganizationUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOrganizationUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationUserId"}}}]}]}}]} as unknown as DocumentNode<DeleteOrganizationUserMutation, DeleteOrganizationUserMutationVariables>;
export const DeletePulseMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePulseMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseMemberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePulseMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseMemberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseMemberId"}}}]}]}}]} as unknown as DocumentNode<DeletePulseMemberMutation, DeletePulseMemberMutationVariables>;
export const DeletePulseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePulse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePulse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}]}]}}]} as unknown as DocumentNode<DeletePulseMutation, DeletePulseMutationVariables>;
export const DeletePulseTaskStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePulseTaskStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeletePulseTaskStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePulseTaskStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeletePulseTaskStatusMutation, DeletePulseTaskStatusMutationVariables>;
export const DeleteSavedMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteSavedMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"savedMessageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSavedMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"savedMessageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"savedMessageId"}}}]}]}}]} as unknown as DocumentNode<DeleteSavedMessageMutation, DeleteSavedMessageMutationVariables>;
export const DeleteStrategyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteStrategy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"strategyId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteStrategy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"strategyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"strategyId"}}}]}]}}]} as unknown as DocumentNode<DeleteStrategyMutation, DeleteStrategyMutationVariables>;
export const DeleteTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const DeleteTeamMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTeamMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteTeamMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeamMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeleteTeamMessageMutation, DeleteTeamMessageMutationVariables>;
export const DeleteThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteThreadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Thread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<DeleteThreadMutation, DeleteThreadMutationVariables>;
export const DeleteTopicDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTopic"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteTopicInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTopic"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeleteTopicMutation, DeleteTopicMutationVariables>;
export const DeleteWidgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteWidget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"widgetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWidget"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"widgetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"widgetId"}}}]}]}}]} as unknown as DocumentNode<DeleteWidgetMutation, DeleteWidgetMutationVariables>;
export const GetDirectMessageThreadUnreadCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GetDirectMessageThreadUnreadCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DirectMessageThreadPaginationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getOrCreateDirectMessageThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threadId"}}]}}]}}]} as unknown as DocumentNode<GetDirectMessageThreadUnreadCountMutation, GetDirectMessageThreadUnreadCountMutationVariables>;
export const DismissRecommendationActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DismissRecommendationAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DismissRecommendationActionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dismissRecommendationAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<DismissRecommendationActionMutation, DismissRecommendationActionMutationVariables>;
export const ExecuteInsightRecommendationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExecuteInsightRecommendation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExecuteInsightRecommendationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executeInsightRecommendation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ExecuteInsightRecommendationMutation, ExecuteInsightRecommendationMutationVariables>;
export const FetchUserCalendarEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FetchUserCalendarEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FetchUserCalendarEventsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fetchUserCalendarEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<FetchUserCalendarEventsMutation, FetchUserCalendarEventsMutationVariables>;
export const FetchUserGoogleCalendarSourcedEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FetchUserGoogleCalendarSourcedEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FetchUserGoogleCalendarSourcedEventsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fetchUserGoogleCalendarSourcedEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<FetchUserGoogleCalendarSourcedEventsMutation, FetchUserGoogleCalendarSourcedEventsMutationVariables>;
export const GenerateDataScientistDownloadLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateDataScientistDownloadLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateDataScientistDownloadLinkInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateDataScientistDownloadLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GenerateDataScientistDownloadLinkMutation, GenerateDataScientistDownloadLinkMutationVariables>;
export const GenerateDataSourceDownloadLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateDataSourceDownloadLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateDataSourceDownloadLinkInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateDataSourceDownloadLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GenerateDataSourceDownloadLinkMutation, GenerateDataSourceDownloadLinkMutationVariables>;
export const GenerateEntitiesFromTextDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateEntitiesFromText"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateEntitiesFromTextInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateEntitiesFromText"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<GenerateEntitiesFromTextMutation, GenerateEntitiesFromTextMutationVariables>;
export const GenerateThreadTitleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateThreadTitle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateThreadTitleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateThreadTitle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<GenerateThreadTitleMutation, GenerateThreadTitleMutationVariables>;
export const GetActionablesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActionables"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actionables"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"eventId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActionableFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActionableFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Actionable"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<GetActionablesQuery, GetActionablesQueryVariables>;
export const GetActiveThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ThreadType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Thread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<GetActiveThreadQuery, GetActiveThreadQueryVariables>;
export const GetActivitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"receiverId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"receiverId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"receiverId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ActivityFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"causer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subjectType"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"receiverId"}},{"kind":"Field","name":{"kind":"Name","value":"properties"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"feedType"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetActivitiesQuery, GetActivitiesQueryVariables>;
export const GetAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetAgentQuery, GetAgentQueryVariables>;
export const GetAgentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAgents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetAgentsQuery, GetAgentsQueryVariables>;
export const GetAiAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAiAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"aiAgentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"aiAgentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"aiAgentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AiAgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AiAgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AiAgent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guidelines"}},{"kind":"Field","name":{"kind":"Name","value":"agent_type"}},{"kind":"Field","name":{"kind":"Name","value":"credentials"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<GetAiAgentQuery, GetAiAgentQueryVariables>;
export const GetAiAgentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAiAgents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiAgents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AiAgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AiAgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AiAgent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guidelines"}},{"kind":"Field","name":{"kind":"Name","value":"agent_type"}},{"kind":"Field","name":{"kind":"Name","value":"credentials"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<GetAiAgentsQuery, GetAiAgentsQueryVariables>;
export const GetAutomationLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAutomationLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"strategyId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"automationLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"strategyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"strategyId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runAt"}},{"kind":"Field","name":{"kind":"Name","value":"logs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"context"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetAutomationLogQuery, GetAutomationLogQueryVariables>;
export const GetBackgroundsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getBackgrounds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backgrounds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackgroundFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackgroundFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Background"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"image_url"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetBackgroundsQuery, GetBackgroundsQueryVariables>;
export const GetChecklistsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getChecklists"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checklists"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"eventId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"complete"}}]}}]}}]} as unknown as DocumentNode<GetChecklistsQuery, GetChecklistsQueryVariables>;
export const GetCollabsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCollabs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"default"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"origin"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Origin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collabs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"default"},"value":{"kind":"Variable","name":{"kind":"Name","value":"default"}}},{"kind":"Argument","name":{"kind":"Name","value":"origin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"origin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"companion_status"}},{"kind":"Field","name":{"kind":"Name","value":"meeting_type"}}]}}]}}]} as unknown as DocumentNode<GetCollabsQuery, GetCollabsQueryVariables>;
export const GetDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<GetDataSourceQuery, GetDataSourceQueryVariables>;
export const GetDataSourceUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDataSourceUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signedDataSourceUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mime"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GetDataSourceUrlQuery, GetDataSourceUrlQueryVariables>;
export const GetDataSourcesByOriginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDataSourcesByOrigin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"origin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataSourceOrigin"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourcesByOrigin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"origin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"origin"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetDataSourcesByOriginQuery, GetDataSourcesByOriginQueryVariables>;
export const GetDataSourcesByOriginWithInfiniteQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDataSourcesByOriginWithInfiniteQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"meetingName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"origin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataSourceOrigin"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourcesByOrigin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"meetingName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"meetingName"}}},{"kind":"Argument","name":{"kind":"Name","value":"origin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"origin"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetDataSourcesByOriginWithInfiniteQueryQuery, GetDataSourcesByOriginWithInfiniteQueryQueryVariables>;
export const GetDataSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDataSources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetDataSourcesQuery, GetDataSourcesQueryVariables>;
export const GetDirectMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getDirectMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"directMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"otherParticipant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"directMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetDirectMessagesQuery, GetDirectMessagesQueryVariables>;
export const GetDownloadDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDownloadDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"downloadDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GetDownloadDataSourceQuery, GetDownloadDataSourceQueryVariables>;
export const GetEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"event"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"eventId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}},{"kind":"Field","name":{"kind":"Name","value":"agendas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"companion_status"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"google_event_id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}}]} as unknown as DocumentNode<GetEventQuery, GetEventQueryVariables>;
export const GetEventInstancesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventInstances"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EventsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eventInstances"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventInstanceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"google_event_id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventInstanceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EventInstance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"local_description"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GetEventInstancesQuery, GetEventInstancesQueryVariables>;
export const GetEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EventsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"google_event_id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetEventsQuery, GetEventsQueryVariables>;
export const GetFirefliesWebhookUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFirefliesWebhookUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fireFliesWebhookUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}]}]}}]} as unknown as DocumentNode<GetFirefliesWebhookUrlQuery, GetFirefliesWebhookUrlQueryVariables>;
export const GetInsightRecommendationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInsightRecommendations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"GetInsightRecommendations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"is_executed"}},{"kind":"Field","name":{"kind":"Name","value":"execution_result"}},{"kind":"Field","name":{"kind":"Name","value":"execution_result_data"}},{"kind":"Field","name":{"kind":"Name","value":"executedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relatedTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"similarity_score"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relatedNotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"similarity_score"}}]}}]}}]}}]} as unknown as DocumentNode<GetInsightRecommendationsQuery, GetInsightRecommendationsQueryVariables>;
export const GetIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"api_key"}},{"kind":"Field","name":{"kind":"Name","value":"sync_status"}}]}}]} as unknown as DocumentNode<GetIntegrationQuery, GetIntegrationQueryVariables>;
export const GetIntegrationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetIntegrations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"api_key"}},{"kind":"Field","name":{"kind":"Name","value":"sync_status"}}]}}]} as unknown as DocumentNode<GetIntegrationsQuery, GetIntegrationsQueryVariables>;
export const JumpTeamThreadMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JumpTeamThreadMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"messageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"replyTeamThreadId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jumpTeamThreadMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"topicId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}}},{"kind":"Argument","name":{"kind":"Name","value":"messageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"messageId"}}},{"kind":"Argument","name":{"kind":"Name","value":"replyTeamThreadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"replyTeamThreadId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"topicId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"isParentReply"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]}}]}}]} as unknown as DocumentNode<JumpTeamThreadMessageQuery, JumpTeamThreadMessageQueryVariables>;
export const GetLiveInsightDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLiveInsight"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"liveInsight"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"item_hash"}},{"kind":"Field","name":{"kind":"Name","value":"meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"explanation"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"delivery_status"}},{"kind":"Field","name":{"kind":"Name","value":"delivered_at"}},{"kind":"Field","name":{"kind":"Name","value":"read_at"}},{"kind":"Field","name":{"kind":"Name","value":"closed_at"}},{"kind":"Field","name":{"kind":"Name","value":"closed_reason"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"feedback"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outbox_id"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"topicThread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetLiveInsightQuery, GetLiveInsightQueryVariables>;
export const GetLiveInsightsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLiveInsights"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LiveInsightsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myLiveInsights"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"perPage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"item_hash"}},{"kind":"Field","name":{"kind":"Name","value":"topic"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"explanation"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"delivery_status"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"feedback"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outbox_id"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<GetLiveInsightsQuery, GetLiveInsightsQueryVariables>;
export const GetMasterPulsesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMasterPulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"masterPulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MasterPulseFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MasterPulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MasterPulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetMasterPulsesQuery, GetMasterPulsesQueryVariables>;
export const GetMeetingSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMeetingSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"meetingSessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"meetingSessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"meetingSessionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"companion_status"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"guests"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"google_event_id"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}}]}}]}}]} as unknown as DocumentNode<GetMeetingSessionQuery, GetMeetingSessionQueryVariables>;
export const GetMeetingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getMeetings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"added"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ignored"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"added"},"value":{"kind":"Variable","name":{"kind":"Name","value":"added"}}},{"kind":"Argument","name":{"kind":"Name","value":"ignored"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ignored"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}}]} as unknown as DocumentNode<GetMeetingsQuery, GetMeetingsQueryVariables>;
export const GetMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"threadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_saved"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"thread_id"}},{"kind":"Field","name":{"kind":"Name","value":"topic_id"}},{"kind":"Field","name":{"kind":"Name","value":"savedMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetMessagesQuery, GetMessagesQueryVariables>;
export const GetMonthlyQuestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMonthlyQuestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthlyQuestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"question"}}]}}]}}]} as unknown as DocumentNode<GetMonthlyQuestionsQuery, GetMonthlyQuestionsQueryVariables>;
export const GetmonthlySummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetmonthlySummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthlySummary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"comparisonValue"}},{"kind":"Field","name":{"kind":"Name","value":"comparison"}}]}}]}}]} as unknown as DocumentNode<GetmonthlySummaryQuery, GetmonthlySummaryQueryVariables>;
export const GetMonthlyTimeSavedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMonthlyTimeSaved"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthlyTimeSaved"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"time"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"year"}}]}}]}}]} as unknown as DocumentNode<GetMonthlyTimeSavedQuery, GetMonthlyTimeSavedQueryVariables>;
export const GetMonthlyTrendingTopicsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMonthlyTrendingTopics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"month"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"monthlyTrendingTopics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"month"},"value":{"kind":"Variable","name":{"kind":"Name","value":"month"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<GetMonthlyTrendingTopicsQuery, GetMonthlyTrendingTopicsQueryVariables>;
export const GetNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"noteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"note"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"noteId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"noteId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"labels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetNoteQuery, GetNoteQueryVariables>;
export const GetLabelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLabels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"viewAll"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"labels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"viewAll"},"value":{"kind":"Variable","name":{"kind":"Name","value":"viewAll"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<GetLabelsQuery, GetLabelsQueryVariables>;
export const GetNotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"viewAllLabels"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"viewAllLabels"},"value":{"kind":"Variable","name":{"kind":"Name","value":"viewAllLabels"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"labels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"latest_update"}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetNotesQuery, GetNotesQueryVariables>;
export const GetNotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNotificationPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationPreferenceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationPreferenceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPreference"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scopeType"}},{"kind":"Field","name":{"kind":"Name","value":"scopeId"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetNotificationPreferencesQuery, GetNotificationPreferencesQueryVariables>;
export const GetOrCreateDirectMessageThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GetOrCreateDirectMessageThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DirectMessageThreadPaginationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getOrCreateDirectMessageThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"directMessageThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"groupedReactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reaction"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"directMessageThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetOrCreateDirectMessageThreadMutation, GetOrCreateDirectMessageThreadMutationVariables>;
export const OrganizationGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulseMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}}]}}]}}]}}]}}]} as unknown as DocumentNode<OrganizationGroupQuery, OrganizationGroupQueryVariables>;
export const OrganizationGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationGroupFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unassignedPulseMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseMemberFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationGroupFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupMemberFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<OrganizationGroupsQuery, OrganizationGroupsQueryVariables>;
export const GetOrganizationLogoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationLogo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationLogo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationLogoQuery, GetOrganizationLogoQueryVariables>;
export const GetOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrganizationQuery, GetOrganizationQueryVariables>;
export const GetOrganizationUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]} as unknown as DocumentNode<GetOrganizationUserQuery, GetOrganizationUserQueryVariables>;
export const GetOrganizationUsersInfiniteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationUsersInfinite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetOrganizationUsersInfiniteQuery, GetOrganizationUsersInfiniteQueryVariables>;
export const GetOrganizationUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizationUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetOrganizationUsersQuery, GetOrganizationUsersQueryVariables>;
export const GetOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganizations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slackTeamId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"slackTeamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slackTeamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetOrganizationsQuery, GetOrganizationsQueryVariables>;
export const GetPaginatedNotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPaginatedNotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatedNotesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paginatedNotes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"labels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<GetPaginatedNotesQuery, GetPaginatedNotesQueryVariables>;
export const PinnedDirectMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PinnedDirectMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"directMessageThreadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pinnedDirectMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"directMessageThreadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"directMessageThreadId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"directMessageThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"firstItem"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastItem"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<PinnedDirectMessagesQuery, PinnedDirectMessagesQueryVariables>;
export const GetPinnedTeamMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPinnedTeamMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamThreadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pinnedTeamMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamThreadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamThreadId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"topicId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"isParentReply"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"topic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}}]}}]}}]} as unknown as DocumentNode<GetPinnedTeamMessagesQuery, GetPinnedTeamMessagesQueryVariables>;
export const GetPreviousActiveThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPreviousActiveThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previousActiveThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Thread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<GetPreviousActiveThreadQuery, GetPreviousActiveThreadQueryVariables>;
export const GetPulseMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPulseMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulseMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseMemberFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<GetPulseMemberQuery, GetPulseMemberQueryVariables>;
export const GetPulseMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPulseMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulseMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseMemberFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<GetPulseMembersQuery, GetPulseMembersQueryVariables>;
export const GetPulseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPulse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status_option"}},{"kind":"Field","name":{"kind":"Name","value":"team_thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"savedMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPulseQuery, GetPulseQueryVariables>;
export const GetPulseWelcomeDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPulseWelcomeData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulseWelcomeData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseWelcomeDataFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseWelcomeDataFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseWelcomeData"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"lastVisited"}},{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meetings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}}]} as unknown as DocumentNode<GetPulseWelcomeDataQuery, GetPulseWelcomeDataQueryVariables>;
export const GetPulsesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPulses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}}]} as unknown as DocumentNode<GetPulsesQuery, GetPulsesQueryVariables>;
export const GetReplyTeamThreadMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetReplyTeamThreadMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"replyTeamThreadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"replyTeamThreadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"replyTeamThreadId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isParentReply"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"groupedReactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reaction"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<GetReplyTeamThreadMessagesQuery, GetReplyTeamThreadMessagesQueryVariables>;
export const GetSavedMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSavedMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedMessageFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedMessageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedMessage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetSavedMessagesQuery, GetSavedMessagesQueryVariables>;
export const SchedulerScaleStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"schedulerScaleStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedulerScaleStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}},{"kind":"Field","name":{"kind":"Name","value":"maxInstances"}}]}}]}}]} as unknown as DocumentNode<SchedulerScaleStatusQuery, SchedulerScaleStatusQueryVariables>;
export const SettingImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SettingImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"settingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settingImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"settingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"settingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<SettingImageQuery, SettingImageQueryVariables>;
export const GetSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SettingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SettingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Setting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"weekendDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<GetSettingQuery, GetSettingQueryVariables>;
export const GetStrategiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStrategies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"strategies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alerts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StrategyFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"kpis"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StrategyFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"automations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StrategyFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"missions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StrategyFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StrategyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Strategy"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<GetStrategiesQuery, GetStrategiesQueryVariables>;
export const GetSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"summaryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"summaryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"summaryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SummaryFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SummaryFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Summary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"data_source_id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"}},{"kind":"Field","name":{"kind":"Name","value":"potential_strategies"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"action_items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"is_existing"}}]}}]}}]} as unknown as DocumentNode<GetSummaryQuery, GetSummaryQueryVariables>;
export const GetTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetTaskQuery, GetTaskQueryVariables>;
export const GetTaskStatusesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTaskStatuses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaults"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskStatuses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"defaults"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaults"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetTaskStatusesQuery, GetTaskStatusesQueryVariables>;
export const GetTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTasks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entityId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"priority"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskPriority"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateRangeInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assigneeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeStatus"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludePriority"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskPriority"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeAssigneeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeWithChildren"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isScheduled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"entityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entityId"}}},{"kind":"Argument","name":{"kind":"Name","value":"priority"},"value":{"kind":"Variable","name":{"kind":"Name","value":"priority"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"dateRange"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}}},{"kind":"Argument","name":{"kind":"Name","value":"assigneeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assigneeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludePriority"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludePriority"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeAssigneeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeAssigneeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeWithChildren"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeWithChildren"}}},{"kind":"Argument","name":{"kind":"Name","value":"isScheduled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isScheduled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assigneeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assigneeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"priority"},"value":{"kind":"Variable","name":{"kind":"Name","value":"priority"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"dateRange"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}}]} as unknown as DocumentNode<GetTasksQuery, GetTasksQueryVariables>;
export const GetTeamMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeamMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unreadOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamThreadMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"unreadOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unreadOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isParentReply"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"groupedReactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reaction"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<GetTeamMessagesQuery, GetTeamMessagesQueryVariables>;
export const GetTeamThreadMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeamThreadMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unreadOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamThreadMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"topicId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"unreadOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unreadOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"topicId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isParentReply"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"topic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"groupedReactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reaction"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}}]}}]}}]} as unknown as DocumentNode<GetTeamThreadMessagesQuery, GetTeamThreadMessagesQueryVariables>;
export const GetThreadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetThreads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Thread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetThreadsQuery, GetThreadsQueryVariables>;
export const GetTimesheetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTimesheets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateRangeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timesheets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"dateRange"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"checked_in_at"}},{"kind":"Field","name":{"kind":"Name","value":"checked_out_at"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<GetTimesheetsQuery, GetTimesheetsQueryVariables>;
export const GetTopicDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopic"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topic"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"topicId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"creator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamThread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<GetTopicQuery, GetTopicQueryVariables>;
export const GetTopicsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopicsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TopicEntityType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"creator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamThread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<GetTopicsQueryQuery, GetTopicsQueryQueryVariables>;
export const GetTranscriptDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTranscript"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transcript"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataSourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TranscriptFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TranscriptFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Transcript"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"speakers"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingFragment"}}]}}]}}]} as unknown as DocumentNode<GetTranscriptQuery, GetTranscriptQueryVariables>;
export const GetUnacknowledgedMisalignmentAlertsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUnacknowledgedMisalignmentAlerts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unacknowledgedMisalignmentAlerts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UnacknowledgedMisalignmentFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UnacknowledgedMisalignmentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MisalignmentAlert"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"violatedValue"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetUnacknowledgedMisalignmentAlertsQuery, GetUnacknowledgedMisalignmentAlertsQueryVariables>;
export const GetUnreadTeamMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUnreadTeamMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadTeamMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"unread_team_messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetUnreadTeamMessagesQuery, GetUnreadTeamMessagesQueryVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const GetWidgetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWidgets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"widgets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WidgetFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WidgetFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Widget"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}}]}}]} as unknown as DocumentNode<GetWidgetsQuery, GetWidgetsQueryVariables>;
export const GiveLiveInsightFeedbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GiveLiveInsightFeedback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GiveLiveInsightFeedbackInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"giveLiveInsightFeedback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"outbox_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode<GiveLiveInsightFeedbackMutation, GiveLiveInsightFeedbackMutationVariables>;
export const GetGoogleCalendarEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGoogleCalendarEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"onDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleCalendarEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"onDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"onDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"dateRange"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"start"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dateTime"}},{"kind":"Field","name":{"kind":"Name","value":"timeZone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"end"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dateTime"}},{"kind":"Field","name":{"kind":"Name","value":"timeZone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"responseStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conferenceData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entryPoints"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entryPointType"}},{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recurring_meeting_id"}}]}}]}}]} as unknown as DocumentNode<GetGoogleCalendarEventsQuery, GetGoogleCalendarEventsQueryVariables>;
export const GoogleCalendarRevokeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GoogleCalendarRevoke"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleCalendarRevoke"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<GoogleCalendarRevokeMutation, GoogleCalendarRevokeMutationVariables>;
export const HumanInTheLoopDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"HumanInTheLoop"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bot_meeting_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transcript_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"maps"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserSpeakerMapInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"humanInTheLoop"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"bot_meeting_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bot_meeting_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"transcript_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transcript_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"maps"},"value":{"kind":"Variable","name":{"kind":"Name","value":"maps"}}}]}]}}]} as unknown as DocumentNode<HumanInTheLoopMutation, HumanInTheLoopMutationVariables>;
export const IgnoreMeetingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"IgnoreMeeting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"meetingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ignoreMeeting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"meetingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"meetingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingSessionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSession"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_invite"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeetingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Meeting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"organizer"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeetingSessionFragment"}}]}}]}}]} as unknown as DocumentNode<IgnoreMeetingMutation, IgnoreMeetingMutationVariables>;
export const InvitePulseGuestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InvitePulseGuest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InvitePulseGuestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invitePulseGuest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<InvitePulseGuestMutation, InvitePulseGuestMutationVariables>;
export const InviteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InviteUserInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<InviteUserMutation, InviteUserMutationVariables>;
export const LinkGoogleCalendarDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkGoogleCalendar"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkGoogleCalendar"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<LinkGoogleCalendarMutation, LinkGoogleCalendarMutationVariables>;
export const MarkDirectMessagesAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkDirectMessagesAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markDirectMessagesAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"threadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}}]}]}}]} as unknown as DocumentNode<MarkDirectMessagesAsReadMutation, MarkDirectMessagesAsReadMutationVariables>;
export const MarkTeamMessagesAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkTeamMessagesAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markTeamMessagesAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"threadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}},{"kind":"Argument","name":{"kind":"Name","value":"topicId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}}}]}]}}]} as unknown as DocumentNode<MarkTeamMessagesAsReadMutation, MarkTeamMessagesAsReadMutationVariables>;
export const GetMeetingSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMeetingSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MeetingSessionStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"onDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"origin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Origin"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"meetingSessions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"onDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"onDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"dateRange"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateRange"}}},{"kind":"Argument","name":{"kind":"Name","value":"origin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"origin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingUrl"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"invite_pulse"}},{"kind":"Field","name":{"kind":"Name","value":"gcal_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"external_attendees"}},{"kind":"Field","name":{"kind":"Name","value":"recurring_meeting_id"}},{"kind":"Field","name":{"kind":"Name","value":"companion_status"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"agendas"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}}]}}]}}]} as unknown as DocumentNode<GetMeetingSessionsQuery, GetMeetingSessionsQueryVariables>;
export const NotificationSoundUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NotificationSoundUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationSoundUrl"}}]}}]} as unknown as DocumentNode<NotificationSoundUrlQuery, NotificationSoundUrlQueryVariables>;
export const OnboardingAgreeToTermsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingAgreeToTerms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingAgreeToTermsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingAgreeToTerms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<OnboardingAgreeToTermsMutation, OnboardingAgreeToTermsMutationVariables>;
export const OnboardingCompleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingComplete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingCompleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingComplete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<OnboardingCompleteMutation, OnboardingCompleteMutationVariables>;
export const OnboardingConfirmDataSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingConfirmDataSources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingConfirmDataSourcesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingConfirmDataSources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<OnboardingConfirmDataSourcesMutation, OnboardingConfirmDataSourcesMutationVariables>;
export const OnboardingConfirmSlackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingConfirmSlack"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingConfirmSlackInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingConfirmSlack"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<OnboardingConfirmSlackMutation, OnboardingConfirmSlackMutationVariables>;
export const OnboardingGenerateSlackInstallUriDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingGenerateSlackInstallUri"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingGenerateSlackInstallUriInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingGenerateSlackInstallUri"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uri"}}]}}]}}]} as unknown as DocumentNode<OnboardingGenerateSlackInstallUriMutation, OnboardingGenerateSlackInstallUriMutationVariables>;
export const OrganizationNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"organizationNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginatorInfoFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"data_source_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"summaryId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaginatorInfoFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginatorInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode<OrganizationNotificationsQuery, OrganizationNotificationsQueryVariables>;
export const PinOrganizationUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PinOrganizationUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PinOrganizationUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pinOrganizationUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]} as unknown as DocumentNode<PinOrganizationUserMutation, PinOrganizationUserMutationVariables>;
export const PulseNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"pulseNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulseNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"data_source_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"summaryId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]} as unknown as DocumentNode<PulseNotificationsQuery, PulseNotificationsQueryVariables>;
export const ReadNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReadNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReadNotificationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ReadNotificationMutation, ReadNotificationMutationVariables>;
export const ReadNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReadNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ReadNotificationsMutation, ReadNotificationsMutationVariables>;
export const RedoMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"redoMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RedoMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redoMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MessageFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MessageFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_saved"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"thread_id"}},{"kind":"Field","name":{"kind":"Name","value":"topic_id"}},{"kind":"Field","name":{"kind":"Name","value":"savedMessages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RedoMessageMutation, RedoMessageMutationVariables>;
export const RefetchIntegrationMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"refetchIntegrationMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RefetchIntegrationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refetchIntegration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"api_key"}},{"kind":"Field","name":{"kind":"Name","value":"sync_status"}}]}}]} as unknown as DocumentNode<RefetchIntegrationMutationMutation, RefetchIntegrationMutationMutationVariables>;
export const SaveMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"saveMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SaveMessageMutation, SaveMessageMutationVariables>;
export const SearchTeamThreadMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchTeamThreadMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchTeamThreadMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"topicId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"topicId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"topicId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isParentReply"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"topic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"groupedReactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reaction"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"picture"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"file_name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"dataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"paginatorInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasMorePages"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}}]}}]}}]} as unknown as DocumentNode<SearchTeamThreadMessagesQuery, SearchTeamThreadMessagesQueryVariables>;
export const StartMcpAuthorizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartMCPAuthorization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpServer"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MCPServer"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"redirectUri"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startMCPAuthorization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mcpServer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mcpServer"}}},{"kind":"Argument","name":{"kind":"Name","value":"redirectUri"},"value":{"kind":"Variable","name":{"kind":"Name","value":"redirectUri"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authUrl"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"mcpUrl"}},{"kind":"Field","name":{"kind":"Name","value":"authServerInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorizationEndpoint"}},{"kind":"Field","name":{"kind":"Name","value":"tokenEndpoint"}},{"kind":"Field","name":{"kind":"Name","value":"registrationEndpoint"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"scopesSupported"}},{"kind":"Field","name":{"kind":"Name","value":"responseTypesSupported"}},{"kind":"Field","name":{"kind":"Name","value":"grantTypesSupported"}}]}}]}}]}}]} as unknown as DocumentNode<StartMcpAuthorizationMutation, StartMcpAuthorizationMutationVariables>;
export const ToggleDirectMessageReactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleDirectMessageReaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ToggleDirectMessageReactionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleDirectMessageReaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ToggleDirectMessageReactionMutation, ToggleDirectMessageReactionMutationVariables>;
export const ToggleTeamMessageReactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleTeamMessageReaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ToggleTeamMessageReactionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleTeamMessageReaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ToggleTeamMessageReactionMutation, ToggleTeamMessageReactionMutationVariables>;
export const UnpinOrganizationUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnpinOrganizationUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnpinOrganizationUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unpinOrganizationUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]} as unknown as DocumentNode<UnpinOrganizationUserMutation, UnpinOrganizationUserMutationVariables>;
export const UnreadDirectMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UnreadDirectMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadDirectMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"directMessageThreads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unread_direct_messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"directMessageThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}}]}}]}}]}}]} as unknown as DocumentNode<UnreadDirectMessagesQuery, UnreadDirectMessagesQueryVariables>;
export const UnreadTeamMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UnreadTeamMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadTeamMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"unread_team_messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UnreadTeamMessagesQuery, UnreadTeamMessagesQueryVariables>;
export const UpdateActiveThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateActiveThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateActiveThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"threadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Thread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<UpdateActiveThreadMutation, UpdateActiveThreadMutationVariables>;
export const UpdateAgendaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAgenda"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAgendaInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAgenda"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<UpdateAgendaMutation, UpdateAgendaMutationVariables>;
export const UpdateAgendaOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAgendaOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AgendaOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAgendaOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<UpdateAgendaOrderMutation, UpdateAgendaOrderMutationVariables>;
export const UpdateAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAgentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateAgentMutation, UpdateAgentMutationVariables>;
export const UpdateAiAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAiAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAiAgentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAiAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AiAgentFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AiAgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AiAgent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guidelines"}},{"kind":"Field","name":{"kind":"Name","value":"agent_type"}},{"kind":"Field","name":{"kind":"Name","value":"credentials"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]} as unknown as DocumentNode<UpdateAiAgentMutation, UpdateAiAgentMutationVariables>;
export const UpdateBackgroundDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateBackground"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateBackgroundInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateBackground"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BackgroundFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BackgroundFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Background"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"image_url"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<UpdateBackgroundMutation, UpdateBackgroundMutationVariables>;
export const UpdateChecklistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateChecklist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateChecklistInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateChecklist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<UpdateChecklistMutation, UpdateChecklistMutationVariables>;
export const UpdateChecklistOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateChecklistOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChecklistOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateChecklistOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]} as unknown as DocumentNode<UpdateChecklistOrderMutation, UpdateChecklistOrderMutationVariables>;
export const UpdateDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"is_viewable"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"meetingSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"event_id"}},{"kind":"Field","name":{"kind":"Name","value":"start_at"}},{"kind":"Field","name":{"kind":"Name","value":"end_at"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcript"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tldr"}}]}}]} as unknown as DocumentNode<UpdateDataSourceMutation, UpdateDataSourceMutationVariables>;
export const UpdateDirectMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDirectMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDirectMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDirectMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateDirectMessageMutation, UpdateDirectMessageMutationVariables>;
export const UpdateEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEventInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}}]}}]}}]} as unknown as DocumentNode<UpdateEventMutation, UpdateEventMutationVariables>;
export const MarkLiveInsightClosedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkLiveInsightClosed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkLiveInsightClosedInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markLiveInsightClosed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"delivery_status"}}]}}]}}]} as unknown as DocumentNode<MarkLiveInsightClosedMutation, MarkLiveInsightClosedMutationVariables>;
export const MarkLiveInsightSeenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkLiveInsightSeen"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkLiveInsightSeenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markLiveInsightSeen"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"delivery_status"}}]}}]}}]} as unknown as DocumentNode<MarkLiveInsightSeenMutation, MarkLiveInsightSeenMutationVariables>;
export const UpdateMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"organizationUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]} as unknown as DocumentNode<UpdateMeMutation, UpdateMeMutationVariables>;
export const UpdateNoteOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNoteOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NoteOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNoteOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"labels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}}]}}]}}]} as unknown as DocumentNode<UpdateNoteOrderMutation, UpdateNoteOrderMutationVariables>;
export const UpdateLabelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLabel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLabelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLabel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]} as unknown as DocumentNode<UpdateLabelMutation, UpdateLabelMutationVariables>;
export const UpdateNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"labels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"entity_type"}},{"kind":"Field","name":{"kind":"Name","value":"entity_id"}},{"kind":"Field","name":{"kind":"Name","value":"organization_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateNoteMutation, UpdateNoteMutationVariables>;
export const UpdateNotificationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNotificationStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNotificationStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotificationStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"summary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"data_source_id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"summaryId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]} as unknown as DocumentNode<UpdateNotificationStatusMutation, UpdateNotificationStatusMutationVariables>;
export const UpdateOrganizationGroupMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganizationGroupMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrCreateOrganizationGroupMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganizationGroupMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseMemberFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<UpdateOrganizationGroupMemberMutation, UpdateOrganizationGroupMemberMutationVariables>;
export const UpdateOrganizationGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganizationGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganizationGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationGroupFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationGroupFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupMemberFragment"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationGroupMutation, UpdateOrganizationGroupMutationVariables>;
export const UpdateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;
export const UpdateOrganizationUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganizationUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganizationUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationUserMutation, UpdateOrganizationUserMutationVariables>;
export const UpdateOrganizationUserRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganizationUserRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationUserRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganizationUserRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationUserRoleMutation, UpdateOrganizationUserRoleMutationVariables>;
export const PinDirectMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PinDirectMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"directMessageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pinDirectMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"directMessageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"directMessageId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pinned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"directMessageThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isEdited"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"repliedToMessageId"}}]}}]}}]} as unknown as DocumentNode<PinDirectMessageMutation, PinDirectMessageMutationVariables>;
export const UpdatePinTeamMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePinTeamMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamMessageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pinTeamMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamMessageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamMessageId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pinned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]}}]} as unknown as DocumentNode<UpdatePinTeamMessageMutation, UpdatePinTeamMessageMutationVariables>;
export const UpdatePulseLastVisitedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePulseLastVisited"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePulseLastVisited"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseMemberFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<UpdatePulseLastVisitedMutation, UpdatePulseLastVisitedMutationVariables>;
export const UpdatePulseMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePulseMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePulseMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePulseMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseMemberFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseMemberFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PulseMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"job_description"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"jobDescription"}},{"kind":"Field","name":{"kind":"Name","value":"responsibilities"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}}]}}]} as unknown as DocumentNode<UpdatePulseMemberMutation, UpdatePulseMemberMutationVariables>;
export const UpdatePulseMemberRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePulseMemberRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePulseMemberRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePulseMemberRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<UpdatePulseMemberRoleMutation, UpdatePulseMemberRoleMutationVariables>;
export const UpdatePulseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePulse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePulseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePulse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}}]} as unknown as DocumentNode<UpdatePulseMutation, UpdatePulseMutationVariables>;
export const UpdatePulseOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePulseOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePulseOrderInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePulseOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PulseFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PulseFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pulse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"unread_notifications"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasGuest"}},{"kind":"Field","name":{"kind":"Name","value":"member_count"}},{"kind":"Field","name":{"kind":"Name","value":"saved_message_count"}},{"kind":"Field","name":{"kind":"Name","value":"notification_count"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}}]} as unknown as DocumentNode<UpdatePulseOrderMutation, UpdatePulseOrderMutationVariables>;
export const UpdatePulseTaskStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePulseTaskStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePulseTaskStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePulseTaskStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdatePulseTaskStatusMutation, UpdatePulseTaskStatusMutationVariables>;
export const UpdateRecommendationActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRecommendationAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRecommendationActionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRecommendationAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<UpdateRecommendationActionMutation, UpdateRecommendationActionMutationVariables>;
export const UpdateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SettingFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SettingFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Setting"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"weekendDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingMutation, UpdateSettingMutationVariables>;
export const UpdateStrategyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStrategy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStrategyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStrategy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StrategyFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StrategyFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Strategy"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<UpdateStrategyMutation, UpdateStrategyMutationVariables>;
export const UpdateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const UpdateTaskOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTaskOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskOrderInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTaskOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateTaskOrderMutation, UpdateTaskOrderMutationVariables>;
export const UpdateTaskStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTaskStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTaskStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTaskStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskChildFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"due_date"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"task_status_id"}},{"kind":"Field","name":{"kind":"Name","value":"taskStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"entity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskChildFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dependencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"task_number"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateTaskStatusMutation, UpdateTaskStatusMutationVariables>;
export const UpdateTaskStatusOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTaskStatusOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskStatusOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTaskStatusOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pulse_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateTaskStatusOrderMutation, UpdateTaskStatusOrderMutationVariables>;
export const UpdateTeamMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTeamMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeamMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeamMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isParentReply"}},{"kind":"Field","name":{"kind":"Name","value":"replyTeamThreadId"}},{"kind":"Field","name":{"kind":"Name","value":"topicId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTeamMessageMutation, UpdateTeamMessageMutationVariables>;
export const UpdateThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateThreadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ThreadFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Thread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"pulseId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<UpdateThreadMutation, UpdateThreadMutationVariables>;
export const UpdateTimesheetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTimesheet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTimesheetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTimesheet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"checked_in_at"}},{"kind":"Field","name":{"kind":"Name","value":"checked_out_at"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<UpdateTimesheetMutation, UpdateTimesheetMutationVariables>;
export const UpdateTopicDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTopic"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTopicInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTopic"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"creator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamThread"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTopicMutation, UpdateTopicMutationVariables>;
export const UpdateWidgetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateWidget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWidgetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWidget"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WidgetFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WidgetFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Widget"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}}]}}]} as unknown as DocumentNode<UpdateWidgetMutation, UpdateWidgetMutationVariables>;
export const UpdateWidgetsOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateWidgetsOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WidgetOrderInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWidgetOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WidgetFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WidgetFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Widget"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"columns"}}]}}]} as unknown as DocumentNode<UpdateWidgetsOrderMutation, UpdateWidgetsOrderMutationVariables>;
export const UserActiveTimesheetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserActiveTimesheet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userActiveTimesheet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"checked_in_at"}},{"kind":"Field","name":{"kind":"Name","value":"checked_out_at"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<UserActiveTimesheetQuery, UserActiveTimesheetQueryVariables>;
export const AcceptInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AcceptInvitationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AcceptInvitationMutation, AcceptInvitationMutationVariables>;
export const CreateCompletionBaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCompletionBase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCompletionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCompletion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}}]}}]} as unknown as DocumentNode<CreateCompletionBaseMutation, CreateCompletionBaseMutationVariables>;
export const CreateLiveUploadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createLiveUpload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLiveUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLiveUpload"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"fullContent"}},{"kind":"Field","name":{"kind":"Name","value":"summaryContent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateLiveUploadMutation, CreateLiveUploadMutationVariables>;
export const GenerateLiveUploadCredentialsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateLiveUploadCredentials"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateUploadCredentialsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateLiveUploadCredentials"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GenerateLiveUploadCredentialsMutation, GenerateLiveUploadCredentialsMutationVariables>;
export const GenerateUploadCredentialsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GenerateUploadCredentials"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateUploadCredentialsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateUploadCredentials"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<GenerateUploadCredentialsMutation, GenerateUploadCredentialsMutationVariables>;
export const SignInUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignInUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignInUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signInUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SignInUserMutation, SignInUserMutationVariables>;
export const AgentsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AgentsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pulseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pulseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"prompt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AgentsQueryQuery, AgentsQueryQueryVariables>;
export const MeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MeQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}},{"kind":"Field","name":{"kind":"Name","value":"organizationUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationUserFragment"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationUserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"jobTitle"}},{"kind":"Field","name":{"kind":"Name","value":"department"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"one_to_one"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}}]}}]}}]} as unknown as DocumentNode<MeQueryQuery, MeQueryQueryVariables>;
export const OrganizationsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slackTeamId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"slackTeamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slackTeamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slackTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiStaffId"}},{"kind":"Field","name":{"kind":"Name","value":"zunouAiUserId"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileKey"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<OrganizationsQueryQuery, OrganizationsQueryQueryVariables>;
export const SlackCredentialsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SlackCredentialsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slackTeamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slackCredentials"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slackTeamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slackTeamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"slackAccessToken"}}]}}]}}]} as unknown as DocumentNode<SlackCredentialsQueryQuery, SlackCredentialsQueryQueryVariables>;
export const GetSlackUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSlackUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slackId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slackUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"slackId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slackId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastOrganizationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"slackId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"gravatar"}},{"kind":"Field","name":{"kind":"Name","value":"presence"}},{"kind":"Field","name":{"kind":"Name","value":"google_calendar_linked"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"firstLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboarded"}},{"kind":"Field","name":{"kind":"Name","value":"requestDeleteAt"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"industry"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pulseMemberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"pulse"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetSlackUserQuery, GetSlackUserQueryVariables>;