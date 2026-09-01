export interface VibeOption {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  promptIndex: number;
}

export const VIBE_OPTIONS: VibeOption[] = [
  {
    id: 'confessions',
    emoji: '🤫',
    title: 'Secret Confessions',
    subtitle: 'Drop truths, secrets & tea',
    promptIndex: 2,
  },
  {
    id: 'ama',
    emoji: '🔥',
    title: 'Ask Me Anything',
    subtitle: 'Answer spicy & fun questions',
    promptIndex: 1,
  },
  {
    id: 'latenight',
    emoji: '💬',
    title: 'Late Night Chats',
    subtitle: 'Deep anonymous talks with friends',
    promptIndex: 0,
  },
  {
    id: 'crush',
    emoji: '💘',
    title: 'Crush & Truths',
    subtitle: 'Anonymous compliments & crushes',
    promptIndex: 4,
  },
  {
    id: 'roast',
    emoji: '😂',
    title: 'Roast Me Anonymously',
    subtitle: 'No filter, pure fun roasts',
    promptIndex: 5,
  },
];
