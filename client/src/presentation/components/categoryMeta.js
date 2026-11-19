import { Palette, Code2, BriefcaseBusiness, Megaphone, ChartNoAxesCombined, Camera, Music, MessagesSquare } from 'lucide-react';

// Icon + colour tone per category. Shared by category tiles, illustrations and filters.
export const CATEGORY_META = {
  'Art & Design': { icon: Palette, bg: '#ffe0dc', fg: '#e0554a', art: '#ffd4cf' },
  Development: { icon: Code2, bg: '#dfe5ff', fg: '#3c5be0', art: '#9aa6ff' },
  Business: { icon: BriefcaseBusiness, bg: '#dff3f4', fg: '#1f8a94', art: '#bfe7ea' },
  Marketing: { icon: Megaphone, bg: '#ffe9c7', fg: '#c26a00', art: '#ffd9a0' },
  'Data Science': { icon: ChartNoAxesCombined, bg: '#d9f3e8', fg: '#0e8f60', art: '#bfeacf' },
  Photography: { icon: Camera, bg: '#e9e3ff', fg: '#6a4fd1', art: '#cfc5ff' },
  Music: { icon: Music, bg: '#ffdcee', fg: '#c2307a', art: '#ffc2e0' },
  Communication: { icon: MessagesSquare, bg: '#d6eefc', fg: '#1d78b5', art: '#b9defa' },
};
export const metaFor = (c) => CATEGORY_META[c] || CATEGORY_META.Development;
