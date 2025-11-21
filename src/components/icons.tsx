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
  Home,
  LayoutGrid,
  Lightbulb,
  MoreHorizontal,
  Plus,
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
};

    