import { Stack } from '@mui/material'

import MessageTextRenderer from '../components/MessageTextRenderer'

interface MainUiMessageProps {
  showBorderBottom?: boolean
  text: string
}

const MainUiMessage = ({
  showBorderBottom = true,
  text,
}: MainUiMessageProps) => {
  return (
    <Stack
      borderBottom={showBorderBottom ? 1 : 0}
      borderColor="primary.main"
      sx={{
        '& p': {
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        },
        '& p:first-of-type': {
          my: 0,
        },
        borderBottomStyle: 'dashed',
        pb: 2,
      }}
    >
      <MessageTextRenderer text={text} />
    </Stack>
  )
}

export default MainUiMessage
