import { useState, useEffect } from "react";
import { useAuth } from "../../../../supabase/auth";
import { supabase } from "../../../../supabase/supabase";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Star, RotateCcw } from "lucide-react";
import MissionItem from "./MissionItem";

interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  xpReward: number;
  deadline?: string;
  isCompleted: boolean;
}

export default function MissionsPanel() {
  const { user } = useAuth();
  const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<Mission[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [userXp, setUserXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchMissions();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile with XP and level
      const { data, error } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserLevel(data.level || 1);
        setUserXp(data.xp || 0);
        setXpToNextLevel(calculateXpForNextLevel(data.level || 1));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchMissions = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch missions from the database
      // For now, we'll use mock data
      const mockDailyMissions: Mission[] = [
        {
          id: "1",
          title: "Practice for 30 minutes",
          description:
            "Complete a focused practice session of at least 30 minutes",
          progress: 75,
          xpReward: 50,
          deadline: "Today",
          isCompleted: false,
        },
        {
          id: "2",
          title: "Master a difficult passage",
          description:
            "Work on and improve a challenging section of your current piece",
          progress: 100,
          xpReward: 30,
          deadline: "Today",
          isCompleted: false,
        },
        {
          id: "3",
          title: "Record your practice",
          description:
            "Make a recording of your practice session for self-assessment",
          progress: 0,
          xpReward: 20,
          deadline: "Today",
          isCompleted: false,
        },
      ];

      const mockWeeklyMissions: Mission[] = [
        {
          id: "4",
          title: "Complete 5 practice sessions",
          description: "Practice consistently throughout the week",
          progress: 60,
          xpReward: 100,
          deadline: "5 days left",
          isCompleted: false,
        },
        {
          id: "5",
          title: "Learn a new piece",
          description:
            "Add a new piece to your repertoire and start learning it",
          progress: 30,
          xpReward: 150,
          deadline: "5 days left",
          isCompleted: false,
        },
      ];

      setDailyMissions(mockDailyMissions);
      setWeeklyMissions(mockWeeklyMissions);
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateXpForNextLevel = (level: number): number => {
    // Simple formula: each level requires 100 * level XP
    return 100 * level;
  };

  const handleCompleteMission = async (missionId: string, xpReward: number) => {
    try {
      // First check if mission has already been completed to prevent multiple claims
      const { data: existingMission, error: checkError } = await supabase
        .from("user_missions")
        .select("id")
        .eq("user_id", user?.id)
        .eq("mission_id", missionId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // If mission already completed, don't allow claiming again
      if (existingMission) {
        alert("You've already claimed this reward!");
        return;
      }

      // Update mission status in local state
      if (
        missionId.startsWith("1") ||
        missionId.startsWith("2") ||
        missionId.startsWith("3")
      ) {
        setDailyMissions((prev) =>
          prev.map((mission) =>
            mission.id === missionId
              ? { ...mission, isCompleted: true, progress: 100 }
              : mission,
          ),
        );
      } else {
        setWeeklyMissions((prev) =>
          prev.map((mission) =>
            mission.id === missionId
              ? { ...mission, isCompleted: true, progress: 100 }
              : mission,
          ),
        );
      }

      // Add XP to user
      const newXp = userXp + xpReward;
      let newLevel = userLevel;

      // Check if user leveled up
      if (newXp >= xpToNextLevel) {
        newLevel += 1;
        // Show level up notification or animation here
        alert(`Congratulations! You've reached level ${newLevel}!`);
      }

      // Store completed mission in database FIRST to prevent duplicate claims
      const { error: missionError } = await supabase
        .from("user_missions")
        .insert({
          user_id: user?.id,
          mission_id: missionId,
          completed_at: new Date().toISOString(),
          xp_earned: xpReward,
        });

      if (missionError) {
        console.error("Error saving mission completion:", missionError);
        throw missionError;
      }

      // Update user profile in database
      const { error } = await supabase
        .from("profiles")
        .update({ xp: newXp, level: newLevel })
        .eq("id", user?.id);

      if (error) throw error;

      // Update local state
      setUserXp(newXp);
      setUserLevel(newLevel);
      setXpToNextLevel(calculateXpForNextLevel(newLevel));
    } catch (error) {
      console.error("Error completing mission:", error);
      alert("There was an error claiming your reward. Please try again.");
    }
  };

  const refreshMissions = () => {
    fetchMissions();
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Sign in to view missions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Level {userLevel}
          </h3>
          <span className="text-xs text-muted-foreground">
            {userXp} / {xpToNextLevel} XP
          </span>
        </div>
        <Progress value={(userXp / xpToNextLevel) * 100} className="h-2" />
      </div>

      <Separator />

      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" /> Daily Missions
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={refreshMissions}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading missions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyMissions.map((mission) => (
              <div className="w-full" key={mission.id}>
                <MissionItem
                  title={mission.title}
                  description={mission.description}
                  progress={mission.progress}
                  xpReward={mission.xpReward}
                  deadline={mission.deadline}
                  isCompleted={mission.isCompleted}
                  onComplete={() =>
                    handleCompleteMission(mission.id, mission.xpReward)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="px-4">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-amber-500" /> Weekly Missions
        </h3>

        {loading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading missions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weeklyMissions.map((mission) => (
              <div className="w-full" key={mission.id}>
                <MissionItem
                  title={mission.title}
                  description={mission.description}
                  progress={mission.progress}
                  xpReward={mission.xpReward}
                  deadline={mission.deadline}
                  isCompleted={mission.isCompleted}
                  onComplete={() =>
                    handleCompleteMission(mission.id, mission.xpReward)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
