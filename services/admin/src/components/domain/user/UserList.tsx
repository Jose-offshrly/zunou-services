import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableHead,
} from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'
import { SearchFilter } from '@zunou-react/components/form'
import {
  Filters,
  TableCell,
  TableContainer,
  TableRow,
} from '@zunou-react/components/layout'
import { Dispatch } from 'react'

interface Props {
  isLoading: boolean
  users: User[] | undefined
  setQuery: Dispatch<string | undefined>
}

export const UserList = ({ isLoading, users, setQuery }: Props) => {
  return (
    <Box>
      <Filters>
        <SearchFilter setQuery={setQuery} />
      </Filters>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
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

            {!isLoading && users?.length === 0 ? (
              <TableRow>
                <TableCell align="center" colSpan={6}>
                  No users were found
                </TableCell>
              </TableRow>
            ) : null}

            {isLoading || !users
              ? null
              : users.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                  >
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
