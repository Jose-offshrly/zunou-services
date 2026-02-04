import { zodResolver } from '@hookform/resolvers/zod'
import { CloseOutlined, Label } from '@mui/icons-material'
import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import {
  alpha,
  Box,
  FormHelperText,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Form } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import React, { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { CustomModal } from '~/components/ui/CustomModal'
import { SearchInput } from '~/components/ui/form/SearchInput'

import { DeleteConfirmationModal } from '../components/DeleteNoteModal'

interface Label {
  id: string
  name: string
  color?: string
}

interface LabelModalProps {
  open: boolean
  onClose: () => void
  labels: Label[]
  onCreate: (name: string, color?: string) => void
  onUpdate: (id: string, name: string, color?: string) => void
  onDelete: (id: string) => void
}

export const LABEL_COLORS = [
  {
    name: 'transparent',
    value: 'transparent',
  },
  { name: 'purple', value: '#4A00E0BF' },
  {
    name: 'light purple',
    value: '#4A00E040',
  },
  {
    name: 'pastelle red',
    value: '#FAAFA8',
  },
  { name: 'yellow', value: '#FFF8B8' },
  {
    name: 'light blue',
    value: '#D4E4ED',
  },
  {
    name: 'light green',
    value: '#E2F6D3',
  },
  { name: 'teal', value: '#B4DDD3' },
  { name: 'indigo', value: '#D3BFDB' },
  { name: 'peach', value: '#F6E2DD' },
  {
    name: 'light brown',
    value: '#E9E3D4',
  },
  { name: 'brown', value: '#DBB76F' },
]

const getLabelSchema = () =>
  z.object({
    name: z
      .string()
      .min(1, 'Label name is required')
      .max(32, 'Max 32 characters'),
  })

export const LabelModal: React.FC<LabelModalProps> = ({
  open,
  onClose,
  labels,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation('notes')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [colorPickerAnchor, setColorPickerAnchor] =
    useState<HTMLElement | null>(null)
  const [editingColor, setEditingColor] = useState<string | undefined>(
    undefined,
  )
  const [creatingColor, setCreatingColor] = useState<string | undefined>(
    undefined,
  )
  const [colorPickerContext, setColorPickerContext] = useState<
    'create' | 'edit' | null
  >(null)
  const [editingLabelData, setEditingLabelData] = useState<Label | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setEditingId(null)
      setDeletingId(null)
      setSearchQuery('')
      setColorPickerAnchor(null)
      setEditingColor(undefined)
      setCreatingColor(undefined)
      setColorPickerContext(null)
      setEditingLabelData(null)
      resetCreate()
      resetEdit()
    }
  }, [open])

  const handleColorPickerOpen = (
    event: React.MouseEvent<HTMLElement>,
    context: 'create' | 'edit',
  ) => {
    setColorPickerAnchor(event.currentTarget)
    setColorPickerContext(context)
  }

  const handleColorPickerClose = () => {
    setColorPickerAnchor(null)
    setColorPickerContext(null)
  }

  const handleColorSelect = (color: string) => {
    if (colorPickerContext === 'create') {
      setCreatingColor(color)
    } else if (colorPickerContext === 'edit') {
      setEditingColor(color)
    }
    handleColorPickerClose()
    console.log(color)
  }

  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const {
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    register,
    formState: { isSubmitting: isCreating },
  } = useForm<{ name: string }>({
    defaultValues: { name: '' },
    resolver: zodResolver(getLabelSchema()),
  })

  const onCreateLabel = (data: { name: string }) => {
    const trimmedName = data.name.trim()

    const existingLabel = labels.find(
      (label) => label.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (existingLabel) {
      toast.error(`Label "${trimmedName}" already exists`)
      return
    }

    onCreate(trimmedName, creatingColor)
    resetCreate()
    setCreatingColor(undefined)
  }

  const {
    handleSubmit: handleEditSubmit,
    control: editControl,
    setValue: setEditFormValue,
    reset: resetEdit,
    watch: watchEditValue,
    formState: { errors: editErrors, isSubmitting: isEditing },
  } = useForm<{ name: string }>({
    defaultValues: { name: '' },
    resolver: zodResolver(getLabelSchema()),
  })

  const currentEditValue = watchEditValue('name')

  React.useEffect(() => {
    if (editingId) {
      const label = labels.find((l) => l.id === editingId)
      if (label) {
        setEditingLabelData(label)
        setEditFormValue('name', label.name || '')
        setEditingColor(label.color || 'transparent')
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    } else {
      setEditingLabelData(null)
    }
  }, [editingId, setEditFormValue])

  const onEditLabel = async (data: { name: string }) => {
    if (editingId) {
      const trimmedName = data.name.trim()

      const existingLabel = labels.find(
        (label) =>
          label.id !== editingId &&
          label.name.toLowerCase() === trimmedName.toLowerCase(),
      )

      if (existingLabel) {
        toast.error(`Label "${trimmedName}" already exists`)
        return
      }

      await onUpdate(editingId, trimmedName, editingColor)
      setEditingId(null)
      setEditingColor(undefined)
    }
  }

  const handleDeleteLabel = (id: string) => {
    const label = labels.find((l) => l.id === id)
    if (label) {
      setLabelToDelete(label)
      setDeleteModalOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (labelToDelete) {
      setDeletingId(labelToDelete.id)
      try {
        await onDelete(labelToDelete.id)
      } finally {
        setDeletingId(null)
      }
      setDeleteModalOpen(false)
      setLabelToDelete(null)
    }
  }

  const hasChanges = (labelId: string, currentValue: string) => {
    const originalLabel =
      editingLabelData || labels.find((l) => l.id === labelId)
    if (!originalLabel) return false

    const nameChanged = originalLabel.name.trim() !== currentValue.trim()

    const originalColor = originalLabel.color || 'transparent'
    const currentColor = editingColor || 'transparent'
    const colorChanged = originalColor !== currentColor

    return nameChanged || colorChanged
  }

  return (
    <CustomModal
      isOpen={open}
      maxWidth={560}
      onClose={onClose}
      title={
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            color={theme.palette.text.primary}
            fontSize={20}
            fontWeight={700}
          >
            {t('manage_labels')}
          </Typography>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <SearchInput
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder={t('search_labels')}
          value={searchQuery}
        />
        <Stack height={240} spacing={2}>
          <Form
            onSubmit={handleCreateSubmit(onCreateLabel)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: 0,
            }}
          >
            <Stack alignItems="center" direction="row" spacing={1} width="100%">
              <TextField
                {...register('name')}
                fullWidth={true}
                placeholder={t('create_new_label')}
                size="small"
                variant="standard"
              />
              <IconButton
                onClick={(event) => handleColorPickerOpen(event, 'create')}
                size="small"
              >
                <Box
                  sx={{
                    backgroundColor: creatingColor || 'transparent',
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                    borderRadius: '50%',
                    height: 20,
                    width: 20,
                  }}
                />
              </IconButton>
              <IconButton
                aria-label="Create New Label"
                disabled={isCreating}
                size="small"
                sx={{ color: theme.palette.primary.main }}
                type="submit"
              >
                <CheckIcon
                  sx={{ color: theme.palette.primary.main, fontSize: 20 }}
                />
              </IconButton>
            </Stack>
          </Form>
          {filteredLabels.length > 0 ? (
            <List
              disablePadding={true}
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
              }}
            >
              {filteredLabels
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((label) => (
                  <ListItem
                    key={label.id}
                    secondaryAction={
                      editingId === label.id ? (
                        <Stack direction="row" spacing={1} sx={{ mr: 0 }}>
                          <IconButton
                            aria-label="Color Picker"
                            onClick={(event) =>
                              handleColorPickerOpen(event, 'edit')
                            }
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.1,
                                ),
                              },
                            }}
                          >
                            <Box
                              sx={{
                                backgroundColor:
                                  editingId === label.id
                                    ? editingColor || 'transparent'
                                    : label.color || 'transparent',
                                border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                                borderRadius: '50%',
                                height: 20,
                                width: 20,
                              }}
                            />
                          </IconButton>
                          {hasChanges(label.id, currentEditValue) ? (
                            <IconButton
                              aria-label="Confirm Edit"
                              disabled={isEditing}
                              onClick={handleEditSubmit(onEditLabel)}
                              size="small"
                              tabIndex={0}
                            >
                              <CheckIcon
                                sx={{
                                  color: theme.palette.primary.main,
                                  fontSize: 20,
                                }}
                              />
                            </IconButton>
                          ) : (
                            <IconButton
                              aria-label="Cancel Edit"
                              onClick={() => setEditingId(null)}
                              size="small"
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    0.1,
                                  ),
                                },
                              }}
                            >
                              <CloseOutlined
                                sx={{
                                  color: alpha(theme.palette.text.primary, 0.8),
                                  fontSize: 20,
                                }}
                              />
                            </IconButton>
                          )}
                        </Stack>
                      ) : (
                        <IconButton
                          aria-label="Edit Label"
                          onClick={() => setEditingId(label.id)}
                          size="small"
                          sx={{ mr: 0 }}
                          tabIndex={0}
                        >
                          <EditOutlinedIcon
                            sx={{
                              color: alpha(theme.palette.primary.main, 0.6),
                              fontSize: 20,
                            }}
                          />
                        </IconButton>
                      )
                    }
                    sx={{
                      '& .MuiListItemSecondaryAction-root': {
                        right: 0,
                      },
                      px: 0,
                      py: 1,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                      }}
                    >
                      {editingId === label.id ? (
                        <IconButton
                          aria-label="Delete Label"
                          disabled={deletingId === label.id}
                          onClick={() => handleDeleteLabel(label.id)}
                          size="small"
                          sx={{
                            '&:hover': {
                              bgcolor: 'none',
                              color: theme.palette.primary.main,
                            },
                            color: alpha(theme.palette.primary.main, 0.6),
                            p: 0,
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      ) : label.color && label.color !== 'transparent' ? (
                        <Label
                          sx={{
                            color: label.color || 'transparent',
                            opacity: 0.9,
                          }}
                        />
                      ) : (
                        <LabelOutlinedIcon
                          sx={{
                            color: theme.palette.text.secondary,
                            opacity: 0.9,
                          }}
                        />
                      )}
                    </ListItemIcon>
                    {editingId === label.id ? (
                      <form
                        autoComplete="off"
                        onSubmit={handleEditSubmit(onEditLabel)}
                        style={{ width: '100%' }}
                      >
                        <Controller
                          control={editControl}
                          name="name"
                          render={({ field }) => (
                            <InputBase
                              {...field}
                              disabled={isEditing}
                              inputProps={{ 'aria-label': 'Edit Label Name' }}
                              inputRef={inputRef}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              sx={{
                                '&:focus-within': {
                                  borderBottom: `1px solid ${theme.palette.primary.main}`,
                                },
                                borderBottom: `1px solid transparent`,
                                flex: 1,
                                fontSize: 16,
                                transition: 'border-color 0.2s',
                                width: '80%',
                              }}
                            />
                          )}
                        />
                        {editErrors.name && (
                          <FormHelperText
                            error={true}
                            sx={{ mb: 1, ml: 0, mt: 0 }}
                          >
                            {editErrors.name.message}
                          </FormHelperText>
                        )}
                      </form>
                    ) : (
                      <ListItemText
                        primary={label.name}
                        primaryTypographyProps={{
                          color: theme.palette.text.primary,
                          fontSize: 16,
                        }}
                      />
                    )}
                  </ListItem>
                ))}
            </List>
          ) : (
            <Stack
              sx={{
                alignItems: 'center',
                height: '100%',
                justifyContent: 'center',
              }}
            >
              <Typography
                color="text.secondary"
                sx={{ fontStyle: 'italic', textAlign: 'center' }}
                variant="body2"
              >
                {searchQuery ? 'No labels found' : 'No labels yet'}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>

      {/* Color Picker Dropdown */}
      <Menu
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        open={Boolean(colorPickerAnchor)}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              p: 1,
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 0.5,
            gridTemplateColumns: 'repeat(6, 1fr)',
            p: 0.5,
          }}
        >
          {LABEL_COLORS.map((color) => (
            <IconButton
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              size="small"
              sx={{
                borderRadius: '100%',
                height: 32,
                padding: 0,
                width: 32,
              }}
            >
              <Box
                sx={{
                  backgroundColor:
                    color.value === 'transparent' ? 'transparent' : color.value,
                  border:
                    color.value === 'transparent' ? '2px dashed #ccc' : 'none',
                  borderRadius: '50%',
                  height: 24,
                  width: 24,
                }}
              />
            </IconButton>
          ))}
        </Box>
      </Menu>

      <DeleteConfirmationModal
        handleClose={() => setDeleteModalOpen(false)}
        isOpen={deleteModalOpen}
        message={`Are you sure you want to delete the label "${labelToDelete?.name}"?`}
        onConfirmDelete={handleConfirmDelete}
        title="Delete Label"
      />
    </CustomModal>
  )
}
