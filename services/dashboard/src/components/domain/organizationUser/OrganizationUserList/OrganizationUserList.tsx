import {
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableHead,
} from '@mui/material'
import {
  InviteUserInput,
  OrganizationUser,
  OrganizationUserStatus,
  User,
} from '@zunou-graphql/core/graphql'
import { useInviteUserMutation } from '@zunou-queries/core/hooks/useInviteUserMutation'
import { SearchFilter } from '@zunou-react/components/form'
import {
  Filters,
  TableCell,
  TableContainer,
  TableDateCell,
  TableMenuCell,
  TableRow,
} from '@zunou-react/components/layout'
import { Link } from '@zunou-react/components/navigation'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useSnackbarContext } from '@zunou-react/contexts/SnackbarContext'
import { dateToString } from '@zunou-react/services/Date'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { Dispatch, useCallback, useEffect } from 'react'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

interface Props {
  isLoading: boolean
  organizationUsers: OrganizationUser[] | undefined
  setQuery: Dispatch<string | undefined>
}

export const OrganizationUserList = ({
  isLoading,
  organizationUsers,
  setQuery,
}: Props) => {
  const { alertSuccess } = useSnackbarContext()
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const {
    data,
    error: inviteError,
    isPending: isPendingInvite,
    mutate: inviteUser,
  } = useInviteUserMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.UserShow}:inviteUser`, isPendingInvite)

  const onClickInvite = useCallback(
    ({ email, name }: User) => {
      const payload: InviteUserInput = {
        email,
        name,
        organizationId,
      }
      inviteUser([payload])
    },
    [inviteUser, organizationId],
  )

  useEffect(() => {
    if (!inviteError && data?.inviteUser) {
      data.inviteUser.map(({ email }) => {
        alertSuccess(`An invitation has been re-sent to ${email}`)
      })
    }
  }, [alertSuccess, data?.inviteUser, inviteError])

  return (
    <ErrorHandler error={inviteError}>
      <Box>
        <Filters>
          <SearchFilter setQuery={setQuery} />
        </Filters>

        <TableContainer
          sx={{
            border: 1,
            borderColor: theme.palette.grey['200'],
            boxShadow: 'none',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>&nbsp;</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell align="center" colSpan={6}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && organizationUsers?.length === 0 ? (
                <TableRow>
                  <TableCell align="center" colSpan={6}>
                    No users were found
                  </TableCell>
                </TableRow>
              ) : null}

              {isLoading || !organizationUsers
                ? null
                : organizationUsers.map((organizationUser) => (
                    <TableRow
                      key={organizationUser.id}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell>
                        <Link
                          href={pathFor({
                            pathname: Routes.UserShow,
                            query: {
                              organizationId: organizationUser.organizationId,
                              userId: organizationUser.user.id,
                            },
                          })}
                        >
                          {organizationUser.user.name}
                        </Link>
                      </TableCell>
                      <TableCell>{organizationUser.user.email}</TableCell>
                      <TableCell>{organizationUser.role}</TableCell>
                      <TableCell>
                        <Chip
                          color={
                            organizationUser.status ===
                            OrganizationUserStatus.Invited
                              ? 'warning'
                              : 'success'
                          }
                          label={organizationUser.status}
                          size="small"
                        />
                      </TableCell>
                      <TableDateCell>
                        {organizationUser.createdAt &&
                          dateToString(new Date(organizationUser.createdAt))}
                      </TableDateCell>
                      <TableMenuCell
                        actions={[
                          ...(organizationUser.status ===
                          OrganizationUserStatus.Invited
                            ? [
                                {
                                  label:
                                    'An invitation has been re-sent to {{email}}',
                                  onClick: () =>
                                    onClickInvite(organizationUser.user),
                                },
                              ]
                            : []),
                          {
                            label: 'Delete',
                            onClick: () => alert('TODO'),
                          },
                        ].filter((action) => !!action)}
                        id={`user-${organizationUser.id}`}
                      />
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </ErrorHandler>
  )
}
