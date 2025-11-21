'use client';

import { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { type BusinessCard } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Mail, Phone, Globe, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FullPageCardSkeleton = () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm mx-auto">
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <Skeleton className="h-24 w-24 rounded-full mb-4" />
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-6 w-56 mb-1" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                    </div>
                    <Separator className="my-6" />
                    <div className="flex justify-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

export default function SharedCardPage() {
  const { cardId } = useParams();
  const { firestore } = useFirebase();

  const cardRef = useMemoFirebase(() => {
    if (!firestore || typeof cardId !== 'string') return null;
    return doc(firestore, 'businessCards', cardId);
  }, [firestore, cardId]);

  const { data: cardData, isLoading } = useDoc<BusinessCard>(cardRef);

  useEffect(() => {
    if (!isLoading && !cardData) {
      notFound();
    }
  }, [isLoading, cardData]);
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const socialIcons: Record<string, React.FC<{ className?: string }>> = {
    github: Icons.github,
    linkedin: Icons.linkedin,
    facebook: Icons.facebook,
    instagram: Icons.instagram,
    x: Icons.x,
  };
  
  if (isLoading || !cardData) {
    return <FullPageCardSkeleton />;
  }

  const { name, title, company, phone, email, website, accentColor, socials } = cardData;
  const cardAccent = accentColor || '#F59E0B';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm mx-auto">
             <Card 
                className="bg-card text-card-foreground shadow-2xl"
                style={{ '--shared-card-accent': cardAccent } as React.CSSProperties}
            >
                <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 text-4xl mb-4 border-2" style={{ borderColor: cardAccent }}>
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-bold">{name}</h3>
                    <p className="text-lg" style={{ color: cardAccent }}>{title}</p>
                    {company && (
                        <p className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>{company}</span>
                        </p>
                    )}
                </div>

                {(phone || email || website) && <Separator className="my-6" />}

                <div className="space-y-4 text-sm">
                    {phone && (
                        <p className="flex items-center gap-3">
                            <Phone className="h-4 w-4" style={{ color: cardAccent }}/>
                            <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
                        </p>
                    )}
                    {email && (
                        <p className="flex items-center gap-3">
                            <Mail className="h-4 w-4" style={{ color: cardAccent }}/>
                             <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                        </p>
                    )}
                    {website && (
                         <p className="flex items-center gap-3">
                            <Globe className="h-4 w-4" style={{ color: cardAccent }}/>
                             <a href={`https://${website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{website}</a>
                        </p>
                    )}
                </div>

                {socials && Object.values(socials).some(v => v) && <Separator className="my-6" />}

                 <div className="flex justify-center gap-4 text-2xl">
                     {socials && Object.entries(socials).map(([key, value]) => {
                         if (!value) return null;
                         const Icon = socialIcons[key as keyof typeof socials];
                         return Icon ? (
                            <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[--shared-card-accent]">
                                <Icon />
                            </a>
                         ) : null;
                     })}
                 </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    