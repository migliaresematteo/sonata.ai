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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  Calendar,
  Clock,
  Edit,
  Music,
  Save,
  User,
  Trophy,
  Star,
  Image,
  Palette,
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  bio: string;
  instrument: string;
  experience_level: string;
  avatar_url: string;
  xp?: number;
  level?: number;
  discord_username?: string;
  telegram_username?: string;
  instagram_username?: string;
  youtube_channel?: string;
  profile_color?: string;
  profile_icon?: string;
  profile_banner?: string;
}

interface UserAchievement {
  id: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
  };
  earned_at: string;
}

interface UserPiece {
  id: string;
  status: string;
  progress: number;
  started_at: string;
  mastered_at: string | null;
  piece: {
    id: string;
    title: string;
    composer: string;
    instrument: string;
    difficulty: number;
  };
}

interface PracticeSession {
  id: string;
  duration: number;
  created_at: string;
  rating: number;
  notes: string;
  piece: {
    id: string;
    title: string;
    composer: string;
  };
}

interface PracticeStreak {
  current_streak: number;
  longest_streak: number;
  last_practice_date: string;
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [pieces, setPieces] = useState<UserPiece[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [streak, setStreak] = useState<PracticeStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<{
    full_name: string;
    bio: string;
    instrument: string;
    experience_level: string;
    discord_username?: string;
    telegram_username?: string;
    instagram_username?: string;
    youtube_channel?: string;
    profile_color?: string;
    profile_icon?: string;
    profile_banner?: string;
  }>({ full_name: "", bio: "", instrument: "", experience_level: "" });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        // If profile doesn't exist, create a default one
        if (!profileData) {
          // Generate random profile color and icon for new users
          const colors = [
            "indigo",
            "purple",
            "blue",
            "green",
            "amber",
            "red",
            "pink",
          ];
          const icons = ["music", "star", "trophy"];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const randomIcon = icons[Math.floor(Math.random() * icons.length)];

          const defaultProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || "",
            bio: "",
            instrument: "",
            experience_level: "beginner",
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
            xp: 0,
            level: 1,
            profile_color: randomColor,
            profile_icon: randomIcon,
          };

          const { error: insertError } = await supabase
            .from("profiles")
            .insert(defaultProfile);

          if (insertError) throw insertError;
          setProfile(defaultProfile);
          setUserXp(defaultProfile.xp || 0);
          setUserLevel(defaultProfile.level || 1);
          setXpToNextLevel(calculateXpForNextLevel(defaultProfile.level || 1));
          setEditedProfile({
            full_name: defaultProfile.full_name,
            bio: defaultProfile.bio,
            instrument: defaultProfile.instrument,
            experience_level: defaultProfile.experience_level,
            discord_username: defaultProfile.discord_username,
            telegram_username: defaultProfile.telegram_username,
            instagram_username: defaultProfile.instagram_username,
            youtube_channel: defaultProfile.youtube_channel,
            profile_color: defaultProfile.profile_color,
            profile_icon: defaultProfile.profile_icon,
            profile_banner: defaultProfile.profile_banner,
          });
        } else {
          setProfile(profileData);
          setUserXp(profileData.xp || 0);
          setUserLevel(profileData.level || 1);
          setXpToNextLevel(calculateXpForNextLevel(profileData.level || 1));
          setEditedProfile({
            full_name: profileData.full_name,
            bio: profileData.bio,
            instrument: profileData.instrument,
            experience_level: profileData.experience_level,
            discord_username: profileData.discord_username,
            telegram_username: profileData.telegram_username,
            instagram_username: profileData.instagram_username,
            youtube_channel: profileData.youtube_channel,
            profile_color: profileData.profile_color,
            profile_icon: profileData.profile_icon,
            profile_banner: profileData.profile_banner,
          });
        }

        // Fetch user achievements
        const { data: achievementsData, error: achievementsError } =
          await supabase
            .from("user_achievements")
            .select(
              `
            id,
            earned_at,
            achievement:achievement_id (id, name, description, icon, points)
          `,
            )
            .eq("user_id", user.id);

        if (achievementsError) throw achievementsError;
        setAchievements(achievementsData || []);

        // Fetch user pieces
        const { data: piecesData, error: piecesError } = await supabase
          .from("user_pieces")
          .select(
            `
            id,
            status,
            progress,
            started_at,
            mastered_at,
            piece:piece_id (id, title, composer, instrument, difficulty)
          `,
          )
          .eq("user_id", user.id);

        if (piecesError) throw piecesError;
        setPieces(piecesData || []);

        // Fetch practice sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("practice_sessions")
          .select(
            `
            id,
            duration,
            created_at,
            rating,
            notes,
            piece:piece_id (id, title, composer)
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);

        // Fetch practice streak
        const { data: streakData, error: streakError } = await supabase
          .from("practice_streaks")
          .select("current_streak, longest_streak, last_practice_date")
          .eq("user_id", user.id)
          .single();

        if (streakError && streakError.code !== "PGRST116") {
          throw streakError;
        }

        setStreak(
          streakData || {
            current_streak: 0,
            longest_streak: 0,
            last_practice_date: null,
          },
        );
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const calculateXpForNextLevel = (level: number): number => {
    // Simple formula: each level requires 100 * level XP
    return 100 * level;
  };

  const handleSaveProfile = async () => {
    try {
      console.log("Updating profile for user ID:", user?.id);

      // Create update object with only defined values
      const updateData = {
        full_name: editedProfile.full_name || "",
        bio: editedProfile.bio || "",
        instrument: editedProfile.instrument || "",
        experience_level: editedProfile.experience_level || "beginner",
        discord_username: editedProfile.discord_username,
        telegram_username: editedProfile.telegram_username,
        instagram_username: editedProfile.instagram_username,
        youtube_channel: editedProfile.youtube_channel,
        profile_color: editedProfile.profile_color,
        profile_icon: editedProfile.profile_icon,
        profile_banner: editedProfile.profile_banner,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user?.id);

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      // Update local state with the same data we sent to the server
      setProfile({
        ...profile!,
        ...updateData,
      });

      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Failed to update profile: ${error.message || "Unknown error"}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalPracticeTime = () => {
    return sessions.reduce((total, session) => total + session.duration, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Profile" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading profile...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Profile" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card
                className="md:col-span-1 overflow-hidden"
                style={
                  profile?.profile_color
                    ? {
                        borderColor: `var(--${profile.profile_color}-200)`,
                        background: `linear-gradient(to bottom, var(--${profile.profile_color}-50), transparent)`,
                      }
                    : {}
                }
              >
                {profile?.profile_banner && (
                  <div className="h-24 w-full overflow-hidden">
                    <img
                      src={profile.profile_banner}
                      alt="Profile banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-500" /> Level{" "}
                          {userLevel}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {userXp} / {xpToNextLevel} XP
                        </span>
                      </div>
                      <Progress
                        value={(userXp / xpToNextLevel) * 100}
                        className="h-2"
                      />
                    </div>
                    {!editing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-4"
                        onClick={() => setEditing(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div
                        className="rounded-full p-1"
                        style={
                          profile?.profile_color
                            ? {
                                background: `var(--${profile.profile_color}-200)`,
                              }
                            : {}
                        }
                      >
                        <Avatar className="h-24 w-24 mb-4 border-4 border-white dark:border-gray-800">
                          <AvatarImage
                            src={profile?.avatar_url}
                            alt={profile?.full_name}
                          />
                          <AvatarFallback>
                            <User className="h-12 w-12" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {profile?.profile_icon && (
                        <div className="absolute bottom-4 right-0 bg-white dark:bg-gray-800 rounded-full p-1 border-2 border-background">
                          {profile.profile_icon === "music" && (
                            <Music className="h-5 w-5 text-indigo-500" />
                          )}
                          {profile.profile_icon === "star" && (
                            <Star className="h-5 w-5 text-amber-500" />
                          )}
                          {profile.profile_icon === "trophy" && (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {editing ? (
                      <div className="w-full space-y-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={editedProfile.full_name}
                            onChange={(e) =>
                              setEditedProfile({
                                ...editedProfile,
                                full_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="instrument">Primary Instrument</Label>
                          <Input
                            id="instrument"
                            value={editedProfile.instrument}
                            onChange={(e) =>
                              setEditedProfile({
                                ...editedProfile,
                                instrument: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="experienceLevel">
                            Experience Level
                          </Label>
                          <select
                            id="experienceLevel"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={editedProfile.experience_level}
                            onChange={(e) =>
                              setEditedProfile({
                                ...editedProfile,
                                experience_level: e.target.value,
                              })
                            }
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="professional">Professional</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editedProfile.bio}
                            onChange={(e) =>
                              setEditedProfile({
                                ...editedProfile,
                                bio: e.target.value,
                              })
                            }
                            rows={4}
                          />
                        </div>

                        <Separator className="my-4" />

                        <h3 className="text-lg font-medium mb-2">
                          Profile Customization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div>
                            <Label htmlFor="profileColor">Profile Color</Label>
                            <select
                              id="profileColor"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={editedProfile.profile_color || ""}
                              onChange={(e) =>
                                setEditedProfile({
                                  ...editedProfile,
                                  profile_color: e.target.value,
                                })
                              }
                              style={{
                                color: editedProfile.profile_color
                                  ? `var(--${editedProfile.profile_color}-700)`
                                  : "inherit",
                              }}
                            >
                              <option value="">Default</option>
                              <option value="indigo">● Indigo</option>
                              <option value="purple">● Purple</option>
                              <option value="blue">● Blue</option>
                              <option value="green">● Green</option>
                              <option value="amber">● Amber</option>
                              <option value="red">● Red</option>
                              <option value="pink">● Pink</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="profileIcon">Profile Icon</Label>
                            <select
                              id="profileIcon"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={editedProfile.profile_icon || ""}
                              onChange={(e) =>
                                setEditedProfile({
                                  ...editedProfile,
                                  profile_icon: e.target.value,
                                })
                              }
                            >
                              <option value="">None</option>
                              <option value="music">Music</option>
                              <option value="star">Star</option>
                              <option value="trophy">Trophy</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-6">
                          <Label htmlFor="profileBanner">
                            Profile Banner URL
                          </Label>
                          <Input
                            id="profileBanner"
                            placeholder="https://example.com/banner.jpg"
                            value={editedProfile.profile_banner || ""}
                            onChange={(e) =>
                              setEditedProfile({
                                ...editedProfile,
                                profile_banner: e.target.value,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter a URL for your profile banner image
                          </p>
                        </div>

                        <Separator className="my-4" />

                        <h3 className="text-lg font-medium mb-2">
                          Social Media Links
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="discord">Discord Username</Label>
                            <Input
                              id="discord"
                              placeholder="username#0000"
                              value={editedProfile.discord_username || ""}
                              onChange={(e) =>
                                setEditedProfile({
                                  ...editedProfile,
                                  discord_username: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="telegram">Telegram Username</Label>
                            <Input
                              id="telegram"
                              placeholder="@username"
                              value={editedProfile.telegram_username || ""}
                              onChange={(e) =>
                                setEditedProfile({
                                  ...editedProfile,
                                  telegram_username: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="instagram">
                              Instagram Username
                            </Label>
                            <Input
                              id="instagram"
                              placeholder="@username"
                              value={editedProfile.instagram_username || ""}
                              onChange={(e) =>
                                setEditedProfile({
                                  ...editedProfile,
                                  instagram_username: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="youtube">YouTube Channel</Label>
                            <Input
                              id="youtube"
                              placeholder="channel name or URL"
                              value={editedProfile.youtube_channel || ""}
                              onChange={(e) =>
                                setEditedProfile({
                                  ...editedProfile,
                                  youtube_channel: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-xl text-center">
                          {profile?.full_name}
                        </CardTitle>
                        <CardDescription className="text-center">
                          {user?.email}
                        </CardDescription>

                        {profile?.instrument && (
                          <Badge className="mt-2" variant="outline">
                            <Music className="h-3 w-3 mr-1" />
                            {profile.instrument}
                          </Badge>
                        )}

                        {profile?.experience_level && (
                          <Badge
                            className="mt-2 capitalize"
                            variant="secondary"
                          >
                            {profile.experience_level}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {!editing && (
                    <>
                      {profile?.bio ? (
                        <p className="text-sm text-muted-foreground">
                          {profile.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center italic">
                          No bio provided. Click the edit button to add one.
                        </p>
                      )}

                      <Separator className="my-6" />

                      {/* Social Media Links */}
                      {(profile?.discord_username ||
                        profile?.telegram_username ||
                        profile?.instagram_username ||
                        profile?.youtube_channel) && (
                        <>
                          <h3 className="text-sm font-medium mb-3">
                            Connect with me
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {profile.discord_username && (
                              <a
                                href={`https://discord.com/users/${profile.discord_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium hover:bg-indigo-200 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M8 12h8" />
                                  <path d="M12 8v8" />
                                </svg>
                                Discord
                              </a>
                            )}
                            {profile.telegram_username && (
                              <a
                                href={`https://t.me/${profile.telegram_username.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="m22 2-7 20-4-9-9-4Z" />
                                  <path d="M22 2 11 13" />
                                </svg>
                                Telegram
                              </a>
                            )}
                            {profile.instagram_username && (
                              <a
                                href={`https://instagram.com/${profile.instagram_username.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 text-pink-800 text-xs font-medium hover:bg-pink-200 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    width="20"
                                    height="20"
                                    x="2"
                                    y="2"
                                    rx="5"
                                    ry="5"
                                  />
                                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                  <line
                                    x1="17.5"
                                    x2="17.51"
                                    y1="6.5"
                                    y2="6.5"
                                  />
                                </svg>
                                Instagram
                              </a>
                            )}
                            {profile.youtube_channel && (
                              <a
                                href={
                                  profile.youtube_channel.startsWith("http")
                                    ? profile.youtube_channel
                                    : `https://youtube.com/c/${profile.youtube_channel}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-medium hover:bg-red-200 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                                  <path d="m10 15 5-3-5-3z" />
                                </svg>
                                YouTube
                              </a>
                            )}
                          </div>
                        </>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Award className="h-5 w-5 mr-2 text-amber-500" />
                            <span>Achievements</span>
                          </div>
                          <Badge variant="outline">{achievements.length}</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Music className="h-5 w-5 mr-2 text-blue-500" />
                            <span>Pieces in Repertoire</span>
                          </div>
                          <Badge variant="outline">{pieces.length}</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-green-500" />
                            <span>Practice Sessions</span>
                          </div>
                          <Badge variant="outline">{sessions.length}</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-purple-500" />
                            <span>Total Practice Time</span>
                          </div>
                          <Badge variant="outline">
                            {formatDuration(getTotalPracticeTime())}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* Practice Streak Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Practice Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-bold">
                          {streak?.current_streak || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current Streak
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          {streak?.longest_streak || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Longest Streak
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          {streak?.last_practice_date
                            ? formatDate(streak.last_practice_date)
                            : "Never"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last Practice
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for Repertoire, Achievements, and Practice History */}
                <Tabs defaultValue="repertoire">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="repertoire">Repertoire</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="practice">Practice History</TabsTrigger>
                  </TabsList>

                  {/* Repertoire Tab */}
                  <TabsContent value="repertoire" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {pieces.length === 0 ? (
                        <div className="col-span-2 text-center py-12">
                          <p className="text-muted-foreground">
                            No pieces in your repertoire yet.
                          </p>
                          <Button
                            className="mt-4"
                            onClick={() => navigate("/discover")}
                          >
                            Discover Pieces
                          </Button>
                        </div>
                      ) : (
                        pieces.map((userPiece) => (
                          <Card key={userPiece.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {userPiece.piece.title}
                                  </CardTitle>
                                  <CardDescription>
                                    {userPiece.piece.composer}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    userPiece.status === "current"
                                      ? "default"
                                      : userPiece.status === "mastered"
                                        ? "success"
                                        : "secondary"
                                  }
                                  className="capitalize"
                                >
                                  {userPiece.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Progress</span>
                                  <span>{userPiece.progress}%</span>
                                </div>
                                <Progress
                                  value={userPiece.progress}
                                  className="h-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    Started: {formatDate(userPiece.started_at)}
                                  </span>
                                  {userPiece.mastered_at && (
                                    <span>
                                      Mastered:{" "}
                                      {formatDate(userPiece.mastered_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Achievements Tab */}
                  <TabsContent value="achievements" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {achievements.length === 0 ? (
                        <div className="col-span-2 text-center py-12">
                          <p className="text-muted-foreground">
                            No achievements earned yet.
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Complete challenges and practice regularly to earn
                            achievements.
                          </p>
                        </div>
                      ) : (
                        achievements.map((achievement) => (
                          <Card key={achievement.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center">
                                <div className="mr-4 text-amber-500">
                                  <Award className="h-8 w-8" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">
                                    {achievement.achievement.name}
                                  </CardTitle>
                                  <CardDescription>
                                    Earned on{" "}
                                    {formatDate(achievement.earned_at)}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {achievement.achievement.description}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {achievement.achievement.points} points
                              </Badge>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Practice History Tab */}
                  <TabsContent value="practice" className="space-y-4">
                    <div className="space-y-4 mt-4">
                      {sessions.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">
                            No practice sessions recorded yet.
                          </p>
                          <Button
                            className="mt-4"
                            onClick={() => navigate("/repertoire")}
                          >
                            View Repertoire
                          </Button>
                        </div>
                      ) : (
                        sessions.map((session) => (
                          <Card key={session.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {session.piece.title}
                                  </CardTitle>
                                  <CardDescription>
                                    {session.piece.composer}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline">
                                  {formatDuration(session.duration)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between text-sm mb-2">
                                <span>{formatDate(session.created_at)}</span>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={
                                        i < session.rating
                                          ? "text-amber-500"
                                          : "text-gray-300"
                                      }
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {session.notes && (
                                <p className="text-sm text-muted-foreground">
                                  {session.notes}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
