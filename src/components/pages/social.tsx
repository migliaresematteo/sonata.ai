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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  User,
  UserPlus,
  Users,
  Search,
  Music,
  Trophy,
  Clock,
  CheckCircle,
  X,
  UserCheck,
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
}

interface Connection {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  user: UserProfile;
}

export default function SocialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchConnections();
  }, [user, navigate]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      // Fetch accepted connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("user_connections")
        .select(
          `
          id,
          status,
          created_at,
          user:connected_user_id (id, full_name, bio, instrument, experience_level, avatar_url, xp, level)
        `,
        )
        .eq("user_id", user?.id)
        .eq("status", "accepted");

      if (connectionsError) throw connectionsError;

      // Fetch pending requests (where other users have sent requests to this user)
      const { data: pendingData, error: pendingError } = await supabase
        .from("user_connections")
        .select(
          `
          id,
          status,
          created_at,
          user:user_id (id, full_name, bio, instrument, experience_level, avatar_url, xp, level)
        `,
        )
        .eq("connected_user_id", user?.id)
        .eq("status", "pending");

      if (pendingError) throw pendingError;

      setConnections(connectionsData || []);
      setPendingRequests(pendingData || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, bio, instrument, experience_level, avatar_url, xp, level",
        )
        .ilike("full_name", `%${searchQuery}%`)
        .neq("id", user?.id) // Don't include current user
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      // Check if connection already exists
      const { data: existingConnection, error: checkError } = await supabase
        .from("user_connections")
        .select("id, status")
        .or(
          `and(user_id.eq.${user?.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${user?.id})`,
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
        user_id: user?.id,
        connected_user_id: userId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "Connection request sent successfully",
      });

      // Update search results to show pending status
      setSearchResults((prev) =>
        prev.map((result) =>
          result.id === userId
            ? { ...result, connectionStatus: "pending" }
            : result,
        ),
      );
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const handleConnectionRequest = async (
    connectionId: string,
    accept: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("user_connections")
        .update({
          status: accept ? "accepted" : "rejected",
        })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: accept ? "Request accepted" : "Request rejected",
        description: accept
          ? "You are now connected"
          : "Connection request rejected",
      });

      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error("Error handling connection request:", error);
      toast({
        title: "Error",
        description: "Failed to process request",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Social" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading social connections...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Social" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Social</h1>
                <p className="text-muted-foreground">
                  Connect with other musicians and see their progress
                </p>
              </div>
            </div>

            <Tabs defaultValue="connections" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger
                  value="connections"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Connections ({connections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Requests ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="find" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Find Musicians
                </TabsTrigger>
              </TabsList>

              {/* Connections Tab */}
              <TabsContent value="connections" className="space-y-6">
                {connections.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">
                        No connections yet
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">
                        Connect with other musicians to see their progress,
                        repertoire, and more.
                      </p>
                      <Button
                        onClick={() =>
                          document.querySelector('[data-value="find"]')?.click()
                        }
                      >
                        Find Musicians
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {connections.map((connection) => (
                      <Card key={connection.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={connection.user.avatar_url} />
                                <AvatarFallback>
                                  {connection.user.full_name?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">
                                  {connection.user.full_name}
                                </CardTitle>
                                <CardDescription>
                                  {connection.user.instrument || "Musician"}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {connection.user.experience_level || "Musician"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span className="text-sm">
                                Level {connection.user.level || 1}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {connection.user.xp || 0} XP
                            </span>
                          </div>
                          <Progress
                            value={(connection.user.xp || 0) % 100 || 0}
                            className="h-1.5 mb-4"
                          />
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {connection.user.bio || "No bio provided."}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => viewUserProfile(connection.user.id)}
                          >
                            View Profile
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                {pendingRequests.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">
                        No pending requests
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        When other musicians send you connection requests,
                        they'll appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={request.user.avatar_url} />
                              <AvatarFallback>
                                {request.user.full_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {request.user.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.user.instrument || "Musician"} ·{" "}
                                {request.user.experience_level || "Musician"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() =>
                                handleConnectionRequest(request.id, false)
                              }
                            >
                              <X className="h-4 w-4" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                handleConnectionRequest(request.id, true)
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Find Musicians Tab */}
              <TabsContent value="find" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Find Musicians</CardTitle>
                    <CardDescription>
                      Search for other musicians by name to connect with them
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                      </div>
                      <Button onClick={handleSearch} disabled={searchLoading}>
                        {searchLoading ? "Searching..." : "Search"}
                      </Button>
                    </div>

                    <div className="mt-6 space-y-4">
                      {searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <Card key={result.id}>
                            <CardContent className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={result.avatar_url} />
                                  <AvatarFallback>
                                    {result.full_name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {result.full_name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">
                                      {result.instrument || "Musician"}
                                    </p>
                                    {result.level && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs h-5"
                                      >
                                        Level {result.level}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant={
                                  result.connectionStatus === "pending"
                                    ? "outline"
                                    : "default"
                                }
                                className="gap-1"
                                onClick={() => sendConnectionRequest(result.id)}
                                disabled={result.connectionStatus === "pending"}
                              >
                                {result.connectionStatus === "pending" ? (
                                  <>
                                    <Clock className="h-4 w-4" />
                                    Pending
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4" />
                                    Connect
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      ) : searchQuery && !searchLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No musicians found matching "{searchQuery}"
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
