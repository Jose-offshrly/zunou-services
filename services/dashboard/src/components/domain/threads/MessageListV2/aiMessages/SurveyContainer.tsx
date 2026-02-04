import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Question } from '../hooks/useContentParser'
import { SurveyMessage } from './SurveyMessage'

interface SurveyContainerProps {
  topic: string
  questions: Question[]
}

interface SurveyAnswers {
  [key: string]: string
}

export const SurveyContainer = ({ topic, questions }: SurveyContainerProps) => {
  const [currentQuestions, setCurrentQuestions] = useState<number[]>([1])
  const { setValue, getValues } = useForm<SurveyAnswers>()

  const handleAnswer = (questionNumber: number, answer: string) => {
    setValue(questionNumber.toString(), answer)

    if (questionNumber < questions.length) {
      setCurrentQuestions((prev) =>
        prev.includes(questionNumber + 1)
          ? prev
          : [...prev, questionNumber + 1],
      )
    } else {
      // Handle survey completion
      console.log('Survey completed!', getValues())
    }
  }

  return (
    <>
      {currentQuestions.map((questionNumber, index) => (
        <SurveyMessage
          key={questionNumber}
          onAnswer={(answer) => handleAnswer(questionNumber, answer)}
          questionNumber={questionNumber}
          questions={questions}
          showHeader={index === 0}
          topic={topic}
        />
      ))}
    </>
  )
}
