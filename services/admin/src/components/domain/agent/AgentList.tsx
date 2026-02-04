import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableHead,
} from '@mui/material'
import { Agent } from '@zunou-graphql/core/graphql'
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
  agents: Agent[] | undefined
  setQuery: Dispatch<string | undefined>
}

export const AgentList = ({ isLoading, agents, setQuery }: Props) => {
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

            {!isLoading && agents?.length === 0 ? (
              <TableRow>
                <TableCell align="center" colSpan={6}>
                  No agents were found
                </TableCell>
              </TableRow>
            ) : null}

            {isLoading || !agents
              ? null
              : agents.map((agent) => (
                  <TableRow
                    key={`agent-${agent.id}`}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                  >
                    <TableCell>
                      <Link
                        href={pathFor({
                          pathname: Routes.OrganizationAgentShow,
                          query: {
                            agentId: agent.id,
                            organizationId: agent.organizationId,
                          },
                        })}
                      >
                        {agent.name}
                      </Link>
                    </TableCell>
                    <TableDateCell>
                      {dateToString(new Date(agent.createdAt))}
                    </TableDateCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
