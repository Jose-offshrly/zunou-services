import { ChipButton } from '~/components/ui/button/ChipButton'

interface PersonalTasksFilterProps {
  onClick: () => void
  isActive?: boolean
}

export const PersonalTasksFilter = ({
  isActive,
  onClick,
}: PersonalTasksFilterProps) => {
  return (
    <ChipButton
      isActive={isActive}
      label="Personal Tasks"
      onClick={onClick}
      onDelete={isActive ? onClick : undefined}
    />
  )
}
