import { Stack } from '@mui/system'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { DeleteThreadConfirmationModal } from '~/components/domain/threads/DeleteThreadConfirmationModal/DeleteThreadConfirmationModal'
import { EditThreadModal } from '~/components/domain/threads/EditThreadModal/EditThreadModal'
import { ThreadSidebar } from '~/components/domain/threads/ThreadSidebar/ThreadSidebar'

export const ThreadLayout = () => {
  const [isOpenEditThreadModal, setIsOpenEditThreadModal] = useState(false)
  const [
    isOpenDeleteThreadConfirmationModal,
    setIsOpenDeleteThreadConfirmationModal,
  ] = useState(false)
  const [editThreadId, setEditThreadId] = useState<string | null>(null)

  const handleOpenEditThreadModal = (id?: string | null) => {
    if (id) {
      setEditThreadId(id)
    }
    setIsOpenEditThreadModal(true)
  }

  const handleOpenDeleteThreadConfirmationModal = (id?: string | null) => {
    if (id) {
      setEditThreadId(id)
    }
    setIsOpenDeleteThreadConfirmationModal(true)
  }

  const handleCloseEditThreadModal = () => {
    setIsOpenEditThreadModal(false)
  }

  return (
    <Stack height="100vh" minHeight="100vh">
      <Stack
        direction="row"
        flexGrow={1}
        height="100%"
        justifyContent="space-between"
        overflow="hidden"
      >
        <ThreadSidebar
          openDeleteThreadConfirmationModal={
            handleOpenDeleteThreadConfirmationModal
          }
          openEditThreadModal={handleOpenEditThreadModal}
        />
        <Outlet />
        <EditThreadModal
          handleClose={handleCloseEditThreadModal}
          id={editThreadId}
          isOpen={isOpenEditThreadModal}
        />
        <DeleteThreadConfirmationModal
          handleClose={handleCloseEditThreadModal}
          id={editThreadId}
          isOpen={isOpenDeleteThreadConfirmationModal}
        />
      </Stack>
    </Stack>
  )
}
