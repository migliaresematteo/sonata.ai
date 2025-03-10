import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Star } from "lucide-react";

interface MissionProps {
  title: string;
  description: string;
  progress: number;
  xpReward: number;
  deadline?: string;
  isCompleted?: boolean;
  onComplete?: () => void;
}

export default function MissionItem({
  title,
  description,
  progress,
  xpReward,
  deadline,
  isCompleted = false,
  onComplete,
}: MissionProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`p-3 rounded-lg transition-all w-full ${isCompleted ? "bg-green-50" : isHovered ? "bg-muted/80" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-sm font-medium flex items-center gap-1">
          {isCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
          {title}
        </h4>
        <Badge variant="outline" className="text-xs py-0 h-5">
          <Star className="h-3 w-3 mr-1 text-amber-500" />
          {xpReward} XP
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{progress}%</span>
          {deadline && (
            <span className="flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" /> {deadline}
            </span>
          )}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
      {progress === 100 && !isCompleted && onComplete && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 h-7 text-xs"
          onClick={onComplete}
        >
          Claim Reward
        </Button>
      )}
    </div>
  );
}
