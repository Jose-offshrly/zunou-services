import { Page, PageRightPane } from '@zunou-react/components/layout'
import { Outlet } from 'react-router-dom'

import { PageLeftMenu } from './components/PageLeftMenu'

export const MainLayout = () => {
  return (
    <Page>
      <PageLeftMenu />
      <PageRightPane>
        <Outlet />
      </PageRightPane>
    </Page>
  )
}
