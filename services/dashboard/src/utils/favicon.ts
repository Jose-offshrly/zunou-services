export function setEnvironmentFavicon() {
  const faviconType = import.meta.env.VITE_FAVICON
  const faviconLink = document.querySelector('link[rel="icon"]')

  if (faviconType === 'staging') {
    faviconLink?.setAttribute('href', '/favicon-orange.svg')
  } else {
    faviconLink?.setAttribute('href', '/favicon.png')
  }
}
