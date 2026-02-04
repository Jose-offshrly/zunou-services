import { Box } from '@mui/system'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

export const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...rest } = props

  return (
    <Box
      hidden={value !== index}
      id={`tabpanel-${index}`}
      role="tabpanel"
      {...rest}
    >
      {value === index && <Box>{children}</Box>}
    </Box>
  )
}
