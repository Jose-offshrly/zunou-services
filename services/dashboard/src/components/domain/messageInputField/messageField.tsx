import { Stack } from '@mui/material'
import { MessageInputV2 } from '@zunou-react/components/form/MessageInputV2'
import { useState } from 'react'
import { Control, useController, UseFormRegister } from 'react-hook-form'

import type { ThreadMessageInput } from '~/schemas/ThreadMessageSchema'
import { usePulseStore } from '~/store/usePulseStore'

import { MessageMenu } from './MessageMenu'

interface IMessageField {
  handleSubmit: () => void
  isLoadingSubmission: boolean
  isValid: boolean
  register: UseFormRegister<ThreadMessageInput>
  control: Control<ThreadMessageInput>
  placeholder?: string
  disabled?: boolean
}

export const MessageField = ({
  handleSubmit,
  isLoadingSubmission,
  isValid,
  register,
  control,
  placeholder,
  disabled = false,
}: IMessageField) => {
  const [isInfoMenuVisible, setInfoMenuVisible] = useState(false)
  const { field } = useController({ control, name: 'message' })
  const { pulse } = usePulseStore()

  const toggleInfoMenu = () => setInfoMenuVisible((prev) => !prev)

  const handleMenuItemClick = (title: string) => {
    field.onChange(title)
    setInfoMenuVisible(false)
  }

  return (
    <Stack
      alignItems="center"
      justifyContent="flex-start"
      position="relative"
      width="100%"
    >
      <Stack
        sx={{
          opacity: disabled ? 0.35 : 1,
          ...(disabled && {
            '& *': {
              cursor: 'not-allowed !important',
            },
            cursor: 'not-allowed',
          }),
        }}
        width="100%"
      >
        <MessageMenu
          isVisible={isInfoMenuVisible}
          onItemClick={handleMenuItemClick}
        />
        <MessageInputV2
          control={control}
          handleSubmit={handleSubmit}
          isLoadingSubmission={isLoadingSubmission}
          isValid={isValid}
          onInfoClick={toggleInfoMenu}
          placeholder={placeholder}
          pulseType={pulse?.type ?? ''}
          register={register}
        />
      </Stack>
    </Stack>
  )
}
