import { DndContext } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Delete, DragIndicator, Edit, MoreVert } from '@mui/icons-material'
import {
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { TaskStatusType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { HexColorPicker } from 'react-colorful'
import { useTranslation } from 'react-i18next'

import { CustomModal } from '~/components/ui/CustomModal'

import { useStatusManager } from '../../hooks'

interface StatusManagerProps {
  open: boolean
  onClose: () => void
}

const DEFAULT_STATUSES = [
  { color: '#9E9E9E', label: 'To Do' },
  { color: '#FFC107', label: 'In Progress' },
  { color: '#4CAF50', label: 'Complete' },
]

// Reusable components
const ColorIndicator = ({
  color,
  onClick,
  size = 16,
}: {
  color: string
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  size?: number
}) => (
  <Stack
    onClick={onClick}
    sx={{
      backgroundColor: color,
      borderRadius: '50%',
      cursor: onClick ? 'pointer' : 'default',
      height: size,
      marginRight: 1.5,
      minHeight: size,
      minWidth: size,
      width: size,
      ...(onClick && {
        border: '1px solid',
        borderColor: 'divider',
      }),
    }}
  />
)

const StatusTypeRadioGroup = ({
  statusType,
  onStatusTypeChange,
}: {
  statusType: 'default' | 'custom'
  onStatusTypeChange: (type: 'default' | 'custom') => void
}) => (
  <RadioGroup
    onChange={(e) => onStatusTypeChange(e.target.value as 'default' | 'custom')}
    value={statusType}
  >
    <FormControlLabel
      control={<Radio />}
      label={
        <Stack>
          <Typography variant="body1">Use default</Typography>
          <Typography color="text.secondary" variant="caption">
            Use system default statuses
          </Typography>
        </Stack>
      }
      value="default"
    />
    <FormControlLabel
      control={<Radio />}
      label={
        <Stack>
          <Typography variant="body1">Use custom</Typography>
          <Typography color="text.secondary" variant="caption">
            Create and manage custom statuses
          </Typography>
        </Stack>
      }
      value="custom"
    />
  </RadioGroup>
)

const DefaultStatusesList = () => (
  <List>
    {DEFAULT_STATUSES.map((status) => (
      <ListItem
        key={status.label}
        sx={{
          backgroundColor: 'grey.50',
          borderRadius: 1,
          mb: 1,
        }}
      >
        <ColorIndicator color={status.color} />
        <ListItemText primary={status.label} />
      </ListItem>
    ))}
  </List>
)

const SortableStatusItem = ({
  status,
  editingStatus,
  editingLabel,
  editingColor,
  onEditColorClick,
  onKebabClick,
  onEditingLabelChange,
  onSaveEdit,
  onCancelEdit,
}: {
  status: TaskStatusType
  editingStatus: TaskStatusType | null
  editingLabel: string
  editingColor: string
  onEditColorClick: (e: React.MouseEvent<HTMLElement>) => void
  onKebabClick: (e: React.MouseEvent<HTMLElement>) => void
  onEditingLabelChange: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) => {
  const isEditing = editingStatus?.id === status.id
  const displayColor = isEditing ? editingColor : status.color || '#9E9E9E'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    disabled: !!editingStatus,
    id: status.id,
  })

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingLabel.trim()) {
      e.preventDefault()
      onSaveEdit()
    } else if (e.key === 'Escape') {
      // Cancel editing - don't save changes
      e.preventDefault()
      onCancelEdit()
    }
  }

  return (
    <ListItem
      ref={setNodeRef}
      secondaryAction={
        <Stack direction="row" spacing={0.5}>
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation()
              onKebabClick(e)
            }}
            size="small"
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Stack>
      }
      style={style}
      sx={{
        backgroundColor: 'grey.50',
        borderRadius: 1,
        mb: 1,
      }}
    >
      <IconButton
        {...attributes}
        {...listeners}
        size="small"
        sx={{
          '&:active': {
            cursor: editingStatus ? 'default' : 'grabbing',
          },
          cursor: editingStatus ? 'default' : 'grab',
        }}
      >
        <DragIndicator fontSize="small" sx={{ color: 'text.secondary' }} />
      </IconButton>
      <ColorIndicator
        color={displayColor}
        onClick={isEditing ? onEditColorClick : undefined}
      />
      <ListItemText
        primary={
          isEditing ? (
            <TextField
              autoFocus={true}
              fullWidth={true}
              onChange={(e) => onEditingLabelChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Press Enter to save, Escape to cancel"
              size="small"
              value={editingLabel}
              variant="outlined"
            />
          ) : (
            status.label
          )
        }
      />
    </ListItem>
  )
}

const AddNewStatusInput = ({
  newStatusColor,
  newStatusLabel,
  isCreating,
  onColorPickerOpen,
  onLabelChange,
  onAdd,
}: {
  newStatusColor: string
  newStatusLabel: string
  isCreating: boolean
  onColorPickerOpen: (e: React.MouseEvent<HTMLElement>) => void
  onLabelChange: (value: string) => void
  onAdd: () => void
}) => (
  <ListItem
    sx={{
      backgroundColor: 'grey.50',
      borderRadius: 1,
      marginTop: 0,
    }}
  >
    <Stack
      alignItems="center"
      direction="row"
      spacing={1.5}
      sx={{ marginTop: 0, width: '100%' }}
    >
      <ColorIndicator color={newStatusColor} onClick={onColorPickerOpen} />
      <TextField
        fullWidth={true}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="Enter Status Name"
        size="small"
        value={newStatusLabel}
        variant="outlined"
      />
      <Button
        disabled={!newStatusLabel.trim() || isCreating}
        onClick={onAdd}
        size="small"
        variant="contained"
      >
        Add
      </Button>
    </Stack>
  </ListItem>
)

const ColorPickerPopover = ({
  anchorEl,
  editingStatus,
  editingColor,
  newStatusColor,
  onClose,
  onColorChange,
  applyText,
}: {
  anchorEl: HTMLElement | null
  editingStatus: TaskStatusType | null
  editingColor: string
  newStatusColor: string
  onClose: () => void
  onColorChange: (color: string) => void
  applyText: string
}) => (
  <Popover
    anchorEl={anchorEl}
    anchorOrigin={{
      horizontal: 'left',
      vertical: 'bottom',
    }}
    onClose={onClose}
    open={Boolean(anchorEl)}
    transformOrigin={{
      horizontal: 'left',
      vertical: 'top',
    }}
  >
    <Stack spacing={2} sx={{ p: 2 }}>
      <HexColorPicker
        color={editingStatus ? editingColor : newStatusColor}
        onChange={onColorChange}
      />
      <Button
        fullWidth={true}
        onClick={onClose}
        size="small"
        variant="contained"
      >
        {applyText}
      </Button>
    </Stack>
  </Popover>
)

export const StatusManager = ({ open, onClose }: StatusManagerProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const {
    canDelete,
    colorPickerAnchorEl,
    customStatuses,
    editingColor,
    editingLabel,
    editingStatus,
    handleAddNewStatus,
    handleCancelEdit,
    handleColorPickerClose,
    handleColorPickerOpen,
    handleDragEnd,
    handleEdit,
    handleEditColorClick,
    handleKebabClick,
    handleKebabClose,
    handleDelete,
    handleSaveEdit,
    handleStatusTypeChange,
    isCreating,
    isLoadingStatuses,
    kebabAnchorEl,
    canEdit,
    newStatusColor,
    newStatusLabel,
    setEditingColor,
    setEditingLabel,
    setNewStatusColor,
    setNewStatusLabel,
    statusType,
  } = useStatusManager(open)

  const handleColorChange = (color: string) => {
    if (editingStatus) {
      setEditingColor(color)
    } else {
      setNewStatusColor(color)
    }
  }

  return (
    <>
      <CustomModal
        isOpen={open}
        maxWidth={640}
        onClose={onClose}
        title="Status Manager"
      >
        <Stack spacing={3}>
          {/* Section 1: Status Type */}
          <Stack spacing={2}>
            <Typography fontWeight="bold" variant="subtitle1">
              Status type
            </Typography>
            <StatusTypeRadioGroup
              onStatusTypeChange={handleStatusTypeChange}
              statusType={statusType}
            />
          </Stack>

          <Divider />

          {/* Section 2: Status List */}
          {statusType === 'default' ? (
            <Stack spacing={2}>
              <Typography fontWeight="bold" variant="subtitle1">
                Default Statuses
              </Typography>
              <DefaultStatusesList />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography fontWeight="bold" variant="subtitle1">
                Custom Statuses
              </Typography>

              {/* Helper text */}
              <Typography color="text.secondary" variant="body2">
                Note: The first status represents the start of the workflow, and
                the last status represents completion.
              </Typography>

              {/* Custom Status List */}
              {isLoadingStatuses ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ minHeight: 200, py: 4 }}
                >
                  <CircularProgress size={40} />
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 2 }}
                    variant="body2"
                  >
                    Loading statuses...
                  </Typography>
                </Stack>
              ) : (
                <DndContext onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={customStatuses.map((status) => status.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <List
                      sx={{
                        maxHeight: 300,
                        overflow: 'auto',
                        overflowX: 'non',
                      }}
                    >
                      {customStatuses.map((status) => (
                        <SortableStatusItem
                          editingColor={editingColor}
                          editingLabel={editingLabel}
                          editingStatus={editingStatus}
                          key={status.id}
                          onCancelEdit={handleCancelEdit}
                          onEditColorClick={handleEditColorClick}
                          onEditingLabelChange={setEditingLabel}
                          onKebabClick={(e) => handleKebabClick(e, status)}
                          onSaveEdit={handleSaveEdit}
                          status={status}
                        />
                      ))}

                      <Divider />
                    </List>
                  </SortableContext>
                </DndContext>
              )}

              {/* Add new status input */}
              <AddNewStatusInput
                isCreating={isCreating}
                newStatusColor={newStatusColor}
                newStatusLabel={newStatusLabel}
                onAdd={handleAddNewStatus}
                onColorPickerOpen={handleColorPickerOpen}
                onLabelChange={setNewStatusLabel}
              />

              {/* Color Picker Popover */}
              <ColorPickerPopover
                anchorEl={colorPickerAnchorEl}
                applyText={t('apply', { ns: 'tasks' }) || 'Apply'}
                editingColor={editingColor}
                editingStatus={editingStatus}
                newStatusColor={newStatusColor}
                onClose={handleColorPickerClose}
                onColorChange={handleColorChange}
              />
            </Stack>
          )}
        </Stack>
      </CustomModal>

      {/* Kebab Menu */}
      <Menu
        anchorEl={kebabAnchorEl?.element}
        onClose={handleKebabClose}
        open={Boolean(kebabAnchorEl)}
      >
        <MenuItem
          disabled={!canEdit(kebabAnchorEl?.status)}
          onClick={() => {
            if (kebabAnchorEl) {
              handleEdit(kebabAnchorEl.status)
            }
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          disabled={!canDelete(kebabAnchorEl?.status)}
          onClick={() => {
            if (kebabAnchorEl) {
              handleDelete(kebabAnchorEl.status)
            }
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  )
}
