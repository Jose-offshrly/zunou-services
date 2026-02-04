import { ContainerProps } from '@mui/material'
import type { ReactNode } from 'react'

import { Page, PageContent } from './'

interface PageSplitProps extends ContainerProps {
  children: [ReactNode, ReactNode]
}

export const SplitPageLayout = ({ children, ...props }: PageSplitProps) => {
  const [left, right] = children

  const paneStyles = {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 0,
  }

  return (
    <Page sx={{ paddingLeft: { xs: 0 }, paddingRight: { xs: 0 } }} {...props}>
      <PageContent sx={paneStyles}>{left}</PageContent>

      <PageContent sx={paneStyles}>{right}</PageContent>
    </Page>
  )
}
