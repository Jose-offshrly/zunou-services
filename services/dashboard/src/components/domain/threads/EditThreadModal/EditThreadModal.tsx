import { Box, Modal, TextField, Typography } from '@mui/material'
import { useUpdateThreadMutation } from '@zunou-queries/core/hooks/useUpdateThreadMutation'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
import { Card, CardActions, CardContent } from '@zunou-react/components/layout'
import { useForm } from 'react-hook-form'

import { zodResolver } from '~/libs/zod'
import {
  UpdateThreadParams,
  updateThreadSchema,
} from '~/schemas/UpdateThreadSchema'

interface EditThreadModalProps {
  id: string | null
  isOpen: boolean
  handleClose: () => void
}
const defaultThreadName = ''

export const EditThreadModal = ({
  id,
  isOpen,
  handleClose,
}: EditThreadModalProps) => {
  const { handleSubmit, register, reset } = useForm<UpdateThreadParams>({
    defaultValues: {
      name: defaultThreadName,
    },
    mode: 'onChange',
    resolver: zodResolver(updateThreadSchema),
  })

  const { isPending: isPendingUpdateThread, mutateAsync: updateThread } =
    useUpdateThreadMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const onSubmit = async ({ name }: UpdateThreadParams) => {
    if (!id) throw new Error('Thread ID not found.')

    try {
      await updateThread({
        id,
        name,
      })
    } catch (error) {
      throw new Error(`Failed to update thread name. Error: ${error}`)
    } finally {
      reset()
      handleClose()
    }
  }

  return (
    <Modal onClose={handleClose} open={isOpen}>
      <Box>
        <Form onSubmit={handleSubmit(onSubmit)}>
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
              <Typography component="div" gutterBottom={true}>
                New Thread Name
              </Typography>
              <TextField
                {...register('name')}
                id="name"
                required={true}
                size="small"
                sx={{ width: '100%' }}
              />
            </CardContent>
            <CardActions>
              <LoadingButton
                disableElevation={true}
                loading={isPendingUpdateThread}
                size="small"
                type="submit"
                variant="contained"
              >
                Save
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
