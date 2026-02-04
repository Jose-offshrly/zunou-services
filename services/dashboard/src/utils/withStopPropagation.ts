import React from 'react'

export const withStopPropagation = <T extends React.SyntheticEvent>(
  handler: (event: T) => void,
) => {
  return (event: T) => {
    event.stopPropagation()
    handler(event)
  }
}
