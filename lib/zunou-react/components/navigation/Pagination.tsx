import { Pagination as BasePagination, Stack } from '@mui/material'
import { PaginatorInfo } from '@zunou-graphql/core/graphql'
import { ChangeEvent, Dispatch } from 'react'

interface Props {
  page: number
  paginatorInfo: PaginatorInfo | undefined
  setPage: Dispatch<number>
}

export const Pagination = ({ page, paginatorInfo, setPage }: Props) => {
  const handlePageChange = (_event: ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage)
  }

  if (!paginatorInfo || paginatorInfo?.lastPage === 1) {
    return null
  }

  return (
    <Stack alignItems="center" mt={2}>
      <BasePagination
        color="primary"
        count={paginatorInfo?.lastPage}
        onChange={handlePageChange}
        page={page}
      />
    </Stack>
  )
}
