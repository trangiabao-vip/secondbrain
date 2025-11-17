'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { suggestTopics } from '@/ai/flows/ai-powered-topic-suggestion';
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '@/components/icons';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface AITopicSuggesterProps {
    onSuggestionClick: (suggestion: string) => void;
}

export function AITopicSuggester({ onSuggestionClick }: AITopicSuggesterProps) {
  const { selectedInterest } = useAppContext();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getSuggestions = async () => {
    if (!selectedInterest) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const response = await suggestTopics({ interests: [selectedInterest.name] });
      if (response && response.suggestedTopics) {
        setSuggestions(response.suggestedTopics);
      }
    } catch (error) {
      console.error('AI topic suggestion failed:', error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not fetch topic suggestions. Please try again later.",
      })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
      <div className='flex flex-col items-center text-center'>
        <p className="text-sm font-medium">Get AI-powered topic ideas</p>
        <p className='text-xs text-muted-foreground'>Based on your interest: "{selectedInterest?.name}"</p>
      </div>

      <Button onClick={getSuggestions} disabled={loading} className="w-full">
        <Icons.ai className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Generating Ideas...' : 'Suggest Topics'}
      </Button>

      {loading && (
        <div className="space-y-2 pt-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2 pt-2">
            <h4 className='text-sm font-medium text-center'>Click to use a suggestion:</h4>
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
