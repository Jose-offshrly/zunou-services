import React from 'react'

import { MessageOptions, SummaryOption } from '../aiMessages/KeyPointsMessage'

interface UseSummaryOptionsProps {
  onSummaryOptionSelect?: (option: SummaryOption) => void
}

export const useSummaryOptions = ({
  onSummaryOptionSelect,
}: UseSummaryOptionsProps) => {
  const [summaryOptionsMap, setSummaryOptionsMap] = React.useState<
    Map<string, { message: string; options: MessageOptions }>
  >(new Map())

  const handleSummaryOptionSelect = (option: SummaryOption) => {
    if (option.prompt) {
      onSummaryOptionSelect?.(option)
    }
  }

  const updateSummaryOptions = (
    id: string,
    message: string,
    options: MessageOptions,
  ) => {
    setSummaryOptionsMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(id, { message, options })
      return newMap
    })
  }

  return {
    handleSummaryOptionSelect,
    summaryOptionsMap,
    updateSummaryOptions,
  }
}
