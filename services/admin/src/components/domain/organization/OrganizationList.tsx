import {
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableHead,
} from '@mui/material'
import { Organization, OrganizationStatus } from '@zunou-graphql/core/graphql'
import { SearchFilter } from '@zunou-react/components/form'
import {
  Filters,
  TableCell,
  TableContainer,
  TableDateCell,
  TableRow,
} from '@zunou-react/components/layout'
import { Link } from '@zunou-react/components/navigation'
import { dateToString } from '@zunou-react/services/Date'
import { pathFor } from '@zunou-react/services/Routes'
import { Dispatch } from 'react'

import { Routes } from '~/services/Routes'

interface Props {
  isLoading: boolean
  organizations: Organization[] | undefined
  setQuery: Dispatch<string | undefined>
}

export const OrganizationList = ({
  isLoading,
  organizations,
  setQuery,
}: Props) => {
  return (
    <Box>
      <Filters>
        <SearchFilter setQuery={setQuery} />
      </Filters>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
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

            {!isLoading && organizations?.length === 0 ? (
              <TableRow>
                <TableCell align="center" colSpan={6}>
                  No organizations were found
                </TableCell>
              </TableRow>
            ) : null}

            {isLoading || !organizations
              ? null
              : organizations.map((organization) => (
                  <TableRow
                    key={`organization-${organization.id}`}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                  >
                    <TableCell>
                      <Link
                        href={pathFor({
                          pathname: Routes.OrganizationShow,
                          query: {
                            organizationId: organization.id,
                          },
                        })}
                      >
                        {organization.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          organization.status === OrganizationStatus.Active
                            ? 'success'
                            : 'warning'
                        }
                        label={organization.status.replace('_', ' ')}
                        size="small"
                      />
                    </TableCell>
                    <TableDateCell>
                      {dateToString(new Date(organization.createdAt))}
                    </TableDateCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
