import { withAuthenticationRequired } from '@auth0/auth0-react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import { Chip, Container, Table, TableBody } from '@mui/material'
import { DataSourceStatus } from '@zunou-graphql/core/graphql'
import { useDeleteDataSourceMutation } from '@zunou-queries/core/hooks/useDeleteDataSourceMutation'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import {
  Card,
  CardHeader,
  PageContent,
  PageHeading,
  TableCell,
  TableContainer,
  TableRow,
} from '@zunou-react/components/layout'
import { Link } from '@zunou-react/components/navigation'
import {
  Confirm,
  ErrorHandler,
  RelativeTime,
} from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback } from 'react'
import Markdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const DataSourceShowPage = () => {
  const { dataSourceId } = useParams()
  const { organizationId } = useOrganization()
  const navigate = useNavigate()
  const { useTrackQuery } = useLoadingContext()

  const {
    data,
    error: getError,
    isLoading,
  } = useGetDataSourceQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      dataSourceId,
      organizationId,
    },
  })
  useTrackQuery(`${Routes.DataSourceShow}:dataSource`, isLoading)

  const {
    error: deleteError,
    isPending: isPendingDelete,
    mutate: deleteDataSource,
  } = useDeleteDataSourceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery('${Routes.DataSourceList}:delete', isPendingDelete)

  const onConfirmDelete = useCallback(async () => {
    if (!dataSourceId) {
      return
    }

    await deleteDataSource({ id: dataSourceId, organizationId })

    navigate(
      pathFor({
        pathname: Routes.DataSourceList,
        query: { organizationId },
      }),
    )
  }, [dataSourceId, deleteDataSource, organizationId])

  const error = getError ?? deleteError

  return (
    <ErrorHandler error={error}>
      <Confirm
        action={onConfirmDelete}
        actionLabel="Delete"
        intent="danger"
        loading={isPendingDelete}
        message="Are you sure you want to delete this data source?"
      >
        {(doConfirm) => (
          <PageHeading
            actions={[
              {
                Icon: DownloadIcon,
                href: pathFor({
                  pathname: Routes.DataSourceDownload,
                  query: { dataSourceId, organizationId },
                }),
                label: 'Download',
                target: '_blank',
              },
              {
                Icon: DeleteOutlinedIcon,
                label: 'Delete',
                onClick: doConfirm,
              },
              {
                Icon: EditIcon,
                href: pathFor({
                  pathname: Routes.DataSourceEdit,
                  query: { dataSourceId, organizationId },
                }),
                label: 'Edit',
              },
            ]}
            breadcrumbs={[
              {
                href: pathFor({
                  pathname: Routes.DataSourceList,
                  query: { organizationId },
                }),
                label: 'Data Sources',
              },
              {
                href: pathFor({
                  pathname: Routes.DataSourceShow,
                  query: { dataSourceId, organizationId },
                }),
                label: data?.dataSource?.name || '',
              },
            ]}
          />
        )}
      </Confirm>

      <PageContent>
        <Container maxWidth="sm">
          <Card>
            <CardHeader title="Data Source Details" />

            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell variant="head">Name</TableCell>
                    <TableCell>{data?.dataSource?.name}</TableCell>
                  </TableRow>

                  {data?.dataSource?.description ? (
                    <TableRow>
                      <TableCell variant="head">Description</TableCell>
                      <TableCell>{data?.dataSource?.description}</TableCell>
                    </TableRow>
                  ) : null}

                  <TableRow>
                    <TableCell variant="head">Type</TableCell>
                    <TableCell>{data?.dataSource?.type}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell variant="head">Status</TableCell>
                    <TableCell>
                      <Chip
                        color={
                          data?.dataSource?.status === DataSourceStatus.Indexed
                            ? 'success'
                            : 'warning'
                        }
                        label={data?.dataSource?.status}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell variant="head">Created</TableCell>
                    <TableCell>
                      {data?.dataSource?.createdAt ? (
                        <RelativeTime
                          time={new Date(data.dataSource.createdAt)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell variant="head">Updated</TableCell>
                    <TableCell>
                      {data?.dataSource?.updatedAt ? (
                        <RelativeTime
                          time={new Date(data.dataSource.updatedAt)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>

                  {data?.dataSource?.summary ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <div>
                          <Markdown>{data?.dataSource?.summary}</Markdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  <TableRow>
                    <TableCell colSpan={2} sx={{ textAlign: 'center' }}>
                      <Link
                        href={pathFor({
                          pathname: Routes.DataSourceDownload,
                          query: { dataSourceId, organizationId },
                        })}
                        target="_blank"
                      >
                        Download
                      </Link>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Container>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(DataSourceShowPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
