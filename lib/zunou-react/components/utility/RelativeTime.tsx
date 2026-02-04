import { Box } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'

import { datetimeToString, timeSinceLong } from '../../services/Date'
import { Paragraph } from '../typography/Paragraph'

interface Props {
  time: Date
}

export const RelativeTime = ({ time }: Props) => {
  return (
    <Tooltip arrow={true} title={datetimeToString(time)}>
      <Box sx={{ display: 'inline-block' }}>
        <Paragraph variant="body2">{timeSinceLong(time)}</Paragraph>
      </Box>
    </Tooltip>
  )
}
