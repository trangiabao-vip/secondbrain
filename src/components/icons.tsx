
'use client';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Edit,
  Film,
  Gamepad2,
  GripVertical,
  Home,
  LayoutGrid,
  Lightbulb,
  MoreHorizontal,
  Plus,
  Radio,
  Send,
  Sparkles,
  Star,
  Swords,
  Target,
  Trash2,
  Users,
  X,
  BookUser,
  Github,
  Linkedin,
  Facebook,
  Instagram,
  FileText,
  Search,
  Repeat,
  Youtube,
  Bell,
  type LucideIcon,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  logo: Lightbulb,
  home: Home,
  interest: Lightbulb,
  topic: BookOpen,
  goal: Target,
  task: CheckSquare,
  add: Plus,
  close: X,
  calendar: Calendar,
  ai: Sparkles,
  delete: Trash2,
  down: ChevronDown,
  up: ChevronUp,
  right: ChevronRight,
  left: ChevronLeft,
  ellipsis: MoreHorizontal,
  edit: Edit,
  grid: LayoutGrid,
  copy: Copy,
  game: Gamepad2,
  trueOrDare: Swords,
  luckyPin: Star,
  watchTogether: Film,
  send: Send,
  users: Users,
  businessCard: BookUser,
  github: Github,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  dashboard: LayoutGrid,
  salesPage: FileText,
  search: Search,
  recurrence: Repeat,
  channel: Radio,
  youtube: Youtube,
  drag: GripVertical,
  notification: Bell,
  whoIsTheSpy: ({ className }: { className?: string }) => (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Z" />
      <path d="M18.7 13.3a9 9 0 1 0-13.4 0" />
      <path d="M12 12v10" />
      <path d="M12 12a6 6 0 0 0-6 6" />
      <path d="M12 12a6 6 0 0 1 6 6" />
    </svg>
  ),
  x: ({ className }: { className?: string }) => (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  discord: ({ className }: { className?: string }) => (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879a.5.5 0 0 0 .562-.438V19.5s-.281.188-.656.313c-1.563.5-2.813-.25-2.813-.25s-.5-.875-.625-1.125c-.125-.25-.25-.375-.375-.438s-.188-.063-.125 0c.063.063.25.125.438.313.188.188.438.563.438.563s.625 1.563 2.688 1.563c1.563 0 2.5-.375 2.5-.375s.125-.188.188-.313c0-.063-.063-.125-.125-.188l-1.063-.625s.5 0 .938.063c2.5.313 4.125-1.563 4.125-4.125s-1.875-4.375-4.375-4.375-4.375 1.875-4.375 4.375c0 .5.063.938.188 1.375" />
    </svg>
  ),
  zalo: ({ className }: { className?: string }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 512 512"
        fill="currentColor"
    >
        <path d="M296.883 310.638l-37.54-65.02L225.92 298.5l-21.75-37.674h-44.14v77.347h32.454V301.8l20.44-35.402L235.35 338.17h36.08l41.54-72.037-26.087-45.187H188.16l-31.54 54.62-31.54-54.62H27.118l62.32 107.94-62.32 107.938H125.08l31.54-54.62 31.54 54.62h98.718l-26.088-45.188 41.54-72.036v.002zM333.34 128H407.9v187.5h-54.04V196.408L305.5 252.133V150.41l48.36-84.02h-48.36v-22.41H452v22.41l-48.36 84.02V338.17H452V384H305.5l.002-45.83-54.043-93.606L305.5 150.41v-22.41z"/>
    </svg>
  )
};
