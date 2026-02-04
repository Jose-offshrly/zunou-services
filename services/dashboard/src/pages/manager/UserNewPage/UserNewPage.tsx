import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddIcon from '@mui/icons-material/Add'
import { CardContent } from '@mui/material'
import {
  InviteUserInput,
  OrganizationUserRole,
} from '@zunou-graphql/core/graphql'
import { useInviteUserMutation } from '@zunou-queries/core/hooks/useInviteUserMutation'
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
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const roleOptions = Object.values(OrganizationUserRole).map(
  (label: OrganizationUserRole) => ({
    label,
    value: label,
  }),
)

const UserNewPage = () => {
  const { control, handleSubmit } = useForm<InviteUserInput>()
  const [email, setEmail] = useState<string | undefined>()
  const [name, setName] = useState<string | undefined>()
  const [role, setRole] = useState<string | undefined>()
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const {
    data,
    error: createError,
    isPending: isPendingCreate,
    mutateAsync: inviteUser,
  } = useInviteUserMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.UserShow}:inviteUser`, isPendingCreate)

  const onSubmit = useCallback(
    (input: InviteUserInput) => {
      inviteUser([{ ...input, organizationId }])
    },
    [inviteUser, organizationId],
  )

  useEffect(() => {
    if (!createError && data?.inviteUser) {
      const { id: userId } = data.inviteUser[0]

      navigate(
        pathFor({
          pathname: Routes.UserShow,
          query: { organizationId, userId },
        }),
      )
    }
  }, [data?.inviteUser, createError, navigate, organizationId])

  const error = createError
  const isPending = isPendingCreate

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[]}
        breadcrumbs={[
          {
            href: pathFor({
              pathname: Routes.UserList,
              query: { organizationId },
            }),
            label: 'Users',
          },
          {
            href: pathFor({
              pathname: Routes.UserNew,
              query: { organizationId },
            }),
            label: 'Create a User',
          },
        ]}
      />

      <PageContent>
        <Form onSubmit={(input) => void handleSubmit(onSubmit)(input)}>
          <Card>
            <CardHeader title="User Details" />
            <CardContent>
              <FormSection>
                <TextField
                  control={control}
                  error={error}
                  label="Name"
                  name="name"
                  onChange={setName}
                  required={true}
                  value={name}
                />

                <TextField
                  control={control}
                  error={error}
                  label="Email"
                  name="email"
                  onChange={setEmail}
                  required={true}
                  value={email}
                />

                <SelectField
                  control={control}
                  error={createError}
                  helperText="The user's role in the organization"
                  label="Role"
                  name="role"
                  onChange={setRole}
                  options={roleOptions}
                  required={true}
                  value={role}
                />
              </FormSection>
            </CardContent>

            <CardActions sx={{ pt: 0 }}>
              <ButtonLink
                href={pathFor({
                  pathname: Routes.UserList,
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
                Create User
              </LoadingButton>
            </CardActions>
          </Card>
        </Form>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(UserNewPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
