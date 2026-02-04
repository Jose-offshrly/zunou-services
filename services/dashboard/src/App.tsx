import './i18n'

import { useAuth0 } from '@auth0/auth0-react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as Sentry from '@sentry/react'
import { App as AppBase, AppLayout } from '@zunou-react/components/layout'
import { AuthProviderWithAuth0Wrapper } from '@zunou-react/contexts/AuthContext'
import { createAppTheme } from '@zunou-react/services/Theme'
import { Suspense, useEffect } from 'react'
import { CookiesProvider } from 'react-cookie'
import { Toaster } from 'react-hot-toast'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom'

import { NotFoundPage } from '~/components/domain/notfound/NotFoundPage'
import {
  MainLayoutWithAuth,
  PulseLayout,
  ThreadLayout,
} from '~/components/layouts'
import { AgentProvider } from '~/context/AgentContext'
import { DataSourceProvider } from '~/context/DataSourceContext'
import { DirectMessagesProvider } from '~/context/DirectMessagesContext'
import { IntegrationProvider } from '~/context/IntegrationContext'
import { MeetingsProvider } from '~/context/MeetingsContext'
import { PusherProvider } from '~/context/PusherContext'
import { SidebarProvider } from '~/context/SidebarContext'
import { VitalsProvider } from '~/context/VitalsContext'
import MCPAuthCallbackPage from '~/pages/auth/MCPAuthCallbackPage'
import BootstrapPage from '~/pages/BootstrapPage/BootstrapPage'
import { InsightsPage } from '~/pages/InsightsPage'
import BillingAndPaymentPage from '~/pages/manager/BillingAndPaymentPage/BillingAndPaymentPage'
import BillingCancelPage from '~/pages/manager/BillingCancelPage/BillingCancelPage'
import BillingSuccessPage from '~/pages/manager/BillingSuccessPage/BillingSuccessPage'
import CreateCustomPulse from '~/pages/manager/CreatePulsePage/CreateCustomPulse'
import CreateOneOnOnePulse from '~/pages/manager/CreatePulsePage/CreateOneOnOnePulse'
import DataScientistDownloadPage from '~/pages/manager/DataScientistDownloadPage/DataScientistDownloadPage'
import DataSourceDownloadPage from '~/pages/manager/DataSourceDownloadPage/DataSourceDownloadPage'
import DataSourceEditPage from '~/pages/manager/DataSourceEditPage/DataSourceEditPage'
import DataSourceListPage from '~/pages/manager/DataSourceListPage/DataSourceListPage'
import DataSourceShowPage from '~/pages/manager/DataSourceShowPage/DataSourceShowPage'
// import { DirectMessagesPage } from '~/pages/manager/DirectMessagesPage'
import OnboardingCompletePage from '~/pages/manager/OnboardingCompletePage/OnboardingCompletePage'
import OnboardingDataSourcesPage from '~/pages/manager/OnboardingDataSourcesPage/OnboardingDataSourcesPage'
import OnboardingSlackAuthCallbackPage from '~/pages/manager/OnboardingSlackAuthCallbackPage/OnboardingSlackAuthCallbackPage'
import OnboardingSlackPage from '~/pages/manager/OnboardingSlackPage/OnboardingSlackPage'
import OnboardingTermsPage from '~/pages/manager/OnboardingTermsPage/OnboardingTermsPage'
import OrgChartPage from '~/pages/manager/OrgChartPage'
import PulseDetailPage from '~/pages/manager/PulseDetailPage/PulseDetailPage'
import PulseNewPage from '~/pages/manager/PulseNewPage/PulseNewPage'
import { PulseTaskPage } from '~/pages/manager/PulseTaskPage'
import SettingsSlackAuthCallbackPage from '~/pages/manager/SettingsSlackAuthCallbackPage/SettingsSlackAuthCallbackPage'
import SettingsSlackPage from '~/pages/manager/SettingsSlackPage/SettingsSlackPage'
import TeamChatPage from '~/pages/manager/TeamChatPage'
import ThreadDetailPage from '~/pages/manager/ThreadDetailPage'
import ThreadNewPage from '~/pages/manager/ThreadNewPage'
import UserAcceptInvitePage from '~/pages/manager/UserAcceptInvitePage/UserAcceptInvitePage'
import UserListPage from '~/pages/manager/UserListPage/UserListPage'
import UserNewPage from '~/pages/manager/UserNewPage/UserNewPage'
import UserShowPage from '~/pages/manager/UserShowPage/UserShowPage'
import OrganizationBootstrapPage from '~/pages/OrganizationBootstrapPage/OrganizationBootstrapPage'
import { RecommendedInsightsPage } from '~/pages/RecommendedInsightsPage'
import VitalsPage from '~/pages/VitalsPage/VitalsPage'
import VitalsRedirectPage from '~/pages/VitalsRedirectPage/VitalsRedirectPage'
import { Routes } from '~/services/Routes'
import { setEnvironmentFavicon } from '~/utils/favicon'

import { InsightLayout } from './components/layouts/InsightLayout'
import { JoyrideProvider } from './context/JoyrideContext'
import { InsightDetailPage } from './pages/InsightDetailPage'
import { InterestPage } from './pages/InterestPage/InterestPage'
import LandingPage from './pages/LandingPage/LandingPage'
import { CalendarPage } from './pages/manager/CalendarPage'
import CompanionStatusPage from './pages/manager/CompanionStatusPage'
import NotesPage from './pages/manager/NotesPage'
import PulseFeedPage from './pages/manager/PulseFeedPage'
import NoAccountPage from './pages/NoAccountPage/NoAccountPage'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppLayout />}>
      {/* Public Routes */}
      <Route
        element={<UserAcceptInvitePage />}
        path={Routes.UserAcceptInvite}
      />
      <Route element={<InterestPage />} path={Routes.RegisterInterest} />
      <Route element={<NoAccountPage />} path={Routes.NoAccount} />

      {/* Protected Routes */}
      <Route element={<BootstrapPage />} path={Routes.Bootstrap} />
      <Route
        element={<OrganizationBootstrapPage />}
        path={Routes.OrganizationBootstrap}
      />
      <Route
        element={<DataScientistDownloadPage />}
        path={Routes.DataScientistDownload}
      />
      <Route
        element={<DataSourceDownloadPage />}
        path={Routes.DataSourceDownload}
      />
      <Route element={<MainLayoutWithAuth />} path="employee">
        <Route element={<PulseLayout />}>
          <Route element={<PulseDetailPage />} path={Routes.PulseDetail} />
          <Route
            element={<InsightDetailPage />}
            path={Routes.PulseInsightDetails}
          />
          <Route element={<PulseFeedPage />} path={Routes.PulseFeed} />
          <Route element={<PulseTaskPage />} path={Routes.PulseTasks} />
          <Route element={<TeamChatPage />} path={Routes.PulseTeamChat} />
          <Route element={<OrgChartPage />} path={Routes.OrgChart} />
          <Route element={<NotesPage />} path={Routes.PulseNotes} />
          <Route element={<CalendarPage />} path={Routes.PulseCalendar} />
        </Route>
        <Route
          element={<CompanionStatusPage />}
          path={Routes.CompanionStatus}
        />
      </Route>
      <Route element={<MainLayoutWithAuth />} path="guest">
        <Route element={<PulseLayout />}>
          <Route element={<PulseDetailPage />} path={Routes.PulseDetail} />
          <Route
            element={<InsightDetailPage />}
            path={Routes.PulseInsightDetails}
          />
          <Route element={<PulseFeedPage />} path={Routes.PulseFeed} />
          <Route element={<PulseTaskPage />} path={Routes.PulseTasks} />
          <Route element={<TeamChatPage />} path={Routes.PulseTeamChat} />
          <Route element={<OrgChartPage />} path={Routes.OrgChart} />
          <Route element={<NotesPage />} path={Routes.PulseNotes} />
          <Route element={<CalendarPage />} path={Routes.PulseCalendar} />
        </Route>
        <Route
          element={<CompanionStatusPage />}
          path={Routes.CompanionStatus}
        />
      </Route>
      <Route element={<MainLayoutWithAuth />} path="manager">
        <Route
          element={<BillingAndPaymentPage />}
          path={Routes.BillingAndPayment}
        />
        <Route element={<BillingCancelPage />} path={Routes.BillingCancel} />
        <Route element={<BillingSuccessPage />} path={Routes.BillingSuccess} />

        <Route element={<DataSourceListPage />} path={Routes.DataSourceList} />
        <Route element={<DataSourceEditPage />} path={Routes.DataSourceEdit} />
        <Route element={<DataSourceShowPage />} path={Routes.DataSourceShow} />

        <Route element={<ThreadLayout />}>
          <Route element={<ThreadDetailPage />} path={Routes.ThreadDetail} />
          <Route element={<ThreadNewPage />} path={Routes.ThreadNew} />
        </Route>

        <Route element={<UserListPage />} path={Routes.UserList} />
        <Route element={<UserNewPage />} path={Routes.UserNew} />
        <Route element={<UserShowPage />} path={Routes.UserShow} />

        <Route element={<PulseLayout />}>
          <Route element={<PulseDetailPage />} path={Routes.PulseDetail} />
          <Route
            element={<InsightDetailPage />}
            path={Routes.PulseInsightDetails}
          />
          <Route element={<TeamChatPage />} path={Routes.PulseTeamChat} />
          <Route element={<PulseFeedPage />} path={Routes.PulseFeed} />
          <Route element={<PulseTaskPage />} path={Routes.PulseTasks} />
          <Route element={<OrgChartPage />} path={Routes.OrgChart} />
          <Route element={<NotesPage />} path={Routes.PulseNotes} />
          <Route element={<CalendarPage />} path={Routes.PulseCalendar} />
        </Route>
        {/* <Route element={<DirectMessagesPage />} path={Routes.DirectMessages} /> */}

        <Route
          element={<CompanionStatusPage />}
          path={Routes.CompanionStatus}
        />

        <Route element={<PulseNewPage />} path={Routes.PulseNew} />
        <Route
          element={<CreateCustomPulse />}
          path={Routes.PulseCreateCustom}
        />
        <Route
          element={<CreateOneOnOnePulse />}
          path={Routes.PulseCreateOneOnOne}
        />
      </Route>
      <Route element={<LandingPage />} path={Routes.Landing} />
      <Route
        element={<OnboardingCompletePage />}
        path={Routes.OnboardingComplete}
      />
      <Route
        element={<OnboardingDataSourcesPage />}
        path={Routes.OnboardingDataSources}
      />
      <Route element={<OnboardingSlackPage />} path={Routes.OnboardingSlack} />
      <Route
        element={<OnboardingSlackAuthCallbackPage />}
        path={Routes.OnboardingSlackAuthCallback}
      />
      <Route element={<MCPAuthCallbackPage />} path={Routes.MCPAuthCallback} />
      <Route element={<OnboardingTermsPage />} path={Routes.OnboardingTerms} />
      <Route element={<SettingsSlackPage />} path={Routes.SettingsSlack} />
      <Route
        element={<SettingsSlackAuthCallbackPage />}
        path={Routes.SettingsSlackAuthCallback}
      />
      <Route element={<VitalsRedirectPage />} path={Routes.RootVitals} />
      <Route element={<VitalsPage />} path={Routes.Vitals} />

      <Route element={<InsightLayout />}>
        <Route element={<InsightsPage />} path={Routes.Insights} />
        {/* <Route element={<InsightDetailPage />} path={Routes.InsightDetails} /> */}
        <Route
          element={<RecommendedInsightsPage />}
          path={Routes.RecommendedInsights}
        />
      </Route>

      <Route element={<NotFoundPage />} path={Routes.NotFoundPage} />
    </Route>,
  ),
)

function AppContent() {
  const customTheme = createAppTheme()
  const { user, isAuthenticated } = useAuth0()

  useEffect(() => {
    setEnvironmentFavicon()
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      Sentry.setUser({
        email: user.email,
        id: user.sub,
        username: user.name,
      })
    } else {
      Sentry.setUser(null)
    }
  }, [isAuthenticated, user])
  //throw new Error('Test Sentry user tagging')
  return (
    <Suspense>
      <AppBase customTheme={customTheme} router={router} />
      <Toaster />
    </Suspense>
  )
}

function App() {
  return (
    <AuthProviderWithAuth0Wrapper
      auth0Audience={import.meta.env.VITE_AUTH0_AUDIENCE}
      auth0ClientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      auth0Domain={import.meta.env.VITE_AUTH0_DOMAIN}
      coreGraphqlUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
    >
      <PusherProvider>
        <CookiesProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <SidebarProvider>
              <DataSourceProvider>
                <MeetingsProvider>
                  <DirectMessagesProvider>
                    <IntegrationProvider
                      coreGraphqlUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
                    >
                      <AgentProvider>
                        <VitalsProvider>
                          <JoyrideProvider>
                            <AppContent />
                          </JoyrideProvider>
                        </VitalsProvider>
                      </AgentProvider>
                    </IntegrationProvider>
                  </DirectMessagesProvider>
                </MeetingsProvider>
              </DataSourceProvider>
            </SidebarProvider>
          </LocalizationProvider>
        </CookiesProvider>
      </PusherProvider>
    </AuthProviderWithAuth0Wrapper>
  )
}

export default App
