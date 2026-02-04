import { Note } from '@zunou-graphql/core/graphql'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface UseLabelHandlingProps {
  note?: Note
  editMode?: boolean
  onAddLabel?: (label: string) => void
  onRemoveLabel?: (label: string) => void
  addLabelToPool?: (label: string, color?: string) => void
}

export const useLabelHandling = ({
  note,
  editMode = false,
  onAddLabel,
  onRemoveLabel,
  addLabelToPool,
}: UseLabelHandlingProps) => {
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false)
  const [dropdownAnchor, setDropdownAnchor] = useState<HTMLElement | null>(null)
  const [noteLabels, setNoteLabels] = useState<string[]>(
    note?.labels?.map((label) =>
      typeof label === 'string' ? label : label.name,
    ) || [],
  )
  const [labelButtonDropdownOpen, setLabelButtonDropdownOpen] = useState(false)
  const [labelButtonAnchor, setLabelButtonAnchor] =
    useState<HTMLElement | null>(null)

  const memoizedLabels = useMemo(() => {
    return note?.labels || []
  }, [note?.labels])

  const memoizedNoteLabels = useMemo(() => {
    return (
      memoizedLabels.map((label) =>
        typeof label === 'string' ? label : label.name,
      ) || []
    )
  }, [memoizedLabels])

  useEffect(() => {
    setNoteLabels(memoizedNoteLabels)
  }, [memoizedNoteLabels])

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === '#') {
        setDropdownAnchor(e.currentTarget)
        setLabelDropdownOpen(true)
      }
    },
    [],
  )

  const handleContentKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '#') {
      setDropdownAnchor(e.currentTarget as HTMLElement)
      setLabelDropdownOpen(true)
    }
  }, [])

  const handleLabelSelect = useCallback(
    (label: string) => {
      setNoteLabels((prev) => {
        const isSelected = prev.includes(label)
        if (isSelected) {
          const newLabels = prev.filter((l) => l !== label)
          if (editMode && onRemoveLabel) {
            onRemoveLabel(label)
          }
          return newLabels
        } else {
          const newLabels = [...prev, label]
          if (editMode && onAddLabel) {
            onAddLabel(label)
          }
          return newLabels
        }
      })
    },
    [editMode, onAddLabel, onRemoveLabel],
  )

  const handleLabelCreate = useCallback(
    (label: string) => {
      if (addLabelToPool) addLabelToPool(label)
    },
    [addLabelToPool],
  )

  const handleRemoveLabel = useCallback(
    (label: string) => {
      setNoteLabels((prev) => prev.filter((l) => l !== label))
      if (onRemoveLabel && editMode) onRemoveLabel(label)
    },
    [editMode, onRemoveLabel],
  )

  const handleLabelButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setLabelButtonAnchor(event.currentTarget)
      setLabelButtonDropdownOpen(true)
    },
    [],
  )

  const handleLabelButtonSelect = useCallback(
    (label: string) => {
      setNoteLabels((prev) => {
        const isSelected = prev.includes(label)
        if (isSelected) {
          const newLabels = prev.filter((l) => l !== label)
          if (editMode && onRemoveLabel) {
            onRemoveLabel(label)
          }
          return newLabels
        } else {
          const newLabels = [...prev, label]
          if (editMode && onAddLabel) {
            onAddLabel(label)
          }
          return newLabels
        }
      })
    },
    [editMode, onAddLabel, onRemoveLabel],
  )

  const handleLabelButtonCreate = useCallback(
    (label: string) => {
      if (addLabelToPool) addLabelToPool(label)
    },
    [addLabelToPool],
  )

  return {
    dropdownAnchor,
    handleContentKeyDown,
    handleLabelButtonClick,
    handleLabelButtonCreate,
    handleLabelButtonSelect,
    handleLabelCreate,
    handleLabelSelect,
    handleRemoveLabel,
    handleTitleKeyDown,
    labelButtonAnchor,
    labelButtonDropdownOpen,
    labelDropdownOpen,
    noteLabels,
    setLabelButtonDropdownOpen,
    setLabelDropdownOpen,
  }
}
