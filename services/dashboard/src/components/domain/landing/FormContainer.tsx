import { Stack } from '@mui/material'
import React from 'react'

const FormContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Stack
      bgcolor="common.white"
      border={1}
      borderColor="divider"
      borderRadius={5}
      height="fit-content"
      p={4}
      position="relative"
      width={{ md: '50%', sm: '100%' }}
      zIndex={50}
    >
      {children}
    </Stack>
  )
}

export default FormContainer
