import { TableCell, TableRow } from '@mui/material'
import { Stack } from '@mui/system'
import { Button } from '@zunou-react/components/form'
import { useTranslation } from 'react-i18next'

import { useLanguage } from '~/hooks/useLanguage'

const LanguageSelect = () => {
  const { t } = useTranslation()
  const { selectedLanguage, setLanguage } = useLanguage()

  return (
    <TableRow>
      <TableCell sx={{ alignContent: 'flex-start' }}>{t('language')}</TableCell>
      <TableCell>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Button
            color={selectedLanguage === 'en' ? 'primary' : 'inherit'}
            onClick={() => setLanguage('en')}
            variant={selectedLanguage === 'en' ? 'contained' : 'outlined'}
          >
            English (EN)
          </Button>
          <Button
            color={selectedLanguage === 'ja' ? 'primary' : 'inherit'}
            onClick={() => setLanguage('ja')}
            variant={selectedLanguage === 'ja' ? 'contained' : 'outlined'}
          >
            Japanese (日本語)
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  )
}

export default LanguageSelect
