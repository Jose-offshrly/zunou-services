import Search from '@mui/icons-material/Search'
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  OutlinedInputProps,
} from '@mui/material'
import { debounce } from 'lodash'
import type { ChangeEvent, Dispatch } from 'react'
import { useCallback, useEffect, useState } from 'react'

import { filterWidth } from '../../services/Theme'

interface Props {
  setQuery?: Dispatch<string | undefined>
}

export const SearchFilter = ({
  id = 'search-input',
  label = 'Search',
  setQuery,
  ...props
}: Props & OutlinedInputProps) => {
  const [searchTerm, setSearchTerm] = useState<string | undefined>()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChangeSearchTermDebounced = useCallback(
    debounce((term: string | undefined) => {
      if (setQuery) {
        setQuery(term || undefined)
      }
    }, 1000),
    [],
  )

  useEffect(() => {
    onChangeSearchTermDebounced(searchTerm)
  }, [onChangeSearchTermDebounced, searchTerm])

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value || undefined)
  }, [])

  return (
    <FormControl variant="outlined">
      <InputLabel htmlFor={id} size="small">
        {label}
      </InputLabel>
      <OutlinedInput
        defaultValue={searchTerm}
        endAdornment={
          <InputAdornment position="end">
            <IconButton edge="end">
              <Search />
            </IconButton>
          </InputAdornment>
        }
        label={label}
        onChange={onChange}
        size="small"
        sx={{ width: filterWidth }}
        {...props}
      />
    </FormControl>
  )
}
