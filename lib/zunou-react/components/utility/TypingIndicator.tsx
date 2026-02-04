import { keyframes, styled } from '@mui/material/styles'

const dotBounce = keyframes`
  0%, 80%, 100% { 
    transform: translateY(0);
  }
  40% { 
    transform: translateY(-4px);
  }
`

const LoadingContainer = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 8px;
`

const Dot = styled('span')`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${(props) => props.theme.palette.text.secondary};
  display: inline-block;
  animation: ${dotBounce} 1s infinite;
  animation-fill-mode: both;

  &:nth-of-type(2) {
    animation-delay: 0.2s;
  }

  &:nth-of-type(3) {
    animation-delay: 0.4s;
  }
`

export const TypingIndicator = () => (
  <LoadingContainer>
    <Dot />
    <Dot />
    <Dot />
  </LoadingContainer>
)
