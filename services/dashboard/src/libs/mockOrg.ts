export interface OrgGroup {
  id: OrgMemberStatus
  title: string
  backgroundColor?: string
  description?: string
}

export type OrgMemberStatus = 'UNASSIGNED' | 'LEADERS' | 'MANAGERS' | 'WORKERS'

export const INITIAL_GROUPS: OrgGroup[] = [
  { id: 'UNASSIGNED', title: 'Unassigned' },
  {
    backgroundColor: '#f5f5f5',
    description:
      'A clear vision aligned with goals is vital for strategy, ensuring informed decisions and collaboration.',
    id: 'LEADERS',
    title: 'Leaders',
  },
  {
    backgroundColor: '#ffffff',
    description:
      'Lead teams, handle daily operations, and facilitate communication.',
    id: 'MANAGERS',
    title: 'Managers',
  },
  {
    backgroundColor: '#f0f0ff',
    description: 'Complete tasks, aid project goals, and assist the team.',
    id: 'WORKERS',
    title: 'Workers',
  },
]

export interface Member {
  id: string
  avatar: string
  name: string
  status: OrgMemberStatus
  role: string
  tags: string[]
}

export const INITIAL_MEMBERS: Member[] = [
  {
    avatar: '/avatars/maki.jpg',
    id: '1',
    name: 'Maki Zenin',
    role: 'UI/UX Designer',
    status: 'UNASSIGNED',
    tags: [],
  },
  {
    avatar: '/avatars/anna.jpg',
    id: '2',
    name: 'Anna Smith',
    role: 'UX Designer',
    status: 'UNASSIGNED',
    tags: ['Guest'],
  },
  {
    avatar: '/avatars/yuuji.jpg',
    id: '3',
    name: 'Yuuji Itadori',
    role: 'PM',
    status: 'UNASSIGNED',
    tags: ['Admin'],
  },
  {
    avatar: '/avatars/naoya.jpg',
    id: '4',
    name: 'Naoya Zenin',
    role: 'Lead Developer',
    status: 'UNASSIGNED',
    tags: [],
  },
  {
    avatar: '/avatars/hiromi.jpg',
    id: '5',
    name: 'Hiromi Higuruma',
    role: '',
    status: 'UNASSIGNED',
    tags: ['Guest'],
  },
  {
    avatar: '/avatars/gojo.jpg',
    id: '6',
    name: 'Satoru Gojo',
    role: 'Team Leader',
    status: 'LEADERS',
    tags: ['Owner'],
  },
  {
    avatar: '/avatars/geto.jpg',
    id: '7',
    name: 'Suguru Geto',
    role: 'Tech Lead',
    status: 'LEADERS',
    tags: ['Admin'],
  },
  {
    avatar: '/avatars/shoko.jpg',
    id: '8',
    name: 'Shoko Ieiri',
    role: 'Project Director',
    status: 'LEADERS',
    tags: ['Admin'],
  },
  {
    avatar: '/avatars/megumi.jpg',
    id: '9',
    name: 'Megumi Fushiguro',
    role: 'Lead Architect',
    status: 'LEADERS',
    tags: ['Guest'],
  },
  {
    avatar: '/avatars/toge.jpg',
    id: '10',
    name: 'Toge Inumaki',
    role: '',
    status: 'LEADERS',
    tags: [],
  },
]
