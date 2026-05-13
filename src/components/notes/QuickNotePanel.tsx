'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { TipTapEditor } from './TipTapEditor';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function QuickNotePanel() {
  const { notes, addNote, updateNote } = useAppContext() as any;
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') { // Let's use Ctrl+Q for quick note (since Ctrl+N usually opens new browser window)
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When opening empty, maybe load today's daily note or just a blank temp
  useEffect(() => {
    if (isOpen && !activeNoteId) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const daily = (notes || []).find((n: any) => n.isDaily && n.dailyDate === todayStr);
      if (daily) {
        setActiveNoteId(daily.id);
        setContent(daily.content || '');
      } else {
        // Just empty
        setContent('');
        setActiveNoteId(null);
      }
    }
  }, [isOpen, activeNoteId, notes]);

  const handleSave = useCallback(async () => {
    if (!content.trim() || content === '<p></p>') {
      setIsOpen(false);
      return;
    }

    if (activeNoteId) {
      updateNote(activeNoteId, { content });
    } else {
      // Create new scratch note
      await addNote({
        title: `Ghi chú nhanh - ${format(new Date(), 'HH:mm dd/MM')}`,
        content: content,
        tags: ['#quick'],
      });
    }
    setIsOpen(false);
    setContent('');
    setActiveNoteId(null);
  }, [content, activeNoteId, updateNote, addNote]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex flex-col bg-background border shadow-2xl rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        isExpanded ? "w-[600px] h-[600px]" : "w-[350px] h-[400px]"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 cursor-move">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {activeNoteId ? 'Sửa ghi chú' : 'Ghi chú nhanh'}
          <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Ctrl+Q</span>
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground" onClick={() => setIsOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <TipTapEditor
          content={content}
          onChange={setContent}
          placeholder="Viết gì đó nhanh..."
          className="border-0 shadow-none min-h-full"
        />
      </div>

      <div className="p-2 border-t bg-muted/30 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Tự động gắn tag #quick</p>
        <Button size="sm" onClick={handleSave} className="h-7 text-xs">
          <Save className="h-3.5 w-3.5 mr-1" /> Lưu
        </Button>
      </div>
    </div>
  );
}
