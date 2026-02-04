import { BoxProps } from '@mui/material'
import type { PropsWithChildren } from 'react'

import { Page, PageContent } from './'

export const FullPageLayout = ({
  children,
  ...props
}: PropsWithChildren<BoxProps>) => {
  return (
    <Page>
      <PageContent alignItems="stretch" justifyContent="center" {...props}>
        {children}
      </PageContent>
    </Page>
  )
}
