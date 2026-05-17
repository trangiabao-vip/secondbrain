'use client';

import * as React from 'react';
import { BlockNoteEditor as BNEditor } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/react/style.css';

interface BlockNoteEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function BlockNoteEditorComponent({
  content,
  onChange,
  placeholder = 'Bắt đầu ghi chú... (Nhấn / để xem lệnh)',
  editable = true,
}: BlockNoteEditorProps) {
  const [editor, setEditor] = React.useState<BNEditor | null>(null);

  React.useEffect(() => {
    async function initEditor() {
      const e = BNEditor.create();
      if (content) {
        try {
          const blocks = await e.tryParseHTMLToBlocks(content);
          e.replaceBlocks(e.document, blocks);
        } catch (error) {
          console.error("Failed to parse initial HTML to blocks", error);
        }
      }
      setEditor(e);
    }
    initEditor();
  }, []); // Run once on mount

  if (!editor) {
    return (
      <div className="min-h-[200px] flex items-center justify-center border rounded-md text-sm text-muted-foreground bg-background">
        Đang tải trình soạn thảo...
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background py-4 min-h-[200px]">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={async () => {
          const html = await editor.blocksToHTMLLossy(editor.document);
          onChange(html);
        }}
        // blocknote applies generic styles. if the app is dark mode by default, 
        // you might want to switch theme="dark" or leave it auto.
      />
    </div>
  );
}
