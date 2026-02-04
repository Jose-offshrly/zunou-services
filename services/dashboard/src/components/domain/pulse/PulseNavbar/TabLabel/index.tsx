import { Icon, Stack, SvgIconTypeMap, Typography } from '@mui/material'
import { OverridableComponent } from '@mui/material/OverridableComponent'

interface TabLabelProps {
  icon: OverridableComponent<SvgIconTypeMap<Record<string, unknown>>>
  label?: string
}

export const TabLabel = ({ icon, label }: TabLabelProps) => {
  return (
    <Stack direction="row" spacing={1}>
      <Icon component={icon} fontSize="small" />
      <Typography>{label}</Typography>
    </Stack>
  )
}
