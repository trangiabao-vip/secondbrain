'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { type Note } from '@/lib/data';
import { TipTapEditor } from '@/components/notes/TipTapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Plus, Search, Pin, PinOff, Trash2, Calendar, Tag, FileText, StickyNote, Hash, ListTodo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const getDateFromFirestore = (date: any): Date | null => {
  if (!date) return null;
  if (typeof date === 'string') return parseISO(date);
  if (date && typeof date.toDate === 'function') return date.toDate();
  if (date.seconds) return new Date(date.seconds * 1000);
  if (date instanceof Date) return date;
  return null;
};

// Extract #tags from content (plain text)
function extractTagsFromText(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) || [];
  return [...new Set(matches)];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function NotesView() {
  const { notes, tasks, addNote, updateNote, deleteNote, updateTask } = useAppContext() as any;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'note' | 'task'>('note');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'daily' | 'tasks'>('all');
  const [editingTitle, setEditingTitle] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // All unique tags from all notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    (notes || []).forEach((n: Note) => {
      const contentTags = extractTagsFromText(stripHtml(n.content || ''));
      contentTags.forEach(t => tagSet.add(t));
      (n.tags || []).forEach(t => tagSet.add(t));
    });
    (tasks || []).forEach((t: any) => {
      if (t.notes) {
        const contentTags = extractTagsFromText(stripHtml(t.notes || ''));
        contentTags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [notes, tasks]);

  // Filter notes
  const filteredItems = useMemo(() => {
    let noteList: any[] = (notes || []).map(n => ({ ...n, type: 'note' }));
    let taskList: any[] = (tasks || []).map(t => ({ ...t, type: 'task', title: t.text, content: t.notes || '' }));
    
    let combined = [...noteList, ...taskList];

    if (activeFilter === 'pinned') combined = combined.filter(n => n.isPinned);
    if (activeFilter === 'daily') combined = combined.filter(n => n.isDaily);
    if (activeFilter === 'tasks') combined = combined.filter(n => n.type === 'task');

    if (activeTag) {
      combined = combined.filter(n => {
        const contentTags = extractTagsFromText(stripHtml(n.content || ''));
        return contentTags.includes(activeTag) || (n.tags || []).includes(activeTag);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(n =>
        n.title.toLowerCase().includes(q) ||
        stripHtml(n.content || '').toLowerCase().includes(q)
      );
    }

    // Pinned first, then by date
    return combined.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aDate = getDateFromFirestore(a.updatedAt || a.createdAt);
      const bDate = getDateFromFirestore(b.updatedAt || b.createdAt);
      return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0);
    });
  }, [notes, tasks, searchQuery, activeTag, activeFilter]);

  const selectedItem = useMemo(() =>
    filteredItems.find(i => i.id === selectedItemId) ?? null,
    [filteredItems, selectedItemId]
  );

  // Auto-select first note when filter changes
  const handleCreateNote = useCallback(async () => {
    const id = await addNote({
      title: 'Ghi chú chưa có tên',
      content: '',
      tags: [],
      isPinned: false,
      isDaily: false,
    });
    if (id) {
      setSelectedItemId(id);
      setSelectedItemType('note');
      setEditingTitle('Ghi chú chưa có tên');
    }
  }, [addNote]);

  const handleCreateDailyNote = useCallback(async () => {
    const existingDaily = (notes || []).find((n: Note) => n.isDaily && n.dailyDate === todayStr);
    if (existingDaily) {
      setSelectedItemId(existingDaily.id);
      setSelectedItemType('note');
      return;
    }
    const title = `Nhật ký - ${format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}`;
    const id = await addNote({
      title,
      content: `<h2>📅 ${title}</h2><p></p><h3>✅ Hôm nay cần làm</h3><ul><li><p></p></li></ul><h3>💡 Suy nghĩ & Ý tưởng</h3><p></p><h3>📝 Ghi chú</h3><p></p>`,
      tags: ['#daily'],
      isPinned: false,
      isDaily: true,
      dailyDate: todayStr,
    });
    if (id) {
      setSelectedItemId(id);
      setSelectedItemType('note');
    }
  }, [addNote, notes, todayStr]);

  const handleContentChange = useCallback((html: string) => {
    if (!selectedItemId) return;
    if (selectedItemType === 'task') {
        updateTask(selectedItemId, { notes: html });
    } else {
        const tags = extractTagsFromText(stripHtml(html));
        updateNote(selectedItemId, { content: html, tags, updatedAt: new Date() });
    }
  }, [selectedItemId, selectedItemType, updateNote, updateTask]);

  const handleTitleChange = useCallback((title: string) => {
    setEditingTitle(title);
    if (!selectedItemId) return;
    if (selectedItemType === 'task') {
        updateTask(selectedItemId, { text: title });
    } else {
        updateNote(selectedItemId, { title, updatedAt: new Date() });
    }
  }, [selectedItemId, selectedItemType, updateNote, updateTask]);

  const handleTogglePin = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItemType === 'note') {
        updateNote(selectedItem.id, { isPinned: !selectedItem.isPinned });
    }
  }, [selectedItem, selectedItemType, updateNote]);

  const handleDeleteNote = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItemType === 'note') {
        deleteNote(selectedItem.id);
    }
    setSelectedItemId(null);
  }, [selectedItem, selectedItemType, deleteNote]);

  const handleSelectItem = useCallback((item: any) => {
    setSelectedItemId(item.id);
    setSelectedItemType(item.type);
    setEditingTitle(item.title);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r flex flex-col bg-card">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-2 border-b flex gap-1">
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleCreateNote}>
            <Plus className="h-3 w-3 mr-1" /> Mới
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn('flex-1 h-7 text-xs', isToday(new Date()) && 'border-primary text-primary')}
            onClick={handleCreateDailyNote}
          >
            <Calendar className="h-3 w-3 mr-1" /> Hôm nay
          </Button>
        </div>

        {/* Filters */}
        <div className="p-2 border-b space-y-0.5">
          {(['all', 'pinned', 'daily', 'tasks'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'w-full text-left text-xs px-2 py-1.5 rounded-md flex items-center gap-2',
                activeFilter === filter
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {filter === 'all' && <FileText className="h-3.5 w-3.5" />}
              {filter === 'pinned' && <Pin className="h-3.5 w-3.5" />}
              {filter === 'daily' && <Calendar className="h-3.5 w-3.5" />}
              {filter === 'tasks' && <ListTodo className="h-3.5 w-3.5" />}
              {filter === 'all' ? 'Tất cả ghi chú' : 
               filter === 'pinned' ? 'Đã ghim' : 
               filter === 'daily' ? 'Nhật ký' : 'Nhiệm vụ'}
              <span className="ml-auto text-xs opacity-60">
                {filter === 'all' ? filteredItems.length :
                 filter === 'pinned' ? filteredItems.filter(n => n.isPinned).length :
                 filter === 'daily' ? filteredItems.filter(n => n.isDaily).length :
                 filteredItems.filter(n => n.type === 'task').length}
              </span>
            </button>
          ))}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="p-2 border-b">
            <p className="text-xs text-muted-foreground mb-1.5 px-1 flex items-center gap-1">
              <Hash className="h-3 w-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full border',
                    activeTag === tag
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Item List */}
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <StickyNote className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
                </p>
              </div>
            ) : (
              filteredItems.map((item: any) => {
                const updatedAt = getDateFromFirestore(item.updatedAt || item.createdAt);
                const preview = stripHtml(item.content || '').slice(0, 80);
                const itemTags = extractTagsFromText(stripHtml(item.content || ''));
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-md transition-colors',
                      selectedItemId === item.id
                        ? 'bg-accent'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium truncate leading-tight flex items-center gap-1.5">
                        {item.type === 'task' ? (
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            item.status === 'hoàn thành' ? "bg-green-500" : "bg-blue-400"
                          )} />
                        ) : (
                          item.isPinned && <Pin className="h-3 w-3 text-primary" />
                        )}
                        {item.isDaily && <Calendar className="h-3 w-3 text-blue-400" />}
                        {item.title}
                      </p>
                    </div>
                    {preview && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 italic">{preview}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      {updatedAt && (
                        <p className="text-[10px] text-muted-foreground/60">
                          {format(updatedAt, 'dd/MM HH:mm')}
                        </p>
                      )}
                      <div className="flex gap-1 items-center">
                        {item.type === 'task' && (
                            <Badge variant="outline" className="text-[9px] px-1 h-3.5 border-blue-200 text-blue-600">Task</Badge>
                        )}
                        {itemTags.length > 0 && (
                            <div className="flex gap-0.5">
                            {itemTags.slice(0, 2).map(t => (
                                <span key={t} className="text-[10px] text-primary/70">{t}</span>
                            ))}
                            </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedItem ? (
          <>
            {/* Item Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-transparent text-xl font-bold outline-none truncate"
                  placeholder={selectedItemType === 'task' ? "Nhiệm vụ..." : "Tiêu đề ghi chú..."}
                />
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedItemType === 'task' ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedItem.status === 'hoàn thành' ? "default" : "secondary"} className="h-5 text-[10px]">
                            {selectedItem.status.toUpperCase()}
                        </Badge>
                        {selectedItem.difficulty && (
                             <span className="text-xs text-muted-foreground opacity-70">
                             • Độ khó: {selectedItem.difficulty}
                             </span>
                        )}
                        {selectedItem.startDate && (
                            <span className="text-xs text-muted-foreground opacity-70">
                            • {format(getDateFromFirestore(selectedItem.startDate)!, 'dd/MM')}
                            </span>
                        )}
                      </div>
                  ) : (
                    <>
                    {getDateFromFirestore(selectedItem.updatedAt) && (
                        <span className="text-xs text-muted-foreground">
                        Cập nhật {format(getDateFromFirestore(selectedItem.updatedAt)!, 'HH:mm, dd/MM/yyyy', { locale: vi })}
                        </span>
                    )}
                    {extractTagsFromText(stripHtml(selectedItem.content || '')).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs h-5">
                        {tag}
                        </Badge>
                    ))}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                {selectedItemType === 'note' && (
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleTogglePin}
                    title={selectedItem.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
                    >
                    {selectedItem.isPinned
                        ? <PinOff className="h-4 w-4" />
                        : <Pin className="h-4 w-4" />
                    }
                    </Button>
                )}
                {selectedItemType === 'task' ? (
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs text-blue-600"
                        onClick={() => updateTask(selectedItem.id, { status: selectedItem.status === 'hoàn thành' ? 'chưa bắt đầu' : 'hoàn thành' })}
                    >
                        {selectedItem.status === 'hoàn thành' ? 'Mở lại' : 'Hoàn thành'}
                    </Button>
                ) : (
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Xóa ghi chú?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ghi chú "{selectedItem.title}" sẽ bị xóa vĩnh viễn.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
                            Xóa
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                )}
              </div>
            </div>

            {/* Editor */}
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto px-6 py-6">
                <TipTapEditor
                  content={selectedItem.content || ''}
                  onChange={handleContentChange}
                  placeholder={selectedItemType === 'task' ? "Chi tiết nhiệm vụ..." : "Bắt đầu ghi chú... Dùng #tag để gắn nhãn..."}
                  className="border-0 shadow-none min-h-[60vh]"
                />
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <StickyNote className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chọn hoặc tạo ghi chú</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Tổ chức suy nghĩ với #tags, ghi nhật ký hằng ngày, và tạo mạng lưới kiến thức của bạn.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleCreateNote}>
                <Plus className="h-4 w-4 mr-2" /> Tạo ghi chú mới
              </Button>
              <Button variant="outline" onClick={handleCreateDailyNote}>
                <Calendar className="h-4 w-4 mr-2" /> Nhật ký hôm nay
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
