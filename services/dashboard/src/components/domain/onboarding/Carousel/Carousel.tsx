import { useState } from 'react'
import { type Swiper as SwiperInstance } from 'swiper'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { SwiperSlide } from 'swiper/react'

import * as S from './Carousel.styles'

export function Carousel() {
  const [_swiper, setSwiper] = useState<SwiperInstance>()

  return (
    <S.SwiperContainer>
      <S.SwiperStyled
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        grabCursor={true}
        modules={[Autoplay, Navigation, Pagination]}
        onSwiper={setSwiper}
        pagination={{ clickable: true, el: "[data-swiper-pagination='true']" }}
        slidesPerView={1}
        spaceBetween={0}
        wrapperClass={`${S.SwipperWrapper}`}
      >
        <div className="swiper-wrapper">
          <SwiperSlide key="1">
            <div>
              <S.SlideTitle>
                The knowledge of your organization one Slack message away.
              </S.SlideTitle>
              <S.SlideMessage>
                Zunou transforms your sea of data into knowledge, allowing your
                organization to consult through natural language any data
                sources accessible to Zunou.
              </S.SlideMessage>
            </div>
          </SwiperSlide>
          <SwiperSlide key="2">
            <S.SlideTitle>A powerful ally.</S.SlideTitle>
            <S.SlideMessage>
              Zunou can support entire organizations to execute tasks and make
              their operational lives easier. Allowing companies to do more,
              with the talent they already have.
            </S.SlideMessage>
          </SwiperSlide>
          <SwiperSlide key="3">
            <S.SlideTitle>Ethical and secure.</S.SlideTitle>
            <S.SlideMessage>
              Built to respect privacy and bust biases, Zunou is a safe choice
              for teams. What happens inside your organization stays inside of
              your organization.
            </S.SlideMessage>
          </SwiperSlide>
        </div>

        <S.SliderPagination data-swiper-pagination="true" />
      </S.SwiperStyled>
    </S.SwiperContainer>
  )
}
