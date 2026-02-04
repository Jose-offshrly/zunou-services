import { useEffect, useState } from 'react'

export enum OS {
  Windows = 'windows',
  MacOS = 'macos',
  Unknown = 'unknown',
}

const useOSDetection = () => {
  const [os, setOs] = useState<OS>(OS.Unknown)

  useEffect(() => {
    const detectOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()

      if (userAgent.includes('win')) {
        return OS.Windows
      } else if (userAgent.includes('mac')) {
        return OS.MacOS
      } else {
        return OS.Unknown
      }
    }

    setOs(detectOS())
  }, [])

  return os
}

export default useOSDetection
