export interface Message {
  id: string
  user: {
    id: string
    name: string
    gravatar?: string
  }
  content: string
  timestamp: Date
  isRead: boolean
}

export const conversations: Message[] = [
  {
    content: 'Hey, can you check the new design I sent?',
    id: '1',
    isRead: false,

    timestamp: new Date(2025, 2, 26, 14, 30),
    user: {
      gravatar: undefined,
      id: 'user1',
      name: 'Alex Catlin',
    },
  },
  {
    content: 'When can we meet about the project?',
    id: '2',
    isRead: false,
    timestamp: new Date(2025, 2, 26, 11, 15),
    user: {
      gravatar: undefined,
      id: 'user2',
      name: 'Malek Nasser',
    },
  },
  {
    content: 'Ive updated the documentation',
    id: '3',
    isRead: true,
    timestamp: new Date(2025, 2, 25, 16, 45),
    user: {
      gravatar: undefined,
      id: 'user3',
      name: 'Lyle Geraldez',
    },
  },
  {
    content: 'Got your message, will look into it',
    id: '4',
    isRead: true,
    timestamp: new Date(2025, 2, 25, 9, 20),
    user: {
      gravatar: undefined,
      id: 'user4',
      name: 'Marcus Saw',
    },
  },
  {
    content: 'Thanks for your help yesterday!',
    id: '5',
    isRead: true,
    timestamp: new Date(2025, 2, 24, 13, 10),
    user: {
      gravatar: undefined,
      id: 'user5',
      name: 'Eliza Johnson',
    },
  },
]
