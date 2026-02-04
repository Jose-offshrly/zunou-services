import { Button, lighten, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useForm } from 'react-hook-form'

interface Question {
  item_number: number
  type: 'multiple_choice'
  question: string
  choices: string[]
}

interface SurveyMessageProps {
  topic: string
  questions: Question[]
  questionNumber?: number
  showHeader?: boolean
  onAnswer?: (answer: string) => void
}

interface SurveyForm {
  answer: string
}

const SurveyButton = ({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) => {
  const theme = useTheme()
  return (
    <Button
      onClick={onClick}
      sx={{
        '&:hover': {
          backgroundColor: lighten(theme.palette.primary.main, 0.9),
        },
        backgroundColor: selected
          ? lighten(theme.palette.primary.main, 0.6)
          : 'white',
        borderRadius: 1,
        color: theme.palette.primary.main,
        fontSize: '12px',
        fontWeight: '500',
        px: 3,
        py: 1,
      }}
      variant={selected ? 'contained' : 'outlined'}
    >
      {label}
    </Button>
  )
}

export const SurveyMessage = ({
  topic,
  questions,
  questionNumber = 1,
  showHeader = false,
  onAnswer,
}: SurveyMessageProps) => {
  const { handleSubmit, setValue, watch } = useForm<SurveyForm>()
  const currentAnswer = watch('answer')
  const currentQuestion = questions.find(
    (q) => q.item_number === questionNumber,
  )

  if (!currentQuestion) return null

  const onSubmit = (data: SurveyForm) => {
    onAnswer?.(data.answer)
  }

  return (
    <Stack spacing={1}>
      {showHeader && (
        <>
          <Typography color="text.primary" fontSize="14px" fontWeight="600">
            {topic} Survey
          </Typography>
          <Typography color="text.primary" fontSize="14px" fontWeight="400">
            Kindly select which best describes your answer.
          </Typography>
        </>
      )}

      <Stack py={1}>
        <Typography color="text.primary" fontSize="14px" fontWeight="400">
          {currentQuestion.item_number}. {currentQuestion.question}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {currentQuestion.choices.map((choice) => (
            <SurveyButton
              key={choice}
              label={choice}
              onClick={() => {
                setValue('answer', choice)
                handleSubmit(onSubmit)()
              }}
              selected={currentAnswer === choice}
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}
