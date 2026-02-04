import 'react-quill/dist/quill.snow.css'

import { CardContent, CardHeader, Stack } from '@mui/material'
import { Label, Note } from '@zunou-graphql/core/graphql'
import { Card } from '@zunou-react/components/layout'
import { theme } from '@zunou-react/services/Theme'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FieldErrors, UseFormRegister } from 'react-hook-form'
import ReactQuill from 'react-quill'

import { useAccessControl } from '~/hooks/useAccessControl'
import { usePulseStore } from '~/store/usePulseStore'
import { PulsePermissionEnum } from '~/types/permissions'

import { NoteAttachmentInputWithTempUrl } from '..'
import { FileAttachment } from '../components/FileAttachment'
import { LinkModal } from '../components/LinkModal'
import { LabelDropdown } from '../Labels/LabelDropdown'
import { NoteItemLabels } from '../Notes/components'
import { transformFileToGraphQLFile } from '../utils/fileUtils'
import { processHashtags } from '../utils/textUtils'
import { DragOverlay } from './components/DragOverlay'
import { NoteCardHeader } from './components/NoteCardHeader'
import { NoteContentEditor } from './components/NoteContentEditor'
import { NoteFooter } from './components/NoteFooter'
import { NoteToolbar } from './components/NoteToolbar'
import { useEditorHandling } from './hooks/useEditorHandling'
import { useFileHandling } from './hooks/useFileHandling'
import { useLabelHandling } from './hooks/useLabelHandling'

interface NoteCardProps {
  note?: Note
  onTitleChange: (val: string) => void
  onContentChange: (val: string) => void
  onSave: () => void
  editMode?: boolean
  isGrid?: boolean
  onClose?: () => void
  errors?: FieldErrors<Record<string, unknown>>
  register?: UseFormRegister<Record<string, unknown>>
  isValid?: boolean
  onAddLabel?: (label: string) => void
  onRemoveLabel?: (label: string) => void
  labelPool?: Label[]
  addLabelToPool?: (label: string, color?: string) => void
  onTogglePin?: () => void
  onFileChange?: (attachments: NoteAttachmentInputWithTempUrl[]) => void
  createDataSourceFromNote?: (
    noteId: string,
    noteTitle: string,
    noteContent?: string,
  ) => Promise<void>
  isCreatingDataSource?: boolean
  canCreateDataSource?: boolean
  onDelete?: () => void
  onRemoveExistingFile?: (fileId: string) => void
  tempAttachment?: NoteAttachmentInputWithTempUrl

  hideBorder?: boolean
  hideSend?: boolean
  hideClose?: boolean
  hideDelete?: boolean
  hideAttachment?: boolean
}

export const NoteCard = ({
  note,
  onTitleChange,
  onContentChange,
  onSave,
  editMode = false,
  onClose,
  errors,
  isValid = true,
  onAddLabel,
  onRemoveLabel,
  labelPool = [],
  addLabelToPool,
  onTogglePin,
  onFileChange,
  createDataSourceFromNote,
  isCreatingDataSource,
  canCreateDataSource = true,
  onDelete,
  onRemoveExistingFile,
  tempAttachment,
  hideBorder = false,
  hideSend = false,
  hideClose = false,
  hideDelete = false,
  hideAttachment = false,
}: NoteCardProps) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const quillEditorRef = useRef<ReactQuill>(null)

  // Local state for immediate UI feedback
  const [localTitle, setLocalTitle] = useState(note?.title || '')
  const [localContent, setLocalContent] = useState(note?.content || '')

  useEffect(() => {
    setLocalTitle(note?.title ?? localTitle)
  }, [note?.title])

  useEffect(() => {
    setLocalContent(note?.content ?? localContent)
  }, [note?.content])

  // Debounced callbacks to parent component
  const debouncedOnTitleChange = useMemo(
    () =>
      _.debounce((value: string) => {
        onTitleChange(value)
      }, 500), // Fast debounce for better UX
    [onTitleChange],
  )

  const debouncedOnContentChange = useMemo(
    () =>
      _.debounce((value: string) => {
        onContentChange(value)
      }, 500),
    [onContentChange],
  )

  // Cleanup debounced functions
  useEffect(() => {
    return () => {
      debouncedOnTitleChange.cancel()
      debouncedOnContentChange.cancel()
    }
  }, [debouncedOnTitleChange, debouncedOnContentChange])

  const {
    selectedFile,
    uploadedAttachment,
    uploadedFileTempUrl,
    originalFileName,
    isDragOver,
    isUploading,
    uploadProgress,
    fileInputRef,
    handleFileInputChange,
    handleFileButtonClick,
    handleRemoveFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    existingFileRemoved,
  } = useFileHandling({
    existingFile: transformFileToGraphQLFile(
      note?.files && note.files.length > 0 ? note.files[0] : undefined,
    ),
    onFileChange,
    onRemoveExistingFile: (fileId: string) => {
      if (onRemoveExistingFile) {
        onRemoveExistingFile(fileId)
      }
    },
  })

  const {
    labelDropdownOpen,
    dropdownAnchor,
    noteLabels,
    labelButtonDropdownOpen,
    labelButtonAnchor,
    handleTitleKeyDown,
    handleContentKeyDown,
    handleLabelSelect,
    handleLabelCreate,
    handleRemoveLabel,
    handleLabelButtonClick,
    handleLabelButtonSelect,
    handleLabelButtonCreate,
    setLabelDropdownOpen,
    setLabelButtonDropdownOpen,
  } = useLabelHandling({
    addLabelToPool,
    editMode,
    note,
    onAddLabel,
    onRemoveLabel,
  })

  // Create optimized handlers that update local state immediately and debounce parent calls
  const handleTitleChangeOptimized = useCallback(
    (val: string) => {
      setLocalTitle(val) // Immediate UI update
      debouncedOnTitleChange(val) // Debounced parent callback
      processHashtags(val)
    },
    [debouncedOnTitleChange],
  )

  const handleContentChangeOptimized = useCallback(
    (val: string) => {
      setLocalContent(val) // Immediate UI update
      debouncedOnContentChange(val) // Debounced parent callback
    },
    [debouncedOnContentChange],
  )

  const { handleContentChange, handleFormat, handleAddLink, handleLinkClick } =
    useEditorHandling({
      onContentChange: handleContentChangeOptimized,
      quillRef: quillEditorRef,
    })

  useEffect(() => {
    if (note?.files && note.files.length > 0) {
      const file = note.files[0]

      if (onFileChange) {
        onFileChange([
          {
            fileKey: file.path,
            fileName: file.file_name || file.path.split('/').pop() || 'file',
            tempUrl: '',
            type: file.type || 'application/octet-stream',
          },
        ])
      }
    }
  }, [note?.files, onFileChange])

  // Access control
  const { permissions } = usePulseStore()
  const { checkAccess } = useAccessControl()
  const { grant: hasAccess } = checkAccess(
    [PulsePermissionEnum.CREATE_DATA_SOURCE],
    permissions,
  )

  const hasContent = note?.title && note?.content
  const hasExistingDataSource = !!note?.dataSource

  // Create note object with local state for immediate UI updates
  const noteWithLocalState = useMemo(() => {
    if (!note) return undefined

    return {
      ...note,
      content: localContent,
      // Ensure required fields have default values
      id: note.id || '',

      title: localTitle,
    } as Note
  }, [note, localTitle, localContent])

  return (
    <>
      <Card
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          border: hideBorder
            ? 0
            : isDragOver
              ? `1px dashed ${theme.palette.primary.main}`
              : `1px solid ${theme.palette.divider}`,
          transition: 'border 0.2s ease-in-out',
        }}
      >
        <CardHeader
          title={
            <NoteCardHeader
              editMode={editMode}
              errors={errors}
              hideClose={hideClose}
              note={noteWithLocalState}
              onClose={onClose}
              onTitleChange={handleTitleChangeOptimized}
              onTitleKeyDown={handleTitleKeyDown}
              onTogglePin={onTogglePin}
            />
          }
        />
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxHeight: '45vh',
            overflow: 'auto',
          }}
        >
          <DragOverlay isDragOver={isDragOver} />

          <NoteContentEditor
            editMode={editMode}
            note={noteWithLocalState}
            onContentChange={handleContentChange}
            onContentKeyDown={handleContentKeyDown}
            onLinkClick={handleLinkClick}
            ref={quillEditorRef}
          />
          {(tempAttachment ||
            selectedFile ||
            uploadedAttachment ||
            (note?.files && note.files.length > 0 && !existingFileRemoved)) && (
            <FileAttachment
              existingFile={
                note?.files && note.files.length > 0 && !existingFileRemoved
                  ? note.files[0]
                  : null
              }
              isUploading={isUploading}
              onRemoveFile={handleRemoveFile}
              originalFileName={originalFileName}
              selectedFile={selectedFile}
              uploadProgress={uploadProgress}
              uploadedAttachment={tempAttachment || uploadedAttachment}
              uploadedFileTempUrl={
                tempAttachment ? tempAttachment.tempUrl : uploadedFileTempUrl
              }
            />
          )}
        </CardContent>

        <Stack p={1} px={2} spacing={1}>
          <NoteItemLabels
            labelPool={labelPool}
            note={note!}
            onRemoveLabel={(_: string, label: string) => {
              handleRemoveLabel(label)
            }}
          />
          <NoteFooter note={note} />

          <LabelDropdown
            anchorEl={dropdownAnchor}
            anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
            labels={labelPool.map((label) => label.name)}
            onClose={() => setLabelDropdownOpen(false)}
            onCreate={handleLabelCreate}
            onSelect={handleLabelSelect}
            open={labelDropdownOpen}
            selectedLabels={noteLabels}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          />
          <LabelDropdown
            anchorEl={labelButtonAnchor}
            anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
            labels={labelPool.map((label) => label.name)}
            onClose={() => setLabelButtonDropdownOpen(false)}
            onCreate={handleLabelButtonCreate}
            onSelect={handleLabelButtonSelect}
            open={labelButtonDropdownOpen}
            selectedLabels={noteLabels}
            transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          />
        </Stack>

        <NoteToolbar
          canCreateDataSource={canCreateDataSource}
          createDataSourceFromNote={createDataSourceFromNote}
          editMode={editMode}
          hasAccess={hasAccess}
          hasContent={!!hasContent}
          hasExistingDataSource={hasExistingDataSource}
          hideAttachment={hideAttachment}
          hideDelete={hideDelete}
          hideSend={hideSend}
          isCreatingDataSource={isCreatingDataSource}
          isUploading={isUploading}
          isValid={isValid}
          note={note}
          onAddLink={() => setLinkModalOpen(true)}
          onDelete={onDelete}
          onFileButtonClick={handleFileButtonClick}
          onFormat={handleFormat}
          onLabelButtonClick={handleLabelButtonClick}
          onSave={onSave}
        />
        <input
          accept=".csv,.doc,.docx,.html,.markdown,.md,.pdf,.ppt,.pptx,.rtf,.txt,.xls,.xlsx,.mp4,.jpeg,.jpg,.png,.svg,.webp"
          onChange={handleFileInputChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />
      </Card>
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onSubmit={handleAddLink}
      />
    </>
  )
}
