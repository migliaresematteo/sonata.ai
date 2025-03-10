import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Search, Filter, Calendar, Users, Award } from "lucide-react";

interface Piece {
  id: string;
  title: string;
  composer: string;
  period: string;
  difficulty: number;
  instrument: string;
  genre: string;
  description: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  goal_type: string;
  duration: number;
}

export default function Discover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [instrument, setInstrument] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch pieces
        const { data: piecesData, error: piecesError } = await supabase
          .from("pieces")
          .select("*")
          .order("title");

        if (piecesError) throw piecesError;
        setPieces(piecesData || []);

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .order("event_date");

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

        // Fetch challenges
        const { data: challengesData, error: challengesError } = await supabase
          .from("challenges")
          .select("*");

        if (challengesError) throw challengesError;
        setChallenges(challengesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const filteredPieces = pieces.filter((piece) => {
    const matchesSearch =
      piece.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.composer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesInstrument =
      instrument === "all" || piece.instrument === instrument;

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "beginner" && piece.difficulty <= 3) ||
      (activeFilter === "intermediate" &&
        piece.difficulty > 3 &&
        piece.difficulty <= 7) ||
      (activeFilter === "advanced" && piece.difficulty > 7);

    return matchesSearch && matchesInstrument && matchesFilter;
  });

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredChallenges = challenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addToRepertoire = async (pieceId: string, status: string) => {
    try {
      const { error } = await supabase.from("user_pieces").insert({
        user_id: user?.id,
        piece_id: pieceId,
        status,
        progress: status === "mastered" ? 100 : 0,
        started_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert(`Piece added to your ${status} list!`);
    } catch (error) {
      console.error("Error adding piece to repertoire:", error);
      alert("Failed to add piece to repertoire");
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase.from("user_challenges").insert({
        user_id: user?.id,
        challenge_id: challengeId,
        progress: 0,
        completed: false,
      });

      if (error) throw error;
      alert("You've joined the challenge!");
    } catch (error) {
      console.error("Error joining challenge:", error);
      alert("Failed to join challenge");
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("user_events").insert({
        user_id: user?.id,
        event_id: eventId,
      });

      if (error) throw error;
      alert("You've registered for the event!");
    } catch (error) {
      console.error("Error registering for event:", error);
      alert("Failed to register for event");
    }
  };

  const getDifficultyBadge = (difficulty: number) => {
    if (difficulty <= 3) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Beginner
        </Badge>
      );
    } else if (difficulty <= 7) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Intermediate
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Advanced
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Sample instruments for filter
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

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Discover" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Discover</h1>
                <p className="text-muted-foreground">
                  Find new pieces, events, and challenges
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="pieces" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="pieces" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Pieces
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="challenges"
                  className="flex items-center gap-2"
                >
                  <Award className="h-4 w-4" />
                  Challenges
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pieces" className="space-y-6">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Difficulty:</span>
                  </div>
                  <Button
                    variant={activeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      activeFilter === "beginner" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setActiveFilter("beginner")}
                    className="text-green-800"
                  >
                    Beginner
                  </Button>
                  <Button
                    variant={
                      activeFilter === "intermediate" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setActiveFilter("intermediate")}
                    className="text-yellow-800"
                  >
                    Intermediate
                  </Button>
                  <Button
                    variant={
                      activeFilter === "advanced" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setActiveFilter("advanced")}
                    className="text-red-800"
                  >
                    Advanced
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Instrument:</span>
                  </div>
                  {instruments.map((inst) => (
                    <Button
                      key={inst}
                      variant={instrument === inst ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInstrument(inst)}
                    >
                      {inst.charAt(0).toUpperCase() + inst.slice(1)}
                    </Button>
                  ))}
                </div>

                {loading ? (
                  <div className="text-center py-12">Loading pieces...</div>
                ) : filteredPieces.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No pieces found matching your criteria
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPieces.map((piece) => (
                      <Card key={piece.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">
                                {piece.title}
                              </CardTitle>
                              <p className="text-muted-foreground">
                                {piece.composer}
                              </p>
                            </div>
                            {getDifficultyBadge(piece.difficulty)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="secondary">
                              {piece.instrument}
                            </Badge>
                            {piece.period && (
                              <Badge variant="outline">{piece.period}</Badge>
                            )}
                            {piece.genre && (
                              <Badge variant="outline">{piece.genre}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {piece.description || "No description available."}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToRepertoire(piece.id, "current")}
                          >
                            Add to Current
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              addToRepertoire(piece.id, "wishlist")
                            }
                          >
                            Add to Wishlist
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">Loading events...</div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No events found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <Card key={event.id}>
                        <CardHeader>
                          <CardTitle>{event.title}</CardTitle>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(event.event_date)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                          {event.location && (
                            <div className="flex items-center text-sm">
                              <span className="font-medium mr-2">
                                Location:
                              </span>
                              {event.location}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={() => registerForEvent(event.id)}
                            className="w-full"
                          >
                            Register
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="challenges" className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">Loading challenges...</div>
                ) : filteredChallenges.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No challenges found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredChallenges.map((challenge) => (
                      <Card key={challenge.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle>{challenge.title}</CardTitle>
                            <Badge variant="secondary">
                              {challenge.goal_type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {challenge.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Goal:</span>
                            <span>
                              {challenge.goal} {challenge.goal_type}
                            </span>
                          </div>
                          {challenge.duration && (
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="font-medium">Duration:</span>
                              <span>{challenge.duration} days</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={() => joinChallenge(challenge.id)}
                            className="w-full"
                          >
                            Join Challenge
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
