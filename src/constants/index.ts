import { CardTheme, StickerItem } from '../types';

export const PROMPTS: string[] = [
  "send me anonymous messages!",
  "ask me anything... 🤫",
  "tell me a secret you never told anyone 🔥",
  "what was your first impression of me? 👀",
  "drop a confession or truth 💖",
  "roast me anonymously 😂",
  "tell me who you have a crush on 💘",
];

export const CARD_THEMES: CardTheme[] = [
  { id: 'ngl-brown', bg: '#3C291E', cardBorder: '#4E3628', accent: '#D4A373' },
  { id: 'ngl-mocha', bg: '#483327', cardBorder: '#5C4132', accent: '#E0A96D' },
  { id: 'ngl-espresso', bg: '#2B1C14', cardBorder: '#3C281D', accent: '#E7B892' },
  { id: 'ngl-velvet', bg: '#2C1B33', cardBorder: '#3E2748', accent: '#C77DFF' },
  { id: 'ngl-obsidian', bg: '#1C2430', cardBorder: '#293545', accent: '#00B4D8' },
];

export const STICKERS: StickerItem[] = [
  { id: 'slay', url: 'https://media.giphy.com/media/l41YmQjOz9qgIZw4g/giphy.gif', label: '💅 Slay' },
  { id: 'mindblown', url: 'https://media.giphy.com/media/26ufdipOdBgTE77R6/giphy.gif', label: '🤯 Mind Blown' },
  { id: 'cry', url: 'https://media.giphy.com/media/2WxWfiav9b0UrXMh4S/giphy.gif', label: '😭 Cry' },
  { id: 'popcat', url: 'https://media.giphy.com/media/S5Ju6tCE6OxlS93G14/giphy.gif', label: '🙀 Popcat' },
  { id: 'vibes', url: 'https://media.giphy.com/media/1ZDHvI41Dt0Rsi82Sk/giphy.gif', label: '✨ Vibes' },
  { id: 'no', url: 'https://media.giphy.com/media/vyTnNTrs3qyQ0/giphy.gif', label: '🙅 No' },
  { id: 'yes', url: 'https://media.giphy.com/media/3o7abKhOpu0NXS3lXW/giphy.gif', label: '🙌 Yes' },
  { id: 'dance', url: 'https://media.giphy.com/media/tsX3YMWYzDPjAARfJ1/giphy.gif', label: '🕺 Dance' },
  { id: 'skull', url: 'https://media.giphy.com/media/hS9M9vPJ9pZUk/giphy.gif', label: '💀 Dead' },
  { id: 'heart', url: 'https://media.giphy.com/media/l0EwYcQ1M4L95OTqE/giphy.gif', label: '❤️ Heart' },
];
