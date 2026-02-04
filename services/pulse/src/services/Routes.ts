export enum Routes {
  Bootstrap = '/',
  Dashboard = '/organizations/:organizationId/home',
  OnboardingTerms = '/organizations/:organizationId/onboarding/terms',
  OrganizationBootstrap = '/organizations/:organizationId',
  RegisterSlackUser = '/organizations/:organizationId/slack/users/:slackId',
  SignIn = '/sign-in',
  ThreadDetail = '/organizations/:organizationId/threads/:threadId',
  ThreadNew = '/organizations/:organizationId/threads/new',
  UserAcceptInvite = '/organizations/:organizationId/invites/:inviteCode',
}
