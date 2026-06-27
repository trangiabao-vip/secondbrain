'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  const router = useRouter();

  // Handle client-side routing when clicking internal links
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && (href.startsWith('/todo/notes') || href.startsWith('/notes'))) {
        e.preventDefault();
        router.push(href);
      }
    }
  };

  const hasHtml = /<[a-z][\s\S]*>/i.test(children || '');

  if (hasHtml) {
    let processedHtml = children || '';

    // First replace wrapped TipTap wikilink tags to avoid nested anchor issues
    processedHtml = processedHtml.replace(/<a[^>]*data-type="wikilink"[^>]*>\[\[(.*?)\]\]<\/a>/g, (match, title) => {
      return `<a href="/todo/notes?title=${encodeURIComponent(title)}" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">${title}</a>`;
    });

    // Then replace any raw wikilinks
    processedHtml = processedHtml.replace(/\[\[(.*?)\]\]/g, (match, title) => {
      return `<a href="/todo/notes?title=${encodeURIComponent(title)}" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">${title}</a>`;
    });

    return (
      <div
        className={cn('prose dark:prose-invert prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        onClick={handleContainerClick}
      />
    );
  }

  // Basic Wikilink parsing for Markdown [[Link Name]] -> [Link Name](/todo/notes?title=Link Name)
  const processedChildren = (children || '').replace(/\[\[(.*?)\]\]/g, (match, title) => {
    return `[${title}](/todo/notes?title=${encodeURIComponent(title)})`;
  });

  return (
    <div onClick={handleContainerClick}>
      <ReactMarkdown
        className={cn('prose dark:prose-invert prose-sm max-w-none', className)}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-semibold" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-semibold" {...props} />,
          p: ({ node, ...props }) => <p className="leading-normal" {...props} />,
          a: ({ node, ...props }) => {
            const isInternal = props.href?.startsWith('/todo/notes') || props.href?.startsWith('/notes');
            return (
              <a
                className={cn("text-primary hover:underline", isInternal && "font-medium text-blue-600 dark:text-blue-400")}
                target={isInternal ? undefined : "_blank"}
                rel={isInternal ? undefined : "noopener noreferrer"}
                {...props}
              />
            );
          },
          ul: ({ node, ...props }) => <ul className="list-disc pl-5" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5" {...props} />,
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground" {...props} />,
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                <code className="font-mono text-xs" {...props}>{children}</code>
              </pre>
            ) : (
              <code className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 font-mono text-xs" {...props}>{children}</code>
            );
          },
        }}
      >
        {processedChildren}
      </ReactMarkdown>
    </div>
  );
}
