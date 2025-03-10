import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../../supabase/auth";
import {
  Music,
  Calendar,
  Clock,
  Info,
  ArrowLeft,
  Send,
  Sparkles,
  User,
  BookOpen,
  Play,
  Plus,
} from "lucide-react";

interface Piece {
  id: string;
  title: string;
  composer: string;
  composer_id: string;
  instrument: string;
  period: string;
  genre: string;
  difficulty: number;
  description: string;
  average_duration: number | null;
}

interface Composer {
  id: string;
  name: string;
  nationality: string;
  period: string;
  image_url: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function PiecePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [piece, setPiece] = useState<Piece | null>(null);
  const [composer, setComposer] = useState<Composer | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [inRepertoire, setInRepertoire] = useState(false);
  const [repertoireStatus, setRepertoireStatus] = useState<string | null>(null);
  const [practiceTips, setPracticeTips] = useState({
    technicalFocus: "",
    practiceSchedule: "",
    interpretation: "",
  });
  const [tipsLoading, setTipsLoading] = useState(false);

  useEffect(() => {
    const fetchPieceData = async () => {
      setLoading(true);
      try {
        // Fetch piece details
        const { data: pieceData, error: pieceError } = await supabase
          .from("pieces")
          .select("*")
          .eq("id", id)
          .single();

        if (pieceError) throw pieceError;
        setPiece(pieceData);

        // Fetch composer details if we have composer_id
        if (pieceData.composer_id) {
          const { data: composerData, error: composerError } = await supabase
            .from("composers")
            .select("id, name, nationality, period, image_url")
            .eq("id", pieceData.composer_id)
            .single();

          if (composerError) throw composerError;
          setComposer(composerData);
        }

        // Check if piece is in user's repertoire
        if (user) {
          const { data: userPieceData, error: userPieceError } = await supabase
            .from("user_pieces")
            .select("status")
            .eq("user_id", user.id)
            .eq("piece_id", id)
            .single();

          if (!userPieceError && userPieceData) {
            setInRepertoire(true);
            setRepertoireStatus(userPieceData.status);
          }
        }

        // Add initial AI message
        if (messages.length === 0) {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Welcome! I'm your AI assistant for ${pieceData.title} by ${pieceData.composer}. Ask me anything about this piece, its history, performance techniques, or learning strategies.`,
              timestamp: new Date(),
            },
          ]);
        }

        // Fetch AI practice tips
        fetchPracticeTips(pieceData);
      } catch (error) {
        console.error("Error fetching piece data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPieceData();
    }
  }, [id, user, messages.length]);

  const fetchPracticeTips = async (pieceData: Piece) => {
    setTipsLoading(true);
    try {
      // Call Supabase Edge Function for AI practice tips
      const { data, error } = await supabase.functions.invoke(
        "practice-tips-ai",
        {
          body: {
            pieceTitle: pieceData.title,
            composer: pieceData.composer,
            period: pieceData.period,
            instrument: pieceData.instrument,
            difficulty: pieceData.difficulty,
            genre: pieceData.genre,
            userId: user?.id,
          },
        },
      );

      if (error) throw error;

      if (data) {
        setPracticeTips({
          technicalFocus:
            data.technicalFocus ||
            getDefaultTechnicalFocus(pieceData.instrument),
          practiceSchedule:
            data.practiceSchedule ||
            "Divide the piece into sections and focus on one section per practice session. Spend 15-20 minutes on technical challenges, then work on musicality and expression.",
          interpretation:
            data.interpretation || getDefaultInterpretation(pieceData.period),
        });
      }
    } catch (error) {
      console.error("Error getting AI practice tips:", error);
      // Set default practice tips
      setPracticeTips({
        technicalFocus: getDefaultTechnicalFocus(pieceData.instrument),
        practiceSchedule:
          "Divide the piece into sections and focus on one section per practice session. Spend 15-20 minutes on technical challenges, then work on musicality and expression.",
        interpretation: getDefaultInterpretation(pieceData.period),
      });
    } finally {
      setTipsLoading(false);
    }
  };

  // Default technical focus based on instrument
  const getDefaultTechnicalFocus = (instrument: string): string => {
    if (instrument.toLowerCase().includes("piano")) {
      return "Focus on hand independence and voicing. Pay attention to pedaling, especially in legato passages.";
    } else if (instrument.toLowerCase().includes("violin")) {
      return "Work on intonation and bow control. Practice string crossings slowly and use open strings to check your pitch.";
    } else {
      return "Break down difficult passages and practice them slowly. Focus on tone production and articulation.";
    }
  };

  // Default interpretation based on period
  const getDefaultInterpretation = (period?: string): string => {
    if (period === "Baroque") {
      return "Focus on clear articulation and limited use of pedal or vibrato. Pay attention to ornaments and consider the dance-like qualities of the music.";
    } else if (period === "Classical") {
      return "Aim for clarity, balanced phrasing, and controlled dynamics. Observe the structural elements and highlight the thematic development.";
    } else if (period === "Romantic") {
      return "Express emotion through rubato and dynamic contrast. Focus on the singing quality of the melodic lines and the rich harmonic colors.";
    } else {
      return "Balance authenticity with your personal artistic voice. Research performance practices of the period while bringing your own interpretation.";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !piece) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setChatLoading(true);

    try {
      // In a real implementation, you would call an AI API with context about the piece
      // For now, we'll simulate a response
      setTimeout(() => {
        const aiResponse = simulateAIResponse(input, piece, composer);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setChatLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addToRepertoire = async (status: string) => {
    if (!user || !piece) return;

    try {
      if (inRepertoire) {
        // Update existing entry
        const { error } = await supabase
          .from("user_pieces")
          .update({
            status,
            progress:
              status === "mastered" ? 100 : status === "current" ? 0 : 0,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("piece_id", piece.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase.from("user_pieces").insert({
          user_id: user.id,
          piece_id: piece.id,
          status,
          progress: status === "mastered" ? 100 : 0,
          started_at: new Date().toISOString(),
        });

        if (error) throw error;
        setInRepertoire(true);
      }

      setRepertoireStatus(status);
      alert(
        `Piece ${inRepertoire ? "updated in" : "added to"} your ${status} list!`,
      );
    } catch (error) {
      console.error("Error updating repertoire:", error);
      alert("Failed to update repertoire");
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return "Beginner";
    if (difficulty <= 7) return "Intermediate";
    return "Advanced";
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return "bg-green-100 text-green-800";
    if (difficulty <= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Unknown";

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  // Simulate AI response for testing
  const simulateAIResponse = (
    userInput: string,
    piece: Piece,
    composer: Composer | null,
  ) => {
    const pieceContext = `${piece.title} by ${piece.composer}`;
    const composerInfo = composer
      ? `${composer.name} was a ${composer.nationality} composer from the ${composer.period} period.`
      : "";

    // Simple keyword matching for more relevant responses
    if (
      userInput.toLowerCase().includes("difficult") ||
      userInput.toLowerCase().includes("hard")
    ) {
      return `${piece.title} is considered a ${getDifficultyLabel(piece.difficulty).toLowerCase()} level piece. ${piece.difficulty <= 3 ? "It's suitable for beginners with some experience." : piece.difficulty <= 7 ? "It requires intermediate technical skills." : "It's quite challenging and requires advanced technique."} When practicing, break it down into smaller sections and work on them separately before combining.`;
    } else if (
      userInput.toLowerCase().includes("technique") ||
      userInput.toLowerCase().includes("practice")
    ) {
      if (piece.instrument.toLowerCase().includes("piano")) {
        return `For ${pieceContext}, focus on hand independence and voicing. Practice hands separately first, then slowly combine. Pay attention to the pedaling, especially in legato passages. Use a metronome to maintain steady rhythm.`;
      } else if (piece.instrument.toLowerCase().includes("violin")) {
        return `When practicing ${pieceContext}, pay special attention to intonation and bow control. Work on string crossings slowly, and use open strings to check your pitch. Focus on producing a clean, resonant tone.`;
      } else {
        return `To practice ${pieceContext} effectively, break it into smaller sections and work on the challenging parts at a slower tempo. Gradually increase the speed as you become more comfortable. Record yourself to identify areas that need improvement.`;
      }
    } else if (
      userInput.toLowerCase().includes("history") ||
      userInput.toLowerCase().includes("background")
    ) {
      return `${pieceContext} was composed during the ${piece.period} period. ${composerInfo} This piece is known for its ${piece.genre ? piece.genre.toLowerCase() : "distinctive"} style and has become a staple in the ${piece.instrument} repertoire. ${piece.description || ""}`;
    } else if (
      userInput.toLowerCase().includes("interpret") ||
      userInput.toLowerCase().includes("perform")
    ) {
      return `When interpreting ${pieceContext}, consider the ${piece.period} performance practices. ${piece.period === "Baroque" ? "Focus on clear articulation and limited use of pedal or vibrato." : piece.period === "Classical" ? "Aim for clarity, balanced phrasing, and controlled dynamics." : piece.period === "Romantic" ? "Express emotion through rubato and dynamic contrast." : "Balance authenticity with your personal artistic voice."} Listen to recordings by different performers to develop your own interpretation.`;
    }

    // Generic responses
    const genericResponses = [
      `${pieceContext} is a beautiful work from the ${piece.period} period. It showcases ${piece.composer}'s characteristic style with its ${piece.genre || "unique"} elements.`,
      `When learning ${pieceContext}, start by analyzing its structure and identifying recurring themes and patterns. This will help you understand the piece better and memorize it more effectively.`,
      `${pieceContext} features interesting ${piece.genre || "musical"} elements that make it both challenging and rewarding to play. The ${piece.difficulty <= 3 ? "accessible" : piece.difficulty <= 7 ? "moderate" : "complex"} technical requirements include ${piece.instrument === "Piano" ? "hand coordination and expressive phrasing" : "precise articulation and dynamic control"}.`,
      `To master ${pieceContext}, regular, focused practice is key. Spend time on the difficult passages, but also work on connecting sections smoothly to maintain the musical flow.`,
      `${composerInfo} ${piece.title} exemplifies many characteristics of ${piece.composer}'s compositional style, including ${piece.period === "Baroque" ? "contrapuntal textures and ornamental details" : piece.period === "Classical" ? "balanced phrases and clear structures" : piece.period === "Romantic" ? "emotional expressivity and rich harmonies" : "innovative techniques and unique sonorities"}.`,
    ];

    return genericResponses[
      Math.floor(Math.random() * genericResponses.length)
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Discover" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading piece information...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!piece) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Discover" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Piece Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The piece you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link to="/discover">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Discover
                </Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Discover" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Button variant="outline" asChild>
                <Link to="/discover">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Discover
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Piece Information */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">
                          {piece.title}
                        </CardTitle>
                        <CardDescription className="text-lg">
                          by{" "}
                          {composer ? (
                            <Link
                              to={`/composers/${composer.id}`}
                              className="hover:underline text-primary"
                            >
                              {piece.composer}
                            </Link>
                          ) : (
                            piece.composer
                          )}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(piece.difficulty)}
                      >
                        {getDifficultyLabel(piece.difficulty)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{piece.instrument}</Badge>
                      {piece.period && (
                        <Badge variant="outline">{piece.period}</Badge>
                      )}
                      {piece.genre && (
                        <Badge variant="outline">{piece.genre}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Duration: {formatDuration(piece.average_duration)}
                        </span>
                      </div>
                      {composer && (
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Composer: {composer.nationality}, {composer.period}{" "}
                            period
                          </span>
                        </div>
                      )}
                    </div>

                    {piece.description && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          About this piece
                        </h3>
                        <p className="text-muted-foreground">
                          {piece.description}
                        </p>
                      </div>
                    )}

                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-4">
                        Add to your repertoire
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => addToRepertoire("current")}
                          variant={
                            repertoireStatus === "current"
                              ? "default"
                              : "outline"
                          }
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" />
                          {repertoireStatus === "current"
                            ? "Currently Learning"
                            : "Add to Current"}
                        </Button>
                        <Button
                          onClick={() => addToRepertoire("wishlist")}
                          variant={
                            repertoireStatus === "wishlist"
                              ? "default"
                              : "outline"
                          }
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {repertoireStatus === "wishlist"
                            ? "In Wishlist"
                            : "Add to Wishlist"}
                        </Button>
                        <Button
                          onClick={() => addToRepertoire("mastered")}
                          variant={
                            repertoireStatus === "mastered"
                              ? "default"
                              : "outline"
                          }
                          className="gap-2"
                        >
                          <BookOpen className="h-4 w-4" />
                          {repertoireStatus === "mastered"
                            ? "Mastered"
                            : "Mark as Mastered"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Practice Tips */}
                <Card className="mt-6">
                  <CardHeader className="flex justify-between items-start">
                    <CardTitle>Practice Tips</CardTitle>
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800"
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> AI Generated
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tipsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="flex space-x-2 items-center">
                            <div
                              className="w-3 h-3 rounded-full bg-purple-500 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-3 h-3 rounded-full bg-purple-500 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-3 h-3 rounded-full bg-purple-500 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-muted rounded-lg">
                            <h3 className="font-medium flex items-center gap-2 mb-2">
                              <Music className="h-4 w-4" /> Technical Focus
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {practiceTips.technicalFocus}
                            </p>
                          </div>

                          <div className="p-4 bg-muted rounded-lg">
                            <h3 className="font-medium flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4" /> Practice Schedule
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {practiceTips.practiceSchedule}
                            </p>
                          </div>

                          <div className="p-4 bg-muted rounded-lg">
                            <h3 className="font-medium flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4" /> Interpretation
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {practiceTips.interpretation}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Chat */}
              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI Practice Assistant
                    </CardTitle>
                    <CardDescription>
                      Ask questions about {piece.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto space-y-4 mb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className="flex items-start max-w-[90%] gap-2">
                            {message.role === "assistant" && (
                              <Avatar className="h-8 w-8 mt-1 bg-purple-100">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                              </Avatar>
                            )}
                            <div
                              className={`rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                            >
                              <p className="whitespace-pre-wrap text-sm">
                                {message.content}
                              </p>
                              <div
                                className={`text-xs mt-1 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                              >
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            {message.role === "user" && (
                              <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage
                                  src={
                                    user
                                      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                                      : undefined
                                  }
                                  alt="User"
                                />
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="flex items-start max-w-[90%] gap-2">
                            <Avatar className="h-8 w-8 mt-1 bg-purple-100">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            </Avatar>
                            <div className="rounded-lg p-4 bg-muted">
                              <div className="flex space-x-2 items-center">
                                <div
                                  className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                />
                                <div
                                  className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                />
                                <div
                                  className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Textarea
                          placeholder={`Ask about ${piece.title}, techniques, or practice tips...`}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="flex-1 min-h-[60px] resize-none"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!input.trim() || chatLoading}
                          size="icon"
                          className="h-[60px] w-[60px] rounded-full bg-primary"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
