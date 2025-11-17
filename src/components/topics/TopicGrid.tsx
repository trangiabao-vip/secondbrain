'use client';
import { useAppContext } from "@/contexts/AppContext";
import { TopicCard } from "./TopicCard";
import { AddTopicDialog } from "./AddTopicDialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export function TopicGrid() {
  const { topics, selectedInterest } = useAppContext();
  const filteredTopics = topics.filter(topic => topic.interestId === selectedInterest?.id);

  if (!selectedInterest) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Topics for {selectedInterest.name}</h2>
        <AddTopicDialog>
          <Button>
            <Icons.add className="mr-2 h-4 w-4" />
            New Topic
          </Button>
        </AddTopicDialog>
      </div>
      {filteredTopics.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
            <Icons.topic className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Topics Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first topic to start organizing your goals.
            </p>
            <div className="mt-6">
                <AddTopicDialog>
                    <Button>
                        <Icons.add className="mr-2 h-4 w-4" />
                        New Topic
                    </Button>
                </AddTopicDialog>
            </div>
        </div>
      )}
    </div>
  );
}
