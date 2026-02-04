import createCache from '@emotion/cache'
import { createTheme } from '@mui/material/styles'
import { createStyled } from '@mui/system'

import PoppinsItalic from '../assets/fonts/Poppins-Italic.ttf'
import PoppinsMedium from '../assets/fonts/Poppins-Medium.ttf'
import PoppinsMediumItalic from '../assets/fonts/Poppins-MediumItalic.ttf'
import PoppinsRegular from '../assets/fonts/Poppins-Regular.ttf'
import PoppinsSemiBold from '../assets/fonts/Poppins-SemiBold.ttf'
import PoppinsSemiBoldItalic from '../assets/fonts/Poppins-SemiBoldItalic.ttf'

export function createEmotionCache() {
  return createCache({ key: 'css', prepend: true })
}
declare module '@mui/material/styles' {
  interface CommonColors {
    gold: string
    green: string
    lime: string
    cherry: string
    dandelion: string
    cream: string
    lightBlue: string
    pink: string
    pastelGreen: string
    sky: string
    darkBlue: string
    blue: string
    yellow: string
  }
  interface Palette {
    iris: Palette['grey']
    muted: Palette['primary']
    status: {
      active: string
      busy: string
      hiatus: string
      offline: string
    }
    reference: {
      darkBlue: string
      darkBlueV2: string
      pastelYellow: string
      pastelYellowV2: string
    }
    onboardingCard: {
      green: string
      purple: string
      blue: string
      violet: string
    }
  }
  interface PaletteOptions {
    iris: PaletteOptions['grey']
    muted: PaletteOptions['primary']
    status?: {
      active: string
      busy: string
      hiatus: string
      offline: string
    }
    reference?: {
      darkBlue: string
      darkBlueV2: string
      pastelYellow: string
      pastelYellowV2: string
    }
    onboardingCard: {
      green: string
      purple: string
      blue: string
      violet: string
    }
  }
}

// The width of search filter inputs.
export const filterWidth = 180

export const createAppTheme = () =>
  createTheme({
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              color: '#FFF',
              cursor: 'not-allowed',
              pointerEvents: 'auto',
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              color: '#7F56D9',
              cursor: 'not-allowed',
              pointerEvents: 'auto',
            },
            color: '#7F56D9',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: (theme) => `
          @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-display: swap;
            font-weight: 400;
            src: local('Poppins'), local('Poppins-Regular'), url(${PoppinsRegular}) format('truetype');
          }
          @font-face {
            font-family: 'Poppins';
            font-style: italic;
            font-display: swap;
            font-weight: 400;
            src: local('Poppins Italic'), local('Poppins-Italic'), url(${PoppinsItalic}) format('truetype');
          }
          @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-display: swap;
            font-weight: 500;
            src: local('Poppins Medium'), local('Poppins-Medium'), url(${PoppinsMedium}) format('truetype');
          }
          @font-face {
            font-family: 'Poppins';
            font-style: italic;
            font-display: swap;
            font-weight: 500;
            src: local('Poppins Medium Italic'), local('Poppins-MediumItalic'), url(${PoppinsMediumItalic}) format('truetype');
          }
          @font-face {
            font-family: 'Poppins';
            font-style: normal;
            font-display: swap;
            font-weight: 600;
            src: local('Poppins SemiBold'), local('Poppins-SemiBold'), url(${PoppinsSemiBold}) format('truetype');
          }
          @font-face {
            font-family: 'Poppins';
            font-style: italic;
            font-display: swap;
            font-weight: 600;
            src: local('Poppins SemiBold Italic'), local('Poppins-SemiBoldItalic'), url(${PoppinsSemiBoldItalic}) format('truetype');
          }
          * {
            scrollbarColor: ${
              theme.palette.mode === 'dark'
                ? theme.palette.grey[700]
                : theme.palette.grey[300]
            } transparent;
            scrollbarWidth: thin;
          }
          body::-webkit-scrollbar {
            height: 4px;
            width: 4px;
          }
          body::-webkit-scrollbar-thumb {
            backgroundColor: ${
              theme.palette.mode === 'dark'
                ? theme.palette.grey[700]
                : theme.palette.grey[300]
            };
            borderRadius: 4px;
          }
          body::-webkit-scrollbar-thumb:hover {
            backgroundColor: ${
              theme.palette.mode === 'dark'
                ? theme.palette.grey[600]
                : theme.palette.grey[400]
            };
          body::-webkit-scrollbar-track {
            backgroundColor: transparent;
          }
        `,
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: '#667085',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            '&::placeholder': {
              color: '#667085',
            },
            color: '#344054',
          },
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#D0D5DD',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: '#344054',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              cursor: 'not-allowed',
              pointerEvents: 'auto',
            },
          },
          switchBase: {
            '&.Mui-disabled': {
              cursor: 'not-allowed',
              pointerEvents: 'none',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 'bold',
          },
        },
      },
    },
    palette: {
      action: {
        disabledBackground: '#75757533',
      },
      background: {
        default: '#FBFAFE',
      },
      common: {
        blue: '#3f8efc',
        cherry: '#FE6C5F',
        cream: '#FFF8E5',
        dandelion: '#FF9F39',
        gold: '#F7C768',
        green: '#2EC854',
        lightBlue: '#eff6ff',
        lime: '#18CB7F',
        pastelGreen: '#e8fae9',
        pink: '#FFF5F5',
        sky: '#5B8DEF1A',
        white: '#fff',
        yellow: '#E9F6F1',
      },
      divider: '#5C5FEF22',
      grey: {
        '100': '#F2F4F7',
        '200': '#EAECF0',
        '300': '#D0D5DD',
        '400': '#98A2B3',
        '500': '#667085',
        '600': '#475467',
        '700': '#344054',
        '800': '#1D2939',
        '900': '#101828',
      },
      iris: {
        '100': '#5D5FEF',
      },
      muted: {
        main: '#5c6499',
      },
      onboardingCard: {
        blue: '#155DFC',
        green: '#00A63E',
        purple: '#4A00E0',
        violet: '#9810FA',
      },
      primary: {
        contrastText: '#fff',
        main: '#4A00E0',
      },
      reference: {
        darkBlue: '#0C173B',
        darkBlueV2: '#0f2057',
        pastelYellow: '#FED888',
        pastelYellowV2: '#FF9F39',
      },
      secondary: {
        main: '#FE6C5F',
      },
      status: {
        active: '#20A271',
        busy: '#FF9F39',
        hiatus: '#FE6C5F',
        offline: '#757575',
      },
      text: {
        primary: '#344054',
        secondary: '#667085',
      },
    },
    typography: {
      fontFamily: 'Poppins',
      fontWeightBold: 600,
      fontWeightMedium: 500,
      fontWeightRegular: 400,
      h4: {
        marginBottom: '0.5rem',
      },
    },
  })

// Export a default theme for backward compatibility
export const theme = createAppTheme()
export const styled = createStyled({ defaultTheme: theme })
