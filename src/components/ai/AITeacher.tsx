import { useState, useRef, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Music,
  Lightbulb,
  Clock,
  RotateCcw,
} from "lucide-react";
import AIChat from "./AIChat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Piece {
  id: string;
  title: string;
  composer: string;
  instrument: string;
}

interface PracticeSession {
  id: string;
  duration: number;
  created_at: string;
  piece: {
    id: string;
    title: string;
    composer: string;
  };
}

export default function AITeacher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userPieces, setUserPieces] = useState<Piece[]>([]);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How can I improve my technique for Bach's Prelude in C Major?",
    "What practice routine would you recommend for a beginner violinist?",
    "Help me create a practice schedule for the next month",
    "What are some exercises to improve my finger dexterity?",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Add initial welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm your AI practice assistant. I can help you with practice techniques, provide feedback on your progress, and suggest exercises tailored to your skill level. What would you like help with today?",
          timestamp: new Date(),
        },
      ]);
    }

    // Fetch user's pieces and recent practice sessions
    const fetchUserData = async () => {
      try {
        // Fetch user's pieces
        const { data: piecesData, error: piecesError } = await supabase
          .from("user_pieces")
          .select(
            `
            piece:piece_id (id, title, composer, instrument)
          `,
          )
          .eq("user_id", user.id)
          .eq("status", "current");

        if (piecesError) throw piecesError;
        setUserPieces(piecesData?.map((item) => item.piece) || []);

        // Fetch recent practice sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("practice_sessions")
          .select(
            `
            id,
            duration,
            created_at,
            piece:piece_id (id, title, composer)
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (sessionsError) throw sessionsError;
        setRecentSessions(sessionsData || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user, navigate, messages.length]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // In a real app, this would call an AI API
    // For now, we'll simulate a response
    setTimeout(() => {
      const aiResponses = [
        "Based on your practice history, I recommend focusing on improving your finger technique. Try practicing scales slowly with a metronome, gradually increasing the tempo as you become more comfortable.",
        "I notice you've been working on Bach's pieces. For Baroque music, pay special attention to articulation and ornaments. Try practicing each hand separately before combining them.",
        "To improve your sight-reading skills, I recommend spending 10-15 minutes each day reading through new pieces at a comfortable tempo. Don't worry about mistakes - the goal is to keep going and train your eyes to look ahead.",
        "For your current repertoire, I suggest dividing each piece into smaller sections and practicing them intensively. Focus on one section per day, and review previously mastered sections regularly.",
        "Based on your progress, you might be ready to tackle more challenging pieces. Consider adding some Chopin or Debussy to your repertoire to develop different aspects of your technique.",
      ];

      const randomResponse =
        aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
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
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="AI Teacher" />
        <main className="flex-1 overflow-hidden p-6 flex">
          <div className="flex flex-1 gap-6">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2 bg-purple-100">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </Avatar>
                    <CardTitle>AI Practice Assistant</CardTitle>
                  </div>
                </CardHeader>
                <AIChat className="flex-1" />
              </Card>
            </div>

            {/* Sidebar with context and suggestions */}
            <div className="hidden lg:block w-80">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Practice Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs defaultValue="pieces">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pieces">Current Pieces</TabsTrigger>
                        <TabsTrigger value="sessions">
                          Recent Sessions
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="pieces" className="space-y-4 mt-4">
                        {userPieces.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No current pieces in your repertoire
                          </p>
                        ) : (
                          userPieces.map((piece, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <Music className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">
                                  {piece.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {piece.composer}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>
                      <TabsContent value="sessions" className="space-y-4 mt-4">
                        {recentSessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No recent practice sessions
                          </p>
                        ) : (
                          recentSessions.map((session, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">
                                  {session.piece.title}
                                </p>
                                <div className="flex justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(session.created_at)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDuration(session.duration)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Suggested Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => useSuggestion(suggestion)}
                      >
                        <Lightbulb className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </Button>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() =>
                        setSuggestions([
                          "How do I improve my sight-reading?",
                          "What's a good warm-up routine for pianists?",
                          "Help me structure my practice time efficiently",
                          "Techniques for memorizing music more effectively",
                        ])
                      }
                    >
                      <RotateCcw className="h-3 w-3 mr-2" />
                      Refresh suggestions
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
