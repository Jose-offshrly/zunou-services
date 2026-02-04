import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddIcon from '@mui/icons-material/Add'
import { CardContent } from '@mui/material'
import { AgentName, CreateAgentInput } from '@zunou-graphql/core/graphql'
import { useCreateAgentMutation } from '@zunou-queries/core/hooks/useCreateAgentMutation'
import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import {
  Form,
  FormSection,
  LoadingButton,
  SelectField,
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
import { useNavigate, useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const OrganizationAgentNewPage = () => {
  const { control, handleSubmit } = useForm<CreateAgentInput>()
  const [name, setName] = useState<string | undefined>()
  const navigate = useNavigate()
  const { organizationId } = useParams() as { organizationId: string }
  const [prompt, setPrompt] = useState<string | undefined>()
  const { useTrackQuery } = useLoadingContext()

  const {
    data: organizationData,
    error: getError,
    isLoading: isPendingOrganisation,
  } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })
  useTrackQuery(
    `${Routes.OrganizationAgentList}:organization`,
    isPendingOrganisation,
  )

  const {
    data,
    error: createError,
    isPending: isPendingCreate,
    mutate,
  } = useCreateAgentMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.OrganizationAgentShow}:mutate`, isPendingCreate)

  const onSubmit = useCallback(
    (input: CreateAgentInput) => {
      mutate({ ...input, organizationId })
    },
    [mutate, organizationId],
  )

  useEffect(() => {
    if (!createError && data?.createAgent) {
      const { id: agentId } = data.createAgent
      navigate(
        pathFor({
          pathname: Routes.OrganizationAgentShow,
          query: { agentId, organizationId },
        }),
      )
    }
  }, [data?.createAgent, createError, navigate, organizationId])

  const options = Object.values(AgentName).map((label: AgentName) => ({
    label,
    value: label,
  }))

  const error = getError || createError
  const isPending = isPendingOrganisation || isPendingCreate

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[]}
        breadcrumbs={[
          {
            href: pathFor({
              pathname: Routes.OrganizationList,
            }),
            label: 'Organizations',
          },
          {
            href: pathFor({
              pathname: Routes.OrganizationShow,
              query: { organizationId },
            }),
            label: organizationData?.organization.name || '...',
          },
          {
            href: pathFor({
              pathname: Routes.OrganizationAgentList,
              query: { organizationId },
            }),
            label: 'Agents',
          },
          {
            href: pathFor({
              pathname: Routes.OrganizationAgentNew,
              query: { organizationId },
            }),
            label: 'Create an agent',
          },
        ]}
      />

      <PageContent>
        <Form onSubmit={(input) => void handleSubmit(onSubmit)(input)}>
          <Card>
            <CardHeader title="Agent Details" />
            <CardContent>
              <FormSection>
                <SelectField
                  control={control}
                  error={createError}
                  helperText="A unique name for the agent"
                  label="Name"
                  name="name"
                  onChange={setName}
                  options={options}
                  required={true}
                  value={name}
                />

                <TextField
                  control={control}
                  error={error}
                  helperText="The prompt"
                  label="Prompt"
                  multiline={true}
                  name="prompt"
                  onChange={setPrompt}
                  required={true}
                  rows={4}
                  value={prompt}
                />
              </FormSection>
            </CardContent>

            <CardActions sx={{ pt: 0 }}>
              <ButtonLink
                href={pathFor({
                  pathname: Routes.OrganizationAgentList,
                  query: { organizationId },
                })}
                variant="text"
              >
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

export default withAuthenticationRequired(OrganizationAgentNewPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
