import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Calendar,
  Star,
  Clock,
  CheckCircle,
  RotateCcw,
  Music,
  BookOpen,
  Timer,
} from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  xpReward: number;
  deadline?: string;
  isCompleted: boolean;
  category: "daily" | "weekly" | "monthly";
  type: "practice" | "repertoire" | "technique" | "performance";
}

export default function MissionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [userXp, setUserXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchUserData();
    fetchMissions();
  }, [user, navigate]);

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
      const mockMissions: Mission[] = [
        {
          id: "1",
          title: "Practice for 30 minutes",
          description:
            "Complete a focused practice session of at least 30 minutes",
          progress: 75,
          xpReward: 50,
          deadline: "Today",
          isCompleted: false,
          category: "daily",
          type: "practice",
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
          category: "daily",
          type: "technique",
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
          category: "daily",
          type: "practice",
        },
        {
          id: "4",
          title: "Complete 5 practice sessions",
          description: "Practice consistently throughout the week",
          progress: 60,
          xpReward: 100,
          deadline: "5 days left",
          isCompleted: false,
          category: "weekly",
          type: "practice",
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
          category: "weekly",
          type: "repertoire",
        },
        {
          id: "6",
          title: "Practice scales in all keys",
          description: "Work through major and minor scales in all 12 keys",
          progress: 25,
          xpReward: 80,
          deadline: "3 days left",
          isCompleted: false,
          category: "weekly",
          type: "technique",
        },
        {
          id: "7",
          title: "Complete a month-long practice streak",
          description: "Practice every day for a full month",
          progress: 80,
          xpReward: 500,
          deadline: "6 days left",
          isCompleted: false,
          category: "monthly",
          type: "practice",
        },
        {
          id: "8",
          title: "Perform for friends or family",
          description: "Give a small performance of your current repertoire",
          progress: 0,
          xpReward: 200,
          deadline: "25 days left",
          isCompleted: false,
          category: "monthly",
          type: "performance",
        },
        {
          id: "9",
          title: "Master a complete piece",
          description: "Fully learn and polish a piece in your repertoire",
          progress: 45,
          xpReward: 300,
          deadline: "18 days left",
          isCompleted: false,
          category: "monthly",
          type: "repertoire",
        },
      ];

      setMissions(mockMissions);
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
      // Update mission status
      setMissions((prev) =>
        prev.map((mission) =>
          mission.id === missionId
            ? { ...mission, isCompleted: true }
            : mission,
        ),
      );

      // Add XP to user
      const newXp = userXp + xpReward;
      let newLevel = userLevel;

      // Check if user leveled up
      if (newXp >= xpToNextLevel) {
        newLevel += 1;
        // Show level up notification or animation here
        alert(`Congratulations! You've reached level ${newLevel}!`);
      }

      // Update user profile
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
    }
  };

  const refreshMissions = () => {
    fetchMissions();
  };

  const filteredMissions = missions.filter((mission) => {
    if (activeTab === "all") return true;
    if (activeTab === "daily") return mission.category === "daily";
    if (activeTab === "weekly") return mission.category === "weekly";
    if (activeTab === "monthly") return mission.category === "monthly";
    if (activeTab === "practice") return mission.type === "practice";
    if (activeTab === "technique") return mission.type === "technique";
    if (activeTab === "repertoire") return mission.type === "repertoire";
    if (activeTab === "performance") return mission.type === "performance";
    return true;
  });

  const getMissionTypeIcon = (type: string) => {
    switch (type) {
      case "practice":
        return <Timer className="h-4 w-4 text-blue-500" />;
      case "technique":
        return <Music className="h-4 w-4 text-purple-500" />;
      case "repertoire":
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case "performance":
        return <Star className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMissionCategoryBadge = (category: string) => {
    switch (category) {
      case "daily":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Daily
          </Badge>
        );
      case "weekly":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Weekly
          </Badge>
        );
      case "monthly":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            Monthly
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Missions" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading missions...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Missions" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Missions</h1>
                <p className="text-muted-foreground">
                  Complete missions to earn XP and level up
                </p>
              </div>
              <Card className="w-full md:w-auto">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        Level
                      </span>
                      <span className="text-2xl font-bold flex items-center gap-1">
                        <Trophy className="h-5 w-5 text-amber-500" />{" "}
                        {userLevel}
                      </span>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <div className="flex justify-between text-sm mb-1">
                        <span>XP Progress</span>
                        <span>
                          {userXp} / {xpToNextLevel}
                        </span>
                      </div>
                      <Progress
                        value={(userXp / xpToNextLevel) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMissions}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Refresh
                </Button>
              </div>

              <TabsList className="mb-6">
                <TabsTrigger
                  value="practice"
                  className="flex items-center gap-1"
                >
                  <Timer className="h-4 w-4" /> Practice
                </TabsTrigger>
                <TabsTrigger
                  value="technique"
                  className="flex items-center gap-1"
                >
                  <Music className="h-4 w-4" /> Technique
                </TabsTrigger>
                <TabsTrigger
                  value="repertoire"
                  className="flex items-center gap-1"
                >
                  <BookOpen className="h-4 w-4" /> Repertoire
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="flex items-center gap-1"
                >
                  <Star className="h-4 w-4" /> Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No missions found matching your criteria
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* These TabsContent components will show the same content but filtered */}
              <TabsContent value="daily" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Content will be filtered by the filteredMissions variable */}
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No daily missions available
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Repeat similar structure for weekly, monthly, and type-based tabs */}
              <TabsContent value="weekly" className="mt-0">
                {/* Similar content structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No weekly missions available
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        {/* Same card structure as above */}
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Remaining tab contents follow the same pattern */}
              <TabsContent value="monthly" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No monthly missions available
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Type-based tabs */}
              <TabsContent value="practice" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No practice missions available
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="technique" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No technique missions available
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="repertoire" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No repertoire missions available
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMissions.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-muted-foreground">
                        No performance missions available
                      </p>
                    </div>
                  ) : (
                    filteredMissions.map((mission) => (
                      <Card key={mission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getMissionTypeIcon(mission.type)}
                              <CardTitle className="text-base">
                                {mission.title}
                              </CardTitle>
                            </div>
                            {getMissionCategoryBadge(mission.category)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {mission.description}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {mission.progress}%</span>
                              <span className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />{" "}
                                {mission.deadline}
                              </span>
                            </div>
                            <Progress
                              value={mission.progress}
                              className="h-2"
                            />
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700"
                            >
                              <Star className="h-3 w-3 mr-1" />{" "}
                              {mission.xpReward} XP
                            </Badge>

                            {mission.isCompleted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : mission.progress === 100 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteMission(
                                    mission.id,
                                    mission.xpReward,
                                  )
                                }
                              >
                                Claim Reward
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
