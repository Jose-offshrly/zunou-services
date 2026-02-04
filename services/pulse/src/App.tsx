import './i18n/i18n'

import { App as AppBase, AppLayout } from '@zunou-react/components/layout'
import { AuthProviderWithAuth0Wrapper } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { Suspense } from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom'

import { Routes } from '~/services/Routes'

import { ThreadLayout } from './components/layouts/ThreadLayout'
import BootstrapPage from './pages/BootstrapPage'
import DashboardPage from './pages/DashboardPage'
import OrganizationBootstrapPage from './pages/OrganizationBootstrapPage'
import RegisterSlackUserPage from './pages/RegisterSlackUserPage'
import ThreadDetailPage from './pages/ThreadDetailPage'
import ThreadNewPage from './pages/ThreadNewPage'
import UserAcceptInvitePage from './pages/UserAcceptInvitePage/UserAcceptInvitePage'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppLayout />}>
      <Route element={<BootstrapPage />} path={Routes.Bootstrap} />
      <Route
        element={<OrganizationBootstrapPage />}
        path={Routes.OrganizationBootstrap}
      />
      <Route element={<DashboardPage />} path={Routes.Dashboard} />
      <Route
        element={<RegisterSlackUserPage />}
        path={Routes.RegisterSlackUser}
      />
      <Route element={<ThreadLayout />}>
        <Route element={<ThreadDetailPage />} path={Routes.ThreadDetail} />
        <Route element={<ThreadNewPage />} path={Routes.ThreadNew} />
      </Route>
      <Route
        element={<UserAcceptInvitePage />}
        path={Routes.UserAcceptInvite}
      />
    </Route>,
  ),
)

function App() {
  return (
    <AuthProviderWithAuth0Wrapper
      auth0Audience={import.meta.env.VITE_AUTH0_AUDIENCE}
      auth0ClientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      auth0Domain={import.meta.env.VITE_AUTH0_DOMAIN}
      coreGraphqlUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
    >
      <Suspense>
        <AppBase customTheme={theme} router={router} />
      </Suspense>
    </AuthProviderWithAuth0Wrapper>
  )
}

export default App
