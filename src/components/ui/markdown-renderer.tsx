'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={cn('prose dark:prose-invert prose-sm max-w-none', className)}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-xl font-bold" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-lg font-semibold" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-base font-semibold" {...props} />,
        p: ({ node, ...props }) => <p className="leading-normal" {...props} />,
        a: ({ node, ...props }) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5" {...props} />,
        li: ({ node, ...props }) => <li className="my-1" {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground" {...props} />,
        code: ({ node, inline, ...props }) => inline 
            ? <code className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 font-mono text-xs" {...props} /> 
            : <pre className="bg-muted p-2 rounded-md overflow-x-auto"><code className="font-mono text-xs" {...props} /></pre>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
