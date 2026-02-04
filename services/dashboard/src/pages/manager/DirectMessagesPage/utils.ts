import {
  File,
  TeamMessage,
  TeamMessageGroupedReaction,
} from '@zunou-graphql/core/graphql'

import { DirectMessageGroupedReaction, PartialDirectMessage } from './hooks'

// Shared constants to avoid recreating objects on every transformation
const EMPTY_PAGINATOR_INFO = {
  __typename: 'PaginatorInfo' as const,
  count: 0,
  currentPage: 1,
  hasMorePages: false,
  lastPage: 1,
  perPage: 10,
  total: 0,
}

const EMPTY_ORGANIZATION_USER_PAGINATOR = {
  __typename: 'OrganizationUserPaginator' as const,
  data: [],
  paginatorInfo: EMPTY_PAGINATOR_INFO,
}

const EMPTY_PULSE_MEMBER_PAGINATOR = {
  __typename: 'PulseMemberPaginator' as const,
  data: [],
  paginatorInfo: EMPTY_PAGINATOR_INFO,
}

/**
 * Transforms DirectMessageFile to File format for TeamMessage
 */
const transformDirectMessageFileToFile = (
  file: NonNullable<PartialDirectMessage['files']>[0],
): File => {
  return {
    __typename: 'File' as const,
    created_at: file.created_at,
    dataSource: null,
    dataSourceId: file.dataSourceId ?? null,
    entity_id: file.entity_id,
    entity_type: file.entity_type,
    file_name: file.file_name ?? null,
    id: file.id,
    organization_id: file.organization_id,
    path: file.path,
    pulse_id: file.pulse_id ?? null,
    size: file.size ?? null,
    type: file.type ?? null,
    updated_at: file.updated_at,
    url: file.url ?? null,
  }
}

/**
 * Transforms DirectMessageGroupedReaction to TeamMessageGroupedReaction format
 */
const transformGroupedReactions = (
  groupedReactions?: DirectMessageGroupedReaction[],
): TeamMessageGroupedReaction[] => {
  if (!groupedReactions || groupedReactions.length === 0) {
    return []
  }

  return groupedReactions.map((gr) => ({
    __typename: 'TeamMessageGroupedReaction' as const,
    count: gr.count,
    reaction: gr.reaction,
    users: gr.users.map((user) => ({
      __typename: 'User' as const,
      createdAt: user.createdAt || '',
      email: user.email,
      google_calendar_linked: user.google_calendar_linked || false,
      gravatar: user.gravatar,
      id: user.id,
      name: user.name,
      onboarded: user.onboarded || null,
      organizationUsers: EMPTY_ORGANIZATION_USER_PAGINATOR,
      permissions: user.permissions || [],
      picture: user.picture || null,
      pulseMemberships: EMPTY_PULSE_MEMBER_PAGINATOR,
      unread_direct_messages: [],
      updatedAt: user.updatedAt || '',
    })),
  }))
}

/**
 * Transforms PartialDirectMessage to TeamMessage format for ChatMessageList
 */
export const transformDirectMessagesToTeamMessages = (
  messages: PartialDirectMessage[],
): TeamMessage[] => {
  return messages.map((msg: PartialDirectMessage) => ({
    __typename: 'TeamMessage' as const,
    content: msg.content,
    createdAt: msg.createdAt,
    deletedAt: msg.deletedAt || null,
    files:
      msg.files && msg.files.length > 0
        ? msg.files.map(transformDirectMessageFileToFile)
        : null,
    groupedReactions: transformGroupedReactions(msg.groupedReactions),
    id: msg.id,
    isDeleted: Boolean(msg.deletedAt),
    isEdited: msg.isEdited,
    isParentReply: false,
    isPinned: msg.isPinned ?? false,
    isRead: false,
    metadata: null,
    repliedToMessage: msg.repliedToMessage
      ? {
          __typename: 'TeamMessage' as const,
          content: msg.repliedToMessage.content,
          createdAt: msg.createdAt,
          deletedAt: msg.repliedToMessage.deletedAt || null,
          files: null,
          groupedReactions: [],
          id: msg.repliedToMessage.id,
          isDeleted: Boolean(msg.repliedToMessage.deletedAt),
          isEdited: msg.repliedToMessage.isEdited ?? false,
          isParentReply: false,
          isPinned: false,
          isRead: false,
          metadata: null,
          repliedToMessage: null,
          repliedToMessageId: null,
          replyTeamThreadId: null,
          teamThreadId: msg.directMessageThreadId,
          topic: null,
          topicId: null,
          updatedAt: msg.updatedAt,
          user: {
            __typename: 'User' as const,
            createdAt: msg.createdAt,
            email: msg.repliedToMessage.sender.email || '',
            google_calendar_linked: false,
            gravatar: msg.repliedToMessage.sender.gravatar,
            id: msg.repliedToMessage.sender.id,
            name: msg.repliedToMessage.sender.name,
            organizationUsers: EMPTY_ORGANIZATION_USER_PAGINATOR,
            permissions: [],
            pulseMemberships: EMPTY_PULSE_MEMBER_PAGINATOR,
            unread_direct_messages: [],
            updatedAt: msg.updatedAt,
          },
          userId: msg.repliedToMessage.sender.id,
        }
      : null,
    repliedToMessageId: msg.repliedToMessageId || null,
    replyTeamThreadId: null,
    teamThreadId: msg.directMessageThreadId,
    topic: null,
    topicId: null,
    updatedAt: msg.updatedAt,
    user: {
      __typename: 'User' as const,
      createdAt: msg.createdAt,
      email: msg.sender.email,
      google_calendar_linked: false,
      gravatar: msg.sender.gravatar,
      id: msg.sender.id,
      name: msg.sender.name,
      organizationUsers: EMPTY_ORGANIZATION_USER_PAGINATOR,
      permissions: [],
      pulseMemberships: EMPTY_PULSE_MEMBER_PAGINATOR,
      unread_direct_messages: [],
      updatedAt: msg.updatedAt,
    },
    userId: msg.sender.id,
  }))
}
