import { withAuthenticationRequired } from '@auth0/auth0-react'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import { FileType, UpdateDataSourceInput } from '@zunou-graphql/core/graphql'
import { useGetDataSourceQuery } from '@zunou-queries/core/hooks/useGetDataSourceQuery'
import { useUpdateDataSourceMutation } from '@zunou-queries/core/hooks/useUpdateDataSourceMutation'
import {
  FileUploadField,
  Form,
  FormSection,
  LoadingButton,
  TextField,
} from '@zunou-react/components/form'
import {
  Card,
  CardActions,
  CardContent,
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

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const DataSourceEditPage = () => {
  const { control, handleSubmit, setValue } = useForm<UpdateDataSourceInput>()
  const { dataSourceId } = useParams()
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const [description, setDescription] = useState<string | undefined>()
  const [name, setName] = useState<string | undefined>()
  const { useTrackQuery } = useLoadingContext()

  const {
    data: getData,
    error: getError,
    isLoading,
  } = useGetDataSourceQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      dataSourceId,
      organizationId,
    },
  })
  useTrackQuery(`${Routes.DataSourceEdit}:dataSource`, isLoading)

  useEffect(() => {
    if (getError || isLoading) {
      return
    }

    if (getData?.dataSource?.name) {
      setName(getData.dataSource.name)
      setValue('name', getData.dataSource.name)
    }

    if (getData?.dataSource?.description) {
      setDescription(getData.dataSource.description)
      setValue('description', getData.dataSource.description)
    }
  }, [getData?.dataSource, isLoading])

  const {
    data: updateData,
    error: updateError,
    isPending: isPendingUpdate,
    mutateAsync: updateDataSource,
  } = useUpdateDataSourceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery('${Routes.DataSourceEdit}:update', isPendingUpdate)

  const onSubmit = useCallback(
    async (input: UpdateDataSourceInput) => {
      await updateDataSource({ ...input, id: dataSourceId!, organizationId })
    },
    [dataSourceId, organizationId, updateDataSource],
  )

  useEffect(() => {
    if (!updateError && updateData?.updateDataSource) {
      navigate(
        pathFor({
          pathname: Routes.DataSourceShow,
          query: { dataSourceId, organizationId },
        }),
      )
    }
  }, [
    dataSourceId,
    navigate,
    organizationId,
    updateData?.updateDataSource,
    updateError,
  ])

  const error = getError ?? updateError

  if (!getData?.dataSource || isLoading) {
    return null
  }

  const handleFileUploadChange = (value: string) => {
    setValue('fileKey', value)
  }

  return (
    <ErrorHandler error={error}>
      <PageHeading
        actions={[]}
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
            label: getData?.dataSource?.name ?? '...',
          },
          {
            href: pathFor({
              pathname: Routes.DataSourceEdit,
              query: { dataSourceId, organizationId },
            }),
            label: 'Edit',
          },
        ]}
      />

      <PageContent>
        <Form onSubmit={(input) => void handleSubmit(onSubmit)(input)}>
          <Card>
            <CardHeader title="Data Source Details" />
            <CardContent>
              <FormSection sx={{ marginTop: 1 }}>
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
                  label="Description"
                  multiline={true}
                  name="description"
                  onChange={setDescription}
                  onChangeFilter={(val: string | undefined) =>
                    val ? val : undefined
                  }
                  rows={4}
                  value={description}
                />

                <FileUploadField<UpdateDataSourceInput>
                  allowedFileTypes={[`.${FileType.Csv}`]}
                  companionUrl={import.meta.env.VITE_COMPANION_URL}
                  control={control}
                  coreGraphQLUrl={import.meta.env.VITE_CORE_GRAPHQL_URL}
                  error={error}
                  label="CSV File"
                  name="fileKey"
                  onChange={handleFileUploadChange}
                  organizationId={organizationId}
                />
              </FormSection>
            </CardContent>

            <CardActions sx={{ pt: 0 }}>
              <ButtonLink
                href={pathFor({
                  pathname: Routes.DataSourceShow,
                  query: { dataSourceId, organizationId },
                })}
              >
                Cancel
              </ButtonLink>

              <LoadingButton
                endIcon={<CheckOutlinedIcon />}
                loading={isPendingUpdate}
                type="submit"
                variant="contained"
              >
                Update Data Source
              </LoadingButton>
            </CardActions>
          </Card>
        </Form>
      </PageContent>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(DataSourceEditPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
