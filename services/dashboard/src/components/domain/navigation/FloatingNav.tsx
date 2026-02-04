import KeyboardDoubleArrowDownOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowDownOutlined'
import { Box, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { Button } from '@zunou-react/components/form'
import { Image } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useGetNotification } from '~/hooks/useGetNotification'

import SlidingOverlay from './SlidingOverlay'

interface FloatingNavProps {
  pathTo: string
  logoSrc: string
}

export const FloatingNav = ({ pathTo, logoSrc }: FloatingNavProps) => {
  const { requestPermission } = useGetNotification()
  const { userRole } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [isHovered, setIsHovered] = useState(false)
  const [arrowPosition, setArrowPosition] = useState('initial')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const secondaryOverlayRef = useRef<HTMLDivElement>(null)
  const navbarRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const clickStartTimeRef = useRef<number>(0)
  const initialPositionRef = useRef<{ left: number } | null>(null)

  const insightsPaths = ['/recommended-insights', '/insights']
  const isInsights = insightsPaths.some((path) =>
    location.pathname.includes(path),
  )

  const buttonText = isInsights ? 'Go to Pulse' : 'Go to Insights'
  const buttonColor = isInsights ? 'secondary' : 'primary'

  useEffect(() => {
    requestPermission()
  }, [])

  useEffect(() => {
    if (!initialPositionRef.current) {
      initialPositionRef.current = { left: window.innerWidth / 2 }
    }
  }, [])

  useEffect(() => {
    if (isHovered) {
      setArrowPosition('down')
    } else if (arrowPosition === 'down') {
      setArrowPosition('up')
    }
  }, [isHovered, arrowPosition])

  useEffect(() => {
    const handleResize = () => {
      const navbar = navbarRef.current
      if (navbar && initialPositionRef.current) {
        const viewportCenter = window.innerWidth / 2
        navbar.style.left =
          navbar.style.position === 'fixed' ? `${viewportCenter}px` : '50%'
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMouseDown, isAnimating])

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseDown || isAnimating) return

      const clickDuration = Date.now() - clickStartTimeRef.current
      const button = buttonRef.current
      const secondaryOverlay = secondaryOverlayRef.current
      const isOverButton = button && button.contains(e.target as Node)
      const isOverOverlay =
        secondaryOverlay && secondaryOverlay.contains(e.target as Node)

      setIsMouseDown(false)

      if (clickDuration < 200 || isOverButton || isOverOverlay) {
        completeAnimation()
      } else {
        resetPartialAnimation()
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [isMouseDown, isAnimating])

  const getArrowTransform = () => {
    switch (arrowPosition) {
      case 'down':
        return 'translateY(30px)'
      default:
        return 'translateY(-30px)'
    }
  }

  const handleClick = () => {
    if (isAnimating) return
    completeAnimation()
  }

  const resetPartialAnimation = () => {
    const navbar = navbarRef.current
    const secondaryOverlay = secondaryOverlayRef.current

    if (navbar && secondaryOverlay) {
      navbar.style.transform = 'translate(-50%, 0)'
      navbar.style.transition =
        'transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1.000)'
      secondaryOverlay.style.transform = 'translateY(-100%)'
      secondaryOverlay.style.transition =
        'transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1.000)'

      setTimeout(() => {
        navbar.style.position = 'absolute'
        navbar.style.left = '50%'
        secondaryOverlay.style.visibility = 'hidden'
      }, 300)
    }
  }

  const completeAnimation = () => {
    if (isAnimating) return
    setIsAnimating(true)

    const secondaryOverlay = secondaryOverlayRef.current
    const navbar = navbarRef.current

    if (secondaryOverlay && navbar) {
      if (navbar.style.position !== 'fixed') {
        const viewportCenter = window.innerWidth / 2
        if (!initialPositionRef.current) {
          initialPositionRef.current = { left: viewportCenter }
        }
        navbar.style.position = 'fixed'
        navbar.style.left = `${viewportCenter}px`
      }

      navbar.style.transform = 'translate(-50%, 100vh)'
      navbar.style.transition =
        'transform 0.4s cubic-bezier(0.645, 0.045, 0.355, 1.000)'
      secondaryOverlay.style.visibility = 'visible'
      secondaryOverlay.style.transform = 'translateY(0)'
      secondaryOverlay.style.transition =
        'transform 0.4s cubic-bezier(0.645, 0.045, 0.355, 1.000)'

      setTimeout(() => {
        navigate(pathTo)
        setTimeout(() => {
          secondaryOverlay.style.transform = 'translateY(-100%)'
          setTimeout(() => {
            setIsAnimating(false)
            secondaryOverlay.style.visibility = 'hidden'
            navbar.style.position = 'absolute'
            navbar.style.left = '50%'
            navbar.style.transform = 'translate(-50%, 0)'
          }, 400)
        }, 800)
      }, 600)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return
    e.preventDefault()
    e.stopPropagation()
    setIsMouseDown(true)
    clickStartTimeRef.current = Date.now()

    const navbar = navbarRef.current
    const secondaryOverlay = secondaryOverlayRef.current

    if (navbar && secondaryOverlay) {
      const viewportCenter = window.innerWidth / 2
      if (!initialPositionRef.current) {
        initialPositionRef.current = { left: viewportCenter }
      }

      navbar.style.position = 'fixed'
      navbar.style.left = `${viewportCenter}px`
      navbar.style.transform = 'translate(-50%, 5vh)'
      navbar.style.transition =
        'transform 0.2s cubic-bezier(0.645, 0.045, 0.355, 1.000)'
      secondaryOverlay.style.visibility = 'visible'
      secondaryOverlay.style.transform = 'translateY(-95%)'
      secondaryOverlay.style.transition =
        'transform 0.2s cubic-bezier(0.645, 0.045, 0.355, 1.000)'
    }
  }

  if (!userRole || userRole === UserRoleEnum.GUEST) return null

  return (
    <>
      <SlidingOverlay
        backgroundColor={`${buttonColor}.main`}
        ref={secondaryOverlayRef}
      />
      <Stack
        alignItems="center"
        justifyContent="center"
        ref={navbarRef}
        sx={{
          left: '50%',
          margin: 0,
          padding: 0,
          position: 'absolute',
          top: '0',
          transform: 'translateX(-50%)',
          transition: 'transform 0.4s cubic-bezier(0.645, 0.045, 0.355, 1.000)',
          zIndex: 9998,
        }}
      >
        <Box
          ref={buttonRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            margin: 0,
            padding: 0,
          }}
        >
          <Button
            color={buttonColor}
            disableFocusRipple={true}
            disableRipple={true}
            disableTouchRipple={true}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              '& .MuiTouchRipple-root': { display: 'none' },
              '&.Mui-focusVisible': { bgcolor: `${buttonColor}.main` },
              '&:active': { bgcolor: `${buttonColor}.main` },
              '&:hover': { bgcolor: `${buttonColor}.main` },
              bgcolor: `${buttonColor}.main`,
              borderRadius: '0 0 10px 10px',
              height: 20,
              margin: 0,
              marginTop: 0,
              minWidth: 160,
              overflow: 'hidden',
              padding: 0,
              position: 'relative',
            }}
            variant="contained"
          >
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                height: '100%',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  position: 'absolute',
                  transform: isHovered ? 'translateX(-60px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease-in-out',
                }}
              >
                <Image
                  alt="Logo"
                  height={20}
                  src={logoSrc}
                  style={{ display: 'block' }}
                />
              </Box>

              <Typography
                sx={{
                  color: 'white',
                  fontSize: 'x-small',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  whiteSpace: 'nowrap',
                }}
                variant="caption"
              >
                {buttonText}
              </Typography>

              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  height: '100%',
                  justifyContent: 'center',
                  left: 16,
                  overflow: 'hidden',
                  position: 'absolute',
                }}
              >
                <KeyboardDoubleArrowDownOutlinedIcon
                  sx={{
                    color: 'white',
                    fontSize: 16,
                    opacity: arrowPosition === 'initial' ? 0 : 1,
                    transform: getArrowTransform(),
                    transition:
                      'transform 0.6s ease-in-out, opacity 0.3s ease-in-out',
                  }}
                />
              </Box>
            </Box>
          </Button>
        </Box>
      </Stack>
    </>
  )
}
