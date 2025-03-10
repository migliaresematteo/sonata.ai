import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Music, Plus } from "lucide-react";

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

export default function RepertoirePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPieces, setCurrentPieces] = useState<UserPiece[]>([]);
  const [masteredPieces, setMasteredPieces] = useState<UserPiece[]>([]);
  const [wishlistPieces, setWishlistPieces] = useState<UserPiece[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchRepertoire = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
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

        if (error) throw error;

        // Sort pieces by status
        const current = data?.filter((p) => p.status === "current") || [];
        const mastered = data?.filter((p) => p.status === "mastered") || [];
        const wishlist = data?.filter((p) => p.status === "wishlist") || [];

        setCurrentPieces(current);
        setMasteredPieces(mastered);
        setWishlistPieces(wishlist);
      } catch (error) {
        console.error("Error fetching repertoire:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepertoire();
  }, [user, navigate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return "Beginner";
    if (difficulty <= 7) return "Intermediate";
    return "Advanced";
  };

  const renderPieceTable = (pieces: UserPiece[], status: string) => {
    if (pieces.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No {status} pieces in your repertoire yet.
          </p>
          <Button className="mt-4" onClick={() => navigate("/discover")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Pieces
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Composer</th>
              <th className="text-left py-3 px-4">Title</th>
              {status === "current" && (
                <th className="text-left py-3 px-4">Progress</th>
              )}
              <th className="text-left py-3 px-4">Difficulty</th>
              <th className="text-left py-3 px-4">
                {status === "mastered" ? "Mastered Date" : "Started Date"}
              </th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((piece) => (
              <tr key={piece.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">{piece.piece.composer}</td>
                <td className="py-3 px-4">
                  <Link
                    to={`/pieces/${piece.piece.id}`}
                    className="hover:underline text-primary"
                  >
                    {piece.piece.title}
                  </Link>
                </td>
                {status === "current" && (
                  <td className="py-3 px-4 w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={piece.progress} className="h-2" />
                      <span className="text-sm">{piece.progress}%</span>
                    </div>
                  </td>
                )}
                <td className="py-3 px-4">
                  <Badge variant="outline">
                    {getDifficultyLabel(piece.piece.difficulty)}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  {formatDate(
                    status === "mastered" && piece.mastered_at
                      ? piece.mastered_at
                      : piece.started_at,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Repertoire" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading repertoire...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Repertoire" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold">My Repertoire</h1>
                <p className="text-muted-foreground">
                  Manage your current, mastered, and wishlist pieces
                </p>
              </div>
              <Button onClick={() => navigate("/discover")}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Piece
              </Button>
            </div>

            <Tabs defaultValue="current" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger
                  value="current"
                  className="flex items-center gap-2"
                >
                  <Music className="h-4 w-4" />
                  Current ({currentPieces.length})
                </TabsTrigger>
                <TabsTrigger
                  value="mastered"
                  className="flex items-center gap-2"
                >
                  <Music className="h-4 w-4" />
                  Mastered ({masteredPieces.length})
                </TabsTrigger>
                <TabsTrigger
                  value="wishlist"
                  className="flex items-center gap-2"
                >
                  <Music className="h-4 w-4" />
                  Wishlist ({wishlistPieces.length})
                </TabsTrigger>
              </TabsList>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {
                      {
                        current: "Current Repertoire",
                        mastered: "Mastered Pieces",
                        wishlist: "Wishlist",
                      }["current"]
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TabsContent value="current" className="mt-0">
                    {renderPieceTable(currentPieces, "current")}
                  </TabsContent>
                  <TabsContent value="mastered" className="mt-0">
                    {renderPieceTable(masteredPieces, "mastered")}
                  </TabsContent>
                  <TabsContent value="wishlist" className="mt-0">
                    {renderPieceTable(wishlistPieces, "wishlist")}
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
