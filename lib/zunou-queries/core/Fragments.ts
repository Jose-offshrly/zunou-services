import { graphql } from '@zunou-graphql/core/gql'

// We keep all fields separately here to avoid circular imports.

graphql(/* GraphQL */ `
  fragment AgentFragment on Agent {
    createdAt
    id
    name
    organizationId
    prompt
    updatedAt
  }
`)

graphql(/* GraphQL */ `
  fragment AiAgentFragment on AiAgent {
    id
    pulseId
    organizationId
    name
    description
    guidelines
    agent_type
    credentials
    created_at
    updated_at
  }
`)

graphql(/* GraphQL */ `
  fragment BackgroundFragment on Background {
    id
    userId
    active
    image_url
    metadata {
      fileKey
      fileName
    }
  }
`)

graphql(/* GraphQL */ `
  fragment DataSourceFragment on DataSource {
    createdAt
    description
    id
    is_viewable
    name
    organizationId
    status
    summary
    type
    updatedAt
    origin
    meeting {
      id
      meetingId
      meetingSession {
        id
        event_id
        start_at
        end_at
      }
      title
      date
    }
    transcript {
      id
    }
    tldr
  }
`)

graphql(/* GraphQL */ `
  fragment MessageFragment on Message {
    content
    createdAt
    id
    is_saved
    organizationId
    role
    status
    updatedAt
    thread_id
    topic_id
    savedMessages {
      id
    }
  }
`)

graphql(/* GraphQL */ `
  fragment OrganizationFragment on Organization {
    createdAt
    id
    name
    slackTeamId
    status
    subscriptionStatus
    updatedAt
    zunouAiStaffId
    zunouAiUserId
    industry
    description
    domain
    logo
    metadata {
      fileKey
      fileName
    }
    pulses {
      data {
        name
        id
      }
    }
  }
`)

graphql(/* GraphQL */ `
  fragment OrganizationUserFragment on OrganizationUser {
    createdAt
    id
    organizationId
    role
    status
    userId
    updatedAt
    jobTitle
    department
    profile
    one_to_one
    isPinned
    organization {
      name
      status
      subscriptionStatus
      domain
      industry
    }
    user {
      id
      name
      presence
      gravatar
    }
  }
`)

graphql(/* GraphQL */ `
  fragment PaginatorInfoFragment on PaginatorInfo {
    count
    currentPage
    hasMorePages
    lastPage
    perPage
    total
  }
`)

graphql(/* GraphQL */ `
  fragment ThreadFragment on Thread {
    createdAt
    id
    name
    organizationId
    updatedAt
    pulseId
    type
  }
`)

graphql(/* GraphQL */ `
  fragment UserFragment on User {
    createdAt
    email
    emailVerifiedAt
    id
    lastOrganizationId
    name
    permissions
    slackId
    updatedAt
    gravatar
    presence
    google_calendar_linked
    timezone
    firstLoginAt
    onboarded
    requestDeleteAt
    organizations {
      id
      name
      domain
      industry
      description
      logo
    }
    pulseMemberships {
      data {
        role
        pulse {
          name
          id
          organization {
            id
          }
        }
      }
    }
  }
`)

graphql(/* GraphQL */ `
  fragment UnacknowledgedMisalignmentFragment on MisalignmentAlert {
    id
    violatedValue
    summary
    severity
  }
`)

graphql(/* GraphQL */ `
  fragment PulseFragment on Pulse {
    id
    icon
    name
    type
    features
    description
    created_at
    updated_at
    unread_notifications
    threads {
      id
      name
      type
      isActive
      userId
    }
    hasGuest
    member_count
    saved_message_count
    notification_count
    category
  }
`)

graphql(/* GraphQL */ `
  fragment MasterPulseFragment on MasterPulse {
    id
    name
    type
    status
    features
    description
    createdAt
    updatedAt
  }
`)

graphql(/* GraphQL */ `
  fragment StrategyFragment on Strategy {
    id
    name
    pulseId
    organizationId
    description
    createdAt
    updatedAt
    type
  }
`)

graphql(/* GraphQL */ `
  fragment SavedMessageFragment on SavedMessage {
    id
    messageId
    userId
    created_at
    updated_at
    data {
      id
      content
      organizationId
      role
      threadId
      userId
    }
    thread {
      id
      type
      pulseId
      pulse {
        name
      }
    }
  }
`)

graphql(/* GraphQL */ `
  fragment NotificationFragment on Notification {
    id
    created_at
    updated_at
    status
    description
    pulse {
      id
      name
    }
    kind
    summary {
      id
      data_source_id
      pulse_id
    }
    context {
      taskId
      summaryId
    }
    users {
      id
      name
    }
    readAt
    isArchived
  }
`)

graphql(/* GraphQL */ `
  fragment MeetingFragment on Meeting {
    id
    pulseId
    userId
    meetingId
    title
    date
    organizer
    source
    timezone
    status
    dataSourceId
    meetingSession {
      ...MeetingSessionFragment
    }
  }
`)

graphql(/* GraphQL */ `
  fragment IntegrationFragment on Integration {
    id
    pulse_id
    user_id
    type
    api_key
    sync_status
  }
`)

graphql(/* GraphQL */ `
  fragment PulseMemberFragment on PulseMember {
    id
    pulseId
    userId
    role
    job_description
    responsibilities
    user {
      id
      name
      email
      presence
      gravatar
    }
    organizationUser {
      id
      jobTitle
      jobDescription
      responsibilities
      profile
      department
      role
    }
    created_at
    updated_at
    one_to_one
  }
`)

graphql(/* GraphQL */ `
  fragment GroupMemberFragment on GroupMember {
    id
    user {
      id
      name
      email
      presence
      gravatar
    }
    role
    order
    job_description
    responsibilities
  }
`)

graphql(/* GraphQL */ `
  fragment SettingFragment on Setting {
    id
    userId
    organizationId
    theme
    weekendDisplay
    color
    mode
    metadata {
      fileKey
      fileName
    }
  }
`)

graphql(/* GraphQL */ `
  fragment SummaryFragment on Summary {
    id
    data_source_id
    summary
    date
    name
    pulse_id
    attendees
    potential_strategies
    user_id
    action_items {
      title
      description
      assignees {
        id
        name
      }
      status
      priority
      due_date
      is_existing
    }
  }
`)

graphql(/* GraphQL */ `
  fragment StrategyDescriptionFragment on StrategyDescription {
    title
    description
    prompt_description
    isSuccess
  }
`)

graphql(/* GraphQL */ `
  fragment TaskFragment on Task {
    id
    task_number
    assignees {
      id
      user {
        id
        name
        gravatar
      }
    }
    parent {
      id
    }
    description
    due_date
    start_date
    priority
    status
    task_status_id
    taskStatus {
      id
      label
      color
    }
    dependencies {
      id
    }
    dependents {
      id
    }
    title
    type
    color
    progress
    entity {
      id
      name
    }
    children {
      ...TaskChildFragment
    }
    dependencies {
      id
      title
      task_number
    }
    order
    createdAt
    updatedAt
    createdBy {
      id
      name
    }
    updatedBy {
      id
      name
    }
  }
`)

graphql(/* GraphQL */ `
  fragment TaskChildFragment on Task {
    id
    assignees {
      id
      user {
        id
        name
        gravatar
      }
    }
    parent {
      id
      title
    }
    description
    due_date
    start_date
    priority
    status
    task_status_id
    taskStatus {
      id
      label
      color
    }
    dependencies {
      id
    }
    dependents {
      id
    }
    title
    type
    color
    progress
    entity {
      id
      name
    }
    order
  }
`)

graphql(/* GraphQL */ `
  fragment WidgetFragment on Widget {
    id
    userId
    organizationId
    name
    order
    columns
  }
`)

graphql(/* GraphQL */ `
  fragment OrganizationGroupFragment on OrganizationGroup {
    id
    name
    description
    created_at
    pulse {
      ...PulseFragment
    }
    organization {
      ...OrganizationFragment
    }
    pulseMembers {
      ...GroupMemberFragment
    }
  }
`)

graphql(/* GraphQL */ `
  fragment TranscriptFragment on Transcript {
    id
    meetingId
    content
    dataSourceId
    speakers
    meeting {
      ...MeetingFragment
    }
  }
`)

graphql(/* GraphQL */ `
  fragment MeetingSessionFragment on MeetingSession {
    id
    meetingId
    meetingUrl
    type
    status
    pulseId
    userId
    organizationId
    name
    description
    start_at
    end_at
    external_attendees
    invite_pulse
    gcal_meeting_id
    recurring_invite
    attendees {
      id
      user {
        id
        name
        email
        gravatar
      }
    }
    dataSource {
      id
    }
  }
`)

graphql(/* GraphQL */ `
  fragment ActivityFragment on Activity {
    id
    description
    causer {
      id
      name
      gravatar
      presence
    }
    subjectType
    organizationId
    pulseId
    receiverId
    properties
    createdAt
    updatedAt
    feedType
  }
`)

graphql(/* GraphQL */ `
  fragment PulseWelcomeDataFragment on PulseWelcomeData {
    pulseId
    userId
    lastVisited
    dataSources {
      ...DataSourceFragment
    }
    meetings {
      ...MeetingFragment
    }
    tasks {
      ...TaskFragment
    }
  }
`)

graphql(/* GraphQL */ `
  fragment EventFragment on Event {
    id
    name
    date
    start_at
    end_at
    location
    priority
    attendees {
      id
      user {
        name
        email
        gravatar
      }
    }
    guests
    participants {
      name
      email
      gravatar
    }
    files
    pulse_id
    organization_id
    user_id
    google_event_id
    meetingSession {
      ...MeetingSessionFragment
    }
    meeting {
      dataSourceId
    }
    link
    summary
    location
  }
`)

graphql(/* GraphQL */ `
  fragment EventInstanceFragment on EventInstance {
    id
    event_id
    pulse_id
    local_description
    priority
    created_at
    updated_at
    event {
      ...EventFragment
    }
    pulse {
      id
    }
  }
`)

graphql(/* GraphQL */ `
  fragment ActionableFragment on Actionable {
    id
    description
    pulse_id
    organization_id
    event_id
    task_id
    status
    created_at
    updated_at
  }
`)

graphql(/* GraphQL */ `
  fragment NotificationPreferenceFragment on NotificationPreference {
    id
    scopeType
    scopeId
    mode
    createdAt
    updatedAt
  }
`)
