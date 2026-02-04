import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddIcon from '@mui/icons-material/Add'
import { CardContent, CircularProgress } from '@mui/material'
import { UpdateAgentInput } from '@zunou-graphql/core/graphql'
import { useGetAgentQuery } from '@zunou-queries/core/hooks/useGetAgentQuery'
import { useUpdateAgentMutation } from '@zunou-queries/core/hooks/useUpdateAgentMutation'
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
import { useNavigate, useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const OrganizationAgentNewPage = () => {
  const { control, handleSubmit, setValue } = useForm<UpdateAgentInput>()
  const navigate = useNavigate()
  const { agentId, organizationId } = useParams() as {
    agentId: string
    organizationId: string
  }
  const [prompt, setPrompt] = useState<string | undefined>()
  const { useTrackQuery } = useLoadingContext()

  const {
    data: agentData,
    error: getError,
    isLoading: isLoadingAgent,
  } = useGetAgentQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      agentId,
      organizationId,
    },
  })
  useTrackQuery(`${Routes.OrganizationAgentList}:agent`, isLoadingAgent)

  useEffect(() => {
    if (getError || isLoadingAgent) {
      return
    }

    if (agentData?.agent?.prompt) {
      setPrompt(agentData.agent.prompt)
      setValue('prompt', agentData.agent.prompt)
    }
  }, [agentData?.agent?.prompt, isLoadingAgent])

  const {
    data,
    error: updateError,
    isPending: isPendingCreate,
    mutate,
  } = useUpdateAgentMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.OrganizationAgentShow}:mutate`, isPendingCreate)

  const onSubmit = useCallback(
    (input: UpdateAgentInput) => {
      mutate({ ...input, id: agentId, organizationId })
    },
    [mutate, organizationId],
  )

  useEffect(() => {
    if (!updateError && data?.updateAgent) {
      navigate(
        pathFor({
          pathname: Routes.OrganizationAgentShow,
          query: { agentId, organizationId },
        }),
      )
    }
  }, [data?.updateAgent, updateError, navigate, organizationId])

  const error = getError || updateError
  const isPending = isLoadingAgent || isPendingCreate

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
            label: agentData?.agent.name || '...',
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
              pathname: Routes.OrganizationAgentEdit,
              query: { agentId, organizationId },
            }),
            label: 'Update agent',
          },
        ]}
      />

      <PageContent>
        {isLoadingAgent || !agentData ? (
          <CircularProgress />
        ) : (
          <Form onSubmit={(input) => void handleSubmit(onSubmit)(input)}>
            <Card>
              <CardHeader title="Agent Details" />
              <CardContent>
                <FormSection>
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
                    pathname: Routes.OrganizationAgentShow,
                    query: { agentId, organizationId },
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
                  Update
                </LoadingButton>
              </CardActions>
            </Card>
          </Form>
        )}
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OrganizationAgentNewPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
