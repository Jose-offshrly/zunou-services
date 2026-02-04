import { Add, Delete, Edit } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { CustomModal } from '~/components/ui/CustomModal'

import { useTimelineStore } from '../../store/useTimelineStore'
import { PhaseDefinition } from '../../types/types'

interface PhaseManagerProps {
  open: boolean
  onClose: () => void
}

export const PhaseManager = ({ open, onClose }: PhaseManagerProps) => {
  const phaseDefinitions = useTimelineStore((state) => state.phaseDefinitions)
  const addPhase = useTimelineStore((state) => state.addPhase)
  const updatePhase = useTimelineStore((state) => state.updatePhase)
  const deletePhase = useTimelineStore((state) => state.deletePhase)

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<PhaseDefinition | null>(null)
  const [formData, setFormData] = useState({
    color: '#9C27B0',
    label: '',
    value: '',
  })

  const handleOpenFormDialog = (phase?: PhaseDefinition) => {
    if (phase) {
      setEditingPhase(phase)
      setFormData({
        color: phase.color,
        label: phase.label,
        value: phase.value,
      })
    } else {
      setEditingPhase(null)
      setFormData({
        color: '#9C27B0',
        label: '',
        value: '',
      })
    }
    setIsFormDialogOpen(true)
  }

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false)
    setEditingPhase(null)
    setFormData({
      color: '#9C27B0',
      label: '',
      value: '',
    })
  }

  const handleSave = () => {
    if (!formData.label.trim() || !formData.value.trim()) return

    if (editingPhase) {
      updatePhase(editingPhase.id, {
        color: formData.color,
        label: formData.label,
        value: formData.value,
      })
    } else {
      // Check if value already exists
      if (phaseDefinitions.some((p) => p.value === formData.value)) {
        alert('A phase with this value already exists')
        return
      }
      addPhase({
        color: formData.color,
        label: formData.label,
        value: formData.value,
      })
    }
    handleCloseFormDialog()
  }

  const handleDelete = (id: string) => {
    const phase = phaseDefinitions.find((p) => p.id === id)
    if (phase?.isSystem) {
      alert('System phases cannot be deleted')
      return
    }
    if (window.confirm(`Are you sure you want to delete "${phase?.label}"?`)) {
      deletePhase(id)
    }
  }

  return (
    <>
      {/* Main Phase Manager Modal */}
      <CustomModal
        isOpen={open}
        maxWidth={800}
        minWidth={600}
        onClose={onClose}
        title="Phase Definitions"
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => handleOpenFormDialog()}
              size="small"
              startIcon={<Add />}
              variant="outlined"
            >
              Add Phase
            </Button>
          </Box>

          <List dense={true}>
            {phaseDefinitions.map((phase) => (
              <ListItem key={phase.id}>
                <Box
                  sx={{
                    backgroundColor: phase.color,
                    borderRadius: '50%',
                    height: 16,
                    marginRight: 1,
                    width: 16,
                  }}
                />
                <ListItemText
                  primary={phase.label}
                  secondary={
                    <Typography color="text.secondary" variant="caption">
                      {phase.value}
                      {phase.isSystem && ' (System)'}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleOpenFormDialog(phase)}
                    size="small"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  {!phase.isSystem && (
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(phase.id)}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Stack>
      </CustomModal>

      {/* Add/Edit Form Dialog */}
      <Dialog
        fullWidth={true}
        maxWidth="sm"
        onClose={handleCloseFormDialog}
        open={isFormDialogOpen}
      >
        <DialogTitle>{editingPhase ? 'Edit Phase' : 'Add Phase'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth={true}
              label="Label"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              required={true}
              value={formData.label}
            />
            <TextField
              fullWidth={true}
              helperText="Lowercase, hyphen-separated (e.g., 'design-phase')"
              label="Value (unique identifier)"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  value: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                }))
              }
              required={true}
              value={formData.value}
            />
            <TextField
              fullWidth={true}
              label="Color (hex)"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
              required={true}
              type="color"
              value={formData.color}
            />
            {editingPhase?.isSystem && (
              <Typography color="text.secondary" variant="caption">
                Note: System phases cannot be deleted
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            disabled={!formData.label.trim() || !formData.value.trim()}
            onClick={handleSave}
            variant="contained"
          >
            {editingPhase ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
