import { useParams } from 'react-router-dom'

interface OrganizationData {
  organizationId: string
}

/**
 * We can only use this when we *know* that we are on a page
 * with an :organizationId param (which is almost every page
 * in the dashboard). It is used to simplify type assertions,
 * since useParams() returns 'string | undefined'.
 */
export const useOrganization = (): OrganizationData => {
  const { organizationId } = useParams() as unknown as OrganizationData

  return { organizationId }
}
