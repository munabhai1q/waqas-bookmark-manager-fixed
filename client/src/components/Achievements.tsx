import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Trophy,
  Award,
  Star,
  Sparkles,
  BookOpen,
  Bookmark,
  Zap,
  Lock
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getQueryFn } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Achievement, UserAchievement } from '@shared/schema';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AchievementWithProgress = UserAchievement & {
  achievement: Achievement;
  percentComplete: number;
  isUnlocked: boolean;
};

export default function Achievements() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnlocked, setShowUnlocked] = useState(true);
  const [filteredAchievements, setFilteredAchievements] = useState<AchievementWithProgress[]>([]);
  
  const { 
    data: achievements, 
    isLoading, 
    isError 
  } = useQuery<(UserAchievement & {achievement: Achievement})[]>({
    queryKey: ['/api/achievements'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isOpen,
  });
  
  // Trigger achievement check when opened
  const { refetch } = useQuery({
    queryKey: ['/api/achievements/check'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: false,
  });
  
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);
  
  useEffect(() => {
    if (achievements) {
      const processed = achievements.map(ua => {
        const progress = ua.progress || 0;
        const percentComplete = ua.achievement.threshold > 0 
          ? Math.min(100, Math.round((progress / ua.achievement.threshold) * 100)) 
          : 0;
        
        return {
          ...ua,
          percentComplete,
          isUnlocked: ua.unlockedAt !== null,
        };
      });
      
      if (showUnlocked) {
        setFilteredAchievements(processed);
      } else {
        setFilteredAchievements(processed.filter(a => !a.isUnlocked));
      }
    }
  }, [achievements, showUnlocked]);
  
  const getIcon = (type: string, isUnlocked: boolean) => {
    if (!isUnlocked) return <Lock className="h-8 w-8 text-muted-foreground" />;
    
    switch (type) {
      case 'bookmark_count':
        return <Bookmark className="h-8 w-8 text-primary" />;
      case 'category_count':
        return <BookOpen className="h-8 w-8 text-primary" />;
      case 'visit_count':
        return <Zap className="h-8 w-8 text-primary" />;
      case 'special':
        return <Sparkles className="h-8 w-8 text-primary" />;
      default:
        return <Award className="h-8 w-8 text-primary" />;
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost" 
          size="icon"
          onClick={() => setIsOpen(true)}
          className="relative"
          data-achievements-sheet="true"
        >
          <Trophy className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Achievements</span>
          {achievements?.some(a => a.unlockedAt && new Date(a.unlockedAt).getTime() > Date.now() - 86400000) && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </SheetTitle>
          <SheetDescription>
            Track your progress and unlock rewards
          </SheetDescription>
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnlocked(!showUnlocked)}
            >
              {showUnlocked ? 'Hide Unlocked' : 'Show All'}
            </Button>
          </div>
        </SheetHeader>
        
        <div className="space-y-4 mt-4">
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-3/4 mt-2" />
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </>
          )}
          
          {isError && (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load achievements</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {!isLoading && !isError && filteredAchievements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No achievements to display</p>
            </div>
          )}
          
          {filteredAchievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={cn(
                "border border-border transition-all duration-300",
                achievement.isUnlocked && "border-primary/20 bg-primary/5"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon(achievement.achievement.type, achievement.isUnlocked)}
                    <CardTitle className={cn(
                      "text-lg font-medium",
                      !achievement.isUnlocked && "text-muted-foreground"
                    )}>
                      {achievement.achievement.name}
                    </CardTitle>
                  </div>
                  {achievement.isUnlocked && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Unlocked
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {achievement.achievement.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress: {achievement.progress} / {achievement.achievement.threshold}</span>
                  <span>{achievement.percentComplete}%</span>
                </div>
                <Progress 
                  value={achievement.percentComplete} 
                  className={cn(
                    "h-2",
                    achievement.isUnlocked && "bg-primary/20"
                  )}
                />
              </CardContent>
              {achievement.isUnlocked && achievement.achievement.reward && (
                <CardFooter className="pt-0 pb-3">
                  <div className="text-sm">
                    <span className="font-semibold text-primary">Reward:</span> {achievement.achievement.reward}
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}