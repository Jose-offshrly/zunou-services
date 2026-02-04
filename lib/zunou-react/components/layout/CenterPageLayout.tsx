import { BoxProps } from '@mui/material'
import type { PropsWithChildren } from 'react'

import { Page, PageContent } from './'

export const CenterPageLayout = ({
  children,
  ...props
}: PropsWithChildren<BoxProps>) => {
  return (
    <Page sx={{ paddingLeft: { xs: 0 }, paddingRight: { xs: 0 } }}>
      <PageContent
        alignItems="center"
        justifyContent="center"
        padding={0}
        {...props}
      >
        {children}
      </PageContent>
    </Page>
  )
}
