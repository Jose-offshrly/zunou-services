export interface MockMeeting {
  id: string
  title: string
  url: string
  datetime: Date
  source: 'meet' | 'manual'
  pulse: boolean
  participants: string[]
  status: 'upcoming' | 'active'
}

const now = new Date()

export const activeMeetings: MockMeeting[] = [
  {
    datetime: new Date(now.getTime() - 30 * 60 * 1000), // -30 mins
    id: '1',
    participants: ['Dave', 'Eve'],
    pulse: false,
    source: 'meet',
    status: 'active',
    title: 'Code Review',
    url: 'https://meet.google.com/code-review',
  },
  {
    datetime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // -2 hours
    id: '2',
    participants: ['Frank', 'Grace'],
    pulse: false,
    source: 'manual',
    status: 'active',
    title: 'Tech Support Training',
    url: 'https://meet.google.com/support-training',
  },
]

export const upcomingMeetings: MockMeeting[] = [
  {
    datetime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // +1 day
    id: '3',
    participants: ['Alice', 'Bob'],
    pulse: false,
    source: 'meet',
    status: 'upcoming',
    title: 'Weekly Planning',
    url: 'https://meet.google.com/abc-defg-hij',
  },
  {
    datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
    id: '4',
    participants: [],
    pulse: false,
    source: 'manual',
    status: 'upcoming',
    title: 'Product Demo',
    url: 'https://meet.google.com/xyz-mnop-qrs',
  },
  {
    datetime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
    id: '5',
    participants: ['Charlie', 'Eve'],
    pulse: false,
    source: 'meet',
    status: 'upcoming',
    title: 'Marketing Strategy',
    url: 'https://meet.google.com/mkt-strategy',
  },
  {
    datetime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
    id: '6',
    participants: [],
    pulse: false,
    source: 'manual',
    status: 'upcoming',
    title: 'Client Onboarding',
    url: 'https://meet.google.com/client-onboard',
  },
  {
    datetime: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000), // +9 days
    id: '7',
    participants: ['Frank', 'Grace'],
    pulse: false,
    source: 'meet',
    status: 'upcoming',
    title: 'Engineering Sync',
    url: 'https://meet.google.com/eng-sync',
  },
  {
    datetime: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000), // +11 days
    id: '8',
    participants: [],
    pulse: false,
    source: 'manual',
    status: 'upcoming',
    title: 'Sales Review',
    url: 'https://meet.google.com/sales-review',
  },
  {
    datetime: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000), // +13 days
    id: '9',
    participants: ['Alice', 'Charlie', 'Eve'],
    pulse: false,
    source: 'meet',
    status: 'upcoming',
    title: 'Quarterly Business Update',
    url: 'https://meet.google.com/business-update',
  },
  {
    datetime: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // +15 days
    id: '10',
    participants: [],
    pulse: false,
    source: 'manual',
    status: 'upcoming',
    title: 'Design Review',
    url: 'https://meet.google.com/design-review',
  },
  {
    datetime: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000), // +17 days
    id: '11',
    participants: ['Dave', 'Eve', 'Frank'],
    pulse: false,
    source: 'meet',
    status: 'upcoming',
    title: 'Company All-Hands',
    url: 'https://meet.google.com/all-hands',
  },
  {
    datetime: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000), // +19 days
    id: '12',
    participants: [],
    pulse: false,
    source: 'manual',
    status: 'upcoming',
    title: 'HR Policy Updates',
    url: 'https://meet.google.com/hr-policy',
  },
]

export const meetings: MockMeeting[] = [...activeMeetings, ...upcomingMeetings]

export const googleMeetings: MockMeeting[] = meetings.filter(
  (meeting) => meeting.source === 'meet',
)
