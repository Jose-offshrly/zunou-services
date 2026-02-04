import { alpha } from '@mui/material/styles'
import { App as AppBase, AppLayout } from '@zunou-react/components/layout'
import { AuthProviderWithAuth0Wrapper } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { Toaster } from 'react-hot-toast'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom'

import BootstrapPage from '~/pages/BootstrapPage/BootstrapPage'
import OrganizationAgentEditPage from '~/pages/OrganizationAgentEditPage/OrganizationAgentEditPage'
import OrganizationAgentListPage from '~/pages/OrganizationAgentListPage/OrganizationAgentListPage'
import OrganizationAgentNewPage from '~/pages/OrganizationAgentNewPage/OrganizationAgentNewPage'
import OrganizationAgentShowPage from '~/pages/OrganizationAgentShowPage/OrganizationAgentShowPage'
import OrganizationListPage from '~/pages/OrganizationListPage/OrganizationListPage'
import OrganizationNewPage from '~/pages/OrganizationNewPage/OrganizationNewPage'
import OrganizationShowPage from '~/pages/OrganizationShowPage/OrganizationShowPage'
import OrganizationUserListPage from '~/pages/OrganizationUserListPage/OrganizationUserListPage'
import OrganizationUserNewPage from '~/pages/OrganizationUserNewPage/OrganizationUserNewPage'
import UserListPage from '~/pages/UserListPage/UserListPage'
import { Routes } from '~/services/Routes'

import { MainLayout } from './components/layouts/MainLayout'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppLayout />}>
      <Route element={<BootstrapPage />} path={Routes.Bootstrap} />
      <Route element={<MainLayout />}>
        <Route
          element={<OrganizationAgentEditPage />}
          path={Routes.OrganizationAgentEdit}
        />
        <Route
          element={<OrganizationAgentListPage />}
          path={Routes.OrganizationAgentList}
        />
        <Route
          element={<OrganizationAgentNewPage />}
          path={Routes.OrganizationAgentNew}
        />
        <Route
          element={<OrganizationAgentShowPage />}
          path={Routes.OrganizationAgentShow}
        />
        <Route
          element={<OrganizationListPage />}
          path={Routes.OrganizationList}
        />
        <Route
          element={<OrganizationNewPage />}
          path={Routes.OrganizationNew}
        />
        <Route
          element={<OrganizationShowPage />}
          path={Routes.OrganizationShow}
        />
        <Route
          element={<OrganizationUserListPage />}
          path={Routes.OrganizationUserList}
        />
        <Route
          element={<OrganizationUserNewPage />}
          path={Routes.OrganizationUserNew}
        />
        <Route element={<UserListPage />} path={Routes.UserList} />
      </Route>
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
      <Toaster
        toastOptions={{
          style: {
            backgroundColor: alpha(theme.palette.primary.main, 0.03),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 2,
            padding: '8px',
            width: 'auto',
          },
        }}
      />
      <AppBase router={router} />
    </AuthProviderWithAuth0Wrapper>
  )
}

export default App
