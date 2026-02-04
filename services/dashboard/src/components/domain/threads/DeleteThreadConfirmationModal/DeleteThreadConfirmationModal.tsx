import { Box, Modal, Typography } from '@mui/material'
import { useDeleteThreadMutation } from '@zunou-queries/core/hooks/useDeleteThreadMutation'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
import { Card, CardActions, CardContent } from '@zunou-react/components/layout'
import { theme } from 'zunou-react/services/Theme'

interface DeleteThreadConfirmationModalProps {
  id: string | null
  isOpen: boolean
  handleClose: () => void
}
export const DeleteThreadConfirmationModal = ({
  id,
  isOpen,
  handleClose,
}: DeleteThreadConfirmationModalProps) => {
  const { isPending: isPendingDeleteThread, mutateAsync: deleteThread } =
    useDeleteThreadMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleDeleteThread = async () => {
    if (!id) return
    handleClose()

    try {
      const deletedThread = await deleteThread({ id })

      console.log('Successfully deleted thread: ', deletedThread)
    } catch (e) {
      console.log('Error: ', e)
    }
  }

  return (
    <Modal onClose={handleClose} open={isOpen}>
      <Box>
        <Form onSubmit={handleDeleteThread}>
          <Card
            sx={{
              borderRadius: 1,
              left: '50%',
              maxWidth: 345,
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
            }}
          >
            <CardContent>
              <Typography
                component="div"
                gutterBottom={true}
                sx={{ color: theme.palette.warning.main }}
              >
                Warning!
              </Typography>
              <Typography>
                Are you sure you want to delete this thread?
              </Typography>
            </CardContent>
            <CardActions>
              <LoadingButton
                disableElevation={true}
                loading={isPendingDeleteThread}
                size="small"
                type="submit"
                variant="contained"
              >
                Confirm
              </LoadingButton>
              <Button onClick={handleClose} size="small">
                Cancel
              </Button>
            </CardActions>
          </Card>
        </Form>
      </Box>
    </Modal>
  )
}
