
'use client';
import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { type SalesPage } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PageSkeleton = () => (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
        </div>
    </div>
);

// Basic Markdown to HTML conversion
const renderContent = (content: string) => {
  return content
    .split('\n')
    .map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-2xl font-semibold mt-6 mb-3">{line.substring(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-3xl font-semibold mt-8 mb-4 border-b pb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-4xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="mb-4 leading-relaxed">{line}</p>;
    })
};


export default function SharedSalesPage() {
  const { slug } = useParams();
  const { firestore } = useFirebase();

  const pageQuery = useMemoFirebase(() => {
    if (!firestore || typeof slug !== 'string') return null;
    return query(
      collection(firestore, 'salesPages'),
      where('slug', '==', slug),
      limit(1)
    );
  }, [firestore, slug]);

  const { data: pages, isLoading } = useCollection<SalesPage>(pageQuery);
  const [pageData, setPageData] = useState<SalesPage | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (pages && pages.length > 0) {
        setPageData(pages[0]);
      } else {
        notFound();
      }
    }
  }, [isLoading, pages]);

  if (isLoading || !pageData) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
            <article className="prose prose-lg dark:prose-invert max-w-none">
                 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 border-b pb-4">{pageData.title}</h1>
                 <div className="mt-6">{renderContent(pageData.content)}</div>
            </article>
        </div>
    </div>
  );
}
