import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import { styled } from '@zunou-react/services/Theme'
import { Swiper, SwiperSlide } from 'swiper/react'

export const SliderPagination = styled('div')({
  alignItems: 'center',
  display: 'flex',
  gap: '0.313rem',
  justifyContent: 'center',
  marginTop: '1.313rem',
  width: '1.75rem !important',
  zIndex: 10,
})

export const SliderNavigation = styled('div')({
  display: 'flex',
  height: '3rem',
  justifyContent: 'space-between',
  margin: '0 auto',
  maxWidth: '14.375rem',
  width: '100%',
  zIndex: 15,
})

export const SwipperWrapper = styled('div')(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  justifyContent: 'center',
  padding: '2.25rem',
  zIndex: 10,
}))

export const SwiperStyled = styled(Swiper)({
  '--swiper-pagination-bullet-height': '0.313rem',
  '--swiper-pagination-bullet-horizontal-gap': 0,
  '--swiper-pagination-bullet-inactive-color': '#fff',
  '--swiper-pagination-bullet-inactive-opacity': 0.5,
  '--swiper-pagination-bullet-width': '0.313rem',
  '--swiper-pagination-color': '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  zIndex: 10,
})

export const SlideStyled = styled(SwiperSlide)({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'center',
  textAlign: 'center',
  width: '100%',
  zIndex: 10,
})

// export const SwiperContainer = styled('div')({
export const SwiperContainer = styled('div')(({ theme }) => ({
  '-moz-box-shadow':
    '10px 10px 0px 0px rgba(96,96,96,1), 20px 20px 0px 0px rgba(151,151,151,1)',
  '-webkit-box-shadow':
    '10px 10px 0px 0px rgba(96,96,96,1), 20px 20px 0px 0px rgba(151,151,151,1)',
  alignItems: 'center',
  backgroundColor: theme.palette.primary.main,
  borderRadius: '0.313rem',
  boxShadow:
    '10px 10px 0px 0px rgba(96,96,96,1), 20px 20px 0px 0px rgba(151,151,151,1)',
  display: 'flex',
  height: '18.75rem',
  justifyContent: 'center',
  padding: '2.875rem 3rem 3.313rem 2.313rem',
  position: 'relative',
  width: '18.75rem',
  zIndex: 10,
}))

export const SlideTitle = styled('h2')(({ theme }) => ({
  color: theme.palette.background.default,
  fontFamily: 'Inter',
  fontSize: '1.125rem',
  fontWeight: 700,
  lineHeight: 'normal',
  zIndex: 10,
}))

export const SlideMessage = styled('p')(({ theme }) => ({
  color: theme.palette.background.default,
  fontFamily: 'Inter',
  fontSize: '0.875rem',
  fontWeight: 400,
  lineHeight: 'normal',
  marginBlockEnd: '0.438rem',
  marginBlockStart: '0.438rem',
  zIndex: 10,
}))
