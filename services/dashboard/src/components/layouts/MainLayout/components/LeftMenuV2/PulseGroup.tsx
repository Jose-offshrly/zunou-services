import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Add } from '@mui/icons-material'
import { Stack, Tooltip, Typography } from '@mui/material'
import { PulseCategory } from '@zunou-graphql/core/graphql'
import { useUnreadTeamMessagesQuery } from '@zunou-queries/core/hooks/useUnreadTeamMessagesQuery'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { useLeftMenuStore } from '~/store/useLeftMenuStore'
import {
  SelectedTab,
  SelectedTabEnum,
  usePulseStore,
} from '~/store/usePulseStore'

import { MenuLink } from '.'
import CollapsibleChatButton from './CollapsibleChatButton'
import PulseGroupAccordion from './PulseGroupAccordion'
import SortablePulseItem from './SortablePulseItem'

interface Props {
  links: MenuLink[]
  category: PulseCategory
  onLinksReorder?: (reorderedLinks: MenuLink[]) => void
  disableReordering?: boolean
  collapsed?: boolean
  titleClassName?: string
}

interface LinkWithOrder extends MenuLink {
  order?: number
}

const DRAG_DELAY = 500

export default function PulseGroup({
  links,
  category,
  onLinksReorder,
  disableReordering = false,
  collapsed = false,
  titleClassName,
}: Props) {
  const { pulseActions } = usePulseStore()
  const { organizationId } = useOrganization()
  const { userRole } = useAuthContext()

  // Use selective subscription - only subscribe to setIsDragging function
  const setGlobalIsDragging = useLeftMenuStore((state) => state.setIsDragging)

  // Query for unread team messages
  const { data: unreadPulses } = useUnreadTeamMessagesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const navigate = useNavigate()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isReorderingRef = useRef(false)

  const [orderedLinks, setOrderedLinks] = useState<LinkWithOrder[]>(() => {
    return links
      .map((link, index) => ({
        ...link,
        order: index,
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  // Use useEffect instead of useMemo for side effects
  useEffect(() => {
    // Don't update if we're currently reordering
    if (isReorderingRef.current) {
      return
    }

    const newOrderedLinks = links
      .map((link, index) => ({
        ...link,
        order: index,
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    setOrderedLinks(newOrderedLinks)
  }, [links])

  const sortableItems = useMemo(() => {
    return orderedLinks.map((link) => link.pulseId)
  }, [orderedLinks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: DRAG_DELAY,
        tolerance: 5,
      },
    }),
  )

  // Derived Values
  const title =
    category === PulseCategory.Onetoone
      ? collapsed
        ? 'DMs'
        : 'DIRECT MESSAGES'
      : category === PulseCategory.Team
        ? 'TEAMS'
        : 'PERSONAL'
  const rolePrefix = userRole && userRole.toLowerCase()

  const redirectToPulse = ({
    pulseId,
    selectedTab,
  }: {
    pulseId: string
    selectedTab: SelectedTab
  }) => {
    switch (selectedTab) {
      case SelectedTabEnum.PULSE:
        navigate(
          pathFor({
            pathname: `/${rolePrefix}/${Routes.PulseDetail}`,
            query: {
              organizationId,
              pulseId,
            },
          }),
        )
        break
      case SelectedTabEnum.TEAM_CHAT:
        navigate(
          pathFor({
            pathname: `/${rolePrefix}/${Routes.PulseTeamChat}`,
            query: {
              organizationId,
              pulseId,
            },
          }),
        )
        break
      case SelectedTabEnum.TASKS:
        navigate(
          pathFor({
            pathname: `/${rolePrefix}/${Routes.PulseTasks}`,
            query: {
              organizationId,
              pulseId,
            },
          }),
        )
        break
      case SelectedTabEnum.ORG_CHART:
        navigate(
          pathFor({
            pathname: `/${rolePrefix}/${Routes.OrgChart}`,
            query: {
              organizationId,
              pulseId,
            },
          }),
        )
        break
      case SelectedTabEnum.NOTES:
        navigate(
          pathFor({
            pathname: `/${rolePrefix}/${Routes.PulseNotes}`,
            query: {
              organizationId,
              pulseId,
            },
          }),
        )
        break
      case SelectedTabEnum.FEED:
        navigate(
          pathFor({
            pathname: `/${rolePrefix}/${Routes.PulseFeed}`,
            query: {
              organizationId,
              pulseId,
            },
          }),
        )
        break
      default:
        navigate(
          pathFor({
            pathname: `/${rolePrefix}/${Routes.PulseDetail}`,
            query: {
              organizationId,
              pulseId,
            },
          }),
        )
        break
    }
  }

  const handleLinkClick = ({
    pulseId,
    selectedTab,
  }: {
    pulseId: string | null
    selectedTab?: SelectedTab
  }) => {
    try {
      // Prevent navigation if we're dragging
      if (isDragging) {
        return
      }

      if (!pulseId) return

      const pulseAction = pulseActions.find((pulse) => pulse.id === pulseId)
      redirectToPulse({
        pulseId,
        selectedTab: selectedTab
          ? selectedTab
          : pulseAction?.activeTab?.selectedTab ?? SelectedTabEnum.PULSE,
      })
    } catch (error) {
      console.error('Failed to redirect.', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (disableReordering) return

    setActiveId(event.active.id as string)
    setIsDragging(true)
    setGlobalIsDragging(true)
    isReorderingRef.current = true
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (disableReordering) return

    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      setIsDragging(false)
      setGlobalIsDragging(false)
      isReorderingRef.current = false
      return
    }

    const oldIndex = orderedLinks.findIndex(
      (link) => link.pulseId === active.id,
    )
    const newIndex = orderedLinks.findIndex((link) => link.pulseId === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderedLinks = [...orderedLinks]
      const [movedItem] = newOrderedLinks.splice(oldIndex, 1)
      newOrderedLinks.splice(newIndex, 0, movedItem)

      const reorderedLinks = newOrderedLinks.map((link, index) => ({
        ...link,
        order: index,
      }))

      setOrderedLinks(reorderedLinks)
      onLinksReorder?.(reorderedLinks)

      // Keep the reordering flag true briefly to prevent premature updates
      setTimeout(() => {
        isReorderingRef.current = false
      }, 100)
    }

    setActiveId(null)
    setIsDragging(false)
    setGlobalIsDragging(false)
  }

  const handleDragCancel = () => {
    if (disableReordering) return

    setActiveId(null)
    setIsDragging(false)
    setGlobalIsDragging(false)
    isReorderingRef.current = false
  }

  const createPath =
    category === PulseCategory.Onetoone
      ? Routes.PulseCreateOneOnOne
      : category === PulseCategory.Team
        ? Routes.PulseCreateCustom
        : null

  const isDraggableCategory =
    category === PulseCategory.Onetoone || category === PulseCategory.Team

  const shouldEnableDragging = isDraggableCategory && !disableReordering

  const activeLink = activeId
    ? orderedLinks.find((link) => link.pulseId === activeId)
    : null

  // Check if any pulse in this group has unread messages
  const hasUnreadPulses = useMemo(() => {
    if (!Array.isArray(unreadPulses) || unreadPulses.length === 0) {
      return false
    }

    // Get all pulse IDs from unread pulses that have unread messages
    const unreadPulseIds = unreadPulses
      .filter((pulse) => pulse.unread_team_messages?.length > 0)
      .map((pulse) => pulse.id)

    // Check if any link in this group matches an unread pulse
    return orderedLinks.some((link) => unreadPulseIds.includes(link.pulseId))
  }, [unreadPulses, orderedLinks])

  const linksList = orderedLinks.map((link) => {
    const content = (
      <CollapsibleChatButton
        collapsed={collapsed}
        link={link}
        onLinkClick={handleLinkClick}
      />
    )

    if (!shouldEnableDragging) {
      return <div key={link.pulseId}>{content}</div>
    }

    return (
      <SortablePulseItem
        id={link.pulseId}
        isShaking={activeId === link.pulseId}
        key={link.pulseId}
      >
        <div
          style={{
            opacity: activeId === link.pulseId ? 0 : 1,
            pointerEvents: isDragging ? 'none' : 'auto',
          }}
        >
          {content}
        </div>
      </SortablePulseItem>
    )
  })

  return (
    <PulseGroupAccordion
      collapsed={collapsed}
      summaryClassName={titleClassName}
      title={title}
      withUnreadBadge={hasUnreadPulses}
    >
      <Stack gap={1}>
        {shouldEnableDragging ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[
              restrictToVerticalAxis,
              restrictToFirstScrollableAncestor,
            ]}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            sensors={sensors}
          >
            <SortableContext
              items={sortableItems}
              strategy={verticalListSortingStrategy}
            >
              {linksList}
            </SortableContext>

            <DragOverlay>
              {activeId && activeLink ? (
                <div style={{ cursor: 'grabbing' }}>
                  <CollapsibleChatButton
                    collapsed={collapsed}
                    link={activeLink}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          linksList
        )}

        <Tooltip
          disableInteractive={true}
          placement="right"
          title={
            category === PulseCategory.Onetoone
              ? 'Add One to One Pulse'
              : 'Add Team Pulse'
          }
        >
          {/* Add new Pulse */}
          <Button
            onClick={
              createPath
                ? () =>
                    navigate(
                      pathFor({
                        pathname: createPath,
                        query: { organizationId },
                      }),
                    )
                : undefined
            }
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              py: 1,
            }}
          >
            <Stack
              alignItems="center"
              direction="row"
              gap={1.5}
              justifyContent={collapsed ? 'center' : undefined}
              width="100%"
            >
              <Add
                sx={{
                  color: 'text.secondary',
                  height: 20,
                  width: 20,
                }}
              />
              {!collapsed && (
                <Typography color="text.primary" variant="body2">
                  New
                </Typography>
              )}
            </Stack>
          </Button>
        </Tooltip>
      </Stack>
    </PulseGroupAccordion>
  )
}
