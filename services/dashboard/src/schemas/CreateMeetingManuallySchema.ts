import { z } from 'zod'

import { MeetingUrlType } from '~/components/domain/dataSource/AddMeetingLinkModal'
import { extractTeamsPasscode, getMeetingUrlType } from '~/utils/urlUtils'

const validateMeetingUrl = (rawUrl: string) => {
  const urlType = getMeetingUrlType(rawUrl)
  return urlType !== MeetingUrlType.Invalid
}

export const createMeetingManuallySchema = (isVitalsMode: boolean) =>
  z
    .object({
      isInvited: z.boolean(),
      isRecurring: z.boolean(),
      passcode: z.string().optional(),
      pulse: z.string().optional(),
      url: z.string().url('Please enter a valid URL'),
    })
    .superRefine((data, ctx) => {
      if (isVitalsMode && !data.pulse) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pulse is required',
          path: ['pulse'],
        })
      }

      if (data.url && !validateMeetingUrl(data.url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'URL must be a valid Google Meet, Microsoft Teams, Zoom link',
          path: ['url'],
        })
      }

      // Validate passcode for Zoom meetings (only if no passcode in URL)
      if (data.url && getMeetingUrlType(data.url) === MeetingUrlType.Zoom) {
        if (!data.passcode)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Passcode is required for Zoom meetings',
            path: ['passcode'],
          })
      }

      if (
        data.url &&
        getMeetingUrlType(data.url) === MeetingUrlType.MicrosoftTeams
      ) {
        const urlPasscode = extractTeamsPasscode(data.url)
        if (!urlPasscode && (!data.passcode || data.passcode.trim() === '')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Passcode is required for Microsoft Teams meetings',
            path: ['passcode'],
          })
        }
      }
    })

export type CreateMeetingManuallyParams = z.infer<
  ReturnType<typeof createMeetingManuallySchema>
>
