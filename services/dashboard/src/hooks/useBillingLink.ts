import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect, useState } from 'react'

import { Routes } from '../services/Routes'

const STRIPE_BILLING_URL =
  'https://billing.stripe.com/p/login/4gwdSi23RaeIc7ebII'

export const useBillingLink = (organizationId: string) => {
  const [billingLink, setBillingLink] = useState<string>('')

  const { data, isLoading, error } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  useEffect(() => {
    if (data?.organization) {
      setBillingLink(
        data.organization.subscriptionStatus
          ? STRIPE_BILLING_URL
          : pathFor({
              pathname: Routes.BillingAndPayment,
              query: { organizationId },
            }),
      )
    }
  }, [data, organizationId])

  return { billingLink, error, isLoading }
}
