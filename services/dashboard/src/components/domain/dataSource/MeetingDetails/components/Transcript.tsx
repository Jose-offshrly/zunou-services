import { Stack, Typography, TypographyProps } from '@mui/material'
import type { Transcript } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import React from 'react'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

interface TranscriptProps {
  dataSourceId?: string
  name?: string
  date?: string
  // setShowSpeakerTagsEditor?: (value: boolean) => void
  transcript?: Transcript
  isTranscriptLoading?: boolean
}

interface NewlineTextProps extends TypographyProps {
  text: string
}

const NewlineText = ({ text, ...props }: NewlineTextProps) => {
  return (
    <Typography {...props}>
      {text.split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {line}
          <br />
        </React.Fragment>
      ))}
    </Typography>
  )
}

const TranscriptLoader = () => {
  return (
    <Stack gap={2}>
      <LoadingSkeleton height={40} />

      <LoadingSkeleton height={120} />

      <LoadingSkeleton height={40} />

      <LoadingSkeleton height={40} />
    </Stack>
  )
}

const Transcript = ({
  dataSourceId,
  name,
  // setShowSpeakerTagsEditor,
  transcript,
  isTranscriptLoading,
}: TranscriptProps) => {
  // const { t } = useTranslation('sources')

  const handleDownload = () => {
    const content = transcript?.content ?? ''

    if (!content.trim()) {
      alert('No transcript content available to download')
      return
    }

    // Create a blob with the transcript content
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob)

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = `${(name ?? 'unknown').toLowerCase().replace(/ /g, '-')}-transcript.txt`

    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL
    URL.revokeObjectURL(url)
  }

  if (!dataSourceId) return <Stack>Missing Data Source Id</Stack>
  if (isTranscriptLoading) return <TranscriptLoader />

  const content = transcript?.content ?? 'No Transcript'

  return (
    <Stack gap={2} height="100%">
      <Stack
        alignItems="center"
        direction="row"
        flexShrink={0}
        justifyContent="start"
      >
        {/* <Stack>
          <Typography color="text.primary" fontSize={20} fontWeight="bold">
            {name}
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Receive UTC from BE convert to user's tz
            {dayjs.utc(date).tz(timezone).format('LLL')}
          </Typography>
        </Stack> */}
        <Stack direction="row" spacing={1}>
          <Button
            disabled={!content.trim()}
            onClick={handleDownload}
            sx={{
              width: 'fit-content',
            }}
            variant="contained"
          >
            Download
          </Button>
          {/* {setShowSpeakerTagsEditor && ( */}
          {/*   <Button */}
          {/*     disableRipple={true} */}
          {/*     onClick={() => setShowSpeakerTagsEditor(true)} */}
          {/*     sx={{ */}
          {/*       width: 'fit-content', */}
          {/*     }} */}
          {/*     variant="outlined" */}
          {/*   > */}
          {/*     {t('Improve Speaker Tag')} */}
          {/*   </Button> */}
          {/* )} */}
        </Stack>
      </Stack>
      <Stack flexGrow={1} minHeight={0} overflow="auto">
        <NewlineText text={content} />
      </Stack>
    </Stack>
  )
}

export default Transcript
