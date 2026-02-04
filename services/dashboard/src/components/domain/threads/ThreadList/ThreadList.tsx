import { List, ListSubheader, Typography } from '@mui/material'
import { Thread } from '@zunou-graphql/core/graphql'

import { ThreadItem } from '~/components/domain/threads/ThreadItem/ThreadItem'
import { categorizeThreads } from '~/utils/categorizeThreads'

interface Props {
  openEditThreadModal: (id?: string | null) => void
  openDeleteThreadConfirmationModal: (id?: string | null) => void
  threads?: Thread[]
}

export const ThreadList = ({
  threads,
  openEditThreadModal,
  openDeleteThreadConfirmationModal,
}: Props) => {
  const categorizedThreads = categorizeThreads(threads)

  return (
    <List
      subheader={<li />}
      sx={{
        '& ul': { paddingX: 0 },
        position: 'relative',
        width: '100%',
      }}
    >
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          listStyleType: 'none',
        }}
      >
        {Object.entries(categorizedThreads)
          .sort(([a], [b]) => {
            const order: { [key: string]: number } = {
              'Previous 7 days': 3,
              Today: 1,
              Yesterday: 2,
            }

            return order[a] - order[b]
          })
          .map(([category, threads]) => (
            <li key={category}>
              <ul>
                <ListSubheader sx={{ paddingX: 0 }}>
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                    sx={{
                      alignItems: 'center',
                      color: 'black',
                      display: 'flex',
                      height: 40,
                      mb: 0.5,
                      textIndent: 8,
                    }}
                  >
                    {category}
                  </Typography>
                </ListSubheader>
                {threads.map(({ id, name }) => (
                  <ThreadItem
                    id={id}
                    key={id}
                    name={name}
                    openDeleteThreadConfirmationModal={
                      openDeleteThreadConfirmationModal
                    }
                    openEditThreadModal={openEditThreadModal}
                  />
                ))}
              </ul>
            </li>
          ))}
      </ul>
    </List>
  )
}
