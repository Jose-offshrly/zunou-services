import { SvgIcon, SvgIconProps } from '@mui/material'

export const HeartbeatIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} inheritViewBox={true}>
      <path
        d="M3 9.9987H6.5L7.66667 5.33203L10.7778 14.6654L12.3333 7.66536L13.5 9.9987H17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </SvgIcon>
  )
}
