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
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Add,
  AutoAwesomeOutlined,
  Close,
  DragHandle,
  Edit,
} from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { Checklist } from '@zunou-graphql/core/graphql'
import { useCreateChecklistMutation } from '@zunou-queries/core/hooks/useCreateChecklistMutation'
import { useCreateSmartChecklistMutation } from '@zunou-queries/core/hooks/useCreateSmartChecklistMutation'
import { useDeleteChecklistMutation } from '@zunou-queries/core/hooks/useDeleteChecklistMutation'
import { useGetChecklistsQuery } from '@zunou-queries/core/hooks/useGetChecklistsQuery'
import { useUpdateChecklistMutation } from '@zunou-queries/core/hooks/useUpdateChecklistMutation'
import { useUpdateChecklistOrderMutation } from '@zunou-queries/core/hooks/useUpdateChecklistOrderMutation'
import {
  CheckboxField,
  IconButton,
  LoadingButton,
  TextField,
} from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { debounce } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import Loader from './Loader'

interface Props {
  eventId: string
}

interface ChecklistFormData {
  newChecklist: string
}

interface EditChecklistFormData {
  editChecklist: string
  isComplete: boolean
}

interface ChecklistWithOrder extends Checklist {
  order?: number
}

function SortableChecklistItem({
  id,
  checklist,
  isDraggingDisabled,
  eventId,
}: {
  id: string
  checklist: Checklist
  isDraggingDisabled: boolean
  eventId?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const [isEditing, setIsEditing] = useState(false)

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch: watchEdit,
  } = useForm<EditChecklistFormData>({
    defaultValues: {
      editChecklist: checklist.name,
      isComplete: checklist.complete || false,
    },
  })

  const editValue = watchEdit('editChecklist')
  const isCompleteValue = watchEdit('isComplete')

  const deleteChecklist = useDeleteChecklistMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateChecklist = useUpdateChecklistMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // Create debounced update function
  const debouncedUpdateComplete = useRef(
    debounce(async (checked: boolean) => {
      try {
        await updateChecklist.mutateAsync({
          complete: checked,
          id,
        })
      } catch (error) {
        console.error('Failed to update checklist completion:', error)
        toast.error('Failed to update checklist')
      }
    }, 500),
  ).current

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateComplete.cancel()
    }
  }, [debouncedUpdateComplete])

  // Sync form state with prop changes
  useEffect(() => {
    resetEdit({
      editChecklist: checklist.name,
      isComplete: checklist.complete || false,
    })
  }, [checklist.complete, checklist.name, resetEdit])

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      // Debounce the API call
      debouncedUpdateComplete(checked)
    },
    [debouncedUpdateComplete],
  )

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!eventId) {
      toast.error('Missing event ID.')
      return
    }

    try {
      await deleteChecklist.mutateAsync(
        {
          eventId,
          id,
        },
        {
          onSuccess: () => {
            toast.success('Checklist deleted successfully')
          },
        },
      )
    } catch (error) {
      toast.error('Failed to delete checklist')
      console.error('Failed to delete checklist:', error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    resetEdit({
      editChecklist: checklist.name,
      isComplete: checklist.complete || false,
    })
  }

  const onEditSubmit = handleEditSubmit(async (data) => {
    if (!data.editChecklist.trim()) {
      toast.error('Checklist name cannot be empty')
      return
    }

    if (data.editChecklist === checklist.name) {
      setIsEditing(false)
      return
    }

    try {
      await updateChecklist.mutateAsync(
        {
          id,
          name: data.editChecklist,
        },
        {
          onSuccess: () => {
            toast.success('Agenda item updated successfully')
            setIsEditing(false)
          },
        },
      )
    } catch (error) {
      toast.error('Failed to update checklist')
      console.error('Failed to update checklist:', error)
    }
  })

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    resetEdit({
      editChecklist: checklist.name,
      isComplete: checklist.complete || false,
    })
    setIsEditing(false)
  }

  const style = {
    opacity: 1,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        '&:hover .action-button': {
          opacity: 1,
        },
        opacity: isDraggingDisabled ? 0.5 : undefined,
        pointerEvents: isDraggingDisabled ? 'none' : 'auto',
      }}
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
    >
      <ListItemIcon
        sx={{
          '&:active': {
            cursor:
              isDraggingDisabled || isEditing ? 'not-allowed' : 'grabbing',
          },
          alignItems: 'center',
          cursor: isDraggingDisabled || isEditing ? 'not-allowed' : 'grab',
          display: 'flex',
          gap: 3,
          minWidth: 'auto',
          mr: 1,
        }}
      >
        <DragHandle
          fontSize="small"
          sx={{
            color:
              isDraggingDisabled || isEditing ? 'grey.300' : 'text.secondary',
          }}
        />

        <CheckboxField
          checked={isCompleteValue}
          control={editControl}
          disabled={updateChecklist.isPending || isDraggingDisabled}
          name="isComplete"
          onChange={handleCheckboxChange}
        />
      </ListItemIcon>

      {isEditing ? (
        <Box component="form" onSubmit={onEditSubmit} sx={{ flex: 1, mr: 1 }}>
          <TextField
            autoFocus={true}
            control={editControl}
            name="editChecklist"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Escape') {
                handleCancel()
              }
            }}
            value={editValue}
          />
        </Box>
      ) : (
        <ListItemText
          primary={checklist.name}
          sx={{
            color: isCompleteValue ? 'text.secondary' : 'text.primary',
            textDecoration: isCompleteValue ? 'line-through' : 'none',
          }}
        />
      )}

      <Stack alignItems="center" direction="row" gap={1}>
        {isEditing ? (
          <>
            <LoadingButton
              disabled={updateChecklist.isPending}
              loading={updateChecklist.isPending}
              onMouseDown={onEditSubmit}
              size="small"
              variant="contained"
            >
              Save
            </LoadingButton>
            <LoadingButton
              disabled={updateChecklist.isPending}
              onMouseDown={handleCancel}
              size="small"
              variant="outlined"
            >
              Cancel
            </LoadingButton>
          </>
        ) : (
          <Stack
            alignItems="center"
            className="action-button"
            direction="row"
            gap={1}
            sx={{ opacity: 0, transition: 'opacity 0.2s' }}
          >
            <IconButton
              disabled={deleteChecklist.isPending || updateChecklist.isPending}
              onClick={handleEdit}
              size="small"
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              disabled={deleteChecklist.isPending || updateChecklist.isPending}
              onMouseDown={handleDelete}
              size="small"
            >
              {deleteChecklist.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <Close fontSize="small" />
              )}
            </IconButton>
          </Stack>
        )}
      </Stack>
    </ListItem>
  )
}

export default function TalkingPointsTab({ eventId }: Props) {
  const { control, handleSubmit, reset, watch } = useForm<ChecklistFormData>({
    defaultValues: {
      newChecklist: '',
    },
  })
  const { organizationId, pulseId } = useParams()

  const { data: checklistsData, isLoading } = useGetChecklistsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!eventId,
    variables: {
      eventId: eventId,
      organizationId,
      pulseId,
    },
  })

  const createChecklist = useCreateChecklistMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const createSmartChecklist = useCreateSmartChecklistMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateChecklistOrder = useUpdateChecklistOrderMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDraggingDisabled, setIsDraggingDisabled] = useState(false)
  const isReorderingRef = useRef(false)

  const checklists = checklistsData?.checklists ?? []

  const [orderedChecklist, setOrderedChecklist] = useState<
    ChecklistWithOrder[]
  >(() => {
    const sortedChecklist = [...checklists].sort((a, b) => {
      const posA = a.position ?? 0
      const posB = b.position ?? 0
      return posA - posB
    })

    return sortedChecklist.map((checklist, index) => ({
      ...checklist,
      order: index,
    }))
  })

  useEffect(() => {
    if (isReorderingRef.current) {
      return
    }

    const sortedChecklist = [...checklists].sort((a, b) => {
      const posA = a.position ?? 0
      const posB = b.position ?? 0
      return posA - posB
    })

    const newOrderedAgendas = sortedChecklist.map((checklist, index) => ({
      ...checklist,
      order: index,
    }))

    setOrderedChecklist(newOrderedAgendas)
  }, [checklists])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const activeSensors = isDraggingDisabled ? [] : sensors

  const newChecklist = watch('newChecklist')

  const onSubmit = handleSubmit(async (data) => {
    if (!eventId || !organizationId || !pulseId || !data.newChecklist.trim()) {
      toast.error('Missing required information to create checklist')
      return
    }

    try {
      await createChecklist.mutateAsync(
        {
          event_id: eventId,
          name: data.newChecklist,
          organization_id: organizationId,
          pulse_id: pulseId,
        },
        {
          onSuccess: () => {
            toast.success('Checklist added successfully')
            reset()
          },
        },
      )
    } catch (error) {
      toast.error('Failed to create checklist')
      console.error('Failed to create checklist:', error)
    }
  })

  const handleSmartChecklist = async () => {
    if (!eventId || !organizationId || !pulseId) {
      toast.error('Missing required information to create smart checklist')
      return
    }

    try {
      await createSmartChecklist.mutateAsync(
        {
          event_id: eventId,
          organization_id: organizationId,
          pulse_id: pulseId,
        },
        {
          onSuccess: (data) => {
            toast.success(
              `Smart checklist created with ${data.createSmartChecklist.length} items`,
            )
          },
        },
      )
    } catch (error) {
      toast.error('Failed to create smart checklist')
      console.error('Failed to create smart checklist:', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    isReorderingRef.current = true
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      isReorderingRef.current = false
      return
    }

    const oldIndex = orderedChecklist.findIndex(
      (checklist) => checklist.id === active.id,
    )
    const newIndex = orderedChecklist.findIndex(
      (checklist) => checklist.id === over.id,
    )

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderedChecklists = [...orderedChecklist]
      const [movedItem] = newOrderedChecklists.splice(oldIndex, 1)
      newOrderedChecklists.splice(newIndex, 0, movedItem)

      const reorderedChecklists = newOrderedChecklists.map(
        (checklist, index) => ({
          ...checklist,
          order: index,
        }),
      )

      setOrderedChecklist(reorderedChecklists)

      handleChecklistReorder(reorderedChecklists)
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    isReorderingRef.current = false
  }

  const handleChecklistReorder = async (
    reorderedChecklists: ChecklistWithOrder[],
  ) => {
    if (!organizationId || !pulseId || !eventId) {
      toast.error('Missing required information to update checklist order')
      return
    }

    setIsDraggingDisabled(true)

    try {
      const input = reorderedChecklists.map((checklist, index) => ({
        id: checklist.id,
        position: index + 1,
      }))

      await updateChecklistOrder.mutateAsync({
        event_id: eventId,
        input,
      })

      toast.success('Checklist reordered successfully')
    } catch (error) {
      toast.error('Failed to update checklist order')
      console.error('Failed to update checklist order:', error)
    } finally {
      setIsDraggingDisabled(false)
      isReorderingRef.current = false
    }
  }

  const activeChecklist = activeId
    ? orderedChecklist.find((checklist) => checklist.id === activeId)
    : null

  if (isLoading) return <Loader />

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={activeSensors}
    >
      <Stack gap={2} height="100%" width="100%">
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          width="100%"
        >
          <Typography fontWeight={500} variant="body1">
            Checklist
          </Typography>

          <LoadingButton
            disabled={createSmartChecklist.isPending}
            loading={createSmartChecklist.isPending}
            onClick={handleSmartChecklist}
            startIcon={<AutoAwesomeOutlined />}
            variant="outlined"
          >
            Smart Checklist
          </LoadingButton>
        </Stack>

        <List
          sx={{
            border: 1,
            borderColor: 'grey.200',
            borderRadius: 2,
            flex: 1,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {orderedChecklist.length > 0 ? (
            <SortableContext
              items={orderedChecklist.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedChecklist.map((checklist) => (
                <SortableChecklistItem
                  checklist={checklist}
                  eventId={eventId}
                  id={checklist.id}
                  isDraggingDisabled={isDraggingDisabled}
                  key={checklist.id}
                />
              ))}
            </SortableContext>
          ) : (
            <ListItem>
              <ListItemText
                primary="No Checklist Items"
                sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}
              />
            </ListItem>
          )}
        </List>

        <Divider orientation="horizontal" />

        <Stack
          alignItems="center"
          component="form"
          direction="row"
          gap={1}
          onSubmit={onSubmit}
        >
          <TextField
            control={control}
            disabled={createChecklist.isPending}
            name="newChecklist"
            placeholder="Add checklist item..."
            value={newChecklist}
          />
          <LoadingButton
            disabled={createChecklist.isPending}
            loading={createChecklist.isPending}
            startIcon={<Add />}
            type="submit"
            variant="contained"
          >
            Add
          </LoadingButton>
        </Stack>
      </Stack>

      {createPortal(
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeId && activeChecklist ? (
            <ListItem
              sx={{
                backgroundColor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                boxShadow: 3,
                cursor: 'grabbing',
              }}
            >
              <ListItemIcon
                sx={{
                  alignItems: 'center',
                  cursor: 'grabbing',
                  display: 'flex',
                  gap: 3,
                  minWidth: 'auto',
                  mr: 1,
                }}
              >
                <DragHandle fontSize="small" sx={{ color: 'text.secondary' }} />
                <Box
                  sx={{
                    alignItems: 'center',
                    border: '2px solid',
                    borderColor: activeChecklist.complete
                      ? 'primary.main'
                      : 'grey.400',
                    borderRadius: 0.5,
                    display: 'flex',
                    height: 18,
                    justifyContent: 'center',
                    width: 18,
                  }}
                />
              </ListItemIcon>

              <ListItemText
                primary={activeChecklist.name}
                sx={{
                  color: activeChecklist.complete
                    ? 'text.secondary'
                    : 'text.primary',
                  textDecoration: activeChecklist.complete
                    ? 'line-through'
                    : 'none',
                }}
              />
            </ListItem>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
