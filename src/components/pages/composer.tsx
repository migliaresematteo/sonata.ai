import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
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
import { Separator } from "@/components/ui/separator";
import { Music, Calendar, MapPin, Info, ArrowLeft } from "lucide-react";

interface Composer {
  id: string;
  name: string;
  birth_year: number;
  death_year: number | null;
  nationality: string;
  period: string;
  bio: string;
  image_url: string;
}

interface Piece {
  id: string;
  title: string;
  instrument: string;
  difficulty: number;
  period: string;
  genre: string;
  description: string;
}

export default function ComposerPage() {
  const { id } = useParams<{ id: string }>();
  const [composer, setComposer] = useState<Composer | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComposer = async () => {
      setLoading(true);
      try {
        // Fetch composer details
        const { data: composerData, error: composerError } = await supabase
          .from("composers")
          .select("*")
          .eq("id", id)
          .single();

        if (composerError) throw composerError;
        setComposer(composerData);

        // Fetch pieces by this composer
        const { data: piecesData, error: piecesError } = await supabase
          .from("pieces")
          .select(
            "id, title, instrument, difficulty, period, genre, description",
          )
          .eq("composer_id", id);

        if (piecesError) throw piecesError;
        setPieces(piecesData || []);
      } catch (error) {
        console.error("Error fetching composer data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchComposer();
    }
  }, [id]);

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

  const getLifespan = () => {
    if (!composer) return "";
    return composer.death_year
      ? `${composer.birth_year} - ${composer.death_year}`
      : `b. ${composer.birth_year}`;
  };

  // Get trending pieces (for now, just the most difficult ones)
  const trendingPieces = [...pieces]
    .sort((a, b) => b.difficulty - a.difficulty)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Discover" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading composer information...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!composer) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Discover" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Composer Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The composer you're looking for doesn't exist or has been
                removed.
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Composer Profile */}
              <div className="md:col-span-1">
                <Card>
                  <div className="aspect-square w-full overflow-hidden">
                    <img
                      src={composer.image_url}
                      alt={composer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">{composer.name}</CardTitle>
                    <CardDescription>{getLifespan()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{composer.nationality}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{composer.period} Period</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Info className="h-4 w-4" /> Biography
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {composer.bio}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Composer Works */}
              <div className="md:col-span-2 space-y-6">
                {/* Trending Pieces */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trending Pieces</CardTitle>
                    <CardDescription>
                      Most popular works by {composer.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendingPieces.length > 0 ? (
                      <div className="space-y-4">
                        {trendingPieces.map((piece) => (
                          <div
                            key={piece.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                          >
                            <div>
                              <h3 className="font-medium">{piece.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {piece.instrument}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={getDifficultyColor(
                                    piece.difficulty,
                                  )}
                                >
                                  {getDifficultyLabel(piece.difficulty)}
                                </Badge>
                              </div>
                            </div>
                            <Button size="sm">
                              <Music className="mr-2 h-4 w-4" /> Add to
                              Repertoire
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No trending pieces available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* All Pieces */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Works</CardTitle>
                    <CardDescription>
                      Complete catalog of {composer.name}'s pieces
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pieces.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pieces.map((piece) => (
                          <Card key={piece.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">
                                  <Link
                                    to={`/pieces/${piece.id}`}
                                    className="hover:underline"
                                  >
                                    {piece.title}
                                  </Link>
                                </CardTitle>
                                <Badge
                                  variant="outline"
                                  className={getDifficultyColor(
                                    piece.difficulty,
                                  )}
                                >
                                  {getDifficultyLabel(piece.difficulty)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="secondary">
                                  {piece.instrument}
                                </Badge>
                                {piece.period && (
                                  <Badge variant="outline">
                                    {piece.period}
                                  </Badge>
                                )}
                                {piece.genre && (
                                  <Badge variant="outline">{piece.genre}</Badge>
                                )}
                              </div>
                              {piece.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {piece.description}
                                </p>
                              )}
                            </CardContent>
                            <div className="px-6 pb-4">
                              <Button size="sm" className="w-full">
                                <Music className="mr-2 h-4 w-4" /> Add to
                                Repertoire
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No pieces available
                      </p>
                    )}
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
