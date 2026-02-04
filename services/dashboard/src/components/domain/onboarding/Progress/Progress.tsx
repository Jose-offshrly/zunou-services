import { Pagination, PaginationItem, Stack } from '@mui/material'

export const Progress = () => {
  const texts = ['Account setup', 'Add data', 'Slack Assistant']

  return (
    <Stack spacing={2} sx={{ ml: '8px', mr: '8px', mt: '2rem' }}>
      <Pagination
        count={3}
        hideNextButton={true}
        hidePrevButton={true}
        renderItem={(item) => {
          if (item.type === 'page') {
            return (
              <Stack alignItems="center">
                <PaginationItem
                  {...item}
                  disabled={true}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: '#4A00E0 !important',
                    },
                    '&:hover': {
                      backgroundColor: '#9E77ED',
                    },
                    backgroundColor: '#9E77ED !important',
                    borderRadius: '3px',
                    color: 'transparent !important',
                    height: '6px',
                    width: '100%',
                  }}
                />
                <div
                  style={{
                    color: '#4A00E0',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    marginTop: 10,
                  }}
                >
                  {item.page ? texts[item.page - 1] : ''}
                </div>
              </Stack>
            )
          }

          return undefined
        }}
        sx={{
          '> ul': {
            '&:after': {
              backgroundColor: '#4A00E0',
              borderRadius: '99px',
              content: '""',
              height: '22px',
              left: '-8px',
              position: 'absolute',
              top: '-8px',
              width: 'calc(100% + 16px)',
              zIndex: -1,
            },
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
            position: 'relative',
          },
          li: {
            flex: '1',
          },
        }}
      />
    </Stack>
  )
}
