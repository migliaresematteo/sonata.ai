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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Trophy,
  Medal,
  Search,
  Music,
  Clock,
  UserPlus,
  Filter,
  ArrowUpDown,
  Crown,
  Star,
} from "lucide-react";

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url: string;
  level: number;
  xp: number;
  instrument: string;
  experience_level: string;
  profile_color?: string;
  profile_icon?: string;
  rank?: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(
    [],
  );
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInstrument, setFilterInstrument] = useState("all");
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"level" | "xp">("level");

  useEffect(() => {
    fetchLeaderboardData();
  }, [user]);

  useEffect(() => {
    // Apply filters and search
    let filtered = [...leaderboardUsers];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((user) =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply instrument filter
    if (filterInstrument !== "all") {
      filtered = filtered.filter(
        (user) =>
          user.instrument?.toLowerCase() === filterInstrument.toLowerCase(),
      );
    }

    setFilteredUsers(filtered);
  }, [leaderboardUsers, searchQuery, filterInstrument]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // Fetch top 100 users by level and XP
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, level, xp, instrument, experience_level, profile_color, profile_icon",
        )
        .order(sortBy === "level" ? "level" : "xp", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Add rank to each user
      const rankedUsers =
        data?.map((userData, index) => ({
          ...userData,
          rank: index + 1,
          isCurrentUser: userData.id === user?.id,
        })) || [];

      setLeaderboardUsers(rankedUsers);
      setFilteredUsers(rankedUsers);

      // Find current user's rank
      const currentUser = rankedUsers.find((u) => u.id === user?.id);
      if (currentUser) {
        setCurrentUserRank(currentUser.rank);
      } else {
        // If user is not in top 100, fetch their rank separately
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("level, xp")
          .eq("id", user?.id)
          .single();

        if (!userError && userData) {
          // Count how many users have higher level/xp
          const { count, error: countError } = await supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .gt(sortBy === "level" ? "level" : "xp", userData[sortBy]);

          if (!countError) {
            setCurrentUserRank((count || 0) + 1);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy: "level" | "xp") => {
    setSortBy(newSortBy);
    // Re-fetch with new sorting
    fetchLeaderboardData();
  };

  const sendConnectionRequest = async (userId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      // Check if connection already exists
      const { data: existingConnection, error: checkError } = await supabase
        .from("user_connections")
        .select("id, status")
        .or(
          `and(user_id.eq.${user.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${user.id})`,
        )
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingConnection) {
        toast({
          title: "Connection exists",
          description: `Connection already ${existingConnection.status}`,
          variant: "default",
        });
        return;
      }

      // Create new connection request
      const { error } = await supabase.from("user_connections").insert({
        user_id: user.id,
        connected_user_id: userId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "Connection request sent successfully",
      });
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const viewUserProfile = (userId: string) => {
    // In a real app, this would navigate to the user's profile
    // For now, we'll just show a toast
    toast({
      title: "View profile",
      description: `Viewing user profile ${userId}`,
    });
  };

  // List of instruments for filtering
  const instruments = [
    "all",
    "piano",
    "violin",
    "cello",
    "flute",
    "clarinet",
    "guitar",
    "voice",
  ];

  // Get medal for top 3 ranks
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return null;
  };

  // Get background color for rank rows
  const getRankRowClass = (rank: number, isCurrentUser: boolean = false) => {
    if (isCurrentUser) return "bg-indigo-50 dark:bg-indigo-950/30";
    if (rank === 1) return "bg-yellow-50 dark:bg-yellow-950/30";
    if (rank === 2) return "bg-gray-50 dark:bg-gray-800/30";
    if (rank === 3) return "bg-amber-50 dark:bg-amber-950/30";
    return "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Leaderboard" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading leaderboard data...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Leaderboard" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-amber-500" /> Leaderboard
                </h1>
                <p className="text-muted-foreground">
                  Top 100 musicians ranked by level and experience
                </p>
              </div>

              {currentUserRank && (
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-950/50 dark:to-purple-950/50 dark:border-indigo-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-full p-2">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Your Rank</p>
                        <p className="text-2xl font-bold">{currentUserRank}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={filterInstrument}
                        onChange={(e) => setFilterInstrument(e.target.value)}
                      >
                        {instruments.map((instrument) => (
                          <option key={instrument} value={instrument}>
                            {instrument.charAt(0).toUpperCase() +
                              instrument.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === "level" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSortChange("level")}
                      className="flex items-center gap-1"
                    >
                      <Trophy className="h-4 w-4" />
                      Sort by Level
                    </Button>
                    <Button
                      variant={sortBy === "xp" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSortChange("xp")}
                      className="flex items-center gap-1"
                    >
                      <Star className="h-4 w-4" />
                      Sort by XP
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-white dark:bg-gray-950 rounded-lg border shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Rank
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Musician
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Level
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        XP
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Instrument
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((leaderboardUser) => (
                        <tr
                          key={leaderboardUser.id}
                          className={`border-b hover:bg-muted/30 ${getRankRowClass(leaderboardUser.rank || 0, leaderboardUser.isCurrentUser)}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">
                                {leaderboardUser.rank}
                              </span>
                              {getMedalIcon(leaderboardUser.rank || 0)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`relative rounded-full overflow-hidden ${leaderboardUser.profile_color ? `bg-${leaderboardUser.profile_color}-100` : ""}`}
                                style={
                                  leaderboardUser.profile_color
                                    ? {
                                        backgroundColor: `var(--${leaderboardUser.profile_color}-100)`,
                                      }
                                    : {}
                                }
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={leaderboardUser.avatar_url}
                                  />
                                  <AvatarFallback>
                                    {leaderboardUser.full_name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                {leaderboardUser.profile_icon && (
                                  <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-0.5 border-2 border-background">
                                    {/* Render icon based on profile_icon value */}
                                    {leaderboardUser.profile_icon ===
                                      "music" && (
                                      <Music className="h-3 w-3 text-indigo-500" />
                                    )}
                                    {leaderboardUser.profile_icon ===
                                      "star" && (
                                      <Star className="h-3 w-3 text-amber-500" />
                                    )}
                                    {leaderboardUser.profile_icon ===
                                      "trophy" && (
                                      <Trophy className="h-3 w-3 text-yellow-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {leaderboardUser.full_name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {leaderboardUser.experience_level ||
                                    "Musician"}
                                </p>
                              </div>
                              {leaderboardUser.isCurrentUser && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-bold">
                                {leaderboardUser.level}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500" />
                              <span>{leaderboardUser.xp}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 capitalize">
                            {leaderboardUser.instrument || "Not specified"}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  viewUserProfile(leaderboardUser.id)
                                }
                              >
                                View
                              </Button>
                              {!leaderboardUser.isCurrentUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    sendConnectionRequest(leaderboardUser.id)
                                  }
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Connect
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {searchQuery || filterInstrument !== "all"
                            ? "No musicians found matching your filters"
                            : "No musicians found in the leaderboard"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
