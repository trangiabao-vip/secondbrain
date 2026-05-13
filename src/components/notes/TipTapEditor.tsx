'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Heading2, Heading3, Quote, SquareCheckBig, Highlighter, LinkIcon, Undo, Redo
} from 'lucide-react';
import { InputRule, Extension } from '@tiptap/core';
import { Wikilink } from './WikilinkExtension';
import { useRouter } from 'next/navigation';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Bắt đầu ghi chú... Hỗ trợ Markdown & [[wikilinks]]',
  className,
  editable = true,
}: TipTapEditorProps) {
  const router = useRouter();

  // Simple input rule for [[wikilink]]
  const wikilinkInputRule = new InputRule({
    find: /\[\[([^\]]+)\]\]$/,
    handler: ({ state, range, match }) => {
      const { tr } = state;
      const start = range.from;
      const end = range.to;
      const text = match[1];
      
      tr.replaceWith(start, end, state.schema.text(`[[${text}]]`, [state.schema.marks.wikilink.create({ href: `/notes?q=${encodeURIComponent(text)}` })]));
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Typography,
      Wikilink,
      Extension.create({
        name: 'wikilinkInputRule',
        addInputRules() {
          return [wikilinkInputRule];
        },
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
          'prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground',
          '[&_.ProseMirror-trailingBreak]:hidden',
        ),
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkToLink({}).unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkToLink({}).setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, title, children }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-7 w-7', active && 'bg-accent text-accent-foreground')}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn('rounded-md border bg-background', className)}>
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Hoàn tác"
          ><Undo className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Làm lại"
          ><Redo className="h-3.5 w-3.5" /></ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Tiêu đề 2"
          ><Heading2 className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Tiêu đề 3"
          ><Heading3 className="h-3.5 w-3.5" /></ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="In đậm"
          ><Bold className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="In nghiêng"
          ><Italic className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Gạch ngang"
          ><Strikethrough className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
            title="Đánh dấu"
          ><Highlighter className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Code"
          ><Code className="h-3.5 w-3.5" /></ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Danh sách không thứ tự"
          ><List className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Danh sách có thứ tự"
          ><ListOrdered className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive('taskList')}
            title="Danh sách công việc"
          ><SquareCheckBig className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Trích dẫn"
          ><Quote className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Chèn link">
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
