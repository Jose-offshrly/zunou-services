import { ChipButton } from '~/components/ui/button/ChipButton'

interface MyTasksFilterProps {
  onClick: () => void
  isActive?: boolean
}

export const MyTasksFilter = ({ isActive, onClick }: MyTasksFilterProps) => {
  return (
    <ChipButton
      isActive={isActive}
      label="My Tasks"
      onClick={onClick}
      onDelete={isActive ? onClick : undefined}
    />
  )
}
