import { Stack } from '@mui/system'
import { Button } from '@zunou-react/components/form'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AddItemDialog } from '../../../../components'

interface AddTaskButtonProps {
  parentId: string
}

const AddTaskButton = ({ parentId }: AddTaskButtonProps) => {
  const { t } = useTranslation('tasks')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Stack py={2}>
        <Button
          onClick={() => setIsDialogOpen(true)}
          sx={{ width: 'fit-content' }}
          variant="text"
        >
          {t('add_task')}
        </Button>
      </Stack>
      <AddItemDialog
        initialMode="task"
        initialParentId={parentId}
        onClose={() => setIsDialogOpen(false)}
        open={isDialogOpen}
      />
    </>
  )
}

export default AddTaskButton
