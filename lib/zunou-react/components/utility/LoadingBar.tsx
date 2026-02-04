import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import { useState } from 'react'

import { useLoadingContext } from '../../contexts/LoadingContext'

interface Props {
  color: string
}

const animate = keyframes`
  0% {
    left:  0;
    right: unset;
    width: 0;
  }
  25% {
    width: 100%;
  }
  50% {
    width: 100%;
  }
  75% {
    left:  unset;
    right: 0;
    width: 0%;
  }
  100% {
    width: 0%;
  }
`

const Animation = styled.div<Props>`
  animation-direction: normal;
  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-name: ${animate};
  animation-timing-function: linear;
  background-color: ${(props) => props.color};
  height: 3px;
  left: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 5;
`

export const LoadingBar = ({ color }: Props): React.ReactElement => {
  const { loading } = useLoadingContext()
  const [show, setShow] = useState(false)
  const display = loading || show ? 'block' : 'none'

  if (loading || show) {
    // This is used to show the bar for at least half a second, to
    // prevent flashing of the bar for very quick requests.
    if (!show) {
      setShow(true)
      setTimeout(() => setShow(false), 500)
    }
  }

  return <Animation color={color} style={{ display }} />
}
