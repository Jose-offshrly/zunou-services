import { PostAddOutlined } from '@mui/icons-material'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import { Stack, Tooltip } from '@mui/material'
import { Label, Note } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form/IconButton'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAccessControl } from '~/hooks/useAccessControl'
import { usePulseStore } from '~/store/usePulseStore'
import { PulsePermissionEnum } from '~/types/permissions'

import { LabelDropdown } from '../../Labels/LabelDropdown'
import { getDataSourceTooltipMessage } from '../../utils/labelUtils'

interface NoteItemActionsProps {
  note: Note
  hovered: boolean
  onAddLabelToNote: (noteId: string, label: string) => void
  onRemoveLabelFromNote: (noteId: string, label: string) => void
  labelPool: Label[]
  addLabelToPool: (label: string, color?: string) => void
  onCreateDataSource: () => void
  isCreatingDataSource: boolean
  onDelete: () => void
}

export const NoteItemActions = ({
  note,
  hovered,
  onAddLabelToNote,
  onRemoveLabelFromNote,
  labelPool,
  addLabelToPool,
  onCreateDataSource,
  isCreatingDataSource,
  onDelete,
}: NoteItemActionsProps) => {
  const { t } = useTranslation('notes')

  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false)
  const [labelDropdownAnchor, setLabelDropdownAnchor] =
    useState<HTMLElement | null>(null)

  const { permissions } = usePulseStore()
  const { checkAccess } = useAccessControl()
  const { grant: hasAccess } = checkAccess(
    [PulsePermissionEnum.CREATE_DATA_SOURCE],
    permissions,
  )

  const hasContent = note.title && note.content
  const hasExistingDataSource = note.dataSource !== null
  const canCreateDataSource = hasAccess && hasContent
  const isDisabled =
    !canCreateDataSource || hasExistingDataSource || isCreatingDataSource

  const handleLabelButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      setLabelDropdownAnchor(e.currentTarget)
      setLabelDropdownOpen(true)
    },
    [],
  )

  const selectedLabels = useMemo(
    () => note.labels?.map((label) => label.name) || [],
    [note.labels],
  )

  const labelNames = useMemo(
    () => labelPool.map((label) => label.name),
    [labelPool],
  )

  const handleLabelSelect = useCallback(
    (label: string) => {
      const isSelected = selectedLabels.includes(label)
      if (isSelected) {
        onRemoveLabelFromNote(note.id, label)
      } else {
        onAddLabelToNote(note.id, label)
      }
    },
    [note.id, selectedLabels, onAddLabelToNote, onRemoveLabelFromNote],
  )

  const handleLabelCreate = useCallback(
    (label: string) => {
      addLabelToPool(label)
    },
    [addLabelToPool],
  )

  return (
    <Stack spacing={1} width="100%">
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="flex-start"
        visibility={hovered ? 'visible' : 'hidden'}
      >
        <Tooltip placement="bottom" title={t('add_label')}>
          <IconButton onClick={handleLabelButtonClick} size="small">
            <LabelOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>

        <Tooltip
          placement="bottom"
          title={getDataSourceTooltipMessage(
            hasAccess,
            !!hasContent,
            hasExistingDataSource,
            isCreatingDataSource,
          )}
        >
          <IconButton
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation()
              onCreateDataSource()
            }}
            size="small"
          >
            <PostAddOutlined fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip placement="bottom" title={t('delete')}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            size="small"
          >
            <DeleteOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>
      <LabelDropdown
        anchorEl={labelDropdownAnchor}
        labels={labelNames}
        onClose={useCallback(() => setLabelDropdownOpen(false), [])}
        onCreate={handleLabelCreate}
        onSelect={handleLabelSelect}
        open={labelDropdownOpen}
        selectedLabels={selectedLabels}
      />
    </Stack>
  )
}
