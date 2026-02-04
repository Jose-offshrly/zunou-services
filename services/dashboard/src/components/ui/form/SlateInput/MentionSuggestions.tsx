import { alpha, Box } from '@mui/system'
import { theme } from '@zunou-react/services/Theme'

import { MentionType } from './custom-types'
import { Portal } from './Portal'

interface MentionSuggestionsProps {
  index: number
  mentions: MentionType[]
  onSelect: (mention: MentionType) => void
  refEl: React.RefObject<HTMLDivElement>
}

export const MentionSuggestions = ({
  index,
  onSelect,
  mentions,
  refEl,
}: MentionSuggestionsProps) => {
  const specialMentions = ['everyone', 'here', 'pulse', 'alert']

  return (
    <Portal>
      <Box
        bgcolor="white"
        borderRadius={1}
        boxShadow={2}
        left={0}
        maxHeight={240}
        overflow="auto"
        p={0.5}
        position="absolute"
        ref={refEl}
        sx={{
          transform: 'translateY(-100%)',
        }}
        top={0}
        zIndex={9999}
      >
        {mentions.map((mention, i) => {
          const isActive = index === i
          const activeBg = alpha(theme.palette.primary.main, 0.2)
          const hoverBg = alpha(theme.palette.primary.main, 0.05)

          return (
            <Box
              borderRadius={1}
              key={`${mention.name}-${i}`}
              onClick={() => onSelect(mention)}
              px={1}
              py={0.5}
              sx={{
                '&:hover': {
                  bgcolor: isActive ? activeBg : hoverBg,
                },
                bgcolor: isActive ? activeBg : 'transparent',
                color: specialMentions.includes(mention.name)
                  ? 'primary.main'
                  : '',
                cursor: 'pointer',
                // change font weight and font color for @everyone, @here, @pulse, and @alert
                fontWeight: specialMentions.includes(mention.name)
                  ? 'bold'
                  : 'normal',
              }}
            >
              {/* add @ for mention options */}
              {specialMentions.includes(mention.name)
                ? `@${mention.name}`
                : mention.name}
            </Box>
          )
        })}
      </Box>
    </Portal>
  )
}
