export const isMobileDevice = () => {
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    )

  // Check for touch capability and screen size (catches iPads with desktop user agents)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  // const isTabletSize =
  //   window.screen.width <= 1024 && window.screen.height <= 1366

  // iPad specific detection (newer iPads may report as desktop)
  const isIPad =
    /ipad/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  return isMobileUA || isIPad || isTouchDevice
}

export const isPortraitMode = () => {
  return window.innerHeight > window.innerWidth
}
