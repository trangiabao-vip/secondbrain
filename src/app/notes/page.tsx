import { NotesView } from '@/components/notes/NotesView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ghi chú - Trung tâm Sở thích',
  description: 'Ghi chú thông minh với editor phong phú, #tags, nhật ký hằng ngày và tìm kiếm toàn văn.',
};

export default function NotesPage() {
  return <NotesView />;
}
