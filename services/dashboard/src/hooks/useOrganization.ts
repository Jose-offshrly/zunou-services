import type { Organization } from '@zunou-graphql/core/graphql'
import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import { useParams } from 'react-router-dom'

interface OrganizationData {
  organizationId: string
  organization?: Organization
}

/**
 * We can only use this when we *know* that we are on a page
 * with an :organizationId param (which is almost every page
 * in the dashboard). It is used to simplify type a ssertions,
 * since useParams() returns 'string | undefined'.
 *
 * This hook now also fetches and caches the organization details
 * so they can be reused throughout the app.
 */
export const useOrganization = (): OrganizationData => {
  const { organizationId } = useParams() as unknown as {
    organizationId: string
  }

  const { data: organizationData } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })

  return {
    organization: organizationData?.organization,
    organizationId,
  }
}
