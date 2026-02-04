import { AutoAwesomeOutlined } from '@mui/icons-material'
import { CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useCreateEventSummaryMutation } from '@zunou-queries/core/hooks/useCreateEventSummaryMutation'
import { useUpdateEventMutation } from '@zunou-queries/core/hooks/useUpdateEventMutation'
import { Button, LoadingButton } from '@zunou-react/components/form'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { Detail, Row } from './Layout'

interface SummarySectionProps {
  meetingSessionId?: string
  eventId: string | undefined
  organizationId: string | undefined
  pulseId: string | undefined
  existingSummary: string | null | undefined
}

export function SummarySection({
  meetingSessionId,
  eventId,
  organizationId,
  pulseId,
  existingSummary,
}: SummarySectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [summaryText, setSummaryText] = useState('')

  const updateEventMutation = useUpdateEventMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const createEventSummary = useCreateEventSummaryMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleGenerate = async () => {
    if (!eventId || !organizationId || !pulseId || !meetingSessionId) {
      toast.error('Missing required information to generate summary')
      return
    }

    try {
      const res = await createEventSummary.mutateAsync({
        eventId,
        meetingSessionId,
        organizationId,
        pulseId,
      })

      toast.success('Event summary generated successfully')
      setSummaryText(res.createEventSummary)

      if (existingSummary) {
        setIsEditing(true)
      } else {
        setIsAdding(true)
      }
    } catch (error) {
      toast.error('Failed to generate event summary')
    }
  }

  const handleAdd = () => {
    setIsAdding(true)
    setSummaryText('')
  }

  const handleEdit = () => {
    setIsEditing(true)
    setSummaryText(existingSummary || '')
  }

  const handleCancel = () => {
    setIsAdding(false)
    setIsEditing(false)
    setSummaryText('')
  }

  const handleSave = async () => {
    if (!summaryText.trim()) {
      toast.error('Please enter a summary')
      return
    }

    if (!eventId || !organizationId || !pulseId) {
      toast.error('Missing required information to save summary')
      return
    }

    try {
      await updateEventMutation.mutateAsync({
        id: eventId,
        meetingSessionId,
        summary: summaryText,
      })

      setIsAdding(false)
      setIsEditing(false)
      toast.success('Summary saved successfully')
    } catch (error) {
      toast.error('Failed to save summary')
    }
  }

  const isEditMode = isAdding || isEditing

  return (
    <Stack gap={2}>
      <Row>
        <Detail>
          <AutoAwesomeOutlined sx={{ fontSize: 15 }} />
          <Stack>
            <Typography fontWeight={500} variant="body2">
              Summary
            </Typography>
            {existingSummary && !isEditing ? (
              <Typography sx={{ whiteSpace: 'pre-wrap' }} variant="body2">
                {existingSummary}
              </Typography>
            ) : !isEditMode ? (
              <Typography color="text.secondary" variant="body2">
                No summary provided yet
              </Typography>
            ) : null}
          </Stack>
        </Detail>
        {!isEditMode && (
          <Stack alignItems="center" direction="row" gap={2}>
            <Button
              disabled={createEventSummary.isPending}
              onClick={handleGenerate}
              startIcon={
                createEventSummary.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <AutoAwesomeOutlined />
                )
              }
              variant="outlined"
            >
              Generate with AI
            </Button>

            {existingSummary ? (
              <Button onClick={handleEdit} variant="text">
                Edit
              </Button>
            ) : (
              <Button onClick={handleAdd} variant="text">
                Add Summary
              </Button>
            )}
          </Stack>
        )}
      </Row>

      {isEditMode && (
        <Stack
          gap={2}
          p={2}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <TextField
            autoFocus={true}
            disabled={updateEventMutation.isPending}
            fullWidth={true}
            multiline={true}
            onChange={(e) => setSummaryText(e.target.value)}
            placeholder="Enter your summary here..."
            rows={4}
            value={summaryText}
            variant="outlined"
          />
          <Stack direction="row" gap={1} justifyContent="flex-end">
            <Button
              disabled={updateEventMutation.isPending}
              onClick={handleCancel}
              variant="text"
            >
              Cancel
            </Button>
            <LoadingButton
              disabled={!summaryText.trim()}
              loading={updateEventMutation.isPending}
              onClick={handleSave}
              variant="contained"
            >
              Save
            </LoadingButton>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
