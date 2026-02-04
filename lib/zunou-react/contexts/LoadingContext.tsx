import isEqual from 'lodash/isEqual'
import uniq from 'lodash/uniq'
import { createContext, useContext, useEffect, useState } from 'react'

interface LoadingProps {
  loading: boolean
  setSubmitting: (loading: boolean) => void
  submitting: boolean
  useTrackQuery: (name: string, loading: boolean) => void
}

const Context = createContext<LoadingProps>({
  loading: false,
  setSubmitting: () => undefined,
  submitting: false,
  useTrackQuery: (__name: string, __loading: boolean) => undefined,
})

export const useLoadingContext = (): LoadingProps => useContext(Context)

export const LoadingContext = ({
  children,
}: React.PropsWithChildren<Record<string, unknown>>): React.ReactElement => {
  const [queries, setQueries] = useState<{ [key: string]: boolean }>({})
  const [submitting, setSubmitting] = useState(false)

  const useTrackQuery = (name: string, isLoading: boolean) => {
    useEffect(() => {
      if (queries[name] === isLoading) {
        return
      }

      setQueries({ ...queries, [name]: isLoading })
    }, [isLoading, name])
  }

  const values = uniq(Object.values(queries))
  const loading = !(isEqual(values, [false]) || values.length === 0)

  const value = {
    loading,
    setSubmitting,
    submitting,
    useTrackQuery,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
