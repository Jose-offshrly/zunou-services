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
import { Agenda } from '@zunou-graphql/core/graphql'
import { useCreateAgendaMutation } from '@zunou-queries/core/hooks/useCreateAgendaMutation'
import { useCreateSmartAgendaMutation } from '@zunou-queries/core/hooks/useCreateSmartAgendaMutation'
import { useDeleteAgendaMutation } from '@zunou-queries/core/hooks/useDeleteAgendaMutation'
import { useGetEvent } from '@zunou-queries/core/hooks/useGetEvent'
import { useUpdateAgendaMutation } from '@zunou-queries/core/hooks/useUpdateAgendaMutation'
import { useUpdateAgendaOrderMutation } from '@zunou-queries/core/hooks/useUpdateAgendaOrderMutation'
import {
  IconButton,
  LoadingButton,
  TextField,
} from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import Loader from './Loader'

interface Props {
  eventId: string
}

interface AgendaFormData {
  newAgenda: string
}

interface EditAgendaFormData {
  editAgenda: string
}

interface AgendaWithOrder extends Agenda {
  order?: number
}

function SortableAgendaItem({
  id,
  agenda,
  number,
  meetingSessionId,
  organizationId,
  pulseId,
  isDraggingDisabled,
  eventId,
}: {
  id: string
  agenda: Agenda
  number: number
  meetingSessionId?: string
  organizationId: string
  pulseId: string
  isDraggingDisabled: boolean
  eventId: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const [isEditing, setIsEditing] = useState(false)

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch: watchEdit,
  } = useForm<EditAgendaFormData>({
    defaultValues: {
      editAgenda: agenda.name,
    },
  })

  const editValue = watchEdit('editAgenda')

  const deleteAgenda = useDeleteAgendaMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateAgenda = useUpdateAgendaMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    try {
      await deleteAgenda.mutateAsync(
        {
          eventId,
          id,
          meetingSessionId,
          organization_id: organizationId,
          pulse_id: pulseId,
        },
        {
          onSuccess: () => {
            toast.success('Agenda deleted successfully')
          },
        },
      )
    } catch (error) {
      toast.error('Failed to delete agenda')
      console.error('Failed to delete agenda:', error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    resetEdit({ editAgenda: agenda.name })
  }

  const onEditSubmit = handleEditSubmit(async (data) => {
    if (!data.editAgenda.trim()) {
      toast.error('Agenda name cannot be empty')
      return
    }

    if (data.editAgenda === agenda.name) {
      setIsEditing(false)
      return
    }

    try {
      await updateAgenda.mutateAsync(
        {
          eventId,
          id,
          meetingSessionId,
          name: data.editAgenda,
          organizationId,
          pulseId,
        },
        {
          onSuccess: () => {
            toast.success('Agenda item updated successfully')
            setIsEditing(false)
          },
        },
      )
    } catch (error) {
      toast.error('Failed to update agenda item')
      console.error('Failed to update agenda:', error)
    }
  })

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    resetEdit({ editAgenda: agenda.name })
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
      </ListItemIcon>

      <ListItemIcon sx={{ minWidth: 40 }}>
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: theme.palette.common.sky,
            borderRadius: '50%',
            color: theme.palette.common.blue,
            display: 'flex',
            fontSize: 'small',
            fontWeight: 'fontWeightMedium',
            height: 24,
            justifyContent: 'center',
            width: 24,
          }}
        >
          {number}
        </Box>
      </ListItemIcon>

      {isEditing ? (
        <Box component="form" onSubmit={onEditSubmit} sx={{ flex: 1, mr: 1 }}>
          <TextField
            autoFocus={true}
            control={editControl}
            name="editAgenda"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Escape') {
                handleCancel()
              }
            }}
            value={editValue}
          />
        </Box>
      ) : (
        <ListItemText primary={agenda.name} />
      )}

      <Stack alignItems="center" direction="row" gap={1}>
        {isEditing ? (
          <>
            <LoadingButton
              disabled={updateAgenda.isPending}
              loading={updateAgenda.isPending}
              onMouseDown={onEditSubmit}
              size="small"
              variant="contained"
            >
              Save
            </LoadingButton>
            <LoadingButton
              disabled={updateAgenda.isPending}
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
              disabled={deleteAgenda.isPending || updateAgenda.isPending}
              onClick={handleEdit}
              size="small"
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              disabled={deleteAgenda.isPending || updateAgenda.isPending}
              onMouseDown={handleDelete}
              size="small"
            >
              {deleteAgenda.isPending ? (
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

export default function AgendaTab({ eventId }: Props) {
  const { control, handleSubmit, reset, watch } = useForm<AgendaFormData>({
    defaultValues: {
      newAgenda: '',
    },
  })
  const { organizationId, pulseId } = useParams()

  const { data: eventData, isLoading } = useGetEvent({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!eventId,
    variables: {
      eventId,
    },
  })

  const event = eventData?.event
  const meetingSessionId = event?.meetingSession?.id

  const createAgenda = useCreateAgendaMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const createSmartAgenda = useCreateSmartAgendaMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateAgendaOrder = useUpdateAgendaOrderMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDraggingDisabled, setIsDraggingDisabled] = useState(false)
  const isReorderingRef = useRef(false)

  const agendas = event?.agendas ?? []

  const [orderedAgendas, setOrderedAgendas] = useState<AgendaWithOrder[]>(
    () => {
      const sortedAgendas = [...agendas].sort((a, b) => {
        const posA = a.position ?? 0
        const posB = b.position ?? 0
        return posA - posB
      })

      return sortedAgendas.map((agenda, index) => ({
        ...agenda,
        order: index,
      }))
    },
  )

  useEffect(() => {
    if (isReorderingRef.current) {
      return
    }

    const sortedAgendas = [...agendas].sort((a, b) => {
      const posA = a.position ?? 0
      const posB = b.position ?? 0
      return posA - posB
    })

    const newOrderedAgendas = sortedAgendas.map((agenda, index) => ({
      ...agenda,
      order: index,
    }))

    setOrderedAgendas(newOrderedAgendas)
  }, [agendas])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const activeSensors = isDraggingDisabled ? [] : sensors

  const newAgenda = watch('newAgenda')

  const onSubmit = handleSubmit(async (data) => {
    if (!eventId || !organizationId || !pulseId || !data.newAgenda.trim()) {
      toast.error('Missing required information to create agenda')
      return
    }

    try {
      await createAgenda.mutateAsync(
        {
          event_id: eventId,
          meetingSessionId,
          name: data.newAgenda,
          organization_id: organizationId,
          pulse_id: pulseId,
        },
        {
          onSuccess: () => {
            toast.success('Agenda added successfully')
            reset()
          },
        },
      )
    } catch (error) {
      toast.error('Failed to create agenda')
      console.error('Failed to create agenda:', error)
    }
  })

  const handleSmartAgenda = async () => {
    if (!eventId || !organizationId || !pulseId) {
      toast.error('Missing required information to create smart agenda')
      return
    }

    try {
      await createSmartAgenda.mutateAsync(
        {
          event_id: eventId,
          meetingSessionId,
          organization_id: organizationId,
          pulse_id: pulseId,
        },
        {
          onSuccess: (data) => {
            toast.success(
              `Smart agenda created with ${data.createSmartAgenda.length} items`,
            )
          },
        },
      )
    } catch (error) {
      toast.error('Failed to create smart agenda')
      console.error('Failed to create smart agenda:', error)
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

    const oldIndex = orderedAgendas.findIndex(
      (agenda) => agenda.id === active.id,
    )
    const newIndex = orderedAgendas.findIndex((agenda) => agenda.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderedAgendas = [...orderedAgendas]
      const [movedItem] = newOrderedAgendas.splice(oldIndex, 1)
      newOrderedAgendas.splice(newIndex, 0, movedItem)

      const reorderedAgendas = newOrderedAgendas.map((agenda, index) => ({
        ...agenda,
        order: index,
      }))

      setOrderedAgendas(reorderedAgendas)

      handleAgendasReorder(reorderedAgendas)
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    isReorderingRef.current = false
  }

  const handleAgendasReorder = async (reorderedAgendas: AgendaWithOrder[]) => {
    if (!organizationId || !pulseId) {
      toast.error('Missing required information to update agenda order')
      return
    }

    setIsDraggingDisabled(true)

    try {
      const input = reorderedAgendas.map((agenda, index) => ({
        id: agenda.id,
        position: index + 1,
      }))

      await updateAgendaOrder.mutateAsync({
        eventId,
        input,
        meetingSessionId,
        organization_id: organizationId,
        pulse_id: pulseId,
      })

      toast.success('Agendas reordered successfully')
    } catch (error) {
      toast.error('Failed to update agenda order')
      console.error('Failed to update agenda order:', error)
    } finally {
      setIsDraggingDisabled(false)
      isReorderingRef.current = false
    }
  }

  const activeAgenda = activeId
    ? orderedAgendas.find((agenda) => agenda.id === activeId)
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
            Agenda
          </Typography>

          <LoadingButton
            disabled={createSmartAgenda.isPending}
            loading={createSmartAgenda.isPending}
            onClick={handleSmartAgenda}
            startIcon={<AutoAwesomeOutlined />}
            variant="outlined"
          >
            Smart Agenda
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
          {orderedAgendas.length > 0 ? (
            <SortableContext
              items={orderedAgendas.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedAgendas.map((agenda, index) => (
                <SortableAgendaItem
                  agenda={agenda}
                  eventId={eventId}
                  id={agenda.id}
                  isDraggingDisabled={isDraggingDisabled}
                  key={agenda.id}
                  meetingSessionId={meetingSessionId}
                  number={index + 1}
                  organizationId={organizationId!}
                  pulseId={pulseId!}
                />
              ))}
            </SortableContext>
          ) : (
            <ListItem>
              <ListItemText
                primary="No Agenda Items"
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
            disabled={createAgenda.isPending}
            name="newAgenda"
            placeholder="Add agenda item..."
            value={newAgenda}
          />
          <LoadingButton
            disabled={createAgenda.isPending}
            loading={createAgenda.isPending}
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
          {activeId && activeAgenda ? (
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
                  minWidth: 'auto',
                  mr: 1,
                }}
              >
                <DragHandle fontSize="small" sx={{ color: 'text.secondary' }} />
              </ListItemIcon>

              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    alignItems: 'center',
                    backgroundColor: theme.palette.common.sky,
                    borderRadius: '50%',
                    color: theme.palette.common.blue,
                    display: 'flex',
                    fontSize: 'small',
                    fontWeight: 'fontWeightMedium',
                    height: 24,
                    justifyContent: 'center',
                    width: 24,
                  }}
                >
                  {orderedAgendas.findIndex((a) => a.id === activeId) + 1}
                </Box>
              </ListItemIcon>

              <ListItemText primary={activeAgenda.name} />
            </ListItem>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
