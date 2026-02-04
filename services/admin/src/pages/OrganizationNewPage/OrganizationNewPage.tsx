import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddIcon from '@mui/icons-material/Add'
import { CardContent } from '@mui/material'
import { CreateOrganizationInput } from '@zunou-graphql/core/graphql'
import { useCreateOrganizationMutation } from '@zunou-queries/core/hooks/useCreateOrganizationMutation'
import {
  Form,
  FormSection,
  LoadingButton,
  TextField,
} from '@zunou-react/components/form'
import {
  Card,
  CardActions,
  CardHeader,
  PageContent,
  PageHeading,
} from '@zunou-react/components/layout'
import { ButtonLink } from '@zunou-react/components/navigation'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const OrganizationNewPage = () => {
  const { control, handleSubmit } = useForm<CreateOrganizationInput>()
  const [name, setName] = useState<string | undefined>()
  const navigate = useNavigate()
  const [ownerEmail, setOwnerEmail] = useState<string | undefined>()
  const [ownerName, setOwnerName] = useState<string | undefined>()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isPending, mutate } = useCreateOrganizationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.OrganizationShow}:mutate`, isPending)

  const onSubmit = useCallback(
    (input: CreateOrganizationInput) => {
      mutate(input)
    },
    [mutate],
  )

  useEffect(() => {
    if (!error && data?.createOrganization) {
      const { id: organizationId } = data.createOrganization
      navigate(
        pathFor({
          pathname: Routes.OrganizationShow,
          query: { organizationId },
        }),
      )
    }
  }, [data?.createOrganization, error, navigate])

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[]}
        breadcrumbs={[
          { href: Routes.OrganizationNew, label: 'Create an Organization' },
        ]}
      />

      <PageContent>
        <Form onSubmit={(input) => void handleSubmit(onSubmit)(input)}>
          <Card>
            <CardHeader title="Organization Details" />
            <CardContent>
              <FormSection>
                <TextField
                  control={control}
                  error={error}
                  helperText="A unique name for the organization"
                  label="Name"
                  name="name"
                  onChange={setName}
                  required={true}
                  value={name}
                />

                <TextField
                  control={control}
                  error={error}
                  helperText="The email address of the organization's owner"
                  label="Owner Email"
                  name="ownerEmail"
                  onChange={setOwnerEmail}
                  required={true}
                  value={ownerEmail}
                />

                <TextField
                  control={control}
                  error={error}
                  helperText="The name of the organization's owner"
                  label="Owner Name"
                  name="ownerName"
                  onChange={setOwnerName}
                  required={true}
                  value={ownerName}
                />
              </FormSection>
            </CardContent>

            <CardActions sx={{ pt: 0 }}>
              <ButtonLink href={Routes.OrganizationList} variant="text">
                Cancel
              </ButtonLink>

              <LoadingButton
                endIcon={<AddIcon />}
                loading={isPending}
                type="submit"
                variant="contained"
              >
                Create
              </LoadingButton>
            </CardActions>
          </Card>
        </Form>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OrganizationNewPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
