import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditIcon from '@mui/icons-material/Edit'
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableHead,
} from '@mui/material'
import { DataSource, DataSourceStatus } from '@zunou-graphql/core/graphql'
import { useDeleteDataSourceMutation } from '@zunou-queries/core/hooks/useDeleteDataSourceMutation'
import { Chip, IconButton, SearchFilter } from '@zunou-react/components/form'
import {
  Filters,
  TableActionCell,
  TableCell,
  TableContainer,
  TableDateCell,
  TableRow,
} from '@zunou-react/components/layout'
import { IconLink, Link } from '@zunou-react/components/navigation'
import { Confirm, ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { dateToString } from '@zunou-react/services/Date'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { Dispatch, useCallback } from 'react'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

interface Props {
  disableLinks?: boolean
  isLoading: boolean
  dataSources: DataSource[] | undefined
  setQuery?: Dispatch<string | undefined>
}

export const DataSourceList = ({
  dataSources,
  disableLinks,
  isLoading,
  setQuery,
}: Props) => {
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const {
    error: deleteError,
    isPending: isPendingDelete,
    mutateAsync: deleteDataSource,
  } = useDeleteDataSourceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery('${Routes.DataSourceList}:delete', isPendingDelete)

  const onConfirmDelete = useCallback(
    async (id: string) => {
      await deleteDataSource({ id, organizationId })
    },
    [deleteDataSource, organizationId],
  )

  return (
    <ErrorHandler error={deleteError}>
      <Box display="flex" flexDirection="row">
        <Box display="flex" flex={1} flexDirection="column">
          {setQuery ? (
            <Filters>
              <SearchFilter setQuery={setQuery} />
            </Filters>
          ) : null}

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
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>&nbsp;</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>File Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date Uploaded</TableCell>
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

                {!isLoading && dataSources?.length === 0 ? (
                  <TableRow>
                    <TableCell align="center" colSpan={7}>
                      No data sources were found
                    </TableCell>
                  </TableRow>
                ) : null}

                {isLoading || !dataSources
                  ? null
                  : dataSources.map((dataSource) => (
                      <TableRow
                        key={`data-source-${dataSource.id}`}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableActionCell align="center">
                          <Confirm
                            action={() => onConfirmDelete(dataSource.id)}
                            actionLabel="Delete"
                            intent="danger"
                            loading={isPendingDelete}
                            message="Are you sure you want to delete this data source?"
                          >
                            {(doConfirm) => (
                              <IconButton onClick={doConfirm} size="small">
                                <DeleteOutlinedIcon fontSize="inherit" />
                              </IconButton>
                            )}
                          </Confirm>
                        </TableActionCell>
                        <TableActionCell align="center">
                          <IconLink
                            href={pathFor({
                              pathname: Routes.DataSourceEdit,
                              query: {
                                dataSourceId: dataSource.id,
                                organizationId: dataSource.organizationId,
                              },
                            })}
                            size="small"
                          >
                            <EditIcon fontSize="inherit" />
                          </IconLink>
                        </TableActionCell>
                        <TableCell>
                          {disableLinks ? (
                            dataSource.name
                          ) : (
                            <Link
                              href={pathFor({
                                pathname: Routes.DataSourceShow,
                                query: {
                                  dataSourceId: dataSource.id,
                                  organizationId: dataSource.organizationId,
                                },
                              })}
                            >
                              {dataSource.name}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>{dataSource.type}</TableCell>
                        <TableCell>
                          <Chip
                            color={
                              dataSource.status === DataSourceStatus.Indexed
                                ? 'success'
                                : 'warning'
                            }
                            label={dataSource.status}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableDateCell>
                          {dateToString(new Date(dataSource.createdAt))}
                        </TableDateCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </ErrorHandler>
  )
}
